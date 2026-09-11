import test from "node:test";
import assert from "node:assert/strict";
import { assertSameAgentCatalog } from "./deployment-catalog";

const catalog = {
  generated_at: "2026-09-11T12:00:00.000Z", updated_at: "2026-09-11",
  version: "0.2.0", requirements_revision: "2026-09-10",
  bootstrap: "https://example.invalid/packet-a.md",
  resources: [{ id: "phase-1", html: "https://example.invalid/phases/1" }],
};
test("rebuilding unchanged content on another day does not invalidate a release", () => {
  assertSameAgentCatalog(JSON.stringify({ ...catalog, generated_at: "2026-09-12T14:30:00.000Z", updated_at: "2026-09-12" }), JSON.stringify(catalog));
});
test("changed packet, requirements, resource or missing field still fails", () => {
  for (const changes of [{ bootstrap: "https://example.invalid/packet-b.md" }, { requirements_revision: "2026-09-12" }, { resources: [] }, { version: undefined }]) {
    assert.throws(() => assertSameAgentCatalog(JSON.stringify({ ...catalog, ...changes }), JSON.stringify(catalog)));
  }
});
test("missing or malformed build metadata is rejected", () => {
  for (const changes of [{ generated_at: undefined }, { generated_at: "bad" }, { updated_at: "2026-01-01" }]) {
    assert.throws(() => assertSameAgentCatalog(JSON.stringify({ ...catalog, ...changes }), JSON.stringify(catalog)));
  }
});
