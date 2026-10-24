---
skill_id: execute-task
updated: 2026-10-23
---

# Execute Task

Complete one selected repository task through automatic repair, verification, and authorized delivery.

## Use this when

Explicitly ask an agent to select and execute the next eligible ticket from your repository's task source. For an authorized backlog or AFK run, use [Execute Task Cycles](/skills/execute-task-cycles). Ordinary continuation of already scoped work follows the conversation.

## How it works

The agent reads the repository's execution prompt, instructions, task source, and current state. It selects an executable task, implements it, repairs failures, runs relevant checks, and delivers within the authority already granted.

Routine build failures, missing local tools, and implementation defects are agent repair work. The agent stops dependent work when a genuine human blocker or meaningful owner decision remains, records the smallest needed action, and uses an available authorized notification channel. Independent authorized work can continue.

## Outputs

A completed task has implementation and verification evidence. A human-blocked task remains pending with a precise recovery path; it is never marked complete merely because the agent asked a question.

## Try it

> Use Execute Task to select and complete the next eligible task in this repository.
