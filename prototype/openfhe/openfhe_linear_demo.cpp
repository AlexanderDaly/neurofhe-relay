// SPDX-License-Identifier: CC0-1.0

#include "openfhe.h"
#include "../openfhe_contract_loader.hpp"

#include "ciphertext-ser.h"
#include "cryptocontext-ser.h"
#include "scheme/bfvrns/bfvrns-ser.h"

#include <cstdint>
#include <fstream>
#include <iostream>
#include <map>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

using namespace lbcrypto;

namespace {

struct ActiveEvent {
    std::size_t index;
    std::size_t timeBin;
    std::size_t neuronId;
    int64_t value;
};

struct PublicActiveNeuronPosition {
    std::size_t index;
    std::size_t timeBin;
    std::size_t neuronId;
    std::size_t unitX;
    std::size_t unitY;
};

struct RunConfig {
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
    std::map<std::string, std::vector<int64_t>> weights;
    std::map<std::string, int64_t> bias;
    uint64_t plaintextModulus = 65537;
    double fixedPointScale = 1.0;
};

RunConfig ParseArgs(int argc, char** argv) {
    RunConfig config;
    for (int index = 1; index < argc; ++index) {
        const std::string arg(argv[index]);
        if (arg == "--input") {
            if (index + 1 >= argc) {
                throw std::invalid_argument("--input requires a JSON contract path");
            }
            config.inputPath = argv[++index];
        } else {
            throw std::invalid_argument("unknown argument: " + arg);
        }
    }
    return config;
}

std::vector<std::vector<int64_t>> SortedSpatialEventWindow() {
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

std::vector<ActiveEvent> ActiveEvents(const std::vector<std::vector<int64_t>>& values) {
    std::vector<ActiveEvent> events;
    const std::size_t channels = values.empty() ? 0 : values.front().size();
    for (std::size_t time = 0; time < values.size(); ++time) {
        for (std::size_t channel = 0; channel < values[time].size(); ++channel) {
            const auto value = values[time][channel];
            if (value > 0) {
                events.push_back({time * channels + channel, time, channel, value});
            }
        }
    }
    return events;
}

std::vector<int64_t> MakeNormalWeights();
std::vector<int64_t> MakeAnomalyWeights();

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
    input.bias = {{"normal", 0}, {"anomaly", 0}};
    input.plaintextModulus = 65537;
    input.fixedPointScale = 1.0;
    return input;
}

RunInput ExternalContractInput(const std::string& path) {
    const auto contract = neurofhe::LoadSparseLinearContract<int64_t>(
        path,
        true);
    RunInput input;
    input.inputSource = "external-contract";
    input.inputPath = path;
    input.datasetKind = contract.datasetKind;
    input.eventRepresentation = contract.eventRepresentation;
    input.featureShape = contract.featureShape;
    input.classes = contract.classes;
    input.weights = contract.weights;
    input.bias = contract.bias;
    input.plaintextModulus = contract.plaintextModulus;
    input.fixedPointScale = contract.fixedPointScale;
    const std::size_t channels = input.featureShape.size() > 1 ? input.featureShape[1] : 1;
    input.spatialBins = {channels, 1};
    for (const auto& event : contract.activeEvents) {
        input.events.push_back({event.index, event.timeBin, event.neuronId, event.value});
    }
    input.activeNeuronPositions = PublicActiveNeuronPositions(input.events, channels);
    return input;
}

std::vector<int64_t> MakeNormalWeights() {
    const std::vector<int64_t> pattern = {1, 2, 1, 1, 0, 0, 0, 0};
    std::vector<int64_t> weights;
    weights.reserve(64);
    for (std::size_t index = 0; index < 64; ++index) {
        weights.push_back(pattern[index % pattern.size()]);
    }
    return weights;
}

std::vector<int64_t> MakeAnomalyWeights() {
    const std::vector<int64_t> pattern = {0, 0, 2, 2, 3, 3, 2, 0};
    std::vector<int64_t> weights;
    weights.reserve(64);
    for (std::size_t index = 0; index < 64; ++index) {
        const std::size_t time = index / pattern.size();
        const int64_t timeBonus = time >= 3 && time <= 6 ? 1 : 0;
        weights.push_back(pattern[index % pattern.size()] + timeBonus);
    }
    return weights;
}

std::map<std::string, int64_t> PlaintextScores(
    const std::vector<ActiveEvent>& events,
    const std::map<std::string, std::vector<int64_t>>& weights,
    const std::map<std::string, int64_t>& bias) {
    std::map<std::string, int64_t> scores;
    for (const auto& [label, row] : weights) {
        int64_t score = bias.at(label);
        for (const auto& event : events) {
            score += event.value * row[event.index];
        }
        scores[label] = score;
    }
    return scores;
}

std::string Classify(const std::map<std::string, int64_t>& scores) {
    std::string bestLabel;
    int64_t bestScore = 0;
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

void PrintScoreObject(const std::map<std::string, int64_t>& scores) {
    std::cout << "{";
    bool first = true;
    for (const auto& [label, score] : scores) {
        if (!first) {
            std::cout << ",";
        }
        std::cout << "\"" << label << "\":" << score;
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

std::size_t SerializedCiphertextBytes(const Ciphertext<DCRTPoly>& ciphertext) {
    std::stringstream stream;
    Serial::Serialize(ciphertext, stream, SerType::BINARY);
    stream.seekg(0, std::ios::end);
    const auto position = stream.tellg();
    return position > 0 ? static_cast<std::size_t>(position) : 0;
}

std::optional<uint64_t> CurrentRssBytes() {
    std::ifstream status("/proc/self/status");
    if (!status.is_open()) {
        return std::nullopt;
    }
    std::string line;
    while (std::getline(status, line)) {
        if (line.rfind("VmRSS:", 0) == 0) {
            std::istringstream parser(line.substr(6));
            uint64_t kib = 0;
            parser >> kib;
            return kib * 1024ULL;
        }
    }
    return std::nullopt;
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

    CCParams<CryptoContextBFVRNS> parameters;
    parameters.SetPlaintextModulus(input.plaintextModulus);
    parameters.SetMultiplicativeDepth(1);
    parameters.SetBatchSize(1);
    parameters.SetSecurityLevel(HEStd_128_classic);

    CryptoContext<DCRTPoly> cryptoContext = GenCryptoContext(parameters);
    cryptoContext->Enable(PKE);
    cryptoContext->Enable(KEYSWITCH);
    cryptoContext->Enable(LEVELEDSHE);

    KeyPair<DCRTPoly> keyPair = cryptoContext->KeyGen();
    cryptoContext->EvalMultKeyGen(keyPair.secretKey);

    std::vector<Ciphertext<DCRTPoly>> encryptedEvents;
    encryptedEvents.reserve(events.size());
    std::size_t encryptions = 0;
    std::size_t scalarMultiplies = 0;
    std::size_t adds = 0;
    std::size_t decryptions = 0;

    for (const auto& event : events) {
        Plaintext plaintext = cryptoContext->MakePackedPlaintext({event.value});
        encryptedEvents.push_back(cryptoContext->Encrypt(keyPair.publicKey, plaintext));
        ++encryptions;
    }

    std::map<std::string, Ciphertext<DCRTPoly>> encryptedScores;
    for (const auto& label : classes) {
        Plaintext biasPlaintext = cryptoContext->MakePackedPlaintext({bias.at(label)});
        auto acc = cryptoContext->Encrypt(keyPair.publicKey, biasPlaintext);
        ++encryptions;

        for (std::size_t index = 0; index < events.size(); ++index) {
            const auto weight = weights.at(label)[events[index].index];
            Plaintext weightPlaintext = cryptoContext->MakePackedPlaintext({weight});
            auto weighted = cryptoContext->EvalMult(encryptedEvents[index], weightPlaintext);
            ++scalarMultiplies;
            acc = cryptoContext->EvalAdd(acc, weighted);
            ++adds;
        }
        encryptedScores[label] = acc;
    }

    std::map<std::string, int64_t> decryptedScores;
    for (const auto& label : classes) {
        Plaintext result;
        cryptoContext->Decrypt(keyPair.secretKey, encryptedScores.at(label), &result);
        ++decryptions;
        result->SetLength(1);
        decryptedScores[label] = result->GetPackedValue()[0];
    }

    const bool scoresMatch = decryptedScores == expectedScores;

    std::size_t activeValueCiphertextBytes = 0;
    for (const auto& ciphertext : encryptedEvents) {
        activeValueCiphertextBytes += SerializedCiphertextBytes(ciphertext);
    }
    std::size_t classScoreCiphertextBytes = 0;
    for (const auto& [label, ciphertext] : encryptedScores) {
        classScoreCiphertextBytes += SerializedCiphertextBytes(ciphertext);
    }
    const auto rssBytes = CurrentRssBytes();

    std::cout << "{";
    std::cout << "\"schema\":\"neurofhe.openfhe.result.v1\",";
    std::cout << "\"scheme\":\"openfhe-bfvrns\",";
    std::cout << "\"scoreEquation\":\"scores = W x + bias\",";
    std::cout << "\"inputSource\":\"" << input.inputSource << "\",";
    std::cout << "\"inputContractPath\":\"" << input.inputPath << "\",";
    std::cout << "\"datasetKind\":\"" << input.datasetKind << "\",";
    std::cout << "\"fixedPointScale\":" << input.fixedPointScale << ",";
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
    std::cout << "\"plaintextMatchesExpected\":" << (scoresMatch ? "true" : "false") << ",";
    std::cout << "\"parameterEvidence\":{";
    std::cout << "\"scheme\":\"BFVrns\",";
    std::cout << "\"securityLevelTarget\":\"HEStd_128_classic\",";
    std::cout << "\"plaintextModulus\":" << input.plaintextModulus << ",";
    std::cout << "\"multiplicativeDepth\":1,";
    std::cout << "\"batchSize\":1,";
    std::cout << "\"evalMultKeyGenerated\":true,";
    std::cout << "\"ciphertextCiphertextMultiplications\":0,";
    std::cout << "\"relinearizationRequired\":false,";
    std::cout << "\"noiseBudget\":\"not reported by this portable demo\"";
    std::cout << "},";
    std::cout << "\"operationCounts\":{";
    std::cout << "\"encryptions\":" << encryptions << ",";
    std::cout << "\"scalarMultiplies\":" << scalarMultiplies << ",";
    std::cout << "\"adds\":" << adds << ",";
    std::cout << "\"decryptions\":" << decryptions;
    std::cout << "},";
    std::cout << "\"ciphertextBytes\":{";
    std::cout << "\"activeValueCiphertexts\":" << activeValueCiphertextBytes << ",";
    std::cout << "\"classScoreCiphertexts\":" << classScoreCiphertextBytes << ",";
    std::cout << "\"total\":" << (activeValueCiphertextBytes + classScoreCiphertextBytes) << ",";
    std::cout << "\"measurement\":\"OpenFHE Serial::Serialize BINARY byte size of active value and class score ciphertexts\"";
    std::cout << "},";
    std::cout << "\"memoryUsage\":{";
    if (rssBytes.has_value()) {
        std::cout << "\"rssBytes\":" << *rssBytes << ",";
    } else {
        std::cout << "\"rssBytes\":null,";
    }
    std::cout << "\"measurement\":\"VmRSS from /proc/self/status at end of run; KiB converted to bytes\",";
    std::cout << "\"caveat\":\"single end-of-run RSS sample on the local host; not peak RSS, dataset-scale memory, side-channel evidence, or stable performance evidence\"";
    std::cout << "},";
    std::cout << "\"productionClaim\":false,";
    std::cout << "\"caveat\":\"Prototype BFVrns integer demo; parameters are for integration validation, not a production security claim.\"";
    std::cout << "}" << std::endl;

    return scoresMatch ? 0 : 1;
    } catch (const std::exception& error) {
        std::cerr << "openfhe_linear_demo failed: " << error.what() << std::endl;
        return 1;
    }
}
