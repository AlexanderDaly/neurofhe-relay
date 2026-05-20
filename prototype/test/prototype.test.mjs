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

test("prototype benchmark emits privacy boundary, crypto inventory, and dense baseline comparison", () => {
  const benchmark = runPrototypeBenchmark({ seed: 91 });

  assert.equal(benchmark.schema, "neurofhe.benchmark.v1");
  assert.equal(benchmark.dataset, "synthetic-events-v0");
  assert.equal(benchmark.model, "tiny-linear-spike-count-v0");
  assert.equal(benchmark.scheme, "toy-paillier-additive-research-only");
  assert.equal(benchmark.productionClaim, false);
  assert.equal(benchmark.results.classification, "anomaly");
  assert.deepEqual(benchmark.results.decryptedScores, { normal: 9, anomaly: 51 });
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
