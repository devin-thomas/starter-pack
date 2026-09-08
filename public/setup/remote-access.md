# Reach your harness from your phone

Tailscale provides the private network. A separate interaction layer provides control of the computer or harness.

1. Check for an existing working remote route. Install or confirm official [Tailscale](https://tailscale.com/download) apps on the computer and phone; have the learner sign in, using GitHub sign-in where appropriate. Keep authentication in the app.
2. Confirm both devices are active in the intended tailnet. Check the computer's device name and [MagicDNS](https://tailscale.com/kb/1081/magicdns) configuration. Verify name resolution from the phone's supported client or connection path; never publish device identities or addresses in public project notes.
3. Choose one supported interaction layer: harness-native client, Windows App/RDP where the host supports it, RustDesk, or SSH/remote development. Inspect the selected tool's current documentation, authentication, host permissions, and platform support. A VPN connection alone is not remote desktop access. Keep the interaction service limited to the intended private access path.
4. Ask the learner to connect from the phone using the private device name and perform one harmless harness action, such as opening the current project or sending a message. Record their reported result and the selected layer. Avoid repeated remote dry runs after success.
5. If it fails, record the failing layer: device sign-in, DNS, network reachability, host service, credentials, or interaction. Preserve successful setup work, explain the next repair, and resume there. Set remote access ready only after the interaction succeeds.
