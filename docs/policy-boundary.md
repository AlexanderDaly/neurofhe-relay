# Policy Boundary Map

NeuroFHE Relay is a CC0 research-alpha package, not a production cryptography,
medical, clinical, surveillance, deployment, side-channel, or security-certified
system. Use this map to find the repository files that define that boundary
before changing release language, evidence artifacts, contribution guidance, or
public framing.

This page is navigation only. It is not legal advice, security review, medical
review, release approval, or benchmark evidence.

## Boundary Routes

Use this table before changing boundary language. It keeps common policy edits
tied to the files that must stay aligned.

| Boundary Change | Start With | Must Preserve |
| --- | --- | --- |
| License or public-domain framing | `LICENSE`, `PUBLIC_DOMAIN_NOTICE.md`, and `MAINTAINERS.md`. | CC0/public-domain posture unless a deliberate maintainer-reviewed change is made. |
| Public claim or README framing | `README.md`, `docs/architecture-decisions.md`, and `docs/claim-evidence-ledger.md`. | Research-alpha caveats, bio-digital event intelligence boundary, and evidence-backed language. |
| Contribution, support, or conduct routing | `CONTRIBUTING.md`, `SUPPORT.md`, and `CODE_OF_CONDUCT.md`. | Public/private report separation, exact-command blocker notes, and raw-data exclusions. |
| Security, raw-data, or private-payload reporting | `SECURITY.md`, `docs/data-handling.md`, and `benchmark-artifacts/repo-hygiene/latest.json`. | No secrets, private payloads, raw datasets, or exploit details in public threads. |
| Release, validation, or hosted-CI posture | `RELEASE.md`, `VALIDATION.md`, and `docs/operations-runbook.md`. | `releaseGateSatisfied: false`, `productionClaim: false`, and CI/check-rollup versus repository-policy separation. |

## Root Boundary Files

- `LICENSE` - CC0 1.0 Universal public-domain dedication.
- `PUBLIC_DOMAIN_NOTICE.md` - plain-English public-domain and free-use notice.
- `README.md` - public thesis, recommended phrasing, bio-digital event
  intelligence boundary, and explicit caveats.
- `CODE_OF_CONDUCT.md` - public collaboration expectations and reporting
  boundaries.
- `SECURITY.md` - research-alpha security scope and responsible reporting
  guidance.
- `SUPPORT.md` - routing for public issues, security reports, release blockers,
  and cleanup/support requests.
- `MAINTAINERS.md` - current maintainer route, review ownership, and release
  authority boundary.
- `CONTRIBUTING.md` - evidence-first contribution rules, including
  `privacyBoundary`, `cryptoInventory`, provenance, and `productionClaim: false`
  expectations.
- `DEVELOPMENT.md` - local setup, portable validation, native dependency
  boundaries, and artifact policy.
- `RELEASE.md` - research-alpha release gate and no-tag checklist.
- `VALIDATION.md` - current and historical validation commands, outputs, and
  caveats.

## Claim Boundary

- Keep the CC0/public-domain framing intact unless the whole release posture is
  intentionally changed and reviewed.
- Keep bio-digital event intelligence framed as privacy-preserving event
  representation and encrypted scoring, not diagnosis, treatment,
  mind-reading, surveillance, coercive control, or external command authority.
- Preserve `productionClaim: false` wherever artifact metadata carries it.
- Preserve `privacyBoundary`, `cryptoInventory`, provenance, caveats, and rerun
  commands for evidence artifacts that expose those fields.
- Treat the local relay gateway as the only trusted boundary allowed to inspect
  raw signals; exported records should remain validated, transformed,
  permissioned event representations.
- Separate hosted CI/account/ruleset blockers from local code failures and
  benchmark blockers.
- If native dependencies, datasets, or release gates cannot run, record the
  exact command, error, and smallest next step in a blocker artifact or
  validation note.

## Release Boundary

`RELEASE.md` remains the controlling release checklist. A green portable CI run,
passing local validation, and a caveated release-evidence index are necessary
review inputs, but they do not by themselves authorize a release tag.

Do not merge or tag a release unless the documented gates are satisfied and the
user explicitly approves that final action.
