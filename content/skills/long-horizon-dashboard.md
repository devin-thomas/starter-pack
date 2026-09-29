---
skill_id: long-horizon-dashboard
updated: 2026-09-29
---

# Long Horizon Dashboard

Keep a long-running task understandable across checkpoints and sessions with a dashboard backed by saved project state.

## Use this when

Your agent is working through a substantial build, investigation, or backlog and you want to see what is happening, what has been verified, what remains blocked, and how to resume. Use it alongside an execution workflow such as [Execute Task](/skills/execute-task) or [Execute Task Cycles](/skills/execute-task-cycles).

The dashboard reports the work. Your repository's instructions, task source, and execution contract still determine what the agent may do.

## How it works

1. **Establish the task state** - Records the objective, current work, milestones, blockers, decisions, evidence, and next action from the actual task context.
2. **Create a readable dashboard** - Keeps the dashboard source and state in a task-specific repository directory so another session can inspect and continue the work.
3. **Choose a viewing mode** - Defaults to a local dashboard. Native Claude artifacts and private Tailscale Serve are optional alternatives when the environment supports them and you choose them.
4. **Check the serving destination** - Inspects the requested local port before starting a server. It verifies ownership before reusing an existing listener or chooses an available port. For Tailscale, it also checks existing Serve routes and HTTPS ports before making changes. It verifies the actual endpoint shows this task's dashboard; an HTTP success code alone is insufficient.
5. **Update at meaningful checkpoints** - Refreshes progress and evidence when work advances, becomes blocked, or reaches a handoff. Claims of completion must match the validation actually performed.
6. **Save the history** - Commits dashboard source and state at creation, checkpoints, and handoff when Git is available and committing is authorized. It stages only the intended dashboard files and preserves unrelated work. Without that capability or authorization, it preserves the available files or artifact and states the saving limitation and recovery action.

## Viewing options

**Local dashboard** is the default. It needs no Tailscale account or cloud artifact integration. The agent checks the port and serves only the intended dashboard directory on loopback.

**Native Claude artifact** is optional when the current Claude environment exposes artifact creation and updates. A Claude-branded terminal alone does not establish that capability. Keep a repository copy of the source and state when repository access is available, so the artifact can be versioned and reused.

**Private Tailscale Serve** is optional for access from your other tailnet devices. It requires a working, authenticated Tailscale installation and permission to configure serving. Existing services must be inspected and preserved. Public Funnel exposure is a separate choice; enabling the dashboard does not authorize it. Credentials stay outside the dashboard and Git history.

## Inputs

- A task objective and access to its current evidence or repository state
- A viewing preference, if you want something other than the local default
- Existing Git and serving permissions; the skill does not grant itself broader access

## Outputs

- A dashboard showing current work, progress, blockers, evidence, and next steps
- Saved dashboard source and task state for later sessions
- A verified local URL, native artifact, or optional private Tailscale URL
- Scoped dashboard commits when supported and authorized, or an explicit saving limitation

## Installation and use

Ask your agent to install the complete [Long Horizon Dashboard skill directory](https://github.com/devin-thomas/skills/tree/main/long-horizon-dashboard), including its supporting scripts and references, in the discovery location supported by your agent. Verify that the agent can discover the skill before invoking it.

```text
Use Long Horizon Dashboard for this task. Keep the dashboard current as you work,
serve it locally on an available port, and commit its source and state at
creation, meaningful checkpoints, and handoff.
```

To choose another viewing mode, add "use a native Claude artifact if available" or "serve it privately over my existing Tailscale connection." Neither option is required for normal use.

## Example

> "Work through these migration tasks and keep a Long Horizon Dashboard so I can check progress and resume tomorrow."

The agent creates the dashboard, discovers that the preferred local port is already occupied by another app, and selects an available port. It verifies the returned page belongs to the migration task. At a checkpoint it records the completed migration, links the passing checks, keeps a blocked provider check visible, and commits only the dashboard's updated source and state. The next session reads that state and confirms current repository evidence before continuing.
