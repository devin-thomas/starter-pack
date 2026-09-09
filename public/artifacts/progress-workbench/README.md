# Progress Workbench

Version: 0.1.0. A downloadable, read-only view of the learner's `starter-progress.json`. The Starter Pack website remains a shared guide; it never loads or personalizes itself with learner progress. The learner's agent writes the canonical JSON and uses the local Workbench as its default visual reference. No Starter Pack account, backend, browser storage, npm, or learner build step is needed.

## Assemble at the start of Computer Setup

1. Locate and preserve the learner's existing progress. Materialize portable progress in a learner-owned folder when filesystem access is available. Initialize a [progress template](https://starter.devthomas.site/artifacts/progress/starter-progress.json) only if no state exists. Never replace a real record with the example.
2. Download the [self-contained HTML template](https://starter.devthomas.site/artifacts/progress-workbench/index.html) as `index.html` beside `starter-progress.json`. Save the response as a file, preserving its bytes, and verify its byte count and SHA-256 against the [download manifest](https://starter.devthomas.site/artifacts/progress-workbench/manifest.json). A mismatch requires another intact download, not rewriting the file from a chat rendering. Do this at setup entry, independently of Git, GitHub authentication, and Python availability. An agent without filesystem access provides both files for handoff into the computer harness.
3. If `index.html` already exists, inspect it first. Reuse a working Workbench; preserve learner customizations. Do not overwrite an unrelated website. Use another learner-owned progress folder when needed, moving the canonical record deliberately rather than maintaining two active copies. Keep customizations separate from template updates until reviewed.
4. Record nonsecret location and launch information in `artifacts.progress_workbench` (for example `path`, `url`, `port`, and `status`). Do not copy the entire record into that field. Record `progress-workbench` as a step when useful, but it is never a phase gate. Viewer failures or a learner's decision not to use it do not prevent setup or Quick Build.

The folder normally becomes the existing private progress repository after GitHub access is ready. A second repository is unnecessary. Private remote progress must still be verified before Quick Build; the viewer does not replace that requirement.

## Start serving as soon as Python works

Do not wait for all of Computer Setup to finish. After the first successful Python capability check, use the exact interpreter discovered by uv or the environment. In the commands below, `python` means that verified interpreter and `PROGRESS_FOLDER` means the resolved absolute learner progress folder.

```text
python -m http.server 8000 --bind 127.0.0.1 --directory "PROGRESS_FOLDER"
```

1. Inspect port 8000. Reuse an existing server only after verifying it serves this learner's intended `index.html` and canonical `starter-progress.json`. Never reuse another project's server or stop an unrelated process.
2. If 8000 is occupied, try 8001 through 8010 in order. On a bind race, choose the next free port and retry. If none works, record the cause and provide direct-file viewing while independent setup continues.
3. Launch the server through the harness's managed process facility or an OS background process with recorded process identity. On Windows use `Start-Process -WindowStyle Hidden`, correctly quote paths with spaces, and preserve separate local logs. On other systems use the harness's background session support. Do not add an autostart service or scheduled task. Keep process details in `setup/computer.json`, not public project notes.
4. Verify HTTP 200 and the expected Workbench identity at `http://127.0.0.1:PORT/`. Fetch `/starter-progress.json` and compare it to the actual canonical file, not merely a 200 response. Open the URL for the learner using the available browser-opening tool. If unavailable, give them the verified link.
5. Record the actual port and URL. After restarts, re-inspect the port/process and repeat the two-file check before reusing or starting a server. Stop only the exact process this setup started when cleanup is requested.

This standard Python server exposes files in the selected progress folder to local processes. Bind only to `127.0.0.1`, select only the learner's progress folder, and keep secrets outside it. Do not serve a home directory or bind to `0.0.0.0`. A phone's localhost is the phone; use the established remote harness to view this local page, or the separately approved protected hosting path below.

The HTTP viewer refreshes the canonical file every five seconds while visible and when the tab becomes visible again. It never writes to it. Save JSON atomically where supported to avoid half-written reads. On an invalid or unavailable update, the viewer labels the previous record as the last successfully loaded copy. After an agent update, refer the learner back to the dashboard and verify the next successful refresh. Do not require repeated manual acceptance of every refresh.

## Direct-file fallback

Double-click `index.html`, then select or drop `starter-progress.json`. No upload occurs. A browser cannot reliably reread a neighboring file in this mode: reopen the JSON after the agent saves changes. The Refresh progress control opens the file chooser in direct-file mode. Closing the page forgets the selection; nothing is stored in localStorage, IndexedDB, cookies, or an embedded copy of learner progress.

Selecting a valid file in an HTTP viewer switches to that manual file view. Reload the browser page to return to its server's canonical file. A rejected file leaves the previous server refresh mode working.

## Use the existing data contract

The [progress schema](https://starter.devthomas.site/schemas/starter-progress.schema.json) remains canonical. The viewer validates that schema and currently supports `schema_version: 1`. Existing records work unchanged. It does not migrate records or mark steps complete.

As the agent updates progress, maintain `choices.workbench.next_step_id` and that unfinished step's `next_action` so the default view shows the actual next action. Record `blocker` only when one exists, and clear it when resolved. These fields are optional for older files, not a reason to guess or rewrite their history.

- `phase.current` and `phase.status` describe only the current phase. Do not infer historical phase completion from the phase number.
- `steps` contains recorded work. Known IDs use shared [guide labels](https://starter.devthomas.site/artifacts/progress-workbench/catalog.json); unknown IDs are humanized. Add optional `phase` to a custom step so it appears in the correct phase. Otherwise it remains visible under Other recorded steps.
- Optional `next_action` and `blocker` on a step provide the concrete action and obstacle without guessing from notes. Keep explanatory notes in `notes` as before.
- Optional `choices.workbench.next_step_id` names the next unfinished recorded step. Without it, the viewer selects an in-progress, deferred, then not-started step in the current phase. If none exists it asks the learner to consult their agent; it never invents a next action.
- Optional `choices.workbench.learner_name` personalizes the local title. Project names and links belong in `artifacts`; use named objects such as `phase_2_project` with `name`, `repository`, and `live_url`. The viewer renders text safely and only makes HTTP/HTTPS links clickable.

Counts show completed steps out of recorded steps, not a curriculum completion percentage. Skipped, deferred, and not-applicable steps are not counted as completed. The viewer is not an authority on phase gates. Phase 3 remains a preview.

The HTML bundles small phase/step labels for offline use. When online it can anonymously GET the public guide-label catalog with no learner state, credentials, or referring URL. No analytics, remote images, external fonts, or network writes are included. A failed catalog fetch uses bundled labels. Different pack versions produce a review notice, not an automatic migration.

## Ask once about development email

At setup entry, reuse previously confirmed preferences. Otherwise ask: **Which email should your development accounts use, and where should development emails go by default? They can be the same address, or you can give me different addresses for different services.** Do not obtain passwords or one-time codes in progress notes.

Store confirmed preferences under `choices.development_email`:

```json
{
  "account_email": "learner@example.com",
  "notification_email": "learner@example.com",
  "access_email": null,
  "service_overrides": {
    "github": "code@example.com"
  },
  "notes": []
}
```

This is an example, never a default value to copy into real learner progress. Named service overrides may use distinct email addresses. Multiple roles or more complex setups can be described in notes and represented by multiple named overrides. Missing addresses remain null or absent; do not infer identity from Git author settings, a logged-in provider, or the computer name. Do not change Git author identity, account emails, or send messages merely because a preference was recorded. If the learner declines or defers, record that and continue; ask again only when a chosen service actually needs the missing address.

Before optional Cloudflare Access setup, propose the saved `access_email`, otherwise `notification_email`, otherwise `account_email`. Confirm the actual allowlisted address (or explicit list of addresses) with the learner. Then record the chosen primary address in `access_email` and any additional allowed addresses in their service preferences/notes. An account-sign-in email is not automatically an Access grant. These personal preferences remain in the learner's private record and are excluded from public examples or screenshots unless approved.

## Optional customization and publishing

Personalize the Workbench only when it helps display real project information and the learner wants it. Preserve canonical JSON, phase navigation, read-only behavior, and the data contract. A learner/project name or useful artifact links may be enough. Never customize the shared Starter Pack site for an individual learner.

Workbench publishing is optional extra credit and lower priority than publishing the learner's instant build. Ask plainly before creating a separate hosting repository or an externally reachable site. Follow the [Cloudflare Access publishing recipe](https://starter.devthomas.site/setup/workbench-publishing.md) for deliberate account/domain selection, confirmed email access, protected placeholder verification, and allowlisted snapshot deployment. Never upload the private repository or canonical JSON to a public static host by default. A hosted snapshot must be refreshed deliberately; the local JSON stays canonical.

The embedded Geist font retains its SIL Open Font License inside the HTML. The artifact has no runtime dependency downloads or build requirements.
