# Starter Pack

[Starter Pack](https://starter.uppercut-labs.com) is a free course from Uppercut Labs for making and deploying software with your own AI agent. Your agent follows the course with you and keeps your progress in a file you own. There is no Starter Pack account, and the site stores no learner data.

The course has three phases:

1. **Phase 1:** set up an AI app on your phone and the free accounts you need, then make your first working app.
2. **Phase 2:** set up your computer, plan a project with your agent and deploy it.
3. **Phase 3 (optional):** make your software usable by other agents, from a discoverable website up to a full agent-native interface.

## Start the course

Open [starter.uppercut-labs.com](https://starter.uppercut-labs.com) and copy the starting prompt into the AI app you use. Your agent takes it from there.

### Claude Code plugin

The `starterpack` plugin bundles the course companion, Computer Setup, Grill to Build, Quick Build and the rest of the public Uppercut Labs skills, plus the read-only Starter Pack MCP server.

```sh
claude plugin marketplace add devin-thomas/starter-pack
claude plugin install starterpack@starterpack
```

Then run `/starterpack:start` to begin or resume the course. In Claude on the web or desktop (paid plans), add the same marketplace under **Customize > Plugins > Add > Add marketplace**.

### Other agents

Any MCP client can connect to `https://starter.uppercut-labs.com/mcp`. It is read-only and needs no sign-in. It answers what each phase requires, what to do next and which skills are available.

## Style guides

The site publishes coding style guides your agent can follow: [TypeScript](https://starter.uppercut-labs.com/style/TypeScript), [JavaScript](https://starter.uppercut-labs.com/style/JavaScript), [React + TypeScript](https://starter.uppercut-labs.com/style/React-TypeScript), [Python](https://starter.uppercut-labs.com/style/Python), [Rust](https://starter.uppercut-labs.com/style/Rust), [Swift + SwiftUI](https://starter.uppercut-labs.com/style/Swift-SwiftUI), [Dart + Flutter](https://starter.uppercut-labs.com/style/Dart-Flutter), [Kotlin](https://starter.uppercut-labs.com/style/Kotlin) and [Godot](https://starter.uppercut-labs.com/style/Godot). Each page also has Markdown and JSON versions for agents, for example `/style/TypeScript.md` and `/style/TypeScript.json`, and `/style/catalog.json` lists them all.

## Report a problem

Found a confusing step or something that doesn't work? [Open an issue](https://github.com/devin-thomas/starter-pack/issues/new?template=bug_report.yml) with the page or phase, what you tried, and your device, browser and AI app. Issues are public, so leave out your progress file, conversations, account details and credentials.

For private feedback, feature requests or a project you'd like to share, use the [contact form](https://starter.uppercut-labs.com/contact) or email starter@uppercut-labs.com.

## What's in this repository

| Path | Contents |
| --- | --- |
| `content/` | Course text: phases, lessons, pages, style guides and the requirement registry (`workbench-steps.json`) |
| `public/` | Files served as-is: hosted skills and their numbered releases, startup packets, templates, schemas and setup guides |
| `src/` | The website, the Cloudflare Worker that serves it, the MCP server, the contact form handler and the Progress Workbench |
| `scripts/` | The site build, content checks and tests |
| `skills/`, `commands/`, `.claude-plugin/` | The `starterpack` Claude Code plugin; [STARTERPACK-SOURCES.md](STARTERPACK-SOURCES.md) records where each bundled skill comes from |
| `examples/` | `lantern-tools`, the command-line example for the Phase 3 Level 2 lessons |

## Run it locally

You need Node.js 24 or newer.

```sh
npm ci
npm run dev
```

`npm run check` runs the tests, the full build and the link and style checks. The build writes every page as HTML, Markdown and JSON into `dist/`, which is not committed.

A few parts of the repository change in specific ways:

- **Skill releases** are never edited after release. A change to a hosted skill adds a new numbered folder under `public/skills/<id>/`, updates `current/` and `public/skills/versions.json`, and refreshes the skill's `dvn.json` hashes.
- **Startup packets** in `public/agent/packets/` are named by content hash and kept for learners who already started. After changing any packet source, run `npm run prepare:startup` and commit the new packet with the updated prompt.
- **The plugin bundle** is rebuilt with `scripts/build-starterpack-plugin.mjs`, which records every bundled file in `starterpack.lock.json`.

Changes merged to `main` deploy to the live site automatically.

## License

Copyright (c) 2026 Devin Thomas. All rights reserved. You may read, reference and follow Starter Pack for your own learning. You may not resell, commercially reuse, redistribute or publish a copied or adapted version of the course without written permission. See [LICENSE](LICENSE) for the full terms, including your rights to the projects you build. The source is public, but this is not an open-source project.

## Icon credits

The site includes a small set of SVG icons from Lucide (ISC and MIT), Lobe Icons (MIT) and Simple Icons (CC0). Provider marks identify their own products. Sources, licenses and file hashes are in [`public/icons/interface`](public/icons/interface) and [`public/icons/brands`](public/icons/brands).
