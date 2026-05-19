# NeuroFHE Relay - Technical Architecture

## Architecture Principle

Keep neuromorphic and FHE responsibilities separate.

Neuromorphic systems are best at event-driven sparse computation. FHE systems are best at preserving privacy across selected arithmetic or logic circuits. The bridge is a representation contract: spike/event tensors designed to be both biologically inspired and encryption-friendly.

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

### 4. Encrypted Inference Kernel

The first kernel should avoid the hardest operations:

- Linear projection.
- Quantized convolution or grouped convolution.
- Accumulation over time.
- Polynomial threshold approximation.
- Optional encrypted argmax approximation or client-side decrypt-and-argmax.

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

## Success Metrics

The project becomes interesting if the tiny SNN path can show:

- Lower encrypted operation count than an equivalent dense baseline.
- Acceptable accuracy loss from quantization/activation approximation.
- Clear privacy boundary.
- A credible Octra integration path for at least one compact operation family.

