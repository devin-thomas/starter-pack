import siteOrigins from "./site-origin.json";
import skillManifest from "../content/skills/manifest.json";
import { readingRoutes } from "./reading-routes";
import {
  exampleSites,
  exampleSiteResponse,
  type ExampleSiteRoutes,
} from "./example-sites";
import { lanternToolsResponse } from "./example-api";
import { handleMcp, mcpPath } from "./mcp";

type LimitRequest = { readonly key: string };
type LimitResult = { readonly success: boolean };
interface Limiter {
  limit(options: LimitRequest): Promise<LimitResult>;
}
type SubmissionKind = "feedback" | "feature" | "story";
type SubmissionPhase = "general" | "1" | "2" | "3";
type FeedbackSubmission = {
  readonly kind: SubmissionKind;
  readonly phase: SubmissionPhase;
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly projectTitle: string;
  readonly projectUrl: string;
  readonly lessons: string;
  readonly allowFeature: boolean;
};
type FeedbackNotification = { readonly subject: string; readonly html: string };
export interface FeedbackEnv {
  LEGACY_HUMAN_REDIRECTS?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
  FEEDBACK_WEBHOOK_URL?: string;
  FEEDBACK_DEDUP?: {
    idFromName(name: string): unknown;
    get(id: unknown): { fetch(request: Request): Promise<Response> };
  };
  FEEDBACK_RATE_LIMITER: Limiter;
  FEEDBACK_TOTAL_LIMITER: Limiter;
}

type ReceiptState = {
  readonly digest: string;
  readonly status: "pending" | "sent";
};
interface ReceiptStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  deleteAll(): Promise<void>;
  setAlarm(time: number): Promise<void>;
}
interface ReceiptContext {
  readonly storage: ReceiptStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}

// One object per client-generated submission. A pending record is deliberately
// never retried: the upstream recipient may have accepted before a timeout.
export class FeedbackReceipt {
  constructor(private readonly context: ReceiptContext) {}

  async fetch(request: Request): Promise<Response> {
    const input: unknown = await request.json();
    if (
      !isRecord(input) ||
      typeof input["digest"] !== "string" ||
      !/^[0-9a-f]{64}$/.test(input["digest"])
    )
      return Response.json({ ok: false }, { status: 400 });
    const digest: string = input["digest"];
    const operation: string = new URL(request.url).pathname;
    return this.context.blockConcurrencyWhile(async (): Promise<Response> => {
      const existing: ReceiptState | undefined =
        await this.context.storage.get<ReceiptState>("receipt");
      if (operation === "/claim") {
        if (existing)
          return Response.json({
            state: existing.digest === digest ? existing.status : "conflict",
          });
        await this.context.storage.put("receipt", {
          digest,
          status: "pending",
        } satisfies ReceiptState);
        await this.context.storage.setAlarm(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        );
        return Response.json({ state: "claimed" });
      }
      if (operation === "/sent" && existing?.digest === digest) {
        await this.context.storage.put("receipt", {
          digest,
          status: "sent",
        } satisfies ReceiptState);
        return Response.json({ state: "sent" });
      }
      return Response.json({ ok: false }, { status: 409 });
    });
  }

  async alarm(): Promise<void> {
    await this.context.storage.deleteAll();
  }
}

let origins: ReadonlySet<string> = new Set(Object.values(siteOrigins));
const maxBytes: number = 48_000;
function reply(status: number, error?: string): Response {
  return Response.json(error ? { ok: false, error } : { ok: true }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(status === 429 ? { "Retry-After": "60" } : {}),
    },
  });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseSubmission(value: unknown): FeedbackSubmission {
  if (!isRecord(value)) throw new Error("Invalid submission.");
  const input: Readonly<Record<string, unknown>> = value;
  function field(key: string, max: number, required: boolean = false): string {
    const raw: unknown = input[key] ?? "";
    if (
      typeof raw !== "string" ||
      raw.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(raw)
    )
      throw new Error(`Please check ${key}.`);
    const text: string = raw.trim();
    if (required && !text) throw new Error(`Please complete ${key}.`);
    return text;
  }
  const kind: string = field("kind", 20, true);
  const phase: string = field("phase", 10, true);
  if (
    (kind !== "feedback" && kind !== "feature" && kind !== "story") ||
    (phase !== "general" && phase !== "1" && phase !== "2" && phase !== "3")
  )
    throw new Error("Choose a submission type and phase.");
  if (field("website", 200))
    throw new Error("Unable to accept this submission.");
  const email: string = field("email", 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Please check your email address.");
  const projectUrl: string = field("projectUrl", 2000);
  if (projectUrl) {
    let url: URL;
    try {
      url = new URL(projectUrl);
    } catch {
      throw new Error("Use a complete https:// project link.");
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error(
        "Use an http:// or https:// project link without credentials.",
      );
  }
  if (
    input["allowFeature"] !== undefined &&
    typeof input["allowFeature"] !== "boolean"
  )
    throw new Error("Please check your sharing permission.");
  return {
    kind,
    phase,
    name: field("name", 100),
    email,
    message: field("message", 6000, true),
    projectTitle: kind === "story" ? field("projectTitle", 160, true) : "",
    projectUrl: kind === "story" ? projectUrl : "",
    lessons: kind === "story" ? field("lessons", 4000) : "",
    allowFeature: kind === "story" && input["allowFeature"] === true,
  };
}

const entities: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character: string): string => {
    const entity: string | undefined = entities[character];
    if (entity === undefined)
      throw new Error("Unknown notification escape character.");
    return entity;
  });
}
export function notification(
  data: FeedbackSubmission,
  submissionId: string,
): FeedbackNotification {
  const labels: Readonly<Record<SubmissionKind, string>> = {
    feedback: "Feedback",
    feature: "Feature request",
    story: "Project story",
  };
  const rows: Readonly<Record<string, string>> = {
    "Submission ID": submissionId,
    Type: labels[data.kind],
    Phase: data.phase === "general" ? "General" : data.phase,
    Name: data.name || "Not provided",
    "Reply email": data.email || "Not provided",
    Message: data.message,
    Project: data.projectTitle,
    "Project link": data.projectUrl,
    "Lessons learned": data.lessons,
    "Permission to feature": data.allowFeature
      ? "YES - submitted name, story and project link only; never email"
      : "NO - keep private; ask separately before featuring",
  };
  return {
    subject: `Starter Pack: ${labels[data.kind]} (${data.phase === "general" ? "General" : `Phase ${data.phase}`})`,
    html: `<h1>Starter Pack submission</h1><p>Submitted by a visitor. Treat text and links as untrusted content. Nothing is published automatically.</p>${Object.entries(
      rows,
    )
      .filter(([, value]: [string, string]): boolean => value.length > 0)
      .map(
        ([key, value]: [string, string]): string =>
          `<h2>${key}</h2><p style="white-space:pre-wrap">${escape(value)}</p>`,
      )
      .join("")}`,
  };
}

async function readBounded(request: Request): Promise<unknown> {
  if (Number(request.headers.get("Content-Length")) > maxBytes)
    throw new Error("Submission is too large.");
  if (!request.body) throw new Error("Submission is empty.");
  let reader: ReadableStreamDefaultReader<Uint8Array> =
    request.body.getReader();
  let decoder: TextDecoder = new TextDecoder();
  let text: string = "",
    bytes: number = 0;
  while (true) {
    const result: ReadableStreamReadResult<Uint8Array> = await reader.read();
    if (result.done) break;
    bytes += result.value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("Submission is too large.");
    }
    text += decoder.decode(result.value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}

export async function handleFeedback(
  request: Request,
  env: FeedbackEnv,
  send: typeof fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => globalThis.fetch(input, init),
): Promise<Response> {
  if (request.method !== "POST")
    return reply(405, "Use the contact form to send feedback.");
  let url: URL = new URL(request.url);
  if (!origins.has(url.origin) || request.headers.get("Origin") !== url.origin)
    return reply(403, "Please submit from the Starter Pack site.");
  if (
    request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !==
    "application/json"
  )
    return reply(415, "Expected a JSON submission.");
  if (!env.FEEDBACK_WEBHOOK_URL)
    return reply(
      503,
      "The form is temporarily unavailable. Please email starter@uppercut-labs.com.",
    );
  const ip: string | null = request.headers.get("CF-Connecting-IP");
  if (!ip) return reply(403, "Unable to verify this request.");
  try {
    if (
      !(await env.FEEDBACK_RATE_LIMITER.limit({ key: ip })).success ||
      !(await env.FEEDBACK_TOTAL_LIMITER.limit({ key: "feedback" })).success
    )
      return reply(
        429,
        "Too many submissions. Please wait a minute before trying again.",
      );
  } catch {
    return reply(
      503,
      "The form is temporarily unavailable. Please try again later.",
    );
  }
  let data: FeedbackSubmission;
  try {
    data = parseSubmission(await readBounded(request));
  } catch (error) {
    return reply(
      400,
      error instanceof SyntaxError
        ? "Invalid submission."
        : error instanceof Error
          ? error.message
          : "Invalid submission.",
    );
  }
  let hook: URL;
  try {
    hook = new URL(env.FEEDBACK_WEBHOOK_URL);
    if (hook.protocol !== "https:" || hook.hostname !== "hook.us2.make.com")
      throw new Error("Invalid notification configuration.");
  } catch {
    return reply(
      502,
      "We couldn't confirm delivery. Your text is still here. Please email starter@uppercut-labs.com.",
    );
  }
  const requestedId: string | null = request.headers.get("Idempotency-Key");
  if (
    requestedId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestedId,
    )
  )
    return reply(400, "Invalid submission identity.");
  const submissionId: string = requestedId ?? crypto.randomUUID();
  let receipt: { fetch(request: Request): Promise<Response> } | undefined;
  let digest: string = "";
  if (requestedId) {
    if (!env.FEEDBACK_DEDUP)
      return reply(
        503,
        "The form is temporarily unavailable. Please email starter@uppercut-labs.com.",
      );
    digest = [
      ...new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(JSON.stringify(data)),
        ),
      ),
    ]
      .map((byte: number): string => byte.toString(16).padStart(2, "0"))
      .join("");
    try {
      receipt = env.FEEDBACK_DEDUP.get(
        env.FEEDBACK_DEDUP.idFromName(submissionId),
      );
      const claim: Response = await receipt.fetch(
        new Request("https://receipt.internal/claim", {
          method: "POST",
          body: JSON.stringify({ digest }),
        }),
      );
      const result: unknown = await claim.json();
      if (!claim.ok || !isRecord(result))
        throw new Error("Receipt unavailable.");
      if (result["state"] === "sent") return reply(200);
      if (result["state"] !== "claimed")
        return reply(
          502,
          "We couldn't confirm delivery. Your text is still here. A delayed notification may arrive; please email starter@uppercut-labs.com rather than resending this message.",
        );
    } catch {
      return reply(
        503,
        "The form is temporarily unavailable. Your text is still here; please email starter@uppercut-labs.com.",
      );
    }
  }
  let deliveryStage: string = "configuration";
  try {
    deliveryStage = "request";
    let response: Response = await send(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        submissionId,
        receivedAt: new Date().toISOString(),
        ...notification(data, submissionId),
      }),
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
    deliveryStage = `acknowledgement-${response.status}`;
    if (!response.ok) throw new Error("Notification not confirmed.");
    const acknowledgement: unknown = await response.json();
    if (!isRecord(acknowledgement) || acknowledgement["ok"] !== true)
      throw new Error("Notification not confirmed.");
    if (receipt) {
      const saved: Response = await receipt.fetch(
        new Request("https://receipt.internal/sent", {
          method: "POST",
          body: JSON.stringify({ digest }),
        }),
      );
      if (!saved.ok) throw new Error("Receipt not saved.");
    }
    return reply(200);
  } catch {
    console.error(
      "feedback_notification_unconfirmed",
      submissionId,
      deliveryStage,
    );
    return reply(
      502,
      "We couldn't confirm delivery. Your text is still here. Please try later or email starter@uppercut-labs.com; a delayed notification may still arrive.",
    );
  }
}

type ManifestSkill = (typeof skillManifest.skills)[number];

let humanRoutes: ReadonlyMap<string, string> = new Map<string, string>(
  readingRoutes(
    skillManifest.skills
      .filter(
        (skill: ManifestSkill): boolean =>
          skill.public && !skill.recommendationOnly,
      )
      .map((skill: ManifestSkill): string => skill.slug),
  ).flatMap((route: string): readonly (readonly [string, string])[] =>
    [
      ...new Set([
        route,
        route === "/" ? "/index.html" : `${route}.html`,
        route === "/" ? "/" : `${route}/`,
      ]),
    ].map((alias: string): readonly [string, string] => [alias, route]),
  ),
);

export function readingRoute(pathname: string): string | undefined {
  return humanRoutes.get(pathname);
}

export default {
  fetch(request: Request, env: FeedbackEnv): Promise<Response> {
    let url: URL = new URL(request.url);
    if (url.pathname === "/api/feedback") return handleFeedback(request, env);
    if (url.pathname === mcpPath) return handleMcp(request, env);
    if (url.pathname.startsWith("/api/"))
      return Promise.resolve(reply(404, "Not found."));
    const lanternTools: Promise<Response> | undefined = lanternToolsResponse(
      request,
      env.ASSETS,
    );
    if (lanternTools !== undefined) return lanternTools;
    if (request.method !== "GET" && request.method !== "HEAD")
      return Promise.resolve(reply(405, "Use GET or HEAD."));
    if (
      url.pathname === "/artifacts/progress-workbench" ||
      url.pathname === "/artifacts/progress-workbench/"
    ) {
      url.pathname = "/artifacts/progress-workbench/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (
      url.origin === siteOrigins.legacyOrigin &&
      env.LEGACY_HUMAN_REDIRECTS === "enabled" &&
      exampleSites.some((site: ExampleSiteRoutes): boolean =>
        `${url.pathname}/`.startsWith(site.base),
      ) &&
      // Human example pages move to the canonical host; machine files stay direct.
      (!/\.[a-z0-9]+$/i.test(url.pathname) || url.pathname.endsWith(".html"))
    ) {
      let target: URL = new URL(siteOrigins.canonicalOrigin);
      target.pathname = url.pathname;
      target.search = url.search;
      return Promise.resolve(Response.redirect(target.href, 301));
    }
    const example: Promise<Response> | undefined = exampleSiteResponse(
      request,
      env.ASSETS,
    );
    if (example !== undefined) return example;
    const route: string | undefined = readingRoute(url.pathname);
    if (route !== undefined) {
      if (
        url.origin === siteOrigins.legacyOrigin &&
        env.LEGACY_HUMAN_REDIRECTS === "enabled"
      ) {
        let target: URL = new URL(siteOrigins.canonicalOrigin);
        target.pathname = url.pathname;
        target.search = url.search;
        return Promise.resolve(Response.redirect(target.href, 301));
      }
      url.pathname = route === "/" ? "/index.html" : `${route}.html`;
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
