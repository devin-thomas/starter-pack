import siteOrigins from "./site-origin.json";
import skillManifest from "../content/skills/manifest.json";
import { readingRoutes } from "./reading-routes";

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
  FEEDBACK_RATE_LIMITER: Limiter;
  FEEDBACK_TOTAL_LIMITER: Limiter;
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
      "The form is temporarily unavailable. Please email starter@devthomas.site.",
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
  const submissionId: string = crypto.randomUUID();
  let deliveryStage: string = "configuration";
  try {
    let hook: URL = new URL(env.FEEDBACK_WEBHOOK_URL);
    if (hook.protocol !== "https:" || hook.hostname !== "hook.us2.make.com")
      throw new Error("Invalid notification configuration.");
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
    return reply(200);
  } catch {
    console.error(
      "feedback_notification_unconfirmed",
      submissionId,
      deliveryStage,
    );
    return reply(
      502,
      "We couldn't confirm delivery. Your text is still here. Please try later or email starter@devthomas.site; a delayed notification may still arrive.",
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
    if (url.pathname.startsWith("/api/"))
      return Promise.resolve(reply(404, "Not found."));
    if (request.method !== "GET" && request.method !== "HEAD")
      return Promise.resolve(reply(405, "Use GET or HEAD."));
    if (
      url.pathname === "/artifacts/progress-workbench" ||
      url.pathname === "/artifacts/progress-workbench/"
    ) {
      url.pathname = "/artifacts/progress-workbench/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
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
