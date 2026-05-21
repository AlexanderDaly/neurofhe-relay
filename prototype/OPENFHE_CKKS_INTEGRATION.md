# OpenFHE CKKS Integration

This lane adds OpenFHE CKKS beside the existing BFVrns arithmetic target and
the TFHE-rs threshold target.

The concrete approach is a shallow, leveled CKKS scorer:

```text
scores = W x + bias
```

It preserves the current sparse sorted-event boundary: active neuron/time
positions are public, active feature values are encrypted, model weights and
bias are public, and only the client/keyholder decrypts approximate class
scores. CKKS is the comparison lane for approximate neural or ML feature
values. It is not production cryptography.

## Folder Layout

- `lib/openfhe-ckks-adapter.mjs` - JS-side contract builder, validation,
  digest-bound adapter manifest, CKKS crypto inventory, privacy boundary,
  BFV/TFHE comparison notes, and local OpenFHE detection.
- `openfhe-ckks/CMakeLists.txt` - CMake target using `find_package(OpenFHE REQUIRED)`.
- `openfhe-ckks/openfhe_ckks_linear_demo.cpp` - CKKS sparse sorted-event demo
  using `MakeCKKSPackedPlaintext`, `Encrypt`, `EvalMult`, `EvalAdd`, and
  `Decrypt`; accepts optional `--input <json>` generated sparse contracts.
- `openfhe_contract_loader.hpp` - shared C++ loader for the generated sparse
  linear input contract.
- `openfhe-realdata-contract.mjs` - UCI EEG Eye State to OpenFHE BFVrns/CKKS
  input-contract publisher.
- `openfhe-ckks-benchmark.mjs` - CLI runner for plan, adapter, native run, and
  optional comparison artifacts.

## Parameter Choices

The default contract uses:

```json
{
  "scheme": "openfhe-ckks",
  "multiplicativeDepth": 2,
  "scalingModSize": 50,
  "firstModSize": 60,
  "batchSize": 64,
  "securityLevel": "HEStd_128_classic",
  "rescalingTechnique": "FLEXIBLEAUTO",
  "defaultMode": "leveled-no-bootstrap"
}
```

Rationale:

- The sparse `W x + bias` circuit is shallow: ciphertext-plaintext multiplies
  by public weights plus additions into two class-score ciphertexts.
- `batchSize: 64` matches the 8 by 8 event window and leaves room for packed
  vector experiments while the first native demo encrypts active values
  sparsely.
- `FLEXIBLEAUTO` lets OpenFHE manage CKKS rescale/mod-reduce behavior for this
  shallow path.
- `HEStd_128_classic` is the research target security level for parity with the
  rest of the prototype language.
- Optional bootstrapping setup is exposed by the native binary with
  `--bootstrap`, but the default demo does not need bootstrapping.

## Commands

Print the CKKS plan and local OpenFHE detection state:

```sh
npm run benchmark:openfhe-ckks
```

Print only the adapter manifest:

```sh
npm run benchmark:openfhe-ckks -- --adapter
```

Write an optional comparison artifact for the adapter plan:

```sh
npm run benchmark:openfhe-ckks -- --artifact
```

Build and run the native demo when OpenFHE is installed:

```sh
npm run benchmark:openfhe-ckks -- --run
```

Build, run, and persist the native result:

```sh
npm run benchmark:openfhe-ckks -- --run --artifact
```

Generate the EEG-derived single-window OpenFHE input contract and run CKKS on
the approximate-real view:

```sh
npm run contract:eeg-openfhe
npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact
```

Equivalent native commands:

```sh
cmake -S prototype/openfhe-ckks -B build/openfhe-ckks
cmake --build build/openfhe-ckks
build/openfhe-ckks/openfhe_ckks_linear_demo
build/openfhe-ckks/openfhe_ckks_linear_demo --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json
```

If OpenFHE is installed in a non-standard location, set `OpenFHE_DIR` to the
directory containing `OpenFHEConfig.cmake`.

## Expected Synthetic Result

Without `--input`, the native executable emits `neurofhe.openfheCkks.result.v1`
JSON for the embedded synthetic contract with:

- scheme: `openfhe-ckks`
- score domain: `approximate-real`
- event representation: `spatial-sorted-events`
- privacy mode: `public-active-neuron-positions-encrypted-features`
- active event count: `18`
- active neuron positions: public, value-free positions with index, time bin,
  neuron ID, and spatial bin coordinates
- expected scores: `{ "normal": 9, "anomaly": 51 }`
- expected classification: `anomaly`
- operation counts: `20` encryptions, `36` plaintext/scalar multiplies,
  `36` adds, `36` rescale-or-mod-reduce operations, `2` decryptions
- precision report: max absolute score error, tolerance, and classification
  agreement
- production claim: `false`

## Real-Data-Derived Input Result

With the EEG-derived `--input` contract, the committed local artifact reports:

- input source: `external-contract`
- dataset kind: `public-uci-eeg-eye-state-arff`
- feature shape: `[8, 8]`
- matrix shape: `[2, 64]`
- active event count: `32`
- scores: `{ "eye-closed": 0.0739801034416, "eye-open": -0.52407347656 }`
- classification: `eye-closed`
- max absolute score error: `9.69524460714E-12`
- tolerance: `0.001`
- classification agreement: `true`
- local latency: `131.586833 ms` encryption, `32.918083 ms` linear scoring,
  `9.701 ms` decryption
- operation counts: `34` encryptions, `64` plaintext/scalar multiplies,
  `64` adds, `64` rescale-or-mod-reduce operations, `2` decryptions
- parameters: CKKS, `HEStd_128_classic`, multiplicative depth `2`,
  scaling modulus size `50`, first modulus size `60`, batch size `64`,
  `FLEXIBLEAUTO`, leveled/no bootstrap

These are one-window local laptop timings for integration validation, not a
stable performance benchmark or production cryptography claim.

## Privacy Boundary Example

Compute sees:

- approved active event positions
- public model weights
- public model bias
- encrypted CKKS active feature values
- encrypted CKKS approximate class scores

Gateway sees:

- raw neural-like samples before export
- sorted event window
- active approximate feature values before encryption
- active event positions
- sorter configuration summary

Client/keyholder sees:

- decrypted approximate class scores
- score error report against the synthetic plaintext baseline
- final classification

Withheld from compute:

- raw neural samples
- raw electrode identifiers
- raw sample timestamp order
- device identifiers
- local subject or session references
- operator notes

Residual risks:

- public active positions leak spatial and timing metadata
- exact event count leaks unless padded
- public weights and bias reveal the tiny model
- CKKS approximate arithmetic introduces score drift
- encrypted comparison or argmax is not included in the shallow CKKS demo
- side-channel, parameter, and deployment hardening are out of scope

## Crypto Inventory Entry

```json
{
  "schema": "neurofhe.crypto.inventory.v1",
  "encryptedComputation": [
    "openfhe-ckks-approximate-real-research-only",
    "openfhe-bfvrns-integer-default-lane",
    "tfhe-rs-threshold-comparison-lane"
  ],
  "openFheCkks": {
    "library": "OpenFHE",
    "scheme": "CKKS",
    "role": "approximate real-number encrypted sparse scoring for neural/ML feature values",
    "securityLevel": "HEStd_128_classic",
    "scalingTechnique": "FLEXIBLEAUTO",
    "defaultMode": "leveled-no-bootstrap",
    "bootstrappingMode": "supported as an optional OpenFHE CKKS configuration path, but not needed for the shallow W x + b demo"
  },
  "productionClaim": false
}
```

## When To Prefer Which Lane

Prefer OpenFHE BFV/BGV for exact arithmetic:

- integer spike counts
- exact reproducible scores
- packed finite-field-style linear algebra

Prefer OpenFHE CKKS for approximate neural or ML features:

- real-valued amplitudes, normalized features, centroids, or embeddings
- shallow arithmetic where small score drift is acceptable
- experiments that need floating-point-style behavior more than exact equality

Prefer TFHE-rs for Boolean or LUT-style logic:

- encrypted comparisons
- threshold gates
- decision trees over sparse binary/count features
- policy gates after arithmetic scoring

## Limitations

- Uses one embedded synthetic 8 by 8 event window and one generated
  real-data-derived EEG sparse window.
- Keeps active positions public.
- Uses public model weights and bias.
- Does not implement encrypted argmax or encrypted CKKS comparison.
- Reports ciphertext count portably; exact serialized ciphertext bytes require
  OpenFHE serialization measurement in the target environment.
- Does not run a multi-window N-MNIST or EEG sweep under CKKS yet.
- Does not claim production security, clinical validity, medical utility,
  side-channel resistance, or post-quantum deployment readiness.

## Recommended Next Steps

1. Run multi-window BFVrns, CKKS, and TFHE-rs native artifacts on the same OpenFHE/TFHE host.
2. Add padded sparse batches to hide exact active-event count.
3. Add a dense CKKS packed-vector variant for normalized real-valued features.
4. Add OpenFHE serialization-based ciphertext byte measurements.
5. Compare CKKS score drift on an N-MNIST-derived or EEG-derived sweep.
6. Explore a hybrid pipeline: CKKS for approximate feature scoring, TFHE-rs for
   encrypted threshold or decision gates.

Primary implementation references:

- OpenFHE CKKS real-number example: https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/simple-real-numbers.cpp
- OpenFHE user CMake template: https://github.com/openfheorg/openfhe-development/blob/main/CMakeLists.User.txt
- OpenFHE examples linking notes: https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/README.md
