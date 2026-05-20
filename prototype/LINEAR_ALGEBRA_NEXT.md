# Linear Algebra Next Pass

This is the linear-algebra handoff for the current sparse demo. The first pass
is now implemented in `lib/linear-algebra.mjs`; this note preserves the contract
and the next research steps.

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

## Implemented Decisions

1. Freeze the matrix orientation.

   Rows are classes and columns are flattened event features:
   `W[class][feature]`.

2. Add a model metadata object.

   The model includes classes, feature shape, flattening order, matrix shape,
   matrix orientation, weight matrix, public bias vector, score equation, and
   score domain.

3. Add bias handling.

   Plaintext and encrypted score paths start with `bias[class]`. Bias is public
   for the first prototype.

4. Add matrix-vector helper functions.

   Implemented:

   - `denseMatVec(model, vector)`
   - `sparseMatVec(model, activeEvents)`
   - `validateLinearModel(model, featureCount)`

5. Decide the first real-library packing target.

   Still pending. For integer spike counts, BFV/BGV is the first serious lane.
   CKKS remains a useful comparison for approximate packed vectors. TFHE is
   worth holding for binary threshold logic.

## Test Coverage

Current tests cover:

- Dense and sparse matrix-vector scoring produce identical scores.
- Bias is included in both plaintext and encrypted paths.
- Model validation rejects mismatched weight rows and feature counts.
- Benchmark output names matrix shape and active-event count.
- Operation counts remain lower for sparse active-event scoring than dense
  encrypted tensor scoring on the current synthetic window.

## Next Work

1. Add a real-library adapter around this exact contract.
2. Emit optional benchmark artifacts to disk for comparison runs.
3. Add packed-vector planning notes for BFV/BGV and CKKS.
4. Add a privacy mode decision: public active positions, padded sparse batches,
   or dense encrypted windows.
5. Keep bio-digital language framed as privacy-preserving event intelligence,
   not medical diagnosis or treatment.

## Non-Goals For This Pass

- Do not add a real HE dependency until the matrix contract is stable.
- Do not implement encrypted argmax yet.
- Do not hide the active-position metadata leak in the benchmark language.
- Do not mix proprietary adapters or partner data into this CC0 reference repo.
