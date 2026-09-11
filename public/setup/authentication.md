# Sign in safely and save private progress

Use the service's supported login or approval flow. You should not need to create a credentials file on your phone just to sign in. Account setup, CLI authentication, Git authorship and permission to publish are separate decisions.

## Choose the actual authorization route

1. Reuse a working, appropriately scoped local tool or connected service for the authorized action. Inspect the account and available capability; account-email preferences alone prove neither authentication nor write permission.
2. Otherwise use the provider's supported browser/device flow. Start one intentional login and let the learner approve directly with that provider. Do not ask them to paste a password, OTP, recovery code, session cookie or token into chat or progress.
3. If the chosen flow needs a callback on the development computer, use a browser on that computer through the approved remote-control route, or another provider-supported flow. A phone's localhost points to the phone. Merely copying a callback URL to the phone is not a solution.
4. Only when a credential is genuinely necessary, explain its scope and use the tool's secure input/secret storage. Do not invent a token-transfer ceremony. A private repository or encrypted transport is not a secret vault.

### GitHub CLI

Inspect existing account state locally with `gh auth status`; never request token output. If sign-in is needed, `gh auth login --hostname github.com --web` starts the supported flow. Let the learner use the legitimate provider URL and temporary device code shown by their own session. Do not assume a fixed code length or copy it into a saved report. Inspect the installed CLI help before adding flags. GitHub CLI normally uses the OS credential store but can fall back to plaintext storage if that store fails; address that locally and never upload the auth configuration. [GitHub login reference](https://cli.github.com/manual/gh_auth_login).

Preserve a working HTTPS credential helper or SSH path. `gh` login and Git transport are different checks. If an approved HTTPS workflow needs GitHub CLI's credential helper, inspect existing helper configuration before using [`gh auth setup-git`](https://cli.github.com/manual/gh_auth_setup-git); do not overwrite unrelated host/account configuration.

### Cloudflare Wrangler

Use the project's existing package manager and installed Wrangler. For an npm project, inspect `npx wrangler login --help` and `npx wrangler whoami` locally. Do not install a global copy to sidestep project resolution.

Current Wrangler documentation offers `npx wrangler login --device --browser=false` for approval on a phone without a local callback server. Use it only when the installed version supports it; do not infer support from a different machine. Let the learner approve their intentionally initiated session directly at Cloudflare. The default `wrangler login` instead needs its temporary localhost callback on the development computer. On older versions, use that computer's browser/approved remote desktop or propose a compatible upgrade; do not open public callback ports. Current Wrangler also offers `--use-keyring`; check platform support before selecting it. Otherwise protect its local token configuration rather than claiming it is automatically in the OS keychain. [Wrangler login, device flow and credential storage](https://developers.cloudflare.com/workers/wrangler/commands/general/#login).

Verify the intended account and sufficient permissions without printing credentials. Authentication does not authorize deployment to a different account or make a private project public.

## Git privacy before the first useful push

The agent performs this preflight in the exact intended repository:

1. Inspect `git status --short --branch`, branch/upstream and remote. Inspect only `user.name`, `user.email` and their origins, not the whole Git configuration or credential store. Compare the authenticated GitHub account and the intended owner/repository. Do not copy a development-email preference into Git.
2. Ask for the learner's author-name/privacy choice only if missing or conflicting. Where needed, propose the actual GitHub-provided noreply address from that account's email settings. Never construct it from someone else's example. With approval, set `git config --local user.name "CONFIRMED_NAME"` and `git config --local user.email "CONFIRMED_GITHUB_NOREPLY"` using the confirmed values, not those placeholders. Preserve global identity. [GitHub commit-email instructions](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address).
3. Confirm the private progress repository is actually private. Use an existing approved repository; if creation is needed, use the [progress repository guide](https://starter.devthomas.site/artifacts/progress/README.md) and explicitly private visibility. Do not turn the public application into the progress store.
4. Review the intended nonsecret diff and ignore rules. Stage only the progress/setup files meant to be saved. Commit a useful change and push through the intended authenticated Git path. Do not create test repositories or empty commits merely to show a checkmark.
5. Verify the remote revision and saved files, then recheck private visibility. For a confirmed target, `gh repo view OWNER/REPO --json nameWithOwner,isPrivate,url` checks repository identity/visibility; `git ls-remote --heads origin BRANCH` can compare the pushed branch with `git rev-parse HEAD`. Replace placeholders from the inspected repository. Remote files and revision, not a version command or empty repo, prove durable saving.

Keep this nonsecret evidence in private setup/session records. It is not public app metadata. Do not make a second commit solely to record the SHA of the first and repeat forever.

### If GitHub rejects the push with GH007

Keep GitHub's email-privacy protection enabled. Determine which unpushed commit contains the unwanted address; changing current configuration does not change existing commits. Propose the narrow repo-local identity correction and, only with explicit approval, correction of the affected unpushed commit. If the single affected commit is HEAD, a scoped authorized amendment may fit; older commits require a separately reviewed history plan. Never rewrite shared history, force-push unrelated work, or disable the safeguard to finish onboarding. [GitHub push privacy protection](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/blocking-command-line-pushes-that-expose-your-personal-email-address).

An auth diagnostic alone is not the final verdict: use the result of the safe, authorized intended save. On an actual failure retain local successes and record the precise auth/permission/identity/remote-save recovery. Independent setup may continue, but private saving is not complete and Quick Build must wait.

## Save metadata, not credentials

Use `choices.service_auth` for nonsecret method, provider, confirmed handle/email and evidence source. Actual email fields contain an email or null; an OAuth description is a sign-in note, not an email. Preserve legacy string overrides rather than coercing or discarding them. Account, notification and optional Access-email choices remain distinct; declining preferences is not a phase blocker.

File transfer is for artifacts. If a sensitive file truly cannot be avoided, obtain explicit approval for the exact file, destination, encrypted route, permissions and cleanup. Keep it outside Git, progress, shared Workbench assets and chat. Never use a sensitive file to test connectivity.

Provider references checked September 10, 2026. Recheck installed CLI help and provider instructions when executing; these docs do not claim a real account was authenticated.
