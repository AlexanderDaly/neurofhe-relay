# 12 - Discreet Spike Sorting Proof

## Purpose

Quiet Allocations stays shelved until NeuroFHE Relay can prove a narrower
foundation: real-data-derived event sorting with a defensible privacy boundary.

This document defines that proof target. It is not a claim that the repository
already performs secure neural spike sorting. It is the acceptance gate for
earning that claim later.

## Current Position

The prototype already has useful pieces:

- a simulated spatial spike sorter and relay gateway boundary;
- a real public UCI EEG Eye State plaintext baseline;
- generated OpenFHE input contracts for one EEG-derived sparse window;
- OpenFHE BFVrns and CKKS native runs over derived sparse inputs;
- a TFHE-rs native threshold lane over the synthetic sparse event contract;
- metadata padding/leakage proxy artifacts;
- repository hygiene and release evidence artifacts.

Those pieces prove the system shape. They do not yet prove discreet real-data
spike sorting under adversarial review.

## Definition

"Discreet spike sorting with real data" means all of the following:

1. **Rights-clean real-data source.** The source must be public, licensed, or
   locally authorized. Raw source data stays outside git. If the source is a
   proxy rather than true neural spike data, the artifact must say so.
2. **Deterministic sorting contract.** The sorter emits a stable event schema
   with source provenance, window parameters, active-event counts, and exact
   rerun commands.
3. **Raw-signal boundary.** Committed artifacts contain derived event features,
   summaries, hashes, and caveats, not raw signal rows or recoverable payloads.
4. **Metadata accounting.** Artifacts identify what still leaks: active-event
   count, timing bucket, channel or position policy, window size, model shape,
   and any public cover traffic policy.
5. **Attack probes.** The proof includes reconstruction, linkage, and metadata
   probes that fail closed or publish structured blocker artifacts.
6. **Encrypted handoff.** At least one native encrypted lane consumes the
   derived event representation, or the repo publishes a structured blocker
   explaining why the handoff is not yet credible.
7. **Claim boundary.** Every artifact keeps `productionClaim: false` until the
   implementation has stronger review, repeated measurements, and a defined
   threat model.

## Acceptance Gate

The first proof branch should not pass merely because tests are green. It
passes only when it publishes a coherent evidence bundle:

- a `neurofhe.discreetSpikeSortingProof.v1` artifact under
  `benchmark-artifacts/spike-sorting/`;
- a source description distinguishing true neural spikes, EEG-derived features,
  event-camera neuromorphic data, or another proxy;
- a deterministic sorter command with generated-at and artifact-id controls;
- raw-data exclusion verified by the repository hygiene scan;
- metadata leakage fields that are caveated as proxies unless formally proven;
- at least one reconstruction or linkage probe result;
- native OpenFHE or TFHE-rs handoff evidence, or a blocker artifact;
- `npm run validate`, `git diff --check`, and JSON artifact guards passing.

The evidence bundle can remain research-alpha. It must not silently upgrade a
proxy into brain-machine security evidence.

## First Implementation Slices

1. Define the `neurofhe.discreetSpikeSortingProof.v1` JSON shape and a publisher
   that indexes source, sorter parameters, raw-boundary checks, leakage fields,
   attack probes, and encrypted-handoff status.
2. Reuse the existing EEG Eye State path for the first real signal-derived proof
   while labeling it as EEG-derived features, not true neural spike sorting.
3. Add an event-native path, such as the existing N-MNIST fixture/blocker lane,
   to keep the neuromorphic event parser and compression story visible.
4. Add one small reconstruction or linkage probe against the derived event
   artifact. If the probe is too weak, publish that as a blocker instead of
   dressing it up as a privacy proof.
5. Refresh native evidence and release evidence so reviewers see whether the
   proof affects release readiness.

## Quiet Allocations Shelf Rule

Quiet Allocations remains a north-star application. It should not be presented
as a shareable refuge, collaborative world, or protected cognitive environment
until NeuroFHE Relay has a defensible private event-handling foundation.

The unlock condition is simple:

```text
No shared Quiet Allocations until real-data discreet sorting has evidence,
attack probes, native encrypted handoff, and explicit remaining caveats.
```
