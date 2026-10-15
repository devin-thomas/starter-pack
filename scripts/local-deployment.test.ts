import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { createLocalWorker } from "./local-worker";
import { verifyLegacy } from "./verify-legacy";
import origins from "../src/site-origin.json";

test(
  "deployment verifier passes against actual local Worker and assets with redirects disabled",
  { timeout: 45_000 },
  async (t) => {
    const mf = await createLocalWorker();
    t.after(() => mf.dispose());
    const url = await mf.ready;
    const { stdout } = await promisify(execFile)(
      process.execPath,
      ["--import", "tsx", "scripts/verify-deployment.ts", url.href, "--local"],
      { timeout: 35_000, maxBuffer: 1024 * 1024 },
    );
    assert.match(stdout, /local HTTP asset routing/);
    assert.match(stdout, /Provider-app acceptance is separate/);
  },
);

test(
  "legacy verifier checks the real local Worker without claiming live evidence",
  { timeout: 30_000 },
  async (t) => {
    const mf = await createLocalWorker("enabled");
    t.after(() => mf.dispose());
    const transport: typeof fetch = async (input, init) => {
      const response = await mf.dispatchFetch(
        input instanceof Request ? input.url : String(input),
        { method: init?.method, redirect: "manual" },
      );
      return new Response(await response.arrayBuffer(), {
        status: response.status,
        headers: Array.from(response.headers.entries()),
      });
    };
    const receipt = await verifyLegacy(
      new URL(origins.legacyOrigin),
      true,
      transport,
      "local",
    );
    assert.equal(receipt.evidence, "local");
    assert.equal(receipt.status, "passed");
    assert.equal(receipt.pinnedCount, 52);
    assert.ok(receipt.machineCount > 200);
    assert.equal(receipt.agentAcceptance, "not tested");
  },
);
