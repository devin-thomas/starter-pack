// One typed contract per capability, bound to the app's existing functions,
// with an authorization policy the app owns. The CLI (cli.mjs) and HTTP
// (http.mjs) projections both use this registry, so they cannot drift apart.
import {
  bindCapability,
  createCapabilityRegistry,
  defineCapability,
} from "@uppercut-labs/agent-native";
import { fromZod } from "@uppercut-labs/agent-native/schema/zod";
import * as z from "zod";
import { createPantry } from "./pantry.mjs";

// Inputs use z.strictObject so an unknown field is rejected at runtime, matching the
// published JSON Schema (additionalProperties: false). Plain z.object would drop it silently.
const pantryItem = z.object({
  name: z.string(),
  quantity: z.number().int().min(0),
  unit: z.string(),
  low: z.boolean(),
});

// Public read, version 1. Anyone, including an agent with no sign-in, may call it.
export const listItems = defineCapability({
  identity: {
    namespace: "example.pantry",
    name: "items.list",
    majorVersion: 1,
  },
  description:
    "List pantry items. Set low to true to list only items running low.",
  input: fromZod(z.strictObject({ low: z.boolean().optional() })),
  output: fromZod(
    z.object({ items: z.array(pantryItem), count: z.number().int().min(0) }),
  ),
  risk: "read",
  access: { kind: "public" },
  // HTTP keeps the generated, versioned route:
  // POST /agent-native/v1/capabilities/example.pantry/items.list/v1/invoke
  surfaces: { cli: { command: "pantry-list" } },
});

// Protected write, version 1. Only a signed-in caller holding pantry:write may call it.
export const restockItem = defineCapability({
  identity: {
    namespace: "example.pantry",
    name: "items.restock",
    majorVersion: 1,
  },
  description: "Add stock to one pantry item. Requires the pantry:write scope.",
  input: fromZod(
    z.strictObject({
      name: z.string().min(1),
      quantity: z.number().int().min(1).max(100),
    }),
  ),
  output: fromZod(pantryItem),
  risk: "write",
  access: { kind: "protected", scopes: ["pantry:write"] },
  surfaces: { cli: { command: "pantry-restock" } },
});

/**
 * The app's authorization policy. Agent Native asks it before every call on every
 * surface; it never signs anyone in. Public reads are allowed; anything else needs
 * an authenticated caller that holds every scope the contract names.
 */
export const authorization = {
  authorize({ access, risk, caller }) {
    if (access.kind === "public") return risk === "read";
    if (caller.kind !== "authenticated") return false;
    return access.scopes.every((scope) => caller.scopes.includes(scope));
  },
};

/** Bind both contracts to one pantry and check the result into a registry. */
export function createPantryRegistry(pantry = createPantry()) {
  return createCapabilityRegistry(
    [listItems, restockItem],
    [
      bindCapability(listItems, {
        id: "pantry-list",
        targets: ["local", "server"],
        execute: async ({ low }) => {
          const items = pantry.list({ low: low === true });
          return { items, count: items.length };
        },
      }),
      bindCapability(restockItem, {
        id: "pantry-restock",
        targets: ["local", "server"],
        execute: async ({ name, quantity }) => pantry.restock(name, quantity),
      }),
    ],
  );
}
