## Why use this Kotlin guide?

Kotlin can express a stable reference, a read-only collection, an immutable value, and an owner of mutable state. Those are useful distinctions—not interchangeable promises. This guide makes the intended contract visible in source, so developers and agents can change a feature without guessing who may change its state or how long its work should live.

## What it covers

The language rules favor explicit types, named sealed states, exhaustive consumers, meaningful failure contracts, and small abstractions. The Android TV profile adds Compose lifecycles, remote-first input, focus restoration, and service-owned background playback when the product needs it.

## How to apply it

Read the guide as one house contract, not a mandate to install every Android library or add a layer for every function. Keep the project's toolchain and product requirements in its repository. Adopt the rules at the actual owning boundaries, and distinguish successful code checks from behavior verified on a television.
