import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { currentStep, phaseFor, safeLink, summary, validCatalog, type Progress, type Catalog } from "../src/workbench/model";

const schema = JSON.parse(await readFile("public/schemas/starter-progress.schema.json", "utf8"));
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const catalog: Catalog = {
  version: "0.1.0",
  phases: [1, 2, 3].map(number => ({ id: `phase-${number}` as Catalog["phases"][number]["id"], title: `Phase ${number}`, url: `https://starter.devthomas.site/phases/${number}`, preview: number === 3 })),
  steps: { "computer-setup": { title: "Computer Setup", phase: "phase-2", url: "https://starter.devthomas.site/phases/2" } },
};
function state(): Progress {
  return { schema_version: 1, starter_pack_version: "0.1.0", updated_at: "2026-09-09T00:00:00Z", phase: { current: "phase-2", status: "in_progress" }, steps: {} };
}
test("existing portable records remain valid without Workbench fields", async () => {
  for (const file of ["starter-progress.json", "starter-progress.example.json", "starter-progress.completed-phase-1.example.json"]) {
    assert.ok(validate(JSON.parse(await readFile(`public/artifacts/progress/${file}`, "utf8"))));
  }
});
test("OAuth notes are legacy strings while structured emails remain validated", () => {
  const data = state();
  data.choices = { development_email: { service_overrides: { neon: "GitHub OAuth" } }, service_auth: { neon: { method: "oauth", provider: "github", account_handle: "example-learner", account_email: null, source: "learner_report" } } };
  assert.ok(validate(data));
  data.choices = { service_auth: { neon: { account_email: "GitHub OAuth" } } };
  assert.equal(validate(data), false);
  assert.equal(validate({ ...data, schema_version: 2 }), false);
});
test("new history requires phase, status, revision and provenance but not invented old timestamps", () => {
  const data = state();
  data.artifacts = { phase_history: [{ phase: "phase-1", status: "completed", requirements_revision: "2026-09-10", source: "learner_report" }] };
  assert.ok(validate(data));
  data.artifacts = { phase_history: [{ status: "completed" }] };
  assert.equal(validate(data), false);
});
test("email choices allow distinct services and deferral without requiring identity", () => {
  const data = state();
  data.choices = { development_email: { account_email: "dev@example.com", notification_email: "notices@example.com", access_email: null, service_overrides: { github: "code@example.com" }, notes: ["Access undecided"] } };
  assert.ok(validate(data));
  data.choices = { development_email: { account_email: "not an email" } };
  assert.equal(validate(data), false);
});

test("account checkpoint is optional, preserves service handles, and permits declining", () => {
  const data = state();
  assert.ok(validate(data));
  data.artifacts = { account_profile: { github_username: "example-learner", service_usernames: { vercel: "example-team" }, status: "recorded", notes: [], custom: "preserve" } };
  data.choices = { development_email: { account_email: "learner@example.com", notification_email: null, access_email: null } };
  const before = JSON.stringify(data);
  assert.ok(validate(data));
  summary(data, catalog);
  assert.equal(JSON.stringify(data), before);
  for (const status of ["declined", "deferred"]) {
    data.artifacts = { account_profile: { status, github_username: null } };
    assert.ok(validate(data));
  }
  data.artifacts = { account_profile: { status: "recorded", service_usernames: ["ambiguous"] } };
  assert.equal(validate(data), false);
});
test("schema rejects corrupt statuses and supports explicit custom step routing", () => {
  const data = state();
  data.steps.custom = { status: "deferred", phase: "phase-2", next_action: "Retry sign-in", blocker: "Awaiting access" };
  assert.ok(validate(data));
  assert.equal(phaseFor("custom", data.steps.custom, catalog), "phase-2");
  assert.equal(phaseFor("unknown", { status: "completed" }, catalog), undefined);
  assert.equal(validate({ ...data, steps: { custom: { status: "done" } } }), false);
  assert.equal(validate({ ...data, steps: { custom: { status: "completed", notes: "invalid" } } }), false);
});
test("next step honors recorded intent and does not invent work or phase completion", () => {
  const data = state();
  assert.equal(currentStep(data, catalog), undefined);
  data.steps = { "computer-setup": { status: "completed" }, custom: { status: "in_progress", phase: "phase-2", next_action: "Inspect tools" }, later: { status: "deferred", phase: "phase-2" } };
  assert.equal(currentStep(data, catalog)?.[0], "custom");
  data.choices = { workbench: { next_step_id: "later" } };
  assert.equal(currentStep(data, catalog)?.[0], "later");
  data.choices = { workbench: { next_step_id: "computer-setup" } };
  assert.equal(currentStep(data, catalog)?.[0], "custom");
  data.phase.status = "completed";
  assert.equal(currentStep(data, catalog), undefined);
});
test("summary preserves all statuses and never mutates the source", () => {
  const data = state();
  data.steps = { "computer-setup": { status: "in_progress", next_action: "Sign in", blocker: "Account not connected" }, extra: { status: "skipped" }, other: { status: "not_applicable" } };
  const before = JSON.stringify(data);
  assert.match(summary(data, catalog), /Next action: Sign in/);
  assert.match(summary(data, catalog), /Extra: Skipped/);
  assert.equal(JSON.stringify(data), before);
});
test("untrusted artifact links cannot execute code or embed credentials", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,bad", "file:///secret", "https://user:password@example.com", "//example.com"]) assert.equal(safeLink(url), undefined);
  assert.equal(safeLink("https://example.com/project"), "https://example.com/project");
});
test("online labels accept only the expected catalog shape and guide origin", () => {
  assert.ok(validCatalog(catalog));
  assert.equal(validCatalog({ ...catalog, phases: [] }), false);
  assert.equal(validCatalog({ ...catalog, steps: { bad: { title: "Bad", phase: "phase-2", url: "https://evil.example" } } }), false);
});
