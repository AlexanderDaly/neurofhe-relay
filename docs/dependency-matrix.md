# Dependency Matrix

NeuroFHE Relay separates portable repository checks from optional native FHE
lanes, public datasets kept outside git, and hosted CI. This matrix gives
contributors and reviewers a compact setup map without turning local evidence
into deployment or production claims.

## Dependency Routes

Use this table before changing setup docs, tool versions, native-lane notes, or
dataset commands. It keeps each dependency question tied to the evidence surface
that can answer it.

| Need | Start With | Do Not Treat As |
| --- | --- | --- |
| Portable local validation | `.node-version`, `.nvmrc`, `package.json`, and `VALIDATION.md`. | Native OpenFHE/TFHE-rs availability, release approval, or production readiness. |
| Hosted CI check-rollup | `.github/workflows/ci.yml`, `docs/operations-runbook.md`, and PR check evidence. | Repository ruleset/admin policy approval or release-gate satisfaction. |
| Native OpenFHE or TFHE-rs reproduction | `benchmark-artifacts/native-evidence/latest.json`, `prototype/openfhe/`, `prototype/openfhe-ckks/`, and `prototype/tfhe-rs/`. | Stable performance, side-channel assurance, or complete ciphertext/RSS coverage. |
| Public dataset or real-data baseline refresh | `docs/data-handling.md` and committed derived plaintext baseline artifacts. | Permission to commit raw datasets, raw signal rows, or private payloads. |
| Release dependency review | `RELEASE.md`, `docs/release-gate-matrix.md`, and `docs/status-roadmap.md`. | A release tag, merge approval, or `releaseGateSatisfied: true`. |

## Portable Repository Checks

| Surface | Role | Required For |
| --- | --- | --- |
| `.node-version` | Preferred Node.js version for local tool selection. | Local parity with hosted validation. |
| `.nvmrc` | Node version hint for `nvm` users. | Local parity with hosted validation. |
| `package.json` | Defines `npm run validate`, `npm test`, docs checks, hygiene scan, demos, and artifact commands. | Portable local work and CI. |
| `.github/dependabot.yml` | Weekly dependency update routing for GitHub Actions and npm metadata. | Maintenance PR prompts; not release evidence by themselves. |
| `prototype/test/prototype.test.mjs` | Node test suite for prototype contracts, artifacts, docs guards, CI checks, and caveats. | `npm test` and `npm run validate`. |
| `prototype/scripts/check-docs.mjs` | Local Markdown link checker. | `npm run check:docs` and `npm run validate`. |
| `prototype/scripts/placeholder-scan.mjs` | Source hygiene scan for placeholders, token-shaped secrets, and raw-data path mistakes. | `npm run validate`. |

These checks are intended to run without native OpenFHE or TFHE-rs dependencies.

## Hosted CI

| Surface | Role | Caveat |
| --- | --- | --- |
| `.github/workflows/ci.yml` | GitHub Actions `Portable validation` workflow for push, pull request, and manual dispatch events. | Hosted CI does not prove native dependency availability or release approval. |

Hosted CI should match the portable gate closely. A green hosted check-rollup is
necessary review evidence, but the repository ruleset/admin merge path and
`RELEASE.md` gate still control release readiness.

## Native Lanes

| Surface | Role | Dependency Posture |
| --- | --- | --- |
| `prototype/openfhe/` | OpenFHE BFVrns native comparison lane. | Requires local OpenFHE setup and release-machine review for stronger evidence. |
| `prototype/openfhe-ckks/` | OpenFHE CKKS approximate-real native comparison lane. | Requires local OpenFHE setup and release-machine review for stronger evidence. |
| `prototype/tfhe-rs/` | TFHE-rs integer/Boolean comparison lane. | Requires Rust/Cargo and TFHE-rs build support. |
| `benchmark-artifacts/native-evidence/latest.json` | Current native evidence manifest and measurement gap index. | Evidence dashboard only; it records gaps rather than filling them. |

Native lanes may emit real-library evidence when dependencies are available. If
a native dependency cannot run, record the exact command, error, and smallest
next step in a blocker artifact instead of substituting toy numbers.

## Dataset Inputs

| Surface | Role | Storage Rule |
| --- | --- | --- |
| `benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json` | Derived sampled public N-MNIST plaintext baseline artifact. | Raw N-MNIST `Train/` and `Test/` directories stay outside git. |
| `benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json` | Derived UCI EEG Eye State plaintext baseline artifact. | Raw fetched data is not committed. |
| `benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/` | Derived OpenFHE input contracts for BFVrns and CKKS native lanes. | Derived contracts only; no raw EEG rows. |

Dataset artifacts are preprocessing and evidence records, not production,
medical, clinical, or encrypted-compute claims unless the artifact and release
gate explicitly support that narrower statement.

## Release Review Dependencies

Use `RELEASE.md` for the release command sequence, `VALIDATION.md` for recorded
outputs, `docs/testing-strategy.md` for the gate model,
`docs/data-handling.md` for raw-data and derived-artifact boundaries, and
`docs/status-roadmap.md` for the current blocker and next-work map.

Before tagging, confirm the portable gate, hosted CI, native evidence or
blocker artifacts, repository hygiene artifact, and release-evidence index are
fresh for the release candidate.

## Claim Boundary

Dependency availability is not a claim by itself. Keep `productionClaim: false`,
`privacyBoundary`, `cryptoInventory`, provenance, and caveats intact when a
dependency, dataset, native lane, or artifact changes.
