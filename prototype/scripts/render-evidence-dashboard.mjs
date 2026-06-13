#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { readFileSync, writeFileSync } from "node:fs";

import {
  EVIDENCE_DASHBOARD_PATH,
  RELEASE_EVIDENCE_ARTIFACT_PATH,
  renderEvidenceDashboard,
} from "../lib/evidence-dashboard.mjs";

const options = parseArgs(process.argv.slice(2));
const artifact = JSON.parse(readFileSync(options.artifactPath, "utf8"));
const rendered = renderEvidenceDashboard(artifact);

if (options.check) {
  const current = readCurrent(options.dashboardPath);
  if (current !== rendered) {
    console.error(
      `${options.dashboardPath} is out of date with ${options.artifactPath}.\n` +
        "Run `npm run docs:evidence` to regenerate it.",
    );
    process.exit(1);
  }
  console.log(`${options.dashboardPath} is up to date.`);
} else {
  writeFileSync(options.dashboardPath, rendered, "utf8");
  console.log(`Wrote ${options.dashboardPath} from ${options.artifactPath}.`);
}

function readCurrent(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function parseArgs(args) {
  const parsed = {
    check: false,
    artifactPath: RELEASE_EVIDENCE_ARTIFACT_PATH,
    dashboardPath: EVIDENCE_DASHBOARD_PATH,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--check") parsed.check = true;
    else if (arg === "--artifact") parsed.artifactPath = args[++i];
    else if (arg === "--out") parsed.dashboardPath = args[++i];
    else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}
