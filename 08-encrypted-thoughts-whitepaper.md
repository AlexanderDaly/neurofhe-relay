# NeuroFHE Relay Whitepaper

## Why We Need Encrypted Thoughts for Brain-Computer Interfaces

Status: public research whitepaper
License: CC0-1.0
Project frame: bio-digital event intelligence

## Executive Summary

Brain-computer interfaces are moving from laboratory demonstration toward real products, clinical trials, assistive communication systems, wearable neurotechnology, and eventually everyday human-computer interaction. The privacy model for that world cannot be ordinary application privacy with a neural sensor attached. Neural data is not just another biometric. It is continuous, involuntary, inference-rich, and inseparable from agency, intention, impairment, identity, and vulnerability.

This whitepaper argues for "encrypted thoughts" as a design target for BCI systems. The phrase does not mean literal mind reading can be magically sealed. It means that any signal capable of supporting thought, intention, language, emotion, or cognitive-state inference should be protected by a privacy boundary inside the computation itself:

- Raw neural and biosignal data stays local by default.
- Decode-capable features are encrypted before leaving the user's trusted environment.
- External compute providers process selected ciphertexts, not plaintext brain data.
- Decryption authority remains with the user, patient, clinician, or explicitly authorized controller.
- Every system emits an auditable privacy boundary, cryptographic inventory, and caveat set.

The technical thesis behind NeuroFHE Relay is narrower and more defensible than a broad "private AI" claim. BCIs and related neurotechnology produce time-series signals that can be represented as sparse events, windows, thresholds, spike counts, embeddings, or other compact feature forms. Homomorphic encryption, secure multiparty computation, post-quantum transport, and cryptographic access controls become more plausible when the workload is intentionally shaped before encryption. The near-term path is not full encrypted cognition. It is selected encrypted event intelligence.

The policy environment is already moving in this direction. UNESCO adopted a global ethics standard for neurotechnology in 2025 that foregrounds mental privacy, dignity, consent, transparency, and safeguards against manipulation. Colorado expanded its privacy law in 2024 to cover biological data, including neural data. California added neural data to sensitive personal information under the CCPA in 2024. FDA guidance already treats implanted BCI devices for paralysis or amputation as a serious medical-device category requiring non-clinical testing and clinical considerations.

The engineering conclusion is simple: if BCI data can leave the body, then the privacy boundary must be built before the data leaves the person.

## 1. What "Encrypted Thoughts" Means

"Encrypted thoughts" is a public-facing shorthand for a technical architecture:

> Neural, biosignal, or intent-bearing event features should remain encrypted whenever they are processed outside the user's trusted boundary.

It does not mean a system knows or owns a person's inner life. It does not mean every cognitive process is observable. It does not mean a current BCI can decode arbitrary thoughts. It means that, where a BCI system captures signals that can support useful inference about intention, language, motor commands, emotional response, attention, fatigue, or cognitive state, the system should treat that material as sensitive before it becomes a database, telemetry stream, model-training input, or cloud inference request.

The phrase is useful because it moves the privacy conversation from policy aspiration to implementation requirement. A system cannot merely promise not to misuse neural data. It should be designed so that major classes of misuse are technically blocked, minimized, or made auditable.

In this paper, "thought" means an intent-bearing or cognition-adjacent signal, not an ontological claim about consciousness. The scope includes:

- invasive BCI signals from implanted electrodes,
- electrocorticography or other clinical neural interfaces,
- non-invasive EEG, fNIRS, MEG, or fMRI-derived signals where relevant,
- wearable neurotechnology outputs,
- event features derived from nervous-system activity,
- model inputs or embeddings that preserve decode-capable information,
- usage traces that reveal intention or cognitive state through interaction patterns.

The boundary is practical: if a system can use the signal to infer something sensitive about a person, the signal deserves cryptographic protection before shared computation.

## 2. Why Neural Data Is Different

Ordinary privacy frameworks were built around documents, identifiers, locations, transactions, messages, and account activity. Neural data strains those categories.

First, neural data is involuntary in a deeper sense than many other data types. A user may agree to wear a device or receive an implant, but they cannot precisely choose which neural correlates, artifacts, emotional responses, error signals, attentional shifts, or unintended associations appear in the stream. Even when a user consents to one purpose, the captured signal may contain more than the purpose requires.

Second, neural data is inference-rich. A raw neural signal may not be meaningful to an observer today, but models improve. Data that seems noisy can become more revealing when combined with labels, behavioral context, language models, multimodal records, or future decoders. This gives neural data a long shelf life. A breach in 2026 could become more harmful in 2031 because decoding improves.

Third, neural data is intimate without always being medical. A consumer headset, productivity wearable, game interface, or attention-monitoring device may sit outside a strict clinical setting while still collecting signals tied to cognition, stress, sleep, affect, or intent. That creates a dangerous gap: medical language may not apply, but the dignity interest remains.

Fourth, neural data is relational. BCI systems often depend on individualized calibration, adaptation, feedback loops, and longitudinal use. A model trained for one person may encode patterns unique to that person's nervous system, impairments, habits, vocabulary, emotional responses, and communication style. This is more than a username tied to a record. It is a personalized decoder.

Fifth, neural data is agency-adjacent. BCIs are not only sensors. They can become control pathways for cursors, prosthetics, speech synthesizers, wheelchairs, robots, software agents, or smart environments. A compromise of the data layer can become a compromise of action, attribution, and autonomy.

For these reasons, neural data should be treated less like ordinary telemetry and more like a privileged channel between personhood and computation.

## 3. The BCI Privacy Failure Mode

Most digital systems still rely on a familiar pattern:

1. Collect sensitive data.
2. Encrypt it in transit.
3. Decrypt it for processing.
4. Store it in an application database.
5. Govern downstream use through contracts, policies, access logs, and compliance.

For ordinary software, this model is already showing strain. For BCIs, it is insufficient from the beginning.

Encryption in transit protects against network interception. Encryption at rest protects against certain storage failures. Neither protects the user when the service provider, model host, analytics vendor, training pipeline, or compromised internal account sees plaintext during computation. A BCI privacy architecture that decrypts neural features inside a remote inference service is asking users to trust every future integration, every employee permission boundary, every debug log, every vendor, and every acquisition.

Consent alone cannot repair that design. Consent forms are blunt instruments. They struggle to explain future inferences, model reuse, secondary training, cross-device linkage, government requests, workplace pressure, or the difference between raw neural recordings and derived embeddings. In BCI systems, the user may also be a patient, employee, student, disabled person, gamer, soldier, prisoner, or dependent participant. The more asymmetric the context, the less consent can carry the whole moral burden.

De-identification is also fragile. Neural data may be unique, longitudinal, and linkable. A signal stripped of name and email may still become identifying when paired with device metadata, model parameters, behavior, timing, or calibration history. In a future with better decoders, "anonymous brain data" may prove to be a temporary comfort.

The failure mode is not just breach. It is silent normalization:

- neural signals become routine product telemetry,
- cognitive-state predictions become marketing segments,
- attention and fatigue data become workplace management tools,
- assistive communication data becomes training material,
- calibration profiles become identity fingerprints,
- inference vendors become unavoidable intermediaries,
- users lose the ability to know what was inferred, shared, or retained.

Encrypted thoughts is a design response to that failure mode. It says the system should not receive plaintext neural features merely because doing so is convenient.

## 4. Policy Signals: Mental Privacy Is Becoming an Explicit Governance Category

The policy environment no longer treats neurotechnology ethics as science fiction.

UNESCO's 2025 Recommendation on the Ethics of Neurotechnology places mental privacy, personal identity, autonomy, human dignity, consent, transparency, oversight, and safeguards against manipulation at the center of the governance problem. UNESCO also notes the growth of consumer neurotechnology and the risk that neural data can reveal thoughts, emotions, and reactions when products sit outside tightly regulated medical environments.

Colorado's HB24-1058, effective August 7, 2024, expanded the Colorado Privacy Act's sensitive-data category to include biological data. That definition includes neural data generated by measuring central or peripheral nervous-system activity and processed with the assistance of a device.

California's SB 1223, approved September 28, 2024, amended the CCPA to include neural data as sensitive personal information. It defines neural data as information generated by measuring the activity of a consumer's central or peripheral nervous system and not inferred from nonneural information.

The OECD's responsible neurotechnology work similarly emphasizes stewardship, trust, safety, privacy, societal deliberation, oversight capacity, personal brain data safeguards, and monitoring for misuse.

These policy moves matter because they show the direction of travel. Neural data is becoming a distinct category because lawmakers and institutions recognize that ordinary personal-data concepts are not enough. But policy will lag technology. The responsible engineering move is to design systems that satisfy the spirit of mental privacy before every jurisdiction compels it.

## 5. The Technical Requirement: Privacy During Computation

The central technical requirement is privacy during computation.

For BCIs, the most important exposure often occurs not when data is stored or transmitted, but when it is processed. A speech BCI, prosthetic-control interface, attention monitor, or cognitive-state classifier may need to run models over incoming features. If those features are decrypted in a remote environment, the privacy boundary has already failed.

Privacy-preserving computation can take several forms:

- Homomorphic encryption allows selected operations over encrypted data.
- Secure multiparty computation can split computation across parties so no single party sees the whole input.
- Trusted execution environments can reduce exposure, though they still require hardware trust and side-channel caution.
- Differential privacy can reduce leakage in aggregate model training, though it does not by itself protect an individual inference stream.
- Federated learning can keep some training local, though model updates can leak if not carefully protected.
- Post-quantum cryptography can protect transport, identity, and signatures against future quantum threats.

NeuroFHE Relay focuses on the homomorphic-encryption path because it fits a specific BCI-adjacent workload: compact event features and selected inference kernels. FHE is expensive. That is precisely why the representation matters. A dense, high-dimensional neural recording is a poor encrypted-compute target. A small event window, spike count, binary threshold vector, or low-bit feature bucket is a better one.

The design task is to make the BCI output encryption-friendly before it leaves the trusted boundary. That is where bio-digital event intelligence becomes useful:

```text
Raw neural or biosignal stream
  -> local feature extraction
  -> compact event window
  -> encryption adapter
  -> encrypted inference or verification
  -> encrypted result
  -> authorized decryption
```

This does not solve every BCI workload. It does create a defensible starting point for the most important principle: external compute should not need to see raw or decode-capable neural data.

## 6. Reference Architecture

An encrypted-thoughts BCI architecture should separate five roles.

### 6.1 Data Subject and Local Device

The person, patient, or user is the origin of the signal. The local device or trusted local environment captures raw signals, performs safety checks, and runs the first-stage encoder. Raw signal retention should be minimized. When retention is clinically or scientifically required, it should be separately authorized, encrypted, and governed.

Minimum rule:

> Raw neural data does not leave the trusted local environment by default.

### 6.2 Event Encoder

The encoder converts raw signal into a compact representation:

- spike counts,
- event times,
- active channels,
- motor-intent features,
- speech-intent features,
- low-bit embeddings,
- thresholded windows,
- local confidence and quality metrics.

The encoder should remove unnecessary information before encryption. The privacy objective is not to encrypt everything indiscriminately. It is to reveal as little as possible while preserving the computation needed.

### 6.3 Cryptographic Gate

The cryptographic gate decides what leaves the local boundary:

- which features are encrypted,
- which metadata is public,
- which model parameters are public,
- which party holds decryption keys,
- which policy authorizes each computation,
- which audit record is produced.

This layer must account for metadata leakage. In the current NeuroFHE Relay prototype, public active event positions reduce encrypted operation count but reveal sparsity and timing patterns. That is acceptable for an educational benchmark only because the caveat is explicit. A production system would need stronger metadata controls, padding, batching, private set techniques, or a risk-based decision about what sparsity can safely be public.

### 6.4 Encrypted Compute Provider

The compute provider receives ciphertext and public parameters, then runs selected inference, scoring, policy, or verification functions. In a mature system, this provider should be able to prove what computation was run without learning the user's neural features.

This role may be:

- a cloud inference service,
- a hospital research environment,
- a device manufacturer's model endpoint,
- a decentralized encrypted-compute network,
- an enterprise edge server,
- an assistive-technology service provider.

The provider should not require plaintext neural features as a condition of usefulness.

### 6.5 Authorized Decryption and Action

The final output should be decrypted only by the authorized party:

- the user,
- the user's local device,
- a clinician,
- an explicitly delegated caregiver,
- a safety-critical control system with narrow authority.

For assistive BCIs, the action layer matters as much as the data layer. If decoded intent controls speech, movement, software agents, or financial activity, then key control, confirmation UX, rate limits, and rollback become safety requirements.

## 7. Threat Model

Encrypted thoughts should be evaluated against concrete threats.

### Threat 1: Remote Compute Visibility

The external inference provider should not see plaintext neural features, raw recordings, or decode-capable embeddings. FHE or related privacy-preserving computation is the main mitigation.

### Threat 2: Database Breach

If an attacker steals stored records, the most sensitive material should be ciphertext, not raw neural streams. This requires encryption before upload and disciplined key custody.

### Threat 3: Secondary Use

The system should make it difficult to repurpose neural data for advertising, workplace monitoring, behavioral profiling, insurance, credit, training, or unrelated product analytics. Technical minimization should support legal use limitation.

### Threat 4: Model or Vendor Insider

Employees, contractors, debugging systems, analytics tools, or model developers should not casually inspect neural features. Logs should not contain raw or decryptable signal data.

### Threat 5: Future Decoder Improvement

Data that seems safe today may become revealing later. Long-lived raw neural archives are therefore high-risk. Crypto-agile storage, deletion, retention limits, and local-first design reduce future harm.

### Threat 6: Metadata Leakage

Timing, sparsity, device state, session length, calibration drift, and confidence scores can reveal sensitive information even when feature values are encrypted. An honest whitepaper must say this plainly. Encrypted values are not the same as total privacy.

### Threat 7: Coercion and Forced Access

Cryptography cannot fully solve coercion, compelled disclosure, unsafe workplaces, abusive relationships, or surveillance mandates. But it can reduce ambient collection, create stronger defaults, and force explicit authority rather than invisible extraction.

## 8. Design Principles

### 8.1 Local First, Shared Second

BCI systems should begin with local processing. Shared computation must be justified by a concrete benefit: clinical support, assistive function, research collaboration, safety verification, cross-device model improvement, or user-requested service.

### 8.2 Minimize Before Encrypting

Encryption is not permission to collect everything. The correct order is:

1. collect the minimum viable signal,
2. extract the minimum viable feature,
3. discard or protect the raw stream,
4. encrypt the selected feature,
5. compute only the authorized result.

### 8.3 Make the Privacy Boundary Machine-Readable

Every benchmark, demo, and deployment artifact should say what each actor sees:

```json
{
  "privacyBoundary": {
    "localDeviceSees": ["raw neural signal", "plaintext event features"],
    "computeProviderSees": ["ciphertext", "public model metadata"],
    "authorizedClientSees": ["decrypted result"],
    "publicMetadataCaveat": "Timing and sparsity leakage must be assessed."
  }
}
```

### 8.4 Treat Neural Data as Sensitive Even When It Is Not Medical

Consumer context does not make neural data harmless. Games, productivity tools, meditation headbands, education systems, and workplace devices can still collect cognition-adjacent signals.

### 8.5 Separate Identity, Signal, and Payment

Systems should avoid binding neural data, legal identity, payment identity, device identity, and long-term behavioral profiles unless the use case absolutely requires it.

### 8.6 Use Crypto Agility

The cryptographic stack must change over time. FHE schemes, parameter sets, libraries, post-quantum standards, secure hardware assumptions, and metadata protections will evolve. A serious system records its cryptographic inventory and preserves the ability to migrate.

### 8.7 Do Not Hide Behind Hype

The strongest claim is not "we can encrypt the mind." The strongest claim is:

> We can design BCI computation so selected neural event features remain private during external processing.

That is enough. It is also far more useful.

## 9. Why FHE Belongs in the BCI Conversation

Fully homomorphic encryption is often criticized as too slow for practical AI. That criticism is fair in many settings. It is also incomplete.

BCI workloads are not all large language models or dense vision networks. Some useful tasks are compact:

- score a small motor-intent vector,
- verify a thresholded control signal,
- classify a short event window,
- aggregate spike counts,
- run a lightweight anomaly detector,
- compare encrypted features to authorized templates,
- produce a privacy-preserving research metric.

These tasks are closer to the workloads where FHE experimentation can be productive, especially when the representation is co-designed for encrypted computation. Neuromorphic and event-driven approaches matter because they push the signal toward sparsity, quantization, timing windows, and low activity. That can reduce operation counts and make the privacy-preserving path easier to benchmark.

FHE should not be the only privacy tool. But it deserves a central place for the cases where:

- the compute provider should not be trusted with plaintext,
- the user cannot keep all computation local,
- the output is compact,
- the operation is narrow and auditable,
- the value of privacy justifies latency and engineering cost.

BCI is exactly the kind of domain where that cost may be justified.

## 10. Near-Term Use Cases

### Assistive Communication

Speech BCIs are among the clearest beneficiaries. A user may need cloud-scale language support, device updates, clinical monitoring, or model improvement while still protecting attempted speech, inner speech, calibration data, and communication history. Encrypted feature processing can reduce exposure while preserving useful assistance.

### Prosthetic and Cursor Control

Motor-intent signals may control devices, software, or mobility aids. External services may help with calibration or safety verification. The service should not need full plaintext access to the user's neural control stream.

### Clinical Research Collaboration

Researchers often need aggregate metrics, benchmark comparisons, or model evaluations across participants. Privacy-preserving computation can support collaboration without centralizing raw neural records.

### Consumer Neurotechnology

Wearable neurotechnology for attention, stress, meditation, sleep, gaming, or learning should not become a lightly regulated cognitive telemetry industry. Even if the signal is coarse, user expectations and future inference risk justify stronger defaults.

### Bio-Digital Agent Interfaces

If future agents respond to neural or biosignal event streams, the boundary between intention and automation becomes delicate. A local-first encrypted event layer can prevent every downstream agent, plugin, or service from seeing the raw signal of the person using it.

## 11. What This Does Not Solve

Encrypted thoughts is not a complete answer to neurotechnology ethics.

It does not prove a BCI is safe or effective. It does not replace clinical validation. It does not solve surgical risk, hardware reliability, neurophysiological harm, accessibility, explainability, agency, manipulation, addiction, labor coercion, or discrimination. It does not prevent every inference from metadata. It does not make bad governance good.

It also does not make a prototype production-ready. A real deployment would require:

- security review,
- clinical or domain validation,
- regulatory strategy,
- usability testing,
- key recovery and delegation design,
- incident response,
- metadata-leakage analysis,
- threat modeling,
- side-channel review,
- independent cryptographic assessment.

The value of encrypted thoughts is more specific: it prevents a dangerous default. It refuses the assumption that neural data must be plaintext wherever useful computation happens.

## 12. NeuroFHE Relay's Position

NeuroFHE Relay is a public-domain reference package for one part of this problem: privacy-preserving event intelligence at the boundary between biological signal, neuromorphic representation, and encrypted computation.

The current prototype is deliberately small. It uses a synthetic event window, public active event positions, encrypted active spike values, and a toy additive homomorphic scheme to demonstrate the privacy boundary and operation-count difference between sparse and dense scoring. It is not production cryptography and not a medical device.

That modesty is a strength. The correct first milestone is not to claim encrypted cognition. It is to produce an inspectable contract:

```text
bio-digital signal stays local
  -> selected event features are minimized
  -> selected features are encrypted
  -> selected computation runs externally
  -> only the authorized result is decrypted
```

From there, the research path is clear:

- replace the toy scheme with OpenFHE, SEAL, TFHE-rs, Concrete, or another mature library,
- add stronger metadata protections,
- benchmark event-shaped workloads against dense baselines,
- document the privacy boundary in every run,
- add post-quantum transport and signature inventory,
- evaluate whether Octra or similar encrypted-compute systems can run a compact operation family cleanly.

## 13. Implementation Roadmap

### Phase 0: Whitepaper and Threat Model

Publish the ethical and technical argument. Define "encrypted thoughts" as a privacy-preserving computation architecture. Keep non-medical and research-grade caveats visible.

### Phase 1: Event Contract

Standardize a minimal BCI-adjacent event schema:

- window length,
- channel count,
- event encoding,
- metadata policy,
- public versus encrypted fields,
- decoder caveats,
- retention rules.

### Phase 2: Real HE Kernel

Port the current linear score contract to a real HE library. Compare:

- plaintext event scoring,
- sparse encrypted event scoring,
- dense encrypted baseline,
- metadata-protected variant.

### Phase 3: Privacy Boundary Report

Emit a machine-readable report for every benchmark:

- what the edge sees,
- what the compute provider sees,
- what the client decrypts,
- what metadata leaks,
- what cryptography is used,
- what claims are not being made.

### Phase 4: Post-Quantum Envelope

Use NIST-standard post-quantum cryptography for the surrounding transport and artifact integrity layer:

- ML-KEM for key establishment,
- ML-DSA or SLH-DSA for signatures,
- hybrid modes during migration,
- cryptographic inventory for every artifact.

### Phase 5: Review-Ready Prototype

Prepare a prototype that is modest enough to be reviewed:

- one event workload,
- one encrypted operation family,
- one threat model,
- one benchmark harness,
- one source-backed paper trail.

## 14. Conclusion

BCIs force a civilizational design choice. We can allow neural data to become another extractive telemetry stream, governed mainly by notice, consent, breach response, and after-the-fact regulation. Or we can build a stronger norm now: signals tied to thought, intention, communication, agency, and cognition should remain private during computation unless the person has explicitly authorized otherwise.

Encrypted thoughts is the name for that norm in engineering form.

The most defensible near-term target is not grandiose. It is practical:

> Keep raw neural signals local. Encrypt selected event features. Compute only what is necessary. Decrypt only for the authorized party. Record the boundary every time.

For BCI systems, that should become the default architecture before the market teaches itself a worse habit.

## References

- UNESCO, "Ethics of neurotechnology: UNESCO adopts the first global standard in the cutting-edge technology," November 5, 2025: https://www.unesco.org/en/articles/ethics-neurotechnology-unesco-adopts-first-global-standard-cutting-edge-technology
- UNESCO, "Recommendation on the Ethics of Neurotechnology," adopted November 2025: https://www.unesco.org/en/legal-affairs/recommendation-ethics-neurotechnology
- Colorado General Assembly, HB24-1058, "Protect Privacy of Biological Data," approved April 17, 2024 and effective August 7, 2024: https://leg.colorado.gov/bills/hb24-1058
- California Legislature, SB 1223, "Consumer privacy: sensitive personal information: neural data," approved September 28, 2024: https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB1223
- FDA, "Neurological Devices," including final guidance for implanted BCI devices for paralysis or amputation, May 20, 2021: https://www.fda.gov/medical-devices/products-and-medical-procedures/neurological-devices
- Tang et al., "Semantic reconstruction of continuous language from non-invasive brain recordings," Nature Neuroscience, 2023: https://www.nature.com/articles/s41593-023-01304-9
- Metzger et al., "A high-performance neuroprosthesis for speech decoding and avatar control," Nature, 2023: https://www.nature.com/articles/s41586-023-06443-4
- OECD, "Responsible innovation," including the OECD Recommendation on Responsible Innovation in Neurotechnology: https://www.oecd.org/en/topics/responsible-innovation.html
- NIST, "Announcing Approval of Three Federal Information Processing Standards (FIPS) for Post-Quantum Cryptography," August 13, 2024: https://csrc.nist.gov/News/2024/postquantum-cryptography-fips-approved
- NIST NCCoE, "Migration to Post-Quantum Cryptography": https://www.nccoe.nist.gov/applied-cryptography/migration-to-pqc
