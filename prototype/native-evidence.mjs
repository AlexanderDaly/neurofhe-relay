// SPDX-License-Identifier: CC0-1.0

import {
  buildNativeEvidenceManifest,
  publishNativeEvidenceArtifact,
} from "./lib/native-evidence.mjs";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPublishArtifact = args.has("--artifact") || args.has("--publish");
const outputDir = readOption(rawArgs, "--out") ?? "benchmark-artifacts/native-evidence";
const artifactId = readOption(rawArgs, "--artifact-id");
const generatedAt = readOption(rawArgs, "--generated-at");

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  npm run native:doctor",
    "  npm run native:doctor -- --artifact",
    "",
    "Prints a host-specific native OpenFHE/TFHE-rs evidence manifest.",
    "--artifact writes benchmark-artifacts/native-evidence/latest.json plus a timestamped run artifact.",
    "--artifact-id <id> and --generated-at <iso> make artifact output reproducible.",
  ].join("\n"));
  process.exit(0);
}

const manifest = buildNativeEvidenceManifest({ generatedAt });

if (shouldPublishArtifact) {
  const published = await publishNativeEvidenceArtifact({
    outputDir,
    artifactId,
    generatedAt,
    manifest,
  });
  console.log(JSON.stringify(published, null, 2));
} else {
  console.log(JSON.stringify(manifest, null, 2));
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}
