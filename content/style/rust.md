---
id: rust
title: Rust
summary: An explicit Rust house style built around truthful types, owned state, native enums, deliberate failure contracts, and small safety boundaries.
human_summary: Rust makes ownership and borrowing part of the type system; this guide applies the house conventions to values, resources, errors, and concurrent work.
status: stable
updated: "2026-10-22"
accepted_through: RS036
version: 1.0.0
route: /style/Rust
---

# Rust Style Guide

> **Stable 1.0.0 — finished and approved.** All 36 rules, RS001–RS036, are authoritative house conventions. No owner decisions or additional guide-level approval remain.

For agents: read and apply this completed guide when working on Rust. It translates established TypeScript, Godot, and Kotlin conventions into Rust's actual semantics, including the accepted unsafe policy and rationale in RS025. Do not defer its use for further style approval. Preserve the target repository's existing contracts; this guide does not authorize a migration, a toolchain upgrade, or silently weakening a stricter local policy.

## Scope

This guide covers first-party Rust language, data, ownership, resource, and tooling conventions. It applies to libraries, command-line tools, services, and native integrations without requiring a particular application framework, async runtime, error crate, serialization library, or workspace architecture.

The accepted guides establish the preference for explicit contracts, meaningful states, one authoritative writer, and narrow exceptions. React + TypeScript is also an accepted companion guide. The accepted Python, Swift, JavaScript, and Dart guides provide companion ecosystem conventions. The Rust conventions below are accepted as a complete guide. [H1][H2][H3][H4]

Use the language's own mechanisms: ordinary immutable bindings are `let`, values are usually structs and enums, fallible operations return `Result`, and complete enum consumers use exhaustive `match`. The words “must” and “prefer” below describe the accepted house contract, not requirements imposed by every Rust project.

## RS001 — Write explicit, precise contracts

Annotate named fields, ordinary local bindings, parameters, and return types wherever Rust offers a useful position. Include `-> ()` on named procedures and ordinary closure results. Retain native receiver syntax such as `self`, `&self`, and `&mut self`; a redundant receiver annotation adds no contract.

<!-- example: explicit-contracts -->

```rust
fn health_after_hit(health: u32, damage: u32) -> u32 {
    health.saturating_sub(damage)
}

fn reset_attempts(attempts: &mut u32) -> () {
    *attempts = 0;
}
```

Do not widen a meaningful type to `dyn Any`, a trait object, or a generic placeholder to make an annotation easier. Annotate a destructured binding as a whole when that syntax permits it. Match arms and `for` patterns derive their binding types from the typed value; do not manufacture predeclarations or illegal inline annotations.

Anonymous closure types, opaque future types, and iterator types containing anonymous closures are legitimate inference exceptions. Keep their inputs and outputs explicit where expressible. Do not box, allocate, or change dispatch merely to name a local. Generic call-site inference and unambiguous lifetime elision remain valid. This explicit-unit choice follows accepted Kotlin K001; configure conflicting lint advice accordingly. [H1:D001/D015][H3:K001/K004][R1][R2]

## RS002 — Use native binding and borrowing semantics

Use `let` by default and `let mut` when the binding or an owned value needs mutation through that binding. Rust `const` defines a compile-time constant; it is not the replacement for an ordinary stable local.

<!-- example: owned-construction -->

```rust
fn initial_labels(is_live: bool) -> Vec<String> {
    let mut labels: Vec<String> = vec![String::from("Library")];
    if is_live {
        labels.push(String::from("Live"));
    }
    labels
}
```

A non-`mut` binding may hold a mutable reference or a handle with interior mutability. Do not add unused `mut` as a symbolic warning label. The reference type, container, API, and owner communicate that authority. A `&mut T` grants exclusive access for its borrow; the variable holding it need not itself be reassignable to use that access.

Do not transplant TypeScript's stronger `const`/`let` convention into Rust. Accepted Kotlin K002 already separates native binding semantics from the deeper ownership contract. [H3:K002][R3][R4]

## RS003 — Make snapshot and shared-state claims truthful

Ordinary configuration, state variants, and snapshots should contain values whose reachable data obeys the intended snapshot contract. An immutable binding or a shared reference does not prove an entire graph is frozen. `Cell`, `RefCell`, atomics, locks, and handles to externally changing resources have real mutation semantics.

An owned `Vec<T>` is a useful independent collection when its elements are independent values. A clone of `Vec<Arc<Mutex<T>>>` still shares the mutable objects. `Arc<T>` can share an immutable value when `T` and its reachable graph actually have that contract; the wrapper alone proves neither mutability nor immutability.

Keep interior mutability out of objects described as immutable snapshots unless the exception is explicitly part of the contract. Use a deliberate borrow, ownership transfer, or meaningful copy at the boundary. Do not create a universal deep-clone or freeze framework. [H3:K002/K003][R4][R5][R32]

## RS004 — Structs and inherent methods are native value tools

Use `struct` for named records and `enum` for alternatives. A Rust struct is not a TypeScript behavioral class. An `impl` block containing a constructor, validator, query, or transformation does not require a continuing-resource justification.

Use an owning struct for a live connection, recorder, file writer, or other resource when its state and lifetime need an owner. Keep those fields private when their mutation has rules. A data value and a live resource may both use `struct`; their contracts distinguish them.

Keep standalone transformations as functions when that is the clearer relationship. Do not manufacture `Manager`, `Helper`, or `Service` structs solely to group free functions, and do not split a coherent value's behavior away merely to imitate another language. [H1:D020][H3:K005][R6]

## RS005 — Give closed states named enum variants

Model coordinated state as an enum with named alternatives, not independent flags and optional fields that permit contradictory combinations. Native variant identity replaces a redundant in-memory `kind` property.

<!-- example: playback-state -->

```rust
enum PlaybackState {
    Connecting,
    Playing { track_title: String },
    Paused { track_title: String },
    Unavailable { reason: UnavailableReason },
}

enum UnavailableReason {
    Offline,
    InvalidFeed,
}
```

Named-field enum payloads already give each alternative a meaningful identity. Introduce a separate payload struct when it has an independent contract, useful reuse, or operations of its own, not just to add another wrapper. Use a fieldless enum for a closed scalar choice. Keep an independent boolean when the domain really is a single two-valued property.

Serialized tags and external codes remain deliberate wire contracts. Do not persist an enum's incidental ordinal or assume renaming a variant leaves an external representation unchanged. [H1:D004/D006][H3:K006/K008][R7]

## RS006 — Complete consumers must remain exhaustive

Handle every variant of an owned closed enum in a complete consumer. Do not add `_ => ...`, `unreachable!()`, or an `assertNever` imitation that hides a newly added case from the compiler.

<!-- example: exhaustive-state -->

```rust
enum RunState {
    Queued,
    Running,
    Finished,
}

fn run_label(state: &RunState) -> &'static str {
    match state {
        RunState::Queued => "Queued",
        RunState::Running => "Running",
        RunState::Finished => "Finished",
    }
}
```

Use `if let`, `let ... else`, or `matches!` for deliberately partial handling. A wildcard required by another crate's `#[non_exhaustive]` API is a different boundary: define what an unknown future alternative means. A guard does not necessarily provide exhaustive coverage. Untrusted strings and bytes do not become closed enums until they are actually parsed. [H3:K007][R7][R8]

## RS007 — Distinguish absence, alternatives, and failure

Use `Option<T>` for an ordinary missing value. Use a named enum when alternatives carry meaningful domain outcomes, and `Result<T, E>` when an operation can fail to produce its promised result. Propagate appropriate failures with `?`.

<!-- example: parsed-retry-limit -->

```rust
#[derive(Debug, PartialEq, Eq)]
enum RetryLimitError {
    InvalidInteger,
    TooLarge { maximum: u32 },
}

fn parse_retry_limit(raw: &str) -> Result<u32, RetryLimitError> {
    let limit: u32 =
        raw.parse::<u32>()
            .map_err(|_error: std::num::ParseIntError| -> RetryLimitError {
                RetryLimitError::InvalidInteger
            })?;

    if limit > 10 {
        return Err(RetryLimitError::TooLarge { maximum: 10 });
    }

    Ok(limit)
}
```

A successful operation can itself have alternatives, so `Result<JoinOutcome, TransportError>` can be truthful. Do not require every small miss to become a custom result enum. Conversely, do not use `None`, an empty collection, or a success-shaped value to conceal a failed operation. `Result` is Rust's ordinary recoverable-error mechanism; an exception-oriented source guide is not permission to use panics instead. [H1:D021][H3:K009/K012][R9]

## RS008 — Custom scalars must earn their boundary

Do not introduce `type PlayerId = String` or `struct PlayerId(String)` solely to rename an unrestricted string or make it appear validated. A custom scalar should establish a real allowed-value restriction, unit contract, validated invariant, or necessary integration/trait boundary.

<!-- example: validated-title -->

```rust
#[derive(Debug, PartialEq, Eq)]
struct NonBlankTitle(String);

#[derive(Debug, PartialEq, Eq)]
struct BlankTitle;

impl NonBlankTitle {
    fn parse(value: String) -> Result<Self, BlankTitle> {
        if value.trim().is_empty() {
            return Err(BlankTitle);
        }

        Ok(Self(value))
    }

    fn as_str(&self) -> &str {
        self.0.as_str()
    }
}
```

Place invariant-bearing types behind the appropriate module boundary. Private fields can still be accessed from their defining module and its descendants; review those construction paths too. Do not expose a mutable dereference or a derived deserializer that bypasses the promised check. A native type such as `NonZeroU32`, `Duration`, or `PathBuf` may already express the useful contract. None proves existence, authorization, or every business constraint. [H1:D010/D011][H3:K008/K011][R10][R15]

## RS009 — Validate the real input boundary

Receive bytes, text, a structured wire value, or a genuinely validated DTO according to what the boundary actually supplies. Do not route already typed data through `Any` or a general JSON tree merely to imitate TypeScript's `unknown`.

Decoding can establish shape and primitive types; it does not automatically establish acceptable ranges, safe resource limits, schema versions, permitted paths, authorization, or relationships between fields. Validate these before granting the value domain authority. Keep coercion, unknown fields, missing values, and explicit null behavior deliberate.

Preserve external spelling and discriminators before normalizing. For example, a decoder that maps both missing and null to `None` is unsuitable when their distinction matters. Keep raw pointers and foreign data in their own adapter. Revalidate when trust changes, not redundantly at every internal function. [H1:D011–D013][H3:K011]

## RS010 — Functions and closures show their behavior contracts

Use named `fn` items or meaningful inherent methods for reusable operations. Use closures for behavior supplied locally, with explicit parameters and result types where the types are expressible. A closure with an explicit result type uses a block body; preserve that required syntax even for one expression.

<!-- example: typed-closure -->

```rust
fn prefixed_labels(labels: &[String], prefix: &str) -> Vec<String> {
    let decorate = |label: &String| -> String { format!("{prefix}{label}") };
    labels.iter().map(decorate).collect()
}
```

The local closure's concrete type cannot be written; its visible input and output contract can. A plain `fn(...) -> ...` pointer is suitable when a function pointer is genuinely the required representation, not as a way to erase capturing behavior. Choose `Fn`, `FnMut`, or `FnOnce` bounds according to how the receiving operation calls the behavior. `move` controls capture ownership; it does not by itself mean the closure can only be called once.

Use a tail expression for a clear result and early `return` for an actual branch or guard. Do not force nested combinators where straightforward control flow is easier to follow. [H1:D014/D015][H3:K004/K014][R1][R2]

## RS011 — Borrow for access and own for retention

Take `&T` for temporary shared access, `&mut T` for deliberate exclusive mutation, and `T` when ownership transfer is part of the contract. Prefer `&str`, `&[T]`, and `&Path` over references to their owning containers when only a borrowed view is needed.

<!-- example: borrowed-query -->

```rust
fn first_label(labels: &[String]) -> Option<&str> {
    labels
        .first()
        .map(|label: &String| -> &str { label.as_str() })
}
```

Do not borrow everything reflexively. A value retained by an owner may correctly need `String`, `Vec<T>`, or another owned representation. An owned input lets a transformation reuse storage without cloning while still producing a replacement value for its caller.

Use lifetime elision where Rust already expresses an unambiguous relationship. Name lifetimes when a signature must distinguish relationships. Do not add `'static`, leak memory, or manufacture a clone to conceal a misunderstood lifetime. Prefer ownership over infecting a long-lived model with unnecessary borrow parameters. [H3:K003/K015/K021][R4][R11]

## RS012 — Copies and clones have explicit meanings

Move a value when the caller is finished with it. Borrow it when access is temporary. Clone it when a second owned value or handle is actually wanted. Do not add `.clone()` across a call chain merely to silence the borrow checker.

`Copy` promises implicit copying is valid; reserve it for values where that is the intended API. Do not add it to a resource owner or treat a public `Copy` implementation as inconsequential. `Clone` may allocate, perform type-specific work, or share an underlying resource. It is not a generic deep-copy guarantee.

Use `Arc::clone(&handle)` or `Rc::clone(&handle)` when that makes shared ownership explicit. Measure copying costs where they matter, but do not turn a small, clear value copy into an elaborate lifetime abstraction without evidence. [H3:K003/K013][R5][R12]

## RS013 — Traits, generics, and dynamic dispatch must serve real variation

Use traits for supported behavioral substitution or a meaningful native protocol such as `Display`, `TryFrom`, `Iterator`, or `Drop`. Do not create a trait for every struct. A concrete platform adapter or faithful test implementation can justify a seam.

Introduce first-party type parameters for actual supported variation and useful relationships. Standard containers and required callback/iterator contracts do not need a contrived second use. An `impl Trait` parameter is still a generic contract; a return-position `impl Trait` hides one concrete implementation type, not arbitrary runtime alternatives.

Choose `dyn Trait` when runtime heterogeneity, a runtime-selected implementation, or an owned capability boundary requires dynamic dispatch. A Rust trait object is not a stable C ABI. Do not use `Box<dyn ...>` simply to avoid writing or understanding a concrete type. Conversely, do not force static dispatch through an unnecessarily generic application. [H1:D005/D019][H3:K013][R13]

## RS014 — Use collections and iteration for the actual operation

Use typed standard collections before introducing a custom container. Choose `iter`, `iter_mut`, and `into_iter` deliberately: shared borrowing, mutable borrowing, and consumption are different contracts. Iterator adaptors are lazy until consumed.

Use short `map`, `filter`, and collection pipelines for clear transformations. Use a loop for substantial branching, ordered effects, or evolving local state. Do not use `map` only for side effects, force complex state into `fold`, or collect a temporary vector that has no useful role.

Use checked access such as `get` when an index can be absent. Direct indexing requires a locally established bound; a comment claiming “cannot fail” does not establish it. A `HashMap` has no stable iteration-order promise, so sort or choose an ordered representation when output order is part of the contract. [H1:D003/D014][H3:K014][R14]

## RS015 — Numbers, units, and conversions are deliberate

Choose integer widths and signedness according to the domain or external format. Use `usize` for native indexing and sizes when appropriate, not as an assumed portable wire integer. Use `Duration`, `Instant`, and typed domain units where they carry the actual contract.

Use `From`/`Into` for supported infallible conversions and `TryFrom`/`TryInto` for conversions that may reject a value. Do not use `as` to silence a narrowing, sign, or precision disagreement. An intentional low-level cast must have established bounds and an understandable reason.

Select checked, saturating, wrapping, or ordinary arithmetic according to the meaning of overflow. Saturating health at zero can be a domain rule; silently wrapping a file length is not. Do not rely on differing debug/release overflow behavior. Validate floating-point finiteness and ranges when the domain requires them. [H1:D010/D021][H3:K011/K012][R10][R16]

## RS016 — Preserve useful error identity and context

Use a concrete error enum or struct when callers need to inspect failure kinds or data. Preserve the underlying cause where it helps diagnosis; add safe context at the boundary that knows what operation failed. Converting every error to a string destroys machine-readable distinctions.

At an application reporting boundary, an error-erasing container may be appropriate when the only remaining behavior is reporting, termination, or forwarding an opaque failure. Do not spread `Box<dyn Error>` or an application-reporting crate through a domain that needs typed recovery. A library's intentional public error policy is an API decision, not a universal requirement for one representation.

Do not choose an error crate merely because a guide exists. Return a failure to the responsible caller; logging it and returning success is not recovery. Avoid logging the same failure at every layer or embedding secrets and private payloads in diagnostic context. [H1:D021][H3:K012/K038][R9]

## RS017 — Panics are not ordinary error handling

Do not use `unwrap()`, `expect()`, `panic!()`, or `unreachable!()` for normal absence, invalid user/configuration data, failed I/O, or a recoverable domain outcome. Use `Option`, `Result`, or a deliberate domain alternative.

A narrow `expect` can express an already established internal invariant when violation is a programming defect and a panic is the chosen consequence. Its message explains why the value must be present, not merely “failed.” Prefer a representation that removes the impossible case when that is practical. A test may use a clear expectation to establish its fixture.

`assert!` checks an asserted condition in normal release builds; `debug_assert!` may be disabled. Neither should replace boundary validation or contain required side effects. A panic strategy, panic isolation boundary, and process termination policy belong to the project. Do not claim a `Result` return makes all panics impossible, or that catching a panic restores arbitrary corrupted state. [H3:K009/K012][R9][R17]

## RS018 — Canonical state has one authoritative writer

Keep canonical mutable state behind its owner. Expose named commands for changes with validation, persistence, notifications, or temporal rules, and deliberate queries or snapshots for reading. A coordinator orchestrates owners without creating a second truth.

<!-- example: state-owner -->

```rust
#[derive(Debug, PartialEq, Eq)]
struct TakeLimitReached;

struct Recorder {
    completed_takes: u32,
}

impl Recorder {
    fn new() -> Self {
        Self { completed_takes: 0 }
    }

    fn completed_takes(&self) -> u32 {
        self.completed_takes
    }

    fn record_completed_take(&mut self) -> Result<(), TakeLimitReached> {
        let next: u32 = self
            .completed_takes
            .checked_add(1)
            .ok_or(TakeLimitReached)?;
        self.completed_takes = next;
        Ok(())
    }
}
```

The example shows one state transition, not an audio recording implementation. A setter-shaped method that permits arbitrary invalid changes is not ownership merely because the field is private. Keep derived state derived unless a cache has a purpose and a clear invalidation owner. `&mut self` expresses exclusive access; a mutex provides synchronization, not an automatic domain ownership design. [H2:G012][H3:K015]

## RS019 — Resources have owners and explicit completion

Use RAII and `Drop` for appropriate scope-bound cleanup. Let resource ownership determine teardown, and preserve the intended order when resources depend on one another. Do not keep unused handles alive solely because it is easier than finding their owner.

When flush, commit, close, or shutdown can fail and the outcome matters, expose an explicit operation returning `Result`. A destructor cannot report an ordinary error to its caller or be assumed to await asynchronous work. Best-effort cleanup during drop does not prove a recording was saved or a transaction committed.

Do not promise that destructors always run: process exit, aborts, leaked values, and reference cycles can prevent the expected cleanup. Avoid panicking from cleanup. Distinguish releasing a local handle from confirming a remote effect or stopping independently running work. [H2:G015][H3:K021][R18][R33]

## RS020 — Shared ownership is a deliberate capability

Use `Box` for single ownership with indirection when useful, `Rc` for deliberate single-thread shared ownership, and `Arc` for shared ownership whose thread-safety contract supports the use. Do not wrap every object in `Arc<Mutex<_>>` by default.

Cloning an `Arc` shares its allocation. `Arc<T>` does not make an arbitrary `T` thread-safe; its `Send` and `Sync` behavior depends on the contained type. Respect those bounds and the real platform affinity of handles. An immutable reference or `&self` method can still expose interior mutation or external effects.

Use `Weak` where a back-reference must not retain the owner, and define what happens when the owner is gone. Do not add manual `Send`/`Sync` implementations or global mutable state to make an inconvenient compiler error disappear. [H3:K015/K021][R5][R19]

## RS021 — Work has a completion and shutdown owner

Every thread, background task, queue consumer, or retry loop needs an owner for completion, failure, cancellation, and shutdown. Use scoped threads when work borrows data and must finish within a scope. Join or await required work; do not report completion because a task was merely started.

Start independent operations together when concurrency serves the requirement. Preserve sequential order when operations depend on each other. Bound parallelism, retries, queues, and resource consumption rather than starting one unbounded task for every item.

A detached task is an explicit product/architecture choice with supervision and a lifetime contract. Dropping a handle may detach work rather than stop it. Consult the actual runtime or thread API; the word “cancel” does not establish which effects stopped or which failures were observed. [H1:D022][H3:K018–K020][R20][R21][R34]

## RS022 — Async contracts describe actual execution

Use synchronous Rust when it meets the requirement. Add an async runtime for real asynchronous I/O or concurrency needs, not as a mandatory language layer. An `async fn` declares the value produced when awaited, such as `Result<Report, Error>`; it does not manually wrap that result in a second future.

An async signature does not make blocking I/O or CPU-heavy work nonblocking. Use the selected runtime's appropriate blocking facilities or a deliberately owned worker. Track that work's termination semantics too: stopping an async waiter may not stop a blocking operation already underway.

Define cancellation at each suspension point when partial state or external effects matter. Dropping an ordinary future stops polling that future; it does not roll back requests, undo files already written, or automatically stop spawned child tasks. Timed out means the caller stopped waiting unless stronger behavior is actually established. [H3:K018–K021][R20][R21][R34][R35]

## RS023 — Synchronization preserves semantic ownership

Keep lock scopes short and visible. Do not hold a blocking lock across `.await`. If an async lock must span a suspension, make that necessary lifetime explicit and review deadlock, cancellation, and contention. Do not assume an async mutex makes a poorly defined critical section safe.

Choose a recovery policy for poisoned locks where the lock implementation supports poisoning. Do not automatically unwrap a poisoned result or discard its state warning without understanding the protected invariant.

Use channels when message passing expresses the ownership relationship. Specify capacity, backpressure, ordering, closure, retries, and acknowledgements according to the API. Current state, transient events, and commands are distinct contracts; a channel alone does not guarantee an effect happened exactly once. Atomics also need a valid synchronization design and memory ordering, not just freedom from one data race. [H3:K015/K016/K020][R22]

## RS024 — Dependencies enter through clear composition boundaries

Supply collaborators through constructors or function parameters at a meaningful composition boundary. A small program can assemble concrete values directly. Use a function argument for a single capability when it conveys the contract more clearly than a new trait hierarchy.

Keep filesystem, clock, process, network, and provider access visible where they affect behavior. Avoid global service locators, hidden connections in cheap-looking queries, and speculative dependency-injection frameworks.

A command-line entry point may be thin while a library module owns reusable behavior, but do not create a workspace or library crate merely to satisfy a diagram. Separate pure logic from integration only where the boundary actually helps ownership, reuse, or testing. [H3:K013/K017/K031]

## RS025 — Allow justified unsafe at explicit systems boundaries

Use safe Rust for ordinary first-party logic. Never reach for `unsafe`, `transmute`, unchecked indexing, or invented lifetimes to silence a borrow checker or type mismatch. A compiler inconvenience is not a demonstrated unsafe requirement.

**Accepted RS-Q01 B — 2026-10-22.** Permit necessary FFI/platform adapters and narrowly contained first-party systems or performance implementations when a demonstrated requirement is not met by a reasonable safe design.

<!-- DECISION:RS-Q01:START -->

**Why this exception is intentional.** These conventions also serve native integrations, emulator and game tooling, hardware access, and audio/media systems. Such work can require operations whose safety conditions the compiler cannot establish, or a concrete latency, throughput, or memory requirement that reasonable safe implementations do not meet. Restricting unsafe by its location alone can move the same obligations into another language or a dependency without resolving them. B makes a justified first-party implementation eligible so those obligations can remain local, visible, and owned in Rust. The decision still accounts for safe library options, maintenance cost, and evidence.

The usual strictness still governs evidence, types, ownership, and review. Use compiler-checked safe code wherever it meets the requirement. At the exceptional boundary, document and uphold the safety conditions the compiler cannot establish. `unsafe` is not inherently faster and does not relax Rust's validity, aliasing, lifetime, or concurrency requirements. A performance justification needs representative measurements; an integration or hardware justification needs the actual API, memory, or platform constraint. Speculative speedups and borrow-checker workarounds do not qualify. [R23][R36][R37]

Record the requirement, reasonable safe alternatives considered, chosen boundary, safety invariants, and relevant verification in the owning repository's decision record. Prefer a maintained safe API when it meets the need. Keep the unsafe implementation small and expose a safe API only when its guarantees are established for every safe caller. Apply RS026 to the implementation and caller contracts. Existing stricter repository policies remain effective until an authorized project change updates them.

<!-- DECISION:RS-Q01:END -->

Ordinary application and domain logic stays safe. This accepted exception requires a demonstrated need and an accountable implementation boundary. Dependency implementations are a separate audit surface; a first-party lint setting does not prove a dependency graph contains no unsafe. [H1:D013][H3:K011/K035][R23]

## RS026 — Unsafe and FFI boundaries must establish their guarantees

Where an existing project decision permits unsafe, keep each unsafe operation in a minimal block with a concrete safety explanation: validity, alignment, initialization, aliasing, lifetime, thread rules, and ownership as relevant. An `unsafe fn` does not eliminate the need to identify its unsafe operations or document callers' obligations.

Expose a safe wrapper only when it establishes all requirements for every safe caller. Use an unsafe public API with a precise `# Safety` contract when unavoidable obligations remain with the caller. A comment is a review aid, not proof by itself.

For foreign calls, preserve the actual ABI, layout, string representation, allocator ownership, callback lifetime, and unwinding contract. Do not pass ordinary Rust enums, trait objects, `String`, or `Vec` across an ABI that does not define them. `repr(C)` controls relevant layout; it does not validate pointers or make arbitrary data sound.

Do not allow panic/unwind to cross an incompatible boundary. Miri, sanitizers, fuzzing, and target integration tests can expose defects in supported configurations; none is a universal proof of soundness. [R23][R24]

## RS027 — Derives and macros must preserve the actual contract

Use standard derives when their generated behavior matches the type. Check whether `Clone` shares handles, `Copy` makes implicit copies part of the API, `Default` invents an invalid state, `Debug` exposes secrets, or a serialization derive bypasses validation.

Use established macros for their intended language/framework roles. Introduce a first-party macro only for real syntax-level repetition or a capability ordinary functions, traits, and generics cannot express cleanly. Do not create a private DSL merely to hide control flow or avoid readable types.

Generated code belongs to an explicit boundary. Review the relevant expansion or documented generated contract when safety, visibility, serialization, or lifecycle behavior depends on it. Do not treat macro use as automatic approval of the generated semantics. [H3:K004/K014/K035][R25]

## RS028 — Visibility and imports expose intentional APIs

Keep implementation details private by default. Use `pub(crate)`, a narrower scoped visibility, or `pub` according to the audience that actually needs the item. Do not expose mutable fields or re-export every internal type to avoid designing a small API.

Prefer explicit imports in owned source. A bounded prelude or test-module import can be a justified local convenience; do not normalize wildcard imports throughout business logic. Use aliases to resolve a meaningful naming collision, not to conceal a dependency's identity.

Keep public re-exports deliberate. Source visibility is a maintenance and correctness boundary, not secrecy or authorization. Preserve externally mandated exports and linkage at their actual integration boundary. [H3:K032][R15]

## RS029 — Organize modules around features and owners

Keep a feature's data, operations, adapters, and focused tests near one another. Avoid global `helpers`, `managers`, and `utils` buckets as the primary structure. Split modules or crates when responsibilities, dependency direction, reuse, ownership, or build requirements justify the boundary.

Use Rust's native `snake_case` module and source-file names. Follow the repository's established module layout; do not churn `foo.rs` into `foo/mod.rs`, or the reverse, for stylistic novelty. Keep closely related small declarations together instead of imposing one type per file.

Separate the public contract from private implementation without generating a trait, façade, and forwarding layer for every operation. A workspace is a useful Cargo tool, not a required architecture for every application. [H2:G022][H3:K031][R26]

## RS030 — Names and comments explain meaning

Use `UpperCamelCase` for types, traits, and variants; `snake_case` for functions, methods, modules, fields, and locals; and `SCREAMING_SNAKE_CASE` for constants and statics. Keep acronyms readable, such as `HttpSource` and `api_url`. Preserve required external names at the boundary.

Choose semantic operations and predicates: `finish_recording`, `is_ready`, `has_pending_work`. Avoid declaration-category prefixes and vague `Impl` names. A leading underscore means intentionally unused or another specific native purpose, not a mechanical prefix for every private field.

Document invariants, ownership transfer, units, failure semantics, side effects, and safety obligations. Public APIs need the relevant examples and error/panic contracts. Comments should explain a reason or non-obvious constraint, not paraphrase syntax or preserve a speculative architecture plan. [H1:D024][H3:K033/K034][R27]

## RS031 — Formatting has one deterministic owner

Use the pinned toolchain's `rustfmt`, UTF-8, LF, native four-space indentation, and a 100-column working width. Let the formatter own braces, spacing, and line wrapping. Keep exceptional unbreakable literals or generated content scoped to their actual need.

Record the language edition and formatting style edition supported by the repository's toolchain. A formatter style edition and a language edition have distinct jobs. Do not silently raise either while changing unrelated code, and avoid unstable formatter options unless the project intentionally owns that dependency.

Do not run competing formatters or manually fight deterministic output. Formatting is not permission to remove source contracts, introduce type erasure, or rewrite ownership. Align editor settings with the checked-in configuration. [H3:K034][R28]

## RS032 — Toolchain and compatibility are repository contracts

Record the Rust compiler/toolchain, Cargo configuration, edition, supported targets, formatter, lint tools, and minimum supported Rust version when compatibility is promised. Pin the reproducible development/CI toolchain with an intentional update process; a floating `stable` label alone is not an exact version record.

`rust-version` communicates a minimum toolchain expectation; it does not prove that every dependency, target, or feature combination works on that version. Test the supported baseline where the project makes that promise. A library's compatibility policy and an application's deployment toolchain can legitimately differ.

Prefer stable language features. Nightly features, `no_std`, WASM, embedded, native desktop, and cross-compilation requirements belong to the actual repository. This reusable guide imposes no global Rust version, async runtime, target triple, or silent edition migration. [H3:K035/K038][R29]

## RS033 — Dependencies and features are deliberate

Use the standard library where it meets the need, and adopt a crate when its maintained capability earns the dependency. Keep versions, enabled features, native system requirements, and build scripts reviewable. Avoid installing a broad framework for a small helper or copying an unsafe implementation merely to avoid a justified dependency.

Commit the lockfile for a reproducible application or workspace and use locked resolution in the verification workflow where appropriate. A library repository can also retain a lockfile for its own development; downstream dependents resolve their own graph. Do not describe a checked-in library lockfile as pinning every consumer.

Test supported feature combinations. `--all-features` is not a universal substitute for a compatibility matrix, particularly when features are intentionally incompatible or need different platforms. A dependency or feature update must preserve the declared API, licensing, target, and compatibility constraints. [H3:K035/K038][R29][R30]

## RS034 — Gate useful checks without erasing house rules

Gate formatting, compilation, enabled correctness/house diagnostics, and relevant tests. Use the compiler and Clippy for what they actually enforce; neither checks the entire architecture or all missing local annotations. Do not mechanically enable every restriction lint or keep a permanent backlog of ignored warnings.

Treat unused must-use results as defects unless the result is explicitly handled or deliberately discarded with a clear reason. Deny unsafe operations implicitly performed inside unsafe functions, and configure unsafe-code policy at the appropriate crate/module boundary. Use `forbid(unsafe_code)` only for a crate that permits no local exception; `deny` allows explicitly scoped exceptions. These lints do not inspect dependency source transitively.

Clippy's `unused_unit` advice conflicts with RS001. Disable that specific advice for the explicit `-> ()` house contract rather than deleting the contract or broadly allowing Clippy warnings. Other suppressions must be narrow, explained, and removed when obsolete. Generated and vendored code are explicit exceptions, not a reason to exempt the domain.

Run checks for the actual workspace, targets, and supported features. The command being green is evidence for that command and configuration, not proof of deep immutability, sound unsafe code, correct shutdown, or deployed behavior. [H1:D025][H3:K035/K037][R31]

## RS035 — Test the smallest truthful boundary

Test parsers and invariant constructors with acceptance, rejection, and boundary cases. Test state transitions without a UI, and actual adapters where filesystem, process, network, audio, FFI, or runtime behavior matters. Use deterministic capabilities where they preserve the contract faithfully.

For a public type promise that matters, include a focused compile-fail case where useful: an unhandled enum variant, invalid borrow, or bypassed constructor should fail for the intended reason. Do not confuse an arbitrary compilation failure with proof of the desired guarantee.

Test cancellation, partial failure, bounded retries, and shutdown when those are supported behaviors. Use Miri/fuzzing/sanitizers for a concrete risk and supported target, not as an automatic checklist or substitute for review. Performance claims require representative measurements. A pure Rust snippet test does not certify hardware, a platform integration, or an unsafe abstraction. [H2:G023][H3:K036][R24]

## RS036 — Agents preserve contracts and report what ran

Before editing, read local instructions, Cargo manifests, toolchain files, feature flags, owning modules, public types, and relevant tests. Make the smallest coherent change at the real owner. Do not add cloning, dynamic dispatch, shared mutable state, unsafe code, or extra abstraction simply to make an inconvenient error disappear.

Do not silently change crate APIs, wire formats, stored data, dependencies, edition/MSRV, target support, panic behavior, capabilities, or the unsafe policy. A style task is not permission to redesign the product. Keep machine-readable stdout clean where a CLI promises structured output; diagnostics and exit status must describe the actual result.

Report formatting, compilation, static checks, unit tests, integration tests, benchmarks, and device/deployment evidence separately. Keep secrets and private payloads out of source and diagnostics. Mark unexecuted checks honestly. [H3:K037/K038]

## Authority and application

This is the finished, owner-approved Rust 1.0.0 house guide. RS001–RS036 are accepted, including RS-Q01 B and its rationale and conditions in RS025. No further style decisions or guide-level approval are required before agents read and apply it. Future additions can be proposed as later revisions; they do not make this accepted version provisional.

Runtime selection, crate choices, toolchain versions, feature matrices, and target platforms remain repository decisions. Applying this guide does not itself migrate an implementation repository or change an existing project's stricter restrictions. Source merge and website deployment are separate delivery steps, not conditions on the guide's accepted status.

## Validation scope

On 2026-10-22, all nine Rust code fences were compiled independently with `rustc 1.90.0` using edition 2024 and warnings treated as errors. Twelve focused executable tests passed, covering normal results, rejected input, absence, immutable inputs, and the state owner's overflow behavior. Adding an unhandled variant to the complete state-consumer example produced the intended `E0004` exhaustiveness error.

The fences passed `rustfmt 1.8.0` with style edition 2024 and a 100-column width, and Clippy 0.1.90 with warnings treated as errors. The audit allowed `clippy::unused_unit` specifically for RS001 and unused declarations specifically because these are standalone guide fragments. No broader lint allowance was needed.

The publication checks separately verify metadata, rule IDs, the human page, raw Markdown/JSON parity, and discovery links. Those checks alone do not compile Rust. The example checks establish behavior in the stated configuration; they do not establish a global MSRV or certify every prose rule, an async runtime, FFI soundness, hardware, or an application's release readiness. All examples in this guide use safe Rust.

## Sources and reference map

House sources establish the originating preferences. Rust's documentation establishes language and tool behavior; ecosystem style defaults do not overrule an explicit house choice. The `H1:D001` form identifies a rule in the linked house guide, not a separate owner vote for Rust.

- [H1] [TypeScript house guide](https://starter.uppercut-labs.com/style/TypeScript)
- [H2] [Godot house guide](https://starter.uppercut-labs.com/style/Godot)
- [H3] [Kotlin house guide](https://starter.uppercut-labs.com/style/Kotlin)
- [H4] [Existing and developing style guides](https://starter.uppercut-labs.com/style)
- [R1] [Rust Reference: closure expressions](https://doc.rust-lang.org/reference/expressions/closure-expr.html)
- [R2] [Rust Reference: closure types](https://doc.rust-lang.org/reference/types/closure.html)
- [R3] [Rust Book: variables and mutability](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html)
- [R4] [Rust Book: references and borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)
- [R5] [Standard library: Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html)
- [R6] [Rust Book: method syntax](https://doc.rust-lang.org/book/ch05-03-method-syntax.html)
- [R7] [Rust Book: enums and pattern matching](https://doc.rust-lang.org/book/ch06-00-enums.html)
- [R8] [Rust Reference: non-exhaustive types](https://doc.rust-lang.org/reference/attributes/type_system.html)
- [R9] [Rust Book: error handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html)
- [R10] [Standard library: conversion traits](https://doc.rust-lang.org/std/convert/index.html)
- [R11] [Rust Reference: lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html)
- [R12] [Standard library: Clone](https://doc.rust-lang.org/std/clone/trait.Clone.html)
- [R13] [Rust Reference: impl Trait](https://doc.rust-lang.org/reference/types/impl-trait.html)
- [R14] [Standard library: iterators](https://doc.rust-lang.org/std/iter/index.html)
- [R15] [Rust Reference: visibility and privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html)
- [R16] [Rust Reference: numeric casts and operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html)
- [R17] [Rust Book: choosing when to panic](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)
- [R18] [Standard library: Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html)
- [R19] [Rust Book: Send and Sync](https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html)
- [R20] [Rust Book: futures and async](https://doc.rust-lang.org/book/ch17-00-async-await.html)
- [R21] [Tokio tutorial: spawning and task ownership](https://tokio.rs/tokio/tutorial/spawning)
- [R22] [Standard library: synchronization](https://doc.rust-lang.org/std/sync/index.html)
- [R23] [Rust Book: unsafe Rust](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html)
- [R24] [Miri: supported checks and limitations](https://github.com/rust-lang/miri)
- [R25] [Rust Book: derivable traits](https://doc.rust-lang.org/book/appendix-03-derivable-traits.html)
- [R26] [Rust Book: packages, crates, and modules](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html)
- [R27] [Rust API Guidelines: naming](https://rust-lang.github.io/api-guidelines/naming.html)
- [R28] [Rustfmt configuration](https://rust-lang.github.io/rustfmt/)
- [R29] [Cargo Book: manifest fields and lints](https://doc.rust-lang.org/cargo/reference/manifest.html)
- [R30] [Cargo Book: Cargo.toml and Cargo.lock](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html)
- [R31] [Clippy lint reference](https://rust-lang.github.io/rust-clippy/stable/index.html)
- [R32] [Standard library: UnsafeCell](https://doc.rust-lang.org/std/cell/struct.UnsafeCell.html)
- [R33] [Standard library: destructor omissions and forget](https://doc.rust-lang.org/std/mem/fn.forget.html)
- [R34] [Tokio: task JoinHandle](https://docs.rs/tokio/latest/tokio/task/struct.JoinHandle.html)
- [R35] [Tokio: blocking task cancellation](https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html)
- [R36] [Rust Reference: unsafe proof obligations](https://doc.rust-lang.org/reference/unsafe-keyword.html)
- [R37] [Rust Reference: undefined behavior and soundness](https://doc.rust-lang.org/reference/behavior-considered-undefined.html)
