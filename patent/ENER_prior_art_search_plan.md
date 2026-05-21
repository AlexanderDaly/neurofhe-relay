# ENER Prior Art Search Plan

Title: Encrypted Neural Embedding Relay for Privacy-Preserving Neuroinference

This plan is intended to guide a structured prior-art search. It does not report search results; it identifies queries, databases, relevance, and likely differentiators to test.

## FTO Extraction Note

A user-provided Patsnap Eureka FTO extraction for a related "Blockchain-Based Secure Neural Data Encryption and Decentralized Access Management System" reviewed 100 patent references, identified 14 high-relevance patents and 5 medium-relevance patents, and reported a 91% search recall score across the United States, China, EPO, and other authorities. The extraction indicates that blockchain-based encrypted storage, smart-contract access control, permissioned decryption, decentralized retrieval, and encrypted sensitive-data record management are crowded areas.

The ENER search plan should therefore test blockchain and access-control references as a negative-space lane, while keeping the positive claim focus on latent neural compression before encryption and inference on encrypted embeddings. See `patent/ENER_fto_extraction_summary.md`.

## Core Differentiators to Test

- Latent compression occurs before encryption.
- Raw neural telemetry remains local by default.
- Remote inference is performed on encrypted latent-space representations.
- A spatial spike sorter can convert event-derived neural telemetry into sorted sparse events before encrypted relay.
- A privacy mode can expose permitted active positions while encrypting active feature values, or can escalate to padded sparse batches or dense encrypted windows when metadata leakage is too high.
- A BFVrns depth-1 linear scorer can compute `scores = W x + bias` over encrypted active feature values rather than executing a full encrypted SNN as the primary claim center.
- Embeddings are designed to be reconstruction-resistant or identity-obfuscating.
- Compression adapts based on encryption cost, bandwidth, entropy, signal quality, and task type.
- The architecture is split across neural acquisition, edge encoding, encrypted relay, and encrypted inference.
- The system performs privacy-preserving inference before any optional storage or access-management layer becomes relevant.
- The inventive center is not blockchain storage, smart-contract decryption authorization, or encrypted record retrieval.

## HE-SNN and Sparse HE Prior Art Watchlist

These technical references are close enough that a later nonprovisional should differentiate them explicitly. They are included as search leads, not as a completed IDS.

| Reference | What It Appears to Teach | ENER Differentiator to Preserve |
|---|---|---|
| PrivSpike: Employing Homomorphic Encryption for Private Inference of Deep Spiking Neural Networks, arXiv:2510.03995 | CKKS-based private inference for deep SNNs, including neuromorphic datasets and reported encrypted-inference runtimes. | Do not claim "HE for SNN inference" broadly. Emphasize local trusted-boundary neural relay, spatial sorting before encrypted relay, active-position/privacy-mode selection, and encrypted active-value scoring. |
| SpENCNN: Orchestrating Encoding and Sparsity for Fast Homomorphically Encrypted Neural Network Inference, ICML/PMLR 2023 | HE-aware sparsity and packing to improve encrypted neural-network inference latency. | Tie sparsity to neural telemetry privacy boundaries, sorted event descriptors, metadata-leakage controls, and raw-neural-data retention rather than generic cloud ML acceleration. |
| Nikfam et al., A Homomorphic Encryption Framework for Privacy-Preserving Spiking Neural Networks, Information 2023 | BFV/Pyfhel-style encrypted SNN framework and parameter discussion. | Distinguish a split-device BCI relay where raw neural event streams stay local and only encrypted active feature values leave the device. |
| FHE-DiSNN / Privacy-Preserving Discretized Spiking Neural Networks, arXiv:2308.12529 | Homomorphic evaluation of discretized SNN operations, including protected firing/reset style operations. | Claim the bounded sorted-event relay and depth-1 linear scorer as a concrete low-depth implementation, with broader encrypted SNN layers as optional alternatives. |
| PrivateSNN and related privacy-preserving SNN work | Privacy-preserving SNN training or model-protection approaches. | Keep claim focus on protected inference over locally derived neural representations and reconstruction-resistant event/embedding release criteria. |

Suggested examiner-facing distinction language:

> The disclosed preferred embodiment does not merely apply homomorphic encryption to an SNN. It first enforces a local neural telemetry boundary, converts event-derived telemetry into a sorted sparse representation, separates permitted active-position descriptors from active feature values, encrypts the active feature values before external transmission, and selects among public-position, padded-sparse, and dense encrypted privacy modes based on metadata leakage and encrypted-compute cost.

## Search Table

| Keyword or Query | Likely Database | Why It Matters | Potential Differentiator to Test |
|---|---|---|---|
| "encrypted EEG" | Google Patents; IEEE Xplore; PubMed | Captures systems that encrypt EEG signals or EEG records. | Determine whether encryption is for storage/transport only or supports inference over encrypted latent embeddings. |
| "homomorphic encryption EEG" | Google Patents; USPTO Patent Public Search; IEEE Xplore; arXiv | Directly targets encrypted computation over EEG-derived data. | Look for whether raw EEG or handcrafted EEG features are encrypted, versus local learned latent compression before encryption. |
| "privacy-preserving BCI" | Google Patents; WIPO Patentscope; IEEE Xplore; PubMed | Broad BCI privacy category. | Test whether systems disclose split-device latent encoding and encrypted inference. |
| "encrypted neural signal processing" | USPTO Patent Public Search; Espacenet; IEEE Xplore | Captures neural-signal processing with encryption. | Compare raw-signal encryption to reconstruction-resistant latent-space relay. |
| "brain computer interface privacy" | Google Patents; PubMed; IEEE Xplore | Captures privacy architectures, policy, and technical safeguards. | Identify whether privacy is policy/access-control based or computation-protective. |
| "latent embeddings EEG classification" | IEEE Xplore; arXiv; PubMed | Captures learned EEG embeddings and representation learning. | Determine whether embedding papers address encrypted inference or reconstruction resistance. |
| "federated BCI learning" | arXiv; IEEE Xplore; PubMed | Captures local training and multi-user BCI model improvement. | Distinguish federated model updates from encrypted inference over latent embeddings. |
| "secure neurotechnology" | WIPO Patentscope; Google Patents; PubMed | Captures broader neurotech security. | Test whether security protects raw telemetry during remote inference. |
| "homomorphic encrypted inference" | Google Patents; arXiv; IEEE Xplore | Captures general encrypted ML inference methods. | Determine whether general FHE inference is adapted to neural telemetry via local latent compression. |
| "PrivSpike" | arXiv; Google Scholar; Semantic Scholar | Captures CKKS encrypted SNN inference that could be close to broad HE-SNN claims. | Distinguish local trusted-boundary sorting, active-position/privacy-mode selection, and active-value encryption. |
| "SpENCNN" | PMLR; arXiv; Google Scholar | Captures HE-aware sparsity and packing. | Distinguish neural telemetry-specific privacy boundary and metadata leakage controls from generic CNN acceleration. |
| "FHE-DiSNN" | arXiv; Google Scholar | Captures discretized SNN homomorphic evaluation. | Distinguish low-depth sorted sparse-event scorer and local raw-telemetry retention. |
| "homomorphic encryption framework privacy preserving spiking neural networks BFV" | MDPI; Google Scholar; arXiv | Captures Nikfam BFV/Pyfhel SNN work. | Compare BFV encrypted SNN framing against BFVrns sorted active-value relay. |
| "privacy-preserving neuroimaging" | PubMed; arXiv; IEEE Xplore | Captures fMRI, MEG, fNIRS, and broader neuroimaging privacy. | Compare de-identification or federated analytics against encrypted latent inference. |
| "EEG feature encryption classifier" | IEEE Xplore; Google Patents | Captures EEG feature-based classifiers with encryption. | Test whether the feature vector is task-compressed, reconstruction-resistant, and adaptively shaped for encrypted compute. |
| "brain signal homomorphic classifier" | arXiv; IEEE Xplore; Google Patents | Captures classifiers running over encrypted brain signals. | Compare model depth, protected feature type, and edge-compression policy. |
| "neural data secure multiparty computation" | arXiv; IEEE Xplore; WIPO Patentscope | Captures MPC alternatives. | Preserve claims broad enough for MPC while differentiating edge latent embeddings. |
| "BCI differential privacy embeddings" | arXiv; PubMed; IEEE Xplore | Captures privacy-preserving embeddings and DP for BCI. | Test whether DP is used for training only or integrated with encrypted inference. |
| "reconstruction resistant neural embeddings" | arXiv; IEEE Xplore | Captures adversarial representation learning and privacy-preserving embeddings. | Determine whether applied to neural telemetry and encrypted relay. |
| "encrypted motor intent classification" | Google Patents; IEEE Xplore; PubMed | Targets a key BCI use case. | Compare raw or plaintext motor-intent features against encrypted latent inference. |
| "encrypted attention state classification" | Google Patents; IEEE Xplore; PubMed | Targets consumer EEG and cognitive-state inference. | Compare attention classification without remote plaintext exposure. |
| "secure enclave neural inference" | Google Patents; IEEE Xplore; arXiv | Captures TEE-based neuroinference. | Test hybrid claims where TEE is alternative or supplementary to FHE. |
| "adaptive compression homomorphic encryption inference" | Google Patents; arXiv; IEEE Xplore | Captures compression policies for FHE efficiency. | Determine whether adaptation is tied to neural telemetry, entropy, and cognitive task type. |
| "encrypted latent representation inference" | Google Patents; arXiv; IEEE Xplore | Captures general encrypted latent inference. | Differentiate by neural telemetry source, edge encoder, and reconstruction-resistant cognitive embeddings. |
| "blockchain encrypted neural data" | Google Patents; USPTO Patent Public Search; WIPO Patentscope; Espacenet | Captures the crowded storage/access-control framing identified by FTO extraction. | Treat as a risk lane; distinguish ENER by encrypted inference on locally compressed latent embeddings rather than blockchain record management. |
| "smart contract neural data access" | Google Patents; WIPO Patentscope; Espacenet | Captures smart-contract permissioning for sensitive or neural data. | Avoid claiming smart-contract access as the inventive feature; test whether any reference also performs latent encrypted neuroinference. |
| "encrypted sensitive data blockchain access control" | Google Patents; USPTO Patent Public Search; WIPO Patentscope; Espacenet | Captures broad enterprise patents that may read on encrypted neural storage if claims are drafted too broadly. | Separate ENER from encrypted storage, permissioned retrieval, and decryption authorization systems. |
| "edge computing blockchain access control encrypted data" | Google Patents; WIPO Patentscope; Espacenet | Captures edge-plus-blockchain access systems similar to the FTO risk lane. | Distinguish edge neural embedding generation and adaptive compression for encrypted inference from edge storage policy systems. |
| "off-chain encrypted data retrieval public key blockchain" | Google Patents; WIPO Patentscope; Espacenet | Captures off-chain storage address and key-registration systems. | Avoid making off-chain retrieval part of the core invention. |

## FTO Risk References to Track

| Reference | Reported Assignee | Why It Matters | ENER Differentiator to Preserve |
|---|---|---|---|
| HK1249783A | Advanced New Technologies Co Ltd | Combines encrypted storage, blockchain coordination, permissioned decryption, smart contracts, and distributed access management. | Local neural latent encoding, compression before encryption, and encrypted inference on embeddings rather than access-controlled encrypted record retrieval. |
| CN110765488A | Lenovo (Beijing) Ltd | Generalizes sensitive-data encryption before blockchain storage with key fragments, permissions, identity, and query workflows. | Inference-before-storage; neural-specific latent embeddings; reconstruction-resistant and adaptive compression policies. |
| CN114363362A | Shenzhen Power Supply Bureau | Combines edge processing, distributed storage, blockchain access control, alliance-chain systems, and policy storage. | Neural telemetry windows are converted locally into encrypted latent embeddings for protected inference, not merely stored or permissioned through a chain. |
| CN110990407A | Tencent Technology (Shenzhen) Co Ltd | Covers blockchain encrypted storage with permission metadata and public-key policy systems. | Avoid blockchain indexing and permission metadata as central claim features. |
| JP2020155801A | Nomura Research Institute | Covers blockchain-mediated encrypted information sharing, public-key registration, off-chain storage addresses, and retrieval/decryption workflows. | Keep distributed infrastructure optional and subordinate to encrypted latent-space neuroinference. |

## Database-Specific Search Notes

### Google Patents

Use broad phrase searches first, then refine with CPC classes for brain-computer interfaces, biomedical signal processing, cryptography, machine learning, and blockchain storage/access management. Review forward and backward citations for any close systems.

Example searches:

- `"homomorphic encryption" EEG classifier`
- `"brain computer interface" "homomorphic encryption"`
- `"neural signal" "encrypted inference"`
- `"latent embedding" EEG privacy`
- `"brain signal" "secure multiparty computation"`
- `"blockchain" "encrypted neural data"`
- `"smart contract" "neural data"`

### USPTO Patent Public Search

Search title, abstract, claims, and specification fields. Use proximity searches around "EEG", "homomorphic", "embedding", "latent", "brain-computer", "privacy", and "classifier".

Example searches:

- `("EEG" AND "homomorphic encryption")`
- `("brain-computer interface" AND "encrypted" AND "inference")`
- `("neural telemetry" AND "latent")`
- `("neural signal" AND "privacy-preserving")`
- `("blockchain" AND "encrypted sensitive data" AND "access control")`
- `("smart contract" AND "decryption" AND "permission")`

### WIPO Patentscope

Use international phrase searches for "brain computer interface", "neurotechnology", "privacy preserving", "homomorphic encryption", "blockchain access control", and "encrypted sensitive data". Watch for non-U.S. terminology such as "neurophysiological signal" or "cerebral signal".

### Espacenet

Search patent families and classification-based neighbors. Review machine translations where English abstracts are sparse. Track family members for the FTO risk references above.

### arXiv

Search machine learning, cryptography, signal processing, and biomedical engineering categories. Focus on encrypted inference, BCI privacy, and representation learning.

### IEEE Xplore

Prioritize technical papers on EEG classification, BCI privacy, edge BCI, homomorphic encryption, and biomedical signal encryption.

### PubMed

Search for clinical neurotechnology, BCI privacy, neuroimaging privacy, and neural data governance. PubMed may be strongest for privacy risk and medical context rather than FHE implementation.

## Search Workflow

1. Run broad keyword searches in Google Patents and IEEE Xplore.
2. Identify the closest patent families involving EEG plus encryption or BCI plus privacy-preserving inference.
3. Run exact-phrase searches for "homomorphic encryption" plus each sensor modality.
4. Search learned-representation literature for EEG or BCI latent embeddings.
5. Search encrypted-inference literature for adaptive compression, low-dimensional embeddings, and ciphertext packing.
6. Search blockchain/access-control references to confirm which claim territory should be avoided.
7. Compare each close reference against the core differentiators.
8. Record publication number, title, assignee, publication date, priority date, modality, protected data type, encryption method, inference location, storage/access-control role, and differentiator.

## Prior Art Comparison Matrix Template

| Reference | Modality | Protected Data | Where Compression Occurs | Encryption Type | Inference on Encrypted Data | Reconstruction Resistance | Adaptive Compression | Notes |
|---|---|---|---|---|---|---|---|---|
| Reference A |  |  |  |  |  |  |  |  |
| Reference B |  |  |  |  |  |  |  |  |
| Reference C |  |  |  |  |  |  |  |  |

## Examiner Distinction Matrix Template

| Reference | Does it keep raw neural telemetry local? | Does it disclose a local spatial spike sorter? | Does it separate public/padded active positions from encrypted active values? | Does it select privacy modes based on metadata leakage? | Does it use a BFVrns depth-1 sorted-event scorer? | Distinction notes |
|---|---|---|---|---|---|---|
| PrivSpike |  |  |  |  |  |  |
| SpENCNN |  |  |  |  |  |  |
| Nikfam BFV-SNN |  |  |  |  |  |  |
| FHE-DiSNN |  |  |  |  |  |  |

## Blockchain Risk Comparison Template

| Reference | Storage or Access-Control Feature | Smart Contract or Blockchain Role | Decryption Permission Model | Any Neural-Specific Latent Inference? | ENER Separation |
|---|---|---|---|---|---|
| HK1249783A |  |  |  |  |  |
| CN110765488A |  |  |  |  |  |
| CN114363362A |  |  |  |  |  |
| CN110990407A |  |  |  |  |  |
| JP2020155801A |  |  |  |  |  |

## Inventor Input Needed

- Earliest conception date and any dated notes, diagrams, demos, commits, or prototypes.
- Any public disclosures, posts, papers, repositories, or pitch materials already released.
- Any known companies, papers, patents, or products that inspired the design.
- Actual sensor modalities tested or intended first.
- Actual encoder architectures, compression ratios, encryption schemes, and benchmark results available for inclusion.
- Whether any blockchain, smart-contract, decentralized-storage, or marketplace component is intended as a product feature or should be kept entirely outside the patent filing.
