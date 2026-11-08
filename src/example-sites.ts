import lanternStreet from "../content/examples/agent-ready-website/site.json";

// Routing for example sites generated under /examples/<slug>/. The configuration holds
// paths and withdrawal notices only; page content never enters the Worker bundle.

type WithdrawnPage = {
  readonly slug: string;
  readonly title: string;
  readonly withdrawn: string;
  readonly reason: string;
  readonly replacement: string;
};

export type ExampleSiteRoutes = {
  readonly name: string;
  readonly base: string;
  readonly redirects: Readonly<Record<string, string>>;
  readonly withdrawn: readonly WithdrawnPage[];
};

type Assets = { fetch(request: Request): Promise<Response> };

export const exampleSites: readonly ExampleSiteRoutes[] = [lanternStreet];

/** Paths answered by routing rather than a file: moved (301) and withdrawn (410) pages. */
export function exampleRoutedPaths(): ReadonlySet<string> {
  return new Set(
    exampleSites.flatMap((site: ExampleSiteRoutes): string[] => [
      ...Object.keys(site.redirects).map(
        (slug: string): string => site.base + slug,
      ),
      ...site.withdrawn.map(
        (page: WithdrawnPage): string => site.base + page.slug,
      ),
    ]),
  );
}

const escapes: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (character: string): string => escapes[character] ?? character,
  );
}

function redirect(url: URL, pathname: string): Response {
  const target: URL = new URL(pathname, url);
  target.search = url.search;
  return Response.redirect(target.href, 301);
}

function asset(
  request: Request,
  url: URL,
  pathname: string,
  assets: Assets,
): Promise<Response> {
  const target: URL = new URL(url);
  target.pathname = pathname;
  return assets.fetch(new Request(target, request));
}

function withdrawnPage(
  site: ExampleSiteRoutes,
  page: WithdrawnPage,
  method: string,
): Response {
  const replacement: string = site.base + page.replacement;
  const body: string = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Withdrawn: ${escapeHtml(page.title)} | ${escapeHtml(site.name)} (example)</title>
</head>
<body>
<main>
<h1>This page was withdrawn</h1>
<p>${escapeHtml(page.title)} was withdrawn on <time datetime="${page.withdrawn}">${page.withdrawn}</time>. ${escapeHtml(page.reason)}</p>
<p><a href="${replacement}">Go to the current information</a></p>
</main>
</body>
</html>
`;
  return new Response(method === "HEAD" ? null : body, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

/** Returns a response for an example-site path, or undefined for any other path. */
export function exampleSiteResponse(
  request: Request,
  assets: Assets,
): Promise<Response> | undefined {
  const url: URL = new URL(request.url);
  for (const site of exampleSites) {
    if (url.pathname === site.base.slice(0, -1))
      return Promise.resolve(redirect(url, site.base));
    if (!url.pathname.startsWith(site.base)) continue;
    const rest: string = url.pathname.slice(site.base.length);
    if (rest === "")
      return asset(request, url, `${site.base}index.html`, assets);
    const moved: string | undefined = site.redirects[rest];
    if (moved !== undefined)
      return Promise.resolve(redirect(url, site.base + moved));
    const gone: WithdrawnPage | undefined = site.withdrawn.find(
      (page: WithdrawnPage): boolean => page.slug === rest,
    );
    if (gone) return Promise.resolve(withdrawnPage(site, gone, request.method));
    // One address per page: index and .html forms redirect to the clean canonical path.
    const html: RegExpExecArray | null = /^([a-z0-9-]+)(?:\.html)?$/.exec(rest);
    if (html && (rest.endsWith(".html") || rest === "index"))
      return Promise.resolve(
        redirect(url, site.base + (html[1] === "index" ? "" : html[1])),
      );
    if (html) return asset(request, url, `${url.pathname}.html`, assets);
    return assets.fetch(request);
  }
  return undefined;
}
