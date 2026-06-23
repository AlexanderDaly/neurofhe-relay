# What The Demo Shows

This page explains the JSON printed by `npm run demo` in plain English. It is
for readers who ran the command and want to know what the output means without
reading the scaffold code.

The demo is an **educational research toy**, not production homomorphic
encryption.

## Before You Run Anything

You need Node.js 20 or newer. The command is:

```sh
npm run demo
```

If you only want the story without running code, read `docs/layperson-quickstart.md`
or open `index.html` in a browser.

## What The Demo Does (Plain English)

The demo takes a **small synthetic 8×8 activity grid** (like a tiny heatmap of
events over time and space), counts where activity happened, encrypts the active
values with **toy arithmetic** (not real FHE), scores two classes ("normal" and
"anomaly"), and prints the result.

It proves the **shape of the workflow**: validate events → encrypt sensitive
values → score → decrypt final class labels. It does **not** prove production
security, real-world accuracy, or medical utility.

## Top-Level Fields

| Field | Plain English | Caveat |
| --- | --- | --- |
| `project` | Project name | — |
| `demo` | Which toy demo ran | Additive toy cipher only |
| `caveat` | Honest limitation banner | Read this before quoting results |
| `privacyBoundary` | What stays local vs what is exported vs encrypted | Metadata descriptor, not a privacy proof |
| `boundaryDomain` | Framing: bio-digital event intelligence | Not medical diagnosis |
| `eventWindow` | The synthetic activity grid and sparsity stats | Synthetic data only |
| `encryptedPreview` | Sample of ciphertext-shaped values | Toy encryption, not OpenFHE |
| `linearModel` | Public weights used for scoring | Weights are public in this contract |
| `publicModel` | Which parts of the model are visible | Bias and structure are public here |
| `operationCounts` | How many multiplies sparse vs dense paths need | Illustrates sparsity savings |
| `denseBaseline` | Cost if every grid cell were encrypted | Comparison anchor |
| `cryptoInventory` | Which crypto roles this run represents | Design targets, not deployed PQC |
| `decryptedScores` | Final scores after decrypt | Toy path only |
| `classification` | Winning class label | `anomaly` on the default synthetic window |
| `nextStep` | What a builder would do next | Points toward real HE libraries |

## Scores On The Default Window

On the bundled synthetic window you should see something like:

- **normal** score: 9
- **anomaly** score: 51
- **classification**: `anomaly`

The demo uses a fixed public weight matrix. The point is that plaintext and
encrypted paths **agree** on the same scores and class — not that the classifier
is clinically or commercially meaningful.

## Sparse vs Dense (Why It Matters)

| Path | Plain English |
| --- | --- |
| Sparse | Only active locations are multiplied — cheaper, but active positions may be visible metadata. |
| Dense | Every grid cell is encrypted — more private structure, more compute. |

The benchmark family compares these tradeoffs explicitly. See
`docs/glossary.md` (Plain English Reference) for `padded sparse` and
`dense encrypted window`.

## Gateway Demo (Separate Command)

`npm run gateway:demo` is a different entry point. It shows the **local bouncer**
pattern: raw intake stays local, policy runs, and only a minimal model-facing
event is exported. Run it when you want to see trust-boundary behavior rather
than encrypted scoring.

## What This Does Not Prove

- Production homomorphic encryption performance or security.
- That outsiders cannot infer anything from exported metadata.
- Real neural, EEG, or clinical performance.
- That the repository is ready to tag as a product release.

## Read Next

- Layperson overview: `docs/layperson-quickstart.md`
- Claim boundaries: `docs/faq.md`
- Technical commands: `docs/command-reference.md`
- Evidence posture: `docs/evidence-dashboard.md`