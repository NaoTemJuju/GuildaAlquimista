'use strict';

const { fail, normalizeFormKey, normalizeRankId, rankIndex } = require('./rules.cjs');

/**
 * Compõe os grants de perks normais do Vokrii correspondentes ao rank de Alquimista
 * no formato oficial de projeção do AetheriusGameplayCore (`PerkDelivery` / `gc_perk_projections`).
 *
 * Não inclui perks ocultos e bloqueia explicitamente Purity (`Skyrim.esm|05821D`).
 */
function composeAlchemyProfessionGrants(rank, config) {
  const normRank = normalizeRankId(rank);
  const idx = rankIndex(normRank);
  if (idx <= 0) return Object.freeze([]);

  const forbidden = new Set((config.forms?.forbiddenPerks || ['Skyrim.esm|05821D']).map(normalizeFormKey));
  const grantsConfig = config.forms?.rankGrants || [];
  const result = [];

  for (let i = 0; i < idx && i < grantsConfig.length; i += 1) {
    const tier = grantsConfig[i];
    const rankName = normalizeRankId(tier.rank || ['novice', 'apprentice', 'adept', 'specialist', 'master'][i]);
    for (const rawKey of tier.perks || []) {
      const stableFormKey = normalizeFormKey(rawKey);
      if (forbidden.has(stableFormKey)) {
        fail('FORBIDDEN_PERK_GRANT', `Perk proibido pela política da Guilda: ${stableFormKey}`);
      }
      result.push(Object.freeze({
        kind: 'perk',
        definition: Object.freeze({ stableFormKey }),
        source: Object.freeze({ kind: 'PROFESSION', key: 'alchemist', tier: rankName })
      }));
    }
  }
  return Object.freeze(result);
}

module.exports = { composeAlchemyProfessionGrants };
