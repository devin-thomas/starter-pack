# Reach your computer from your phone

Remote control lets you direct the agent. Tailscale also gives your phone and computer a private way to exchange files and reach local tools. These are distinct capabilities:

| Need | Route | Evidence |
| --- | --- | --- |
| Connect the devices privately | Tailscale on both devices | Both connected to the intended tailnet; device identity confirmed |
| Move an artifact | Taildrop or an approved private alternative | File received and contents confirmed in each direction |
| Direct the running agent | Supported native control or approved remote desktop/terminal | A phone action reaches the intended computer/harness session |
| View the Workbench | Optional Tailscale Serve | Approved snapshot loads; content and audience boundary checked |
| Approve an account login | Provider-supported authorization | Intended account/scope authenticated without exposing credentials |

Use the [canonical requirements](https://starter.devthomas.site/agent/requirements.json) for phase gates, not a combined "remote ready" checkbox.

## 1. Confirm the private network

Inspect existing configuration before changing it. Install or confirm the official [Tailscale apps](https://tailscale.com/download) on the computer and phone. Reuse the intended account/tailnet; GitHub sign-in is appropriate when supported, but do not recreate an account just to change its provider.

Confirm each client is connected and identify the intended computer on the phone and phone on the computer. Use the supported UI or a nonsecret `tailscale status` inspection; keep real device names/addresses privately. Verify [MagicDNS](https://tailscale.com/kb/1081/magicdns) resolution if that is the chosen access path. A native harness nickname is not necessarily the OS or Tailscale device name.

Record computer connection, phone connection and intended network/device identity separately in `remote_access.checks`. If a learner explicitly corrects an old flag, preserve the original history and record a dated learner-reported correction after review; do not infer file transfer or remote control from it.

## 2. Move a file both ways

Follow [file transfer](https://starter.devthomas.site/setup/file-transfer.md) with a harmless text/Markdown fixture. Locate/read the phone's file in the actual receiving-client destination, then have the learner open the returned computer file on the phone. Preserve each direction independently.

Taildrop's personal-device/tag/client restrictions must be checked. Do not weaken managed policy or move credentials to demonstrate readiness. A native remote message alone cannot complete these checks.

## 3. Verify actual phone-to-harness control

Reuse an already working route first. Prefer a supported native remote-control surface. Otherwise select one explicitly approved platform-compatible remote desktop/terminal route, such as Windows App/RDP on a supported host, RustDesk or SSH. Inspect that product's current official documentation and actual permissions before enabling it. Tailscale does not install the remote service for you. Do not expose public RDP/SSH ports, disable firewalls, enable every available remote option or grant unattended control by default.

The phone must reach the intended running computer session, not merely a chatbot, unrelated cloud machine or empty remote desktop. Have the learner perform one harmless action: send a message to that session, inspect an existing file, or open the intended workspace. Confirm the result at the computer/harness. Record selected layer, session identity privately, date, action and evidence source. Reuse a recent successful check rather than repeat a full walkthrough.

A harness-native route may use its own authenticated transport; do not describe it as a Tailscale connection or infer the Tailscale/file-transfer outcomes from it.

### Antigravity

Use current [Antigravity Remote Control instructions](https://antigravity.google/docs/remote-control/) for the installed version. A September 2026 macOS observation for version 2.12.2 used **Settings > Application > Remote Control**, then a recognizable device name and dashboard/QR entry. Treat that as dated UI guidance, not a universal menu path. Current vendor docs describe the **App** section and **Enable Remote Control**, with an optional nickname; inspect the installed UI.

Once the approved desktop route is enabled, open the [Antigravity dashboard](https://antigravity.google.com/) in the phone browser, sign in with the same intended Google account, and choose the correct computer. Keep it awake/online and send one harmless message in the actual agent session. A Gemini chat is not this remote client. Do not add the headless daemon, a public tunnel or another remote stack when the existing desktop route works; persistent services require separate approval.

## Record partial success honestly

Use [setup state](https://starter.devthomas.site/setup/state.example.json) and the manifest's progress mapping. These six check records are independent: `tailscale_computer`, `tailscale_phone`, `device_identity`, `phone_to_computer_file`, `computer_to_phone_file`, `phone_harness_interaction`. Each has a status, source/time, evidence and next repair. Missing evidence is `not_tested`, not an observed failure.

Legacy booleans remain compatibility summaries, not authoritative evidence for new checks. If `environment.remote_access_ready` is retained in canonical progress, define it only as a projection of the confirmed harness-interaction outcome. Never use it to complete networking or either transfer direction. Preserve contradictory history for review rather than overwriting it.

If a check fails, classify the layer: account/device connection, DNS/network, file send/receive, host service, credentials, selected session or actual interaction. Preserve unrelated successes and continue the remaining independent work. Optional [private Workbench](https://starter.devthomas.site/setup/private-workbench.md) access is not a phase gate. [Authentication](https://starter.devthomas.site/setup/authentication.md) uses provider login, not automatic .env transfer.

After required setup outcomes pass, save and verify the latest private progress before Quick Build. Network installation, a status page, and HTTP availability alone do not prove the file or harness actions.

Provider guidance checked September 10, 2026. Real device/session checks remain unverified until actually performed and recorded.
