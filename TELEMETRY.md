# Feedback and telemetry release checks

Feedback accepts exactly the three HTTPS origins in `src/site-origin.json`.
The request URL origin and `Origin` header must match each other and the allowlist.
Sibling subdomains, alternate ports, HTTP, missing or `null` Origin, forwarded
host headers and cross-host pairs cannot authorize a request. The API never adds
wildcard CORS. Cached legacy pages retain their same-host POST endpoint.

`FEEDBACK_WEBHOOK_URL`, the Make scenario, fixed recipient and
`starter@devthomas.site` stay unchanged. Unit tests use synthetic messages and a
mock transport. No real notification or analytics configuration change is part
of source preparation. Keep request bodies, email addresses and webhook URLs out
of logs and release receipts.

## Web Analytics: pending owner-authorized verification

The build reads the existing public beacon identifier from `analytics.json` (or
the existing build-variable override) and inserts Cloudflare's deferred beacon
script into every generated reading page. It does not select a hostname in
source. The identifier is preserved; no GA4 or new tracking is introduced.
Presence of a tag does not prove that its registered site covers the new host.

Before release, inspect the existing Cloudflare Web Analytics site registration
and its hostname/automatic-injection settings with the owner-authorized account.
If new-host coverage requires an adjustment, prepare the minimum change and obtain
specific approval before applying it. Preserve legacy reporting during the
observation period. After release, verify one beacon per human page and actual
new-host reporting. Record unavailable provider access or missing observations as
pending; do not claim success from a built tag alone.

## Workbench catalog CORS

Only the anonymous public `/artifacts/progress-workbench/catalog.json` uses
`Access-Control-Allow-Origin: *`. Its generated content contains task labels and
public URLs, not learner progress. The downloadable local Workbench needs this
cross-origin read. The Worker/static-assets integration test verifies that header
and direct download bytes. Keep feedback and private learner state outside that
CORS policy.

## Controlled live feedback: separate approval

After production release, obtain explicit approval for one synthetic live
submission. Verify the Make JSON acknowledgement and the intended mailbox's
receipt, without committing message content or private provider responses.
Do not infer delivery from HTTP acceptance, a mocked test, or a successful page.
