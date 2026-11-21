#include "Runtime.h"
#include <RE/A/AlchemyItem.h>
#include <RE/B/BGSCreatedObjectManager.h>
#include <RE/E/EffectSetting.h>
#include <RE/M/MagicCaster.h>

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

template <class T>
struct CreatedObjectPolicy {
    static void Acquire(T* ptr)
    {
        if (!ptr) return;
        auto* mgr = RE::BGSCreatedObjectManager::GetSingleton();
        if (mgr && ptr->IsDynamicForm() && ptr->Is(RE::FormType::AlchemyItem)) {
            using Fn = void (*)(RE::BGSCreatedObjectManager*, RE::AlchemyItem*);
            static REL::Relocation<Fn> incRef{RELOCATION_ID(35268, 36170)};
            incRef(mgr, static_cast<RE::AlchemyItem*>(ptr));
        }
    }

    static void Release(T* ptr)
    {
        if (!ptr) return;
        auto* mgr = RE::BGSCreatedObjectManager::GetSingleton();
        if (mgr && ptr->IsDynamicForm() && ptr->Is(RE::FormType::AlchemyItem)) {
            using Fn = void (*)(RE::BGSCreatedObjectManager*, RE::AlchemyItem*);
            static REL::Relocation<Fn> decRef{RELOCATION_ID(35269, 36171)};
            decRef(mgr, static_cast<RE::AlchemyItem*>(ptr));
        }
    }
};

using CreatedPotionPtr = RE::BSTSmartPointer<RE::AlchemyItem, CreatedObjectPolicy>;

std::array<CreatedPotionPtr, 8> g_recentCraftedForms{};
std::size_t g_recentCraftedCursor{0};

void RetainTransientForm(const CreatedPotionPtr& ref)
{
    g_recentCraftedForms[g_recentCraftedCursor % g_recentCraftedForms.size()] = ref;
    g_recentCraftedCursor += 1;
}

bool ApplyCraftedSpecNow(const Json& spec)
{
    auto* player = RE::PlayerCharacter::GetSingleton();
    auto* manager = RE::BGSCreatedObjectManager::GetSingleton();
    auto* handler = RE::TESDataHandler::GetSingleton();
    if (!player || !manager || !handler) return false;
    if (!spec.contains("effects") || !spec["effects"].is_array()) return false;

    RE::BSTArray<RE::Effect> effects;
    for (const auto& item : spec["effects"]) {
        if (!item.is_object()) continue;
        const std::string plugin = item.value("plugin", "");
        const std::uint32_t localId = item.value("localFormId", std::uint32_t{0});
        if (plugin.empty() || localId == 0) continue;
        auto* mgef = handler->LookupForm<RE::EffectSetting>(localId, plugin);
        if (!mgef) {
            logga::warn("ApplyCrafted: MGEF nao encontrado {:06X} em {}", localId, plugin);
            continue;
        }
        const float mag = item.value("magnitude", 0.0f);
        const std::uint32_t dur = item.value("duration", std::uint32_t{0});
        const std::uint32_t area = item.value("area", std::uint32_t{0});
        effects.emplace_back();
        auto& eff = effects.back();
        eff.baseEffect = mgef;
        eff.effectItem.magnitude = mag;
        eff.effectItem.duration = dur;
        eff.effectItem.area = area;
        const float magFactor = mag > 1.0f ? mag : 1.0f;
        const float durFactor = dur > 0 ? static_cast<float>(dur) / 10.0f : 1.0f;
        eff.cost = mgef->data.baseCost * std::pow(magFactor * durFactor, 1.1f);
    }
    if (effects.empty()) return false;

    const std::string name = spec.value("name", "");
    const bool isPoison = spec.value("poison", false);

    if (isPoison) {
        CreatedPotionPtr created;
        using AddPoisonFunction = void (*)(
            RE::BGSCreatedObjectManager*,
            CreatedPotionPtr&,
            RE::BSTArray<RE::Effect>&);
        static REL::Relocation<AddPoisonFunction> addPoison{RELOCATION_ID(35266, 36168)};
        addPoison(manager, created, effects);
        auto* product = created.get();
        if (!product) return false;
        if (!name.empty()) product->SetFullName(name.c_str());

        auto* entry = player->GetEquippedEntryData(false);
        if (!entry || !entry->object || !entry->object->IsWeapon()) {
            entry = player->GetEquippedEntryData(true);
        }
        if (!entry || !entry->object || !entry->object->IsWeapon()) {
            RE::DebugNotification("Empunhe uma arma para aplicar o veneno.");
            return false;
        }
        RetainTransientForm(created);
        entry->PoisonObject(product, 1);
        const std::string msg = "Veneno aplicado: " + (name.empty() ? std::string("Veneno") : name);
        RE::DebugNotification(msg.c_str());
        logga::info("ApplyCrafted poison OK ({} efeitos, FormID={:08X}, arma={}).",
            effects.size(), product->GetFormID(), entry->object->GetName());
        return true;
    }

    CreatedPotionPtr created;
    using AddPotionFunction = void (*)(
        RE::BGSCreatedObjectManager*,
        CreatedPotionPtr&,
        RE::BSTArray<RE::Effect>&);
    static REL::Relocation<AddPotionFunction> addPotion{RELOCATION_ID(35265, 36167)};
    addPotion(manager, created, effects);
    auto* product = created.get();
    if (!product) return false;
    if (!name.empty()) product->SetFullName(name.c_str());
    RetainTransientForm(created);
    if (auto* caster = player->GetMagicCaster(RE::MagicSystem::CastingSource::kInstant)) {
        caster->CastSpellImmediate(product, false, player, 1.0f, false, 0.0f, player);
        logga::info("ApplyCrafted potion OK via CastSpellImmediate ({} efeitos, FormID={:08X}, nome={}).",
            effects.size(), product->GetFormID(), name);
        return true;
    }
    const bool drank = player->DrinkPotion(product, nullptr);
    logga::info("ApplyCrafted potion fallback DrinkPotion ({} efeitos, FormID={:08X}, drank={}).",
        effects.size(), product->GetFormID(), drank);
    return drank;
}

class CraftedPotionSink final : public RE::BSTEventSink<SKSE::ModCallbackEvent> {
public:
    RE::BSEventNotifyControl ProcessEvent(
        const SKSE::ModCallbackEvent* event,
        RE::BSTEventSource<SKSE::ModCallbackEvent>*) override
    {
        if (!event || event->eventName != "AetheriusAlchemy.ApplyCrafted") {
            return RE::BSEventNotifyControl::kContinue;
        }
        auto parsed = Json::parse(event->strArg.c_str(), nullptr, false);
        if (parsed.is_discarded() || !parsed.is_object()) {
            logga::warn("ApplyCrafted: payload JSON invalido.");
            return RE::BSEventNotifyControl::kContinue;
        }
        if (auto* tasks = SKSE::GetTaskInterface()) {
            tasks->AddTask([spec = std::move(parsed)]() {
                ApplyCraftedSpecNow(spec);
            });
        }
        return RE::BSEventNotifyControl::kContinue;
    }
};

CraftedPotionSink g_craftedPotionSink;
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
        config.interceptAllAlchemyBenches = config.document.value("interceptAllAlchemyBenches", true);
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
    if (workbench) {
        logga::info("Bancada ACTI opcional resolvida: {:08X} ({}).", workbench->GetFormID(), config.workbenchKey);
    } else if (!config.interceptAllAlchemyBenches) {
        logga::warn("Bancada ACTI '{}' nao encontrada e interceptAllAlchemyBenches=false; ativacao fisica ficara inativa.", config.workbenchKey);
        return false;
    } else {
        logga::info("Interceptacao global de bancadas de alquimia (FURN WBDT kAlchemy) habilitada sem necessidade de ESP.");
    }
    return true;
}

void RegisterCraftedPotionSink()
{
    static bool registered = false;
    if (registered) return;
    if (auto* src = SKSE::GetModCallbackEventSource()) {
        src->AddEventSink(&g_craftedPotionSink);
        registered = true;
        logga::info("Listener ModEvent AetheriusAlchemy.ApplyCrafted registrado.");
    }
}
}
