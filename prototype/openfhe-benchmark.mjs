// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { publishComparisonArtifact } from "./lib/artifacts.mjs";
import {
  buildOpenFheRealLibraryAdapter,
  buildOpenFheUnavailableReport,
  detectOpenFhe,
  openFheIntegrationPlan,
} from "./lib/openfhe-adapter.mjs";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPublishArtifact = args.has("--artifact") || args.has("--publish");
const outputDir = readOption(rawArgs, "--out") ?? "benchmark-artifacts/comparisons/openfhe";
const artifactId = readOption(rawArgs, "--artifact-id");
const generatedAt = readOption(rawArgs, "--generated-at");
const inputPath = readOption(rawArgs, "--input");

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  npm run benchmark:openfhe -- --plan",
    "  npm run benchmark:openfhe -- --artifact",
    "  npm run benchmark:openfhe -- --run",
    "  npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json",
    "  npm run benchmark:openfhe -- --run --artifact",
    "",
    "--plan prints the native OpenFHE build plan.",
    "--artifact writes the adapter plan, blocker report, or run result as a comparison artifact.",
    "--artifact-id <id> and --generated-at <iso> make artifact output reproducible.",
    "--input <json> passes a generated sparse linear input contract to the native demo.",
    "--run configures, builds, and executes the BFVrns demo when OpenFHE is installed.",
  ].join("\n"));
  process.exit(0);
}

if (!args.has("--run")) {
  const subject = args.has("--adapter") ? buildOpenFheRealLibraryAdapter() : openFheIntegrationPlan();
  if (shouldPublishArtifact) {
    const published = await publishComparisonArtifact({ outputDir, subject, artifactId, generatedAt });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(subject, null, 2));
  }
  process.exit(0);
}

const detection = detectOpenFhe();
if (!detection.available) {
  const unavailable = buildOpenFheUnavailableReport({ detection });
  if (shouldPublishArtifact) {
    const published = await publishComparisonArtifact({
      outputDir,
      subject: unavailable,
      artifactId,
      generatedAt,
    });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(unavailable, null, 2));
  }
  process.exit(2);
}

const env = {
  ...process.env,
  OpenFHE_DIR: process.env.OpenFHE_DIR ?? process.env.OPENFHE_DIR ?? detection.cmakeConfigDir,
};

run("cmake", ["-S", "prototype/openfhe", "-B", "build/openfhe"], env);
run("cmake", ["--build", "build/openfhe"], env);
const nativeArgs = inputPath ? ["--input", inputPath] : [];
const nativeResult = run("build/openfhe/openfhe_linear_demo", nativeArgs, env, {
  capture: shouldPublishArtifact,
});

if (shouldPublishArtifact) {
  process.stdout.write(nativeResult.stdout);
  const parsed = JSON.parse(nativeResult.stdout);
  const published = await publishComparisonArtifact({
    outputDir,
    artifactId,
    generatedAt,
    subject: {
      schema: "neurofhe.openfhe.runComparison.v1",
      adapter: buildOpenFheRealLibraryAdapter(),
      inputContractPath: inputPath,
      inputContract: inputPath ? readInputContractSummary(inputPath, "bfvrns") : null,
      nativeResult: parsed,
      productionClaim: false,
    },
  });
  console.log(JSON.stringify(published, null, 2));
}

function run(command, commandArgs, env, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env,
    encoding: options.capture ? "utf8" : undefined,
    stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function readInputContractSummary(path, view) {
  const text = readFileSync(path, "utf8");
  const contract = JSON.parse(text);
  return {
    schema: "neurofhe.openfheInputContract.summary.v1",
    path,
    view,
    digest: {
      algorithm: "sha256",
      value: createHash("sha256").update(text).digest("hex"),
    },
    contractSchema: contract.schema,
    datasetKind: contract.datasetKind,
    scoreEquation: contract.scoreEquation,
    scoreDomain: view === "bfvrns"
      ? contract.quantized?.scoreDomain
      : contract.scoreDomain,
    featureShape: contract.featureShape,
    matrixShape: contract.matrixShape,
    activeEventCount: contract.activeEventCount,
    classes: contract.classes,
    expectedClassification: view === "bfvrns"
      ? contract.quantized?.expectedClassification
      : contract.expectedClassification,
    productionClaim: false,
  };
}
