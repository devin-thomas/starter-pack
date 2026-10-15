# Migration verification

Source preparation is not live acceptance. Production changes, new domain
attachment, legacy redirect activation, provider configuration and real feedback
delivery require separate owner approval.

## Source and local gates

Run `npm ci` and `npm run check`. The suite checks all historical pinned hashes,
catalog/schema generation, strict feedback origins and mocked delivery, every
built resource through real Worker/static-assets routing, reading redirects,
download bytes/headers, 404/405 and Workbench catalog CORS. It also runs the actual
deployment verifier against a local Worker with redirects disabled.

`migration-contract.test.ts` rejects catch-all 301/308 machine redirects, stale
catalogs/bodies, wrong MIME types, changed pinned bytes, temporary reading
redirects and wrong destinations. Feedback tests reject mismatched, missing,
forged and sibling origins. Do not substitute a static-file preview for the
Worker/static-assets tests.

## Live HTTP gates: pending release

Use normal DNS and TLS, no host-file or IP override. Build the exact approved
source revision first. After owner-approved new-host activation, run:

```sh
npm run verify:deployment -- https://starter.uppercut-labs.com
npm run verify:legacy -- https://starter.devthomas.site --before-redirects
npm run verify:deployment -- https://starter-pack.uppercut-labs.workers.dev
```

Only after new-host P0 acceptance and approval to enable the redirect switch:

```sh
npm run verify:legacy -- https://starter.devthomas.site
```

The legacy script tests the old host separately; it never relies on following a
redirect to read machine resources. It checks all pre-migration pinned files and
all built machine/static bodies, GET/HEAD, all reading destinations, downloads,
CORS and private-path denials. Catalog comparison ignores only validated build
timestamps, matching the canonical verifier. The served robots policy must retain
the exact source suffix; only the SHA-256-pinned Cloudflare managed preamble in the
test fixture is permitted, and learner-resource access must still pass. Any changed
provider preamble requires review. All other bodies, including every
pinned release and packet, require exact bytes. A failed P0 check halts rollout. Disable the legacy
redirect switch first; restore a known-good Worker version separately if needed.

Style audits target the exact configured canonical origin and reject redirect
responses. The workflow's optional `verify_live` input is for an already approved
deployed release; pull requests and source pushes run local checks without making
live acceptance claims. The workflow does not deploy.

## True agent smoke matrix: pending release

Use a real network-capable model/tool client. Have it retrieve the URL itself and
identify the resource's title, version or a specific instruction from the returned
body. Pasting a file into chat, browser appearance, curl or a mocked fetch cannot
establish `live-agent` evidence. Do not infer one provider's result for another.

| Address | Resources | Required evidence |
| --- | --- | --- |
| New canonical host | Current Starter Pack, Computer Setup, Quick Build `SKILL.md`; agent catalog/start; linked setup resource | Agent consumes correct current body and follows a real resource link |
| Old host | Same current skills; representative numbered skill; every old hash packet via HTTP; representative hash packet via agent | Direct 200 body without cross-host redirect; pinned SHA matches |
| Workers fallback | Current Starter Pack skill, catalog and startup packet | Independent fallback body consumed; no new canonical SEO claim |
| Raw GitHub | Exact hashed packet URL from the built catalog's bootstrap field | Exact original repository/path, body consumed, expected hash |
| Old host downloads | Explicit Workbench `index.html`, slash and extensionless aliases; catalog | Direct byte/hash, attachment headers and CORS; agent fetch result where supported |

For each attempt record timestamp, client/provider/tool identity, URL, direct
status/final URL when exposed, expected and observed content marker/hash, linked
resource result, and precise failure. Distinguish `source`, `local`, `live-http`,
`live-agent`, and `owner-ux`. A tool's refusal or inaccessible-network result is
that tool's limitation until other evidence establishes a site problem. Record
unknowns explicitly; HTTP 200 alone is insufficient.

## Release receipt

- Approved source SHA and build; owner approval scope/time.
- Worker version and exact host routes; redirect switch value.
- Source/local results and live HTTP results, each with their own timestamp.
- All old pinned hashes, types, HEAD and no-redirect assertions.
- Agent smoke matrix results per client; failures and untested cells.
- Owner desktop/phone acceptance; separately authorized feedback receipt.
- Analytics and Search Console status, including pending owner work.
- Rollback controls and postrelease observations.

Never publish credentials, private provider payloads, personal feedback or learner
progress in receipts. Live gates remain pending until actually executed.
