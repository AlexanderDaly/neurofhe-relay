// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from "node:child_process";

import { publishComparisonArtifact } from "./lib/artifacts.mjs";
import {
  buildTfheRsRealLibraryAdapter,
  tfheRsIntegrationPlan,
} from "./lib/tfhe-rs-adapter.mjs";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPublishArtifact = args.has("--artifact") || args.has("--publish");
const outputDir = readOption(rawArgs, "--out") ?? "benchmark-artifacts/comparisons/tfhe-rs";
const artifactId = readOption(rawArgs, "--artifact-id");
const generatedAt = readOption(rawArgs, "--generated-at");

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  node prototype/tfhe-rs-benchmark.mjs --plan",
    "  node prototype/tfhe-rs-benchmark.mjs --adapter",
    "  node prototype/tfhe-rs-benchmark.mjs --artifact",
    "  node prototype/tfhe-rs-benchmark.mjs --run",
    "  node prototype/tfhe-rs-benchmark.mjs --run --artifact",
    "",
    "--plan prints the native TFHE-rs build plan.",
    "--adapter prints the digest-bound adapter contract.",
    "--artifact writes the adapter plan or native run result as a comparison artifact.",
    "--artifact-id <id> and --generated-at <iso> make artifact output reproducible.",
    "--run builds and executes the TFHE-rs demo with Cargo.",
  ].join("\n"));
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
