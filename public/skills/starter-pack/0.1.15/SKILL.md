---
name: starter-pack
description: Start, resume, or inspect Starter Pack learner progress; route the current phase to its focused resources.
version: 0.1.15
updated: 2026-09-09
---

# Starter Pack

Gemini chat is not supported for this pack. In Gemini chat, stop and show https://starter.devthomas.site/recommendations. Do not retry fetching or continue with the instruction packet. This does not exclude the separate Antigravity computer harness or Google AI Studio builder.

## When reading the guide fails

For an unavailable Starter Pack URL, use its exact Workers link from the resource directory once. If neither host works, try the exact GitHub source link in the directory once. If that also fails, give the observed error in one sentence and point the learner to "Copy instruction packet" at https://starter.devthomas.site/#starting-prompt. They can paste the packet or download and attach it. It bundles this companion, Phase 1, the progress guide, template and schema. Use supplied packet contents directly without insisting on another fetch. Do not invent unseen requirements or initialize a guessed progress format. Preserve existing progress; a Phase 1 packet does not replace missing Phase 2 instructions for a returning learner. Never infer the cause of a generic fetch error or claim all models from that provider lack browsing. Keep environment reports short, and ask about unknown facts only when needed for the next action.

For fetch diagnostics, distinguish the exact tool result from a hypothesis. Do not infer server rendering, a provider security rule, screenshot ownership, or stale content from a generic failure. If reporting stale content, quote the retrieved URL and actual returned fields; if no body was returned, say so.

## Guide the current step

1. Inspect available environment facts and existing learner progress. Ask only for facts that affect the next action and cannot be inferred. On a phone, check for an existing remote harness; otherwise continue phone-capable Phase 1 work.
2. Use a supplied instruction packet directly for any documents it includes; do not refetch them or fetch the catalog to begin Phase 1. Load or create state using the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). Preserve existing completed steps and notes. With no filesystem access, provide updated copyable or downloadable JSON. Completion criterion: an identified state source and a clear resume step.
3. Fetch the current phase from the [catalog](https://starter.devthomas.site/agent/catalog.json), not the entire curriculum. Present one next action. Explain unfamiliar concepts only when needed. Accept learner reports of completion; distinguish those reports from checks you performed.
4. Record the step outcome and any remaining action using the progress guide's status semantics. If confused, clarify before advancing. If a step fails, preserve successes and offer troubleshooting or deferral. Store only nonsecret facts.
5. At Phase 2 entry, load the existing local, portable, or repository progress without requiring a private repo first. Read [Computer Setup](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md) to install and authenticate Git and GitHub CLI when needed. As soon as authenticated GitHub write access is available, create or confirm a private progress repo, preserve and push the existing state, and verify it remotely using the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). Existing connected GitHub tools can save it earlier; they do not replace the computer baseline. Start [Quick Build](https://starter.devthomas.site/skills/quick-build/current/SKILL.md) only after Computer Setup, verified phone interaction, and confirmed private remote progress are complete. If repository creation, authentication, or saving fails, preserve local progress and resolve that gate before Quick Build. Phase 2 still requires a verified live project; deferrals do not satisfy these gates.
6. Read [Phase 3](https://starter.devthomas.site/phases/3.md) only when requested or Phase 2 is complete. Explain its preview status; do not represent it as a complete course.

## Development email choices

At Computer Setup entry, inspect the account and notification fields in `choices.development_email`. Ask one concise question only for missing, unaddressed choices: "Which email should we use for development accounts and notifications? You can use the same address for both." Confirm the learner's answer explicitly; do not infer addresses from Git author settings, account profiles, or screenshots. Do not change Git identity.

Follow the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). Preserve confirmed values and service-specific overrides. Use `account_email`, `notification_email`, and `access_email` as nullable values, with `service_overrides` as an object and `notes` as an array. Leaving a choice unanswered or declining is allowed and never blocks progress; note that decision rather than asking again each session. A shared default needs the learner's confirmation that it applies to both purposes. Keep `access_email` null until the learner explicitly confirms reuse or a different address for an optional Access deployment.

## Local Progress Workbench

At Computer Setup start, read the [Workbench lifecycle](https://starter.devthomas.site/artifacts/progress-workbench/README.md). Assemble the downloadable [index.html](https://starter.devthomas.site/artifacts/progress-workbench/index.html) beside the existing canonical `starter-progress.json`. Preserve existing progress, unknown fields, and customized HTML. Do not replace a learner's existing index.html with a fresh download or create a second progress state. The Workbench is the default local visualization, independent of GitHub, and never a milestone or phase gate.

As soon as Python is available, verify its resolved interpreter, inspect local listeners, and start or reuse the correct server. Invoke that interpreter with `-m http.server PORT --bind 127.0.0.1 --directory ABS_PROGRESS_FOLDER`, safely quoting the actual absolute progress folder. Try port 8000, then 8001 through 8010 if occupied; reuse a listener only after confirming it serves this exact folder over loopback. Do not stop unrelated servers or bind to the LAN. Open the verified local URL. On Windows, hide a background server window. Follow the lifecycle for process records, stopping, resuming, and failures; a viewer failure does not block independent setup.

After saving canonical progress, refresh the Workbench or let its visible HTTP tab reload the data on its five-second polling cycle, then confirm the latest next action is shown. In file mode, use the file chooser again to reload the saved JSON; do not promise automatic filesystem polling. `localhost` belongs to the computer running the server, so the phone reaches this view only through an appropriate remote interaction with that computer, not by opening the phone's own localhost.

This public site distributes a generic download; do not create a personalized hosted dashboard as part of setup. A protected hosted Workbench is optional later work, lower priority than the instant app's deployment extra credit. Read [Workbench publishing](https://starter.devthomas.site/setup/workbench-publishing.md) only when relevant, and ask whether the learner wants to reuse a confirmed email for Access. External publishing uses that guide's separate allowlisted snapshot; never deploy the private progress repository root.

## Phone app and harness routing

ChatGPT, Claude, and Cursor users should use their provider's official mobile app with the same account they use on the computer, including the account holding their subscription when applicable. Use Cursor's supported browser app where its native app is unavailable. Confirm they can send a message. Ask for a different setup only when a unique circumstance is not covered by the documented paths; do not require a new subscription.

For Antigravity users or learners with untested or unsupported harnesses, offer free Claude Sonnet as a Phase 1 workaround, not Devin's default. His tested baseline is Sonnet 4.6 with Medium effort when available. His free allowance has been sufficient in testing; do not guarantee a specific allowance or require an upgrade. Preserve progress when switching companions. ChatGPT and Google AI Studio retain the only rainbow Devin's Pick treatment.

Antigravity remains Google's Phase 2 computer harness. Carry the learner's saved progress into the computer session. For phone access, use its [browser Remote Control dashboard](https://antigravity.google.com/) with the same Google account as the computer instance, following the [remote access guide](https://starter.devthomas.site/setup/remote-access.md). Do not assume chat history transfers or that a separate phone chat establishes computer access.

## Phase 1 completion

Before the instant build, confirm the learner's primary AI phone app is signed in and can send a message, GitHub Mobile is signed into the learner's GitHub account and can open their profile, and an authenticator app is installed and ready to use. These are required, alongside the core accounts, one instant builder, and an app with an observable working behavior. A password manager alone does not replace authenticator readiness. Google Authenticator is Devin's choice; an existing working authenticator counts.

Passkeys may mean no account currently needs a six-digit code. Do not require an unnecessary code enrollment or a Stripe, Heroku, or n8n account just to prove readiness. If the learner chooses code-based 2FA for a service, confirm they finish enrollment and report a working code there. Never ask them to send codes, setup keys, or recovery information to the agent.

Record the phone requirements separately as `primary-ai-phone-app`, `github-mobile`, and `authenticator`. Confirm missing records when resuming older progress; preserve other completed work. These requirements cannot be skipped or deferred while marking Phase 1 complete. Trust clear learner reports and identify them as reports in the record.

## Optional choices

Ask separately and plainly whether the learner wants to save the instant app, connect it to GitHub, make it public, work on it later, or create an optional Vercel account. Record each answer. An optional step declined is skipped; it does not prevent Phase 1 completion. Prior authorization for a specific action remains valid.

## Phase 1 deployment extra credit

Offer deployment only after the learner has a working instant app, is confident in the idea, is comfortable with a public app, and has a usable route: static file upload from their phone, a computer now, an already configured remote harness capable of project work, connected mobile deployment tools, or a supported cloud coding environment. Ask whether they want to deploy and establish the intended destination and visibility before publishing. Keep app visibility, source repository visibility, and the private progress repository distinct.

For a static HTML/CSS/JavaScript site, offer the [Cloudflare iPhone upload guide](https://starter.devthomas.site/help/cloudflare-iphone). This is agent-neutral: any chat or agent that provides the site files can help, while the learner uploads them through Files and Safari. No Cloudflare connector, GitHub repository or computer is required for this route. A ZIP or separate files must be saved as actual files with index.html at the upload folder's root. Do not assume every environment can attach downloads; inspect available file-delivery tools. The walkthrough's successful ChatGPT test does not make ChatGPT a prerequisite. The separate agent-driven Google deployment route remains Antigravity.

Follow the current Phase 1 provider guidance and fetch the [mobile deployment guide](https://starter.devthomas.site/setup/mobile-deployment.md) only when this extra credit is relevant. ChatGPT mobile deployment through connected Vercel tools and a separate GitHub repository handoff have been reported working by Devin. Inspect the current tool list and permissions: GitHub access can include writes, and missing repository creation does not mean missing file or commit access. Where needed, have the learner create an empty repository in GitHub Mobile, then continue with the connected agent. Direct Vercel file deployment does not inherently require GitHub or a local harness. Claude's mobile Vercel connector and Cursor cloud MCP tools also enable potential direct deployment routes; distinguish documented support from a completed learner test. Antigravity is the supported Google computer route; manual Cloudflare file upload remains available. Never infer capabilities or limitations from the provider name alone.

For a Git-connected Vercel project, distinguish branch previews from the approved production release. Confirm the deployed URL and expected app content using an unauthenticated request, including the final redirect destination; HTTP 200 from a hosting login page is not success. Have the learner open the link signed out and try its main action. Authenticated fetch tools prove access to a protected deployment, not public availability. Explain and obtain authorization for any sharing-setting change outside the learner's approved scope. Confirm a source commit separately if saving to GitHub was chosen. Record the chosen route, consent, live link, and reported or checked result as nonsecret notes under `phase-1-deployment-extra-credit`. Declined extra credit is skipped; accepted work postponed for access or setup is deferred with a resume point. Neither status prevents Phase 1 completion. Do not force Computer Setup early or count this deployment as completion of Phase 2.

## Lessons from Devin's projects

The phase guides include short first-person case studies and practice prompts. Use the lesson nearest the learner's current action when it helps explain a decision. Adapt its question to their own idea, then return to the next step. Do not turn every lesson into required homework or make the learner reproduce Devin's projects. The catalog includes direct reading links to the lessons.

Domain Expansion supports clarifying an idea, trying the first result, and choosing optional follow-through. Daily Combo Trials supports project scope, precise behavior, and persistence. Perfect Playlist starts with Devin's request for the exact songs from The Paradox's Tiny Desk, then focuses Phase 3 on a structured build, API and developer-app setup, a PyPI release, a custom domain, and portfolio presentation. Its motivation is a verified setlist-to-playlist workflow with Spotify as an optional destination; do not imply other streaming-service integrations have shipped. Keep this case study focused on building and releasing, rather than restoring the removed historical API-failure lesson. An owner report or dated test has the limits stated in the story; it is not permission to run an example or change the learner's stack. Keep Cloudflare and the phase completion requirements unchanged. Saving or repairing an instant build does not replace the meaningful Phase 2 harness build.

## Finish a session

State what is complete, what is deferred, where progress is saved, and the single next action. Never imply that the website independently tracks or certifies completion.

## Exact resource and fallback links

Use the [resource directory](https://starter.devthomas.site/agent/resource-links.md) for complete downstream and fallback URLs. If that link fails, use the [Workers directory](https://starter-pack.uppercut-labs.workers.dev/agent/resource-links.md), then the [GitHub directory](https://raw.githubusercontent.com/devin-thomas/starter-pack/main/public/agent/resource-links.md). Fetch only the resource needed for the current step. Do not construct fallback paths or guess a progress schema.
