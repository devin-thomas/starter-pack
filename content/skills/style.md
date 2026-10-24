---
skill_id: style
updated: 2026-10-23
---

# Style

Apply the finalized coding guide for the language or framework you are working in.

## Use this when

Ask an agent to follow your coding conventions, review a diff, or refactor code to the house style. All nine guides are finalized: TypeScript, Godot, Kotlin, React + TypeScript, Python, Swift + SwiftUI, JavaScript, Dart + Flutter, and Rust.

## How it works

The agent reads the [style catalog](/style), loads the matching guide, and applies its accepted rules. React and JavaScript also use the TypeScript companion. Existing repository instructions and explicit user requirements take precedence.

For existing code, the default is a scan with concrete locations and proposed changes. Ask for `style refactor` to apply those changes and run the repository checks. New code follows the matching guide directly.

## Try it

> Use the Style skill to review this diff against the TypeScript guide.

The result identifies each affected rule, file location, and suggested change. [Browse all nine guides](/style).
