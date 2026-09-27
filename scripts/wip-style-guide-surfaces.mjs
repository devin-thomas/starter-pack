import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import matter from "gray-matter";

const specs = [
  {
    "id": "react-typescript",
    "route": "/style/React-TypeScript",
    "prefix": "RX",
    "rules": 33,
    "headings": 35,
    "pending": [],
    "accepted": "RX006",
    "version": "0.9.0-review.2"
  },
  {
    "id": "python",
    "route": "/style/Python",
    "prefix": "PY",
    "rules": 35,
    "headings": 37,
    "pending": [
      "PY-Q01",
      "PY-Q02",
      "PY-Q03"
    ],
    "accepted": "draft",
    "version": "0.9.0-review.1"
  },
  {
    "id": "swift-swiftui",
    "route": "/style/Swift-SwiftUI",
    "prefix": "SW",
    "rules": 35,
    "headings": 37,
    "pending": [
      "SW-Q01",
      "SW-Q02"
    ],
    "accepted": "draft",
    "version": "0.9.0-review.1"
  },
  {
    "id": "javascript",
    "route": "/style/JavaScript",
    "prefix": "JS",
    "rules": 28,
    "headings": 30,
    "pending": [
      "JS-Q01",
      "JS-Q02"
    ],
    "accepted": "draft",
    "version": "0.9.0-review.1"
  },
  {
    "id": "dart-flutter",
    "route": "/style/Dart-Flutter",
    "prefix": "DF",
    "rules": 35,
    "headings": 37,
    "pending": [
      "DF-Q01",
      "DF-Q02"
    ],
    "accepted": "draft",
    "version": "0.9.0-review.1"
  }
];
const liveAt = process.argv.indexOf("--live");
const live = liveAt >= 0 ? new URL(process.argv[liveAt + 1]) : null;
if (live && (live.protocol !== "https:" || live.hostname !== "starter.devthomas.site")) throw new Error("Live checks require the canonical HTTPS host");
async function read(route, contentType) {
  if (live) {
    const response = await fetch(new URL(route, live), { signal: AbortSignal.timeout(15_000), cache: "no-store" });
    assert.equal(response.status, 200, route + ": HTTP " + response.status);
    assert(contentType.test(response.headers.get("content-type") || ""), route + ": wrong MIME type");
    return response.text();
  }
  const file = route === "/style" ? "dist/style.html" : specs.some((spec) => spec.route === route) ? "dist" + route + ".html" : "dist" + route;
  return readFile(file, "utf8");
}
const catalog = JSON.parse(await read("/style/catalog.json", /application\/json/));
const agentCatalog = JSON.parse(await read("/agent/catalog.json", /application\/json/));
const llms = await read("/llms.txt", /text\/plain/);
const sitemap = await read("/sitemap.xml", /(?:application|text)\/xml/);
const hub = (await read("/style", /text\/html/)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const results = [];
for (const spec of specs) {
  const parsed = matter(await readFile("content/style/" + spec.id + ".md", "utf8"));
  const data = parsed.data, markdown = parsed.content.trimStart();
  assert.equal(data.status, "in-progress", spec.id + ": status");
  assert.equal(data.version, spec.version, spec.id + ": version");
  assert.equal(data.accepted_through, spec.accepted, spec.id + ": accepted_through");
  assert.equal(data.route, spec.route, spec.id + ": route");
  const ids = [...markdown.matchAll(new RegExp("^## (" + spec.prefix + "\\d{3}) — ", "gm"))].map((m) => m[1]);
  assert.equal(ids.length, spec.rules, spec.id + ": rule count");
  assert.equal(new Set(ids).size, spec.rules, spec.id + ": duplicate rule IDs");
  assert.equal([...markdown.matchAll(/^## /gm)].length, spec.headings, spec.id + ": heading count");
  if (spec.id === "react-typescript") {
    assert(markdown.includes("Accepted RX-Q01 A"), "React accepted decision marker");
    assert(!markdown.includes("Pending RX-Q01"), "React decision remains pending");
  } else for (const decision of spec.pending) assert(markdown.includes("Pending " + decision), spec.id + ": missing " + decision);
  assert(!markdown.includes("style-guide-development/blob"), spec.id + ": private planning URL leaked");
  const json = JSON.parse(await read(spec.route + ".json", /application\/json/));
  assert.equal(json.markdown, markdown, spec.id + ": JSON/source parity");
  const raw = await read(spec.route + ".md", /text\/plain/);
  assert.equal(raw, markdown, spec.id + ": Markdown/source parity");
  const html = await read(spec.route, /text\/html/);
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  assert(visible.includes("Copy for agent") && visible.includes("style-guide-prose"), spec.id + ": human page");
  assert(visible.includes('class="style-status"') && visible.includes("In progress"), spec.id + ": in-progress badge");
  assert(!new RegExp("<h2[^>]*>[^<]*" + spec.prefix + "\\d{3}\\s*[—-]").test(visible), spec.id + ": internal IDs leaked");
  const href = 'href="' + spec.route + '"', at = hub.indexOf(href);
  assert(at >= 0, spec.id + ": hub link");
  const card = hub.slice(hub.lastIndexOf("<a", at), hub.indexOf("</a>", at) + 4);
  assert(card.includes("style-status") && !card.includes("<p"), spec.id + ": hub card");
  const entry = catalog.guides.find((item) => item.id === spec.id);
  assert(entry && entry.status === "in-progress", spec.id + ": catalog status");
  assert.equal(entry.markdown, "https://starter.devthomas.site" + spec.route + ".md", spec.id + ": catalog markdown");
  assert.equal(agentCatalog.resources.find((item) => item.id === "style-" + spec.id)?.markdown, entry.markdown, spec.id + ": agent catalog");
  assert(llms.includes(spec.route + ".md"), spec.id + ": llms");
  assert(sitemap.includes("https://starter.devthomas.site" + spec.route), spec.id + ": sitemap");
  results.push({ id: spec.id, rules: ids.length, markdownSha256: createHash("sha256").update(raw).digest("hex") });
}
console.log(JSON.stringify({ surface: live ? live.href : "built dist", status: "passed", guides: results }));
