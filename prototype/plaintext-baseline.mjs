#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { loadNmnistRecords, runPlaintextEventBaseline } from "./lib/nmnist.mjs";

const args = parseArgs(process.argv.slice(2));

if (!args.dataset) {
  console.error([
    "Usage: npm run baseline:plaintext -- --dataset /path/to/N-MNIST",
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

const trainRecords = loadNmnistRecords(args.dataset, { ...loadOptions, split: "Train" });
const testRecords = loadNmnistRecords(args.dataset, { ...loadOptions, split: "Test" });
const report = runPlaintextEventBaseline({
  trainRecords,
  testRecords,
  options: baselineOptions,
});

console.log(JSON.stringify({
  ...report,
  source: {
    datasetRoot: args.dataset,
    trainSplit: "Train",
    testSplit: "Test",
    limitPerClass: loadOptions.limitPerClass,
  },
}, null, 2));

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
