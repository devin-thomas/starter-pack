---
id: swift-swiftui
title: Swift + SwiftUI
summary: A Swift and SwiftUI house style built around value semantics, explicit ownership, actor-aware lifetimes, and deliberate state mutation.
human_summary: Swift combines value and reference semantics with native UI state tools; this guide maps Devin’s ownership rules onto Swift, Observation, SwiftUI, and structured concurrency.
status: in-progress
updated: "2026-09-27"
accepted_through: draft
version: 0.9.0-review.1
route: /style/Swift-SwiftUI
---

# Swift + SwiftUI Style Guide

> **In progress.** Remaining choices: SW-Q01, SW-Q02.

For agents: this is a published review draft, not a stable house standard. Apply accepted stable guides first. Within this guide, owner-choice sections explicitly marked pending remain unresolved; displayed candidate text is not approval. Do not migrate an existing repository merely because this draft is public.

## Scope

This draft covers Swift language contracts and SwiftUI state/lifecycle boundaries for Apple applications, with scoped iOS and macOS considerations. It does not select deployment targets, a persistence system, an authentication provider, an app architecture package, or a global actor setting. UIKit/AppKit/Objective-C interoperability remains a narrow native boundary, not forbidden code.

The guide transfers explicitness and ownership rather than TypeScript syntax. Swift value semantics, reference semantics, optionals, associated-value enums, opaque results, property wrappers, and actors must retain their actual meanings. Foundation/Observation fixtures can be checked in the available Linux Swift toolchain; that does not establish a SwiftUI or Apple-platform build.

## SW001 — Write precise source-visible types

*Inherited principle — target-language wording remains a draft.*

Annotate stored properties, local bindings, parameters, and named results wherever Swift provides an appropriate position. Include `-> Void` for named procedures. Do not attach illegal return annotations to init or deinit, erase a useful concrete type, or widen a domain to Any merely to add an annotation.

Use explicit closure parameters and results for ordinary behavior. Result-builder closures and opaque view results follow their native syntax rather than forcing an erased type. Generic call-site inference is allowed when the concrete choice is already visible and repeating it would not clarify a contract.

**Basis:** [TS:D001](https://starter.devthomas.site/style/TypeScript) · [TS:D015](https://starter.devthomas.site/style/TypeScript) · [KT:K001](https://starter.devthomas.site/style/Kotlin)

## SW002 — Choose binding semantics for mutable reference objects

*Owner choice — pending unless explicitly recorded below.*

**Pending SW-Q01.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:SW-Q01:START -->

Use `let` for bindings that are not reassigned and `var` where reassignment or mutation of the bound value type is intentional. A stable `let` reference may point to a mutable class instance. Its mutation authority must remain visible in the class API and ownership. A struct containing a reference can still share that referenced state.

```swift
final class Counter {
    private(set) var value: Int = 0
    func increment() -> Void { value += 1 }
}

func countOnce() -> Int {
    let counter: Counter = Counter()
    counter.increment()
    return counter.value
}
```

Do not describe let as deep immutability. For value snapshots, use the intended value representation and immutable fields; for runtime owners, keep mutable state private and operations semantic. This Swift decision does not alter TypeScript or JavaScript conventions.

<!-- DECISION:SW-Q01:END -->

**Basis:** [TS:D002](https://starter.devthomas.site/style/TypeScript) · [KT:K002](https://starter.devthomas.site/style/Kotlin) · [S:VALUE](https://www.swift.org/documentation/articles/value-and-reference-types.html)

## SW003 — Use structs and enums for ordinary values

*Inherited principle — target-language wording remains a draft.*

Represent ordinary records and configuration as structs and closed alternatives as enums. Keep snapshot fields immutable by default. Use class instances for continuing reference identity, private evolving state, resource lifetime, or a real framework role.

Value semantics do not guarantee that referenced children are independent. Copying a struct containing a class reference preserves that reference unless the model deliberately copies its target. Do not introduce a class just for an ID, a noun, method grouping, or potential serialization.

**Basis:** [TS:D020](https://starter.devthomas.site/style/TypeScript) · [KT:K005](https://starter.devthomas.site/style/Kotlin) · [S:VALUE](https://www.swift.org/documentation/articles/value-and-reference-types.html)

## SW004 — Closed alternatives use associated-value enums

*Prepared native translation — not a separate historical owner vote.*

Use named enum cases with associated values when states carry different payloads. Consume owned closed enums exhaustively without a default that hides a new case. Do not copy a redundant mutable kind field or an assertNever helper into an enum that already supplies case identity.

```swift
enum SaveResult {
    case saved(recordId: String)
    case rejected(reason: String)
}

func resultLabel(_ result: SaveResult) -> String {
    switch result {
    case .saved(let recordId): return "Saved: \(recordId)"
    case .rejected(let reason): return "Rejected: \(reason)"
    }
}
```

External non-frozen/resilient enums can require an unknown-case boundary. Handle that documented interoperability condition deliberately rather than asserting that an external API is permanently closed. Case-pattern bindings do not offer the same annotation syntax as a normal let declaration.

**Basis:** [TS:D006-D008](https://starter.devthomas.site/style/TypeScript) · [KT:K006-K007](https://starter.devthomas.site/style/Kotlin) · [S:ENUM](https://raw.githubusercontent.com/swiftlang/swift-book/main/TSPL.docc/LanguageGuide/Enumerations.md)

## SW005 — Use optionals for one meaningful absence

*Inherited principle — target-language wording remains a draft.*

Use `T?` for ordinary absence when a richer state provides no benefit. Use guard-let, if-let, or an intentional fallback to establish presence. Do not use force unwraps or implicitly unwrapped optionals as ordinary first-party shortcuts.

Separate absent, invalid, disconnected, and cancelled states when the behavior depends on them. Preserve optionality required by native APIs before normalization. A default value must represent a valid business fallback, not conceal an unexpectedly missing dependency.

**Basis:** [TS:D004](https://starter.devthomas.site/style/TypeScript) · [KT:K009](https://starter.devthomas.site/style/Kotlin)

## SW006 — Custom identity wrappers must carry a real constraint

*Inherited principle — target-language wording remains a draft.*

Do not introduce one-field structs or typealiases solely to make arbitrary strings look like validated identifiers. A custom scalar needs an actual legal-value constraint, validated invariant, or meaningful unit contract.

Use native types such as URL where they provide the needed representation, then validate application-specific schemes or permissions separately. Do not mistake successful URL construction, a UUID-shaped value, or Codable conformance for proof of existence, authorization, or acceptable resource scope.

**Basis:** [TS:D010](https://starter.devthomas.site/style/TypeScript) · [KT:K008](https://starter.devthomas.site/style/Kotlin)

## SW007 — Validate decoded data before granting domain authority

*Inherited principle — target-language wording remains a draft.*

Decoding can establish a wire shape; it does not establish every business invariant. Check acceptable ranges, URLs, versions, ownership, and relationships before treating a payload as an owned domain value. Preserve the external key spelling and missing/null behavior before normalization.

Keep Any and Objective-C dynamic input at a narrow adapter. Use checked casts only when a cast is actually the boundary operation, and model failure deliberately. Do not use `as!`, `try!`, or a permissive decoder to silence an ordinary contract disagreement.

**Basis:** [TS:D011-D013](https://starter.devthomas.site/style/TypeScript) · [KT:K011](https://starter.devthomas.site/style/Kotlin) · [S:CODABLE](https://developer.apple.com/documentation/swift/codable/)

## SW008 — Failure mechanisms communicate their actual jobs

*Inherited principle — target-language wording remains a draft.*

Use an optional for a normal miss, a named enum for expected alternatives the caller must inspect, and throws when the promised normal result cannot be delivered. Use Result when a failure-bearing value is genuinely stored, passed, or required by an API—not to wrap every throwing function.

Keep cancellation distinct from an ordinary domain rejection. Use `try?` only when deliberately discarding the reason is part of an optional-result contract. Prefer a meaningful error type when callers need specific identity or information. Typed throws is an available scoped contract, not a requirement to enumerate every incidental implementation failure.

**Basis:** [TS:D021](https://starter.devthomas.site/style/TypeScript) · [KT:K012](https://starter.devthomas.site/style/Kotlin) · [S:ERRORS](https://raw.githubusercontent.com/swiftlang/swift-book/main/TSPL.docc/LanguageGuide/ErrorHandling.md)

## SW009 — Assertions never replace release validation

*Inherited principle — target-language wording remains a draft.*

Use assertions only for programmer conditions appropriate to the build configuration. Validate external and user-controlled data through ordinary runtime control flow. Do not make an assertion expression perform required work.

Reserve precondition/fatal termination for a genuinely unrecoverable internal contract, not a failed network request or malformed import. Logging a failure does not complete a required recovery action. Preserve useful causes without exposing private data to logs or error screens.

**Basis:** [GD:G021](https://starter.devthomas.site/style/Godot) · [KT:K012](https://starter.devthomas.site/style/Kotlin)

## SW010 — Protocols describe supported behavioral substitution

*Inherited principle — target-language wording remains a draft.*

Use a protocol for a real substitutable capability, including a faithful test adapter. Use an explicit function type for a single supplied operation when a protocol adds no meaningful behavior. Do not generate a protocol for every concrete type or a generic repository layer for hypothetical reuse.

Choose `some`, `any`, and generic constraints according to actual API relationships and runtime heterogeneity. A protocol existential is not a cost-free replacement for a concrete value contract. Opaque framework results are a native representation, not evidence that every first-party operation needs a generic abstraction.

**Basis:** [TS:D005](https://starter.devthomas.site/style/TypeScript) · [TS:D019](https://starter.devthomas.site/style/TypeScript) · [KT:K013](https://starter.devthomas.site/style/Kotlin)

## SW011 — Named behavior is a function or meaningful method

*Inherited principle — target-language wording remains a draft.*

Use named functions for transformations and methods for operations on an actual owner. Keep small closures beside the API receiving them and write parameter/result types where ordinary closure syntax supports it.

Prefer readable argument labels that distinguish same-typed values. Do not build a fluent helper framework, add extensions to ubiquitous types that unexpectedly perform I/O, or hide dependency access behind a cheap-looking property. Property getters should be unsurprising queries; commands have names that reveal their effect.

**Basis:** [TS:D014-D015](https://starter.devthomas.site/style/TypeScript) · [KT:K014](https://starter.devthomas.site/style/Kotlin)

## SW012 — Snapshot collections do not expose parallel writers

*Inherited principle — target-language wording remains a draft.*

Expose value collections and immutable element representations when callers need snapshots. A copy-on-write collection is not a promise that class instances stored inside it are independently copied or immutable.

Keep a mutable runtime owner's collection behind its query/command API rather than returning reference-backed mutable internals. When copying is needed for isolation, state which layers are copied and why. Do not add a global deep-copy scheme or assume `let` freezes a reference graph.

**Basis:** [TS:D002](https://starter.devthomas.site/style/TypeScript) · [KT:K003](https://starter.devthomas.site/style/Kotlin) · [S:VALUE](https://www.swift.org/documentation/articles/value-and-reference-types.html)

## SW013 — Canonical state is writable through its owner

*Inherited principle — target-language wording remains a draft.*

Keep mutable domain fields private or private(set), and expose semantic operations for changes carrying validation, persistence, notifications, or other invariants. A coordinator can orchestrate those operations without owning a duplicate truth.

Observation does not grant every observer mutation authority. Define the reading and writing contracts before choosing an observation API. Keep derived labels, counts, and selections derived unless a cache has a concrete purpose and a named invalidation owner.
**Basis:** [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K015](https://starter.devthomas.site/style/Kotlin)

## SW014 — Define the precise SwiftUI binding exception

*Owner choice — pending unless explicitly recorded below.*

**Pending SW-Q02.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:SW-Q02:START -->

Allow direct Binding or @Bindable editing for presentation-local values and explicitly identified UI-only draft models. A draft is not a canonical persisted entity: its owner defines initialization, discard, validation, and commit. Keep canonical state behind semantic commands and do not hand out arbitrary bindings into a live service or persisted domain model.

```swift
import Observation
import SwiftUI

@Observable
final class TitleDraft {
    var title: String = ""
}

struct TitleEditor: View {
    @Bindable var draft: TitleDraft
    var body: some View {
        TextField("Title", text: $draft.title)
    }
}
```

This example is a draft-editing surface, not an approved domain mutation API. The composition owner provides and retains the draft; Save validates and calls the real owner. A binding must not hide network writes or transaction commits in an innocent-looking keystroke setter.

<!-- DECISION:SW-Q02:END -->

**Basis:** [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K023](https://starter.devthomas.site/style/Kotlin) · [S:OBSERVATION](https://developer.apple.com/videos/play/wwdc2023/10149/)

## SW015 — Place state at its real view, scene, or application lifetime

*Prepared native translation — not a separate historical owner vote.*

Choose ownership before choosing a property wrapper. Keep view-local presentation state near the view, scene/window state with that scene, and truly application-wide services at the application composition boundary. Do not create a global singleton to avoid passing a dependency.

A SwiftUI View value can be reconstructed repeatedly; its initializer is not a reliable once-only resource acquisition point. Use the native state/observation mechanism that matches the supported deployment target. Observation-based state and legacy ObservableObject wrappers are deliberate compatibility profiles, not interchangeable tokens to mass-replace.

**Basis:** [KT:K021-K024](https://starter.devthomas.site/style/Kotlin) · [S:STATE](https://developer.apple.com/videos/play/wwdc2023/10149/)

## SW016 — Views render data and emit semantic intent

*Inherited principle — target-language wording remains a draft.*

Keep content views focused on layout and presentation. Pass values and typed capabilities rather than a whole context or service when one action is needed. A view model earns its place by owning meaningful screen state or lifetime, not merely because a template always includes one.

Do not put network calls, persistence writes, listener registration, or player commands directly in body evaluation. A view's existence is not an event confirming a user action. Keep the domain owner independent of SwiftUI when it has no presentation role.

**Basis:** [KT:K022-K023](https://starter.devthomas.site/style/Kotlin)

## SW017 — Keep result builders and opaque types native

*Prepared native translation — not a separate historical owner vote.*

Use `var body: some View` and builder-supported branches for view composition. Keep explicit named helper returns such as `-> some View`. Do not erase a normal view to AnyView solely because its concrete compiler-generated type is inconvenient to write.

Annotate builder closure parameters where useful and supported, while letting the framework's builder contract express the composite result. Do not dismantle a builder into artificial helper types just to imitate TypeScript callback syntax. Extract a subview when it has a coherent presentation API, not only to appease line counts.

**Basis:** [KT:K004](https://starter.devthomas.site/style/Kotlin) · [KT:K023](https://starter.devthomas.site/style/Kotlin) · [S:BUILDERS](https://raw.githubusercontent.com/swiftlang/swift-book/main/TSPL.docc/ReferenceManual/Attributes.md)

## SW018 — Async view work follows identity and cancellation

*Prepared native translation — not a separate historical owner vote.*

Use the appropriate SwiftUI task/lifecycle boundary for view-owned async work and key it by the identity that should restart it. Make stale results harmless when the viewed record or account changes. Do not equate onAppear with an exactly-once application start.

Cancellation requests are cooperative; the operation must reach a cancellation-aware boundary or check cancellation. View disappearance does not undo a remote write. Long-lived work belongs to a longer-lived owner with its own stop and error policy, not an unobserved task created from a transient view.

**Basis:** [GD:G018](https://starter.devthomas.site/style/Godot) · [KT:K024](https://starter.devthomas.site/style/Kotlin) · [S:TASK](https://developer.apple.com/documentation/SwiftUI/View/task%28id%3Aname%3AexecutorPreference%3Apriority%3Afile%3Aline%3A_%3A%29)

## SW019 — Structured tasks and unstructured tasks have different contracts

*Prepared native translation — not a separate historical owner vote.*

Use async calls, async let, or task groups for related work whose completion and failure are owned by the enclosing operation. An explicit `Task { ... }` is unstructured even when it inherits actor context; it needs an owner for cancellation, lifetime, and any failure-bearing result.

Do not use Task.detached merely to imply background work. It changes context/ownership assumptions and is justified only when that independence is actually required. A task handle is not automatically a supervision policy, and async alone does not promise execution away from a UI actor.

**Basis:** [TS:D022](https://starter.devthomas.site/style/TypeScript) · [KT:K018](https://starter.devthomas.site/style/Kotlin) · [S:CONCURRENCY](https://raw.githubusercontent.com/swiftlang/swift-book/main/TSPL.docc/LanguageGuide/Concurrency.md)

## SW020 — Preserve cancellation and bound retry behavior

*Inherited principle — target-language wording remains a draft.*

Keep cancellation distinct when catching and translating failures. Account for the cancellation representations used by the actual framework operation rather than converting every catch into an offline state. Cleanup should run at the relationship owner without turning cancellation into success.

Retry only named eligible failures with a bounded policy and one authoritative retry owner. Do not nest independent retries in a view, service, and transport for the same request. Record when cancellation cannot stop work that an external system has already accepted.

**Basis:** [KT:K019](https://starter.devthomas.site/style/Kotlin) · [S:CONCURRENCY](https://raw.githubusercontent.com/swiftlang/swift-book/main/TSPL.docc/LanguageGuide/Concurrency.md)

## SW021 — Actors express isolation, not just scheduling intent

*Prepared native translation — not a separate historical owner vote.*

Give mutable concurrent owners a deliberate isolation contract. UI-facing model mutations belong on the appropriate UI actor; unrelated domain computation does not automatically belong there. Preserve a repository's selected Swift language mode and default-isolation settings rather than silently changing them.

An await can permit actor reentrancy. Revalidate assumptions that can change across suspension before committing state. Do not use nonisolated(unsafe), unchecked Sendable, or an arbitrary dispatch hop merely to silence a diagnostic. Concurrency promises require an actual ownership or synchronization argument.

**Basis:** [KT:K020](https://starter.devthomas.site/style/Kotlin) · [S:ISOLATION](https://raw.githubusercontent.com/swiftlang/swift-book/main/TSPL.docc/LanguageGuide/Concurrency.md)

## SW022 — Transfer safe values across isolation boundaries

*Prepared native translation — not a separate historical owner vote.*

Prefer appropriately Sendable value snapshots at concurrency boundaries. A struct's name does not make a reachable reference graph safe for concurrent access. Let compiler diagnostics expose unsupported transfers rather than erasing types or asserting unchecked conformance without proof.

When a synchronized reference type genuinely needs an unchecked conformance, keep it narrow, explain the protected state and invariants, and test the concurrency behavior. Do not treat a read-only property or a stable reference as proof of thread safety.

**Basis:** [KT:K003](https://starter.devthomas.site/style/Kotlin) · [KT:K020](https://starter.devthomas.site/style/Kotlin) · [S:SENDABLE](https://raw.githubusercontent.com/swiftlang/swift-book/main/TSPL.docc/LanguageGuide/Concurrency.md)

## SW023 — ARC and capture lists follow actual ownership

*Prepared native translation — not a separate historical owner vote.*

Review closure and task captures for retention cycles and resource lifetime. Use weak or unowned captures only when their absence/lifetime semantics are correct; adding weak self everywhere can silently discard required work. A long-lived owner retaining a task that retains the owner needs a deliberate shutdown plan.

Do not rely on a deinitializer to rescue every incorrectly owned subscription. Stop or detach relationships when their semantic lifetime ends. Release only resources this component owns, not borrowed services whose lifecycle belongs elsewhere.

**Basis:** [KT:K021](https://starter.devthomas.site/style/Kotlin) · [S:ARC](https://raw.githubusercontent.com/swiftlang/swift-book/main/TSPL.docc/LanguageGuide/AutomaticReferenceCounting.md)

## SW024 — Events, commands, and observation remain distinct

*Inherited principle — target-language wording remains a draft.*

Send a command through a named method or typed capability. Observe state through an intentional observation mechanism. Use a notification or stream only when its delivery, lifetime, payload, and loss behavior are part of the contract.

Do not implement required one-to-one control flow as a broad NotificationCenter broadcast to make coupling less visible. A repeated property assignment or change token is not an automatically reliable event queue. Important outcomes that must survive a lifecycle gap need state or an acknowledged-work model.

**Basis:** [GD:G008](https://starter.devthomas.site/style/Godot) · [KT:K016](https://starter.devthomas.site/style/Kotlin)

## SW025 — Navigation state belongs to a scene, not an accidental singleton

*Inherited principle — target-language wording remains a draft.*

Represent meaningful destinations and selections with typed values. Keep a scene's navigation and pending actions scoped to that scene unless cross-scene coordination is a real product requirement. Multiple windows must not accidentally share a single navigation stack or consume each other's one-shot commands.

Use native navigation/scene APIs where they implement the needed behavior. Validate external deep links before constructing a destination. Saving a navigation path is not the same as persisting the underlying document or proving the destination still exists.

**Basis:** [GD:G013](https://starter.devthomas.site/style/Godot) · [KT:K015](https://starter.devthomas.site/style/Kotlin) · [KT:K027](https://starter.devthomas.site/style/Kotlin)

## SW026 — Persistence and model observation are separate responsibilities

*Inherited principle — target-language wording remains a draft.*

Observation means a value change can affect presentation; it does not define save timing, migrations, transaction semantics, or conflict recovery. Keep those policies with a persistence owner. Use Codable or a storage framework only where its actual role is needed.

Do not make every domain value a persistence-framework model or treat a stored object as an immutable UI snapshot. Define draft/committed state and preserve recoverable edits on failure. A guide adoption does not authorize replacing SwiftData, files, SQLite, or a remote backend.

**Basis:** [KT:K011](https://starter.devthomas.site/style/Kotlin) · [KT:K015](https://starter.devthomas.site/style/Kotlin) · [S:CODABLE](https://developer.apple.com/documentation/swift/codable/)

## SW027 — Identity and equality describe domain meaning

*Prepared native translation — not a separate historical owner vote.*

Use stable identifiers for repeated views and persisted entities. Do not generate a fresh identifier in body or a computed property merely to satisfy Identifiable. Keep identity separate from equality: equal display fields do not necessarily identify the same entity.

Add Equatable or Hashable when the consumer actually needs the semantic operation, and include the fields its contract requires. Do not add a meaningless UUID or exclude meaningful mutable state just to make a generic cache compile.

**Basis:** [TS:D010](https://starter.devthomas.site/style/TypeScript) · [KT:K003](https://starter.devthomas.site/style/Kotlin) · [KT:K025](https://starter.devthomas.site/style/Kotlin) · [S:VALUE](https://www.swift.org/documentation/articles/value-and-reference-types.html)

## SW028 — Use native accessible controls before gesture-only substitutes

*Prepared native translation — not a separate historical owner vote.*

Use buttons, toggles, fields, links, and native selection controls for their semantic jobs. Keep labels and state available to accessibility tools. A gesture recognizer added to a visual container is not a complete button contract.

Maintain focus and keyboard behavior across meaningful transitions. Keep required actions accessible without hover or a hidden gesture. The code guide does not choose colors, theme, or branding; preserve the project's design authority while retaining native interaction semantics.

**Basis:** [GD:G017](https://starter.devthomas.site/style/Godot) · [KT:K026-K028](https://starter.devthomas.site/style/Kotlin)

## SW029 — Desktop and mobile presentation remain scoped profiles

*Prepared native translation — not a separate historical owner vote.*

For macOS, place meaningful actions in appropriate menus, commands, toolbars, and scene/window structures, and test multiwindow assumptions. For iOS, preserve the actual navigation, input, accessibility, and lifecycle requirements rather than shrinking a desktop layout.

Share domain contracts where useful, not every UI behavior by force. Platform conditional code belongs at an explicit boundary. Supporting one Apple platform does not silently expand the product to all platforms, and a shared Swift source file is not evidence that every deployment target builds.

**Basis:** [KT:K030](https://starter.devthomas.site/style/Kotlin) · [S:SCENES](https://developer.apple.com/documentation/swiftui/windowgroup)

## SW030 — Keep UIKit and AppKit bridges narrow

*Prepared native translation — not a separate historical owner vote.*

Use native bridging mechanisms for behavior SwiftUI cannot express adequately. A representable or coordinator owns a clearly named relationship, with updates and teardown corresponding to that relationship. Keep imperative callbacks from becoming a second application state owner.

Do not reach through arbitrary view/window hierarchies to mutate another feature's internals. Conversely, do not forbid a necessary bridge solely to preserve a pure-SwiftUI label. Preserve actor/thread requirements and verify the native behavior on the actual platform.

**Basis:** [KT:K021](https://starter.devthomas.site/style/Kotlin) · [S:INTEROP](https://developer.apple.com/documentation/swiftui/nsviewrepresentable/dismantlensview%28_%3Acoordinator%3A%29)

## SW031 — Access levels expose a deliberate API

*Inherited principle — target-language wording remains a draft.*

Use private for implementation details and private(set) when a readable state value must be writable only by its owner. Internal module APIs do not become public by default merely because an agent generated them. Use fileprivate only when the file-level relationship is meaningful.

Keep extensions focused on the type's semantic role rather than adding unrelated global conveniences. Protocol conformance and framework-required access stay truthful. Access modifiers are an API boundary, not protection for secrets shipped in an application bundle.

**Basis:** [TS:D023](https://starter.devthomas.site/style/TypeScript) · [KT:K032](https://starter.devthomas.site/style/Kotlin)

## SW032 — Names and files reveal the semantic role

*Inherited principle — target-language wording remains a draft.*

Use PascalCase for owned types and camelCase for ordinary functions, methods, and values. Keep booleans readable as predicates and collection names meaningful. Avoid I-prefixed protocols, Impl suffixes, and generic Manager/Helper names that hide the actual distinction.

Use descriptive Swift filenames, usually matching the primary type or coherent group of related declarations. Preserve externally required names such as Foundation APIs and serialized keys. Colocate feature values, UI, state owners, adapters, and tests instead of making global Models/Views/Services silos the only organizing principle.

**Basis:** [TS:D024](https://starter.devthomas.site/style/TypeScript) · [KT:K031-K033](https://starter.devthomas.site/style/Kotlin)

## SW033 — Keep formatting deterministic and comments substantive

*Inherited principle — target-language wording remains a draft.*

Use one pinned formatter with UTF-8, LF, four-space indentation, and readable multiline argument/result structures. Keep its configuration consistent with explicit types, explicit Void, native builders, and the selected binding policy.

Comments explain invariants, actor isolation, ownership, cancellation, units, or a real exception. Do not narrate every syntactic operation or preserve speculative architecture as if it were accepted design. A formatter cannot determine whether a class, actor, or binding owns the right state.

**Basis:** [TS:D025](https://starter.devthomas.site/style/TypeScript) · [KT:K034](https://starter.devthomas.site/style/Kotlin)

## SW034 — Test values, owners, and native behavior at their real boundaries

*Inherited principle — target-language wording remains a draft.*

Test pure parsing, value transformations, exhaustive state consumers, and owner APIs without SwiftUI where possible. Add real framework/platform tests for bindings, view identity, focus, navigation, scenes, persistence, and native bridges.

Test cancellation, stale async completion, and isolation-sensitive behavior when present. Do not certify a native app from Linux Foundation tests or screenshots alone. Avoid tests that routinely mutate private fields instead of using the intentional command/query surface.

**Basis:** [GD:G023](https://starter.devthomas.site/style/Godot) · [KT:K036](https://starter.devthomas.site/style/Kotlin)

## SW035 — Toolchain evidence is not interchangeable across targets

*Inherited principle — target-language wording remains a draft.*

Record the compiler, Swift language mode, concurrency settings, SDK, deployment targets, formatter, and test commands. Do not silently upgrade a project's deployment target to make an example available. A successful swiftc fixture does not mean an Xcode application compiled or launched.

Keep language checks, package tests, simulator/device builds, native interaction, signing, and distribution evidence separate. Do not use an unchecked concurrency marker or blanket warning suppression as a substitute for resolving a contract. Preserve dependencies, entitlements, app identifiers, data schemas, and product capabilities unless separately authorized.

**Basis:** [KT:K035-K038](https://starter.devthomas.site/style/Kotlin)

## Review and release boundary

This guide is intentionally published as **in progress**. Displayed candidate text in unresolved owner-choice sections is a recommendation for review, not an owner decision. Publishing this review surface does not approve those choices, authorize application migrations, upgrade project toolchains, or certify an implementation. Resolve the queued decisions and obtain final guide-level approval before marking the guide stable.

No implementation repository has been migrated by publishing this draft. Repository-specific dependency versions, product requirements, storage formats, and deployment policies remain external to this reusable style contract.
