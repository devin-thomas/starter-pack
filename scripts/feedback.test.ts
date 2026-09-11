import assert from "node:assert/strict";
import test from "node:test";
import { handleFeedback, notification, parseSubmission, type FeedbackEnv } from "../src/worker";

const base = { kind: "feedback", phase: "general", message: "The setup steps helped." };
const origin = "https://starter.devthomas.site";

function request(body: unknown = base, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/feedback`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1", ...headers },
    body: JSON.stringify(body),
  });
}

function harness(options: { ipAllowed?: boolean; totalAllowed?: boolean; response?: () => Response } = {}) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const limits: string[] = [];
  const env: FeedbackEnv = {
    ASSETS: { async fetch() { throw new Error("Feedback must not fetch static assets."); } },
    FEEDBACK_WEBHOOK_URL: "https://hook.us2.make.com/test-only-not-a-real-webhook",
    FEEDBACK_RATE_LIMITER: { async limit({ key }) { limits.push(`ip:${key}`); return { success: options.ipAllowed ?? true }; } },
    FEEDBACK_TOTAL_LIMITER: { async limit({ key }) { limits.push(`total:${key}`); return { success: options.totalAllowed ?? true }; } },
  };
  const send: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return options.response?.() ?? Response.json({ ok: true });
  };
  return { env, send, calls, limits };
}

test("story submissions preserve explicit consent and trim optional fields", () => {
  const result = parseSubmission({ ...base, kind: "story", phase: "2", name: " Ada ", email: "ada@example.com", projectTitle: " My project ", projectUrl: "https://example.com/project", lessons: " Start small. ", allowFeature: true });
  assert.equal(result.allowFeature, true);
  assert.equal(result.projectTitle, "My project");
  assert.equal(result.lessons, "Start small.");
  assert.equal(result.name, "Ada");
  assert.equal(parseSubmission({ ...base, kind: "story", projectTitle: "Demo" }).allowFeature, false);
  const feedback = parseSubmission({ ...base, allowFeature: true, projectTitle: "Ignored", lessons: "Ignored", projectUrl: "https://example.com" });
  assert.equal(feedback.allowFeature, false);
  assert.equal(feedback.projectTitle, "");
  assert.equal(feedback.projectUrl, "");
  assert.equal(feedback.lessons, "");
});

test("invalid shapes, required fields, enums, and consent cannot become submissions", () => {
  for (const value of [null, [], "text", {}, { ...base, message: "  " }, { ...base, message: 7 }, { ...base, kind: "other" }, { ...base, phase: "4" }, { ...base, kind: "story" }, { ...base, allowFeature: "true" }, { ...base, message: "hello\u0000there" }]) {
    assert.throws(() => parseSubmission(value));
  }
});

test("email, links, honeypot, and field limits are enforced", () => {
  for (const email of ["not-an-email", "a@b", "a@example.com\r\nBcc: other@example.com"]) assert.throws(() => parseSubmission({ ...base, email }));
  for (const projectUrl of ["/relative", "javascript:alert(1)", "https://user:password@example.com", "ftp://example.com"]) assert.throws(() => parseSubmission({ ...base, kind: "story", projectTitle: "Demo", projectUrl }));
  assert.throws(() => parseSubmission({ ...base, website: "spam" }));
  for (const [field, length] of Object.entries({ name: 101, email: 255, message: 6001, projectTitle: 161, projectUrl: 2001, lessons: 4001 })) {
    assert.throws(() => parseSubmission({ ...base, kind: "story", projectTitle: "Demo", [field]: "x".repeat(length) }), field);
  }
});

test("notification escapes visitor HTML and never uses visitor text in its subject", () => {
  const output = notification(parseSubmission({ ...base, name: "<img src=x onerror='bad()'>", message: '<script>"&"</script>' }), "test-id");
  assert.equal(output.subject, "Starter Pack: Feedback (General)");
  assert.ok(output.html.includes("&lt;img src=x onerror=&#39;bad()&#39;&gt;"));
  assert.ok(output.html.includes("&lt;script&gt;&quot;&amp;&quot;&lt;/script&gt;"));
  assert.ok(output.html.includes("NO - keep private"));
  assert.ok(!output.html.includes("<script>"));
});

test("wrong method, origin, or content type is rejected before delivery", async () => {
  const h = harness();
  for (const [input, status] of [
    [new Request(`${origin}/api/feedback`), 405],
    [request(base, { Origin: "https://evil.example" }), 403],
    [request(base, { Origin: "" }), 403],
    [request(base, { "Content-Type": "text/plain" }), 415],
    [request(base, { "CF-Connecting-IP": "" }), 403],
  ] as const) assert.equal((await handleFeedback(input, h.env, h.send)).status, status);
  assert.equal(h.calls.length, 0);
});

test("missing configuration and unavailable rate limiter fail closed", async () => {
  const h = harness();
  delete h.env.FEEDBACK_WEBHOOK_URL;
  assert.equal((await handleFeedback(request(), h.env, h.send)).status, 503);
  h.env.FEEDBACK_WEBHOOK_URL = "https://hook.us2.make.com/test";
  h.env.FEEDBACK_RATE_LIMITER.limit = async () => { throw new Error("Unavailable"); };
  assert.equal((await handleFeedback(request(), h.env, h.send)).status, 503);
  assert.equal(h.calls.length, 0);
});

test("either rate limit prevents delivery and returns retry guidance", async () => {
  for (const options of [{ ipAllowed: false }, { totalAllowed: false }]) {
    const h = harness(options);
    const response = await handleFeedback(request(), h.env, h.send);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.equal(h.calls.length, 0);
  }
});

test("invalid payload and malformed JSON never reach notification service", async () => {
  const h = harness();
  assert.equal((await handleFeedback(request({ ...base, website: "bot" }), h.env, h.send)).status, 400);
  const malformed = new Request(request(), { body: "{" });
  assert.equal((await handleFeedback(malformed, h.env, h.send)).status, 400);
  assert.equal(h.calls.length, 0);
});

test("streamed body without content-length is bounded and cancelled", async () => {
  const h = harness();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(24_001)); controller.enqueue(new Uint8Array(24_001)); },
    cancel() { cancelled = true; },
  });
  const init: RequestInit & { duplex: "half" } = { method: "POST", headers: request().headers, body: stream, duplex: "half" };
  const input = new Request(`${origin}/api/feedback`, init);
  assert.equal(input.headers.get("Content-Length"), null);
  assert.equal((await handleFeedback(input, h.env, h.send)).status, 400);
  assert.equal(cancelled, true);
  assert.equal(h.calls.length, 0);
});

test("HTTP failures, Make Accepted text, and false acknowledgements never report success", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const response of [() => new Response("failed", { status: 500 }), () => new Response('{"ok":true}', { status: 302, headers: { Location: "https://evil.example/" } }), () => new Response("Accepted"), () => Response.json({ ok: false }), () => Response.json({ ok: "true" }), () => Response.json(null)]) {
    const h = harness({ response });
    const result = await handleFeedback(request(), h.env, h.send);
    assert.equal(result.status, 502);
    assert.equal((await result.json()).ok, false);
  }
  const h = harness();
  const failingSend: typeof fetch = async () => { throw new Error("Network unavailable"); };
  assert.equal((await handleFeedback(request(), h.env, failingSend)).status, 502);
});

test("unexpected webhook destination is rejected before making a request", async (t) => {
  t.mock.method(console, "error", () => {});
  const h = harness();
  h.env.FEEDBACK_WEBHOOK_URL = "https://evil.example/webhook";
  assert.equal((await handleFeedback(request(), h.env, h.send)).status, 502);
  assert.equal(h.calls.length, 0);
});

test("explicit JSON acknowledgement delivers normalized data and reports success", async () => {
  const h = harness();
  const result = await handleFeedback(request({ ...base, email: "ada@example.com" }), h.env, h.send);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true });
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.limits, ["ip:192.0.2.1", "total:feedback"]);
  assert.equal(h.calls[0].init?.redirect, "manual");
  const delivered = JSON.parse(String(h.calls[0].init?.body));
  assert.equal(delivered.email, "ada@example.com");
  assert.equal(delivered.allowFeature, false);
  assert.equal(delivered.message, base.message);
  assert.equal(typeof delivered.submissionId, "string");
  assert.equal(Number.isNaN(Date.parse(delivered.receivedAt)), false);
});
