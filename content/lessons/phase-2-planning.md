---
id: phase-2-planning
kind: lesson
phase: phase-2
level: 0
title: "Plan your Phase 2 project"
label: Phase 2 planning
summary: The course rules your agent follows when it plans, builds and saves your Phase 2 project with Grill to Build or Quick Build.
route: /phases/2/planning
status: current
updated: 2026-11-12
---

# Plan your Phase 2 project

This page is for the agent planning a learner's Phase 2 project. Learners can read it to see what to expect. Plan with the Grill to Build skill (`https://starter.uppercut-labs.com/skills/grill-to-build/current/SKILL.md`) by default, or the Quick Build skill (`https://starter.uppercut-labs.com/skills/quick-build/current/SKILL.md`) only when the learner asks for it. Use the skill for the planning method and this page for the course rules. The canonical requirements (`https://starter.uppercut-labs.com/agent/requirements.json`) decide what counts as done; this page uses resource version `0.2.0` and requirements revision `2026-11-09`. Completing either skill alone does not complete Phase 2.

## Check the entry gate

Before the first question round, load existing progress and the canonical requirements, or the matching generated definitions already supplied. Resolve the prerequisites of the `quick-build` step ("Plan and build your project") from that registry, not a separately maintained checklist. Computer capability evidence includes the selected editor and actual CLI execution contexts; the remote baseline distinguishes networking on both devices, each file-transfer direction, and one real phone-to-harness action. One successful route does not certify another. Confirm the latest progress and setup state reached a private GitHub repository using the progress guide (`https://starter.uppercut-labs.com/artifacts/progress/README.md`); a local commit or empty remote is insufficient.

If a prerequisite is missing, preserve results and return to the focused Computer Setup (`https://starter.uppercut-labs.com/skills/computer-setup/current/SKILL.md`) action. Reuse verified evidence instead of repeating successful installs, sign-ins, or phone tests. Email preferences and the Workbench are not gates. A historically completed phase retains its revision; on resume, do not restart planning because of an obsolete pointer. Reconcile completion first and offer any newly introduced checks separately.

## Choose the project and the workflow

Suggest a new, meaningful project for Phase 2: something the learner would actually use and can finish. Reuse or rebuild the Phase 1 instant build only when the learner asks for that. The Phase 1 Two-Build Challenge was optional; never require it, repeat it, or treat its absence as missing work.

Use full Grill to Build unless the learner explicitly asks for Quick Build. A request counts only when the learner says they want Quick Build, a shorter single-round plan, or equivalent words in their own message. Do not choose Quick Build for them, offer it as a way out of longer discovery, or switch to it silently because discovery takes effort, the learner seems tired, or answers are short. If the learner asks what Quick Build is, explain the difference plainly and let them choose. When they choose it, follow the Quick Build skill from its first step. If they ask to switch back, continue with Grill to Build and reuse every answer already given. To pause instead, save the discovery state and resume later.

Record the workflow in the `quick-build` step's `notes`, for example "Workflow: Grill to Build (default)" or "Workflow: Quick Build (learner asked on <date>)". On resume, reuse the recorded workflow. An already approved plan and go-ahead under either workflow stay valid: continue that build instead of planning again, and do not repeat a completed interview.

## Prepare the skill and templates

Reuse the Codex readiness checkpoint (`https://starter.uppercut-labs.com/setup/codex-readiness.md`) during planning and before approved implementation. Recheck only facts affected by a material host, harness, workspace, permission, runtime, or authentication change. Do not repeat a decline, setup, or successful sign-in check.

Before use, make the selected skill and its planning templates available: the Grill to Build templates (`https://starter.uppercut-labs.com/artifacts/grill-to-build/README.md`) or the Quick Build templates (`https://starter.uppercut-labs.com/artifacts/quick-build/README.md`). Record their source and version in the private handoff. If using them as supplied context, say `context_only`; claim `native_discovered` only after verifying discovery in the selected harness's currently supported skill location. Do not install a full global engineering bundle or require skill theory for this build. Begin or reuse the lightweight private session report described in the progress guide.

## Explain instead of quizzing

The learner may be new to software. The learner decides what the product does; you explain the technical ideas. Ask about people, behavior, content, and what "working" means, never about frameworks, libraries, databases, or hosting internals. Choose routine technical details yourself and record consequential ones in the decision record with a one-line plain reason.

When a technical idea affects a decision, explain it in one or two plain sentences before asking. For example: "Some apps keep information only on this device; others keep it online so it survives a new phone. Which does yours need?" Define a term the first time you use it. Offer concrete options with a labeled recommendation and its consequence; a recommendation is never a hidden decision.

Paid services, new accounts, new credential scope, public publication, and anything that stores other people's data need the learner's decision, explained plainly.

With Quick Build, ask one compact round covering the idea, audience, required user behavior, available inputs and content, exclusions, visual direction, definition of done, and existing assets or URLs. Accept conversational answers and reasonable omissions. Ask follow-up questions only for consequential unresolved product choices, not a second stack questionnaire.

## Shape the plan

Keep confidential planning in a private repository or private workspace; publish only documents the learner intends to share. Reuse equivalent existing files and conventions; do not create competing specifications or decision records.

Defaults for a new project: React and TypeScript; Vite for a simple browser app; a full-stack framework only when beneficial; Cloudflare hosting; Neon only for relational persistence; authentication and payments only when the product requires them. Preserve existing repository conventions, package manager, scripts, source visibility, and privacy choices. Vercel is an explicit suitable alternative, not a silent replacement for Cloudflare.

The specification covers the first meaningful action, the starting empty state, whose content is used and how it arrives, and plain-language acceptance checks. For creator tools, the learner's input and primary controls come first: no unrelated demo content or autoplay, and a demo is an explicit choice. Keep the main controls reachable and readable on the actual target phones and computers without disabling zoom. Identify promises that need real-device evidence, such as background audio or touch, and who will check them; screenshots or desktop emulation cannot prove those.

## Get approval before building

Summarize the planned result in plain English: what the learner will be able to do, what is left out, and how you will check it works. Say where the plan files are. With Grill to Build, then say: "The plan, specification and tickets are ready. You can tell me to go, or ask to see or change any of them first." With Quick Build, say: "I wrote the plan and broke the build into steps. You can tell me to go, or ask to inspect the plan or tickets first."

Record the approval or requested revisions in the `quick-build` step's `notes` with the date and the plan location. Implementation begins only after an explicit go-ahead. Revise before building if the learner asks for changes, and ask the learner before changing an approved behavior.

## Build, save and deploy

Build in a durable repository. Preserve unrelated work. Make the primary flow responsive and accessible. Validate in proportion to the product and the learner's testing instructions; record precisely what was checked and leave unperformed human checks visible.

Before the first useful commit or private save, follow the authentication guide (`https://starter.uppercut-labs.com/setup/authentication.md`). Confirm the intended Git identity and propose an approved repository-local privacy choice where needed, using the learner's actual account-specific noreply address if selected. Preserve global identity and GitHub email protection; never disable the safeguard or rewrite shared history to clear GH007. Prefer the provider's supported login or consent flow; do not make the learner assemble credential files on a phone or assume a phone's localhost can complete a computer callback.

For conditional tool failures, use focused troubleshooting (`https://starter.uppercut-labs.com/setup/tool-troubleshooting.md`). Keep dependencies project-local and preserve the package manager. Review only the necessary named package's build-script permission using the installed package-manager version; never approve all scripts blindly. Fix module settings for the runtime that failed, not universal NodeNext across a bundler project. Recheck newly selected CLIs in their intended terminal and harness contexts without adding project `.bin` folders to global PATH. Docker Desktop stays optional and last, with current suitability checked if selected; Rosetta only for an identified need and with approval. Neither is a Phase 2 gate.

Deploy to Cloudflare unless an alternative is selected. Confirm the destination and intended visibility within the learner's authorization. Keep credentials in supported secret storage. Check that the URL resolves to the intended release and app, not a hosting login page, then verify its primary behavior, accepting a clear learner report labeled with device and action where appropriate. A local build, HTTP 200, screenshot, or successful Vercel release is not evidence of a Cloudflare deployment or an untested device behavior.

Record the durable source destination, live URL, behavior evidence and provenance, actual device and harness context, unresolved checks, and consequential repairs in private progress. Do not copy private content into public fixtures.

## Close out or resume

After the last apparent required result, at session close, and on resume, follow the progress guide's closeout protocol. Evaluate only the current phase's canonical gate, reconcile aliases, and clear obsolete next actions. `phase-2-project` is historical evidence, not an automatic pass for both `quick-build` and `live-deployment`; a URL alone does not prove the main action. Ask only for missing required evidence, not repeated optional preferences or successful tests.

Preserve existing history and add a confirmed `artifacts.phase_history` entry with `phase`, `status`, `requirements_revision`, `recorded_at`, `evidence_summary`, and `source`. Keep repeated closure idempotent: no duplicate history, empty commit, repeated celebration, or self-referential SHA loop. The `private-progress-repository` record proves the initial durable checkpoint; `final-progress-save` requires the final reviewed closeout to reach that private remote. Verify the saved files and revision before announcing Phase 2 completion. If the final push fails, preserve all local achievements and make the pending final save explicit; do not claim durable completion or reset the build.

When all required results and the final private save are confirmed, say plainly that Phase 2 is complete, where the project and progress are saved, and offer Phase 3 or a stopping point. Do not begin Phase 3 automatically. Keep Phase 3 optional and keep old completion revisions intact.

For a tool switch, return a compact handoff with canonical progress and its location, the workflow and plan location, completed outcomes, genuine blockers, selected optional branches, the computer harness separately from the phone companion, one next action, and exact resource and schema revisions. Include no secrets and no promise of automatic chat transfer.
