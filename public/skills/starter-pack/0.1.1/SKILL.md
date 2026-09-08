---
name: starter-pack
description: Start, resume, or inspect Starter Pack learner progress; route the current phase to its focused resources.
version: 0.1.1
updated: 2026-09-08
---

# Starter Pack

1. Inspect available environment facts and existing learner progress. Ask only for facts that affect the next action and cannot be inferred. On a phone, check for an existing remote harness; otherwise continue phone-capable Phase 1 work.
2. Load or create state using the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). Preserve existing completed steps and notes. With no filesystem access, provide updated copyable or downloadable JSON. Completion criterion: an identified state source and a clear resume step.
3. Fetch the current phase from the [catalog](https://starter.devthomas.site/agent/catalog.json), not the entire curriculum. Present one next action. Explain unfamiliar concepts only when needed. Accept learner reports of completion; distinguish those reports from checks you performed.
4. Record the step outcome and any remaining action using the progress guide's status semantics. If confused, clarify before advancing. If a step fails, preserve successes and offer troubleshooting or deferral. Store only nonsecret facts.
5. At Phase 2 entry, confirm a private GitHub progress repo and save the existing state there. Read [Computer Setup](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md) when setup is incomplete, then [Quick Build](https://starter.devthomas.site/skills/quick-build/current/SKILL.md) when ready to shape the project. Phase 2 requires verified remote interaction and a verified live project; deferrals do not satisfy these gates.
6. Read [Phase 3](https://starter.devthomas.site/phases/3.md) only when requested or Phase 2 is complete. Explain its preview status; do not represent it as a complete course.

## Phase 1 completion

Before the instant build, confirm the learner's primary AI phone app is signed in and can send a message, GitHub Mobile is signed into the learner's GitHub account and can open their profile, and an authenticator app is installed and ready to use. These are required, alongside the core accounts, one instant builder, and an app with an observable working behavior. A password manager alone does not replace authenticator readiness. Google Authenticator is Devin's choice; an existing working authenticator counts.

Passkeys may mean no account currently needs a six-digit code. Do not require an unnecessary code enrollment or a Stripe, Heroku, or n8n account just to prove readiness. If the learner chooses code-based 2FA for a service, confirm they finish enrollment and report a working code there. Never ask them to send codes, setup keys, or recovery information to the agent.

Record the phone requirements separately as `primary-ai-phone-app`, `github-mobile`, and `authenticator`. Confirm missing records when resuming older progress; preserve other completed work. These requirements cannot be skipped or deferred while marking Phase 1 complete. Trust clear learner reports and identify them as reports in the record.

## Optional choices

Ask separately and plainly whether the learner wants to save the instant app, connect it to GitHub, make it public, deploy it, work on it later, or create an optional Vercel account. Record each answer. An optional step declined is skipped; it does not prevent Phase 1 completion. Prior authorization for a specific action remains valid.

## Finish a session

State what is complete, what is deferred, where progress is saved, and the single next action. Never imply that the website independently tracks or certifies completion.
