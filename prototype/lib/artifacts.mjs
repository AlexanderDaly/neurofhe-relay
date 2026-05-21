// SPDX-License-Identifier: CC0-1.0

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildBenchmarkArtifact, runPrototypeBenchmark } from "./benchmark.mjs";

export async function publishBenchmarkArtifact(options = {}) {
  const outputDir = options.outputDir ?? "benchmark-artifacts";
  const benchmark = options.benchmark ?? runPrototypeBenchmark({ seed: options.seed ?? 91 });
  const artifact = buildBenchmarkArtifact(benchmark, {
    artifactId: options.artifactId,
    generatedAt: options.generatedAt,
  });
  const runsDir = join(outputDir, "runs");
  const runPath = join(runsDir, `${artifact.artifactId}.json`);
  const latestPath = join(outputDir, "latest.json");
  const json = `${JSON.stringify(artifact, null, 2)}\n`;

  await mkdir(runsDir, { recursive: true });
  await writeFile(runPath, json, "utf8");
  await writeFile(latestPath, json, "utf8");

  return {
    schema: "neurofhe.benchmarkArtifact.publish.v1",
    artifactId: artifact.artifactId,
    paths: {
      run: runPath,
      latest: latestPath,
    },
    requiredFields: artifact.requiredFields,
    artifact,
  };
}
