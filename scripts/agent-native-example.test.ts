import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

// The Level 4 example's own behavior (contract, authorization, CLI and HTTP) is tested by
// public/artifacts/agent-native-example/test/pantry.test.mjs, which runs in test:workbench.
// This file checks what the site promises about it: released pins, complete files, accurate copy.

const exampleDir = "public/artifacts/agent-native-example";
const readmeUrl =
  "https://starter.uppercut-labs.com/artifacts/agent-native-example/README.md";

// Recorded from the npm registry for the released versions; the GitHub release asset
// for agent-native 1.0.1 has the same bytes.
const released = {
  "@uppercut-labs/agent-native": {
    version: "1.0.1",
    resolved:
      "https://registry.npmjs.org/@uppercut-labs/agent-native/-/agent-native-1.0.1.tgz",
    integrity:
      "sha512-fPCd8ulKge1B56wP8aLnKkJWssP0duetrbvabiXtn0Mww7X/afTsZSO0CvTusp7Pnbboi+upD4PyIjyH9nuIcw==",
  },
  zod: {
    version: "4.6.5",
    resolved: "https://registry.npmjs.org/zod/-/zod-4.6.5.tgz",
    integrity:
      "sha512-v5l/aFXZQeai4awLbOpSoHecE9UiMrnfx75tEXLjNonXVARxQ5mOeipTjROUchszUNCqnE+hqAMujRsRHsut2Q==",
  },
} as const;

type PackageJson = {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly bin?: unknown;
};
type LockEntry = {
  readonly version: string;
  readonly resolved: string;
  readonly integrity: string;
};
type Lockfile = { readonly packages: Readonly<Record<string, LockEntry>> };

async function json<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry): Promise<string[]> => {
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? files(full) : [full];
    }),
  );
  return nested.flat();
}

function levelFourSection(page: string): string {
  const start = page.indexOf("### Level 4: Full Agent Native");
  assert.ok(start >= 0, "Phase 3 has a Level 4 section");
  const end = page.indexOf("\n## ", start);
  return page.slice(start, end < 0 ? undefined : end);
}

test("the example pins the released versions exactly, in package.json and both lockfiles", async () => {
  const example = await json<PackageJson>(`${exampleDir}/package.json`);
  const root = await json<PackageJson>("package.json");
  assert.equal(example.bin, undefined, "the example adds no executable");
  for (const [name, release] of Object.entries(released)) {
    assert.equal(
      example.dependencies?.[name],
      release.version,
      `${name} is pinned exactly`,
    );
    assert.equal(
      root.devDependencies?.[name],
      release.version,
      `${name} test pin matches`,
    );
    for (const lockPath of [
      `${exampleDir}/package-lock.json`,
      "package-lock.json",
    ]) {
      const lock = await json<Lockfile>(lockPath);
      const entry = lock.packages[`node_modules/${name}`];
      assert.ok(entry, `${lockPath} locks ${name}`);
      assert.equal(entry.version, release.version);
      assert.equal(entry.resolved, release.resolved);
      assert.equal(entry.integrity, release.integrity);
    }
  }
  const exampleLock = await json<Lockfile>(`${exampleDir}/package-lock.json`);
  assert.deepEqual(
    Object.keys(exampleLock.packages)
      .filter((key: string): boolean => key !== "")
      .sort(),
    ["node_modules/@uppercut-labs/agent-native", "node_modules/zod"],
    "the example installs nothing else",
  );
});

test("the guide's download list matches the published files", async () => {
  const readme = await readFile(`${exampleDir}/README.md`, "utf8");
  const loop = readme.match(/for file in ([\s\S]*?); do/);
  assert.ok(loop?.[1], "README has a download loop");
  const listed = loop[1]
    .split(/[\s\\]+/)
    .filter(Boolean)
    .sort();
  const published = (await files(exampleDir))
    .map((file: string): string =>
      path.relative(exampleDir, file).split(path.sep).join("/"),
    )
    .sort();
  assert.ok(
    !published.some((file: string): boolean =>
      file.startsWith("node_modules/"),
    ),
    "no installed packages are published",
  );
  assert.deepEqual(listed, published);
  assert.match(
    readme,
    /base=https:\/\/starter\.uppercut-labs\.com\/artifacts\/agent-native-example\n/,
  );
});

const forbiddenClaims =
  /npm (install|i) (-g|--global)|npx @uppercut-labs|npx agent-native|agent-native init/;

test("the guide describes only the released package", async () => {
  const readme = await readFile(`${exampleDir}/README.md`, "utf8");
  assert.match(readme, /1\.0\.1/);
  assert.match(readme, /Node\.js 22 or newer/);
  assert.doesNotMatch(readme, /1\.1\.0|1\.1\b/, "no unreleased version");
  assert.doesNotMatch(
    readme,
    forbiddenClaims,
    "no global executable or generator",
  );
  assert.match(readme, /no global `agent-native` command/);
  const docLinks = [
    ...readme.matchAll(
      /https:\/\/github\.com\/uppercut-labs\/agent-native\/[^\s)]+/g,
    ),
  ].map((match: RegExpMatchArray): string => match[0]);
  assert.ok(docLinks.length > 0);
  for (const link of docLinks)
    assert.match(
      link,
      /\/agent-native\/(blob\/v1\.0\.1\/|releases$)/,
      `${link} points at released material`,
    );
});

test("the guide records Level 4 progress through an operational interface", async () => {
  const readme = await readFile(`${exampleDir}/README.md`, "utf8");
  const registry = await json<{
    readonly steps: Readonly<
      Record<string, { readonly verification?: string; readonly guide: string }>
    >;
  }>("content/workbench-steps.json");
  const step = registry.steps["agent-native-package"];
  assert.equal(step?.verification, "operation");
  assert.equal(step?.guide, "/phases/3#level-4-full-agent-native");
  assert.match(
    readme,
    /`package_version` set to `@uppercut-labs\/agent-native@1\.0\.1`/,
  );
  assert.match(readme, /\(`cli` or `api`\)/);
  assert.match(readme, /Installing the package is not enough/);
});

test("Level 4 hands the agent the example guide and describes only the released package", async () => {
  const level4 = levelFourSection(
    await readFile("content/phases/3.md", "utf8"),
  );
  assert.ok(level4.includes(readmeUrl));
  assert.match(level4, /version 1\.0\.1, for Node\.js 22 or newer/);
  assert.match(level4, /not a command you install globally/);
  assert.doesNotMatch(level4, /1\.1\.0|1\.1\b/);
  assert.doesNotMatch(level4, forbiddenClaims);
});
