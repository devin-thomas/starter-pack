import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../src/App";
import type { SiteData, SkillEntry } from "../src/site-data";
import { loadContent } from "./content";

test("skill links resolve lessons by ID when the URL slug differs", async (): Promise<void> => {
  const data: SiteData = await loadContent();
  const source: SkillEntry | undefined = data.skills.manifest.find(
    (entry: SkillEntry): boolean => data.skills.lessons[entry.id] !== undefined,
  );
  assert.ok(source);
  const dependency: SkillEntry = { ...source, id: "planner-skill", slug: "planning", title: "Planning" };
  const entry: SkillEntry = {
    ...source,
    id: "consumer-skill",
    slug: "consumer",
    title: "Consumer",
    relatedSkills: [dependency.id],
    prerequisites: [{ skillId: dependency.id }],
  };
  const fixture: SiteData = {
    ...data,
    skills: {
      ...data.skills,
      manifest: [entry, dependency],
      lessons: {
        [entry.id]: { skillId: entry.id, updated: "2026-10-23", html: "<p>Consumer lesson</p>" },
        [dependency.id]: { skillId: dependency.id, updated: "2026-10-23", html: "<p>Planning lesson</p>" },
      },
    },
  };
  const html: string = renderToStaticMarkup(createElement(App, { path: "/skills/consumer", data: fixture }));
  assert.equal([...html.matchAll(/href="\/skills\/planning"/g)].length, 2);
  assert.ok(!html.includes('href="/skills/planner-skill"'));
});

test("a cold dev server serves a direct skill lesson before any other page", { timeout: 30_000 }, async (context): Promise<void> => {
  let child: ChildProcessWithoutNullStreams = spawn(process.execPath, ["--import", "tsx", "scripts/dev.ts"], {
    stdio: "pipe",
    env: { ...process.env, NO_COLOR: "1" },
  });
  context.after((): void => { child.kill("SIGTERM"); });
  const origin: string = await new Promise<string>((resolve, reject): void => {
    let output: string = "";
    let timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
      reject(new Error("Dev server did not become ready."));
    }, 20_000);
    child.once("error", (cause: Error): void => { clearTimeout(timer); reject(cause); });
    child.once("exit", (code: number | null): void => {
      clearTimeout(timer);
      reject(new Error(`Dev server exited before readiness (${code}).`));
    });
    child.stdout.on("data", (chunk: Buffer): void => {
      output += chunk.toString();
      const match: RegExpMatchArray | null = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
      if (match !== null) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  let response: Response = await fetch(new URL("/skills/execute-task", origin));
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Execute Task/);
  for (const route of ["/skills", "/skills/recommendations"]) {
    let hub: Response = await fetch(new URL(route, origin));
    assert.equal(hub.status, 200, route);
  }
});

test("every owned public skill has a teaching page and public sources only", async (): Promise<void> => {
  const data: SiteData = await loadContent();
  const expected: readonly string[] = ["starter-pack", "computer-setup", "grill-to-build", "task-execution-prompt", "long-horizon-dashboard", "quick-build", "execute-task", "execute-task-cycles", "surface-sweep", "surface-sweep-showcase", "no-useless-copy", "style", "pwa-development", "vidchopper-cli", "perfect-playlist", "programmatic-harness", "branded-sign-in", "agent-cli", "immutable-reports", "cappy"];
  assert.deepEqual(data.skills.manifest.map((entry: SkillEntry): string => entry.id).sort(), [...expected].sort());
  for (const entry of data.skills.manifest) {
    assert.ok(data.skills.lessons[entry.id], entry.id);
    const html: string = renderToStaticMarkup(createElement(App, { path: `/skills/${entry.slug}`, data }));
    assert.ok(html.includes(`https://dvn.pw/${entry.slug}`), entry.id);
    assert.ok(html.includes(`https://starter.uppercut-labs.com/skills/${entry.slug}.md`), entry.id);
    assert.ok(!html.includes("private-skills"), entry.id);
  }
  for (const id of ["execute-task", "execute-task-cycles", "task-execution-prompt"]) {
    assert.match(data.skills.lessons[id]!.html, /repair/i);
    assert.match(data.skills.lessons[id]!.html, /independent/i);
  }
});

test("Cappy compatibility keeps every platform and application subject beside its requirement", async (): Promise<void> => {
  const data: SiteData = await loadContent();
  const html: string = renderToStaticMarkup(createElement(App, { path: "/skills/cappy", data }));
  const compatibility: string | undefined = /<h2>Compatibility<\/h2>([\s\S]*?)<\/section>/.exec(html)?.[1];
  assert.ok(compatibility);
  const text: string = compatibility.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&");
  const expected: readonly string[] = [
    "macOS: Accepted with real OBS, FFmpeg, and Godot 4.7.2",
    "Windows: Accepted with real OBS, FFmpeg, and Godot 4.7.2",
    "Linux: Accepted; real OBS capture not yet verified",
    "Node.js 24+: Cappy runs from its npm package",
    "OBS Studio 28+ and FFmpeg: Needed for capture",
  ];
  for (const requirement of expected) assert.ok(text.includes(requirement), requirement);
  assert.equal([...compatibility.matchAll(/<li>/g)].length, expected.length);
});
