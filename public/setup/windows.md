# Windows 11 adapter

Use with the [Computer Setup skill](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md).

1. Inspect Windows edition, architecture, `Get-Command` results, PATH, `winget --version`, and existing setup state. Retain healthy tools. Windows 11 is the first-class target.
2. Use [Microsoft WinGet documentation](https://learn.microsoft.com/windows/package-manager/winget/) to repair or obtain the package manager when needed. Query package identifiers and publisher/source before installation. Use [PowerShell's installation documentation](https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows) for current stable PowerShell 7. Account for ARM64 versus x64.
3. Resolve missing baseline tools from their official sources or verified WinGet listings. Select Node active LTS, and provision/discover Python through uv. Resolve the chosen harness's current supported installation path. Present the required batch and wait for approval before changes.
4. Install approved dependencies, refreshing the shell after PATH changes. Use `curl.exe` when checking curl to avoid a PowerShell alias. Check `git --version`, `gh --version`, `node --version`, `npm --version`, `npx --version`, `uv --version`, `uv python find`, `rg --version`, `fd --version`, `jq --version`, and `curl.exe --version`; also invoke the discovered Python interpreter with `--version`. Confirm PowerShell 7 and harness operation.
5. Pause for account authentication and administrator dialogs. Save state before a required restart, then re-inspect on resume. Install selected Docker Desktop last.
6. Complete [remote access](https://starter.devthomas.site/setup/remote-access.md). Check Windows edition and remote-host support before choosing RDP; select a suitable supported alternative when needed. Record nonsecret outcomes in the private progress repository.
