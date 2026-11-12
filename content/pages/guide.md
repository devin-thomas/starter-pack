## How the companion works

1. **[Go to the starting prompt](/guide#starting-prompt).** Use **Copy prompt**, then paste it into your agent and send the message. It checks what device and tools you already have, then helps you find the right starting point.
2. **Take the next useful step.** Your agent reads focused guidance as you need it. You do not need to learn every tool before making something.
3. **Keep your own record.** Your agent records completed, skipped, and deferred steps in a progress file. During Phase 2 setup, it saves that file to your private GitHub repo as soon as access is ready, before you plan your project.
4. **Pick up where you left off.** Attach your saved progress file, or paste your saved progress text, into your agent when you return. Tell it what you have done and ask for clarification whenever you need it.

## Optional: connect the Starter Pack to Claude or ChatGPT

You never need this to finish a phase. The Starter Pack connector lets Claude or ChatGPT look up the current course steps, work out your next step from the steps you name, and list the current skills. It only reads the public course: it never sees your progress file, accounts or GitHub, needs no sign-in, and refuses passwords, keys and personal details.

Copy these exactly when your app asks:

- **Name:** `Starter Pack`
- **URL:** `https://starter.uppercut-labs.com/mcp`
- **Description** (ChatGPT asks): `Read-only Starter Pack course guidance: phase steps, your next step and current skills.`
- **Icon** (ChatGPT asks): [the Starter Pack icon](/plugins/starter-pack-icon.png), a small PNG file

**Claude app, claude.ai or Claude Desktop.** Open [Claude's add-connector form](https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Starter%20Pack&connectorUrl=https://starter.uppercut-labs.com/mcp), which fills in the name and URL, or go to **Connectors** in Claude's settings and choose **Add custom connector**. Check the name and URL, keep the detected **No sign-in**, add no request headers, then choose **Add**. When Claude shows **Starter Pack**, choose **Connect**. In a chat, ask: "Use the Starter Pack connector: what does Phase 1 require?" On Claude's Free plan you can add one custom connector; remove this one when Phase 3 asks you to connect your own.

**Claude Code without the `starterpack` plugin.** Run `claude mcp add --transport http starter-pack https://starter.uppercut-labs.com/mcp`. If you have installed the Claude Code `starterpack` plugin, it already includes this read-only MCP connection; skip the separate add.

**ChatGPT on the web or the desktop app.** The phone app cannot add it. Custom servers depend on your ChatGPT plan; if you do not see **Add custom MCP server**, skip this.

1. Open [the Starter Pack icon](/plugins/starter-pack-icon.png) and save the image to your computer.
2. In ChatGPT, open **Plugins**, choose **Add**, then **Add custom MCP server**.
3. Upload the icon you saved. You can only set the icon here: ChatGPT cannot change it after the plugin is created.
4. Paste the name `Starter Pack` and the description `Read-only Starter Pack course guidance: phase steps, your next step and current skills.`
5. Paste the URL `https://starter.uppercut-labs.com/mcp`.
6. Set **Authentication** to **No authentication**, then tick **I understand and want to continue**. Tick this last; changing the URL clears it. Then choose **Create as a plugin**.
7. Choose **Connect**. In a chat, ask: "Use Starter Pack: what does Phase 1 require?"

**Undo.** In Claude, open **Connectors**, select **Starter Pack** and choose **Remove**. A connector cannot be renamed, and Claude allows only one connector per URL, so to fix a typo in the name, remove it and then add it again with the same URL. In Claude Code, run `claude mcp remove starter-pack`. In ChatGPT, open **Settings**, select the **Starter Pack** plugin and choose **Delete app**; to fix the icon, name or description, delete it and create it again with the steps above. Removing it changes nothing in your progress.

## Install the starterpack Claude Code plugin

*Plugin release preview: these commands will work after the reviewed public release. The current starting prompt and separate MCP connector remain available now.*

Claude Code users can install the Starter Pack companion, Computer Setup, Grill to Build, Quick Build and the other public Uppercut Labs agent skills together, 19 skills in all. The plugin also connects the same read-only Starter Pack MCP server, so you do not need to add it a second time.

```sh
claude plugin marketplace add devin-thomas/starter-pack
claude plugin install starterpack@starterpack
```

Start or reload Claude Code, open `/plugin` to confirm **starterpack** is enabled, and run `/starterpack:start` to start or resume the course. The direct companion is `/starterpack:starter-pack`. Phase 2 uses `/starterpack:computer-setup`, then `/starterpack:grill-to-build` to plan your project by default; `/starterpack:quick-build` is only for someone who explicitly requests Quick Build. These are the same Grill to Build and Quick Build skills as in the collection. During Starter Pack, your agent also follows the [Phase 2 planning page](/phases/2/planning).

The plugin does not access private learner progress or sign you into accounts. Bring your saved progress file when resuming, and approve consequential setup or deployment steps as you go. The independent course completion requirements do not change. If the bundled MCP is unavailable, follow the supplied skill instructions and the official course resources without fabricating completion.

## Build with Codex

On a computer, open Codex and paste the [starting prompt](#starting-prompt). Bring your saved progress if you are returning. On a phone, begin with your supported companion and carry its handoff into your computer harness for Phase 2. Before the first Phase 1 action, your agent checks the conversation host, selected computer harness, and accessible target separately. The copyable Codex readiness checkpoint is `https://starter.uppercut-labs.com/setup/codex-readiness.md`.

Starter Pack gives Codex a path to follow: inspect your computer, prepare an installation plan, save progress privately, turn your idea into build tasks, implement them, and help deploy the result. It keeps completed work and remaining blockers in your record so you can return without starting over. Access to files and tools determines what it can do directly; it tells you when a step needs your action.

Your part is to choose what you want, review consequential changes, sign in to your accounts, and try the app's main action. Codex handles the project files and routine commands it has permission to run. You do not need to copy every command from this guide or maintain the plan by hand. You can keep another supported agent if that already works for you.

## See your progress locally

When Computer Setup begins, your agent prepares a downloadable **Progress Workbench** alongside your progress file. It opens the local view as soon as Python is available and preserves any customization you already made. You can also [download the Workbench](/artifacts#workbench-download) to open with your saved progress. This website does not receive your progress or host a personal dashboard.

Your agent also asks which email to use for development accounts and notifications if you have not already chosen them. You can use one address, give a service its own address, or leave the choice for later. These choices do not change your Git identity.

The Workbench helps you read your record; it is not a phase milestone. A protected hosted copy can wait until later. If you want to publish something first, give your instant app's extra credit priority.

## What you will own

After Phase 1, you will have the accounts you need and something that performs a real action. After Phase 2, you will have a ready computer, a repository with your project and its plan, and a working public deployment.

Phase 1 deployment is [extra credit](/phases/1#extra-credit-put-your-app-online) when you are confident in your idea, comfortable sharing it publicly, and have a usable route. You can [upload a static site to Cloudflare from your iPhone](/help/cloudflare-iphone), use connected deployment tools or a computer, or finish Phase 1 without deploying.

## What is available now

Phases 1 and 2 are the core path. Phase 3, Make It Agent Native, is optional: give software you made an interface an agent can use, and prove it with a real client. Ask your agent for more depth whenever you want it.
