# Your private progress repository

Version: 0.1.0. Your companion keeps this record for you; the website does not store it. During Phase 1, a local or portable JSON file is enough. At Phase 2 entry, create or confirm a private GitHub repository before substantive work and verify its visibility.

## Create the template

1. Save this README as the repository README and download the [empty progress file](https://starter.devthomas.site/artifacts/progress/starter-progress.json) as `starter-progress.json`. Preserve existing progress if resuming.
2. Save the [setup state template](https://starter.devthomas.site/setup/state.example.json) as `setup/computer.json` and the [ignore template](https://starter.devthomas.site/artifacts/progress/gitignore.txt) as `.gitignore`.
3. Create `artifacts/` for your nonsecret project notes and links. Review all files, confirm the remote is private, and commit only the intended progress files.

The [schema](https://starter.devthomas.site/schemas/starter-progress.schema.json) defines the format. The [safe example](https://starter.devthomas.site/artifacts/progress/starter-progress.example.json) shows a phone session in progress. Use actual timestamps when saving, and keep `starter_pack_version` associated with the resources you used.

## Step statuses

- `not_started`: no work has begun.
- `in_progress`: work began and still needs action.
- `completed`: the stated completion condition was met; notes identify learner reports or agent checks accurately.
- `skipped`: the learner declined an optional action.
- `deferred`: work is saved for later, with a resume point.
- `not_applicable`: a conditional branch does not apply, with the reason recorded.

Required steps marked deferred, skipped, or not applicable do not count as complete. Overall phase status is `not_started`, `in_progress`, or `completed`. Phase 3 remains a curriculum preview.

## What to record

Keep nonsecret choices, completed actions, project links, blockers, and the next action. Never store passwords, API keys, access tokens, recovery codes, cookies, connection strings, private keys, or environment-file contents. Store credentials in a password manager or the provider's supported secret store. A private repository still needs this boundary.

On a failed step, keep prior progress and record the safe resume point. On a new session, load the existing file instead of resetting it. With no filesystem access, provide the learner the updated JSON to copy or download. Before each commit, inspect the actual diff; ignore rules are only a first filter.
