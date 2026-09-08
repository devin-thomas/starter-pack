import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import type { SiteData } from "../src/App";

const headingIcons: Readonly<Record<string, string>> = {
  "How the companion works": "compass",
  "What you will own": "folder-git-2",
  "What is available now": "route",
  "Make something first": "blocks",
  "Your work belongs to you": "shield-check",
  "A living set of recommendations": "compass",
  "Start with your agent": "terminal",
  "Prepare your core accounts": "lock-keyhole",
  "Make one app that does something": "blocks",
  "Choose what happens to this first build": "route",
  "Save your place": "file-json",
  "Bring your progress with you": "folder-git-2",
  "Complete Computer Setup": "monitor",
  "Connect from your phone once": "smartphone",
  "Have a short design conversation": "list-checks",
  "Build and put it online": "rocket",
  "Finish with something you can return to": "check",
  "Choose the idea you want to grow": "sprout",
  "Make decisions visible": "file-text",
  "Add complexity for a reason": "settings-2",
};

// Add visual cues only to rendered prose; downloadable source stays canonical.
const proseMarkdown = new Marked({
  renderer: {
    heading({ text, tokens, depth }) {
      const icon = headingIcons[text];
      if (!icon || (depth !== 2 && depth !== 3)) return false;
      const image = `url('/icons/interface/${icon}.svg')`;
      return `<h${depth} class="has-heading-icon"><span class="ui-icon" aria-hidden="true" style="mask-image:${image};-webkit-mask-image:${image}"></span><span class="heading-label">${this.parser.parseInline(tokens)}</span></h${depth}>\n`;
    },
  },
});

export const origin = "https://starter.devthomas.site";
export const routes = [
  "/",
  "/guide",
  "/phases/1",
  "/phases/2",
  "/phases/3",
  "/recommendations",
  "/resources",
  "/about",
];
export async function write(destination: string, value: string) {
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, value);
}
export async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
  ).flat();
}
export async function loadContent(): Promise<SiteData> {
  const pages = {
    guide: await proseMarkdown.parse(
      (await readFile("content/pages/guide.md", "utf8")).replace(
        /^# .+\r?\n/m,
        "",
      ),
    ),
    about: await proseMarkdown.parse(
      (await readFile("content/pages/about.md", "utf8")).replace(
        /^# .+\r?\n/m,
        "",
      ),
    ),
  };
  const phases = await Promise.all(
    [1, 2, 3].map(async (order) => {
      const raw = await readFile(`content/phases/${order}.md`, "utf8");
      const { data, content } = matter(raw);
      for (const field of ["id", "title", "summary", "status"]) {
        if (typeof data[field] !== "string" || !data[field].trim())
          throw new Error(`Phase ${order}: missing ${field}`);
      }
      if (data.order !== order || data.id !== `phase-${order}` || !data.updated)
        throw new Error(`Invalid phase ${order} metadata`);
      return {
        id: String(data.id),
        title: String(data.title),
        summary: String(data.summary),
        status: String(data.status),
        order,
        html: await proseMarkdown.parse(content.replace(/^# .+\r?\n/m, "")),
      };
    }),
  );
  const recommendations: SiteData["recommendations"] = JSON.parse(
    await readFile("content/recommendations.json", "utf8"),
  );
  const seen = new Set<string>();
  for (const recommendation of recommendations) {
    for (const field of [
      "id",
      "name",
      "category",
      "requirement",
      "status",
      "recommended_by",
      "checked_at",
      "reason",
      "url",
    ] as const) {
      if (
        typeof recommendation[field] !== "string" ||
        !recommendation[field].trim()
      )
        throw new Error(`Recommendation missing ${field}`);
    }
    if (seen.has(recommendation.id))
      throw new Error(`Duplicate recommendation ${recommendation.id}`);
    seen.add(recommendation.id);
    if (new URL(recommendation.url).protocol !== "https:")
      throw new Error(`Recommendation URL must be HTTPS: ${recommendation.id}`);
    const checked = Date.parse(recommendation.checked_at);
    if (
      !Number.isFinite(checked) ||
      Date.now() - checked > 1000 * 60 * 60 * 24 * 180
    )
      throw new Error(`Refresh recommendation ${recommendation.id}`);
  }
  return {
    phases,
    pages,
    recommendations,
    prompt: (await readFile("public/prompts/get-started.txt", "utf8")).trim(),
  };
}
export async function generateResources(data: SiteData, output: string) {
  for (const page of ["guide", "about"]) {
    const markdown = await readFile(`content/pages/${page}.md`, "utf8");
    await write(`${output}/${page}.md`, markdown);
    await write(
      `${output}/${page}.json`,
      JSON.stringify({ id: page, version: "0.1.0", markdown }, null, 2),
    );
  }
  const skillVersions = JSON.parse(
    await readFile("public/skills/versions.json", "utf8"),
  );
  for (const id of ["starter-pack", "computer-setup", "quick-build"]) {
    await write(
      `${output}/skills/${id}/SKILL.md`,
      await readFile(`public/skills/${id}/current/SKILL.md`, "utf8"),
    );
  }
  for (const phase of data.phases) {
    const raw = await readFile(`content/phases/${phase.order}.md`, "utf8");
    const parsed = matter(raw);
    await write(`${output}/phases/${phase.order}.md`, raw);
    await write(
      `${output}/phases/${phase.order}.json`,
      JSON.stringify(
        { ...parsed.data, version: "0.1.0", markdown: parsed.content },
        null,
        2,
      ),
    );
  }
  await write(
    `${output}/recommendations.json`,
    JSON.stringify(data.recommendations, null, 2),
  );
  const entries = data.phases.map((phase) => ({
    id: phase.id,
    kind: "phase",
    title: phase.title,
    summary: phase.summary,
    html: `/phases/${phase.order}`,
    markdown: `/phases/${phase.order}.md`,
    json: `/phases/${phase.order}.json`,
  }));
  await write(
    `${output}/agent/catalog.json`,
    JSON.stringify(
      {
        version: "0.1.0",
        updated_at: "2026-09-08",
        resources: entries,
        skills: skillVersions.skills,
        recommendations: "/recommendations.json",
        artifacts: "/artifacts/",
      },
      null,
      2,
    ),
  );
  await write(
    `${output}/robots.txt`,
    `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
  );
  await write(
    `${output}/sitemap.xml`,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${origin}${route}</loc></url>`).join("")}</urlset>`,
  );
  await write(
    `${output}/llms.txt`,
    `# Starter Pack\n\nA guide by Devin Thomas at Uppercut Labs. Fetch only the resource needed for the current action.\n\n- [Start](${origin}/agent/start.md)\n- [Catalog](${origin}/agent/catalog.json)\n${entries.map((entry) => `- [${entry.title}](${origin}${entry.markdown})`).join("\n")}\n- [Recommendations](${origin}/recommendations.json)\n`,
  );
}
