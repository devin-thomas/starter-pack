## Why use this Rust guide?

Rust makes ownership and borrowing part of the source contract. This guide carries the established preference for explicit types, named states, deliberate failure handling, and clear resource owners into Rust's native language tools.

## What is settled and what is not

The cross-language principles have established precedent. Their Rust wording is a review draft, with one unresolved owner choice: whether first-party unsafe is limited to necessary platform/FFI adapters or may also serve a demonstrated systems or performance requirement. The guide explains both choices and the safety obligations shared by either one.

## How to apply it

Read the rules alongside the target repository's toolchain, public contracts, and existing decisions. Keep runtime, dependencies, targets, and application architecture specific to the project. The in-progress status does not authorize a migration or a new unsafe exception.
