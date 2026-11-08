import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker, { feedbackEmail, handleFeedback, notification, parseSubmission, type FeedbackEnv } from "../src/worker";
import siteOrigins from "../src/site-origin.json";

const base = { kind: "feedback", phase: "general", message: "The setup steps helped." };
const origin = "https://starter.devthomas.site";
const testKey = "re_test_only_not_a_real_key_0123456789";
const resendId = "4ef9a417-02e9-4d39-ad75-9611e0fcc33c";

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
    FEEDBACK_RESEND_API_KEY: testKey,
    FEEDBACK_RATE_LIMITER: { async limit({ key }) { limits.push(`ip:${key}`); return { success: options.ipAllowed ?? true }; } },
    FEEDBACK_TOTAL_LIMITER: { async limit({ key }) { limits.push(`total:${key}`); return { success: options.totalAllowed ?? true }; } },
  };
  const send: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), ...(init === undefined ? {} : { init }) });
    return options.response?.() ?? Response.json({ id: resendId });
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
  assert.ok(output.text.includes('Message:\n<script>"&"</script>'));
  assert.ok(output.text.includes("Name:\n<img src=x onerror='bad()'>"));
  assert.ok(!output.text.includes("<h2>"));
});

test("the email goes only to the Starter Pack inbox, with a reply address only when it is valid", () => {
  const email = feedbackEmail(parseSubmission({ ...base, email: "ada@example.com" }), "test-id");
  assert.equal(email.from, "Starter Pack <feedback@uppercut-labs.com>");
  assert.deepEqual(email.to, ["starter@uppercut-labs.com"]);
  assert.equal(email.reply_to, "ada@example.com");
  assert.equal(email.subject, "Starter Pack: Feedback (General)");
  assert.equal(typeof email.html, "string");
  assert.equal(typeof email.text, "string");
  assert.deepEqual(Object.keys(email).sort(), ["from", "html", "reply_to", "subject", "text", "to"]);
  assert.equal("reply_to" in feedbackEmail(parseSubmission(base), "test-id"), false);
  for (const unusual of ['"quoted"@example.com', "ada@example..com", "ada@-example.com"]) {
    const output = feedbackEmail(parseSubmission({ ...base, email: unusual }), "test-id");
    assert.equal("reply_to" in output, false, unusual);
    assert.ok(String(output.text).includes(unusual), unusual);
  }
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
  delete h.env.FEEDBACK_RESEND_API_KEY;
  assert.equal((await handleFeedback(request(), h.env, h.send)).status, 503);
  h.env.FEEDBACK_RESEND_API_KEY = "";
  assert.equal((await handleFeedback(request(), h.env, h.send)).status, 503);
  h.env.FEEDBACK_RESEND_API_KEY = testKey;
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

test("Resend errors, redirects, and network failures never report success", async (t) => {
  t.mock.method(console, "error", () => {});
  t.mock.method(console, "log", () => {});
  for (const status of [400, 401, 403, 409, 422, 429, 500, 503]) {
    const h = harness({ response: () => Response.json({ statusCode: status, name: "error", message: `failure for ${testKey}` }, { status }) });
    const result = await handleFeedback(request(), h.env, h.send);
    assert.equal(result.status, 502, String(status));
    const body = await result.json();
    assert.equal(body.ok, false);
    assert.match(body.error, /couldn't confirm delivery/);
    assert.equal(h.calls.length, 1);
  }
  const redirected = harness({ response: () => new Response(JSON.stringify({ id: resendId }), { status: 302, headers: { Location: "https://evil.example/" } }) });
  assert.equal((await handleFeedback(request(), redirected.env, redirected.send)).status, 502);
  const h = harness();
  const failingSend: typeof fetch = async () => { throw new Error("Network unavailable"); };
  assert.equal((await handleFeedback(request(), h.env, failingSend)).status, 502);
});

test("any Resend 2xx counts as delivered, even without a readable body", async (t) => {
  t.mock.method(console, "log", () => {});
  for (const response of [() => Response.json({ id: resendId }), () => new Response("", { status: 202 }), () => new Response("not json")]) {
    const h = harness({ response });
    assert.equal((await handleFeedback(request(), h.env, h.send)).status, 200);
  }
});

test("a submission is sent to Resend once, with the key, payload and idempotency header", async (t) => {
  const logs: unknown[][] = [];
  t.mock.method(console, "log", (...values: unknown[]) => { logs.push(values); });
  const h = harness();
  const id = "0b6f7a3e-5c1d-4e2f-9a8b-7c6d5e4f3a2b";
  const result = await handleFeedback(request({ ...base, email: "ada@example.com" }, { "Idempotency-Key": id }), { ...h.env, FEEDBACK_DEDUP: memoryReceipts() }, h.send);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true });
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.limits, ["ip:192.0.2.1", "total:feedback"]);
  assert.equal(h.calls[0].url, "https://api.resend.com/emails");
  assert.equal(h.calls[0].init?.method, "POST");
  assert.equal(h.calls[0].init?.redirect, "manual");
  const headers = new Headers(h.calls[0].init?.headers);
  assert.equal(headers.get("Authorization"), `Bearer ${testKey}`);
  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(headers.get("Idempotency-Key"), id);
  const delivered = JSON.parse(String(h.calls[0].init?.body));
  assert.equal(delivered.from, "Starter Pack <feedback@uppercut-labs.com>");
  assert.deepEqual(delivered.to, ["starter@uppercut-labs.com"]);
  assert.equal(delivered.reply_to, "ada@example.com");
  assert.equal(delivered.subject, "Starter Pack: Feedback (General)");
  assert.ok(delivered.html.includes(`<h2>Submission ID</h2><p style="white-space:pre-wrap">${id}</p>`));
  assert.ok(delivered.html.includes(base.message));
  assert.ok(delivered.text.includes(`Submission ID:\n${id}`));
  assert.ok(delivered.text.includes(`Message:\n${base.message}`));
  assert.ok(delivered.text.includes("Reply email:\nada@example.com"));
  assert.equal(JSON.stringify(delivered).includes(testKey), false);
  assert.deepEqual(logs, [["feedback_notification_sent", id, resendId]]);
});

test("a submission without an identity still gets a generated Resend idempotency key", async (t) => {
  t.mock.method(console, "log", () => {});
  const h = harness();
  assert.equal((await handleFeedback(request(), h.env, h.send)).status, 200);
  const key = new Headers(h.calls[0].init?.headers).get("Idempotency-Key");
  assert.match(String(key), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.ok(JSON.parse(String(h.calls[0].init?.body)).text.includes(`Submission ID:\n${key}`));
  assert.equal("reply_to" in JSON.parse(String(h.calls[0].init?.body)), false);
});

test("each approved host accepts only its own exact Origin and never adds feedback CORS", async (t) => {
  t.mock.method(console, "log", () => {});
  const approved = Object.values(siteOrigins);
  for (const target of approved) {
    const h = harness();
    const valid = new Request(target + "/api/feedback", { method: "POST", headers: { Origin: target, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1" }, body: JSON.stringify(base) });
    const result = await handleFeedback(valid, h.env, h.send);
    assert.equal(result.status, 200, target);
    assert.equal(result.headers.get("Access-Control-Allow-Origin"), null);
    assert.equal(h.calls.length, 1);
    for (const originHeader of [...approved.filter(value => value !== target), "https://other.uppercut-labs.com", target + ".evil.example", "null", ""]) {
      const denied = harness();
      const input = new Request(target + "/api/feedback", { method: "POST", headers: { Origin: originHeader, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1", "X-Forwarded-Host": new URL(target).host }, body: JSON.stringify(base) });
      assert.equal((await handleFeedback(input, denied.env, denied.send)).status, 403, `${target}: ${originHeader}`);
      assert.equal(denied.calls.length, 0);
      assert.equal(denied.limits.length, 0);
    }
    const missing = new Request(target + "/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(base) });
    assert.equal((await handleFeedback(missing, h.env, h.send)).status, 403);
  }
  for (const target of ["https://other.uppercut-labs.com", "http://starter.uppercut-labs.com", "https://starter.uppercut-labs.com:444", "https://starter.uppercut-labs.com.evil.example"]) {
    const h = harness();
    const input = new Request(target + "/api/feedback", { method: "POST", headers: { Origin: target, "Content-Type": "application/json" }, body: JSON.stringify(base) });
    assert.equal((await handleFeedback(input, h.env, h.send)).status, 403);
    assert.equal(h.calls.length, 0);
  }
});

test("declared oversized bodies are rejected before delivery", async () => {
  const h = harness();
  assert.equal((await handleFeedback(request(base, { "Content-Length": "48001" }), h.env, h.send)).status, 400);
  assert.equal(h.calls.length, 0);
});

test("actual Worker entry preserves valid old and new feedback POSTs while page redirects are enabled", async (t) => {
  for (const target of Object.values(siteOrigins)) {
    const h = harness();
    h.env.LEGACY_HUMAN_REDIRECTS = "enabled";
    t.mock.method(globalThis, "fetch", h.send);
    t.mock.method(console, "log", () => {});
    const input = new Request(target + "/api/feedback", { method: "POST", headers: { Origin: target, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1" }, body: JSON.stringify(base) });
    const response = await worker.fetch(input, h.env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Location"), null);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(h.calls.length, 1);
    t.mock.restoreAll();
  }
});

test("responses and logs expose neither visitor data nor the Resend key", async (t) => {
  const logs: unknown[][] = [];
  t.mock.method(console, "error", (...values: unknown[]) => { logs.push(values); });
  t.mock.method(console, "log", (...values: unknown[]) => { logs.push(values); });
  const h = harness();
  const visitor = { ...base, email: "ada@example.com", message: "private visitor message" };
  for (const send of [
    (async () => { throw new Error(`private ${testKey} and visitor message`); }) as typeof fetch,
    (async () => Response.json({ message: `API key ${testKey} is invalid` }, { status: 401 })) as typeof fetch,
    h.send,
  ]) {
    const response = await handleFeedback(request(visitor), h.env, send);
    const body = await response.text();
    assert.ok(!body.includes("private"));
    assert.ok(!body.includes(testKey));
    assert.ok(!body.includes("ada@example.com"));
    assert.ok(!body.includes("api.resend.com"));
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  }
  const serialized = JSON.stringify(logs);
  assert.ok(serialized.includes("feedback_notification_unconfirmed"));
  assert.ok(serialized.includes("feedback_notification_sent"));
  assert.ok(!serialized.includes("private"));
  assert.ok(!serialized.includes(testKey));
  assert.ok(!serialized.includes("ada@example.com"));
});

test("an uncertain accepted submission is not sent to Resend twice", async (t) => {
  t.mock.method(console, "error", () => {});
  const { FeedbackReceipt } = await import("../src/worker");
  const objects = new Map<string, InstanceType<typeof FeedbackReceipt>>();
  const namespace: NonNullable<FeedbackEnv["FEEDBACK_DEDUP"]> = {
    idFromName(name) { return name; },
    get(id) {
      const key = String(id);
      let object = objects.get(key);
      if (!object) {
        const values = new Map<string, unknown>();
        let tail: Promise<unknown> = Promise.resolve();
        object = new FeedbackReceipt({
          storage: {
            async get<T>(name: string) { return values.get(name) as T | undefined; },
            async put<T>(name: string, value: T) { values.set(name, value); },
            async deleteAll() { values.clear(); },
            async setAlarm(_time: number) {},
          },
          blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T> {
            const next = tail.then(callback); tail = next.catch(() => undefined); return next;
          },
        });
        objects.set(key, object);
      }
      return object;
    },
  };
  const h = harness({ response: () => new Response("lost acknowledgement", { status: 500 }) });
  h.env.FEEDBACK_DEDUP = namespace;
  const headers = { "Idempotency-Key": "f01519cb-b5ad-4267-9b79-f5c770263722" };
  assert.equal((await handleFeedback(request(base, headers), h.env, h.send)).status, 502);
  assert.equal((await handleFeedback(request(base, headers), h.env, h.send)).status, 502);
  assert.equal(h.calls.length, 1);
  assert.equal((await handleFeedback(request({ ...base, message: "Changed" }, headers), h.env, h.send)).status, 502);
  assert.equal(h.calls.length, 1);
});

test("a confirmed retry returns success without a second Resend request", async (t) => {
  t.mock.method(console, "log", () => {});
  const { FeedbackReceipt } = await import("../src/worker");
  const values = new Map<string, unknown>();
  const object = new FeedbackReceipt({
    storage: {
      async get<T>(key: string) { return values.get(key) as T | undefined; },
      async put<T>(key: string, value: T) { values.set(key, value); },
      async deleteAll() { values.clear(); },
      async setAlarm(_time: number) {},
    },
    async blockConcurrencyWhile<T>(callback: () => Promise<T>) { return callback(); },
  });
  const h = harness();
  h.env.FEEDBACK_DEDUP = { idFromName(name) { return name; }, get() { return object; } };
  const headers = { "Idempotency-Key": "f01519cb-b5ad-4267-9b79-f5c770263722" };
  assert.equal((await handleFeedback(request(base, headers), h.env, h.send)).status, 200);
  assert.equal((await handleFeedback(request(base, headers), h.env, h.send)).status, 200);
  assert.equal(h.calls.length, 1);
  assert.equal(new Headers(h.calls[0].init?.headers).get("Idempotency-Key"), headers["Idempotency-Key"]);
});

test("visitor-facing fallbacks name the current contact address", async () => {
  for (const file of ["src/worker.ts", "src/Feedback.tsx", "content/pages/about.md"]) {
    const text = await readFile(file, "utf8");
    assert.doesNotMatch(text, /starter@devthomas\.site/, `${file} names the retired address`);
  }
  const worker = await readFile("src/worker.ts", "utf8");
  assert.equal(worker.match(/email starter@uppercut-labs\.com/g)?.length, 5);
});

function memoryReceipts(): NonNullable<FeedbackEnv["FEEDBACK_DEDUP"]> {
  return {
    idFromName(name) { return name; },
    get() {
      return { async fetch(input: Request) { const path = new URL(input.url).pathname; return Response.json({ state: path === "/claim" ? "claimed" : "sent" }); } };
    },
  };
}
