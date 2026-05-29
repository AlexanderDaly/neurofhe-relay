# Testing Strategy

NeuroFHE Relay uses a portable validation gate for repository hygiene,
documentation integrity, artifact contracts, and research-alpha claim
boundaries. This page explains what the gate covers, where it is defined, and
what it does not prove.

Passing these checks does not create production cryptography, clinical,
medical, deployment, privacy-proof, side-channel, anonymity, or stable
performance claims.

## Portable Gate

The canonical local command is defined in `package.json`:

```sh
npm run validate
```

That command currently runs:

- `npm test` for the Node test suite in `prototype/test/prototype.test.mjs`.
- JSON parsing for `project-brief.json` and
  `prototype/research-assumptions.json`.
- `npm run check:docs`, which executes `prototype/scripts/check-docs.mjs`.
- The repository hygiene scan in `prototype/scripts/placeholder-scan.mjs`.

`VALIDATION.md` records the current local output and the historical commands
that produced committed artifacts. Treat it as the evidence log, not as a
replacement for rerunning the gate on a fresh release candidate.

## Hosted Gate

Hosted CI is defined in `.github/workflows/ci.yml`. It runs the portable
validation path on pull request and push events, with `workflow_dispatch`
available for manual checks.

Hosted `Portable validation` proves the portable Node, documentation, metadata,
and hygiene checks ran in GitHub Actions. It does not prove native OpenFHE or
TFHE-rs dependency availability, release approval, benchmark completeness, or
production readiness.

## Guard Families

The Node suite in `prototype/test/prototype.test.mjs` covers several classes of
behavior:

- Toy additive encryption and sparse linear scorer contracts.
- Gateway validation, raw-payload withholding, and safe local recommendation
  boundaries.
- Plaintext baseline parsing, feature extraction, and blocker behavior.
- Native adapter manifests and native source/API markers for OpenFHE and
  TFHE-rs lanes.
- Artifact publishing contracts for benchmark, privacy-mode, native-evidence,
  reconstruction-risk, release-evidence, and repository-hygiene outputs.
- Repository readability guards for command coverage, docs indexing, briefing
  order, prototype maps, patent maps, generated outputs, artifact directories,
  workflow surfaces, policy boundaries, status roadmap surfaces, and glossary
  vocabulary.
- GitHub Actions trigger and action-major checks.

These guards keep navigation, caveats, and artifact surfaces from drifting as
the repository grows.

## Documentation And Hygiene Checks

`prototype/scripts/check-docs.mjs` checks local Markdown links across tracked
documentation so reader paths fail fast when a page is moved, renamed, or
deleted.

`prototype/scripts/placeholder-scan.mjs` checks for unfinished placeholder text,
common token-shaped secrets, and raw-data path mistakes. It is a source-hygiene
scan, not a secret-manager audit, malware scan, or review of private datasets
outside the repository.

## Native And Release Limits

The portable gate deliberately avoids assuming local OpenFHE or TFHE-rs
dependencies are installed on every contributor machine. Native evidence is
tracked through committed artifacts and blocker reports, especially
`benchmark-artifacts/native-evidence/latest.json`.

Before a release tag, use `RELEASE.md` for the required command sequence and
refresh artifacts or blocker reports when dependencies or datasets cannot run.
Do not substitute a passing portable gate for native measurements, privacy
proofs, clinical validation, or release approval.

## When Adding A Check

- Add the smallest focused test or scanner behavior that catches the drift.
- Watch the focused check fail before implementing the fix.
- Keep the failure tied to a real repository contract, artifact schema,
  command, or reader path.
- Update `VALIDATION.md` when the current portable gate count or documented
  coverage changes.
- Preserve `productionClaim: false`, `privacyBoundary`, `cryptoInventory`, and
  claim caveats when a check touches evidence artifacts.
