#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import {
  buildReleaseEvidenceIndex,
  publishReleaseEvidenceIndex,
} from "./lib/release-evidence.mjs";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPublishArtifact = args.has("--artifact") || args.has("--publish");
const outputDir = readOption(rawArgs, "--out") ?? "benchmark-artifacts/release-evidence";
const artifactId = readOption(rawArgs, "--artifact-id");
const generatedAt = readOption(rawArgs, "--generated-at");

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  npm run release:evidence",
    "  npm run release:evidence -- --artifact",
    "",
    "Prints a compact release-gate evidence index from committed artifacts.",
    "--artifact writes benchmark-artifacts/release-evidence/latest.json plus a timestamped run artifact.",
    "--artifact-id <id> and --generated-at <iso> make artifact output reproducible.",
  ].join("\n"));
  process.exit(0);
}

const index = buildReleaseEvidenceIndex({ generatedAt });

if (shouldPublishArtifact) {
  const published = await publishReleaseEvidenceIndex({
    outputDir,
    artifactId,
    generatedAt,
    index,
  });
  console.log(JSON.stringify(published, null, 2));
} else {
  console.log(JSON.stringify(index, null, 2));
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}
