# Documentation

This directory holds orientation material for readers and contributors. The
top-level numbered briefs remain the public presentation sequence; these docs
help people navigate the repository and run the research-alpha checks without
changing the evidence boundary.

## Reader Paths

- `repository-guide.md` - map of the root briefs, prototype code, committed
  evidence artifacts, patent materials, and release gate.
- `developer-quickstart.md` - first local commands for a contributor who wants
  to validate the package before opening an issue or PR.
- `command-reference.md` - grouped npm commands for validation, demos,
  benchmarks, native lanes, and release evidence.

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
`npm run validate`.

Nothing in this documentation upgrades NeuroFHE Relay into production
cryptography, medical software, clinical validation, deployment evidence, or a
security certification.
