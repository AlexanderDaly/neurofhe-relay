# Architecture Decisions

Use this log to distinguish intentional repository boundaries from open
evidence gaps. It is a reviewer aid, not a release approval record.

Nothing here upgrades NeuroFHE Relay into production cryptography, clinical
validation, medical software, deployment evidence, a privacy proof, or a
security certification.

## Current Decisions

| Decision | Status | Rationale | Caveat |
| --- | --- | --- | --- |
| Keep the public repository under CC0. | Accepted | The reference architecture should remain easy to inspect, copy, teach, and improve. | CC0 does not imply that future proprietary adapters, partner data, deployment code, or trained weights belong in this repository. |
| Treat the package as research-alpha. | Accepted | The current evidence supports a diligence-ready research package, not a production product. | `releaseGateSatisfied: false` remains true until `RELEASE.md` gates are rerun and satisfied. |
| Preserve `productionClaim: false` on artifact and lane metadata. | Accepted | Evidence artifacts must not be read as production cryptography, stable performance, medical, or deployment proof. | Any stronger claim needs new evidence and release review. |
| Preserve `privacyBoundary` and `cryptoInventory` where artifacts carry those fields. | Accepted | Reviewers need to see what stays local, what crosses boundaries, and which crypto posture is being represented. | These metadata fields are evidence descriptors, not privacy or security proofs. |
| Use bio-digital event intelligence language for public framing. | Accepted | The repo frames local signal handling, event features, and encrypted compute without literal mind-reading or medical-device claims. | Clinical or neurodiagnostic language remains out of scope without regulated-use evidence. |
| Keep toy additive prototype code separate from native OpenFHE and TFHE-rs lanes. | Accepted | The toy additive path is for schema and workflow education; native OpenFHE and TFHE-rs lanes are for real-library comparison where dependencies exist. | Toy arithmetic cannot substitute for native FHE benchmark evidence. |
| Keep raw data stays outside git. | Accepted | Public datasets, raw EEG/neural/sensor data, partner material, and private payloads do not belong in the repository. | Only derived artifacts, provenance, and blocker reports should be committed. |
| Keep repository ruleset/admin policy separate from code or CI failures. | Accepted | PR #23 is green in hosted `Portable validation`, while merge remains controlled by repository ruleset/admin policy. | No merge or release tag should happen without satisfying the documented gates and explicit user approval. |

## Review Rule

When changing a decision above, update the linked policy, evidence, release, or
validation files in the same PR. If the change would strengthen a claim, update
`docs/claim-evidence-ledger.md` and verify the new evidence before changing
public copy.
