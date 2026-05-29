# FAQ

This FAQ is a short claim-safety map for readers who need the boundary before
the longer evidence and release documents.

## Is NeuroFHE Relay production cryptography?

No. The repository is a research-alpha package: not production cryptography.
The runnable JavaScript path uses toy additive arithmetic to
demonstrate a sparse linear scoring contract, not a reviewed FHE deployment.
Native OpenFHE and TFHE-rs lanes exist as evidence and blocker surfaces, and
every lane must preserve `productionClaim: false`.

Use `RELEASE.md`, `docs/evidence-dashboard.md`, and
`benchmark-artifacts/README.md` before turning any artifact into a public claim.

## Is this medical or diagnostic software?

No. The current package is not medical, not diagnostic, and not clinical
validation. The bio-digital event intelligence boundary language means raw
signals stay local by default, compact event features cross only after explicit
gateway policy, and no treatment, diagnosis, surveillance, or external-control
claim is made.

## What does the runnable demo prove?

The portable demo proves the repository contract shape: `privacyBoundary`,
`cryptoInventory`, event-window validation, sparse scoring, gateway export
policy, and artifact generation. It does not prove production performance,
side-channel resistance, identity safety, regulated medical utility, or
deployment readiness.

## What evidence is real today?

Current committed evidence includes synthetic sparse-score artifacts, real UCI
EEG Eye State plaintext preprocessing artifacts, a sampled real N-MNIST
plaintext baseline, metadata-padding ablations, reconstruction-risk synthetic
probes, repository hygiene scans, hosted CI snapshots, and native-lane
artifacts or blocker reports.

The real N-MNIST artifact is plaintext preprocessing/model evidence only. It
is not encrypted-compute evidence, clinical evidence, or deployment evidence.

## Where do raw datasets and private payloads go?

Raw datasets, private payloads, proprietary adapters, trained weights, and
deployment code stay outside this public repository. Committed artifacts may
include derived metrics, caveats, provenance, and blocker reports, but not raw
event files, private signal payloads, or secret values. Use
`docs/data-handling.md` and `docs/troubleshooting.md` when a dataset command
cannot run.

## Why can a PR be green but still blocked?

PR #23 has green hosted `Portable validation` checks, but it can still show a
blocked merge state when the default-branch repository ruleset/admin policy
requires a maintainer action. That is different from a CI/check-rollup failure.
The release dashboard keeps `releaseGateSatisfied: false` until the documented
gate is satisfied and a maintainer-approved merge and release path is complete.

## Can I use this project freely?

Yes. The package is released under CC0, with a plain-English public-domain
notice in `PUBLIC_DOMAIN_NOTICE.md`. The free-use posture does not upgrade the
technical evidence: users still need their own security, privacy, medical,
regulatory, deployment, and license review before using derived work in any
real system.

## Where should I start?

- Reviewers: `docs/reviewer-quickstart.md`, then `docs/evidence-dashboard.md`.
- Contributors: `docs/developer-quickstart.md`, then `docs/troubleshooting.md`.
- Maintainers: `MAINTAINERS.md`, then `docs/maintainer-checklist.md`.
- Release reviewers: `RELEASE.md`, then `docs/release-gate-matrix.md`.
