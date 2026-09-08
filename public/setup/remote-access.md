# Reach your harness from your phone

Tailscale provides the private network baseline. The selected interaction layer provides control of the computer or harness; a harness-native browser connection may use its own authenticated transport. Verify the network baseline and actual harness interaction separately.

1. Check for an existing working remote route. Install or confirm official [Tailscale](https://tailscale.com/download) apps on the computer and phone; have the learner sign in, using GitHub sign-in where appropriate. Keep authentication in the app.
2. Confirm both devices are active in the intended tailnet. Check the computer's device name and [MagicDNS](https://tailscale.com/kb/1081/magicdns) configuration. Verify name resolution from the phone's supported client or connection path; never publish device identities or addresses in public project notes.
3. Choose one supported interaction layer: harness-native browser/client, Windows App/RDP where the host supports it, RustDesk, or SSH/remote development. Inspect the selected tool's current documentation, authentication, host permissions, and platform support. A VPN connection alone is not remote desktop access. Keep self-hosted interaction services limited to the intended private access path.
4. Ask the learner to connect from the phone using the private device name for a Tailscale connection, or the provider's authenticated dashboard for a native browser connection. Perform one harmless harness action, such as opening the current project or sending a message. Record their reported result and the selected layer accurately; do not describe a provider's transport as a Tailscale connection. Avoid repeated remote dry runs after success.
5. If it fails, record the failing layer: device sign-in, DNS, network reachability, host service, credentials, or interaction. Preserve successful setup work, explain the next repair, and resume there. Set remote access ready only after the interaction succeeds.

## Google: Antigravity in the browser

Gemini is the chat app, not the remote client for the learner's Antigravity instance. Follow the current [official Remote Control instructions](https://antigravity.google/docs/remote-control/) for the installed Antigravity version. Inspect an existing configuration before changing it, and obtain the required setup approval before enabling remote access.

Once enabled, have the learner open [Antigravity Remote Control](https://antigravity.google.com/) in the phone browser, sign in with the same Google account as the desktop instance, and select the intended computer. Keep that computer awake and online. Have the learner send a message in its agent session and confirm a response. Verify the existing Tailscale baseline separately; do not add a public tunnel or extra remote desktop just to access Antigravity's supported dashboard. A successful Gemini conversation does not satisfy the harness-interaction check.
