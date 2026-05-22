# Contributing

NeuroFHE Relay is a CC0 research prototype for privacy-preserving sparse event
inference. Contributions are welcome when they keep the evidence boundary clear:
do not turn toy arithmetic, single-window native demos, or plaintext baselines
into production cryptography, medical, security, or performance claims.

## Ground Rules

- Keep raw signals and raw public/private datasets out of git.
- Preserve `privacyBoundary`, `cryptoInventory`, provenance, and
  `productionClaim: false` in benchmark and adapter outputs.
- Clearly distinguish synthetic demos, plaintext real-data baselines, toy
  cryptography, native OpenFHE/TFHE-rs runs, and blocker reports.
- Prefer small, reproducible changes with commands a reviewer can run locally.
- Keep the local gateway framing intact: raw payloads stay local, and only
  approved event representations cross the boundary.

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

Do not include secrets, private datasets, raw neural/EEG rows, or proprietary
partner material in issues, pull requests, committed artifacts, or screenshots.
