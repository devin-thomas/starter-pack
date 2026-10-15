import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import App from "../src/App";
import siteOrigins from "../src/site-origin.json";
import baseline from "./fixtures/pre-domain-migration-releases.json";
import { generateResources, loadContent, origin, startupPacketRelease } from "./content";
import { jsonResourceReferences } from "./style-guide-links";

const canonical = "https://starter.uppercut-labs.com";

test("canonical generation and copy controls use the new origin with the original GitHub fallback", async () => {
  assert.equal(origin, canonical);
  assert.equal(siteOrigins.canonicalOrigin, canonical);
  const data = await loadContent();
  const output = await mkdtemp(path.join(tmpdir(), "starter-canonical-"));
  try {
    await generateResources(data, output);
    const catalog = JSON.parse(await readFile(path.join(output, "agent/catalog.json"), "utf8"));
    const schema = JSON.parse(await readFile("public/schemas/agent-catalog.schema.json", "utf8"));
    const ajv = new Ajv2020();
    addFormats(ajv);
    const validate = ajv.compile(schema);
    assert.equal(validate(catalog), true, ajv.errorsText(validate.errors));
    assert.equal(catalog.requirements, canonical + "/agent/requirements.json");
    for (const resource of catalog.resources) {
      for (const key of ["html", "markdown", "json"]) {
        if (resource[key]) assert.equal(new URL(resource[key]).origin, canonical);
      }
      for (const lesson of resource.lessons || []) assert.equal(new URL(lesson.html).origin, canonical);
    }
    for (const skill of catalog.skills) {
      assert.equal(new URL(skill.current).origin, canonical);
      assert.equal(new URL(skill.versioned).origin, canonical);
    }
    for (const file of ["sitemap.xml", "robots.txt", "llms.txt"]) {
      const text = await readFile(path.join(output, file), "utf8");
      assert.ok(text.includes(canonical), file);
      assert.ok(!text.includes(siteOrigins.legacyOrigin), file);
    }
    const resources = renderToStaticMarkup(createElement(App, { path: "/resources", data }));
    assert.ok(resources.includes(canonical + "/agent/catalog.json"));
    assert.ok(!resources.includes(siteOrigins.legacyOrigin));
    const release = startupPacketRelease(data.instructionPacket);
    assert.equal(catalog.bootstrap, release.url);
    assert.ok(release.url.startsWith("https://raw.githubusercontent.com/devin-thomas/starter-pack/main/public/agent/packets/phase-1-"));
    assert.ok(release.prompt.includes(canonical + "/recommendations"));
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test("primary directory links migrate while exact Workers and GitHub fallback addresses remain", async () => {
  const directory = await readFile("public/agent/resource-links.md", "utf8");
  const primary = [...directory.matchAll(/^- Primary: \[[^\]]+\]\(([^)]+)\)/gm)];
  assert.ok(primary.length > 10);
  for (const [, url] of primary) assert.equal(new URL(url).origin, canonical);
  assert.ok(directory.includes("https://starter-pack.uppercut-labs.workers.dev/artifacts/progress/starter-progress.json"));
  assert.ok(directory.includes("https://raw.githubusercontent.com/devin-thomas/starter-pack/main/public/artifacts/progress/starter-progress.json"));
});

test("catalog schema and link extraction admit both exact hosts and reject lookalikes", async () => {
  const schema = JSON.parse(await readFile("public/schemas/agent-catalog.schema.json", "utf8"));
  const ajv = new Ajv2020();
  addFormats(ajv);
  const validate = ajv.compile(schema.$defs.resourceUrl);
  for (const host of [canonical, siteOrigins.legacyOrigin]) {
    const url = host + "/phases/1.md";
    assert.equal(validate(url), true);
    assert.deepEqual(jsonResourceReferences(JSON.stringify({ url })), [url]);
    const lookalike = host + ".evil.test/phases/1.md";
    assert.equal(validate(lookalike), false);
    assert.deepEqual(jsonResourceReferences(JSON.stringify({ url: lookalike })), []);
  }
});

test("all releases published before the domain migration retain their exact bytes", async () => {
  for (const [file, expected] of Object.entries(baseline.files)) {
    const bytes = await readFile(file);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, file);
  }
});

test("additive skill releases match current aliases and their declaration blobs", async () => {
  const versions = JSON.parse(await readFile("public/skills/versions.json", "utf8"));
  for (const skill of versions.skills) {
    const current = `public/skills/${skill.id}/current`;
    const numbered = `public/skills/${skill.id}/${skill.version}`;
    assert.equal(await readFile(`${numbered}/SKILL.md`, "utf8"), await readFile(`${current}/SKILL.md`, "utf8"));
    assert.equal(await readFile(`${numbered}/dvn.json`, "utf8"), await readFile(`${current}/dvn.json`, "utf8"));
    const declaration = JSON.parse(await readFile(`${current}/dvn.json`, "utf8"));
    const blob = async (file: string) => {
      const bytes = await readFile(file);
      return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
    };
    assert.equal(declaration.skillBlobSha, await blob(`${current}/SKILL.md`));
    for (const resource of declaration.resources) {
      if (resource.repository && resource.repository !== "devin-thomas/starter-pack") continue;
      const file = path.join(resource.root || current, resource.path);
      assert.equal(resource.gitBlobSha, await blob(file), `${skill.id}: ${resource.key}`);
    }
  }
});
