// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
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

const TFHE_RS_VERSION = "1.6.1";
const DEFAULT_CARGO_MANIFEST = "prototype/tfhe-rs/Cargo.toml";
const DEFAULT_TFHE_SOURCE = "prototype/tfhe-rs/src/lib.rs";
const DEFAULT_REAL_DATA_INPUT =
  "benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json";

export function buildTfheRsDemoContract(options = {}) {
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
  const classification = classifyScores(scores);
  const privacyMode = {
    ...buildPublicActiveNeuronPrivacyMode(eventList.length, model.classes.length),
    encryptedFields: ["activeFeatureValues", "classScoreCiphertexts", "thresholdDecisionBit"],
    operationCounts: tfheOperationCounts(eventList.length, model.classes.length),
    notes:
      "TFHE-rs target mode for sparse sorted-event scoring plus encrypted threshold decision; use only where public active neuron metadata is acceptable.",
  };
  const booleanDecision = buildTfheBooleanDecision(scores);

  return {
    schema: "neurofhe.tfheRs.contract.v1",
    scheme: "tfhe-rs-integer-threshold",
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
    expectedClassification: classification,
    booleanDecision,
    operationCounts: tfheOperationCounts(eventList.length, model.classes.length),
    ciphertextBytes: {
      measurement: "reported by native TFHE-rs run via safe_serialized_size",
      expectedFields: ["activeValueCiphertexts", "classScoreCiphertexts", "thresholdDecisionBit"],
    },
    securityParameters: buildTfheRsSecurityParameters(),
    cryptoInventory: buildTfheRsCryptoInventory(),
    privacyBoundary: buildTfheRsPrivacyBoundary(),
    productionClaim: false,
  };
}

export function validateTfheRsContract(contract) {
  const errors = [];
  if (!contract || typeof contract !== "object") {
    return ["TFHE-rs contract must be an object"];
  }
  if (contract.scheme !== "tfhe-rs-integer-threshold") {
    errors.push("scheme must be tfhe-rs-integer-threshold");
  }
  if (contract.scoreEquation !== "scores = W x + bias") {
    errors.push("scoreEquation must be scores = W x + bias");
  }
  if (contract.scoreDomain !== "non-negative-integers") {
    errors.push("scoreDomain must be non-negative-integers");
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
  validateTfhePrivacyMode(contract.privacyMode, errors);
  validateBooleanDecision(contract.booleanDecision, errors);

  return errors;
}

export function buildTfheRsRealDataContract(options = {}) {
  const inputPath = options.inputPath ?? DEFAULT_REAL_DATA_INPUT;
  const source = options.inputContract ?? readJsonIfExists(inputPath);
  if (!source) {
    throw new Error(`EEG OpenFHE input contract not found at ${inputPath}`);
  }

  const quantized = source.quantized;
  if (!quantized || quantized.scoreDomain !== "signed-fixed-point-integers") {
    throw new Error(
      "EEG OpenFHE input contract has no signed-fixed-point-integer quantized view to transform into a TFHE-rs contract.",
    );
  }

  const classes = Array.isArray(source.classes) ? [...source.classes] : [];
  if (classes.length !== 2) {
    throw new Error(`TFHE-rs real-data transform expects exactly two classes, found ${classes.length}`);
  }

  const featureCount =
    source.featureCount ??
    (Array.isArray(source.featureShape) ? source.featureShape[0] * source.featureShape[1] : undefined);
  for (const label of classes) {
    const row = quantized.weights?.[label];
    if (!Array.isArray(row)) {
      throw new Error(`quantized contract is missing weights for class ${label}`);
    }
    if (Number.isInteger(featureCount) && row.length !== featureCount) {
      throw new Error(`quantized weights for ${label} length ${row.length} does not match feature count ${featureCount}`);
    }
  }

  const activeEvents = (quantized.activeEvents ?? []).map((event) => ({
    index: event.index,
    timeBin: event.timeBin ?? 0,
    neuronId: event.neuronId ?? 0,
    value: event.value,
  }));
  const weights = Object.fromEntries(classes.map((label) => [label, [...quantized.weights[label]]]));
  const bias = Object.fromEntries(classes.map((label) => [label, quantized.bias[label]]));

  const expectedPlaintextScores = computeSignedScores(classes, activeEvents, weights, bias);
  // The transform must preserve the committed quantized contract's decision; if
  // it does not, the EEG contract changed and the blocker should be raised
  // rather than silently emitting a divergent contract.
  if (quantized.expectedPlaintextScores) {
    for (const label of classes) {
      if (expectedPlaintextScores[label] !== quantized.expectedPlaintextScores[label]) {
        throw new Error(
          `transformed score for ${label} (${expectedPlaintextScores[label]}) does not match quantized contract (${quantized.expectedPlaintextScores[label]})`,
        );
      }
    }
  }
  const expectedClassification = classifyScores(expectedPlaintextScores);
  if (quantized.expectedClassification && expectedClassification !== quantized.expectedClassification) {
    throw new Error(
      `transformed classification ${expectedClassification} does not match quantized contract ${quantized.expectedClassification}`,
    );
  }

  const width = Array.isArray(source.featureShape) ? source.featureShape[1] : undefined;
  const publicActiveNeuronPositions = activeEvents.map((event) => ({
    index: event.index,
    timeBin: event.timeBin,
    neuronId: event.neuronId,
    unitX: Number.isInteger(width) && width > 0 ? event.neuronId % width : null,
    unitY: Number.isInteger(width) && width > 0 ? Math.floor(event.neuronId / width) : null,
  }));

  const [baselineClass, positiveClass] = classes;
  const booleanDecision = {
    schema: "neurofhe.tfheRs.booleanDecision.v1",
    gate: `${positiveClass}_score_gt_${baselineClass}_score`,
    baselineClass,
    positiveClass,
    encryptedResultType: "FheBool",
    expectedPlaintext: expectedPlaintextScores[positiveClass] > expectedPlaintextScores[baselineClass],
  };

  const privacyMode = {
    ...buildPublicActiveNeuronPrivacyMode(activeEvents.length, classes.length),
    encryptedFields: ["activeFeatureValues", "classScoreCiphertexts", "thresholdDecisionBit"],
    operationCounts: tfheOperationCounts(activeEvents.length, classes.length),
    notes:
      "TFHE-rs signed-integer target mode for EEG-derived sparse sorted-event scoring plus encrypted threshold decision; uses signed FheInt32 ciphertexts.",
  };

  return {
    schema: "neurofhe.tfheRs.realDataContract.v1",
    scheme: "tfhe-rs-integer-threshold",
    scoreEquation: "scores = W x + bias",
    scoreDomain: "signed-fixed-point-integers",
    fixedPointScale: quantized.fixedPointScale ?? null,
    boundaryDomain: "bio-digital-event-intelligence",
    eventRepresentation: source.eventRepresentation ?? "spatial-sorted-events",
    datasetKind: source.datasetKind ?? null,
    sourceContractPath: inputPath,
    sourceContractSchema: source.schema ?? null,
    sourceContractDigest: {
      algorithm: "sha256",
      value: createHash("sha256").update(JSON.stringify(source)).digest("hex"),
    },
    classes,
    featureShape: Array.isArray(source.featureShape) ? [...source.featureShape] : null,
    featureCount,
    matrixShape: Array.isArray(source.matrixShape)
      ? [...source.matrixShape]
      : [classes.length, featureCount],
    spatialBins: Array.isArray(source.spatialBins) ? [...source.spatialBins] : null,
    activeEventCount: activeEvents.length,
    publicActiveNeuronPositions,
    activeEvents,
    weights,
    bias,
    expectedPlaintextScores,
    expectedClassification,
    booleanDecision,
    privacyMode,
    operationCounts: tfheOperationCounts(activeEvents.length, classes.length),
    securityParameters: { ...buildTfheRsSecurityParameters(), encryptedTypes: ["FheInt32", "FheBool"] },
    cryptoInventory: buildTfheRsCryptoInventory(),
    privacyBoundary: buildTfheRsPrivacyBoundary(),
    productionClaim: false,
  };
}

export function validateTfheRsRealDataContract(contract) {
  const errors = [];
  if (!contract || typeof contract !== "object") {
    return ["TFHE-rs real-data contract must be an object"];
  }
  if (contract.scheme !== "tfhe-rs-integer-threshold") {
    errors.push("scheme must be tfhe-rs-integer-threshold");
  }
  if (contract.scoreEquation !== "scores = W x + bias") {
    errors.push("scoreEquation must be scores = W x + bias");
  }
  if (contract.scoreDomain !== "signed-fixed-point-integers") {
    errors.push("scoreDomain must be signed-fixed-point-integers");
  }

  const classes = Array.isArray(contract.classes) ? contract.classes : [];
  if (classes.length !== 2) {
    errors.push("classes must have exactly two entries");
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

  validateSignedActiveEvents(contract.activeEvents, featureCount, errors);
  validatePublicActiveNeuronPositions(
    contract.publicActiveNeuronPositions,
    contract.activeEvents,
    featureCount,
    errors,
  );
  validateSignedWeights(contract.weights, classes, featureCount, errors);
  validateSignedBias(contract.bias, classes, errors);
  validateTfhePrivacyMode(contract.privacyMode, errors);
  validateRealBooleanDecision(contract.booleanDecision, classes, errors);

  if (!contract.expectedPlaintextScores || typeof contract.expectedPlaintextScores !== "object") {
    errors.push("expectedPlaintextScores must be an object keyed by class");
  } else {
    for (const label of classes) {
      if (!Number.isInteger(contract.expectedPlaintextScores[label])) {
        errors.push(`expectedPlaintextScores.${label} must be an integer`);
      }
    }
  }
  if (!classes.includes(contract.expectedClassification)) {
    errors.push("expectedClassification must be one of the contract classes");
  }

  return errors;
}

function computeSignedScores(classes, activeEvents, weights, bias) {
  const scores = {};
  for (const label of classes) {
    scores[label] = activeEvents.reduce(
      (sum, event) => sum + event.value * weights[label][event.index],
      bias[label],
    );
  }
  return scores;
}

function validateSignedActiveEvents(activeEventRows, featureCount, errors) {
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
      errors.push(`activeEvents[${rowIndex}].index ${event.index} is outside feature count ${featureCount}`);
    }
    if (!Number.isInteger(event.value)) {
      errors.push(`activeEvents[${rowIndex}].value must be an integer`);
    }
  });
}

function validateSignedWeights(weights, classes, featureCount, errors) {
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
      if (!Number.isInteger(value)) {
        errors.push(`weights.${label}[${columnIndex}] must be an integer`);
      }
    });
  }
}

function validateSignedBias(bias, classes, errors) {
  if (!bias || typeof bias !== "object") {
    errors.push("bias must be an object keyed by class");
    return;
  }
  for (const label of classes) {
    if (!Number.isInteger(bias[label])) {
      errors.push(`bias.${label} must be an integer`);
    }
  }
}

function validateRealBooleanDecision(booleanDecision, classes, errors) {
  if (!booleanDecision || typeof booleanDecision !== "object") {
    errors.push("booleanDecision must be an object");
    return;
  }
  const expectedGate = `${classes[1]}_score_gt_${classes[0]}_score`;
  if (booleanDecision.gate !== expectedGate) {
    errors.push(`booleanDecision.gate must be ${expectedGate}`);
  }
  if (booleanDecision.encryptedResultType !== "FheBool") {
    errors.push("booleanDecision.encryptedResultType must be FheBool");
  }
  if (typeof booleanDecision.expectedPlaintext !== "boolean") {
    errors.push("booleanDecision.expectedPlaintext must be a boolean");
  }
}

export function detectTfheRs(options = {}) {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const manifestPath = options.manifestPath ?? DEFAULT_CARGO_MANIFEST;
  const manifestExists = existsSync(resolve(cwd, manifestPath));
  const cargoResult = spawnSync("cargo", ["--version"], {
    cwd,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    available: manifestExists && cargoResult.status === 0,
    manifestPath,
    manifestExists,
    cargo: cargoResult.status === 0 ? cargoResult.stdout.trim() : null,
    reason:
      manifestExists && cargoResult.status === 0
        ? null
        : "Cargo or prototype/tfhe-rs/Cargo.toml not available",
  };
}

export function buildTfheRsRealLibraryAdapter(options = {}) {
  const contract = options.contract ?? buildTfheRsDemoContract(options);
  const contractValidationErrors = validateTfheRsContract(contract);
  const planningSource = {
    featureCount: contract.featureCount,
    activeEventCount: contract.activeEventCount,
  };

  return {
    schema: "neurofhe.realLibraryAdapter.v1",
    adapterId: "tfhe-rs-sparse-integer-threshold-v1",
    library: {
      name: "TFHE-rs",
      crate: "tfhe",
      version: TFHE_RS_VERSION,
      scheme: "TFHE integer + Boolean threshold",
      role: "real-library encrypted sparse integer scoring and encrypted threshold gate",
      requiredForNativeRun: true,
      license: "BSD-3-Clause-Clear for development, research, prototyping, and experimentation; review Zama patent/commercial terms before non-research use",
    },
    nativeTarget: "neurofhe-tfhe-demo",
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
      booleanDecision: contract.booleanDecision,
    },
    tfheVsOpenFheComparison: buildTfheVsOpenFheComparison(contract),
    privacyModeDecision: buildPrivacyModeDecision(planningSource, contract.classes.length),
    packedVectorPlanning: buildPackedVectorPlanningNotes(planningSource, contract.classes.length),
    framingGuardrail: buildFramingGuardrail(),
    detection: detectTfheRs(options),
    manifestPath: DEFAULT_CARGO_MANIFEST,
    sourcePath: DEFAULT_TFHE_SOURCE,
    buildDirectory: "target directory managed by Cargo under prototype/tfhe-rs/target",
    runContract:
      "The native target must preserve public model metadata, public or padded active-position policy, encrypted active feature values, encrypted class-score ciphertexts, and a client-decrypted threshold decision bit.",
    productionClaim: false,
  };
}

export function buildTfheRsRealDataUnavailableReport(options = {}) {
  const inputPath = options.inputPath ?? DEFAULT_REAL_DATA_INPUT;
  const inputContract = options.inputContract ?? readJsonIfExists(inputPath);
  const inputContractSummary = summarizeTfheRealDataInput(inputPath, inputContract);
  const attemptedCommand =
    options.attemptedCommand ??
    `npm run benchmark:tfhe -- --run --input ${inputPath} --artifact --out benchmark-artifacts/comparisons/tfhe-rs-realdata`;

  return {
    schema: "neurofhe.tfheRs.realDataUnavailable.v1",
    inputContract: inputContractSummary,
    attemptedCommand,
    error:
      "The EEG-derived OpenFHE input contract could not be transformed into a valid TFHE-rs signed-integer contract for the native lane.",
    blocker: {
      category: "unsupported-real-data-input-contract",
      reason:
        options.transformError ??
        "The committed EEG-derived OpenFHE input contract lacks a signed-fixed-point-integer quantized view the TFHE-rs signed-integer adapter can consume.",
      transformError: options.transformError ?? null,
      validationErrors: Array.isArray(options.validationErrors) ? options.validationErrors : [],
    },
    smallestNextStep:
      "Regenerate the EEG OpenFHE input contract with a signed-fixed-point-integer quantized view, then rerun the TFHE-rs real-data adapter.",
    preservedEvidence:
      "This blocker is intended for benchmark-artifacts/comparisons/tfhe-rs-realdata/ so benchmark-artifacts/comparisons/tfhe-rs/latest.json can continue to hold the latest runnable synthetic TFHE-rs native evidence.",
    adapter: buildTfheRsRealLibraryAdapter(),
    productionClaim: false,
  };
}

export function tfheRsIntegrationPlan(options = {}) {
  const adapter = buildTfheRsRealLibraryAdapter(options);
  return {
    schema: "neurofhe.tfheRs.integrationPlan.v1",
    nativeTarget: "neurofhe-tfhe-demo",
    scheme: "tfhe-rs-integer-threshold",
    contract: adapter.contract,
    adapter,
    detection: adapter.detection,
    manifestPath: DEFAULT_CARGO_MANIFEST,
    sourcePath: DEFAULT_TFHE_SOURCE,
    commands: [
      "cargo test --manifest-path prototype/tfhe-rs/Cargo.toml",
      "cargo run --release --manifest-path prototype/tfhe-rs/Cargo.toml --bin neurofhe-tfhe-demo",
      "node prototype/tfhe-rs-benchmark.mjs --artifact",
    ],
    caveat:
      "This is a real TFHE-rs research target. It uses TFHE-rs high-level integer and Boolean APIs for demonstration, not production cryptographic assurance.",
  };
}

export function buildTfheRsCryptoInventory() {
  return {
    schema: "neurofhe.crypto.inventory.v1",
    keyEstablishment: ["ML-KEM-768-design-target"],
    signatures: ["ML-DSA-65-design-target", "SLH-DSA-design-target"],
    encryptedComputation: [
      "tfhe-rs-1.6.1-integer-boolean-research-only",
      "openfhe-bfvrns-comparison-lane",
    ],
    hashes: ["SHA3-256-design-target", "BLAKE3-design-target"],
    classicalFallbacks: ["X25519-design-target", "Ed25519-design-target"],
    tfheRs: {
      crate: "tfhe",
      version: TFHE_RS_VERSION,
      features: ["boolean", "integer"],
      defaultFeatures: false,
      role: "encrypted sparse integer scoring plus encrypted Boolean threshold/comparison gate",
      ciphertextSizing: "native run reports safe_serialized_size for active values, class scores, and decision bit",
    },
    hybridMode: true,
    productionClaim: false,
    notes:
      "Inventory names research roles and comparison lanes. This TFHE-rs path is not production cryptography and has not had implementation review.",
  };
}

export function buildTfheRsPrivacyBoundary() {
  return {
    schema: "neurofhe.tfheRs.privacyBoundary.v1",
    gatewaySees: [
      "raw neural-like samples before export",
      "sorted event window",
      "active event values before encryption",
      "active event positions",
      "sorter configuration summary",
    ],
    computeSees: [
      "approved active event positions",
      "public model weights",
      "public model bias",
      "encrypted TFHE-rs active spike values",
      "encrypted TFHE-rs class scores",
      "encrypted TFHE-rs threshold decision bit",
    ],
    clientSees: [
      "decrypted class scores",
      "decrypted threshold decision bit",
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
      "side-channel and deployment hardening are out of scope",
    ],
    productionClaim: false,
  };
}

function summarizeTfheRealDataInput(path, contract) {
  if (!contract) {
    return {
      schema: "neurofhe.tfheRs.realDataInput.summary.v1",
      path,
      present: false,
      digest: null,
      contractSchema: null,
      datasetKind: null,
      scoreDomain: null,
      activeEventCount: null,
      productionClaim: false,
    };
  }
  const json = JSON.stringify(contract);
  return {
    schema: "neurofhe.tfheRs.realDataInput.summary.v1",
    path,
    present: true,
    digest: {
      algorithm: "sha256",
      value: createHash("sha256").update(json).digest("hex"),
    },
    contractSchema: contract.schema,
    datasetKind: contract.datasetKind,
    scoreEquation: contract.scoreEquation ?? null,
    scoreDomain: contract.scoreDomain ?? contract.quantized?.scoreDomain ?? null,
    featureShape: contract.featureShape ?? null,
    matrixShape: contract.matrixShape ?? null,
    activeEventCount: contract.activeEventCount ?? null,
    classes: contract.classes ?? null,
    expectedClassification:
      contract.expectedClassification ?? contract.quantized?.expectedClassification ?? null,
    productionClaim: false,
  };
}

function readJsonIfExists(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function buildTfheBooleanDecision(scores) {
  const normal = scores.normal;
  const anomaly = scores.anomaly;
  return {
    schema: "neurofhe.tfheRs.booleanDecision.v1",
    gate: "anomaly_score_gt_normal_score",
    encryptedResultType: "FheBool",
    expectedPlaintext: anomaly > normal,
  };
}

function buildTfheRsSecurityParameters() {
  return {
    schema: "neurofhe.securityParameters.v1",
    scheme: "tfhe-rs-integer-threshold",
    library: "TFHE-rs",
    crate: "tfhe",
    crateVersion: TFHE_RS_VERSION,
    configuration: "ConfigBuilder::default() high-level API",
    encryptedTypes: ["FheUint16", "FheBool"],
    securityModel:
      "Uses TFHE-rs default high-level parameter selection for the local build; no independent security review or side-channel hardening.",
    reproducibility:
      "Synthetic event/model data are deterministic. Cryptographic key generation uses runtime randomness and is intentionally not fixed by the demo seed.",
    productionClaim: false,
  };
}

function tfheOperationCounts(activeEventCount, classCount) {
  return {
    encryptions: activeEventCount + classCount,
    scalarMultiplies: activeEventCount * classCount,
    adds: activeEventCount * classCount,
    encryptedComparisons: 1,
    decryptions: classCount + 1,
  };
}

function buildTfheVsOpenFheComparison(contract) {
  const operationCounts = tfheOperationCounts(contract.activeEventCount, contract.classes.length);
  return {
    schema: "neurofhe.cryptoLaneComparison.v1",
    sameTask: true,
    scoreEquation: contract.scoreEquation,
    eventRepresentation: contract.eventRepresentation,
    featureShape: contract.featureShape,
    activeEventCount: contract.activeEventCount,
    expectedScores: contract.expectedPlaintextScores,
    expectedClassification: contract.expectedClassification,
    tfheRs: {
      scheme: "TFHE-rs integer + Boolean threshold",
      operationCounts,
      ciphertextSizeSource: "native safe_serialized_size result",
      bestFor: [
        "threshold gates",
        "small Boolean circuits",
        "decision-tree or LUT-style sparse rules",
        "encrypted comparisons after sparse integer scoring",
      ],
    },
    tfheBestFor: [
      "threshold gates",
      "small Boolean circuits",
      "decision-tree or LUT-style sparse rules",
      "encrypted comparisons after sparse integer scoring",
    ],
    openFheBfv: {
      scheme: "OpenFHE BFVrns",
      operationCounts: {
        encryptions: contract.activeEventCount + contract.classes.length,
        scalarMultiplies: contract.activeEventCount * contract.classes.length,
        adds: contract.activeEventCount * contract.classes.length,
        decryptions: contract.classes.length,
      },
      ciphertextSizeSource: "native OpenFHE result when OpenFHE is installed",
      bestFor: [
        "packed integer linear algebra",
        "batched dot products",
        "larger arithmetic workloads with public weights",
      ],
    },
    preferTfheRsWhen:
      "The sparse event model becomes threshold-heavy, decision-tree-like, LUT-style, or comparison/Boolean dominated.",
    preferOpenFheWhen:
      "The workload is mostly packed linear algebra over integer or approximate features and benefits from batching.",
    productionClaim: false,
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

function validateTfhePrivacyMode(privacyMode, errors) {
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

function validateBooleanDecision(booleanDecision, errors) {
  if (!booleanDecision || typeof booleanDecision !== "object") {
    errors.push("booleanDecision must be an object");
    return;
  }
  if (booleanDecision.gate !== "anomaly_score_gt_normal_score") {
    errors.push("booleanDecision.gate must be anomaly_score_gt_normal_score");
  }
  if (booleanDecision.encryptedResultType !== "FheBool") {
    errors.push("booleanDecision.encryptedResultType must be FheBool");
  }
  if (typeof booleanDecision.expectedPlaintext !== "boolean") {
    errors.push("booleanDecision.expectedPlaintext must be a boolean");
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

export function cargoPathCandidates(env = process.env) {
  return String(env.PATH ?? "")
    .split(delimiter)
    .filter(Boolean)
    .map((pathEntry) => join(pathEntry, "cargo"));
}
