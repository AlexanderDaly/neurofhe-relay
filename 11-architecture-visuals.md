# 11 — Architecture visuals

## Pipeline (edge → encrypted relay → inference)

Only sparse event summaries cross the trust boundary; raw sensor payloads stay local.

```mermaid
flowchart LR
  subgraph Edge
    S[Sensor streams]
    SS[Spatial spike sorter/FPGA or edge target]
    GW[Local relay gateway\nnormalize + policy]
  end

  subgraph EncryptedCompute
    REP[Minimal event representation]
    ENC[Event encoder]
    FHE[Homomorphic encryption]
    AG[Model / agent service]
  end

  subgraph Output
    REC[Recommendation only]
    VAL[Gateway validation]
    ACT[Safe local action]
  end

  S --> SS --> GW --> REP --> ENC --> FHE --> AG --> REC --> VAL --> ACT
```

## Encrypted inference flow (sequence)

```mermaid
sequenceDiagram
  participant Edge as Edge (sensor + spike sorter)
  participant Relay as Relay gateway
  participant Encode as Encoder
  participant Encrypt as OpenFHE encryptor
  participant Compute as Encrypted compute
  participant Validate as Gateway validation
  participant Act as Local action

  Edge->>Relay: sparse spike events
  Relay->>Encode: normalized events
  Encode->>Encrypt: minimal representation
  Encrypt->>Compute: ciphertext (public key)
  Compute-->>Encrypt: ciphertext result
  Encrypt->>Validate: ciphertext result
  Validate->>Act: safe recommendation/action
  Note over Relay,Validate: Private key stays local; policy gates decisions
```

## Latent embedding visualization (concept)

```mermaid
flowchart LR
  EVT[Event stream]
  ENC[Encoder]
  Z[(Latent embedding)]
  CL1[Cluster A (normal patterns)]
  CL2[Cluster B (anomaly boundary)]
  TOPK[Top-k neighbors / retrieval]
  DECISION[Policy + model head]

  EVT-->ENC-->Z-->TOPK-->DECISION
  Z-->CL1
  Z-->CL2
```

## Edge ↔ encrypted relay ↔ inference architecture

```mermaid
flowchart TB
  subgraph Edge
    Sensors --> SpikeSorter --> Gateway
  end

  subgraph TrustBoundary [Trust boundary]
    Gateway --> EventEncoder --> OpenFHE
  end

  subgraph EncryptedCompute
    OpenFHE --> AgentService --> CiphertextResult
  end

  Gateway --> DecryptValidate --> Actuator
```
