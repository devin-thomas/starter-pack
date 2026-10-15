import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { assertGoogleResourceAccess, assertSameRobots, googleResourcePolicy } from "./crawler-policy";

test("wildcard Allow does not override Cloudflare's named Google block", () => {
  assert.throws(() => assertGoogleResourceAccess("User-agent: Google-Extended\nDisallow: /\n\nUser-agent: *\nAllow: /"), /blocked/);
});
test("scoped curriculum rules override the managed root block", () => {
  assert.doesNotThrow(() => assertGoogleResourceAccess(`User-agent: Google-Extended\nDisallow: /\n\nUser-agent: *\nAllow: /\n\n${googleResourcePolicy}`));
});
test("a more specific resource block fails verification", () => {
  for (const path of ["/agent/start.md", "/agent/catalog.json", "/prompts/get-started.txt", "/artifacts/progress/README.md", "/style/TypeScript.md", "/style/Godot.md"])
    assert.throws(() => assertGoogleResourceAccess(`${googleResourcePolicy}\nDisallow: ${path}`), /blocked/);
});

test("served robots may prepend the known Cloudflare block while retaining the exact source policy", () => {
  const source = `User-agent: *\nAllow: /\n\n${googleResourcePolicy}\nSitemap: https://starter.uppercut-labs.com/sitemap.xml\n`;
  const managed = readFileSync(new URL("./fixtures/cloudflare-managed-robots.txt", import.meta.url), "utf8") + "\n";
  assertSameRobots(source, source);
  assertSameRobots(managed + source + "\n", source);
  assert.throws(() => assertSameRobots(managed + source.replace("starter.uppercut-labs.com", "starter.devthomas.site"), source), /differs/);
  assert.throws(() => assertSameRobots("User-agent: Other\nAllow: /\n" + source, source), /Unrecognized/);
  assert.throws(() => assertSameRobots(managed.replace("Disallow: /", "Disallow: /agent/start.md") + source, source), /Unrecognized/);
  assert.throws(() => assertSameRobots(managed.replace("# END Cloudflare Managed Content", "User-agent: Googlebot\nDisallow: /\n# END Cloudflare Managed Content") + source, source), /Unrecognized/);
  assert.throws(() => assertSameRobots(managed.replace("# END Cloudflare Managed Content", "# END Unknown") + source, source), /Unrecognized/);
});
