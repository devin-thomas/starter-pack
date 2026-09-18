---
id: typescript
title: TypeScript
summary: A strict, explicit TypeScript house style built around readable contracts, deliberate state modeling, and compiler-enforced clarity.
status: in-progress
updated: "2026-09-18"
accepted_through: D011
version: 0.1.0
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

## Still in progress

This guide is intentionally incomplete. Unsettled areas include untrusted external values, `unknown` and `any`, assertions and `satisfies`, function and generic conventions, readonly utilities, classes, errors, async code, modules/imports, naming, formatting, linting, framework boundaries, testing, documentation, and repository/package conventions.

When a topic is not covered yet, do not treat common TypeScript style as an implicit house rule.
