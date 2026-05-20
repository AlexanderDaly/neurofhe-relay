// SPDX-License-Identifier: CC0-1.0

import { activeEvents, flattenEventWindow, spikeMetrics } from "./events.mjs";
import {
  buildDemoLinearModel,
  denseMatVec,
  publicModelSummary,
  sparseMatVec,
} from "./linear-algebra.mjs";
import {
  createToyCipher,
  createToyKeypair,
  decrypt,
  estimateBigIntBytes,
  summarizeCiphertext,
} from "./toy-paillier.mjs";

export function classifyScores(scores) {
  const entries = Object.entries(scores);
  entries.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return entries[0][0];
}

export function runPlaintextLinearClassifier(eventWindow, options = {}) {
  const flattened = flattenEventWindow(eventWindow);
  const model =
    options.model ??
    buildDemoLinearModel({ featureCount: flattened.length, channels: eventWindow.channels });
  const scores = denseMatVec(model, flattened);

  return {
    type: "plaintext-linear-spike-count-classifier",
    scores,
    classification: classifyScores(scores),
    publicModel: publicModelSummary(model, activeEvents(eventWindow).length),
  };
}

export function runEncryptedLinearClassifier(eventWindow, options = {}) {
  const flattened = flattenEventWindow(eventWindow);
  const eventList = activeEvents(eventWindow);
  const model =
    options.model ??
    buildDemoLinearModel({ featureCount: flattened.length, channels: eventWindow.channels });
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
  for (const label of model.classes) {
    let acc = cipher.encrypt(model.bias[label]);
    operationCounts.encryptions += 1;

    for (const event of encryptedEvents) {
      const weighted = cipher.scalarMultiply(event.ciphertext, model.weights[label][event.index]);
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
    publicModel: publicModelSummary(model, eventList.length),
    sparseScores: sparseMatVec(model, eventList),
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
