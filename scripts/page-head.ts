import { spawnSync } from "node:child_process";
import type { SiteData } from "../src/site-data";
import siteOrigins from "../src/site-origin.json";

const pages: Record<string, [title: string, description: string, ...sources: string[]]> = {
  "/": ["Starter Pack", "Make your first working app, then build and deploy something meaningful with your own agent.", "public/prompts/get-started.txt"],
  "/guide": ["Browse the guide", "Follow the pack with your agent, or browse each phase at your own pace.", "content/pages/guide.md"],
  "/style": ["Style guides", "Coding conventions for Uppercut Labs projects and agent-directed work.", "content/style"],
  "/recommendations": ["Recommendations", "Browse the required tools, instant builders, and optional hosting choices in Starter Pack.", "content/recommendations.json"],
  "/resources": ["Skills and agent resources", "Find the companion instructions, phase guides, and setup resources for your current step.", "public/agent/resource-links.md"],
  "/artifacts": ["Project templates", "Get progress templates, project files, and the downloadable Progress Workbench.", "public/artifacts"],
  "/about": ["About this pack", "Why Devin Thomas put together Starter Pack and how it helps you build with an AI agent.", "content/pages/about.md"],
  "/contact": ["Feedback and project stories", "Share feedback, suggest a feature, or tell Uppercut Labs what you built.", "src/Feedback.tsx"],
  "/help/cloudflare-iphone": ["Deploy a static site to Cloudflare from your iPhone", "Put a static site online from your iPhone using Files, Safari, and Cloudflare.", "content/pages/cloudflare-iphone.md"],
  "/skills": ["Skills", "Find and install agent skills for planning, building, maintaining, and shipping software.", "content/skills/manifest.json", "content/packages.json"],
  "/skills/recommendations": ["Skill recommendations", "Browse third-party skills and resources that complement the Starter Pack collection.", "content/skills/recommendations.json"],
};

export function markdownPath(route: string) {
  return route === "/" ? "/index.md" : route + ".md";
}

function sourceDate(paths: string[]) {
  const result = spawnSync("git", ["log", "-1", "--format=%cs", "--", "src/App.tsx", ...paths], { encoding: "utf8" });
  // Exported source archives can be built without Git history.
  return result.status === 0 ? result.stdout.trim() || undefined : undefined;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function addPageHead(template: string, route: string, data: SiteData) {
  const phase = data.phases.find(item => route === `/phases/${item.order}`);
  const guide = data.styles.guides.find(item => route === item.route);
  const skill = data.skills.manifest.find(item => route === `/skills/${item.slug}`);
  const page = pages[route];
  const title = guide ? `${guide.title} Style Guide` : phase?.title ?? skill?.title ?? page?.[0];
  const description = guide?.humanSummary ?? phase?.summary ?? skill?.summary ?? page?.[1];
  if (!title || !description) throw new Error(`Missing page metadata for ${route}`);
  const updated = guide?.updated ?? phase?.updated ?? (skill && data.skills.lessons[skill.id]?.updated);
  const dateModified = updated ? new Date(updated).toISOString().slice(0, 10) : page && sourceDate(page.slice(2));
  const origin = siteOrigins.canonicalOrigin;
  const url = origin + route;
  const article = Boolean(phase || guide || skill || route === "/help/cloudflare-iphone");
  const entity = {
    "@context": "https://schema.org",
    "@type": article ? "TechArticle" : "WebPage",
    name: title,
    headline: title,
    description,
    url,
    dateModified,
  };
  const fullTitle = escapeHtml(`${title} | Uppercut Labs`);
  const content = escapeHtml(description);
  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" type="text/markdown" href="${origin}${markdownPath(route)}" />`,
    `<link rel="describedby" href="${origin}/llms.txt" />`,
    `<meta name="description" content="${content}" />`,
    `<meta property="og:title" content="${fullTitle}" />`,
    `<meta property="og:description" content="${content}" />`,
    `<meta property="og:type" content="${article ? "article" : "website"}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${origin}/uppercut-labs-logo.png" />`,
    `<script type="application/ld+json">${JSON.stringify(entity).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
  return template
    .replace("<title>Starter Pack | Uppercut Labs</title>", () => `<title>${fullTitle}</title>`)
    .replace("</head>", () => head + "\n</head>");
}
