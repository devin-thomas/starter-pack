import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("follow-up releases preserve the approved two-host routing state and defensive bindings", async () => {
  const config = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
  assert.equal(config.name, "starter-pack");
  assert.equal(config.main, "src/worker.ts");
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.routes, [
    { pattern: "starter.devthomas.site", custom_domain: true },
    { pattern: "starter.uppercut-labs.com", custom_domain: true },
  ]);
  assert.deepEqual(config.ratelimits, [
    { name: "FEEDBACK_RATE_LIMITER", namespace_id: "1001", simple: { limit: 5, period: 60 } },
    { name: "FEEDBACK_TOTAL_LIMITER", namespace_id: "1002", simple: { limit: 30, period: 60 } },
  ]);
  assert.deepEqual(config.assets, { binding: "ASSETS", run_worker_first: true, directory: "./dist", html_handling: "none", not_found_handling: "404-page" });
  assert.deepEqual(config.vars, { LEGACY_HUMAN_REDIRECTS: "enabled" });
});
