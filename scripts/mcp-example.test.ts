import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer, request as httpRequest, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { pathToFileURL } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";

// The Level 3 example MCP server runs for real here, on a loopback port, with no network access.
const folder = "public/examples/mcp-tool-library";
const example = await import(pathToFileURL(`${folder}/server.mjs`).href);
const [readme, phase3, progressSchema] = await Promise.all([
  readFile(`${folder}/README.md`, "utf8"),
  readFile("content/phases/3.md", "utf8"),
  readFile("public/schemas/starter-progress.schema.json", "utf8").then(JSON.parse),
]);
const level3 = phase3.slice(phase3.indexOf("### Level 3: Connected"), phase3.indexOf("### Level 4"));
const CANARY = "sk-STARTERPACKCANARY0000000000";
const STAFF_ONLY = /storage_bin|staff_note|Workshop cabinet|Tool wall|Yard store|Potting room|Counter tray|locked drawer|repair night|trigger gun|second person|plant swap|foam insert|display before/;

const logs: string[] = [];
const bodies: string[] = [];
let server: Server;
let base: string;

before(async () => {
  server = createServer(example.createMcpHandler({ log: (line: string) => logs.push(line) }));
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>(resolve => server.close(() => resolve())));

type Rpc = { status: number; body: any; text: string };
async function post(payload: unknown, headers: Record<string, string> = {}, path = "/mcp"): Promise<Rpc> {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25", ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
  const text = await response.text();
  bodies.push(text);
  return { status: response.status, body: text ? JSON.parse(text) : undefined, text };
}
let nextId = 1;
const rpc = (method: string, params?: unknown, headers?: Record<string, string>) => post({ jsonrpc: "2.0", id: nextId++, method, params }, headers);
const call = (name: string, args?: unknown) => rpc("tools/call", { name, arguments: args });

test("initialize negotiates a handshake-era version and declares only tools and resources", async () => {
  const init = await rpc("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } }, {});
  assert.equal(init.status, 200);
  assert.equal(init.body.result.protocolVersion, "2025-11-25");
  assert.deepEqual(init.body.result.capabilities, { tools: { listChanged: false }, resources: { listChanged: false } });
  assert.deepEqual(init.body.result.serverInfo, { name: "lantern-street-tool-library", title: "Lantern Street Tool Library (example)", version: "1.0.0" });
  assert.deepEqual([...example.PROTOCOL_VERSIONS], ["2025-11-25", "2025-06-18", "2025-03-26"]);
  // An unknown requested version gets the newest supported one, for the client to accept or refuse.
  const future = await rpc("initialize", { protocolVersion: "2099-01-01", capabilities: {}, clientInfo: { name: "test", version: "1" } }, {});
  assert.equal(future.body.result.protocolVersion, "2025-11-25");
  assert.equal((await post({ jsonrpc: "2.0", method: "notifications/initialized" })).status, 202);
  assert.deepEqual((await rpc("ping")).body.result, {});
});

test("two read-only tools with input and output schemas, and two resources", async () => {
  const { tools } = (await rpc("tools/list")).body.result;
  assert.deepEqual(tools.map((tool: { name: string }) => tool.name), ["search_tools", "get_tool"]);
  const ajv = new Ajv2020({ strict: false });
  for (const tool of tools) {
    assert.ok(tool.title && tool.description.length > 40, tool.name);
    assert.match(tool.description, /Read-only/);
    assert.deepEqual(tool.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    assert.equal(tool.inputSchema.type, "object");
    assert.equal(tool.inputSchema.additionalProperties, false);
    for (const [name, property] of Object.entries(tool.inputSchema.properties as Record<string, { description?: string }>)) assert.ok(property.description, `${tool.name}.${name}`);
    assert.ok(ajv.compile(tool.inputSchema) && ajv.compile(tool.outputSchema), tool.name);
  }
  assert.deepEqual(tools[1].inputSchema.required, ["id"]);
  // The oldest supported revision has no output schema or titles, so they are left out there.
  const old = (await rpc("tools/list", undefined, { "MCP-Protocol-Version": "2025-03-26" })).body.result.tools;
  assert.equal(old[0].outputSchema, undefined);
  assert.equal(old[0].title, undefined);

  const { resources } = (await rpc("resources/list")).body.result;
  assert.deepEqual(resources.map((resource: { uri: string }) => resource.uri), ["library://lantern-street/opening-hours", "library://lantern-street/borrowing-rules"]);
  for (const resource of resources) assert.equal(resource.text, undefined);
  const hours = (await rpc("resources/read", { uri: "library://lantern-street/opening-hours" })).body.result.contents[0];
  assert.equal(hours.mimeType, "text/markdown");
  assert.match(hours.text, /Saturday: 9 AM to 1 PM/);
  assert.deepEqual((await rpc("resources/templates/list")).body.result, { resourceTemplates: [] });
});

test("tool results match their output schemas and expose only public fields", async () => {
  const { tools } = (await rpc("tools/list")).body.result;
  const ajv = new Ajv2020({ strict: false });
  const searchOutput = ajv.compile(tools[0].outputSchema);
  const toolOutput = ajv.compile(tools[1].outputSchema);

  const garden = (await call("search_tools", { category: "Garden", available_only: true })).body.result;
  assert.equal(garden.isError, undefined);
  assert.ok(searchOutput(garden.structuredContent), JSON.stringify(searchOutput.errors));
  assert.deepEqual(garden.structuredContent, { count: 1, tools: [{ id: "hedge-trimmer", name: "Hedge trimmer", category: "Garden", loan_days: 14, available: true }] });
  assert.deepEqual(JSON.parse(garden.content[0].text), garden.structuredContent);

  const all = (await call("search_tools", {})).body.result.structuredContent;
  assert.equal(all.count, 7);
  for (const tool of all.tools) assert.deepEqual(Object.keys(tool), [...example.PUBLIC_FIELDS]);
  assert.deepEqual((await call("search_tools", { query: "drill" })).body.result.structuredContent.tools.map((tool: { id: string }) => tool.id), ["cordless-drill"]);
  assert.equal((await call("search_tools", { query: "power", category: "Power tools", available_only: true })).body.result.structuredContent.count, 0);

  const trimmer = (await call("get_tool", { id: "hedge-trimmer" })).body.result;
  assert.ok(toolOutput(trimmer.structuredContent));
  assert.deepEqual(trimmer.structuredContent, { id: "hedge-trimmer", name: "Hedge trimmer", category: "Garden", loan_days: 14, available: true });
  const unavailable = (await call("get_tool", { id: "pressure-washer" })).body.result.structuredContent;
  assert.equal(unavailable.available, false);
});

test("nothing can be written: unknown tools, methods and resources are refused", async () => {
  for (const name of ["reserve_tool", "delete_tool", "update_tool", "set_available", "SEARCH_TOOLS"]) {
    const denied = await call(name, { id: "cordless-drill" });
    assert.equal(denied.status, 200, name);
    assert.equal(denied.body.error.code, -32602, name);
    assert.match(denied.body.error.message, /Unknown tool/, name);
  }
  for (const method of ["resources/subscribe", "prompts/list", "completion/complete", "logging/setLevel", "sampling/createMessage"]) {
    assert.equal((await rpc(method, {})).body.error.code, -32601, method);
  }
  for (const uri of ["file:///etc/passwd", "library://lantern-street/staff-notes", "https://example.com/"]) {
    const missing = await rpc("resources/read", { uri });
    assert.equal(missing.body.error.code, -32002, uri);
  }
});

test("bad input fails clearly as a tool error, without repeating the input", async () => {
  const cases: [string, unknown, RegExp][] = [
    ["get_tool", { id: "Hedge Trimmer!!" }, /not a valid tool ID/],
    ["get_tool", { id: "no-such-tool" }, /No tool has that ID/],
    ["get_tool", {}, /Missing required argument: id/],
    ["get_tool", { id: "hedge-trimmer", storage_bin: true }, /Unexpected argument/],
    ["search_tools", { category: "Kitchen" }, /must be one of/],
    ["search_tools", { available_only: "yes" }, /true or false/],
    ["search_tools", { query: "drill ".repeat(7) }, /too long/],
    ["search_tools", { query: "" }, /too short/],
    ["search_tools", "drill", /must be an object/],
  ];
  for (const [name, args, message] of cases) {
    const result = (await call(name, args)).body.result;
    assert.equal(result.isError, true, JSON.stringify(args));
    assert.match(result.content[0].text, message, JSON.stringify(args));
    assert.equal(result.structuredContent, undefined);
    assert.doesNotMatch(result.content[0].text, /Hedge Trimmer!!|no-such-tool|Kitchen/);
  }
});

test("credential-shaped input is refused, never echoed and never logged", async () => {
  for (const args of [{ query: CANARY }, { query: `drill ${CANARY}` }, { query: "ghp_abcdefgh1234" }]) {
    const result = (await call("search_tools", args)).body.result;
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /looked like a password or key/);
  }
  assert.equal((await call("get_tool", { id: "akiaabcdefghijklmnopqrstuvwx" })).body.result.isError, true);
  // Ordinary words that start like a key prefix still work.
  assert.equal((await call("search_tools", { query: "skill" })).body.result.isError, undefined);
  assert.ok(logs.length > 10);
  for (const line of logs) {
    assert.doesNotMatch(line, /CANARY|ghp_|hedge-trimmer|Garden|drill/, line);
    assert.match(line, /^\S+Z [A-Za-z/]+( [A-Za-z_]+)?( -> (tool )?error)?$/, line);
  }
});

test("web pages, other hosts and the wrong HTTP shapes are rejected", async () => {
  const list = { jsonrpc: "2.0", id: 1, method: "tools/list" };
  const origin = await post(list, { Origin: "https://example.com" });
  assert.equal(origin.status, 403);
  assert.equal(origin.body.id, null);
  assert.equal((await post(list, { Origin: "http://127.0.0.1:6274" })).status, 403);
  // DNS rebinding: a name that resolves to this computer but is not a loopback name.
  const rebound = await new Promise<number>((resolve, reject) => {
    const request = httpRequest(base + "/mcp", { method: "POST", headers: { "Content-Type": "application/json", Host: "attacker.example" } }, response => { response.resume(); resolve(response.statusCode ?? 0); });
    request.on("error", reject);
    request.end(JSON.stringify(list));
  });
  assert.equal(rebound, 403);
  for (const method of ["GET", "DELETE", "PUT"]) {
    const response = await fetch(base + "/mcp", { method });
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get("allow"), "POST");
  }
  assert.equal((await post(list, {}, "/")).status, 404);
  assert.equal((await post(list, {}, "/mcp/extra")).status, 404);
  const modern = await post(list, { "MCP-Protocol-Version": "2026-07-28" });
  assert.equal(modern.status, 400);
  // Not the modern UnsupportedProtocolVersionError code, so dual-era clients fall back to the handshake.
  assert.notEqual(modern.body.error.code, -32022);
  assert.match(modern.body.error.message, /2025-11-25/);
  assert.equal((await post(JSON.stringify({ ...list, padding: "a".repeat(33 * 1024) }))).status, 413);
  assert.equal((await post("{not json")).body.error.code, -32700);
  assert.equal((await post([list])).status, 400);
  assert.equal((await post({ id: 1, method: "tools/list" })).status, 400);
  const wrongType = await fetch(base + "/mcp", { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(list) });
  assert.equal(wrongType.status, 415);
  // No session is minted, so nothing ties one request to the next.
  const listed = await fetch(base + "/mcp", { method: "POST", headers: { "Content-Type": "application/json", "MCP-Protocol-Version": "2025-11-25" }, body: JSON.stringify(list) });
  assert.equal(listed.headers.get("mcp-session-id"), null);
  assert.match(listed.headers.get("content-type") ?? "", /^application\/json/);
});

test("requests are rate limited and the server listens on loopback only", async () => {
  const limited = createServer(example.createMcpHandler({ log: () => undefined }));
  await new Promise<void>(resolve => limited.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(limited.address() as AddressInfo).port}/mcp`;
  const statuses: number[] = [];
  for (let index = 0; index < 121; index++) {
    statuses.push((await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"jsonrpc":"2.0","id":1,"method":"ping"}' })).status);
  }
  await new Promise<void>(resolve => limited.close(() => resolve()));
  assert.equal(statuses.filter(status => status === 200).length, 120);
  assert.equal(statuses.at(-1), 429);

  const started: Server = await example.startServer({ port: 0, log: () => undefined });
  const address = started.address() as AddressInfo;
  await new Promise<void>(resolve => started.close(() => resolve()));
  assert.equal(address.address, "127.0.0.1");
  assert.equal(example.DEFAULT_PORT, 8765);
  assert.equal(example.MCP_PATH, "/mcp");
});

test("no staff-only detail or canary appears in any response", () => {
  assert.ok(bodies.length > 40);
  for (const body of bodies) {
    assert.doesNotMatch(body, STAFF_ONLY);
    assert.doesNotMatch(body, /CANARY/);
  }
});

test("the workshop gives setup, invocation, a failure check and undo for supported clients", () => {
  const steps = ["## Step 1: connect a known-good server first", "## Step 2: run the example server", "## Step 3: connect it", "## Step 4: call it and check the answer", "## Step 5: check one failure", "## Step 6: undo"];
  let position = -1;
  for (const heading of steps) {
    const next = readme.indexOf(heading);
    assert.ok(next > position, heading);
    position = next;
  }
  for (const command of [
    "claude mcp add --transport http cloudflare-docs https://docs.mcp.cloudflare.com/mcp",
    "codex mcp add cloudflare-docs --url https://docs.mcp.cloudflare.com/mcp",
    "claude mcp remove cloudflare-docs",
    "codex mcp remove cloudflare-docs",
    "curl -fsSLO https://starter.uppercut-labs.com/examples/mcp-tool-library/server.mjs",
    "node server.mjs",
    "claude mcp add --transport http tool-library http://127.0.0.1:8765/mcp",
    "codex mcp add tool-library --url http://127.0.0.1:8765/mcp",
    "claude mcp list",
    "codex mcp list",
    "claude mcp remove tool-library",
    "codex mcp remove tool-library",
    "claude mcp add --transport http dvn https://dvn.pw/agent-native/v1/mcp",
    "claude mcp remove dvn",
  ]) assert.ok(readme.includes(command), command);
  // Commands must match what the server really offers.
  for (const name of ["search_tools", "get_tool", "library://lantern-street/opening-hours", "library://lantern-street/borrowing-rules", "Unknown tool", "id is not a valid tool ID. Use search_tools to list IDs.", "Lantern Street Tool Library (example) 1.0.0 on http://127.0.0.1:8765/mcp (read-only)"]) {
    assert.ok(readme.includes(name), name);
  }
  assert.match(readme, /\*\*14 days\*\*/);
  assert.match(readme, /\*\*8787\*\*/);
});

test("the workshop states versions, limits and the plugin distinction accurately", () => {
  for (const version of example.PROTOCOL_VERSIONS) assert.ok(readme.includes(`\`${version}\``), version);
  assert.match(readme, /`2026-07-28`\]\(https:\/\/modelcontextprotocol\.io\/specification\/2026-07-28\/[^)]+\), removes the opening handshake that the example uses/);
  assert.match(readme, /supports only `2026-07-28` cannot use this example/);
  assert.match(readme, /Node\.js 20 or later/);
  assert.match(readme, /Claude Code 2\.1\.286/);
  assert.match(readme, /Codex CLI 0\.159\.2/);
  assert.match(readme, /Documentation only/);
  assert.match(readme, /no server appears in any app directory on its own/);
  assert.match(readme, /public HTTPS address/);
  assert.match(readme, /Free plan you can add one custom connector/);
  assert.match(readme, /web only/);
  assert.match(readme, /no supported way to add this local server from a phone/);
  assert.match(readme, /Practising with the example server does not count on its own/);
  assert.doesNotMatch(readme, /automatically (appear|listed)|will appear in (ChatGPT|Claude)/i);
});

test("the recorded verification example fits the agent-mcp progress contract", () => {
  const sample = JSON.parse(readme.match(/```json\n([\s\S]*?)\n```/)![1]);
  const validate = new Ajv2020({ strict: false }).addSchema({ ...progressSchema, $id: "progress" }).getSchema("progress#/$defs/capabilityVerification")!;
  assert.ok(validate(sample), JSON.stringify(validate.errors));
  assert.equal(sample.interface, "mcp");
  assert.equal(sample.expected_output_check, "passed");
  assert.equal(sample.negative_case_check, "passed");
  assert.equal(sample.learner_confirmed, true);
});

test("public example files carry no planning, private dvn material or secrets", async () => {
  const source = await readFile(`${folder}/server.mjs`, "utf8");
  for (const [name, body] of [["README.md", readme], ["server.mjs", source], ["Level 3", level3]] as const) {
    assert.doesNotMatch(body, /SP3-|walkthrough|GRILL|starter-pack-internal|devin-thomas\//, name);
    assert.doesNotMatch(body, /[\w.+-]+@(?!modelcontextprotocol\/)[\w-]+\.[\w.]+/, name);
    assert.doesNotMatch(body, /\bD[Vv][Nn]\b/, name);
    assert.doesNotMatch(body, /dvn\.pw\/(mcp|sign-in|downloads)/, name);
    assert.doesNotMatch(body, /Bearer [A-Za-z0-9]|api[_-]?key\s*[:=]/i, name);
  }
  assert.doesNotMatch(source, /\bimport\b[^;]*from "(?!node:)/);
  assert.doesNotMatch(source, /0\.0\.0\.0|listen\(port\)/);
});

test("the Phase 3 Level 3 section points to the workshop and keeps its promises", () => {
  assert.ok(level3.includes("`https://starter.uppercut-labs.com/examples/mcp-tool-library/README.md`"));
  assert.match(level3, /Cloudflare's documentation server/);
  assert.match(level3, /does not publish a plugin anywhere/);
  assert.match(level3, /Claude Code or the Codex CLI/);
  assert.match(level3, /\[dvn\]\(https:\/\/dvn\.pw\/\)/);
  assert.match(level3, /public ChatGPT app is not published yet/);
  assert.match(level3, /aria-labelledby="phase-3-dvn-spotlight"/);
  assert.match(level3, /id="phase-3-dvn-spotlight"/);
});
