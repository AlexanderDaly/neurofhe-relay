// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from "node:child_process";

import { publishComparisonArtifact } from "./lib/artifacts.mjs";
import {
  buildOpenFheRealLibraryAdapter,
  detectOpenFhe,
  openFheIntegrationPlan,
} from "./lib/openfhe-adapter.mjs";

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldPublishArtifact = args.has("--artifact") || args.has("--publish");
const outputDir = readOption(rawArgs, "--out") ?? "benchmark-artifacts/comparisons/openfhe";

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  npm run benchmark:openfhe -- --plan",
    "  npm run benchmark:openfhe -- --artifact",
    "  npm run benchmark:openfhe -- --run",
    "  npm run benchmark:openfhe -- --run --artifact",
    "",
    "--plan prints the native OpenFHE build plan.",
    "--artifact writes the adapter plan or run result as a comparison artifact.",
    "--run configures, builds, and executes the BFVrns demo when OpenFHE is installed.",
  ].join("\n"));
  process.exit(0);
}

if (!args.has("--run")) {
  const subject = args.has("--adapter") ? buildOpenFheRealLibraryAdapter() : openFheIntegrationPlan();
  if (shouldPublishArtifact) {
    const published = await publishComparisonArtifact({ outputDir, subject });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(subject, null, 2));
  }
  process.exit(0);
}

const detection = detectOpenFhe();
if (!detection.available) {
  const unavailable = {
    schema: "neurofhe.openfhe.unavailable.v1",
    detection,
    adapter: buildOpenFheRealLibraryAdapter(),
    plan: openFheIntegrationPlan(),
    productionClaim: false,
  };
  if (shouldPublishArtifact) {
    const published = await publishComparisonArtifact({ outputDir, subject: unavailable });
    console.log(JSON.stringify(published, null, 2));
  } else {
    console.log(JSON.stringify(unavailable, null, 2));
  }
  process.exit(2);
}

const env = {
  ...process.env,
  OpenFHE_DIR: process.env.OpenFHE_DIR ?? process.env.OPENFHE_DIR ?? detection.cmakeConfigDir,
};

run("cmake", ["-S", "prototype/openfhe", "-B", "build/openfhe"], env);
run("cmake", ["--build", "build/openfhe"], env);
const nativeResult = run("build/openfhe/openfhe_linear_demo", [], env, {
  capture: shouldPublishArtifact,
});

if (shouldPublishArtifact) {
  process.stdout.write(nativeResult.stdout);
  const parsed = JSON.parse(nativeResult.stdout);
  const published = await publishComparisonArtifact({
    outputDir,
    subject: {
      schema: "neurofhe.openfhe.runComparison.v1",
      adapter: buildOpenFheRealLibraryAdapter(),
      nativeResult: parsed,
      productionClaim: false,
    },
  });
  console.log(JSON.stringify(published, null, 2));
}

function run(command, commandArgs, env, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env,
    encoding: options.capture ? "utf8" : undefined,
    stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
}

function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}
