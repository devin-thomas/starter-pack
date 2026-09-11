import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import * as registryModule from "../src/workbench/registry";
import type { RequirementsRegistry } from "../src/workbench/registry";

const source: RequirementsRegistry = JSON.parse(await readFile("content/workbench-steps.json", "utf8"));
const schema = JSON.parse(await readFile("public/schemas/requirements.schema.json", "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const fresh = () => structuredClone(source);
const resource = (registry: RequirementsRegistry) => ({ id: "starter-pack-requirements", updated_at: "2026-09-10", ...registry });
const has = (value: object, key: string) => Object.hasOwn(value, key);

test("canonical source and public resource satisfy the same registry contract", () => {
  const parsed = registryModule.parseRegistry(source);
  assert.deepEqual(parsed, source);
  assert.ok(validate(source), ajv.errorsText(validate.errors));
  assert.ok(validate(resource(parsed)), ajv.errorsText(validate.errors));
  assert.deepEqual(registryModule.parseRegistry(resource(parsed)), parsed);
  for (const step of Object.values(parsed.steps)) assert.ok(step.completion_meaning.trim());
});

test("expressions reject empty, duplicate, ambiguous and unknown members", () => {
  for (const gate of [{ all_of: [] }, { any_of: [] }, { all_of: ["instant-build", "instant-build"] }, { all_of: ["instant-build"], any_of: ["instant-build"] }, { all_of: ["instant-build"], typo: true }]) {
    const data = fresh();
    Object.assign(data.phases["phase-1"], { gate });
    assert.throws(() => registryModule.parseRegistry(data));
    assert.equal(validate(resource(data)), false);
  }
  const data = fresh();
  data.phases["phase-1"].gate = { all_of: ["unregistered-outcome"] };
  assert.throws(() => registryModule.parseRegistry(data));
});

test("IDs cannot collide, shadow object properties, or introduce alias chains", () => {
  const mutations: ((data: RequirementsRegistry) => void)[] = [
    data => { data.groups.github = { semantics: "all_of", members: ["neon"] }; },
    data => { data.aliases.github = "neon"; },
    data => { data.aliases["instant-app-old"] = "instant-app"; },
    data => { data.aliases["instant-app"] = "core-account-services"; },
    data => { data.aliases["constructor"] = "instant-build"; },
    data => { data.steps["constructor"] = structuredClone(data.steps.github); },
    data => { data.steps = Object.fromEntries([...Object.entries(data.steps), ["__proto__", data.steps.github]]); },
    data => { data.steps["unsafe/id"] = structuredClone(data.steps.github); },
    data => { data.steps.github.prerequisites = ["toString"]; },
    data => { data.steps["instant-build"].aliases = ["unregistered-alias"]; },
  ];
  for (const mutate of mutations) {
    const data = fresh();
    mutate(data);
    assert.throws(() => registryModule.parseRegistry(data));
  }
  assert.equal(has({}, "polluted"), false);
});

test("completion, group and prerequisite edges form one acyclic graph", () => {
  const mutations: ((data: RequirementsRegistry) => void)[] = [
    data => { data.groups["computer-baseline"].members.push("computer-setup"); },
    data => { data.steps.github.prerequisites = ["core-accounts"]; },
    data => { data.steps.github.prerequisites = ["neon"]; data.steps.neon.prerequisites = ["github"]; },
    data => { data.steps["instant-build"].completion = { all_of: ["instant-build"] }; },
  ];
  for (const mutate of mutations) {
    const data = fresh();
    mutate(data);
    assert.throws(() => registryModule.parseRegistry(data), /cycl/i);
  }
});

test("optional choices stay optional and Phase 1 stays phone-only", () => {
  const mutations: ((data: RequirementsRegistry) => void)[] = [
    data => { data.phases["phase-1"].gate = { all_of: ["get-started"] }; },
    data => { data.steps["primary-ai-phone-app"].prerequisites = ["get-started"]; },
    data => { data.steps["primary-ai-phone-app"].prerequisites = ["computer-setup"]; },
    data => { data.phases["phase-2"].gate = { all_of: ["development-email"] }; },
    data => { data.groups["core-account-services"].members.push("lovable"); },
    data => { data.phases["phase-2"].optional = ["quick-build"]; },
    data => { data.phases["phase-2"].optional = ["missing-optional"]; },
    data => { data.phases["phase-3"].gate = { all_of: ["quick-build"] }; },
    data => { data.steps["quick-build"].gate_for = []; },
  ];
  for (const mutate of mutations) {
    const data = fresh();
    mutate(data);
    assert.throws(() => registryModule.parseRegistry(data));
  }
  const registry = registryModule.parseRegistry(source);
  assert.deepEqual(registry.groups["instant-builder-choice"].semantics, "any_of");
  assert.deepEqual(registry.steps["private-progress-repository"].prerequisites, []);
  assert.deepEqual(registry.phases["phase-3"], { preview: true });
});

test("only the two deliberate aggregate exceptions can accept a recorded completion", () => {
  const registry = registryModule.parseRegistry(source);
  assert.deepEqual(Object.entries(registry.steps).filter(([, step]) => step.allow_recorded_completion).map(([id]) => id).sort(), ["core-accounts", "instant-builder"]);
  for (const id of ["computer-setup", "tailscale-network", "quick-build"]) {
    const data = fresh();
    data.steps[id].allow_recorded_completion = true;
    assert.throws(() => registryModule.parseRegistry(data));
    assert.equal(validate(resource(data)), false);
  }
  const data = fresh();
  Object.assign(data.groups["computer-baseline"], { allow_recorded_completion: true });
  assert.throws(() => registryModule.parseRegistry(data));
  assert.equal(validate(resource(data)), false);
});

test("Phase 2 explicitly retains every independent required capability", () => {
  const registry = registryModule.parseRegistry(source);
  assert.ok(registry.groups["computer-baseline"].members.includes("cli-contexts"));
  assert.deepEqual(registry.steps["tailscale-network"].completion, { all_of: ["tailscale-devices-and-network"] });
  assert.deepEqual(registry.groups["tailscale-devices-and-network"].members, ["tailscale-computer", "tailscale-phone", "private-network-identity"]);
  for (const id of ["phone-to-computer-file", "computer-to-phone-file", "verified-phone-connection", "final-progress-save"]) assert.deepEqual(registry.steps[id].gate_for, ["phase-2"]);
  assert.ok(registry.phases["phase-2"].gate?.all_of?.includes("final-progress-save"));
  assert.match(registry.steps["quick-build"].completion_meaning, /durable source/i);
  assert.match(registry.steps["live-deployment"].completion_meaning, /primary.*behavior/i);
  assert.match(registry.steps["final-progress-save"].completion_meaning, /remote.*verif|verif.*remote/i);
  assert.equal(has(registry.aliases, "phase-2-project"), false);
});

test("instant-builder alternatives preserve the approved recommendation IDs", async () => {
  const recommendations: { id: string; category: string }[] = JSON.parse(await readFile("content/recommendations.json", "utf8"));
  const approved = recommendations.filter(item => item.category === "instant-builder").map(item => item.id).sort();
  assert.deepEqual([...source.groups["instant-builder-choice"].members].sort(), approved);
  assert.equal(has(source.steps, "v0"), false);
});

test("registry metadata and guides reject mistyped or unsafe fields", () => {
  const mutations: ((data: RequirementsRegistry) => void)[] = [
    data => { data.steps.github.completion_meaning = "  "; },
    data => { data.steps.github.evidence = []; },
    data => { data.steps.github.guide = "javascript:alert(1)"; },
    data => { data.steps.github.guide = "//evil.example"; },
    data => { data.steps.github.guide = "/setup/../secret"; },
    data => { Object.assign(data.steps.github, { unexpected: true }); },
    data => { Object.assign(data.phases, { "phase-4": { preview: true } }); },
    data => { Object.assign(data, { requirements_revision: " " }); },
  ];
  for (const mutate of mutations) {
    const data = fresh();
    mutate(data);
    assert.throws(() => registryModule.parseRegistry(data));
    assert.equal(validate(resource(data)), false);
  }
});

test("catalog and phase packet projections are lossless, revision-aligned and self-contained", async () => {
  assert.equal(typeof registryModule.projectCatalog, "function");
  assert.equal(typeof registryModule.projectPhaseRequirements, "function");
  const registry = registryModule.parseRegistry(source);
  const before = JSON.stringify(registry);
  const phases = registryModule.phaseIds.map((id, index) => ({ id, title: `Phase ${index + 1}`, url: `https://starter.devthomas.site/phases/${index + 1}`, preview: index === 2 }));
  const catalog = registryModule.projectCatalog(registry, phases);
  assert.deepEqual(catalog.requirements, registry);
  assert.equal(catalog.requirements_revision, registry.requirements_revision);
  assert.equal(has(catalog.requirements, "revision"), false);
  for (const [id, step] of Object.entries(registry.steps)) assert.deepEqual(catalog.steps[id], { ...step, url: `https://starter.devthomas.site/phases/${step.phase.slice(-1)}` });
  const withAliasMetadata = fresh();
  withAliasMetadata.steps["instant-build"].aliases = ["instant-app"];
  assert.deepEqual(registryModule.projectCatalog(registryModule.parseRegistry(withAliasMetadata), phases).steps["instant-build"].aliases, ["instant-app"]);
  const snapshot = registryModule.projectPhaseRequirements(registry, "phase-1");
  assert.deepEqual(Object.keys(snapshot.phases), ["phase-1"]);
  assert.deepEqual(snapshot.aliases, { "instant-app": "instant-build" });
  assert.ok(has(snapshot.steps, "instant-build"));
  assert.equal(has(snapshot.steps, "computer-setup"), false);
  const references = [
    ...(snapshot.phases["phase-1"]?.gate?.all_of ?? []),
    ...(snapshot.phases["phase-1"]?.optional ?? []),
    ...Object.values(snapshot.groups).flatMap(group => group.members),
    ...Object.values(snapshot.steps).flatMap(step => [...step.prerequisites, ...(step.completion?.all_of ?? step.completion?.any_of ?? [])]),
  ];
  for (const reference of references) assert.ok(has(snapshot.steps, reference) || has(snapshot.groups, reference), reference);
  for (const [id, step] of Object.entries(snapshot.steps)) {
    assert.equal(step.phase, "phase-1");
    assert.deepEqual(step, registry.steps[id]);
  }
  const { instructionPacket, generateResources, loadContent } = await import("./content");
  const packet = await instructionPacket();
  const embedded = packet.match(/<!-- PHASE_REQUIREMENTS_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- PHASE_REQUIREMENTS_END -->/);
  assert.ok(embedded, "Phone packet contains generated registry data, not a link-only gate summary");
  assert.deepEqual(JSON.parse(embedded[1]), snapshot);
  const temporary = await mkdtemp(path.join(os.tmpdir(), "starter-pack-registry-"));
  try {
    const data = await loadContent();
    await generateResources(data, temporary);
    const published = JSON.parse(await readFile(path.join(temporary, "agent/requirements.json"), "utf8"));
    assert.ok(validate(published), ajv.errorsText(validate.errors));
    assert.deepEqual(registryModule.parseRegistry(published), registry);
    const { buildWorkbench } = await import("./workbench");
    await buildWorkbench(temporary, data);
    const workbenchPath = path.join(temporary, "artifacts/progress-workbench");
    const publishedCatalog = JSON.parse(await readFile(path.join(workbenchPath, "catalog.json"), "utf8"));
    assert.deepEqual(publishedCatalog.requirements, registry);
    assert.deepEqual(publishedCatalog.steps, catalog.steps);
    const bundle = await readFile(path.join(workbenchPath, "index.html"));
    const manifest = JSON.parse(await readFile(path.join(workbenchPath, "manifest.json"), "utf8"));
    assert.equal(manifest.requirements_revision, registry.requirements_revision);
    assert.equal(manifest.bytes, bundle.byteLength);
    assert.equal(manifest.sha256, createHash("sha256").update(bundle).digest("hex"));
    assert.ok(bundle.toString().includes(registry.requirements_revision));
  } finally {
    assert.equal(path.dirname(path.resolve(temporary)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temporary).startsWith("starter-pack-registry-"));
    await rm(temporary, { recursive: true, force: true });
  }
  assert.equal(JSON.stringify(registry), before);
});
