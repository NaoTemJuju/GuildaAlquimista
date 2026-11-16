'use strict';

const RANK_ORDER = Object.freeze(['none', 'novice', 'apprentice', 'adept', 'specialist', 'master']);

function fail(code, message) {
  const err = new Error(message || code);
  err.code = code;
  throw err;
}

function rankIndex(rank) {
  const normalized = String(rank || 'none').toLowerCase();
  const alias = normalized === 'expert' ? 'specialist' : normalized;
  const idx = RANK_ORDER.indexOf(alias);
  if (idx < 0) fail('INVALID_RANK', 'Patente inválida.');
  return idx;
}

function normalizeRankId(rank) {
  const normalized = String(rank || 'none').toLowerCase();
  return normalized === 'expert' ? 'specialist' : normalized;
}

function normalizeFormKey(key) {
  if (typeof key !== 'string') fail('INVALID_FORM_KEY', 'Chave de formulário inválida.');
  const pipeMatch = /^([^|:/\\\x00-\x1f]{1,128})\|([0-9a-f]{1,8})$/i.exec(key.trim());
  if (pipeMatch) {
    const hex = pipeMatch[2].padStart(6, '0').slice(-6).toUpperCase();
    return `${pipeMatch[1]}|${hex}`;
  }
  const colonMatch = /^([0-9a-f]{1,8}):([^|:/\\\x00-\x1f]{1,128})$/i.exec(key.trim());
  if (colonMatch) {
    const hex = colonMatch[1].padStart(6, '0').slice(-6).toUpperCase();
    return `${colonMatch[2]}|${hex}`;
  }
  fail('INVALID_FORM_KEY', `Chave de formulário inválida: ${key}`);
}

function batchSeconds(operations, rank, timingConfig = null) {
  if (!Number.isSafeInteger(operations) || operations < 1 || operations > 100) {
    fail('INVALID_OPERATIONS', 'Quantidade de produção inválida.');
  }
  const idx = rankIndex(rank);
  if (idx < 1 || idx > 5) fail('INVALID_RANK', 'Patente inválida.');

  const key = RANK_ORDER[idx];
  const base = timingConfig?.batchBaseSeconds ?? 10.0;
  const stepMap = timingConfig?.batchStepByRank ?? {
    novice: 0.25, apprentice: 0.35, adept: 0.50, specialist: 0.85, master: 1.0
  };
  const floorMap = timingConfig?.batchFloorByRank ?? {
    novice: 8.0, apprentice: 7.5, adept: 7.0, specialist: 5.0, master: 3.0
  };
  const step = Number(stepMap[key]);
  const floor = Number(floorMap[key]);

  let total = 0;
  for (let i = 0; i < operations; i += 1) {
    total += Math.max(floor, base - step * i);
  }
  return total;
}

function computeCosts(ingredientIds, operations, reagentId, maximum) {
  if (!Array.isArray(ingredientIds) || ingredientIds.length < 2 || ingredientIds.length > 3 ||
      !Number.isSafeInteger(operations) || operations < 1 || operations > maximum) {
    fail('INVALID_COSTS', 'Selecione 2 ou 3 ingredientes e uma quantidade válida.');
  }
  const result = new Map();
  for (const id of ingredientIds) {
    if (typeof id !== 'string' || !id || result.has(id)) {
      fail('DUPLICATE_INGREDIENT', 'Ingredientes repetidos ou inválidos.');
    }
    result.set(id, operations);
  }
  if (reagentId) {
    if (!result.has(reagentId) || operations > Math.floor(Number.MAX_SAFE_INTEGER / 2)) {
      fail('INVALID_REAGENT', 'Reagente de concentração inválido.');
    }
    result.set(reagentId, result.get(reagentId) + operations);
  }
  return result;
}

function computeMaximum(inventoryMap, unitCostsMap, cap) {
  let maxOps = cap;
  for (const [id, count] of unitCostsMap.entries()) {
    if (!Number.isSafeInteger(count) || count <= 0) fail('INVALID_COST', 'Custo inválido.');
    const available = inventoryMap.get(id);
    if (available === undefined) return 0;
    maxOps = Math.min(maxOps, Math.floor(Math.max(0, available) / count));
  }
  return maxOps;
}

const Axis = Object.freeze({ None: 'none', Magnitude: 'magnitude', Duration: 'duration' });

function scalingAxis(powerMagnitude, powerDuration, noMagnitude, noDuration) {
  const m = Boolean(powerMagnitude) && !noMagnitude;
  const d = Boolean(powerDuration) && !noDuration;
  if (m === d) return Axis.None;
  return m ? Axis.Magnitude : Axis.Duration;
}

function scaleValue(value, factor, isDuration) {
  if (!Number.isFinite(value) || value < 0 || !Number.isFinite(factor) || factor <= 0 || factor > 1.15) {
    fail('POWER_OUT_OF_RANGE', 'Potência fora dos limites permitidos.');
  }
  let result = value * factor;
  if (result > 1_000_000) fail('POWER_LIMIT_EXCEEDED', 'Potência excede o limite de segurança.');
  if (isDuration) {
    result = Math.floor(result);
    if (value > 0 && result < 1) {
      fail('DURATION_TOO_SHORT', 'Duração curta demais para refinar com segurança.');
    }
    return result;
  }
  return Math.round(result * 10000) / 10000;
}

module.exports = {
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
};
