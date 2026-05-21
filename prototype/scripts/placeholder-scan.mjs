#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const tokens = ["T" + "BD", "TO" + "DO", "PLACE" + "HOLDER", "FIX" + "ME"];
const ignored = new Set([".git", "node_modules", "target", "build", "dist", "outputs"]);
const ignoredFiles = new Set(["VALIDATION.md"]);
const ignoredExtensions = /\.(a|dylib|gif|jpg|jpeg|o|pdf|png|pptx|rlib|rmeta|so)$/i;

let found = false;

for (const path of walk(".")) {
  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (tokens.some((token) => line.includes(token))) {
      found = true;
      console.log(`${path}:${index + 1}:${line}`);
    }
  });
}

if (found) process.exit(1);
console.log("placeholder scan ok");

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
