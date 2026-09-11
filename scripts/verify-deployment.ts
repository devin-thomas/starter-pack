import { lookup } from "node:dns/promises";
import { createHash } from "node:crypto";
import brandManifest from "../public/icons/brands/manifest.json";
import interfaceManifest from "../public/icons/interface/manifest.json";
import { assertGoogleResourceAccess } from "./crawler-policy";
import { readFile } from "node:fs/promises";
import { validCatalog } from "../src/workbench/model";
import { parseRegistry } from "../src/workbench/registry";

const base = new URL(process.argv[2] || "https://starter.devthomas.site");
const local = process.argv.includes("--local");
if (local && (base.protocol !== "http:" || base.hostname !== "127.0.0.1")) throw new Error("Local verification requires an explicit HTTP loopback URL.");
if (!local && base.protocol !== "https:")
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
    const expectedPacket = await readFile("dist/agent/phase-1-packet.txt", "utf8");
    const packetHash = createHash("sha256").update(expectedPacket).digest("hex").slice(0, 16);
    const expectedUrl = `https://raw.githubusercontent.com/devin-thomas/starter-pack/main/public/agent/packets/phase-1-${packetHash}.md`;
    if (catalog.bootstrap !== expectedUrl || (!local && await read(expectedUrl, /text\/plain/) !== expectedPacket))
      throw new Error("GitHub startup packet is missing or differs from this release.");
  }),
]);
const start = await read("/agent/start.md", /text\/plain/);
assertGoogleResourceAccess(await read("/robots.txt", /text\/plain/));
const packet = await read("/agent/phase-1-packet.txt", /text\/plain/);
if (packet !== await readFile("dist/agent/phase-1-packet.txt", "utf8")) throw new Error("Instruction packet differs from the built curriculum.");
for (const route of ["/prompts/get-started.txt", "/agent/start.md", "/agent/resource-links.md", "/skills/starter-pack/current/SKILL.md"])
  if (await read(route, /text\/plain/) !== await readFile(`dist${route}`, "utf8")) throw new Error(`Live startup instructions differ: ${route}`);
for (const route of ["/phases/1.md", "/phases/2.md", "/artifacts/progress/README.md", "/artifacts/progress-workbench/README.md", "/skills/computer-setup/current/SKILL.md", "/skills/quick-build/current/SKILL.md", "/setup/file-transfer.md", "/setup/authentication.md", "/setup/private-workbench.md", "/setup/tool-troubleshooting.md"])
  if (await read(route, /text\/plain/) !== await readFile(`dist${route}`, "utf8")) throw new Error(`Live instructions differ: ${route}`);
const requirementsBody = await read("/agent/requirements.json", /application\/json/);
if (requirementsBody !== await readFile("dist/agent/requirements.json", "utf8")) throw new Error("Live requirements differ from this build.");
const requirements = parseRegistry(JSON.parse(requirementsBody));
for (const route of ["/schemas/requirements.schema.json", "/schemas/starter-progress.schema.json", "/setup/computer-setup.manifest.json", "/skills/versions.json"])
  if (await read(route, /application\/json/) !== await readFile(`dist${route}`, "utf8")) throw new Error(`Live contract differs: ${route}`);
if (!start.includes("Starter Pack skill"))
  throw new Error("The agent start resource is missing.");
const workbenchManifest = JSON.parse(await read("/artifacts/progress-workbench/manifest.json", /application\/json/));
if (JSON.stringify(workbenchManifest) !== JSON.stringify(JSON.parse(await readFile("dist/artifacts/progress-workbench/manifest.json", "utf8"))) || workbenchManifest.requirements_revision !== requirements.requirements_revision)
  throw new Error("Workbench manifest differs from this release or requirements revision.");
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
const labels = await workbenchCatalog.text();
if (labels !== await readFile("dist/artifacts/progress-workbench/catalog.json", "utf8") || !validCatalog(JSON.parse(labels))) throw new Error("Live Workbench catalog differs or is invalid.");
for (const route of ["/.git/config", "/.env", "/reports/", "/starter-progress.json", "/starter-pack-next-build/00-HANDOFF.md", "/BUILD_HANDOFF.md"]) {
  const response = await fetch(new URL(route, base), { redirect: "manual", signal: AbortSignal.timeout(15_000) });
  if (response.status !== 404) throw new Error(`Private-path denial failed: ${route} returned ${response.status}`);
}
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
  `Verified ${base.origin}: ${local ? "local HTTP asset routing (not deployment; GitHub packet fetch skipped)" : "normal DNS, HTTPS and GitHub packet"}, rendered homepage, JS/CSS, exact current skills/setup/schema/requirements resources, Google learner-resource robots policy, exact startup packet and prompts, all 35 icon hashes, exact Workbench download bytes, catalog CORS, and six private-path denials. Provider-app acceptance is separate.`,
);
