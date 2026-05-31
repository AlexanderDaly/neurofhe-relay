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
  "benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json",
];
const REAL_NMNIST_ARTIFACT_PATH =
  "benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json";
const NMNIST_BLOCKER_ARTIFACT_PATH =
  "benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/latest.json";

export function buildReleaseEvidenceIndex(options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactReader = options.artifactReader ?? readJsonIfExists;
  const requiredArtifacts = SOURCE_ARTIFACT_PATHS.map((path) => ({
    path,
    artifact: artifactReader(path),
  }));
  const realNmnistArtifact = artifactReader(REAL_NMNIST_ARTIFACT_PATH);
  const nmnistBlockerArtifact = artifactReader(NMNIST_BLOCKER_ARTIFACT_PATH);
  const nmnistArtifact =
    realNmnistArtifact?.subject?.schema === "neurofhe.plaintextBaseline.v1"
      ? {
          path: REAL_NMNIST_ARTIFACT_PATH,
          artifact: realNmnistArtifact,
        }
      : {
          path: NMNIST_BLOCKER_ARTIFACT_PATH,
          artifact: nmnistBlockerArtifact,
        };
  const artifacts = [
    ...requiredArtifacts.slice(0, 5),
    nmnistArtifact,
    ...requiredArtifacts.slice(5),
  ];
  const sourceArtifacts = artifacts.map(({ path, artifact }) => summarizeSourceArtifact(path, artifact));
  const byPath = {
    ...Object.fromEntries(artifacts.map(({ path, artifact }) => [path, artifact])),
    [REAL_NMNIST_ARTIFACT_PATH]: realNmnistArtifact,
    [NMNIST_BLOCKER_ARTIFACT_PATH]: nmnistBlockerArtifact,
  };
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
  const realNmnistBaseline = summarizeRealNmnistBaseline(
    byPath[REAL_NMNIST_ARTIFACT_PATH] ?? byPath[NMNIST_BLOCKER_ARTIFACT_PATH],
  );
  const tfheRealDataPath = summarizeTfheRealDataPath(
    byPath["benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json"],
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
      realNmnistBaseline,
      tfheRealDataPath,
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
        ? hostedPortableCi.smallestNextStep
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
  if (artifact.hostedPortableCiSatisfied === true) {
    return {
      status: "pass",
      reason:
        artifact.reason ??
        artifact.blocker?.currentObservation ??
        "Hosted portable CI reports the hosted check satisfied.",
      artifactId: artifact.artifactId,
      openPullRequestCount: artifact.observedRepositoryState?.openPullRequests?.length ?? null,
      workflowTrigger: artifact.workflowState?.currentTrigger ?? null,
      isCodeFailure: artifact.blocker?.isCodeFailure ?? null,
      smallestNextStep: artifact.smallestNextStep ?? "Continue through RELEASE.md.",
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
    openPullRequestCount: artifact.observedRepositoryState?.openPullRequests?.length ?? null,
    workflowTrigger: artifact.workflowState?.currentTrigger ?? null,
    isCodeFailure: artifact.blocker?.isCodeFailure ?? null,
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
  const gaps = summary?.measurementGaps;
  if (!artifact || !summary || !coverage) {
    return {
      status: "missing",
      reason: "Native evidence measurement coverage is missing.",
      artifactId: artifact?.artifactId ?? null,
      measurementCoverage: null,
      measurementGapCount: null,
      measurementGaps: null,
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
    measurementGapCount: gaps?.gapCount ?? null,
    measurementGaps: gaps ?? null,
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

function summarizeRealNmnistBaseline(artifact) {
  const subject = artifact?.subject;
  if (!artifact || !subject) {
    return {
      status: "missing",
      reason: "Real public N-MNIST baseline artifact or blocker is missing.",
      artifactId: artifact?.artifactId ?? null,
      datasetKind: null,
      attemptedCommand: null,
      smallestNextStep:
        "Publish a real N-MNIST baseline artifact or refresh the local dataset blocker.",
    };
  }
  if (subject.schema === "neurofhe.plaintextBaseline.unavailable.v1") {
    return {
      status: "blocked",
      reason:
        subject.blocker?.reason ??
        "Real public N-MNIST baseline is blocked by unavailable local dataset files.",
      artifactId: artifact.artifactId,
      datasetKind: subject.datasetKind ?? null,
      datasetRoot: subject.blocker?.datasetRoot ?? null,
      attemptedCommand: subject.attemptedCommand ?? null,
      smallestNextStep: subject.smallestNextStep ?? null,
    };
  }
  if (subject.source?.datasetKind === "public-nmnist-local-copy") {
    return {
      status: "pass",
      reason: "Real public N-MNIST plaintext baseline artifact is present.",
      artifactId: artifact.artifactId,
      datasetKind: subject.source.datasetKind,
      accuracy: subject.metrics?.accuracy ?? subject.accuracy ?? null,
      sampleCount:
        subject.metrics?.total ?? subject.evaluation?.sampleCount ?? null,
      smallestNextStep:
        "Review the N-MNIST baseline caveats before using it in release evidence.",
    };
  }
  return {
    status: "caveated",
    reason: "N-MNIST artifact is present but not recognized as real public baseline evidence.",
    artifactId: artifact.artifactId,
    datasetKind: subject.datasetKind ?? subject.source?.datasetKind ?? null,
    attemptedCommand: subject.attemptedCommand ?? null,
    smallestNextStep: "Review the N-MNIST artifact before using it in release evidence.",
  };
}

function summarizeTfheRealDataPath(artifact) {
  const subject = artifact?.subject;
  if (!artifact || !subject) {
    return {
      status: "missing",
      reason: "TFHE-rs real-data input blocker artifact is missing.",
      artifactId: artifact?.artifactId ?? null,
      inputDatasetKind: null,
      scoreDomain: null,
      smallestNextStep:
        "Publish a TFHE-rs real-data blocker or implement the EEG-derived TFHE-rs input path.",
    };
  }
  if (subject.schema === "neurofhe.tfheRs.realDataUnavailable.v1") {
    return {
      status: "blocked",
      reason: subject.blocker?.reason ?? "TFHE-rs real-data input path is blocked.",
      artifactId: artifact.artifactId,
      inputDatasetKind: subject.inputContract?.datasetKind ?? null,
      scoreDomain: subject.inputContract?.scoreDomain ?? null,
      attemptedCommand: subject.attemptedCommand ?? null,
      smallestNextStep: subject.smallestNextStep ?? null,
    };
  }
  return {
    status: "caveated",
    reason: "TFHE-rs real-data input artifact is present but not recognized as release-gate evidence.",
    artifactId: artifact.artifactId,
    inputDatasetKind: subject.inputContract?.datasetKind ?? null,
    scoreDomain: subject.inputContract?.scoreDomain ?? null,
    smallestNextStep: "Review the TFHE-rs real-data artifact before using it in release evidence.",
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
