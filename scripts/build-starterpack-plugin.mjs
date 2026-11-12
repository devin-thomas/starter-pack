#!/usr/bin/env node
// Maintainer-only, offline, reviewed source import for the Claude Code plugin.
// Never executed during plugin installation.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const policy = json("scripts/starterpack-sources.json");
const plugin = json(".claude-plugin/plugin.json");
const catalog = json("content/skills/manifest.json").skills.filter(s => s.public && !s.recommendationOnly && s.id !== "cappy");
// The course serves these reusable skills at /skills/<id>/current/; the bundle must match them byte for byte.
const hostedReusable = ["grill-to-build", "quick-build"];
const arg = (flag) => {
  const index = process.argv.indexOf(flag);
  assert.ok(index >= 0 && process.argv[index + 1], "Missing " + flag);
  return resolve(process.argv[index + 1]);
};
const git = (path, ...args) => execFileSync("git", ["-C", path, ...args], { encoding: "utf8" }).trim();
const safe = (path) => {
  assert.ok(path && !path.startsWith("/") && !path.replaceAll("\\", "/").split("/").includes(".."), "unsafe source path");
  return path;
};
function noLinks(dir) {
  assert.ok(lstatSync(dir).isDirectory(), "expected directory: " + dir);
  for (const node of readdirSync(dir)) {
    const path = join(dir, node);
    const stat = lstatSync(path);
    assert.ok(!stat.isSymbolicLink() && (stat.isDirectory() || stat.isFile()), "unsafe source entry: " + path);
    if (stat.isDirectory()) noLinks(path);
  }
}
function allFiles(dir, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = prefix ? prefix + "/" + entry.name : entry.name;
    assert.ok(entry.isDirectory() || entry.isFile(), "unsafe bundled file: " + path);
    return entry.isDirectory() ? allFiles(join(dir, entry.name), path) : [path];
  }).sort();
}
const blobSha = bytes => createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex");
// Bundled skills are copied unmodified: no routing notices or other adaptations.
function importSkill(id, from, to, source, revision) {
  noLinks(from);
  assert.ok(existsSync(join(from, "SKILL.md")), "source SKILL.md missing: " + id);
  cpSync(from, to, { recursive: true, dereference: false });
  const text = readFileSync(join(to, "SKILL.md"), "utf8");
  const name = text.match(/^name:\s*(\S+)\s*$/m)?.[1] ?? id;
  assert.equal(name, id, "skill name collision: " + id + " versus " + name);
  return {
    id, source, revision,
    files: allFiles(to).map(path => {
      return { path, gitBlobSha: blobSha(readFileSync(join(to, path))) };
    }),
  };
}
assert.equal(plugin.name, "starterpack");
assert.equal(plugin.version, policy.pluginVersion);
assert.equal(catalog.length, 20, "unexpected public package skill count");
assert.equal(catalog.length, policy.publicSkillsCount);
const allIds = catalog.map(s => s.id);
assert.equal(new Set(allIds).size, 20, "duplicate skill identity");
assert.equal(plugin.skills, undefined, "use native skills/ discovery to avoid duplicates");
assert.deepEqual(new Set(plugin.metadata.bundledSkillIds), new Set(allIds));
const sources = {
  "devin-thomas/skills": arg("--skills-repo"),
  "devin-thomas/vid-chopper": arg("--vidchopper-repo"),
};
for (const [name, checkout] of Object.entries(sources)) {
  assert.equal(git(checkout, "rev-parse", "HEAD"), policy.sources[name].commit, "unreviewed source revision: " + name);
  assert.equal(git(checkout, "status", "--porcelain"), "", "dirty source checkout: " + name);
}
const scratch = mkdtempSync(join(root, ".starterpack-build-"));
const output = join(scratch, "skills");
mkdirSync(output);
const records = [];
try {
  for (const skill of catalog) {
    const id = skill.id;
    let from, source, revision;
    if (id === "starter-pack" || id === "computer-setup") {
      source = "devin-thomas/starter-pack";
      from = join(root, "public", "skills", id, "current");
      revision = "local-current";
    } else {
      source = skill.sourceRepo;
      assert.ok(sources[source], "unreviewed source: " + id);
      from = join(sources[source], safe(dirname(skill.sourcePath)));
      revision = policy.sources[source].commit;
    }
    const record = importSkill(id, from, join(output, id), source, revision);
    if (hostedReusable.includes(id)) {
      const hosted = join(root, "public", "skills", id, "current");
      const served = allFiles(hosted).map(path => ({ path, gitBlobSha: blobSha(readFileSync(join(hosted, path))) }));
      assert.deepEqual(record.files, served, "bundled " + id + " differs from /skills/" + id + "/current/; import the same pinned commit into both");
    }
    records.push(record);
  }
  assert.equal(records.length, 20);
  const lock = { schemaVersion: 1, plugin: "starterpack", version: plugin.version, skills: records };
  writeFileSync(join(scratch, "starterpack.lock.json"), JSON.stringify(lock, null, 2) + "\n");
  const final = join(root, "skills");
  const backup = join(root, ".starterpack-previous-skills");
  assert.ok(!existsSync(backup), "previous backup not cleared");
  if (existsSync(final)) renameSync(final, backup);
  try { renameSync(output, final); }
  catch (error) {
    if (existsSync(backup)) renameSync(backup, final);
    throw error;
  }
  renameSync(join(scratch, "starterpack.lock.json"), join(root, "starterpack.lock.json"));
  if (existsSync(backup)) rmSync(backup, { recursive: true, force: true });
  console.log("Prepared starterpack: 20 public skills, copied unmodified. Review and commit the generated tree before publication.");
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
