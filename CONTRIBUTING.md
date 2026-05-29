# Contributing

NeuroFHE Relay is a CC0 research prototype for privacy-preserving sparse event
inference. Contributions are welcome when they keep the evidence boundary clear:
do not turn toy arithmetic, single-window native demos, or plaintext baselines
into production cryptography, medical, security, or performance claims.

## Ground Rules

- Follow `CODE_OF_CONDUCT.md` for public collaboration expectations and report
  routing.
- Keep raw signals and raw public/private datasets out of git.
- Preserve `privacyBoundary`, `cryptoInventory`, provenance, and
  `productionClaim: false` in benchmark and adapter outputs.
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
  prototype behavior, or artifact generation issue.
- Validation or evidence gap: missing or incomplete research-alpha evidence
  where the current caveat must stay visible.
- Documentation or repository cleanup: readability, navigation, packaging, or
  contributor-workflow improvements.

Every issue should include the relevant command, artifact path, observed result,
and smallest next step when those details apply. Do not attach secrets, private
payloads, raw datasets, raw signal rows, or proprietary material.

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

Do not include secrets, private datasets, raw neural/EEG rows, or proprietary
partner material in issues, pull requests, committed artifacts, or screenshots.
