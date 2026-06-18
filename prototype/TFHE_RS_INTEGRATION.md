# TFHE-rs Integration

This lane adds a real Rust TFHE-rs target beside the OpenFHE BFVrns arithmetic
path. The concrete approach is hybrid:

- Sparse integer scoring with `FheUint16`, preserving the current
  `scores = W x + bias` contract.
- An encrypted Boolean-style decision bit with `FheBool`, currently
  `anomaly_score > normal_score`.

This is the most practical first TFHE-rs shape for NeuroFHE Relay because it
keeps the same sorted-event task as OpenFHE while demonstrating the comparison
and threshold-gate family where TFHE-style schemes are a natural fit. It is a
research-alpha native comparison lane only. It is not production cryptography.

## Review Routes

- Commands and rerun paths: [`../docs/command-reference.md`](../docs/command-reference.md).
- Native setup posture: [`../docs/dependency-matrix.md`](../docs/dependency-matrix.md).
- Human-readable evidence status:
  [`../docs/evidence-dashboard.md`](../docs/evidence-dashboard.md).
- Release gate checklist:
  [`../docs/release-gate-matrix.md`](../docs/release-gate-matrix.md).
- Artifact directory index:
  [`../benchmark-artifacts/README.md`](../benchmark-artifacts/README.md).

Current release posture: `releaseGateSatisfied: false`. This lane must keep
`productionClaim: false`, `privacyBoundary`, and `cryptoInventory` visible in
review materials. It is native-library research evidence only; it is not a
privacy proof, production cryptography, clinical validation, medical evidence,
or stable deployment-performance claim.

## Files

- `lib/tfhe-rs-adapter.mjs` - JS-side contract builder, validation,
  digest-bound adapter manifest, TFHE-vs-OpenFHE comparison table, crypto
  inventory, privacy boundary, and local Cargo detection.
- `tfhe-rs/Cargo.toml` - Rust crate pinned to `tfhe = 1.6.1` with
  `boolean` and `integer` features.
- `tfhe-rs/src/lib.rs` - TFHE-rs sparse scorer and threshold gate.
- `tfhe-rs/src/main.rs` - JSON-emitting demo binary.
- `tfhe-rs-benchmark.mjs` - CLI runner for plan, adapter, native run, and
  optional comparison artifacts.

## Adapter Contract

`buildTfheRsRealLibraryAdapter()` emits `neurofhe.realLibraryAdapter.v1` with
adapter id `tfhe-rs-sparse-integer-threshold-v1`. It is bound to the generated
`neurofhe.tfheRs.contract.v1` payload by a SHA-256 digest and carries:

- exact score contract: `scores = W x + bias`
- non-negative integer score domain
- sorted-event public position policy
- expected plaintext scores `{ "normal": 9, "anomaly": 51 }`
- expected classification `anomaly`
- encrypted threshold gate `anomaly_score_gt_normal_score`
- TFHE-rs crypto inventory and privacy boundary
- comparison notes for when to prefer TFHE-rs vs OpenFHE BFV/CKKS

## Commands

Print the TFHE-rs plan:

```sh
npm run benchmark:tfhe
```

Print only the adapter manifest:

```sh
npm run benchmark:tfhe -- --adapter
```

Compile and test the Rust crate:

```sh
cargo test --manifest-path prototype/tfhe-rs/Cargo.toml
```

Run the real TFHE-rs demo:

```sh
npm run benchmark:tfhe -- --run
```

Persist a native comparison artifact:

```sh
npm run benchmark:tfhe -- --run --artifact
```

Equivalent native command:

```sh
cargo run --release --manifest-path prototype/tfhe-rs/Cargo.toml --bin neurofhe-tfhe-demo
```

## Current Evidence Pointers

- [`../benchmark-artifacts/comparisons/tfhe-rs/latest.json`](../benchmark-artifacts/comparisons/tfhe-rs/latest.json)
  is the current TFHE-rs native artifact. It records a single local synthetic
  run of the integer-threshold contract, including `safe_serialized_size`
  ciphertext sizing and one end-of-run RSS sample. Treat it as host-specific
  research evidence, not stable performance.
- [`../benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json`](../benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json)
  records the EEG-derived real-data signed-integer run: the adapter transforms
  the OpenFHE quantized contract into a signed TFHE-rs contract, and the native
  lane's encrypted class scores and threshold decision match the plaintext
  baseline on a single window.
- [`../benchmark-artifacts/native-evidence/latest.json`](../benchmark-artifacts/native-evidence/latest.json)
  indexes the current native OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs lanes.
  The OpenFHE lanes now have real native artifacts on the indexed host; their
  single-window native measurement gaps for serialized ciphertext bytes and RSS
  are now closed, leaving multi-window coverage as the remaining work.

The TFHE-rs native artifact is a single local synthetic run, not a stable
performance claim. Repeated timings depend on CPU, build mode, TFHE-rs
parameters, and system load. The agreement value is synthetic contract
agreement on one event window, not dataset accuracy.

## Privacy Boundary

The TFHE-rs path uses the same default sparse privacy mode as the OpenFHE path:
`public-active-neuron-positions-encrypted-features`.

Compute sees:

- approved active event positions
- public model weights
- public model bias
- encrypted TFHE-rs active spike values
- encrypted TFHE-rs class scores
- encrypted TFHE-rs threshold decision bit

Gateway sees:

- sorted event window
- active event values before encryption
- active event positions
- sorter configuration summary

Client/keyholder sees:

- decrypted class scores
- decrypted threshold decision bit
- final classification

Withheld from compute:

- raw neural samples
- raw electrode identifiers
- raw sample timestamp order
- device identifiers
- local subject/session references
- operator notes

Residual risks:

- public active positions leak spatial and timing metadata
- exact event count leaks unless padded
- public weights and bias reveal the tiny model
- side-channel, parameter, and deployment hardening are out of scope

## Crypto Inventory Entry

```json
{
  "schema": "neurofhe.crypto.inventory.v1",
  "encryptedComputation": [
    "tfhe-rs-1.6.1-integer-boolean-research-only",
    "openfhe-bfvrns-comparison-lane"
  ],
  "tfheRs": {
    "crate": "tfhe",
    "version": "1.6.1",
    "features": ["boolean", "integer"],
    "defaultFeatures": false,
    "role": "encrypted sparse integer scoring plus encrypted Boolean threshold/comparison gate",
    "ciphertextSizing": "native run reports safe_serialized_size for active values, class scores, and decision bit"
  },
  "productionClaim": false
}
```

TFHE-rs is published by Zama under BSD-3-Clause-Clear with additional patent
terms for commercial use. This repository remains CC0, but downstream users
must review dependency terms before non-research use.

## When To Prefer Which Lane

Prefer OpenFHE BFV/BGV when the workload is mostly packed arithmetic:

- batched integer spike counts
- larger dot products
- ciphertext-plaintext multiply/add workloads
- dense or padded vector comparisons

Prefer CKKS only after the feature contract becomes approximate:

- real-valued or fixed-point biosignal features
- tolerated score drift
- explicit scale and rounding-error review

Prefer TFHE-rs when the workload becomes Boolean or threshold-heavy:

- encrypted comparisons
- decision trees over sparse binary/count features
- LUT-style rules
- small threshold circuits after spike sorting
- hybrid pipelines where arithmetic scores feed encrypted gates

## Limitations

- Uses one synthetic 8x8 event window.
- Uses public active positions; padded sparse or dense encrypted modes remain
  next-step work.
- Uses a tiny public model and client-side decryption.
- Does not implement encrypted argmax across arbitrary classes.
- TFHE-rs real-data run covers a single EEG-derived window; multi-window runs
  plus ciphertext-size and memory sweeps remain next-step work.
- Does not benchmark N-MNIST under TFHE-rs yet.
- Does not claim production security, side-channel resistance, clinical
  validity, medical utility, or post-quantum deployment readiness.

## Recommended Next Steps

1. Add padded sparse slots to hide exact active-event count.
2. Add a small encrypted decision-tree classifier over binary sorted-event
   predicates.
3. Extend OpenFHE BFVrns and CKKS coverage beyond a single window; the
   single-window serialized ciphertext-byte and RSS measurements are now
   reported on the indexed host.
4. Add an N-MNIST-derived synthetic subset benchmark with plaintext, OpenFHE,
   and TFHE-rs lanes.
5. Extend the EEG-derived TFHE-rs real-data signed-integer run across multiple
   windows and add ciphertext-size and memory sweeps before performance or
   accuracy claims.
6. Explore a hybrid pipeline: BFV/BGV for batched linear scores, then TFHE-rs
   for encrypted threshold or policy gates.
