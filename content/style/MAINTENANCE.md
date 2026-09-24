# Maintaining the published style guides

TypeScript's core guide is version 1.0.0. Its accepted rules are published in `typescript.md`; metadata drives the human page, Markdown, JSON, catalog, and discovery entries. Planning is not stored in public content.

Run `npm run format:style` when changing code fences, then `npm run check`. The required check compiles all TypeScript examples with the accepted strict flags, checks explicit declaration contracts, tests rejected type operations, runs executable behavior tests, and verifies generated resource parity. `npm run verify:style` checks built resources; `node scripts/style-guide-surfaces.mjs --live https://starter.devthomas.site` checks the deployed equivalents.

`Style guide audit` also checks browser reading, clipboard success and denial, mobile overflow, and fragment navigation. It runs with read-only repository permissions. Its main-branch run waits briefly for the existing auto-deployment and verifies canonical live resources; it does not deploy or mutate source.

The checker uses the repository's native TypeScript 7 executable for independent type checks. Its syntax-inspection pass uses the pinned `@typescript/typescript6` compatibility API because TypeScript 7.0 does not expose the classic compiler API. This split is deliberate; do not replace the actual compiler check with a parser-only check. The installed lockfile records the precise dependencies.

This is guide-example enforcement, not a claim that every legacy source file in Starter Pack has already migrated to this house style. Architectural rules still require review. The general D025 enforcement contract is tool-agnostic; this repository pins one concrete implementation for the examples.

Example markers are HTML comments and do not appear in the human reading surface. The three D023 module files form one small multi-file example; other blocks are checked independently. Do not convert illustrative route strings into real site paths to satisfy a link checker. Link checks must distinguish actual metadata/Markdown links from source-code examples.

Existing hosting-toolchain dependency debt discovered during the audit is tracked separately in issue #3. A passing guide release is not a blanket security certification of the hosting application.
