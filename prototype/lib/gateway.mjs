// SPDX-License-Identifier: CC0-1.0

import { createHash } from "node:crypto";

import {
  activeEvents,
  spikeMetrics,
  validateEventWindow,
} from "./events.mjs";
import {
  buildSimulatedRawNeuralFrame,
  sortSpatialSpikes,
} from "./spike-sorter.mjs";

const DEFAULT_TIMESTAMP = "2026-05-21T00:00:00.000Z";

export function buildSimulatedRawSignal(options = {}) {
  const observedAt = options.observedAt ?? DEFAULT_TIMESTAMP;
  const receivedAt = options.receivedAt ?? observedAt;

  return {
    schema: "neurofhe.gateway.rawSignal.v1",
    intakeId: options.intakeId ?? "raw-simulated-intake-001",
    observedAt,
    receivedAt,
    localOnly: true,
    sensitivity: "sensitive-by-default",
    source: {
      sourceId: options.sourceId ?? "simulated-biodigital-source-001",
      kind: "simulated-bio-digital-event-stream",
      adapter: "local-simulator",
      authorization: "synthetic-demo-only",
    },
    payload: {
      rawNeuralFrame:
        options.rawNeuralFrame ??
        buildSimulatedRawNeuralFrame({
          eventWindow: options.eventWindow,
          observedAt,
        }),
      simulatedSubjectRef: "simulated-subject-local-only",
      deviceSerial: "SIM-DEVICE-LOCAL-ONLY",
      note: "Synthetic raw neural-like intake for gateway architecture testing; not clinical data.",
    },
    highRiskMetadata: {
      preciseSourcePath: "/local-only/simulated/raw-signal.json",
      preciseLocation: "local-simulation-lab",
      operatorNote: "do-not-export",
    },
  };
}

export function normalizeRawSignal(rawSignal, options = {}) {
  const encoded = encodeRawSignal(rawSignal, options);
  const eventWindow = encoded.eventWindow;
  const validationErrors = validateEventWindow(eventWindow);
  const isValid = validationErrors.length === 0;
  const sparseEvents = isValid ? activeEvents(eventWindow) : [];
  const metrics = isValid ? spikeMetrics(eventWindow) : null;
  const eventId =
    options.eventId ??
    `evt-${hashStable({
      intakeId: rawSignal?.intakeId,
      observedAt: rawSignal?.observedAt,
      values: eventWindow?.values,
    }).slice(0, 16)}`;

  return {
    schema: "neurofhe.gateway.normalizedEvent.v1",
    eventId,
    schemaVersion: "v1",
    eventType: "simulated-bio-digital-event-window",
    observedAt: rawSignal?.observedAt,
    receivedAt: rawSignal?.receivedAt,
    sourceId: rawSignal?.source?.sourceId,
    sourceKind: rawSignal?.source?.kind,
    confidence: options.confidence ?? 0.72,
    validation: {
      status: isValid ? "valid" : "rejected",
      errors: validationErrors,
    },
    provenance: {
      intakeId: rawSignal?.intakeId,
      rawPayloadHash: hashStable(rawSignal?.payload ?? null),
      sourceIdHash: hashText(rawSignal?.source?.sourceId ?? "unknown").slice(0, 16),
      transformIds: [
        encoded.encoder?.id ?? "legacy-event-window-passthrough",
        "validate-event-window",
        "active-event-extraction",
        "spike-metric-summary",
      ],
      simulated: rawSignal?.source?.authorization === "synthetic-demo-only",
      caveat: "Synthetic architecture demo only; not medical, diagnostic, or clinical data.",
    },
    features: isValid
      ? {
          representation: "sparse-active-event-list",
          featureShape: [eventWindow.timesteps, eventWindow.channels],
          windowMs: eventWindow.windowMs,
          encoding: eventWindow.encoding,
          encoder: encoded.encoder,
          sparseEvents,
          metrics,
        }
      : null,
  };
}

export function buildDefaultGatewayPolicy(options = {}) {
  return {
    schema: "neurofhe.gateway.policy.v1",
    policyId: options.policyId ?? "gateway-local-minimal-export-v1",
    defaultInputSensitivity: "sensitive",
    rawExport: "deny",
    exportMode: "minimal-model-event",
    productionClaim: false,
    allowedEventTypes: ["simulated-bio-digital-event-window"],
    allowedSourceKinds: ["simulated-bio-digital-event-stream"],
    maxActiveEvents: options.maxActiveEvents ?? 64,
    timeBucketMs: options.timeBucketMs ?? 60_000,
    timestepBucketSize: options.timestepBucketSize ?? 2,
    fieldRules: [
      {
        field: "payload",
        action: "withhold",
        reason: "raw or reconstructable source payload stays inside the local boundary",
      },
      {
        field: "payload.rawNeuralFrame.rawNeuralSamples",
        action: "withhold",
        reason: "raw neural-like samples stay inside the local boundary",
      },
      {
        field: "payload.deviceSerial",
        action: "withhold",
        reason: "stable device identifiers are high-risk metadata",
      },
      {
        field: "payload.simulatedSubjectRef",
        action: "withhold",
        reason: "subject or session references are local-only even in simulation",
      },
      {
        field: "source.sourceId",
        action: "hash",
        reason: "downstream services do not need the local source identifier",
      },
      {
        field: "observedAt",
        action: "bucket",
        reason: "exact timestamps can leak timing patterns",
      },
      {
        field: "features.sparseEvents.value",
        action: "encrypt-or-withhold",
        reason: "active values are plaintext only inside the gateway",
      },
    ],
    modelEventRules: {
      plaintextFields: [
        "eventId",
        "eventType",
        "schemaVersion",
        "confidence",
        "observedAtBucket",
        "featureShape",
        "windowMs",
        "encoder",
        "sparseMetrics",
        "activePositions",
      ],
      encryptedFields: ["activeSpikeValues"],
      aggregatedFields: ["densityBucket", "activeEventCount"],
      withheldFields: [
        "rawPayload",
        "deviceSerial",
        "localSubjectRef",
        "preciseSourcePath",
        "preciseLocation",
        "exactRawTimestamps",
        "rawSignalValues",
        "rawSamplePayloads",
      ],
    },
    recommendationRules: {
      allowActions: [
        "annotate_local_session",
        "queue_local_review",
        "adjust_local_dashboard",
      ],
      blockActions: [
        "raw_device_command",
        "external_device_control",
        "message_person",
        "medical_advice",
        "surveillance_targeting",
      ],
      requireLocal: true,
      requireReversible: true,
      maxConfidenceWithoutUncertainty: 0.98,
    },
  };
}

export function applyPrivacySafetyPolicy(normalizedEvent, policy = buildDefaultGatewayPolicy()) {
  const reasons = [];

  if (!normalizedEvent || typeof normalizedEvent !== "object") {
    reasons.push("normalized event must be an object");
  }
  if (normalizedEvent?.validation?.status !== "valid") {
    reasons.push("normalization validation did not pass");
  }
  if (!policy.allowedEventTypes.includes(normalizedEvent?.eventType)) {
    reasons.push(`event type ${normalizedEvent?.eventType ?? "unknown"} is not export-approved`);
  }
  if (!policy.allowedSourceKinds.includes(normalizedEvent?.sourceKind)) {
    reasons.push(`source kind ${normalizedEvent?.sourceKind ?? "unknown"} is not export-approved`);
  }

  const activeEventCount = normalizedEvent?.features?.sparseEvents?.length ?? 0;
  if (activeEventCount > policy.maxActiveEvents) {
    reasons.push(
      `active event count ${activeEventCount} exceeds policy maximum ${policy.maxActiveEvents}`,
    );
  }

  if (reasons.length) {
    return {
      schema: "neurofhe.gateway.policyDecision.v1",
      decision: "blocked",
      approved: false,
      policyId: policy.policyId,
      reasons,
      modelFacingEvent: null,
    };
  }

  return {
    schema: "neurofhe.gateway.policyDecision.v1",
    decision: "approved",
    approved: true,
    policyId: policy.policyId,
    reasons: [],
    modelFacingEvent: buildModelFacingEvent(normalizedEvent, policy),
  };
}

export function buildModelFacingEvent(normalizedEvent, policy = buildDefaultGatewayPolicy()) {
  const sparseEvents = normalizedEvent.features.sparseEvents;
  const metrics = normalizedEvent.features.metrics;

  return {
    schema: "neurofhe.gateway.modelEvent.v1",
    eventId: normalizedEvent.eventId,
    schemaVersion: normalizedEvent.schemaVersion,
    emittedAt: normalizedEvent.receivedAt ?? DEFAULT_TIMESTAMP,
    boundary: "local-trust-boundary-approved-export",
    policyId: policy.policyId,
    productionClaim: false,
    eventType: normalizedEvent.eventType,
    source: {
      sourceKind: normalizedEvent.sourceKind,
      sourceIdHash: normalizedEvent.provenance.sourceIdHash,
      sourceIdPlaintext: "withheld",
    },
    validation: normalizedEvent.validation,
    confidence: normalizedEvent.confidence,
    uncertainty: {
      level: "high",
      reasons: [
        "simulated source data",
        "single-window demonstration",
        "no clinical validation",
      ],
    },
    plaintext: {
      observedAtBucket: bucketTimestamp(normalizedEvent.observedAt, policy.timeBucketMs),
      featureShape: normalizedEvent.features.featureShape,
      windowMs: normalizedEvent.features.windowMs,
      encoding: normalizedEvent.features.encoding,
      sparseMetrics: {
        featureCount: metrics.featureCount,
        activeEventCount: sparseEvents.length,
        densityBucket: densityBucket(metrics.density),
        activeChannels: metrics.activeChannels,
        activeTimesteps: metrics.activeTimesteps,
      },
      encoder: normalizedEvent.features.encoder,
      activePositions: sparseEvents.map((event) => ({
        index: event.index,
        timestepBucket: bucketTimestep(event.time, policy.timestepBucketSize),
        channel: event.channel,
      })),
    },
    encrypted: {
      activeSpikeValues: sparseEvents.map((event, rowIndex) => ({
        index: event.index,
        ciphertextRef: `enc-active-value-${rowIndex}`,
        encoding: "encrypted-non-negative-integer-spike-count",
      })),
      targetPath: "BFV/BGV integer scoring or compatible FHE-style adapter after review",
      currentPrototype: "placeholder references only; no production cryptography claim",
    },
    aggregated: {
      spikeCountBucket: countBucket(metrics.spikeCount),
      activeEventCount: sparseEvents.length,
      densityBucket: densityBucket(metrics.density),
    },
    withheld: policy.modelEventRules.withheldFields.map((field) => ({
      field,
      reason: "withheld by gateway export policy",
    })),
    provenance: {
      intakeId: normalizedEvent.provenance.intakeId,
      rawPayloadHash: normalizedEvent.provenance.rawPayloadHash,
      transformIds: normalizedEvent.provenance.transformIds,
      simulated: normalizedEvent.provenance.simulated,
    },
    fieldVisibility: {
      plaintext: policy.modelEventRules.plaintextFields,
      encrypted: policy.modelEventRules.encryptedFields,
      aggregated: policy.modelEventRules.aggregatedFields,
      withheld: policy.modelEventRules.withheldFields,
    },
  };
}

export function buildLocalAnnotationRecommendation(modelFacingEvent, options = {}) {
  return {
    schema: "neurofhe.gateway.recommendation.v1",
    recommendationId: options.recommendationId ?? "rec-local-annotation-001",
    modelServiceId: options.modelServiceId ?? "local-model-simulated-reviewer",
    basedOnEventIds: [modelFacingEvent.eventId],
    proposedAction: {
      actionType: "annotate_local_session",
      target: "local-dashboard",
      localOnly: true,
      reversible: true,
      parameters: {
        label: "review-simulated-event-window",
        severity: "low",
        note: "Synthetic gateway demo annotation; no device command.",
      },
    },
    confidence: options.confidence ?? 0.64,
    uncertainty: {
      level: "high",
      statement: "Synthetic single-window event; recommendation is advisory only.",
    },
    rationale:
      "Model-facing event summary is sparse and simulated; queue a local annotation for review.",
    rawDeviceCommand: false,
    requiresHumanApproval: false,
  };
}

export function buildUnsafeDeviceCommandRecommendation(modelFacingEvent, options = {}) {
  return {
    schema: "neurofhe.gateway.recommendation.v1",
    recommendationId: options.recommendationId ?? "rec-unsafe-device-command-001",
    modelServiceId: options.modelServiceId ?? "external-agent-untrusted",
    basedOnEventIds: [modelFacingEvent.eventId],
    proposedAction: {
      actionType: "raw_device_command",
      target: "external-device",
      localOnly: false,
      reversible: false,
      parameters: {
        command: "change-device-state",
      },
    },
    confidence: 0.99,
    uncertainty: null,
    rationale: "Unsafe example for policy rejection.",
    rawDeviceCommand: true,
    requiresHumanApproval: true,
  };
}

export function evaluateRecommendation(
  recommendation,
  modelFacingEvent,
  policy = buildDefaultGatewayPolicy(),
  options = {},
) {
  const rules = policy.recommendationRules;
  const actionType = recommendation?.proposedAction?.actionType;
  const reasons = [];

  if (!recommendation || typeof recommendation !== "object") {
    reasons.push("recommendation must be an object");
  }
  if (!recommendation?.basedOnEventIds?.includes(modelFacingEvent?.eventId)) {
    reasons.push("recommendation is not based on the approved model-facing event");
  }
  if (recommendation?.rawDeviceCommand === true) {
    reasons.push("raw device commands are blocked");
  }
  if (rules.blockActions.includes(actionType)) {
    reasons.push(`action type ${actionType} is blocked`);
  }
  if (!rules.allowActions.includes(actionType)) {
    reasons.push(`action type ${actionType ?? "unknown"} is not in the allowlist`);
  }
  if (rules.requireLocal && recommendation?.proposedAction?.localOnly !== true) {
    reasons.push("approved actions must be local-only");
  }
  if (rules.requireReversible && recommendation?.proposedAction?.reversible !== true) {
    reasons.push("approved actions must be reversible");
  }
  if (!isConfidence(recommendation?.confidence)) {
    reasons.push("confidence must be a number from 0 to 1");
  }
  if (
    recommendation?.confidence > rules.maxConfidenceWithoutUncertainty &&
    !recommendation?.uncertainty
  ) {
    reasons.push("overconfident recommendations must include uncertainty metadata");
  }
  if (recommendation?.requiresHumanApproval === true && options.humanApproved !== true) {
    reasons.push("recommendation requires explicit human approval");
  }

  const accepted = reasons.length === 0;
  return {
    schema: "neurofhe.gateway.commandDecision.v1",
    decisionId: `decision-${hashStable({
      recommendationId: recommendation?.recommendationId,
      eventId: modelFacingEvent?.eventId,
      accepted,
      reasons,
    }).slice(0, 16)}`,
    recommendationId: recommendation?.recommendationId,
    eventId: modelFacingEvent?.eventId,
    policyId: policy.policyId,
    decision: accepted ? "accepted" : "rejected",
    accepted,
    reasons,
    approvedAction: accepted
      ? {
          ...recommendation.proposedAction,
          executionScope: "safe-local-reversible",
        }
      : null,
  };
}

export function buildAuditLog(flow, options = {}) {
  const at = options.at ?? DEFAULT_TIMESTAMP;
  const records = [
    auditRecord("raw_intake_metadata", at, {
      intakeId: flow.rawSignal.intakeId,
      sourceKind: flow.rawSignal.source.kind,
      sourceIdHash: hashText(flow.rawSignal.source.sourceId).slice(0, 16),
      rawPayloadHash: hashStable(flow.rawSignal.payload),
      rawPayload: "withheld-local-only",
    }),
    auditRecord("normalization_decision", at, {
      eventId: flow.normalizedEvent.eventId,
      status: flow.normalizedEvent.validation.status,
      errors: flow.normalizedEvent.validation.errors,
      transformIds: flow.normalizedEvent.provenance.transformIds,
    }),
    auditRecord("privacy_safety_filter", at, {
      eventId: flow.normalizedEvent.eventId,
      policyId: flow.policyDecision.policyId,
      decision: flow.policyDecision.decision,
      withheldFields:
        flow.policyDecision.modelFacingEvent?.fieldVisibility.withheld ??
        flow.policy.modelEventRules.withheldFields,
    }),
  ];

  if (flow.policyDecision.modelFacingEvent) {
    records.push(
      auditRecord("model_event_export", at, {
        eventId: flow.policyDecision.modelFacingEvent.eventId,
        plaintextFields: flow.policyDecision.modelFacingEvent.fieldVisibility.plaintext,
        encryptedFields: flow.policyDecision.modelFacingEvent.fieldVisibility.encrypted,
        aggregatedFields: flow.policyDecision.modelFacingEvent.fieldVisibility.aggregated,
        withheldFields: flow.policyDecision.modelFacingEvent.fieldVisibility.withheld,
      }),
    );
  }

  for (const pair of flow.recommendationDecisions ?? []) {
    records.push(
      auditRecord("recommendation_received", at, {
        recommendationId: pair.recommendation.recommendationId,
        eventIds: pair.recommendation.basedOnEventIds,
        actionType: pair.recommendation.proposedAction.actionType,
        modelServiceId: pair.recommendation.modelServiceId,
      }),
      auditRecord("command_validation_decision", at, {
        recommendationId: pair.decision.recommendationId,
        eventId: pair.decision.eventId,
        decision: pair.decision.decision,
        reasons: pair.decision.reasons,
        approvedActionType: pair.decision.approvedAction?.actionType ?? null,
      }),
    );
  }

  return records;
}

export function buildSanitizedReplayStream(modelFacingEvent, commandDecisions = []) {
  return {
    schema: "neurofhe.gateway.sanitizedReplay.v1",
    containsRawPayload: false,
    replayEvents: modelFacingEvent ? [modelFacingEvent] : [],
    commandDecisions: commandDecisions.map((decision) => ({
      schema: decision.schema,
      decisionId: decision.decisionId,
      recommendationId: decision.recommendationId,
      eventId: decision.eventId,
      decision: decision.decision,
      accepted: decision.accepted,
      reasons: decision.reasons,
      approvedActionType: decision.approvedAction?.actionType ?? null,
    })),
  };
}

export function runGatewayDemo(options = {}) {
  const rawSignal = buildSimulatedRawSignal(options);
  const normalizedEvent = normalizeRawSignal(rawSignal, options);
  const policy = buildDefaultGatewayPolicy(options.policyOptions ?? {});
  const policyDecision = applyPrivacySafetyPolicy(normalizedEvent, policy);
  const modelFacingEvent = policyDecision.modelFacingEvent;
  const acceptedRecommendation = modelFacingEvent
    ? buildLocalAnnotationRecommendation(modelFacingEvent)
    : null;
  const rejectedRecommendation = modelFacingEvent
    ? buildUnsafeDeviceCommandRecommendation(modelFacingEvent)
    : null;
  const acceptedDecision = acceptedRecommendation
    ? evaluateRecommendation(acceptedRecommendation, modelFacingEvent, policy)
    : null;
  const rejectedDecision = rejectedRecommendation
    ? evaluateRecommendation(rejectedRecommendation, modelFacingEvent, policy)
    : null;
  const recommendationDecisions = [
    acceptedRecommendation && acceptedDecision
      ? { recommendation: acceptedRecommendation, decision: acceptedDecision }
      : null,
    rejectedRecommendation && rejectedDecision
      ? { recommendation: rejectedRecommendation, decision: rejectedDecision }
      : null,
  ].filter(Boolean);
  const auditLog = buildAuditLog({
    rawSignal,
    normalizedEvent,
    policy,
    policyDecision,
    recommendationDecisions,
  });

  return {
    schema: "neurofhe.gateway.demo.v1",
    project: "NeuroFHE Relay",
    boundaryDomain: "bio-digital-event-intelligence",
    caveat:
      "Simulated gateway scaffold only. It is not medical software, surveillance tooling, external control, mind reading, or production cryptography.",
    rawIntake: summarizeRawSignal(rawSignal),
    normalizedEvent: summarizeNormalizedEvent(normalizedEvent),
    policyDecision,
    acceptedRecommendation,
    acceptedDecision,
    rejectedRecommendation,
    rejectedDecision,
    auditLog,
    sanitizedReplayStream: buildSanitizedReplayStream(
      modelFacingEvent,
      [acceptedDecision, rejectedDecision].filter(Boolean),
    ),
  };
}

export function hashStable(value) {
  return hashText(JSON.stringify(sortForHash(value)));
}

function summarizeRawSignal(rawSignal) {
  return {
    schema: rawSignal.schema,
    intakeId: rawSignal.intakeId,
    observedAt: rawSignal.observedAt,
    receivedAt: rawSignal.receivedAt,
    localOnly: rawSignal.localOnly,
    sensitivity: rawSignal.sensitivity,
    sourceKind: rawSignal.source.kind,
    rawPayloadHash: hashStable(rawSignal.payload),
    rawPayload: "withheld-local-only",
  };
}

function summarizeNormalizedEvent(normalizedEvent) {
  return {
    schema: normalizedEvent.schema,
    eventId: normalizedEvent.eventId,
    eventType: normalizedEvent.eventType,
    sourceKind: normalizedEvent.sourceKind,
    confidence: normalizedEvent.confidence,
    validation: normalizedEvent.validation,
    featureSummary: normalizedEvent.features
      ? {
          representation: normalizedEvent.features.representation,
          featureShape: normalizedEvent.features.featureShape,
          windowMs: normalizedEvent.features.windowMs,
          encoder: normalizedEvent.features.encoder,
          metrics: normalizedEvent.features.metrics,
        }
      : null,
    encoder: normalizedEvent.features?.encoder ?? null,
    provenance: {
      intakeId: normalizedEvent.provenance.intakeId,
      rawPayloadHash: normalizedEvent.provenance.rawPayloadHash,
      sourceIdHash: normalizedEvent.provenance.sourceIdHash,
      simulated: normalizedEvent.provenance.simulated,
    },
  };
}

function encodeRawSignal(rawSignal, options) {
  if (rawSignal?.payload?.rawNeuralFrame) {
    const sorted = sortSpatialSpikes(
      rawSignal.payload.rawNeuralFrame,
      options.spatialSorterOptions ?? {},
    );
    return {
      eventWindow: sorted.eventWindow,
      encoder: summarizeSpikeSorter(sorted),
    };
  }

  return {
    eventWindow: rawSignal?.payload?.eventWindow,
    encoder: rawSignal?.payload?.eventWindow
      ? {
          id: "legacy-event-window-passthrough",
          implementationTarget: "local-simulation-only",
          outputSchema: rawSignal.payload.eventWindow.schema,
          productionClaim: false,
        }
      : null,
  };
}

function summarizeSpikeSorter(sorted) {
  return {
    id: sorted.encoder.id,
    schema: sorted.schema,
    implementationTarget: sorted.encoder.implementationTarget,
    algorithm: sorted.encoder.algorithm,
    outputSchema: sorted.eventWindow.schema,
    spatialBins: sorted.eventWindow.spatialBins,
    timeBins: sorted.eventWindow.timesteps,
    windowMs: sorted.eventWindow.windowMs,
    thresholdPolicy: {
      amplitudeThreshold: sorted.config.amplitudeThreshold,
      refractoryUs: sorted.config.refractoryUs,
      maxCountPerBin: sorted.config.maxCountPerBin,
    },
    metrics: sorted.metrics,
    productionClaim: false,
  };
}

function auditRecord(kind, at, details) {
  return {
    schema: "neurofhe.gateway.auditRecord.v1",
    recordId: `audit-${hashStable({ kind, at, details }).slice(0, 16)}`,
    at,
    kind,
    containsRawPayload: false,
    details,
  };
}

function bucketTimestamp(timestamp, bucketMs) {
  const value = Date.parse(timestamp);
  if (!Number.isFinite(value)) return "invalid-timestamp";
  return new Date(Math.floor(value / bucketMs) * bucketMs).toISOString();
}

function bucketTimestep(time, bucketSize) {
  return Math.floor(time / bucketSize) * bucketSize;
}

function densityBucket(density) {
  if (density === 0) return "0";
  if (density <= 0.1) return "0-0.1";
  if (density <= 0.25) return "0.1-0.25";
  if (density <= 0.5) return "0.25-0.5";
  return "0.5-1.0";
}

function countBucket(count) {
  if (count === 0) return "0";
  if (count <= 8) return "1-8";
  if (count <= 16) return "9-16";
  if (count <= 32) return "17-32";
  if (count <= 64) return "33-64";
  return "65+";
}

function isConfidence(value) {
  return typeof value === "number" && value >= 0 && value <= 1;
}

function hashText(text) {
  return createHash("sha256").update(String(text)).digest("hex");
}

function sortForHash(value) {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, sortForHash(item)]),
  );
}
