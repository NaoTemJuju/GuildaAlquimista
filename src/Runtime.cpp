#include "Runtime.h"

namespace GA {
Config config;
RE::TESObjectACTI* workbench{};
std::array<RE::BGSPerk*, 5> guildRanks{};
std::array<std::vector<RE::BGSPerk*>, 5> grants;
RE::BGSPerk* doubleToil{};
std::array<RE::BGSKeyword*, 3> restoreKeywords{};
RE::BGSKeyword* beneficialKeyword{};
RE::BGSKeyword* harmfulKeyword{};
RE::BGSPerk* apothecaryScalingPerk{};
std::vector<AlchemyScalingRule> apothecaryScalingRules;
std::vector<RE::EffectSetting*> noviceEffects;
std::array<std::set<RE::EffectSetting*>, 6> rankEffects;
RE::TESBoundObject* emptyBottle{};

RE::TESForm* Resolve(std::string_view key)
{
    auto split = key.find(':');
    if (split != 6 || split + 1 == key.size()) return nullptr;
    std::uint32_t id{};
    auto [end, error] = std::from_chars(key.data(), key.data() + split, id, 16);
    if (error != std::errc{} || end != key.data() + split) return nullptr;
    auto* handler = RE::TESDataHandler::GetSingleton();
    return handler ? handler->LookupForm(id, key.substr(split + 1)) : nullptr;
}
bool LoadConfig()
{
    try {
        std::ifstream file("Data/SKSE/Plugins/GuildAlchemy.json");
        if (!file) throw std::runtime_error("GuildAlchemy.json ausente");
        file >> config.document;
        if (config.document.at("schemaVersion") != 1) throw std::runtime_error("Config schema inválido");
        config.debug = config.document.value("debug", false);
        config.matchVanillaVisuals = config.document.value("matchVanillaVisuals", true);
        config.maxOperations = config.document.value("maxOperations", 100);
        if (config.maxOperations < 1 || config.maxOperations > 100) throw std::runtime_error("maxOperations deve estar entre 1 e 100");
        const auto& timing=config.document.at("timing");
        config.purificationSeconds=timing.value("purificationSeconds",8.0);
        config.stabilizationSeconds=timing.value("stabilizationSeconds",6.0);
        config.concentrationSeconds=timing.value("concentrationSeconds",12.0);
        if (!std::isfinite(config.purificationSeconds) || config.purificationSeconds < 0.0 || config.purificationSeconds > 120.0 ||
            !std::isfinite(config.stabilizationSeconds) || config.stabilizationSeconds < 0.0 || config.stabilizationSeconds > 120.0 ||
            !std::isfinite(config.concentrationSeconds) || config.concentrationSeconds < 0.0 || config.concentrationSeconds > 120.0)
            throw std::runtime_error("Tempos de produção inválidos");
        const char* ranks[] = {"novice", "apprentice", "adept", "specialist", "master"};
        for (int i=3; i<=4; ++i) {
            auto value=config.document.at("purification").at(ranks[i]).get<double>();
            if (!std::isfinite(value) || value < .5 || value > 1) throw std::runtime_error("Purificação inválida");
            config.purification[i+1]=value;
        }
        for (int i=3; i<=4; ++i) {
            auto value=config.document.at("concentration").at(ranks[i]).get<double>();
            if (!std::isfinite(value) || value < 1 || value > 1.15) throw std::runtime_error("Concentração excede 15%");
            config.concentration[i+1]=value;
        }
        for (int i=1; i<=4; ++i) {
            const auto& values=config.document.at("stabilization").at(ranks[i]);
            const auto wanted=values.at("wanted").get<double>();
            const auto unwanted=values.at("unwanted").get<double>();
            if (!std::isfinite(wanted) || !std::isfinite(unwanted) || wanted <= 0 || wanted > 1 || unwanted <= 0 || unwanted >= 1)
                throw std::runtime_error("Estabilização inválida");
            config.stabilizationWanted[i+1]=wanted;
            config.stabilizationUnwanted[i+1]=unwanted;
        }
        spdlog::set_level(config.debug ? spdlog::level::debug : spdlog::level::info);
        return true;
    } catch (const std::exception& error) { logga::error("Config: {}", error.what()); return false; }
}
bool ResolveForms()
{
    try {
        auto& forms=config.document.at("forms");
        auto* handler=RE::TESDataHandler::GetSingleton();
        for (const auto* key : {"vokriiPlugin", "apothecaryPlugin"}) {
            auto name=forms.at(key).get<std::string>();
            if (!handler->LookupModByName(name)) throw std::runtime_error("Dependência ausente: " + name);
        }
        auto* base=Resolve(forms.at("workbench").get<std::string>());
        workbench=base ? base->As<RE::TESObjectACTI>() : nullptr;
        if (!workbench) throw std::runtime_error("Bancada ACTI não resolvida");
        for (std::size_t i=0;i<5;++i) {
            base=Resolve(forms.at("ranks").at(i).get<std::string>());
            guildRanks[i]=base ? base->As<RE::BGSPerk>() : nullptr;
            if (!guildRanks[i]) throw std::runtime_error("Patente ausente");
            grants[i].clear();
            for (const auto& key : forms.at("rankGrants").at(i).at("perks")) {
                base=Resolve(key.get<std::string>());
                auto* perk=base ? base->As<RE::BGSPerk>() : nullptr;
                if (!perk) throw std::runtime_error("Perk Vokrii ausente");
                // Purity is never granted even if someone accidentally edits the config.
                if (perk->GetFormID()==0x5821D) throw std::runtime_error("Purity não pode ser concedido pela Guilda");
                grants[i].push_back(perk);
                logga::info("Rank {}: perk {:08X} {}",i+1,perk->GetFormID(),perk->GetName());
            }
        }
        doubleToil=grants[4].empty() ? nullptr : grants[4].front();
        const auto& keywords=forms.at("vokriiKeywords");
        for (std::size_t i=0;i<restoreKeywords.size();++i) {
            base=Resolve(keywords.at("restore").at(i).get<std::string>());
            restoreKeywords[i]=base ? base->As<RE::BGSKeyword>() : nullptr;
            if (!restoreKeywords[i]) throw std::runtime_error("Keyword Physician ausente");
        }
        base=Resolve(keywords.at("beneficial").get<std::string>());
        beneficialKeyword=base ? base->As<RE::BGSKeyword>() : nullptr;
        base=Resolve(keywords.at("harmful").get<std::string>());
        harmfulKeyword=base ? base->As<RE::BGSKeyword>() : nullptr;
        if (!beneficialKeyword || !harmfulKeyword) throw std::runtime_error("Keywords Benefactor/Poisoner ausentes");

        noviceEffects.clear();
        for (const auto& key : forms.at("noviceEffects")) {
            base=Resolve(key.get<std::string>());
            auto* effect=base ? base->As<RE::EffectSetting>() : nullptr;
            if (!effect) throw std::runtime_error("Efeito permitido para Novato ausente");
            noviceEffects.push_back(effect);
        }
        if (noviceEffects.size() != 2) throw std::runtime_error("Novato deve possuir exatamente dois efeitos permitidos");
        base=Resolve(forms.at("emptyBottle").get<std::string>());
        emptyBottle=base ? base->As<RE::TESBoundObject>() : nullptr;
        if (!emptyBottle || !emptyBottle->Is(RE::FormType::Misc)) throw std::runtime_error("Garrafa vazia do Alchemy Requires Bottles Redux ausente");
        const auto& limits=forms.at("rankEffectLimits");
        if (!limits.at("cumulative").get<bool>() || !limits.at("master").at("all").get<bool>())
            throw std::runtime_error("Os limites de efeitos devem ser cumulativos e Mestre deve permitir todos");
        const char* limitRanks[]={"novice","apprentice","adept","specialist"};
        for (int i=1;i<=4;++i) {
            rankEffects[i]=rankEffects[i-1];
            for (const auto& key:limits.at(limitRanks[i-1]).at("effects")) {
                base=Resolve(key.get<std::string>());
                auto* effect=base ? base->As<RE::EffectSetting>() : nullptr;
                if (!effect) throw std::runtime_error("Efeito de patente não resolvido: " + key.get<std::string>());
                rankEffects[i].insert(effect);
            }
        }
        if (rankEffects[1].size()!=2) throw std::runtime_error("Novato deve ter exatamente dois efeitos");

        const auto& scaling=forms.at("apothecaryScaling");
        base=Resolve(scaling.at("perk").get<std::string>());
        apothecaryScalingPerk=base ? base->As<RE::BGSPerk>() : nullptr;
        if (!apothecaryScalingPerk) throw std::runtime_error("Apothecary Scaling Controller ausente");
        apothecaryScalingRules.clear();
        for (const auto& data : scaling.at("rules")) {
            AlchemyScalingRule rule;
            const auto mode=data.at("mode").get<std::string>();
            if (mode == "actorValue") rule.mode=AlchemyScalingRule::Mode::ActorValue;
            else if (mode == "multiply") rule.mode=AlchemyScalingRule::Mode::Multiply;
            else throw std::runtime_error("Modo de escala Apothecary inválido");
            rule.value=data.at("value").get<float>();
            rule.minimumAlchemy=data.value("minimumAlchemy",0.0f);
            if (!std::isfinite(rule.value) || rule.value <= 0.0f || rule.value > 2.0f ||
                !std::isfinite(rule.minimumAlchemy) || rule.minimumAlchemy < 0.0f || rule.minimumAlchemy > 100.0f)
                throw std::runtime_error("Regra de escala Apothecary inválida");
            for (const auto& key : data.at("keywords")) {
                base=Resolve(key.get<std::string>());
                auto* keyword=base ? base->As<RE::BGSKeyword>() : nullptr;
                if (!keyword) throw std::runtime_error("Keyword de escala Apothecary ausente");
                rule.keywords.push_back(keyword);
            }
            if (rule.keywords.empty()) throw std::runtime_error("Regra Apothecary sem keywords");
            apothecaryScalingRules.push_back(std::move(rule));
        }
        if (apothecaryScalingRules.empty()) throw std::runtime_error("Nenhuma regra de escala Apothecary");
        logga::info("Vokrii, Apothecary e GuildAlchemy resolvidos; controlador {:08X} com {} regras",
            apothecaryScalingPerk->GetFormID(),apothecaryScalingRules.size());
        return doubleToil != nullptr;
    } catch (const std::exception& error) { logga::error("Forms: {}",error.what()); return false; }
}
int Rank()
{
    auto* player=RE::PlayerCharacter::GetSingleton();
    if (!player) return 0;
    for(int i=4;i>=0;--i) if(guildRanks[i] && player->HasPerk(guildRanks[i])) return i+1;
    return 0;
}
void SyncGuildAlchemyRank()
{
    auto* player=RE::PlayerCharacter::GetSingleton();
    if(!player) return;
    int rank=Rank();
    if(!rank) return;
    for(int i=0;i<rank;++i) {
        if(!player->HasPerk(guildRanks[i])) player->AddPerk(guildRanks[i]);
        for(auto* perk:grants[i]) if(!player->HasPerk(perk)) player->AddPerk(perk);
    }
    float minimum=static_cast<float>(rank*20);
    if(BaseActorValue(player, RE::ActorValue::kAlchemy)<minimum)
        SetBaseActorValue(player, RE::ActorValue::kAlchemy,minimum);
    logga::info("Patente sincronizada: {}; Alchemy base {}",rank,BaseActorValue(player, RE::ActorValue::kAlchemy));
}
std::map<Rules::ID,int> Inventory()
{
    std::map<Rules::ID,int> result;
    auto* player=RE::PlayerCharacter::GetSingleton();
    if(!player) return result;
    for(auto& [object, data]:player->GetInventory([](RE::TESBoundObject& object){return object.Is(RE::FormType::Ingredient);}))
        if(object && data.first>0 && data.second && !data.second->IsQuestObject()) result[object->GetFormID()]=data.first;
    return result;
}
bool Known(RE::IngredientItem* ingredient,RE::EffectSetting* effect)
{
    for(std::uint32_t i=0;i<ingredient->effects.size() && i<4;++i)
        if(ingredient->effects[i] && ingredient->effects[i]->baseEffect==effect)
            return (ingredient->gamedata.knownEffectFlags & (1u<<i))!=0;
    return false;
}
Json InventoryJSON()
{
    Json result=Json::array();
    for(auto [id,count]:Inventory()) {
        auto* item=RE::TESForm::LookupByID<RE::IngredientItem>(id);
        Json effects=Json::array();
        for(auto* effect:item->effects) {
            if(!effect || !effect->baseEffect) continue;
            bool known=config.debug || Known(item,effect->baseEffect);
            Json data={{"known",known}};
            if(known) data["name"]=effect->baseEffect->GetName();
            effects.push_back(data);
        }
        result.push_back({{"id",std::to_string(id)},{"name",item->GetName()},{"count",count},{"effects",effects}});
    }
    std::sort(result.begin(),result.end(),[](auto& a,auto& b){return a["name"].template get<std::string>()<b["name"].template get<std::string>();});
    return result;
}
float Setting(const char* name)
{
    auto* setting=RE::GameSettingCollection::GetSingleton()->GetSetting(name);
    if(!setting || setting->GetType()!=RE::Setting::Type::kFloat) throw std::runtime_error(std::string("GMST não encontrado: ")+name);
    return setting->data.f;
}

float CurrentActorValue(RE::Actor* actor, RE::ActorValue value)
{
    // ActorValueOwner moves between Skyrim runtimes. A direct inherited virtual
    // call bakes in one layout; this CommonLib accessor selects the live layout.
    auto* owner = actor ? actor->AsActorValueOwner() : nullptr;
    return owner ? owner->GetActorValue(value) : 0.0f;
}

float BaseActorValue(RE::Actor* actor, RE::ActorValue value)
{
    auto* owner = actor ? actor->AsActorValueOwner() : nullptr;
    return owner ? owner->GetBaseActorValue(value) : 0.0f;
}

void SetBaseActorValue(RE::Actor* actor, RE::ActorValue value, float amount)
{
    if (auto* owner = actor ? actor->AsActorValueOwner() : nullptr)
        owner->SetBaseActorValue(value, amount);
}
}
