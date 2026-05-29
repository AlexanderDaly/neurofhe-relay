# NeuroFHE Relay

Presentation package for a privacy-preserving neuromorphic + homomorphic-encryption project.

```text
                 NEUROFHE RELAY

  raw local signals
  files | sensors | apps | logs | simulated streams
          |
          v
  +--------------------------+
  | spatial spike sorter     |
  | FPGA / edge target       |
  +------------+-------------+
               |
               v
  +--------------------------+       raw payloads stay local
  | local relay gateway      |<--------------------------------+
  | normalize + policy       |                                 |
  +------------+-------------+                                 |
               |                                               |
               v                                               |
    approved minimal event representation                      |
               |                                               |
               v                                               |
  +--------------------------+                                 |
  | encrypted compute        |                                 |
  | model / agent service    |                                 |
  +------------+-------------+                                 |
               |                                               |
               v                                               |
        recommendation only                                    |
               |                                               |
               v                                               |
  +--------------------------+                                 |
  | gateway validation       |---------------------------------+
  | safe local action only   |
  +--------------------------+
```

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

## First Paths

Use the path that matches your job, then fall back to `docs/README.md` for the
complete documentation index:

| Role | Start With | Then Use |
| --- | --- | --- |
| New reviewer | `docs/reviewer-quickstart.md` | `docs/faq.md`, `docs/status-roadmap.md`, `CHANGELOG.md`, `VALIDATION.md` |
| Contributor | `docs/developer-quickstart.md` | `docs/command-reference.md`, `docs/troubleshooting.md`, `CONTRIBUTING.md` |
| Maintainer | `MAINTAINERS.md` | `docs/maintainer-checklist.md`, `docs/operations-runbook.md`, `RELEASE.md` |
| Evidence reviewer | `docs/evidence-guide.md` | `docs/evidence-dashboard.md`, `docs/claim-evidence-ledger.md`, `docs/release-gate-matrix.md` |

The repository remains a research-alpha package. Keep `productionClaim: false`,
`privacyBoundary`, `cryptoInventory`, CC0/public-domain framing, and the
bio-digital event intelligence boundary intact unless stronger evidence is
actually present and documented.

## Repository Layout

`PACKAGE_MANIFEST.md` is the detailed file inventory. The top-level layout is:

| Path | Purpose |
| --- | --- |
| `docs/` | Reader, contributor, maintainer, evidence, and release navigation. |
| `prototype/` | Portable demo code, test suite, artifact publishers, and native lane adapters. |
| `benchmark-artifacts/` | Committed derived evidence, blocker reports, and release dashboards. |
| `patent/` | ENER provisional drafting package, drawings, prior-art plan, and briefing material. |
| `.github/` | Issue templates, PR template, dependency-update routing, and hosted portable CI workflow. |
| Root policy files | `LICENSE`, `PUBLIC_DOMAIN_NOTICE.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `MAINTAINERS.md`, `RELEASE.md`, and `VALIDATION.md`. |

Use `PACKAGE_MANIFEST.md` when you need the exhaustive packaged-review
inventory; keep this README focused on orientation, claims, and commands.

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

## Quick Commands

Use `docs/command-reference.md` for the full command list and `RELEASE.md` for
release-gate commands. The common root commands are:

| Job | Command |
| --- | --- |
| Portable local gate | `npm run ci` and `git diff --check` |
| Educational sparse encrypted scorer | `npm run demo` |
| Local relay gateway scaffold | `npm run gateway:demo` |
| Publish the synthetic benchmark artifact | `npm run benchmark:artifact` |
| Refresh the caveated release dashboard | `npm run release:evidence -- --artifact` |

The release-evidence index is a dashboard artifact only. It does not satisfy the
release gate or upgrade any caveated benchmark, privacy, native-library,
real-data baseline, or security claim.

## Relay Gateway Pattern

The relay gateway is the local trust boundary for the project. It accepts raw or semi-structured local signals, routes raw neural-like intake through a spatial-aware spike sorter, normalizes the sorter output into structured events, applies privacy and safety policy, and exports only approved minimal event representations to downstream encrypted compute, model services, or agents.

The runnable scaffold demonstrates:

- Sensitive raw intake treated as local-only by default.
- A canonical `rawNeuralFrame -> spatialSpikeSorter -> eventWindow` encoder stage designed around FPGA- or edge-friendly integer operations.
- Pre-sorted `sortedNeuralEvent` imports still pass through gateway validation, sanitization, and export policy before normalization.
- Optional cortical region or layer context tags, such as A1 and layers I through VI, are validated locally and exported only as aggregate summaries or encrypted references.
- Normalized event records with provenance, confidence, schema version, and validation status.
- Model-facing events with explicit plaintext, encrypted, aggregated, and withheld fields.
- Recommendation validation that accepts safe local reversible actions and rejects raw device commands.
- Audit and sanitized replay records that do not expose raw signal payloads.

The gateway is simulated and educational in this package. It is not a medical, surveillance, coercive-control, mind-reading, external-control, or production cryptography system.

## Evidence Snapshot

The runnable prototype demonstrates active-event sparse scoring with toy
additive homomorphic encryption over a fixed linear model contract:
`scores = W x + bias`. The benchmark family keeps dense/raw, unsorted-spike,
and spatial-sorted representations comparable while preserving
`privacyBoundary`, `cryptoInventory`, and `productionClaim: false`.

Committed evidence includes derived UCI EEG Eye State plaintext artifacts,
sampled public N-MNIST plaintext artifacts, synthetic reconstruction-risk
probes, metadata-padding ablations, native OpenFHE and TFHE-rs comparison
artifacts or blockers, repository hygiene evidence, and the caveated
release-evidence dashboard. Use `docs/evidence-guide.md`,
`docs/evidence-dashboard.md`,
`benchmark-artifacts/README.md`, and `docs/release-gate-matrix.md` before
turning any artifact into a public or release-facing claim.

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
