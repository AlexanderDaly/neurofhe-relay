# Package Manifest

## Purpose

This repository packages the first presentation-ready version of NeuroFHE Relay: a privacy-preserving neuromorphic + homomorphic-encryption project concept with a small desk demo, BCI privacy whitepaper, and clear 90-day prototype path.

## Files

- `README.md` - project overview and recommended framing.
- `LICENSE` - CC0 1.0 Universal public-domain dedication.
- `PUBLIC_DOMAIN_NOTICE.md` - plain-English free-use notice.
- `.editorconfig`, `.nvmrc`, and `.node-version` - editor and Node.js version
  hints for consistent local work.
- `docs/README.md` - documentation index for reader and contributor paths.
- `docs/repository-guide.md` - orientation map for the root briefs, prototype
  code, evidence artifacts, patent materials, and release gate.
- `docs/developer-quickstart.md` - compact local validation path for contributors.
- `docs/command-reference.md` - grouped npm command reference for validation,
  demos, benchmarks, native lanes, and release evidence.
- `01-one-pager.md` - concise executive brief.
- `02-pitch-deck.md` - 11-slide presentation narrative.
- `03-technical-architecture.md` - architecture, data flow, and boundaries.
- `04-demo-roadmap.md` - staged prototype and pilot plan.
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
- `SECURITY.md` - research-prototype security policy and reporting scope.
- `.github/ISSUE_TEMPLATE/` - guided bug, validation-gap, and repository-cleanup issue forms.
- `.github/pull_request_template.md` - evidence-boundary and validation checklist for PRs.
- `patent/` - ENER provisional drafting package, revised claim seeds, drawings, prior-art search plan, submission checklist, and policy/commercial briefing materials.
- `project-brief.json` - agent-readable structured project summary.
- `index.html` - self-contained browser briefing deck.
- `prototype/` - dependency-free educational sparse encrypted spike-count prototype, spatial spike sorter, local relay gateway scaffold, benchmark runner, plaintext baseline, synthetic reconstruction-risk probes, OpenFHE BFVrns lane, OpenFHE CKKS approximate-real lane, TFHE-rs integer/Boolean lane, tests, handoffs, and research assumptions.
- `package.json` - local demo, benchmark, documentation-link, test, and validation commands. `private: true` prevents accidental npm publication; it is not a proprietary-license declaration.
- `VALIDATION.md` - local validation commands and results.
- `.github/workflows/ci.yml` - portable CI for tests, metadata parsing, placeholder scanning, and smoke artifact generation/upload.

## Validation

Run the desk demo:

```sh
npm run demo
```

Expected result: JSON output showing an educational encrypted spike-count classifier with decrypted scores and final classification.

Run the benchmark:

```sh
npm run benchmark
```

Expected result: JSON output with schema `neurofhe.benchmark.v1`, sparse operation counts, dense baseline comparison, dense/raw vs unsorted-spike vs spatial-sorted representation comparison, public-active-neuron privacy mode, spatial-cluster readiness for SNN/encrypted model handoff, privacy boundary, and crypto inventory.

Run the relay gateway scaffold:

```sh
npm run gateway:demo
```

Expected result: JSON output with schema `neurofhe.gateway.demo.v1`, a simulated raw-intake summary, canonical spatial spike-sorter metadata, approved reconstruction-resistant model-facing event, accepted safe local recommendation, rejected unsafe command recommendation, audit log, and sanitized replay stream.

Run the synthetic reconstruction-risk probes:

```sh
npm run reconstruction:risk
```

Expected result: JSON output with schema `neurofhe.reconstructionRiskProbes.v1`
showing raw-payload replay and active-value recovery blocked in the synthetic
gateway probe while public-position linkage remains a residual risk.

Run tests:

```sh
npm test
```

Run the TFHE-rs comparison lane:

```sh
npm run benchmark:tfhe -- --run
```

Print the OpenFHE CKKS approximate-real comparison lane:

```sh
npm run benchmark:openfhe-ckks
```

Generate OpenFHE-ready EEG input contracts and run the native BFVrns/CKKS lanes
against one derived sparse window:

```sh
npm run contract:eeg-openfhe
npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact
```

Run the plaintext real-data baseline against a local N-MNIST directory:

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

## Caveat

The included JavaScript prototype demonstrates the privacy boundary with toy additive homomorphic encryption. It is not production cryptography, not full FHE, and not the low-level runtime target. It uses public active neuron positions plus encrypted active feature values for the sorted-event path, so sparse metadata is visible to the compute layer. The native OpenFHE BFVrns path carries the same sparse sorted-event score contract for exact integer packed arithmetic comparison and now accepts generated fixed-point real-data input contracts once OpenFHE is installed and reviewed. The native OpenFHE CKKS path carries the same sparse contract for approximate real-valued neural/ML feature scoring with score-drift reporting and generated approximate-real real-data input contracts. The native TFHE-rs path carries the same sparse score contract plus an encrypted Boolean threshold bit for threshold/LUT-style comparison. None of the native lanes is production cryptography.

## Proprietary Track Note

This package is CC0. If a later implementation needs proprietary treatment, keep proprietary adapters, partner data, trained weights, and deployment code outside this public reference package. Do not import proprietary reverse-engineered implementations into this repository.

## License

The package is released under CC0 1.0 Universal. The intent is unrestricted public-domain-style use with no attribution requirement.
