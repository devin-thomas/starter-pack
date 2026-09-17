---
skill_id: pwa-development
updated: 2026-09-17
---

# PWA Development

Design, implement, audit, debug, validate, or release progressive web apps with platform-aware guidance for installation, manifests, service workers, offline behavior, and updates.

## Use this when

You are building or maintaining a web app where installation, offline behavior, service workers, update recovery, manifests, or cross-platform installed behavior matters. PWA Development provides structured guidance for the full PWA lifecycle — from initial manifest to production release.

Not the right fit for ordinary web UI work with no PWA lifecycle impact. If your changes don't touch manifests, service workers, caching, offline storage, or install behavior, you don't need this skill.

## How it works

PWA Development follows a lifecycle-driven approach:

1. **Start with scope** — Inspects the existing app before changing anything. Locates the manifest, service-worker registration, cache rules, storage schema, API/auth boundary, install UI, icon assets, build output, and deployment configuration. Determines the mode: build, repair, audit, debug, validate, or release.

2. **Establish the target contract** — Defines target platforms, browser/OS generations, and the required behavior for both browser-tab and installed surfaces. Uses the project's declared browser/OS matrix when available; otherwise proposes current stable and immediate prior shipping generation, labeling untested targets explicitly.

3. **Load relevant guidance** — References focused documentation on manifest identity and icons, worker lifecycle and updates, offline data and storage, platform-specific installation surfaces (iOS, Android, Windows, macOS, Linux), compatibility evidence, release validation, and store packaging. Loads only what the current task requires.

4. **Work the lifecycle** — Reproduces the relevant failure or baseline, makes manifest/worker/cache/storage decisions explicit before editing, implements within existing repository patterns, runs focused PWA checks plus negative paths (offline, denied permission, failed precache, stale tab, quota failure), and verifies deployed bytes and headers separately from local output.

5. **Report with evidence labels** — Distinguishes verified facts, implementation guidance, inferences, and unknowns. Reports scope, files changed, validation commands and results, observed evidence for each claimed surface, deployment identifiers, known platform limits, and rollback procedures.

## Inputs

- **A web app** — existing or new, with or without current PWA features
- **Target platforms** — which devices and browsers the PWA should support
- **Required behavior** — what should work offline, how updates should behave, whether store packaging is needed

## Outputs

- A working PWA with explicit manifest, service worker, caching, and offline behavior
- Platform-specific installation and update testing evidence
- Validation commands and results for each claimed capability
- Honest evidence labeling: tested surfaces are reported as verified, untested surfaces are labeled as such

## Prerequisites

None for auditing or debugging existing apps. For new builds, a web app foundation to add PWA capabilities to.

## Installation and use

PWA Development is available as an agent skill. Point your agent at it for any PWA lifecycle work:

```
Read the PWA Development skill and help me add offline support to this app.
```

The skill includes optional deterministic helpers (Node.js 22+) for manifest auditing and release probing, but continues without them when unavailable.

## Example

> "Audit my React app's PWA setup and fix any installation issues on iOS."

The agent inspects the existing manifest, service worker, and icon assets. Finds that the manifest scope doesn't match the deployment path, two required icon sizes are missing, and the service worker's update handler doesn't notify the user of new versions. Fixes each issue, runs the manifest audit helper, tests installation flow evidence for iOS Safari, and reports: verified manifest, icons passing Apple touch requirements, working update notification — with the Android install surface labeled as untested since no Android device was available.
