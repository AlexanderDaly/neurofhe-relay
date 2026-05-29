# Evidence Guide

Use this as the short map for reading committed evidence before making claims.
The detailed artifact mechanics live in `benchmark-artifacts/README.md`.
Raw-data and derived-artifact boundaries live in `docs/data-handling.md`.
Weak-claim evidence posture lives in `docs/claim-evidence-ledger.md`.
Release command evidence posture lives in `docs/release-gate-matrix.md`.

NeuroFHE Relay is a research-alpha package. Evidence in this repository can
support scoped prototype statements, but it does not support production
cryptography, medical, clinical, surveillance, deployment, side-channel,
identity-protection, or stable-performance claims.

## Evidence Classes

| Class | Where To Look | What It Can Support | What It Cannot Support |
| --- | --- | --- | --- |
| Portable validation | GitHub Actions `Portable validation`, `npm run validate` | Tests, JSON metadata parsing, local Markdown links, source hygiene, and smoke artifact generation are passing | Native-library availability, release approval, production readiness |
| Synthetic prototype | `benchmark-artifacts/latest.json`, `benchmark-artifacts/runs/` | Toy sparse scorer behavior, schema shape, operation-count comparisons, privacy-boundary metadata | Real FHE security, real dataset accuracy, speed or deployment claims |
| Plaintext real-data baselines | `benchmark-artifacts/plaintext-baselines/` | Derived public-data preprocessing and plaintext model evidence | Encrypted-compute accuracy, medical utility, production deployment |
| Native comparison lanes | `benchmark-artifacts/comparisons/`, `benchmark-artifacts/native-evidence/` | Local OpenFHE or TFHE-rs integration evidence when dependencies are present | Broad runtime claims, peak memory claims, side-channel resistance, dataset-scale encrypted validation |
| Privacy-mode ablation | `benchmark-artifacts/privacy-modes/` | Sparse metadata versus padding overhead for the current prototype contract | Formal leakage metrics, anonymity, mutual information, reconstruction-resistance proof |
| Reconstruction-risk probes | `benchmark-artifacts/reconstruction-risk/` | Synthetic gateway checks that raw payloads and active values are withheld from model-facing fields | Formal privacy proof, identity protection, side-channel analysis |
| CI blockers and hosted-CI snapshots | `benchmark-artifacts/ci-blockers/` | Separation between GitHub Actions/account/ruleset blockers and code failures | Release approval or local/native benchmark evidence |
| Release evidence index | `benchmark-artifacts/release-evidence/` | One caveated dashboard over current evidence, blockers, and `productionClaim: false` posture | New benchmark evidence, release-gate satisfaction by itself |

## Claim Discipline

Before using an artifact in public or release-facing text:

- Confirm the artifact path, schema, generated timestamp, command, and
  provenance.
- Confirm whether the artifact is synthetic, plaintext real-data, native
  encrypted-compute, blocker, hygiene, or dashboard evidence.
- Keep `productionClaim: false` intact wherever artifact metadata carries it.
- Preserve `privacyBoundary`, `cryptoInventory`, and caveat fields.
- State blockers as blockers. Do not replace a failed native dependency, absent
  dataset, or unsupported input path with toy or synthetic numbers.
- Use `RELEASE.md` before suggesting a tag or release.
- Use `docs/release-gate-matrix.md` before rerunning or reviewing release-gate
  commands.
- Use `docs/claim-evidence-ledger.md` before strengthening weak claims into
  public, patent, investor, release, or standards-facing language.

## Fast Review Path

For a quick evidence review:

```sh
npm run validate
npm run native:doctor
npm run release:evidence
```

Use `npm run release:evidence -- --artifact` only when intentionally refreshing
the committed release dashboard. Use `npm run native:doctor -- --artifact` only
when intentionally refreshing native-evidence manifests.

If a command cannot run because a dataset, OpenFHE, TFHE-rs, GitHub Actions, or
host setup is unavailable, record the exact command, error, and smallest next
step in a structured blocker artifact or validation note.
