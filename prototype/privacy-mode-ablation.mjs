#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

import {
  buildPaddingOverheadAblation,
} from "./lib/benchmark.mjs";
import { activeEvents, buildSparseEventWindow, flattenEventWindow } from "./lib/events.mjs";
import { buildDemoLinearModel } from "./lib/linear-algebra.mjs";
import {
  createToyCipher,
  createToyKeypair,
  decrypt,
} from "./lib/toy-paillier.mjs";

const rawArgs = process.argv.slice(2);
const args = parseArgs(rawArgs);
const shouldPublishArtifact = args.artifact === "true" || args.publish === "true";
const iterations = Number(args.iterations ?? 25);
const paddedSlotCount = Number(args["padded-slot-count"] ?? 32);

if (!Number.isInteger(iterations) || iterations <= 0) {
  throw new Error("--iterations must be a positive integer");
}
if (!Number.isInteger(paddedSlotCount) || paddedSlotCount <= 0) {
  throw new Error("--padded-slot-count must be a positive integer");
}

const eventWindow = buildSparseEventWindow();
const baseReport = buildPaddingOverheadAblation(eventWindow, 2, { paddedSlotCount });
const report = attachToyRuntimeMeasurements(baseReport, eventWindow, { iterations });

if (shouldPublishArtifact) {
  const published = await publishPrivacyModeArtifact(report, {
    outputDir: args.out ?? "benchmark-artifacts/privacy-modes/padding-ablation",
    artifactId: args["artifact-id"],
    generatedAt: args["generated-at"],
  });
  console.log(JSON.stringify(published, null, 2));
} else {
  console.log(JSON.stringify(report, null, 2));
}

function attachToyRuntimeMeasurements(report, eventWindow, options = {}) {
  const measurements = report.modes.map((mode) => ({
    modeId: mode.id,
    iterations: options.iterations,
    averageLatencyMs: measureToyLatency(eventWindow, mode.encryptedFeatureSlots, options.iterations),
  }));
  const baseline = measurements[0]?.averageLatencyMs || 1;

  return {
    ...report,
    measurementBasis:
      "synthetic-events-v0 operation-count model plus local toy arithmetic timing",
    runtimeMeasurements: measurements.map((measurement) => ({
      ...measurement,
      relativeLatency: Number((measurement.averageLatencyMs / baseline).toFixed(2)),
    })),
    runtimeMeasurementCaveat:
      "Runtime uses deterministic toy additive arithmetic in Node.js. It quantifies local harness overhead only and is not OpenFHE, TFHE-rs, security, energy, or production performance evidence.",
  };
}

function measureToyLatency(eventWindow, slotCount, iterations) {
  const samples = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const started = performance.now();
    runToySparseScore(eventWindow, slotCount, iteration + 1);
    samples.push(performance.now() - started);
  }
  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  return Number(average.toFixed(3));
}

function runToySparseScore(eventWindow, slotCount, seed) {
  const vector = flattenEventWindow(eventWindow);
  const model = buildDemoLinearModel({ featureCount: vector.length, channels: eventWindow.channels });
  const realEvents = activeEvents(eventWindow).map(({ index, value }) => ({ index, value }));
  const eventSlots = Array.from({ length: slotCount }, (_, index) => {
    return realEvents[index] ?? { index: 0, value: 0, dummy: true };
  });
  const { publicKey, privateKey } = createToyKeypair();
  const cipher = createToyCipher(publicKey, { seed });
  const encryptedEvents = eventSlots.map((event) => ({
    ...event,
    ciphertext: cipher.encrypt(event.value),
  }));

  for (const label of model.classes) {
    let acc = cipher.encrypt(model.bias[label]);
    for (const event of encryptedEvents) {
      const weight = event.dummy ? 0 : model.weights[label][event.index];
      acc = cipher.add(acc, cipher.scalarMultiply(event.ciphertext, weight));
    }
    decrypt(publicKey, privateKey, acc);
  }
}

async function publishPrivacyModeArtifact(subject, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactId =
    options.artifactId ??
    `padding-ablation-${generatedAt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}`;
  const artifact = {
    schema: "neurofhe.privacyModeAblationArtifact.v1",
    artifactId,
    generatedAt,
    subjectSchema: subject.schema,
    subject,
    productionClaim: false,
  };
  const runsDir = join(options.outputDir, "runs");
  const runPath = join(runsDir, `${artifactId}.json`);
  const latestPath = join(options.outputDir, "latest.json");
  const json = `${JSON.stringify(artifact, null, 2)}\n`;

  await mkdir(runsDir, { recursive: true });
  await writeFile(runPath, json, "utf8");
  await writeFile(latestPath, json, "utf8");

  return {
    schema: "neurofhe.privacyModeAblationArtifact.publish.v1",
    artifactId,
    paths: {
      run: runPath,
      latest: latestPath,
    },
    subjectSchema: subject.schema,
    artifact,
  };
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--")
      ? argv[++index]
      : "true";
    parsed[key] = value;
  }
  return parsed;
}
