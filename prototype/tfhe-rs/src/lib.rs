// SPDX-License-Identifier: CC0-1.0

use std::collections::BTreeMap;
use std::error::Error;
use std::fs;
use std::process::{self, Command};
use std::time::Instant;

use serde::Deserialize;
use serde_json::{json, Value};
use tfhe::prelude::*;
use tfhe::safe_serialization::safe_serialized_size;
use tfhe::{generate_keys, set_server_key, ConfigBuilder, FheBool, FheInt32, FheUint16};

type DemoResult<T> = Result<T, Box<dyn Error + Send + Sync>>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveEvent {
    pub index: usize,
    pub time_bin: usize,
    pub neuron_id: usize,
    pub value: u16,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PublicActiveNeuronPosition {
    pub index: usize,
    pub time_bin: usize,
    pub neuron_id: usize,
    pub unit_x: usize,
    pub unit_y: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LinearModel {
    pub classes: Vec<String>,
    pub normal_weights: Vec<u16>,
    pub anomaly_weights: Vec<u16>,
    pub normal_bias: u16,
    pub anomaly_bias: u16,
}

struct EncryptedScores {
    normal: FheUint16,
    anomaly: FheUint16,
}

pub fn sorted_spatial_event_window() -> Vec<Vec<u16>> {
    vec![
        vec![0, 1, 0, 0, 1, 0, 0, 0],
        vec![0, 1, 0, 1, 1, 0, 0, 0],
        vec![0, 0, 0, 1, 1, 0, 0, 0],
        vec![0, 0, 1, 1, 1, 0, 0, 0],
        vec![0, 0, 1, 0, 1, 1, 0, 0],
        vec![0, 0, 0, 0, 1, 1, 0, 0],
        vec![0, 0, 0, 0, 1, 0, 1, 0],
        vec![0, 0, 0, 0, 0, 0, 1, 0],
    ]
}

pub fn active_events(values: &[Vec<u16>]) -> Vec<ActiveEvent> {
    let channels = values.first().map_or(0, Vec::len);
    values
        .iter()
        .enumerate()
        .flat_map(|(time, row)| {
            row.iter().enumerate().filter_map(move |(channel, value)| {
                (*value > 0).then_some(ActiveEvent {
                    index: time * channels + channel,
                    time_bin: time,
                    neuron_id: channel,
                    value: *value,
                })
            })
        })
        .collect()
}

pub fn public_active_neuron_positions(
    events: &[ActiveEvent],
    spatial_width: usize,
) -> Vec<PublicActiveNeuronPosition> {
    events
        .iter()
        .map(|event| PublicActiveNeuronPosition {
            index: event.index,
            time_bin: event.time_bin,
            neuron_id: event.neuron_id,
            unit_x: event.neuron_id % spatial_width,
            unit_y: event.neuron_id / spatial_width,
        })
        .collect()
}

pub fn build_demo_linear_model(feature_count: usize, channels: usize) -> LinearModel {
    let normal_pattern = [1, 2, 1, 1, 0, 0, 0, 0];
    let anomaly_pattern = [0, 0, 2, 2, 3, 3, 2, 0];
    let normal_weights = (0..feature_count)
        .map(|index| normal_pattern[index % channels])
        .collect();
    let anomaly_weights = (0..feature_count)
        .map(|index| {
            let channel = index % channels;
            let time = index / channels;
            let time_bonus = u16::from((3..=6).contains(&time));
            anomaly_pattern[channel] + time_bonus
        })
        .collect();

    LinearModel {
        classes: vec!["normal".to_string(), "anomaly".to_string()],
        normal_weights,
        anomaly_weights,
        normal_bias: 0,
        anomaly_bias: 0,
    }
}

pub fn plaintext_scores(events: &[ActiveEvent], model: &LinearModel) -> BTreeMap<String, u16> {
    let normal = events.iter().fold(model.normal_bias, |sum, event| {
        sum + event.value * model.normal_weights[event.index]
    });
    let anomaly = events.iter().fold(model.anomaly_bias, |sum, event| {
        sum + event.value * model.anomaly_weights[event.index]
    });

    BTreeMap::from([
        ("normal".to_string(), normal),
        ("anomaly".to_string(), anomaly),
    ])
}

pub fn classify(scores: &BTreeMap<String, u16>) -> String {
    scores
        .iter()
        .max_by(|left, right| left.1.cmp(right.1).then_with(|| right.0.cmp(left.0)))
        .map(|(label, _score)| label.clone())
        .unwrap_or_else(|| "unknown".to_string())
}

pub fn run_tfhe_sparse_classifier_json() -> DemoResult<Value> {
    let started = Instant::now();
    let values = sorted_spatial_event_window();
    let events = active_events(&values);
    let positions = public_active_neuron_positions(&events, 4);
    let feature_count = values.len() * values.first().map_or(0, Vec::len);
    let channels = values.first().map_or(0, Vec::len);
    let model = build_demo_linear_model(feature_count, channels);
    let expected_scores = plaintext_scores(&events, &model);
    let expected_classification = classify(&expected_scores);

    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);
    set_server_key(server_key);

    let mut operation_counts = OperationCounts::default();
    let encrypted_events: Vec<FheUint16> = events
        .iter()
        .map(|event| {
            operation_counts.encryptions += 1;
            FheUint16::encrypt(event.value, &client_key)
        })
        .collect();

    let encrypted_scores = evaluate_encrypted_scores(
        &encrypted_events,
        &events,
        &model,
        &mut operation_counts,
        &client_key,
    );

    let encrypted_decision: FheBool = encrypted_scores.anomaly.gt(&encrypted_scores.normal);
    operation_counts.encrypted_comparisons += 1;

    let normal_score: u16 = encrypted_scores.normal.decrypt(&client_key);
    operation_counts.decryptions += 1;
    let anomaly_score: u16 = encrypted_scores.anomaly.decrypt(&client_key);
    operation_counts.decryptions += 1;
    let decision_bit: bool = encrypted_decision.decrypt(&client_key);
    operation_counts.decryptions += 1;

    let decrypted_scores = BTreeMap::from([
        ("normal".to_string(), normal_score),
        ("anomaly".to_string(), anomaly_score),
    ]);
    let classification = classify(&decrypted_scores);
    let ciphertext_bytes =
        measure_ciphertext_bytes(&encrypted_events, &encrypted_scores, &encrypted_decision)?;
    let memory_usage = measure_memory_usage_json();

    Ok(json!({
        "schema": "neurofhe.tfheRs.result.v1",
        "scheme": "tfhe-rs-integer-threshold",
        "scoreEquation": "scores = W x + bias",
        "boundaryDomain": "bio-digital-event-intelligence",
        "eventRepresentation": "spatial-sorted-events",
        "encoder": {
            "id": "canonical-spatial-aware-spike-sorter-v1",
            "schema": "neurofhe.encoder.spatialSpikeSorter.v1",
            "implementationTarget": "fpga-or-edge-fsm",
            "outputSchema": "neurofhe.events.v1.spatial-sorter",
            "productionClaim": false,
        },
        "privacyMode": {
            "id": "public-active-neuron-positions-encrypted-features",
            "publicFields": [
                "activeNeuronPositions",
                "featureShape",
                "publicModelWeights",
                "publicBias"
            ],
            "encryptedFields": [
                "activeFeatureValues",
                "classScoreCiphertexts",
                "thresholdDecisionBit"
            ],
            "metadataLeakage": [
                "active neuron identity and time-bin pattern",
                "exact sorted active event count",
                "coarse spatial activity"
            ]
        },
        "eventSchema": "neurofhe.events.v1.spatial-sorter",
        "encoding": "spatial-binned-spike-count",
        "featureShape": [8, 8],
        "spatialBins": [4, 2],
        "activeEventCount": events.len(),
        "activeNeuronPositions": positions.iter().map(position_json).collect::<Vec<_>>(),
        "scores": decrypted_scores,
        "classification": classification,
        "expectedScores": expected_scores,
        "expectedClassification": expected_classification,
        "plaintextMatchesExpected": decrypted_scores == expected_scores && classification == expected_classification,
        "booleanDecision": {
            "schema": "neurofhe.tfheRs.booleanDecisionResult.v1",
            "gate": "anomaly_score_gt_normal_score",
            "encryptedResultType": "FheBool",
            "decrypted": decision_bit,
            "expectedPlaintext": expected_scores["anomaly"] > expected_scores["normal"],
            "matchesExpected": decision_bit == (expected_scores["anomaly"] > expected_scores["normal"])
        },
        "operationCounts": operation_counts.to_json(),
        "ciphertextBytes": ciphertext_bytes,
        "accuracy": {
            "schema": "neurofhe.accuracy.v1",
            "metric": "single-window-plaintext-agreement",
            "value": u8::from(decrypted_scores == expected_scores && classification == expected_classification && decision_bit),
            "sampleCount": 1,
            "caveat": "Synthetic contract agreement on one event window, not dataset accuracy."
        },
        "securityParameters": {
            "schema": "neurofhe.securityParameters.v1",
            "scheme": "tfhe-rs-integer-threshold",
            "library": "TFHE-rs",
            "crate": "tfhe",
            "crateVersion": "1.6.1",
            "configuration": "ConfigBuilder::default() high-level API",
            "encryptedTypes": ["FheUint16", "FheBool"],
            "reproducibility": "Synthetic event/model data are deterministic; key generation uses runtime cryptographic randomness.",
            "productionClaim": false
        },
        "cryptoInventory": {
            "schema": "neurofhe.crypto.inventory.v1",
            "encryptedComputation": ["tfhe-rs-1.6.1-integer-boolean-research-only"],
            "tfheRs": {
                "crate": "tfhe",
                "version": "1.6.1",
                "features": ["boolean", "integer"],
                "defaultFeatures": false,
                "role": "encrypted sparse integer scoring plus encrypted Boolean threshold/comparison gate"
            },
            "productionClaim": false
        },
        "privacyBoundary": {
            "schema": "neurofhe.tfheRs.privacyBoundary.v1",
            "gatewaySees": [
                "sorted event window",
                "active event values before encryption",
                "active event positions"
            ],
            "computeSees": [
                "approved active event positions",
                "public model weights",
                "public model bias",
                "encrypted TFHE-rs active spike values",
                "encrypted TFHE-rs class scores",
                "encrypted TFHE-rs threshold decision bit"
            ],
            "clientSees": [
                "decrypted class scores",
                "decrypted threshold decision bit",
                "final classification"
            ],
            "withheld": [
                "raw neural samples",
                "raw electrode identifiers",
                "raw sample timestamp order",
                "device identifiers",
                "local subject or session references",
                "operator notes"
            ],
            "productionClaim": false
        },
        "latencyMs": elapsed_ms(started),
        "memoryUsage": memory_usage,
        "productionClaim": false,
        "caveat": "research-alpha TFHE-rs native lane only; not production cryptography, not clinical validation, and not side-channel reviewed."
    }))
}

fn evaluate_encrypted_scores(
    encrypted_events: &[FheUint16],
    events: &[ActiveEvent],
    model: &LinearModel,
    operation_counts: &mut OperationCounts,
    client_key: &tfhe::ClientKey,
) -> EncryptedScores {
    let normal = evaluate_class_score(
        encrypted_events,
        events,
        &model.normal_weights,
        model.normal_bias,
        operation_counts,
        client_key,
    );
    let anomaly = evaluate_class_score(
        encrypted_events,
        events,
        &model.anomaly_weights,
        model.anomaly_bias,
        operation_counts,
        client_key,
    );

    EncryptedScores { normal, anomaly }
}

fn evaluate_class_score(
    encrypted_events: &[FheUint16],
    events: &[ActiveEvent],
    weights: &[u16],
    bias: u16,
    operation_counts: &mut OperationCounts,
    client_key: &tfhe::ClientKey,
) -> FheUint16 {
    operation_counts.encryptions += 1;
    let mut acc = FheUint16::encrypt(bias, client_key);

    for (ciphertext, event) in encrypted_events.iter().zip(events.iter()) {
        let weighted = ciphertext * weights[event.index];
        operation_counts.scalar_multiplies += 1;
        acc = &acc + &weighted;
        operation_counts.adds += 1;
    }

    acc
}

fn measure_ciphertext_bytes(
    encrypted_events: &[FheUint16],
    encrypted_scores: &EncryptedScores,
    encrypted_decision: &FheBool,
) -> DemoResult<Value> {
    let active_values = encrypted_events
        .iter()
        .map(safe_serialized_size)
        .try_fold(0_u64, |sum, item| item.map(|size| sum + size))?;
    let normal_score = safe_serialized_size(&encrypted_scores.normal)?;
    let anomaly_score = safe_serialized_size(&encrypted_scores.anomaly)?;
    let decision_bit = safe_serialized_size(encrypted_decision)?;
    let class_scores = normal_score + anomaly_score;

    Ok(json!({
        "activeValueCiphertexts": active_values,
        "classScoreCiphertexts": class_scores,
        "thresholdDecisionBit": decision_bit,
        "total": active_values + class_scores + decision_bit,
        "measurement": "TFHE-rs safe_serialized_size",
    }))
}

fn measure_memory_usage_json() -> Value {
    let rss_bytes = current_process_rss_bytes();
    json!({
        "rssBytes": rss_bytes,
        "measurement": "current process RSS via ps -o rss= -p <pid>; KiB converted to bytes",
        "source": "operating-system process table",
        "caveat": "Single end-of-run RSS sample on the local host; not peak RSS, dataset-scale memory, side-channel evidence, or stable performance evidence."
    })
}

fn current_process_rss_bytes() -> Option<u64> {
    let output = Command::new("ps")
        .args(["-o", "rss=", "-p", &process::id().to_string()])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    rss_bytes_from_ps_kib(String::from_utf8_lossy(&output.stdout).as_ref())
}

fn rss_bytes_from_ps_kib(output: &str) -> Option<u64> {
    output.trim().parse::<u64>().ok()?.checked_mul(1024)
}

fn position_json(position: &PublicActiveNeuronPosition) -> Value {
    json!({
        "index": position.index,
        "timeBin": position.time_bin,
        "neuronId": position.neuron_id,
        "unitX": position.unit_x,
        "unitY": position.unit_y,
    })
}

fn elapsed_ms(started: Instant) -> f64 {
    let elapsed = started.elapsed();
    (elapsed.as_secs_f64() * 1000.0 * 1000.0).round() / 1000.0
}

#[derive(Default)]
struct OperationCounts {
    encryptions: usize,
    scalar_multiplies: usize,
    adds: usize,
    encrypted_comparisons: usize,
    decryptions: usize,
}

impl OperationCounts {
    fn to_json(&self) -> Value {
        json!({
            "encryptions": self.encryptions,
            "scalarMultiplies": self.scalar_multiplies,
            "adds": self.adds,
            "encryptedComparisons": self.encrypted_comparisons,
            "decryptions": self.decryptions,
        })
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RealDataActiveEvent {
    index: usize,
    #[serde(default)]
    time_bin: usize,
    #[serde(default)]
    neuron_id: usize,
    value: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RealDataContract {
    #[serde(default)]
    score_domain: Option<String>,
    #[serde(default)]
    fixed_point_scale: Option<i64>,
    #[serde(default)]
    dataset_kind: Option<String>,
    classes: Vec<String>,
    #[serde(default)]
    feature_shape: Vec<usize>,
    #[serde(default)]
    spatial_bins: Option<Vec<usize>>,
    active_events: Vec<RealDataActiveEvent>,
    weights: BTreeMap<String, Vec<i64>>,
    bias: BTreeMap<String, i64>,
    #[serde(default)]
    expected_classification: Option<String>,
    #[serde(default)]
    public_active_neuron_positions: Vec<Value>,
    #[serde(default)]
    source_contract_digest: Option<Value>,
}

// Runs the encrypted sparse linear scorer over an EEG-derived signed-integer
// contract. Unlike the synthetic demo, values, weights, and bias are signed
// fixed-point integers, so the lane uses signed FheInt32 ciphertexts. The
// decision compares the second class score against the first (e.g. eye-open vs
// eye-closed), mirroring the synthetic anomaly-vs-normal gate.
pub fn run_tfhe_real_data_classifier_json(contract_path: &str) -> DemoResult<Value> {
    let started = Instant::now();
    let raw = fs::read_to_string(contract_path)?;
    let contract: RealDataContract = serde_json::from_str(&raw)?;

    if contract.classes.len() != 2 {
        return Err(format!(
            "real-data TFHE-rs contract must declare exactly two classes, found {}",
            contract.classes.len()
        )
        .into());
    }
    let baseline_label = contract.classes[0].clone();
    let positive_label = contract.classes[1].clone();
    let baseline_weights = contract
        .weights
        .get(&baseline_label)
        .ok_or_else(|| format!("missing weights for class {baseline_label}"))?;
    let positive_weights = contract
        .weights
        .get(&positive_label)
        .ok_or_else(|| format!("missing weights for class {positive_label}"))?;
    let baseline_bias = *contract
        .bias
        .get(&baseline_label)
        .ok_or_else(|| format!("missing bias for class {baseline_label}"))?;
    let positive_bias = *contract
        .bias
        .get(&positive_label)
        .ok_or_else(|| format!("missing bias for class {positive_label}"))?;

    let expected_scores = real_plaintext_scores(
        &contract.active_events,
        baseline_weights,
        positive_weights,
        baseline_bias,
        positive_bias,
        &baseline_label,
        &positive_label,
    );
    let expected_classification = argmax_label(&expected_scores, &baseline_label, &positive_label);
    let expected_decision = expected_scores[&positive_label] > expected_scores[&baseline_label];

    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);
    set_server_key(server_key);

    let mut operation_counts = OperationCounts::default();
    let encrypted_events: Vec<FheInt32> = contract
        .active_events
        .iter()
        .map(|event| {
            operation_counts.encryptions += 1;
            FheInt32::encrypt(value_as_i32(event.value), &client_key)
        })
        .collect();

    let baseline_ct = evaluate_real_class_score(
        &encrypted_events,
        &contract.active_events,
        baseline_weights,
        baseline_bias,
        &mut operation_counts,
        &client_key,
    );
    let positive_ct = evaluate_real_class_score(
        &encrypted_events,
        &contract.active_events,
        positive_weights,
        positive_bias,
        &mut operation_counts,
        &client_key,
    );

    let encrypted_decision: FheBool = positive_ct.gt(&baseline_ct);
    operation_counts.encrypted_comparisons += 1;

    let baseline_score: i32 = baseline_ct.decrypt(&client_key);
    operation_counts.decryptions += 1;
    let positive_score: i32 = positive_ct.decrypt(&client_key);
    operation_counts.decryptions += 1;
    let decision_bit: bool = encrypted_decision.decrypt(&client_key);
    operation_counts.decryptions += 1;

    let decrypted_scores: BTreeMap<String, i64> = BTreeMap::from([
        (baseline_label.clone(), i64::from(baseline_score)),
        (positive_label.clone(), i64::from(positive_score)),
    ]);
    let classification = argmax_label(&decrypted_scores, &baseline_label, &positive_label);
    let ciphertext_bytes = measure_real_ciphertext_bytes(
        &encrypted_events,
        &baseline_ct,
        &positive_ct,
        &encrypted_decision,
    )?;
    let memory_usage = measure_memory_usage_json();
    let plaintext_matches = decrypted_scores == expected_scores
        && classification == expected_classification
        && decision_bit == expected_decision;
    let gate = format!("{positive_label}_score_gt_{baseline_label}_score");

    Ok(json!({
        "schema": "neurofhe.tfheRs.realDataResult.v1",
        "scheme": "tfhe-rs-integer-threshold",
        "scoreDomain": "signed-fixed-point-integers",
        "fixedPointScale": contract.fixed_point_scale,
        "scoreEquation": "scores = W x + bias",
        "boundaryDomain": "bio-digital-event-intelligence",
        "eventRepresentation": "spatial-sorted-events",
        "datasetKind": contract.dataset_kind,
        "sourceContractDigest": contract.source_contract_digest,
        "classes": contract.classes,
        "baselineClass": baseline_label,
        "positiveClass": positive_label,
        "featureShape": contract.feature_shape,
        "spatialBins": contract.spatial_bins,
        "activeEventCount": contract.active_events.len(),
        "activeNeuronPositions": contract.public_active_neuron_positions,
        "privacyMode": {
            "id": "public-active-neuron-positions-encrypted-features",
            "publicFields": [
                "activeNeuronPositions",
                "featureShape",
                "publicModelWeights",
                "publicBias"
            ],
            "encryptedFields": [
                "activeFeatureValues",
                "classScoreCiphertexts",
                "thresholdDecisionBit"
            ],
            "metadataLeakage": [
                "active neuron identity and time-bin pattern",
                "exact sorted active event count",
                "coarse spatial activity"
            ]
        },
        "scores": decrypted_scores,
        "classification": classification,
        "expectedScores": expected_scores,
        "expectedClassification": expected_classification,
        "contractExpectedClassification": contract.expected_classification,
        "plaintextMatchesExpected": plaintext_matches,
        "booleanDecision": {
            "schema": "neurofhe.tfheRs.booleanDecisionResult.v1",
            "gate": gate,
            "encryptedResultType": "FheBool",
            "decrypted": decision_bit,
            "expectedPlaintext": expected_decision,
            "matchesExpected": decision_bit == expected_decision
        },
        "operationCounts": operation_counts.to_json(),
        "ciphertextBytes": ciphertext_bytes,
        "accuracy": {
            "schema": "neurofhe.accuracy.v1",
            "metric": "single-window-plaintext-agreement",
            "value": u8::from(plaintext_matches),
            "sampleCount": 1,
            "caveat": "Single EEG-derived event-window contract agreement, not dataset accuracy."
        },
        "securityParameters": {
            "schema": "neurofhe.securityParameters.v1",
            "scheme": "tfhe-rs-integer-threshold",
            "library": "TFHE-rs",
            "crate": "tfhe",
            "crateVersion": "1.6.1",
            "configuration": "ConfigBuilder::default() high-level API",
            "encryptedTypes": ["FheInt32", "FheBool"],
            "reproducibility": "EEG-derived contract values are deterministic; key generation uses runtime cryptographic randomness.",
            "productionClaim": false
        },
        "cryptoInventory": {
            "schema": "neurofhe.crypto.inventory.v1",
            "encryptedComputation": ["tfhe-rs-1.6.1-integer-boolean-research-only"],
            "tfheRs": {
                "crate": "tfhe",
                "version": "1.6.1",
                "features": ["boolean", "integer"],
                "defaultFeatures": false,
                "role": "encrypted signed sparse integer scoring plus encrypted Boolean threshold/comparison gate"
            },
            "productionClaim": false
        },
        "privacyBoundary": {
            "schema": "neurofhe.tfheRs.privacyBoundary.v1",
            "gatewaySees": [
                "EEG-derived sorted event window",
                "active event values before encryption",
                "active event positions"
            ],
            "computeSees": [
                "approved active event positions",
                "public model weights",
                "public model bias",
                "encrypted TFHE-rs active spike values",
                "encrypted TFHE-rs class scores",
                "encrypted TFHE-rs threshold decision bit"
            ],
            "clientSees": [
                "decrypted class scores",
                "decrypted threshold decision bit",
                "final classification"
            ],
            "withheld": [
                "raw EEG samples",
                "raw electrode identifiers",
                "raw sample timestamp order",
                "device identifiers",
                "local subject or session references",
                "operator notes"
            ],
            "productionClaim": false
        },
        "latencyMs": elapsed_ms(started),
        "memoryUsage": memory_usage,
        "productionClaim": false,
        "caveat": "research-alpha TFHE-rs native lane on an EEG-derived quantized contract; not production cryptography, not clinical validation, and not side-channel reviewed."
    }))
}

fn evaluate_real_class_score(
    encrypted_events: &[FheInt32],
    events: &[RealDataActiveEvent],
    weights: &[i64],
    bias: i64,
    operation_counts: &mut OperationCounts,
    client_key: &tfhe::ClientKey,
) -> FheInt32 {
    operation_counts.encryptions += 1;
    let mut acc = FheInt32::encrypt(value_as_i32(bias), client_key);

    for (ciphertext, event) in encrypted_events.iter().zip(events.iter()) {
        let weight = value_as_i32(weights[event.index]);
        let weighted = ciphertext * weight;
        operation_counts.scalar_multiplies += 1;
        acc = &acc + &weighted;
        operation_counts.adds += 1;
    }

    acc
}

fn real_plaintext_scores(
    events: &[RealDataActiveEvent],
    baseline_weights: &[i64],
    positive_weights: &[i64],
    baseline_bias: i64,
    positive_bias: i64,
    baseline_label: &str,
    positive_label: &str,
) -> BTreeMap<String, i64> {
    let baseline = events
        .iter()
        .fold(baseline_bias, |sum, event| sum + event.value * baseline_weights[event.index]);
    let positive = events
        .iter()
        .fold(positive_bias, |sum, event| sum + event.value * positive_weights[event.index]);
    BTreeMap::from([
        (baseline_label.to_string(), baseline),
        (positive_label.to_string(), positive),
    ])
}

fn argmax_label(scores: &BTreeMap<String, i64>, baseline_label: &str, positive_label: &str) -> String {
    let baseline = scores.get(baseline_label).copied().unwrap_or(i64::MIN);
    let positive = scores.get(positive_label).copied().unwrap_or(i64::MIN);
    if positive > baseline {
        positive_label.to_string()
    } else {
        baseline_label.to_string()
    }
}

fn value_as_i32(value: i64) -> i32 {
    value.clamp(i64::from(i32::MIN), i64::from(i32::MAX)) as i32
}

fn measure_real_ciphertext_bytes(
    encrypted_events: &[FheInt32],
    baseline_score: &FheInt32,
    positive_score: &FheInt32,
    encrypted_decision: &FheBool,
) -> DemoResult<Value> {
    let active_values = encrypted_events
        .iter()
        .map(safe_serialized_size)
        .try_fold(0_u64, |sum, item| item.map(|size| sum + size))?;
    let baseline_bytes = safe_serialized_size(baseline_score)?;
    let positive_bytes = safe_serialized_size(positive_score)?;
    let decision_bit = safe_serialized_size(encrypted_decision)?;
    let class_scores = baseline_bytes + positive_bytes;

    Ok(json!({
        "activeValueCiphertexts": active_values,
        "classScoreCiphertexts": class_scores,
        "thresholdDecisionBit": decision_bit,
        "total": active_values + class_scores + decision_bit,
        "measurement": "TFHE-rs safe_serialized_size",
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sparse_event_window_matches_repo_contract() {
        let values = sorted_spatial_event_window();
        let events = active_events(&values);
        let positions = public_active_neuron_positions(&events, 4);

        assert_eq!(values.len(), 8);
        assert_eq!(values[0].len(), 8);
        assert_eq!(events.len(), 18);
        assert_eq!(
            positions[0],
            PublicActiveNeuronPosition {
                index: 1,
                time_bin: 0,
                neuron_id: 1,
                unit_x: 1,
                unit_y: 0,
            }
        );
    }

    #[test]
    fn plaintext_scores_match_openfhe_contract() {
        let values = sorted_spatial_event_window();
        let events = active_events(&values);
        let model = build_demo_linear_model(64, 8);
        let scores = plaintext_scores(&events, &model);

        assert_eq!(scores["normal"], 9);
        assert_eq!(scores["anomaly"], 51);
        assert_eq!(classify(&scores), "anomaly");
    }

    #[test]
    fn rss_parser_converts_ps_kib_output_to_bytes() {
        assert_eq!(rss_bytes_from_ps_kib(" 2048\n"), Some(2_097_152));
        assert_eq!(rss_bytes_from_ps_kib("not-a-number\n"), None);
    }
}
