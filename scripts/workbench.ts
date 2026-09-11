import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import standaloneCode from "ajv/dist/standalone/index.js";
import type { SiteData } from "../src/App";
import { validCatalog } from "../src/workbench/model";
import { parseRegistry, projectCatalog, phaseIds } from "../src/workbench/registry";
import { interfaceIcons, extraIcons, brandIcons } from "../src/workbench/icons";

export async function buildWorkbench(output: string, data: SiteData) {
  const base = `${output}/artifacts/progress-workbench`;
  const registry = parseRegistry(JSON.parse(await readFile("content/workbench-steps.json", "utf8")));
  const catalog = projectCatalog(registry, phaseIds.map(id => {
    const page = data.phases.find(page => page.id === id);
    if (!page) throw new Error(`Missing Workbench phase page: ${id}`);
    return { id, title: page.title, url: `https://starter.devthomas.site/phases/${page.order}`, preview: registry.phases[id].preview === true };
  }));
  if (!validCatalog(catalog)) throw new Error("Invalid Progress Workbench catalog");
  const ajv = new Ajv2020({ code: { source: true }, allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(await readFile("public/schemas/starter-progress.schema.json", "utf8")));
  const validator = standaloneCode(ajv, validate);
  const script = await build({
    entryPoints: ["src/workbench/app.ts"], bundle: true, write: false, format: "iife", target: "es2022", minify: true,
    define: { __WORKBENCH_CATALOG__: JSON.stringify(catalog) },
    plugins: [{ name: "progress-schema", setup(builder) {
      builder.onResolve({ filter: /^progress-validator$/ }, () => ({ path: "progress-validator", namespace: "schema" }));
      builder.onLoad({ filter: /.*/, namespace: "schema" }, () => ({ contents: validator, resolveDir: process.cwd(), loader: "js" }));
    } }],
  });
  const font = await readFile("node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2");
  const license = await readFile("node_modules/@fontsource-variable/geist/LICENSE", "utf8");
  const validatorLicenses = await Promise.all(["ajv", "ajv-formats"].map(async name => `${name}\n${await readFile(`node_modules/${name}/LICENSE`, "utf8")}`));
  const iconCss: string[] = [];
  const iconSources: object[] = [];
  for (const [collection, names] of [["interface", interfaceIcons], ["workbench", extraIcons], ["brands", brandIcons]] as const) {
    const manifest = JSON.parse(await readFile(`public/icons/${collection}/manifest.json`, "utf8"));
    for (const name of names) {
      const source = manifest.icons.find((entry: { file: string }) => entry.file === `${name}.svg` || entry.file === `${name}.png`);
      if (!source) throw new Error(`Missing Workbench icon: ${name}`);
      const bytes = await readFile(`public/icons/${collection}/${source.file}`);
      if (createHash("sha256").update(bytes).digest("hex") !== source.sha256) throw new Error(`Workbench icon integrity mismatch: ${name}`);
      const mime = source.file.endsWith(".png") ? "image/png" : "image/svg+xml";
      const uri = `url("data:${mime};base64,${bytes.toString("base64")}")`;
      const color = source.rendering === "original-color-image";
      iconCss.push(`[data-icon="${name}"]::before{${color ? `background:transparent ${uri} center/contain no-repeat` : `mask-image:${uri};-webkit-mask-image:${uri}`} }`);
      iconSources.push({ ...source, collection: manifest.collection ?? source.collection });
    }
  }
  const iconLicenses = await Promise.all(["interface/LICENSE-lucide.txt", "brands/LICENSE-lobe-icons.txt", "brands/LICENSE-simple-icons.txt", "brands/DISCLAIMER-simple-icons.md"].map(path => readFile(`public/icons/${path}`, "utf8")));
  const css = (await readFile("src/workbench/style.css", "utf8")).replace("WORKBENCH_FONT", font.toString("base64")) + "\n" + iconCss.join("\n");
  const html = (await readFile("src/workbench/index.html", "utf8"))
    .replace("/* WORKBENCH_STYLE */", css)
    .replace("/* WORKBENCH_SCRIPT */", script.outputFiles[0].text.replace(/<\/script/gi, "<\\/script"))
    .replace("<!-- WORKBENCH_LICENSE -->", `<!-- Embedded font, icon and validation code licenses and icon provenance\n${[license, ...validatorLicenses, ...iconLicenses, JSON.stringify(iconSources)].join("\n\n").replace(/--/g, "- -")}\n-->`);
  await mkdir(base, { recursive: true });
  await writeFile(`${base}/index.html`, html);
  await writeFile(`${base}/catalog.json`, JSON.stringify(catalog, null, 2));
  await writeFile(`${base}/manifest.json`, JSON.stringify({ version: registry.version, requirements_revision: registry.requirements_revision, filename: "index.html", bytes: Buffer.byteLength(html), sha256: createHash("sha256").update(html).digest("hex") }, null, 2));
}
