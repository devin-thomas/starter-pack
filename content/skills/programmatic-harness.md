---
skill_id: programmatic-harness
updated: 2026-10-23
---

# Programmatic Harness

Prove a bounded, resumable local coding-agent session with nonsecret evidence.

## Use this when

You explicitly want a programmatic coding-agent harness, rather than a normal interactive editor session. The workflow checks the actual local capabilities before selecting a supported integration.

## How it works

The agent inspects the project, installed tools, and current integration documentation. It establishes a narrowly scoped session, runs a small proof, and verifies continuation and the resulting artifacts. Environment credentials remain managed locally.

The proof records what actually ran, its session identity, checks, and any limits. A successful connection alone is not a completed coding task.

## Try it

> Use Programmatic Harness to establish and verify a resumable local Codex session for this repository.

For a broader terminal delegation or interactive handoff, see [Agent CLI](/skills/agent-cli).
