# Plaintext Event-Data Baseline

This is the first real-event-data lane before encrypted computation.

## Dataset

Start with N-MNIST because it is convenient, event-based, and small enough to
adapt quickly. The repository does not bundle the dataset. Keep the data outside
git and point the CLI at a local extracted directory.

The repo now also includes a directly runnable real biosignal baseline using
UCI EEG Eye State. It is not an event-camera dataset, so preprocessing projects
chronological EEG rows into sparse latent event windows before evaluating the
same linear score contract.

Public provenance:

- N-MNIST dataset page: https://www.garrickorchard.com/datasets/n-mnist
- Mendeley Data DOI: 10.17632/468j46mzdv.1
- UCI EEG Eye State dataset page: https://archive.ics.uci.edu/dataset/264/eeg+eye+state
- UCI EEG Eye State DOI: 10.24432/C57G7J
- UCI EEG Eye State license: CC BY 4.0

Review the public dataset license and redistribution terms before copying any
raw recordings into another package. This repository stores only code and small
deterministic format fixtures. The EEG command downloads the ARFF into `.cache/`
and commits only derived benchmark JSON.

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

Run the real public UCI EEG Eye State baseline:

```sh
npm run baseline:eeg-eye-state -- --artifact
npm run baseline:plaintext -- --source eeg-eye-state --fetch --artifact
```

Use a local ARFF copy instead of fetching:

```sh
npm run baseline:plaintext -- --source eeg-eye-state --dataset "/path/to/EEG Eye State.arff" --artifact
```

Useful EEG options:

```sh
--cache-dir .cache/neurofhe/eeg-eye-state
--train-fraction 0.7
--window-size 8
--stride 8
--channel-count 8
--active-per-timestep 4
--compression-levels active1,active2,active4,active8
--artifact
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

For the UCI EEG Eye State lane, the default feature shape is:

```json
[8, 8]
```

Meaning:

- 8 chronological EEG rows per window
- first 8 EEG channels in ARFF order
- top-k absolute training-split z-score channels per row become public active
  positions
- the signed z-score is the active feature value

This preserves the same two-class, 64-feature `scores = W x + bias` shape used
by the OpenFHE BFVrns and CKKS demos. The committed EEG baseline is plaintext
model/preprocessing evidence. A separate generated OpenFHE input contract now
feeds one derived sparse window into the native BFVrns and CKKS lanes. BFVrns
uses an explicit fixed-point view; CKKS consumes the approximate-real values
directly.

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

Generate OpenFHE-ready EEG input contracts:

```sh
npm run contract:eeg-openfhe -- --generated-at 2026-05-21T18:15:00.000Z
```

The contract publisher writes:

```text
benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/latest.json
benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json
benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json
```

The BFVrns contract includes a signed fixed-point view with plaintext modulus
65537 and scale 10. The CKKS contract keeps the approximate-real sparse values.
Both are derived single-window inputs, not raw EEG redistribution.

Current committed examples:

- `benchmark-artifacts/plaintext-baselines/nmnist-smoke/latest.json`:
  deterministic format-fixture smoke test.
- `benchmark-artifacts/plaintext-baselines/nmnist-local-blocker/latest.json`:
  missing-local-dataset blocker for the real public N-MNIST path.
- `benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json`:
  real public UCI EEG Eye State plaintext baseline. The committed run uses a
  chronological 70/30 split over 14,980 rows, 8x8 sparse latent event windows,
  4 active channels per row, and reports 301/561 correct windows
  (`0.536542` accuracy). Its compression curve reports active budgets of 8,
  16, 32, and 64 values per window. Treat these as baseline evidence for the
  preprocessing and linear score contract only, not model quality or encrypted
  runtime evidence.

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
- Multi-window native OpenFHE sweeps over the EEG-derived `[2, 64]` model and
  sparse active event contract.
- Native padded-sparse real-data runs to quantify leakage reduction versus FHE
  overhead on public biosignal-derived windows.

## Scope Guardrail

This is a plaintext baseline. It makes no encrypted-compute, medical,
diagnostic, treatment, or production-security claim. It exists to freeze the
event-data feature shape and classifier contract before the first real HE
adapter. Use the smoke fixture for parser and artifact validation only; use a
local public N-MNIST extraction or the committed UCI EEG Eye State plaintext
artifact before making any real-data performance claim.
