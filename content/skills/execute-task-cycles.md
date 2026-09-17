---
skill_id: execute-task-cycles
updated: 2026-09-17
---

# Execute Task Cycles

Run Execute Task sequentially across a multi-task backlog until the cycle limit or backlog is exhausted.

## Use this when

You have multiple tasks ready for implementation and want your agent to work through them one at a time, in order, without manual re-invocation between each task. Execute Task Cycles automates the loop: it runs a complete Execute Task pass, confirms success, then starts the next one.

Not the right fit for a single task (use Execute Task directly) or for writing the execution contract itself (use Task Execution Prompt).

## How it works

Execute Task Cycles wraps Execute Task in a bounded sequential controller:

1. **Resolve the cycle limit** — Uses your supplied limit if you provide one ("next 5 tasks", "max_cycles=10"). Otherwise defaults to 100 as a safety ceiling, not a promise to complete that many.

2. **Run one Execute Task pass per cycle** — Each cycle is a fresh invocation of the complete Execute Task workflow: canonical-prompt resolution, task selection from current state, implementation, validation, and reporting.

3. **Check before continuing** — Starts the next cycle only after the preceding pass produces a terminal "Complete" result and repository/task-source state is consistent. Every new cycle begins with fresh evidence while treating all changes from earlier successful cycles as current state.

4. **Stop on any non-complete result** — If a task is blocked, requires approval, hits an inconsistent state, or fails validation, the controller stops immediately. It does not skip to a fallback task or retry.

5. **Stop at the limit** — Even if more executable tasks remain, the controller stops when the cycle limit is reached.

6. **Report the aggregate** — Produces one final report covering all completed cycles: each task's identifier, result, changed files, validation evidence, and timing, plus the stopping reason.

## Inputs

- **A repository with a multi-task backlog** — Linear, GitHub Issues, or Markdown ticket files
- **Optionally, a cycle limit** — a number like "5 tasks" or "max_cycles=10" (defaults to 100)
- **Optionally, a canonical execution prompt** — inherited by each inner Execute Task pass

## Outputs

- Multiple completed tasks, each with validated implementation
- An aggregate report covering: effective maximum, completed cycle count, per-cycle details (task, result, files, validation, timing), and the stopping reason
- Updated task-source state reflecting all completed work

## Prerequisites

A repository with decomposed tasks ready for implementation. Execute Task is the inner loop — Execute Task Cycles runs it repeatedly.

## Installation and use

Execute Task Cycles is available as an agent skill. Invoke it when you want multiple tasks processed:

```
Read the Execute Task Cycles skill and work through the next 5 tasks in this repository.
```

The skill triggers only on explicit multi-task signals: "process the next 10 tasks", "work through all remaining issues", "keep completing tasks until done." Generic continuation language does not activate it.

## Example

> "Work through all remaining tasks in the backlog for this repository."

The agent resolves the default limit of 100, then runs Execute Task passes sequentially. Cycle 1 completes PRJ-042 (pagination). Cycle 2 completes PRJ-043 (search filters). Cycle 3 encounters PRJ-044 which is marked as requiring human approval — the controller stops and reports: "2 cycles completed. Cycle 3 stopped: PRJ-044 requires approval. Elapsed: 34 minutes total."
