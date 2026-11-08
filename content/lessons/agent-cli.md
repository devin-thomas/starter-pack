---
id: agent-cli
kind: lesson
phase: phase-3
level: 2
title: "Level 2: Give your project a command"
label: PHASE 03 / LEVEL 2
summary: Give software that runs on a computer one documented command an agent can run, read as JSON, and see fail clearly.
route: /phases/3/agent-cli
status: preview
updated: 2026-11-08
---

# Level 2: Give your project a command

A command-line tool (CLI) lets an agent use your software the way it already uses `git` or `npm`: it runs a command in a terminal, reads what comes back and checks whether it worked. This lesson adds one such command to a project that runs on a computer, such as a desktop app, a script or a local tool. You work on your own project. You do not need a website, an HTTP API, an MCP server or a package.

This lane is one of the two Level 2 choices. A working command that passes the [real-client checks](/phases/3#prove-it-with-a-real-client) completes Phase 3 on its own. If your project is a web app or hosted tool, [the HTTP API lesson](/phases/3/agent-api) fits better.

## Start with your own project

Ask your agent to read your project's source before it changes anything, then agree on three things:

1. **One question or task.** What should an agent be able to ask your software? Pick something you would use: "which books am I reading", "what is in this folder's report", "is this tool available". Reading is a good start.
2. **The code that already does it.** Find the function your app already uses for that. The command calls that function; it does not get its own copy of the logic, so the app and the command cannot disagree.
3. **What must stay out.** Private fields, personal data, file paths you would not share, and every password, key or token. Write them down; your checks will look for them.

That short list is your plan. Review it and give your go-ahead before your agent writes code.

## Design the command

Keep the first version small: one command, maybe two, with the same shape every time.

### Name it and document it

Give the command a short name and a verb: `books list`, `report show 2026-11`. Make `--help` print what it does, its usage, two or three examples and its exit statuses. An agent reads `--help` before it runs anything unfamiliar, so the help text is part of the interface.

### Print JSON an agent can trust

Readable text is fine by default. Add `--json` for agents, and keep that output stable: the same keys in the same order, documented, and changed only on purpose. Include a version field and, when the data changes over time, a date that says how fresh it is.

```json
{
  "api_version": "1",
  "catalog_updated": "2026-11-08",
  "tool": { "id": "cordless-drill", "name": "Cordless drill", "category": "Power tools", "loan_days": 14, "available": true }
}
```

Build the output from a list of fields you chose to show (an allowlist) rather than printing your whole record. Then a private field added later stays private until you add it to the list.

### Fail visibly

When something goes wrong, exit with a nonzero status and say what happened in one line. Use a different status for each kind of failure and list them in `--help`:

| Status | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Nothing matched, such as an unknown id |
| `2` | Usage error: unknown command or option, missing or invalid value |
| `3` | The data file cannot be read or is not valid |

Send human error messages to standard error, so standard output stays clean. With `--json`, print the error as JSON too, for example `{ "error": { "code": "not_found", "message": "…" } }`, so an agent can read both outcomes the same way.

### Keep secrets out of every output

A command's output usually ends up in an agent's context and its logs. So:

- Read keys and tokens from the environment or your system's keychain, never from a command-line argument, and never print them.
- Do not echo what the user typed back in an error. Say "Unknown option" and list the valid ones instead.
- Catch errors from parsing files. Some runtimes quote part of the file in their error message, which can expose a private note.
- Check `--help`, success and every error path, in both text and JSON, for your private fields and for a fake secret you planted in the environment.

### Ask before changing anything

If your command can change data, keep the change behind an explicit flag such as `--yes`, offer a `--dry-run` that shows what would change, and have your agent ask you before running it. A read-only command needs none of this, which is one reason it is a good start.

## Make it installable

"Works in my project folder" is not installed. Choose the way your language already distributes command-line tools:

- **Node.js:** a `bin` entry in `package.json`. Install it with `npm install -g` from npm, or share a versioned archive made with `npm pack` and install that file.
- **Python:** a console script entry point, installed with `pipx install` or `uv tool install`.
- **A compiled tool:** a binary placed on the `PATH`, with a release archive for each operating system.

Add `--version`. If you share an archive, publish its SHA-256 checksum next to it and check the checksum before installing. Then install it into a clean folder, outside your project, and run it from there. That is how your agent will meet it.

## Check it yourself

Ask your agent to run these and show you the results:

| Check | What to expect |
| --- | --- |
| `--help` | Usage, examples and exit statuses; status `0` |
| Your command with `--json` | Valid JSON with the documented keys; status `0` |
| An id or input that does not exist | Status `1` and a clear message, also as JSON with `--json` |
| An unknown option | Status `2`, usage hint, the option is not echoed |
| A planted secret in the environment, and your private fields | Absent from every output above |
| Run from a clean folder after installing | Same results |

## Prove it with a real agent

Open a new session in an agent app that can run terminal commands, such as Claude Code or Codex. It has not seen your project. Install the command there or confirm it is installed, then ask:

> Run `books show 42 --json` and tell me the title and status it returns. Then run `books show 999999 --json` and tell me the exit status and the error code.

The check passes when the agent reports the values your data really holds, and reports the failing call's nonzero status and error code without inventing a result. Compare both with what you expect. If the agent guessed or skipped a step, improve the help text or the output and ask again in a fresh session.

## Record your milestone

Ask your agent to mark the `agent-cli` step completed in your private progress file, with a short `verification` object as the [Phase 3 page](/phases/3#save-your-milestones) and the progress guide describe:

```json
"verification": {
  "interface": "cli",
  "client": "<the agent app you used>",
  "operation": "books show 42 --json",
  "expected_output_check": "passed",
  "negative_case_check": "passed",
  "learner_confirmed": true,
  "verified_at": "<when you checked, as an ISO date and time>",
  "requirements_revision": "<the current requirements revision>",
  "summary": "Agent reported the right title and status, and exit 1 with not_found for a missing id."
}
```

Save only these short notes, never logs, keys or private data. With your confirmation, this completes Phase 3.

## See it in an example

`lantern-tools` is a small command for the [Lantern Street Tool Library](/examples/agent-ready-website/), the fictional library from the Level 1 lesson. It answers one question, "which tools does the library have, and can I borrow them now?", and it is read-only. Install it in an empty folder (Node.js 20 or newer):

```sh
curl -fLO https://starter.uppercut-labs.com/examples/lantern-tools/lantern-tools-0.1.0.tgz
curl -fLO https://starter.uppercut-labs.com/examples/lantern-tools/lantern-tools-0.1.0.tgz.sha256
shasum -a 256 -c lantern-tools-0.1.0.tgz.sha256
npm install --no-save ./lantern-tools-0.1.0.tgz
npx --no-install lantern-tools --help
```

On Windows PowerShell, compare `(Get-FileHash lantern-tools-0.1.0.tgz -Algorithm SHA256).Hash` with the first word of the `.sha256` file instead of running `shasum`.

Then try:

```sh
npx --no-install lantern-tools list --available true
npx --no-install lantern-tools show cordless-drill --json
npx --no-install lantern-tools show chainsaw --json; echo "exit status $?"
```

Look at:

- `--help`, which lists usage, examples and the exit statuses `0`, `1`, `2` and `3`;
- `show … --json`, which prints the same JSON the library's [HTTP API](/phases/3/agent-api) returns for the same question;
- `show chainsaw`, which exits with status `1` and a `not_found` error;
- `list --catalog FILE`, which reads the library's own catalog file. That file also holds where each tool is stored and staff notes, and the command never prints them;
- the archive's `lib/catalog.mjs`, the one module both the command and the API use. The command adds only argument parsing and printing.

## Go deeper when it helps

These are optional. Choose one only when your project needs it.

- **Your language's CLI library.** Libraries such as Commander for Node.js or Typer for Python generate help text and check arguments for you.
- **Shell completion and a man page,** once the command has settled.
- **A test that runs the installed command** and fails when output keys change or a private field appears, like the one behind this example.
- **Uppercut Agent Native.** The released `@uppercut-labs/agent-native` package, version 1.0.1, describes an operation once and serves it as an HTTP API, a command or an MCP tool. It is an optional accelerator. Installing it is not the finish line; a working command that passes the checks is.

When your milestone is recorded, return to [Phase 3](/phases/3#choose-what-an-agent-should-do). You can stop here, or add an [HTTP API](/phases/3/agent-api) or an MCP tool when your project needs one.
