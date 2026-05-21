# OpenFHE Integration

This lane ports the sparse event scoring contract to a real OpenFHE BFVrns
native target while preserving the same public boundary used by the toy demo:

```text
scores = W x + bias
```

The current native demo encrypts only active spike counts, keeps active event
positions public, applies public non-negative integer class weights, and
decrypts only the final class scores. It is an integration target, not a
production security claim.

## Files

- `lib/openfhe-adapter.mjs` - JS-side contract builder, validation, local OpenFHE detection, and build-plan output.
- `openfhe/CMakeLists.txt` - CMake target using `find_package(OpenFHE CONFIG REQUIRED)`.
- `openfhe/openfhe_linear_demo.cpp` - BFVrns integer demo using OpenFHE `Encrypt`, `EvalMult`, `EvalAdd`, and `Decrypt`.
- `openfhe-benchmark.mjs` - CLI runner for printing the plan or building/running the native target.

## Commands

Print the OpenFHE build plan and local detection state:

```sh
npm run benchmark:openfhe
```

Build and run the native demo when OpenFHE is installed:

```sh
npm run benchmark:openfhe -- --run
```

Equivalent native commands:

```sh
cmake -S prototype/openfhe -B build/openfhe
cmake --build build/openfhe
build/openfhe/openfhe_linear_demo
```

If OpenFHE is installed in a non-standard location, set `OpenFHE_DIR` to the
directory containing `OpenFHEConfig.cmake`.

## Expected Native Output

The native executable emits `neurofhe.openfhe.result.v1` JSON with:

- scheme: `openfhe-bfvrns`
- active event count: `18`
- scores: `{ "normal": 9, "anomaly": 51 }`
- classification: `anomaly`
- operation counts: `20` encryptions, `36` scalar/plaintext multiplies, `36` adds, `2` decryptions
- production claim: `false`

## Local Status

This repository can validate the OpenFHE contract and native source markers
without bundling OpenFHE. Actual BFVrns execution requires a local OpenFHE
install discoverable by CMake.

Primary implementation references:

- OpenFHE user CMake template: https://github.com/openfheorg/openfhe-development/blob/main/CMakeLists.User.txt
- OpenFHE BFVrns integer example: https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/simple-integers.cpp
- OpenFHE examples linking notes: https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/README.md
