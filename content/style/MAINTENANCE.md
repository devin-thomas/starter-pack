# Maintaining the published style guides

TypeScript has a stable 1.0.0 core and Godot a stable 1.0.1 core. Their accepted rules are published in `typescript.md` and `godot.md`; metadata drives the human pages, Markdown, JSON, catalog, and discovery entries. Planning is not stored in public content.

Run `npm run format:style` when changing TypeScript code fences, then `npm run check`. The TypeScript checker compiles its examples with the accepted strict flags, checks explicit declaration contracts, tests rejected type operations, and runs executable behavior tests. The Godot release is hard-pinned to Godot 4.7.2; Starter Pack CI verifies its public 25-rule surface and metadata but does not claim to execute Godot without a pinned Godot binary. Project-level Godot enforcement belongs in the target Godot repository as described by G024. The Godot 1.0.1 examples and the G024 script gate were checked by hand against the official Godot 4.7.2 macOS build on 2026-09-25; repeat that check with a real 4.7.2 binary when changing GDScript examples.

`npm run verify:style` checks the built TypeScript and Godot resources. `Style guide audit` checks browser reading, clipboard success and denial, mobile overflow, fragment navigation, and hidden internal decision IDs for both guides. On main, the live gate requires both TypeScript and Godot Markdown/JSON/catalog/discovery surfaces to match the canonical deployment. It runs with read-only repository permissions. Its main-branch run waits for the existing deployment path and verifies canonical live resources where the workflow supports them; it does not mutate source.

The checker uses the repository's native TypeScript 7 executable for independent type checks. Its syntax-inspection pass uses the pinned `@typescript/typescript6` compatibility API because TypeScript 7.0 does not expose the classic compiler API. This split is deliberate; do not replace the actual compiler check with a parser-only check. The installed lockfile records the precise dependencies.

This is guide-example enforcement, not a claim that every legacy source file in Starter Pack has already migrated to this house style. Architectural rules still require review. The general D025 enforcement contract is tool-agnostic; this repository pins one concrete implementation for the examples.

Example markers are HTML comments and do not appear in the human reading surface. The three D023 module files form one small multi-file example; other blocks are checked independently. Do not convert illustrative route strings into real site paths to satisfy a link checker. Link checks must distinguish actual metadata/Markdown links from source-code examples.

Existing hosting-toolchain dependency debt discovered during the audit is tracked separately in issue #3. A passing guide release is not a blanket security certification of the hosting application.
