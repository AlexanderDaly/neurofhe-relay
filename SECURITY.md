# Security Policy

NeuroFHE Relay is a research prototype. It is not production cryptography, a
medical device, a clinical decision system, a surveillance system, or a
deployment-ready privacy product.

## Supported Scope

Security reports are useful when they identify issues in the public prototype
itself, such as:

- raw signal, raw dataset, secret, or private payload leakage into committed
  artifacts;
- benchmark or documentation claims that present toy arithmetic as real
  cryptographic security evidence;
- unsafe CLI behavior that could overwrite files unexpectedly;
- malformed input handling that breaks the documented privacy boundary;
- incorrect crypto inventory, parameter, or provenance reporting.

Known research limitations, such as the toy additive scheme being insecure or
metadata leakage from public active positions, are documented caveats rather
than vulnerabilities by themselves.

## Reporting

Use GitHub private vulnerability reporting if it is enabled for this repository.
For non-sensitive documentation or reproducibility issues, opening a normal
GitHub issue is fine.

Do not post secrets, private data, raw neural/EEG records, proprietary model
weights, or exploit payloads in public issues or pull requests.

## Response Expectations

This is a public-domain research package maintained as time permits, not a
commercial security product with an SLA. Reports that include reproducible
commands, affected files, expected behavior, and observed behavior are easiest
to validate.

## Cryptographic Posture

All current cryptographic lanes are research-grade:

- toy additive arithmetic is educational only;
- OpenFHE BFVrns and CKKS lanes are native-library comparison targets;
- TFHE-rs is a threshold/Boolean comparison target;
- benchmark results are local evidence, not third-party audits or security
  certification.

Every artifact should keep `productionClaim: false` until reviewed
implementations, parameter choices, deployment threat models, and side-channel
analysis exist.
