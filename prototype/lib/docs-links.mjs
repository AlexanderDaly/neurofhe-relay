// SPDX-License-Identifier: CC0-1.0

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve, sep } from "node:path";

export const DEFAULT_DOC_LINK_IGNORED_DIRS = new Set([
  ".cache",
  ".git",
  "build",
  "dist",
  "node_modules",
  "outputs",
  "target",
]);

export function scanMarkdownLinks(options = {}) {
  const root = resolve(options.root ?? ".");
  const ignoredDirs = options.ignoredDirs ?? DEFAULT_DOC_LINK_IGNORED_DIRS;
  const files = walkMarkdownFiles(root, { ignoredDirs });
  const findings = [];

  for (const filePath of files) {
    const displayPath = normalizePath(relative(root, filePath));
    const text = readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      for (const target of extractMarkdownLinkTargets(line)) {
        if (shouldSkipTarget(target)) continue;
        const resolvedPath = resolveLocalTarget(root, filePath, target);
        if (!resolvedPath || existsSync(resolvedPath.absolutePath)) continue;
        findings.push({
          category: "broken-markdown-link",
          path: displayPath,
          line: index + 1,
          target,
          resolvedPath: normalizePath(relative(root, resolvedPath.absolutePath)),
          message: "local Markdown link target does not exist",
        });
      }
    });
  }

  return {
    schema: "neurofhe.markdownLinkScan.result.v1",
    result: findings.length === 0 ? "pass" : "fail",
    scannedFileCount: files.length,
    findings,
  };
}

function walkMarkdownFiles(dir, options) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (options.ignoredDirs.has(entry.name)) return [];
      return walkMarkdownFiles(join(dir, entry.name), options);
    }
    if (!entry.isFile() || !entry.name.endsWith(".md")) return [];
    return [join(dir, entry.name)];
  });
}

function extractMarkdownLinkTargets(line) {
  const targets = [];
  const linkPattern = /!?\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let match;
  while ((match = linkPattern.exec(line)) !== null) {
    targets.push(match[1].replace(/^<|>$/g, ""));
  }
  return targets;
}

function shouldSkipTarget(target) {
  return (
    target.startsWith("#") ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(target)
  );
}

function resolveLocalTarget(root, sourcePath, target) {
  const withoutAnchor = target.split("#")[0];
  if (withoutAnchor === "") return undefined;
  const decodedTarget = decodeURIComponent(withoutAnchor);
  const basePath = decodedTarget.startsWith("/")
    ? join(root, decodedTarget.slice(1))
    : join(dirname(sourcePath), decodedTarget);
  const absolutePath = normalize(resolve(basePath));
  if (!isPathInsideRoot(root, absolutePath)) return undefined;
  return { absolutePath };
}

function isPathInsideRoot(root, absolutePath) {
  const normalizedRoot = normalize(resolve(root));
  const normalizedPath = normalize(resolve(absolutePath));
  if (normalizedPath === normalizedRoot) return true;
  const prefix = normalizedRoot.endsWith(sep) ? normalizedRoot : `${normalizedRoot}${sep}`;
  return normalizedPath.startsWith(prefix);
}

function normalizePath(path) {
  return normalize(path).replaceAll("\\", "/").replace(/^\.\//, "");
}

export function formatMarkdownLinkFinding(finding) {
  return `${finding.path}:${finding.line}:${finding.category}:${finding.target}`;
}

export function assertMarkdownLinkScanPasses(result) {
  if (result.findings.length === 0) return;
  const error = new Error("Markdown link scan failed");
  error.findings = result.findings;
  throw error;
}
