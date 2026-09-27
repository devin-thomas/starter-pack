---
id: react-typescript
title: React + TypeScript
summary: An explicit React house style extending the TypeScript contract with owned state, deliberate effects, small component APIs, and a scoped Next.js profile.
human_summary: React is a UI framework; this guide applies Devin’s TypeScript ownership and contract rules to components, hooks, effects, browser boundaries, and an optional Next.js profile.
status: in-progress
updated: "2026-09-27"
accepted_through: RX006
version: 0.9.0-review.2
route: /style/React-TypeScript
---

# React + TypeScript Style Guide

> **In progress.** RX-Q01 A accepted; final guide-level review remains.

For agents: this is a published review draft, not a stable house standard. Apply accepted stable guides first. Within this guide, owner-choice sections explicitly marked pending remain unresolved; displayed candidate text is not approval. Do not migrate an existing repository merely because this draft is public.

## Scope

This framework companion inherits TypeScript 1.0.0; it does not replace or weaken that language guide. It covers React components, hooks, state, effects, browser boundaries, and an explicitly conditional Next.js App Router profile. Plain React does not become Next.js merely by adopting the guide. Project-specific router, data client, state library, CSS system, deployment adapter, React Compiler configuration, and dependency versions remain repository decisions.

Do not translate Android service ownership into a browser service layer by default. Transfer the responsibility and lifetime principles, then use the runtime actually present. Framework conventions that genuinely differ from first-party defaults must be narrow and visible.

## RX001 — Keep the TypeScript contract intact

*Inherited principle — target-language wording remains a draft.*

First-party React source follows explicit annotations, named data types, meaningful nullish distinctions, constrained unions, reliable strictness, and narrow imports. JSX does not exempt event callbacks, derived values, or destructuring patterns from source-visible contracts. Annotate an entire destructuring pattern; annotating a renamed property is not valid destructuring type syntax.

Retain the accepted compiler safety baseline and add the repository's JSX, module, and runtime settings. Do not turn a type disagreement into `any`, a non-null assertion, or a double assertion. An inherited rule may be relaxed only by a recorded, scoped decision such as RX-Q01—not by a formatter preset.

**Basis:** [TS:D001-D025](https://starter.devthomas.site/style/TypeScript)

## RX002 — Return the render contract actually promised

*Prepared native translation — not a separate historical owner vote.*

Give named components explicit return types. Use `ReactElement` for a component that returns an element and `ReactElement | null` when intentional absence is part of its API. Use `ReactNode` for genuine arbitrary renderable content, not merely to avoid describing a narrower result. Server async components declare the corresponding `Promise<...>` result under their framework contract.

Keep `children` and named slots explicit in the props type. Do not wrap every declaration in `React.FC`, manufacture a base-component hierarchy, or replace useful inferred JSX internals with a less truthful type merely to annotate them. Import React types with `import type`.

**Basis:** [TS:D001](https://starter.devthomas.site/style/TypeScript) · [TS:D015](https://starter.devthomas.site/style/TypeScript) · [R:TYPES](https://react.dev/learn/typescript)

## RX003 — Treat props as small, named contracts

*Inherited principle — target-language wording remains a draft.*

Use a named `type` for a reusable props record and readonly fields for its owned snapshot data. A callback in the record does not make it an implementation interface. Name alternatives rather than combining mutually dependent optional fields and booleans.

A child receives the values and capabilities it needs: a title and `onRenameRequested`, not an entire application store. Readonly props do not freeze their reachable values or make an injected live service immutable; review those ownership contracts separately. Avoid passthrough bags whose real dependencies are invisible.

**Basis:** [TS:D005-D006](https://starter.devthomas.site/style/TypeScript) · [KT:K023](https://starter.devthomas.site/style/Kotlin)

## RX004 — Use named functions and exports; preserve framework entry points

*Inherited principle — target-language wording remains a draft.*

Use function declarations for named components, hooks, and ordinary operations. Use explicitly typed arrows for supplied behavior and first-class function values. Prefer named exports and keep internal helpers unexported.

An actual framework entry file may require a default export. Keep that exception at the entry point; it does not establish a default-export convention for every component. Use PascalCase component identifiers in JSX and kebab-case owned source paths unless an actual framework filename or existing repository contract requires another spelling. JSX capitalization does not itself require PascalCase filenames.

**Basis:** [TS:D014-D015](https://starter.devthomas.site/style/TypeScript) · [TS:D023-D024](https://starter.devthomas.site/style/TypeScript)

## RX005 — Use library generics without creating a house hook framework

*Inherited principle — target-language wording remains a draft.*

Write a hook type argument when it supplies meaningful domain information, such as a closed screen-state union or a nullable DOM reference. Library `useState<T>` and `useRef<T>` do not need two application uses to justify their generic signatures.

Do not introduce `useGenericFeature`, a universal async-state engine, or custom tuple aliases solely to avoid writing the actual types. A reusable first-party hook or helper must have a real supported contract. Preserve precise callback parameter and result types beside its behavior.

**Basis:** [TS:D019](https://starter.devthomas.site/style/TypeScript) · [KT:K013](https://starter.devthomas.site/style/Kotlin)

## RX006 — Separate render bindings from live hook handles

*Accepted owner decision — RX-Q01 A.*

**Accepted RX-Q01 A.** This React-specific exception is approved; the rest of the guide remains in progress pending final guide-level review.

<!-- DECISION:RX-Q01:START -->

Allow `const` for non-reassigned bindings returned by `useState`, `useReducer`, and `useRef`, including a state-and-dispatch tuple and a ref handle. Other hooks and custom service handles do not acquire a mutation exception merely because their names begin with use. This is a React-profile exception to TypeScript D002: it promises binding stability, not a frozen ref or an immutable state owner. Ordinary mutable domain objects, local builders, SDK resources, and arbitrary mutation-hiding closures still use `let`.

```tsx
import { useRef, useState } from "react";
import type { ChangeEvent, Dispatch, ReactElement, RefObject, SetStateAction } from "react";

export function SearchControl(): ReactElement {
  const [query, setQuery]: [string, Dispatch<SetStateAction<string>>] =
    useState<string>("");
  const inputRef: RefObject<HTMLInputElement | null> =
    useRef<HTMLInputElement | null>(null);
  return <input ref={inputRef} value={query}
    onChange={(event: ChangeEvent<HTMLInputElement>): void =>
      setQuery(event.currentTarget.value)} />;
}
```

Do not reassign a render snapshot or mutate it through either spelling. Updates go through its owner; ref mutation belongs in an appropriate event or lifecycle boundary. This exception does not alter the standalone JavaScript guide.

<!-- DECISION:RX-Q01:END -->

**Basis:** [TS:D002](https://starter.devthomas.site/style/TypeScript) · [KT:K002](https://starter.devthomas.site/style/Kotlin) · [R:STATE](https://react.dev/reference/react/useState) · [R:REF](https://react.dev/reference/react/useRef)

## RX007 — State is a render snapshot, not a mutable record

*Prepared native translation — not a separate historical owner vote.*

Read the state for the current render and request a next value through the setter or owner command. Never assign to the captured state variable or mutate its published arrays, objects, or nested fields. Copy the structures that actually change and avoid retaining writable aliases.

Reading a variable immediately after requesting an update is not confirmation that the next render has committed. Use the operation's real result when later work depends on completion. Immutable source types support this contract but are not a whole-application mutation proof.

**Basis:** [KT:K003](https://starter.devthomas.site/style/Kotlin) · [R:PURITY](https://react.dev/reference/rules/components-and-hooks-must-be-pure) · [R:STATE](https://react.dev/reference/react/useState)

## RX008 — Model related alternatives as named variants

*Inherited principle — target-language wording remains a draft.*

Use named variants such as `SignedOut`, `SigningIn`, `SignedIn`, and `SignInFailed`, composed into an owned union with `kind`. Do not let independent `isLoading`, `hasError`, `user`, and `message` fields admit combinations the feature cannot mean.

Complete consumers retain the shared `assertNever` rule. A query library's externally defined discriminant stays truthful at the boundary; normalize when a different owned domain is useful. Independent UI properties can still be ordinary booleans. A named state machine is not a mandate to install a state-machine library.

**Basis:** [TS:D004-D008](https://starter.devthomas.site/style/TypeScript)

## RX009 — Use reducers for coupled transitions, not ceremonial actions

*Prepared native translation — not a separate historical owner vote.*

Keep a simple independent value in local state. Move coordinated transitions into a pure reducer or named transition function when several events share invariants or the transition needs direct tests. Choose by responsibility rather than a fixed count of useState calls.

An action describes a real transition; it must not become a global string-command bus that hides ordinary calls. Reducers return next data, never perform I/O, start timers, or invoke another owner's mutations. Do not add Redux-style infrastructure merely because reducers are useful.

**Basis:** [TS:D020](https://starter.devthomas.site/style/TypeScript) · [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K016](https://starter.devthomas.site/style/Kotlin)

## RX010 — Keep derived values derived

*Inherited principle — target-language wording remains a draft.*

Compute a filtered list, selected record, count, or label from the authoritative values instead of maintaining another synchronized copy in state. A selected identifier normally remains the source; the corresponding record is looked up from the current collection.

Memoize a calculation only for an actual performance reason. Memoization is not persistence or a guarantee of semantic lifetime. A real cache needs explicit identity, invalidation, and an owner; an effect that mirrors props into state is not that policy.

**Basis:** [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K015](https://starter.devthomas.site/style/Kotlin) · [R:EFFECTS](https://react.dev/learn/you-might-not-need-an-effect)

## RX011 — Separate editable drafts from committed data

*Inherited principle — target-language wording remains a draft.*

A form may own a local editable draft while a repository, service, or server owns committed data. Name that distinction and decide when the draft is initialized, saved, discarded, or invalidated by a different entity. Passing an initial value does not imply perpetual bidirectional synchronization.

Validate at submission and preserve a failed draft for deliberate recovery. Do not silently overwrite in-progress edits when a background refresh arrives. Local UI ownership is not authority to mutate canonical records through shared object references.

**Basis:** [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K003](https://starter.devthomas.site/style/Kotlin) · [KT:K015](https://starter.devthomas.site/style/Kotlin)

## RX012 — Commands go through semantic callbacks

*Inherited principle — target-language wording remains a draft.*

Prefer `onSaveRequested`, `onSelectionChanged`, or `onDeleteRequested` over handing a child a general-purpose mutable store. A low-level controlled input can expose a typed value-change callback; it does not need a domain-event object for every keystroke.

Adapt a framework event into a domain value at the UI boundary. Use the correctly typed `currentTarget` when the handler owns that element. Do not make the domain service depend on a DOM event or accept an arbitrary React dispatcher when only one action is allowed.

**Basis:** [GD:G008](https://starter.devthomas.site/style/Godot) · [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K023](https://starter.devthomas.site/style/Kotlin)

## RX013 — A custom hook owns a coherent relationship

*Prepared native translation — not a separate historical owner vote.*

A hook combines React-dependent behavior with one understandable responsibility, such as subscribing to an owner or coordinating a form draft. A pure calculation remains an ordinary function. Moving an entire application component into `useApplication` does not improve ownership.

Call ordinary hooks in React's supported locations and preserve their order. Do not call components as ordinary functions or create nested component definitions that acquire a new identity each render. Special APIs with explicitly different rules, such as React's `use`, follow their documented version-specific constraints rather than an invented universal hook rule.

**Basis:** [GD:G007](https://starter.devthomas.site/style/Godot) · [GD:G015](https://starter.devthomas.site/style/Godot) · [KT:K021](https://starter.devthomas.site/style/Kotlin) · [R:RULES](https://react.dev/reference/rules)

## RX014 — Context distributes dependencies; it does not justify global state

*Inherited principle — target-language wording remains a draft.*

Choose the owner and lifetime before choosing Context. Place a provider at the narrowest useful composition boundary and expose a typed read/command contract. Do not hide arbitrary services behind an untyped global context to avoid passing dependencies.

Split unrelated concerns when their ownership or update patterns differ, not just to create more providers. A stable service handle is not an immutable domain snapshot. Preserve a single writer even when many descendants can reach the owner.

**Basis:** [GD:G013](https://starter.devthomas.site/style/Godot) · [KT:K017](https://starter.devthomas.site/style/Kotlin)

## RX015 — Adapt external stores with a truthful snapshot contract

*Prepared native translation — not a separate historical owner vote.*

An owner outside React needs an intentional subscription adapter. Where appropriate, use `useSyncExternalStore` with a subscription and a stable snapshot representation rather than improvised effect-and-force-render plumbing.

Do not return a newly allocated snapshot on every read when nothing changed. For server rendering, provide a compatible server snapshot when the API requires one. This is an adapter for a genuine external owner, not a reason to move every local state value into a store.

**Basis:** [KT:K015-K016](https://starter.devthomas.site/style/Kotlin) · [R:EXTERNAL](https://react.dev/reference/react/useSyncExternalStore)

## RX016 — Rendering must not perform observable work

*Prepared native translation — not a separate historical owner vote.*

Keep render calculations repeatable for their inputs. Do not start a request, connect a player, write storage, register listeners, or publish analytics from the component body. A locally constructed temporary value is different from mutating an external owner.

User commands belong in event handling; ongoing external relationships belong at effects or another lifecycle boundary. React may repeat or abandon rendering. Do not make successful domain behavior depend on a particular number of renders.

**Basis:** [KT:K022](https://starter.devthomas.site/style/Kotlin) · [R:PURITY](https://react.dev/reference/rules/components-and-hooks-must-be-pure)

## RX017 — Effects synchronize external relationships

*Prepared native translation — not a separate historical owner vote.*

Use an effect when a rendered identity must establish, update, or end a relationship with something external to React. Do not use effects to chain internal calculations or to infer that a user clicked Save from an unrelated state change.

Keep independent relationships in separate effects when their lifetimes differ. An effect that starts an operation must define how cleanup and supersession affect that operation. A server-provided data path or an existing query owner may already own the relationship; avoid duplicating it in the component.

**Basis:** [KT:K024](https://starter.devthomas.site/style/Kotlin) · [R:EFFECTS](https://react.dev/learn/you-might-not-need-an-effect)

## RX018 — Dependencies and cleanup describe actual lifetime

*Prepared native translation — not a separate historical owner vote.*

List reactive dependencies truthfully. Do not suppress a dependency warning merely to force an empty dependency list; change the ownership or callback structure when the dependency should not restart the work.

An effect callback returns synchronous cleanup or nothing, not a Promise. Start an explicitly owned async operation inside it when necessary. Cleanup ends that relationship without releasing another owner's resource. Development remount/replay checks should reveal broken setup and cleanup, not be disabled to hide them.

**Basis:** [KT:K024](https://starter.devthomas.site/style/Kotlin) · [R:EFFECT](https://react.dev/reference/react/useEffect)

## RX019 — Async results belong to an identity and failure owner

*Inherited principle — target-language wording remains a draft.*

Await work that must complete and supervise deliberately detached work. A `void` callback type does not prove an async handler's rejection is handled. Adapt framework callbacks through a safe command boundary and ensure a terminal error handler cannot create an unowned rejection.

Cancel obsolete requests when the underlying API supports it; otherwise reject stale completions by identity or generation before they mutate current state. Cancellation and supersession are not automatically an offline error. Unmounting a component does not undo a server write or guarantee detached work finishes.

**Basis:** [TS:D021-D022](https://starter.devthomas.site/style/TypeScript) · [KT:K018-K019](https://starter.devthomas.site/style/Kotlin)

## RX020 — Updaters and initializers remain pure

*Prepared native translation — not a separate historical owner vote.*

A state updater computes the next value from its argument. Do not send a request, schedule a save, start a timeout, or call another setter from that updater. Compute the transition separately and let the command/lifecycle owner perform required effects.

Likewise, an initializer should not acquire a live external resource that depends on exactly-once execution. Put that resource under a real owner. A lazy initializer is a computation hook, not a general application bootstrap mechanism.

**Basis:** [R:STATE](https://react.dev/reference/react/useState) · [KT:K022](https://starter.devthomas.site/style/Kotlin)

## RX021 — Refs hold imperative handles, not hidden rendered state

*Prepared native translation — not a separate historical owner vote.*

Use a ref for an imperative handle or a value whose mutation does not itself need to render. Render-visible state belongs in a reactive owner. A ref is nullable when its target can be absent; narrow before using it rather than asserting presence.

Access DOM handles in the appropriate event or lifecycle phase. Pair resource attachment and release. Do not write a current-value ref during arbitrary render as an excuse to avoid a correct effect or event contract; narrow documented initialization exceptions need a real reason.

**Basis:** [KT:K010](https://starter.devthomas.site/style/Kotlin) · [KT:K021](https://starter.devthomas.site/style/Kotlin) · [R:REF](https://react.dev/reference/react/useRef)

## RX022 — Identity, navigation, and clocks stay semantic

*Inherited principle — target-language wording remains a draft.*

Use stable domain identities for repeated content and meaningful component identity for deliberate reset. Do not generate random keys on every render or restore a selected item by an index that can now identify something else.

Choose a single authoritative clock for timers and progress, and label primitive units. Route keyboard, pointer, and assistive activation through the same semantic command. URL state, local draft state, and persisted data are different contracts; validate untrusted route/query values before making domain claims.

**Basis:** [GD:G016-G017](https://starter.devthomas.site/style/Godot) · [KT:K020](https://starter.devthomas.site/style/Kotlin) · [KT:K027](https://starter.devthomas.site/style/Kotlin)

## RX023 — Failures remain meaningful at the screen boundary

*Inherited principle — target-language wording remains a draft.*

Distinguish loading, empty success, unavailable content, invalid input, and rejected commands. Preserve expected alternatives in typed state and provide a usable recovery action where the product supports it. A catch-all spinner is not an error policy.

Render error boundaries do not automatically handle every event-handler or asynchronous failure. Keep those failures with their operation owner. Do not expose raw provider payloads, tokens, or user documents through an error string or diagnostic fallback.

**Basis:** [TS:D021](https://starter.devthomas.site/style/TypeScript) · [KT:K012](https://starter.devthomas.site/style/Kotlin) · [KT:K016](https://starter.devthomas.site/style/Kotlin)

## RX024 — Preserve semantic HTML and interaction contracts

*Prepared native translation — not a separate historical owner vote.*

Use actual buttons, links, labels, and form controls for their intended jobs. A visually styled div does not inherit keyboard activation, focus behavior, or accessible naming. Keep visible state and assistive descriptions consistent.

Manage focus for a real transition, not whenever data refreshes. Keep actions available without hover alone. Styling libraries and visual design systems remain project-specific; a coding-style guide does not impose one visual identity on every application.

**Basis:** [GD:G017](https://starter.devthomas.site/style/Godot) · [KT:K026-K028](https://starter.devthomas.site/style/Kotlin)

## RX025 — Persist and deserialize at explicit boundaries

*Inherited principle — target-language wording remains a draft.*

Treat local storage, IndexedDB, downloaded files, route payloads, and remote responses as runtime boundaries. Parse unknown data, validate schema/version and business constraints, then normalize into owned types. A JSON.parse result annotated as a domain record is not proof.

Name the persistence owner and its migration, conflict, and failure behavior. Do not perform durable writes in a render or assume browser-local data survives every eviction or device switch. A persistence choice does not follow automatically from using React.

**Basis:** [TS:D011-D012](https://starter.devthomas.site/style/TypeScript) · [KT:K011](https://starter.devthomas.site/style/Kotlin)

## RX026 — Performance work must preserve the contract

*Inherited principle — target-language wording remains a draft.*

Measure meaningful bottlenecks before adding broad memoization, manual caches, context fragmentation, or custom equality. Do not use memoization as a correctness mechanism or assume a compiler optimization creates an ownership guarantee.

Keep expensive work out of blocking interaction paths when measurements justify an alternative. Record the input identity and invalidation contract of a real cache. React Compiler adoption, virtualization, and specialized state representations are repository choices, not mandatory dependencies of this guide.

**Basis:** [TS:D019](https://starter.devthomas.site/style/TypeScript) · [KT:K025](https://starter.devthomas.site/style/Kotlin) · [R:EFFECTS](https://react.dev/learn/you-might-not-need-an-effect)

## RX027 — Keep Next.js rules scoped to Next.js applications

*Prepared native translation — not a separate historical owner vote.*

The following server rules apply only where the app actually uses Next.js App Router or an explicitly verified compatible runtime. Keep Server and Client Component boundaries intentional. Mark the smallest interactive client boundary rather than converting the entire application to a client bundle.

Use serializable boundary data according to the framework's real contract; do not pass arbitrary services or ordinary callbacks across that boundary. Server Functions are a distinct mechanism, not a universal permission to pass functions. A Client Component can participate in server prerendering; the directive does not make module-level browser APIs universally safe.

**Basis:** [KT:K030](https://starter.devthomas.site/style/Kotlin) · [R:NEXT](https://nextjs.org/docs/app/getting-started/server-and-client-components)

## RX028 — Authorize server operations at their real boundary

*Prepared native translation — not a separate historical owner vote.*

Validate input and enforce authentication and authorization for each exposed server operation. A hidden button, a route wrapper, or a server-only import is not resource authorization. Return the minimum safe data needed by the consumer.

Scope shared caches and request context so one user's data cannot become another user's response. Keep credentials and server dependencies outside client-reachable imports and bundles. Server Actions/Functions require the same deliberate input and permission checks as another callable endpoint.

**Basis:** [TS:D011-D012](https://starter.devthomas.site/style/TypeScript) · [R:SECURITY](https://nextjs.org/docs/app/guides/data-security)

## RX029 — Make server data freshness and invalidation explicit

*Prepared native translation — not a separate historical owner vote.*

Document which layer owns retrieval, caching, optimistic changes, invalidation, and reconciliation. Do not maintain competing server and client truths because both layers can fetch the same entity.

Use the pinned framework's actual cache/revalidation behavior instead of assuming defaults from another release. A platform adapter such as an alternate worker deployment is not evidence of feature parity; verify the features the application promises. Do not add Next.js solely to standardize a browser-only tool.

**Basis:** [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K015](https://starter.devthomas.site/style/Kotlin) · [R:NEXT](https://nextjs.org/docs/app/getting-started/server-and-client-components) · [R:SECURITY](https://nextjs.org/docs/app/guides/data-security)

## RX030 — Organize around features and deliberate entry points

*Inherited principle — target-language wording remains a draft.*

Colocate a feature's components, contracts, hooks, adapters, and relevant tests. Keep routing/composition files readable as composition rather than application-wide mutation owners. Move a helper into shared code only when it is genuinely shared.

Avoid global models/managers/utils buckets and sweeping barrel exports. Split a file when responsibilities diverge, not because every declaration deserves its own file. A framework-owned app/pages directory is a valid entry structure; ordinary domain code can still retain feature boundaries beneath it.

**Basis:** [TS:D023-D024](https://starter.devthomas.site/style/TypeScript) · [GD:G022](https://starter.devthomas.site/style/Godot) · [KT:K031](https://starter.devthomas.site/style/Kotlin)

## RX031 — Test public behavior and temporal failure cases

*Inherited principle — target-language wording remains a draft.*

Test pure transitions without rendering when they have no UI dependency. Use component tests for interaction semantics and integration/browser tests for real navigation, persistence, focus, hydration, and provider relationships.

Add regression cases for stale request completion, cleanup, identity changes, rejected saves, and recovery when the feature has those behaviors. Do not certify behavior from snapshots alone or test by routinely mutating a private store. A test double must preserve the capability and failure contract it stands in for.

**Basis:** [GD:G023](https://starter.devthomas.site/style/Godot) · [KT:K036](https://starter.devthomas.site/style/Kotlin)

## RX032 — Make enforcement and evidence specific

*Inherited principle — target-language wording remains a draft.*

Pin formatting, the actual TypeScript compiler, React-aware static checks, test tools, and relevant framework configuration. Run formatting, type checking, enabled correctness checks, and applicable tests as separate meaningful gates. Tune lint behavior to the accepted binding and explicit-annotation rules.

Do not claim that TypeScript compilation tests DOM interaction or that a formatter proves hook lifetime. The examples in this packet have only the checks recorded in VALIDATION.md; framework builds and real browser behavior need their own evidence. A migration of an existing app is separate work from accepting the guide.

**Basis:** [TS:D003](https://starter.devthomas.site/style/TypeScript) · [TS:D025](https://starter.devthomas.site/style/TypeScript) · [KT:K035-K037](https://starter.devthomas.site/style/Kotlin)

## RX033 — Agents preserve product, dependency, and deployment contracts

*Inherited principle — target-language wording remains a draft.*

Read the local instructions, feature owner, route, data contract, and tests before editing. Make the smallest coherent change at the real boundary. Do not turn a style correction into a new global store, router, server framework, database, UI library, or dependency upgrade.

Preserve public URLs, permissions, persistence schemas, environment contracts, authentication flows, and deployment adapters unless a separate task authorizes their change. Record deliberate exceptions and report what actually ran. New guide drafts are not approval to migrate or publish an application.

**Basis:** [GD:G025](https://starter.devthomas.site/style/Godot) · [KT:K038](https://starter.devthomas.site/style/Kotlin)

## Review and release boundary

This guide is intentionally published as **in progress**. RX-Q01 A is an accepted owner decision; the remaining prepared rule wording still awaits final guide-level review. Publishing this review surface does not mark the guide stable, authorize application migrations, upgrade project toolchains, or certify an implementation.

No implementation repository has been migrated by publishing this draft. Repository-specific dependency versions, product requirements, storage formats, and deployment policies remain external to this reusable style contract.
