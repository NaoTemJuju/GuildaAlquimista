#pragma once

#include <cstdint>
#include <optional>
#include <string>
#include <string_view>

namespace GA::Bridge {
struct FormKey {
    std::string pluginName;
    std::uint32_t localFormId{};

    [[nodiscard]] std::string ToStableString() const;
};

[[nodiscard]] std::optional<FormKey> ParseFormKey(std::string_view key);
[[nodiscard]] std::string BuildActivationPayload(std::string_view workbenchKey, std::uint32_t refFormId);
}
