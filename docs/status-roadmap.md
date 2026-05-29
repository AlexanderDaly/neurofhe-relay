# Status And Roadmap

NeuroFHE Relay is organized as a CC0 research-alpha repository. This page gives
readers one current-status route before they inspect the detailed validation,
release, artifact, and evidence-gap records.

This roadmap is not release approval, production-readiness evidence,
cryptographic assurance, clinical validation, medical guidance, or security
certification. The authoritative gates remain the files and artifacts linked
below.

## Current Review State

- Release target: `v0.1.0-research-alpha`, governed by `RELEASE.md`.
- Current local portable gate: recorded in `VALIDATION.md`.
- Current review history: `CHANGELOG.md`.
- Hosted CI/check-rollup evidence: `benchmark-artifacts/ci-blockers/latest.json`.
- Release dashboard artifact: `benchmark-artifacts/release-evidence/latest.json`.
- Repository hygiene evidence: `benchmark-artifacts/repo-hygiene/latest.json`.
- Native-lane evidence and measurement gaps:
  `benchmark-artifacts/native-evidence/latest.json`.
- Patent and briefing evidence gaps:
  `patent/briefing/ENER_weak_claims_evidence_gaps.md`.
- Claim-to-evidence posture: `docs/claim-evidence-ledger.md`.
- Release command matrix: `docs/release-gate-matrix.md`.

## What Is Ready To Review

- Portable validation and Markdown link checking are part of `npm run validate`.
- Hosted `Portable validation` is green on the release-validation PR head.
- The release evidence dashboard indexes the current hosted CI, repository
  hygiene, native evidence, metadata-leakage, reconstruction-risk, real N-MNIST
  baseline, TFHE-rs real-data blocker, and `productionClaim: false` posture.
- The repository now has reader maps for docs, briefs, prototype code, native
  sources, patent materials, generated outputs, contributor workflow, policy
  boundaries, evidence artifacts, and maintainer checks.

## What Still Blocks Release

- PR merge remains controlled by repository ruleset/admin policy.
- `RELEASE.md` commands still need a final release-machine rerun before tagging.
- `docs/release-gate-matrix.md` should be used to track each command's
  artifact, caveat, and blocker posture during that rerun.
- `benchmark-artifacts/native-evidence/latest.json` still records incomplete
  ciphertext-byte and RSS or peak-memory measurement coverage for OpenFHE lanes.
- TFHE-rs real-data execution is still blocked until an integer/Boolean adapter
  or validated transformer exists for EEG-derived sparse contracts.
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
4. Add a TFHE-rs real-data adapter or validated EEG-contract transformer before
   claiming TFHE-rs real-data evidence.
5. Continue evidence work from
   `patent/briefing/ENER_weak_claims_evidence_gaps.md`, especially
   reconstruction and identity-linkage tests, metadata leakage metrics, and
   padded-sparse real-data overhead measurements.
6. Keep `productionClaim: false`, `privacyBoundary`, `cryptoInventory`, CC0
   framing, and bio-digital event intelligence caveats intact as the repository
   becomes easier to read.

## Where To Start By Role

- New reviewer: read `README.md`, then `docs/repository-guide.md`, then this
  file.
- Contributor: read `docs/developer-quickstart.md`,
  `docs/command-reference.md`, and `CONTRIBUTING.md`.
- Maintainer: use `docs/maintainer-checklist.md`, `RELEASE.md`, and
  `VALIDATION.md`.
- Evidence reviewer: start with `docs/evidence-guide.md`,
  `docs/claim-evidence-ledger.md`,
  `docs/release-gate-matrix.md`,
  `benchmark-artifacts/README.md`, and
  `benchmark-artifacts/release-evidence/latest.json`.
