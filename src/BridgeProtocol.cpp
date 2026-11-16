#include "BridgeProtocol.h"

#include <charconv>
#include <cstdio>

namespace GA::Bridge {
std::string FormKey::ToStableString() const
{
    char hex[7]{};
    std::snprintf(hex, sizeof(hex), "%06X", localFormId & 0x00FFFFFFu);
    return pluginName + "|" + hex;
}

std::optional<FormKey> ParseFormKey(std::string_view key)
{
    auto split = key.find(':');
    if (split == std::string_view::npos) {
        split = key.find('|');
        if (split == std::string_view::npos || split == 0 || split + 1 >= key.size()) {
            return std::nullopt;
        }
        // Format: pluginName|HEX
        const auto plugin = key.substr(0, split);
        const auto hexPart = key.substr(split + 1);
        if (hexPart.size() != 6) {
            return std::nullopt;
        }
        std::uint32_t id{};
        const auto [end, error] = std::from_chars(hexPart.data(), hexPart.data() + hexPart.size(), id, 16);
        if (error != std::errc{} || end != hexPart.data() + hexPart.size()) {
            return std::nullopt;
        }
        return FormKey{std::string(plugin), id};
    }

    // Legacy config format: HEX:pluginName (6 hex digits)
    if (split != 6 || split + 1 >= key.size()) {
        return std::nullopt;
    }
    std::uint32_t id{};
    const auto [end, error] = std::from_chars(key.data(), key.data() + split, id, 16);
    if (error != std::errc{} || end != key.data() + split) {
        return std::nullopt;
    }
    return FormKey{std::string(key.substr(split + 1)), id};
}

std::string BuildActivationPayload(std::string_view workbenchKey, std::uint32_t refFormId)
{
    char refHex[11]{};
    std::snprintf(refHex, sizeof(refHex), "0x%08X", refFormId);
    std::string out;
    out.reserve(workbenchKey.size() + 64);
    out += "{\"workbenchKey\":\"";
    for (char ch : workbenchKey) {
        if (ch == '"' || ch == '\\') out.push_back('\\');
        out.push_back(ch);
    }
    out += "\",\"refFormId\":\"";
    out += refHex;
    out += "\"}";
    return out;
}
}
