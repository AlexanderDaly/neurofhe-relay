#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildEegEyeStateSmokeFixtureRows,
  EEG_EYE_STATE_PROVENANCE,
  loadOrFetchEegEyeStateRows,
  runEegEyeStatePlaintextBaseline,
} from "./lib/eeg-eye-state.mjs";
import {
  buildNmnistSmokeFixtureRecords,
  loadNmnistRecords,
  runPlaintextEventBaseline,
} from "./lib/nmnist.mjs";

const args = parseArgs(process.argv.slice(2));
const shouldPublishArtifact = args.artifact === "true" || args.publish === "true";
const sourceKind = args.source ?? inferSourceKind(args);

if (
  sourceKind === "nmnist" &&
  !args.dataset &&
  args.fixture !== "nmnist-smoke"
) {
  console.error([
    "Usage:",
    "  npm run baseline:plaintext -- --dataset /path/to/N-MNIST",
    "  npm run baseline:plaintext -- --fixture nmnist-smoke",
    "  npm run baseline:plaintext -- --source eeg-eye-state --fetch",
    "  npm run baseline:plaintext -- --source eeg-eye-state --dataset '/path/to/EEG Eye State.arff'",
    "  npm run baseline:plaintext -- --source eeg-eye-state --fixture eeg-eye-state-smoke",
    "",
    "Expected N-MNIST layout:",
    "  /path/to/N-MNIST/Train/0/*.bin",
    "  /path/to/N-MNIST/Test/0/*.bin",
    "",
    "N-MNIST options:",
    "  --limit-per-class 10",
    "  --grid-size 8",
    "  --time-bins 4",
    "  --window-us 105000",
    "  --compression-levels 1x1,2x2,4x2,8x4",
    "",
    "EEG Eye State options:",
    "  --fetch",
    "  --cache-dir .cache/neurofhe/eeg-eye-state",
    "  --train-fraction 0.7",
    "  --window-size 8",
    "  --stride 8",
    "  --channel-count 8",
    "  --active-per-timestep 4",
    "  --compression-levels active1,active2,active4,active8",
    "",
    "Artifact options:",
    "  --artifact",
    "  --artifact-id nmnist-baseline-local",
    "  --generated-at 2026-05-21T12:00:00.000Z",
  ].join("\n"));
  process.exit(2);
}

if (sourceKind === "eeg-eye-state") {
  const eegOptions = {
    trainFraction: Number(args["train-fraction"] ?? 0.7),
    windowSize: Number(args["window-size"] ?? 8),
    stride: Number(args.stride ?? args["window-size"] ?? 8),
    channelCount: Number(args["channel-count"] ?? 8),
    activePerTimestep: Number(args["active-per-timestep"] ?? 4),
  };
  let loaded;
  let subject;
  try {
    loaded = await loadEegBaselineRows(args);
    const compressionLevels = parseEegCompressionLevels(
      args["compression-levels"] ?? "active1,active2,active4,active8",
    );
    const report = runEegEyeStatePlaintextBaseline({
      rows: loaded.rows,
      options: eegOptions,
      compressionLevels,
    });
    subject = {
      ...report,
      source: {
        ...loaded.source,
        rows: loaded.rows.length,
      },
    };
  } catch (error) {
    const unavailable = buildEegBaselineUnavailableReport(args, error);
    if (shouldPublishArtifact) {
      const published = await publishPlaintextBaselineArtifact(unavailable, {
        outputDir:
          args.out ??
          "benchmark-artifacts/plaintext-baselines/eeg-eye-state-blocker",
        artifactId: args["artifact-id"],
        generatedAt: args["generated-at"],
      });
      console.log(JSON.stringify(published, null, 2));
    } else {
      console.log(JSON.stringify(unavailable, null, 2));
    }
    process.exit(2);
  }

  if (shouldPublishArtifact) {
    const published = await publishPlaintextBaselineArtifact(subject, {
      outputDir:
        args.out ??
        `benchmark-artifacts/plaintext-baselines/${loaded.source.datasetId}`,
      artifactId: args["artifact-id"],
      generatedAt: args["generated-at"],
    });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(subject, null, 2));
  }
  process.exit(0);
}

if (sourceKind !== "nmnist") {
  console.error(`Unsupported plaintext baseline source: ${sourceKind}`);
  process.exit(2);
}

const baselineOptions = {
  gridSize: Number(args["grid-size"] ?? 8),
  timeBins: Number(args["time-bins"] ?? 4),
  windowUs: Number(args["window-us"] ?? 105000),
};
const loadOptions = {
  limitPerClass: Number(args["limit-per-class"] ?? 10),
};
const compressionLevels = parseCompressionLevels(
  args["compression-levels"] ?? "1x1,2x2,4x2,8x4",
);

let loaded;
try {
  loaded = loadBaselineRecords(args, loadOptions);
} catch (error) {
  const unavailable = buildPlaintextBaselineUnavailableReport(args, loadOptions, error);
  if (shouldPublishArtifact) {
    const published = await publishPlaintextBaselineArtifact(unavailable, {
      outputDir:
        args.out ??
        "benchmark-artifacts/plaintext-baselines/nmnist-local-blocker",
      artifactId: args["artifact-id"],
      generatedAt: args["generated-at"],
    });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(unavailable, null, 2));
  }
  process.exit(2);
}
const report = runPlaintextEventBaseline({
  trainRecords: loaded.trainRecords,
  testRecords: loaded.testRecords,
  options: baselineOptions,
  compressionLevels,
});
const subject = {
  ...report,
  source: loaded.source,
};

if (shouldPublishArtifact) {
  const published = await publishPlaintextBaselineArtifact(subject, {
    outputDir:
      args.out ??
      `benchmark-artifacts/plaintext-baselines/${loaded.source.datasetId}`,
    artifactId: args["artifact-id"],
    generatedAt: args["generated-at"],
  });
  console.log(JSON.stringify(published, null, 2));
} else {
  console.log(JSON.stringify(subject, null, 2));
}

function buildPlaintextBaselineUnavailableReport(parsedArgs, loadOptions, error) {
  return {
    schema: "neurofhe.plaintextBaseline.unavailable.v1",
    datasetKind: "public-nmnist-local-copy",
    isRealDataset: true,
    blocker: {
      reason: error.message,
      datasetRoot: parsedArgs.dataset,
    },
    attemptedCommand: [
      "npm run baseline:plaintext --",
      `--dataset ${parsedArgs.dataset}`,
      `--limit-per-class ${loadOptions.limitPerClass}`,
      `--grid-size ${parsedArgs["grid-size"] ?? 8}`,
      `--time-bins ${parsedArgs["time-bins"] ?? 4}`,
      `--window-us ${parsedArgs["window-us"] ?? 105000}`,
    ].join(" "),
    publicDatasetReference: {
      name: "N-MNIST",
      url: "https://www.garrickorchard.com/datasets/n-mnist",
      doi: "10.17632/468j46mzdv.1",
      license: "CC BY 4.0 / CC BY-SA 4.0 references must be reviewed for downstream redistribution",
    },
    smallestNextStep:
      "Download and extract the public N-MNIST Train and Test directories outside git, then rerun the attempted command with --artifact.",
    productionClaim: false,
  };
}

function buildEegBaselineUnavailableReport(parsedArgs, error) {
  return {
    schema: "neurofhe.plaintextBaseline.unavailable.v1",
    datasetKind: "public-uci-eeg-eye-state-arff",
    isRealDataset: true,
    blocker: {
      reason: error.message,
      datasetPath: parsedArgs.dataset,
      fetchRequested: parsedArgs.fetch === "true",
      trainFraction: optionValue(parsedArgs["train-fraction"], 0.7),
      windowSize: optionValue(parsedArgs["window-size"], 8),
      stride: optionValue(
        parsedArgs.stride,
        optionValue(parsedArgs["window-size"], 8),
      ),
      channelCount: optionValue(parsedArgs["channel-count"], 8),
      activePerTimestep: optionValue(parsedArgs["active-per-timestep"], 4),
    },
    attemptedCommand: [
      "npm run baseline:plaintext --",
      "--source eeg-eye-state",
      eegInputSourceArg(parsedArgs),
      `--train-fraction ${parsedArgs["train-fraction"] ?? 0.7}`,
      `--window-size ${parsedArgs["window-size"] ?? 8}`,
      `--stride ${parsedArgs.stride ?? parsedArgs["window-size"] ?? 8}`,
      `--channel-count ${parsedArgs["channel-count"] ?? 8}`,
      `--active-per-timestep ${parsedArgs["active-per-timestep"] ?? 4}`,
    ].join(" "),
    publicDatasetReference: EEG_EYE_STATE_PROVENANCE.publicDatasetReference,
    smallestNextStep: eegSmallestNextStep(error.message),
    productionClaim: false,
  };
}

function eegInputSourceArg(parsedArgs) {
  if (parsedArgs.fixture) return `--fixture ${parsedArgs.fixture}`;
  if (parsedArgs.dataset) return `--dataset ${parsedArgs.dataset}`;
  return "--fetch";
}

function eegSmallestNextStep(reason) {
  if (reason.startsWith("--")) {
    return "Correct the invalid CLI option and rerun the same dataset or fixture command.";
  }
  if (reason.includes("without windows")) {
    return "Use a larger --train-fraction, smaller --window-size, or smaller --stride so the training split produces at least one sparse window.";
  }
  return "Rerun with --fetch on a networked machine or download the public ARFF outside git and pass --dataset '/path/to/EEG Eye State.arff'.";
}

function optionValue(rawValue, defaultValue) {
  if (rawValue === undefined) return defaultValue;
  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : rawValue;
}

async function loadEegBaselineRows(parsedArgs) {
  if (parsedArgs.fixture === "eeg-eye-state-smoke") {
    const fixture = buildEegEyeStateSmokeFixtureRows();
    return {
      rows: fixture.rows,
      source: fixture.source,
    };
  }

  return loadOrFetchEegEyeStateRows({
    datasetPath: parsedArgs.dataset,
    fetch: parsedArgs.fetch === "true",
    cacheDir: parsedArgs["cache-dir"],
  });
}

function loadBaselineRecords(parsedArgs, loadOptions) {
  if (parsedArgs.fixture === "nmnist-smoke") {
    const fixture = buildNmnistSmokeFixtureRecords();
    return {
      trainRecords: fixture.trainRecords,
      testRecords: fixture.testRecords,
      source: {
        ...fixture.source,
        datasetId: "nmnist-smoke",
        trainRecords: fixture.trainRecords.length,
        testRecords: fixture.testRecords.length,
      },
    };
  }

  return {
    trainRecords: loadNmnistRecords(parsedArgs.dataset, { ...loadOptions, split: "Train" }),
    testRecords: loadNmnistRecords(parsedArgs.dataset, { ...loadOptions, split: "Test" }),
    source: {
      schema: "neurofhe.datasetProvenance.v1",
      datasetId: "nmnist-local",
      datasetKind: "public-nmnist-local-copy",
      isRealDataset: true,
      datasetRoot: parsedArgs.dataset,
      trainSplit: "Train",
      testSplit: "Test",
      limitPerClass: loadOptions.limitPerClass,
      publicDatasetReference: {
        name: "N-MNIST",
        url: "https://www.garrickorchard.com/datasets/n-mnist",
        doi: "10.17632/468j46mzdv.1",
        license: "CC BY 4.0 / CC BY-SA 4.0 references must be reviewed for downstream redistribution",
      },
      preprocessing:
        "40-bit event records parsed into time-major grid features; coordinates quantized from 34x34 source addresses to the configured grid size.",
    },
  };
}

function parseCompressionLevels(value) {
  if (value === "none") return [];
  return String(value)
    .split(",")
    .filter(Boolean)
    .map((item) => {
      const [gridSize, timeBins] = item.split("x").map((part) => Number(part));
      if (!Number.isInteger(gridSize) || gridSize <= 0) {
        throw new Error(`invalid compression grid size in ${item}`);
      }
      if (!Number.isInteger(timeBins) || timeBins <= 0) {
        throw new Error(`invalid compression time-bin count in ${item}`);
      }
      return {
        id: `grid-${gridSize}-time-${timeBins}`,
        gridSize,
        timeBins,
      };
    });
}

function parseEegCompressionLevels(value) {
  if (value === "none") return [];
  return String(value)
    .split(",")
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^active(\d+)$/);
      if (!match) {
        throw new Error(`invalid EEG compression level ${item}; expected active<N>`);
      }
      const activePerTimestep = Number(match[1]);
      if (!Number.isInteger(activePerTimestep) || activePerTimestep <= 0) {
        throw new Error(`invalid EEG active-per-timestep in ${item}`);
      }
      return {
        id: `active-${activePerTimestep}-per-timestep`,
        activePerTimestep,
      };
    });
}

function inferSourceKind(parsedArgs) {
  if (parsedArgs.fixture === "eeg-eye-state-smoke") return "eeg-eye-state";
  return "nmnist";
}

async function publishPlaintextBaselineArtifact(subject, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactId =
    options.artifactId ??
    `plaintext-baseline-${generatedAt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}`;
  const artifact = {
    schema: "neurofhe.plaintextBaselineArtifact.v1",
    artifactId,
    generatedAt,
    subjectSchema: subject.schema,
    evidenceClass: evidenceClassFor(subject),
    subject,
    productionClaim: false,
  };
  const runsDir = join(options.outputDir, "runs");
  const runPath = join(runsDir, `${artifactId}.json`);
  const latestPath = join(options.outputDir, "latest.json");
  const json = `${JSON.stringify(artifact, null, 2)}\n`;

  await mkdir(runsDir, { recursive: true });
  await writeFile(runPath, json, "utf8");
  await writeFile(latestPath, json, "utf8");

  return {
    schema: "neurofhe.plaintextBaselineArtifact.publish.v1",
    artifactId,
    paths: {
      run: runPath,
      latest: latestPath,
    },
    subjectSchema: subject.schema,
    artifact,
  };
}

function evidenceClassFor(subject) {
  if (subject.schema === "neurofhe.plaintextBaseline.unavailable.v1") {
    return "real-public-dataset-blocker-report";
  }
  return subject.source?.isRealDataset
    ? "real-public-dataset-plaintext-baseline"
    : "format-fixture-smoke-test";
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--")
      ? argv[++index]
      : "true";
    parsed[key] = value;
  }
  return parsed;
}
