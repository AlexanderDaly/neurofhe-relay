# Maintainer Checklist

Use this checklist when preparing a PR for review, updating committed evidence,
or considering a research-alpha release. It consolidates the routine checks from
`CONTRIBUTING.md`, `DEVELOPMENT.md`, `RELEASE.md`, and `docs/evidence-guide.md`.

Nothing here authorizes a production cryptography, medical, clinical,
surveillance, deployment, side-channel, identity-protection, or
stable-performance claim.

## Before Merging A PR

- Confirm the worktree is clean except for the intended changes.
- Confirm the PR description says what changed, what was validated, and what
  caveats or blockers remain.
- Run:

```sh
npm run ci
git diff --check
```

- Confirm hosted `Portable validation` is green on the PR head.
- Confirm raw datasets, raw signals, secrets, private payloads, and proprietary
  material are not staged or attached.
- Confirm claim language still matches the research-alpha boundary.

## Before Committing Evidence Artifacts

- Confirm the command, generated timestamp, provenance, and artifact path.
- Confirm the artifact class: synthetic prototype, plaintext real-data, native
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
- `CHANGELOG.md` - unreleased review history and release-caveat summary.
- `docs/glossary.md` - recurring project and artifact terms.
- `docs/dependency-matrix.md` - portable and native dependency map.
- `docs/data-handling.md` - raw-data and derived-artifact boundary map.
- `docs/claim-evidence-ledger.md` - weak-claim evidence and caveat ledger.
- `docs/release-gate-matrix.md` - release command and artifact matrix.
- `docs/policy-boundary.md` - root policy and claim-boundary map.
- `docs/status-roadmap.md` - current readiness and next-work map.
- `docs/testing-strategy.md` - portable validation and guard-family map.
- `benchmark-artifacts/README.md` - artifact mechanics and output locations.
- `RELEASE.md` - research-alpha release gate.
