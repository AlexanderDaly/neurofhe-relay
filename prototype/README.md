# NeuroFHE Relay Prototype

`prototype/` is the runnable contract harness for NeuroFHE Relay. It keeps the
research-alpha boundary executable with portable Node.js tests, toy arithmetic,
artifact publishers, native-lane adapters, and release-evidence indexing.

This directory is not production cryptography, medical software, clinical
validation, deployment evidence, side-channel evidence, or stable-performance
evidence. Preserve `productionClaim: false`, `releaseGateSatisfied: false`,
`privacyBoundary`, and `cryptoInventory` whenever artifact or lane metadata
carries those fields.

For the complete code map, use
[`../docs/prototype-map.md`](../docs/prototype-map.md). For the full script
list, use [`../docs/command-reference.md`](../docs/command-reference.md). For
local setup or blocker handling, use
[`../docs/troubleshooting.md`](../docs/troubleshooting.md) and
[`../benchmark-artifacts/README.md`](../benchmark-artifacts/README.md).

## First Commands

Run the portable validation gate:

```sh
npm run validate
```

Run the educational toy sparse encrypted scorer:

```sh
npm run demo
```

Run the local relay gateway scaffold:

```sh
npm run gateway:demo
```

Publish the synthetic benchmark artifact:

```sh
npm run benchmark:artifact
```

These commands are useful smoke checks for the public contract. They do not
satisfy the release gate by themselves and do not create production-security,
medical, native-library, or deployment evidence.

## What Lives Here

- `lib/` owns event-window validation, gateway policy, sparse scoring,
  artifact publishing, plaintext baselines, native adapter manifests, hygiene
  scanning, reconstruction probes, and release-evidence indexing.
- Top-level `*.mjs` files are CLI entrypoints for demos, benchmarks, baseline
  generation, native-lane adapters, reconstruction probes, and release evidence.
- `openfhe/` and `openfhe-ckks/` contain native OpenFHE C++ comparison lanes.
- `tfhe-rs/` contains the Rust TFHE-rs comparison lane.
- Supporting Markdown files hold native integration notes and cleanup handoffs.

`../docs/prototype-map.md` is the authoritative inventory for modules,
entrypoints, native source files, and supporting notes. Keep detailed module
lists there rather than duplicating them here.

## Evidence Boundaries

The dependency-free JavaScript path uses toy additive arithmetic to make the
schema, gateway, sparse linear contract, and artifact shape testable anywhere.
It is not full FHE and cannot substitute for native OpenFHE, TFHE-rs, or other
reviewed library evidence.

Native OpenFHE and TFHE-rs paths are local dependency lanes. If a native command
cannot run, record the exact command, error, and smallest next step in a
structured blocker artifact instead of inventing benchmark numbers or replacing
native-library evidence with toy timings.

Raw datasets, private payloads, proprietary adapters, trained weights, and
deployment code stay outside this public repository. Treat raw datasets as
local-only inputs, and commit only derived metrics, provenance, caveats, or
blocker reports.

Use the release gate in [`../RELEASE.md`](../RELEASE.md) before treating any
prototype artifact as release evidence.
