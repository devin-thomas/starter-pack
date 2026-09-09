---
name: starter-pack
description: Start, resume, or inspect Starter Pack learner progress; route the current phase to its focused resources.
version: 0.1.8
updated: 2026-09-08
---

# Starter Pack

1. Inspect available environment facts and existing learner progress. Ask only for facts that affect the next action and cannot be inferred. On a phone, check for an existing remote harness; otherwise continue phone-capable Phase 1 work.
2. Load or create state using the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). Preserve existing completed steps and notes. With no filesystem access, provide updated copyable or downloadable JSON. Completion criterion: an identified state source and a clear resume step.
3. Fetch the current phase from the [catalog](https://starter.devthomas.site/agent/catalog.json), not the entire curriculum. Present one next action. Explain unfamiliar concepts only when needed. Accept learner reports of completion; distinguish those reports from checks you performed.
4. Record the step outcome and any remaining action using the progress guide's status semantics. If confused, clarify before advancing. If a step fails, preserve successes and offer troubleshooting or deferral. Store only nonsecret facts.
5. At Phase 2 entry, load the existing local, portable, or repository progress without requiring a private repo first. Read [Computer Setup](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md) to install and authenticate Git and GitHub CLI when needed. As soon as authenticated GitHub write access is available, create or confirm a private progress repo, preserve and push the existing state, and verify it remotely using the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). Existing connected GitHub tools can save it earlier; they do not replace the computer baseline. Start [Quick Build](https://starter.devthomas.site/skills/quick-build/current/SKILL.md) only after Computer Setup, verified phone interaction, and confirmed private remote progress are complete. If repository creation, authentication, or saving fails, preserve local progress and resolve that gate before Quick Build. Phase 2 still requires a verified live project; deferrals do not satisfy these gates.
6. Read [Phase 3](https://starter.devthomas.site/phases/3.md) only when requested or Phase 2 is complete. Explain its preview status; do not represent it as a complete course.

## Phone app and harness routing

ChatGPT, Claude, and Cursor users should use their provider's official mobile app with the same account they use on the computer, including the account holding their subscription when applicable. Use Cursor's supported browser app where its native app is unavailable. Confirm they can send a message. Ask for a different setup only when a unique circumstance is not covered by the documented paths; do not require a new subscription.

For Google users, Gemini is the phone chat app with its available agent features; Antigravity is the separate computer harness. Have the learner use the Google account with their Google AI subscription or access where applicable. Reaching their Antigravity instance from a phone uses its [browser Remote Control dashboard](https://antigravity.google.com/) with the same Google account as that instance. Inspect actual tools before claiming filesystem or computer access. Gemini chat alone is neither an Antigravity connection nor proof that remote access works.

Without a configured remote instance, guide Phase 1 in Gemini and preserve portable progress. At Phase 2 entry, move the handoff and progress into Antigravity on the computer or its connected browser session. Do not assume conversation history or files transfer automatically. Use the [remote access guide](https://starter.devthomas.site/setup/remote-access.md) for setup, keeping account sign-in private.

Recommend Gemini Spark for Phase 1 companion tasks when available, using the eligibility and entry instructions in the current phase. Ordinary Gemini chat remains a fallback; no upgrade is required. Keep Google's agent-driven deployment work in Antigravity under this pack's route. Spark access does not establish access to the learner's Antigravity instance.

## Phase 1 completion

Before the instant build, confirm the learner's primary AI phone app is signed in and can send a message, GitHub Mobile is signed into the learner's GitHub account and can open their profile, and an authenticator app is installed and ready to use. These are required, alongside the core accounts, one instant builder, and an app with an observable working behavior. A password manager alone does not replace authenticator readiness. Google Authenticator is Devin's choice; an existing working authenticator counts.

Passkeys may mean no account currently needs a six-digit code. Do not require an unnecessary code enrollment or a Stripe, Heroku, or n8n account just to prove readiness. If the learner chooses code-based 2FA for a service, confirm they finish enrollment and report a working code there. Never ask them to send codes, setup keys, or recovery information to the agent.

Record the phone requirements separately as `primary-ai-phone-app`, `github-mobile`, and `authenticator`. Confirm missing records when resuming older progress; preserve other completed work. These requirements cannot be skipped or deferred while marking Phase 1 complete. Trust clear learner reports and identify them as reports in the record.

## Optional choices

Ask separately and plainly whether the learner wants to save the instant app, connect it to GitHub, make it public, work on it later, or create an optional Vercel account. Record each answer. An optional step declined is skipped; it does not prevent Phase 1 completion. Prior authorization for a specific action remains valid.

## Phase 1 deployment extra credit

Offer deployment only after the learner has a working instant app, is confident in the idea, is comfortable with a public app, and has a usable route: static file upload from their phone, a computer now, an already configured remote harness capable of project work, connected mobile deployment tools, or a supported cloud coding environment. Ask whether they want to deploy and establish the intended destination and visibility before publishing. Keep app visibility, source repository visibility, and the private progress repository distinct.

For a static HTML/CSS/JavaScript site, offer the [Cloudflare iPhone upload guide](https://starter.devthomas.site/help/cloudflare-iphone). This is agent-neutral: any chat or agent that provides the site files can help, while the learner uploads them through Files and Safari. No Cloudflare connector, GitHub repository or computer is required for this route. A ZIP or separate files must be saved as actual files with index.html at the upload folder's root. Do not assume every environment can attach downloads; inspect available file-delivery tools. The walkthrough's successful ChatGPT test does not make ChatGPT a prerequisite. This manual upload option also applies to files prepared with Gemini; the separate agent-driven Google deployment route remains Antigravity.

Follow the current Phase 1 provider guidance and fetch the [mobile deployment guide](https://starter.devthomas.site/setup/mobile-deployment.md) only when this extra credit is relevant. ChatGPT mobile deployment through connected Vercel tools and a separate GitHub repository handoff have been reported working by Devin. Inspect the current tool list and permissions: GitHub access can include writes, and missing repository creation does not mean missing file or commit access. Where needed, have the learner create an empty repository in GitHub Mobile, then continue with the connected agent. Direct Vercel file deployment does not inherently require GitHub or a local harness. Claude's mobile Vercel connector and Cursor cloud MCP tools also enable potential direct deployment routes; distinguish documented support from a completed learner test. For agent-driven deployment, route Gemini/Spark users to Antigravity; manual Cloudflare file upload remains available. Never infer capabilities or limitations from the provider name alone.

For a Git-connected Vercel project, distinguish branch previews from the approved production release. Confirm the deployed URL and expected app content using an unauthenticated request, including the final redirect destination; HTTP 200 from a hosting login page is not success. Have the learner open the link signed out and try its main action. Authenticated fetch tools prove access to a protected deployment, not public availability. Explain and obtain authorization for any sharing-setting change outside the learner's approved scope. Confirm a source commit separately if saving to GitHub was chosen. Record the chosen route, consent, live link, and reported or checked result as nonsecret notes under `phase-1-deployment-extra-credit`. Declined extra credit is skipped; accepted work postponed for access or setup is deferred with a resume point. Neither status prevents Phase 1 completion. Do not force Computer Setup early or count this deployment as completion of Phase 2.

## Lessons from Devin's projects

The phase guides include short first-person case studies and practice prompts. Use the lesson nearest the learner's current action when it helps explain a decision. Adapt its question to their own idea, then return to the next step. Do not turn every lesson into required homework or make the learner reproduce Devin's projects. The catalog includes direct reading links to the lessons.

Domain Expansion supports clarifying an idea, trying the first result, and choosing optional follow-through. Daily Combo Trials supports project scope, precise behavior, and persistence. Perfect Playlist starts with Devin's request for the exact songs from The Paradox's Tiny Desk, then focuses Phase 3 on a structured build, API and developer-app setup, a PyPI release, a custom domain, and portfolio presentation. Its motivation is a verified setlist-to-playlist workflow with Spotify as an optional destination; do not imply other streaming-service integrations have shipped. Keep this case study focused on building and releasing, rather than restoring the removed historical API-failure lesson. An owner report or dated test has the limits stated in the story; it is not permission to run an example or change the learner's stack. Keep Cloudflare and the phase completion requirements unchanged. Saving or repairing an instant build does not replace the meaningful Phase 2 harness build.

## Finish a session

State what is complete, what is deferred, where progress is saved, and the single next action. Never imply that the website independently tracks or certifies completion.
