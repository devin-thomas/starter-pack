import { mkdir, readFile, writeFile } from "node:fs/promises";
import { instructionPacket, startupPacketRelease } from "./content";

const check = process.argv.includes("--check");
const packet = await instructionPacket();
const release = startupPacketRelease(packet);
if (!check) {
  await mkdir("public/agent/packets", { recursive: true });
  try {
    await writeFile(release.file, packet, { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    if (await readFile(release.file, "utf8") !== packet)
      throw new Error(`Refusing to overwrite an existing packet: ${release.file}`);
  }
  await writeFile("public/prompts/get-started.txt", release.prompt);
}
try {
  if (await readFile(release.file, "utf8") !== packet)
    throw new Error("Published startup packet differs from the canonical curriculum.");
  if ((await readFile("public/prompts/get-started.txt", "utf8")).replace(/\r\n/g, "\n") !== release.prompt)
    throw new Error("Starting prompt does not point to the current packet.");
} catch (error) {
  throw new Error("Run npm run prepare:startup after changing packet sources, then commit the new learner packet and prompt before deploying.", { cause: error });
}
console.log(`${check ? "Verified" : "Prepared"} startup packet ${release.hash.slice(0, 16)} (${Buffer.byteLength(packet)} bytes).`);
