---
id: dart-flutter
title: Dart + Flutter
summary: A Dart and Flutter house style built around explicit value contracts, owned widget state, controlled asynchronous lifetimes, and package-neutral architecture.
human_summary: Dart has strong static typing and Flutter has several valid state patterns; this guide applies explicit ownership and lifecycle rules without silently mandating a state-management package.
status: in-progress
updated: "2026-09-27"
accepted_through: draft
version: 0.9.0-review.1
route: /style/Dart-Flutter
---

# Dart + Flutter Style Guide

> **In progress.** Remaining choices: DF-Q01, DF-Q02.

For agents: this is a published review draft, not a stable house standard. Apply accepted stable guides first. Within this guide, owner-choice sections explicitly marked pending remain unresolved; displayed candidate text is not approval. Do not migrate an existing repository merely because this draft is public.

## Scope

This draft covers Dart language contracts and Flutter widget/state/lifecycle boundaries. The existing Domain Expansion Flutter application provides project context, not a universal decision to use Riverpod, go_router, sqflite, or its dependency versions everywhere. A conditional Riverpod profile is written below and its default status is an explicit review item.

Dart's final, const, collection interfaces, class modifiers, Futures, and Streams retain their native meanings. This is not a Kotlin guide with renamed keywords. A repository declares its Dart/Flutter SDK, platform targets, analyzer profile, code generators, and dependencies separately. Dart 3 constructs in examples are an example requirement, not permission to upgrade an app.

## DF001 — Write explicit, truthful types

*Inherited principle — target-language wording remains a draft.*

Annotate fields, ordinary local bindings, parameters, and named results with precise types. Use void for synchronous procedures, Future<void> for asynchronous procedures, and typed collection elements. Do not broaden a domain to dynamic or Object merely to avoid spelling its actual contract.

An initializing formal such as `this.title` obtains its type from the explicitly typed field; preserve that native relationship. Pattern variables and framework builder parameters follow supported syntax. Use a typed named function or complete function type where anonymous-function syntax cannot state the full contract usefully.

**Basis:** [TS:D001](https://starter.devthomas.site/style/TypeScript) · [TS:D015](https://starter.devthomas.site/style/TypeScript) · [KT:K001](https://starter.devthomas.site/style/Kotlin) · [D:TYPES](https://dart.dev/language/type-system)

## DF002 — Choose the final policy for mutable local objects

*Owner choice — pending unless explicitly recorded below.*

**Pending DF-Q01.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:DF-Q01:START -->

Use final with an explicit type for a binding that is not reassigned, even when it refers to an intentionally mutable object. Use an ordinary typed declaration when reassignment is intended. Expose mutation authority through the owner API and document collection behavior; List<T> by itself is not a read-only contract.

```dart
List<String> initialLabels() {
  final List<String> labels = <String>[];
  labels.add('Live');
  return List<String>.unmodifiable(labels);
}
```

This preserves reference stability while the builder remains mutable. The returned collection disallows structural mutation but does not deep-freeze arbitrary elements. Do not equate final with const or advertise immutable snapshots while retaining mutable element aliases.

<!-- DECISION:DF-Q01:END -->

**Basis:** [TS:D002](https://starter.devthomas.site/style/TypeScript) · [KT:K002](https://starter.devthomas.site/style/Kotlin) · [D:VARIABLES](https://dart.dev/language/variables) · [D:COLLECTIONS](https://api.dart.dev/dart-core/List/List.unmodifiable.html)

## DF003 — Treat const as a language constant, not a runtime freeze call

*Prepared native translation — not a separate historical owner vote.*

Use const for values satisfying Dart's compile-time constant contract and const constructors when the value/widget genuinely supports it. Final is a different stable-binding feature. Do not force runtime data into a constant expression or assume a final reference has frozen its target.

A constructor being declared const permits const use; it does not make every non-const invocation a universal canonical object. Keep the semantics of identity and mutable children explicit. Use compile-time constants for actual stable values, not to turn an evolving domain owner into pseudo-immutable configuration.

**Basis:** [KT:K002-K003](https://starter.devthomas.site/style/Kotlin) · [D:VARIABLES](https://dart.dev/language/variables)

## DF004 — Construct snapshots without mutable collection aliases

*Inherited principle — target-language wording remains a draft.*

Use immutable fields for ordinary snapshots and take an unmodifiable structural copy when a collection must not expose mutable source structure. List<T> alone does not promise that writes are disallowed. An unmodifiable live view can still reflect mutations made through another alias.

Review element immutability separately; an unmodifiable list of mutable objects is not a deeply immutable snapshot. Prefer small replacement values over published field mutation. Do not introduce a universal deep-clone package or persistent collection framework without an actual ownership or performance need.

**Basis:** [KT:K003](https://starter.devthomas.site/style/Kotlin) · [D:COLLECTIONS](https://api.dart.dev/dart-core/List/List.unmodifiable.html)

## DF005 — Use values for records and classes for continuing owners

*Inherited principle — target-language wording remains a draft.*

Use a small immutable value class for a named record with a meaningful API or invariant. Use Dart records for genuinely structural, small multiple-value contracts, preferring named fields when positions are not the point. Neither representation should create an unconstrained scalar wrapper merely to rename a string.

Use a continuing class for mutable state, a resource, a lifecycle, or framework participation. A widget class has a real Flutter role and is not forbidden by the data-first principle. Do not create Managers, single-method use-case classes, or a class hierarchy solely for code grouping.

**Basis:** [TS:D020](https://starter.devthomas.site/style/TypeScript) · [KT:K005](https://starter.devthomas.site/style/Kotlin) · [D:RECORDS](https://dart.dev/language/records)

## DF006 — Closed payload alternatives use sealed variants

*Prepared native translation — not a separate historical owner vote.*

Use a sealed base with named variants when alternatives carry different data. Keep subclasses in the appropriate library so the compiler can reason about the closed set, and consume complete owned domains with an exhaustive switch. Do not add a catch-all merely to hide a newly added case.

```dart
sealed class SaveResult {
  const SaveResult();
}
final class Saved extends SaveResult {
  const Saved({required this.recordId});
  final String recordId;
}
final class Rejected extends SaveResult {
  const Rejected({required this.reason});
  final String reason;
}

String resultLabel(SaveResult result) => switch (result) {
  Saved(recordId: final String recordId) => 'Saved: $recordId',
  Rejected(reason: final String reason) => 'Rejected: $reason',
};
```

Class-pattern identity already supplies the internal variant distinction. Retain a wire discriminator only where serialization actually needs it. A generic open interface is not an equivalent closed sum type.

**Basis:** [TS:D006-D008](https://starter.devthomas.site/style/TypeScript) · [KT:K006-K007](https://starter.devthomas.site/style/Kotlin) · [D:MODIFIERS](https://dart.dev/language/class-modifiers) · [D:PATTERNS](https://dart.dev/language/pattern-types)

## DF007 — Use enums for finite payload-free choices

*Prepared native translation — not a separate historical owner vote.*

Use enum values for a closed scalar choice with no variant-specific payload. Use sealed variants when alternatives need different shapes. Keep external wire codes explicitly mapped rather than relying on an ordinal or assuming a member name is permanent.

Do not leave a meaningful closed domain as arbitrary String, and do not add a runtime catalog unless a real consumer needs it. If a mapping must be complete, test complete coverage instead of assuming a typed list proves every enum value occurs exactly once.

**Basis:** [KT:K008](https://starter.devthomas.site/style/Kotlin) · [D:ENUMS](https://dart.dev/language/enums)

## DF008 — Nullability represents deliberate absence

*Inherited principle — target-language wording remains a draft.*

Use T? for ordinary absence and named alternatives for absence carrying several meaningful states. Narrow with a check or supported promotion rather than using postfix ! as the ordinary first-party path.

A nullable controller, selection, or dependency may be absent for different lifecycle reasons; model those distinctions when they affect commands. Use ?. only when skipping is a valid outcome. Do not introduce an arbitrary default record or empty string to hide a required value that was never established.

**Basis:** [TS:D004](https://starter.devthomas.site/style/TypeScript) · [KT:K009](https://starter.devthomas.site/style/Kotlin) · [D:NULL](https://dart.dev/null-safety/understanding-null-safety)

## DF009 — late and initialization timing require a lifecycle proof

*Prepared native translation — not a separate historical owner vote.*

Prefer constructor-supplied, immediately initialized dependencies. Use late only for a real framework or construction sequence in which every legitimate read follows initialization. A field that may disconnect or be released repeatedly needs that state modeled separately.

Late is not asynchronous readiness or post-disposal validity. Do not place blocking or effectful work behind a getter that appears to be a cheap query. Test repeated attach/update/dispose relationships rather than assuming initialization occurs once forever.

**Basis:** [KT:K010](https://starter.devthomas.site/style/Kotlin) · [D:VARIABLES](https://dart.dev/language/variables)

## DF010 — Validate dynamic input before claiming an owned type

*Inherited principle — target-language wording remains a draft.*

Contain genuinely untyped input as Object? or an explicit raw representation, then validate before constructing a domain value. Dart dynamic permits operations without the desired static checks; do not let a decoder's dynamic result spread through the application.

Map casts and generated fromJson methods must have their real behavior inspected. Shape, coercion, ranges, accepted URLs, schema versions, and authorization are separate checks. A generic type argument or a cast is not evidence that external JSON satisfies the whole domain contract.

**Basis:** [TS:D011-D013](https://starter.devthomas.site/style/TypeScript) · [KT:K011](https://starter.devthomas.site/style/Kotlin) · [D:TYPES](https://dart.dev/language/type-system)

## DF011 — Failure results, exceptions, and bugs stay distinct

*Inherited principle — target-language wording remains a draft.*

Use null for an ordinary miss, named result variants for expected outcomes the caller must inspect, and exceptions when an operation cannot deliver its promised normal result. Do not turn every error into false or an empty list.

Catch failures at the boundary that can choose recovery, preserve useful stack/cause information, and keep sensitive data out of diagnostics. Avoid catching every Object merely to continue after a programmer error. A returned union does not prove the implementation cannot throw.

**Basis:** [TS:D021](https://starter.devthomas.site/style/TypeScript) · [KT:K012](https://starter.devthomas.site/style/Kotlin) · [D:ERRORS](https://dart.dev/language/error-handling)

## DF012 — Assertions are not production validation

*Inherited principle — target-language wording remains a draft.*

Do not make assert the only guard for malformed external or configuration input; Dart assertions are not always enabled in production. Keep required effects outside assertion expressions and use a normal safe-failure path for data that can actually be invalid.

Diagnostics do not define success or control flow. A catch-and-log followed by a success state is not an acceptable default. Framework error-reporting hooks can record failures, but they do not replace the operation's typed outcome or deliberate exception policy.

**Basis:** [GD:G021](https://starter.devthomas.site/style/Godot) · [KT:K012](https://starter.devthomas.site/style/Kotlin) · [D:ERRORS](https://dart.dev/language/error-handling)

## DF013 — Interfaces are earned behavioral seams

*Inherited principle — target-language wording remains a draft.*

Use an abstract interface class or another precise capability contract when real behavioral substitution is needed. Choose final/base/sealed modifiers by the intended extension and implementation boundary, not by a blanket rule attached to every class.

A value class does not need an interface simply because it crosses a module boundary. A test fake can justify a narrow seam; it does not justify a full mirror hierarchy of implementations. Prefer a function typedef for a single supplied operation when it expresses the role directly.

**Basis:** [TS:D005](https://starter.devthomas.site/style/TypeScript) · [KT:K013](https://starter.devthomas.site/style/Kotlin) · [D:MODIFIERS](https://dart.dev/language/class-modifiers)

## DF014 — Generics and code generation need concrete value

*Inherited principle — target-language wording remains a draft.*

Introduce a first-party generic only for actual supported type variation and useful relationships. Use concrete state/value models when one configuration is enough. Library Future, Stream, collections, and framework generic types are not subject to a two-use ceremony.

Prefer straightforward handwritten value types until repetitive implementation, serialization, equality, or another real need earns code generation. A generator is not automatically forbidden, but its version, inputs, outputs, and regeneration checks belong to the repository. Do not edit generated output or add a new generator merely as part of accepting this guide.

**Basis:** [TS:D019](https://starter.devthomas.site/style/TypeScript) · [KT:K013](https://starter.devthomas.site/style/Kotlin)

## DF015 — Functions and callback contracts stay explicit

*Inherited principle — target-language wording remains a draft.*

Use named functions for reusable operations, methods for real owners, and typed anonymous functions for supplied behavior. Write named return types explicitly. Anonymous-function syntax does not provide the same return annotation form as a named Dart function; use a complete function type or a named helper when the result contract needs to be source-visible.

Use named arguments to clarify same-typed values and preserve useful initializing-formal syntax. Keep extension methods feature-local and unsurprising. Do not hide I/O behind a getter or build nested cascades that obscure which owner is being mutated.

**Basis:** [TS:D014-D015](https://starter.devthomas.site/style/TypeScript) · [KT:K004](https://starter.devthomas.site/style/Kotlin) · [D:FUNCTIONS](https://dart.dev/language/functions)

## DF016 — State has one canonical writer

*Inherited principle — target-language wording remains a draft.*

Keep mutable domain state inside its owner and expose semantic commands plus read-only queries or snapshots. A final field that holds a mutable notifier or collection is not an immutable observation. Do not expose that notifier's full writable API to avoid defining a small capability.

Keep derived state derived and make cache invalidation explicit. A UI coordinator can orchestrate owners without cloning their truths into its own flags. The state-management package does not decide whether the ownership model is correct.

**Basis:** [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K015](https://starter.devthomas.site/style/Kotlin)

## DF017 — Choose whether Riverpod is a profile or a default

*Owner choice — pending unless explicitly recorded below.*

**Pending DF-Q02.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:DF-Q02:START -->

Keep the reusable Flutter core package-neutral. Use local widget state for genuinely local presentation and a small explicit state owner for shared/domain responsibilities. Retain a repository's selected package rather than migrating it merely for style conformity.

When a repository already uses or separately adopts Riverpod, apply the Riverpod profile below: dependencies flow through its graph, observations and commands remain distinct, and provider lifetime/disposal follows the real owner. Do not require a provider for every local field or add Riverpod solely because an agent can scaffold it quickly.

<!-- DECISION:DF-Q02:END -->

**Basis:** [KT:K017](https://starter.devthomas.site/style/Kotlin) · [KT:K030](https://starter.devthomas.site/style/Kotlin) · [Project example](https://github.com/devin-thomas/domain-expansion/blob/first-fixes/pubspec.yaml) · [D:RIVERPOD](https://riverpod.dev/docs/concepts2/consumers)

## DF018 — Riverpod observation and commands retain their jobs

*Prepared native translation — not a separate historical owner vote.*

In the Riverpod profile, use reactive observation for values that should rebuild the consumer, explicit reads at command boundaries, and listeners for a real observed side-effect relationship. Do not replace a reactive dependency with a one-time read simply to silence rebuilding.

Keep dependencies explicit in the provider graph, put mutation behind the owning notifier/service commands, and scope overrides to the real composition/test boundary. Auto-disposal and keep-alive are lifetime decisions; verify them against the pinned package version. A provider container is not permission to create a second global state universe.

**Basis:** [KT:K015-K017](https://starter.devthomas.site/style/Kotlin) · [D:RIVERPOD](https://riverpod.dev/docs/concepts2/consumers)

## DF019 — Widgets present state; owners perform domain work

*Inherited principle — target-language wording remains a draft.*

Keep reusable widgets small and explicit: immutable input values, semantic callbacks, and only the presentation-local state they need. A widget does not automatically need a view model or notifier. A domain service does not need a BuildContext merely because the UI calls it.

Do not perform requests, storage writes, or subscription registration directly in build. Rebuilding is not a user event or transaction. Composition chooses dependencies; the visual subtree should not discover arbitrary application services through an untyped locator.

**Basis:** [KT:K022-K023](https://starter.devthomas.site/style/Kotlin) · [D:ARCHITECTURE](https://docs.flutter.dev/app-architecture/guide)

## DF020 — Widget identity and equality remain meaningful

*Prepared native translation — not a separate historical owner vote.*

Use stable keys when identity affects state preservation across reorder, replacement, or navigation. Do not generate fresh keys on each build or use a GlobalKey solely to reach into another widget's private state.

Define value equality when the state/caching contract needs it; ordinary class instances do not gain structural equality merely by having final fields. Distinguish record structural equality from custom class equality. A code-generation package must preserve the actual domain fields and semantics rather than treating all records as interchangeable.

**Basis:** [KT:K025](https://starter.devthomas.site/style/Kotlin) · [D:KEYS](https://api.flutter.dev/flutter/foundation/Key-class.html) · [D:RECORDS](https://dart.dev/language/records)

## DF021 — Lifecycle callbacks each own one relationship phase

*Prepared native translation — not a separate historical owner vote.*

Use initialization for intrinsic setup, dependency/update hooks for relationships that actually change, and dispose for ending the owned widget relationship. Reattach listeners when a supplied dependency changes rather than retaining a subscription to the old object.

Keep callbacks thin enough to delegate meaningful work without inventing a class per callback. Do not release a service borrowed from a longer-lived provider. Test repeated mount, update, and disposal when the feature relies on them.

**Basis:** [GD:G015](https://starter.devthomas.site/style/Godot) · [KT:K021](https://starter.devthomas.site/style/Kotlin) · [D:STATE](https://api.flutter.dev/flutter/widgets/State-class.html)

## DF022 — setState callbacks stay synchronous and focused

*Prepared native translation — not a separate historical owner vote.*

Perform asynchronous work outside setState and use its synchronous callback only to commit appropriate presentation-state changes. Do not make the callback async or start unrelated work inside it.

A failed operation does not automatically become success because the widget rebuilt. Determine whether the completion still belongs to the same request/entity and whether the widget is still valid before applying it. Prefer preventing obsolete work from publishing over scattering lifecycle checks after every unrelated line.

**Basis:** [KT:K022](https://starter.devthomas.site/style/Kotlin) · [D:SETSTATE](https://api.flutter.dev/flutter/widgets/State/setState.html)

## DF023 — Check context validity after suspension, then check identity

*Prepared native translation — not a separate historical owner vote.*

After an async gap, verify a BuildContext is still mounted before using it when that context could have become invalid. A mounted check is not proof that the operation still belongs to the same account, item, route, or request generation.

Keep navigation and messages at the UI boundary, and send domain results rather than storing a BuildContext in a persistent owner. Do not use an early mounted check as a lifetime guarantee for all later awaits.

**Basis:** [KT:K021](https://starter.devthomas.site/style/Kotlin) · [D:MOUNTED](https://api.flutter.dev/flutter/widgets/BuildContext/mounted.html)

## DF024 — Async contracts use Future and Stream deliberately

*Prepared native translation — not a separate historical owner vote.*

Use Future<T> for an asynchronous result and Stream<T> for continuing observations. Declare async procedures Future<void>, not async void, except where a genuinely fixed external signature forces an adapter with explicit failure ownership.

An async function does not automatically move CPU work away from the UI isolate. Use a real concurrency mechanism only where the workload and supported platform justify it. Keep the returned outcome contract explicit rather than using dynamic or a raw Future.

**Basis:** [TS:D022](https://starter.devthomas.site/style/TypeScript) · [KT:K018](https://starter.devthomas.site/style/Kotlin) · [D:FUNCTIONS](https://dart.dev/language/functions) · [D:ASYNC](https://api.dart.dev/dart-async/Future/timeout.html)

## DF025 — unawaited is not an error handler

*Prepared native translation — not a separate historical owner vote.*

Await required work. A deliberately detached Future needs both a lifetime owner and a terminal failure policy. The unawaited function documents non-awaiting; it does not catch errors or keep an operation alive independently of the application's lifetime.

Do not use Future.ignore as a general supervision mechanism that discards failures. A reporting catch callback must itself be safe and conform to the Future's return contract. Framework void callbacks should delegate to an operation boundary that actually owns completion and errors.

**Basis:** [TS:D022](https://starter.devthomas.site/style/TypeScript) · [KT:K018](https://starter.devthomas.site/style/Kotlin) · [D:UNAWAITED](https://api.dart.dev/dart-async/unawaited.html)

## DF026 — Cancellation support must exist in the underlying operation

*Prepared native translation — not a separate historical owner vote.*

A Future has no universal built-in cancellation protocol. Use the actual client/task/subscription cancellation mechanism when available and prevent stale completions from mutating current state. A timeout or Future.wait failure does not imply that all underlying operations stopped.

Keep retry policy bounded and owned by one layer. Distinguish deliberate cancellation, supersession, transport failure, and a rejected domain command. Do not claim a cancellation token works unless the called boundary actually observes it.

**Basis:** [KT:K019](https://starter.devthomas.site/style/Kotlin) · [D:ASYNC](https://api.dart.dev/dart-async/Future/timeout.html)

## DF027 — Dispose subscriptions and async cleanup through the correct owner

*Prepared native translation — not a separate historical owner vote.*

Pair stream/listener subscriptions with their relationship owner and cancel them when the relationship ends or changes. A subscription's cancellation may itself be asynchronous; account for its failure/completion contract rather than discarding it.

A synchronous Flutter dispose override cannot be changed to an async Future-returning method. Design bounded synchronous detachment and a separately owned cleanup operation when asynchronous release is required. Keep long-lived service cleanup out of a widget that merely borrowed the service.

**Basis:** [KT:K021](https://starter.devthomas.site/style/Kotlin) · [D:STREAMS](https://api.dart.dev/dart-async/StreamSubscription/cancel.html) · [D:STATE](https://api.flutter.dev/flutter/widgets/State-class.html)

## DF028 — Keep time and execution affinity explicit

*Inherited principle — target-language wording remains a draft.*

Distinguish animation ticks, elapsed durations, civil timestamps, and authoritative media/service progress. Prefer a Duration value where it expresses the contract; label primitive units at platform boundaries.

Stop timers and observers with their owner. Do not mutate the same transition from independent clocks or count build invocations as elapsed time. Respect plugin/isolate/thread requirements instead of assuming a read-only getter or an async function makes a mutable resource safe anywhere.

**Basis:** [GD:G016](https://starter.devthomas.site/style/Godot) · [KT:K020](https://starter.devthomas.site/style/Kotlin)

## DF029 — Persistence and routing do not define domain truth

*Inherited principle — target-language wording remains a draft.*

Keep storage, import/export, route parsing, and provider SDK behavior at explicit adapters. Validate runtime inputs, preserve schema/version contracts, and provide deliberate migration and failure behavior. An ORM or generated model does not remove those responsibilities.

A route parameter is not proof that an entity exists or that the caller may access it. A local storage snapshot is not automatically current remote truth. Retain the project's actual router, database, notification, and platform choices unless separately authorized to change them.

**Basis:** [KT:K011](https://starter.devthomas.site/style/Kotlin) · [KT:K015](https://starter.devthomas.site/style/Kotlin) · [KT:K030](https://starter.devthomas.site/style/Kotlin)

## DF030 — Use native semantic controls and accessible presentation

*Prepared native translation — not a separate historical owner vote.*

Use controls that implement the expected activation, focus, state, and semantic labeling rather than decorating gesture-only containers as if they were equivalent. Keep required actions usable with the platform's supported input and accessibility mechanisms.

Preserve focus during content updates and make meaningful state changes understandable without color alone. Visual design remains project-specific. A successful mobile interaction does not prove a desktop, TV, or web target has the required keyboard/remote behavior.

**Basis:** [GD:G017](https://starter.devthomas.site/style/Godot) · [KT:K026-K028](https://starter.devthomas.site/style/Kotlin) · [D:ACCESSIBILITY](https://docs.flutter.dev/ui/accessibility)

## DF031 — Library privacy and names stay native

*Prepared native translation — not a separate historical owner vote.*

Use lower_snake_case source paths, UpperCamelCase types, lowerCamelCase members/variables, and Dart's native constant naming convention rather than mechanically importing Kotlin enum/constant spelling. Preserve externally prescribed names and wire keys.

A leading underscore is library privacy, not a separate per-class protection boundary. Design APIs accordingly. Use part files and generated part directives only when they serve a real library/generator relationship; do not use them to erase every feature boundary.

**Basis:** [KT:K031-K033](https://starter.devthomas.site/style/Kotlin) · [D:STYLE](https://dart.dev/effective-dart/style) · [D:MODIFIERS](https://dart.dev/language/class-modifiers)

## DF032 — Organize code around features and semantic owners

*Inherited principle — target-language wording remains a draft.*

Colocate a feature's value models, UI, state owner, adapters, and relevant tests. Keep app bootstrap and routing composition separate from application-wide business behavior. Move code to shared modules only when genuinely shared.

Avoid global helpers/managers/models silos and speculative multi-package architectures. Split files when responsibilities diverge, while keeping tightly related sealed variants together where the language closure boundary requires it. The code generator's files stay clearly distinguished from handwritten source.

**Basis:** [GD:G022](https://starter.devthomas.site/style/Godot) · [KT:K031](https://starter.devthomas.site/style/Kotlin)

## DF033 — Analyzer and formatter policy is specific and honest

*Inherited principle — target-language wording remains a draft.*

Use the pinned Dart formatter and an analyzer configuration that catches reliable type, null-safety, discarded-Future, lifecycle, and house-contract violations. Enable strict casts/inference/raw-type checks where the selected SDK supports them. Do not let a blanket preset erase explicit types or impose the opposite final-local policy.
Keep suppressions narrow and exclude generated/vendor output deliberately. A formatter or analyzer does not prove correct provider lifetime, event delivery, snapshot ownership, or native platform behavior. Do not present a suggested analysis_options file as evidence that its rules ran.

**Basis:** [TS:D025](https://starter.devthomas.site/style/TypeScript) · [KT:K034-K035](https://starter.devthomas.site/style/Kotlin) · [D:ANALYSIS](https://dart.dev/tools/analysis)

## DF034 — Test values, widgets, and integrations separately

*Inherited principle — target-language wording remains a draft.*

Test parsers, value transitions, and capability policies as pure Dart where possible. Use widget tests for rebuild, input, semantics, focus, and lifecycle behavior. Use integration/device tests for persistence, plugins, actual platform navigation, and long-lived background work.

Include stale completion, cancellation, disposal, and malformed import cases when the feature supports those operations. A rendered screenshot is not proof of interaction, and a pure Dart test is not a Flutter build. Test through deliberate APIs, not by routinely mutating private internals.

**Basis:** [GD:G023](https://starter.devthomas.site/style/Godot) · [KT:K036](https://starter.devthomas.site/style/Kotlin)

## DF035 — Agents preserve versions, platform scope, and evidence

*Inherited principle — target-language wording remains a draft.*

Read the actual SDK constraints, analysis options, provider graph, widget owner, platform configuration, and tests before editing. Keep app identifiers, permissions, storage formats, plugin versions, and distribution targets unchanged unless the task authorizes a migration.

Report Dart analysis, pure tests, Flutter widget tests, platform compilation, emulator/device interaction, and release validation separately. No Dart/Flutter SDK was available for the initial packet check; source examples are prepared, not represented as compiler-verified. Record later evidence before publishing a validated guide.

**Basis:** [KT:K035-K038](https://starter.devthomas.site/style/Kotlin)

## Review and release boundary

This guide is intentionally published as **in progress**. Displayed candidate text in unresolved owner-choice sections is a recommendation for review, not an owner decision. Publishing this review surface does not approve those choices, authorize application migrations, upgrade project toolchains, or certify an implementation. Resolve the queued decisions and obtain final guide-level approval before marking the guide stable.

No implementation repository has been migrated by publishing this draft. Repository-specific dependency versions, product requirements, storage formats, and deployment policies remain external to this reusable style contract.
