# Maintainers

This file names the current public maintainer route and the authority boundary
for review, evidence, merge, and release decisions.

## Current Maintainer

- `@AlexanderDaly` - current public maintainer and review owner.

Review ownership is routed in `.github/CODEOWNERS`. Operational review should
use `docs/maintainer-checklist.md`, `docs/operations-runbook.md`, and
`RELEASE.md` before merging, refreshing artifacts, or preparing release review.

## Maintainer Routes

Use this table before treating a maintainer review as approval. It keeps routine
review, evidence work, hosted-check state, release authority, and sensitive
reports on their proper surfaces.

| Decision Or Review Need | Start With | Boundary |
| --- | --- | --- |
| Ordinary code or documentation review | `.github/CODEOWNERS` and `docs/maintainer-checklist.md`. | Review ownership is not release approval. |
| Evidence artifact or benchmark review | `docs/evidence-dashboard.md`, `docs/evidence-guide.md`, and `benchmark-artifacts/README.md`. | Preserve provenance, caveats, and `productionClaim: false`. |
| Hosted CI or repository-policy blocker review | `docs/operations-runbook.md`, `VALIDATION.md`, and PR check-rollup evidence. | Keep CI/check-rollup failures separate from repository ruleset/admin policy. |
| Release merge or tag decision | `RELEASE.md` and `docs/release-gate-matrix.md`. | Requires satisfied gates, green hosted validation, allowed merge policy, and explicit user approval. |
| Sensitive security, raw-data, or conduct concern | `SECURITY.md`, `SUPPORT.md`, and `CODE_OF_CONDUCT.md`. | Do not put secrets, private payloads, raw datasets, or sensitive reports in public threads. |

## Maintainer Responsibilities

- Keep CC0/public-domain framing intact unless the project posture is
  deliberately changed and reviewed.
- Preserve `productionClaim: false`, `privacyBoundary`, `cryptoInventory`,
  provenance, caveats, and rerun commands in evidence artifacts.
- Keep `releaseGateSatisfied: false` visible until the documented release gate
  is genuinely satisfied.
- Separate repository ruleset/admin policy blockers from code, hosted-CI,
  dataset, and native-dependency failures.
- Require exact command, error, and smallest next step notes for blockers.
- Do not commit raw datasets, raw signals, secrets, private payloads,
  proprietary material, or unsupported benchmark numbers.

## Merge And Release Boundary

The maintainer route does not by itself authorize a merge, release, production
claim, cryptographic claim, medical claim, deployment claim, or stable
performance claim.

There should be no release tag and no release PR merge unless the `RELEASE.md`
gates are satisfied, hosted `Portable validation` is green, repository
ruleset/admin policy permits the action, and the user gives explicit user approval
for that final action.
