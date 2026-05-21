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
scores = W x + bias
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

5. Add the first real-library adapter surface.

   Implemented in `lib/openfhe-adapter.mjs` as
   `neurofhe.realLibraryAdapter.v1`. The adapter binds the generated
   `neurofhe.openfhe.contract.v1` object to the native OpenFHE BFVrns C++
   target with a SHA-256 contract digest, validation errors, detection state,
   privacy-mode decision, packed-vector planning notes, and framing guardrail.

6. Decide the first packed-vector target.

   Implemented in `lib/benchmark.mjs` as
   `neurofhe.packedVectorPlanning.v1`. BFV/BGV is the default lane for the
   current non-negative integer spike-count contract. CKKS remains a comparison
   lane only when approximate real or fixed-point features are justified.

7. Add a privacy-mode decision.

   Implemented in `lib/benchmark.mjs` as `neurofhe.privacyModeDecision.v1`.
   The explicit options are public active positions, padded sparse batches, and
   dense encrypted windows. The default comparison lane is padded sparse
   batches because it reduces exact sparsity disclosure while staying cheaper
   than dense encrypted windows.

## Test Coverage

Current tests cover:

- Dense and sparse matrix-vector scoring produce identical scores.
- Bias is included in both plaintext and encrypted paths.
- Model validation rejects mismatched weight rows and feature counts.
- Benchmark output names matrix shape and active-event count.
- Operation counts remain lower for sparse active-event scoring than dense
  encrypted tensor scoring on the current synthetic window.
- The benchmark now carries packed-vector planning, privacy-mode decision, and
  a framing guardrail that keeps bio-digital language scoped to
  privacy-preserving event intelligence, not medical diagnosis or treatment.
- OpenFHE adapter tests validate the generated contract, native build-plan
  surface, comparison artifact publisher, and source-level use of real BFVrns
  APIs.

## Next Work

1. Install OpenFHE on a benchmark host and run the native BFVrns target through
   `npm run benchmark:openfhe -- --run --artifact`.
2. Compare public active positions, padded sparse batches, and dense encrypted
   windows under the same OpenFHE parameter family.
3. Add native memory and energy fields once the host can measure them
   consistently.
4. Keep bio-digital language framed as privacy-preserving event intelligence,
   not medical diagnosis or treatment.

## Non-Goals For This Pass

- Do not implement encrypted argmax yet.
- Do not hide the active-position metadata leak in the benchmark language.
- Do not mix proprietary adapters or partner data into this CC0 reference repo.
