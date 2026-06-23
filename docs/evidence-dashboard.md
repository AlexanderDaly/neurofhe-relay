# Evidence Dashboard

This page is the human-readable companion to
`benchmark-artifacts/release-evidence/latest.json`. Use it for a fast review of
the current release-gate posture before opening the detailed JSON artifact,
`RELEASE.md`, or `docs/release-gate-matrix.md`.

It is not benchmark evidence by itself, not release approval, and not a
production cryptography, medical, clinical, deployment, side-channel,
anonymity, stable-performance, or privacy-proof claim.

> Generated file. Do not edit by hand. Run `npm run docs:evidence` to regenerate
> it from `benchmark-artifacts/release-evidence/latest.json`.

## Committed Gate Snapshot

Source artifact:

```text
benchmark-artifacts/release-evidence/latest.json
artifactId: release-evidence-native-measured-2026-06-15
generatedAt: 2026-06-15T00:00:00.000Z
subject.releaseGateSatisfied: false
subject.productionClaim: false
productionClaim: false
```

The artifact is a `neurofhe.releaseEvidenceArtifact.v1` wrapper. The indexed
release decision fields and per-check summaries live under `subject`, including
`subject.gateChecks`. Use those paths when comparing this page with the JSON.
This is the latest committed release-evidence snapshot, not a substitute for
live PR status. Before merge or release review, confirm the current PR head,
hosted check rollup, and merge policy with:

```sh
gh pr view "$RELEASE_VALIDATION_PR" --json headRefOid,mergeable,mergeStateStatus,statusCheckRollup
```

## Plain English Summary

For non-technical readers. Traffic-light read of the **committed** snapshot
below; see Gate Checks and `docs/layperson-quickstart.md` for context.
This summary is not release approval or a privacy proof.

| Signal | Meaning |
| --- | --- |
| **Green** | Research scaffolding checks out on this snapshot (tests, hygiene, indexed artifacts present). |
| **Yellow** | Useful local evidence exists but carries explicit caveats (privacy proxies, single-window native runs). |
| **Red** | Not ready as a product release or formal proof (release gate, production crypto, clinical use). |

**Current read:**

- **Red → product release:** `releaseGateSatisfied: false` — no research-alpha tag implied by this dashboard.
- **Green → research package integrity:** 6 gate check(s) passed on this snapshot.
- **Yellow → evidence with caveats:** 2 check(s) passed with documented limitations (not privacy proofs).
- **Red → production cryptography / medical software:** not claimed; `productionClaim: false` on indexed artifacts.

## Gate Checks

| Check | Current Status | Review Note |
| --- | --- | --- |
| `hostedPortableCi` | pass | Automatic push and pull_request triggers remain restored on PR #23 at head 609b48c, with successful hosted Portable validation check runs in the status check rollup and current Node 24-ready action majors. |
| `repositoryHygiene` | pass | Repository hygiene scan reports pass. |
| `nativeMeasurementCoverage` | pass | Native evidence reports complete ciphertext-byte and RSS/peak-memory coverage. |
| `metadataLeakage` | caveated | Metadata leakage metric is a documented observable-category proxy, not a formal privacy proof. |
| `reconstructionRisk` | caveated | Synthetic probes block raw payload replay and active-value recovery while preserving public-position residual risk. |
| `realNmnistBaseline` | pass | Real public N-MNIST plaintext baseline artifact is present. |
| `tfheRealDataPath` | pass | TFHE-rs native lane ran the EEG-derived signed-integer contract; encrypted class scores and the encrypted threshold decision matched the plaintext baseline on a single window. |
| `productionClaim` | pass | Indexed artifacts keep productionClaim false. |

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
