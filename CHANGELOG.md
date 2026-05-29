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
- Added data-route guidance for raw material, derived plaintext artifacts,
  native input contracts, blocker reports, and repository hygiene evidence.
- Added `docs/claim-evidence-ledger.md` for weak-claim evidence posture.
- Added `docs/evidence-dashboard.md` for human-readable release-evidence
  dashboard status and caveats.
- Added `docs/faq.md` for common reader questions about claims, evidence,
  raw-data handling, hosted CI, release posture, and CC0 use.
- Added FAQ question routes for production, medical/clinical, evidence,
  raw-data, and green-CI/blocked-merge questions.
- Added reviewer quickstart review routes for orientation, evidence, local
  validation, sensitive reports, and green-CI/blocked-merge review.
- Added `docs/release-gate-matrix.md` for release command, artifact, caveat,
  and blocker review.
- Added `docs/operations-runbook.md` for routine PR checks, hosted check-rollup
  review, evidence refresh commands, and blocker recording.
- Added `docs/troubleshooting.md` for common local npm, hosted-CI, native-lane,
  dataset, and release-gate blockers.
- Added troubleshooting routes for local validation, hosted CI, native
  dependencies, dataset paths, and release-gate confusion.
- Added troubleshooting blocker-record fields so failed commands capture exact
  command, error or check conclusion, smallest next step, evidence boundary,
  and affected artifact or PR.
- Added `CODE_OF_CONDUCT.md` for public collaboration expectations and
  reporting boundaries.
- Added `MAINTAINERS.md` for current maintainer routing, review ownership, and
  release authority boundaries.
- Added maintainer decision routes for ordinary review, evidence artifacts,
  hosted-check/repository-policy blockers, release decisions, and sensitive
  report handling.
- Added a guarded, role-based root README first path for reviewers,
  contributors, maintainers, and evidence reviewers.
- Tightened the root README opening line so the front door presents NeuroFHE
  Relay as a CC0 research-alpha repository rather than a presentation package.
- Added a guarded root README current-status table for release target,
  portable validation, merge policy, release gate, and claim-boundary posture.
- Added a guarded, concise root README repository layout that defers the
  exhaustive inventory to `PACKAGE_MANIFEST.md`.
- Added a guarded, concise root README quick-command table that defers detailed
  native and release commands to `docs/command-reference.md` and `RELEASE.md`.
- Added dependency-route guidance for portable validation, hosted CI, native
  reproduction, dataset refreshes, and release dependency review.
- Added validation-route guidance for local checks, hosted PR rollups,
  documentation navigation, source hygiene, and native/release evidence review.
- Added architecture decision routes for license, claim, metadata, native-lane,
  raw-data, and hosted-CI/repository-policy boundary changes.
- Added policy-boundary routes for license, public-claim, contribution,
  security/raw-data, and release/validation posture changes.
- Added `SUPPORT.md` and a support-routing guard for public issues, sensitive
  reports, release blockers, and cleanup requests.
- Added a support-route pre-thread cue so support, evidence gaps, cleanup
  requests, sensitive reports, conduct concerns, and release blockers stay on
  the right public or private path.
- Added code-of-conduct report routing so public collaboration, sensitive
  conduct, security/raw-data, and claim-boundary concerns start in the right
  policy surface without upgrading project claims.
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
- Added prototype README route coverage so validation, demo, artifact, native,
  real-data, and release-evidence work start from compact command routes.
- Added development guide coverage so setup, native-lane, evidence-artifact,
  hosted-CI, release-gate, and repository-policy boundaries stay visible.
- Tightened development guide coverage so first validation, docs navigation,
  native FHE, real-data/artifact, and release-readiness work route through a
  compact table before command details.
- Added developer-quickstart change routes so docs, prototype, artifact,
  native, and release-policy work start with focused checks and evidence
  boundaries.
- Tightened development guide real-data coverage so the current real public
  N-MNIST plaintext baseline route stays visible alongside the structured
  blocker path for missing local datasets.
- Added pull-request-template coverage so validation commands, release caveats,
  raw-data boundaries, and repository-policy routing remain in every PR.
- Added pull-request-template change notes so docs, prototype/artifact, native,
  real-data, and release-policy changes prompt the right evidence and caveat
  details.
- Added issue-template coverage so incoming reports preserve evidence
  boundaries, release-gate posture, raw-data exclusions, and CI/ruleset routing.
- Added issue-template routing to troubleshooting, data-handling, support, and
  security surfaces so reports avoid sensitive payloads and missing blocker
  details.
- Added documentation-index concision coverage so `docs/README.md` stays a
  reader-facing map instead of becoming a validation transcript.
- Added documentation-index repository-baseline routing for CC0/license files,
  package manifest, GitHub workflow surfaces, local tooling pins, changelog,
  and validation posture.
- Tightened documentation-index coverage so `docs/README.md` starts with
  role-based routes for reviewers, contributors, evidence reviewers, and
  release or maintainer review.
- Tightened status-roadmap coverage so current hosted-CI, release-gate, and
  ruleset/admin merge posture is visible in an at-a-glance table.
- Added status-roadmap review routes so merge-readiness, release-gate,
  evidence-gap, next-slice, and claim-boundary questions start from the right
  controlling surfaces.
- Added evidence-guide coverage so artifact mechanics, claim discipline,
  release posture, and repository decisions route through a compact review
  table without upgrading claims.
- Tightened command-reference coverage so common validation, demo, release,
  native, and dataset jobs route through a compact command table.
- Tightened operations-runbook coverage so PR checks, green-CI/ruleset blocks,
  artifact refreshes, and failed commands route through a compact situation
  table.
- Tightened maintainer-checklist coverage so ordinary PR review, evidence
  updates, release review, and sensitive/raw-data-adjacent reports route
  through a compact review-mode table.
- Added maintainer pre-merge routes for local validation, hosted validation,
  raw-data/secret boundaries, claim boundaries, and repository-policy state.
- Tightened contributor-workflow coverage so bug reports, evidence gaps,
  cleanup requests, pull requests, and sensitive reports route through a
  compact contribution table.
- Added repository-tooling coverage so `.gitattributes`, `.gitignore`, and
  `.editorconfig` preserve line-ending and local-ignore boundaries.
- Expanded local ignore boundaries for env files, logs, coverage output, and
  accidental dataset/download scratch folders.
- Added security-policy coverage so sensitive reports preserve raw-data,
  claim-boundary, exact-command, and hygiene-scan-limit language.
- Tightened security-policy coverage so data exposure, claim-boundary, unsafe
  CLI/input, and release-posture reports route through a compact private/public
  reporting table.
- Added contributing-guide coverage so contributor entrypoints preserve
  evidence, data-handling, release-gate, and repository-policy routing.
- Tightened contributing-guide coverage so docs cleanup, prototype/artifact,
  native FHE, real-data, and release-readiness work route through a compact
  contribution table.
- Tightened contributing-guide PR boundaries so green validation does not imply
  merge, tag, or release-claim approval without the documented gate and
  explicit user approval.
- Added maintainer-checklist coverage so review routing stays aligned with the
  current evidence, policy, support, contributor, and GitHub-template surfaces.
- Expanded reviewer-quickstart coverage so diligence review routes through the
  current support, security, contribution, maintainer, issue, and PR surfaces.
- Tightened evidence-dashboard coverage so the human-readable gate snapshot
  names the release-evidence wrapper and `subject` JSON paths explicitly.
- Tightened package-manifest coverage so the manifest stays an inventory and
  routes commands, evidence artifacts, and release gates to maintained owners.
- Tightened package-manifest review coverage so first-read, validation,
  evidence, contribution, maintenance, patent, and briefing review paths are
  visible before the full inventory.
- Tightened package-manifest native-evidence coverage so stale OpenFHE
  dependency wording is rejected and current native artifact IDs plus
  measurement gaps stay visible.
- Tightened benchmark-artifact index coverage so release-evidence routing names
  the current real N-MNIST plaintext baseline and TFHE-rs real-data blocker
  paths while preserving `releaseGateSatisfied: false`.
- Tightened benchmark-artifact review coverage so release posture, native
  measurement, plaintext baseline, metadata/reconstruction, hosted-CI, and
  hygiene questions route through a compact artifact table.
- Added release-plan coverage so the no-tag gate, evidence-dashboard route,
  repository-policy merge path, and explicit approval boundary stay visible.
- Added plaintext-baseline note coverage so real-data evidence routes,
  raw-dataset boundaries, and plaintext-only caveats stay visible.
- Added TFHE-rs integration-note coverage so native evidence routes,
  real-data blockers, dependency posture, release-gate caveats, and stale
  OpenFHE dependency wording stay guarded.
- Added ENER weak-claims coverage so the patent briefing native-FHE evidence
  note reflects current OpenFHE/TFHE real-native-run artifacts while keeping
  native measurement gaps caveated.
- Added hosted-CI evidence coverage so a green PR check rollup is tracked as
  `hostedPortableCiSatisfied: true` without setting the overall
  `releaseGateSatisfied` release boundary to true.
- Added validation-history coverage so old PR #7 CI/account blocker evidence
  stays labeled as historical and does not confuse the current PR #23 state.
- Tightened repository-guide coverage so the first map routes readers by task
  before showing the detailed package inventory.
- Tightened repository-guide change discipline so cleanup work keeps
  blocker-report, no-merge, no-tag, and no-claim-upgrade boundaries visible.
- Added developer-quickstart coverage so common change types point to focused
  validation before the full local gate.
- Tightened development-guide release boundaries so green local and hosted
  validation still require explicit user approval and the guarded rule stays
  visible: do not merge, tag, or strengthen release-facing claims.
- Tightened support-policy coverage so public issue, private security,
  release-blocker, and cleanup routes are visible in a compact table.
- Tightened briefing-sequence coverage so external overview, architecture,
  evidence, native-performance, and patent/weak-claim readers start from a
  compact route table before the numbered brief list.
- Tightened patent-package-map coverage so provisional drafting, counsel/IP
  review, public briefing, evidence-gap, and diagram reuse paths are routed
  before the full source inventory.
- Tightened presentation-output coverage so packaged slide review,
  claim/caveat checks, evidence/release-readiness review, and export refreshes
  route through source docs before generated files.
- Tightened glossary coverage so claim-boundary, release-readiness, native
  measurement, privacy/metadata, and blocker terminology routes to controlling
  evidence surfaces before the term list.
- Added linear-algebra handoff coverage so sparse-score contract,
  operation-count, native-adapter, privacy-mode, and implementation-boundary
  review routes stay visible.

### Changed

- `VALIDATION.md` now records the current portable gate as 135 tests, Markdown
  link scan over 75 files, JSON parsing, and repository hygiene scan.
- `RELEASE.md` now points release reviewers to the command-by-command gate
  matrix before tagging.

### Caveats

- The current release dashboard remains `releaseGateSatisfied: false`.
- Artifact and lane metadata must preserve `productionClaim: false`.
- PR #23 remains blocked by repository ruleset/admin policy, not code or hosted
  CI failure.
- No release tag has been created.
