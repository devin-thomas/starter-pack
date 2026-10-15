import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { createLocalWorker } from "./local-worker";

test("deployment verifier passes against actual local Worker and assets with redirects disabled", { timeout: 45_000 }, async (t) => {
  const mf = await createLocalWorker();
  t.after(() => mf.dispose());
  const url = await mf.ready;
  const { stdout } = await promisify(execFile)(process.execPath, ["--import", "tsx", "scripts/verify-deployment.ts", url.href, "--local"], { timeout: 35_000, maxBuffer: 1024 * 1024 });
  assert.match(stdout, /local HTTP asset routing/);
  assert.match(stdout, /Provider-app acceptance is separate/);
});
