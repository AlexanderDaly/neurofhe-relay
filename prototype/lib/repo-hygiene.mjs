// SPDX-License-Identifier: CC0-1.0

import { readdirSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

export const DEFAULT_MARKER_TOKENS = ["T" + "BD", "TO" + "DO", "PLACE" + "HOLDER", "FIX" + "ME"];
export const DEFAULT_SECRET_PATTERNS = [
  {
    id: "private-key-block",
    pattern: new RegExp(["-----BEGIN", "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"].join(" ")),
  },
  { id: "openai-api-key", pattern: /(?<![A-Za-z0-9])sk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { id: "github-token", pattern: /gh[opsu]_[A-Za-z0-9_]{20,}/ },
  { id: "aws-access-key", pattern: /AKIA[0-9A-Z]{16}/ },
  { id: "slack-token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
];
export const DEFAULT_RAW_DATA_EXTENSIONS = /\.(aedat|arff|bdf|csv|edf|feather|fif|h5|hdf5|mat|nii|nii\.gz|npy|npz|parquet|tsv)$/i;
export const DEFAULT_RAW_DATA_PATH_SEGMENTS = new Set(["N-MNIST", "Train", "Test"]);
export const DEFAULT_IGNORED_DIRS = new Set([
  ".cache",
  ".git",
  "node_modules",
  "target",
  "build",
  "dist",
  "outputs",
]);
export const DEFAULT_IGNORED_FILES = new Set(["VALIDATION.md"]);
export const DEFAULT_IGNORED_EXTENSIONS = /\.(a|dylib|gif|jpg|jpeg|o|pdf|png|pptx|rlib|rmeta|so)$/i;

export function scanRepositoryHygiene(options = {}) {
  const root = options.root ?? ".";
  const placeholderTokens = options.placeholderTokens ?? DEFAULT_MARKER_TOKENS;
  const secretPatterns = options.secretPatterns ?? DEFAULT_SECRET_PATTERNS;
  const rawDataExtensions = options.rawDataExtensions ?? DEFAULT_RAW_DATA_EXTENSIONS;
  const rawDataPathSegments = options.rawDataPathSegments ?? DEFAULT_RAW_DATA_PATH_SEGMENTS;
  const ignoredDirs = options.ignoredDirs ?? DEFAULT_IGNORED_DIRS;
  const ignoredFiles = options.ignoredFiles ?? DEFAULT_IGNORED_FILES;
  const ignoredExtensions = options.ignoredExtensions ?? DEFAULT_IGNORED_EXTENSIONS;
  const files = walkSourceFiles(root, { ignoredDirs, ignoredFiles, ignoredExtensions });
  const findings = [];

  for (const path of files) {
    const displayPath = normalizePath(relative(root, path) || path);
    const pathSegments = displayPath.split(/[\\/]/);
    if (rawDataExtensions.test(displayPath) || pathSegments.some((segment) => rawDataPathSegments.has(segment))) {
      findings.push({
        category: "raw-dataset-path",
        id: "committed-raw-dataset-path",
        path: displayPath,
        message: "committed raw dataset path is blocked; keep raw data outside git",
      });
      continue;
    }

    const text = readFileSync(path, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (placeholderTokens.some((token) => line.includes(token))) {
        findings.push({
          category: "placeholder",
          id: "placeholder-token",
          path: displayPath,
          line: index + 1,
          excerpt: line,
        });
      }
      for (const { id, pattern } of secretPatterns) {
        if (pattern.test(line)) {
          findings.push({
            category: "secret",
            id,
            path: displayPath,
            line: index + 1,
            redacted: true,
          });
        }
      }
    });
  }

  return {
    schema: "neurofhe.repositoryHygieneScan.result.v1",
    result: findings.length === 0 ? "pass" : "fail",
    scannedFileCount: files.length,
    findings,
  };
}

export function buildRepositoryHygieneArtifact(scanResult, options = {}) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const artifactId = options.artifactId ?? artifactIdFromTimestamp("repo-hygiene", generatedAt);

  return {
    schema: "neurofhe.repositoryHygieneScan.v1",
    artifactId,
    generatedAt,
    command: options.command ?? "node prototype/scripts/placeholder-scan.mjs --artifact",
    scope: "portable-source-hygiene",
    result: scanResult.result,
    scannedFileCount: scanResult.scannedFileCount,
    findingsCount: scanResult.findings.length,
    findings: scanResult.findings.map(redactFinding),
    checks: [
      "placeholder tokens",
      "common token-shaped secrets",
      "committed raw dataset paths and extensions",
    ],
    ignored: {
      directories: [...DEFAULT_IGNORED_DIRS],
      files: [...DEFAULT_IGNORED_FILES],
      binaryOrGeneratedExtensions: DEFAULT_IGNORED_EXTENSIONS.source,
    },
    rawDataPolicy: {
      rawDatasetExtensions: DEFAULT_RAW_DATA_EXTENSIONS.source,
      blockedPathSegments: [...DEFAULT_RAW_DATA_PATH_SEGMENTS],
      rule: "Keep raw public/private datasets outside git; commit only derived artifacts or structured blocker reports.",
    },
    privacyBoundary: {
      schema: "neurofhe.repositoryHygiene.privacyBoundary.v1",
      rawData: "not scanned into artifacts",
      secrets: "redacted from artifacts",
      committedEvidence: "derived hygiene status only",
      productionClaim: false,
    },
    productionClaim: false,
  };
}

export async function publishRepositoryHygieneArtifact(options = {}) {
  const outputDir = options.outputDir ?? "benchmark-artifacts/repo-hygiene";
  const scanResult = scanRepositoryHygiene({ root: options.root ?? "." });
  const artifact = buildRepositoryHygieneArtifact(scanResult, {
    artifactId: options.artifactId,
    generatedAt: options.generatedAt,
    command: options.command,
  });
  const runsDir = join(outputDir, "runs");
  const runPath = join(runsDir, `${artifact.artifactId}.json`);
  const latestPath = join(outputDir, "latest.json");
  const json = `${JSON.stringify(artifact, null, 2)}\n`;

  await mkdir(runsDir, { recursive: true });
  await writeFile(runPath, json, "utf8");
  await writeFile(latestPath, json, "utf8");

  return {
    schema: "neurofhe.repositoryHygieneScan.publish.v1",
    artifactId: artifact.artifactId,
    paths: {
      run: runPath,
      latest: latestPath,
    },
    artifact,
  };
}

function walkSourceFiles(dir, options) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (options.ignoredDirs.has(entry.name)) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walkSourceFiles(path, options);
    if (options.ignoredFiles.has(entry.name)) return [];
    if (options.ignoredExtensions.test(entry.name)) return [];
    return [path];
  });
}

function normalizePath(path) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function redactFinding(finding) {
  if (finding.category !== "secret") return finding;
  return {
    category: finding.category,
    id: finding.id,
    path: finding.path,
    line: finding.line,
    redacted: true,
  };
}

function artifactIdFromTimestamp(prefix, generatedAt) {
  return `${prefix}-${generatedAt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}`;
}
