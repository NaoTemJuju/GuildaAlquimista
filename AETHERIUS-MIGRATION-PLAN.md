# Plano de Migração — GuildaAlquimista para AetheriusUI_Core e AetheriusGameplayCore

Documento de especificações e checklist para adequação do repositório `GuildaAlquimista` à arquitetura oficial do Aetherius (shell `AetheriusUI_Core`, protocolo `UiEnvelope v1` e backend autoritativo `AetheriusGameplayCore`).

---

## 1. Limpeza e remoção de legado no repositório `GuildaAlquimista`

- [x] **Remover `Data/PrismaUI/`** e `third_party/PrismaUI_API.h`.
- [x] **Remover `assets/ScreenShot112.png`** e a referência no CSS.
- [x] **Remover `SyncGuildAlchemyRank()` e perks ocultos** do fluxo C++ e de `records/housecarl-create.json` / `Data/SKSE/Plugins/GuildAlchemy.json`.
- [x] **Remover binário desatualizado `Data/SKSE/Plugins/GuildAlchemy.dll`** (a DLL passa a ser gerada pelo CI `.github/workflows/build.yml`).

---

## 2. Frontend → Módulo dentro do shell `AetheriusUI_Core` (`Data/MeridianUI/aetheriusui/modules/professions/alchemy/`)

- [x] Sair de `mod://GuildAlchemy/index.html` e estruturar o módulo em `modules/professions/alchemy/` compatível com `modules-loader.js`.
- [x] Implementar `mount(container, context)` e `unmount()` respeitando `context.signal` (`AbortSignal`) e registro de adapter (`window.AetheriusAlchemyWorkshop` + registro standalone no slot `7`).
- [x] Adequar `alchemy-module.css` ao `docs/VISUAL_SYSTEM.md` (`Segoe UI`, `Georgia`, `rgba(0, 0, 0, .73)` sem borda externa, sem ornamentos dourados, tokens `#f0f1f1` / `#d4d8db` / `#b7bec2` / `#ffffff1c` / `#69cf99` / `#4fc787`, `prefers-reduced-motion`).

---

## 3. Protocolo `UiEnvelope v1` e "Conexão em Espera"

- [x] Substituir `window.GuildAlchemyUI.request` + `guildalchemy:state` por `context.request` / `context.subscribe` (`UiEnvelope v1`) e adapter `server/src/ui-adapter.cjs`.
- [x] Garantir limite de **16 KiB**, bloqueio de `__proto__`/`prototype`/`constructor` e ausência de retry automático em mutações.
- [x] Implementar estado **em espera** (`ACTION_UNAVAILABLE` / `standby: true`) na UI sem simular receitas ou alterar inventário.
- [x] Substituir FormIDs instáveis na UI por `definitionId` / `effectId`.

---

## 4. Plugin SKSE / C++ (`src/`)

- [x] Remover o browser próprio `GuildAlchemy.Main` e `third_party/MeridianUIAPI`.
- [x] Retirar do C++ o cálculo de receitas (`src/Recipe.cpp`), checagem de patente e consumo/criação local (`src/Runtime.cpp`).
- [x] Manter no C++ apenas a detecção de ativação da bancada física (`TESActivateEvent`) enviando `ModCallbackEvent` (`AetheriusAlchemy.WorkbenchActivated`).

---

## 5. Contrato preparado para o Backend (`server/` → `AetheriusGameplayCore`)

- [x] Portar toda a lógica determinística e de receitas (`src/Rules.h` + `src/Recipe.cpp`) para `server/src/rules.cjs` e `server/src/recipe-engine.cjs`.
- [x] Manter bloqueio/liberação cumulativa de poções/efeitos (`rankEffectLimits`) e processos especiais validados no servidor por rank (`novice`..`master`).
- [x] Mapear concessão dos perks normais do `Vokrii` (sem perks ocultos e bloqueando `Purity`) em `server/src/perk-grants.cjs` no formato `PerkDelivery`.
- [x] Centralizar defaults configuráveis em `server/config/alchemy-defaults.json` e validar tudo com testes automatizados (`server/tests/alchemy.test.cjs`: 6/6 aprovados).

---

## 6. Pendências externas (repositórios sem permissão de push / validação em jogo)

- [ ] **`Data/GuildAlchemy.esp`**: regerar o `.esp` via Housecarl/xEdit usando `records/housecarl-create.json` para remover fisicamente os 5 perks ocultos (`GuildAlchemy_Novice`..`GuildAlchemy_Master`) mantendo apenas `GuildAlchemy_Workbench`.
- [ ] **`AetheriusUI_Core`**: copiar `modules/professions/alchemy/`, atualizar `modules-config.js`, adicionar `'alchemist'` em `shell.js` (`professionWorkshop`) e ligar a rota em `professions-module.js` (conforme `integrations/aetherius-ui-core/README.md`).
- [ ] **`AetheriusGameplayCore`**: acoplar `server/` às portas reais de `profession-system`, `PerkDelivery` e `InventoryTransactionPort`, definindo o catálogo de `ALCH` ou executor de poções (conforme `integrations/aetherius-gameplay-core/README.md`).
- [ ] **`AETHERIUS-ACERVO-DE-INFORMACOES`**: alinhar escopo com `Melekyy` (`02-sistemas/guildas/README.md`) e submeter o ADR em `docs/ADR-PROPOSTA-ALQUIMIA-VOKRII.md`.
- [ ] **CI & Teste em jogo**: compilar a nova `GuildAlchemy.dll` pelo GitHub Actions e validar no kit privado `AETHERIUS-TESTE-DANO` (conforme `integrations/local-test-kit/README.md`).
