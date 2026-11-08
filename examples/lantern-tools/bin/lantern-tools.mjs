#!/usr/bin/env node
// lantern-tools: look up the Lantern Street Tool Library's tools from a terminal.
// Read-only. It never changes the catalog, never reads environment variables,
// and prints only each tool's public fields.

import { readFileSync } from "node:fs";
import {
  CatalogError,
  errorBody,
  errorShape,
  listFilters,
  listTools,
  parseCatalog,
  showTool,
} from "../lib/catalog.mjs";

const NAME = "lantern-tools";
const VERSION = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).version;
const BUNDLED = new URL("../data/catalog.json", import.meta.url);

const HELP = {
  main: `Look up the Lantern Street Tool Library's tools. Read-only.

Usage:
  ${NAME} list [--available true|false] [--category NAME] [--catalog FILE] [--json]
  ${NAME} show TOOL_ID [--catalog FILE] [--json]
  ${NAME} help [list|show]
  ${NAME} --version [--json]

Examples:
  ${NAME} list --available true
  ${NAME} list --category "Hand tools" --json
  ${NAME} show cordless-drill --json

Options:
  --json            Print JSON on stdout, including errors. The shape matches
                    the library's HTTP API for the same question.
  --catalog FILE    Read a local catalog file instead of the bundled one.
  -h, --help        Show help for a command.
  -V, --version     Show the version.

Exit status:
  0  success
  1  no tool has that id
  2  usage error: unknown command or option, missing or invalid value
  3  the catalog file cannot be read or is not valid
  70 unexpected error

Only public fields are printed: id, name, category, loan_days, available.`,
  list: `List the library's tools, in catalog order.

Usage:
  ${NAME} list [--available true|false] [--category NAME] [--catalog FILE] [--json]

Options:
  --available true|false  Only tools that can (true) or cannot (false) be borrowed now.
  --category NAME         Only tools in this category, ignoring case.
  --catalog FILE          Read a local catalog file instead of the bundled one.
  --json                  Print JSON: api_version, library, catalog_updated,
                          categories, count, tools.

Examples:
  ${NAME} list
  ${NAME} list --available true --json`,
  show: `Show one tool by its id.

Usage:
  ${NAME} show TOOL_ID [--catalog FILE] [--json]

Options:
  --catalog FILE  Read a local catalog file instead of the bundled one.
  --json          Print JSON: api_version, library, catalog_updated, tool.

Examples:
  ${NAME} show cordless-drill
  ${NAME} show pressure-washer --json

Exits with status 1 when no tool has that id.`,
};

// Options each command accepts: true takes a value, false is a flag.
const OPTIONS = {
  list: { "--available": true, "--category": true, "--catalog": true, "--json": false },
  show: { "--catalog": true, "--json": false },
};

class UsageError extends Error {}

function parse(argv) {
  const json = argv.includes("--json");
  if (argv.includes("-V") || argv.includes("--version")) return { command: "version", json };
  const [command, ...rest] = argv;
  if (command === undefined || command === "-h" || command === "--help")
    return { command: "help", topic: "main", json };
  if (command === "help") {
    const topic = rest.find((arg) => !arg.startsWith("-")) ?? "main";
    if (!Object.hasOwn(HELP, topic)) throw new UsageError("Unknown help topic. Topics: list, show.");
    return { command: "help", topic, json };
  }
  if (!Object.hasOwn(OPTIONS, command))
    throw new UsageError("Unknown command. Commands: list, show, help.");
  if (rest.includes("-h") || rest.includes("--help"))
    return { command: "help", topic: command, json };
  const allowed = OPTIONS[command];
  const options = {};
  const positionals = [];
  for (let index = 0; index < rest.length; index++) {
    const arg = rest[index];
    if (!arg.startsWith("-")) {
      positionals.push(arg);
      continue;
    }
    const [name, inline] = arg.split(/=(.*)/s, 2);
    if (!Object.hasOwn(allowed, name))
      throw new UsageError(
        `Unknown option for ${command}. Options: ${Object.keys(allowed).join(", ")}.`,
      );
    if (!allowed[name]) {
      if (inline !== undefined) throw new UsageError(`${name} takes no value.`);
      options[name] = true;
      continue;
    }
    const value = inline ?? rest[++index];
    if (value === undefined || (inline === undefined && value.startsWith("--")))
      throw new UsageError(`${name} needs a value.`);
    options[name] = value;
  }
  if (command === "list" && positionals.length > 0)
    throw new UsageError("list takes no tool id. Use show TOOL_ID for one tool.");
  if (command === "show" && positionals.length !== 1)
    throw new UsageError("show needs exactly one TOOL_ID, such as cordless-drill.");
  return { command, options, id: positionals[0], json };
}

function loadCatalog(file) {
  let raw;
  try {
    raw = readFileSync(file ?? BUNDLED, "utf8");
  } catch {
    throw new CatalogError("invalid_catalog", "The catalog file cannot be read.");
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    // The runtime's parse message quotes the file, which may hold private notes.
    throw new CatalogError("invalid_catalog", "The catalog file is not valid JSON.");
  }
  return parseCatalog(value);
}

function printList(body) {
  const lines = [`${body.library} · catalog updated ${body.catalog_updated}`, `${body.count} ${body.count === 1 ? "tool" : "tools"}`];
  if (body.count > 0) {
    const width = (key) => Math.max(...body.tools.map((tool) => String(tool[key]).length));
    const [id, name, category] = [width("id"), width("name"), width("category")];
    lines.push("");
    for (const tool of body.tools)
      lines.push(
        [
          tool.id.padEnd(id),
          tool.name.padEnd(name),
          tool.category.padEnd(category),
          `${tool.loan_days} days`.padEnd(7),
          tool.available ? "available" : "not available now",
        ].join("  "),
      );
  }
  return lines.join("\n");
}

function printTool(body) {
  const tool = body.tool;
  return [
    `${tool.name} (${tool.id})`,
    `Category: ${tool.category}`,
    `Loan: ${tool.loan_days} days`,
    `Available: ${tool.available ? "yes" : "no"}`,
    `Catalog updated: ${body.catalog_updated}`,
  ].join("\n");
}

function run(argv) {
  let request = { json: argv.includes("--json") };
  try {
    request = parse(argv);
    if (request.command === "version")
      return {
        code: 0,
        out: request.json
          ? JSON.stringify({ name: NAME, version: VERSION, api_version: "1" }, null, 2)
          : `${NAME} ${VERSION}`,
      };
    if (request.command === "help") return { code: 0, out: HELP[request.topic] };
    const catalog = loadCatalog(request.options["--catalog"]);
    const body =
      request.command === "list"
        ? listTools(
            catalog,
            listFilters({
              available: request.options["--available"],
              category: request.options["--category"],
            }),
          )
        : showTool(catalog, request.id);
    return {
      code: 0,
      out: request.json
        ? JSON.stringify(body, null, 2)
        : request.command === "list"
          ? printList(body)
          : printTool(body),
    };
  } catch (error) {
    if (error instanceof UsageError) {
      return request.json
        ? { code: 2, out: JSON.stringify(errorShape("usage", error.message, 400), null, 2) }
        : { code: 2, err: `${NAME}: ${error.message}\nRun ${NAME} --help for usage.` };
    }
    const body = errorBody(error);
    const code = error instanceof CatalogError ? error.exit : 70;
    return request.json
      ? { code, out: JSON.stringify(body, null, 2) }
      : { code, err: `${NAME}: ${body.error.message}` };
  }
}

const result = run(process.argv.slice(2));
if (result.out !== undefined) process.stdout.write(`${result.out}\n`);
if (result.err !== undefined) process.stderr.write(`${result.err}\n`);
process.exitCode = result.code;
