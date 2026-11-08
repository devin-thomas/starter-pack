// HTTP projection. createHttpHandler turns the registry into a Web
// Request -> Response function; this file mounts it on Node's built-in server.
// The 1.0.1 HTTP adapter serves public reads only: protected contracts get no
// route and no OpenAPI entry, whatever headers a request carries.
import { createServer } from "node:http";
import { createHttpHandler } from "@uppercut-labs/agent-native/http";
import { createPantryRegistry } from "./capabilities.mjs";

const MAX_BODY_BYTES = 32 * 1024;

export function createPantryHttpHandler(registry = createPantryRegistry()) {
  return createHttpHandler(registry);
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Serve the handler on loopback only. Resolves with the server and its URL. */
export function startPantryServer({ port = 8787, host = "127.0.0.1" } = {}) {
  const handler = createPantryHttpHandler();
  const server = createServer(async (incoming, outgoing) => {
    try {
      const body = await readBody(incoming);
      if (body === null) {
        outgoing.writeHead(413, { "content-type": "application/json" });
        outgoing.end('{"error":{"code":"payload_too_large"}}');
        return;
      }
      const request = new Request(
        new URL(incoming.url ?? "/", `http://${host}`),
        {
          method: incoming.method,
          headers: Object.entries(incoming.headers).flatMap(([name, value]) =>
            Array.isArray(value)
              ? value.map((v) => [name, v])
              : value === undefined
                ? []
                : [[name, value]],
          ),
          body:
            incoming.method === "GET" || incoming.method === "HEAD"
              ? undefined
              : body,
        },
      );
      const response = await handler(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      outgoing.writeHead(500, { "content-type": "application/json" });
      outgoing.end('{"error":{"code":"internal"}}');
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const { port: actual } = server.address();
      resolve({ server, url: `http://${host}:${actual}` });
    });
  });
}
