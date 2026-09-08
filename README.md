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

The same deployment is also available at [the direct Cloudflare address](https://starter-pack.uppercut-labs.workers.dev). To recheck the primary domain without redeploying, run `npm run verify:deployment`.

Public curriculum is in `content/`. Hosted skills, templates, and agent instructions are in `public/`. The website never accepts or stores learner progress, credentials, or project ideas.
