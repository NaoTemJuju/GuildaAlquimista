'use strict';

const { normalizeFormKey, normalizeRankId } = require('./rules.cjs');
const { getIngredientEffectLore } = require('./ingredient-lore.cjs');

const RANK_MAX_TIER = {
  none: 1,
  novice: 1,
  apprentice: 2,
  adept: 3,
  specialist: 4,
  expert: 4,
  master: 5,
};

const BASIC_ODDS_BY_RANK = {
  none: { same: 0.75, next: 0.10, fail: 0.15 },
  novice: { same: 0.75, next: 0.10, fail: 0.15 },
  apprentice: { same: 0.78, next: 0.10, fail: 0.12 },
  adept: { same: 0.81, next: 0.11, fail: 0.08 },
  specialist: { same: 0.84, next: 0.12, fail: 0.04 },
  expert: { same: 0.84, next: 0.12, fail: 0.04 },
  master: { same: 0.98, next: 0.00, fail: 0.02 },
};

const ADVANCED_NEXT_ODDS_BY_RANK = {
  none: 0.75,
  novice: 0.75,
  apprentice: 0.80,
  adept: 0.85,
  specialist: 0.90,
  expert: 0.90,
  master: 1.00,
};

const TIER_LABELS = {
  1: 'Tier 1 (Novato)',
  2: 'Tier 2 (Aprendiz)',
  3: 'Tier 3 (Adepto)',
  4: 'Tier 4 (Especialista)',
  5: 'Tier 5 (Mestre)',
};

/**
 * Constroi um mapa normalizado de effectKey -> tier (1..5) a partir do rankEffectLimits.
 * Efeitos nao listados em novice..specialist pertencem ao Tier 5 (master: { all: true }).
 */
function buildEffectTierMap(config) {
  const map = new Map();
  const limits = config?.forms?.rankEffectLimits || {};
  const tierList = [
    ['novice', 1],
    ['apprentice', 2],
    ['adept', 3],
    ['specialist', 4],
  ];
  for (const [rankKey, tier] of tierList) {
    const keys = limits?.[rankKey]?.effects || [];
    for (const rawKey of keys) {
      map.set(normalizeFormKey(rawKey), tier);
    }
  }
  return map;
}

function getEffectTier(effectKey, effectTierMap) {
  if (!effectKey) return 5;
  return effectTierMap.get(normalizeFormKey(effectKey)) ?? 5;
}

function pickRandom(list, randomFn) {
  if (!list.length) return null;
  const idx = Math.min(list.length - 1, Math.floor(Math.max(0, randomFn()) * list.length));
  return list[idx];
}

/**
 * Resolve o resultado de 1 pesquisa alquimica (sem ordem fixa de Tier, limitado a rankTier + 1).
 * Efeitos >= rankTier + 2 nunca sao revelados e resultam em falha de compreensao caso nao haja
 * efeitos compreensiveis ocultos no ingrediente.
 */
function resolveResearchOutcome({ rank, mode, effects, effectTierMap, random = Math.random }) {
  const normalizedRank = normalizeRankId(rank);
  const maxTier = RANK_MAX_TIER[normalizedRank] ?? 1;
  const unknown = (effects || []).filter((e) => e && !e.known);

  if (unknown.length === 0) {
    return { ok: false, code: 'ALL_EFFECTS_KNOWN', message: 'Todos os efeitos deste ingrediente já são conhecidos.' };
  }

  const sameOrLower = [];
  const oneAbove = [];
  for (const eff of unknown) {
    const tier = getEffectTier(eff.effectKey, effectTierMap);
    if (tier <= maxTier) sameOrLower.push({ ...eff, tier });
    else if (tier === maxTier + 1) oneAbove.push({ ...eff, tier });
  }

  if (sameOrLower.length === 0 && oneAbove.length === 0) {
    return {
      ok: true,
      outcome: 'incomprehensible',
      revealedEffect: null,
      bonusTier: false,
      message: 'A reação falhou: você ainda não consegue compreender os compostos deste material.',
    };
  }

  if (mode === 'advanced') {
    if (sameOrLower.length > 0) {
      // 100% de descoberta quando ha efeito do proprio Tier; se tambem houver T+1,
      // permite esbarrar aleatoriamente no T+1 sem seguir escadinha fixa.
      const pickAbove = oneAbove.length > 0 && random() < 0.35;
      const chosen = pickRandom(pickAbove ? oneAbove : sameOrLower, random);
      return {
        ok: true,
        outcome: 'revealed',
        revealedEffect: chosen,
        bonusTier: chosen.tier > maxTier,
        message: chosen.tier > maxTier
          ? `Descoberta avançada! Você identificou "${chosen.name}" (${TIER_LABELS[chosen.tier] || `Tier ${chosen.tier}`}).`
          : `Pesquisa avançada concluída: "${chosen.name}" identificado.`,
      };
    }

    const nextChance = ADVANCED_NEXT_ODDS_BY_RANK[normalizedRank] ?? 0.75;
    if (random() < nextChance) {
      const chosen = pickRandom(oneAbove, random);
      return {
        ok: true,
        outcome: 'revealed',
        revealedEffect: chosen,
        bonusTier: true,
        message: `Descoberta avançada! Você identificou "${chosen.name}" (${TIER_LABELS[chosen.tier] || `Tier ${chosen.tier}`}).`,
      };
    }
    return {
      ok: true,
      outcome: 'fail',
      revealedEffect: null,
      bonusTier: false,
      message: 'A amostra avançada desestabilizou antes de revelar um efeito de grau superior.',
    };
  }

  // Modo basico
  const odds = BASIC_ODDS_BY_RANK[normalizedRank] || BASIC_ODDS_BY_RANK.novice;
  if (sameOrLower.length > 0) {
    const roll = random();
    if (roll < odds.fail) {
      return {
        ok: true,
        outcome: 'fail',
        revealedEffect: null,
        bonusTier: false,
        message: 'A mistura turvou no aparato básico e o material foi perdido.',
      };
    }
    if (roll < odds.fail + odds.next && oneAbove.length > 0) {
      const chosen = pickRandom(oneAbove, random);
      return {
        ok: true,
        outcome: 'revealed',
        revealedEffect: chosen,
        bonusTier: true,
        message: `Sorte de laboratório! Você esbarrou em "${chosen.name}" (${TIER_LABELS[chosen.tier] || `Tier ${chosen.tier}`}).`,
      };
    }
    const chosen = pickRandom(sameOrLower, random);
    return {
      ok: true,
      outcome: 'revealed',
      revealedEffect: chosen,
      bonusTier: false,
      message: `Análise concluída: "${chosen.name}" identificado.`,
    };
  }

  // Apenas T+1 disponivel no aparato basico
  if (random() < odds.next) {
    const chosen = pickRandom(oneAbove, random);
    return {
      ok: true,
      outcome: 'revealed',
      revealedEffect: chosen,
      bonusTier: true,
      message: `Sorte rara! Mesmo no aparato básico você identificou "${chosen.name}" (${TIER_LABELS[chosen.tier] || `Tier ${chosen.tier}`}).`,
    };
  }
  return {
    ok: true,
    outcome: 'incomprehensible',
    revealedEffect: null,
    bonusTier: false,
    message: 'A amostra foi inconclusiva: o composto restante exige técnica ou aparato mais avançado.',
  };
}

const ROMAN_SLOTS = ['I', 'II', 'III', 'IV'];
const COMPENDIUM_TOC_PER_PAGE = 12;

function escapeBookText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildEffectBlocksHtml(ingredientKey, effects, effectTierMap, { includeUnknownSlots }) {
  const slots = Array.isArray(effects) ? effects : [];
  const blocks = [];
  let unknownCount = 0;

  for (let i = 0; i < Math.max(4, slots.length); i++) {
    const eff = slots[i];
    const roman = ROMAN_SLOTS[i] || String(i + 1);
    if (eff && eff.known) {
      const tier = getEffectTier(eff.effectKey, effectTierMap);
      const tierLabel = TIER_LABELS[tier] || `Tier ${tier}`;
      const lore = getIngredientEffectLore(ingredientKey, i);
      blocks.push(
        `<p align="left"><b>${roman}. ${escapeBookText(eff.name)} - ${escapeBookText(tierLabel)}</b><br/>${escapeBookText(lore)}</p>`
      );
    } else {
      unknownCount++;
      if (includeUnknownSlots) {
        blocks.push(`<p align="left"><i>${roman}. Virtude ainda não isolada em pesquisa.</i></p>`);
      }
    }
  }

  if (!includeUnknownSlots && unknownCount > 0) {
    blocks.push(
      `<p align="left"><i>Restam ${unknownCount} ${unknownCount === 1 ? 'virtude por isolar' : 'virtudes por isolar'} em pesquisa.</i></p>`
    );
  }
  return blocks;
}

/**
 * Formata o texto de leitura RP do Manuscrito de Alquimia no padrao editorial da Guilda.
 */
function formatManuscriptText({ ingredientName, ingredientKey, authorName, effects, effectTierMap }) {
  const slots = Array.isArray(effects) ? effects : [];
  const knownCount = slots.filter((e) => e && e.known).length;
  const totalSlots = Math.max(4, slots.length);
  const safeName = escapeBookText(ingredientName || 'Ingrediente desconhecido');
  const safeAuthor = escapeBookText(authorName || 'Anônimo da Guilda');

  const pages = [];
  pages.push([
    '<p align="center"><font size="22">ESTUDO DE MATÉRIA</font></p>',
    `<p align="center"><font size="20"><b>${safeName}</b></font></p>`,
    `<p align="center">Pesquisador: <b>${safeAuthor}</b></p>`,
    `<p align="center">Virtudes isoladas: ${knownCount} de ${totalSlots}</p>`,
    '<p align="center"><i>Caderno de bancada da Guilda dos Alquimistas. Cada propriedade aqui registrada reflete apenas o que já foi comprovado no almofariz.</i></p>',
  ].join('\n'));

  const blocks = buildEffectBlocksHtml(ingredientKey, slots, effectTierMap, { includeUnknownSlots: true });
  pages.push([
    '<p align="center"><font size="20">NOTAS DE BANCADA</font></p>',
    ...blocks,
  ].join('\n'));

  return pages.join('\n[pagebreak]\n');
}

/**
 * Formata o Compendio Alquimico com Capa, Sumario com pagina exata e 1 pagina por ingrediente.
 */
function formatCompendiumText({ authorName, discoveredIngredients, effectTierMap }) {
  const list = Array.isArray(discoveredIngredients) ? discoveredIngredients : [];
  const safeAuthor = escapeBookText(authorName || 'Anônimo da Guilda');
  const tocPages = Math.max(1, Math.ceil(list.length / COMPENDIUM_TOC_PER_PAGE));
  const firstIngredientPage = 1 + tocPages + 1;

  const pages = [];
  pages.push([
    '<p align="center"><font size="22">COMPÊNDIO DE PESQUISA ALQUÍMICA</font></p>',
    `<p align="center">Compilado por <b>${safeAuthor}</b></p>`,
    `<p align="center">Matérias catalogadas: ${list.length}</p>`,
    '<p align="center"><i>"A natureza não oculta os seus segredos; exige apenas que sejamos pacientes o bastante para isolá-los no almofariz."</i></p>',
  ].join('\n'));

  for (let p = 0; p < tocPages; p++) {
    const start = p * COMPENDIUM_TOC_PER_PAGE;
    const slice = list.slice(start, start + COMPENDIUM_TOC_PER_PAGE);
    const heading = tocPages > 1 ? `SUMÁRIO (${p + 1}/${tocPages})` : 'SUMÁRIO';
    const tocLines = slice.map((ing, idx) => {
      const globalIdx = start + idx;
      const pageNum = firstIngredientPage + globalIdx;
      const slots = Array.isArray(ing?.effects) ? ing.effects : [];
      const knownCount = slots.filter((e) => e && e.known).length;
      const total = Math.max(4, slots.length);
      return `<b>${escapeBookText(ing?.name || 'Ingrediente')}</b> (${knownCount}/${total}) - pág. ${pageNum}`;
    });
    pages.push([
      `<p align="center"><font size="20">${heading}</font></p>`,
      `<p align="left">${tocLines.join('<br/>')}</p>`,
    ].join('\n'));
  }

  for (const ing of list) {
    const ingKey = ing?.stableFormKey || '';
    const blocks = buildEffectBlocksHtml(ingKey, ing?.effects, effectTierMap, { includeUnknownSlots: false });
    pages.push([
      `<p align="center"><font size="20"><b>${escapeBookText(ing?.name || 'Ingrediente')}</b></font></p>`,
      ...blocks,
    ].join('\n'));
  }

  return pages.join('\n[pagebreak]\n');
}

module.exports = {
  RANK_MAX_TIER,
  BASIC_ODDS_BY_RANK,
  ADVANCED_NEXT_ODDS_BY_RANK,
  buildEffectTierMap,
  getEffectTier,
  resolveResearchOutcome,
  formatManuscriptText,
  formatCompendiumText,
};
