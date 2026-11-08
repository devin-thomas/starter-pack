# lantern-tools

A read-only command for looking up the tools of the Lantern Street Tool Library, a fictional community tool library. It is the reference example for the Starter Pack's Level 2 lessons: the same lookup is also served as an HTTP API by the library's website, and both use one shared module (`lib/catalog.mjs`).

The library does not exist. The catalog is example data.

## Install

Requires Node.js 20 or newer. Download the archive and its checksum into an empty folder, check the checksum, then install from the archive:

```sh
curl -fLO https://starter.uppercut-labs.com/examples/lantern-tools/lantern-tools-0.1.0.tgz
curl -fLO https://starter.uppercut-labs.com/examples/lantern-tools/lantern-tools-0.1.0.tgz.sha256
shasum -a 256 -c lantern-tools-0.1.0.tgz.sha256
npm install --no-save ./lantern-tools-0.1.0.tgz
npx --no-install lantern-tools --help
```

On Windows PowerShell, compare `(Get-FileHash lantern-tools-0.1.0.tgz -Algorithm SHA256).Hash` with the first word of the `.sha256` file instead of `shasum`.

To run it once without installing: `npm exec --yes --package=./lantern-tools-0.1.0.tgz -- lantern-tools list`.

## Use

```sh
lantern-tools list
lantern-tools list --available true
lantern-tools list --category "Hand tools" --json
lantern-tools show cordless-drill --json
lantern-tools help show
```

`--json` prints JSON on stdout, including errors, in the same shape as the library's HTTP API:

```json
{
  "api_version": "1",
  "library": "Lantern Street Tool Library",
  "catalog_updated": "2026-11-08",
  "tool": {
    "id": "cordless-drill",
    "name": "Cordless drill",
    "category": "Power tools",
    "loan_days": 14,
    "available": true
  }
}
```

An error has the shape `{ "api_version": "1", "error": { "code": "not_found", "message": "…", "status": 404 } }`.

The archive bundles a public sample catalog, `data/catalog.json`. At the library's desk, `--catalog FILE` reads the library's own catalog file instead. That file may also hold staff-only fields; they are never printed.

## Exit status

| Status | Meaning |
| --- | --- |
| 0 | Success |
| 1 | No tool has that id |
| 2 | Usage error: unknown command or option, missing or invalid value |
| 3 | The catalog file cannot be read or is not valid |
| 70 | Unexpected error |

## Privacy

The catalog holds private fields for library staff (where each tool is stored, staff notes). The command prints only the public fields `id`, `name`, `category`, `loan_days` and `available`, in every mode and in every error. It reads no environment variables, changes nothing, and does not use the network.

## License

Part of Starter Pack. Copyright (c) 2026 Devin Thomas. All rights reserved. You may install and run this example to follow the course. The Starter Pack rights notice applies: https://github.com/devin-thomas/starter-pack/blob/main/LICENSE
