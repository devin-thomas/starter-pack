---
skill_id: execute-task
updated: 2026-09-17
---

# Execute Task

Complete exactly one next executable repository task with full evidence and validation.

## Use this when

You have a backlog of decomposed tasks — in Linear, GitHub Issues, or repository Markdown files — and want your agent to pick up the single next eligible task, implement it completely, validate it, and stop. Execute Task handles the full lifecycle of one bounded pass: selection, implementation, validation, reporting.

Not the right fit for processing multiple tasks in sequence (use Execute Task Cycles), writing an execution prompt (use Task Execution Prompt), or continuing already-scoped work that doesn't need task selection.

## How it works

Execute Task follows a strict one-pass workflow:

1. **Resolve the execution contract** — Searches your repository for a canonical `TASK-EXECUTION-PROMPT.md`. Checks paths supplied by you, then `AGENTS.md`/`CODEX.md` references, then filename matches. If a canonical prompt exists, it becomes the execution contract. If none exists, the skill uses its own portable workflow.

2. **Read repository state** — Inspects current instructions, domain context, architecture decisions, plans, relevant source and tests, and Git state before selecting any work.

3. **Select one task** — Identifies the authoritative task source (Linear, GitHub Issues, or local ticket files) and selects exactly one executable task. Does not invent a task source or pick a tracker merely because a connector is installed.

4. **Execute the task** — Implements the selected task within the repository's existing patterns, respecting higher-level user, repository, and safety instructions. Preserves pre-existing work and protected resources throughout.

5. **Validate and report** — Runs the repository's standard checks, records a terminal execution result with timing evidence, and stops. Does not begin a sibling task, successor, review task, or adjacent cleanup.

## Inputs

- **A repository with a task source** — Linear issues, GitHub Issues, or Markdown ticket files
- **Optionally, a canonical execution prompt** — a `TASK-EXECUTION-PROMPT.md` that defines repository-specific execution rules

## Outputs

- One completed task with validated implementation
- A terminal execution report including: task identifier, execution result, changed files, validation evidence, timing, and any residual risks
- Updated task-source state (lifecycle mutations per the execution contract)

## Prerequisites

A repository with decomposed tasks ready for implementation. Task Execution Prompt can create the canonical execution contract if you want repository-specific rules.

## Installation and use

Execute Task is available as an agent skill. Invoke it when you want one task completed:

```
Read the Execute Task skill and execute the next task in this repository.
```

The skill triggers conservatively — it requires an explicit request to select and execute one task. Generic continuation language like "keep going" or "resume" does not activate it.

## Example

> "Execute the next task from my Linear backlog for this repository."

The agent searches for a canonical execution prompt, finds `docs/agents/TASK-EXECUTION-PROMPT.md`, reads the repository state, selects the first unstarted ticket with no blocking dependencies, implements it following the prompt's validation gates and Git policy, runs tests, commits, and reports: "PRJ-042 (add pagination to search results) — Complete. All checks pass. Elapsed: 12 minutes."
