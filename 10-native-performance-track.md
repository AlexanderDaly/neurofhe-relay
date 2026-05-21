# Native Performance Track

## Position

JavaScript is acceptable in this repository only as a portable desk-demo,
contract-test, JSON-artifact, and presentation harness. It is not the target
runtime for the low-level NeuroFHE Relay path.

The production direction is native, measurable, and energy-aware:

- Edge encoder and spike sorter: C, C++, Rust, Zig, DSP code, FPGA logic, or
  vendor-supported embedded toolchains.
- Homomorphic inference: native OpenFHE, Microsoft SEAL, TFHE-rs, Concrete, or
  another reviewed HE runtime with explicit parameters.
- Gateway and policy boundary: native or tightly profiled systems code when it
  touches live signals, timing-sensitive data, key custody, or device control.
- Browser, Node, and scripting layers: demos, dashboards, schema validation,
  artifact generation, test orchestration, and non-critical developer tooling.

The rule is simple: no JavaScript on the hot path unless it is only simulating a
contract that already has a native implementation target.

## Why This Matters

NeuroFHE Relay is about sparse event streams, encrypted arithmetic, and local
trust boundaries. Those workloads are sensitive to latency, memory pressure,
cache behavior, power draw, side channels, and deterministic timing. A garbage-
collected, JIT-dependent runtime is useful for explaining and validating the
shape of the system, but it is not where the core system should settle.

The real implementation should optimize for:

- Joules per event window.
- Latency per encrypted inference.
- Ciphertext bytes per decision.
- Peak memory during encryption, evaluation, and decryption.
- Operation counts by scheme: adds, multiplies, rotations, bootstraps, key
  switches, encryptions, and decryptions.
- Deterministic behavior under fixed parameters.
- Clear trust-zone separation and key-custody rules.

## Migration Plan

1. Preserve the JavaScript contracts as reference tests.
2. Keep `prototype/openfhe/openfhe_linear_demo.cpp` as the first native HE
   target for exact sparse integer `scores = W x + bias`.
3. Keep `prototype/openfhe-ckks/openfhe_ckks_linear_demo.cpp` as the CKKS
   comparison target for approximate real-valued neural/ML features.
4. Move the spatial spike sorter into a native reference implementation with
   fixed-width integer types and no heap allocation in the inner loop.
5. Emit the same benchmark schema from native runs that the JavaScript harness
   emits today, so results remain comparable.
6. Add energy and memory measurement fields once native binaries run on stable
   host and edge targets.
7. Treat Node scripts as wrappers only after the native binary becomes the
   source of truth for performance numbers.

## Immediate Native Targets

- `openfhe_linear_demo`: BFVrns integer sparse score accumulation.
- `openfhe_ckks_linear_demo`: CKKS approximate real-valued sparse score accumulation with score-drift reporting.
- `spatial_spike_sorter_native`: integer threshold, electrode lookup,
  refractory gate, and saturating count accumulation.
- `native_benchmark_report`: JSON output matching `neurofhe.benchmark.v1`, with
  latency, memory, and energy fields when the platform can measure them.

## Non-Goals

- Do not claim JavaScript benchmark latency as a proxy for production latency.
- Do not use toy additive encryption as a security or energy benchmark.
- Do not put raw signal processing, key custody, or live device commands behind
  an unprofiled scripting runtime.
- Do not broaden the model before the native sparse linear contract is built,
  measured, and compared against dense/native baselines.
