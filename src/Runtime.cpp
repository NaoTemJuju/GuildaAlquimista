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
        config.maxOperations = config.document.value("maxOperations", 100);
        if (config.maxOperations < 1 || config.maxOperations > 100) throw std::runtime_error("maxOperations deve estar entre 1 e 100");
        const char* ranks[] = {"adept", "specialist", "master"};
        for (int i=0; i<3; ++i) {
            auto value=config.document.at("purification").at(ranks[i]).get<double>();
            if (!std::isfinite(value) || value < .5 || value > 1) throw std::runtime_error("Purificação inválida");
            config.purification[i+3]=value;
        }
        for (int i=1; i<3; ++i) {
            auto value=config.document.at("concentration").at(ranks[i]).get<double>();
            if (!std::isfinite(value) || value < 1 || value > 1.15) throw std::runtime_error("Concentração excede 15%");
            config.concentration[i+3]=value;
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
        logga::info("Vokrii, Apothecary e GuildAlchemy resolvidos");
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
