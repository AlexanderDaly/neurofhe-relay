// SPDX-License-Identifier: CC0-1.0

import { runEncryptedLinearClassifier, runPlaintextLinearClassifier } from "./classifier.mjs";
import { activeEvents, buildSparseEventWindow, spikeMetrics } from "./events.mjs";

export function runPrototypeBenchmark(options = {}) {
  const eventWindow = options.eventWindow ?? buildSparseEventWindow();
  const started = now();
  const plaintext = runPlaintextLinearClassifier(eventWindow);
  const encrypted = runEncryptedLinearClassifier(eventWindow, { seed: options.seed ?? 91 });
  const latencyMs = Number((now() - started).toFixed(3));
  const metrics = spikeMetrics(eventWindow);
  const classCount = encrypted.publicModel.classes.length;

  return {
    schema: "neurofhe.benchmark.v1",
    project: "NeuroFHE Relay",
    demo: "Relay-2 Diagnostic Demo",
    boundaryDomain: "bio-digital-event-intelligence",
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
    linearModel: encrypted.publicModel,
    publicModel: encrypted.publicModel,
    operationCounts: encrypted.operationCounts,
    ciphertextBytes: encrypted.ciphertextBytes,
    denseBaseline: denseBaselineComparison(eventWindow, classCount),
    privacyModes: buildPrivacyModeComparison(eventWindow, classCount),
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

export function buildPrivacyModeComparison(eventWindow, classCount, options = {}) {
  const metrics = spikeMetrics(eventWindow);
  const featureCount = eventWindow.timesteps * eventWindow.channels;
  const activeEventCount = activeEvents(eventWindow).length;
  const paddedSlotCount = Math.max(
    activeEventCount,
    options.paddedSlotCount ?? nextPowerOfTwo(Math.max(activeEventCount, 1)),
  );
  const modes = [
    {
      id: "public-active-positions",
      label: "Public active positions",
      speedTier: "fastest",
      sparsityProtection: "low",
      encryptedFeatureSlots: activeEventCount,
      positionPolicy: "active indices are public",
      paddingPolicy: "none",
      operationCounts: operationCountsForSlots(activeEventCount, classCount),
      metadataLeakage: [
        "exact active event positions",
        "exact active event count",
        "timing/sparsity metadata",
      ],
      hides: ["raw spike values", "final class scores until client decrypts"],
      notes:
        "Fastest mode; suitable only when active-position and timing metadata are acceptable to expose.",
    },
    {
      id: "padded-sparse-batches",
      label: "Padded sparse batches",
      speedTier: "middle",
      sparsityProtection: "partial",
      encryptedFeatureSlots: paddedSlotCount,
      positionPolicy: "active indices are sent inside a fixed-size padded sparse batch",
      paddingPolicy: "next-power-of-two active-slot bucket",
      operationCounts: operationCountsForSlots(paddedSlotCount, classCount),
      metadataLeakage: [
        "padding bucket size",
        "coarse timing/sparsity metadata",
        "upper bound on active event count",
      ],
      hides: [
        "exact active event count within the padding bucket",
        "which padded slots are dummy zeros",
      ],
      notes:
        "Middle-ground mode; spends extra encrypted work to avoid revealing exact sparse workload size.",
    },
    {
      id: "dense-encrypted-windows",
      label: "Dense encrypted windows",
      speedTier: "slowest",
      sparsityProtection: "highest of these three modes",
      encryptedFeatureSlots: featureCount,
      positionPolicy: "all feature positions are encrypted every window",
      paddingPolicy: "full dense feature grid",
      operationCounts: operationCountsForSlots(featureCount, classCount),
      metadataLeakage: ["fixed window shape", "model shape"],
      hides: ["active positions", "event-count sparsity", "dummy-versus-real slots"],
      notes:
        "Slowest mode; hides sparsity better by encrypting zero and non-zero features alike.",
    },
  ];
  const fastestScalarMultiplies = modes[0].operationCounts.scalarMultiplies || 1;

  return {
    schema: "neurofhe.privacyModes.v1",
    comparisonBasis: "same event window, same public linear score contract",
    scoreEquation: "scores = W x + bias",
    featureCount,
    activeEventCount,
    density: metrics.density,
    classCount,
    modes: modes.map((mode) => ({
      ...mode,
      relativeScalarMultiplies: Number(
        (mode.operationCounts.scalarMultiplies / fastestScalarMultiplies).toFixed(2),
      ),
    })),
    nextMeasurement:
      "Run the same three modes under OpenFHE BFVrns after native OpenFHE is installed.",
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

function operationCountsForSlots(slotCount, classCount) {
  return {
    encryptions: slotCount + classCount,
    scalarMultiplies: slotCount * classCount,
    adds: slotCount * classCount,
    decryptions: classCount,
  };
}

function nextPowerOfTwo(value) {
  let power = 1;
  while (power < value) power *= 2;
  return power;
}

function now() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}
