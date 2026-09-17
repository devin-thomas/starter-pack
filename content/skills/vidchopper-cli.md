---
skill_id: vidchopper-cli
updated: 2026-09-17
---

# VidChopper CLI

Plan, review, export, and verify local video chapter clips with VidChopperCLI and JSON/YAML ChapterFiles, including ChapterBuilder exports and embedded chapters.

## Use this when

You are working with VidChopperCLI on Windows or Apple Silicon macOS and need to inspect media, plan chapter-based exports with dry runs, review encoder and collision details, execute approved exports, and verify output against manifests. VidChopper CLI provides a structured agent workflow for the full local chapter-clip lifecycle — from inspection through verified delivery.

Not the right fit for general video editing, cloud-based media processing, non-chapter-based workflows, or non-VidChopper tools.

## How it works

VidChopper CLI follows a strict safety-first workflow where inspection and dry runs are read-only, and every write requires explicit approval:

1. **Check prerequisites** — Verifies VidChopperCLI 1.2.0 is installed and that ffmpeg/ffprobe (6.1 through major 9.x) are available. Reports detected paths and versions. On Windows, checks the standard `C:\Tools\VidChopper` path; on macOS, checks the extracted binary or user-local `~/.local/bin/vidchopper` command.

2. **Inspect inputs read-only** — Confirms each source video and ChapterFile is readable. Uses `ffprobe` to inspect duration, streams, frame rate, and embedded chapters without writing media. Supports three pairing modes: multiple sources to one shared ChapterFile, sources paired to ChapterFiles by filename stem, or a source with explicitly selected embedded chapters.

3. **Plan with dry runs** — Runs the export command with `--dry-run` to produce a complete plan without writing anything. Captures the chapter source, effective settings, output directory, every planned segment path, collision status, resolved encoder, and planned ffmpeg commands. Confirms the dry run created no files.

4. **Review the resolved encoder** — Treats encoder selection as part of the plan. On Windows, Auto uses HEVC NVENC only after a real capability test passes, falling back to x264. On Apple Silicon macOS, Auto uses HEVC VideoToolbox only after a real capability encode passes, falling back to x264. If the resolved backend changes after the dry run, requires fresh approval.

5. **Gate and run the export** — Presents a compact review covering versions, platform, settings mode, source and chapter source, chapter count, resolved encoder, output paths, collisions, and the exact command. Stops on every existing output collision. After approval, runs the reviewed command with only `--dry-run` removed.

6. **Verify the result** — Requires exported/skipped/failed counts matching the plan, every planned clip existing at its exact path, manifest `jobStatus: success`, every `processState: success`, `ffprobe` confirming each clip within one second of planned duration, and aggregate manifests reconciling with per-job results.

## Inputs

- **Source media** — local video files accessible to VidChopperCLI
- **Chapter source** — a JSON/YAML ChapterFile (including ChapterBuilder exports) or embedded chapters in the source video
- **Approval** — explicit confirmation before any export or file modification

## Outputs

- Media inspection reports with format, duration, streams, and chapter details
- Dry-run validation of the complete export plan with encoder resolution
- Exported chapter clips verified against planned specifications and manifests
- Per-job and aggregate `vidchopper-manifest.json` files with full verification

## Prerequisites

- **Windows 10/11 x64** or **macOS 15+ on Apple Silicon** — Intel macOS and end-user Linux are outside the 1.2.0 release boundary
- **VidChopperCLI 1.2.0** — Verified against VidChopperCLI 1.2.0 / ChapterFile schema 1 / export-manifest schema 1 / skill-contract 1
- **ffmpeg and ffprobe 6.1–9.x** — external dependencies, never bundled or auto-installed

On macOS, the app and CLI are ad-hoc signed rather than notarized. If macOS blocks a browser-downloaded copy, use the per-app approval flow in Finder or System Settings > Privacy & Security.

## Installation and use

VidChopper CLI is a product-specific agent skill. The canonical implementation lives in the VidChopper repository, not in the general skills collection. Point your agent at it when working with VidChopper:

```
Read the VidChopper CLI skill and help me export chapter clips from this video.
```

The skill enforces a safety boundary: inspection and dry runs are always read-only, and exports require your explicit approval. It never uploads media, installs software, or modifies settings without confirmation.

## Example

> "I have a 2-hour conference recording with a ChapterBuilder JSON file marking 8 sessions. Export each session as a separate clip."

The agent checks VidChopperCLI 1.2.0 and ffprobe are available, inspects the source video (MKV, 1080p, 2:04:17, H.264) and ChapterFile (8 chapters with timestamps), runs `--dry-run` to plan all 8 clips, reports the resolved encoder (HEVC VideoToolbox on macOS, or NVENC on Windows with GPU, or x264 fallback), shows the output directory and all planned paths with no collisions, gets approval, exports, then verifies: 8 clips exported, all manifests show `jobStatus: success`, ffprobe confirms each clip within one second of planned duration.
