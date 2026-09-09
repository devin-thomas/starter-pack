import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, ".generated/agent-mirror");
const packetRoute = "/agent/phase-1-packet.txt";
const origin = "https://starter-pack-agent.vercel.app";
const project = "starter-pack-agent";
const scope = "devint";
const mode = process.argv[2] || "--prepare";
if (!["--prepare", "--deploy", "--verify"].includes(mode)) {
  throw new Error("Use --prepare, --deploy, or --verify.");
}

const packet = await readFile(path.join(root, "dist", packetRoute));
if (packet.length < 1_000 || !packet.toString("utf8").includes("Starter Pack")) {
  throw new Error("Build the complete canonical Phase 1 packet before preparing its mirror.");
}
const sha256 = createHash("sha256").update(packet).digest("hex");
const manifest = {
  canonical: `https://starter.devthomas.site${packetRoute}`,
  mirror: `${origin}${packetRoute}`,
  sha256,
  bytes: packet.length,
  generatedAt: new Date().toISOString(),
};

if (mode !== "--verify") {
  await mkdir(path.join(directory, "agent"), { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, packetRoute), packet),
    writeFile(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(directory, "robots.txt"), "User-agent: *\nAllow: /\n"),
    writeFile(path.join(directory, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Starter Pack instruction packet</title></head>
<body><main><h1>Starter Pack instruction packet</h1><p>A plain-text copy of the public Phase 1 instructions for readers that cannot fetch the main site.</p><p><a href="${packetRoute}">Read the Phase 1 packet</a></p><p><a href="https://starter.devthomas.site">Open the canonical Starter Pack site</a></p><p><a href="/manifest.json">Packet integrity record</a></p></main></body></html>\n`),
    writeFile(path.join(directory, ".vercelignore"), "/*\n!agent\n!agent/phase-1-packet.txt\n!index.html\n!manifest.json\n!robots.txt\n!vercel.json\n**/.git/\n**/.env*\n"),
    writeFile(path.join(directory, "vercel.json"), `${JSON.stringify({
      version: 2,
      framework: null,
      headers: [
        { source: packetRoute, headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate, no-transform" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ] },
      ],
    }, null, 2)}\n`),
  ]);
  console.log(`Prepared ${packet.length} bytes; SHA-256 ${sha256}.`);
}

// Deployment is intentionally isolated from the Cloudflare site and its credentials.
function vercel(args: string[], capture = false) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("Run this script through npx tsx so npm's CLI path is available.");
  const result = spawnSync(process.execPath, [
    npmCli, "exec", "--yes", "--package=vercel@59.14.0", "--", "vercel", ...args,
  ], { cwd: directory, encoding: "utf8", stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Vercel ${args[0]} failed (exit ${result.status}).`);
  return result.stdout?.trim() || "";
}

if (mode === "--deploy") {
  const link = JSON.parse(await readFile(path.join(directory, ".vercel/project.json"), "utf8"));
  if (link.projectName !== project || typeof link.projectId !== "string" || typeof link.orgId !== "string") {
    throw new Error(`Link only ${scope}/${project} inside .generated/agent-mirror before deploying.`);
  }
  if (vercel(["whoami"], true) !== "devin-thomas") {
    throw new Error("The mirror must deploy through the authenticated devin-thomas account.");
  }
  const expectedRoot = new Set(["agent", "index.html", "manifest.json", "robots.txt", "vercel.json", ".vercelignore", ".vercel", ".env.local", ".gitignore"]);
  for (const entry of await readdir(directory)) {
    if (!expectedRoot.has(entry)) throw new Error(`Unexpected mirror staging entry: ${entry}`);
  }
  const agentFiles = await readdir(path.join(directory, "agent"));
  if (agentFiles.length !== 1 || agentFiles[0] !== "phase-1-packet.txt") {
    throw new Error("The mirror's agent directory must contain only the public packet.");
  }
  vercel(["deploy", "--prod", "--yes", "--scope", scope]);
}

if (mode !== "--prepare") {
  async function get(route: string) {
    for (let attempt = 0; ; attempt += 1) {
      const response = await fetch(new URL(route, origin), { redirect: "manual", signal: AbortSignal.timeout(20_000) });
      if (mode !== "--deploy" || route !== packetRoute || response.status !== 404 || attempt >= 5) return response;
      await response.body?.cancel();
      console.log("Waiting for the new production alias to serve its packet...");
      await delay(2_000);
    }
  }
  const response = await get(packetRoute);
  if (response.status !== 200 || !/^text\/plain\s*;\s*charset=utf-8$/i.test(response.headers.get("content-type") || "") || !response.headers.get("cache-control")?.includes("no-transform")) {
    throw new Error(`Mirror packet must return unauthenticated HTTP 200, UTF-8 plain text and no-transform; got ${response.status}.`);
  }
  const livePacket = Buffer.from(await response.arrayBuffer());
  if (!livePacket.equals(packet)) throw new Error("The live mirror differs from the current built packet.");
  const integrityResponse = await get("/manifest.json");
  if (integrityResponse.status !== 200) throw new Error("Mirror integrity manifest is unavailable.");
  const integrity = await integrityResponse.json();
  if (integrity.sha256 !== sha256 || integrity.bytes !== packet.length || integrity.canonical !== manifest.canonical || integrity.mirror !== manifest.mirror) {
    throw new Error("Mirror integrity manifest does not match the current canonical packet.");
  }
  const index = await get("/");
  if (index.status !== 200 || !(await index.text()).includes(`href="${packetRoute}"`)) throw new Error("Mirror index is unavailable or lacks the packet link.");
  const robots = await get("/robots.txt");
  if (robots.status !== 200 || (await robots.text()).trim() !== "User-agent: *\nAllow: /") throw new Error("Mirror robots policy is not the intended public allowance.");
  const excluded = ["/.env.local", "/.vercel/project.json", "/.git/config", "/package.json", "/starter-progress.json", "/agent/start.md", "/skills/starter-pack/current/SKILL.md"];
  for (const route of excluded) {
    const result = await get(route);
    if (result.status !== 404) throw new Error(`Excluded mirror path ${route} returned ${result.status}.`);
  }
  console.log(`Verified ${origin}${packetRoute}: ${packet.length} exact bytes, SHA-256 ${sha256}, plain text/no-transform, manifest/index/robots, and ${excluded.length} excluded paths. Gemini acceptance is separate.`);
}
