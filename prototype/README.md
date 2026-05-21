# NeuroFHE Relay Prototype

This is a dependency-free prototype for the first bio-digital privacy boundary.

It uses an educational additive homomorphic encryption toy based on Paillier-style arithmetic to classify a synthetic sparse event window. It is not production cryptography and it is not full FHE. Its purpose is to make the product claim testable:

1. The edge creates a sparse spike/event window.
2. The client exposes active event positions and encrypts active spike counts.
3. The compute side evaluates public linear class weights over ciphertext active events.
4. The keyholder decrypts the final class scores.

The active-event representation lowers encrypted operations but reveals a sparsity/timing pattern. A later privacy mode can pad, batch, or encrypt dense windows when the metadata is too sensitive.

Run:

```sh
npm run demo
```

Emit the benchmark JSON:

```sh
npm run benchmark
```

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
- `lib/linear-algebra.mjs` - model metadata, dense matrix-vector scoring, sparse event scoring, and model validation.
- `lib/nmnist.mjs` - N-MNIST event parsing, feature extraction, and plaintext baseline evaluation.
- `lib/openfhe-adapter.mjs` - OpenFHE contract builder, validation, local detection, and build-plan output.
- `lib/classifier.mjs` - plaintext and encrypted linear spike-count classifiers.
- `lib/benchmark.mjs` - benchmark schema, crypto inventory, dense baseline comparison, and privacy boundary.
- `openfhe/` - real OpenFHE BFVrns C++ demo and CMake target for the sparse score contract.
- `openfhe-benchmark.mjs` - OpenFHE plan/run CLI.
- `LINEAR_ALGEBRA_NEXT.md` - handoff for the next matrix/vector cleanup pass.
- `PLAINTEXT_BASELINE.md` - real-event-data baseline notes and CLI usage.
- `OPENFHE_INTEGRATION.md` - native OpenFHE build/run notes.
- `research-assumptions.json` - falsifiable assumptions and clean-room/IP guardrails.

The toy scheme remains the dependency-free demo. The OpenFHE lane is now the
first real HE integration target and runs once OpenFHE is installed locally.
