// Run with: npm test (Node.js 22 or newer). Every test uses the installed package,
// so the same file checks a fresh install, an upgrade, or a rollback.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  assertCompatibleCapabilityReplacement,
  defineCapability,
  executeCapability,
} from "@uppercut-labs/agent-native";
import { fromZod } from "@uppercut-labs/agent-native/schema/zod";
import * as z from "zod";
import {
  authorization,
  createPantryRegistry,
  listItems,
  restockItem,
} from "../src/capabilities.mjs";
import { contractSnapshot, SNAPSHOT_PATH } from "../src/contract.mjs";
import { createPantryHttpHandler, startPantryServer } from "../src/http.mjs";
import { createPantry } from "../src/pantry.mjs";

const cliPath = fileURLToPath(new URL("../src/cli.mjs", import.meta.url));
const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);

function cli(...args) {
  const run = spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
  });
  const lines = run.stdout.trim().split("\n");
  let envelope;
  try {
    envelope = JSON.parse(lines.at(-1));
  } catch {
    envelope = undefined;
  }
  return { status: run.status, stdout: run.stdout, envelope };
}

const LIST_ROUTE =
  "/agent-native/v1/capabilities/example.pantry/items.list/v1/invoke";
const RESTOCK_ROUTE =
  "/agent-native/v1/capabilities/example.pantry/items.restock/v1/invoke";

function post(base, route, body, headers = {}) {
  return new Request(base + route, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const owner = {
  kind: "authenticated",
  subject: "owner",
  scopes: ["pantry:write"],
};
const viewer = {
  kind: "authenticated",
  subject: "viewer",
  scopes: ["pantry:read"],
};

test("pins: package.json names exact versions and the installed package matches", () => {
  assert.equal(
    packageJson.dependencies["@uppercut-labs/agent-native"],
    "1.0.1",
  );
  assert.equal(packageJson.dependencies.zod, "4.6.5");
  const version = cli("--version");
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), "@uppercut-labs/agent-native 1.0.1");
});

test("contract: v1 schemas, risk, access and surfaces match the reviewed snapshot", async () => {
  const saved = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
  assert.deepEqual(JSON.parse(JSON.stringify(contractSnapshot())), saved);
});

test("versioning: a compatible v1 edit is accepted, a breaking one needs v2", () => {
  const reworded = defineCapability({
    ...listItems,
    description: "List what is in the pantry.",
  });
  assert.doesNotThrow(() =>
    assertCompatibleCapabilityReplacement(listItems, reworded),
  );

  const breaking = defineCapability({
    ...listItems,
    input: fromZod(
      z.object({ low: z.boolean().optional(), shelf: z.string() }),
    ),
  });
  assert.throws(
    () => assertCompatibleCapabilityReplacement(listItems, breaking),
    /new major identity/,
  );
});

test("binding: the capability calls the app's own pantry logic", async () => {
  const pantry = createPantry();
  const result = await executeCapability(createPantryRegistry(pantry), {
    identity: listItems.identity,
    runtime: "local",
    input: { low: true },
    caller: { kind: "anonymous" },
    authorization,
  });
  assert.equal(result.kind, "success");
  assert.deepEqual(result.value, {
    items: pantry.list({ low: true }),
    count: 2,
  });
});

test("authorization: restock is denied without the pantry:write scope", async () => {
  for (const caller of [{ kind: "anonymous" }, viewer]) {
    const pantry = createPantry();
    const result = await executeCapability(createPantryRegistry(pantry), {
      identity: restockItem.identity,
      runtime: "local",
      input: { name: "rice", quantity: 3 },
      caller,
      authorization,
    });
    assert.equal(result.kind, "failure");
    assert.equal(result.reason, "unauthorized");
    assert.equal(
      pantry.list().find((item) => item.name === "rice").quantity,
      1,
    );
  }
});

test("authorization: the signed-in owner can restock through the same contract", async () => {
  const pantry = createPantry();
  const result = await executeCapability(createPantryRegistry(pantry), {
    identity: restockItem.identity,
    runtime: "local",
    input: { name: "rice", quantity: 3 },
    caller: owner,
    authorization,
  });
  assert.equal(result.kind, "success");
  assert.deepEqual(result.value, {
    name: "rice",
    quantity: 4,
    unit: "bag",
    low: false,
  });
});

test("CLI: lists low items as one versioned JSON envelope", () => {
  const run = cli("pantry-list", "--mode", "local", "--low", "true");
  assert.equal(run.status, 0);
  assert.equal(run.envelope.schemaVersion, "uan.cli-result/v1");
  assert.equal(run.envelope.result.kind, "success");
  assert.equal(run.envelope.result.capabilityId, "example.pantry:items.list@1");
  assert.deepEqual(
    run.envelope.result.value.items.map((item) => item.name),
    ["rice", "lentils"],
  );
});

test("CLI: input that breaks the contract fails visibly with exit 2", () => {
  for (const input of ['{"low":"maybe"}', '{"shelf":"top"}']) {
    const run = cli("pantry-list", "--mode", "local", "--input-json", input);
    assert.equal(run.status, 2);
    assert.deepEqual(run.envelope.result, {
      kind: "failure",
      reason: "invalid-input",
    });
  }
  const badFlag = cli("pantry-list", "--mode", "local", "--low", "maybe");
  assert.equal(badFlag.status, 1);
  assert.equal(badFlag.envelope.result.kind, "failure");
});

test("CLI: a restock attempt stays denied with exit 3", () => {
  const run = cli(
    "pantry-restock",
    "--mode",
    "local",
    "--name",
    "rice",
    "--quantity",
    "3",
  );
  assert.equal(run.status, 3);
  assert.deepEqual(run.envelope.result, {
    kind: "failure",
    reason: "unauthorized",
  });
  const help = cli("--help");
  assert.match(help.stdout, /pantry-list/);
  assert.doesNotMatch(help.stdout, /pantry-restock/);
});

test("HTTP: the versioned v1 route returns the same result as the CLI", async () => {
  const response = await createPantryHttpHandler()(
    post("http://127.0.0.1", LIST_ROUTE, { low: true }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(
    body,
    cli("pantry-list", "--mode", "local", "--low", "true").envelope.result
      .value,
  );
});

test("HTTP: invalid input is a 422 and restock has no route, even with a bearer token", async () => {
  const handler = createPantryHttpHandler();
  for (const body of [{ low: "maybe" }, { shelf: "top" }]) {
    assert.equal(
      (await handler(post("http://127.0.0.1", LIST_ROUTE, body))).status,
      422,
    );
  }
  for (const headers of [{}, { authorization: "Bearer not-a-real-token" }]) {
    const denied = await handler(
      post(
        "http://127.0.0.1",
        RESTOCK_ROUTE,
        { name: "rice", quantity: 3 },
        headers,
      ),
    );
    assert.equal(denied.status, 404);
  }
  const openapi = await (
    await handler(new Request("http://127.0.0.1/agent-native/v1/openapi.json"))
  ).json();
  assert.deepEqual(Object.keys(openapi.paths), [LIST_ROUTE]);
});

test("HTTP: a real loopback server answers the read and refuses the write", async () => {
  const { server, url } = await startPantryServer({ port: 0 });
  try {
    const read = await fetch(post(url, LIST_ROUTE, { low: true }));
    assert.equal(read.status, 200);
    assert.equal((await read.json()).count, 2);
    const write = await fetch(
      post(url, RESTOCK_ROUTE, { name: "rice", quantity: 3 }),
    );
    assert.equal(write.status, 404);
    const after = await (await fetch(post(url, LIST_ROUTE, {}))).json();
    assert.equal(after.items.find((item) => item.name === "rice").quantity, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
