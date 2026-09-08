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

## Icon artwork

The site vendors a small SVG selection from Lucide (ISC/MIT), Lobe Icons (MIT), and Simple Icons (CC0). Provider marks identify their respective products. Original colors and shapes are preserved; names remain visible alongside decorative marks.

Sources, revisions, exact bytes, SHA-256 hashes, and license notices are in [`public/icons/interface`](public/icons/interface) and [`public/icons/brands`](public/icons/brands). The 35 SVGs total 25,225 bytes; including manifests and notices, the icon directories total 57,640 bytes. No external icon CDN or full icon library is required. Deployment verification checks every published SVG against its recorded hash.
