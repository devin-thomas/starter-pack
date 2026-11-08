import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import matter from "gray-matter";
import { loadExampleSite, publicTool, renderExampleSite } from "./example-site";
import { privateMarkers } from "./verify-example-site";
import { exampleSiteResponse } from "../src/example-sites";
import { staticRoutes } from "../src/reading-routes";
import { parseRegistry } from "../src/workbench/registry";

const origin = "https://starter.uppercut-labs.com";

test("the example site source plants an unpublished draft and internal fields", async () => {
  const site = await loadExampleSite();
  assert.ok(site.drafts.length >= 1, "a draft page exists in the source");
  assert.ok(site.tools.some((tool) => Object.keys(tool).some((field) => !site.publicFields.includes(field))), "internal tool fields exist");
  const markers = privateMarkers(site);
  assert.ok(markers.some((marker) => marker.includes("LSTL-DRAFT-7Q4K")));
  assert.ok(markers.some((marker) => marker.includes("$23.75")));
});

test("no draft or internal field reaches any generated page, mirror, llms.txt, sitemap or JSON", async () => {
  const site = await loadExampleSite();
  const markers = privateMarkers(site);
  const files = await renderExampleSite(site, origin);
  assert.deepEqual(
    files.map(({ file }) => file).sort(),
    [...site.published.flatMap((page) => [`${page.slug}.html`, `${page.slug}.md`]), "index.json", "tools.json", "llms.txt", "sitemap.xml", "open-now.js"].sort(),
  );
  for (const { file, contents } of files)
    for (const marker of markers) assert.ok(!contents.includes(marker), `${file} leaks ${marker}`);
  const tools = JSON.parse(files.find(({ file }) => file === "tools.json")!.contents).tools;
  for (const tool of tools) assert.deepEqual(Object.keys(tool), site.publicFields.filter((field) => field in tool));
});

test("a field added later stays private until it is allowlisted", () => {
  const record = { id: "saw", name: "Saw", donor_phone: "555-0100" };
  assert.deepEqual(publicTool(record, ["id", "name"]), { id: "saw", name: "Saw" });
});

test("pages, Markdown, JSON, llms.txt and sitemap agree on addresses and dates", async () => {
  const site = await loadExampleSite();
  const files = new Map((await renderExampleSite(site, origin)).map(({ file, contents }) => [file, contents]));
  const base = origin + site.config.base;
  const url = (slug: string) => base + (slug === "index" ? "" : slug);
  const index = JSON.parse(files.get("index.json")!);
  assert.deepEqual(index.pages.map((page: { url: string }) => page.url), site.published.map((page) => url(page.slug)));
  assert.equal(index.updated, site.published.map((page) => page.updated).sort().at(-1));
  const sitemap = files.get("sitemap.xml")!;
  const llms = files.get("llms.txt")!;
  for (const page of site.published) {
    const html = files.get(`${page.slug}.html`)!;
    assert.ok(html.includes(`<link rel="canonical" href="${url(page.slug)}">`));
    assert.ok(html.includes(`<link rel="alternate" type="text/markdown" href="${base}${page.slug}.md">`));
    assert.ok(html.includes(`<time datetime="${page.updated}">`));
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
    assert.ok(html.includes("The library does not exist."), "every page says the site is fictional");
    assert.ok(files.get(`${page.slug}.md`)!.includes(`Canonical: ${url(page.slug)}\nUpdated: ${page.updated}`));
    assert.ok(sitemap.includes(`<loc>${url(page.slug)}</loc><lastmod>${page.updated}</lastmod>`));
    assert.ok(llms.includes(`](${url(page.slug)})`));
  }
  assert.equal([...sitemap.matchAll(/<loc>/g)].length, site.published.length);
  for (const slug of [...Object.keys(site.config.redirects), ...site.config.withdrawn.map((page) => page.slug)]) {
    assert.ok(!sitemap.includes(base + slug + "<"), `${slug} is not in the sitemap`);
    assert.ok(!llms.includes(base + slug + ")"), `${slug} is not in llms.txt`);
  }
  assert.deepEqual(index.withdrawn.map((page: { url: string }) => page.url), site.config.withdrawn.map((page) => base + page.slug));
});

test("key facts are in the server HTML; only the open-now badge needs scripts", async () => {
  const site = await loadExampleSite();
  const files = new Map((await renderExampleSite(site, origin)).map(({ file, contents }) => [file, contents]));
  const home = files.get("index.html")!;
  assert.match(home, /Tuesday and Thursday: 4 PM to 8 PM/);
  assert.match(home, /<span id="open-now" class="badge" data-hours="[^"]+" hidden><\/span>/);
  assert.doesNotMatch(home, /(Open|Closed) now/);
  assert.match(files.get("borrowing.html")!, /up to <strong>three tools at a time<\/strong>/);
  for (const [file, contents] of files)
    if (file.endsWith(".html") && file !== "index.html") assert.doesNotMatch(contents, /<script src=/, `${file} needs no script`);
});

test("the Worker routes clean addresses, redirects, withdrawals and drafts", async () => {
  const served: string[] = [];
  const assets = {
    async fetch(request: Request) {
      const path = new URL(request.url).pathname;
      served.push(path);
      return new Response(path.endsWith("winter-membership.html") ? "missing" : "ok", { status: path.endsWith("winter-membership.html") ? 404 : 200 });
    },
  };
  const request = (path: string, method = "GET") => exampleSiteResponse(new Request(origin + path, { method }), assets);
  const location = async (path: string) => {
    const response = await request(path)!;
    return [response.status, response.headers.get("location")];
  };
  assert.deepEqual(await location("/examples/agent-ready-website"), [301, `${origin}/examples/agent-ready-website/`]);
  assert.deepEqual(await location("/examples/agent-ready-website/rules?x=1"), [301, `${origin}/examples/agent-ready-website/borrowing?x=1`]);
  assert.deepEqual(await location("/examples/agent-ready-website/borrowing.html"), [301, `${origin}/examples/agent-ready-website/borrowing`]);
  assert.deepEqual(await location("/examples/agent-ready-website/index.html"), [301, `${origin}/examples/agent-ready-website/`]);
  assert.deepEqual(await location("/examples/agent-ready-website/index"), [301, `${origin}/examples/agent-ready-website/`]);
  const gone = await request("/examples/agent-ready-website/summer-hours")!;
  assert.equal(gone.status, 410);
  assert.match(gone.headers.get("content-type") ?? "", /text\/html; charset=utf-8/);
  assert.match(await gone.text(), /withdrawn on <time datetime="2026-09-30">/);
  assert.equal(await (await request("/examples/agent-ready-website/summer-hours", "HEAD")!).text(), "");
  assert.equal((await request("/examples/agent-ready-website/")!).status, 200);
  assert.equal((await request("/examples/agent-ready-website/borrowing")!).status, 200);
  assert.equal((await request("/examples/agent-ready-website/winter-membership")!).status, 404);
  assert.equal((await request("/examples/agent-ready-website/llms.txt")!).status, 200);
  assert.deepEqual(served, [
    "/examples/agent-ready-website/index.html",
    "/examples/agent-ready-website/borrowing.html",
    "/examples/agent-ready-website/winter-membership.html",
    "/examples/agent-ready-website/llms.txt",
  ]);
  assert.equal(request("/phases/3"), undefined);
});

test("the Worker bundle carries routing only, never example content", async () => {
  const site = await loadExampleSite();
  const bundle = await build({ entryPoints: ["src/worker.ts"], bundle: true, write: false, format: "esm", platform: "browser" });
  const code = bundle.outputFiles[0].text;
  assert.ok(code.includes("/examples/agent-ready-website/"));
  for (const marker of privateMarkers(site)) assert.ok(!code.includes(marker), `Worker bundle leaks ${marker}`);
  for (const page of site.published) assert.ok(!code.includes(page.summary), "page content stays out of the Worker");
});

test("the Level 1 lesson is routed, linked from Phase 3 and stays a milestone", async () => {
  const { data: lesson, content } = matter(await readFile("content/lessons/agent-ready-website.md", "utf8"));
  assert.equal(lesson.route, "/phases/3/agent-ready-website");
  assert.ok(staticRoutes.includes(lesson.route));
  const phase = matter(await readFile("content/phases/3.md", "utf8"));
  assert.equal(phase.data.status, "preview", "Phase 3 stays a preview until every level is verified");
  const level1 = phase.content.split("### Level 1: Discoverable")[1].split("\n### ")[0];
  assert.ok(level1.includes("](/phases/3/agent-ready-website)"), "the Level 1 section links to the lesson");
  assert.ok(level1.includes("does not finish Phase 3"));
  const registry = parseRegistry(JSON.parse(await readFile("content/workbench-steps.json", "utf8")));
  const step = registry.steps["agent-ready-website"];
  assert.equal(step.verification, "readiness");
  assert.deepEqual(step.gate_for, []);
  assert.equal(step.guide, "/phases/3#level-1-discoverable");
  assert.ok(!JSON.stringify(registry.phases["phase-3"].gate).includes("agent-ready-website"));
  assert.ok(!Object.values(registry.groups).some((group) => JSON.stringify(group).includes("agent-ready-website")));
  assert.match(content, /does not finish Phase 3 on its own/);
  assert.match(content, /`@uppercut-labs\/agent-native` package, version 1\.0\.1/, "cite the released package version");
  assert.doesNotMatch(content, /\b1\.1(\.\d+)?\b|v1\.1/, "never present an unreleased version");
  const site = await loadExampleSite();
  for (const marker of privateMarkers(site)) assert.ok(!content.includes(marker), `lesson leaks ${marker}`);
  assert.equal(site.config.lesson, lesson.route);
});
