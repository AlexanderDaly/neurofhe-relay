// SPDX-License-Identifier: CC0-1.0

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const EEG_EYE_STATE_CHANNELS = [
  "AF3",
  "F7",
  "F3",
  "FC5",
  "T7",
  "P7",
  "O1",
  "O2",
  "P8",
  "T8",
  "FC6",
  "F4",
  "F8",
  "AF4",
];

export const EEG_EYE_STATE_PROVENANCE = {
  schema: "neurofhe.datasetProvenance.v1",
  datasetId: "eeg-eye-state",
  datasetKind: "public-uci-eeg-eye-state-arff",
  isRealDataset: true,
  publicDatasetReference: {
    name: "EEG Eye State",
    url: "https://archive.ics.uci.edu/dataset/264/eeg+eye+state",
    directDataUrl:
      "https://archive.ics.uci.edu/ml/machine-learning-databases/00264/EEG%20Eye%20State.arff",
    doi: "10.24432/C57G7J",
    citation:
      "Roesler, O. (2013). EEG Eye State [Dataset]. UCI Machine Learning Repository.",
    license: "CC BY 4.0",
  },
  caveat:
    "Single-subject sequential EEG eye-state data. This baseline is for feature-contract validation, not medical, diagnostic, or generalization evidence.",
};

const DEFAULT_DATA_URL =
  EEG_EYE_STATE_PROVENANCE.publicDatasetReference.directDataUrl;
const DEFAULT_CACHE_DIR = ".cache/neurofhe/eeg-eye-state";

export async function loadOrFetchEegEyeStateRows(options = {}) {
  const datasetPath = options.datasetPath;
  if (datasetPath) {
    return {
      rows: parseEegEyeStateArff(readFileSync(datasetPath, "utf8")),
      source: {
        ...EEG_EYE_STATE_PROVENANCE,
        datasetRoot: datasetPath,
        loadMode: "local-arff",
      },
    };
  }

  if (!options.fetch) {
    throw new Error(
      "EEG Eye State requires --dataset /path/to/EEG Eye State.arff or --fetch",
    );
  }

  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const cachedPath = join(cacheDir, "EEG Eye State.arff");
  if (!existsSync(cachedPath)) {
    await downloadEegEyeStateArff({
      url: options.url ?? DEFAULT_DATA_URL,
      outputPath: cachedPath,
    });
  }

  return {
    rows: parseEegEyeStateArff(readFileSync(cachedPath, "utf8")),
    source: {
      ...EEG_EYE_STATE_PROVENANCE,
      datasetRoot: cachedPath,
      loadMode: "downloaded-cache",
      cacheDir,
    },
  };
}

export async function downloadEegEyeStateArff({ url, outputPath }) {
  if (typeof fetch !== "function") {
    throw new Error("global fetch is unavailable in this Node runtime");
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to fetch EEG Eye State ARFF: HTTP ${response.status}`);
  }
  const text = await response.text();
  parseEegEyeStateArff(text);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, text, "utf8");
  return outputPath;
}

export function parseEegEyeStateArff(text) {
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error("EEG Eye State ARFF text must be non-empty");
  }

  const rows = [];
  let inData = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("%")) continue;
    if (!inData) {
      if (line.toLowerCase() === "@data") inData = true;
      continue;
    }

    const parts = line.split(",").map((part) => part.trim());
    if (parts.length !== EEG_EYE_STATE_CHANNELS.length + 1) {
      throw new Error(`invalid EEG Eye State row with ${parts.length} columns`);
    }

    const features = parts
      .slice(0, EEG_EYE_STATE_CHANNELS.length)
      .map((value, index) => parseNumericColumn(value, EEG_EYE_STATE_CHANNELS[index]));
    const rawLabel = Number(parts.at(-1));
    if (rawLabel !== 0 && rawLabel !== 1) {
      throw new Error(`invalid eyeDetection label: ${parts.at(-1)}`);
    }

    rows.push({
      index: rows.length,
      features,
      label: rawLabel === 1 ? "eye-closed" : "eye-open",
      rawLabel,
    });
  }

  if (rows.length === 0) {
    throw new Error("EEG Eye State ARFF contains no data rows");
  }
  return rows;
}

export function buildEegEyeStateSmokeFixtureRows() {
  const arff = [
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

  return {
    schema: "neurofhe.eegEyeStateSmokeFixture.v1",
    source: {
      ...EEG_EYE_STATE_PROVENANCE,
      datasetId: "eeg-eye-state-smoke",
      datasetKind: "eeg-eye-state-format-smoke-fixture",
      isRealDataset: false,
      caveat:
        "Deterministic ARFF parser fixture only. It is not sampled from the public UCI EEG Eye State dataset.",
    },
    rows: parseEegEyeStateArff(arff),
  };
}

export function runEegEyeStatePlaintextBaseline({
  rows,
  options = {},
  compressionLevels = [],
}) {
  const startedAt = Date.now();
  const trainFraction = options.trainFraction ?? 0.7;
  const split = splitChronological(rows, trainFraction);
  const selectedChannelIndices = selectedChannels(options);
  const normalizer = fitEegNormalizer(split.trainRows, selectedChannelIndices);
  const trainWindows = rowsToSparseWindows(split.trainRows, normalizer, options);
  const testWindows = rowsToSparseWindows(split.testRows, normalizer, options);
  const model = trainCentroidSparseLinearClassifier(trainWindows);
  const evaluation = evaluateSparseLinearClassifier(model, testWindows);
  const featureCount = featureCountFor(options);
  const dotProducts = evaluation.total * model.classes.length;
  const sparseScalarMultiplies = evaluation.predictions.reduce(
    (sum, prediction) => sum + prediction.activeEventCount * model.classes.length,
    0,
  );
  const latencyMs = Date.now() - startedAt;

  const report = {
    schema: "neurofhe.plaintextBaseline.v1",
    dataset: "UCI EEG Eye State sparse latent event windows",
    datasetKind: "public-uci-eeg-eye-state-arff",
    classifier: model.classifier,
    featureShape: model.featureShape,
    flatteningOrder: model.flatteningOrder,
    matrixShape: model.matrixShape,
    scoreEquation: "scores = W x + bias",
    eventRepresentation:
      "public active positions plus signed z-score active values derived from chronological EEG windows",
    metrics: {
      accuracy: round(evaluation.accuracy, 6),
      correct: evaluation.correct,
      total: evaluation.total,
      averageActiveEvents: round(evaluation.averageActiveEvents, 6),
      averageNonZeroFeatures: round(evaluation.averageNonZeroFeatures, 6),
      latencyMs,
    },
    confusion: confusionTable(evaluation.predictions, model.classes),
    operationCounts: {
      plaintextDotProducts: dotProducts,
      sparseScalarMultiplies,
      sparseAdds: Math.max(0, sparseScalarMultiplies - dotProducts),
      denseScalarMultiplies: dotProducts * featureCount,
      denseAdds: dotProducts * Math.max(0, featureCount - 1),
      sparseMultiplyReductionVsDense: round(
        1 - sparseScalarMultiplies / Math.max(1, dotProducts * featureCount),
        6,
      ),
    },
    preprocessing: buildPreprocessingSummary({
      rows,
      split,
      normalizer,
      options,
      selectedChannelIndices,
    }),
    openFheCompatibility: {
      contract: "scores = W x + bias",
      matrixShape: model.matrixShape,
      featureShape: model.featureShape,
      currentNativeOpenFheTargets:
        "BFVrns and CKKS demos are installed comparison lanes, but still consume embedded synthetic inputs unless a dynamic input/model loader is added.",
      ckksPath:
        "signed z-score active values are CKKS-friendly approximate real inputs",
      bfvPath:
        "BFVrns can use the same public positions after explicit fixed-point quantization of active values and model weights",
      nextStep:
        "Add a native JSON/CSV input loader so the OpenFHE BFVrns/CKKS binaries can consume this emitted event/model contract directly.",
      productionClaim: false,
    },
    privacyBoundary: {
      schema: "neurofhe.realDataPlaintextPrivacyBoundary.v1",
      localDeviceSees: [
        "raw downloaded EEG Eye State ARFF rows",
        "per-channel normalization statistics",
        "plaintext sparse feature windows",
      ],
      computeSees: [
        "plaintext baseline only",
        "public active latent positions",
        "plaintext signed active values for validation",
      ],
      withheldFromCommittedArtifacts: [
        "raw EEG rows",
        "per-sample raw channel values",
      ],
      caveat:
        "This is a plaintext baseline used to validate feature shape and accuracy/compression tradeoffs before encrypted execution.",
      productionClaim: false,
    },
    productionClaim: false,
  };

  if (compressionLevels.length > 0) {
    report.compressionCurve = runEegEyeStateCompressionSweep({
      rows,
      levels: compressionLevels,
      referenceOptions: options,
    });
  }

  return report;
}

export function buildEegEyeStateOpenFheInputContract({
  rows,
  options = {},
  sampleIndex = 0,
  fixedPointScale = 10,
  plaintextModulus = 65537,
} = {}) {
  const trainFraction = options.trainFraction ?? 0.7;
  const split = splitChronological(rows, trainFraction);
  const selectedChannelIndices = selectedChannels(options);
  const normalizer = fitEegNormalizer(split.trainRows, selectedChannelIndices);
  const trainWindows = rowsToSparseWindows(split.trainRows, normalizer, options);
  const testWindows = rowsToSparseWindows(split.testRows, normalizer, options);
  if (!testWindows.length) {
    throw new Error("cannot build OpenFHE input contract without test windows");
  }
  const model = trainCentroidSparseLinearClassifier(trainWindows);
  const sample = testWindows[Math.min(sampleIndex, testWindows.length - 1)];
  const expectedScores = scoreSparseWindow(model, sample);
  const expectedClassification = argmax(expectedScores);
  const quantized = quantizeSparseLinearContract({
    model,
    sample,
    fixedPointScale,
    plaintextModulus,
  });

  return {
    schema: "neurofhe.openfhe.inputContract.v1",
    sourceId: "uci-eeg-eye-state-sparse-window",
    datasetKind: "public-uci-eeg-eye-state-arff",
    source: EEG_EYE_STATE_PROVENANCE.publicDatasetReference,
    scoreEquation: "scores = W x + bias",
    scoreDomain: "approximate-real",
    boundaryDomain: "bio-digital-event-intelligence",
    eventRepresentation:
      "public active positions plus signed z-score active values derived from chronological EEG windows",
    featureShape: model.featureShape,
    featureCount: model.matrixShape[1],
    classes: model.classes,
    matrixShape: model.matrixShape,
    activeEventCount: sample.activeEvents.length,
    activeEvents: sample.activeEvents.map(({ index, timeBin, neuronId, value }) => ({
      index,
      timeBin,
      neuronId,
      value,
    })),
    weights: model.weights,
    bias: model.bias,
    expectedPlaintextScores: roundScoreObject(expectedScores),
    expectedClassification,
    sample: {
      label: sample.label,
      rowStart: sample.rowStart,
      rowEnd: sample.rowEnd,
      sampleIndex: Math.min(sampleIndex, testWindows.length - 1),
      split: "chronological-test",
    },
    preprocessing: {
      schema: "neurofhe.eegEyeState.preprocessing.v1",
      rowCount: rows.length,
      trainRows: split.trainRows.length,
      testRows: split.testRows.length,
      trainFraction,
      windowSize: options.windowSize ?? 8,
      stride: options.stride ?? (options.windowSize ?? 8),
      selectedChannels: selectedChannelIndices.map((index) => EEG_EYE_STATE_CHANNELS[index]),
      activePerTimestep: activePerTimestepFor(options),
      normalization: "z-score using training split only",
    },
    approximationTolerance: {
      maxAbsScoreError: options.maxAbsScoreError ?? 0.001,
      classificationAgreementRequired: true,
    },
    quantized,
    privacyBoundary: {
      schema: "neurofhe.realDataOpenFheInputPrivacyBoundary.v1",
      publicFields: [
        "featureShape",
        "classes",
        "public model weights",
        "public model bias",
        "public active positions",
      ],
      encryptedFieldsAtNativeRuntime: [
        "active feature values",
        "class scores",
      ],
      withheldFromContract: [
        "raw EEG rows",
        "per-sample raw channel values",
      ],
      caveat:
        "This contract is a derived single-window research input. It is not raw-data redistribution, production cryptography, or medical validation.",
      productionClaim: false,
    },
    productionClaim: false,
  };
}

export function runEegEyeStateCompressionSweep({
  rows,
  levels,
  referenceOptions = {},
}) {
  if (!Array.isArray(levels) || levels.length === 0) {
    throw new Error("EEG compression sweep levels must be a non-empty array");
  }
  const referenceFeatureCount = featureCountFor(referenceOptions);
  const referenceActivePerWindow =
    activePerTimestepFor(referenceOptions) * (referenceOptions.windowSize ?? 8);

  return {
    schema: "neurofhe.plaintextCompressionCurve.v1",
    metric: "accuracy-versus-latent-active-event-budget",
    referenceFeatureShape: featureShapeFor(referenceOptions),
    referenceFeatureCount,
    levels: levels.map((level, index) => {
      const levelOptions = {
        ...referenceOptions,
        activePerTimestep: level.activePerTimestep,
      };
      const report = runEegEyeStatePlaintextBaseline({
        rows,
        options: levelOptions,
      });
      const activePerTimestep = activePerTimestepFor(levelOptions);
      const activePerWindow =
        activePerTimestep * (levelOptions.windowSize ?? 8);

      return {
        id: level.id ?? `active-${level.activePerTimestep}`,
        requestedActivePerTimestep: levelOptions.activePerTimestep,
        activePerTimestep,
        featureShape: report.featureShape,
        featureCount: report.matrixShape[1],
        activeBudgetPerWindow: activePerWindow,
        activeBudgetCompressionVsDense: round(referenceFeatureCount / activePerWindow),
        activeBudgetVsReference: round(referenceActivePerWindow / activePerWindow),
        accuracy: report.metrics.accuracy,
        correct: report.metrics.correct,
        total: report.metrics.total,
        averageActiveEvents: report.metrics.averageActiveEvents,
        averageNonZeroFeatures: report.metrics.averageNonZeroFeatures,
        sparseScalarMultiplies: report.operationCounts.sparseScalarMultiplies,
      };
    }),
    caveat:
      "Compression changes the sparse active-value budget before encryption. This curve is not encrypted-compute evidence.",
    productionClaim: false,
  };
}

function quantizeSparseLinearContract({
  model,
  sample,
  fixedPointScale,
  plaintextModulus,
}) {
  const quantizedEvents = sample.activeEvents.map(({ index, timeBin, neuronId, value }) => ({
    index,
    timeBin,
    neuronId,
    value: Math.round(value * fixedPointScale),
  }));
  const quantizedWeights = Object.fromEntries(
    model.classes.map((label) => [
      label,
      model.weights[label].map((value) => Math.round(value * fixedPointScale)),
    ]),
  );
  const quantizedBias = Object.fromEntries(
    model.classes.map((label) => [
      label,
      Math.round(model.bias[label] * fixedPointScale * fixedPointScale),
    ]),
  );
  const expectedScores = Object.fromEntries(
    model.classes.map((label) => {
      let score = quantizedBias[label];
      for (const event of quantizedEvents) {
        score += event.value * quantizedWeights[label][event.index];
      }
      return [label, score];
    }),
  );
  const maxAbsScore = Math.max(...Object.values(expectedScores).map((value) => Math.abs(value)));

  return {
    schema: "neurofhe.openfhe.bfvrnsFixedPointView.v1",
    scoreDomain: "signed-fixed-point-integers",
    fixedPointScale,
    plaintextModulus,
    activeEvents: quantizedEvents,
    weights: quantizedWeights,
    bias: quantizedBias,
    expectedPlaintextScores: expectedScores,
    expectedClassification: argmax(expectedScores),
    maxAbsScore,
    scoreFitsCenteredPlaintextModulus: maxAbsScore < plaintextModulus / 2,
    caveat:
      "BFVrns uses this fixed-point integer view for integration evidence; CKKS consumes the approximate-real values directly.",
  };
}

function rowsToSparseWindows(rows, normalizer, options = {}) {
  const windowSize = options.windowSize ?? 8;
  const stride = options.stride ?? windowSize;
  const channelIndices = selectedChannels(options);
  const activePerTimestep = activePerTimestepFor(options);
  const windows = [];

  for (let start = 0; start + windowSize <= rows.length; start += stride) {
    const slice = rows.slice(start, start + windowSize);
    const vector = Array(windowSize * channelIndices.length).fill(0);
    const activeEvents = [];
    for (let time = 0; time < slice.length; time += 1) {
      const ranked = channelIndices
        .map((channelIndex, localChannel) => {
          const z = normalizeValue(slice[time].features[channelIndex], normalizer, channelIndex);
          return {
            index: time * channelIndices.length + localChannel,
            timeBin: time,
            neuronId: localChannel,
            channel: EEG_EYE_STATE_CHANNELS[channelIndex],
            value: round(z, 6),
            magnitude: Math.abs(z),
          };
        })
        .sort((left, right) =>
          right.magnitude === left.magnitude
            ? left.index - right.index
            : right.magnitude - left.magnitude,
        )
        .slice(0, activePerTimestep)
        .sort((left, right) => left.index - right.index);

      for (const event of ranked) {
        vector[event.index] = event.value;
        activeEvents.push({
          index: event.index,
          timeBin: event.timeBin,
          neuronId: event.neuronId,
          channel: event.channel,
          value: event.value,
        });
      }
    }

    windows.push({
      label: majorityLabel(slice),
      rowStart: slice[0].index,
      rowEnd: slice.at(-1).index,
      featureShape: [windowSize, channelIndices.length],
      flatteningOrder: "time-major-selected-eeg-channel-minor",
      vector,
      activeEvents,
      sparsity: {
        activeEventCount: activeEvents.length,
        nonZeroFeatures: vector.reduce((sum, value) => sum + (value === 0 ? 0 : 1), 0),
        density: activeEvents.length / vector.length,
      },
    });
  }

  return windows;
}

function trainCentroidSparseLinearClassifier(windows) {
  if (windows.length === 0) {
    throw new Error("cannot train EEG baseline without windows");
  }
  const classes = [...new Set(windows.map((window) => window.label))].sort();
  const featureCount = windows[0].vector.length;
  const centroids = Object.fromEntries(
    classes.map((label) => [label, Array(featureCount).fill(0)]),
  );
  const counts = Object.fromEntries(classes.map((label) => [label, 0]));

  for (const window of windows) {
    counts[window.label] += 1;
    window.vector.forEach((value, index) => {
      centroids[window.label][index] += value;
    });
  }

  for (const label of classes) {
    centroids[label] = centroids[label].map((sum) => sum / counts[label]);
  }

  return {
    schema: "neurofhe.eegEyeState.centroidLinearModel.v1",
    classifier: "nearest-centroid-linear",
    classes,
    featureShape: windows[0].featureShape,
    flatteningOrder: windows[0].flatteningOrder,
    matrixOrientation: "rows-are-classes-columns-are-features",
    matrixShape: [classes.length, featureCount],
    scoreEquation: "argmax(2 * centroid dot x - centroid norm squared)",
    weights: Object.fromEntries(
      classes.map((label) => [label, centroids[label].map((value) => 2 * value)]),
    ),
    bias: Object.fromEntries(
      classes.map((label) => [
        label,
        -centroids[label].reduce((sum, value) => sum + value * value, 0),
      ]),
    ),
    trainingWindows: windows.length,
  };
}

function evaluateSparseLinearClassifier(model, windows) {
  let correct = 0;
  const predictions = windows.map((window) => {
    const scores = scoreSparseWindow(model, window);
    const predicted = argmax(scores);
    if (predicted === window.label) correct += 1;
    return {
      label: window.label,
      predicted,
      scores: Object.fromEntries(
        Object.entries(scores).map(([label, value]) => [label, round(value, 6)]),
      ),
      activeEventCount: window.sparsity.activeEventCount,
      nonZeroFeatures: window.sparsity.nonZeroFeatures,
    };
  });

  return {
    schema: "neurofhe.eegEyeState.evaluation.v1",
    total: windows.length,
    correct,
    accuracy: windows.length === 0 ? 0 : correct / windows.length,
    predictions,
    averageActiveEvents: average(predictions.map((prediction) => prediction.activeEventCount)),
    averageNonZeroFeatures: average(predictions.map((prediction) => prediction.nonZeroFeatures)),
  };
}

function scoreSparseWindow(model, window) {
  return Object.fromEntries(
    model.classes.map((label) => [
      label,
      model.bias[label] + dot(window.vector, model.weights[label]),
    ]),
  );
}

function splitChronological(rows, trainFraction) {
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error("EEG Eye State baseline requires at least two rows");
  }
  if (!(trainFraction > 0 && trainFraction < 1)) {
    throw new Error("trainFraction must be greater than 0 and less than 1");
  }
  const splitIndex = Math.max(1, Math.min(rows.length - 1, Math.floor(rows.length * trainFraction)));
  return {
    trainRows: rows.slice(0, splitIndex),
    testRows: rows.slice(splitIndex),
    trainFraction,
  };
}

function fitEegNormalizer(rows, selectedChannelIndices) {
  const means = {};
  const stddevs = {};
  for (const channelIndex of selectedChannelIndices) {
    const values = rows.map((row) => row.features[channelIndex]);
    const mean = average(values);
    const variance = average(values.map((value) => (value - mean) ** 2));
    means[channelIndex] = mean;
    stddevs[channelIndex] = Math.sqrt(variance) || 1;
  }
  return { means, stddevs };
}

function normalizeValue(value, normalizer, channelIndex) {
  return (value - normalizer.means[channelIndex]) / normalizer.stddevs[channelIndex];
}

function buildPreprocessingSummary({
  rows,
  split,
  normalizer,
  options,
  selectedChannelIndices,
}) {
  return {
    schema: "neurofhe.eegEyeState.preprocessing.v1",
    rowCount: rows.length,
    trainRows: split.trainRows.length,
    testRows: split.testRows.length,
    split: "chronological",
    trainFraction: split.trainFraction,
    windowSize: options.windowSize ?? 8,
    stride: options.stride ?? (options.windowSize ?? 8),
    selectedChannels: selectedChannelIndices.map((index) => EEG_EYE_STATE_CHANNELS[index]),
    channelSelection:
      "first N UCI EEG channels by ARFF order; tune this before any model-quality claim",
    normalization: "z-score using training split only",
    normalizerDigest: {
      meanRange: range(Object.values(normalizer.means)),
      stddevRange: range(Object.values(normalizer.stddevs)),
    },
    activeEventSelection:
      "top absolute z-score channels per timestep, preserving signed z-score as active value",
  };
}

function selectedChannels(options = {}) {
  const channelCount = channelCountFor(options);
  return Array.from({ length: channelCount }, (_, index) => index);
}

function channelCountFor(options = {}) {
  return Math.min(
    EEG_EYE_STATE_CHANNELS.length,
    Math.max(1, options.channelCount ?? 8),
  );
}

function activePerTimestepFor(options = {}) {
  return Math.min(channelCountFor(options), Math.max(1, options.activePerTimestep ?? 4));
}

function featureShapeFor(options = {}) {
  return [options.windowSize ?? 8, channelCountFor(options)];
}

function featureCountFor(options = {}) {
  return featureShapeFor(options).reduce((product, value) => product * value, 1);
}

function majorityLabel(rows) {
  const counts = rows.reduce((acc, row) => {
    acc[row.label] = (acc[row.label] ?? 0) + 1;
    return acc;
  }, {});
  const labels = Object.keys(counts).sort();
  return labels.reduce((best, label) => {
    if (counts[label] > counts[best]) return label;
    if (counts[label] === counts[best]) return rows.at(-1).label;
    return best;
  }, labels[0]);
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

function argmax(scores) {
  return Object.entries(scores).reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )[0];
}

function dot(values, weights) {
  return values.reduce((sum, value, index) => sum + value * weights[index], 0);
}

function parseNumericColumn(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`invalid numeric value for ${name}: ${value}`);
  }
  return number;
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function range(values) {
  return {
    min: round(Math.min(...values), 6),
    max: round(Math.max(...values), 6),
  };
}

function roundScoreObject(scores) {
  return Object.fromEntries(
    Object.entries(scores).map(([label, value]) => [label, round(value, 6)]),
  );
}

function round(value, places = 6) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
