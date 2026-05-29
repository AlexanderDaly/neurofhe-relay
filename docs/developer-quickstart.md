# Developer Quickstart

Use this path when you want to make a small change and prove that the
research-alpha package still validates. For fuller native-library and artifact
policy details, see `DEVELOPMENT.md`. For a grouped list of npm scripts, see
`docs/command-reference.md`.

## Prerequisites

- Node.js 20 or newer; CI currently runs Node.js 22.
- npm.
- Optional: Rust stable and Cargo for TFHE-rs checks.
- Optional: CMake, a C++17 compiler, and OpenFHE for BFVrns/CKKS native checks.

The portable JavaScript harness has no npm dependencies today.

For local version managers, `.nvmrc` and `.node-version` point to Node.js 22
for CI parity. `package.json` still accepts Node.js 20 or newer.

If setup or validation fails, use `docs/troubleshooting.md` before opening an
issue so the report includes the exact command, error, and smallest next step.

## First Validation Pass

From the repository root:

```sh
npm run ci
git diff --check
```

`npm run ci` currently aliases `npm run validate`. It runs the Node test suite,
parses core JSON metadata, checks local Markdown links, and scans the source
tree for placeholder tokens, common token-shaped secrets, and committed raw-data
paths.

If your shell does not expose Homebrew's npm, use:

```sh
PATH="/opt/homebrew/bin:$PATH" npm run ci
```

## Validation By Change Type

Use the narrowest check that proves the edit while you work, then run the
common gate before committing.

| Change Type | Run First | Then Run |
| --- | --- | --- |
| Docs-only navigation or wording | `npm run check:docs` | `npm run ci` and `git diff --check` |
| Prototype library or artifact behavior | `npm test -- --test-name-pattern "<focused behavior>"` | `npm run ci` and `git diff --check` |
| GitHub Actions or repository policy | `gh pr checks <number>` and `gh pr view <number> --json mergeable,mergeStateStatus,statusCheckRollup` | `npm run ci` and `git diff --check` |
| Benchmark, dataset, native lane, or release evidence | Run the relevant artifact command into a temporary directory | `npm run ci`, `git diff --check`, and the exact artifact command if committed output changed |

## Useful Local Commands

For the full grouped command list, see `docs/command-reference.md`.

Run the desk demo:

```sh
npm run demo
```

Run the local gateway scaffold:

```sh
npm run gateway:demo
```

Print the synthetic benchmark:

```sh
npm run benchmark
```

Generate smoke artifacts outside the committed artifact tree:

```sh
tmpdir=$(mktemp -d)
npm run benchmark:artifact -- --out "$tmpdir/benchmark-artifacts"
npm run benchmark:privacy-modes -- --artifact --out "$tmpdir/privacy-modes"
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact --out "$tmpdir/nmnist-smoke"
```

Run the repository hygiene scanner directly:

```sh
npm run scan:hygiene
```

Check local Markdown links directly:

```sh
npm run check:docs
```

## Native And Real-Data Work

Native OpenFHE and TFHE-rs checks depend on local host setup. If a native
dependency is missing, publish or reference a blocker artifact with the exact
command, error, and smallest next step rather than substituting toy numbers.

Raw public or private datasets must remain outside git. Commit only derived
artifacts or structured blocker reports.

## Before A PR

- Keep CC0/public-domain framing intact.
- Preserve `privacyBoundary`, `cryptoInventory`, provenance, and
  `productionClaim: false` where artifact metadata is involved.
- Avoid production cryptography, clinical, medical, surveillance, deployment,
  or stable-performance claims.
- Run `npm run ci` and `git diff --check`.
- Include exact artifact commands if benchmark, dataset, native-lane,
  privacy-mode, or release-index behavior changed.
