#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import {
  buildRepositoryHygieneArtifact,
  publishRepositoryHygieneArtifact,
  scanRepositoryHygiene,
} from "../lib/repo-hygiene.mjs";

const options = parseArgs(process.argv.slice(2));
const scanResult = scanRepositoryHygiene({ root: "." });

if (options.artifact) {
  const published = await publishRepositoryHygieneArtifact({
    artifactId: options.artifactId,
    generatedAt: options.generatedAt,
    outputDir: options.outputDir,
    command: buildCommand(options),
  });
  console.log(JSON.stringify(published, null, 2));
} else if (options.json) {
  const artifact = buildRepositoryHygieneArtifact(scanResult, {
    artifactId: options.artifactId,
    generatedAt: options.generatedAt,
    command: buildCommand(options),
  });
  console.log(JSON.stringify(artifact, null, 2));
} else {
  printHumanResult(scanResult);
}

if (scanResult.findings.length > 0) process.exit(1);

function parseArgs(args) {
  const parsed = {
    artifact: false,
    json: false,
    artifactId: undefined,
    generatedAt: undefined,
    outputDir: undefined,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--artifact") parsed.artifact = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--artifact-id") parsed.artifactId = args[++i];
    else if (arg === "--generated-at") parsed.generatedAt = args[++i];
    else if (arg === "--out") parsed.outputDir = args[++i];
    else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function printHumanResult(result) {
  for (const finding of result.findings) {
    if (finding.category === "raw-dataset-path") {
      console.log(`${finding.path}: ${finding.message}`);
    } else if (finding.category === "placeholder") {
      console.log(`${finding.path}:${finding.line}:placeholder:${finding.excerpt}`);
    } else if (finding.category === "secret") {
      console.log(`${finding.path}:${finding.line}:secret:${finding.id}`);
    }
  }

  if (result.findings.length === 0) console.log("repository hygiene scan ok");
}

function buildCommand(options) {
  const args = ["node prototype/scripts/placeholder-scan.mjs"];
  if (options.artifact) args.push("--artifact");
  if (options.json) args.push("--json");
  if (options.outputDir) args.push("--out", options.outputDir);
  if (options.artifactId) args.push("--artifact-id", options.artifactId);
  if (options.generatedAt) args.push("--generated-at", options.generatedAt);
  return args.join(" ");
}
