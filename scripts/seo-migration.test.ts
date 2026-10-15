import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { loadContent, routes } from "./content";
import { assertGoogleResourceAccess } from "./crawler-policy";
import { readingRoute } from "../src/worker";
import origins from "../src/site-origin.json";

test("every indexable reading route has one new canonical, sitemap entry and exact legacy destination", async () => {
  await loadContent();
  const sitemap = await readFile("dist/sitemap.xml", "utf8");
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(new Set(locations).size, locations.length, "no duplicate sitemap entries");
  assert.deepEqual(new Set(locations), new Set(routes.map(route => origins.canonicalOrigin + route)));
  for (const route of routes) {
    const html = await readFile(route === "/" ? "dist/index.html" : `dist${route}.html`, "utf8");
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(canonicals, [origins.canonicalOrigin + route], route);
    assert.ok(!/<meta[^>]+name="robots"[^>]+noindex/i.test(html), route);
    assert.equal(readingRoute(route), route);
    const legacy = new URL(route + "?from=search&q=one%20two", origins.legacyOrigin);
    const destination = new URL(origins.canonicalOrigin);
    destination.pathname = legacy.pathname;
    destination.search = legacy.search;
    assert.equal(destination.href, origins.canonicalOrigin + route + "?from=search&q=one%20two");
    assert.notEqual(destination.origin, legacy.origin);
  }
  const robots = await readFile("dist/robots.txt", "utf8");
  assert.equal(robots.split(`Sitemap: ${origins.canonicalOrigin}/sitemap.xml`).length, 2);
  assertGoogleResourceAccess(robots);
  for (const file of ["robots.txt", "sitemap.xml", "llms.txt"]) {
    const body = await readFile(`dist/${file}`, "utf8");
    assert.ok(body.includes(origins.canonicalOrigin), file);
    assert.ok(!body.includes(origins.legacyOrigin), file);
    assert.ok(!body.includes(origins.workerOrigin), file);
  }
  for (const path of ["/skills/starter-pack/current/SKILL.md", "/skills/starter-pack/0.2.6/SKILL.md", "/artifacts/progress-workbench/index.html", "/schemas/starter-progress.schema.json", "/robots.txt", "/sitemap.xml"]) {
    assert.equal(readingRoute(path), undefined, path);
  }
});
