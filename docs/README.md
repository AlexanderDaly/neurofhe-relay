# Documentation

This directory holds orientation material for readers and contributors. The
top-level numbered briefs remain the public briefing sequence; these docs
help people navigate the repository and run the research-alpha checks without
changing the evidence boundary.

## Start Here

| Need | Start With | Then Use |
| --- | --- | --- |
| New reviewer | `docs/reviewer-quickstart.md` | `docs/faq.md`, `docs/glossary.md`, `docs/status-roadmap.md` |
| Contributor | `docs/developer-quickstart.md` | `docs/command-reference.md`, `docs/troubleshooting.md`, `CONTRIBUTING.md` |
| Evidence reviewer | `docs/evidence-dashboard.md` | `docs/evidence-guide.md`, `docs/claim-evidence-ledger.md`, `benchmark-artifacts/README.md` |
| Release or maintainer review | `RELEASE.md` | `docs/release-gate-matrix.md`, `docs/maintainer-checklist.md`, `docs/operations-runbook.md` |

Before treating a release-validation PR as merge-ready, confirm the live head,
check rollup, and repository ruleset/admin policy state instead of relying only
on a committed dashboard snapshot:

```sh
gh pr view "$RELEASE_VALIDATION_PR" --json headRefOid,mergeable,mergeStateStatus,statusCheckRollup
```

## Repository Baseline

Use this short map when checking whether the package looks like a maintained
public repository before opening the deeper inventories.

| Surface | Purpose |
| --- | --- |
| `LICENSE` and `PUBLIC_DOMAIN_NOTICE.md` | CC0/public-domain framing and reuse boundary. |
| `PACKAGE_MANIFEST.md` | Exhaustive packaged-review file inventory. |
| `.github/` | Issue templates, PR template, CODEOWNERS, Dependabot, and hosted CI. |
| `.node-version`, `.nvmrc`, and `.editorconfig` | Local edit and Node.js version consistency. |
| `CHANGELOG.md` and `VALIDATION.md` | Current review history and recorded validation posture. |

## Reader Paths

- `briefing-sequence.md` - reading order for the root `01-` through `12-`
  public briefing files.
- `prototype-map.md` - scaffold code map for prototype/ entrypoints, library
  modules, native lanes, and support notes.
- `patent-package-map.md` - navigation map for ENER patent, briefing, and
  Mermaid diagram sources.
- `presentation-outputs.md` - map of generated presentation exports retained
  for packaged review.
- `repository-guide.md` - map of the root briefs, prototype/ scaffold code, committed
  evidence artifacts, patent materials, and release gate.
- `faq.md` - short answers to common claim, evidence, raw-data, CI, release,
  and CC0 questions.
- `glossary.md` - definitions for recurring claim, artifact, release, gateway,
  and native-lane terms.
- `testing-strategy.md` - portable validation, hosted CI, docs-link, hygiene,
  and guard-family map.
- `dependency-matrix.md` - portable, hosted, native-lane, dataset, and release
  dependency map.
- `data-handling.md` - raw-data, derived-artifact, blocker, and hygiene
  boundary map.
- `claim-evidence-ledger.md` - weak-claim, evidence, caveat, and next-step
  ledger.
- `evidence-dashboard.md` - human-readable release-evidence dashboard with
  current gate status and caveats.
- `release-gate-matrix.md` - minimum release command, artifact, caveat, and
  blocker matrix.
- `status-roadmap.md` - current review state, remaining release blockers, and
  next evidence-work queue.
- `policy-boundary.md` - map of license, security, contribution, validation,
  and release boundary files.
- `contributor-workflow.md` - map of issue forms, PR template, and hosted CI
  workflow surfaces.
- `architecture-decisions.md` - accepted repository boundary decisions.
- `operations-runbook.md` - routine PR, hosted-check, evidence refresh, and
  blocker handling.
- `troubleshooting.md` - common local, hosted-CI, native-lane, dataset, and
  release-gate blockers.
- `reviewer-quickstart.md` - diligence and evidence-review entry path.
- `developer-quickstart.md` - first local commands for a contributor who wants
  to validate the package before opening an issue or PR.
- `command-reference.md` - grouped npm commands for validation, demos,
  benchmarks, native lanes, and release evidence.
- `evidence-guide.md` - short map for reading committed evidence without
  upgrading research-alpha claims.
- `maintainer-checklist.md` - merge, artifact, and release-review checklist for
  maintainers.

## Related Top-Level Docs

- `README.md` - project thesis, public framing, demos, and caveats.
- `CHANGELOG.md` - unreleased review history and release-caveat summary.
- `CODE_OF_CONDUCT.md` - public collaboration expectations and reporting
  boundaries.
- `MAINTAINERS.md` - current maintainer route, review ownership, and release
  authority boundary.
- `DEVELOPMENT.md` - fuller setup notes, native FHE commands, and artifact
  policy.
- `CONTRIBUTING.md` - evidence-first contribution rules and issue/PR workflow.
- `RELEASE.md` - research-alpha release gate.
- `VALIDATION.md` - recorded validation commands and caveated results.
- `SUPPORT.md` - support routing for issues, security reports, release blockers,
  and cleanup requests.
- `benchmark-artifacts/README.md` - committed evidence artifact guide.

The root `.editorconfig`, `.nvmrc`, and `.node-version` files provide a small
tooling baseline for consistent local edits and CI-parity Node.js selection.

## Validation Coverage

Use `docs/testing-strategy.md` for the complete guard-family map and
`docs/command-reference.md` for runnable commands. The common local gate is:

```sh
npm run validate
```

That gate keeps this index, the reader maps, the artifact guides, and the
claim-boundary documents from drifting as the repository grows.

| Surface | Guarded By |
| --- | --- |
| Documentation links and page inventory | `npm run check:docs` and the Node test suite |
| Command inventory | `docs/command-reference.md` coverage against `package.json` |
| Evidence artifacts | `benchmark-artifacts/README.md`, artifact-schema tests, and release-evidence checks |
| Repository hygiene | `prototype/scripts/placeholder-scan.mjs` |
| Release and claim boundaries | `VALIDATION.md`, `RELEASE.md`, and the docs listed above |

Passing validation keeps the package readable and internally consistent. It
does not create production cryptography, medical software, clinical validation,
deployment evidence, release approval, or security certification.

Nothing in this documentation upgrades NeuroFHE Relay into production
cryptography, medical software, clinical validation, deployment evidence, or a
security certification.
