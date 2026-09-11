# Your private progress repository

Version: 0.2.0. Updated September 10, 2026. Your companion keeps this record for you; the website does not store it. During Phase 1 and the start of Phase 2 Computer Setup, use existing local or portable progress. A private repository is not required to graduate Phase 1 or begin installing the tools that enable GitHub access.

## Read progress in the local Workbench

At Computer Setup start, follow the [Workbench lifecycle](https://starter.devthomas.site/artifacts/progress-workbench/README.md) to place the downloadable [index.html](https://starter.devthomas.site/artifacts/progress-workbench/index.html) beside the existing canonical `starter-progress.json`. Create the HTML only if missing; preserve a customized viewer and existing progress, including unknown fields. The same progress file remains the source of truth. Do not make a second JSON state for the local view.

As soon as Python is verified, serve this exact absolute progress folder using the resolved interpreter with `-m http.server PORT --bind 127.0.0.1 --directory ABS_PROGRESS_FOLDER`. Use port 8000 first, then 8001 through 8010 if occupied. Inspect a running listener before reuse: it must serve the correct directory over loopback. Keep unrelated processes running, never expose a broader workspace or bind to the LAN, and follow the lifecycle for launch verification, process records, resume, and stop behavior. This is a private local view; the phone's localhost cannot address the computer's server.

After the agent saves progress, refresh the Workbench or allow the visible HTTP view to reload data on its five-second polling cycle. In file mode, select the saved JSON again to reload it. The Workbench is the default visualization, works before GitHub is ready, and never counts as a completion milestone or blocks a phase.

Hosting a protected copy is optional later work, lower priority than deploying the learner's instant app for extra credit. Follow [Workbench publishing](https://starter.devthomas.site/setup/workbench-publishing.md), confirm the Access email, and publish only its allowlisted snapshot. Never upload the private progress repository root as a website.

## Remember account details once

After confirming the phone companion and authenticator, offer one optional checkpoint for the learner's GitHub username, development account email and any existing service handles they want remembered. Reuse details they already supplied. This checkpoint is not a completion requirement, and declining it does not stop setup.

Store confirmed handles in `artifacts.account_profile` with `github_username` (string or null), `service_usernames` (an object keyed by service), `status` (`recorded`, `declined` or `deferred`), and `notes` (an array). Preserve unknown fields and existing service handles when merging. Do not ask the intake again after a recorded decision; clarify a missing value only when the current task needs it.

Keep the primary development email in the existing `choices.development_email.account_email` field, not a second copy in the profile. A supplied development email does not automatically authorize using it for notifications or Cloudflare Access. At Computer Setup, ask only for still-unaddressed email purposes. Never infer identity from an example or from the author's account. These are personal details: keep them in private or portable learner progress, never in the public app or a public example. Passwords, tokens and recovery codes do not belong in this record.

## Record development email choices

At Computer Setup entry, ask one concise question if these choices are missing and have not already been declined or deferred: "Which email should we use for development accounts and notifications? You can use the same address for both." Store only values the learner explicitly confirms. Do not infer an email from Git author settings, change Git identity, or assume account and notification addresses match.

Merge this object into `choices.development_email`, preserving other choices and existing fields:

```json
{
  "account_email": null,
  "notification_email": null,
  "access_email": null,
  "service_overrides": {},
  "notes": []
}
```

The account email is the default for development-service accounts; the notification email is the default destination for service notices. They may be the same with explicit confirmation. Preserve legacy string-valued `service_overrides` exactly, even when a value is a sign-in description rather than an email. Display a non-email value as a sign-in note, never an email link. Unanswered choices may remain null or absent; note a decline or deferral so another session does not ask again unnecessarily. These choices never block the curriculum. Ask about reusing an address for Access only when an optional protected deployment is relevant, then save the confirmed `access_email`. Keep real addresses in private learner progress, never public source or examples.

For new sign-in metadata, use `choices.service_auth` instead of putting OAuth descriptions into email fields. This synthetic fragment separates method, provider, handle, and confirmed email:

```json
{
  "service_auth": {
    "neon": {
      "method": "oauth",
      "provider": "github",
      "account_handle": "example-learner",
      "account_email": null,
      "source": "learner_report"
    }
  }
}
```

An OAuth provider or handle does not establish an email address. Migrate a legacy description only when its meaning is explicit or the learner confirms it; otherwise retain it unchanged and leave the method unknown. Real `account_email`, `notification_email`, and `access_email` values must still be valid emails or null. Permission for one purpose does not authorize another.

## Move progress to GitHub during setup

As soon as authenticated GitHub write access is ready, create or confirm a private progress repository and save the existing state there. Computer Setup installs and authenticates Git and GitHub CLI when needed. If connected GitHub tools already provide the required access, use them immediately while completing the computer baseline separately.

Verify the target owner and private visibility before uploading. Reuse an existing private progress repository and reconcile its latest state with the local checkpoint; do not replace completed work with an empty template or overwrite newer remote changes. If the intended repository is public, choose or create a private progress repository rather than publishing progress there.

Before the first intended commit/push, follow the [authentication guide](https://starter.devthomas.site/setup/authentication.md). Check the account and Git author identity without printing secrets. If needed, propose the learner's actual account-specific noreply address as a repository-local choice and obtain approval. Keep global Git identity and GitHub email protection unchanged; do not disable protection or rewrite shared history to bypass GH007. Prefer supported provider sign-in/consent rather than a phone credentials-file workaround.

Review the nonsecret files and actual diff, commit and push them, or save a commit through connected tools. Confirm the resulting revision and files on GitHub. Record the repository URL, branch, and checked result in the `private-progress-repository` step's notes; mark it completed only after the remote save succeeds. A local commit or empty private repository is not enough. Save the latest progress and setup results again before leaving Computer Setup. Keep this initial durable checkpoint distinct from `final-progress-save`, which confirms the Phase 2 closeout is saved too.

If authentication, repository creation, or remote saving fails, keep local or portable state with an exact resume action. Independent setup can continue and completed capability checks remain completed, but Quick Build must not begin until its canonical prerequisites, including private remote progress, are confirmed. On resume, inspect what succeeded and continue from that point.

## Create the template

1. Prepare a local progress folder, or reuse the existing one. Save this README there and use the [empty progress file](https://starter.devthomas.site/artifacts/progress/starter-progress.json) as `starter-progress.json` only when no progress exists. Preserve existing progress if resuming.
2. Initialize missing `setup/computer.json` from the [setup state template](https://starter.devthomas.site/setup/state.example.json). Use the [ignore template](https://starter.devthomas.site/artifacts/progress/gitignore.txt) for `.gitignore`, preserving existing rules and setup results.
3. Create `artifacts/` for your nonsecret project notes and links. Keep this folder locally until GitHub access is ready, then follow the remote-save steps above. With no filesystem access, provide downloadable or copyable state until it can be saved to a computer.

The [schema](https://starter.devthomas.site/schemas/starter-progress.schema.json) defines the format. The [safe example](https://starter.devthomas.site/artifacts/progress/starter-progress.example.json) shows a phone session in progress; the [completed Phase 1 example](https://starter.devthomas.site/artifacts/progress/starter-progress.completed-phase-1.example.json) illustrates a synthetic phone-only closeout. Examples are not evidence about a learner. Use actual timestamps when saving, and keep `starter_pack_version` associated with the resources you used.

## Requirements and older records

Read the [canonical requirements](https://starter.devthomas.site/agent/requirements.json), or the matching generated definitions in a supplied packet. This release uses version `0.2.0` and requirements revision `2026-09-10`. Evaluate only the relevant phase's gate and its referenced groups, prerequisites, completion meanings, and accepted evidence. `all_of` means every member; `any_of` means a qualifying choice, not all alternatives. These are registry expressions, not JSON Schema validation keywords. Do not infer gates from labels, counts, or optional preferences or maintain a separate curriculum checklist.

Retain the original data while reconciling known IDs:

- `instant-app` is an alias for `instant-build`; keep original notes and provenance without counting it twice.
- `github`, `cloudflare`, `neon`, and `instant-builder` belong to the core-account group. A completed historical `core-accounts` aggregate can be recognized without fabricating missing child records. Explicit conflicting child evidence needs reconciliation, not an automatic pass.
- `phase-2-project` is a historical aggregate, not an alias for both `quick-build` and `live-deployment`. Carry its evidence forward; ask only for genuinely missing behavior evidence. A URL or HTTP 200 alone is insufficient.
- Keep unknown steps and fields. A custom step with a valid phase belongs there; an unassigned one remains additional work, not a new gate. Retain conflicting aliases/duplicates and surface the conflict instead of overwriting whichever timestamp is older.

Keep recorded activity counts distinct from required outcomes. A selected builder does not leave every alternative unfinished. Omitted or declined email choices and an unavailable Workbench do not block setup or graduation. Network readiness, Tailscale on each device, each file direction, and actual harness control have independent evidence. `environment.remote_access_ready` reflects verified harness interaction, not just an installed network client. A learner correction about one device is not proof of an untested transfer.

## Close a phase without waiting to be asked

Run this protocol after the last apparent required outcome, at session close, and on resume. Do it quietly; do not invent a new graduation ceremony for the learner.

1. Load the journey's requirements revision and current phase definitions. Reconcile aliases and existing evidence. Clear learner reports count as reports; do not claim to have performed their tests. If the needed definitions are unavailable, use the matching supplied packet or exact fallback resources, not guessed requirements.
2. Resolve only missing or conflicting required outcomes. Ask one focused question if evidence is needed. Do not repeat successful tests or answered/declined optional intake.
3. Reconcile `phase.status`, `choices.workbench.next_step_id`, resolved step `blocker`/`next_action` fields, and any legacy `artifacts.next_action`. Remove a stale required pointer to completed work; preserve unresolved optional work as optional. Keep setup capability state and `environment.remote_access_ready` consistent with their own evidence. Preserve historical notes and unknown data.
4. Prepare an updated full record and a history entry in `artifacts.phase_history`, an array. Each newly confirmed completion uses `phase`, `status: "completed"`, `requirements_revision`, actual `recorded_at`, concise `evidence_summary`, and `source`. Keep `phase.current` on the completed phase until the learner chooses the next one. Use actual observed completion times; omit unknown old times instead of inventing them.
5. Validate writer output against the schema before saving. Use a temporary sibling file and atomic replacement when the filesystem supports it, preserving the previous valid record if validation or writing fails. In phone chat without filesystem access, return the entire updated JSON as a download or copyable block; a patch fragment or hidden chat memory is not a portable save. Say that the learner must retain the file, not that an inaccessible disk or repository was updated.
6. For Phase 2, complete the final private save protocol below before announcing durable completion. Phase 1 never requires a private repository, desktop, Workbench, email preferences, or deployment. If a private repository is already available and saving is authorized, preserve the closeout there too without turning a temporary save failure into a new Phase 1 gate.
7. State completion plainly, identify where progress is actually saved, and offer the next phase or a stopping point without beginning it automatically. Phase 3 is a preview, not an automatically certifiable graduation.

### History and repeat checks

Do not append a second completed entry for the same phase and requirements revision, reset counters, repeat celebrations, or commit an empty diff on resume. Reconcile stale pointers once, then return the existing outcome. `phase.current` being numerically later does not prove an earlier graduation.

An older valid graduation retains its original requirements revision, evidence, and recorded time. If the revision or completion time was never recorded, leave it unknown and explain that provenance; never backfill today's revision as if it governed the old journey. Newly introduced requirements are a targeted update checklist, not grounds to silently revoke historical completion or restart the build. On an explicitly chosen next phase, evaluate that phase's current requirements.

Repairs to actual private learner state are a separate authorized operation: preserve originals and reports, reconcile remote changes, propose a dated correction with a reviewable diff, and apply only after approval. Keep learner-reported corrections distinct from independent tests. Product examples do not authorize repairing personal state.

### Final private save and interruption

`private-progress-repository` establishes the earlier private remote checkpoint. `final-progress-save` is the later confirmation that the intended final progress and setup/closeout files have reached that private remote. An earlier push alone cannot pass this final outcome.

Review the target owner, visibility, latest remote state, and intended diff. Prepare the final completion candidate with the already-observed evidence, then commit/push the intended files and verify that exact revision and file contents remotely. Treat the candidate as pending until that verification succeeds; do not announce completion just because a local candidate says completed. A progress file may cite a previously observed revision; report the final SHA outside the file. Do not keep rewriting the file to contain its own commit SHA.

If the final save fails or its result is uncertain, retain the build, source, live-test evidence, and local checkpoint. Keep `final-progress-save` in progress with an exact nonsecret blocker and recovery action, and keep the current unconfirmed phase closeout in progress. Retain the proposed completion evidence under `artifacts.pending_closeout` if useful; do not append an unconfirmed completed history entry. If a completion candidate was already written locally, restore only that candidate's pending status and retain its evidence. Never revoke a previously verified historical completion. Tell the learner what is saved locally and what is not yet confirmed on GitHub.

On resume, first check whether the attempted save actually reached the remote; reconcile the observed candidate and local pending state before retrying. Once saved and verified, keep one confirmed completion entry and clear the pending action. Do not rebuild, replay unrelated successful checks, lose the original reports, or enter an empty-commit/recursive-SHA loop.

## Handoff and lightweight session notes

Before switching devices or agents, provide canonical progress or its private location, completed required outcomes, genuine blockers, selected optional branches, the computer harness separately from the phone companion, one exact next action, and the schema/resource/requirements revisions with focused references. Preserve answered or declined choices. A new agent must inspect and merge the existing record; chats do not automatically transfer across providers.

Make the companion available in Phase 1, Computer Setup at setup entry, and Quick Build plus its planning templates before the Phase 2 interview. Record the source/version used and whether a skill is supplied as `context_only` or confirmed `native_discovered` using the harness's supported discovery behavior. Copying Markdown into an arbitrary directory is not installation proof. Full skill theory, large engineering bundles, and AFK orchestration remain optional later work.

At the first harness build, keep a short private Markdown session report. For consequential friction, record the date and relevant OS/harness/resource versions, attempted action, observed result, cause hypothesis labeled as a hypothesis, workaround, actual verification, and unresolved next action. Mark an `expert_intervention` when a beginner likely could not devise the rescue, and whether it should become general guidance. Use `not_tested` when evidence is absent. Append later corrections; do not rewrite old reports or describe ordinary Git history as tamper-proof. No logging service is required and no secrets belong in the report.

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
