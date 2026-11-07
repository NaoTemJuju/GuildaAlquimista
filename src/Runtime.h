#pragma once
#include "PCH.h"
#include "Rules.h"

namespace GA {
struct Config {
    Json document;
    bool debug{};
    bool matchVanillaVisuals{true};
    int maxOperations{100};
    double purificationSeconds{8.0};
    double stabilizationSeconds{6.0};
    double concentrationSeconds{12.0};
    std::array<double, 6> purification{1,1,1,1,.90,1};
    std::array<double, 6> stabilizationWanted{1,1,.65,.80,.85,1};
    std::array<double, 6> stabilizationUnwanted{1,1,.50,.40,.30,.20};
    std::array<double, 6> concentration{1,1,1,1,1.10,1.15};
};
struct AlchemyScalingRule {
    enum class Mode { ActorValue, Multiply };
    Mode mode{Mode::Multiply};
    float value{1.0f};
    float minimumAlchemy{};
    std::vector<RE::BGSKeyword*> keywords;
};
extern Config config;
extern RE::TESObjectACTI* workbench;
extern std::array<RE::BGSPerk*, 5> guildRanks;
extern std::array<std::vector<RE::BGSPerk*>, 5> grants;
extern RE::BGSPerk* doubleToil;
extern std::array<RE::BGSKeyword*, 3> restoreKeywords;
extern RE::BGSKeyword* beneficialKeyword;
extern RE::BGSKeyword* harmfulKeyword;
extern RE::BGSPerk* apothecaryScalingPerk;
extern std::vector<AlchemyScalingRule> apothecaryScalingRules;
extern std::vector<RE::EffectSetting*> noviceEffects;
extern std::array<std::set<RE::EffectSetting*>, 6> rankEffects;
extern RE::TESBoundObject* emptyBottle;
bool LoadConfig();
bool ResolveForms();
int Rank();
void SyncGuildAlchemyRank();
std::map<Rules::ID, int> Inventory();
Json InventoryJSON();
bool Known(RE::IngredientItem* ingredient, RE::EffectSetting* effect);
RE::TESForm* Resolve(std::string_view key);
float Setting(const char* name);
float CurrentActorValue(RE::Actor* actor, RE::ActorValue value);
float BaseActorValue(RE::Actor* actor, RE::ActorValue value);
void SetBaseActorValue(RE::Actor* actor, RE::ActorValue value, float amount);

struct Request {
    std::vector<Rules::ID> ingredients;
    int operations{1};
    Rules::ID remove{}, stabilize{}, target{}, reagent{};
};
struct Virtue {
    RE::EffectSetting* base{};
    float magnitude{};
    std::uint32_t duration{}, area{};
    bool known{}, removed{}, stabilized{}, concentrated{};
    std::vector<Rules::ID> reagents;
    Rules::Axis axis{Rules::Axis::None};
};
struct Recipe {
    Request request;
    std::vector<Virtue> effects;
    std::map<Rules::ID, int> costs;
    int bottleCost{};
    int maximum{}, output{};
    bool poison{};
    float baseValue{};
    Json fingerprint;
};
Request ParseRequest(const Json& data);
Recipe Calculate(const Request& request);
Json PreviewJSON(const Recipe& recipe, const std::string& token);
void Craft(const Recipe& recipe);
void InitializeUI();
void InitializeMeridian();
void ProcessMeridianMessage(SKSE::MessagingInterface::Message* message);
void RegisterActivationSink();
void OpenWorkbench(RE::ObjectRefHandle handle);
void CloseWorkbench();
void ResetSession();
}
