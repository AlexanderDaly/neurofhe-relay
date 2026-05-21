import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { runPrototypeBenchmark } from "../lib/benchmark.mjs";
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
  assert.ok(benchmark.ciphertextBytes > 0);
  assert.deepEqual(benchmark.cryptoInventory.keyEstablishment, [
    "ML-KEM-768-design-target",
  ]);
  assert.equal(benchmark.cryptoInventory.productionClaim, false);
  assert.ok(benchmark.privacyBoundary.computeSees.includes("ciphertext active spike values"));
  assert.ok(benchmark.privacyBoundary.computeSees.includes("public active event positions"));
});

test("OpenFHE demo contract preserves the sparse linear score boundary", () => {
  const contract = buildOpenFheDemoContract();

  assert.equal(contract.schema, "neurofhe.openfhe.contract.v1");
  assert.equal(contract.scheme, "openfhe-bfvrns");
  assert.equal(contract.scoreEquation, "scores = W x + bias");
  assert.equal(contract.boundaryDomain, "bio-digital-event-intelligence");
  assert.deepEqual(contract.matrixShape, [2, 64]);
  assert.equal(contract.activeEventCount, 18);
  assert.deepEqual(contract.expectedPlaintextScores, { normal: 9, anomaly: 51 });
  assert.equal(contract.expectedClassification, "anomaly");
  assert.deepEqual(validateOpenFheContract(contract), []);
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
  assert.ok(plan.sourcePath.endsWith("prototype/openfhe/openfhe_linear_demo.cpp"));
  assert.ok(plan.cmakePath.endsWith("prototype/openfhe/CMakeLists.txt"));
  assert.deepEqual(plan.commands, [
    "cmake -S prototype/openfhe -B build/openfhe",
    "cmake --build build/openfhe",
    "build/openfhe/openfhe_linear_demo",
  ]);
  assert.equal(detection.available, false);
  assert.equal(detection.reason, "OpenFHEConfig.cmake not found");
});

test("native OpenFHE source uses real BFVrns OpenFHE APIs", async () => {
  const source = await readFile(
    new URL("../openfhe/openfhe_linear_demo.cpp", import.meta.url),
    "utf8",
  );

  assert.match(source, /#include "openfhe\.h"/);
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
