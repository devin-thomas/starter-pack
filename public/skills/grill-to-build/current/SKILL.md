---
name: grill-to-build
description: Plan, build and deploy a meaningful Starter Pack Phase 2 project with full Grill to Build discovery, explained for beginners, an approved specification and tickets, a durable build, and live verification.
version: 0.2.2
updated: 2026-11-08
---

# Grill to Build for Phase 2

Full Grill to Build is the standard way to plan the Phase 2 project. It turns the learner's idea into shared language, explicit decisions, testable behavior and ordered work before any code is written, then builds, deploys and verifies it. The learner decides what the product does; you explain the technical ideas.

## Entry gate

Before the first question round, load existing progress and the [canonical requirements](https://starter.uppercut-labs.com/agent/requirements.json), or the matching generated definitions already supplied. This skill uses resource version `0.2.0`, requirements revision `2026-11-09`. Resolve the prerequisites of the `quick-build` step ("Plan and build your project") from that registry, not a separately maintained checklist. Computer capability evidence includes the selected editor and actual CLI execution contexts; the remote baseline distinguishes networking on both devices, each file-transfer direction, and one real phone-to-harness action. One successful route does not certify another. Confirm the latest progress and setup state reached a private GitHub repository using the [progress guide](https://starter.uppercut-labs.com/artifacts/progress/README.md); a local commit or empty remote is insufficient.

If a prerequisite is missing, preserve results and return to the focused [Computer Setup](https://starter.uppercut-labs.com/skills/computer-setup/current/SKILL.md) action. Reuse verified evidence instead of repeating successful installs, sign-ins, or phone tests. Email preferences and the Workbench are not gates. A historically completed phase retains its revision; on resume do not restart planning because of an obsolete pointer. Reconcile completion first and offer any newly introduced checks separately.

## Choose the project and the workflow

Suggest a new, meaningful project for Phase 2: something the learner would actually use and can finish. Reuse or rebuild the Phase 1 instant build only when the learner asks for that. The Phase 1 Two-Build Challenge was optional; never require it, repeat it, or treat its absence as missing work.

Use full Grill to Build unless the learner explicitly asks for Quick Build. A request counts only when the learner says they want Quick Build, a shorter single-round plan, or equivalent words in their own message. Do not offer Quick Build as a way out of longer discovery, and never switch to it silently because discovery takes effort, the learner seems tired, or answers are short. If the learner asks what Quick Build is, explain the difference plainly and let them choose. When they choose it, follow the [Quick Build skill](https://starter.uppercut-labs.com/skills/quick-build/current/SKILL.md) from its entry gate. To pause instead, save the discovery state and resume later.

Record the workflow in the `quick-build` step's `notes`, for example "Workflow: Grill to Build (default)" or "Workflow: Quick Build (learner asked on <date>)". On resume, reuse the recorded workflow. An already approved plan and go-ahead under either workflow stay valid: continue that build instead of planning again.

## Reuse Codex readiness

Reuse the [Codex readiness checkpoint](https://starter.uppercut-labs.com/setup/codex-readiness.md) during planning and before approved implementation. Recheck only facts affected by a material host, harness, workspace, permission, runtime, or authentication change. Do not repeat a decline, setup, or successful sign-in check. The optional Programmatic Harness proof is never a prerequisite for planning or building; preserve the required next action when it is declined, deferred, unavailable, or failed.

Before use, make this skill and its [planning templates](https://starter.uppercut-labs.com/artifacts/grill-to-build/README.md) available. Record their source/version in the private handoff. If using them as supplied context, say `context_only`; claim `native_discovered` only after verifying discovery in the selected harness's currently supported skill location. Do not install a full global engineering bundle or require skill theory for this build. Begin or reuse the lightweight private session report described in the progress guide.

## Explain, don't interrogate

The learner may be new to software. Ask about people, behavior, content, and what "working" means, never about frameworks, libraries, databases, or hosting internals. Choose routine technical details yourself and record consequential ones in `ADR.md` with a one-line plain reason.

When a technical idea affects a decision, explain it in one or two plain sentences before asking. For example: "Some apps keep information only on this device; others keep it online so it survives a new phone. Which does yours need?" Define a term the first time you use it. Offer concrete options with a labeled recommendation and its consequence; a recommendation is never a hidden decision.

Paid services, new accounts, new credential scope, public publication, and anything that stores other people's data need the learner's decision, explained plainly.

## Run the full pipeline

Work in the project repository. Keep the files in [the template set](https://starter.uppercut-labs.com/artifacts/grill-to-build/README.md): `PROJECT.md`, `GLOSSARY.md`, `ADR.md`, `Ideas.md`, `SPEC.md`, and `tickets/`. Reuse equivalent existing files and conventions; do not create competing specifications or decision records. Keep confidential planning in a private repository or private workspace; publish only documents the learner intends to share.

1. **Start from what is known.** Read the handoff, saved progress, any repository instructions, and the learner's idea. Write down what is already known in `PROJECT.md`. Do not ask for anything already supplied or declined.
2. **Grill what matters.** Before each round, rank unknowns by how much they change the result. Ask about three or four short, independently answerable questions per round. Prioritize who it is for, the main action, the content and whose it is, what must be remembered and for how long, what must never happen, edge cases, and what counts as done. Leave cosmetics and reversible details for later. By default stop within five rounds or twenty questions, earlier once remaining choices are cheap to change. Track rounds and question count in `PROJECT.md` so resuming does not reset them. At the limit, record the open questions and ask whether to continue discovery; do not invent answers.
3. **After every round,** rewrite `PROJECT.md` coherently (no transcript), add a `GLOSSARY.md` term only once one is settled, append consequential `ADR.md` entries, park deferred ideas in `Ideas.md`, and refresh the model when things, states or storage change. Show a diagram in chat when the host supports it and it helps; keep Markdown/Mermaid in `PROJECT.md` unless the learner chose another format. Never substitute a generated image for a chosen diagram format.
4. **Close discovery.** Restate the agreed project in plain language and confirm the files agree.
5. **Write `SPEC.md`.** Make important behavior observable and testable, including the first meaningful action, starting empty state, whose content is used and how it arrives, normal, empty and error states, and the plain-language acceptance checks. Do not introduce a new product decision here; return to discovery if one appears. For creator tools, the learner's input and primary controls come first; no unrelated demo content or autoplay. Identify promises that need real-device evidence, such as background audio or touch, and who will check them.
6. **Write ordered tickets** in `tickets/` with a stable project prefix. Each has a goal, scope, observable acceptance, and dependencies. Prefer small vertical slices that each produce something the learner can try.

Defaults for a new project: React and TypeScript; Vite for a simple browser app; a full-stack framework only when beneficial; Cloudflare hosting; Neon only for relational persistence; authentication and payments only when the product requires them. Preserve existing repository conventions, package manager, scripts, source visibility, and privacy choices. Vercel is an explicit suitable alternative, not a silent replacement for Cloudflare.

## Approve the plan

Summarize the planned result in plain English: what the learner will be able to do, what is left out, and how you will check it works. Say where the plan files are. Then say: "The plan, specification and tickets are ready. You can tell me to go, or ask to see or change any of them first." Record the approval or requested revisions in the `quick-build` step's `notes` with the date and the plan location. Implementation begins only after an explicit go-ahead. Revise before building if they ask for changes.

## Deliver

Build the tickets in order in a durable repository. Preserve unrelated work. Make the primary flow responsive and accessible. Validate each ticket's acceptance in proportion to the product and the learner's testing instructions; record precisely what was checked and leave unperformed human checks visible. Route new information deliberately: a new requirement updates `PROJECT.md` and `SPEC.md`; a new decision updates `ADR.md`; a deferred idea goes to `Ideas.md`; an implementation detail leaves the product files alone. Ask the learner before changing an approved behavior.

Before the first useful commit or private save, follow the [authentication guide](https://starter.uppercut-labs.com/setup/authentication.md). Confirm the intended Git identity and propose an approved repository-local privacy choice where needed, using the learner's actual account-specific noreply address if selected. Preserve global identity and GitHub email protection; never disable the safeguard or rewrite shared history to clear GH007. Prefer the provider's supported login/consent flow; do not make the learner assemble credential files on a phone or assume a phone's localhost can complete a computer callback.

For conditional tool failures, use [focused troubleshooting](https://starter.uppercut-labs.com/setup/tool-troubleshooting.md). Keep dependencies project-local and preserve the package manager. Review only the necessary named package's build-script permission; never approve all scripts blindly. Recheck newly selected CLIs in their intended terminal and harness contexts without adding project `.bin` folders to global PATH. Docker Desktop stays optional and last; neither Docker nor Rosetta is a Phase 2 gate.

Deploy to Cloudflare unless an alternative is selected. Confirm destination and intended visibility within the learner's authorization. Keep credentials in supported secret storage. Check that the URL resolves to the intended release and app, not a hosting login page, then verify its primary behavior, accepting a clear learner report where appropriate. A local build, HTTP 200, screenshot, or successful Vercel release is not evidence of a Cloudflare deployment or an untested device behavior.

Record the durable source destination, live URL, behavior evidence and provenance, actual device/harness context, unresolved checks, and consequential repairs in private progress. Do not copy private content into public fixtures.

## Close out or resume

After the last apparent required result, at session close, and on resume, follow the progress guide's closeout protocol. Evaluate only the current phase's canonical gate, reconcile aliases and clear obsolete next actions. `phase-2-project` is historical evidence, not an automatic pass for both `quick-build` and `live-deployment`; a URL alone does not prove the main action. Ask only for missing required evidence.

Preserve existing history and add a confirmed `artifacts.phase_history` entry with `phase`, `status`, `requirements_revision`, `recorded_at`, `evidence_summary`, and `source`. Keep repeated closure idempotent: no duplicate history, empty commit, repeated celebration, or self-referential SHA loop. `final-progress-save` requires the final reviewed closeout to reach the private remote. Verify the saved files/revision before announcing Phase 2 completion. If the final push fails, preserve all local achievements and make the pending final save explicit; do not claim durable completion or reset the build.

When all required results and the final private save are confirmed, say plainly that Phase 2 is complete, where the project and progress are saved, and offer Phase 3 or a stopping point. Do not begin Phase 3 automatically. For a tool switch, return a compact handoff with canonical progress/location, the workflow and plan location, completed outcomes, genuine blockers, selected optional branches, computer harness separately from phone companion, one next action, and exact resource/schema revisions. No secrets or promise of automatic chat transfer.

The general-purpose Grill to Build skill this contract follows is published at [devin-thomas/skills](https://github.com/devin-thomas/skills/tree/2f245b58d25cf0da5aeb61f137e8909ef7a10891/grill-to-build); its deeper references are optional.
