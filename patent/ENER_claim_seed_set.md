# ENER Claim Seed Set

Title: Encrypted Neural Embedding Relay for Privacy-Preserving Neuroinference

Purpose: These claim seeds are not formal claims for filing as-is. They are drafted to preserve conversion paths for a later nonprovisional application.

## Independent Claim Seed 1 - Method: Sorted Sparse Event Relay

1. A computer-implemented method comprising:
   - receiving spike-event or event-derived neural telemetry from a neural acquisition device at a local edge device;
   - segmenting the spike-event or event-derived neural telemetry into a temporal event window;
   - sorting the temporal event window, by a spatial spike sorter located within a trusted local boundary, into a sparse event representation comprising active neuron or channel positions and active feature values;
   - transmitting a permitted position descriptor for the sparse event representation, wherein the permitted position descriptor identifies active neuron, channel, time-bin, or spatial-bin positions without including the active feature values;
   - encrypting the active feature values before the active feature values are transmitted outside the trusted local boundary;
   - transmitting the encrypted active feature values and the permitted position descriptor to an encrypted inference engine;
   - evaluating, by the encrypted inference engine, a depth-1 encrypted linear scorer over the encrypted active feature values using the permitted position descriptor and public or protected model weights; and
   - outputting an encrypted or authorized cognitive-state score or classification without exposing raw neural telemetry or plaintext active feature values to the encrypted inference engine.

## Independent Claim Seed 2 - System: Split Device Sparse Encrypted Scorer

2. A system comprising:
   - a neural acquisition device configured to acquire neural telemetry;
   - a local edge device comprising a spatial spike sorter configured to convert the neural telemetry into sorted sparse events having active positions and active feature values;
   - an encryption module configured to encrypt the active feature values before external transmission;
   - a relay interface configured to expose only an approved position descriptor for the sorted sparse events while transmitting encrypted active feature values; and
   - an encrypted inference engine configured to compute encrypted class scores from the encrypted active feature values using a linear score contract without receiving raw neural telemetry or plaintext active feature values.

## Independent Claim Seed 3 - Computer-Readable Medium: Adaptive Privacy Mode Selector

3. A non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause the one or more processors to:
   - receive event-derived neural telemetry at a local device;
   - generate a sparse event representation using a local spatial spike sorter;
   - estimate at least one of encryption cost, bandwidth, event density, signal quality, reconstruction risk, metadata leakage, or task type;
   - select, based on the estimate, between a public-active-position mode, a padded sparse-batch mode, and a dense encrypted-window mode;
   - encrypt active feature values, padded sparse-batch values, or dense window values according to the selected mode;
   - cause encrypted neuroinference to be performed over the selected encrypted representation; and
   - receive encrypted or authorized inference outputs.

## Additional Independent Claim Families to Preserve

4. Relay-gateway privacy boundary family: a local trusted boundary that keeps raw neural telemetry, raw electrode identifiers, raw sample ordering, and subject/session references local while allowing only policy-approved encrypted feature values and permitted metadata to leave the boundary.

5. Reconstruction-resistant embedding family: a local encoder trained or tested against raw-signal reconstruction, identity inference, session inference, or sensitive-attribute inference before embeddings are accepted for encrypted relay.

6. Adaptive compression family: a controller that changes sparse-event mode, padding bucket, latent dimension, quantization precision, local-vs-remote routing, or encryption scheme based on encrypted-compute cost and measured privacy risk.

## Dependent Claim Seeds

7. The method, system, or medium of any preceding seed, wherein the neural telemetry comprises EEG, ECoG, fNIRS, MEG, implanted-array signals, local field potentials, spike events, wearable BCI telemetry, peripheral neural telemetry, event-camera-adjacent signals, or combinations thereof.

8. The method, system, or medium of any preceding seed, wherein encrypting comprises applying fully homomorphic encryption.

9. The method, system, or medium of any preceding seed, wherein encrypting comprises applying somewhat homomorphic encryption or leveled homomorphic encryption.

10. The method, system, or medium of any preceding seed, wherein encrypted active feature values are encrypted using BFV, BFVrns, BGV, CKKS, TFHE, multi-key homomorphic encryption, or a hybrid thereof.

11. The method, system, or medium of any preceding seed, wherein inference comprises encrypted multiplication of a plaintext model weight by an encrypted active feature value and encrypted accumulation of a score.

12. The method, system, or medium of any preceding seed, wherein the encrypted inference engine applies a BFVrns integer scorer having a multiplicative depth of one.

13. The method, system, or medium of any preceding seed, wherein a score contract is `scores = W x + bias`, `x` comprises encrypted active feature values, `W` comprises public, encrypted, secret-shared, or enclave-protected weights, and `bias` comprises public, encrypted, secret-shared, or enclave-protected bias values.

14. The method, system, or medium of any preceding seed, wherein the permitted position descriptor includes active neuron positions, time bins, spatial bins, or channel positions and excludes active feature values.

15. The method, system, or medium of any preceding seed, wherein the permitted position descriptor is padded, coarsened, bucketed, randomized, or encrypted when metadata leakage exceeds a threshold.

16. The method, system, or medium of any preceding seed, wherein the spatial spike sorter is implemented using an FPGA, ASIC, neuromorphic front end, digital signal processor, secure enclave, mobile processor, edge CPU, edge GPU, implant controller, headset controller, or deterministic finite-state machine.

17. The method, system, or medium of any preceding seed, further comprising adapting latent dimensionality, sparse padding bucket, dense-window routing, quantization precision, or active-event threshold based on encryption budget, bandwidth, signal quality, entropy, latency target, reconstruction risk, metadata leakage, or inference target.

18. The method, system, or medium of any preceding seed, further comprising adjusting a privacy budget that controls dimensionality, quantization, sparsity, padding, batching, differential-privacy noise, metadata exposure, or local-only routing.

19. The method, system, or medium of any preceding seed, wherein a compressed latent embedding, sorted sparse event representation, or active feature vector is reconstruction-resistant.

20. The method, system, or medium of any preceding seed, wherein the local encoder is trained using an adversarial decoder configured to reconstruct raw neural telemetry from the compressed latent embedding or sorted sparse event representation.

21. The method, system, or medium of any preceding seed, wherein the compressed latent embedding or sorted sparse event representation is identity-obfuscating.

22. The method, system, or medium of any preceding seed, wherein the compressed latent embedding or sorted sparse event representation is trained, constrained, or tested to reduce user re-identification from the embedding or representation.

23. The method, system, or medium of any preceding seed, wherein the local edge device and encrypted inference engine are disposed on different devices.

24. The method, system, or medium of any preceding seed, wherein the local edge device comprises a headset, implant controller, mobile phone, tablet, wearable hub, laptop, local server, clinical workstation, secure enclave, or hardware security module.

25. The method, system, or medium of any preceding seed, wherein the inference engine comprises a cloud server, local server, hospital server, enterprise server, decentralized compute network, secure enclave, or multiparty computation environment.

26. The method, system, or medium of any preceding seed, wherein the cognitive-state classification comprises an encrypted motor-intent classification.

27. The method, system, or medium of any preceding seed, wherein the cognitive-state classification comprises an encrypted attention-state classification.

28. The method, system, or medium of any preceding seed, wherein the inference output comprises a medical or neurodiagnostic inference.

29. The method, system, or medium of any preceding seed, wherein the inference output comprises a fatigue, workload, anomaly, imagined-speech, neurofeedback, or assistive-control output.

30. The method, system, or medium of any preceding seed, wherein a result is returned as an encrypted class score vector for decryption by an authorized endpoint.

31. The method, system, or medium of any preceding seed, wherein a result is returned as an encrypted label, encrypted confidence value, proof of computation, policy decision, or control signal.

32. The method, system, or medium of any preceding seed, further comprising padding sparse latent features or sorted sparse events before transmission to reduce metadata leakage.

33. The method, system, or medium of any preceding seed, further comprising encrypting active indices of a sparse latent embedding or sparse event representation.

34. The method, system, or medium of any preceding seed, further comprising selecting between public active positions, public active neuron positions with encrypted features, padded sparse batches, and dense encrypted windows based on a privacy policy.

35. The method, system, or medium of any preceding seed, further comprising multi-user encrypted batch inference over encrypted neural embeddings from a plurality of users.

36. The method, system, or medium of any preceding seed, further comprising federated learning over encrypted neural embeddings.

37. The method, system, or medium of any preceding seed, further comprising secure aggregation of model updates derived from local neural embeddings.

38. The method, system, or medium of any preceding seed, further comprising applying differential privacy to aggregate statistics, model updates, or released inference outputs.

39. The method, system, or medium of any preceding seed, wherein model weights are encrypted, secret-shared, or protected by a secure enclave.

40. The method, system, or medium of any preceding seed, wherein the encryption module uses post-quantum key establishment for transport or session-key protection.

41. The method, system, or medium of any preceding seed, wherein an audit record identifies a spatial spike sorter version, encoder version, compression policy, cryptographic scheme, privacy mode, inference target, and result-handling rule without storing raw neural telemetry.

42. The method, system, or medium of any preceding seed, wherein the system routes inference locally instead of remotely when reconstruction risk, metadata leakage, or encryption cost exceeds a threshold.

## Notes for Later Claim Drafting

- Lead with the sorted sparse event/BFVrns depth-1 scorer family if the objective is early allowance over HE-SNN prior art.
- Keep the broader latent-compression family as fallback or continuation material rather than the first independent claim set.
- Separate method, system, medium, privacy-controller, reconstruction-resistance, and metadata-control families.
- Preserve alternatives for FHE, SHE, MPC, TEE, differential privacy, secure enclaves, and hybrid modes, but do not let those alternatives obscure the concrete local sorter plus encrypted active-value relay.
- Obtain inventor input on actual reduction-to-practice details, dates, experiments, model architecture, and preferred commercial embodiments before nonprovisional conversion.
