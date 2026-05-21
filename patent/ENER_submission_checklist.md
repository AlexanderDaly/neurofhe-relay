# ENER Provisional Submission and Enablement Checklist

Title: Encrypted Neural Embedding Relay for Privacy-Preserving Neuroinference

Current USPTO source check: 2026-05-21
Primary official sources:

- USPTO provisional application page: https://www.uspto.gov/patents/basics/apply/provisional-application
- USPTO patent forms page: https://www.uspto.gov/patents/apply/forms
- USPTO fee schedule: https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule
- USPTO entity status page: https://www.uspto.gov/patents/apply/applying-online/entity-status-fee-purposes
- USPTO provisional applications presentation: https://www.uspto.gov/sites/default/files/documents/provisional-applications-6-2023.pdf

## A. Draft Package Inventory

- [x] Specification draft: `patent/ENER_provisional_specification.md`
- [x] Claim seed set for later conversion: `patent/ENER_claim_seed_set.md`
- [x] Drawing descriptions: `patent/ENER_drawings_descriptions.md`
- [x] Mermaid figure source files: `patent/figures/`
- [x] Mirrored figure source directory: `patent/ENER_figures/`
- [x] Prior art search plan: `patent/ENER_prior_art_search_plan.md`
- [x] Submission checklist: `patent/ENER_submission_checklist.md`
- [ ] Final filing PDF generated from specification and drawings
- [ ] Optional DOCX checked before upload if using DOCX route

## B. Enablement Checklist

| Enablement Topic | Covered in Draft? | Where Covered | Notes |
|---|---:|---|---|
| How raw neural signals are acquired | Yes | Sections C, F.1, F.2, G | Covers EEG, ECoG, fNIRS, MEG, implanted arrays, wearable BCI devices. |
| How windows are segmented | Yes | Sections F.2, J.1, J.2 | Includes fixed, overlapping, event-triggered, and adaptive windows. |
| How embeddings are generated | Yes | Sections F.3, G, J | Covers learned and deterministic encoders. |
| How embeddings are compressed | Yes | Sections F.4, F.5, J | Covers dimensionality reduction, quantization, sparsity, event coding, packing. |
| How embeddings are encrypted | Yes | Sections F.6, J.3-J.6, K | Covers FHE, SHE, CKKS, BFV, BGV, TFHE, MPC, TEE, differential privacy, hybrid modes. |
| How encrypted inference is performed | Yes | Sections F.7, J.3-J.6 | Covers encrypted linear, approximate, threshold, and MPC paths. |
| How outputs are decrypted or consumed | Yes | Sections F.7, F.10, G, J.1 | Covers authorized endpoint decryption and encrypted results. |
| How reconstruction risk is reduced | Yes | Sections F.8, Figure 4 description, K | Covers adversarial decoders, bottlenecks, identity-obfuscation, risk metrics. |
| How bandwidth and compute efficiency improve | Yes | Sections D, F.4, F.5, J.3 | Explains compression before encryption and reduced encrypted operations. |

## C. Weak Areas Needing Inventor Input

- Specific inventor legal name or names.
- Applicant or owner, if different from inventor.
- Correspondence address.
- Earliest conception date and earliest reduction-to-practice evidence.
- Dates of any public disclosure, repository publication, pitch, demo, post, paper, or offer for sale.
- Whether the public CC0 repository disclosure is intended to remain public before filing.
- Exact first commercial embodiment: EEG headset, wearable BCI, implanted interface, fNIRS, or other.
- Actual encoder architecture and training data used or planned.
- Actual compression ratio, latent dimension ranges, quantization levels, and benchmark evidence.
- Preferred cryptographic implementation path: BFV/BGV, CKKS, TFHE, MPC, TEE, or hybrid.
- Whether the first filing should include medical or neurodiagnostic examples, consumer-only examples, or both.
- Whether any government funding or institutional ownership interest exists.
- Whether micro entity or small entity status is available.

## D. USPTO Provisional Filing Items

Based on the current USPTO provisional application guidance checked above, prepare:

- [ ] Specification in PDF or DOCX format.
- [ ] Drawings in the specification or in a separate drawings PDF, if needed to understand the invention.
- [ ] Provisional Application for Patent Cover Sheet, form PTO/SB/16. The USPTO forms page lists a Patent Center auto-load version as the recommended SB/16 version.
- [ ] Filing fee. Current USPTO fee schedule lists the provisional application filing fee under 37 CFR 1.16(d) as $325 large entity, $130 small entity, and $65 micro entity.
- [ ] Micro entity certification, if claiming micro entity status. USPTO identifies PTO/SB/15A for the gross-income/application-limit basis and PTO/SB/15B for the institution-of-higher-education basis.
- [ ] Inventor legal name or names.
- [ ] Inventor residence information.
- [ ] Correspondence address.
- [ ] Application title.
- [ ] Any attorney or agent information, if applicable.
- [ ] Any U.S. Government agency property interest, if applicable.
- [ ] Applicant or ownership confirmation for internal records.

## E. Items USPTO Says Are Not Required for a Provisional

The current USPTO provisional guidance states that a provisional application is not required to include:

- Formal patent claims.
- Oath or declaration.
- Information disclosure statement.

The claim seeds in this package are included for later nonprovisional planning and support, not because formal claims are required in the provisional filing.

## F. Human Filing Workflow

1. Create or log into a USPTO.gov account.
2. Open Patent Center.
3. Choose a new provisional utility application.
4. Enter bibliographic data, including title, inventor information, correspondence address, and entity status.
5. Upload the specification, preferably as a reviewed PDF or accepted DOCX.
6. Upload drawings as a separate PDF if they are not included in the specification file.
7. Attach or complete the PTO/SB/16 provisional cover sheet. Use the Patent Center auto-load version if available.
8. Attach the micro entity certification form if claiming micro entity status.
9. Review all bibliographic data, uploaded files, fee calculations, and entity status.
10. Pay the filing fee.
11. Save the electronic acknowledgement receipt, filing receipt, application number, confirmation number, and uploaded-file copies.

## G. Final Pre-Upload Review

- [ ] Confirm every inventor who contributed to the disclosed invention is named.
- [ ] Confirm title matches across the specification and cover sheet.
- [ ] Confirm drawings are legible in black and white and referenced by figure number.
- [ ] Confirm the specification includes enough detail to support later claims.
- [ ] Confirm no confidential third-party information, proprietary code, or unlicensed material is included.
- [ ] Confirm no unsupported production cryptography, clinical, or regulatory claims are overstated.
- [ ] Confirm the filing fee and entity status match the applicant's actual status.
- [ ] Confirm no automatic submission is performed by this drafting package.
