# Release Gate Matrix

Use this matrix when preparing or reviewing `v0.1.0-research-alpha`. It turns
the command list in `RELEASE.md` into an evidence checklist with expected
artifacts, current caveats, and blocker posture.

This matrix is not release approval. It does not satisfy the release gate,
upgrade native evidence, or authorize production cryptography, medical,
clinical, deployment, privacy-proof, side-channel, identity-protection, or
stable-performance claims.

## Current Gate Posture

- Hosted `Portable validation` can be green while merge stays controlled by
  repository ruleset/admin policy.
- `benchmark-artifacts/release-evidence/latest.json` remains a dashboard only;
  `releaseGateSatisfied: false`.
- Artifact metadata must preserve `productionClaim: false`, `privacyBoundary`,
  `cryptoInventory`, provenance, and caveats where those fields apply.
- If a native dependency, dataset, or release-machine command cannot run,
  publish a blocker artifact or validation note with the exact command, error,
  and smallest next step.

## Minimum Evidence Commands

| Command | Expected Evidence | Current Caveat |
| --- | --- | --- |
| `npm run validate` | Portable local gate recorded in `VALIDATION.md`. | Necessary but not native-library, privacy-proof, deployment, or release approval evidence. |
| `npm run baseline:plaintext -- --source eeg-eye-state --fetch --artifact` | `benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json`. | Plaintext public-data preprocessing/model evidence only. |
| `npm run contract:eeg-openfhe -- --generated-at <ISO_TIMESTAMP>` | Derived sparse contracts under `benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/`. | Derived single-window input contracts; no raw EEG rows or encrypted dataset-scale accuracy claim. |
| `npm run benchmark:privacy-modes -- --artifact` | `benchmark-artifacts/privacy-modes/padding-ablation/latest.json`. | Metadata exposure is a taxonomy proxy, not anonymity, mutual-information, side-channel, or reconstruction-resistance proof. |
| `npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact` | OpenFHE BFVrns comparison artifact plus `benchmark-artifacts/native-evidence/latest.json` coverage. | Requires OpenFHE on the release machine; missing dependency must produce a blocker, not substitute numbers. |
| `npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact` | OpenFHE CKKS comparison artifact plus `benchmark-artifacts/native-evidence/latest.json` coverage. | Requires OpenFHE on the release machine; timings and drift are local evidence only. |
| `npm run benchmark:tfhe -- --run --artifact` | TFHE-rs synthetic native comparison artifact. | Synthetic sparse contract only; not real-data or production performance evidence. |
| `npm run benchmark:tfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact` | `benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json` until a validated adapter exists. | Current expected posture is a real-data input blocker unless the TFHE-rs domain adapter has been implemented and validated. |
| `npm run native:doctor -- --artifact` | `benchmark-artifacts/native-evidence/latest.json`. | Manifest classifies gaps; it does not rerun native benchmarks or close missing ciphertext-byte/RSS coverage by itself. |
| `npm run scan:hygiene -- --artifact` | `benchmark-artifacts/repo-hygiene/latest.json`. | Redacted source-hygiene evidence only; not a security audit or secret-management proof. |
| `npm run reconstruction:risk -- --artifact` | `benchmark-artifacts/reconstruction-risk/latest.json`. | Synthetic gateway probe only; `privacyProofClaim: false`. |
| `npm run release:evidence -- --artifact` | `benchmark-artifacts/release-evidence/latest.json`. | Dashboard only; must keep `releaseGateSatisfied: false` until every gate is actually satisfied. |

## Release Review Order

1. Confirm the branch is merged through the approved repository path.
2. Rerun every command above on the release machine.
3. Commit refreshed artifacts or precise blocker notes only when the command
   output supports them.
4. Rerun `npm run validate` and `git diff --check`.
5. Confirm hosted GitHub Actions is green on the release PR.
6. Tag only after `RELEASE.md` gates are satisfied and the user explicitly
   approves the final release action.
