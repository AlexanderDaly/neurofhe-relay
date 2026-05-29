import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildBenchmarkArtifact,
  buildPaddingOverheadAblation,
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
  buildNativeEvidenceManifest,
  classifyNativeEvidenceArtifact,
  publishNativeEvidenceArtifact,
} from "../lib/native-evidence.mjs";
import {
  buildRepositoryHygieneArtifact,
  scanRepositoryHygiene,
} from "../lib/repo-hygiene.mjs";
import {
  scanMarkdownLinks,
} from "../lib/docs-links.mjs";
import {
  buildReleaseEvidenceIndex,
} from "../lib/release-evidence.mjs";
import {
  buildReconstructionRiskArtifact,
  evaluateRepresentationReconstructionRisk,
} from "../lib/reconstruction-risk.mjs";
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
  buildOpenFheUnavailableReport,
  detectOpenFhe,
  openFheIntegrationPlan,
  validateOpenFheContract,
} from "../lib/openfhe-adapter.mjs";
import {
  buildOpenFheCkksDemoContract,
  buildOpenFheCkksRealLibraryAdapter,
  openFheCkksIntegrationPlan,
  validateOpenFheCkksContract,
} from "../lib/openfhe-ckks-adapter.mjs";
import {
  buildTfheRsDemoContract,
  buildTfheRsRealLibraryAdapter,
  buildTfheRsRealDataUnavailableReport,
  tfheRsIntegrationPlan,
  validateTfheRsContract,
} from "../lib/tfhe-rs-adapter.mjs";
import {
  buildNmnistSmokeFixtureRecords,
  encodeNmnistEvent,
  eventsToFeatureVector,
  evaluateLinearClassifier,
  parseNmnistEvents,
  runPlaintextCompressionSweep,
  runPlaintextEventBaseline,
  trainCentroidLinearClassifier,
} from "../lib/nmnist.mjs";
import {
  buildEegEyeStateOpenFheInputContract,
  buildEegEyeStateSmokeFixtureRows,
  parseEegEyeStateArff,
  runEegEyeStatePlaintextBaseline,
} from "../lib/eeg-eye-state.mjs";
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

function eegEyeStateSmokeArff() {
  return [
    "@relation eeg-eye-state-smoke",
    "@attribute AF3 numeric",
    "@attribute F7 numeric",
    "@attribute F3 numeric",
    "@attribute FC5 numeric",
    "@attribute T7 numeric",
    "@attribute P7 numeric",
    "@attribute O1 numeric",
    "@attribute O2 numeric",
    "@attribute P8 numeric",
    "@attribute T8 numeric",
    "@attribute FC6 numeric",
    "@attribute F4 numeric",
    "@attribute F8 numeric",
    "@attribute AF4 numeric",
    "@attribute eyeDetection {0,1}",
    "@data",
    "4100,4080,4090,4070,4105,4095,4088,4092,4100,4080,4090,4070,4105,4095,0",
    "4102,4082,4091,4071,4106,4094,4089,4091,4102,4082,4091,4071,4106,4094,0",
    "4200,4180,4195,4175,4210,4205,4190,4188,4200,4180,4195,4175,4210,4205,1",
    "4202,4181,4196,4177,4212,4206,4191,4189,4202,4181,4196,4177,4212,4206,1",
    "4101,4081,4092,4072,4104,4096,4087,4093,4101,4081,4092,4072,4104,4096,0",
    "4103,4081,4091,4071,4107,4095,4089,4092,4103,4081,4091,4071,4107,4095,0",
    "4201,4182,4197,4176,4211,4204,4192,4187,4201,4182,4197,4176,4211,4204,1",
    "4203,4183,4198,4178,4213,4207,4193,4190,4203,4183,4198,4178,4213,4207,1",
  ].join("\n");
}

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

test("encrypted classifier preview uses model class labels", () => {
  const eventWindow = buildSparseEventWindow();
  const featureCount = flattenEventWindow(eventWindow).length;
  const model = {
    ...buildDemoLinearModel({ featureCount, channels: eventWindow.channels }),
    classes: ["quiet", "alert"],
    weights: {
      quiet: Array(featureCount).fill(0),
      alert: Array(featureCount).fill(1),
    },
    bias: { quiet: 0, alert: 0 },
    matrixShape: [2, featureCount],
  };

  const encrypted = runEncryptedLinearClassifier(eventWindow, { model, seed: 91 });

  assert.deepEqual(Object.keys(encrypted.encryptedPreview.scoreCiphertexts), ["quiet", "alert"]);
  assert.equal(typeof encrypted.encryptedPreview.scoreCiphertexts.quiet, "string");
  assert.equal(typeof encrypted.encryptedPreview.scoreCiphertexts.alert, "string");
  assert.equal("normalScoreCiphertext" in encrypted.encryptedPreview, false);
  assert.equal("anomalyScoreCiphertext" in encrypted.encryptedPreview, false);
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

test("reconstruction-risk probes keep residual leakage explicit without privacy proof claims", () => {
  const report = evaluateRepresentationReconstructionRisk({
    generatedAt: "2026-05-27T16:00:00.000Z",
  });
  const artifact = buildReconstructionRiskArtifact(report, {
    generatedAt: "2026-05-27T16:00:00.000Z",
    artifactId: "reconstruction-risk-probes-2026-05-27",
  });

  assert.equal(report.schema, "neurofhe.reconstructionRiskProbes.v1");
  assert.equal(report.productionClaim, false);
  assert.equal(report.privacyProofClaim, false);
  assert.equal(report.attackProbes.length, 3);
  assert.deepEqual(
    report.attackProbes.map((probe) => probe.id),
    [
      "raw-payload-replay",
      "active-value-recovery",
      "public-position-linkage",
    ],
  );
  assert.equal(report.summary.rawPayloadReplay.status, "blocked");
  assert.equal(report.summary.activeValueRecovery.status, "blocked");
  assert.equal(report.summary.publicPositionLinkage.status, "residual-risk");
  assert.ok(
    report.summary.publicPositionLinkage.leakageSignals.includes(
      "public active neuron positions",
    ),
  );
  assert.equal(artifact.schema, "neurofhe.reconstructionRiskArtifact.v1");
  assert.equal(artifact.subjectSchema, report.schema);
  assert.equal(artifact.productionClaim, false);
  assert.equal(artifact.subject.privacyProofClaim, false);
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

test("benchmark artifact CLI honors deterministic artifact options", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-benchmark-cli-"));
  const result = spawnSync(
    process.execPath,
    [
      "prototype/benchmark.mjs",
      "--artifact",
      "--out",
      outputDir,
      "--artifact-id",
      "ci-synthetic-smoke",
      "--generated-at",
      "2026-05-21T00:00:00.000Z",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  const published = JSON.parse(result.stdout);
  const artifact = JSON.parse(await readFile(published.paths.run, "utf8"));

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(published.artifactId, "ci-synthetic-smoke");
  assert.equal(artifact.artifactId, "ci-synthetic-smoke");
  assert.equal(artifact.generatedAt, "2026-05-21T00:00:00.000Z");
});

test("repository hygiene scan redacts secrets and blocks raw dataset files", async () => {
  const root = await mkdtemp(join(tmpdir(), "neurofhe-hygiene-fixture-"));
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, "docs", "ok.md"), "clean evidence note\n", "utf8");
  await writeFile(join(root, "docs", "secret.txt"), `token=${"sk-" + "A".repeat(20)}\n`, "utf8");
  await writeFile(join(root, "events.arff"), "@RELATION eeg\n", "utf8");

  const result = scanRepositoryHygiene({ root });
  const artifact = buildRepositoryHygieneArtifact(result, {
    artifactId: "repo-hygiene-fixture",
    generatedAt: "2026-05-25T00:00:00.000Z",
  });

  assert.equal(result.result, "fail");
  assert.equal(result.findings.length, 2);
  assert.deepEqual(result.findings.map((finding) => finding.category).sort(), [
    "raw-dataset-path",
    "secret",
  ]);
  assert.equal(artifact.schema, "neurofhe.repositoryHygieneScan.v1");
  assert.equal(artifact.productionClaim, false);
  assert.equal(artifact.findings.find((finding) => finding.category === "secret").redacted, true);
  assert.equal("excerpt" in artifact.findings.find((finding) => finding.category === "secret"), false);
  assert.equal(artifact.rawDataPolicy.rule.includes("Keep raw public/private datasets outside git"), true);
});

test("repository hygiene artifact CLI honors deterministic artifact options", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-hygiene-cli-"));
  const result = spawnSync(
    process.execPath,
    [
      "prototype/scripts/placeholder-scan.mjs",
      "--artifact",
      "--out",
      outputDir,
      "--artifact-id",
      "repo-hygiene-smoke",
      "--generated-at",
      "2026-05-25T00:00:00.000Z",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  const published = JSON.parse(result.stdout);
  const artifact = JSON.parse(await readFile(published.paths.run, "utf8"));

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(published.schema, "neurofhe.repositoryHygieneScan.publish.v1");
  assert.equal(artifact.artifactId, "repo-hygiene-smoke");
  assert.equal(artifact.generatedAt, "2026-05-25T00:00:00.000Z");
  assert.equal(artifact.result, "pass");
  assert.equal(artifact.findingsCount, 0);
  assert.equal(artifact.privacyBoundary.secrets, "redacted from artifacts");
});

test("markdown link scan catches missing local documentation targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "neurofhe-doc-links-fixture-"));
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, "README.md"), [
    "# Fixture",
    "",
    "[ok](docs/ok.md#heading)",
    "[missing](docs/missing.md)",
    "[external](https://example.com)",
    "[anchor](#fixture)",
    "",
  ].join("\n"), "utf8");
  await writeFile(join(root, "docs", "ok.md"), "# Heading\n", "utf8");

  const result = scanMarkdownLinks({ root });

  assert.equal(result.result, "fail");
  assert.equal(result.scannedFileCount, 2);
  assert.deepEqual(result.findings, [
    {
      category: "broken-markdown-link",
      path: "README.md",
      line: 4,
      target: "docs/missing.md",
      resolvedPath: "docs/missing.md",
      message: "local Markdown link target does not exist",
    },
  ]);
});

test("markdown link check CLI exits nonzero for broken local docs links", async () => {
  const root = await mkdtemp(join(tmpdir(), "neurofhe-doc-links-cli-"));
  await writeFile(join(root, "README.md"), "[missing](docs/missing.md)\n", "utf8");

  const result = spawnSync(
    process.execPath,
    [
      "prototype/scripts/check-docs.mjs",
      "--root",
      root,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /README\.md:1:broken-markdown-link:docs\/missing\.md/);
  assert.equal(result.stderr, "");
});

test("command reference documents every package script", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const commandReference = readFileSync("docs/command-reference.md", "utf8");
  const requiredRoutes = [
    "## Command Routes",
    "| Job | Start With | Details |",
    "Validate a local change",
    "Try the demos",
    "Refresh release evidence",
    "Investigate native evidence",
    "Handle real-data or dataset work",
    "npm run ci",
    "npm run release:evidence",
    "npm run native:doctor",
  ];
  const missingScripts = Object.keys(packageJson.scripts).filter((scriptName) => {
    const expected = scriptName === "test"
      ? /\bnpm test\b/
      : new RegExp(`\\bnpm run ${escapeRegExp(scriptName)}\\b`);
    return !expected.test(commandReference);
  });
  const missingRoutes = requiredRoutes.filter((entry) =>
    !commandReference.includes(entry),
  );

  assert.deepEqual(missingScripts, []);
  assert.deepEqual(missingRoutes, []);
});

test("documentation index lists every docs page", () => {
  const docsIndex = readFileSync("docs/README.md", "utf8");
  const docsPages = readdirSync("docs")
    .filter((entry) => entry.endsWith(".md") && entry !== "README.md")
    .sort();
  const missingPages = docsPages.filter((page) =>
    !new RegExp(`\\b${escapeRegExp(page)}\\b`).test(docsIndex),
  );

  assert.deepEqual(missingPages, []);
});

test("documentation index stays concise and reader-facing", () => {
  const docsIndex = readFileSync("docs/README.md", "utf8");
  const requiredEntries = [
    "## Start Here",
    "| Need | Start With | Then Use |",
    "New reviewer",
    "Contributor",
    "Evidence reviewer",
    "Release or maintainer review",
    "## Validation Coverage",
    "npm run validate",
    "docs/testing-strategy.md",
    "docs/command-reference.md",
    "benchmark-artifacts/README.md",
    "production cryptography",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !docsIndex.includes(entry),
  );
  const validationLitanyMatches = docsIndex.match(/It also checks/g) ?? [];

  assert.deepEqual(missingEntries, []);
  assert.equal(validationLitanyMatches.length, 0);
});

test("briefing sequence guide lists every numbered root brief", () => {
  const briefingGuide = readFileSync("docs/briefing-sequence.md", "utf8");
  const numberedBriefs = readdirSync(".")
    .filter((entry) => /^[0-9]{2}-.+\.md$/.test(entry))
    .sort();
  const missingBriefs = numberedBriefs.filter((brief) =>
    !new RegExp(`\\b${escapeRegExp(brief)}\\b`).test(briefingGuide),
  );

  assert.deepEqual(missingBriefs, []);
});

test("prototype map lists every library module", () => {
  const prototypeMap = readFileSync("docs/prototype-map.md", "utf8");
  const libraryModules = readdirSync("prototype/lib")
    .filter((entry) => entry.endsWith(".mjs"))
    .sort();
  const missingModules = libraryModules.filter((moduleName) =>
    !new RegExp(`\\bprototype/lib/${escapeRegExp(moduleName)}\\b`).test(prototypeMap),
  );

  assert.deepEqual(missingModules, []);
});

test("prototype map lists every top-level prototype entrypoint and note", () => {
  const prototypeMap = readFileSync("docs/prototype-map.md", "utf8");
  const topLevelFiles = readdirSync("prototype")
    .filter((entry) => /\.(mjs|md)$/.test(entry))
    .map((entry) => `prototype/${entry}`)
    .sort();
  const missingFiles = topLevelFiles.filter((filePath) =>
    !prototypeMap.includes(filePath),
  );

  assert.deepEqual(missingFiles, []);
});

test("prototype map lists every native lane source file", () => {
  const prototypeMap = readFileSync("docs/prototype-map.md", "utf8");
  const nativeFiles = listTrackedFiles("prototype")
    .filter((entry) =>
      entry === "prototype/openfhe_contract_loader.hpp"
      || entry.startsWith("prototype/openfhe/")
      || entry.startsWith("prototype/openfhe-ckks/")
      || entry.startsWith("prototype/tfhe-rs/"),
    )
    .sort();
  const missingFiles = nativeFiles.filter((filePath) =>
    !prototypeMap.includes(filePath),
  );

  assert.deepEqual(missingFiles, []);
});

test("patent package map lists every patent markdown and mermaid source", () => {
  const patentMap = readFileSync("docs/patent-package-map.md", "utf8");
  const patentSources = listFilesRecursive("patent")
    .filter((entry) => /\.(md|mmd)$/.test(entry))
    .sort();
  const missingSources = patentSources.filter((sourcePath) =>
    !new RegExp(`\\b${escapeRegExp(sourcePath)}\\b`).test(patentMap),
  );

  assert.deepEqual(missingSources, []);
});

test("package manifest lists every tracked top-level package entry", () => {
  const packageManifest = readFileSync("PACKAGE_MANIFEST.md", "utf8");
  const trackedTopLevelEntries = listTrackedTopLevelEntries();
  const missingEntries = trackedTopLevelEntries.filter((entry) =>
    !packageManifest.includes(entry),
  );

  assert.deepEqual(missingEntries, []);

  const requiredRouting = [
    "inventory, not a command reference",
    "## Inventory Review Routes",
    "| Review Need | Start With | Then Use |",
    "First-read orientation",
    "Current validation and release posture",
    "Evidence artifacts and caveats",
    "Contribution and maintenance routing",
    "Patent or briefing review",
    "docs/command-reference.md",
    "VALIDATION.md",
    "RELEASE.md",
    "docs/evidence-dashboard.md",
    "docs/release-gate-matrix.md",
    "benchmark-artifacts/README.md",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "privacyBoundary",
    "cryptoInventory",
    "benchmark-artifacts/native-evidence/latest.json",
    "openfhe-bfvrns-eeg-eye-state-2026-05-21",
    "openfhe-ckks-eeg-eye-state-2026-05-21",
    "tfhe-rs-memory-rss-2026-05-28",
    "native measurement gaps",
    "not production cryptography",
  ];
  const missingRouting = requiredRouting.filter((entry) =>
    !packageManifest.includes(entry),
  );
  const forbiddenCommandWall = [
    "first presentation-ready version",
    "Run the desk demo:",
    "Run the benchmark:",
    "Run the TFHE-rs comparison lane:",
    "Generate OpenFHE-ready EEG input contracts",
    "once OpenFHE is installed",
  ].filter((entry) => packageManifest.includes(entry));

  assert.deepEqual(missingRouting, []);
  assert.deepEqual(forbiddenCommandWall, []);
});

test("presentation outputs map lists every tracked generated output file", () => {
  const outputsMap = readFileSync("docs/presentation-outputs.md", "utf8");
  const outputFiles = listTrackedFiles("outputs")
    .filter((entry) => !entry.endsWith("/"))
    .sort();
  const missingOutputs = outputFiles.filter((outputPath) =>
    !outputsMap.includes(outputPath),
  );

  assert.deepEqual(missingOutputs, []);
});

test("benchmark artifacts README lists every tracked artifact directory", () => {
  const artifactsReadme = readFileSync("benchmark-artifacts/README.md", "utf8");
  const artifactDirectories = listTrackedDirectories("benchmark-artifacts")
    .filter((entry) => entry !== "benchmark-artifacts")
    .sort();
  const missingDirectories = artifactDirectories.filter((dirPath) =>
    !artifactsReadme.includes(`${dirPath}/`),
  );
  const requiredPosture = [
    "## Artifact Review Routes",
    "| Review Need | Start With | Do Not Claim |",
    "Release posture",
    "Native measurement coverage",
    "Real-data plaintext baselines",
    "Metadata and reconstruction caveats",
    "Hosted CI or repository hygiene",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "real N-MNIST plaintext baseline",
    "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json",
    "TFHE-rs real-data input blocker",
    "benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json",
    "release-evidence index artifacts",
    "dashboard artifacts only",
  ];
  const missingPosture = requiredPosture.filter((entry) =>
    !artifactsReadme.includes(entry),
  );
  const stalePosture = [
    "real N-MNIST dataset blocker",
    "N-MNIST-compatible fixture, real public UCI EEG Eye State baseline, and real public dataset blocker reports",
  ].filter((entry) => artifactsReadme.includes(entry));

  assert.deepEqual(missingDirectories, []);
  assert.deepEqual(missingPosture, []);
  assert.deepEqual(stalePosture, []);
});

test("contributor workflow map lists every tracked GitHub workflow surface", () => {
  const workflowMap = readFileSync("docs/contributor-workflow.md", "utf8");
  const githubFiles = listTrackedFiles(".github").sort();
  const requiredRoutes = [
    "## Contribution Routes",
    "| Need | Use | Keep Visible |",
    "Report a reproducible failure",
    "Report an evidence gap",
    "Request repository cleanup",
    "Open or update a pull request",
    "Report sensitive security or raw-data exposure",
  ];
  const missingFiles = githubFiles.filter((filePath) =>
    !workflowMap.includes(filePath),
  );
  const missingRoutes = requiredRoutes.filter((entry) =>
    !workflowMap.includes(entry),
  );

  assert.deepEqual(missingFiles, []);
  assert.deepEqual(missingRoutes, []);
});

test("CODEOWNERS maps repository review ownership", () => {
  const codeowners = readFileSync(".github/CODEOWNERS", "utf8");
  const requiredEntries = [
    "* @AlexanderDaly",
    "/.github/ @AlexanderDaly",
    "/docs/ @AlexanderDaly",
    "/prototype/ @AlexanderDaly",
    "/benchmark-artifacts/ @AlexanderDaly",
    "/patent/ @AlexanderDaly",
    "productionClaim: false",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !codeowners.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("maintainers file defines release authority and evidence boundaries", () => {
  const maintainers = readFileSync("MAINTAINERS.md", "utf8");
  const requiredEntries = [
    "## Maintainer Routes",
    "| Decision Or Review Need | Start With | Boundary |",
    "Ordinary code or documentation review",
    "Evidence artifact or benchmark review",
    "Hosted CI or repository-policy blocker review",
    "Release merge or tag decision",
    "Sensitive security, raw-data, or conduct concern",
    "@AlexanderDaly",
    ".github/CODEOWNERS",
    "docs/maintainer-checklist.md",
    "docs/operations-runbook.md",
    "RELEASE.md",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "repository ruleset/admin policy",
    "explicit user approval",
    "no release tag",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !maintainers.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("maintainer checklist routes review through current policy surfaces", () => {
  const checklist = readFileSync("docs/maintainer-checklist.md", "utf8");
  const requiredEntries = [
    "## Review Modes",
    "| Review Mode | Start With | Do Not Proceed Until |",
    "Ordinary PR review",
    "Evidence artifact update",
    "Release review",
    "Sensitive or raw-data-adjacent report",
    "docs/evidence-dashboard.md",
    "docs/faq.md",
    "SECURITY.md",
    "SUPPORT.md",
    "CONTRIBUTING.md",
    "docs/contributor-workflow.md",
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/",
    "repository ruleset/admin policy",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "privacyBoundary",
    "cryptoInventory",
    "exact command",
    "smallest next",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !checklist.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("Dependabot config covers package and workflow maintenance", () => {
  const dependabot = readFileSync(".github/dependabot.yml", "utf8");
  const requiredEntries = [
    "version: 2",
    "package-ecosystem: \"github-actions\"",
    "package-ecosystem: \"npm\"",
    "directory: \"/\"",
    "interval: \"weekly\"",
    "open-pull-requests-limit: 5",
    "labels:",
    "\"enhancement\"",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !dependabot.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("pull request template preserves validation and release caveats", () => {
  const pullRequestTemplate = readFileSync(".github/pull_request_template.md", "utf8");
  const requiredEntries = [
    "npm run ci",
    "git diff --check",
    "Relevant artifact command",
    "privacyBoundary",
    "cryptoInventory",
    "productionClaim: false",
    "releaseGateSatisfied: false",
    "repository ruleset/admin policy",
    "raw datasets",
    "secrets",
    "docs/release-gate-matrix.md",
    "docs/evidence-dashboard.md",
    "Blockers And Caveats",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !pullRequestTemplate.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("issue templates preserve evidence boundaries and release routing", () => {
  const bugReport = readFileSync(".github/ISSUE_TEMPLATE/bug-report.yml", "utf8");
  const validationGap = readFileSync(".github/ISSUE_TEMPLATE/validation-gap.yml", "utf8");
  const cleanupRequest = readFileSync(".github/ISSUE_TEMPLATE/repository-cleanup.yml", "utf8");
  const issueConfig = readFileSync(".github/ISSUE_TEMPLATE/config.yml", "utf8");
  const combined = [bugReport, validationGap, cleanupRequest, issueConfig].join("\n");
  const requiredEntries = [
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "privacyBoundary",
    "cryptoInventory",
    "repository ruleset/admin policy",
    "docs/evidence-dashboard.md",
    "docs/release-gate-matrix.md",
    "raw datasets",
    "secrets",
    "exact command",
    "smallest next step",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !combined.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("policy boundary map lists every policy and claim-boundary root file", () => {
  const policyMap = readFileSync("docs/policy-boundary.md", "utf8");
  const policyFiles = [
    "## Boundary Routes",
    "| Boundary Change | Start With | Must Preserve |",
    "License or public-domain framing",
    "Public claim or README framing",
    "Contribution, support, or conduct routing",
    "Security, raw-data, or private-payload reporting",
    "Release, validation, or hosted-CI posture",
    "CODE_OF_CONDUCT.md",
    "CONTRIBUTING.md",
    "DEVELOPMENT.md",
    "LICENSE",
    "MAINTAINERS.md",
    "PUBLIC_DOMAIN_NOTICE.md",
    "README.md",
    "RELEASE.md",
    "SECURITY.md",
    "SUPPORT.md",
    "VALIDATION.md",
  ];
  const missingFiles = policyFiles.filter((filePath) =>
    !policyMap.includes(filePath),
  );

  assert.deepEqual(missingFiles, []);
});

test("code of conduct sets public collaboration boundaries without upgrading claims", () => {
  const conduct = readFileSync("CODE_OF_CONDUCT.md", "utf8");
  const requiredEntries = [
    "## Conduct Report Routes",
    "| Situation | Start With | Keep Out Of Public Threads |",
    "General collaboration or tone concern",
    "Sensitive conduct or safety concern",
    "Security, raw-data, or private-payload concern",
    "Evidence, release, or claim-boundary concern",
    "CC0",
    "research-alpha",
    "SECURITY.md",
    "SUPPORT.md",
    "CONTRIBUTING.md",
    "raw datasets",
    "private payloads",
    "productionClaim: false",
    "releaseGateSatisfied: false",
    "not production cryptography",
    "not medical",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !conduct.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("support policy routes issues without weakening evidence boundaries", () => {
  const supportPolicy = readFileSync("SUPPORT.md", "utf8");
  const requiredEntries = [
    "## Report Routing",
    "| Situation | Public Route | Private Or Special Route |",
    "Reproducible command, CI, script, or artifact failure",
    "Sensitive security issue, suspected secret exposure, or private data leak",
    "Release readiness, hosted-check, or repository ruleset blocker",
    "Documentation, packaging, navigation, or repository cleanup",
    "GitHub issue forms",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "docs/contributor-workflow.md",
    "docs/operations-runbook.md",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "raw datasets",
    "private payloads",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !supportPolicy.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("security policy preserves research-alpha reporting boundaries", () => {
  const securityPolicy = readFileSync("SECURITY.md", "utf8");
  const requiredEntries = [
    "## Security Report Routes",
    "| Report Type | Route | Keep Out Of Public Threads |",
    "Raw data, secret, or private payload exposure",
    "Claim-boundary or cryptography-posture issue",
    "Unsafe CLI or malformed input behavior",
    "Release posture or evidence-gate concern",
    "GitHub private vulnerability reporting",
    "raw signal",
    "raw dataset",
    "secrets",
    "private payload",
    "privacyBoundary",
    "cryptoInventory",
    "productionClaim: false",
    "releaseGateSatisfied: false",
    "repository hygiene scan",
    "not a security audit",
    "exact command",
    "smallest next step",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !securityPolicy.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("contributing guide routes evidence and release-boundary work", () => {
  const contributing = readFileSync("CONTRIBUTING.md", "utf8");
  const requiredEntries = [
    "## Contribution Routes",
    "| Change Type | Start With | Keep Visible |",
    "Docs, packaging, or navigation cleanup",
    "Prototype or artifact behavior",
    "Native FHE lane work",
    "Real-data baseline or dataset-adjacent work",
    "Release-readiness or hosted-check work",
    "docs/developer-quickstart.md",
    "docs/command-reference.md",
    "docs/data-handling.md",
    "docs/evidence-dashboard.md",
    "docs/release-gate-matrix.md",
    "docs/troubleshooting.md",
    "releaseGateSatisfied: false",
    "repository ruleset/admin policy",
    "privacyBoundary",
    "cryptoInventory",
    "productionClaim: false",
    "exact command",
    "smallest next step",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !contributing.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("status roadmap lists every release-readiness evidence surface", () => {
  const statusRoadmap = readFileSync("docs/status-roadmap.md", "utf8");
  const releaseReadinessSurfaces = [
    "| Question | Current Answer | Authoritative Source |",
    "Is hosted portable CI green?",
    "Yes on PR #23",
    "Is the release gate satisfied?",
    "No; `releaseGateSatisfied: false`",
    "What blocks merge?",
    "Repository ruleset/admin policy",
    "RELEASE.md",
    "VALIDATION.md",
    "benchmark-artifacts/ci-blockers/latest.json",
    "benchmark-artifacts/native-evidence/latest.json",
    "benchmark-artifacts/release-evidence/latest.json",
    "benchmark-artifacts/repo-hygiene/latest.json",
    "patent/briefing/ENER_weak_claims_evidence_gaps.md",
  ];
  const missingSurfaces = releaseReadinessSurfaces.filter((filePath) =>
    !statusRoadmap.includes(filePath),
  );

  assert.deepEqual(missingSurfaces, []);
});

test("glossary defines recurring repository terms", () => {
  const glossary = readFileSync("docs/glossary.md", "utf8");
  const requiredTerms = [
    "bio-digital event intelligence",
    "privacyBoundary",
    "cryptoInventory",
    "productionClaim: false",
    "release gate",
    "release-evidence index",
    "native lane",
    "blocker artifact",
    "plaintext baseline",
    "metadata-leakage proxy",
    "reconstruction-risk probe",
  ];
  const missingTerms = requiredTerms.filter((term) =>
    !glossary.includes(term),
  );

  assert.deepEqual(missingTerms, []);
});

test("testing strategy maps every portable validation surface", () => {
  const testingStrategy = readFileSync("docs/testing-strategy.md", "utf8");
  const validationSurfaces = [
    "## Validation Routes",
    "| Concern | Run Or Inspect | Does Not Prove |",
    "Local portable gate",
    "Hosted PR check-rollup",
    "Documentation navigation drift",
    "Source hygiene and raw-data mistakes",
    "Native or release evidence readiness",
    "package.json",
    ".github/workflows/ci.yml",
    "prototype/test/prototype.test.mjs",
    "prototype/scripts/check-docs.mjs",
    "prototype/scripts/placeholder-scan.mjs",
    "VALIDATION.md",
  ];
  const missingSurfaces = validationSurfaces.filter((filePath) =>
    !testingStrategy.includes(filePath),
  );

  assert.deepEqual(missingSurfaces, []);
});

test("validation history distinguishes historical CI blockers from current PR state", () => {
  const validation = readFileSync("VALIDATION.md", "utf8");
  const requiredEntries = [
    "Historical PR #7 Runner-Startup Blocker",
    "historical PR #7",
    "PR #23",
    "hostedPortableCiSatisfied: true",
    "repository ruleset/admin policy, not a CI or check-rollup failure",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !validation.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(validation.includes("PR #7 is the current draft PR"), false);
});

test("troubleshooting guide routes common repo blockers without weakening caveats", () => {
  const troubleshooting = readFileSync("docs/troubleshooting.md", "utf8");
  const requiredEntries = [
    "PATH=\"/opt/homebrew/bin:$PATH\" npm run ci",
    "Node.js 22",
    "gh pr checks",
    "repository ruleset/admin policy",
    "OpenFHEConfig.cmake not found",
    "Train/",
    "Test/",
    "raw datasets must remain outside git",
    "exact command, error, and smallest next step",
    "productionClaim: false",
    "releaseGateSatisfied: false",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !troubleshooting.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("dependency matrix lists portable and native setup surfaces", () => {
  const dependencyMatrix = readFileSync("docs/dependency-matrix.md", "utf8");
  const requiredSurfaces = [
    "## Dependency Routes",
    "| Need | Start With | Do Not Treat As |",
    "Portable local validation",
    "Hosted CI check-rollup",
    "Native OpenFHE or TFHE-rs reproduction",
    "Public dataset or real-data baseline refresh",
    "Release dependency review",
    ".node-version",
    ".nvmrc",
    "package.json",
    ".github/dependabot.yml",
    ".github/workflows/ci.yml",
    "prototype/openfhe/",
    "prototype/openfhe-ckks/",
    "prototype/tfhe-rs/",
    "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json",
    "benchmark-artifacts/native-evidence/latest.json",
  ];
  const missingSurfaces = requiredSurfaces.filter((filePath) =>
    !dependencyMatrix.includes(filePath),
  );

  assert.deepEqual(missingSurfaces, []);
});

test("data handling guide lists dataset and artifact boundary surfaces", () => {
  const dataGuide = readFileSync("docs/data-handling.md", "utf8");
  const requiredSurfaces = [
    "## Data Routes",
    "| Data-Adjacent Need | Start With | Keep Out Of Git |",
    "Raw dataset, signal, partner, or private payload",
    "Derived plaintext baseline artifact",
    "Native input contract or comparison artifact",
    "Unavailable dataset, dependency, hosted CI, or release-machine input",
    "Repository hygiene evidence",
    ".gitattributes",
    ".gitignore",
    "prototype/scripts/placeholder-scan.mjs",
    "benchmark-artifacts/repo-hygiene/latest.json",
    "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json",
    "benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json",
    "benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/",
    "privacyBoundary",
    "productionClaim: false",
  ];
  const missingSurfaces = requiredSurfaces.filter((filePath) =>
    !dataGuide.includes(filePath),
  );

  assert.deepEqual(missingSurfaces, []);
});

test("repository tooling preserves normalization and ignore boundaries", () => {
  const gitattributes = readFileSync(".gitattributes", "utf8");
  const gitignore = readFileSync(".gitignore", "utf8");
  const editorconfig = readFileSync(".editorconfig", "utf8");
  const requiredEntries = [
    "* text=auto eol=lf",
    "*.md text eol=lf",
    "*.mjs text eol=lf",
    "*.json text eol=lf",
    "*.yml text eol=lf",
    "*.pdf binary",
    "*.docx binary",
    ".env",
    ".env.*",
    "*.log",
    "coverage/",
    ".nyc_output/",
    "node_modules/",
    "Downloads/",
    "N-MNIST/",
    "prototype/tfhe-rs/target/",
    "end_of_line = lf",
    "insert_final_newline = true",
  ];
  const combined = [gitattributes, gitignore, editorconfig].join("\n");
  const missingEntries = requiredEntries.filter((entry) =>
    !combined.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("claim evidence ledger maps every weak-claim area to evidence and caveats", () => {
  const weakClaims = readFileSync(
    "patent/briefing/ENER_weak_claims_evidence_gaps.md",
    "utf8",
  );
  const claimLedger = readFileSync("docs/claim-evidence-ledger.md", "utf8");
  const weakClaimAreas = weakClaims
    .split("\n")
    .filter((line) => line.startsWith("| ") && !line.includes("---"))
    .map((line) => line.split("|")[1].trim())
    .filter((area) => area !== "Area");
  const requiredSurfaces = [
    ...weakClaimAreas,
    "benchmark-artifacts/release-evidence/latest.json",
    "benchmark-artifacts/native-evidence/latest.json",
    "benchmark-artifacts/privacy-modes/padding-ablation/latest.json",
    "benchmark-artifacts/reconstruction-risk/latest.json",
    "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json",
    "benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "privacyProofClaim: false",
  ];
  const missingSurfaces = requiredSurfaces.filter((item) =>
    !claimLedger.includes(item),
  );

  assert.deepEqual(missingSurfaces, []);
});

test("ENER weak-claims note reflects current native FHE evidence posture", () => {
  const weakClaims = readFileSync(
    "patent/briefing/ENER_weak_claims_evidence_gaps.md",
    "utf8",
  );
  const requiredEntries = [
    "benchmark-artifacts/native-evidence/latest.json",
    "openfhe-bfvrns-eeg-eye-state-2026-05-21",
    "openfhe-ckks-eeg-eye-state-2026-05-21",
    "tfhe-rs-memory-rss-2026-05-28",
    "dependencyDetection.available: true",
    "real-native-run",
    "native measurement coverage",
    "measurement gap index",
    "ciphertext byte measurements",
    "RSS or peak-memory measurements",
    "releaseGateSatisfied: false",
    "productionClaim: false",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !weakClaims.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(weakClaims.includes("Current local blocker"), false);
  assert.equal(weakClaims.includes("OpenFHEConfig.cmake not found"), false);
  assert.equal(weakClaims.includes("TFHE-rs remains the currently runnable real-library lane"), false);
  assert.equal(weakClaims.includes("once OpenFHE is installed"), false);
});

test("evidence guide routes evidence review without upgrading claims", () => {
  const evidenceGuide = readFileSync("docs/evidence-guide.md", "utf8");
  const requiredEntries = [
    "## Review Routes",
    "| Need | Start With | Then Use |",
    "Artifact mechanics",
    "Claim discipline",
    "Release posture",
    "Repository decisions",
    "benchmark-artifacts/README.md",
    "docs/data-handling.md",
    "docs/claim-evidence-ledger.md",
    "docs/release-gate-matrix.md",
    "docs/evidence-dashboard.md",
    "docs/operations-runbook.md",
    "production cryptography",
    "identity-protection",
    "stable-performance claims",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !evidenceGuide.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("evidence dashboard summarizes release gate status without upgrading claims", () => {
  const dashboard = readFileSync("docs/evidence-dashboard.md", "utf8");
  const requiredEntries = [
    "benchmark-artifacts/release-evidence/latest.json",
    "subject.releaseGateSatisfied: false",
    "subject.gateChecks",
    "subject.productionClaim: false",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "hostedPortableCi",
    "repositoryHygiene",
    "nativeMeasurementCoverage",
    "metadataLeakage",
    "reconstructionRisk",
    "realNmnistBaseline",
    "tfheRealDataPath",
    "repository ruleset/admin policy",
    "not benchmark evidence by itself",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !dashboard.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("FAQ answers common reader questions without upgrading claims", () => {
  const faq = readFileSync("docs/faq.md", "utf8");
  const requiredEntries = [
    "## Question Routes",
    "| Reader Question | Start With | Then Use |",
    "Production cryptography or deployment readiness",
    "Medical, diagnostic, or clinical status",
    "Evidence strength and real-data artifacts",
    "Raw data, private payloads, or dataset storage",
    "Green CI but blocked merge state",
    "productionClaim: false",
    "releaseGateSatisfied: false",
    "privacyBoundary",
    "cryptoInventory",
    "CC0",
    "not production cryptography",
    "not medical",
    "raw datasets",
    "toy additive",
    "real N-MNIST",
    "repository ruleset/admin policy",
    "RELEASE.md",
    "docs/evidence-dashboard.md",
    "docs/troubleshooting.md",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !faq.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("repository guide maps current reader, maintainer, and GitHub surfaces", () => {
  const guide = readFileSync("docs/repository-guide.md", "utf8");
  const requiredEntries = [
    "## Navigation By Task",
    "| Task | Start With | Then Use |",
    "Understand the project",
    "Run or debug validation",
    "Review evidence claims",
    "Prepare release review",
    "Contribute safely",
    "Detailed File Map",
    "docs/faq.md",
    "docs/evidence-dashboard.md",
    "docs/troubleshooting.md",
    "CODE_OF_CONDUCT.md",
    "MAINTAINERS.md",
    ".github/CODEOWNERS",
    ".github/dependabot.yml",
    ".github/ISSUE_TEMPLATE/",
    ".github/pull_request_template.md",
    ".github/workflows/ci.yml",
    "productionClaim: false",
    "releaseGateSatisfied: false",
    "repository ruleset/admin policy",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !guide.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("release gate matrix lists every minimum evidence command", () => {
  const releasePlan = readFileSync("RELEASE.md", "utf8");
  const releaseMatrix = readFileSync("docs/release-gate-matrix.md", "utf8");
  const releaseCommands = releasePlan
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("npm run "));
  const requiredSurfaces = [
    ...releaseCommands,
    "benchmark-artifacts/release-evidence/latest.json",
    "benchmark-artifacts/repo-hygiene/latest.json",
    "benchmark-artifacts/native-evidence/latest.json",
    "benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json",
    "benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/",
    "benchmark-artifacts/privacy-modes/padding-ablation/latest.json",
    "benchmark-artifacts/reconstruction-risk/latest.json",
    "benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "repository ruleset/admin policy",
  ];
  const missingSurfaces = requiredSurfaces.filter((item) =>
    !releaseMatrix.includes(item),
  );

  assert.deepEqual(missingSurfaces, []);
});

test("release plan states no-tag gate and approval boundaries", () => {
  const releasePlan = readFileSync("RELEASE.md", "utf8");
  const requiredEntries = [
    "v0.1.0-research-alpha",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "repository ruleset/admin policy",
    "explicit user approval",
    "docs/release-gate-matrix.md",
    "docs/evidence-dashboard.md",
    "benchmark-artifacts/release-evidence/latest.json",
    "not release approval",
    "not production cryptography",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !releasePlan.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(releasePlan.includes("Yes:"), false);
});

test("changelog records unreleased cleanup stack and release caveats", () => {
  const changelog = readFileSync("CHANGELOG.md", "utf8");
  const requiredEntries = [
    "## Unreleased",
    "v0.1.0-research-alpha",
    "PR #23",
    "Portable validation",
    "repository ruleset/admin policy",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "docs/release-gate-matrix.md",
    "docs/claim-evidence-ledger.md",
    "docs/data-handling.md",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !changelog.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("reviewer quickstart maps due diligence entrypoints and caveats", () => {
  const reviewerGuide = readFileSync("docs/reviewer-quickstart.md", "utf8");
  const requiredEntries = [
    "README.md",
    "CHANGELOG.md",
    "VALIDATION.md",
    "RELEASE.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "SUPPORT.md",
    "docs/status-roadmap.md",
    "docs/faq.md",
    "docs/release-gate-matrix.md",
    "docs/claim-evidence-ledger.md",
    "docs/maintainer-checklist.md",
    "docs/operations-runbook.md",
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/",
    "benchmark-artifacts/release-evidence/latest.json",
    "benchmark-artifacts/native-evidence/latest.json",
    "npm run validate",
    "privacyBoundary",
    "cryptoInventory",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "exact command",
    "smallest next step",
    "repository ruleset/admin policy",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !reviewerGuide.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("architecture decision log records repository boundary decisions", () => {
  const decisionLog = readFileSync("docs/architecture-decisions.md", "utf8");
  const requiredEntries = [
    "## Decision Routes",
    "| Decision Area | Start With | Do Not Change Without |",
    "License and public-domain posture",
    "Claim, release, or production boundary",
    "Privacy, crypto inventory, or artifact metadata",
    "Toy prototype versus native FHE lane",
    "Raw-data and repository hygiene boundary",
    "Hosted CI versus repository-policy boundary",
    "CC0",
    "research-alpha",
    "productionClaim: false",
    "privacyBoundary",
    "cryptoInventory",
    "bio-digital event intelligence",
    "toy additive",
    "native OpenFHE",
    "TFHE-rs",
    "raw data stays outside git",
    "repository ruleset/admin policy",
    "releaseGateSatisfied: false",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !decisionLog.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("operations runbook maps maintainer commands and blocker policy", () => {
  const runbook = readFileSync("docs/operations-runbook.md", "utf8");
  const requiredEntries = [
    "## Situation Routes",
    "| Situation | First Action | Record Or Escalate In |",
    "PR checks need review",
    "Hosted CI is green but merge is blocked",
    "Evidence artifacts need refresh",
    "Command, dependency, dataset, or hosted check cannot run",
    "npm run validate",
    "git diff --check",
    "Portable validation",
    "benchmark-artifacts/ci-blockers/latest.json",
    "npm run native:doctor -- --artifact",
    "npm run release:evidence -- --artifact",
    "npm run scan:hygiene -- --artifact",
    "exact command, error, and smallest next step",
    "repository ruleset/admin policy",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "RELEASE.md",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !runbook.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("root README keeps first-read navigation role based", () => {
  const readme = readFileSync("README.md", "utf8");
  const requiredEntries = [
    "## First Paths",
    "New reviewer",
    "Contributor",
    "Maintainer",
    "Evidence reviewer",
    "docs/reviewer-quickstart.md",
    "docs/developer-quickstart.md",
    "docs/operations-runbook.md",
    "docs/evidence-guide.md",
    "productionClaim: false",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !readme.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(readme.includes("New readers should begin with"), false);
});

test("root README keeps repository layout concise", () => {
  const readme = readFileSync("README.md", "utf8");
  const requiredEntries = [
    "## Repository Layout",
    "PACKAGE_MANIFEST.md",
    "docs/",
    "prototype/",
    "benchmark-artifacts/",
    "patent/",
    ".github/",
    "Root policy files",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !readme.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(readme.includes("## Package Contents"), false);
});

test("root README keeps command surface concise", () => {
  const readme = readFileSync("README.md", "utf8");
  const requiredEntries = [
    "## Quick Commands",
    "npm run ci",
    "git diff --check",
    "npm run demo",
    "npm run gateway:demo",
    "npm run benchmark:artifact",
    "npm run release:evidence -- --artifact",
    "docs/command-reference.md",
    "RELEASE.md",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !readme.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(readme.includes("## Desk Demo"), false);
  assert.equal(readme.includes("Run the real OpenFHE BFVrns C++ demo"), false);
});

test("prototype README stays a concise entrypoint instead of a command wall", () => {
  const prototypeReadme = readFileSync("prototype/README.md", "utf8");
  const requiredEntries = [
    "## First Commands",
    "## Evidence Boundaries",
    "../docs/prototype-map.md",
    "../docs/command-reference.md",
    "../docs/troubleshooting.md",
    "../benchmark-artifacts/README.md",
    "npm run demo",
    "npm run gateway:demo",
    "npm run benchmark:artifact",
    "npm run validate",
    "toy additive",
    "productionClaim: false",
    "releaseGateSatisfied: false",
    "privacyBoundary",
    "cryptoInventory",
    "native OpenFHE",
    "TFHE-rs",
    "raw datasets",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !prototypeReadme.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(prototypeReadme.includes("Current modules:"), false);
  assert.equal(prototypeReadme.includes("Print the real OpenFHE BFVrns integration plan"), false);
});

test("plaintext baseline note routes real-data evidence and caveats", () => {
  const baselineNote = readFileSync("prototype/PLAINTEXT_BASELINE.md", "utf8");
  const requiredEntries = [
    "docs/command-reference.md",
    "docs/data-handling.md",
    "docs/evidence-dashboard.md",
    "docs/release-gate-matrix.md",
    "benchmark-artifacts/README.md",
    "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json",
    "benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "privacyBoundary",
    "cryptoInventory",
    "raw public datasets stay outside git",
    "not encrypted-compute evidence",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !baselineNote.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(baselineNote.includes("first real-event-data lane"), false);
});

test("TFHE-rs integration note routes native evidence and blockers", () => {
  const tfheNote = readFileSync("prototype/TFHE_RS_INTEGRATION.md", "utf8");
  const requiredEntries = [
    "docs/command-reference.md",
    "docs/dependency-matrix.md",
    "docs/evidence-dashboard.md",
    "docs/release-gate-matrix.md",
    "benchmark-artifacts/README.md",
    "benchmark-artifacts/comparisons/tfhe-rs/latest.json",
    "benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json",
    "benchmark-artifacts/native-evidence/latest.json",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "privacyBoundary",
    "cryptoInventory",
    "TFHE-rs real-data path remains blocked",
    "single local synthetic run",
    "not stable performance",
    "native measurement gaps",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !tfheNote.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
  assert.equal(tfheNote.includes("OpenFHE not installed on this machine"), false);
  assert.equal(tfheNote.includes("requires local OpenFHE run"), false);
  assert.equal(tfheNote.includes("Current Synthetic Result"), false);
});

test("development guide preserves setup, evidence, and release boundaries", () => {
  const development = readFileSync("DEVELOPMENT.md", "utf8");
  const requiredEntries = [
    "## Development Routes",
    "| Need | Start With | Keep In View |",
    "First local validation",
    "Docs or navigation change",
    "Native FHE lane work",
    "Real-data or artifact work",
    "Release-readiness review",
    "docs/developer-quickstart.md",
    "docs/command-reference.md",
    "docs/troubleshooting.md",
    "docs/release-gate-matrix.md",
    "docs/evidence-dashboard.md",
    "benchmark-artifacts/release-evidence/latest.json",
    "benchmark-artifacts/native-evidence/latest.json",
    "benchmark-artifacts/repo-hygiene/latest.json",
    "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json",
    "real public N-MNIST plaintext baseline",
    "repository ruleset/admin policy",
    "releaseGateSatisfied: false",
    "productionClaim: false",
    "privacyBoundary",
    "cryptoInventory",
    "raw datasets",
    "OpenFHE",
    "TFHE-rs",
    "exact command, error, and smallest next step",
    "structured blocker report",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !development.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("developer quickstart routes common change types to focused validation", () => {
  const quickstart = readFileSync("docs/developer-quickstart.md", "utf8");
  const requiredEntries = [
    "## Validation By Change Type",
    "| Change Type | Run First | Then Run |",
    "Docs-only navigation or wording",
    "npm run check:docs",
    "Prototype library or artifact behavior",
    "npm test -- --test-name-pattern",
    "GitHub Actions or repository policy",
    "gh pr checks",
    "Benchmark, dataset, native lane, or release evidence",
    "temporary directory",
    "npm run ci",
    "git diff --check",
  ];
  const missingEntries = requiredEntries.filter((entry) =>
    !quickstart.includes(entry),
  );

  assert.deepEqual(missingEntries, []);
});

test("GitHub Actions CI workflow runs automatically for pushes and pull requests", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

  assert.match(workflow, /^\s*workflow_dispatch:\s*$/m);
  assert.match(workflow, /^\s*push:\s*$/m);
  assert.match(workflow, /^\s*pull_request:\s*$/m);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function listFilesRecursive(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return listFilesRecursive(path);
    if (!entry.isFile()) return [];
    return [path];
  });
}

function listTrackedTopLevelEntries() {
  const trackedFiles = listTrackedFiles();
  const topLevel = new Map();
  for (const filePath of trackedFiles) {
    const [entry, ...rest] = filePath.split("/");
    topLevel.set(entry, rest.length > 0 ? `${entry}/` : entry);
  }

  return [...topLevel.values()].sort();
}

function listTrackedFiles(prefix) {
  const result = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);

  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter((filePath) => !prefix || filePath === prefix || filePath.startsWith(`${prefix}/`));
}

function listTrackedDirectories(prefix) {
  const directories = new Set();
  for (const filePath of listTrackedFiles(prefix)) {
    const parts = filePath.split("/");
    for (let index = 1; index < parts.length; index += 1) {
      directories.add(parts.slice(0, index).join("/"));
    }
  }

  return [...directories].sort();
}

test("GitHub Actions CI workflow uses Node 24-ready action majors", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

  assert.match(workflow, /uses:\s*actions\/checkout@v6\b/);
  assert.match(workflow, /uses:\s*actions\/setup-node@v6\b/);
  assert.match(workflow, /uses:\s*actions\/upload-artifact@v7\b/);
});

test("release evidence index summarizes blocker, hygiene, native, and privacy evidence without satisfying the gate", () => {
  const artifacts = new Map([
    [
      "benchmark-artifacts/ci-blockers/latest.json",
      {
        schema: "neurofhe.ciBlocker.v1",
        artifactId: "ci-blocker-test",
        observedRepositoryState: {
          openPullRequests: [
            {
              number: 17,
              title: "Define discreet spike sorting proof gate",
              mergeStateStatus: "BLOCKED",
            },
            {
              number: 22,
              title: "Add real N-MNIST release evidence",
              mergeStateStatus: "CLEAN",
            },
          ],
        },
        workflowState: {
          currentTrigger: "workflow_dispatch",
          automaticPullRequestTriggersEnabled: false,
        },
        blocker: {
          isCodeFailure: false,
        },
        reason: "workflow remains manual-only",
        releaseGateSatisfied: false,
        smallestNextStep: "Run or manually dispatch portable CI on the release-validation PR.",
        productionClaim: false,
      },
    ],
    [
      "benchmark-artifacts/repo-hygiene/latest.json",
      {
        schema: "neurofhe.repositoryHygieneScan.v1",
        artifactId: "repo-hygiene-test",
        result: "pass",
        findingsCount: 0,
        productionClaim: false,
      },
    ],
    [
      "benchmark-artifacts/native-evidence/latest.json",
      {
        schema: "neurofhe.nativeEvidenceArtifact.v1",
        artifactId: "native-evidence-test",
        subjectSchema: "neurofhe.nativeEvidence.manifest.v1",
        productionClaim: false,
        subject: {
          summary: {
            laneCount: 3,
            realNativeRunCount: 3,
            measurementCoverage: {
              ciphertextBytesReportedCount: 1,
              ciphertextBytesPartialCount: 1,
              ciphertextBytesMissingCount: 1,
              rssOrPeakMemoryReportedCount: 0,
              rssOrPeakMemoryPartialCount: 1,
              rssOrPeakMemoryMissingCount: 2,
            },
            measurementGaps: {
              schema: "neurofhe.nativeEvidence.measurementGapIndex.v1",
              gapCount: 5,
              lanes: [
                {
                  laneId: "openfhe-bfvrns",
                  missingMeasurements: ["ciphertextBytes", "rssOrPeakMemory"],
                  partialMeasurements: [],
                },
              ],
            },
          },
          releaseUse: {
            releaseGateSatisfied: false,
            reason: "Native evidence is indexed but not sufficient by itself.",
          },
        },
      },
    ],
    [
      "benchmark-artifacts/privacy-modes/padding-ablation/latest.json",
      {
        schema: "neurofhe.privacyModeAblationArtifact.v1",
        artifactId: "privacy-test",
        subjectSchema: "neurofhe.metadataPaddingAblation.v1",
        productionClaim: false,
        subject: {
          metadataLeakageSummary: {
            metric: "documented-observable-category-count",
            highestExposureMode: "public-active-neuron-positions-encrypted-features",
            lowestExposureMode: "dense-encrypted-windows",
          },
          caveats: [
            "Taxonomy count only; not mutual information, anonymity, side-channel, or reconstruction-resistance proof.",
          ],
        },
      },
    ],
    [
      "benchmark-artifacts/reconstruction-risk/latest.json",
      {
        schema: "neurofhe.reconstructionRiskArtifact.v1",
        artifactId: "reconstruction-risk-test",
        subjectSchema: "neurofhe.reconstructionRiskProbes.v1",
        productionClaim: false,
        subject: {
          privacyProofClaim: false,
          summary: {
            rawPayloadReplay: { status: "blocked" },
            activeValueRecovery: { status: "blocked" },
            publicPositionLinkage: {
              status: "residual-risk",
              leakageSignals: ["public active neuron positions"],
            },
          },
        },
      },
    ],
    [
      "benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/latest.json",
      {
        schema: "neurofhe.plaintextBaselineArtifact.v1",
        artifactId: "nmnist-local-blocker-test",
        subjectSchema: "neurofhe.plaintextBaseline.unavailable.v1",
        evidenceClass: "real-public-dataset-blocker-report",
        productionClaim: false,
        subject: {
          schema: "neurofhe.plaintextBaseline.unavailable.v1",
          datasetKind: "public-nmnist-local-copy",
          isRealDataset: true,
          blocker: {
            reason: "N-MNIST Train directory is missing.",
            datasetRoot: "/tmp/N-MNIST",
          },
          attemptedCommand:
            "npm run baseline:plaintext -- --dataset /tmp/N-MNIST --limit-per-class 10 --grid-size 8 --time-bins 4 --window-us 105000",
          smallestNextStep:
            "Download and extract the public N-MNIST Train and Test directories outside git, then rerun the attempted command with --artifact.",
          productionClaim: false,
        },
      },
    ],
    [
      "benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json",
      {
        schema: "neurofhe.comparisonArtifact.v1",
        artifactId: "tfhe-realdata-blocker-test",
        subjectSchema: "neurofhe.tfheRs.realDataUnavailable.v1",
        productionClaim: false,
        subject: {
          schema: "neurofhe.tfheRs.realDataUnavailable.v1",
          inputContract: {
            datasetKind: "public-uci-eeg-eye-state-arff",
            scoreDomain: "approximate-real",
          },
          blocker: {
            category: "unsupported-real-data-input-contract",
            reason: "TFHE-rs real-data adapter is not implemented.",
          },
          smallestNextStep:
            "Add an integer/Boolean TFHE-rs adapter for EEG-derived sparse contracts.",
          productionClaim: false,
        },
      },
    ],
  ]);

  const index = buildReleaseEvidenceIndex({
    generatedAt: "2026-05-26T21:00:00.000Z",
    artifactReader: (path) => artifacts.get(path),
  });

  assert.equal(index.schema, "neurofhe.releaseEvidenceIndex.v1");
  assert.equal(index.releaseTarget, "v0.1.0-research-alpha");
  assert.equal(index.releaseGateSatisfied, false);
  assert.equal(index.productionClaim, false);
  assert.equal(index.gateChecks.hostedPortableCi.status, "blocked");
  assert.equal(index.gateChecks.hostedPortableCi.openPullRequestCount, 2);
  assert.equal(index.gateChecks.hostedPortableCi.workflowTrigger, "workflow_dispatch");
  assert.equal(index.gateChecks.hostedPortableCi.isCodeFailure, false);
  assert.equal(index.gateChecks.repositoryHygiene.status, "pass");
  assert.equal(index.gateChecks.nativeMeasurementCoverage.status, "incomplete");
  assert.equal(index.gateChecks.nativeMeasurementCoverage.measurementGapCount, 5);
  assert.equal(index.gateChecks.metadataLeakage.status, "caveated");
  assert.equal(index.gateChecks.reconstructionRisk.status, "caveated");
  assert.equal(index.gateChecks.realNmnistBaseline.status, "blocked");
  assert.equal(index.gateChecks.realNmnistBaseline.artifactId, "nmnist-local-blocker-test");
  assert.match(index.gateChecks.realNmnistBaseline.smallestNextStep, /Download and extract/);
  assert.equal(index.gateChecks.tfheRealDataPath.status, "blocked");
  assert.equal(index.gateChecks.tfheRealDataPath.artifactId, "tfhe-realdata-blocker-test");
  assert.deepEqual(
    index.sourceArtifacts.map((artifact) => artifact.path),
    [
      "benchmark-artifacts/ci-blockers/latest.json",
      "benchmark-artifacts/repo-hygiene/latest.json",
      "benchmark-artifacts/native-evidence/latest.json",
      "benchmark-artifacts/privacy-modes/padding-ablation/latest.json",
      "benchmark-artifacts/reconstruction-risk/latest.json",
      "benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/latest.json",
      "benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json",
    ],
  );
  assert.equal(index.sourceArtifacts.every((artifact) => artifact.productionClaim === false), true);
  assert.match(index.nextReleaseStep, /manually dispatch/);
});

test("release evidence index prefers real N-MNIST baseline over stale blocker", () => {
  const artifacts = new Map([
    [
      "benchmark-artifacts/ci-blockers/latest.json",
      {
        schema: "neurofhe.ciBlocker.v1",
        artifactId: "ci-blocker-test",
        reason: "workflow remains manual-only",
        releaseGateSatisfied: false,
        smallestNextStep: "Open a release-validation PR and obtain green hosted CI.",
        productionClaim: false,
      },
    ],
    [
      "benchmark-artifacts/repo-hygiene/latest.json",
      {
        schema: "neurofhe.repositoryHygieneScan.v1",
        artifactId: "repo-hygiene-test",
        result: "pass",
        findingsCount: 0,
        productionClaim: false,
      },
    ],
    [
      "benchmark-artifacts/native-evidence/latest.json",
      {
        schema: "neurofhe.nativeEvidenceArtifact.v1",
        artifactId: "native-evidence-test",
        subjectSchema: "neurofhe.nativeEvidence.manifest.v1",
        productionClaim: false,
        subject: {
          summary: {
            laneCount: 3,
            realNativeRunCount: 3,
            measurementCoverage: {
              ciphertextBytesReportedCount: 1,
              ciphertextBytesPartialCount: 1,
              ciphertextBytesMissingCount: 1,
              rssOrPeakMemoryReportedCount: 1,
              rssOrPeakMemoryPartialCount: 1,
              rssOrPeakMemoryMissingCount: 1,
            },
          },
        },
      },
    ],
    [
      "benchmark-artifacts/privacy-modes/padding-ablation/latest.json",
      {
        schema: "neurofhe.privacyModeAblationArtifact.v1",
        artifactId: "privacy-test",
        subjectSchema: "neurofhe.metadataPaddingAblation.v1",
        productionClaim: false,
        subject: {
          metadataLeakageSummary: {
            metric: "documented-observable-category-count",
            highestExposureMode: "public-active-neuron-positions-encrypted-features",
            lowestExposureMode: "dense-encrypted-windows",
          },
        },
      },
    ],
    [
      "benchmark-artifacts/reconstruction-risk/latest.json",
      {
        schema: "neurofhe.reconstructionRiskArtifact.v1",
        artifactId: "reconstruction-risk-test",
        subjectSchema: "neurofhe.reconstructionRiskProbes.v1",
        productionClaim: false,
        subject: {
          privacyProofClaim: false,
          summary: {
            rawPayloadReplay: { status: "blocked" },
            activeValueRecovery: { status: "blocked" },
            publicPositionLinkage: { status: "residual-risk" },
          },
        },
      },
    ],
    [
      "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json",
      {
        schema: "neurofhe.plaintextBaselineArtifact.v1",
        artifactId: "nmnist-real-test",
        subjectSchema: "neurofhe.plaintextBaseline.v1",
        evidenceClass: "real-public-dataset-plaintext-baseline",
        productionClaim: false,
        subject: {
          schema: "neurofhe.plaintextBaseline.v1",
          metrics: {
            accuracy: 0.66,
            total: 100,
          },
          source: {
            datasetKind: "public-nmnist-local-copy",
            isRealDataset: true,
            limitPerClass: 10,
          },
          productionClaim: false,
        },
      },
    ],
    [
      "benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/latest.json",
      {
        schema: "neurofhe.plaintextBaselineArtifact.v1",
        artifactId: "nmnist-local-blocker-test",
        subjectSchema: "neurofhe.plaintextBaseline.unavailable.v1",
        productionClaim: false,
        subject: {
          schema: "neurofhe.plaintextBaseline.unavailable.v1",
          datasetKind: "public-nmnist-local-copy",
          blocker: { reason: "stale blocker" },
          productionClaim: false,
        },
      },
    ],
    [
      "benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json",
      {
        schema: "neurofhe.comparisonArtifact.v1",
        artifactId: "tfhe-realdata-blocker-test",
        subjectSchema: "neurofhe.tfheRs.realDataUnavailable.v1",
        productionClaim: false,
        subject: {
          schema: "neurofhe.tfheRs.realDataUnavailable.v1",
          blocker: { reason: "TFHE-rs real-data adapter is not implemented." },
          productionClaim: false,
        },
      },
    ],
  ]);

  const index = buildReleaseEvidenceIndex({
    generatedAt: "2026-05-28T18:20:00.000Z",
    artifactReader: (path) => artifacts.get(path),
  });

  assert.equal(index.gateChecks.realNmnistBaseline.status, "pass");
  assert.equal(index.gateChecks.realNmnistBaseline.artifactId, "nmnist-real-test");
  assert.equal(index.gateChecks.realNmnistBaseline.accuracy, 0.66);
  assert.equal(index.gateChecks.realNmnistBaseline.sampleCount, 100);
  assert.equal(
    index.sourceArtifacts.some(
      (artifact) =>
        artifact.path ===
        "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json",
    ),
    true,
  );
});

test("release evidence index carries green hosted CI details when check rollup is fixed", () => {
  const artifacts = new Map([
    [
      "benchmark-artifacts/ci-blockers/latest.json",
      {
        schema: "neurofhe.hostedCiEvidence.v1",
        artifactId: "ci-green-test",
        hostedPortableCiSatisfied: true,
        releaseGateSatisfied: false,
        observedRepositoryState: {
          openPullRequests: [{ number: 23 }],
        },
        workflowState: {
          currentTrigger: "push,pull_request,workflow_dispatch",
        },
        blocker: {
          isCodeFailure: false,
          currentObservation: "PR #23 has successful hosted CI check runs.",
        },
        smallestNextStep:
          "Use the repository ruleset/admin merge path after review.",
        productionClaim: false,
      },
    ],
  ]);

  const index = buildReleaseEvidenceIndex({
    generatedAt: "2026-05-29T04:33:30.000Z",
    artifactReader: (path) => artifacts.get(path),
  });

  assert.equal(index.releaseGateSatisfied, false);
  assert.equal(index.gateChecks.hostedPortableCi.status, "pass");
  assert.equal(
    index.gateChecks.hostedPortableCi.reason,
    "PR #23 has successful hosted CI check runs.",
  );
  assert.equal(index.gateChecks.hostedPortableCi.openPullRequestCount, 1);
  assert.equal(
    index.gateChecks.hostedPortableCi.workflowTrigger,
    "push,pull_request,workflow_dispatch",
  );
  assert.equal(index.gateChecks.hostedPortableCi.isCodeFailure, false);
  assert.equal(
    index.gateChecks.hostedPortableCi.smallestNextStep,
    "Use the repository ruleset/admin merge path after review.",
  );
});

test("hosted CI evidence keeps the release gate false when check rollup is green", () => {
  const artifact = JSON.parse(
    readFileSync("benchmark-artifacts/ci-blockers/latest.json", "utf8"),
  );

  assert.equal(artifact.schema, "neurofhe.hostedCiEvidence.v1");
  assert.equal(artifact.hostedPortableCiSatisfied, true);
  assert.equal(artifact.releaseGateSatisfied, false);
  assert.equal(artifact.productionClaim, false);
  assert.equal(artifact.blocker?.category, "resolved-check-rollup");
  assert.match(artifact.smallestNextStep, /repository ruleset\/admin merge path/);
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

test("padding ablation quantifies leakage masking and operation overhead", () => {
  const ablation = buildPaddingOverheadAblation(buildSparseEventWindow(), 2, {
    paddedSlotCount: 32,
  });
  const [sparse, padded, dense] = ablation.modes;

  assert.equal(ablation.schema, "neurofhe.metadataPaddingAblation.v1");
  assert.equal(ablation.measurementBasis, "synthetic-events-v0 operation-count model");
  assert.equal(ablation.activeEventCount, 18);
  assert.equal(sparse.id, "public-active-neuron-positions-encrypted-features");
  assert.equal(sparse.encryptedFeatureSlots, 18);
  assert.equal(sparse.metadataLeakageMetrics.schema, "neurofhe.metadataLeakageProxy.v1");
  assert.equal(sparse.metadataLeakageMetrics.metric, "documented-observable-category-count");
  assert.equal(sparse.metadataLeakageMetrics.exposureScore, 6);
  assert.ok(
    sparse.metadataLeakageMetrics.observableCategories.includes("active-position-pattern"),
  );
  assert.equal(padded.id, "padded-sparse-batches");
  assert.equal(padded.encryptedFeatureSlots, 32);
  assert.equal(padded.dummySlotCount, 14);
  assert.equal(padded.relativeScalarMultiplies, 1.78);
  assert.equal(padded.payloadSlotIncrease, 1.78);
  assert.equal(padded.metadataLeakageMetrics.exposureScore, 4);
  assert.ok(padded.leakageMasked.includes("exact active event count"));
  assert.ok(padded.leakageRemaining.includes("padding bucket size"));
  assert.equal(dense.id, "dense-encrypted-windows");
  assert.equal(dense.relativeScalarMultiplies, 3.56);
  assert.equal(dense.metadataLeakageMetrics.exposureScore, 2);
  assert.deepEqual(ablation.metadataLeakageSummary, {
    metric: "documented-observable-category-count",
    highestExposureMode: "public-active-neuron-positions-encrypted-features",
    lowestExposureMode: "dense-encrypted-windows",
    caveat:
      "Taxonomy count only; not mutual information, anonymity, side-channel, or reconstruction-resistance proof.",
  });
  assert.equal(ablation.toyRuntimeCaveat.includes("not native FHE"), true);
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
  assert.equal(benchmark.nativeComparisonLanes.schema, "neurofhe.nativeLaneComparison.v1");
  assert.ok(
    benchmark.nativeComparisonLanes.lanes
      .map((lane) => lane.id)
      .includes("openfhe-ckks-approximate"),
  );
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

test("OpenFHE unavailable report records attempted commands and parameter evidence target", () => {
  const report = buildOpenFheUnavailableReport({
    detection: detectOpenFhe({ env: {}, roots: [] }),
  });

  assert.equal(report.schema, "neurofhe.openfhe.unavailable.v1");
  assert.equal(report.blocker.reason, "OpenFHEConfig.cmake not found");
  assert.deepEqual(report.attemptedCommands, [
    "cmake -S prototype/openfhe -B build/openfhe",
    "cmake --build build/openfhe",
    "build/openfhe/openfhe_linear_demo",
  ]);
  assert.equal(report.parameterEvidence.scheme, "BFVrns");
  assert.equal(report.parameterEvidence.securityLevelTarget, "HEStd_128_classic");
  assert.equal(report.parameterEvidence.toyPaillierIsSecurityEvidence, false);
  assert.ok(report.smallestNextStep.includes("Install OpenFHE"));
});

test("OpenFHE CKKS demo contract preserves approximate sparse linear scoring", () => {
  const contract = buildOpenFheCkksDemoContract();

  assert.equal(contract.schema, "neurofhe.openfheCkks.contract.v1");
  assert.equal(contract.scheme, "openfhe-ckks");
  assert.equal(contract.scoreEquation, "scores = W x + bias");
  assert.equal(contract.scoreDomain, "approximate-real");
  assert.equal(contract.boundaryDomain, "bio-digital-event-intelligence");
  assert.equal(contract.eventRepresentation, "spatial-sorted-events");
  assert.equal(contract.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.equal(contract.privacyMode.id, "public-active-neuron-positions-encrypted-features");
  assert.equal(contract.featureValueDomain, "approximate-real-neural-features");
  assert.deepEqual(contract.matrixShape, [2, 64]);
  assert.equal(contract.activeEventCount, 18);
  assert.equal("value" in contract.publicActiveNeuronPositions[0], false);
  assert.deepEqual(contract.expectedPlaintextScores, { normal: 9, anomaly: 51 });
  assert.equal(contract.expectedClassification, "anomaly");
  assert.equal(contract.approximationTolerance.maxAbsScoreError, 0.001);
  assert.equal(contract.ckksParameters.securityLevel, "HEStd_128_classic");
  assert.equal(contract.ckksParameters.scalingModSize, 50);
  assert.equal(contract.ckksParameters.firstModSize, 60);
  assert.equal(contract.ckksParameters.rescalingTechnique, "FLEXIBLEAUTO");
  assert.equal(contract.ckksParameters.defaultMode, "leveled-no-bootstrap");
  assert.equal(contract.ckksParameters.bootstrapping.supported, true);
  assert.equal(contract.operationCounts.encryptions, 20);
  assert.equal(contract.operationCounts.plaintextMultiplies, 36);
  assert.equal(contract.operationCounts.adds, 36);
  assert.equal(contract.operationCounts.decryptions, 2);
  assert.equal(contract.operationCounts.rescaleOrModReduceOps, 36);
  assert.equal(
    contract.cryptoInventory.encryptedComputation.includes(
      "openfhe-ckks-approximate-real-research-only",
    ),
    true,
  );
  assert.ok(contract.privacyBoundary.computeSees.includes("encrypted CKKS active feature values"));
  assert.deepEqual(validateOpenFheCkksContract(contract), []);
});

test("OpenFHE CKKS contract validation rejects malformed approximate inputs", () => {
  const contract = buildOpenFheCkksDemoContract();
  const malformed = {
    ...contract,
    scheme: "openfhe-bfvrns",
    scoreDomain: "non-negative-integers",
    activeEvents: [
      { index: 0, value: 1.25 },
      { index: 64, value: 0.5 },
      { index: 3, value: Number.NaN },
    ],
    weights: {
      normal: [1, Number.POSITIVE_INFINITY],
      anomaly: Array(64).fill(1),
    },
    bias: { normal: 0, anomaly: "bad" },
  };

  assert.deepEqual(validateOpenFheCkksContract(malformed), [
    "scheme must be openfhe-ckks",
    "scoreDomain must be approximate-real",
    "activeEvents[1].index 64 is outside feature count 64",
    "activeEvents[2].value must be a finite number",
    "publicActiveNeuronPositions length must match activeEvents length",
    "weights.normal length 2 does not match feature count 64",
    "weights.normal[1] must be a finite number",
    "bias.anomaly must be a finite number",
  ]);
});

test("OpenFHE CKKS real-library adapter is bound to the generated score contract", () => {
  const adapter = buildOpenFheCkksRealLibraryAdapter();

  assert.equal(adapter.schema, "neurofhe.realLibraryAdapter.v1");
  assert.equal(adapter.adapterId, "openfhe-ckks-sparse-approx-linear-v1");
  assert.equal(adapter.library.name, "OpenFHE");
  assert.equal(adapter.library.scheme, "CKKS");
  assert.equal(adapter.contract.schema, "neurofhe.openfheCkks.contract.v1");
  assert.equal(adapter.contract.scoreEquation, "scores = W x + bias");
  assert.equal(adapter.contract.scoreDomain, "approximate-real");
  assert.equal(adapter.contractDigest.algorithm, "sha256");
  assert.match(adapter.contractDigest.value, /^[0-9a-f]{64}$/);
  assert.deepEqual(adapter.contractValidation.errors, []);
  assert.equal(adapter.nativeTarget, "openfhe_ckks_linear_demo");
  assert.equal(adapter.privacyModeDecision.recommendedMode, "padded-sparse-batches");
  assert.equal(adapter.packedVectorPlanning.defaultLane, "bfv-bgv-packed-integer");
  assert.equal(adapter.ckksVsBfvTfheComparison.sameTask, true);
  assert.equal(
    adapter.ckksVsBfvTfheComparison.ckksBestFor.includes(
      "approximate neural or ML feature scoring",
    ),
    true,
  );
});

test("OpenFHE CKKS integration plan reports build commands and native source paths", () => {
  const plan = openFheCkksIntegrationPlan();

  assert.equal(plan.schema, "neurofhe.openfheCkks.integrationPlan.v1");
  assert.equal(plan.nativeTarget, "openfhe_ckks_linear_demo");
  assert.equal(plan.scheme, "openfhe-ckks");
  assert.equal(plan.adapter.schema, "neurofhe.realLibraryAdapter.v1");
  assert.ok(plan.sourcePath.endsWith("prototype/openfhe-ckks/openfhe_ckks_linear_demo.cpp"));
  assert.ok(plan.cmakePath.endsWith("prototype/openfhe-ckks/CMakeLists.txt"));
  assert.equal(plan.contract.eventRepresentation, "spatial-sorted-events");
  assert.equal(plan.contract.privacyMode.id, "public-active-neuron-positions-encrypted-features");
  assert.deepEqual(plan.commands, [
    "cmake -S prototype/openfhe-ckks -B build/openfhe-ckks",
    "cmake --build build/openfhe-ckks",
    "build/openfhe-ckks/openfhe_ckks_linear_demo",
    "node prototype/openfhe-ckks-benchmark.mjs --artifact",
  ]);
});

test("TFHE-rs demo contract preserves sparse integer scoring and encrypted threshold boundary", () => {
  const contract = buildTfheRsDemoContract();

  assert.equal(contract.schema, "neurofhe.tfheRs.contract.v1");
  assert.equal(contract.scheme, "tfhe-rs-integer-threshold");
  assert.equal(contract.scoreEquation, "scores = W x + bias");
  assert.equal(contract.boundaryDomain, "bio-digital-event-intelligence");
  assert.equal(contract.eventRepresentation, "spatial-sorted-events");
  assert.equal(contract.encoder.id, "canonical-spatial-aware-spike-sorter-v1");
  assert.equal(contract.privacyMode.id, "public-active-neuron-positions-encrypted-features");
  assert.deepEqual(contract.matrixShape, [2, 64]);
  assert.equal(contract.activeEventCount, 18);
  assert.equal(contract.publicActiveNeuronPositions.length, 18);
  assert.equal("value" in contract.publicActiveNeuronPositions[0], false);
  assert.deepEqual(contract.expectedPlaintextScores, { normal: 9, anomaly: 51 });
  assert.equal(contract.expectedClassification, "anomaly");
  assert.deepEqual(contract.booleanDecision, {
    schema: "neurofhe.tfheRs.booleanDecision.v1",
    gate: "anomaly_score_gt_normal_score",
    encryptedResultType: "FheBool",
    expectedPlaintext: true,
  });
  assert.equal(contract.operationCounts.encryptions, 20);
  assert.equal(contract.operationCounts.scalarMultiplies, 36);
  assert.equal(contract.operationCounts.adds, 36);
  assert.equal(contract.operationCounts.encryptedComparisons, 1);
  assert.equal(contract.cryptoInventory.encryptedComputation.includes("tfhe-rs-1.6.1-integer-boolean-research-only"), true);
  assert.ok(contract.privacyBoundary.computeSees.includes("encrypted TFHE-rs active spike values"));
  assert.ok(contract.privacyBoundary.computeSees.includes("encrypted TFHE-rs threshold decision bit"));
  assert.deepEqual(validateTfheRsContract(contract), []);
});

test("TFHE-rs real-library adapter is bound to the generated score contract", () => {
  const adapter = buildTfheRsRealLibraryAdapter();

  assert.equal(adapter.schema, "neurofhe.realLibraryAdapter.v1");
  assert.equal(adapter.adapterId, "tfhe-rs-sparse-integer-threshold-v1");
  assert.equal(adapter.library.name, "TFHE-rs");
  assert.equal(adapter.library.scheme, "TFHE integer + Boolean threshold");
  assert.equal(adapter.contract.schema, "neurofhe.tfheRs.contract.v1");
  assert.equal(adapter.contract.scoreEquation, "scores = W x + bias");
  assert.equal(adapter.contract.scoreDomain, "non-negative-integers");
  assert.equal(adapter.contractDigest.algorithm, "sha256");
  assert.match(adapter.contractDigest.value, /^[0-9a-f]{64}$/);
  assert.deepEqual(adapter.contractValidation.errors, []);
  assert.equal(adapter.nativeTarget, "neurofhe-tfhe-demo");
  assert.equal(adapter.privacyModeDecision.recommendedMode, "padded-sparse-batches");
  assert.equal(adapter.tfheVsOpenFheComparison.sameTask, true);
  assert.equal(adapter.tfheVsOpenFheComparison.tfheBestFor.includes("threshold gates"), true);
});

test("TFHE-rs integration plan reports cargo commands and native source paths", () => {
  const plan = tfheRsIntegrationPlan();

  assert.equal(plan.schema, "neurofhe.tfheRs.integrationPlan.v1");
  assert.equal(plan.nativeTarget, "neurofhe-tfhe-demo");
  assert.equal(plan.adapter.schema, "neurofhe.realLibraryAdapter.v1");
  assert.ok(plan.manifestPath.endsWith("prototype/tfhe-rs/Cargo.toml"));
  assert.ok(plan.sourcePath.endsWith("prototype/tfhe-rs/src/lib.rs"));
  assert.equal(plan.contract.eventRepresentation, "spatial-sorted-events");
  assert.equal(plan.contract.privacyMode.id, "public-active-neuron-positions-encrypted-features");
  assert.deepEqual(plan.commands, [
    "cargo test --manifest-path prototype/tfhe-rs/Cargo.toml",
    "cargo run --release --manifest-path prototype/tfhe-rs/Cargo.toml --bin neurofhe-tfhe-demo",
    "node prototype/tfhe-rs-benchmark.mjs --artifact",
  ]);
});

test("TFHE-rs real-data blocker records the unsupported input path without replacing synthetic run evidence", () => {
  const inputPath =
    "benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json";
  const blocker = buildTfheRsRealDataUnavailableReport({
    inputPath,
    inputContract: {
      schema: "neurofhe.openfhe.inputContract.v1",
      datasetKind: "public-uci-eeg-eye-state-arff",
      scoreDomain: "approximate-real",
      activeEventCount: 32,
      productionClaim: false,
    },
  });

  assert.equal(blocker.schema, "neurofhe.tfheRs.realDataUnavailable.v1");
  assert.equal(blocker.blocker.category, "unsupported-real-data-input-contract");
  assert.equal(blocker.inputContract.path, inputPath);
  assert.equal(blocker.inputContract.datasetKind, "public-uci-eeg-eye-state-arff");
  assert.equal(blocker.inputContract.scoreDomain, "approximate-real");
  assert.ok(blocker.attemptedCommand.includes("benchmark:tfhe -- --run --input"));
  assert.match(blocker.error, /does not yet accept EEG-derived OpenFHE input contracts/);
  assert.match(blocker.smallestNextStep, /integer\/Boolean TFHE-rs adapter/);
  assert.equal(blocker.productionClaim, false);
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

test("comparison artifacts can persist TFHE-rs adapter plans for later library runs", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-tfhe-comparison-"));
  const published = await publishComparisonArtifact({
    outputDir,
    subject: buildTfheRsRealLibraryAdapter(),
    artifactId: "tfhe-adapter-plan",
    generatedAt: "2026-05-21T00:00:00.000Z",
  });
  const runArtifact = JSON.parse(await readFile(published.paths.run, "utf8"));
  const latestArtifact = JSON.parse(await readFile(published.paths.latest, "utf8"));

  assert.equal(published.schema, "neurofhe.comparisonArtifact.publish.v1");
  assert.equal(runArtifact.schema, "neurofhe.comparisonArtifact.v1");
  assert.equal(runArtifact.artifactId, "tfhe-adapter-plan");
  assert.equal(runArtifact.subject.schema, "neurofhe.realLibraryAdapter.v1");
  assert.equal(runArtifact.subject.adapterId, "tfhe-rs-sparse-integer-threshold-v1");
  assert.equal(runArtifact.framingGuardrail.preferredFrame, "privacy-preserving event intelligence");
  assert.deepEqual(latestArtifact, runArtifact);
});

test("comparison artifacts can persist OpenFHE CKKS adapter plans for later library runs", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-ckks-comparison-"));
  const published = await publishComparisonArtifact({
    outputDir,
    subject: buildOpenFheCkksRealLibraryAdapter(),
    artifactId: "ckks-adapter-plan",
    generatedAt: "2026-05-21T00:00:00.000Z",
  });
  const runArtifact = JSON.parse(await readFile(published.paths.run, "utf8"));
  const latestArtifact = JSON.parse(await readFile(published.paths.latest, "utf8"));

  assert.equal(published.schema, "neurofhe.comparisonArtifact.publish.v1");
  assert.equal(runArtifact.schema, "neurofhe.comparisonArtifact.v1");
  assert.equal(runArtifact.artifactId, "ckks-adapter-plan");
  assert.equal(runArtifact.subject.schema, "neurofhe.realLibraryAdapter.v1");
  assert.equal(runArtifact.subject.adapterId, "openfhe-ckks-sparse-approx-linear-v1");
  assert.equal(runArtifact.framingGuardrail.preferredFrame, "privacy-preserving event intelligence");
  assert.deepEqual(latestArtifact, runArtifact);
});

test("native evidence manifest classifies real runs and dependency blockers", () => {
  const realOpenFheArtifact = {
    schema: "neurofhe.comparisonArtifact.v1",
    artifactId: "openfhe-bfvrns-eeg-eye-state-2026-05-21",
    generatedAt: "2026-05-21T18:22:00.000Z",
    subjectSchema: "neurofhe.openfhe.runComparison.v1",
    subject: {
      schema: "neurofhe.openfhe.runComparison.v1",
      inputContractPath: "benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json",
      nativeResult: {
        schema: "neurofhe.openfhe.result.v1",
        inputSource: "external-contract",
        datasetKind: "public-uci-eeg-eye-state-arff",
        activeEventCount: 32,
        productionClaim: false,
      },
      productionClaim: false,
    },
    productionClaim: false,
  };
  const blockerArtifact = {
    schema: "neurofhe.comparisonArtifact.v1",
    artifactId: "openfhe-ckks-blocker",
    generatedAt: "2026-05-21T00:00:00.000Z",
    subjectSchema: "neurofhe.openfheCkks.unavailable.v1",
    subject: {
      schema: "neurofhe.openfheCkks.unavailable.v1",
      blocker: { reason: "OpenFHEConfig.cmake not found" },
      nativeResult: {
        schema: "neurofhe.openfheCkks.result.v1",
        memoryUsage: {
          ciphertextCount: 34,
          serializedCiphertextBytes: null,
          measurement:
            "portable demo reports ciphertext count; enable OpenFHE serialization for exact byte sizes",
        },
      },
      productionClaim: false,
    },
    productionClaim: false,
  };
  const adapterArtifact = {
    schema: "neurofhe.comparisonArtifact.v1",
    artifactId: "tfhe-adapter-plan",
    generatedAt: "2026-05-21T00:00:00.000Z",
    subjectSchema: "neurofhe.realLibraryAdapter.v1",
    subject: {
      schema: "neurofhe.realLibraryAdapter.v1",
      adapterId: "tfhe-rs-sparse-integer-threshold-v1",
      nativeResult: {
        schema: "neurofhe.tfheRs.result.v1",
        ciphertextBytes: {
          activeValueCiphertexts: 2377818,
          classScoreCiphertexts: 264202,
          thresholdDecisionBit: 16593,
          total: 2658613,
        },
        productionClaim: false,
      },
      productionClaim: false,
    },
    productionClaim: false,
  };

  assert.equal(classifyNativeEvidenceArtifact(realOpenFheArtifact).status, "real-native-run");
  assert.equal(classifyNativeEvidenceArtifact(blockerArtifact).status, "dependency-blocker");
  assert.equal(classifyNativeEvidenceArtifact(adapterArtifact).status, "adapter-plan-only");

  const manifest = buildNativeEvidenceManifest({
    generatedAt: "2026-05-23T00:00:00.000Z",
    hostFingerprint: {
      schema: "neurofhe.nativeEvidence.hostFingerprint.v1",
      platform: "test-platform",
      arch: "test-arch",
      node: "v22.0.0",
      toolchain: {},
    },
    artifactReader: (path) => ({
      "benchmark-artifacts/comparisons/openfhe/latest.json": realOpenFheArtifact,
      "benchmark-artifacts/comparisons/openfhe-ckks/latest.json": blockerArtifact,
      "benchmark-artifacts/comparisons/tfhe-rs/latest.json": adapterArtifact,
    })[path],
    openFheDetection: { available: true, cmakeConfigDir: "/opt/openfhe/lib/cmake/OpenFHE" },
    tfheRsDetection: { available: true, manifestExists: true, cargo: "cargo 1.90.0" },
  });

  assert.equal(manifest.schema, "neurofhe.nativeEvidence.manifest.v1");
  assert.equal(manifest.productionClaim, false);
  assert.equal(manifest.summary.realNativeRunCount, 1);
  assert.equal(manifest.summary.dependencyBlockerCount, 1);
  assert.equal(manifest.summary.adapterPlanOnlyCount, 1);
  assert.equal(manifest.summary.missingArtifactCount, 0);
  assert.deepEqual(manifest.summary.measurementCoverage, {
    ciphertextBytesReportedCount: 1,
    ciphertextBytesPartialCount: 1,
    ciphertextBytesMissingCount: 1,
    rssOrPeakMemoryReportedCount: 0,
    rssOrPeakMemoryPartialCount: 1,
    rssOrPeakMemoryMissingCount: 2,
  });
  assert.equal(manifest.summary.measurementGaps.schema, "neurofhe.nativeEvidence.measurementGapIndex.v1");
  assert.equal(manifest.summary.measurementGaps.gapCount, 5);
  assert.deepEqual(
    manifest.summary.measurementGaps.lanes.map((lane) => [
      lane.laneId,
      lane.missingMeasurements,
      lane.partialMeasurements,
    ]),
    [
      ["openfhe-bfvrns", ["ciphertextBytes", "rssOrPeakMemory"], []],
      ["openfhe-ckks", [], ["ciphertextBytes", "rssOrPeakMemory"]],
      ["tfhe-rs", ["rssOrPeakMemory"], []],
    ],
  );
  assert.ok(
    manifest.summary.measurementGaps.lanes[0].exactCommands.some((command) =>
      command.includes("benchmark:openfhe"),
    ),
  );
  assert.equal(manifest.releaseUse.releaseGateSatisfied, false);
  assert.match(manifest.releaseUse.reason, /not sufficient/i);
  assert.deepEqual(
    manifest.lanes.map((lane) => [lane.id, lane.evidence.status]),
    [
      ["openfhe-bfvrns", "real-native-run"],
      ["openfhe-ckks", "dependency-blocker"],
      ["tfhe-rs", "adapter-plan-only"],
    ],
  );
  assert.equal(manifest.lanes[0].evidence.datasetKind, "public-uci-eeg-eye-state-arff");
  assert.equal(manifest.lanes[0].measurements.ciphertextBytes.status, "missing");
  assert.equal(manifest.lanes[1].measurements.ciphertextBytes.status, "partial");
  assert.equal(manifest.lanes[1].measurements.rssOrPeakMemory.status, "partial");
  assert.equal(manifest.lanes[2].measurements.ciphertextBytes.status, "reported");
  assert.equal(manifest.lanes[2].measurements.ciphertextBytes.totalBytes, 2658613);
  assert.equal(manifest.lanes[0].reproducibility.hostSpecific, true);
  assert.ok(manifest.lanes[0].reproducibility.commands.some((command) => command.includes("--input")));
  assert.equal(manifest.lanes[1].smallestNextStep, "OpenFHEConfig.cmake not found");
});

test("native evidence artifacts publish deterministic run and latest JSON", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-native-evidence-"));
  const manifest = buildNativeEvidenceManifest({
    generatedAt: "2026-05-23T00:00:00.000Z",
    hostFingerprint: {
      schema: "neurofhe.nativeEvidence.hostFingerprint.v1",
      platform: "test-platform",
      arch: "test-arch",
      node: "v22.0.0",
      toolchain: {},
    },
    artifactReader: () => undefined,
    openFheDetection: { available: false, reason: "OpenFHEConfig.cmake not found" },
    tfheRsDetection: { available: false, reason: "Cargo not found" },
  });
  const published = await publishNativeEvidenceArtifact({
    outputDir,
    manifest,
    artifactId: "native-evidence-test",
    generatedAt: "2026-05-23T00:00:00.000Z",
  });
  const runArtifact = JSON.parse(await readFile(published.paths.run, "utf8"));
  const latestArtifact = JSON.parse(await readFile(published.paths.latest, "utf8"));

  assert.equal(published.schema, "neurofhe.nativeEvidenceArtifact.publish.v1");
  assert.equal(runArtifact.schema, "neurofhe.nativeEvidenceArtifact.v1");
  assert.equal(runArtifact.artifactId, "native-evidence-test");
  assert.equal(runArtifact.subject.schema, "neurofhe.nativeEvidence.manifest.v1");
  assert.equal(runArtifact.subject.summary.missingArtifactCount, 3);
  assert.equal(runArtifact.productionClaim, false);
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

test("OpenFHE contract loader resolves duplicate keys only in the current object", async () => {
  const compiler = spawnSync("c++", ["--version"], { encoding: "utf8" });
  if (compiler.status !== 0) {
    return;
  }

  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-openfhe-loader-"));
  const contractPath = join(outputDir, "contract.json");
  const sourcePath = join(outputDir, "loader_probe.cpp");
  const binaryPath = join(outputDir, "loader_probe");
  await writeFile(
    contractPath,
    `${JSON.stringify({
      schema: "neurofhe.openfhe.inputContract.v1",
      sourceId: "scope-regression",
      datasetKind: "scope-regression",
      scoreEquation: "scores = W x + bias",
      scoreDomain: "approximate-real",
      boundaryDomain: "bio-digital-event-intelligence",
      eventRepresentation: "scope regression",
      featureShape: [1, 2],
      classes: ["a", "b"],
      matrixShape: [2, 2],
      activeEventCount: 1,
      activeEvents: [{ index: 0, timeBin: 0, neuronId: 0, value: 0.25 }],
      quantized: {
        schema: "neurofhe.openfhe.bfvrnsFixedPointView.v1",
        scoreDomain: "signed-fixed-point-integers",
        fixedPointScale: 10,
        plaintextModulus: 65537,
        activeEvents: [{ index: 0, timeBin: 0, neuronId: 0, value: 3 }],
        weights: { a: [10, 20], b: [30, 40] },
        bias: { a: 50, b: 60 },
      },
      weights: { a: [0.1, 0.2], b: [0.3, 0.4] },
      bias: { a: 0.5, b: 0.6 },
      approximationTolerance: {
        maxAbsScoreError: 0.001,
        classificationAgreementRequired: true,
      },
      productionClaim: false,
    }, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    sourcePath,
    [
      '#include "prototype/openfhe_contract_loader.hpp"',
      "#include <iostream>",
      "int main(int argc, char** argv) {",
      "  const auto ckks = neurofhe::LoadSparseLinearContract<double>(argv[1], false);",
      "  const auto bfv = neurofhe::LoadSparseLinearContract<int64_t>(argv[1], true);",
      '  std::cout << ckks.weights.at("a").at(0) << " "',
      '            << ckks.bias.at("a") << " "',
      '            << ckks.activeEvents.at(0).value << " "',
      '            << bfv.weights.at("a").at(0) << " "',
      '            << bfv.bias.at("a") << " "',
      "            << bfv.activeEvents.at(0).value << \"\\n\";",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );

  const build = spawnSync(
    "c++",
    ["-std=c++17", "-I", ".", sourcePath, "-o", binaryPath],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.equal(build.status, 0, build.stderr);

  const run = spawnSync(binaryPath, [contractPath], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout.trim(), "0.1 0.5 0.25 10 50 3");
});

test("native OpenFHE CKKS source uses real CKKS OpenFHE APIs", async () => {
  const source = await readFile(
    new URL("../openfhe-ckks/openfhe_ckks_linear_demo.cpp", import.meta.url),
    "utf8",
  );
  const cmake = await readFile(
    new URL("../openfhe-ckks/CMakeLists.txt", import.meta.url),
    "utf8",
  );

  assert.match(cmake, /openfhe_ckks_linear_demo/);
  assert.match(source, /#include "openfhe\.h"/);
  assert.match(source, /CryptoContextCKKSRNS/);
  assert.match(source, /SetMultiplicativeDepth/);
  assert.match(source, /SetScalingModSize/);
  assert.match(source, /SetFirstModSize/);
  assert.match(source, /SetSecurityLevel/);
  assert.match(source, /SetScalingTechnique/);
  assert.match(source, /FLEXIBLEAUTO/);
  assert.match(source, /MakeCKKSPackedPlaintext/);
  assert.match(source, /EvalMult/);
  assert.match(source, /EvalAdd/);
  assert.match(source, /Decrypt/);
  assert.match(source, /SetLength/);
  assert.match(source, /EvalBootstrapSetup/);
  assert.match(source, /openfhe-ckks/);
  assert.match(source, /approximate-real/);
});

test("native TFHE-rs source uses real TFHE-rs integer and Boolean APIs", async () => {
  const source = await readFile(
    new URL("../tfhe-rs/src/lib.rs", import.meta.url),
    "utf8",
  );
  const manifest = await readFile(
    new URL("../tfhe-rs/Cargo.toml", import.meta.url),
    "utf8",
  );

  assert.match(manifest, /tfhe = \{ version = "1\.6\.1"/);
  assert.match(source, /use tfhe::\{generate_keys, set_server_key, ConfigBuilder, FheBool, FheUint16\}/);
  assert.match(source, /safe_serialized_size/);
  assert.match(source, /FheUint16::encrypt/);
  assert.match(source, /\.gt\(&encrypted_scores\.normal\)/);
  assert.match(source, /FheBool/);
  assert.match(source, /productionClaim/);
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

test("plaintext N-MNIST fixture baseline emits an accuracy versus compression curve", () => {
  const fixture = buildNmnistSmokeFixtureRecords();
  const compressionLevels = [
    { id: "grid-1-time-1", gridSize: 1, timeBins: 1 },
    { id: "grid-2-time-2", gridSize: 2, timeBins: 2 },
    { id: "grid-8-time-4", gridSize: 8, timeBins: 4 },
  ];
  const report = runPlaintextEventBaseline({
    trainRecords: fixture.trainRecords,
    testRecords: fixture.testRecords,
    options: { gridSize: 8, timeBins: 4 },
    compressionLevels,
  });
  const sweep = runPlaintextCompressionSweep({
    trainRecords: fixture.trainRecords,
    testRecords: fixture.testRecords,
    levels: compressionLevels,
    referenceOptions: { gridSize: 8, timeBins: 4 },
  });

  assert.equal(fixture.source.datasetKind, "nmnist-format-smoke-fixture");
  assert.equal(fixture.source.isRealDataset, false);
  assert.equal(report.compressionCurve.schema, "neurofhe.plaintextCompressionCurve.v1");
  assert.deepEqual(report.compressionCurve.levels.map((level) => level.id), [
    "grid-1-time-1",
    "grid-2-time-2",
    "grid-8-time-4",
  ]);
  assert.equal(report.compressionCurve.levels[0].featureCount, 2);
  assert.equal(report.compressionCurve.levels[2].featureCount, 512);
  assert.equal(report.compressionCurve.levels[0].compressionFactorVsReference, 256);
  assert.equal(report.compressionCurve.levels[0].accuracy, 0.5);
  assert.equal(report.compressionCurve.levels[2].accuracy, 1);
  assert.deepEqual(sweep.levels, report.compressionCurve.levels);
});

test("EEG Eye State ARFF parser and sparse baseline preserve real-data caveats", () => {
  const fixture = buildEegEyeStateSmokeFixtureRows();
  const parsed = parseEegEyeStateArff([
    "@relation eeg-eye-state-mini",
    "@attribute AF3 numeric",
    "@attribute F7 numeric",
    "@attribute F3 numeric",
    "@attribute FC5 numeric",
    "@attribute T7 numeric",
    "@attribute P7 numeric",
    "@attribute O1 numeric",
    "@attribute O2 numeric",
    "@attribute P8 numeric",
    "@attribute T8 numeric",
    "@attribute FC6 numeric",
    "@attribute F4 numeric",
    "@attribute F8 numeric",
    "@attribute AF4 numeric",
    "@attribute eyeDetection {0,1}",
    "@data",
    "1,2,3,4,5,6,7,8,9,10,11,12,13,14,0",
    "2,3,4,5,6,7,8,9,10,11,12,13,14,15,1",
  ].join("\n"));
  const report = runEegEyeStatePlaintextBaseline({
    rows: fixture.rows,
    options: {
      trainFraction: 0.7,
      windowSize: 2,
      stride: 2,
      channelCount: 4,
      activePerTimestep: 2,
    },
    compressionLevels: [
      { id: "active-1-per-timestep", activePerTimestep: 1 },
      { id: "active-2-per-timestep", activePerTimestep: 2 },
    ],
  });

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].label, "eye-open");
  assert.equal(parsed[1].label, "eye-closed");
  assert.equal(fixture.source.isRealDataset, false);
  assert.equal(fixture.source.datasetKind, "eeg-eye-state-format-smoke-fixture");
  assert.equal(report.schema, "neurofhe.plaintextBaseline.v1");
  assert.equal(report.datasetKind, "public-uci-eeg-eye-state-arff");
  assert.deepEqual(report.matrixShape, [2, 8]);
  assert.equal(report.scoreEquation, "scores = W x + bias");
  assert.equal(report.openFheCompatibility.ckksPath.includes("CKKS-friendly"), true);
  assert.equal(report.privacyBoundary.productionClaim, false);
  assert.deepEqual(report.compressionCurve.levels.map((level) => level.id), [
    "active-1-per-timestep",
    "active-2-per-timestep",
  ]);
  assert.equal(report.compressionCurve.levels[0].activeBudgetCompressionVsDense, 4);
  assert.equal(report.compressionCurve.levels[1].activeBudgetCompressionVsDense, 2);
});

test("EEG plaintext CLI emits blocker artifacts for invalid baseline options", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-eeg-baseline-blocker-"));
  const result = spawnSync(
    process.execPath,
    [
      "prototype/plaintext-baseline.mjs",
      "--source",
      "eeg-eye-state",
      "--fixture",
      "eeg-eye-state-smoke",
      "--train-fraction",
      "0.01",
      "--window-size",
      "8",
      "--artifact",
      "--out",
      outputDir,
      "--artifact-id",
      "eeg-invalid-options",
      "--generated-at",
      "2026-05-21T00:00:00.000Z",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  const published = JSON.parse(result.stdout);
  const artifact = JSON.parse(await readFile(published.paths.run, "utf8"));

  assert.equal(result.status, 2);
  assert.equal(result.stderr, "");
  assert.equal(published.schema, "neurofhe.plaintextBaselineArtifact.publish.v1");
  assert.equal(artifact.subject.schema, "neurofhe.plaintextBaseline.unavailable.v1");
  assert.equal(artifact.subject.blocker.reason, "cannot train EEG baseline without windows");
  assert.equal(artifact.subject.blocker.trainFraction, 0.01);
  assert.match(artifact.subject.attemptedCommand, /--fixture eeg-eye-state-smoke/);
  assert.match(artifact.subject.smallestNextStep, /larger --train-fraction/);
});

test("EEG plaintext CLI boundary matrix returns structured unavailable artifacts", async (t) => {
  const boundaryCases = [
    {
      flag: "--train-fraction",
      value: "0",
      reason: /--train-fraction must be a finite number greater than 0 and less than 1/,
    },
    {
      flag: "--train-fraction",
      value: "1",
      reason: /--train-fraction must be a finite number greater than 0 and less than 1/,
    },
    {
      flag: "--window-size",
      value: "0",
      reason: /--window-size must be a positive integer/,
    },
    {
      flag: "--window-size",
      value: "2.5",
      reason: /--window-size must be a positive integer/,
    },
    {
      flag: "--stride",
      value: "0",
      reason: /--stride must be a positive integer/,
    },
    {
      flag: "--stride",
      value: "not-a-number",
      reason: /--stride must be a positive integer/,
    },
  ];

  for (const boundaryCase of boundaryCases) {
    await t.test(`${boundaryCase.flag} ${boundaryCase.value}`, async () => {
      const outputDir = await mkdtemp(join(tmpdir(), "neurofhe-eeg-boundary-"));
      const result = spawnSync(
        process.execPath,
        [
          "prototype/plaintext-baseline.mjs",
          "--source",
          "eeg-eye-state",
          "--fixture",
          "eeg-eye-state-smoke",
          "--train-fraction",
          "0.7",
          "--window-size",
          "2",
          "--stride",
          "2",
          boundaryCase.flag,
          boundaryCase.value,
          "--artifact",
          "--out",
          outputDir,
          "--artifact-id",
          `eeg-boundary-${boundaryCase.flag.slice(2)}-${boundaryCase.value}`,
          "--generated-at",
          "2026-05-21T00:00:00.000Z",
        ],
        { cwd: process.cwd(), encoding: "utf8", timeout: 1500 },
      );
      const published = JSON.parse(result.stdout);
      const artifact = JSON.parse(await readFile(published.paths.run, "utf8"));

      assert.equal(result.status, 2);
      assert.equal(result.stderr, "");
      assert.equal(published.schema, "neurofhe.plaintextBaselineArtifact.publish.v1");
      assert.equal(artifact.subject.schema, "neurofhe.plaintextBaseline.unavailable.v1");
      assert.match(artifact.subject.blocker.reason, boundaryCase.reason);
      assert.match(artifact.subject.attemptedCommand, new RegExp(`${boundaryCase.flag} ${boundaryCase.value}`));
    });
  }
});

test("EEG Eye State can emit an OpenFHE-ready sparse input contract", () => {
  const fixture = buildEegEyeStateSmokeFixtureRows();
  const contract = buildEegEyeStateOpenFheInputContract({
    rows: fixture.rows,
    sampleIndex: 0,
    fixedPointScale: 10,
    options: {
      trainFraction: 0.7,
      windowSize: 2,
      stride: 2,
      channelCount: 4,
      activePerTimestep: 2,
    },
  });

  assert.equal(contract.schema, "neurofhe.openfhe.inputContract.v1");
  assert.equal(contract.scoreEquation, "scores = W x + bias");
  assert.equal(contract.scoreDomain, "approximate-real");
  assert.deepEqual(contract.featureShape, [2, 4]);
  assert.deepEqual(contract.matrixShape, [2, 8]);
  assert.equal(contract.activeEventCount, 4);
  assert.equal(contract.quantized.schema, "neurofhe.openfhe.bfvrnsFixedPointView.v1");
  assert.equal(contract.quantized.fixedPointScale, 10);
  assert.equal(contract.quantized.activeEvents.length, contract.activeEvents.length);
  assert.equal(contract.privacyBoundary.productionClaim, false);
  assert.equal(contract.productionClaim, false);
});

test("EEG OpenFHE input contract CLI boundary matrix returns clear validation errors", async (t) => {
  const datasetPath = join(
    await mkdtemp(join(tmpdir(), "neurofhe-eeg-contract-boundary-")),
    "EEG Eye State.arff",
  );
  await writeFile(datasetPath, eegEyeStateSmokeArff(), "utf8");
  const boundaryCases = [
    {
      flag: "--train-fraction",
      value: "0",
      reason: /Validation error: --train-fraction must be a finite number greater than 0 and less than 1/,
    },
    {
      flag: "--window-size",
      value: "0",
      reason: /Validation error: --window-size must be a positive integer/,
    },
    {
      flag: "--stride",
      value: "0",
      reason: /Validation error: --stride must be a positive integer/,
    },
    {
      flag: "--sample-index",
      value: "-1",
      reason: /Validation error: --sample-index must be a non-negative integer/,
    },
    {
      flag: "--sample-index",
      value: "99",
      reason: /Validation error: --sample-index 99 is outside available test windows 0-0/,
    },
  ];

  for (const boundaryCase of boundaryCases) {
    await t.test(`${boundaryCase.flag} ${boundaryCase.value}`, () => {
      const result = spawnSync(
        process.execPath,
        [
          "prototype/openfhe-realdata-contract.mjs",
          "--dataset",
          datasetPath,
          "--train-fraction",
          "0.7",
          "--window-size",
          "2",
          "--stride",
          "2",
          "--sample-index",
          "0",
          boundaryCase.flag,
          boundaryCase.value,
        ],
        { cwd: process.cwd(), encoding: "utf8", timeout: 1500 },
      );

      assert.equal(result.status, 2);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, boundaryCase.reason);
      assert.doesNotMatch(result.stderr, /\n\s+at /);
    });
  }
});

test("EEG Eye State OpenFHE contract rejects negative sample index", () => {
  const fixture = buildEegEyeStateSmokeFixtureRows();

  assert.throws(
    () => buildEegEyeStateOpenFheInputContract({
      rows: fixture.rows,
      sampleIndex: -1,
      fixedPointScale: 10,
      options: {
        trainFraction: 0.7,
        windowSize: 2,
        stride: 2,
        channelCount: 4,
        activePerTimestep: 2,
      },
    }),
    /--sample-index must be a non-negative integer/,
  );
});
