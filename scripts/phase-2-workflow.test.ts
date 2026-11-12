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
// grill and quick are the reusable skills imported from devin-thomas/skills;
// the course rules for Phase 2 planning live in the planning reference.
const [grill, quick, planning, companion, setup, phase, prompt, templates] = await Promise.all([
  text("public/skills/grill-to-build/current/SKILL.md"),
  text("public/skills/quick-build/current/SKILL.md"),
  text("content/lessons/phase-2-planning.md"),
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
  assert.match(planning, /Two-Build Challenge was optional; never require it/);
});

test("a new learner reaches project planning with Grill to Build as the default", async () => {
  const data = await fixture("new-learner");
  assert.equal(phaseGate(data, catalog)?.missing.join(), "quick-build,live-deployment,final-progress-save");
  assert.equal(currentStep(data, catalog)?.[0], "quick-build");
  assert.equal(data.steps["quick-build"].notes, undefined, "No workflow is recorded yet");
  assert.equal(registry.steps["quick-build"].guide, grillGuide);
  assert.match(planning, /Use full Grill to Build unless the learner explicitly asks for Quick Build/);
  assert.match(planning, /switch to it silently because discovery takes effort/);
  assert.match(planning, /Suggest a new, meaningful project for Phase 2/);
  assert.match(planning, /Reuse or rebuild the Phase 1 instant build only when the learner asks/);
  assert.match(companion, /follow the \[Phase 2 planning reference\]\(https:\/\/starter\.uppercut-labs\.com\/phases\/2\/planning\.md\)/);
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
  assert.match(planning, /On resume, reuse the recorded workflow/);
  assert.match(grill, /Track discovery rounds and question count in `PROJECT\.md` so resuming does not reset the budget/);
  assert.match(companion, /On resume, honor a recorded workflow/);
});

test("Quick Build applies only after an explicit request and keeps its approved plan", async () => {
  const data = await fixture("returning-learner-quick-build");
  assert.equal(currentStep(data, catalog)?.[0], "quick-build");
  const notes = data.steps["quick-build"].notes ?? [];
  assert.ok(notes.some(note => recordedQuickBuild.test(note)), "The request is recorded in the format the skills define");
  assert.ok(notes.some(note => /^Plan approved on \d{4}-\d{2}-\d{2}: /.test(note)));
  assert.ok(notes.some(note => /^Go-ahead given on /.test(note)));
  assert.match(planning, /"Workflow: Quick Build \(learner asked on <date>\)"/);
  assert.match(planning, /A request counts only when the learner says they want Quick Build/);
  assert.match(planning, /Do not choose Quick Build for them, offer it as a way out of longer discovery/);
  assert.match(planning, /An already approved plan and go-ahead under either workflow stay valid: continue that build instead of planning again/);
  assert.match(planning, /If they ask to switch back, continue with Grill to Build and reuse every answer already given/);
  assert.match(companion, /Use \[Quick Build\]\([^)]+\) only when the learner explicitly asks for it; never switch silently/);
});

test("both workflows produce inspectable plan files and an explicit approval", () => {
  assert.match(planning, /Record the approval or requested revisions in the `quick-build` step's `notes` with the date and/);
  assert.match(planning, /tell me to go, or ask to see or change any of them first/);
  assert.match(planning, /tell me to go, or ask to inspect the plan or tickets first/);
  assert.match(quick, /tell me to go, or ask to inspect the plan or tickets first/);
  assert.match(planning, /Implementation begins only after an explicit go-ahead/);
  for (const file of ["PROJECT.md", "GLOSSARY.md", "ADR.md", "Ideas.md", "SPEC.md", "TICKET.md"])
    assert.ok(templates.includes(`/artifacts/grill-to-build/${file}`), file);
  assert.match(phase, /Plan my project with Grill to Build/);
  assert.match(phase, /Nothing is built before you say go/);
  assert.match(phase, /Say \*\*Use Quick Build instead\.\*\*[\s\S]*Your agent switches only when you ask/);
  assert.match(phase, /If you would rather grow the app you made in Phase 1, tell your agent; otherwise it suggests starting fresh/);
  assert.match(planning, /explain the technical ideas/);
  assert.match(planning, /never about frameworks, libraries, databases, or hosting internals/);
  assert.match(phase, /\]\(\/phases\/2\/planning\)/);
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

test("one Grill to Build and one Quick Build: the reusable skills plus one planning reference", async () => {
  const versions = JSON.parse(await text("public/skills/versions.json"));
  for (const id of ["grill-to-build", "quick-build"]) {
    const entry = versions.skills.find((skill: { id: string }) => skill.id === id);
    assert.deepEqual(entry, {
      id, version: "0.3.0",
      current: `/skills/${id}/current/SKILL.md`, versioned: `/skills/${id}/0.3.0/SKILL.md`,
    });
    const skill = await text(`public/skills/${id}/current/SKILL.md`);
    assert.match(skill, new RegExp(`^name: ${id}$`, "m"));
    assert.doesNotMatch(skill, /^version:/m, "the reusable skill carries no course version");
    assert.ok(skill.includes("(https://starter.uppercut-labs.com/phases/2/planning.md)"), `${id} points Starter Pack learners at the planning reference`);
    assert.ok(!skill.includes("references/starter-pack-0.2.3.md"), `${id} no longer routes to the frozen curriculum snapshot`);
    const declaration = JSON.parse(await text(`public/skills/${id}/current/dvn.json`));
    assert.equal(declaration.skillName, id);
    assert.ok(!declaration.dependencies.some((dependency: { canonicalId: string }) => dependency.canonicalId.startsWith("starter-pack/")), id);
  }
  for (const skill of ["starter-pack", "computer-setup"]) {
    const dependencies = JSON.parse(await text(`public/skills/${skill}/current/dvn.json`)).dependencies;
    for (const id of ["grill-to-build", "quick-build"])
      assert.ok(dependencies.some((dependency: { canonicalId: string }) => dependency.canonicalId === `public/${id}`), `${skill}: ${id}`);
  }
  const companionDeclaration = JSON.parse(await text("public/skills/starter-pack/current/dvn.json"));
  assert.ok(companionDeclaration.resources.some((resource: { key: string; root: string; path: string }) =>
    resource.key === "phase-2-planning" && resource.root === "content/lessons" && resource.path === "phase-2-planning.md"));
  const { staticRoutes } = await import("../src/reading-routes");
  assert.ok(staticRoutes.includes("/phases/2/planning"));
  assert.match(planning, /^route: \/phases\/2\/planning$/m);
  assert.match(planning, /^phase: phase-2$/m);
  const directory = await text("public/agent/resource-links.md");
  assert.ok(directory.includes("## /skills/grill-to-build/current/SKILL.md"));
  assert.ok(directory.includes("## /phases/2/planning.md"));
  assert.ok(templates.includes("(https://starter.uppercut-labs.com/phases/2/planning.md)"));
  const content = await text("scripts/content.ts");
  assert.match(content, /\["starter-pack", "computer-setup", "grill-to-build", "quick-build"\]/);
});
