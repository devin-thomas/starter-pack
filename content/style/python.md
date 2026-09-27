---
id: python
title: Python
summary: A typed Python house style for applications, services, automation, and AI tooling, built around explicit contracts, named values, and controlled boundaries.
human_summary: Python is dynamic at runtime; this guide adds source-visible typing, owned data models, deliberate error semantics, and boundary validation without forcing one framework.
status: in-progress
updated: "2026-09-27"
accepted_through: draft
version: 0.9.0-review.1
route: /style/Python
---

# Python Style Guide

> **In progress.** Remaining choices: PY-Q01, PY-Q02, PY-Q03.

For agents: this is a published review draft, not a stable house standard. Apply accepted stable guides first. Within this guide, owner-choice sections explicitly marked pending remain unresolved; displayed candidate text is not approval. Do not migrate an existing repository merely because this draft is public.

## Scope

This is a reusable Python language and ownership guide, not a mandate to use FastAPI, Streamlit, Pydantic, LangChain, pandas, or a particular packaging tool. It draws on the accepted house guides and the private PDF-IT source notes. Those notes' runtime roadmap and provider stack remain project-specific.

The old Python Wayfinder frontier asked about annotation density. The later accepted guides provide a consistent explicit-contract preference, so this draft prepares the explicit-everywhere-practical answer instead of restarting that interview. That is a documented derivation, not a claim that the old issue has already been closed or that a Python release has been approved. Python examples use a declared 3.11-compatible subset unless marked otherwise; repositories retain their own baselines.

## PY001 — Write explicit contracts wherever Python has a useful position

*Inherited principle — target-language wording remains a draft.*

Annotate parameters, named returns, instance fields, and local assignments with the narrowest truthful type. Include `-> None` for procedures and initializers. Do not widen a domain to `object` or `Any` simply to make the annotation convenient. The conventional `self` and `cls` parameters need no redundant annotation unless a special relationship such as Self genuinely matters.

Python loop targets, comprehension targets, and lambda parameter syntax lack the same inline annotation positions as ordinary assignments. Let the typed iterable/callable supply those contracts; do not invent syntax or add meaningless predeclarations. A lambda has the additional callback rule below. Explicit typing is not an argument for disabling useful generic call-site inference.

**Basis:** [TS:D001](https://starter.devthomas.site/style/TypeScript) · [TS:D015](https://starter.devthomas.site/style/TypeScript) · [GD:G001](https://starter.devthomas.site/style/Godot) · [KT:K001](https://starter.devthomas.site/style/Kotlin) · CTX:PY-WAYFINDER (private planning evidence)

## PY002 — Use a real checker; annotations do not validate runtime input

*Prepared native translation — not a separate historical owner vote.*

Use a pinned static type checker and configure strong, useful checking for first-party modules. Runtime Python does not enforce annotations. A successful import, compileall run, or annotated function signature is not a static-check pass or a runtime schema check.

Do not let a missing third-party stub turn an entire application into Any. Quarantine the boundary and describe what was actually validated. Strict checker modes differ; name the tool, version, included paths, and exceptions rather than claiming that one generic word establishes an identical policy everywhere.

**Basis:** [TS:D003](https://starter.devthomas.site/style/TypeScript) · [KT:K011](https://starter.devthomas.site/style/Kotlin) · [P:TYPING](https://docs.python.org/3/library/typing.html)

## PY003 — Treat binding stability as a separate explicit policy

*Owner choice — pending unless explicitly recorded below.*

**Pending PY-Q01.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:PY-Q01:START -->

Use `Final[T]` for stable module defaults and other bindings whose non-replacement is a meaningful contract. Ordinary locals keep explicit `T` annotations; do not add Final everywhere merely to imitate another language's const keyword. Snapshot immutability and mutation authority are handled by representation and owner APIs, not by Final alone.

```python
from typing import Final

MAX_RETRIES: Final[int] = 3

def build_labels() -> tuple[str, ...]:
    labels: list[str] = []
    labels.append("Live")
    return tuple(labels)
```

A Final reference can still point at mutable data. State exactly what is stable, and do not use the annotation as evidence that callers cannot mutate the reachable object. The static checker, not ordinary Python execution, enforces the assignment restriction.

<!-- DECISION:PY-Q01:END -->

**Basis:** [TS:D002](https://starter.devthomas.site/style/TypeScript) · [KT:K002](https://starter.devthomas.site/style/Kotlin) · [P:FINAL](https://typing.python.org/en/latest/spec/qualifiers.html)

## PY004 — Make snapshot immutability real

*Inherited principle — target-language wording remains a draft.*

When an immutable record snapshot uses a dataclass, make its fields frozen and use immutable field representations where the snapshot requires them. The payload-variant choice in PY007 can deliberately use dictionary-shaped cases instead; those still need an explicit snapshot/no-alias contract. A frozen dataclass can reference a mutable list or dictionary, and a tuple can contain mutable elements.

Copy mutable structure when transferring an independent snapshot and review the element contracts. A Sequence or Mapping annotation restricts available operations through that interface; it does not prove there is no mutable alias elsewhere. Do not install a universal deep-copy or deep-freeze layer to avoid making ownership explicit.

**Basis:** [TS:D002](https://starter.devthomas.site/style/TypeScript) · [KT:K003](https://starter.devthomas.site/style/Kotlin) · [P:DATACLASSES](https://docs.python.org/3/library/dataclasses.html)

## PY005 — Give values, mappings, and runtime owners distinct roles

*Inherited principle — target-language wording remains a draft.*

Prefer dataclasses for owned named record values, TypedDict for an intentionally dictionary-shaped schema, and ordinary dict for genuinely open keyed data. A tuple is suitable for a small positional result whose positions are truly the contract; otherwise use named fields. Dataclass slots are deliberate shape/performance constraints, not a mandatory optimization on every record.

Use a continuing class when resource lifetime, private evolving state, or temporal invariants justify an instance. Framework models and exceptions have native roles. Do not create a service class just because functions share a noun, or require every value to be a Pydantic model because one application uses it.

**Basis:** [TS:D005](https://starter.devthomas.site/style/TypeScript) · [TS:D020](https://starter.devthomas.site/style/TypeScript) · [KT:K005](https://starter.devthomas.site/style/Kotlin) · CTX:PDFIT (private source evidence)

## PY006 — Keep domain alternatives named and internally consistent

*Inherited principle — target-language wording remains a draft.*

Give each meaningful state or result alternative its own name. Do not express one coordinated state machine with independent booleans and optional payloads that admit impossible combinations. Keep useful subsets explicit.

Ordinary absence can remain `T | None`. Distinguish absence from invalid input, cancellation, unavailable resources, and a cleared value when those meanings affect behavior. Python's absence vocabulary differs from JavaScript's null/undefined distinction; do not manufacture a second sentinel unless the domain actually needs it.

**Basis:** [TS:D004-D006](https://starter.devthomas.site/style/TypeScript) · [KT:K006](https://starter.devthomas.site/style/Kotlin)

## PY007 — Choose one default representation for closed payload variants

*Owner choice — pending unless explicitly recorded below.*

**Pending PY-Q02.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:PY-Q02:START -->

Use named frozen dataclass cases for ordinary owned payload alternatives and explicitly compose the closed input union. Consume it with pattern matching and `assert_never` after all cases. Do not infer closedness from a base class alone: Python does not seal arbitrary subclassing at runtime. A wire discriminator is retained at its actual serialization boundary, not duplicated on every internal case without a reason.

```python
from dataclasses import dataclass
from typing import TypeAlias, assert_never

@dataclass(frozen=True)
class Saved:
    record_id: str

@dataclass(frozen=True)
class Rejected:
    reason: str

SaveResult: TypeAlias = Saved | Rejected

def result_label(result: SaveResult) -> str:
    match result:
        case Saved(record_id=record_id):
            return f"Saved: {record_id}"
        case Rejected(reason=reason):
            return f"Rejected: {reason}"
    assert_never(result)
```

`TypeAlias` is shown for the example's 3.11 compatibility. A repository supporting the `type` statement can use that syntax. Static exhaustiveness depends on the declared union and checker; runtime deserialization still needs validation.

<!-- DECISION:PY-Q02:END -->

**Basis:** [TS:D006-D008](https://starter.devthomas.site/style/TypeScript) · [KT:K006-K007](https://starter.devthomas.site/style/Kotlin) · [P:TYPING](https://docs.python.org/3/library/typing.html) · [P:DATACLASSES](https://docs.python.org/3/library/dataclasses.html)

## PY008 — Use a checked complete consumer, not a silent fallback

*Inherited principle — target-language wording remains a draft.*

For an operation promising to consume a complete owned union, handle all declared alternatives and pass the remaining value to `assert_never`. Include a negative type-check fixture proving that adding a case without updating the consumer is rejected by the chosen checker.

An ordinary `case _` returning a generic label can conceal missing cases. Use a clearly partial predicate when partial handling is intended. The helper is not runtime validation for untrusted data, and compileall cannot establish static exhaustiveness.

**Basis:** [TS:D007](https://starter.devthomas.site/style/TypeScript) · [KT:K007](https://starter.devthomas.site/style/Kotlin) · [P:EXHAUSTIVE](https://typing.python.org/en/latest/guides/unreachable.html)

## PY009 — Choose literal or enum identity for closed scalar domains

*Owner choice — pending unless explicitly recorded below.*

**Pending PY-Q03.** Candidate A is displayed for continuity; it has not been accepted.

<!-- DECISION:PY-Q03:START -->

Use Literal for a closed scalar domain when the literal values themselves are the contract. Introduce an Enum or StrEnum when runtime member identity, associated behavior, metadata, or an actual integration makes it useful. Keep runtime validation and complete catalog coverage separate from a type annotation.

```python
from typing import Literal, TypeAlias

RunPhase: TypeAlias = Literal["queued", "running", "finished"]

def is_finished(phase: RunPhase) -> bool:
    return phase == "finished"
```

Do not create a runtime enum solely to namespace strings, and do not leave a meaningful closed domain as unrestricted str. External codes stay explicit at the boundary; a source member name is not automatically a permanent wire value.

<!-- DECISION:PY-Q03:END -->

**Basis:** [TS:D009](https://starter.devthomas.site/style/TypeScript) · [KT:K008](https://starter.devthomas.site/style/Kotlin) · CTX:PDFIT (private source evidence) · [P:ENUM](https://docs.python.org/3/library/enum.html)

## PY010 — Custom scalars must establish more than a new spelling

*Inherited principle — target-language wording remains a draft.*

Do not create `UserId = str`, NewType wrappers, or one-field records merely to make arbitrary strings look validated. A custom scalar should enforce or document a real restricted set of legal values, unit contract, or validated invariant.

When runtime construction proves an invariant the checker cannot express, keep that proof at a narrow construction boundary and test the rejection cases. An annotation, cast, NewType call, or generic parameter is not proof that an identifier exists or is authorized.

**Basis:** [TS:D010](https://starter.devthomas.site/style/TypeScript) · [KT:K008](https://starter.devthomas.site/style/Kotlin)

## PY011 — Unknown input stays unknown until inspected

*Inherited principle — target-language wording remains a draft.*

Receive genuinely dynamic input as `object`, or a concrete raw representation such as bytes, text, a JSON value model, or an externally validated DTO. Do not spread Any from JSON libraries or missing SDK stubs into the domain. Conversely, do not convert already structured trusted data to object simply to add a redundant parser layer.

Validate shape and business constraints before constructing the owned value. TypedDict and dataclasses do not by themselves validate arbitrary runtime inputs. Preserve missing/null behavior and external field names before normalizing. Test any type predicate or cast boundary whose body the checker trusts.

**Basis:** [TS:D011-D013](https://starter.devthomas.site/style/TypeScript) · [KT:K011](https://starter.devthomas.site/style/Kotlin)

## PY012 — Separate schema validation from domain representation

*Prepared native translation — not a separate historical owner vote.*

A schema tool may be appropriate at file, HTTP, environment, or provider boundaries. Configure its coercion, unknown-field, missing-value, and strictness behavior deliberately; do not assume the library's default matches the domain.

Normalize a validated wire model into the representation useful to the owner. Do not require a specific schema library for all internal values or copy validation into every internal call. Authorization, accepted URL schemes, referential integrity, and safe resource limits may need checks beyond field types.

**Basis:** [KT:K011](https://starter.devthomas.site/style/Kotlin) · CTX:PDFIT (private source evidence) · [P:PYDANTIC](https://docs.pydantic.dev/latest/concepts/strict_mode/)

## PY013 — Failure contracts follow meaning

*Inherited principle — target-language wording remains a draft.*

Use ordinary None for an expected lookup miss, named result alternatives when the caller must act on expected outcomes, and exceptions when the promised normal result cannot be produced. A return union does not prove the function cannot also raise.

Use `is_...` for membership tests and `parse_...` for required construction/validation with a clear failure contract. Preserve the original cause when translating errors. Do not catch broadly and return an empty collection, false, or None if that makes failure indistinguishable from valid data.

**Basis:** [TS:D011](https://starter.devthomas.site/style/TypeScript) · [TS:D021](https://starter.devthomas.site/style/TypeScript) · [KT:K012](https://starter.devthomas.site/style/Kotlin)

## PY014 — Assertions and diagnostics are not recovery policy

*Inherited principle — target-language wording remains a draft.*

Do not rely on assert for validation that must remain active in production; optimized Python execution may omit it. Use an explicit exception or modeled failure for invalid external or configuration data. Assertions must not perform required side effects.

Log a safe diagnostic separately from controlling the operation's result. A logged error followed by a success response is not recovery. Do not include secrets, provider request bodies, or private document text in arbitrary exception messages or logs.

**Basis:** [GD:G021](https://starter.devthomas.site/style/Godot) · [KT:K012](https://starter.devthomas.site/style/Kotlin)

## PY015 — Use functions before manufacturing continuing objects

*Inherited principle — target-language wording remains a draft.*

Use named def functions for transformations and reusable behavior. A namespace, noun, or desire to inject one helper does not by itself justify a Manager class. A continuing instance should have a real resource, state, lifecycle, or temporal invariant.

Use composition rather than a base class whose subclasses repeatedly disable its behavior. Framework classes, meaningful exceptions, and value dataclasses have distinct native roles. Do not classify every class as forbidden simply because TypeScript prefers plain data for values.

**Basis:** [TS:D014](https://starter.devthomas.site/style/TypeScript) · [TS:D020](https://starter.devthomas.site/style/TypeScript) · [KT:K005](https://starter.devthomas.site/style/Kotlin)

## PY016 — Callbacks carry their complete callable contract

*Inherited principle — target-language wording remains a draft.*

Annotate stored callbacks with a precise Callable signature. Prefer a named, fully annotated function for meaningful business behavior. A small lambda is acceptable where a declared callable type or a typed receiving API supplies the contract that lambda syntax cannot write directly.

Use a Protocol with an explicit __call__ signature when keyword-only parameters or overload relationships actually need it. Do not replace every concise expression with a helper class, use `Callable[..., Any]` for convenience, or claim an async callback is an ordinary synchronous None-returning function.

**Basis:** [TS:D015](https://starter.devthomas.site/style/TypeScript) · [KT:K004](https://starter.devthomas.site/style/Kotlin) · [P:TYPING](https://docs.python.org/3/library/typing.html)

## PY017 — Protocols are behavioral seams, not mandatory wrappers

*Inherited principle — target-language wording remains a draft.*

Use Protocol for a real behavioral substitute, including a useful test fake or platform adapter. Ordinary records remain dataclasses, typed mappings, or other intentional value representations. Do not introduce a protocol for every class or a one-method class for every function.

Runtime-checkable protocol membership is not complete signature or business validation. Use a concrete check at an untrusted boundary. Keep the interface narrow enough to describe what callers actually need rather than mirroring an entire provider SDK.

**Basis:** [TS:D005](https://starter.devthomas.site/style/TypeScript) · [TS:D019](https://starter.devthomas.site/style/TypeScript) · [KT:K013](https://starter.devthomas.site/style/Kotlin) · [P:PROTOCOLS](https://typing.python.org/en/latest/spec/protocol.html)

## PY018 — Generics must earn their place

*Inherited principle — target-language wording remains a draft.*

Introduce first-party type parameters only for real supported variation and meaningful input/output relationships. A helper serving one concrete configuration should normally stay concrete. Library containers and Callable/Protocol machinery are not subject to an artificial two-use requirement.

Use the modern type-parameter or type-alias syntax only when the repository's supported Python versions permit it. Do not silently raise the minimum interpreter version to make an example prettier. TypeVar and TypeAlias compatibility forms remain valid at older supported baselines.

**Basis:** [TS:D019](https://starter.devthomas.site/style/TypeScript) · [KT:K013](https://starter.devthomas.site/style/Kotlin)

## PY019 — State has one authoritative writer

*Inherited principle — target-language wording remains a draft.*

Keep mutable canonical state inside its owner. External code sends semantic commands and reads through deliberate queries or snapshots. Returning the owner's mutable list or dictionary grants a parallel write path even when the property itself has no setter.

Use `_name` for internal implementation state and an intentional public API; Python naming is not an access-control sandbox. A coordinator may orchestrate several owners without copying their canonical state. Keep derived values derived unless an actual cache has a named invalidation owner.

**Basis:** [GD:G012](https://starter.devthomas.site/style/Godot) · [KT:K015](https://starter.devthomas.site/style/Kotlin)

## PY020 — Inject dependencies where objects are composed

*Inherited principle — target-language wording remains a draft.*

Supply ordinary dependencies through explicit parameters or constructors at the composition boundary. Keep application-wide configuration and services only where their lifetime is genuinely application-wide. Do not replace dependency passing with a global mutable registry.

A framework's construction mechanism can be adapted deliberately. Test seams do not require a DI package. Avoid hidden environment reads or network initialization in an otherwise innocent domain object's constructor; capture those choices at the actual external boundary.

**Basis:** [GD:G013](https://starter.devthomas.site/style/Godot) · [KT:K017](https://starter.devthomas.site/style/Kotlin)

## PY021 — Imports establish dependencies, not surprise execution

*Prepared native translation — not a separate historical owner vote.*

Keep shared contracts import-light. Do not import a heavy provider, GUI toolkit, database connection, or application bootstrap solely to reference a simple data type. Use a deliberate adapter or a type-check-only import where its runtime implications are understood.

Avoid module-import network calls, writes, argument parsing, or environment-dependent initialization as ordinary style. Runtime annotation consumers may need names available outside TYPE_CHECKING; test that boundary instead of moving every import mechanically. Keep the CLI entry path explicit and repeatable.

**Basis:** [TS:D023](https://starter.devthomas.site/style/TypeScript) · [KT:K017](https://starter.devthomas.site/style/Kotlin) · CTX:PDFIT (private source evidence)

## PY022 — Async signatures describe awaited outcomes

*Prepared native translation — not a separate historical owner vote.*

An `async def` function returning a record after awaiting declares that record as its return annotation. Do not write `-> Awaitable[Record]` merely because the function is async; that would describe a different nested result. A callback returning an awaitable uses `Callable[..., Awaitable[Record]]` with precise parameters.

Do not mark synchronous blocking code async and claim it became nonblocking. The boundary performing blocking work must choose a supported execution strategy. Avoid nesting event-loop runners inside an already running application loop.

**Basis:** [TS:D022](https://starter.devthomas.site/style/TypeScript) · [KT:K018](https://starter.devthomas.site/style/Kotlin) · [P:TYPING](https://docs.python.org/3/library/typing.html) · [P:ASYNC](https://docs.python.org/3/library/asyncio-task.html)

## PY023 — Own tasks, concurrency, and their failures

*Inherited principle — target-language wording remains a draft.*

Await required work and use structured task groups when related operations share a lifetime and failure policy. Bound concurrency where ordering, rate limits, or resource pressure require it. A task reference alone is not a supervision policy.

A deliberately detached task needs a lifetime owner, exception retrieval/reporting, and shutdown behavior. Do not create tasks and discard their failures. Starting a timeout does not guarantee the underlying operation stopped; describe cancellation support honestly, especially for external effects or work already running in another thread.

**Basis:** [TS:D022](https://starter.devthomas.site/style/TypeScript) · [KT:K018](https://starter.devthomas.site/style/Kotlin) · [P:ASYNC](https://docs.python.org/3/library/asyncio-task.html)

## PY024 — Cancellation must not become an ordinary failure

*Inherited principle — target-language wording remains a draft.*

Preserve asyncio cancellation through cleanup and translation boundaries. In supported Python versions CancelledError derives from BaseException, so an ordinary `except Exception` is not the same as catching it. Broad BaseException handling must re-raise cancellation and other control-flow exceptions unless that exact boundary intentionally owns termination.

Use finally or context management for cleanup. Do not wrap cancellation as an offline result, retry it as a transient provider failure, or consume it simply to print a message. Recovery and retry limits belong to one owner, not nested independent loops at every layer.

**Basis:** [KT:K019](https://starter.devthomas.site/style/Kotlin) · [P:ASYNC](https://docs.python.org/3/library/asyncio-task.html)

## PY025 — Release resources deterministically

*Prepared native translation — not a separate historical owner vote.*

Use `with` and `async with` for resources whose lifetime fits a scope. Pair acquisition and release in the actual owner when a relationship outlives one function. Do not depend on __del__ or garbage-collection timing for flushing important data or terminating a connection.

Closing a borrowed dependency is not cleanup ownership. Keep transaction, connection, file, subprocess, and background-task lifetimes distinct. A context manager should preserve the real exception policy rather than suppress arbitrary failures for convenience.

**Basis:** [GD:G015](https://starter.devthomas.site/style/Godot) · [KT:K021](https://starter.devthomas.site/style/Kotlin) · [P:CONTEXT](https://docs.python.org/3/library/contextlib.html)

## PY026 — Keep units, clocks, and timezone meaning explicit

*Inherited principle — target-language wording remains a draft.*

Distinguish elapsed time from civil timestamps and domain schedule time. Use a suitable monotonic source for elapsed-time decisions and timezone-aware values for timestamps that cross boundaries. Preserve the timezone meaning of external data before conversion.

Name primitive units at interop boundaries, such as timeout_seconds or position_ms. Do not maintain a second authoritative progress clock by counting UI refreshes. Adding timezone or concurrency infrastructure is justified by an actual feature, not a modernization checklist.

**Basis:** [GD:G016](https://starter.devthomas.site/style/Godot) · [KT:K020](https://starter.devthomas.site/style/Kotlin)

## PY027 — Make collection and iterator contracts deliberate

*Prepared native translation — not a separate historical owner vote.*

Accept the weakest interface that still expresses the operation: Iterable for one-pass traversal, Sequence for indexed/repeatable sequence needs, and Mapping for keyed reads. Use a concrete mutable collection when mutation is intentionally part of the API.

Do not consume a generator twice while promising repeatability. Materialize a snapshot when ownership or repeated use requires it. Keep comprehensions for a clear transformation/filter; use a named function or loop when side effects, error ownership, or dense nesting make the contract harder to read.

**Basis:** [KT:K003](https://starter.devthomas.site/style/Kotlin) · [P:TYPING](https://docs.python.org/3/library/typing.html)

## PY028 — Keep filesystem and subprocess boundaries safe and explicit

*Prepared native translation — not a separate historical owner vote.*

Use pathlib or another concrete path representation when a value represents a filesystem path, rather than repeatedly assembling strings. Validate destination scope when untrusted input can select a path. State overwrite, atomicity, encoding, and failure behavior where they matter.

Pass subprocess arguments as a sequence rather than assembling a shell command from input. Check exit status and own timeout/termination behavior. A shell is an explicit integration boundary, not the default quoting mechanism. Do not mistake a process starting successfully for successful completion of its work.

**Basis:** [TS:D011-D012](https://starter.devthomas.site/style/TypeScript) · [KT:K038](https://starter.devthomas.site/style/Kotlin) · [P:SUBPROCESS](https://docs.python.org/3/library/subprocess.html)

## PY029 — Keep serialization and persistence outside ordinary records

*Inherited principle — target-language wording remains a draft.*

A serializable record does not require database, HTTP, or provider dependencies in its definition. Keep schema versions, migrations, and provider normalization at a deliberate adapter. Persist the domain facts needed for recovery, not arbitrary live objects.

Do not pickle untrusted input or silently trust a deserializer because its result has a type annotation. Separate decoding, business validation, and authorization. A schema library, ORM, or dataframe shape is not automatically the universal domain representation.

**Basis:** [KT:K011](https://starter.devthomas.site/style/Kotlin) · [KT:K031](https://starter.devthomas.site/style/Kotlin) · CTX:PDFIT (private source evidence)

## PY030 — Use native names and narrow module APIs

*Inherited principle — target-language wording remains a draft.*

Use snake_case for functions, ordinary variables, modules, and packages; PascalCase for classes and named types; and uppercase names for meaningful fixed constants. Keep predicate names natural and names semantic rather than prefixed with I, T, or Impl categories.

Use explicit imports. Avoid wildcard exports and broad package initializers that eagerly import unrelated providers. Preserve external protocol names and framework-required entry names at their boundary. Do not add leading double underscores to every internal field as a substitute for an API.

**Basis:** [TS:D023-D024](https://starter.devthomas.site/style/TypeScript) · [KT:K033](https://starter.devthomas.site/style/Kotlin) · [P:STYLE](https://peps.python.org/pep-0008/)

## PY031 — Organize by feature and ownership

*Inherited principle — target-language wording remains a draft.*

Colocate a feature's records, operations, adapters, and focused tests when that makes the boundary clearer. Avoid global helpers/models/managers buckets as the primary organizing principle. Split modules when responsibilities diverge, not to meet an arbitrary one-class-per-file rule.

A src layout, build backend, or environment manager is a repository packaging decision, not a new universal requirement imposed by this style guide. Keep import paths and package entry points explicit and test the installed/package form when distribution is part of the product.

**Basis:** [GD:G022](https://starter.devthomas.site/style/Godot) · [KT:K031](https://starter.devthomas.site/style/Kotlin)

## PY032 — Logs and CLI output serve different consumers

*Prepared native translation — not a separate historical owner vote.*

Use deliberate diagnostic logging for operational events and keep machine-readable stdout clean when the CLI promises JSON or another structured stream. Choose exit status according to the operation's outcome, not whether an error was printed.

Do not swallow causes when adding safe user-facing context. Avoid logging secret values, complete environment mappings, or private document contents. A verbosity flag may change diagnostics, never whether essential validation or error handling executes.

**Basis:** [GD:G021](https://starter.devthomas.site/style/Godot) · [KT:K038](https://starter.devthomas.site/style/Kotlin)

## PY033 — Format deterministically without erasing the house contract

*Inherited principle — target-language wording remains a draft.*

Use a single pinned formatter with Python's native four-space indentation, UTF-8, LF, and readable line breaks. Set the concrete line width and import policy in the repository. Do not run competing formatters or assume their defaults are an owner decision.

Keep explicit annotations, deliberate Final policy, and meaningful multiline contracts. Configure reliable lint checks separately from formatting and typing. Narrow suppressions need a reason and must not become a permanent blanket exclusion of first-party code.

**Basis:** [TS:D025](https://starter.devthomas.site/style/TypeScript) · [GD:G024](https://starter.devthomas.site/style/Godot) · [KT:K034-K035](https://starter.devthomas.site/style/Kotlin)

## PY034 — Test the smallest truthful boundary

*Inherited principle — target-language wording remains a draft.*

Test parsers with valid, malformed, missing, and boundary inputs; test domain transitions without the UI; and test actual adapters where resource and framework behavior matters. Include negative static fixtures for important type promises when a real checker is available.

Use deterministic clocks and fake capabilities where they faithfully preserve behavior. Test cancellation and task shutdown rather than only happy-path results. A mock that accepts every value cannot prove the real boundary rejects invalid data. Keep provider-specific integration claims separate from pure Python tests.

**Basis:** [GD:G023](https://starter.devthomas.site/style/Godot) · [KT:K036](https://starter.devthomas.site/style/Kotlin)

## PY035 — Versions and validation claims stay repository-specific

*Inherited principle — target-language wording remains a draft.*

Record the interpreter, static checker, formatter, test tools, and declared compatibility matrix. Do not transplant PDF-IT's historical version roadmap into unrelated applications or upgrade an interpreter because a guide example uses a newer API.

Report syntax/import checks, unit tests, static typing, packaging, provider integration, and deployed behavior separately. The packet's Python runtime fixtures are not a substitute for an unavailable static checker. Preserve product APIs, data formats, dependencies, and deployment constraints unless a separate task authorizes changes.

**Basis:** [KT:K035-K038](https://starter.devthomas.site/style/Kotlin) · CTX:PDFIT (private source evidence)

## Review and release boundary

This guide is intentionally published as **in progress**. Displayed candidate text in unresolved owner-choice sections is a recommendation for review, not an owner decision. Publishing this review surface does not approve those choices, authorize application migrations, upgrade project toolchains, or certify an implementation. Resolve the queued decisions and obtain final guide-level approval before marking the guide stable.

No implementation repository has been migrated by publishing this draft. Repository-specific dependency versions, product requirements, storage formats, and deployment policies remain external to this reusable style contract.
