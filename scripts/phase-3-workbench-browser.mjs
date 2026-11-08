// Phase 3 milestones in the built Workbench, plus older downloaded Workbench copies against the new data.
// Usage: node scripts/phase-3-workbench-browser.mjs [path/to/older/index.html ...]
// Older copies are optional: pass Workbench HTML files downloaded before the current requirements revision.
// Every older copy keeps its bundled requirements, because the online requirements differ (the Phase 3 preview flag).
// Copies from before 2026-11-09 have no Phase 3 gate; copies from 2026-11-09 apply their own bundled graduation rule.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(project, "scripts/fixtures/phase-3-entry");
const currentHtml = await readFile(path.join(project, "dist/artifacts/progress-workbench/index.html"));
const catalog = await readFile(path.join(project, "dist/artifacts/progress-workbench/catalog.json"));
const older = await Promise.all(process.argv.slice(2).map(async (file) => ({ file, html: await readFile(file) })));
const fixture = async (name) => readFile(path.join(fixtures, `${name}.json`));
const pages = new Map([["/current.html", currentHtml], ...older.map(({ html }, index) => [`/older-${index}.html`, html])]);
const server = createServer((request, response) => {
  const body = pages.get(new URL(request.url ?? "/", "http://localhost").pathname);
  if (body) response.writeHead(200, { "content-type": "text/html" }).end(body);
  else response.writeHead(404).end();
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const catalogUrl = "https://starter.uppercut-labs.com/artifacts/progress-workbench/catalog.json";
const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");
const browser = await chromium.launch();
const results = [];

async function open(pathname, width = 1280) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // The server has no starter-progress.json, so the automatic HTTP refresh 404s by design; files are opened instead.
  page.on("console", (message) => { if (message.type() === "error" && !/Failed to load resource.*404/.test(message.text())) errors.push(message.text()); });
  // Every copy sees the new public catalog, as it would online after this revision ships.
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url === catalogUrl || url.endsWith("/artifacts/progress-workbench/catalog.json")) return route.fulfill({ status: 200, contentType: "application/json", body: catalog });
    return new URL(url).origin === origin ? route.continue() : route.abort();
  });
  await page.goto(origin + pathname);
  return { page, errors };
}
async function load(page, name) {
  await page.locator("#progress-file").setInputFiles({ name: `${name}.json`, mimeType: "application/json", buffer: await fixture(name) });
  await page.locator("#source").getByText(`${name}.json`, { exact: false }).waitFor();
}
async function selectPhase(page, number) {
  await page.locator("#phases button").nth(number - 1).click();
  await page.locator("#workspace[data-phase]").waitFor();
}
const text = (page, selector) => page.locator(selector).innerText();
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

try {
  // Current Workbench, new and old data.
  for (const width of [1280, 320]) {
    const { page, errors } = await open("/current.html", width);
    await page.locator("#catalog-state").getByText("Current guide labels", { exact: false }).waitFor();

    await load(page, "phase-3-in-progress");
    assert.match(await text(page, "#phase-label"), /phase 3/i);
    assert.doesNotMatch(await text(page, "#phase-label"), /preview/i);
    assert.match(await text(page, "#current-title"), /Level 2: Give your project a command/);
    assert.match(await text(page, ".milestones"), /Extend my Phase 2 build/);
    assert.match(await text(page, ".milestones"), /Level 1: Make your website agent-ready\s*Saved for later/);
    assert.match(await text(page, ".milestones"), /Level 3: Connect it to your assistant with MCP\s*Not chosen/);
    assert.match(await text(page, "#gate-status"), /One verified CLI, API or MCP capability/);
    assert.equal(await page.locator("#unassigned").isHidden(), true);
    assert.equal(await noOverflow(page), true, `no horizontal overflow at ${width}px`);

    await load(page, "phase-3-l1-only");
    assert.match(await text(page, ".milestones"), /Readiness milestone reached/);
    assert.match(await text(page, ".milestones"), /Level 1 readiness is a milestone/);
    assert.doesNotMatch(await text(page, "#gate-status"), /complete/i);

    await load(page, "phase-3-l1-false-claim");
    assert.match(await text(page, "#gate-status"), /Needs reconciliation/);
    assert.doesNotMatch(await text(page, ".milestones"), /graduation is recorded/);

    for (const name of ["phase-3-cli-graduated", "phase-3-api-graduated", "phase-3-mcp-graduated", "phase-3-package-graduated", "phase-3-skipped-levels"]) {
      await load(page, name);
      assert.match(await text(page, "#current-title"), /Phase recorded as complete/, name);
      assert.match(await text(page, ".milestones"), /Verified with a real client/, name);
      assert.match(await text(page, ".milestones"), /Phase 3 graduation is recorded/, name);
      assert.match(await text(page, "#phases"), /PHASE 3[\s\S]*Completed[\s\S]*Completion recorded/, name);
      assert.doesNotMatch(await text(page, "#phases"), /Preview/, name);
    }

    await load(page, "legacy-phase-3-preview-claim");
    assert.match(await text(page, "#diagnostics"), /preview revision/);
    assert.doesNotMatch(await text(page, ".milestones"), /graduation is recorded/);
    assert.match(await text(page, "#steps"), /Structured build plan/);

    await load(page, "legacy-phase-2-complete-2026-11-08");
    assert.match(await text(page, "#gate-status"), /Completion recorded · requirements 2026-11-08/);
    await selectPhase(page, 3);
    assert.match(await text(page, "#current-title"), /Your recorded work/);

    await load(page, "legacy-phase-1-complete-2026-10-09");
    assert.match(await text(page, "#gate-status"), /Completion recorded · requirements 2026-10-09/);

    await load(page, "legacy-phase-3-declined");
    await selectPhase(page, 3);
    assert.match(await text(page, "#steps"), /Phase 3 preview[\s\S]*Skipped/);
    assert.match(await text(page, "#steps"), /Saved for later/);
    assert.equal(await noOverflow(page), true, `no horizontal overflow at ${width}px`);
    assert.deepEqual(errors, []);
    await page.close();
  }
  results.push("current Workbench: Phase 3 choice, milestones, readiness, graduation and legacy records at 1280 and 320 px");

  // Older Workbench copies: bundled requirements, no crash, never a false Phase 3 graduation.
  for (const [index, { file }] of older.entries()) {
    const { page, errors } = await open(`/older-${index}.html`);
    await page.locator("#catalog-state").getByText(/using bundled requirements|Current guide labels/).waitFor();
    // A copy whose bundled requirements match the online ones accepts the current catalog.
    const sameRevision = /Current guide labels/.test(await text(page, "#catalog-state"));
    await load(page, "phase-3-in-progress");
    const gateEra = !/Preview only · no completion gate/.test(await text(page, "#gate-status"));
    if (sameRevision) assert.doesNotMatch(await text(page, "#phase-label"), /preview/i, `${file}: the open catalog is applied`);
    for (const name of ["phase-3-cli-graduated", "phase-3-skipped-levels", "phase-3-l1-false-claim", "phase-3-in-progress"]) {
      await load(page, name);
      if (!gateEra) {
        assert.match(await text(page, "#gate-status"), /Preview only · no completion gate/, `${file}: ${name}`);
        assert.doesNotMatch(await text(page, "#current"), /recorded as complete/i, `${file}: ${name}`);
      } else if (name === "phase-3-l1-false-claim" || name === "phase-3-in-progress") {
        // A 2026-11-09 copy applies its own bundled graduation rule: Level 1 alone or work in progress never graduates.
        assert.doesNotMatch(await text(page, ".milestones"), /graduation is recorded/, `${file}: ${name}`);
      } else {
        // Records verified under 2026-11-09 graduate under that copy's bundled rule, as they do in the current copy.
        assert.match(await text(page, ".milestones"), /Phase 3 graduation is recorded/, `${file}: ${name}`);
      }
      assert.match(await text(page, "#steps"), /Agent cli|Level 2: Give your project a command|Agent ready website|Phase 3 project|Choose your Phase 3 project/, `${file}: ${name}`);
      assert.equal(await page.locator("#unassigned").isHidden(), true, `${file}: ${name} Phase 3 steps stay under Phase 3`);
    }
    await load(page, "phase-3-cli-graduated");
    if (!gateEra) assert.match(await text(page, "#diagnostics"), /Phase 3 is a preview/);
    await selectPhase(page, 2);
    assert.match(await text(page, "#gate-status"), /Completion recorded/);
    for (const name of ["legacy-phase-1-complete-2026-10-09", "legacy-phase-2-complete-2026-11-08", "legacy-phase-3-declined", "legacy-phase-3-preview-claim"]) {
      await load(page, name);
      assert.ok((await text(page, "#phase-title")).length > 0, `${file}: ${name}`);
    }
    assert.deepEqual(errors, [], file);
    await page.close();
    results.push(`older Workbench ${path.basename(file)}: ${sameRevision ? "open catalog accepted, Level 1 alone not graduated" : gateEra ? "its own graduation rule applied, Level 1 alone not graduated" : "Phase 3 shown without completion"}, no errors`);
  }
  console.log(JSON.stringify({ status: "passed", fixtures: (await readdir(fixtures)).length, results }));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
