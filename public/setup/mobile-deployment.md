# Mobile deployment extra credit

Companion reference for the optional Phase 1 deployment step. Checked September 8, 2026. Keep the learner's next action short; fetch this resource when their chosen route needs it. Cloudflare remains the default host and Vercel remains optional. Deployment never blocks Phase 1 completion or replaces Phase 2 Computer Setup and its meaningful build.

## Cloudflare: upload static files from an iPhone

For a small HTML/CSS/JavaScript app, offer the [illustrated iPhone help page](https://starter.devthomas.site/help/cloudflare-iphone). Devin tested generation in ChatGPT, then used Files and Safari to upload an extracted folder through Workers & Pages > Create application > Upload your static files, name a Worker, and deploy. He verified the public app's buttons and sliders. This is a Cloudflare upload route, independent of which agent provides the files; it needs no connected Cloudflare app, GitHub repository, computer, terminal, desktop IDE or Wrangler.

Provide a downloadable ZIP or separate static files when the current environment supports it. If it only returns code, help the learner save actual files using a file-capable tool; do not claim to have attached a download. Keep index.html at the root of the selected folder. Guide the learner through Safari's upload rather than requiring agent deployment permissions. Confirm the expected files in Cloudflare before they tap Deploy. Multi-account selection is outside the tested guide. This route covers ready-to-serve static files, not unbuilt framework source or server-side code. Keep the files as the learner's editable source; source control can remain an independent choice.

Use the same signed-out URL and main-action checks described below. The public example's HTML, CSS and JavaScript were independently reachable over HTTPS; the physical iPhone interactions are Devin's reported test. Do not turn this optional route into a Phase 1 gate or assume it completes Phase 2 setup.

## Choose from actual capabilities

Inspect tools exposed to this conversation and their permissions before requesting setup. Distinguish repository reading, file/commit writes, repository creation, and deployment. One missing action does not imply the others are unavailable. A connected service is not itself proof of authorization for a particular project. Do not create throwaway projects merely to test access.

For a new GitHub project, use a repository-creation action if one is actually available and authorized. Otherwise, have the learner create an empty repository in GitHub Mobile, return with its address, and grant the agent access. Save and confirm a commit only if the learner chose to keep the source there. Do not make the source public just because the app will be public.

[Vercel's direct deployment tool](https://vercel.com/docs/agent-resources/vercel-mcp/tools#deploy_to_vercel) can accept files and a preview or production target, create a project, and start a build without a Git repository or local CLI. Inspect its current input requirements. Obtain the actual app files from the learner's builder or export; seeing its preview is not access to its source. Do not replace their app with a placeholder. Preserve their source choice separately from deployment.

## ChatGPT: owner-tested mobile route

Devin reports deploying a minimal static website from the native ChatGPT phone app with connected Vercel tools. The session created a new Vercel project and returned the expected HTML in a subsequent fetch. Its GitHub connection exposed file creation, commits, branches and pull requests, but no repository-creation action. No GitHub repository was created in that particular deployment test.

Devin separately reports a successful handoff from a new repository created in GitHub Mobile. Together these observations support a practical phone workflow: create a repository in GitHub Mobile if needed, return to ChatGPT to save and commit with connected GitHub write tools, then deploy with Vercel. They are two observations, not a claim that the latest deployment was Git-backed. They do not establish support for every app framework, account or permission set.

A separate unauthenticated check of the supplied deployment address redirected to Vercel login. Treat the reported deployment and content fetch as evidence of deployment capability; public availability still needs the signed-out check below. Do not infer that a successful authenticated fetch means strangers can open the site.

Avoid blanket claims that ChatGPT's GitHub access is read-only or that native mobile deployment is impossible. A context-only integration and a write-capable connected app expose different tools. Use the learner's current tool inventory, not a limitation from another integration or surface.

## Claude: documented connector support

[Anthropic's Vercel listing](https://claude.com/connectors/vercel) explicitly includes Claude mobile and read/write access. [Claude's connector help](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities) supports connectors on iOS and Android, including directory installation on mobile in beta. If custom connector setup is needed, web or desktop remains the primary setup surface. [Remote MCP connections](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) run from Anthropic's cloud, independently of the learner's computer.

Combining that support with Vercel's file deployment tool gives a documented basis for direct deployment from Claude mobile without a local computer or a GitHub repository. This combined workflow has not been exercised in this pack's native-phone test. Confirm that the authenticated conversation actually exposes the deployment tool before proceeding. [Claude Code cloud](https://code.claude.com/docs/en/web-quickstart) remains an alternative for a GitHub-based coding workflow; it is not a prerequisite for the direct connector route.

## Cursor: cloud agent with deployment tools

Use a Cloud machine in [Cursor's mobile workflow](https://cursor.com/docs/cloud-agent/mobile), rather than a worker on the learner's computer. Configure its repository and cloud environment as required. The supported iOS app and phone browser at [cursor.com/agents](https://cursor.com/agents) can control cloud work.

[Cloud agent capabilities](https://cursor.com/docs/cloud-agent/capabilities#mcp-tools) document personal MCP servers in the web agent's MCP dropdown, shared team servers in the dashboard, and per-user OAuth. Enable and authenticate the Vercel HTTP server for that cloud agent; an integration configured only in the desktop IDE is not proof it is enabled in the cloud.

Vercel's direct tool can provide deployment without first configuring Git-triggered hosting. This is an inference from documented cloud MCP and Vercel capabilities, not an end-to-end phone deployment test performed for this pack. It removes a hosting dependency; it does not remove Cursor's cloud environment setup requirements or imply the agent executes on the phone.

For a Git-based hosting route, [Vercel's GitHub integration](https://vercel.com/docs/git/vercel-for-github) can generate branch previews and deploy the production branch. Repository access in the coding app does not configure that hosting integration. Confirm the host, project and production branch instead of assuming that any push publishes the app.

## Verify the result and preserve the choice

1. Establish the approved project, account, destination and visibility. Keep sign-in, credentials and recovery codes outside the conversation and progress record.
2. Deploy the learner's actual app, inspect the build result and retain the production address. A preview is useful feedback but does not by itself establish the agreed production release.
3. Request the address without authentication, inspect redirects and confirm expected app content. A login page returning HTTP 200 is a failed public-access check. An authenticated deployment-fetch tool can verify protected content but cannot establish public availability.
4. Have the learner open the address in a private browser tab while signed out and try the main action. If deployment protection blocks public access, explain the relevant project setting and apply only the visibility change they authorized. Do not disable protection across their account.
5. If saving to GitHub was chosen, verify the repository, branch and source commit separately. Direct file deployment does not automatically create a GitHub backup or configure future Git deployments.
6. Save nonsecret route, consent, link, source location when applicable, and checked versus reported results under `phase-1-deployment-extra-credit`. Record unresolved public access or setup as deferred with a resume point; never mark a login page as a working public app.

Gemini is not a supported companion for this pack. Free Claude Sonnet is a Phase 1 workaround for Antigravity users or those with untested or unsupported harnesses; Antigravity remains the Google computer route. Manual Cloudflare upload is agent-neutral.
