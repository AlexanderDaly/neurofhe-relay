// SPDX-License-Identifier: CC0-1.0

import { activeEvents, flattenEventWindow, spikeMetrics } from "./events.mjs";
import {
  createToyCipher,
  createToyKeypair,
  decrypt,
  estimateBigIntBytes,
  summarizeCiphertext,
} from "./toy-paillier.mjs";

export function makeDemoWeights(featureCount, channels = 8) {
  const normalPattern = [1, 2, 1, 1, 0, 0, 0, 0];
  const anomalyPattern = [0, 0, 2, 2, 3, 3, 2, 0];
  const normal = Array.from({ length: featureCount }, (_, index) => {
    const channel = index % channels;
    return normalPattern[channel] ?? 0;
  });
  const anomaly = Array.from({ length: featureCount }, (_, index) => {
    const channel = index % channels;
    const time = Math.floor(index / channels);
    const timeBonus = time >= 3 && time <= 6 ? 1 : 0;
    return (anomalyPattern[channel] ?? 0) + timeBonus;
  });
  return { normal, anomaly };
}

export function classifyScores(scores) {
  const entries = Object.entries(scores);
  entries.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return entries[0][0];
}

export function runPlaintextLinearClassifier(eventWindow, options = {}) {
  const flattened = flattenEventWindow(eventWindow);
  const weights = options.weights ?? makeDemoWeights(flattened.length, eventWindow.channels);
  const scores = Object.fromEntries(
    Object.entries(weights).map(([label, classWeights]) => [
      label,
      dot(flattened, classWeights),
    ]),
  );

  return {
    type: "plaintext-linear-spike-count-classifier",
    scores,
    classification: classifyScores(scores),
    publicModel: publicModelSummary(weights, flattened.length),
  };
}

export function runEncryptedLinearClassifier(eventWindow, options = {}) {
  const flattened = flattenEventWindow(eventWindow);
  const eventList = activeEvents(eventWindow);
  const weights = options.weights ?? makeDemoWeights(flattened.length, eventWindow.channels);
  const { publicKey, privateKey } = createToyKeypair(options.keypairOptions ?? {});
  const cipher = createToyCipher(publicKey, { seed: options.seed ?? 91 });
  const operationCounts = {
    encryptions: 0,
    scalarMultiplies: 0,
    adds: 0,
    decryptions: 0,
  };

  const encryptedEvents = eventList.map((event) => {
    operationCounts.encryptions += 1;
    return { ...event, ciphertext: cipher.encrypt(event.value) };
  });

  const encryptedScores = {};
  for (const [label, classWeights] of Object.entries(weights)) {
    let acc = cipher.encrypt(0);
    operationCounts.encryptions += 1;

    for (const event of encryptedEvents) {
      const weighted = cipher.scalarMultiply(event.ciphertext, classWeights[event.index]);
      operationCounts.scalarMultiplies += 1;
      acc = cipher.add(acc, weighted);
      operationCounts.adds += 1;
    }
    encryptedScores[label] = acc;
  }

  const decryptedScores = Object.fromEntries(
    Object.entries(encryptedScores).map(([label, ciphertext]) => {
      operationCounts.decryptions += 1;
      return [label, Number(decrypt(publicKey, privateKey, ciphertext))];
    }),
  );

  return {
    type: "encrypted-sparse-linear-spike-count-classifier",
    scheme: "toy-paillier-additive-research-only",
    eventRepresentation: "public active positions with encrypted active spike counts",
    sparseMetrics: spikeMetrics(eventWindow),
    publicModel: publicModelSummary(weights, flattened.length),
    encryptedPreview: {
      firstSpikeCiphertext: encryptedEvents[0]
        ? summarizeCiphertext(encryptedEvents[0].ciphertext)
        : null,
      normalScoreCiphertext: summarizeCiphertext(encryptedScores.normal),
      anomalyScoreCiphertext: summarizeCiphertext(encryptedScores.anomaly),
    },
    ciphertextBytes: estimateCiphertextBytes(encryptedEvents, encryptedScores),
    operationCounts,
    decryptedScores,
    classification: classifyScores(decryptedScores),
  };
}

function publicModelSummary(weights, featureCount) {
  return {
    type: "non-negative linear spike-count classifier",
    classes: Object.keys(weights),
    featureCount,
  };
}

function dot(values, weights) {
  return values.reduce((sum, value, index) => sum + value * weights[index], 0);
}

function estimateCiphertextBytes(encryptedEvents, encryptedScores) {
  const eventBytes = encryptedEvents.reduce(
    (sum, event) => sum + estimateBigIntBytes(event.ciphertext),
    0,
  );
  const scoreBytes = Object.values(encryptedScores).reduce(
    (sum, ciphertext) => sum + estimateBigIntBytes(ciphertext),
    0,
  );
  return eventBytes + scoreBytes;
}
