// A reviewable snapshot of every published contract. The test compares it with
// contract/pantry.v1.json, so a change to a v1 schema, risk, access rule or
// surface fails until you either undo it or publish a new major version.
// Regenerate deliberately: node src/contract.mjs --write
import { writeFile } from "node:fs/promises";
import { canonicalCapabilityId } from "@uppercut-labs/agent-native";
import { listItems, restockItem } from "./capabilities.mjs";

export const SNAPSHOT_PATH = new URL(
  "../contract/pantry.v1.json",
  import.meta.url,
);

export function contractSnapshot(definitions = [listItems, restockItem]) {
  return definitions.map((definition) => ({
    id: canonicalCapabilityId(definition.identity),
    risk: definition.risk,
    access: definition.access,
    surfaces: definition.surfaces ?? {},
    input: definition.input.toJSONSchema(),
    output: definition.output.toJSONSchema(),
  }));
}

if (process.argv.includes("--write")) {
  await writeFile(
    SNAPSHOT_PATH,
    JSON.stringify(contractSnapshot(), null, 2) + "\n",
  );
  console.log(`wrote ${SNAPSHOT_PATH.pathname}`);
}
