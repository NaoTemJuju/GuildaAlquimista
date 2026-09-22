#include "Runtime.h"

namespace {
void OnSKSEMessage(SKSE::MessagingInterface::Message* message)
{
    switch (message->type) {
    case SKSE::MessagingInterface::kPostPostLoad:
        GA::AcquirePrisma();
        break;
    case SKSE::MessagingInterface::kDataLoaded:
        GA::AcquirePrisma();
        if (!GA::ResolveForms()) {
            logga::critical("Inicialização abortada: formulários obrigatórios não foram resolvidos.");
            return;
        }
        GA::InitializeUI();
        GA::RegisterActivationSink();
        break;
    case SKSE::MessagingInterface::kPostLoadGame:
    case SKSE::MessagingInterface::kNewGame:
        GA::ResetSession();
        GA::SyncGuildAlchemyRank();
        break;
    default:
        break;
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
        logga::critical("Não foi possível registrar o listener de mensagens do SKSE.");
        return false;
    }
    logga::info("GuildAlchemy {}; runtime {}", GUILDALCHEMY_VERSION, skse->RuntimeVersion().string());
    return true;
}
