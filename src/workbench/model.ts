export type Phase = "phase-1" | "phase-2" | "phase-3";
export type Status = "not_started" | "in_progress" | "completed" | "skipped" | "deferred" | "not_applicable";
export interface Step { status: Status; phase?: Phase; updated_at?: string; notes?: string[]; next_action?: string; blocker?: string }
export interface Progress {
  schema_version: number;
  starter_pack_version: string;
  updated_at: string;
  phase: { current: Phase; status: "not_started" | "in_progress" | "completed" };
  environment?: { device?: string; os?: string | null; harness?: string | null; remote_access_ready?: boolean; [key: string]: unknown };
  steps: Record<string, Step>;
  choices?: Record<string, unknown>;
  artifacts?: Record<string, unknown>;
}
export interface Catalog {
  version: string;
  phases: { id: Phase; title: string; url: string; preview: boolean }[];
  steps: Record<string, { title: string; phase: Phase; url: string }>;
}
export const statuses: Record<Status, string> = { not_started: "Not started", in_progress: "In progress", completed: "Completed", skipped: "Skipped", deferred: "Saved for later", not_applicable: "Not applicable" };
export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function humanize(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/^./, letter => letter.toUpperCase());
}
export function phaseFor(id: string, step: Step, catalog: Catalog): Phase | undefined {
  return step.phase ?? catalog.steps[id]?.phase;
}
export function currentStep(progress: Progress, catalog: Catalog): [string, Step] | undefined {
  const preference = progress.choices?.workbench;
  if (record(preference) && typeof preference.next_step_id === "string" && Object.hasOwn(progress.steps, preference.next_step_id)) {
    const step = progress.steps[preference.next_step_id];
    if (!["completed", "skipped", "not_applicable"].includes(step.status)) return [preference.next_step_id, step];
  }
  if (progress.phase.status === "completed") return undefined;
  const entries = Object.entries(progress.steps).filter(([id, step]) => phaseFor(id, step, catalog) === progress.phase.current);
  for (const status of ["in_progress", "deferred", "not_started"]) {
    const entry = entries.find(([, step]) => step.status === status);
    if (entry) return entry;
  }
  return undefined;
}
export function safeLink(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}
export function summary(progress: Progress, catalog: Catalog) {
  const current = currentStep(progress, catalog);
  return [
    `Starter Pack progress (${progress.updated_at})`,
    `${catalog.phases.find(phase => phase.id === progress.phase.current)?.title ?? humanize(progress.phase.current)}: ${statuses[progress.phase.status]}`,
    ...Object.entries(progress.steps).map(([id, step]) => `${catalog.steps[id]?.title ?? humanize(id)}: ${statuses[step.status]}`),
    ...(current?.[1].next_action ? [`Next action: ${current[1].next_action}`] : []),
    ...(current?.[1].blocker ? [`Blocker: ${current[1].blocker}`] : []),
  ].join("\n");
}
export function validCatalog(value: unknown): value is Catalog {
  if (!record(value) || typeof value.version !== "string" || !Array.isArray(value.phases) || !record(value.steps)) return false;
  const ids = ["phase-1", "phase-2", "phase-3"];
  const guideLink = (url: unknown) => typeof url === "string" && url.startsWith("https://starter.devthomas.site/phases/") && !!safeLink(url);
  return value.phases.length === 3 && ids.every(id => value.phases instanceof Array && value.phases.some(phase => record(phase) && phase.id === id)) && value.phases.every(phase => record(phase) && typeof phase.title === "string" && typeof phase.preview === "boolean" && guideLink(phase.url)) && Object.values(value.steps).every(step => record(step) && typeof step.title === "string" && ids.includes(String(step.phase)) && guideLink(step.url));
}
