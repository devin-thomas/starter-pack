---
skill_id: surface-sweep
updated: 2026-09-17
---

# Surface Sweep

Broad visual QA and correction for existing web apps using automated browser probes and systematic manual inspection.

## Use this when

You have a working web app and want thorough visual quality assurance — catching responsive overflow, broken interaction states, awkward proportions, missing states, and UI inconsistencies across devices and viewports. Surface Sweep goes beyond test suites to verify what users actually see.

Not the right fit for screenshot collection alone, a new visual identity, backend-only testing, or building a public showcase (use Surface Sweep Showcase when you also want a showcase).

## How it works

Surface Sweep follows a five-stage correction loop:

1. **Establish the execution contract** — Inspects the repository for instructions, working-tree state, design authority, routes, component variants, existing browser tests, and run commands. Identifies the browser harness (Playwright or Puppeteer already present, or selects one). Records the target revision, design authority, fixture mechanism, and external-action boundary.

2. **Inventory surfaces and state transitions** — Builds a finite coverage matrix from both source code and browser navigation. A surface is any route or distinct user-visible state: menus, dialogs, drawers, tabs, editors, validation screens, and recovery states all count. Assigns case IDs with expected assertions across representative viewports — desktop (1440px), tablet (768px), phone (390px), and narrow (320px) — plus both sides of actual breakpoints, short-height views, and all supported themes.

3. **Capture trustworthy evidence** — Runs automated browser captures with readiness contracts: asserts application readiness, fixture state, theme, fonts, and image decode before each capture. Records console errors, failed requests, and diagnostics. Writes artifacts under unique run/case/attempt paths with CSS viewport and raster dimensions recorded separately.

4. **Inspect and correct** — Reviews every capture at readable scale using image-capable tools. Examines hierarchy, spacing, proportions, text wrapping, icon containment, stacking, contrast, and state feedback against the existing design. Tests pointer, touch, and keyboard behavior. Records findings with case ID, severity, symptom, before image, and root cause. Fixes shared components/styles first, then checks consumers. Adds regression assertions for each fix.

5. **Recheck and hand off** — Reruns corrected cases and the final coverage matrix. Reconciles every planned case as passed, failed, blocked, or excluded with reason. Reports fixes separately from test/fixture changes so you can see actual product improvements.

## Inputs

- **A running web app** — local, preview, or production
- **The app's source code** — for route inventory, component inspection, and fixes
- **Design authority** — the existing visual language of the app (no external design file required)

## Outputs

- Corrected product surfaces with regression checks
- A coverage matrix with case dispositions (passed/failed/blocked/excluded)
- Before and after evidence for each fix
- A final report linking the matrix, captures, commands, and any unresolved limitations

## Prerequisites

None beyond a working web app with a browser available. Works with any existing test runner and framework.

## Installation and use

Surface Sweep is available as an agent skill. Point your agent at it when you want visual QA:

```
Read the Surface Sweep skill and sweep this web app for visual issues.
```

The skill works with the app's existing visual language — it preserves the design rather than imposing a new one.

## Example

> "Sweep my dashboard app for visual issues across mobile and desktop."

The agent inventories all routes and interactive states, builds a coverage matrix with 47 cases across four viewports and two themes, runs automated captures, inspects each one, finds 8 issues (a sidebar overflow at 320px, two overlapping buttons in the modal, misaligned icons in dark mode, and others), fixes the root causes in shared components, adds regression assertions, reruns the full matrix, and delivers a report with before/after evidence for each fix.
