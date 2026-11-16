#include "Runtime.h"

namespace {
void OnSKSEMessage(SKSE::MessagingInterface::Message* message)
{
    if (!message) return;
    if (message->type == SKSE::MessagingInterface::kDataLoaded) {
        // Sem autoridade local de receitas, patentes ou perks no cliente:
        // apenas detecta a bancada fisica e envia ModCallbackEvent ao adapter do shell.
        if (GA::ResolveForms()) {
            GA::RegisterActivationSink();
        }
    }
}
}

SKSEPluginLoad(const SKSE::LoadInterface* skse)
{
    auto path = SKSE::log::log_directory();
    if (!path || skse->IsEditor()) return false;
    *path /= "GuildAlchemy.log";
    auto sink = std::make_shared<spdlog::sinks::basic_file_sink_mt>(path->string(), true);
    auto logger = std::make_shared<spdlog::logger>("GuildAlchemy", sink);
    spdlog::set_default_logger(logger);
    logger->set_level(spdlog::level::info);
    logger->flush_on(spdlog::level::info);
    SKSE::Init(skse, false);
    if (!GA::LoadConfig()) return false;
    auto* messaging = SKSE::GetMessagingInterface();
    if (!messaging || !messaging->RegisterListener(OnSKSEMessage)) {
        logga::critical("Nao foi possivel registrar o listener de mensagens do SKSE.");
        return false;
    }
    logga::info("GuildAlchemy {} (bridge minima); runtime {}", GUILDALCHEMY_VERSION, skse->RuntimeVersion().string());
    return true;
}
