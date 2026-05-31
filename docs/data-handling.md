# Data Handling

Use this guide when adding datasets, generated evidence, or blocker reports.
The repository is a CC0 research-alpha package, so the public tree should stay
readable, reproducible, and free of raw private material.

Nothing here authorizes production cryptography, medical, clinical,
deployment, side-channel, identity-protection, or stable-performance claims.

## Data Routes

Use this table before adding or refreshing any data-adjacent file. It keeps raw
material outside git and routes derived evidence, blockers, and hygiene records
to the correct public surfaces.

| Data-Adjacent Need | Start With | Keep Out Of Git |
| --- | --- | --- |
| Raw dataset, signal, partner, or private payload | Local scratch storage outside the repository and `SECURITY.md` when exposure is suspected. | Raw EEG rows, neural recordings, sensor logs, partner material, secrets, and private payloads. |
| Derived plaintext baseline artifact | `benchmark-artifacts/plaintext-baselines/` and the matching artifact command. | Raw event files, raw dataset directory contents, private labels, or unsupported accuracy claims. |
| Native input contract or comparison artifact | `benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/` and `benchmark-artifacts/comparisons/`. | Raw EEG rows, private feature vectors, proprietary adapters, or production cryptography claims. |
| Unavailable dataset, dependency, hosted CI, or release-machine input | Structured blocker artifacts plus `docs/troubleshooting.md` and `docs/operations-runbook.md`. | Synthetic substitutes presented as real evidence, stale benchmark numbers, or hidden local-only fixes. |
| Repository hygiene evidence | `benchmark-artifacts/repo-hygiene/latest.json` and `prototype/scripts/placeholder-scan.mjs`. | Secret values, private payload excerpts, raw data samples, or security-certification claims. |

## Storage Boundary

| Surface | Rule |
| --- | --- |
| `.gitattributes` | Keeps source, docs, JSON, YAML, native code, and HTML normalized with LF line endings while marking packaged binary artifacts as binary. |
| `.gitignore` | Keeps local caches, environment files, logs, coverage output, build outputs, Node dependencies, native build targets, and accidental local dataset folders out of git. |
| `prototype/scripts/placeholder-scan.mjs` | Scans tracked source for placeholder text, token-shaped secrets, and raw-data path mistakes during `npm run validate`. |
| `benchmark-artifacts/repo-hygiene/latest.json` | Records the latest redacted source-hygiene result without storing secret values or raw dataset rows. |

Raw EEG, neural, sensor, partner, proprietary, private, or user-identifying
payloads stay outside git. Local dataset folders such as `Downloads/` or
`N-MNIST/` are ignored as scratch paths, not as evidence destinations. If a
future adapter needs proprietary data, trained weights, deployment glue, or
partner material, keep it outside this public reference repository.

## Allowed Derived Artifacts

Committed artifacts should be derived evidence, structured blockers, or
dashboards that preserve provenance and caveats.

| Surface | What It May Contain | Boundary |
| --- | --- | --- |
| `benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json` | Sampled real public N-MNIST plaintext metrics, provenance, and compression curves. | No raw event files or dataset directory contents. |
| `benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json` | UCI EEG Eye State plaintext baseline metrics and provenance. | No raw EEG rows. |
| `benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/` | Derived BFVrns and CKKS sparse input contracts for native lanes. | Derived single-window contracts only. |
| `benchmark-artifacts/repo-hygiene/latest.json` | Redacted scan evidence and blocked-pattern summary. | Hygiene evidence, not benchmark or security proof. |

When artifact metadata includes `privacyBoundary`, `cryptoInventory`, or
`productionClaim: false`, preserve those fields. Do not edit a generated
artifact to make a claim look stronger than the command output supports.

## Blocker Reports

If a dataset, OpenFHE setup, TFHE-rs setup, hosted CI account state, or release
machine dependency is unavailable, record the exact command, error, and
smallest next step in a validation note or structured blocker artifact. Do not
substitute synthetic, toy, or stale numbers for missing real evidence.

CI and account blockers belong in `benchmark-artifacts/ci-blockers/`.
Native-lane blockers belong under the relevant `benchmark-artifacts/comparisons/`
or `benchmark-artifacts/native-evidence/` surface. Dataset blockers belong near
the matching plaintext-baseline artifact group.

## Review Checklist

Before committing data-adjacent changes:

- Confirm raw datasets and private payloads are not staged.
- Run `npm run validate`.
- Run `git diff --check`.
- Confirm `benchmark-artifacts/repo-hygiene/latest.json` or the current
  validation output reports a passing hygiene scan when hygiene evidence is in
  scope.
- Confirm claim text still says research alpha and does not imply production,
  medical, clinical, deployment, privacy-proof, or security-certified status.
