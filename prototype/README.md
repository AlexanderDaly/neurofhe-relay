# NeuroFHE Relay Prototype

This is a dependency-free prototype for the first bio-digital privacy boundary.

The JavaScript modules are a reference harness, not the target low-level
runtime. They keep the public contract runnable anywhere and provide tests for
the schema, benchmark shape, privacy boundary, and toy arithmetic. The
performance path should move into native OpenFHE/SEAL/TFHE-rs/Concrete code and
native or hardware-aware encoder implementations.

For a compact navigation map of entrypoints, library modules, native lanes, and
supporting notes, see `docs/prototype-map.md`.

It uses an educational additive homomorphic encryption toy based on Paillier-style arithmetic to classify a synthetic sparse event window. It is not production cryptography and it is not full FHE. Its purpose is to make the product claim testable:

1. The edge receives raw neural-like samples locally.
2. The canonical spatial-aware spike sorter converts them into a sparse spike/event window.
3. The client exposes approved active event positions and encrypts active spike counts.
4. The compute side evaluates public linear class weights over ciphertext active events.
5. The keyholder decrypts the final class scores.

The active-event representation lowers encrypted operations but reveals a sparsity/timing pattern. A later privacy mode can pad, batch, or encrypt dense windows when the metadata is too sensitive.

Run:

```sh
npm run demo
```

Emit the benchmark JSON:

```sh
npm run benchmark
```

The benchmark includes `nativeComparisonLanes` for the BFVrns integer lane, the
CKKS approximate-real lane, and the TFHE-rs threshold lane on the same synthetic
8x8 event window.

Publish a benchmark artifact under `benchmark-artifacts/`:

```sh
npm run benchmark:artifact
```

Each artifact includes accuracy, latency, ciphertext bytes, operation counts,
security parameters, privacy boundary, crypto inventory, and spatial-cluster
readiness for future SNN or lightweight encrypted model paths. It also includes
packed-vector planning notes, a privacy-mode decision, and a framing guardrail
for privacy-preserving event intelligence rather than diagnosis or treatment.

The benchmark now compares four privacy modes for the same `scores = W x + bias`
contract:

- Public active positions: 18 encrypted feature slots, fastest, leaks exact timing/sparsity metadata.
- Public active neuron positions + encrypted features: 18 encrypted feature slots, sorted-event OpenFHE target mode, leaks active neuron identity and time-bin pattern.
- Padded sparse batches: 32 encrypted feature slots, middle ground, hides exact active count inside a bucket.
- Dense encrypted windows: 64 encrypted feature slots, slowest, hides sparsity better by encrypting zero and non-zero positions alike.

Publish the current padding ablation:

```sh
npm run benchmark:privacy-modes -- --artifact
```

It also compares three input representations on the same task:

- Dense/raw window: 64 encrypted feature slots, complete dense reference path.
- Unsorted spikes: 18 encrypted feature slots, keeps raw sample order and electrode metadata visible.
- Spatial-sorted events: 18 encrypted feature slots, canonical sorter path with spatial-bin provenance, crypto inventory, reconstruction-resistance checks, and explicit sorted-event privacy boundary.

The `spatialClusterReadiness` block answers whether sorted spatial clusters can
feed downstream models:

- SNN path: adapter-ready, not direct trained-SNN behavior. It needs count-to-spike-train expansion, neuron-index mapping, timestep duration calibration, and membrane/synapse model selection.
- Lightweight encrypted linear path: ready now for the fixed sparse `scores = W x + bias` scorer, with public active neuron positions and encrypted feature values.
- Lightweight encrypted nonlinear path: research-only until polynomial, lookup-table, or threshold-gate costs are measured under reviewed HE parameters.

Print the real OpenFHE BFVrns integration plan:

```sh
npm run benchmark:openfhe
```

Write an optional OpenFHE comparison artifact:

```sh
npm run benchmark:openfhe -- --artifact
```

Run the native OpenFHE BFVrns demo:

```sh
npm run benchmark:openfhe -- --run
```

Print the OpenFHE CKKS approximate real-number integration plan:

```sh
npm run benchmark:openfhe-ckks
```

Run the native OpenFHE CKKS approximate sparse scoring demo:

```sh
npm run benchmark:openfhe-ckks -- --run
```

Write an optional OpenFHE CKKS comparison artifact:

```sh
npm run benchmark:openfhe-ckks -- --run --artifact
```

Print the TFHE-rs integration plan:

```sh
npm run benchmark:tfhe
```

Run the native TFHE-rs integer/Boolean threshold demo:

```sh
npm run benchmark:tfhe -- --run
```

Write an optional TFHE-rs comparison artifact:

```sh
npm run benchmark:tfhe -- --run --artifact
```

Run tests:

```sh
npm test
```

Run the plaintext real-data baseline against a local N-MNIST directory:

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

Run the real public UCI EEG Eye State baseline:

```sh
npm run baseline:eeg-eye-state -- --artifact
npm run baseline:plaintext -- --source eeg-eye-state --fetch --artifact
```

The EEG path downloads the ARFF into `.cache/`, converts chronological EEG rows
into sparse latent event windows with public active positions and signed
z-score active values, trains the same nearest-centroid linear `scores = W x +
bias` contract, and writes the derived artifact under
`benchmark-artifacts/plaintext-baselines/eeg-eye-state/`.

Generate the OpenFHE-ready single-window contract and run both OpenFHE lanes on
that derived real-data input:

```sh
npm run contract:eeg-openfhe
npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact
```

This is native encrypted execution on one derived public-data sparse window,
not a replacement for a multi-window dataset sweep.

Run the deterministic N-MNIST-format smoke fixture:

```sh
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact
```

The fixture validates parsing, feature extraction, compression-curve reporting,
and artifact publishing. It is not real N-MNIST accuracy.

Current modules:

- `lib/math.mjs` - BigInt modular arithmetic helpers.
- `lib/toy-paillier.mjs` - educational additive HE adapter.
- `lib/events.mjs` - event-window construction, validation, flattening, and sparse metrics.
- `lib/spike-sorter.mjs` - canonical spatial-aware spike sorter for raw neural-like intake, designed around FPGA- or edge-friendly integer operations.
- `lib/linear-algebra.mjs` - model metadata, dense matrix-vector scoring, sparse event scoring, and model validation.
- `lib/nmnist.mjs` - N-MNIST event parsing, feature extraction, and plaintext baseline evaluation.
- `lib/eeg-eye-state.mjs` - UCI EEG Eye State ARFF loading, sparse latent event projection, accuracy/compression baseline, and OpenFHE contract-readiness notes.
- `lib/openfhe-adapter.mjs` - OpenFHE contract builder, validation, contract-bound real-library adapter manifest, local detection, and build-plan output.
- `lib/openfhe-ckks-adapter.mjs` - OpenFHE CKKS approximate-real contract builder, validation, privacy boundary, crypto inventory, BFV/TFHE comparison guidance, and build-plan output.
- `lib/tfhe-rs-adapter.mjs` - TFHE-rs contract builder, validation, crypto inventory, privacy boundary, OpenFHE comparison table, local Cargo detection, and build-plan output.
- `lib/classifier.mjs` - plaintext and encrypted linear spike-count classifiers.
- `lib/benchmark.mjs` - benchmark schema, accuracy summary, security parameters, crypto inventory, dense baseline comparison, packed-vector planning, explicit privacy-mode decision, four-mode privacy comparison, spatial-cluster readiness, and privacy boundary.
- `lib/artifacts.mjs` - benchmark and comparison artifact publisher.
- `openfhe/` - real OpenFHE BFVrns C++ demo and CMake target for the sparse score contract, including optional `--input <json>` loading for generated contracts.
- `openfhe-benchmark.mjs` - OpenFHE plan/run CLI with optional input-contract artifact summaries.
- `openfhe_contract_loader.hpp` - shared minimal C++ loader for generated sparse linear input contracts.
- `openfhe-realdata-contract.mjs` - EEG Eye State to OpenFHE BFVrns/CKKS input-contract publisher.
- `openfhe-ckks/` - real OpenFHE CKKS C++ demo and CMake target for approximate real-valued sparse scoring.
- `openfhe-ckks-benchmark.mjs` - OpenFHE CKKS plan/run CLI and comparison-artifact publisher with optional input-contract artifact summaries.
- `privacy-mode-ablation.mjs` - metadata leakage versus padding overhead artifact publisher.
- `tfhe-rs/` - real TFHE-rs Rust crate using `FheUint16` sparse scoring and an encrypted `FheBool` threshold/comparison gate.
- `tfhe-rs-benchmark.mjs` - TFHE-rs plan/run CLI and comparison-artifact publisher.
- `LINEAR_ALGEBRA_NEXT.md` - handoff for the next matrix/vector cleanup pass.
- `PLAINTEXT_BASELINE.md` - real-event-data baseline notes and CLI usage.
- `OPENFHE_INTEGRATION.md` - native OpenFHE build/run notes.
- `OPENFHE_CKKS_INTEGRATION.md` - native OpenFHE CKKS build/run notes, parameter choices, and privacy-boundary examples.
- `TFHE_RS_INTEGRATION.md` - native TFHE-rs build/run notes and OpenFHE comparison guidance.
- `research-assumptions.json` - falsifiable assumptions and clean-room/IP guardrails.

The toy scheme remains the dependency-free demo. The OpenFHE BFVrns lane is the
default packed-integer HE integration target and runs once OpenFHE is installed
locally. The OpenFHE CKKS lane is the approximate neural/ML feature scoring
comparison target: use it when feature values are real-valued and score drift is
acceptable. The TFHE-rs lane is the first Rust Boolean/threshold-friendly target
and runs with Cargo. Use native results, not JavaScript toy timings, for any
future speed, ciphertext-size, or energy-efficiency claim.
