import { lookup } from "node:dns/promises";
import { createHash } from "node:crypto";
import brandManifest from "../public/icons/brands/manifest.json";
import interfaceManifest from "../public/icons/interface/manifest.json";
import { assertGoogleResourceAccess } from "./crawler-policy";
import { readFile } from "node:fs/promises";

const base = new URL(process.argv[2] || "https://starter.devthomas.site");
if (base.protocol !== "https:")
  throw new Error("Deployment verification requires HTTPS.");

// Use the same system resolver as ordinary clients; an IP override cannot prove reachability.
try {
  await lookup(base.hostname);
} catch (error) {
  throw new Error(
    `${base.hostname} does not resolve through this computer's normal DNS. Deployment is not verified.`,
    { cause: error },
  );
}

async function readBytes(route: string, expectedType: RegExp) {
  const url = new URL(route, base);
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  if (!expectedType.test(response.headers.get("content-type") || "")) {
    throw new Error(
      `${url}: unexpected content type ${response.headers.get("content-type")}`,
    );
  }
  const body = Buffer.from(await response.arrayBuffer());
  if (!body.length) throw new Error(`${url}: empty response`);
  return body;
}

async function read(route: string, expectedType: RegExp) {
  const body = (await readBytes(route, expectedType)).toString("utf8");
  if (!body.trim()) throw new Error(`${route}: empty text response`);
  return body;
}

const html = await read("/", /text\/html/);
if (!html.includes('id="site-data"') || !html.includes("Your first build")) {
  throw new Error("The response is not the rendered Starter Pack homepage.");
}
const script = html.match(/<script\b[^>]*\bsrc="([^\"]+\.js)"/);
const stylesheet = html.match(/<link\b[^>]*\bhref="([^\"]+\.css)"/);
if (!script || !stylesheet)
  throw new Error("The homepage is missing its application assets.");
await Promise.all([
  read(script[1], /javascript/),
  read(stylesheet[1], /text\/css/),
  read("/agent/catalog.json", /application\/json/).then(async (body) => {
    if (body !== await readFile("dist/agent/catalog.json", "utf8"))
      throw new Error("Live agent catalog differs from this build; it may be stale or from another release.");
    const catalog = JSON.parse(body);
    if (!Array.isArray(catalog.resources) || catalog.resources.length < 3)
      throw new Error("Agent catalog is incomplete.");
  }),
]);
const start = await read("/agent/start.md", /text\/plain/);
assertGoogleResourceAccess(await read("/robots.txt", /text\/plain/));
const packet = await read("/agent/phase-1-packet.txt", /text\/plain/);
if (packet !== await readFile("dist/agent/phase-1-packet.txt", "utf8")) throw new Error("Instruction packet differs from the built curriculum.");
for (const route of ["/prompts/get-started.txt", "/agent/start.md", "/agent/resource-links.md", "/skills/starter-pack/current/SKILL.md"])
  if (await read(route, /text\/plain/) !== await readFile(`dist${route}`, "utf8")) throw new Error(`Live startup instructions differ: ${route}`);
for (const route of ["/phases/1.md", "/artifacts/progress/README.md"])
  await read(route, /text\/plain/);
if (!start.includes("Starter Pack skill"))
  throw new Error("The agent start resource is missing.");
const workbenchManifest = JSON.parse(await read("/artifacts/progress-workbench/manifest.json", /application\/json/));
if (!/^[a-f0-9]{64}$/.test(workbenchManifest.sha256) || !Number.isSafeInteger(workbenchManifest.bytes) || workbenchManifest.bytes <= 0)
  throw new Error("Workbench integrity manifest is invalid.");
for (const route of ["/artifacts/progress-workbench/index.html", "/artifacts/progress-workbench/", "/artifacts/progress-workbench"]) {
  const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(15_000) });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/octet-stream") || !response.headers.get("content-disposition")?.includes('attachment; filename="index.html"'))
    throw new Error(`${route}: Workbench must be served as a file download.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== workbenchManifest.bytes || createHash("sha256").update(bytes).digest("hex") !== workbenchManifest.sha256)
    throw new Error(`${route}: Workbench download differs from its published integrity manifest.`);
}
const workbenchCatalog = await fetch(new URL("/artifacts/progress-workbench/catalog.json", base), { headers: { Origin: "http://127.0.0.1:8000" }, signal: AbortSignal.timeout(15_000) });
if (!workbenchCatalog.ok || workbenchCatalog.headers.get("access-control-allow-origin") !== "*")
  throw new Error("Workbench guide labels must support anonymous cross-origin reads.");
for (const [collection, manifest] of [
  ["brands", brandManifest],
  ["interface", interfaceManifest],
] as const) {
  await Promise.all(
    manifest.icons.map(async (icon) => {
      const route = `/icons/${collection}/${icon.file}`;
      const bytes = await readBytes(route, icon.file.endsWith(".png") ? /image\/png/ : /image\/svg\+xml/);
      if (createHash("sha256").update(bytes).digest("hex") !== icon.sha256) {
        throw new Error(
          `${route}: deployed icon differs from the source manifest`,
        );
      }
    }),
  );
}
console.log(
  `Verified ${base.origin}: normal DNS, HTTPS, rendered homepage, JS/CSS, agent resources, Google learner-resource robots policy, exact startup packet and prompts, all 35 icon hashes, exact Workbench download bytes, and catalog CORS. Provider-app acceptance is separate.`,
);
