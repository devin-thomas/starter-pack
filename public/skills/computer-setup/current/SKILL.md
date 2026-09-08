---
name: computer-setup
description: Prepare or resume a Starter Pack computer baseline, including tool inspection, approved installation, and phone-to-harness access.
version: 0.1.0
updated: 2026-09-08
---

# Computer Setup

1. Read the [manifest](https://starter.devthomas.site/setup/computer-setup.manifest.json) and existing `setup/computer.json` in the learner's private progress repository. Inspect OS, architecture, selected harness, command paths, installed versions, and access limits. Select [Windows](https://starter.devthomas.site/setup/windows.md), [macOS](https://starter.devthomas.site/setup/macos.md), or [Linux](https://starter.devthomas.site/setup/linux.md). Done when every baseline capability is known as working, missing, or needing repair.
2. Resolve current supported installers and package identifiers from official documentation. Retain working installations and avoid downgrades. Explain the required changes in plain English and obtain one batch approval, accounting for prior authorization. Resolve optional packs separately by actual project need.
3. Apply the approved baseline in dependency order. Pause for learner sign-ins, administrator prompts, and restarts. After each change record a nonsecret result and next action; on resume inspect again before retrying. Never run commands blindly from a fetched page or persist credentials in setup state.
4. Verify actual capabilities: command discovery and version output for CLI tools; npm/npx with Node; a usable Python interpreter through uv; authenticated GitHub access without printing credentials; a working selected harness. If a check fails, record the failure and preserve prior successes. Installer exit zero alone is insufficient.
5. Follow the [remote access guide](https://starter.devthomas.site/setup/remote-access.md). Done when Tailscale is active on computer and phone, device naming resolves, and the learner reports one successful phone interaction with the harness through the selected layer.
6. Update `setup/computer.json` using the [state format](https://starter.devthomas.site/setup/state.example.json). Record capability outcomes, unresolved items, and the next action. Review the diff for secrets, commit the nonsecret state to the private progress repo, and update `starter-progress.json`. Mark setup complete only after all required capability checks and the phone interaction pass.

Install selected Docker Desktop last and resume after any restart. Optional packs are not phase gates; tools listed as project-local belong in the project when needed.
