# Host routing contract

The existing `starter-pack` Worker remains the application. `src/site-origin.json`
defines the canonical, legacy and Workers origins. `src/reading-routes.ts` supplies
the same reading-page list to content generation and the Worker; public owned
skill lessons extend that list. The local integration test checks that the list
equals the actual built HTML inventory, excluding the 404 and Workbench download.

## Source preparation and activation

`LEGACY_HUMAN_REDIRECTS` defaults to `disabled`. Only the exact value `enabled`
activates old-origin GET/HEAD reading-page redirects. A domain attachment does
not enable redirects. Production deployment and switch changes require the
owner's separate release approval.

The Worker constructs a fixed canonical destination, preserving the requested
path and query. Reading-page extensionless, trailing-slash and `.html` aliases
serve HTML directly on the destination, so recognized legacy aliases take one
301 hop. API routing precedes page routing. Unknown paths stay 404 and unsupported
non-API methods return 405. Forwarded host headers and query destinations never
select a redirect host.

Static `html_handling: none` prevents the platform from redirecting explicit
Workbench `index.html`. The Worker maps its extensionless and slash aliases to
that exact asset internally. All three return the same attachment bytes and
headers. Other machine resources pass through the assets binding unchanged.
Do not introduce `_redirects`: those rules cannot express the hostname boundary.

Cloudflare normalizes percent-encoded URL paths before Worker dispatch. The local
runtime returns a same-host 307 for `/%67uide`; the Worker does not pretend that
noncanonical spelling is an exact reading-route match. The one-hop contract
covers the published route inventory and its explicit aliases.

## Cost and rollback

The proposed configuration runs the Worker first on all paths so both hosts use
the same explicit routing and method policy. Each asset request therefore adds
one Worker invocation compared with asset-first serving; an assets-binding fetch
does not cause a recursive public-host request. For R formerly asset-only
requests, the incremental request volume is R. Traffic and remaining account
allowance have not been measured, so an actual bill estimate is pending release
review. Free-plan Worker quota exhaustion can affect these paths. This tradeoff
must be reviewed before deployment; host-filtered edge rules or selective
Worker-first patterns are alternatives if measured traffic warrants them.

Disable only `LEGACY_HUMAN_REDIRECTS` first to restore legacy reading pages.
Restore a known-good Worker version separately only when required. Permanent
redirects can be cached by clients; disabling the switch cannot recall a cached
301. Never remove old packets or numbered skill releases during rollback.

Platform references, checked 2026-10-15:

- [HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [Worker-first routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- [Assets billing and limits](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

## Verification

Run `npm run check`. Its `test:routes` group bundles the actual Worker and uses
the installed Wrangler configuration with Miniflare's real static-assets pipeline.
It checks every built public asset's GET bytes and HEAD, all reading routes and
aliases, exact redirect targets, fallback hosts, downloads, catalog CORS, 404/405,
API dispatch and the disabled switch. It never deploys or calls Make.
