import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { instructionPacket, startupPacketRelease } from "./content";

test("IDE routing is required and consistent with harness recommendations", async () => {
  const manifest = JSON.parse(await readFile("public/setup/computer-setup.manifest.json", "utf8"));
  const recommendations = JSON.parse(await readFile("content/recommendations.json", "utf8"));
  assert.deepEqual(manifest.ide.harness_to_ide, { antigravity: "antigravity", cursor: "cursor" });
  assert.equal(manifest.ide.default, "vscode");
  assert.equal(manifest.ide.select_from, "development_harness_not_phone_companion");
  assert.equal(manifest.ide.required, true);
  assert.ok(manifest.required_capabilities.some((item: { id: string }) => item.id === "selected-ide"));
  for (const item of recommendations.filter((item: { category: string }) => item.category === "harness")) {
    assert.equal(item.ide.id, manifest.ide.harness_to_ide[item.id] ?? manifest.ide.default);
    assert.equal(item.ide.agent_installs_and_configures, true);
  }
  assert.equal(await readFile(`public/skills/computer-setup/${manifest.skill_version}/SKILL.md`, "utf8"), await readFile("public/skills/computer-setup/current/SKILL.md", "utf8"));
});

test("startup packet contains Phase 1 state without another fetch and changes URL with content", async () => {
  const packet = await instructionPacket();
  const release = startupPacketRelease(packet);
  assert.notEqual(startupPacketRelease(packet + "\n").url, release.url);
  assert.equal(await readFile(release.file, "utf8"), packet);
  assert.ok(release.prompt.includes(release.url));
  assert.ok(release.prompt.split(/\s+/).length < 75);
  for (const section of ["## Companion instructions", "## Phase 1 guidance", "## Progress instructions", "## Empty progress template", "## Progress schema"])
    assert.ok(packet.includes(section), section);
  assert.ok(packet.includes("do not fetch the catalog or refetch these documents"));
  assert.doesNotMatch(packet, /\]\(\/(?!\/)|\b(?:href|src)="\/(?!\/)/);
});

test("catalog resource URLs reject relative paths", async () => {
  const ajv = new Ajv2020();
  addFormats(ajv);
  const schema = JSON.parse(await readFile("public/schemas/agent-catalog.schema.json", "utf8"));
  const validate = ajv.compile({ ...schema.$defs.resourceUrl });
  assert.equal(validate("https://starter.devthomas.site/artifacts/progress/starter-progress.json"), true);
  for (const url of ["/phases/1.md", "artifacts/progress/starter-progress.json", "https://starter.devthomas.site.evil.test/phases/1.md"])
    assert.equal(validate(url), false, url);
});

test("progress bootstrap exposes exact fallback URLs and existing GitHub files", async () => {
  const directory = await readFile("public/agent/resource-links.md", "utf8");
  const raw = "https://raw.githubusercontent.com/devin-thomas/starter-pack/main/";
  for (const path of ["artifacts/progress/starter-progress.json", "schemas/starter-progress.schema.json"]) {
    for (const prefix of ["https://starter.devthomas.site/", "https://starter-pack.uppercut-labs.workers.dev/", `${raw}public/`])
      assert.ok(directory.includes(`](${prefix}${path})`), `${prefix}${path}`);
  }
  const links = [...directory.matchAll(/\]\((https:\/\/raw\.githubusercontent\.com\/[^)]+)\)/g)];
  assert.ok(links.length > 10);
  for (const [, url] of links) {
    assert.ok(url.startsWith(raw));
    const path = url.slice(raw.length);
    assert.ok(!path.includes(".."));
    assert.ok((await stat(path)).isFile(), path);
  }
  for (const file of ["public/agent/start.md", "public/skills/starter-pack/current/SKILL.md"]) {
    const text = await readFile(file, "utf8");
    assert.ok(text.includes(`${raw}public/agent/resource-links.md`), file);
    assert.ok(text.includes("https://starter.devthomas.site/agent/resource-links.md"), file);
  }
});
