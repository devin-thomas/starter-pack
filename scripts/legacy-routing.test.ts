import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { unstable_getMiniflareWorkerOptions } from "wrangler";
import { files, loadContent, routes } from "./content";
import worker, { readingRoute } from "../src/worker";
import origins from "../src/site-origin.json";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

test("Worker and real static-assets pipeline preserve the legacy routing contract", { timeout: 30_000 }, async (t) => {
  await loadContent();
  const output = await build({ entryPoints: ["src/worker.ts"], bundle: true, write: false, format: "esm", platform: "browser" });
  const { workerOptions: { modulesRules: _moduleRules, ...workerOptions } } = unstable_getMiniflareWorkerOptions("wrangler.jsonc");
  const config = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.assets.html_handling, "none");
  assert.equal(config.vars.LEGACY_HUMAN_REDIRECTS, "disabled");
  const mf = new Miniflare(convertV4MiniflareOptions({ ...workerOptions, modules: true, script: output.outputFiles[0].text, bindings: { LEGACY_HUMAN_REDIRECTS: "enabled" } }));
  t.after(() => mf.dispose());
  const fetch = async (origin: string, path: string, method = "GET") => {
    const response = await mf.dispatchFetch(origin + path, { method, redirect: "manual" });
    return new Response(await response.arrayBuffer(), { status: response.status, headers: Array.from(response.headers.entries()) });
  };
  const htmlFiles = (await files("dist")).filter(file => file.endsWith(".html") && file !== "dist/404.html" && !file.startsWith("dist/artifacts/progress-workbench/"));
  assert.deepEqual(new Set(htmlFiles.map(file => file === "dist/index.html" ? "/" : file.slice(4, -5))), new Set(routes));
  for (const route of routes) {
    assert.equal(readingRoute(route), route, route);
    for (const alias of new Set([route, route === "/" ? "/index.html" : route + ".html", route === "/" ? "/" : route + "/"])) {
      for (const method of ["GET", "HEAD"]) {
        const response = await fetch(origins.legacyOrigin, alias + "?from=bookmark&next=https%3A%2F%2Fevil.example", method);
        assert.equal(response.status, 308, alias);
        const target = origins.canonicalOrigin + alias + "?from=bookmark&next=https%3A%2F%2Fevil.example";
        assert.equal(response.headers.get("Location"), target);
        const destination = await fetch(origins.canonicalOrigin, alias + "?from=bookmark&next=https%3A%2F%2Fevil.example", method);
        assert.equal(destination.status, 200, `one hop: ${target}`);
        assert.match(destination.headers.get("Content-Type") ?? "", /text\/html/);
        if (method === "HEAD") assert.equal((await destination.arrayBuffer()).byteLength, 0);
      }
    }
  }
  const rawFiles = (await files("dist")).filter(file => !htmlFiles.includes(file) && !["dist/404.html", "dist/_headers", "dist/_redirects"].includes(file));
  for (const file of rawFiles) {
    const path = file.slice(4);
    assert.equal(readingRoute(path), undefined, `machine overlap: ${path}`);
    const response = await fetch(origins.legacyOrigin, path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("Location"), null, path);
    assert.equal(digest(new Uint8Array(await response.arrayBuffer())), digest(await readFile(file)), path);
    const head = await fetch(origins.legacyOrigin, path, "HEAD");
    assert.equal(head.status, 200, path);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
  for (const path of ["/artifacts/progress-workbench/index.html", "/artifacts/progress-workbench", "/artifacts/progress-workbench/"]) {
    const download = await fetch(origins.legacyOrigin, path);
    assert.equal(download.status, 200, path);
    assert.equal(download.headers.get("Location"), null);
    assert.match(download.headers.get("Content-Disposition") ?? "", /attachment/);
    assert.match(download.headers.get("Content-Type") ?? "", /application\/octet-stream/);
    assert.equal(digest(new Uint8Array(await download.arrayBuffer())), digest(await readFile("dist/artifacts/progress-workbench/index.html")));
    const head = await fetch(origins.legacyOrigin, path, "HEAD");
    assert.equal(head.status, 200);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
  assert.equal((await fetch(origins.legacyOrigin, "/artifacts/progress-workbench/catalog.json")).headers.get("Access-Control-Allow-Origin"), "*");
  for (const host of [origins.canonicalOrigin, origins.workerOrigin, "https://starter.devthomas.site.evil.example", "https://unrelated.example"]) {
    assert.equal((await fetch(host, "/guide")).status, 200, host);
  }
  for (const path of ["/missing", "/skills/missing", "/style/missing.md", "/artifacts/progress-workbench/missing.html", "/guide/extra"]) {
    const response = await fetch(origins.legacyOrigin, path);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get("Location"), null);
  }
  const encoded = await fetch(origins.legacyOrigin, "/%67uide");
  assert.equal(encoded.status, 307, "platform normalization precedes Worker dispatch");
  assert.equal(new URL(encoded.headers.get("Location")!, origins.legacyOrigin).href, origins.legacyOrigin + "/guide");
  assert.equal((await fetch(origins.legacyOrigin, "/guide", "POST")).status, 405);
  assert.equal((await fetch(origins.legacyOrigin, "/api/feedback", "POST")).status, 403);
  assert.equal((await fetch(origins.legacyOrigin, "/api/missing", "POST")).status, 404);
  const disabled = await worker.fetch(new Request(origins.legacyOrigin + "/guide"), {
    ASSETS: { async fetch(request) { assert.equal(new URL(request.url).pathname, "/guide.html"); return new Response("page"); } },
    FEEDBACK_RATE_LIMITER: { async limit() { return { success: true }; } },
    FEEDBACK_TOTAL_LIMITER: { async limit() { return { success: true }; } },
  });
  assert.equal(disabled.status, 200, "missing switch keeps legacy human pages usable");
});
