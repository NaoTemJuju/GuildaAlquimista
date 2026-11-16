#include "Runtime.h"

namespace GA {
namespace {
bool sinkRegistered{};

void NotifyClientAdapter(RE::TESObjectREFR* target)
{
    if (!target) return;
    auto* source = SKSE::GetModCallbackEventSource();
    if (!source) {
        logga::warn("ModCallbackEventSource indisponivel; nao foi possivel notificar abertura da bancada.");
        return;
    }
    const auto parsed = Bridge::ParseFormKey(config.workbenchKey);
    const auto stableKey = parsed ? parsed->ToStableString() : config.workbenchKey;
    const auto payload = Bridge::BuildActivationPayload(stableKey, target->GetFormID());

    SKSE::ModCallbackEvent modEvent{};
    modEvent.eventName = config.activationEvent.c_str();
    modEvent.strArg = payload.c_str();
    modEvent.numArg = 0.0F;
    modEvent.sender = target;
    source->SendEvent(&modEvent);

    logga::debug("ModCallbackEvent '{}' enviado: {}", config.activationEvent, payload);
}

class ActivationSink final : public RE::BSTEventSink<RE::TESActivateEvent> {
public:
    RE::BSEventNotifyControl ProcessEvent(const RE::TESActivateEvent* event,
        RE::BSTEventSource<RE::TESActivateEvent>*) override
    {
        auto* player = RE::PlayerCharacter::GetSingleton();
        if (event && event->objectActivated && workbench &&
            event->actionRef.get() == player &&
            event->objectActivated->GetBaseObject() == workbench) {
            NotifyClientAdapter(event->objectActivated.get());
        }
        return RE::BSEventNotifyControl::kContinue;
    }
};

ActivationSink activationSink;
}

void RegisterActivationSink()
{
    if (sinkRegistered || !workbench) return;
    if (auto* source = RE::ScriptEventSourceHolder::GetSingleton()) {
        source->AddEventSink<RE::TESActivateEvent>(std::addressof(activationSink));
        sinkRegistered = true;
        logga::info("Listener de ativacao da bancada registrado (somente sinalizacao ao shell AetheriusUI).");
    }
}
}
