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
tests 25
pass 25
fail 0
```

Covered behaviours:

- Toy additive HE addition and scalar multiplication.
- Event-window validation and sparse metrics.
- Plaintext and encrypted classifier agreement.
- Linear model metadata, dense/sparse matrix-vector agreement, public bias, and model validation.
- Benchmark accuracy, latency, ciphertext bytes, operation counts, security parameters, privacy boundary, crypto inventory, dense baseline comparison, and three privacy modes.
- Representation benchmark comparing dense/raw windows, unsorted spikes, and spatial-sorted events on the same `scores = W x + bias` task, including sorted-event crypto inventory and privacy boundary metadata.
- Spatial spike sorting from simulated raw neural-like intake into stable event windows.
- Relay gateway raw-intake summarization, canonical sorter insertion, sorted-event input validation and sanitization, normalization, minimal model-facing event export, raw-leakage checks, accepted safe local recommendations, rejected unsafe command recommendations, and strict policy blocking.
- Benchmark artifact publishing to timestamped run JSON and `latest.json`.
- OpenFHE contract validation, native build-plan detection, and C++ API source markers.
- N-MNIST 40-bit event parsing, feature extraction, and plaintext baseline evaluation.
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
    "modes": [
      {
        "id": "public-active-positions",
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
  "results": {
    "plaintextMatchesEncrypted": true,
    "classification": "anomaly"
  }
}
```

### Published Benchmark Artifact

Command:

```sh
npm run benchmark:artifact --silent
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

The current published artifact is `benchmark-artifacts/latest.json`.

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
  "sourcePath": "prototype/openfhe/openfhe_linear_demo.cpp",
  "cmakePath": "prototype/openfhe/CMakeLists.txt",
  "buildDirectory": "build/openfhe"
}
```

Local native execution status:

```text
OpenFHEConfig.cmake not found
```

The real BFVrns C++ target is present, but this machine does not currently
have OpenFHE installed or discoverable by CMake.

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

Expected result:

```text
Requires a local extracted N-MNIST directory. The dataset is not bundled in this repository.
```

The parser and baseline engine are covered by the Node test suite using small in-memory N-MNIST-compatible event records.

### Placeholder Scan

Command:

```sh
node prototype/scripts/placeholder-scan.mjs
```

Result:

```text
placeholder scan ok
```

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

## Scope Note

The runnable dependency-free prototype is still research-grade and uses educational additive HE only. The repository now also includes a real OpenFHE BFVrns native integration target for the same sparse score contract, gated on a local OpenFHE installation.
