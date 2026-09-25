import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");

const root = path.resolve("dist");
const output = path.resolve("style-guide-browser-report");
await mkdir(output,{recursive:true});

const guides = [
  {
    slug: "TypeScript",
    internalId: /^D\d{3}/,
    data: JSON.parse(await readFile(path.join(root,"style/TypeScript.json"),"utf8")),
  },
  {
    slug: "Godot",
    internalId: /^G\d{3}/,
    data: JSON.parse(await readFile(path.join(root,"style/Godot.json"),"utf8")),
  },
];

const mime = { ".html":"text/html", ".js":"application/javascript", ".css":"text/css", ".json":"application/json", ".md":"text/plain", ".txt":"text/plain", ".svg":"image/svg+xml", ".png":"image/png", ".woff2":"font/woff2", ".woff":"font/woff" };
const server = createServer(async (request,response) => {
  try {
    const url = new URL(request.url,"http://127.0.0.1");
    const base = path.resolve(root,"."+decodeURIComponent(url.pathname));
    if (base !== root && !base.startsWith(root+path.sep)) {response.writeHead(403).end();return;}
    let found;
    for (const file of [base,base+".html",path.join(base,"index.html")]) {
      try {if ((await stat(file)).isFile()) {found=file;break;}} catch {}
    }
    if (!found) {response.writeHead(404).end("Not found");return;}
    response.setHeader("Content-Type",mime[path.extname(found)]||"application/octet-stream");
    response.end(await readFile(found));
  } catch {response.writeHead(500).end("Server error");}
});

await new Promise((resolve) => server.listen(0,"127.0.0.1",resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
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
      if (guide.data.status === "stable") assert.equal(await card.locator(".style-status").count(),0);

      await card.click();
      await page.waitForURL(`**/style/${guide.slug}`);
      await page.locator(".style-guide-prose h2").first().waitFor();
      await page.evaluate(() => document.fonts.ready);

      const headings = await page.locator(".style-guide-prose h2").allTextContents();
      assert.equal(headings.length,27,`${guide.slug}: 25 rules plus scope and references`);
      assert(headings.every((heading) => !guide.internalId.test(heading)),`${guide.slug}: no planning IDs in headings`);
      assert(await page.locator(".style-guide-intro").isVisible(),`${guide.slug}: human intro`);
      if (guide.data.status === "stable") assert.equal(await page.locator(".style-status").count(),0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),`${guide.slug}: no page-level horizontal overflow`);

      const prefix=guide.slug.toLowerCase();
      await page.screenshot({path:path.join(output,`${prefix}-${name}-top.png`)});

      await page.getByRole("button",{name:"Copy for agent",exact:true}).click();
      await page.getByRole("button",{name:"Agent link copied",exact:true}).waitFor();
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        `https://starter.devthomas.site/style/${guide.slug}.md`,
        `${guide.slug}: clipboard link`,
      );

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
      `https://starter.devthomas.site/style/${guide.slug}.md`,
      `${guide.slug}: fallback address`,
    );
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),`${guide.slug}: fallback has no overflow`);
    await page.screenshot({path:path.join(output,`${guide.slug.toLowerCase()}-mobile-clipboard-fallback.png`)});
  }

  report.checks.push("hub navigation", "human intro", "all rule headings", "hidden internal IDs", "clipboard success", "clipboard denial fallback", "small mobile overflow", "anchor reload", "no application page errors");
  await context.close();
  assert.deepEqual(report.pageErrors,[]);
} catch(error) {
  report.status="failed";
  report.error=String(error);
  throw error;
} finally {
  await writeFile(path.join(output,"browser-report.json"),JSON.stringify(report,null,2)+"\n");
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(JSON.stringify(report));
