// Accountless sign-in for the Starter Pack connector.
//
// Starter Pack has no accounts and /mcp never asks for a token. Some MCP
// clients still run an OAuth sign-in when someone presses Connect (Claude's
// plugin settings do). Without these endpoints that sign-in fails, so this
// module answers it: discovery metadata, client registration, an authorize
// step that approves at once with no sign-in page, and a token endpoint.
//
// Nothing is stored. Client IDs and codes carry their own data; the PKCE check
// still runs so a code only works for the client that asked for it. Tokens
// grant nothing beyond what /mcp already serves to everyone. Redirects go only
// to loopback addresses and Claude's own callbacks, so /oauth/authorize is not
// an open redirect.
import { allowedHost, mcpPath } from "./mcp";

export const oauthPaths = {
  protectedResource: "/.well-known/oauth-protected-resource",
  authorizationServer: "/.well-known/oauth-authorization-server",
  register: "/oauth/register",
  authorize: "/oauth/authorize",
  token: "/oauth/token",
} as const;

const codeLifetimeSeconds: number = 600;
const tokenLifetimeSeconds: number = 31_536_000;
const maxRedirectUris: number = 5;
const maxUriLength: number = 512;
const maxBodyBytes: number = 8_192;

const baseHeaders: Readonly<Record<string, string>> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
// Metadata, registration and token responses are public and hold nothing
// secret, so any origin may read them.
const corsHeaders: Readonly<Record<string, string>> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, MCP-Protocol-Version",
};
const loopbackHosts: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);
const claudeCallbacks: ReadonlySet<string> = new Set([
  "https://claude.ai/api/mcp/auth_callback",
  "https://claude.com/api/mcp/auth_callback",
]);

/** True for redirect targets an accountless sign-in may send a code to. */
export function allowedRedirect(value: string): boolean {
  if (value.length > maxUriLength) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username !== "" || url.password !== "" || url.hash !== "")
    return false;
  if (url.protocol === "http:" || url.protocol === "https:") {
    if (loopbackHosts.has(url.hostname)) return true;
    return claudeCallbacks.has(`${url.origin}${url.pathname}`);
  }
  // Claude desktop's own link handler.
  return (
    url.protocol === "claude:" &&
    url.host === "claude.ai" &&
    url.pathname.startsWith("/mcp-auth-callback/")
  );
}

function json(
  status: number,
  body: unknown,
  extra: Record<string, string> = {},
): Response {
  return Response.json(body, {
    status,
    headers: { ...baseHeaders, ...corsHeaders, ...extra },
  });
}
function oauthError(
  status: number,
  error: string,
  description: string,
): Response {
  return json(status, { error, error_description: description });
}
function plain(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: { ...baseHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function fromBase64Url(value: string): Uint8Array | undefined {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return undefined;
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char: string): number =>
      char.charCodeAt(0),
    );
  } catch {
    return undefined;
  }
}
function pack(prefix: string, data: unknown): string {
  return prefix + toBase64Url(new TextEncoder().encode(JSON.stringify(data)));
}
function unpack(
  prefix: string,
  value: string | null,
): Record<string, unknown> | undefined {
  if (value === null || !value.startsWith(prefix) || value.length > 4_096)
    return undefined;
  const bytes = fromBase64Url(value.slice(prefix.length));
  if (bytes === undefined) return undefined;
  try {
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}
function randomToken(prefix: string): string {
  return prefix + toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}
async function s256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return toBase64Url(new Uint8Array(digest));
}

async function readText(request: Request): Promise<string | undefined> {
  const length = Number(request.headers.get("Content-Length") ?? "0");
  if (length > maxBodyBytes) return undefined;
  const text = await request.text();
  return new TextEncoder().encode(text).length > maxBodyBytes
    ? undefined
    : text;
}

function protectedResource(origin: string): Response {
  return json(200, {
    resource: `${origin}${mcpPath}`,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
    scopes_supported: [],
    resource_name: "Starter Pack",
  });
}

function authorizationServer(origin: string): Response {
  return json(200, {
    issuer: origin,
    authorization_endpoint: `${origin}${oauthPaths.authorize}`,
    token_endpoint: `${origin}${oauthPaths.token}`,
    registration_endpoint: `${origin}${oauthPaths.register}`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [],
    authorization_response_iss_parameter_supported: true,
  });
}

async function register(request: Request): Promise<Response> {
  const text = await readText(request);
  if (text === undefined)
    return oauthError(
      413,
      "invalid_client_metadata",
      "Registration is too large.",
    );
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return oauthError(
      400,
      "invalid_client_metadata",
      "Send client metadata as JSON.",
    );
  }
  const uris: unknown =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)["redirect_uris"]
      : undefined;
  if (
    !Array.isArray(uris) ||
    uris.length === 0 ||
    uris.length > maxRedirectUris ||
    !uris.every(
      (uri: unknown): uri is string =>
        typeof uri === "string" && allowedRedirect(uri),
    )
  )
    return oauthError(
      400,
      "invalid_redirect_uri",
      "Redirect URIs must be loopback addresses or Claude's own sign-in callbacks.",
    );
  const redirectUris: string[] = [...new Set(uris)];
  return json(201, {
    client_id: pack("spc_", { r: redirectUris }),
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: redirectUris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  });
}

function registeredUris(
  clientId: string | null,
): readonly string[] | undefined {
  const data = unpack("spc_", clientId);
  const uris = data?.["r"];
  return Array.isArray(uris) &&
    uris.every((uri: unknown): boolean => typeof uri === "string")
    ? (uris as string[])
    : undefined;
}

function authorize(url: URL, origin: string): Response {
  const params = url.searchParams;
  const redirectUri = params.get("redirect_uri");
  const registered = registeredUris(params.get("client_id"));
  // Errors before the redirect target is trusted are shown here, never redirected.
  if (registered === undefined)
    return plain(400, "Unknown client. Register with Starter Pack first.");
  const target =
    redirectUri ?? (registered.length === 1 ? registered[0] : undefined);
  if (
    target === undefined ||
    !registered.includes(target) ||
    !allowedRedirect(target)
  )
    return plain(
      400,
      "That redirect address is not registered for this client.",
    );
  const back = new URL(target);
  const state = params.get("state");
  if (state !== null) back.searchParams.set("state", state);
  back.searchParams.set("iss", origin);
  const challenge = params.get("code_challenge");
  if (params.get("response_type") !== "code") {
    back.searchParams.set("error", "unsupported_response_type");
  } else if (
    challenge === null ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(challenge) ||
    params.get("code_challenge_method") !== "S256"
  ) {
    back.searchParams.set("error", "invalid_request");
    back.searchParams.set("error_description", "PKCE with S256 is required.");
  } else {
    // No account and no consent screen: approve straight away.
    back.searchParams.set(
      "code",
      pack("spk_", {
        c: challenge,
        r: target,
        e: Math.floor(Date.now() / 1000) + codeLifetimeSeconds,
      }),
    );
  }
  return new Response(null, {
    status: 302,
    headers: { ...baseHeaders, Location: back.href },
  });
}

function tokens(): Response {
  return json(200, {
    access_token: randomToken("spa_"),
    token_type: "Bearer",
    expires_in: tokenLifetimeSeconds,
    refresh_token: randomToken("spr_"),
    scope: "",
  });
}

async function token(request: Request): Promise<Response> {
  const text = await readText(request);
  if (text === undefined)
    return oauthError(413, "invalid_request", "Request is too large.");
  const form = new URLSearchParams(text);
  const grant = form.get("grant_type");
  if (grant === "refresh_token") {
    return /^spr_[A-Za-z0-9_-]{20,}$/.test(form.get("refresh_token") ?? "")
      ? tokens()
      : oauthError(400, "invalid_grant", "Unknown refresh token.");
  }
  if (grant !== "authorization_code")
    return oauthError(
      400,
      "unsupported_grant_type",
      "Use authorization_code or refresh_token.",
    );
  const code = unpack("spk_", form.get("code"));
  const verifier = form.get("code_verifier") ?? "";
  if (
    code === undefined ||
    typeof code["c"] !== "string" ||
    typeof code["r"] !== "string" ||
    typeof code["e"] !== "number" ||
    code["e"] < Math.floor(Date.now() / 1000)
  )
    return oauthError(
      400,
      "invalid_grant",
      "The sign-in code is invalid or expired. Press Connect again.",
    );
  const redirectUri = form.get("redirect_uri");
  if (redirectUri !== null && redirectUri !== code["r"])
    return oauthError(
      400,
      "invalid_grant",
      "The redirect address does not match the sign-in.",
    );
  if (
    !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) ||
    (await s256(verifier)) !== code["c"]
  )
    return oauthError(
      400,
      "invalid_grant",
      "The PKCE verifier does not match.",
    );
  return tokens();
}

/** Handles the accountless sign-in routes; undefined for every other path. */
export function handleOAuth(request: Request): Promise<Response> | undefined {
  const url = new URL(request.url);
  const path = url.pathname;
  const known =
    path === oauthPaths.protectedResource ||
    path === `${oauthPaths.protectedResource}${mcpPath}` ||
    path === oauthPaths.authorizationServer ||
    path === oauthPaths.register ||
    path === oauthPaths.authorize ||
    path === oauthPaths.token;
  if (!known) return undefined;
  if (!allowedHost(url.hostname, url.host))
    return Promise.resolve(plain(403, "Unknown host."));
  const origin = url.origin;
  if (request.method === "OPTIONS")
    return Promise.resolve(
      new Response(null, {
        status: 204,
        headers: { ...baseHeaders, ...corsHeaders },
      }),
    );
  const post = path === oauthPaths.register || path === oauthPaths.token;
  const method = post ? "POST" : "GET";
  if (
    request.method !== method &&
    !(method === "GET" && request.method === "HEAD")
  )
    return Promise.resolve(
      json(
        405,
        { error: "invalid_request", error_description: `Use ${method}.` },
        { Allow: method },
      ),
    );
  if (path === oauthPaths.register) return register(request);
  if (path === oauthPaths.token) return token(request);
  if (path === oauthPaths.authorize)
    return Promise.resolve(authorize(url, origin));
  if (path === oauthPaths.authorizationServer)
    return Promise.resolve(authorizationServer(origin));
  return Promise.resolve(protectedResource(origin));
}
