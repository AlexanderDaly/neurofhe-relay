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
npm run native:doctor -- --artifact
npm run scan:hygiene -- --artifact
npm run reconstruction:risk -- --artifact
npm run release:evidence -- --artifact
```

By default, OpenFHE comparison artifacts are written under
`benchmark-artifacts/comparisons/openfhe/`. OpenFHE CKKS comparison artifacts
are written under `benchmark-artifacts/comparisons/openfhe-ckks/`. TFHE-rs
comparison artifacts are written under `benchmark-artifacts/comparisons/tfhe-rs/`. Use
`--out <directory>` to place a comparison run elsewhere.

Native evidence manifest artifacts are written under
`benchmark-artifacts/native-evidence/`. They do not rerun OpenFHE or TFHE-rs;
they fingerprint the current host/toolchain, classify the latest committed
native artifacts, list exact rerun commands, classify ciphertext-byte and
RSS/peak-memory measurement coverage, and preserve remaining native measurement
gaps. The summary also includes a per-lane measurement gap index with the exact
rerun commands for each missing or partial measurement class. The TFHE-rs
native artifact now includes a single end-of-run current RSS sample from the
local process table; that is host-specific current-RSS evidence, not peak-memory,
dataset-scale, side-channel, or stable performance evidence.

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
synthetic event window and include a caveated metadata-exposure proxy based on
documented observable category counts. That proxy is not mutual information,
anonymity, side-channel, or reconstruction-resistance proof. Runtime
measurements in that artifact are local JavaScript toy-arithmetic timings only;
use native OpenFHE or TFHE-rs artifacts for cryptographic-library timing.

CI blocker artifacts are written under `benchmark-artifacts/ci-blockers/` when
GitHub Actions cannot start or complete for account or host reasons outside the
portable validation commands. The May 26 post-merge blocker refresh records
that the completion-loop PRs are merged and `gh pr list --state open` is empty,
while the CI workflow remains `workflow_dispatch` only after the prior GitHub
Actions account/billing lock. This remains an Actions availability and release
gate blocker, not evidence of a code or workflow-step failure. Before tagging,
open a release-validation PR and obtain a green portable hosted CI run, either
by re-enabling automatic `pull_request` triggers after the account issue is
resolved or by manually dispatching the workflow on that PR.

Repository hygiene artifacts are written under
`benchmark-artifacts/repo-hygiene/`. They record the source scan result,
scanned file count, blocked raw-data patterns, and redacted findings only. They
do not include raw dataset rows or secret values.

Reconstruction-risk probe artifacts are written under
`benchmark-artifacts/reconstruction-risk/`. They run deterministic synthetic
gateway policy probes for raw-payload replay, active-value recovery, and
public-position linkage. They are not formal reconstruction-resistance,
identity-leakage, mutual-information, side-channel, or privacy-proof evidence.

Release-evidence index artifacts are written under
`benchmark-artifacts/release-evidence/`. They summarize the current committed CI
blocker, repository hygiene, native evidence, metadata-leakage, and
reconstruction-risk artifacts so the release gate can be reviewed from one JSON
surface. They are dashboard artifacts only and do not constitute new benchmark
evidence or release approval.

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
- metadata padding ablation output for leakage masking, observable-category
  exposure score, and operation overhead
- plaintext N-MNIST-compatible fixture, real public UCI EEG Eye State baseline, and real public dataset blocker reports
- framing guardrail for privacy-preserving event intelligence, not diagnosis or treatment
- optional OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs adapter/native comparison artifacts for the same synthetic 8x8 sparse score contract
- native OpenFHE BFVrns and CKKS comparison artifacts for one generated UCI EEG Eye State sparse input contract
- native evidence manifest artifacts that fingerprint the host/toolchain and
  index reproducibility and per-lane measurement gaps across OpenFHE and TFHE-rs
  lanes
- TFHE-rs native current-RSS evidence for the synthetic sparse contract, with a
  caveat that it is not peak-memory or dataset-scale memory evidence
- CI/account blocker artifacts that separate GitHub Actions availability from
  code or workflow-step failures
- repository hygiene scan artifacts that separate source cleanliness evidence
  from benchmark performance claims
- reconstruction-risk probe artifacts that keep raw-payload and active-value
  withholding separate from formal privacy-proof claims
- release-evidence index artifacts that keep blocker, hygiene, native, privacy,
  and `productionClaim: false` status visible in one caveated dashboard

The current top-level benchmark accuracy field is synthetic contract agreement
against the plaintext classifier, not real dataset accuracy. Use the
N-MNIST-compatible plaintext baseline or the committed UCI EEG Eye State
artifact before making dataset performance claims. The EEG plaintext artifact is
preprocessing/model evidence. The OpenFHE EEG artifacts are single-window native
runtime evidence for generated derived inputs only; they are not dataset-scale
encrypted accuracy evidence.
