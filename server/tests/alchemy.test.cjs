'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  Axis,
  batchSeconds,
  calculateRecipe,
  composeAlchemyProfessionGrants,
  computeCosts,
  computeMaximum,
  createAlchemyService,
  loadDefaultAlchemyConfig,
  registerAlchemyUiHandlers,
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
  assert.equal(batchSeconds(2, 'novice', config.timing), 19.75);
  assert.equal(batchSeconds(3, 'adept', config.timing), 28.5);
  assert.equal(batchSeconds(20, 'novice', config.timing), 169.0);
  assert.equal(batchSeconds(20, 'master', config.timing), 88.0);

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
  assert.equal(noviceOk.productName, 'Poção de Restauração de Vida');

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
