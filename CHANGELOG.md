# Changelog

This changelog tracks repository, evidence, and documentation changes that
matter for reviewers. It does not mark a release complete and does not upgrade
NeuroFHE Relay into production cryptography, medical software, clinical
validation, deployment evidence, a privacy proof, or a security certification.

## Unreleased

Release target: `v0.1.0-research-alpha`.

### Added

- Restored the release-validation stack on PR #23 with automatic
  `Portable validation` checks for push and pull request events.
- Added repository readability maps for docs, prototype sources, native lanes,
  patent materials, presentation outputs, contributor workflow, policy
  boundaries, status, terminology, testing strategy, dependency posture, data
  handling, claim evidence, and release gate commands.
- Added `docs/data-handling.md` for raw-data, derived-artifact, blocker, and
  hygiene boundaries.
- Added `docs/claim-evidence-ledger.md` for weak-claim evidence posture.
- Added `docs/evidence-dashboard.md` for human-readable release-evidence
  dashboard status and caveats.
- Added `docs/faq.md` for common reader questions about claims, evidence,
  raw-data handling, hosted CI, release posture, and CC0 use.
- Added `docs/release-gate-matrix.md` for release command, artifact, caveat,
  and blocker review.
- Added `docs/operations-runbook.md` for routine PR checks, hosted check-rollup
  review, evidence refresh commands, and blocker recording.
- Added `docs/troubleshooting.md` for common local npm, hosted-CI, native-lane,
  dataset, and release-gate blockers.
- Added `CODE_OF_CONDUCT.md` for public collaboration expectations and
  reporting boundaries.
- Added `MAINTAINERS.md` for current maintainer routing, review ownership, and
  release authority boundaries.
- Added a guarded, role-based root README first path for reviewers,
  contributors, maintainers, and evidence reviewers.
- Added a guarded, concise root README repository layout that defers the
  exhaustive inventory to `PACKAGE_MANIFEST.md`.
- Added a guarded, concise root README quick-command table that defers detailed
  native and release commands to `docs/command-reference.md` and `RELEASE.md`.
- Added `SUPPORT.md` and a support-routing guard for public issues, sensitive
  reports, release blockers, and cleanup requests.
- Added `.github/CODEOWNERS` and a review-ownership guard for repository
  change routing.
- Added `.github/dependabot.yml` and a dependency-update guard for weekly
  GitHub Actions and npm maintenance routing.
- Added guarded documentation coverage in the Node test suite so the repository
  maps stay synchronized with tracked surfaces.
- Added repository-guide coverage so the first map stays aligned with current
  reader, maintainer, GitHub, CI, release-gate, and ruleset-policy surfaces.
- Added prototype README coverage so the runnable-code entrypoint stays concise
  and routes detailed command/module inventory to the maintained maps.
- Added development guide coverage so setup, native-lane, evidence-artifact,
  hosted-CI, release-gate, and repository-policy boundaries stay visible.

### Changed

- `VALIDATION.md` now records the current portable gate as 119 tests, Markdown
  link scan over 75 files, JSON parsing, and repository hygiene scan.
- `RELEASE.md` now points release reviewers to the command-by-command gate
  matrix before tagging.

### Caveats

- The current release dashboard remains `releaseGateSatisfied: false`.
- Artifact and lane metadata must preserve `productionClaim: false`.
- PR #23 remains blocked by repository ruleset/admin policy, not code or hosted
  CI failure.
- No release tag has been created.
