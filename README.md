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

Each phase includes lessons adapted from Devin's projects: Domain Expansion, Daily Combo Trials, and Perfect Playlist. The stories and practice prompts live beside the relevant phase steps in canonical Markdown and appear in the generated HTML, Markdown, and JSON. The agent catalog links directly to each lesson. Phase 3 remains a preview.

## Progress Workbench

The [templates page](https://starter.devthomas.site/artifacts) provides a downloadable, self-contained HTML viewer. Learners use it locally beside their canonical progress JSON; the Starter Pack site does not accept or personalize itself with that data. Computer Setup assembles the viewer and serves it on loopback as soon as Python is ready. Viewer use is not a completion gate.

Source lives in `src/workbench/`; `scripts/workbench.ts` builds the single HTML file with embedded styles, Geist font/license, vanilla JavaScript, guide labels, and validation compiled from the progress schema. Learners need no build tools. The public catalog contains guide metadata only and allows anonymous cross-origin reads. The template response is an attachment, with a shared-host guard as a fallback. `npm run check` includes focused Workbench contract tests. Agent lifecycle and optional Cloudflare Access hosting instructions are in `public/artifacts/progress-workbench/README.md` and `public/setup/workbench-publishing.md`.

## Icon artwork

The site vendors a small SVG selection from Lucide (ISC/MIT), Lobe Icons (MIT), and Simple Icons (CC0). Provider marks identify their respective products. Original colors and shapes are preserved; names remain visible alongside decorative marks.

Sources, revisions, exact bytes, SHA-256 hashes, and license notices are in [`public/icons/interface`](public/icons/interface) and [`public/icons/brands`](public/icons/brands). The 35 SVGs total 25,225 bytes; including manifests and notices, the icon directories total 57,640 bytes. No external icon CDN or full icon library is required. Deployment verification checks every published SVG against its recorded hash.
