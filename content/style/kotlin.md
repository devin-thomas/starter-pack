---
id: kotlin
title: Kotlin
summary: An explicit Kotlin house style with an Android TV profile, built around truthful types, stable bindings, owned mutation, and deliberate lifecycles.
human_summary: Kotlin is a statically typed language used for native Android apps; this guide applies explicit contracts and ownership to TV interfaces, remote input, and media lifecycles.
status: stable
updated: "2026-09-26"
accepted_through: K038
version: 1.0.0
route: /style/Kotlin
---

# Kotlin Style Guide — Android TV

For agents: apply accepted rules K001–K038 to first-party Kotlin. Preserve external contracts at their boundaries. Kotlin uses native stable-binding semantics: `val` prevents reference reassignment, while types and ownership express underlying mutability. This reusable guide has an Android TV profile; project-specific versions and product decisions remain in the target repository. See the validation scope before making claims about compiled examples or device behavior.

## Purpose and scope

Use Kotlin's native representations to preserve the house philosophy: explicit source contracts, narrow boundaries, one owner per mutable responsibility, meaningful domain states, deliberate lifetimes, and automation that proves what it claims.

This is a reusable Kotlin/JVM house guide with an Android TV profile. New TV presentation uses Jetpack Compose for TV. Media3 applies when the application actually plays media; it is not required infrastructure for every TV app. Existing framework integrations are migrated deliberately, not rewritten merely because this guide exists.

The guide does not prescribe mobile parity, Kotlin Multiplatform, a backend, a dependency-injection framework, or a multi-module architecture. Kotlin, Gradle, Android Gradle Plugin, JDK, SDK, Compose, and other dependency versions belong in a repository's checked-in toolchain profile. Do not transplant the Godot guide's engine pin into Kotlin or silently upgrade a working app.

**Reading the rules:** “Must” describes this accepted house contract, not a claim that the language mandates the choice. References explain platform behavior; ecosystem defaults do not overrule an explicit house choice.

## K001 — Write explicit, truthful types

Annotate properties, local bindings, function parameters, named-function return types, and lambda parameters wherever Kotlin offers a useful annotation position. Include `Unit` on named functions and overrides, including UI-emitting composables. Keep expression bodies when a single expression is clearer.

```kotlin
internal fun boundedVolume(volume: Float): Float {
    require(volume.isFinite()) { "Volume must be finite" }
    return volume.coerceIn(0.0f, 1.0f)
}

internal fun validateRetryLimit(retryLimit: Int): Unit {
    require(retryLimit >= 0) { "Retry limit must be nonnegative" }
}
```

Do not broaden a domain to `Any`, erase nullability, or introduce a less precise type just to add an annotation. Generic call-site inference is acceptable when the concrete choice is already source-visible. Preserve framework receiver-lambda syntax where the receiver contract belongs to the called API.

This deliberately overrides Kotlin's general recommendation to omit redundant `Unit`. Configure tools accordingly; an IDE hint is not authorization to erase a house contract. [S1]

## K002 — Separate binding stability, mutability, and ownership

Use `val` when the local binding is not reassigned and `var` when reassignment is intentional. A `val` reference may point to an explicitly mutable resource. Mutation authority must remain visible in its type, API, and owner.

```kotlin
internal fun initialLabels(): List<String> {
    val labels: MutableList<String> = mutableListOf()
    labels.add("Live")
    return labels.toList()
}
```

This convention does not make Kotlin data deeply immutable. Kotlin `val` means a non-reassignable local binding or a read-only property, not a frozen object graph; a custom getter can also expose a changing value. `const val` is a separate compile-time-constant feature. [S2][S3]

External callers must not acquire a second writer for state they do not own. Unlike the TypeScript local-binding convention, Kotlin binding stability and underlying mutability are separate contracts: `val` preserves the stable reference, while `List` versus `MutableList` and the owner's API communicate allowed operations. A read-only interface still does not prove a deeply immutable value.

## K003 — Value snapshots are immutable by design

Use `val` fields for ordinary snapshots, configuration, and state variants. Expose `List`, `Set`, and `Map` when callers should not mutate a collection. Do not call a read-only view an immutable snapshot while retaining a live mutable alias behind it.

Copy mutable collection structure when transferring a snapshot and ensure elements also follow the intended immutability contract. Kotlin `data class.copy()` is shallow. A copied record does not independently own a nested mutable list. [S3][S4]

Prefer replacing a small state value over mutating published fields. Introduce persistent collections or defensive runtime wrappers only for an actual ownership, stability, or performance need. Do not add a universal deep-copy or deep-freeze framework.

## K004 — Keep callback intent beside the behavior

Use named, typed lambda parameters instead of implicit `it` in first-party business logic. A stored function value declares its complete function type.

```kotlin
val canDisplay: (TrackSummary) -> Boolean = { track: TrackSummary ->
    track.title.isNotBlank()
}
```

Kotlin lambda literals have no direct return-type annotation slot. Their result may be established by the declared function type or the receiving API's callback signature. Use a typed anonymous function when a local return contract genuinely needs to be written there. Do not invent TypeScript-style lambda syntax, extract every small callback into a new abstraction, or dismantle Compose's receiver DSL just to repeat its API signature. [S5]

Use `_` for intentionally unused parameters. Make non-local returns explicit in intent; do not replace lambdas and anonymous functions without checking their different return semantics.

## K005 — Use data classes for values, classes for runtime owners

A Kotlin `data class` is the normal representation of a named record. It is not prohibited by the TypeScript guide's preference for data over behavioral classes. Put the identity-bearing data fields in the primary constructor; generated equality and copying do not include ordinary properties added in the class body. [S4]

Use ordinary classes for continuing objects that own a resource, evolving private state, lifecycle, or temporal invariants. Framework components such as a `ViewModel`, `Activity`, or service have real platform roles and do not need artificial justification.

Keep transformations as named functions when no continuing object is needed. Do not manufacture `Manager`, `Helper`, `Utils`, or one-method use-case classes solely to group functions. Composition is the default; inheritance requires a truthful substitutable relationship or an actual framework contract.

## K006 — Closed states use named sealed variants

Use `sealed interface` with named `data class` and `data object` variants when different alternatives carry different information. Use a sealed class instead only when shared constructor state or implementation is genuinely useful.

```kotlin
internal data class TrackSummary(
    val id: String,
    val title: String,
)

internal sealed interface PlaybackState {
    data object Connecting : PlaybackState
    data class Playing(val track: TrackSummary) : PlaybackState
    data class Paused(val track: TrackSummary) : PlaybackState
    data class Unavailable(val reason: UnavailableReason) : PlaybackState
}
```

Do not assemble a meaningful state machine from `isLoading`, `hasError`, and nullable payloads that admit contradictory combinations. A boolean still fits a genuinely independent two-valued property.

Kotlin's sealed hierarchy provides native variant identity. Do not add a redundant mutable `kind` property to every variant. Preserve a wire discriminator when the external serialization contract actually needs it. Keep the hierarchy closed through its relevant branches. [S6]

## K007 — Complete consumers are exhaustive without catch-all branches

```kotlin
internal fun playbackLabel(state: PlaybackState): String =
    when (state) {
        PlaybackState.Connecting -> "Connecting"
        is PlaybackState.Playing -> "Playing: ${state.track.title}"
        is PlaybackState.Paused -> "Paused: ${state.track.title}"
        is PlaybackState.Unavailable -> "Unavailable: ${state.reason}"
    }
```

Use exhaustive `when` expressions for a complete owned sealed or enum domain. Do not add `else -> error(...)` merely to imitate TypeScript's `assertNever`; that can hide a newly added variant from compile-time coverage checking. Kotlin already supplies the useful exhaustiveness mechanism. [S6]

A deliberately partial predicate may use `is`, `if`, or another clearly partial operation. Open external input must be validated, rejected, or mapped into an explicitly modeled unknown alternative; it is not a closed first-party union just because a cast says so.

## K008 — Enums are appropriate for closed, payload-free choices

Use an `enum class` for a finite scalar choice such as a display mode or a bounded reason code. Use sealed variants when alternatives need different payload shapes.

```kotlin
internal enum class UnavailableReason {
    OFFLINE,
    INVALID_FEED,
}
```

The TypeScript preference for literal unions does not imply free-form Kotlin strings. Preserve external codes explicitly rather than serializing an enum's ordinal or assuming its source name is a permanent wire identifier.

Avoid documentation-only scalar aliases and arbitrary ID wrappers. A custom value class must represent an actual constraint, validated invariant, or meaningful unit contract—not merely make any string look more trustworthy.

## K009 — Null has one clear meaning at each boundary

Use `T?` for ordinary optionality or absence when no richer alternative helps. Kotlin has no separate `undefined` value; use named variants when the difference between omitted, cleared, disconnected, and invalid matters.

Do not use `!!` in ordinary first-party code. Kotlin's operator does perform a runtime null check, unlike TypeScript's erased assertion, but it still provides a poor substitute for deliberate failure semantics. Use visible narrowing, `requireNotNull` for an argument precondition, or `checkNotNull` for an internal requirement. [S7][S8]

Use `?.` and `?:` when absence genuinely permits skipping or a fallback. Do not silently ignore a required command with `controller?.play()` unless “no controller” is an intentionally handled state.

## K010 — Initialization timing is a contract

Prefer constructor-supplied dependencies and immediately initialized properties. `lateinit` is restricted to a narrow framework or test lifecycle where initialization precedes every legitimate read and that relationship is checked.

An asynchronous connection, releasable resource, or repeated attach/detach relationship is not made safe by `lateinit`; represent its real unavailable/connected/released state. Access before initialization throws, and `lateinit` does not itself express post-release validity. [S2][S7]

Use `lazy` only when initialization-on-first-access is truly the desired timing and lifetime. Do not hide a blocking operation, implicit connection, or context leak behind an innocent-looking property read. Do not rely on `isInitialized` as a substitute for resource validity.

## K011 — Validate runtime input before claiming a domain value

Choose the representation that describes the real boundary: bytes, text, `JsonElement`, an external DTO, or `Any?` for genuinely dynamic interop. Do not route already structured data through `Any?` merely to mimic TypeScript's `unknown`.

A configured deserializer can establish shape and primitive types. It does not automatically establish business constraints, acceptable URLs, authorization, sane time ranges, or referential integrity. Validate those separately, then normalize into owned values.

Keep external field names, missing/null behavior, and discriminators truthful. Validate at trust boundaries; do not re-parse the same trusted value in every function. Handle Java/platform nullability and SDK inconsistencies at the adapter rather than spreading assertions through application code.

## K012 — Failures communicate their actual meaning

Use ordinary absence for a lookup miss, named result variants for expected alternatives the caller must inspect, and exceptions when the operation cannot deliver its promised normal result. A named result is not proof that a function cannot throw.

Use `isX` for membership testing and `parseX` for construction/validation whose signature makes failure behavior clear. Do not wrap every operation in `Result<T>` simply because Kotlin supplies the type. Use that type when exception capture is actually the intended contract.

Use `require` and `check` for the appropriate argument/state preconditions, and preserve diagnostic causes without leaking sensitive input. Assertions are not the only protection for values that may be invalid in a release build. [S8]

## K013 — Abstraction must earn its place

Introduce a first-party generic only for real supported type variation and useful relationships. An abstraction used in one concrete configuration should normally remain concrete. This does not prohibit library collections, flows, or generic decoding APIs.

Use interfaces for intentional behavioral substitution; a real platform adapter, test fake, or alternate implementation can justify the seam. Do not create an interface for every class by default. A `sealed interface` modeling a closed sum type is a different native role, not a loophole requiring ordinary records to become interfaces.

Prefer meaningful names such as `Media3PlaybackController` and `HttpStationSource`, not `IPlaybackController` or `PlaybackControllerImpl`.

## K014 — Use functions and scope constructs without hiding control flow

Use `fun` for named behavior, expression bodies for simple transformations, and lambdas for supplied behavior. Name same-typed arguments and booleans when their meaning is not obvious at the call site.

A short `apply` for one object's construction or a short typed `let` for optional data is acceptable. Do not stack `let`/`run`/`also`/`apply` chains into a miniature execution framework, or nest implicit receivers until ownership becomes unclear. Their receiver and return-value meanings differ; none creates a coroutine or switches threads by itself. [S9]

Keep extension functions local to their semantic feature. Avoid general extensions on `Any`, `Context`, or `String` that perform surprising I/O or mutate unrelated owners. Standard Compose and Gradle receiver DSLs remain valid; custom DSLs require a concrete need.

## K015 — State has one authoritative writer

Commands travel toward the owner through named operations. Reads use deliberate query APIs or read-only observations. Facts travel outward through typed observations or callbacks.

A coordinator may orchestrate owners without copying their canonical state. The UI does not own a second independent truth about whether the player is running. Preserve derived state as derived unless a concrete cache has one clear invalidation owner.

```kotlin
private val _uiState: MutableStateFlow<PlaybackState> =
    MutableStateFlow(PlaybackState.Connecting)

val uiState: StateFlow<PlaybackState> = _uiState.asStateFlow()
```

This is a property fragment for an owning class, with the appropriate coroutine-flow imports. The stable handle is not an immutable flow; only the owner writes. The observed values must obey K003. Never expose a `MutableStateFlow`, `MutableList`, or mutable player merely to avoid writing a small intentional API. [S10]

## K016 — State, events, and commands are not interchangeable

Use a direct method or a typed callback for a known command. Use `StateFlow` for the current observable state; it is not an event journal and may conflate updates. Do not use repeated equal state values as a guaranteed repeated command signal. [S11]

Use a transient stream only when its loss, replay, buffering, cancellation, and consumer contract are explicit. Important UI outcomes that must still be visible after a lifecycle gap belong in state or a deliberate acknowledged-work model, not an unqualified “one-shot event.” A channel or shared stream alone does not guarantee that an absent UI handles an event. [S12]

Do not turn the Godot signal convention into a global Android event bus. There is no need for Redux-style action objects when a few named commands already express ownership clearly.

## K017 — Dependencies are supplied at a composition boundary

Use constructor parameters for ordinary collaborators and pass explicit screen data/callbacks to UI components. Use the platform's actual construction hooks for framework-owned components.

For a small app, straightforward manual construction is sufficient. Adopt a DI framework only when real graph, scope, or construction complexity earns it. Do not add Hilt, Koin, a service locator, or a global application-state object by reflex.

Use `CompositionLocal` for genuinely ambient presentation infrastructure, such as a theme—not to hide arbitrary feature services. Respect context lifetime: a persistent object must not retain an Activity merely because it was the easiest Context to obtain.

## K018 — Coroutine lifetimes must match the work

Use `suspend` functions for one-shot asynchronous operations and `Flow` for continuing observations. A suspend function is not automatically background work. The boundary performing blocking work must make it safe for its caller, with an explicit dispatcher policy. [S10]

Use the shortest correct owner: composition for presentation-only work, a screen state holder for screen work, a service for service work, or a deliberately application-scoped owner when the work truly outlives them. No `GlobalScope` or anonymous unowned scope as a shortcut.

Use structured concurrency for related child work. Await required results; choose concurrency and supervision intentionally. A `Job` reference by itself is not a failure policy. Detached work needs both a lifetime owner and a failure owner, and no in-process scope is a guarantee of survival after process death.

## K019 — Cancellation remains cancellation

Catch expected exception types at the boundary able to decide recovery. Never swallow `CancellationException`; rethrow it at any broad catch boundary. Do not turn cancellation into an offline error, retry request, or success value. [S10]

Do not indiscriminately wrap suspending work in `runCatching`: it captures thrown `Throwable` values, so cancellation needs explicit treatment. [S13]

Put cleanup in the actual owner or `finally`; reserve non-cancellable cleanup for a bounded operation that genuinely requires it. Retry policies must identify eligible failures, cap delay/work, and cancel with their owner. Do not create nested independent retry loops in the UI, repository, and player for the same operation.

## K020 — Time and thread affinity stay explicit

Keep duration, elapsed time, server schedule time, and UI animation time distinct. Name primitive units, such as `positionMs` and `durationMs`, at APIs that use primitive counts. Use a duration type where it improves the owned contract and fits the pinned toolchain.

Let the player own playback position and the product's authoritative schedule own live alignment. Do not advance playback by counting recompositions or decrementing an independent UI counter. Poll only when an API genuinely requires it, and stop polling with the appropriate lifetime.

Document thread/dispatcher confinement for mutable owners and comply with each framework resource's required thread. A read-only type, coroutine scope, or mutex does not erase a player's thread-affinity contract. ExoPlayer must be accessed on its designated application thread. [S23]

## K021 — Lifecycle callbacks perform their own semantic jobs

Construction establishes intrinsic dependencies. Activity/service setup creates the appropriate platform relationship. Active-lifecycle observation attaches only while useful. Teardown releases the resources owned by that lifetime.

Do not equate Activity recreation, screen disposal, service termination, task removal, and process death. Pair listener/controller attachment with detachment at the relationship-owning boundary. A release must not invalidate a resource owned by another component.

Keep framework callbacks thin enough to delegate meaningful work, but do not create an artificial class for every callback. Restore meaningful durable state through the chosen persistence mechanism; an in-memory property is not persistence.

## K022 — Compose renders state; it does not become the domain owner

Prefer a small screen entry point that connects the screen owner to a content composable. Content receives values and semantic callbacks. A `ViewModel` is appropriate when there is real screen-level state/lifecycle work; a service-backed single-screen client does not need a duplicate player model merely to resemble a template. [S14]

Keep focus, expanded panels, and other presentation-local details near the UI when no broader owner needs them. Do not require a ViewModel for every card or button.

No network calls, player commands, database writes, or listener registration directly in a composable's execution body. Recomposition is not an event or a transaction commit. [S15]

## K023 — Composable APIs are small and explicit

UI-emitting composables use PascalCase; value-producing composables use the naming appropriate to the value-producing operation. Give reusable visual components a `modifier: Modifier = Modifier` parameter, normally the first optional parameter, and apply it to the appropriate root.

Pass semantic callbacks such as `onPlayRequested`, not a whole ViewModel, Context, or mutable player when the child only needs one operation. Keep required parameters before optional configuration and use a trailing content lambda when it is an actual slot API.

Preserve K001's explicit `Unit` return for named composables. Do not use opaque parameter bags, generic screen base classes, or a single command dispatcher just to reduce the visible parameter count.

## K024 — Effects and observations obey their lifecycle

Use `LaunchedEffect` for composition-owned suspending effects, keyed by the identity that should restart the work. Use `DisposableEffect` for an attach/detach relationship, and `rememberUpdatedState` when the current callback must be observed without restarting an ongoing effect. These tools have different lifecycle behavior. [S15]

Collect screen-facing flows with a lifecycle-aware mechanism such as `collectAsStateWithLifecycle`. Keep service work outside that collector's lifetime. Do not restart playback or reclaim focus every time metadata changes.

`remember` is not durable storage. `rememberSaveable` and saved-state facilities are for appropriate small restorable UI values, not open players, live controllers, or an entire media catalog. Use persistence for actual durable records. [S16]

## K025 — Stability declarations must be truthful

Prefer immutable UI values and predictable updates. Do not mutate an ordinary list in place and expect Compose to observe an arbitrary field change.

`@Immutable` and `@Stable` are promises to the Compose compiler; they do not freeze an object or retrofit correct observation. Do not annotate a mutable graph merely to silence a report or force skipping. [S17]

Use stable identity keys for repeated UI content. Introduce immutable collection libraries or performance-specialized state representations only when the contract or measurements justify them. Do not blanket-whitelist types as stable or memoize every expression without a reason.

## K026 — TV components are the default for TV controls

Use Compose foundations/layout primitives and the TV Material components appropriate to the interface. Inspect imports: TV and mobile Material components can have the same simple names but different behavior and themes. Do not silently mix both theme systems. [S18]

Preserve room-scale legibility, visible focus, and a small number of impactful controls. Custom styling is allowed; replacing the interaction contract is not an automatic consequence of wanting a distinctive look.

Keep user-visible text in Android resources and make controls expose useful accessibility semantics. A custom drawn control must still provide focusability, activation, state, and a meaningful label.

## K027 — Focus is a behavioral contract

Every actionable TV control must be reachable and operable with a remote. Define sensible initial focus, movement between groups, restoration after returning, and fallback when the focused item disappears.

Use default spatial navigation when it works. Add focus groups or explicit direction rules for real layout ambiguity—not an application-wide custom focus engine. Request focus from an appropriate effect or event after the target exists, not unconditionally during composition. [S19]

Do not steal focus when artwork, progress, or network status updates. Preserve stable item identity rather than blindly restoring a stale list index. Test focus visibility and navigation as behavior, not merely as screenshots.

## K028 — Input follows the semantic owner

Use standard activation for focused controls. Treat media Play/Pause commands as media commands and route them through the media session. Intercept raw keys only when default behavior does not implement the required contract.

Consume only an event actually handled. Prevent duplicate action from key-down/key-up, repeat events, or simultaneous handling at child and Activity levels. Back navigation must unwind the current UI consistently; Home/backgrounding is a different platform operation. [S20]

Do not rely on touch, hover, an on-screen keyboard, or a mouse-only affordance for a required TV workflow. A successful phone test does not prove remote navigation is correct.

## K029 — Background playback belongs to a service

For playback that must continue after the Activity is no longer visible, put the player and media session under `MediaSessionService`. The Activity connects with a controller; it does not create a competing player or release the service's player when the screen disappears. [S21]

The service owns creation, player/session teardown, foreground-media behavior, audio-focus integration, retry coordination, and supported media commands. Pair controller/listener lifetime separately on the UI side. Observe the actual player state rather than presenting a command request as confirmed playback.

Keep manifest declarations, foreground-service permissions/types, notification behavior, and platform restrictions aligned with the repository's target SDK. Do not promise unstoppable background execution or treat household sideloading as a reason to ignore platform lifecycle rules.

## K030 — Product capabilities remain product-specific

A radio app does not acquire a queue, Previous/Next, seeking, playlists, or stale-position resumption merely because Media3 can support them. Expose and advertise only the operations the product actually implements.

For example, a live radio client may deliberately offer one Play/Pause control, background playback, and live-target resolution when playback resumes. Its Activity observes a service-owned session. Those are product requirements, not universal rules for every Android TV app.

A future video or on-demand app may legitimately support a different command set. The style rule is truthful capability modeling and explicit ownership, not “all TV apps must behave like this radio.”

## K031 — Organize around features and ownership

Prefer packages such as `playback`, `station`, and `nowplaying`, with the small data, state owner, UI, and adapters that belong together. Do not organize a growing app primarily into global `models`, `managers`, `helpers`, and `utils` silos.

Use PascalCase Kotlin filenames that describe their contents, lowercase package segments, and Android's required resource naming. Keep closely related declarations together; do not impose one tiny declaration per file. Kotlin source filenames need not inherit TypeScript kebab-case or Godot snake_case. [S1]

Keep pure logic independent of Android APIs when the logic has no Android role. Split Gradle modules only for real dependency boundaries, reuse, ownership, or build needs—not a speculative architecture diagram.

## K032 — Boundaries are narrow, visible, and named

Use `private` for implementation details and `internal` for module-contained APIs. Deliberate public entry points should be recognizable; preserve visibility required by framework creation and interoperability. Kotlin defaults to public, and `internal` means module scope, not package scope. [S22]

A read-only query property is valid when it is cheap and unsurprising. Use an explicit method for expensive work, I/O, or a meaningful operation. Mutation with domain rules uses named methods rather than publicly writable fields or surprising setters.

Use explicit imports rather than wildcard imports in owned source. Aliases are acceptable when they resolve a meaningful collision, especially TV/mobile API ambiguity. Do not mistake source visibility for protection of secrets in an APK.

## K033 — Names reveal meaning rather than declaration categories

Use PascalCase for types and named variants, camelCase for ordinary functions/properties, and predicate names for booleans. Use SCREAMING_SNAKE_CASE for true constants and enum entries. Keep acronyms readable, such as `HttpStationSource` and `apiUrl`, while preserving externally prescribed names.

Reserve a leading underscore for a backing-property pair such as `_uiState`/`uiState`; do not mechanically prefix every private member as in GDScript. Choose names describing the implementation difference rather than `I...`, `T...`, or `...Impl`.

Order declarations for a reader: state/dependencies, initialization, lifecycle/public behavior, and nearby helpers. Preserve Kotlin initialization order, keep overloads together, and avoid alphabetic sorting or regions that hide multiple responsibilities.

## K034 — Formatting has one deterministic owner

Use UTF-8, LF, four-space Kotlin indentation, standard braces/spacing, and trailing commas in supported multiline lists. Use a 100-character working line limit, with narrow allowances for unbreakable external literals or tool-owned content. The checked-in formatter configuration is the mechanical authority. [S1]

Use one formatter, not two competing formatting systems. Keep `.editorconfig`, the formatter, and IDE settings aligned. Do not choose a formatter preset that strips explicit types or `Unit`, changes the adopted K002 semantics, or rewrites deliberate framework exceptions without a reviewed configuration.

Comments explain invariants, ownership, units, failure/retry semantics, and reasons for an exception. Do not restate obvious syntax or attach unmaintained speculative architecture notes to every function.

## K035 — Enforce what the tools can prove

Pin the formatter, static-analysis tools, Kotlin compiler, Android tooling, and dependency configuration. Gate formatting, compilation, enabled correctness/house diagnostics, and relevant tests. Tune noisy advisory rules before promoting them; do not leave a growing permanent warning backlog as the normal standard.

Missing annotations and explicit-`Unit` policy may require an AST-aware house rule: the compiler alone does not enforce the whole guide. Android lint and Kotlin static analysis have different responsibilities. Do not claim either proves correct resource ownership, event delivery, focus behavior, or deep immutability.

Scope suppressions to the narrowest justified boundary, record the reason, and remove obsolete suppressions. Exclude generated/vendor code deliberately. Preview/debug convenience must never become the only implementation of release correctness.

## K036 — Test the smallest truthful boundary

Pure Kotlin tests cover validation, time calculations, complete state transformations, result semantics, and command policy. Coroutine tests cover cancellation, retry limits, competing requests, and failure ownership when those behaviors exist.

Use Compose/platform tests for focus, remote activation, Back behavior, state restoration, and lifecycle relationships. Use integration/device tests for the media session and actual background playback. No screenshot-only suite can establish these behavioral contracts.

Test through the intentional API, not by routinely poking private fields. Add regression cases for fixed defects. Keep fakes concrete and behaviorally faithful. Match test naming and APIs to the supported Android runtime; local JVM tests and device tests do not have identical execution constraints.

## K037 — Build evidence is specific

Use the checked-in Gradle wrapper from the Android project directory. A project that declares the corresponding Android tasks may use:

```bash
./gradlew assembleDebug
./gradlew testDebugUnitTest
./gradlew installDebug
```

These illustrate Android project tasks, not commands executed to validate this guide. Verify the actual module, variants, installed tools, and available tasks in the target repository before running them.

Add the selected formatter/static-analysis tasks and appropriate Android lint/release checks when wired into the repository. Name actual tasks rather than copying fictional universal commands.

Report separately: compilation, unit tests, lint, emulator launch, remote interaction, background playback, and physical-device validation. Keep release/shrinking validation distinct from debug builds. A manifest declaration or successful APK build is not evidence that the device behavior works.

## K038 — Agents preserve contracts and report reality

Before editing, read the local project instructions, build files, manifests, owning classes, relevant Compose tree, public data contracts, and tests. Make the smallest coherent change at the real owner.

Do not silently change application IDs, minimum/target SDK, toolchain versions, permissions, exported components, endpoint contracts, persistence schemas, media capabilities, DI infrastructure, or public APIs. A style migration is not permission to redesign the product.

Keep secrets out of source, logs, diagnostics, and shipped configuration. Describe tests that ran and checks that did not. Never label framework examples as compiled or device-verified without that evidence.

## Validation scope

The companion pure Kotlin examples were compiled with warnings treated as errors and executed using Kotlin/JVM 1.9.0 on OpenJDK 21.0.11. An intentionally incomplete sealed-state consumer was rejected by the compiler. This validates those examples under that compiler, not every rule or an Android application. The `StateFlow` property fragment and Android/Compose guidance are not represented as compiled, emulator-tested, or physical-device-verified. Repository-specific toolchains and device behavior require their own checks.

## Sources and reference map

House sources establish the originating preferences. Platform sources explain mechanisms; their default stylistic advice does not overrule an explicit house choice. Project-specific configuration and private decision history are intentionally separate from this reusable guide.

- [H1] [Published TypeScript guide, 1.0.0](https://starter.devthomas.site/style/TypeScript)
- [H2] [Published Godot guide, 1.0.1](https://starter.devthomas.site/style/Godot)
- [S1] [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)
- [S2] [Kotlin properties](https://kotlinlang.org/docs/properties.html)
- [S3] [Kotlin collections overview](https://kotlinlang.org/docs/collections-overview.html)
- [S4] [Kotlin data classes](https://kotlinlang.org/docs/data-classes.html)
- [S5] [Kotlin higher-order functions and lambdas](https://kotlinlang.org/docs/lambdas.html)
- [S6] [Kotlin sealed classes and interfaces](https://kotlinlang.org/docs/sealed-classes.html)
- [S7] [Kotlin null safety](https://kotlinlang.org/docs/null-safety.html)
- [S8] [Kotlin exceptions and preconditions](https://kotlinlang.org/docs/exceptions.html)
- [S9] [Kotlin scope functions](https://kotlinlang.org/docs/scope-functions.html)
- [S10] [Android coroutine best practices](https://developer.android.com/kotlin/coroutines/coroutines-best-practices)
- [S11] [StateFlow API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/)
- [S12] [Android UI events](https://developer.android.com/topic/architecture/ui-layer/events)
- [S13] [Kotlin runCatching API](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin/run-catching.html)
- [S14] [Android architecture recommendations](https://developer.android.com/topic/architecture/recommendations)
- [S15] [Compose side-effects](https://developer.android.com/develop/ui/compose/side-effects)
- [S16] [Compose state](https://developer.android.com/develop/ui/compose/state)
- [S17] [Compose stability](https://developer.android.com/develop/ui/compose/performance/stability/fix)
- [S18] [Compose for TV](https://developer.android.com/training/tv/playback/compose)
- [S19] [Compose focus behavior](https://developer.android.com/develop/ui/compose/touch-input/focus/change-focus-behavior)
- [S20] [TV navigation](https://developer.android.com/training/tv/get-started/navigation)
- [S21] [MediaSessionService background playback](https://developer.android.com/media/media3/session/background-playback)
- [S22] [Kotlin visibility](https://kotlinlang.org/docs/visibility-modifiers.html)
- [S23] [ExoPlayer setup and threading contract](https://developer.android.com/media/media3/exoplayer/hello-world)
