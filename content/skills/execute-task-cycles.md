---
skill_id: execute-task-cycles
updated: 2026-10-23
---

# Execute Task Cycles

Continue an authorized backlog through automatic repair, verification, and delivery, including while you are AFK.

## Use this when

You want several tasks, an implementation phase, or an entire authorized backlog completed. The agent resumes saved scope and honors your explicit task, time, cost, and host limits.

## How it works

Each cycle selects eligible work through [Execute Task](/skills/execute-task), verifies its result, saves progress, and selects the next ready item. Repairable failures trigger repair rather than an immediate owner handoff.

When a meaningful owner decision or genuine human blocker remains, the agent records it, asks asynchronously when supported, and attempts notification through an available authorized channel. It keeps the affected task pending and completes independent ready work while waiting.

The run ends when the authorized scope is complete, an explicit limit is reached, the user stops it, or all remaining work depends on unresolved human blockers. It has no invented default task-count cutoff.

## Outputs

A resumable record of completed work, verification, pending questions, and the next safe action.

## Try it

> Use Execute Task Cycles to complete the approved implementation backlog. Repair failures automatically, notify me of owner decisions, and continue independent work while I am away.
