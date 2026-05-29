# Maintainers

This file names the current public maintainer route and the authority boundary
for review, evidence, merge, and release decisions.

## Current Maintainer

- `@AlexanderDaly` - current public maintainer and review owner.

Review ownership is routed in `.github/CODEOWNERS`. Operational review should
use `docs/maintainer-checklist.md`, `docs/operations-runbook.md`, and
`RELEASE.md` before merging, refreshing artifacts, or preparing release review.

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
