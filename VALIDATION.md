# Validation

Validated locally on 2026-05-19.

Commands below are written for the standalone package root.

## Checks Run

### Project Brief JSON

Command:

```sh
node -e "JSON.parse(require('fs').readFileSync('project-brief.json','utf8')); console.log('project-brief.json ok')"
```

Result:

```text
project-brief.json ok
```

### Placeholder Scan

Command:

```sh
rg -n "TBD|TODO|PLACEHOLDER|FIXME|\?\?" . --glob '!VALIDATION.md' || true
```

Result:

```text
No matches.
```

### ASCII Scan

Command:

```sh
node - <<'NODE'
const fs = require('fs');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = `${dir}/${d.name}`;
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

### Toy NeuroFHE Demo

Command:

```sh
node prototype/toy-neurohe-demo.mjs
```

Result summary:

```json
{
  "demo": "toy encrypted spike-count classifier",
  "caveat": "Educational additive HE demo only; replace with audited HE/FHE library for real prototype.",
  "eventWindow": {
    "schema": "neurofhe.events.v0.demo",
    "shape": [8, 8],
    "encoding": "binary spike count",
    "spikeCount": 18,
    "density": 0.2813
  },
  "decryptedScores": {
    "normal": 9,
    "anomaly": 51
  },
  "classification": "anomaly"
}
```

## Scope Note

This package has been scrubbed of personal names and local machine paths.
