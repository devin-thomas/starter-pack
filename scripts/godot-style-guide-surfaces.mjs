import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import matter from "gray-matter";

const input = await readFile("content/style/godot.md", "utf8");
const { data: expected, content } = matter(input);
const markdown = content.trimStart();

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

  const path = route === "/style"
    ? "dist/style.html"
    : route === expected.route
      ? `dist${route}.html`
      : `dist${route}`;
  const body = await readFile(path, "utf8");
  assert(body.length > 0, `${route}: empty output`);
  return body;
}

const guide = JSON.parse(await read(`${expected.route}.json`, /application\/json/));
for (const [field, expectedValue] of Object.entries({
  id: expected.id,
  status: expected.status,
  version: expected.version,
  updated: expected.updated,
  accepted_through: expected.accepted_through,
  route: expected.route,
})) {
  assert.equal(guide[field], expectedValue, `metadata ${field}`);
}

assert.equal(guide.markdown, markdown, "JSON/Markdown source parity");
const raw = await read(`${expected.route}.md`, /text\/plain/);
assert.equal(raw, markdown, "raw Markdown/source parity");

const ids = [...markdown.matchAll(/^## (G\d{3}) — /gm)].map(match => match[1]);
assert.equal(ids.length, 25, "Godot guide must contain 25 accepted rules");
assert.equal(new Set(ids).size, 25, "Godot rule IDs must be unique");
assert.equal(ids[0], "G001");
assert.equal(ids.at(-1), "G025");
assert(markdown.includes("hard-pinned to Godot 4.7.2"), "hard version pin");
assert(!markdown.includes("**In progress.**"), "release still has progress notice");

const html = await read(expected.route, /text\/html/);
const visible = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<!--[\s\S]*?-->/g, "");
assert(
  visible.includes("Copy for agent")
    && visible.includes("style-guide-prose")
    && visible.includes("Why use this Godot guide?"),
  "human-first page contract",
);
assert(!/<h2[^>]*>[^<]*G\d{3}\s*[—-]/.test(visible), "internal G IDs leaked into human headings");
assert(!visible.includes("style-guide-development"), "private planning link in public guide");
assert(!visible.includes('class="style-status"'), "released guide still shows status badge");

const hub = (await read("/style", /text\/html/)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
assert(hub.includes('href="/style/Godot"'), "Godot hub entry");
const card = hub.match(/<a\b[^>]*href="\/style\/Godot"[^>]*>([\s\S]*?)<\/a>/);
assert(card && !card[1].includes("style-status") && !card[1].includes("<p"), "released Godot hub entry should be title-only");

const catalog = JSON.parse(await read("/style/catalog.json", /application\/json/));
const entry = catalog.guides.find(item => item.id === "godot");
assert(entry, "Godot catalog guide entry");
for (const key of ["version", "status", "updated", "accepted_through"]) {
  assert.equal(entry[key], guide[key], `Godot catalog ${key}`);
}

const agentCatalog = JSON.parse(await read("/agent/catalog.json", /application\/json/));
const agentEntry = agentCatalog.resources.find(item => item.id === "style-godot");
assert.equal(agentEntry?.markdown, `https://starter.devthomas.site${expected.route}.md`, "Godot agent catalog");

assert((await read("/llms.txt", /text\/plain/)).includes(`${expected.route}.md`), "Godot agent discovery");

console.log(JSON.stringify({
  surface: live ? live.href : "built dist",
  status: "passed",
  guideVersion: guide.version,
  acceptedThrough: guide.accepted_through,
  engineVersion: "4.7.2",
  rules: ids.length,
  markdownSha256: createHash("sha256").update(raw).digest("hex"),
  checked: ["human", "hub", "markdown", "json", "catalog", "agent-catalog", "llms"],
}));
