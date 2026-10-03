---
skill_id: cappy
updated: 2026-09-27
---

# Cappy

Set up and run Cappy to capture reproducible game footage: connect the Godot addon, configure OBS and FFmpeg presets, record, replay, compare builds, and read Cappy errors.

## Use this when

You are making a game and want footage you can reproduce: the same scenario with the same parameters, or a freeform play session replayed exactly, recorded through OBS and cut into clips, stills, and thumbnails by FFmpeg. Cappy writes a manifest for every capture with hashes, timing, and the game's event timeline, so a clip can be anchored to a moment like `BOSS_DEFEATED` instead of a guessed second, and two builds can be compared frame by frame.

Not the right fit for general screen recording, video editing, streaming, or configuring OBS itself. Cappy never creates or edits OBS scenes.

## How it works

The skill takes the agent from nothing to one verified capture, reading before it records:

1. **Install Cappy and find the project** — Checks Node.js 24+, installs `@uppercut-labs/cappy` as a dev dependency, and finds the game folder that holds `cappy.config.json`. It never installs the unrelated unscoped `cappy` package.

2. **Connect the game** — Copies the four-file Godot addon from the installed package (`addons/cappy/`) into the game, then registers a scenario (a named, parameterized moment) or a replay provider (the game's own input log). Event times are simulation milliseconds, so the same input gives the same timeline.

3. **Write the configuration** — Starts from a minimal `cappy.config.json`. The OBS password stays in an environment variable and never enters the file.

4. **Check, then explore** — Runs `cappy doctor` and `cappy scenarios`, which read only, and fixes every failure before anything records.

5. **Capture** — Asks before the first recording, then runs a scenario or records a session and replays it, first with `--no-capture` to verify the playback, then through OBS. A capture counts only when its manifest says `succeeded`.

6. **Compare and export** — When asked, scores two captures or two builds, exports the timeline as captions, and previews cleanup with `--dry-run` before deleting anything.

## Inputs

- **A game** — a Godot 4.x project (other engines can speak Cappy's protocol)
- **An OBS scene** — made by you, showing the game window
- **Approval** — before the first recording and before any deletion

## Outputs

- A working `cappy.config.json` and capture presets
- Verified captures: master, derivatives, and `manifest.json` under `.cappy/captures/`
- Replayable sessions, comparisons, and timeline exports
- An honest list of what was not verified, such as capture on a host without OBS or a display

## Prerequisites

- **macOS or Windows** (accepted with real OBS, FFmpeg, and Godot 4.7.2) or **Linux** (accepted, real OBS capture not yet verified)
- **Node.js 24 or newer** and the **`@uppercut-labs/cappy`** npm package
- **FFmpeg and ffprobe**, and **OBS Studio 28+** with its WebSocket server on — needed for capture; `doctor`, `scenarios`, and replay without capture work without OBS

## Installation and use

Cappy is a product-specific agent skill that ships inside the `@uppercut-labs/cappy` npm package, at `.agents/skills/cappy/SKILL.md`. Install it in your game project with `npm install --save-dev @uppercut-labs/cappy`; the skill is then at `node_modules/@uppercut-labs/cappy/.agents/skills/cappy/SKILL.md`. Cappy's own tests fail whenever the skill names a command, flag, error code, or addon call that does not exist. Once Cappy is installed, point your agent at the skill:

```
Read the Cappy skill and help me capture the boss intro in my Godot game.
```

The skill reads before it records: it asks before OBS records the screen and before anything is deleted, and it never edits OBS scenes or stores your OBS password.

## Example

> "My Godot party game has a board turn I want to capture for the trailer, and I want the same shot again after I change the camera."

The agent checks Node 24, installs the Cappy package, copies in the addon, and registers a `board_turn` scenario with a `seed` parameter. It writes a config with a `trailer` preset that cuts a clip from `DICE_ROLLED` to `TURN_ENDED`, runs `cappy doctor` (all checks pass) and `cappy scenarios` (it lists `board_turn`), then asks before recording. `cappy run board_turn --param seed=7 --preset trailer` produces a master, the clip, and a manifest marked `succeeded`. After the camera change, `cappy compare-builds board_turn base new-camera --param seed=7` captures both builds and shows exactly where the frames differ.
