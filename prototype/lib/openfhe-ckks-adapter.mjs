// SPDX-License-Identifier: CC0-1.0

import { createHash } from "node:crypto";

import { classifyScores } from "./classifier.mjs";
import {
  buildFramingGuardrail,
  buildPackedVectorPlanningNotes,
  buildPrivacyModeDecision,
  buildPublicActiveNeuronPrivacyMode,
} from "./benchmark.mjs";
import { activeEvents, buildSparseEventWindow, flattenEventWindow } from "./events.mjs";
import { buildDemoLinearModel, sparseMatVec } from "./linear-algebra.mjs";
import { detectOpenFhe } from "./openfhe-adapter.mjs";
import {
  buildSimulatedRawNeuralFrame,
  sortSpatialSpikes,
} from "./spike-sorter.mjs";

const DEFAULT_SOURCE_PATH = "prototype/openfhe-ckks/openfhe_ckks_linear_demo.cpp";
const DEFAULT_CMAKE_PATH = "prototype/openfhe-ckks/CMakeLists.txt";
const DEFAULT_BUILD_DIRECTORY = "build/openfhe-ckks";

export function buildOpenFheCkksDemoContract(options = {}) {
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
  const eventList = activeEventRows.map(({ index, value }) => ({
    index,
    value: Number(value),
  }));
  const model =
    options.model ??
    buildDemoLinearModel({ featureCount: vector.length, channels: eventWindow.channels });
  const approximateModel = toApproximateRealModel(model);
  const scores = sparseMatVec(approximateModel, eventList);
  const privacyMode = {
    ...buildPublicActiveNeuronPrivacyMode(eventList.length, model.classes.length),
    encryptedFields: ["activeFeatureValues", "classScoreCiphertexts"],
    operationCounts: ckksOperationCounts(eventList.length, model.classes.length),
    notes:
      "OpenFHE CKKS target mode for sparse approximate neural/ML feature scoring; use only where public active neuron metadata is acceptable.",
  };

  return {
    schema: "neurofhe.openfheCkks.contract.v1",
    scheme: "openfhe-ckks",
    scoreEquation: approximateModel.scoreEquation,
    scoreDomain: "approximate-real",
    featureValueDomain: "approximate-real-neural-features",
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
    featureShape: approximateModel.featureShape,
    featureCount: vector.length,
    classes: [...approximateModel.classes],
    matrixShape: [...approximateModel.matrixShape],
    activeEventCount: eventList.length,
    publicActiveNeuronPositions: activeEventRows.map((event) =>
      publicActiveNeuronPosition(event, eventWindow.spatialBins),
    ),
    activeEvents: eventList,
    weights: cloneClassRows(approximateModel.classes, approximateModel.weights),
    bias: Object.fromEntries(
      approximateModel.classes.map((label) => [label, approximateModel.bias[label]]),
    ),
    expectedPlaintextScores: scores,
    expectedClassification: classifyScores(scores),
    approximationTolerance: {
      maxAbsScoreError: options.maxAbsScoreError ?? 0.001,
      classificationAgreementRequired: true,
      note:
        "CKKS scores are approximate; classification claims require the score margin to exceed measured drift.",
    },
    ckksParameters: buildOpenFheCkksParameters(options.ckksParameters ?? {}),
    operationCounts: ckksOperationCounts(eventList.length, approximateModel.classes.length),
    ciphertextBytes: {
      measurement: "reported by native OpenFHE CKKS run when OpenFHE serialization is enabled",
      expectedFields: ["activeValueCiphertexts", "classScoreCiphertexts"],
    },
    securityParameters: buildOpenFheCkksSecurityParameters(options.ckksParameters ?? {}),
    cryptoInventory: buildOpenFheCkksCryptoInventory(),
    privacyBoundary: buildOpenFheCkksPrivacyBoundary(),
    productionClaim: false,
  };
}

export function validateOpenFheCkksContract(contract) {
  const errors = [];
  if (!contract || typeof contract !== "object") {
    return ["OpenFHE CKKS contract must be an object"];
  }
  if (contract.scheme !== "openfhe-ckks") {
    errors.push("scheme must be openfhe-ckks");
  }
  if (contract.scoreEquation !== "scores = W x + bias") {
    errors.push("scoreEquation must be scores = W x + bias");
  }
  if (contract.scoreDomain !== "approximate-real") {
    errors.push("scoreDomain must be approximate-real");
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
  validateCkksParameters(contract.ckksParameters, errors);
  validateOpenFheCkksPrivacyMode(contract.privacyMode, errors);

  return errors;
}

export function buildOpenFheCkksRealLibraryAdapter(options = {}) {
  const contract = options.contract ?? buildOpenFheCkksDemoContract(options);
  const contractValidationErrors = validateOpenFheCkksContract(contract);
  const planningSource = {
    featureCount: contract.featureCount,
    activeEventCount: contract.activeEventCount,
  };

  return {
    schema: "neurofhe.realLibraryAdapter.v1",
    adapterId: "openfhe-ckks-sparse-approx-linear-v1",
    library: {
      name: "OpenFHE",
      scheme: "CKKS",
      role: "real-library encrypted approximate-real scoring adapter",
      requiredForNativeRun: true,
    },
    nativeTarget: "openfhe_ckks_linear_demo",
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
      scoreDomain: "approximate-real",
      featureShape: contract.featureShape,
      matrixShape: contract.matrixShape,
      classes: contract.classes,
      expectedPlaintextScores: contract.expectedPlaintextScores,
      expectedClassification: contract.expectedClassification,
      approximationTolerance: contract.approximationTolerance,
    },
    ckksVsBfvTfheComparison: buildCkksVsBfvTfheComparison(contract),
    privacyModeDecision: buildPrivacyModeDecision(planningSource, contract.classes.length),
    packedVectorPlanning: buildPackedVectorPlanningNotes(planningSource, contract.classes.length),
    framingGuardrail: buildFramingGuardrail(),
    detection: detectOpenFhe(options),
    sourcePath: DEFAULT_SOURCE_PATH,
    cmakePath: DEFAULT_CMAKE_PATH,
    buildDirectory: DEFAULT_BUILD_DIRECTORY,
    runContract:
      "The native target must preserve public model metadata, public or padded active-position policy, encrypted approximate active feature values, CKKS class-score ciphertexts, and client-side score decryption with tolerance reporting.",
    productionClaim: false,
  };
}

export function openFheCkksIntegrationPlan(options = {}) {
  const adapter = buildOpenFheCkksRealLibraryAdapter(options);
  return {
    schema: "neurofhe.openfheCkks.integrationPlan.v1",
    nativeTarget: "openfhe_ckks_linear_demo",
    scheme: "openfhe-ckks",
    contract: adapter.contract,
    adapter,
    detection: adapter.detection,
    sourcePath: DEFAULT_SOURCE_PATH,
    cmakePath: DEFAULT_CMAKE_PATH,
    buildDirectory: DEFAULT_BUILD_DIRECTORY,
    commands: [
      "cmake -S prototype/openfhe-ckks -B build/openfhe-ckks",
      "cmake --build build/openfhe-ckks",
      "build/openfhe-ckks/openfhe_ckks_linear_demo",
      "node prototype/openfhe-ckks-benchmark.mjs --artifact",
    ],
    caveat:
      "This is a real OpenFHE CKKS research target for shallow approximate scoring. It is not production cryptography.",
  };
}

export function buildOpenFheCkksCryptoInventory() {
  return {
    schema: "neurofhe.crypto.inventory.v1",
    keyEstablishment: ["ML-KEM-768-design-target"],
    signatures: ["ML-DSA-65-design-target", "SLH-DSA-design-target"],
    encryptedComputation: [
      "openfhe-ckks-approximate-real-research-only",
      "openfhe-bfvrns-integer-default-lane",
      "tfhe-rs-threshold-comparison-lane",
    ],
    hashes: ["SHA3-256-design-target", "BLAKE3-design-target"],
    classicalFallbacks: ["X25519-design-target", "Ed25519-design-target"],
    openFheCkks: {
      library: "OpenFHE",
      scheme: "CKKS",
      role: "approximate real-number encrypted sparse scoring for neural/ML feature values",
      securityLevel: "HEStd_128_classic",
      scalingTechnique: "FLEXIBLEAUTO",
      defaultMode: "leveled-no-bootstrap",
      bootstrappingMode:
        "supported as an optional OpenFHE CKKS configuration path, but not needed for the shallow W x + b demo",
    },
    hybridMode: true,
    productionClaim: false,
    notes:
      "Inventory names research roles and comparison lanes. The CKKS path is approximate and has not had implementation or side-channel review.",
  };
}

export function buildOpenFheCkksPrivacyBoundary() {
  return {
    schema: "neurofhe.openfheCkks.privacyBoundary.v1",
    gatewaySees: [
      "raw neural-like samples before export",
      "sorted event window",
      "active approximate feature values before encryption",
      "active event positions",
      "sorter configuration summary",
    ],
    computeSees: [
      "approved active event positions",
      "public model weights",
      "public model bias",
      "encrypted CKKS active feature values",
      "encrypted CKKS approximate class scores",
    ],
    clientSees: [
      "decrypted approximate class scores",
      "score error report against plaintext baseline for synthetic demos",
      "final classification",
    ],
    withheld: [
      "raw neural samples",
      "raw electrode identifiers",
      "raw sample timestamp order",
      "device identifiers",
      "local subject or session references",
      "operator notes",
    ],
    residualRisks: [
      "public active positions leak spatial and timing metadata",
      "event-count sparsity leaks workload size unless padded",
      "model weights and bias are public in this prototype",
      "CKKS approximate arithmetic introduces score drift",
      "encrypted comparison or argmax is not included in the shallow CKKS demo",
      "side-channel and deployment hardening are out of scope",
    ],
    productionClaim: false,
  };
}

export function buildOpenFheCkksParameters(overrides = {}) {
  return {
    schema: "neurofhe.openfheCkks.parameters.v1",
    multiplicativeDepth: overrides.multiplicativeDepth ?? 2,
    scalingModSize: overrides.scalingModSize ?? 50,
    firstModSize: overrides.firstModSize ?? 60,
    batchSize: overrides.batchSize ?? 64,
    securityLevel: overrides.securityLevel ?? "HEStd_128_classic",
    rescalingTechnique: overrides.rescalingTechnique ?? "FLEXIBLEAUTO",
    scalingTechnique: overrides.scalingTechnique ?? "FLEXIBLEAUTO",
    defaultMode: overrides.defaultMode ?? "leveled-no-bootstrap",
    bootstrapping: {
      supported: overrides.bootstrappingSupported ?? true,
      enabledByDefault: false,
      intendedUse:
        "deeper approximate feature pipelines after W x + b; the included demo stays shallow and leveled",
      setupCalls: ["EvalBootstrapSetup", "EvalBootstrapKeyGen"],
    },
  };
}

function buildOpenFheCkksSecurityParameters(overrides = {}) {
  const parameters = buildOpenFheCkksParameters(overrides);
  return {
    schema: "neurofhe.securityParameters.v1",
    scheme: "openfhe-ckks",
    library: "OpenFHE",
    securityLevel: parameters.securityLevel,
    multiplicativeDepth: parameters.multiplicativeDepth,
    scalingModSize: parameters.scalingModSize,
    firstModSize: parameters.firstModSize,
    batchSize: parameters.batchSize,
    securityModel:
      "Targets OpenFHE HEStd_128_classic parameters for a shallow approximate scoring demo; no independent security review or side-channel hardening.",
    reproducibility:
      "Synthetic event/model data are deterministic. Cryptographic key generation uses runtime randomness and is intentionally not fixed by the demo seed.",
    productionClaim: false,
  };
}

function ckksOperationCounts(activeEventCount, classCount) {
  const multiplies = activeEventCount * classCount;
  return {
    encryptions: activeEventCount + classCount,
    scalarMultiplies: multiplies,
    plaintextMultiplies: multiplies,
    adds: multiplies,
    rescaleOrModReduceOps: multiplies,
    decryptions: classCount,
  };
}

function buildCkksVsBfvTfheComparison(contract) {
  return {
    schema: "neurofhe.cryptoLaneComparison.v1",
    sameTask: true,
    scoreEquation: contract.scoreEquation,
    eventRepresentation: contract.eventRepresentation,
    featureShape: contract.featureShape,
    activeEventCount: contract.activeEventCount,
    expectedPlaintextScores: contract.expectedPlaintextScores,
    expectedClassification: contract.expectedClassification,
    bfvBestFor: [
      "exact integer spike counts",
      "packed finite-field-style arithmetic",
      "default reproducible sparse linear scorer",
    ],
    ckksBestFor: [
      "approximate neural or ML feature scoring",
      "real-valued amplitudes, normalized features, or centroids",
      "shallow arithmetic where small score drift is acceptable",
    ],
    tfheBestFor: [
      "threshold gates",
      "Boolean or decision-tree-style sparse logic",
      "LUT-heavy post-processing after spike sorting",
    ],
    measurementFields: [
      "encryptionLatencyMs",
      "linearScoringLatencyMs",
      "decryptionLatencyMs",
      "ciphertextBytes",
      "maxAbsScoreError",
      "classificationAgreement",
    ],
    caveats: [
      "CKKS is approximate and should be judged by score drift plus classification margin",
      "the included CKKS demo does not implement encrypted argmax",
      "native OpenFHE measurements should replace JS planning estimates before performance claims",
    ],
    productionClaim: false,
  };
}

function toApproximateRealModel(model) {
  return {
    ...model,
    type: "approximate real-valued sparse linear classifier",
    scoreDomain: "approximate-real",
    weights: Object.fromEntries(
      model.classes.map((label) => [
        label,
        model.weights[label].map((value) => Number(value)),
      ]),
    ),
    bias: Object.fromEntries(model.classes.map((label) => [label, Number(model.bias[label])])),
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
    if (!isFiniteNumber(event.value)) {
      errors.push(`activeEvents[${rowIndex}].value must be a finite number`);
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
      if (!isFiniteNumber(value)) {
        errors.push(`weights.${label}[${columnIndex}] must be a finite number`);
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
    if (!isFiniteNumber(bias[label])) {
      errors.push(`bias.${label} must be a finite number`);
    }
  }
}

function validateCkksParameters(parameters, errors) {
  if (!parameters || typeof parameters !== "object") {
    errors.push("ckksParameters must be an object");
    return;
  }
  if (parameters.securityLevel !== "HEStd_128_classic") {
    errors.push("ckksParameters.securityLevel must be HEStd_128_classic");
  }
  for (const field of ["multiplicativeDepth", "scalingModSize", "firstModSize", "batchSize"]) {
    if (!Number.isInteger(parameters[field]) || parameters[field] <= 0) {
      errors.push(`ckksParameters.${field} must be a positive integer`);
    }
  }
}

function validateOpenFheCkksPrivacyMode(privacyMode, errors) {
  if (!privacyMode || typeof privacyMode !== "object") {
    errors.push("privacyMode must be an object");
    return;
  }
  if (privacyMode.id !== "public-active-neuron-positions-encrypted-features") {
    errors.push("privacyMode.id must be public-active-neuron-positions-encrypted-features");
  }
  if (
    !Array.isArray(privacyMode.encryptedFields) ||
    !privacyMode.encryptedFields.includes("activeFeatureValues")
  ) {
    errors.push("privacyMode.encryptedFields must include activeFeatureValues");
  }
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
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
