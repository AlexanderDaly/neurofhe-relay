# NeuroFHE Relay - Evidence and Sources

## Neural Data, BCI Privacy, and Mental Privacy

Sources:

- UNESCO neurotechnology ethics standard press release: https://www.unesco.org/en/articles/ethics-neurotechnology-unesco-adopts-first-global-standard-cutting-edge-technology
- UNESCO Recommendation on the Ethics of Neurotechnology: https://www.unesco.org/en/legal-affairs/recommendation-ethics-neurotechnology
- OECD responsible innovation and neurotechnology policy work: https://www.oecd.org/en/topics/responsible-innovation.html
- Colorado HB24-1058, Protect Privacy of Biological Data: https://leg.colorado.gov/bills/hb24-1058
- California SB 1223, neural data under sensitive personal information: https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB1223
- FDA neurological devices page and implanted BCI guidance pointer: https://www.fda.gov/medical-devices/products-and-medical-procedures/neurological-devices
- Semantic reconstruction of continuous language from non-invasive brain recordings: https://www.nature.com/articles/s41593-023-01304-9
- A high-performance neuroprosthesis for speech decoding and avatar control: https://www.nature.com/articles/s41586-023-06443-4

Useful takeaways:

- Neural data is moving from speculative ethics issue into explicit law and policy. Colorado added biological data, including neural data, to sensitive-data treatment in 2024. California added neural data to CCPA sensitive personal information in 2024.
- UNESCO's 2025 neurotechnology recommendation places mental privacy, personal identity, autonomy, human dignity, consent, transparency, and safeguards against manipulation near the center of the governance problem.
- BCI and neural-decoding research already demonstrates useful language and speech reconstruction workflows. The responsible public claim is not that arbitrary thoughts are readable today; it is that decode-capable neural and biosignal features deserve stronger privacy defaults before the technology becomes routine.
- FDA's implanted BCI guidance confirms that clinical BCI devices are a serious regulated device category. NeuroFHE Relay should keep its current non-medical, research-alpha boundary unless a real regulated use case, dataset, validation plan, and legal review exist.
- These sources support the encrypted-thoughts whitepaper's architecture claim: raw neural signals should stay local by default, and selected event features should remain encrypted during external computation.

## Octra

Octra's official docs describe the network as an FHE blockchain with isolated execution environments, usable as a standalone L1 or decentralized encrypted middleware.

Key evidence:

- Octra docs welcome page: https://docs.octra.org/
- Octra site: https://octra.org/
- Octra HFHE docs: https://docs.octra.org/tech-docs/hfhe
- Octra programs docs: https://docs.octra.org/developer-docs/programs
- Octra `pvac_hfhe_cpp`: https://github.com/octra-labs/pvac_hfhe_cpp
- Octra GitHub org: https://github.com/octra-labs

Useful takeaways:

- Octra positions itself as universal encrypted compute for blockchain, AI, and apps.
- Public docs say Octra uses HFHE, an in-house hypergraph FHE approach.
- Docs describe circles as isolated execution environments.
- Programs are written in AppliedML with WASM support described as part of the developer path.
- The C++ PVAC-HFHE repo is a proof of concept for arithmetic over a 127-bit prime field, not a complete production app framework.

## Homomorphic Encryption + Spiking Networks

Relevant research supports the idea that HE and SNNs can be combined, but the numbers also show why the first prototype must be small.

Sources:

- A Homomorphic Encryption Framework for Privacy-Preserving Spiking Neural Networks: https://arxiv.org/abs/2308.05636
- PrivSpike: Employing Homomorphic Encryption for Private Inference of Deep Spiking Neural Networks: https://arxiv.org/abs/2510.03995
- SpENCNN: Orchestrating Encoding and Sparsity for Fast Homomorphically Encrypted Neural Network Inference: https://proceedings.mlr.press/v202/ran23b.html
- FHE-DiSNN / Privacy-Preserving Discretized Spiking Neural Networks: https://arxiv.org/abs/2308.12529
- MDPI version of Nikfam et al. BFV-SNN framework: https://www.mdpi.com/2078-2489/14/10/537

Useful takeaways:

- Published work has already explored HE-protected SNN inference.
- PrivSpike uses CKKS and reports meaningful encrypted SNN inference results, but latency is still measured in many seconds or minutes for non-trivial models.
- SpENCNN is not neuromorphic-specific, but it supports the broader point that sparsity and HE-aware packing can materially improve encrypted inference.
- FHE-DiSNN reinforces that encrypted SNN operations are an active prior-art lane, so NeuroFHE should not claim the broad idea of "SNN plus FHE" as the project center.
- The stronger NeuroFHE wedge is the local trusted-boundary relay: spatial event sorting, policy-governed active-position descriptors, encrypted active feature values, and low-depth scorer benchmarking.

## Neuromorphic Hardware and SNN Tooling

Sources:

- Intel neuromorphic computing overview: https://www.intel.com/content/www/us/en/research/neuromorphic-computing.html
- Intel Loihi 2 / Lava announcement: https://www.intc.com/news-events/press-releases/detail/1502/intel-advances-neuromorphic-with-loihi-2-new-lava-software
- Open Neuromorphic Loihi 2 overview: https://open-neuromorphic.org/neuromorphic-computing/hardware/loihi-2-intel/
- IBM TrueNorth overview: https://research.ibm.com/publications/truenorth-design-and-tool-flow-of-a-65-mw-1-million-neuron-programmable-neurosynaptic-chip

Useful takeaways:

- Neuromorphic processors are designed for sparse, event-driven computation and spiking neural networks.
- They are not general-purpose FHE accelerators.
- Their value in this project is data/model shaping: reduce activity, time windows, and operation count before encryption.

## Real Event Dataset Baseline

Sources:

- N-MNIST dataset page: https://www.garrickorchard.com/datasets/n-mnist
- N-MNIST entry in LAND: https://neuromorphicsystems.github.io/land/n-mnist
- N-MNIST paper: https://doi.org/10.3389/fnins.2015.00437

Useful takeaways:

- N-MNIST is a spiking version of MNIST with 60,000 training samples and 10,000 testing samples.
- Each recording is stored as a separate binary event file.
- Each event occupies 40 bits: x address, y address, polarity, and timestamp in microseconds.
- It is a convenient first real event dataset, but the stronger pilot should later move to DVS Gesture or rights-clean wearable/industrial telemetry.

## HE Libraries for Prototype

Sources:

- OpenFHE: https://openfhe.org/
- OpenFHE docs: https://openfhe-development.readthedocs.io/
- Microsoft SEAL: https://github.com/microsoft/SEAL
- Microsoft SEAL project page: https://www.microsoft.com/en-us/research/project/microsoft-seal/
- TenSEAL: https://openmined.github.io/TenSEAL/

Useful takeaways:

- OpenFHE supports major FHE schemes including BGV, BFV, CKKS, and TFHE/FHEW-style families.
- Microsoft SEAL is mature for BFV and CKKS experimentation.
- TenSEAL offers tensor-oriented HE operations on top of SEAL, useful for quick Python prototyping.

## Post-Quantum Cryptography Baseline

Sources:

- NIST PQC project: https://csrc.nist.gov/Projects/post-quantum-cryptography
- NIST approval of FIPS 203, 204, and 205: https://csrc.nist.gov/News/2024/postquantum-cryptography-fips-approved
- NIST NCCoE Migration to Post-Quantum Cryptography: https://www.nccoe.nist.gov/applied-cryptography/migration-to-pqc
- NIST PQC migration FAQ: https://pages.nist.gov/nccoe-migration-post-quantum-cryptography/FAQ/
- NIST IR 8547 transition plan: https://csrc.nist.gov/pubs/ir/8547/ipd

Useful takeaways:

- NIST released the first three finalized PQC standards in August 2024.
- FIPS 203 specifies ML-KEM for key establishment.
- FIPS 204 specifies ML-DSA for digital signatures.
- FIPS 205 specifies SLH-DSA for stateless hash-based digital signatures.
- NIST migration guidance emphasizes cryptographic inventory, interoperability testing, and transition roadmaps.
- NeuroFHE Relay should avoid "quantum-proof" language until concrete algorithms, parameters, libraries, side-channel posture, and review status are documented.

## Positioning Judgment

The strongest claim:

> Sparse event representation can make selected encrypted inference tasks smaller, more private, and easier to benchmark.

The weakest claim:

> Neuromorphic hardware will directly accelerate full FHE workloads.

The recommended project stance:

> Build a small evidence-backed bridge first. Let the benchmark decide whether Octra becomes execution layer, proof layer, or future integration.

## Commons Positioning

The project is CC0 because biology-machine interface primitives should be inspectable, teachable, and reusable. That moral claim should not soften the technical standard: public-domain release makes review easier, but security claims still require evidence.
