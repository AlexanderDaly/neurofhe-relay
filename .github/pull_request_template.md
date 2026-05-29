## Summary

- <short change summary>

## Evidence Boundary

- [ ] Keeps CC0/public-domain framing intact.
- [ ] Preserves `privacyBoundary`, `cryptoInventory`, provenance, and `productionClaim: false` where artifact metadata is involved.
- [ ] Keeps `releaseGateSatisfied: false` unless every documented release gate is actually satisfied.
- [ ] Avoids production cryptography, clinical, medical, surveillance, valuation, or deployment claims.
- [ ] Keeps raw signals, raw datasets, secrets, private payloads, and proprietary material out of git.

## Change Notes

| Change Type | Note In This PR |
| --- | --- |
| Docs or repository navigation | Reader route touched, focused docs check, and any claim-boundary wording changed. |
| Scaffold, benchmark, or gateway behavior | Focused test, artifact command if output changed, and preserved `privacyBoundary` / `cryptoInventory`. |
| Native FHE lane | Dependency state plus the exact command, error, and smallest next step when blocked. |
| Real-data or dataset-adjacent artifact | `docs/data-handling.md` route, provenance, and confirmation that raw datasets stay out of git. |
| Release-readiness or repository-policy posture | `releaseGateSatisfied: false`, `docs/release-gate-matrix.md`, `docs/evidence-dashboard.md`, and repository ruleset/admin policy status. |

## Validation

- [ ] `npm run ci`
- [ ] `git diff --check`
- [ ] Relevant artifact command, if benchmark/data-processing behavior changed:

```sh

```

## Blockers And Caveats

- <remaining blocker, caveat, or "None">
- Release reviewers: check `docs/release-gate-matrix.md` and `docs/evidence-dashboard.md` before treating this PR as release-ready.
- If hosted checks are green but merge remains blocked, record whether the remaining state is repository ruleset/admin policy rather than a CI/check-rollup or code failure.
