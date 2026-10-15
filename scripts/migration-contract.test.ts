import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { assertDirectResource, assertPinnedBytes, assertReadingRedirect } from "./migration-contract";

test("release gates reject catch-all redirects and redirected downloads without following them", async () => {
  for (const route of ["/skills/starter-pack/current/SKILL.md", "/agent/catalog.json", "/artifacts/progress-workbench/index.html"]) {
    for (const status of [301, 308]) {
      const response = Response.redirect("https://starter.uppercut-labs.com" + route, status);
      await assert.rejects(assertDirectResource(response, Buffer.from("expected"), /text\/plain/, route));
    }
  }
});

test("release gates reject stale bodies, content types, mutable pinned files and wrong redirect targets", async () => {
  const bytes = Buffer.from("immutable packet\n");
  const digest = createHash("sha256").update(bytes).digest("hex");
  assertPinnedBytes(bytes, digest, "packet");
  assert.throws(() => assertPinnedBytes(Buffer.from("changed packet\n"), digest, "packet"));
  await assertDirectResource(new Response(bytes, { headers: { "Content-Type": "text/plain" } }), bytes, /text\/plain/, "packet");
  await assert.rejects(assertDirectResource(new Response("stale", { headers: { "Content-Type": "text/plain" } }), bytes, /text\/plain/, "packet"));
  await assert.rejects(assertDirectResource(new Response(bytes, { headers: { "Content-Type": "text/html" } }), bytes, /text\/plain/, "packet"));
  const target = "https://starter.uppercut-labs.com/guide?q=1";
  assertReadingRedirect(Response.redirect(target, 308), target);
  assert.throws(() => assertReadingRedirect(Response.redirect("https://starter.uppercut-labs.com/", 308), target));
  assert.throws(() => assertReadingRedirect(Response.redirect(target, 307), target));
});
