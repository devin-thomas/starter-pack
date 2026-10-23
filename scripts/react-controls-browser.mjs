import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");
const temporary = await mkdtemp(path.join(tmpdir(), "starter-react-controls-"));
const pageErrors = [];
const consoleErrors = [];
const checks = [];
let browser;
let server;
let page;

try {
  const bundle = path.join(temporary, "fixture.js");
  await build({
    entryPoints: [fileURLToPath(new URL("./fixtures/react-controls.tsx", import.meta.url))],
    outfile: bundle,
    bundle: true,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
  });
  const source = await readFile(bundle);
  server = createServer((request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "Content-Type": "text/html" }).end('<!doctype html><html><body><button id="focus-sentinel">Focus sentinel</button><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
    } else if (request.url === "/fixture.js") {
      response.writeHead(200, { "Content-Type": "application/javascript" }).end(source);
    } else if (request.url?.startsWith("/icons/")) {
      response.writeHead(200, { "Content-Type": "image/svg+xml" }).end('<svg xmlns="http://www.w3.org/2000/svg"/>');
    } else if (request.url === "/favicon.ico") {
      response.writeHead(204).end();
    } else {
      response.writeHead(404).end("Unknown synthetic fixture resource.");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.waitForFunction(() => window.controlsTest !== undefined);

  async function startCopy(text) {
    const index = await page.evaluate((value) => {
      window.controlsTest.clear();
      window.controlsTest.renderCopy(value);
      return window.controlsTest.copies().length;
    }, text);
    await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
    const writes = await page.evaluate(() => window.controlsTest.copies());
    assert.equal(writes.length, index + 1);
    assert.deepEqual(writes[index], { text, startedInClick: true }, "clipboard write starts in the original click dispatch");
    return index;
  }

  async function settleCopy(index, settlement) {
    await page.evaluate(async ({ index, settlement }) => window.controlsTest.settleCopy(index, settlement), { index, settlement });
  }

  async function assertIdleCopy(text) {
    assert.equal(await page.locator(".copy-status").textContent(), "");
    assert.equal(await page.locator(".copy-disclosure").getAttribute("open"), null);
    assert.equal(await page.locator("textarea").inputValue(), text);
    assert.equal(await page.evaluate(() => document.activeElement?.id), "focus-sentinel");
  }

  const success = await startCopy("Synthetic successful prompt");
  await settleCopy(success, "resolve");
  await page.getByRole("button", { name: "Prompt copied", exact: true }).waitFor();
  assert.match(await page.locator(".copy-status").textContent(), /Prompt copied/);
  checks.push("clipboard success and synchronous activation");

  for (const settlement of ["resolve", "reject"]) {
    for (const unmount of [false, true]) {
      const index = await startCopy(`Obsolete prompt ${settlement} ${unmount}`);
      const replacement = `Current prompt ${settlement} ${unmount}`;
      await page.evaluate(({ replacement, unmount }) => {
        if (unmount) window.controlsTest.clear();
        window.controlsTest.renderCopy(replacement);
        document.getElementById("focus-sentinel").focus();
      }, { replacement, unmount });
      await settleCopy(index, settlement);
      await assertIdleCopy(replacement);
    }
  }
  checks.push("clipboard stale success and failure after text replacement and unmount");

  const older = await startCopy("Latest clipboard command wins");
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await settleCopy(older + 1, "resolve");
  await settleCopy(older, "reject");
  await page.getByRole("button", { name: "Prompt copied", exact: true }).waitFor();
  assert.equal(await page.locator(".copy-disclosure").getAttribute("open"), null);

  const rejectedOlder = await startCopy("Older failure cannot steal focus");
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await page.locator("#focus-sentinel").focus();
  await settleCopy(rejectedOlder, "reject");
  await assertIdleCopy("Older failure cannot steal focus");
  await settleCopy(rejectedOlder + 1, "resolve");
  await page.getByRole("button", { name: "Prompt copied", exact: true }).waitFor();

  const staleSuccess = await startCopy("Latest denial must stay visible");
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await settleCopy(staleSuccess + 1, "reject");
  await settleCopy(staleSuccess, "resolve");
  assert.match(await page.locator(".copy-status").textContent(), /Copy did not work/);
  assert.equal(await page.locator(".copy-disclosure").getAttribute("open"), "");
  checks.push("clipboard operations settle out of order");

  const denied = await startCopy("Select this synthetic prompt manually");
  await settleCopy(denied, "reject");
  assert.match(await page.locator(".copy-status").textContent(), /Copy did not work/);
  assert.equal(await page.locator(".copy-disclosure").getAttribute("open"), "");
  assert.deepEqual(await page.locator("textarea").evaluate((field) => ({
    focused: document.activeElement === field,
    selected: field.value.slice(field.selectionStart, field.selectionEnd),
  })), { focused: true, selected: "Select this synthetic prompt manually" });
  checks.push("clipboard denial opens and selects manual recovery");

  async function startFeedback(message) {
    const index = await page.evaluate(() => {
      window.controlsTest.clear();
      window.controlsTest.renderFeedback();
      return window.controlsTest.requests().length;
    });
    await page.locator('[name="message"]').fill(message);
    await page.getByRole("button", { name: "Send message", exact: true }).click();
    await page.locator("fieldset[disabled]").waitFor();
    assert.equal(await page.locator('button[type="submit"]').isDisabled(), true);
    assert.equal(await page.locator(".feedback-status").textContent(), "Sending your message...");
    const requests = await page.evaluate(() => window.controlsTest.requests());
    assert.equal(requests.length, index + 1);
    assert.deepEqual(JSON.parse(requests[index].body), {
      kind: "feedback", phase: "general", name: "", email: "", message,
      projectTitle: "", projectUrl: "", lessons: "", allowFeature: false, website: "",
    });
    assert.equal(requests[index].aborted, false);
    return index;
  }

  async function settleFeedback(index, settlement) {
    await page.evaluate(async ({ index, settlement }) => window.controlsTest.settleFeedback(index, settlement), { index, settlement });
  }

  const delivered = await startFeedback("Synthetic feedback success");
  await settleFeedback(delivered, "resolve");
  await page.getByRole("button", { name: "Send another message", exact: true }).waitFor();
  assert.match(await page.locator(".feedback-status").textContent(), /Your message was sent/);
  assert.equal(await page.locator(".feedback-status").evaluate((status) => document.activeElement === status), true);
  checks.push("feedback wire contract and successful submission");

  const failed = await startFeedback("Keep this synthetic failed draft");
  await settleFeedback(failed, "reject");
  assert.match(await page.locator(".feedback-status").textContent(), /We could not confirm delivery/);
  assert.equal(await page.locator('[name="message"]').inputValue(), "Keep this synthetic failed draft");
  assert.equal(await page.locator('button[type="submit"]').isDisabled(), false);
  checks.push("feedback rejection retains the editable draft");

  for (const settlement of ["resolve", "reject"]) {
    const index = await startFeedback(`Obsolete synthetic feedback ${settlement}`);
    await page.evaluate(() => {
      window.controlsTest.clear();
      window.controlsTest.renderFeedback();
      document.getElementById("focus-sentinel").focus();
    });
    assert.equal(await page.evaluate((index) => window.controlsTest.requests()[index].aborted, index), true, "unmount aborts feedback immediately");
    await settleFeedback(index, settlement);
    assert.equal(await page.locator(".feedback-status").textContent(), "");
    assert.equal(await page.locator('[name="message"]').inputValue(), "");
    assert.equal(await page.locator('button[type="submit"]').isDisabled(), false);
    assert.equal(await page.evaluate(() => document.activeElement?.id), "focus-sentinel");
  }
  checks.push("feedback abort and stale success/failure after unmount");

  assert.deepEqual(await page.evaluate(() => window.controlsTest.unhandled()), []);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  console.log(JSON.stringify({ status: "passed", checks, pageErrors, consoleErrors }));
} catch (error) {
  const fixture = page && !page.isClosed() ? await page.evaluate(() => ({
    copies: window.controlsTest?.copies(),
    requests: window.controlsTest?.requests(),
    unhandled: window.controlsTest?.unhandled(),
    feedbackStatus: document.querySelector(".feedback-status")?.textContent,
    fieldsetDisabled: document.querySelector("fieldset")?.hasAttribute("disabled"),
    invalidFields: Array.from(document.querySelectorAll(":invalid")).map((field) => field.getAttribute("name")),
  })).catch((diagnosticError) => ({ diagnosticError: String(diagnosticError) })) : null;
  console.error(JSON.stringify({ status: "failed", checks, pageErrors, consoleErrors, fixture }));
  throw error;
} finally {
  try {
    if (browser) await browser.close();
  } finally {
    try {
      if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
}
