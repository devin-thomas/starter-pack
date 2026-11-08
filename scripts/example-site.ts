import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";

// The Level 1 example site: one source, a publish filter and a public-field allowlist.
// Only pages marked `published` and only the tool fields named in `public_fields` are ever
// written. Drafts and internal fields stay in the source and never reach a built file.

export const exampleSiteSource = "content/examples/agent-ready-website";

export type ExampleSiteConfig = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly base: string;
  readonly lesson: string;
  readonly opening_hours: Readonly<Record<string, readonly [number, number]>>;
  readonly redirects: Readonly<Record<string, string>>;
  readonly withdrawn: readonly {
    readonly slug: string;
    readonly title: string;
    readonly withdrawn: string;
    readonly reason: string;
    readonly replacement: string;
  }[];
};

export type ExamplePage = {
  readonly slug: string;
  readonly title: string;
  readonly nav: string;
  readonly summary: string;
  readonly status: "published" | "draft";
  readonly updated: string;
  readonly order: number;
  readonly body: string;
};

type ToolRecord = Readonly<Record<string, unknown>>;

export type ExampleSite = {
  readonly config: ExampleSiteConfig;
  readonly published: readonly ExamplePage[];
  readonly drafts: readonly ExamplePage[];
  readonly publicFields: readonly string[];
  readonly tools: readonly ToolRecord[];
};

function dateText(value: unknown): string {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`Example site: invalid date ${text}`);
  return text;
}

export async function loadExampleSite(source = exampleSiteSource): Promise<ExampleSite> {
  const config: ExampleSiteConfig = JSON.parse(await readFile(path.join(source, "site.json"), "utf8"));
  if (!/^\/examples\/[a-z0-9-]+\/$/.test(config.base)) throw new Error("Example site base must be /examples/<slug>/");
  const pages: ExamplePage[] = [];
  for (const file of (await readdir(path.join(source, "pages"))).filter((name) => name.endsWith(".md")).sort()) {
    const { data, content } = matter(await readFile(path.join(source, "pages", file), "utf8"));
    const slug = file.replace(/\.md$/, "");
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Example site: invalid page name ${file}`);
    if (data.status !== "published" && data.status !== "draft")
      throw new Error(`Example site: ${file} must be published or draft`);
    for (const field of ["title", "nav", "summary"])
      if (typeof data[field] !== "string" || !data[field].trim()) throw new Error(`Example site: ${file} missing ${field}`);
    pages.push({
      slug,
      title: data.title,
      nav: data.nav,
      summary: data.summary,
      status: data.status,
      updated: dateText(data.updated),
      order: Number(data.order),
      body: content.trim(),
    });
  }
  const published = pages.filter((page) => page.status === "published").sort((a, b) => a.order - b.order);
  if (!published.some((page) => page.slug === "index")) throw new Error("Example site needs a published index page");
  const reserved = new Set([...Object.keys(config.redirects), ...config.withdrawn.map((page) => page.slug)]);
  for (const page of published)
    if (reserved.has(page.slug)) throw new Error(`Example site: ${page.slug} is both a page and a redirect or withdrawal`);
  for (const target of Object.values(config.redirects))
    if (!published.some((page) => page.slug === target)) throw new Error(`Example site: redirect target ${target} is not published`);
  const catalog = JSON.parse(await readFile(path.join(source, "tools.json"), "utf8"));
  return {
    config,
    published,
    drafts: pages.filter((page) => page.status === "draft"),
    publicFields: catalog.public_fields,
    tools: catalog.tools,
  };
}

/** Copies only the allowlisted fields, so a new internal field is private by default. */
export function publicTool(tool: ToolRecord, fields: readonly string[]): ToolRecord {
  return Object.fromEntries(fields.filter((field) => field in tool).map((field) => [field, tool[field]]));
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function longDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
}

const styles = `
:root{color-scheme:light dark;--bg:#fbfaf7;--fg:#1d1f22;--muted:#4f5560;--line:#d8d4cb;--accent:#8a4b0f;--note:#fff3d6}
@media (prefers-color-scheme:dark){:root{--bg:#16181b;--fg:#eceae6;--muted:#b4b8bf;--line:#3a3d42;--accent:#f0b27a;--note:#3a2f17}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:1.05rem/1.6 system-ui,sans-serif}
a{color:var(--accent)}a:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.skip{position:absolute;left:-999px}.skip:focus{left:1rem;top:1rem;background:var(--bg);padding:.5rem}
.example-note{margin:0;padding:.6rem 1rem;background:var(--note);border-bottom:1px solid var(--line);font-size:.92rem}
header,main,footer{max-width:44rem;margin:0 auto;padding:1rem}
header{border-bottom:1px solid var(--line)}.site-name{margin:0;font-weight:700;font-size:1.15rem}
nav ul{display:flex;flex-wrap:wrap;gap:.25rem 1rem;list-style:none;margin:.5rem 0 0;padding:0}
[aria-current=page]{font-weight:700;text-decoration:none}
h1{line-height:1.2;margin:.5rem 0}.updated{color:var(--muted);margin-top:0;font-size:.95rem}
.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.95rem}
th,td{text-align:left;padding:.4rem .5rem;border-bottom:1px solid var(--line)}
.badge[hidden]{display:none}.badge{display:inline-block;padding:.15rem .6rem;border:1px solid var(--line);border-radius:1rem;font-size:.9rem}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:.92rem;overflow-wrap:anywhere}
`.trim();

const openNowScript = `// Runs only in a browser. The opening hours on the page are the source of truth;
// clients that read HTML without running scripts never see this badge.
const badge = document.getElementById("open-now");
if (badge) {
  const hours = JSON.parse(badge.dataset.hours || "{}");
  const now = new Date();
  const today = hours[String(now.getDay())];
  const open = Array.isArray(today) && now.getHours() >= today[0] && now.getHours() < today[1];
  badge.textContent = open ? "Open now" : "Closed now";
  badge.hidden = false;
}
`;

function toolsTable(site: ExampleSite): { html: string; markdown: string } {
  const rows = site.tools.map((tool) => publicTool(tool, site.publicFields));
  const status = (tool: ToolRecord) => (tool.available ? "In" : "Out on loan");
  return {
    html: `<div class="table-wrap" role="region" aria-label="Tool catalog" tabindex="0"><table>\n<thead><tr><th scope="col">Tool</th><th scope="col">Category</th><th scope="col">Loan</th><th scope="col">Status</th></tr></thead>\n<tbody>\n${rows
      .map((tool) => `<tr><td>${escapeHtml(String(tool.name))}</td><td>${escapeHtml(String(tool.category))}</td><td>${tool.loan_days} days</td><td>${status(tool)}</td></tr>`)
      .join("\n")}\n</tbody>\n</table></div>`,
    markdown: `| Tool | Category | Loan | Status |\n| --- | --- | --- | --- |\n${rows
      .map((tool) => `| ${tool.name} | ${tool.category} | ${tool.loan_days} days | ${status(tool)} |`)
      .join("\n")}`,
  };
}

export type ExampleSiteFile = { readonly file: string; readonly contents: string };

/** Renders the public site. `origin` is the canonical origin; paths stay under the base. */
export async function renderExampleSite(site: ExampleSite, origin: string): Promise<ExampleSiteFile[]> {
  const { config } = site;
  const base = config.base;
  const absolute = (slug: string) => `${origin}${base}${slug === "index" ? "" : slug}`;
  const markdownUrl = (slug: string) => `${origin}${base}${slug}.md`;
  const table = toolsTable(site);
  const hoursJson = escapeHtml(JSON.stringify(config.opening_hours));
  const marked = new Marked();
  const files: ExampleSiteFile[] = [];
  const lastUpdated = site.published.map((page) => page.updated).sort().at(-1) as string;
  for (const page of site.published) {
    const htmlBody = page.body
      .replace("<!-- tools -->", table.html)
      .replace("<!-- open-now -->", `<p><span id="open-now" class="badge" data-hours="${hoursJson}" hidden></span></p>`);
    const markdownBody = page.body
      .replace("<!-- tools -->", table.markdown)
      .replace(/\n*<!-- open-now -->\n*/, "\n\n")
      .replace(/\]\(\//g, `](${origin}/`);
    const nav = site.published
      .map((item) => `<li><a href="${base}${item.slug === "index" ? "" : item.slug}"${item.slug === page.slug ? ' aria-current="page"' : ""}>${escapeHtml(item.nav)}</a></li>`)
      .join("");
    const entity = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.summary,
      url: absolute(page.slug),
      dateModified: page.updated,
      isPartOf: { "@type": "WebSite", name: config.name, url: absolute("index") },
    };
    const title = page.slug === "index" ? `${config.name} (example)` : `${page.title} | ${config.name} (example)`;
    files.push({
      file: `${page.slug}.html`,
      contents: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(page.summary)}">
<link rel="canonical" href="${absolute(page.slug)}">
<link rel="alternate" type="text/markdown" href="${markdownUrl(page.slug)}">
<link rel="alternate" type="application/json" href="${origin}${base}index.json">
<script type="application/ld+json">${JSON.stringify(entity).replace(/</g, "\\u003c")}</script>
<style>${styles}</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<aside class="example-note" aria-label="About this example">This is a fictional example site from the Starter Pack <a href="${config.lesson}">Level 1 lesson</a>. The library does not exist.</aside>
<header>
<p class="site-name"><a href="${base}">${escapeHtml(config.name)}</a></p>
<nav aria-label="Site"><ul>${nav}</ul></nav>
</header>
<main id="content">
<h1>${escapeHtml(page.title)}</h1>
<p class="updated">Updated <time datetime="${page.updated}">${longDate(page.updated)}</time></p>
${(await marked.parse(htmlBody)).trim()}
</main>
<footer>
<p>For agents and tools: <a href="${base}llms.txt">llms.txt</a> · <a href="${base}${page.slug}.md">this page as Markdown</a> · <a href="${base}index.json">site index (JSON)</a> · <a href="${base}sitemap.xml">sitemap</a></p>
</footer>
${page.body.includes("<!-- open-now -->") ? `<script src="${base}open-now.js" defer></script>\n` : ""}</body>
</html>
`,
    });
    files.push({
      file: `${page.slug}.md`,
      contents: `# ${page.title}\n\nCanonical: ${absolute(page.slug)}\nUpdated: ${page.updated}\n\n> Fictional example site from the Starter Pack Level 1 lesson (${origin}${config.lesson}). The library does not exist.\n\n${markdownBody.trim()}\n`,
    });
  }
  const toolsPage = site.published.find((page) => page.slug === "tools");
  files.push({
    file: "tools.json",
    contents: JSON.stringify(
      {
        name: `${config.name} tool catalog`,
        source: toolsPage ? absolute("tools") : absolute("index"),
        updated: toolsPage?.updated ?? lastUpdated,
        tools: site.tools.map((tool) => publicTool(tool, site.publicFields)),
      },
      null,
      2,
    ) + "\n",
  });
  files.push({
    file: "index.json",
    contents: JSON.stringify(
      {
        name: config.name,
        description: config.description,
        fictional: true,
        url: absolute("index"),
        updated: lastUpdated,
        lesson: `${origin}${config.lesson}`,
        pages: site.published.map((page) => ({
          title: page.title,
          summary: page.summary,
          url: absolute(page.slug),
          markdown: markdownUrl(page.slug),
          updated: page.updated,
        })),
        data: [{ title: "Tool catalog", url: `${origin}${base}tools.json` }],
        moved: Object.entries(config.redirects).map(([from, to]) => ({ from: `${origin}${base}${from}`, to: absolute(to) })),
        withdrawn: config.withdrawn.map((page) => ({
          url: `${origin}${base}${page.slug}`,
          title: page.title,
          withdrawn: page.withdrawn,
          reason: page.reason,
          replacement: absolute(page.replacement || "index"),
        })),
      },
      null,
      2,
    ) + "\n",
  });
  files.push({
    file: "llms.txt",
    contents: [
      `# ${config.name}`,
      `> ${config.description}`,
      "Every page listed here is public and current. Each page also has a Markdown copy at the same address followed by `.md`. Cite the page address, not this file.",
      "## Pages",
      site.published.map((page) => `- [${page.title}](${absolute(page.slug)}): ${page.summary} Markdown: ${markdownUrl(page.slug)}`).join("\n"),
      "## Data",
      [
        `- [Site index](${origin}${base}index.json): every public page with its last update, and pages that moved or were withdrawn`,
        `- [Tool catalog](${origin}${base}tools.json): the public fields of each tool`,
      ].join("\n"),
    ].join("\n\n") + "\n",
  });
  files.push({
    file: "sitemap.xml",
    contents: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${site.published
      .map((page) => `<url><loc>${absolute(page.slug)}</loc><lastmod>${page.updated}</lastmod></url>`)
      .join("\n")}\n</urlset>\n`,
  });
  files.push({ file: "open-now.js", contents: openNowScript });
  return files;
}

export async function generateExampleSite(output: string, origin: string): Promise<string[]> {
  const site = await loadExampleSite();
  const files = await renderExampleSite(site, origin);
  const directory = path.join(output, site.config.base);
  await mkdir(directory, { recursive: true });
  for (const { file, contents } of files) await writeFile(path.join(directory, file), contents);
  return files.map(({ file }) => site.config.base + file);
}
