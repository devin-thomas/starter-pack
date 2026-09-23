---
id: typescript
title: TypeScript
summary: A strict, explicit TypeScript house style built around readable contracts, deliberate state modeling, and compiler-enforced clarity.
human_summary: TypeScript is JavaScript with a static type system, giving you earlier feedback about mismatched values and clearer contracts without leaving the JavaScript ecosystem.
status: in-progress
updated: "2026-09-18"
accepted_through: D022
version: 0.1.11
route: /style/TypeScript
---

# TypeScript Style Guide

> **In progress.** This public guide contains the decisions that are settled so far. Anything not covered here is still open rather than silently inherited from common TypeScript convention.

For agents: treat the accepted rules below as the current TypeScript house style for first-party code. Preserve externally owned contracts at their boundaries, and do not invent rules for topics that are still unsettled.

## D001 — Explicit types by default

Write explicit, precise type annotations almost everywhere TypeScript syntax reasonably permits them. Types are part of the readable source contract, not editor-only metadata.

Prefer:

```ts
const maxLives: number = 3;

function calculateScore(
  distance: number,
  boosts: number,
): number {
  const distanceScore: number = distance * 10;
  const boostScore: number = boosts * 100;
  return distanceScore + boostScore;
}
```

Do not widen a real domain merely to make an annotation easy:

```ts
type GameMode =
  | "arcade"
  | "story"
  | "training";

const gameMode: GameMode = "arcade";
```

Narrow syntax exceptions are allowed where TypeScript provides no useful annotation point, such as a `for...of` binding.

## D002 — `const` means immutable; `let` means mutable

Use `const` only when both the binding and the value exposed through its declared type graph are intended to be immutable.

Immutable graphs cascade `readonly`:

```ts
type SamplingConfig = {
  readonly temperature: number;
  readonly maxTokens: number;
};

type AgentConfig = {
  readonly model: string;
  readonly sampling: SamplingConfig;
  readonly enabledTools: readonly string[];
};

const config: AgentConfig = loadConfig();
```

If intentionally mutable state exists underneath a binding, use `let` even when rebinding is not expected:

```ts
type PlayerState = {
  readonly playerId: string;
  readonly maxHealth: number;
  health: number;
};

let player: PlayerState = createPlayer();
player.health = 80;
```

Do not use a broad `DeepReadonly<T>` abstraction as the normal way to express first-party immutability. Put the contract where the type is defined.

## D003 — Maximum practical compiler strictness

The baseline is:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

The goal is not to enable flags blindly. Prefer compiler-enforced explicitness when the stricter model better describes runtime uncertainty or programmer intent.

Indexed access is therefore fallible unless the type proves otherwise:

```ts
const firstEnemy: Enemy | undefined = enemies[0];
```

## D004 — Named domain states first; semantic nullish fallback

If absence or state carries useful domain meaning, model it with named states rather than ambiguous sentinel combinations.

```ts
type UnlockedState = {
  readonly kind: "unlocked";
};

type LockedState = {
  readonly kind: "locked";
  readonly target: Enemy;
};

type LockOnState =
  | UnlockedState
  | LockedState;
```

For low-complexity absence, keep the meanings distinct:

- `property?: T` — omitted, not supplied, or inherited.
- `T | undefined` — lookup or language/API uncertainty.
- `T | null` — intentionally empty or cleared when no richer state is worth naming.

Do not build state machines from booleans plus nullable fields when a named union can make legal states explicit.

## D005 — `type` for data; `interface` for implementation contracts

Use `type` for first-party data, state, configuration, request/response values, literal unions, tuples, and type composition.

```ts
type AgentRequest = {
  readonly model: string;
  readonly messages: readonly AgentMessage[];
};
```

Use `interface` for an intentional behavioral implementation contract:

```ts
interface ModelProvider {
  complete(
    request: AgentRequest,
  ): Promise<AgentResult>;
}
```

A callback field does not turn a data object into an interface. A function-only capability remains a function type alias.

## D006 — Name meaningful union variants

Give meaningful discriminated-union variants their own names by default, even when they are small.

```ts
type AddChipsEffect = {
  readonly kind: "add-chips";
  readonly chips: number;
};

type AddMultEffect = {
  readonly kind: "add-mult";
  readonly mult: number;
};

type JokerEffect =
  | AddChipsEffect
  | AddMultEffect;
```

Named variants can be recomposed into semantic subsets:

```ts
type AdditiveEffect =
  | AddChipsEffect
  | AddMultEffect;
```

Several simultaneous effects are several values, such as `readonly JokerEffect[]`, not an impossible intersection of mutually exclusive discriminants.

## D007 — Use a shared `assertNever` for exhaustiveness

Full-union consumers end with the shared exhaustive branch:

```ts
function assertNever(
  value: never,
): never {
  throw new Error("Unexpected variant");
}
```

```ts
function effectLabel(
  effect: JokerEffect,
): string {
  switch (effect.kind) {
    case "add-chips":
      return `+${effect.chips} chips`;

    case "add-mult":
      return `+${effect.mult} Mult`;

    default:
      return assertNever(effect);
  }
}
```

If a new variant is added but not handled, the compiler rejects the call to `assertNever`. The same pattern works for side-effect-only switches where `noImplicitReturns` would not protect exhaustiveness.

## D008 — Owned unions use `kind`; external discriminators stay truthful

First-party discriminated unions narrow on `kind`.

```ts
type RunningAgentState = {
  readonly kind: "running";
  readonly runId: string;
};
```

Externally dictated payloads keep their real discriminator spelling at the boundary:

```ts
type ProviderCompletedEvent = {
  readonly type: "response.completed";
  readonly output: string;
};
```

Normalize inward when the external representation should not propagate through the domain.

The boundary should tell the truth about the outside system. Owned code should tell the truth about our domain.

## D009 — Literal unions for closed scalar domains

When the literal runtime values are themselves the domain, constrain those literals directly.

```ts
type JokerRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "legendary";

const rarity: JokerRarity = "rare";
```

Do not introduce an `enum` merely for namespacing when the program actually wants the string `"rare"`.

If runtime iteration is useful, a direct checked list is fine:

```ts
const JOKER_RARITIES: readonly JokerRarity[] = [
  "common",
  "uncommon",
  "rare",
  "legendary",
];
```

More complex runtime catalogs or `as const` derivation should exist only when they materially benefit the program.

## D010 — No unconstrained scalar wrapper types

If every value of a primitive is legal, use the primitive directly.

Do not create documentation-only aliases:

```ts
type PlayerId = string;
type SearchQuery = string;
```

Do not add nominal brands or one-field wrapper objects merely to make arbitrary strings or numbers look like different types.

A custom scalar type is justified only when it narrows the legal values or proves a real invariant.

Compile-time structure is good when it actually constrains:

```ts
type ReplayId = `replay_${string}`;
```

For a runtime-only invariant, a proof marker is acceptable only behind a validator or parser that actually establishes that invariant.

## D011 — Match runtime validation APIs to the meaning of failure

Use different validation APIs for different semantic jobs.

### Membership test: `isX`

Use a type predicate when the caller is asking whether a value belongs to the refined domain.

```ts
function isReplayId(
  value: string,
): value is ReplayId {
  return replayIdPattern.test(value);
}
```

### Required valid value: `parseX`

Use a parser when a valid value is required for the operation to continue.

```ts
function parseReplayId(
  value: string,
): ReplayId {
  if (!replayIdPattern.test(value)) {
    throw new Error("Invalid replay ID");
  }

  return value as ReplayId;
}
```

The final assertion is allowed inside the trusted validation boundary that just proved the invariant, not at arbitrary call sites.

### Meaningful validation failure: named result union

Use a named result union when the reason for invalidity is domain information the caller needs.

```ts
type ValidReplayIdResult = {
  readonly kind: "valid";
  readonly value: ReplayId;
};

type InvalidReplayIdResult = {
  readonly kind: "invalid";
  readonly reason: string;
};

type ReplayIdParseResult =
  | ValidReplayIdResult
  | InvalidReplayIdResult;
```

Do not force one validation API to solve every case.

## D012 — Untrusted values start as `unknown`

Raw external data starts as `unknown` until the program has actually established what it contains.

```ts
const payload: unknown =
  await response.json();

const providerEvent: ProviderEventDto =
  parseProviderEvent(payload);
```

Do not give unvalidated data the type you merely expect it to have. A type annotation does not validate a runtime value.

`any` is not a normal first-party modeling tool. If a third-party library forces `any`, contain it at that boundary and restore a checked type immediately:

```ts
const sdkResult: any =
  legacySdk.getResult();

const payload: unknown =
  sdkResult;

const result: ProviderResult =
  parseProviderResult(payload);
```

A concrete DTO type is appropriate when a real trusted layer—such as a validator, generated client, or framework contract—has already established that shape.

A useful flow is:

```ts
const rawPayload: unknown =
  await getProviderPayload();

const providerEvent: ProviderEventDto =
  parseProviderEvent(rawPayload);

const event: AgentEvent =
  normalizeProviderEvent(providerEvent);
```

Each type should communicate how much the program actually knows at that point.

## D013 — Explicit annotations by default; use `satisfies` when precision helps

Write an explicit annotation when the declared contract itself is the important source information:

```ts
type ProviderConfig = {
  readonly model: string;
  readonly timeoutMs: number;
};

const config: ProviderConfig = {
  model: "gpt-5",
  timeoutMs: 30_000,
};
```

Use `satisfies` when the value should be checked against a broader contract but keeping its more precise inferred keys or literals provides real value:

```ts
type RouteDefinition = {
  readonly path: string;
  readonly requiresAuth: boolean;
};

const routes = {
  home: {
    path: "/",
    requiresAuth: false,
  },
  guide: {
    path: "/guide",
    requiresAuth: true,
  },
} satisfies Readonly<Record<string, RouteDefinition>>;

type RouteName =
  keyof typeof routes;
// "home" | "guide"
```

A direct annotation with `Record<string, RouteDefinition>` would broaden those known keys to `string`. Here, `satisfies` earns its place because the literal key information remains useful.

Do not use `satisfies` merely as a stylistic replacement for ordinary annotations.

Type assertions are different. `as Type` tells TypeScript to treat a value as that type; it does not validate the value. Reserve assertions for places where a real proof or external fact exists that TypeScript cannot express directly, such as the final step of a validator that already proved a runtime-only invariant.

Do not use `as any` or `as unknown as TargetType` to force ordinary first-party code past a useful compiler error.

## D014 — Function declarations for named behavior; arrows for function values

Use a function declaration for named reusable behavior:

```ts
function calculateScore(
  distance: number,
  boosts: number,
): number {
  return distance * 10 + boosts * 100;
}
```

Use an arrow function when the function is genuinely acting as a value, callback, or closure:

```ts
const visibleEnemies: readonly Enemy[] =
  enemies.filter(
    (enemy: Enemy): boolean =>
      enemy.visible,
  );
```

This distinction is not only visual. Arrow functions capture `this` from their surrounding lexical scope, while ordinary functions use normal function `this` behavior based on how they are called. The two forms should therefore keep separate jobs instead of being standardized into one style.

Concise expression bodies are encouraged when the entire callback is one clear expression:

```ts
(enemy: Enemy): boolean =>
  enemy.visible
```

Do not add braces and an explicit `return` when they communicate nothing additional. Use a block body when multiple statements, branching, or meaningful control flow make the structure useful.

## D015 — Keep callback parameter and return types explicit

Write callback parameter and return types even when TypeScript can infer them from the receiving API.

```ts
const visibleEnemies: readonly Enemy[] =
  enemies.filter(
    (enemy: Enemy): boolean =>
      enemy.visible,
  );
```

The goal is not only to tell the compiler what it already knows. The types tell the developer what the callback expects and intends to return at the exact point where that behavior is written.

They also provide coding agents with stronger nearby semantic context about how a value should be used and what kind of value should be produced next. The style therefore optimizes source for human and agent understanding, not just compiler inference.

This remains compatible with concise arrow functions:

```ts
(player: Player): boolean =>
  player.active
```

Explicit types do not require braces. Keep the concise body when one expression fully communicates the behavior.

## D016 — Use `as const` selectively for useful literal precision

Use `as const` when preserving exact literal values or tuple structure materially benefits the program.

Keep the semantic domain explicit:

```ts
type Direction =
  | "up"
  | "down"
  | "left"
  | "right";

const DIRECTIONS = [
  "up",
  "down",
  "left",
  "right",
] as const satisfies readonly Direction[];
```

Here, `Direction` remains the source-visible domain. `as const` preserves the exact runtime tuple, while `satisfies` checks that the tuple still conforms to the explicit semantic type.

Another useful case is an exact tuple:

```ts
const ORIGIN = [0, 0] as const;
```

Its type is:

```ts
readonly [0, 0]
```

Do not use `as const` merely to make something "more readonly," and do not derive semantic types from runtime values when writing the type directly would be clearer.

Also remember that `as const` is a TypeScript type-level operation. It does not freeze the JavaScript object at runtime.

## D017 — Do not use non-null assertions

Do not use the postfix non-null assertion operator to make `null` or `undefined` disappear from a type.

Avoid:

```ts
const player: Player =
  players.find(
    (candidate: Player): boolean =>
      candidate.id === playerId,
  )!;
```

The `!` changes what TypeScript believes without adding any runtime proof.

Prefer visible narrowing:

```ts
const player: Player | undefined =
  players.find(
    (candidate: Player): boolean =>
      candidate.id === playerId,
  );

if (player === undefined) {
  throw new Error("Player not found");
}

usePlayer(player);
```

If the same invariant appears repeatedly, centralize the check in a helper that returns the proven type.

The goal is to make the transition from `Player | undefined` to `Player` visible to the developer, compiler, and coding agent rather than hiding it behind a convenience assertion.

## D018 — Freeze at runtime only when enforcement matters

Use readonly types for normal first-party immutability:

```ts
type AgentConfig = {
  readonly model: string;
  readonly retries: number;
};

const config: AgentConfig = {
  model: "gpt-5",
  retries: 3,
};
```

Do not add `Object.freeze()` merely because a value is readonly.

Use runtime freezing when it materially changes what the running program can guarantee—for example, when an object crosses into untyped JavaScript, plugin code, or another boundary that may not honor the TypeScript contract:

```ts
const config: Readonly<AgentConfig> =
  Object.freeze({
    model: "gpt-5",
    retries: 3,
  });
```

Remember that `Object.freeze()` is shallow. Deep freezing should be a deliberate boundary-level choice when an entire nested graph genuinely requires runtime enforcement, not a default utility applied to every immutable value.

## D019 — Generics must earn their place

Use a generic only when it preserves a real reusable type relationship.

```ts
function firstOrUndefined<T>(
  values: readonly T[],
): T | undefined {
  return values[0];
}
```

Here the generic is meaningful because the same implementation preserves the caller's element type across multiple legitimate uses.

Constrain generic parameters when the implementation requires structure:

```ts
type Identified = {
  readonly id: string;
};

function findById<T extends Identified>(
  values: readonly T[],
  id: string,
): T | undefined {
  return values.find(
    (value: T): boolean =>
      value.id === id,
  );
}
```

Do not preserve a generic abstraction for hypothetical reuse. If first-party code only has one real type instantiation, make the abstraction concrete.

Prefer:

```ts
class PlayerRepository {
  // ...
}
```

over:

```ts
class Repository<T> {
  // ...
}
```

when `Repository<Player>` is the only real supported form.

Generalize later if a second legitimate use actually appears.

At call sites, inference is fine when the concrete type is already obvious from typed arguments and the declared result. Write an explicit type argument when choosing that type is itself meaningful information or resolves ambiguity.

## D020 — Prefer data and functions; classes represent continuing runtime objects

Use plain typed data plus named functions for ordinary domain values and transformations.

```ts
type PlayerState = {
  readonly playerId: string;
  readonly maxHealth: number;
  health: number;
};

function applyDamage(
  player: PlayerState,
  damage: number,
): PlayerState {
  return {
    ...player,
    health: Math.max(
      0,
      player.health - damage,
    ),
  };
}
```

A class must earn its place by representing a continuing runtime object whose meaning depends on something more than serializable public data—such as a live resource, private evolving state, lifecycle, temporal invariants, or a stateful behavioral implementation contract.

A useful heuristic is:

> If you could serialize the value, reconstruct it from its fields, and still have the same kind of thing, it probably wants to be data. If its meaning depends on something live that cannot be captured by those fields alone, it may want to be a class.

For example, a worker client can justify a class because the instance owns a live `Worker`, pending requests, sequencing state, listeners, and cleanup responsibilities:

```ts
interface WorkerClient {
  request(
    message: WorkerRequest,
  ): Promise<WorkerResponse>;

  close(): void;
}

class BrowserWorkerClient
  implements WorkerClient {
  private readonly worker: Worker;
  private readonly pending:
    Map<number, PendingRequest>;

  constructor(
    worker: Worker,
  ) {
    this.worker = worker;
    this.pending =
      new Map<number, PendingRequest>();
  }

  async request(
    message: WorkerRequest,
  ): Promise<WorkerResponse> {
    throw new Error("Example");
  }

  close(): void {
    // Release this instance's runtime resources.
  }
}
```

Do not create a class merely because the concept is a domain noun, related functions operate on its data, a constructor can validate it, or methods would be convenient to group. Validation alone belongs in a parser or factory when the result is still fundamentally data.

Classes should be relatively uncommon, but they remain appropriate for things like sockets, workers, audio engines, database connections, media sessions, watchers, transactions, and device managers where continuing runtime identity is real.

## D021 — Represent failure according to what it means

Use `T | undefined` for ordinary absence or lookup misses:

```ts
function findPlayer(
  players: readonly Player[],
  playerId: string,
): Player | undefined {
  return players.find(
    (player: Player): boolean =>
      player.playerId === playerId,
  );
}
```

Use a named discriminated result union when failure is an expected recoverable domain outcome that callers are supposed to inspect:

```ts
type SaveSucceeded = {
  readonly kind: "saved";
  readonly revision: number;
};

type SaveConflict = {
  readonly kind: "conflict";
  readonly currentRevision: number;
};

type SaveResult =
  | SaveSucceeded
  | SaveConflict;
```

Throw when an invariant, required precondition, or exceptional runtime operation prevents the function from producing its promised normal result:

```ts
function requireSession(
  session: Session | undefined,
): Session {
  if (session === undefined) {
    throw new Error("Session is required");
  }

  return session;
}
```

The key question is whether the caller is supposed to make a normal domain decision based on the outcome. If yes, put that outcome in the type. If no normal result can be produced and failure should propagate to an error boundary, throw or reject.

Do not wrap every foreseeable failure in a result type, and do not hide meaningful expected domain alternatives exclusively behind exceptions. Custom `Error` subclasses must also earn their place; expected domain failure information should generally remain typed data.

## D022 — Async structure should expose causality

Give every async function an explicit `Promise<T>` return type:

```ts
async function loadProfile(
  userId: string,
): Promise<UserProfile> {
  // ...
}
```

Use `await` when the current operation depends on completion:

```ts
const profile: UserProfile =
  await loadProfile(userId);
```

When operations are genuinely independent, express that deliberate concurrency with the Promise combinator that matches the intended behavior:

```ts
const [
  profile,
  preferences,
]: readonly [
  UserProfile,
  UserPreferences,
] = await Promise.all([
  loadProfile(userId),
  loadPreferences(userId),
]);
```

Do not leave Promises floating accidentally. A Promise must be awaited, returned, composed, or explicitly detached.

Detached work must be visibly detached and must have an intentional owner for rejection. Local handling is valid:

```ts
void sendTelemetry(event)
  .catch(
    (error: unknown): void => {
      reportTelemetryError(error);
    },
  );
```

An established application-level task/error supervisor is also valid. A bare `void somePromise()` is not sufficient by itself because it marks detachment without showing who owns failure.

Prefer `async`/`await` for ordinary sequential control flow. Promise chains remain available when the Promise itself is genuinely being transformed or composed as a value.

## Still in progress

This guide is intentionally incomplete. Unsettled release-critical areas include modules/imports/exports, naming, and formatting/linting/enforcement. Framework-specific and other edge-case guidance can be added after 1.0.

When a topic is not covered yet, do not treat common TypeScript style as an implicit house rule.
