// Checks the Level 1 example site over real HTTP, the way an outside client sees it.
// Usage: tsx scripts/verify-example-site.ts <origin> [--local] [--canonical <origin>] [--preview]
// --local      loopback Worker (Miniflare); pages carry the public canonical origin.
// --preview    the noindex preview Worker, whose robots.txt deliberately disallows everything.
import siteOrigins from "../src/site-origin.json";
import { loadExampleSite, type ExampleSite } from "./example-site";

type Check = { readonly check: string; readonly result: string };

export function privateMarkers(site: ExampleSite): string[] {
  const markers = new Set<string>();
  for (const draft of site.drafts) {
    markers.add(draft.title);
    markers.add(draft.summary);
    for (const sentence of draft.body.split(/(?<=[.!?])\s+|\n+/)) {
      const text = sentence.replace(/[*_`#>]/g, "").trim();
      if (text.length >= 12) markers.add(text);
    }
    markers.add(`${site.config.base}${draft.slug}`);
  }
  for (const tool of site.tools) {
    for (const [field, value] of Object.entries(tool)) {
      if (site.publicFields.includes(field)) continue;
      markers.add(`"${field}"`);
      if (typeof value === "string" && value.length >= 6) markers.add(value);
    }
  }
  return [...markers];
}

export async function verifyExampleSite(
  base: URL,
  options: { canonical: string; preview: boolean; transport?: typeof fetch },
): Promise<Check[]> {
  const site = await loadExampleSite();
  const send = options.transport ?? fetch;
  const markers = privateMarkers(site);
  const checks: Check[] = [];
  const pass = (check: string, result: string) => checks.push({ check, result });
  const local = (url: string) => new URL(new URL(url).pathname + new URL(url).search, base);
  async function get(path: string, method = "GET") {
    const response = await send(new URL(path, base), { method, redirect: "manual", signal: AbortSignal.timeout(15_000) });
    const body = method === "HEAD" ? "" : await response.text();
    for (const marker of markers)
      if (body.includes(marker)) throw new Error(`${path}: nonpublic content is served (${marker.slice(0, 24)}...)`);
    return { status: response.status, type: response.headers.get("content-type") ?? "", location: response.headers.get("location"), body };
  }
  function expect(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
  }
  const root = site.config.base;
  const canonical = (slug: string) => `${options.canonical}${root}${slug}`;

  const index = await get(`${root}index.json`);
  expect(index.status === 200 && /application\/json/.test(index.type), `${root}index.json: ${index.status} ${index.type}`);
  const listing = JSON.parse(index.body);
  const pages: { url: string; markdown: string; updated: string }[] = listing.pages;
  expect(pages.length === site.published.length, "index.json lists exactly the published pages");
  expect(listing.updated === pages.map((page) => page.updated).sort().at(-1), "index.json updated is the newest page date");
  pass("index.json", `200 ${index.type}; ${pages.length} public pages; updated ${listing.updated}`);

  for (const page of pages) {
    expect(page.url.startsWith(options.canonical + root), `${page.url}: not on the canonical origin`);
    const html = await get(local(page.url).pathname);
    expect(html.status === 200 && /^text\/html/.test(html.type), `${page.url}: ${html.status} ${html.type}`);
    expect(html.body.includes(`<link rel="canonical" href="${page.url}">`), `${page.url}: canonical link is not self-referencing`);
    expect(html.body.includes(`<time datetime="${page.updated}">`), `${page.url}: visible date differs from index.json`);
    expect((html.body.match(/<h1>/g) ?? []).length === 1 && /<main id="content">/.test(html.body), `${page.url}: needs one h1 inside main`);
    const markdown = await get(local(page.markdown).pathname);
    expect(markdown.status === 200 && /^text\/(plain|markdown); charset=utf-8/.test(markdown.type), `${page.markdown}: ${markdown.status} ${markdown.type}`);
    expect(markdown.body.includes(`Canonical: ${page.url}\nUpdated: ${page.updated}`), `${page.markdown}: canonical or date differs`);
    pass(new URL(page.url).pathname, `200 ${html.type}; canonical self; updated ${page.updated}; Markdown 200 ${markdown.type}`);
  }

  const sitemap = await get(`${root}sitemap.xml`);
  expect(sitemap.status === 200 && /xml/.test(sitemap.type), `sitemap: ${sitemap.status} ${sitemap.type}`);
  const entries = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((match) => `${match[1]} ${match[2]}`);
  expect(JSON.stringify(entries.sort()) === JSON.stringify(pages.map((page) => `${page.url} ${page.updated}`).sort()), "sitemap differs from the public pages");
  pass("sitemap.xml", `200 ${sitemap.type}; ${entries.length} entries, lastmod equals each page date`);

  const llms = await get(`${root}llms.txt`);
  expect(llms.status === 200 && /^text\/plain/.test(llms.type), `llms.txt: ${llms.status} ${llms.type}`);
  const linked = [...llms.body.matchAll(/https?:\/\/[^\s)]+/g)].map((match) => match[0]);
  for (const url of linked) {
    const response = await get(local(url).pathname);
    expect(response.status === 200, `llms.txt links ${url}, which returns ${response.status}`);
  }
  for (const page of pages) expect(linked.includes(page.url), `llms.txt omits ${page.url}`);
  pass("llms.txt", `200 ${llms.type}; all ${linked.length} links return 200; every public page listed`);

  const tools = await get(`${root}tools.json`);
  const catalog = JSON.parse(tools.body);
  expect(tools.status === 200 && catalog.tools.every((tool: object) => Object.keys(tool).every((key) => site.publicFields.includes(key))), "tools.json has a nonpublic field");
  pass("tools.json", `200 ${tools.type}; only allowlisted fields (${site.publicFields.join(", ")}); updated ${catalog.updated}`);

  const bare = await get(root.slice(0, -1));
  expect(bare.status === 301 && new URL(bare.location ?? "", base).pathname === root, `${root.slice(0, -1)}: ${bare.status} ${bare.location}`);
  pass(root.slice(0, -1), `301 to ${root}`);
  for (const [from, to] of Object.entries(site.config.redirects)) {
    const moved = await get(root + from);
    expect(moved.status === 301 && new URL(moved.location ?? "", base).pathname === root + to, `${root + from}: ${moved.status} ${moved.location}`);
    pass(root + from, `301 to ${root + to}`);
  }
  const htmlForm = await get(`${root}borrowing.html`);
  expect(htmlForm.status === 301 && new URL(htmlForm.location ?? "", base).pathname === `${root}borrowing`, `.html form: ${htmlForm.status}`);
  pass(`${root}borrowing.html`, `301 to ${root}borrowing`);
  for (const page of site.config.withdrawn) {
    const gone = await get(root + page.slug);
    expect(gone.status === 410 && /^text\/html/.test(gone.type) && gone.body.includes(page.withdrawn), `${root + page.slug}: ${gone.status}`);
    expect(!sitemap.body.includes(root + page.slug) && !llms.body.includes(root + page.slug), `${page.slug} still listed`);
    pass(root + page.slug, `410 ${gone.type}; withdrawn ${page.withdrawn}; absent from sitemap and llms.txt`);
  }
  for (const draft of site.drafts) {
    const missing = await get(root + draft.slug);
    expect(missing.status === 404, `${root + draft.slug}: draft returned ${missing.status}`);
    pass(root + draft.slug, "404 (unpublished draft)");
  }

  const home = await get(root);
  expect(/Tuesday and Thursday: 4 PM to 8 PM/.test(home.body), "opening hours are not in the server HTML");
  expect(/<span id="open-now"[^>]*hidden><\/span>/.test(home.body) && !/(Open|Closed) now/.test(home.body), "the open-now badge is rendered on the server");
  const script = await get(`${root}open-now.js`);
  expect(script.status === 200 && /javascript/.test(script.type), `open-now.js: ${script.status} ${script.type}`);
  pass("dynamic rendering", "hours present in server HTML; open-now badge empty until a browser runs open-now.js");

  const robots = await get("/robots.txt");
  if (options.preview) {
    expect(/Disallow: \//.test(robots.body), "preview robots.txt should disallow everything");
    pass("/robots.txt", "preview override (Disallow: /, noindex); the built robots.txt is checked locally");
  } else {
    expect(robots.body.includes(`Sitemap: ${canonical("sitemap.xml")}`), "robots.txt does not declare the example sitemap");
    expect(!/Disallow: \/examples/.test(robots.body), "robots.txt blocks the example");
    pass("/robots.txt", "declares the example sitemap; does not block /examples/");
  }
  pass("nonpublic content", `${markers.length} markers from the draft and internal fields absent from every response above`);
  return checks;
}

const invoked = process.argv[1]?.endsWith("verify-example-site.ts");
if (invoked) {
  const base = new URL(process.argv[2] ?? siteOrigins.canonicalOrigin);
  const isLocal = process.argv.includes("--local");
  const flag = process.argv.indexOf("--canonical");
  const canonicalOrigin = flag > 0 ? process.argv[flag + 1] : isLocal ? siteOrigins.canonicalOrigin : base.origin;
  const checks = await verifyExampleSite(base, { canonical: canonicalOrigin, preview: process.argv.includes("--preview") });
  for (const { check, result } of checks) console.log(`PASS ${check}: ${result}`);
  console.log(`Example site verified over HTTP at ${base.origin} (${checks.length} checks).`);
}
