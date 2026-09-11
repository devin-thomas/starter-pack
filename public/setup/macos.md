# macOS adapter

Use the [Computer Setup skill](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md) and [manifest](https://starter.devthomas.site/setup/computer-setup.manifest.json). Current macOS is the first-class target; inspect the actual OS/version and Apple Silicon versus Intel architecture before proposing changes.

## Inspect and reuse capabilities

Load existing local/portable progress and setup state. A GitHub repository is not required at entry. Inspect `uname -m`, the actual shell, command resolution, selected harness, installed versions and install sources. Reuse healthy compatible tools, editors and profiles. Do not replace an installation just to make every package come from one manager.

For a missing capability, compare a trusted supported binary/vendor installer with a verified package-manager route. [Homebrew](https://docs.brew.sh/Installation) is appropriate when healthy and useful; inspect its real prefix and prerequisites. Do not install it only to pass `brew --version` if supported direct tooling already meets the baseline. Prefer a supported precompiled package to unnecessary source builds. Do not terminate installation daemons, bypass OS protections, or start conflicting installers to shorten a prerequisite wait.

Resolve supported [Node active LTS](https://nodejs.org/en/download) with npm/npx, [uv installation](https://docs.astral.sh/uv/getting-started/installation/) and [usable Python](https://docs.astral.sh/uv/guides/install-python/) at execution time. Python remains required up front; let uv discover a healthy existing interpreter or provision a supported one. Check architecture, publisher/signature or published checksum, dependency cost, update and repair path for each missing tool. Use only current vendor-supported harness installers.

Explain the approved required batch once, optional packs separately, and any substantial Apple prerequisite. Say which independent work can continue during a wait. Use recoverable managed installer jobs, save nonsecret source/scope/version/path/outcome checkpoints, and pause for necessary sign-ins, permissions or restarts. Never dump the full environment into a report.

## Keep the agent and human editor

Follow [IDE setup](https://starter.devthomas.site/setup/ide.md): Codex and Claude Code use VS Code; the Antigravity route verifies its agent application and Antigravity IDE separately; Cursor's desktop editor satisfies the editor role without a second IDE. The selected agent platform remains primary. The editor gives the learner access to their files and Markdown plans, not a required coding tutorial.

Preserve settings/workspaces/extensions. Verify editor launch, intended workspace, Markdown display, and applicable tools in its integrated terminal. Grant only permissions actually needed by the selected application, explaining prompts such as accessibility/screen recording for an approved remote route.

## PATH across shells and GUI-launched tasks

Inspect the shell actually launched by the harness, its login/interactive flags, `ZDOTDIR`, existing startup files and process inheritance. Do not assume every agent reads `.zshrc`.

With ordinary zsh startup settings, `.zshenv` is read for noninteractive shells too; `.zprofile` is for login shells, and `.zshrc` is for interactive shells. Startup options can change this behavior. A GUI app may inherit an environment without reading these files at all. [zsh startup-file reference](https://zsh.sourceforge.io/Doc/Release/Files.html).

1. Use `command -v TOOL` and `type -a TOOL` to inspect the intended command, aliases/shims and collisions. Compare current terminal and actual harness task behavior before editing anything.
2. For a selected zsh workflow, compare an ordinary `zsh -c 'command -v TOOL'` subprocess with the actual login/interactive launch style in use. A standalone test shell is diagnostic, not a substitute for a task launched by the harness.
3. Fix only the relevant source. A minimal quiet, idempotent user-path addition to the appropriate profile, sometimes `.zshenv`, can be appropriate for zsh subprocesses. Add only existing trusted installation directories, deduplicate and preserve user ordering/customization. Inspect Homebrew's actual prefix if used; never copy another machine's username or versioned interpreter path.
4. Keep noninteractive startup free of output, interactive prompts, package updates or TTY-dependent commands. Do not symlink all startup files together, replace profiles wholesale, or create a helper that shadows `env`. Report existing shadowing and request approval for a narrow correction.
5. Save state and relaunch the actual GUI harness/editor if it needs a fresh environment. If the harness sanitizes subprocess PATH, use its supported configuration or launch mechanism; do not rewrite unrelated global files.
6. Verify [all applicable contexts](https://starter.devthomas.site/setup/tool-troubleshooting.md#command-resolution-in-each-context): current shell, new terminal, IDE terminal and actual harness task, plus any selected alternate shell. Ordinary commands must work without a one-off PATH prefix. An intentionally scoped absolute Python interpreter is valid for the viewer but does not prove global command readiness.

Check Git/gh, Node/npm/npx, uv and its usable Python, rg, fd, jq, curl, Tailscale and the applicable harness CLI. Check Homebrew only if that route was selected. Later selected CLIs receive the same context evidence. Project-local tools stay in the project's runner; never add every project's `node_modules/.bin` to global PATH.

## Save early, connect independently

Prioritize Git/gh after their prerequisites. Follow [authentication and Git privacy](https://starter.devthomas.site/setup/authentication.md), then create/confirm the private progress repository as soon as scoped GitHub write access works. Verify a real nonsecret save, remote files, revision and private visibility. Keep local successes if auth/save fails and continue independent setup only; the failed private-save gate cannot be waived for Quick Build.

Preserve/download the [local Workbench](https://starter.devthomas.site/artifacts/progress-workbench/README.md) at entry and start it when Python works, independently of GitHub. Reuse a listener only after matching its exact progress folder and loopback binding; otherwise choose a free port 8000-8010. Use the verified interpreter, quote the absolute directory, and keep a managed process record. Never stop unrelated services. Viewer failures and declined email preferences remain non-gating. Optional phone viewing follows the [isolated snapshot](https://starter.devthomas.site/setup/private-workbench.md) guide, not a proxy to the whole private repo.

Complete [Tailscale networking and actual phone harness control](https://starter.devthomas.site/setup/remote-access.md), and independently [receive a file in each direction](https://starter.devthomas.site/setup/file-transfer.md). Preserve proven outcomes on resume. Review and save the latest nonsecret setup evidence to the private remote before Quick Build.

Docker Desktop stays optional and last; OrbStack stays excluded. Check actual workload/architecture, current licensing and [Docker/Rosetta troubleshooting](https://starter.devthomas.site/setup/tool-troubleshooting.md) before proposing it. Rosetta is not a universal Apple Silicon prerequisite. Record required restart/relaunch points and re-inspect afterward.

Official platform references checked September 10, 2026. Documentation and terminal checks do not establish physical-phone or clean-machine acceptance.
