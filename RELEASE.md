# Owner-gated release and rollback

This is prepared source. Do not run production commands until the owner records
approval for the exact source revision, existing `starter-pack` Worker, new custom
domain attachment and redirect stage. A successful PR build is not release approval.

## Stop before deployment when

- The authorized account differs from the account owning either zone or Worker.
- The new hostname has a conflicting DNS record, route, wildcard route or custom
  domain pointing elsewhere. Do not overwrite it or create another Worker.
- Worker identity, bindings, secrets, existing domain or Workers fallback differ
  from the reviewed inventory. Reconcile before deploying.
- Tests fail, pinned files change, source differs from the approved revision, or
  ordinary DNS/TLS/HTTP cannot establish the new hostname's readiness.
- Worker-first request volume/quota is unacceptable. This source invokes the
  Worker for every request; review the tradeoff in `ROUTING.md` before approval.

## Stage 1: attach the new domain, redirects off

1. Obtain approval and capture fresh Git state, Cloudflare account/zone identity,
   exact DNS/routes/custom domains, certificate status and active Worker version.
   Read secrets by binding name only. Recheck immediately before the write.
2. Build/check the approved revision. Review `wrangler.jsonc`: same Worker,
   both old and new custom domains, Workers fallback enabled, unchanged rate
   limiter namespaces/limits and assets binding, redirect switch `disabled`.
3. After approval, deploy that exact source with `npx wrangler deploy`. The custom
   domain route may create DNS/certificate state; do not create a separate CNAME
   manually or treat a zone wildcard certificate as tested hostname TLS.
4. Run the new-host and Workers verifiers and legacy `--before-redirects` check
   from `RELEASE-VERIFICATION.md`, plus the real-agent smoke matrix. Use normal
   DNS/TLS and exact body/hash/type receipts. Keep old reading pages usable.

## Stage 2: enable only legacy human redirects

Only after the Stage 1 P0 results pass and the owner approves this stage, deploy
the same tested revision with `npx wrangler deploy --var LEGACY_HUMAN_REDIRECTS:enabled`.
Record the override and resulting version; the checked-in default stays disabled.
Run the distinct legacy verifier, canonical/fallback checks and real-agent probes
again. Any P0 failure halts rollout. Do not update consumers first.

Company showcase publication, analytics/Search Console configuration and a real
Make/Gmail feedback test require their respective approval and acceptance. They
are not implied by either Worker deployment. Do not send real feedback during
source or mocked verification.

## Rollback order

1. From the exact approved source and account, disable only the old-human redirect
   switch: `npx wrangler deploy --var LEGACY_HUMAN_REDIRECTS:disabled`. Retest old
   human usability and direct machine GET/HEAD before further changes. This keeps
   the new hostname attached and does not delete additive files.
2. If source restoration is also required, inspect the saved known-good version's
   availability, bindings and domain behavior before `npx wrangler rollback VERSION_ID`.
   Substitute the verified ID from the fresh private release receipt. Do not guess
   the newest version or delete newly added packets/numbered releases.
3. Re-read live domains and deployment state. Verify legacy humans, all old pinned
   bytes, feedback security and Workers fallback. Report new-host availability
   honestly; preserve existing custom domains unless a separate rollback decision
   authorizes changing them.
4. Permanent redirects already cached by a client cannot be recalled by disabling
   the switch. Record that limit and observe old/new traffic before closure.

`npx wrangler deploy --dry-run --outdir PATH` validates bundling/configuration
without activation. It does not prove production permissions, hostname TLS,
real-agent acceptance or that a previous version is safe to restore. Keep bundles
and raw provider responses outside Git; save only sanitized release receipts.
