import publicCatalog from "../examples/lantern-tools/data/catalog.json";
import openApi from "../examples/lantern-tools/openapi.json";
import {
  errorBody,
  errorShape,
  listFilters,
  listTools,
  parseCatalog,
  showTool,
  type Catalog,
  type ErrorBody,
} from "../examples/lantern-tools/lib/catalog.mjs";

// Level 2 reference HTTP API: a read-only lookup of a fictional tool library.
// It reuses the lantern-tools command's own module, so both lanes return the
// same body for the same question. It lives outside /api/* on purpose.

export const exampleApiBase: string = "/examples/lantern-tools/v1";
// The site serves the library's public catalog: the same file the command's
// archive bundles, which tests keep equal to the public fields of the library's
// own records. Staff-only fields never reach this server, and the response is
// still built from the public-field allowlist in catalog.mjs.
const defaultCatalog: Catalog = parseCatalog(publicCatalog);

type LimitDecision = {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly reset: number;
};
type Window = { start: number; count: number };

// Fixed-window limit per client, held in this instance's memory. It is a
// courtesy limit: separate instances count separately and a restart clears it.
export class RateLimiter {
  private readonly windows: Map<string, Window> = new Map();
  constructor(
    readonly limit: number = 60,
    private readonly windowMs: number = 60_000,
    private readonly now: () => number = (): number => Date.now(),
  ) {}

  take(key: string): LimitDecision {
    const time: number = this.now();
    let window: Window | undefined = this.windows.get(key);
    if (!window || time - window.start >= this.windowMs) {
      if (this.windows.size >= 10_000) this.windows.clear();
      window = { start: time, count: 0 };
      this.windows.set(key, window);
    }
    window.count += 1;
    return {
      allowed: window.count <= this.limit,
      limit: this.limit,
      remaining: Math.max(0, this.limit - window.count),
      reset: Math.ceil((window.start + this.windowMs - time) / 1000),
    };
  }
}

const defaultLimiter: RateLimiter = new RateLimiter();

function json(
  request: Request,
  status: number,
  body: unknown,
  decision: LimitDecision,
  extra: Readonly<Record<string, string>> = {},
  updated?: string,
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
    "RateLimit-Limit": String(decision.limit),
    "RateLimit-Remaining": String(decision.remaining),
    "RateLimit-Reset": String(decision.reset),
    ...(updated === undefined
      ? {}
      : { "Last-Modified": new Date(`${updated}T00:00:00Z`).toUTCString() }),
    ...extra,
  };
  return new Response(
    request.method === "HEAD" ? null : `${JSON.stringify(body, null, 2)}\n`,
    { status, headers },
  );
}

function failure(code: string, message: string, status: number): ErrorBody {
  return errorShape(code, message, status);
}

// Each endpoint names the query parameters it accepts; anything else is
// rejected, so no request can ask for a private field.
function checkQuery(url: URL, allowed: readonly string[]): ErrorBody | null {
  const names: string[] = [...url.searchParams.keys()];
  const unknown: string | undefined = names.find(
    (name: string): boolean => !allowed.includes(name),
  );
  if (unknown !== undefined)
    return failure(
      "invalid_parameter",
      allowed.length
        ? `Unknown query parameter. This endpoint accepts only: ${allowed.join(", ")}.`
        : "This endpoint takes no query parameters.",
      400,
    );
  if (new Set(names).size !== names.length)
    return failure("invalid_parameter", "Send each query parameter once.", 400);
  return null;
}

/** Answers requests under /examples/lantern-tools/v1; anything else returns undefined. */
export function exampleApiResponse(
  request: Request,
  limiter: RateLimiter = defaultLimiter,
  catalog: Catalog = defaultCatalog,
): Response | undefined {
  const url: URL = new URL(request.url);
  if (
    url.pathname !== exampleApiBase &&
    !url.pathname.startsWith(`${exampleApiBase}/`)
  )
    return undefined;
  const decision: LimitDecision = limiter.take(
    request.headers.get("CF-Connecting-IP") ?? "local",
  );
  if (!decision.allowed)
    return json(
      request,
      429,
      failure(
        "rate_limited",
        `Too many requests. Wait ${decision.reset} seconds and try again.`,
        429,
      ),
      decision,
      { "Retry-After": String(decision.reset) },
    );
  const path: string = url.pathname.slice(exampleApiBase.length);
  const reading: boolean =
    request.method === "GET" || request.method === "HEAD";

  // Lending a tool changes data, so it sits behind staff sign-in. This public
  // example has no staff accounts: every request is refused and nothing changes.
  if (path === "/loans") {
    if (request.method !== "POST")
      return json(
        request,
        405,
        failure("method_not_allowed", "Loans accept POST only.", 405),
        decision,
        { Allow: "POST" },
      );
    return json(
      request,
      401,
      failure(
        "authentication_required",
        "Lending a tool needs a signed-in staff member. This public example has no staff sign-in, so nothing was changed.",
        401,
      ),
      decision,
      { "WWW-Authenticate": 'Bearer realm="Lantern Street staff"' },
    );
  }
  if (!reading)
    return json(
      request,
      405,
      failure(
        "method_not_allowed",
        "This API is read-only. Use GET or HEAD.",
        405,
      ),
      decision,
      { Allow: "GET, HEAD" },
    );

  try {
    if (path === "/openapi.json") {
      const problem: ErrorBody | null = checkQuery(url, []);
      if (problem) return json(request, 400, problem, decision);
      return json(
        request,
        200,
        { ...openApi, servers: [{ url: `${url.origin}${exampleApiBase}` }] },
        decision,
      );
    }
    if (path === "/tools") {
      const problem: ErrorBody | null = checkQuery(url, [
        "available",
        "category",
      ]);
      if (problem) return json(request, 400, problem, decision);
      const body: unknown = listTools(
        catalog,
        listFilters({
          available: url.searchParams.get("available") ?? undefined,
          category: url.searchParams.get("category") ?? undefined,
        }),
      );
      return json(request, 200, body, decision, {}, catalog.updated);
    }
    const match: RegExpMatchArray | null = path.match(/^\/tools\/([^/]+)$/);
    if (match?.[1] !== undefined) {
      const problem: ErrorBody | null = checkQuery(url, []);
      if (problem) return json(request, 400, problem, decision);
      let id: string;
      try {
        id = decodeURIComponent(match[1]);
      } catch {
        id = "";
      }
      return json(
        request,
        200,
        showTool(catalog, id),
        decision,
        {},
        catalog.updated,
      );
    }
    return json(
      request,
      404,
      failure(
        "not_found",
        `There is no endpoint here. See ${exampleApiBase}/openapi.json for the endpoints.`,
        404,
      ),
      decision,
    );
  } catch (error) {
    const body: ErrorBody = errorBody(error);
    return json(request, body.error.status, body, decision);
  }
}

type Assets = { fetch(request: Request): Promise<Response> };
const downloadTypes: Readonly<Record<string, string>> = {
  ".tgz": "application/gzip",
  ".sha256": "text/plain; charset=utf-8",
};

/** The API, plus the command's archive and checksum with explicit content types. */
export function lanternToolsResponse(
  request: Request,
  assets: Assets,
): Promise<Response> | undefined {
  const api: Response | undefined = exampleApiResponse(request);
  if (api !== undefined) return Promise.resolve(api);
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith("/examples/lantern-tools/")) return undefined;
  const type: string | undefined = Object.entries(downloadTypes).find(
    ([extension]: [string, string]): boolean => pathname.endsWith(extension),
  )?.[1];
  if (type === undefined) return undefined;
  return assets.fetch(request).then((response: Response): Response => {
    if (!response.ok) return response;
    const headers: Headers = new Headers(response.headers);
    headers.set("Content-Type", type);
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers });
  });
}
