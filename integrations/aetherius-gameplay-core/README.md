# Integração com o AetheriusGameplayCore

A lógica completa anteriormente implementada em `src/Recipe.cpp`, `src/Runtime.cpp` e `src/Rules.h` foi portada para `server/` em Node.js/CommonJS (`server/types.d.ts` com assinaturas TypeScript), respeitando os contratos do `AetheriusGameplayCore` e do `AETHERIUS-ACERVO-DE-INFORMACOES`.

## Regras portadas fielmente do mod original (`GuildaAlquimista-main`)

1. **Curva de potência e perks (`server/src/recipe-engine.cjs`):**
   - Fórmula base vanilla/Apothecary: `4.0 * (1 + (1.5 - 1) * (Alchemy / 100)) * (1 + Fortify / 100)`.
   - Perks normais cumulativos do `Vokrii` (`server/src/perk-grants.cjs`, sem perks ocultos e bloqueando `Purity` `Skyrim.esm|05821D`):
     - `novice` (`minAlchemy: 20`): `Skyrim.esm|0BE127` (*Alchemy Mastery*, `+1%` por nível de Alchemy)
     - `apprentice` (`minAlchemy: 40`): `Skyrim.esm|058215` (*Physician*, `×1.25` em Restore Health/Magicka/Stamina)
     - `adept` (`minAlchemy: 60`): `Skyrim.esm|058216` (*Benefactor*, `×1.25` benéficas), `Skyrim.esm|058217` (*Poisoner*, `×1.25` venenos)
     - `specialist` (`minAlchemy: 80`): `Skyrim.esm|058218` (*Experimenter*), `Skyrim.esm|105F2E` (*Green Thumb*)
     - `master` (`minAlchemy: 100`): `Vokrii - Minimalistic Perks of Skyrim.esp|27A1E1` (*Double Toil and Trouble*, `2×` unidades por operação)
   - Controlador de escala do Apothecary: `Apothecary.esp|0CB06C` (`MAG_ControllerScalingPerk`) **deve** estar em `activePerks` sempre que `Apothecary.esp` estiver na `loadOrder` (caso contrário Restore H/M/S e venenos perdem a curva do Apothecary, ex.: `18` em vez de `30` no Mestre).
2. **Processos especiais e filtros cumulativos (`server/src/rules.cjs`):**
   - Filtro cumulativo de `MGEF`s por patente (`rankEffectLimits`: `novice` 2 efeitos, até `master` ilimitado).
   - **Estabilizar** (`apprentice+`): reduz virtude indesejada e ajusta desejada conforme tabela configurável.
   - **Purificar** (`specialist+`): remove 1 virtude indesejada conhecida em receitas de 1 desejada + 1 indesejada (`×0.9` em Especialista, `×1.0` em Mestre).
   - **Concentrar** (`specialist+`): consome `+1` cópia do reagente escolhido por operação e escala em `+10%` (`specialist`) ou `+15%` (`master`) apenas quando o MGEF possui exatamente 1 eixo seguro (`ScalingAxis`).
   - Duração do lote progressiva (`BatchSeconds`) e custo unitário de `1× Alchemy Requires Bottles Redux.esp|000800` por operação.

## Pontos de acoplamento no servidor oficial (`AetheriusGameplayCore`)

1. **Governador de Profissões (`modules/profession-system`):**
   - Habilitar `"alchemist"` na configuração de release do `profession-system` (atualmente bloqueado em `src/domain/config.ts` / `defaults.json` até aprovação do ADR em `AETHERIUS-ACERVO-DE-INFORMACOES`).
   - Implementar `ProfessionPort` (`server/types.d.ts`) chamando o governador para consultar `rank` (`novice`..`master`), `vigor`, `revision` e liquidar `authorizeActivity` / `settleActivity` com `sourceSystem: "alchemy-system"` e `expectedXp = xpByRank[rank] * operations`.
2. **Perks e Skill (`PerkDelivery` / `gc_perk_projections` + `ClassSkillProjection`):**
   - Utilizar `composeAlchemyProfessionGrants(rank, config)` (`server/src/perk-grants.cjs`) no `perkDeliveryPort` para projetar os grants com origem `{ kind: "PROFESSION", key: "alchemist" }`, garantir `Apothecary.esp|0CB06C` na carga e manter `SkillValues[Alchemy] >= rank * 20` (`20/40/60/80/100`).
3. **Inventário, Catálogo de `ALCH` e Descoberta (`Housecarl -> RecordCatalog` + `InventoryTransactionPort`):**
   - Implementar `InventoryPort` resolvendo `StableFormKey` (`pluginName|HEX`) a partir do catálogo da release (ingredientes, efeitos conhecidos por personagem, garrafa vazia `Alchemy Requires Bottles Redux.esp|000800`).
   - **Nota sobre SkyMP / poções criadas:** O servidor SkyMP trabalha nativamente com `{ baseId, count, name? }` de registros `ALCH` existentes na `loadOrder` (formas `0xFFxxxxxx` geradas apenas no cliente quebram `MpActor::EquipItem` e não persistem após reconexão). O adapter de servidor (`server/ts/systems/aetheriusAlchemyUi.ts`) resolve o melhor registro `ALCH` da `loadOrder` por `(isPoison, primaryEffect, magnitude, duration)` e aplica `entry.name = productName` (além de persistir/expor a especificação exata no ReadModel do inventário). Para que valores fracionários/concentrados (`+15%`) ou combinações multi-efeito apareçam também no tooltip vanilla do Skyrim, o catálogo oficial do Housecarl pode gerar `ALCH` pré-assados por tier/efeito para entrega pelo mesmo contrato `commitAlchemy`.
4. **Roteador de UI (`AetheriusUiSystem`) e Limite de 16 KiB:**
   - Registrar os handlers via `registerAlchemyUiHandlers(router, service, { moduleId: 'alchemy' })`, mantendo a paginação por orçamento de bytes (`alchemy:ingredientsPage`) para inventários com centenas de ingredientes.
   - Para manter o módulo em espera até a liberação oficial, instanciar `createAlchemyService({ config, standby: true })`.
5. **Balanceamento configurável (`AETHERIUS_BALANCE_CONFIGURATION_POLICY.md`):**
   - Todos os parâmetros numéricos ficam centralizados em `server/config/alchemy-defaults.json`.
