# ENER Weak Claims and Evidence Gaps

This file identifies claims or statements that need evidence before publication, investor diligence, grant submission, or nonprovisional patent conversion.

| Area | Current Weakness | Evidence Needed |
|---|---|---|
| Latent compression performance | The specification describes bandwidth and compute reductions broadly. | Benchmarks comparing raw, dense feature, sparse feature, and compressed latent encrypted inference. |
| Real neural modality validation | Current repo validation is a research-grade prototype and does not establish real EEG, ECoG, fNIRS, MEG, or implanted-array performance. | Experiments on public or collected datasets with documented preprocessing and model accuracy. |
| Reconstruction resistance | The draft describes adversarial reconstruction defenses but does not prove them. | Reconstruction attack tests, identity leakage tests, mutual-information estimates, and acceptance criteria. |
| Homomorphic feasibility | The prototype uses a toy additive path and OpenFHE integration plan, not a complete production FHE deployment. | Native OpenFHE, SEAL, Concrete, TFHE-rs, or equivalent benchmark with parameter reports. |
| Adaptive compression controller | The controller is architected but not implemented as a verified module. | Control policy implementation, ablation studies, and tradeoff curves. |
| Metadata leakage mitigation | Padding, batching, and encrypted indices are described but not quantified. | Threat model, leakage metrics, and tests across privacy modes. |
| Clinical or neurodiagnostic examples | Medical use cases are described as possible applications. | Clinical validation, intended-use analysis, FDA pathway assessment, and human factors review. |
| Federated encrypted neurolearning | Federated learning is a plausible extension. | Protocol specification, secure aggregation tests, update-leakage analysis, and dataset governance plan. |
| Standards positioning | Standards opportunities are plausible but not yet anchored to a working group. | Mapping to NIST, IEEE, ISO/IEC, HL7, FIDO, or neurotechnology standards forums. |
| Commercial defensibility | FTO extraction suggests the blockchain lane is crowded, but ENER-specific FTO remains incomplete. | Targeted prior-art review on encrypted latent neural inference and adaptive FHE-oriented compression. |

## Examiner-Risk Notes Added May 21, 2026

The highest-risk broad claim posture is "local neural compression plus encrypted inference" without a concrete implementation limit. The stronger near-term claim posture is the spatial sparse-event relay:

```text
local spatial spike sorter -> permitted active positions -> encrypted active feature values -> BFVrns depth-1 scorer -> local authorized decryption
```

Evidence still needed for nonprovisional conversion:

- Real OpenFHE BFVrns benchmark results on the native target, including latency, memory, ciphertext size, parameter set, and noise-budget observations.
- Dense/raw versus public-position versus padded-sparse versus dense-window comparison on a real event dataset such as N-MNIST or another rights-cleared neural/event dataset.
- Reconstruction and identity-linkage attack results for dense raw windows, unsorted sparse events, spatial-sorted events, and padded sparse batches.
- A counsel-verified prior-art chart against PrivSpike, SpENCNN, Nikfam BFV-SNN, FHE-DiSNN, and any closer patent families.
