# NeuroFHE Relay - Demo Roadmap

## Phase 0 - Desk Validation

Goal: prove the concept is coherent enough to demo.

Deliverables:

- Static briefing deck.
- Architecture diagram.
- Evidence memo.
- Prototype task list.

Status: this package covers Phase 0.

Included desk demo:

- `prototype/toy-neurohe-demo.mjs` runs a dependency-free encrypted spike-count classifier.
- It uses educational additive homomorphic arithmetic to make the privacy boundary visible.
- `prototype/benchmark.mjs` emits `neurofhe.benchmark.v1` with accuracy, latency, ciphertext bytes, operation counts, security parameters, dense baseline comparison, three privacy modes, privacy boundary, and crypto inventory.
- `benchmark-artifacts/latest.json` publishes the current benchmark artifact for review and comparison.
- `prototype/openfhe-benchmark.mjs` emits the real OpenFHE BFVrns build plan and local detection state.
- `prototype/openfhe/openfhe_linear_demo.cpp` ports the same sparse `scores = W x + bias` contract to OpenFHE APIs.
- `prototype/lib/openfhe-adapter.mjs` emits a digest-bound `neurofhe.realLibraryAdapter.v1` manifest around that exact contract.
- `npm run benchmark:openfhe -- --artifact` writes optional OpenFHE comparison artifacts for adapter plans or native runs.
- `10-native-performance-track.md` defines the boundary between JavaScript scaffolding and the native, energy-aware implementation path.
- `prototype/research-assumptions.json` captures falsifiable assumptions and clean-room/proprietary-track guardrails.
- It is not production cryptography and not full FHE.

## Phase 1 - Plaintext Neuromorphic Baseline

Goal: create a tiny event-driven model before introducing encryption.

Tasks:

- Select dataset: synthetic event stream first, then N-MNIST or DVS-style data.
- Build tiny SNN or SNN-like temporal classifier.
- Freeze window size, channel count, time steps, and output classes.
- Emit machine-readable model and event-window metadata.
- Record plaintext accuracy and latency.

Current prototype foothold:

- Synthetic 8 by 8 event window.
- Public active event positions with encrypted active spike counts.
- Three privacy modes: public active positions, padded sparse batches, and dense encrypted windows.
- Explicit privacy-mode decision: padded sparse batches are the default comparison lane unless exact active-position metadata is acceptable or dense-window privacy is required.
- Packed-vector planning notes: BFV/BGV first for non-negative integer spike counts; CKKS only as an approximate comparison lane.
- Plaintext and encrypted linear classifier agreement.
- Dense encrypted tensor baseline comparison.
- `prototype/LINEAR_ALGEBRA_NEXT.md` records the next matrix/vector cleanup pass.
- `prototype/PLAINTEXT_BASELINE.md` and `npm run baseline:plaintext` define the first real-data N-MNIST-compatible plaintext baseline.
- `prototype/OPENFHE_INTEGRATION.md` defines the native OpenFHE BFVrns build/run path for the fixed score contract.

Decision gate:

- If the real-data plaintext baseline is not compact, stable, and rights-clean, do not encrypt it yet.

## Phase 2 - HE Prototype

Goal: perform one meaningful inference step over encrypted event features.

Tasks:

- Treat JavaScript as the reference harness only; do not use it for production performance claims.
- Start with OpenFHE, Microsoft SEAL, TenSEAL, Concrete, or TFHE-rs.
- Reuse the toy demo's event-window and score contract as the migration target.
- Build and run the OpenFHE BFVrns encrypted linear/accumulation layer on a host with OpenFHE installed.
- Add native latency, memory, and energy measurements before calling any path efficient.
- Approximate activation with polynomial or lookup path.
- Decrypt only final score during local test.
- Record operation counts, latency, ciphertext size, and accuracy change.
- Add `cryptoInventory` to benchmark output so every cryptographic dependency is visible.
- Compare public sparse, padded sparse, and dense encrypted privacy modes under the same native HE library.

Decision gate:

- Continue only if the encrypted event workload is measurably smaller than a dense baseline.

## Phase 3 - Hybrid Demo

Goal: make the privacy boundary visible.

Demo script:

1. Show local event stream.
2. Show encoded spike window.
3. Encrypt the event window.
4. Run encrypted inference.
5. Show compute side cannot inspect raw input.
6. Decrypt final result locally.
7. Display benchmark table.

Presentation outcome:

- A non-technical audience understands the privacy story.
- A technical audience sees real numbers and limitations.

## Phase 3.5 - Post-Quantum Envelope

Goal: make the surrounding security story quantum-resistant and auditable.

Tasks:

- Add ML-KEM-based key-establishment simulation for encrypted event submission.
- Add ML-DSA or SLH-DSA signing for benchmark artifacts.
- Keep hybrid classical + PQC mode while the ecosystem matures.
- Emit a machine-readable crypto inventory with algorithms, parameter sets, libraries, and caveats.

Decision gate:

- Do not call the system quantum-safe until the implementation uses real libraries and concrete parameter sets.

## Phase 4 - Octra Feasibility Lane

Goal: determine whether Octra is an execution layer, proof layer, or later integration.

Tasks:

- Read current AppliedML program constraints.
- Build minimal Octra program for storing model/run metadata or result commitments.
- Test whether a compact arithmetic operation can be represented cleanly.
- Compare HFHE docs/examples against prototype operation needs.

Decision gate:

- If Octra tooling cannot support the needed operations yet, position it as future decentralized encrypted-compute integration.
- If it can, add a small Octra-connected demo step.

## Phase 5 - Pilot Package

Goal: turn demo into a fundable or partner-ready project.

Deliverables:

- One-page brief.
- Technical memo.
- Benchmark CSV/JSON.
- Live local demo.
- 8-12 slide pitch deck.
- Risk register.
- Partner list.

## Candidate Pilot Domains

Recommended first wedge: wearable or industrial event telemetry.

Why:

- Naturally time-series.
- Easier than vision.
- Smaller feature windows.
- Privacy story is strong.
- Benchmark can be credible without a large dataset.

Avoid as first wedge:

- General encrypted LLM inference.
- Full video recognition.
- Autonomous driving.
- Medical diagnosis claims.
