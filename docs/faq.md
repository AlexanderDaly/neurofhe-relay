# FAQ

This FAQ is a short claim-safety map for readers who need the boundary before
the longer evidence and release documents.

## Question Routes

Use this table when you know the kind of question you have and need the answer
plus the next evidence surface.

| Reader Question | Start With | Then Use |
| --- | --- | --- |
| Non-technical overview | "I just want to understand the idea." | `docs/layperson-quickstart.md`, `index.html`, and `01-one-pager.md`. |
| Demo JSON output | "What does npm run demo print?" | `docs/what-the-demo-shows.md` and `docs/layperson-quickstart.md`. |
| Production cryptography or deployment readiness | "Is NeuroFHE Relay production cryptography?" | `RELEASE.md`, `docs/evidence-dashboard.md`, and `benchmark-artifacts/README.md`. |
| Medical, diagnostic, or clinical status | "Is this medical or diagnostic software?" | `README.md`, `docs/policy-boundary.md`, and `docs/architecture-decisions.md`. |
| Evidence strength and real-data artifacts | "What evidence is real today?" | `docs/evidence-guide.md`, `docs/claim-evidence-ledger.md`, and `benchmark-artifacts/README.md`. |
| Raw data, private payloads, or dataset storage | "Where do raw datasets and private payloads go?" | `docs/data-handling.md`, `SECURITY.md`, and `docs/troubleshooting.md`. |
| Green CI but blocked merge state | "Why can a PR be green but still blocked?" | `docs/operations-runbook.md`, `VALIDATION.md`, and `RELEASE.md`. |

## I just want to understand the idea — where do I start?

Read `docs/layperson-quickstart.md` first. It uses a plain-English bouncer
analogy, states what the project is not, and links to the visual briefing deck
(`index.html`) without requiring commands or JSON literacy.

## Is this reading my thoughts?

No. The phrase "encrypted thoughts" in this repository is an **architecture
metaphor**: raw neural-like streams stay local by default, selected compact
event features may be encrypted for external compute, and only authorized
parties decrypt the result. It is not literal mind reading, intent decoding, or
a claim that thoughts are extracted and sent to the cloud.

## Is this like Signal or WhatsApp encryption?

Only at a very high level. Messaging apps protect messages in transit and at
rest. NeuroFHE Relay explores **compute on encrypted compact event features**
after local preprocessing — a different problem. The current package is
research-alpha toy and native comparison lanes, not production end-to-end
encryption for chat or calls.

## Why combine neuromorphic sparsity and homomorphic encryption?

Neuromorphic and event-driven representations turn continuous streams into
**sparse, small activity summaries**. Homomorphic encryption is expensive; its
cost tracks circuit size and operation count. The project hypothesis is that
sparse event features make encrypted inference more practical than encrypting
full dense sensor frames — but that hypothesis still needs measured evidence,
not marketing language.

## What has been proven vs. what is still planned?

**Demonstrated today (research-alpha, caveated):** portable contract demos,
gateway policy scaffold, plaintext baselines on public datasets, synthetic and
some native encrypted scoring artifacts, and honest blocker reports when
dependencies are missing.

**Not proven today:** production cryptography, formal privacy proofs, clinical
utility, stable multi-window performance at scale, or release approval
(`releaseGateSatisfied: false`).

See `docs/evidence-dashboard.md` (Plain English Summary) and
`docs/claim-evidence-ledger.md` for detail.

## Who is this for right now?

Researchers, reviewers, contributors, and maintainers evaluating a
privacy-preserving event-intelligence architecture. It is **not** aimed at
patients, consumers buying a product, or clinical deployment without separate
validation and regulatory review.

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

A release-validation PR can have green hosted `Portable validation` checks but
still show a blocked merge state when the default-branch
repository ruleset/admin policy requires a maintainer action. That is different
from a CI/check-rollup failure. The release dashboard keeps
`releaseGateSatisfied: false` until the documented gate is satisfied and a
maintainer-approved merge and release path is complete.

## Can I use this project freely?

Yes. The package is released under CC0, with a plain-English public-domain
notice in `PUBLIC_DOMAIN_NOTICE.md`. The free-use posture does not upgrade the
technical evidence: users still need their own security, privacy, medical,
regulatory, deployment, and license review before using derived work in any
real system.

## Where should I start?

- Curious readers: `docs/layperson-quickstart.md`, then `docs/faq.md` and
  `index.html`.
- Reviewers: `docs/reviewer-quickstart.md`, then `docs/evidence-dashboard.md`.
- Contributors: `docs/developer-quickstart.md`, then `docs/troubleshooting.md`.
- Maintainers: `MAINTAINERS.md`, then `docs/maintainer-checklist.md`.
- Release reviewers: `RELEASE.md`, then `docs/release-gate-matrix.md`.
