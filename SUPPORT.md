# Support

NeuroFHE Relay is a CC0 research-alpha package. Support channels are best-effort
and evidence-first; they are not commercial support, clinical guidance,
security certification, deployment approval, or release approval.

## Support Routes

Use this table before opening a public thread. It keeps ordinary support,
evidence gaps, cleanup requests, sensitive reports, conduct concerns, and
release blockers on the right path without exposing private material or
weakening the research-alpha evidence boundary.

| Situation | Public Route | Private Or Special Route |
| --- | --- | --- |
| Reproducible command, CI, script, or artifact failure | GitHub bug report issue form | Use `docs/troubleshooting.md` first so the report includes exact command, error, and smallest next step. |
| Validation or evidence gap | GitHub validation-gap issue form | Use `docs/evidence-dashboard.md` and `docs/release-gate-matrix.md` before calling it release-ready or release-blocking. |
| Documentation, packaging, navigation, or repository cleanup | GitHub repository-cleanup issue form | Use `CONTRIBUTING.md` and `docs/contributor-workflow.md` before opening a cleanup PR. |
| Sensitive security issue, suspected secret exposure, or private data leak | Do not open a public issue. | Use `SECURITY.md`; keep secrets, private payloads, raw datasets, and exploit details out of public threads. |
| Release readiness, hosted-check, or repository ruleset blocker | Public issue only when it can be discussed without private data. | Use `docs/operations-runbook.md`, `RELEASE.md`, and `docs/release-gate-matrix.md`; distinguish CI/check-rollup from repository ruleset/admin policy. |
| Conduct concern | Do not continue the public thread if it is unsafe or sensitive. | Use `CODE_OF_CONDUCT.md` report routing. |

Use the GitHub issue forms for public, non-sensitive reports:

- Reproducible bugs, failing commands, CI failures, or artifact-generation
  problems.
- Validation or evidence gaps where the current caveat must remain visible.
- Documentation, packaging, navigation, or repository-cleanup requests.

Blank issues are disabled so public reports keep the exact-command,
smallest-next-step, raw-data, secret, private-payload, and claim-boundary
prompts visible.

Use `SECURITY.md` for sensitive security reports, suspected private data leaks,
secret exposure, or issues that should not begin in a public thread.

Use `CONTRIBUTING.md` and `docs/contributor-workflow.md` before opening a pull
request. Use `docs/operations-runbook.md` when the issue is a hosted-check,
repository ruleset/admin policy, artifact-refresh, or release-validation
blocker.

Use `CODE_OF_CONDUCT.md` for public collaboration expectations and conduct
report routing.

Use `docs/troubleshooting.md` first for common local npm, hosted-CI,
native-lane, dataset, or release-gate blockers.

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
