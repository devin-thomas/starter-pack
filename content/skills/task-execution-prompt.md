---
skill_id: task-execution-prompt
updated: 2026-09-17
---

# Task Execution Prompt

Create or revise a repository-specific workflow contract for safe, deterministic, one-task agent execution.

## Use this when

You have finished planning — your specification and tickets are ready — and you want a repeatable prompt that tells your agent exactly how to pick up a task, implement it, validate it, and report the result. Task Execution Prompt designs that contract for your specific repository and task source.

Not the right fit for discovery or planning work. Use Grill to Build first to produce the specification and tickets that this prompt will execute against.

## How it works

Task Execution Prompt follows a four-stage authoring process:

1. **Inspect before interviewing** — Reads your repository's AGENTS.md, CONTEXT.md, ADR, specifications, build/test/lint configuration, Git policy, tracker conventions, and any existing execution prompt. Uses what it finds rather than asking you to restate it.

2. **Resolve only decisions** — Asks one question at a time about things it cannot discover: task source and selection rules, lifecycle mutations, human gates, authority order, validation gates, Git and publishing behavior, protected resources, failure outcomes, and reporting format. Each question includes a recommended answer.

3. **Obtain one approval** — Presents a concise synthesized contract covering the full workflow: source, selection, gates, authority, validation, commit/push/PR behavior, protected resources, and reporting. Asks for one explicit approval before writing anything.

4. **Write and rehearse** — Generates a self-contained prompt file (typically `docs/agents/TASK-EXECUTION-PROMPT.md`) adapted to your repository's facts and approved decisions. Then performs a read-only preflight rehearsal: predicts which task would be selected, validates the prompt structure, and reports any remaining ambiguity. The rehearsal never claims, assigns, or begins a task.

## Inputs

- **A repository with tickets or a configured task source** — Linear, GitHub Issues, or Markdown ticket files
- **Decisions** — answers to questions about lifecycle, gates, and authority that cannot be discovered from the repository
- **Approval** — one confirmation of the synthesized contract before the prompt is written

## Outputs

- A self-contained `TASK-EXECUTION-PROMPT.md` that an agent can follow without installing additional skills
- A preflight rehearsal report showing the predicted first task and structural validation
- Deterministic task selection rules, validation gates, and failure outcomes

## Prerequisites

A repository with an existing specification and decomposed tickets. Grill to Build or an equivalent planning process should have run first.

## Installation and use

Task Execution Prompt is available as an agent skill. Point your agent at the canonical source:

```
Read the Task Execution Prompt skill and help me create an execution prompt for this repository.
```

When revising an existing prompt, the skill preserves sound project-specific rules and makes the smallest coherent change.

## Example

> "I have a Next.js app with tickets in Linear. I want my agent to pick up one ticket at a time, implement it, run tests, and open a PR."

The agent inspects the repository's build configuration, test setup, and Linear project. It asks: "Should the agent auto-assign the ticket in Linear, or leave it unassigned until the PR is approved?" and similar one-at-a-time decisions. After approval of the synthesized contract, it writes the execution prompt and rehearses it: "The next task would be PRJ-003 (add user profile page). Selection was deterministic because it is the first unstarted ticket with no blocking dependencies." No task is actually started.
