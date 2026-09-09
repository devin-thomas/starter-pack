# Install and configure the IDE

This is part of the required Computer Setup batch. Select from the learner's development harness, not their phone companion:

| Development harness | IDE | Official installation source |
| --- | --- | --- |
| Antigravity | Antigravity IDE | https://antigravity.google/download |
| Cursor | Cursor | https://cursor.com/download |
| All others, including ChatGPT/Codex and Claude Code | Visual Studio Code | https://code.visualstudio.com/docs/setup/setup-overview |

Use the same mapping in the [setup manifest](https://starter.devthomas.site/setup/computer-setup.manifest.json). Antigravity IDE and Cursor also satisfy the editor capability themselves; do not install a second editor for those routes. An Antigravity CLI alone does not establish that Antigravity IDE is installed. A Cursor cloud session or CLI alone does not establish that its desktop editor is installed.

1. Inspect the selected IDE, version, launch path, existing settings and intended local workspace. Reuse a healthy installation. Preserve other editors and existing customization; do not uninstall them, reset preferences or downgrade a working version.
2. Include the missing IDE and required configuration in the normal required batch approval, honoring permission already granted. Then the agent performs installation and configuration using the official installer or a verified package-manager entry for the detected OS and architecture. Do not hand the learner a manual installation checklist when the agent can execute it. Sign-ins, administrator prompts and any required restart remain learner interactions.
3. Configure the IDE's supported command-line launcher when available, open the intended local workspace, and make its integrated terminal use a working shell with the installed development tools. Verify Git discovery. Add the selected harness's official IDE integration only where needed for that route, after verifying its current publisher and installation instructions. Preserve a working standalone Codex or Claude Code workflow. Do not enable an unrelated AI subscription, install broad extension packs, or change global Git identity or default file associations.
4. Verify that the IDE launches, opens a local folder, and its integrated terminal can run `git --version`. Verify the selected harness can work on that workspace through its intended app, terminal or editor integration. Do not mark success from installer exit status alone. If GUI interaction is unavailable, ask the learner for the single launch/folder/terminal confirmation and record it as learner-reported, not agent-verified. Do not grant blanket workspace trust or run an unfamiliar project's code just to verify the editor.
5. Save the chosen IDE, version, configuration and verification results in `setup/computer.json` under `ide` and the `selected-ide` capability. Preserve existing fields on resume. If the platform cannot run the selected IDE or a check fails, record the specific blocker and resume action; independent setup can continue, but do not silently select another IDE or mark the required capability complete.

Resolve installers and extensions from current official documentation at setup time. Download buttons, package identifiers and supported architectures can change.
