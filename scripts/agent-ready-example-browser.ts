// Level 1 lesson and example site in a real browser, served by the real local Worker.
// Usage: tsx scripts/agent-ready-example-browser.ts [screenshot directory outside the repository]
// Needs Playwright: set STYLE_BROWSER_MODULE to its path when it is installed outside this project.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createLocalWorker } from "./local-worker";

const output = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
assert(!output || !output.startsWith(process.cwd() + path.sep), "Screenshots must stay outside the source tree.");
if (output) await mkdir(output, { recursive: true });
const mf = await createLocalWorker();
const origin = (await mf.ready).origin;
const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");
const browser = await chromium.launch();
const results: string[] = [];
try {
  const pages = ["/phases/3/agent-ready-website", "/examples/agent-ready-website/", "/examples/agent-ready-website/borrowing", "/examples/agent-ready-website/tools"];
  for (const width of [1280, 320]) {
    for (const route of pages) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors: string[] = [];
      page.on("pageerror", (error: Error) => errors.push(error.message));
      page.on("console", (message: { type(): string; text(): string }) => { if (message.type() === "error") errors.push(message.text()); });
      // The local build may include the live analytics beacon; never contact third parties here.
      await page.route("**/*", (request: { request(): { url(): string }; continue(): Promise<void>; fulfill(options: object): Promise<void> }) =>
        new URL(request.request().url()).origin === origin ? request.continue() : request.fulfill({ status: 204, body: "" }));
      const response = await page.goto(origin + route, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200, route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `${route} at ${width}px overflows by ${overflow}px`);
      assert.equal(await page.locator("h1").count(), 1, `${route}: one h1`);
      await page.keyboard.press("Tab");
      assert.match(await page.evaluate(() => document.activeElement?.textContent ?? ""), /Skip to content/, `${route}: skip link is first`);
      if (route.endsWith("/agent-ready-website/")) {
        assert.match(await page.locator("#open-now").innerText(), /^(Open|Closed) now$/, "badge appears when scripts run");
      }
      if (route === "/phases/3/agent-ready-website") {
        assert.ok(await page.locator('a[href="/examples/agent-ready-website/"]').count(), "lesson links the example");
        assert.match(await page.locator("h1").innerText(), /Make your website agent-ready/);
      }
      assert.deepEqual(errors, [], `${route}: no page errors`);
      if (output) await page.screenshot({ path: path.join(output, `${route.replace(/\W+/g, "-").replace(/^-|-$/g, "")}-${width}.png`), fullPage: true });
      results.push(`PASS ${route} at ${width}px`);
      await page.close();
    }
  }
  // A client that does not run scripts still gets every fact; only the badge is missing.
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  const page = await context.newPage();
  await page.goto(origin + "/examples/agent-ready-website/");
  assert.equal(await page.locator("#open-now").isVisible(), false);
  assert.match(await page.locator("main").innerText(), /Tuesday and Thursday: 4 PM to 8 PM/);
  results.push("PASS scripts disabled: hours readable, badge absent");
  await context.close();
} finally {
  await browser.close();
  await mf.dispose();
}
for (const line of results) console.log(line);
console.log(`Level 1 browser checks passed (${results.length}).`);
