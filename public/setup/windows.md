# Windows 11 adapter

Use the [Computer Setup skill](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md) and [manifest](https://starter.devthomas.site/setup/computer-setup.manifest.json). Windows 11 is the first-class target. These instructions guide approved work on the learner's machine; reading them does not authorize host changes.

## Inspect and select the smallest supported change

Load existing local/portable progress and setup state before installation. A GitHub repository is not needed to enter setup. Inspect Windows version/architecture, native versus WSL workflow, PowerShell version, selected harness, installed versions and executable resolution. Preserve healthy tools and settings; do not downgrade or install everything twice.

Use current [WinGet instructions](https://learn.microsoft.com/en-us/windows/package-manager/winget/) to inspect available packages and their publisher/source before installing. A supported vendor installer/archive is also appropriate when it supplies the capability with less disruption. Compare provenance, architecture, dependencies, signatures/checksums when published, updates and repair. Do not repair or install WinGet just for a checklist if approved direct tooling meets the baseline. Never build from source unnecessarily or stop an OS installer to avoid a wait.

[PowerShell 7](https://learn.microsoft.com/en-us/powershell/scripting/install/install-powershell-on-windows) remains required. Use supported stable versions and the actual architecture. For Node, resolve the current supported active LTS from [Node's download page](https://nodejs.org/en/download), with npm/npx. Install [uv from its official source](https://docs.astral.sh/uv/getting-started/installation/) and [discover or provision usable Python](https://docs.astral.sh/uv/guides/install-python/) up front. Preserve an existing healthy interpreter. Resolve other missing baseline tools and the chosen harness through their current vendor-supported sources, not stale version numbers or arbitrary download sites.

Explain the required batch once and get approval, honoring existing authorization. Keep optional packs separate. Run dependencies in order with recoverable process/log state and no conflicting installers. Record source, scope, architecture, version and next action after each step. Pause for actual sign-in/admin/restart prompts; do not weaken execution policy or security controls globally.

## Keep the editor and agent separate

Follow [IDE setup](https://starter.devthomas.site/setup/ide.md): VS Code for Codex or Claude Code, Antigravity IDE for the Antigravity route, and Cursor's desktop editor for Cursor. Antigravity's agent application and IDE need separate verification. Keep the agent platform primary; the editor lets the learner inspect or change files and Markdown plans.

The agent applies the approved install/configuration without resetting workspaces, extensions or preferences. Verify editor launch, intended folder, Markdown display and applicable tools in its integrated terminal; no editing tutorial or forced extension-only agent workflow.

## PATH: persistence and process inheritance

Windows has Process, User and Machine environment scopes. A child inherits the environment of its parent, so editing persistent User PATH does not refresh an already-running harness. See [Microsoft's environment-variable reference](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables).

1. Inspect ordinary resolution with `Get-Command TOOL -All` and `where.exe TOOL`. Check command type and actual binary/shim path. Use `curl.exe` for the curl binary; inspect Python App Execution Aliases if a command opens the Store or resolves incorrectly.
2. If PATH is the actual defect, inspect only relevant Process/User/Machine PATH entries locally. Propose a minimal change at the least necessary scope. Preserve existing entries, order, registry value type and expansion behavior; deduplicate case-insensitively where appropriate. Use the supported installer/OS editor or a narrowly reviewed update, not a wholesale string replacement or a truncated `setx PATH` command.
3. Save the setup checkpoint and explain which long-lived parents need a relaunch. Close/reopen the harness or IDE with approval after saving work; test a genuinely fresh parent and subprocess. Opening another terminal tab in an old process may still inherit old PATH.
4. Repeat [all applicable context checks](https://starter.devthomas.site/setup/tool-troubleshooting.md#command-resolution-in-each-context): current shell, new terminal, IDE integrated terminal and the harness's actual task runner. Do not mask failure with a temporary PATH prefix or only an absolute binary invocation.
5. Native Windows and WSL are different environments. Test WSL only when selected, record the distribution and shell, and do not call WSL success native-Windows coverage. Keep project-local tools in the repository's runner, never global project `node_modules/.bin` entries.

Check `pwsh --version`, Git/gh, Node/npm/npx, uv and its selected Python, rg, fd, jq, curl.exe, Tailscale and the selected harness's applicable CLI. Verify the actual tool capability as well as its version. The editor and real harness task are separate evidence, not assumed from a successful shell.

## Save, connect and resume

Prioritize Git/gh after their prerequisites and use [safe authentication and Git privacy](https://starter.devthomas.site/setup/authentication.md) before the first useful push. As soon as approved GitHub write access works, create/confirm the private progress repository, save the existing state and verify its remote files, revision and private visibility. A working connector can save earlier without waiving Git/gh. On failure keep the local checkpoint and continue independent setup, but do not claim private-save readiness or start Quick Build.

At entry preserve/download the [local Workbench](https://starter.devthomas.site/artifacts/progress-workbench/README.md) beside canonical progress. Email choices and the viewer are non-gating. When Python works, use the resolved interpreter to serve only the exact progress folder on loopback at an inspected free port 8000-8010. Quote paths correctly, use a managed process or `Start-Process -WindowStyle Hidden`, and record the exact listener/process. Never stop an unrelated listener. Remote sharing requires the separate [safe snapshot guide](https://starter.devthomas.site/setup/private-workbench.md), not this repository-root server.

Finish [networking and actual phone-to-harness control](https://starter.devthomas.site/setup/remote-access.md) and [both file-transfer directions](https://starter.devthomas.site/setup/file-transfer.md) independently. Check host edition/support before choosing RDP; do not open public ports or disable the firewall. Preserve each success and record missing evidence as not tested.

Reconcile setup against the registry, save the latest nonsecret outcomes to the private remote, and verify the save before Quick Build. Install selected Docker Desktop last using [conditional troubleshooting](https://starter.devthomas.site/setup/tool-troubleshooting.md); containers are never a core phase gate. After interruptions inspect prior results before retrying. These docs are not evidence of a clean-machine or physical-phone pass.

Official platform references checked September 10, 2026; resolve supported versions and commands at execution time.
