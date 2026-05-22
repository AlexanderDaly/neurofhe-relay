# Development

NeuroFHE Relay is a CC0 research prototype. The default development loop is
portable Node.js validation plus optional native FHE checks when OpenFHE or
Rust/TFHE-rs are installed locally.

Nothing in this repository is production cryptography, medical software, or a
security certification.

## Prerequisites

- Node.js 20 or newer.
- npm, bundled with Node.js.
- Optional: CMake, a C++17 compiler, and a local OpenFHE install for the BFVrns
  and CKKS native lanes.
- Optional: Rust stable and Cargo for the TFHE-rs comparison lane.

The JavaScript harness has no npm dependencies today. If dependencies are added
later, commit the lockfile and update the CI workflow before relying on
dependency installation in automation.

## Portable Checks

Run the main validation gate:

```sh
npm run ci
```

That command runs the Node test suite, parses the core JSON metadata files, and
scans for placeholder text. `npm run ci` currently aliases `npm run validate`.

Run smoke artifact generation without touching committed artifacts:

```sh
tmpdir=$(mktemp -d)
npm run benchmark:artifact -- --out "$tmpdir/benchmark-artifacts"
npm run benchmark:privacy-modes -- --artifact --out "$tmpdir/privacy-modes"
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact --out "$tmpdir/nmnist-smoke"
```

These are the same classes of checks used by `.github/workflows/ci.yml`.

## Native OpenFHE Checks

OpenFHE is not vendored in this repository. Install it locally first, then run:

```sh
cmake -S prototype/openfhe -B build/openfhe
cmake --build build/openfhe
npm run benchmark:openfhe -- --run
```

For CKKS:

```sh
cmake -S prototype/openfhe-ckks -B build/openfhe-ckks
cmake --build build/openfhe-ckks
npm run benchmark:openfhe-ckks -- --run
```

To run the derived EEG single-window contracts:

```sh
npm run contract:eeg-openfhe
npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact
```

If the native library cannot be found, keep the generated blocker artifact and
record the exact command and error. Do not substitute toy results for FHE
security evidence.

## TFHE-rs Checks

Run the Rust tests and JSON-emitting demo:

```sh
cargo test --manifest-path prototype/tfhe-rs/Cargo.toml
npm run benchmark:tfhe -- --run --artifact
```

TFHE-rs is the threshold/Boolean comparison lane. Treat timings as local-machine
evidence only unless repeated on a pinned benchmark host.

## Real Data

The EEG Eye State path fetches a public ARFF into `.cache/`, which is ignored by
git. Committed artifacts must include provenance and must not include raw EEG
rows.

```sh
npm run baseline:eeg-eye-state -- --artifact
```

The N-MNIST path expects a local extracted dataset and records a blocker report
when the dataset is absent.

## Artifact Policy

- `benchmark-artifacts/` contains intentionally committed, derived evidence.
- `.cache/`, `node_modules/`, `build/`, and Rust target directories are local
  build/cache outputs.
- Raw neural, EEG, sensor, partner, or private datasets must not be committed.
- Every new benchmark artifact should preserve `privacyBoundary`,
  `cryptoInventory`, `productionClaim: false`, commands, and provenance.

## Release Gate

Use `RELEASE.md` for the research-alpha release gate. Before tagging, confirm
the portable CI workflow is green and that any native FHE evidence is either a
real local-library run or a structured blocker artifact.
