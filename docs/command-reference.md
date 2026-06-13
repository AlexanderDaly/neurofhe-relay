# Command Reference

This reference groups the npm scripts by the job a reader or contributor is
trying to do. Run commands from the repository root.

`npm run validate` checks that every `package.json` script remains represented
here, so update this page when adding or renaming scripts.

The portable commands are evidence and validation helpers for a research-alpha
package. Native-library commands require local dependencies and should not be
used to make production cryptography, clinical, medical, surveillance,
deployment, or stable-performance claims.

## Command Routes

| Job | Start With | Details |
| --- | --- | --- |
| Validate a local change | `npm run ci` and `git diff --check` | Use `npm test -- --test-name-pattern "<focused behavior>"` while iterating. |
| Try the demos | `npm run demo` and `npm run gateway:demo` | Educational toy arithmetic and local gateway scaffolds only. |
| Refresh release evidence | `npm run release:evidence` | Use `-- --artifact` only when intentionally updating committed release-dashboard artifacts. |
| Investigate native evidence | `npm run native:doctor` | OpenFHE and TFHE-rs runs require local native dependencies. |
| Handle real-data or dataset work | `npm run baseline:plaintext` and `npm run contract:eeg-openfhe` | Keep raw datasets outside git; commit derived artifacts or blocker reports only. |

## Portable Validation

```sh
npm run ci
npm run validate
```

`npm run ci` aliases `npm run validate`. The validation gate runs the Node test
suite, parses core JSON metadata, checks local Markdown links, and runs the
repository hygiene scan.

```sh
npm test
npm run check:docs
npm run check:evidence-dashboard
npm run scan:hygiene
git diff --check
```

Use these for narrower checks while editing. `check:docs` verifies local
Markdown links. `check:evidence-dashboard` fails if `docs/evidence-dashboard.md`
has drifted from the committed release-evidence artifact. `scan:hygiene` checks
placeholder text, token-shaped secrets, and committed raw-data paths.

## Demos

```sh
npm run demo
npm run gateway:demo
```

`demo` runs the educational sparse encrypted spike-count classifier with toy
additive arithmetic. `gateway:demo` runs the local-first relay gateway scaffold
and shows the raw-signal boundary, model-facing event export, and safe local
recommendation validation.

## Synthetic And Privacy Benchmarks

```sh
npm run benchmark
npm run benchmark:artifact
npm run benchmark:privacy-modes
npm run reconstruction:risk
```

These commands cover the synthetic sparse scorer, optional benchmark artifact
publishing, padded-sparse privacy-mode overhead, and synthetic
reconstruction-risk probes. Treat them as research-alpha package evidence, not
production security or privacy proof.

## Plaintext Baselines And Input Contracts

```sh
npm run baseline:plaintext
npm run baseline:eeg-eye-state
npm run contract:eeg-openfhe
```

`baseline:plaintext` can run fixture or local real-data plaintext baselines.
`baseline:eeg-eye-state` fetches the public UCI EEG Eye State data into
`.cache/` and emits derived metrics only. `contract:eeg-openfhe` emits derived
OpenFHE-ready input contracts from the EEG baseline.

Raw public or private datasets must remain outside git. Commit only derived
artifacts or structured blocker reports.

## Native Comparison Lanes

```sh
npm run benchmark:openfhe
npm run benchmark:openfhe-ckks
npm run benchmark:tfhe
npm run native:doctor
```

The OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs lanes require local dependencies
for real native runs. If a dependency is unavailable, record the exact command,
error, and smallest next setup step instead of substituting toy results.

`native:doctor` summarizes committed native-evidence artifacts and remaining
coverage gaps without rerunning native benchmarks.

## Release Evidence

```sh
npm run release:evidence
npm run docs:evidence
```

`release:evidence` builds a caveated release-evidence index from committed
blocker, hygiene, native-evidence, privacy-mode, reconstruction-risk, and
baseline artifacts. It is a dashboard artifact only; it does not approve a
release, satisfy the release gate by itself, or create new benchmark evidence.

`docs:evidence` regenerates `docs/evidence-dashboard.md` from
`benchmark-artifacts/release-evidence/latest.json` so the human-readable
dashboard never has to be hand-synchronized. Run it after refreshing the
release-evidence artifact; `npm run validate` fails if the two have drifted.

Before tagging anything, use `RELEASE.md` and confirm the current hosted CI,
local validation, evidence artifacts, and caveats are all current.
