import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createLocalWorker } from "./local-worker";
import {
  handleMcp,
  looksSecret,
  mcpMaxBytes,
  refusalText,
  type McpEnv,
} from "../src/mcp";
import origins from "../src/site-origin.json";

const endpoint = `${origins.canonicalOrigin}/mcp`;
const requirements = JSON.parse(await readFile("dist/agent/requirements.json", "utf8"));
const catalog = JSON.parse(await readFile("dist/agent/catalog.json", "utf8"));
const env: McpEnv = {
  ASSETS: {
    async fetch(request: Request): Promise<Response> {
      assert.equal(request.method, "GET");
      const path = new URL(request.url).pathname;
      assert.ok(["/agent/requirements.json", "/agent/catalog.json"].includes(path), path);
      return new Response(await readFile(`dist${path}`));
    },
  },
};

function post(body: unknown, headers: Record<string, string> = {}, url = endpoint): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
let nextId = 1;
async function rpc(method: string, params?: unknown, target: McpEnv = env): Promise<any> {
  const response = await handleMcp(post({ jsonrpc: "2.0", id: nextId++, method, ...(params === undefined ? {} : { params }) }), target);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type") ?? "", /application\/json/);
  assert.equal(response.headers.get("Mcp-Session-Id"), null, "stateless: no session");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null, "no CORS");
  return response.json();
}
async function call(name: string, args: unknown): Promise<{ result: any; text: string; raw: string }> {
  const message = await rpc("tools/call", { name, arguments: args });
  assert.equal(message.error, undefined);
  return { result: message.result, text: message.result.content[0].text, raw: JSON.stringify(message) };
}

test("initialize negotiates a supported protocol and advertises tools only", async () => {
  for (const [requested, expected] of [["2025-11-25", "2025-11-25"], ["2025-06-18", "2025-06-18"], ["2025-03-26", "2025-03-26"], ["1999-01-01", "2025-11-25"]]) {
    const { result } = await rpc("initialize", { protocolVersion: requested, capabilities: {}, clientInfo: { name: "test", version: "1" } });
    assert.equal(result.protocolVersion, expected);
    assert.deepEqual(Object.keys(result.capabilities), ["tools"]);
    assert.equal(result.serverInfo.name, "starter-pack");
    assert.equal(result.serverInfo.title, "Starter Pack");
    assert.deepEqual(result.serverInfo.icons, [
      { src: `${origins.canonicalOrigin}/plugins/starter-pack-icon.png`, mimeType: "image/png", sizes: ["512x512"] },
    ]);
    assert.match(result.instructions, /Never send passwords/);
  }
  assert.deepEqual((await rpc("ping")).result, {});
});

test("tools/list exposes exactly three read-only, closed-world tools with strict schemas", async () => {
  const { result } = await rpc("tools/list");
  assert.deepEqual(result.tools.map((tool: any) => tool.name), ["get_phase_guidance", "next_action", "list_skills"]);
  for (const tool of result.tools) {
    assert.deepEqual(
      { readOnly: tool.annotations.readOnlyHint, destructive: tool.annotations.destructiveHint, idempotent: tool.annotations.idempotentHint, openWorld: tool.annotations.openWorldHint },
      { readOnly: true, destructive: false, idempotent: true, openWorld: false },
    );
    assert.ok(tool.title && tool.annotations.title);
    assert.equal(tool.inputSchema.type, "object");
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.match(tool.description, /Call this/, "explicit when-to-call guidance for smaller models");
    assert.match(tool.description, /Read-only; nothing is stored/);
  }
  const next = result.tools.find((tool: any) => tool.name === "next_action");
  assert.match(next.description, /never passwords, keys, tokens, emails/);
  assert.deepEqual(next.inputSchema.required, ["phase", "completed_steps"]);
});

test("get_phase_guidance returns the site's own requirements and lessons for each phase", async () => {
  for (const phase of [1, 2, 3]) {
    const { result } = await call("get_phase_guidance", { phase });
    assert.notEqual(result.isError, true);
    const data = result.structuredContent;
    assert.deepEqual(JSON.parse(result.content[0].text), data);
    assert.deepEqual(data.required_steps.map((step: any) => step.id), requirements.phases[`phase-${phase}`].gate.all_of);
    assert.equal(data.status, "current");
    const resource = catalog.resources.find((item: any) => item.id === `phase-${phase}`);
    assert.equal(data.title, resource.title);
    assert.equal(data.read_more, resource.html);
    for (const step of data.required_steps) assert.ok(step.done_when.length > 10, step.id);
  }
  const phase1 = (await call("get_phase_guidance", { phase: "1" })).result.structuredContent;
  const accounts = phase1.required_steps.find((step: any) => step.id === "core-accounts");
  assert.deepEqual(accounts.includes.map((item: any) => item.id), ["github", "cloudflare", "neon", "instant-builder"]);
  assert.equal(accounts.done_when, "GitHub, Cloudflare, Neon and one instant builder are ready.");
  const deploy = (await call("get_phase_guidance", { phase: 2, topic: "deploy" })).result.structuredContent;
  assert.ok(deploy.required_steps.some((step: any) => step.id === "live-deployment"));
  assert.ok(deploy.required_steps.length < requirements.phases["phase-2"].gate.all_of.length);
  const nothing = (await call("get_phase_guidance", { phase: 1, topic: "zzzz" })).result.structuredContent;
  assert.equal(nothing.required_steps.length, 4);
  assert.match(nothing.note, /whole phase/);
});

test("next_action walks the real Phase 1 gate from explicitly supplied step IDs", async () => {
  const next = async (phase: number, completed: string[]) => (await call("next_action", { phase, completed_steps: completed })).result.structuredContent;
  assert.equal((await next(1, [])).next_step.id, "primary-ai-phone-app");
  assert.equal((await call("next_action", { phase: 1 })).result.structuredContent.next_step.id, "primary-ai-phone-app", "a missing list means just starting");
  assert.equal((await next(1, ["primary-ai-phone-app"])).next_step.id, "github-mobile");
  const accounts = await next(1, ["primary-ai-phone-app", "github-mobile", "github"]);
  assert.equal(accounts.next_step.id, "core-accounts");
  assert.equal(accounts.remaining_required, 2);
  assert.deepEqual(accounts.still_needed.slice(0, 2).map((item: any) => item.id), ["cloudflare", "neon"]);
  assert.deepEqual(accounts.still_needed[2].choose_one_of.map((item: any) => item.id), ["google-ai-studio", "lovable", "replit", "base44"]);
  const build = await next(1, ["primary-ai-phone-app", "github-mobile", "github", "cloudflare", "neon", "lovable"]);
  assert.equal(build.next_step.id, "instant-build");
  assert.deepEqual(build.check_first, []);
  assert.equal((await next(1, ["primary-ai-phone-app", "github-mobile", "core-accounts", "instant-app"])).result, "phase-complete");
  const setup = await next(2, ["computer-setup"]);
  assert.equal(setup.next_step.id, "computer-setup", "a summary report does not skip the setup checks");
  assert.equal(setup.still_needed.length, 4);
  const graduation = await next(3, ["phase-3-project"]);
  assert.equal(graduation.status, "current");
  assert.deepEqual(graduation.next_step.choose_one_of.map((item: any) => item.id), ["agent-cli", "agent-api", "agent-mcp", "agent-native-package"]);
  assert.equal((await next(3, ["phase-3-project", "agent-mcp"])).result, "phase-complete");
});

test("list_skills mirrors the built catalog", async () => {
  const data = (await call("list_skills", {})).result.structuredContent;
  assert.deepEqual(
    data.skills.map((skill: any) => [skill.id, skill.version, skill.link]),
    catalog.skills.map((skill: any) => [skill.id, skill.version, skill.current]),
  );
  assert.ok((await call("list_skills", { extra: true })).result.isError);
});

test("tool output never carries agent-only registry wording", async () => {
  const outputs: string[] = [];
  for (const phase of [1, 2, 3]) {
    outputs.push((await call("get_phase_guidance", { phase })).raw);
    const gate: string[] = requirements.phases[`phase-${phase}`].gate.all_of;
    for (let index = 0; index <= gate.length; index++)
      outputs.push((await call("next_action", { phase, completed_steps: gate.slice(0, index) })).raw);
  }
  outputs.push((await call("list_skills", {})).raw);
  const forbidden = /historical|aggregate|provenance|fabricat|reconcil|allow_recorded_completion|completion_meaning|gate_for|"internal"|"legacy"|verification object|summary-only|choices\.phase_3|artifacts\.programmatic/i;
  for (const output of outputs) assert.doesNotMatch(output, forbidden);
  for (const id of Object.keys(requirements.steps))
    assert.doesNotMatch(JSON.stringify((await call("next_action", { phase: 2, completed_steps: [id] })).result), forbidden, id);
});

test("credential-shaped input is refused without being repeated or logged", async (t) => {
  const logged: string[] = [];
  const original = console.log;
  console.log = (...parts: unknown[]) => void logged.push(parts.join(" "));
  t.after(() => { console.log = original; });
  const canaries = [
    "ghp_CANARY0000000000000000000000000000",
    "github_pat_CANARY_11AAAAAAA",
    "sk-ant-api03-CANARYCANARY",
    "AKIACANARY000000000",
    "eyJhbGciOiJIUzI1NiJ9.eyJjYW5hcnkiOjF9.c2ln",
    "-----BEGIN PRIVATE KEY-----",
    "canary.learner@example.com",
    "my-password-is-canary",
    "api-key-canary",
    "Zm9vYmFyY2FuYXJ5MTIzNDU2Nzg5MDEy",
    "https://user:canarypass@example.com",
  ];
  for (const canary of canaries) {
    const attempts: [string, unknown][] = [
      ["next_action", { phase: 1, completed_steps: ["github-mobile", canary] }],
      ...(/password|api-key/.test(canary) ? [] : [["get_phase_guidance", { phase: 1, topic: canary }] as [string, unknown]]),
      ["next_action", { phase: 1, completed_steps: [], [canary]: 1 }],
    ];
    for (const [name, args] of attempts) {
      const { result, raw } = await call(name, args);
      assert.equal(result.isError, true, `${name} ${canary}`);
      assert.equal(result.content[0].text, refusalText);
      assert.equal(raw.includes(canary), false, canary);
      assert.equal(raw.toLowerCase().includes("canary"), false, canary);
    }
  }
  assert.equal(logged.join("\n").toLowerCase().includes("canary"), false);
  assert.ok(logged.some((line) => line.includes('"status":"refused"')));
  for (const id of [...Object.keys(requirements.steps), ...Object.keys(requirements.groups), ...Object.keys(requirements.aliases)])
    assert.equal(looksSecret(id, true), false, `real step ID ${id} must not look secret`);
  for (const topic of ["deploy", "github", "accounts", "cloudflare", "Phase 2"]) assert.equal(looksSecret(topic, false), false);
});

test("invalid input fails as a tool error without echoing what was sent", async () => {
  const cases: [string, unknown, RegExp][] = [
    ["get_phase_guidance", { phase: 7 }, /phase must be 1, 2 or 3/],
    ["get_phase_guidance", {}, /phase must be 1, 2 or 3/],
    ["get_phase_guidance", { phase: 1, topic: "x".repeat(41) }, /topic must be/],
    ["get_phase_guidance", { phase: 1, topic: "<script>" }, /topic must be/],
    ["get_phase_guidance", { phase: 1, mood: "unknown-extra" }, /Only phase and topic/],
    ["next_action", { phase: 1, completed_steps: "github" }, /completed_steps must be/],
    ["next_action", { phase: 1, completed_steps: Array(61).fill("github") }, /completed_steps must be/],
    ["next_action", { phase: 1, completed_steps: ["Not An Id!"] }, /1 entry is not a step ID/],
    ["next_action", { phase: 1, completed_steps: ["made-up-step-zz"] }, /1 entry is not a Starter Pack step ID/],
    ["next_action", { phase: 1, completed_steps: [], unexpected: "zz-extra" }, /Only phase and completed_steps/],
  ];
  for (const [name, args, message] of cases) {
    const { result, raw } = await call(name, args);
    assert.equal(result.isError, true, JSON.stringify(args));
    assert.match(result.content[0].text, message);
    for (const echo of ["Not An Id", "made-up-step-zz", "<script>", "unknown-extra", "zz-extra"]) assert.equal(raw.includes(echo), false, echo);
  }
  const unknown = (await call("next_action", { phase: 1, completed_steps: ["made-up-step-zz"] })).text;
  assert.match(unknown, /Valid IDs for Phase 1: .*primary-ai-phone-app/);
});

test("writes, unknown tools and unknown methods are refused; there is no write surface", async () => {
  for (const name of ["delete_progress", "save_progress", "fetch_url", "__proto__", "constructor"]) {
    const message = await rpc("tools/call", { name, arguments: {} });
    assert.equal(message.error.code, -32602, name);
    assert.match(message.error.message, /Unknown tool\. .*All are read-only/);
    assert.equal(message.error.message.includes(name), false);
  }
  for (const method of ["tools/delete", "resources/write", "resources/read", "sampling/createMessage", "logging/setLevel"]) {
    const message = await rpc(method, {});
    assert.equal(message.error.code, -32601, method);
    assert.equal(message.error.message.includes(method), false);
  }
  assert.deepEqual((await rpc("resources/list")).result, { resources: [] });
  assert.deepEqual((await rpc("prompts/list")).result, { prompts: [] });
});

test("HTTP layer: POST JSON only, bounded size, protocol header, Origin and Host checks", async () => {
  for (const method of ["GET", "DELETE", "PUT", "PATCH", "OPTIONS", "HEAD"]) {
    const response = await handleMcp(new Request(endpoint, { method }), env);
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get("Allow"), "POST");
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  }
  const ok = { jsonrpc: "2.0", id: 1, method: "ping" };
  assert.equal((await handleMcp(post(ok, { "Content-Type": "text/plain" }), env)).status, 415);
  assert.equal((await handleMcp(post(ok, { "MCP-Protocol-Version": "2026-07-28" }), env)).status, 400);
  assert.equal((await handleMcp(post(ok, { "MCP-Protocol-Version": "2025-11-25" }), env)).status, 200);
  const oversized = JSON.stringify({ ...ok, params: { pad: "x".repeat(mcpMaxBytes) } });
  assert.equal((await handleMcp(post(oversized), env)).status, 413);
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(oversized)); controller.close(); } });
  const chunked = new Request(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
  assert.equal((await handleMcp(chunked, env)).status, 413, "streamed body without Content-Length is capped too");
  const parse = await handleMcp(post("{not json"), env);
  assert.equal(parse.status, 400);
  assert.equal((await parse.json()).error.code, -32700);
  assert.equal((await handleMcp(post([ok]), env)).status, 400, "no JSON-RPC batches");
  assert.equal((await handleMcp(post({ jsonrpc: "2.0", method: "notifications/initialized" }), env)).status, 202);
  assert.equal((await handleMcp(post({ jsonrpc: "1.0", id: 1, method: "ping" }), env)).status, 400);
  for (const origin of ["https://evil.example", "null", "https://claude.ai.evil.example"]) {
    const response = await handleMcp(post(ok, { Origin: origin }), env);
    assert.equal(response.status, 403, origin);
  }
  for (const origin of ["https://claude.ai", "https://chatgpt.com", origins.canonicalOrigin, "http://localhost:6274"])
    assert.equal((await handleMcp(post(ok, { Origin: origin }), env)).status, 200, origin);
  for (const url of ["https://evil.example/mcp", "https://starter.uppercut-labs.com.evil.example/mcp"])
    assert.equal((await handleMcp(post(ok, {}, url), env)).status, 403, url);
  for (const url of [origins.workerOrigin + "/mcp", "https://starter-pack-example.uppercut-labs.workers.dev/mcp", "http://127.0.0.1:8787/mcp"])
    assert.equal((await handleMcp(post(ok, {}, url), env)).status, 200, url);
});

test("rate limiting is per client address and fails open for read-only content", async () => {
  const keys: string[] = [];
  const limited: McpEnv = { ...env, MCP_RATE_LIMITER: { async limit({ key }) { keys.push(key); return { success: false }; } } };
  const response = await handleMcp(post({ jsonrpc: "2.0", id: 1, method: "ping" }, { "CF-Connecting-IP": "192.0.2.7" }), limited);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.deepEqual(keys, ["192.0.2.7"]);
  const broken: McpEnv = { ...env, MCP_RATE_LIMITER: { async limit() { throw new Error("limiter down"); } } };
  assert.equal((await handleMcp(post({ jsonrpc: "2.0", id: 1, method: "ping" }), broken)).status, 200);
});

test("site unavailable gives a learner-facing tool error, not a crash", async () => {
  const down: McpEnv = { ASSETS: { async fetch() { return new Response("missing", { status: 404 }); } } };
  const message = await rpc("tools/call", { name: "list_skills", arguments: {} }, down);
  assert.equal(message.result.isError, true);
  assert.match(message.result.content[0].text, /could not be read right now/);
});

test("the real local Worker serves /mcp from built assets and keeps other routes GET-only", { timeout: 45_000 }, async (t) => {
  const mf = await createLocalWorker();
  t.after(() => mf.dispose());
  const send = (body: unknown, method = "POST") =>
    mf.dispatchFetch(endpoint, method === "POST" ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { method });
  const list = await (await send({ jsonrpc: "2.0", id: 1, method: "tools/list" })).json() as any;
  assert.equal(list.result.tools.length, 3);
  const skills = await (await send({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "list_skills", arguments: {} } })).json() as any;
  assert.deepEqual(skills.result.structuredContent.skills.map((skill: any) => skill.id), catalog.skills.map((skill: any) => skill.id));
  assert.equal((await send(undefined, "GET")).status, 405);
  assert.equal((await mf.dispatchFetch(`${origins.canonicalOrigin}/guide`, { method: "POST" })).status, 405);
  assert.equal((await mf.dispatchFetch(`${origins.canonicalOrigin}/mcp/extra`, { method: "POST" })).status, 405);
});

test("the advertised icon is the published plugin icon and fits ChatGPT's upload form", async () => {
  const source = await readFile("public/plugins/starter-pack-icon.png");
  const built = await readFile("dist/plugins/starter-pack-icon.png");
  assert.ok(source.equals(built), "built icon keeps the source bytes");
  assert.ok(source.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "PNG");
  assert.deepEqual([source.readUInt32BE(16), source.readUInt32BE(20)], [512, 512]);
  assert.ok(source.length <= 10 * 1024, `icon is ${source.length} bytes; the form accepts at most 10 KB`);
  const guide = await readFile("content/pages/guide.md", "utf8");
  assert.match(guide, /\]\(\/plugins\/starter-pack-icon\.png\)/);
  const order = ["Upload the icon", "Paste the name", "Paste the URL", "No authentication", "I understand", "Create as a plugin", "Choose **Connect**"].map((step) => guide.indexOf(step));
  assert.ok(order.every((at, index) => at > 0 && (index === 0 || at > order[index - 1]!)), "ChatGPT steps keep the form's order; the URL field clears the confirmation box");
  assert.match(guide, /Tick this last; changing the URL clears it\./);
});

test("the homepage links to the guide's connector section and offers no Codex sign-in", async () => {
  const home = await readFile("dist/index.html", "utf8");
  const guide = await readFile("dist/guide.html", "utf8");
  const anchor = "optional-connect-the-starter-pack-to-claude-or-chatgpt";
  assert.match(guide, new RegExp(`<h2 id="${anchor}"`), "the guide still has the connector section");
  assert.match(home, new RegExp(`<a class="text-link" href="/guide#${anchor}">How to add the connector`));
  assert.doesNotMatch(home, /BUILD WITH CODEX|codex-start|start Codex through your ChatGPT sign-in/);
});
