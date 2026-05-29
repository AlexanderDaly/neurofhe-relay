# Release Plan

The first release target is a research-alpha snapshot, not a production
cryptography release:

```text
v0.1.0-research-alpha
```

## Release Purpose

The first release should freeze a diligence-ready public snapshot of the CC0
research-alpha repository:

- boundary-first architecture for privacy-preserving event intelligence
- dependency-free toy arithmetic demo for schema and workflow education
- real-data plaintext UCI EEG Eye State baseline
- sparse padding/leakage overhead ablation
- OpenFHE BFVrns and CKKS native integration lanes
- TFHE-rs threshold comparison lane
- saved benchmark artifacts and blocker reports

It must not claim production cryptography, clinical validity, medical utility,
side-channel resistance, or stable performance.

The current release posture remains `releaseGateSatisfied: false`. This file is
the controlling no-tag gate, but it is not release approval by itself.
Release tagging still requires green current validation, satisfied evidence
gates, the repository ruleset/admin policy merge path, and explicit user approval
for the final action.

## Minimum Evidence Gate

Before tagging, run:

```sh
npm run validate
npm run baseline:plaintext -- --source eeg-eye-state --fetch --artifact
npm run contract:eeg-openfhe -- --generated-at <ISO_TIMESTAMP>
npm run benchmark:privacy-modes -- --artifact
npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact
npm run benchmark:tfhe -- --run --artifact
npm run benchmark:tfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
npm run native:doctor -- --artifact
npm run scan:hygiene -- --artifact
npm run reconstruction:risk -- --artifact
npm run release:evidence -- --artifact
```

If OpenFHE or TFHE-rs cannot run on the release machine, publish the generated
blocker artifact instead of inventing substitute results. Record the exact
command, error, and smallest next step.

For a command-by-command review map, use `docs/release-gate-matrix.md`. For the
current human-readable evidence posture, use `docs/evidence-dashboard.md`.

## Release Checklist

- Confirm `.cache/` and raw public datasets are not staged.
- Confirm `benchmark-artifacts/repo-hygiene/latest.json` reports a passing
  source-hygiene scan with redacted findings.
- Confirm generated artifacts distinguish synthetic, plaintext real-data, toy
  cryptography, and native FHE results.
- Confirm `benchmark-artifacts/privacy-modes/padding-ablation/latest.json`
  keeps the metadata-exposure score caveated as a taxonomy proxy, not formal
  leakage or reconstruction-resistance proof.
- Confirm `benchmark-artifacts/native-evidence/latest.json` identifies the
  host/toolchain, latest native lane artifacts, exact rerun commands, and
  remaining gaps, including ciphertext-byte and RSS/peak-memory measurement
  coverage plus the per-lane measurement gap index.
- Confirm `benchmark-artifacts/release-evidence/latest.json` indexes the
  current hosted-CI evidence, repository hygiene result, native measurement coverage,
  metadata-leakage caveat, reconstruction-risk probe caveat, and
  real N-MNIST plaintext baseline plus the TFHE-rs real-data input blocker,
  with `productionClaim: false` status without marking the release gate
  satisfied.
- Confirm `benchmark-artifacts/reconstruction-risk/latest.json` keeps
  `privacyProofClaim: false`, blocks raw payload replay and active-value
  recovery in the synthetic probe, and records public-position residual risk.
- Confirm `benchmark-artifacts/comparisons/tfhe-rs-realdata/latest.json`
  records the exact unsupported EEG-derived input command and smallest next
  step until a real-data TFHE-rs adapter exists.
- Confirm `benchmark-artifacts/plaintext-baselines/nmnist-local/latest.json`
  records the real public N-MNIST sampled plaintext baseline, including
  provenance, compression curve, and caveat that it is not encrypted-compute or
  deployment evidence.
- Confirm `VALIDATION.md` includes the commands that produced committed
  artifacts.
- Confirm every crypto lane keeps `productionClaim: false`.
- Confirm README caveats avoid medical, surveillance, valuation, or deployment
  claims.
- Confirm the portable GitHub Actions CI workflow is green on the release PR.
- Confirm `git diff --check` and `npm run validate` pass.
- Confirm the repository ruleset/admin policy merge path is satisfied.
- Tag only after the validation PR is merged, every gate above is satisfied,
  and the user gives explicit approval for the final release action.

## Suggested GitHub Release Notes

Title:

```text
NeuroFHE Relay v0.1.0 research alpha
```

Body:

```markdown
This is a CC0 research-alpha snapshot of NeuroFHE Relay.

Included evidence:
- educational toy additive encrypted sparse scorer
- real public UCI EEG Eye State plaintext baseline
- metadata leakage versus padded-sparse overhead ablation
- synthetic reconstruction-risk probe report
- OpenFHE BFVrns native single-window real-data-derived input run
- OpenFHE CKKS native single-window real-data-derived input run
- TFHE-rs synthetic threshold comparison lane

Caveats:
- not production cryptography
- not medical or diagnostic software
- not dataset-scale encrypted model validation
- sparse public active positions still leak structural metadata unless padded
- native timings are local-machine evidence and need repeated benchmark sweeps
```

## Next Release Target

`v0.2.0-research-alpha` should focus on:

- multi-window native OpenFHE and TFHE-rs dataset sweeps
- serialized ciphertext byte measurements
- real-data padded-sparse native ablations
- CKKS dense packed-vector comparison
- clearer CI or reproducible host setup for OpenFHE/TFHE dependencies
