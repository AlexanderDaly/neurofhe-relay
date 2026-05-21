# Plaintext Event-Data Baseline

This is the first real-event-data lane before encrypted computation.

## Dataset

Start with N-MNIST because it is convenient, event-based, and small enough to
adapt quickly. The repository does not bundle the dataset. Keep the data outside
git and point the CLI at a local extracted directory.

Public provenance:

- N-MNIST dataset page: https://www.garrickorchard.com/datasets/n-mnist
- Mendeley Data DOI: 10.17632/468j46mzdv.1

Review the public dataset license and redistribution terms before copying any
raw recordings into another package. This repository stores only code and small
deterministic format fixtures.

Expected layout:

```text
N-MNIST/
  Train/
    0/
      sample.bin
  Test/
    0/
      sample.bin
```

Each N-MNIST recording is parsed as 40-bit address-event records:

- x address
- y address
- polarity
- timestamp in microseconds

## Command

Run against a real local N-MNIST extraction:

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

Run the deterministic N-MNIST-format smoke fixture:

```sh
npm run baseline:plaintext -- --fixture nmnist-smoke
```

The smoke fixture proves that the parser, feature extraction, linear classifier,
compression curve, and artifact schema work. It is not sampled from the public
N-MNIST recordings and must not be reported as real-data accuracy.

Useful options:

```sh
--grid-size 8
--time-bins 4
--window-us 105000
--limit-per-class 10
--compression-levels 1x1,2x2,4x2,8x4
--artifact
--out benchmark-artifacts/plaintext-baselines/<dataset-id>
```

If `--dataset` points at a missing or malformed local dataset and `--artifact`
is present, the CLI writes a `neurofhe.plaintextBaseline.unavailable.v1`
blocker report with the exact attempted command and smallest next step.

## Frozen Feature Contract

Default feature shape:

```json
[4, 8, 8, 2]
```

Meaning:

- 4 time bins
- 8 by 8 spatial grid
- 2 polarities

Flattening order:

```text
time-grid-y-grid-x-polarity
```

The baseline classifier is dependency-free and intentionally simple:

```text
nearest-centroid linear classifier
scores = W x + bias
```

## Output Metrics

The report emits:

- plaintext accuracy
- latency in milliseconds
- average active events
- average non-zero features
- feature shape
- matrix shape
- confusion table
- operation counts
- compression curve when `--compression-levels` is set
- dataset provenance and fixture/real-data distinction

Published artifacts use:

```text
benchmark-artifacts/plaintext-baselines/<dataset-id>/latest.json
benchmark-artifacts/plaintext-baselines/<dataset-id>/runs/<artifact-id>.json
```

Current committed examples:

- `benchmark-artifacts/plaintext-baselines/nmnist-smoke/latest.json`:
  deterministic format-fixture smoke test.
- `benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/latest.json`:
  missing-local-dataset blocker for the real public N-MNIST path.

## Compression Curve

The default compression curve compares feature resolution before encryption:

```text
1x1   one spatial bin, one time bin, two polarities
2x2   two by two spatial bins, two time bins, two polarities
4x2   four by four spatial bins, two time bins, two polarities
8x4   eight by eight spatial bins, four time bins, two polarities
```

For each level, the report records feature count, compression factor versus the
reference feature shape, plaintext accuracy, average active events, average
non-zero features, and plaintext dot-product count. This is a plaintext feature
resolution curve, not encrypted-compute evidence.

## Next Dataset Lanes

After N-MNIST:

- DVS Gesture for richer event-camera motion.
- Wearable or industrial telemetry for a stronger pilot, once a rights-clean
  dataset or partner source is available.

## Scope Guardrail

This is a plaintext baseline. It makes no encrypted-compute, medical,
diagnostic, treatment, or production-security claim. It exists to freeze the
event-data feature shape and classifier contract before the first real HE
adapter. Use the smoke fixture for parser and artifact validation only; use a
local public N-MNIST extraction before making any real-data performance claim.
