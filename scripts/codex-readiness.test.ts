import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { instructionPacket, normalizeGeneratedText, renderProse } from "./content";

test("generated text normalizes CRLF and CR to LF for consistent resource bytes", () => {
  assert.equal(normalizeGeneratedText("first\r\nsecond\rthird\n"), "first\nsecond\nthird\n");
});

test("Codex guide heading renders the ChatGPT brand mark as a decorative mask", async () => {
  const rendered = await renderProse("## Build with Codex\n\n## See your progress locally");
  assert.match(rendered, /<h2 id="build-with-codex" class="has-brand-heading-icon">/);
  assert.match(rendered, /brand-icon brand-icon-mask heading-brand-icon" aria-hidden="true"/);
  assert.match(rendered, /mask-image:url\('\/icons\/brands\/chatgpt\.svg'\)/);
  assert.match(rendered, /<span class="heading-label">Build with Codex<\/span><\/h2>/);
  assert.match(rendered, /<h2 id="see-your-progress-locally">See your progress locally<\/h2>/);
  const css = await readFile("src/index.css", "utf8");
  assert.match(css, /\.prose \.has-brand-heading-icon\s*\{[^}]*align-items:\s*center/);
  assert.match(css, /\.prose \.has-brand-heading-icon > \.heading-brand-icon\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px/);
});

test("generated Phase 1 packet includes readiness before the first action", async () => {
  const packet = await instructionPacket();
  const readinessHeading = packet.indexOf("## Codex readiness checkpoint");
  const phaseHeading = packet.indexOf("## Phase 1 guidance");
  assert.notEqual(readinessHeading, -1);
  assert.ok(readinessHeading < phaseHeading);
  assert.match(packet, /Use this check before the first Phase 1 action/);
  assert.match(packet, /conversation host[\s\S]*selected computer harness[\s\S]*target/);
  assert.match(packet, /codex --version/);
  assert.match(packet, /codex login status/);
  assert.match(packet, /use the already available selected harness, prepare or continue computer setup, or defer and keep using the current supported companion/);
  assert.match(packet, /Do not install or start Codex, invoke `codex login`, read credential files, start a session, call a model/);
  assert.doesNotMatch(packet, /\]\(\/(?!\/)|\b(?:href|src)="\/(?!\/)/);
});

test("readiness checkpoints cover milestones and the required scenarios", async () => {
  const guide = await readFile("public/setup/codex-readiness.md", "utf8");
  for (const milestone of [
    "Phase 1 closeout and device/companion handoff",
    "Computer Setup entry and closeout",
    "Quick Build planning and the transition to approved implementation",
    "deployment/release and phase closeout",
    "after a material change to host, machine, workspace, permissions, runtime, or authentication",
  ]) assert.ok(guide.includes(milestone), milestone);
  for (const scenario of [
    "Codex is selected and its target is reachable",
    "The conversation is outside Codex but the selected Codex target is reachable",
    "Harness or target is unknown",
    "Phone only, no target access",
    "Codex CLI is missing",
    "CLI is present but sign-in is absent or unknown",
    "Only API-key authentication is available",
    "Machine, workspace, runtime, permission, or authentication changed",
    "The learner already declined",
    "A deferred blocker changes",
    "Phase 1 or a later phase is already complete",
  ]) assert.ok(guide.includes(scenario), scenario);
  assert.match(guide, /An explicit decline remains declined/);
  assert.match(guide, /A deferral can be revisited only when its recorded blocker changes or the learner asks/);
});

test("readiness state stays separate from proof and remains schema-valid", async () => {
  const [schemaText, exampleText, guide] = await Promise.all([
    readFile("public/schemas/starter-progress.schema.json", "utf8"),
    readFile("public/artifacts/progress/starter-progress.json", "utf8"),
    readFile("public/setup/codex-readiness.md", "utf8"),
  ]);
  const schema = JSON.parse(schemaText);
  const state = JSON.parse(exampleText);
  const ajv = new Ajv2020();
  addFormats(ajv);
  const validate = ajv.compile(schema);

  state.steps["programmatic-harness"] = {
    status: "deferred",
    notes: ["CLI sign-in status was not checked because the target is unavailable."],
  };
  state.artifacts.programmatic_harness = { attempts: [] };
  assert.equal(validate(state), true, JSON.stringify(validate.errors));
  assert.equal(state.steps["programmatic-harness"].status, "deferred");
  assert.deepEqual(state.artifacts.programmatic_harness.attempts, []);
  assert.match(guide, /Readiness and offer history belong in the existing `steps\["programmatic-harness"\]` status and concise nonsecret notes/);
  assert.match(guide, /Actual proof outcomes belong only in `artifacts\.programmatic_harness\.attempts`/);
  assert.match(guide, /Version and sign-in do not prove plan eligibility, model availability, or a successful programmatic turn/);
  assert.match(guide, /Do not promote CLI capability, a managed login, or model-list metadata into a passed proof/);
  assert.match(guide, /Do not save a machine name, workspace path, account identity, credentials, raw status output, or session\/turn ID/);
  assert.deepEqual(schema.$defs.programmaticHarnessEvidence.properties.attempts.items.properties.outcome.enum,
    ["not_tested", "declined", "deferred", "partial", "failed", "passed"]);
});

test("readiness guide, skills, version catalog, and setup manifest agree", async () => {
  const versions = JSON.parse(await readFile("public/skills/versions.json", "utf8"));
  const setup = JSON.parse(await readFile("public/setup/computer-setup.manifest.json", "utf8"));
  const skills = JSON.parse(await readFile("content/skills/manifest.json", "utf8"));
  assert.equal(setup.focused_guides.codex_readiness, "https://starter.devthomas.site/setup/codex-readiness.md");
  assert.equal(setup.skill_version, "0.2.2");
  assert.equal(setup.required_capabilities.some((item: { id: string }) => item.id === "programmatic-harness"), false);
  for (const skill of versions.skills) {
    const current = await readFile(`public${skill.current}`, "utf8");
    const numbered = await readFile(`public${skill.versioned}`, "utf8");
    assert.equal(current, numbered, `${skill.id} current and numbered skill contents match`);
    assert.match(current, new RegExp(`^version: ${skill.version}$`, "m"));
  }
  for (const id of ["starter-pack", "computer-setup"]) {
    const entry = skills.skills.find((item: { id: string }) => item.id === id);
    const release = versions.skills.find((item: { id: string }) => item.id === id);
    assert.ok(entry && release, `${id} is present in both skill catalogs`);
    assert.equal(entry.sourceVersion, release.version);
  }
});

test("learner-facing proof copy describes the same file across both checks", async () => {
  const [phase, guide, proof] = await Promise.all([
    readFile("content/phases/2.md", "utf8"),
    readFile("content/pages/guide.md", "utf8"),
    readFile("public/setup/programmatic-harness.md", "utf8"),
  ]);
  for (const [label, text] of [["Phase 2", phase], ["Guide", guide], ["proof guide", proof]] as const) {
    assert.ok(text.includes("proof.txt"), `${label} names proof.txt`);
    assert.ok(text.includes("hello world"), `${label} describes the first content check`);
    assert.ok(text.includes("hello Codex"), `${label} describes the resumed content check`);
  }
});
