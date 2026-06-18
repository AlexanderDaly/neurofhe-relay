# Package Manifest

## Purpose

This file is a packaged-review inventory, not a command reference. It lists the
repository surfaces a reviewer should expect in the CC0 research-alpha package
and routes commands, evidence, and release decisions to the maintained
documents that own them.

## Inventory Review Routes

Use this table before the full file list when checking whether a packaged
snapshot is readable, caveated, and ready for diligence review.

| Review Need | Start With | Then Use |
| --- | --- | --- |
| First-read orientation | `README.md` | `docs/README.md`, `docs/repository-guide.md`, `docs/faq.md` |
| Current validation and release posture | `VALIDATION.md` | `RELEASE.md`, `docs/status-roadmap.md`, `docs/release-gate-matrix.md` |
| Evidence artifacts and caveats | `docs/evidence-dashboard.md` | `benchmark-artifacts/README.md`, `docs/claim-evidence-ledger.md`, `docs/evidence-guide.md` |
| Contribution and maintenance routing | `CONTRIBUTING.md` | `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`, `docs/maintainer-checklist.md` |
| Patent or briefing review | `docs/patent-package-map.md` | `patent/briefing/ENER_weak_claims_evidence_gaps.md`, `docs/briefing-sequence.md` |

## Files

- `README.md` - project overview and recommended framing.
- `LICENSE` - CC0 1.0 Universal public-domain dedication.
- `PUBLIC_DOMAIN_NOTICE.md` - plain-English free-use notice.
- `PACKAGE_MANIFEST.md` - this packaged-review inventory.
- `CHANGELOG.md` - unreleased review history and release-caveat summary.
- `CODE_OF_CONDUCT.md` - public collaboration expectations and reporting
  boundaries.
- `MAINTAINERS.md` - current maintainer route, review ownership, and release
  authority boundary.
- `.editorconfig`, `.nvmrc`, and `.node-version` - editor and Node.js version
  hints for consistent local work.
- `.gitattributes` and `.gitignore` - repository file-normalization and
  ignore rules.
- `docs/README.md` - documentation index for reader and contributor paths.
- `docs/briefing-sequence.md` - reading order for the numbered public briefs.
- `docs/repository-guide.md` - orientation map for the root briefs,
  prototype/ scaffold code, evidence artifacts, patent materials, and release
  gate.
- `docs/faq.md` - short answers to common claim, evidence, raw-data, CI,
  release, and CC0 questions.
- `docs/glossary.md` - recurring project, artifact, release, gateway, and
  native-lane terms.
- `docs/testing-strategy.md` - portable validation, hosted CI, docs-link,
  hygiene, and guard-family map.
- `docs/dependency-matrix.md` - portable, hosted, native-lane, dataset, and
  release dependency map.
- `docs/data-handling.md` - raw-data, derived-artifact, blocker, and hygiene
  boundary map.
- `docs/claim-evidence-ledger.md` - weak-claim, evidence, caveat, and next-step
  ledger.
- `docs/evidence-dashboard.md` - human-readable release-evidence dashboard
  status and caveats.
- `docs/release-gate-matrix.md` - minimum release command, artifact, caveat,
  and blocker matrix.
- `docs/status-roadmap.md` - current review state, remaining release blockers,
  and next evidence-work queue.
- `docs/policy-boundary.md` - license, security, contribution, validation, and
  release boundary map.
- `docs/prototype-map.md` - scaffold code map for prototype/ entrypoints,
  library modules, native lanes, and support notes.
- `docs/patent-package-map.md` - navigation map for patent and briefing sources.
- `docs/presentation-outputs.md` - map of generated presentation exports kept
  for packaged review.
- `docs/contributor-workflow.md` - map of issue forms, PR template, and hosted
  CI workflow surfaces.
- `docs/architecture-decisions.md` - accepted repository boundary decisions.
- `docs/operations-runbook.md` - routine PR, hosted-check, evidence refresh,
  and blocker handling.
- `docs/troubleshooting.md` - common local, hosted-CI, native-lane, dataset,
  and release-gate blocker routes.
- `docs/reviewer-quickstart.md` - diligence and evidence-review entry path.
- `docs/developer-quickstart.md` - compact local validation path for contributors.
- `docs/command-reference.md` - grouped npm command reference for validation,
  demos, benchmarks, native lanes, and release evidence.
- `docs/evidence-guide.md` - short evidence map for claim-safe artifact review.
- `docs/maintainer-checklist.md` - merge, artifact, and release-review checklist.
- `01-one-pager.md` - concise executive brief.
- `02-pitch-deck.md` - 11-slide evidence narrative.
- `03-technical-architecture.md` - architecture, data flow, and boundaries.
- `04-demo-roadmap.md` - research-alpha evidence roadmap.
- `05-risk-register.md` - technical, market, and execution risks.
- `06-evidence-and-sources.md` - research notes and sources.
- `07-post-quantum-cryptography-track.md` - quantum-resistant design target, crypto agility plan, and standards baseline.
- `08-encrypted-thoughts-whitepaper.md` - whitepaper arguing for encrypted-thoughts architecture in BCI and neural-data systems.
- `09-relay-gateway-pattern.md` - local-first relay gateway pattern covering raw-signal intake, trust boundary, normalization, privacy/safety filtering, model-facing event schemas, command recommendations, audit/replay, and failure handling.
- `10-native-performance-track.md` - native-first boundary for low-level performance, energy measurement, and hot-path implementation choices.
- `11-architecture-visuals.md` - Mermaid architecture diagrams for pipeline, encrypted relay flow, latent embedding, and trust-boundary views.
- `12-discreet-spike-sorting-proof.md` - proof gate for real-data-derived event sorting, raw-boundary evidence, leakage probes, encrypted handoff, and the Quiet Allocations shelf rule.
- `CONTRIBUTING.md` - evidence-first contribution expectations and validation commands.
- `DEVELOPMENT.md` - setup notes, CI parity checks, native FHE commands, and artifact policy.
- `RELEASE.md` - research-alpha release checklist and evidence gates.
- `SECURITY.md` - research-alpha security scope and responsible reporting
  guidance.
- `SUPPORT.md` - support routing for bugs, evidence gaps, security reports,
  release blockers, and cleanup requests.
- `.github/ISSUE_TEMPLATE/` - guided bug, validation-gap, and repository-cleanup issue forms.
- `.github/CODEOWNERS` - repository review ownership routing.
- `.github/dependabot.yml` - weekly grouped dependency update routing for
  GitHub Actions and npm metadata.
- `.github/pull_request_template.md` - evidence-boundary and validation checklist for PRs.
- `benchmark-artifacts/` - committed derived evidence, hosted-CI snapshots,
  blocker reports, and release-evidence indexes.
- `outputs/` - generated presentation exports retained for packaged review.
- `patent/` - ENER provisional drafting package, revised claim seeds, drawings, prior-art search plan, submission checklist, and policy/commercial briefing materials.
- `project-brief.json` - agent-readable structured project summary.
- `index.html` - self-contained browser briefing deck.
- `prototype/` - dependency-free educational sparse encrypted spike-count scaffold, spatial spike sorter, local relay gateway scaffold, benchmark runner, plaintext baseline, synthetic reconstruction-risk probes, OpenFHE BFVrns lane, OpenFHE CKKS approximate-real lane, TFHE-rs integer/Boolean lane, tests, handoffs, and research assumptions.
- `package.json` - local demo, benchmark, documentation-link, test, and validation commands. `private: true` prevents accidental npm publication; it is not a proprietary-license declaration.
- `VALIDATION.md` - local validation commands and results.
- `.github/workflows/ci.yml` - portable CI for tests, metadata parsing, placeholder scanning, and smoke artifact generation/upload.

## Validation

Use these owner documents instead of duplicating command details here:

| Need | Maintained Route |
| --- | --- |
| Current portable gate and recorded local results | `VALIDATION.md` |
| Runnable npm commands and native-lane command groups | `docs/command-reference.md` |
| Research-alpha release gate and no-tag checklist | `RELEASE.md` |
| Command-by-command release artifact/caveat map | `docs/release-gate-matrix.md` |
| Human-readable release evidence posture | `docs/evidence-dashboard.md` |
| Committed evidence artifact directories and caveats | `benchmark-artifacts/README.md` |

The current release posture remains `releaseGateSatisfied: false`. Artifact
metadata that carries `productionClaim: false`, `privacyBoundary`, or
`cryptoInventory` must preserve those fields. This manifest does not create
benchmark evidence, release approval, production cryptography, medical or
clinical validation, deployment evidence, a privacy proof, or a security
certification.

## Caveat

The included JavaScript scaffold demonstrates the privacy boundary with toy
additive homomorphic encryption. It is not production cryptography, not full
FHE, and not the low-level runtime target. It uses public active neuron
positions plus encrypted active feature values for the sorted-event path, so
sparse metadata is visible to the compute layer.

Use `benchmark-artifacts/native-evidence/latest.json` for the current
native-lane posture. The indexed native evidence currently includes:

- OpenFHE BFVrns: `openfhe-bfvrns-eeg-eye-state-2026-05-21`.
- OpenFHE CKKS: `openfhe-ckks-eeg-eye-state-2026-05-21`.
- TFHE-rs: `tfhe-rs-alpha-lane-framing-2026-05-29`.

Those artifacts show the integration lanes are real native-library research
evidence on the indexed host. The single-window native measurement gaps are now
closed on that host: OpenFHE BFVrns and CKKS report serialized ciphertext-byte
sizes and end-of-run RSS, and TFHE-rs now runs the EEG-derived signed-integer
contract in addition to the synthetic lane. Multi-window coverage and a
release-machine rerun remain. None of the native lanes is production
cryptography.

## Proprietary Track Note

This package is CC0. If a later implementation needs proprietary treatment, keep proprietary adapters, partner data, trained weights, and deployment code outside this public reference package. Do not import proprietary reverse-engineered implementations into this repository.

## License

The package is released under CC0 1.0 Universal. The intent is unrestricted public-domain-style use with no attribution requirement.
