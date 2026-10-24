---
skill_id: immutable-reports
updated: 2026-10-23
---

# Immutable Reports

Keep plans and verification evidence as numbered snapshots with a synchronized project index.

## Use this when

Record a plan, preserve approval, document a completed or failed implementation, revise a proposal, or audit the history of a project. It works with ordinary Markdown files in any agent harness.

## How it works

The agent inspects the existing ledger and allocates the next number separately for plans and walkthroughs. It saves a complete snapshot in `reports/plans/` or `reports/walkthroughs/`, then adds exactly one entry to `reports/INDEX.md`.

A revision creates a new snapshot. Earlier snapshots stay intact; the index tracks the current status and links the evidence that supports it. Recording a plan preserves decisions already made and grants no new implementation authority.

## Inputs and outputs

Provide the plan, decisions, approval, or observed verification results. The result is a durable Markdown snapshot and an updated ledger with resolving links. Partial and failed work are recorded honestly.

## Try it

> Use Immutable Reports to preserve this implementation plan and its approved decisions in the project's existing ledger.
