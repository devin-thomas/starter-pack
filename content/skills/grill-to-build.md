---
skill_id: grill-to-build
updated: 2026-10-07
---

# Grill to Build

Turn a rough idea into an implementation-ready build pack through focused discovery, synchronized artifacts, an explicit specification, and ordered tickets.

## Use this when

You have an idea for a product, feature, migration, or architecture change and want to resolve uncertainty before writing code. Grill to Build is designed for projects that need more discovery than Quick Build provides — when the scope, domain, or integration surface is large enough that jumping straight to implementation would waste effort.

Not the right fit for small apps that can be scoped in one conversation. Use Quick Build for those.

## How it works

Grill to Build keeps a living project brief, a focused glossary when needed, decisions, deferred ideas, a specification, and ordered tickets. It runs a structured pipeline:

1. **Extract the raw idea** — Inspects your repository and request to pull out everything already known: problem, user, platform, constraints, technology preferences, and existing decisions. Initializes only missing discovery artifacts.

2. **Grill high-impact uncertainty** — Asks approximately 3-4 short questions per round, prioritized by downstream impact. Covers product boundaries, domain semantics, data integrity, user workflow, persistence, external dependencies, and destructive behavior. Stops once remaining decisions are inexpensive and reversible. Default budget: no more than 5 rounds or 20 total questions.

3. **Close discovery** — Confirms that the important entities, lifecycle behavior, required data, platform boundaries, and edge cases are understood. Restates the agreed project.

4. **Write the specification** — Generates a SPEC.md from the accepted discovery artifacts. Makes behavior observable and testable. Does not introduce new product decisions while writing it.

5. **Decompose tickets** — Creates ordered ticket files with a stable prefix, each containing a goal, concrete scope, observable acceptance criteria, and dependencies. Prefers vertical increments over file-level chores.

6. **Build and feed back** — When implementation is requested, starts from the first ticket and routes new information deliberately: requirements update PROJECT.md and SPEC (plus GLOSSARY.md only if canonical terminology changes), architectural decisions update ADR, future ideas go to Ideas.md, and implementation details leave product artifacts alone.

### The artifacts

Matt Pocock skills v1.3 renamed `CONTEXT.md` to `GLOSSARY.md` and `CONTEXT-MAP.md` to `GLOSSARY-MAP.md`. Because Grill's old `Context.md` contained broader project understanding, migrate that content into `PROJECT.md` and place only settled domain terms in `GLOSSARY.md`. Do not blindly rename a mixed-purpose file or lose previous discovery state.

- **PROJECT.md** — Living project understanding, system model, constraints, workflow preferences, and unanswered questions
- **GLOSSARY.md** — Canonical domain terminology only; created when terms are settled, or resolved through `GLOSSARY-MAP.md`
- **ADR.md** — Append-only record of consequential decisions (accepted, rejected, proposed, superseded)
- **Ideas.md** — Valuable work deliberately deferred from current scope
- **SPEC.md** — Implementation contract, created only after discovery stabilizes
- **tickets/*.md** — Ordered work units, created only after the specification stabilizes

## Host-native presentation and editable model source

Grill to Build silently chooses the richest useful presentation actually supported by its current host: mobile-friendly interactive in-chat layouts in capable ChatGPT hosts; Claude Artifacts in supported Claude conversations; or concise Markdown/Mermaid elsewhere. It does not spend a first-round question asking which diagram tool to use. **The editable living-model source stays separate**, defaulting to Markdown/Mermaid in `PROJECT.md`. You can still explicitly select Graphviz DOT, Markdown/Mermaid, Figma/FigJam, Excalidraw, diagrams.net, or no diagram; that choice is binding.

The agent must **not** substitute an AI-generated raster image for the selected diagram format. Image generation is used only when you explicitly choose generated imagery as the diagram source or output method.

For Excalidraw specifically, the workflow creates an editable native Excalidraw scene through a supported authoring path or SDK. If you request a PNG or SVG preview, that preview is rendered or exported **from the Excalidraw scene**. “Excalidraw to PNG” therefore means native scene first, rendered preview second — not an image-model imitation of Excalidraw.

If the selected authoring path is unavailable, the agent should say so and use only the allowed fallback (normally Markdown/Mermaid unless you forbid it). It must not silently switch to image generation.

### Chat tools and harness tools are different

A diagram option can be available in one place and unavailable in another. Grill to Build should distinguish:

- **Chat-native tools** — integrations and renderers available directly to the conversational agent.
- **Harness/local tools** — CLIs and libraries available where the agent can execute code.

The agent should inspect what it actually has before recommending a format. It should weigh speed, deterministic output, editability, portability, and collaboration needs rather than defaulting to the most elaborate integration.

For system and architecture diagrams, **Graphviz DOT → SVG (+ optional PNG)** is a strong fast-path when Graphviz is available locally: DOT remains the editable, diffable source; SVG is the canonical rendered visual; PNG is convenient for previews. Mermaid, Excalidraw, diagrams.net, authored SVG, and Figma/FigJam remain valid choices when they better fit the user's preference and available tooling.

## Inputs

- **A rough idea** — the product, feature, or architecture change you want to build
- **Answers to discovery questions** — your decisions about scope, behavior, and boundaries
- **Approval** — confirmation of the specification before tickets and implementation begin

## Outputs

- A synchronized `PROJECT.md` brief, `GLOSSARY.md` when terms are settled, ADR, Ideas, SPEC, and ticket artifacts
- An implementation-ready build pack with testable acceptance criteria
- A ubiquitous vocabulary used consistently across all artifacts and code

## Prerequisites

None for standalone use. Works with any existing repository layout.

## Installation and use

Grill to Build is available as an agent skill. Point your agent at the canonical source:

```
Read the Grill to Build skill and help me plan [your idea].
```

You can request just discovery, the full build pack, or discovery through implementation. The skill runs only the requested stages.

## Example

> "I want to build a recipe management app that imports recipes from URLs, organizes them into collections, and generates shopping lists."

The agent extracts known facts from the request, then grills through rounds: What is a recipe's lifecycle? Can recipes belong to multiple collections? How are ingredient quantities normalized? What happens when a URL cannot be parsed? After five rounds, the remaining open questions are reversible details. It writes the specification, decomposes ordered tickets (schema and models first, then import, collections, shopping list generation, and error handling), and the build pack is ready for implementation.
