---
id: agent-ready-website
kind: lesson
phase: phase-3
level: 1
title: "Level 1: Make your website agent-ready"
label: PHASE 03 / LEVEL 1
summary: Help an AI agent find your public pages, answer from them with a link, and leave out anything you have not published.
route: /phases/3/agent-ready-website
status: current
updated: 2026-11-08
---

# Level 1: Make your website agent-ready

More people now ask an AI agent about a project instead of opening its website. This lesson helps that agent find your public pages, read them, answer from them and link back, while anything you have not published stays out of reach. You work on the website you already have. You do not need an API, a command-line tool, an MCP server or a package.

Level 1 earns a readiness milestone. It does not finish Phase 3 on its own: Phase 3 is complete when a command, API or MCP tool passes the [real-client checks](/phases/3#prove-it-with-a-real-client).

## Start with your own site

Ask your agent to look at your actual site before it changes anything:

1. Read the source and the live pages, and list the public pages that matter most.
2. Write down three facts a visitor might ask an agent about, and the page where each one lives.
3. Write down what must stay out: drafts, private records, internal notes, and anything behind a sign-in.

That short list is your plan. Review it and give your go-ahead before your agent edits the site.

## The simple pass

Most sites need only these changes. Work through them in order and stop when your checks pass.

### Put the facts in the page itself

Use real HTML structure: one main heading, a heading for each section, lists and tables for lists and tables, and links whose text says where they go. Make sure each important fact is in the HTML your server sends, not added later by JavaScript. Many agents read a page without running its scripts, so text that appears only after a script runs can be invisible to them.

### Give each page one address

Choose one address for each page: one host (with or without `www`) and one form of the path. Add a canonical link to the page's `<head>`. When a page moves, redirect its old address permanently (HTTP 301) instead of keeping a second copy.

```html
<link rel="canonical" href="https://example.com/borrowing">
```

### Decide what is public before you publish

An agent can only repeat what you publish. Build your public pages and data with two rules: publish only content marked ready, and copy only the fields you chose to make public (an allowlist), so a field added later stays private until you add it to the list. Drafts and internal notes then never reach the built site, its Markdown or JSON copies, `llms.txt` or the sitemap.

Hiding text with CSS, leaving a page unlinked, or blocking it in `robots.txt` does not make it private. Never put passwords, keys or personal data in a website's repository at all.

### Add a truthful llms.txt

`llms.txt` is a short Markdown file at your site's root, `/llms.txt`, that says what the site is and links to the pages worth reading. List only public pages that load, describe each in a few words, and update the file when those pages change. It is a convention that some agents use, not a guarantee that an agent reads it or answers correctly.

```markdown
# Your project

> One sentence about what it is.

## Pages

- [How borrowing works](https://example.com/borrowing): membership, loan limits and late returns
```

### Keep the sitemap and robots.txt consistent

List each live page once in `/sitemap.xml`, at its canonical address, with a `lastmod` date that matches the page's own updated date. Point to the sitemap from `/robots.txt`, and check that `robots.txt` does not block pages you want agents to read. Robots rules are requests to well-behaved crawlers, not access control.

### Add Markdown or JSON only when it helps

A Markdown copy of a long page, or a JSON file of records such as a catalog, can be easier for an agent to read. Generate it from the same source as the HTML so the two never disagree, link it from the page, and serve it as text or JSON rather than as a download. A small site with clear HTML can skip this.

## Keep it fresh, and withdraw pages on purpose

Show a visible updated date where it matters, and keep it equal to the sitemap's `lastmod` and any JSON `updated` field. When you remove a page, take it out of the sitemap and `llms.txt`, and make its address return 410 Gone, or a 301 redirect to a replacement, instead of an empty page that still returns 200. Agents and search tools can keep older copies for a while; a clear status helps them catch up.

## Check it from outside

Your build folder is not what visitors receive. Check the deployed site with ordinary HTTP requests, the way a client sees it. Ask your agent to run these checks against your real address and show you the results.

| Check | What to expect |
| --- | --- |
| Each important page | `200`, `text/html`, and a canonical link to its own address |
| A moved page's old address | `301` to the new address |
| A removed page | `410`, or `301` to a replacement |
| `/llms.txt`, `/sitemap.xml` and `/robots.txt` | `200`, text or XML, listing only live public pages |
| Markdown and JSON copies | `200`, a text or JSON content type |
| Each key fact | Present in the page's HTML without running scripts |
| Something you have not published | Absent from every page and file above |

```sh
curl -sI https://example.com/borrowing
curl -s https://example.com/borrowing | grep -i canonical
curl -s https://example.com/llms.txt
```

## Prove it with a separate agent

Open a new session in an agent app that has not seen your project. Give it only your site's address and two questions:

1. A question your site answers, asking for the page it used: "Using only `https://example.com`, how many tools can a member borrow at once? Give the address of the page you used."
2. A question about something you have not published: "What will the fee be after the planned winter change?"

The check passes when the first answer is correct and cites the right public page, and the second says the site does not publish that, without guessing. Open the cited page yourself and confirm the fact is there. If the agent cannot find a page, improve your links, HTML or `llms.txt` and ask again in a fresh session.

## Record your milestone

Ask your agent to mark the `agent-ready-website` step completed in your private progress file, with a short `verification` object as the [Phase 3 page](/phases/3#save-your-milestones) and the progress guide describe:

```json
"verification": {
  "interface": "website",
  "client": "<the separate agent app you used>",
  "operation": "GET https://example.com/borrowing",
  "expected_output_check": "passed",
  "negative_case_check": "passed",
  "learner_confirmed": true,
  "verified_at": "<when you checked, as an ISO date and time>",
  "requirements_revision": "<the current requirements revision>",
  "summary": "Answered the loan limit from /borrowing and said the winter fee is not published."
}
```

Save only these short notes, never logs, keys or private data. This readiness milestone stays recorded on its own; Phase 3 completion still needs a command, API or MCP tool from Level 2, 3 or 4.

## See it in an example

The [Lantern Street Tool Library](/examples/agent-ready-website/) is a small fictional site made for this lesson. Look at:

- the HTML of each page, its canonical link and its visible updated date;
- its `llms.txt`, `sitemap.xml`, the Markdown copy of each page and the two JSON files, linked at the bottom of every page;
- `/examples/agent-ready-website/rules`, an old address that redirects to the borrowing page, and `/examples/agent-ready-website/summer-hours`, a withdrawn page that returns 410 Gone;
- the "open now" badge on the home page, which only a browser running scripts shows, while the opening hours it is based on are plain text;
- what is missing. Its source holds an unpublished draft announcement and internal notes about each tool, and none of it appears in any page or file.

Because the example lives inside this site, its `llms.txt` and sitemap sit in its own folder and this site's `robots.txt` points to that sitemap. Put yours at your own site's root.

## Go deeper when it helps

These are optional. Choose one only when your project needs it.

- **Your framework's own tools.** Many site frameworks can generate sitemaps, canonical links and page metadata. Ask your agent to check your framework's current documentation before adding them by hand.
- **Structured data.** Schema.org markup can describe things such as events, products or opening hours in a form search tools understand.
- **A publication check.** A test that fails your build when a draft or internal field reaches the output, like the one behind this example.
- **Uppercut Agent Native.** The released `@uppercut-labs/agent-native` package, version 1.1.0, describes an operation once and serves it as an HTTP API, a command or an MCP tool. It is the optional accelerator for Levels 2 to 4. It does not convert a website, and Level 1 does not need it.

When your milestone is recorded, return to [Phase 3](/phases/3#choose-what-an-agent-should-do) to choose a command, API or MCP tool for your project.
