#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

import { runGatewayDemo } from "./lib/gateway.mjs";

console.log(JSON.stringify(runGatewayDemo(), null, 2));
