// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { publishComparisonArtifact } from "./lib/artifacts.mjs";
import {
  buildOpenFheCkksRealLibraryAdapter,
  openFheCkksIntegrationPlan,
} from "./lib/openfhe-ckks-adapter.mjs";
import { detectOpenFhe } from "./lib/openfhe-adapter.mjs";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPublishArtifact = args.has("--artifact") || args.has("--publish");
const outputDir = readOption(rawArgs, "--out") ?? "benchmark-artifacts/comparisons/openfhe-ckks";
const artifactId = readOption(rawArgs, "--artifact-id");
const generatedAt = readOption(rawArgs, "--generated-at");
const inputPath = readOption(rawArgs, "--input");

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  npm run benchmark:openfhe-ckks -- --plan",
    "  npm run benchmark:openfhe-ckks -- --adapter",
    "  npm run benchmark:openfhe-ckks -- --artifact",
    "  npm run benchmark:openfhe-ckks -- --run",
    "  npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json",
    "  npm run benchmark:openfhe-ckks -- --run --artifact",
    "",
    "--plan prints the native OpenFHE CKKS build plan.",
    "--adapter prints the digest-bound CKKS adapter contract.",
    "--artifact writes the adapter plan, blocker report, or native run result as a comparison artifact.",
    "--artifact-id <id> and --generated-at <iso> make artifact output reproducible.",
    "--input <json> passes a generated sparse linear input contract to the native demo.",
    "--run configures, builds, and executes the CKKS demo when OpenFHE is installed.",
  ].join("\n"));
  process.exit(0);
}

if (!args.has("--run")) {
  const subject = args.has("--adapter")
    ? buildOpenFheCkksRealLibraryAdapter()
    : openFheCkksIntegrationPlan();
  if (shouldPublishArtifact) {
    const published = await publishComparisonArtifact({
      outputDir,
      subject,
      artifactId,
      generatedAt,
    });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(subject, null, 2));
  }
  process.exit(0);
}

const detection = detectOpenFhe();
if (!detection.available) {
  const unavailable = {
    schema: "neurofhe.openfheCkks.unavailable.v1",
    detection,
    blocker: {
      reason: detection.reason ?? "OpenFHE unavailable",
      checked: detection.checked ?? [],
    },
    attemptedCommands: [
      "cmake -S prototype/openfhe-ckks -B build/openfhe-ckks",
      "cmake --build build/openfhe-ckks",
      "build/openfhe-ckks/openfhe_ckks_linear_demo",
    ],
    parameterEvidence: {
      scheme: "CKKS",
      library: "OpenFHE",
      securityLevelTarget: "HEStd_128_classic",
      multiplicativeDepth: 2,
      scalingModSize: 50,
      firstModSize: 60,
      batchSize: 64,
      scalingTechnique: "FLEXIBLEAUTO",
      toyPaillierIsSecurityEvidence: false,
      noiseBudget:
        "not reported until OpenFHE builds and the native executable can run",
      ciphertextDimensions:
        "not reported until OpenFHE builds and the native executable can run",
    },
    smallestNextStep:
      "Install OpenFHE, set OpenFHE_DIR to the directory containing OpenFHEConfig.cmake if needed, then rerun npm run benchmark:openfhe-ckks -- --run --artifact.",
    adapter: buildOpenFheCkksRealLibraryAdapter(),
    plan: openFheCkksIntegrationPlan(),
    productionClaim: false,
  };
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

run("cmake", ["-S", "prototype/openfhe-ckks", "-B", "build/openfhe-ckks"], env);
run("cmake", ["--build", "build/openfhe-ckks"], env);
const nativeArgs = inputPath ? ["--input", inputPath] : [];
const nativeResult = run("build/openfhe-ckks/openfhe_ckks_linear_demo", nativeArgs, env, {
  capture: true,
});
const parsed = JSON.parse(nativeResult.stdout);
const subject = {
  schema: "neurofhe.openfheCkks.runComparison.v1",
  adapter: buildOpenFheCkksRealLibraryAdapter(),
  inputContractPath: inputPath,
  inputContract: inputPath ? readInputContractSummary(inputPath, "ckks") : null,
  nativeResult: parsed,
  productionClaim: false,
};

if (shouldPublishArtifact) {
  process.stdout.write(nativeResult.stdout);
  const published = await publishComparisonArtifact({
    outputDir,
    subject,
    artifactId,
    generatedAt,
  });
  console.log(JSON.stringify(published, null, 2));
} else {
  console.log(JSON.stringify(subject, null, 2));
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
