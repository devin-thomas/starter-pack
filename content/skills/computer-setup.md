---
skill_id: computer-setup
updated: 2026-10-04
---

# Computer Setup

Prepare or resume the Starter Pack computer baseline with approved capability installs, cross-context command checks, private saving, file transfer, and actual phone-to-harness control.

## Use this when

You have completed Phase 1 on your phone and are ready to set up your computer for Phase 2 development work. Computer Setup gets your tools installed, authenticated, and verified so you can build with your agent.

Not the right fit for general computer maintenance or setting up tools unrelated to the Starter Pack curriculum.

## How it works

Computer Setup follows an inspect-approve-install-verify cycle:

1. **Load existing state** — Reads your progress file, setup manifest, and canonical requirements. Preserves everything from Phase 1 without requiring you to repeat intake. A private repository is not an entry prerequisite.

2. **Inspect your environment** — Checks your OS, architecture, installed tools, selected harness, and prior results. Classifies each capability as working, missing, failed, or not tested.

3. **Approve and install** — Explains the necessary batch of tools and obtains your approval before installing anything. Reuses healthy existing installations. Installs dependencies in order using recoverable jobs. Prioritizes Git and GitHub CLI first.

4. **Create private progress repository** — As soon as authenticated GitHub write access exists, creates or confirms a private repository for your progress and verifies the remote save. This is where your durable progress lives.

5. **Verify in every context** — Checks each CLI in the current shell, a new terminal, the IDE terminal, and a real harness subprocess. Uses command resolution evidence, not just installer exit codes. Python is required up front.

6. **Complete networking and control** — Verifies computer and phone connections, file transfer in both directions, and actual phone-to-harness control. These are independent outcomes: a native message does not prove a file round trip.

7. **Save and close out** — Reviews the final state diff, saves to the private remote, and verifies its revision and files. States what is ready and the exact next action.

8. **Offer optional Codex experiment** — Only after required setup closeout, offer eligible Codex users the released local Programmatic Harness workflow. It is opt-in, project-local, and never a setup or phase gate. A decline or deferral returns directly to Quick Build.

## Inputs

- **Your saved progress** — the progress file from Phase 1
- **Your selected computer harness** — Codex, Claude Code, Antigravity, or Cursor
- **Approvals** — confirmation before each install batch

## Outputs

- A verified computer baseline with all required tools installed and authenticated
- A private GitHub repository for durable progress saving
- Verified networking and file transfer between phone and computer
- A local Progress Workbench for viewing your state
- A handoff ready for Quick Build

## Prerequisites

Phase 1 completion with a working phone companion and authenticator.

## Installation and use

Computer Setup is loaded automatically by the Starter Pack companion when you reach Phase 2 on a computer. You can also point your agent at it directly:

```
Read the Computer Setup skill and help me prepare my computer for Phase 2.
```

The skill supports Windows, macOS, and Linux. Your selected harness determines which IDE is required: Codex and Claude Code use VS Code, Antigravity uses its own IDE, and Cursor's desktop editor is sufficient.

## Optional Codex programmatic harness

After required Computer Setup outcomes and the private progress save are verified, offer the optional local Codex programmatic-harness proof only when its compatible adapter and reusable skill have published pinned releases. Ask whether the learner wants to try it; never install the adapter, skill, or project dependencies automatically. If they decline, defer, are ineligible, or encounter a failure, preserve the required setup evidence and continue to Quick Build.

For an eligible Codex user who opts in, use the checksum-verified [Programmatic Harness installation guide](https://starter.devthomas.site/phases/2#optional-try-a-programmatic-harness-with-codex) to load the pinned reusable skill and follow its proof workflow. Use the [Agent Native documentation](https://github.com/uppercut-labs/agent-native/tree/main/docs), including its programmatic-harness overview and Codex adapter details, for technical reference. The Codex route uses its managed ChatGPT sign-in and eligible ChatGPT plan; do not request an OpenAI Platform API key or enable API billing. Cloud use is a separate opt-in and is not included in the local proof. Do not offer unfinished Cursor or cloud workflows as if they were supported.

Record only normalized proof outcomes in `artifacts.programmatic_harness`. Never store credentials, provider output, private planning URLs, or raw session/turn IDs in progress. Local and cloud evidence are independent.

## Example

> "I finished Phase 1 on my iPhone with ChatGPT. I'm now on my MacBook and want to use Codex for Phase 2."

The agent reads the saved progress, inspects the Mac environment, proposes installing Git, GitHub CLI, Node.js, and VS Code via Homebrew, obtains approval, installs and verifies each tool, sets up the private progress repository, starts the local Workbench viewer, and confirms the computer baseline is ready for Quick Build.
