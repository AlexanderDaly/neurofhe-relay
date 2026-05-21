# ENER Claim Seed Set

Title: Encrypted Neural Embedding Relay for Privacy-Preserving Neuroinference

Purpose: These claim seeds are not formal claims for filing as-is. They are drafted to preserve conversion paths for a later nonprovisional application.

## Independent Claim Seed 1 - Method

1. A computer-implemented method comprising:
   - receiving neural telemetry from a neural acquisition device;
   - segmenting the neural telemetry into one or more temporal windows at a local device;
   - generating, by an edge latent encoder at the local device, a compressed latent embedding from at least one of the temporal windows;
   - encrypting the compressed latent embedding before transmission outside a trusted local boundary;
   - transmitting the encrypted compressed latent embedding to an inference engine;
   - performing inference on the encrypted compressed latent embedding; and
   - outputting a cognitive-state classification without exposing raw neural telemetry to the inference engine.

## Independent Claim Seed 2 - System

2. A system comprising:
   - a neural acquisition device configured to acquire neural telemetry;
   - an edge latent encoder configured to generate compressed latent embeddings from the neural telemetry;
   - an encryption module configured to encrypt the compressed latent embeddings;
   - a relay interface configured to transmit encrypted compressed latent embeddings; and
   - an encrypted inference engine configured to perform inference on the encrypted compressed latent embeddings without receiving raw neural telemetry in plaintext.

## Independent Claim Seed 3 - Computer-Readable Medium

3. A non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause the one or more processors to:
   - receive neural telemetry;
   - segment the neural telemetry into windows;
   - generate compressed latent embeddings from the windows using an edge encoder;
   - select an adaptive compression policy based on encryption cost, bandwidth, entropy, signal quality, and task type;
   - encrypt the compressed latent embeddings;
   - transmit the encrypted compressed latent embeddings to an inference engine;
   - cause encrypted neuroinference to be performed on the encrypted compressed latent embeddings; and
   - receive encrypted or authorized inference outputs.

## Dependent Claim Seeds

4. The method, system, or medium of any preceding seed, wherein the neural telemetry comprises EEG, ECoG, fNIRS, MEG, implanted-array signals, local field potentials, spike events, wearable BCI telemetry, peripheral neural telemetry, or combinations thereof.

5. The method, system, or medium of any preceding seed, wherein encrypting the compressed latent embedding comprises applying fully homomorphic encryption.

6. The method, system, or medium of any preceding seed, wherein encrypting the compressed latent embedding comprises applying somewhat homomorphic encryption or leveled homomorphic encryption.

7. The method, system, or medium of any preceding seed, wherein the compressed latent embedding is encrypted using BFV, BGV, CKKS, TFHE, multi-key homomorphic encryption, or a hybrid thereof.

8. The method, system, or medium of any preceding seed, wherein inference comprises encrypted multiplication of a plaintext model weight by an encrypted latent value and encrypted accumulation of a score.

9. The method, system, or medium of any preceding seed, wherein inference comprises encrypted execution of one or more neural-network layers.

10. The method, system, or medium of any preceding seed, further comprising adapting latent dimensionality based on encryption budget, bandwidth, signal quality, entropy, latency target, or inference target.

11. The method, system, or medium of any preceding seed, further comprising adjusting a privacy budget that controls dimensionality, quantization, sparsity, padding, batching, differential-privacy noise, or metadata exposure.

12. The method, system, or medium of any preceding seed, wherein the compressed latent embedding is reconstruction-resistant.

13. The method, system, or medium of any preceding seed, wherein the edge latent encoder is trained using an adversarial decoder configured to reconstruct raw neural telemetry from the compressed latent embedding.

14. The method, system, or medium of any preceding seed, wherein the compressed latent embedding is identity-obfuscating.

15. The method, system, or medium of any preceding seed, wherein the compressed latent embedding is trained or constrained to reduce user re-identification from the embedding.

16. The method, system, or medium of any preceding seed, wherein the edge latent encoder and encrypted inference engine are disposed on different devices.

17. The method, system, or medium of any preceding seed, wherein the local device comprises a headset, implant controller, mobile phone, tablet, wearable hub, laptop, local server, clinical workstation, secure enclave, or hardware security module.

18. The method, system, or medium of any preceding seed, wherein the inference engine comprises a cloud server, local server, hospital server, enterprise server, decentralized compute network, secure enclave, or multiparty computation environment.

19. The method, system, or medium of any preceding seed, wherein the cognitive-state classification comprises an encrypted motor-intent classification.

20. The method, system, or medium of any preceding seed, wherein the cognitive-state classification comprises an encrypted attention-state classification.

21. The method, system, or medium of any preceding seed, wherein the inference output comprises a medical or neurodiagnostic inference.

22. The method, system, or medium of any preceding seed, wherein the inference output comprises a fatigue, workload, anomaly, imagined-speech, neurofeedback, or assistive-control output.

23. The method, system, or medium of any preceding seed, wherein a result is returned as an encrypted class score vector for decryption by an authorized endpoint.

24. The method, system, or medium of any preceding seed, wherein a result is returned as an encrypted label, encrypted confidence value, proof of computation, policy decision, or control signal.

25. The method, system, or medium of any preceding seed, further comprising padding sparse latent features before transmission to reduce metadata leakage.

26. The method, system, or medium of any preceding seed, further comprising encrypting active indices of a sparse latent embedding.

27. The method, system, or medium of any preceding seed, further comprising selecting between public active positions, padded sparse batches, and dense encrypted windows based on a privacy policy.

28. The method, system, or medium of any preceding seed, further comprising multi-user encrypted batch inference over encrypted neural embeddings from a plurality of users.

29. The method, system, or medium of any preceding seed, further comprising federated learning over encrypted neural embeddings.

30. The method, system, or medium of any preceding seed, further comprising secure aggregation of model updates derived from local neural embeddings.

31. The method, system, or medium of any preceding seed, further comprising applying differential privacy to aggregate statistics, model updates, or released inference outputs.

32. The method, system, or medium of any preceding seed, wherein model weights are encrypted, secret-shared, or protected by a secure enclave.

33. The method, system, or medium of any preceding seed, wherein the encryption module uses post-quantum key establishment for transport or session-key protection.

34. The method, system, or medium of any preceding seed, wherein an audit record identifies an encoder version, compression policy, cryptographic scheme, privacy mode, inference target, and result-handling rule without storing raw neural telemetry.

35. The method, system, or medium of any preceding seed, wherein the system routes inference locally instead of remotely when reconstruction risk, metadata leakage, or encryption cost exceeds a threshold.

## Notes for Later Claim Drafting

- Consider separating claims into method, system, medium, and privacy-controller families.
- Consider one family focused on "latent compression before encryption" and another on "adaptive compression policy for encrypted neuroinference."
- Consider one family focused on "reconstruction-resistant neural embeddings" and another on "split-device encrypted inference."
- Preserve alternatives for FHE, SHE, MPC, TEE, differential privacy, secure enclaves, and hybrid modes.
- Obtain inventor input on actual reduction-to-practice details, dates, experiments, model architecture, and preferred commercial embodiments before nonprovisional conversion.
