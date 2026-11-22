import siteOrigins from "../src/site-origin.json" with { type: "json" };
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startStaticServer } from "@uppercut-labs/static-file-server";
const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");

const root = path.resolve("dist");
const output = path.resolve("style-guide-browser-report");
await mkdir(output,{recursive:true});

const guides = [
  { slug: "TypeScript", internalId: /^D\d{3}/, headingCount: 28, data: JSON.parse(await readFile(path.join(root,"style/TypeScript.json"),"utf8")) },
  { slug: "Godot", internalId: /^G\d{3}/, headingCount: 27, data: JSON.parse(await readFile(path.join(root,"style/Godot.json"),"utf8")) },
  { slug: "Kotlin", internalId: /^K\d{3}/, headingCount: 41, data: JSON.parse(await readFile(path.join(root,"style/Kotlin.json"),"utf8")) },
  { slug: "React-TypeScript", internalId: /^RX\d{3}/, headingCount: 36, data: JSON.parse(await readFile(path.join(root,"style/React-TypeScript.json"),"utf8")) },
  { slug: "Python", internalId: /^PY\d{3}/, headingCount: 37, data: JSON.parse(await readFile(path.join(root,"style/Python.json"),"utf8")) },
  { slug: "Swift-SwiftUI", internalId: /^SW\d{3}/, headingCount: 37, data: JSON.parse(await readFile(path.join(root,"style/Swift-SwiftUI.json"),"utf8")) },
  { slug: "JavaScript", internalId: /^JS\d{3}/, headingCount: 31, data: JSON.parse(await readFile(path.join(root,"style/JavaScript.json"),"utf8")) },
  { slug: "Dart-Flutter", internalId: /^DF\d{3}/, headingCount: 37, data: JSON.parse(await readFile(path.join(root,"style/Dart-Flutter.json"),"utf8")) },
  { slug: "Rust", internalId: /^RS\d{3}/, headingCount: 40, data: JSON.parse(await readFile(path.join(root,"style/Rust.json"),"utf8")) },
];

const server = await startStaticServer({ root, cleanUrls: true, mime: { ".md": "text/plain", ".txt": "text/plain" } });
const origin = server.url;
const browser = await chromium.launch({headless:true});
const report = {
  version: guides[0].data.version,
  status:"passed",
  guides: guides.map((guide) => ({slug:guide.slug,version:guide.data.version,acceptedThrough:guide.data.accepted_through})),
  viewports:[],
  pageErrors:[],
  checks:[],
};

try {
  for (const [name,width,height] of [["desktop",1440,1000],["mobile",390,844],["small-mobile",320,740]]) {
    const context = await browser.newContext({viewport:{width,height},reducedMotion:"reduce"});
    await context.route("https://static.cloudflareinsights.com/**",(route) => route.fulfill({status:204,body:""}));
    await context.grantPermissions(["clipboard-read","clipboard-write"],{origin});
    const page = await context.newPage();
    page.on("pageerror",(error) => report.pageErrors.push(`${name}: ${error.message}`));

    for (const guide of guides) {
      await page.goto(`${origin}/style`,{waitUntil:"networkidle"});
      const card = page.locator(`.style-guide-card[href="/style/${guide.slug}"]`);
      assert.equal(await card.locator("p").count(),0,`${guide.slug}: hub card has no redundant description`);
      if (guide.data.status === "stable") assert.equal(await card.locator(".style-status").count(),0); else assert.equal(await card.locator(".style-status").count(),1);

      await card.click();
      await page.waitForURL(`**/style/${guide.slug}`);
      await page.locator(".style-guide-prose h2").first().waitFor();
      await page.evaluate(() => document.fonts.ready);

      const headings = await page.locator(".style-guide-prose h2").allTextContents();
      assert.equal(headings.length,guide.headingCount,`${guide.slug}: all rule and supporting sections`);
      assert(headings.every((heading) => !guide.internalId.test(heading)),`${guide.slug}: no planning IDs in headings`);
      assert(await page.locator(".style-guide-intro").isVisible(),`${guide.slug}: human intro`);
      if (guide.data.status === "stable") assert.equal(await page.locator(".style-status").count(),0); else assert.equal(await page.locator(".style-status").count(),1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),`${guide.slug}: no page-level horizontal overflow`);

      const prefix=guide.slug.toLowerCase();
      await page.screenshot({path:path.join(output,`${prefix}-${name}-top.png`)});

      await page.getByRole("button",{name:"Copy for agent",exact:true}).click();
      await page.getByRole("button",{name:"Agent link copied",exact:true}).waitFor();
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        `${siteOrigins.canonicalOrigin}/style/${guide.slug}.md`,
        `${guide.slug}: clipboard link`,
      );

      const downloadLink = page.getByRole("link",{name:"Download agent guide",exact:true});
      const downloadBox = await downloadLink.boundingBox();
      const copyBox = await page.getByRole("button",{name:"Agent link copied",exact:true}).boundingBox();
      assert(downloadBox && copyBox && downloadBox.width >= 24 && downloadBox.height >= 24 && copyBox.width >= 24 && copyBox.height >= 24,`${guide.slug}: controls have usable targets`);
      assert(downloadBox.x >= copyBox.x + copyBox.width + 8 || downloadBox.y >= copyBox.y + copyBox.height + 8,`${guide.slug}: controls are separated`);
      assert.equal(await downloadLink.getAttribute("href"), `/style/${guide.slug}.md`, `${guide.slug}: agent download address`);
      const [download] = await Promise.all([page.waitForEvent("download"),downloadLink.click()]);
      assert.deepEqual(await readFile(await download.path()),await readFile(path.join(root,`style/${guide.slug}.md`)),`${guide.slug}: downloaded guide bytes`);

      const anchor = await page.locator(".style-guide-prose h2").nth(21).getAttribute("id");
      await page.goto(`${origin}/style/${guide.slug}#${anchor}`,{waitUntil:"networkidle"});
      await page.reload({waitUntil:"networkidle"});
      assert.equal(new URL(page.url()).hash,`#${anchor}`,`${guide.slug}: deep link survives reload`);
      const box=await page.locator(`[id="${anchor}"]`).boundingBox();
      assert(box && box.y < height,`${guide.slug}: deep linked heading scrolls into view`);
      await page.screenshot({path:path.join(output,`${prefix}-${name}-deep-link.png`)});

      report.viewports.push({guide:guide.slug,name,width,height,headings:headings.length,overflow:false,copy:true,deepLink:true});
    }

    await context.close();
  }

  const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  await context.route("https://static.cloudflareinsights.com/**",(route) => route.fulfill({status:204,body:""}));
  await context.addInitScript(() => Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async () => {throw new Error("Clipboard denied for test");}}}));
  const page = await context.newPage();
  page.on("pageerror",(error) => report.pageErrors.push(`clipboard fallback: ${error.message}`));

  for (const guide of guides) {
    await page.goto(`${origin}/style/${guide.slug}`,{waitUntil:"networkidle"});
    await page.getByRole("button",{name:"Copy for agent",exact:true}).click();
    await page.locator("#style-agent-address").waitFor();
    assert.equal(
      await page.locator("#style-agent-address").inputValue(),
      `${siteOrigins.canonicalOrigin}/style/${guide.slug}.md`,
      `${guide.slug}: fallback address`,
    );
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),`${guide.slug}: fallback has no overflow`);
    await page.screenshot({path:path.join(output,`${guide.slug.toLowerCase()}-mobile-clipboard-fallback.png`)});
  }

  report.checks.push("hub navigation", "human intro", "all rule headings", "hidden internal IDs", "clipboard success", "agent guide download", "clipboard denial fallback", "small mobile overflow", "anchor reload", "no application page errors");
  await context.close();
  assert.deepEqual(report.pageErrors,[]);
} catch(error) {
  report.status="failed";
  report.error=String(error);
  throw error;
} finally {
  await writeFile(path.join(output,"browser-report.json"),JSON.stringify(report,null,2)+"\n");
  await browser.close();
  await server.close();
}

console.log(JSON.stringify(report));
