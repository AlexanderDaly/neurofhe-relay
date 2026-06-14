# Status And Roadmap

NeuroFHE Relay is organized as a CC0 research-alpha repository. This page gives
readers one current-status route before they inspect the detailed validation,
release, artifact, and evidence-gap records.

This roadmap is not release approval, production-readiness evidence,
cryptographic assurance, clinical validation, medical guidance, or security
certification. The authoritative gates remain the files and artifacts linked
below.

## Roadmap Review Routes

Use this table before changing the roadmap or answering status questions from
memory. Each route starts with the shortest human-readable surface, then points
to the artifact or boundary file that should confirm the claim.

| Review Need | Start With | Confirm Against |
| --- | --- | --- |
| Merge-readiness review | `docs/operations-runbook.md` and `VALIDATION.md` | Hosted `Portable validation`, `git diff --check`, and repository ruleset/admin policy status. |
| Release-gate review | `RELEASE.md` and `docs/release-gate-matrix.md` | `benchmark-artifacts/release-evidence/latest.json`, `docs/evidence-dashboard.md`, and `releaseGateSatisfied: false`. |
| Evidence-gap triage | `docs/claim-evidence-ledger.md` | `benchmark-artifacts/native-evidence/latest.json` and `patent/briefing/ENER_weak_claims_evidence_gaps.md`. |
| Next implementation slice | `docs/status-roadmap.md` | `docs/developer-quickstart.md`, `docs/command-reference.md`, and the focused test or artifact command for the touched area. |
| Claim or boundary check | `docs/architecture-decisions.md` | `productionClaim: false`, `privacyBoundary`, `cryptoInventory`, CC0 framing, and raw-data exclusions. |

## Current Review State

| Question | Current Answer | Authoritative Source |
| --- | --- | --- |
| What release is being prepared? | `v0.1.0-research-alpha` | `RELEASE.md` |
| Is the local portable gate current? | Yes; the latest recorded run is in `VALIDATION.md`. | `VALIDATION.md`, `CHANGELOG.md` |
| Is hosted portable CI green? | Yes on PR #23. | `benchmark-artifacts/ci-blockers/latest.json`, `docs/operations-runbook.md` |
| Is repository hygiene passing? | Yes in the latest redacted source scan. | `benchmark-artifacts/repo-hygiene/latest.json` |
| Is the release gate satisfied? | No; `releaseGateSatisfied: false`. | `benchmark-artifacts/release-evidence/latest.json`, `docs/evidence-dashboard.md`, `docs/release-gate-matrix.md` |
| What blocks merge? | Repository ruleset/admin policy. | `docs/operations-runbook.md`, `RELEASE.md` |
| What evidence still needs care? | Native measurement gaps, TFHE-rs real-data input, metadata/reconstruction caveats, and patent briefing gaps. | `benchmark-artifacts/native-evidence/latest.json`, `docs/claim-evidence-ledger.md`, `patent/briefing/ENER_weak_claims_evidence_gaps.md` |
| What repository decisions frame cleanup? | Keep the CC0 research-alpha boundary, raw-data exclusions, toy/native split, and evidence-backed claims. | `docs/architecture-decisions.md` |

## What Is Ready To Review

- Portable validation and Markdown link checking are part of `npm run validate`.
- Hosted `Portable validation` is green on the release-validation PR head.
- The release evidence dashboard indexes a committed hosted-CI evidence
  snapshot, repository hygiene, native evidence, metadata-leakage,
  reconstruction-risk, real N-MNIST baseline, TFHE-rs real-data signed-integer
  run, and `productionClaim: false` posture.
- `docs/evidence-dashboard.md` gives reviewers the same dashboard posture in a
  short human-readable form before they inspect the JSON artifact.
- Live PR head, hosted check rollup, and merge-policy status still need
  `gh pr view 23 --json headRefOid,mergeable,mergeStateStatus,statusCheckRollup`
  before merge or release review.
- The repository now has reader maps for docs, briefs, prototype/ scaffold code, native
  sources, patent materials, generated outputs, contributor workflow, policy
  boundaries, evidence artifacts, operations, and maintainer checks.

## What Still Blocks Release

- PR merge remains controlled by repository ruleset/admin policy.
- `RELEASE.md` commands still need a final release-machine rerun before tagging.
- `docs/release-gate-matrix.md` should be used to track each command's
  artifact, caveat, and blocker posture during that rerun.
- `benchmark-artifacts/native-evidence/latest.json` still records incomplete
  ciphertext-byte and RSS or peak-memory measurement coverage for OpenFHE lanes.
- TFHE-rs real-data evidence is a single EEG-derived window; multi-window runs
  plus ciphertext-size and memory sweeps remain before performance or accuracy
  claims.
- Metadata-leakage and reconstruction-risk artifacts remain caveated proxies
  and synthetic probes, not privacy proofs.
- No release tag should be created until the documented gates are satisfied and
  the user explicitly approves the final release action.

## Next Work Queue

1. Review and merge the green release-validation PR through the repository
   ruleset/admin path when approved.
2. Rerun the `RELEASE.md` minimum evidence commands on the release machine and
   refresh artifacts or blocker reports.
3. Close native measurement gaps with multi-window BFVrns and CKKS sweeps,
   serialized ciphertext-byte reporting, and RSS or peak-memory measurements.
4. Extend the TFHE-rs EEG real-data run across multiple windows and add
   ciphertext-size and memory sweeps before performance or accuracy claims.
5. Continue evidence work from
   `patent/briefing/ENER_weak_claims_evidence_gaps.md`, especially
   reconstruction and identity-linkage tests, metadata leakage metrics, and
   padded-sparse real-data overhead measurements.
6. Keep `productionClaim: false`, `privacyBoundary`, `cryptoInventory`, CC0
   framing, and bio-digital event intelligence caveats intact as the repository
   becomes easier to read.

## Where To Start By Role

- New reviewer: read `README.md`, then `docs/reviewer-quickstart.md`, then
  this file.
- Contributor: read `docs/developer-quickstart.md`,
  `docs/command-reference.md`, and `CONTRIBUTING.md`.
- Maintainer: use `docs/maintainer-checklist.md`,
  `docs/operations-runbook.md`, `RELEASE.md`, and `VALIDATION.md`.
- Evidence reviewer: start with `docs/evidence-guide.md`,
  `docs/evidence-dashboard.md`,
  `docs/reviewer-quickstart.md`,
  `docs/architecture-decisions.md`,
  `docs/claim-evidence-ledger.md`,
  `docs/release-gate-matrix.md`,
  `benchmark-artifacts/README.md`, and
  `benchmark-artifacts/release-evidence/latest.json`.
