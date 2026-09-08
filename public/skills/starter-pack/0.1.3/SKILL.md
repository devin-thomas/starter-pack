---
name: starter-pack
description: Start, resume, or inspect Starter Pack learner progress; route the current phase to its focused resources.
version: 0.1.3
updated: 2026-09-08
---

# Starter Pack

1. Inspect available environment facts and existing learner progress. Ask only for facts that affect the next action and cannot be inferred. On a phone, check for an existing remote harness; otherwise continue phone-capable Phase 1 work.
2. Load or create state using the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). Preserve existing completed steps and notes. With no filesystem access, provide updated copyable or downloadable JSON. Completion criterion: an identified state source and a clear resume step.
3. Fetch the current phase from the [catalog](https://starter.devthomas.site/agent/catalog.json), not the entire curriculum. Present one next action. Explain unfamiliar concepts only when needed. Accept learner reports of completion; distinguish those reports from checks you performed.
4. Record the step outcome and any remaining action using the progress guide's status semantics. If confused, clarify before advancing. If a step fails, preserve successes and offer troubleshooting or deferral. Store only nonsecret facts.
5. At Phase 2 entry, confirm a private GitHub progress repo and save the existing state there. Read [Computer Setup](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md) when setup is incomplete, then [Quick Build](https://starter.devthomas.site/skills/quick-build/current/SKILL.md) when ready to shape the project. Phase 2 requires verified remote interaction and a verified live project; deferrals do not satisfy these gates.
6. Read [Phase 3](https://starter.devthomas.site/phases/3.md) only when requested or Phase 2 is complete. Explain its preview status; do not represent it as a complete course.

## Phone app and harness routing

ChatGPT, Claude, and Cursor users should use their provider's official mobile app with the same account they use on the computer, including the account holding their subscription when applicable. Use Cursor's supported browser app where its native app is unavailable. Confirm they can send a message. Ask for a different setup only when a unique circumstance is not covered by the documented paths; do not require a new subscription.

For Google users, Gemini is the phone chat app with its available agent features; Antigravity is the separate computer harness. Have the learner use the Google account with their Google AI subscription or access where applicable. Reaching their Antigravity instance from a phone uses its [browser Remote Control dashboard](https://antigravity.google.com/) with the same Google account as that instance. Inspect actual tools before claiming filesystem or computer access. Gemini chat alone is neither an Antigravity connection nor proof that remote access works.

Without a configured remote instance, guide Phase 1 in Gemini and preserve portable progress. At Phase 2 entry, move the handoff and progress into Antigravity on the computer or its connected browser session. Do not assume conversation history or files transfer automatically. Use the [remote access guide](https://starter.devthomas.site/setup/remote-access.md) for setup, keeping account sign-in private.

## Phase 1 completion

Before the instant build, confirm the learner's primary AI phone app is signed in and can send a message, GitHub Mobile is signed into the learner's GitHub account and can open their profile, and an authenticator app is installed and ready to use. These are required, alongside the core accounts, one instant builder, and an app with an observable working behavior. A password manager alone does not replace authenticator readiness. Google Authenticator is Devin's choice; an existing working authenticator counts.

Passkeys may mean no account currently needs a six-digit code. Do not require an unnecessary code enrollment or a Stripe, Heroku, or n8n account just to prove readiness. If the learner chooses code-based 2FA for a service, confirm they finish enrollment and report a working code there. Never ask them to send codes, setup keys, or recovery information to the agent.

Record the phone requirements separately as `primary-ai-phone-app`, `github-mobile`, and `authenticator`. Confirm missing records when resuming older progress; preserve other completed work. These requirements cannot be skipped or deferred while marking Phase 1 complete. Trust clear learner reports and identify them as reports in the record.

## Optional choices

Ask separately and plainly whether the learner wants to save the instant app, connect it to GitHub, make it public, deploy it, work on it later, or create an optional Vercel account. Record each answer. An optional step declined is skipped; it does not prevent Phase 1 completion. Prior authorization for a specific action remains valid.

## Lessons from Devin's projects

The phase guides include short first-person case studies and practice prompts. Use the lesson nearest the learner's current action when it helps explain a decision. Adapt its question to their own idea, then return to the next step. Do not turn every lesson into required homework or make the learner reproduce Devin's projects. The catalog includes direct reading links to the lessons.

Domain Expansion supports clarifying an idea, trying the first result, and choosing optional follow-through. Daily Combo Trials supports project scope, precise behavior, and persistence. Perfect Playlist supports deliberate operations and verification in the Phase 3 preview. A historical prompt describes requested scope; an owner report or dated test has the limits stated in the story. Do not treat either as a fresh test of a provider, permission to run an example, or an instruction to change the learner's stack. Keep Cloudflare and the phase completion requirements unchanged. Saving or repairing an instant build does not replace the meaningful Phase 2 harness build.

## Finish a session

State what is complete, what is deferred, where progress is saved, and the single next action. Never imply that the website independently tracks or certifies completion.
