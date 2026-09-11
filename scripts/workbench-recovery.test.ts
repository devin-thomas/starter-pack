import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseRegistry } from "../src/workbench/registry";
import { phaseGate, currentStep, safeProgress, readProgress, validCatalog, phaseCompletion, displayJson, type Catalog, type Progress } from "../src/workbench/model";

const registry = parseRegistry(JSON.parse(await readFile("content/workbench-steps.json", "utf8")));
const catalog: Catalog = {
  version: registry.version, requirements_revision: registry.requirements_revision, requirements: registry,
  phases: ["phase-1", "phase-2", "phase-3"].map(id => ({ id: id as Progress["phase"]["current"], title: id, url: `https://starter.devthomas.site/phases/${id.slice(-1)}`, preview: id === "phase-3" })),
  steps: Object.fromEntries(Object.entries(registry.steps).map(([id, step]) => [id, { ...step, url: `https://starter.devthomas.site/phases/${step.phase.slice(-1)}` }])),
};
function state(): Progress {
  return { schema_version: 1, starter_pack_version: "0.2.0", updated_at: "2026-09-10T12:00:00Z", phase: { current: "phase-1", status: "in_progress" }, steps: {} };
}
function phone(): Progress {
  const result = state();
  for (const id of ["primary-ai-phone-app", "github-mobile", "authenticator", "core-accounts", "instant-app"]) result.steps[id] = { status: "completed" };
  return result;
}
test("phone-only graduation accepts legacy alias and aggregate without optional preferences", () => {
  const data = phone();
  const before = JSON.stringify(data);
  assert.equal(phaseGate(data, catalog)?.complete, true);
  assert.equal(currentStep(data, catalog), undefined);
  assert.equal(JSON.stringify(data), before);
});
test("granular accounts and one builder satisfy the account group, not all builders", () => {
  const data = phone();
  delete data.steps["core-accounts"];
  for (const id of ["github", "cloudflare", "neon", "lovable"]) data.steps[id] = { status: "completed" };
  data.steps.replit = { status: "not_started" };
  assert.equal(phaseGate(data, catalog)?.complete, true);
  data.steps.neon.status = "deferred";
  assert.equal(phaseGate(data, catalog)?.complete, false);
});
test("historical aggregate does not fabricate children or conflict with merely absent detail", () => {
  const data = phone();
  data.steps.github = { status: "completed" };
  assert.equal(phaseGate(data, catalog)?.complete, true);
  assert.equal(data.steps.neon, undefined);
  data.steps.neon = { status: "not_started" };
  assert.ok(phaseGate(data, catalog)?.conflicts.length);
});
test("aliases with conflicting statuses require reconciliation", () => {
  const data = phone();
  data.steps["instant-build"] = { status: "in_progress" };
  assert.equal(phaseGate(data, catalog)?.complete, false);
  assert.ok(phaseGate(data, catalog)?.conflicts.length);
});
test("Phase 2 summary or legacy HTTP-only project cannot bypass current evidence", () => {
  const data = state();
  data.phase.current = "phase-2";
  for (const id of ["computer-setup", "phase-2-remote-baseline", "private-progress-repository", "phase-2-project"]) data.steps[id] = { status: "completed", notes: ["HTTP 200"] };
  const gate = phaseGate(data, catalog);
  assert.equal(gate?.complete, false);
  assert.ok(gate?.missing.includes("computer-setup"));
  assert.ok(gate?.missing.includes("quick-build"));
  assert.ok(gate?.missing.includes("live-deployment"));
  assert.ok(gate?.missing.includes("final-progress-save"));
});
test("historical graduation remains recorded with update gaps and no stale next action", () => {
  const data = state();
  data.phase = { current: "phase-2", status: "completed", requirements_revision: "2026-09-09" };
  data.steps["quick-build"] = { status: "not_started", next_action: "Begin Quick Build" };
  data.choices = { workbench: { next_step_id: "quick-build" } };
  assert.equal(currentStep(data, catalog), undefined);
  assert.equal(phaseCompletion(data, "phase-2")?.requirements_revision, "2026-09-09");
  assert.equal(phaseGate(data, catalog)?.complete, false);
  assert.equal(data.phase.status, "completed");
  data.phase = { current: "phase-3", status: "in_progress" };
  assert.equal(phaseCompletion(data, "phase-2"), undefined);
  data.artifacts = { phase_history: [{ phase: "phase-2", status: "completed", requirements_revision: "old", source: "learner_report" }] };
  assert.equal(phaseCompletion(data, "phase-2")?.requirements_revision, "old");
  assert.equal(phaseGate(data, catalog), undefined);
});
test("invalid status is quarantined and cannot leave a false completion", () => {
  const data = phone();
  const input = { ...data, phase: { ...data.phase, status: "completed" }, steps: { ...data.steps, "instant-build": { status: "done" } } };
  const result = safeProgress(input);
  assert.equal(result.coreValid, false);
  assert.equal(result.progress?.steps["instant-build"], undefined);
  assert.notEqual(result.progress?.phase.status, "completed");
  assert.equal(phaseGate(result.progress!, catalog)?.complete, false);
});
test("optional malformed metadata renders known progress, without unsafe coercion", () => {
  const data = phone();
  const input = { ...data, environment: { remote_access_ready: "false" }, choices: { development_email: { service_overrides: { neon: "GitHub OAuth" } } }, steps: { ...data.steps, custom: { status: "in_progress", phase: "phase-1", updated_at: {}, notes: ["useful", 3] } } };
  const before = JSON.stringify(input);
  const result = safeProgress(input);
  assert.ok(result.progress);
  assert.equal(result.coreValid, true);
  assert.equal(result.progress.environment?.remote_access_ready, undefined);
  assert.equal(result.progress.steps.custom.updated_at, undefined);
  assert.deepEqual(result.progress.steps.custom.notes, ["useful"]);
  assert.equal(JSON.stringify(input), before);
});
test("invalid core and unsupported versions never masquerade as ordinary completion", () => {
  for (const change of [{ phase: { current: "other", status: "completed" } }, { schema_version: 2 }, { schema_version: 0 }, { steps: [] }]) {
    const result = safeProgress({ ...phone(), ...change });
    assert.equal(result.coreValid, false);
    if (result.progress) assert.equal(phaseGate(result.progress, catalog)?.complete, false);
  }
});
test("last good record survives truncated or corrupt refresh and recovers on identical bytes", () => {
  const raw = JSON.stringify(phone());
  const good = readProgress(raw);
  for (const bad of ["{", JSON.stringify({ ...phone(), steps: [] })]) {
    const stale = readProgress(bad, good);
    assert.equal(stale.progress, good.progress);
    assert.equal(stale.stale, true);
    const restored = readProgress(raw, stale);
    assert.equal(restored.stale, false);
    assert.equal(restored.coreValid, true);
  }
});
test("sanitized diagnostics do not expose private values or dynamic field names", () => {
  const result = safeProgress({ ...phone(), steps: { "private-person@example.com": { status: "SECRET" } } });
  assert.doesNotMatch(result.diagnostics.join("\n"), /private-person|SECRET/);
  assert.match(result.diagnostics.join("\n"), /steps.*status/);
});
test("prototype-like custom IDs remain own records and cannot alter built-in mappings", () => {
  const input = JSON.parse(JSON.stringify(phone()).replace('"steps":{', '"steps":{"__proto__":{"status":"completed","phase":"phase-1"},'));
  const result = safeProgress(input);
  assert.ok(Object.hasOwn(result.progress!.steps, "__proto__"));
  assert.equal(phaseGate(result.progress!, catalog)?.complete, true);
});
test("catalog requires matching validated registry and projections", () => {
  assert.ok(validCatalog(catalog));
  assert.equal(validCatalog({ ...catalog, requirements: { ...registry, groups: { bad: { semantics: "any_of", members: [] } } } }), false);
  assert.equal(validCatalog({ ...catalog, requirements_revision: "wrong" }), false);
});
test("malformed history cannot certify a failed save or hide valid older history", () => {
  const data = state();
  data.phase.current = "phase-2";
  data.steps["final-progress-save"] = { status: "in_progress", blocker: "Push failed" };
  data.artifacts = { phase_history: [{ phase: "phase-2", status: "completed", requirements_revision: 99, source: {} }] };
  let view = safeProgress(data).progress!;
  assert.equal(phaseCompletion(view, "phase-2", catalog), undefined);
  assert.equal(currentStep(view, catalog)?.[0], "final-progress-save");
  data.artifacts = { phase_history: [{ phase: "phase-2", status: "completed", requirements_revision: "old", source: "learner_report" }, { phase: "phase-2", status: "invalid" }] };
  view = safeProgress(data).progress!;
  assert.equal(phaseCompletion(view, "phase-2", catalog)?.requirements_revision, "old");
  assert.equal((view.artifacts?.phase_history as unknown[]).length, 1);
});
test("same-revision completion candidate never hides a failed final save", () => {
  const data = state();
  data.phase = { current: "phase-2", status: "completed", requirements_revision: registry.requirements_revision };
  data.steps["final-progress-save"] = { status: "in_progress", blocker: "Push failed", next_action: "Verify and retry the intended save" };
  assert.equal(phaseCompletion(data, "phase-2", catalog), undefined);
  assert.equal(currentStep(data, catalog)?.[0], "final-progress-save");
  assert.ok(phaseGate(data, catalog)?.conflicts.length);
  data.phase.status = "in_progress";
  data.artifacts = { phase_history: [{ phase: "phase-2", status: "completed", requirements_revision: registry.requirements_revision, source: "agent_check" }] };
  assert.equal(phaseCompletion(data, "phase-2", catalog), undefined);
});
test("deep unknown optional data remains bounded and safe to render", () => {
  const nested = JSON.parse('{"value":'.repeat(6000) + '"<img src=x onerror=alert(1)>"' + '}'.repeat(6000));
  const data = state();
  data.artifacts = { custom: nested };
  assert.ok(safeProgress(data).coreValid);
  assert.ok(displayJson(nested).length < 1000);
  assert.match(displayJson(nested), /omitted/);
});
test("a Phase 3 completed claim remains an uncertified preview", () => {
  const data = state();
  data.phase = { current: "phase-3", status: "completed" };
  const result = safeProgress(data);
  assert.notEqual(result.progress?.phase.status, "completed");
  assert.equal(phaseCompletion(result.progress!, "phase-3", catalog), undefined);
  assert.match(result.diagnostics.join("\n"), /preview/);
});
