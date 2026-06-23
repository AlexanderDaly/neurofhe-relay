# Briefing Sequence

The root `01-` through `12-` Markdown files are the public briefing sequence.
Read them in order when you want the full public briefing path; use the shorter
docs in `docs/` when you need navigation, commands, evidence review, or
maintainer checklists.

This sequence is still research-alpha material. It should not be read as
production cryptography, medical, clinical, surveillance, deployment,
side-channel, identity-protection, or stable-performance evidence.

## Briefing Routes

Use the table before reading the full sequence end to end.

| Reader Need | Start With | Confirm In |
| --- | --- | --- |
| Non-technical first visit | `docs/layperson-quickstart.md` and `index.html` | `docs/faq.md` and `docs/status-roadmap.md` for current caveats. |
| Fast external overview | `01-one-pager.md` and `02-pitch-deck.md` | `README.md`, `docs/faq.md`, and `docs/status-roadmap.md` for current caveats. |
| Architecture or boundary review | `03-technical-architecture.md`, `09-relay-gateway-pattern.md`, and `11-architecture-visuals.md` | `docs/policy-boundary.md` and `docs/architecture-decisions.md` before changing public framing. |
| Evidence or claim diligence | `05-risk-register.md` and `06-evidence-and-sources.md` | `docs/evidence-guide.md`, `docs/evidence-dashboard.md`, and `docs/claim-evidence-ledger.md` before making claims. |
| Native performance planning | `10-native-performance-track.md` and `12-discreet-spike-sorting-proof.md` | `benchmark-artifacts/native-evidence/latest.json` and `docs/release-gate-matrix.md` before treating evidence gaps as closed. |
| Patent or weak-claim gap planning | `07-post-quantum-cryptography-track.md`, `08-encrypted-thoughts-whitepaper.md`, and `12-discreet-spike-sorting-proof.md` | `docs/patent-package-map.md` and `patent/briefing/ENER_weak_claims_evidence_gaps.md` before publication, grant, or conversion work. |

## Recommended Reading Order

| File | Purpose | Best For |
| --- | --- | --- |
| [`01-one-pager.md`](../01-one-pager.md) | Executive one-page brief | Fast project overview |
| [`02-pitch-deck.md`](../02-pitch-deck.md) | 11-slide evidence narrative | Presentation flow and evidence story |
| [`03-technical-architecture.md`](../03-technical-architecture.md) | System architecture and data flow | Boundary and component review |
| [`04-demo-roadmap.md`](../04-demo-roadmap.md) | Research-alpha evidence roadmap | Roadmap discussion |
| [`05-risk-register.md`](../05-risk-register.md) | Technical, market, and execution risks | Diligence and objection handling |
| [`06-evidence-and-sources.md`](../06-evidence-and-sources.md) | Source-backed research notes | Research grounding |
| [`07-post-quantum-cryptography-track.md`](../07-post-quantum-cryptography-track.md) | PQC direction and crypto agility | Cryptographic roadmap review |
| [`08-encrypted-thoughts-whitepaper.md`](../08-encrypted-thoughts-whitepaper.md) | BCI and neural-data privacy whitepaper | Long-form privacy framing |
| [`09-relay-gateway-pattern.md`](../09-relay-gateway-pattern.md) | Local-first relay gateway pattern | Raw-signal boundary and policy review |
| [`10-native-performance-track.md`](../10-native-performance-track.md) | Native-first implementation boundary | Performance and runtime planning |
| [`11-architecture-visuals.md`](../11-architecture-visuals.md) | Mermaid architecture diagrams | Visual review and briefing reuse |
| [`12-discreet-spike-sorting-proof.md`](../12-discreet-spike-sorting-proof.md) | Real-data-derived event sorting proof gate | Evidence gap planning |

## How To Use This Sequence

- Start with `docs/layperson-quickstart.md` and `index.html` for a non-technical
  first visit.
- Use `01-one-pager.md` and `02-pitch-deck.md` for the public story.
- Use `03-technical-architecture.md`, `09-relay-gateway-pattern.md`, and
  `11-architecture-visuals.md` when explaining the system boundary.
- Use `05-risk-register.md`, `06-evidence-and-sources.md`, and
  `docs/evidence-guide.md` before making public claims.
- Use `10-native-performance-track.md`, `docs/command-reference.md`, and
  `docs/maintainer-checklist.md` before implementation or release review.
- Use `12-discreet-spike-sorting-proof.md` and
  `patent/briefing/ENER_weak_claims_evidence_gaps.md` when selecting the next
  evidence gap to close.

Validation checks that every numbered root brief is represented on this page.
