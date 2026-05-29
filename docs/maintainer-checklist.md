# Maintainer Checklist

Use this checklist when preparing a PR for review, updating committed evidence,
or considering a research-alpha release. It consolidates the routine checks from
`MAINTAINERS.md`, `CONTRIBUTING.md`, `DEVELOPMENT.md`, `RELEASE.md`, and
`docs/evidence-guide.md`.

Nothing here authorizes a production cryptography, medical, clinical,
surveillance, deployment, side-channel, identity-protection, or
stable-performance claim.

## Review Modes

| Review Mode | Start With | Do Not Proceed Until |
| --- | --- | --- |
| Ordinary PR review | `.github/pull_request_template.md`, `.github/CODEOWNERS`, and `docs/operations-runbook.md`. | Local validation, hosted `Portable validation`, raw-data exclusion, and caveats are checked. |
| Evidence artifact update | `docs/evidence-guide.md`, `docs/data-handling.md`, and `benchmark-artifacts/README.md`. | Command, provenance, artifact path, `productionClaim: false`, `privacyBoundary`, and `cryptoInventory` are preserved. |
| Release review | `RELEASE.md`, `docs/release-gate-matrix.md`, and `docs/evidence-dashboard.md`. | `releaseGateSatisfied: false` is only changed by satisfied documented gates plus explicit user approval. |
| Sensitive or raw-data-adjacent report | `SECURITY.md`, `SUPPORT.md`, and `docs/contributor-workflow.md`. | Secrets, private payloads, raw datasets, and exploit details stay out of public threads. |

## Pre-Merge Routes

Use this table first, then use the checklist below for supporting details.

| Check | Confirm In | Do Not Merge If |
| --- | --- | --- |
| Local validation | `npm run ci`, `git diff --check`, and `VALIDATION.md`. | The intended change is unvalidated or whitespace is not clean. |
| Hosted validation | GitHub `Portable validation` check rollup and `docs/operations-runbook.md`. | Checks are failing, missing, or confused with repository ruleset/admin policy. |
| Raw-data and secret boundary | `benchmark-artifacts/repo-hygiene/latest.json`, `SECURITY.md`, and `docs/data-handling.md`. | Raw datasets, raw signals, secrets, private payloads, or proprietary material are staged or attached. |
| Claim boundary | `docs/evidence-dashboard.md`, `docs/faq.md`, and `docs/architecture-decisions.md`. | The PR upgrades `productionClaim: false`, `privacyBoundary`, `cryptoInventory`, or release caveats without evidence. |
| Repository policy state | `docs/operations-runbook.md`, `RELEASE.md`, and the PR merge state. | Merge remains blocked by repository ruleset/admin policy or release approval is being inferred from green CI. |

## PR Readiness Snapshot

After review, leave a short status note with:

- local validation command and result;
- hosted `Portable validation` result and run link;
- merge state, including repository ruleset/admin policy when present;
- release-gate posture, including `releaseGateSatisfied: false` unless the
  documented gate is satisfied;
- remaining blocker, caveat, or next action.

## Before Merging A PR

- Confirm the worktree is clean except for the intended changes.
- Confirm the PR description says what changed, what was validated, and what
  caveats or blockers remain.
- Confirm `.github/pull_request_template.md` and the issue forms under
  `.github/ISSUE_TEMPLATE/` still route validation, release, raw-data, and
  repository-policy caveats clearly.
- Confirm `.github/CODEOWNERS` still routes review ownership appropriately for
  the touched area.
- Run:

```sh
npm run ci
git diff --check
```

- Confirm hosted `Portable validation` is green on the PR head.
- Use `docs/operations-runbook.md` if the PR check rollup is empty, failing, or
  green but still blocked by repository ruleset/admin policy.
- Use `docs/faq.md` and `docs/evidence-dashboard.md` when answering review
  questions about current evidence, release posture, raw-data handling, or
  claim boundaries.
- Use `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, and
  `docs/contributor-workflow.md` when routing sensitive reports, public support
  requests, contributor changes, or GitHub issue/PR workflow questions.
- Confirm raw datasets, raw signals, secrets, private payloads, and proprietary
  material are not staged or attached.
- Confirm claim language still matches the research-alpha boundary.

## Before Committing Evidence Artifacts

- Confirm the command, generated timestamp, provenance, and artifact path.
- Confirm the artifact class: synthetic scaffold, plaintext real-data, native
  encrypted-compute, blocker, hygiene, reconstruction-risk, or release
  dashboard.
- Preserve `productionClaim: false` wherever artifact metadata carries it.
- Preserve `privacyBoundary`, `cryptoInventory`, caveats, and rerun commands.
- If a dependency or dataset is unavailable, commit a structured blocker only
  when it records the exact command, error, and smallest next setup step.
- Do not commit raw EEG, neural, sensor, partner, private, or proprietary data.

## Before Release Review

- Use `RELEASE.md` as the release gate.
- Confirm `npm run validate` and `git diff --check` pass.
- Confirm hosted CI is green on the release PR.
- Confirm `benchmark-artifacts/repo-hygiene/latest.json` reports a passing
  redacted source-hygiene scan.
- Confirm `benchmark-artifacts/native-evidence/latest.json` records current
  native-lane evidence, host/toolchain details, rerun commands, and measurement
  gaps.
- Confirm `benchmark-artifacts/release-evidence/latest.json` keeps
  `releaseGateSatisfied: false` until all documented gates are genuinely
  satisfied.
- Confirm the release notes avoid production, clinical, medical, surveillance,
  deployment, side-channel, identity-protection, and stable-performance claims.
- Do not tag or merge a release PR unless the release gates are satisfied and
  the user explicitly approves that final action.

## Useful References

- `docs/command-reference.md` - grouped command list.
- `docs/evidence-guide.md` - claim-safe evidence map.
- `docs/evidence-dashboard.md` - current release-evidence posture and caveats.
- `docs/faq.md` - concise answers for common reader and reviewer questions.
- `CHANGELOG.md` - unreleased review history and release-caveat summary.
- `SECURITY.md` - sensitive-reporting scope and research-alpha security
  boundaries.
- `SUPPORT.md` - routing for public issues, evidence gaps, sensitive reports,
  release blockers, and cleanup requests.
- `CONTRIBUTING.md` - contributor expectations and evidence-boundary rules.
- `docs/contributor-workflow.md` - GitHub issue, PR, and hosted-validation
  surface map.
- `docs/reviewer-quickstart.md` - diligence and evidence-review entry path.
- `docs/architecture-decisions.md` - accepted repository boundary decisions.
- `docs/operations-runbook.md` - routine PR and blocker handling.
- `docs/glossary.md` - recurring project and artifact terms.
- `docs/dependency-matrix.md` - portable and native dependency map.
- `docs/data-handling.md` - raw-data and derived-artifact boundary map.
- `docs/claim-evidence-ledger.md` - weak-claim evidence and caveat ledger.
- `docs/release-gate-matrix.md` - release command and artifact matrix.
- `docs/policy-boundary.md` - root policy and claim-boundary map.
- `docs/status-roadmap.md` - current readiness and next-work map.
- `docs/testing-strategy.md` - portable validation and guard-family map.
- `benchmark-artifacts/README.md` - artifact mechanics and output locations.
- `MAINTAINERS.md` - current maintainer route and release authority boundary.
- `.github/CODEOWNERS` - repository review ownership routing.
- `.github/dependabot.yml` - weekly dependency update routing.
- `.github/pull_request_template.md` - PR validation and caveat checklist.
- `.github/ISSUE_TEMPLATE/` - guided bug, validation-gap, and cleanup forms.
- `RELEASE.md` - research-alpha release gate.
