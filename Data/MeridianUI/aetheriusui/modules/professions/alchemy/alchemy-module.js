(function () {
  'use strict';

  const RANK_LABELS = {
    none: 'Sem patente',
    novice: 'Novato',
    apprentice: 'Aprendiz',
    adept: 'Adepto',
    expert: 'Especialista',
    master: 'Mestre'
  };
  const RANK_ORDER = ['none', 'novice', 'apprentice', 'adept', 'expert', 'master'];
  const PROCESS_LABELS = {
    prepare: 'Preparar',
    stabilize: 'Estabilizar',
    purify: 'Purificar',
    concentrate: 'Concentrar'
  };
  const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  const MAX_ENVELOPE_BYTES = 16 * 1024;

  function sanitizePayload(value) {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(sanitizePayload);
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key)) throw new Error('Chave proibida no payload.');
      out[key] = sanitizePayload(entry);
    }
    return out;
  }

  function estimateBytes(value) {
    const json = JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(json).byteLength;
    return json.length;
  }

  function isStandbyError(message) {
    const text = String(message || '');
    return /ACTION_UNAVAILABLE|indispon|n[aã]o est[aá] dispon[ií]vel|Aguardando sessão|não registrado|prazo|timeout|standby|disabled|nao habilitado|não habilitado/i.test(text);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function rankIndex(rankId) {
    const idx = RANK_ORDER.indexOf(String(rankId || 'none').toLowerCase());
    return idx >= 0 ? idx : 0;
  }

  function mountAlchemyWorkshop(container, context, options = {}) {
    if (!container || !context || typeof context.request !== 'function') {
      throw new Error('Contexto AetheriusUI inválido para o módulo de Alquimia.');
    }

    const runtimeConfig = window.AetheriusAlchemyWorkshopConfig || {};
    const requestModuleId = options.requestModuleId || runtimeConfig.requestModuleId || 'alchemy';
    const actionMap = options.actionMap || runtimeConfig.actionMap || null;
    const testKitEnabled = Boolean(runtimeConfig.testKit);
    const assetBase = options.assetBase || 'modules/professions/alchemy/assets';
    let disposed = false;
    let craftTimer = null;

    const state = {
      mode: 'loading', // loading | standby | ready | error
      hasServerSnapshot: false,
      standbyReason: 'Conectando ao servidor autoritativo de Alquimia...',
      standbyCode: 'STANDBY',
      revision: 0,
      rank: 'none',
      vigor: null,
      bottles: 0,
      ingredients: [],
      selected: [],
      quantity: 1,
      process: null,
      preview: null,
      remove: null,
      stabilize: null,
      target: null,
      reagent: null,
      search: '',
      visibleLimit: 24,
      pending: false,
      crafting: false,
      craftElapsed: 0,
      craftTotal: 0,
      craftStage: '',
      statusText: 'Aguardando dados da bancada...',
      statusError: false
    };

    const root = el('section', 'ga-alchemy-workspace');
    root.setAttribute('aria-label', 'Bancada de Alquimia da Guilda');
    container.replaceChildren(root);

    function isAborted() {
      return disposed || Boolean(context.signal && context.signal.aborted);
    }

    function stopProgress(notice) {
      if (craftTimer) {
        clearInterval(craftTimer);
        craftTimer = null;
      }
      state.crafting = false;
      state.craftElapsed = 0;
      state.craftTotal = 0;
      state.craftStage = '';
      if (notice) {
        state.statusText = notice;
        state.statusError = false;
      }
    }

    function locked() {
      return state.mode !== 'ready' || state.pending || state.crafting;
    }

    function invalidatePreview() {
      state.preview = null;
      state.remove = null;
      state.stabilize = null;
      state.target = null;
      state.reagent = null;
      state.process = null;
    }

    async function sendIntent(action, rawPayload = {}) {
      if (isAborted()) return null;
      const mappedAction = (actionMap && actionMap[action]) || action;
      const basePayload = actionMap
        ? Object.assign({ profession: 'alchemist', alchemyAction: action }, rawPayload)
        : rawPayload;
      const payload = sanitizePayload(basePayload);
      if (estimateBytes({ moduleId: requestModuleId, action: mappedAction, payload }) > MAX_ENVELOPE_BYTES - 512) {
        throw new Error('Solicitação excede o limite de tamanho permitido.');
      }
      return context.request(requestModuleId, mappedAction, payload);
    }

    function applySnapshot(data) {
      if (!data || typeof data !== 'object') return;
      if (Number.isSafeInteger(data.revision)) {
        if (data.revision < state.revision) return;
        state.revision = data.revision;
      }
      if (data.standby === true) {
        state.mode = 'standby';
        state.standbyCode = data.code || 'ACTION_UNAVAILABLE';
        state.standbyReason = data.reason || 'Sistema de Alquimia aguardando ativação no servidor.';
        state.statusText = state.standbyReason;
        state.statusError = false;
        return;
      }
      state.mode = 'ready';
      state.hasServerSnapshot = true;
      if (typeof data.rank === 'string') state.rank = data.rank;
      if (data.vigor && typeof data.vigor === 'object') state.vigor = data.vigor;
      if (Number.isSafeInteger(data.bottles)) state.bottles = data.bottles;
      if (Array.isArray(data.ingredients)) state.ingredients = data.ingredients;
      if (data.preview !== undefined) state.preview = data.preview;
      if (data.message) {
        state.statusText = String(data.message);
        state.statusError = false;
      }
    }

    async function pullSnapshot() {
      if (state.pending || isAborted()) return;
      state.pending = true;
      state.mode = state.hasServerSnapshot ? state.mode : 'loading';
      render();
      try {
        const res = await sendIntent('snapshot', {});
        if (isAborted()) return;
        if (res && res.ok === false) {
          if (isStandbyError(res.code || res.message)) {
            state.mode = 'standby';
            state.standbyCode = res.code || 'ACTION_UNAVAILABLE';
            state.standbyReason = res.message || 'O servidor ainda não liberou o serviço de Alquimia.';
          } else {
            state.mode = 'error';
            state.statusText = res.message || 'Não foi possível carregar a bancada.';
            state.statusError = true;
          }
        } else {
          applySnapshot(res);
        }
      } catch (err) {
        if (isAborted()) return;
        const msg = err && err.message ? err.message : 'Servidor indisponível.';
        if (isStandbyError(msg)) {
          state.mode = 'standby';
          state.standbyCode = 'ACTION_UNAVAILABLE';
          state.standbyReason = msg;
          state.statusText = 'Conexão em espera: aguardando handler de Alquimia no servidor.';
          state.statusError = false;
        } else {
          state.mode = 'error';
          state.statusText = msg;
          state.statusError = true;
        }
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    async function prepareRecipe() {
      if (state.mode !== 'ready' || state.pending || state.crafting) return;
      if (state.selected.length < 2) return;
      state.pending = true;
      state.preview = null;
      state.statusText = 'Consultando receita no servidor...';
      state.statusError = false;
      render();
      try {
        const res = await sendIntent('prepare', {
          ingredients: state.selected,
          operations: state.quantity,
          removeEffect: state.remove,
          stabilizeEffect: state.stabilize,
          concentrateEffect: state.target,
          reagent: state.reagent
        });
        if (isAborted()) return;
        if (!res || res.ok === false) {
          state.preview = null;
          state.statusText = res?.message || 'Não foi possível preparar esta combinação.';
          state.statusError = true;
          if (isStandbyError(res?.code || res?.message)) {
            state.mode = 'standby';
            state.standbyCode = res?.code || 'ACTION_UNAVAILABLE';
            state.standbyReason = state.statusText;
          }
        } else {
          applySnapshot(res);
          state.preview = res.preview || null;
          state.statusText = res.message || 'Preparação validada pelo servidor. Nenhum ingrediente foi consumido.';
          state.statusError = false;
        }
      } catch (err) {
        if (isAborted()) return;
        state.preview = null;
        state.statusText = err?.message || 'Falha de comunicação ao preparar receita.';
        state.statusError = true;
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    async function finalizeCraft(preparationToken) {
      if (isAborted() || !preparationToken) return;
      state.pending = true;
      state.statusText = 'Confirmando produção no servidor...';
      state.statusError = false;
      render();
      try {
        // Sem retry automático em mutação (PROTOCOL.md).
        const res = await sendIntent('craft', { token: preparationToken });
        if (isAborted()) return;
        if (!res || res.ok === false) {
          state.statusText = res?.message || 'A produção foi recusada pelo servidor.';
          state.statusError = true;
        } else {
          applySnapshot(res);
          state.preview = null;
          state.statusText = res.message || 'Produção concluída pelo servidor.';
          state.statusError = false;
          context.toast?.(state.statusText);
        }
      } catch (err) {
        if (isAborted()) return;
        state.statusText = err?.message || 'Tempo esgotado na confirmação. Verifique seu inventário antes de repetir.';
        state.statusError = true;
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    function startCraftProgress() {
      const token = state.preview?.token;
      if (!token || locked()) return;
      const stages = Array.isArray(state.preview.stages) ? state.preview.stages : [];
      const total = Math.max(0.2, Number(state.preview.craftSeconds) || 0.2);
      const started = performance.now();
      state.crafting = true;
      state.craftTotal = total;
      state.craftElapsed = 0;

      const tick = () => {
        if (isAborted()) {
          stopProgress();
          return;
        }
        const elapsed = Math.min(total, (performance.now() - started) / 1000);
        state.craftElapsed = elapsed;
        let cursor = 0;
        let currentStage = stages[stages.length - 1]?.name || 'Preparando';
        for (const st of stages) {
          cursor += Number(st.seconds) || 0;
          if (elapsed <= cursor) {
            currentStage = st.name;
            break;
          }
        }
        state.craftStage = currentStage;
        renderProgressOnly();
        if (elapsed < total) return;
        stopProgress();
        state.preview = null;
        void finalizeCraft(token);
      };

      tick();
      craftTimer = setInterval(tick, 100);
      render();
    }

    function renderProgressOnly() {
      const wrap = root.querySelector('[data-progress-wrap]');
      if (!wrap) return;
      const stageEl = wrap.querySelector('[data-progress-stage]');
      const timeEl = wrap.querySelector('[data-progress-time]');
      const fillEl = wrap.querySelector('[data-progress-fill]');
      if (stageEl) stageEl.textContent = state.craftStage || 'Produzindo...';
      if (timeEl) timeEl.textContent = Math.ceil(Math.max(0, state.craftTotal - state.craftElapsed)) + ' s';
      if (fillEl && state.craftTotal > 0) {
        fillEl.style.width = ((state.craftElapsed / state.craftTotal) * 100).toFixed(1) + '%';
      }
    }

    function selectIngredient(definitionId) {
      if (locked()) return;
      if (state.selected.includes(definitionId)) {
        state.selected = state.selected.filter(id => id !== definitionId);
      } else if (state.selected.length < 3) {
        state.selected.push(definitionId);
      } else {
        state.statusText = 'Selecione no máximo três ingredientes.';
        state.statusError = false;
        render();
        return;
      }
      invalidatePreview();
      render();
    }

    function makeSelectField(labelText, choices, currentValue, onChange) {
      const wrap = el('div', 'ga-field-row');
      const label = el('label', '', labelText);
      const select = document.createElement('select');
      for (const [value, text] of choices) {
        const opt = el('option', '', text);
        opt.value = value;
        select.append(opt);
      }
      select.value = currentValue || '';
      select.disabled = locked() || choices.length < 2;
      select.addEventListener('change', event => onChange(event.target.value));
      wrap.append(label, select);
      return wrap;
    }

    function renderStandbyView() {
      const card = el('section', 'ga-standby-card');
      const icon = document.createElement('img');
      icon.src = assetBase + '/icons/alchemy-star.svg';
      icon.alt = '';
      const title = el('h2', '', state.mode === 'loading' ? 'Conectando à bancada...' : 'Conexão em espera com o servidor');
      const desc = el('p', '', state.standbyReason);
      const code = el('span', 'ga-standby-code', 'Estado: ' + (state.mode === 'loading' ? 'SINCRONIZANDO' : state.standbyCode));
      const retry = el('button', 'ga-btn', state.pending ? 'Consultando...' : 'Tentar reconectar');
      retry.type = 'button';
      retry.disabled = state.pending;
      retry.addEventListener('click', () => void pullSnapshot());
      card.append(icon, title, desc, code, retry);
      return card;
    }

    function renderColumns() {
      const columns = el('div', 'ga-columns');
      const currentRankIdx = rankIndex(state.rank);

      // Coluna 1: Matéria
      const matter = el('section', 'ga-panel');
      const mHead = el('div', 'ga-panel-heading');
      mHead.append(el('span', 'ga-panel-num', '01'), el('h2', '', 'Matéria'), el('span', 'ga-panel-detail', `${state.selected.length} / 3`));
      matter.append(mHead, el('p', 'ga-panel-subtitle', 'Escolha os ingredientes autorizados no servidor.'));

      const searchWrap = el('label', 'ga-search-wrap');
      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.placeholder = 'Buscar ingrediente ou efeito conhecido...';
      searchInput.value = state.search;
      searchInput.setAttribute('aria-label', 'Buscar ingrediente ou efeito conhecido');
      searchInput.addEventListener('input', event => {
        state.search = event.target.value;
        state.visibleLimit = 24;
        renderIngredientItems(listEl, countEl);
      });
      searchWrap.append(searchInput);
      matter.append(searchWrap);

      const query = state.search.trim().toLocaleLowerCase('pt-BR');
      const filtered = state.ingredients.filter(item =>
        String(item.name || '').toLocaleLowerCase('pt-BR').includes(query) ||
        (item.effects || []).some(eff => eff.known && String(eff.name || '').toLocaleLowerCase('pt-BR').includes(query))
      );

      const meta = el('div', 'ga-list-meta');
      const countEl = el('span', '', `${filtered.length} disponíveis`);
      meta.append(el('span', '', 'Selecione 2 ou 3 ingredientes'), countEl);
      matter.append(meta);

      const listEl = el('div', 'ga-ingredient-list');
      listEl.addEventListener('scroll', () => {
        if (listEl.scrollTop + listEl.clientHeight < listEl.scrollHeight - 160) return;
        if (state.visibleLimit >= filtered.length) return;
        state.visibleLimit += 24;
        renderIngredientItems(listEl, countEl);
      }, { passive: true });
      renderIngredientItems(listEl, countEl);
      matter.append(listEl);

      const knownTotal = state.ingredients.reduce(
        (sum, item) => sum + (item.effects || []).filter(e => e.known).length, 0
      );
      const mFooter = el('div', 'ga-matter-footer');
      const s1 = el('span', '', 'Efeitos conhecidos');
      s1.append(el('strong', '', String(knownTotal)));
      const s2 = el('span', '', 'Garrafas vazias');
      s2.append(el('strong', '', String(state.bottles)));
      mFooter.append(s1, s2);
      matter.append(mFooter);

      // Coluna 2: Ressonância
      const resonance = el('section', 'ga-panel');
      const rHead = el('div', 'ga-panel-heading');
      rHead.append(
        el('span', 'ga-panel-num', '02'),
        el('h2', '', 'Ressonância'),
        el('span', 'ga-panel-detail', state.preview ? 'RESSONÂNCIA ATIVA' : 'PREPARAÇÃO')
      );
      resonance.append(rHead, el('p', 'ga-panel-subtitle', 'Efeitos calculados pelo servidor na combinação atual.'));

      const slots = el('div', 'ga-slots');
      const slotIcons = ['herb.svg', 'flask.svg', 'mortar.svg'];
      const slotPlaceholders = ['Primeiro ingrediente', 'Segundo ingrediente', 'Terceiro ingrediente'];
      for (let i = 0; i < 3; i += 1) {
        const defId = state.selected[i];
        const ing = state.ingredients.find(item => item.definitionId === defId);
        const slotBtn = el('button', 'ga-slot' + (ing ? ' is-filled' : ''));
        slotBtn.type = 'button';
        slotBtn.disabled = locked() || !ing;
        const img = document.createElement('img');
        img.src = assetBase + '/icons/' + slotIcons[i];
        img.alt = '';
        slotBtn.append(img, el('small', '', ing ? ing.name : slotPlaceholders[i]));
        slotBtn.addEventListener('click', () => {
          if (defId) selectIngredient(defId);
        });
        slots.append(slotBtn);
      }
      resonance.append(slots);

      const effectsBox = el('div', 'ga-effects');
      const activeEffects = Array.isArray(state.preview?.effects)
        ? state.preview.effects.filter(e => !e.removed)
        : [];
      if (!activeEffects.length) {
        effectsBox.append(el('div', 'ga-empty', state.selected.length < 2
          ? 'Selecione ao menos dois ingredientes para preparar.'
          : 'Clique em Preparar para validar a receita no servidor.'));
      } else {
        for (const eff of activeEffects) {
          const row = el('div', 'ga-effect-row' + (eff.rankBlocked ? ' is-locked' : ''));
          row.append(el('span', 'ga-effect-dot' + (eff.hostile ? ' is-hostile' : '')));
          row.append(el('strong', '', eff.known ? eff.name : '???'));
          const parts = [];
          if (eff.known && eff.magnitude != null) parts.push(Number(eff.magnitude).toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
          if (eff.known && eff.duration != null) parts.push(eff.duration + ' s');
          if (eff.concentrated) parts.push('Concentrada');
          if (eff.stabilized) parts.push('Estabilizada');
          if (eff.rankBlocked) parts.push('Exige rank superior');
          row.append(el('span', 'ga-effect-measure', parts.join(' · ')));
          effectsBox.append(row);
        }
      }
      resonance.append(effectsBox);

      if (state.preview) {
        const pred = el('div', 'ga-predicted');
        pred.append(
          el('span', 'ga-kicker', 'Resultado previsto'),
          el('div', 'ga-predicted-name ga-serif', state.preview.productName || 'Produto alquímico'),
          el('div', 'ga-predicted-type', 'Tipo: ' + (state.preview.productType || 'desconhecido'))
        );
        resonance.append(pred);
      }

      const qtyRow = el('div', 'ga-quantity-row');
      qtyRow.append(el('span', '', 'Operações'));
      const stepper = el('div', 'ga-stepper');
      const minus = el('button', 'ga-btn', '−');
      minus.type = 'button';
      minus.disabled = locked() || state.quantity <= 1;
      minus.addEventListener('click', () => {
        state.quantity = Math.max(1, state.quantity - 1);
        if (state.preview) void prepareRecipe();
        else render();
      });
      const out = el('output', '', String(state.quantity));
      const plus = el('button', 'ga-btn', '+');
      plus.type = 'button';
      plus.disabled = locked() || state.quantity >= 100;
      plus.addEventListener('click', () => {
        state.quantity = Math.min(100, state.quantity + 1);
        if (state.preview) void prepareRecipe();
        else render();
      });
      const maxBtn = el('button', 'ga-btn', 'Máx.');
      maxBtn.type = 'button';
      maxBtn.disabled = locked() || !state.preview || state.preview.maxOperations < 1;
      maxBtn.addEventListener('click', () => {
        state.quantity = Math.max(1, Number(state.preview?.maxOperations) || 1);
        void prepareRecipe();
      });
      stepper.append(minus, out, plus, maxBtn);
      qtyRow.append(stepper);
      resonance.append(qtyRow);

      const yieldRow = el('div', 'ga-yield-row');
      yieldRow.append(
        el('span', '', 'Produção prevista'),
        el('strong', '', state.preview ? `${state.preview.outputCount} un.` : '—')
      );
      resonance.append(yieldRow);

      // Coluna 3: Ofício
      const craft = el('section', 'ga-panel');
      const cHead = el('div', 'ga-panel-heading');
      cHead.append(el('span', 'ga-panel-num', '03'), el('h2', '', 'Ofício'), el('span', 'ga-panel-detail', 'PROCESSO'));
      craft.append(cHead, el('p', 'ga-panel-subtitle', 'Selecione e aplique o processo alquímico.'));

      const processesBox = el('div', 'ga-processes');
      const reqs = {
        prepare: currentRankIdx >= 1 && state.selected.length >= 2,
        stabilize: currentRankIdx >= 2 && Boolean(state.preview?.canStabilize),
        purify: currentRankIdx >= 4 && Boolean(state.preview?.canPurify),
        concentrate: currentRankIdx >= 4 && Boolean(state.preview?.canConcentrate)
      };
      const procDefs = [
        ['prepare', 'mortar.svg', currentRankIdx < 1 ? 'Requer rank Novato' : 'Calcula a combinação sem consumir matéria.'],
        ['stabilize', 'herb.svg', currentRankIdx < 2 ? 'Requer rank Aprendiz' : (state.preview?.stabilizeReason || 'Reduz uma virtude indesejada.')],
        ['purify', 'drop.svg', currentRankIdx < 4 ? 'Requer rank Especialista' : (state.preview?.purifyReason || 'Remove uma virtude secundária.')],
        ['concentrate', 'flask.svg', currentRankIdx < 4 ? 'Requer rank Especialista' : (state.preview?.concentrateReason || 'Fortalece uma virtude com reagente extra.')]
      ];
      for (const [key, iconFile, reason] of procDefs) {
        const btn = el('button', 'ga-process-btn' + (state.process === key ? ' is-active' : ''));
        btn.type = 'button';
        btn.disabled = locked() || !reqs[key];
        btn.setAttribute('aria-pressed', String(state.process === key));
        const icon = document.createElement('img');
        icon.src = assetBase + '/icons/' + iconFile;
        icon.alt = '';
        const copy = el('span', 'ga-process-copy');
        copy.append(el('strong', '', PROCESS_LABELS[key]), el('small', '', reason));
        btn.append(icon, copy);
        btn.addEventListener('click', () => {
          state.process = key;
          state.remove = null;
          state.stabilize = null;
          state.target = null;
          state.reagent = null;
          void prepareRecipe();
        });
        processesBox.append(btn);
      }
      craft.append(processesBox);

      const optionsBox = el('div', 'ga-process-options');
      const knownPreview = activeEffects.filter(e => e.known);
      if (state.process === 'stabilize' && state.preview) {
        const choices = [['', 'Não estabilizar'], ...knownPreview.filter(e => e.canRefine).map(e => [e.effectId, e.name])];
        optionsBox.append(makeSelectField('Virtude indesejada a reduzir', choices, state.stabilize, value => {
          state.stabilize = value || null;
          if (state.stabilize) state.remove = null;
          void prepareRecipe();
        }));
      } else if (state.process === 'purify' && state.preview) {
        const choices = [['', 'Não remover'], ...knownPreview.filter(e => e.canRefine).map(e => [e.effectId, e.name])];
        optionsBox.append(makeSelectField('Virtude secundária a remover', choices, state.remove, value => {
          state.remove = value || null;
          if (state.remove) state.stabilize = null;
          if (state.remove === state.target) { state.target = null; state.reagent = null; }
          void prepareRecipe();
        }));
      } else if (state.process === 'concentrate' && state.preview) {
        const choices = [['', 'Não concentrar'], ...knownPreview.filter(e => e.canConcentrate).map(e => [e.effectId, e.name])];
        optionsBox.append(makeSelectField('Virtude a concentrar', choices, state.target, value => {
          state.target = value || null;
          state.reagent = null;
          if (!state.target) void prepareRecipe();
          else render();
        }));
        const selectedEff = activeEffects.find(e => e.effectId === state.target);
        const reagents = [['', 'Escolha o reagente']];
        for (const rId of selectedEff?.reagents || []) {
          const ing = state.ingredients.find(item => item.definitionId === rId);
          if (ing) reagents.push([rId, ing.name]);
        }
        optionsBox.append(makeSelectField('Reagente adicional', reagents, state.reagent, value => {
          state.reagent = value || null;
          if (state.target && state.reagent) void prepareRecipe();
          else render();
        }));
      }
      craft.append(optionsBox);

      const summary = el('div', 'ga-summary');
      const sumHead = el('div', 'ga-summary-head');
      sumHead.append(el('span', '', 'Resumo da receita'), el('span', '', state.preview ? String(state.preview.productType || 'PREPARADA').toUpperCase() : 'AGUARDANDO'));
      summary.append(sumHead);
      if (state.preview && Array.isArray(state.preview.costs)) {
        for (const cost of state.preview.costs) {
          const line = el('div', 'ga-summary-line');
          line.append(el('span', '', cost.name), el('strong', '', `${cost.required} / ${cost.available}`));
          summary.append(line);
        }
      } else {
        summary.append(el('p', 'ga-panel-subtitle', 'Nenhuma receita preparada.'));
      }
      craft.append(summary);

      const optionSelected = state.process === 'prepare' ||
        (state.process === 'stabilize' && Boolean(state.stabilize)) ||
        (state.process === 'purify' && Boolean(state.remove)) ||
        (state.process === 'concentrate' && Boolean(state.target) && Boolean(state.reagent));
      const canCraft = Boolean(state.preview?.canFinalize && state.preview?.token && optionSelected);
      const craftBtn = el('button', 'ga-btn ga-btn-primary', state.pending
        ? 'Aguardando servidor...'
        : state.crafting ? 'Produção em andamento...' : 'Iniciar produção');
      craftBtn.type = 'button';
      craftBtn.disabled = locked() || !canCraft;
      craftBtn.addEventListener('click', startCraftProgress);
      craft.append(craftBtn);

      if (state.crafting) {
        const pWrap = el('div', 'ga-progress-wrap');
        pWrap.setAttribute('data-progress-wrap', '1');
        const pMeta = el('div', 'ga-progress-meta');
        const pStage = el('span', '', state.craftStage || 'Produzindo...');
        pStage.setAttribute('data-progress-stage', '1');
        const pTime = el('strong', '', Math.ceil(state.craftTotal - state.craftElapsed) + ' s');
        pTime.setAttribute('data-progress-time', '1');
        pMeta.append(pStage, pTime);
        const track = el('div', 'ga-progress-track');
        const fill = el('div', 'ga-progress-fill');
        fill.setAttribute('data-progress-fill', '1');
        track.append(fill);
        pWrap.append(pMeta, track);
        craft.append(pWrap);
      }

      columns.append(matter, resonance, craft);
      return columns;
    }

    function renderIngredientItems(listEl, countEl) {
      const query = state.search.trim().toLocaleLowerCase('pt-BR');
      const filtered = state.ingredients.filter(item =>
        String(item.name || '').toLocaleLowerCase('pt-BR').includes(query) ||
        (item.effects || []).some(eff => eff.known && String(eff.name || '').toLocaleLowerCase('pt-BR').includes(query))
      );
      if (countEl) countEl.textContent = `${filtered.length} disponíveis`;
      listEl.replaceChildren();
      if (!filtered.length) {
        listEl.append(el('div', 'ga-empty', 'Nenhum ingrediente disponível no inventário.'));
        return;
      }
      for (const item of filtered.slice(0, state.visibleLimit)) {
        const isSelected = state.selected.includes(item.definitionId);
        const card = el('button', 'ga-ingredient-card' + (isSelected ? ' is-selected' : ''));
        card.type = 'button';
        card.disabled = locked() || (state.selected.length >= 3 && !isSelected);
        card.setAttribute('aria-pressed', String(isSelected));
        const head = el('div', 'ga-ingredient-head');
        head.append(el('span', '', item.name), el('strong', '', '×' + item.count));
        const tags = el('div', 'ga-effect-tags');
        for (const eff of item.effects || []) {
          tags.append(el('span', '', eff.known ? eff.name : '???'));
        }
        card.append(head, tags);
        card.addEventListener('click', () => selectIngredient(item.definitionId));
        listEl.append(card);
      }
    }

    function render() {
      if (isAborted()) return;
      root.replaceChildren();

      const header = el('header', 'ga-header');
      const brand = el('div');
      brand.append(
        el('span', 'ga-kicker', 'AETHERIUS · OFÍCIOS · ALQUIMIA'),
        el('h1', '', 'Bancada da Guilda dos Alquimistas'),
        el('p', 'ga-subtitle', 'Consumo, patentes e resultados são autorizados pelo servidor.')
      );

      const identity = el('div', 'ga-identity');
      const rankBox = el('div', 'ga-rank-box');
      rankBox.append(
        el('span', 'ga-rank-name', RANK_LABELS[state.rank] || state.rank),
        el('span', 'ga-rank-meta', state.vigor
          ? `Vigor ${Math.floor(state.vigor.current)} / ${Math.floor(state.vigor.max)}`
          : 'Autoridade do servidor')
      );
      const refreshBtn = el('button', 'ga-btn', 'Atualizar');
      refreshBtn.type = 'button';
      refreshBtn.disabled = state.pending || state.crafting;
      refreshBtn.addEventListener('click', () => void pullSnapshot());
      if (testKitEnabled && state.mode === 'ready') {
        const rankSelect = document.createElement('select');
        rankSelect.className = 'ga-btn';
        rankSelect.setAttribute('aria-label', 'Patente de teste');
        for (const r of ['novice', 'apprentice', 'adept', 'specialist', 'master']) {
          const opt = el('option', '', 'Teste: ' + (RANK_LABELS[r] || r));
          opt.value = r;
          rankSelect.append(opt);
        }
        rankSelect.value = RANK_LABELS[state.rank] ? state.rank : 'novice';
        rankSelect.disabled = state.pending || state.crafting;
        rankSelect.addEventListener('change', async event => {
          const res = await sendIntent('setTestRank', { rank: event.target.value }).catch(e => ({ ok: false, message: e.message }));
          if (res?.ok) applySnapshot(res);
          else { state.statusText = res?.message || 'Falha ao trocar rank de teste.'; state.statusError = true; }
          render();
        });
        const kitBtn = el('button', 'ga-btn', '+ Kit Teste');
        kitBtn.type = 'button';
        kitBtn.disabled = state.pending || state.crafting;
        kitBtn.addEventListener('click', async () => {
          const res = await sendIntent('giveTestKit', {}).catch(e => ({ ok: false, message: e.message }));
          if (res?.ok) applySnapshot(res);
          else { state.statusText = res?.message || 'Falha ao entregar kit de teste.'; state.statusError = true; }
          render();
        });
        identity.append(rankSelect, kitBtn);
      }
      identity.append(rankBox, refreshBtn);
      header.append(brand, identity);
      root.append(header);

      const statusBar = el('div', 'ga-status-bar' +
        (state.mode === 'standby' || state.mode === 'loading' ? ' is-standby' : '') +
        (state.statusError ? ' is-error' : ''));
      statusBar.append(el('span', 'ga-status-dot'), el('span', '', state.statusText));
      root.append(statusBar);

      if (state.mode === 'loading' || state.mode === 'standby' || (state.mode === 'error' && !state.hasServerSnapshot)) {
        root.append(renderStandbyView());
      } else {
        root.append(renderColumns());
        renderProgressOnly();
      }

      const footer = el('footer', 'ga-footer');
      footer.append(el('span', '', 'A natureza oferece. Nós revelamos.'), el('span', '', 'Protocolo Aetherius UI v1'));
      root.append(footer);
    }

    const unsubscribe = typeof context.subscribe === 'function'
      ? context.subscribe(envelope => {
          if (isAborted() || !envelope) return;
          if ((envelope.kind === 'snapshot' || envelope.kind === 'event') && envelope.payload) {
            applySnapshot(envelope.payload);
            render();
          }
        })
      : () => {};

    if (context.signal) {
      context.signal.addEventListener('abort', () => {
        disposed = true;
        stopProgress();
      }, { once: true });
    }

    void pullSnapshot();

    return {
      unmount() {
        disposed = true;
        stopProgress();
        unsubscribe();
        container.replaceChildren();
      }
    };
  }

  window.AetheriusAlchemyWorkshop = Object.freeze({
    id: 'professions',
    route: '/professions/alchemist-workshop',
    requestModuleId: 'alchemy',
    mount: mountAlchemyWorkshop
  });

  // Se o módulo oficial 'professions' ainda não estiver registrado neste shell,
  // registra um adapter standalone para teste direto da bancada no AetheriusUI_Core.
  const ui = window.AetheriusUI;
  if (ui && typeof ui.registerModule === 'function' &&
      typeof ui.getRegisteredModuleIds === 'function' &&
      !ui.getRegisteredModuleIds().includes('professions')) {
    ui.registerModule({
      id: 'professions',
      version: '0.2.0',
      sdkMin: '1.0.0',
      sdkMaxExclusive: '2.0.0',
      label: 'PROFISSÕES',
      rootRoute: '/professions',
      subroutes: ['/professions/alchemist-workshop'],
      radialSlot: 7,
      assets: [
        'modules/professions/alchemy/alchemy-module.css',
        'modules/professions/alchemy/assets/alchemy-footer.svg',
        'modules/professions/alchemy/assets/icons/alchemy-star.svg',
        'modules/professions/alchemy/assets/icons/drop.svg',
        'modules/professions/alchemy/assets/icons/flask.svg',
        'modules/professions/alchemy/assets/icons/herb.svg',
        'modules/professions/alchemy/assets/icons/mortar.svg'
      ],
      capabilities: ['professions.read', 'alchemy.prepare', 'alchemy.craft'],
      mount: function (container, context) {
        return mountAlchemyWorkshop(container, context);
      }
    });
  }
}());
