# Level 3 workshop: connect your assistant to a tool you built

In this workshop you connect your AI assistant to a tool over MCP (the Model Context Protocol), call it, watch it refuse something, and remove it again. First you connect a public server that is known to work. Then you run a small example server on your own computer, and finally you give your own project the same kind of tool.

It takes about 30 minutes. You need a computer with **Claude Code** or the **Codex CLI** (the harness you set up in Phase 2) and **Node.js 20 or later**. Nothing here needs an account, a payment, a deployment or a password, and nothing is published.

Files in this folder:

- `https://starter.uppercut-labs.com/examples/mcp-tool-library/server.mjs`: the example server, one file with no dependencies.
- `https://starter.uppercut-labs.com/examples/mcp-tool-library/README.md`: this guide.

## Three things people call a plugin

These are different things. Knowing which one you are making keeps your promises accurate.

| What it is | Who sets it up | Example | Does it publish anything? |
| --- | --- | --- | --- |
| **An MCP server**: a program that offers tools and resources to any client that speaks MCP | The person who builds it | The example server in this folder; Cloudflare's documentation server | No. It runs wherever you start it |
| **A connection you add**: you give your own client the server's address, such as `claude mcp add` or a "custom connector" | Each user, in their own client | Steps 1 and 3 of this workshop | No. Only your client sees it |
| **A host-specific plugin or app**: a package made for one host, such as a Claude plugin or a ChatGPT app, that you upload or submit under that host's rules | The builder, separately for each host | dvn's plugin downloads (see the spotlight below) | Only if you upload or submit it, and a host directory listing is a separate review |

Connecting your server to your assistant is the second row. It does not create a plugin, and no server appears in any app directory on its own.

## Which clients this works in

This workshop runs a server on your computer at `http://127.0.0.1:8765/mcp`. Only clients on the same computer can reach that address.

| Client | Use this workshop's local server | Add and remove | Checked |
| --- | --- | --- | --- |
| **Claude Code** | Yes | `claude mcp add --transport http …` and `claude mcp remove …` ([Claude Code MCP docs](https://code.claude.com/docs/en/mcp)) | Run headless with Claude Code 2.1.286 on November 8, 2026 |
| **Codex CLI** | Yes. Codex's docs say the IDE extension and the ChatGPT desktop app share these settings | `codex mcp add … --url …` and `codex mcp remove …` ([Codex MCP docs](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)) | Run headless with Codex CLI 0.159.2 on November 8, 2026 |
| **Cursor** (desktop) | Yes, according to its docs: a `url` entry in `.cursor/mcp.json` | Remove the server in Cursor's settings ([Cursor MCP docs](https://cursor.com/docs/context/mcp)) | Documentation only |
| **Claude** (web and desktop app) | No. A custom connector takes an HTTPS server address; a server inside a private network needs Claude's MCP tunnels, so `127.0.0.1` does not work | Customize > Connectors ([Claude custom connectors](https://claude.com/docs/connectors/custom/add-unlisted)) | Documentation only |
| **ChatGPT** | No. Custom MCP servers are added on the web only, need a public address, and depend on your plan and workspace role | Settings > Plugins > Disconnect ([OpenAI: custom MCP servers](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt), [managing apps](https://help.openai.com/en/articles/20001494-connecting-and-managing-app-accounts-in-chatgpt)) | Documentation only |

Two plan limits matter if you later put a server on the internet. On the Claude Free plan you can add one custom connector, and on Team and Enterprise plans an Owner adds it. OpenAI's article lists Business, Enterprise, Edu and Pro, and limits what Pro can do. There is no supported way to add this local server from a phone.

## Step 1: connect a known-good server first

Start with a public server, so you know your client and your setup work before you test your own code. Cloudflare's documentation server needs no account. Its two tools only read Cloudflare's docs.

Claude Code:

```sh
claude mcp add --transport http cloudflare-docs https://docs.mcp.cloudflare.com/mcp
claude mcp list
```

Codex CLI:

```sh
codex mcp add cloudflare-docs --url https://docs.mcp.cloudflare.com/mcp
codex mcp list
```

`claude mcp list` should show `cloudflare-docs` with `✔ Connected`. Start a new session and ask:

> Use the Cloudflare documentation tool to find which local port `wrangler dev` listens on by default. Answer with the port number and one documentation URL you used.

You should see the client call `search_cloudflare_documentation`, and the answer should say **8787** with a link to Cloudflare's docs. If it answers without calling the tool, the check does not count; ask again and name the tool.

Then remove it, so only the servers you use stay connected:

```sh
claude mcp remove cloudflare-docs
codex mcp remove cloudflare-docs
```

Cloudflare maintains this server and can change it. On November 8, 2026 it offered `search_cloudflare_documentation` and `migrate_pages_to_workers_guide`, both marked read-only.

## Step 2: run the example server

The example is a catalog for the Lantern Street Tool Library, a fictional community library that lends tools. Make a new folder, download the server, and start it:

```sh
mkdir mcp-tool-library && cd mcp-tool-library
curl -fsSLO https://starter.uppercut-labs.com/examples/mcp-tool-library/server.mjs
node server.mjs
```

It prints `Lantern Street Tool Library (example) 1.0.0 on http://127.0.0.1:8765/mcp (read-only)`. Leave that terminal open. If port 8765 is taken, run `PORT=8766 node server.mjs` and use that port in the steps below.

Open `server.mjs` and read it with your agent. It is under 300 lines and has no dependencies. It offers:

| Kind | Name | What it does |
| --- | --- | --- |
| Tool | `search_tools` | Finds tools by words in the name, category, or whether they are in right now |
| Tool | `get_tool` | Gets one tool by its ID, such as `hedge-trimmer` |
| Resource | `library://lantern-street/opening-hours` | The opening hours, as text the client can read |
| Resource | `library://lantern-street/borrowing-rules` | Membership, loan limits and late returns |

A **tool** is something the model decides to call, with arguments. A **resource** is a document the client can read and attach for the model. Both tools are marked read-only, and each has an input schema (what it accepts) and an output schema (what it returns).

The data also holds each tool's storage location and a staff note. Those fields stand in for the private details every real project has. The server never returns them: it copies only five public fields into every answer.

## Step 3: connect it

In a second terminal, from the folder you want to work in:

Claude Code:

```sh
claude mcp add --transport http tool-library http://127.0.0.1:8765/mcp
claude mcp list
```

Codex CLI:

```sh
codex mcp add tool-library --url http://127.0.0.1:8765/mcp
codex mcp list
```

Claude Code adds the server for the current folder only (its default `local` scope), so run Claude Code from the same folder. Codex adds it to your Codex settings for every folder. Inside a session, `/mcp` lists connected servers in both clients.

## Step 4: call it and check the answer

Start a new session and ask:

> Using the tool-library MCP server, is the hedge trimmer in the library right now, and how many days can I borrow it? Answer in one sentence and name the tool you called.

Check three things:

1. The client shows a call to `search_tools` or `get_tool`. Claude Code may first load the tool with its tool search; that is normal.
2. The answer says the hedge trimmer **is available** and the loan is **14 days**.
3. The answer mentions no shelf, bin or staff note.

Write down the client and model you used. In our tests a small model sometimes answered without calling the tool and made something up. An answer without a tool call is not a passing check.

## Step 5: check one failure

Ask:

> Using the tool-library MCP server: first, reserve the cordless drill for me. Second, call get_tool with the id exactly "Hedge Trimmer!!" and quote the server's reply.

Expected:

- **Reserve:** the client finds no tool that can do it and says so. This server has no tool that changes anything, and if a client tries one anyway, the server answers `Unknown tool`.
- **Bad ID:** the server replies `id is not a valid tool ID. Use search_tools to list IDs.` and the client reports it as an error.

You can also see the server refuse a web page. A website could try to reach a server on your computer through your browser, so the server rejects any request that carries a browser `Origin` header:

```sh
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8765/mcp \
  -H "Content-Type: application/json" -H "Origin: https://example.com" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

It prints `403`. The server also listens only on `127.0.0.1`, so other computers on your network cannot reach it at all.

## Step 6: undo

Remove the connection, then stop the server with Ctrl+C in its terminal:

```sh
claude mcp remove tool-library
codex mcp remove tool-library
```

Check that it is gone: `claude mcp list` or `codex mcp list` no longer shows `tool-library`, and a new session has no `tool-library` tools. You can delete the `mcp-tool-library` folder. The example stored nothing anywhere else.

If you forget to remove it, the client keeps the entry and reports that it cannot connect while the server is stopped. Nothing else breaks, and the remove command still works later.

## Make your own

Now give your own project one MCP tool. Your agent can read `server.mjs` with you and adapt it.

1. **Choose one question an agent should answer from your project**, using data your project already shows publicly. "Which books am I reading?" is a good size. Start read-only.
2. **List the fields that may leave the server**, and return only those.
3. **Describe the tool for the model**: a clear name, a description, and an input schema with a description for each argument. Add an output schema if the result is structured.
4. **Fail clearly**: a wrong input returns a short error that says what to do instead, without repeating the input back. Never ask for, accept, log or return a password, key or token.
5. **Keep it local while you learn**: listen on `127.0.0.1` and reject browser origins, as the example does.
6. **Connect, call, break, undo**: repeat steps 3 to 6 against your own server.

You can keep the example's no-dependency style or use an official MCP SDK (for example `@modelcontextprotocol/sdk` for TypeScript). The SDK handles the protocol for you; the choices above are still yours.

Actions that change things, such as reserving a tool or posting a message, need more care: a separate tool for each action, your explicit approval for each one, and a real sign-in on any server other people can reach. Leave them for after this level.

To use your server from Claude or ChatGPT on the web, it needs a public HTTPS address. Anyone who has the address of a server without sign-in can call it, so serve only public data that way. Level 3 does not require it: a local connection in Claude Code, Codex or Cursor is enough.

## Record your result

Phase 3 counts an MCP capability when a real client calls **your own** server's tool, the answer is checked, one failure is checked, and you confirm it. Practising with the example server does not count on its own. Your agent saves a short note in the `agent-mcp` step of your private progress file, for example:

```json
{
  "interface": "mcp",
  "client": "Claude Code 2.1.286 with Claude Sonnet",
  "operation": "reading_tracker.list_books",
  "expected_output_check": "passed",
  "negative_case_check": "passed",
  "learner_confirmed": true,
  "verified_at": "2026-11-09T17:00:00Z",
  "summary": "Client discovered the tool, listed my current books, and got a clear error for an unknown shelf"
}
```

No passwords, keys, tokens, logs or private data go in that file.

## Versions and limits

- **Protocol version.** The example speaks MCP revision `2025-11-25`, the version every client listed above uses, and also accepts `2025-06-18` and `2025-03-26`. The newest specification, [`2026-07-28`](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), removes the opening handshake that the example uses. Clients that support both revisions fall back to the handshake automatically. A client that supports only `2026-07-28` cannot use this example.
- **Transport.** Streamable HTTP, answering each request with one JSON response. The server keeps no sessions, opens no event stream (it answers `GET` with 405), accepts requests up to 32 KB, and allows 120 requests a minute.
- **Node.js** 20 or later. Checked with Node.js 26.
- **Checked on November 8, 2026** with Claude Code 2.1.286, Codex CLI 0.159.2, the MCP Inspector 2.14.0 and the official TypeScript SDK client 1.32.2. Cursor, VS Code and the chat apps are described from their documentation, not tested here. Clients change often; check the linked docs if a command differs.

## Spotlight: dvn, a personal plugin you can connect today

[dvn](https://dvn.pw/) is a skill companion for agents by Devin Thomas, who also makes Starter Pack. Its public page shows all three rows of the table at the top in one place:

- **An MCP server** with no sign-in for public skills, `https://dvn.pw/agent-native/v1/mcp`. On November 8, 2026 it offered four tools (`resolve_skill`, `list_skills`, `read_skill_reference`, `get_skill_status`), all marked read-only.
- **A connection you add**: step-by-step custom connector instructions for Claude and ChatGPT, with "No sign in" for public skills.
- **Host-specific plugins**: separate plugin ZIP files for Claude and ChatGPT that you upload to your own account yourself. Downloading one does not install it, and the page says plainly that dvn's public ChatGPT app is not published yet. That is the honest version of "a plugin": nothing appears in a directory until the host reviews and lists it.

Try it the same way as step 1:

```sh
claude mcp add --transport http dvn https://dvn.pw/agent-native/v1/mcp
```

Ask "Use dvn to list its public skills. Is there a skill named starter-pack?", check that the client called `list_skills`, then remove it with `claude mcp remove dvn`. Private dvn skills need a separate sign-in; this workshop uses only the public server.
