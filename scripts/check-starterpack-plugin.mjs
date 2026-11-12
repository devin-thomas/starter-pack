#!/usr/bin/env node
// Offline starterpack Claude Code plugin contract check.
// --metadata-only checks the private candidate before maintainer source import.
// Full mode is a strict release gate and requires the generated skills payload.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(join(root, p));
const json = p => JSON.parse(read(p).toString("utf8"));
const plugin = json(".claude-plugin/plugin.json");
const marketplace = json(".claude-plugin/marketplace.json");
const mcp = json(".mcp.json");
const sources = json("scripts/starterpack-sources.json");
const catalog = json("content/skills/manifest.json").skills
  .filter(s => s.public === true && !s.recommendationOnly && s.id !== "cappy");
const expected = catalog.map(s => s.id).sort();
assert.equal(plugin.name, "starterpack");
assert.equal(marketplace.name, "starterpack");
assert.equal(marketplace.plugins.length, 1);
assert.equal(marketplace.plugins[0].name, "starterpack");
assert.equal(marketplace.plugins[0].source, "./");
assert.equal(plugin.version, sources.pluginVersion);
assert.equal(catalog.length, 20, "review public skills inventory before release");
assert.equal(plugin.skills, undefined, "default skills/ must not be declared twice");
assert.deepEqual([...plugin.metadata.bundledSkillIds].sort(), expected, "plugin skill coverage drift");
assert.equal(mcp.mcpServers.starterpack.type, "http", "remote MCP must specify HTTP transport");
assert.equal(mcp.mcpServers.starterpack.url, "https://starter.uppercut-labs.com/mcp");
const start = read("commands/start.md").toString("utf8");
assert.ok(!/phase2-/.test(start), "start command names a retired curriculum copy");
for (const needle of ["`grill-to-build`", "`quick-build`", "/phases/2/planning.md"])
  assert.ok(start.includes(needle), "start command must route Phase 2 planning through " + needle);
assert.ok(!/phase2-/.test(read("content/pages/guide.md").toString("utf8")), "guide names a retired curriculum copy");
assert.ok(read("content/pages/guide.md").toString("utf8").includes("starterpack@starterpack"));
if (process.argv.includes("--metadata-only")) {
  console.log("starterpack metadata validated: 20 public skills; bundle not yet certified.");
  process.exit(0);
}
const lock = json("starterpack.lock.json");
assert.equal(lock.schemaVersion, 1);
assert.equal(lock.plugin, "starterpack");
assert.equal(lock.version, plugin.version);
assert.deepEqual(lock.skills.map(s => s.id).sort(), expected);
const skillDir = join(root, "skills");
const actualDirs = readdirSync(skillDir, { withFileTypes: true });
assert.ok(actualDirs.every(d => d.isDirectory()), "unexpected entry in bundle");
assert.deepEqual(actualDirs.map(d => d.name).sort(), expected);
function walk(dir, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = prefix ? prefix + "/" + entry.name : entry.name;
    if (entry.isDirectory()) return walk(join(dir, entry.name), path);
    assert.ok(entry.isFile(), "nonregular file " + path);
    return [path];
  }).sort();
}
let checkedFiles = 0;
for (const record of lock.skills) {
  const base = join(skillDir, record.id);
  assert.ok(existsSync(join(base, "SKILL.md")), "missing skill instructions " + record.id);
  const skillText = readFileSync(join(base, "SKILL.md"), "utf8");
  const skillName = skillText.match(/^name:\s*(\S+)\s*$/m)?.[1];
  assert.equal(skillName, record.id, "colliding or missing skill frontmatter name: " + record.id);
  assert.deepEqual(walk(base), record.files.map(f => f.path).sort(), "missing/extra files in " + record.id);
  for (const file of record.files) {
    const bytes = readFileSync(join(base, file.path));
    const hash = createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex");
    assert.equal(hash, file.gitBlobSha, "unreviewed skill content changed: " + record.id + "/" + file.path);
    checkedFiles++;
  }
}
// One Grill to Build and one Quick Build: the bundled copies are exactly what the course serves.
for (const id of ["grill-to-build", "quick-build"]) {
  const hosted = join(root, "public", "skills", id, "current");
  assert.deepEqual(walk(join(skillDir, id)), walk(hosted), "bundled " + id + " file list differs from /skills/" + id + "/current/");
  for (const path of walk(hosted))
    assert.ok(readFileSync(join(skillDir, id, path)).equals(readFileSync(join(hosted, path))), "bundled " + id + "/" + path + " differs from /skills/" + id + "/current/");
}
// No bundled companion adaptation: the plugin ships the hosted companion and Computer Setup unchanged.
for (const id of ["starter-pack", "computer-setup"])
  assert.ok(read(join("skills", id, "SKILL.md")).equals(read(join("public", "skills", id, "current", "SKILL.md"))), "bundled " + id + " differs from its hosted current release");
console.log("starterpack release bundle validated: 20 native skills, " + checkedFiles + " locked files. Still run claude plugin validate and real learner QA.");
