#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import {
  evaluateRepresentationReconstructionRisk,
  publishReconstructionRiskArtifact,
} from "./lib/reconstruction-risk.mjs";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPublishArtifact = args.has("--artifact") || args.has("--publish");
const outputDir = readOption(rawArgs, "--out") ?? "benchmark-artifacts/reconstruction-risk";
const artifactId = readOption(rawArgs, "--artifact-id");
const generatedAt = readOption(rawArgs, "--generated-at");

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  npm run reconstruction:risk",
    "  npm run reconstruction:risk -- --artifact",
    "",
    "Prints deterministic synthetic reconstruction-risk probes for the gateway model-facing event.",
    "--artifact writes benchmark-artifacts/reconstruction-risk/latest.json plus a timestamped run artifact.",
    "--artifact-id <id> and --generated-at <iso> make artifact output reproducible.",
  ].join("\n"));
  process.exit(0);
}

const report = evaluateRepresentationReconstructionRisk({ generatedAt });

if (shouldPublishArtifact) {
  const published = await publishReconstructionRiskArtifact({
    outputDir,
    artifactId,
    generatedAt,
    report,
  });
  console.log(JSON.stringify(published, null, 2));
} else {
  console.log(JSON.stringify(report, null, 2));
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}
