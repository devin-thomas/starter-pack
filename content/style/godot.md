---
id: godot
title: Godot
summary: A Godot 4.7.2 and GDScript house style built around explicit ownership, semantic engine boundaries, and agent-readable architecture.
human_summary: Godot is a scene-based game engine; this guide turns its flexible scenes, nodes, signals, Resources, lifecycle hooks, and GDScript features into one explicit architecture pinned to Godot 4.7.2.
status: stable
updated: "2026-09-25"
accepted_through: G025
version: 1.0.0
route: /style/Godot
---

# Godot Style Guide

For agents: apply the accepted rules below to first-party Godot 4.7.2 projects using GDScript. This guide is hard-pinned to Godot 4.7.2; later engine behavior is not silently imported. Preserve engine-owned, addon-owned, serialized, and platform-owned contracts at their boundaries. Uncovered specialized topics are not implicit house rules.

## G001 — Write explicit static types by default

Use explicit static annotations wherever GDScript provides a useful annotation point. Types are source-level contracts for humans and coding agents, not merely information the editor can infer.

Prefer:

~~~gdscript
@export var move_speed: float = 240.0
var _input_direction: Vector2 = Vector2.ZERO

func _physics_process(delta: float) -> void:
	var direction: Vector2 = _input_direction
~~~

Do not replace explicit declarations with inferred static typing solely because := can infer the same type. The annotation should preserve the narrowest truthful contract.

## G002 — Enforce maximum practical static safety

Treat missing type declarations, inferred declarations that bypass G001, inference from Variant, and unsafe calls/casts/member access as first-party correctness failures.

Promote these warnings to errors in first-party code where Godot 4.7.2 supports it:

- UNTYPED_DECLARATION
- INFERRED_DECLARATION
- INFERENCE_ON_VARIANT
- UNSAFE_CALL_ARGUMENT
- UNSAFE_CAST
- UNSAFE_METHOD_ACCESS
- UNSAFE_PROPERTY_ACCESS
- UNSAFE_VOID_RETURN

Keep context-sensitive hygiene warnings advisory unless they prove enough to justify an error. Use narrow warning suppressions only at real proof or integration boundaries. Third-party addons do not become first-party code merely because they are checked into res://addons.

## G003 — Follow Godot naming and give types real identity

Use:

- snake_case for files, folders, functions, variables, and signals;
- PascalCase for classes and Node names;
- CONSTANT_CASE for constants and enum members;
- singular PascalCase for enum types;
- a leading underscore for private/internal members;
- event/past-tense signal names;
- natural predicate names such as is_grounded, has_target, and can_dash.

If another first-party script needs a script as a type, that script must declare class_name.

~~~gdscript
class_name PlayerController
extends CharacterBody2D
~~~

Keep the file/class relationship obvious: player_controller.gd → PlayerController. A scene-local script may remain unnamed until global type/editor identity is actually useful.

## G004 — Keep declarations in Godot's role-first order

Use this script order:

1. @tool, @icon, @static_unload
2. class_name
3. extends
4. documentation
5. signals
6. enums
7. constants
8. static variables
9. exported variables
10. regular variables
11. @onready variables
12. _static_init()
13. static methods
14. built-in virtual callbacks
15. overridden custom methods
16. remaining methods
17. inner classes

Within comparable groups, public declarations come before private ones. Keep local variables near first use. Do not turn locals into members just to organize a file, and do not use regions to hide a script that owns too many responsibilities.

## G005 — Acquire Node references according to relationship semantics

Use the reference form that tells the truth about the dependency.

~~~text
Same-scene semantic role; hierarchy is not the contract
    → %UniqueName

Local structural relationship is intentionally part of the contract
    → $Path

Collaborator/configuration supplied from outside private scene structure
    → typed external Node reference

Dynamic NodePath itself is meaningful
    → get_node() / NodePath API
~~~

Examples:

~~~gdscript
@onready var _health_bar: ProgressBar = %HealthBar
@onready var _collision_shape: CollisionShape2D = $CollisionShape
~~~

Avoid brittle parent traversal such as ../../.. as dependency injection. Acquire stable references once; do not cache identities that are genuinely dynamic.

## G006 — Export only intentional authoring configuration

An exported property is part of the Inspector-facing authoring API.

~~~gdscript
@export_range(1, 20, 1)
var max_health: int = 5

var _current_health: int = 5
~~~

Export configuration, not ordinary mutable runtime state. If one value is invariant across all instances, prefer a constant. Use range, enum, flags, unit, grouping, and other hints when they encode real authoring constraints.

Exported Resources are load dependencies. Do not export a large Resource or PackedScene merely to hold a reference when the real requirement is deferred loading.

Do not depend on Inspector overrides in _init(); serialized values are applied later.

## G007 — Connect signals in code at the relationship-owning boundary

The event owner declares and emits a typed signal. The object/composition boundary that owns the emitter-receiver relationship normally establishes the connection in code.

~~~gdscript
func _ready() -> void:
	_health.health_depleted.connect(_audio.play_death_sound)
~~~

Prefer first-class signal.connect() and signal.emit() APIs over string-based connection APIs.

Do not make editor-persisted signal connections the ordinary first-party source of truth. Do not add symmetric disconnect boilerplate when object lifetime already removes the connection; disconnect explicitly when the relationship changes while both objects remain alive.

Use CONNECT_ONE_SHOT for a true next-event-only relationship. Use deferred connections only when deferred timing is part of the contract.

## G008 — Commands and queries are calls; events are signals

Use a direct method call when one object intentionally asks a known collaborator to do something or return information.

~~~gdscript
_weapon.fire()
var damage: int = _weapon.calculate_damage()
~~~

Use a signal when an object announces a fact that zero, one, or many listeners may observe.

~~~gdscript
signal health_depleted

func take_damage(amount: int) -> void:
	# Mutate owned state first.
	if _health == 0:
		health_depleted.emit()
~~~

A command may cause an event: Player calls Weapon.fire(), then Weapon may emit fired. Do not disguise required one-to-one control flow as a signal just to reduce visible coupling.

## G009 — Give self-contained composed game objects their own scenes

Create a saved scene when a subtree has become a coherent game/editor object that should own its internal composition, configuration, lifecycle, and root API.

Reuse strengthens the case but is not required.

~~~text
door.tscn

Door
├── Sprite
├── CollisionShape
├── InteractionArea
└── OpenSound
~~~

Outside code should call Door behavior rather than reach through to manipulate those internals.

A script-only Node remains valid when a .tscn wrapper would add no meaningful declarative composition or authored object identity. A unique Boss can still deserve boss.tscn; "used twice" is not the scene threshold.

## G010 — Compose by default; inheritance must prove is-a

Use composition for optional, swappable, orthogonal, or independently meaningful capabilities.

~~~text
Enemy
├── Health
├── Movement
├── Targeting
└── Weapon
~~~

Use script or scene inheritance only when the derived object is genuinely a specialized form of the base object and remains valid wherever the base contract is expected.

Code reuse alone does not justify inheritance. A subclass that repeatedly overrides base behavior to do nothing is evidence that the base contract is lying. Do not create a base class or generic component for hypothetical future reuse.

## G011 — Use the lightest truthful runtime representation

Choose representation by semantics:

~~~text
Fundamentally belongs in the live SceneTree
    → Node

Authored/serialized Godot asset identity is fundamental
    → Resource

Continuing runtime object with identity/state/invariants but no tree or asset role
    → RefCounted

Values alone are enough
    → built-in typed data

No continuing object exists
    → function
~~~

Do not use Node because "Godot code lives on Nodes." Do not use Resource merely because something is data or might be serialized someday.

Keep authored Resource definitions separate from per-instance mutable runtime state unless sharing/localization is deliberately part of the model. Write extends RefCounted explicitly when that representation is an architectural choice.

## G012 — State flows through one authoritative owner

The canonical direction is:

~~~text
Writes → toward the owner through methods
Reads  → through deliberate query APIs
Events → outward through signals
~~~

Prefer semantic operations:

~~~gdscript
_health.take_damage(2)
_weapon.consume_ammo(1)
_door.unlock()
~~~

over external raw property mutation.

A coordinator may orchestrate several owners without absorbing their underlying state ownership. Do not expose mutable collections in a way that silently grants parallel write authority. Keep derived state derived unless a concrete caching need exists and one owner controls invalidation.

## G013 — Autoloads are exceptional global infrastructure

Use an Autoload only when the system genuinely has project/session-wide lifetime and access needs that cross ordinary scene boundaries.

Strong candidates include scene-transition coordination, save/load orchestration, or a truly persistent quest/dialogue/music system.

Do not create a generic GameManager state bucket. Global access does not weaken G012:

~~~gdscript
QuestSystem.complete_quest(quest_id)
~~~

is preferable to external mutation of QuestSystem internals.

Use static functions/values for shared behavior that has no continuing runtime instance or Node lifecycle. Do not move a scene-local dependency to Autoload merely to avoid passing a reference.

## G014 — Groups represent semantic sets, not hidden services

Use groups when membership itself is meaningful and callers genuinely want the current set.

~~~gdscript
const GROUP_ENEMIES: StringName = &"enemies"

var enemies: Array[Node] = get_tree().get_nodes_in_group(
	GROUP_ENEMIES,
)
~~~

Important first-party group names should use stable StringName constants.

A group broadcast is valid only when every member really shares the command contract and fan-out to all current members is the intended operation.

Do not use a one-member group as a service locator for "the player" or another singleton-like dependency. Group membership does not replace a type contract.

## G015 — Give each lifecycle callback one semantic job

~~~text
_init()         intrinsic object construction
_enter_tree()   repeated active SceneTree entry
_ready()        fully composed scene initialization, normally once
_exit_tree()    ending active SceneTree membership
_notification() lower-level engine event with no clearer callback
~~~

Do not read final Inspector-authored values or child dependencies in _init().

Use _enter_tree() / _exit_tree() for work that must pair with every tree membership. Use _ready() for setup that requires @onready references, children, or authored configuration.

Prefer dedicated callbacks over a giant _notification() switchboard. request_ready() is exceptional; repeated tree-entry semantics normally belong in _enter_tree().

## G016 — Give each time-based responsibility one semantic clock

~~~text
Fixed simulation / collision-sensitive state
    → _physics_process()

Rendered-frame presentation / nonphysics frame work
    → _process()

Discrete "after/every N seconds"
    → Timer / SceneTreeTimer

No current per-frame responsibility
    → disable that processing loop
~~~

Do not make the fixed physics tick a universal gameplay clock, and do not make render frames a universal gameplay clock.

Avoid independently mutating the same state transition from both process loops. A manual countdown is justified when its changing intermediate value itself belongs to that clock, not merely to recreate Timer behavior.

## G017 — Route input by semantic ownership

Use InputMap action names as the normal gameplay contract.

~~~text
Discrete gameplay action
    → InputMap + _unhandled_input()

Held / analog state
    → Input polling in the clock that owns the resulting state

Control-owned UI input
    → Control / GUI input path

Must see event before UI
    → _input()

Physical key/button itself matters
    → concrete InputEvent type
~~~

Do not hardcode Space means jump when the domain concept is jump. Poll movement in the physics loop when movement is physics-owned. Do not create a general PlayerInput/buffering subsystem before replay/network/buffering requirements actually exist.

## G018 — Use await for short, owned, linear sequences

A good await sequence has one clear owner and one clear continuation.

~~~gdscript
func play_intro() -> void:
	_animation_player.play(&"intro")
	await _animation_player.animation_finished
	_enable_player_control()
~~~

Use persistent signal connections for ongoing observation. Use explicit state machines for long-lived, branching, interruptible, cancellable, or externally controlled temporal behavior.

If the caller needs completion/result, the caller awaits too. Calling a coroutine without await is a deliberate detached operation and should be exceptional.

An await crosses time; revalidate dependencies after suspension when they can genuinely become invalid. Do not use await inside per-frame callbacks as a normal delay mechanism.

## G019 — Let loading communicate ownership and timing

Use this ladder:

~~~text
Exact dependency chosen by code and always needed
    → preload()

Dependency chosen in Inspector and should load with the owner
    → typed @export Resource / PackedScene

Dependency chosen in Inspector but should load later
    → @export_file path

Runtime-selected or intentionally on-demand dependency
    → load()

Need explicit cache/type/dependency/background controls
    → ResourceLoader

Runtime load may visibly block
    → threaded ResourceLoader
~~~

A first-party script needed as a type uses class_name rather than script preload merely for naming.

Loading a PackedScene and instantiating it are separate operations. Repeated load() normally reuses Godot's Resource cache; it does not promise a fresh mutable Resource.

## G020 — Spawn at an explicit ownership boundary

The boundary that decides an instance should exist owns the construction sequence:

~~~text
obtain PackedScene
    → instantiate
    → configure required pre-tree state
    → add_child under the lifetime owner
~~~

If _ready() requires runtime-supplied configuration, provide it before adding the Node beneath an in-tree parent.

The semantic parent normally owns ordinary runtime lifetime. Prefer queue_free() for ordinary Node removal.

Do not introduce a universal SceneFactory unless construction policy itself becomes genuinely shared/complex. Reparenting is an ownership/lifetime change, not a visual convenience.

Use SceneTree scene-change APIs for replacing the main scene rather than rebuilding current-scene bookkeeping manually.

## G021 — Distinguish bugs, expected failures, and diagnostics

Use different mechanisms for different meanings:

~~~text
Programmer invariant / impossible internal state
    → assert()

Expected recoverable failure
    → Error, nullable return, or named domain result

Serious runtime diagnostic
    → push_error()

Actionable suspicious/degraded condition
    → push_warning()

Invalid external/user/data/configuration state possible in release
    → runtime validation + safe failure/recovery path
~~~

Assertions are debug-only and their expressions must have no side effects. Never make assert() the only release protection for data that can actually be invalid.

push_error() reports a problem; it does not define control flow. Use null only for expected absence, not as one value meaning failed, invalid, cancelled, and missing simultaneously.

## G022 — Organize res:// by game concept and ownership

Prefer feature/domain colocation:

~~~text
res://
├── characters/
│   ├── player/
│   └── enemies/
├── combat/
├── levels/
├── ui/
├── shared/
├── autoload/
├── tests/
└── addons/
~~~

Keep a scene, its script, feature-specific Resources, and local assets near one another. Move content to shared/ only after it is genuinely shared.

Do not organize a growing game primarily into global scenes/, scripts/, resources/, textures/, and audio/ silos.

Keep third-party/plugin content isolated under addons/ and do not rewrite it merely to satisfy first-party style. Feature tests stay with the feature; cross-feature tests may live at top level.

## G023 — Test public behavior; isolate tool and debug code

Test the smallest truthful unit.

Keep pure logic testable outside SceneTree when it does not need Node semantics. Use the smallest real scene fixture when lifecycle/composition matters. Test through public commands, queries, and signals rather than normalizing private-state mutation.

Add deterministic regression tests for bugs when reasonably automatable.

This guide is test-framework-neutral; any third-party Godot test framework must be deliberately selected and pinned for Godot 4.7.2.

Use @tool only when editor execution is itself a feature. Use Engine.is_editor_hint() when editor/runtime behavior differs. Keep editor mutations narrow because tool code can alter scenes during authoring.

Use OS.is_debug_build() for debug-only runtime instrumentation, never for release correctness or secrets.

## G024 — Automate only what tools can actually prove

First-party GDScript follows the Godot 4.7.2 mechanical style where this guide has not deliberately overridden it: UTF-8 without BOM, LF, tabs, trailing commas in multiline collections/enums, one statement per line, normal whitespace, double quotes by default, English and/or/not operators, and code lines under 100 characters.

Machine-enforce G001/G002 warnings and other reliably detectable rules. Verify that automation uses Godot 4.7.2.

Useful native gates include:

~~~text
godot --version
godot --headless --path <project> --import
godot --headless --path <project> --script <script> --check-only
~~~

Run the repository's real automated tests as part of validation.

Do not claim a formatter, regex, or generic lint preset can prove architectural decisions such as correct ownership, scene boundaries, signal semantics, Autoload justification, or clock choice. Those remain review obligations.

## G025 — Agents preserve semantic ownership and verify reality

Before editing, inspect the owning scene, scripts, Resources, local project instructions, and relevant tests.

Then:

~~~text
read local context
→ identify the real owner/boundary
→ make the smallest coherent change
→ preserve external/project contracts
→ validate with Godot 4.7.2 + repository checks
→ report deliberate exceptions
~~~

Do not introduce managers, globals, factories, base classes, generic components, Resource wrappers, or service locators merely because an agent can generate them cheaply.

Do not silently change project-wide Autoloads, InputMap, physics settings, warning levels, main scene, rendering/project settings, addons/dependencies, export presets, shared group vocabulary, or persistent schemas.

Treat .tscn/.tres as source-controlled project data: text edits are allowed when understood, but reopen/import/parse afterward. Do not invent Resource UIDs or generated import/cache content.

Never claim tests/builds passed unless they actually ran. Keep justified exceptions narrow and record why they exist.

## Scope and future additions

The 1.0 core covers common first-party GDScript, scene architecture, ownership, lifecycle, loading, testing, and agent-contribution decisions for **Godot 4.7.2**.

Specialized multiplayer, advanced threading, editor-plugin architecture, shaders, navigation/AI-specific systems, platform integration, performance-specialized escape hatches, and addon interoperability remain additive 1.x topics unless real project evidence requires reversing a core rule.

## Engine references

These references describe Godot behavior. The house choices above remain this guide's own conventions.

- https://docs.godotengine.org/en/4.7/tutorials/scripting/gdscript/static_typing.html
- https://docs.godotengine.org/en/4.7/tutorials/scripting/gdscript/warning_system.html
- https://docs.godotengine.org/en/4.7/tutorials/scripting/gdscript/gdscript_styleguide.html
- https://docs.godotengine.org/en/4.7/tutorials/best_practices/scene_organization.html
- https://docs.godotengine.org/en/4.7/tutorials/best_practices/scenes_versus_scripts.html
- https://docs.godotengine.org/en/4.7/tutorials/best_practices/node_alternatives.html
- https://docs.godotengine.org/en/4.7/tutorials/best_practices/autoloads_versus_regular_nodes.html
- https://docs.godotengine.org/en/4.7/tutorials/scripting/groups.html
- https://docs.godotengine.org/en/4.7/tutorials/best_practices/godot_notifications.html
- https://docs.godotengine.org/en/4.7/tutorials/scripting/idle_and_physics_processing.html
- https://docs.godotengine.org/en/4.7/tutorials/inputs/input_examples.html
- https://docs.godotengine.org/en/4.7/tutorials/scripting/resources.html
- https://docs.godotengine.org/en/4.7/classes/class_resourceloader.html
- https://docs.godotengine.org/en/4.7/tutorials/io/background_loading.html
- https://docs.godotengine.org/en/4.7/tutorials/scripting/nodes_and_scene_instances.html
- https://docs.godotengine.org/en/4.7/tutorials/best_practices/project_organization.html
- https://docs.godotengine.org/en/4.7/tutorials/plugins/running_code_in_the_editor.html
- https://docs.godotengine.org/en/4.7/tutorials/editor/command_line_tutorial.html
