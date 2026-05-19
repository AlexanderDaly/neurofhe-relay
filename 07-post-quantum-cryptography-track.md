# NeuroFHE Relay - Post-Quantum Cryptography Track

## Principle

If this project becomes part of the interface layer between biology, machines, and shared computational realities, it should remain understandable, reusable, and free. The project is released under CC0 because the basic architecture should be available as a commons.

The cryptographic goal should be equally explicit:

> Quantum-resistant by design, cryptographically agile by default.

## What Post-Quantum Means Here

Post-quantum cryptography does not mean "secure forever" and it does not mean "quantum-powered." It means using cryptographic algorithms designed to resist known attacks from both classical and quantum computers, especially attacks that threaten today's RSA, Diffie-Hellman, and elliptic-curve public-key systems.

For NeuroFHE Relay, post-quantum work splits into three layers:

1. **Transport and identity:** how clients, edge devices, and compute services authenticate and exchange keys.
2. **Encrypted computation:** how sensitive spike/event features remain encrypted during selected computation.
3. **Artifact integrity:** how model metadata, benchmark outputs, proofs, and releases are signed over time.

## Current Standards Baseline

The first implementation plan should align with NIST's finalized PQC standards:

- **ML-KEM / FIPS 203** for post-quantum key establishment.
- **ML-DSA / FIPS 204** for primary post-quantum digital signatures.
- **SLH-DSA / FIPS 205** as a conservative hash-based signature option.

NIST also selected HQC for further standardization as an additional KEM, and Falcon remains an additional signature standardization lane. Those should be tracked, not treated as first dependencies.

## FHE and Quantum Resistance

Most practical FHE schemes are lattice-based, and lattice cryptography is one of the main families used in post-quantum cryptography. That makes FHE directionally aligned with quantum-resistant design.

However, this project should not claim production-grade quantum safety merely because a prototype uses FHE. Real claims require:

- named algorithms,
- concrete parameter sets,
- security-level estimates,
- implementation review,
- side-channel analysis,
- dependency inventory,
- and a migration plan for algorithm changes.

## Architecture Requirements

### 1. Crypto Inventory

Every prototype should record its cryptographic dependencies:

```json
{
  "schema": "neurofhe.crypto.inventory.v1",
  "keyEstablishment": ["ML-KEM-768"],
  "signatures": ["ML-DSA-65"],
  "encryptedComputation": ["BFV", "CKKS", "TFHE", "HFHE-experimental"],
  "hashes": ["SHA-3", "BLAKE3"],
  "classicalFallbacks": ["X25519", "Ed25519"],
  "hybridMode": true,
  "notes": "Classical fallback is transitional; not a quantum-resistance claim."
}
```

### 2. Hybrid Migration

Early systems should support hybrid modes while the ecosystem matures:

- classical + ML-KEM for transport key establishment,
- classical + ML-DSA for signatures where ecosystem support is weak,
- documented removal path for quantum-vulnerable algorithms.

### 3. Cryptographic Agility

The project should avoid hard-coding one permanent algorithm choice. Each cryptographic role should be behind a small interface:

- key establishment provider,
- signature provider,
- encrypted-compute provider,
- hash/commitment provider,
- benchmark metadata signer.

The point is not abstraction for elegance. The point is survivability when algorithms, standards, or implementations change.

### 4. Biological Interface Safety

For biosignal, neural, wearable, medical-adjacent, or sensory-cognition use cases, the privacy bar is higher than ordinary application telemetry.

Minimum rule:

- Raw biological or behavioral signals stay local unless the user explicitly consents.
- Shared compute receives encrypted event features only.
- Benchmark artifacts must not contain reconstructable raw signals.
- Decryption keys remain under the data subject's or authorized controller's control.

## Prototype Roadmap Addendum

### Phase PQ-0 - Documentation

Status: current.

- State the CC0 commons principle.
- Add PQC baseline and standards references.
- Identify crypto agility as a project requirement.

### Phase PQ-1 - Inventory

Add `cryptoInventory` to benchmark outputs:

- algorithm family,
- implementation/library,
- parameter set,
- estimated security level,
- hybrid mode status,
- known caveats.

### Phase PQ-2 - Real Library Migration

Replace the toy additive demo with one real encrypted-compute prototype:

- OpenFHE BFV or CKKS for arithmetic spike-count inference, or
- TFHE/Concrete/TFHE-rs for binary threshold logic, or
- Octra/HFHE experiment if public tooling supports the operation cleanly.

### Phase PQ-3 - PQ Transport and Signing

Add post-quantum wrapping around the demo workflow:

- ML-KEM for session key establishment or simulated sealed event submission.
- ML-DSA or SLH-DSA for signed benchmark artifacts.
- Signed `project-brief.json` or benchmark JSON.

### Phase PQ-4 - Audit-Ready Claim Boundaries

Publish a security note with:

- threat model,
- algorithm choices,
- parameter assumptions,
- what remains visible to each party,
- why the prototype is not production cryptography,
- and what review would be required before deployment.

## Recommended Language

Use:

> NeuroFHE Relay is designed toward post-quantum cryptographic agility: FHE for encrypted computation, NIST-standard PQC for key establishment and signatures, and explicit crypto inventory for every prototype.

Avoid:

> This is quantum-proof.

Better:

> This is a research prototype with a post-quantum design target. Production claims require audited implementations, concrete parameter sets, and migration-ready cryptographic interfaces.

## Sources

- NIST PQC project: https://csrc.nist.gov/Projects/post-quantum-cryptography
- NIST approval of FIPS 203, 204, and 205: https://csrc.nist.gov/News/2024/postquantum-cryptography-fips-approved
- NIST NCCoE Migration to Post-Quantum Cryptography: https://www.nccoe.nist.gov/applied-cryptography/migration-to-pqc
- NIST PQC migration FAQ: https://pages.nist.gov/nccoe-migration-post-quantum-cryptography/FAQ/
- NIST IR 8547 transition plan: https://csrc.nist.gov/pubs/ir/8547/ipd

