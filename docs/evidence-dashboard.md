# Evidence Dashboard

This page is the human-readable companion to
`benchmark-artifacts/release-evidence/latest.json`. Use it for a fast review of
the current release-gate posture before opening the detailed JSON artifact,
`RELEASE.md`, or `docs/release-gate-matrix.md`.

It is not benchmark evidence by itself, not release approval, and not a
production cryptography, medical, clinical, deployment, side-channel,
anonymity, stable-performance, or privacy-proof claim.

## Current Gate Snapshot

Source artifact:

```text
benchmark-artifacts/release-evidence/latest.json
artifactId: release-evidence-with-green-ci-2026-05-29
generatedAt: 2026-05-29T04:40:53.000Z
subject.releaseGateSatisfied: false
subject.productionClaim: false
productionClaim: false
```

The artifact is a `neurofhe.releaseEvidenceArtifact.v1` wrapper. The indexed
release decision fields and per-check summaries live under `subject`, including
`subject.gateChecks`. Use those paths when comparing this page with the JSON.

## Gate Checks

| Check | Current Status | Review Note |
| --- | --- | --- |
| `hostedPortableCi` | pass | PR #23 has green hosted `Portable validation`; the remaining PR block is repository ruleset/admin policy, not a code or check-rollup failure. |
| `repositoryHygiene` | pass | `benchmark-artifacts/repo-hygiene/latest.json` reports a passing redacted source-hygiene scan. |
| `nativeMeasurementCoverage` | incomplete | OpenFHE BFVrns and CKKS still need fuller ciphertext-byte and RSS or peak-memory measurements before memory or stable-performance claims are defensible. |
| `metadataLeakage` | caveated | The current metric is a documented observable-category proxy, not formal leakage, anonymity, mutual-information, side-channel, or reconstruction-resistance evidence. |
| `reconstructionRisk` | caveated | Synthetic probes block raw-payload replay and active-value recovery while public-position linkage remains a residual risk. |
| `realNmnistBaseline` | pass | The sampled public N-MNIST plaintext baseline is present, but it is preprocessing/model evidence, not encrypted-compute or deployment evidence. |
| `tfheRealDataPath` | blocked | The TFHE-rs native target does not yet accept the EEG-derived sparse input contract; an integer/Boolean adapter or validated transformer remains the smallest next step. |
| `productionClaim` | pass | Indexed artifacts keep `productionClaim: false`. |

## Release Decision

The dashboard status is useful review evidence, but it does not satisfy the
release gate. Before tagging `v0.1.0-research-alpha`, use `RELEASE.md` and
`docs/release-gate-matrix.md` to rerun or review every minimum evidence command,
refresh artifacts or blocker reports, confirm hosted CI is still green, and get
explicit user approval for the final release action.

## Where To Drill Down

- `docs/evidence-guide.md` - evidence classes and claim discipline.
- `docs/claim-evidence-ledger.md` - weak-claim evidence posture and caveats.
- `docs/release-gate-matrix.md` - command-by-command release evidence map.
- `docs/status-roadmap.md` - current blockers and next evidence work.
- `benchmark-artifacts/README.md` - artifact directories, commands, and caveats.
