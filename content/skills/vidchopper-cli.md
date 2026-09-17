---
skill_id: vidchopper-cli
updated: 2026-09-17
---

# VidChopper CLI

Local media inspection, dry-run planning, explicit write approval, export, and output verification for VidChopper.

## Use this when

You are working with VidChopperCLI on Windows and need to inspect media files, plan edits with dry runs, execute approved exports, and verify output. VidChopper CLI provides a structured agent workflow for the full local media editing lifecycle — from inspection through verified delivery.

Not the right fit for general video editing, cloud-based media processing, or non-VidChopper workflows.

## How it works

VidChopper CLI follows a strict safety-first workflow for local media operations:

1. **Inspect media** — Reads media files locally to establish format, duration, resolution, codec, and other properties before any edit planning begins.

2. **Plan with dry runs** — Constructs edit operations and validates them through dry-run execution. No write operations occur until the plan is complete and verified.

3. **Obtain explicit write approval** — Presents the planned operations to the user and requires explicit approval before any export or file modification. Never writes media without confirmation.

4. **Execute exports** — Carries out the approved operations locally, using VidChopperCLI's deterministic export pipeline.

5. **Verify output** — Checks the exported files against the planned specifications: format, duration, resolution, and integrity.

## Inputs

- **Media files** — local video/audio files accessible to VidChopperCLI
- **Edit instructions** — what to inspect, trim, export, or transform
- **Approval** — explicit confirmation before any write operation

## Outputs

- Media inspection reports with format, duration, and codec details
- Dry-run validation of planned operations
- Exported media files verified against planned specifications
- Output verification confirming the export matches the approved plan

## Prerequisites

- **Windows** — VidChopper CLI requires a Windows-local harness
- **VidChopperCLI 1.0.0** — Verified against VidChopperCLI 1.0.0 / schema 1 / skill-contract 1

This skill has been verified against VidChopperCLI version 1.0.0 running on Windows. Mac and Linux support has not been verified. Compatibility with newer VidChopperCLI releases has not been confirmed — if you are running a different version, check the canonical source for updated compatibility information.

## Installation and use

VidChopper CLI is a product-specific agent skill. The canonical implementation lives in the VidChopper repository, not in the general skills collection. Point your agent at it when working with VidChopper:

```
Read the VidChopper CLI skill and help me process this video.
```

The skill enforces a safety boundary: inspection and dry runs are free, but writes require your explicit approval.

## Example

> "I have a 45-minute recording and need to export three segments as separate clips."

The agent inspects the source file (MP4, 1080p, 45:12 duration, H.264), plans three trim operations with specified start/end timestamps, runs dry-run validation for each, presents the plan for approval ("Clip 1: 00:00–12:30, Clip 2: 15:00–28:45, Clip 3: 31:00–44:00"), executes the approved exports after confirmation, and verifies each output file matches the planned duration and format.
