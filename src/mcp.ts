// Optional, read-only Starter Pack connector: a stateless MCP (Streamable HTTP)
// endpoint served by the site's own Worker at /mcp. It reads only the site's
// built agent/requirements.json and agent/catalog.json through the ASSETS
// binding. No accounts, storage, outbound requests, secrets or learner data.
import siteOrigins from "./site-origin.json";

interface McpLimiter {
  limit(options: {
    readonly key: string;
  }): Promise<{ readonly success: boolean }>;
}
export interface McpEnv {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
  readonly MCP_RATE_LIMITER?: McpLimiter;
}

type Completion = {
  readonly all_of?: readonly string[];
  readonly any_of?: readonly string[];
};
type Step = {
  readonly title: string;
  readonly phase: string;
  readonly requirement?: string;
  readonly prerequisites?: readonly string[];
  readonly completion_meaning?: string;
  readonly completion?: Completion;
  readonly allow_recorded_completion?: boolean;
  readonly guide?: string;
  readonly legacy?: boolean;
};
type Group = {
  readonly title: string;
  readonly semantics: "all_of" | "any_of";
  readonly members: readonly string[];
};
type PhaseRule = {
  readonly gate: { readonly all_of: readonly string[] };
  readonly optional?: readonly string[];
  readonly preview?: boolean;
};
type Requirements = {
  readonly updated_at?: string;
  readonly phases: Readonly<Record<string, PhaseRule>>;
  readonly groups: Readonly<Record<string, Group>>;
  readonly steps: Readonly<Record<string, Step>>;
  readonly aliases?: Readonly<Record<string, string>>;
};
type CatalogResource = {
  readonly id: string;
  readonly kind?: string;
  readonly markdown?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly html?: string;
  readonly lessons?: readonly {
    readonly id: string;
    readonly title: string;
    readonly html?: string;
  }[];
};
type Catalog = {
  readonly updated_at?: string;
  readonly resources: readonly CatalogResource[];
  readonly skills: readonly {
    readonly id: string;
    readonly version: string;
    readonly current: string;
    readonly versioned?: string;
  }[];
};
type Json =
  | string
  | number
  | boolean
  | null
  | readonly Json[]
  | { readonly [key: string]: Json };
type ToolResult = {
  readonly content: readonly { readonly type: "text"; readonly text: string }[];
  readonly structuredContent?: { readonly [key: string]: Json };
  readonly isError?: boolean;
};
type JsonRpcId = string | number;

export const mcpPath: string = "/mcp";
export const mcpMaxBytes: number = 16_384;
export const supportedProtocolVersions: readonly string[] = [
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
];
const serverVersion: string = "0.1.0";
const canonicalOrigin: string = siteOrigins.canonicalOrigin;
const siteHosts: ReadonlySet<string> = new Set(
  Object.values(siteOrigins).map(
    (origin: string): string => new URL(origin).host,
  ),
);
const loopbackHosts: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);
// Chat apps call remote MCP servers from their own infrastructure; an Origin
// header, when sent at all, is the app's or the site's own origin.
const clientOrigins: ReadonlySet<string> = new Set([
  "https://claude.ai",
  "https://claude.com",
  "https://chatgpt.com",
  "https://chat.openai.com",
]);
const readOnly = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;
const stepIdPattern: RegExp = /^[a-z0-9][a-z0-9-]{0,47}$/;
const topicPattern: RegExp = /^[A-Za-z0-9][A-Za-z0-9 '-]{0,39}$/;
// Shapes of common keys, tokens, private keys, signed tokens, emails and URLs
// with embedded credentials. Matching input is refused and never repeated.
const secretShapes: readonly RegExp[] = [
  /(?:^|[^A-Za-z0-9])(?:gh[pousr]_|github_pat_|glpat-|xox[abeprs]-|sk-|sk_|pk_|rk_|AKIA|ASIA|AIza|npm_|hf_)[A-Za-z0-9_-]{6,}/,
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/,
  /-----BEGIN [A-Z ]*KEY/,
  /[^\s@]+@[^\s@]+\.[^\s@]+/,
  /(?=[A-Za-z0-9+/=_]*\d)(?=[A-Za-z0-9+/=_]*[A-Za-z])[A-Za-z0-9+/=_]{24,}/,
  /[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/i,
];
const secretWords: RegExp =
  /pass(?:word|wd|phrase|code)|secret|token|api[ _-]?key|bearer|private[ _-]?key|recovery|one[ _-]?time|2fa|otp\b/i;
// Registry text written for agents that maintain progress records; learners
// never need it, so sentences containing it are left out of tool output.
const agentOnlyWording: RegExp =
  /aggregate|provenance|fabricat|reconcil|\bchild(?:ren)?\b|\balias|summary-only|waive|verification object|gate_for|historical|artifacts\.|choices\.|\bSHA\b|recursive/i;

export const refusalText: string =
  "Refused: a value looked like a password, key, token or personal detail, so it was not used, stored or repeated. Send only public step IDs such as github-mobile. If a real secret was shared, change it.";

const instructions: string =
  "Starter Pack is a free, accountless course for making and deploying software with your own AI agent. Phase 1: phone app, accounts and a first working app. Phase 2: computer setup, plan, build and a live deployment. Phase 3 (optional): make software agent native. Use get_phase_guidance for what a phase requires, next_action for the learner's next step, and list_skills for hosted skills. Answer from tool results, not memory. Never send passwords, keys, tokens or personal details to these tools; only public step IDs.";

export const mcpTools: readonly { readonly [key: string]: Json }[] = [
  {
    name: "get_phase_guidance",
    title: "Starter Pack phase guidance",
    description:
      "Look up the official Starter Pack course content for one phase: what the phase is for, every required step with what done means and a guide link, optional steps, and lessons. Call this before answering any question about a Starter Pack phase or step; do not answer from memory. Phase 1 = phone app, accounts and a first working app. Phase 2 = computer setup, plan, build and deploy. Phase 3 = make it agent native (optional). Optional topic narrows the result by a keyword such as deploy or github. Read-only; nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {
        phase: {
          type: "integer",
          enum: [1, 2, 3],
          description: "Phase number: 1, 2 or 3.",
        },
        topic: {
          type: "string",
          maxLength: 40,
          description:
            "Optional keyword to narrow steps and lessons, for example deploy, github or accounts.",
        },
      },
      required: ["phase"],
      additionalProperties: false,
    },
    annotations: { title: "Starter Pack phase guidance", ...readOnly },
  },
  {
    name: "next_action",
    title: "Next Starter Pack step",
    description:
      "Work out the learner's next required Starter Pack step. Call this whenever the learner asks what to do next or where they are in the Starter Pack. Pass the phase and the step IDs the learner says are finished (IDs come from get_phase_guidance, for example github-mobile); pass an empty list when they are just starting. Returns the next step, what done means, a guide link and anything to check first. Only send step IDs: never passwords, keys, tokens, emails or other personal details. Read-only; nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {
        phase: {
          type: "integer",
          enum: [1, 2, 3],
          description: "Phase number: 1, 2 or 3.",
        },
        completed_steps: {
          type: "array",
          maxItems: 60,
          items: { type: "string", maxLength: 48, pattern: "^[a-z0-9-]+$" },
          description:
            "Step IDs the learner has finished, such as primary-ai-phone-app. Use [] when starting.",
        },
      },
      required: ["phase", "completed_steps"],
      additionalProperties: false,
    },
    annotations: { title: "Next Starter Pack step", ...readOnly },
  },
  {
    name: "list_skills",
    title: "Starter Pack skills",
    description:
      "List the Starter Pack's hosted agent skills (instructions an agent can load, such as the Starter Pack companion and Computer Setup) with each one's current version, summary and link. Call this when the learner asks which skills exist or which version is current. Takes no input. Read-only; nothing is stored.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { title: "Starter Pack skills", ...readOnly },
  },
];

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const headers: Readonly<Record<string, string>> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
function httpError(
  status: number,
  message: string,
  extra: Record<string, string> = {},
): Response {
  return Response.json(
    { jsonrpc: "2.0", id: null, error: { code: -32600, message } },
    { status, headers: { ...headers, ...extra } },
  );
}
function rpcResult(
  id: JsonRpcId,
  result: { readonly [key: string]: Json },
): Response {
  return Response.json({ jsonrpc: "2.0", id, result }, { headers });
}
function rpcError(
  id: JsonRpcId | null,
  code: number,
  message: string,
  status: number = 200,
): Response {
  return Response.json(
    { jsonrpc: "2.0", id, error: { code, message } },
    { status, headers },
  );
}

export function allowedHost(hostname: string, host: string): boolean {
  return (
    siteHosts.has(host) ||
    loopbackHosts.has(hostname) ||
    /^starter-pack(?:-[a-z0-9]+)*\.uppercut-labs\.workers\.dev$/.test(hostname)
  );
}

export function allowedOrigin(
  origin: string | null,
  requestOrigin: string,
): boolean {
  if (origin === null) return true;
  if (origin === requestOrigin || clientOrigins.has(origin)) return true;
  if (Object.values(siteOrigins).includes(origin)) return true;
  try {
    const parsed: URL = new URL(origin);
    return (
      parsed.origin === origin &&
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      loopbackHosts.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function looksSecret(value: string, words: boolean): boolean {
  return (
    secretShapes.some((pattern: RegExp): boolean => pattern.test(value)) ||
    (words && secretWords.test(value))
  );
}

function strings(value: unknown, depth: number = 0): string[] {
  if (depth > 4) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value))
    return value.flatMap((item: unknown): string[] => strings(item, depth + 1));
  if (isRecord(value))
    return Object.entries(value).flatMap(
      ([key, item]: [string, unknown]): string[] => [
        key,
        ...strings(item, depth + 1),
      ],
    );
  return [];
}

// Per-isolate cache of the site's own built JSON. Nothing is written anywhere.
type CacheEntry = { readonly at: number; readonly value: Promise<unknown> };
const caches: WeakMap<object, Map<string, CacheEntry>> = new WeakMap();
async function siteJson(
  env: McpEnv,
  path: string,
  origin: string,
): Promise<unknown> {
  // Keyed by the ASSETS binding so a cache never outlives its deployment.
  let cache: Map<string, CacheEntry> | undefined = caches.get(env.ASSETS);
  if (!cache) {
    cache = new Map();
    caches.set(env.ASSETS, cache);
  }
  const entries: Map<string, CacheEntry> = cache;
  const hit: CacheEntry | undefined = entries.get(path);
  if (hit && Date.now() - hit.at < 60_000) return hit.value;
  const value: Promise<unknown> = env.ASSETS.fetch(
    new Request(new URL(path, origin), { method: "GET" }),
  ).then(async (response: Response): Promise<unknown> => {
    if (!response.ok) throw new Error("Site resource unavailable.");
    return response.json();
  });
  entries.set(path, { at: Date.now(), value });
  value.catch((): void => {
    entries.delete(path);
  });
  return value;
}
async function loadRequirements(
  env: McpEnv,
  origin: string,
): Promise<Requirements> {
  const value: unknown = await siteJson(
    env,
    "/agent/requirements.json",
    origin,
  );
  if (
    !isRecord(value) ||
    !isRecord(value["phases"]) ||
    !isRecord(value["steps"]) ||
    !isRecord(value["groups"])
  )
    throw new Error("Site requirements unavailable.");
  return value as unknown as Requirements;
}
async function loadCatalog(env: McpEnv, origin: string): Promise<Catalog> {
  const value: unknown = await siteJson(env, "/agent/catalog.json", origin);
  if (
    !isRecord(value) ||
    !Array.isArray(value["resources"]) ||
    !Array.isArray(value["skills"])
  )
    throw new Error("Site catalog unavailable.");
  return value as unknown as Catalog;
}

function link(path: string | undefined): string | undefined {
  return path === undefined ? undefined : new URL(path, canonicalOrigin).href;
}
function titleOf(req: Requirements, id: string): string {
  return req.steps[id]?.title ?? req.groups[id]?.title ?? id;
}
function childrenOf(
  req: Requirements,
  id: string,
): { readonly kind: "all_of" | "any_of"; readonly ids: readonly string[] }[] {
  // A group nested in a part of the same kind is only a wrapper: show its members.
  const flatten = (
    kind: "all_of" | "any_of",
    ids: readonly string[],
    depth: number = 0,
  ): readonly string[] =>
    ids.flatMap((child: string): readonly string[] => {
      const inner: Group | undefined = req.groups[child];
      return depth < 6 && inner?.semantics === kind
        ? flatten(kind, inner.members, depth + 1)
        : [child];
    });
  const step: Step | undefined = req.steps[id];
  if (step?.completion) {
    const parts: { kind: "all_of" | "any_of"; ids: readonly string[] }[] = [];
    if (step.completion.all_of)
      parts.push({
        kind: "all_of",
        ids: flatten("all_of", step.completion.all_of),
      });
    if (step.completion.any_of)
      parts.push({
        kind: "any_of",
        ids: flatten("any_of", step.completion.any_of),
      });
    return parts;
  }
  const group: Group | undefined = req.groups[id];
  return group
    ? [{ kind: group.semantics, ids: flatten(group.semantics, group.members) }]
    : [];
}
function leafTitles(
  req: Requirements,
  id: string,
  depth: number = 0,
): string[] {
  if (depth > 6) return [];
  const parts = childrenOf(req, id);
  if (parts.length === 0) return [titleOf(req, id)];
  return parts.flatMap((part): string[] =>
    part.kind === "any_of"
      ? [
          `one of: ${part.ids.map((child: string): string => titleOf(req, child)).join(", ")}`,
        ]
      : part.ids.flatMap((child: string): string[] =>
          leafTitles(req, child, depth + 1),
        ),
  );
}

export function doneWhen(req: Requirements, id: string): string {
  const meaning: string = (req.steps[id]?.completion_meaning ?? "")
    .replace(/\breconciled\s+/g, "")
    .replace(/\bcurrent-revision\s+/g, "");
  const kept: string[] = meaning
    .split(/(?<=[.!?])\s+/)
    .map((sentence: string): string => sentence.trim())
    .filter(
      (sentence: string): boolean =>
        sentence.length > 0 && !agentOnlyWording.test(sentence),
    );
  if (kept.length > 0) return kept.slice(0, 2).join(" ");
  const leaves: string[] = leafTitles(req, id);
  return leaves.length > 1 || leaves[0] !== titleOf(req, id)
    ? `Done when these are ready: ${leaves.join("; ")}.`
    : `Done when ${titleOf(req, id).toLowerCase()} is finished.`;
}

function describe(
  req: Requirements,
  id: string,
): { readonly [key: string]: Json } {
  const step: Step | undefined = req.steps[id];
  const parts = childrenOf(req, id);
  const out: { [key: string]: Json } = {
    id,
    title: titleOf(req, id),
    done_when: doneWhen(req, id),
  };
  const guide: string | undefined = link(step?.guide);
  if (guide) out["guide"] = guide;
  for (const part of parts) {
    const items: Json[] = part.ids.map(
      (child: string): Json => ({ id: child, title: titleOf(req, child) }),
    );
    out[part.kind === "any_of" ? "choose_one_of" : "includes"] = items;
  }
  return out;
}

function makeIsDone(
  req: Requirements,
  done: ReadonlySet<string>,
): (id: string) => boolean {
  const isDone = (id: string, depth: number = 0): boolean => {
    if (depth > 8) return false;
    const step: Step | undefined = req.steps[id];
    if (
      done.has(id) &&
      step &&
      (!step.completion || step.allow_recorded_completion)
    )
      return true;
    const parts = childrenOf(req, id);
    if (parts.length === 0) return false;
    return parts.every((part): boolean =>
      part.kind === "any_of"
        ? part.ids.some((child: string): boolean => isDone(child, depth + 1))
        : part.ids.every((child: string): boolean => isDone(child, depth + 1)),
    );
  };
  return (id: string): boolean => isDone(id);
}

function stillNeeded(
  req: Requirements,
  id: string,
  isDone: (id: string) => boolean,
  depth: number = 0,
): Json[] {
  if (depth > 6 || isDone(id)) return [];
  const parts = childrenOf(req, id);
  if (parts.length === 0) return [{ id, title: titleOf(req, id) }];
  return parts.flatMap((part): Json[] => {
    if (part.kind === "all_of")
      return part.ids.flatMap((child: string): Json[] =>
        stillNeeded(req, child, isDone, depth + 1),
      );
    if (part.ids.some(isDone)) return [];
    return [
      {
        choose_one_of: part.ids.map(
          (child: string): Json => ({ id: child, title: titleOf(req, child) }),
        ),
      },
    ];
  });
}

function phaseIds(req: Requirements, key: string): string[] {
  const ids: Set<string> = new Set();
  const add = (id: string, depth: number = 0): void => {
    if (depth > 8 || ids.has(id) || req.steps[id]?.legacy) return;
    if (!req.steps[id] && !req.groups[id]) return;
    ids.add(id);
    for (const part of childrenOf(req, id))
      for (const child of part.ids) add(child, depth + 1);
    for (const prerequisite of req.steps[id]?.prerequisites ?? [])
      add(prerequisite, depth + 1);
  };
  const rule: PhaseRule | undefined = req.phases[key];
  for (const id of [...(rule?.gate.all_of ?? []), ...(rule?.optional ?? [])])
    add(id);
  for (const [id, step] of Object.entries(req.steps))
    if (step.phase === key) add(id);
  return [...ids];
}

function text(data: { readonly [key: string]: Json }): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}
function failure(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
const unavailable: string =
  "The Starter Pack course content could not be read right now. Try again shortly, or use the copyable starting prompt on the Starter Pack site.";

function readPhase(value: unknown): number | undefined {
  const phase: unknown =
    typeof value === "string" && /^[1-3]$/.test(value) ? Number(value) : value;
  return phase === 1 || phase === 2 || phase === 3 ? phase : undefined;
}

async function getPhaseGuidance(
  args: Readonly<Record<string, unknown>>,
  env: McpEnv,
  origin: string,
): Promise<ToolResult> {
  if (
    Object.keys(args).some(
      (key: string): boolean => key !== "phase" && key !== "topic",
    )
  )
    return failure("Only phase and topic are accepted.");
  const phase: number | undefined = readPhase(args["phase"]);
  if (phase === undefined) return failure("phase must be 1, 2 or 3.");
  const rawTopic: unknown = args["topic"];
  if (
    rawTopic !== undefined &&
    (typeof rawTopic !== "string" || !topicPattern.test(rawTopic.trim()))
  )
    return failure(
      "topic must be one short keyword of letters, digits, spaces or hyphens (40 characters at most).",
    );
  const topic: string | undefined =
    typeof rawTopic === "string" ? rawTopic.trim().toLowerCase() : undefined;
  let req: Requirements, catalog: Catalog;
  try {
    [req, catalog] = await Promise.all([
      loadRequirements(env, origin),
      loadCatalog(env, origin),
    ]);
  } catch {
    return failure(unavailable);
  }
  const key: string = `phase-${phase}`;
  const rule: PhaseRule | undefined = req.phases[key];
  if (!rule) return failure(unavailable);
  const resource: CatalogResource | undefined = catalog.resources.find(
    (item: CatalogResource): boolean => item.id === key,
  );
  const required: { readonly [key: string]: Json }[] = rule.gate.all_of.map(
    (id: string) => describe(req, id),
  );
  const optional: { readonly [key: string]: Json }[] = (
    rule.optional ?? []
  ).map((id: string) => describe(req, id));
  // Standalone lesson pages for this phase (such as /phases/2/planning) come
  // first, so the 15-item limit never drops them.
  const pages: Json[] = catalog.resources
    .filter(
      (item: CatalogResource): boolean =>
        item.kind === "lesson" &&
        item.html !== undefined &&
        new RegExp(`^https?://[^/]+/phases/${phase}/[a-z0-9-]+$`).test(
          item.html,
        ),
    )
    .map(
      (item: CatalogResource): Json => ({
        title: item.title ?? item.id,
        ...(item.html ? { link: item.html } : {}),
        ...(item.markdown ? { markdown: item.markdown } : {}),
      }),
    );
  const lessons: Json[] = [
    ...pages,
    ...(resource?.lessons ?? []).map(
      (lesson): Json => ({
        title: lesson.title,
        ...(lesson.html ? { link: lesson.html } : {}),
      }),
    ),
  ];
  const matches = (item: Json): boolean =>
    !topic || JSON.stringify(item).toLowerCase().includes(topic);
  const narrowed: boolean =
    topic !== undefined && [...required, ...optional, ...lessons].some(matches);
  const data: { [key: string]: Json } = {
    phase,
    title: resource?.title ?? `Phase ${phase}`,
    summary: resource?.summary ?? "",
    status: rule.preview ? "preview" : "current",
    required_steps: narrowed ? required.filter(matches) : required,
    optional_steps: narrowed ? optional.filter(matches) : optional,
    lessons: (narrowed ? lessons.filter(matches) : lessons).slice(0, 15),
    read_more: resource?.html ?? link(`/phases/${phase}`) ?? "",
    how_to_use:
      "Every required step must be done to finish the phase. Use next_action with the step IDs the learner has finished to find what to do next.",
  };
  if (topic !== undefined && !narrowed)
    data["note"] = "Nothing matched that topic, so the whole phase is shown.";
  return text(data);
}

async function nextAction(
  args: Readonly<Record<string, unknown>>,
  env: McpEnv,
  origin: string,
): Promise<ToolResult> {
  if (
    Object.keys(args).some(
      (key: string): boolean => key !== "phase" && key !== "completed_steps",
    )
  )
    return failure("Only phase and completed_steps are accepted.");
  const phase: number | undefined = readPhase(args["phase"]);
  if (phase === undefined) return failure("phase must be 1, 2 or 3.");
  const raw: unknown = args["completed_steps"] ?? [];
  if (
    !Array.isArray(raw) ||
    raw.length > 60 ||
    raw.some((item: unknown): boolean => typeof item !== "string")
  )
    return failure(
      "completed_steps must be a list of at most 60 step IDs. Use [] when starting.",
    );
  const entries: string[] = raw.map((item: string): string =>
    item.trim().toLowerCase(),
  );
  const malformed: number = entries.filter(
    (item: string): boolean => !stepIdPattern.test(item),
  ).length;
  if (malformed > 0)
    return failure(
      `${malformed} entr${malformed === 1 ? "y is" : "ies are"} not a step ID (lowercase letters, digits and hyphens, 48 characters at most). Call get_phase_guidance for valid IDs.`,
    );
  let req: Requirements;
  try {
    req = await loadRequirements(env, origin);
  } catch {
    return failure(unavailable);
  }
  const key: string = `phase-${phase}`;
  const rule: PhaseRule | undefined = req.phases[key];
  if (!rule) return failure(unavailable);
  const resolved: string[] = entries.map(
    (id: string): string => req.aliases?.[id] ?? id,
  );
  const unknown: number = resolved.filter(
    (id: string): boolean => !req.steps[id] && !req.groups[id],
  ).length;
  if (unknown > 0)
    return failure(
      `${unknown} entr${unknown === 1 ? "y is" : "ies are"} not a Starter Pack step ID and ${unknown === 1 ? "was" : "were"} not used. Valid IDs for Phase ${phase}: ${phaseIds(req, key).join(", ")}.`,
    );
  const isDone = makeIsDone(req, new Set(resolved));
  const gate: readonly string[] = rule.gate.all_of;
  const next: string | undefined = gate.find(
    (id: string): boolean => !isDone(id),
  );
  const base: { [key: string]: Json } = {
    phase,
    status: rule.preview ? "preview" : "current",
  };
  if (next === undefined)
    return text({
      ...base,
      result: "phase-complete",
      message: `Every required Phase ${phase} step is reported done. Ask your Starter Pack companion to check it and save it in your progress file.`,
    });
  return text({
    ...base,
    result: "next-step",
    remaining_required: gate.filter((id: string): boolean => !isDone(id))
      .length,
    next_step: describe(req, next),
    still_needed: stillNeeded(req, next, isDone),
    check_first: (req.steps[next]?.prerequisites ?? [])
      .filter((id: string): boolean => !isDone(id))
      .map((id: string): Json => ({ id, title: titleOf(req, id) })),
    note: "Based only on the step IDs supplied. Your companion and your own progress file stay the record; nothing was saved.",
  });
}

async function listSkills(
  args: Readonly<Record<string, unknown>>,
  env: McpEnv,
  origin: string,
): Promise<ToolResult> {
  if (Object.keys(args).length > 0)
    return failure("list_skills takes no input.");
  let catalog: Catalog;
  try {
    catalog = await loadCatalog(env, origin);
  } catch {
    return failure(unavailable);
  }
  return text({
    skills: catalog.skills.map((skill): Json => {
      const resource: CatalogResource | undefined = catalog.resources.find(
        (item: CatalogResource): boolean => item.id === skill.id,
      );
      return {
        id: skill.id,
        title: resource?.title ?? skill.id,
        summary: resource?.summary ?? "",
        version: skill.version,
        link: skill.current,
      };
    }),
    all_skills: link("/skills") ?? "",
  });
}

const tools: Readonly<
  Record<
    string,
    (
      args: Readonly<Record<string, unknown>>,
      env: McpEnv,
      origin: string,
    ) => Promise<ToolResult>
  >
> = {
  get_phase_guidance: getPhaseGuidance,
  next_action: nextAction,
  list_skills: listSkills,
};

async function readBody(request: Request): Promise<string | undefined> {
  if (Number(request.headers.get("Content-Length") ?? "0") > mcpMaxBytes)
    return undefined;
  if (!request.body) return "";
  const reader: ReadableStreamDefaultReader<Uint8Array> =
    request.body.getReader();
  const decoder: TextDecoder = new TextDecoder();
  let body: string = "";
  let bytes: number = 0;
  while (true) {
    const chunk: ReadableStreamReadResult<Uint8Array> = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > mcpMaxBytes) {
      await reader.cancel();
      return undefined;
    }
    body += decoder.decode(chunk.value, { stream: true });
  }
  return body + decoder.decode();
}

function log(method: string, tool: string | undefined, status: string): void {
  // Method, tool name and outcome only; never arguments, IDs or addresses.
  console.log(
    JSON.stringify({ event: "mcp", method, ...(tool ? { tool } : {}), status }),
  );
}

const knownMethods: ReadonlySet<string> = new Set([
  "initialize",
  "ping",
  "tools/list",
  "tools/call",
  "resources/list",
  "resources/templates/list",
  "prompts/list",
]);

export async function handleMcp(
  request: Request,
  env: McpEnv,
): Promise<Response> {
  const url: URL = new URL(request.url);
  if (!allowedHost(url.hostname, url.host))
    return httpError(403, "Unknown host.");
  if (request.method !== "POST")
    return httpError(405, "This MCP endpoint accepts POST only.", {
      Allow: "POST",
    });
  if (!allowedOrigin(request.headers.get("Origin"), url.origin)) {
    log("origin", undefined, "rejected");
    return httpError(403, "Origin not allowed.");
  }
  if (env.MCP_RATE_LIMITER) {
    try {
      const key: string = request.headers.get("CF-Connecting-IP") ?? "unknown";
      if (!(await env.MCP_RATE_LIMITER.limit({ key })).success)
        return httpError(
          429,
          "Too many requests. Wait a minute and try again.",
          { "Retry-After": "60" },
        );
    } catch {
      // Read-only public content: a limiter outage does not block learners.
    }
  }
  const version: string | null = request.headers.get("MCP-Protocol-Version");
  if (version !== null && !supportedProtocolVersions.includes(version))
    return httpError(400, "Unsupported MCP protocol version.");
  if (
    request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !==
    "application/json"
  )
    return httpError(415, "Send JSON-RPC as application/json.");
  const body: string | undefined = await readBody(request);
  if (body === undefined) return httpError(413, "Request too large.");
  let message: unknown;
  try {
    message = JSON.parse(body);
  } catch {
    return rpcError(null, -32700, "Parse error.", 400);
  }
  if (Array.isArray(message))
    return rpcError(null, -32600, "Batch requests are not supported.", 400);
  if (!isRecord(message) || message["jsonrpc"] !== "2.0")
    return rpcError(null, -32600, "Invalid request.", 400);
  const rawId: unknown = message["id"];
  const method: unknown = message["method"];
  // Notifications and client responses need no reply.
  if (
    rawId === undefined ||
    (method === undefined && ("result" in message || "error" in message))
  )
    return new Response(null, { status: 202, headers });
  if (
    !(
      (typeof rawId === "string" && rawId.length <= 128) ||
      (typeof rawId === "number" && Number.isFinite(rawId))
    )
  )
    return rpcError(null, -32600, "Invalid request ID.", 400);
  const id: JsonRpcId = rawId;
  if (typeof method !== "string")
    return rpcError(id, -32600, "Invalid request.");
  const params: unknown = message["params"] ?? {};
  if (!isRecord(params)) return rpcError(id, -32602, "Invalid params.");
  const logged: string = knownMethods.has(method) ? method : "other";
  switch (method) {
    case "initialize": {
      const requested: unknown = params["protocolVersion"];
      const protocolVersion: string =
        typeof requested === "string" &&
        supportedProtocolVersions.includes(requested)
          ? requested
          : (supportedProtocolVersions[0] ?? "2025-11-25");
      log(logged, undefined, "ok");
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: "starter-pack",
          title: "Starter Pack",
          version: serverVersion,
          description:
            "Read-only Starter Pack course guidance, next steps and skills.",
          websiteUrl: canonicalOrigin,
          icons: [
            {
              src: `${canonicalOrigin}/plugins/starter-pack-icon.png`,
              mimeType: "image/png",
              sizes: ["512x512"],
            },
          ],
        },
        instructions,
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      log(logged, undefined, "ok");
      return rpcResult(id, { tools: [...mcpTools] });
    case "resources/list":
      return rpcResult(id, { resources: [] });
    case "resources/templates/list":
      return rpcResult(id, { resourceTemplates: [] });
    case "prompts/list":
      return rpcResult(id, { prompts: [] });
    case "tools/call": {
      const name: unknown = params["name"];
      const args: unknown = params["arguments"] ?? {};
      const tool =
        typeof name === "string" && Object.hasOwn(tools, name)
          ? tools[name]
          : undefined;
      if (!tool || typeof name !== "string") {
        log(logged, "unknown", "error");
        return rpcError(
          id,
          -32602,
          "Unknown tool. Available tools: get_phase_guidance, next_action, list_skills. All are read-only.",
        );
      }
      if (!isRecord(args)) {
        log(logged, name, "error");
        return rpcResult(
          id,
          failure("arguments must be an object.") as unknown as {
            readonly [key: string]: Json;
          },
        );
      }
      const values: string[] = strings(args);
      if (
        values.some((value: string): boolean =>
          looksSecret(value, name === "next_action"),
        )
      ) {
        log(logged, name, "refused");
        return rpcResult(
          id,
          failure(refusalText) as unknown as { readonly [key: string]: Json },
        );
      }
      const result: ToolResult = await tool(args, env, url.origin);
      log(logged, name, result.isError ? "error" : "ok");
      return rpcResult(
        id,
        result as unknown as { readonly [key: string]: Json },
      );
    }
    default:
      log("other", undefined, "error");
      return rpcError(id, -32601, "Method not found.");
  }
}
