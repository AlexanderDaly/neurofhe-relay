// SPDX-License-Identifier: CC0-1.0

import { runPrototypeBenchmark } from "./benchmark.mjs";

export function runDemo(options = {}) {
  const benchmark = runPrototypeBenchmark(options);
  return {
    project: benchmark.project,
    demo: "toy encrypted sparse spike-count classifier",
    prototypeCodename: benchmark.demo,
    caveat:
      "Educational additive HE demo only; replace with audited HE/FHE library for real prototype.",
    privacyBoundary: benchmark.privacyBoundary,
    boundaryDomain: benchmark.boundaryDomain,
    eventWindow: {
      ...benchmark.eventWindow,
      spikeCount: benchmark.sparseMetrics.spikeCount,
      density: Number(benchmark.sparseMetrics.density.toFixed(4)),
    },
    encryptedPreview: benchmark.encryptedPreview,
    linearModel: benchmark.linearModel,
    publicModel: benchmark.publicModel,
    operationCounts: benchmark.operationCounts,
    denseBaseline: benchmark.denseBaseline,
    cryptoInventory: benchmark.cryptoInventory,
    decryptedScores: benchmark.results.decryptedScores,
    classification: benchmark.results.classification,
    nextStep: benchmark.nextStep,
  };
}
