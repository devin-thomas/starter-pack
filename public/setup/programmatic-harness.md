# Optional Programmatic Harness

Programmatic Harness is an optional experiment for a learner whose required Computer Setup outcomes are already complete. It asks whether a small local program can control Codex, continue the same session for a second turn, and verify a harmless file result. Declining, deferring, or failing this experiment never blocks Quick Build or Phase 2 completion.

## Codex local route

This released route is for Codex running locally on the learner's computer. It uses Codex's managed ChatGPT sign-in and an eligible ChatGPT plan. It does not require an OpenAI Platform API key, OpenAI Agents API, or API billing. The adapter supports local workspaces; cloud use is not part of this proof.

The adapter release is [`@uppercut-labs/agent-native@0.1.1`](https://www.npmjs.com/package/@uppercut-labs/agent-native/v/0.1.1), published on npm. Its [versioned release tarball](https://github.com/uppercut-labs/agent-native/releases/download/v0.1.1/uppercut-labs-agent-native-0.1.1.tgz) and adjacent [SHA-256 file](https://github.com/uppercut-labs/agent-native/releases/download/v0.1.1/uppercut-labs-agent-native-0.1.1.tgz.sha256) remain available as a fallback; verify the checksum before installing an archive. Review Agent Native's [documentation](https://github.com/uppercut-labs/agent-native/tree/main/docs), including its programmatic-harness overview and Codex adapter guide, for implementation behavior, boundaries, and limitations.

## Choose the workflow

First, explicitly opt in. Your agent can run the pinned [skills CLI 0.1.1](https://www.npmjs.com/package/@uppercut-labs/skills/v/0.1.1) from the selected project directory:

```sh
npm exec --yes --package=@uppercut-labs/skills@0.1.1 -- uppercut-skills add programmatic-harness --host codex --project "$PWD" --channel bundled
```

If the npm registry is unavailable, download the [skills CLI v0.1.1 archive](https://github.com/devin-thomas/skills/releases/download/v0.1.1/uppercut-labs-skills-0.1.1.tgz) and adjacent [SHA-256 file](https://github.com/devin-thomas/skills/releases/download/v0.1.1/uppercut-labs-skills-0.1.1.tgz.sha256), verify the checksum, then use the archive:

```sh
npm exec --yes --package=./uppercut-labs-skills-0.1.1.tgz -- uppercut-skills add programmatic-harness --host codex --project "$PWD" --channel bundled
```

The [immutable skill source](https://github.com/devin-thomas/skills/tree/50ce5dce91c49fcf896aa887e11b4c3a529e40e5/programmatic-harness) pins the reusable workflow. Your explicit opt-in authorizes this documented skill install. Both commands install the skill files without adding runtime dependencies to the project. If you used the fallback, remove the downloaded archive and checksum after installation. The skill presents the project-specific adapter/dependency plan before applying it, following its approval rules. This page does not replace its setup, authentication, recovery, or verification instructions.

Keep the proof in a disposable or otherwise learner-approved local workspace. Complete Codex sign-in through its supported `codex login` flow. Do not copy credentials or authentication files. The workflow should use two turns in the same resumed session, confirm the expected harmless result, and clean up only resources it created.

The reusable skill's bundled installer archive must pass adjacent SHA-256 verification before use. Do not silently switch to a different version, provider, authentication route, API billing, or cloud target. Cursor and cloud workflows are separate future opt-ins and are not offered by this Codex handoff.

## Save only normalized evidence

Record only the fields allowed by the progress schema in `artifacts.programmatic_harness`: provider, target, outcome, and where applicable Codex runtime version, managed sign-in mode, verification time, the two file checks, same-session resume, and next action. Use the pinned releases as workflow inputs; the evidence object does not accept skill or adapter version fields. A failed, deferred, declined, or unavailable result stays optional and must leave the required next action intact. Local and cloud outcomes are independent.

Never save credentials, environment dumps, raw provider output, private planning URLs, or raw session and turn IDs in progress. Share only learner-safe summaries of what was checked and what remains to try.
