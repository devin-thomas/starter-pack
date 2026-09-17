---
skill_id: quick-build
updated: 2026-09-17
---

# Quick Build

Take one meaningful idea through a short design interview, an approved plan, a durable build, and live deployment — all in a single session.

## Use this when

You have an idea for a small app and want to go from concept to working product without a long discovery process. Quick Build is designed for projects that can be scoped, built, and delivered in one focused session.

Not the right fit for throwaway experiments, minor fixes, or complex projects that need extended discovery. For bigger ideas, start with Grill to Build instead.

## How it works

Quick Build follows five stages in order:

1. **Choose the entry mode** — Standalone is the default. The skill inspects your repository, existing plans, and available tools to reuse answered questions and completed work.

2. **Interview once** — One compact round of questions about the idea, audience, primary behavior, inputs, visual direction, target devices, and definition of done. Accepts conversational answers and omissions; chooses reversible details directly.

3. **Write a compact plan** — Uses bundled PLAN, SPEC, DECISIONS, and TICKET templates. Writes observable acceptance checks and separates build/type checks, layout, release availability, primary behavior, and device-specific promises.

4. **Build and verify** — Implements the approved scope, runs repository-standard checks, and exercises the primary flow including empty and error states at intended viewport sizes.

5. **Deliver and leave a resume point** — Carries out authorized deployment, verifies the published result, and records the source location, live URL, verification evidence, and a next action.

## Inputs

- **An idea** — what you want to build, in plain language
- **Decisions** — answers to the interview about audience, behavior, and scope (conversational is fine)
- **Approval** — confirmation of the plan before building starts

## Outputs

- A working app with the scoped behavior implemented and verified
- Plan, spec, decisions, and ticket documents
- Deployment to the selected destination (or local run command)
- A resume point with source location, live URL, and next action

## Prerequisites

None for standalone use. When used as part of Starter Pack Phase 2, the curriculum contract and its prerequisites apply.

## Installation and use

Quick Build is available as an agent skill. Point your agent at the canonical source and ask it to scope and build a small app:

```
Read the Quick Build skill and help me build [your idea].
```

Suggested defaults for blank projects are React and TypeScript with Vite, and Cloudflare for deployment. Existing stacks and user preferences are preserved.

## Example

> "I want a recipe timer that lets me set multiple named timers that count down simultaneously."

The agent runs the interview, confirms scope (multi-timer with named labels, start/pause/reset, audible alert, responsive layout), writes the plan, builds it, and deploys to Cloudflare. You end with a live URL, verified primary behavior, and a resume record.
