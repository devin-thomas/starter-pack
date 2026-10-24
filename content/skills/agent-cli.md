---
skill_id: agent-cli
updated: 2026-10-23
---

# Agent CLI

Delegate a bounded task, start an interactive coding-agent chat, or hand a workspace to another installed agent CLI.

## Use this when

You explicitly want work performed through another agent CLI, or need to verify evidence from an earlier CLI run. This skill handles command-line agent sessions; ordinary in-process subagents and direct model API integrations use their own workflows.

## How it works

The agent checks which CLI and capabilities are actually available, reads its current help, and chooses the supported execution or continuation mode. It passes the task, workspace, constraints, and expected outputs, then verifies the resulting files and checks.

Interactive sessions retain their actual session identity and a working continuation path. A process starting does not prove the task finished; the agent reports the run status and evidence.

## Inputs and outputs

Provide the task, workspace, preferred agent, and any scope or runtime limits. The result is verified work or an accurately reported session you can resume. Credentials stay in the environment's existing managed configuration.

## Try it

> Use Agent CLI to ask an installed coding agent to review the parser in this project and return actionable findings.
