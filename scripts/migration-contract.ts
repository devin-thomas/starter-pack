import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export function assertPinnedBytes(actual: Uint8Array, sha256: string, label: string) {
  assert.equal(createHash("sha256").update(actual).digest("hex"), sha256, `${label}: immutable bytes changed`);
}

export async function assertDirectResource(response: Response, expected: Uint8Array, type: RegExp, label: string) {
  assert.equal(response.status, 200, `${label}: resource must be direct 200`);
  assert.equal(response.headers.get("Location"), null, `${label}: resource redirected`);
  assert.match(response.headers.get("Content-Type") || "", type, `${label}: wrong content type`);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from(expected), `${label}: body differs from build`);
}

export function assertReadingRedirect(response: Response, target: string) {
  assert.ok(response.status === 301 || response.status === 308, `${target}: expected permanent redirect`);
  assert.equal(response.headers.get("Location"), target, "reading redirect must preserve exact path and query");
}
