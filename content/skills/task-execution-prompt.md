---
skill_id: task-execution-prompt
updated: 2026-10-23
---

# Task Execution Prompt

Define how agents select, implement, verify, and deliver work in your repository.

## Use this when

Your project has an approved plan and tasks, and needs a repeatable execution contract for interactive or AFK work.

## How it works

The agent reads the real task source, repository instructions, architecture, checks, and delivery workflow. It creates or updates `TASK-EXECUTION-PROMPT.md` around those existing contracts.

The prompt makes automatic repair the default, distinguishes task completion from human-blocked work, and defines the meaningful decisions that require the owner. Available asynchronous questions and authorized notifications keep the owner informed while independent ready work continues.

Explicit scope and resource limits remain binding. A slow reply does not justify marking a blocked task complete or abandoning independent authorized work.

## Outputs

A repository-specific execution prompt with task selection, implementation, verification, delivery, recovery, and reporting requirements.

## Try it

> Use Task Execution Prompt to prepare this repository for AFK execution of the approved backlog.
