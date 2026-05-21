# Package Manifest

## Purpose

This repository packages the first presentation-ready version of NeuroFHE Relay: a privacy-preserving neuromorphic + homomorphic-encryption project concept with a small desk demo, BCI privacy whitepaper, and clear 90-day prototype path.

## Files

- `README.md` - project overview and recommended framing.
- `LICENSE` - CC0 1.0 Universal public-domain dedication.
- `PUBLIC_DOMAIN_NOTICE.md` - plain-English free-use notice.
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
- `project-brief.json` - agent-readable structured project summary.
- `index.html` - self-contained browser briefing deck.
- `prototype/` - dependency-free educational sparse encrypted spike-count prototype, spatial spike sorter, local relay gateway scaffold, benchmark runner, plaintext baseline, tests, handoffs, and research assumptions.
- `package.json` - local demo, benchmark, test, and validation commands. `private: true` prevents accidental npm publication; it is not a proprietary-license declaration.
- `VALIDATION.md` - local validation commands and results.

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

Expected result: JSON output with schema `neurofhe.benchmark.v1`, sparse operation counts, dense baseline comparison, dense/raw vs unsorted-spike vs spatial-sorted representation comparison, privacy boundary, and crypto inventory.

Run the relay gateway scaffold:

```sh
npm run gateway:demo
```

Expected result: JSON output with schema `neurofhe.gateway.demo.v1`, a simulated raw-intake summary, canonical spatial spike-sorter metadata, approved model-facing event, accepted safe local recommendation, rejected unsafe command recommendation, audit log, and sanitized replay stream.

Run tests:

```sh
npm test
```

Run the plaintext real-data baseline against a local N-MNIST directory:

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

## Caveat

The included JavaScript prototype demonstrates the privacy boundary with toy additive homomorphic encryption. It is not production cryptography, not full FHE, and not the low-level runtime target. It uses public active event positions plus encrypted active spike values, so sparse metadata is visible to the compute layer. The next milestone is to make the native OpenFHE path the source of truth for performance, then port the encoder and benchmark reporting into native or hardware-aware code.

## Proprietary Track Note

This package is CC0. If a later implementation needs proprietary treatment, keep proprietary adapters, partner data, trained weights, and deployment code outside this public reference package. Do not import proprietary reverse-engineered implementations into this repository.

## License

The package is released under CC0 1.0 Universal. The intent is unrestricted public-domain-style use with no attribution requirement.
