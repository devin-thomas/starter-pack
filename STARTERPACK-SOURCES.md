# starterpack plugin sources

The `starterpack` Claude Code plugin bundles existing public skills. It does not relicense the Starter Pack course or the work of the skills' authors.

| Source | Material | Revision |
| --- | --- | --- |
| `devin-thomas/starter-pack` | The Starter Pack companion and Computer Setup | This repository; versions are listed in `public/skills/versions.json` |
| `devin-thomas/skills` | Sixteen public skills with their references, assets, templates and scripts, including Grill to Build and Quick Build | `f078c00b15bfe3e14f3e81937f8e70647eb4f326` |
| `devin-thomas/vid-chopper` | The `vidchopper-cli` skill and its supporting files | `428963b6db87e47f98209c92bc59aca41b5f997a` |

The plugin contains the 19 skills of the public catalog. Its Grill to Build and Quick Build are byte-identical to the copies the site serves at `/skills/grill-to-build/current/` and `/skills/quick-build/current/`. The Phase 2 course rules for planning are in the [Phase 2 planning reference](https://starter.uppercut-labs.com/phases/2/planning), not in a skill. No bundled skill is modified; the `/starterpack:start` command is the only file written for the plugin.

[`starterpack.lock.json`](starterpack.lock.json) records every bundled file by its Git blob hash. `scripts/build-starterpack-plugin.mjs` rebuilds the bundle from local checkouts of the pinned revisions; it never runs at install time, and installing the plugin does not update sources or install software.

Each source's license and notices apply as provided in its repository. The Starter Pack [LICENSE](LICENSE) governs the course. The plugin contains no keys, personal progress, private settings or machine-specific paths.
