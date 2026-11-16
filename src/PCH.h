#pragma once
#include <RE/Skyrim.h>
#include <SKSE/SKSE.h>
#include <nlohmann/json.hpp>
#include <spdlog/sinks/basic_file_sink.h>

#include <charconv>
#include <fstream>
#include <optional>
#include <string>
#include <string_view>

using namespace std::literals;
namespace logga = SKSE::log;
namespace GA { using Json = nlohmann::json; }
