# Search and discovery release checklist

Status: source prepared; Search Console and analytics actions are pending.
No provider settings or production redirects were changed by this document.

## Exact page mapping

The generated sitemap and shared reading-route inventory define all 37 indexable
pages. Each legacy reading URL maps to the same path and query on the new origin.
Known slash and `.html` aliases are also served in one hop. The local Worker test
checks the destination's canonical tag as well as status and content type.
Unknown paths remain 404. The new origin self-canonicalizes; the Workers fallback
uses the new origin's canonical tags instead of becoming a competing primary.

Human GET/HEAD redirects use **301**. Both 301 and 308 are permanent redirects for
Google Search, but the current Change of Address tool specifically asks for 301
pre-work. This source selects 301 to match that documented prerequisite. The
redirect switch still defaults off. API POSTs and machine/download resources
remain outside the human redirect list; do not use a full-host catch-all.
[Google redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects),
[Change of Address requirements](https://support.google.com/webmasters/answer/9370220?hl=en).

`seo-migration.test.ts` requires a unique canonical and sitemap entry for every
reading page, one new-origin robots sitemap pointer, coherent llms addresses and
the existing Google-Extended learner-resource policy. It rejects machine overlap
and competing legacy/Workers canonicals. Frozen skills and hash packets keep
their historical bytes; a search migration must not rewrite them.

## Owner actions after live acceptance

1. Verify ownership of the old and new host-level Search Console properties in
   the same authorized Google account. Inspect existing verification first; do
   not create DNS records or change access without approval. Scope the move to
   Starter Pack's subdomain, not all of `devthomas.site` or unrelated company apps.
2. After the approved Worker cutover, verify normal DNS/TLS, new self-canonicals,
   sitemap and robots. Run the distinct old-host direct-resource and human-301
   checks. Inspect representative new URLs and their old equivalents.
3. With separate Search Console authorization, use the old property's Change of
   Address tool and select the verified new host. Resolve critical prechecks
   before submission; record noncritical warnings. Review applicable hostname
   variants without inventing redirects for unrelated sites. Keep submission
   receipt/time and exact property identities in the private release record.
4. Submit `https://starter.uppercut-labs.com/sitemap.xml` to the new property.
   Observe indexing, selected canonicals and crawl errors. A successful sitemap
   submission is not proof that Google has indexed the move. Follow the current
   provider guidance for retention; the compatibility contract keeps old machine
   resources available regardless of search timing.
5. Inspect existing Cloudflare Web Analytics registration and new-host coverage
   using `TELEMETRY.md`. The current beacon identifier remains unchanged. Apply
   only an approved minimal provider adjustment and record observed reporting.
   Keep Search Console, analytics and real feedback approval separate.

These steps follow the [Change of Address tool](https://support.google.com/webmasters/answer/9370220?hl=en)
and [Google's site-move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes),
checked 2026-10-15. Recheck the provider UI and requirements at execution time.

## Evidence still required

- Approved production version, host routes and redirect-switch value.
- New/old/fallback live HTTP results, all pinned hashes and true-agent fetches.
- Owner phone/desktop acceptance and separately approved feedback delivery.
- Search Console ownership, move/sitemap receipts or explicit owner deferral.
- Web Analytics hostname coverage and observations or explicit owner deferral.

Source tests passing does not complete these external actions. If a P0 check
fails, halt the move and follow `RELEASE.md` before consumer-link updates.
