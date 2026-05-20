#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { runDemo } from "./lib/demo.mjs";

console.log(JSON.stringify(runDemo({ seed: 91 }), null, 2));
