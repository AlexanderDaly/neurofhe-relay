// SPDX-License-Identifier: CC0-1.0

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_SOURCE_SIZE = 34;
const BYTES_PER_EVENT = 5;
const MAX_TIMESTAMP_US = 0x7fffff;

export function loadNmnistRecords(datasetRoot, options = {}) {
  const split = options.split ?? "Train";
  const limitPerClass = options.limitPerClass ?? 10;
  const splitRoot = join(datasetRoot, split);
  const labels = readdirSync(splitRoot)
    .filter((entry) => statSync(join(splitRoot, entry)).isDirectory())
    .sort();
  const records = [];

  for (const label of labels) {
    const labelRoot = join(splitRoot, label);
    const files = readdirSync(labelRoot)
      .filter((entry) => entry.endsWith(".bin"))
      .sort()
      .slice(0, limitPerClass);

    for (const file of files) {
      const path = join(labelRoot, file);
      records.push({
        label,
        path,
        events: parseNmnistEvents(readFileSync(path)),
      });
    }
  }

  return records;
}

export function buildNmnistSmokeFixtureRecords() {
  const source = {
    schema: "neurofhe.datasetProvenance.v1",
    datasetKind: "nmnist-format-smoke-fixture",
    isRealDataset: false,
    publicDatasetReference: {
      name: "N-MNIST",
      url: "https://www.garrickorchard.com/datasets/n-mnist",
      doi: "10.17632/468j46mzdv.1",
      license: "CC BY 4.0 for the public dataset; this fixture contains deterministic format-test events only",
    },
    caveat:
      "This fixture exercises the N-MNIST 40-bit event format and compression pipeline, but it is not sampled from the public N-MNIST recordings and must not be reported as real-data accuracy.",
  };
  const trainRecords = [
    fixtureRecord("0", "Train/0/fixture-0-a.bin", [
      { x: 4, y: 4, polarity: 1, timestampUs: 1000 },
      { x: 5, y: 4, polarity: 1, timestampUs: 2000 },
    ]),
    fixtureRecord("0", "Train/0/fixture-0-b.bin", [
      { x: 4, y: 5, polarity: 1, timestampUs: 1000 },
      { x: 5, y: 5, polarity: 1, timestampUs: 2000 },
    ]),
    fixtureRecord("1", "Train/1/fixture-1-a.bin", [
      { x: 28, y: 28, polarity: 1, timestampUs: 1000 },
      { x: 29, y: 28, polarity: 1, timestampUs: 2000 },
    ]),
    fixtureRecord("1", "Train/1/fixture-1-b.bin", [
      { x: 28, y: 29, polarity: 1, timestampUs: 1000 },
      { x: 29, y: 29, polarity: 1, timestampUs: 2000 },
    ]),
  ];
  const testRecords = [
    fixtureRecord("0", "Test/0/fixture-0.bin", [
      { x: 4, y: 4, polarity: 1, timestampUs: 1500 },
      { x: 5, y: 5, polarity: 1, timestampUs: 2500 },
    ]),
    fixtureRecord("1", "Test/1/fixture-1.bin", [
      { x: 28, y: 28, polarity: 1, timestampUs: 1500 },
      { x: 29, y: 29, polarity: 1, timestampUs: 2500 },
    ]),
  ];

  return {
    schema: "neurofhe.nmnistSmokeFixture.v1",
    source,
    trainRecords,
    testRecords,
  };
}

export function encodeNmnistEvent(event) {
  const x = requireByte("x", event.x);
  const y = requireByte("y", event.y);
  const polarity = requireBit("polarity", event.polarity);
  const timestampUs = requireTimestamp(event.timestampUs);

  return Uint8Array.from([
    x,
    y,
    (polarity << 7) | ((timestampUs >> 16) & 0x7f),
    (timestampUs >> 8) & 0xff,
    timestampUs & 0xff,
  ]);
}

export function parseNmnistEvents(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error("N-MNIST events must be a Uint8Array");
  }
  if (bytes.length % BYTES_PER_EVENT !== 0) {
    throw new Error("N-MNIST byte length must be divisible by 5");
  }

  const events = [];
  for (let offset = 0; offset < bytes.length; offset += BYTES_PER_EVENT) {
    const header = bytes[offset + 2];
    events.push({
      x: bytes[offset],
      y: bytes[offset + 1],
      polarity: header >> 7,
      timestampUs:
        ((header & 0x7f) << 16) |
        (bytes[offset + 3] << 8) |
        bytes[offset + 4],
    });
  }
  return events;
}

export function eventsToFeatureVector(events, options = {}) {
  const gridSize = options.gridSize ?? 8;
  const timeBins = options.timeBins ?? 4;
  const polarityBins = options.polarityBins ?? 2;
  const sourceSize = options.sourceSize ?? DEFAULT_SOURCE_SIZE;
  const windowUs = options.windowUs ?? 105000;
  const vector = Array(gridSize * gridSize * timeBins * polarityBins).fill(0);
  let activeEventCount = 0;

  for (const event of events) {
    if (!isEventInWindow(event, windowUs)) continue;
    const timeBin = Math.min(
      timeBins - 1,
      Math.floor((event.timestampUs / windowUs) * timeBins),
    );
    const cellX = quantizeCoordinate(event.x, sourceSize, gridSize);
    const cellY = quantizeCoordinate(event.y, sourceSize, gridSize);
    const polarity = requireBit("polarity", event.polarity);
    const index =
      (((timeBin * gridSize + cellY) * gridSize + cellX) * polarityBins) +
      polarity;

    vector[index] += 1;
    activeEventCount += 1;
  }

  const nonZeroFeatures = vector.reduce(
    (count, value) => count + (value === 0 ? 0 : 1),
    0,
  );
  return {
    schema: "neurofhe.nmnist.features.v1",
    featureShape: [timeBins, gridSize, gridSize, polarityBins],
    flatteningOrder: "time-major-y-x-polarity-minor",
    vector,
    activeEventCount,
    sparsity: {
      eventCount: activeEventCount,
      nonZeroFeatures,
      density: nonZeroFeatures / vector.length,
    },
  };
}

export function trainCentroidLinearClassifier(records, options = {}) {
  const prepared = prepareRecords(records, options);
  const classes = [...new Set(prepared.map((record) => record.label))].sort();
  const featureCount = prepared[0]?.features.vector.length ?? featureCountFor(options);
  const centroids = Object.fromEntries(
    classes.map((label) => [label, Array(featureCount).fill(0)]),
  );
  const counts = Object.fromEntries(classes.map((label) => [label, 0]));

  for (const record of prepared) {
    counts[record.label] += 1;
    record.features.vector.forEach((value, index) => {
      centroids[record.label][index] += value;
    });
  }

  for (const label of classes) {
    if (counts[label] === 0) continue;
    centroids[label] = centroids[label].map((sum) => sum / counts[label]);
  }

  const weights = Object.fromEntries(
    classes.map((label) => [label, centroids[label].map((value) => 2 * value)]),
  );
  const bias = Object.fromEntries(
    classes.map((label) => [
      label,
      -centroids[label].reduce((sum, value) => sum + value * value, 0),
    ]),
  );

  return {
    schema: "neurofhe.nmnist.centroidLinearModel.v1",
    classifier: "nearest-centroid-linear",
    classes,
    featureShape: featureShapeFor(options),
    flatteningOrder: "time-major-y-x-polarity-minor",
    matrixOrientation: "rows-are-classes-columns-are-features",
    matrixShape: [classes.length, featureCount],
    scoreEquation: "argmax(2 * centroid dot x - centroid norm squared)",
    weights,
    bias,
    trainingRecords: records.length,
  };
}

export function evaluateLinearClassifier(model, records, options = {}) {
  const prepared = prepareRecords(records, options);
  let correct = 0;
  const predictions = prepared.map((record) => {
    const scores = scoreVector(model, record.features.vector);
    const predicted = argmax(scores);
    if (predicted === record.label) correct += 1;
    return {
      label: record.label,
      predicted,
      scores,
      activeEventCount: record.features.activeEventCount,
      nonZeroFeatures: record.features.sparsity.nonZeroFeatures,
    };
  });

  return {
    schema: "neurofhe.nmnist.evaluation.v1",
    total: prepared.length,
    correct,
    accuracy: prepared.length === 0 ? 0 : correct / prepared.length,
    predictions,
    averageActiveEvents: average(
      predictions.map((prediction) => prediction.activeEventCount),
    ),
    averageNonZeroFeatures: average(
      predictions.map((prediction) => prediction.nonZeroFeatures),
    ),
  };
}

export function runPlaintextEventBaseline({
  trainRecords,
  testRecords,
  options = {},
  compressionLevels = [],
}) {
  const startedAt = Date.now();
  const model = trainCentroidLinearClassifier(trainRecords, options);
  const evaluation = evaluateLinearClassifier(model, testRecords, options);
  const featureCount = model.matrixShape[1];
  const dotProducts = evaluation.total * model.classes.length;
  const report = {
    schema: "neurofhe.plaintextBaseline.v1",
    dataset: "N-MNIST-compatible-event-records",
    classifier: model.classifier,
    featureShape: model.featureShape,
    matrixShape: model.matrixShape,
    metrics: {
      accuracy: evaluation.accuracy,
      correct: evaluation.correct,
      total: evaluation.total,
      averageActiveEvents: evaluation.averageActiveEvents,
      averageNonZeroFeatures: evaluation.averageNonZeroFeatures,
      latencyMs: Date.now() - startedAt,
    },
    confusion: confusionTable(evaluation.predictions, model.classes),
    operationCounts: {
      plaintextDotProducts: dotProducts,
      scalarMultiplies: dotProducts * featureCount,
      adds: dotProducts * Math.max(0, featureCount - 1),
    },
    privacyBoundary: {
      localDeviceSees: ["N-MNIST-compatible event records", "plaintext features"],
      computeSees: ["plaintext baseline only"],
      productionClaim: false,
    },
  };

  if (compressionLevels.length > 0) {
    report.compressionCurve = runPlaintextCompressionSweep({
      trainRecords,
      testRecords,
      levels: compressionLevels,
      referenceOptions: options,
    });
  }

  return report;
}

export function runPlaintextCompressionSweep({
  trainRecords,
  testRecords,
  levels,
  referenceOptions = {},
}) {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new Error("compression sweep levels must be a non-empty array");
  }
  const referenceFeatureCount = featureCountFor(referenceOptions);

  return {
    schema: "neurofhe.plaintextCompressionCurve.v1",
    metric: "accuracy-versus-feature-compression",
    referenceFeatureShape: featureShapeFor(referenceOptions),
    referenceFeatureCount,
    levels: levels.map((level, index) => {
      const levelOptions = {
        ...referenceOptions,
        ...level,
      };
      const report = runPlaintextEventBaseline({
        trainRecords,
        testRecords,
        options: levelOptions,
      });
      const featureCount = report.matrixShape[1];

      return {
        id: level.id ?? `level-${index + 1}`,
        gridSize: levelOptions.gridSize ?? 8,
        timeBins: levelOptions.timeBins ?? 4,
        polarityBins: levelOptions.polarityBins ?? 2,
        featureShape: report.featureShape,
        featureCount,
        compressionFactorVsReference: round(referenceFeatureCount / featureCount),
        accuracy: report.metrics.accuracy,
        correct: report.metrics.correct,
        total: report.metrics.total,
        averageActiveEvents: report.metrics.averageActiveEvents,
        averageNonZeroFeatures: report.metrics.averageNonZeroFeatures,
        plaintextDotProducts: report.operationCounts.plaintextDotProducts,
      };
    }),
    caveat:
      "Compression levels change plaintext feature resolution before encryption. This curve is not an encrypted-compute benchmark.",
    productionClaim: false,
  };
}

function confusionTable(predictions, classes) {
  const table = Object.fromEntries(
    classes.map((label) => [
      label,
      Object.fromEntries(classes.map((predicted) => [predicted, 0])),
    ]),
  );
  for (const prediction of predictions) {
    table[prediction.label] ??= {};
    table[prediction.label][prediction.predicted] =
      (table[prediction.label][prediction.predicted] ?? 0) + 1;
  }
  return table;
}

function prepareRecords(records, options) {
  if (!Array.isArray(records)) throw new Error("records must be an array");
  return records.map((record) => {
    if (typeof record?.label !== "string") {
      throw new Error("record label must be a string");
    }
    if (!Array.isArray(record.events)) {
      throw new Error("record events must be an array");
    }
    return {
      label: record.label,
      features: eventsToFeatureVector(record.events, options),
    };
  });
}

function scoreVector(model, vector) {
  return Object.fromEntries(
    model.classes.map((label) => [
      label,
      model.bias[label] + dot(vector, model.weights[label]),
    ]),
  );
}

function argmax(scores) {
  return Object.entries(scores).reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )[0];
}

function dot(values, weights) {
  return values.reduce((sum, value, index) => sum + value * weights[index], 0);
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fixtureRecord(label, path, events) {
  const bytes = Uint8Array.from(events.flatMap((event) => [...encodeNmnistEvent(event)]));
  return {
    label,
    path,
    events: parseNmnistEvents(bytes),
  };
}

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function featureShapeFor(options) {
  return [
    options.timeBins ?? 4,
    options.gridSize ?? 8,
    options.gridSize ?? 8,
    options.polarityBins ?? 2,
  ];
}

function featureCountFor(options) {
  return featureShapeFor(options).reduce((product, value) => product * value, 1);
}

function isEventInWindow(event, windowUs) {
  return (
    Number.isInteger(event.timestampUs) &&
    event.timestampUs >= 0 &&
    event.timestampUs < windowUs
  );
}

function quantizeCoordinate(value, sourceSize, gridSize) {
  const byte = requireByte("coordinate", value);
  return Math.min(gridSize - 1, Math.floor((byte / sourceSize) * gridSize));
}

function requireByte(name, value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xff) {
    throw new Error(`${name} must be an integer from 0 to 255`);
  }
  return value;
}

function requireBit(name, value) {
  if (value !== 0 && value !== 1) {
    throw new Error(`${name} must be 0 or 1`);
  }
  return value;
}

function requireTimestamp(value) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_TIMESTAMP_US) {
    throw new Error(`timestampUs must be an integer from 0 to ${MAX_TIMESTAMP_US}`);
  }
  return value;
}
