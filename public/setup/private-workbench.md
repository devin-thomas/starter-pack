# Optional: open your Workbench privately from your phone

Ask first: "Do you want to open your progress dashboard from your phone over your private Tailscale connection?" Declining or deferring never blocks setup, Quick Build or graduation. This is **Tailscale Serve**, not a separate tailserve app. [Serve](https://tailscale.com/docs/features/tailscale-serve) provides a private-network route; Funnel is public and must not be substituted. [Cloudflare Access hosting](https://starter.devthomas.site/setup/workbench-publishing.md) is a different optional destination.

## Approve the content, audience and lifecycle

Inspect existing Serve/Funnel configuration, the host's sharing state and effective grants/ACLs before any change. Confirm the exact intended viewers and an unused HTTPS port or nonconflicting route. Do not take over another project's route, reset all Serve settings, or reconfigure Funnel.

Tailnet membership is not proof of owner-only access. Existing broad allows and device shares matter; adding a narrow grant does not cancel broader access. New access rules should use current [grants](https://tailscale.com/docs/reference/grants-vs-acls), with a named audience and exact service/port. Use the provider's [policy tests](https://tailscale.com/docs/reference/syntax/policy-file#tests) and, where possible, an actual denied identity/device check. Keep policy changes scoped and approved. If the learner cannot inspect or change a managed policy, leave the dashboard local rather than claim a boundary that has not been established.

Explain HTTPS setup prompts before approving them, including any device-name certificate disclosure described by [Tailscale HTTPS documentation](https://tailscale.com/docs/how-to/set-up-https-certificates). Keep the private URL and device identity out of public project notes.

## Build a separate allowlisted snapshot

Never proxy the normal Python viewer serving the private progress repository. Hiding directory links does not protect `.git`, reports, notes or credentials.

1. Create a new, explicitly resolved snapshot directory outside the private progress repository and outside existing serving roots. Keep server logs and process records outside that directory. Do not point it at a home directory, workspace or repository.
2. Place only the verified Workbench `index.html` and a generated approved `starter-progress.json` view in it. The self-contained viewer needs no copied source tree. Preserve the learner's original HTML; review customization before copying it because custom assets/scripts may broaden the share.
3. Construct the JSON view from an explicit field allowlist, not a blacklist or recursive copy. A minimal view keeps valid `schema_version`, `starter_pack_version`, `updated_at`, current `phase`, and known `steps` containing their IDs and statuses. Include a step's nonsecret next action, blocker or notes only after review and approval. By default omit `choices`, `artifacts`, service-auth/email data, local paths, device names, private repository URLs and unknown extension fields. Validate against the current [progress schema](https://starter.devthomas.site/schemas/starter-progress.schema.json) without fabricating outcomes.
4. This view is disposable publication output, not another canonical database. Never merge it back into real progress. Keep all source fields intact privately. Record the source revision, snapshot generation time and projection policy outside the served directory. Explain that the viewer's progress timestamp is source freshness, not automatic sync.
5. Enumerate the entire snapshot including hidden entries. It must contain only the two reviewed regular files, no symlinks, junctions, reparse points, backups or nested directories. If an approved custom viewer needs assets, add exact regular files to the allowlist after review; do not copy entire folders.

## Start an isolated loopback listener

Use the verified Python interpreter or an already available strictly route-limited read-only service. Do not add a large backend. In the example, replace the placeholder with the inspected absolute snapshot directory; choose a different free port if 8011 is occupied:

```text
python -m http.server 8011 --bind 127.0.0.1 --directory "ABS_SNAPSHOT_DIRECTORY"
```

This is a separate process from the canonical local viewer. Record its exact executable, PID/session, directory, port and logs; use a recoverable managed process and a hidden window for a Windows background helper. Do not add autostart. Verify the listener is loopback-only and serves the expected HTML and approved JSON. Because this simple server serves the directory, allowlist inspection and keeping `index.html` present are essential. Never add new files there casually.

## Configure only the approved Serve endpoint

Use installed help to confirm the syntax, then inspect `tailscale serve status --json` and `tailscale funnel status --json`. The [Serve CLI reference](https://tailscale.com/docs/reference/tailscale-cli/serve) documents a loopback HTTP proxy, avoiding macOS file-serving variant restrictions. This example is valid only after confirming HTTPS port 8443 is unused and permitted for the intended audience:

```text
tailscale serve --https=8443 http://127.0.0.1:8011
```

Use the actual HTTPS URL reported by the client, including its port. Keep this in a managed foreground session initially. Do not add `--bg` without intentional approval: it persists Serve across restarts, while the underlying Python listener has its own lifecycle. If port 8443 already belongs to another route, stop here and select a nonconflicting approved endpoint; do not replace it.

For the example foreground configuration, stop its session with Ctrl+C and verify that endpoint is gone. For an approved persistent configuration, use the same original flags plus `off`, for example `tailscale serve --bg --https=8443 http://127.0.0.1:8011 off`. Verify against installed help and status. Never use reset-all or `tailscale down` as dashboard cleanup. Stop only this snapshot listener, not unrelated processes.

## Verify before calling it ready

Use a harmless synthetic projection first. Record these checks, leaving unavailable checks `not_tested`:

- The authorized phone opens the exact Serve URL and loads both the Workbench and the intended JSON, not a cached or unrelated dashboard.
- From the listener and Serve endpoint, `/.git/config`, `/.env`, `/setup/computer.json`, `/reports/check.md`, and a nonexistent directory return denial/not-found without private content or directory listings.
- Request raw traversal probes such as `/../outside-probe.txt` and `/%2e%2e/outside-probe.txt`; with curl use `--path-as-is` so the client does not normalize the request. Use a harmless sibling marker, never a real secret as a probe. No response may contain the sibling marker. Check symlink/reparse-point absence as well as HTTP behavior.
- An unapproved identity/device cannot reach the approved endpoint. Also test from outside Tailscale. A single authorized fetch does not establish who else can access it.
- Existing unrelated Serve/Funnel routes still behave as before, and no Funnel or public alternate route exposes this snapshot.

A failed content-boundary check means stop only this endpoint and fix it before loading personal data. If audience verification is unavailable, do not claim owner-only readiness or load personal data on that assumption. Keep the harmless probe/local viewer and record what the owner/admin must verify.

After protection passes, replace the synthetic projection with the approved personal view and repeat the content/audience checks. Record private URL, audience, source boundary, freshness, verification source/time, persistence choice and exact stop/resume actions under `remote_access.private_workbench`. On resume inspect policy, files and listeners again before serving; refresh only through an approved snapshot generation. There is no automatic GitHub synchronization and no learner data sent to the shared Starter Pack site.

Tailscale references checked September 10, 2026. This guide alone does not verify a real tailnet policy or phone-access boundary.
