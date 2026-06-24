# Layperson Quickstart

Read this page if you want the idea in plain English and do not need to run
commands, read JSON artifacts, or review cryptography details first.

This page is not release approval, production cryptography evidence, medical
guidance, or a privacy proof.

## The One-Sentence Version

NeuroFHE Relay is a public research package that asks: **what if sensitive
sensor data stayed on your device, only compact encrypted summaries crossed the
network, and nobody could run AI on the raw signal?**

Everything in the repository is evidence for or against that idea — honestly
labeled as research, not a finished product.

## The Bouncer Analogy

Think of a nightclub bouncer for your data:

1. **Inside the club (your device)** — raw signals from sensors, wearables,
   apps, or logs. Only trusted local software may see this.
2. **The bouncer (local relay gateway)** — checks what is allowed to leave,
   strips risky details, and applies privacy rules.
3. **Outside the club (encrypted compute)** — external services see locked
   summaries, not the raw stream.
4. **You get the result** — only the authorized party decrypts the final answer
   (for example: "anomaly" or "normal"), not the underlying signal.

The project is **not** claiming to read minds, diagnose illness, or ship
production-grade encryption today.

## What Problem This Targets

Edge AI is moving into intimate places: wearables, robotics, smart buildings,
industrial monitoring. The data is useful because it is personal, continuous,
and context-rich. Current choices are weak:

- Send raw data to the cloud and accept exposure.
- Keep everything local and lose shared intelligence.
- Encrypt for storage and transport, but decrypt during inference anyway.

NeuroFHE Relay explores a hybrid path: **make the data sparse and small first,
then encrypt the compact part.**

## What Exists Today (Honest Status)

| Topic | Plain answer |
| --- | --- |
| Is this a product you can buy? | No. Research-alpha package only. |
| Is this medical software? | No. Not for diagnosis or treatment. |
| Is this mind-reading tech? | No. "Encrypted thoughts" here means *selected event features stay encrypted*, not literal thought extraction. |
| Has anyone proved full privacy? | No. Some tests are synthetic proxies, not formal privacy proofs. |
| Can I use the code freely? | Yes. CC0 — copy, modify, and build on it. That does not make derived deployments safe without your own review. |
| Is a release tagged yet? | No. Target is `v0.1.0-research-alpha`; `releaseGateSatisfied: false`. |

For a traffic-light summary of committed evidence, see `docs/evidence-dashboard.md`
(Plain English Summary section). For technical detail, see `docs/status-roadmap.md`.

## What Is Actually Demonstrated

The repository includes runnable research demos and saved benchmark artifacts:

- A **toy encrypted scorer** that classifies a tiny synthetic event window.
- A **gateway demo** that shows raw signals staying local while only approved
  summaries are exported.
- **Plaintext baselines** on public datasets (for example EEG and N-MNIST-style
  events) to validate preprocessing before encryption claims.
- **Native cryptography lanes** (OpenFHE, TFHE-rs) where dependencies exist —
  local evidence only, not production security.

See `docs/what-the-demo-shows.md` if someone runs `npm run demo` and receives
JSON they do not understand.

## What This Is Not

- Not production cryptography or a certified secure product.
- Not FDA-ready, clinical, or diagnostic software.
- Not a claim that neuromorphic chips directly run full homomorphic encryption.
- Not a guarantee that metadata cannot leak (timing, sparsity, and slot counts
  can still reveal structure depending on the mode).

## Read Next (Still Plain English)

| Question | Where |
| --- | --- |
| Visual walkthrough | Open `index.html` in a browser (briefing deck) |
| Short FAQ | `docs/faq.md` |
| Ethics and boundaries | `docs/policy-boundary.md` and `PUBLIC_DOMAIN_NOTICE.md` |
| One-page executive brief | `01-one-pager.md` |

## When You Need Technical Depth

| Role | Start with |
| --- | --- |
| Diligence or grant review | `docs/reviewer-quickstart.md` |
| Running code locally | `docs/developer-quickstart.md` |
| Evidence and release gates | `docs/evidence-dashboard.md` |

You do not need to open `benchmark-artifacts/` JSON files to understand the
project thesis. Those files exist for reviewers who need reproducible evidence.

## How To Ask Questions

Conceptual questions do not need a GitHub issue. Read `docs/faq.md` first.

Use `SUPPORT.md` only when you have a reproducible bug, evidence gap, or
repository problem — not when you are only trying to understand the idea.
