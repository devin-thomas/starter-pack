import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import test from "node:test";
import { allowedRedirect, handleOAuth } from "../src/oauth";
import origins from "../src/site-origin.json";

const origin = origins.canonicalOrigin;
const desktopCallback = "claude://claude.ai/mcp-auth-callback/sdk";
const loopbackCallback = "http://localhost:51234/callback";

async function send(path: string, init: RequestInit = {}, base = origin): Promise<Response> {
  const response = handleOAuth(new Request(`${base}${path}`, init));
  assert.ok(response, `${path} is an OAuth route`);
  return response;
}
async function register(redirectUris: unknown): Promise<Response> {
  return send("/oauth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_name: "Claude Code", redirect_uris: redirectUris }),
  });
}
function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}
async function signIn(redirectUri: string): Promise<{ code: string; verifier: string; location: URL }> {
  const client = await (await register([redirectUri])).json();
  const { verifier, challenge } = pkce();
  const query = new URLSearchParams({
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: "abc123",
    resource: `${origin}/mcp`,
  });
  const response = await send(`/oauth/authorize?${query}`);
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("Location") ?? "");
  return { code: location.searchParams.get("code") ?? "", verifier, location };
}
function exchange(form: Record<string, string>): Promise<Response> {
  return send("/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });
}

test("other paths are left to the site", () => {
  for (const path of ["/", "/mcp", "/oauth", "/register", "/.well-known/security.txt"])
    assert.equal(handleOAuth(new Request(`${origin}${path}`)), undefined, path);
});

test("discovery points clients at the accountless sign-in", async () => {
  for (const path of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"]) {
    const body = await (await send(path)).json();
    assert.equal(body.resource, `${origin}/mcp`);
    assert.deepEqual(body.authorization_servers, [origin]);
  }
  const server = await (await send("/.well-known/oauth-authorization-server")).json();
  assert.equal(server.issuer, origin);
  assert.equal(server.registration_endpoint, `${origin}/oauth/register`);
  assert.equal(server.authorization_endpoint, `${origin}/oauth/authorize`);
  assert.equal(server.token_endpoint, `${origin}/oauth/token`);
  assert.deepEqual(server.code_challenge_methods_supported, ["S256"]);
  assert.deepEqual(server.token_endpoint_auth_methods_supported, ["none"]);
});

test("each site host reports its own origin", async () => {
  const worker = origins.workerOrigin;
  const server = await (await send("/.well-known/oauth-authorization-server", {}, worker)).json();
  assert.equal(server.issuer, worker);
  const unknown = await send("/.well-known/oauth-authorization-server", {}, "https://example.com");
  assert.equal(unknown.status, 403);
});

test("only loopback and Claude callbacks may receive a code", () => {
  for (const uri of [
    desktopCallback,
    loopbackCallback,
    "http://127.0.0.1:8080/callback",
    "http://[::1]:9000/cb",
    "https://claude.ai/api/mcp/auth_callback",
    "https://claude.com/api/mcp/auth_callback",
  ])
    assert.equal(allowedRedirect(uri), true, uri);
  for (const uri of [
    "https://evil.example/callback",
    "https://claude.ai.evil.example/api/mcp/auth_callback",
    "https://claude.ai/somewhere-else",
    "http://localhost.evil.example/cb",
    "claude://evil/mcp-auth-callback/sdk",
    "javascript:alert(1)",
    "http://user:pass@localhost/cb",
    "not a url",
  ])
    assert.equal(allowedRedirect(uri), false, uri);
});

test("registration refuses other redirect addresses", async () => {
  for (const uris of [["https://evil.example/cb"], [], "http://localhost/cb", [desktopCallback, "https://evil.example/cb"]]) {
    const response = await register(uris);
    assert.equal(response.status, 400, JSON.stringify(uris));
    assert.equal((await response.json()).error, "invalid_redirect_uri");
  }
  const ok = await register([desktopCallback]);
  assert.equal(ok.status, 201);
  const client = await ok.json();
  assert.match(client.client_id, /^spc_/);
  assert.equal(client.token_endpoint_auth_method, "none");
});

test("Connect completes with no sign-in page for desktop and loopback clients", async () => {
  for (const callback of [desktopCallback, loopbackCallback]) {
    const { code, verifier, location } = await signIn(callback);
    assert.equal(`${location.protocol}//${location.host}${location.pathname}`, callback);
    assert.equal(location.searchParams.get("state"), "abc123");
    assert.equal(location.searchParams.get("iss"), origin);
    assert.match(code, /^spk_/);
    const response = await exchange({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: callback });
    assert.equal(response.status, 200);
    const tokens = await response.json();
    assert.equal(tokens.token_type, "Bearer");
    assert.match(tokens.access_token, /^spa_/);
    assert.match(tokens.refresh_token, /^spr_/);
    const refreshed = await exchange({ grant_type: "refresh_token", refresh_token: tokens.refresh_token });
    assert.equal(refreshed.status, 200);
    assert.notEqual((await refreshed.json()).access_token, tokens.access_token);
  }
});

test("authorize never redirects to an unregistered address", async () => {
  const client = await (await register([desktopCallback])).json();
  const { challenge } = pkce();
  const base = { response_type: "code", code_challenge: challenge, code_challenge_method: "S256" };
  for (const query of [
    { ...base, client_id: client.client_id, redirect_uri: "https://evil.example/cb" },
    { ...base, client_id: client.client_id, redirect_uri: loopbackCallback },
    { ...base, client_id: "made-up", redirect_uri: desktopCallback },
  ]) {
    const response = await send(`/oauth/authorize?${new URLSearchParams(query)}`);
    assert.equal(response.status, 400);
    assert.equal(response.headers.get("Location"), null);
  }
  const noPkce = await send(
    `/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: client.client_id, redirect_uri: desktopCallback })}`,
  );
  assert.equal(noPkce.status, 302);
  const back = new URL(noPkce.headers.get("Location") ?? "");
  assert.equal(back.searchParams.get("error"), "invalid_request");
  assert.equal(back.searchParams.get("code"), null);
});

test("a code only works with its own verifier and redirect", async () => {
  const { code } = await signIn(desktopCallback);
  const other = pkce();
  const wrongVerifier = await exchange({ grant_type: "authorization_code", code, code_verifier: other.verifier });
  assert.equal(wrongVerifier.status, 400);
  assert.equal((await wrongVerifier.json()).error, "invalid_grant");
  const { code: second, verifier } = await signIn(desktopCallback);
  const wrongRedirect = await exchange({
    grant_type: "authorization_code",
    code: second,
    code_verifier: verifier,
    redirect_uri: loopbackCallback,
  });
  assert.equal(wrongRedirect.status, 400);
  const forged = await exchange({ grant_type: "authorization_code", code: "spk_bm90LWpzb24", code_verifier: verifier });
  assert.equal(forged.status, 400);
  const badGrant = await exchange({ grant_type: "password" });
  assert.equal(badGrant.status, 400);
  assert.equal((await badGrant.json()).error, "unsupported_grant_type");
});

test("methods are enforced and CORS preflight is answered", async () => {
  assert.equal((await send("/oauth/register")).status, 405);
  assert.equal((await send("/oauth/token")).status, 405);
  assert.equal((await send("/.well-known/oauth-authorization-server", { method: "POST" })).status, 405);
  const preflight = await send("/oauth/token", { method: "OPTIONS" });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), "*");
});
