## How the companion works

1. **[Go to the starting prompt](/guide#starting-prompt).** Use **Copy prompt**, then paste it into your agent and send the message. It checks what device and tools you already have, then helps you find the right starting point.
2. **Take the next useful step.** Your agent reads focused guidance as you need it. You do not need to learn every tool before making something.
3. **Keep your own record.** Your agent records completed, skipped, and deferred steps in a progress file. During Phase 2 setup, it saves that file to your private GitHub repo as soon as access is ready, before Quick Build begins.
4. **Pick up where you left off.** Attach your saved progress file, or paste your saved progress text, into your agent when you return. Tell it what you have done and ask for clarification whenever you need it.

## Build with Codex

On a computer, open Codex and paste the [starting prompt](#starting-prompt). Bring your saved progress if you are returning. On a phone, begin with your supported companion and carry its handoff into your computer harness for Phase 2. Before the first Phase 1 action, your agent checks the conversation host, selected computer harness, and accessible target separately. The copyable Codex readiness checkpoint is `https://starter.devthomas.site/setup/codex-readiness.md`.

Starter Pack gives Codex a path to follow: inspect your computer, prepare an installation plan, save progress privately, turn your idea into build tasks, implement them, and help deploy the result. It keeps completed work and remaining blockers in your record so you can return without starting over. Access to files and tools determines what it can do directly; it tells you when a step needs your action.

Your part is to choose what you want, review consequential changes, sign in to your accounts, and try the app's main action. Codex handles the project files and routine commands it has permission to run. You do not need to copy every command from this guide or maintain the plan by hand. You can keep another supported agent if that already works for you.

### What is new: a program can continue a Codex session

The optional local workflow adds a way for software to drive Codex using its managed ChatGPT sign-in. In our release check, a small program asked Codex to create `proof.txt` with `hello world`, checked the exact contents, closed the connection, then restarted and resumed the same session to change that same file to `hello Codex`. Both content checks and cleanup passed. That demonstrates continuity across two tasks; a complete unattended Starter Pack run has not been verified.

Want to see it work yourself? After required Computer Setup, tell Codex: **I want to try the optional local Codex programmatic-harness proof.** Your agent loads the reusable instructions and guides the small experiment. It needs an eligible ChatGPT plan, with no OpenAI Platform API key or API billing. See the [Phase 2 workflow](/phases/2#optional-try-a-programmatic-harness-with-codex) for the steps; your agent handles the pinned installation instructions.

You can use Codex for the ordinary setup and build path without running this experiment. The proof is optional and never gates Quick Build. Broader workflows that coordinate many tasks are a next step; the released proof covers local Codex sessions.

## See your progress locally

When Computer Setup begins, your agent prepares a downloadable **Progress Workbench** alongside your progress file. It opens the local view as soon as Python is available and preserves any customization you already made. This website does not receive your progress or host a personal dashboard.

Your agent also asks which email to use for development accounts and notifications if you have not already chosen them. You can use one address, give a service its own address, or leave the choice for later. These choices do not change your Git identity.

The Workbench helps you read your record; it is not a phase milestone. A protected hosted copy can wait until later. If you want to publish something first, give your instant app's extra credit priority.

## What you will own

After Phase 1, you will have the accounts you need and something that performs a real action. After Phase 2, you will have a ready computer, a repository with your project and its plan, and a working public deployment.

Phase 1 deployment is [extra credit](/phases/1#extra-credit-put-your-app-online) when you are confident in your idea, comfortable sharing it publicly, and have a usable route. You can [upload a static site to Cloudflare from your iPhone](/help/cloudflare-iphone), use connected deployment tools or a computer, or finish Phase 1 without deploying.

## What is available now

Phases 1 and 2 are the complete path in this version. Phase 3 is a preview of a more deliberate approach to larger projects. Ask your agent for more depth whenever you want it.
