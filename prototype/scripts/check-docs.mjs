#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import {
  formatMarkdownLinkFinding,
  scanMarkdownLinks,
} from "../lib/docs-links.mjs";

const options = parseArgs(process.argv.slice(2));
const result = scanMarkdownLinks({ root: options.root });

if (options.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const finding of result.findings) {
    console.log(formatMarkdownLinkFinding(finding));
  }
  if (result.findings.length === 0) {
    console.log(`markdown link scan ok (${result.scannedFileCount} files)`);
  }
}

if (result.findings.length > 0) process.exit(1);

function parseArgs(args) {
  const parsed = {
    json: false,
    root: ".",
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--json") parsed.json = true;
    else if (arg === "--root") parsed.root = args[++i];
    else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

