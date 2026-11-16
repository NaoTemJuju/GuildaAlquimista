#include "Runtime.h"

namespace GA {
Config config;
RE::TESObjectACTI* workbench{};

namespace {
RE::TESForm* ResolveFormKey(std::string_view key)
{
    const auto parsed = Bridge::ParseFormKey(key);
    if (!parsed) return nullptr;
    auto* handler = RE::TESDataHandler::GetSingleton();
    return handler ? handler->LookupForm(parsed->localFormId, parsed->pluginName) : nullptr;
}
}

bool LoadConfig()
{
    try {
        std::ifstream file("Data/SKSE/Plugins/GuildAlchemy.json");
        if (!file) {
            logga::warn("GuildAlchemy.json ausente; usando configuracao padrao da ponte de bancada.");
            return true;
        }
        file >> config.document;
        config.debug = config.document.value("debug", false);
        if (config.document.contains("workbench") && config.document["workbench"].is_string()) {
            config.workbenchKey = config.document["workbench"].get<std::string>();
        } else if (config.document.contains("forms") && config.document["forms"].is_object()) {
            config.workbenchKey = config.document["forms"].value("workbench", config.workbenchKey);
        }
        config.activationEvent = config.document.value("activationEvent", config.activationEvent);
        if (config.activationEvent.empty() || config.activationEvent.size() > 64) {
            throw std::runtime_error("activationEvent invalido");
        }
        spdlog::set_level(config.debug ? spdlog::level::debug : spdlog::level::info);
        return true;
    } catch (const std::exception& error) {
        logga::error("Config: {}", error.what());
        return false;
    }
}

bool ResolveForms()
{
    auto* base = ResolveFormKey(config.workbenchKey);
    workbench = base ? base->As<RE::TESObjectACTI>() : nullptr;
    if (!workbench) {
        logga::warn("Bancada ACTI '{}' nao encontrada no load order; ativacao fisica ficara inativa.", config.workbenchKey);
        return false;
    }
    logga::info("Ponte de bancada GuildAlchemy pronta para ACTI {:08X} ({}).", workbench->GetFormID(), config.workbenchKey);
    return true;
}
}
