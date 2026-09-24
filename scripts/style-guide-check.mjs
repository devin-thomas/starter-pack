import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require(process.env.STYLE_GUIDE_TYPESCRIPT || "typescript");
const compiler = process.env.STYLE_GUIDE_TSC || require.resolve("typescript/bin/tsc");
const sourcePath = process.argv.find((arg) => arg.endsWith(".md")) || "content/style/typescript.md";
let source = await readFile(sourcePath, "utf8");
const write = process.argv.includes("--write");
const skipFormat = process.argv.includes("--skip-format");
const fence = /^```(ts|json)\n([\s\S]*?)^```/gm;
const matches = [...source.matchAll(fence)];
assert.equal(matches.filter((match) => match[1] === "ts").length, 30, "Account for every published TypeScript example");
const decisionIds = [...source.matchAll(/^## D(\d{3}) — /gm)].map((match) => Number(match[1]));
assert.deepEqual(decisionIds, Array.from({ length: 25 }, (_, index) => index + 1));
assert(!/throw new Error\("Example"\)|\/\/ \.\.\./.test(source), "No placeholder implementation in the public guide");

if (!skipFormat) {
  const prettier = await import("prettier");
  let cursor = 0;
  let formattedSource = "";
  for (const match of matches) {
    const body = await prettier.format(match[2], {
      parser: match[1] === "ts" ? "typescript" : "json",
      printWidth: 80, tabWidth: 2, useTabs: false, semi: true,
      singleQuote: false, trailingComma: "all",
    });
    if (!write) assert.equal(match[2], body, `Format drift in code fence at byte ${match.index}; run npm run format:style`);
    formattedSource += source.slice(cursor, match.index) + `\x60\x60\x60${match[1]}\n${body}\x60\x60\x60`;
    cursor = match.index + match[0].length;
  }
  formattedSource += source.slice(cursor);
  if (write) { await writeFile(sourcePath, formattedSource); source = formattedSource; }
}

const snippets = new Map();
let jsonCount = 0;
for (const match of source.matchAll(fence)) {
  const [, language, code] = match;
  if (language === "json") { JSON.parse(code); jsonCount++; continue; }
  const marker = source.slice(0, match.index).match(/<!-- example: ([a-z-]+) -->\s*$/);
  const moduleFile = code.match(/^\/\/ file: ([a-z-]+\.ts)\n/);
  const name = moduleFile ? `modules/${moduleFile[1]}` : marker ? `${marker[1]}.ts` : null;
  assert(name, `Missing example identity at ${match.index}`);
  assert(!snippets.has(name), `Duplicate example ${name}`);
  const ast = ts.createSourceFile(name, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  assert.equal(ast.parseDiagnostics.length, 0, `Syntax error in ${name}`);
  function visit(node) {
    if (ts.isNonNullExpression(node)) throw new Error(`${name}: forbidden postfix non-null assertion`);
    if (ts.isVariableDeclaration(node)) assert(node.type || ts.isSatisfiesExpression(node.initializer || {}) || (node.initializer && ts.isAsExpression(node.initializer)), `${name}: missing visible variable contract`);
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node) || ts.isMethodSignature(node) || ts.isFunctionTypeNode(node)) {
      assert(node.type, `${name}: missing explicit return contract`);
      for (const parameter of node.parameters) assert(parameter.type, `${name}: missing explicit parameter contract`);
    }
    if (ts.isConstructorDeclaration(node)) for (const parameter of node.parameters) assert(parameter.type, `${name}: missing constructor parameter contract`);
    if (node.kind === ts.SyntaxKind.AnyKeyword) assert(name === "unknown-boundary.ts" && ts.isFunctionDeclaration(node.parent) && node.parent.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword), `${name}: unquarantined any`);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  snippets.set(name, code);
}

// These directives are negative test assertions, never copied into guide examples.
const negatives = new Map([
  ["immutable-config.ts", `\n// @ts-expect-error -- readonly nested state must reject mutation.\nconfig.sampling.temperature = 1;\n// @ts-expect-error -- readonly arrays must reject push.\nconfig.enabledTools.push("upload");\n`],
  ["mutable-player.ts", `\nplayer.health = 20;\n// @ts-expect-error -- stable identity remains readonly on mutable state.\nplayer.playerId = "other";\n`],
  ["checked-index.ts", `\n// @ts-expect-error -- arbitrary indexed lookup may be undefined.\nconst invalidEnemy: EnemyDefinition = enemies[0];\n`],
  ["literal-rarities.ts", `\n// @ts-expect-error -- closed domain must reject other strings.\nconst invalidRarity: JokerRarity = "mythic";\n`],
  ["constrained-replay-id.ts", `\n// @ts-expect-error -- template domain requires the prefix.\nconst invalidReplayId: ReplayId = "match_1";\n`],
  ["validation-result.ts", `\n// @ts-expect-error -- raw strings have not proved the nonblank invariant.\nconst invalidPrompt: NonBlankPrompt = "hello";\n`],
  ["unknown-boundary.ts", `\nconst untrusted: unknown = {};\n// @ts-expect-error -- unknown cannot be used without proof.\nuntrusted.advice;\n`],
  ["precise-route-catalog.ts", `\n// @ts-expect-error -- preserves exact known keys.\nconst badScreen: ReplayScreen = "settings";\n// @ts-expect-error -- the literal graph must be readonly, not merely satisfy readonly.\nREPLAY_ROUTES.library.path = "/other";\n`],
  ["explicit-callback.ts", `\n// @ts-expect-error -- explicit predicate return disallows truthy strings.\nconst badPredicate: (player: PlayerSummary) => boolean = (player: PlayerSummary): boolean => player.name;\n`],
  ["exact-direction-tuple.ts", `\n// @ts-expect-error -- exact first tuple member remains up.\nconst badDirection: "down" = DIRECTIONS[0];\n`],
  ["require-player.ts", `\n// @ts-expect-error -- finder itself still admits absence.\nconst missing: PlayerSummary = ([] as readonly PlayerSummary[]).find((player: PlayerSummary): boolean => player.playerId === "x");\n`],
  ["earned-generic.ts", `\n// @ts-expect-error -- generic result preserves the input element type.\nconst badTip: CoachTip | undefined = firstOrUndefined(players);\n`],
  ["exhaustive-effects.ts", `\ntype RemoveChipsEffect = { readonly kind: "remove-chips"; readonly chips: number };\nfunction extendedLabel(effect: JokerEffect | RemoveChipsEffect): string {\n  switch (effect.kind) {\n    case "add-chips": return "chips";\n    case "add-mult": return "mult";\n    default:\n      // @ts-expect-error -- a new variant must fail at the exhaustive boundary.\n      return assertNever(effect);\n  }\n}\n`],
]);
const runtime = new Map([
  ["explicit-types.ts", `auditAssert(calculateScore(10, 2) === 300, "score result");`],
  ["checked-index.ts", `auditAssert(enemyLabel(undefined) === "No enemy selected", "missing enemy"); auditAssert(enemyLabel({name:"Dummy"}) === "Dummy", "enemy label");`],
  ["exhaustive-effects.ts", `auditAssert(effectLabel({kind:"add-chips",chips:25}) === "+25 chips", "chips"); auditAssert(effectLabel({kind:"add-mult",mult:3}) === "+3 Mult", "mult");`],
  ["provider-normalization.ts", `auditAssert(normalizeProviderEvent({event_type:"run.finished",reply:"ok"}).kind === "completed", "normalize");`],
  ["literal-rarities.ts", `auditAssert(new Set(JOKER_RARITIES).size === 4 && JOKER_RARITIES.length === 4, "catalog uniqueness");`],
  ["replay-id-validation.ts", `for (const value of ["replay_", "replay_final"]) auditAssert(isReplayId(value) && parseReplayId(value) === value, "valid prefix"); for (const value of [null, undefined, 4, {}, "", "match_1"]) { auditAssert(!isReplayId(value), "invalid prefix"); auditThrows((): void => { parseReplayId(value); }); }`],
  ["validation-result.ts", `auditAssert(parsePrompt(" ").kind === "invalid", "blank"); auditAssert(parsePrompt(null).kind === "invalid", "not string"); auditAssert(parsePrompt("coach").kind === "valid", "valid prompt");`],
  ["require-player.ts", `auditAssert(requirePlayer([{playerId:"1",name:"Gohan"}],"1").name === "Gohan", "found"); auditThrows((): void => { requirePlayer([],"missing"); });`],
  ["runtime-freezing.ts", `auditAssert(Object.isFrozen(config), "frozen object"); auditAssert(Reflect.set(config,"retries",5) === false && config.retries === 3, "runtime mutation rejected");`],
  ["earned-generic.ts", `auditAssert(firstOrUndefined<number>([]) === undefined, "empty generic"); auditAssert(firstPlayer?.name === "Gohan" && firstTip?.advice === "Review your landing choices", "two typed uses");`],
  ["player-value-transformation.ts", `const original: PlayerState = {playerId:"p",maxHealth:100,health:100}; const damaged: PlayerState = applyDamage(original,25); auditAssert(original.health === 100 && damaged.health === 75 && original !== damaged, "immutable transformation"); auditAssert(applyDamage(original,200).health === 0, "clamp"); auditThrows((): void => {applyDamage(original,-1);}); auditThrows((): void => {applyDamage(original,NaN);});`],
  ["lobby-result.ts", `auditAssert(joinLobby(1,4).kind === "joined", "join"); auditAssert(joinLobby(4,4).kind === "full", "full"); auditThrows((): void => {joinLobby(-1,4);}); auditThrows((): void => {joinLobby(1,0);});`],
]);
runtime.set("live-replay-connection.ts", `
let observedSocket: AuditSocket | undefined;
class AuditSocket {
  static readonly OPEN: number = 1;
  readyState: number = 1;
  closeCount: number = 0;
  sent: string[] = [];
  constructor(url: string) { observedSocket = this; }
  send(command: string): void { this.sent.push(command); }
  close(): void { this.closeCount += 1; this.readyState = 3; }
}
Object.defineProperty(globalThis, "WebSocket", { value: AuditSocket, configurable: true });
function inspectedSocket(): AuditSocket {
  if (observedSocket === undefined) throw new Error("No socket was created");
  return observedSocket;
}
let connection: ReplayConnection = new BrowserReplayConnection("ws://example.invalid");
connection.send("play");
auditAssert(inspectedSocket().sent[0] === "play", "send uses the owned socket");
connection.close(); connection.close();
auditAssert(inspectedSocket().closeCount === 1, "close is idempotent");
auditThrows((): void => { connection.send("after-close"); });
`);
runtime.set("concurrent-replay-analysis.ts", `
declare const process: { exitCode: number };
async function auditAsync(): Promise<void> {
  let starts: string[] = [];
  let completeReplay: ((value: ReplaySummary) => void) | undefined;
  let source: ReplayAnalysisSource = {
    loadReplay(replayId: string): Promise<ReplaySummary> {
      starts.push("replay");
      return new Promise<ReplaySummary>((resolve: (value: ReplaySummary) => void): void => { completeReplay = resolve; });
    },
    async loadTip(replayId: string): Promise<CoachTip> { starts.push("tip"); return {advice:"Review"}; },
  };
  let loading: Promise<readonly [ReplaySummary, CoachTip]> = loadAnalysis(source,"r1");
  auditAssert(starts.join(",") === "replay,tip", "both independent calls start before the first completes");
  if (completeReplay === undefined) throw new Error("missing resolver");
  completeReplay({replayId:"r1"});
  const result: readonly [ReplaySummary, CoachTip] = await loading;
  auditAssert(result[0].replayId === "r1" && result[1].advice === "Review", "typed concurrent results");
  let laterFinished: boolean = false;
  let completeLater: (() => void) | undefined;
  let later: Promise<void> = new Promise<void>((resolve: () => void): void => { completeLater = resolve; });
  let failed: ReplayAnalysisSource = {
    async loadReplay(replayId: string): Promise<ReplaySummary> { throw new Error("load failed"); },
    async loadTip(replayId: string): Promise<CoachTip> { await later; laterFinished = true; return {advice:"Still completed"}; },
  };
  let rejected: boolean = false;
  try { await loadAnalysis(failed,"r2"); } catch { rejected = true; }
  auditAssert(rejected && !laterFinished, "all rejects before the other operation settles");
  if (completeLater === undefined) throw new Error("missing later resolver");
  completeLater(); await later; await Promise.resolve();
  auditAssert(laterFinished, "rejection did not cancel the other operation");
}
void auditAsync().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
`);
const helper = `\nfunction auditAssert(condition: boolean, label: string): void { if (!condition) throw new Error(label); }\nfunction auditThrows(operation: () => void): void { let thrown: boolean = false; try { operation(); } catch { thrown = true; } auditAssert(thrown, "expected exception"); }\n`;
const directory = await mkdtemp(path.join(tmpdir(), "typescript-guide-"));
try {
  await mkdir(path.join(directory, "modules"));
  for (const [name, code] of snippets) await writeFile(path.join(directory, name), code + "\nexport {};\n");
  const options = { target: "ES2022", module: "Node16", moduleResolution: "Node16", lib: ["ES2022", "DOM"], types: [], strict: true, noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true, noImplicitOverride: true, noFallthroughCasesInSwitch: true, noImplicitReturns: true, noPropertyAccessFromIndexSignature: true, noEmit: true };
  async function compile(extra = {}) {
    await writeFile(path.join(directory, "tsconfig.json"), JSON.stringify({compilerOptions: {...options,...extra},include:["**/*.ts"]}));
    const run = spawnSync(process.execPath, [compiler, "--project", path.join(directory, "tsconfig.json"), "--pretty", "false"], {encoding:"utf8"});
    assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  }
  await compile();
  for (const [name, extra] of negatives) await writeFile(path.join(directory, name), snippets.get(name) + extra + "\nexport {};\n");
  await writeFile(path.join(directory, "optional-contract.ts"), `type Overrides = { readonly model?: string };\n// @ts-expect-error -- omission is not explicit undefined.\nconst bad: Overrides = { model: undefined };\nexport {};\n`);
  await compile();
  for (const [name, code] of snippets) await writeFile(path.join(directory, name), code + (runtime.has(name) ? helper + runtime.get(name) : "") + "\nexport {};\n");
  await rm(path.join(directory, "optional-contract.ts"));
  await compile({noEmit:false,outDir:path.join(directory,"out")});
  for (const name of runtime.keys()) {
    const run = spawnSync(process.execPath, [path.join(directory,"out",name.replace(/\.ts$/,".js"))], {encoding:"utf8"});
    assert.equal(run.status, 0, `${name}: ${run.stdout}\n${run.stderr}`);
  }
  const expectedErrors = [...negatives.values()].reduce((sum,text) => sum + (text.match(/@ts-expect-error/g) || []).length, 0) + 1;
  console.log(JSON.stringify({typescript:ts.version,examples:snippets.size,jsonExamples:jsonCount,decisions:decisionIds.length,negativeTypeAssertions:expectedErrors,runtimePrograms:runtime.size,explicitContractChecks:"passed",formatting:skipFormat?"not run (local supplementary check)":"passed",status:"passed"}));
} finally { await rm(directory,{recursive:true,force:true}); }
