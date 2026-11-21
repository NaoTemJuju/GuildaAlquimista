#pragma once
#include "PCH.h"
#include "BridgeProtocol.h"

namespace GA {
struct Config {
    Json document;
    bool debug{};
    bool interceptAllAlchemyBenches{true};
    std::string workbenchKey{"000800:GuildAlchemy.esp"};
    std::string activationEvent{"AetheriusAlchemy.WorkbenchActivated"};
};

extern Config config;
extern RE::TESObjectACTI* workbench;

bool LoadConfig();
bool ResolveForms();
void RegisterActivationSink();
void RegisterCraftedPotionSink();
}
