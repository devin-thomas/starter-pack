// Rebuild the Level 2 reference command's archive and checksum after changing
// examples/lantern-tools. scripts/agent-cli-api.test.ts checks that the archive
// still holds exactly the source files.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const destination = "public/examples/lantern-tools";
const [packed] = JSON.parse(execFileSync("npm", ["pack", "./examples/lantern-tools", "--pack-destination", destination, "--json"], { encoding: "utf8" }));
const archive = `${destination}/${packed.filename}`;
const digest = createHash("sha256").update(await readFile(archive)).digest("hex");
await writeFile(`${archive}.sha256`, `${digest}  ${packed.filename}\n`);
console.log(`${archive}\n${digest}`);
