# Operations Runbook

Use this runbook for the routine maintainer loop on a release-validation PR:
confirm local evidence, confirm hosted checks, separate repository-policy
blockers from code failures, and leave a caveated record.

Use `MAINTAINERS.md` for the current maintainer route and release authority
boundary before treating a PR as merge-ready.

Nothing here authorizes a production cryptography, medical, clinical,
deployment, privacy-proof, side-channel, identity-protection, or
stable-performance claim.

## Situation Routes

| Situation | First Action | Record Or Escalate In |
| --- | --- | --- |
| PR checks need review | Run `gh pr checks <number>` and inspect `statusCheckRollup`. | PR comment or `VALIDATION.md` if the result affects release evidence. |
| Hosted CI is green but merge is blocked | Confirm `Portable validation` is green and classify the block as repository ruleset/admin policy. | `benchmark-artifacts/ci-blockers/latest.json` or release-validation notes. |
| Evidence artifacts need refresh | Run only the relevant artifact command intentionally. | Commit derived artifacts or dashboard updates with exact commands. |
| Command, dependency, dataset, or hosted check cannot run | Capture the exact command, error, and smallest next step. | Structured blocker artifact, `VALIDATION.md`, or `docs/troubleshooting.md`. |

## Routine PR Check

Start from a clean worktree on the PR branch.

```sh
npm run validate
git diff --check
```

Then confirm the hosted check rollup:

```sh
gh pr view <number> --json mergeable,mergeStateStatus,statusCheckRollup
gh pr checks <number>
```

The expected hosted job name is `Portable validation`. If that check is green
and the PR is still blocked, record whether the blocker is repository
ruleset/admin policy rather than a code or CI failure.

## Evidence Refresh Commands

Only refresh committed artifacts deliberately, and keep generated outputs
caveated:

```sh
npm run native:doctor -- --artifact
npm run release:evidence -- --artifact
npm run scan:hygiene -- --artifact
```

Use `benchmark-artifacts/ci-blockers/latest.json` for hosted-CI and merge-policy
state. Use `benchmark-artifacts/release-evidence/latest.json` for the caveated
release dashboard. Use `benchmark-artifacts/repo-hygiene/latest.json` before
claiming the repository hygiene scan is current.

Use `docs/troubleshooting.md` for common local npm, hosted-CI, native-lane,
dataset, and release-gate blocker routes before opening a new report.

## Blocker Recording Policy

If a command cannot run, record the exact command, error, and smallest next step
in a blocker artifact or in `VALIDATION.md`. Do not substitute toy,
synthetic, or stale benchmark numbers for unavailable native dependencies,
datasets, hosted CI, or repository-policy decisions.

The current release posture must remain explicit:

- `releaseGateSatisfied: false` until every `RELEASE.md` gate is satisfied.
- `productionClaim: false` wherever artifact metadata carries it.
- `privacyBoundary` and `cryptoInventory` must remain visible in relevant
  benchmark and evidence artifacts.

## Release Boundary

Use `RELEASE.md` and `docs/release-gate-matrix.md` before discussing a tag.
No release tag or merge of a release PR should happen unless the documented
gates are satisfied, repository ruleset/admin policy permits the action, and
the user explicitly approves the final action.
