import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildBenchmarkArtifact,
  buildPackedVectorPlanningNotes,
  buildPrivacyModeDecision,
  buildPrivacyModeComparison,
  buildRepresentationComparison,
  evaluateSpatialClusterReadiness,
  runPrototypeBenchmark,
} from "../lib/benchmark.mjs";
import {
  publishBenchmarkArtifact,
  publishComparisonArtifact,
} from "../lib/artifacts.mjs";
import {
  runEncryptedLinearClassifier,
  runPlaintextLinearClassifier,
} from "../lib/classifier.mjs";
import {
  buildSparseEventWindow,
  flattenEventWindow,
  spikeMetrics,
  validateEventWindow,
} from "../lib/events.mjs";
import {
  createToyCipher,
  createToyKeypair,
  decrypt,
} from "../lib/toy-paillier.mjs";
import {
  buildDemoLinearModel,
  denseMatVec,
  sparseMatVec,
  validateLinearModel,
} from "../lib/linear-algebra.mjs";
import {
  buildOpenFheDemoContract,
  buildOpenFheRealLibraryAdapter,
  detectOpenFhe,
  openFheIntegrationPlan,
  validateOpenFheContract,
} from "../lib/openfhe-adapter.mjs";
import {
  encodeNmnistEvent,
  eventsToFeatureVector,
  evaluateLinearClassifier,
  parseNmnistEvents,
  runPlaintextEventBaseline,
  trainCentroidLinearClassifier,
} from "../lib/nmnist.mjs";
import {
  buildSimulatedRawNeuralFrame,
  sortSpatialSpikes,
} from "../lib/spike-sorter.mjs";
import {
  applyPrivacySafetyPolicy,
  buildDefaultGatewayPolicy,
  buildLocalAnnotationRecommendation,
  buildSimulatedRawSignal,
  buildUnsafeDeviceCommandRecommendation,
  evaluateRecommendation,
  normalizeRawSignal,
  runGatewayDemo,
} from "../lib/gateway.mjs";

test("toy additive cipher preserves addition and public scalar multiplication", () => {
  const { publicKey, privateKey } = createToyKeypair();
  const cipher = createToyCipher(publicKey, { seed: 37 });

  const encryptedThree = cipher.encrypt(3);
  const encryptedFour = cipher.encrypt(4);
  const encryptedSeven = cipher.add(encryptedThree, encryptedFour);
  const encryptedTwelve = cipher.scalarMultiply(encryptedFour, 3);

  assert.equal(Number(decrypt(publicKey, privateKey, encryptedSeven)), 7);
  assert.equal(Number(decrypt(publicKey, privateKey, encryptedTwelve)), 12);
});

test("demo event window validates and reports stable sparse metrics", () => {
  const eventWindow = buildSparseEventWindow();

  assert.deepEqual(validateEventWindow(eventWindow), []);
  assert.equal(flattenEventWindow(eventWindow).length, 64);
  assert.deepEqual(spikeMetrics(eventWindow), {
    featureCount: 64,
    spikeCount: 18,
    density: 0.28125,
    activeChannels: 6,
    activeTimesteps: 8,
  });
});

test("event validation catches malformed windows before encryption", () => {
  const eventWindow = buildSparseEventWindow();
  const malformed = {
    ...eventWindow,
    values: [eventWindow.values[0], eventWindow.values[1].slice(0, 7)],
  };

  assert.deepEqual(validateEventWindow(malformed), [
    "values length 2 does not match timesteps 8",
    "row 1 length 7 does not match channels 8",
  ]);
});

test("encrypted classifier matches plaintext classifier on the demo contract", () => {
  const eventWindow = buildSparseEventWindow();
  const plaintext = runPlaintextLinearClassifier(eventWindow);
  const encrypted = runEncryptedLinearClassifier(eventWindow, { seed: 91 });

  assert.deepEqual(plaintext.scores, { normal: 9, anomaly: 51 });
  assert.equal(plaintext.classification, "anomaly");
  assert.deepEqual(encrypted.decryptedScores, plaintext.scores);
  assert.equal(encrypted.classification, plaintext.classification);
  assert.equal(encrypted.operationCounts.encryptions, 20);
  assert.equal(encrypted.operationCounts.scalarMultiplies, 36);
  assert.equal(encrypted.operationCounts.adds, 36);
  assert.equal(encrypted.operationCounts.decryptions, 2);
});

test("linear model metadata fixes matrix orientation and supports public bias", () => {
  const model = buildDemoLinearModel({ featureCount: 64, channels: 8 });

  assert.equal(model.schema, "neurofhe.linearModel.v1");
  assert.deepEqual(model.featureShape, [8, 8]);
  assert.equal(model.flatteningOrder, "time-major-channel-minor");
  assert.deepEqual(model.matrixShape, [2, 64]);
  assert.equal(model.scoreEquation, "scores = W x + bias");
  assert.deepEqual(model.classes, ["normal", "anomaly"]);
  assert.deepEqual(model.bias, { normal: 0, anomaly: 0 });
  assert.deepEqual(validateLinearModel(model, 64), []);
});

test("dense and sparse matrix-vector scoring agree including public bias", () => {
  const eventWindow = buildSparseEventWindow();
  const vector = flattenEventWindow(eventWindow);
  const events = eventWindow.values.flatMap((row, time) =>
    row.flatMap((value, channel) =>
      value > 0 ? [{ index: time * eventWindow.channels + channel, value }] : [],
    ),
  );
  const model = {
    ...buildDemoLinearModel({ featureCount: 64, channels: 8 }),
    bias: { normal: 4, anomaly: 7 },
  };

  assert.deepEqual(denseMatVec(model, vector), { normal: 13, anomaly: 58 });
  assert.deepEqual(sparseMatVec(model, events), { normal: 13, anomaly: 58 });
});

test("linear model validation rejects mismatched feature and bias dimensions", () => {
  const model = {
    ...buildDemoLinearModel({ featureCount: 64, channels: 8 }),
    weights: {
      normal: [1, 2],
      anomaly: Array(64).fill(1),
    },
    bias: { normal: 0 },
  };

  assert.deepEqual(validateLinearModel(model, 64), [
    "weights.normal length 2 does not match feature count 64",
    "bias missing value for class anomaly",
  ]);
});

test("prototype benchmark emits privacy boundary, crypto inventory, and dense baseline comparison", () => {
  const benchmark = runPrototypeBenchmark({ seed: 91 });

  assert.equal(benchmark.schema, "neurofhe.benchmark.v1");
  assert.equal(benchmark.dataset, "synthetic-events-v0");
  assert.equal(benchmark.model, "tiny-linear-spike-count-v0");
  assert.equal(benchmark.scheme, "toy-paillier-additive-research-only");
  assert.equal(benchmark.productionClaim, false);
  assert.equal(benchmark.results.classification, "anomaly");
  assert.deepEqual(benchmark.results.decryptedScores, { normal: 9, anomaly: 51 });
  assert.equal(benchmark.boundaryDomain, "bio-digital-event-intelligence");
  assert.deepEqual(benchmark.linearModel.matrixShape, [2, 64]);
  assert.equal(benchmark.linearModel.scoreEquation, "scores = W x + bias");
  assert.equal(benchmark.linearModel.activeEventCount, 18);
  assert.equal(benchmark.sparseMetrics.spikeCount, 18);
  assert.equal(benchmark.operationCounts.scalarMultiplies, 36);
  assert.ok(benchmark.denseBaseline.operationCounts.scalarMultiplies > benchmark.operationCounts.scalarMultiplies);
  assert.deepEqual(benchmark.privacyModes.modes.map((mode) => mode.id), [
    "public-active-positions",
    "public-active-neuron-positions-encrypted-features",
    "padded-sparse-batches",
    "dense-encrypted-windows",
  ]);
  assert.ok(benchmark.ciphertextBytes > 0);
  assert.deepEqual(benchmark.cryptoInventory.keyEstablishment, [
    "ML-KEM-768-design-target",
  ]);
  assert.equal(benchmark.cryptoInventory.productionClaim, false);
  assert.ok(benchmark.privacyBoundary.computeSees.includes("ciphertext active spike values"));
  assert.ok(benchmark.privacyBoundary.computeSees.includes("public active event positions"));
});

test("representation benchmark compares dense raw, unsorted spikes, and spatial-sorted events", () => {
  const comparison = buildRepresentationComparison();
  const [denseRaw, unsortedSpikes, spatialSorted] = comparison.representations;

  assert.equal(comparison.schema, "neurofhe.representationComparison.v1");
  assert.equal(comparison.comparisonBasis, "same synthetic raw neural frame, same linear score contract");
  assert.deepEqual(comparison.expectedScores, { normal: 9, anomaly: 51 });
  assert.equal(comparison.expectedClassification, "anomaly");
  assert.deepEqual(comparison.representations.map((item) => item.id), [
    "dense-raw-window",
    "unsorted-spikes",
    "spatial-sorted-events",
  ]);

  assert.equal(denseRaw.inputShape, "8x8 dense window");
  assert.equal(denseRaw.encryptedFeatureSlots, 64);
  assert.equal(denseRaw.operationCounts.scalarMultiplies, 128);
  assert.deepEqual(denseRaw.scores, comparison.expectedScores);

  assert.equal(unsortedSpikes.inputShape, "18 raw spike samples");
  assert.equal(unsortedSpikes.encryptedFeatureSlots, 18);
  assert.equal(unsortedSpikes.operationCounts.scalarMultiplies, 36);
  assert.ok(unsortedSpikes.metadataLeakage.includes("raw sample timestamp order"));
  assert.deepEqual(unsortedSpikes.scores, comparison.expectedScores);

  assert.equal(spatialSorted.inputShape, "8x8 spatial-sorted event window");
  assert.equal(spatialSorted.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.equal(spatialSorted.encryptedFeatureSlots, 18);
  assert.equal(spatialSorted.operationCounts.scalarMultiplies, 36);
  assert.equal(spatialSorted.cryptoInventory.schema, "neurofhe.crypto.inventory.v1");
  assert.equal(spatialSorted.cryptoInventory.productionClaim, false);
  assert.equal(
    spatialSorted.privacyBoundary.schema,
    "neurofhe.sortedEventPrivacyBoundary.v1",
  );
  assert.ok(spatialSorted.privacyBoundary.gatewaySees.includes("sorted event window"));
  assert.ok(
    spatialSorted.privacyBoundary.computeSees.includes("approved active event positions"),
  );
  assert.ok(spatialSorted.privacyBoundary.withheld.includes("raw neural samples"));
  assert.ok(spatialSorted.preserves.includes("spatial bin provenance"));
  assert.deepEqual(spatialSorted.scores, comparison.expectedScores);
});

test("spatial spike sorter converts raw neural intake into a stable event window", () => {
  const rawFrame = buildSimulatedRawNeuralFrame();
  const sorted = sortSpatialSpikes(rawFrame);

  assert.equal(sorted.schema, "neurofhe.encoder.spatialSpikeSorter.v1");
  assert.equal(sorted.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.equal(sorted.encoder.implementationTarget, "fpga-or-edge-fsm");
  assert.equal(sorted.eventWindow.schema, "neurofhe.events.v1.spatial-sorter");
  assert.equal(sorted.eventWindow.encoding, "spatial-binned-spike-count");
  assert.deepEqual(sorted.eventWindow.spatialBins, [4, 2]);
  assert.deepEqual(validateEventWindow(sorted.eventWindow), []);
  assert.deepEqual(spikeMetrics(sorted.eventWindow), {
    featureCount: 64,
    spikeCount: 18,
    density: 0.28125,
    activeChannels: 6,
    activeTimesteps: 8,
  });
  assert.equal(sorted.sortedSpikes.length, 18);
  assert.equal(sorted.droppedSamples.length, 0);
});

test("spatial clustering outputs evaluate SNN and encrypted model readiness", () => {
  const evaluation = evaluateSpatialClusterReadiness();

  assert.equal(evaluation.schema, "neurofhe.spatialClusterReadiness.v1");
  assert.equal(evaluation.conclusion, "yes-with-adapters");
  assert.equal(evaluation.clusteringBasis, "deterministic spatial bins, not learned neural clusters");
  assert.equal(evaluation.snnPath.status, "adapter-ready");
  assert.equal(evaluation.snnPath.directFeed, false);
  assert.equal(evaluation.snnPath.eventStreamCompatible, true);
  assert.deepEqual(evaluation.snnPath.feedFields, [
    "timeBin",
    "neuronId",
    "unitX",
    "unitY",
    "value",
  ]);
  assert.deepEqual(evaluation.snnPath.previewEvents[0], {
    timeBin: 0,
    neuronId: 1,
    unitX: 1,
    unitY: 0,
    value: 1,
  });
  assert.ok(evaluation.snnPath.requiredAdapters.includes("count-to-spike-train expansion"));
  assert.equal(evaluation.lightweightEncryptedLinearPath.status, "ready-now");
  assert.equal(
    evaluation.lightweightEncryptedLinearPath.privacyMode,
    "public-active-neuron-positions-encrypted-features",
  );
  assert.equal(evaluation.lightweightEncryptedLinearPath.encryptedFeatureSlots, 18);
  assert.deepEqual(evaluation.lightweightEncryptedLinearPath.operationFamily, [
    "integer addition",
    "plaintext scalar multiplication",
  ]);
  assert.equal(evaluation.lightweightEncryptedNonlinearPath.status, "research-only");
  assert.ok(evaluation.caveats.includes("not a trained SNN"));
  assert.ok(evaluation.caveats.includes("not clinical or biological validation"));
});

test("gateway demo exports a minimal model event without raw signal leakage", () => {
  const demo = runGatewayDemo({
    observedAt: "2026-05-21T12:34:56.000Z",
    receivedAt: "2026-05-21T12:35:02.000Z",
  });
  const modelEvent = demo.policyDecision.modelFacingEvent;
  const serialized = JSON.stringify(demo);

  assert.equal(demo.schema, "neurofhe.gateway.demo.v1");
  assert.equal(demo.boundaryDomain, "bio-digital-event-intelligence");
  assert.equal(modelEvent.schema, "neurofhe.gateway.modelEvent.v1");
  assert.equal(modelEvent.boundary, "local-trust-boundary-approved-export");
  assert.equal(modelEvent.productionClaim, false);
  assert.equal(demo.normalizedEvent.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.equal(modelEvent.plaintext.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.equal(modelEvent.plaintext.observedAtBucket, "2026-05-21T12:34:00.000Z");
  assert.equal(modelEvent.plaintext.sparseMetrics.activeEventCount, 18);
  assert.equal(modelEvent.plaintext.sparseMetrics.densityBucket, "0.25-0.5");
  assert.equal(modelEvent.plaintext.activePositions.length, 18);
  assert.equal(modelEvent.encrypted.activeSpikeValues.length, 18);
  assert.equal(demo.auditLog.every((record) => record.containsRawPayload === false), true);
  assert.equal(demo.sanitizedReplayStream.containsRawPayload, false);
  assert.equal(serialized.includes("SIM-DEVICE-LOCAL-ONLY"), false);
  assert.equal(serialized.includes("simulated-subject-local-only"), false);
  assert.equal(serialized.includes("/local-only/simulated/raw-signal.json"), false);
  assert.equal(serialized.includes("local-simulation-lab"), false);
  assert.equal(serialized.includes("rawNeuralSamples"), false);
});

test("gateway validates and sanitizes sorted neural event input", () => {
  const sorted = sortSpatialSpikes(buildSimulatedRawNeuralFrame());
  const rawSignal = {
    schema: "neurofhe.gateway.rawSignal.v1",
    intakeId: "raw-sorted-event-001",
    observedAt: "2026-05-21T12:34:56.000Z",
    receivedAt: "2026-05-21T12:35:02.000Z",
    localOnly: true,
    sensitivity: "sensitive-by-default",
    source: {
      sourceId: "sorted-source-local",
      kind: "simulated-bio-digital-event-stream",
      adapter: "local-sorted-event-import",
      authorization: "synthetic-demo-only",
    },
    payload: {
      sortedNeuralEvent: {
        schema: "neurofhe.gateway.sortedNeuralEvent.v1",
        eventWindow: sorted.eventWindow,
        encoder: sorted.encoder,
        sorterConfig: sorted.config,
        rawSamplePayloads: [{ sampleId: "sample-local-only", amplitude: 90 }],
        localOperatorNote: "do-not-export",
      },
    },
  };

  const normalized = normalizeRawSignal(rawSignal);
  const policyDecision = applyPrivacySafetyPolicy(normalized, buildDefaultGatewayPolicy());
  const modelEvent = policyDecision.modelFacingEvent;
  const serializedModelEvent = JSON.stringify(modelEvent);

  assert.equal(normalized.validation.status, "valid");
  assert.equal(normalized.features.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.equal(normalized.features.encoder.inputKind, "sorted-neural-event");
  assert.ok(normalized.provenance.transformIds.includes("validate-sorted-neural-event"));
  assert.equal(policyDecision.decision, "approved");
  assert.equal(modelEvent.plaintext.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.equal(serializedModelEvent.includes("sample-local-only"), false);
  assert.equal(serializedModelEvent.includes("do-not-export"), false);
  assert.equal(serializedModelEvent.includes("localOperatorNote"), false);
});

test("sorted neural model events resist raw payload reconstruction", () => {
  const sorted = sortSpatialSpikes(buildSimulatedRawNeuralFrame());
  const rawSignal = {
    schema: "neurofhe.gateway.rawSignal.v1",
    intakeId: "raw-sorted-event-reconstruction-001",
    observedAt: "2026-05-21T12:34:56.000Z",
    receivedAt: "2026-05-21T12:35:02.000Z",
    localOnly: true,
    sensitivity: "sensitive-by-default",
    source: {
      sourceId: "sorted-source-local",
      kind: "simulated-bio-digital-event-stream",
      adapter: "local-sorted-event-import",
      authorization: "synthetic-demo-only",
    },
    payload: {
      sortedNeuralEvent: {
        schema: "neurofhe.gateway.sortedNeuralEvent.v1",
        eventWindow: sorted.eventWindow,
        encoder: sorted.encoder,
        sorterConfig: {
          ...sorted.config,
          localCalibrationRef: "CALIBRATION-SECRET-LOCAL-ONLY",
        },
        sourcePayload: {
          rawNeuralSamples: [
            {
              sampleId: "RAW-SAMPLE-SECRET-001",
              electrodeId: "electrode-7",
              timestampUs: 1234,
              amplitude: 9001,
            },
          ],
          operatorNote: "NEVER_EXPORT_SORTED_RAW_SOURCE",
        },
      },
    },
  };

  const normalized = normalizeRawSignal(rawSignal);
  const policyDecision = applyPrivacySafetyPolicy(normalized, buildDefaultGatewayPolicy());
  const modelEvent = policyDecision.modelFacingEvent;
  const serializedModelEvent = JSON.stringify(modelEvent);

  assert.equal(policyDecision.decision, "approved");
  assert.equal(modelEvent.provenance.rawPayloadHash, "withheld-local-audit-only");
  assert.equal(modelEvent.reconstructionResistance.schema, "neurofhe.gateway.reconstructionResistance.v1");
  assert.equal(modelEvent.reconstructionResistance.rawPayloadReconstruction, "blocked-by-policy");
  assert.equal(modelEvent.reconstructionResistance.activeValueVisibility, "encrypted-references-only");
  assert.ok(
    modelEvent.reconstructionResistance.residualMetadataLeakage.includes(
      "public active neuron positions",
    ),
  );
  assert.equal(modelEvent.plaintext.activePositions.every((position) => !("value" in position)), true);
  assert.equal(modelEvent.encrypted.activeSpikeValues.length, modelEvent.plaintext.activePositions.length);
  assert.equal(serializedModelEvent.includes("RAW-SAMPLE-SECRET-001"), false);
  assert.equal(serializedModelEvent.includes("electrode-7"), false);
  assert.equal(serializedModelEvent.includes("timestampUs"), false);
  assert.equal(serializedModelEvent.includes("9001"), false);
  assert.equal(serializedModelEvent.includes("NEVER_EXPORT_SORTED_RAW_SOURCE"), false);
  assert.equal(serializedModelEvent.includes("CALIBRATION-SECRET-LOCAL-ONLY"), false);
});

test("sorted neural context tags aggregate cortical region and layer by default", () => {
  const sorted = sortSpatialSpikes(buildSimulatedRawNeuralFrame());
  const rawSignal = {
    schema: "neurofhe.gateway.rawSignal.v1",
    intakeId: "raw-sorted-event-context-001",
    observedAt: "2026-05-21T12:34:56.000Z",
    receivedAt: "2026-05-21T12:35:02.000Z",
    localOnly: true,
    sensitivity: "sensitive-by-default",
    source: {
      sourceId: "sorted-source-local",
      kind: "simulated-bio-digital-event-stream",
      adapter: "local-sorted-event-import",
      authorization: "synthetic-demo-only",
    },
    payload: {
      sortedNeuralEvent: {
        schema: "neurofhe.gateway.sortedNeuralEvent.v1",
        eventWindow: sorted.eventWindow,
        encoder: sorted.encoder,
        sorterConfig: sorted.config,
        contextTags: {
          schema: "neurofhe.gateway.neuralContextTags.v1",
          region: "A1",
          corticalLayer: "IV",
          source: "kiwi-inspired-simulated-context",
          confidence: 0.51,
        },
      },
    },
  };

  const normalized = normalizeRawSignal(rawSignal);
  const modelEvent = applyPrivacySafetyPolicy(
    normalized,
    buildDefaultGatewayPolicy(),
  ).modelFacingEvent;
  const serializedPlaintext = JSON.stringify(modelEvent.plaintext);
  const serializedModelEvent = JSON.stringify(modelEvent);

  assert.equal(normalized.validation.status, "valid");
  assert.equal(normalized.features.neuralContext.region.code, "A1");
  assert.equal(normalized.features.neuralContext.corticalLayer.code, "IV");
  assert.deepEqual(modelEvent.aggregated.neuralContextSummary, {
    schema: "neurofhe.gateway.neuralContextSummary.v1",
    visibility: "aggregated",
    tagCount: 2,
    regionGroup: "auditory-cortex",
    corticalLayerGroup: "middle-layers",
    confidenceBucket: "0.5-0.75",
    exactContextWithheld: true,
  });
  assert.equal(serializedPlaintext.includes("A1"), false);
  assert.equal(serializedModelEvent.includes("primary-auditory-cortex"), false);
  assert.equal(serializedModelEvent.includes("kiwi-inspired-simulated-context"), false);
});

test("sorted neural context tags can export as encrypted references", () => {
  const sorted = sortSpatialSpikes(buildSimulatedRawNeuralFrame());
  const rawSignal = {
    schema: "neurofhe.gateway.rawSignal.v1",
    intakeId: "raw-sorted-event-context-encrypted-001",
    observedAt: "2026-05-21T12:34:56.000Z",
    receivedAt: "2026-05-21T12:35:02.000Z",
    localOnly: true,
    sensitivity: "sensitive-by-default",
    source: {
      sourceId: "sorted-source-local",
      kind: "simulated-bio-digital-event-stream",
      adapter: "local-sorted-event-import",
      authorization: "synthetic-demo-only",
    },
    payload: {
      sortedNeuralEvent: {
        schema: "neurofhe.gateway.sortedNeuralEvent.v1",
        eventWindow: sorted.eventWindow,
        encoder: sorted.encoder,
        sorterConfig: sorted.config,
        contextTags: {
          region: "A1",
          corticalLayer: "VI",
          confidence: 0.88,
        },
      },
    },
  };

  const normalized = normalizeRawSignal(rawSignal);
  const modelEvent = applyPrivacySafetyPolicy(
    normalized,
    buildDefaultGatewayPolicy({ neuralContextVisibility: "encrypted" }),
  ).modelFacingEvent;
  const serializedModelEvent = JSON.stringify(modelEvent);

  assert.equal(modelEvent.aggregated.neuralContextSummary.visibility, "encrypted");
  assert.equal(modelEvent.aggregated.neuralContextSummary.tagCount, 2);
  assert.deepEqual(modelEvent.encrypted.neuralContextTags, [
    {
      field: "region",
      ciphertextRef: "enc-neural-context-region",
      encoding: "encrypted-context-tag-code",
    },
    {
      field: "corticalLayer",
      ciphertextRef: "enc-neural-context-corticalLayer",
      encoding: "encrypted-context-tag-code",
    },
  ]);
  assert.equal(serializedModelEvent.includes("A1"), false);
  assert.equal(serializedModelEvent.includes("\"VI\""), false);
});

test("gateway rejects invalid cortical context tags", () => {
  const sorted = sortSpatialSpikes(buildSimulatedRawNeuralFrame());
  const rawSignal = {
    schema: "neurofhe.gateway.rawSignal.v1",
    intakeId: "raw-sorted-event-context-invalid-001",
    observedAt: "2026-05-21T12:34:56.000Z",
    receivedAt: "2026-05-21T12:35:02.000Z",
    localOnly: true,
    sensitivity: "sensitive-by-default",
    source: {
      sourceId: "sorted-source-local",
      kind: "simulated-bio-digital-event-stream",
      adapter: "local-sorted-event-import",
      authorization: "synthetic-demo-only",
    },
    payload: {
      sortedNeuralEvent: {
        schema: "neurofhe.gateway.sortedNeuralEvent.v1",
        eventWindow: sorted.eventWindow,
        encoder: sorted.encoder,
        contextTags: {
          region: "A17",
          corticalLayer: "VII",
        },
      },
    },
  };

  const normalized = normalizeRawSignal(rawSignal);
  const policyDecision = applyPrivacySafetyPolicy(normalized, buildDefaultGatewayPolicy());

  assert.equal(normalized.validation.status, "rejected");
  assert.ok(normalized.validation.errors.includes("neural context region A17 is not allowed"));
  assert.ok(normalized.validation.errors.includes("cortical layer VII is not allowed"));
  assert.equal(policyDecision.decision, "blocked");
  assert.equal(policyDecision.modelFacingEvent, null);
});

test("gateway blocks malformed sorted neural event input", () => {
  const sorted = sortSpatialSpikes(buildSimulatedRawNeuralFrame());
  const rawSignal = {
    schema: "neurofhe.gateway.rawSignal.v1",
    intakeId: "raw-sorted-event-malformed-001",
    observedAt: "2026-05-21T12:34:56.000Z",
    receivedAt: "2026-05-21T12:35:02.000Z",
    localOnly: true,
    sensitivity: "sensitive-by-default",
    source: {
      sourceId: "sorted-source-local",
      kind: "simulated-bio-digital-event-stream",
      adapter: "local-sorted-event-import",
      authorization: "synthetic-demo-only",
    },
    payload: {
      sortedNeuralEvent: {
        schema: "neurofhe.gateway.sortedNeuralEvent.v1",
        eventWindow: {
          ...sorted.eventWindow,
          values: [sorted.eventWindow.values[0]],
        },
      },
    },
  };

  const normalized = normalizeRawSignal(rawSignal);
  const policyDecision = applyPrivacySafetyPolicy(normalized, buildDefaultGatewayPolicy());

  assert.equal(normalized.validation.status, "rejected");
  assert.ok(normalized.validation.errors.includes("values length 1 does not match timesteps 8"));
  assert.equal(policyDecision.decision, "blocked");
  assert.equal(policyDecision.modelFacingEvent, null);
  assert.ok(policyDecision.reasons.includes("normalization validation did not pass"));
});

test("gateway accepts safe local recommendations and rejects raw device commands", () => {
  const rawSignal = buildSimulatedRawSignal();
  const normalized = normalizeRawSignal(rawSignal);
  const policy = buildDefaultGatewayPolicy();
  const policyDecision = applyPrivacySafetyPolicy(normalized, policy);
  const modelEvent = policyDecision.modelFacingEvent;
  const acceptedRecommendation = buildLocalAnnotationRecommendation(modelEvent);
  const rejectedRecommendation = buildUnsafeDeviceCommandRecommendation(modelEvent);
  const acceptedDecision = evaluateRecommendation(acceptedRecommendation, modelEvent, policy);
  const rejectedDecision = evaluateRecommendation(rejectedRecommendation, modelEvent, policy);
  const strictDecision = applyPrivacySafetyPolicy(
    normalized,
    buildDefaultGatewayPolicy({ maxActiveEvents: 1 }),
  );

  assert.equal(policyDecision.decision, "approved");
  assert.equal(acceptedDecision.decision, "accepted");
  assert.equal(acceptedDecision.approvedAction.executionScope, "safe-local-reversible");
  assert.equal(rejectedDecision.decision, "rejected");
  assert.ok(rejectedDecision.reasons.includes("raw device commands are blocked"));
  assert.ok(rejectedDecision.reasons.includes("action type raw_device_command is blocked"));
  assert.equal(strictDecision.decision, "blocked");
  assert.equal(strictDecision.modelFacingEvent, null);
  assert.ok(strictDecision.reasons[0].includes("active event count 18 exceeds policy maximum 1"));
});

test("prototype benchmark emits the scientific artifact fields every run needs", () => {
  const benchmark = runPrototypeBenchmark({ seed: 91 });

  assert.equal(benchmark.accuracy.schema, "neurofhe.accuracy.v1");
  assert.equal(benchmark.accuracy.metric, "single-window-plaintext-agreement");
  assert.equal(benchmark.accuracy.value, 1);
  assert.equal(benchmark.accuracy.correct, 1);
  assert.equal(benchmark.accuracy.sampleCount, 1);
  assert.equal(typeof benchmark.latencyMs, "number");
  assert.equal(benchmark.ciphertextBytes, 200);
  assert.equal(benchmark.operationCounts.scalarMultiplies, 36);
  assert.equal(benchmark.securityParameters.schema, "neurofhe.securityParameters.v1");
  assert.equal(benchmark.securityParameters.scheme, "toy-paillier-additive-research-only");
  assert.equal(benchmark.securityParameters.productionClaim, false);
  assert.equal(benchmark.privacyBoundary.computeSees.length > 0, true);
  assert.deepEqual(benchmark.cryptoInventory.encryptedComputation, [
    "toy-paillier-additive-research-only",
  ]);
  assert.equal(benchmark.representationComparison.schema, "neurofhe.representationComparison.v1");
  assert.deepEqual(benchmark.representationComparison.representations.map((item) => item.id), [
    "dense-raw-window",
    "unsorted-spikes",
    "spatial-sorted-events",
  ]);
});

test("benchmark artifacts publish a run JSON and latest JSON with required fields", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-benchmark-"));
  const published = await publishBenchmarkArtifact({
    outputDir,
    seed: 91,
    artifactId: "test-run",
    generatedAt: "2026-05-20T00:00:00.000Z",
  });
  const runArtifact = JSON.parse(await readFile(published.paths.run, "utf8"));
  const latestArtifact = JSON.parse(await readFile(published.paths.latest, "utf8"));

  assert.equal(published.schema, "neurofhe.benchmarkArtifact.publish.v1");
  assert.equal(runArtifact.schema, "neurofhe.benchmarkArtifact.v1");
  assert.equal(runArtifact.artifactId, "test-run");
  assert.equal(runArtifact.generatedAt, "2026-05-20T00:00:00.000Z");
  assert.equal(runArtifact.accuracy.value, 1);
  assert.equal(runArtifact.latencyMs, runArtifact.benchmark.latencyMs);
  assert.equal(runArtifact.ciphertextBytes, 200);
  assert.equal(runArtifact.operationCounts.scalarMultiplies, 36);
  assert.equal(runArtifact.securityParameters.productionClaim, false);
  assert.ok(runArtifact.privacyBoundary.computeSees.includes("ciphertext active spike values"));
  assert.ok(runArtifact.cryptoInventory.encryptedComputation.includes("toy-paillier-additive-research-only"));
  assert.deepEqual(latestArtifact, runArtifact);
  assert.deepEqual(buildBenchmarkArtifact(runArtifact.benchmark, {
    artifactId: "test-copy",
    generatedAt: "2026-05-20T00:00:00.000Z",
  }).requiredFields, [
    "accuracy",
    "latencyMs",
    "ciphertextBytes",
    "operationCounts",
    "securityParameters",
    "privacyBoundary",
    "cryptoInventory",
  ]);
});

test("privacy mode benchmark compares speed against sparsity metadata protection", () => {
  const comparison = buildPrivacyModeComparison(buildSparseEventWindow(), 2);
  const [publicSparse, publicNeurons, paddedSparse, dense] = comparison.modes;

  assert.equal(comparison.schema, "neurofhe.privacyModes.v1");
  assert.equal(comparison.activeEventCount, 18);
  assert.equal(comparison.featureCount, 64);
  assert.deepEqual(comparison.modes.map((mode) => mode.id), [
    "public-active-positions",
    "public-active-neuron-positions-encrypted-features",
    "padded-sparse-batches",
    "dense-encrypted-windows",
  ]);
  assert.equal(publicSparse.speedTier, "fastest");
  assert.equal(publicSparse.sparsityProtection, "low");
  assert.equal(publicSparse.encryptedFeatureSlots, 18);
  assert.equal(publicSparse.operationCounts.scalarMultiplies, 36);
  assert.ok(publicSparse.metadataLeakage.includes("exact active event positions"));

  assert.equal(publicNeurons.label, "Public active neuron positions + encrypted features");
  assert.equal(publicNeurons.representation, "spatial-sorted-events");
  assert.equal(publicNeurons.encryptedFeatureSlots, 18);
  assert.equal(publicNeurons.operationCounts.scalarMultiplies, 36);
  assert.deepEqual(publicNeurons.publicFields, [
    "activeNeuronPositions",
    "featureShape",
    "publicModelWeights",
    "publicBias",
  ]);
  assert.deepEqual(publicNeurons.encryptedFields, [
    "activeFeatureValues",
    "classScoreCiphertexts",
  ]);
  assert.ok(publicNeurons.metadataLeakage.includes("active neuron identity and time-bin pattern"));
  assert.ok(publicNeurons.hides.includes("raw sorted-event feature values"));
  assert.equal(publicNeurons.relativeScalarMultiplies, 1);

  assert.equal(paddedSparse.speedTier, "middle");
  assert.equal(paddedSparse.sparsityProtection, "partial");
  assert.equal(paddedSparse.encryptedFeatureSlots, 32);
  assert.equal(paddedSparse.operationCounts.scalarMultiplies, 64);
  assert.equal(paddedSparse.relativeScalarMultiplies, 1.78);
  assert.ok(paddedSparse.metadataLeakage.includes("padding bucket size"));

  assert.equal(dense.speedTier, "slowest");
  assert.equal(dense.sparsityProtection, "highest of these three modes");
  assert.equal(dense.encryptedFeatureSlots, 64);
  assert.equal(dense.operationCounts.scalarMultiplies, 128);
  assert.equal(dense.relativeScalarMultiplies, 3.56);
  assert.ok(dense.hides.includes("active positions"));
});

test("privacy mode decision picks one explicit comparison mode", () => {
  const eventWindow = buildSparseEventWindow();
  const defaultDecision = buildPrivacyModeDecision(eventWindow, 2);
  const publicDecision = buildPrivacyModeDecision(eventWindow, 2, {
    metadataTolerance: "high",
  });
  const denseDecision = buildPrivacyModeDecision(eventWindow, 2, {
    sparsityProtection: "highest",
  });

  assert.equal(defaultDecision.schema, "neurofhe.privacyModeDecision.v1");
  assert.deepEqual(defaultDecision.allowedModes, [
    "public-active-positions",
    "padded-sparse-batches",
    "dense-encrypted-windows",
  ]);
  assert.equal(defaultDecision.recommendedMode, "padded-sparse-batches");
  assert.equal(defaultDecision.rationale.includes("default comparison lane"), true);
  assert.equal(defaultDecision.publicActivePositions.operationCounts.scalarMultiplies, 36);
  assert.equal(defaultDecision.paddedSparseBatches.operationCounts.scalarMultiplies, 64);
  assert.equal(defaultDecision.denseEncryptedWindows.operationCounts.scalarMultiplies, 128);
  assert.equal(publicDecision.recommendedMode, "public-active-positions");
  assert.equal(denseDecision.recommendedMode, "dense-encrypted-windows");
});

test("packed-vector planning notes preserve BFV/BGV and CKKS lanes", () => {
  const notes = buildPackedVectorPlanningNotes(buildSparseEventWindow(), 2);

  assert.equal(notes.schema, "neurofhe.packedVectorPlanning.v1");
  assert.equal(notes.defaultLane, "bfv-bgv-packed-integer");
  assert.equal(notes.featureCount, 64);
  assert.equal(notes.activeEventCount, 18);
  assert.deepEqual(notes.lanes.map((lane) => lane.id), [
    "bfv-bgv-packed-integer",
    "ckks-packed-approximate",
  ]);
  assert.equal(notes.lanes[0].schemeFamily, "BFV/BGV");
  assert.equal(notes.lanes[0].scoreContract, "scores = W x + bias");
  assert.ok(notes.lanes[0].packingNotes.includes("pack active values"));
  assert.equal(notes.lanes[1].schemeFamily, "CKKS");
  assert.ok(notes.lanes[1].caveats.includes("approximate arithmetic changes the integer score contract"));
  assert.ok(notes.nonGoals.includes("encrypted argmax"));
});

test("prototype benchmark carries adapter planning, privacy decision, and framing guardrail", () => {
  const benchmark = runPrototypeBenchmark({ seed: 91 });

  assert.equal(benchmark.packedVectorPlanning.schema, "neurofhe.packedVectorPlanning.v1");
  assert.equal(benchmark.privacyModeDecision.schema, "neurofhe.privacyModeDecision.v1");
  assert.equal(benchmark.privacyModeDecision.recommendedMode, "padded-sparse-batches");
  assert.equal(benchmark.framingGuardrail.schema, "neurofhe.framingGuardrail.v1");
  assert.equal(benchmark.framingGuardrail.preferredFrame, "privacy-preserving event intelligence");
  assert.ok(benchmark.framingGuardrail.avoidClaims.includes("medical diagnosis"));
  assert.ok(benchmark.framingGuardrail.avoidClaims.includes("treatment"));
});

test("OpenFHE demo contract preserves the sparse linear score boundary", () => {
  const contract = buildOpenFheDemoContract();

  assert.equal(contract.schema, "neurofhe.openfhe.contract.v1");
  assert.equal(contract.scheme, "openfhe-bfvrns");
  assert.equal(contract.scoreEquation, "scores = W x + bias");
  assert.equal(contract.boundaryDomain, "bio-digital-event-intelligence");
  assert.equal(contract.eventRepresentation, "spatial-sorted-events");
  assert.equal(contract.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.deepEqual(contract.spatialBins, [4, 2]);
  assert.equal(contract.privacyMode.id, "public-active-neuron-positions-encrypted-features");
  assert.deepEqual(contract.matrixShape, [2, 64]);
  assert.equal(contract.activeEventCount, 18);
  assert.equal(contract.publicActiveNeuronPositions.length, 18);
  assert.equal("value" in contract.publicActiveNeuronPositions[0], false);
  assert.deepEqual(contract.publicActiveNeuronPositions[0], {
    index: 1,
    timeBin: 0,
    neuronId: 1,
    unitX: 1,
    unitY: 0,
  });
  assert.deepEqual(contract.expectedPlaintextScores, { normal: 9, anomaly: 51 });
  assert.equal(contract.expectedClassification, "anomaly");
  assert.deepEqual(validateOpenFheContract(contract), []);
});

test("OpenFHE real-library adapter is bound to the generated score contract", () => {
  const adapter = buildOpenFheRealLibraryAdapter();

  assert.equal(adapter.schema, "neurofhe.realLibraryAdapter.v1");
  assert.equal(adapter.adapterId, "openfhe-bfvrns-sparse-linear-v1");
  assert.equal(adapter.library.name, "OpenFHE");
  assert.equal(adapter.library.scheme, "BFVrns");
  assert.equal(adapter.contract.schema, "neurofhe.openfhe.contract.v1");
  assert.equal(adapter.contract.scoreEquation, "scores = W x + bias");
  assert.equal(adapter.contract.scoreDomain, "non-negative-integers");
  assert.equal(adapter.contractDigest.algorithm, "sha256");
  assert.match(adapter.contractDigest.value, /^[0-9a-f]{64}$/);
  assert.deepEqual(adapter.contractValidation.errors, []);
  assert.equal(adapter.nativeTarget, "openfhe_linear_demo");
  assert.equal(adapter.privacyModeDecision.recommendedMode, "padded-sparse-batches");
  assert.equal(adapter.packedVectorPlanning.defaultLane, "bfv-bgv-packed-integer");
  assert.equal(adapter.framingGuardrail.preferredFrame, "privacy-preserving event intelligence");
});

test("OpenFHE contract validation rejects unsafe integer-domain inputs", () => {
  const contract = buildOpenFheDemoContract();
  const malformed = {
    ...contract,
    matrixShape: [2, 63],
    activeEvents: [
      { index: 0, value: 1 },
      { index: 64, value: 1 },
      { index: 3, value: -1 },
      { index: 4, value: 1.5 },
    ],
    weights: {
      normal: [1, -2],
      anomaly: Array(64).fill(1),
    },
    bias: { normal: -1, anomaly: 0.25 },
  };

  assert.deepEqual(validateOpenFheContract(malformed), [
    "matrixShape 2x63 does not match classes/features",
    "activeEvents[1].index 64 is outside feature count 64",
    "activeEvents[2].value must be a non-negative integer",
    "activeEvents[3].value must be a non-negative integer",
    "publicActiveNeuronPositions length must match activeEvents length",
    "weights.normal length 2 does not match feature count 64",
    "weights.normal[1] must be a non-negative integer",
    "bias.normal must be a non-negative integer",
    "bias.anomaly must be a non-negative integer",
  ]);
});

test("OpenFHE integration plan reports build commands and local detection state", () => {
  const plan = openFheIntegrationPlan();
  const detection = detectOpenFhe({ env: {}, roots: [] });

  assert.equal(plan.schema, "neurofhe.openfhe.integrationPlan.v1");
  assert.equal(plan.nativeTarget, "openfhe_linear_demo");
  assert.equal(plan.adapter.schema, "neurofhe.realLibraryAdapter.v1");
  assert.ok(plan.sourcePath.endsWith("prototype/openfhe/openfhe_linear_demo.cpp"));
  assert.ok(plan.cmakePath.endsWith("prototype/openfhe/CMakeLists.txt"));
  assert.equal(plan.contract.eventRepresentation, "spatial-sorted-events");
  assert.equal(plan.contract.privacyMode.id, "public-active-neuron-positions-encrypted-features");
  assert.deepEqual(plan.commands, [
    "cmake -S prototype/openfhe -B build/openfhe",
    "cmake --build build/openfhe",
    "build/openfhe/openfhe_linear_demo",
  ]);
  assert.equal(detection.available, false);
  assert.equal(detection.reason, "OpenFHEConfig.cmake not found");
});

test("comparison artifacts can persist adapter plans for later library runs", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-comparison-"));
  const published = await publishComparisonArtifact({
    outputDir,
    subject: buildOpenFheRealLibraryAdapter(),
    artifactId: "adapter-plan",
    generatedAt: "2026-05-21T00:00:00.000Z",
  });
  const runArtifact = JSON.parse(await readFile(published.paths.run, "utf8"));
  const latestArtifact = JSON.parse(await readFile(published.paths.latest, "utf8"));

  assert.equal(published.schema, "neurofhe.comparisonArtifact.publish.v1");
  assert.equal(runArtifact.schema, "neurofhe.comparisonArtifact.v1");
  assert.equal(runArtifact.artifactId, "adapter-plan");
  assert.equal(runArtifact.subject.schema, "neurofhe.realLibraryAdapter.v1");
  assert.equal(runArtifact.subject.adapterId, "openfhe-bfvrns-sparse-linear-v1");
  assert.equal(runArtifact.framingGuardrail.preferredFrame, "privacy-preserving event intelligence");
  assert.deepEqual(latestArtifact, runArtifact);
});

test("native OpenFHE source uses real BFVrns OpenFHE APIs", async () => {
  const source = await readFile(
    new URL("../openfhe/openfhe_linear_demo.cpp", import.meta.url),
    "utf8",
  );

  assert.match(source, /#include "openfhe\.h"/);
  assert.match(source, /SortedSpatialEventWindow/);
  assert.match(source, /PublicActiveNeuronPositions/);
  assert.match(source, /spatial-sorted-events/);
  assert.match(source, /public-active-neuron-positions-encrypted-features/);
  assert.match(source, /activeNeuronPositions/);
  assert.match(source, /CryptoContextBFVRNS/);
  assert.match(source, /GenCryptoContext/);
  assert.match(source, /EvalMult/);
  assert.match(source, /EvalAdd/);
  assert.match(source, /Decrypt/);
});

test("research assumptions are falsifiable and preserve clean-room guardrails", async () => {
  const text = await readFile(
    new URL("../research-assumptions.json", import.meta.url),
    "utf8",
  );
  const assumptions = JSON.parse(text);

  assert.equal(assumptions.schema, "neurofhe.researchAssumptions.v1");
  assert.ok(assumptions.naming.publicName);
  assert.ok(!/r2-?d2/i.test(assumptions.naming.publicName));
  assert.ok(assumptions.ipGuardrails.cleanRoomOnly);
  assert.ok(assumptions.ipGuardrails.noProprietaryReverseEngineering);
  assert.ok(assumptions.hypotheses.length >= 5);
  for (const hypothesis of assumptions.hypotheses) {
    assert.ok(hypothesis.assumption);
    assert.ok(hypothesis.measurement);
    assert.ok(hypothesis.falsifier);
  }
});

test("N-MNIST parser decodes 40-bit address-event records", () => {
  const buffer = new Uint8Array([
    ...encodeNmnistEvent({ x: 3, y: 4, polarity: 1, timestampUs: 12345 }),
    ...encodeNmnistEvent({ x: 31, y: 2, polarity: 0, timestampUs: 65536 }),
  ]);

  assert.deepEqual(parseNmnistEvents(buffer), [
    { x: 3, y: 4, polarity: 1, timestampUs: 12345 },
    { x: 31, y: 2, polarity: 0, timestampUs: 65536 },
  ]);
});

test("N-MNIST feature extraction freezes a tiny event window", () => {
  const events = [
    { x: 0, y: 0, polarity: 1, timestampUs: 0 },
    { x: 33, y: 33, polarity: 0, timestampUs: 104999 },
    { x: 10, y: 10, polarity: 1, timestampUs: 120000 },
  ];
  const features = eventsToFeatureVector(events, {
    gridSize: 4,
    timeBins: 2,
    windowUs: 105000,
  });

  assert.deepEqual(features.featureShape, [2, 4, 4, 2]);
  assert.equal(features.vector.length, 64);
  assert.equal(features.activeEventCount, 2);
  assert.equal(features.sparsity.nonZeroFeatures, 2);
  assert.equal(features.sparsity.eventCount, 2);
  assert.equal(features.vector[1], 1);
  assert.equal(features.vector[62], 1);
});

test("plaintext event baseline trains and evaluates a small linear classifier", () => {
  const trainRecords = [
    { label: "0", events: [{ x: 1, y: 1, polarity: 1, timestampUs: 1000 }] },
    { label: "0", events: [{ x: 2, y: 1, polarity: 1, timestampUs: 2000 }] },
    { label: "1", events: [{ x: 30, y: 30, polarity: 0, timestampUs: 1000 }] },
    { label: "1", events: [{ x: 29, y: 30, polarity: 0, timestampUs: 2000 }] },
  ];
  const testRecords = [
    { label: "0", events: [{ x: 1, y: 2, polarity: 1, timestampUs: 3000 }] },
    { label: "1", events: [{ x: 31, y: 31, polarity: 0, timestampUs: 3000 }] },
  ];
  const options = { gridSize: 4, timeBins: 2, windowUs: 105000 };

  const model = trainCentroidLinearClassifier(trainRecords, options);
  const evaluation = evaluateLinearClassifier(model, testRecords, options);
  const report = runPlaintextEventBaseline({ trainRecords, testRecords, options });

  assert.equal(model.classifier, "nearest-centroid-linear");
  assert.deepEqual(model.matrixShape, [2, 64]);
  assert.equal(evaluation.accuracy, 1);
  assert.equal(evaluation.correct, 2);
  assert.equal(report.schema, "neurofhe.plaintextBaseline.v1");
  assert.equal(report.dataset, "N-MNIST-compatible-event-records");
  assert.deepEqual(report.featureShape, [2, 4, 4, 2]);
  assert.equal(report.metrics.accuracy, 1);
  assert.equal(report.metrics.averageActiveEvents, 1);
});
