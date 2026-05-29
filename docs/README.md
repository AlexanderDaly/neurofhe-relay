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
- `contributor-workflow.md` - map of issue forms, PR template, and hosted CI
  workflow surfaces.
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
- `DEVELOPMENT.md` - fuller setup notes, native FHE commands, and artifact
  policy.
- `CONTRIBUTING.md` - evidence-first contribution rules and issue/PR workflow.
- `RELEASE.md` - research-alpha release gate.
- `VALIDATION.md` - recorded validation commands and caveated results.
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
`.github` workflow, issue, and pull-request surface.

Nothing in this documentation upgrades NeuroFHE Relay into production
cryptography, medical software, clinical validation, deployment evidence, or a
security certification.
