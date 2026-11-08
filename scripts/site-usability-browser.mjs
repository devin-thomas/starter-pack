import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import siteOrigins from "../src/site-origin.json" with { type: "json" };

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.join(project, "dist");
const output = process.env.USABILITY_BROWSER_OUTPUT
  ? path.resolve(process.env.USABILITY_BROWSER_OUTPUT)
  : await mkdtemp(path.join(tmpdir(), "starter-pack-usability-"));
assert(output !== project && !output.startsWith(project + path.sep), "Browser artifacts must stay outside the source tree.");
await mkdir(output, { recursive: true });
const physicalOutput = await realpath(output);
const physicalProject = await realpath(project);
assert(physicalOutput !== physicalProject && !physicalOutput.startsWith(physicalProject + path.sep), "Browser artifacts must not resolve into the source tree.");

const lessonSlugs = [
  "cappy", "computer-setup", "grill-to-build", "long-horizon-dashboard",
  "no-useless-copy", "perfect-playlist", "pwa-development", "quick-build",
  "starter-pack", "surface-sweep-showcase", "surface-sweep", "vidchopper-cli",
];
const plaintextConsumers = [
  ...lessonSlugs.map((slug) => ({ route: `/skills/${slug}`, source: `content/skills/${slug}.md` })),
  { route: "/help/cloudflare-iphone", source: "content/pages/cloudflare-iphone.md" },
];
const allCases = [
  "starting-prompt:/", "starting-prompt:/guide",
  "skill-prompt:/skills", "skill-prompt:/skills/quick-build", "contact:320",
  ...[320, 390].flatMap((width) => plaintextConsumers.map(({ route }) => `plaintext:${route}:${width}`)),
  "program-code:TypeScript:320", "resources:entry-point",
];
const selectedCase = process.env.USABILITY_BROWSER_CASE;
assert(!selectedCase || allCases.includes(selectedCase), "USABILITY_BROWSER_CASE must identify an existing case.");
const expectedCases = selectedCase ? [selectedCase] : allCases;
const report = {
  status: "running",
  started_at: new Date().toISOString(),
  fixtures: ["Local production build; analytics requests suppressed; live mutation requests blocked; real Chromium clipboard."],
  visual_review: "Not performed by this script. Captured images require separate inspection.",
  excluded_cases: allCases.filter((id) => !expectedCases.includes(id)),
  cases: expectedCases.map((id) => ({ id, status: "not-executed" })),
  page_errors: [], failed_requests: [], http_errors: [], server_errors: [], mutation_requests: [], captures: [],
};
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript",
  ".css": "text/css", ".json": "application/json", ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".woff2": "font/woff2", ".ico": "image/x-icon",
};
let browser;
let page;
let origin;
let currentCase = "setup";

/** @param {string} pathname @returns {Promise<string | undefined>} */
async function findAsset(pathname) {
  const base = path.resolve(root, "." + decodeURIComponent(pathname));
  if (base !== root && !base.startsWith(root + path.sep)) return undefined;
  for (const candidate of [base, base + ".html", path.join(base, "index.html")]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
    }
  }
  return undefined;
}

const server = createServer((request, response) => {
  void (async () => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      report.mutation_requests.push({ layer: "server", method: request.method, url: request.url });
      response.writeHead(405).end("Read-only test server.");
      return;
    }
    const file = await findAsset(new URL(request.url, "http://127.0.0.1").pathname);
    if (!file) { response.writeHead(404).end("Not found."); return; }
    response.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    response.setHeader("Cache-Control", "no-store");
    response.end(request.method === "HEAD" ? undefined : await readFile(file));
  })().catch((error) => {
    report.server_errors.push(String(error));
    if (!response.headersSent) response.writeHead(500);
    response.end("Test server failed.");
  });
});

/** @param {string} id @param {() => Promise<unknown>} check @returns {Promise<void>} */
async function testCase(id, check) {
  if (selectedCase && id !== selectedCase) return;
  const record = report.cases.find((entry) => entry.id === id);
  assert(record && record.status === "not-executed", `Unexpected or repeated case: ${id}`);
  currentCase = id;
  record.status = "running";
  try { record.observations = await check(); record.status = "passed"; }
  catch (error) { record.status = "failed"; record.error = String(error); throw error; }
}

/** @param {string} route @returns {Promise<void>} */
async function navigate(route) {
  const response = await page.goto(origin + route, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200, `${route}: production page responds successfully`);
  assert.equal(new URL(page.url()).origin, origin, `${route}: intended local server`);
  assert.equal(new URL(page.url()).pathname, route, `${route}: intended route`);
  await page.locator("main").waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator("#site-data").count(), 1, `${route}: production application data exists`);
}

/** @returns {Promise<void>} */
async function noPageOverflow() {
  const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert(geometry.scrollWidth <= geometry.width + 1, `${currentCase}: page overflow ${JSON.stringify(geometry)}`);
}

/** @param {string} name @returns {Promise<void>} */
async function capture(name) {
  const destination = path.join(output, name + ".png");
  await page.screenshot({ path: destination });
  report.captures.push({ case: currentCase, path: destination, visually_inspected: false });
}

/** @param {import("playwright").Locator} component @param {string} copiedLabel @returns {Promise<void>} */
async function assertCopyAnnouncement(component, copiedLabel) {
  const status = component.locator(":scope > .copy-status");
  assert.equal(await status.getAttribute("role"), "status");
  assert.equal(await status.getAttribute("aria-live"), "polite");
  assert.notEqual(await status.getAttribute("aria-hidden"), "true");
  assert.match(await status.textContent(), new RegExp(copiedLabel));
  const geometry = await status.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return { width: box.width, height: box.height, clip: style.clip, clipPath: style.clipPath, display: style.display, visibility: style.visibility };
  });
  assert(geometry.width <= 1 && geometry.height <= 1 && (geometry.clip !== "auto" || geometry.clipPath !== "none"), `${currentCase}: copied announcement must not duplicate visible instructions: ${JSON.stringify(geometry)}`);
  assert.notEqual(geometry.display, "none", "The live announcement remains in the accessibility tree.");
  assert.notEqual(geometry.visibility, "hidden", "The live announcement remains available.");
  assert.equal(await component.locator(":scope > .prompt-controls > span").count(), 1, "The visible instruction remains present once.");
}

/** @param {import("playwright").Locator} field @returns {Promise<void>} */
async function assertSelected(field) {
  const selection = await field.evaluate((element) => ({ focused: document.activeElement === element, start: element.selectionStart, end: element.selectionEnd, length: element.value.length }));
  assert(selection.focused && selection.start === 0 && selection.end === selection.length, `${currentCase}: native manual selection covers the complete payload`);
}

try {
  assert.equal(plaintextConsumers.length, 13, "All thirteen plaintext consumers must be covered.");
  const expectedPrompt = (await readFile(path.join(project, "public/prompts/get-started.txt"), "utf8")).trim();
  const expectedPacket = await readFile(path.join(root, "agent/phase-1-packet.txt"), "utf8");
  assert.equal(expectedPrompt.length, 476, "The current starting prompt remains complete.");
  assert(expectedPrompt.includes(siteOrigins.canonicalOrigin + "/recommendations"));
  assert.match(expectedPrompt, /Read https:\/\/raw\.githubusercontent\.com\/[^\s]+\/public\/agent\/packets\/phase-1-[a-f0-9]{16}\.md and guide me/);
  for (const consumer of plaintextConsumers) {
    const source = (await readFile(path.join(project, consumer.source), "utf8")).replace(/\r\n/g, "\n");
    consumer.blocks = [...source.matchAll(/^```text[^\S\n]*\n([\s\S]*?)^```[^\S\n]*$/gm)].map((match) => match[1]);
    assert(consumer.blocks.length > 0, `${consumer.source}: a required plaintext block is missing`);
  }
  const skills = JSON.parse(await readFile(path.join(root, "skills.json"), "utf8"));
  const quickBuild = JSON.parse(await readFile(path.join(root, "skills/quick-build.json"), "utf8"));
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const address = server.address();
  assert(address && typeof address !== "string", "The test server must expose its actual listener.");
  origin = `http://127.0.0.1:${address.port}`;
  const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  await context.route("**/*", (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      report.mutation_requests.push({ layer: "browser", method: request.method(), url: request.url() });
      return route.abort("blockedbyclient");
    }
    const url = new URL(request.url());
    if (url.hostname === "static.cloudflareinsights.com") return route.fulfill({ status: 204, body: "" });
    if (url.origin !== origin && !["data:", "blob:"].includes(url.protocol)) return route.abort("blockedbyclient");
    return route.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.on("pageerror", (error) => report.page_errors.push({ case: currentCase, message: error.message }));
  page.on("requestfailed", (request) => report.failed_requests.push({ case: currentCase, url: request.url(), error: request.failure()?.errorText }));
  page.on("response", (response) => { if (response.status() >= 400) report.http_errors.push({ case: currentCase, url: response.url(), status: response.status() }); });

  for (const route of ["/", "/guide"]) {
    await testCase(`starting-prompt:${route}`, async () => {
      await navigate(route);
      const primary = page.locator("#starting-prompt > .copy-text");
      assert.equal(await primary.getByRole("button", { name: "Copy prompt", exact: true }).count(), 1);
      assert.equal(await primary.getByRole("button", { name: "Get Started", exact: true }).count(), 0);
      await primary.getByRole("button", { name: "Copy prompt", exact: true }).press("Enter");
      await primary.getByRole("button", { name: "Prompt copied", exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expectedPrompt);
      await assertCopyAnnouncement(primary, "Prompt copied");
      await primary.locator("summary").press("Enter");
      const promptField = primary.getByLabel("Starting prompt text", { exact: true });
      assert.equal(await promptField.inputValue(), expectedPrompt);
      await primary.getByRole("button", { name: "Select all", exact: true }).press("Enter");
      await assertSelected(promptField);
      await page.locator(".packet-recovery > summary").press("Enter");
      const packet = page.locator(".packet-recovery > .copy-text");
      assert.equal(await packet.locator("summary").textContent(), "Read or select the instruction packet");
      assert.notEqual(await packet.locator("summary").textContent(), await primary.locator("summary").textContent());
      await packet.locator("summary").press("Enter");
      const packetField = packet.getByLabel("Phase 1 instruction packet", { exact: true });
      assert.equal(await packetField.inputValue(), expectedPacket);
      await packet.getByRole("button", { name: "Copy instruction packet", exact: true }).press("Enter");
      await packet.getByRole("button", { name: "Instruction packet copied", exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expectedPacket);
      await assertCopyAnnouncement(packet, "Instruction packet copied");
      await noPageOverflow();
      return { prompt_characters: expectedPrompt.length, packet_characters: expectedPacket.length, clipboard: "native", activation: "keyboard" };
    });
  }

  for (const item of [
    { route: "/skills", topLabel: "Copy selection prompt", topField: "Choose a public skill", disclosure: "Read or select the selection prompt", top: `Read ${siteOrigins.canonicalOrigin}/skills.json and help me choose and install the public skill that fits my project.`, installation: skills.installation.prompt, installField: "Choose and install skills with your agent" },
    { route: "/skills/quick-build", topLabel: "Copy lesson prompt", topField: "Get started with Quick Build", disclosure: "Read or select the lesson prompt", top: `Read ${siteOrigins.canonicalOrigin}/skills/quick-build.md and help me install and use Quick Build for my project.`, installation: quickBuild.installation.prompt, installField: "Install Quick Build with your agent" },
  ]) {
    await testCase(`skill-prompt:${item.route}`, async () => {
      assert.equal(typeof item.installation, "string");
      assert.notEqual(item.top, item.installation, "Lesson/selection and installation are different tasks.");
      await navigate(item.route);
      assert.equal(await page.getByRole("button", { name: item.topLabel, exact: true }).count(), 1);
      assert.equal(await page.getByRole("button", { name: "Copy installation prompt", exact: true }).count(), 1);
      await page.getByRole("button", { name: item.topLabel, exact: true }).click();
      await page.getByRole("button", { name: item.route === "/skills" ? "Selection prompt copied" : "Lesson prompt copied", exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), item.top);
      await page.getByText(item.disclosure, { exact: true }).press("Enter");
      assert.equal(await page.getByLabel(item.topField, { exact: true }).inputValue(), item.top);
      await page.getByRole("button", { name: "Copy installation prompt", exact: true }).click();
      await page.getByRole("button", { name: "Installation prompt copied", exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), item.installation);
      await page.getByText("Read or select the installation prompt", { exact: true }).press("Enter");
      assert.equal(await page.getByLabel(item.installField, { exact: true }).inputValue(), item.installation);
      assert.notEqual(item.topField, item.installField);
      return { distinct_buttons: [item.topLabel, "Copy installation prompt"], distinct_manual_fields: [item.topField, item.installField], clipboard: "native" };
    });
  }

  await testCase("contact:320", async () => {
    await page.setViewportSize({ width: 320, height: 844 });
    await navigate("/contact");
    const phase = page.locator('select[name="phase"]');
    assert.equal(await phase.inputValue(), "general");
    const textGeometry = await phase.evaluate((select) => {
      const style = getComputedStyle(select);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas text measurement is unavailable.");
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const selectedText = select.selectedOptions[0].textContent.trim();
      const nativeArrowReserve = 20;
      return { selectedText, font: context.font, textWidth: context.measureText(selectedText).width, clientWidth: select.clientWidth, availableWidth: select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - nativeArrowReserve, nativeArrowReserve };
    });
    assert.equal(textGeometry.selectedText, "General / multiple phases");
    assert(textGeometry.textWidth <= textGeometry.availableWidth + 0.5, `The selected option must fit with native indicator space: ${JSON.stringify(textGeometry)}`);
    await noPageOverflow();
    await capture("contact-320");
    const email = page.locator('input[name="email"]');
    await page.locator('textarea[name="message"]').fill("Local browser validation fixture; do not send.");
    await email.fill("invalid-address");
    assert.equal(await email.evaluate((element) => element.validity.typeMismatch), true);
    assert.equal(await page.locator("form.feedback-form").evaluate((form) => form.checkValidity()), false);
    await page.locator("form.feedback-form").evaluate((form) => {
      window.usabilityValidationEvents = { invalid: 0, submit: 0 };
      form.addEventListener("invalid", () => { window.usabilityValidationEvents.invalid++; }, true);
      form.addEventListener("submit", () => { window.usabilityValidationEvents.submit++; }, true);
    });
    await page.getByRole("button", { name: "Send message", exact: true }).click();
    await page.waitForFunction(() => window.usabilityValidationEvents.invalid > 0);
    assert.equal(await page.evaluate(() => window.usabilityValidationEvents.submit), 0);
    assert.deepEqual(report.mutation_requests, [], "Invalid form must not attempt delivery.");
    return { ...textGeometry, native_email_validation: true, delivery_attempted: false };
  });

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const consumer of plaintextConsumers) {
      await testCase(`plaintext:${consumer.route}:${width}`, async () => {
        await navigate(consumer.route);
        const blocks = page.locator(".prose pre > code.language-text");
        assert.equal(await blocks.count(), consumer.blocks.length, `${consumer.route}: every source text block is rendered`);
        const observations = [];
        for (const [index, expected] of consumer.blocks.entries()) {
          const block = blocks.nth(index);
          assert.equal(await block.textContent(), expected, `${consumer.route}: complete prompt text is unchanged`);
          const geometry = await block.evaluate((code) => {
            const pre = code.parentElement;
            const style = getComputedStyle(pre);
            return { whiteSpace: style.whiteSpace, overflowWrap: style.overflowWrap, clientWidth: pre.clientWidth, scrollWidth: pre.scrollWidth };
          });
          assert.equal(geometry.whiteSpace, "pre-wrap", `${consumer.route}: prose prompts wrap`);
          assert.equal(geometry.overflowWrap, "anywhere", `${consumer.route}: long prompt tokens can reflow`);
          assert(geometry.scrollWidth <= geometry.clientWidth + 1, `${consumer.route}: prompt requires no horizontal scrolling: ${JSON.stringify(geometry)}`);
          observations.push({ characters: expected.length, ...geometry });
        }
        await noPageOverflow();
        if (consumer.route === "/skills/quick-build" && width === 320) {
          await blocks.first().scrollIntoViewIfNeeded();
          await capture("quick-build-320");
        }
        return { width, blocks: observations };
      });
    }
  }

  await testCase("program-code:TypeScript:320", async () => {
    await page.setViewportSize({ width: 320, height: 844 });
    await navigate("/style/TypeScript");
    const blocks = page.locator(".style-guide-prose pre > code.language-ts");
    assert(await blocks.count() > 0, "TypeScript program-code examples must exist.");
    const observations = await blocks.evaluateAll((codes) => codes.map((code) => {
      const pre = code.parentElement;
      const style = getComputedStyle(pre);
      pre.scrollLeft = pre.scrollWidth;
      return { whiteSpace: style.whiteSpace, overflowX: style.overflowX, clientWidth: pre.clientWidth, scrollWidth: pre.scrollWidth, scrollLeft: pre.scrollLeft };
    }));
    assert(observations.every((item) => item.whiteSpace === "pre"), "Program code preserves line structure.");
    assert(observations.every((item) => ["auto", "scroll"].includes(item.overflowX)), "Program code retains an accessible horizontal scroll region.");
    assert(observations.some((item) => item.scrollWidth > item.clientWidth + 1 && item.scrollLeft > 0), "A real long TypeScript example must remain horizontally scrollable.");
    const longIndex = observations.findIndex((item) => item.scrollWidth > item.clientWidth + 1);
    const scrollRegion = blocks.nth(longIndex).locator("..");
    assert.equal(await scrollRegion.getAttribute("tabindex"), "0", "Keyboard users can reach the code region.");
    assert.equal(await scrollRegion.getAttribute("aria-label"), "Scrollable code example");
    await scrollRegion.evaluate((node) => { node.scrollLeft = 0; });
    await scrollRegion.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    assert(await scrollRegion.evaluate((node) => node.scrollLeft > 0), "Keyboard scroll moves the code region.");
    await noPageOverflow();
    return { blocks: observations.length, scrollable_examples: observations.filter((item) => item.scrollLeft > 0).length };
  });

  await testCase("resources:entry-point", async () => {
    await navigate("/resources");
    const entry = page.getByLabel("Agent entry point address", { exact: true });
    assert.equal(await entry.count(), 1, "The existing agent entry-point address remains available.");
    assert(await entry.isVisible());
    assert.equal(await entry.inputValue(), siteOrigins.canonicalOrigin + "/agent/start.md");
    const resource = page.locator(".resource-item").filter({ has: page.getByText("Agent entry point", { exact: true }) });
    await resource.getByRole("button", { name: "Copy address: Agent entry point address", exact: true }).click();
    await resource.getByText("Address copied", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), siteOrigins.canonicalOrigin + "/agent/start.md");
    assert(await page.getByText("General startup instructions. The starting prompt directs your agent to the Phase 1 packet.", { exact: true }).isVisible());
    assert.doesNotMatch(await page.locator("main").innerText(), /first file your agent reads after you send the starting prompt/i);
    const response = await fetch(origin + "/agent/start.md", { signal: AbortSignal.timeout(10_000) });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), await readFile(path.join(root, "agent/start.md"), "utf8"));
    return { preserved_entry_point: "/agent/start.md", rendered_as: "copyable canonical address", clipboard: "native", first_file_claim: false };
  });

  assert(report.cases.every((entry) => entry.status === "passed"), "Every planned case must execute and pass.");
  assert.deepEqual(report.page_errors, [], "No application page errors.");
  assert.deepEqual(report.http_errors, [], "No missing production resources.");
  assert.deepEqual(report.failed_requests, [], "No unexplained failed requests.");
  assert.deepEqual(report.server_errors, [], "No test-server failures.");
  assert.deepEqual(report.mutation_requests, [], "No form submission or other mutation was attempted.");
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error instanceof Error ? error.stack : String(error);
  process.exitCode = 1;
  if (page && !page.isClosed()) {
    try { await capture("failure-" + currentCase.replace(/[^a-z0-9]+/gi, "-")); }
    catch (captureError) { report.capture_error = String(captureError); }
  }
} finally {
  if (browser) {
    try { await browser.close(); }
    catch (error) { report.browser_cleanup_error = String(error); report.status = "failed"; process.exitCode = 1; }
  }
  if (server.listening) {
    try { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
    catch (error) { report.server_cleanup_error = String(error); report.status = "failed"; process.exitCode = 1; }
  }
  report.ended_at = new Date().toISOString();
  await writeFile(path.join(output, "browser-report.json"), JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify({ status: report.status, passed: report.cases.filter((entry) => entry.status === "passed").length, planned: report.cases.length, output }));
