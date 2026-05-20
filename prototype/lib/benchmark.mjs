// SPDX-License-Identifier: CC0-1.0

import { runEncryptedLinearClassifier, runPlaintextLinearClassifier } from "./classifier.mjs";
import { buildSparseEventWindow, spikeMetrics } from "./events.mjs";

export function runPrototypeBenchmark(options = {}) {
  const eventWindow = options.eventWindow ?? buildSparseEventWindow();
  const started = now();
  const plaintext = runPlaintextLinearClassifier(eventWindow);
  const encrypted = runEncryptedLinearClassifier(eventWindow, { seed: options.seed ?? 91 });
  const latencyMs = Number((now() - started).toFixed(3));
  const metrics = spikeMetrics(eventWindow);

  return {
    schema: "neurofhe.benchmark.v1",
    project: "NeuroFHE Relay",
    demo: "Relay-2 Diagnostic Demo",
    dataset: "synthetic-events-v0",
    model: "tiny-linear-spike-count-v0",
    scheme: encrypted.scheme,
    productionClaim: false,
    latencyMs,
    eventWindow: {
      schema: eventWindow.schema,
      shape: [eventWindow.timesteps, eventWindow.channels],
      encoding: eventWindow.encoding,
      windowMs: eventWindow.windowMs,
    },
    sparseMetrics: metrics,
    publicModel: encrypted.publicModel,
    operationCounts: encrypted.operationCounts,
    ciphertextBytes: encrypted.ciphertextBytes,
    denseBaseline: denseBaselineComparison(eventWindow, encrypted.publicModel.classes.length),
    results: {
      plaintextScores: plaintext.scores,
      decryptedScores: encrypted.decryptedScores,
      classification: encrypted.classification,
      plaintextMatchesEncrypted:
        JSON.stringify(plaintext.scores) === JSON.stringify(encrypted.decryptedScores) &&
        plaintext.classification === encrypted.classification,
    },
    encryptedPreview: encrypted.encryptedPreview,
    cryptoInventory: buildCryptoInventory(),
    privacyBoundary: buildPrivacyBoundary(),
    caveats: [
      "Toy additive homomorphic arithmetic only; not production cryptography.",
      "Public active event positions may reveal sparsity patterns.",
      "Secret key remains client-side in this prototype contract.",
      "Post-quantum algorithms are design targets until real libraries and parameter sets are wired in.",
    ],
    nextStep:
      "Port this event-list and linear score contract to BFV/BGV, CKKS, TFHE, or an Octra/HFHE experiment and preserve the same benchmark schema.",
  };
}

export function buildCryptoInventory() {
  return {
    schema: "neurofhe.crypto.inventory.v1",
    keyEstablishment: ["ML-KEM-768-design-target"],
    signatures: ["ML-DSA-65-design-target", "SLH-DSA-design-target"],
    encryptedComputation: ["toy-paillier-additive-research-only"],
    hashes: ["SHA3-256-design-target", "BLAKE3-design-target"],
    classicalFallbacks: ["X25519-design-target", "Ed25519-design-target"],
    hybridMode: true,
    productionClaim: false,
    notes:
      "Inventory names desired roles for the prototype roadmap. The current runnable code uses only educational additive HE.",
  };
}

export function buildPrivacyBoundary() {
  return {
    edgeSees: ["raw synthetic event window", "plaintext spikes", "active event positions"],
    computeSees: [
      "public model weights",
      "public active event positions",
      "ciphertext active spike values",
      "encrypted score ciphertexts",
    ],
    clientSees: ["decrypted class scores", "final classification"],
  };
}

function denseBaselineComparison(eventWindow, classCount) {
  const featureCount = eventWindow.timesteps * eventWindow.channels;
  return {
    representation: "full dense event tensor with encrypted zero and non-zero features",
    featureCount,
    operationCounts: {
      encryptions: featureCount + classCount,
      scalarMultiplies: featureCount * classCount,
      adds: featureCount * classCount,
      decryptions: classCount,
    },
  };
}

function now() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}
