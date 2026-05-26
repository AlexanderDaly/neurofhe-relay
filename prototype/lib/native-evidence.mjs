// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { arch, platform, release } from "node:os";
import { join } from "node:path";

import { buildFramingGuardrail } from "./benchmark.mjs";
import { detectOpenFhe } from "./openfhe-adapter.mjs";
import { detectTfheRs } from "./tfhe-rs-adapter.mjs";

const NATIVE_RUN_SCHEMAS = new Set([
  "neurofhe.openfhe.runComparison.v1",
  "neurofhe.openfheCkks.runComparison.v1",
  "neurofhe.tfheRs.runComparison.v1",
]);

const UNAVAILABLE_SCHEMAS = new Set([
  "neurofhe.openfhe.unavailable.v1",
  "neurofhe.openfheCkks.unavailable.v1",
  "neurofhe.tfheRs.unavailable.v1",
]);

const ADAPTER_OR_PLAN_SCHEMAS = new Set([
  "neurofhe.realLibraryAdapter.v1",
  "neurofhe.openfhe.integrationPlan.v1",
  "neurofhe.openfheCkks.integrationPlan.v1",
  "neurofhe.tfheRs.integrationPlan.v1",
]);

const LANE_CONFIGS = [
  {
    id: "openfhe-bfvrns",
    library: "OpenFHE",
    scheme: "BFVrns",
    latestArtifactPath: "benchmark-artifacts/comparisons/openfhe/latest.json",
    dependency: "openfhe",
    defaultCommands: [
      "npm run contract:eeg-openfhe -- --generated-at <ISO_TIMESTAMP>",
      "npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact --artifact-id <ARTIFACT_ID> --generated-at <ISO_TIMESTAMP>",
    ],
    nextMeasurement:
      "Repeat BFVrns on multiple EEG-derived windows and add serialized ciphertext byte or RSS measurements.",
  },
  {
    id: "openfhe-ckks",
    library: "OpenFHE",
    scheme: "CKKS",
    latestArtifactPath: "benchmark-artifacts/comparisons/openfhe-ckks/latest.json",
    dependency: "openfhe",
    defaultCommands: [
      "npm run contract:eeg-openfhe -- --generated-at <ISO_TIMESTAMP>",
      "npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact --artifact-id <ARTIFACT_ID> --generated-at <ISO_TIMESTAMP>",
    ],
    nextMeasurement:
      "Repeat CKKS on multiple EEG-derived windows and compare score drift across the sweep.",
  },
  {
    id: "tfhe-rs",
    library: "TFHE-rs",
    scheme: "integer-threshold",
    latestArtifactPath: "benchmark-artifacts/comparisons/tfhe-rs/latest.json",
    dependency: "tfhe-rs",
    defaultCommands: [
      "cargo test --manifest-path prototype/tfhe-rs/Cargo.toml",
      "npm run benchmark:tfhe -- --run --artifact --artifact-id <ARTIFACT_ID> --generated-at <ISO_TIMESTAMP>",
    ],
    nextMeasurement:
      "Add a real-data-derived TFHE-rs input path or publish a blocker if the integer threshold contract needs a new adapter.",
  },
];

export function buildNativeEvidenceManifest(options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactReader = options.artifactReader ?? readJsonIfExists;
  const openFheDetection = options.openFheDetection ?? detectOpenFhe(options);
  const tfheRsDetection = options.tfheRsDetection ?? detectTfheRs(options);
  const hostFingerprint = options.hostFingerprint ?? buildNativeHostFingerprint(options);

  const lanes = LANE_CONFIGS.map((config) => {
    const artifact = artifactReader(config.latestArtifactPath);
    const dependencyDetection =
      config.dependency === "openfhe" ? openFheDetection : tfheRsDetection;
    return buildNativeEvidenceLane({
      config,
      artifact,
      dependencyDetection,
    });
  });
  const counts = countLaneStatuses(lanes);

  return {
    schema: "neurofhe.nativeEvidence.manifest.v1",
    generatedAt,
    purpose:
      "Make native OpenFHE and TFHE-rs evidence reproducible by indexing the latest committed artifacts, host/toolchain fingerprint, exact rerun commands, and remaining blockers.",
    hostFingerprint,
    summary: {
      laneCount: lanes.length,
      realNativeRunCount: counts["real-native-run"] ?? 0,
      dependencyBlockerCount: counts["dependency-blocker"] ?? 0,
      adapterPlanOnlyCount: counts["adapter-plan-only"] ?? 0,
      missingArtifactCount: counts["missing-artifact"] ?? 0,
      otherEvidenceCount: counts["other-evidence"] ?? 0,
    },
    lanes,
    releaseUse: {
      releaseGateSatisfied: false,
      reason:
        "This manifest improves reproducibility, but it is not sufficient by itself for the release gate; hosted CI must be green and release commands in RELEASE.md must still be rerun or explicitly blocked on the release machine.",
      requiredBeforeTagging: [
        "green hosted portable CI",
        "fresh release-machine native runs or blocker artifacts",
        "VALIDATION.md updated with the exact commands and artifacts",
      ],
    },
    caveats: [
      "Native timings are host-specific local-machine evidence.",
      "OpenFHE must be installed and discoverable by CMake on reviewer machines.",
      "TFHE-rs results depend on the local Rust toolchain, crate lockfile, CPU, and build profile.",
      "No production cryptography, clinical, medical, side-channel, or stable performance claim is made.",
    ],
    framingGuardrail: buildFramingGuardrail(),
    productionClaim: false,
  };
}

export function classifyNativeEvidenceArtifact(artifact) {
  if (!artifact) {
    return {
      status: "missing-artifact",
      reason: "latest artifact not found",
    };
  }
  const subjectSchema = artifact.subjectSchema ?? artifact.subject?.schema;
  if (NATIVE_RUN_SCHEMAS.has(subjectSchema)) {
    return {
      status: "real-native-run",
      reason: "latest artifact records a native-library run",
    };
  }
  if (UNAVAILABLE_SCHEMAS.has(subjectSchema)) {
    return {
      status: "dependency-blocker",
      reason: artifact.subject?.blocker?.reason ?? "native dependency unavailable",
    };
  }
  if (ADAPTER_OR_PLAN_SCHEMAS.has(subjectSchema)) {
    return {
      status: "adapter-plan-only",
      reason: "latest artifact is an adapter or integration plan, not a native run",
    };
  }
  return {
    status: "other-evidence",
    reason: `unrecognized native evidence subject schema ${subjectSchema ?? "unknown"}`,
  };
}

export async function publishNativeEvidenceArtifact(options = {}) {
  const outputDir = options.outputDir ?? "benchmark-artifacts/native-evidence";
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactId =
    options.artifactId ?? artifactIdFromTimestamp("native-evidence", generatedAt);
  const manifest = options.manifest ?? buildNativeEvidenceManifest({ generatedAt });
  const artifact = {
    schema: "neurofhe.nativeEvidenceArtifact.v1",
    artifactId,
    generatedAt,
    subjectSchema: manifest.schema,
    subject: manifest,
    productionClaim: false,
  };
  const runsDir = join(outputDir, "runs");
  const runPath = join(runsDir, `${artifact.artifactId}.json`);
  const latestPath = join(outputDir, "latest.json");
  const json = `${JSON.stringify(artifact, null, 2)}\n`;

  await mkdir(runsDir, { recursive: true });
  await writeFile(runPath, json, "utf8");
  await writeFile(latestPath, json, "utf8");

  return {
    schema: "neurofhe.nativeEvidenceArtifact.publish.v1",
    artifactId: artifact.artifactId,
    paths: {
      run: runPath,
      latest: latestPath,
    },
    subjectSchema: artifact.subjectSchema,
    artifact,
  };
}

function buildNativeEvidenceLane({ config, artifact, dependencyDetection }) {
  const evidence = classifyNativeEvidenceArtifact(artifact);
  const subject = artifact?.subject;
  const nativeResult = subject?.nativeResult;
  const inputContractPath = subject?.inputContractPath;
  const commands = commandsForLane(config, inputContractPath);
  const gaps = gapsForLane(evidence.status, config, nativeResult);

  return {
    schema: "neurofhe.nativeEvidence.lane.v1",
    id: config.id,
    library: config.library,
    scheme: config.scheme,
    latestArtifactPath: config.latestArtifactPath,
    latestArtifactId: artifact?.artifactId ?? null,
    latestArtifactGeneratedAt: artifact?.generatedAt ?? null,
    dependencyDetection,
    evidence: {
      ...evidence,
      subjectSchema: artifact?.subjectSchema ?? subject?.schema ?? null,
      resultSchema: nativeResult?.schema ?? null,
      datasetKind: nativeResult?.datasetKind ?? subject?.inputContract?.datasetKind ?? null,
      inputSource: nativeResult?.inputSource ?? null,
      activeEventCount:
        nativeResult?.activeEventCount ?? subject?.inputContract?.activeEventCount ?? null,
      productionClaim: artifact?.productionClaim === true || subject?.productionClaim === true,
    },
    reproducibility: {
      hostSpecific: true,
      requiresLocalDependency: true,
      commands,
      artifactRefreshCommand:
        "npm run native:doctor -- --artifact --artifact-id <ARTIFACT_ID> --generated-at <ISO_TIMESTAMP>",
    },
    gaps,
    smallestNextStep: smallestNextStepForLane(evidence, config),
    productionClaim: false,
  };
}

function buildNativeHostFingerprint(options = {}) {
  const runCommand = options.runCommand ?? runVersionCommand;
  return {
    schema: "neurofhe.nativeEvidence.hostFingerprint.v1",
    platform: platform(),
    arch: arch(),
    osRelease: release(),
    node: process.version,
    toolchain: {
      npm: runCommand("npm", ["--version"]),
      cmake: runCommand("cmake", ["--version"]),
      cxx: firstAvailableCommand(runCommand, [
        ["c++", ["--version"]],
        ["clang++", ["--version"]],
        ["g++", ["--version"]],
      ]),
      cargo: runCommand("cargo", ["--version"]),
      rustc: runCommand("rustc", ["--version"]),
    },
  };
}

function runVersionCommand(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    command: [command, ...commandArgs].join(" "),
    available: result.status === 0,
    status: result.status,
    stdout: result.status === 0 ? firstLine(result.stdout) : "",
    stderr: result.status === 0 ? "" : firstLine(result.stderr),
  };
}

function firstAvailableCommand(runCommand, commands) {
  for (const [command, commandArgs] of commands) {
    const result = runCommand(command, commandArgs);
    if (result.available) return result;
  }
  return runCommand(commands[0][0], commands[0][1]);
}

function commandsForLane(config, inputContractPath) {
  if (!inputContractPath) return [...config.defaultCommands];
  if (config.id === "openfhe-bfvrns") {
    return [
      "npm run contract:eeg-openfhe -- --generated-at <ISO_TIMESTAMP>",
      `npm run benchmark:openfhe -- --run --input ${inputContractPath} --artifact --artifact-id <ARTIFACT_ID> --generated-at <ISO_TIMESTAMP>`,
    ];
  }
  if (config.id === "openfhe-ckks") {
    return [
      "npm run contract:eeg-openfhe -- --generated-at <ISO_TIMESTAMP>",
      `npm run benchmark:openfhe-ckks -- --run --input ${inputContractPath} --artifact --artifact-id <ARTIFACT_ID> --generated-at <ISO_TIMESTAMP>`,
    ];
  }
  return [...config.defaultCommands];
}

function gapsForLane(status, config, nativeResult) {
  const gaps = [config.nextMeasurement];
  if (status !== "real-native-run") {
    gaps.unshift("No current native run artifact for this lane.");
  }
  if (nativeResult?.ciphertextBytes === undefined) {
    gaps.push("Ciphertext byte measurements are absent or only partially reported.");
  }
  if (nativeResult?.rssBytes === undefined && nativeResult?.memory === undefined) {
    gaps.push("RSS or peak memory measurements are not reported.");
  }
  return gaps;
}

function smallestNextStepForLane(evidence, config) {
  if (evidence.status === "dependency-blocker") return evidence.reason;
  if (evidence.status === "missing-artifact") {
    return `Run ${config.defaultCommands.at(-1)} and publish the artifact or blocker.`;
  }
  if (evidence.status === "adapter-plan-only") {
    return `Run the native command for ${config.id} and replace the adapter-only latest artifact.`;
  }
  return config.nextMeasurement;
}

function countLaneStatuses(lanes) {
  return lanes.reduce((counts, lane) => {
    counts[lane.evidence.status] = (counts[lane.evidence.status] ?? 0) + 1;
    return counts;
  }, {});
}

function readJsonIfExists(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function firstLine(text) {
  return String(text ?? "").trim().split(/\r?\n/)[0] ?? "";
}

function artifactIdFromTimestamp(prefix, generatedAt) {
  return `${prefix}-${generatedAt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}`;
}
