# Patent Package Map

This map helps readers navigate the ENER patent and briefing materials without
turning them into unsupported technical, legal, medical, or production claims.
The materials are drafting and review aids, not legal advice, patentability
opinions, freedom-to-operate opinions, regulatory clearance, or production
cryptography evidence.

Use `docs/evidence-guide.md`, `docs/maintainer-checklist.md`, and
`patent/briefing/ENER_weak_claims_evidence_gaps.md` before turning any patent
or briefing language into public claims.

## Patent Review Routes

Use this table before opening the full source list.

| Review Need | Start With | Confirm Before Use |
| --- | --- | --- |
| Provisional drafting review | `patent/ENER_provisional_specification.md`, `patent/ENER_claim_seed_set.md`, and `patent/ENER_drawings_descriptions.md` | `patent/ENER_submission_checklist.md` and counsel review before filing or relying on legal effect. |
| Counsel or IP-risk review | `patent/ENER_prior_art_search_plan.md`, `patent/ENER_fto_extraction_summary.md`, and `patent/briefing/ENER_attorney_ip_review.md` | Treat all FTO and patentability language as review input, not an opinion or clearance. |
| Public, investor, or policy briefing | `patent/briefing/ENER_investor_safe_brief.md`, `patent/briefing/ENER_executive_summary.md`, and `patent/briefing/ENER_policy_whitepaper.md` | Check `docs/policy-boundary.md`, `docs/evidence-guide.md`, and `docs/faq.md` so claims stay caveated. |
| Evidence-gap prioritization | `patent/briefing/ENER_weak_claims_evidence_gaps.md` | Confirm current artifacts in `benchmark-artifacts/README.md` and `docs/evidence-dashboard.md` before marking a gap narrowed. |
| Diagram or figure reuse | `patent/briefing/diagrams/`, `patent/figures/`, and `patent/ENER_figures/` | Keep duplicate Mermaid layouts synchronized until one figure source tree is intentionally retired. |

## Provisional Drafting Materials

- [`patent/ENER_provisional_specification.md`](../patent/ENER_provisional_specification.md)
  - provisional specification source.
- [`patent/ENER_claim_seed_set.md`](../patent/ENER_claim_seed_set.md) - claim
  seed set and invention-positioning notes.
- [`patent/ENER_drawings_descriptions.md`](../patent/ENER_drawings_descriptions.md)
  - drawing descriptions.
- [`patent/ENER_provisional_cover_sheet.md`](../patent/ENER_provisional_cover_sheet.md)
  - provisional cover sheet source.
- [`patent/ENER_submission_checklist.md`](../patent/ENER_submission_checklist.md)
  - filing package checklist.
- [`patent/ENER_prior_art_search_plan.md`](../patent/ENER_prior_art_search_plan.md)
  - prior-art search plan.
- [`patent/ENER_fto_extraction_summary.md`](../patent/ENER_fto_extraction_summary.md)
  - freedom-to-operate extraction summary for counsel review.

## Briefing Package

- [`patent/briefing/README.md`](../patent/briefing/README.md) - briefing package
  index and framing principle.
- [`patent/briefing/ENER_policy_whitepaper.md`](../patent/briefing/ENER_policy_whitepaper.md)
  - master policy and technical publication draft.
- [`patent/briefing/ENER_executive_summary.md`](../patent/briefing/ENER_executive_summary.md)
  - short executive summary.
- [`patent/briefing/ENER_congressional_briefing_memo.md`](../patent/briefing/ENER_congressional_briefing_memo.md)
  - policy memo format.
- [`patent/briefing/ENER_attorney_ip_review.md`](../patent/briefing/ENER_attorney_ip_review.md)
  - IP review and claim-family notes.
- [`patent/briefing/ENER_investor_safe_brief.md`](../patent/briefing/ENER_investor_safe_brief.md)
  - conservative business-facing brief.
- [`patent/briefing/ENER_publication_formatting.md`](../patent/briefing/ENER_publication_formatting.md)
  - publication formatting guidance.
- [`patent/briefing/ENER_legal_review_flags.md`](../patent/briefing/ENER_legal_review_flags.md)
  - legal and communications review flags.
- [`patent/briefing/ENER_visual_recommendations.md`](../patent/briefing/ENER_visual_recommendations.md)
  - recommended visual treatments.
- [`patent/briefing/ENER_reference_sources.md`](../patent/briefing/ENER_reference_sources.md)
  - reference source list.
- [`patent/briefing/ENER_weak_claims_evidence_gaps.md`](../patent/briefing/ENER_weak_claims_evidence_gaps.md)
  - weak claims and evidence gaps to prioritize.

## Diagram Sources

Two Mermaid source directories are retained today. Keep both in sync until the
duplicate layout is intentionally retired.

- [`patent/briefing/diagrams/architecture_overview.mmd`](../patent/briefing/diagrams/architecture_overview.mmd)
- [`patent/briefing/diagrams/threat_model.mmd`](../patent/briefing/diagrams/threat_model.mmd)
- [`patent/briefing/diagrams/trust_boundary.mmd`](../patent/briefing/diagrams/trust_boundary.mmd)
- [`patent/figures/fig1_pipeline.mmd`](../patent/figures/fig1_pipeline.mmd)
- [`patent/figures/fig2_split_device.mmd`](../patent/figures/fig2_split_device.mmd)
- [`patent/figures/fig3_adaptive_compression.mmd`](../patent/figures/fig3_adaptive_compression.mmd)
- [`patent/figures/fig4_reconstruction_resistance.mmd`](../patent/figures/fig4_reconstruction_resistance.mmd)
- [`patent/figures/fig5_encrypted_classifier.mmd`](../patent/figures/fig5_encrypted_classifier.mmd)
- [`patent/figures/fig6_sorted_event_bfvrns.mmd`](../patent/figures/fig6_sorted_event_bfvrns.mmd)
- [`patent/ENER_figures/fig1_pipeline.mmd`](../patent/ENER_figures/fig1_pipeline.mmd)
- [`patent/ENER_figures/fig2_split_device.mmd`](../patent/ENER_figures/fig2_split_device.mmd)
- [`patent/ENER_figures/fig3_adaptive_compression.mmd`](../patent/ENER_figures/fig3_adaptive_compression.mmd)
- [`patent/ENER_figures/fig4_reconstruction_resistance.mmd`](../patent/ENER_figures/fig4_reconstruction_resistance.mmd)
- [`patent/ENER_figures/fig5_encrypted_classifier.mmd`](../patent/ENER_figures/fig5_encrypted_classifier.mmd)
- [`patent/ENER_figures/fig6_sorted_event_bfvrns.mmd`](../patent/ENER_figures/fig6_sorted_event_bfvrns.mmd)

## Use Discipline

- Do not present these materials as legal advice or final counsel review.
- Keep public language aligned with "privacy-preserving neural computation
  infrastructure."
- Avoid generalized cognition-decoding, surveillance, medical-efficacy, or
  production-cryptography claims.
- When a claim depends on measurement, cite the exact evidence artifact or keep
  it in the evidence-gap list.

Validation checks that every `patent/**/*.md` and `patent/**/*.mmd` source is
represented on this page.
