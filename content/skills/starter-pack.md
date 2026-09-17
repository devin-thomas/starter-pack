---
skill_id: starter-pack
updated: 2026-09-17
---

# Starter Pack

Start, resume, or inspect Starter Pack learner progress and route the current phase to its focused resources.

## Use this when

You are beginning or returning to the Starter Pack curriculum and want your agent to know where you left off. The companion skill reads your saved progress, figures out your current phase and step, and loads only the guidance you need next.

Not the right fit if you already know which specific skill you want to use. Go to that skill directly instead.

## How it works

The companion skill manages your journey through the three phases:

1. **Load your state** — It reads your existing progress file, identifies your current phase, and preserves everything you have already completed. If you are starting fresh, it initializes a new progress record.

2. **Route to the right resources** — Based on your phase and step, it fetches only the relevant phase guide and skill instructions. Phase 1 content comes bundled in the instruction packet so your agent does not need a separate fetch.

3. **Guide one step at a time** — It presents one next action, accepts your reports on what worked, and records the outcome. It asks only for facts that affect the next action and cannot be inferred.

4. **Record and hand off** — After each session, it runs a closeout check: saves your progress, clears stale pointers, and states what is complete, what is deferred, and the single next action. On a phone without file tools, it gives you the full updated JSON to copy or download.

5. **Transition between phases** — Phase 1 happens on your phone. When you are ready for a computer, the skill hands off your progress with the selected harness, completed work, and next action. Phase 2 starts with Computer Setup and proceeds through Quick Build.

## Inputs

- **An instruction packet or starting prompt** — paste the prompt from the site or attach the downloaded packet
- **Your saved progress file** — if returning, provide your existing `starter-progress.json`
- **Your decisions** — the skill asks focused questions when it needs information for the next step

## Outputs

- A maintained progress record tracking completed steps, choices, and notes
- Phase-appropriate guidance loaded on demand
- A compact handoff when transitioning between devices or sessions

## Prerequisites

None. This is the entry point for the entire curriculum.

## Installation and use

Copy the starting prompt from the site or download the instruction packet:

```
https://starter.devthomas.site/#starting-prompt
```

Paste it into your agent to begin. The packet bundles this companion skill, Phase 1 instructions, the progress guide, template, and schema.

## Example

> Returning learner with saved progress: "Here is my starter-progress.json. I finished Phase 1 on my phone and now I'm on my computer."

The agent reads the progress file, confirms Phase 1 completion, identifies the computer harness, and routes to Computer Setup as the next step. It preserves all completed work and does not repeat intake questions.
