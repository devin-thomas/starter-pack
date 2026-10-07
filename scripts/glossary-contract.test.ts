import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

test("Quick Build current matches its immutable versioned resource", async () => {
  const manifest = JSON.parse(await read("public/skills/versions.json"));
  const quick = manifest.skills.find((entry: { id: string }) => entry.id === "quick-build");
  assert.ok(quick);
  const current = await read("public" + quick.current);
  const versioned = await read("public" + quick.versioned);
  assert.equal(current, versioned);
  assert.ok(current.includes("version: " + quick.version));
  assert.match(current, /GLOSSARY\.md/);
  assert.match(current, /GLOSSARY-MAP\.md/);
  assert.match(current, /neither file is a prerequisite/);
  assert.match(current, /do not manufacture an empty glossary/);
});

test("Starter Pack skill pages describe separated source contracts", async () => {
  const grill = await read("content/skills/grill-to-build.md");
  const execute = await read("content/skills/task-execution-prompt.md");
  const quick = await read("content/skills/quick-build.md");
  for (const term of ["PROJECT.md", "GLOSSARY.md", "GLOSSARY-MAP.md"])
    assert.ok(grill.includes(term), "Grill page missing " + term);
  assert.doesNotMatch(grill, /Grill to Build asks once which living-model format/);
  assert.doesNotMatch(grill, /\*\*Context\.md\*\* — Living/);
  assert.ok(execute.includes("GLOSSARY.md"));
  assert.ok(execute.includes("GLOSSARY-MAP.md"));
  assert.doesNotMatch(execute, /Reads your repository's AGENTS\.md, CONTEXT\.md/);
  assert.match(quick, /does not require a glossary/);
});

test("Quick Build planning templates do not depend on Grill artifacts", async () => {
  const source = await read("public/artifacts/quick-build/README.md");
  assert.ok(source.includes("PLAN/SPEC/DECISIONS/TICKET"));
  assert.match(source, /Reuse existing `GLOSSARY\.md`/);
  for (const name of ["PLAN.md", "SPEC.md", "DECISIONS.md", "TICKET.md"])
    assert.ok((await read("public/artifacts/quick-build/" + name)).length > 100, name);
});
