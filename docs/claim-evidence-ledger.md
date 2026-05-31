# Claim Evidence Ledger

Use this ledger when translating project language into public copy, investor
notes, patent review notes, or release decisions. It maps the weak-claim areas
from `patent/briefing/ENER_weak_claims_evidence_gaps.md` to current repository
evidence and the caveat that must travel with each topic.

This ledger is not release approval, production cryptography evidence, medical
or clinical validation, side-channel analysis, identity-protection evidence, or
a security certification.

## Current Evidence Anchors

- `benchmark-artifacts/release-evidence/latest.json` - dashboard only;
  `releaseGateSatisfied: false`.
- `benchmark-artifacts/native-evidence/latest.json` - native-lane evidence and
  measurement gaps.
- `benchmark-artifacts/privacy-modes/padding-ablation/latest.json` - metadata
  exposure taxonomy and padding overhead proxy.
- `benchmark-artifacts/reconstruction-risk/latest.json` - synthetic gateway
  reconstruction-risk probes with `privacyProofClaim: false`.
- `benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json` - sampled
  real public N-MNIST plaintext baseline.
- `benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json` - TFHE-rs
  real-data input blocker.

Keep `productionClaim: false`, `privacyBoundary`, and `cryptoInventory` intact
where artifact metadata carries those fields.

## Weak-Claim Ledger

| Weak-Claim Area | Current Evidence | Required Caveat | Next Evidence Step |
| --- | --- | --- | --- |
| Latent compression performance | Synthetic representation comparison, N-MNIST plaintext compression curves, and padding ablation artifacts. | Not encrypted dataset-scale compression evidence. | Compare raw, dense, sparse, and compressed latent contracts under native FHE sweeps. |
| Real neural modality validation | UCI EEG Eye State plaintext baseline and sampled N-MNIST plaintext baseline artifacts. | Plaintext preprocessing/model evidence only; not medical, encrypted-compute, or deployment evidence. | Add more public modality baselines and encrypted native runs over derived real-data contracts. |
| Reconstruction resistance | Synthetic gateway probe artifact records raw-payload and active-value withholding. | `privacyProofClaim: false`; public-position linkage remains residual risk. | Add reconstruction attacks, identity-linkage tests, mutual-information estimates, and acceptance criteria. |
| Homomorphic feasibility | TFHE-rs synthetic native run, OpenFHE BFVrns and CKKS lanes, blocker artifacts, and native evidence manifest. | Native evidence remains local and incomplete; not production cryptography or stable performance. | Run multi-window native BFVrns, CKKS, and TFHE-rs sweeps with ciphertext-byte and RSS or peak-memory measurements. |
| Adaptive compression controller | Architecture and roadmap language only. | No verified controller module or ablation evidence yet. | Implement a bounded control policy and publish tradeoff curves. |
| Metadata leakage mitigation | Padding ablation records observable-category proxy and operation overhead. | Proxy only; not anonymity, mutual information, side-channel, or reconstruction-resistance proof. | Add formal leakage metrics and real-data padded-sparse overhead measurements. |
| Clinical or neurodiagnostic examples | Claim-boundary docs and README caveats explicitly avoid medical-device positioning. | No clinical validation, intended-use analysis, FDA pathway, or human-factors review. | Keep examples non-medical unless a regulated-use plan and validation package exist. |
| Federated encrypted neurolearning | Mentioned only as an extension path. | No protocol specification, secure aggregation test, or update-leakage analysis. | Write a protocol stub only after governance and leakage questions are scoped. |
| Standards positioning | PQC and standards themes appear in briefing material. | No working-group mapping or standards contribution yet. | Map claims to specific NIST, IEEE, ISO/IEC, HL7, FIDO, or neurotechnology forums. |
| Commercial defensibility | Patent briefing materials and ENER evidence-gap notes exist. | Freedom-to-operate and ENER-specific prior-art review remain incomplete. | Complete targeted prior-art review for encrypted latent neural inference and adaptive FHE-oriented compression. |

## Public-Copy Rule

When a sentence sounds stronger than the current evidence row, either narrow it
to the evidence class or move it to future work. Do not use blocker artifacts,
toy arithmetic, plaintext baselines, dashboard indexes, or synthetic probes as
substitutes for missing native, privacy, clinical, security, or deployment
evidence.
