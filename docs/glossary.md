# Glossary

This glossary explains recurring NeuroFHE Relay terms for readers who are
reviewing the repository, evidence artifacts, or release gate for the first
time. It does not upgrade any research-alpha, cryptographic, privacy, medical,
security, deployment, or performance claim.

## Glossary Routes

Use this table when a recurring term appears in a review, PR, artifact, or
briefing note and you need the controlling context.

| Reader Need | Start With | Then Confirm |
| --- | --- | --- |
| Claim-boundary wording | `productionClaim: false`, `bio-digital event intelligence`, and `local relay gateway` | `docs/policy-boundary.md`, `docs/faq.md`, and `README.md` before strengthening public language. |
| Release-readiness language | `release gate` and `release-evidence index` | `RELEASE.md`, `docs/release-gate-matrix.md`, and `docs/evidence-dashboard.md` before treating a gate as satisfied. |
| Native FHE or measurement wording | `native lane`, `single-window native run`, and `measurement gap` | `benchmark-artifacts/native-evidence/latest.json` and `benchmark-artifacts/README.md` before making performance claims. |
| Privacy and metadata wording | `privacyBoundary`, `metadata-leakage proxy`, `reconstruction-risk probe`, `padded sparse`, and `dense encrypted window` | `docs/evidence-guide.md` and `benchmark-artifacts/privacy-modes/padding-ablation/latest.json` before treating a proxy as proof. |
| Blocker or unavailable-evidence wording | `blocker artifact`, `repository hygiene scan`, and `hosted Portable validation` | `docs/troubleshooting.md` and `docs/operations-runbook.md` before classifying a failure. |

## Terms

- **bio-digital event intelligence** - the project framing for
  privacy-preserving event representation at the boundary between local signals
  and external compute. It means sensitive signals stay local while compact
  event features cross the boundary under explicit privacy and cryptographic
  controls.
- **privacyBoundary** - artifact metadata describing what remains local, what is
  exported, what is encrypted, and what residual metadata remains visible.
- **cryptoInventory** - artifact metadata listing the cryptographic scheme,
  implementation class, parameter posture, and caveats for a run or adapter.
- **productionClaim: false** - the repository's explicit marker that an
  artifact or workflow is research evidence only, not production cryptography or
  deployment approval.
- **release gate** - the checklist in `RELEASE.md` that must be satisfied
  before a research-alpha tag. Passing one command or one artifact does not
  satisfy the release gate by itself.
- **release-evidence index** - the dashboard artifact under
  `benchmark-artifacts/release-evidence/latest.json` that gathers current CI,
  hygiene, native evidence, privacy-mode, reconstruction-risk, real-data
  baseline, blocker, and `productionClaim: false` posture in one JSON surface.
  It is navigation evidence, not release approval.
- **native lane** - a real-library implementation path outside the toy
  JavaScript prototype, such as OpenFHE BFVrns, OpenFHE CKKS, or TFHE-rs. Native
  lanes need dependency-specific setup and stronger caveats than portable Node
  checks.
- **blocker artifact** - a structured JSON artifact that records an exact
  command, failure or unavailable dependency, and smallest next step when a
  benchmark, dataset, hosted CI run, or native lane cannot be completed.
- **plaintext baseline** - a non-encrypted baseline over public or fixture data,
  used to validate preprocessing, features, classifier shape, and caveats before
  making encrypted-compute comparisons.
- **metadata-leakage proxy** - a documented observable-category count used in
  privacy-mode artifacts to compare public sparse positions, padded sparse
  batches, and dense encrypted windows. It is not mutual information, anonymity,
  side-channel, or reconstruction-resistance proof.
- **reconstruction-risk probe** - a synthetic gateway test that checks whether
  raw payloads and active values are withheld from model-facing fields while
  keeping residual public-position linkage visible. It is not a formal privacy
  proof.
- **local relay gateway** - the local trust boundary that may inspect raw or
  semi-structured signals, validate and transform them, and export only approved
  event representations.
- **event window** - a bounded sparse representation of activity over a feature
  grid or time window. In this repository it is used for toy scoring, plaintext
  baselines, gateway demos, and native input contracts.
- **sorted event** - an event representation produced by the spatial spike
  sorter or imported as pre-sorted input, then validated before export.
- **padded sparse** - a sparse representation with cover slots or bucketed sizes
  to hide exact active-event counts at the cost of extra operations and payload
  slots.
- **dense encrypted window** - an encrypted representation that carries the full
  feature window instead of public active positions. It reduces some structural
  metadata leakage but increases encrypted operations.
- **single-window native run** - a native OpenFHE or TFHE-rs run over one
  derived input contract. It is useful evidence but not dataset-scale encrypted
  accuracy or stable performance evidence.
- **measurement gap** - a missing or partial measurement class, such as
  serialized ciphertext bytes or RSS/peak memory, recorded in
  `benchmark-artifacts/native-evidence/latest.json`.
- **repository hygiene scan** - the portable source scan that checks for
  placeholder text, token-shaped secrets, and raw-data path mistakes without
  committing private values.
- **hosted Portable validation** - the GitHub Actions CI job that runs the
  portable validation path on PR and push events. It does not run heavyweight
  native dependency sweeps.

## Safe Reading Rule

When a term appears in an artifact, treat the artifact schema, `RELEASE.md`,
`VALIDATION.md`, and `docs/policy-boundary.md` as the authority. If those
surfaces disagree with a summary, preserve the narrower and more caveated
interpretation until the evidence is refreshed.
