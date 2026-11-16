# Integração com o AetheriusGameplayCore

A lógica completa anteriormente implementada em `src/Recipe.cpp` e `src/Rules.h` foi portada para `server/` em Node.js/CommonJS (`server/types.d.ts` com assinaturas TypeScript), respeitando os contratos do `AetheriusGameplayCore`.

## Pontos de acoplamento no servidor oficial

1. **Governador de Profissões (`modules/profession-system`):**
   - Habilitar `"alchemist"` na configuração de release do `profession-system` (atualmente bloqueado em `src/domain/config.ts` até aprovação da política).
   - Implementar `ProfessionPort` (`server/types.d.ts`) chamando o governador para consultar `rank` (`novice`..`master`), `vigor`, `revision` e liquidar `authorizeActivity` / `settleActivity` com `sourceSystem: "alchemy-system"`.
2. **Inventário e Catálogo (`Housecarl -> RecordCatalog` + `InventoryTransactionPort`):**
   - Implementar `InventoryPort` resolvendo `StableFormKey` (`pluginName|HEX`) a partir do catálogo da release (ingredientes, efeitos conhecidos, garrafa vazia `Alchemy Requires Bottles Redux.esp|000800`).
   - **Nota sobre SkyMP / poções criadas:** O servidor SkyMP trabalha nativamente com `{ baseId, count }` de registros existentes (`ALCH`). Portanto, `commitAlchemy` recebe todos os efeitos/magnitudes/durações/nome calculados pelo `recipe-engine.cjs` e pode tanto mapear para um `ALCH` catalogado (`StableFormKey`) quanto repassar os atributos para um executor nativo autorizado pelo servidor.
3. **Perks normais do Vokrii (`PerkDelivery` / `gc_perk_projections`):**
   - Utilizar `composeAlchemyProfessionGrants(rank, config)` (`server/src/perk-grants.cjs`) para gerar os grants de origem `{ kind: "PROFESSION", key: "alchemist" }`.
   - Não há perks ocultos (`GuildAlchemy.esp`); `Purity` (`Skyrim.esm|05821D`) é bloqueado explicitamente.
   - Requer registro prévio do ADR em `AETHERIUS-ACERVO-DE-INFORMACOES` (`docs/ADR-PROPOSTA-ALQUIMIA-VOKRII.md`).
4. **Roteador de UI (`AetheriusUiSystem`):**
   - Registrar os handlers via `registerAlchemyUiHandlers(router, service, { moduleId: 'alchemy' })`.
   - Para manter o módulo em espera até a liberação oficial, instanciar `createAlchemyService({ config, standby: true })`.
5. **Balanceamento configurável (`AETHERIUS_BALANCE_CONFIGURATION_POLICY.md`):**
   - Todos os parâmetros numéricos ficam centralizados em `server/config/alchemy-defaults.json`.
