# Benchmark Artifacts

This directory contains published benchmark JSON artifacts for the runnable
prototype.

Generate or refresh the current artifact:

```sh
npm run benchmark:artifact
```

The publisher writes:

- `latest.json` - the most recent benchmark artifact.
- `runs/*.json` - timestamped run artifacts.

Optional comparison artifacts can also be written for adapter plans or native
library runs:

```sh
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10 --artifact
npm run baseline:eeg-eye-state -- --artifact
npm run baseline:plaintext -- --source eeg-eye-state --fetch --artifact
npm run contract:eeg-openfhe
npm run benchmark:privacy-modes -- --artifact
npm run benchmark:openfhe -- --artifact
npm run benchmark:openfhe -- --run --artifact
npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
npm run benchmark:openfhe-ckks -- --artifact
npm run benchmark:openfhe-ckks -- --run --artifact
npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact
npm run benchmark:tfhe -- --artifact
npm run benchmark:tfhe -- --run --artifact
```

By default, OpenFHE comparison artifacts are written under
`benchmark-artifacts/comparisons/openfhe/`. OpenFHE CKKS comparison artifacts
are written under `benchmark-artifacts/comparisons/openfhe-ckks/`. TFHE-rs
comparison artifacts are written under `benchmark-artifacts/comparisons/tfhe-rs/`. Use
`--out <directory>` to place a comparison run elsewhere.

Plaintext baseline artifacts are written under
`benchmark-artifacts/plaintext-baselines/<dataset-id>/`. The committed
`nmnist-smoke` artifact is a deterministic format fixture, not real N-MNIST
accuracy. The committed `nmnist-local-blocker` artifact records the missing
local public dataset directory and the exact command to rerun after extracting
N-MNIST outside git. The committed `eeg-eye-state` artifact is a real public
UCI EEG Eye State plaintext baseline; it stores only derived metrics and
provenance, not raw EEG rows.

The EEG OpenFHE input-contract publisher writes derived single-window sparse
contracts under
`benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/`. The
BFVrns view includes a signed fixed-point quantization block; the CKKS view
uses the approximate-real values directly. These input contracts preserve the
public active positions plus encrypted active values boundary used by the
native OpenFHE demos.

Privacy-mode ablation artifacts are written under
`benchmark-artifacts/privacy-modes/padding-ablation/`. These quantify unpadded
sparse, padded sparse, and dense-window operation counts for the current
synthetic event window. Runtime measurements in that artifact are local
JavaScript toy-arithmetic timings only; use native OpenFHE or TFHE-rs artifacts
for cryptographic-library timing.

Every `neurofhe.benchmarkArtifact.v1` file must include:

- accuracy
- latency
- ciphertext bytes
- operation counts
- security parameters
- privacy boundary
- crypto inventory

Current artifacts also include:

- packed-vector planning notes for BFV/BGV and CKKS
- native comparison lane planning for BFVrns integer, CKKS approximate-real, and TFHE-rs threshold paths
- privacy-mode decision for public active positions, padded sparse batches, or dense encrypted windows
- metadata padding ablation output for leakage masking versus operation overhead
- plaintext N-MNIST-compatible fixture, real public UCI EEG Eye State baseline, and real public dataset blocker reports
- framing guardrail for privacy-preserving event intelligence, not diagnosis or treatment
- optional OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs adapter/native comparison artifacts for the same synthetic 8x8 sparse score contract
- native OpenFHE BFVrns and CKKS comparison artifacts for one generated UCI EEG Eye State sparse input contract

The current top-level benchmark accuracy field is synthetic contract agreement
against the plaintext classifier, not real dataset accuracy. Use the
N-MNIST-compatible plaintext baseline or the committed UCI EEG Eye State
artifact before making dataset performance claims. The EEG plaintext artifact is
preprocessing/model evidence. The OpenFHE EEG artifacts are single-window native
runtime evidence for generated derived inputs only; they are not dataset-scale
encrypted accuracy evidence.
