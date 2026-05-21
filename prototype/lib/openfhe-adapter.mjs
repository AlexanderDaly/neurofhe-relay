// SPDX-License-Identifier: CC0-1.0

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";

import { classifyScores } from "./classifier.mjs";
import {
  buildFramingGuardrail,
  buildPackedVectorPlanningNotes,
  buildPrivacyModeDecision,
  buildPublicActiveNeuronPrivacyMode,
} from "./benchmark.mjs";
import { activeEvents, buildSparseEventWindow, flattenEventWindow } from "./events.mjs";
import { buildDemoLinearModel, sparseMatVec } from "./linear-algebra.mjs";
import {
  buildSimulatedRawNeuralFrame,
  sortSpatialSpikes,
} from "./spike-sorter.mjs";

const DEFAULT_OPENFHE_ROOTS = [
  "/opt/homebrew",
  "/usr/local",
  "/usr",
  "/opt/openfhe",
  "/usr/local/openfhe",
];

export function buildOpenFheDemoContract(options = {}) {
  const sourceEventWindow = options.eventWindow ?? buildSparseEventWindow();
  const sorted =
    options.sortedEvent ??
    sortSpatialSpikes(
      options.rawNeuralFrame ??
        buildSimulatedRawNeuralFrame({
          eventWindow: sourceEventWindow,
        }),
      options.spatialSorterOptions ?? {},
    );
  const eventWindow = options.sortedEventWindow ?? sorted.eventWindow;
  const vector = flattenEventWindow(eventWindow);
  const activeEventRows = activeEvents(eventWindow);
  const eventList = activeEventRows.map(({ index, value }) => ({ index, value }));
  const model =
    options.model ??
    buildDemoLinearModel({ featureCount: vector.length, channels: eventWindow.channels });
  const scores = sparseMatVec(model, eventList);
  const privacyMode = buildPublicActiveNeuronPrivacyMode(eventList.length, model.classes.length);

  return {
    schema: "neurofhe.openfhe.contract.v1",
    scheme: "openfhe-bfvrns",
    scoreEquation: model.scoreEquation,
    scoreDomain: "non-negative-integers",
    boundaryDomain: "bio-digital-event-intelligence",
    eventRepresentation: "spatial-sorted-events",
    encoder: {
      id: sorted.encoder.id,
      schema: sorted.schema,
      implementationTarget: sorted.encoder.implementationTarget,
      outputSchema: eventWindow.schema,
      productionClaim: false,
    },
    eventSchema: eventWindow.schema,
    encoding: eventWindow.encoding,
    spatialBins: Array.isArray(eventWindow.spatialBins) ? [...eventWindow.spatialBins] : null,
    windowMs: eventWindow.windowMs,
    privacyMode,
    featureShape: model.featureShape,
    featureCount: vector.length,
    classes: [...model.classes],
    matrixShape: [...model.matrixShape],
    activeEventCount: eventList.length,
    publicActiveNeuronPositions: activeEventRows.map((event) =>
      publicActiveNeuronPosition(event, eventWindow.spatialBins),
    ),
    activeEvents: eventList,
    weights: cloneClassRows(model.classes, model.weights),
    bias: Object.fromEntries(model.classes.map((label) => [label, model.bias[label]])),
    expectedPlaintextScores: scores,
    expectedClassification: classifyScores(scores),
    productionClaim: false,
  };
}

export function validateOpenFheContract(contract) {
  const errors = [];
  if (!contract || typeof contract !== "object") {
    return ["OpenFHE contract must be an object"];
  }

  const classes = Array.isArray(contract.classes) ? contract.classes : [];
  if (!classes.length) {
    errors.push("classes must be a non-empty array");
    return errors;
  }

  const featureCount = inferFeatureCount(contract);
  if (!Number.isInteger(featureCount) || featureCount <= 0) {
    errors.push("featureCount must be a positive integer");
  }

  if (
    Array.isArray(contract.matrixShape) &&
    Number.isInteger(featureCount) &&
    (contract.matrixShape[0] !== classes.length || contract.matrixShape[1] !== featureCount)
  ) {
    errors.push(`matrixShape ${contract.matrixShape.join("x")} does not match classes/features`);
  }

  validateActiveEvents(contract.activeEvents, featureCount, errors);
  validatePublicActiveNeuronPositions(
    contract.publicActiveNeuronPositions,
    contract.activeEvents,
    featureCount,
    errors,
  );
  validateWeights(contract.weights, classes, featureCount, errors);
  validateBias(contract.bias, classes, errors);
  validateOpenFhePrivacyMode(contract.privacyMode, errors);

  return errors;
}

export function detectOpenFhe(options = {}) {
  const env = options.env ?? process.env;
  const roots = options.roots ?? DEFAULT_OPENFHE_ROOTS;
  const candidates = openFheConfigCandidates(env, roots);

  for (const candidate of candidates) {
    if (hasOpenFheConfig(candidate)) {
      return {
        available: true,
        cmakeConfigDir: candidate,
      };
    }
  }

  return {
    available: false,
    reason: "OpenFHEConfig.cmake not found",
    checked: candidates,
  };
}

export function buildOpenFheRealLibraryAdapter(options = {}) {
  const contract = options.contract ?? buildOpenFheDemoContract(options);
  const contractValidationErrors = validateOpenFheContract(contract);
  const planningSource = {
    featureCount: contract.featureCount,
    activeEventCount: contract.activeEventCount,
  };

  return {
    schema: "neurofhe.realLibraryAdapter.v1",
    adapterId: "openfhe-bfvrns-sparse-linear-v1",
    library: {
      name: "OpenFHE",
      scheme: "BFVrns",
      role: "real-library encrypted integer scoring adapter",
      requiredForNativeRun: true,
    },
    nativeTarget: "openfhe_linear_demo",
    contractDigest: {
      algorithm: "sha256",
      value: digestContract(contract),
    },
    contractValidation: {
      status: contractValidationErrors.length === 0 ? "valid" : "invalid",
      errors: contractValidationErrors,
    },
    contract,
    exactContractAssertions: {
      scoreEquation: "scores = W x + bias",
      scoreDomain: "non-negative-integers",
      featureShape: contract.featureShape,
      matrixShape: contract.matrixShape,
      classes: contract.classes,
      expectedPlaintextScores: contract.expectedPlaintextScores,
      expectedClassification: contract.expectedClassification,
    },
    privacyModeDecision: buildPrivacyModeDecision(planningSource, contract.classes.length),
    packedVectorPlanning: buildPackedVectorPlanningNotes(planningSource, contract.classes.length),
    framingGuardrail: buildFramingGuardrail(),
    detection: detectOpenFhe(options),
    sourcePath: "prototype/openfhe/openfhe_linear_demo.cpp",
    cmakePath: "prototype/openfhe/CMakeLists.txt",
    buildDirectory: "build/openfhe",
    runContract:
      "The native target must preserve this generated contract: public model metadata, public or padded active-position policy, encrypted active feature values, and client-side score decryption.",
    productionClaim: false,
  };
}

export function openFheIntegrationPlan(options = {}) {
  const adapter = buildOpenFheRealLibraryAdapter(options);
  return {
    schema: "neurofhe.openfhe.integrationPlan.v1",
    nativeTarget: "openfhe_linear_demo",
    scheme: "openfhe-bfvrns",
    contract: adapter.contract,
    adapter,
    detection: adapter.detection,
    sourcePath: "prototype/openfhe/openfhe_linear_demo.cpp",
    cmakePath: "prototype/openfhe/CMakeLists.txt",
    buildDirectory: "build/openfhe",
    commands: [
      "cmake -S prototype/openfhe -B build/openfhe",
      "cmake --build build/openfhe",
      "build/openfhe/openfhe_linear_demo",
    ],
    caveat:
      "This is a real OpenFHE BFVrns build target. It runs only where OpenFHE is installed and discoverable by CMake.",
  };
}

function cloneClassRows(classes, weights) {
  return Object.fromEntries(classes.map((label) => [label, [...weights[label]]]));
}

function publicActiveNeuronPosition(event, spatialBins) {
  const [width] = Array.isArray(spatialBins) ? spatialBins : [undefined, undefined];
  const unitX = Number.isInteger(width) && width > 0 ? event.channel % width : null;
  const unitY = Number.isInteger(width) && width > 0 ? Math.floor(event.channel / width) : null;

  return {
    index: event.index,
    timeBin: event.time,
    neuronId: event.channel,
    unitX,
    unitY,
  };
}

function inferFeatureCount(contract) {
  if (Number.isInteger(contract.featureCount)) return contract.featureCount;
  if (Array.isArray(contract.matrixShape) && Number.isInteger(contract.matrixShape[1])) {
    return contract.matrixShape[1];
  }
  const firstClass = contract.classes?.[0];
  const firstRow = contract.weights?.[firstClass];
  return Array.isArray(firstRow) ? firstRow.length : undefined;
}

function validateActiveEvents(activeEventRows, featureCount, errors) {
  if (!Array.isArray(activeEventRows)) {
    errors.push("activeEvents must be an array");
    return;
  }

  activeEventRows.forEach((event, rowIndex) => {
    if (!event || typeof event !== "object") {
      errors.push(`activeEvents[${rowIndex}] must be an object`);
      return;
    }
    if (!Number.isInteger(event.index) || event.index < 0) {
      errors.push(`activeEvents[${rowIndex}].index must be a non-negative integer`);
    } else if (Number.isInteger(featureCount) && event.index >= featureCount) {
      errors.push(
        `activeEvents[${rowIndex}].index ${event.index} is outside feature count ${featureCount}`,
      );
    }
    if (!isNonNegativeInteger(event.value)) {
      errors.push(`activeEvents[${rowIndex}].value must be a non-negative integer`);
    }
  });
}

function validatePublicActiveNeuronPositions(positions, activeEventRows, featureCount, errors) {
  if (!Array.isArray(positions)) {
    errors.push("publicActiveNeuronPositions must be an array");
    return;
  }
  if (Array.isArray(activeEventRows) && positions.length !== activeEventRows.length) {
    errors.push("publicActiveNeuronPositions length must match activeEvents length");
  }

  positions.forEach((position, rowIndex) => {
    if (!position || typeof position !== "object") {
      errors.push(`publicActiveNeuronPositions[${rowIndex}] must be an object`);
      return;
    }
    if ("value" in position) {
      errors.push(`publicActiveNeuronPositions[${rowIndex}] must not include value`);
    }
    if (!Number.isInteger(position.index) || position.index < 0) {
      errors.push(`publicActiveNeuronPositions[${rowIndex}].index must be a non-negative integer`);
    } else if (Number.isInteger(featureCount) && position.index >= featureCount) {
      errors.push(
        `publicActiveNeuronPositions[${rowIndex}].index ${position.index} is outside feature count ${featureCount}`,
      );
    }
    if (!Number.isInteger(position.timeBin) || position.timeBin < 0) {
      errors.push(`publicActiveNeuronPositions[${rowIndex}].timeBin must be a non-negative integer`);
    }
    if (!Number.isInteger(position.neuronId) || position.neuronId < 0) {
      errors.push(`publicActiveNeuronPositions[${rowIndex}].neuronId must be a non-negative integer`);
    }
  });
}

function validateOpenFhePrivacyMode(privacyMode, errors) {
  if (!privacyMode || typeof privacyMode !== "object") {
    errors.push("privacyMode must be an object");
    return;
  }
  if (privacyMode.id !== "public-active-neuron-positions-encrypted-features") {
    errors.push("privacyMode.id must be public-active-neuron-positions-encrypted-features");
  }
  if (!Array.isArray(privacyMode.encryptedFields) || !privacyMode.encryptedFields.includes("activeFeatureValues")) {
    errors.push("privacyMode.encryptedFields must include activeFeatureValues");
  }
}

function validateWeights(weights, classes, featureCount, errors) {
  if (!weights || typeof weights !== "object") {
    errors.push("weights must be an object keyed by class");
    return;
  }

  for (const label of classes) {
    const row = weights[label];
    if (!Array.isArray(row)) {
      errors.push(`weights.${label} must be an array`);
      continue;
    }
    if (Number.isInteger(featureCount) && row.length !== featureCount) {
      errors.push(`weights.${label} length ${row.length} does not match feature count ${featureCount}`);
    }
    row.forEach((value, columnIndex) => {
      if (!isNonNegativeInteger(value)) {
        errors.push(`weights.${label}[${columnIndex}] must be a non-negative integer`);
      }
    });
  }
}

function validateBias(bias, classes, errors) {
  if (!bias || typeof bias !== "object") {
    errors.push("bias must be an object keyed by class");
    return;
  }

  for (const label of classes) {
    if (!isNonNegativeInteger(bias[label])) {
      errors.push(`bias.${label} must be a non-negative integer`);
    }
  }
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function digestContract(contract) {
  return createHash("sha256").update(canonicalJson(contract)).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function openFheConfigCandidates(env, roots) {
  const raw = [
    env.OpenFHE_DIR,
    env.OPENFHE_DIR,
    ...String(env.CMAKE_PREFIX_PATH ?? "")
      .split(delimiter)
      .filter(Boolean),
    ...roots,
  ].filter(Boolean);
  const candidates = new Set();

  for (const item of raw) {
    const root = resolve(item);
    candidates.add(root);
    candidates.add(join(root, "lib", "cmake", "OpenFHE"));
    candidates.add(join(root, "lib64", "cmake", "OpenFHE"));
    candidates.add(join(root, "share", "OpenFHE"));
    candidates.add(join(root, "share", "cmake", "OpenFHE"));
  }

  return [...candidates];
}

function hasOpenFheConfig(directory) {
  return (
    existsSync(join(directory, "OpenFHEConfig.cmake")) ||
    existsSync(join(directory, "openfhe-config.cmake"))
  );
}
