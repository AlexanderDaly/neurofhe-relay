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

Every `neurofhe.benchmarkArtifact.v1` file must include:

- accuracy
- latency
- ciphertext bytes
- operation counts
- security parameters
- privacy boundary
- crypto inventory

The current accuracy field is synthetic contract agreement against the
plaintext classifier, not real dataset accuracy. Use the N-MNIST-compatible
plaintext baseline before making dataset performance claims.
