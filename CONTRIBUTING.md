# Contributing

NeuroFHE Relay is a CC0 research-alpha repository for privacy-preserving event intelligence.
Contributions are welcome when they keep the evidence boundary clear: do not
turn toy arithmetic, single-window native demos, or plaintext baselines into
production cryptography, medical, security, or performance claims.

## Contribution Routes

Use this table before editing so the change starts from the right owner
document and keeps the relevant caveat visible.

| Change Type | Start With | Keep Visible |
| --- | --- | --- |
| Docs, packaging, or navigation cleanup | `docs/developer-quickstart.md`, then `docs/command-reference.md` | Reader route, exact validation command, and `productionClaim: false` caveats. |
| Scaffold or artifact behavior | `docs/command-reference.md`, then `benchmark-artifacts/README.md` | Artifact command, provenance, `privacyBoundary`, and `cryptoInventory`. |
| Native FHE lane work | `docs/dependency-matrix.md`, then `benchmark-artifacts/native-evidence/latest.json` | Local dependency state, exact command, error, and smallest next step when blocked. |
| Real-data baseline or dataset-adjacent work | `docs/data-handling.md`, then `docs/evidence-dashboard.md` | Raw datasets stay out of git; commit only derived artifacts or blocker reports. |
| Release-readiness or hosted-check work | `docs/release-gate-matrix.md`, then `docs/troubleshooting.md` | `releaseGateSatisfied: false`, repository ruleset/admin policy, and CI/check-rollup separation. |

## Ground Rules

- Follow `CODE_OF_CONDUCT.md` for public collaboration expectations and report
  routing.
- Use `docs/developer-quickstart.md` for the shortest local setup path,
  `docs/command-reference.md` for command details, and `docs/troubleshooting.md`
  when a local, hosted-CI, native-lane, dataset, or release-gate command fails.
- Keep raw signals and raw public/private datasets out of git.
- Use `docs/data-handling.md` before changing dataset paths, derived artifacts,
  blocker reports, hygiene evidence, or local ignore rules.
- Preserve `privacyBoundary`, `cryptoInventory`, provenance, and
  `productionClaim: false` in benchmark and adapter outputs.
- Keep `releaseGateSatisfied: false` visible unless every documented release
  gate is genuinely satisfied.
- Clearly distinguish synthetic demos, plaintext real-data baselines, toy
  cryptography, native OpenFHE/TFHE-rs runs, and blocker reports.
- Prefer small, reproducible changes with commands a reviewer can run locally.
- Keep the local gateway framing intact: raw payloads stay local, and only
  approved event representations cross the boundary.

## Issue Types

Use the GitHub issue forms to keep reports reproducible. See
`SUPPORT.md` and `docs/contributor-workflow.md` for the full map of issue,
pull-request, security-reporting, support-routing, and hosted CI surfaces.

- Reproducible bug or validation failure: failing command, CI job, script,
  scaffold behavior, or artifact generation issue.
- Validation or evidence gap: missing or incomplete research-alpha evidence
  where the current caveat must stay visible.
- Documentation or repository cleanup: readability, navigation, packaging, or
  contributor-workflow improvements.

Every issue should include the relevant command, artifact path, observed result,
and smallest next step when those details apply. Do not attach secrets, private
payloads, raw datasets, raw signal rows, or proprietary material.

If an issue is about release readiness, compare `docs/evidence-dashboard.md`
and `docs/release-gate-matrix.md` before calling it ready or blocked. If hosted
checks are green but GitHub still blocks the PR, distinguish policy blockers
from CI/check-rollup or code failures. The repository ruleset/admin policy blockers
are not benchmark, release-gate, or code-failure evidence by themselves.

## Before Opening a Pull Request

Run:

```sh
npm run ci
git diff --check
```

For changes that affect benchmark output or data processing, also run a relevant
artifact command into a temporary directory:

```sh
tmpdir=$(mktemp -d)
npm run benchmark:artifact -- --out "$tmpdir/benchmark-artifacts"
npm run benchmark:privacy-modes -- --artifact --out "$tmpdir/privacy-modes"
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact --out "$tmpdir/nmnist-smoke"
```

For native FHE changes, run the matching local command when the dependency is
installed. If it cannot run locally, include the exact command attempted, the
error, and the smallest next setup step.

## Pull Request Notes

Good PR descriptions include:

- What changed.
- Which commands were run.
- Which artifacts were produced or intentionally left unchanged.
- Any blocker reports.
- Any remaining caveats or follow-up validation needed.

Maintainers should use `MAINTAINERS.md` before asserting release authority and
`docs/maintainer-checklist.md` before merging, committing evidence artifacts,
or preparing release review.

Passing local validation and hosted CI does not make a cleanup PR release-ready
by itself; do not merge, tag, or strengthen release-facing claims without the
documented release gate, maintainer approval, and explicit user approval.

Do not include secrets, private datasets, raw neural/EEG rows, or proprietary
partner material in issues, pull requests, committed artifacts, or screenshots.
