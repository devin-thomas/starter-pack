import { deepStrictEqual } from "node:assert/strict";

function content(raw: string) {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Agent catalog must be an object.");
  const { generated_at, updated_at, ...resources } = value as Record<string, unknown>;
  if (typeof generated_at !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(generated_at) || !Number.isFinite(Date.parse(generated_at)) || updated_at !== generated_at.slice(0, 10))
    throw new Error("Agent catalog has invalid build timestamps.");
  // Both fields are generated from the build clock, not curriculum revisions.
  return resources;
}

export function assertSameAgentCatalog(actual: string, expected: string) {
  try {
    deepStrictEqual(content(actual), content(expected));
  } catch (cause) {
    throw new Error("Live agent catalog differs from this build or is invalid; it may be stale or from another release.", { cause });
  }
}
