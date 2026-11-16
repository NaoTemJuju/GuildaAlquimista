'use strict';

const { createHash } = require('node:crypto');
const {
  Axis,
  RANK_ORDER,
  batchSeconds,
  computeCosts,
  computeMaximum,
  fail,
  normalizeFormKey,
  normalizeRankId,
  rankIndex,
  scaleValue,
  scalingAxis
} = require('./rules.cjs');

function effectValue(virtue) {
  const magnitude = Math.max(1.0, Number(virtue.magnitude) || 0);
  const duration = Math.max(1.0, (Number(virtue.duration) || 0) / 10.0);
  return Math.floor(Math.max(0, Number(virtue.baseCost) || 0) * Math.pow(magnitude * duration, 1.1));
}

function buildAllowedEffectsSet(rank, config) {
  const idx = rankIndex(rank);
  if (idx >= 5) return null; // Mestre permite todos.
  const limits = config.forms?.rankEffectLimits;
  if (!limits || !limits.cumulative) fail('INVALID_CONFIG', 'Limites cumulativos ausentes na configuração.');
  const allowed = new Set();
  for (let i = 1; i <= idx; i += 1) {
    const key = RANK_ORDER[i];
    const list = limits[key]?.effects || [];
    for (const rawKey of list) allowed.add(normalizeFormKey(rawKey));
  }
  return allowed;
}

function apothecaryScalingFactor(hasApothecaryPerk, effectKeywords, skill, config) {
  if (!hasApothecaryPerk) return 1.0;
  const rules = config.forms?.apothecaryScaling?.rules || [];
  const keySet = new Set((effectKeywords || []).map(normalizeFormKey));
  let result = 1.0;
  for (const rule of rules) {
    if (skill < (rule.minimumAlchemy || 0)) continue;
    const matches = (rule.keywords || []).some(k => keySet.has(normalizeFormKey(k)));
    if (!matches) continue;
    const factor = rule.mode === 'actorValue' ? 1.0 + skill * rule.value : rule.value;
    if (!Number.isFinite(factor) || factor <= 0) {
      fail('APOTHECARY_SCALING_ERROR', 'O controlador do Apothecary produziu potência inválida.');
    }
    result *= factor;
  }
  return result;
}

function buildProductName(effects, isPoison) {
  const purified = effects.some(e => e.removed);
  const concentrated = effects.some(e => e.concentrated);
  const stabilized = effects.some(e => e.stabilized);

  let primary = null;
  for (const eff of effects) {
    if (!eff.removed && eff.hostile === isPoison) {
      if (!primary || effectValue(eff) > effectValue(primary)) primary = eff;
    }
  }
  if (!primary) fail('PRIMARY_EFFECT_MISSING', 'Efeito principal do produto ausente.');

  let label = primary.name || 'Alquimia';
  if (primary.effectKey === 'Skyrim.esm|03EB15') label = 'Restauração de Vida';
  if (primary.effectKey === 'Skyrim.esm|073F30') label = 'Paralisia';

  let name = (isPoison ? 'Veneno de ' : 'Poção de ') + label;
  if (purified) name += isPoison ? ' Purificado' : ' Purificada';
  if (stabilized) name += isPoison ? ' Estabilizado' : ' Estabilizada';
  if (concentrated) name += isPoison ? ' Concentrado' : ' Concentrada';
  return name;
}

function calculateRecipe({
  request,
  rank,
  alchemySkill = 20,
  fortifyPercent = 0,
  bottles = 0,
  inventoryByDefId,
  ingredientCatalogByDefId,
  activePerks = new Set(),
  config
}) {
  const normRank = normalizeRankId(rank);
  const idx = rankIndex(normRank);
  if (idx < 1) fail('RANK_TOO_LOW', 'A bancada exige a patente Novato.');

  if (!request || !Array.isArray(request.ingredients)) {
    fail('INVALID_REQUEST', 'Pedido de preparação inválido.');
  }
  const operations = Number(request.operations ?? 1);
  if (request.removeEffect && request.stabilizeEffect) {
    fail('CONFLICTING_PROCESSES', 'Purificar e estabilizar são alternativas.');
  }

  const maxCap = Math.min(config.maxOperations ?? 100, bottles);
  const unitCosts = computeCosts(request.ingredients, 1, request.reagent || null, 1);
  const maximum = computeMaximum(inventoryByDefId, unitCosts, maxCap);
  if (!Number.isSafeInteger(operations) || operations < 1 || operations > maximum) {
    fail('INSUFFICIENT_MATERIALS', 'Ingredientes ou garrafas insuficientes para essa quantidade.');
  }

  const selectedIngredients = request.ingredients.map(defId => {
    const ing = ingredientCatalogByDefId.get(defId);
    if (!ing) fail('INGREDIENT_NOT_FOUND', `Ingrediente desconhecido: ${defId}`);
    return ing;
  });

  const candidates = new Map();
  for (const ing of selectedIngredients) {
    const seen = new Set();
    for (const eff of ing.effects || []) {
      const effectKey = normalizeFormKey(eff.effectKey);
      if (seen.has(effectKey)) continue;
      seen.add(effectKey);
      if (!candidates.has(effectKey)) {
        candidates.set(effectKey, { occurrences: [], representative: null, value: -1 });
      }
      const cand = candidates.get(effectKey);
      cand.occurrences.push({ ingredient: ing, effect: eff });
      const val = effectValue(eff);
      if (val > cand.value) {
        cand.value = val;
        cand.representative = eff;
      }
    }
  }

  const costs = computeCosts(request.ingredients, operations, request.reagent || null, maximum);
  const bottleCost = operations;

  const gmstInit = Number(config.gameSettings?.fAlchemyIngredientInitMult ?? 4.0);
  const gmstSkill = Number(config.gameSettings?.fAlchemySkillFactor ?? 1.5);
  let power = gmstInit *
    (1.0 + (gmstSkill - 1.0) * (alchemySkill / 100.0)) *
    (1.0 + (fortifyPercent / 100.0));

  const effects = [];
  for (const [effectKey, cand] of candidates.entries()) {
    if (cand.occurrences.length < 2 || !cand.representative) continue;
    const src = cand.representative;
    const known = cand.occurrences.every(o => Boolean(o.effect.known));
    const axis = scalingAxis(
      src.powerAffectsMagnitude,
      src.powerAffectsDuration,
      src.noMagnitude,
      src.noDuration
    );
    effects.push({
      effectId: src.effectId,
      effectKey,
      name: src.name,
      baseCost: Number(src.baseCost) || 0,
      magnitude: Number(src.magnitude) || 0,
      duration: Number(src.duration) || 0,
      area: Number(src.area) || 0,
      hostile: Boolean(src.hostile),
      keywords: (src.keywords || []).map(normalizeFormKey),
      powerAffectsMagnitude: Boolean(src.powerAffectsMagnitude),
      powerAffectsDuration: Boolean(src.powerAffectsDuration),
      noMagnitude: Boolean(src.noMagnitude),
      noDuration: Boolean(src.noDuration),
      known,
      removed: false,
      stabilized: false,
      concentrated: false,
      reagents: cand.occurrences.map(o => o.ingredient.definitionId),
      axis
    });
  }

  if (!effects.length) fail('NO_SHARED_EFFECTS', 'Os ingredientes não compartilham nenhuma virtude.');

  const allowedSet = buildAllowedEffectsSet(normRank, config);
  if (allowedSet) {
    const blocked = effects.find(e => !allowedSet.has(e.effectKey));
    if (blocked) fail('RANK_EFFECT_LOCKED', 'Uma virtude da receita exige patente superior.');
  }

  let strongest = effects[0];
  for (const eff of effects) {
    if (effectValue(eff) > effectValue(strongest)) strongest = eff;
  }
  const makingPoison = strongest.hostile;

  const perkSet = new Set([...activePerks].map(normalizeFormKey));
  const masteryKey = config.forms?.rankGrants?.[0]?.perks?.[0];
  if (masteryKey && perkSet.has(normalizeFormKey(masteryKey))) {
    power *= 1.0 + alchemySkill * 0.01;
  }
  if (!Number.isFinite(power) || power <= 0 || power > 100) {
    fail('INVALID_ALCHEMY_POWER', 'Os modificadores de alquimia produziram potência inválida.');
  }

  const restoreKeys = (config.forms?.vokriiKeywords?.restore || []).map(normalizeFormKey);
  const beneficialKey = normalizeFormKey(config.forms?.vokriiKeywords?.beneficial || 'Skyrim.esm|0F8A4E');
  const harmfulKey = normalizeFormKey(config.forms?.vokriiKeywords?.harmful || 'Skyrim.esm|042509');
  const physicianPerk = normalizeFormKey(config.forms?.rankGrants?.[1]?.perks?.[0] || 'Skyrim.esm|058215');
  const benefactorPerk = normalizeFormKey(config.forms?.rankGrants?.[2]?.perks?.[0] || 'Skyrim.esm|058216');
  const poisonerPerk = normalizeFormKey(config.forms?.rankGrants?.[2]?.perks?.[1] || 'Skyrim.esm|058217');
  const apothecaryPerk = normalizeFormKey(config.forms?.apothecaryScaling?.perk || 'Apothecary.esp|0CB06C');
  const hasApothecary = perkSet.has(apothecaryPerk);

  for (const virtue of effects) {
    let effPower = power;
    if (!makingPoison && perkSet.has(physicianPerk) && restoreKeys.some(k => virtue.keywords.includes(k))) {
      effPower *= 1.25;
    }
    if (!makingPoison && perkSet.has(benefactorPerk) && virtue.keywords.includes(beneficialKey)) {
      effPower *= 1.25;
    }
    if (makingPoison && perkSet.has(poisonerPerk) && virtue.keywords.includes(harmfulKey)) {
      effPower *= 1.25;
    }
    effPower *= apothecaryScalingFactor(hasApothecary, virtue.keywords, alchemySkill, config);
    if (virtue.powerAffectsMagnitude && !virtue.noMagnitude) {
      virtue.magnitude = Math.round(virtue.magnitude * effPower);
    }
    if (virtue.powerAffectsDuration && !virtue.noDuration) {
      virtue.duration = Math.max(1, Math.round(virtue.duration * effPower));
    }
  }

  if (request.removeEffect || request.stabilizeEffect) {
    const purify = Boolean(request.removeEffect);
    if (purify && idx < 4) fail('RANK_TOO_LOW', 'Purificação exige a patente Especialista.');
    if (!purify && idx < 2) fail('RANK_TOO_LOW', 'Estabilização exige a patente Aprendiz.');
    const selectedId = purify ? request.removeEffect : request.stabilizeEffect;
    const target = effects.find(e => e.effectId === selectedId);
    if (!target || !target.known || target.hostile === makingPoison) {
      fail('INVALID_REFINE_TARGET', 'Escolha uma virtude secundária indesejada e conhecida.');
    }
    const desiredCount = effects.filter(e => e.hostile === makingPoison).length;
    const undesiredCount = effects.length - desiredCount;
    if (purify && (desiredCount !== 1 || undesiredCount !== 1)) {
      fail('PURIFY_SHAPE_INVALID', 'Purificar exige exatamente uma virtude desejada e uma indesejada.');
    }
    if (purify) target.removed = true;
    for (const eff of effects) {
      if (eff.removed) continue;
      let factor = 1.0;
      if (purify) {
        factor = Number(config.purification?.[normRank] ?? 1.0);
      } else if (eff === target) {
        factor = Number(config.stabilization?.[normRank]?.unwanted ?? 1.0);
      } else if (eff.hostile === makingPoison) {
        factor = Number(config.stabilization?.[normRank]?.wanted ?? 1.0);
      }
      if (!purify && eff === target) eff.stabilized = true;
      if (!eff.noMagnitude && eff.magnitude > 0) {
        eff.magnitude = scaleValue(eff.magnitude, factor, false);
      } else if (!eff.noDuration && eff.duration > 0) {
        eff.duration = scaleValue(eff.duration, factor, true);
      } else if (factor !== 1.0) {
        fail('UNSAFE_REFINEMENT', 'Esta virtude não pode ser refinada com segurança.');
      }
    }
  }

  if (request.concentrateEffect || request.reagent) {
    if (idx < 4) fail('RANK_TOO_LOW', 'Concentração exige a patente Especialista.');
    if (!request.concentrateEffect || !request.reagent) {
      fail('INVALID_CONCENTRATION', 'Escolha uma virtude e um reagente de suporte.');
    }
    const target = effects.find(e => e.effectId === request.concentrateEffect);
    if (!target || target.removed || !target.known) {
      fail('INVALID_CONCENTRATION', 'A virtude de concentração deve ser conhecida e permanecer no produto.');
    }
    if (!target.reagents.includes(request.reagent)) {
      fail('INVALID_REAGENT', 'O reagente escolhido não sustenta essa virtude.');
    }
    if (target.axis === Axis.None) {
      fail('UNSAFE_CONCENTRATION', 'Essa virtude não possui um único eixo seguro de concentração.');
    }
    const factor = Number(config.concentration?.[normRank] ?? 1.0);
    if (target.axis === Axis.Magnitude) {
      target.magnitude = scaleValue(target.magnitude, factor, false);
    } else {
      target.duration = scaleValue(target.duration, factor, true);
    }
    target.concentrated = true;
  }

  const remaining = effects.filter(e => !e.removed);
  if (!remaining.length) fail('EMPTY_RECIPE', 'A preparação não pode terminar sem virtudes.');

  let baseValue = 0;
  for (const eff of remaining) baseValue += effectValue(eff);

  const doubleToilKey = normalizeFormKey(config.forms?.rankGrants?.[4]?.perks?.[0] || 'Vokrii - Minimalistic Perks of Skyrim.esp|27A1E1');
  const doubled = perkSet.has(doubleToilKey);
  const outputCount = operations * (doubled ? 2 : 1);

  const stages = [
    { name: 'Preparando', seconds: batchSeconds(operations, normRank, config.timing) }
  ];
  if (request.stabilizeEffect) stages.push({ name: 'Estabilizando', seconds: Number(config.timing?.stabilizationSeconds ?? 6) });
  if (request.removeEffect) stages.push({ name: 'Purificando', seconds: Number(config.timing?.purificationSeconds ?? 8) });
  if (request.concentrateEffect) stages.push({ name: 'Concentrando', seconds: Number(config.timing?.concentrationSeconds ?? 12) });
  const craftSeconds = stages.reduce((sum, s) => sum + s.seconds, 0);

  const productName = buildProductName(effects, makingPoison);
  const costsObj = Object.fromEntries(costs.entries());
  const fingerprintPayload = {
    ingredients: request.ingredients,
    operations,
    removeEffect: request.removeEffect || null,
    stabilizeEffect: request.stabilizeEffect || null,
    concentrateEffect: request.concentrateEffect || null,
    reagent: request.reagent || null,
    rank: normRank,
    costs: costsObj,
    bottleCost,
    outputCount,
    poison: makingPoison,
    effects: effects.map(e => ({
      effectKey: e.effectKey,
      magnitude: Math.round(e.magnitude * 1000) / 1000,
      duration: e.duration,
      area: e.area,
      removed: e.removed,
      stabilized: e.stabilized,
      concentrated: e.concentrated
    }))
  };
  const fingerprint = createHash('sha256').update(JSON.stringify(fingerprintPayload)).digest('hex');

  return {
    request: {
      ingredients: [...request.ingredients],
      operations,
      removeEffect: request.removeEffect || null,
      stabilizeEffect: request.stabilizeEffect || null,
      concentrateEffect: request.concentrateEffect || null,
      reagent: request.reagent || null
    },
    rank: normRank,
    poison: makingPoison,
    productName,
    effects,
    costs,
    bottleCost,
    maximum,
    outputCount,
    doubleToil: doubled,
    baseValue,
    stages,
    craftSeconds,
    fingerprint
  };
}

function buildUiPreview(recipe, token, inventoryByDefId, ingredientCatalogByDefId, bottles) {
  const rankIdx = rankIndex(recipe.rank);
  const costs = [];
  for (const [defId, required] of recipe.costs.entries()) {
    const ing = ingredientCatalogByDefId.get(defId);
    costs.push({
      definitionId: defId,
      name: ing ? ing.name : defId,
      required,
      available: inventoryByDefId.get(defId) ?? 0
    });
  }
  costs.push({
    definitionId: 'alchemy:empty-bottle',
    name: 'Garrafa vazia',
    required: recipe.bottleCost,
    available: bottles
  });

  const visibleEffects = recipe.effects.filter(e => !e.removed);
  const canStabilize = rankIdx >= 2 && visibleEffects.some(e => e.known && e.hostile !== recipe.poison);
  const desiredCount = visibleEffects.filter(e => e.hostile === recipe.poison).length;
  const canPurify = rankIdx >= 4 && visibleEffects.length === 2 && desiredCount === 1 &&
    visibleEffects.some(e => e.known && e.hostile !== recipe.poison);
  const canConcentrate = rankIdx >= 4 && visibleEffects.some(e => e.known && e.axis !== Axis.None);

  return {
    token,
    productType: recipe.poison ? 'veneno' : 'poção benéfica',
    productName: recipe.productName,
    maxOperations: recipe.maximum,
    outputCount: recipe.outputCount,
    doubleToil: recipe.doubleToil,
    craftSeconds: recipe.craftSeconds,
    stages: recipe.stages,
    costs,
    canStabilize,
    canPurify,
    canConcentrate,
    canFinalize: true,
    stabilizeReason: rankIdx >= 2 ? 'Reduz a virtude indesejada e parte da potência principal.' : 'Requer rank Aprendiz',
    purifyReason: rankIdx >= 4 ? 'Exige exatamente uma virtude desejada e uma indesejada.' : 'Requer rank Especialista',
    concentrateReason: rankIdx >= 4 ? 'Consome uma cópia extra do reagente por operação; bônus limitado a 15%.' : 'Requer rank Especialista',
    effects: visibleEffects.map(e => ({
      effectId: e.effectId,
      known: e.known,
      name: e.known ? e.name : '???',
      hostile: e.hostile,
      magnitude: e.known && !e.noMagnitude ? e.magnitude : null,
      duration: e.known && !e.noDuration ? e.duration : null,
      stabilized: e.stabilized,
      concentrated: e.concentrated,
      canRefine: e.known && e.hostile !== recipe.poison,
      canConcentrate: e.known && !e.removed && e.axis !== Axis.None,
      reagents: e.reagents
    }))
  };
}

module.exports = {
  apothecaryScalingFactor,
  buildAllowedEffectsSet,
  buildProductName,
  buildUiPreview,
  calculateRecipe,
  effectValue
};
