---
id: javascript
title: JavaScript
summary: A checked-JavaScript house style using JSDoc and static analysis to preserve explicit contracts without TypeScript source syntax.
human_summary: JavaScript remains executable source while JSDoc and static checking make contracts visible; this guide defines when that tradeoff is appropriate and how to keep it safe.
status: in-progress
updated: "2026-09-27"
accepted_through: draft
version: 0.9.0-review.1
route: /style/JavaScript
---

# JavaScript Style Guide

> **In progress.** Remaining choices: JS-Q01, JS-Q02.

For agents: this is a published review draft, not a stable house standard. Apply accepted stable guides first. Within this guide, owner-choice sections explicitly marked pending remain unresolved; displayed candidate text is not approval. Do not migrate an existing repository merely because this draft is public.

## Scope

This is a checked-JavaScript companion to TypeScript 1.0.0. It covers JavaScript source that remains JavaScript at runtime while using TypeScript-supported JSDoc contracts and a separate static-check step. The remaining scope decision determines whether new checked JavaScript is a general option or primarily for scripts/configuration/interoperability.

It is not an unchecked-JavaScript substitute with equivalent guarantees. It does not mandate transpilation, change a runtime, or convert existing applications automatically. Node, browser, bundler, CommonJS, and ESM boundaries retain their real repository configuration. A static check can exist without an emit/build transformation.

## JS001 — Choose where new checked JavaScript belongs

*Owner choice — pending unless explicitly recorded below.*

**Pending JS-Q01.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:JS-Q01:START -->

Allow checked JavaScript for first-party application code, scripts, tools, and interoperability where keeping executable JavaScript source is a deliberate project benefit. Require supported JSDoc contracts and a real static-check gate for the included owned source. Choosing JavaScript does not authorize dropping explicit contracts or replacing an existing TypeScript application.

A project that already uses TypeScript stays TypeScript unless a separate task changes its source strategy. Do not use this permission to create mixed unchecked islands. Runtime and packaging choices remain explicit; a check-only TypeScript toolchain does not require emitted JavaScript.

<!-- DECISION:JS-Q01:END -->

**Basis:** [TS:D001-D003](https://starter.devthomas.site/style/TypeScript) · [J:CHECKING](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)

## JS002 — Use TypeScript-supported JSDoc as a real contract

*Prepared native translation — not a separate historical owner vote.*

Annotate ordinary owned functions with parameter and return contracts and assignments with precise @type contracts where meaningful. Use named @typedef declarations for records and alternatives. A comment that merely says what a function probably does is not a type declaration.

```js
/**
 * @param {number} seconds
 * @returns {number}
 */
export function milliseconds(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error("Expected finite nonnegative seconds");
  }
  return seconds * 1_000;
}
```

Follow the supported JSDoc dialect of the pinned checker, not syntax from an unrelated documentation generator. Do not add TypeScript-only parameter annotations or interface declarations directly to a .js file.

**Basis:** [TS:D001](https://starter.devthomas.site/style/TypeScript) · [TS:D015](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## JS003 — Keep source-visible contracts even without annotation syntax

*Inherited principle — target-language wording remains a draft.*

Use @type on local assignments, complete @param/@returns declarations on named behavior, and a precise callable type or immediately associated function JSDoc for callbacks. Preserve narrow domains instead of widening them to Object, Function, or any to reduce comment length.

Use a named, typed callback when an inline comment would become unreadable. Do not extract every tiny expression into a class or claim that JavaScript has TypeScript's inline annotation positions. Native loop targets and other syntax without a useful supported annotation position can inherit a precise typed source contract.

**Basis:** [TS:D001](https://starter.devthomas.site/style/TypeScript) · [TS:D015](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## JS004 — Shared contract placement is an explicit authoring choice

*Owner choice — pending unless explicitly recorded below.*

**Pending JS-Q02.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:JS-Q02:START -->

Keep ordinary shared contracts in JSDoc near the JavaScript module that owns their meaning. A small type-only JavaScript module can contain named typedefs and `export {}` to establish module scope. Refer to those contracts through JSDoc import types without introducing a runtime dependency just to import a type.

```js
// contracts.mjs
/** @typedef {Readonly<{ id: string, title: string }>} Item */
export {};

// labels.mjs
/** @typedef {import("./contracts.mjs").Item} Item */
/** @param {Item} item @returns {string} */
export function itemLabel(item) { return item.title; }
```

Do not create a runtime constructor or a fake exported value solely to make a typedef importable. Dedicated declaration files remain valid for genuine package/interop needs, not a compulsory second language layer for every internal shape.

<!-- DECISION:JS-Q02:END -->

**Basis:** [TS:D023](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) · [J:MODULES](https://www.typescriptlang.org/docs/handbook/modules/reference.html)

## JS005 — Preserve the stronger const/let convention

*Inherited principle — target-language wording remains a draft.*

Retain TypeScript D002 for ordinary JavaScript: use const when the exposed value graph is intended immutable, and let for intentional underlying local mutation, even if the binding is never reassigned. Stable properties may still be readonly in their contract while owning a mutable resource.

Kotlin's native val approval is not a blanket JavaScript change. A React-specific handle exception, if approved separately, applies only in that named framework profile. JSDoc read-only types, const declarations, and Object.freeze have different static/runtime effects; none should be described as a universal deep-immutability guarantee.

**Basis:** [TS:D002](https://starter.devthomas.site/style/TypeScript) · [KT:K002](https://starter.devthomas.site/style/Kotlin)

## JS006 — Name data shapes and their variants

*Inherited principle — target-language wording remains a draft.*

Use named typedefs for ordinary data, state, configuration, results, and callback signatures. Compose named variants into a union and use kind for owned discriminators. Preserve external fields at the boundary before validation and normalization.

```js
/** @typedef {Readonly<{ kind: "saved", recordId: string }>} Saved */
/** @typedef {Readonly<{ kind: "rejected", reason: string }>} Rejected */
/** @typedef {Saved | Rejected} SaveResult */
```

A read-only wrapper here is shallow and does not freeze runtime objects. TypeScript's type/interface syntax distinction does not exist as JavaScript declaration keywords: express the semantic data-versus-behavior distinction without inventing invalid source syntax.

**Basis:** [TS:D005-D008](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## JS007 — Complete consumers retain assertNever

*Inherited principle — target-language wording remains a draft.*

Declare a shared assertNever with a never parameter and never return in supported JSDoc. Complete owned-union consumers finish through that helper after covering every variant. Do not replace a missing case with a default success value.

```js
/** @param {never} value @returns {never} */
export function assertNever(value) {
  throw new Error("Unexpected union variant");
}
```

Add a negative static fixture proving that an unhandled variant is rejected by the pinned checker. Runtime execution alone does not prove compile-time coverage. Do not stringify an arbitrary rejected value into the error merely because it is available.

**Basis:** [TS:D007](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## JS008 — Use literal domains without fake runtime enums

*Inherited principle — target-language wording remains a draft.*

Use literal-union typedefs for finite scalar domains whose literal values are themselves meaningful. Add a runtime catalog when a real menu, validator, or mapping needs one; do not invent one merely to create namespaced string tokens.

A typed array checks individual elements, not complete/exactly-once coverage of the domain. Add a coverage test when completeness matters. Do not use documentation-only scalar wrappers or arbitrary brands to imply validation of unrestricted primitive values.

**Basis:** [TS:D009-D010](https://starter.devthomas.site/style/TypeScript)

## JS009 — Keep null and undefined meanings deliberate

*Inherited principle — target-language wording remains a draft.*

Use optional properties for omission, undefined for ordinary language/API lookup uncertainty, and null for intentional empty/cleared values when no richer alternative helps. Preserve actual platform API behavior rather than normalizing by annotation alone.

Use a visible runtime check before a required operation. Optional chaining is correct only when skipping the operation is meaningful. Do not replace TypeScript's non-null assertion with an equivalent JSDoc cast that simply tells the checker to ignore absence.

**Basis:** [TS:D004](https://starter.devthomas.site/style/TypeScript) · [TS:D017](https://starter.devthomas.site/style/TypeScript) · [J:CHECKING](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)

## JS010 — Raw runtime input begins as unknown

*Inherited principle — target-language wording remains a draft.*

Contain untyped input immediately as unknown, then inspect it. A JSDoc @type assertion around JSON.parse is not validation. Keep decoder output, schema validation, business constraints, and authorization distinct.

```js
/** @param {unknown} value @returns {string} */
export function parseTitle(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Expected a nonblank title");
  }
  return value.trim();
}
```

Use a concrete raw representation when the boundary already has one. Do not re-parse a trusted owned value in every internal function or turn a provider's any return into a second first-party any contract.

**Basis:** [TS:D011-D013](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## JS011 — Assertions and satisfies retain their distinct meanings

*Prepared native translation — not a separate historical owner vote.*

Prefer a direct JSDoc type contract. Use supported @satisfies or const-assertion syntax when useful precision actually matters and the pinned checker supports it. A compatibility check does not automatically add readonly modifiers or establish a runtime invariant.

A JSDoc cast is still an assertion, not a parser. Keep exceptional proof assertions immediately after the runtime check establishing the fact. Do not use chained casts, any, or unsupported tags to bypass ordinary type errors. Examples must be checked with the selected tool rather than judged by resemblance to TypeScript.

**Basis:** [TS:D013](https://starter.devthomas.site/style/TypeScript) · [TS:D016](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## JS012 — Use named declarations for named behavior

*Inherited principle — target-language wording remains a draft.*

Use function declarations for reusable named operations and arrows for supplied behavior or deliberately first-class values. Keep parameter and return contracts attached to the behavior. Concise expression bodies are appropriate when they express one clear operation.

Do not replace a normal function with an arrow without reviewing this binding, or vice versa. Preserve callback return expectations such as boolean predicates instead of relying on accidental truthiness. A broad Function annotation is not an adequate callable contract.

**Basis:** [TS:D014-D015](https://starter.devthomas.site/style/TypeScript)

## JS013 — Behavioral capabilities do not require classes

*Inherited principle — target-language wording remains a draft.*

Describe a real substitutable capability with a named callable/object contract, using supported JSDoc or the chosen declaration-file profile. A callback-bearing props/data record remains data; a behavioral contract does not require a class implementation.

Use a class for a continuing runtime owner with resource/state/lifetime responsibilities. A noun, method grouping, or possible serialization is not enough. Keep expected result data as plain named shapes, and avoid universal Manager, Service, or Helper wrappers.

**Basis:** [TS:D005](https://starter.devthomas.site/style/TypeScript) · [TS:D020](https://starter.devthomas.site/style/TypeScript)

## JS014 — Generics express supported variation

*Inherited principle — target-language wording remains a draft.*

Use supported @template declarations only for real first-party type variation and useful relationships. Preserve the concrete implementation until another legitimate type configuration justifies abstraction. Library generic types do not need multiple local uses.

Do not claim that a generic decoder validated its input because a type parameter was supplied. Runtime validation must still establish the promised shape. Complex typing belongs in the chosen shared-contract representation only when its real consumer needs it.

**Basis:** [TS:D019](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## JS015 — Failures follow the operation contract

*Inherited principle — target-language wording remains a draft.*

Use an ordinary lookup miss where absence is expected, a named result union for meaningful expected alternatives, and throw/reject when the normal result cannot be produced. Do not use an empty array or false as a universal catch result.

Custom Error identity must serve a real caller/diagnostic purpose. Preserve safe causes and avoid leaking arbitrary input. A declared result union is not a proof that no exception can occur. Document failure semantics where they affect how a caller must compose the operation.

**Basis:** [TS:D011](https://starter.devthomas.site/style/TypeScript) · [TS:D021](https://starter.devthomas.site/style/TypeScript)

## JS016 — Async returns and callback adaptation stay explicit

*Inherited principle — target-language wording remains a draft.*

Declare Promise result contracts on ordinary async functions in JSDoc. Await or return work whose completion belongs to the operation. An event callback expected to return void still needs an explicit error owner when it initiates asynchronous work.

Do not treat a bare void expression, a discarded Promise, or a global unhandled-rejection logger as sufficient handling. A terminal catch handler must not create another unowned rejection. Async generators have their own iterator contracts rather than the ordinary Promise-return rule.

**Basis:** [TS:D022](https://starter.devthomas.site/style/TypeScript) · [J:JSDOC](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

## JS017 — Cancellation, concurrency, and retries are real policies

*Inherited principle — target-language wording remains a draft.*

Use sequential, bounded, or concurrent execution according to ordering, external effects, limits, and ownership. Promise.all rejecting does not cancel its siblings. Racing a timeout or abandoning a reference does not stop the underlying operation.

Pass cancellation through APIs that actually support it and prevent obsolete results from overwriting current state. Keep one bounded retry policy at the owner able to classify failures. Do not interpret every cancellation as a network problem or retry an intentionally cancelled action.

**Basis:** [TS:D022](https://starter.devthomas.site/style/TypeScript) · [KT:K018-K019](https://starter.devthomas.site/style/Kotlin)

## JS018 — State has one writer and explicit readers

*Inherited principle — target-language wording remains a draft.*

Keep mutable state inside its owner and expose named commands and deliberate queries/snapshots. Do not leak a mutable collection merely because returning it is shorter. Closures and setters can still conceal mutable state behind a const binding; they remain subject to the binding convention.

A typed event or subscription represents an observation, not hidden one-to-one required control flow. Important delivery needs a stated replay/loss/acknowledgment contract. Keep derived values derived and caches under a named invalidation policy.

**Basis:** [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K015-K016](https://starter.devthomas.site/style/Kotlin)

## JS019 — Own resources and listener relationships

*Inherited principle — target-language wording remains a draft.*

Pair listener, timer, worker, stream, file, or socket acquisition with the semantic lifetime that owns it. Release borrowed resources only through their owner's contract. Do not create application-global resources at import time merely to avoid supplying a dependency.

An async cleanup operation needs completion and failure ownership too. A successful process start, connection object construction, or callback registration is not evidence of successful work. Tests should distinguish setup, active use, disposal, and post-disposal rejection.

**Basis:** [GD:G007](https://starter.devthomas.site/style/Godot) · [GD:G015](https://starter.devthomas.site/style/Godot) · [KT:K021](https://starter.devthomas.site/style/Kotlin)

## JS020 — Use one clock for each timed responsibility

*Inherited principle — target-language wording remains a draft.*

Keep elapsed time, civil timestamps, schedule time, and presentation frames separate. Label primitive units, and use the runtime's appropriate monotonic or wall-clock source for the actual responsibility.

Do not count renders or polling callbacks as an independent source of playback/progress truth. A timer should be active only while its owner needs it. Test time-dependent behavior with a truthful clock seam rather than unbounded sleeps that happen to pass once.

**Basis:** [GD:G016](https://starter.devthomas.site/style/Godot) · [KT:K020](https://starter.devthomas.site/style/Kotlin)

## JS021 — Module and runtime configuration must agree

*Prepared native translation — not a separate historical owner vote.*

For new modules, prefer named ESM exports where the runtime actually supports them. Preserve .mjs/.cjs extensions, package type, and interoperability needed by a real consumer. Do not switch a package's module mode as a formatting change.

Type-only JSDoc imports do not require runtime imports. Conversely, a constructor or runtime validator needs an actual value import. NodeNext, browser bundler, and test-runner resolution are different environments; verify the configuration and actual execution command together.

**Basis:** [TS:D023](https://starter.devthomas.site/style/TypeScript) · [J:MODULES](https://www.typescriptlang.org/docs/handbook/modules/reference.html)

## JS022 — Static checking must include the files it claims to cover

*Prepared native translation — not a separate historical owner vote.*

Enable allowJs/checkJs/noEmit in an appropriate checked-source configuration and include the owned .js, .mjs, and .cjs files meant to be governed. Add the real runtime libraries and matching environment declarations. Do not claim coverage from a config that excludes the scripts being shipped.

Carry the TypeScript safety baseline where supported and meaningful. JavaScript checking has different inference behavior, including permissive cases around objects, null/undefined initialization, and parameters; explicit JSDoc closes those gaps. Verify representative failure cases instead of promising perfect equivalence to a .ts file.

**Basis:** [TS:D003](https://starter.devthomas.site/style/TypeScript) · [TS:D025](https://starter.devthomas.site/style/TypeScript) · [J:CHECKING](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)

## JS023 — Keep the type checker independent of formatting and lint

*Inherited principle — target-language wording remains a draft.*

Use one formatter, reliable correctness/house checks, and a separate static type check. Pin tool versions and avoid a permanent growing warning tier. Configure rules to preserve deliberate let bindings, explicit JSDoc, and narrow proof exceptions.

Do not label a command lint when it only runs a type checker and then claim lint coverage. Generated/vendor source is excluded deliberately. A regex can inspect known packet structure; it does not prove sound callback ownership, domain validation, or architectural cohesion.

**Basis:** [TS:D025](https://starter.devthomas.site/style/TypeScript) · [KT:K035](https://starter.devthomas.site/style/Kotlin)

## JS024 — Persist and migrate data through an intentional adapter

*Inherited principle — target-language wording remains a draft.*

Use a versioned contract for stored or exchanged data when compatibility matters. Validate imported records before replacing known-good state and handle partial failure according to the product's policy. Do not add a default value that silently converts corruption into success.

A chosen storage SDK, runtime type declaration, or JSON schema import is not blanket validation. State what the boundary actually checks and what remains business logic. Serialization changes and persistence migrations require separate scope from a style cleanup.

**Basis:** [TS:D011-D012](https://starter.devthomas.site/style/TypeScript) · [KT:K011](https://starter.devthomas.site/style/Kotlin)

## JS025 — Scripts are applications with side effects, not disposable exceptions

*Inherited principle — target-language wording remains a draft.*

A script that writes files, deploys code, mutates a database, or sends messages needs explicit inputs, destination scope, failure handling, and repeatability just as application code does. Keep dry-run/apply behavior truthful where the task calls for it.

Do not assemble shell commands from untrusted text, log credential values, or claim success before required subprocesses complete. Use argument arrays and checked status where supported. Keep stdout suitable for its intended machine consumer and send diagnostics through a deliberate channel.

**Basis:** [KT:K038](https://starter.devthomas.site/style/Kotlin) · [TS:D021-D022](https://starter.devthomas.site/style/TypeScript)

## JS026 — Organize modules around feature ownership

*Inherited principle — target-language wording remains a draft.*

Colocate a feature's contracts, operations, adapters, and tests. Use narrow public entry points and avoid broad export-star barrels that hide transitive runtime work. Share only genuinely shared code.

Use native camelCase values/functions, PascalCase named types/classes, and uppercase meaningful fixed constants. Prefer kebab-case owned source paths while preserving externally required spelling. A shared contract file should explain a semantic boundary, not become a dumping ground for every shape.

**Basis:** [TS:D023-D024](https://starter.devthomas.site/style/TypeScript) · [KT:K031](https://starter.devthomas.site/style/Kotlin)

## JS027 — Test both runtime behavior and rejected static operations

*Inherited principle — target-language wording remains a draft.*

Run pure behavior tests for transformations, parsers, errors, and snapshots, plus actual adapter tests where runtime semantics matter. Include negative checker fixtures for incomplete union consumers, invalid arguments, readonly writes, and unintended nullish operations.

Do not count syntax-only checks as type checks or a checker pass as runtime validation. Keep tests deterministic and exercise the public API. A synthetic declaration used solely to make a fixture compile is not verification against the real framework or provider API.

**Basis:** [TS:D025](https://starter.devthomas.site/style/TypeScript) · [KT:K036](https://starter.devthomas.site/style/Kotlin)

## JS028 — Agents must not turn checked JavaScript into unchecked convenience

*Inherited principle — target-language wording remains a draft.*

Read the actual execution command, nearest package configuration, contracts, owner, and tests before editing. Preserve chosen module modes, runtime baselines, dependency versions, and public behavior. Do not remove JSDoc because an IDE can infer the same type or insert casts to silence an unexplained failure.

Record justified exceptions and report the exact files and tools checked. A guide's acceptance is not authorization to migrate existing TypeScript, change a deployment pipeline, or publish a new dependency. The checked-JavaScript scope and shared-contract choice remain explicit review items until resolved.

**Basis:** [GD:G025](https://starter.devthomas.site/style/Godot) · [KT:K038](https://starter.devthomas.site/style/Kotlin)

## Review and release boundary

This guide is intentionally published as **in progress**. Displayed candidate text in unresolved owner-choice sections is a recommendation for review, not an owner decision. Publishing this review surface does not approve those choices, authorize application migrations, upgrade project toolchains, or certify an implementation. Resolve the queued decisions and obtain final guide-level approval before marking the guide stable.

No implementation repository has been migrated by publishing this draft. Repository-specific dependency versions, product requirements, storage formats, and deployment policies remain external to this reusable style contract.
