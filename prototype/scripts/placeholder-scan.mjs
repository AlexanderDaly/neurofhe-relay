#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const placeholderTokens = ["T" + "BD", "TO" + "DO", "PLACE" + "HOLDER", "FIX" + "ME"];
const secretPatterns = [
  {
    id: "private-key-block",
    pattern: new RegExp(["-----BEGIN", "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"].join(" ")),
  },
  { id: "openai-api-key", pattern: /(?<![A-Za-z0-9])sk-(?:proj-)?[A-Za-z0-9_-]{20,}/ },
  { id: "github-token", pattern: /gh[opsu]_[A-Za-z0-9_]{20,}/ },
  { id: "aws-access-key", pattern: /AKIA[0-9A-Z]{16}/ },
  { id: "slack-token", pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
];
const rawDataExtensions = /\.(aedat|arff|bdf|csv|edf|feather|fif|h5|hdf5|mat|nii|nii\.gz|npy|npz|parquet|tsv)$/i;
const rawDataPathSegments = new Set(["N-MNIST", "Train", "Test"]);
const ignored = new Set([
  ".cache",
  ".git",
  "node_modules",
  "target",
  "build",
  "dist",
  "outputs",
]);
const ignoredFiles = new Set(["VALIDATION.md"]);
const ignoredExtensions = /\.(a|dylib|gif|jpg|jpeg|o|pdf|png|pptx|rlib|rmeta|so)$/i;

let found = false;

for (const path of walk(".")) {
  const pathSegments = path.split(/[\\/]/);
  if (rawDataExtensions.test(path) || pathSegments.some((segment) => rawDataPathSegments.has(segment))) {
    found = true;
    console.log(`${path}: committed raw dataset path is blocked; keep raw data outside git`);
    continue;
  }

  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (placeholderTokens.some((token) => line.includes(token))) {
      found = true;
      console.log(`${path}:${index + 1}:placeholder:${line}`);
    }
    for (const { id, pattern } of secretPatterns) {
      if (pattern.test(line)) {
        found = true;
        console.log(`${path}:${index + 1}:secret:${id}`);
      }
    }
  });
}

if (found) process.exit(1);
console.log("repository hygiene scan ok");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    if (ignoredFiles.has(entry.name)) return [];
    if (ignoredExtensions.test(entry.name)) return [];
    return [path];
  });
}
