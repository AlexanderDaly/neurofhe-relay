# Repository Guide

NeuroFHE Relay is a CC0 research-alpha package. It combines concept briefs,
portable prototype code, committed evidence artifacts, and ENER patent drafting
materials. Use this guide as the first map before changing claims, benchmarks,
or release evidence.

Nothing in this repository is production cryptography, medical software,
clinical validation, deployment evidence, or a security certification.

## Start Here

- `README.md` - project thesis, public framing, demos, and caveats.
- `CHANGELOG.md` - unreleased review history and release-caveat summary.
- `docs/README.md` - documentation index for reader and contributor paths.
- `docs/briefing-sequence.md` - reading order for the root `01-` through `12-`
  public briefing files.
- `docs/glossary.md` - definitions for recurring claim, artifact, release,
  gateway, and native-lane terms.
- `docs/testing-strategy.md` - portable validation, hosted CI, docs-link,
  hygiene, and guard-family map.
- `docs/dependency-matrix.md` - portable, hosted, native-lane, dataset, and
  release dependency map.
- `docs/data-handling.md` - raw-data, derived-artifact, blocker, and hygiene
  boundary map.
- `docs/claim-evidence-ledger.md` - weak-claim, evidence, caveat, and next-step
  ledger.
- `docs/release-gate-matrix.md` - minimum release command, artifact, caveat,
  and blocker matrix.
- `docs/status-roadmap.md` - current review state, remaining release blockers,
  and next evidence-work queue.
- `docs/policy-boundary.md` - map of the license, security, contribution,
  validation, and release files that define the claim boundary.
- `docs/prototype-map.md` - code navigation map for prototype entrypoints,
  library modules, native lanes, and support notes.
- `docs/patent-package-map.md` - navigation map for ENER patent, briefing, and
  Mermaid diagram sources.
- `docs/presentation-outputs.md` - map of generated presentation exports kept
  for packaged review.
- `docs/contributor-workflow.md` - map of issue forms, PR template, and hosted
  CI workflow surfaces.
- `docs/architecture-decisions.md` - accepted repository boundary decisions.
- `docs/reviewer-quickstart.md` - diligence and evidence-review entry path.
- `docs/developer-quickstart.md` - compact local validation path for
  contributors.
- `docs/command-reference.md` - grouped npm command reference for validation,
  demos, benchmarks, native lanes, and release evidence.
- `docs/evidence-guide.md` - short map for reading committed evidence without
  upgrading research-alpha claims.
- `docs/maintainer-checklist.md` - merge, artifact, and release-review
  checklist for maintainers.
- `DEVELOPMENT.md` - local setup, portable validation, native FHE commands, and
  artifact policy.
- `CONTRIBUTING.md` - evidence-first contribution rules and PR expectations.
- `VALIDATION.md` - recorded local validation commands and caveated results.
- `RELEASE.md` - research-alpha gate and the order of evidence required before
  tagging.
- `benchmark-artifacts/README.md` - guide to committed benchmark, blocker,
  hygiene, native-evidence, reconstruction-risk, and release-index artifacts.
- `.github/ISSUE_TEMPLATE/` - guided forms for reproducible bugs, evidence
  gaps, and repository-cleanup requests.
- `.github/pull_request_template.md` - PR checklist for validation and
  evidence-boundary notes.
- `.github/workflows/ci.yml` - hosted portable validation workflow.

## Top-Level Package

The numbered Markdown files are the public briefing sequence:

- `docs/briefing-sequence.md` lists the full recommended reading order.
- `01-one-pager.md` through `04-demo-roadmap.md` cover the executive framing,
  pitch narrative, architecture, and prototype path.
- `05-risk-register.md` and `06-evidence-and-sources.md` collect risk and
  source-backed research notes.
- `07-post-quantum-cryptography-track.md` through
  `12-discreet-spike-sorting-proof.md` define the cryptographic direction,
  relay gateway pattern, native-performance boundary, visuals, and
  real-data-derived spike-sorting proof gate.

`PACKAGE_MANIFEST.md` is the file inventory for packaged review. `index.html`
is a self-contained browser briefing deck. `docs/presentation-outputs.md` maps
generated presentation exports under `outputs/`. `project-brief.json` is the
agent-readable metadata surface.

Use `docs/policy-boundary.md` before changing license, security, contribution,
validation, release, or public-claim language.
Use `docs/status-roadmap.md` when you need the current readiness picture before
deciding what to review or improve next.
Use `docs/glossary.md` when project vocabulary is unclear.
Use `docs/testing-strategy.md` before changing checks, CI, validation wording,
or repository-readability guards.
Use `docs/dependency-matrix.md` before changing runtime versions, native lanes,
dataset inputs, or hosted validation requirements.
Use `docs/data-handling.md` before adding raw-data-adjacent commands, derived
artifacts, blocker reports, or hygiene evidence.
Use `docs/claim-evidence-ledger.md` before strengthening public, patent,
investor, release, or standards-facing language.
Use `docs/release-gate-matrix.md` before rerunning or reviewing release-gate
commands.
Use `docs/reviewer-quickstart.md` when reviewing the repository from a
diligence, grant, patent, or maintainer perspective.
Use `docs/architecture-decisions.md` before changing repository boundaries,
license posture, raw-data policy, claim posture, or native/toy lane framing.

## Prototype Code

`prototype/` is the runnable contract harness. Keep Node.js as the portable
orchestration and validation layer. Treat native OpenFHE and TFHE-rs code as
comparison lanes that require local dependencies and explicit caveats.

Important prototype surfaces:

- `prototype/lib/` - event encoding, gateway policy, linear scoring, artifact
  publishing, real-data preprocessing, native-adapter manifests, and evidence
  indexing.
- `prototype/test/` - Node test suite for schema, boundary, artifact, CI, and
  validation behavior.
- `prototype/openfhe/` and `prototype/openfhe-ckks/` - native OpenFHE BFVrns and
  CKKS demo targets.
- `prototype/tfhe-rs/` - TFHE-rs sparse scoring and threshold comparison target.
- `prototype/scripts/placeholder-scan.mjs` - repository hygiene scanner for
  common unfinished text, secrets, and raw-data path mistakes.

## Evidence Artifacts

`benchmark-artifacts/` is intentionally committed derived evidence. Do not
commit raw neural, EEG, sensor, partner, or private datasets. New artifacts
should preserve provenance, `privacyBoundary`, `cryptoInventory`, and
`productionClaim: false` when those fields apply.

The most release-relevant artifact groups are:

- `ci-blockers/` - hosted CI blockers or green hosted-CI snapshots, kept
  separate from local code failures.
- `repo-hygiene/` - redacted source-hygiene scan evidence.
- `native-evidence/` - host/toolchain fingerprinting and native-lane coverage.
- `plaintext-baselines/` - real-data and fixture-derived plaintext evidence.
- `privacy-modes/` - sparse metadata versus padding overhead evidence.
- `reconstruction-risk/` - synthetic gateway reconstruction-risk probes.
- `release-evidence/` - index dashboard for the current caveated gate posture.

Release-evidence indexes do not create new benchmark evidence and do not approve
a release by themselves.

## Patent And Briefing Materials

`patent/` contains ENER provisional drafting material, drawings, claim seeds,
prior-art planning, filing checklists, and briefing notes. Keep these materials
aligned with the same public boundary as the rest of the repository: no
production cryptography claims, no medical-device claims, and no invented
benchmark results.

Use `docs/patent-package-map.md` to navigate the patent and briefing source
files.
Use `patent/briefing/ENER_weak_claims_evidence_gaps.md` when selecting the next
evidence gap to close.

## Change Discipline

Use the issue templates before broad cleanup work: bug reports should include
the exact command and observed result, validation gaps should preserve the
current caveat, and repository-cleanup requests should name the reader friction
they are trying to remove.

Before opening or updating a PR:

```sh
npm run ci
git diff --check
```

If a benchmark, dataset, native lane, privacy mode, or release index changes,
include the exact artifact command and commit only derived evidence or a
structured blocker report. If a native dependency cannot run, record the exact
command, error, and smallest next setup step instead of substituting toy or
unverified numbers.
