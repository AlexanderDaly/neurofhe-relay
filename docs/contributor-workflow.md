# Contributor Workflow

This page maps the GitHub-facing contribution surfaces. Use it with
`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`,
`docs/developer-quickstart.md`, and `docs/maintainer-checklist.md`.

Nothing in these templates upgrades NeuroFHE Relay into production
cryptography, medical software, clinical validation, deployment evidence, or a
security certification. Issues and pull requests should preserve the
research-alpha caveats and avoid secrets, private data, raw datasets, and
unsupported benchmark or cryptographic claims.

## Contribution Routes

| Need | Use | Keep Visible |
| --- | --- | --- |
| Report a reproducible failure | `.github/ISSUE_TEMPLATE/bug-report.yml` | Exact command, observed result, environment, and smallest next step. |
| Report an evidence gap | `.github/ISSUE_TEMPLATE/validation-gap.yml` | Current caveat, missing evidence class, and `releaseGateSatisfied: false`. |
| Request repository cleanup | `.github/ISSUE_TEMPLATE/repository-cleanup.yml` | Reader friction, affected file or workflow, and validation route. |
| Open or update a pull request | `.github/pull_request_template.md` | Commands run, PR Readiness Snapshot, artifact impact, raw-data boundary, and repository-policy posture. |
| Report sensitive security or raw-data exposure | `SECURITY.md` and `SUPPORT.md` | Keep secrets, private payloads, raw datasets, and exploit details out of public issues. |

## Issue Forms

Use `SUPPORT.md` first when deciding whether a report belongs in a public issue,
private security report, pull request, validation note, or release blocker.

- [`.github/ISSUE_TEMPLATE/bug-report.yml`](../.github/ISSUE_TEMPLATE/bug-report.yml)
  - reproducible bug, failing command, CI job, script, scaffold behavior, or
    artifact-generation report.
- [`.github/ISSUE_TEMPLATE/validation-gap.yml`](../.github/ISSUE_TEMPLATE/validation-gap.yml)
  - missing or incomplete evidence report where the current caveat must remain
    visible.
- [`.github/ISSUE_TEMPLATE/repository-cleanup.yml`](../.github/ISSUE_TEMPLATE/repository-cleanup.yml)
  - documentation, packaging, navigation, or contributor-workflow cleanup
    request.
- [`.github/ISSUE_TEMPLATE/config.yml`](../.github/ISSUE_TEMPLATE/config.yml)
  - GitHub issue-template chooser configuration.

## Pull Requests

- [`.github/CODEOWNERS`](../.github/CODEOWNERS)
  - review ownership routing for repository changes.
- [`.github/dependabot.yml`](../.github/dependabot.yml)
  - weekly dependency update routing for GitHub Actions and npm package
    metadata.
- [`.github/pull_request_template.md`](../.github/pull_request_template.md)
  - evidence-boundary and validation checklist for proposed changes.

Before opening or updating a pull request, run:

```sh
npm run ci
git diff --check
```

If a benchmark, dataset, native lane, release index, or artifact changes,
include the exact command and whether the committed evidence is a derived
artifact or a structured blocker report.

Use the pull request template's PR Readiness Snapshot to report local
validation, hosted `Portable validation`, merge state, release-gate posture,
and the remaining blocker, caveat, or next action.

## Hosted Validation

- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
  - portable GitHub Actions validation for tests, metadata parsing, local
    Markdown links, repository hygiene, and smoke artifact generation/upload.

Hosted `Portable validation` proves the portable repository gate on GitHub. It
does not prove native OpenFHE or TFHE-rs availability, release approval,
production readiness, medical utility, or stable performance.

Dependabot pull requests are maintenance prompts only. They still require the
same evidence boundaries, local validation, and hosted `Portable validation`
review as any other change.

Validation checks that every tracked `.github` workflow, issue, and pull-request
surface is represented on this page.
