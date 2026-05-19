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
- `project-brief.json` - agent-readable structured project summary.
- `index.html` - self-contained browser briefing deck.
- `prototype/` - dependency-free educational encrypted spike-count demo.
- `VALIDATION.md` - local validation commands and results.

## Validation

Run the desk demo:

```sh
node prototype/toy-neurohe-demo.mjs
```

Expected result: JSON output showing an educational encrypted spike-count classifier with decrypted scores and final classification.

## Caveat

The included prototype demonstrates the privacy boundary with toy additive homomorphic encryption. It is not production cryptography and not full FHE. The next milestone is to port the same event-window and score contract to a mature HE library or an Octra/HFHE experiment.

## License

The package is released under CC0 1.0 Universal. The intent is unrestricted public-domain-style use with no attribution requirement.
