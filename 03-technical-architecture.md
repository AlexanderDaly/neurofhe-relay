# NeuroFHE Relay - Technical Architecture

## Architecture Principle

Keep neuromorphic and FHE responsibilities separate.

Neuromorphic systems are best at event-driven sparse computation. FHE systems are best at preserving privacy across selected arithmetic or logic circuits. The bridge is a bio-digital representation contract: sensitive biological, behavioral, or sensor signals stay local while compact spike/event tensors are designed to be both biologically inspired and encryption-friendly.

## Relay Gateway Boundary

Before any encrypted compute or model service sees an event, raw or semi-structured local signals pass through the NeuroFHE Relay Gateway. The gateway is the only trusted component allowed to inspect raw payloads.

Gateway responsibilities:

- Intake local files, sensors, apps, logs, or simulated event streams and mark them sensitive by default.
- Normalize raw signals into stable structured events with timestamps, source IDs, event type, confidence, provenance, schema version, and validation status.
- Apply privacy and safety policy before export: withhold raw payloads, hash source IDs, bucket timestamps, aggregate sparse metrics, and mark active values as encrypted or withheld.
- Expose only bounded model-facing event representations with explicit plaintext, encrypted, aggregated, and withheld fields.
- Route model recommendations back through policy validation and execute only safe, local, reversible actions.
- Write audit and sanitized replay records that explain transformations without exporting raw signals.

See `09-relay-gateway-pattern.md` and `prototype/lib/gateway.mjs` for the concrete schema and scaffold.

## System Components

### 1. Event Source

Possible inputs:

- Event-camera stream.
- Wearable time-series sensor.
- Audio or vibration event detector.
- Synthetic spike dataset.
- Plain neural model converted to a spiking model.

Output contract:

```json
{
  "schema": "neurofhe.events.v1",
  "windowMs": 50,
  "channels": 64,
  "timesteps": 16,
  "encoding": "binary-spike-count",
  "values": "0/1 or low-bit integer tensor"
}
```

Prototype event-list contract:

```json
{
  "schema": "neurofhe.events.active-list.v1",
  "publicActivePositions": [{"time": 0, "channel": 1}],
  "encryptedActiveValues": ["ciphertext"],
  "metadataCaveat": "Active positions reduce encrypted work but may reveal sparsity and timing patterns."
}
```

### 2. Spike Encoder

The encoder converts raw or intermediate signals into a compact event window:

- Binary spikes.
- Spike counts.
- Time-to-first-spike encoding.
- Quantized membrane potentials.
- Low-bit feature buckets.

Design target:

- Small tensor.
- Low multiplicative depth.
- Predictable scale.
- HE-friendly activation substitute.

### 3. Scheme Router

Different HE schemes fit different workloads:

- CKKS for approximate real-valued inference.
- BFV/BGV for quantized integer arithmetic and spike counts.
- TFHE-style paths for binary threshold logic and lookup tables.
- HFHE/Octra path for future encrypted network execution if the operations map cleanly.

The router should make scheme choice explicit rather than hiding it behind one abstraction.

### 3.5 Post-Quantum Envelope

Encrypted computation is only one part of the security story. The surrounding system also needs post-quantum transport, identity, and artifact integrity.

Design target:

- ML-KEM for quantum-resistant key establishment.
- ML-DSA for primary artifact signatures.
- SLH-DSA as a conservative hash-based signature option.
- Hybrid classical + PQC mode during migration.
- Explicit crypto inventory in every benchmark output.

### 4. Encrypted Inference Kernel

The first kernel should avoid the hardest operations:

- Linear projection.
- Quantized convolution or grouped convolution.
- Accumulation over time.
- Polynomial threshold approximation.
- Optional encrypted argmax approximation or client-side decrypt-and-argmax.

The current prototype uses a sparse active-event linear score. For an 8 by 8 window with 18 active spikes and two output classes, the toy encrypted path performs 36 public scalar multiplications and 36 homomorphic additions. A dense encrypted tensor path over all 64 features would perform 128 of each operation.

The score equation is fixed as `scores = W x + bias`, with matrix rows as classes and columns as flattened event features. The current benchmark emits this matrix shape so future BFV/BGV, CKKS, TFHE, or HFHE experiments can compare the same contract rather than changing the task midstream.

Non-goals for the first prototype:

- Large transformer inference.
- Full encrypted training.
- Direct bootstrapping on neuromorphic silicon.
- Production cryptographic claims.

### 5. Octra Adapter

Octra should enter after local feasibility is proven.

Possible adapter responsibilities:

- Map compact encrypted event operations into AppliedML/WASM program shape.
- Store model metadata, result commitments, or access-policy state.
- Use Octra circles as isolated execution environments for app-specific encrypted workflows.
- Benchmark whether HFHE-style operations improve the selected event workload.

This is an integration lane, not a promise that Octra is ready for every SNN operation today.

### 6. Benchmark Harness

Every run should emit:

```json
{
  "dataset": "synthetic-events-v0",
  "model": "tiny-snn-v0",
  "scheme": "ckks|bfv|tfhe|hfhe-experimental",
  "accuracy": 0.0,
  "latencyMs": 0,
  "ciphertextBytes": 0,
  "operationCounts": {
    "adds": 0,
    "multiplies": 0,
    "rotations": 0,
    "bootstraps": 0
  },
  "cryptoInventory": {
    "keyEstablishment": ["ML-KEM-768"],
    "signatures": ["ML-DSA-65"],
    "encryptedComputation": ["bfv-or-ckks-prototype"],
    "hybridMode": true,
    "productionClaim": false
  },
  "privacyBoundary": {
    "edgeSees": ["raw sensor", "plaintext spikes"],
    "computeSees": ["ciphertext", "public model metadata"],
    "clientSees": ["decrypted result"]
  }
}
```

## Data Flow

```text
Raw signal
  -> local event encoder
  -> spike/event window
  -> encryption adapter
  -> encrypted inference kernel
  -> encrypted score/result
  -> client decrypts final answer
  -> optional Octra state/proof/settlement program
```

## Security Boundary

The first prototype should claim only:

- Data is encrypted before external compute.
- Compute layer receives ciphertext, public parameters, and public model metadata.
- Secret key remains client-side.
- Prototype is research-grade, not audited production cryptography.
- Post-quantum claims are design targets until concrete libraries, parameters, and reviews exist.

## Success Metrics

The project becomes interesting if the tiny SNN path can show:

- Lower encrypted operation count than an equivalent dense baseline.
- Acceptable accuracy loss from quantization/activation approximation.
- Clear privacy boundary.
- Crypto inventory covering transport, signatures, encrypted compute, and hashes.
- A credible Octra integration path for at least one compact operation family.
