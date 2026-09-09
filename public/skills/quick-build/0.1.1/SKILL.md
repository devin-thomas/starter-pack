---
name: quick-build
description: Shape a meaningful Starter Pack project with one design interview, an approved plan, a durable build, and live deployment.
version: 0.1.1
updated: 2026-09-08
---

# Quick Build

## Entry gate

Before the interview, load the learner's progress and confirm Computer Setup is complete, including the required phone interaction. Confirm the progress repository is private and the latest progress and setup state are saved on GitHub, following the [progress guide](https://starter.devthomas.site/artifacts/progress/README.md). A local file, local commit, or empty remote alone is insufficient. If a prerequisite is missing, preserve progress and return to [Computer Setup](https://starter.devthomas.site/skills/computer-setup/current/SKILL.md); do not begin Quick Build until the gate passes. Reuse verified setup evidence rather than repeating successful installs or phone tests.

## Interview

Read any supplied repository instructions and references. Ask one compact round covering the idea, audience, required user behavior, available inputs/content, exclusions, visual direction, definition of done, and existing assets or URLs. Accept conversational answers and reasonable omissions. Choose routine implementation details yourself; ask follow-up questions only for consequential unresolved product choices.

## Plan

Use the [artifact templates](https://starter.devthomas.site/artifacts/quick-build/README.md), adapting to existing repository conventions. Write a plan, specification, durable decisions, and ordered tickets with observable acceptance conditions. Keep confidential planning in a private repo or private workspace; publish only documents the learner intends to share.

Defaults: React and TypeScript; Vite for a simple browser app; a full-stack framework only when beneficial; Cloudflare hosting; Neon only for relational persistence; authentication and payments only when the product requires them. Keep dependencies project-local and scope coherent.

Summarize the planned result in plain English. Say: "I wrote the plan and broke the build into steps. You can tell me to go, or ask to inspect the plan or tickets first." Complete this stage only after the learner approves. Revise before building if they request changes.

## Deliver

Build the approved scope in a durable repository. Preserve unrelated work. Make the primary flow responsive and accessible. Validate in proportion to the product and the learner's testing instructions; record precisely what was checked and leave unperformed human checks visible.

Deploy to Cloudflare unless an alternative is selected. Confirm deployment destination and intended visibility within the learner's authorization. Keep credentials in supported secret storage. Open the live URL and verify the primary behavior, accepting a clear learner report where appropriate. A local build is not deployment evidence.

Record the project repo, live URL, verification result, and unresolved items in private progress. Phase 2 is complete only when the meaningful project works, source is durable, the live primary flow is verified, and progress is saved. If any gate fails, retain the resume point and continue within authorized scope.
