import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");
const root = path.resolve("dist");
const output = path.resolve("style-guide-browser-report");
await mkdir(output,{recursive:true});
const guide = JSON.parse(await readFile(path.join(root,"style/TypeScript.json"),"utf8"));
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
const report = {version:guide.version,status:"passed",viewports:[],pageErrors:[],checks:[]};
try {
  for (const [name,width,height] of [["desktop",1440,1000],["mobile",390,844],["small-mobile",320,740]]) {
    const context = await browser.newContext({viewport:{width,height},reducedMotion:"reduce"});
    await context.route("https://static.cloudflareinsights.com/**",(route) => route.fulfill({status:204,body:""}));
    await context.grantPermissions(["clipboard-read","clipboard-write"],{origin});
    const page = await context.newPage();
    page.on("pageerror",(error) => report.pageErrors.push(`${name}: ${error.message}`));
    await page.goto(`${origin}/style`,{waitUntil:"networkidle"});
    const card = page.locator('.style-guide-card[href="/style/TypeScript"]');
    assert.equal(await card.locator("p").count(),0,"hub card has no redundant description");
    if (guide.status === "stable") assert.equal(await card.locator(".style-status").count(),0);
    await card.click();
    await page.waitForURL("**/style/TypeScript");
    await page.locator(".style-guide-prose h2").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const headings = await page.locator(".style-guide-prose h2").allTextContents();
    assert.equal(headings.length,27,"25 rules plus scope and references");
    assert(headings.every((heading) => !/^D\d{3}/.test(heading)),"no planning IDs in headings");
    assert(await page.locator(".style-guide-intro").isVisible(),"human intro");
    if (guide.status === "stable") assert.equal(await page.locator(".style-status").count(),0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),"no page-level horizontal overflow");
    await page.screenshot({path:path.join(output,`${name}-top.png`)});
    await page.getByRole("button",{name:"Copy for agent",exact:true}).click();
    await page.getByRole("button",{name:"Agent link copied",exact:true}).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()),"https://starter.devthomas.site/style/TypeScript.md");
    const anchor = await page.locator(".style-guide-prose h2").nth(21).getAttribute("id");
    await page.goto(`${origin}/style/TypeScript#${anchor}`,{waitUntil:"networkidle"});
    await page.reload({waitUntil:"networkidle"});
    assert.equal(new URL(page.url()).hash,`#${anchor}`,"deep link survives reload");
    assert((await page.locator(`[id="${anchor}"]`).boundingBox()).y < height,"deep linked heading scrolls into view");
    await page.screenshot({path:path.join(output,`${name}-async.png`)});
    report.viewports.push({name,width,height,headings:headings.length,overflow:false,copy:true,deepLink:true});
    await context.close();
  }
  const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  await context.route("https://static.cloudflareinsights.com/**",(route) => route.fulfill({status:204,body:""}));
  await context.addInitScript(() => Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async () => {throw new Error("Clipboard denied for test");}}}));
  const page = await context.newPage();
  page.on("pageerror",(error) => report.pageErrors.push(`clipboard fallback: ${error.message}`));
  await page.goto(`${origin}/style/TypeScript`,{waitUntil:"networkidle"});
  await page.getByRole("button",{name:"Copy for agent",exact:true}).click();
  await page.locator("#style-agent-address").waitFor();
  assert.equal(await page.locator("#style-agent-address").inputValue(),"https://starter.devthomas.site/style/TypeScript.md");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1),"fallback has no overflow");
  await page.screenshot({path:path.join(output,"mobile-clipboard-fallback.png")});
  report.checks.push("hub navigation", "human intro", "all rule headings", "hidden internal IDs", "clipboard success", "clipboard denial fallback", "small mobile overflow", "anchor reload", "no application page errors");
  await context.close();
  assert.deepEqual(report.pageErrors,[]);
} catch(error) {report.status="failed";report.error=String(error);throw error;}
finally {
  await writeFile(path.join(output,"browser-report.json"),JSON.stringify(report,null,2)+"\n");
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
console.log(JSON.stringify(report));
