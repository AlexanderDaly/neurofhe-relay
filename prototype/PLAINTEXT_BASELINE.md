# Plaintext Real-Data Baseline

This is the first real-event-data lane before encrypted computation.

## Dataset

Start with N-MNIST because it is convenient, event-based, and small enough to
adapt quickly. The repository does not bundle the dataset. Keep the data outside
git and point the CLI at a local extracted directory.

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

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

Useful options:

```sh
--grid-size 8
--time-bins 4
--window-us 105000
--limit-per-class 10
```

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

## Next Dataset Lanes

After N-MNIST:

- DVS Gesture for richer event-camera motion.
- Wearable or industrial telemetry for a stronger pilot, once a rights-clean
  dataset or partner source is available.

## Scope Guardrail

This is a plaintext baseline. It makes no encrypted-compute, medical,
diagnostic, treatment, or production-security claim. It exists to freeze the
real-data feature shape and classifier contract before the first real HE
adapter.
