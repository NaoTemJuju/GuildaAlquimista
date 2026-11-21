'use strict';

const { randomUUID } = require('node:crypto');
const { buildUiPreview, calculateRecipe } = require('./recipe-engine.cjs');
const { composeAlchemyProfessionGrants } = require('./perk-grants.cjs');
const { buildEffectTierMap, getEffectTier } = require('./research-engine.cjs');
const { fail, normalizeFormKey, normalizeRankId, rankIndex } = require('./rules.cjs');

function createAlchemyService({
  config,
  professionPort,
  inventoryPort,
  perkDeliveryPort = null,
  standby = false,
  now = Date.now,
  tokenTtlMs = 120_000
}) {
  if (!config) fail('INVALID_CONFIG', 'Configuração de Alquimia obrigatória.');
  const effectTierMap = buildEffectTierMap(config);
  const preparations = new Map();

  function purgeExpired() {
    const t = now();
    for (const [token, entry] of preparations.entries()) {
      if (entry.expiresAt <= t) preparations.delete(token);
    }
  }

  function standbyResponse() {
    return {
      ok: false,
      standby: true,
      code: 'ACTION_UNAVAILABLE',
      reason: 'Sistema de Alquimia em espera: aguardando ativação autoritativa no servidor.'
    };
  }

  function buildIngredientView(catalog, inventoryByDefId) {
    const list = [];
    for (const [defId, count] of inventoryByDefId.entries()) {
      if (count <= 0) continue;
      const item = catalog.get(defId);
      if (!item) continue;
      list.push({
        definitionId: defId,
        name: item.name,
        count,
        effects: (item.effects || []).map(eff => {
          const isKnown = Boolean(eff.known);
          if (!isKnown) {
            return { effectId: eff.effectId, known: false, name: null };
          }
          return {
            effectId: eff.effectId,
            known: true,
            name: eff.name,
            tier: getEffectTier(eff.effectKey, effectTierMap)
          };
        })
      });
    }
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return list;
  }

  function getAuxRecipeList() {
    const raw = config.research?.auxiliaryRecipes || {};
    return Object.values(raw).filter(r => r && typeof r.id === 'string' && Array.isArray(r.inputs));
  }

  function buildAuxView(inv, rank) {
    const idx = rankIndex(rank);
    const auxCounts = inv.auxCountsByKey instanceof Map ? inv.auxCountsByKey : new Map();
    return getAuxRecipeList().map(recipe => {
      let maxOps = config.maxOperations ?? 100;
      const inputs = recipe.inputs.map(inp => {
        const key = normalizeFormKey(inp.key);
        const available = Number(auxCounts.get(key) ?? inv.inventoryByDefId?.get(key) ?? 0);
        const req = Number(inp.count || 1);
        maxOps = Math.min(maxOps, Math.floor(Math.max(0, available) / Math.max(1, req)));
        return {
          key,
          name: inp.name,
          required: req,
          available
        };
      });
      const minRankIdx = rankIndex(recipe.minRank || 'novice');
      return {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description || '',
        outputKey: normalizeFormKey(recipe.output),
        outputName: recipe.outputName || recipe.name,
        outputCount: Number(recipe.outputCount || 1),
        seconds: Number(recipe.seconds || 4),
        minRank: recipe.minRank || 'novice',
        canCraft: idx >= minRankIdx && maxOps >= 1,
        maxOperations: Math.max(0, maxOps),
        inputs
      };
    });
  }

  async function syncGrants(ctx, rank) {
    if (!perkDeliveryPort || typeof perkDeliveryPort.projectProfessionGrants !== 'function') return;
    const grants = composeAlchemyProfessionGrants(rank, config);
    await perkDeliveryPort.projectProfessionGrants(ctx, grants);
  }

  async function getSnapshot(ctx) {
    if (standby || !professionPort || !inventoryPort) return standbyResponse();
    const career = await professionPort.getCareer(ctx);
    const inv = await inventoryPort.getAlchemyInventory(ctx);
    const rank = career.professionId === 'alchemist' ? normalizeRankId(career.rank) : 'none';
    await syncGrants(ctx, rank);

    return {
      ok: true,
      revision: Number(career.revision || 0),
      rank,
      characterName: ctx.characterName || '',
      portable: Boolean(inv.portableSession),
      hasPortableKit: Boolean(inv.hasPortableKit),
      vigor: career.vigor || null,
      bottles: Number(inv.bottles || 0),
      crystallizedBottles: Number(inv.crystallizedBottles || 0),
      dregsCount: Number(inv.dregsCount || 0),
      auxiliaryRecipes: buildAuxView(inv, rank),
      ingredients: buildIngredientView(inv.catalogByDefId, inv.inventoryByDefId),
      message: inv.portableSession
        ? 'Kit Portátil pronto. Selecione dois ou três ingredientes (Preparar simples, máx. 2).'
        : (rankIndex(rank) >= 1
          ? 'Bancada pronta. Selecione dois ou três ingredientes.'
          : 'Requer profissão Alquimista no rank Novato ou superior.')
    };
  }

  async function prepare(ctx, payload) {
    if (standby || !professionPort || !inventoryPort) return standbyResponse();
    purgeExpired();
    const career = await professionPort.getCareer(ctx);
    const rank = career.professionId === 'alchemist' ? normalizeRankId(career.rank) : 'none';
    const inv = await inventoryPort.getAlchemyInventory(ctx);
    const forcePortable = Boolean(inv.portableSession || (payload && payload.portable));
    if (forcePortable && !inv.hasPortableKit && !inv.portableSession) {
      fail('MISSING_PORTABLE_KIT', 'Você precisa de um Kit Alquímico Portátil no inventário.');
    }
    const normalizedPayload = payload && typeof payload === 'object'
      ? { ...payload, portable: forcePortable }
      : payload;

    const grants = composeAlchemyProfessionGrants(rank, config);
    const activePerks = new Set(grants.map(g => g.definition.stableFormKey));
    for (const extra of inv.activePerks || []) activePerks.add(normalizeFormKey(extra));

    const recipe = calculateRecipe({
      request: normalizedPayload,
      rank,
      alchemySkill: Number(inv.alchemySkill ?? 20),
      fortifyPercent: Number(inv.fortifyPercent ?? 0),
      bottles: Number(inv.bottles ?? 0),
      crystallizedBottles: Number(inv.crystallizedBottles ?? 0),
      signerName: ctx.characterName || '',
      inventoryByDefId: inv.inventoryByDefId,
      ingredientCatalogByDefId: inv.catalogByDefId,
      activePerks,
      config
    });

    const token = randomUUID();
    preparations.set(token, {
      sessionId: ctx.sessionId,
      characterId: ctx.characterId,
      signerName: ctx.characterName || '',
      request: recipe.request,
      fingerprint: recipe.fingerprint,
      expiresAt: now() + tokenTtlMs
    });

    return {
      ok: true,
      revision: Number(career.revision || 0),
      rank,
      characterName: ctx.characterName || '',
      portable: Boolean(recipe.portable),
      hasPortableKit: Boolean(inv.hasPortableKit),
      vigor: career.vigor || null,
      bottles: Number(inv.bottles || 0),
      crystallizedBottles: Number(inv.crystallizedBottles || 0),
      dregsCount: Number(inv.dregsCount || 0),
      auxiliaryRecipes: buildAuxView(inv, rank),
      ingredients: buildIngredientView(inv.catalogByDefId, inv.inventoryByDefId),
      preview: buildUiPreview(
        recipe,
        token,
        inv.inventoryByDefId,
        inv.catalogByDefId,
        Number(inv.bottles || 0),
        Number(inv.crystallizedBottles || 0)
      ),
      message: 'Preparação validada pelo servidor. Nenhum ingrediente foi consumido.'
    };
  }

  async function craft(ctx, payload) {
    if (standby || !professionPort || !inventoryPort) return standbyResponse();
    purgeExpired();
    const token = payload && typeof payload.token === 'string' ? payload.token : '';
    const saved = preparations.get(token);
    if (!saved || saved.sessionId !== ctx.sessionId || saved.characterId !== ctx.characterId) {
      fail('INVALID_TOKEN', 'Token de produção inválido, expirado ou já utilizado.');
    }
    preparations.delete(token);

    const career = await professionPort.getCareer(ctx);
    const rank = career.professionId === 'alchemist' ? normalizeRankId(career.rank) : 'none';
    const inv = await inventoryPort.getAlchemyInventory(ctx);
    if (saved.request.portable && !inv.hasPortableKit && !inv.portableSession) {
      fail('MISSING_PORTABLE_KIT', 'Você precisa de um Kit Alquímico Portátil no inventário.');
    }
    const grants = composeAlchemyProfessionGrants(rank, config);
    const activePerks = new Set(grants.map(g => g.definition.stableFormKey));
    for (const extra of inv.activePerks || []) activePerks.add(normalizeFormKey(extra));

    const current = calculateRecipe({
      request: saved.request,
      rank,
      alchemySkill: Number(inv.alchemySkill ?? 20),
      fortifyPercent: Number(inv.fortifyPercent ?? 0),
      bottles: Number(inv.bottles ?? 0),
      crystallizedBottles: Number(inv.crystallizedBottles ?? 0),
      signerName: saved.signerName || ctx.characterName || '',
      inventoryByDefId: inv.inventoryByDefId,
      ingredientCatalogByDefId: inv.catalogByDefId,
      activePerks,
      config
    });

    if (current.fingerprint !== saved.fingerprint) {
      fail('RECIPE_STALE', 'A receita ou o estado do personagem mudou; prepare novamente.');
    }

    const vigorCost = (config.vigorCostPerOperation ?? 1) * current.request.operations;
    const expectedXp = current.failed ? 0 : (config.xpByRank?.[current.rank] ?? 10) * current.request.operations;

    const operationId = randomUUID();
    const reservation = await professionPort.authorizeActivity(ctx, {
      operationId,
      professionId: 'alchemist',
      sourceSystem: 'alchemy-system',
      requiredRank: current.rank,
      vigorCost,
      expectedXp
    });
    if (!reservation || reservation.allowed !== true) {
      fail(reservation?.reason || 'PROFESSION_DENIED', 'Autorização profissional recusada pelo servidor.');
    }

    let commitResult;
    try {
      commitResult = await inventoryPort.commitAlchemy(ctx, {
        operationId,
        costs: Object.fromEntries(current.costs.entries()),
        bottleCost: current.bottleCost,
        bottleType: current.bottleType,
        dregsOutputCount: current.dregsOutputCount || 0,
        product: {
          failed: Boolean(current.failed),
          name: current.productName,
          poison: current.poison,
          outputCount: current.outputCount,
          effects: current.effects.filter(e => !e.removed).map(e => ({
            effectKey: e.effectKey,
            effectId: e.effectId,
            name: e.name,
            magnitude: e.magnitude,
            duration: e.duration,
            area: e.area
          }))
        }
      });
      await professionPort.settleActivity(ctx, {
        operationId,
        terminal: 'committed',
        resultRef: commitResult?.resultRef || `alchemy:${operationId}`
      });
    } catch (err) {
      await professionPort.settleActivity(ctx, {
        operationId,
        terminal: 'cancelled',
        resultRef: null
      }).catch(() => {});
      throw err;
    }

    const nextCareer = await professionPort.getCareer(ctx);
    const nextRank = nextCareer.professionId === 'alchemist' ? normalizeRankId(nextCareer.rank) : 'none';
    await syncGrants(ctx, nextRank);
    const nextInv = await inventoryPort.getAlchemyInventory(ctx);

    const discoveredEffects = !current.failed && Array.isArray(commitResult?.discoveredEffects)
      ? commitResult.discoveredEffects
      : [];
    const discoveredSummary = discoveredEffects
      .map(d => `${d.ingredientName} (${d.effectName})`)
      .filter(Boolean)
      .join(', ');

    let craftMessage = current.failed
      ? (current.dregsOutputCount > 0
        ? `A mistura falhou: você recuperou ${current.dregsOutputCount}× Borra Alquímica nos frascos.`
        : 'A mistura falhou: os ingredientes não reagiram e foram consumidos.')
      : `Produção concluída: ${current.outputCount}× ${current.productName}.`;
    if (!current.failed && discoveredSummary) {
      craftMessage += ` Novo efeito descoberto: ${discoveredSummary}!`;
    }

    return {
      ok: true,
      revision: Number(nextCareer.revision ?? Number(career.revision || 0) + 1),
      rank: nextRank,
      characterName: ctx.characterName || '',
      portable: Boolean(nextInv.portableSession),
      hasPortableKit: Boolean(nextInv.hasPortableKit),
      vigor: nextCareer.vigor || null,
      bottles: Number(nextInv.bottles || 0),
      crystallizedBottles: Number(nextInv.crystallizedBottles || 0),
      dregsCount: Number(nextInv.dregsCount || 0),
      auxiliaryRecipes: buildAuxView(nextInv, nextRank),
      ingredients: buildIngredientView(nextInv.catalogByDefId, nextInv.inventoryByDefId),
      crafted: {
        operationId,
        failed: Boolean(current.failed),
        dregsOutputCount: current.dregsOutputCount || 0,
        productName: current.productName,
        outputCount: current.outputCount,
        poison: current.poison,
        discoveredEffects
      },
      message: craftMessage
    };
  }

  async function craftAuxiliary(ctx, payload) {
    if (standby || !professionPort || !inventoryPort) return standbyResponse();
    if (typeof inventoryPort.commitAuxiliary !== 'function') {
      fail('AUX_UNAVAILABLE', 'Preparos auxiliares não disponíveis neste servidor.');
    }
    const career = await professionPort.getCareer(ctx);
    const rank = career.professionId === 'alchemist' ? normalizeRankId(career.rank) : 'none';
    const inv = await inventoryPort.getAlchemyInventory(ctx);
    if (inv.portableSession) {
      fail('PORTABLE_NO_AUX', 'O Kit Portátil permite apenas produzir poções simples.');
    }
    const recipeId = String(payload?.recipeId || '').trim();
    const recipe = getAuxRecipeList().find(r => r.id === recipeId);
    if (!recipe) fail('AUX_RECIPE_NOT_FOUND', 'Receita auxiliar desconhecida.');
    const minIdx = rankIndex(recipe.minRank || 'novice');
    if (rankIndex(rank) < minIdx) {
      fail('RANK_TOO_LOW', 'Sua patente não permite esse preparo.');
    }
    const operations = Math.floor(Number(payload?.operations ?? 1));
    const auxCounts = inv.auxCountsByKey instanceof Map ? inv.auxCountsByKey : new Map();
    let maxOps = config.maxOperations ?? 100;
    const costs = {};
    for (const inp of recipe.inputs) {
      const key = normalizeFormKey(inp.key);
      const req = Number(inp.count || 1);
      const avail = Number(auxCounts.get(key) ?? inv.inventoryByDefId?.get(key) ?? 0);
      maxOps = Math.min(maxOps, Math.floor(Math.max(0, avail) / Math.max(1, req)));
      costs[key] = req * operations;
    }
    if (!Number.isSafeInteger(operations) || operations < 1 || operations > maxOps) {
      fail('INSUFFICIENT_MATERIALS', 'Materiais insuficientes para esse preparo auxiliar.');
    }

    const operationId = randomUUID();
    const reservation = await professionPort.authorizeActivity(ctx, {
      operationId,
      professionId: 'alchemist',
      sourceSystem: 'alchemy-aux',
      requiredRank: rank,
      vigorCost: 0,
      expectedXp: 0
    });
    if (!reservation || reservation.allowed !== true) {
      fail(reservation?.reason || 'PROFESSION_DENIED', 'Autorização profissional recusada.');
    }

    try {
      await inventoryPort.commitAuxiliary(ctx, {
        operationId,
        recipeId: recipe.id,
        costs,
        outputKey: normalizeFormKey(recipe.output),
        outputCount: Number(recipe.outputCount || 1) * operations,
        outputName: recipe.outputName || recipe.name
      });
      await professionPort.settleActivity(ctx, {
        operationId,
        terminal: 'committed',
        resultRef: `alchemy-aux:${operationId}`
      });
    } catch (err) {
      await professionPort.settleActivity(ctx, {
        operationId,
        terminal: 'cancelled',
        resultRef: null
      }).catch(() => {});
      throw err;
    }

    const nextCareer = await professionPort.getCareer(ctx);
    const nextRank = nextCareer.professionId === 'alchemist' ? normalizeRankId(nextCareer.rank) : 'none';
    const nextInv = await inventoryPort.getAlchemyInventory(ctx);
    const totalOut = Number(recipe.outputCount || 1) * operations;

    return {
      ok: true,
      revision: Number(nextCareer.revision ?? Number(career.revision || 0) + 1),
      rank: nextRank,
      characterName: ctx.characterName || '',
      portable: Boolean(nextInv.portableSession),
      hasPortableKit: Boolean(nextInv.hasPortableKit),
      vigor: nextCareer.vigor || null,
      bottles: Number(nextInv.bottles || 0),
      crystallizedBottles: Number(nextInv.crystallizedBottles || 0),
      dregsCount: Number(nextInv.dregsCount || 0),
      auxiliaryRecipes: buildAuxView(nextInv, nextRank),
      ingredients: buildIngredientView(nextInv.catalogByDefId, nextInv.inventoryByDefId),
      message: `${totalOut}× ${recipe.outputName || recipe.name} preparado.`
    };
  }

  function cancel(ctx, payload) {
    const token = payload && typeof payload.token === 'string' ? payload.token : '';
    if (token) {
      const saved = preparations.get(token);
      if (saved && saved.sessionId === ctx.sessionId) preparations.delete(token);
    }
    return { ok: true, message: 'Preparação cancelada; nenhum item consumido.' };
  }

  return Object.freeze({
    getSnapshot,
    prepare,
    craft,
    craftAuxiliary,
    cancel
  });
}

module.exports = { createAlchemyService };
