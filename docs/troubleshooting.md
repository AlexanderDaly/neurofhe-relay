# Troubleshooting

Use this page when a local command, hosted check, native lane, or dataset path
does not behave as expected. It routes common blockers without weakening the
research-alpha evidence boundary.

Nothing here authorizes substitute benchmark numbers, production cryptography
claims, release approval, medical or clinical claims, deployment evidence,
privacy-proof claims, or stable-performance claims.

## Troubleshooting Routes

| Symptom | Check First | Record Or Route |
| --- | --- | --- |
| Local portable gate fails | `npm run ci`, `git diff --check`, Node.js version, and Homebrew `PATH` visibility | Record the exact failing command and local error before changing evidence artifacts. |
| Hosted CI is green but PR is blocked | `gh pr checks <number>` and `gh pr view <number> --json mergeable,mergeStateStatus,statusCheckRollup` | Separate repository ruleset/admin policy from hosted check-rollup, GitHub Actions billing/account, code, or workflow failures. |
| Native OpenFHE or TFHE-rs command fails | Dependency discovery, build output, and lane-specific comparison artifact command | Publish or update the blocker artifact with the exact command, error, and smallest next step rather than substituting toy arithmetic. |
| Dataset path is missing or malformed | Local dataset shape, especially public N-MNIST `Train/` and `Test/` directories | Keep raw datasets outside git and write only derived artifacts or blocker reports under `benchmark-artifacts/`. |
| Release evidence looks green but gate is false | `RELEASE.md`, `docs/release-gate-matrix.md`, and `benchmark-artifacts/release-evidence/latest.json` | Preserve `releaseGateSatisfied: false` until all gates are satisfied and the user explicitly approves the final release action. |

## Portable Validation

Start from the repository root:

```sh
npm run ci
git diff --check
```

If npm is installed by Homebrew but is not visible in the shell, rerun with:

```sh
PATH="/opt/homebrew/bin:$PATH" npm run ci
```

The portable gate expects Node.js 22 for CI parity through `.node-version`,
`.nvmrc`, and `.github/workflows/ci.yml`. `package.json` still accepts Node.js
20 or newer for local compatibility.

## Hosted CI And PR State

Inspect PR checks with:

```sh
gh pr checks <number>
gh pr view <number> --json mergeable,mergeStateStatus,statusCheckRollup
```

If hosted `Portable validation` is green but the PR is still blocked, record
whether the remaining state is repository ruleset/admin policy rather than a
code or workflow failure. Use `docs/operations-runbook.md` for the maintainer
loop and `benchmark-artifacts/ci-blockers/latest.json` for the current hosted
CI evidence snapshot.

## Native OpenFHE Or TFHE-rs Lanes

Native lanes require local dependencies. A missing OpenFHE installation often
appears as:

```text
OpenFHEConfig.cmake not found
```

When a native command cannot run, record the exact command, error, and smallest
next step in a blocker artifact or validation note. Do not replace unavailable
OpenFHE or TFHE-rs evidence with toy arithmetic numbers.

For every blocker, preserve the exact command, error, and smallest next step.

## Dataset Paths

Raw public or private datasets must remain outside git. For local N-MNIST
baselines, the dataset directory must contain the public `Train/` and `Test/`
directories. If those directories are missing, record the attempted command and
the smallest next setup step rather than committing raw events or inventing
baseline results.

Derived artifacts and blocker reports belong under `benchmark-artifacts/`. In
all cases, raw datasets must remain outside git, and any artifact metadata that
carries `productionClaim: false`, `privacyBoundary`, or `cryptoInventory` must
preserve those fields.

## Release Gate

The release posture remains `releaseGateSatisfied: false` until every
`RELEASE.md` gate is satisfied and the user explicitly approves the final
release action. A green dashboard, green hosted CI check, or passing local
portable gate is necessary review evidence, but none of them approves a tag by
itself.
