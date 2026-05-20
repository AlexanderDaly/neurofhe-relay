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

Run tests:

```sh
npm test
```

Current modules:

- `lib/math.mjs` - BigInt modular arithmetic helpers.
- `lib/toy-paillier.mjs` - educational additive HE adapter.
- `lib/events.mjs` - event-window construction, validation, flattening, and sparse metrics.
- `lib/linear-algebra.mjs` - model metadata, dense matrix-vector scoring, sparse event scoring, and model validation.
- `lib/classifier.mjs` - plaintext and encrypted linear spike-count classifiers.
- `lib/benchmark.mjs` - benchmark schema, crypto inventory, dense baseline comparison, and privacy boundary.
- `LINEAR_ALGEBRA_NEXT.md` - handoff for the next matrix/vector cleanup pass.
- `research-assumptions.json` - falsifiable assumptions and clean-room/IP guardrails.

The next real prototype should replace this toy scheme with OpenFHE, SEAL/TenSEAL, Concrete, TFHE-rs, or an Octra/HFHE experiment once the operation family is fixed.
