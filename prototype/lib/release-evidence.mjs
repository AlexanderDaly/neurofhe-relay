// SPDX-License-Identifier: CC0-1.0

import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SOURCE_ARTIFACT_PATHS = [
  "benchmark-artifacts/ci-blockers/latest.json",
  "benchmark-artifacts/repo-hygiene/latest.json",
  "benchmark-artifacts/native-evidence/latest.json",
  "benchmark-artifacts/privacy-modes/padding-ablation/latest.json",
  "benchmark-artifacts/reconstruction-risk/latest.json",
];

export function buildReleaseEvidenceIndex(options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactReader = options.artifactReader ?? readJsonIfExists;
  const artifacts = SOURCE_ARTIFACT_PATHS.map((path) => ({
    path,
    artifact: artifactReader(path),
  }));
  const sourceArtifacts = artifacts.map(({ path, artifact }) => summarizeSourceArtifact(path, artifact));
  const byPath = Object.fromEntries(artifacts.map(({ path, artifact }) => [path, artifact]));
  const hostedPortableCi = summarizeHostedPortableCi(
    byPath["benchmark-artifacts/ci-blockers/latest.json"],
  );
  const repositoryHygiene = summarizeRepositoryHygiene(
    byPath["benchmark-artifacts/repo-hygiene/latest.json"],
  );
  const nativeMeasurementCoverage = summarizeNativeEvidence(
    byPath["benchmark-artifacts/native-evidence/latest.json"],
  );
  const metadataLeakage = summarizeMetadataLeakage(
    byPath["benchmark-artifacts/privacy-modes/padding-ablation/latest.json"],
  );
  const reconstructionRisk = summarizeReconstructionRisk(
    byPath["benchmark-artifacts/reconstruction-risk/latest.json"],
  );
  const productionClaim = sourceArtifacts.every(
    (artifact) => artifact.present && artifact.productionClaim === false,
  );

  return {
    schema: "neurofhe.releaseEvidenceIndex.v1",
    generatedAt,
    releaseTarget: "v0.1.0-research-alpha",
    purpose:
      "Provide a compact index of the current release-gate evidence without upgrading caveated research artifacts into release approval.",
    releaseGateSatisfied: false,
    gateChecks: {
      hostedPortableCi,
      repositoryHygiene,
      nativeMeasurementCoverage,
      metadataLeakage,
      reconstructionRisk,
      productionClaim: {
        status: productionClaim ? "pass" : "blocked",
        reason: productionClaim
          ? "Indexed artifacts keep productionClaim false."
          : "At least one indexed artifact is missing productionClaim false.",
      },
    },
    sourceArtifacts,
    nextReleaseStep:
      hostedPortableCi.status === "blocked"
        ? "Open a release-validation PR and obtain green portable hosted CI before tagging."
        : "Rerun RELEASE.md commands on the release machine, refresh artifacts or blocker reports, and update VALIDATION.md.",
    caveats: [
      "This index is a dashboard artifact, not benchmark evidence by itself.",
      "It does not create cryptographic, clinical, medical, side-channel, anonymity, or stable performance claims.",
      "Release tagging still requires the RELEASE.md gate and explicit user approval.",
    ],
    productionClaim: false,
  };
}

export async function publishReleaseEvidenceIndex(options = {}) {
  const outputDir = options.outputDir ?? "benchmark-artifacts/release-evidence";
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactId =
    options.artifactId ?? artifactIdFromTimestamp("release-evidence", generatedAt);
  const index = options.index ?? buildReleaseEvidenceIndex({ generatedAt });
  const artifact = {
    schema: "neurofhe.releaseEvidenceArtifact.v1",
    artifactId,
    generatedAt,
    subjectSchema: index.schema,
    subject: index,
    productionClaim: false,
  };
  const runsDir = join(outputDir, "runs");
  const runPath = join(runsDir, `${artifactId}.json`);
  const latestPath = join(outputDir, "latest.json");
  const json = `${JSON.stringify(artifact, null, 2)}\n`;

  await mkdir(runsDir, { recursive: true });
  await writeFile(runPath, json, "utf8");
  await writeFile(latestPath, json, "utf8");

  return {
    schema: "neurofhe.releaseEvidenceArtifact.publish.v1",
    artifactId,
    paths: {
      run: runPath,
      latest: latestPath,
    },
    subjectSchema: artifact.subjectSchema,
    artifact,
  };
}

function summarizeSourceArtifact(path, artifact) {
  return {
    path,
    present: Boolean(artifact),
    schema: artifact?.schema ?? null,
    artifactId: artifact?.artifactId ?? null,
    subjectSchema: artifact?.subjectSchema ?? artifact?.subject?.schema ?? null,
    productionClaim: artifact?.productionClaim ?? null,
  };
}

function summarizeHostedPortableCi(artifact) {
  if (!artifact) {
    return {
      status: "missing",
      reason: "CI blocker artifact is missing.",
      artifactId: null,
      smallestNextStep: "Refresh the CI blocker artifact or run hosted portable CI.",
    };
  }
  if (artifact.releaseGateSatisfied === true) {
    return {
      status: "pass",
      reason: "CI blocker artifact reports the release gate satisfied.",
      artifactId: artifact.artifactId,
      smallestNextStep: "Continue through RELEASE.md.",
    };
  }
  return {
    status: "blocked",
    reason:
      artifact.reason ??
      artifact.blocker?.currentObservation ??
      artifact.blocker?.category ??
      "Hosted portable CI is not green.",
    artifactId: artifact.artifactId,
    smallestNextStep:
      artifact.smallestNextStep ??
      artifact.nextStep ??
      "Open a release-validation PR and obtain green hosted CI.",
  };
}

function summarizeRepositoryHygiene(artifact) {
  if (!artifact) {
    return {
      status: "missing",
      reason: "Repository hygiene artifact is missing.",
      artifactId: null,
      findingsCount: null,
    };
  }
  return {
    status: artifact.result === "pass" ? "pass" : "blocked",
    reason:
      artifact.result === "pass"
        ? "Repository hygiene scan reports pass."
        : "Repository hygiene scan has findings.",
    artifactId: artifact.artifactId,
    findingsCount: artifact.findingsCount ?? artifact.findings?.length ?? null,
  };
}

function summarizeNativeEvidence(artifact) {
  const summary = artifact?.subject?.summary;
  const coverage = summary?.measurementCoverage;
  if (!artifact || !summary || !coverage) {
    return {
      status: "missing",
      reason: "Native evidence measurement coverage is missing.",
      artifactId: artifact?.artifactId ?? null,
      measurementCoverage: null,
    };
  }
  const incomplete =
    coverage.ciphertextBytesMissingCount > 0 ||
    coverage.ciphertextBytesPartialCount > 0 ||
    coverage.rssOrPeakMemoryMissingCount > 0 ||
    coverage.rssOrPeakMemoryPartialCount > 0;
  return {
    status: incomplete ? "incomplete" : "pass",
    reason: incomplete
      ? "Native evidence remains incomplete for ciphertext-byte and/or RSS/peak-memory measurements."
      : "Native evidence reports complete ciphertext-byte and RSS/peak-memory coverage.",
    artifactId: artifact.artifactId,
    laneCount: summary.laneCount,
    realNativeRunCount: summary.realNativeRunCount,
    measurementCoverage: coverage,
  };
}

function summarizeMetadataLeakage(artifact) {
  const subject = artifact?.subject;
  if (!artifact || !subject?.metadataLeakageSummary) {
    return {
      status: "missing",
      reason: "Metadata leakage summary artifact is missing.",
      artifactId: artifact?.artifactId ?? null,
      metric: null,
    };
  }
  return {
    status: "caveated",
    reason:
      "Metadata leakage metric is a documented observable-category proxy, not a formal privacy proof.",
    artifactId: artifact.artifactId,
    metric: subject.metadataLeakageSummary.metric,
    highestExposureMode: subject.metadataLeakageSummary.highestExposureMode,
    lowestExposureMode: subject.metadataLeakageSummary.lowestExposureMode,
  };
}

function summarizeReconstructionRisk(artifact) {
  const subject = artifact?.subject;
  const summary = subject?.summary;
  if (!artifact || !summary) {
    return {
      status: "missing",
      reason: "Reconstruction-risk probe artifact is missing.",
      artifactId: artifact?.artifactId ?? null,
      privacyProofClaim: null,
    };
  }
  const residualRisk =
    summary.publicPositionLinkage?.status === "residual-risk" ||
    summary.rawPayloadReplay?.status !== "blocked" ||
    summary.activeValueRecovery?.status !== "blocked";
  return {
    status: residualRisk ? "caveated" : "pass",
    reason: residualRisk
      ? "Synthetic probes block raw payload replay and active-value recovery while preserving public-position residual risk."
      : "Synthetic probes report no residual reconstruction-risk finding.",
    artifactId: artifact.artifactId,
    privacyProofClaim: subject.privacyProofClaim === true,
    rawPayloadReplay: summary.rawPayloadReplay?.status ?? null,
    activeValueRecovery: summary.activeValueRecovery?.status ?? null,
    publicPositionLinkage: summary.publicPositionLinkage?.status ?? null,
  };
}

function readJsonIfExists(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function artifactIdFromTimestamp(prefix, generatedAt) {
  return `${prefix}-${generatedAt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}`;
}
