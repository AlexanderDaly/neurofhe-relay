// SPDX-License-Identifier: CC0-1.0

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  applyPrivacySafetyPolicy,
  buildDefaultGatewayPolicy,
  normalizeRawSignal,
} from "./gateway.mjs";
import {
  buildSimulatedRawNeuralFrame,
  sortSpatialSpikes,
} from "./spike-sorter.mjs";

const RAW_SENTINELS = [
  "RAW-RECONSTRUCTION-SENTINEL-001",
  "electrode-secret-7",
  "LOCAL-CALIBRATION-RECONSTRUCTION-SECRET",
  "DO-NOT-EXPORT-RAW-RECONSTRUCTION-PAYLOAD",
];

export function evaluateRepresentationReconstructionRisk(options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const modelEvent = options.modelEvent ?? buildProbeModelEvent();
  const serializedModelEvent = JSON.stringify(modelEvent);
  const rawPayloadReplayLeaked = RAW_SENTINELS.filter((sentinel) =>
    serializedModelEvent.includes(sentinel),
  );
  const plaintextActivePositions = modelEvent?.plaintext?.activePositions ?? [];
  const encryptedActiveValues = modelEvent?.encrypted?.activeSpikeValues ?? [];
  const plaintextValues = plaintextActivePositions.filter((position) => "value" in position);
  const residualSignals = modelEvent?.reconstructionResistance?.residualMetadataLeakage ?? [];
  const attackProbes = [
    {
      id: "raw-payload-replay",
      target: "raw sample payload and local calibration identifiers",
      status: rawPayloadReplayLeaked.length === 0 ? "blocked" : "failed",
      blockedBy: [
        "gateway payload withholding",
        "source identifier hashing",
        "raw payload hash withheld from model-facing event",
      ],
      leakedSentinels: rawPayloadReplayLeaked,
    },
    {
      id: "active-value-recovery",
      target: "active sorted-event values in plaintext model-facing fields",
      status:
        plaintextValues.length === 0 &&
        encryptedActiveValues.length === plaintextActivePositions.length
          ? "blocked"
          : "failed",
      plaintextValueCount: plaintextValues.length,
      encryptedReferenceCount: encryptedActiveValues.length,
      blockedBy: ["active values exported as encrypted references only"],
    },
    {
      id: "public-position-linkage",
      target: "spatial and timing metadata visible through public active positions",
      status: residualSignals.length > 0 ? "residual-risk" : "not-evaluated",
      leakageSignals: residualSignals,
      caveat:
        "This probe records residual metadata visibility; it is not a reconstruction attack success metric.",
    },
  ];

  return {
    schema: "neurofhe.reconstructionRiskProbes.v1",
    generatedAt,
    measurementBasis:
      "deterministic gateway policy probes over synthetic sorted-event input with raw sentinel payloads",
    boundaryDomain: "bio-digital-event-intelligence",
    representation: "spatial-sorted-events",
    attackProbes,
    summary: {
      rawPayloadReplay: summarizeProbe(attackProbes[0]),
      activeValueRecovery: summarizeProbe(attackProbes[1]),
      publicPositionLinkage: summarizeProbe(attackProbes[2]),
    },
    acceptanceCriteria: [
      "raw sentinels must not appear in the model-facing event",
      "active values must not appear in plaintext active positions",
      "residual public-position linkage must remain explicit until padded or dense modes are tested",
    ],
    caveats: [
      "Synthetic policy probe only; not a formal reconstruction-resistance proof.",
      "Does not estimate mutual information, identity leakage, membership inference, or side-channel leakage.",
      "Public active positions still expose spatial and timing metadata unless padding, batching, or dense windows are selected.",
    ],
    smallestNextStep:
      "Add a real attack harness that attempts raw-window or identity reconstruction across public-position, padded-sparse, and dense-window modes.",
    privacyProofClaim: false,
    productionClaim: false,
  };
}

export function buildReconstructionRiskArtifact(report, options = {}) {
  const generatedAt = options.generatedAt ?? report.generatedAt ?? new Date().toISOString();
  const artifactId =
    options.artifactId ?? artifactIdFromTimestamp("reconstruction-risk-probes", generatedAt);

  return {
    schema: "neurofhe.reconstructionRiskArtifact.v1",
    artifactId,
    generatedAt,
    subjectSchema: report.schema,
    subject: report,
    productionClaim: false,
  };
}

export async function publishReconstructionRiskArtifact(options = {}) {
  const outputDir = options.outputDir ?? "benchmark-artifacts/reconstruction-risk";
  const report =
    options.report ??
    evaluateRepresentationReconstructionRisk({ generatedAt: options.generatedAt });
  const artifact = buildReconstructionRiskArtifact(report, {
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
    schema: "neurofhe.reconstructionRiskArtifact.publish.v1",
    artifactId: artifact.artifactId,
    paths: {
      run: runPath,
      latest: latestPath,
    },
    subjectSchema: artifact.subjectSchema,
    artifact,
  };
}

function buildProbeModelEvent() {
  const sorted = sortSpatialSpikes(buildSimulatedRawNeuralFrame());
  const rawSignal = {
    schema: "neurofhe.gateway.rawSignal.v1",
    intakeId: "raw-sorted-event-reconstruction-probe-001",
    observedAt: "2026-05-27T16:00:00.000Z",
    receivedAt: "2026-05-27T16:00:03.000Z",
    localOnly: true,
    sensitivity: "sensitive-by-default",
    source: {
      sourceId: "reconstruction-probe-source-local",
      kind: "simulated-bio-digital-event-stream",
      adapter: "local-sorted-event-import",
      authorization: "synthetic-demo-only",
    },
    payload: {
      sortedNeuralEvent: {
        schema: "neurofhe.gateway.sortedNeuralEvent.v1",
        eventWindow: sorted.eventWindow,
        encoder: sorted.encoder,
        sorterConfig: {
          ...sorted.config,
          localCalibrationRef: RAW_SENTINELS[2],
        },
        sourcePayload: {
          rawNeuralSamples: [
            {
              sampleId: RAW_SENTINELS[0],
              electrodeId: RAW_SENTINELS[1],
              timestampUs: 1234,
              amplitude: 9001,
            },
          ],
          operatorNote: RAW_SENTINELS[3],
        },
      },
    },
  };
  const normalized = normalizeRawSignal(rawSignal);
  return applyPrivacySafetyPolicy(normalized, buildDefaultGatewayPolicy()).modelFacingEvent;
}

function summarizeProbe(probe) {
  const summary = {
    status: probe.status,
  };
  if (probe.leakageSignals) summary.leakageSignals = probe.leakageSignals;
  if (probe.leakedSentinels) summary.leakedSentinels = probe.leakedSentinels;
  if (Number.isInteger(probe.plaintextValueCount)) {
    summary.plaintextValueCount = probe.plaintextValueCount;
  }
  return summary;
}

function artifactIdFromTimestamp(prefix, generatedAt) {
  return `${prefix}-${generatedAt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}`;
}
