(function () {
  'use strict';

  const RANKS = ['Sem patente', 'Novato', 'Aprendiz', 'Adepto', 'Especialista', 'Mestre'];
  const RANK_ORDER = ['none', 'novice', 'apprentice', 'adept', 'specialist', 'master'];
  const RANK_MAX_TIER = [1, 1, 2, 3, 4, 5];
  const TIER_REQUIRED_RANK = ['', 'Novato', 'Aprendiz', 'Adepto', 'Especialista', 'Mestre'];

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  }

  function isEffectLockedByRank(effect, rankIdx) {
    return Boolean(effect && effect.known && Number.isFinite(effect.tier) && effect.tier > (RANK_MAX_TIER[rankIdx] || 1));
  }
  const PROCESS_NAMES = {
    prepare: 'Preparar',
    stabilize: 'Estabilizar',
    purify: 'Purificar',
    concentrate: 'Concentrar'
  };

  function rankToIndex(rank) {
    if (Number.isSafeInteger(rank) && rank >= 0 && rank <= 5) return rank;
    const norm = String(rank || 'none').toLowerCase();
    const alias = norm === 'expert' ? 'specialist' : norm;
    const idx = RANK_ORDER.indexOf(alias);
    return idx >= 0 ? idx : 0;
  }

  function validCount(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function isStandbyError(message) {
    const text = String(message || '');
    return /ACTION_UNAVAILABLE|indispon|n[aã]o est[aá] dispon[ií]vel|Aguardando sessão|não registrado|prazo|timeout|standby|disabled|nao habilitado|não habilitado/i.test(text);
  }

  const BASIC_ODDS_LABEL = {
    none: '75% próprio Tier · 10% Tier+1 · 15% falha',
    novice: '75% Tier 1 · 10% Tier 2 · 15% falha',
    apprentice: '78% até Tier 2 · 10% Tier 3 · 12% falha',
    adept: '81% até Tier 3 · 11% Tier 4 · 8% falha',
    specialist: '84% até Tier 4 · 12% Tier 5 · 4% falha',
    expert: '84% até Tier 4 · 12% Tier 5 · 4% falha',
    master: '98% qualquer Tier · 2% falha'
  };

  const ADV_ODDS_LABEL = {
    none: '100% no próprio Tier (sorteia até Tier 2) · 75% se restar só Tier 2',
    novice: '100% com Tier 1 disponível (pode esbarrar em Tier 2) · 75% só Tier 2',
    apprentice: '100% até Tier 2 (pode esbarrar em Tier 3) · 80% só Tier 3',
    adept: '100% até Tier 3 (pode esbarrar em Tier 4) · 85% só Tier 4',
    specialist: '100% até Tier 4 (pode esbarrar em Tier 5) · 90% só Tier 5',
    expert: '100% até Tier 4 (pode esbarrar em Tier 5) · 90% só Tier 5',
    master: '100% em todos os Tiers'
  };

  function makeDomHelpers(rootEl, dataAttr) {
    const $ = id => rootEl.querySelector('[' + dataAttr + '="' + id + '"]');
    const el = (tag, text, cls) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined && text !== null) n.textContent = String(text);
      return n;
    };
    return { $, el };
  }

  function closeWorkshopUi(context) {
    const closeBtn = document.getElementById('close-shell');
    if (closeBtn) {
      closeBtn.click();
      return;
    }
    if (typeof context.close === 'function') context.close();
    else if (window.AetheriusUI && typeof window.AetheriusUI.close === 'function') window.AetheriusUI.close();
    else window.history.back();
  }

  function mountResearchDesk(container, context, requestModuleId, assetBase) {
    let disposed = false;
    const isAborted = () => disposed || Boolean(context.signal && context.signal.aborted);
    const uiShell = document.getElementById('aetherius-shell');
    uiShell?.classList.add('is-alchemy-workspace');

    const shell = document.createElement('div');
    shell.className = 'ga-old-shell';
    shell.innerHTML = `
      <div class="world" aria-hidden="true"></div>
      <main class="workbench">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">✧</div>
            <div>
              <div class="eyebrow">AETHERIUS <span>•</span> GUILDA DOS ALQUIMISTAS</div>
              <h1>Mesa de Pesquisa Alquímica</h1>
              <p>Analise matérias com solventes e transcreva suas descobertas em manuscritos.</p>
            </div>
          </div>
          <div class="identity">
            <div class="rank"><span class="rank-name" data-rp="rank-name">Novato</span><span data-rp="alchemy-level">Alquimia 20</span></div>
            <button type="button" class="close" data-rp="close">Fechar <kbd>Esc</kbd></button>
          </div>
        </header>

        <div class="status-row">
          <span class="status-dot" aria-hidden="true"></span>
          <span data-rp="status">Conectando à mesa de pesquisa...</span>
          <div class="test-rank-bar" data-rp="test-bar" hidden>
            <span class="test-rank-label">Teste:</span>
            <button type="button" class="test-rank-btn" data-rp-rank="novice">Novato</button>
            <button type="button" class="test-rank-btn" data-rp-rank="apprentice">Aprendiz</button>
            <button type="button" class="test-rank-btn" data-rp-rank="adept">Adepto</button>
            <button type="button" class="test-rank-btn" data-rp-rank="specialist">Especialista</button>
            <button type="button" class="test-rank-btn" data-rp-rank="master">Mestre</button>
            <button type="button" class="test-rank-btn researcher-toggle" data-rp="toggle-researcher">Pesquisador</button>
          </div>
        </div>

        <div class="research-columns">
          <section class="panel">
            <div class="panel-heading"><span class="panel-number">01</span><h2>Laboratório de Análise</h2><span data-rp="solvent-stock" class="heading-detail"></span></div>
            <div class="research-tabs">
              <button type="button" class="research-tab" data-rp-tab="basic">
                <strong>Pesquisa Básica</strong>
                <small data-rp="tab-basic-sub">Solvente Básico: 0</small>
              </button>
              <button type="button" class="research-tab" data-rp-tab="advanced">
                <strong>Aparato Avançado</strong>
                <small data-rp="tab-adv-sub">Solvente Avançado: 0</small>
              </button>
            </div>
            <div class="research-odds-box" data-rp="odds-box"></div>
            <div class="research-job-box" data-rp="job-box" hidden>
              <div class="research-job-head">
                <strong data-rp="job-title">Analisando...</strong>
                <span data-rp="job-time">30 s</span>
              </div>
              <div class="progress-track"><div data-rp="job-fill" class="progress-fill" style="width:0%"></div></div>
              <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button type="button" class="research-action-btn" data-rp="collect-btn" hidden>Coletar resultado</button>
              </div>
            </div>
            <div class="research-search-row">
              <label class="search-wrap"><span aria-hidden="true">⌕</span><input data-rp="search" type="search" placeholder="Buscar ingrediente no inventário..." autocomplete="off"></label>
              <label class="research-filter-toggle"><input data-rp="hide-complete" type="checkbox"><span>Ocultar completos</span></label>
            </div>
            <div class="research-list" data-rp="ing-list"></div>
          </section>

          <section class="panel">
            <div class="panel-heading"><span class="panel-number">02</span><h2>Catálogo &amp; Manuscritos</h2><span data-rp="scribe-stock" class="heading-detail"></span></div>
            <p class="panel-subtitle">Ingredientes já identificados. Transcrever consome 5x Papel + 1x Carvão (apenas leitura).</p>
            <button type="button" class="research-action-btn" data-rp="transcribe-all" style="margin-bottom:8px;">Transcrever Compêndio Completo (5 Papel + 1 Carvão)</button>
            <div class="research-list" data-rp="discovered-list"></div>
            <div class="research-history-list" data-rp="history-list"></div>
          </section>
        </div>

        <footer class="footer"><span>❖ APARATO DE GHOSTSHELF KEEP</span><span>PESQUISA ALQUÍMICA</span></footer>
      </main>
    `;
    container.replaceChildren(shell);

    const { $, el } = makeDomHelpers(shell, 'data-rp');
    const state = {
      rank: 'novice',
      alchemy: 20,
      isResearcher: false,
      testRanksEnabled: false,
      mode: 'basic',
      basicSolvents: 0,
      advancedSolvents: 0,
      papers: 0,
      charcoals: 0,
      paperCost: 5,
      charcoalCost: 1,
      durationSeconds: 30,
      ingredients: [],
      discovered: [],
      activeJob: null,
      history: [],
      search: '',
      hideComplete: false,
      pending: false,
      collecting: false,
      timer: null,
      ingSeq: 0,
      discSeq: 0,
      statusMessage: 'Mesa de pesquisa pronta.',
      statusError: false
    };

    const send = (action, payload = {}) => context.request(requestModuleId, action, payload);

    async function fetchRemainingResearchIngredients(initialChunk, nextOffset) {
      let acc = Array.isArray(initialChunk) ? initialChunk.slice() : [];
      let offset = nextOffset;
      const seq = ++state.ingSeq;
      while (offset !== null && offset !== undefined && !isAborted() && seq === state.ingSeq) {
        const page = await send('researchIngredientsPage', { offset });
        if (isAborted() || seq !== state.ingSeq || !page || page.ok === false || !Array.isArray(page.ingredients)) return;
        acc = acc.concat(page.ingredients);
        state.ingredients = acc.slice();
        render();
        offset = page.ingredientsNextOffset;
      }
      if (!isAborted() && seq === state.ingSeq) {
        state.ingredients = acc;
        render();
      }
    }

    async function fetchRemainingResearchDiscovered(initialChunk, nextOffset) {
      let acc = Array.isArray(initialChunk) ? initialChunk.slice() : [];
      let offset = nextOffset;
      const seq = ++state.discSeq;
      while (offset !== null && offset !== undefined && !isAborted() && seq === state.discSeq) {
        const page = await send('researchDiscoveredPage', { offset });
        if (isAborted() || seq !== state.discSeq || !page || page.ok === false || !Array.isArray(page.discovered)) return;
        acc = acc.concat(page.discovered);
        state.discovered = acc.slice();
        render();
        offset = page.discoveredNextOffset;
      }
      if (!isAborted() && seq === state.discSeq) {
        state.discovered = acc;
        render();
      }
    }

    function applyData(res) {
      if (!res || typeof res !== 'object') return;
      if (res.rank !== undefined) state.rank = String(res.rank || 'novice').toLowerCase();
      if (Number.isFinite(res.alchemy)) state.alchemy = res.alchemy;
      if (typeof res.isResearcher === 'boolean') state.isResearcher = res.isResearcher;
      if (typeof res.testRanksEnabled === 'boolean') state.testRanksEnabled = res.testRanksEnabled;
      if (validCount(res.basicSolvents)) state.basicSolvents = res.basicSolvents;
      if (validCount(res.advancedSolvents)) state.advancedSolvents = res.advancedSolvents;
      if (validCount(res.papers)) state.papers = res.papers;
      if (validCount(res.charcoals)) state.charcoals = res.charcoals;
      if (validCount(res.paperCost)) state.paperCost = res.paperCost;
      if (validCount(res.charcoalCost)) state.charcoalCost = res.charcoalCost;
      if (Number.isFinite(res.durationSeconds)) state.durationSeconds = res.durationSeconds;
      if (Array.isArray(res.ingredients)) {
        state.ingredients = res.ingredients;
        if (res.ingredientsNextOffset !== null && res.ingredientsNextOffset !== undefined) {
          void fetchRemainingResearchIngredients(res.ingredients, res.ingredientsNextOffset);
        }
      }
      if (Array.isArray(res.discovered)) {
        state.discovered = res.discovered;
        if (res.discoveredNextOffset !== null && res.discoveredNextOffset !== undefined) {
          void fetchRemainingResearchDiscovered(res.discovered, res.discoveredNextOffset);
        }
      }
      if (Array.isArray(res.history)) state.history = res.history;
      state.activeJob = res.activeJob || null;
      if (res.message) {
        state.statusMessage = res.message;
        state.statusError = res.ok === false || (res.collected && res.collected.outcome !== 'revealed');
      }
      if (!state.isResearcher && state.mode === 'advanced') state.mode = 'basic';
    }

    function updateProgressTick() {
      const box = $('job-box');
      if (!box) return;
      if (!state.activeJob) {
        box.hidden = true;
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        return;
      }
      box.hidden = false;
      const now = Date.now();
      const totalMs = Math.max(1000, Number(state.activeJob.endsAt) - Number(state.activeJob.startedAt));
      const elapsedMs = Math.max(0, Math.min(totalMs, now - Number(state.activeJob.startedAt)));
      const remainingSec = Math.max(0, Math.ceil((Number(state.activeJob.endsAt) - now) / 1000));
      const pct = Math.min(100, (elapsedMs / totalMs) * 100);
      const modeLabel = state.activeJob.mode === 'advanced' ? 'Aparato Avançado' : 'Pesquisa Básica';
      $('job-title').textContent = modeLabel + ': ' + state.activeJob.ingredientName;
      $('job-fill').style.width = pct + '%';
      const collectBtn = $('collect-btn');
      if (remainingSec <= 0) {
        $('job-time').textContent = 'Pronto!';
        collectBtn.hidden = false;
        collectBtn.disabled = state.collecting;
        if (!state.collecting && !state.pending) {
          void collectJob();
        }
      } else {
        $('job-time').textContent = remainingSec + ' s';
        collectBtn.hidden = true;
      }
    }

    function ensureTimer() {
      if (state.activeJob && !state.timer) {
        state.timer = setInterval(() => {
          if (isAborted()) { clearInterval(state.timer); state.timer = null; return; }
          updateProgressTick();
        }, 250);
      } else if (!state.activeJob && state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
      updateProgressTick();
    }

    function render() {
      if (isAborted()) return;
      const rankIdx = rankToIndex(state.rank);
      $('rank-name').textContent = (RANKS[rankIdx] || RANKS[1]) + (state.isResearcher ? ' • Pesquisador' : '');
      $('alchemy-level').textContent = 'Alquimia ' + Math.floor(state.alchemy || 20);
      const statusEl = $('status');
      statusEl.textContent = state.statusMessage;
      statusEl.className = state.statusError ? 'status-error' : '';

      const testBar = $('test-bar');
      if (testBar) {
        testBar.hidden = !state.testRanksEnabled;
        if (state.testRanksEnabled) {
          testBar.querySelectorAll('[data-rp-rank]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.rpRank === (RANK_ORDER[rankIdx] || 'novice'));
            btn.disabled = state.pending;
          });
          const resBtn = $('toggle-researcher');
          if (resBtn) {
            resBtn.classList.toggle('active', state.isResearcher);
            resBtn.disabled = state.pending;
          }
        }
      }

      $('solvent-stock').textContent = 'Tempo: ' + state.durationSeconds + 's';
      $('scribe-stock').textContent = 'Papel ' + state.papers + '/' + state.paperCost + ' · Carvão ' + state.charcoals + '/' + state.charcoalCost;

      const basicTab = shell.querySelector('[data-rp-tab="basic"]');
      const advTab = shell.querySelector('[data-rp-tab="advanced"]');
      basicTab.classList.toggle('active', state.mode === 'basic');
      advTab.classList.toggle('active', state.mode === 'advanced');
      advTab.classList.toggle('locked', !state.isResearcher);
      $('tab-basic-sub').textContent = 'Solvente Básico: ' + state.basicSolvents;
      $('tab-adv-sub').textContent = state.isResearcher
        ? ('Solvente Avançado: ' + state.advancedSolvents)
        : 'Exclusivo do cargo Pesquisador';

      const oddsBox = $('odds-box');
      oddsBox.replaceChildren();
      if (state.mode === 'advanced') {
        const line1 = el('div');
        line1.innerHTML = '<b>Aparato Avançado:</b> ' + (ADV_ODDS_LABEL[state.rank] || ADV_ODDS_LABEL.novice);
        const line2 = el('div', 'Usa 1x amostra + 1x Solvente Avançado. Pode esbarrar aleatoriamente em 1 Tier acima.');
        oddsBox.append(line1, line2);
      } else {
        const line1 = el('div');
        line1.innerHTML = '<b>Pesquisa Básica:</b> ' + (BASIC_ODDS_LABEL[state.rank] || BASIC_ODDS_LABEL.novice);
        const line2 = el('div', 'Usa 1x amostra + 1x Solvente Básico. Efeitos de 2+ Tiers acima falham por incompreensão.');
        oddsBox.append(line1, line2);
      }

      ensureTimer();

      // Lista de ingredientes do inventario
      const ingList = $('ing-list');
      ingList.replaceChildren();
      const needle = normalizeSearchText(state.search.trim());
      const filtered = state.ingredients.filter(i => {
        if (state.hideComplete && !(i.effects || []).some(e => !e.known)) return false;
        if (!needle) return true;
        return normalizeSearchText(i.name).includes(needle) ||
          (i.effects || []).some(e => e.known && normalizeSearchText(e.name).includes(needle));
      });
      const hasSolvent = state.mode === 'advanced' ? state.advancedSolvents > 0 : state.basicSolvents > 0;
      const modeAllowed = state.mode === 'basic' || state.isResearcher;

      for (const item of filtered) {
        const card = el('div', '', 'research-row-card');
        const top = el('div', '', 'research-row-top');
        const title = el('b', item.name + ' (×' + item.count + ')');
        const hasUnknown = (item.effects || []).some(e => !e.known);
        const incomprehensibleOnly = Boolean(item.incomprehensibleOnly) && hasUnknown;
        const btnLabel = !hasUnknown ? 'Completo' : (incomprehensibleOnly ? 'Acima da patente' : 'Analisar');
        const btn = el('button', btnLabel, 'research-action-btn' + (incomprehensibleOnly ? ' is-locked-rank' : ''));
        btn.type = 'button';
        if (incomprehensibleOnly) {
          btn.title = 'Todos os efeitos ocultos restantes exigem patente maior para pesquisar.';
        }
        btn.disabled = state.pending || Boolean(state.activeJob) || !modeAllowed || !hasSolvent || !hasUnknown || incomprehensibleOnly;
        btn.addEventListener('click', () => void startResearch(item.definitionId));
        top.append(title, btn);

        const tags = el('div', '', 'effect-tags');
        for (const eff of item.effects || []) {
          const t = el('span', eff.known ? eff.name : '????', eff.known ? 'known' : 'unknown');
          tags.append(t);
        }
        if (incomprehensibleOnly) {
          tags.append(el('span', 'Efeitos restantes: Tier superior', 'incomprehensible-tag'));
        }
        card.append(top, tags);
        ingList.append(card);
      }
      if (!filtered.length) {
        ingList.append(el('div', state.hideComplete ? 'Nenhum ingrediente incompleto encontrado.' : 'Nenhum ingrediente disponível no inventário.', 'no-results'));
      }

      // Catalogo descoberto & Transcricao
      const discList = $('discovered-list');
      discList.replaceChildren();
      const canPayScribe = state.papers >= state.paperCost && state.charcoals >= state.charcoalCost;
      const transcribeAllBtn = $('transcribe-all');
      if (transcribeAllBtn) {
        transcribeAllBtn.disabled = state.pending || !canPayScribe || !state.discovered.length;
      }
      for (const item of state.discovered) {
        const card = el('div', '', 'research-row-card');
        const top = el('div', '', 'research-row-top');
        const title = el('b', item.name);
        const btn = el('button', 'Transcrever', 'research-action-btn');
        btn.type = 'button';
        btn.title = 'Custa ' + state.paperCost + 'x Papel e ' + state.charcoalCost + 'x Carvão';
        btn.disabled = state.pending || !canPayScribe;
        btn.addEventListener('click', () => void transcribe(item.definitionId));
        top.append(title, btn);

        const tags = el('div', '', 'effect-tags');
        for (const eff of item.effects || []) {
          tags.append(el('span', eff.known ? eff.name : '????', eff.known ? 'known' : 'unknown'));
        }
        card.append(top, tags);
        discList.append(card);
      }
      if (!state.discovered.length) {
        discList.append(el('div', 'Nenhum efeito catalogado ainda. Realize uma análise ao lado.', 'no-results'));
      }

      // Historico recente
      const histList = $('history-list');
      histList.replaceChildren();
      for (const h of state.history || []) {
        const row = el('div', '[' + (h.mode === 'advanced' ? 'Avançado' : 'Básico') + '] ' + h.ingredientName + ': ' + h.message,
          'research-history-item' + (h.outcome === 'revealed' ? '' : ' is-fail'));
        histList.append(row);
      }
    }

    async function load() {
      if (isAborted()) return;
      state.pending = true;
      render();
      try {
        const res = await send('researchSnapshot', {});
        if (!isAborted()) applyData(res);
      } catch (err) {
        if (!isAborted()) { state.statusMessage = err?.message || 'Erro ao carregar pesquisa.'; state.statusError = true; }
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    async function startResearch(ingredientDefId) {
      if (isAborted() || state.pending || state.activeJob) return;
      state.pending = true;
      let closed = false;
      render();
      try {
        const res = await send('researchStart', { mode: state.mode, ingredientDefId });
        if (!isAborted() && res && res.ok && res.closeUi) {
          closed = true;
          closeWorkshopUi(context);
          return;
        }
        if (!isAborted()) applyData(res);
      } catch (err) {
        if (!isAborted()) { state.statusMessage = err?.message || 'Falha ao iniciar análise.'; state.statusError = true; }
      } finally {
        state.pending = false;
        if (!closed && !isAborted()) render();
      }
    }

    async function collectJob() {
      if (isAborted() || state.collecting || !state.activeJob) return;
      state.collecting = true;
      try {
        const res = await send('researchCollect', {});
        if (!isAborted()) applyData(res);
      } catch (err) {
        if (!isAborted()) { state.statusMessage = err?.message || 'Falha ao coletar resultado.'; state.statusError = true; }
      } finally {
        state.collecting = false;
        if (!isAborted()) render();
      }
    }

    async function transcribe(ingredientDefId) {
      if (isAborted() || state.pending) return;
      state.pending = true;
      render();
      try {
        const res = await send('researchTranscribe', { ingredientDefId });
        if (!isAborted()) applyData(res);
      } catch (err) {
        if (!isAborted()) { state.statusMessage = err?.message || 'Falha ao transcrever manuscrito.'; state.statusError = true; }
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    async function transcribeAll() {
      if (isAborted() || state.pending || !state.discovered.length) return;
      state.pending = true;
      render();
      try {
        const res = await send('researchTranscribe', { scope: 'compendium' });
        if (!isAborted()) applyData(res);
      } catch (err) {
        if (!isAborted()) { state.statusMessage = err?.message || 'Falha ao transcrever compêndio.'; state.statusError = true; }
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    shell.querySelector('[data-rp-tab="basic"]').addEventListener('click', () => { state.mode = 'basic'; render(); });
    shell.querySelector('[data-rp-tab="advanced"]').addEventListener('click', () => {
      if (!state.isResearcher) {
        state.statusMessage = 'Aparato Avançado exclusivo do cargo Pesquisador (ative o botão Pesquisador para testar).';
        state.statusError = true;
        render();
        return;
      }
      state.mode = 'advanced';
      render();
    });
    $('search').addEventListener('input', e => { state.search = e.target.value || ''; render(); });
    $('hide-complete')?.addEventListener('change', e => { state.hideComplete = Boolean(e.target.checked); render(); });
    $('collect-btn').addEventListener('click', () => void collectJob());
    $('transcribe-all')?.addEventListener('click', () => void transcribeAll());
    $('close').addEventListener('click', () => closeWorkshopUi(context));
    shell.querySelectorAll('[data-rp-rank]').forEach(btn => btn.addEventListener('click', async () => {
      if (state.pending) return;
      state.pending = true;
      render();
      try {
        await send('setTestRank', { rank: btn.dataset.rpRank });
        const snap = await send('researchSnapshot', {});
        if (!isAborted()) applyData(snap);
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }));
    $('toggle-researcher')?.addEventListener('click', async () => {
      if (state.pending) return;
      state.pending = true;
      render();
      try {
        const res = await send('setTestResearcher', { enabled: !state.isResearcher });
        if (!isAborted() && res && res.ok) {
          state.isResearcher = Boolean(res.isResearcher);
          if (state.isResearcher) state.mode = 'advanced';
          else if (state.mode === 'advanced') state.mode = 'basic';
          state.statusMessage = state.isResearcher ? 'Cargo de teste ativado: Pesquisador (Aparato Avançado liberado).' : 'Cargo Pesquisador desativado.';
          state.statusError = false;
        }
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    });

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      if (state.timer) clearInterval(state.timer);
      uiShell?.classList.remove('is-alchemy-workspace');
      container.replaceChildren();
    };
    context.signal?.addEventListener('abort', cleanup, { once: true });
    void load();
    return cleanup;
  }

  function mountAlchemyWorkshop(container, context, options = {}) {
    if (!container || !context || typeof context.request !== 'function') {
      throw new Error('Contexto AetheriusUI inválido para o módulo de Alquimia.');
    }

    const runtimeConfig = window.AetheriusAlchemyWorkshopConfig || {};
    const requestModuleId = options.requestModuleId || runtimeConfig.requestModuleId || 'alchemy';
    const activeView = options.view || window.__aetheriusAlchemyPendingView || 'craft';
    window.__aetheriusAlchemyPendingView = '';
    const portableMode = Boolean(options.portable || window.__aetheriusAlchemyPortable);
    window.__aetheriusAlchemyPortable = false;
    const actionMap = options.actionMap || runtimeConfig.actionMap || null;
    const assetBase = options.assetBase || 'modules/professions/alchemy/assets';
    if (activeView === 'research') return mountResearchDesk(container, context, requestModuleId, assetBase);
    let disposed = false;

    const isAborted = () => disposed || Boolean(context.signal && context.signal.aborted);

    const uiShell = document.getElementById('aetherius-shell');
    uiShell?.classList.add('is-alchemy-workspace');

    const shell = document.createElement('div');
    shell.className = 'ga-old-shell';
    shell.innerHTML = `
      <div class="world" aria-hidden="true"></div>
      <main class="workbench" data-ga="workbench">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true">✧</div>
            <div>
              <div class="eyebrow">AETHERIUS <span>•</span> GUILDA DOS ALQUIMISTAS</div>
              <h1>O ofício da transformação</h1>
              <p>Escolha a matéria. Revele suas virtudes. Refine o resultado.</p>
            </div>
          </div>
          <div class="identity">
            <div class="rank"><span class="rank-name" data-ga="rank-name">Sem patente</span><span data-ga="alchemy-level">Alquimia —</span></div>
            <button type="button" class="close" data-ga="close">Fechar <kbd>Esc</kbd></button>
          </div>
        </header>

        <div class="status-row" data-ga="status-row">
          <span class="status-dot" aria-hidden="true"></span>
          <span data-ga="status">Conectando à bancada de alquimia...</span>
          <span class="portable-badge" data-ga="portable-badge" hidden>KIT PORTÁTIL · −20% potência · +50% tempo · Máx. 2</span>
          <div class="test-rank-bar" data-ga="test-rank-bar" hidden>
            <span class="test-rank-label">Teste:</span>
            <button type="button" class="test-rank-btn" data-test-rank="novice">Novato</button>
            <button type="button" class="test-rank-btn" data-test-rank="apprentice">Aprendiz</button>
            <button type="button" class="test-rank-btn" data-test-rank="adept">Adepto</button>
            <button type="button" class="test-rank-btn" data-test-rank="specialist">Especialista</button>
            <button type="button" class="test-rank-btn" data-test-rank="master">Mestre</button>
          </div>
        </div>

        <div class="columns">
          <section class="panel matter">
            <div class="panel-heading"><span class="panel-number">01</span><h2>Matéria</h2><span data-ga="selection-count" class="heading-detail">0 / 3</span></div>
            <p class="panel-subtitle">Escolha os ingredientes para a sua mistura.</p>
            <label class="search-wrap"><span aria-hidden="true">⌕</span><input data-ga="search" type="search" placeholder="Buscar ingrediente ou efeito conhecido..." autocomplete="off" aria-label="Buscar ingrediente ou efeito conhecido"></label>
            <div class="list-note"><span>Selecione dois ou três ingredientes diferentes</span><span data-ga="ingredient-count"></span></div>
            <div data-ga="ingredient-list" class="ingredient-list" aria-label="Ingredientes disponíveis"></div>
            <div class="matter-footer">
              <div class="small-stats"><span>Efeitos conhecidos <strong data-ga="known-count">0</strong></span><span>Garrafas <strong data-ga="bottle-count">0</strong></span><span>Cristalizados <strong data-ga="crystallized-count">0</strong></span><span>Borras <strong data-ga="dregs-count">0</strong></span></div>
              <div class="lore-art" aria-hidden="true"><img class="alchemy-illustration" src="${assetBase}/alchemy-footer.svg" alt=""></div>
              <blockquote>“Na natureza, tudo é matéria.<br>No conhecimento, tudo é possibilidade.”<cite>— Guilda dos Alquimistas</cite></blockquote>
            </div>
          </section>

          <section class="panel resonance">
            <div class="panel-heading"><span class="panel-number">02</span><h2>Ressonância</h2><span data-ga="resonance-phase" class="heading-detail">PREPARAÇÃO</span></div>
            <p class="panel-subtitle">Efeitos revelados na combinação selecionada.</p>
            <div class="alchemy-orbit" aria-label="Ingredientes selecionados">
              <div class="orbit-line orbit-line-a"></div><div class="orbit-line orbit-line-b"></div>
              <div class="orbit-ring ring-outer"></div><div class="orbit-ring ring-mid"></div><div class="orbit-ring ring-inner"></div>
              <div class="orbit-core"><img src="${assetBase}/icons/alchemy-star.svg" alt=""></div>
              <button type="button" class="orbit-slot slot-one" data-slot="0" title="Primeiro ingrediente"><span><img src="${assetBase}/icons/herb.svg" alt=""></span><small>Primeiro ingrediente</small></button>
              <button type="button" class="orbit-slot slot-two" data-slot="1" title="Segundo ingrediente"><span><img src="${assetBase}/icons/flask.svg" alt=""></span><small>Segundo ingrediente</small></button>
              <button type="button" class="orbit-slot slot-three" data-slot="2" title="Terceiro ingrediente"><span><img src="${assetBase}/icons/mortar.svg" alt=""></span><small>Terceiro ingrediente</small></button>
            </div>
            <div data-ga="effects" class="effects" aria-live="polite"><div class="empty-state">Selecione dois ingredientes para revelar suas virtudes em ressonância.</div></div>
            <div data-ga="predicted" class="predicted" hidden>
              <div class="section-label">RESULTADO PREVISTO</div>
              <div class="result-name" data-ga="result-name"></div>
              <div class="result-type" data-ga="result-type"></div>
            </div>
            <div class="resonance-bottom">
              <div class="quantity-line"><div><h3>Operações de produção</h3><p>Ingredientes consumidos por operação.</p></div><div class="stepper"><button type="button" data-ga="qty-minus" aria-label="Diminuir operações">−</button><output data-ga="quantity">1</output><button type="button" data-ga="qty-plus" aria-label="Aumentar operações">+</button><button type="button" data-ga="qty-max">Máx.</button></div></div>
              <div class="yield-line"><span>Produção prevista</span><strong data-ga="yield">—</strong></div>
              <p data-ga="yield-note" class="yield-note">Selecione uma combinação válida.</p>
            </div>
          </section>

          <section class="panel craft">
            <div class="panel-heading"><span class="panel-number">03</span><h2>Ofício</h2><span class="heading-detail">PROCESSO</span></div>
            <p class="panel-subtitle">Aplique o processo alquímico à receita.</p>
            <div class="processes" role="group" aria-label="Processo alquímico">
              <button type="button" class="process active" data-process="prepare"><span class="process-icon"><img src="${assetBase}/icons/mortar.svg" alt=""></span><span><strong>Preparar</strong><small>Combine os ingredientes e revele o resultado.</small></span><span class="check">✓</span></button>
              <button type="button" class="process" data-process="stabilize"><span class="process-icon"><img src="${assetBase}/icons/herb.svg" alt=""></span><span><strong>Estabilizar</strong><small>Reduza a virtude indesejada.</small></span><span class="check">✓</span></button>
              <button type="button" class="process" data-process="purify"><span class="process-icon"><img src="${assetBase}/icons/drop.svg" alt=""></span><span><strong>Purificar</strong><small>Remova uma virtude secundária.</small></span><span class="check">✓</span></button>
              <button type="button" class="process" data-process="concentrate"><span class="process-icon"><img src="${assetBase}/icons/flask.svg" alt=""></span><span><strong>Concentrar</strong><small>Fortaleça uma virtude com matéria extra.</small></span><span class="check">✓</span></button>
            </div>
            <div data-ga="process-options" class="process-options"></div>
            <div class="craft-modifiers" data-ga="craft-modifiers">
              <div class="modifier-row">
                <span class="modifier-label">Frasco</span>
                <div class="bottle-switch" role="group" aria-label="Tipo de frasco">
                  <button type="button" class="bottle-opt active" data-bottle="normal">Comum (<b data-ga="normal-bottle-chip">0</b>)</button>
                  <button type="button" class="bottle-opt" data-bottle="crystallized" title="Consome Frasco Cristalizado e concede +20% de duração">Cristalizado +20% (<b data-ga="crystal-bottle-chip">0</b>)</button>
                </div>
              </div>
              <label class="sign-toggle" data-ga="sign-wrap">
                <input type="checkbox" data-ga="sign-potion">
                <span>Assinar poção <small data-ga="signer-hint"></small></span>
              </label>
            </div>
            <div class="recipe-summary">
              <div class="summary-heading"><h3>Resumo da receita</h3><span data-ga="summary-kind">AGUARDANDO</span></div>
              <div data-ga="summary-lines" class="summary-lines"><p>Selecione ingredientes para preparar uma receita.</p></div>
            </div>
            <div class="aux-craft" data-ga="aux-craft">
              <div class="aux-heading"><h3>Ofício Auxiliar</h3><span data-ga="aux-status">RECICLAGEM &amp; FRASCOS</span></div>
              <div class="aux-list" data-ga="aux-list"></div>
            </div>
            <div class="craft-bottom">
              <button type="button" data-ga="craft-button" class="craft-button" disabled><span class="button-glyph"><img src="${assetBase}/icons/flask.svg" alt=""></span> <span data-ga="craft-label">Iniciar produção</span></button>
              <div data-ga="progress-wrap" class="progress-wrap" hidden><div class="progress-label"><span data-ga="progress-stage">Produzindo...</span><strong data-ga="progress-time">0 s</strong></div><div class="progress-track"><div data-ga="progress-fill"></div></div></div>
              <p class="craft-disclaimer">Ingredientes consumidos ao finalizar a produção.</p>
            </div>
          </section>
        </div>
        <footer class="footer"><span>✧&nbsp; A NATUREZA OFERECE. NÓS REVELAMOS. &nbsp;✧</span><span>BANCADA DE ALQUIMIA DA GUILDA</span></footer>
      </main>
    `;

    container.replaceChildren(shell);

    const $ = key => shell.querySelector(`[data-ga="${key}"]`);
    const node = (tag, text, className) => {
      const element = document.createElement(tag);
      if (text !== undefined && text !== null) element.textContent = String(text);
      if (className) element.className = className;
      return element;
    };

    const state = {
      revision: 0,
      rank: 0,
      alchemy: null,
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
      pending: false,
      connected: false,
      crafting: false,
      craftTimer: null,
      visibleLimit: 24,
      testRanksEnabled: false,
      ingredientsSeq: 0,
      portable: portableMode,
      bottleType: 'normal',
      signPotion: false,
      crystallizedBottles: 0,
      dregsCount: 0,
      auxiliaryRecipes: [],
      characterName: '',
      canSignPotion: false
    };

    const effectName = effect => (effect.known ? effect.name : '????');
    const lock = () => !state.connected || state.pending || state.crafting;
    const notify = (message, error = false) => {
      const statusEl = $('status');
      const rowEl = $('status-row');
      if (statusEl) statusEl.textContent = String(message || '');
      if (rowEl) rowEl.classList.toggle('error', Boolean(error));
    };

    function mapAction(action) {
      if (actionMap && typeof actionMap[action] === 'string') return actionMap[action];
      return action;
    }

    async function sendIntent(action, payload = {}) {
      const mapped = mapAction(action);
      const body = runtimeConfig.testKit
        ? Object.assign({ profession: 'alchemist' }, payload || {})
        : (payload || {});
      return context.request(requestModuleId, mapped, body);
    }

    function normalizeIngredients(rawList) {
      if (!Array.isArray(rawList)) return [];
      return rawList.map(item => ({
        ...item,
        id: item.definitionId || item.id
      }));
    }

    function normalizePreview(rawPreview) {
      if (!rawPreview) return null;
      return {
        ...rawPreview,
        effects: Array.isArray(rawPreview.effects)
          ? rawPreview.effects.map(eff => ({
              ...eff,
              id: eff.effectId || eff.id
            }))
          : []
      };
    }

    function applyServerPayload(res) {
      if (!res || typeof res !== 'object') return;
      if (validCount(res.revision)) state.revision = res.revision;
      if (res.rank !== undefined) state.rank = rankToIndex(res.rank);
      if (Number.isFinite(res.alchemy)) state.alchemy = res.alchemy;
      if (typeof res.testRanksEnabled === 'boolean') state.testRanksEnabled = res.testRanksEnabled;
      if (validCount(res.bottles)) state.bottles = res.bottles;
      if (validCount(res.crystallizedBottles)) state.crystallizedBottles = res.crystallizedBottles;
      if (validCount(res.dregsCount)) state.dregsCount = res.dregsCount;
      if (Array.isArray(res.auxiliaryRecipes)) state.auxiliaryRecipes = res.auxiliaryRecipes;
      if (typeof res.characterName === 'string') state.characterName = res.characterName;
      if (typeof res.canSignPotion === 'boolean') state.canSignPotion = res.canSignPotion;
      if (typeof res.portable === 'boolean') state.portable = res.portable;
      if (state.portable || (state.bottleType === 'crystallized' && state.crystallizedBottles < 1)) {
        state.bottleType = 'normal';
      }
      if (state.portable && state.quantity > 2) state.quantity = 2;
      if (Array.isArray(res.ingredients)) {
        const hasMorePages = res.ingredientsNextOffset !== null && res.ingredientsNextOffset !== undefined;
        const firstPage = normalizeIngredients(res.ingredients);
        if (!hasMorePages) {
          state.ingredients = firstPage;
          const ownedIds = new Set(state.ingredients.map(i => i.id));
          state.selected = state.selected.filter(id => ownedIds.has(id));
        } else {
          if (state.ingredients.length === 0) {
            state.ingredients = firstPage;
          }
          void fetchRemainingIngredients(firstPage, res.ingredientsNextOffset);
        }
      }
    }

    async function fetchRemainingIngredients(initialChunk, nextOffset) {
      let accumulated = Array.isArray(initialChunk) ? initialChunk.slice() : [];
      let offset = nextOffset;
      const seq = ++state.ingredientsSeq;
      while (offset !== null && offset !== undefined && !isAborted() && seq === state.ingredientsSeq) {
        const page = await sendIntent('ingredientsPage', { offset });
        if (isAborted() || seq !== state.ingredientsSeq || !page || page.ok === false || !Array.isArray(page.ingredients)) return;
        accumulated = accumulated.concat(normalizeIngredients(page.ingredients));
        if (state.ingredients.length < accumulated.length) {
          state.ingredients = accumulated.slice();
          renderIngredients();
        }
        offset = page.ingredientsNextOffset;
      }
      if (!isAborted() && seq === state.ingredientsSeq) {
        state.ingredients = accumulated;
        const ownedIds = new Set(state.ingredients.map(i => i.id));
        state.selected = state.selected.filter(id => ownedIds.has(id));
        render();
      }
    }

    async function switchTestRank(rankKey) {
      if (isAborted() || state.pending || state.crafting) return;
      state.pending = true;
      renderControls();
      try {
        const res = await sendIntent('setTestRank', { rank: rankKey });
        if (isAborted()) return;
        if (!res || res.ok === false) {
          notify(res?.message || 'Não foi possível alterar a patente de teste.', true);
          return;
        }
        applyServerPayload(res);
        state.preview = null;
        state.process = null;
        state.pending = false;
        await loadSnapshot();
        notify('Patente de teste alterada para ' + (RANKS[state.rank] || rankKey) + ' (Alquimia ' + Math.floor(state.alchemy || 0) + ').', false);
      } catch (err) {
        if (!isAborted()) notify(err?.message || 'Falha ao alterar patente de teste.', true);
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    async function loadSnapshot() {
      if (isAborted() || state.pending) return;
      state.pending = true;
      renderControls();
      try {
        const res = await sendIntent('snapshot', { portable: state.portable });
        if (isAborted()) return;
        if (!res || res.ok === false) {
          state.connected = false;
          notify(
            isStandbyError(res?.code || res?.message)
              ? (res?.reason || res?.message || 'Sistema de Alquimia em espera no servidor.')
              : (res?.message || 'Não foi possível carregar a bancada.'),
            true
          );
        } else {
          state.connected = true;
          applyServerPayload(res);
          notify(res.message || 'Bancada pronta. Selecione dois ou três ingredientes.', false);
        }
      } catch (err) {
        if (isAborted()) return;
        state.connected = false;
        notify(err?.message || 'Falha de comunicação com o servidor.', true);
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    async function prepare() {
      if (isAborted() || state.pending || state.crafting || state.selected.length < 2) return;
      state.preview = null;
      state.pending = true;
      notify('Consultando receita no servidor...', false);
      render();
      try {
        const res = await sendIntent('prepare', {
          ingredients: state.selected,
          operations: state.quantity,
          removeEffect: state.remove,
          stabilizeEffect: state.stabilize,
          concentrateEffect: state.target,
          reagent: state.reagent,
          bottleType: state.portable ? 'normal' : state.bottleType,
          signPotion: Boolean(state.signPotion),
          portable: Boolean(state.portable)
        });
        if (isAborted()) return;
        if (!res || res.ok === false) {
          state.preview = null;
          notify(res?.message || 'Não foi possível preparar esta combinação.', true);
        } else {
          applyServerPayload(res);
          state.preview = normalizePreview(res.preview);
          notify(res.message || 'Preparação validada. Nenhum item consumido.', false);
        }
      } catch (err) {
        if (isAborted()) return;
        state.preview = null;
        notify(err?.message || 'Falha ao preparar combinação.', true);
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    async function finalizeCraft(token) {
      if (isAborted() || !token) return;
      state.pending = true;
      notify('Confirmando produção no servidor...', false);
      renderControls();
      try {
        const res = await sendIntent('craft', { token });
        if (isAborted()) return;
        if (!res || res.ok === false) {
          state.preview = null;
          notify(res?.message || 'Produção recusada pelo servidor.', true);
        } else {
          applyServerPayload(res);
          state.preview = null;
          notify(res.message || 'Produção concluída.', Boolean(res.crafted?.failed));
          context.toast?.(res.message || 'Produção concluída.');
        }
      } catch (err) {
        if (isAborted()) return;
        state.preview = null;
        notify(err?.message || 'Tempo esgotado na confirmação.', true);
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
    }

    async function craftAuxiliary(recipeId) {
      if (isAborted() || state.pending || state.crafting || state.portable || !recipeId) return;
      state.pending = true;
      notify('Executando ofício auxiliar...', false);
      renderControls();
      try {
        const res = await sendIntent('craftAux', { recipeId });
        if (isAborted()) return;
        if (!res || res.ok === false) {
          notify(res?.message || 'Não foi possível concluir o ofício auxiliar.', true);
        } else {
          applyServerPayload(res);
          state.preview = null;
          notify(res.message || 'Ofício auxiliar concluído.', false);
          context.toast?.(res.message || 'Ofício auxiliar concluído.');
        }
      } catch (err) {
        if (isAborted()) return;
        notify(err?.message || 'Falha no ofício auxiliar.', true);
      } finally {
        state.pending = false;
        if (!isAborted()) render();
      }
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
      const searchInput = $('search');
      const query = normalizeSearchText((searchInput ? searchInput.value : '').trim());
      const filtered = state.ingredients.filter(item =>
        normalizeSearchText(item.name).includes(query) ||
        (item.effects || []).some(effect =>
          effect.known && normalizeSearchText(effect.name).includes(query)));
      const list = $('ingredient-list');
      const scrollTop = list.scrollTop;
      list.replaceChildren();
      const limit = Math.min(state.visibleLimit, filtered.length);
      for (const item of filtered.slice(0, limit)) {
        const button = node('button', '', 'ingredient-card');
        button.type = 'button';
        button.disabled = lock() || (state.selected.length >= 3 && !state.selected.includes(item.id));
        button.classList.toggle('selected', state.selected.includes(item.id));
        button.setAttribute('aria-pressed', String(state.selected.includes(item.id)));
        const head = node('div', '', 'ingredient-card-head');
        head.append(node('span', item.name), node('b', '×' + item.count));
        const tags = node('div', '', 'effect-tags');
        for (const effect of item.effects || []) {
          const lockedByRank = isEffectLockedByRank(effect, state.rank);
          const tag = node('span', lockedByRank ? ('🔒 ' + effectName(effect)) : effectName(effect));
          if (lockedByRank) {
            tag.className = 'tier-locked';
            tag.title = 'Conhecido, mas exige patente ' + (TIER_REQUIRED_RANK[effect.tier] || 'superior') + ' (Tier ' + effect.tier + ') para sintetizar.';
          }
          tags.append(tag);
        }
        button.append(head, tags);
        button.addEventListener('click', () => selectIngredient(item.id));
        list.append(button);
      }
      if (!filtered.length) {
        list.append(node('div', state.connected ? 'Nenhum ingrediente encontrado.' : 'Aguardando inventário do jogo.', 'no-results'));
      }
      list.scrollTop = scrollTop;
      $('ingredient-count').textContent = filtered.length + ' disponíveis';
      $('selection-count').textContent = state.selected.length + ' / 3';
      $('known-count').textContent = String(state.ingredients.reduce(
        (total, item) => total + (item.effects || []).filter(effect => effect.known).length, 0));
      $('bottle-count').textContent = String(state.bottles);
      $('crystallized-count').textContent = String(state.crystallizedBottles);
      $('dregs-count').textContent = String(state.dregsCount);
      $('normal-bottle-chip').textContent = String(state.bottles);
      $('crystal-bottle-chip').textContent = String(state.crystallizedBottles);
    }

    function renderOrbit() {
      shell.querySelectorAll('.orbit-slot').forEach((button, index) => {
        const id = state.selected[index];
        const ingredient = state.ingredients.find(item => item.id === id);
        button.classList.toggle('filled', !!ingredient);
        button.querySelector('small').textContent = ingredient
          ? ingredient.name
          : ['Primeiro ingrediente', 'Segundo ingrediente', 'Terceiro ingrediente'][index];
        button.title = ingredient ? 'Remover ' + ingredient.name : 'Selecione um ingrediente em Matéria';
        button.disabled = lock() || !ingredient;
      });
    }

    function renderEffects() {
      const box = $('effects');
      box.replaceChildren();
      const effects = (state.preview && Array.isArray(state.preview.effects))
        ? state.preview.effects.filter(effect => !effect.removed)
        : [];
      const knownEffects = effects.filter(effect => effect.known);
      if (!state.preview) {
        box.hidden = false;
        box.append(node('div', state.selected.length < 2
          ? 'Selecione dois ingredientes para revelar suas virtudes em ressonância.'
          : 'Escolha um processo em Ofício para revelar as virtudes em ressonância.', 'empty-state'));
      } else if (!knownEffects.length) {
        box.hidden = true;
      } else {
        box.hidden = false;
        for (const effect of knownEffects) {
          const row = node('div', '', 'effect-row');
          const badge = node('span', '', 'effect-badge' + (effect.hostile ? ' harmful' : ''));
          const lockedByRank = isEffectLockedByRank(effect, state.rank);
          const label = node('strong', lockedByRank ? ('🔒 ' + effectName(effect)) : effectName(effect));
          if (lockedByRank) {
            row.classList.add('tier-locked');
            row.title = 'Exige patente ' + (TIER_REQUIRED_RANK[effect.tier] || 'superior');
          }
          const parts = [];
          if (effect.magnitude != null)
            parts.push(Number(effect.magnitude).toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
          if (effect.duration != null) parts.push(effect.duration + ' s');
          if (effect.concentrated) parts.push('Concentrada');
          if (effect.stabilized) parts.push('Estabilizada');
          row.append(badge, label, node('span', parts.join(' · '), 'measure'));
          box.append(row);
        }
      }
      $('predicted').hidden = !state.preview;
      if (state.preview) {
        $('result-name').textContent = state.preview.productName || 'Produto alquímico';
        $('result-type').textContent = 'Resultado previsto: ' + (state.preview.productType || 'desconhecido');
      }
      $('resonance-phase').textContent = state.preview ? 'RESSONÂNCIA ATIVA' : 'PREPARAÇÃO';
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
      const known = (preview && Array.isArray(preview.effects))
        ? preview.effects.filter(effect => effect.known)
        : [];
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
        box.append(makeField('Virtude indesejada a reduzir', 'ga-stabilize-effect', choices, state.stabilize, value => {
          state.stabilize = value || null;
          if (state.stabilize) state.remove = null;
          void prepare();
        }));
      }
      if (state.process === 'purify') {
        const choices = [['', 'Não remover']];
        for (const effect of known.filter(value => value.canRefine))
          choices.push([effect.id, effectName(effect)]);
        box.append(makeField('Qual virtude deseja remover?', 'ga-remove-effect', choices, state.remove, value => {
          state.remove = value || null;
          if (state.remove) state.stabilize = null;
          if (state.remove === state.target) {
            state.target = null;
            state.reagent = null;
          }
          void prepare();
        }));
      }
      if (state.process === 'concentrate') {
        const choices = [['', 'Não concentrar']];
        for (const effect of known.filter(value => !value.removed && value.canConcentrate))
          choices.push([effect.id, effectName(effect)]);
        box.append(makeField('Virtude a concentrar', 'ga-target-effect', choices, state.target, value => {
          state.target = value || null;
          state.reagent = null;
          if (!state.target) void prepare();
          else render();
        }));
        const effect = (Array.isArray(preview.effects) ? preview.effects : [])
          .find(value => String(value.id) === String(state.target));
        const reagents = [['', 'Escolha o reagente']];
        for (const id of effect?.reagents || []) {
          const ingredient = state.ingredients.find(value => value.id === id);
          if (ingredient) reagents.push([id, ingredient.name]);
        }
        box.append(makeField('Reagente adicional', 'ga-reagent', reagents, state.reagent, value => {
          state.reagent = value || null;
          if (state.target && state.reagent) void prepare();
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
        $('yield-note').textContent = state.portable
          ? 'Kit Portátil: −20% potência, +50% tempo, máx. 2 operações.'
          : 'Selecione uma combinação válida.';
      } else {
        for (const item of preview.costs || []) {
          const row = node('div', '', 'summary-line');
          row.append(node('span', item.name), node('b', item.required + ' / ' + item.available));
          box.append(row);
        }
        $('summary-kind').textContent = String(preview.productType || 'PREPARADA').toLocaleUpperCase('pt-BR');
        if (preview.dregsOutputCount > 0 && preview.outputCount === 0) {
          $('yield').textContent = preview.dregsOutputCount + '× Borra Alquímica';
          $('yield-note').textContent = 'Mistura falha prevista: gera 1× Borra Alquímica por operação (garrafa consumida).';
        } else {
          $('yield').textContent = preview.outputCount + (preview.outputCount === 1 ? ' unidade' : ' unidades');
          $('yield-note').textContent = preview.doubleToil
            ? 'Double Toil and Trouble incluído uma vez na produção prevista.'
            : 'Ingredientes consumidos ao finalizar.';
        }
      }
      $('quantity').textContent = String(state.quantity);
    }

    function renderControls() {
      const locked = lock();
      const preview = state.preview;
      const requirements = {
        prepare: state.rank >= 1 && state.selected.length >= 2,
        stabilize: !state.portable && state.rank >= 2 && !!preview?.canStabilize,
        purify: !state.portable && state.rank >= 4 && !!preview?.canPurify,
        concentrate: !state.portable && state.rank >= 4 && !!preview?.canConcentrate
      };
      shell.querySelectorAll('.process').forEach(button => {
        const key = button.dataset.process;
        button.disabled = locked || !requirements[key];
        const active = key === state.process;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      const reasons = {
        prepare: state.rank < 1 ? 'Requer patente Novato' : 'Revela a preparação. Não consome matéria.',
        stabilize: state.portable ? 'Indisponível no Kit Portátil.' : (state.rank < 2 ? 'Requer patente Aprendiz' : (preview?.stabilizeReason || 'Reduz uma virtude indesejada.')),
        purify: state.portable ? 'Indisponível no Kit Portátil.' : (state.rank < 4 ? 'Requer patente Especialista' : (preview?.purifyReason || 'Remove uma virtude conhecida.')),
        concentrate: state.portable ? 'Indisponível no Kit Portátil.' : (state.rank < 4 ? 'Requer patente Especialista' : (preview?.concentrateReason || 'Fortalece uma virtude com matéria extra.'))
      };
      for (const key of Object.keys(reasons)) {
        const small = shell.querySelector('.process[data-process="' + key + '"] small');
        if (small) small.textContent = reasons[key];
      }
      if (state.portable) {
        state.bottleType = 'normal';
        if (state.quantity > 2) state.quantity = 2;
      }
      shell.querySelectorAll('.bottle-opt').forEach(button => {
        const bType = button.dataset.bottle;
        button.classList.toggle('active', bType === state.bottleType);
        button.disabled = locked || state.portable || (bType === 'crystallized' && state.crystallizedBottles < 1);
      });
      const canSign = Boolean(state.canSignPotion || state.rank >= 4);
      const signInput = $('sign-potion');
      const signerHint = $('signer-hint');
      if (!canSign) state.signPotion = false;
      if (signInput) {
        signInput.checked = Boolean(state.signPotion && canSign);
        signInput.disabled = locked || !canSign;
      }
      if (signerHint) {
        signerHint.textContent = canSign
          ? (state.characterName ? '— ' + state.characterName : '(Especialista+)')
          : '(Requer Especialista)';
      }
      renderAuxiliaryRecipes(locked);
      $('qty-minus').disabled = locked || state.quantity <= 1;
      $('qty-plus').disabled = locked || (state.portable && state.quantity >= 2);
      $('qty-max').disabled = locked || !preview || preview.maxOperations < 1;
      const selectedOption = state.process === 'prepare' ||
        (state.process === 'stabilize' && !!state.stabilize) ||
        (state.process === 'purify' && !!state.remove) ||
        (state.process === 'concentrate' && !!state.target && !!state.reagent);
      const ready = !!preview?.canFinalize && !!preview?.token && selectedOption;
      $('craft-button').disabled = locked || !ready;
      $('craft-label').textContent = state.pending
        ? 'Aguardando resposta…'
        : (state.crafting ? 'Produção em andamento…' : 'Iniciar produção');
      renderProcessOptions();
    }

    function renderAuxiliaryRecipes(locked) {
      const box = $('aux-list');
      const statusEl = $('aux-status');
      if (!box) return;
      box.replaceChildren();
      if (statusEl) {
        statusEl.textContent = state.portable ? 'INDISPONÍVEL NO KIT PORTÁTIL' : 'RECICLAGEM & FRASCOS';
      }
      const list = Array.isArray(state.auxiliaryRecipes) ? state.auxiliaryRecipes : [];
      if (!list.length) {
        box.append(node('p', 'Nenhuma receita auxiliar disponível.', 'option-note'));
        return;
      }
      for (const recipe of list) {
        const row = node('div', '', 'aux-item');
        const info = node('div', '', 'aux-info');
        info.append(node('strong', recipe.name));
        const reqText = (recipe.inputs || [])
          .map(inp => `${inp.required}× ${inp.name} (${inp.available})`)
          .join(' · ');
        info.append(node('small', reqText));
        const btn = node('button', 'Criar', 'aux-btn');
        btn.type = 'button';
        btn.disabled = locked || state.portable || !recipe.canCraft;
        btn.title = state.portable ? 'Indisponível no Kit Portátil' : (recipe.reason || recipe.description || '');
        btn.addEventListener('click', () => { void craftAuxiliary(recipe.id); });
        row.append(info, btn);
        box.append(row);
      }
    }

    function renderTestRankButtons() {
      const bar = $('test-rank-bar');
      if (!bar) return;
      bar.hidden = !state.testRanksEnabled;
      if (!state.testRanksEnabled) return;
      const activeKey = RANK_ORDER[state.rank] || 'none';
      bar.querySelectorAll('[data-test-rank]').forEach(btn => {
        const key = btn.dataset.testRank;
        btn.classList.toggle('active', key === activeKey);
        btn.disabled = lock();
      });
    }

    function render() {
      if (isAborted()) return;
      shell.classList.toggle('is-portable-kit', Boolean(state.portable));
      const pBadge = $('portable-badge');
      if (pBadge) pBadge.hidden = !state.portable;
      renderIngredients();
      renderOrbit();
      renderEffects();
      renderSummary();
      renderControls();
      renderTestRankButtons();
      $('rank-name').textContent = RANKS[state.rank] || RANKS[0];
      $('alchemy-level').textContent = Number.isFinite(state.alchemy)
        ? 'Alquimia ' + Math.floor(state.alchemy)
        : 'Alquimia —';
    }

    function stopProgress(message) {
      if (state.craftTimer) clearInterval(state.craftTimer);
      state.craftTimer = null;
      state.crafting = false;
      const wrap = $('progress-wrap');
      const fill = $('progress-fill');
      if (wrap) wrap.hidden = true;
      if (fill) fill.style.width = '0%';
      if (message) notify(message);
      if (!isAborted()) renderControls();
    }

    function startProgress() {
      if (!state.preview?.token || state.crafting || state.pending) return;
      const token = state.preview.token;
      const stages = Array.isArray(state.preview.stages) ? state.preview.stages : [];
      const total = Math.max(0.1, Number(state.preview.craftSeconds) || 0.1);
      const started = performance.now();
      state.crafting = true;
      $('progress-wrap').hidden = false;
      renderControls();
      const tick = () => {
        if (isAborted()) {
          stopProgress();
          return;
        }
        const elapsed = Math.min(total, (performance.now() - started) / 1000);
        let cursor = 0;
        let current = stages[stages.length - 1]?.name || 'Preparando';
        for (const stage of stages) {
          cursor += Number(stage.seconds) || 0;
          if (elapsed <= cursor) { current = stage.name; break; }
        }
        $('progress-stage').textContent = current;
        $('progress-time').textContent = Math.max(0, total - elapsed).toFixed(1) + ' s';
        $('progress-fill').style.width = (elapsed / total * 100) + '%';
        if (elapsed < total) return;
        clearInterval(state.craftTimer);
        state.craftTimer = null;
        state.crafting = false;
        $('progress-wrap').hidden = true;
        state.preview = null;
        void finalizeCraft(token);
      };
      tick();
      state.craftTimer = setInterval(tick, 100);
    }

    let portableCleared = false;
    function clearPortableState(token) {
      if (token || (state.portable && !portableCleared)) {
        if (state.portable) portableCleared = true;
        const body = {};
        if (token) body.token = token;
        if (state.portable) body.clearPortable = true;
        void sendIntent('cancel', body).catch(() => {});
      }
    }

    function setQuantity(value) {
      if (state.pending || state.crafting) return;
      const cap = state.portable ? 2 : 100;
      state.quantity = Math.max(1, Math.min(cap, Math.floor(Number(value) || 1)));
      if (state.preview) void prepare();
      else render();
    }

    function requestClose() {
      stopProgress();
      clearPortableState(state.preview?.token);
      const closeBtn = document.getElementById('close-shell');
      if (closeBtn) closeBtn.click();
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
    shell.querySelectorAll('.orbit-slot').forEach(button =>
      button.addEventListener('click', () => {
        const id = state.selected[Number(button.dataset.slot)];
        if (id) selectIngredient(id);
      }));
    shell.querySelectorAll('.process').forEach(button =>
      button.addEventListener('click', () => {
        const selected = button.dataset.process;
        if (button.disabled) return;
        state.process = selected;
        state.remove = null;
        state.stabilize = null;
        state.target = null;
        state.reagent = null;
        notify((PROCESS_NAMES[selected] || selected) + ' selecionado.');
        void prepare();
      }));
    $('qty-minus').addEventListener('click', () => setQuantity(state.quantity - 1));
    $('qty-plus').addEventListener('click', () => setQuantity(state.quantity + 1));
    $('qty-max').addEventListener('click', () => setQuantity(state.preview?.maxOperations || 1));
    shell.querySelectorAll('.bottle-opt').forEach(button =>
      button.addEventListener('click', () => {
        if (button.disabled || state.pending || state.crafting) return;
        const bType = button.dataset.bottle === 'crystallized' ? 'crystallized' : 'normal';
        if (state.bottleType === bType) return;
        state.bottleType = bType;
        if (state.preview || (state.selected.length >= 2 && state.process)) void prepare();
        else render();
      }));
    $('sign-potion')?.addEventListener('change', event => {
      if (state.pending || state.crafting) return;
      state.signPotion = Boolean(event.target.checked);
      if (state.preview || (state.selected.length >= 2 && state.process)) void prepare();
      else render();
    });
    shell.querySelectorAll('[data-test-rank]').forEach(button =>
      button.addEventListener('click', () => {
        if (button.disabled) return;
        void switchTestRank(button.dataset.testRank);
      }));
    $('craft-button').addEventListener('click', startProgress);
    $('close').addEventListener('click', requestClose);

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      stopProgress();
      clearPortableState(state.preview?.token);
      uiShell?.classList.remove('is-alchemy-workspace');
      container.replaceChildren();
    };
    context.signal?.addEventListener('abort', cleanup, { once: true });

    render();
    void loadSnapshot();

    return cleanup;
  }

  window.AetheriusAlchemyWorkshop = Object.freeze({
    id: 'professions',
    route: '/professions/alchemist-workshop',
    requestModuleId: 'alchemy',
    mount: mountAlchemyWorkshop
  });

  const ui = window.AetheriusUI;
  if (ui && typeof ui.registerModule === 'function' && !ui.getRegisteredModuleIds?.().includes('professions')) {
    ui.registerModule({
      id: 'professions',
      label: 'PROFISSÕES',
      version: '0.2.0',
      sdkMin: '1.0.0',
      sdkMaxExclusive: '2.0.0',
      rootRoute: '/professions',
      subroutes: ['/professions/alchemist-workshop'],
      radialSlot: 7,
      assets: ['modules/professions/alchemy/alchemy-module.css'],
      capabilities: ['alchemy.read', 'alchemy.craft'],
      mount: mountAlchemyWorkshop
    });
  }
})();
