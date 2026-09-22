'use strict';
// UI only: all previews, inventory, costs and transaction tokens come from C++.
// No fallback recipe calculator or offline production is allowed here.
(() => {
  const $ = id => document.getElementById(id);
  const state = { session: '', revision: 0, rank: 0, ingredients: [], selected: [], quantity: 1,
    preview: null, remove: null, target: null, reagent: null, pending: null, sequence: 0, connected: false };
  const ranks = ['Sem patente', 'Novato', 'Aprendiz', 'Adepto', 'Especialista', 'Mestre'];
  const int = value => Number.isSafeInteger(value) && value >= 0;
  const node = (tag, text, className) => { const e = document.createElement(tag); e.textContent = text; if (className) e.className = className; return e; };
  const notify = (message, error = false) => { $('notice').textContent = message; $('notice').classList.toggle('error', error); };
  const name = effect => effect.known ? effect.name : '???';
  const recipe = () => ({ ingredients: state.selected, operations: state.quantity,
    removeEffect: state.remove, concentrateEffect: state.target, reagent: state.reagent });

  function send(action, payload = {}) {
    if (state.pending && action !== 'close') return;
    if (!window.GuildAlchemyRequest || !state.connected) {
      notify('Sem conexão com o plugin Guild Alchemy. Nenhum item foi consumido.', true); return;
    }
    const id = ++state.sequence;
    state.pending = id;
    renderControls();
    // Registered with PrismaUI::RegisterJSListener(view, "GuildAlchemyRequest", ...).
    try { window.GuildAlchemyRequest(JSON.stringify({ protocol: 1, id, action,
      session: state.session, revision: state.revision, payload })); }
    catch (_) { state.pending = null; state.connected = false; renderControls(); notify('Falha na conexão com a bancada.', true); }
  }
  function invalidate() { state.preview = null; state.remove = null; state.target = null; state.reagent = null; render(); }
  function prepare() { state.preview = null; send('prepare', recipe()); }
  function select(id) {
    if (state.pending) return;
    if (state.selected.includes(id)) state.selected = state.selected.filter(x => x !== id);
    else if (state.selected.length < 3) state.selected.push(id);
    else { notify('Selecione no máximo três ingredientes.'); return; }
    invalidate();
  }
  function renderInventory() {
    const list = $('ingredients'); list.replaceChildren();
    const search = $('search').value.toLocaleLowerCase('pt-BR');
    const items = state.ingredients.filter(x => x.name.toLocaleLowerCase('pt-BR').includes(search));
    for (const item of items) {
      const button = node('button', '', 'ingredient');
      button.disabled = !!state.pending || !state.connected;
      button.setAttribute('aria-pressed', String(state.selected.includes(item.id)));
      const label = node('span', item.name);
      label.append(node('small', (item.effects || []).map(name).join(' · ')));
      button.append(label, node('span', '×' + item.count, 'count'));
      button.addEventListener('click', () => select(item.id)); list.append(button);
    }
    if (!items.length) list.append(node('p', state.connected ? 'Nenhum ingrediente encontrado.' : 'Aguardando inventário do jogo.', 'empty'));
    $('selection-count').textContent = state.selected.length + ' / 3';
    const selected = $('recipe'); selected.replaceChildren();
    for (const id of state.selected) selected.append(node('span', state.ingredients.find(x => x.id === id)?.name || 'Ingrediente indisponível'));
    if (!state.selected.length) selected.append(node('span', 'Nenhum ingrediente selecionado'));
  }
  function option(select, value, label) { const e = node('option', label); e.value = value; select.append(e); }
  function renderPreview() {
    const preview = state.preview;
    $('effects').replaceChildren();
    if (!preview) $('effects').append(node('p', 'Prepare a combinação para examinar as virtudes em ressonância.', 'empty'));
    else for (const effect of preview.effects) {
      const card = node('div', '', 'effect' + (effect.removed ? ' removed' : ''));
      const heading = node('div', '', 'effect-head'); heading.append(node('span', name(effect)));
      if (effect.known) heading.append(node('span', effect.hostile ? 'Nociva' : 'Benéfica', 'kind'));
      card.append(heading);
      if (effect.known) {
        const details = [];
        if (effect.magnitude != null) details.push('Magnitude ' + Number(effect.magnitude).toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
        if (effect.duration != null) details.push('Duração ' + effect.duration + ' s');
        if (effect.concentrated) details.push('Concentrada');
        card.append(node('p', details.join(' · ')));
      } else card.append(node('p', 'Virtude ainda não descoberta.'));
      $('effects').append(card);
    }
    $('costs').replaceChildren();
    if (preview) for (const item of preview.costs) {
      const row = node('div', ''); row.append(node('span', item.name), node('span', item.required + ' / ' + item.available)); $('costs').append(row);
    } else $('costs').textContent = 'Prepare uma receita.';
    $('yield').textContent = preview ? preview.outputCount + (preview.outputCount === 1 ? ' unidade' : ' unidades') : '—';
    $('double-toil').textContent = preview?.doubleToil ? 'Double Toil and Trouble incluído uma vez na produção prevista.' : '';
    const known = (preview?.effects || []).filter(e => e.known);
    const remove = $('remove-effect'); remove.replaceChildren(); option(remove, '', 'Não remover');
    for (const e of known) option(remove, e.id, name(e)); remove.value = state.remove || '';
    const target = $('target-effect'); target.replaceChildren(); option(target, '', 'Não concentrar');
    for (const e of known.filter(e => !e.removed && e.canConcentrate)) option(target, e.id, name(e)); target.value = state.target || '';
    renderReagents();
  }
  function renderReagents() {
    const select = $('reagent'); select.replaceChildren(); option(select, '', 'Escolha o reagente');
    const effect = state.preview?.effects.find(e => e.id === state.target);
    for (const id of effect?.reagents || []) { const ingredient = state.ingredients.find(x => x.id === id); if (ingredient) option(select, id, ingredient.name); }
    select.value = state.reagent || '';
  }
  function renderControls() {
    const locked = !state.connected || !!state.pending;
    $('prepare').disabled = locked || state.rank < 1 || state.selected.length < 2;
    $('purify').disabled = locked || state.rank < 3 || !state.preview?.canPurify;
    $('concentrate').disabled = locked || state.rank < 4 || !state.preview?.canConcentrate;
    $('finalize').disabled = locked || !state.preview?.canFinalize || !state.preview?.token;
    $('finalize').textContent = state.pending ? 'Aguardando resposta…' : 'Finalizar produção';
    $('prepare-reason').textContent = state.rank < 1 ? 'Requer patente Novato' : 'Revela a preparação. Não consome matéria.';
    $('purify-reason').textContent = state.rank < 3 ? 'Requer patente Adepto' : (state.preview?.purifyReason || 'Remove uma virtude conhecida.');
    $('concentrate-reason').textContent = state.rank < 4 ? 'Requer patente Especialista' : (state.preview?.concentrateReason || 'Fortalece uma virtude com matéria extra.');
    for (const id of ['quantity', 'minus', 'plus', 'maximum', 'remove-effect', 'target-effect', 'reagent']) $(id).disabled = locked;
    $('maximum').disabled = locked || !state.preview || state.preview.maxOperations < 1;
    $('quantity').value = state.quantity;
    $('purify').setAttribute('aria-pressed', String(!!state.remove));
    $('concentrate').setAttribute('aria-pressed', String(!!state.target));
  }
  function render() { renderInventory(); renderPreview(); renderControls(); }

  // C++ calls this through Prisma InteropCall; unknown effects must already be redacted in C++.
  window.GuildAlchemyReceive = raw => {
    let data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (_) { return; }
    if (!data || data.protocol !== 1 || !int(data.revision)) return;
    if (data.kind === 'open') {
      if (typeof data.session !== 'string' || !Array.isArray(data.ingredients)) return;
      Object.assign(state, { session: data.session, revision: data.revision, connected: true,
        pending: null, selected: [], preview: null, quantity: 1, remove: null, target: null, reagent: null });
    } else {
      if (data.session !== state.session || data.id !== state.pending || data.revision < state.revision) return;
      state.pending = null; state.revision = data.revision;
    }
    if (Array.isArray(data.ingredients)) state.ingredients = data.ingredients;
    if (int(data.rank) && data.rank <= 5) state.rank = data.rank;
    $('rank').textContent = ranks[state.rank];
    if (Number.isFinite(data.alchemy)) $('skill').textContent = 'Alquimia ' + Math.floor(data.alchemy);
    if (data.kind === 'preview' && data.preview) state.preview = data.preview;
    if (data.kind === 'crafted' || data.kind === 'error') state.preview = null;
    if (data.kind === 'closed') { state.connected = false; state.preview = null; }
    if (data.debug && typeof data.debug === 'object') { $('debug').hidden = false; $('debug-data').textContent = JSON.stringify(data.debug, null, 2); }
    else { $('debug').hidden = true; $('debug-data').textContent = ''; }
    notify(data.message || 'Bancada pronta.', data.kind === 'error'); render();
  };
  function quantity(value) { if (state.pending) return; state.quantity = Math.max(1, Math.min(100, Math.floor(Number(value) || 1))); if (state.preview) prepare(); else renderControls(); }
  $('search').addEventListener('input', renderInventory);
  $('prepare').addEventListener('click', prepare);
  $('quantity').addEventListener('change', e => quantity(e.target.value));
  $('minus').addEventListener('click', () => quantity(state.quantity - 1));
  $('plus').addEventListener('click', () => quantity(state.quantity + 1));
  $('maximum').addEventListener('click', () => quantity(state.preview?.maxOperations || 1));
  $('purify').addEventListener('click', () => { $('purify-options').hidden = !$('purify-options').hidden; });
  $('concentrate').addEventListener('click', () => { $('concentrate-options').hidden = !$('concentrate-options').hidden; });
  $('remove-effect').addEventListener('change', e => { state.remove = e.target.value || null; if (state.remove === state.target) { state.target = null; state.reagent = null; } prepare(); });
  $('target-effect').addEventListener('change', e => { state.target = e.target.value || null; state.reagent = null; renderReagents(); if (!state.target) prepare(); else { state.preview.canFinalize = false; renderControls(); } });
  $('reagent').addEventListener('change', e => { state.reagent = e.target.value || null; if (state.target && state.reagent) prepare(); });
  $('finalize').addEventListener('click', () => { if (state.preview?.token) { const token = state.preview.token; state.preview = null; send('finalize', { token }); } });
  $('close').addEventListener('click', () => send('close'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); send('close'); } });
  render();
})();
