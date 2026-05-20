#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { runPrototypeBenchmark } from "./lib/benchmark.mjs";

console.log(JSON.stringify(runPrototypeBenchmark({ seed: 91 }), null, 2));
