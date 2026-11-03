import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(project, "dist/artifacts/progress-workbench/index.html"));
const progress = await readFile(path.join(project, "dist/artifacts/progress/starter-progress.example.json"));
const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (pathname === "/" || pathname === "/index.html") {
    response.writeHead(200, { "content-type": "text/html" }).end(html);
  } else if (pathname === "/starter-progress.json") {
    response.writeHead(200, { "content-type": "application/json" }).end(progress);
  } else response.writeHead(404).end();
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(origin);
  await page.locator("#source").getByText("Refreshes while this page is visible", { exact: false }).waitFor();
  await page.locator("#progress-file").setInputFiles({ name: "damaged.json", mimeType: "application/json", buffer: Buffer.from("{broken") });
  await page.getByText(/last successfully loaded record/i).waitFor();
  await page.waitForTimeout(6200);
  assert.match(await page.locator("#notice").innerText(), /damaged|unreadable|repair|supported/i);
  assert.match(await page.locator("#refresh").innerText(), /Reopen progress file/);
  assert.doesNotMatch(await page.locator("#source").innerText(), /Refreshes while this page is visible/);
  await page.locator("#progress-file").setInputFiles({ name: "restored.json", mimeType: "application/json", buffer: progress });
  await page.locator("#source").getByText("restored.json", { exact: false }).waitFor();
  assert.equal(await page.locator("#notice").innerText(), "");

  const racing = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let markRequested;
  const requested = new Promise((resolve) => { markRequested = resolve; });
  await racing.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/starter-progress.json") {
      markRequested();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return route.fulfill({ status: 200, contentType: "application/json", body: progress });
    }
    return route.continue();
  });
  await racing.goto(origin);
  await requested;
  await racing.locator("#progress-file").setInputFiles({ name: "damaged.json", mimeType: "application/json", buffer: Buffer.from("{broken") });
  await racing.getByText(/open a valid progress file to begin/i).waitFor();
  await racing.waitForTimeout(1500);
  assert.match(await racing.locator("#notice").innerText(), /open a valid progress file to begin/i);
  console.log("Workbench retained the invalid-file warning, accepted a valid replacement, and ignored an older HTTP response.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
