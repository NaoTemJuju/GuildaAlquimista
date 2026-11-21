'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Axis,
  batchSeconds,
  buildEffectTierMap,
  calculateRecipe,
  composeAlchemyProfessionGrants,
  computeCosts,
  computeMaximum,
  createAlchemyService,
  formatCompendiumText,
  formatManuscriptText,
  loadDefaultAlchemyConfig,
  registerAlchemyUiHandlers,
  resolveResearchOutcome,
  scaleValue,
  scalingAxis,
  validateUiEnvelope
} = require('../src/index.cjs');

const config = loadDefaultAlchemyConfig();

function buildTestCatalog() {
  const restoreHealth = {
    effectId: 'eff:restore-health',
    effectKey: 'Skyrim.esm|03EB15',
    name: 'Restaurar Vida',
    baseCost: 5,
    magnitude: 15,
    duration: 0,
    area: 0,
    hostile: false,
    known: true,
    keywords: ['Skyrim.esm|042503', 'Skyrim.esm|0F8A4E'],
    powerAffectsMagnitude: true,
    powerAffectsDuration: false,
    noMagnitude: false,
    noDuration: true
  };
  const ravageHealth = {
    effectId: 'eff:damage-health',
    effectKey: 'Skyrim.esm|03EB42',
    name: 'Dano à Vida',
    baseCost: 1,
    magnitude: 10,
    duration: 0,
    area: 0,
    hostile: true,
    known: true,
    keywords: ['Skyrim.esm|042509'],
    powerAffectsMagnitude: true,
    powerAffectsDuration: false,
    noMagnitude: false,
    noDuration: true
  };
  const fortifyCarry = {
    effectId: 'eff:fortify-carry',
    effectKey: 'Skyrim.esm|03EB24',
    name: 'Fortificar Carga',
    baseCost: 1.5,
    magnitude: 15,
    duration: 300,
    area: 0,
    hostile: false,
    known: true,
    keywords: ['Skyrim.esm|0F8A4E'],
    powerAffectsMagnitude: true,
    powerAffectsDuration: false,
    noMagnitude: false,
    noDuration: false
  };

  const catalog = new Map([
    ['ing:wheat', {
      definitionId: 'ing:wheat',
      stableFormKey: 'Skyrim.esm|04B0BA',
      name: 'Trigo',
      effects: [restoreHealth]
    }],
    ['ing:blisterwort', {
      definitionId: 'ing:blisterwort',
      stableFormKey: 'Skyrim.esm|04DA25',
      name: 'Blisterwort',
      effects: [restoreHealth, ravageHealth]
    }],
    ['ing:imp-stool', {
      definitionId: 'ing:imp-stool',
      stableFormKey: 'Skyrim.esm|04DA23',
      name: 'Cogumelo de Diabrete',
      effects: [ravageHealth, fortifyCarry]
    }],
    ['ing:giant-toe', {
      definitionId: 'ing:giant-toe',
      stableFormKey: 'Skyrim.esm|03AD64',
      name: 'Dedo de Gigante',
      effects: [fortifyCarry]
    }]
  ]);
  return catalog;
}

test('deterministic rules match C++ RulesTests', () => {
  const plain = computeCosts(['a', 'b'], 3, null, 10);
  assert.equal(plain.get('a'), 3);
  assert.equal(plain.get('b'), 3);

  const concentrated = computeCosts(['a', 'b'], 3, 'b', 10);
  assert.equal(concentrated.get('a'), 3);
  assert.equal(concentrated.get('b'), 6);

  assert.equal(computeMaximum(new Map([['a', 9], ['b', 7]]), computeCosts(['a', 'b'], 1, 'b', 1), 100), 3);
  assert.equal(scalingAxis(true, false, false, false), Axis.Magnitude);
  assert.equal(scalingAxis(false, true, false, false), Axis.Duration);
  assert.equal(scalingAxis(true, true, false, false), Axis.None);
  assert.equal(scaleValue(100, 1.15, false), 115);
  assert.equal(scaleValue(11, 0.9, true), 9);

  assert.equal(batchSeconds(1, 'novice', config.timing), 10.0);
  assert.equal(batchSeconds(1, 'apprentice', config.timing), 8.5);
  assert.equal(batchSeconds(1, 'adept', config.timing), 7.0);
  assert.equal(batchSeconds(1, 'specialist', config.timing), 5.5);
  assert.equal(batchSeconds(1, 'master', config.timing), 4.0);
  assert.equal(batchSeconds(2, 'novice', config.timing), 19.75);
  assert.equal(batchSeconds(3, 'adept', config.timing), 19.5);
  assert.equal(batchSeconds(20, 'novice', config.timing), 169.0);
  assert.equal(batchSeconds(20, 'master', config.timing), 52.0);

  assert.throws(() => computeCosts(['a', 'a'], 1, null, 10), /repetidos/);
  assert.throws(() => scaleValue(1, 1.16, false), /limites/);
});

test('rankEffectLimits blocks higher-tier effects and allows unlocked tiers', () => {
  const catalog = buildTestCatalog();
  const inv = new Map([
    ['ing:wheat', 10],
    ['ing:blisterwort', 10],
    ['ing:imp-stool', 10],
    ['ing:giant-toe', 10]
  ]);

  // Novice permite Restaurar Vida (Wheat + Blisterwort só compartilham Restaurar Vida)
  const noviceOk = calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 1 },
    rank: 'novice',
    alchemySkill: 20,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  });
  assert.equal(noviceOk.poison, false);
  assert.equal(noviceOk.productName, 'Poção de Restauração de Saúde');

  // Novice NÃO pode fazer Dano à Vida (adept)
  assert.throws(() => calculateRecipe({
    request: { ingredients: ['ing:blisterwort', 'ing:imp-stool'], operations: 1 },
    rank: 'novice',
    alchemySkill: 20,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  }), (err) => err.code === 'RANK_EFFECT_LOCKED');

  // Specialist pode purificar/concentrar quando há 1 efeito desejado + 1 indesejado
  const specialistPurify = calculateRecipe({
    request: {
      ingredients: ['ing:wheat', 'ing:blisterwort', 'ing:imp-stool'],
      operations: 2,
      removeEffect: 'eff:damage-health',
      concentrateEffect: 'eff:restore-health',
      reagent: 'ing:wheat'
    },
    rank: 'specialist',
    alchemySkill: 80,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  });
  assert.equal(specialistPurify.bottleCost, 2);
  assert.equal(specialistPurify.costs.get('ing:wheat'), 4);
  assert.match(specialistPurify.productName, /Purificada/);
  assert.match(specialistPurify.productName, /Concentrada/);
});

test('Double Toil doubles output without doubling bottles', () => {
  const catalog = buildTestCatalog();
  const inv = new Map([['ing:wheat', 5], ['ing:blisterwort', 5]]);
  const grants = composeAlchemyProfessionGrants('master', config);
  const activePerks = new Set(grants.map(g => g.definition.stableFormKey));

  const masterRecipe = calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 2 },
    rank: 'master',
    alchemySkill: 100,
    bottles: 2,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    activePerks,
    config
  });
  assert.equal(masterRecipe.doubleToil, true);
  assert.equal(masterRecipe.outputCount, 4);
  assert.equal(masterRecipe.bottleCost, 2);
});

test('composeAlchemyProfessionGrants emits only normal Vokrii perks and rejects Purity', () => {
  const masterGrants = composeAlchemyProfessionGrants('master', config);
  assert.equal(masterGrants.length, 7);
  for (const grant of masterGrants) {
    assert.equal(grant.kind, 'perk');
    assert.equal(grant.source.kind, 'PROFESSION');
    assert.equal(grant.source.key, 'alchemist');
    assert.notEqual(grant.definition.stableFormKey, 'Skyrim.esm|05821D');
    assert.ok(!grant.definition.stableFormKey.startsWith('GuildAlchemy.esp|'));
  }

  const badConfig = structuredClone(config);
  badConfig.forms.rankGrants[0].perks.push('Skyrim.esm|05821D');
  assert.throws(() => composeAlchemyProfessionGrants('novice', badConfig), (err) => err.code === 'FORBIDDEN_PERK_GRANT');
});

test('standby service returns ACTION_UNAVAILABLE and live service settles profession & inventory', async () => {
  const standbyService = createAlchemyService({ config, standby: true });
  const standbyRes = await standbyService.getSnapshot({ sessionId: 's1', characterId: 'c1' });
  assert.equal(standbyRes.ok, false);
  assert.equal(standbyRes.standby, true);
  assert.equal(standbyRes.code, 'ACTION_UNAVAILABLE');

  const catalog = buildTestCatalog();
  let bottles = 3;
  let wheat = 5;
  let blisterwort = 5;
  let settled = null;
  let projectedGrants = null;

  const professionPort = {
    async getCareer() {
      return { professionId: 'alchemist', rank: 'novice', revision: 4, vigor: { current: 10, max: 20, regenPerMinute: 1 } };
    },
    async authorizeActivity(_ctx, input) {
      return { allowed: true, operationId: input.operationId };
    },
    async settleActivity(_ctx, input) {
      settled = input;
    }
  };
  const inventoryPort = {
    async getAlchemyInventory() {
      return {
        bottles,
        alchemySkill: 20,
        inventoryByDefId: new Map([['ing:wheat', wheat], ['ing:blisterwort', blisterwort]]),
        catalogByDefId: catalog
      };
    },
    async commitAlchemy(_ctx, input) {
      wheat -= input.costs['ing:wheat'];
      blisterwort -= input.costs['ing:blisterwort'];
      bottles -= input.bottleCost;
      return { resultRef: 'ok-1' };
    }
  };
  const perkDeliveryPort = {
    async projectProfessionGrants(_ctx, grants) {
      projectedGrants = grants;
    }
  };

  const service = createAlchemyService({ config, professionPort, inventoryPort, perkDeliveryPort });
  const routerMap = new Map();
  const router = {
    register(mod, act, fn) { routerMap.set(`${mod}:${act}`, fn); },
    getHandler(mod, act) { return routerMap.get(`${mod}:${act}`); }
  };
  const adapter = registerAlchemyUiHandlers(router, service);
  const ctx = { userId: 1, actorId: 10, characterId: 'char-1', sessionId: 'sess-1', expectedSessionId: 'sess-1' };

  const snapResp = await adapter.dispatchEnvelope({
    protocolVersion: 1, kind: 'request', messageId: 'm1', correlationId: 'c1',
    sessionId: 'sess-1', moduleId: 'alchemy', action: 'snapshot', payload: {}
  }, ctx);
  assert.equal(snapResp.kind, 'response');
  assert.equal(snapResp.payload.ok, true);
  assert.equal(projectedGrants.length, 1);

  const prepResp = await adapter.dispatchEnvelope({
    protocolVersion: 1, kind: 'request', messageId: 'm2', correlationId: 'c2',
    sessionId: 'sess-1', moduleId: 'alchemy', action: 'prepare',
    payload: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 2 }
  }, ctx);
  assert.equal(prepResp.payload.ok, true);
  const token = prepResp.payload.preview.token;

  const craftResp = await adapter.dispatchEnvelope({
    protocolVersion: 1, kind: 'request', messageId: 'm3', correlationId: 'c3',
    sessionId: 'sess-1', moduleId: 'alchemy', action: 'craft',
    payload: { token }
  }, ctx);
  assert.equal(craftResp.payload.ok, true);
  assert.equal(wheat, 3);
  assert.equal(blisterwort, 3);
  assert.equal(bottles, 1);
  assert.equal(settled.terminal, 'committed');

  // Reuso do mesmo token deve falhar
  const replayResp = await adapter.dispatchEnvelope({
    protocolVersion: 1, kind: 'request', messageId: 'm4', correlationId: 'c4',
    sessionId: 'sess-1', moduleId: 'alchemy', action: 'craft',
    payload: { token }
  }, ctx);
  assert.equal(replayResp.payload.ok, false);
  assert.equal(replayResp.payload.code, 'INVALID_TOKEN');
});

test('validateUiEnvelope rejects forbidden keys and oversized payloads', () => {
  const poisoned = JSON.parse('{"protocolVersion":1,"kind":"request","sessionId":"s1","moduleId":"alchemy","payload":{"__proto__":{}}}');
  assert.throws(() => validateUiEnvelope(poisoned), (err) => err.code === 'INVALID_ENVELOPE');

  assert.throws(() => validateUiEnvelope({
    protocolVersion: 1,
    kind: 'request',
    sessionId: 's1',
    moduleId: 'alchemy',
    payload: { big: 'x'.repeat(17 * 1024) }
  }), (err) => err.code === 'PAYLOAD_TOO_LARGE');
});

test('unknown effects hide preview result and incompatible mixtures can be crafted as failed', async () => {
  const catalog = buildTestCatalog();
  // Desliga known em todos os efeitos
  const hiddenCatalog = new Map();
  for (const [k, ing] of catalog.entries()) {
    hiddenCatalog.set(k, {
      ...ing,
      effects: ing.effects.map(e => ({ ...e, known: false }))
    });
  }

  let bottles = 4;
  let wheat = 5;
  let blisterwort = 5;
  let giantToe = 5;
  let lastCommit = null;

  const service = createAlchemyService({
    config,
    professionPort: {
      async getCareer() {
        return { professionId: 'alchemist', rank: 'master', revision: 1, vigor: { current: 10, max: 10, regenPerMinute: 1 } };
      },
      async authorizeActivity(_ctx, input) {
        return { allowed: true, operationId: input.operationId };
      },
      async settleActivity() {}
    },
    inventoryPort: {
      async getAlchemyInventory() {
        return {
          bottles,
          alchemySkill: 100,
          inventoryByDefId: new Map([
            ['ing:wheat', wheat],
            ['ing:blisterwort', blisterwort],
            ['ing:giant-toe', giantToe]
          ]),
          catalogByDefId: hiddenCatalog
        };
      },
      async commitAlchemy(_ctx, input) {
        lastCommit = input;
        if (input.costs['ing:wheat']) wheat -= input.costs['ing:wheat'];
        if (input.costs['ing:blisterwort']) blisterwort -= input.costs['ing:blisterwort'];
        if (input.costs['ing:giant-toe']) giantToe -= input.costs['ing:giant-toe'];
        bottles -= input.bottleCost;
        return { resultRef: 'ok' };
      }
    }
  });

  const ctx = { userId: 1, actorId: 10, characterId: 'char-h', sessionId: 'sess-h' };

  // 1) Compatíveis mas desconhecidos: preview NÃO vaza o nome da poção
  const hiddenPrep = await service.prepare(ctx, { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 1 });
  assert.equal(hiddenPrep.ok, true);
  assert.equal(hiddenPrep.preview.productName, '????');
  assert.equal(hiddenPrep.preview.productType, 'desconhecido');
  assert.equal(hiddenPrep.preview.effects[0].name, '????');
  assert.equal(hiddenPrep.preview.effects[0].hostile, false);
  assert.equal(hiddenPrep.preview.canFinalize, true);

  // 2) Incompatíveis (ing:wheat + ing:giant-toe): preview igual a ???? e craft consome itens sem gerar poção
  const failPrep = await service.prepare(ctx, { ingredients: ['ing:wheat', 'ing:giant-toe'], operations: 1 });
  assert.equal(failPrep.ok, true);
  assert.equal(failPrep.preview.productName, '????');
  assert.equal(failPrep.preview.productType, 'desconhecido');
  assert.equal(failPrep.preview.effects[0].name, '????');
  assert.equal(failPrep.preview.canFinalize, true);

  const failCraft = await service.craft(ctx, { token: failPrep.preview.token });
  assert.equal(failCraft.ok, true);
  assert.equal(failCraft.crafted.failed, true);
  assert.equal(failCraft.crafted.outputCount, 0);
  assert.equal(lastCommit.product.outputCount, 0);
  assert.equal(wheat, 4);
  assert.equal(giantToe, 4);
  assert.equal(bottles, 3);
});

test('research engine enforces rank tiers, random T+1 discovery, failure and manuscript format', () => {
  const tierMap = buildEffectTierMap(config);
  const effects = [
    { effectKey: 'Skyrim.esm|03EB15', name: 'Restaurar Vida', known: false },     // T1 (novice)
    { effectKey: 'Skyrim.esm|03EB19', name: 'Fortalecer Mágica', known: false },  // T2 (apprentice)
    { effectKey: 'Skyrim.esm|073F30', name: 'Paralisia', known: false }           // T5 (master)
  ];

  // Basico Novato: roll < 0.15 => falha
  const basicFail = resolveResearchOutcome({ rank: 'novice', mode: 'basic', effects, effectTierMap: tierMap, random: () => 0.05 });
  assert.equal(basicFail.ok, true);
  assert.equal(basicFail.outcome, 'fail');
  assert.equal(basicFail.revealedEffect, null);

  // Basico Novato: 0.15 <= roll < 0.25 => esbarra em T2
  const basicBonus = resolveResearchOutcome({ rank: 'novice', mode: 'basic', effects, effectTierMap: tierMap, random: () => 0.20 });
  assert.equal(basicBonus.ok, true);
  assert.equal(basicBonus.outcome, 'revealed');
  assert.equal(basicBonus.revealedEffect.effectKey, 'Skyrim.esm|03EB19');
  assert.equal(basicBonus.bonusTier, true);

  // Basico Novato: roll >= 0.25 => revela T1
  const basicHit = resolveResearchOutcome({ rank: 'novice', mode: 'basic', effects, effectTierMap: tierMap, random: () => 0.50 });
  assert.equal(basicHit.ok, true);
  assert.equal(basicHit.outcome, 'revealed');
  assert.equal(basicHit.revealedEffect.effectKey, 'Skyrim.esm|03EB15');

  // Avancado Novato: mesmo tendo T1 disponivel, pode sortear T2 antes (random < 0.35)
  const advRandomBonus = resolveResearchOutcome({ rank: 'novice', mode: 'advanced', effects, effectTierMap: tierMap, random: () => 0.10 });
  assert.equal(advRandomBonus.ok, true);
  assert.equal(advRandomBonus.revealedEffect.effectKey, 'Skyrim.esm|03EB19');

  // Avancado Novato quando so sobrou T2 (T1 conhecido): 75% sucesso, 25% falha
  const onlyT2 = [
    { ...effects[0], known: true },
    effects[1],
    effects[2]
  ];
  assert.equal(resolveResearchOutcome({ rank: 'novice', mode: 'advanced', effects: onlyT2, effectTierMap: tierMap, random: () => 0.70 }).outcome, 'revealed');
  assert.equal(resolveResearchOutcome({ rank: 'novice', mode: 'advanced', effects: onlyT2, effectTierMap: tierMap, random: () => 0.80 }).outcome, 'fail');

  // Apenas T5 (T+4 para Novato) oculto => falha por incompreensao sem revelar
  const onlyT5 = [
    { ...effects[0], known: true },
    { ...effects[1], known: true },
    effects[2]
  ];
  const tooHigh = resolveResearchOutcome({ rank: 'novice', mode: 'advanced', effects: onlyT5, effectTierMap: tierMap, random: () => 0.0 });
  assert.equal(tooHigh.ok, true);
  assert.equal(tooHigh.outcome, 'incomprehensible');
  assert.equal(tooHigh.revealedEffect, null);

  // Formato do Manuscrito e Compendio para leitura RP (estilo livros revisados + sumario)
  const text = formatManuscriptText({
    ingredientName: 'Abelha',
    ingredientKey: 'Skyrim.esm|0A9195',
    authorName: 'Alquimista Teste',
    effects: onlyT2,
    effectTierMap: tierMap
  });
  assert.match(text, /ESTUDO DE MATÉRIA/);
  assert.match(text, /<b>Abelha<\/b>/);
  assert.match(text, /\[pagebreak\]/);
  assert.match(text, /I\. Restaurar Vida - Tier 1 \(Novato\)/);
  assert.match(text, /néctar retido no abdômen/);
  assert.match(text, /II\. Virtude ainda não isolada em pesquisa\./);

  const compText = formatCompendiumText({
    authorName: 'Alquimista Teste',
    discoveredIngredients: [{ name: 'Abelha', stableFormKey: 'Skyrim.esm|0A9195', effects: onlyT2 }],
    effectTierMap: tierMap
  });
  assert.match(compText, /COMPÊNDIO DE PESQUISA ALQUÍMICA/);
  assert.match(compText, /Matérias catalogadas: 1/);
  assert.match(compText, /SUMÁRIO/);
  assert.match(compText, /<b>Abelha<\/b> \(1\/4\) - pág\. 3/);
  assert.match(compText, /Restam 3 virtudes por isolar em pesquisa\./);

  const { INGREDIENT_LORE_BY_KEY, getIngredientEffectLore } = require('../src/ingredient-lore.cjs');
  const loreKeys = Object.keys(INGREDIENT_LORE_BY_KEY);
  assert.equal(loreKeys.length, 181);
  for (const key of loreKeys) {
    const arr = INGREDIENT_LORE_BY_KEY[key];
    assert.equal(Array.isArray(arr) && arr.length === 4, true, `4 descricoes esperadas para ${key}`);
    for (let i = 0; i < 4; i++) {
      assert.equal(typeof arr[i] === 'string' && arr[i].trim().length >= 25, true, `Texto invalido em ${key}[${i}]`);
      assert.equal(getIngredientEffectLore(key.toLowerCase(), i), arr[i].trim());
    }
  }
});

test('unknown tier-locked effects fail silently without leaking RANK_EFFECT_LOCKED and known discovery is highlighted', async () => {
  const catalog = buildTestCatalog();
  const inv = new Map([
    ['ing:blisterwort', 10],
    ['ing:imp-stool', 10],
    ['ing:wheat', 10]
  ]);

  // Novato misturando 2 ingredientes com efeito Tier 3+ DESCONHECIDO não pode vazar RANK_EFFECT_LOCKED
  const unknownCatalog = new Map(catalog);
  for (const key of ['ing:blisterwort', 'ing:imp-stool']) {
    const item = unknownCatalog.get(key);
    unknownCatalog.set(key, {
      ...item,
      effects: item.effects.map(e => ({ ...e, known: false }))
    });
  }
  const hiddenBlocked = calculateRecipe({
    request: { ingredients: ['ing:blisterwort', 'ing:imp-stool'], operations: 1 },
    rank: 'novice',
    alchemySkill: 20,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: unknownCatalog,
    config
  });
  assert.equal(hiddenBlocked.failed, true);
  assert.equal(hiddenBlocked.outputCount, 0);
  assert.equal(hiddenBlocked.productName, 'Mistura Falha');

  // Se compartilhar T1 permitido + T3+ desconhecido, também falha como Mistura Falha (não cria poção "pura" grátis)
  const mixedAllowedAndHidden = calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort', 'ing:imp-stool'], operations: 1 },
    rank: 'novice',
    alchemySkill: 20,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: unknownCatalog,
    config
  });
  assert.equal(mixedAllowedAndHidden.failed, true);
  assert.equal(mixedAllowedAndHidden.outputCount, 0);
  assert.equal(mixedAllowedAndHidden.productName, 'Mistura Falha');

  // Destaque de descoberta retornado pelo craft
  const service = createAlchemyService({
    config,
    professionPort: {
      async getCareer() { return { professionId: 'alchemist', rank: 'novice', revision: 1 }; },
      async authorizeActivity(_ctx, i) { return { allowed: true, operationId: i.operationId }; },
      async settleActivity() {}
    },
    inventoryPort: {
      async getAlchemyInventory() {
        return { bottles: 5, alchemySkill: 20, inventoryByDefId: inv, catalogByDefId: catalog };
      },
      async commitAlchemy() {
        return {
          resultRef: 'ok-discover',
          discoveredEffects: [{ ingredientName: 'Trigo', effectName: 'Restaurar Vida' }]
        };
      }
    }
  });
  const prep = await service.prepare({ sessionId: 's2', characterId: 'c2' }, { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 1 });
  assert.equal(prep.ingredients.find(i => i.definitionId === 'ing:wheat').effects[0].tier, 1);
  // Efeito desconhecido no snapshot nao deve vazar tier (anti-metagaming)
  const snapUnknown = await createAlchemyService({
    config,
    professionPort: { async getCareer() { return { professionId: 'alchemist', rank: 'novice', revision: 1 }; } },
    inventoryPort: {
      async getAlchemyInventory() {
        return { bottles: 5, alchemySkill: 20, inventoryByDefId: inv, catalogByDefId: unknownCatalog };
      }
    }
  }).getSnapshot({ sessionId: 's3', characterId: 'c3' });
  assert.equal(snapUnknown.ingredients[0].effects[0].tier, undefined);

  const crafted = await service.craft({ sessionId: 's2', characterId: 'c2' }, { token: prep.preview.token });
  assert.equal(crafted.crafted.discoveredEffects.length, 1);
  assert.match(crafted.message, /Novo efeito descoberto: Trigo \(Restaurar Vida\)/);
});

test('portable kit reduces power by 20%, increases time by 50%, caps ops at 2 and blocks refines/crystallized', () => {
  const catalog = buildTestCatalog();
  const inv = new Map([['ing:wheat', 10], ['ing:blisterwort', 10]]);

  const normal = calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 2 },
    rank: 'novice',
    alchemySkill: 20,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  });

  const portable = calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 2, portable: true },
    rank: 'novice',
    alchemySkill: 20,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  });

  assert.equal(portable.portable, true);
  assert.ok(portable.effects[0].magnitude < normal.effects[0].magnitude);
  assert.equal(portable.craftSeconds, Math.round(normal.craftSeconds * 1.5 * 100) / 100);

  assert.throws(() => calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 3, portable: true },
    rank: 'novice',
    alchemySkill: 20,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  }), (err) => err.code === 'INSUFFICIENT_MATERIALS');

  assert.throws(() => calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 1, portable: true, stabilizeEffect: 'eff:restore-health' },
    rank: 'apprentice',
    alchemySkill: 40,
    bottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  }), (err) => err.code === 'PORTABLE_NO_REFINE');

  assert.throws(() => calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 1, portable: true, bottleType: 'crystallized' },
    rank: 'novice',
    alchemySkill: 20,
    bottles: 5,
    crystallizedBottles: 5,
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  }), (err) => err.code === 'PORTABLE_NO_CRYSTALLIZED');
});

test('crystallized bottle increases duration by 20% and specialist/master signing adds author name', () => {
  const catalog = buildTestCatalog();
  const inv = new Map([['ing:wheat', 10], ['ing:blisterwort', 10]]);

  const normal = calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 1 },
    rank: 'specialist',
    alchemySkill: 80,
    bottles: 5,
    crystallizedBottles: 2,
    signerName: 'Eldrin',
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  });

  const crystSigned = calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 1, bottleType: 'crystallized', signPotion: true },
    rank: 'specialist',
    alchemySkill: 80,
    bottles: 5,
    crystallizedBottles: 2,
    signerName: 'Eldrin',
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  });

  assert.equal(crystSigned.bottleType, 'crystallized');
  assert.equal(crystSigned.effects[0].duration, Math.round(normal.effects[0].duration * 1.2));
  assert.equal(crystSigned.productName, 'Poção de Restauração de Saúde Cristalizada — Eldrin');

  assert.throws(() => calculateRecipe({
    request: { ingredients: ['ing:wheat', 'ing:blisterwort'], operations: 1, signPotion: true },
    rank: 'adept',
    alchemySkill: 60,
    bottles: 5,
    signerName: 'Eldrin',
    inventoryByDefId: inv,
    ingredientCatalogByDefId: catalog,
    config
  }), (err) => err.code === 'RANK_TOO_LOW');
});

test('failed brew awards Borra Alquímica and craftAuxiliary recycles borra or crafts crystallized flask', async () => {
  const catalog = buildTestCatalog();
  const inv = new Map([['ing:wheat', 10], ['ing:giant-toe', 10]]);
  const auxCounts = new Map([
    ['GuildAlchemy.esp|00080D', 6],
    ['Skyrim.esm|034CDF', 2],
    ['Alchemy Requires Bottles Redux.esp|000800', 3],
    ['Skyrim.esm|05ACE3', 2],
    ['Skyrim.esm|03AD73', 2]
  ]);
  const commits = [];
  const auxCommits = [];

  const service = createAlchemyService({
    config,
    professionPort: {
      async getCareer() { return { professionId: 'alchemist', rank: 'novice', revision: 1 }; },
      async authorizeActivity(_ctx, i) { return { allowed: true, operationId: i.operationId }; },
      async settleActivity() {}
    },
    inventoryPort: {
      async getAlchemyInventory() {
        return {
          bottles: auxCounts.get('Alchemy Requires Bottles Redux.esp|000800') || 0,
          crystallizedBottles: auxCounts.get('GuildAlchemy.esp|00080E') || 0,
          dregsCount: auxCounts.get('GuildAlchemy.esp|00080D') || 0,
          auxCountsByKey: auxCounts,
          alchemySkill: 20,
          inventoryByDefId: inv,
          catalogByDefId: catalog
        };
      },
      async commitAlchemy(_ctx, op) {
        commits.push(op);
        return { resultRef: 'ok' };
      },
      async commitAuxiliary(_ctx, op) {
        auxCommits.push(op);
        for (const [k, cnt] of Object.entries(op.costs)) {
          auxCounts.set(k, (auxCounts.get(k) || 0) - cnt);
        }
        auxCounts.set(op.outputKey, (auxCounts.get(op.outputKey) || 0) + op.outputCount);
        return { resultRef: 'aux-ok' };
      }
    }
  });

  const prep = await service.prepare({ sessionId: 's1', characterId: 'c1' }, { ingredients: ['ing:wheat', 'ing:giant-toe'], operations: 2 });
  assert.equal(prep.preview.dregsOutputCount, 2);
  const resFail = await service.craft({ sessionId: 's1', characterId: 'c1' }, { token: prep.preview.token });
  assert.equal(resFail.crafted.failed, true);
  assert.equal(resFail.crafted.dregsOutputCount, 2);
  assert.equal(commits[0].dregsOutputCount, 2);
  assert.match(resFail.message, /2× Borra Alquímica/);

  const recycled = await service.craftAuxiliary({ sessionId: 's1', characterId: 'c1' }, { recipeId: 'recycle_borra', operations: 1 });
  assert.equal(recycled.ok, true);
  assert.equal(auxCounts.get('GuildAlchemy.esp|00080D'), 1);
  assert.equal(auxCounts.get('Skyrim.esm|034CDF'), 1);
  assert.equal(recycled.bottles, 4);

  const cryst = await service.craftAuxiliary({ sessionId: 's1', characterId: 'c1' }, { recipeId: 'crystallized_flask', operations: 2 });
  assert.equal(cryst.ok, true);
  assert.equal(cryst.crystallizedBottles, 2);
  assert.equal(cryst.bottles, 2);
  assert.equal(auxCommits[1].outputKey, 'GuildAlchemy.esp|00080E');
});
