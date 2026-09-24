import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import matter from "gray-matter";

const input = await readFile("content/style/typescript.md", "utf8");
const { data: expected, content } = matter(input);
const markdown = content.trimStart();
const liveAt = process.argv.indexOf("--live");
const live = liveAt >= 0 ? new URL(process.argv[liveAt + 1]) : null;
if (live && (live.protocol !== "https:" || live.hostname !== "starter.devthomas.site")) throw new Error("Live checks require the canonical HTTPS host");
async function read(route, contentType) {
  if (!live) return readFile(`dist${route === "/style" ? "/style.html" : route === expected.route ? `${route}.html` : route}`, "utf8");
  const response = await fetch(new URL(route,live), { signal:AbortSignal.timeout(15000),cache:"no-store" });
  assert.equal(response.status, 200, `${route}: HTTP ${response.status}`);
  assert(contentType.test(response.headers.get("content-type") || ""), `${route}: wrong MIME type`);
  return response.text();
}
const guide = JSON.parse(await read(`${expected.route}.json`, /application\/json/));
for (const [field, expectedValue] of Object.entries({id:expected.id,status:expected.status,version:expected.version,updated:expected.updated,accepted_through:expected.accepted_through,route:expected.route})) assert.equal(guide[field],expectedValue,`metadata ${field}`);
assert.equal(guide.markdown,markdown,"JSON/Markdown source parity");
const raw = await read(`${expected.route}.md`, /text\/plain/);
assert.equal(raw,markdown,"raw Markdown/source parity");
const html = await read(expected.route,/text\/html/);
const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<!--[\s\S]*?-->/g,"");
assert(visible.includes("Copy for agent") && visible.includes("style-guide-prose") && visible.includes("Why use TypeScript"),"human-first page contract");
assert(!/<h2[^>]*>[^<]*D\d{3}\s*[—-]/.test(visible),"internal IDs leaked into human headings");
assert(!visible.includes("Agent access"),"obsolete large agent panel");
assert(!visible.includes("style-guide-development"),"private planning link in public guide");
const hub = (await read("/style",/text\/html/)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"");
assert(hub.includes('href="/style/TypeScript"'),"hub entry");
if (expected.status === "stable") {
  assert(!visible.includes('class="style-status"'),"released guide still shows status badge");
  const card = hub.match(/<a\b[^>]*href="\/style\/TypeScript"[^>]*>([\s\S]*?)<\/a>/);
  assert(card && !card[1].includes("style-status") && !card[1].includes("<p"),"released hub entry should be title-only");
  assert(!markdown.includes("**In progress.**"),"release still has progress notice");
}
const catalog = JSON.parse(await read("/style/catalog.json",/application\/json/));
const entry = catalog.guides.find((item) => item.id === "typescript");
assert(entry,"catalog guide entry");
for (const key of ["version","status","updated","accepted_through"]) assert.equal(entry[key],guide[key],`catalog ${key}`);
assert.equal(catalog.status,catalog.guides.some((item) => item.status === "in-progress")?"in-progress":"stable","aggregate status");
const agentCatalog = JSON.parse(await read("/agent/catalog.json",/application\/json/));
const agentEntry = agentCatalog.resources.find((item) => item.id === "style-typescript");
assert.equal(agentEntry?.markdown,`https://starter.devthomas.site${expected.route}.md`);
assert((await read("/llms.txt",/text\/plain/)).includes(`${expected.route}.md`),"agent discovery");
console.log(JSON.stringify({surface:live?live.href:"built dist",status:"passed",guideVersion:guide.version,acceptedThrough:guide.accepted_through,markdownSha256:createHash("sha256").update(raw).digest("hex"),checked:["human","hub","markdown","json","catalog","agent-catalog","llms"]}));
