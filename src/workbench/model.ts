import { parseRegistry, type Phase, type RequirementsRegistry, type RegistryStep, type RequirementExpression, type RequirementLevel } from "./registry";
export type { Phase, RequirementExpression, RequirementLevel } from "./registry";
export type Status = "not_started" | "in_progress" | "completed" | "skipped" | "deferred" | "not_applicable";
export type PhaseStatus = "not_started" | "in_progress" | "completed";
export interface Step {
  status: Status;
  phase?: Phase;
  updated_at?: string;
  notes?: string[];
  next_action?: string;
  blocker?: string;
  [key: string]: unknown;
}
export interface Progress {
  schema_version: number;
  starter_pack_version: string;
  updated_at: string;
  phase: { current: Phase; status: PhaseStatus; requirements_revision?: string; completed_at?: string; [key: string]: unknown };
  environment?: { device?: string; os?: string | null; harness?: string | null; remote_access_ready?: boolean; [key: string]: unknown };
  steps: Record<string, Step>;
  choices?: Record<string, unknown>;
  artifacts?: Record<string, unknown>;
  [key: string]: unknown;
}
export interface CatalogStep extends Partial<RegistryStep> { title: string; phase: Phase; url: string }
export interface Catalog {
  version: string;
  requirements_revision?: string;
  phases: { id: Phase; title: string; url: string; preview: boolean }[];
  steps: Record<string, CatalogStep>;
  aliases?: Record<string, string>;
  groups?: RequirementsRegistry["groups"];
  requirements?: RequirementsRegistry;
}
export const statuses: Record<Status, string> = {
  not_started: "Not started", in_progress: "In progress", completed: "Completed",
  skipped: "Skipped", deferred: "Saved for later", not_applicable: "Not applicable",
};
const terminalStatuses = new Set<Status>(["completed", "skipped", "not_applicable"]);
// Read-only view metadata cannot be supplied by learner fields or written to progress.
const limitedViews = new WeakSet<Progress>();
export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function own<T>(object: Record<string, T> | undefined, key: string): T | undefined {
  return object && Object.hasOwn(object, key) ? object[key] : undefined;
}
export function humanize(value: string) { return value.replace(/[-_]+/g, " ").replace(/^./, letter => letter.toUpperCase()); }
export function canonicalId(id: string, catalog: Catalog): string { return own(catalog.requirements?.aliases ?? catalog.aliases, id) ?? id; }
function definitionFor(id: string, catalog: Catalog) {
  const key = canonicalId(id, catalog);
  return own(catalog.requirements?.steps, key) ?? own(catalog.steps, key);
}
export function titleFor(id: string, catalog: Catalog) { return definitionFor(id, catalog)?.title ?? own(catalog.requirements?.groups, id)?.title ?? humanize(id); }
export function phaseFor(id: string, step: Step, catalog: Catalog): Phase | undefined { return definitionFor(id, catalog)?.phase ?? step.phase; }
interface Satisfaction { complete: boolean; conflicts: string[]; explicitIncomplete: boolean }
function evaluateExpression(expression: RequirementExpression, progress: Progress, catalog: Catalog, seen: Set<string>): Satisfaction {
  const members = expression.all_of ?? expression.any_of ?? [];
  const results = members.map(member => evaluateRequirement(member, progress, catalog, seen));
  const complete = members.length > 0 && (expression.any_of ? results.some(result => result.complete) : results.every(result => result.complete));
  // An unused builder is not an incomplete required account.
  if (expression.any_of && complete) return { complete: true, conflicts: [], explicitIncomplete: false };
  return { complete, conflicts: results.flatMap(result => result.conflicts), explicitIncomplete: expression.any_of ? results.every(result => result.explicitIncomplete) : results.some(result => result.explicitIncomplete) };
}
function evaluateRequirement(id: string, progress: Progress, catalog: Catalog, seen = new Set<string>()): Satisfaction {
  const key = canonicalId(id, catalog);
  if (seen.has(key)) return { complete: false, conflicts: [`${titleFor(key, catalog)}: circular requirement`], explicitIncomplete: true };
  const next = new Set(seen).add(key);
  const definition = definitionFor(key, catalog);
  const group = own(catalog.requirements?.groups ?? catalog.groups, key);
  // Group records cannot bypass the actual member checks.
  const ids = definition ? Object.keys(progress.steps).filter(candidate => canonicalId(candidate, catalog) === key) : [];
  const recorded = new Set(ids.map(candidate => progress.steps[candidate].status));
  if (recorded.size > 1) return { complete: false, conflicts: [`${titleFor(key, catalog)}: conflicting alias records`], explicitIncomplete: true };
  const direct = recorded.has("completed");
  const explicitIncomplete = recorded.size > 0 && !direct;
  const expression = definition?.completion ?? (group ? group.semantics === "any_of" ? { any_of: group.members } : { all_of: group.members } : undefined);
  if (!expression) return { complete: direct, conflicts: [], explicitIncomplete };
  const derived = evaluateExpression(expression, progress, catalog, next);
  if ((direct && derived.explicitIncomplete) || (explicitIncomplete && derived.complete)) return { complete: false, conflicts: [`${titleFor(key, catalog)}: summary conflicts with recorded detail`, ...derived.conflicts], explicitIncomplete: true };
  if (direct && definition?.allow_recorded_completion && !derived.conflicts.length) return { complete: true, conflicts: [], explicitIncomplete: false };
  return { ...derived, explicitIncomplete: explicitIncomplete || derived.explicitIncomplete };
}
export interface PhaseGate { phase: Phase; complete: boolean; missing: string[]; conflicts: string[] }
export function phaseGate(progress: Progress, catalog: Catalog, phase = progress.phase.current): PhaseGate | undefined {
  const gate = catalog.requirements?.phases[phase]?.gate;
  if (!gate) return undefined;
  const result = evaluateExpression(gate, progress, catalog, new Set());
  const limited = limitedViews.has(progress);
  const contradictoryClaim = completionCandidates(progress, phase).some(entry => entry.requirements_revision === catalog.requirements_revision) && !result.complete;
  const missing = (gate.all_of ?? gate.any_of ?? []).filter(id => !evaluateRequirement(id, progress, catalog).complete);
  return { phase, complete: result.complete && !limited, missing: result.complete ? [] : missing, conflicts: [...new Set([...result.conflicts, ...(limited ? ["Completion withheld: repair core progress data first"] : []), ...(contradictoryClaim ? ["Completion claim conflicts with current required outcomes"] : [])])] };
}
export interface CompletionRecord { phase: Phase; requirements_revision?: string; recorded_at?: string; evidence_summary?: string; source?: string }
function validHistoryEntry(entry: unknown): entry is CompletionRecord & { status: PhaseStatus } {
  return record(entry) && validPhase(entry.phase) && validPhaseStatus(entry.status)
    && typeof entry.requirements_revision === "string" && !!entry.requirements_revision.trim()
    && typeof entry.source === "string" && !!entry.source.trim()
    && (entry.recorded_at === undefined || timestamp(entry.recorded_at))
    && (entry.evidence_summary === undefined || typeof entry.evidence_summary === "string");
}
function completionCandidates(progress: Progress, phase: Phase): CompletionRecord[] {
  const candidates: CompletionRecord[] = [];
  if (progress.phase.current === phase && progress.phase.status === "completed") candidates.push({ phase, ...(typeof progress.phase.requirements_revision === "string" ? { requirements_revision: progress.phase.requirements_revision } : {}), ...(typeof progress.phase.completed_at === "string" ? { recorded_at: progress.phase.completed_at } : {}) });
  const history = progress.artifacts?.phase_history;
  if (Array.isArray(history)) candidates.push(...history.filter(validHistoryEntry).filter(entry => entry.phase === phase && entry.status === "completed").reverse());
  return candidates;
}
export function phaseCompletion(progress: Progress, phase: Phase, catalog?: Catalog): CompletionRecord | undefined {
  if (limitedViews.has(progress) || phase === "phase-3") return undefined;
  return completionCandidates(progress, phase).find(entry => !catalog?.requirements_revision || entry.requirements_revision !== catalog.requirements_revision || phaseGate(progress, catalog, phase)?.complete);
}
export function currentStep(progress: Progress, catalog: Catalog): [string, Step] | undefined {
  if (phaseCompletion(progress, progress.phase.current, catalog) || phaseGate(progress, catalog)?.complete) return undefined;
  const eligible = (id: string, step: Step) => phaseFor(id, step, catalog) === progress.phase.current && !terminalStatuses.has(step.status);
  const preference = progress.choices?.workbench;
  if (record(preference) && typeof preference.next_step_id === "string") {
    const id = preference.next_step_id;
    const step = own(progress.steps, id);
    if (step && eligible(id, step)) return [id, step];
  }
  const entries = Object.entries(progress.steps).filter(([id, step]) => eligible(id, step));
  for (const status of ["in_progress", "deferred", "not_started"] as const) {
    const entry = entries.find(([id, step]) => step.status === status && definitionFor(id, catalog)?.requirement !== "optional");
    if (entry) return entry;
  }
  return entries[0];
}
export function safeLink(value: string): string | undefined {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
}
export function summary(progress: Progress, catalog: Catalog) {
  const current = currentStep(progress, catalog);
  const gate = phaseGate(progress, catalog);
  const completed = phaseCompletion(progress, progress.phase.current, catalog);
  return [
    `Starter Pack progress (${progress.updated_at})`,
    `${catalog.phases.find(phase => phase.id === progress.phase.current)?.title ?? humanize(progress.phase.current)}: ${progress.phase.current === "phase-3" ? "Preview" : progress.phase.status === "completed" && !completed ? "Completion needs reconciliation" : statuses[progress.phase.status]}`,
    ...(completed ? [`Completion recorded under requirements ${completed.requirements_revision ?? "not recorded"}; historical completion is preserved.`] : []),
    ...(gate ? [`${completed ? "Current requirements update checklist" : "Required outcomes"}: ${gate.complete ? "complete" : gate.conflicts.length ? "needs reconciliation" : `${gate.missing.map(id => titleFor(id, catalog)).join(", ")} remaining`}`] : []),
    ...Object.entries(progress.steps).map(([id, step]) => `${titleFor(id, catalog)}: ${statuses[step.status]}`),
    ...(current?.[1].next_action ? [`Next action: ${current[1].next_action}`] : []),
    ...(current?.[1].blocker ? [`Blocker: ${current[1].blocker}`] : []),
  ].join("\n");
}
function validStatus(value: unknown): value is Status { return typeof value === "string" && Object.hasOwn(statuses, value); }
function validPhase(value: unknown): value is Phase { return value === "phase-1" || value === "phase-2" || value === "phase-3"; }
function validPhaseStatus(value: unknown): value is PhaseStatus { return value === "not_started" || value === "in_progress" || value === "completed"; }
function timestamp(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)); }
export interface SafeProgressResult { progress?: Progress; diagnostics: string[]; coreValid: boolean }
export function safeProgress(value: unknown): SafeProgressResult {
  const diagnostics: string[] = [];
  if (!record(value)) return { diagnostics: ["/: expected a JSON object"], coreValid: false };
  if (!record(value.phase) || !validPhase(value.phase.current) || !validPhaseStatus(value.phase.status)) return { diagnostics: ["/phase: expected current phase-1/phase-2/phase-3 and status not_started/in_progress/completed"], coreValid: false };
  let coreValid = value.schema_version === 1 && typeof value.starter_pack_version === "string" && timestamp(value.updated_at) && record(value.steps);
  if (value.schema_version !== 1) diagnostics.push("/schema_version: expected supported version 1; other versions are limited previews");
  if (typeof value.starter_pack_version !== "string") diagnostics.push("/starter_pack_version: expected text");
  if (!timestamp(value.updated_at)) diagnostics.push("/updated_at: expected an ISO timestamp");
  if (!record(value.steps)) diagnostics.push("/steps: expected an object keyed by step ID");
  const stepEntries: [string, Step][] = [];
  for (const [id, raw] of Object.entries(record(value.steps) ? value.steps : {})) {
    const path = "/steps/<step>";
    if (!record(raw) || !validStatus(raw.status) || (raw.phase !== undefined && !validPhase(raw.phase))) {
      coreValid = false;
      diagnostics.push(`${path}${!record(raw) ? "" : !validStatus(raw.status) ? "/status" : "/phase"}: expected a step object with a known status and optional valid phase; entry quarantined`);
      continue;
    }
    const step: Step = { ...raw, status: raw.status };
    if (validPhase(raw.phase)) step.phase = raw.phase;
    for (const field of ["next_action", "blocker"] as const) if (raw[field] !== undefined && typeof raw[field] !== "string") { delete step[field]; diagnostics.push(`${path}/${field}: expected text`); }
    if (raw.updated_at !== undefined && !timestamp(raw.updated_at)) { delete step.updated_at; diagnostics.push(`${path}/updated_at: expected an ISO timestamp`); }
    if (raw.notes !== undefined) {
      if (!Array.isArray(raw.notes)) { delete step.notes; diagnostics.push(`${path}/notes: expected an array of text`); }
      else { step.notes = raw.notes.filter((note): note is string => typeof note === "string"); if (step.notes.length !== raw.notes.length) diagnostics.push(`${path}/notes: ignored non-text entries`); }
    }
    stepEntries.push([id, step]);
  }
  const progress: Progress = {
    ...value, schema_version: typeof value.schema_version === "number" ? value.schema_version : 0,
    starter_pack_version: typeof value.starter_pack_version === "string" ? value.starter_pack_version : "Unknown",
    updated_at: typeof value.updated_at === "string" ? value.updated_at : "Unknown",
    phase: { ...value.phase, current: value.phase.current, status: coreValid ? value.phase.status : "in_progress" },
    steps: Object.fromEntries(stepEntries),
  };
  if (value.phase.requirements_revision !== undefined && (typeof value.phase.requirements_revision !== "string" || !value.phase.requirements_revision.trim())) {
    coreValid = false;
    progress.phase.status = "in_progress";
    delete progress.phase.requirements_revision;
    diagnostics.push("/phase/requirements_revision: expected nonempty text; completion withheld");
  }
  if (value.phase.completed_at !== undefined && !timestamp(value.phase.completed_at)) {
    delete progress.phase.completed_at;
    diagnostics.push("/phase/completed_at: expected an ISO timestamp; invalid time ignored");
  }
  for (const field of ["environment", "choices", "artifacts"] as const) {
    if (record(value[field])) progress[field] = { ...value[field] };
    else { delete progress[field]; if (value[field] !== undefined) diagnostics.push(`/${field}: expected an object; optional data ignored`); }
  }
  if (progress.environment) for (const field of ["device", "os", "harness", "remote_access_ready"] as const) {
    const item = progress.environment[field];
    const valid = item === undefined || (field === "remote_access_ready" ? typeof item === "boolean" : typeof item === "string" || (field !== "device" && item === null));
    if (!valid) { delete progress.environment[field]; diagnostics.push(`/environment/${field}: expected ${field === "remote_access_ready" ? "boolean" : "text"}`); }
  }
  if (progress.artifacts && progress.artifacts.phase_history !== undefined) {
    const history = progress.artifacts.phase_history;
    if (!Array.isArray(history)) { delete progress.artifacts.phase_history; diagnostics.push("/artifacts/phase_history: expected an array; history quarantined"); }
    else {
      const valid = history.filter(validHistoryEntry);
      progress.artifacts.phase_history = valid;
      if (valid.length !== history.length) diagnostics.push("/artifacts/phase_history/<entry>: expected phase, status, revision and source with valid optional timestamp/evidence; invalid entries quarantined");
    }
  }
  if (progress.phase.current === "phase-3" && progress.phase.status === "completed") {
    progress.phase.status = "in_progress";
    diagnostics.push("/phase/status: Phase 3 is a preview; recorded activity does not certify graduation");
  }
  if (!coreValid) limitedViews.add(progress);
  return { progress, diagnostics: [...new Set(diagnostics)], coreValid };
}
export function displayJson(value: unknown): string {
  const project = (item: unknown, depth: number): unknown => {
    if (!record(item) && !Array.isArray(item)) return typeof item === "string" && item.length > 2000 ? item.slice(0, 2000) + " [text omitted]" : item;
    if (depth >= 4) return "[Nested data omitted; inspect the local JSON]";
    if (Array.isArray(item)) return [...item.slice(0, 40).map(child => project(child, depth + 1)), ...(item.length > 40 ? ["[Additional entries omitted]"] : [])];
    const entries = Object.entries(item);
    return Object.fromEntries([...entries.slice(0, 40).map(([key, child]) => [key, project(child, depth + 1)]), ...(entries.length > 40 ? [["...", "Additional fields omitted"]] : [])]);
  };
  return JSON.stringify(project(value, 0), null, 2) ?? "[Unsupported value]";
}
export interface ProgressSnapshot extends SafeProgressResult { stale: boolean }
export function readProgress(raw: string, previous?: ProgressSnapshot): ProgressSnapshot {
  let value: unknown;
  let parseFailed = false;
  try { value = JSON.parse(raw); }
  catch { parseFailed = true; }
  const result: SafeProgressResult = parseFailed ? { diagnostics: ["/: expected intact JSON; retry after the file is saved atomically"], coreValid: false } : safeProgress(value);
  if (!result.coreValid && previous?.coreValid && previous.progress) return { ...previous, diagnostics: result.diagnostics, stale: true };
  return { ...result, stale: false };
}
// Error paths can contain private custom IDs. Copy field kinds, not instance values or dynamic keys.
export function validationDiagnostics(errors: readonly { instancePath?: string; keyword?: string; params?: Record<string, unknown> }[] | null | undefined) {
  return (errors ?? []).slice(0, 12).map(error => {
    const parts = (error.instancePath ?? "").split("/").filter(Boolean);
    if (parts[0] === "steps" && parts.length > 1) parts[1] = "<step>";
    if (parts[0] === "choices" && parts[1] === "service_auth" && parts.length > 2) parts[2] = "<service>";
    if (parts[0] === "choices" && parts[1] === "development_email" && parts[2] === "service_overrides" && parts.length > 3) parts[3] = "<service>";
    if (parts[0] === "artifacts") {
      if (parts[1] === "phase_history" && parts.length > 2) parts[2] = "<entry>";
      else if (parts[1] === "account_profile" && parts[2] === "service_usernames" && parts.length > 3) parts[3] = "<service>";
      else if (parts[1] !== "account_profile") parts.splice(1, parts.length, "<artifact>");
    }
    const expected = error.keyword === "format" ? "the schema's declared format" : error.keyword === "required" ? "the schema's required fields" : "the schema's declared type or supported value";
    return `/${parts.join("/")}: expected ${expected}`;
  });
}
export function validCatalog(value: unknown): value is Catalog {
  if (!record(value) || typeof value.version !== "string" || !Array.isArray(value.phases) || !record(value.steps)) return false;
  const phases = value.phases;
  const guideLink = (url: unknown) => typeof url === "string" && /^https:\/\/starter\.devthomas\.site\/phases\/[123](?:#[a-z0-9-]+)?$/.test(url);
  if (phases.length !== 3 || !["phase-1", "phase-2", "phase-3"].every(id => phases.some(item => record(item) && item.id === id))) return false;
  if (!phases.every(item => record(item) && validPhase(item.id) && typeof item.title === "string" && item.preview === (item.id === "phase-3") && guideLink(item.url))) return false;
  if (!Object.values(value.steps).every(step => record(step) && typeof step.title === "string" && validPhase(step.phase) && guideLink(step.url))) return false;
  if (value.requirements === undefined) return value.requirements_revision === undefined && value.aliases === undefined && value.groups === undefined;
  try {
    const registry = parseRegistry(value.requirements);
    if (value.requirements_revision !== registry.requirements_revision || value.version !== registry.version) return false;
    if (Object.keys(value.steps).length !== Object.keys(registry.steps).length) return false;
    for (const [id, definition] of Object.entries(registry.steps)) {
      const step = value.steps[id];
      if (!record(step)) return false;
      for (const [key, field] of Object.entries(definition)) if (JSON.stringify(step[key]) !== JSON.stringify(field)) return false;
    }
    if (value.aliases !== undefined && JSON.stringify(value.aliases) !== JSON.stringify(registry.aliases)) return false;
    if (value.groups !== undefined && JSON.stringify(value.groups) !== JSON.stringify(registry.groups)) return false;
    return true;
  } catch { return false; }
}
