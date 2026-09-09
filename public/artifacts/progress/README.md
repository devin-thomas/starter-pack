# Your private progress repository

Version: 0.1.1. Your companion keeps this record for you; the website does not store it. During Phase 1 and the start of Phase 2 Computer Setup, use existing local or portable progress. A private repository is not required to begin installing the tools that enable GitHub access.

## Move progress to GitHub during setup

As soon as authenticated GitHub write access is ready, create or confirm a private progress repository and save the existing state there. Computer Setup installs and authenticates Git and GitHub CLI when needed. If connected GitHub tools already provide the required access, use them immediately while completing the computer baseline separately.

Verify the target owner and private visibility before uploading. Reuse an existing private progress repository and reconcile its latest state with the local checkpoint; do not replace completed work with an empty template or overwrite newer remote changes. If the intended repository is public, choose or create a private progress repository rather than publishing progress there.

Review the nonsecret files, commit and push them, or save a commit through the connected tools. Confirm the resulting revision and files on GitHub. Record the repository URL, branch, and checked result in the `private-progress-repository` step's notes; mark it completed only after the remote save succeeds. A local commit or empty private repository is not enough. Save the latest progress and setup results again before leaving Computer Setup.

If authentication, repository creation, or remote saving fails, keep local or portable state with an exact resume action. Independent setup can continue, but Computer Setup is not complete and Quick Build must not begin until private remote progress is confirmed. On resume, inspect what succeeded and continue from that point.

## Create the template

1. Prepare a local progress folder, or reuse the existing one. Save this README there and use the [empty progress file](https://starter.devthomas.site/artifacts/progress/starter-progress.json) as `starter-progress.json` only when no progress exists. Preserve existing progress if resuming.
2. Initialize missing `setup/computer.json` from the [setup state template](https://starter.devthomas.site/setup/state.example.json). Use the [ignore template](https://starter.devthomas.site/artifacts/progress/gitignore.txt) for `.gitignore`, preserving existing rules and setup results.
3. Create `artifacts/` for your nonsecret project notes and links. Keep this folder locally until GitHub access is ready, then follow the remote-save steps above. With no filesystem access, provide downloadable or copyable state until it can be saved to a computer.

The [schema](https://starter.devthomas.site/schemas/starter-progress.schema.json) defines the format. The [safe example](https://starter.devthomas.site/artifacts/progress/starter-progress.example.json) shows a phone session in progress. Use actual timestamps when saving, and keep `starter_pack_version` associated with the resources you used.

## Step statuses

- `not_started`: no work has begun.
- `in_progress`: work began and still needs action.
- `completed`: the stated completion condition was met; notes identify learner reports or agent checks accurately.
- `skipped`: the learner declined an optional action.
- `deferred`: work is saved for later, with a resume point.
- `not_applicable`: a conditional branch does not apply, with the reason recorded.

Required steps marked deferred, skipped, or not applicable do not count as complete. Overall phase status is `not_started`, `in_progress`, or `completed`. Phase 3 remains a curriculum preview.

Phase 1 deployment is extra credit. If offered, record it as `phase-1-deployment-extra-credit`: `skipped` when declined, `deferred` when accepted but postponed, or `completed` only after the live app's main action is verified. Keep the route, destination, visibility decision, and live link in nonsecret notes. Skipped or deferred extra credit does not prevent Phase 1 completion and does not satisfy the Phase 2 project milestone.

## What to record

Keep nonsecret choices, completed actions, project links, blockers, and the next action. Never store passwords, API keys, access tokens, recovery codes, cookies, connection strings, private keys, or environment-file contents. Store credentials in a password manager or the provider's supported secret store. A private repository still needs this boundary.

On a failed step, keep prior progress and record the safe resume point. On a new session, load the existing file instead of resetting it. With no filesystem access, provide the learner the updated JSON to copy or download. Before each commit, inspect the actual diff; ignore rules are only a first filter.
