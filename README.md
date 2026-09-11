# Starter Pack

A free guide from Devin Thomas at Uppercut Labs for making and deploying software with your own AI agent. No Starter Pack account or learner database.

Visit [Starter Pack](https://starter.devthomas.site).

## Feedback

Found a confusing step or something that does not work? [Report a problem](https://github.com/devin-thomas/starter-pack/issues/new?template=bug_report.yml) with the page or phase, what you tried, and your device/browser/AI app. Reports are public: do not attach private progress files, conversations, account details, or credentials.

## Run locally

Use a current Node.js LTS release.

```sh
npm ci
npm run dev
```

## Build

```sh
npm run check
npm run preview
```

The build generates semantic HTML, focused Markdown and JSON, and an agent catalog from the public curriculum. `dist/` is generated and is not committed.

GitHub runs `npm ci` and `npm run check` on Node.js 24 for pushes to `main` and pull requests. These checks do not deploy the site; production deployment remains explicit.

## Deploy

Authenticate Wrangler to the Cloudflare account that owns the configured domain, then run `npm run deploy`. This also checks the site through the computer's normal DNS resolver; unresolved DNS is a failed release check even when the upload succeeded.

To recheck the domain without redeploying, run `npm run verify:deployment`.

Public curriculum is in `content/`. Hosted skills, templates, and agent instructions are in `public/`. The website never accepts or stores learner progress, credentials, or project ideas.

The short starting prompt reads a single GitHub-hosted Phase 1 packet containing the canonical companion, curriculum, progress guide, template and schema. Its filename includes a content hash and changes whenever those sources change. After editing packet sources, run `npm run prepare:startup`, then commit the new `public/agent/packets/` learner resource and updated prompt before deployment. These reviewed public learner releases are intentionally tracked; preserve earlier packets for existing sessions. `npm run check` rejects a stale packet or prompt. The starting-prompt section also offers the same packet for copy/download if fetching fails. Other resources retain the exact primary, Workers and GitHub links in the resource directory. A packet supports starting Phase 1 without URL fetching; it does not replace later-phase instructions or authorize resetting progress.

Cloudflare can prepend managed robots rules to the generated file. `scripts/crawler-policy.ts` explicitly allows Google-Extended only on public curriculum/resource paths so those instructions remain eligible for Gemini grounding. Google uses this control for training as well as grounding. The production check parses the combined live robots rules and verifies the startup packet and prompt bytes; a successful check does not prove any specific chat app can fetch them. Do not disable unrelated WAF or bot protections to make a smoke test pass.

Gemini is not supported for this pack after the owner's final test. Prompts stop those chats and point to recommendations. Free Claude Sonnet is a Phase 1 workaround for Antigravity users and those with untested or unsupported harnesses; the owner's Sonnet 4.6 Medium baseline stayed within the free allowance in testing. Antigravity and Google AI Studio keep their separate roles. The Vercel packet at `https://starter-pack-agent.vercel.app/agent/phase-1-packet.txt` records the same unsupported status; do not offer it as another Google workaround.

To refresh the mirror, first run `npm run check`, then `npx tsx scripts/deploy-agent-mirror.ts --prepare`. Link only `.generated/agent-mirror` to the `starter-pack-agent` project in the `devint` Vercel team. Run `npx tsx scripts/deploy-agent-mirror.ts --deploy` through the authenticated `devin-thomas` account, or `--verify` to compare the live snapshot with the current build without deploying. The script deploys an explicit five-file public payload and checks unauthenticated access, plain-text headers and exact packet bytes. Generated output and Vercel link state stay ignored; the main site still deploys exclusively through its existing Cloudflare configuration. Normal site deployment does not silently refresh this experimental snapshot.

Each phase includes lessons adapted from Devin's projects: Domain Expansion, Daily Combo Trials, and Perfect Playlist. The stories and practice prompts live beside the relevant phase steps in canonical Markdown and appear in the generated HTML, Markdown, and JSON. The agent catalog links directly to each lesson. Phase 3 remains a preview.

## Progress Workbench

The [templates page](https://starter.devthomas.site/artifacts) provides a downloadable, self-contained HTML viewer. Learners use it locally beside their canonical progress JSON; the Starter Pack site does not accept or personalize itself with that data. Computer Setup assembles the viewer and serves it on loopback as soon as Python is ready. Viewer use is not a completion gate.

Source lives in `src/workbench/`; `scripts/workbench.ts` builds the single HTML file with embedded styles, Geist font/license, vanilla JavaScript, guide labels, and validation compiled from the progress schema. Learners need no build tools. The public catalog contains guide metadata only and allows anonymous cross-origin reads. The template response is an attachment, with a shared-host guard as a fallback. `npm run check` includes focused Workbench contract tests. Agent lifecycle and optional Cloudflare Access hosting instructions are in `public/artifacts/progress-workbench/README.md` and `public/setup/workbench-publishing.md`.

Release 0.2.0 uses `content/workbench-steps.json` as the canonical requirement registry. Its validated phase gates, completion meanings, aliases and groups generate the public requirements resource, Workbench catalog/offline definitions, and the self-contained Phase 1 packet projection. Phase 3 remains preview-only. Recorded activity is separate from requirements; historical graduations retain their revision. The viewer accepts legacy OAuth sign-in notes, quarantines damaged core data, preserves a stale last-good copy on failed refresh, and offers sanitized diagnostics without writing progress or browser storage. Customized viewers receive side-by-side reviewed upgrades, not automatic replacement.

`npm run check` exercises synthetic progress/schema/registry/startup/setup contracts and the production build/link checks. It does not certify an actual phone chat, clean installer journey, harness subprocess, file round trip, or tailnet audience. Those require explicit human/device evidence. To check the built asset routing locally, run `npx wrangler dev --local --ip 127.0.0.1 --port 8792` in one terminal and `npx tsx scripts/verify-deployment.ts http://127.0.0.1:8792 --local` in another. Local mode skips the published GitHub packet fetch and is not deployment acceptance.

## Icon artwork

The site vendors a small SVG selection from Lucide (ISC/MIT), Lobe Icons (MIT), and Simple Icons (CC0). Provider marks identify their respective products. Original colors and shapes are preserved; names remain visible alongside decorative marks.

Sources, revisions, exact bytes, SHA-256 hashes, and license notices are in [`public/icons/interface`](public/icons/interface) and [`public/icons/brands`](public/icons/brands). The 35 SVGs total 25,225 bytes; including manifests and notices, the icon directories total 57,640 bytes. No external icon CDN or full icon library is required. Deployment verification checks every published SVG against its recorded hash.
