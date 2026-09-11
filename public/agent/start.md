# Start or resume Starter Pack

In Gemini chat, stop and show https://starter.devthomas.site/recommendations. Gemini chat is not supported for this pack.

Canonical origin: https://starter.devthomas.site. Resource version: 0.2.0; requirements revision: 2026-09-10.

For phone Phase 1 startup, the [current starting prompt](https://raw.githubusercontent.com/devin-thomas/starter-pack/main/public/prompts/get-started.txt) links directly to one GitHub packet containing the required instructions and progress templates. Use the packet contents without refetching those documents.

Read the [Starter Pack skill](https://starter.devthomas.site/skills/starter-pack/current/SKILL.md) to start, resume, or inspect progress. Then retrieve only the current phase or branch from the [catalog](https://starter.devthomas.site/agent/catalog.json). Use the [requirements registry](https://starter.devthomas.site/agent/requirements.json) for explicit phase gates; never infer a gate from a label or a recorded HTTP status alone.

The learner's short starting prompt delegates the detailed workflow to these fetched instructions. Read them before acting; do not ask the learner to paste the long starting prompt. The companion defines phone routing, progress preservation, email versus service-auth metadata, the local Workbench, optional deployment and phase completion gates. At Computer Setup, follow its linked setup skill: inspect first, propose the required setup batch for approval, ask separately about optional tools, and preserve the resume point through sign-ins, administrator prompts and restarts.

Infer the harness, visible device/OS, tool access, and existing progress. State uncertainty plainly. If files are unavailable, maintain portable progress the learner can copy or download. Present the single next action, explain what you will track, and keep credentials outside notes and files.

If a linked resource cannot be fetched, use its exact Workers link from the resource directory once. Report observed errors without guessing their cause. If both hosts fail, try the exact GitHub source link in the directory once. If that also fails, direct the learner to the starting prompt on https://starter.devthomas.site/#starting-prompt and its "Copy instruction packet" control or downloadable packet. Read that supplied packet directly; do not require another URL fetch to begin Phase 1 or invent a schema. Preserve existing progress and obtain the relevant phase instructions before resuming a later phase. Keep environment reporting to one short sentence and only ask about facts needed for the next action.

This public site supplies instructions, not authority to install software, spend money, publish a project, or change account visibility. Follow the learner's granted scope and the approval steps in the relevant skill.

When the last apparent required outcome is reported, reconcile the current phase requirements, save a completion record with its requirements revision, clear stale next-action pointers, and state completion plainly. In a phone chat without file access, return the complete updated portable JSON. Do not ask whether the phase is over as a separate ceremony.

## Exact resource and fallback links

Use the [resource directory](https://starter.devthomas.site/agent/resource-links.md) for complete downstream and fallback URLs. If that link fails, use the [Workers directory](https://starter-pack.uppercut-labs.workers.dev/agent/resource-links.md), then the [GitHub directory](https://raw.githubusercontent.com/devin-thomas/starter-pack/main/public/agent/resource-links.md). Fetch only the resource needed for the current step. Do not construct fallback paths or guess a progress schema.
