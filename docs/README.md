# Documentation

This directory holds orientation material for readers and contributors. The
top-level numbered briefs remain the public presentation sequence; these docs
help people navigate the repository and run the research-alpha checks without
changing the evidence boundary.

## Reader Paths

- `briefing-sequence.md` - reading order for the root `01-` through `12-`
  public briefing files.
- `prototype-map.md` - code navigation map for prototype entrypoints, library
  modules, native lanes, and support notes.
- `patent-package-map.md` - navigation map for ENER patent, briefing, and
  Mermaid diagram sources.
- `presentation-outputs.md` - map of generated presentation exports retained
  for packaged review.
- `repository-guide.md` - map of the root briefs, prototype code, committed
  evidence artifacts, patent materials, and release gate.
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
`npm run check:docs` verifies local Markdown links and is part of
`npm run validate`. The validation suite also checks that this index lists every
Markdown page in `docs/` and that `briefing-sequence.md` lists every numbered
root brief. It also checks that `prototype-map.md` lists every
`prototype/lib/*.mjs` module, that `patent-package-map.md` lists every
Markdown and Mermaid source under `patent/`, and that
`presentation-outputs.md` lists every tracked generated output file under
`outputs/`. It also checks that `contributor-workflow.md` lists every tracked
`.github` workflow, issue, and pull-request surface, and that
`policy-boundary.md` lists the root policy and claim-boundary files. It also
checks that `status-roadmap.md` lists the release-readiness evidence surfaces
and that `glossary.md` defines recurring repository terms. It also checks that
`testing-strategy.md` maps the portable validation surfaces and that
`dependency-matrix.md` lists portable and native setup surfaces. It also checks
that `data-handling.md` lists dataset and artifact boundary surfaces. It also
checks that `claim-evidence-ledger.md` maps every weak-claim area to current
evidence and caveats. It also checks that `evidence-dashboard.md` summarizes
the current release gate status without upgrading claims. It also checks that
`release-gate-matrix.md` lists every minimum evidence command from `RELEASE.md`.
It also checks that
`reviewer-quickstart.md` lists the main due-diligence entrypoints and caveats.
It also checks that `architecture-decisions.md` records the accepted repository
boundary decisions. It also checks that `operations-runbook.md` records the
routine maintainer commands and blocker policy. It also checks that
`troubleshooting.md` routes common blockers without weakening release and claim
caveats.

Nothing in this documentation upgrades NeuroFHE Relay into production
cryptography, medical software, clinical validation, deployment evidence, or a
security certification.
