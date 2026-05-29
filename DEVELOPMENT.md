# Development

NeuroFHE Relay is a CC0 research prototype. The default development loop is
portable Node.js validation plus optional native FHE checks when OpenFHE or
Rust/TFHE-rs are installed locally.

Nothing in this repository is production cryptography, medical software, or a
security certification.

For the short first-pass contributor path, see `docs/developer-quickstart.md`.
For a grouped script list, see `docs/command-reference.md`.
For common local, hosted-CI, native-lane, dataset, or release-gate failures,
see `docs/troubleshooting.md`.

## Prerequisites

- Node.js 20 or newer.
- npm, bundled with Node.js.
- Optional: CMake, a C++17 compiler, and a local OpenFHE install for the BFVrns
  and CKKS native lanes.
- Optional: Rust stable and Cargo for the TFHE-rs comparison lane.

For CI parity, `.nvmrc` and `.node-version` point to Node.js 22. The package
engine remains `>=20` until a specific runtime feature requires a higher floor.

The JavaScript harness has no npm dependencies today. If dependencies are added
later, commit the lockfile and update the CI workflow before relying on
dependency installation in automation.

## Portable Checks

Run the main validation gate:

```sh
npm run ci
```

That command runs the Node test suite, parses the core JSON metadata files, and
checks local Markdown links before scanning for placeholder text, common secret
tokens, and committed raw dataset paths. `npm run ci` currently aliases
`npm run validate`.

Run only the documentation link check:

```sh
npm run check:docs
```

Run smoke artifact generation without touching committed artifacts:

```sh
tmpdir=$(mktemp -d)
npm run benchmark:artifact -- --out "$tmpdir/benchmark-artifacts"
npm run benchmark:privacy-modes -- --artifact --out "$tmpdir/privacy-modes"
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact --out "$tmpdir/nmnist-smoke"
```

These are the same classes of checks used by `.github/workflows/ci.yml`.
To publish a redacted repository hygiene scan as release evidence:

```sh
npm run scan:hygiene -- --artifact
```

The artifact records pass/fail status, scanned file count, blocked raw-data
patterns, and redacted findings only. It must not include secret values or raw
dataset rows. The committed latest hygiene surface is
`benchmark-artifacts/repo-hygiene/latest.json`.

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
record the exact command, error, and smallest next step. Do not substitute toy
results for FHE security evidence.

## TFHE-rs Checks

Run the Rust tests and JSON-emitting demo:

```sh
cargo test --manifest-path prototype/tfhe-rs/Cargo.toml
npm run benchmark:tfhe -- --run --artifact
```

TFHE-rs is the threshold/Boolean comparison lane. Treat timings as local-machine
evidence only unless repeated on a pinned benchmark host.

## Native Evidence Doctor

Summarize the native-lane evidence state, host/toolchain fingerprint, latest
artifact classification, exact rerun commands, and remaining gaps:

```sh
npm run native:doctor
npm run native:doctor -- --artifact
```

The manifest does not rerun OpenFHE or TFHE-rs benchmarks. It indexes the
latest committed artifacts and records whether each lane is a real native run,
dependency blocker, adapter plan, or missing artifact. Use it before release
review to make local native evidence easier to reproduce on another host.
The committed latest native summary is
`benchmark-artifacts/native-evidence/latest.json`.

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
- The portable hygiene scan blocks common raw dataset file extensions and
  token-shaped secrets; keep public source data outside git and commit only
  derived artifacts or structured blocker reports.
- Repository hygiene artifacts under `benchmark-artifacts/repo-hygiene/` are
  derived evidence only; findings are redacted and raw datasets remain outside
  git.
- Every new benchmark artifact should preserve `privacyBoundary`,
  `cryptoInventory`, `productionClaim: false`, commands, and provenance.

## Release Gate

Use `RELEASE.md` for the research-alpha release gate. Before tagging, confirm
the portable CI workflow is green and that any native FHE evidence is either a
real local-library run or a structured blocker artifact. Refresh
`npm run native:doctor -- --artifact` after native runs or blockers so reviewers
can see the exact host and rerun commands behind the latest evidence.

Use `docs/release-gate-matrix.md` for the command-by-command gate map and
`docs/evidence-dashboard.md` for the current human-readable evidence posture.
The machine-readable release dashboard is
`benchmark-artifacts/release-evidence/latest.json`.

The current cleanup branch keeps `releaseGateSatisfied: false` until every
documented gate is satisfied. A green hosted `Portable validation` check is
necessary, but a pull request can still be blocked by repository ruleset/admin
policy. Treat that as `repository ruleset/admin policy`, separate from
CI/check-rollup or code failures, and do not merge or tag without maintainer
approval and the documented release gate.
