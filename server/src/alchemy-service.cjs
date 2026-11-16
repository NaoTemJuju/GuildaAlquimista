'use strict';

const { randomUUID } = require('node:crypto');
const { buildUiPreview, calculateRecipe } = require('./recipe-engine.cjs');
const { composeAlchemyProfessionGrants } = require('./perk-grants.cjs');
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
        effects: (item.effects || []).map(eff => ({
          effectId: eff.effectId,
          known: Boolean(eff.known),
          name: eff.known ? eff.name : null
        }))
      });
    }
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return list;
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
      vigor: career.vigor || null,
      bottles: Number(inv.bottles || 0),
      ingredients: buildIngredientView(inv.catalogByDefId, inv.inventoryByDefId),
      message: rankIndex(rank) >= 1
        ? 'Bancada pronta. Selecione dois ou três ingredientes.'
        : 'Requer profissão Alquimista no rank Novato ou superior.'
    };
  }

  async function prepare(ctx, payload) {
    if (standby || !professionPort || !inventoryPort) return standbyResponse();
    purgeExpired();
    const career = await professionPort.getCareer(ctx);
    const rank = career.professionId === 'alchemist' ? normalizeRankId(career.rank) : 'none';
    const inv = await inventoryPort.getAlchemyInventory(ctx);

    const grants = composeAlchemyProfessionGrants(rank, config);
    const activePerks = new Set(grants.map(g => g.definition.stableFormKey));
    for (const extra of inv.activePerks || []) activePerks.add(normalizeFormKey(extra));

    const recipe = calculateRecipe({
      request: payload,
      rank,
      alchemySkill: Number(inv.alchemySkill ?? 20),
      fortifyPercent: Number(inv.fortifyPercent ?? 0),
      bottles: Number(inv.bottles ?? 0),
      inventoryByDefId: inv.inventoryByDefId,
      ingredientCatalogByDefId: inv.catalogByDefId,
      activePerks,
      config
    });

    const token = randomUUID();
    preparations.set(token, {
      sessionId: ctx.sessionId,
      characterId: ctx.characterId,
      request: recipe.request,
      fingerprint: recipe.fingerprint,
      expiresAt: now() + tokenTtlMs
    });

    return {
      ok: true,
      revision: Number(career.revision || 0),
      rank,
      vigor: career.vigor || null,
      bottles: Number(inv.bottles || 0),
      ingredients: buildIngredientView(inv.catalogByDefId, inv.inventoryByDefId),
      preview: buildUiPreview(recipe, token, inv.inventoryByDefId, inv.catalogByDefId, Number(inv.bottles || 0)),
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
    const grants = composeAlchemyProfessionGrants(rank, config);
    const activePerks = new Set(grants.map(g => g.definition.stableFormKey));
    for (const extra of inv.activePerks || []) activePerks.add(normalizeFormKey(extra));

    const current = calculateRecipe({
      request: saved.request,
      rank,
      alchemySkill: Number(inv.alchemySkill ?? 20),
      fortifyPercent: Number(inv.fortifyPercent ?? 0),
      bottles: Number(inv.bottles ?? 0),
      inventoryByDefId: inv.inventoryByDefId,
      ingredientCatalogByDefId: inv.catalogByDefId,
      activePerks,
      config
    });

    if (current.fingerprint !== saved.fingerprint) {
      fail('RECIPE_STALE', 'A receita ou o estado do personagem mudou; prepare novamente.');
    }

    const vigorCost = (config.vigorCostPerOperation ?? 1) * current.request.operations;
    const expectedXp = (config.xpByRank?.[current.rank] ?? 10) * current.request.operations;

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
        product: {
          name: current.productName,
          poison: current.poison,
          outputCount: current.outputCount,
          effects: current.effects.filter(e => !e.removed).map(e => ({
            effectKey: e.effectKey,
            effectId: e.effectId,
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

    return {
      ok: true,
      revision: Number(nextCareer.revision ?? Number(career.revision || 0) + 1),
      rank: nextRank,
      vigor: nextCareer.vigor || null,
      bottles: Number(nextInv.bottles || 0),
      ingredients: buildIngredientView(nextInv.catalogByDefId, nextInv.inventoryByDefId),
      crafted: {
        operationId,
        productName: current.productName,
        outputCount: current.outputCount,
        poison: current.poison
      },
      message: `Produção concluída: ${current.outputCount}× ${current.productName}.`
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
    cancel
  });
}

module.exports = { createAlchemyService };
