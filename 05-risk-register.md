# NeuroFHE Relay - Risk Register

## Technical Risks

### R1 - FHE Latency Remains Too High

Risk: even sparse event workloads may be too slow for practical use.

Mitigation:

- Benchmark tiny kernels first.
- Compare against dense encrypted baseline.
- Treat real-time as a future goal, not a Phase 1 claim.

### R2 - SNN Accuracy Loss

Risk: quantization, spike encoding, and HE-friendly activation approximations reduce accuracy.

Mitigation:

- Start with simple classification tasks.
- Keep plaintext SNN and encrypted SNN metrics side by side.
- Optimize representation before optimizing cryptography.

### R3 - Octra Tooling Maturity

Risk: Octra's public tooling may not yet support the exact operations or developer flow needed.

Mitigation:

- Keep Octra as an integration lane.
- Use mature HE libraries for the first local demo.
- Add Octra only after a compact operation family is proven.

### R4 - Misleading Security Claims

Risk: overstating privacy guarantees before cryptographic review.

Mitigation:

- Use research-grade language.
- State key ownership and threat model explicitly.
- Avoid production or compliance claims until audited.

### R5 - Neuromorphic Hardware Access

Risk: Loihi/SpiNNaker-style hardware access may be limited or slow to secure.

Mitigation:

- Begin with software SNN simulation.
- Keep hardware acceleration optional.
- Use neuromorphic representation as the first proof, not chip access.

### R6 - Overclaiming Quantum Safety

Risk: the project implies "quantum-proof" security before using real PQC libraries, parameter sets, and implementation review.

Mitigation:

- Use "post-quantum design target" language.
- Add crypto inventory to every benchmark.
- Treat ML-KEM, ML-DSA, and SLH-DSA as the baseline standards for surrounding transport/signature layers.
- Require audit-ready threat models before production claims.

### R7 - Overclaiming Bio-Digital or Medical Scope

Risk: bio-digital framing is mistaken for medical diagnosis, treatment, regulated device performance, or clinical validation.

Mitigation:

- Use privacy-preserving event intelligence language.
- Keep synthetic and research-grade caveats visible.
- Do not make diagnostic or treatment claims.
- Require real datasets, clinical validation, regulatory strategy, and legal review before any medical-adjacent deployment language.

### R8 - Gateway Export Policy Too Broad

Risk: a model-facing event accidentally leaks raw payloads, stable source identifiers, exact timestamps, or reconstructable sparse signal details.

Mitigation:

- Treat all raw intake as sensitive by default.
- Require explicit export allowlists for source kind, event type, fields, and action types.
- Hash source IDs, bucket timestamps, aggregate sparse metrics, and withhold raw payloads before model access.
- Add tests that scan gateway outputs for known local-only fields and identifiers.

### R9 - Unsafe Recommendation Becomes Action

Risk: a model or agent returns a direct device command, coercive action, surveillance action, or overconfident recommendation that bypasses local review.

Mitigation:

- Allow models to return recommendations only, never direct raw-device commands.
- Route every recommendation back through the gateway policy validator.
- Execute only local, reversible, allowlisted actions.
- Require explicit human approval for higher-risk actions and reject external-control actions by default.

## Market Risks

### M1 - Too Technical for Buyers

Risk: buyers may not care about SNN/FHE details.

Mitigation:

- Lead with privacy-preserving event intelligence.
- Use concrete domains: wearables, industrial telemetry, robotics safety.
- Keep technical appendix separate.

### M2 - Competing Privacy Approaches

Risk: trusted execution environments, differential privacy, on-device-only models, or secure MPC may be cheaper.

Mitigation:

- Position FHE for cases where data must be computed externally without trust.
- Include comparison table in later materials.
- Avoid claiming FHE is always the right answer.

### M3 - Crypto Market Noise

Risk: Octra/Web3 association may distract from the technical value.

Mitigation:

- Present the core demo without token dependence.
- Frame Octra as optional encrypted-compute infrastructure.
- Emphasize workload compiler, benchmarks, and privacy boundary.

## Execution Risks

### E1 - Scope Creep

Risk: project expands into FHE accelerator, blockchain app, neuromorphic hardware, AI model zoo, and investor deck all at once.

Mitigation:

- First milestone: one tiny encrypted SNN inference benchmark.
- Second milestone: one visual demo.
- Third milestone: Octra feasibility note.

### E2 - No Clear Demo

Risk: project remains an interesting memo without visible proof.

Mitigation:

- Build a minimal interactive demo early.
- Show what each actor sees: edge, compute provider, client.
- Include benchmark outputs in the UI.

## Go / No-Go Criteria

Go if:

- Sparse event workload reduces encrypted operation count.
- Accuracy remains plausible.
- Privacy boundary is easy to explain.
- Prototype produces real metrics.

No-go or pivot if:

- FHE cost is not materially improved by the SNN/event path.
- Octra integration becomes the story before local evidence exists.
- "Quantum-proof" language appears before concrete cryptographic parameters and review.
- The demo cannot explain itself in under two minutes.
