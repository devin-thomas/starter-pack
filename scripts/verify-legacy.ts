import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { files, loadContent, routes } from "./content";
import { assertDirectResource, assertPinnedBytes, assertReadingRedirect } from "./migration-contract";
import origins from "../src/site-origin.json";
import baseline from "./fixtures/pre-domain-migration-releases.json";

const base = new URL(process.argv[2] || origins.legacyOrigin);
assert.equal(base.origin, origins.legacyOrigin, "Legacy checks require the exact legacy HTTPS origin");
assert.equal(base.pathname, "/");
const redirects = !process.argv.includes("--before-redirects");
const fetchAt = (url: string, method = "GET") => fetch(url, { method, redirect: "manual", signal: AbortSignal.timeout(15_000) });
await loadContent();
for (const [file, hash] of Object.entries(baseline.files)) {
  const route = file.slice("public".length);
  const response = await fetchAt(base.origin + route);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(response.status, 200, route);
  assert.equal(response.headers.get("Location"), null, route);
  assertPinnedBytes(bytes, hash, route);
}
let machineCount = 0;
for (const file of await files("dist")) {
  if (["dist/_headers", "dist/_redirects", "dist/404.html"].includes(file)) continue;
  if (file.endsWith(".html") && file !== "dist/artifacts/progress-workbench/index.html") continue;
  const route = file.slice(4);
  const type = route.endsWith(".json") ? /application\/json/ : /\.(md|txt)$/.test(route) ? /text\/plain/ : route.endsWith(".xml") ? /(?:application|text)\/xml/ : /./;
  await assertDirectResource(await fetchAt(base.origin + route), await readFile(file), type, route);
  const head = await fetchAt(base.origin + route, "HEAD");
  assert.equal(head.status, 200, route);
  assert.equal(head.headers.get("Location"), null, route);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  machineCount++;
}
for (const route of routes) {
  const suffix = route + "?from=legacy-check&q=one%20two";
  for (const method of ["GET", "HEAD"]) {
    const response = await fetchAt(base.origin + suffix, method);
    if (redirects) {
      const target = origins.canonicalOrigin + suffix;
      assertReadingRedirect(response, target);
      assert.equal((await fetchAt(target, method)).status, 200, `one hop: ${target}`);
    } else {
      assert.equal(response.status, 200, `redirect switch must remain off: ${route}`);
      assert.match(response.headers.get("Content-Type") || "", /text\/html/);
    }
  }
}
for (const route of ["/artifacts/progress-workbench/index.html", "/artifacts/progress-workbench/", "/artifacts/progress-workbench"]) {
  const response = await fetchAt(base.origin + route);
  assert.match(response.headers.get("Content-Disposition") || "", /attachment/);
  await assertDirectResource(response, await readFile("dist/artifacts/progress-workbench/index.html"), /application\/octet-stream/, route);
}
const catalog = await fetchAt(base.origin + "/artifacts/progress-workbench/catalog.json");
assert.equal(catalog.headers.get("Access-Control-Allow-Origin"), "*");
for (const path of ["/missing-migration-check", "/.env", "/.git/config", "/reports/"]) {
  assert.equal((await fetchAt(base.origin + path)).status, 404, path);
}
console.log(JSON.stringify({ evidence: "live-http", origin: base.origin, redirects, machineCount, pinnedCount: Object.keys(baseline.files).length, status: "passed", agentAcceptance: "not tested" }));
