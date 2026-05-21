// SPDX-License-Identifier: CC0-1.0

import { activeEvents, buildSparseEventWindow } from "./events.mjs";

const DEFAULT_WINDOW_US = 50_000;
const DEFAULT_TIME_BINS = 8;
const DEFAULT_SPATIAL_BINS = [4, 2];
const DEFAULT_THRESHOLD = 50;
const DEFAULT_REFRACTORY_US = 100;
const DEFAULT_MAX_COUNT_PER_BIN = 3;

export function buildSimulatedRawNeuralFrame(options = {}) {
  const eventWindow = options.eventWindow ?? buildSparseEventWindow();
  const windowUs = options.windowUs ?? DEFAULT_WINDOW_US;
  const electrodeMap = options.electrodeMap ?? buildCanonicalElectrodeMap();
  const binUs = Math.floor(windowUs / eventWindow.timesteps);
  let sampleIndex = 0;

  const rawNeuralSamples = activeEvents(eventWindow).flatMap((event) =>
    Array.from({ length: event.value }, () => ({
      sampleId: `sample-${String(sampleIndex++).padStart(3, "0")}`,
      electrodeId: `electrode-${event.channel}`,
      timestampUs: event.time * binUs + 100,
      amplitude: options.amplitude ?? 90,
      polarity: 1,
    })),
  );

  return {
    schema: "neurofhe.rawNeuralFrame.v1",
    observedAt: options.observedAt ?? "2026-05-21T00:00:00.000Z",
    windowUs,
    sampleEncoding: "thresholded-integer-amplitude-demo",
    electrodeMap,
    rawNeuralSamples,
    acquisitionCaveat:
      "Synthetic raw neural-like samples for architecture testing only; not clinical data.",
  };
}

export function buildCanonicalElectrodeMap(options = {}) {
  const spatialBins = options.spatialBins ?? DEFAULT_SPATIAL_BINS;
  const [width, height] = spatialBins;

  return Array.from({ length: width * height }, (_, unitId) => ({
    electrodeId: `electrode-${unitId}`,
    unitId,
    unitX: unitId % width,
    unitY: Math.floor(unitId / width),
  }));
}

export function sortSpatialSpikes(rawNeuralFrame, options = {}) {
  const config = buildSorterConfig(rawNeuralFrame, options);
  const [spatialWidth, spatialHeight] = config.spatialBins;
  const channelCount = spatialWidth * spatialHeight;
  const values = Array.from({ length: config.timeBins }, () => Array(channelCount).fill(0));
  const electrodeById = new Map(
    (rawNeuralFrame?.electrodeMap ?? []).map((electrode) => [electrode.electrodeId, electrode]),
  );
  const lastAcceptedByUnit = new Map();
  const sortedSpikes = [];
  const droppedSamples = [];
  const rawSamples = Array.isArray(rawNeuralFrame?.rawNeuralSamples)
    ? rawNeuralFrame.rawNeuralSamples
    : [];

  rawSamples
    .map((sample, originalIndex) => ({ sample, originalIndex }))
    .sort((left, right) => {
      const leftTime = Number.isInteger(left.sample?.timestampUs)
        ? left.sample.timestampUs
        : Number.MAX_SAFE_INTEGER;
      const rightTime = Number.isInteger(right.sample?.timestampUs)
        ? right.sample.timestampUs
        : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime || left.originalIndex - right.originalIndex;
    })
    .forEach(({ sample, originalIndex }) => {
      const decision = classifySample(sample, originalIndex, electrodeById, config);
      if (decision.dropReason) {
        droppedSamples.push(decision.dropReason);
        return;
      }

      const { unitId, unitX, unitY, timeBin } = decision;
      const lastAcceptedAt = lastAcceptedByUnit.get(unitId);
      if (
        Number.isInteger(lastAcceptedAt) &&
        sample.timestampUs - lastAcceptedAt < config.refractoryUs
      ) {
        droppedSamples.push(drop(originalIndex, "refractory-window", sample));
        return;
      }

      if (values[timeBin][unitId] >= config.maxCountPerBin) {
        droppedSamples.push(drop(originalIndex, "bin-saturation", sample));
        return;
      }

      values[timeBin][unitId] += 1;
      lastAcceptedByUnit.set(unitId, sample.timestampUs);
      sortedSpikes.push({
        timeBin,
        unitId,
        unitX,
        unitY,
        value: 1,
      });
    });

  return {
    schema: "neurofhe.encoder.spatialSpikeSorter.v1",
    encoder: {
      id: "canonical-spatial-aware-spike-sorter-v1",
      implementationTarget: "fpga-or-edge-fsm",
      algorithm:
        "integer threshold, electrode-to-spatial-bin lookup, per-unit refractory gate, count accumulation",
      productionClaim: false,
    },
    config,
    eventWindow: {
      schema: "neurofhe.events.v1.spatial-sorter",
      windowMs: Math.round(config.windowUs / 1000),
      timesteps: config.timeBins,
      channels: channelCount,
      spatialBins: [...config.spatialBins],
      encoding: "spatial-binned-spike-count",
      values,
    },
    sortedSpikes,
    droppedSamples,
    metrics: {
      inputSampleCount: rawSamples.length,
      sortedSpikeCount: sortedSpikes.length,
      droppedSampleCount: droppedSamples.length,
    },
    caveat:
      "Deterministic simulated sorter only; real neural sorting requires lawful data rights, calibration, validation, and hardware review.",
  };
}

function buildSorterConfig(rawNeuralFrame, options) {
  return {
    schema: "neurofhe.encoder.spatialSpikeSorter.config.v1",
    timeBins: options.timeBins ?? DEFAULT_TIME_BINS,
    windowUs: options.windowUs ?? rawNeuralFrame?.windowUs ?? DEFAULT_WINDOW_US,
    spatialBins: options.spatialBins ?? DEFAULT_SPATIAL_BINS,
    amplitudeThreshold: options.amplitudeThreshold ?? DEFAULT_THRESHOLD,
    refractoryUs: options.refractoryUs ?? DEFAULT_REFRACTORY_US,
    maxCountPerBin: options.maxCountPerBin ?? DEFAULT_MAX_COUNT_PER_BIN,
    edgeImplementationNotes: [
      "fixed electrode-to-bin lookup table",
      "integer threshold compare",
      "per-unit last-timestamp register",
      "bounded per-bin saturating counter",
    ],
  };
}

function classifySample(sample, originalIndex, electrodeById, config) {
  if (!sample || typeof sample !== "object") {
    return { dropReason: drop(originalIndex, "invalid-sample", sample) };
  }
  if (!Number.isInteger(sample.timestampUs) || sample.timestampUs < 0) {
    return { dropReason: drop(originalIndex, "invalid-timestamp", sample) };
  }
  if (sample.timestampUs >= config.windowUs) {
    return { dropReason: drop(originalIndex, "outside-window", sample) };
  }
  if (!Number.isInteger(sample.amplitude)) {
    return { dropReason: drop(originalIndex, "invalid-amplitude", sample) };
  }
  if (Math.abs(sample.amplitude) < config.amplitudeThreshold) {
    return { dropReason: drop(originalIndex, "below-threshold", sample) };
  }

  const electrode = electrodeById.get(sample.electrodeId);
  if (!electrode) {
    return { dropReason: drop(originalIndex, "unknown-electrode", sample) };
  }

  const unit = electrodeUnit(electrode, config.spatialBins);
  if (!unit) {
    return { dropReason: drop(originalIndex, "invalid-electrode-unit", sample) };
  }

  return {
    ...unit,
    timeBin: Math.min(
      config.timeBins - 1,
      Math.floor((sample.timestampUs * config.timeBins) / config.windowUs),
    ),
  };
}

function electrodeUnit(electrode, spatialBins) {
  const [width, height] = spatialBins;
  const unitId = Number.isInteger(electrode.unitId)
    ? electrode.unitId
    : spatialUnitId(electrode.unitX, electrode.unitY, width);
  if (!Number.isInteger(unitId) || unitId < 0 || unitId >= width * height) return null;

  const unitX = Number.isInteger(electrode.unitX) ? electrode.unitX : unitId % width;
  const unitY = Number.isInteger(electrode.unitY) ? electrode.unitY : Math.floor(unitId / width);
  if (unitX < 0 || unitX >= width || unitY < 0 || unitY >= height) return null;

  return { unitId, unitX, unitY };
}

function spatialUnitId(unitX, unitY, width) {
  if (!Number.isInteger(unitX) || !Number.isInteger(unitY)) return null;
  return unitY * width + unitX;
}

function drop(originalIndex, reason, sample) {
  return {
    originalIndex,
    reason,
    sampleId: sample?.sampleId ?? null,
  };
}
