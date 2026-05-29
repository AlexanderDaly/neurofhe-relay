# ENER Weak Claims and Evidence Gaps

This file identifies claims or statements that need evidence before publication, investor diligence, grant submission, or nonprovisional patent conversion.

| Area | Current Weakness | Evidence Needed |
|---|---|---|
| Latent compression performance | The specification describes bandwidth and compute reductions broadly. | Benchmarks comparing raw, dense feature, sparse feature, and compressed latent encrypted inference. |
| Real neural modality validation | Current repo validation is a research-grade prototype and does not establish real EEG, ECoG, fNIRS, MEG, or implanted-array performance. | Experiments on public or collected datasets with documented preprocessing and model accuracy. |
| Reconstruction resistance | The draft describes adversarial reconstruction defenses but does not prove them. | Reconstruction attack tests, identity leakage tests, mutual-information estimates, and acceptance criteria. |
| Homomorphic feasibility | The prototype uses a toy additive path and OpenFHE integration plan, not a complete production FHE deployment. | Native OpenFHE, SEAL, Concrete, TFHE-rs, or equivalent benchmark with parameter reports. |
| Adaptive compression controller | The controller is architected but not implemented as a verified module. | Control policy implementation, ablation studies, and tradeoff curves. |
| Metadata leakage mitigation | Padding, batching, and encrypted indices are described but not quantified. | Threat model, leakage metrics, and tests across privacy modes. |
| Clinical or neurodiagnostic examples | Medical use cases are described as possible applications. | Clinical validation, intended-use analysis, FDA pathway assessment, and human factors review. |
| Federated encrypted neurolearning | Federated learning is a plausible extension. | Protocol specification, secure aggregation tests, update-leakage analysis, and dataset governance plan. |
| Standards positioning | Standards opportunities are plausible but not yet anchored to a working group. | Mapping to NIST, IEEE, ISO/IEC, HL7, FIDO, or neurotechnology standards forums. |
| Commercial defensibility | FTO extraction suggests the blockchain lane is crowded, but ENER-specific FTO remains incomplete. | Targeted prior-art review on encrypted latent neural inference and adaptive FHE-oriented compression. |

## Validation Update May 21, 2026

This update narrows three evidence gaps without upgrading the project beyond a
research-alpha repository snapshot.

### Real Neural/Event Modality Baseline

Implemented a plaintext N-MNIST-format baseline path with a compression curve
and artifact publisher:

```sh
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10 --artifact
```

Current committed evidence includes a deterministic format smoke fixture, not
real N-MNIST accuracy:

- `benchmark-artifacts/plaintext-baselines/nmnist-smoke/latest.json`
- schema: `neurofhe.plaintextBaseline.v1`
- evidence class: `format-fixture-smoke-test`
- compression curve: feature compression versus plaintext accuracy across
  1x1, 2x2, 4x2, and 8x4 feature settings.

The fixture proves the parser, feature extractor, classifier, and artifact
shape. It is not sampled from public N-MNIST recordings. A separate blocker
artifact records the attempted real public dataset command and the missing local
`Train/` directory:

- `benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/latest.json`
- schema: `neurofhe.plaintextBaseline.unavailable.v1`
- smallest next step: download and extract the public N-MNIST `Train` and
  `Test` directories outside git, then rerun the documented command.

Dataset provenance to cite when the local dataset is used:

- Garrick Orchard, "N-MNIST" dataset page:
  `https://www.garrickorchard.com/datasets/n-mnist`
- Mendeley Data DOI: `10.17632/468j46mzdv.1`

### Metadata Leakage Versus Padding Overhead

Implemented a padding ablation artifact for the current 18-event synthetic
window:

```sh
npm run benchmark:privacy-modes -- --iterations 25 --padded-slot-count 32 --artifact
```

Current committed evidence:

- `benchmark-artifacts/privacy-modes/padding-ablation/latest.json`
- schema: `neurofhe.metadataPaddingAblation.v1`
- unpadded sparse mode: 18 encrypted feature slots, 36 scalar multiplies.
- padded sparse mode: 32 encrypted feature slots, 64 scalar multiplies.
- dense encrypted window mode: 64 encrypted feature slots, 128 scalar
  multiplies.
- metadata-exposure proxy: 6 documented observable categories for public sparse
  active positions, 4 for padded sparse batches, and 2 for dense encrypted
  windows.

For this synthetic window, padding from 18 to 32 slots records a 1.78x scalar
multiply and payload-slot increase. It masks the exact active-event count inside
the padding bucket, but still leaks the padding bucket size, the public or cover
position policy, coarse timing/sparsity metadata, and public model shape. The
attached local runtime timings are JavaScript toy-arithmetic measurements only,
not native FHE performance evidence. The metadata-exposure proxy is a taxonomy
count only, not mutual information, anonymity, side-channel, or
reconstruction-resistance proof.

### Real FHE Parameter Evidence

The repo now separates real native-library evidence from remaining measurement
gaps instead of implying that toy Paillier timing is cryptographic evidence:

```sh
npm run benchmark:openfhe -- --run --artifact
npm run benchmark:openfhe-ckks -- --run --artifact
npm run benchmark:tfhe -- --run --artifact
npm run native:doctor -- --artifact
```

Current committed native evidence:

- `benchmark-artifacts/native-evidence/latest.json`
- `benchmark-artifacts/comparisons/openfhe/latest.json`
- `benchmark-artifacts/comparisons/openfhe-ckks/latest.json`
- `benchmark-artifacts/comparisons/tfhe-rs/latest.json`
- `benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json`

The native evidence manifest currently records OpenFHE BFVrns, OpenFHE CKKS,
and TFHE-rs as `real-native-run` lanes with `dependencyDetection.available: true`
on the indexed host. The current artifact identifiers are:

- OpenFHE BFVrns: `openfhe-bfvrns-eeg-eye-state-2026-05-21`.
- OpenFHE CKKS: `openfhe-ckks-eeg-eye-state-2026-05-21`.
- TFHE-rs: `tfhe-rs-alpha-lane-framing-2026-05-29`.

This closes the old dependency-availability blocker for the indexed host, but
it does not close the native measurement coverage gap. BFVrns still lacks
serialized ciphertext byte measurements and RSS or peak-memory measurements.
CKKS still has partial, not complete, ciphertext and memory measurements.
TFHE-rs has a single synthetic run with ciphertext sizing and one current-RSS
sample, but its real-data input path remains blocked by
`benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json`.

The current release posture remains `releaseGateSatisfied: false`, and all
native-lane artifacts must preserve `productionClaim: false`. These artifacts
are not stable performance claims, side-channel evidence, privacy proofs,
medical evidence, clinical validation, or release approval.

## Validation Update May 27, 2026

The native evidence manifest now classifies measurement coverage and carries a
per-lane measurement gap index without upgrading any performance claim:

```sh
npm run native:doctor -- --artifact --artifact-id native-evidence-measurement-gap-index-2026-05-27 --generated-at 2026-05-27T20:25:00.000Z
npm run benchmark:tfhe -- --run --artifact --artifact-id tfhe-rs-memory-rss-2026-05-28 --generated-at 2026-05-28T02:26:18.000Z
npm run benchmark:tfhe -- --run --artifact --artifact-id tfhe-rs-alpha-lane-framing-2026-05-29 --generated-at 2026-05-29T14:15:00.000Z
npm run benchmark:tfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact --artifact-id tfhe-rs-realdata-blocker-2026-05-28 --generated-at 2026-05-28T08:28:49.000Z
npm run native:doctor -- --artifact --artifact-id native-evidence-tfhe-rss-2026-05-28 --generated-at 2026-05-28T02:26:18.000Z
npm run native:doctor -- --artifact --artifact-id native-evidence-tfhe-alpha-lane-framing-2026-05-29 --generated-at 2026-05-29T14:18:00.000Z
npm run baseline:plaintext -- --dataset /Users/alexanderdaly/Downloads/N-MNIST --limit-per-class 10 --artifact --artifact-id nmnist-local-blocker-2026-05-28 --generated-at 2026-05-28T16:35:00.000Z
npm run baseline:plaintext -- --dataset /Users/alexanderdaly/Downloads/N-MNIST --limit-per-class 10 --artifact --artifact-id nmnist-local-real-2026-05-28 --generated-at 2026-05-28T18:15:00.000Z
```

Current committed evidence:

- `benchmark-artifacts/native-evidence/latest.json`
- schema: `neurofhe.nativeEvidence.manifest.v1`
- ciphertext-byte coverage: one reported lane, one partial lane, one missing
  lane.
- RSS or peak-memory coverage: one reported lane, one partial lane, one
  missing lane.
- measurement gap index: four missing or partial measurement classes across
  BFVrns and CKKS, with exact rerun commands.
- TFHE-rs reports a single end-of-run current RSS sample for the synthetic
  native run, measured from the process table. It is not peak-memory,
  dataset-scale, side-channel, or stable performance evidence.
- TFHE-rs real-data input blocker: `benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json`
  records that the native TFHE-rs target does not yet accept the EEG-derived
  OpenFHE input contract. The smallest next step is an integer/Boolean TFHE-rs
  adapter or a validated transformer from the EEG contract into the TFHE-rs
  score domain.
- Public N-MNIST real-data plaintext baseline:
  `benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json` records a
  sampled nearest-centroid baseline over 10 examples per class from the local
  public N-MNIST `Train/` and `Test/` directories. It reports 66/100 correct
  examples, accuracy `0.66`, and a compression curve. This is plaintext
  preprocessing/model evidence, not encrypted-compute, production, medical, or
  deployment evidence.

This narrows diligence risk by making missing measurement classes explicit per
lane. It does not satisfy the remaining native-evidence gap: OpenFHE still
needs fuller serialized ciphertext byte reporting and RSS or peak-memory
measurements before memory or stable performance claims are defensible.

The release-evidence index now summarizes the current hosted-CI evidence, repository
hygiene result, native measurement coverage, metadata-leakage caveat, synthetic
reconstruction-risk probe caveat, real N-MNIST plaintext baseline, and TFHE-rs
real-data blocker in one dashboard artifact:

```sh
npm run release:evidence -- --artifact
```

Current committed evidence:

- `benchmark-artifacts/release-evidence/latest.json`
- schema: `neurofhe.releaseEvidenceIndex.v1`
- release gate: not satisfied.
- hosted portable CI: passing on PR #23 after restoring automatic `push` and
  `pull_request` triggers and updating GitHub action majors for the Node 24
  runner transition; remaining PR blocked state is repository ruleset policy,
  not CI/check-rollup.
- native measurement coverage: incomplete.
- metadata leakage: caveated taxonomy proxy only.
- reconstruction risk: synthetic probe only; public-position linkage remains a
  residual risk.
- real N-MNIST baseline: present as sampled plaintext evidence, accuracy
  `0.66` over 100 test examples, not encrypted-compute evidence.
- TFHE-rs real-data path: blocked with an explicit artifact and smallest next
  step.

This improves diligence navigation but is not new benchmark evidence, not a
privacy proof, and not release approval.

The repository also now publishes a synthetic reconstruction-risk probe artifact:

```sh
npm run reconstruction:risk -- --artifact
```

Current committed evidence:

- `benchmark-artifacts/reconstruction-risk/latest.json`
- schema: `neurofhe.reconstructionRiskProbes.v1`
- raw-payload replay: blocked in the synthetic gateway sentinel probe.
- active-value recovery: blocked from plaintext model-facing active positions.
- public-position linkage: residual risk remains visible.
- `privacyProofClaim: false`.

This narrows a documentation and diligence gap by making the raw-withholding
probe reproducible. It does not prove reconstruction resistance, identity
obfuscation, mutual-information bounds, side-channel resistance, or
membership/linkage safety.

## Examiner-Risk Notes Added May 21, 2026

The highest-risk broad claim posture is "local neural compression plus encrypted inference" without a concrete implementation limit. The stronger near-term claim posture is the spatial sparse-event relay:

```text
local spatial spike sorter -> permitted active positions -> encrypted active feature values -> BFVrns depth-1 scorer -> local authorized decryption
```

Evidence still needed for nonprovisional conversion:

- Real OpenFHE BFVrns benchmark results on the native target, including latency, memory, ciphertext size, parameter set, and noise-budget observations.
- Dense/raw versus public-position versus padded-sparse versus dense-window comparison on a real event dataset such as N-MNIST or another rights-cleared neural/event dataset.
- Reconstruction and identity-linkage attack results for dense raw windows, unsorted sparse events, spatial-sorted events, and padded sparse batches.
- A counsel-verified prior-art chart against PrivSpike, SpENCNN, Nikfam BFV-SNN, FHE-DiSNN, and any closer patent families.
