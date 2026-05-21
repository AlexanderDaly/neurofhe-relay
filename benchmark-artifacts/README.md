# Benchmark Artifacts

This directory contains published benchmark JSON artifacts for the runnable
prototype.

Generate or refresh the current artifact:

```sh
npm run benchmark:artifact
```

The publisher writes:

- `latest.json` - the most recent benchmark artifact.
- `runs/*.json` - timestamped run artifacts.

Optional comparison artifacts can also be written for adapter plans or native
library runs:

```sh
npm run benchmark:openfhe -- --artifact
npm run benchmark:openfhe -- --run --artifact
npm run benchmark:openfhe-ckks -- --artifact
npm run benchmark:openfhe-ckks -- --run --artifact
npm run benchmark:tfhe -- --artifact
npm run benchmark:tfhe -- --run --artifact
```

By default, OpenFHE comparison artifacts are written under
`benchmark-artifacts/comparisons/openfhe/`. OpenFHE CKKS comparison artifacts
are written under `benchmark-artifacts/comparisons/openfhe-ckks/`. TFHE-rs
comparison artifacts are written under `benchmark-artifacts/comparisons/tfhe-rs/`. Use
`--out <directory>` to place a comparison run elsewhere.

Every `neurofhe.benchmarkArtifact.v1` file must include:

- accuracy
- latency
- ciphertext bytes
- operation counts
- security parameters
- privacy boundary
- crypto inventory

Current artifacts also include:

- packed-vector planning notes for BFV/BGV and CKKS
- native comparison lane planning for BFVrns integer, CKKS approximate-real, and TFHE-rs threshold paths
- privacy-mode decision for public active positions, padded sparse batches, or dense encrypted windows
- framing guardrail for privacy-preserving event intelligence, not diagnosis or treatment
- optional OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs adapter/native comparison artifacts for the same synthetic 8x8 sparse score contract

The current accuracy field is synthetic contract agreement against the
plaintext classifier, not real dataset accuracy. Use the N-MNIST-compatible
plaintext baseline before making dataset performance claims.
