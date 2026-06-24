// SPDX-License-Identifier: CC0-1.0

// Renders docs/evidence-dashboard.md from the committed release-evidence
// artifact so the human-readable dashboard never has to be hand-synchronized
// with benchmark-artifacts/release-evidence/latest.json. The release-evidence
// artifact is the single source of truth; this renderer is a pure function of
// it. Regenerate with `npm run docs:evidence`.

export const EVIDENCE_DASHBOARD_PATH = "docs/evidence-dashboard.md";
export const RELEASE_EVIDENCE_ARTIFACT_PATH =
  "benchmark-artifacts/release-evidence/latest.json";

const GATE_CHECK_ORDER = [
  "hostedPortableCi",
  "repositoryHygiene",
  "nativeMeasurementCoverage",
  "metadataLeakage",
  "reconstructionRisk",
  "realNmnistBaseline",
  "tfheRealDataPath",
  "productionClaim",
];

export function renderEvidenceDashboard(artifact) {
  if (!artifact || typeof artifact !== "object") {
    throw new Error("renderEvidenceDashboard requires a release-evidence artifact object.");
  }
  const subject = artifact.subject ?? {};
  const gateChecks = subject.gateChecks ?? {};

  const lines = [];
  lines.push("# Evidence Dashboard");
  lines.push("");
  lines.push("This page is the human-readable companion to");
  lines.push("`benchmark-artifacts/release-evidence/latest.json`. Use it for a fast review of");
  lines.push("the current release-gate posture before opening the detailed JSON artifact,");
  lines.push("`RELEASE.md`, or `docs/release-gate-matrix.md`.");
  lines.push("");
  lines.push("It is not benchmark evidence by itself, not release approval, and not a");
  lines.push("production cryptography, medical, clinical, deployment, side-channel,");
  lines.push("anonymity, stable-performance, or privacy-proof claim.");
  lines.push("");
  lines.push("> Generated file. Do not edit by hand. Run `npm run docs:evidence` to regenerate");
  lines.push("> it from `benchmark-artifacts/release-evidence/latest.json`.");
  lines.push("");
  lines.push("## Committed Gate Snapshot");
  lines.push("");
  lines.push("Source artifact:");
  lines.push("");
  lines.push("```text");
  lines.push(RELEASE_EVIDENCE_ARTIFACT_PATH);
  lines.push(`artifactId: ${artifact.artifactId}`);
  lines.push(`generatedAt: ${artifact.generatedAt}`);
  lines.push(`subject.releaseGateSatisfied: ${subject.releaseGateSatisfied}`);
  lines.push(`subject.productionClaim: ${subject.productionClaim}`);
  lines.push(`productionClaim: ${artifact.productionClaim}`);
  lines.push("```");
  lines.push("");
  lines.push("The artifact is a `neurofhe.releaseEvidenceArtifact.v1` wrapper. The indexed");
  lines.push("release decision fields and per-check summaries live under `subject`, including");
  lines.push("`subject.gateChecks`. Use those paths when comparing this page with the JSON.");
  lines.push("This is the latest committed release-evidence snapshot, not a substitute for");
  lines.push("live PR status. Before merge or release review, confirm the current PR head,");
  lines.push("hosted check rollup, and merge policy with:");
  lines.push("");
  lines.push("```sh");
  lines.push(
    "gh pr view \"$RELEASE_VALIDATION_PR\" --json headRefOid,mergeable,mergeStateStatus,statusCheckRollup",
  );
  lines.push("```");
  lines.push("");
  lines.push(...renderPlainEnglishSummary(subject, gateChecks));
  lines.push("## Gate Checks");
  lines.push("");
  lines.push("| Check | Current Status | Review Note |");
  lines.push("| --- | --- | --- |");
  for (const name of gateCheckNames(gateChecks)) {
    const check = gateChecks[name] ?? {};
    const status = escapeCell(check.status ?? "missing");
    const note = escapeCell(check.reason ?? "No reason recorded.");
    lines.push(`| \`${name}\` | ${status} | ${note} |`);
  }
  lines.push("");
  lines.push("## Release Decision");
  lines.push("");
  lines.push("The dashboard status is useful review evidence, but it does not satisfy the");
  lines.push("release gate. Before tagging `v0.1.0-research-alpha`, use `RELEASE.md` and");
  lines.push("`docs/release-gate-matrix.md` to rerun or review every minimum evidence command,");
  lines.push("refresh artifacts or blocker reports, confirm hosted CI is still green, and get");
  lines.push("explicit user approval for the final release action.");
  lines.push("");
  lines.push("## Where To Drill Down");
  lines.push("");
  lines.push("- `docs/evidence-guide.md` - evidence classes and claim discipline.");
  lines.push("- `docs/claim-evidence-ledger.md` - weak-claim evidence posture and caveats.");
  lines.push("- `docs/release-gate-matrix.md` - command-by-command release evidence map.");
  lines.push("- `docs/status-roadmap.md` - current blockers and next evidence work.");
  lines.push("- `benchmark-artifacts/README.md` - artifact directories, commands, and caveats.");

  return `${lines.join("\n")}\n`;
}

function renderPlainEnglishSummary(subject, gateChecks) {
  const releaseSatisfied = subject.releaseGateSatisfied === true;
  const passCount = Object.values(gateChecks).filter((check) => check?.status === "pass").length;
  const caveatedCount = Object.values(gateChecks).filter((check) => check?.status === "caveated").length;
  const blockedCount = Object.values(gateChecks).filter((check) => check?.status === "blocked").length;
  const incompleteCount = Object.values(gateChecks).filter((check) => check?.status === "incomplete").length;

  const lines = [];
  lines.push("## Plain English Summary");
  lines.push("");
  lines.push("For non-technical readers. Traffic-light read of the **committed** snapshot");
  lines.push("below; see Gate Checks and `docs/layperson-quickstart.md` for context.");
  lines.push("This summary is not release approval or a privacy proof.");
  lines.push("");
  lines.push("| Signal | Meaning |");
  lines.push("| --- | --- |");
  lines.push("| **Green** | Research scaffolding checks out on this snapshot (tests, hygiene, indexed artifacts present). |");
  lines.push("| **Yellow** | Useful local evidence exists but carries explicit caveats (privacy proxies, single-window native runs). |");
  lines.push("| **Red** | Not ready as a product release or formal proof (release gate, production crypto, clinical use). |");
  lines.push("");
  lines.push("**Current read:**");
  lines.push("");
  if (releaseSatisfied) {
    lines.push("- **Red → product release:** release gate marked satisfied — confirm `RELEASE.md` before public copy.");
  } else {
    lines.push("- **Red → product release:** `releaseGateSatisfied: false` — no research-alpha tag implied by this dashboard.");
  }
  lines.push(`- **Green → research package integrity:** ${passCount} gate check(s) passed on this snapshot.`);
  if (caveatedCount > 0) {
    lines.push(`- **Yellow → evidence with caveats:** ${caveatedCount} caveated check(s) with documented limitations (not privacy proofs).`);
  }
  if (blockedCount > 0 || incompleteCount > 0) {
    lines.push(`- **Red → blockers:** ${blockedCount} blocked, ${incompleteCount} incomplete check(s) remain.`);
  }
  lines.push("- **Red → production cryptography / medical software:** not claimed; `productionClaim: false` on indexed artifacts.");
  lines.push("");
  return lines;
}

function gateCheckNames(gateChecks) {
  const known = GATE_CHECK_ORDER.filter((name) => name in gateChecks);
  const extra = Object.keys(gateChecks).filter((name) => !GATE_CHECK_ORDER.includes(name));
  return [...known, ...extra];
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
