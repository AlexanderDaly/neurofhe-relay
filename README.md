# NeuroFHE Relay

Presentation package for a privacy-preserving neuromorphic + homomorphic-encryption project.

## Core Thesis

Neuromorphic systems are attractive because they turn sensory streams into sparse events and spiking neural network activity. Homomorphic encryption is attractive because it allows useful computation without decrypting the underlying data. The project opportunity is to combine them at the workload boundary:

1. Neuromorphic edge hardware or software produces compact spike/event features.
2. Sensitive features are encrypted before leaving the local environment.
3. FHE or Octra-style encrypted compute evaluates selected inference, policy, or verification steps.
4. Only the final result, proof, or decision is decrypted by the authorized party.

This avoids the weak claim that current neuromorphic chips should directly run full FHE bootstrapping. Instead, the project uses neuromorphic sparsity to make encrypted inference smaller and more practical.

## Commons Principle

If this becomes part of the interface layer between biology, machines, and shared computational realities, the basic architecture should be free to inspect, copy, improve, and teach. That is why the repository is released under CC0.

The cryptographic design target is:

> Quantum-resistant by design, cryptographically agile by default.

## Package Contents

- `LICENSE` - CC0 1.0 Universal public-domain dedication.
- `PUBLIC_DOMAIN_NOTICE.md` - plain-English free-use notice.
- `01-one-pager.md` - executive one-page brief.
- `02-pitch-deck.md` - 11-slide presentation narrative.
- `03-technical-architecture.md` - system architecture and data flow.
- `04-demo-roadmap.md` - prototype plan from desk demo to fundable pilot.
- `05-risk-register.md` - technical, market, and execution risks.
- `06-evidence-and-sources.md` - source-backed research notes.
- `07-post-quantum-cryptography-track.md` - PQC design target and roadmap.
- `08-encrypted-thoughts-whitepaper.md` - whitepaper on encrypted-thoughts architecture for BCI and neural-data privacy.
- `09-relay-gateway-pattern.md` - local-first gateway pattern for raw-signal intake, privacy filtering, model-facing events, recommendations, audit, replay, and failure handling.
- `10-native-performance-track.md` - native-first implementation boundary for low-latency and energy-aware execution.
- `project-brief.json` - structured project metadata for agents.
- `index.html` - self-contained briefing deck for browser presentation.
- `prototype/` - dependency-free educational sparse encrypted spike-count prototype, relay gateway scaffold, benchmark runner, tests, and research assumptions.
- `package.json` - local command scripts. The package is marked private to prevent accidental npm publication; it does not change the repository's CC0 license.

## Recommended Framing

Use the phrase:

> A privacy layer for event-driven AI: neuromorphic systems make data sparse, FHE keeps the sensitive computation private.

For the biology and digital interface framing, use:

> Bio-digital event intelligence: sensitive signals stay local, compact event features cross the boundary under explicit privacy and cryptographic controls.

For the BCI privacy framing, use "encrypted thoughts" as an architecture phrase, not as a literal mind-reading claim:

> Signals capable of supporting thought, intent, language, or cognitive-state inference should stay local by default, and selected event features should remain encrypted during external computation.

For the gateway framing, use:

> The local gateway is the only trusted boundary allowed to inspect raw signals. Models receive only validated, transformed, permissioned event representations.

Avoid medical-device language until a real regulated use case, dataset, clinical validation path, and legal review exist. The current prototype is about privacy-preserving event representation and encrypted scoring, not diagnosis or treatment.

Avoid saying:

> We run Octra directly on neuromorphic chips.

That is not defensible today. The defensible near-term claim is a hybrid architecture: neuromorphic preprocessing plus FHE-protected inference/verification.

## Relay Gateway Pattern

The relay gateway is the local trust boundary for the project. It accepts raw or semi-structured local signals, routes raw neural-like intake through a spatial-aware spike sorter, normalizes the sorter output into structured events, applies privacy and safety policy, and exports only approved minimal event representations to downstream encrypted compute, model services, or agents.

The runnable scaffold demonstrates:

- Sensitive raw intake treated as local-only by default.
- A canonical `rawNeuralFrame -> spatialSpikeSorter -> eventWindow` encoder stage designed around FPGA- or edge-friendly integer operations.
- Normalized event records with provenance, confidence, schema version, and validation status.
- Model-facing events with explicit plaintext, encrypted, aggregated, and withheld fields.
- Recommendation validation that accepts safe local reversible actions and rejects raw device commands.
- Audit and sanitized replay records that do not expose raw signal payloads.

The gateway is simulated and educational in this package. It is not a medical, surveillance, coercive-control, mind-reading, external-control, or production cryptography system.

## Desk Demo

Run the included educational prototype:

```sh
npm run demo
```

Emit the benchmark schema, including dense/raw, unsorted-spike, and spatial-sorted representation comparison:

```sh
npm run benchmark
```

Run the local-first relay gateway scaffold:

```sh
npm run gateway:demo
```

Print the real OpenFHE BFVrns integration plan:

```sh
npm run benchmark:openfhe
```

Run a plaintext N-MNIST-compatible baseline against a local extracted dataset:

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

The prototype demonstrates active-event sparse scoring with toy additive homomorphic encryption over a fixed linear model contract: rows are classes, columns are flattened event features, and the public score equation is `scores = W x + bias`. The benchmark now compares dense/raw windows, unsorted spikes, and spatial-sorted events on that same task so representation cost and metadata leakage stay visible. The compute side sees public active event positions and ciphertext active spike values, which lowers encrypted operations but may leak sparsity/timing metadata. It is deliberately marked as non-production. A real OpenFHE BFVrns C++ integration target is now included under `prototype/openfhe/`, while SEAL/TenSEAL, Concrete, TFHE-rs, or an Octra/HFHE experiment remain candidate follow-on lanes.

## Prototype Boundary

The JavaScript prototype is a portable contract harness, not the target runtime for low-level execution. Performance-critical paths should move to native HE libraries, systems code, or hardware-aware edge implementations, with Node kept for demos, artifact generation, schema checks, and orchestration. See `10-native-performance-track.md`.

This repository is CC0. If the project later needs proprietary implementation, keep partner-specific adapters, datasets, trained weights, deployment code, and non-public library integrations in a separate private repository with explicit dependency and license review. Do not import proprietary reverse-engineered code into this public reference package.

## Post-Quantum Direction

NeuroFHE Relay should pair FHE-style encrypted computation with NIST-standard post-quantum cryptography for transport, identity, and artifact integrity:

- ML-KEM / FIPS 203 for key establishment.
- ML-DSA / FIPS 204 for primary digital signatures.
- SLH-DSA / FIPS 205 as a conservative hash-based signature option.

The project should not claim production quantum safety until real libraries, parameter sets, implementation review, and side-channel analysis exist. The near-term standard is to build a crypto inventory and keep every cryptographic role replaceable.

## License

Released under **CC0 1.0 Universal**.

The intent is absolute free use: copy, modify, publish, sell, sublicense, and build on this project for any purpose without asking permission and without attribution.
