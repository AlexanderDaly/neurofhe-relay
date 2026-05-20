# Linear Algebra Next Pass

This is the waking handoff for turning the current sparse demo into a cleaner
linear-algebra prototype.

## Current Contract

The event window is an 8 by 8 tensor flattened into a feature vector:

```text
x in Z_nonnegative^64
```

The demo classifier uses a public non-negative weight matrix:

```text
W in Z_nonnegative^(2 by 64)
```

The score contract is:

```text
scores = W x
class = argmax(scores)
```

For the current synthetic window:

```json
{
  "featureCount": 64,
  "spikeCount": 18,
  "activeEventCount": 18,
  "scores": {
    "normal": 9,
    "anomaly": 51
  },
  "classification": "anomaly"
}
```

## Sparse Form

The prototype currently computes the same score through an active-event list:

```text
S = {(index, time, channel, value) where x_index > 0}
score_c = sum(value_i * W[c, index_i] for i in S)
```

This is why the benchmark reports:

```json
{
  "sparseScalarMultiplies": 36,
  "denseScalarMultiplies": 128
}
```

The tradeoff is explicit: the compute side sees active event positions. If that
metadata is sensitive, a future mode needs padding, batching, or dense encrypted
windows.

## Next Decisions

1. Freeze the matrix orientation.

   Recommended: keep rows as classes and columns as flattened event features:
   `W[class][feature]`.

2. Add a model metadata object.

   Include classes, feature shape, flattening order, weight matrix, optional
   bias vector, and score domain.

3. Add bias handling.

   Start plaintext and encrypted score paths with `bias[class]` instead of zero.
   Keep bias public for the first prototype.

4. Add matrix-vector helper functions.

   Suggested names:

   - `denseMatVec(weights, vector)`
   - `sparseMatVec(weights, activeEvents)`
   - `validateLinearModel(model, featureCount)`

5. Decide the first real-library packing target.

   For integer spike counts, BFV/BGV is the first serious lane. CKKS remains a
   useful comparison for approximate packed vectors. TFHE is worth holding for
   binary threshold logic.

## Test Targets

Add tests before implementation:

- Dense and sparse matrix-vector scoring produce identical scores.
- Bias is included in both plaintext and encrypted paths.
- Model validation rejects mismatched weight rows and feature counts.
- Benchmark output names matrix shape and active-event count.
- Operation counts remain lower for sparse active-event scoring than dense
  encrypted tensor scoring on the current synthetic window.

## Non-Goals

- Do not add a real HE dependency until the matrix contract is stable.
- Do not implement encrypted argmax yet.
- Do not hide the active-position metadata leak in the benchmark language.
- Do not mix proprietary adapters or partner data into this CC0 reference repo.
