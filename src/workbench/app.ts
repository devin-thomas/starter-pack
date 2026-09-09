import validate from "progress-validator";
import { type Catalog, type Phase, type Progress, type Step, currentStep, humanize, phaseFor, record, safeLink, statuses, summary, validCatalog } from "./model";

declare const __WORKBENCH_CATALOG__: Catalog;
const origin = "https://starter.devthomas.site";
const metadataUrl = `${origin}/artifacts/progress-workbench/catalog.json`;
const maxBytes = 2 * 1024 * 1024;
function element<T extends HTMLElement>(id: string) {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing Workbench element: ${id}`);
  return result as T;
}
const picker = element<HTMLInputElement>("progress-file");
const notice = element("notice");
let catalog = __WORKBENCH_CATALOG__;
let progress: Progress | undefined;
let selectedPhase: Phase | undefined;
let mode: "file" | "http" = location.protocol === "file:" ? "file" : "http";
let lastRaw = "";
let epoch = 0;
let busy = false;
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}
function link(text: string, url: string) {
  const result = node("a", text);
  result.href = url;
  result.target = "_blank";
  result.rel = "noopener noreferrer";
  result.setAttribute("aria-label", `${text} (opens in a new tab)`);
  return result;
}
function action(text: string, callback: () => void) {
  const button = node("button", text);
  button.type = "button";
  button.addEventListener("click", callback);
  return button;
}
function title(id: string) { return catalog.steps[id]?.title ?? humanize(id); }
function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notice.textContent = "Copied. Paste it into your agent.";
  } catch {
    const fallback = element<HTMLTextAreaElement>("copy-fallback");
    fallback.value = text;
    element<HTMLDialogElement>("copy-dialog").showModal();
    fallback.focus();
    fallback.select();
  }
}
function rows(target: HTMLElement, values: [string, unknown][]) {
  const list = node("dl");
  for (const [label, value] of values) {
    if (value === undefined || value === null || value === "") continue;
    list.append(node("dt", label));
    const cell = node("dd");
    if (typeof value === "string") {
      const url = safeLink(value);
      cell.append(url ? link(value, url) : node("span", value));
    } else if (typeof value === "boolean") cell.textContent = value ? "Yes" : "No";
    else if (typeof value === "number") cell.textContent = String(value);
    else cell.textContent = JSON.stringify(value, null, 2);
    list.append(cell);
  }
  target.append(list);
}
function stepCard(id: string, step: Step) {
  const card = node("article", undefined, "step");
  const heading = node("div", undefined, "step-heading");
  heading.append(node("h3", title(id)), node("span", statuses[step.status], `status ${step.status}`));
  card.append(heading);
  if (step.updated_at) card.append(node("p", date(step.updated_at), "muted"));
  for (const note of step.notes ?? []) card.append(node("p", note));
  if (step.next_action) card.append(node("p", `Next action: ${step.next_action}`));
  if (step.blocker) card.append(node("p", `Blocker: ${step.blocker}`, "blocker"));
  return card;
}
function render() {
  const rail = element("phases");
  rail.replaceChildren();
  for (const phase of catalog.phases) {
    const button = action("", () => { selectedPhase = phase.id; render(); element("phase-title").focus(); });
    button.append(node("span", phase.id.replace("-", " "), "eyebrow"), node("span", phase.title, "phase-name"));
    const recorded = Object.entries(progress?.steps ?? {}).filter(([id, step]) => phaseFor(id, step, catalog) === phase.id);
    const complete = recorded.filter(([, step]) => step.status === "completed").length;
    const phaseStatus = phase.preview ? "Preview" : progress?.phase.current === phase.id ? statuses[progress.phase.status] : "";
    button.append(node("span", [phaseStatus, recorded.length ? `${complete} completed / ${recorded.length} recorded` : "No steps recorded"].filter(Boolean).join(" · "), "phase-meta"));
    if (selectedPhase === phase.id) button.setAttribute("aria-current", "page");
    rail.append(button);
  }
  if (!progress) return;
  const identity = progress.choices?.workbench;
  const learner = record(identity) && typeof identity.learner_name === "string" ? identity.learner_name.trim() : "";
  element("workbench-title").textContent = learner ? `${learner}'s Progress Workbench` : "Progress Workbench";
  document.title = learner ? `${learner}'s progress | Starter Pack` : "Your progress | Starter Pack";
  element("welcome").hidden = true;
  element("progress").hidden = false;
  const phase = catalog.phases.find(item => item.id === selectedPhase) ?? catalog.phases[0];
  element("phase-label").textContent = phase.preview ? "PHASE 3 · PREVIEW" : phase.id.replace("-", " ");
  element("phase-title").textContent = phase.title;
  element("phase-title").tabIndex = -1;
  element("updated").textContent = `Progress saved ${date(progress.updated_at)}`;
  element("pack-version").textContent = `Progress: ${progress.starter_pack_version} · Guide: ${catalog.version}`;
  const versionNotice = element("version-notice");
  versionNotice.hidden = progress.starter_pack_version === catalog.version;
  versionNotice.textContent = "Your progress and this guide have different versions. Ask your agent to review what changed; your progress has not been altered.";
  const current = element("current");
  current.replaceChildren();
  const entry = currentStep(progress, catalog);
  const heading = node("h2");
  heading.id = "current-title";
  if (phase.id !== progress.phase.current) {
    heading.textContent = phase.preview ? "A look ahead" : "Your recorded work";
    current.append(heading, node("p", phase.preview ? "Phase 3 is a preview. Recorded steps here do not make the full phase available." : "The steps below reflect your saved file."));
  } else if (entry) {
    const [id, step] = entry;
    heading.textContent = title(id);
    current.append(node("span", "CURRENT STEP", "eyebrow"), heading);
    current.append(node("p", step.next_action ?? "Ask your agent for the next action on this step."));
    if (step.blocker) current.append(node("p", step.blocker, "blocker"));
  } else {
    heading.textContent = progress.phase.status === "completed" ? "Phase recorded as complete" : "Choose the next step with your agent";
    current.append(heading, node("p", "Your saved record does not name an unfinished step to continue."));
  }
  const actions = node("div", undefined, "actions");
  actions.append(action("Ask my agent", () => {
    if (!progress) return;
    const next = currentStep(progress, catalog);
    const details = next ? `Current recorded step: ${title(next[0])}.\n${next[1].next_action ?? ""}\n${next[1].blocker ? `Blocker: ${next[1].blocker}` : ""}` : "Help me choose the next action from my saved progress.";
    void copy(`Continue my Starter Pack from starter-progress.json, saved ${progress.updated_at}.\n${details}\nRead the current file before acting, preserve completed work, and update it as we go. Refer back to my local Progress Workbench to show the result.`);
  }), link("Open phase guidance", phase.url));
  current.append(actions);
  const steps = element("steps");
  steps.replaceChildren();
  const entries = Object.entries(progress.steps).filter(([id, step]) => phaseFor(id, step, catalog) === phase.id);
  element("step-count").textContent = entries.length ? `${entries.filter(([, step]) => step.status === "completed").length} completed · ${entries.length} recorded` : "";
  if (!entries.length) steps.append(node("p", "No steps recorded for this phase yet.", "muted"));
  entries.forEach(([id, step]) => steps.append(stepCard(id, step)));
  const unknown = Object.entries(progress.steps).filter(([id, step]) => !phaseFor(id, step, catalog));
  element("unassigned").hidden = !unknown.length;
  const other = element("other-steps");
  other.replaceChildren(...unknown.map(([id, step]) => stepCard(id, step)));
  const context = element("context");
  context.replaceChildren();
  const setup = node("section");
  setup.append(node("h2", "Your setup"));
  const environment = progress.environment ?? {};
  rows(setup, [["Harness", environment.harness], ["Computer", environment.os], ["Device", environment.device], ["Remote access", environment.remote_access_ready === undefined ? "Not recorded" : environment.remote_access_ready ? "Recorded as ready" : "Not ready"]]);
  context.append(setup);
  if (record(progress.choices?.development_email)) {
    const email = node("section");
    email.append(node("h2", "Development email"));
    const prefs = progress.choices.development_email;
    rows(email, [["Account", prefs.account_email], ["Notifications", prefs.notification_email], ["Cloudflare Access", prefs.access_email]]);
    if (record(prefs.service_overrides)) rows(email, Object.entries(prefs.service_overrides).map(([key,value]) => [humanize(key),value]));
    context.append(email);
  }
  const builds = node("section");
  builds.append(node("h2", "Your projects and files"));
  const artifacts = Object.entries(progress.artifacts ?? {}).filter(([id]) => id !== "progress_workbench");
  if (!artifacts.length) builds.append(node("p", "No project links recorded yet.", "muted"));
  for (const [id, value] of artifacts) {
    const artifact = node("div", undefined, "artifact");
    artifact.append(node("h3", record(value) && typeof value.name === "string" ? value.name : humanize(id)));
    rows(artifact, record(value) ? Object.entries(value).filter(([key]) => key !== "name").map(([key,val]) => [humanize(key),val]) : [["Saved reference", value]]);
    builds.append(artifact);
  }
  context.append(builds);
}
function accept(raw: string, source: string, newFile = false) {
  if (raw.length > maxBytes) throw new Error("This progress file is too large. Ask your agent to keep screenshots and large artifacts outside the JSON.");
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error("This file is not valid JSON. Ask your agent to repair it without discarding your saved progress."); }
  if (record(data) && data.schema_version !== 1) throw new Error("This progress format is not supported by this Workbench. Ask your agent to check the template version.");
  if (!validate(data)) throw new Error("This file does not match the Starter Pack progress format. Ask your agent to check its required fields and step statuses.");
  if (newFile) { selectedPhase = data.phase.current; lastRaw = ""; }
  notice.textContent = "";
  element("source").textContent = source;
  if (lastRaw === raw) return;
  progress = data;
  selectedPhase ??= progress.phase.current;
  lastRaw = raw;
  render();
}
function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "The progress file could not be read.";
  notice.textContent = `${message}${progress ? " Showing the last successfully loaded record." : ""}`;
}
async function loadFile(file: File) {
  const requestEpoch = ++epoch;
  try {
    if (file.size > maxBytes) throw new Error("This file exceeds 2 MB. Ask your agent to keep large artifacts outside the progress file.");
    const raw = await file.text();
    if (requestEpoch !== epoch) return;
    accept(raw, `${file.name} · Reopen after your agent saves changes.`, true);
    mode = "file";
  } catch (error) { if (requestEpoch === epoch) fail(error); }
}
async function loadHttp() {
  if (busy || mode !== "http") return;
  busy = true;
  const requestEpoch = epoch;
  try {
    const response = await fetch(new URL("./starter-progress.json", location.href), { cache: "no-store", credentials: "same-origin", redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("The saved progress file could not be loaded. Open a file, or ask your agent to check the local server or your site sign-in.");
    if (Number(response.headers.get("content-length")) > maxBytes) throw new Error("The saved progress file exceeds 2 MB.");
    const raw = await response.text();
    if (requestEpoch !== epoch || mode !== "http") return;
    accept(raw, "starter-progress.json · Refreshes while this page is visible.");
  } catch (error) {
    if (requestEpoch === epoch && mode === "http") fail(error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError") ? new Error("The progress server is unavailable. Ask your agent to restart it, or open a saved file.") : error);
  } finally { busy = false; }
}
async function loadCatalog() {
  try {
    const response = await fetch(metadataUrl, { credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Catalog unavailable");
    const next: unknown = await response.json();
    if (!validCatalog(next)) throw new Error("Unsupported catalog");
    catalog = next;
    element("catalog-state").textContent = "Current Starter Pack guide labels";
    render();
  } catch {
    element("catalog-state").textContent = "Online guide unavailable · using bundled labels";
  }
}
if (["starter.devthomas.site", "starter-pack.uppercut-labs.workers.dev"].includes(location.hostname)) {
  element("file-tools").hidden = true;
  element("drop-zone").replaceChildren(node("p", "Download this HTML file from Starter Pack's templates page, then open it on your own computer."));
} else {
  render();
  picker.addEventListener("change", () => { const file = picker.files?.[0]; if (file) void loadFile(file); picker.value = ""; });
  element("refresh").addEventListener("click", () => mode === "http" ? void loadHttp() : picker.click());
  element("copy-summary").addEventListener("click", () => { if (progress) void copy(summary(progress, catalog)); });
  element("close-copy").addEventListener("click", () => element<HTMLDialogElement>("copy-dialog").close());
  document.addEventListener("dragover", event => { event.preventDefault(); document.body.classList.add("dragging"); });
  document.addEventListener("dragleave", event => { if (!event.relatedTarget) document.body.classList.remove("dragging"); });
  document.addEventListener("drop", event => { event.preventDefault(); document.body.classList.remove("dragging"); const file = event.dataTransfer?.files[0]; if (file) void loadFile(file); });
  if (mode === "http") { void loadHttp(); window.setInterval(() => { if (!document.hidden) void loadHttp(); }, 5000); }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void loadHttp(); });
  void loadCatalog();
}
