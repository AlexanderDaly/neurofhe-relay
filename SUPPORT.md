# Support

NeuroFHE Relay is a CC0 research-alpha package. Support channels are best-effort
and evidence-first; they are not commercial support, clinical guidance,
security certification, deployment approval, or release approval.

## Where To Route Reports

Use the GitHub issue forms for public, non-sensitive reports:

- Reproducible bugs, failing commands, CI failures, or artifact-generation
  problems.
- Validation or evidence gaps where the current caveat must remain visible.
- Documentation, packaging, navigation, or repository-cleanup requests.

Use `SECURITY.md` for sensitive security reports, suspected private data leaks,
secret exposure, or issues that should not begin in a public thread.

Use `CONTRIBUTING.md` and `docs/contributor-workflow.md` before opening a pull
request. Use `docs/operations-runbook.md` when the issue is a hosted-check,
repository ruleset/admin policy, artifact-refresh, or release-validation
blocker.

## What To Include

When possible, include:

- the exact command, observed result, and expected result;
- the affected file, artifact, or pull request;
- whether the issue is synthetic, plaintext real-data, native-lane, blocker,
  repository hygiene, documentation, or release-dashboard related;
- the smallest next step that would make the report reproducible.

Do not post secrets, private payloads, raw datasets, raw signal rows,
proprietary model weights, partner material, or exploit payloads in public
issues, pull requests, screenshots, or committed artifacts.

## Release And Claim Boundary

The current release posture remains `releaseGateSatisfied: false` until every
documented `RELEASE.md` gate is satisfied. Artifact metadata must preserve
`productionClaim: false` wherever that field appears.

Support responses should not upgrade toy arithmetic, plaintext baselines,
single-window native runs, synthetic reconstruction probes, or metadata-leakage
proxies into production cryptography, medical, clinical, deployment,
side-channel, privacy-proof, identity-protection, or stable-performance claims.
