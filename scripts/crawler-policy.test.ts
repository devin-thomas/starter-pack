import { test } from "node:test";
import { strict as assert } from "node:assert";
import { assertGoogleResourceAccess, googleResourcePolicy } from "./crawler-policy";

test("wildcard Allow does not override Cloudflare's named Google block", () => {
  assert.throws(() => assertGoogleResourceAccess("User-agent: Google-Extended\nDisallow: /\n\nUser-agent: *\nAllow: /"), /blocked/);
});
test("scoped curriculum rules override the managed root block", () => {
  assert.doesNotThrow(() => assertGoogleResourceAccess(`User-agent: Google-Extended\nDisallow: /\n\nUser-agent: *\nAllow: /\n\n${googleResourcePolicy}`));
});
test("a more specific resource block fails verification", () => {
  for (const path of ["/agent/start.md", "/agent/catalog.json", "/prompts/get-started.txt", "/artifacts/progress/README.md"])
    assert.throws(() => assertGoogleResourceAccess(`${googleResourcePolicy}\nDisallow: ${path}`), /blocked/);
});
