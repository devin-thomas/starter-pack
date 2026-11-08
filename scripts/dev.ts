import { createServer } from "vite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { generateResources, loadContent, routes } from "./content";
import { addPageHead, markdownPath } from "./page-head";
import { buildWorkbench } from "./workbench";

const server = await createServer({
  server: { host: "127.0.0.1" },
  appType: "custom",
});
// Populate lesson routes before the first request, including direct Skills links.
await loadContent();
server.middlewares.use(async (request, response, next) => {
  const pathname =
    new URL(request.url || "/", "http://localhost").pathname.replace(
      /\/$/,
      "",
    ) || "/";
  if (
    ["/artifacts/progress-workbench/index.html", "/artifacts/progress-workbench/catalog.json", "/artifacts/progress-workbench/manifest.json"].includes(pathname)
  ) {
    try {
      await buildWorkbench(".generated", await loadContent());
      response.setHeader("Content-Type", pathname.endsWith(".json") ? "application/json" : "application/octet-stream");
      if (pathname.endsWith(".html")) response.setHeader("Content-Disposition", 'attachment; filename="index.html"');
      else response.setHeader("Access-Control-Allow-Origin", "*");
      response.end(await readFile(path.join(".generated", pathname)));
    } catch (error) { next(error); }
    return;
  }
  if (
    routes.some(route => markdownPath(route) === pathname) ||
    /^\/(guide|about)\.(md|json)$/.test(pathname) ||
    /^\/help\/cloudflare-iphone\.(md|json)$/.test(pathname) ||
    /^\/phases\/3\/[a-z0-9-]+\.(md|json)$/.test(pathname) ||
    /^\/phases\/[123]\.(md|json)$/.test(pathname) ||
    /^\/style\/(?:(?:TypeScript|Godot|Kotlin|React-TypeScript|Python|Swift-SwiftUI|JavaScript|Dart-Flutter|Rust)\.(?:md|json)|catalog\.json)$/.test(pathname) ||
    /^\/skills\/[a-z-]+\/SKILL\.md$/.test(pathname) ||
    /^\/skills(?:\/[a-z-]+)?\.(md|json)$/.test(pathname) ||
    [
      "/AGENTS.md",
      "/agent/catalog.json",
      "/agent/phase-1-packet.txt",
      "/recommendations.json",
      "/llms.txt",
      "/robots.txt",
      "/sitemap.xml",
    ].includes(pathname)
  ) {
    try {
      await generateResources(await loadContent(), ".generated");
      response.setHeader(
        "Content-Type",
        pathname.endsWith(".json")
          ? "application/json"
          : "text/plain; charset=utf-8",
      );
      response.end(await readFile(path.join(".generated", pathname)));
    } catch (error) {
      next(error);
    }
    return;
  }
  if (pathname.startsWith("/examples/")) {
    // Example sites are static files; mirror the Worker's clean addresses in development.
    try {
      await generateResources(await loadContent(), ".generated");
      const raw = new URL(request.url || "/", "http://localhost").pathname;
      const file = raw.endsWith("/") ? raw + "index.html" : /\.[a-z]+$/.test(raw) ? raw : raw + ".html";
      const type = file.endsWith(".html") ? "text/html" : file.endsWith(".json") ? "application/json" : file.endsWith(".xml") ? "application/xml" : file.endsWith(".js") ? "text/javascript" : "text/plain; charset=utf-8";
      response.setHeader("Content-Type", type);
      response.end(await readFile(path.join(".generated", file)));
    } catch (error) {
      next(error);
    }
    return;
  }
  if (!routes.includes(pathname)) return next();
  try {
    const data = await loadContent();
    const { App } = await server.ssrLoadModule("/src/App.tsx");
    const template = await server.transformIndexHtml(
      pathname,
      await readFile("index.html", "utf8"),
    );
    const html = addPageHead(template, pathname, data)
      .replace(
        "<!--app-html-->",
        renderToString(createElement(App, { path: pathname, data })),
      )
      .replace(
        "<!--app-data-->",
        `<script id="site-data" type="application/json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`,
      );
    response.setHeader("Content-Type", "text/html");
    response.end(html);
  } catch (error) {
    next(error);
  }
});
await server.listen();
server.printUrls();
