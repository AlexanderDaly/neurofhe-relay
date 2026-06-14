// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { publishComparisonArtifact } from "./lib/artifacts.mjs";
import {
  buildTfheRsRealLibraryAdapter,
  buildTfheRsRealDataContract,
  buildTfheRsRealDataUnavailableReport,
  tfheRsIntegrationPlan,
  validateTfheRsRealDataContract,
} from "./lib/tfhe-rs-adapter.mjs";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPublishArtifact = args.has("--artifact") || args.has("--publish");
const artifactId = readOption(rawArgs, "--artifact-id");
const generatedAt = readOption(rawArgs, "--generated-at");
const inputPath = readOption(rawArgs, "--input");
const outputDir =
  readOption(rawArgs, "--out") ??
  (inputPath
    ? "benchmark-artifacts/comparisons/tfhe-rs-realdata"
    : "benchmark-artifacts/comparisons/tfhe-rs");

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  node prototype/tfhe-rs-benchmark.mjs --plan",
    "  node prototype/tfhe-rs-benchmark.mjs --adapter",
    "  node prototype/tfhe-rs-benchmark.mjs --artifact",
    "  node prototype/tfhe-rs-benchmark.mjs --run",
    "  node prototype/tfhe-rs-benchmark.mjs --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact --out benchmark-artifacts/comparisons/tfhe-rs-realdata",
    "  node prototype/tfhe-rs-benchmark.mjs --run --artifact",
    "",
    "--plan prints the native TFHE-rs build plan.",
    "--adapter prints the digest-bound adapter contract.",
    "--artifact writes the adapter plan or native run result as a comparison artifact.",
    "--artifact-id <id> and --generated-at <iso> make artifact output reproducible.",
    "--input <json> records a blocker artifact for real-data TFHE-rs input support.",
    "--run builds and executes the TFHE-rs demo with Cargo.",
  ].join("\n"));
  process.exit(0);
}

if (inputPath) {
  let realDataContract = null;
  let transformError = null;
  try {
    realDataContract = buildTfheRsRealDataContract({ inputPath });
  } catch (error) {
    transformError = error.message;
  }
  const validationErrors = realDataContract ? validateTfheRsRealDataContract(realDataContract) : [];

  // Only fall back to the structured blocker when the EEG contract genuinely
  // cannot be transformed into a valid TFHE-rs signed-integer contract.
  if (!realDataContract || validationErrors.length > 0) {
    const subject = buildTfheRsRealDataUnavailableReport({
      inputPath,
      transformError,
      validationErrors,
    });
    if (shouldPublishArtifact) {
      const published = await publishComparisonArtifact({ outputDir, subject, artifactId, generatedAt });
      console.log(JSON.stringify(published, null, 2));
    } else {
      console.log(JSON.stringify(subject, null, 2));
    }
    process.exit(2);
  }

  const contractValidation = { status: "valid", errors: [] };

  if (!args.has("--run")) {
    const subject = {
      schema: "neurofhe.tfheRs.realDataContractPlan.v1",
      sourceContractPath: inputPath,
      contract: realDataContract,
      contractValidation,
      productionClaim: false,
    };
    if (shouldPublishArtifact) {
      const published = await publishComparisonArtifact({ outputDir, subject, artifactId, generatedAt });
      console.log(JSON.stringify(published, null, 2));
    } else {
      console.log(JSON.stringify(subject, null, 2));
    }
    process.exit(0);
  }

  const contractFile = join(tmpdir(), `neurofhe-tfhe-realdata-${Date.now()}.json`);
  writeFileSync(contractFile, `${JSON.stringify(realDataContract, null, 2)}\n`, "utf8");
  const nativeRun = run(
    "cargo",
    [
      "run",
      "--release",
      "--manifest-path",
      "prototype/tfhe-rs/Cargo.toml",
      "--bin",
      "neurofhe-tfhe-demo",
      "--",
      "--input",
      contractFile,
    ],
    { capture: true },
  );
  const parsed = JSON.parse(nativeRun.stdout);
  const subject = {
    schema: "neurofhe.tfheRs.realDataRunComparison.v1",
    sourceContractPath: inputPath,
    transform: {
      sourceContractDigest: realDataContract.sourceContractDigest,
      datasetKind: realDataContract.datasetKind,
      scoreDomain: realDataContract.scoreDomain,
      fixedPointScale: realDataContract.fixedPointScale,
      expectedPlaintextScores: realDataContract.expectedPlaintextScores,
      expectedClassification: realDataContract.expectedClassification,
    },
    contract: realDataContract,
    contractValidation,
    nativeResult: parsed,
    plaintextParity: {
      matches: parsed.plaintextMatchesExpected === true,
      booleanDecisionMatches: parsed.booleanDecision?.matchesExpected === true,
    },
    productionClaim: false,
  };
  if (shouldPublishArtifact) {
    process.stdout.write(nativeRun.stdout);
    const published = await publishComparisonArtifact({ outputDir, subject, artifactId, generatedAt });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(subject, null, 2));
  }
  process.exit(0);
}

if (!args.has("--run")) {
  const subject = args.has("--adapter") ? buildTfheRsRealLibraryAdapter() : tfheRsIntegrationPlan();
  if (shouldPublishArtifact) {
    const published = await publishComparisonArtifact({ outputDir, subject, artifactId, generatedAt });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(subject, null, 2));
  }
  process.exit(0);
}

const nativeResult = run(
  "cargo",
  [
    "run",
    "--release",
    "--manifest-path",
    "prototype/tfhe-rs/Cargo.toml",
    "--bin",
    "neurofhe-tfhe-demo",
  ],
  {
    capture: true,
  },
);

const parsed = JSON.parse(nativeResult.stdout);
const subject = {
  schema: "neurofhe.tfheRs.runComparison.v1",
  adapter: buildTfheRsRealLibraryAdapter(),
  nativeResult: parsed,
  productionClaim: false,
};

if (shouldPublishArtifact) {
  process.stdout.write(nativeResult.stdout);
  const published = await publishComparisonArtifact({ outputDir, subject, artifactId, generatedAt });
  console.log(JSON.stringify(published, null, 2));
} else {
  console.log(JSON.stringify(subject, null, 2));
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env: process.env,
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
