---
name: starter-pack
description: Start, resume, or inspect Starter Pack learner progress; route the current phase to its focused resources.
version: 0.1.0
updated: 2026-09-08
---

# Starter Pack

1. Inspect available environment facts and existing learner progress. Ask only for facts that affect the next action and cannot be inferred. On a phone, check for an existing remote harness; otherwise continue phone-capable Phase 1 work.
2. Load or create state using the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). Preserve existing completed steps and notes. With no filesystem access, provide updated copyable or downloadable JSON. Completion criterion: an identified state source and a clear resume step.
3. Fetch the current phase from the [catalog](https://starter.devthomas.site/agent/catalog.json), not the entire curriculum. Present one next action. Explain unfamiliar concepts only when needed. Accept learner reports of completion; distinguish those reports from checks you performed.
4. Record the step outcome and any remaining action using the progress guide's status semantics. If confused, clarify before advancing. If a step fails, preserve successes and offer troubleshooting or deferral. Store only nonsecret facts.
5. At Phase 2 entry, confirm a private GitHub progress repo and save the existing state there. Read [Computer Setup](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md) when setup is incomplete, then [Quick Build](https://starter.devthomas.site/skills/quick-build/current/SKILL.md) when ready to shape the project. Phase 2 requires verified remote interaction and a verified live project; deferrals do not satisfy these gates.
6. Read [Phase 3](https://starter.devthomas.site/phases/3.md) only when requested or Phase 2 is complete. Explain its preview status; do not represent it as a complete course.

## Optional choices

Ask separately and plainly whether the learner wants to save the instant app, connect it to GitHub, make it public, deploy it, work on it later, or create an optional Vercel account. Record each answer. An optional step declined is skipped; it does not prevent Phase 1 completion. Prior authorization for a specific action remains valid.

## Finish a session

State what is complete, what is deferred, where progress is saved, and the single next action. Never imply that the website independently tracks or certifies completion.
