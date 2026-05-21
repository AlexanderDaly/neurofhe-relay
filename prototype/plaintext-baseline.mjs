#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildNmnistSmokeFixtureRecords,
  loadNmnistRecords,
  runPlaintextEventBaseline,
} from "./lib/nmnist.mjs";

const args = parseArgs(process.argv.slice(2));
const shouldPublishArtifact = args.artifact === "true" || args.publish === "true";

if (!args.dataset && args.fixture !== "nmnist-smoke") {
  console.error([
    "Usage:",
    "  npm run baseline:plaintext -- --dataset /path/to/N-MNIST",
    "  npm run baseline:plaintext -- --fixture nmnist-smoke",
    "",
    "Expected layout:",
    "  /path/to/N-MNIST/Train/0/*.bin",
    "  /path/to/N-MNIST/Test/0/*.bin",
    "",
    "Options:",
    "  --limit-per-class 10",
    "  --grid-size 8",
    "  --time-bins 4",
    "  --window-us 105000",
    "  --compression-levels 1x1,2x2,4x2,8x4",
    "  --artifact",
    "  --artifact-id nmnist-baseline-local",
    "  --generated-at 2026-05-21T12:00:00.000Z",
  ].join("\n"));
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
