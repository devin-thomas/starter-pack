import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseRegistry, phaseIds, projectCatalog } from "../src/workbench/registry";
import { currentStep, phaseCompletion, phaseGate, safeProgress, summary, type Progress } from "../src/workbench/model";

// Synthetic learner records only. These checks read contracts and fixtures; no agent or build runs.
const text = (file: string) => readFile(file, "utf8");
const registry = parseRegistry(JSON.parse(await text("content/workbench-steps.json")));
const catalog = projectCatalog(registry, phaseIds.map(id => ({
  id, title: id, url: `https://starter.uppercut-labs.com/phases/${id.slice(-1)}`, preview: id === "phase-3",
})));
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(await text("public/schemas/starter-progress.schema.json")));
const fixture = async (name: string): Promise<Progress> => {
  const raw = JSON.parse(await text(`scripts/fixtures/phase-2-workflow/${name}.json`));
  assert.equal(validate(raw), true, `${name}: ${ajv.errorsText(validate.errors)}`);
  const { progress, coreValid } = safeProgress(raw);
  assert.ok(progress && coreValid, name);
  return progress;
};
const [grill, quick, companion, setup, phase, prompt, templates] = await Promise.all([
  text("public/skills/grill-to-build/current/SKILL.md"),
  text("public/skills/quick-build/current/SKILL.md"),
  text("public/skills/starter-pack/current/SKILL.md"),
  text("public/skills/computer-setup/current/SKILL.md"),
  text("content/phases/2.md"),
  text("public/prompts/phase-2.txt"),
  text("public/artifacts/grill-to-build/README.md"),
]);
const grillGuide = "/skills/grill-to-build/current/SKILL.md";
const recordedQuickBuild = /^Workflow: Quick Build \(learner asked on \d{4}-\d{2}-\d{2}\)$/;

test("the Phase 2 gate keeps its step IDs and plans with Grill to Build", () => {
  assert.equal(registry.requirements_revision, "2026-11-09");
  assert.deepEqual(registry.phases["phase-2"].gate, { all_of: [
    "computer-setup", "private-progress-repository", "phase-2-remote-baseline",
    "quick-build", "live-deployment", "final-progress-save",
  ] });
  const step = registry.steps["quick-build"];
  assert.equal(step.title, "Plan and build your project");
  assert.equal(catalog.steps["quick-build"].title, "Plan and build your project");
  assert.equal(step.guide, grillGuide);
  assert.equal(registry.steps["live-deployment"].guide, grillGuide);
  assert.match(step.completion_meaning, /full Grill to Build by default/);
  assert.match(step.completion_meaning, /Quick Build only when the learner explicitly asked/);
  assert.match(step.completion_meaning, /silently shortened plan/);
  assert.match(step.completion_meaning, /explicit go decision/);
});

test("the Phase 1 Two-Build Challenge is not a gate anywhere", () => {
  for (const id of phaseIds) {
    const gate = registry.phases[id].gate;
    const members = gate ? gate.all_of ?? gate.any_of : [];
    assert.ok(!members.some(member => /two-build|challenge/.test(member)), id);
  }
  assert.ok(!Object.keys(registry.steps).some(id => /two-build|challenge/.test(id)));
  assert.match(companion, /Two-Build Challenge is optional and never a Phase 2 prerequisite/);
  assert.match(grill, /Two-Build Challenge was optional; never require it/);
});

test("a new learner reaches project planning with Grill to Build as the default", async () => {
  const data = await fixture("new-learner");
  assert.equal(phaseGate(data, catalog)?.missing.join(), "quick-build,live-deployment,final-progress-save");
  assert.equal(currentStep(data, catalog)?.[0], "quick-build");
  assert.equal(data.steps["quick-build"].notes, undefined, "No workflow is recorded yet");
  assert.equal(registry.steps["quick-build"].guide, grillGuide);
  assert.match(grill, /Use full Grill to Build unless the learner explicitly asks for Quick Build/);
  assert.match(grill, /never switch to it silently/);
  assert.match(grill, /Suggest a new, meaningful project for Phase 2/);
  assert.match(grill, /Reuse or rebuild the Phase 1 instant build only when the learner asks/);
  assert.match(setup, /Grill to Build skill\][\s\S]*standard Phase 2 planning workflow/);
  assert.match(prompt, /planning my project with https:\/\/starter\.uppercut-labs\.com\/skills\/grill-to-build\/SKILL\.md/);
  assert.match(prompt, /Suggest a new project for this phase; reuse or rebuild my Phase 1 app only if I ask/);
  assert.match(prompt, /quick-build\/SKILL\.md only if I explicitly ask for Quick Build/);
});

test("a returning learner keeps full Grill to Build without a Quick Build request", async () => {
  const data = await fixture("returning-learner");
  assert.equal(currentStep(data, catalog)?.[0], "quick-build");
  const notes = data.steps["quick-build"].notes ?? [];
  assert.ok(notes.includes("Workflow: Grill to Build (default)"));
  assert.ok(!notes.some(note => recordedQuickBuild.test(note)));
  assert.equal(data.phase.requirements_revision, "2026-10-09", "An in-progress record keeps its revision");
  assert.match(grill, /On resume, reuse the recorded workflow/);
  assert.match(grill, /Track rounds and question count in `PROJECT\.md` so resuming does not reset them/);
  assert.match(companion, /On resume, honor a recorded workflow/);
});

test("Quick Build applies only after an explicit request and keeps its approved plan", async () => {
  const data = await fixture("returning-learner-quick-build");
  assert.equal(currentStep(data, catalog)?.[0], "quick-build");
  const notes = data.steps["quick-build"].notes ?? [];
  assert.ok(notes.some(note => recordedQuickBuild.test(note)), "The request is recorded in the format the skills define");
  assert.ok(notes.some(note => /^Plan approved on \d{4}-\d{2}-\d{2}: /.test(note)));
  assert.ok(notes.some(note => /^Go-ahead given on /.test(note)));
  assert.match(grill, /"Workflow: Quick Build \(learner asked on <date>\)"/);
  assert.match(quick, /"Workflow: Quick Build \(learner asked on <date>\)"/);
  assert.match(quick, /Use this skill only when the learner explicitly asked for Quick Build in their own words/);
  assert.match(quick, /Do not choose it for them, suggest it as a shortcut, or switch to it because discovery takes effort/);
  assert.match(quick, /An approved Quick Build plan and go-ahead stay valid on resume: continue that build instead of planning again/);
  assert.match(grill, /An already approved plan and go-ahead under either workflow stay valid/);
  assert.match(companion, /Use \[Quick Build\]\([^)]+\) only when the learner explicitly asks for it; never switch silently/);
});

test("both workflows produce inspectable plan files and an explicit approval", () => {
  for (const [name, skill] of [["Grill to Build", grill], ["Quick Build", quick]] as const) {
    assert.match(skill, /Record the approval or requested revisions in the `quick-build` step's `notes` with the date and/, name);
    assert.match(skill, /tell me to go, or ask to (?:see or change any of them|inspect the plan or tickets) first/, name);
  }
  assert.match(grill, /Implementation begins only after an explicit go-ahead/);
  for (const file of ["PROJECT.md", "GLOSSARY.md", "ADR.md", "Ideas.md", "SPEC.md", "TICKET.md"])
    assert.ok(templates.includes(`/artifacts/grill-to-build/${file}`), file);
  assert.match(phase, /Plan my project with Grill to Build/);
  assert.match(phase, /Nothing is built before you say go/);
  assert.match(phase, /Say \*\*Use Quick Build instead\.\*\*[\s\S]*Your agent switches only when you ask/);
  assert.match(phase, /If you would rather grow the app you made in Phase 1, tell your agent; otherwise it suggests starting fresh/);
  assert.match(grill, /explain the technical ideas/);
  assert.match(grill, /never about frameworks, libraries, databases, or hosting internals/);
});

test("Phase 2 completed under the previous revision stays complete", async () => {
  const data = await fixture("completed-phase-2-2026-10-09");
  const completion = phaseCompletion(data, "phase-2", catalog);
  assert.equal(completion?.requirements_revision, "2026-10-09");
  assert.equal(currentStep(data, catalog), undefined);
  assert.equal(phaseGate(data, catalog)?.complete, true, "Same step IDs, so the old evidence still meets the gate");
  assert.match(summary(data, catalog), /Completion recorded under requirements 2026-10-09; historical completion is preserved\./);
  data.steps["quick-build"] = { status: "not_started" };
  assert.equal(phaseCompletion(data, "phase-2", catalog)?.requirements_revision, "2026-10-09", "An older revision is not re-evaluated");
});

test("hosted Grill to Build is published like Quick Build", async () => {
  const versions = JSON.parse(await text("public/skills/versions.json"));
  const entry = versions.skills.find((skill: { id: string }) => skill.id === "grill-to-build");
  assert.deepEqual(entry, {
    id: "grill-to-build", version: "0.2.1",
    current: "/skills/grill-to-build/current/SKILL.md", versioned: "/skills/grill-to-build/0.2.1/SKILL.md",
  });
  assert.match(grill, /^version: 0\.2\.1$/m);
  assert.match(grill, /requirements revision `2026-11-09`/);
  const declaration = JSON.parse(await text("public/skills/grill-to-build/current/dvn.json"));
  assert.equal(declaration.skillName, "grill-to-build");
  assert.ok(declaration.resources.some((resource: { key: string; path: string }) => resource.key === "template-readme" && resource.path === "grill-to-build/README.md"));
  for (const skill of ["starter-pack", "computer-setup"]) {
    const dependencies = JSON.parse(await text(`public/skills/${skill}/current/dvn.json`)).dependencies;
    assert.ok(dependencies.some((dependency: { canonicalId: string }) => dependency.canonicalId === "starter-pack/grill-to-build"), skill);
  }
  const directory = await text("public/agent/resource-links.md");
  assert.ok(directory.includes("## /skills/grill-to-build/current/SKILL.md"));
  const content = await text("scripts/content.ts");
  assert.match(content, /\["starter-pack", "computer-setup", "grill-to-build", "quick-build"\]/);
});
