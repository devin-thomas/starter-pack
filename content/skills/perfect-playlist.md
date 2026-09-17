---
skill_id: perfect-playlist
updated: 2026-09-17
---

# Perfect Playlist

Build exact Spotify playlists using the Perfect Playlist CLI with structured, deterministic music selection.

## Use this when

You want to create a Spotify playlist from specific songs and need every track to be exactly right — no substitutions, no reordering, no silent skips. Perfect Playlist turns your song requests into verified Spotify track URIs and writes them to a playlist with full verification.

## How it works

Perfect Playlist uses a deterministic final-mile approach where discovery is separate from writing:

1. **Preflight** — Checks that the `perfect-playlist` CLI is installed and authenticated with Spotify. If configuration is missing, guides you through setting up credentials (client ID, secret, redirect URI) without ever exposing secret values in conversation.

2. **Discover exact tracks** — For each requested song in your order: searches Spotify, compares title/artists/explicit status/duration against your request, and inspects the intended result to get the canonical `spotify:track:` URI. When multiple versions exist (live, remastered, clean, explicit, sped-up), presents the candidates for you to choose rather than guessing.

3. **Create a durable Source** — Writes the inspected track URIs to a local YAML, JSON, or text file. This Source is the ground truth for your playlist — a portable, versionable record of exactly which tracks you selected.

4. **Choose one write workflow** — Builds a new playlist, writes to an owned empty target, or appends to an existing writable playlist. Each mode has explicit rules: Build creates new public playlists, targets must be owned and empty, Add only appends and never modifies earlier tracks.

5. **Verify and report** — Validates before writing, reads back Spotify state after, and runs an explicit peer comparison between the Source and the live playlist. Reports the Source path, playlist name and URL, track count, and verification outcome.

## Inputs

- **Song requests** — names, artists, or Spotify references for the tracks you want
- **Spotify credentials** — configured locally (never pasted into conversation)
- **Choices** — your picks when multiple track versions are ambiguous

## Outputs

- A verified Spotify playlist matching your exact track selection and order
- A durable local Source file (YAML/JSON/text) recording the canonical track URIs
- Verification evidence comparing the Source against the live playlist

## Prerequisites

- Python 3.11+ with the `perfect-playlist` package installed
- Spotify developer credentials configured locally
- Spotify account authorization via the CLI's interactive login

## Installation and use

Perfect Playlist is available as an agent skill. Point your agent at it when you want to create a playlist:

```
Read the Perfect Playlist skill and help me build a playlist.
```

The CLI also supports read-only workflows: comparing two Sources, exporting canonical URIs, and rendering Spotify links — none of which write to Spotify.

## Example

> "Build me a playlist called 'Sunday Morning' with these five songs: Lovely Day by Bill Withers, Here Comes the Sun by The Beatles, Three Little Birds by Bob Marley, Walking on Sunshine by Katrina and the Waves, and Mr. Blue Sky by ELO."

The agent searches each song, inspects the top result, confirms all five are exact matches (no ambiguous versions), creates a YAML Source file, runs `perfect-playlist build source.yaml --name "Sunday Morning"`, verifies the playlist matches the Source exactly, and reports: "Sunday Morning — 5 tracks, all verified. Playlist URL: open.spotify.com/playlist/..."
