import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import worker, { type FeedbackEnv } from "../src/worker";
import { exampleApiBase, exampleApiResponse, RateLimiter } from "../src/example-api";
import { parseCatalog, type Catalog } from "../examples/lantern-tools/lib/catalog.mjs";
import { parseRegistry, phaseIds, projectCatalog } from "../src/workbench/registry";
import { phase3Progress, phaseCompletion, safeProgress, type Progress } from "../src/workbench/model";

// Level 2 reference application: the lantern-tools command and the library's HTTP API.
// Every check runs the real command or the real Worker code; nothing here is mocked.

const root = "examples/lantern-tools";
const bin = path.resolve(root, "bin/lantern-tools.mjs");
const text = (file: string) => readFile(file, "utf8");
const pkg = JSON.parse(await text(`${root}/package.json`));
const sample = JSON.parse(await text(`${root}/data/catalog.json`));
// The library's own records (shared with the Level 1 example site), as a local catalog file.
const records = JSON.parse(await text("content/examples/agent-ready-website/tools.json"));
const site = JSON.parse(await text("content/examples/agent-ready-website/site.json"));
const staff = { library: site.name, updated: sample.updated, tools: records.tools };
const staffFolder = await mkdtemp(path.join(tmpdir(), "lantern-staff-"));
const staffCatalog = path.join(staffFolder, "library-catalog.json");
await writeFile(staffCatalog, JSON.stringify(staff, null, 2));
after(() => rm(staffFolder, { recursive: true, force: true }));
const openApi = JSON.parse(await text(`${root}/openapi.json`));
const publicFields = ["id", "name", "category", "loan_days", "available"];
// Every value that exists only in the staff catalog, plus the private field names.
const privateValues: string[] = [
  "storage_bin", "staff_note",
  ...staff.tools.flatMap((tool: Record<string, unknown>) => [String(tool.storage_bin), String(tool.staff_note)]),
];
const canary = "sk-live-canary-7f3a9c2e51b04d68";
const origin = "https://starter.uppercut-labs.com";

type Run = { code: number | null; stdout: string; stderr: string };
function cli(args: string[], env: Record<string, string> = {}): Run {
  const result = spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", LANTERN_STAFF_TOKEN: canary, ...env },
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}
function assertNothingPrivate(output: string, label: string) {
  for (const value of [...privateValues, canary]) assert.equal(output.includes(value), false, `${label} leaked ${value}`);
}
function get(pathname: string, init: RequestInit = {}, limiter = new RateLimiter(), catalog?: Catalog): Response {
  const response = exampleApiResponse(new Request(`${origin}${exampleApiBase}${pathname}`, init), limiter, catalog);
  assert.ok(response, pathname);
  return response;
}
async function body(response: Response): Promise<Record<string, any>> {
  return JSON.parse(await response.text());
}

test("the command documents usage, examples and exit statuses", () => {
  const help = cli(["--help"]);
  assert.equal(help.code, 0);
  for (const part of ["Usage:", "Examples:", "Exit status:", "--json", "lantern-tools show cordless-drill --json", "0  success", "1  no tool has that id", "2  usage error", "3  the catalog file"])
    assert.ok(help.stdout.includes(part), part);
  assert.equal(cli([]).stdout, help.stdout);
  for (const args of [["help", "show"], ["show", "--help"]]) {
    const run = cli(args);
    assert.equal(run.code, 0);
    assert.match(run.stdout, /lantern-tools show TOOL_ID/);
  }
  assert.equal(cli(["--version"]).stdout, `lantern-tools ${pkg.version}\n`);
  assert.deepEqual(JSON.parse(cli(["--version", "--json"]).stdout), { name: "lantern-tools", version: pkg.version, api_version: "1" });
});

test("the command prints stable JSON with public fields only", () => {
  const list = JSON.parse(cli(["list", "--json"]).stdout);
  assert.deepEqual(Object.keys(list), ["api_version", "library", "catalog_updated", "categories", "count", "tools"]);
  assert.equal(list.count, 7);
  assert.equal(list.catalog_updated, "2026-11-08");
  for (const tool of list.tools) assert.deepEqual(Object.keys(tool), publicFields);
  const shown = cli(["show", "cordless-drill", "--json"]);
  assert.equal(shown.code, 0);
  assert.equal(shown.stderr, "");
  assert.deepEqual(JSON.parse(shown.stdout).tool, { id: "cordless-drill", name: "Cordless drill", category: "Power tools", loan_days: 14, available: true });
  const unavailable = JSON.parse(cli(["list", "--available", "false", "--json"]).stdout);
  assert.deepEqual(unavailable.tools.map((tool: { id: string }) => tool.id), ["pressure-washer", "extension-ladder"]);
  const hand = JSON.parse(cli(["list", "--category=hand TOOLS", "--json"]).stdout);
  assert.deepEqual(hand.tools.map((tool: { id: string }) => tool.id), ["tile-cutter", "stud-finder"]);
  assert.match(cli(["show", "pressure-washer"]).stdout, /^Pressure washer \(pressure-washer\)\nCategory: Power tools\nLoan: 7 days\nAvailable: no\n/);
});

test("the command fails visibly with documented exit statuses", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "lantern-cli-"));
  try {
    const broken = path.join(folder, "broken.json");
    await writeFile(broken, `{"library": "x", "updated": "2026-11-08", "tools": [{"staff_note": "${canary}"`);
    const invalid = path.join(folder, "invalid.json");
    await writeFile(invalid, JSON.stringify({ library: "x", updated: "2026-11-08", tools: [{ id: "drill", name: "Drill", category: "Power tools", loan_days: "14", available: true, staff_note: canary }] }));
    const cases: Array<[string[], number, string]> = [
      [["show", "no-such-tool"], 1, "not_found"],
      [["fly"], 2, "usage"],
      [["list", `--token=${canary}`], 2, "usage"],
      [["list", "--category"], 2, "usage"],
      [["list", "extra"], 2, "usage"],
      [["show"], 2, "usage"],
      [["show", "a", "b"], 2, "usage"],
      [["list", "--available", "maybe"], 2, "invalid_parameter"],
      [["show", canary.toUpperCase()], 2, "invalid_parameter"],
      [["list", "--catalog", path.join(folder, "missing.json")], 3, "invalid_catalog"],
      [["list", "--catalog", broken], 3, "invalid_catalog"],
      [["show", "drill", "--catalog", invalid], 3, "invalid_catalog"],
    ];
    for (const [args, code, errorCode] of cases) {
      const human = cli(args);
      assert.equal(human.code, code, args.join(" "));
      assert.equal(human.stdout, "", args.join(" "));
      assert.match(human.stderr, /^lantern-tools: \S/, args.join(" "));
      const machine = cli([...args, "--json"]);
      assert.equal(machine.code, code, `${args.join(" ")} --json`);
      assert.equal(machine.stderr, "", `${args.join(" ")} --json`);
      const error = JSON.parse(machine.stdout);
      assert.deepEqual(Object.keys(error), ["api_version", "error"]);
      assert.equal(error.error.code, errorCode, args.join(" "));
      for (const output of [human.stderr, machine.stdout]) assertNothingPrivate(output, args.join(" "));
    }
    assert.match(cli(["list", "--catalog", invalid]).stderr, /tool 1 needs loan_days/);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("the command never prints a private field or a secret from its environment", () => {
  const runs = [
    ["--help"], ["help", "list"], ["--version", "--json"],
    ["list"], ["list", "--json"], ["list", "--available", "false"],
    ...staff.tools.flatMap((tool: { id: string }) => [["show", tool.id], ["show", tool.id, "--json"]]),
  ];
  for (const args of runs)
    for (const run of [cli(args), cli([...args, "--catalog", staffCatalog])]) {
      assert.equal(run.code, 0, args.join(" "));
      assertNothingPrivate(run.stdout + run.stderr, args.join(" "));
    }
  // The library's own catalog gives the same public answer as the bundled sample.
  assert.equal(cli(["list", "--json", "--catalog", staffCatalog]).stdout, cli(["list", "--json"]).stdout);
});

test("the API answers with the same body as the command for the same question", async () => {
  const pairs: Array<[string, string[]]> = [
    ["/tools", ["list"]],
    ["/tools?available=true", ["list", "--available", "true"]],
    ["/tools?category=Garden", ["list", "--category", "Garden"]],
    ["/tools/stud-finder", ["show", "stud-finder"]],
    ["/tools/no-such-tool", ["show", "no-such-tool"]],
    ["/tools?available=maybe", ["list", "--available", "maybe"]],
  ];
  for (const [route, args] of pairs) {
    const response = get(route);
    const run = cli([...args, "--json"]);
    assert.deepEqual(await body(response), JSON.parse(run.stdout), route);
    assert.equal(response.status === 200, run.code === 0, route);
  }
});

test("the API documents its shape, version and freshness", async () => {
  const response = get("/tools/cordless-drill");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=300");
  assert.equal(response.headers.get("Last-Modified"), "Sun, 08 Nov 2026 00:00:00 GMT");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("RateLimit-Limit"), "60");
  const result = await body(response);
  assert.equal(result.api_version, "1");
  assert.equal(result.catalog_updated, staff.updated);
  const head = get("/tools/cordless-drill", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");

  const document = await body(get("/openapi.json"));
  assert.equal(document.openapi, "3.1.0");
  assert.deepEqual(document.servers, [{ url: `${origin}${exampleApiBase}` }]);
  assert.deepEqual(Object.keys(document.paths), ["/tools", "/tools/{id}", "/loans", "/openapi.json"]);
  assert.deepEqual(document.paths["/loans"].post.security, [{ staffToken: [] }]);
  assert.deepEqual(Object.keys(document.paths).filter((route) => route !== "/loans").flatMap((route) => Object.keys(document.paths[route])), ["get", "get", "get"]);
  const local = exampleApiResponse(new Request(`http://127.0.0.1:8787${exampleApiBase}/openapi.json`), new RateLimiter());
  assert.deepEqual((await body(local!)).servers, [{ url: `http://127.0.0.1:8787${exampleApiBase}` }]);

  // Responses validate against the document's own schemas.
  const ajv = new Ajv2020({ strict: false });
  addFormats(ajv);
  ajv.addSchema({ $id: "lantern", components: openApi.components });
  const check = (schema: string, value: unknown) => {
    const validate = ajv.getSchema(`lantern#/components/schemas/${schema}`)!;
    assert.equal(validate(value), true, `${schema}: ${ajv.errorsText(validate.errors)}`);
  };
  check("ToolList", await body(get("/tools")));
  check("ToolResult", result);
  for (const route of ["/tools/nope", "/tools?fields=staff_note", "/nowhere"]) check("Error", await body(get(route)));
  check("Error", await body(get("/loans", { method: "POST" })));
  // Adding a private field breaks the documented shape.
  const validate = ajv.getSchema("lantern#/components/schemas/ToolResult")!;
  assert.equal(validate({ ...result, tool: { ...result.tool, staff_note: "x" } }), false);
});

test("the API rejects bad requests with one error shape", async () => {
  const cases: Array<[string, RequestInit, number, string, Record<string, string>?]> = [
    ["/tools?fields=staff_note", {}, 400, "invalid_parameter"],
    ["/tools?available=true&available=false", {}, 400, "invalid_parameter"],
    ["/tools?available=yes", {}, 400, "invalid_parameter"],
    ["/tools/cordless-drill?include=storage_bin", {}, 400, "invalid_parameter"],
    ["/tools/Cordless_Drill", {}, 400, "invalid_parameter"],
    ["/tools/%E0%A4%A", {}, 400, "invalid_parameter"],
    ["/openapi.json?x=1", {}, 400, "invalid_parameter"],
    ["/tools/no-such-tool", {}, 404, "not_found"],
    ["/tools/cordless-drill/notes", {}, 404, "not_found"],
    ["", {}, 404, "not_found"],
    ["/tools", { method: "POST" }, 405, "method_not_allowed", { Allow: "GET, HEAD" }],
    ["/tools/cordless-drill", { method: "DELETE" }, 405, "method_not_allowed", { Allow: "GET, HEAD" }],
    ["/loans", {}, 405, "method_not_allowed", { Allow: "POST" }],
  ];
  for (const [route, init, status, code, headers] of cases) {
    const response = get(route, init);
    assert.equal(response.status, status, route);
    assert.equal(response.headers.get("Cache-Control"), "no-store", route);
    const result = await body(response);
    assert.deepEqual(result, { api_version: "1", error: { code, message: result.error.message, status } }, route);
    for (const [name, value] of Object.entries(headers ?? {})) assert.equal(response.headers.get(name), value, route);
  }
});

test("the protected lending operation is refused without changing anything", async () => {
  for (const headers of [{}, { Authorization: `Bearer ${canary}` }, { Cookie: `staff_session=${canary}` }]) {
    const response = get("/loans", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ tool: "cordless-drill", member: canary }) });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("WWW-Authenticate"), 'Bearer realm="Lantern Street staff"');
    const result = await response.text();
    assert.equal(JSON.parse(result).error.code, "authentication_required");
    assertNothingPrivate(result, "loans");
  }
  // Still available and unchanged afterwards.
  assert.equal((await body(get("/tools/cordless-drill"))).tool.available, true);
});

test("the API limits each client and says when to retry", async () => {
  let now = 1_000_000;
  const limiter = new RateLimiter(3, 60_000, () => now);
  const from = (ip: string) => ({ headers: { "CF-Connecting-IP": ip } });
  for (let index = 0; index < 3; index++) assert.equal(get("/tools", from("192.0.2.1"), limiter).status, 200);
  const limited = get("/tools", from("192.0.2.1"), limiter);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "60");
  assert.equal(limited.headers.get("RateLimit-Remaining"), "0");
  assert.equal((await body(limited)).error.code, "rate_limited");
  assert.equal(get("/tools", from("192.0.2.2"), limiter).status, 200);
  now += 30_000;
  assert.equal(get("/tools", from("192.0.2.1"), limiter).headers.get("Retry-After"), "30");
  now += 30_000;
  assert.equal(get("/tools", from("192.0.2.1"), limiter).status, 200);
});

test("no API response or document carries a private field", async () => {
  const routes = ["/tools", "/tools?available=false", "/openapi.json", "/tools/nope", "/tools?fields=staff_note", ...staff.tools.map((tool: { id: string }) => `/tools/${tool.id}`)];
  // The site serves the public catalog; even handed the library's full records,
  // the API's public-field allowlist keeps every staff-only value out.
  const full = parseCatalog(staff);
  for (const route of routes) {
    const served = await get(route).text();
    assertNothingPrivate(served, route);
    const filtered = await get(route, {}, new RateLimiter(), full).text();
    assertNothingPrivate(filtered, `${route} (full records)`);
    assert.equal(filtered, served, route);
  }
  assertNothingPrivate(JSON.stringify(openApi), "openapi.json");
});

test("the site's Worker serves the API ahead of its read-only page router", async () => {
  const env = {
    ASSETS: { async fetch() { return new Response("asset", { status: 404 }); } },
    FEEDBACK_RATE_LIMITER: { async limit() { return { success: true }; } },
    FEEDBACK_TOTAL_LIMITER: { async limit() { return { success: true }; } },
  } as unknown as FeedbackEnv;
  const shown = await worker.fetch(new Request(`${origin}${exampleApiBase}/tools/hedge-trimmer`), env);
  assert.equal((await body(shown)).tool.id, "hedge-trimmer");
  const denied = await worker.fetch(new Request(`${origin}${exampleApiBase}/loans`, { method: "POST" }), env);
  assert.equal(denied.status, 401);
  const assets = { async fetch(request: Request) { return new URL(request.url).pathname.endsWith(".tgz") || new URL(request.url).pathname.endsWith(".sha256") ? new Response("bytes", { headers: { "Content-Type": "" } }) : new Response("asset", { status: 404 }); } };
  const download = await worker.fetch(new Request(`${origin}/examples/lantern-tools/lantern-tools-${pkg.version}.tgz`), { ...env, ASSETS: assets });
  assert.equal(download.headers.get("Content-Type"), "application/gzip");
  const checksum = await worker.fetch(new Request(`${origin}/examples/lantern-tools/lantern-tools-${pkg.version}.tgz.sha256`), { ...env, ASSETS: assets });
  assert.equal(checksum.headers.get("Content-Type"), "text/plain; charset=utf-8");
  const missing = await worker.fetch(new Request(`${origin}/examples/lantern-tools/lantern-tools-9.9.9.zip`), env);
  assert.equal(await missing.text(), "asset");
  assert.equal((await worker.fetch(new Request(`${origin}/api/examples`), env)).status, 404);
});

test("the published archive holds exactly the command's source and matches its checksum", async () => {
  const archive = `public/examples/lantern-tools/lantern-tools-${pkg.version}.tgz`;
  const bytes = await readFile(archive);
  const digest = createHash("sha256").update(bytes).digest("hex");
  assert.equal(await text(`${archive}.sha256`), `${digest}  lantern-tools-${pkg.version}.tgz\n`);
  assert.deepEqual((await readdir("public/examples/lantern-tools")).sort(), [`lantern-tools-${pkg.version}.tgz`, `lantern-tools-${pkg.version}.tgz.sha256`]);
  const folder = await mkdtemp(path.join(tmpdir(), "lantern-archive-"));
  try {
    execFileSync("tar", ["-xzf", path.resolve(archive), "-C", folder]);
    const files = execFileSync("find", [".", "-type", "f"], { cwd: path.join(folder, "package"), encoding: "utf8" })
      .trim().split("\n").map((file) => file.slice(2)).sort();
    assert.deepEqual(files, [...pkg.files, "package.json"].sort());
    for (const file of files) {
      const packed = await readFile(path.join(folder, "package", file));
      assert.ok(packed.equals(await readFile(path.join(root, file))), `${file} differs from source; run npm run pack:example-cli`);
      assertNothingPrivate(packed.toString("utf8"), file);
    }
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
  // The bundled sample is exactly the public view of the library's own catalog.
  assert.deepEqual(sample, {
    library: staff.library, updated: staff.updated,
    tools: staff.tools.map((tool: Record<string, unknown>) => Object.fromEntries(publicFields.map((field) => [field, tool[field]]))),
  });
});

test("the archive installs into a clean folder and runs from there", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "lantern-install-"));
  // HOME is the empty folder, so put the running Node's own directory first: version-manager
  // shims for node, npm and npx (asdf, as on Cloudflare's build image) look for files under HOME.
  const bin = [path.dirname(process.execPath), process.env.PATH ?? ""].join(path.delimiter);
  const env = { PATH: bin, HOME: folder, npm_config_cache: path.join(folder, ".npm"), npm_config_update_notifier: "false" };
  try {
    execFileSync("npm", ["install", "--no-save", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", path.resolve(`public/examples/lantern-tools/lantern-tools-${pkg.version}.tgz`)], { cwd: folder, env, stdio: "pipe" });
    const shown = spawnSync("npx", ["--no-install", "lantern-tools", "show", "tile-cutter", "--json"], { cwd: folder, env, encoding: "utf8" });
    assert.equal(shown.status, 0, shown.stderr);
    assert.equal(JSON.parse(shown.stdout).tool.loan_days, 7);
    const missing = spawnSync("npx", ["--no-install", "lantern-tools", "show", "chainsaw", "--json"], { cwd: folder, env, encoding: "utf8" });
    assert.equal(missing.status, 1);
    assert.equal(JSON.parse(missing.stdout).error.code, "not_found");
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

// Progress records: either lane alone graduates once the real-client checks pass.
const registry = parseRegistry(JSON.parse(await text("content/workbench-steps.json")));
const catalog = projectCatalog(registry, phaseIds.map((id) => ({ id, title: id, url: `${origin}/phases/${id.slice(-1)}`, preview: id === "phase-3" })));
const graduated = JSON.parse(await text("scripts/fixtures/phase-3-entry/phase-3-api-graduated.json"));
const lanes = {
  "agent-cli": { interface: "cli", client: "Codex CLI", operation: "lantern-tools show cordless-drill --json", summary: "Installed from the archive; checked loan_days 14 and exit 1 with not_found for an unknown id" },
  "agent-api": { interface: "api", client: "Claude Code", operation: "GET /examples/lantern-tools/v1/tools/cordless-drill", summary: "Fetched the endpoint; checked loan_days 14 and a 400 error for an unknown query parameter" },
} as const;
function progressWith(lane: keyof typeof lanes, overrides: Record<string, unknown> = {}): Progress {
  const value = structuredClone(graduated);
  delete value.steps["agent-api"];
  value.steps[lane] = {
    status: "completed", phase: "phase-3", updated_at: "2026-11-09T17:00:00Z",
    verification: { ...lanes[lane], expected_output_check: "passed", negative_case_check: "passed", learner_confirmed: true, verified_at: "2026-11-09T17:00:00Z", requirements_revision: registry.requirements_revision, ...overrides },
  };
  const { progress, coreValid } = safeProgress(value);
  assert.ok(progress && coreValid);
  return progress;
}

test("either lane alone graduates Phase 3, and only with full real-client evidence", () => {
  for (const lane of Object.keys(lanes) as Array<keyof typeof lanes>) {
    const progress = progressWith(lane);
    assert.equal(phaseCompletion(progress, "phase-3", catalog)?.requirements_revision, registry.requirements_revision, lane);
    const levels = phase3Progress(progress, catalog)!.levels;
    assert.equal(levels.find((level) => level.id === lane)?.state, "verified", lane);
    assert.equal(levels.find((level) => level.id === (lane === "agent-cli" ? "agent-api" : "agent-cli"))?.state, "not_recorded", lane);
    for (const missing of [{ negative_case_check: "not_run" }, { expected_output_check: "failed" }, { learner_confirmed: false }, { client: "" }]) {
      const incomplete = progressWith(lane, missing);
      assert.equal(phaseCompletion(incomplete, "phase-3", catalog), undefined, `${lane} ${JSON.stringify(missing)}`);
      assert.equal(phase3Progress(incomplete, catalog)!.graduationEvidence, false);
    }
  }
});

// The two lessons: one per lane, each complete on its own, both using the reference application.
const lessonFiles = { "agent-cli": "content/lessons/agent-cli.md", "agent-api": "content/lessons/agent-api.md" } as const;

test("each Level 2 lane has its own lesson that stands alone", async () => {
  const { staticRoutes } = await import("../src/reading-routes");
  const matter = (await import("gray-matter")).default;
  for (const [id, file] of Object.entries(lessonFiles)) {
    const { data, content } = matter(await text(file));
    assert.deepEqual(
      { id: data.id, kind: data.kind, phase: data.phase, level: data.level, route: data.route, status: data.status },
      { id, kind: "lesson", phase: "phase-3", level: 2, route: `/phases/3/${id}`, status: "current" },
    );
    assert.equal(data.title, registry.steps[id].title, `${id} title matches its registry step`);
    assert.ok(staticRoutes.includes(data.route));
    const other = id === "agent-cli" ? "agent-api" : "agent-cli";
    for (const part of [
      "](/phases/3#prove-it-with-a-real-client)", "](/phases/3#save-your-milestones)", `](/phases/3/${other})`,
      `"interface": "${id === "agent-cli" ? "cli" : "api"}"`, `\`${id}\` step`, "Start with your own project",
      "completes Phase 3 on its own", "`@uppercut-labs/agent-native` package, version 1.1.0", "Lantern Street Tool Library",
    ]) assert.ok(content.includes(part), `${id}: ${part}`);
    // Learner-facing copy only: no tracker references.
    assert.doesNotMatch(content, /\bticket|issues\//i, id);
    // The API lesson names a private field to show it is refused; no private value appears.
    for (const value of privateValues.slice(2)) assert.equal(content.includes(value), false, `${id} shows ${value}`);
  }
});

test("the lessons' example commands and addresses are the real ones", async () => {
  const cliLesson = await text(lessonFiles["agent-cli"]);
  const apiLesson = await text(lessonFiles["agent-api"]);
  const readme = await text(`${root}/README.md`);
  const archive = `https://starter.uppercut-labs.com/examples/lantern-tools/lantern-tools-${pkg.version}.tgz`;
  for (const document of [cliLesson, readme]) {
    assert.ok(document.includes(`curl -fLO ${archive}\n`));
    assert.ok(document.includes(`curl -fLO ${archive}.sha256\n`));
    assert.ok(document.includes(`shasum -a 256 -c lantern-tools-${pkg.version}.tgz.sha256\n`));
    assert.ok(document.includes(`npm install --no-save ./lantern-tools-${pkg.version}.tgz\n`));
  }
  // Every lantern-tools invocation in the lesson parses and exits as the lesson says.
  for (const [, args] of cliLesson.matchAll(/npx --no-install lantern-tools ([^;\n`]+)/g)) {
    const run = cli(args.trim().split(/\s+/));
    assert.equal(run.code, args.includes("chainsaw") ? 1 : 0, args);
  }
  // Every example address in the API lesson answers as the lesson says.
  const addresses = [...apiLesson.matchAll(/https:\/\/starter\.uppercut-labs\.com(\/examples\/lantern-tools\/v1[^\s"`]*)/g)].map((match) => match[1]);
  assert.ok(addresses.length >= 4);
  for (const address of addresses) {
    const response = get(address.slice(exampleApiBase.length));
    assert.equal(response.status, address.includes("chainsaw") ? 404 : 200, address);
  }
  for (const route of ["/tools/chainsaw", "/tools?fields=staff_note"]) assert.ok(apiLesson.includes(`/v1${route}`), route);
  assert.equal(get("/tools?fields=staff_note").status, 400);
  assert.equal(get("/tools/chainsaw").status, 404);
});

test("the site's llms.txt lists both lessons in level order and the API's document", async () => {
  const { generateResources, loadContent } = await import("./content");
  const folder = await mkdtemp(path.join(tmpdir(), "lantern-llms-"));
  try {
    await generateResources(await loadContent(), folder);
    const llms = await text(path.join(folder, "llms.txt"));
    const order = ["/phases/3/agent-ready-website.md", "/phases/3/agent-api.md", "/phases/3/agent-cli.md"].map((route) => llms.indexOf(route));
    assert.ok(order.every((index) => index > 0) && order[0] < order[1] && order[1] < order[2], "lessons in level order");
    assert.match(llms, /\(https:\/\/starter\.uppercut-labs\.com\/examples\/lantern-tools\/v1\/openapi\.json\)/);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("the Phase 3 page's Level 2 section links both lessons", async () => {
  const page = await text("content/phases/3.md");
  const level2 = page.slice(page.indexOf("### Level 2: Operable"), page.indexOf("### Level 3"));
  assert.ok(level2.includes("](/phases/3/agent-cli)") && level2.includes("](/phases/3/agent-api)"));
  assert.match(page, /^status: current$/m);
});
