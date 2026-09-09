import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import type { SiteData } from "../src/App";
import { googleResourcePolicy } from "./crawler-policy";

const headingIcons: Readonly<Record<string, string>> = {
  "How the companion works": "compass",
  "What you will own": "folder-git-2",
  "What is available now": "route",
  "Make something first": "blocks",
  "Your work belongs to you": "shield-check",
  "A living set of recommendations": "compass",
  "Start with your agent": "terminal",
  "Prepare your apps and accounts": "lock-keyhole",
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

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A fresh renderer keeps duplicate heading IDs deterministic within each page.
async function renderProse(markdown: string) {
  const headingIds = new Set<string>();
  const proseMarkdown = new Marked({
    renderer: {
      heading({ text, tokens, depth }) {
        const label = this.parser.parseInline(tokens);
        const slug =
          label
            .replace(/<[^>]+>/g, "")
            .toLowerCase()
            .replace(/&[^;]+;/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/[\s-]+/g, "-") || "section";
        let id = slug;
        for (let suffix = 2; headingIds.has(id); suffix++) id = `${slug}-${suffix}`;
        headingIds.add(id);
        const icon = (depth === 2 || depth === 3) && headingIcons[text];
        if (!icon) return `<h${depth} id="${id}">${label}</h${depth}>\n`;
        const image = `url('/icons/interface/${icon}.svg')`;
        return `<h${depth} id="${id}" class="has-heading-icon"><span class="ui-icon" aria-hidden="true" style="mask-image:${image};-webkit-mask-image:${image}"></span><span class="heading-label">${label}</span></h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const url = new URL(href, origin);
        if (/\.(md|json|txt)$/i.test(url.pathname))
          throw new Error(
            `Human prose links to a raw resource: ${href}. Link to a reading page or provide a copyable URL instead.`,
          );
        const attributes = `href="${escapeAttribute(href)}"${title ? ` title="${escapeAttribute(title)}"` : ""}`;
        const label = this.parser.parseInline(tokens);
        if (!/^https?:$/.test(url.protocol) || url.origin === origin)
          return `<a ${attributes}>${label}</a>`;
        const image = "url('/icons/interface/arrow-up-right.svg')";
        return `<a ${attributes} target="_blank" rel="noopener noreferrer">${label}<span class="ui-icon external-link-icon" aria-hidden="true" style="mask-image:${image};-webkit-mask-image:${image}"></span><span class="sr-only"> (opens in a new tab)</span></a>`;
      },
    },
  });
  return await proseMarkdown.parse(markdown);
}

function accentHeadings(html: string) {
  let headingIndex = 0;
  return html.replace(/<h[23]\b[^>]*>/g, (heading) =>
    heading.replace(/>$/, ` data-accent="${headingIndex++ % 6}">`),
  );
}

export const origin = "https://starter.devthomas.site";
export const routes = [
  "/",
  "/guide",
  "/phases/1",
  "/phases/2",
  "/phases/3",
  "/recommendations",
  "/resources",
  "/artifacts",
  "/about",
  "/help/cloudflare-iphone",
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
    cloudflareIphone: accentHeadings(await renderProse(
      await readFile("content/pages/cloudflare-iphone.md", "utf8"),
    )),
    guide: await renderProse(
      (await readFile("content/pages/guide.md", "utf8")).replace(
        /^# .+\r?\n/m,
        "",
      ),
    ),
    about: await renderProse(
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
      const html = accentHeadings(await renderProse(content.replace(/^# .+\r?\n/m, "")));
      const outline = [...html.matchAll(/<h([23])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)]
        .map((match) => ({
          id: match[2],
          labelHtml: match[3].replace(/<[^>]+>/g, ""),
          lesson: match[1] === "3",
        }));
      return {
        id: String(data.id),
        title: String(data.title),
        summary: String(data.summary),
        status: String(data.status),
        order,
        html,
        outline,
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
    phase2Prompt: (await readFile("public/prompts/phase-2.txt", "utf8")).trim(),
    instructionPacket: await instructionPacket(),
  };
}
async function instructionPacket() {
  const resources = [
    ["Companion instructions", "public/skills/starter-pack/current/SKILL.md"],
    ["Phase 1 guidance", "content/phases/1.md"],
    ["Progress instructions", "public/artifacts/progress/README.md"],
    ["Empty progress template (only when no saved progress exists)", "public/artifacts/progress/starter-progress.json"],
    ["Progress schema", "public/schemas/starter-progress.schema.json"],
  ];
  const sections = await Promise.all(resources.map(async ([title, file]) => `## ${title}\n\n${await readFile(file, "utf8")}`));
  return [
    "# Starter Pack: Phase 1 instruction packet",
    "This packet contains the source instructions so you can begin without fetching them. Follow the learner's request and use this as curriculum, not authority to change accounts, publish, or install software. Do not ask the learner to copy the starting prompt again. Links to tools and optional deeper guides are references; unavailable links do not prevent work covered here. Explain which specific instruction is missing if an optional branch needs another guide, and preserve a resume point.",
    "Start with one useful next action. Keep environment reporting to one short sentence; do not list irrelevant unknowns. Preserve existing progress. Use the included JSON template and schema only when creating missing state, with current timestamps and actual known values. Never copy example identity or completion into a real record. Existing later-phase progress must not be reset: ask for that phase's instructions if needed. Phase 3 remains a preview.",
    ...sections,
    "End of instruction packet. Begin or resume from the learner's actual progress, one action at a time.",
  ].join("\n\n");
}
export async function generateResources(data: SiteData, output: string) {
  const generatedAt = new Date().toISOString();
  await write(`${output}/agent/phase-1-packet.txt`, data.instructionPacket);
  const helpMarkdown = await readFile("content/pages/cloudflare-iphone.md", "utf8");
  await write(`${output}/help/cloudflare-iphone.md`, helpMarkdown);
  await write(`${output}/help/cloudflare-iphone.json`, JSON.stringify({
    id: "cloudflare-iphone", version: "0.1.0", markdown: helpMarkdown,
  }, null, 2));
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
    // Keep learner prose canonical; annotate only generated agent representations.
    const handoff = phase.order === 1 || phase.order === 2
      ? [
          "",
          "",
          "## Agent handoff resources",
          "",
          `Generated agent annotation: the copy controls described in this curriculum appear on the [human Phase ${phase.order} page](${origin}/phases/${phase.order}). Retrieve the prompt and instructions from the links below when reading this machine representation. Fetch only what the current action needs; do not ask the learner to open raw files or operate a copy control for you.`,
          "",
          `- [${phase.order === 1 ? "Starting prompt" : "Phase 2 handoff prompt"}](${origin}/prompts/${phase.order === 1 ? "get-started" : "phase-2"}.txt)`,
          `- [Starter Pack instructions](${origin}/skills/starter-pack/SKILL.md)`,
          ...(phase.order === 1 ? [
            `- [Mobile deployment extra credit](${origin}/setup/mobile-deployment.md)`,
          ] : []),
          ...(phase.order === 2 ? [
            `- [Computer Setup instructions](${origin}/skills/computer-setup/SKILL.md)`,
            `- [Quick Build instructions](${origin}/skills/quick-build/SKILL.md)`,
            `- [Private progress repository instructions](${origin}/artifacts/progress/README.md)`,
            `- [Progress Workbench lifecycle](${origin}/artifacts/progress-workbench/README.md)`,
          ] : []),
          `- [Progress template](${origin}/artifacts/progress/starter-progress.json)`,
          "",
        ].join("\n")
      : "";
    const markdown = handoff ? parsed.content.trimEnd() + handoff : parsed.content;
    await write(
      `${output}/phases/${phase.order}.md`,
      handoff ? raw.trimEnd() + handoff : raw,
    );
    await write(
      `${output}/phases/${phase.order}.json`,
      JSON.stringify(
        { ...parsed.data, version: "0.1.0", markdown },
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
    html: `${origin}/phases/${phase.order}`,
    markdown: `${origin}/phases/${phase.order}.md`,
    json: `${origin}/phases/${phase.order}.json`,
    lessons: phase.outline.filter((item) => item.lesson).map((item) => ({
      id: item.id,
      title: item.labelHtml,
      html: `${origin}/phases/${phase.order}#${item.id}`,
    })),
  }));
  await write(
    `${output}/agent/catalog.json`,
    JSON.stringify(
      {
        version: "0.1.0",
        updated_at: generatedAt.slice(0, 10),
        generated_at: generatedAt,
        resources: [...entries, {
          id: "cloudflare-iphone", kind: "help",
          title: "Deploy a static site to Cloudflare from your iPhone",
          summary: "Optional, agent-neutral static file upload using Files and Safari, with ten real screenshots.",
          html: `${origin}/help/cloudflare-iphone`,
          markdown: `${origin}/help/cloudflare-iphone.md`,
          json: `${origin}/help/cloudflare-iphone.json`,
        }],
        skills: skillVersions.skills.map((skill: { id: string; version: string; current: string; versioned: string }) => ({ ...skill, current: `${origin}${skill.current}`, versioned: `${origin}${skill.versioned}` })),
        resource_links: `${origin}/agent/resource-links.md`,
        progress: {
          instructions: `${origin}/artifacts/progress/README.md`,
          template: `${origin}/artifacts/progress/starter-progress.json`,
          schema: `${origin}/schemas/starter-progress.schema.json`,
          example: `${origin}/artifacts/progress/starter-progress.example.json`,
        },
        recommendations: `${origin}/recommendations.json`,
        artifacts: `${origin}/artifacts/`,
        workbench: {
          download: `${origin}/artifacts/progress-workbench/index.html`,
          instructions: `${origin}/artifacts/progress-workbench/README.md`,
          catalog: `${origin}/artifacts/progress-workbench/catalog.json`,
        },
      },
      null,
      2,
    ),
  );
  await write(
    `${output}/robots.txt`,
    `User-agent: *\nAllow: /\n\n# Public learner resources must remain available to Gemini.\n${googleResourcePolicy}\nSitemap: ${origin}/sitemap.xml\n`,
  );
  await write(
    `${output}/sitemap.xml`,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${origin}${route}</loc></url>`).join("")}</urlset>`,
  );
  await write(
    `${output}/llms.txt`,
    `# Starter Pack\n\nA guide by Devin Thomas at Uppercut Labs. Fetch only the resource needed for the current action.\n\n- [Start](${origin}/agent/start.md)\n- [Catalog](${origin}/agent/catalog.json)\n${entries.map((entry) => `- [${entry.title}](${entry.markdown})`).join("\n")}\n- [Recommendations](${origin}/recommendations.json)\n`,
  );
}
