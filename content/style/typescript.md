---
id: typescript
title: TypeScript
summary: A strict, explicit TypeScript house style built around readable contracts, deliberate state modeling, and compiler-enforced clarity.
human_summary: TypeScript is JavaScript with a static type system, giving you earlier feedback about mismatched values and clearer contracts without leaving the JavaScript ecosystem.
status: stable
updated: "2026-09-23"
accepted_through: D025
version: 1.0.0
route: /style/TypeScript
---

# TypeScript Style Guide

For agents: apply the accepted rules below to first-party TypeScript. Preserve externally owned contracts at their boundaries. Topics explicitly outside this core guide are not implicit house rules. Examples are independently type-checked; the module example is a small multi-file program. Game and AI examples are illustrative, not specifications of a commercial game's rules or a provider's API.

## D001 — Explicit types by default

Write explicit, precise annotations wherever TypeScript provides a useful annotation point. Types are readable source contracts for developers and coding agents, not merely information an editor can infer. Do not widen a real domain to make an annotation easier.

<!-- example: explicit-types -->

```ts
type GameMode = "arcade" | "story" | "training";

const gameMode: GameMode = "arcade";
const maxLives: number = 3;

function calculateScore(distance: number, boosts: number): number {
  const distanceScore: number = distance * 10;
  const boostScore: number = boosts * 100;
  return distanceScore + boostScore;
}
```

When exactly one literal is the intended contract, write that literal type, such as `const gameMode: "arcade" = "arcade"`. An annotation should preserve intent, not automatically broaden it to `string`.

Callbacks follow the same explicit rule. The narrowly accepted exceptions are useful precision from `satisfies` or `as const`, justified generic call-site inference, and syntax that has no annotation position, such as a `for...of` binding. Annotate a destructuring pattern as a whole; do not confuse property renaming with a type annotation.

## D002 — `const` means immutable; `let` means mutable

This is a house convention stronger than JavaScript's binding-only meaning of `const`. Use `const` for a binding whose exposed value graph is intended to be immutable. If intentional mutable state exists underneath a local binding, use `let`, even when rebinding is not expected. Stable properties of a mixed-mutability type can still be `readonly`.

<!-- example: immutable-config -->

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

const config: AgentConfig = {
  model: "arena-coach",
  sampling: { temperature: 0.2, maxTokens: 1024 },
  enabledTools: ["replay-search"],
};
```

<!-- example: mutable-player -->

```ts
type PlayerState = {
  readonly playerId: string;
  readonly maxHealth: number;
  health: number;
};

let player: PlayerState = {
  playerId: "cube-1",
  maxHealth: 100,
  health: 100,
};

player.health = 80;
```

Cascade `readonly` at the declarations that own the contract. A readonly property holding a mutable array, object, `Map`, or live resource does not make the contents immutable. Do not hide mutable state behind a setter, closure, or `const` wrapper. Use named domain operations when changes carry rules beyond simple assignment.

This convention concerns intended access paths, not a whole-program immutability proof. TypeScript's structural compatibility can allow writable aliases to readonly objects, and readonly annotations do not freeze JavaScript objects. Avoid introducing aliases that undermine the intended contract; review ownership separately. If a mutable binding must never be replaced, use an explicit architectural restriction, focused check, or test rather than pretending its contents are immutable.

Do not use a broad `DeepReadonly<T>` transformation as the default way to define first-party data.

## D003 — Maximum practical compiler strictness

Use this minimum safety baseline:

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

These flags do not choose the runtime, module resolution, JSX settings, or emit strategy for a project. Add those target-specific settings separately. Strictness should expose uncertainty, not encourage assertions that suppress it.

<!-- example: checked-index -->

```ts
type EnemyDefinition = {
  readonly name: string;
};

const enemies: readonly EnemyDefinition[] = [];
const firstEnemy: EnemyDefinition | undefined = enemies[0];

function enemyLabel(enemy: EnemyDefinition | undefined): string {
  if (enemy === undefined) {
    return "No enemy selected";
  }
  return enemy.name;
}
```

An optional property is not automatically permission to assign `undefined`. Write `property?: T | undefined` only when both omission and explicit undefined are intended. Use brackets for index-signature lookups and `override` for actual overrides. A full union consumer also follows the shared exhaustiveness rule below.

## D004 — Named domain states first; semantic nullish fallback

When absence or state carries useful domain meaning, give it named alternatives. Do not assemble a state machine from booleans plus nullable fields that permit contradictory combinations.

<!-- example: lock-on-state -->

```ts
type EnemyDefinition = {
  readonly name: string;
};

type UnlockedState = {
  readonly kind: "unlocked";
};

type LockedState = {
  readonly kind: "locked";
  readonly target: EnemyDefinition;
};

type LockOnState = UnlockedState | LockedState;

let lockOn: LockOnState = { kind: "unlocked" };
lockOn = { kind: "locked", target: { name: "Training dummy" } };
```

For low-complexity absence, keep the meanings distinct: `property?: T` means omitted or not supplied; `T | undefined` fits ordinary lookups and language/API uncertainty; `T | null` fits intentional empty or cleared values when no richer state is useful.

Describe external APIs faithfully first. For example, a DOM lookup that returns `null` must not be annotated as returning `undefined` merely to fit an internal preference. Normalize at the boundary when needed. “Not found” need not become a result object unless it carries useful additional domain information.

## D005 — `type` for data; `interface` for implementation contracts

Use `type` for data, state, configuration, request/response values, literal unions, tuples, and type composition. Use `interface` for intentional substitutable behavior. An exported data object does not become an interface just because it crosses a boundary.

<!-- example: behavioral-contract -->

```ts
type ReplayRequest = {
  readonly replayId: string;
};

type CoachReply = {
  readonly advice: string;
};

interface ReplayAnalyzer {
  analyze(request: ReplayRequest): Promise<CoachReply>;
}
```

A function-only capability can remain a function type alias. A callback property does not turn an otherwise ordinary data object into an implementation contract. An interface does not require a class; class suitability is a separate decision.

Both forms participate in TypeScript's structural type system. A type alias is not an exact or sealed runtime shape, and `interface` does not automatically grant permission for unrelated declaration merging. Preserve deliberate external augmentation requirements only at their boundary.

## D006 — Name meaningful union variants

Name each meaningful domain variant even when it contains only one field. Compose the names into full unions and useful subsets instead of repeatedly extracting anonymous shapes.

<!-- example: named-effects -->

```ts
type AddChipsEffect = {
  readonly kind: "add-chips";
  readonly chips: number;
};

type AddMultEffect = {
  readonly kind: "add-mult";
  readonly mult: number;
};

type MultiplyMultEffect = {
  readonly kind: "multiply-mult";
  readonly factor: number;
};

type JokerEffect = AddChipsEffect | AddMultEffect | MultiplyMultEffect;
type AdditiveEffect = AddChipsEffect | AddMultEffect;

const effects: readonly JokerEffect[] = [
  { kind: "add-chips", chips: 25 },
  { kind: "add-mult", mult: 3 },
];
```

Several simultaneous effects are several values. Intersecting two variants with incompatible `kind` literals does not create a valid combined effect. Tiny, genuinely incidental helper-local unions may remain inline, but a domain variant's small size is not a reason to leave it unnamed.

## D007 — Use a shared `assertNever` for exhaustiveness

Every consumer intended to handle a complete owned union ends its switch with the shared `assertNever` pattern. This makes exhaustiveness explicit, including in functions returning `void`.

<!-- example: exhaustive-effects -->

```ts
type AddChipsEffect = {
  readonly kind: "add-chips";
  readonly chips: number;
};

type AddMultEffect = {
  readonly kind: "add-mult";
  readonly mult: number;
};

type JokerEffect = AddChipsEffect | AddMultEffect;

function assertNever(value: never): never {
  throw new Error("Unexpected union variant");
}

function effectLabel(effect: JokerEffect): string {
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

Adding an unhandled variant makes the call to `assertNever` fail type checking. Exhaustiveness is relative to the declared input union, including a deliberately narrower subset. The helper is not generic and must not be forced to log or stringify arbitrary user/provider data. Its parameter has a compile-time purpose even when the runtime body does not inspect it.

## D008 — Owned unions use `kind`; external discriminators stay truthful

Use `kind` for owned state, effect, event, command, and result variants. Keep externally prescribed discriminator names at the boundary; normalize inward when the external representation should not propagate.

<!-- example: provider-normalization -->

```ts
// Suppose this provider's wire contract uses event_type.
type ProviderFinishedEvent = {
  readonly event_type: "run.finished";
  readonly reply: string;
};

type CompletedAgentEvent = {
  readonly kind: "completed";
  readonly output: string;
};

function normalizeProviderEvent(
  event: ProviderFinishedEvent,
): CompletedAgentEvent {
  return { kind: "completed", output: event.reply };
}
```

The boundary type must describe what is actually received, not a field spelling we would prefer. Normalization follows validation; it does not establish that raw input has the external type.

## D009 — Literal unions for closed scalar domains

When literal values are themselves the domain, constrain the literals directly. Do not introduce an enum just to turn the desired string into a namespaced token.

<!-- example: literal-rarities -->

```ts
type JokerRarity = "common" | "uncommon" | "rare" | "legendary";

const rarity: JokerRarity = "rare";
const JOKER_RARITIES: readonly JokerRarity[] = [
  "common",
  "uncommon",
  "rare",
  "legendary",
];
```

A runtime catalog earns its place when it supports a menu, validator, metadata lookup, or another actual runtime use. Keep the semantic type explicit unless a richer runtime source of truth is genuinely justified.

A list typed `readonly JokerRarity[]` checks its entries; it does not prove that every rarity appears, appears exactly once, or appears in a particular order. Use an appropriate complete-key structure or an explicit coverage test when completeness is part of the contract. Do not invent runtime guarantees from an element annotation.

## D010 — No unconstrained scalar wrapper types

If every value of a primitive is legal, use the primitive. Do not create documentation-only aliases such as `type PlayerId = string`, nominal brands for arbitrary strings, or `{ value: string }` wrappers solely to distinguish identities.

A custom scalar must narrow legal values or record a real validated invariant:

<!-- example: constrained-replay-id -->

```ts
type ReplayId = `replay_${string}`;

function replayFileName(replayId: ReplayId): string {
  return `${replayId}.slp`;
}

const replayId: ReplayId = "replay_finals-1";
```

This example constrains only the prefix; it also permits `"replay_"`. It does not prove existence, authorization, a checksum, or a nonempty suffix. A runtime-only invariant may use a proof marker, but construction must pass through a validator that actually establishes that invariant. Do not add a stronger-sounding name without a stronger check.

## D011 — Match runtime validation APIs to the meaning of failure

Use `isX` for membership testing; `parseX` for a required valid value whose invalidity aborts the operation; and a named result union when callers need meaningful information about validation failure.

<!-- example: replay-id-validation -->

```ts
type ReplayId = `replay_${string}`;

function isReplayId(value: unknown): value is ReplayId {
  return typeof value === "string" && value.startsWith("replay_");
}

function parseReplayId(value: unknown): ReplayId {
  if (!isReplayId(value)) {
    throw new Error("Expected a replay_ identifier");
  }
  return value;
}
```

<!-- example: validation-result -->

```ts
type NonBlankPrompt = string & {
  readonly __validatedNonBlankPrompt: unique symbol;
};

type ValidPrompt = {
  readonly kind: "valid";
  readonly value: NonBlankPrompt;
};

type InvalidPrompt = {
  readonly kind: "invalid";
  readonly reason: "not-a-string" | "blank";
};

type PromptParseResult = ValidPrompt | InvalidPrompt;

function parsePrompt(value: unknown): PromptParseResult {
  if (typeof value !== "string") {
    return { kind: "invalid", reason: "not-a-string" };
  }
  if (value.trim().length === 0) {
    return { kind: "invalid", reason: "blank" };
  }
  // Runtime proof immediately above establishes this branded invariant.
  return { kind: "valid", value: value as NonBlankPrompt };
}
```

A final assertion is allowed only when TypeScript cannot express a runtime fact the implementation just established. Prefer ordinary narrowing when it already proves the return type, as in `parseReplayId`.

Type predicates and assertion-function annotations are contracts the compiler trusts; it does not prove that the body implements them correctly. Test both acceptance and rejection, including edge cases. A predicate must match the claimed set of values, not quietly test a stricter unrelated condition.

A statically expressible type still needs validation when the input arrives untrusted at runtime. Literal and template-literal annotations do not inspect JSON. Assertion functions remain exceptional rather than the normal construction path; returning the refined value keeps data flow explicit.

## D012 — Untrusted values start as `unknown`

Raw runtime input begins as `unknown` until a real check establishes its shape. Do not annotate unvalidated data with the type you hope it has.

<!-- example: unknown-boundary -->

```ts
// This ambient declaration represents an externally owned SDK typing defect.
declare function readLegacyProviderReply(): any;

function parseCoachReply(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Expected a text coaching reply");
  }
  return value;
}

function loadCoachReply(): string {
  const rawReply: unknown = readLegacyProviderReply();
  return parseCoachReply(rawReply);
}
```

An SDK returning `any` does not require us to create another `any` binding. Contain it directly as `unknown`. Only genuinely unavoidable integration syntax belongs in the narrow external exception.

Concrete DTO types are appropriate after an actual trusted layer establishes the contract. Generated interfaces, a client's generic type argument, or a framework's TypeScript signature alone are not runtime validation. Check what the boundary really guarantees. Validate first, then normalize external fields into owned types when useful.

## D013 — Explicit annotations by default; use `satisfies` when precision helps

Keep `: Type` as the default. Use `satisfies` when checking a broader contract while retaining the expression's more precise keys or structure materially helps.

<!-- example: precise-route-catalog -->

```ts
type ReplayRoute = {
  readonly path: string;
  readonly requiresAuth: boolean;
};

const REPLAY_ROUTES = {
  library: { path: "/replay-library", requiresAuth: false },
  analysis: { path: "/replay-analysis", requiresAuth: true },
} as const satisfies Readonly<Record<string, ReplayRoute>>;

type ReplayScreen = keyof typeof REPLAY_ROUTES;
const initialScreen: ReplayScreen = "library";
```

Here the catalog's actual keys are useful runtime configuration, and `ReplayScreen` retains `"library" | "analysis"`. The `as const` also preserves the immutable literal graph required for this constant. `satisfies Readonly<...>` alone checks compatibility; it does **not** apply readonly modifiers to the expression's inferred properties. Contextual typing can affect inference, so it is not a promise to preserve every literal automatically.

`as Type` is different: it asserts a type rather than validating runtime data. Reserve it for an immediately justified proof boundary or a genuine language/framework limitation. Do not use `as any` or `as unknown as TargetType` to silence ordinary compiler disagreements. Exceptional externally forced interop stays quarantined and explained, not normalized as application style.

## D014 — Function declarations for named behavior; arrows for function values

Use declarations for named reusable operations. Use arrows for callbacks, locally supplied behavior, and deliberately first-class function values. This is a house distinction: ordinary functions are also first-class values and can form closures.

<!-- example: function-roles -->

```ts
type EnemyDefinition = {
  readonly name: string;
  readonly isVisible: boolean;
};

function calculateDamage(baseDamage: number, multiplier: number): number {
  return baseDamage * multiplier;
}

const enemies: readonly EnemyDefinition[] = [
  { name: "Training dummy", isVisible: true },
];

const visibleEnemies: readonly EnemyDefinition[] = enemies.filter(
  (enemy: EnemyDefinition): boolean => enemy.isVisible,
);
```

Arrows capture lexical `this`; ordinary functions use call-dependent `this`. Do not replace one with the other without checking that semantic difference. Concise expression bodies are preferred when one clear expression says everything; braces and `return` add no useful information in that case. Use a block when statements or control flow need one. Do not organize source around hoisting convenience alone.

## D015 — Keep callback parameter and return types explicit

Contextual typing is not a reason to remove the callback's local contract. Keep the types beside the behavior, including concise arrows.

<!-- example: explicit-callback -->

```ts
type PlayerSummary = {
  readonly name: string;
  readonly isActive: boolean;
};

const players: readonly PlayerSummary[] = [];
const activePlayers: readonly PlayerSummary[] = players.filter(
  (player: PlayerSummary): boolean => player.isActive,
);
```

This communicates what the developer expects to receive and produce. Giving a coding agent nearby intent-bearing tokens is a design goal, not a universal measured guarantee of improved generation quality.

An explicit `boolean` return is meaningful here: JavaScript filtering uses truthiness, and TypeScript's ordinary `filter` predicate signature does not itself require a boolean. The house annotation intentionally narrows our callback's contract. A callback intended to narrow a union should declare the appropriate type-predicate return instead of discarding that intent as an ordinary boolean.

## D016 — Use `as const` selectively for useful literal precision

Use `as const` when exact literal values or tuple positions matter, not as a generic immutability button. Keep semantic domains explicit and check them with `satisfies` when both roles are useful.

<!-- example: exact-direction-tuple -->

```ts
type Direction = "up" | "down" | "left" | "right";

const DIRECTIONS = [
  "up",
  "down",
  "left",
  "right",
] as const satisfies readonly Direction[];

const firstDirection: "up" = DIRECTIONS[0];
const ORIGIN: readonly [0, 0] = [0, 0];
```

For a tiny exact tuple, a direct annotation such as `readonly [0, 0]` may be clearer than deriving a new semantic type from a value. Use the representation that preserves useful information without hiding the domain.

`as const` is erased at runtime. It does not freeze an object or make a separately referenced mutable object immutable. The list above also does not prove complete domain coverage just because it satisfies an array of `Direction`.

## D017 — Do not use non-null assertions

Do not use postfix `!` to erase `null` or `undefined`. There is no ordinary framework/lifecycle exception. Narrow, validate, or call a helper that establishes presence visibly.

<!-- example: require-player -->

```ts
type PlayerSummary = {
  readonly playerId: string;
  readonly name: string;
};

function requirePlayer(
  players: readonly PlayerSummary[],
  playerId: string,
): PlayerSummary {
  const player: PlayerSummary | undefined = players.find(
    (candidate: PlayerSummary): boolean => candidate.playerId === playerId,
  );
  if (player === undefined) {
    throw new Error("Player not found");
  }
  return player;
}
```

`players.find(...)!` changes what TypeScript believes without adding that check. Centralize repeated checks when the helper has a real purpose. This rule is about postfix non-null assertions; the separate class-field definite-assignment feature is outside this core prescription, not silently approved or banned by it.

## D018 — Freeze at runtime only when enforcement matters

Readonly types define the normal first-party contract. Add `Object.freeze()` only when runtime mutation is a concrete risk worth preventing, such as handing shared configuration to untyped integration code.

<!-- example: runtime-freezing -->

```ts
type AgentConfig = {
  readonly model: string;
  readonly retries: number;
};

const config: AgentConfig = Object.freeze({
  model: "arena-coach",
  retries: 3,
});
```

This example's fields are primitive values. Freezing is shallow: a nested object must be treated separately. Deep runtime enforcement is a deliberate boundary choice, not an application-wide default or a replacement for explicit types.

Freezing an object is not a security sandbox. It does not automatically prevent mutation through class methods, closures, accessors, or the internal state of objects such as `Map` and `Date`. Verify the actual representation and threat before claiming a runtime guarantee.

## D019 — Generics must earn their place

Use generics only for real supported type variation and useful relationships. A first-party abstraction used in only one concrete type configuration should be concrete. Do not preserve hypothetical reuse; generalize when a second legitimate need exists.

<!-- example: earned-generic -->

```ts
type PlayerSummary = {
  readonly name: string;
};

type CoachTip = {
  readonly advice: string;
};

function firstOrUndefined<T>(values: readonly T[]): T | undefined {
  return values[0];
}

const players: readonly PlayerSummary[] = [{ name: "Gohan" }];
const tips: readonly CoachTip[] = [{ advice: "Review your landing choices" }];
const firstPlayer: PlayerSummary | undefined = firstOrUndefined(players);
const firstTip: CoachTip | undefined = firstOrUndefined(tips);
```

Constrain a type parameter to capabilities the implementation requires. Do not add constraints that replace useful caller-specific information with an unnecessarily broad type.

Call-site inference is allowed when the concrete choice is already source-visible. Write type arguments when the choice itself matters or resolves ambiguity. This rule governs introducing our own generic abstractions, not whether using a library's `Promise<T>` or collection type requires multiple local instantiations.

A call such as `decode<CoachReply>(raw)` does not validate `raw` just because the type argument is explicit. Generic decoding must still use real runtime validation, for example through a supplied parser or schema. Custom type parameters are erased.

## D020 — Prefer data and functions; classes represent continuing runtime objects

Use plain data and named transformations for ordinary domain values. A noun, an ID, method grouping, or constructor validation does not justify a class.

<!-- example: player-value-transformation -->

```ts
type PlayerState = {
  readonly playerId: string;
  readonly maxHealth: number;
  readonly health: number;
};

function applyDamage(player: PlayerState, damage: number): PlayerState {
  if (!Number.isFinite(damage) || damage < 0) {
    throw new Error("Damage must be finite and nonnegative");
  }
  return { ...player, health: Math.max(0, player.health - damage) };
}
```

A class can earn its place as a continuing runtime object with a live resource, private evolving state, lifecycle, and temporal invariants. Several strong signals should normally coincide. A class remains a choice, not a requirement: a closure may represent the same behavior well.

<!-- example: live-replay-connection -->

```ts
interface ReplayConnection {
  send(command: string): void;
  close(): void;
}

class BrowserReplayConnection implements ReplayConnection {
  private readonly socket: WebSocket;
  private isClosed: boolean;

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.isClosed = false;
  }

  send(command: string): void {
    if (this.isClosed || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Replay connection is not open");
    }
    this.socket.send(command);
  }

  close(): void {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    this.socket.close();
  }
}
```

The instance owns its socket and enforces send/close behavior; copying its fields is not a new connection. A binding for this mutable runtime object uses `let`. `readonly socket` prevents replacing that field; it does not declare the socket immutable.

If a value can be serialized and reconstructed from its fields as the same kind of thing, it probably wants to be data. Treat that as a heuristic, not a JSON test that automatically turns every non-JSON value into a class. Genuine framework requirements and useful custom `Error` identity remain boundary exceptions already covered by the corresponding rules.

## D021 — Represent failure according to what it means

Use `T | undefined` for an ordinary lookup miss. Use named result variants for expected domain alternatives callers should inspect. Throw or reject when the operation cannot produce its promised normal result and the failure should propagate to an error boundary.

<!-- example: lobby-result -->

```ts
type LobbyJoined = {
  readonly kind: "joined";
  readonly slot: number;
};

type LobbyFull = {
  readonly kind: "full";
  readonly capacity: number;
};

type JoinLobbyResult = LobbyJoined | LobbyFull;

function joinLobby(playerCount: number, capacity: number): JoinLobbyResult {
  if (!Number.isSafeInteger(playerCount) || playerCount < 0) {
    throw new Error("Invalid player count");
  }
  if (!Number.isSafeInteger(capacity) || capacity < 1) {
    throw new Error("Invalid lobby capacity");
  }
  if (playerCount >= capacity) {
    return { kind: "full", capacity };
  }
  return { kind: "joined", slot: playerCount + 1 };
}
```

“Lobby full” is a normal domain decision; malformed internal counts are not another join outcome. Classify failure relative to the function's contract, not just how frequently it happens. The same condition can be ordinary absence in `findPlayer` and a violated requirement in `requirePlayer`.

Do not wrap every foreseeable failure only to recreate propagation manually, or hide expected alternatives solely behind exceptions. A result union does not prove a function cannot also throw. Custom `Error` classes need meaningful exception identity, metadata, or behavior; expected domain information normally stays plain typed data.

## D022 — Async structure should expose causality

Declare explicit `Promise<T>` return types on ordinary async functions. Await required completion, return or compose owned Promises, and use concurrency deliberately. Async generators have iterator contracts and are outside this ordinary async-function rule.

<!-- example: concurrent-replay-analysis -->

```ts
type ReplaySummary = {
  readonly replayId: string;
};

type CoachTip = {
  readonly advice: string;
};

interface ReplayAnalysisSource {
  loadReplay(replayId: string): Promise<ReplaySummary>;
  loadTip(replayId: string): Promise<CoachTip>;
}

async function loadAnalysis(
  source: ReplayAnalysisSource,
  replayId: string,
): Promise<readonly [ReplaySummary, CoachTip]> {
  const [replay, tip]: readonly [ReplaySummary, CoachTip] = await Promise.all([
    source.loadReplay(replayId),
    source.loadTip(replayId),
  ]);
  return [replay, tip];
}
```

The calls start the work; `Promise.all` observes their results. It fulfills after all fulfill, but rejects when an input rejects without automatically cancelling the others. `allSettled` observes every outcome, `race` uses the first settlement, and `any` uses the first fulfillment or rejects if all reject. Racing a timeout is not cancellation. Sequential or bounded execution remains appropriate when ordering, resource pressure, rate limits, or effects make unrestricted concurrency wrong.

Never accidentally float a Promise. Detached work must be visibly detached and have an intentional local or application-level failure owner.

<!-- example: supervised-detachment -->

```ts
interface TaskSupervisor {
  // The implementation owns rejection handling and task lifetime.
  detach(task: Promise<void>): void;
}

interface ReplayTelemetry {
  send(replayId: string): Promise<void>;
}

function reportReplayViewed(
  supervisor: TaskSupervisor,
  telemetry: ReplayTelemetry,
  replayId: string,
): void {
  supervisor.detach(telemetry.send(replayId));
}
```

A local `void task.catch(handler)` is valid only when the terminal handler itself is safe: a thrown exception or rejected Promise from the handler creates another rejection that also needs an owner. A bare `void task` does not handle rejection. A process-wide unhandled-rejection listener is not a substitute for intentional task ownership, and non-awaited work is not guaranteed to survive page or serverless-request termination.

Prefer `async`/`await` for ordinary control flow. Direct Promise chains remain available where composing a Promise as a value is clearer. Keep callback contracts explicit, and preserve the failure semantics established above.

## D023 — Keep module boundaries narrow and named

Named exports are the default. Leave implementation details unexported and use `import type` for type-only dependencies. The following three files form one example.

```ts
// file: replay-types.ts
export type ReplaySummary = {
  readonly replayId: string;
  readonly label: string;
};
```

```ts
// file: replay-label.ts
import type { ReplaySummary } from "./replay-types";

function normalizeLabel(label: string): string {
  return label.trim();
}

export function replayLabel(replay: ReplaySummary): string {
  return normalizeLabel(replay.label);
}
```

```ts
// file: replay-api.ts
export { replayLabel } from "./replay-label";
export type { ReplaySummary } from "./replay-types";
```

The last file is justified only when it represents an intentional subsystem entry point. Do not create broad `export *` barrels merely to shorten paths. A named import may still use an explicit `as` alias; named exports make the declared identity checkable and renaming visible, not impossible.

Default exports remain exceptions for genuine framework requirements or material interoperability benefits. Type-only imports are erased; an ordinary import is required when a value is needed at runtime, such as a class used with `new` or `instanceof`. Keep intentional side-effect imports at bootstrap/composition boundaries. Module-local scope is an API boundary, not a secrecy guarantee for shipped client code.

## D024 — Use semantic names with conventional TypeScript casing

Use PascalCase for types, interfaces, classes, and named variants. Use camelCase for ordinary values, functions, parameters, properties, and methods. Boolean names should read as predicates, and collections should usually use meaningful plurals.

<!-- example: semantic-names -->

```ts
type AgentEndpoint = {
  readonly apiUrl: string;
  readonly isEnabled: boolean;
};

const DEFAULT_REQUEST_TIMEOUT_MS: number = 30_000;
const endpoints: readonly AgentEndpoint[] = [];
const canRequestAdvice: boolean = endpoints.length > 0;

function endpointUrl(endpoint: AgentEndpoint): string {
  return endpoint.apiUrl;
}
```

Avoid declaration-category names such as `IAudioOutput`, `TPlayerState`, or `AudioOutputImpl`. Prefer a real distinction such as `BrowserAudioOutput`. Treat acronyms as ordinary words: `HttpClient`, `apiUrl`, `parseJson`.

Not every `const` is an all-caps constant. Reserve SCREAMING_SNAKE_CASE for genuine fixed module-level defaults, protocol values, and catalogs whose constancy is part of their role. Ordinary immutable bindings remain camelCase.

Prefer lowercase kebab-case source paths such as `replay-label.ts` and `worker-client.ts`. Preserve externally required spelling at boundaries, including wire fields, tool filenames, and component capitalization required by JSX. Do not rewrite an external contract merely to make its names look owned.

## D025 — Automate formatting and enforce reliable rules in CI

Use one deterministic formatter for mechanics, a TypeScript-aware lint system for reliable correctness/house checks, and an independent compiler check. Pin each repository's tool versions and configuration. The house contract does not permanently mandate a formatter brand or one target-specific configuration.

An implementation might expose these commands after installing and pinning its selected tools:

```json
{
  "scripts": {
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "check": "npm run format:check && npm run typecheck && npm run lint && npm test"
  }
}
```

This is not a complete package manifest; the repository supplies its test command, dependencies, and target-specific configuration. Formatting drift, type errors, and enabled lint violations fail CI. Do not accumulate a permanent warning tier. Use relevant automated tests where they exist.

Mechanically check only rules that are trustworthy. Do not blindly enable presets that erase explicit annotations, rewrite intentional mutable `let` bindings to `const`, or treat bare `void promise` as sufficient handling. Keep formatter and lint responsibilities separate. Suppress only a narrowly inapplicable rule, explain the reason, and detect unused suppressions. Deliberately exclude generated/vendor code rather than disguising owned code as external.

Architectural judgment remains necessary for correct validation, alias ownership, genuine generic reuse, class suitability, domain-error semantics, and task supervision. Passing automation is not proof of all those properties.

## Scope and future additions

The core guide covers the common first-party language and architecture decisions above. Detailed framework conventions, runtime/module baselines, advanced generics, cancellation/retry mechanisms, and other unprescribed topics can be added later. They do not silently inherit a house rule from whichever ecosystem convention happens to be popular.

The release audit checks the guide and its published examples. Hosting a guide does not certify every older implementation file in the hosting application as conformant; adopting the house style in an existing codebase is a separate migration.

## Language references

These references explain language and tooling behavior; the house choices above remain the guide's own conventions.

- [TypeScript object types and readonly](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [TypeScript narrowing and type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [The satisfies operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [Const assertions and their limits](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html)
- [TypeScript modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [JavaScript Promise operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Type-aware linting](https://typescript-eslint.io/getting-started/typed-linting/)
