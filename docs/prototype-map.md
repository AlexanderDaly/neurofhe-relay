# Prototype Map

This map explains the runnable prototype code by ownership area. The JavaScript
harness is portable validation and artifact orchestration, not the low-level
production runtime. Native OpenFHE and TFHE-rs paths remain local dependency
lanes with explicit caveats.

Nothing in `prototype/` is production cryptography, medical software, clinical
validation, deployment evidence, side-channel evidence, or stable-performance
evidence.

## Main Entry Points

- [`prototype/toy-neurohe-demo.mjs`](../prototype/toy-neurohe-demo.mjs) - desk
  demo for the educational sparse encrypted classifier.
- [`prototype/gateway-demo.mjs`](../prototype/gateway-demo.mjs) - local relay
  gateway scaffold and policy demo.
- [`prototype/benchmark.mjs`](../prototype/benchmark.mjs) - synthetic benchmark
  JSON emitter and benchmark artifact entrypoint.
- [`prototype/privacy-mode-ablation.mjs`](../prototype/privacy-mode-ablation.mjs)
  - sparse metadata versus padding overhead artifact entrypoint.
- [`prototype/plaintext-baseline.mjs`](../prototype/plaintext-baseline.mjs) -
  plaintext fixture and real-data baseline entrypoint.
- [`prototype/openfhe-realdata-contract.mjs`](../prototype/openfhe-realdata-contract.mjs)
  - EEG-derived OpenFHE input-contract publisher.
- [`prototype/reconstruction-risk.mjs`](../prototype/reconstruction-risk.mjs) -
  synthetic gateway reconstruction-risk probe entrypoint.
- [`prototype/native-evidence.mjs`](../prototype/native-evidence.mjs) - native
  evidence manifest entrypoint.
- [`prototype/release-evidence.mjs`](../prototype/release-evidence.mjs) -
  caveated release-evidence index entrypoint.

## Library Modules

| Module | Owns |
| --- | --- |
| [`prototype/lib/artifacts.mjs`](../prototype/lib/artifacts.mjs) | Benchmark and comparison artifact publishing |
| [`prototype/lib/benchmark.mjs`](../prototype/lib/benchmark.mjs) | Synthetic benchmark schema, privacy modes, native-lane planning, and framing guardrails |
| [`prototype/lib/classifier.mjs`](../prototype/lib/classifier.mjs) | Plaintext and educational encrypted sparse linear classification |
| [`prototype/lib/demo.mjs`](../prototype/lib/demo.mjs) | Desk-demo assembly |
| [`prototype/lib/docs-links.mjs`](../prototype/lib/docs-links.mjs) | Local Markdown link scanning |
| [`prototype/lib/eeg-eye-state.mjs`](../prototype/lib/eeg-eye-state.mjs) | UCI EEG Eye State parsing, baseline, and input-contract support |
| [`prototype/lib/events.mjs`](../prototype/lib/events.mjs) | Event-window construction, validation, flattening, and sparse metrics |
| [`prototype/lib/gateway.mjs`](../prototype/lib/gateway.mjs) | Local relay gateway policy, normalization, model-facing export, and recommendation validation |
| [`prototype/lib/linear-algebra.mjs`](../prototype/lib/linear-algebra.mjs) | Linear model metadata, validation, dense scoring, and sparse scoring |
| [`prototype/lib/math.mjs`](../prototype/lib/math.mjs) | BigInt modular arithmetic helpers |
| [`prototype/lib/native-evidence.mjs`](../prototype/lib/native-evidence.mjs) | Native evidence classification, host/toolchain summaries, and measurement gap indexing |
| [`prototype/lib/nmnist.mjs`](../prototype/lib/nmnist.mjs) | N-MNIST event parsing, feature extraction, and plaintext baseline evaluation |
| [`prototype/lib/openfhe-adapter.mjs`](../prototype/lib/openfhe-adapter.mjs) | OpenFHE BFVrns contract validation, adapter manifest, and local detection |
| [`prototype/lib/openfhe-ckks-adapter.mjs`](../prototype/lib/openfhe-ckks-adapter.mjs) | OpenFHE CKKS approximate-real contract validation and adapter manifest |
| [`prototype/lib/reconstruction-risk.mjs`](../prototype/lib/reconstruction-risk.mjs) | Synthetic reconstruction-risk probe artifact construction |
| [`prototype/lib/release-evidence.mjs`](../prototype/lib/release-evidence.mjs) | Release-evidence dashboard indexing and caveated gate summaries |
| [`prototype/lib/repo-hygiene.mjs`](../prototype/lib/repo-hygiene.mjs) | Placeholder, secret-shape, and raw-data path source hygiene scanning |
| [`prototype/lib/spike-sorter.mjs`](../prototype/lib/spike-sorter.mjs) | Canonical spatial-aware spike sorting for simulated raw neural-like intake |
| [`prototype/lib/tfhe-rs-adapter.mjs`](../prototype/lib/tfhe-rs-adapter.mjs) | TFHE-rs contract validation, adapter manifest, and native-run planning |
| [`prototype/lib/toy-paillier.mjs`](../prototype/lib/toy-paillier.mjs) | Educational additive toy encryption adapter |

## Native Lanes

- [`prototype/openfhe/`](../prototype/openfhe/) - OpenFHE BFVrns C++ demo and
  CMake target for exact integer sparse scoring.
- [`prototype/openfhe-ckks/`](../prototype/openfhe-ckks/) - OpenFHE CKKS C++
  demo and CMake target for approximate real-valued sparse scoring.
- [`prototype/tfhe-rs/`](../prototype/tfhe-rs/) - TFHE-rs Rust comparison lane
  for sparse integer scoring and encrypted threshold comparison.

## Supporting Notes

- [`prototype/README.md`](../prototype/README.md) - detailed prototype tutorial
  and command notes.
- [`prototype/PLAINTEXT_BASELINE.md`](../prototype/PLAINTEXT_BASELINE.md) -
  real-event-data baseline notes.
- [`prototype/OPENFHE_INTEGRATION.md`](../prototype/OPENFHE_INTEGRATION.md) -
  OpenFHE BFVrns build/run notes.
- [`prototype/OPENFHE_CKKS_INTEGRATION.md`](../prototype/OPENFHE_CKKS_INTEGRATION.md)
  - OpenFHE CKKS build/run notes.
- [`prototype/TFHE_RS_INTEGRATION.md`](../prototype/TFHE_RS_INTEGRATION.md) -
  TFHE-rs build/run notes.
- [`prototype/LINEAR_ALGEBRA_NEXT.md`](../prototype/LINEAR_ALGEBRA_NEXT.md) -
  next matrix/vector cleanup handoff.

Validation checks that every `prototype/lib/*.mjs` module is represented on
this page.

