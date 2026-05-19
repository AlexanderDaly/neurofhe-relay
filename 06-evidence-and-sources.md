# NeuroFHE Relay - Evidence and Sources

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

Useful takeaways:

- Published work has already explored HE-protected SNN inference.
- PrivSpike uses CKKS and reports meaningful encrypted SNN inference results, but latency is still measured in many seconds or minutes for non-trivial models.
- SpENCNN is not neuromorphic-specific, but it supports the broader point that sparsity and HE-aware packing can materially improve encrypted inference.

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

## Positioning Judgment

The strongest claim:

> Sparse event representation can make selected encrypted inference tasks smaller, more private, and easier to benchmark.

The weakest claim:

> Neuromorphic hardware will directly accelerate full FHE workloads.

The recommended project stance:

> Build a small evidence-backed bridge first. Let the benchmark decide whether Octra becomes execution layer, proof layer, or future integration.

