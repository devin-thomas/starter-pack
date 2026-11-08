#!/usr/bin/env node
// CLI projection. This file is the app's own command; the package ships no executable.
// Without a sign-in, the caller is anonymous, so only public reads succeed here.
import { runCapabilityCli } from "@uppercut-labs/agent-native/cli";
import { authorization, createPantryRegistry } from "./capabilities.mjs";

process.exitCode = await runCapabilityCli(
  process.argv.slice(2),
  {
    registry: createPantryRegistry(),
    authorization,
    caller: { kind: "anonymous" },
  },
  {
    writeStdout: (value) => process.stdout.write(value),
    writeStderr: (value) => process.stderr.write(value),
  },
);
