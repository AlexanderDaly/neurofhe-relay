// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from "node:child_process";

import { detectOpenFhe, openFheIntegrationPlan } from "./lib/openfhe-adapter.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help")) {
  console.log([
    "Usage:",
    "  npm run benchmark:openfhe -- --plan",
    "  npm run benchmark:openfhe -- --run",
    "",
    "--plan prints the native OpenFHE build plan.",
    "--run configures, builds, and executes the BFVrns demo when OpenFHE is installed.",
  ].join("\n"));
  process.exit(0);
}

if (!args.has("--run")) {
  console.log(JSON.stringify(openFheIntegrationPlan(), null, 2));
  process.exit(0);
}

const detection = detectOpenFhe();
if (!detection.available) {
  console.log(
    JSON.stringify(
      {
        schema: "neurofhe.openfhe.unavailable.v1",
        detection,
        plan: openFheIntegrationPlan(),
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

const env = {
  ...process.env,
  OpenFHE_DIR: process.env.OpenFHE_DIR ?? process.env.OPENFHE_DIR ?? detection.cmakeConfigDir,
};

run("cmake", ["-S", "prototype/openfhe", "-B", "build/openfhe"], env);
run("cmake", ["--build", "build/openfhe"], env);
run("build/openfhe/openfhe_linear_demo", [], env);

function run(command, commandArgs, env) {
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
