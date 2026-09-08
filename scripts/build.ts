import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { build } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import App from "../src/App";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { marked } from "marked";
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
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
for (const [schemaName, instancePaths] of [
  ["agent-catalog", ["dist/agent/catalog.json"]],
  [
    "starter-progress",
    [
      "dist/artifacts/progress/starter-progress.json",
      "dist/artifacts/progress/starter-progress.example.json",
    ],
  ],
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
  "/about": "About this pack",
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
  "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n",
);

// Resolve local links in the generated site and hosted Markdown before publishing.
const artifactHtml = await marked.parse(
  await readFile("public/artifacts/index.md", "utf8"),
);
await write(
  "dist/artifacts/index.html",
  template
    .replace(
      "<!--app-html-->",
      `<main style="max-width:800px;margin:40px auto;padding:20px">${artifactHtml}</main>`,
    )
    .replace("<!--app-data-->", "")
    .replace(/<script type="module"[^>]*><\/script>/g, ""),
);
const outputFiles = await files("dist");
async function exists(candidate: string) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
const broken = new Set<string>();
for (const file of outputFiles.filter(
  (file) => /\.(html|md|json)$/.test(file) && !file.includes(".vite"),
)) {
  const text = await readFile(file, "utf8");
  const references = file.endsWith(".html")
    ? [...text.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1])
    : file.endsWith(".json")
      ? [
          ...text.matchAll(
            /"((?:\/|https:\/\/starter\.devthomas\.site\/)[^"\s]*)"/g,
          ),
        ].map((match) => match[1])
      : [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(#|mailto:|data:)/.test(reference)) continue;
    const basePath =
      "/" +
      path
        .relative("dist", file)
        .replace(/\\/g, "/")
        .replace(/\.html$/, "");
    const url = new URL(reference, origin + basePath);
    if (url.origin !== origin) continue;
    const pathname = decodeURIComponent(url.pathname);
    const candidate = path.resolve("dist", "." + pathname);
    if (
      !candidate.startsWith(path.resolve("dist") + path.sep) &&
      candidate !== path.resolve("dist")
    )
      throw new Error(`Invalid resource path ${reference}`);
    const matches = pathname.endsWith("/")
      ? [path.join(candidate, "index.html"), candidate.slice(0, -1) + ".html"]
      : [candidate, candidate + ".html", path.join(candidate, "index.html")];
    if (!(await Promise.all(matches.map(exists))).some(Boolean))
      broken.add(`${file}: ${reference}`);
  }
}
if (broken.size)
  throw new Error(`Broken public links:\n${[...broken].join("\n")}`);
console.log(
  `Generated ${routes.length} HTML pages and ${outputFiles.length} public files; local links passed.`,
);
console.log(
  `Web Analytics: ${analyticsToken ? "beacon included" : "not configured"}.`,
);
