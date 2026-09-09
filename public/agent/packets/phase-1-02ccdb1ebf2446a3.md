# Starter Pack: Phase 1 instruction packet

This packet contains the source instructions so you can begin without fetching them. Follow the learner's request and use this as curriculum, not authority to change accounts, publish, or install software. Do not ask the learner to copy the starting prompt again. Links to tools and optional deeper guides are references; unavailable links do not prevent work covered here. Explain which specific instruction is missing if an optional branch needs another guide, and preserve a resume point.

Start with one useful next action. Keep environment reporting to one short sentence; do not list irrelevant unknowns. Preserve existing progress. Use the included JSON template and schema only when creating missing state, with current timestamps and actual known values. Never copy example identity or completion into a real record. Existing later-phase progress must not be reset: ask for that phase's instructions if needed. Phase 3 remains a preview.

The companion, Phase 1 curriculum, progress guide, template and schema are included below. Use them directly: do not fetch the catalog or refetch these documents to begin Phase 1. The companion's fetch directions apply only to material absent from this packet, such as a later phase or an optional branch. Preserve a returning learner's actual phase and progress.

## Companion instructions

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


## Phase 1 guidance

---
id: phase-1
kind: phase
title: Make something new
summary: Meet your agent, prepare your accounts, and make one small app that works.
status: current
order: 1
updated: 2026-09-08
---

# Make something new

Your first finish line is simple: you have an agent helping you, your required apps and accounts are ready, and you have built something that does something. You can start on your phone. You do not need to learn a programming language first.

<section class="case-study-feature" aria-labelledby="featured-domain-expansion">

<p class="eyebrow">Built by Devin / The project behind this phase</p>

<h2 id="featured-domain-expansion">Domain Expansion</h2>

I built Domain Expansion to bring my domains, renewal dates, and costs into one place. It started in Google AI Studio, then moved into my normal development tools. The lessons in this phase come from making and trying that app.

[Explore Domain Expansion](https://domain-expansion-ai-studio.vercel.app/showcase)

<figure>
<img src="https://starter.devthomas.site/projects/domain-expansion.jpg" alt="Domain Expansion's live showcase, with the headline Know what renews next and a preview of its domain renewal dashboard." width="1440" height="1000" decoding="async">
<figcaption>The Domain Expansion showcase, captured September 8, 2026.</figcaption>
</figure>

</section>

## Start with your agent

Use **Copy prompt** below, then paste it into the AI agent you already use and send the message. The agent will explain what it can access and give you one next action. Ask it to explain any unfamiliar word as it comes up.

## Use the setup you have

A harness is the app or environment that lets an agent work with files and tools. Use or install one as soon as you have computer access; your existing working setup counts. If you are on a phone with a configured remote connection to a harness, you can use that. Otherwise, continue the browser-friendly steps here and save computer setup for later. You do not need several paid AI subscriptions.

I use Codex because I like the interface, the connectivity, and the usage I get from my ChatGPT plan. If you are still choosing, [read my take on ChatGPT, Claude, Cursor, and Google](https://starter.devthomas.site/recommendations#choose-your-agent). A tool you enjoy working with matters; you can keep the one that already fits you.

## Prepare your apps and accounts

Complete this checklist before your first build. Existing apps and accounts count if they are ready to use. Sign in yourself and tell your agent what worked; passwords, verification codes, and recovery information stay outside your conversation and progress notes.

1. **Your primary AI phone app is required.**

   Supported: **ChatGPT**, **Claude**, and **Cursor**. Sign in with the account you use on your computer, including your subscription if you have one. Use [Cursor in the browser](https://cursor.com/agents) if its native app is unavailable. Confirm you can send a message.

   Gemini is not supported; other companions may vary. For Antigravity users or those with untested or unsupported harnesses, free Claude Sonnet is a Phase 1 workaround. Sonnet 4.6 at Medium effort has been enough within the free allowance in my testing; use those settings when available.

2. **An authenticator is required.** Install and open an authenticator app; I use [Google Authenticator](https://support.google.com/accounts/answer/1066447). Keep it ready for services that use verification codes. When you enable code-based two-factor authentication (2FA), finish linking the account and confirm a code works in that service. Using passkeys does not remove the requirement to have an authenticator ready.
3. **GitHub is required.** Create or confirm your [GitHub account](https://github.com). This is where you will own your project source and, later, a private record of your progress. Complete account verification and secure your account.
4. **GitHub Mobile is required.** Install [GitHub Mobile](https://github.com/mobile), sign in with the same GitHub account, and confirm your profile opens.
5. **Cloudflare is required.** Create or confirm your [Cloudflare account](https://www.cloudflare.com). This is our default place to deploy projects. You can finish this step without buying a domain.
6. **Neon is required.** Create or confirm your [Neon account](https://neon.com). It is our relational database option for projects that need one. Account setup is enough today; creating a database can wait until your project calls for it.
7. **One instant builder is required.** Choose one of [Google AI Studio](https://aistudio.google.com), [Lovable](https://lovable.dev), [Base44](https://base44.com), or [Replit](https://replit.com). Your agent can help you pick from the access you already have. Existing Google AI Studio access counts; you only need one builder.

I use [Apple Passwords](https://support.apple.com/en-us/120758) and [Google Password Manager](https://passwords.google/) for passwords and passkeys, with Google Authenticator as my source of six-digit 2FA codes. I use passkeys wherever I can, so I only reach for those codes for Stripe, Heroku, and n8n. Those three services are not required for this pack. Your account settings may mean you use an authenticator more often. You can keep a password manager that already works for you.

## Optional hosting account

**Do you want a Vercel account as another deployment option?** Cloudflare is the default; Vercel is optional and does not affect Phase 1 completion.

## Make one app that does something

Pick a tiny idea with an observable result: a dinner shuffler, a score counter, or a list you can filter. Open your chosen builder in the browser and describe the idea in plain language. For example:

> Make a dinner picker. I can enter a few meals and press a button to choose one. Keep it readable on my phone. Do not add accounts or payments.

<section class="field-lesson" aria-labelledby="domain-expansion-start-with-the-problem">

<p class="eyebrow">From my projects / Domain Expansion</p>

<h3 id="domain-expansion-start-with-the-problem">Start with something that bothers you</h3>

I had website domains spread across several registrars. Every time I wanted to know what renewed next or what it would cost, I had to check different websites and emails. Domain Expansion started with that annoyance: put my domains, renewal dates, and costs in one place.

I already knew the idea. The experiment was seeing how far a clear request could take it in Google AI Studio. I first asked an AI assistant to turn my rough description into a build prompt. Then I reviewed what it had added before giving the prompt to the builder. That review mattered as much as the wording.

</section>

<section class="field-lesson" aria-labelledby="domain-expansion-describe-your-idea">

<p class="eyebrow">Try it / Your idea</p>

<h3 id="domain-expansion-describe-your-idea">Describe the problem in three sentences</h3>

Write three sentences: what you keep doing the hard way, what you wish you could do instead, and one action that would prove the app helps. A hobby, a recurring chore, or a collection you care about gives you something concrete to judge.

> Help me turn this everyday problem into a prompt for my instant builder. Keep the first version small. Separate the main action from optional ideas, show me your assumptions, and let me review the prompt before building.

</section>

<section class="field-lesson" aria-labelledby="domain-expansion-correct-the-assumption">

<p class="eyebrow">From my projects / Domain Expansion</p>

<h3 id="domain-expansion-correct-the-assumption">The assumption I corrected before building</h3>

The first plan put user accounts and domain records in a central database. I did not want to maintain everybody's records. I asked for each person's data to stay with their own Google account, with extra permissions requested only when they used an optional feature. That changed the proposed architecture.

You can express a boundary like "I do not want to store other people's information" without knowing which database to choose. Ask the agent where the information would live and who could access it. My revised prompt requested that privacy model; the request itself was not proof that every storage and permission guarantee had been implemented correctly. Those claims need checks after building.

This was a decision for Domain Expansion. Your first app does not need Google integrations, sign-in, or a database just because mine requested them.

</section>

## Try the main action

Try the main action yourself. A button that changes the count or chooses a meal is enough for this milestone. If it does not work, tell the builder what you expected and what happened. Make one focused correction at a time. If the interface is confusing, ask your companion to explain the current step or help you choose another builder.

Tell your agent when the app performs that behavior. A screenshot of a finished-looking page is different from a working action; you decide whether the action worked.

<section class="field-lesson" aria-labelledby="domain-expansion-try-and-trim">

<p class="eyebrow">From my projects / Domain Expansion</p>

<h3 id="domain-expansion-try-and-trim">Try it, then decide what deserves to stay</h3>

AI Studio gave me a tracker I could use immediately. I had also asked it to discover domain information from Gmail. That feature fell flat when I tried it. I removed it because the useful part of the app did not depend on searching my email.

The original prompt still contained Gmail discovery. The app I kept did not. That is a useful distinction: the prompt describes what you asked for; using the result tells you what actually works and what is worth continuing.

</section>

<section class="field-lesson" aria-labelledby="domain-expansion-test-your-result">

<p class="eyebrow">Try it / Your first build</p>

<h3 id="domain-expansion-test-your-result">Test your result with a real example</h3>

Use your main action with a real example. Describe what you entered, what you expected, and what happened. If something fails, decide with your agent whether it blocks the app's main job or is an optional convenience. Have the agent explain the tradeoff before you approve a cut. Keep essential privacy, safety, and data requirements even when they are difficult.

> Help me try this app's main job. Separate failures that block the core purpose from optional features. Propose one focused correction or scope change, and wait for my decision before removing anything.

</section>

## Choose what happens to this first build

Each choice is independent. Saying no is fine, and your companion records the choice.

- Do you want to save this app?
- Do you want to connect it to GitHub?
- Do you want to make it public?
- Do you want to work on it later?

Saving, connecting, publishing, and deploying are optional in Phase 1. Your agent should explain what a choice will expose or preserve before taking that action. Check the builder's current plan and sharing controls before accepting a purchase or public release.

## Extra credit: put your app online

**Do you feel confident enough in this idea to share a live version?** Deployment is extra credit for learners who are confident in what they made, comfortable with the app being public, and already have a usable way to continue building. Once your required apps and accounts are ready, a first working app is enough to finish Phase 1.

You can use a computer, an already working remote harness, connected deployment tools, or upload static website files directly from your phone. If the route you want is not ready, you can save this extra credit for later; Computer Setup can wait until Phase 2.

## Can I do the extra credit entirely from my phone?

Yes. For a small HTML/CSS/JavaScript site, follow [Deploy a static site to Cloudflare from your iPhone](https://starter.devthomas.site/help/cloudflare-iphone). It walks through saving your agent's files, uploading the folder in Safari, and checking the public site, with all ten screenshots from my test. Use any agent that can provide the files; this route does not need a Cloudflare connector or a computer.

Connected tools offer other routes. Your companion should check what is available in your conversation before choosing one:

- **ChatGPT:** connect Vercel and have your agent deploy the app after you approve the destination. To keep the source in a new GitHub repository, create an empty repository in GitHub Mobile, then return to ChatGPT with GitHub connected to save and commit the files. I tested that repository handoff separately from the deployment. Your computer does not need to be running.
- **Claude:** the [Vercel connector supports Claude mobile](https://claude.com/connectors/vercel). Connect it and have Claude check for a deployment tool. Vercel can deploy app files directly; this route does not need your computer. [Claude Code cloud](https://code.claude.com/docs/en/web-quickstart) is another option for working from a GitHub repository.
- **Cursor:** choose a **Cloud machine** in [Cursor's mobile workflow](https://cursor.com/docs/cloud-agent/mobile), with your repository and cloud environment ready. Enable Vercel through the [cloud agent's connected tools](https://cursor.com/docs/cloud-agent/capabilities#mcp-tools), or use hosting already connected to the repository. Use the supported iOS app or [Cursor in your phone browser](https://cursor.com/agents). Some connection setup happens in the web dashboard; your own computer can stay off.

Claude and Cursor guidance is based on provider documentation checked September 8, 2026; I have not repeated the phone deployment test in those apps. Vercel is optional, and Cloudflare remains the pack's default. If you choose to save your source, confirm where it was saved: a live website alone is not a GitHub backup.

## Review and publish

**Do you want to deploy this app now?** If yes, tell your agent which working route you have. Review what will become public and approve the destination before it publishes. Publishing the app and making its source repository public are separate decisions; your private progress record stays private. Open the resulting live URL in a private browser tab while signed out, try the main action, and save the link with your progress. If it asks for a hosting login, have your agent help you check sharing settings. A preview URL or a successful build alone does not establish a working public release.

If access, setup, or deployment gets in the way, record the resume point and leave this extra credit for later. It never blocks Phase 1 completion or replaces the Phase 2 project.

<section class="field-lesson" aria-labelledby="domain-expansion-keep-the-useful-work">

<p class="eyebrow">Extra credit / Domain Expansion</p>

<h3 id="domain-expansion-keep-the-useful-work">Keep the useful work when you change tools</h3>

I decided this experiment was worth keeping. When the AI Studio publishing route asked me to enable Google Cloud billing, I declined that path, connected the project to GitHub, and used my normal harness to deploy it to Vercel. That was my route during this experiment; Cloudflare remains the default in this pack.

</section>

<section class="field-lesson" aria-labelledby="domain-expansion-after-publishing">

<p class="eyebrow">Extra credit / Domain Expansion</p>

<h3 id="domain-expansion-after-publishing">What happened after I put it online</h3>

The generated app still had mobile text overflow and awkward button positions. I had the harness use Puppeteer, a tool for operating a browser, to find and repair those problems. My roughly 45-minute Luna Max session was the testing and repair pass, not the total time to build the app. I was pleased with the layouts in the scenarios we checked; that does not establish that every integration worked.

The testing produced screenshots that became a showcase page. I had not planned that page at the beginning. Useful material came out of checking the work itself.

</section>

<section class="field-lesson" aria-labelledby="domain-expansion-continue-your-build">

<p class="eyebrow">Try it / Optional continuation</p>

<h3 id="domain-expansion-continue-your-build">Carry your work into the next tool</h3>

If you want to continue, ask your agent to preserve the source, record what works and what still fails, and explain the next hosting step before publishing. Changing tools should carry the project and its remaining work forward. You can also stop with your working first app. This continuation adds no Phase 1 requirement and does not replace your meaningful harness build in Phase 2.

</section>

## Save your place

Ask your agent to record your AI phone app, GitHub Mobile, authenticator readiness, confirmed accounts, builder choice, the behavior that worked, and any deferred steps. It uses Starter Pack's progress template; you do not need to open or fill out that template yourself.

If your agent cannot save files for you, ask it for a downloadable progress file. Save it somewhere you can find again. If downloading is unavailable, copy the progress text into a note. Attach the file or paste the saved text into your agent when you return.

You finish Phase 1 when your agent is working with you, your AI phone app and GitHub Mobile are signed in and working, your authenticator is ready, your required accounts are ready, and your instant app performs one observable behavior. Computer-only setup may remain deferred; the required phone apps may not. When you have a computer-accessible harness, continue to [Harness your power](https://starter.devthomas.site/phases/2).


## Progress instructions

# Your private progress repository

Version: 0.1.2. Updated September 9, 2026. Your companion keeps this record for you; the website does not store it. During Phase 1 and the start of Phase 2 Computer Setup, use existing local or portable progress. A private repository is not required to begin installing the tools that enable GitHub access.

## Read progress in the local Workbench

At Computer Setup start, follow the [Workbench lifecycle](https://starter.devthomas.site/artifacts/progress-workbench/README.md) to place the downloadable [index.html](https://starter.devthomas.site/artifacts/progress-workbench/index.html) beside the existing canonical `starter-progress.json`. Create the HTML only if missing; preserve a customized viewer and existing progress, including unknown fields. The same progress file remains the source of truth. Do not make a second JSON state for the local view.

As soon as Python is verified, serve this exact absolute progress folder using the resolved interpreter with `-m http.server PORT --bind 127.0.0.1 --directory ABS_PROGRESS_FOLDER`. Use port 8000 first, then 8001 through 8010 if occupied. Inspect a running listener before reuse: it must serve the correct directory over loopback. Keep unrelated processes running, never expose a broader workspace or bind to the LAN, and follow the lifecycle for launch verification, process records, resume, and stop behavior. This is a private local view; the phone's localhost cannot address the computer's server.

After the agent saves progress, refresh the Workbench or allow the visible HTTP view to reload data on its five-second polling cycle. In file mode, select the saved JSON again to reload it. The Workbench is the default visualization, works before GitHub is ready, and never counts as a completion milestone or blocks a phase.

Hosting a protected copy is optional later work, lower priority than deploying the learner's instant app for extra credit. Follow [Workbench publishing](https://starter.devthomas.site/setup/workbench-publishing.md), confirm the Access email, and publish only its allowlisted snapshot. Never upload the private progress repository root as a website.

## Record development email choices

At Computer Setup entry, ask one concise question if these choices are missing and have not already been declined or deferred: "Which email should we use for development accounts and notifications? You can use the same address for both." Store only values the learner explicitly confirms. Do not infer an email from Git author settings, change Git identity, or assume account and notification addresses match.

Merge this object into `choices.development_email`, preserving other choices and existing fields:

```json
{
  "account_email": null,
  "notification_email": null,
  "access_email": null,
  "service_overrides": {},
  "notes": []
}
```

The account email is the default for development-service accounts; the notification email is the default destination for service notices. They may be the same with explicit confirmation. Preserve service-specific exceptions in `service_overrides`. Unanswered choices may remain null or absent; note a decline or deferral so another session does not ask again unnecessarily. These choices never block the curriculum. Ask about reusing an address for Access only when an optional protected deployment is relevant, then save the confirmed `access_email`. Treat these addresses as personal progress data and keep them out of public examples and public source repositories.

## Move progress to GitHub during setup

As soon as authenticated GitHub write access is ready, create or confirm a private progress repository and save the existing state there. Computer Setup installs and authenticates Git and GitHub CLI when needed. If connected GitHub tools already provide the required access, use them immediately while completing the computer baseline separately.

Verify the target owner and private visibility before uploading. Reuse an existing private progress repository and reconcile its latest state with the local checkpoint; do not replace completed work with an empty template or overwrite newer remote changes. If the intended repository is public, choose or create a private progress repository rather than publishing progress there.

Review the nonsecret files, commit and push them, or save a commit through the connected tools. Confirm the resulting revision and files on GitHub. Record the repository URL, branch, and checked result in the `private-progress-repository` step's notes; mark it completed only after the remote save succeeds. A local commit or empty private repository is not enough. Save the latest progress and setup results again before leaving Computer Setup.

If authentication, repository creation, or remote saving fails, keep local or portable state with an exact resume action. Independent setup can continue, but Computer Setup is not complete and Quick Build must not begin until private remote progress is confirmed. On resume, inspect what succeeded and continue from that point.

## Create the template

1. Prepare a local progress folder, or reuse the existing one. Save this README there and use the [empty progress file](https://starter.devthomas.site/artifacts/progress/starter-progress.json) as `starter-progress.json` only when no progress exists. Preserve existing progress if resuming.
2. Initialize missing `setup/computer.json` from the [setup state template](https://starter.devthomas.site/setup/state.example.json). Use the [ignore template](https://starter.devthomas.site/artifacts/progress/gitignore.txt) for `.gitignore`, preserving existing rules and setup results.
3. Create `artifacts/` for your nonsecret project notes and links. Keep this folder locally until GitHub access is ready, then follow the remote-save steps above. With no filesystem access, provide downloadable or copyable state until it can be saved to a computer.

The [schema](https://starter.devthomas.site/schemas/starter-progress.schema.json) defines the format. The [safe example](https://starter.devthomas.site/artifacts/progress/starter-progress.example.json) shows a phone session in progress. Use actual timestamps when saving, and keep `starter_pack_version` associated with the resources you used.

## Step statuses

- `not_started`: no work has begun.
- `in_progress`: work began and still needs action.
- `completed`: the stated completion condition was met; notes identify learner reports or agent checks accurately.
- `skipped`: the learner declined an optional action.
- `deferred`: work is saved for later, with a resume point.
- `not_applicable`: a conditional branch does not apply, with the reason recorded.

Required steps marked deferred, skipped, or not applicable do not count as complete. Overall phase status is `not_started`, `in_progress`, or `completed`. Phase 3 remains a curriculum preview.

Phase 1 deployment is extra credit. If offered, record it as `phase-1-deployment-extra-credit`: `skipped` when declined, `deferred` when accepted but postponed, or `completed` only after the live app's main action is verified. Keep the route, destination, visibility decision, and live link in nonsecret notes. Skipped or deferred extra credit does not prevent Phase 1 completion and does not satisfy the Phase 2 project milestone.

## What to record

Keep nonsecret choices, completed actions, project links, blockers, and the next action. Never store passwords, API keys, access tokens, recovery codes, cookies, connection strings, private keys, or environment-file contents. Store credentials in a password manager or the provider's supported secret store. A private repository still needs this boundary.

On a failed step, keep prior progress and record the safe resume point. On a new session, load the existing file instead of resetting it. With no filesystem access, provide the learner the updated JSON to copy or download. Before each commit, inspect the actual diff; ignore rules are only a first filter.


## Empty progress template (only when no saved progress exists)

{
  "schema_version": 1,
  "starter_pack_version": "0.1.0",
  "updated_at": "2026-09-08T00:00:00Z",
  "environment": {
    "device": "phone",
    "os": null,
    "harness": "unknown_until_detected",
    "remote_access_ready": false
  },
  "phase": {
    "current": "phase-1",
    "status": "not_started"
  },
  "steps": {},
  "choices": {},
  "artifacts": {}
}


## Progress schema

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://starter.devthomas.site/schemas/starter-progress.schema.json",
  "title": "Starter Pack Progress",
  "type": "object",
  "required": [
    "schema_version",
    "starter_pack_version",
    "phase",
    "steps",
    "updated_at"
  ],
  "properties": {
    "schema_version": {
      "type": "integer",
      "minimum": 1
    },
    "starter_pack_version": {
      "type": "string"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    },
    "environment": {
      "type": "object",
      "properties": {
        "device": {
          "type": "string"
        },
        "os": {
          "type": [
            "string",
            "null"
          ]
        },
        "harness": {
          "type": [
            "string",
            "null"
          ]
        },
        "remote_access_ready": {
          "type": "boolean"
        }
      },
      "additionalProperties": true
    },
    "phase": {
      "type": "object",
      "required": [
        "current",
        "status"
      ],
      "properties": {
        "current": {
          "enum": [
            "phase-1",
            "phase-2",
            "phase-3"
          ]
        },
        "status": {
          "enum": [
            "not_started",
            "in_progress",
            "completed"
          ]
        }
      }
    },
    "steps": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": [
          "status"
        ],
        "properties": {
          "phase": {
            "enum": ["phase-1", "phase-2", "phase-3"]
          },
          "next_action": { "type": "string" },
          "blocker": { "type": "string" },
          "status": {
            "enum": [
              "not_started",
              "in_progress",
              "completed",
              "skipped",
              "deferred",
              "not_applicable"
            ]
          },
          "updated_at": {
            "type": "string",
            "format": "date-time"
          },
          "notes": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "choices": {
      "type": "object",
      "properties": {
        "development_email": {
          "type": "object",
          "properties": {
            "account_email": { "type": ["string", "null"], "format": "email" },
            "notification_email": { "type": ["string", "null"], "format": "email" },
            "access_email": { "type": ["string", "null"], "format": "email" },
            "service_overrides": {
              "type": "object",
              "additionalProperties": { "type": "string", "format": "email" }
            },
            "notes": { "type": "array", "items": { "type": "string" } }
          },
          "additionalProperties": true
        },
        "workbench": {
          "type": "object",
          "properties": {
            "learner_name": { "type": "string" },
            "next_step_id": { "type": ["string", "null"] }
          },
          "additionalProperties": true
        }
      },
      "additionalProperties": true
    },
    "artifacts": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "additionalProperties": false
}


End of instruction packet. Begin or resume from the learner's actual progress, one action at a time.