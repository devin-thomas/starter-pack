## Why use this Godot guide?

Godot gives you several valid ways to represent the same broad idea: behavior can live on a Node, Resource, RefCounted object, scene, Autoload, signal relationship, group, or direct call. That flexibility is useful, but a project becomes harder to read when every feature chooses a different convention.

This guide makes those seams explicit. Commands travel toward known owners, events travel outward, scene boundaries own their internals, global lifetime must be earned, lifecycle callbacks each have one job, and every time-based responsibility uses the clock that actually owns it.

It is also designed for AI-assisted development. Explicit types, stable ownership, predictable scene boundaries, and honest validation give a coding agent enough nearby context to change a project without opportunistically inventing managers, factories, inheritance trees, or global state.

The guide is deliberately **hard-pinned to Godot 4.7.2**. Moving to another engine version is a migration decision, not an automatic update to the rules.
