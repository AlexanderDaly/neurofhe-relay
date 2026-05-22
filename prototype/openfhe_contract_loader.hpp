// SPDX-License-Identifier: CC0-1.0
#pragma once

#include <cctype>
#include <cstdint>
#include <fstream>
#include <map>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <vector>

namespace neurofhe {

template <typename Number>
struct ContractActiveEvent {
    std::size_t index = 0;
    std::size_t timeBin = 0;
    std::size_t neuronId = 0;
    Number value = 0;
};

template <typename Number>
struct SparseLinearContract {
    std::string schema = "embedded";
    std::string sourceId = "embedded-synthetic";
    std::string datasetKind = "synthetic-events-v0";
    std::string eventRepresentation = "spatial-sorted-events";
    std::string scoreDomain = "non-negative-integers";
    std::vector<std::size_t> featureShape;
    std::vector<std::string> classes;
    std::vector<ContractActiveEvent<Number>> activeEvents;
    std::map<std::string, std::vector<Number>> weights;
    std::map<std::string, Number> bias;
    uint64_t plaintextModulus = 65537;
    double fixedPointScale = 1.0;
    double approximationTolerance = 0.001;
};

inline std::string ReadTextFile(const std::string& path) {
    std::ifstream input(path);
    if (!input) {
        throw std::runtime_error("failed to open input contract: " + path);
    }
    return std::string(
        (std::istreambuf_iterator<char>(input)),
        std::istreambuf_iterator<char>());
}

inline std::size_t SkipWhitespace(const std::string& text, std::size_t offset) {
    while (offset < text.size() && std::isspace(static_cast<unsigned char>(text[offset]))) {
        ++offset;
    }
    return offset;
}

inline std::size_t MatchingDelimiter(
    const std::string& text,
    std::size_t offset,
    char open,
    char close) {
    if (offset >= text.size() || text[offset] != open) {
        throw std::runtime_error("expected JSON delimiter");
    }
    std::size_t depth = 0;
    bool inString = false;
    bool escaped = false;
    for (std::size_t index = offset; index < text.size(); ++index) {
        const char ch = text[index];
        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (ch == '\\') {
                escaped = true;
            } else if (ch == '"') {
                inString = false;
            }
            continue;
        }
        if (ch == '"') {
            inString = true;
            continue;
        }
        if (ch == open) {
            ++depth;
        } else if (ch == close) {
            --depth;
            if (depth == 0) {
                return index;
            }
        }
    }
    throw std::runtime_error("unterminated JSON value");
}

inline std::size_t JsonStringEnd(const std::string& text, std::size_t offset) {
    if (offset >= text.size() || text[offset] != '"') {
        throw std::runtime_error("expected JSON string");
    }
    bool escaped = false;
    for (std::size_t index = offset + 1; index < text.size(); ++index) {
        const char ch = text[index];
        if (escaped) {
            escaped = false;
        } else if (ch == '\\') {
            escaped = true;
        } else if (ch == '"') {
            return index;
        }
    }
    throw std::runtime_error("unterminated JSON string");
}

inline std::size_t JsonValueEnd(const std::string& text, std::size_t offset) {
    const auto start = SkipWhitespace(text, offset);
    if (start >= text.size()) {
        throw std::runtime_error("empty JSON value");
    }

    const char first = text[start];
    if (first == '{') {
        return MatchingDelimiter(text, start, '{', '}');
    }
    if (first == '[') {
        return MatchingDelimiter(text, start, '[', ']');
    }
    if (first == '"') {
        return JsonStringEnd(text, start);
    }

    std::size_t end = start;
    while (end < text.size() && text[end] != ',' && text[end] != '}' && text[end] != ']') {
        ++end;
    }
    if (end == start) {
        throw std::runtime_error("empty JSON scalar");
    }
    return end - 1;
}

inline std::string ParseJsonString(const std::string& value);

inline std::string FindJsonValue(
    const std::string& object,
    const std::string& key,
    bool required = true) {
    std::size_t cursor = SkipWhitespace(object, 0);
    std::size_t stop = object.size();
    if (cursor < object.size() && object[cursor] == '{') {
        stop = MatchingDelimiter(object, cursor, '{', '}');
        ++cursor;
    }

    while (cursor < stop) {
        cursor = SkipWhitespace(object, cursor);
        if (cursor >= stop) {
            break;
        }
        if (object[cursor] == ',') {
            ++cursor;
            continue;
        }
        if (object[cursor] != '"') {
            throw std::runtime_error("expected JSON object key");
        }

        const auto keyEnd = JsonStringEnd(object, cursor);
        const auto currentKey = ParseJsonString(object.substr(cursor, keyEnd - cursor + 1));
        const auto colon = SkipWhitespace(object, keyEnd + 1);
        if (colon >= object.size() || object[colon] != ':') {
            throw std::runtime_error("missing ':' after JSON key: " + currentKey);
        }

        const auto valueStart = SkipWhitespace(object, colon + 1);
        const auto valueEnd = JsonValueEnd(object, valueStart);
        if (currentKey == key) {
            return object.substr(valueStart, valueEnd - valueStart + 1);
        }
        cursor = valueEnd + 1;
    }

    if (required) {
        throw std::runtime_error("missing JSON key: " + key);
    }
    return "";
}

inline std::string ParseJsonString(const std::string& value) {
    const auto start = SkipWhitespace(value, 0);
    if (start >= value.size() || value[start] != '"') {
        throw std::runtime_error("expected JSON string");
    }
    std::string out;
    bool escaped = false;
    for (std::size_t index = start + 1; index < value.size(); ++index) {
        const char ch = value[index];
        if (escaped) {
            out.push_back(ch);
            escaped = false;
        } else if (ch == '\\') {
            escaped = true;
        } else if (ch == '"') {
            return out;
        } else {
            out.push_back(ch);
        }
    }
    throw std::runtime_error("unterminated JSON string");
}

inline std::vector<std::string> ParseStringArray(const std::string& value) {
    std::vector<std::string> out;
    std::size_t index = 0;
    while ((index = value.find('"', index)) != std::string::npos) {
        const auto end = value.find('"', index + 1);
        if (end == std::string::npos) {
            throw std::runtime_error("unterminated string array item");
        }
        out.push_back(value.substr(index + 1, end - index - 1));
        index = end + 1;
    }
    return out;
}

template <typename Number>
Number ParseNumber(const std::string& value) {
    if constexpr (std::is_integral<Number>::value) {
        return static_cast<Number>(std::stoll(value));
    } else {
        return static_cast<Number>(std::stod(value));
    }
}

inline uint64_t ParseUint64(const std::string& value) {
    return static_cast<uint64_t>(std::stoull(value));
}

template <typename Number>
std::vector<Number> ParseNumberArray(const std::string& value) {
    std::vector<Number> out;
    std::size_t index = 0;
    while (index < value.size()) {
        const char ch = value[index];
        if (ch == '-' || ch == '+' || ch == '.' || std::isdigit(static_cast<unsigned char>(ch))) {
            std::size_t end = index + 1;
            while (
                end < value.size() &&
                (value[end] == '-' ||
                 value[end] == '+' ||
                 value[end] == '.' ||
                 value[end] == 'e' ||
                 value[end] == 'E' ||
                 std::isdigit(static_cast<unsigned char>(value[end])))) {
                ++end;
            }
            out.push_back(ParseNumber<Number>(value.substr(index, end - index)));
            index = end;
        } else {
            ++index;
        }
    }
    return out;
}

inline std::vector<std::size_t> ParseSizeArray(const std::string& value) {
    const auto numbers = ParseNumberArray<int64_t>(value);
    std::vector<std::size_t> out;
    out.reserve(numbers.size());
    for (const auto number : numbers) {
        if (number < 0) {
            throw std::runtime_error("size array contains a negative value");
        }
        out.push_back(static_cast<std::size_t>(number));
    }
    return out;
}

template <typename Number>
std::vector<ContractActiveEvent<Number>> ParseEvents(const std::string& value) {
    std::vector<ContractActiveEvent<Number>> events;
    std::size_t offset = 0;
    while ((offset = value.find('{', offset)) != std::string::npos) {
        const auto end = MatchingDelimiter(value, offset, '{', '}');
        const auto object = value.substr(offset, end - offset + 1);
        ContractActiveEvent<Number> event;
        event.index = static_cast<std::size_t>(ParseUint64(FindJsonValue(object, "index")));
        event.timeBin = static_cast<std::size_t>(ParseUint64(FindJsonValue(object, "timeBin")));
        event.neuronId = static_cast<std::size_t>(ParseUint64(FindJsonValue(object, "neuronId")));
        event.value = ParseNumber<Number>(FindJsonValue(object, "value"));
        events.push_back(event);
        offset = end + 1;
    }
    return events;
}

template <typename Number>
std::map<std::string, std::vector<Number>> ParseRowsByClass(
    const std::string& object,
    const std::vector<std::string>& classes) {
    std::map<std::string, std::vector<Number>> rows;
    for (const auto& label : classes) {
        rows[label] = ParseNumberArray<Number>(FindJsonValue(object, label));
    }
    return rows;
}

template <typename Number>
std::map<std::string, Number> ParseScalarsByClass(
    const std::string& object,
    const std::vector<std::string>& classes) {
    std::map<std::string, Number> scalars;
    for (const auto& label : classes) {
        scalars[label] = ParseNumber<Number>(FindJsonValue(object, label));
    }
    return scalars;
}

template <typename Number>
SparseLinearContract<Number> LoadSparseLinearContract(
    const std::string& path,
    bool useQuantizedView) {
    const auto text = ReadTextFile(path);
    SparseLinearContract<Number> contract;
    contract.schema = ParseJsonString(FindJsonValue(text, "schema"));
    contract.sourceId = ParseJsonString(FindJsonValue(text, "sourceId", false).empty()
        ? "\"external-contract\""
        : FindJsonValue(text, "sourceId"));
    contract.datasetKind = ParseJsonString(FindJsonValue(text, "datasetKind", false).empty()
        ? "\"unknown\""
        : FindJsonValue(text, "datasetKind"));
    contract.eventRepresentation = ParseJsonString(FindJsonValue(text, "eventRepresentation"));
    contract.scoreDomain = ParseJsonString(FindJsonValue(text, "scoreDomain"));
    contract.featureShape = ParseSizeArray(FindJsonValue(text, "featureShape"));
    contract.classes = ParseStringArray(FindJsonValue(text, "classes"));
    if (contract.classes.empty()) {
        throw std::runtime_error("input contract has no classes");
    }

    if (useQuantizedView) {
        const auto quantized = FindJsonValue(text, "quantized");
        contract.plaintextModulus = ParseUint64(FindJsonValue(quantized, "plaintextModulus"));
        contract.fixedPointScale = std::stod(FindJsonValue(quantized, "fixedPointScale"));
        contract.activeEvents = ParseEvents<Number>(FindJsonValue(quantized, "activeEvents"));
        contract.weights = ParseRowsByClass<Number>(
            FindJsonValue(quantized, "weights"),
            contract.classes);
        contract.bias = ParseScalarsByClass<Number>(
            FindJsonValue(quantized, "bias"),
            contract.classes);
    } else {
        const auto tolerance = FindJsonValue(text, "approximationTolerance", false);
        if (!tolerance.empty()) {
            contract.approximationTolerance = std::stod(FindJsonValue(tolerance, "maxAbsScoreError"));
        }
        contract.activeEvents = ParseEvents<Number>(FindJsonValue(text, "activeEvents"));
        contract.weights = ParseRowsByClass<Number>(
            FindJsonValue(text, "weights"),
            contract.classes);
        contract.bias = ParseScalarsByClass<Number>(
            FindJsonValue(text, "bias"),
            contract.classes);
    }

    const auto featureCount = contract.featureShape.empty()
        ? 0
        : contract.featureShape[0] * (contract.featureShape.size() > 1 ? contract.featureShape[1] : 1);
    for (const auto& label : contract.classes) {
        if (contract.weights[label].size() != featureCount) {
            throw std::runtime_error("weights for class " + label + " do not match featureShape");
        }
    }
    return contract;
}

}  // namespace neurofhe
