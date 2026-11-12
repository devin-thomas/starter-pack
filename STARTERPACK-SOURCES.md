# starterpack Claude Code plugin — source provenance

The `starterpack` Claude Code plugin assembles existing **public** agent skills.
It does not relicense the Starter Pack course or the public skill authors' work.

| Source | Material | Reviewed revision |
| --- | --- | --- |
| `devin-thomas/starter-pack` | Current curriculum Starter Pack and Computer Setup | Local release source; versions recorded under `public/skills/versions.json` |
| `devin-thomas/skills` | Seventeen reusable public skill roots with their local references, assets, templates and scripts, including Grill to Build and Quick Build | `f078c00b15bfe3e14f3e81937f8e70647eb4f326` (provisional: head of `devin-thomas/skills` PR #7, not yet merged; see `scripts/starterpack-sources.json`) |
| `devin-thomas/vid-chopper` | Public `vidchopper-cli` skill and supporting files | `428963b6db87e47f98209c92bc59aca41b5f997a` |

The skill inventory is the 20 public catalog skills. There is one Grill to
Build and one Quick Build: the bundled copies are byte-identical to what the
course serves at `/skills/grill-to-build/current/` and
`/skills/quick-build/current/`, and both come from the same pinned
`devin-thomas/skills` commit. Course-specific Phase 2 planning rules live in
the Phase 2 planning reference (`/phases/2/planning.md`), not in a skill. No
bundled skill is adapted; the plugin's `/starterpack:start` command is the
only release-specific integration material.

The exact contents of all bundled files are recorded in
[`starterpack.lock.json`](starterpack.lock.json) using Git blob hashes. The
maintainer-only `scripts/build-starterpack-plugin.mjs` imports reviewed local
checkouts. It does not run at install time. Source revisions, permissions, and
external applications are not updated automatically.

Source licenses and notices apply as provided by their original repositories
and files. The Starter Pack's [LICENSE](LICENSE) remains authoritative for
the course; the existence of a Claude plugin is not a blanket open-source
license or permission to republish the curriculum under a new name. No keys,
personal progress, private settings or machine-specific paths are bundled.

Before publication, run the strict offline bundle check and a native Claude
Code plugin validator, then verify a real installation and learner handoff.
Passing a source check does not prove a deployed application works.
