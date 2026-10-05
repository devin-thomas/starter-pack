# Codex readiness checkpoints

Use this check before the first Phase 1 action, then reuse it at the milestones below. It identifies which environment is actually available; it does not run the optional Programmatic Harness proof.

## Before Phase 1

Keep three facts separate:

1. **Conversation host:** the app or companion currently talking with the learner.
2. **Selected computer harness:** the app the learner chose to work with project files.
3. **Target:** the actual machine and workspace that the assistant can inspect or change.

Use explicit saved choices and authoritative runtime/tool facts. Do not infer Codex from a ChatGPT login, provider name, fetched skill, or shared skills folder. If the target or selected harness is unclear, ask only what is needed for the next step: “Which app should work with your project files, and is that computer available to inspect now?” A phone-only learner can continue here and choose or prepare a computer route later.

When Codex is the selected harness and the intended target is accessible, and the check is permitted, use only non-inference status checks such as `codex --version` and `codex login status`. Do not install or start Codex, invoke `codex login`, read credential files, start a session, call a model, or copy raw status output. Reduce the result to whether the CLI is available, its version if observed, whether managed ChatGPT sign-in is present, and what remains unknown. If the target is inaccessible, report readiness as unknown rather than checking a different machine.

Version and sign-in do not prove plan eligibility, model availability, or a successful programmatic turn. Do not test those with inference during a readiness check. The optional programmatic proof uses the local Codex CLI/app-server, managed ChatGPT sign-in, a supported model, compatible pinned releases, and an approved disposable workspace; offer its execution only after required Computer Setup and private progress saving are verified.

Give one short environment summary, then surface the relevant route: use the already available selected harness, prepare or continue computer setup, or defer and keep using the current supported companion. Missing CLI, inaccessible computer, or unknown sign-in never blocks phone-capable Phase 1 work. Do not require a new subscription or switch providers automatically.

## Reuse at milestones

Reuse this checkpoint at Phase 1 closeout and device/companion handoff; Computer Setup entry and closeout; Quick Build planning and the transition to approved implementation; deployment/release and phase closeout; and after a material change to host, machine, workspace, permissions, runtime, or authentication.

Compare the current context with the latest valid check. If it is unchanged, reuse the result. If one part changed, recheck only that part. Do not repeat answered intake, login, installation, the optional offer, or a proof run. A new conversation alone does not establish that the target changed; if target continuity matters and cannot be determined, ask one focused question.

An explicit decline remains declined. A deferral can be revisited only when its recorded blocker changes or the learner asks. Never turn a milestone into another sales pitch. Keep the required next action intact when the learner declines, defers, is ineligible, or is unable to access Codex.

## Keep readiness separate from proof

Readiness and offer history belong in the existing `steps["programmatic-harness"]` status and concise nonsecret notes. Preserve other fields. Use `skipped` for an explicit decline and `deferred` with one recovery action for a deferral; leave proof status unclaimed. Record only normalized check results and the actual check date. Do not save a machine name, workspace path, account identity, credentials, raw status output, or session/turn ID.

Actual proof outcomes belong only in `artifacts.programmatic_harness.attempts`, following the progress schema. `not_tested`, `declined`, `deferred`, `partial`, `failed`, and `passed` remain distinct. A passed result requires both exact file checks and verified same-session resume. Do not promote CLI capability, a managed login, or model-list metadata into a passed proof.

## Scenario handling

| Scenario | Checkpoint action |
|---|---|
| Codex is selected and its target is reachable | Run permitted version/sign-in status checks; offer the normal Codex route. Mention the later optional proof without running it. |
| The conversation is outside Codex but the selected Codex target is reachable | Check that target only; do not infer the conversation host is the development harness. |
| Harness or target is unknown | Ask one focused question, or mark readiness unknown and continue the supported current route. |
| Phone only, no target access | Continue phone-capable work; defer computer checks without blocking Phase 1. |
| Codex CLI is missing | Report it; do not install. Offer computer setup or defer. |
| CLI is present but sign-in is absent or unknown | Report the observed state; do not start login. Continue elsewhere or defer setup. |
| Only API-key authentication is available | State that it is not the released subscription-backed route; do not fall back to API billing or switch providers. |
| Machine, workspace, runtime, permission, or authentication changed | Recheck only the affected facts; preserve unrelated successes and previous progress. |
| The learner already declined | Preserve `skipped`; do not ask again unless the learner requests it. |
| A deferred blocker changes | Revisit the focused check; keep proof opt-in and avoid repeating completed setup. |
| Phase 1 or a later phase is already complete | Preserve its original completion evidence and requirements revision; readiness never restarts or revokes it. |
