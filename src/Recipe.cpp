#include "Runtime.h"

namespace GA {
namespace {
Rules::ID ParseID(const Json& value)
{
    if (value.is_null()) return 0;
    if (!value.is_string()) throw std::runtime_error("Identificador de formulário inválido.");
    const auto text = value.get<std::string>();
    Rules::ID id{};
    const auto [end, error] = std::from_chars(text.data(), text.data() + text.size(), id, 10);
    if (error != std::errc{} || end != text.data() + text.size() || !id)
        throw std::runtime_error("Identificador de formulário inválido.");
    return id;
}

bool Flag(const RE::EffectSetting* effect, RE::EffectSetting::EffectSettingData::Flag flag)
{
    return effect->data.flags.all(flag);
}

double EffectValue(const Virtue& effect)
{
    const double magnitude = (std::max)(1.0, static_cast<double>(effect.magnitude));
    const double duration = (std::max)(1.0, static_cast<double>(effect.duration) / 10.0);
    return std::floor((std::max)(0.0, static_cast<double>(effect.base->data.baseCost)) * std::pow(magnitude * duration, 1.1));
}

Json EffectFingerprint(const Virtue& effect)
{
    return {
        {"id", effect.base->GetFormID()},
        {"magnitude", std::round(effect.magnitude * 1000.0f) / 1000.0f},
        {"duration", effect.duration},
        {"area", effect.area},
        {"removed", effect.removed},
        {"concentrated", effect.concentrated}
    };
}

void FillEffects(RE::BSTArray<RE::Effect>& output, const Recipe& recipe)
{
    for (const auto& virtue : recipe.effects) {
        if (virtue.removed) continue;
        output.emplace_back();
        auto& effect = output.back();
        effect.baseEffect = virtue.base;
        effect.effectItem.magnitude = virtue.magnitude;
        effect.effectItem.duration = virtue.duration;
        effect.effectItem.area = virtue.area;
        effect.cost = static_cast<float>(EffectValue(virtue));
    }
    if (output.empty()) throw std::runtime_error("A purificação removeria todas as virtudes da preparação.");
}

void NameProduct(RE::AlchemyItem* product, const Recipe& recipe)
{
    if (!product) throw std::runtime_error("O jogo não conseguiu criar o produto alquímico.");
    const bool purified = std::ranges::any_of(recipe.effects, [](const auto& effect) { return effect.removed; });
    const bool concentrated = std::ranges::any_of(recipe.effects, [](const auto& effect) { return effect.concentrated; });
    std::string name = recipe.poison ? "Veneno da Guilda" : "Poção da Guilda";
    if (purified) name += " Purificada";
    if (concentrated) name += " Concentrada";
    product->SetFullName(name.c_str());
}

bool IsRegisteredProduct(RE::BGSCreatedObjectManager* manager, RE::AlchemyItem* product, bool poison,
    std::uint32_t& referenceCount)
{
    referenceCount = 0;
    if (!manager || !product || !product->IsDynamicForm() || !product->Is(RE::FormType::AlchemyItem)) return false;
    const auto id = product->GetFormID();
    auto& registry = poison ? manager->poisons : manager->potions;
    const auto entry = registry.find(id);
    if (entry == registry.end() || entry->second.magicItem != product) return false;
    referenceCount = entry->second.refCount;
    return true;
}

// CommitProduct only proves the product survived the inventory add and the
// ingredient consumption. It says nothing about who, if anyone, still holds a
// reference to the dynamic form once Craft() returns. The 'created' smart
// pointer passed in here is the manager's own initial reference; if nothing
// else has acquired one of its own by this point, that pointer going out of
// scope at the end of Craft() releases the last reference the manager knows
// about, and the dynamic form can be torn down while the player's container
// still points at it by FormID. Each product type keeps its own static
// holding list, matching the smart pointer type actually returned for that
// type by BGSCreatedObjectManager.
template <typename Ptr>
void PersistProductReference(RE::BGSCreatedObjectManager* manager, RE::AlchemyItem* product, bool poison,
    const Ptr& created)
{
    std::uint32_t refs{};
    if (!IsRegisteredProduct(manager, product, poison, refs)) {
        logga::critical("Produto perdeu o registro do jogo após a transação: ptr={} FormID={:08X}",
            fmt::ptr(product), product->GetFormID());
        return;
    }
    static std::vector<Ptr> held;
    static std::mutex heldMutex;
    if (refs <= 1) {
        std::lock_guard lock(heldMutex);
        held.push_back(created);
        logga::info("Referência persistente transferida ao inventário: ptr={} FormID={:08X} refs {}->{}",
            fmt::ptr(product), product->GetFormID(), refs, refs + 1);
    } else {
        logga::info("Inventário adquiriu referência do produto: ptr={} FormID={:08X} refs={}",
            fmt::ptr(product), product->GetFormID(), refs);
    }
}

void RemoveAddedProduct(RE::PlayerCharacter* player, RE::AlchemyItem* product, std::int32_t count)
{
    if (!player || !product || count <= 0) return;
    const auto before = player->GetItemCount(product);
    player->RemoveItem(product, count, RE::ITEM_REMOVE_REASON::kRemove, nullptr, nullptr);
    const auto after = player->GetItemCount(product);
    if (before - after != count) {
        logga::critical("Rollback incompleto do produto: ptr={} FormID={:08X} esperado={} removido={}",
            fmt::ptr(product), product->GetFormID(), count, before - after);
    }
}

void CommitProduct(RE::AlchemyItem* product, const Recipe& recipe, RE::PlayerCharacter* player,
    RE::BGSCreatedObjectManager* manager)
{
    if (!product) throw std::runtime_error("O jogo não retornou um produto alquímico válido.");
    if (recipe.output <= 0) throw std::runtime_error("A quantidade de produto calculada é inválida.");

    std::uint32_t managerRefs{};
    const bool registered = IsRegisteredProduct(manager, product, recipe.poison, managerRefs);
    logga::info("Produto criado: tipo={} ptr={} FormID={:08X} dinâmico={} registrado={} refs={}",
        recipe.poison ? "veneno" : "poção", fmt::ptr(product), product->GetFormID(),
        product->IsDynamicForm(), registered, managerRefs);
    if (!registered) throw std::runtime_error("O produto criado não foi registrado pelo jogo.");

    NameProduct(product, recipe);
    const auto outputBefore = player->GetItemCount(product);
    logga::info("Adicionando produto ao jogador: ptr={} FormID={:08X} quantidade={} antes={}",
        fmt::ptr(product), product->GetFormID(), recipe.output, outputBefore);
    player->AddObjectToContainer(product, nullptr, recipe.output, nullptr);
    const auto outputAfter = player->GetItemCount(product);
    const auto added = outputAfter - outputBefore;
    logga::info("Resultado da adição: ptr={} FormID={:08X} solicitado={} adicionado={} depois={}",
        fmt::ptr(product), product->GetFormID(), recipe.output, added, outputAfter);
    if (added != recipe.output) {
        RemoveAddedProduct(player, product, (std::max)(added, 0));
        throw std::runtime_error("O jogo não adicionou o produto ao inventário; os ingredientes foram preservados.");
    }

    struct CostSnapshot {
        RE::IngredientItem* item{};
        std::uint32_t id{};
        std::int32_t count{};
        std::int32_t before{};
    };
    std::vector<CostSnapshot> costs;
    costs.reserve(recipe.costs.size());
    for (auto [id, count] : recipe.costs) {
        auto* item = RE::TESForm::LookupByID<RE::IngredientItem>(id);
        if (!item || count <= 0) {
            RemoveAddedProduct(player, product, recipe.output);
            throw std::runtime_error("Um ingrediente deixou de existir antes do consumo.");
        }
        const auto before = player->GetItemCount(item);
        if (before < count) {
            RemoveAddedProduct(player, product, recipe.output);
            throw std::runtime_error("Os ingredientes mudaram antes do consumo; o produto foi revertido.");
        }
        costs.push_back({item, id, count, before});
    }

    std::size_t completed{};
    for (; completed < costs.size(); ++completed) {
        const auto& cost = costs[completed];
        player->RemoveItem(cost.item, cost.count, RE::ITEM_REMOVE_REASON::kRemove, nullptr, nullptr);
        const auto after = player->GetItemCount(cost.item);
        const auto removed = cost.before - after;
        logga::info("Consumo: FormID={:08X} solicitado={} removido={} antes={} depois={}",
            cost.id, cost.count, removed, cost.before, after);
        if (removed == cost.count) continue;

        if (removed > 0) player->AddObjectToContainer(cost.item, nullptr, removed, nullptr);
        for (std::size_t i = 0; i < completed; ++i)
            player->AddObjectToContainer(costs[i].item, nullptr, costs[i].count, nullptr);
        RemoveAddedProduct(player, product, recipe.output);
        throw std::runtime_error("Falha ao consumir os ingredientes; a operação foi revertida.");
    }
}
}

Request ParseRequest(const Json& data)
{
    if (!data.is_object()) throw std::runtime_error("Pedido de preparação inválido.");
    Request request;
    const auto& ids = data.at("ingredients");
    if (!ids.is_array()) throw std::runtime_error("A lista de ingredientes é inválida.");
    for (const auto& id : ids) request.ingredients.push_back(ParseID(id));
    request.operations = data.at("operations").get<int>();
    if (auto it = data.find("removeEffect"); it != data.end()) request.remove = ParseID(*it);
    if (auto it = data.find("concentrateEffect"); it != data.end()) request.target = ParseID(*it);
    if (auto it = data.find("reagent"); it != data.end()) request.reagent = ParseID(*it);
    return request;
}

Recipe Calculate(const Request& request)
{
    auto* player = RE::PlayerCharacter::GetSingleton();
    if (!player) throw std::runtime_error("Jogador indisponível.");
    const auto rank = Rank();
    if (rank < 1) throw std::runtime_error("A bancada exige a patente Novato.");
    logga::debug("Receita: ingredientes={} operações={} remover={:08X} concentrar={:08X} reagente={:08X}",
        Json(request.ingredients).dump(), request.operations, request.remove, request.target, request.reagent);

    // Build unit costs first. A concentration operation consumes one extra copy
    // of the selected supporting ingredient per finished operation.
    auto unitCosts = Rules::Costs(request.ingredients, 1, request.reagent, 1);
    const auto inventory = Inventory();
    const int maximum = Rules::Maximum(inventory, unitCosts, config.maxOperations);
    if (request.operations < 1 || request.operations > maximum)
        throw std::runtime_error("Ingredientes insuficientes para essa quantidade.");

    std::vector<RE::IngredientItem*> ingredients;
    ingredients.reserve(request.ingredients.size());
    for (auto id : request.ingredients) {
        auto* ingredient = RE::TESForm::LookupByID<RE::IngredientItem>(id);
        if (!ingredient) throw std::runtime_error("Um ingrediente selecionado não existe mais.");
        ingredients.push_back(ingredient);
    }

    struct Candidate {
        std::vector<std::pair<RE::IngredientItem*, RE::Effect*>> occurrences;
        RE::Effect* representative{};
        double value{-1.0};
    };
    std::map<RE::EffectSetting*, Candidate> candidates;
    for (auto* ingredient : ingredients) {
        std::set<RE::EffectSetting*> seen;
        for (auto* effect : ingredient->effects) {
            if (!effect || !effect->baseEffect || !seen.insert(effect->baseEffect).second) continue;
            auto& candidate = candidates[effect->baseEffect];
            candidate.occurrences.emplace_back(ingredient, effect);
            const Virtue raw{effect->baseEffect, effect->effectItem.magnitude, effect->effectItem.duration, effect->effectItem.area};
            const auto value = EffectValue(raw);
            if (value > candidate.value) {
                candidate.value = value;
                candidate.representative = effect;
            }
        }
    }

    Recipe recipe;
    recipe.request = request;
    recipe.maximum = maximum;
    recipe.costs = Rules::Costs(request.ingredients, request.operations, request.reagent, maximum);
    const float skill = CurrentActorValue(player, RE::ActorValue::kAlchemy);
    const float fortify = CurrentActorValue(player, RE::ActorValue::kAlchemyModifier) +
                          CurrentActorValue(player, RE::ActorValue::kAlchemyPowerModifier);
    float power = Setting("fAlchemyIngredientInitMult") *
        (1.0f + (Setting("fAlchemySkillFactor") - 1.0f) * skill / 100.0f) *
        (1.0f + fortify / 100.0f);

    for (auto& [base, candidate] : candidates) {
        if (candidate.occurrences.size() < 2 || !candidate.representative) continue;
        auto* source = candidate.representative;
        Virtue virtue;
        virtue.base = base;
        virtue.magnitude = source->effectItem.magnitude;
        virtue.duration = source->effectItem.duration;
        virtue.area = source->effectItem.area;
        virtue.known = std::ranges::all_of(candidate.occurrences, [base](const auto& pair) { return Known(pair.first, base); });
        for (const auto& [ingredient, unused] : candidate.occurrences) virtue.reagents.push_back(ingredient->GetFormID());

        const auto flags = base->data.flags;
        virtue.axis = Rules::ScalingAxis(
            flags.all(RE::EffectSetting::EffectSettingData::Flag::kPowerAffectsMagnitude),
            flags.all(RE::EffectSetting::EffectSettingData::Flag::kPowerAffectsDuration),
            flags.all(RE::EffectSetting::EffectSettingData::Flag::kNoMagnitude),
            flags.all(RE::EffectSetting::EffectSettingData::Flag::kNoDuration));
        recipe.effects.push_back(std::move(virtue));
    }
    if (recipe.effects.empty()) throw std::runtime_error("Os ingredientes não compartilham nenhuma virtude.");

    // Skyrim evaluates the potion/poison context from the strongest unscaled
    // result. Vokrii's Physician, Benefactor and Poisoner conditions use this
    // context plus the installed effect keywords read from the load order.
    const auto strongest = std::ranges::max_element(recipe.effects, {}, [](const auto& effect) { return EffectValue(effect); });
    const bool makingPoison = strongest != recipe.effects.end() && strongest->base->IsHostile();
    if (grants[0][0] && player->HasPerk(grants[0][0])) power *= 1.0f + skill * 0.01f;
    if (!std::isfinite(power) || power <= 0.0f || power > 100.0f)
        throw std::runtime_error("Os modificadores de alquimia produziram potência inválida.");
    for (auto& virtue : recipe.effects) {
        float effectPower = power;
        const bool physician = !makingPoison && grants[1][0] && player->HasPerk(grants[1][0]) &&
            std::ranges::any_of(restoreKeywords, [&virtue](auto* keyword) { return virtue.base->HasKeyword(keyword); });
        const bool benefactor = !makingPoison && grants[2][0] && player->HasPerk(grants[2][0]) &&
            virtue.base->HasKeyword(beneficialKeyword);
        const bool poisoner = makingPoison && grants[2].size() > 1 && player->HasPerk(grants[2][1]) &&
            virtue.base->HasKeyword(harmfulKeyword);
        if (physician) effectPower *= 1.25f;
        if (benefactor) effectPower *= 1.25f;
        if (poisoner) effectPower *= 1.25f;
        const auto flags = virtue.base->data.flags;
        if (flags.all(RE::EffectSetting::EffectSettingData::Flag::kPowerAffectsMagnitude) &&
            !flags.all(RE::EffectSetting::EffectSettingData::Flag::kNoMagnitude))
            virtue.magnitude = static_cast<float>(std::lround(virtue.magnitude * effectPower));
        if (flags.all(RE::EffectSetting::EffectSettingData::Flag::kPowerAffectsDuration) &&
            !flags.all(RE::EffectSetting::EffectSettingData::Flag::kNoDuration))
            virtue.duration = static_cast<std::uint32_t>((std::max)(1l, std::lround(virtue.duration * effectPower)));
        logga::debug("Efeito {:08X} {}: mag={} dur={} conhecido={} potência={}", virtue.base->GetFormID(),
            virtue.base->GetName(), virtue.magnitude, virtue.duration, virtue.known, effectPower);
    }

    if (request.remove) {
        if (rank < 3) throw std::runtime_error("Purificação exige a patente Adepto.");
        auto it = std::ranges::find(recipe.effects, request.remove, [](const auto& effect) { return effect.base->GetFormID(); });
        if (it == recipe.effects.end() || !it->known) throw std::runtime_error("Só é possível remover uma virtude conhecida da preparação.");
        if (request.target == request.remove) throw std::runtime_error("A mesma virtude não pode ser removida e concentrada.");
        it->removed = true;
        for (auto& effect : recipe.effects) {
            if (effect.removed) continue;
            const auto factor = config.purification[rank];
            if (!Flag(effect.base, RE::EffectSetting::EffectSettingData::Flag::kNoMagnitude) && effect.magnitude > 0)
                effect.magnitude = static_cast<float>(Rules::Scale(effect.magnitude, factor, false));
            else if (!Flag(effect.base, RE::EffectSetting::EffectSettingData::Flag::kNoDuration) && effect.duration > 0)
                effect.duration = static_cast<std::uint32_t>(Rules::Scale(effect.duration, factor, true));
        }
    }

    if (request.target || request.reagent) {
        if (rank < 4) throw std::runtime_error("Concentração exige a patente Especialista.");
        if (!request.target || !request.reagent) throw std::runtime_error("Escolha uma virtude e um reagente de suporte.");
        auto it = std::ranges::find(recipe.effects, request.target, [](const auto& effect) { return effect.base->GetFormID(); });
        if (it == recipe.effects.end() || it->removed || !it->known)
            throw std::runtime_error("A virtude de concentração deve ser conhecida e permanecer no produto.");
        if (!std::ranges::contains(it->reagents, request.reagent))
            throw std::runtime_error("O reagente escolhido não sustenta essa virtude.");
        if (it->axis == Rules::Axis::None)
            throw std::runtime_error("Essa virtude não possui um único eixo seguro de concentração.");
        const auto factor = config.concentration[rank];
        if (it->axis == Rules::Axis::Magnitude)
            it->magnitude = static_cast<float>(Rules::Scale(it->magnitude, factor, false));
        else
            it->duration = static_cast<std::uint32_t>(Rules::Scale(it->duration, factor, true));
        it->concentrated = true;
    }

    double costliest = -1.0;
    for (const auto& effect : recipe.effects) {
        if (effect.removed) continue;
        const auto value = EffectValue(effect);
        recipe.baseValue += static_cast<float>(value);
        if (value > costliest) {
            costliest = value;
            recipe.poison = effect.base->IsHostile();
        }
    }
    if (costliest < 0.0) throw std::runtime_error("A preparação não pode terminar sem virtudes.");
    const bool doubled = doubleToil && player->HasPerk(doubleToil);
    recipe.output = request.operations * (doubled ? 2 : 1);
    recipe.fingerprint = {
        {"ingredients", request.ingredients}, {"operations", request.operations},
        {"remove", request.remove}, {"target", request.target}, {"reagent", request.reagent},
        {"rank", rank}, {"costs", recipe.costs}, {"output", recipe.output}, {"poison", recipe.poison}
    };
    recipe.fingerprint["effects"] = Json::array();
    for (const auto& effect : recipe.effects) recipe.fingerprint["effects"].push_back(EffectFingerprint(effect));
    return recipe;
}

Json PreviewJSON(const Recipe& recipe, const std::string& token)
{
    const auto inventory = Inventory();
    Json effects = Json::array();
    for (const auto& effect : recipe.effects) {
        Json value = {
            {"id", std::to_string(effect.base->GetFormID())}, {"known", effect.known},
            {"removed", effect.removed}, {"concentrated", effect.concentrated},
            {"hostile", effect.base->IsHostile()}, {"canConcentrate", effect.known && !effect.removed && effect.axis != Rules::Axis::None},
            {"reagents", Json::array()}
        };
        for (auto id : effect.reagents) value["reagents"].push_back(std::to_string(id));
        if (effect.known || config.debug) {
            value["name"] = effect.base->GetName();
            if (!Flag(effect.base, RE::EffectSetting::EffectSettingData::Flag::kNoMagnitude)) value["magnitude"] = effect.magnitude;
            if (!Flag(effect.base, RE::EffectSetting::EffectSettingData::Flag::kNoDuration)) value["duration"] = effect.duration;
        }
        effects.push_back(std::move(value));
    }
    Json costs = Json::array();
    for (auto [id, required] : recipe.costs) {
        auto* item = RE::TESForm::LookupByID<RE::IngredientItem>(id);
        costs.push_back({{"id", std::to_string(id)}, {"name", item ? item->GetName() : "?"},
            {"required", required}, {"available", inventory.contains(id) ? inventory.at(id) : 0}});
    }
    const auto rank = Rank();
    return {
        {"token", token}, {"effects", effects}, {"costs", costs},
        {"maxOperations", recipe.maximum}, {"outputCount", recipe.output},
        {"doubleToil", doubleToil && RE::PlayerCharacter::GetSingleton()->HasPerk(doubleToil)},
        {"canPurify", rank >= 3 && std::ranges::any_of(recipe.effects, [](const auto& e) { return e.known; })},
        {"canConcentrate", rank >= 4 && std::ranges::any_of(recipe.effects, [](const auto& e) { return e.known && e.axis != Rules::Axis::None; })},
        {"canFinalize", true},
        {"purifyReason", rank >= 3 ? "Remove uma virtude conhecida; as restantes sofrem a perda da patente." : "Requer patente Adepto"},
        {"concentrateReason", rank >= 4 ? "Consome uma cópia extra do reagente por operação; bônus limitado a 15%." : "Requer patente Especialista"}
    };
}

void Craft(const Recipe& recipe)
{
    auto* player = RE::PlayerCharacter::GetSingleton();
    auto* manager = RE::BGSCreatedObjectManager::GetSingleton();
    if (!player || !manager) throw std::runtime_error("Serviço de criação do jogo indisponível.");
    const Recipe current = Calculate(recipe.request);
    if (current.fingerprint.dump() != recipe.fingerprint.dump())
        throw std::runtime_error("A receita ou o estado do personagem mudou; prepare novamente.");

    RE::BSTArray<RE::Effect> effects;
    FillEffects(effects, current);
    if (current.poison) {
        RE::BSTSmartPointer<RE::AlchemyItem> created;
        auto* product = manager->AddPoison(created, effects);
        if (!product || created.get() != product) throw std::runtime_error("Falha ao criar o veneno.");
        CommitProduct(product, current, player, manager);
        PersistProductReference(manager, product, true, created);
    } else {
        RE::CreatedObjPtr<RE::AlchemyItem> created;
        manager->AddPotion(created, effects);
        auto* product = created.get();
        if (!product) throw std::runtime_error("Falha ao criar a poção.");
        CommitProduct(product, current, player, manager);
        PersistProductReference(manager, product, false, created);
    }

    for (auto id : current.request.ingredients) {
        if (auto* ingredient = RE::TESForm::LookupByID<RE::IngredientItem>(id)) {
            for (const auto& effect : current.effects)
                if (std::ranges::contains(effect.reagents, id)) ingredient->LearnEffect(effect.base);
        }
    }
    // One grant per operation, independent of Double Toil's extra output.
    player->UseSkill(RE::ActorValue::kAlchemy, current.baseValue * current.request.operations, nullptr);
    logga::info("Produção concluída: {} operações, {} itens, valor-base {:.2f}",
        current.request.operations, current.output, current.baseValue);
}
}
