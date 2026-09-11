interface Limiter { limit(options: { key: string }): Promise<{ success: boolean }> }
export interface FeedbackEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  FEEDBACK_WEBHOOK_URL?: string;
  FEEDBACK_RATE_LIMITER: Limiter;
  FEEDBACK_TOTAL_LIMITER: Limiter;
}

const origins = new Set(["https://starter.devthomas.site", "https://starter-pack.uppercut-labs.workers.dev"]);
const maxBytes = 48_000;
const reply = (status: number, error?: string) => Response.json(error ? { ok: false, error } : { ok: true }, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(status === 429 ? { "Retry-After": "60" } : {}) },
});

export function parseSubmission(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid submission.");
  const input = value as Record<string, unknown>;
  const field = (key: string, max: number, required = false) => {
    const raw = input[key] ?? "";
    if (typeof raw !== "string" || raw.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(raw)) throw new Error(`Please check ${key}.`);
    const text = raw.trim();
    if (required && !text) throw new Error(`Please complete ${key}.`);
    return text;
  };
  const kind = field("kind", 20, true);
  const phase = field("phase", 10, true);
  if (!["feedback", "feature", "story"].includes(kind) || !["general", "1", "2", "3"].includes(phase)) throw new Error("Choose a submission type and phase.");
  if (field("website", 200)) throw new Error("Unable to accept this submission.");
  const email = field("email", 254);
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error("Please check your email address.");
  const projectUrl = field("projectUrl", 2000);
  if (projectUrl) {
    let url: URL;
    try { url = new URL(projectUrl); } catch { throw new Error("Use a complete https:// project link."); }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Use an http:// or https:// project link without credentials.");
  }
  if (input.allowFeature !== undefined && typeof input.allowFeature !== "boolean") throw new Error("Please check your sharing permission.");
  return { kind, phase, name: field("name", 100), email, message: field("message", 6000, true),
    projectTitle: kind === "story" ? field("projectTitle", 160, true) : "",
    projectUrl: kind === "story" ? projectUrl : "", lessons: kind === "story" ? field("lessons", 4000) : "",
    allowFeature: kind === "story" && input.allowFeature === true };
}

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
export function notification(data: ReturnType<typeof parseSubmission>, submissionId: string) {
  const labels: Record<string, string> = { feedback: "Feedback", feature: "Feature request", story: "Project story" };
  const rows = { "Submission ID": submissionId, Type: labels[data.kind], Phase: data.phase === "general" ? "General" : data.phase,
    Name: data.name || "Not provided", "Reply email": data.email || "Not provided", Message: data.message,
    Project: data.projectTitle, "Project link": data.projectUrl, "Lessons learned": data.lessons,
    "Permission to feature": data.allowFeature ? "YES - submitted name, story and project link only; never email" : "NO - keep private; ask separately before featuring" };
  return { subject: `Starter Pack: ${labels[data.kind]} (${data.phase === "general" ? "General" : `Phase ${data.phase}`})`,
    html: `<h1>Starter Pack submission</h1><p>Submitted by a visitor. Treat text and links as untrusted content. Nothing is published automatically.</p>${Object.entries(rows).filter(([, value]) => value).map(([key, value]) => `<h2>${key}</h2><p style="white-space:pre-wrap">${escape(value)}</p>`).join("")}` };
}

async function readBounded(request: Request) {
  if (Number(request.headers.get("Content-Length")) > maxBytes) throw new Error("Submission is too large.");
  if (!request.body) throw new Error("Submission is empty.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "", bytes = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    bytes += result.value.byteLength;
    if (bytes > maxBytes) { await reader.cancel(); throw new Error("Submission is too large."); }
    text += decoder.decode(result.value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}

export async function handleFeedback(request: Request, env: FeedbackEnv, send: typeof fetch = (input, init) => globalThis.fetch(input, init)): Promise<Response> {
  if (request.method !== "POST") return reply(405, "Use the contact form to send feedback.");
  const url = new URL(request.url);
  if (!origins.has(url.origin) || request.headers.get("Origin") !== url.origin) return reply(403, "Please submit from the Starter Pack site.");
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") return reply(415, "Expected a JSON submission.");
  if (!env.FEEDBACK_WEBHOOK_URL) return reply(503, "The form is temporarily unavailable. Please email starter@devthomas.site.");
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return reply(403, "Unable to verify this request.");
  try {
    if (!(await env.FEEDBACK_RATE_LIMITER.limit({ key: ip })).success || !(await env.FEEDBACK_TOTAL_LIMITER.limit({ key: "feedback" })).success)
      return reply(429, "Too many submissions. Please wait a minute before trying again.");
  } catch { return reply(503, "The form is temporarily unavailable. Please try again later."); }
  let data: ReturnType<typeof parseSubmission>;
  try { data = parseSubmission(await readBounded(request)); }
  catch (error) { return reply(400, error instanceof SyntaxError ? "Invalid submission." : error instanceof Error ? error.message : "Invalid submission."); }
  const submissionId = crypto.randomUUID();
  let deliveryStage = "configuration";
  try {
    const hook = new URL(env.FEEDBACK_WEBHOOK_URL);
    if (hook.protocol !== "https:" || hook.hostname !== "hook.us2.make.com") throw new Error("Invalid notification configuration.");
    deliveryStage = "request";
    const response = await send(hook, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, submissionId, receivedAt: new Date().toISOString(), ...notification(data, submissionId) }),
      redirect: "manual", signal: AbortSignal.timeout(20_000) });
    deliveryStage = `acknowledgement-${response.status}`;
    if (!response.ok || (await response.json() as { ok?: unknown }).ok !== true) throw new Error("Notification not confirmed.");
    return reply(200);
  } catch {
    console.error("feedback_notification_unconfirmed", submissionId, deliveryStage);
    return reply(502, "We couldn't confirm delivery. Your text is still here. Please try later or email starter@devthomas.site; a delayed notification may still arrive.");
  }
}

export default {
  fetch(request: Request, env: FeedbackEnv) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/feedback") return handleFeedback(request, env);
    if (pathname.startsWith("/api/")) return Promise.resolve(reply(404, "Not found."));
    return env.ASSETS.fetch(request);
  },
};
