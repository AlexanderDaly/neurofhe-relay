# Benchmark Artifacts

This directory contains published benchmark JSON artifacts for the runnable
research-alpha package.

For a shorter claim-safety map of the evidence classes, start with
`docs/evidence-guide.md`.

Generate or refresh the current artifact:

```sh
npm run benchmark:artifact
```

The publisher writes:

- `latest.json` - the most recent benchmark artifact.
- `runs/*.json` - timestamped run artifacts.

## Artifact Review Routes

Use this table before opening individual JSON files. It keeps review questions
tied to the artifact family that can answer them without turning dashboard,
blocker, plaintext, or synthetic evidence into a broader claim.

| Review Need | Start With | Do Not Claim |
| --- | --- | --- |
| Release posture | `benchmark-artifacts/release-evidence/latest.json` and `docs/evidence-dashboard.md` | Release approval, production readiness, or a satisfied release gate. |
| Native measurement coverage | `benchmark-artifacts/native-evidence/latest.json` and `benchmark-artifacts/comparisons/` | Stable performance, complete memory evidence, or side-channel assurance. |
| Real-data plaintext baselines | `benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json` and `benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json` | Encrypted-compute accuracy, medical evidence, or deployment evidence. |
| Metadata and reconstruction caveats | `benchmark-artifacts/privacy-modes/padding-ablation/latest.json` and `benchmark-artifacts/reconstruction-risk/latest.json` | Formal leakage, anonymity, reconstruction-resistance, or privacy-proof evidence. |
| Hosted CI or repository hygiene | `benchmark-artifacts/ci-blockers/latest.json` and `benchmark-artifacts/repo-hygiene/latest.json` | Release approval, security audit completion, or repository-policy merge approval. |

## Directory Map

Use this map to navigate the committed derived evidence without upgrading any
artifact into a broader claim than its schema and caveats support.

| Directory | Contents |
| --- | --- |
| `benchmark-artifacts/runs/` | timestamped synthetic benchmark runs for the top-level `latest.json` artifact. |
| `benchmark-artifacts/ci-blockers/` | hosted CI blocker and green hosted-CI snapshots. |
| `benchmark-artifacts/ci-blockers/runs/` | timestamped CI blocker and hosted-CI evidence snapshots. |
| `benchmark-artifacts/comparisons/` | native comparison lane artifacts and blockers. |
| `benchmark-artifacts/comparisons/openfhe/` | OpenFHE BFVrns adapter, blocker, and native run artifacts. |
| `benchmark-artifacts/comparisons/openfhe/runs/` | timestamped OpenFHE BFVrns comparison records. |
| `benchmark-artifacts/comparisons/openfhe-ckks/` | OpenFHE CKKS adapter, blocker, and native run artifacts. |
| `benchmark-artifacts/comparisons/openfhe-ckks/runs/` | timestamped OpenFHE CKKS comparison records. |
| `benchmark-artifacts/comparisons/tfhe-rs/` | TFHE-rs synthetic native comparison artifacts. |
| `benchmark-artifacts/comparisons/tfhe-rs/runs/` | timestamped TFHE-rs synthetic comparison records. |
| `benchmark-artifacts/comparisons/tfhe-rs-realdata/` | TFHE-rs real-data input blocker artifacts. |
| `benchmark-artifacts/comparisons/tfhe-rs-realdata/runs/` | timestamped TFHE-rs real-data blocker records. |
| `benchmark-artifacts/native-evidence/` | native-lane manifest artifacts and measurement gap indexes. |
| `benchmark-artifacts/native-evidence/runs/` | timestamped native evidence manifests. |
| `benchmark-artifacts/plaintext-baselines/` | plaintext real-data, fixture, and blocker baselines. |
| `benchmark-artifacts/plaintext-baselines/eeg-eye-state/` | UCI EEG Eye State derived plaintext baseline artifacts. |
| `benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/` | derived BFVrns and CKKS sparse input contracts. |
| `benchmark-artifacts/plaintext-baselines/eeg-eye-state/runs/` | timestamped UCI EEG Eye State plaintext baseline records. |
| `benchmark-artifacts/plaintext-baselines/nmnist-local/` | sampled real public N-MNIST plaintext baseline artifacts. |
| `benchmark-artifacts/plaintext-baselines/nmnist-local/runs/` | timestamped real N-MNIST local baseline records. |
| `benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/` | blocker artifacts for missing local N-MNIST data. |
| `benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/runs/` | timestamped N-MNIST local dataset blocker records. |
| `benchmark-artifacts/plaintext-baselines/nmnist-smoke/` | deterministic N-MNIST-format fixture artifacts. |
| `benchmark-artifacts/plaintext-baselines/nmnist-smoke/runs/` | timestamped N-MNIST smoke fixture records. |
| `benchmark-artifacts/privacy-modes/` | privacy-mode comparison artifacts. |
| `benchmark-artifacts/privacy-modes/padding-ablation/` | sparse metadata versus padding overhead ablation artifacts. |
| `benchmark-artifacts/privacy-modes/padding-ablation/runs/` | timestamped padding ablation records. |
| `benchmark-artifacts/reconstruction-risk/` | synthetic reconstruction-risk probe artifacts. |
| `benchmark-artifacts/reconstruction-risk/runs/` | timestamped reconstruction-risk probe records. |
| `benchmark-artifacts/release-evidence/` | caveated release-evidence dashboard artifacts. |
| `benchmark-artifacts/release-evidence/runs/` | timestamped release-evidence index records. |
| `benchmark-artifacts/repo-hygiene/` | redacted repository hygiene scan artifacts. |
| `benchmark-artifacts/repo-hygiene/runs/` | timestamped repository hygiene scan records. |

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
npm run benchmark:tfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
npm run native:doctor -- --artifact
npm run scan:hygiene -- --artifact
npm run reconstruction:risk -- --artifact
npm run release:evidence -- --artifact
```

By default, OpenFHE comparison artifacts are written under
`benchmark-artifacts/comparisons/openfhe/`. OpenFHE CKKS comparison artifacts
are written under `benchmark-artifacts/comparisons/openfhe-ckks/`. TFHE-rs
comparison artifacts are written under
`benchmark-artifacts/comparisons/tfhe-rs/`. TFHE-rs real-data input blocker
artifacts are written under
`benchmark-artifacts/comparisons/tfhe-rs-realdata/`; they preserve the attempted
EEG-derived input command, error, and smallest next step without overwriting the
latest runnable synthetic TFHE-rs artifact. Use `--out <directory>` to place a
comparison run elsewhere.

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
accuracy. The committed `nmnist-local` artifact is a sampled real public
N-MNIST plaintext baseline from local `Train/` and `Test/` directories kept
outside git; it stores derived metrics, provenance, and compression curves, not
raw event files. The committed `eeg-eye-state` artifact is a real public UCI
EEG Eye State plaintext baseline; it stores only derived metrics and
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

CI blocker and hosted-CI evidence artifacts are written under
`benchmark-artifacts/ci-blockers/` when GitHub Actions cannot start or complete
for account or host reasons outside the portable validation commands, or when
the release stack needs an auditable hosted-CI snapshot. The May 29 `609b48c`
snapshot records PR #23 against `main` head `7317f11` with successful
`pull_request` and `push` `Portable validation` check runs on PR head
`609b48c` after automatic triggers were restored. It also records the
Node 24-ready action major updates for checkout, setup-node, and
upload-artifact, clearing the prior Node 20 runtime annotation. Manual dispatch
CI also passed on the superseded stacked branch heads #17 through #22, although
GitHub does not attach those manual runs to the old stacked PR rollups. The
remaining `mergeStateStatus: BLOCKED` on PR #23 is attributed to the active
default-branch ruleset/admin merge policy, not CI/check-rollup.

Before merge or release review, still confirm the live PR head and status
check rollup with `gh pr view <release-validation-PR>`; committed hosted-CI snapshots are evidence
records, not a substitute for live repository-policy review.

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
evidence, repository hygiene, native evidence, metadata-leakage, and
reconstruction-risk artifacts, plus the real N-MNIST plaintext baseline at
`benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json` and the
TFHE-rs real-data input blocker at
`benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json`, so the release
gate can be reviewed from one JSON surface. They are dashboard artifacts only,
must keep `releaseGateSatisfied: false` until the documented gate is actually
satisfied, and do not constitute new benchmark evidence or release approval.

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
- plaintext N-MNIST-compatible fixture, real public N-MNIST plaintext baseline,
  real public UCI EEG Eye State baseline, and dataset blocker reports where a
  local dataset is unavailable
- framing guardrail for privacy-preserving event intelligence, not diagnosis or treatment
- optional OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs adapter/native comparison artifacts for the same synthetic 8x8 sparse score contract
- native OpenFHE BFVrns and CKKS comparison artifacts for one generated UCI EEG Eye State sparse input contract
- native evidence manifest artifacts that fingerprint the host/toolchain and
  index reproducibility and per-lane measurement gaps across OpenFHE and TFHE-rs
  lanes
- TFHE-rs native current-RSS evidence for the synthetic sparse contract, with a
  caveat that it is not peak-memory or dataset-scale memory evidence
- real N-MNIST local plaintext baseline evidence with derived sampled accuracy
  and compression-curve metrics, not raw event files
- TFHE-rs real-data input blocker artifacts that keep the unsupported
  EEG-derived input path explicit without replacing synthetic native evidence
- CI/account blocker artifacts that separate GitHub Actions availability from
  code or workflow-step failures
- repository hygiene scan artifacts that separate source cleanliness evidence
  from benchmark performance claims
- reconstruction-risk probe artifacts that keep raw-payload and active-value
  withholding separate from formal privacy-proof claims
- release-evidence index artifacts that keep blocker, hygiene, native, privacy,
  real N-MNIST baseline, TFHE real-data blocker, and `productionClaim: false`
  status visible in one caveated dashboard

The current top-level benchmark accuracy field is synthetic contract agreement
against the plaintext classifier, not real dataset accuracy. Use the
N-MNIST-compatible plaintext baseline or the committed UCI EEG Eye State
artifact before making dataset performance claims. The EEG plaintext artifact is
preprocessing/model evidence. The OpenFHE EEG artifacts are single-window native
runtime evidence for generated derived inputs only; they are not dataset-scale
encrypted accuracy evidence.
