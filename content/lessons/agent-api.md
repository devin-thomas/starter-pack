---
id: agent-api
kind: lesson
phase: phase-3
level: 2
title: "Level 2: Give your project an HTTP API"
label: PHASE 03 / LEVEL 2
summary: Give a web app or hosted tool one documented, read-only HTTP endpoint an agent can call, check and see fail clearly.
route: /phases/3/agent-api
status: preview
updated: 2026-11-08
---

# Level 2: Give your project an HTTP API

An HTTP API lets an agent ask your web app a question over the internet and get structured data back, without clicking through pages. This lesson adds one documented endpoint to a project that already runs on the web, such as a site, a tracker or a hosted tool. You work on your own project. You do not need a command-line tool, an MCP server or a package.

This lane is one of the two Level 2 choices. A working endpoint that passes the [real-client checks](/phases/3#prove-it-with-a-real-client) completes Phase 3 on its own. If your project runs on a computer rather than the web, [the command lesson](/phases/3/agent-cli) fits better.

## Start with your own project

Ask your agent to read your project's source and its live site before it changes anything, then agree on four things:

1. **One question.** What should an agent be able to ask your app? "Which books am I reading", "what is on this week's schedule", "is this tool available". A read-only endpoint is a good start.
2. **The code that already answers it.** The endpoint calls the same function or query your pages use. It does not get its own copy of the logic.
3. **What is public.** Choose the fields the endpoint returns. Everything else, such as private notes, personal data and anything behind a sign-in, stays out.
4. **What stays protected.** Anything that changes data or shows private data keeps the sign-in and permission checks your app already has. A public endpoint never skips them.

That short list is your plan. Review it and give your go-ahead before your agent writes code.

## Design the endpoint

### One address, one method

Use `GET` for reading, on a stable path with a version in it, such as `/api/v1/books` for a list and `/api/v1/books/42` for one item. A version in the path lets a later `v2` change the shape without breaking anyone using `v1`. Accept only the query parameters you document, and reject everything else with an error instead of ignoring it. Then nobody can ask for a field you did not mean to share.

### A response an agent can trust

Return JSON with `Content-Type: application/json`, the same keys every time, a version field, and a date that says how fresh the data is. Build each item from a list of fields you chose to show (an allowlist), not from the whole database row.

```json
{
  "api_version": "1",
  "catalog_updated": "2026-11-08",
  "tool": { "id": "cordless-drill", "name": "Cordless drill", "category": "Power tools", "loan_days": 14, "available": true }
}
```

### Errors with one shape

Every failure uses the right status code and the same JSON shape, so an agent can read it like any other answer:

```json
{ "api_version": "1", "error": { "code": "not_found", "message": "No tool has that id.", "status": 404 } }
```

| Status | When |
| --- | --- |
| `200` | Success |
| `400` | Unknown or invalid parameter |
| `401` or `403` | The operation needs a sign-in or a permission the caller does not have |
| `404` | Nothing has that id, or there is no endpoint at that address |
| `405` | Wrong method, with an `Allow` header naming the right ones |
| `429` | Too many requests, with a `Retry-After` header |

Error messages explain what to change. They never include stack traces, keys, private data or the caller's own sensitive input.

### Limit how often it is called

Rate limiting protects your app and your costs. Use your host's rate-limiting service where it has one (Cloudflare Workers has a rate-limiting binding, for example) and answer `429` with `Retry-After` when a client goes over. A counter kept in your server's memory is only a courtesy limit: each server instance counts on its own and a restart clears it.

### Keep protected operations separate

Writing data, such as lending a tool or adding a book, belongs behind your app's sign-in, checked on every request. Keep those routes separate from the public read-only ones and answer `401` when the caller is not signed in. Never accept a password or key in a URL, and only allow other websites to read (`Access-Control-Allow-Origin`) endpoints that are public and read-only.

## Document it

Describe the endpoint in an [OpenAPI](https://spec.openapis.org/oas/v3.1.0) document, a JSON or YAML file that lists each path, its parameters, its responses and their shapes. Serve it at a stable address next to the API, such as `/api/v1/openapi.json`, and add a short README section with an example request. Add a test that checks real responses against the document, so the two cannot drift apart.

## Deploy and check from outside

Your test suite is not what an agent receives. Deploy, then check the live address with ordinary HTTP requests. Ask your agent to run these and show you the results:

| Check | What to expect |
| --- | --- |
| Your endpoint | `200`, JSON, the documented keys, a version and a freshness date |
| An id that does not exist | `404` with the error shape |
| An unknown query parameter | `400` with the error shape |
| A protected operation without a sign-in | `401`, and nothing changes |
| The OpenAPI document | `200`, and it matches the responses above |
| Your private fields | Absent from every response and from the document |

```sh
curl -si https://example.com/api/v1/books/42
curl -s https://example.com/api/v1/books/999999
curl -s "https://example.com/api/v1/books?include=notes"
```

## Prove it with a real agent

Open a new session in an agent app that can fetch web addresses or run `curl`, such as Claude Code or Codex. It has not seen your project. Give it the endpoint's address and ask:

> Fetch `https://example.com/api/v1/books/42` and tell me the title and status it returns. Then fetch `https://example.com/api/v1/books/999999` and tell me the HTTP status and the error code.

The check passes when the agent reports the values your live data really holds, and reports the failing request's status and error code without inventing a result. Compare both with what you expect. If the agent cannot use the endpoint, improve its documentation or error messages and ask again in a fresh session.

## Record your milestone

Ask your agent to mark the `agent-api` step completed in your private progress file, with a short `verification` object as the [Phase 3 page](/phases/3#save-your-milestones) and the progress guide describe:

```json
"verification": {
  "interface": "api",
  "client": "<the agent app you used>",
  "operation": "GET https://example.com/api/v1/books/42",
  "expected_output_check": "passed",
  "negative_case_check": "passed",
  "learner_confirmed": true,
  "verified_at": "<when you checked, as an ISO date and time>",
  "requirements_revision": "<the current requirements revision>",
  "summary": "Agent reported the right title and status, and 404 not_found for a missing id."
}
```

Save only these short notes, never logs, keys or private data. With your confirmation, this completes Phase 3.

## See it in an example

The [Lantern Street Tool Library](/examples/agent-ready-website/), the fictional library from the Level 1 lesson, also answers over HTTP. Its API is read-only and needs no account. Because it is part of this site, it lives at `/examples/lantern-tools/v1/`; in your project, a path such as `/api/v1/` is usual.

```sh
curl -s https://starter.uppercut-labs.com/examples/lantern-tools/v1/tools/cordless-drill
curl -s "https://starter.uppercut-labs.com/examples/lantern-tools/v1/tools?available=false"
curl -si https://starter.uppercut-labs.com/examples/lantern-tools/v1/tools/chainsaw
curl -s https://starter.uppercut-labs.com/examples/lantern-tools/v1/openapi.json
```

Look at:

- `GET /v1/tools` and `GET /v1/tools/{id}`, with `api_version` and `catalog_updated` in every answer and `Last-Modified`, `Cache-Control` and `RateLimit-*` headers;
- `GET /v1/openapi.json`, the OpenAPI document that describes every endpoint, parameter and error;
- `/v1/tools/chainsaw`, which returns `404` with the error shape, and `/v1/tools?fields=staff_note`, which returns `400` because that parameter is not documented;
- `POST /v1/loans`, a protected staff operation that returns `401` and changes nothing, because this public example has no staff sign-in;
- what is missing. The library's own records also hold where each tool is stored and staff notes. The site's server loads only the public fields, and the API still builds every answer from its list of public fields, so no response or document includes them;
- the [command lesson's](/phases/3/agent-cli) `lantern-tools show cordless-drill --json`, which prints the same JSON. Both use one module, `lib/catalog.mjs`, so the API only adds addresses, status codes and headers.

The example limits each client to 60 requests a minute with a counter in memory, which is fine for a demonstration and not real protection.

## Go deeper when it helps

These are optional. Choose one only when your project needs it.

- **Your framework's API tools.** Many frameworks can generate the OpenAPI document from your route definitions and validate requests for you.
- **Caching with `ETag`,** so clients can ask whether data changed without downloading it again.
- **Signed-in reads.** When an agent should read a user's own private data, use your app's existing sign-in and give the agent its own limited token, rather than making that data public.
- **Uppercut Agent Native.** The released `@uppercut-labs/agent-native` package, version 1.0.1, describes an operation once and serves it as an HTTP API, a command or an MCP tool. It is an optional accelerator. Installing it is not the finish line; a working endpoint that passes the checks is.

When your milestone is recorded, return to [Phase 3](/phases/3#choose-what-an-agent-should-do). You can stop here, or add a [command](/phases/3/agent-cli) or an MCP tool when your project needs one.
