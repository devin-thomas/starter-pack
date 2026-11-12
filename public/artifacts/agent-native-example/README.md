# Pantry: one capability, two interfaces

This is a small, runnable example for Level 4 of Make It Agent Native. A synthetic pantry app describes its operations once with Uppercut Agent Native, then offers them as a command-line tool (CLI) and an HTTP API. Both interfaces share one typed contract, one implementation and one authorization policy, so they cannot drift apart.

Use it to learn the pattern, then apply it to your own project. The pantry data is made up and lives in memory; nothing here signs anyone in, stores data or deploys anything.

## When to use this, and when not to

A handmade command or endpoint is the right choice for most projects. If you need one read-only operation on one interface, build that directly in Level 2 or Level 3. It is less code and nothing new to learn.

Reach for Agent Native when at least one of these is true:

- The same operation should work in more than one place, such as a CLI and an HTTP API, or an API and an MCP tool, and you want one definition of its inputs, outputs and rules.
- Some operations must stay locked to signed-in people, and you want every interface to ask the same policy on every call.
- Other people or agents depend on the operation, so you need versioned contracts and a test that catches breaking changes.

If none of these apply yet, finish a simpler level first. You can adopt the package later without rewriting your app logic.

## What you need

- Node.js 22 or newer, and npm.
- The exact released versions below. The example pins them in `package.json` and `package-lock.json`.

| Package | Version | Why |
| --- | --- | --- |
| `@uppercut-labs/agent-native` | `1.1.0` | Contracts, registry, authorization checks, CLI runner, HTTP handler |
| `zod` | `4.6.5` | Schemas for inputs and outputs (1.1.0 accepts 4.6.5 and later 4.6 patches) |

Version 1.1.0 is the current release on npm. It is a library you import: it has no global `agent-native` command, no `npx` setup tool, and no single command that converts a whole site. Your project owns the CLI file and the server file, as this example does.

This example uses only stable entry points: the package root, `schema/zod`, `cli` and `http`. See the package's [stability policy](https://github.com/uppercut-labs/agent-native/blob/v1.0.1/docs/stability.md) and [installation guide](https://github.com/uppercut-labs/agent-native/blob/v1.0.1/docs/installation.md). They were written for 1.0.1, and 1.1.0 keeps these entry points stable.

## Get the example

Ask your agent to fetch these files into a new folder, keeping the same paths, then install and test. On macOS, Linux or WSL:

```sh
mkdir pantry-agent-native && cd pantry-agent-native
base=https://starter.uppercut-labs.com/artifacts/agent-native-example
for file in README.md package.json package-lock.json \
  src/pantry.mjs src/capabilities.mjs src/cli.mjs src/http.mjs src/server.mjs src/contract.mjs \
  contract/pantry.v1.json test/pantry.test.mjs; do
  mkdir -p "$(dirname "$file")"
  curl --fail --silent --show-error --output "$file" "$base/$file"
done
npm ci
npm test
```

`npm ci` installs exactly what the lockfile records and fails if `package.json` and the lockfile disagree. `npm test` runs 12 checks and should report `pass 12`. On Windows, your agent can fetch the same files with its own tools; the npm commands are the same.

## Try both interfaces

The CLI is the app's own file, `src/cli.mjs`:

```sh
node src/cli.mjs --help
node src/cli.mjs pantry-list --mode local --low true
```

The second command prints exactly one JSON envelope on standard output (a short `target=` note goes to standard error). Its `result.value.items` lists `rice` and `lentils`, the two items running low, `result.value.count` is 2, and the command exits with status 0. Failures use the same envelope with `result.kind` set to `failure`: exit status 2 for input that breaks the contract, 3 for a denied call and 1 for other errors.

Start the HTTP API on your own computer (it listens on `127.0.0.1` only):

```sh
npm run serve
```

In a second terminal, call the same capability over HTTP:

```sh
curl -s -X POST -H 'content-type: application/json' -d '{"low":true}' \
  http://127.0.0.1:8787/agent-native/v1/capabilities/example.pantry/items.list/v1/invoke
```

The response is the same `items` and `count` the CLI returned. Stop the server with Ctrl+C.

Now try something an agent must not be able to do. Restocking is a protected write:

```sh
node src/cli.mjs pantry-restock --mode local --name rice --quantity 3
curl -s -i -X POST -H 'content-type: application/json' -d '{"name":"rice","quantity":3}' \
  http://127.0.0.1:8787/agent-native/v1/capabilities/example.pantry/items.restock/v1/invoke
```

The CLI exits with status 3 and reports `unauthorized`. The HTTP API answers `404`: in 1.1.0 the HTTP handler gives protected operations no route and leaves them out of its OpenAPI document at `/agent-native/v1/openapi.json`, whatever headers the request sends. The pantry is unchanged either way.

## How the pieces fit

| File | Role |
| --- | --- |
| `src/pantry.mjs` | The app's existing logic. Agent Native does not replace it. |
| `src/capabilities.mjs` | The **contracts** (`items.list@1`, a public read, and `items.restock@1`, a write that needs `pantry:write`), the **bindings** that call `pantry.mjs`, and the **authorization policy** |
| `src/cli.mjs` | The **CLI projection**, built with `runCapabilityCli` |
| `src/http.mjs`, `src/server.mjs` | The **HTTP projection**, built with `createHttpHandler` and served by Node's built-in server |
| `src/contract.mjs`, `contract/pantry.v1.json` | A reviewed snapshot of each v1 contract |
| `test/pantry.test.mjs` | Repeatable checks of the pins, contract, authorization and both projections |

Every call, on every interface, goes through the same steps in this order: check the input against the contract, ask the authorization policy, run the binding, then check the output. The policy is yours. Agent Native asks it before each call; it never decides on its own and has no allow-all default.

## Versioning

Each contract has a major version in its identity (`@1`) and in its HTTP route (`/v1/`). Within version 1 you can reword a description or change the implementation. A change that could break a caller, such as a new required input or a different output, needs version 2.

Two checks protect this. The test compares every contract with `contract/pantry.v1.json`, so an accidental change fails. The test also uses the package's `assertCompatibleCapabilityReplacement`, which rejects a breaking change to an existing version. To make a breaking change, define the new contract with `majorVersion: 2`, keep version 1 working until its callers have moved, and add a new snapshot. Regenerate a snapshot only for a change you meant: `node src/contract.mjs --write`. See [composition and versioning](https://github.com/uppercut-labs/agent-native/blob/v1.0.1/docs/composition-and-versioning.md) for the 1.x rules.

## Adapt it to your own project

Work on a branch, and give your agent this page. Start with one operation.

1. **Choose one operation your app already performs**, ideally a read. Write down what goes in, what comes out, and who may call it.
2. **Install the pinned versions**: `npm install --save-exact @uppercut-labs/agent-native@1.1.0 zod@4.6.5`. Commit `package.json` and the lockfile together. Install the package only when you have chosen this level; it is never required.
3. **Write the contract** with `defineCapability`: a namespace for your app, a name, `majorVersion: 1`, input and output schemas (use `z.strictObject` for inputs so unknown fields are rejected), a risk (`read`, `write` or `destructive`) and an access rule (`public` only for reads, otherwise `protected` with scopes).
4. **Bind it to your existing function** with `bindCapability`. Call your code; do not copy it.
5. **Write the authorization policy.** Allow public reads. For anything protected, build the caller from your app's existing sign-in on the server side, never from command-line arguments, request text or a header you have not verified. If your app has no sign-in, keep every write off agent interfaces.
6. **Add only the projections you need.** Copy `cli.mjs` for a command, or `http.mjs` for an API inside your existing server. For an MCP tool, the stable `mcp` entry point needs `@modelcontextprotocol/server@2.3.0`; see the [MCP guide](https://github.com/uppercut-labs/agent-native/blob/v1.0.1/docs/mcp.md).
7. **Add tests like these**: expected output, one invalid input, one denied call, and a contract snapshot. Run them before every change.
8. **Prove it with a real agent**, as in the next section.

The package's [existing-site guide](https://github.com/uppercut-labs/agent-native/blob/v1.0.1/docs/adopt-existing-site.md) covers framework details.

## What your app still owns

Agent Native checks contracts and asks your policy. Your app remains responsible for:

- **Sign-in and identity.** The package does not create accounts, sign people in or issue tokens.
- **Hosting.** It gives you a request handler; you choose where it runs, and you add HTTPS, rate limits and logging there. Do not put this example's server on the public internet as it is.
- **Data and secrets.** Keep keys and tokens out of the repository and out of agent-visible output.
- **Releases.** Deploying, and rolling back, the app is the same process you already use.

## Upgrade and roll back

Exact pins mean nothing changes until you change it.

- **To upgrade**, on a branch: read the [release notes](https://github.com/uppercut-labs/agent-native/releases) for the new version, run `npm install --save-exact @uppercut-labs/agent-native@NEW_VERSION`, then `npm test`. Keep the change only if every test passes.
- **To roll back a version change**, restore both files from your last good commit and reinstall: `git checkout LAST_GOOD_COMMIT -- package.json package-lock.json`, then `npm ci` and `npm test`.
- **To remove the package**, delete the capability, CLI and HTTP files and run `npm uninstall @uppercut-labs/agent-native zod`. Your app logic, like `pantry.mjs` here, does not change.

## Prove it with a real agent

Phase 3 counts this level only through a working CLI, API or MCP tool, checked by a real agent or client you use. Installing the package is not enough.

1. Ask your agent to run the operation: for this example, `node src/cli.mjs pantry-list --mode local --low true` or the `curl` call above.
2. Check the expected output: the items that are low, `rice` and `lentils`, with a count of 2.
3. Check one denied case: a restock attempt is refused, with exit status 3 or HTTP 404.
4. Confirm the result yourself.

Your agent records the result on the Level 4 step of your private progress file with the interface you tested (`cli` or `api`), the client, the operation, both checks, your confirmation, the time, and `package_version` set to `@uppercut-labs/agent-native@1.1.0`. It records short notes only, never logs, keys or tokens.

## Limits of this example

- The data is synthetic and resets every time a process starts.
- Restocking succeeds only in the tests, through a signed-in caller the test creates. A real app would build that caller from its own sign-in.
- The HTTP server is for your own computer. It is not hardened for the internet.
- The checks describe version 1.1.0. A later version may add features; check its release notes rather than assuming them.
