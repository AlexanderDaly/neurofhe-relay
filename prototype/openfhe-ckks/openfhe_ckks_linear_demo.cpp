// SPDX-License-Identifier: CC0-1.0

#include "openfhe.h"
#include "../openfhe_contract_loader.hpp"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <map>
#include <stdexcept>
#include <string>
#include <vector>

using namespace lbcrypto;

namespace {

struct ActiveEvent {
    std::size_t index;
    std::size_t timeBin;
    std::size_t neuronId;
    double value;
};

struct PublicActiveNeuronPosition {
    std::size_t index;
    std::size_t timeBin;
    std::size_t neuronId;
    std::size_t unitX;
    std::size_t unitY;
};

struct RunConfig {
    bool bootstrapSetup = false;
    std::string inputPath;
};

struct RunInput {
    std::string inputSource = "embedded-synthetic";
    std::string inputPath;
    std::string datasetKind = "synthetic-events-v0";
    std::string eventRepresentation = "spatial-sorted-events";
    std::vector<std::size_t> featureShape = {8, 8};
    std::vector<std::size_t> spatialBins = {4, 2};
    std::vector<ActiveEvent> events;
    std::vector<PublicActiveNeuronPosition> activeNeuronPositions;
    std::vector<std::string> classes;
    std::map<std::string, std::vector<double>> weights;
    std::map<std::string, double> bias;
    double approximationTolerance = 0.001;
};

struct Timings {
    double encryptionMs = 0.0;
    double scoringMs = 0.0;
    double decryptionMs = 0.0;
};

struct OperationCounts {
    std::size_t encryptions = 0;
    std::size_t plaintextMultiplies = 0;
    std::size_t scalarMultiplies = 0;
    std::size_t adds = 0;
    std::size_t rescaleOrModReduceOps = 0;
    std::size_t decryptions = 0;
};

using Clock = std::chrono::steady_clock;

RunConfig ParseArgs(int argc, char** argv) {
    RunConfig config;
    for (int i = 1; i < argc; ++i) {
        const std::string arg(argv[i]);
        if (arg == "--bootstrap") {
            config.bootstrapSetup = true;
        } else if (arg == "--input") {
            if (i + 1 >= argc) {
                throw std::invalid_argument("--input requires a JSON contract path");
            }
            config.inputPath = argv[++i];
        } else {
            throw std::invalid_argument("unknown argument: " + arg);
        }
    }
    return config;
}

double ElapsedMs(Clock::time_point start, Clock::time_point end) {
    return std::chrono::duration<double, std::milli>(end - start).count();
}

std::vector<std::vector<double>> SortedSpatialEventWindow() {
    return {
        {0, 1, 0, 0, 1, 0, 0, 0},
        {0, 1, 0, 1, 1, 0, 0, 0},
        {0, 0, 0, 1, 1, 0, 0, 0},
        {0, 0, 1, 1, 1, 0, 0, 0},
        {0, 0, 1, 0, 1, 1, 0, 0},
        {0, 0, 0, 0, 1, 1, 0, 0},
        {0, 0, 0, 0, 1, 0, 1, 0},
        {0, 0, 0, 0, 0, 0, 1, 0},
    };
}

std::vector<ActiveEvent> ActiveEvents(const std::vector<std::vector<double>>& values) {
    std::vector<ActiveEvent> events;
    const std::size_t channels = values.empty() ? 0 : values.front().size();
    for (std::size_t time = 0; time < values.size(); ++time) {
        for (std::size_t channel = 0; channel < values[time].size(); ++channel) {
            const auto value = values[time][channel];
            if (value != 0.0) {
                events.push_back({time * channels + channel, time, channel, value});
            }
        }
    }
    return events;
}

std::vector<PublicActiveNeuronPosition> PublicActiveNeuronPositions(
    const std::vector<ActiveEvent>& events,
    std::size_t spatialWidth) {
    std::vector<PublicActiveNeuronPosition> positions;
    positions.reserve(events.size());

    for (const auto& event : events) {
        positions.push_back({
            event.index,
            event.timeBin,
            event.neuronId,
            event.neuronId % spatialWidth,
            event.neuronId / spatialWidth,
        });
    }

    return positions;
}

std::vector<double> MakeNormalWeights() {
    const std::vector<double> pattern = {1, 2, 1, 1, 0, 0, 0, 0};
    std::vector<double> weights;
    weights.reserve(64);
    for (std::size_t index = 0; index < 64; ++index) {
        weights.push_back(pattern[index % pattern.size()]);
    }
    return weights;
}

std::vector<double> MakeAnomalyWeights() {
    const std::vector<double> pattern = {0, 0, 2, 2, 3, 3, 2, 0};
    std::vector<double> weights;
    weights.reserve(64);
    for (std::size_t index = 0; index < 64; ++index) {
        const std::size_t time = index / pattern.size();
        const double timeBonus = time >= 3 && time <= 6 ? 1.0 : 0.0;
        weights.push_back(pattern[index % pattern.size()] + timeBonus);
    }
    return weights;
}

RunInput EmbeddedSyntheticInput() {
    const auto values = SortedSpatialEventWindow();
    const auto events = ActiveEvents(values);
    RunInput input;
    input.inputSource = "embedded-synthetic";
    input.datasetKind = "synthetic-events-v0";
    input.eventRepresentation = "spatial-sorted-events";
    input.featureShape = {8, 8};
    input.spatialBins = {4, 2};
    input.events = events;
    input.activeNeuronPositions = PublicActiveNeuronPositions(events, 4);
    input.classes = {"normal", "anomaly"};
    input.weights = {
        {"normal", MakeNormalWeights()},
        {"anomaly", MakeAnomalyWeights()},
    };
    input.bias = {{"normal", 0.0}, {"anomaly", 0.0}};
    input.approximationTolerance = 0.001;
    return input;
}

RunInput ExternalContractInput(const std::string& path) {
    const auto contract = neurofhe::LoadSparseLinearContract<double>(
        path,
        false);
    RunInput input;
    input.inputSource = "external-contract";
    input.inputPath = path;
    input.datasetKind = contract.datasetKind;
    input.eventRepresentation = contract.eventRepresentation;
    input.featureShape = contract.featureShape;
    input.classes = contract.classes;
    input.weights = contract.weights;
    input.bias = contract.bias;
    input.approximationTolerance = contract.approximationTolerance;
    const std::size_t channels = input.featureShape.size() > 1 ? input.featureShape[1] : 1;
    input.spatialBins = {channels, 1};
    for (const auto& event : contract.activeEvents) {
        input.events.push_back({event.index, event.timeBin, event.neuronId, event.value});
    }
    input.activeNeuronPositions = PublicActiveNeuronPositions(input.events, channels);
    return input;
}

std::map<std::string, double> PlaintextScores(
    const std::vector<ActiveEvent>& events,
    const std::map<std::string, std::vector<double>>& weights,
    const std::map<std::string, double>& bias) {
    std::map<std::string, double> scores;
    for (const auto& [label, row] : weights) {
        double score = bias.at(label);
        for (const auto& event : events) {
            score += event.value * row[event.index];
        }
        scores[label] = score;
    }
    return scores;
}

std::string Classify(const std::map<std::string, double>& scores) {
    std::string bestLabel;
    double bestScore = 0.0;
    bool hasScore = false;
    for (const auto& [label, score] : scores) {
        if (!hasScore || score > bestScore || (score == bestScore && label < bestLabel)) {
            bestLabel = label;
            bestScore = score;
            hasScore = true;
        }
    }
    return bestLabel;
}

double MaxAbsScoreError(
    const std::map<std::string, double>& actual,
    const std::map<std::string, double>& expected) {
    double maxError = 0.0;
    for (const auto& [label, expectedScore] : expected) {
        maxError = std::max(maxError, std::abs(actual.at(label) - expectedScore));
    }
    return maxError;
}

void ConfigureOptionalBootstrapping(
    const CryptoContext<DCRTPoly>& cryptoContext,
    const PrivateKey<DCRTPoly>& secretKey,
    uint32_t slots,
    bool enabled) {
    if (!enabled) {
        return;
    }

    // Optional bootstrappable mode for deeper approximate pipelines. The included
    // sparse W x + b contract is intentionally shallow and runs in leveled mode.
    std::vector<uint32_t> levelBudget = {4, 4};
    std::vector<uint32_t> bsgsDim = {0, 0};
    cryptoContext->EvalBootstrapSetup(levelBudget, bsgsDim, slots);
    cryptoContext->EvalBootstrapKeyGen(secretKey, slots);
}

Plaintext CkksScalarPlaintext(const CryptoContext<DCRTPoly>& cryptoContext, double value) {
    return cryptoContext->MakeCKKSPackedPlaintext(std::vector<double>{value});
}

void PrintNumber(double value) {
    if (std::isfinite(value)) {
        std::cout << std::setprecision(12) << value;
    } else {
        std::cout << "null";
    }
}

void PrintScoreObject(const std::map<std::string, double>& scores) {
    std::cout << "{";
    bool first = true;
    for (const auto& [label, score] : scores) {
        if (!first) {
            std::cout << ",";
        }
        std::cout << "\"" << label << "\":";
        PrintNumber(score);
        first = false;
    }
    std::cout << "}";
}

void PrintStringArray(const std::vector<std::string>& values) {
    std::cout << "[";
    for (std::size_t index = 0; index < values.size(); ++index) {
        if (index > 0) {
            std::cout << ",";
        }
        std::cout << "\"" << values[index] << "\"";
    }
    std::cout << "]";
}

void PrintSizeArray(const std::vector<std::size_t>& values) {
    std::cout << "[";
    for (std::size_t index = 0; index < values.size(); ++index) {
        if (index > 0) {
            std::cout << ",";
        }
        std::cout << values[index];
    }
    std::cout << "]";
}

void PrintActiveNeuronPositions(const std::vector<PublicActiveNeuronPosition>& positions) {
    std::cout << "[";
    for (std::size_t index = 0; index < positions.size(); ++index) {
        const auto& position = positions[index];
        if (index > 0) {
            std::cout << ",";
        }
        std::cout << "{";
        std::cout << "\"index\":" << position.index << ",";
        std::cout << "\"timeBin\":" << position.timeBin << ",";
        std::cout << "\"neuronId\":" << position.neuronId << ",";
        std::cout << "\"unitX\":" << position.unitX << ",";
        std::cout << "\"unitY\":" << position.unitY;
        std::cout << "}";
    }
    std::cout << "]";
}

}  // namespace

int main(int argc, char** argv) {
    try {
        const auto config = ParseArgs(argc, argv);
        const auto input = config.inputPath.empty()
            ? EmbeddedSyntheticInput()
            : ExternalContractInput(config.inputPath);
        const auto& events = input.events;
        const auto& activeNeuronPositions = input.activeNeuronPositions;
        const auto& classes = input.classes;
        const auto& weights = input.weights;
        const auto& bias = input.bias;
        const auto expectedScores = PlaintextScores(events, weights, bias);

        CCParams<CryptoContextCKKSRNS> parameters;
        parameters.SetMultiplicativeDepth(config.bootstrapSetup ? 6 : 2);
        parameters.SetScalingModSize(50);
        parameters.SetFirstModSize(60);
        parameters.SetBatchSize(64);
        parameters.SetSecurityLevel(HEStd_128_classic);
        parameters.SetScalingTechnique(FLEXIBLEAUTO);

        CryptoContext<DCRTPoly> cryptoContext = GenCryptoContext(parameters);
        cryptoContext->Enable(PKE);
        cryptoContext->Enable(KEYSWITCH);
        cryptoContext->Enable(LEVELEDSHE);
        cryptoContext->Enable(ADVANCEDSHE);

        KeyPair<DCRTPoly> keyPair = cryptoContext->KeyGen();
        cryptoContext->EvalMultKeyGen(keyPair.secretKey);
        ConfigureOptionalBootstrapping(cryptoContext, keyPair.secretKey, 64, config.bootstrapSetup);

        OperationCounts operationCounts;
        Timings timings;

        const auto encryptionStart = Clock::now();
        std::vector<Ciphertext<DCRTPoly>> encryptedEvents;
        encryptedEvents.reserve(events.size());
        for (const auto& event : events) {
            encryptedEvents.push_back(
                cryptoContext->Encrypt(keyPair.publicKey, CkksScalarPlaintext(cryptoContext, event.value)));
            ++operationCounts.encryptions;
        }
        timings.encryptionMs = ElapsedMs(encryptionStart, Clock::now());

        const auto scoringStart = Clock::now();
        std::map<std::string, Ciphertext<DCRTPoly>> encryptedScores;
        for (const auto& label : classes) {
            auto acc = cryptoContext->Encrypt(keyPair.publicKey, CkksScalarPlaintext(cryptoContext, bias.at(label)));
            ++operationCounts.encryptions;

            for (std::size_t index = 0; index < events.size(); ++index) {
                const auto weight = weights.at(label)[events[index].index];
                auto weighted = cryptoContext->EvalMult(
                    encryptedEvents[index],
                    CkksScalarPlaintext(cryptoContext, weight));
                ++operationCounts.plaintextMultiplies;
                ++operationCounts.scalarMultiplies;
                ++operationCounts.rescaleOrModReduceOps;
                acc = cryptoContext->EvalAdd(acc, weighted);
                ++operationCounts.adds;
            }
            encryptedScores[label] = acc;
        }
        timings.scoringMs = ElapsedMs(scoringStart, Clock::now());

        const auto decryptionStart = Clock::now();
        std::map<std::string, double> decryptedScores;
        for (const auto& label : classes) {
            Plaintext result;
            cryptoContext->Decrypt(keyPair.secretKey, encryptedScores.at(label), &result);
            ++operationCounts.decryptions;
            result->SetLength(1);
            decryptedScores[label] = result->GetRealPackedValue()[0];
        }
        timings.decryptionMs = ElapsedMs(decryptionStart, Clock::now());

        const double maxAbsError = MaxAbsScoreError(decryptedScores, expectedScores);
        const bool classificationMatches = Classify(decryptedScores) == Classify(expectedScores);
        const bool withinTolerance = maxAbsError <= input.approximationTolerance && classificationMatches;
        const bool classOneGreaterThanClassZero = classes.size() >= 2
            ? expectedScores.at(classes[1]) > expectedScores.at(classes[0])
            : false;

        std::cout << "{";
        std::cout << "\"schema\":\"neurofhe.openfheCkks.result.v1\",";
        std::cout << "\"scheme\":\"openfhe-ckks\",";
        std::cout << "\"scoreEquation\":\"scores = W x + bias\",";
        std::cout << "\"scoreDomain\":\"approximate-real\",";
        std::cout << "\"featureValueDomain\":\"approximate-real-neural-features\",";
        std::cout << "\"inputSource\":\"" << input.inputSource << "\",";
        std::cout << "\"inputContractPath\":\"" << input.inputPath << "\",";
        std::cout << "\"datasetKind\":\"" << input.datasetKind << "\",";
        std::cout << "\"boundaryDomain\":\"bio-digital-event-intelligence\",";
        std::cout << "\"eventRepresentation\":\"" << input.eventRepresentation << "\",";
        std::cout << "\"encoder\":{";
        std::cout << "\"id\":\"canonical-spatial-aware-spike-sorter-v1\",";
        std::cout << "\"schema\":\"neurofhe.encoder.spatialSpikeSorter.v1\",";
        std::cout << "\"implementationTarget\":\"fpga-or-edge-fsm\",";
        std::cout << "\"outputSchema\":\"neurofhe.events.v1.spatial-sorter\",";
        std::cout << "\"productionClaim\":false";
        std::cout << "},";
        std::cout << "\"privacyMode\":{";
        std::cout << "\"id\":\"public-active-neuron-positions-encrypted-features\",";
        std::cout << "\"publicFields\":";
        PrintStringArray({
            "activeNeuronPositions",
            "featureShape",
            "publicModelWeights",
            "publicBias",
        });
        std::cout << ",";
        std::cout << "\"encryptedFields\":";
        PrintStringArray({"activeFeatureValues", "classScoreCiphertexts"});
        std::cout << ",";
        std::cout << "\"metadataLeakage\":";
        PrintStringArray({
            "active neuron identity and time-bin pattern",
            "exact sorted active event count",
            "coarse spatial activity",
        });
        std::cout << "},";
        std::cout << "\"ckksParameters\":{";
        std::cout << "\"multiplicativeDepth\":" << (config.bootstrapSetup ? 6 : 2) << ",";
        std::cout << "\"scalingModSize\":50,";
        std::cout << "\"firstModSize\":60,";
        std::cout << "\"batchSize\":64,";
        std::cout << "\"securityLevel\":\"HEStd_128_classic\",";
        std::cout << "\"rescalingTechnique\":\"FLEXIBLEAUTO\",";
        std::cout << "\"defaultMode\":\"" << (config.bootstrapSetup ? "bootstrapping-setup" : "leveled-no-bootstrap") << "\",";
        std::cout << "\"bootstrapping\":{\"supported\":true,\"enabled\":" << (config.bootstrapSetup ? "true" : "false") << "}";
        std::cout << "},";
        std::cout << "\"eventSchema\":\"neurofhe.events.v1.spatial-sorter\",";
        std::cout << "\"encoding\":\"spatial-binned-spike-count\",";
        std::cout << "\"featureShape\":";
        PrintSizeArray(input.featureShape);
        std::cout << ",";
        std::cout << "\"matrixShape\":[" << classes.size() << ",";
        std::cout << (input.featureShape.empty() ? 0 : input.featureShape[0] * (input.featureShape.size() > 1 ? input.featureShape[1] : 1));
        std::cout << "],";
        std::cout << "\"spatialBins\":";
        PrintSizeArray(input.spatialBins);
        std::cout << ",";
        std::cout << "\"activeEventCount\":" << events.size() << ",";
        std::cout << "\"activeNeuronPositions\":";
        PrintActiveNeuronPositions(activeNeuronPositions);
        std::cout << ",";
        std::cout << "\"scores\":";
        PrintScoreObject(decryptedScores);
        std::cout << ",";
        std::cout << "\"classification\":\"" << Classify(decryptedScores) << "\",";
        std::cout << "\"expectedScores\":";
        PrintScoreObject(expectedScores);
        std::cout << ",";
        std::cout << "\"expectedClassification\":\"" << Classify(expectedScores) << "\",";
        std::cout << "\"precision\":{";
        std::cout << "\"maxAbsScoreError\":";
        PrintNumber(maxAbsError);
        std::cout << ",\"tolerance\":";
        PrintNumber(input.approximationTolerance);
        std::cout << ",";
        std::cout << "\"withinTolerance\":" << (withinTolerance ? "true" : "false") << ",";
        std::cout << "\"classificationAgreement\":" << (classificationMatches ? "true" : "false");
        std::cout << "},";
        std::cout << "\"thresholdDecision\":{";
        std::cout << "\"mode\":\"client-side-after-decrypt\",";
        std::cout << "\"gate\":\"class_1_score_gt_class_0_score\",";
        std::cout << "\"class0\":\"" << (classes.empty() ? "" : classes[0]) << "\",";
        std::cout << "\"class1\":\"" << (classes.size() > 1 ? classes[1] : "") << "\",";
        std::cout << "\"expectedPlaintext\":" << (classOneGreaterThanClassZero ? "true" : "false") << ",";
        std::cout << "\"encryptedComparisonImplemented\":false";
        std::cout << "},";
        std::cout << "\"latencyMs\":{";
        std::cout << "\"encryption\":";
        PrintNumber(timings.encryptionMs);
        std::cout << ",\"linearScoring\":";
        PrintNumber(timings.scoringMs);
        std::cout << ",\"decryption\":";
        PrintNumber(timings.decryptionMs);
        std::cout << "},";
        std::cout << "\"memoryUsage\":{";
        std::cout << "\"ciphertextCount\":" << (encryptedEvents.size() + encryptedScores.size()) << ",";
        std::cout << "\"serializedCiphertextBytes\":null,";
        std::cout << "\"measurement\":\"portable demo reports ciphertext count; enable OpenFHE serialization for exact byte sizes\"";
        std::cout << "},";
        std::cout << "\"operationCounts\":{";
        std::cout << "\"encryptions\":" << operationCounts.encryptions << ",";
        std::cout << "\"scalarMultiplies\":" << operationCounts.scalarMultiplies << ",";
        std::cout << "\"plaintextMultiplies\":" << operationCounts.plaintextMultiplies << ",";
        std::cout << "\"adds\":" << operationCounts.adds << ",";
        std::cout << "\"rescaleOrModReduceOps\":" << operationCounts.rescaleOrModReduceOps << ",";
        std::cout << "\"decryptions\":" << operationCounts.decryptions;
        std::cout << "},";
        std::cout << "\"productionClaim\":false,";
        std::cout << "\"caveat\":\"Prototype OpenFHE CKKS approximate-real demo; parameters are for integration validation, not a production security claim.\"";
        std::cout << "}" << std::endl;

        return withinTolerance ? 0 : 1;
    } catch (const std::exception& error) {
        std::cerr << "openfhe_ckks_linear_demo failed: " << error.what() << std::endl;
        return 1;
    }
}
