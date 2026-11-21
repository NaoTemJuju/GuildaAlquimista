'use strict';

const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const rules = require('./rules.cjs');
const recipeEngine = require('./recipe-engine.cjs');
const researchEngine = require('./research-engine.cjs');
const { composeAlchemyProfessionGrants } = require('./perk-grants.cjs');
const { createAlchemyService } = require('./alchemy-service.cjs');
const { registerAlchemyUiHandlers, validateUiEnvelope } = require('./ui-adapter.cjs');

function loadDefaultAlchemyConfig(customPath = null) {
  const file = customPath || join(__dirname, '..', 'config', 'alchemy-defaults.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

module.exports = {
  ...rules,
  ...recipeEngine,
  ...researchEngine,
  composeAlchemyProfessionGrants,
  createAlchemyService,
  loadDefaultAlchemyConfig,
  registerAlchemyUiHandlers,
  validateUiEnvelope
};
