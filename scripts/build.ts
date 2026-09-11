import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { build } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import App from "../src/App";
import { buildWorkbench } from "./workbench";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  files,
  generateResources,
  loadContent,
  origin,
  routes,
  write,
} from "./content";

const data = await loadContent();
await build();
await generateResources(data, "dist");
await buildWorkbench("dist", data);
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
for (const [schemaName, instancePaths] of [
  ["agent-catalog", ["dist/agent/catalog.json"]],
  [
    "starter-progress",
    [
      "dist/artifacts/progress/starter-progress.json",
      "dist/artifacts/progress/starter-progress.example.json",
      "dist/artifacts/progress/starter-progress.completed-phase-1.example.json",
    ],
  ],
  ["requirements", ["dist/agent/requirements.json"]],
  ["recommendation", ["dist/recommendations.json"]],
] as const) {
  const validate = ajv.compile(
    JSON.parse(
      await readFile(`public/schemas/${schemaName}.schema.json`, "utf8"),
    ),
  );
  for (const instancePath of instancePaths) {
    const instance = JSON.parse(await readFile(instancePath, "utf8"));
    for (const record of Array.isArray(instance) ? instance : [instance]) {
      if (!validate(record))
        throw new Error(`${instancePath}: ${ajv.errorsText(validate.errors)}`);
    }
  }
}
const template = await readFile("dist/index.html", "utf8");
const titles: Record<string, string> = {
  "/": "Starter Pack",
  "/guide": "Browse the guide",
  "/recommendations": "Recommendations",
  "/resources": "Skills and agent resources",
  "/artifacts": "Project templates",
  "/about": "About this pack",
  "/help/cloudflare-iphone": "Deploy a static site to Cloudflare from your iPhone",
};
const analyticsConfig = JSON.parse(await readFile("analytics.json", "utf8"));
const analyticsToken =
  process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN || analyticsConfig.beaconId;
if (analyticsToken && !/^[a-f0-9]{32}$/i.test(analyticsToken))
  throw new Error("Invalid Cloudflare Web Analytics token");
for (const route of routes) {
  const phase = data.phases.find((item) => route === `/phases/${item.order}`);
  const title = phase?.title || titles[route];
  const html = template
    .replace(
      "<!--app-html-->",
      renderToString(createElement(App, { path: route, data })),
    )
    .replace(
      "<!--app-data-->",
      `<script id="site-data" type="application/json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`,
    )
    .replace(
      "<title>Starter Pack | Uppercut Labs</title>",
      `<title>${title} | Uppercut Labs</title>`,
    )
    .replace(
      "</head>",
      `<link rel="canonical" href="${origin}${route}" /><meta name="description" content="Make your first working app, then build and deploy something meaningful with your own agent." /></head>`,
    )
    .replace(
      "</body>",
      `${analyticsToken ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${analyticsToken}"}'></script>` : ""}</body>`,
    );
  await write(route === "/" ? "dist/index.html" : `dist${route}.html`, html);
}
await write(
  "dist/404.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | Starter Pack</title><body style="background:#111419;color:#f3f6fa;font-family:sans-serif;padding:3rem"><h1>Page not found</h1><p>This resource is not available.</p><a style="color:#7eb1f5" href="/">Return to Starter Pack</a></body></html>',
);
await write(
  "dist/_headers",
  "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/*.md\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: no-transform\n\n/artifacts/progress-workbench/index.html\n  Content-Disposition: attachment; filename=\"index.html\"\n  Content-Type: application/octet-stream\n  Cache-Control: no-transform\n\n/artifacts/progress-workbench/\n  Content-Disposition: attachment; filename=\"index.html\"\n  Content-Type: application/octet-stream\n  Cache-Control: no-transform\n\n/artifacts/progress-workbench\n  Content-Disposition: attachment; filename=\"index.html\"\n  Content-Type: application/octet-stream\n  Cache-Control: no-transform\n\n/artifacts/progress-workbench/catalog.json\n  Access-Control-Allow-Origin: *\n",
);

// Resolve local resources and enforce the human-facing link contract before publishing.
const outputFiles = await files("dist");
async function exists(candidate: string) {
  try {
    return (await stat(candidate)).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
function decodeHtml(value: string) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named: Record<string, string> = {
      "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">",
    };
    if (entity[1] !== "#") return named[entity.toLowerCase()];
    return String.fromCodePoint(
      entity[2].toLowerCase() === "x"
        ? parseInt(entity.slice(3, -1), 16)
        : parseInt(entity.slice(2, -1), 10),
    );
  });
}
function attributes(tag: string) {
  const result = new Map<string, string>();
  for (const match of tag.matchAll(
    /([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
  ))
    result.set(
      match[1].toLowerCase(),
      decodeHtml(match[2] ?? match[3] ?? match[4] ?? ""),
    );
  return result;
}
function hostedUrls(text: string) {
  return [
    ...decodeHtml(text).matchAll(/https:\/\/starter\.devthomas\.site\/[^\s<>"'`]+/g),
  ].map((match) => match[0].replace(/[.,;:!?)\]]+$/, ""));
}
const htmlIds = new Map<string, Set<string>>();
async function destinationIds(file: string) {
  let ids = htmlIds.get(file);
  if (!ids) {
    const html = await readFile(file, "utf8");
    ids = new Set(
      [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => decodeHtml(match[1])),
    );
    if (ids.size !== [...html.matchAll(/\bid="([^"]+)"/g)].length)
      throw new Error(`Duplicate HTML IDs in ${file}`);
    htmlIds.set(file, ids);
  }
  return ids;
}
const broken = new Set<string>();
const invalidLinks = new Set<string>();
for (const file of outputFiles.filter(
  (file) => /\.(html|md|json|txt)$/.test(file) && !file.includes(".vite"),
)) {
  const raw = await readFile(file, "utf8");
  const text = file.endsWith(".html")
    ? raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    : raw;
  const basePath =
    "/" + path.relative("dist", file)
      .replace(/\\/g, "/")
      .replace(/(?:^|\/)index\.html$/, "/")
      .replace(/\.html$/, "");
  const baseUrl = origin + basePath.replace(/^\/\//, "/");
  if (file.endsWith(".html")) {
    const ids = await destinationIds(file);
    for (const element of text.matchAll(/<[a-z][^>]*\baria-labelledby="([^"]+)"[^>]*>/gi)) {
      for (const id of decodeHtml(element[1]).split(/\s+/)) {
        if (!ids.has(id))
          throw new Error(`${file}: missing accessible label target ${id}`);
      }
    }
    for (const anchor of text.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const attrs = attributes(anchor[1]);
      const href = attrs.get("href");
      if (!href) continue;
      const url = new URL(href, baseUrl);
      if (/\.(md|json|txt)$/i.test(url.pathname) && !attrs.has("download"))
        invalidLinks.add(
          `${file}: raw resource link ${href} must be a copyable URL or an explicit download`,
        );
      // Downloaded Workbench links leave the learner's local viewer, even for our guide.
      const downloadableWorkbench = path.resolve(file) === path.resolve("dist/artifacts/progress-workbench/index.html");
      const external = /^https?:$/.test(url.protocol) && (url.origin !== origin || (downloadableWorkbench && /^https?:/.test(href)));
      const opensNewTab = attrs.get("target")?.toLowerCase() === "_blank";
      if (external && !opensNewTab)
        invalidLinks.add(
          `${file}: external link ${href} must open in a new tab`,
        );
      if (!external && opensNewTab)
        invalidLinks.add(
          `${file}: internal link ${href} must stay in the same tab`,
        );
      if (opensNewTab) {
        const rel = new Set((attrs.get("rel") || "").toLowerCase().split(/\s+/));
        if (!rel.has("noopener") || !rel.has("noreferrer"))
          invalidLinks.add(
            `${file}: new-tab link ${href} needs rel="noopener noreferrer"`,
          );
        const accessibleLabel =
          attrs.get("aria-label") ?? decodeHtml(anchor[2].replace(/<[^>]+>/g, ""));
        if (!/opens in a new tab/i.test(accessibleLabel))
          invalidLinks.add(
            `${file}: new-tab link ${href} needs an accessible new-tab cue`,
          );
      }
    }
  }
  const references = file.endsWith(".html")
    ? [
        ...[...text.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]),
        ...[...text.matchAll(/<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi)]
          .filter((match) => attributes(match[1]).has("readonly"))
          .flatMap((match) => hostedUrls(match[2])),
      ]
    : file.endsWith(".json")
      ? [
          ...text.matchAll(
            /"((?:\/|https:\/\/starter\.devthomas\.site\/)[^"\\\s]*)\\?"/g,
          ),
        ].map((match) => match[1])
      : file.endsWith(".txt")
        ? hostedUrls(text)
        : [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(mailto:|data:|tel:)/.test(reference)) continue;
    const url = new URL(decodeHtml(reference), baseUrl);
    if (url.origin !== origin) continue;
    const pathname = decodeURIComponent(url.pathname);
    const candidate = path.resolve("dist", "." + pathname);
    if (
      !candidate.startsWith(path.resolve("dist") + path.sep) &&
      candidate !== path.resolve("dist")
    )
      throw new Error(`Invalid resource path ${reference}`);
    const matches = pathname.endsWith("/")
      ? [path.join(candidate, "index.html"), candidate + ".html"]
      : [candidate, candidate + ".html", path.join(candidate, "index.html")];
    const found = await Promise.all(matches.map(exists));
    const destination = matches[found.indexOf(true)];
    if (!destination) {
      broken.add(`${file}: ${reference}`);
    } else if (
      file.endsWith(".html") && url.hash && destination.endsWith(".html")
    ) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (!(await destinationIds(destination)).has(fragment))
        broken.add(`${file}: missing fragment ${reference}`);
    }
  }
}
if (invalidLinks.size)
  throw new Error(`Invalid human links:\n${[...invalidLinks].join("\n")}`);
if (broken.size)
  throw new Error(`Broken public links:\n${[...broken].join("\n")}`);
console.log(
  `Generated ${routes.length} HTML pages and ${outputFiles.length} public files; local links, fragments, and human link semantics passed.`,
);
console.log(
  `Web Analytics: ${analyticsToken ? "beacon included" : "not configured"}.`,
);
