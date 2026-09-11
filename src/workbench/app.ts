import validate from "progress-validator";
import { icon, type IconName, phaseIcons, providerIcon, statusIcons } from "./icons";
import {
  type Catalog,
  type Phase,
  type Progress,
  type Step,
  canonicalId,
  currentStep,
  humanize,
  displayJson,
  phaseFor,
  phaseGate,
  phaseCompletion,
  record,
  safeLink,
  readProgress,
  validationDiagnostics,
  type ProgressSnapshot,
  statuses,
  summary,
  titleFor,
  validCatalog,
} from "./model";

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
let snapshot: ProgressSnapshot | undefined;
let lastSource = "";
let lastAcceptedRaw: string | undefined;
let loadFailed = false;
let diagnostics: string[] = [];
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
  result.append(icon("arrow-up-right"));
  result.href = url;
  result.target = "_blank";
  result.rel = "noopener noreferrer";
  result.setAttribute("aria-label", `${text} (opens in a new tab)`);
  return result;
}

function action(text: string, callback: () => void, symbol?: IconName) {
  const button = node("button", text);
  if (symbol) button.prepend(icon(symbol));
  button.type = "button";
  button.addEventListener("click", callback);
  return button;
}

function updateRefreshLabel() {
  element("refresh").replaceChildren(icon("refresh-cw"), document.createTextNode(mode === "http" ? "Refresh progress" : "Reopen progress file"));
}

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
    const term = node("dt", label);
    const rowIcons: Record<string, IconName> = {
      Harness: "terminal",
      Computer: "monitor",
      Device: "smartphone",
      "Remote access": "route",
      Account: "mail",
      Notifications: "mail",
      "Cloudflare Access": "shield-check",
      Repository: "folder-git-2",
      "Live url": "rocket",
      Path: "file-text",
      "Saved reference": "file-text",
    };
    const deviceIcon = label === "Device" && typeof value === "string" && /computer|desktop|laptop/i.test(value) ? "monitor" : undefined;
    term.prepend(icon(deviceIcon ?? providerIcon(label) ?? rowIcons[label] ?? "file-text"));
    list.append(term);
    const cell = node("dd");
    if (typeof value === "string") {
      const url = safeLink(value);
      cell.append(url ? link(value, url) : node("span", value));
      if (label === "Harness") {
        const brand = providerIcon(value);
        if (brand) {
          cell.prepend(icon(brand, true));
          cell.classList.add("provider");
        }
      }
    } else if (typeof value === "boolean") cell.textContent = value ? "Yes" : "No";
    else if (typeof value === "number") cell.textContent = String(value);
    else cell.textContent = displayJson(value);
    list.append(cell);
  }
  target.append(list);
}

function stepCard(id: string, step: Step) {
  const card = node("article", undefined, "step");
  const heading = node("div", undefined, "step-heading");
  const stepTitle = node("h3");
  stepTitle.append(icon(stepIcon(id), true), node("span", titleFor(id, catalog), "heading-text"));
  const definition = catalog.steps[id] ?? catalog.steps[canonicalId(id, catalog)];
  if (definition?.requirement) stepTitle.append(node("span", humanize(definition.requirement), "requirement"));
  const status = node("span", statuses[step.status], `status ${step.status}`);
  status.prepend(icon(statusIcons[step.status]));
  heading.append(stepTitle, status);
  card.append(heading);
  if (step.updated_at) card.append(node("p", date(step.updated_at), "muted"));
  for (const note of step.notes ?? []) card.append(node("p", note));
  if (step.next_action) card.append(node("p", `Next action: ${step.next_action}`));
  if (step.blocker) card.append(node("p", `Blocker: ${step.blocker}`, "blocker"));
  return card;
}

function stepIcon(id: string): IconName {
  if (/computer|setup|ide/.test(id)) return "monitor";
  if (/phone|mobile/.test(id)) return "smartphone";
  if (/repo|github/.test(id)) return "folder-git-2";
  if (/deploy|publish|domain/.test(id)) return "rocket";
  if (/workbench|progress/.test(id)) return "list-checks";
  if (/build/.test(id)) return "blocks";
  return "file-text";
}

function sectionTitle(text: string, symbol: IconName) {
  const heading = node("h2", text);
  heading.prepend(icon(symbol, true));
  return heading;
}

function renderDiagnostics() {
  const target = element("diagnostics");
  target.replaceChildren();
  target.hidden = diagnostics.length === 0;
  if (!diagnostics.length) return;
  target.append(node("strong", "Progress needs attention"));
  const list = node("ul");
  for (const diagnostic of diagnostics.slice(0, 8)) list.append(node("li", diagnostic));
  target.append(list, action("Copy sanitized diagnostics", () => void copy(`Starter Pack Workbench ${catalog.version}\n${diagnostics.join("\n")}\nNo progress values or custom field names are included. Read the local JSON before repairing it.`)));
}

function renderGateStatus(target: HTMLElement, phase: Phase) {
  const gate = progress ? phaseGate(progress, catalog, phase) : undefined;
  target.className = "gate-status";
  if (!gate) {
    target.textContent = phase === "phase-3" ? "Preview only · no completion gate" : "Requirements are recorded by your agent.";
    return;
  }
  const completed = progress && phaseCompletion(progress, phase, catalog);
  if (completed) {
    target.textContent = `Completion recorded · requirements ${completed.requirements_revision ?? "not recorded"}.${gate.complete ? " Current required outcomes are also recorded." : ` Current-revision ${gate.conflicts.length ? "reconciliation" : "update checklist"}: ${gate.missing.map(id => titleFor(id, catalog)).join(", ") || gate.conflicts.join("; ")}. Historical completion is preserved.`}`;
    return;
  }
  if (gate.conflicts.length) {
    target.classList.add("needs-attention");
    target.textContent = `Needs reconciliation: ${gate.conflicts.slice(0, 2).join("; ")}`;
  } else if (gate.complete) {
    target.classList.add("complete");
    target.textContent = "Required outcomes complete";
  } else {
    const missing = gate.missing.map((id) => titleFor(id, catalog)).slice(0, 3);
    target.textContent = `Required outcomes remaining: ${missing.join(", ")}${gate.missing.length > 3 ? " and more" : ""}`;
  }
}

function renderServiceAuth(target: HTMLElement, auth: Record<string, unknown>) {
  const section = node("section");
  section.append(sectionTitle("Service sign-ins", "lock-keyhole"));
  for (const [service, value] of Object.entries(auth)) {
    const details = node("div", undefined, "artifact");
    details.append(node("h3", humanize(service)));
    if (record(value)) {
      rows(details, [
        ["Method", value.method],
        ["Provider", value.provider],
        ["Account", value.account_handle],
        ["Confirmed email", value.account_email],
        ["Source", value.source],
      ]);
      if (Array.isArray(value.notes)) rows(details, [["Notes", value.notes.filter((note): note is string => typeof note === "string").join(" ")]]);
    } else rows(details, [["Sign-in note", value]]);
    section.append(details);
  }
  target.append(section);
}

function render() {
  const rail = element("phases");
  rail.replaceChildren();
  for (const phase of catalog.phases) {
    const button = action("", () => {
      selectedPhase = phase.id;
      render();
      element("phase-title").focus();
    });
    button.disabled = !progress;
    button.append(icon(phaseIcons[phase.id], true));
    button.append(node("span", phase.id.replace("-", " "), "eyebrow"), node("span", phase.title, "phase-name"));
    const recorded = Object.entries(progress?.steps ?? {}).filter(([id, step]) => phaseFor(id, step, catalog) === phase.id);
    const complete = recorded.filter(([, step]) => step.status === "completed").length;
    const gate = progress ? phaseGate(progress, catalog, phase.id) : undefined;
    const completed = progress && phaseCompletion(progress, phase.id, catalog);
    const phaseStatus = phase.preview ? "Preview" : progress?.phase.current === phase.id ? progress.phase.status === "completed" && !completed ? "Needs reconciliation" : statuses[progress.phase.status] : "";
    const requirementStatus = completed ? "Completion recorded" : gate ? gate.conflicts.length ? "Needs reconciliation" : gate.complete ? "Required complete" : `${gate.missing.length} required missing` : "";
    button.append(node("span", [phaseStatus, requirementStatus, recorded.length ? `${complete} completed / ${recorded.length} recorded` : "No steps recorded"].filter(Boolean).join(" · "), "phase-meta"));
    if (selectedPhase === phase.id) button.setAttribute("aria-current", "page");
    rail.append(button);
  }
  renderDiagnostics();
  if (!progress) {
    element("welcome").hidden = false;
    element("progress").hidden = true;
    element("context").replaceChildren();
    element("workbench-title").textContent = "Progress Workbench";
    document.title = "Your progress | Starter Pack";
    return;
  }
  const identity = progress.choices?.workbench;
  const learner = record(identity) && typeof identity.learner_name === "string" ? identity.learner_name.trim() : "";
  element("workbench-title").textContent = learner ? `${learner}'s Progress Workbench` : "Progress Workbench";
  document.title = learner ? `${learner}'s progress | Starter Pack` : "Your progress | Starter Pack";
  element("welcome").hidden = true;
  element("progress").hidden = false;
  const phase = catalog.phases.find((item) => item.id === selectedPhase) ?? catalog.phases[0];
  element("phase-label").textContent = phase.preview ? "PHASE 3 · PREVIEW" : phase.id.replace("-", " ");
  element("phase-title").textContent = phase.title;
  element("phase-title").prepend(icon(phaseIcons[phase.id], true));
  element("workspace").dataset.phase = phase.id;
  element("phase-title").tabIndex = -1;
  element("updated").textContent = `Progress saved ${date(progress.updated_at)}`;
  element("updated").prepend(icon("clock"));
  element("pack-version").textContent = `Progress: ${progress.starter_pack_version} · Guide: ${catalog.version}`;
  const versionNotice = element("version-notice");
  versionNotice.hidden = progress.starter_pack_version === catalog.version;
  versionNotice.textContent = "Your progress and this guide have different versions. Ask your agent to review what changed; your progress has not been altered.";
  renderGateStatus(element("gate-status"), phase.id);
  const current = element("current");
  current.replaceChildren();
  const entry = currentStep(progress, catalog);
  const gate = phaseGate(progress, catalog, phase.id);
  const heading = node("h2");
  heading.id = "current-title";
  if (phase.id !== progress.phase.current) {
    heading.textContent = phase.preview ? "A look ahead" : "Your recorded work";
    current.append(heading, node("p", phase.preview ? "Phase 3 is a preview. Recorded steps here do not make the full phase available." : "The steps below reflect your saved file."));
  } else if (phase.preview) {
    heading.textContent = "Phase 3 preview";
    current.append(heading, node("p", "Advanced activity can be recorded here; it does not certify completion of a full Phase 3 curriculum."));
  } else if (phaseCompletion(progress, phase.id, catalog)) {
    heading.textContent = "Phase recorded as complete";
    current.append(heading, node("p", "Your completion is preserved. Review any current-revision updates with your agent, or choose the next phase when ready."));
  } else if (entry) {
    const [id, step] = entry;
    heading.textContent = titleFor(id, catalog);
    current.append(node("span", "CURRENT STEP", "eyebrow"), heading);
    current.append(node("p", step.next_action ?? "Ask your agent for the next action on this step."));
    if (step.blocker) current.append(node("p", step.blocker, "blocker"));
  } else if (gate?.complete) {
    heading.textContent = "Required outcomes are recorded";
    current.append(heading, node("p", progress.phase.status === "completed" ? "This phase is recorded as complete. Your next phase is available when you choose it." : "Your agent should save the phase closeout now. Optional Workbench and email choices do not block completion."));
  } else {
    heading.textContent = progress.phase.status === "completed" ? "Completion needs reconciliation" : "Choose the next step with your agent";
    current.append(heading, node("p", "Your saved record does not name an unfinished step to continue."));
  }
  heading.prepend(icon(phase.id === progress.phase.current && entry ? stepIcon(entry[0]) : phaseIcons[phase.id], true));
  const actions = node("div", undefined, "actions");
  actions.append(action(phase.id === progress.phase.current ? "Ask my agent" : "Continue current phase", () => {
    if (!progress) return;
    const next = currentStep(progress, catalog);
    const details = next ? `Current recorded step: ${titleFor(next[0], catalog)}.\n${next[1].next_action ?? ""}\n${next[1].blocker ? `Blocker: ${next[1].blocker}` : ""}` : "Check the current phase requirements and help me close out or choose the next action from my saved progress.";
    void copy(`Continue my Starter Pack from starter-progress.json, saved ${progress.updated_at}.\n${details}\nRead the current file before acting, preserve completed work, and update it as we go. Refer back to my local Progress Workbench to show the result.`);
  }, "terminal"), link("Open phase guidance", phase.url));
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
  setup.append(sectionTitle("Your setup", "settings-2"));
  const environment = progress.environment ?? {};
  rows(setup, [["Harness", environment.harness], ["Computer", environment.os], ["Device", environment.device], ["Remote access", environment.remote_access_ready === undefined ? "Not recorded" : environment.remote_access_ready ? "Recorded as ready" : "Not ready"]]);
  context.append(setup);
  if (record(progress.choices?.development_email)) {
    const email = node("section");
    email.append(sectionTitle("Development email", "mail"));
    const prefs = progress.choices.development_email;
    rows(email, [["Account", prefs.account_email], ["Notifications", prefs.notification_email], ["Cloudflare Access", prefs.access_email]]);
    if (record(prefs.service_overrides)) rows(email, Object.entries(prefs.service_overrides).map(([key, value]) => [`${humanize(key)} sign-in note`, value]));
    context.append(email);
  }
  if (record(progress.choices?.service_auth)) renderServiceAuth(context, progress.choices.service_auth);
  const builds = node("section");
  builds.append(sectionTitle("Your projects and files", "folder-git-2"));
  const artifacts = Object.entries(progress.artifacts ?? {}).filter(([id]) => id !== "progress_workbench" && id !== "phase_history");
  if (!artifacts.length) builds.append(node("p", "No project links recorded yet.", "muted"));
  for (const [id, value] of artifacts) {
    const artifact = node("div", undefined, "artifact");
    const artifactTitle = node("h3");
    artifactTitle.append(icon("blocks"), node("span", record(value) && typeof value.name === "string" ? value.name : humanize(id), "heading-text"));
    artifact.append(artifactTitle);
    rows(artifact, record(value) ? Object.entries(value).filter(([key]) => key !== "name").map(([key, val]) => [humanize(key), val]) : [["Saved reference", value]]);
    builds.append(artifact);
  }
  context.append(builds);
}

function accept(raw: string, source: string, newFile = false) {
  // Keep focused controls intact during unchanged polls, but retry after any load failure.
  if (!newFile && !loadFailed && raw === lastAcceptedRaw) return;
  if (raw.length > maxBytes) throw new Error("This progress file is too large. Ask your agent to keep screenshots and large artifacts outside the JSON.");
  const parsed = readProgress(raw, snapshot);
  diagnostics = parsed.diagnostics;
  if (!parsed.progress) {
    renderDiagnostics();
    throw new Error("This file does not contain readable progress. Ask your agent to repair the reported fields without discarding saved work.");
  }
  if (parsed.stale) {
    snapshot = parsed;
    renderDiagnostics();
    throw new Error("This update is damaged or unsupported; repair the reported fields before replacing the loaded record.");
  }
  const strictValid = validate(JSON.parse(raw));
  const previous = { progress, selectedPhase, diagnostics };
  if (newFile) {
    selectedPhase = parsed.progress.phase.current;
  }
  progress = parsed.progress;
  selectedPhase ??= progress.phase.current;
  diagnostics = strictValid ? parsed.diagnostics : [...parsed.diagnostics, ...validationDiagnostics(validate.errors)];
  try {
    render();
  } catch (error) {
    progress = previous.progress;
    selectedPhase = previous.selectedPhase;
    diagnostics = previous.diagnostics;
    render();
    throw new Error("This progress update could not be displayed. Keep the previous file and ask your agent to inspect the update.", { cause: error });
  }
  snapshot = parsed;
  lastAcceptedRaw = raw;
  loadFailed = false;
  lastSource = source;
  notice.textContent = parsed.coreValid ? "" : "Limited preview · completion is withheld until the core progress data is repaired.";
  element("source").textContent = source;
}

function fail(error: unknown) {
  loadFailed = true;
  const message = error instanceof Error ? error.message : "The progress file could not be read.";
  notice.textContent = `${message}${progress ? " Showing the last successfully loaded record." : " Open a valid progress file to begin."}`;
  if (progress && lastSource) element("source").textContent = `${lastSource} · Last successfully loaded copy`;
}

async function loadFile(file: File) {
  const requestEpoch = ++epoch;
  try {
    if (file.size > maxBytes) throw new Error("This file exceeds 2 MB. Ask your agent to keep large artifacts outside the progress file.");
    const raw = await file.text();
    if (requestEpoch !== epoch) return;
    accept(raw, `${file.name} · Reopen after your agent saves changes.`, true);
    mode = "file";
    updateRefreshLabel();
  } catch (error) {
    if (requestEpoch === epoch) fail(error);
  }
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
  } finally {
    busy = false;
  }
}

async function loadCatalog() {
  try {
    const response = await fetch(metadataUrl, { credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Catalog unavailable");
    const next: unknown = await response.json();
    if (!validCatalog(next) || next.requirements_revision !== __WORKBENCH_CATALOG__.requirements_revision || next.version !== __WORKBENCH_CATALOG__.version || JSON.stringify(next.requirements) !== JSON.stringify(__WORKBENCH_CATALOG__.requirements)) throw new Error("Unsupported or different-revision catalog");
    catalog = next;
    element("catalog-state").textContent = `Current guide labels · requirements ${catalog.requirements_revision ?? catalog.version}`;
    render();
  } catch {
    element("catalog-state").textContent = "Online guide unavailable or a different revision · using bundled requirements";
  }
}

if (["starter.devthomas.site", "starter-pack.uppercut-labs.workers.dev"].includes(location.hostname)) {
  element("file-tools").hidden = true;
  element("drop-zone").replaceChildren(node("p", "Download this HTML file from Starter Pack's templates page, then open it on your own computer."));
} else {
  updateRefreshLabel();
  render();
  picker.addEventListener("change", () => {
    const file = picker.files?.[0];
    if (file) void loadFile(file);
    picker.value = "";
  });
  element("refresh").addEventListener("click", () => mode === "http" ? void loadHttp() : picker.click());
  element("copy-summary").addEventListener("click", () => {
    if (progress) void copy(summary(progress, catalog));
  });
  element("close-copy").addEventListener("click", () => element<HTMLDialogElement>("copy-dialog").close());
  document.addEventListener("dragover", (event) => {
    event.preventDefault();
    document.body.classList.add("dragging");
  });
  document.addEventListener("dragleave", (event) => {
    if (!event.relatedTarget) document.body.classList.remove("dragging");
  });
  document.addEventListener("drop", (event) => {
    event.preventDefault();
    document.body.classList.remove("dragging");
    const file = event.dataTransfer?.files[0];
    if (file) void loadFile(file);
  });
  if (mode === "http") {
    void loadHttp();
    window.setInterval(() => {
      if (!document.hidden) void loadHttp();
    }, 5000);
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void loadHttp();
  });
  void loadCatalog();
}
