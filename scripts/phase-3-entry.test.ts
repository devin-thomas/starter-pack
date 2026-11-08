import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseRegistry, phaseIds, projectCatalog } from "../src/workbench/registry";
import { renderProse } from "./content";
import {
  currentStep, phase3Progress, phaseCompletion, phaseGate, safeProgress, summary, validCatalog, verificationCheck,
  type Catalog, type Progress,
} from "../src/workbench/model";

// Synthetic learner records only. These checks read contracts and fixtures; no agent or build runs.
const text = (file: string) => readFile(file, "utf8");
const source = JSON.parse(await text("content/workbench-steps.json"));
const registry = parseRegistry(source);
const catalog = projectCatalog(registry, phaseIds.map(id => ({
  id, title: id, url: `https://starter.uppercut-labs.com/phases/${id.slice(-1)}`, preview: id === "phase-3",
})));
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(await text("public/schemas/starter-progress.schema.json")));
const raw = async (name: string) => JSON.parse(await text(`scripts/fixtures/phase-3-entry/${name}.json`));
const load = (value: unknown, name = "fixture"): { progress: Progress; diagnostics: string[] } => {
  assert.equal(validate(value), true, `${name}: ${ajv.errorsText(validate.errors)}`);
  const { progress, coreValid, diagnostics } = safeProgress(structuredClone(value));
  assert.ok(progress && coreValid, name);
  return { progress, diagnostics };
};
const fixture = async (name: string) => load(await raw(name), name);
const levels = (progress: Progress) => Object.fromEntries(phase3Progress(progress, catalog)!.levels.map(level => [level.id, level.state]));
const operationLevels = ["agent-cli", "agent-api", "agent-mcp", "agent-native-package"];
const [phase3Page, phase2Page, companion, progressGuide, workbenchGuide] = await Promise.all([
  text("content/phases/3.md"), text("content/phases/2.md"), text("public/skills/starter-pack/current/SKILL.md"),
  text("public/artifacts/progress/README.md"), text("public/artifacts/progress-workbench/README.md"),
]);
const phase3Html = await renderProse(phase3Page.replace(/^---\n[\s\S]*?\n---\n/, ""));

test("Phase 3 is open as an optional curriculum with its graduation rule", () => {
  assert.equal(registry.requirements_revision, "2026-11-09");
  const phase = registry.phases["phase-3"];
  assert.equal(phase.preview, undefined);
  assert.deepEqual(phase.gate, { all_of: ["phase-3-project", "agent-native-graduation"] });
  assert.deepEqual(registry.groups["agent-native-graduation"], { title: "One verified CLI, API or MCP capability", semantics: "any_of", members: operationLevels });
  assert.equal(registry.steps["agent-ready-website"].verification, "readiness");
  assert.deepEqual(registry.steps["agent-ready-website"].gate_for, []);
  for (const id of operationLevels) {
    assert.equal(registry.steps[id].verification, "operation", id);
    assert.equal(registry.steps[id].requirement, "optional", id);
  }
  assert.equal(catalog.phases.find(item => item.id === "phase-3")?.preview, false);
  // The page status and the registry flag open together, never one without the other.
  assert.match(phase3Page, /^status: current$/m);
  assert.equal(/^status: preview$/m.test(phase3Page), phase.preview === true);
});

test("legacy Phase 1 and Phase 2 completions survive the new revision", async () => {
  const one = (await fixture("legacy-phase-1-complete-2026-10-09")).progress;
  assert.equal(phaseCompletion(one, "phase-1", catalog)?.requirements_revision, "2026-10-09");
  assert.equal(currentStep(one, catalog), undefined);
  assert.match(summary(one, catalog), /Completion recorded under requirements 2026-10-09/);
  const two = (await fixture("legacy-phase-2-complete-2026-11-08")).progress;
  assert.equal(phaseCompletion(two, "phase-2", catalog)?.requirements_revision, "2026-11-08");
  assert.equal(phaseCompletion(two, "phase-1", catalog)?.requirements_revision, "2026-10-09");
  assert.equal(phaseCompletion(two, "phase-3", catalog), undefined);
  assert.equal(currentStep(two, catalog), undefined);
});

test("an older Phase 3 preview completion claim is kept but never certified", async () => {
  const input = await raw("legacy-phase-3-preview-claim");
  const { progress, diagnostics } = load(input, "legacy-phase-3-preview-claim");
  assert.equal(progress.phase.status, "in_progress");
  assert.equal(input.phase.status, "completed");
  assert.match(diagnostics.join("\n"), /preview revision/);
  assert.equal(phaseCompletion(progress, "phase-3", catalog), undefined);
  assert.equal(phaseCompletion(progress, "phase-2", catalog)?.requirements_revision, "2026-10-09");
  assert.equal(progress.steps["structured-build-plan"].status, "in_progress");
  assert.equal(progress.steps["structured-build-plan"].phase, "phase-3");
  assert.equal((progress.artifacts?.phase_history as unknown[]).length, 3);
  // Without a revision at all, a completed Phase 3 claim is also uncertified.
  const noRevision = structuredClone(input);
  delete noRevision.phase.requirements_revision;
  noRevision.artifacts.phase_history = noRevision.artifacts.phase_history.slice(0, 2);
  assert.equal(load(noRevision).progress.phase.status, "in_progress");
});

test("a declined or deferred Phase 3 look-ahead survives and is never pushed on the learner", async () => {
  const { progress } = await fixture("legacy-phase-3-declined");
  assert.equal(phaseCompletion(progress, "phase-2", catalog)?.requirements_revision, "2026-11-08");
  assert.equal(currentStep(progress, catalog), undefined);
  assert.equal(progress.steps["phase-3-preview"].status, "skipped");
  assert.equal(progress.steps["phase-3-domain"].status, "deferred");
  assert.equal(progress.phase.current, "phase-2");
  assert.doesNotMatch(summary(progress, catalog), /Phase 3 project/);
});

test("a new Phase 3 selection is resumable from the saved choice and in-progress level", async () => {
  const { progress } = await fixture("phase-3-in-progress");
  assert.deepEqual(currentStep(progress, catalog)?.[0], "agent-cli");
  const state = phase3Progress(progress, catalog)!;
  assert.equal(state.preview, false);
  assert.deepEqual(state.choice, {
    project_mode: "extend_phase_2", project_ref: "https://github.com/example-learner/reading-tracker",
    goal: "Let my agent list the books I am reading", recommended_level: "agent-cli",
  });
  assert.deepEqual(levels(progress), {
    "agent-ready-website": "deferred", "agent-cli": "in_progress", "agent-api": "not_recorded", "agent-mcp": "not_recorded", "agent-native-package": "not_recorded",
  });
  assert.deepEqual(phaseGate(progress, catalog)?.missing, ["agent-native-graduation"]);
  const text = summary(progress, catalog);
  assert.match(text, /Phase 3 project: Extend my Phase 2 build/);
  assert.match(text, /Next action: Add JSON output/);
  // A deferred level alone never becomes the current step.
  const deferred = structuredClone(progress);
  deferred.steps["agent-cli"].status = "deferred";
  assert.equal(currentStep(deferred, catalog), undefined);
  // The learner's own pointer still wins.
  deferred.choices = { ...deferred.choices, workbench: { next_step_id: "agent-cli" } };
  assert.equal(currentStep(deferred, catalog)?.[0], "agent-cli");
});

test("Level 1 readiness is recorded as a milestone without graduation", async () => {
  const { progress } = await fixture("phase-3-l1-only");
  const state = phase3Progress(progress, catalog)!;
  assert.equal(state.readiness, true);
  assert.equal(state.graduationEvidence, false);
  assert.equal(levels(progress)["agent-ready-website"], "verified");
  assert.equal(phaseGate(progress, catalog)?.complete, false);
  assert.equal(phaseCompletion(progress, "phase-3", catalog), undefined);
  assert.match(summary(progress, catalog), /Level 1: Make your website agent-ready: Readiness milestone reached/);

  const claim = (await fixture("phase-3-l1-false-claim")).progress;
  assert.equal(claim.phase.status, "completed");
  assert.equal(phaseCompletion(claim, "phase-3", catalog), undefined);
  assert.ok(phaseGate(claim, catalog)?.conflicts.includes("Completion claim conflicts with current required outcomes"));
  assert.match(summary(claim, catalog), /Completion needs reconciliation/);
});

test("a verified CLI, API or MCP capability graduates, including one built through Level 4", async () => {
  for (const [name, level] of [["phase-3-cli-graduated", "agent-cli"], ["phase-3-api-graduated", "agent-api"], ["phase-3-mcp-graduated", "agent-mcp"], ["phase-3-package-graduated", "agent-native-package"]]) {
    const { progress } = await fixture(name);
    assert.equal(phaseGate(progress, catalog)?.complete, true, name);
    assert.equal(phaseCompletion(progress, "phase-3", catalog)?.requirements_revision, "2026-11-09", name);
    assert.equal(levels(progress)[level], "verified", name);
    assert.equal(phase3Progress(progress, catalog)?.graduationEvidence, true, name);
    assert.equal(currentStep(progress, catalog), undefined, name);
  }
});

test("graduation needs a real client, both checks, an operational interface and learner confirmation", async () => {
  const base = await raw("phase-3-cli-graduated");
  const mutations: [string, (data: { steps: Record<string, { verification: Record<string, unknown> }> }) => void, RegExp][] = [
    ["negative case not run", data => { data.steps["agent-cli"].verification.negative_case_check = "not_run"; }, /failure-case check/],
    ["expected output failed", data => { data.steps["agent-cli"].verification.expected_output_check = "failed"; }, /expected-output check/],
    ["learner did not confirm", data => { data.steps["agent-cli"].verification.learner_confirmed = false; }, /learner confirmation/],
    ["website check offered as an operation", data => { data.steps["agent-cli"].verification.interface = "website"; }, /CLI, API or MCP interface/],
    ["no verification time", data => { delete data.steps["agent-cli"].verification.verified_at; }, /verification time/],
  ];
  for (const [name, mutate, missing] of mutations) {
    const data = structuredClone(base);
    mutate(data);
    const { progress } = load(data, name);
    const gate = phaseGate(progress, catalog)!;
    assert.equal(gate.complete, false, name);
    assert.equal(phaseCompletion(progress, "phase-3", catalog), undefined, name);
    assert.match(gate.conflicts.join("\n"), missing, name);
    assert.equal(levels(progress)["agent-cli"], "needs_verification", name);
  }
  // A completed level with no verification record at all is not graduation either.
  const bare = structuredClone(base);
  delete bare.steps["agent-cli"].verification;
  assert.equal(phaseCompletion(load(bare).progress, "phase-3", catalog), undefined);
  // Level 1 evidence can never stand in for an operation, and vice versa.
  assert.equal(verificationCheck({ status: "completed", verification: base.steps["agent-cli"].verification }, "readiness").valid, false);
  // A project choice is still required.
  const noProject = structuredClone(base);
  noProject.steps["phase-3-project"].status = "in_progress";
  assert.deepEqual(phaseGate(load(noProject).progress, catalog)?.missing, ["phase-3-project"]);
});

test("skipped, deferred and not-applicable optional levels never block graduation", async () => {
  const { progress } = await fixture("phase-3-skipped-levels");
  assert.equal(phaseGate(progress, catalog)?.complete, true);
  assert.equal(phaseGate(progress, catalog)?.conflicts.length, 0);
  assert.equal(phaseCompletion(progress, "phase-3", catalog)?.requirements_revision, "2026-11-09");
  assert.deepEqual(levels(progress), {
    "agent-ready-website": "skipped", "agent-cli": "verified", "agent-api": "not_applicable", "agent-mcp": "deferred", "agent-native-package": "skipped",
  });
});

test("graduation recorded under this revision stays historical after a later revision", async () => {
  const { progress } = await fixture("phase-3-cli-graduated");
  delete progress.steps["agent-cli"].verification;
  const later: Catalog = { ...catalog, requirements_revision: "2027-01-01", requirements: { ...registry, requirements_revision: "2027-01-01" } };
  assert.equal(phaseCompletion(progress, "phase-3", later)?.requirements_revision, "2026-11-09");
  // A guide without a Phase 3 rule (an older bundled catalog) never certifies Phase 3.
  const older: Catalog = { ...catalog, requirements: { ...registry, phases: { ...registry.phases, "phase-3": { preview: true } } } };
  assert.equal(phaseCompletion(progress, "phase-3", older), undefined);
});

test("Phase 3 progress fields are compact and nonsecret", async () => {
  const base = await raw("phase-3-cli-graduated");
  const invalid = [
    (data: Record<string, any>) => { data.steps["agent-cli"].verification.token = "sk-test-not-a-real-key"; },
    (data: Record<string, any>) => { data.steps["agent-cli"].verification.summary = "x".repeat(281); },
    (data: Record<string, any>) => { data.steps["agent-cli"].verification.client = ""; },
    (data: Record<string, any>) => { data.steps["agent-cli"].verification.interface = "graphql"; },
    (data: Record<string, any>) => { data.steps["agent-cli"].verification.package_version = "latest"; },
    (data: Record<string, any>) => { delete data.steps["agent-cli"].verification.negative_case_check; },
    (data: Record<string, any>) => { data.choices.phase_3.api_key = "secret"; },
    (data: Record<string, any>) => { data.choices.phase_3.project_mode = "bigger_app"; },
    (data: Record<string, any>) => { data.choices.phase_3.goal = "y".repeat(281); },
  ];
  for (const mutate of invalid) {
    const data = structuredClone(base);
    mutate(data);
    assert.equal(validate(data), false, JSON.stringify(data.steps["agent-cli"].verification) + JSON.stringify(data.choices.phase_3));
  }
  const fixtures = ["phase-3-in-progress", "phase-3-l1-only", "phase-3-cli-graduated", "phase-3-api-graduated", "phase-3-mcp-graduated", "phase-3-package-graduated", "phase-3-skipped-levels"];
  for (const name of fixtures) {
    const body = await text(`scripts/fixtures/phase-3-entry/${name}.json`);
    assert.doesNotMatch(body, /password|secret|token|api[_-]?key|bearer|sk-/i, name);
    for (const [id, step] of Object.entries((await raw(name)).steps as Record<string, { phase?: string }>)) {
      if (id.startsWith("agent-") || id === "phase-3-project") assert.equal(step.phase, "phase-3", `${name}: ${id}`);
    }
  }
});

test("the Workbench catalog may describe Phase 3 as preview or open, never Phases 1 and 2", () => {
  const generated = JSON.parse(JSON.stringify(catalog));
  assert.equal(validCatalog(generated), true);
  const open = structuredClone(generated);
  open.phases[2].preview = false;
  open.requirements.phases["phase-3"].preview = false;
  assert.equal(validCatalog(open), true);
  const unspecified = structuredClone(generated);
  delete unspecified.phases[2].preview;
  assert.equal(validCatalog(unspecified), false);
  const previewTwo = structuredClone(generated);
  previewTwo.phases[1].preview = true;
  assert.equal(validCatalog(previewTwo), false);
});

test("learner-facing copy offers the choice, recommends a level, keeps every level open and separates readiness from graduation", () => {
  assert.match(phase3Page, /^title: Make It Agent Native$/m);
  assert.match(phase3Page, /^summary: Make your software discoverable, usable and connectable by agents, and prove it with a real client\.$/m);
  assert.doesNotMatch(phase3Page, /Quick Build/);
  assert.doesNotMatch(phase3Page, /Build something great/);
  // Every registry guide anchor resolves to a heading on the rendered page.
  for (const [id, step] of Object.entries(registry.steps).filter(([, step]) => step.phase === "phase-3")) {
    const anchor = step.guide?.split("#")[1];
    assert.ok(anchor && phase3Html.includes(`id="${anchor}"`), `${id}: ${step.guide}`);
  }
  assert.match(phase3Page, /extend/i);
  assert.match(phase3Page, /existing project/i);
  assert.match(phase3Page, /new project/i);
  assert.match(phase3Page, /recommend/i);
  assert.match(phase3Page, /readiness milestone/i);
  assert.match(phase3Page, /optional/i);
  assert.doesNotMatch(phase3Page, /\bpreview\b/i);
  assert.match(phase2Page, /\[Make It Agent Native\]\(\/phases\/3\)/);
  assert.doesNotMatch(phase2Page, /Build something great/);
  for (const [name, body] of [["companion", companion], ["progress guide", progressGuide]] as const) {
    assert.match(body, /choices\.phase_3/, name);
    assert.match(body, /verification/, name);
    assert.match(body, /extend_phase_2/, name);
    assert.match(body, /readiness/i, name);
    assert.match(body, /failure/i, name);
    assert.match(body, /learner/i, name);
  }
  assert.match(companion, /inspect/i);
  assert.match(companion, /every level/i);
  assert.match(workbenchGuide, /Phase 3/);
  assert.match(workbenchGuide, /older/i);
});
