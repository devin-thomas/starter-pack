# Fix the failing capability, not the whole computer

Use this guide during [Computer Setup](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md) and for later selected tools. Preserve working installations, profiles, project configuration and lockfiles. Inspect the observed failure, propose a narrow repair, obtain approval for changes, then rerun the failing check and its affected contexts.

## Command resolution in each context

A successful install or one terminal's version output does not prove the agent can use the tool. For every applicable system/user CLI in the [manifest](https://starter.devthomas.site/setup/computer-setup.manifest.json), record:

| Context | Required check |
| --- | --- |
| Current shell | Ordinary command lookup resolves the intended installation; harmless version/capability command succeeds |
| New terminal | A genuinely newly launched terminal finds the persisted installation, without a one-off PATH prefix |
| IDE terminal | The selected editor's integrated terminal resolves and runs the applicable tools |
| Harness subprocess | The actual agent task/subprocess launch style resolves and runs them |
| Selected alternate shell/WSL | Test only the additional environment the workflow really uses; otherwise record not applicable |

On PowerShell use `Get-Command TOOL -All` and, for a binary, inspect `CommandType` and `Source`; `where.exe TOOL` can reveal duplicates. On macOS/Linux use `command -v TOOL` and `type -a TOOL`. Substitute actual commands such as `git`, `gh`, `node`, `npm`, `npx`, `uv`, `python` or the selected managed Python launcher, `rg`, `fd`, `jq`, `curl`, `tailscale`, and the selected harness CLI when applicable. Verify PowerShell 7 on Windows. Inspect aliases/shims rather than assuming the first match is a binary.

Run version checks without retrieving credentials. For Python, `uv python find` identifies an interpreter; invoke it with `--version` and verify the selected usable command/runner in each needed context. A deliberate absolute interpreter path is valid for the local viewer, but record it as scoped invocation, not global Python resolution.

For a project-local tool, use that project's package script or runner, such as `npm run build` or `pnpm exec TOOL --version`, with the existing manager. This tests dependency resolution without adding the project's `node_modules/.bin` to global PATH. Missing task dependencies are installed only when that task needs them.

### Save evidence in the existing setup record

Extend `capabilities[CAPABILITY_ID]` in `setup/computer.json`, not a new inventory database. Preserve prior fields. This partial example is a record shape, not a successful check to copy:

```json
{
  "status": "not_tested",
  "version": null,
  "resolved_path": null,
  "scope": null,
  "install_source": null,
  "architecture": null,
  "verified_at": null,
  "contexts": {
    "current_shell": { "status": "not_tested", "reason": "Awaiting inspection" },
    "new_terminal": { "status": "not_tested", "reason": "Awaiting inspection" },
    "ide_terminal": { "status": "not_tested", "reason": "Awaiting inspection" },
    "harness_subprocess": { "status": "not_tested", "reason": "Awaiting inspection" },
    "alternate_shell_or_wsl": { "status": "not_applicable", "reason": "Not selected" }
  },
  "next_action": "Inspect ordinary command resolution."
}
```

Context outcomes are `passed`, `failed`, `not_tested` or `not_applicable`, with a reason and observed time/source. Add per-context resolved paths when they differ. Store only nonsecret details privately; no complete environment, auth configuration or command transcript with tokens. A learner-confirmed IDE test is valid reported evidence, not an agent-observed one.

### Terminal passes, harness fails

This is a context failure. Check whether the harness launches a different shell, sanitizes its environment, uses a different user/architecture, or predates a persistent PATH change. Compare only relevant trusted path entries and command resolution. Preserve the working terminal result. Apply the narrow [Windows](https://starter.devthomas.site/setup/windows.md) or [macOS](https://starter.devthomas.site/setup/macos.md) repair, then save state and relaunch the actual long-lived parent if necessary. A fresh child of a stale parent may still inherit stale PATH.

Do not replace profiles wholesale, link all startup files together, create a user-local executable named `env`, or inject every known bin directory. If `env` is already shadowed, report its exact local path and propose a narrow approved correction; do not delete a user's file automatically.

## pnpm: a dependency build was blocked

Only use this branch for a pnpm project. Keep its lockfile and pinned package-manager version; never migrate an npm project to reproduce another project's error.

1. Inspect `package.json`, the lockfile, `pnpm --version`, `pnpm ignored-builds` when supported, and the exact dependency/version/script that was blocked. Confirm why that script is necessary and review its provenance.
2. Read the matching version's [approve-builds documentation](https://pnpm.io/cli/approve-builds) and local help. Current documentation supports named approvals, for example `pnpm approve-builds esbuild` only if that specific dependency was reviewed and needed. On versions using the interactive command, select only the reviewed package.
3. Review the resulting project-policy diff. Current documentation uses `allowBuilds`; older releases used other settings. Do not paste a newer setting into an older tool, erase existing decisions, or upgrade the manager just to use a convenient syntax.
4. Rerun the affected installation/build and the actual project check. Record the narrow approval and verified outcome.

Never approve all packages, disable build-script safeguards globally, or treat an approval prompt as proof the project now works.

## Node and TypeScript: module mismatch

First identify who executes the failing file: Node, a bundler such as Vite, a test runner, or an ad-hoc evaluation command. Inspect the nearest `package.json` `type`, file extension, tsconfig chain, actual launch command and import target.

Match the fix to that host. A browser app may correctly use bundler resolution while its Node helper needs a separate Node-aware config, appropriate extension or its supported runner. NodeNext is not a universal repair; preserve a working bundler configuration. Reproduce with the repository's normal command instead of changing app architecture to satisfy an unrelated inline evaluation. Validate both the repaired helper and unchanged app. [TypeScript's runtime-specific module guidance](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html).

## Docker Desktop and Rosetta: only when selected

Docker Desktop is the optional container choice, installed last after the baseline. OrbStack remains excluded. If the approved project does not require containers, do not install Docker or translation components and do not block core phases.

Before installation inspect OS/architecture, supported virtualization backend, existing Docker context/daemon, the desired image architecture, and current [Docker Desktop subscription conditions](https://docs.docker.com/subscription/desktop-license/). Licensing depends on actual use and organization; never promise it is universally free for commercial use. Obtain approval for install, permissions, agreements, background services and restart.

On Apple Silicon, [Docker's Mac installation guide](https://docs.docker.com/desktop/setup/install/mac-install/) says Rosetta is not strictly required, though some optional AMD64 tooling may need it. Determine whether the selected workload/feature actually does. Explain and obtain approval before installing translation software or accepting terms. Do not copy a dated error as a mandatory Rosetta step.

Use the supported installer and CLI integration; do not duplicate plugins or create arbitrary symlinks. Inspect `docker context show` and `docker version` without switching contexts silently. With approval, run an appropriate harmless official test container on the intended daemon; verify architecture and outcome, not merely that the CLI prints a version. Record the container/image, any download and cleanup. Do not remove existing images, containers or volumes. Use the current [Windows installation instructions](https://docs.docker.com/desktop/setup/install/windows-install/) for Windows/WSL prerequisites instead of silently installing a second tool environment.

## Targeted regression checks

These are scripts for a consenting learner/test machine, not authorization to alter the owner's host now.

- If a CLI works interactively but not in an agent task, preserve the first pass; repair only the failing context and repeat from the real task runner.
- After Windows PATH persistence changes, confirm a newly launched harness and child task; after macOS profile changes, check the selected noninteractive launch and GUI-originated task. Record an untested context honestly.
- Verify a project-local CLI through its existing runner and confirm no project-bin entry was added to persistent PATH.
- Exercise [Git privacy recovery](https://starter.devthomas.site/setup/authentication.md) only on approved unpushed test history; never toggle account privacy protections.
- In [file transfer](https://starter.devthomas.site/setup/file-transfer.md), independently record a successful first direction and failed or untested return direction.
- For [private Workbench access](https://starter.devthomas.site/setup/private-workbench.md), verify the allowlisted content, denied paths and intended audience while preserving unrelated Serve routes.
- If a staged skill is not discoverable, label it context-only or repair the supported install; do not report native success from a copied file.

On unresolved failure record the exact capability/context, attempted repair, observed outcome, evidence source and next action. Keep completed work and unknown legacy data. Documentation checks are not a clean-machine installation, physical phone test, private-network denial test or a full UI walkthrough.

Official troubleshooting references checked September 10, 2026.
