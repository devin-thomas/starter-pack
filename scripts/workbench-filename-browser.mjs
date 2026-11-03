import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const { chromium } = await import(process.env.STYLE_BROWSER_MODULE || "playwright");
const html = await readFile("dist/artifacts/progress-workbench/index.html");
const progress = await readFile("dist/artifacts/progress/starter-progress.example.json");
const folder = await mkdtemp(path.join(tmpdir(), "starter-workbench-filename-"));
const file = path.join(folder, "progress.json");
await writeFile(file, progress);
const server = createServer((request, response) => {
  if (request.url === "/") response.writeHead(200, { "Content-Type": "text/html" }).end(html);
  else response.writeHead(404).end();
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch();
try {
  for (const width of [320, 390, 1024]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.getByText(/Could not load starter-progress.json automatically/).waitFor();
    assert.match(await page.locator("body").innerText(), /Your saved progress may have another filename/);
    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: "Open progress file" }).click(),
    ]);
    await chooser.setFiles(file);
    await page.getByText("Your development accounts", { exact: true }).first().waitFor();
    const visible = await page.locator("body").innerText();
    assert.match(visible, /Start with your agent/);
    assert.match(visible, /Signed in with GitHub/);
    assert.deepEqual(await readFile(file), progress);
    await page.close();
  }
  console.log("Alternate progress filename recovery passed at three widths.");
} finally {
  await browser.close();
  server.close();
  await rm(folder, { recursive: true, force: true });
}
