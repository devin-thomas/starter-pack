import assert from "node:assert/strict";
import { test } from "node:test";
import { jsonResourceReferences, markdownResourceReferences } from "./style-guide-links";

test("JSON guide examples are prose, not site routes", (): void => {
  const source: string = JSON.stringify({
    route: "/style/TypeScript",
    markdown: '```ts\nconst route = { path: "/fictional-game-screen" };\n```',
  });
  assert.deepEqual(jsonResourceReferences(source), ["/style/TypeScript"]);
});

test("actual nested metadata resources remain checked", (): void => {
  const source: string = JSON.stringify({ resources: [
    { markdown: "https://starter.devthomas.site/style/TypeScript.md" },
    { route: "/actually-missing-resource" },
  ] });
  assert.deepEqual(jsonResourceReferences(source), [
    "https://starter.devthomas.site/style/TypeScript.md",
    "/actually-missing-resource",
  ]);
});

test("Markdown parser ignores example links inside code fences", (): void => {
  const source: string = '[Real](/guide)\n\n```md\n[Example](/fictional-replay)\n```\n';
  assert.deepEqual(markdownResourceReferences(source), ["/guide"]);
});

test("Markdown parser still checks reference links and images", (): void => {
  const source: string = '[Guide][g]\n\n[g]: /guide\n\n![Icon](/icons/sample.svg)';
  assert.deepEqual(markdownResourceReferences(source), ["/guide", "/icons/sample.svg"]);
});
