# NeuroFHE Relay

Presentation package for a privacy-preserving neuromorphic + homomorphic-encryption project.

## Core Thesis

Neuromorphic systems are attractive because they turn sensory streams into sparse events and spiking neural network activity. Homomorphic encryption is attractive because it allows useful computation without decrypting the underlying data. The project opportunity is to combine them at the workload boundary:

1. Neuromorphic edge hardware or software produces compact spike/event features.
2. Sensitive features are encrypted before leaving the local environment.
3. FHE or Octra-style encrypted compute evaluates selected inference, policy, or verification steps.
4. Only the final result, proof, or decision is decrypted by the authorized party.

This avoids the weak claim that current neuromorphic chips should directly run full FHE bootstrapping. Instead, the project uses neuromorphic sparsity to make encrypted inference smaller and more practical.

## Package Contents

- `LICENSE` - CC0 1.0 Universal public-domain dedication.
- `PUBLIC_DOMAIN_NOTICE.md` - plain-English free-use notice.
- `01-one-pager.md` - executive one-page brief.
- `02-pitch-deck.md` - 11-slide presentation narrative.
- `03-technical-architecture.md` - system architecture and data flow.
- `04-demo-roadmap.md` - prototype plan from desk demo to fundable pilot.
- `05-risk-register.md` - technical, market, and execution risks.
- `06-evidence-and-sources.md` - source-backed research notes.
- `project-brief.json` - structured project metadata for agents.
- `index.html` - self-contained briefing deck for browser presentation.
- `prototype/` - dependency-free educational encrypted spike-count demo.

## Recommended Framing

Use the phrase:

> A privacy layer for event-driven AI: neuromorphic systems make data sparse, FHE keeps the sensitive computation private.

Avoid saying:

> We run Octra directly on neuromorphic chips.

That is not defensible today. The defensible near-term claim is a hybrid architecture: neuromorphic preprocessing plus FHE-protected inference/verification.

## Desk Demo

Run the included educational prototype:

```sh
node artifacts/neurofhe-relay/prototype/toy-neurohe-demo.mjs
```

It demonstrates encrypted sparse spike-count scoring with toy additive homomorphic encryption. It is deliberately marked as non-production and should be replaced with OpenFHE, SEAL/TenSEAL, Concrete, TFHE-rs, or an Octra/HFHE experiment in the next milestone.

## License

Released under **CC0 1.0 Universal**.

The intent is absolute free use: copy, modify, publish, sell, sublicense, and build on this project for any purpose without asking permission and without attribution.
