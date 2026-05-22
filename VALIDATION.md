# Validation

Validated locally on 2026-05-21.

Commands below are written for the standalone package root.

## Checks Run

### Node Test Suite

Command:

```sh
npm test
```

Result summary:

```text
tests 55
pass 55
fail 0
```

Covered behaviours:

- Toy additive HE addition and scalar multiplication.
- Event-window validation and sparse metrics.
- Plaintext and encrypted classifier agreement.
- Linear model metadata, dense/sparse matrix-vector agreement, public bias, and model validation.
- Benchmark accuracy, latency, ciphertext bytes, operation counts, security parameters, privacy boundary, crypto inventory, dense baseline comparison, four privacy modes, privacy-mode decision, packed-vector planning, and framing guardrail.
- Representation benchmark comparing dense/raw windows, unsorted spikes, and spatial-sorted events on the same `scores = W x + bias` task, including sorted-event crypto inventory, reconstruction-resistance posture, and privacy boundary metadata.
- Spatial-cluster readiness evaluation showing sorted events are adapter-ready for future SNN experiments, ready now for the lightweight encrypted linear score contract, and research-only for nonlinear encrypted model paths.
- Spatial spike sorting from simulated raw neural-like intake into stable event windows.
- Relay gateway raw-intake summarization, canonical sorter insertion, sorted-event input validation and sanitization, optional cortical region/layer context aggregation or encrypted export, sorted-event reconstruction-resistance checks, normalization, minimal model-facing event export, raw-leakage checks, accepted safe local recommendations, rejected unsafe command recommendations, and strict policy blocking.
- Benchmark artifact publishing to timestamped run JSON and `latest.json`.
- Padding ablation output for sparse metadata leakage versus padded sparse and dense encrypted-window overhead.
- Comparison artifact publishing for adapter plans and future native library runs.
- OpenFHE sorted-event contract validation, digest-bound real-library adapter manifest, native build-plan detection, C++ API source markers, real-data-derived input-contract loading, and BFVrns native run artifact publishing.
- OpenFHE CKKS approximate-real sorted-event contract validation, digest-bound real-library adapter manifest, CKKS parameter inventory, privacy boundary, native build-plan detection, real-data-derived input-contract loading, comparison artifact publishing, and C++ CKKS API source markers.
- TFHE-rs sorted-event contract validation, digest-bound real-library adapter manifest, Cargo build-plan detection, Rust source markers, encrypted threshold-gate metadata, TFHE-vs-OpenFHE comparison notes, and comparison artifact publishing.
- N-MNIST 40-bit event parsing, feature extraction, plaintext baseline evaluation, smoke fixture generation, and compression-curve output.
- UCI EEG Eye State ARFF parsing, sparse latent event projection, plaintext baseline evaluation, OpenFHE-ready input-contract emission, bounded sample-index selection, real-data privacy caveats, and active-budget compression-curve output.
- Research assumptions with clean-room and naming guardrails.

### Desk Demo

Command:

```sh
npm run demo --silent
```

Result summary:

```json
{
  "demo": "toy encrypted sparse spike-count classifier",
  "prototypeCodename": "Relay-2 Diagnostic Demo",
  "boundaryDomain": "bio-digital-event-intelligence",
  "eventWindow": {
    "schema": "neurofhe.events.v1.demo",
    "shape": [8, 8],
    "encoding": "binary-spike-count",
    "spikeCount": 18,
    "density": 0.2813
  },
  "operationCounts": {
    "encryptions": 20,
    "scalarMultiplies": 36,
    "adds": 36,
    "decryptions": 2
  },
  "decryptedScores": {
    "normal": 9,
    "anomaly": 51
  },
  "classification": "anomaly"
}
```

### Relay Gateway Demo

Command:

```sh
npm run gateway:demo --silent
```

Result summary:

```json
{
  "schema": "neurofhe.gateway.demo.v1",
  "boundaryDomain": "bio-digital-event-intelligence",
  "rawIntake": {
    "sensitivity": "sensitive-by-default",
    "rawPayload": "withheld-local-only"
  },
  "policyDecision": {
    "decision": "approved",
    "modelFacingEvent": {
      "schema": "neurofhe.gateway.modelEvent.v1",
      "boundary": "local-trust-boundary-approved-export",
      "productionClaim": false,
      "plaintext": {
        "encoder": {
          "id": "canonical-spatial-aware-spike-sorter-v1",
          "implementationTarget": "fpga-or-edge-fsm"
        },
        "sparseMetrics": {
          "activeEventCount": 18,
          "densityBucket": "0.25-0.5"
        }
      },
      "encrypted": {
        "activeSpikeValues": "18 ciphertext references"
      }
    }
  },
  "acceptedDecision": {
    "decision": "accepted",
    "approvedAction": {
      "actionType": "annotate_local_session",
      "executionScope": "safe-local-reversible"
    }
  },
  "rejectedDecision": {
    "decision": "rejected",
    "reasons": [
      "raw device commands are blocked",
      "action type raw_device_command is blocked"
    ]
  },
  "sanitizedReplayStream": {
    "containsRawPayload": false
  }
}
```

The gateway demo is simulated and intentionally exports no raw signal payload.

### Benchmark

Command:

```sh
npm run benchmark --silent
```

Result summary:

```json
{
  "schema": "neurofhe.benchmark.v1",
  "dataset": "synthetic-events-v0",
  "model": "tiny-linear-spike-count-v0",
  "scheme": "toy-paillier-additive-research-only",
  "boundaryDomain": "bio-digital-event-intelligence",
  "productionClaim": false,
  "linearModel": {
    "schema": "neurofhe.linearModel.v1",
    "scoreEquation": "scores = W x + bias",
    "matrixShape": [2, 64],
    "activeEventCount": 18
  },
  "sparseMetrics": {
    "featureCount": 64,
    "spikeCount": 18,
    "density": 0.28125
  },
  "accuracy": {
    "metric": "single-window-plaintext-agreement",
    "value": 1,
    "sampleCount": 1
  },
  "operationCounts": {
    "encryptions": 20,
    "scalarMultiplies": 36,
    "adds": 36,
    "decryptions": 2
  },
  "ciphertextBytes": 200,
  "securityParameters": {
    "scheme": "toy-paillier-additive-research-only",
    "publicModulusBits": 40,
    "ciphertextModulusBits": 80,
    "productionClaim": false
  },
  "denseBaseline": {
    "operationCounts": {
      "encryptions": 66,
      "scalarMultiplies": 128,
      "adds": 128,
      "decryptions": 2
    }
  },
  "representationComparison": {
    "schema": "neurofhe.representationComparison.v1",
    "representations": [
      {
        "id": "dense-raw-window",
        "encryptedFeatureSlots": 64,
        "scalarMultiplies": 128
      },
      {
        "id": "unsorted-spikes",
        "encryptedFeatureSlots": 18,
        "scalarMultiplies": 36
      },
      {
        "id": "spatial-sorted-events",
        "encryptedFeatureSlots": 18,
        "scalarMultiplies": 36
      }
    ]
  },
  "privacyModes": {
    "schema": "neurofhe.privacyModes.v1",
    "decision": {
      "schema": "neurofhe.privacyModeDecision.v1",
      "recommendedMode": "padded-sparse-batches"
    },
    "modes": [
      {
        "id": "public-active-positions",
        "encryptedFeatureSlots": 18,
        "scalarMultiplies": 36,
        "relativeScalarMultiplies": 1
      },
      {
        "id": "public-active-neuron-positions-encrypted-features",
        "encryptedFeatureSlots": 18,
        "scalarMultiplies": 36,
        "relativeScalarMultiplies": 1
      },
      {
        "id": "padded-sparse-batches",
        "encryptedFeatureSlots": 32,
        "scalarMultiplies": 64,
        "relativeScalarMultiplies": 1.78
      },
      {
        "id": "dense-encrypted-windows",
        "encryptedFeatureSlots": 64,
        "scalarMultiplies": 128,
        "relativeScalarMultiplies": 3.56
      }
    ]
  },
  "packedVectorPlanning": {
    "schema": "neurofhe.packedVectorPlanning.v1",
    "defaultLane": "bfv-bgv-packed-integer",
    "lanes": ["bfv-bgv-packed-integer", "ckks-packed-approximate"]
  },
  "nativeComparisonLanes": {
    "schema": "neurofhe.nativeLaneComparison.v1",
    "lanes": [
      "openfhe-bfvrns-integer",
      "openfhe-ckks-approximate",
      "tfhe-rs-threshold"
    ]
  },
  "framingGuardrail": {
    "schema": "neurofhe.framingGuardrail.v1",
    "preferredFrame": "privacy-preserving event intelligence",
    "avoidClaims": ["medical diagnosis", "treatment"]
  },
  "spatialClusterReadiness": {
    "schema": "neurofhe.spatialClusterReadiness.v1",
    "sourceRepresentation": "spatial-sorted-events",
    "clusteringBasis": "deterministic spatial bins, not learned neural clusters",
    "conclusion": "yes-with-adapters",
    "snnPath": {
      "status": "adapter-ready",
      "directFeed": false,
      "eventStreamCompatible": true,
      "feedFields": ["timeBin", "neuronId", "unitX", "unitY", "value"]
    },
    "lightweightEncryptedLinearPath": {
      "status": "ready-now",
      "privacyMode": "public-active-neuron-positions-encrypted-features",
      "encryptedFeatureSlots": 18
    },
    "lightweightEncryptedNonlinearPath": {
      "status": "research-only"
    }
  },
  "results": {
    "plaintextMatchesEncrypted": true,
    "classification": "anomaly"
  }
}
```

### Published Benchmark Artifact

Command:

```sh
tmpdir=$(mktemp -d); npm run benchmark:artifact -- --out "$tmpdir/benchmark-artifacts" --seed 91
```

Result summary:

```json
{
  "schema": "neurofhe.benchmarkArtifact.publish.v1",
  "paths": {
    "run": "benchmark-artifacts/runs/<artifact-id>.json",
    "latest": "benchmark-artifacts/latest.json"
  },
  "requiredFields": [
    "accuracy",
    "latencyMs",
    "ciphertextBytes",
    "operationCounts",
    "securityParameters",
    "privacyBoundary",
    "cryptoInventory"
  ]
}
```

The publisher was validated against a temporary output directory so this check
did not refresh the committed `benchmark-artifacts/latest.json`.

### Plaintext N-MNIST-Format Fixture Artifact

Command:

```sh
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact --artifact-id nmnist-smoke-fixture-2026-05-21 --generated-at 2026-05-21T12:10:00.000Z
```

Published artifact:

```text
benchmark-artifacts/plaintext-baselines/nmnist-smoke/latest.json
benchmark-artifacts/plaintext-baselines/nmnist-smoke/runs/nmnist-smoke-fixture-2026-05-21.json
```

Result summary:

```json
{
  "schema": "neurofhe.plaintextBaseline.v1",
  "evidenceClass": "format-fixture-smoke-test",
  "source": {
    "datasetKind": "nmnist-format-smoke-fixture",
    "isRealDataset": false
  },
  "featureShape": [4, 8, 8, 2],
  "accuracy": 1,
  "compressionCurve": [
    {"level": "grid-1-time-1", "compressionFactorVsReference": 256, "accuracy": 0.5},
    {"level": "grid-2-time-2", "compressionFactorVsReference": 32, "accuracy": 1},
    {"level": "grid-4-time-2", "compressionFactorVsReference": 8, "accuracy": 1},
    {"level": "grid-8-time-4", "compressionFactorVsReference": 1, "accuracy": 1}
  ]
}
```

This validates the N-MNIST 40-bit parser, feature extraction, plaintext
classifier, compression-curve reporting, and artifact shape. It is not sampled
from the public N-MNIST recordings and is not real-data accuracy.

### Public N-MNIST Local Dataset Blocker

Command attempted:

```sh
npm run baseline:plaintext -- --dataset /Users/alexanderdaly/Downloads/N-MNIST --limit-per-class 10 --artifact --artifact-id nmnist-local-blocker-2026-05-21 --generated-at 2026-05-21T12:11:00.000Z
```

Result:

```text
exit 2
ENOENT: no such file or directory, scandir '/Users/alexanderdaly/Downloads/N-MNIST/Train'
```

Published artifact:

```text
benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/latest.json
benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/runs/nmnist-local-blocker-2026-05-21.json
```

The artifact is a `neurofhe.plaintextBaseline.unavailable.v1` blocker report,
not a failed silent benchmark. It records the exact rerun command and the
smallest next step: download and extract public N-MNIST `Train/` and `Test/`
directories outside git, then rerun with `--artifact`.

Dataset provenance for the intended real-data lane:

- N-MNIST dataset page: https://www.garrickorchard.com/datasets/n-mnist
- Mendeley Data DOI: 10.17632/468j46mzdv.1

### Privacy-Mode Padding Ablation Artifact

Command:

```sh
npm run benchmark:privacy-modes -- --iterations 25 --padded-slot-count 32 --artifact --artifact-id padding-ablation-2026-05-21 --generated-at 2026-05-21T12:12:00.000Z
```

Published artifact:

```text
benchmark-artifacts/privacy-modes/padding-ablation/latest.json
benchmark-artifacts/privacy-modes/padding-ablation/runs/padding-ablation-2026-05-21.json
```

Result summary:

```json
{
  "schema": "neurofhe.metadataPaddingAblation.v1",
  "measurementBasis": "synthetic-events-v0 operation-count model plus local toy arithmetic timing",
  "modes": [
    {"id": "public-active-neuron-positions-encrypted-features", "encryptedFeatureSlots": 18, "scalarMultiplies": 36, "relativeScalarMultiplies": 1},
    {"id": "padded-sparse-batches", "encryptedFeatureSlots": 32, "scalarMultiplies": 64, "relativeScalarMultiplies": 1.78},
    {"id": "dense-encrypted-windows", "encryptedFeatureSlots": 64, "scalarMultiplies": 128, "relativeScalarMultiplies": 3.56}
  ]
}
```

For the current synthetic 18-event window, padding to 32 slots masks the exact
active-event count inside a bucket at 1.78x scalar multiplies and 1.78x payload
slots. It does not hide bucket size, public or cover position policy, coarse
timing/sparsity metadata, or public model shape. The recorded local latency
measurements are deterministic Node toy-arithmetic timings only, not native FHE
performance evidence.

### OpenFHE Integration Plan

Command:

```sh
npm run benchmark:openfhe --silent
```

Result summary:

```json
{
  "schema": "neurofhe.openfhe.integrationPlan.v1",
  "nativeTarget": "openfhe_linear_demo",
  "scheme": "openfhe-bfvrns",
  "adapter": {
    "schema": "neurofhe.realLibraryAdapter.v1",
    "adapterId": "openfhe-bfvrns-sparse-linear-v1",
    "contractDigest": {
      "algorithm": "sha256"
    },
    "contractValidation": {
      "status": "valid",
      "errors": []
    }
  },
  "sourcePath": "prototype/openfhe/openfhe_linear_demo.cpp",
  "cmakePath": "prototype/openfhe/CMakeLists.txt",
  "buildDirectory": "build/openfhe"
}
```

Local native execution status: OpenFHE is installed and discoverable locally
through CMake. The BFVrns binary now supports a JSON input-contract path for
the UCI EEG Eye State derived sparse window. CMake reported OpenFHE `1.5.1`
from `/opt/homebrew`.

### OpenFHE BFVrns Real-Data Contract Artifact

Generate the OpenFHE input contracts from the public UCI EEG Eye State baseline:

```sh
npm run contract:eeg-openfhe -- --generated-at 2026-05-21T18:15:00.000Z
```

Published contract summary:

```json
{
  "schema": "neurofhe.openfheInputContract.publish.v1",
  "datasetKind": "public-uci-eeg-eye-state-arff",
  "contractSummary": {
    "featureShape": [8, 8],
    "matrixShape": [2, 64],
    "activeEventCount": 32,
    "classes": ["eye-closed", "eye-open"],
    "expectedClassification": "eye-closed",
    "quantizedExpectedClassification": "eye-closed",
    "fixedPointScale": 10,
    "scoreFitsCenteredPlaintextModulus": true
  }
}
```

Published files:

```text
benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/latest.json
benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json
benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json
```

Run BFVrns against the generated fixed-point contract:

```sh
npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact --artifact-id openfhe-bfvrns-eeg-eye-state-2026-05-21 --generated-at 2026-05-21T18:22:00.000Z
```

Published artifact:

```text
benchmark-artifacts/comparisons/openfhe/latest.json
benchmark-artifacts/comparisons/openfhe/runs/openfhe-bfvrns-eeg-eye-state-2026-05-21.json
```

Result summary:

```json
{
  "schema": "neurofhe.openfhe.result.v1",
  "inputSource": "external-contract",
  "datasetKind": "public-uci-eeg-eye-state-arff",
  "featureShape": [8, 8],
  "matrixShape": [2, 64],
  "activeEventCount": 32,
  "fixedPointScale": 10,
  "scores": {
    "eye-closed": 21,
    "eye-open": -44
  },
  "classification": "eye-closed",
  "expectedClassification": "eye-closed",
  "plaintextMatchesExpected": true,
  "operationCounts": {
    "encryptions": 34,
    "scalarMultiplies": 64,
    "adds": 64,
    "decryptions": 2
  },
  "parameterEvidence": {
    "scheme": "BFVrns",
    "securityLevelTarget": "HEStd_128_classic",
    "plaintextModulus": 65537,
    "multiplicativeDepth": 1,
    "batchSize": 1,
    "ciphertextCiphertextMultiplications": 0,
    "relinearizationRequired": false,
    "noiseBudget": "not reported by this portable demo"
  },
  "productionClaim": false
}
```

The BFVrns path uses a signed fixed-point view of the EEG-derived approximate
features. This is real native OpenFHE execution on a derived public-data input
contract, not a medical, production-security, or broad performance claim.
Ciphertext serialization bytes and OpenFHE-internal noise budget are still not
reported by this portable demo.

### OpenFHE CKKS Integration Plan

Command:

```sh
npm run benchmark:openfhe-ckks -- --adapter
```

Result summary:

```json
{
  "schema": "neurofhe.realLibraryAdapter.v1",
  "adapterId": "openfhe-ckks-sparse-approx-linear-v1",
  "library": {
    "name": "OpenFHE",
    "scheme": "CKKS"
  },
  "contract": {
    "schema": "neurofhe.openfheCkks.contract.v1",
    "scheme": "openfhe-ckks",
    "scoreEquation": "scores = W x + bias",
    "scoreDomain": "approximate-real",
    "featureValueDomain": "approximate-real-neural-features",
    "matrixShape": [2, 64],
    "activeEventCount": 18,
    "expectedPlaintextScores": {
      "normal": 9,
      "anomaly": 51
    },
    "ckksParameters": {
      "multiplicativeDepth": 2,
      "scalingModSize": 50,
      "firstModSize": 60,
      "batchSize": 64,
      "securityLevel": "HEStd_128_classic",
      "rescalingTechnique": "FLEXIBLEAUTO",
      "defaultMode": "leveled-no-bootstrap"
    },
    "operationCounts": {
      "encryptions": 20,
      "plaintextMultiplies": 36,
      "adds": 36,
      "rescaleOrModReduceOps": 36,
      "decryptions": 2
    }
  },
  "contractValidation": {
    "status": "valid",
    "errors": []
  }
}
```

Local native execution status: OpenFHE is installed and discoverable locally
through CMake. The CKKS binary supports the same JSON input-contract path and
consumes the approximate-real EEG-derived sparse values directly. CMake
reported OpenFHE `1.5.1` from `/opt/homebrew`.

### OpenFHE CKKS Real-Data Contract Artifact

Run CKKS against the generated approximate-real contract:

```sh
npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact --artifact-id openfhe-ckks-eeg-eye-state-2026-05-21 --generated-at 2026-05-21T18:20:00.000Z
```

Published artifact:

```text
benchmark-artifacts/comparisons/openfhe-ckks/latest.json
benchmark-artifacts/comparisons/openfhe-ckks/runs/openfhe-ckks-eeg-eye-state-2026-05-21.json
```

Result summary:

```json
{
  "schema": "neurofhe.openfheCkks.result.v1",
  "inputSource": "external-contract",
  "datasetKind": "public-uci-eeg-eye-state-arff",
  "featureShape": [8, 8],
  "matrixShape": [2, 64],
  "activeEventCount": 32,
  "scores": {
    "eye-closed": 0.0739801034395,
    "eye-open": -0.524073476558
  },
  "classification": "eye-closed",
  "expectedClassification": "eye-closed",
  "precision": {
    "maxAbsScoreError": 7.21256387948E-12,
    "tolerance": 0.001,
    "withinTolerance": true,
    "classificationAgreement": true
  },
  "latencyMs": {
    "encryption": 134.964292,
    "linearScoring": 36.952333,
    "decryption": 11.744583
  },
  "operationCounts": {
    "encryptions": 34,
    "scalarMultiplies": 64,
    "plaintextMultiplies": 64,
    "adds": 64,
    "rescaleOrModReduceOps": 64,
    "decryptions": 2
  },
  "ckksParameters": {
    "multiplicativeDepth": 2,
    "scalingModSize": 50,
    "firstModSize": 60,
    "batchSize": 64,
    "securityLevel": "HEStd_128_classic",
    "rescalingTechnique": "FLEXIBLEAUTO",
    "defaultMode": "leveled-no-bootstrap"
  },
  "productionClaim": false
}
```

The CKKS path is the more natural native lane for this EEG-derived contract
because the active values and weights are approximate reals. The measured
latencies are local laptop timings for one shallow 32-active-event window and
should not be generalized without repeated runs, serialized ciphertext sizing,
and a larger dataset sweep.

### OpenFHE Comparison Artifact

Command:

```sh
tmpdir=$(mktemp -d); npm run benchmark:openfhe -- --artifact --out "$tmpdir/openfhe-comparison"
```

Result summary:

```json
{
  "schema": "neurofhe.comparisonArtifact.publish.v1",
  "subjectSchema": "neurofhe.openfhe.integrationPlan.v1",
  "paths": {
    "run": "<tmp>/openfhe-comparison/runs/<artifact-id>.json",
    "latest": "<tmp>/openfhe-comparison/latest.json"
  }
}
```

This validates optional on-disk comparison artifacts without adding generated
OpenFHE comparison JSON to the repository.

### TFHE-rs Integration Plan

Command:

```sh
npm run benchmark:tfhe -- --adapter
```

Result summary:

```json
{
  "schema": "neurofhe.realLibraryAdapter.v1",
  "adapterId": "tfhe-rs-sparse-integer-threshold-v1",
  "library": {
    "name": "TFHE-rs",
    "crate": "tfhe",
    "version": "1.6.1",
    "scheme": "TFHE integer + Boolean threshold"
  },
  "contract": {
    "schema": "neurofhe.tfheRs.contract.v1",
    "scheme": "tfhe-rs-integer-threshold",
    "scoreEquation": "scores = W x + bias",
    "matrixShape": [2, 64],
    "activeEventCount": 18,
    "expectedPlaintextScores": {
      "normal": 9,
      "anomaly": 51
    },
    "booleanDecision": {
      "gate": "anomaly_score_gt_normal_score",
      "encryptedResultType": "FheBool",
      "expectedPlaintext": true
    }
  },
  "contractValidation": {
    "status": "valid",
    "errors": []
  }
}
```

### TFHE-rs Rust Tests

Command:

```sh
cargo test --manifest-path prototype/tfhe-rs/Cargo.toml
```

Result summary:

```text
2 passed; 0 failed
```

The Rust unit tests validate the stable 8x8 sorted-event window, 18 active
events, public active-neuron-position projection, plaintext scores
`normal: 9` / `anomaly: 51`, and final classification `anomaly`.

### TFHE-rs Native Run And Artifact

Command:

```sh
npm run benchmark:tfhe -- --run --artifact --artifact-id tfhe-validation-2026-05-21 --generated-at 2026-05-21T12:15:00.000Z
```

Result summary:

```json
{
  "schema": "neurofhe.tfheRs.result.v1",
  "scheme": "tfhe-rs-integer-threshold",
  "scores": {
    "normal": 9,
    "anomaly": 51
  },
  "classification": "anomaly",
  "booleanDecision": {
    "gate": "anomaly_score_gt_normal_score",
    "decrypted": true,
    "matchesExpected": true
  },
  "operationCounts": {
    "encryptions": 20,
    "scalarMultiplies": 36,
    "adds": 36,
    "encryptedComparisons": 1,
    "decryptions": 3
  },
  "ciphertextBytes": {
    "activeValueCiphertexts": 2377818,
    "classScoreCiphertexts": 264202,
    "thresholdDecisionBit": 16593,
    "total": 2658613
  },
  "latencyMs": 7200.658,
  "productionClaim": false
}
```

Published artifact:

```text
benchmark-artifacts/comparisons/tfhe-rs/latest.json
benchmark-artifacts/comparisons/tfhe-rs/runs/tfhe-validation-2026-05-21.json
```

The TFHE-rs result is a single local synthetic 8x8 run. The latency is not a
stable performance claim; use it only as a research-grade comparison record.

### JSON Validation

Command:

```sh
node -e "JSON.parse(require('fs').readFileSync('project-brief.json','utf8')); JSON.parse(require('fs').readFileSync('prototype/research-assumptions.json','utf8')); console.log('json ok')"
```

Result:

```text
json ok
```

### Plaintext Baseline CLI

Command:

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

Expected behaviour:

```text
Requires a local extracted N-MNIST directory. The dataset is not bundled in this repository. Add --artifact to persist an unavailable-dataset blocker report instead of losing the failure context.
```

The parser and baseline engine are covered by the Node test suite using
in-memory N-MNIST-compatible event records and the committed `nmnist-smoke`
fixture artifact.

### UCI EEG Eye State Real-Data Baseline

Command:

```sh
npm run baseline:plaintext -- --source eeg-eye-state --fetch --artifact --artifact-id eeg-eye-state-real-2026-05-21 --generated-at 2026-05-21T17:30:00.000Z
```

Result summary:

```json
{
  "datasetKind": "public-uci-eeg-eye-state-arff",
  "rows": 14980,
  "featureShape": [8, 8],
  "matrixShape": [2, 64],
  "split": "chronological 70/30",
  "accuracy": 0.536542,
  "correct": 301,
  "total": 561,
  "activeBudgetCompressionLevels": [8, 16, 32, 64],
  "productionClaim": false
}
```

Published artifact:

```text
benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json
benchmark-artifacts/plaintext-baselines/eeg-eye-state/runs/eeg-eye-state-real-2026-05-21.json
```

The raw ARFF is cached under `.cache/` and is not committed. This result is
real-data plaintext preprocessing/model evidence only. It does not show
encrypted runtime on the real dataset, medical validity, or generalization.

### Placeholder Scan

Command:

```sh
node prototype/scripts/placeholder-scan.mjs
```

Result:

```text
placeholder scan ok
```

The scanner skips generated directories such as `target/`, `build/`, `dist/`,
and `outputs/` so Cargo build products are not read as source text.

### ASCII Scan

Command:

```sh
node - <<'NODE'
const fs = require('fs');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = `${dir}/${d.name}`;
    if (p.includes('/.git/')) return [];
    return d.isDirectory() ? walk(p) : [p];
  });
}
let ok = true;
for (const path of walk('.')) {
  const text = fs.readFileSync(path, 'utf8');
  const bad = [...new Set([...text].filter(ch => ch.charCodeAt(0) > 127))];
  if (bad.length) {
    ok = false;
    console.log(path, bad.join(''));
  }
}
console.log(ok ? 'ascii scan complete' : 'non-ascii found');
process.exit(ok ? 0 : 1);
NODE
```

Result:

```text
ascii scan complete
```

### GitHub Actions CI Blocker

PR #6 adds portable GitHub Actions validation for the same local gate and smoke
artifact generation. The latest remote check did not reach any runner steps.

GitHub check-run annotation:

```text
The job was not started because your account is locked due to a billing issue.
```

Observed metadata:

```json
{
  "runId": 26293465330,
  "jobId": 77399634587,
  "checkName": "Portable validation",
  "conclusion": "failure",
  "steps": [],
  "runnerName": ""
}
```

Log fetch command:

```sh
gh run view 26293465330 --log-failed
```

Result:

```text
log not found: 77399634587
```

Committed blocker artifact:

```text
benchmark-artifacts/ci-blockers/latest.json
benchmark-artifacts/ci-blockers/runs/github-actions-billing-lock-2026-05-22.json
```

This is an account/billing blocker, not evidence of a test or workflow-step
failure. Local parity validation on the PR branch passed with `npm run ci`,
smoke artifact generation into a temporary directory, and `git diff --check`.

## Scope Note

The runnable dependency-free prototype is still research-grade and uses educational additive HE only. The repository now also includes digest-bound real-library adapter manifests plus real OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs native integration targets for the same sparse sorted-event score contract. The committed OpenFHE native artifacts were produced on a local machine with OpenFHE installed under the CMake search path; other reviewers need a local OpenFHE install to reproduce them. TFHE-rs runs through Cargo with the `tfhe` crate. Bio-digital language remains scoped to privacy-preserving event intelligence, not medical diagnosis or treatment.
