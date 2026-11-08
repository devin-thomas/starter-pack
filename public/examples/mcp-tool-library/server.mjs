#!/usr/bin/env node
// Lantern Street Tool Library: a small, read-only MCP server you can run and read.
//
// The library is fictional. This file has no dependencies: it needs Node.js 20 or
// later and nothing else. Run it with `node server.mjs`, then connect your agent to
// http://127.0.0.1:8765/mcp. The guide that goes with it is README.md in this folder.
//
// What it shows:
// - Two read-only tools (search_tools, get_tool) with input and output schemas.
// - Two resources (opening hours, borrowing rules) the client can read.
// - Least privilege: staff-only fields stay in this file and are never returned.
// - The Streamable HTTP transport, stateless, answering with JSON (MCP 2025-11-25).
// - Refusals you can test: unknown tools, bad input, web pages, other computers.

import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

export const SERVER_INFO = Object.freeze({
  name: "lantern-street-tool-library",
  title: "Lantern Street Tool Library (example)",
  version: "1.0.0",
});
// Newest first. These are the handshake-era revisions; see README.md for 2026-07-28.
export const PROTOCOL_VERSIONS = Object.freeze(["2025-11-25", "2025-06-18", "2025-03-26"]);
export const DEFAULT_PORT = 8765;
export const MCP_PATH = "/mcp";
const MAX_BODY_BYTES = 32 * 1024;
const MAX_REQUESTS_PER_MINUTE = 120;

// ---------------------------------------------------------------------------
// Data. Only PUBLIC_FIELDS ever leave the server. storage_bin and staff_note are
// here on purpose: they stand in for the private details every real project has.
// ---------------------------------------------------------------------------
export const PUBLIC_FIELDS = Object.freeze(["id", "name", "category", "loan_days", "available"]);
export const CATEGORIES = Object.freeze(["Power tools", "Hand tools", "Garden", "Ladders"]);
const TOOLS = Object.freeze([
  { id: "cordless-drill", name: "Cordless drill", category: "Power tools", loan_days: 14, available: true, storage_bin: "Workshop cabinet, slot 4", staff_note: "Charger lives in the locked drawer" },
  { id: "circular-saw", name: "Circular saw", category: "Power tools", loan_days: 7, available: true, storage_bin: "Tool wall, peg 12", staff_note: "Guard spring checked at the last repair night" },
  { id: "pressure-washer", name: "Pressure washer", category: "Power tools", loan_days: 7, available: false, storage_bin: "Yard store, bay 1", staff_note: "Waiting for a new trigger gun from the supplier" },
  { id: "extension-ladder", name: "Extension ladder (6 m)", category: "Ladders", loan_days: 14, available: false, storage_bin: "Yard store, rail 2", staff_note: "Ask for a second person on the first loan" },
  { id: "hedge-trimmer", name: "Hedge trimmer", category: "Garden", loan_days: 14, available: true, storage_bin: "Potting room, crate 3", staff_note: "Battery came from the spring plant swap" },
  { id: "tile-cutter", name: "Tile cutter", category: "Hand tools", loan_days: 7, available: true, storage_bin: "Workshop cabinet, slot 9", staff_note: "Spare wheel sits under the foam insert" },
  { id: "stud-finder", name: "Stud finder", category: "Hand tools", loan_days: 14, available: true, storage_bin: "Counter tray B", staff_note: "Test the display before each loan" },
]);
const publicView = tool => Object.fromEntries(PUBLIC_FIELDS.map(field => [field, tool[field]]));

const RESOURCES = Object.freeze([
  {
    uri: "library://lantern-street/opening-hours",
    name: "opening-hours",
    title: "Opening hours",
    description: "When the library is open.",
    mimeType: "text/markdown",
    text: "# Opening hours\n\n- Tuesday and Thursday: 4 PM to 8 PM\n- Saturday: 9 AM to 1 PM\n\nClosed on public holidays.\n",
  },
  {
    uri: "library://lantern-street/borrowing-rules",
    name: "borrowing-rules",
    title: "Borrowing rules",
    description: "Membership, loan limits, renewals and late returns.",
    mimeType: "text/markdown",
    text: "# Borrowing rules\n\n- Membership costs $12 a year.\n- Members borrow up to three tools at a time.\n- A loan lasts 14 days; high-demand tools have a 7-day loan.\n- A loan can be renewed once if no other member is waiting.\n- There are no late fees. After 7 days overdue, borrowing pauses until the tool is back.\n",
  },
]);

// ---------------------------------------------------------------------------
// Tool definitions. The schemas are what the client and the model see.
// ---------------------------------------------------------------------------
const publicToolSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    category: { type: "string", enum: [...CATEGORIES] },
    loan_days: { type: "integer" },
    available: { type: "boolean" },
  },
  required: [...PUBLIC_FIELDS],
  additionalProperties: false,
};
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export const TOOL_DEFINITIONS = Object.freeze([
  {
    name: "search_tools",
    title: "Search the tool catalog",
    description: "Find tools the library lends. Filter by words in the name, by category, or to tools that are in right now. Returns each tool's ID, name, category, loan length in days and availability. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1, maxLength: 40, description: "Words in the tool name, for example \"drill\"" },
        category: { type: "string", enum: [...CATEGORIES], description: "Only tools in this category" },
        available_only: { type: "boolean", description: "Only tools that are in the library right now" },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: { count: { type: "integer" }, tools: { type: "array", items: publicToolSchema } },
      required: ["count", "tools"],
      additionalProperties: false,
    },
    annotations: readOnly,
  },
  {
    name: "get_tool",
    title: "Get one tool",
    description: "Get one tool by its ID, for example \"hedge-trimmer\". Use search_tools to find IDs. Read-only.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", pattern: "^[a-z0-9-]{1,40}$", description: "The tool ID from search_tools" } },
      required: ["id"],
      additionalProperties: false,
    },
    outputSchema: publicToolSchema,
    annotations: readOnly,
  },
]);

// Reject anything shaped like a password or key without repeating it back.
const SECRET_SHAPED = /\b(?:sk|pk|rk|ghp|gho|ghs|github_pat|xox[abp])[-_][A-Za-z0-9_-]{8,}|\bAKIA[0-9A-Z]{12,}|[A-Za-z0-9_-]{24,}/;

class InputError extends Error {}

function checkArguments(args, schema) {
  if (args === undefined) args = {};
  if (typeof args !== "object" || args === null || Array.isArray(args)) throw new InputError("Arguments must be an object.");
  for (const key of Object.keys(args)) {
    if (!(key in schema.properties)) throw new InputError(`Unexpected argument. Allowed: ${Object.keys(schema.properties).join(", ")}.`);
  }
  for (const key of schema.required ?? []) {
    if (args[key] === undefined) throw new InputError(`Missing required argument: ${key}.`);
  }
  for (const [key, value] of Object.entries(args)) {
    const rule = schema.properties[key];
    if (rule.type === "boolean" && typeof value !== "boolean") throw new InputError(`${key} must be true or false.`);
    if (rule.type !== "string") continue;
    if (typeof value !== "string") throw new InputError(`${key} must be text.`);
    if (SECRET_SHAPED.test(value)) throw new InputError("That input looked like a password or key, so it was not used. This tool never needs one.");
    if (rule.enum && !rule.enum.includes(value)) throw new InputError(`${key} must be one of: ${rule.enum.join(", ")}.`);
    if (rule.minLength && value.length < rule.minLength) throw new InputError(`${key} is too short.`);
    if (rule.maxLength && value.length > rule.maxLength) throw new InputError(`${key} is too long (at most ${rule.maxLength} characters).`);
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) throw new InputError(`${key} is not a valid tool ID. Use search_tools to list IDs.`);
  }
  return args;
}

const toolResult = structured => ({
  content: [{ type: "text", text: JSON.stringify(structured) }],
  structuredContent: structured,
});
const toolError = message => ({ content: [{ type: "text", text: message }], isError: true });

function callTool(name, rawArgs) {
  const definition = TOOL_DEFINITIONS.find(tool => tool.name === name);
  if (!definition) return { error: { code: -32602, message: "Unknown tool. This server only has search_tools and get_tool, and it cannot change anything." } };
  let args;
  try {
    args = checkArguments(rawArgs, definition.inputSchema);
  } catch (error) {
    if (error instanceof InputError) return { result: toolError(error.message) };
    throw error;
  }
  if (name === "search_tools") {
    const words = (args.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const tools = TOOLS.filter(tool =>
      words.every(word => tool.name.toLowerCase().includes(word)) &&
      (args.category === undefined || tool.category === args.category) &&
      (args.available_only !== true || tool.available)).map(publicView);
    return { result: toolResult({ count: tools.length, tools }) };
  }
  const tool = TOOLS.find(item => item.id === args.id);
  if (!tool) return { result: toolError("No tool has that ID. Use search_tools to list the IDs.") };
  return { result: toolResult(publicView(tool)) };
}

// ---------------------------------------------------------------------------
// JSON-RPC methods. Anything not listed here is "method not found".
// ---------------------------------------------------------------------------
function handleRpc(message, protocolVersion) {
  const params = message.params ?? {};
  switch (message.method) {
    case "initialize": {
      const requested = params.protocolVersion;
      return {
        result: {
          protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: "Read-only catalog of the fictional Lantern Street Tool Library. Use search_tools, then get_tool. Nothing here can reserve, lend or change anything.",
        },
      };
    }
    case "ping":
      return { result: {} };
    case "tools/list":
      return { result: { tools: TOOL_DEFINITIONS.map(tool => protocolVersion === "2025-03-26" ? { ...tool, outputSchema: undefined, title: undefined } : tool) } };
    case "tools/call":
      return callTool(params.name, params.arguments);
    case "resources/list":
      return { result: { resources: RESOURCES.map(({ text, ...listing }) => listing) } };
    case "resources/templates/list":
      return { result: { resourceTemplates: [] } };
    case "resources/read": {
      const resource = RESOURCES.find(item => item.uri === params.uri);
      if (!resource) return { error: { code: -32002, message: "Resource not found. Use resources/list to see the two resources this server offers." } };
      return { result: { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: resource.text }] } };
    }
    default:
      return { error: { code: -32601, message: "Method not found." } };
  }
}

// ---------------------------------------------------------------------------
// HTTP transport: one endpoint, POST only, JSON in and JSON out, no sessions.
// ---------------------------------------------------------------------------
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

function send(response, status, body, headers = {}) {
  const text = body === undefined ? "" : JSON.stringify(body);
  response.writeHead(status, { ...(text ? { "Content-Type": "application/json" } : {}), "Cache-Control": "no-store", ...headers });
  response.end(text);
}
const rpcError = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

export function createMcpHandler({ log = line => console.error(line) } = {}) {
  let windowStart = Date.now();
  let requestsInWindow = 0;

  return function handle(request, response) {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const hostname = (request.headers.host ?? "").replace(/:\d+$/, "").toLowerCase();
    // DNS rebinding protection: only loopback host names, and no web page origins.
    if (!LOOPBACK_HOSTS.has(hostname)) return send(response, 403, rpcError(null, -32600, "Forbidden host."));
    if (request.headers.origin !== undefined) return send(response, 403, rpcError(null, -32600, "Web pages may not call this server."));
    if (url.pathname !== MCP_PATH) return send(response, 404, rpcError(null, -32600, `Not found. The MCP endpoint is ${MCP_PATH}.`));
    if (request.method !== "POST") return send(response, 405, rpcError(null, -32600, "Use POST. This server does not open event streams or sessions."), { Allow: "POST" });

    if (Date.now() - windowStart > 60_000) { windowStart = Date.now(); requestsInWindow = 0; }
    if (++requestsInWindow > MAX_REQUESTS_PER_MINUTE) return send(response, 429, rpcError(null, -32600, "Too many requests. Try again in a minute."), { "Retry-After": "60" });

    if (!/^application\/json\b/i.test(request.headers["content-type"] ?? "")) return send(response, 415, rpcError(null, -32600, "Send Content-Type: application/json."));
    const headerVersion = request.headers["mcp-protocol-version"];
    if (headerVersion !== undefined && !PROTOCOL_VERSIONS.includes(headerVersion)) {
      // A plain error on purpose: clients that also speak 2026-07-28 read it and fall back to the handshake.
      return send(response, 400, rpcError(null, -32600, `Unsupported MCP-Protocol-Version. Supported: ${PROTOCOL_VERSIONS.join(", ")}.`));
    }
    const protocolVersion = headerVersion ?? "2025-03-26";

    const chunks = [];
    let size = 0;
    let tooLarge = false;
    request.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) tooLarge = true;
      else chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) return send(response, 413, rpcError(null, -32600, "Request too large."));
      let message;
      try {
        message = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        return send(response, 400, rpcError(null, -32700, "Parse error: the body is not JSON."));
      }
      if (Array.isArray(message) || typeof message !== "object" || message === null || message.jsonrpc !== "2.0") {
        return send(response, 400, rpcError(null, -32600, "Send one JSON-RPC 2.0 message per request."));
      }
      // Notifications and responses from the client need no answer.
      if (message.id === undefined || message.method === undefined) return send(response, 202);
      const outcome = handleRpc(message, protocolVersion);
      // Log the method and tool name only. Arguments can hold things you never want in a log.
      log(`${new Date().toISOString()} ${message.method}${message.method === "tools/call" ? ` ${String(message.params?.name ?? "").slice(0, 40)}` : ""}${outcome.error ? " -> error" : outcome.result?.isError ? " -> tool error" : ""}`);
      send(response, 200, outcome.error ? rpcError(message.id, outcome.error.code, outcome.error.message) : { jsonrpc: "2.0", id: message.id, result: outcome.result });
    });
  };
}

export function startServer({ port = DEFAULT_PORT, log } = {}) {
  const server = createServer(createMcpHandler({ log }));
  // 127.0.0.1 only: other computers on your network cannot reach it.
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  startServer({ port }).then(server => {
    const { port: actual } = server.address();
    console.error(`${SERVER_INFO.title} ${SERVER_INFO.version} on http://127.0.0.1:${actual}${MCP_PATH} (read-only). Press Ctrl+C to stop.`);
  }, error => {
    console.error(error.code === "EADDRINUSE" ? `Port ${port} is in use. Run with another port, for example PORT=8766 node server.mjs` : error.message);
    process.exitCode = 1;
  });
}
