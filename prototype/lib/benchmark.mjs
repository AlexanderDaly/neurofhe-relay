// SPDX-License-Identifier: CC0-1.0

import { runEncryptedLinearClassifier, runPlaintextLinearClassifier } from "./classifier.mjs";
import { activeEvents, buildSparseEventWindow, spikeMetrics } from "./events.mjs";
import { buildDemoLinearModel, sparseMatVec } from "./linear-algebra.mjs";
import {
  buildSimulatedRawNeuralFrame,
  sortSpatialSpikes,
} from "./spike-sorter.mjs";
import { toyPaillierSecurityParameters } from "./toy-paillier.mjs";

const REQUIRED_ARTIFACT_FIELDS = [
  "accuracy",
  "latencyMs",
  "ciphertextBytes",
  "operationCounts",
  "securityParameters",
  "privacyBoundary",
  "cryptoInventory",
];

export function runPrototypeBenchmark(options = {}) {
  const eventWindow = options.eventWindow ?? buildSparseEventWindow();
  const started = now();
  const plaintext = runPlaintextLinearClassifier(eventWindow);
  const encrypted = runEncryptedLinearClassifier(eventWindow, { seed: options.seed ?? 91 });
  const latencyMs = Number((now() - started).toFixed(3));
  const metrics = spikeMetrics(eventWindow);
  const classCount = encrypted.publicModel.classes.length;
  const results = {
    plaintextScores: plaintext.scores,
    decryptedScores: encrypted.decryptedScores,
    classification: encrypted.classification,
    plaintextMatchesEncrypted:
      JSON.stringify(plaintext.scores) === JSON.stringify(encrypted.decryptedScores) &&
      plaintext.classification === encrypted.classification,
  };

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
    accuracy: buildAccuracySummary(results),
    operationCounts: encrypted.operationCounts,
    ciphertextBytes: encrypted.ciphertextBytes,
    securityParameters: buildSecurityParameters(options),
    denseBaseline: denseBaselineComparison(eventWindow, classCount),
    privacyModes: buildPrivacyModeComparison(eventWindow, classCount),
    representationComparison: buildRepresentationComparison({ eventWindow }),
    results,
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

export function buildBenchmarkArtifact(benchmark, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactId = options.artifactId ?? artifactIdFromTimestamp(generatedAt);

  return {
    schema: "neurofhe.benchmarkArtifact.v1",
    artifactId,
    generatedAt,
    project: benchmark.project,
    dataset: benchmark.dataset,
    model: benchmark.model,
    scheme: benchmark.scheme,
    requiredFields: [...REQUIRED_ARTIFACT_FIELDS],
    accuracy: benchmark.accuracy,
    latencyMs: benchmark.latencyMs,
    ciphertextBytes: benchmark.ciphertextBytes,
    operationCounts: benchmark.operationCounts,
    securityParameters: benchmark.securityParameters,
    privacyBoundary: benchmark.privacyBoundary,
    cryptoInventory: benchmark.cryptoInventory,
    privacyModes: benchmark.privacyModes,
    representationComparison: benchmark.representationComparison,
    results: benchmark.results,
    productionClaim: benchmark.productionClaim,
    benchmark,
  };
}

export function buildAccuracySummary(results) {
  const scoreAgreement =
    JSON.stringify(results.plaintextScores) === JSON.stringify(results.decryptedScores);
  const classificationAgreement = results.plaintextMatchesEncrypted === true;
  const correct = scoreAgreement && classificationAgreement ? 1 : 0;

  return {
    schema: "neurofhe.accuracy.v1",
    metric: "single-window-plaintext-agreement",
    value: correct,
    correct,
    sampleCount: 1,
    scoreAgreement,
    classificationAgreement,
    baseline: "plaintext-linear-spike-count-classifier",
    caveat:
      "This is contract agreement on one synthetic event window, not dataset accuracy. Use baseline:plaintext for real event data.",
  };
}

export function buildSecurityParameters(options = {}) {
  return toyPaillierSecurityParameters(options.keypairOptions ?? {});
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

export function buildRepresentationComparison(options = {}) {
  const denseWindow = options.eventWindow ?? buildSparseEventWindow();
  const rawFrame =
    options.rawNeuralFrame ??
    buildSimulatedRawNeuralFrame({
      eventWindow: denseWindow,
    });
  const spatialSorted = sortSpatialSpikes(rawFrame, options.spatialSorterOptions ?? {});
  const unsortedWindow = rawFrameToUnsortedEventWindow(rawFrame, denseWindow);
  const model = buildDemoLinearModel({
    featureCount: denseWindow.timesteps * denseWindow.channels,
    channels: denseWindow.channels,
  });
  const classCount = model.classes.length;
  const denseScores = runPlaintextLinearClassifier(denseWindow, { model }).scores;
  const unsortedEvents = activeEvents(unsortedWindow).map(({ index, value }) => ({
    index,
    value,
  }));
  const spatialEvents = activeEvents(spatialSorted.eventWindow).map(({ index, value }) => ({
    index,
    value,
  }));
  const unsortedScores = sparseMatVec(model, unsortedEvents);
  const spatialScores = sparseMatVec(model, spatialEvents);
  const expectedClassification = runPlaintextLinearClassifier(denseWindow, { model }).classification;
  const denseMetrics = spikeMetrics(denseWindow);
  const unsortedMetrics = spikeMetrics(unsortedWindow);
  const spatialMetrics = spikeMetrics(spatialSorted.eventWindow);

  return {
    schema: "neurofhe.representationComparison.v1",
    comparisonBasis: "same synthetic raw neural frame, same linear score contract",
    scoreEquation: "scores = W x + bias",
    expectedScores: denseScores,
    expectedClassification,
    representations: [
      {
        id: "dense-raw-window",
        label: "Dense/raw window",
        inputShape: `${denseWindow.timesteps}x${denseWindow.channels} dense window`,
        eventSchema: denseWindow.schema,
        encoding: denseWindow.encoding,
        featureCount: denseMetrics.featureCount,
        activeEventCount: activeEvents(denseWindow).length,
        encryptedFeatureSlots: denseMetrics.featureCount,
        operationCounts: operationCountsForSlots(denseMetrics.featureCount, classCount),
        scores: denseScores,
        classification: expectedClassification,
        metadataLeakage: ["full window shape", "all feature slots", "raw dense activity pattern"],
        preserves: ["complete dense event window"],
        caveat:
          "Reference representation for cost comparison; it is not the preferred privacy boundary.",
      },
      {
        id: "unsorted-spikes",
        label: "Unsorted spikes",
        inputShape: `${rawFrame.rawNeuralSamples.length} raw spike samples`,
        eventSchema: unsortedWindow.schema,
        encoding: unsortedWindow.encoding,
        featureCount: unsortedMetrics.featureCount,
        activeEventCount: rawFrame.rawNeuralSamples.length,
        encryptedFeatureSlots: rawFrame.rawNeuralSamples.length,
        operationCounts: operationCountsForSlots(rawFrame.rawNeuralSamples.length, classCount),
        scores: unsortedScores,
        classification: expectedClassification,
        metadataLeakage: [
          "raw sample timestamp order",
          "raw electrode identifiers",
          "exact raw spike count",
        ],
        preserves: ["raw sample ordering", "raw electrode provenance"],
        caveat:
          "Useful as a pre-sort baseline only; it should not be the canonical model-facing representation.",
      },
      {
        id: "spatial-sorted-events",
        label: "Spatial-sorted events",
        inputShape: `${spatialSorted.eventWindow.timesteps}x${spatialSorted.eventWindow.channels} spatial-sorted event window`,
        eventSchema: spatialSorted.eventWindow.schema,
        encoding: spatialSorted.eventWindow.encoding,
        encoder: {
          id: spatialSorted.encoder.id,
          schema: spatialSorted.schema,
          implementationTarget: spatialSorted.encoder.implementationTarget,
          spatialBins: spatialSorted.eventWindow.spatialBins,
          productionClaim: false,
        },
        featureCount: spatialMetrics.featureCount,
        activeEventCount: activeEvents(spatialSorted.eventWindow).length,
        encryptedFeatureSlots: activeEvents(spatialSorted.eventWindow).length,
        operationCounts: operationCountsForSlots(
          activeEvents(spatialSorted.eventWindow).length,
          classCount,
        ),
        cryptoInventory: buildCryptoInventory(),
        privacyBoundary: buildSortedEventPrivacyBoundary(),
        scores: spatialScores,
        classification: expectedClassification,
        metadataLeakage: ["spatial bin activity", "event-count sparsity", "time-bin sparsity"],
        preserves: ["spatial bin provenance", "sorter configuration provenance"],
        caveat:
          "Canonical gateway encoder path in this package; still simulated and not clinical spike sorting.",
      },
    ],
    caveat:
      "All three representations are compared on one synthetic task. This is a representation and operation-count comparison, not dataset accuracy.",
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

export function buildSortedEventPrivacyBoundary() {
  return {
    schema: "neurofhe.sortedEventPrivacyBoundary.v1",
    gatewaySees: [
      "sorted event window",
      "sorter configuration summary",
      "active event positions",
      "active event counts",
    ],
    computeSees: [
      "approved active event positions",
      "ciphertext active spike values",
      "public model weights",
      "encrypted score ciphertexts",
    ],
    clientSees: ["decrypted class scores", "final classification"],
    withheld: [
      "raw neural samples",
      "raw electrode identifiers",
      "raw sample timestamp order",
      "device identifiers",
      "local subject or session references",
      "operator notes",
    ],
    residualRisks: [
      "spatial bin activity can leak coarse source geometry",
      "event-count sparsity can leak workload size",
      "time-bin sparsity can leak coarse temporal patterns",
    ],
    productionClaim: false,
  };
}

function rawFrameToUnsortedEventWindow(rawFrame, referenceWindow) {
  const values = Array.from({ length: referenceWindow.timesteps }, () =>
    Array(referenceWindow.channels).fill(0),
  );
  const electrodes = new Map(
    (rawFrame.electrodeMap ?? []).map((electrode) => [electrode.electrodeId, electrode]),
  );

  for (const sample of rawFrame.rawNeuralSamples ?? []) {
    const electrode = electrodes.get(sample.electrodeId);
    if (!electrode) continue;
    if (!Number.isInteger(sample.timestampUs) || sample.timestampUs < 0) continue;
    if (sample.timestampUs >= rawFrame.windowUs) continue;

    const time = Math.min(
      referenceWindow.timesteps - 1,
      Math.floor((sample.timestampUs * referenceWindow.timesteps) / rawFrame.windowUs),
    );
    const channel = Number.isInteger(electrode.unitId) ? electrode.unitId : undefined;
    if (!Number.isInteger(channel) || channel < 0 || channel >= referenceWindow.channels) continue;
    values[time][channel] += 1;
  }

  return {
    schema: "neurofhe.events.v1.unsorted-spikes",
    windowMs: referenceWindow.windowMs,
    timesteps: referenceWindow.timesteps,
    channels: referenceWindow.channels,
    encoding: "unsorted-raw-spike-count",
    values,
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

function artifactIdFromTimestamp(generatedAt) {
  return `benchmark-${generatedAt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}`;
}
