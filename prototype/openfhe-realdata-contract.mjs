#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildEegEyeStateOpenFheInputContract,
  loadOrFetchEegEyeStateRows,
  normalizeEegBaselineOptions,
  validateEegSampleIndex,
} from "./lib/eeg-eye-state.mjs";

const args = parseArgs(process.argv.slice(2));

if (args.help === "true") {
  console.log([
    "Usage:",
    "  npm run contract:eeg-openfhe -- --fetch",
    "  npm run contract:eeg-openfhe -- --dataset '/path/to/EEG Eye State.arff'",
    "",
    "Options:",
    "  --out benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input",
    "  --train-fraction 0.7",
    "  --window-size 8",
    "  --stride 8",
    "  --channel-count 8",
    "  --active-per-timestep 4",
    "  --sample-index 0",
    "  --fixed-point-scale 10",
    "  --plaintext-modulus 65537",
  ].join("\n"));
  process.exit(0);
}

try {
  const contractOptions = normalizeEegBaselineOptions({
    trainFraction: args["train-fraction"] ?? 0.7,
    windowSize: args["window-size"] ?? 8,
    stride: args.stride ?? args["window-size"] ?? 8,
    channelCount: args["channel-count"] ?? 8,
    activePerTimestep: args["active-per-timestep"] ?? 4,
  });
  const sampleIndex = validateEegSampleIndex(args["sample-index"] ?? 0);
  const loaded = await loadOrFetchEegEyeStateRows({
    datasetPath: args.dataset,
    fetch: args.fetch === "true" || !args.dataset,
    cacheDir: args["cache-dir"],
  });
  const contract = buildEegEyeStateOpenFheInputContract({
    rows: loaded.rows,
    sampleIndex,
    fixedPointScale: Number(args["fixed-point-scale"] ?? 10),
    plaintextModulus: Number(args["plaintext-modulus"] ?? 65537),
    options: contractOptions,
  });

  const outputDir =
    args.out ?? "benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input";
  const ckksPath = join(outputDir, "eeg-eye-state-ckks-contract.json");
  const bfvrnsPath = join(outputDir, "eeg-eye-state-bfvrns-contract.json");
  const manifestPath = join(outputDir, "latest.json");

  await mkdir(outputDir, { recursive: true });
  await writeFile(ckksPath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  await writeFile(bfvrnsPath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");

  const manifest = {
    schema: "neurofhe.openfheInputContract.publish.v1",
    datasetKind: contract.datasetKind,
    generatedAt: args["generated-at"] ?? new Date().toISOString(),
    paths: {
      ckks: ckksPath,
      bfvrns: bfvrnsPath,
    },
    contractSummary: {
      schema: contract.schema,
      featureShape: contract.featureShape,
      matrixShape: contract.matrixShape,
      activeEventCount: contract.activeEventCount,
      classes: contract.classes,
      expectedClassification: contract.expectedClassification,
      quantizedExpectedClassification: contract.quantized.expectedClassification,
      fixedPointScale: contract.quantized.fixedPointScale,
      scoreFitsCenteredPlaintextModulus:
        contract.quantized.scoreFitsCenteredPlaintextModulus,
    },
    source: {
      ...loaded.source,
      rows: loaded.rows.length,
    },
    productionClaim: false,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(manifest, null, 2));
} catch (error) {
  console.error(`Validation error: ${error.message}`);
  process.exit(2);
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
