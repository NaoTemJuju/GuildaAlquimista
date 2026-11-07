'use strict';
// Visual adapter for the approved preview. All recipes and transactions come from C++.
(() => {
  const $ = id => document.getElementById(id);
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const ranks = ['Sem patente', 'Novato', 'Aprendiz', 'Adepto', 'Especialista', 'Mestre'];
  const processNames = {
    prepare: 'Preparar', stabilize: 'Estabilizar',
    purify: 'Purificar', concentrate: 'Concentrar'
  };
  const state = {
    session: '', revision: 0, rank: 0, alchemy: null, bottles: 0,
    ingredients: [], selected: [], quantity: 1, process: null,
    preview: null, remove: null, stabilize: null, target: null, reagent: null,
    pending: null, sequence: 0, connected: false, crafting: false, craftTimer: null,
    visibleLimit: 24
  };
  const validCount = value => Number.isSafeInteger(value) && value >= 0;
  const effectName = effect => effect.known ? effect.name : '???';
  const lock = () => !state.connected || !!state.pending || state.crafting;
  const recipe = () => ({
    ingredients: state.selected, operations: state.quantity,
    removeEffect: state.remove, stabilizeEffect: state.stabilize,
    concentrateEffect: state.target, reagent: state.reagent
  });
  const notify = (message, error = false) => {
    $('status').textContent = message;
    document.querySelector('.status-row').classList.toggle('error', error);
  };

  function send(action, payload = {}) {
    if (state.pending && action !== 'close') return;
    if (!window.GuildAlchemyUI?.request || !state.connected) {
      notify('Sem conexão com o plugin Guild Alchemy. Nenhum item foi consumido.', true);
      return;
    }
    const id = ++state.sequence;
    state.pending = id;
    renderControls();
    try {
      window.GuildAlchemyUI.request({
        protocol: 1, id, action, session: state.session,
        revision: state.revision, payload
      });
    } catch (_) {
      state.pending = null;
      state.connected = false;
      renderControls();
      notify('Falha na conexão com a bancada.', true);
    }
  }

  function prepare() {
    state.preview = null;
    render();
    send('prepare', recipe());
  }
  function invalidate() {
    state.preview = null;
    state.remove = null;
    state.stabilize = null;
    state.target = null;
    state.reagent = null;
    state.process = null;
    render();
  }
  function selectIngredient(id) {
    if (state.pending || state.crafting) return;
    if (state.selected.includes(id)) {
      state.selected = state.selected.filter(value => value !== id);
    } else if (state.selected.length < 3) {
      state.selected.push(id);
    } else {
      notify('Selecione no máximo três ingredientes.');
      return;
    }
    invalidate();
  }

  function renderIngredients() {
    const query = $('search').value.trim().toLocaleLowerCase('pt-BR');
    const filtered = state.ingredients.filter(item =>
      item.name.toLocaleLowerCase('pt-BR').includes(query) ||
      (item.effects || []).some(effect =>
        effect.known && String(effect.name || '')
          .toLocaleLowerCase('pt-BR').includes(query)));
    const list = $('ingredient-list');
    const scrollTop = list.scrollTop;
    list.replaceChildren();
    const limit = Math.min(state.visibleLimit, filtered.length);
    for (const item of filtered.slice(0, limit)) {
      const button = node('button', '', 'ingredient-card');
      button.type = 'button';
      button.disabled = lock() ||
        (state.selected.length >= 3 && !state.selected.includes(item.id));
      button.classList.toggle('selected', state.selected.includes(item.id));
      button.setAttribute('aria-pressed', String(state.selected.includes(item.id)));
      const head = node('div', '', 'ingredient-card-head');
      head.append(node('span', item.name), node('b', '×' + item.count));
      const tags = node('div', '', 'effect-tags');
      for (const effect of item.effects || []) {
        tags.append(node('span', effectName(effect)));
      }
      button.append(head, tags);
      button.addEventListener('click', () => selectIngredient(item.id));
      list.append(button);
    }
    if (!filtered.length) {
      list.append(node('div', state.connected ?
        'Nenhum ingrediente encontrado.' : 'Aguardando inventário do jogo.', 'no-results'));
    }
    list.scrollTop = scrollTop;
    $('ingredient-count').textContent = filtered.length + ' disponíveis';
    $('selection-count').textContent = state.selected.length + ' / 3';
    $('known-count').textContent = String(state.ingredients.reduce(
      (total, item) => total + (item.effects || []).filter(effect => effect.known).length, 0));
    $('bottle-count').textContent = String(state.bottles);
  }

  function renderOrbit() {
    document.querySelectorAll('.orbit-slot').forEach((button, index) => {
      const id = state.selected[index];
      const ingredient = state.ingredients.find(item => item.id === id);
      button.classList.toggle('filled', !!ingredient);
      button.querySelector('small').textContent = ingredient ?
        ingredient.name : ['Primeiro ingrediente', 'Segundo ingrediente', 'Terceiro ingrediente'][index];
      button.title = ingredient ? 'Remover ' + ingredient.name : 'Selecione um ingrediente em Matéria';
      button.disabled = lock() || !ingredient;
    });
  }

  function renderEffects() {
    const box = $('effects');
    box.replaceChildren();
    const effects = (state.preview && Array.isArray(state.preview.effects)) ?
      state.preview.effects.filter(effect => !effect.removed) : [];
    if (!effects.length) {
      box.append(node('div', state.selected.length < 2 ?
        'Selecione dois ingredientes para revelar suas virtudes em ressonância.' :
        'Prepare a combinação para examinar as virtudes em ressonância.', 'empty-state'));
    }
    for (const effect of effects) {
      const row = node('div', '', 'effect-row');
      const badge = node('span', '', 'effect-badge' + (effect.hostile ? ' harmful' : ''));
      const label = node('strong', effectName(effect));
      const parts = [];
      if (effect.known && effect.magnitude != null)
        parts.push(Number(effect.magnitude).toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
      if (effect.known && effect.duration != null) parts.push(effect.duration + ' s');
      if (effect.concentrated) parts.push('Concentrada');
      if (effect.stabilized) parts.push('Estabilizada');
      row.append(badge, label, node('span', parts.join(' · '), 'measure'));
      box.append(row);
    }
    $('predicted').hidden = !state.preview;
    if (state.preview) {
      $('result-name').textContent = state.preview.productName || 'Produto alquímico';
      $('result-type').textContent = 'Resultado previsto: ' +
        (state.preview.productType || 'desconhecido');
    }
    $('resonance-phase').textContent = state.preview ?
      'RESSONÂNCIA ATIVA' : 'PREPARAÇÃO';
  }

  function makeField(labelText, id, choices, current, onChange) {
    const row = node('div', '', 'field-row');
    const label = node('label', labelText);
    label.htmlFor = id;
    const select = document.createElement('select');
    select.id = id;
    for (const [value, text] of choices) {
      const option = node('option', text);
      option.value = value;
      select.append(option);
    }
    select.value = current || '';
    select.disabled = lock() || choices.length < 2;
    select.addEventListener('change', event => onChange(event.target.value));
    row.append(label, select);
    return row;
  }
  function renderProcessOptions() {
    const box = $('process-options');
    box.replaceChildren();
    const preview = state.preview;
    const known = (preview && Array.isArray(preview.effects)) ?
      preview.effects.filter(effect => effect.known) : [];
    if (state.process === 'prepare') {
      box.append(node('p', 'Preparação básica: revela as virtudes da combinação sem refinamento.', 'option-note'));
      return;
    }
    if (!preview) {
      box.append(node('p', 'Prepare a receita para escolher uma virtude.', 'option-note'));
      return;
    }
    if (state.process === 'stabilize') {
      const choices = [['', 'Não estabilizar']];
      for (const effect of known.filter(value => value.canRefine))
        choices.push([effect.id, effectName(effect)]);
      box.append(makeField('Virtude indesejada a reduzir', 'stabilize-effect',
        choices, state.stabilize, value => {
          state.stabilize = value || null;
          if (state.stabilize) state.remove = null;
          prepare();
        }));
    }
    if (state.process === 'purify') {
      const choices = [['', 'Não remover']];
      for (const effect of known.filter(value => value.canRefine))
        choices.push([effect.id, effectName(effect)]);
      box.append(makeField('Qual virtude deseja remover?', 'remove-effect',
        choices, state.remove, value => {
          state.remove = value || null;
          if (state.remove) state.stabilize = null;
          if (state.remove === state.target) {
            state.target = null;
            state.reagent = null;
          }
          prepare();
        }));
    }
    if (state.process === 'concentrate') {
      const choices = [['', 'Não concentrar']];
      for (const effect of known.filter(value => !value.removed && value.canConcentrate))
        choices.push([effect.id, effectName(effect)]);
      box.append(makeField('Virtude a concentrar', 'target-effect',
        choices, state.target, value => {
          state.target = value || null;
          state.reagent = null;
          if (!state.target) prepare();
          else render();
        }));
      const effect = (Array.isArray(preview.effects) ? preview.effects : [])
        .find(value => String(value.id) === String(state.target));
      const reagents = [['', 'Escolha o reagente']];
      for (const id of effect?.reagents || []) {
        const ingredient = state.ingredients.find(value => value.id === id);
        if (ingredient) reagents.push([id, ingredient.name]);
      }
      box.append(makeField('Reagente adicional', 'reagent',
        reagents, state.reagent, value => {
          state.reagent = value || null;
          if (state.target && state.reagent) prepare();
          else render();
        }));
      box.append(node('p', 'Uma unidade extra por operação. Não gera novas virtudes.', 'option-note'));
    }
  }

  function renderSummary() {
    const preview = state.preview;
    const box = $('summary-lines');
    box.replaceChildren();
    if (!preview) {
      box.append(node('p', 'Selecione ingredientes para preparar uma receita.'));
      $('summary-kind').textContent = 'AGUARDANDO';
      $('yield').textContent = '—';
      $('yield-note').textContent = 'Selecione uma combinação válida.';
    } else {
      for (const item of preview.costs || []) {
        const row = node('div', '', 'summary-line');
        row.append(node('span', item.name),
          node('b', item.required + ' / ' + item.available));
        box.append(row);
      }
      $('summary-kind').textContent =
        String(preview.productType || 'PREPARADA').toLocaleUpperCase('pt-BR');
      $('yield').textContent = preview.outputCount +
        (preview.outputCount === 1 ? ' unidade' : ' unidades');
      $('yield-note').textContent = preview.doubleToil ?
        'Double Toil and Trouble incluído uma vez na produção prevista.' :
        'Ingredientes consumidos ao finalizar.';
    }
    $('quantity').textContent = String(state.quantity);
  }

  function renderControls() {
    const locked = lock();
    const preview = state.preview;
    const requirements = {
      prepare: state.rank >= 1 && state.selected.length >= 2,
      stabilize: state.rank >= 2 && !!preview?.canStabilize,
      purify: state.rank >= 4 && !!preview?.canPurify,
      concentrate: state.rank >= 4 && !!preview?.canConcentrate
    };
    document.querySelectorAll('.process').forEach(button => {
      const key = button.dataset.process;
      button.disabled = locked || !requirements[key];
      const active = key === state.process;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const reasons = {
      prepare: state.rank < 1 ? 'Requer patente Novato' :
        'Revela a preparação. Não consome matéria.',
      stabilize: state.rank < 2 ? 'Requer patente Aprendiz' :
        (preview?.stabilizeReason || 'Reduz uma virtude indesejada.'),
      purify: state.rank < 4 ? 'Requer patente Especialista' :
        (preview?.purifyReason || 'Remove uma virtude conhecida.'),
      concentrate: state.rank < 4 ? 'Requer patente Especialista' :
        (preview?.concentrateReason || 'Fortalece uma virtude com matéria extra.')
    };
    for (const key of Object.keys(reasons)) {
      document.querySelector('.process[data-process="' + key + '"] small').textContent = reasons[key];
    }
    $('qty-minus').disabled = locked;
    $('qty-plus').disabled = locked;
    $('qty-max').disabled = locked || !preview || preview.maxOperations < 1;
    const selectedOption = state.process === 'prepare' ||
      (state.process === 'stabilize' && !!state.stabilize) ||
      (state.process === 'purify' && !!state.remove) ||
      (state.process === 'concentrate' && !!state.target && !!state.reagent);
    const ready = !!preview?.canFinalize && !!preview?.token && selectedOption;
    $('craft-button').disabled = locked || !ready;
    $('craft-label').textContent = state.pending ? 'Aguardando resposta…' :
      (state.crafting ? 'Produção em andamento…' : 'Iniciar produção');
    renderProcessOptions();
  }
  function render() {
    renderIngredients();
    renderOrbit();
    renderEffects();
    renderSummary();
    renderControls();
    document.querySelector('.rank-name').textContent = ranks[state.rank];
    document.querySelector('.rank span:last-child').textContent =
      Number.isFinite(state.alchemy) ?
        'Alquimia ' + Math.floor(state.alchemy) : 'Alquimia —';
  }

  function stopProgress(message) {
    if (state.craftTimer) clearInterval(state.craftTimer);
    state.craftTimer = null;
    state.crafting = false;
    $('progress-wrap').hidden = true;
    $('progress-fill').style.width = '0%';
    if (message) notify(message);
    renderControls();
  }
  function startProgress() {
    if (!state.preview?.token || state.crafting) return;
    const token = state.preview.token;
    const stages = Array.isArray(state.preview.stages) ? state.preview.stages : [];
    const total = Math.max(0.1, Number(state.preview.craftSeconds) || 0.1);
    const started = performance.now();
    state.crafting = true;
    $('progress-wrap').hidden = false;
    renderControls();
    const tick = () => {
      const elapsed = Math.min(total, (performance.now() - started) / 1000);
      let cursor = 0;
      let current = stages[stages.length - 1]?.name || 'Preparando';
      for (const stage of stages) {
        cursor += Number(stage.seconds) || 0;
        if (elapsed <= cursor) { current = stage.name; break; }
      }
      $('progress-stage').textContent = current;
      $('progress-time').textContent = Math.ceil(total - elapsed) + ' s';
      $('progress-fill').style.width = (elapsed / total * 100) + '%';
      if (elapsed < total) return;
      clearInterval(state.craftTimer);
      state.craftTimer = null;
      state.crafting = false;
      $('progress-wrap').hidden = true;
      state.preview = null;
      send('finalize', { token });
    };
    tick();
    state.craftTimer = setInterval(tick, 100);
  }

  // Meridian forwards the real inventory, preview, and transaction results.
  window.GuildAlchemyReceive = raw => {
    let data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch (_) { return; }
    if (!data || data.protocol !== 1 || !validCount(data.revision)) return;
    if (data.kind === 'open') {
      if (typeof data.session !== 'string' || !Array.isArray(data.ingredients)) return;
      stopProgress();
      Object.assign(state, {
        session: data.session, revision: data.revision, connected: true,
        pending: null, selected: [], quantity: 1, process: null,
        preview: null, remove: null, stabilize: null, target: null, reagent: null,
        visibleLimit: 24
      });
    } else {
      if (data.session !== state.session ||
          (data.kind !== 'closed' && data.id !== state.pending) || data.revision < state.revision) return;
      state.pending = null;
      state.revision = data.revision;
    }
    if (Array.isArray(data.ingredients)) state.ingredients = data.ingredients;
    if (validCount(data.bottles)) state.bottles = data.bottles;
    if (validCount(data.rank) && data.rank <= 5) state.rank = data.rank;
    if (Number.isFinite(data.alchemy)) state.alchemy = data.alchemy;
    if (data.kind === 'preview' && data.preview) state.preview = data.preview;
    if (data.kind === 'crafted' || data.kind === 'error') state.preview = null;
    if (data.kind === 'closed') {
      stopProgress();
      state.connected = false;
      state.preview = null;
    }
    if (data.debug && typeof data.debug === 'object') {
      $('debug').hidden = false;
      $('debug-data').textContent = JSON.stringify(data.debug, null, 2);
    } else {
      $('debug').hidden = true;
      $('debug-data').textContent = '';
    }
    notify(data.message || 'Bancada pronta.', data.kind === 'error');
    render();
  };

  function setQuantity(value) {
    if (state.pending || state.crafting) return;
    state.quantity = Math.max(1, Math.min(100, Math.floor(Number(value) || 1)));
    if (state.preview) prepare();
    else render();
  }
  $('search').addEventListener('input', () => {
    state.visibleLimit = 24;
    $('ingredient-list').scrollTop = 0;
    renderIngredients();
  });
  $('ingredient-list').addEventListener('scroll', () => {
    const list = $('ingredient-list');
    if (list.scrollTop + list.clientHeight < list.scrollHeight - 200) return;
    if (state.visibleLimit >= state.ingredients.length) return;
    state.visibleLimit += 24;
    renderIngredients();
  }, { passive: true });
  document.querySelectorAll('.orbit-slot').forEach(button =>
    button.addEventListener('click', () => {
      const id = state.selected[Number(button.dataset.slot)];
      if (id) selectIngredient(id);
    }));
  document.querySelectorAll('.process').forEach(button =>
    button.addEventListener('click', () => {
      const selected = button.dataset.process;
      if (button.disabled) return;
      state.process = selected;
      state.remove = null;
      state.stabilize = null;
      state.target = null;
      state.reagent = null;
      notify(processNames[selected] + ' selecionado.');
      prepare();
    }));
  $('qty-minus').addEventListener('click', () => setQuantity(state.quantity - 1));
  $('qty-plus').addEventListener('click', () => setQuantity(state.quantity + 1));
  $('qty-max').addEventListener('click', () => setQuantity(state.preview?.maxOperations || 1));
  $('craft-button').addEventListener('click', startProgress);
  const requestClose = () => {
    if (!state.connected || state.pending) return;
    stopProgress();
    send('close');
  };
  $('close').addEventListener('click', requestClose);
  const escape = event => {
    if (event.key === 'Escape' || event.key === 'Esc' || event.code === 'Escape') {
      event.preventDefault();
      requestClose();
    }
  };
  document.addEventListener('keydown', escape, true);
  document.addEventListener('keyup', escape, true);
  render();
  // Bindings may arrive after the deferred script. Announce readiness only after
  // installing the state listener, so the first inventory message cannot be lost.
  let bridgeAttempts = 0;
  function connectMeridian() {
    const bridge = window.GuildAlchemyUI;
    if (bridge?.request && bridge?.ready && bridge?.addEventListener) {
      bridge.addEventListener('guildalchemy:state', window.GuildAlchemyReceive);
      bridge.ready();
      return;
    }
    if (++bridgeAttempts < 240) setTimeout(connectMeridian, 250);
    else notify('MeridianUI indisponível. Reabra a bancada após o carregamento.', true);
  }
  connectMeridian();
})();
