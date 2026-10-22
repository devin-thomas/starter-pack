## Why use this Rust guide?

Rust makes ownership and borrowing part of the source contract. This guide carries the established preference for explicit types, named states, deliberate failure handling, and clear resource owners into Rust's native language tools.

## What is settled and what is not

The cross-language principles have established precedent. RS-Q01 B is now accepted: narrowly contained first-party unsafe may serve necessary integration and demonstrated systems or performance requirements. The guide explains why this exception is necessary for systems work and how explicit evidence, ownership, and safety obligations preserve the house strictness. No owner-choice questions remain; the complete guide retains its review status.

## How to apply it

Read the rules alongside the target repository's toolchain, public contracts, and existing decisions. Keep runtime, dependencies, targets, and application architecture specific to the project. Apply the accepted unsafe policy through its documented conditions and preserve any stricter local restriction until an authorized project change updates it.
