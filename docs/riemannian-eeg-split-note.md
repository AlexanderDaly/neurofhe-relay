# Riemannian EEG Split Note

Research-alpha experimental note. Not medical evidence, not encrypted-compute
accuracy evidence, not a release-gate closer, and not a claim that Riemannian
geometry failed in general. `productionClaim: false`.

This note records the first encoder experiment against the existing UCI EEG Eye
State chronological contract: longer windows, OAS-shrunk covariance, flatten
(and log-Euclidean chart), same nearest-centroid scorer `scores = W x + bias`
that the CKKS lane is bound to.

Hypothesis, as stated before the run:

```text
If the coin flip becomes a classifier, geometry won.
```

**Result.** Geometry did not win. Longer windows did. Flattened covariance
chased raw accuracy by collapsing toward the test majority. The encoder that
actually classified both classes is a 1-second mean of z-scored channels.

## Why This Experiment

The current EEG Eye State plaintext baseline
(`benchmark-artifacts/plaintext-baselines/eeg-eye-state/latest.json`) scores
**0.536542** (301/561) on an 8-sample, 8-channel, top-4-abs-z sparse window
with nearest-centroid linear scoring. That window is 62.5 ms at 128 Hz.

The NeuroFHE contract already splits work as:

```text
on-device encoder  →  vector x  →  encrypted scores = W x + bias
```

A Riemannian encoder is admissible only if it emits a real vector the existing
CKKS scorer can consume. The cheapest candidate is the half-vectorization of a
shrunk spatial covariance, optionally after the log-Euclidean chart

\[
x = \mathrm{vech}(\log C), \qquad
C \in \mathrm{Sym}_{++}(n).
\]

That is the first move. It does not put AIRM geodesic distance inside OpenFHE.

## Protocol

Held fixed:

- dataset: UCI EEG Eye State, 14 980 rows, 14 channels, 128 Hz, CC BY 4.0
  ([Roesler 2013](https://archive.ics.uci.edu/dataset/264/eeg+eye+state));
- chronological split, `trainFraction = 0.7`, identical cut to the committed
  baseline (`splitIndex = floor(14980 * 0.7) = 10486`);
- window label = majority label in the window;
- classifier = nearest centroid, rewritten as `scores = W x + bias` with
  \(W_{c} = 2\mu_c\) and \(b_c = -\|\mu_c\|^2\);
- no random shuffle, no subject ID, no hyperparameter search on test.

Added, in order:

1. longer windows (128 samples = 1 s, 256 samples = 2 s);
2. train-only 1st–99th percentile clip per channel;
3. train-only per-channel z-score, then per-window mean centering;
4. sample covariance plus Oracle Approximating Shrinkage (Chen / sklearn OAS);
5. flatten \(\mathrm{vech}(C)\) and \(\mathrm{vech}(\log C)\);
6. train-only z-score of the flattened coordinates, then the same centroid;
7. optional FFT bandpass (8–12 Hz alpha, 8–30 Hz) before the covariance.

Controls: the committed 8-sample sparse encoder; window-mean of z-scored
channels; diagonal of \(C\) only; occipital alpha power on O1/O2; the same
sparse encoder stretched to 1 s; covariance with no clip.

Repro:

```sh
node prototype/eeg-spd-experiment.mjs --fetch
```

Raw ARFF stays in `.cache/` and is not committed.

## The Split Is The Story

| Split | n | eye-open | eye-closed | majority |
| --- | ---: | ---: | ---: | ---: |
| Train rows | 10 486 | 4 922 | 5 564 | closed 53.1% |
| Test rows | 4 494 | 3 335 | 1 159 | open 74.2% |
| Test windows, 62.5 ms | 561 | 418 | 143 | open 74.5% |
| Test windows, 1 s, stride 32 | 137 | 109 | 28 | open 79.6% |

Train and test do not share a class prior. A constant “open” classifier scores
~80% on 1-second test windows and 0.50 balanced accuracy. A train-prior
classifier (always closed) fails on test. Features have to track the signal.

This is also why 0.536542 is not a coin flip on class-conditional terms. The
committed 8-sample encoder already recovers closed-eye windows (recall 0.755)
and fails on open-eye windows (recall 0.462). Balanced accuracy is 0.608.

## Results

Balanced accuracy is \(\tfrac12(\mathrm{recall}_{\mathrm{closed}} + \mathrm{recall}_{\mathrm{open}})\).
That is the right “did it become a classifier” number under label shift. Raw
accuracy rewards predicting the test majority.

| Encoder | Window | Band | Acc | Balanced | Rec closed | Rec open | n | dim |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| sparse-z (current contract) | 8 / 8 | — | 0.537 | **0.608** | 0.755 | 0.462 | 561 | 64 |
| mean-z | 128 / 32 | — | 0.642 | **0.682** | 0.750 | 0.615 | 137 | 8 |
| vech(OAS \(C\)) | 128 / 32 | 8–30 Hz | **0.715** | 0.516 | 0.179 | 0.853 | 137 | 36 |
| vech(\(\log C\)) | 128 / 32 | 8–30 Hz | 0.715 | 0.516 | 0.179 | 0.853 | 137 | 36 |
| vech(OAS \(C\)) | 128 / 32 | 8–12 Hz | 0.650 | 0.501 | 0.250 | 0.752 | 137 | 36 |
| log alpha power O1, O2 | 128 / 32 | 8–12 Hz | 0.438 | 0.328 | 0.143 | 0.514 | 137 | 2 |
| sparse-z stretched | 128 / 128 | — | 0.600 | 0.482 | 0.286 | 0.679 | 35 | 1024 |
| vech(\(C\)), 14 ch, no clip | 128 / 128 | — | 0.229 | 0.464 | 0.857 | 0.071 | 35 | 105 |
| test majority (open) | 128 / 32 | — | 0.796 | 0.500 | 0 | 1 | 137 | — |

Confusion for the three numbers that matter:

Current 8-sample sparse-z, 561 windows:

```text
              pred closed   pred open
true closed        108          35
true open          225         193
```

1-second mean-z, stride 32, 137 windows:

```text
              pred closed   pred open
true closed         21           7
true open           42          67
```

8–30 Hz vech(OAS \(C\)), same windows:

```text
              pred closed   pred open
true closed          5          23
true open           16          93
```

Log-Euclidean \(\mathrm{vech}(\log C)\) tied Euclidean \(\mathrm{vech}(C)\) on
the 8–30 Hz 1-second condition (both 98/137). The chart added no extra
discrimination on this split.

OAS shrinkage on the accuracy winner was light (\(\hat\rho\) mean 0.058, range
0.036–0.082). The covariance was not being crushed to a scaled identity.

## Interpretation

**Longer windows won.** Eight samples is 62.5 ms. A 1-second mean of z-scored
channels is the first encoder that keeps closed-eye recall (~0.75) while
lifting open-eye recall (0.46 → 0.62). Balanced accuracy 0.608 → 0.682. Same
scorer, same split, eight dense coordinates, no manifold.

**Flattened covariance won the wrong metric.** 0.537 → 0.715 looks like the
bet paid. Closed-eye recall is 0.179. The SPD flatten learned to say “open.”
Balanced accuracy 0.516 is a coin flip. Log-Euclidean did the same thing.

**The textbook feature does not transfer.** Occipital alpha power on O1/O2 is
the classical eye-closure marker. On this chronological cut it scores balanced
0.328. If \(\log \mathrm{Var}_{\alpha}(\mathrm{O1},\mathrm{O2})\) itself has
moved between train and test, class-conditional clouds on \(\mathrm{Sym}_{++}(n)\)
have moved with them. MDM, AIRM, and log-Euclidean then compare a shifted test
cloud to the wrong Fréchet mean.

**Off-diagonals are not inert, just not stable.** Diagonal-only variance lost
to the full vech on several 8-channel conditions. Spatial structure is present.
It is not aligned across the cut.

**Outliers are lethal.** Unclipped 14-channel covariance falls to 0.229. Channel
maxima in this ARFF reach \(10^5\)–\(10^6\) against a median near 4300. Train
percentile clip is mandatory before any SPD estimator.

**Fourteen channels were worse than eight.** 105-dimensional \(\mathrm{vech}\)
on ~80–160 training windows overfits a drifting cloud. Montage expansion is
not free under this n.

**Non-overlapping 1-second and 2-second windows are underpowered.** 35 and 17
test windows. Rankings among those rows should not be over-read. The stride-32
1-second table (n = 137) is the one that supports a claim.

## What This Does Not Prove

- It does not prove Riemannian BCI is useless. Barachant MDM and pyRiemann
  remain the right tools on session-aware motor-imagery pipelines with
  bandpass, shrinkage, and recentering. This dataset plus this split is not
  that pipeline.
- It does not prove the CKKS scorer is the bottleneck. The scorer never
  changed. The encoder did.
- It does not prove 1-second means are a production EEG feature. Single
  subject, one recording, overlapping windows, no bandpass on the winning
  mean-z condition, no clinical intended use.
- It does not close the discreet-spike-sorting proof in
  `12-discreet-spike-sorting-proof.md`. EEG-derived covariance is still not
  neural spike sorting.
- Native OpenFHE was not rerun. The CKKS EEG lane is already bound to
  `scores = W x + bias` with committed max absolute score error ~\(10^{-11}\)
  on one sparse window. This experiment emits the same circuit on a dense
  36-vector. That is a contract handoff, not a new native measurement.

## CKKS And Privacy

The accuracy-winning covariance chart is a dense \(x \in \mathbb{R}^{36}\) with
every coordinate treated as an active event. There are no public spike
positions. That is the one covariance result that still matters for ENER:

- current contract: 32 public (time, channel) positions plus encrypted values;
- covariance chart: 36 encrypted coordinates, empty position descriptor.

The first-order mean-z winner is denser still in the useful sense: 8 encrypted
coordinates, no positions, and it is the actual classifier. If the next
encoder work is “feed CKKS a better \(x\),” start there, not with AIRM.

## Next Geometric Move

Do not put a fancier metric on unaligned \(C\). The failure mode is transport.

The standard Riemannian BCI fix is recentering: replace \(C\) with

\[
\tilde C = \bar C^{-1/2}\, C\, \bar C^{-1/2}
\]

where \(\bar C\) is a Fréchet mean computed only from the past (train, plus a
causal running mean on test). That is parallel transport of the SPD cloud to a
common origin before the chart. It is still an on-device encoder. The CKKS
contract stays `scores = W x + bias`.

Until that experiment is run, the honest public sentence is:

```text
On the committed chronological EEG Eye State split, a 1-second Euclidean
channel mean beat the 8-sample sparse encoder as a classifier. Flattened
shrunk covariance raised raw accuracy by collapsing toward the test
majority. Log-Euclidean did not add a class-conditional signal. Geometry
is not yet justified as the NeuroFHE EEG encoder.
```

## Claim Boundary

| Allowed | Not allowed |
| --- | --- |
| Feature-contract comparison on one public EEG recording | Medical, diagnostic, or BCI performance claims |
| “Longer windows helped; SPD flatten did not classify both classes” | “Riemannian geometry does not work for NeuroFHE” |
| Dense covariance chart removes public active positions | Reconstruction-resistance or anonymity proof |
| Same scorer as the CKKS lane | New native FHE accuracy or latency evidence |
| `productionClaim: false` | Release-gate credit |

Sources for the geometric background, not for these numbers: Barachant et al.
on MDM; Arsigny et al. on the log-Euclidean metric; Chen, Wiesel, Eldar, Hero
on OAS; the 2025 SPD-learning survey for neuroimaging; Ye et al. 2025 on grid
cell information geometry (torus, not used here).
