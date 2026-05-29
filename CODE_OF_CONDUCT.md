# Code Of Conduct

NeuroFHE Relay is a CC0 research-alpha repository. The project welcomes
good-faith review, issues, and pull requests that keep the evidence boundary
clear and make the public package easier to inspect.

## Expected Conduct

- Be respectful, precise, and evidence-first in issues, pull requests, and
  review comments.
- Keep disagreements focused on reproducible commands, artifact contents,
  claim language, and documented caveats.
- Use `CONTRIBUTING.md` for contribution expectations, `SUPPORT.md` for report
  routing, and `SECURITY.md` for sensitive security or private-data concerns.
- Do not post secrets, private payloads, proprietary material, exploit payloads,
  raw signal rows, or raw datasets in public issues, pull requests, committed
  artifacts, screenshots, or comments.

## Claim Boundary

Conduct expectations do not upgrade project claims. NeuroFHE Relay remains
not production cryptography, not medical software, not clinical validation,
not deployment evidence, not a privacy proof, and not a security certification.

Public collaboration should preserve `productionClaim: false`,
`releaseGateSatisfied: false`, `privacyBoundary`, `cryptoInventory`, CC0
framing, and the bio-digital event intelligence boundary unless stronger
evidence is actually present and documented.

## Reporting

For ordinary public problems, use the GitHub issue forms described in
`SUPPORT.md` and `docs/contributor-workflow.md`. For sensitive reports,
suspected secret exposure, private data, or security concerns, use
`SECURITY.md` instead of opening a public issue.

If a report involves unavailable datasets, native dependencies, hosted CI, or a
release gate, include the exact command, error, and smallest next step whenever
possible. Do not substitute toy, synthetic, stale, or unsupported benchmark
numbers for a blocker.
