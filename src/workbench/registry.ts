export const phaseIds = ["phase-1", "phase-2", "phase-3"] as const;
export type Phase = (typeof phaseIds)[number];
export type RequirementLevel = "required" | "recommended" | "optional";
export type RequirementSemantics = "all_of" | "any_of";

export type RequirementExpression =
  | { all_of: string[]; any_of?: never }
  | { any_of: string[]; all_of?: never };

export interface RegistryGroup {
  title?: string;
  semantics: RequirementSemantics;
  members: string[];
}

export interface RegistryStep {
  title: string;
  phase: Phase;
  requirement: RequirementLevel;
  gate_for: Phase[];
  prerequisites: string[];
  completion_meaning: string;
  completion?: RequirementExpression;
  allow_recorded_completion?: boolean;
  evidence: string[];
  guide?: string;
  aliases?: string[];
  internal?: boolean;
  legacy?: boolean;
}

export interface RegistryPhase {
  gate?: RequirementExpression;
  optional?: string[];
  preview?: boolean;
}

export interface RequirementsRegistry {
  version: string;
  requirements_revision: string;
  phases: Record<Phase, RegistryPhase>;
  groups: Record<string, RegistryGroup>;
  steps: Record<string, RegistryStep>;
  aliases: Record<string, string>;
}

export interface CatalogPhase {
  id: Phase;
  title: string;
  url: string;
  preview: boolean;
}

export interface RegistryCatalog {
  version: string;
  requirements_revision: string;
  phases: CatalogPhase[];
  steps: Record<string, RegistryStep & { url: string }>;
  aliases: RequirementsRegistry["aliases"];
  groups: RequirementsRegistry["groups"];
  requirements: RequirementsRegistry;
}

export type PhaseRequirements = Omit<RequirementsRegistry, "phases"> & {
  phases: Partial<Record<Phase, RegistryPhase>>;
};

const guideOrigin = "https://starter.devthomas.site";
const idPattern = /^(?!(?:constructor|prototype)$)[a-z0-9]+(?:-[a-z0-9]+)*$/;
const guidePattern = /^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*(?:#[a-zA-Z0-9_-]+)?$/;

function invalid(path: string, expected: string): never {
  throw new Error("Invalid requirements registry at " + path + ": expected " + expected);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!isPlainRecord(value)) return invalid(path, "a plain object");
  return value;
}

function fields(value: Record<string, unknown>, allowed: string[], path: string) {
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid(path, "only supported fields");
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) return invalid(path, "a nonempty string");
  return value;
}

function identifier(value: unknown, path: string): string {
  const id = string(value, path);
  if (!idPattern.test(id)) invalid(path, "a safe lowercase hyphenated ID");
  return id;
}

function list(value: unknown, path: string, nonempty = false, ids = true): string[] {
  if (!Array.isArray(value)) return invalid(path, "an array");
  const result = value.map(item => ids ? identifier(item, path) : string(item, path));
  if ((nonempty && !result.length) || new Set(result).size !== result.length) {
    invalid(path, "a " + (nonempty ? "nonempty " : "") + "list of unique IDs");
  }
  return result;
}

function phase(value: unknown, path: string): Phase {
  if (value === "phase-1" || value === "phase-2" || value === "phase-3") return value;
  return invalid(path, "a supported phase ID");
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") return invalid(path, "a boolean");
  return value;
}

function expression(value: unknown, path: string): RequirementExpression {
  const raw = record(value, path);
  fields(raw, ["all_of", "any_of"], path);
  if (Object.hasOwn(raw, "all_of") === Object.hasOwn(raw, "any_of")) {
    invalid(path, "exactly one of all_of or any_of");
  }
  return Object.hasOwn(raw, "all_of")
    ? { all_of: list(raw.all_of, path + ".all_of", true) }
    : { any_of: list(raw.any_of, path + ".any_of", true) };
}

export function expressionMembers(value: RequirementExpression): string[] {
  return value.all_of ?? value.any_of;
}

function parsePhase(value: unknown, id: Phase): RegistryPhase {
  const path = "phases." + id;
  const raw = record(value, path);
  fields(raw, ["gate", "optional", "preview"], path);
  const result: RegistryPhase = {};
  if (Object.hasOwn(raw, "gate")) result.gate = expression(raw.gate, path + ".gate");
  if (Object.hasOwn(raw, "optional")) result.optional = list(raw.optional, path + ".optional");
  if (Object.hasOwn(raw, "preview")) result.preview = boolean(raw.preview, path + ".preview");
  if (id === "phase-3") {
    if (result.preview !== true || result.gate) invalid(path, "Phase 3 preview without a graduation gate");
  } else if (!result.gate || result.preview === true) {
    invalid(path, "a released phase with an explicit gate");
  }
  return result;
}

function parseGroup(value: unknown, id: string): RegistryGroup {
  const path = "groups." + id;
  const raw = record(value, path);
  fields(raw, ["title", "semantics", "members"], path);
  if (raw.semantics !== "all_of" && raw.semantics !== "any_of") {
    invalid(path + ".semantics", "all_of or any_of");
  }
  return {
    ...(Object.hasOwn(raw, "title") ? { title: string(raw.title, path + ".title") } : {}),
    semantics: raw.semantics,
    members: list(raw.members, path + ".members", true),
  };
}

function parseStep(value: unknown, id: string): RegistryStep {
  const path = "steps." + id;
  const raw = record(value, path);
  fields(raw, ["title", "phase", "requirement", "gate_for", "prerequisites", "completion_meaning",
    "completion", "allow_recorded_completion", "evidence", "guide", "aliases", "internal", "legacy"], path);
  if (raw.requirement !== "required" && raw.requirement !== "recommended" && raw.requirement !== "optional") {
    invalid(path + ".requirement", "a supported requirement level");
  }
  const result: RegistryStep = {
    title: string(raw.title, path + ".title"),
    phase: phase(raw.phase, path + ".phase"),
    requirement: raw.requirement,
    gate_for: list(raw.gate_for, path + ".gate_for").map(item => phase(item, path + ".gate_for")),
    prerequisites: list(raw.prerequisites, path + ".prerequisites"),
    completion_meaning: string(raw.completion_meaning, path + ".completion_meaning"),
    evidence: list(raw.evidence, path + ".evidence", true, false),
  };
  if (Object.hasOwn(raw, "completion")) result.completion = expression(raw.completion, path + ".completion");
  if (Object.hasOwn(raw, "aliases")) result.aliases = list(raw.aliases, path + ".aliases");
  if (Object.hasOwn(raw, "guide")) {
    const guide = string(raw.guide, path + ".guide");
    if (!guidePattern.test(guide) || /\/\.\.?(?:\/|#|$)/.test(guide)) {
      invalid(path + ".guide", "a safe absolute site path");
    }
    result.guide = guide;
  }
  if (Object.hasOwn(raw, "allow_recorded_completion")) {
    if (!["core-accounts", "instant-builder"].includes(id) || !result.completion) {
      invalid(path + ".allow_recorded_completion", "an explicit supported aggregate exception with a completion expression");
    }
    result.allow_recorded_completion = boolean(raw.allow_recorded_completion, path + ".allow_recorded_completion");
  }
  if (Object.hasOwn(raw, "internal")) result.internal = boolean(raw.internal, path + ".internal");
  if (Object.hasOwn(raw, "legacy")) result.legacy = boolean(raw.legacy, path + ".legacy");
  return result;
}

export function parseRegistry(value: unknown): RequirementsRegistry {
  const raw = record(value, "registry");
  fields(raw, ["version", "requirements_revision", "phases", "groups", "steps", "aliases", "id", "updated_at"], "registry");
  if (Object.hasOwn(raw, "id") && raw.id !== "starter-pack-requirements") invalid("id", "the requirements resource ID");
  if (Object.hasOwn(raw, "updated_at")) {
    const date = string(raw.updated_at, "updated_at");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))
      || new Date(date).toISOString().slice(0, 10) !== date) invalid("updated_at", "an ISO calendar date");
  }
  const rawPhases = record(raw.phases, "phases");
  fields(rawPhases, [...phaseIds], "phases");
  const phases: RequirementsRegistry["phases"] = {
    "phase-1": parsePhase(rawPhases["phase-1"], "phase-1"),
    "phase-2": parsePhase(rawPhases["phase-2"], "phase-2"),
    "phase-3": parsePhase(rawPhases["phase-3"], "phase-3"),
  };
  // Object.fromEntries creates own data properties; no dynamic writes through Object.prototype.
  const groups = Object.fromEntries(Object.entries(record(raw.groups, "groups"))
    .map(([id, group]) => [identifier(id, "groups"), parseGroup(group, id)]));
  const steps = Object.fromEntries(Object.entries(record(raw.steps, "steps"))
    .map(([id, step]) => [identifier(id, "steps"), parseStep(step, id)]));
  const aliases = Object.fromEntries(Object.entries(record(raw.aliases, "aliases"))
    .map(([id, target]) => [identifier(id, "aliases"), identifier(target, "aliases." + id)]));
  if (!Object.keys(steps).length) invalid("steps", "at least one registered outcome");

  const known = new Set([...Object.keys(groups), ...Object.keys(steps)]);
  if (known.size !== Object.keys(groups).length + Object.keys(steps).length) invalid("groups", "IDs distinct from steps");
  if (phaseIds.some(id => known.has(id) || Object.hasOwn(aliases, id))) invalid("IDs", "step, group and alias IDs distinct from phase IDs");
  for (const [alias, target] of Object.entries(aliases)) {
    if (known.has(alias) || !Object.hasOwn(steps, target)) {
      invalid("aliases." + alias, "a distinct alias pointing directly to a canonical step, never a group or another alias");
    }
  }
  for (const [id, step] of Object.entries(steps)) {
    for (const alias of step.aliases ?? []) {
      if (!Object.hasOwn(aliases, alias) || aliases[alias] !== id) {
        invalid("steps." + id + ".aliases", "metadata matching the canonical alias table");
      }
    }
  }
  const checkReference = (id: string, path: string) => {
    if (!known.has(id)) invalid(path, "a canonical step or group reference, not an alias");
  };
  const graph = new Map<string, string[]>();
  for (const [id, group] of Object.entries(groups)) {
    group.members.forEach(member => checkReference(member, "groups." + id + ".members"));
    graph.set(id, group.members);
  }
  for (const [id, step] of Object.entries(steps)) {
    const dependencies = [...step.prerequisites, ...(step.completion ? expressionMembers(step.completion) : [])];
    dependencies.forEach(dependency => checkReference(dependency, "steps." + id));
    graph.set(id, dependencies);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) invalid("dependencies." + id, "an acyclic completion and prerequisite graph (cycle detected)");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of graph.get(id) ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of known) visit(id);

  const participates = new Map<string, Set<Phase>>(Object.keys(steps).map(id => [id, new Set<Phase>()]));
  const inspectPrerequisites = (id: string, owner: RegistryStep, gated: boolean, seen = new Set<string>(), builderChoice = false) => {
    const key = id + ":" + builderChoice;
    if (seen.has(key)) return;
    seen.add(key);
    if (Object.hasOwn(groups, id)) {
      const group = groups[id];
      const isChoice = id === "instant-builder-choice" && group.semantics === "any_of" && group.members.length > 1;
      for (const member of group.members) inspectPrerequisites(member, owner, gated, seen, isChoice);
    } else {
      const prerequisite = steps[id];
      if (phaseIds.indexOf(prerequisite.phase) > phaseIds.indexOf(owner.phase)) {
        invalid("steps." + id + ".phase", "no later-phase prerequisite");
      }
      if (gated && prerequisite.requirement !== "required" && !(builderChoice && prerequisite.phase === "phase-1" && prerequisite.requirement === "optional" && !prerequisite.completion)) {
        invalid("steps." + id + ".requirement", "required prerequisites for gated outcomes, never optional intake");
      }
      for (const child of graph.get(id) ?? []) inspectPrerequisites(child, owner, gated, seen);
    }
  };
  const inspectedGates = new Set<string>();
  const inspectGate = (id: string, phaseId: Phase, builderChoice = false) => {
    checkReference(id, "phases." + phaseId + ".gate");
    const key = phaseId + ":" + id + ":" + builderChoice;
    if (inspectedGates.has(key)) return;
    inspectedGates.add(key);
    if (Object.hasOwn(groups, id)) {
      const group = groups[id];
      const isChoice = id === "instant-builder-choice" && group.semantics === "any_of" && group.members.length > 1;
      for (const member of group.members) inspectGate(member, phaseId, isChoice);
    } else {
      const step = steps[id];
      if (step.phase !== phaseId) invalid("steps." + id + ".phase", "gates confined to their own phase");
      if (step.requirement !== "required" && !(builderChoice && step.phase === "phase-1" && step.requirement === "optional" && !step.completion)) {
        invalid("steps." + id + ".requirement", "required outcomes or a conditional instant-builder alternative");
      }
      participates.get(id)?.add(phaseId);
      if (step.completion) for (const member of expressionMembers(step.completion)) inspectGate(member, phaseId);
    }
  };
  for (const id of phaseIds) {
    const config = phases[id];
    if (config.gate) for (const member of expressionMembers(config.gate)) inspectGate(member, id);
    for (const optional of config.optional ?? []) {
      if (!Object.hasOwn(steps, optional) || steps[optional].phase !== id || steps[optional].requirement === "required") {
        invalid("phases." + id + ".optional", "non-required canonical steps in this phase");
      }
    }
  }
  for (const [id, step] of Object.entries(steps)) {
    const expected = participates.get(id)!;
    if (step.gate_for.length !== expected.size || step.gate_for.some(phaseId => !expected.has(phaseId))) {
      invalid("steps." + id + ".gate_for", "exactly the phases whose gate expressions include this outcome");
    }
    if (step.requirement === "required" && !expected.size) invalid("steps." + id, "required outcomes included in a released phase gate");
    for (const prerequisite of step.prerequisites) inspectPrerequisites(prerequisite, step, expected.size > 0);
  }
  return {
    version: string(raw.version, "version"),
    requirements_revision: string(raw.requirements_revision, "requirements_revision"),
    phases, groups, steps, aliases,
  };
}

export function projectCatalog(registry: RequirementsRegistry, phasePages: CatalogPhase[]): RegistryCatalog {
  const phases = phaseIds.map(id => {
    const page = phasePages.find(page => page.id === id);
    const expectedUrl = guideOrigin + "/phases/" + id.slice(-1);
    if (!page || page.url !== expectedUrl || !page.title.trim()) invalid("catalog.phases", "one titled guide page per phase");
    return { ...page, preview: registry.phases[id].preview === true };
  });
  if (phasePages.length !== phaseIds.length) invalid("catalog.phases", "exactly the supported phases");
  return {
    version: registry.version,
    requirements_revision: registry.requirements_revision,
    phases,
    steps: Object.fromEntries(Object.entries(registry.steps).map(([id, step]) => [id, {
      ...step, url: guideOrigin + "/phases/" + step.phase.slice(-1),
    }])),
    aliases: registry.aliases,
    groups: registry.groups,
    requirements: registry,
  };
}

export function projectPhaseRequirements(registry: RequirementsRegistry, phaseId: Phase): PhaseRequirements {
  const included = new Set<string>();
  const include = (id: string) => {
    if (included.has(id)) return;
    included.add(id);
    if (Object.hasOwn(registry.groups, id)) {
      registry.groups[id].members.forEach(include);
    } else {
      const step = registry.steps[id];
      if (!step) invalid("phase projection", "a known dependency");
      step.prerequisites.forEach(include);
      if (step.completion) expressionMembers(step.completion).forEach(include);
    }
  };
  const config = registry.phases[phaseId];
  if (config.gate) expressionMembers(config.gate).forEach(include);
  (config.optional ?? []).forEach(include);
  return {
    version: registry.version,
    requirements_revision: registry.requirements_revision,
    phases: { [phaseId]: config },
    groups: Object.fromEntries(Object.entries(registry.groups).filter(([id]) => included.has(id))),
    steps: Object.fromEntries(Object.entries(registry.steps).filter(([id]) => included.has(id))),
    aliases: Object.fromEntries(Object.entries(registry.aliases).filter(([, target]) => included.has(target))),
  };
}
