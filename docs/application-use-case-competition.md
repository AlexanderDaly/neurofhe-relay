# Application Use Case: Private-Data Model Competition

This page answers a recurring application question: can NeuroFHE Relay serve as
an encrypted-scoring backend for a model competition where a private labeled
dataset must stay hidden while participants train on public data?

**Boundary:** research-alpha guidance only. `productionClaim: false`. This is not
deployment advice, medical evidence, or a privacy proof.

## Scenario

A typical request looks like this:

- A **private labeled dataset** (for example, a few hundred receipts) is held
  by the organizer and must remain the final test set.
- A **public labeled dataset** is available for training and validation.
- Participants write and train neuromorphic inference models (for example on
  SpiNNaker or BrainScaleS) and compete on performance without seeing the
  private set.
- The organizer wants **FHE-backed inference** on the private test set so the
  compute service never sees plaintext features.

## Short Answer

Use NeuroFHE Relay as a **research scaffold** for a narrowly defined
encrypted-scoring proof of concept. Do **not** use it as a drop-in competition
backend today.

If the organizer already holds the private data and can run evaluation on an
isolated machine, **conventional sequestered evaluation** is simpler and more
mature: keep the data local, run validated submissions in a network-disabled
sandbox, and disclose only aggregate scores. FHE becomes valuable when
computation must be delegated to a party the data owner does not trust, or when
policy requires the selected feature representation to remain encrypted during
that computation.

## A. SpiNNaker / BrainScaleS Compatibility

**Not directly at present.** The repository does not contain a SpiNNaker,
BrainScaleS, PyNN, sPyNNaker, hxtorch, or [NIR](https://github.com/neuromorphs/NIR)
adapter.

The current architecture keeps the neuromorphic stage separate from the FHE
stage:

1. A neuromorphic system produces a normalized event or feature vector.
2. OpenFHE or TFHE-rs evaluates a small circuit on a conventional host.

The executable model contract is a fixed-shape sparse linear readout:

```text
scores = W x + bias
```

Model weights and bias are **public** in that contract. A thin adapter could
translate spike counts or another fixed-dimensional output from SpiNNaker or
BrainScaleS into the repository JSON input contract, but that integrates only the
boundary. It does not make arbitrary spiking neural networks compatible, and it
does not run FHE on neuromorphic hardware itself.

For a portable competition format, investigate a common PyNN subset or NIR, then
validate every supported operation on each backend. Device-specific neuron
dynamics, timing, quantization, calibration, and analogue variation can still
prevent exact portability.

## B.0. Can Participants Reverse-Engineer the Private Dataset?

**Do not claim that this repository prevents that today.**

The portable JavaScript demo uses toy arithmetic. The native OpenFHE and TFHE-rs
lanes are useful real-library integration experiments, but they are not yet a
separated, audited client/server evaluation service. As written, the native
runner receives a plaintext input contract, creates keys locally, encrypts,
evaluates, decrypts, and reports results. That process must be split into
organizer/keyholder and untrusted-compute roles before it can protect a test set
from the evaluator.

In a correctly designed FHE deployment, the intended guarantee is that the compute
service cannot recover plaintext values from ciphertext alone. That is only one
part of the threat model:

| Leakage channel | Why it matters |
| --- | --- |
| Sparse metadata | Current sparse mode exposes active feature positions and the exact active-event count. For receipts, those positions could reveal OCR vocabulary, layout, or nonzero-pixel information even when values are encrypted. |
| Authorized outputs | FHE does not prevent leakage through decrypted results. Per-receipt predictions, logits, confusion matrices, precise scores, or repeated adaptive submissions can reveal information about a small holdout set. |
| Malicious submissions | A malicious model can encode properties of hidden inputs into its outputs. Arbitrary participant code can also exfiltrate through files, logs, networking, timing, crashes, or resource use if it runs near plaintext data or keys. |
| Public model contract | The current contract protects input values, not participant model IP; `W` and `bias` are public. |

Mitigations to consider:

- Accept a tightly validated declarative model or circuit rather than arbitrary
  binaries.
- Keep the secret key solely with the organizer.
- Use fixed-size padded or dense batches where sparse indices are sensitive.
- Return only a coarse aggregate metric.
- Cap submissions and keep a separate, one-shot final holdout.

See `prototype/reconstruction-risk.mjs` and `docs/claim-evidence-ledger.md` for
how the repository keeps residual leakage explicit without privacy-proof claims.

## B.1. What Changes with Post-Quantum Cryptography?

Post-quantum protection does **not** fix the leakage channels above.

The repository ML-KEM / ML-DSA / SLH-DSA material is currently a design target
for transport, identity, and artifact integrity. The current OpenFHE CKKS example
is configured for `HEStd_128_classic`; it is not evidence of a reviewed
post-quantum deployment. Lattice-based FHE can be parameterized against known
quantum attacks, but that requires an explicit scheme, parameter set, security
target, implementation review, and side-channel analysis.

Even with that work complete, post-quantum cryptography addresses cryptanalysis
of the encryption and surrounding protocol. It does not prevent sparse-metadata
leakage, malicious submissions, adaptive leaderboard probing, endpoint compromise,
or information deliberately released in decrypted results.

## C. Neuromorphic-to-Non-Neuromorphic Conversion

The repository does **not** perform general SNN-to-ANN conversion.

A neuromorphic model could export fixed-dimensional spike features and a
compatible linear readout, or a separate conventional surrogate could be
distilled on the public data. Neither approach guarantees equivalence.
Recurrent connections, stateful neuron dynamics, temporal codes, plasticity, and
hardware calibration are not represented by the current `W x + bias` contract.

If exact model behavior matters, run the original model in a trusted evaluator or
define a restricted cross-platform model representation and test
numerical/functional agreement. Treat export or distillation into the current
linear contract as an **adaptation**, not automatic conversion.

## D. Recommendation Summary

| Question | Answer |
| --- | --- |
| Use as encrypted-scoring research scaffold? | **Yes**, for a small experiment over a fixed receipt-feature representation. |
| Use as out-of-the-box SpiNNaker/BrainScaleS evaluator? | **No**. |
| Use as production privacy system? | **No**. |

## D.1. Practical Path Forward

1. **Freeze the task and representation.** Publish the training/development data,
   labels, metric, and deterministic reference preprocessor. Keep an untouched
   final holdout. With only a few hundred private examples, repeated feedback can
   overfit the test set quickly.

2. **Build the evaluator in plaintext first.** Establish reproducible predictions
   across the target backends before adding cryptography. Treat hardware
   latency/energy and private-set accuracy as separate tracks, because two
   neuromorphic systems may not execute a nominally identical model identically.

3. **Define a strict submission contract.** Specify input shape, numeric ranges,
   quantization, classes, permitted operations, output shape, and maximum circuit
   depth. Prefer a data-only model artifact that the organizer validates and
   compiles. If participant code is unavoidable, use a no-network sandbox with
   read-only inputs, no keys, strict resource limits, and controlled outputs.

4. **Keep receipt preprocessing local.** OCR, normalization, and feature
   extraction should remain inside the organizer trusted boundary. Encrypt a
   fixed-size feature vector rather than raw receipt images or an unrestricted
   OCR pipeline. BFV/BGV is the natural first experiment for bounded
   integer/count features; CKKS is appropriate only when approximate real-valued
   features are necessary and score drift is measured.

5. **Separate the roles.** The organizer generates and retains the secret key,
   preprocesses and encrypts the private features, and sends only ciphertexts,
   public/evaluation keys, and a validated public model to the compute service.
   The service returns encrypted scores. The organizer decrypts and computes the
   metric locally, then releases only rounded aggregate feedback — never
   per-receipt outputs.

6. **Treat the leaderboard as part of the security design.** Limit submissions,
   delay or batch feedback, hide example ordering and identifiers, avoid detailed
   error reports, and reserve a locked final set. FHE protects ciphertext contents
   from the compute service; it does not make an adaptive leaderboard safe.

## Smallest Useful Experiment

One fixed receipt-feature vector and one quantized linear classifier:

1. Run the complete flow in plaintext.
2. Adapt a small hidden batch to `prototype/openfhe/openfhe_linear_demo.cpp`.
3. Require plaintext/encrypted prediction parity.
4. Record latency, peak memory, and ciphertext size while returning only one
   aggregate metric.

If that narrow slice is not practical or does not improve the actual threat
model, stop before attempting general SNN or hardware integration.

## Related Surfaces

- `docs/faq.md` — claim-safety map and production-cryptography boundary.
- `docs/developer-quickstart.md` — first local validation commands.
- `docs/dependency-matrix.md` — native FHE lane prerequisites.
- `09-relay-gateway-pattern.md` — gateway boundary and local preprocessing policy.
- `prototype/openfhe/` and `prototype/tfhe-rs/` — native encrypted-scoring lanes.

## Origin

This guide consolidates maintainer guidance first written in
[issue #31](https://github.com/AlexanderDaly/neurofhe-relay/issues/31).
