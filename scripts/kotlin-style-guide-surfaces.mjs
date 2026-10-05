import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import matter from "gray-matter";

// Publication checks only. This is not a Kotlin compiler or Android device test.
const input = await readFile("content/style/kotlin.md", "utf8");
const { data: expected, content } = matter(input);
const markdown = content.trimStart();
assert.equal(expected.id, "kotlin");
assert.equal(expected.status, "stable");
assert.equal(expected.version, "1.0.0");
assert.equal(expected.route, "/style/Kotlin");
assert.equal(expected.accepted_through, "K038");
const ids = [...markdown.matchAll(/^## (K\d{3}) — /gm)].map(match => match[1]);
assert.deepEqual(ids, Array.from({ length: 38 }, (_, index) => `K${String(index + 1).padStart(3, "0")}`));
assert.equal([...markdown.matchAll(/^## /gm)].length, 41, "38 rules plus scope, validation, and references");
assert(markdown.includes("val labels: MutableList<String>"), "accepted native binding example");
assert(markdown.includes("Kotlin/JVM 1.9.0"), "specific core validation evidence");
for (const forbidden of ["Pending owner decision", "0.1.0-draft", "One remaining owner decision", "quick-build/google-tv-radio", "[P1]", "[P2]", "[P3]"]) {
  assert(!markdown.includes(forbidden), `private or provisional material: ${forbidden}`);
}

const liveAt = process.argv.indexOf("--live");
const live = liveAt >= 0 ? new URL(process.argv[liveAt + 1]) : null;
if (live && (live.protocol !== "https:" || live.hostname !== "starter.devthomas.site")) {
  throw new Error("Live checks require the canonical HTTPS host");
}

async function read(route, contentType) {
  if (live) {
    const response = await fetch(new URL(route, live), {
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    assert.equal(response.status, 200, `${route}: HTTP ${response.status}`);
    assert(contentType.test(response.headers.get("content-type") || ""), `${route}: wrong MIME type`);
    return response.text();
  }
  const file = route === "/style"
    ? "dist/style.html"
    : route === expected.route ? `dist${route}.html` : `dist${route}`;
  const body = await readFile(file, "utf8");
  assert(body.length > 0, `${route}: empty output`);
  return body;
}

const guide = JSON.parse(await read(`${expected.route}.json`, /application\/json/));
for (const field of ["id", "title", "summary", "status", "version", "updated", "accepted_through", "route"]) {
  assert.equal(guide[field], expected[field], `metadata ${field}`);
}
assert.equal(guide.markdown, markdown, "JSON/source parity");
const raw = await read(`${expected.route}.md`, /text\/plain/);
assert.equal(raw, markdown, "Markdown/source parity");

const html = await read(expected.route, /text\/html/);
const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
assert(visible.includes("Copy for agent") && visible.includes("style-guide-prose") && visible.includes("Why use this Kotlin guide?"), "human-first page contract");
assert(!/<h2[^>]*>[^<]*K\d{3}\s*[—-]/.test(visible), "internal K IDs leaked into human headings");
assert(!visible.includes('class="style-status"'), "stable guide shows a status badge");

const hub = (await read("/style", /text\/html/)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const card = hub.match(/<a\b[^>]*href="\/style\/Kotlin"[^>]*>([\s\S]*?)<\/a>/);
assert(card && !card[1].includes("style-status") && !card[1].includes("<p"), "Kotlin hub entry is title-only");

const catalog = JSON.parse(await read("/style/catalog.json", /application\/json/));
const entry = catalog.guides.find(item => item.id === "kotlin");
assert(entry, "Kotlin catalog entry");
for (const field of ["version", "status", "updated", "accepted_through"]) {
  assert.equal(entry[field], guide[field], `catalog ${field}`);
}
assert.equal(entry.html, "https://starter.devthomas.site/style/Kotlin");
assert.equal(entry.markdown, "https://starter.devthomas.site/style/Kotlin.md");
assert.equal(entry.json, "https://starter.devthomas.site/style/Kotlin.json");
const agentCatalog = JSON.parse(await read("/agent/catalog.json", /application\/json/));
const agentEntry = agentCatalog.resources.find(item => item.id === "style-kotlin");
assert.equal(agentEntry?.markdown, entry.markdown, "Kotlin agent discovery");
assert((await read("/llms.txt", /text\/plain/)).includes(`${expected.route}.md`), "llms discovery");
assert((await read("/sitemap.xml", /(?:application|text)\/xml/)).includes(`https://starter.devthomas.site${expected.route}`), "human sitemap");

console.log(JSON.stringify({
  surface: live ? live.href : "built dist",
  status: "passed",
  guideVersion: guide.version,
  acceptedThrough: guide.accepted_through,
  rules: ids.length,
  markdownSha256: createHash("sha256").update(raw).digest("hex"),
  checked: ["accepted-source", "human", "hub", "markdown", "json", "catalog", "agent-catalog", "llms", "sitemap"],
  notChecked: ["Android compilation", "emulator", "physical device"],
}));
