# Reviewer Quickstart

Use this route for diligence, grant, patent, or maintainer review when you need
to understand the current repository without accidentally upgrading the claims.

This guide is not release approval, production cryptography evidence, medical
or clinical validation, deployment evidence, a privacy proof, or a security
certification.

## Review Routes

| Review Need | Start With | Then Confirm |
| --- | --- | --- |
| First-pass repository orientation | `README.md`, `CHANGELOG.md`, and `docs/status-roadmap.md` | Check `VALIDATION.md` for the current portable gate and `docs/faq.md` for claim-boundary questions. |
| Evidence and release posture | `docs/evidence-guide.md`, `docs/evidence-dashboard.md`, and `docs/release-gate-matrix.md` | Confirm `docs/claim-evidence-ledger.md`, `benchmark-artifacts/release-evidence/latest.json`, and `benchmark-artifacts/native-evidence/latest.json` before treating an evidence gap as closed. |
| Local validation or reproducibility | `npm run validate` and `git diff --check` | Record any failed command with the exact command, error, and smallest next step in the relevant blocker artifact or validation note. |
| Sensitive security, raw-data, or private-payload concern | `SECURITY.md` | Keep raw data and private payloads out of public GitHub issues and route public support through `SUPPORT.md` or `.github/ISSUE_TEMPLATE/`. |
| Green CI but blocked merge | The release-validation PR's hosted `Portable validation` and `docs/operations-runbook.md` | Keep hosted check-rollup, GitHub Actions billing/account, and repository ruleset/admin policy blockers separate from local code or test failures. |

## First 15 Minutes

For a non-technical first pass only, read `docs/layperson-quickstart.md` and
`index.html` before this checklist. Return here when you need evidence posture
and reproducibility detail.

1. Read `README.md` for the thesis and public framing.
2. Read `CHANGELOG.md` for the current unreleased stack and caveats.
3. Read `docs/status-roadmap.md` for what is ready, what is blocked, and what
   still needs evidence.
4. Read `docs/faq.md` for common claim, evidence, raw-data, CI, release, and
   CC0 questions.
5. Read `VALIDATION.md` for the current portable local gate.

## Evidence Review

Use these files when checking evidence posture:

- `docs/evidence-guide.md` - evidence classes and claim discipline.
- `docs/evidence-dashboard.md` - human-readable release dashboard status.
- `docs/release-gate-matrix.md` - release command, artifact, caveat, and
  blocker matrix.
- `docs/claim-evidence-ledger.md` - weak-claim evidence posture.
- `benchmark-artifacts/release-evidence/latest.json` - release dashboard.
- `benchmark-artifacts/native-evidence/latest.json` - native-lane evidence and
  measurement gaps.

The release dashboard currently remains `releaseGateSatisfied: false`, and
artifact/lane metadata must preserve `productionClaim: false` where it applies.
Do not treat `privacyBoundary` or `cryptoInventory` metadata as a privacy proof,
security certification, or complete cryptographic inventory beyond the artifact
being reviewed.

## Local Check

Run the portable gate before trusting local edits:

```sh
npm run validate
git diff --check
```

This gate proves the portable Node tests, JSON parsing, local Markdown links,
and repository hygiene scan. It does not prove native OpenFHE or TFHE-rs
availability, production cryptography, clinical validity, deployment readiness,
privacy guarantees, or release approval.

## Routing Review Comments

Use these surfaces to route review findings without turning them into release
approval:

- `CONTRIBUTING.md` - evidence-first contribution rules and local validation
  expectations.
- `SECURITY.md` - sensitive reporting route for possible security issues,
  private payload exposure, or raw-data mishandling.
- `SUPPORT.md` - public support routing for issues, release blockers, and
  cleanup requests.
- `.github/ISSUE_TEMPLATE/` - structured issue intake that keeps raw data and
  private payloads out of GitHub.
- `.github/pull_request_template.md` - PR checklist for validation commands,
  release caveats, raw-data exclusions, and repository-policy routing.
- `docs/maintainer-checklist.md` - maintainer review route for evidence,
  support, security, contribution, and release-gate surfaces.
- `docs/operations-runbook.md` - routine hosted-check, artifact-refresh, and
  blocker-recording commands.

If a command, dependency, dataset, or hosted check cannot run, record the exact command
and error, plus the smallest next step, in the relevant issue, blocker artifact,
or validation note.
Keep GitHub Actions billing/account, hosted check-rollup, and repository
ruleset/admin policy blockers separate from local code or test failures.

## PR And Release Posture

Hosted `Portable validation` can be green while merge stays controlled by
repository ruleset/admin policy. Confirm the live head, check rollup, and merge
policy before treating the PR as ready:

```sh
gh pr view "$RELEASE_VALIDATION_PR" --json headRefOid,mergeable,mergeStateStatus,statusCheckRollup
```

Do not tag a release or merge a release PR until the `RELEASE.md` gates are
satisfied and the user explicitly approves the final action.
