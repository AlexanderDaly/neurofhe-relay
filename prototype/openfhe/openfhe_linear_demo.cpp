// SPDX-License-Identifier: CC0-1.0

#include "openfhe.h"

#include <cstdint>
#include <iostream>
#include <map>
#include <string>
#include <vector>

using namespace lbcrypto;

namespace {

struct ActiveEvent {
    std::size_t index;
    int64_t value;
};

std::vector<std::vector<int64_t>> DemoEventWindow() {
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
                events.push_back({time * channels + channel, value});
            }
        }
    }
    return events;
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

}  // namespace

int main() {
    const auto values = DemoEventWindow();
    const auto events = ActiveEvents(values);
    const std::vector<std::string> classes = {"normal", "anomaly"};
    const std::map<std::string, std::vector<int64_t>> weights = {
        {"normal", MakeNormalWeights()},
        {"anomaly", MakeAnomalyWeights()},
    };
    const std::map<std::string, int64_t> bias = {{"normal", 0}, {"anomaly", 0}};
    const auto expectedScores = PlaintextScores(events, weights, bias);

    CCParams<CryptoContextBFVRNS> parameters;
    parameters.SetPlaintextModulus(65537);
    parameters.SetMultiplicativeDepth(1);
    parameters.SetBatchSize(1);

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

    std::cout << "{";
    std::cout << "\"schema\":\"neurofhe.openfhe.result.v1\",";
    std::cout << "\"scheme\":\"openfhe-bfvrns\",";
    std::cout << "\"scoreEquation\":\"scores = W x + bias\",";
    std::cout << "\"boundaryDomain\":\"bio-digital-event-intelligence\",";
    std::cout << "\"eventRepresentation\":\"public active positions with encrypted active spike counts\",";
    std::cout << "\"activeEventCount\":" << events.size() << ",";
    std::cout << "\"scores\":";
    PrintScoreObject(decryptedScores);
    std::cout << ",";
    std::cout << "\"classification\":\"" << Classify(decryptedScores) << "\",";
    std::cout << "\"expectedScores\":";
    PrintScoreObject(expectedScores);
    std::cout << ",";
    std::cout << "\"expectedClassification\":\"" << Classify(expectedScores) << "\",";
    std::cout << "\"plaintextMatchesExpected\":" << (scoresMatch ? "true" : "false") << ",";
    std::cout << "\"operationCounts\":{";
    std::cout << "\"encryptions\":" << encryptions << ",";
    std::cout << "\"scalarMultiplies\":" << scalarMultiplies << ",";
    std::cout << "\"adds\":" << adds << ",";
    std::cout << "\"decryptions\":" << decryptions;
    std::cout << "},";
    std::cout << "\"productionClaim\":false,";
    std::cout << "\"caveat\":\"Prototype BFVrns integer demo; parameters are for integration validation, not a production security claim.\"";
    std::cout << "}" << std::endl;

    return scoresMatch ? 0 : 1;
}
