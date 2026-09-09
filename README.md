# Starter Pack

A free guide from Devin Thomas at Uppercut Labs for making and deploying software with your own AI agent. No Starter Pack account or learner database.

Visit [Starter Pack](https://starter.devthomas.site).

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

## Deploy

Authenticate Wrangler to the Cloudflare account that owns the configured domain, then run `npm run deploy`. This also checks the site through the computer's normal DNS resolver; unresolved DNS is a failed release check even when the upload succeeded.

To recheck the domain without redeploying, run `npm run verify:deployment`.

Public curriculum is in `content/`. Hosted skills, templates, and agent instructions are in `public/`. The website never accepts or stores learner progress, credentials, or project ideas.

Startup instructions try the custom domain, the Workers hostname, then the public GitHub source before asking for manual content. The starting-prompt section offers a copyable/downloadable Phase 1 instruction packet generated from the canonical companion, curriculum and progress files. A packet supports starting Phase 1 without URL fetching; it does not replace later-phase instructions or authorize resetting progress.

Cloudflare can prepend managed robots rules to the generated file. `scripts/crawler-policy.ts` explicitly allows Google-Extended only on public curriculum/resource paths so those instructions remain eligible for Gemini grounding. Google uses this control for training as well as grounding. The production check parses the combined live robots rules and verifies the startup packet and prompt bytes; a successful check does not prove any specific chat app can fetch them. Do not disable unrelated WAF or bot protections to make a smoke test pass.

Gemini and Spark are not supported for this pack after the owner's final test. Prompts stop those chats and point to recommendations. Claude is the Phase 1 default; the owner's Sonnet 4.6 Medium baseline stayed within the free allowance in testing. Antigravity and Google AI Studio keep their separate roles. The Vercel packet at `https://starter-pack-agent.vercel.app/agent/phase-1-packet.txt` records the same unsupported status; do not offer it as another Google workaround.

To refresh the mirror, first run `npm run check`, then `npx tsx scripts/deploy-agent-mirror.ts --prepare`. Link only `.generated/agent-mirror` to the `starter-pack-agent` project in the `devint` Vercel team. Run `npx tsx scripts/deploy-agent-mirror.ts --deploy` through the authenticated `devin-thomas` account, or `--verify` to compare the live snapshot with the current build without deploying. The script deploys an explicit five-file public payload and checks unauthenticated access, plain-text headers and exact packet bytes. Generated output and Vercel link state stay ignored; the main site still deploys exclusively through its existing Cloudflare configuration. Normal site deployment does not silently refresh this experimental snapshot.

Each phase includes lessons adapted from Devin's projects: Domain Expansion, Daily Combo Trials, and Perfect Playlist. The stories and practice prompts live beside the relevant phase steps in canonical Markdown and appear in the generated HTML, Markdown, and JSON. The agent catalog links directly to each lesson. Phase 3 remains a preview.

## Progress Workbench

The [templates page](https://starter.devthomas.site/artifacts) provides a downloadable, self-contained HTML viewer. Learners use it locally beside their canonical progress JSON; the Starter Pack site does not accept or personalize itself with that data. Computer Setup assembles the viewer and serves it on loopback as soon as Python is ready. Viewer use is not a completion gate.

Source lives in `src/workbench/`; `scripts/workbench.ts` builds the single HTML file with embedded styles, Geist font/license, vanilla JavaScript, guide labels, and validation compiled from the progress schema. Learners need no build tools. The public catalog contains guide metadata only and allows anonymous cross-origin reads. The template response is an attachment, with a shared-host guard as a fallback. `npm run check` includes focused Workbench contract tests. Agent lifecycle and optional Cloudflare Access hosting instructions are in `public/artifacts/progress-workbench/README.md` and `public/setup/workbench-publishing.md`.

## Icon artwork

The site vendors a small SVG selection from Lucide (ISC/MIT), Lobe Icons (MIT), and Simple Icons (CC0). Provider marks identify their respective products. Original colors and shapes are preserved; names remain visible alongside decorative marks.

Sources, revisions, exact bytes, SHA-256 hashes, and license notices are in [`public/icons/interface`](public/icons/interface) and [`public/icons/brands`](public/icons/brands). The 35 SVGs total 25,225 bytes; including manifests and notices, the icon directories total 57,640 bytes. No external icon CDN or full icon library is required. Deployment verification checks every published SVG against its recorded hash.
