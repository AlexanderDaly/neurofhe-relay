#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0
//
// First Riemannian move against the existing EEG Eye State contract:
// same chronological split, longer windows, OAS-shrunk covariance,
// flatten (and log-Euclidean chart), same nearest-centroid scorer
// `scores = W x + bias` that the CKKS lane is bound to.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  EEG_EYE_STATE_CHANNELS,
  EEG_EYE_STATE_PROVENANCE,
  loadOrFetchEegEyeStateRows,
  runEegEyeStatePlaintextBaseline,
} from "./lib/eeg-eye-state.mjs";

const TRAIN_FRACTION = 0.7;
const CHANNEL_COUNTS = [8, 14];
const WINDOWS = [128, 256];
const CLIP_PERCENTILES = [0.01, 0.99];

const args = parseArgs(process.argv.slice(2));

const { rows, source } = await loadOrFetchEegEyeStateRows({
  fetch: true,
  cacheDir: args["cache-dir"] ?? ".cache/neurofhe/eeg-eye-state",
  datasetPath: args.dataset,
});

const split = splitChronological(rows, TRAIN_FRACTION);
const startedAt = Date.now();

const currentBaseline = runEegEyeStatePlaintextBaseline({
  rows,
  options: {
    trainFraction: TRAIN_FRACTION,
    windowSize: 8,
    stride: 8,
    channelCount: 8,
    activePerTimestep: 4,
  },
});

const conditions = [];

conditions.push(
  summarizeExisting("sparse-z-8x8", currentBaseline, {
    windowSize: 8,
    stride: 8,
    channelCount: 8,
    encoder: "top-k-abs-z-per-timestep",
  }),
);

for (const channelCount of CHANNEL_COUNTS) {
  for (const windowSize of WINDOWS) {
    const stride = windowSize;
    conditions.push(
      runCondition({
        id: `mean-z-${windowSize}-ch${channelCount}`,
        split,
        channelCount,
        windowSize,
        stride,
        clip: true,
        encoder: "window-mean-z",
      }),
    );
    conditions.push(
      runCondition({
        id: `diag-var-${windowSize}-ch${channelCount}`,
        split,
        channelCount,
        windowSize,
        stride,
        clip: true,
        encoder: "diag-var",
      }),
    );
    conditions.push(
      runCondition({
        id: `vech-cov-${windowSize}-ch${channelCount}`,
        split,
        channelCount,
        windowSize,
        stride,
        clip: true,
        encoder: "vech-cov",
      }),
    );
    conditions.push(
      runCondition({
        id: `vech-logcov-${windowSize}-ch${channelCount}`,
        split,
        channelCount,
        windowSize,
        stride,
        clip: true,
        encoder: "vech-logcov",
      }),
    );
  }
}

const focused = [
  { id: "vech-cov-128-ch8-alpha", channelCount: 8, windowSize: 128, stride: 128, encoder: "vech-cov", band: [8, 12] },
  { id: "vech-logcov-128-ch8-alpha", channelCount: 8, windowSize: 128, stride: 128, encoder: "vech-logcov", band: [8, 12] },
  { id: "vech-cov-128-ch14-alpha", channelCount: 14, windowSize: 128, stride: 128, encoder: "vech-cov", band: [8, 12] },
  { id: "vech-logcov-128-ch14-alpha", channelCount: 14, windowSize: 128, stride: 128, encoder: "vech-logcov", band: [8, 12] },
  { id: "vech-cov-128-ch8-alpha-s32", channelCount: 8, windowSize: 128, stride: 32, encoder: "vech-cov", band: [8, 12] },
  { id: "vech-logcov-128-ch8-alpha-s32", channelCount: 8, windowSize: 128, stride: 32, encoder: "vech-logcov", band: [8, 12] },
  { id: "vech-cov-128-ch14-alpha-s32", channelCount: 14, windowSize: 128, stride: 32, encoder: "vech-cov", band: [8, 12] },
  { id: "vech-logcov-128-ch14-alpha-s32", channelCount: 14, windowSize: 128, stride: 32, encoder: "vech-logcov", band: [8, 12] },
  { id: "vech-cov-128-ch8-8-30", channelCount: 8, windowSize: 128, stride: 32, encoder: "vech-cov", band: [8, 30] },
  { id: "vech-logcov-128-ch8-8-30", channelCount: 8, windowSize: 128, stride: 32, encoder: "vech-logcov", band: [8, 30] },
  { id: "alpha-power-O1O2-128-s32", channelCount: 8, windowSize: 128, stride: 32, encoder: "alpha-power", band: [8, 12] },
  { id: "mean-z-128-ch8-s32", channelCount: 8, windowSize: 128, stride: 32, encoder: "window-mean-z", band: null },
];
for (const spec of focused) {
  conditions.push(
    runCondition({
      ...spec,
      split,
      clip: true,
    }),
  );
}

conditions.push(
  runCondition({
    id: "vech-cov-128-ch14-noclip",
    split,
    channelCount: 14,
    windowSize: 128,
    stride: 128,
    clip: false,
    encoder: "vech-cov",
  }),
);
conditions.push(
  runCondition({
    id: "sparse-z-128-ch8",
    split,
    channelCount: 8,
    windowSize: 128,
    stride: 128,
    clip: true,
    encoder: "sparse-z",
    activePerTimestep: 4,
  }),
);

const ranked = [...conditions].sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);
const bestGeometry = conditions.find((c) => c.id.startsWith("vech-"));
const geometryWinner =
  conditions
    .filter((c) => c.encoder === "vech-cov" || c.encoder === "vech-logcov")
    .sort((a, b) => b.metrics.accuracy - a.metrics.accuracy)[0] ?? bestGeometry;

const ckksContract = emitCkksContract(geometryWinner);
const publicConditions = conditions.map(publicCondition);
const publicRanked = ranked.map((c) => ({
  id: c.id,
  accuracy: c.metrics.accuracy,
  correct: `${c.metrics.correct}/${c.metrics.total}`,
  featureCount: c.featureCount,
  majorityTestAccuracy: c.baselines.majorityTestLabel,
  beatMajorityTest: c.metrics.accuracy > c.baselines.majorityTestLabel + 1e-12,
  beatCurrent: c.metrics.accuracy > currentBaseline.metrics.accuracy + 1e-12,
}));
const report = {
  schema: "neurofhe.eegSpdExperiment.v1",
  hypothesis:
    "Same chronological EEG Eye State split. Longer windows. OAS-shrunk covariance, flattened (and log-Euclidean), scored with the existing nearest-centroid CKKS contract scores = W x + bias. If the coin-flip baseline becomes a classifier, geometry won.",
  dataset: EEG_EYE_STATE_PROVENANCE,
  source,
  split: {
    kind: "chronological",
    trainFraction: TRAIN_FRACTION,
    rows: rows.length,
    trainRows: split.trainRows.length,
    testRows: split.testRows.length,
    trainLabels: countLabels(split.trainRows),
    testLabels: countLabels(split.testRows),
    labelShift:
      "Train is majority eye-closed; test is majority eye-open. A train-prior classifier fails on test. Features have to track the signal.",
  },
  currentBaseline: {
    id: "sparse-z-8x8",
    accuracy: currentBaseline.metrics.accuracy,
    correct: currentBaseline.metrics.correct,
    total: currentBaseline.metrics.total,
    confusion: currentBaseline.confusion,
    eventRepresentation: currentBaseline.eventRepresentation,
  },
  conditions: publicConditions,
  ranking: publicRanked,
  verdict: buildVerdict(currentBaseline, geometryWinner, ranked[0]),
  ckks: {
    scheme: "openfhe-ckks",
    scoreEquation: "scores = W x + bias",
    scoreDomain: "approximate-real",
    note:
      "Native OpenFHE is optional. The CKKS EEG lane is already bound to this circuit (committed maxAbsScoreError ~1e-11). This experiment feeds that same scorer a covariance chart instead of sparse z-scores.",
    contract: {
      sourceId: ckksContract.sourceId,
      featureCount: ckksContract.featureCount,
      matrixShape: ckksContract.matrixShape,
      activeEventCount: ckksContract.activeEventCount,
      expectedClassification: ckksContract.expectedClassification,
      expectedPlaintextScores: ckksContract.expectedPlaintextScores,
      eventRepresentation: ckksContract.eventRepresentation,
    },
  },
  latencyMs: Date.now() - startedAt,
  productionClaim: false,
};

const outDir = args.out ?? "benchmark-artifacts/spd-experiment/eeg-eye-state";
await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "latest.json"), JSON.stringify(report, null, 2));
await writeFile(
  join(outDir, "ckks-contract.json"),
  JSON.stringify(ckksContract, null, 2),
);
printTable(report);
console.log("");
console.log(JSON.stringify({ artifact: join(outDir, "latest.json"), verdict: report.verdict }, null, 2));

function runCondition({
  id,
  split,
  channelCount,
  windowSize,
  stride,
  clip,
  encoder,
  activePerTimestep = 4,
  band = null,
}) {
  const channelIndices = Array.from({ length: channelCount }, (_, i) => i);
  const clipper = clip
    ? fitClipper(split.trainRows, channelIndices, CLIP_PERCENTILES)
    : null;
  const clippedTrain = applyClip(split.trainRows, clipper);
  const clippedTest = applyClip(split.testRows, clipper);
  const normalizer = fitNormalizer(clippedTrain, channelIndices);
  const trainWindows = rowsToWindows({
    rows: clippedTrain,
    normalizer,
    channelIndices,
    windowSize,
    stride,
    encoder,
    activePerTimestep,
    band,
  });
  const testWindows = rowsToWindows({
    rows: clippedTest,
    normalizer,
    channelIndices,
    windowSize,
    stride,
    encoder,
    activePerTimestep,
    band,
  });
  const zscorer = fitFeatureZ(trainWindows);
  const trainX = trainWindows.map((w) => ({ ...w, vector: applyFeatureZ(w.vector, zscorer) }));
  const testX = testWindows.map((w) => ({ ...w, vector: applyFeatureZ(w.vector, zscorer) }));
  const model = trainCentroid(trainX);
  const evaluation = evaluate(model, testX);
  const featureCount = trainX[0]?.vector.length ?? 0;

  return {
    id,
    encoder,
    windowSize,
    stride,
    channelCount,
    channels: channelIndices.map((i) => EEG_EYE_STATE_CHANNELS[i]),
    clip,
    clipPercentiles: clip ? CLIP_PERCENTILES : null,
    band,
    samplingHz: 128,
    featureCount,
    flatteningOrder: encoderOrder(encoder),
    scoreEquation: "scores = W x + bias",
    classifier: "nearest-centroid-linear",
    ckksCompatible: true,
    metrics: {
      accuracy: round(evaluation.accuracy, 6),
      correct: evaluation.correct,
      total: evaluation.total,
      averageNonZeroFeatures: round(evaluation.averageNonZero, 6),
    },
    confusion: evaluation.confusion,
    baselines: {
      majorityTrainLabel: round(constantAccuracy(testWindows, majorityOf(trainWindows)), 6),
      majorityTestLabel: round(constantAccuracy(testWindows, majorityOf(testWindows)), 6),
      trainWindowLabels: countLabels(trainWindows),
      testWindowLabels: countLabels(testWindows),
    },
    model: {
      classes: model.classes,
      matrixShape: model.matrixShape,
      shrinkage: summaryShrinkage(trainWindows),
    },
    sample: testX[0]
      ? {
          label: testX[0].label,
          predicted: argmax(scoreWindow(model, testX[0])),
          scores: roundScores(scoreWindow(model, testX[0])),
        }
      : null,
    _model: model,
    _sample: testX[0] ?? null,
  };
}

function rowsToWindows({
  rows,
  normalizer,
  channelIndices,
  windowSize,
  stride,
  encoder,
  activePerTimestep,
  band,
}) {
  const windows = [];
  for (let start = 0; start + windowSize <= rows.length; start += stride) {
    const slice = rows.slice(start, start + windowSize);
    const zMatrix = slice.map((row) =>
      channelIndices.map((ch) => (row.features[ch] - normalizer.means[ch]) / normalizer.stddevs[ch]),
    );
    const encoded = encodeWindow(zMatrix, encoder, activePerTimestep, band, channelIndices);
    windows.push({
      label: majorityLabel(slice),
      rowStart: slice[0].index,
      rowEnd: slice.at(-1).index,
      vector: encoded.vector,
      featureShape: encoded.featureShape,
      flatteningOrder: encoded.flatteningOrder,
      shrinkage: encoded.shrinkage,
      sparsity: {
        activeEventCount: encoded.vector.filter((v) => v !== 0).length,
        nonZeroFeatures: encoded.vector.filter((v) => v !== 0).length,
      },
    });
  }
  return windows;
}

function encodeWindow(zMatrix, encoder, activePerTimestep, band, channelIndices) {
  const T = zMatrix.length;
  const n = zMatrix[0].length;
  const filtered = band ? bandpassMatrix(zMatrix, 128, band[0], band[1]) : zMatrix;
  if (encoder === "window-mean-z") {
    const vector = Array.from({ length: n }, (_, j) => mean(filtered.map((row) => row[j])));
    return { vector, featureShape: [n], flatteningOrder: "channel-mean", shrinkage: null };
  }
  if (encoder === "alpha-power") {
    const o1 = channelIndices.indexOf(6);
    const o2 = channelIndices.indexOf(7);
    const power = (j) => {
      const col = filtered.map((row) => row[j]);
      const m = mean(col);
      const v = mean(col.map((x) => (x - m) ** 2));
      return Math.log(Math.max(v, 1e-12));
    };
    const vector = [power(o1 < 0 ? n - 2 : o1), power(o2 < 0 ? n - 1 : o2)];
    return { vector, featureShape: [2], flatteningOrder: "log-alpha-power-O1-O2", shrinkage: null };
  }
  if (encoder === "sparse-z") {
    const vector = Array(T * n).fill(0);
    for (let t = 0; t < T; t += 1) {
      const ranked = zMatrix[t]
        .map((value, j) => ({ j, value, mag: Math.abs(value) }))
        .sort((a, b) => b.mag - a.mag || a.j - b.j)
        .slice(0, Math.min(activePerTimestep, n));
      for (const item of ranked) vector[t * n + item.j] = item.value;
    }
    return {
      vector,
      featureShape: [T, n],
      flatteningOrder: "time-major-channel-minor",
      shrinkage: null,
    };
  }

  const centered = centerColumns(filtered);
  const scm = sampleCovariance(centered);
  const { shrunk, shrinkage, mu } = oasShrink(scm, T);
  if (encoder === "diag-var") {
    return {
      vector: diag(shrunk),
      featureShape: [n],
      flatteningOrder: "diag-oas-variance",
      shrinkage: { shrinkage, mu },
    };
  }
  if (encoder === "vech-cov") {
    return {
      vector: vech(shrunk),
      featureShape: [n, n],
      flatteningOrder: "vech-upper-including-diagonal",
      shrinkage: { shrinkage, mu },
    };
  }
  if (encoder === "vech-logcov") {
    const logged = spdLog(shrunk);
    return {
      vector: vech(logged),
      featureShape: [n, n],
      flatteningOrder: "vech-log-euclidean",
      shrinkage: { shrinkage, mu },
    };
  }
  throw new Error(`unknown encoder ${encoder}`);
}

function bandpassMatrix(matrix, fs, loHz, hiHz) {
  const T = matrix.length;
  const n = matrix[0].length;
  const out = matrix.map((row) => row.slice());
  for (let ch = 0; ch < n; ch += 1) {
    const re = matrix.map((row) => row[ch]);
    const im = Array(T).fill(0);
    fftRadix2(re, im, false);
    const df = fs / T;
    for (let k = 0; k < T; k += 1) {
      const freq = k <= T / 2 ? k * df : (k - T) * df;
      if (Math.abs(freq) < loHz || Math.abs(freq) > hiHz) {
        re[k] = 0;
        im[k] = 0;
      }
    }
    fftRadix2(re, im, true);
    for (let t = 0; t < T; t += 1) out[t][ch] = re[t];
  }
  return out;
}

function fftRadix2(re, im, inverse) {
  const n = re.length;
  if ((n & (n - 1)) !== 0) {
    throw new Error(`FFT length must be a power of 2, got ${n}`);
  }
  let j = 0;
  for (let i = 1; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      swap(re, i, j);
      swap(im, i, j);
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let k = 0; k < len / 2; k += 1) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + len / 2] * wRe - im[i + k + len / 2] * wIm;
        const vIm = re[i + k + len / 2] * wIm + im[i + k + len / 2] * wRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nextRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nextRe;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i += 1) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

function swap(arr, i, j) {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}

function sampleCovariance(centered) {
  const T = centered.length;
  const n = centered[0].length;
  const C = zeros(n, n);
  for (const row of centered) {
    for (let i = 0; i < n; i += 1) {
      for (let j = i; j < n; j += 1) {
        C[i][j] += row[i] * row[j];
      }
    }
  }
  const scale = 1 / Math.max(1, T);
  for (let i = 0; i < n; i += 1) {
    for (let j = i; j < n; j += 1) {
      C[i][j] *= scale;
      C[j][i] = C[i][j];
    }
  }
  return C;
}

function oasShrink(empCov, nSamples) {
  const p = empCov.length;
  let fro2 = 0;
  let trace = 0;
  for (let i = 0; i < p; i += 1) {
    trace += empCov[i][i];
    for (let j = 0; j < p; j += 1) fro2 += empCov[i][j] * empCov[i][j];
  }
  const alpha = fro2 / (p * p);
  const mu = trace / p;
  const mu2 = mu * mu;
  const num = alpha + mu2;
  const den = (nSamples + 1) * (alpha - mu2 / p);
  const shrinkage = !Number.isFinite(den) || den === 0 ? 1 : Math.min(1, Math.max(0, num / den));
  const shrunk = zeros(p, p);
  for (let i = 0; i < p; i += 1) {
    for (let j = 0; j < p; j += 1) {
      shrunk[i][j] = (1 - shrinkage) * empCov[i][j];
    }
    shrunk[i][i] += shrinkage * mu;
  }
  return { shrunk, shrinkage, mu };
}

function spdLog(C) {
  const { values, vectors } = jacobiEigen(C);
  const n = C.length;
  const logged = zeros(n, n);
  for (let k = 0; k < n; k += 1) {
    const logLambda = Math.log(Math.max(values[k], 1e-12));
    for (let i = 0; i < n; i += 1) {
      for (let j = i; j < n; j += 1) {
        logged[i][j] += vectors[i][k] * logLambda * vectors[j][k];
      }
    }
  }
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) logged[j][i] = logged[i][j];
  }
  return logged;
}

function jacobiEigen(A, tol = 1e-12, maxSweeps = 64) {
  const n = A.length;
  const S = A.map((row) => row.slice());
  const V = identity(n);
  for (let sweep = 0; sweep < maxSweeps; sweep += 1) {
    let maxOff = 0;
    for (let p = 0; p < n; p += 1) {
      for (let q = p + 1; q < n; q += 1) maxOff = Math.max(maxOff, Math.abs(S[p][q]));
    }
    if (maxOff < tol) break;
    for (let p = 0; p < n; p += 1) {
      for (let q = p + 1; q < n; q += 1) {
        const apq = S[p][q];
        if (Math.abs(apq) < tol) continue;
        const app = S[p][p];
        const aqq = S[q][q];
        const tau = (aqq - app) / (2 * apq);
        const t =
          tau === 0
            ? 1
            : Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau) || 1);
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;
        rotate(S, V, p, q, c, s, n);
      }
    }
  }
  return { values: S.map((row, i) => row[i]), vectors: V };
}

function rotate(S, V, p, q, c, s, n) {
  const app = S[p][p];
  const aqq = S[q][q];
  const apq = S[p][q];
  S[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
  S[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
  S[p][q] = 0;
  S[q][p] = 0;
  for (let k = 0; k < n; k += 1) {
    if (k === p || k === q) continue;
    const akp = S[k][p];
    const akq = S[k][q];
    S[k][p] = S[p][k] = c * akp - s * akq;
    S[k][q] = S[q][k] = s * akp + c * akq;
  }
  for (let k = 0; k < n; k += 1) {
    const vkp = V[k][p];
    const vkq = V[k][q];
    V[k][p] = c * vkp - s * vkq;
    V[k][q] = s * vkp + c * vkq;
  }
}

function vech(M) {
  const n = M.length;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = i; j < n; j += 1) out.push(M[i][j]);
  }
  return out;
}

function diag(M) {
  return M.map((row, i) => row[i]);
}

function centerColumns(matrix) {
  const n = matrix[0].length;
  const means = Array.from({ length: n }, (_, j) => mean(matrix.map((row) => row[j])));
  return matrix.map((row) => row.map((value, j) => value - means[j]));
}

function trainCentroid(windows) {
  const classes = [...new Set(windows.map((w) => w.label))].sort();
  const featureCount = windows[0].vector.length;
  const sums = Object.fromEntries(classes.map((c) => [c, Array(featureCount).fill(0)]));
  const counts = Object.fromEntries(classes.map((c) => [c, 0]));
  for (const window of windows) {
    counts[window.label] += 1;
    window.vector.forEach((value, i) => {
      sums[window.label][i] += value;
    });
  }
  const centroids = Object.fromEntries(
    classes.map((c) => [c, sums[c].map((s) => s / Math.max(1, counts[c]))]),
  );
  return {
    classes,
    featureCount,
    matrixShape: [classes.length, featureCount],
    weights: Object.fromEntries(classes.map((c) => [c, centroids[c].map((v) => 2 * v)])),
    bias: Object.fromEntries(
      classes.map((c) => [c, -centroids[c].reduce((s, v) => s + v * v, 0)]),
    ),
  };
}

function evaluate(model, windows) {
  let correct = 0;
  const predictions = windows.map((window) => {
    const scores = scoreWindow(model, window);
    const predicted = argmax(scores);
    if (predicted === window.label) correct += 1;
    return { label: window.label, predicted, scores };
  });
  const confusion = Object.fromEntries(
    model.classes.map((a) => [
      a,
      Object.fromEntries(model.classes.map((b) => [b, 0])),
    ]),
  );
  for (const p of predictions) confusion[p.label][p.predicted] += 1;
  return {
    total: windows.length,
    correct,
    accuracy: windows.length === 0 ? 0 : correct / windows.length,
    confusion,
    averageNonZero: mean(windows.map((w) => w.sparsity.nonZeroFeatures)),
  };
}

function scoreWindow(model, window) {
  return Object.fromEntries(
    model.classes.map((label) => [
      label,
      model.bias[label] + dot(window.vector, model.weights[label]),
    ]),
  );
}

function emitCkksContract(condition) {
  const sample = condition._sample;
  const model = condition._model;
  const vector = sample.vector;
  const activeEvents = vector.map((value, index) => ({
    index,
    timeBin: 0,
    neuronId: index,
    value,
  }));
  const scores = scoreWindow(model, sample);
  return {
    schema: "neurofhe.openfhe.inputContract.v1",
    sourceId: `uci-eeg-eye-state-${condition.id}`,
    datasetKind: "public-uci-eeg-eye-state-arff",
    source: EEG_EYE_STATE_PROVENANCE.publicDatasetReference,
    scoreEquation: "scores = W x + bias",
    scoreDomain: "approximate-real",
    boundaryDomain: "bio-digital-event-intelligence",
    eventRepresentation: `${condition.encoder} dense covariance chart; all coordinates encrypted, no public spike positions`,
    featureShape: [vector.length],
    featureCount: vector.length,
    classes: model.classes,
    matrixShape: model.matrixShape,
    activeEventCount: activeEvents.length,
    activeEvents,
    weights: model.weights,
    bias: model.bias,
    expectedPlaintextScores: roundScores(scores),
    expectedClassification: argmax(scores),
    sample: {
      label: sample.label,
      rowStart: sample.rowStart,
      rowEnd: sample.rowEnd,
      sampleIndex: 0,
      split: "chronological-test",
      condition: condition.id,
    },
    approximationTolerance: {
      maxAbsScoreError: 0.001,
      classificationAgreementRequired: true,
    },
    productionClaim: false,
  };
}

function publicCondition(condition) {
  const { _model, _sample, ...rest } = condition;
  return rest;
}

function summarizeExisting(id, report, meta) {
  const testLabelCounts = Object.fromEntries(
    Object.entries(report.confusion).map(([label, row]) => [
      label,
      Object.values(row).reduce((s, n) => s + n, 0),
    ]),
  );
  const majorityTest = Math.max(...Object.values(testLabelCounts)) / report.metrics.total;
  return {
    id,
    encoder: meta.encoder,
    windowSize: meta.windowSize,
    stride: meta.stride,
    channelCount: meta.channelCount,
    clip: false,
    featureCount: report.matrixShape[1],
    flatteningOrder: report.flatteningOrder,
    scoreEquation: report.scoreEquation,
    classifier: report.classifier,
    ckksCompatible: true,
    metrics: {
      accuracy: report.metrics.accuracy,
      correct: report.metrics.correct,
      total: report.metrics.total,
      averageNonZeroFeatures: report.metrics.averageNonZeroFeatures,
    },
    confusion: report.confusion,
    baselines: {
      majorityTrainLabel: null,
      majorityTestLabel: round(majorityTest, 6),
      testWindowLabels: testLabelCounts,
    },
    model: { classes: Object.keys(report.confusion).sort(), matrixShape: report.matrixShape },
    sample: null,
    _model: null,
    _sample: null,
  };
}

function buildVerdict(current, geometry, best) {
  const beatCurrent = geometry.metrics.accuracy > current.metrics.accuracy + 1e-12;
  const beatMajority = geometry.metrics.accuracy > geometry.baselines.majorityTestLabel + 1e-12;
  let status;
  if (beatMajority) status = "geometry-won";
  else if (beatCurrent) status = "better-than-coin-flip-not-yet-a-classifier";
  else status = "geometry-did-not-win";
  return {
    status,
    currentAccuracy: current.metrics.accuracy,
    geometryId: geometry.id,
    geometryAccuracy: geometry.metrics.accuracy,
    geometryMajorityTest: geometry.baselines.majorityTestLabel,
    bestId: best.id,
    bestAccuracy: best.metrics.accuracy,
    beatCurrent,
    beatMajorityTest: beatMajority,
    summary:
      status === "geometry-won"
        ? `${geometry.id} lifted ${current.metrics.accuracy} → ${geometry.metrics.accuracy} and beat the test majority baseline ${geometry.baselines.majorityTestLabel}. Coin flip became a classifier.`
        : status === "better-than-coin-flip-not-yet-a-classifier"
          ? `${geometry.id} beat the 8-sample sparse encoder (${current.metrics.accuracy} → ${geometry.metrics.accuracy}) but did not beat test majority ${geometry.baselines.majorityTestLabel}. Longer windows helped; the chart is not yet doing independent work on this split.`
          : `${geometry.id} did not beat the current encoder. Covariance on this chronological split is not sufficient by itself.`,
  };
}

function fitClipper(rows, channelIndices, [lo, hi]) {
  const bounds = {};
  for (const ch of channelIndices) {
    const values = rows.map((r) => r.features[ch]).sort((a, b) => a - b);
    bounds[ch] = { lo: quantile(values, lo), hi: quantile(values, hi) };
  }
  return bounds;
}

function applyClip(rows, clipper) {
  if (!clipper) return rows;
  return rows.map((row) => ({
    ...row,
    features: row.features.map((value, ch) => {
      const bound = clipper[ch];
      if (!bound) return value;
      return Math.min(bound.hi, Math.max(bound.lo, value));
    }),
  }));
}

function fitNormalizer(rows, channelIndices) {
  const means = {};
  const stddevs = {};
  for (const ch of channelIndices) {
    const values = rows.map((r) => r.features[ch]);
    const m = mean(values);
    const v = mean(values.map((x) => (x - m) ** 2));
    means[ch] = m;
    stddevs[ch] = Math.sqrt(v) || 1;
  }
  return { means, stddevs };
}

function fitFeatureZ(windows) {
  const d = windows[0].vector.length;
  const means = Array(d).fill(0);
  for (const w of windows) w.vector.forEach((v, i) => (means[i] += v));
  for (let i = 0; i < d; i += 1) means[i] /= windows.length;
  const vars = Array(d).fill(0);
  for (const w of windows) w.vector.forEach((v, i) => (vars[i] += (v - means[i]) ** 2));
  const stddevs = vars.map((v) => Math.sqrt(v / windows.length) || 1);
  return { means, stddevs };
}

function applyFeatureZ(vector, zscorer) {
  return vector.map((v, i) => (v - zscorer.means[i]) / zscorer.stddevs[i]);
}

function splitChronological(rows, trainFraction) {
  const splitIndex = Math.max(1, Math.min(rows.length - 1, Math.floor(rows.length * trainFraction)));
  return {
    trainRows: rows.slice(0, splitIndex),
    testRows: rows.slice(splitIndex),
    trainFraction,
  };
}

function majorityLabel(rows) {
  const counts = countLabels(rows);
  const labels = Object.keys(counts).sort();
  return labels.reduce((best, label) => {
    if (counts[label] > counts[best]) return label;
    if (counts[label] === counts[best]) return rows.at(-1).label;
    return best;
  }, labels[0]);
}

function majorityOf(windows) {
  const counts = countLabels(windows);
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function constantAccuracy(windows, label) {
  if (windows.length === 0) return 0;
  return windows.filter((w) => w.label === label).length / windows.length;
}

function countLabels(items) {
  return items.reduce((acc, item) => {
    acc[item.label] = (acc[item.label] ?? 0) + 1;
    return acc;
  }, {});
}

function summaryShrinkage(windows) {
  const values = windows.map((w) => w.shrinkage?.shrinkage).filter((v) => Number.isFinite(v));
  if (values.length === 0) return null;
  return { mean: round(mean(values), 6), min: round(Math.min(...values), 6), max: round(Math.max(...values), 6) };
}

function encoderOrder(encoder) {
  return {
    "window-mean-z": "channel-mean",
    "alpha-power": "log-alpha-power-O1-O2",
    "sparse-z": "time-major-channel-minor",
    "diag-var": "diag-oas-variance",
    "vech-cov": "vech-upper-including-diagonal",
    "vech-logcov": "vech-log-euclidean",
  }[encoder];
}

function printTable(report) {
  const rows = report.ranking.map((r) => {
    const full = report.conditions.find((c) => c.id === r.id);
    return {
      id: r.id,
      acc: r.accuracy.toFixed(4),
      n: `${full.metrics.correct}/${full.metrics.total}`,
      dim: String(r.featureCount),
      vsMaj: r.beatMajorityTest ? "YES" : "no",
      vs8: r.beatCurrent ? "YES" : "no",
    };
  });
  console.log("");
  console.log("EEG Eye State · chronological 70/30 · nearest-centroid W x + bias");
  console.log(
    `train labels ${JSON.stringify(report.split.trainLabels)}  test labels ${JSON.stringify(report.split.testLabels)}`,
  );
  console.log("");
  const header = ["condition".padEnd(28), "acc".padStart(7), "n".padStart(9), "dim".padStart(5), " >maj".padStart(6), " >8sm".padStart(6)];
  console.log(header.join("  "));
  console.log("-".repeat(70));
  for (const row of rows) {
    console.log(
      [row.id.padEnd(28), row.acc.padStart(7), row.n.padStart(9), row.dim.padStart(5), row.vsMaj.padStart(6), row.vs8.padStart(6)].join("  "),
    );
  }
  console.log("");
  console.log(report.verdict.summary);
}

function zeros(n, m) {
  return Array.from({ length: n }, () => Array(m).fill(0));
}
function identity(n) {
  const I = zeros(n, n);
  for (let i = 0; i < n; i += 1) I[i][i] = 1;
  return I;
}
function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}
function argmax(scores) {
  return Object.entries(scores).reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}
function round(value, places = 6) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}
function roundScores(scores) {
  return Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, round(v, 6)]));
}
function quantile(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) out[key] = "true";
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}
