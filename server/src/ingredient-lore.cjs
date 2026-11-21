'use strict';

const { normalizeFormKey } = require('./rules.cjs');
const { SKYRIM_INGREDIENT_LORE } = require('./ingredient-lore-skyrim.cjs');
const { DLC_CC_INGREDIENT_LORE } = require('./ingredient-lore-dlc-cc.cjs');

/**
 * Catalogo completo com 4 descricoes alquimicas coerentes para cada um dos 181 ingredientes.
 */
const INGREDIENT_LORE_BY_KEY = {
  ...SKYRIM_INGREDIENT_LORE,
  ...DLC_CC_INGREDIENT_LORE,
};

const INGREDIENT_LORE_BY_LOWER_KEY = new Map(
  Object.entries(INGREDIENT_LORE_BY_KEY).map(([k, v]) => [k.toLowerCase(), v])
);

function getIngredientEffectLore(stableFormKey, slotIndex) {
  if (!stableFormKey || typeof stableFormKey !== 'string') {
    return 'Propriedade isolada em bancada; estudo descritivo completo aguardando revisão nos arquivos da Guilda.';
  }
  let key = '';
  try {
    key = normalizeFormKey(stableFormKey);
  } catch {
    return 'Propriedade isolada em bancada; estudo descritivo completo aguardando revisão nos arquivos da Guilda.';
  }
  const entries = INGREDIENT_LORE_BY_KEY[key] || INGREDIENT_LORE_BY_LOWER_KEY.get(key.toLowerCase());
  if (Array.isArray(entries) && typeof entries[slotIndex] === 'string' && entries[slotIndex].trim()) {
    return entries[slotIndex].trim();
  }
  return 'Propriedade isolada em bancada; estudo descritivo completo aguardando revisão nos arquivos da Guilda.';
}

module.exports = {
  INGREDIENT_LORE_BY_KEY,
  getIngredientEffectLore,
};
