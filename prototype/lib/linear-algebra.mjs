// SPDX-License-Identifier: CC0-1.0

export function buildDemoLinearModel(options = {}) {
  const featureCount = options.featureCount ?? 64;
  const channels = options.channels ?? 8;
  const timesteps = featureCount / channels;
  if (!Number.isInteger(timesteps)) {
    throw new Error("featureCount must divide evenly by channels");
  }

  const weights = makeDemoWeights(featureCount, channels);
  const classes = Object.keys(weights);
  return {
    schema: "neurofhe.linearModel.v1",
    type: "non-negative linear spike-count classifier",
    classes,
    featureShape: [timesteps, channels],
    flatteningOrder: "time-major-channel-minor",
    matrixOrientation: "rows-are-classes-columns-are-features",
    matrixShape: [classes.length, featureCount],
    scoreEquation: "scores = W x + bias",
    scoreDomain: "non-negative-integers",
    weights,
    bias: Object.fromEntries(classes.map((label) => [label, 0])),
  };
}

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

export function validateLinearModel(model, featureCount) {
  const errors = [];
  if (!model || typeof model !== "object") return ["linear model must be an object"];
  if (!Array.isArray(model.classes) || model.classes.length === 0) {
    errors.push("classes must be a non-empty array");
    return errors;
  }
  if (!model.weights || typeof model.weights !== "object") {
    errors.push("weights must be an object keyed by class");
    return errors;
  }

  for (const label of model.classes) {
    const row = model.weights[label];
    if (!Array.isArray(row)) {
      errors.push(`weights.${label} must be an array`);
    } else if (row.length !== featureCount) {
      errors.push(`weights.${label} length ${row.length} does not match feature count ${featureCount}`);
    }
    if (!model.bias || typeof model.bias[label] !== "number") {
      errors.push(`bias missing value for class ${label}`);
    }
  }

  if (
    Array.isArray(model.matrixShape) &&
    (model.matrixShape[0] !== model.classes.length || model.matrixShape[1] !== featureCount)
  ) {
    errors.push(`matrixShape ${model.matrixShape.join("x")} does not match classes/features`);
  }

  return errors;
}

export function denseMatVec(model, vector) {
  const errors = validateLinearModel(model, vector.length);
  if (errors.length) throw new Error(`invalid linear model: ${errors.join("; ")}`);
  return Object.fromEntries(
    model.classes.map((label) => [
      label,
      model.bias[label] + dot(vector, model.weights[label]),
    ]),
  );
}

export function sparseMatVec(model, events) {
  const featureCount = model.matrixShape?.[1] ?? inferFeatureCount(model);
  const errors = validateLinearModel(model, featureCount);
  if (errors.length) throw new Error(`invalid linear model: ${errors.join("; ")}`);
  return Object.fromEntries(
    model.classes.map((label) => [
      label,
      events.reduce(
        (sum, event) => sum + event.value * model.weights[label][event.index],
        model.bias[label],
      ),
    ]),
  );
}

export function publicModelSummary(model, activeEventCount = undefined) {
  return {
    schema: model.schema,
    type: model.type,
    classes: model.classes,
    featureShape: model.featureShape,
    flatteningOrder: model.flatteningOrder,
    matrixOrientation: model.matrixOrientation,
    matrixShape: model.matrixShape,
    scoreEquation: model.scoreEquation,
    biasPublic: true,
    activeEventCount,
  };
}

function dot(values, weights) {
  return values.reduce((sum, value, index) => sum + value * weights[index], 0);
}

function inferFeatureCount(model) {
  const firstClass = model.classes?.[0];
  return Array.isArray(model.weights?.[firstClass]) ? model.weights[firstClass].length : 0;
}
