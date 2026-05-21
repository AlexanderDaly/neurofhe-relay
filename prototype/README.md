# NeuroFHE Relay Prototype

This is a dependency-free prototype for the first bio-digital privacy boundary.

The JavaScript modules are a reference harness, not the target low-level
runtime. They keep the public contract runnable anywhere and provide tests for
the schema, benchmark shape, privacy boundary, and toy arithmetic. The
performance path should move into native OpenFHE/SEAL/TFHE-rs/Concrete code and
native or hardware-aware encoder implementations.

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

Publish a benchmark artifact under `benchmark-artifacts/`:

```sh
npm run benchmark:artifact
```

Each artifact includes accuracy, latency, ciphertext bytes, operation counts,
security parameters, privacy boundary, and crypto inventory.

The benchmark now compares three privacy modes for the same `scores = W x + bias`
contract:

- Public active positions: 18 encrypted feature slots, fastest, leaks exact timing/sparsity metadata.
- Padded sparse batches: 32 encrypted feature slots, middle ground, hides exact active count inside a bucket.
- Dense encrypted windows: 64 encrypted feature slots, slowest, hides sparsity better by encrypting zero and non-zero positions alike.

It also compares three input representations on the same task:

- Dense/raw window: 64 encrypted feature slots, complete dense reference path.
- Unsorted spikes: 18 encrypted feature slots, keeps raw sample order and electrode metadata visible.
- Spatial-sorted events: 18 encrypted feature slots, canonical sorter path with spatial-bin provenance, crypto inventory, and explicit sorted-event privacy boundary.

Print the real OpenFHE BFVrns integration plan:

```sh
npm run benchmark:openfhe
```

Run tests:

```sh
npm test
```

Run the plaintext real-data baseline against a local N-MNIST directory:

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

Current modules:

- `lib/math.mjs` - BigInt modular arithmetic helpers.
- `lib/toy-paillier.mjs` - educational additive HE adapter.
- `lib/events.mjs` - event-window construction, validation, flattening, and sparse metrics.
- `lib/spike-sorter.mjs` - canonical spatial-aware spike sorter for raw neural-like intake, designed around FPGA- or edge-friendly integer operations.
- `lib/linear-algebra.mjs` - model metadata, dense matrix-vector scoring, sparse event scoring, and model validation.
- `lib/nmnist.mjs` - N-MNIST event parsing, feature extraction, and plaintext baseline evaluation.
- `lib/openfhe-adapter.mjs` - OpenFHE contract builder, validation, local detection, and build-plan output.
- `lib/classifier.mjs` - plaintext and encrypted linear spike-count classifiers.
- `lib/benchmark.mjs` - benchmark schema, accuracy summary, security parameters, crypto inventory, dense baseline comparison, three-mode privacy comparison, and privacy boundary.
- `lib/artifacts.mjs` - benchmark artifact publisher.
- `openfhe/` - real OpenFHE BFVrns C++ demo and CMake target for the sparse score contract.
- `openfhe-benchmark.mjs` - OpenFHE plan/run CLI.
- `LINEAR_ALGEBRA_NEXT.md` - handoff for the next matrix/vector cleanup pass.
- `PLAINTEXT_BASELINE.md` - real-event-data baseline notes and CLI usage.
- `OPENFHE_INTEGRATION.md` - native OpenFHE build/run notes.
- `research-assumptions.json` - falsifiable assumptions and clean-room/IP guardrails.

The toy scheme remains the dependency-free demo. The OpenFHE lane is now the
first real HE integration target and runs once OpenFHE is installed locally.
Use native results, not JavaScript toy timings, for any future speed or energy
efficiency claim.
