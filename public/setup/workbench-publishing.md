# Optional: host your Workbench behind Cloudflare Access

Computer Setup prepares your downloaded Workbench for local use. Hosting it is optional and lower priority than deploying your instant app. Keep using the local viewer if hosting would interrupt your build; it does not block a phase or Computer Setup.

If you only want phone access over your existing private network, consider the separately approved [Tailscale Serve snapshot](https://starter.devthomas.site/setup/private-workbench.md). That path does not require a public hostname or Cloudflare Access email. Do not substitute Funnel or public deployment for private-network viewing. Choose one intended route rather than enabling both automatically.

This recipe gives your agent a repeatable way to host a read-only progress snapshot on a custom domain behind Cloudflare Access. The address is reachable on the Internet, but the viewer and its JSON require your approved sign-in. Your required private progress repository stays private. A separate hosting repository is optional: Wrangler can deploy a local staging folder directly.

## Choose the destination and sign-in

Before creating resources, reuse any approval already recorded and confirm the remaining choices: the Cloudflare account, an unused hostname on a domain you control, the exact email allowed to view it, and any costs. Use a dedicated hostname such as `workbench.example.com`; replace that example with your confirmed domain. Do not reuse your public app's hostname or change an unrelated service.

Read `choices.development_email.access_email` from your progress. If absent, propose `choices.development_email.notification_email`, then `choices.development_email.account_email`. These are candidates until you confirm the intended Access identity. Check that you can receive its sign-in email. Do not overwrite the other addresses: different services may use different emails, and multiple explicit service overrides are fine. If you want more than one viewer identity, confirm each exact email separately.

Your agent should inspect existing Workers, domain routes and Access applications before making changes. Reuse the dedicated Workbench resources on later runs. Keep Cloudflare authentication, API tokens, OTP codes and session cookies outside progress files and deployment assets.

## 1. Prepare a harmless first deployment

Create a separate deployment workspace with an `assets` folder. Initially put only these files inside it:

- `index.html`: a public-safe placeholder saying the private Workbench is being prepared.
- `starter-progress.json`: a public-safe probe such as `{"access_probe":true}`. Use this exact path because the viewer will fetch `./starter-progress.json`.
- `_headers`: the response configuration shown below.

Do not copy your actual progress yet. Never use the progress repository itself as the assets directory. Exclude `.git`, setup state, notes, attachments, logs, backups, credentials and unrelated files. A private GitHub repository does not make its deployed files private.

Use Workers Static Assets with a custom domain. This illustrative `wrangler.jsonc` belongs beside `assets`, not inside it. Replace the name and domain, and use a compatibility date supported by your installed Wrangler:

```json
{
  "name": "learner-workbench",
  "compatibility_date": "2026-09-09",
  "workers_dev": false,
  "preview_urls": false,
  "routes": [
    { "pattern": "workbench.example.com", "custom_domain": true }
  ],
  "assets": {
    "directory": "./assets"
  }
}
```

Cloudflare provisions the Worker custom-domain route and certificate. Use a domain in the intended Cloudflare account and resolve existing hostname conflicts before deploying. See [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) and [Static Assets configuration](https://developers.cloudflare.com/workers/static-assets/binding/).

Keep both URL flags explicitly false in the deployment configuration. Dashboard-only changes can be undone by a later Wrangler deployment. Inventory and remove unintended alternative routes; do not publish this snapshot through another Worker, Pages project, bucket or public download URL. [Disable workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) and [disable versioned and aliased preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/).

Put this in `assets/_headers` to prevent browser storage and indexing of the served snapshot:

```text
/*
  Cache-Control: private, no-store
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
```

These headers complement Access; they do not authenticate anyone. If you later add Worker code that generates responses, set the headers on those responses too. [Workers static-asset headers](https://developers.cloudflare.com/workers/static-assets/headers/).

## 2. Protect the entire hostname

Create or update a Cloudflare Access **Self-hosted** application for the exact Workbench hostname. Leave the application path empty so protection covers `/`, `/index.html`, `/starter-progress.json` and every other path. Inspect overlapping applications: a more specific path must not introduce a weaker policy. See [self-hosted Access applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

Create an **Allow** policy using **Include > Emails** with only the confirmed exact email addresses. Do not use Everyone, a whole email domain, Bypass, or a login-method-only rule. Keep the allowlist narrow; unlisted identities must not receive access. [Common Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/common-policies/).

Enable **One-time PIN** as a login method if you choose email codes. New Zero Trust organizations do not necessarily have it enabled. Alternatively, use an existing approved identity provider that authenticates the confirmed email. A Cloudflare account login email does not automatically become the viewer's allowed identity. Follow [One-time PIN setup](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).

Configure Access before uploading private data. Deploy only the harmless placeholder with the approved hostname and disabled alternate URLs, using the available authenticated tooling. With Wrangler, run from the deployment workspace:

```text
npx wrangler deploy --config wrangler.jsonc
```

## 3. Verify protection before replacing the probe

Record these checks against the harmless deployment first:

- With no cookies or authorization headers, request `/`, `/index.html` and `/starter-progress.json`. Each must challenge through the expected Cloudflare Access login or deny access. Inspect the response and redirect destination: an unrelated error, missing route or successful login-page fetch is not proof that Access protects the resource. The placeholder and probe bytes must not be returned.
- In a fresh browser session, sign in as the confirmed allowed email. Verify the placeholder and the JSON probe both load successfully. Let the learner enter the OTP or complete provider sign-in privately. A successful sign-in alone does not prove the JSON route works.
- Check the actual Worker production `workers.dev` URL and any known versioned or aliased preview URLs. They must be disabled and must not serve the assets. Also confirm both controls in **Workers & Pages > your Worker > Settings > Domains & Routes**, and review all configured custom domains/routes.

For a signed-out HTTP check, use curl without stored cookies and without following redirects. On Windows use `curl.exe`; on macOS/Linux use `curl`:

```text
curl -sS -D - -o /dev/null https://workbench.example.com/starter-progress.json
```

Use `-o NUL` instead of `-o /dev/null` on Windows. Never put an authenticated cookie or OTP in the check transcript. Keep actual response inspection local if it contains personal details.

If either the sign-out block or allowed-email check fails, keep the harmless deployment in place and fix the configuration. If the learner cannot complete sign-in now, record the pending check and continue using the local Workbench. Do not upload private JSON on the strength of configuration alone.

## 4. Publish the reviewed snapshot

Once the protection checks pass, replace the placeholder with the verified Workbench `index.html`, preserving the learner's original/customized file. Generate an explicitly approved progress projection as `starter-progress.json` alongside it; do not copy the full canonical record by default. Follow the [snapshot field allowlist](https://starter.devthomas.site/setup/private-workbench.md#build-a-separate-allowlisted-snapshot): retain the valid version/timestamp/phase and approved known step statuses, omit private identifiers, email/auth metadata, local paths, unknown extensions and unrelated artifacts unless individually reviewed and approved. Validate the projection without inventing outcomes. The private canonical file stays unchanged.

Retain `_headers`; enumerate the complete staging file list, including hidden entries, before deploying. Only the reviewed files belong there: no `.git`, `.env`, reports, symlinks, junctions, directory copies or backups. Do not add files merely because they are nearby. Inspect without printing personal contents into public logs. With authorized access, verify private/unlisted paths and raw traversal probes cannot return private data or directory listings. A login challenge alone is not proof that the post-login asset boundary is safe.

Deploy the same workspace to the same protected Worker. Repeat the signed-out root and JSON checks and the alternate-URL checks. In the allowed-email session, confirm the viewer loads the intended snapshot and its current progress. If a private response is exposed, disable the serving route immediately, restore the harmless assets, and investigate before another upload; do not remove Access while private assets remain deployed.

The hosted copy is a snapshot, not a writable progress database or automatic GitHub sync. Your companion continues updating the canonical private progress files. Refresh hosting deliberately by repeating the allowlist, protection and deployment checks. The viewer's optional public curriculum metadata request must remain an anonymous read; never attach progress, emails, tokens or private repository identifiers to it.

Save the hostname, selected identity, Worker and Access application references, deployed snapshot revision/time, and verification results in your private progress notes. Preserve the original email choices. Label owner-reported sign-in checks as reported, and leave any unfinished checks explicitly pending. If you later retire hosting, disable its routes before removing Access; your local Workbench and private progress repository remain usable.

Cloudflare documentation checked September 9, 2026. Recheck the linked provider instructions when repeating setup after a platform change.
