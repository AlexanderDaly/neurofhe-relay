# Package Manifest

## Purpose

This repository packages the first presentation-ready version of NeuroFHE Relay: a privacy-preserving neuromorphic + homomorphic-encryption project concept with a small desk demo and a clear 90-day prototype path.

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
- `project-brief.json` - agent-readable structured project summary.
- `index.html` - self-contained browser briefing deck.
- `prototype/` - dependency-free educational sparse encrypted spike-count prototype, benchmark runner, tests, linear-algebra handoff, and research assumptions.
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

Expected result: JSON output with schema `neurofhe.benchmark.v1`, sparse operation counts, dense baseline comparison, privacy boundary, and crypto inventory.

Run tests:

```sh
npm test
```

## Caveat

The included prototype demonstrates the privacy boundary with toy additive homomorphic encryption. It is not production cryptography and not full FHE. It uses public active event positions plus encrypted active spike values, so sparse metadata is visible to the compute layer. The next milestone is to port the same event-list and score contract to a mature HE library or an Octra/HFHE experiment.

## Proprietary Track Note

This package is CC0. If a later implementation needs proprietary treatment, keep proprietary adapters, partner data, trained weights, and deployment code outside this public reference package. Do not import proprietary reverse-engineered implementations into this repository.

## License

The package is released under CC0 1.0 Universal. The intent is unrestricted public-domain-style use with no attribution requirement.
