# OpenFHE Integration

This lane ports the sparse spatial-sorted event scoring contract to a real
OpenFHE BFVrns native target while preserving the same public boundary used by
the toy demo:

```text
scores = W x + bias
```

The current native demo encrypts only active sorted-event feature values, keeps
active neuron/time-bin positions public, applies public non-negative integer
class weights, and decrypts only the final class scores. It uses the
`public-active-neuron-positions-encrypted-features` privacy mode. It is an
integration target, not a production security claim.

## Files

- `lib/openfhe-adapter.mjs` - JS-side contract builder, validation, contract-bound real-library adapter manifest, local OpenFHE detection, and build-plan output.
- `openfhe/CMakeLists.txt` - CMake target using `find_package(OpenFHE CONFIG REQUIRED)`.
- `openfhe/openfhe_linear_demo.cpp` - BFVrns integer sorted-event demo using OpenFHE `Encrypt`, `EvalMult`, `EvalAdd`, and `Decrypt`; accepts optional `--input <json>` generated sparse contracts.
- `openfhe_contract_loader.hpp` - shared C++ loader for the generated sparse linear input contract.
- `openfhe-realdata-contract.mjs` - UCI EEG Eye State to OpenFHE BFVrns/CKKS input-contract publisher.
- `openfhe-benchmark.mjs` - CLI runner for printing the plan, writing adapter comparison artifacts, or building/running the native target.

## Adapter Contract

`buildOpenFheRealLibraryAdapter()` emits
`neurofhe.realLibraryAdapter.v1`. The adapter is bound to the generated
`neurofhe.openfhe.contract.v1` payload by a SHA-256 digest and carries:

- exact score contract: `scores = W x + bias`
- non-negative integer score domain
- expected plaintext scores and classification
- native target and CMake path
- OpenFHE detection state
- packed-vector planning notes for BFV/BGV and CKKS
- privacy-mode decision for public active positions, padded sparse batches, or dense encrypted windows
- framing guardrail: privacy-preserving event intelligence, not diagnosis or treatment

## Commands

Print the OpenFHE build plan and local detection state:

```sh
npm run benchmark:openfhe
```

Write an optional comparison artifact for the adapter plan:

```sh
npm run benchmark:openfhe -- --artifact
```

Build and run the native demo when OpenFHE is installed:

```sh
npm run benchmark:openfhe -- --run
```

Build, run, and persist the native result for comparison when OpenFHE is
installed:

```sh
npm run benchmark:openfhe -- --run --artifact
```

Generate the EEG-derived single-window OpenFHE input contract and run BFVrns on
the fixed-point view:

```sh
npm run contract:eeg-openfhe
npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
```

Equivalent native commands:

```sh
cmake -S prototype/openfhe -B build/openfhe
cmake --build build/openfhe
build/openfhe/openfhe_linear_demo
build/openfhe/openfhe_linear_demo --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json
```

If OpenFHE is installed in a non-standard location, set `OpenFHE_DIR` to the
directory containing `OpenFHEConfig.cmake`.

## Packed-Vector Plan

The current integer spike-count contract should start with BFV/BGV packing:

- pack active values for the sparse path, with public or padded active indices depending on the privacy-mode decision
- compare against full dense-window packing so sparsity cost and metadata leakage remain visible
- keep weights and bias public for the first benchmark lane, using ciphertext-plaintext multiplies

CKKS is a comparison lane, not the default. Use it only when the feature
contract becomes approximate real or fixed-point, and record score drift against
the integer plaintext baseline.

## Privacy-Mode Decision

The default comparison decision is `padded-sparse-batches`: it hides exact
active-event count inside a bucket while staying cheaper than dense encrypted
windows. Use `public-active-positions` only when exact position and timing
metadata are acceptable. Use `dense-encrypted-windows` when active positions and
sparsity metadata must be hidden and the higher encrypted workload is acceptable.

## Expected Native Output

Without `--input`, the native executable emits `neurofhe.openfhe.result.v1` JSON
for the embedded synthetic contract with:

- scheme: `openfhe-bfvrns`
- event representation: `spatial-sorted-events`
- privacy mode: `public-active-neuron-positions-encrypted-features`
- active event count: `18`
- active neuron positions: public, value-free positions with index, time bin, neuron ID, and spatial bin coordinates
- scores: `{ "normal": 9, "anomaly": 51 }`
- classification: `anomaly`
- operation counts: `20` encryptions, `36` scalar/plaintext multiplies, `36` adds, `2` decryptions
- production claim: `false`

With the EEG-derived `--input` contract, the committed local artifact reports:

- input source: `external-contract`
- dataset kind: `public-uci-eeg-eye-state-arff`
- feature shape: `[8, 8]`
- matrix shape: `[2, 64]`
- active event count: `32`
- fixed-point scale: `10`
- scores: `{ "eye-closed": 21, "eye-open": -44 }`
- classification: `eye-closed`
- plaintext match: `true`
- operation counts: `34` encryptions, `64` scalar/plaintext multiplies, `64` adds, `2` decryptions
- parameters: BFVrns, `HEStd_128_classic`, plaintext modulus `65537`, multiplicative depth `1`, batch size `1`

## Local Status

This repository can validate the OpenFHE contract and native source markers
without bundling OpenFHE. Actual BFVrns execution requires a local OpenFHE
install discoverable by CMake. The committed real-data-derived BFVrns artifact
was produced on this laptop with local OpenFHE available; reproduce it with the
commands above.

Primary implementation references:

- OpenFHE user CMake template: https://github.com/openfheorg/openfhe-development/blob/main/CMakeLists.User.txt
- OpenFHE BFVrns integer example: https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/simple-integers.cpp
- OpenFHE examples linking notes: https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/README.md
