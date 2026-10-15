import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { unstable_getMiniflareWorkerOptions } from "wrangler";

export async function createLocalWorker(redirects = "disabled") {
  const output = await build({ entryPoints: ["src/worker.ts"], bundle: true, write: false, format: "esm", platform: "browser" });
  // The bundle has no external text/data modules; Miniflare's v4 adapter rejects module rules.
  const { workerOptions: { modulesRules: _moduleRules, ...workerOptions } } = unstable_getMiniflareWorkerOptions("wrangler.jsonc");
  return new Miniflare(convertV4MiniflareOptions({ ...workerOptions, modules: true, script: output.outputFiles[0].text, bindings: { LEGACY_HUMAN_REDIRECTS: redirects } }));
}
