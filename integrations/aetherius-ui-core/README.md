# Integração com o AetheriusUI_Core

Este repositório entrega o módulo de interface em:
`Data/MeridianUI/aetheriusui/modules/professions/alchemy/`

## Como acoplar no `AetheriusUI_Core`

1. Copiar a pasta `Data/MeridianUI/aetheriusui/modules/professions/alchemy/` para `frontend/Data/MeridianUI/aetheriusui/modules/professions/alchemy/` no `AetheriusUI_Core`.
2. **Caso `professions-module.js` já esteja ativo no slot 7 (`/professions`):**
   - Carregar `modules/professions/alchemy/alchemy-module.css` e `modules/professions/alchemy/alchemy-module.js` na entrada `professions` de `modules-config.js`.
   - Em `professions-module.js`, adicionar `'/professions/alchemist-workshop'` em `subroutes` e chamar `window.AetheriusAlchemyWorkshop.mount(container, context)` quando `context.route === '/professions/alchemist-workshop'`.
   - Em `shell.js` (linha de `professionWorkshop`), incluir `'alchemist'` na lista permitida para `openDirect('professions', '/professions/' + packet.profession + '-workshop')`.
3. **Caso seja carregado isolado para teste no shell:**
   - Usar o manifesto em `modules-config.snippet.json`. O próprio `alchemy-module.js` registra o slot `7` (`professions`) automaticamente se ainda não houver registro ativo.
4. **Modo em espera (`ACTION_UNAVAILABLE`):**
   - Enquanto o servidor não registrar os handlers `alchemy.snapshot`, `alchemy.prepare`, `alchemy.craft` e `alchemy.cancel`, o módulo exibe a tela de conexão em espera sem simular receitas nem tocar inventário.
5. **Ponte física da bancada (opcional):**
   - O plugin mínimo `GuildAlchemy.dll` emite o `ModCallbackEvent` `AetheriusAlchemy.WorkbenchActivated` ao ativar a bancada `000800:GuildAlchemy.esp`, permitindo que o `aetheriusUiService` abra a rota `/professions/alchemist-workshop` no shell.
