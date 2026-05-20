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
- `project-brief.json` - structured project metadata for agents.
- `index.html` - self-contained briefing deck for browser presentation.
- `prototype/` - dependency-free educational sparse encrypted spike-count prototype, benchmark runner, tests, and research assumptions.
- `package.json` - local command scripts. The package is marked private to prevent accidental npm publication; it does not change the repository's CC0 license.

## Recommended Framing

Use the phrase:

> A privacy layer for event-driven AI: neuromorphic systems make data sparse, FHE keeps the sensitive computation private.

For the biology and digital interface framing, use:

> Bio-digital event intelligence: sensitive signals stay local, compact event features cross the boundary under explicit privacy and cryptographic controls.

Avoid medical-device language until a real regulated use case, dataset, clinical validation path, and legal review exist. The current prototype is about privacy-preserving event representation and encrypted scoring, not diagnosis or treatment.

Avoid saying:

> We run Octra directly on neuromorphic chips.

That is not defensible today. The defensible near-term claim is a hybrid architecture: neuromorphic preprocessing plus FHE-protected inference/verification.

## Desk Demo

Run the included educational prototype:

```sh
npm run demo
```

Emit the benchmark schema:

```sh
npm run benchmark
```

The prototype demonstrates active-event sparse scoring with toy additive homomorphic encryption over a fixed linear model contract: rows are classes, columns are flattened event features, and the public score equation is `scores = W x + bias`. The compute side sees public active event positions and ciphertext active spike values, which lowers encrypted operations but may leak sparsity/timing metadata. It is deliberately marked as non-production and should be replaced with OpenFHE, SEAL/TenSEAL, Concrete, TFHE-rs, or an Octra/HFHE experiment in the next milestone.

## Prototype Boundary

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
