---
skill_id: surface-sweep-showcase
updated: 2026-09-17
---

# Surface Sweep Showcase

Visual QA plus a screenshot-led product showcase combining Surface Sweep quality checks with deliverable captures for a case-study page, product tour, or portfolio piece.

## Use this when

You want both polished product surfaces and a working showcase page built from actual app screenshots. Surface Sweep Showcase runs the full QA correction loop first, then curates reviewed captures into a real page at an intended destination within your app.

Not the right fit for QA alone (use Surface Sweep), a generic landing page, or invented product mockups. If you want the showcase later but need QA now, Surface Sweep preserves the evidence for future reuse.

## How it works

Surface Sweep Showcase extends Surface Sweep with two additional stages:

1. **Complete the Surface Sweep** — Runs the full five-stage Surface Sweep workflow: contract, inventory, capture, inspect/correct, recheck. All product surfaces must pass behavior, geometry, readiness, and visual review before showcase construction begins. No polished page gets built around known-broken captures.

2. **Curate a coherent product story** — Selects a small complementary set of captures: overview, primary workflow, meaningful interaction/detail, and mobile use. Uses only reviewed final states with full provenance from published asset back to source case, revision, viewport, and transformation. Does not fabricate UI or retouch away defects.

3. **Build at the intended destination** — Constructs the showcase page within the app's existing router and build system. When no destination is specified, uses `/showcase`. Lets actual screenshots dominate with brief accurate captions and a clear product introduction. Matches the page to the product's visual identity rather than imposing a foreign design.

4. **Sweep the showcase itself** — Adds the new page to the coverage matrix. Tests desktop, phone, intermediate widths, direct URL load, hard refresh, section links, keyboard focus, image loading, and any gallery interaction. Verifies that shared styles have not regressed the main app.

## Inputs

- **A running web app** — the product to sweep and showcase
- **The app's source code** — for QA fixes and showcase page construction
- **Optionally, a destination** — where the showcase page should live (defaults to `/showcase`)

## Outputs

- All Surface Sweep deliverables: corrected surfaces, coverage matrix, regression checks, evidence
- A working showcase page at the intended destination using real reviewed screenshots
- Optimized image assets with full provenance to source cases
- Verified responsive behavior and navigation for both the showcase and main app

## Prerequisites

Surface Sweep is a required dependency — this skill runs it as its first stage.

## Installation and use

Surface Sweep Showcase is available as an agent skill. Point your agent at it when you want QA plus a showcase:

```
Read the Surface Sweep Showcase skill and create a showcase for this app.
```

If you only want QA now with a showcase later, say "ready for a later showcase" after the sweep — the skill preserves capture provenance for future reuse.

## Example

> "Sweep my recipe app for visual issues and build a showcase page at /showcase."

The agent runs the full Surface Sweep (inventories routes, captures across viewports, fixes 5 issues, reruns the matrix). Then it selects 6 captures — hero overview, recipe search, ingredient editing, cooking timer, mobile recipe view, and dark mode — builds a responsive showcase page at `/showcase` using the app's existing design system, sweeps the showcase itself, and delivers both the corrected app and a working product page with real screenshots.
