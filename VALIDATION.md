# Validation

Validated locally on 2026-05-19.

Commands below are written for the standalone package root.

## Checks Run

### Node Test Suite

Command:

```sh
npm test
```

Result summary:

```text
tests 6
pass 6
fail 0
```

Covered behaviours:

- Toy additive HE addition and scalar multiplication.
- Event-window validation and sparse metrics.
- Plaintext and encrypted classifier agreement.
- Benchmark privacy boundary, crypto inventory, and dense baseline comparison.
- Research assumptions with clean-room and naming guardrails.

### Desk Demo

Command:

```sh
npm run demo --silent
```

Result summary:

```json
{
  "demo": "toy encrypted sparse spike-count classifier",
  "prototypeCodename": "Relay-2 Diagnostic Demo",
  "eventWindow": {
    "schema": "neurofhe.events.v1.demo",
    "shape": [8, 8],
    "encoding": "binary-spike-count",
    "spikeCount": 18,
    "density": 0.2813
  },
  "operationCounts": {
    "encryptions": 20,
    "scalarMultiplies": 36,
    "adds": 36,
    "decryptions": 2
  },
  "decryptedScores": {
    "normal": 9,
    "anomaly": 51
  },
  "classification": "anomaly"
}
```

### Benchmark

Command:

```sh
npm run benchmark --silent
```

Result summary:

```json
{
  "schema": "neurofhe.benchmark.v1",
  "dataset": "synthetic-events-v0",
  "model": "tiny-linear-spike-count-v0",
  "scheme": "toy-paillier-additive-research-only",
  "productionClaim": false,
  "sparseMetrics": {
    "featureCount": 64,
    "spikeCount": 18,
    "density": 0.28125
  },
  "operationCounts": {
    "encryptions": 20,
    "scalarMultiplies": 36,
    "adds": 36,
    "decryptions": 2
  },
  "denseBaseline": {
    "operationCounts": {
      "encryptions": 66,
      "scalarMultiplies": 128,
      "adds": 128,
      "decryptions": 2
    }
  },
  "results": {
    "plaintextMatchesEncrypted": true,
    "classification": "anomaly"
  }
}
```

### JSON Validation

Command:

```sh
node -e "JSON.parse(require('fs').readFileSync('project-brief.json','utf8')); JSON.parse(require('fs').readFileSync('prototype/research-assumptions.json','utf8')); console.log('json ok')"
```

Result:

```text
json ok
```

### Placeholder Scan

Command:

```sh
node prototype/scripts/placeholder-scan.mjs
```

Result:

```text
placeholder scan ok
```

### ASCII Scan

Command:

```sh
node - <<'NODE'
const fs = require('fs');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = `${dir}/${d.name}`;
    if (p.includes('/.git/')) return [];
    return d.isDirectory() ? walk(p) : [p];
  });
}
let ok = true;
for (const path of walk('.')) {
  const text = fs.readFileSync(path, 'utf8');
  const bad = [...new Set([...text].filter(ch => ch.charCodeAt(0) > 127))];
  if (bad.length) {
    ok = false;
    console.log(path, bad.join(''));
  }
}
console.log(ok ? 'ascii scan complete' : 'non-ascii found');
process.exit(ok ? 0 : 1);
NODE
```

Result:

```text
ascii scan complete
```

## Scope Note

The runnable prototype is still research-grade and uses educational additive HE only. It now has a reusable library surface, tests, benchmark output, dense baseline comparison, crypto inventory, and explicit clean-room/proprietary-track guardrails.
