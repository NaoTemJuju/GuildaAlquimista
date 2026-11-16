#include "Runtime.h"

namespace GA {
namespace {
bool sinkRegistered{};

bool IsAlchemyWorkbench(RE::TESBoundObject* base)
{
    if (!base) return false;
    if (workbench && base == workbench) return true;
    if (!config.interceptAllAlchemyBenches) return false;
    if (const auto* furn = base->As<RE::TESFurniture>()) {
        const auto type = furn->workBenchData.benchType.get();
        return type == RE::TESFurniture::WorkBenchData::BenchType::kAlchemy ||
               type == RE::TESFurniture::WorkBenchData::BenchType::kAlchemyExperiment;
    }
    return false;
}

void NotifyClientAdapter(RE::TESObjectREFR* target)
{
    if (!target) return;
    auto* source = SKSE::GetModCallbackEventSource();
    if (!source) {
        logga::warn("ModCallbackEventSource indisponivel; nao foi possivel notificar abertura da bancada.");
        return;
    }
    const auto* base = target->GetBaseObject();
    std::string stableKey = config.workbenchKey;
    if (base && (!workbench || base != workbench)) {
        if (const auto* file = base->GetFile(0)) {
            Bridge::FormKey fk{std::string(file->GetFilename()), base->GetLocalFormID()};
            stableKey = fk.ToStableString();
        }
    } else if (const auto parsed = Bridge::ParseFormKey(config.workbenchKey)) {
        stableKey = parsed->ToStableString();
    }
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
        if (event && event->objectActivated && event->actionRef.get() == player &&
            IsAlchemyWorkbench(event->objectActivated->GetBaseObject())) {
            NotifyClientAdapter(event->objectActivated.get());
        }
        return RE::BSEventNotifyControl::kContinue;
    }
};

ActivationSink activationSink;
}

void RegisterActivationSink()
{
    if (sinkRegistered) return;
    if (!workbench && !config.interceptAllAlchemyBenches) return;
    if (auto* source = RE::ScriptEventSourceHolder::GetSingleton()) {
        source->AddEventSink<RE::TESActivateEvent>(std::addressof(activationSink));
        sinkRegistered = true;
        logga::info("Listener de ativacao de bancadas de alquimia registrado (somente sinalizacao ao shell AetheriusUI).");
    }
}
}
