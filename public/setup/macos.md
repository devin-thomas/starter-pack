# macOS adapter

Use with the [Computer Setup skill](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md).

1. Inspect macOS version, `uname -m`, command paths, Homebrew state, selected harness, and prior setup results. Current macOS is the first-class target. Retain healthy installations and respect Apple Silicon versus Intel paths.
2. Resolve installation instructions from [Homebrew](https://brew.sh). Inspect its official installer and prerequisites before requesting approval. Use Homebrew's actual prefix rather than assuming a directory; install any required Apple command-line tools through the supported prompt.
3. Resolve verified formulae or vendor installers for the missing baseline. Select Node active LTS and Python managed/discovered by uv. Resolve the selected harness from its official documentation. Present the required batch for approval and optional packs separately.
4. Refresh the shell after environment changes. Check `brew --version`, `git --version`, `gh --version`, `node --version`, `npm --version`, `npx --version`, `uv --version`, `uv python find`, `rg --version`, `fd --version`, `jq --version`, and `curl --version`; invoke the discovered Python with `--version`. Confirm the harness can perform its intended file/tool work.
5. Pause for sign-in, administrator, network-extension, or screen-recording/accessibility permissions. Explain the permission required by the selected app. Record a resume point before restart and re-inspect afterward. Install selected Docker Desktop last.
6. Complete [remote access](https://starter.devthomas.site/setup/remote-access.md) using a supported interaction layer. Save verified nonsecret setup state to the private progress repo.
