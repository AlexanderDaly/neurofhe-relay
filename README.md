# NeuroFHE Relay

Presentation package for a privacy-preserving neuromorphic + homomorphic-encryption project.

```text
                 NEUROFHE RELAY

  raw local signals
  files | sensors | apps | logs | simulated streams
          |
          v
  +--------------------------+
  | spatial spike sorter     |
  | FPGA / edge target       |
  +------------+-------------+
               |
               v
  +--------------------------+       raw payloads stay local
  | local relay gateway      |<--------------------------------+
  | normalize + policy       |                                 |
  +------------+-------------+                                 |
               |                                               |
               v                                               |
    approved minimal event representation                      |
               |                                               |
               v                                               |
  +--------------------------+                                 |
  | encrypted compute        |                                 |
  | model / agent service    |                                 |
  +------------+-------------+                                 |
               |                                               |
               v                                               |
        recommendation only                                    |
               |                                               |
               v                                               |
  +--------------------------+                                 |
  | gateway validation       |---------------------------------+
  | safe local action only   |
  +--------------------------+
```

## Core Thesis

Neuromorphic systems are attractive because they turn sensory streams into sparse events and spiking neural network activity. Homomorphic encryption is attractive because it allows useful computation without decrypting the underlying data. The project opportunity is to combine them at the workload boundary:

1. Neuromorphic edge hardware or software produces compact spike/event features.
2. Sensitive features are encrypted before leaving the local environment.
3. FHE or Octra-style encrypted compute evaluates selected inference, policy, or verification steps.
4. Only the final result, proof, or decision is decrypted by the authorized party.

This avoids the weak claim that current neuromorphic chips should directly run full FHE bootstrapping. Instead, the project uses neuromorphic sparsity to make encrypted inference smaller and more practical.

## Commons Principle

If this becomes part of the interface layer between biology, machines, and shared computational realities, the basic architecture should be free to inspect, copy, improve, and teach. That is why the repository is released under CC0.

The cryptographic design target is:

> Quantum-resistant by design, cryptographically agile by default.

## Start Here

New readers should begin with `docs/README.md`, `docs/briefing-sequence.md`,
`docs/repository-guide.md`, `docs/prototype-map.md`,
`docs/patent-package-map.md`, `docs/presentation-outputs.md`,
`docs/glossary.md`, `docs/testing-strategy.md`, `docs/status-roadmap.md`,
`docs/policy-boundary.md`, `docs/contributor-workflow.md`,
`docs/developer-quickstart.md`, `docs/command-reference.md`, and
`docs/evidence-guide.md`. Maintainers should also use
`docs/maintainer-checklist.md`. Together they map the public briefing sequence,
prototype code, committed evidence artifacts, patent briefing material,
recurring vocabulary, testing strategy, current status, claim-boundary files,
contributor workflow, runnable commands, and research-alpha release gate
without upgrading any cryptographic, security, medical, or deployment claim.

## Package Contents

- `LICENSE` - CC0 1.0 Universal public-domain dedication.
- `PUBLIC_DOMAIN_NOTICE.md` - plain-English free-use notice.
- `.editorconfig`, `.nvmrc`, and `.node-version` - editor and Node.js version
  hints for consistent local work.
- `docs/README.md` - documentation index for reader and contributor paths.
- `docs/briefing-sequence.md` - reading order for the numbered public briefs.
- `docs/repository-guide.md` - first-pass map for readers and contributors.
- `docs/glossary.md` - recurring project, artifact, release, gateway, and
  native-lane terms.
- `docs/testing-strategy.md` - portable validation, hosted CI, docs-link,
  hygiene, and guard-family map.
- `docs/status-roadmap.md` - current review state, release blockers, and next
  evidence-work queue.
- `docs/policy-boundary.md` - license, security, contribution, validation, and
  release boundary map.
- `docs/prototype-map.md` - code navigation map for prototype surfaces.
- `docs/patent-package-map.md` - navigation map for patent and briefing sources.
- `docs/presentation-outputs.md` - map of generated presentation exports.
- `docs/contributor-workflow.md` - map of issue, PR, and hosted CI surfaces.
- `docs/developer-quickstart.md` - compact local validation path for contributors.
- `docs/command-reference.md` - grouped npm command reference.
- `docs/evidence-guide.md` - short evidence map for claim-safe artifact review.
- `docs/maintainer-checklist.md` - merge, artifact, and release-review checklist.
- `01-one-pager.md` - executive one-page brief.
- `02-pitch-deck.md` - 11-slide presentation narrative.
- `03-technical-architecture.md` - system architecture and data flow.
- `04-demo-roadmap.md` - prototype plan from desk demo to fundable pilot.
- `05-risk-register.md` - technical, market, and execution risks.
- `06-evidence-and-sources.md` - source-backed research notes.
- `07-post-quantum-cryptography-track.md` - PQC design target and roadmap.
- `08-encrypted-thoughts-whitepaper.md` - whitepaper on encrypted-thoughts architecture for BCI and neural-data privacy.
- `09-relay-gateway-pattern.md` - local-first gateway pattern for raw-signal intake, privacy filtering, model-facing events, recommendations, audit, replay, and failure handling.
- `10-native-performance-track.md` - native-first implementation boundary for low-latency and energy-aware execution.
- `11-architecture-visuals.md` - Mermaid architecture diagrams for pipeline, encrypted relay flow, latent embedding, and trust-boundary views.
- `12-discreet-spike-sorting-proof.md` - proof gate for real-data-derived event sorting, raw-boundary evidence, leakage probes, and the Quiet Allocations shelf rule.
- `CONTRIBUTING.md` - evidence-first contribution rules and local validation expectations.
- `DEVELOPMENT.md` - local setup, portable checks, native OpenFHE/TFHE-rs commands, and artifact policy.
- `RELEASE.md` - research-alpha release checklist and evidence gates.
- `SECURITY.md` - research-prototype security policy and reporting guidance.
- `.github/ISSUE_TEMPLATE/` - guided forms for bugs, validation gaps, and repository cleanup requests.
- `.github/pull_request_template.md` - PR checklist for evidence boundary and validation notes.
- `VALIDATION.md` - local validation commands, outputs, artifacts, and caveats.
- `.github/workflows/ci.yml` - portable CI for tests, schema checks, repository hygiene scan, and smoke artifact generation/upload.
- `benchmark-artifacts/` - intentionally committed derived benchmark evidence, repository hygiene scan evidence, and blocker reports.
- `patent/` - ENER provisional drafting materials, claim seeds, drawings, prior-art search plan, filing checklist, and briefing package.
- `project-brief.json` - structured project metadata for agents.
- `index.html` - self-contained briefing deck for browser presentation.
- `prototype/` - dependency-free educational sparse encrypted spike-count prototype, relay gateway scaffold, benchmark runner, real OpenFHE BFVrns, OpenFHE CKKS, and TFHE-rs integration lanes, tests, and research assumptions.
- `package.json` - local command scripts. The package is marked private to prevent accidental npm publication; it does not change the repository's CC0 license.

## Recommended Framing

Use the phrase:

> A privacy layer for event-driven AI: neuromorphic systems make data sparse, FHE keeps the sensitive computation private.

For the biology and digital interface framing, use:

> Bio-digital event intelligence: sensitive signals stay local, compact event features cross the boundary under explicit privacy and cryptographic controls.

For the BCI privacy framing, use "encrypted thoughts" as an architecture phrase, not as a literal mind-reading claim:

> Signals capable of supporting thought, intent, language, or cognitive-state inference should stay local by default, and selected event features should remain encrypted during external computation.

For the gateway framing, use:

> The local gateway is the only trusted boundary allowed to inspect raw signals. Models receive only validated, transformed, permissioned event representations.

Avoid medical-device language until a real regulated use case, dataset, clinical validation path, and legal review exist. The current prototype is about privacy-preserving event representation and encrypted scoring, not diagnosis or treatment.

Avoid saying:

> We run Octra directly on neuromorphic chips.

That is not defensible today. The defensible near-term claim is a hybrid architecture: neuromorphic preprocessing plus FHE-protected inference/verification.

## Development And CI

For the portable local gate, run:

```sh
npm run ci
git diff --check
```

`npm run ci` currently aliases `npm run validate`. It runs tests, JSON metadata
parsing, local Markdown link checking, and the repository hygiene scan. GitHub
Actions runs the same portable validation plus smoke artifact generation and
upload for synthetic benchmarks, padded-sparse privacy modes, and the
deterministic N-MNIST-format fixture. Native OpenFHE and TFHE-rs checks remain
local/release gate commands because they require external libraries and heavier
host setup.
See `DEVELOPMENT.md` and `RELEASE.md` before making or tagging release claims.

To check local Markdown links only:

```sh
npm run check:docs
```
To persist a redacted source-hygiene evidence artifact without reading raw
datasets into git, run:

```sh
npm run scan:hygiene -- --artifact
```

To build a compact release-evidence index from the current committed blocker,
hygiene, native-evidence, privacy-mode, reconstruction-risk, real N-MNIST
plaintext baseline, and TFHE-rs real-data blocker artifacts, run:

```sh
npm run release:evidence -- --artifact
```

The release-evidence index is a dashboard artifact only. It does not satisfy the
release gate or upgrade any caveated benchmark, privacy, native-library,
real-data baseline, or security claim.

To run the synthetic gateway reconstruction-risk probes and publish the current
caveated artifact, run:

```sh
npm run reconstruction:risk -- --artifact
```

The reconstruction-risk artifact checks that raw sentinel payloads and active
values are withheld from model-facing fields while keeping public-position
residual risk explicit. It is not a formal privacy proof or attack benchmark.

## Relay Gateway Pattern

The relay gateway is the local trust boundary for the project. It accepts raw or semi-structured local signals, routes raw neural-like intake through a spatial-aware spike sorter, normalizes the sorter output into structured events, applies privacy and safety policy, and exports only approved minimal event representations to downstream encrypted compute, model services, or agents.

The runnable scaffold demonstrates:

- Sensitive raw intake treated as local-only by default.
- A canonical `rawNeuralFrame -> spatialSpikeSorter -> eventWindow` encoder stage designed around FPGA- or edge-friendly integer operations.
- Pre-sorted `sortedNeuralEvent` imports still pass through gateway validation, sanitization, and export policy before normalization.
- Optional cortical region or layer context tags, such as A1 and layers I through VI, are validated locally and exported only as aggregate summaries or encrypted references.
- Normalized event records with provenance, confidence, schema version, and validation status.
- Model-facing events with explicit plaintext, encrypted, aggregated, and withheld fields.
- Recommendation validation that accepts safe local reversible actions and rejects raw device commands.
- Audit and sanitized replay records that do not expose raw signal payloads.

The gateway is simulated and educational in this package. It is not a medical, surveillance, coercive-control, mind-reading, external-control, or production cryptography system.

## Desk Demo

Run the included educational prototype:

```sh
npm run demo
```

Emit the benchmark schema, including dense/raw, unsorted-spike, and spatial-sorted representation comparison plus SNN/encrypted-readiness evaluation:

```sh
npm run benchmark
```

The benchmark also carries the packed-vector plan, the privacy-mode decision
between public active positions, padded sparse batches, and dense encrypted
windows, and a framing guardrail that keeps bio-digital language scoped to
privacy-preserving event intelligence rather than diagnosis or treatment.

Publish a padding ablation for sparse metadata leakage versus overhead:

```sh
npm run benchmark:privacy-modes -- --artifact
```

Run the local-first relay gateway scaffold:

```sh
npm run gateway:demo
```

Print the real OpenFHE BFVrns integration plan:

```sh
npm run benchmark:openfhe
```

Persist an optional OpenFHE adapter comparison artifact:

```sh
npm run benchmark:openfhe -- --artifact
```

Run the real OpenFHE BFVrns C++ demo with the embedded synthetic contract:

```sh
npm run benchmark:openfhe -- --run
```

Print the OpenFHE CKKS approximate real-number comparison lane:

```sh
npm run benchmark:openfhe-ckks
```

Run the real OpenFHE CKKS C++ demo and optionally persist a comparison artifact:

```sh
npm run benchmark:openfhe-ckks -- --run
npm run benchmark:openfhe-ckks -- --run --artifact
```

Print the TFHE-rs integer/Boolean threshold integration plan:

```sh
npm run benchmark:tfhe
```

Run the real TFHE-rs Rust demo and optionally persist a comparison artifact:

```sh
npm run benchmark:tfhe -- --run
npm run benchmark:tfhe -- --run --artifact
```

Record the current TFHE-rs real-data input blocker without overwriting the
latest runnable synthetic TFHE-rs artifact:

```sh
npm run benchmark:tfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
```

Summarize native evidence reproducibility across OpenFHE BFVrns, OpenFHE CKKS,
and TFHE-rs without rerunning benchmarks:

```sh
npm run native:doctor
npm run native:doctor -- --artifact
```

Run a plaintext N-MNIST-compatible baseline against a local extracted dataset:

```sh
npm run baseline:plaintext -- --dataset /path/to/N-MNIST --limit-per-class 10
```

Run the real public UCI EEG Eye State baseline. The raw ARFF is downloaded into
`.cache/` and is not committed; only the derived artifact is published:

```sh
npm run baseline:eeg-eye-state -- --artifact
npm run baseline:plaintext -- --source eeg-eye-state --fetch --artifact
```

Generate OpenFHE-ready single-window input contracts from that EEG baseline and
run BFVrns/CKKS against the derived sparse inputs:

```sh
npm run contract:eeg-openfhe
npm run benchmark:openfhe -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-bfvrns-contract.json --artifact
npm run benchmark:openfhe-ckks -- --run --input benchmark-artifacts/plaintext-baselines/eeg-eye-state/openfhe-input/eeg-eye-state-ckks-contract.json --artifact
```

The committed EEG artifact at
`benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json` uses a
chronological 70/30 split, 8-row by 8-channel sparse latent event windows, and
the same `scores = W x + bias` contract shape `[2, 64]`. It reports 301/561
correct windows, accuracy `0.536542`, and a compression curve for active budgets
of 8, 16, 32, and 64 values per window. This is real-data plaintext evidence,
not encrypted-compute, medical, or generalization evidence.

The committed native OpenFHE real-data artifacts consume one derived EEG sparse
window from the generated input contract. BFVrns uses the fixed-point view and
matches the expected quantized classification; CKKS uses approximate-real values
and reports score drift against plaintext. These artifacts are local
single-window integration evidence, not production cryptography or broad
runtime claims. The native evidence manifest under
`benchmark-artifacts/native-evidence/` records the host/toolchain fingerprint,
latest artifact classification, exact rerun commands, and remaining gaps for
the OpenFHE and TFHE-rs lanes. Its measurement gap index lists the exact
ciphertext-byte and RSS/peak-memory gaps per lane. TFHE-rs now reports a
single end-of-run current RSS sample for the synthetic native run; that remains
host-specific memory evidence, not peak-memory, dataset-scale, side-channel, or
stable performance evidence. The index is a blocker map, not substitute
performance or memory evidence.

The TFHE-rs real-data blocker under
`benchmark-artifacts/comparisons/tfhe-rs-realdata/` records that the current
native TFHE-rs target does not yet accept the EEG-derived OpenFHE input
contract. It preserves the exact attempted command and smallest next step while
leaving `benchmark-artifacts/comparisons/tfhe-rs/latest.json` as the latest
runnable synthetic TFHE-rs evidence.

The real N-MNIST plaintext baseline under
`benchmark-artifacts/plaintext-baselines/nmnist-local/` uses the extracted
public N-MNIST `Train/` and `Test/` directories outside git. The current
sampled artifact evaluates 10 examples per class from each split and reports
100 test examples, accuracy `0.66`, a compression curve, and
`productionClaim: false`; it is plaintext preprocessing/model evidence, not
encrypted-compute or deployment evidence.

Run the deterministic N-MNIST-format smoke fixture and publish a compression
curve artifact:

```sh
npm run baseline:plaintext -- --fixture nmnist-smoke --artifact
```

The prototype demonstrates active-event sparse scoring with toy additive homomorphic encryption over a fixed linear model contract: rows are classes, columns are flattened event features, and the public score equation is `scores = W x + bias`. The benchmark now compares dense/raw windows, unsorted spikes, and spatial-sorted events on that same task so representation cost and metadata leakage stay visible. Each spatial-sorted benchmark entry carries its own crypto inventory, sorted-event privacy boundary, reconstruction-resistance caveat, and explicit metadata-leakage list. The benchmark also emits `spatialClusterReadiness`: spatial-sorted events can feed a future SNN path after count-to-spike-train, neuron-index, timestep, and membrane/synapse adapters; the same representation can feed the current lightweight encrypted linear score path directly. The compute side can use the `public-active-neuron-positions-encrypted-features` mode: active neuron/time positions are public, feature values are encrypted, and raw samples remain local. It is deliberately marked as non-production. A real OpenFHE BFVrns C++ integration target is included under `prototype/openfhe/` for the same exact integer sparse scorer, and a real OpenFHE CKKS target is included under `prototype/openfhe-ckks/` for approximate neural/ML feature scoring with floating-point-style values and explicit score-drift reporting. A real TFHE-rs Rust target is also included under `prototype/tfhe-rs/`; it evaluates the same sparse integer scores with `FheUint16` and adds an encrypted `FheBool` threshold/comparison gate for `anomaly_score > normal_score`. BFV/BGV remains the default packed-vector lane for exact integer linear algebra; CKKS is the comparison lane for approximate real-valued neural/ML features; TFHE-rs is the comparison lane to prefer when the model becomes threshold-heavy, Boolean, decision-tree-like, or LUT-style. SEAL/TenSEAL, Concrete, or an Octra/HFHE experiment remain candidate follow-on lanes.

## Prototype Boundary

The JavaScript prototype is a portable contract harness, not the target runtime for low-level execution. Performance-critical paths should move to native HE libraries, systems code, or hardware-aware edge implementations, with Node kept for demos, artifact generation, schema checks, and orchestration. See `10-native-performance-track.md`.

This repository is CC0. If the project later needs proprietary implementation, keep partner-specific adapters, datasets, trained weights, deployment code, and non-public library integrations in a separate private repository with explicit dependency and license review. Do not import proprietary reverse-engineered code into this public reference package.

## Post-Quantum Direction

NeuroFHE Relay should pair FHE-style encrypted computation with NIST-standard post-quantum cryptography for transport, identity, and artifact integrity:

- ML-KEM / FIPS 203 for key establishment.
- ML-DSA / FIPS 204 for primary digital signatures.
- SLH-DSA / FIPS 205 as a conservative hash-based signature option.

The project should not claim production quantum safety until real libraries, parameter sets, implementation review, and side-channel analysis exist. The near-term standard is to build a crypto inventory and keep every cryptographic role replaceable.

## License

Released under **CC0 1.0 Universal**.

The intent is absolute free use: copy, modify, publish, sell, sublicense, and build on this project for any purpose without asking permission and without attribution.
