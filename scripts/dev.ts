import { createServer } from "vite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { generateResources, loadContent, routes } from "./content";
import { buildWorkbench } from "./workbench";

const server = await createServer({
  server: { host: "127.0.0.1" },
  appType: "custom",
});
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
    /^\/(guide|about)\.(md|json)$/.test(pathname) ||
    /^\/help\/cloudflare-iphone\.(md|json)$/.test(pathname) ||
    /^\/phases\/[123]\.(md|json)$/.test(pathname) ||
    /^\/skills\/[a-z-]+\/SKILL\.md$/.test(pathname) ||
    [
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
  if (!routes.includes(pathname)) return next();
  try {
    const data = await loadContent();
    const { default: App } = await server.ssrLoadModule("/src/App.tsx");
    const template = await server.transformIndexHtml(
      pathname,
      await readFile("index.html", "utf8"),
    );
    const html = template
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
