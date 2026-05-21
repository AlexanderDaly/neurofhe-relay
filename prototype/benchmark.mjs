#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { runPrototypeBenchmark } from "./lib/benchmark.mjs";
import { publishBenchmarkArtifact } from "./lib/artifacts.mjs";

const args = process.argv.slice(2);
const shouldPublishArtifact = args.includes("--artifact") || args.includes("--publish");
const outputDir = readOption(args, "--out") ?? "benchmark-artifacts";
const seed = Number(readOption(args, "--seed") ?? 91);

if (shouldPublishArtifact) {
  const published = await publishBenchmarkArtifact({ outputDir, seed });
  console.log(JSON.stringify(published, null, 2));
} else {
  console.log(JSON.stringify(runPrototypeBenchmark({ seed }), null, 2));
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}
