# NeuroFHE Relay - One-Page Brief

## One-Liner

NeuroFHE Relay is a privacy-preserving compute layer for neuromorphic AI: sparse event streams are produced at the edge, encrypted, and evaluated through FHE or Octra-style encrypted compute without exposing the raw signal.

## Problem

Sensors and AI models are moving closer to sensitive physical environments: cameras, wearables, robotics, medical devices, industrial monitoring, smart buildings, and defense-adjacent edge systems. These systems collect data that is valuable precisely because it is intimate, continuous, and context-rich.

Current choices are poor:

- Send raw data to the cloud and accept privacy/security exposure.
- Keep everything local and lose shared intelligence, auditability, or marketplace access.
- Use ordinary encryption for storage and transport, but decrypt during inference.
- Use FHE directly on large dense models and hit severe latency/cost limits.

## Insight

Neuromorphic architectures and spiking neural networks naturally compress activity into sparse events. FHE is expensive, but its cost is strongly shaped by circuit size, depth, packing, and operation count. If the AI workload is designed around sparse spikes, binary thresholds, quantized weights, and compact event windows, encrypted inference becomes more plausible.

The project is not "neuromorphic hardware as a drop-in FHE accelerator." It is a co-designed pipeline where neuromorphic representation makes the encrypted workload smaller.

## Product Concept

NeuroFHE Relay provides:

- Event/spike encoder for sensor and model outputs.
- Encryption adapter for spike features, event windows, and compact embeddings.
- FHE inference kernels for selected SNN layers or policy functions.
- Octra integration lane for encrypted compute programs, proof/settlement logic, or decentralized verification.
- Benchmark harness comparing plaintext SNN, encrypted SNN, and hybrid local/FHE execution.

## First Demo

The current CLI research-alpha scaffold is deliberately small:

1. Run the toy sparse encrypted scorer and local relay gateway demos.
2. Generate or ingest N-MNIST-like spike/event frames for plaintext baselines.
3. Publish derived baseline, privacy-mode, reconstruction-risk, and release-evidence artifacts.
4. Compare OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs native lanes where local dependencies are available.
5. Record blockers with exact commands, errors, and smallest next steps when dependencies or input adapters are missing.
6. Show latency, accuracy, ciphertext size, operation counts, and the privacy boundary with explicit caveats.

Octra is introduced as an integration path, not as a dependency for the first bench.

## Initial Wedge

Private edge inference for sensitive low-bandwidth signals:

- Wearable biosignals.
- Event-camera security analytics.
- Industrial anomaly detection.
- Robotics telemetry.
- Smart-building occupancy and safety signals.

The first marketable claim is "privacy-preserving event intelligence," not generic private AI.

## Why Now

- FHE libraries are usable enough for prototypes.
- Neuromorphic software frameworks and SNN tooling are maturing.
- Event-driven sensors and edge AI are expanding.
- Regulation and enterprise risk make raw-data AI pipelines harder to justify.
- Octra and similar encrypted-compute networks are trying to make FHE accessible to application developers.
- NIST post-quantum standards now give the surrounding transport and signature layers a concrete migration target.

## Commons and Cryptography Position

If this becomes foundational for biology-machine communication or shared computational realities, the baseline should be free. NeuroFHE Relay is released under CC0 so the architecture can be inspected, taught, copied, and improved without permission.

The cryptographic target is not "quantum-proof" marketing. It is quantum-resistant design with crypto agility:

- FHE for encrypted computation.
- ML-KEM for post-quantum key establishment.
- ML-DSA or SLH-DSA for post-quantum signatures.
- Crypto inventory in every benchmark artifact.

## Moat Hypothesis

The moat is not one encryption primitive. It is the workload compiler:

- Convert event streams into HE-friendly spike tensors.
- Select the right scheme for the model segment.
- Keep ciphertext packing, sparsity, and activation approximation under one contract.
- Produce auditable privacy/performance benchmarks.

## 90-Day Evidence Target

Produce a credible research-alpha evidence package:

- Tiny plaintext event/SNN baseline.
- Sparse encrypted-score contract with native HE adapter lanes.
- Caveated benchmark table.
- Post-quantum crypto inventory.
- Octra feasibility note.
- Reviewer-facing briefing deck and local CLI demo evidence.

## Ask

Permission to pursue a focused 90-day research-alpha evidence package, with the first milestone being local benchmarks that test whether sparse event inference can materially reduce encrypted inference cost.
