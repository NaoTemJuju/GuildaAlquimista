# Guild Alchemy — Módulo Aetherius (Conexão em Espera + Lógica Server-Side)

> Documentação oficial de referência no Acervo Aetherius:
> - [Acervo Aetherius](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES)
> - [Sistema de Guildas (`02-sistemas/guildas/README.md`)](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES/blob/main/02-sistemas/guildas/README.md)
> - [UI Core (`02-sistemas/ui-core/README.md`)](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES/blob/main/02-sistemas/ui-core/README.md)
> - [Gameplay Core (`02-sistemas/gameplay-core/README.md`)](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES/blob/main/02-sistemas/gameplay-core/README.md)

Este repositório reúne a adaptação do **Guild Alchemy** para os padrões do servidor **Aetherius (SkyMP)**:

1. **Frontend integrado ao `AetheriusUI_Core`** (`Data/MeridianUI/aetheriusui/modules/professions/alchemy/`)
   - Implementado como módulo registrável no shell `mod://aetheriusui/` (`mount`/`unmount` com `AbortSignal`).
   - Comunicação via **Protocolo Aetherius UI v1 (`UiEnvelope`)** (`alchemy.snapshot`, `alchemy.prepare`, `alchemy.craft`, `alchemy.cancel`), sem `FormID`s instáveis na UI.
   - **Modo conexão em espera:** enquanto o servidor não registrar o handler autoritativo de Alquimia (retornando `ACTION_UNAVAILABLE` ou sem sessão), a interface exibe o estado de espera sem simular receitas nem alterar o inventário.
   - Tokens visuais alinhados ao `docs/VISUAL_SYSTEM.md` do `AetheriusUI_Core` (`Segoe UI`, `Georgia`, `rgba(0, 0, 0, .73)` sem borda externa, `#69cf99` / `#4fc787`).

2. **Plugin SKSE mínimo no cliente** (`src/`)
   - Removidos `Recipe.cpp`, o browser isolado `GuildAlchemy.Main`, `PrismaUI`, `SyncGuildAlchemyRank()` e toda autoridade local sobre inventário, receitas ou perks.
   - Mantém apenas a detecção da bancada física (`000800:GuildAlchemy.esp`) via `TESActivateEvent` e o disparo do `ModCallbackEvent` `AetheriusAlchemy.WorkbenchActivated` para o client adapter abrir o módulo no shell.
   - A DLL atualizada é compilada pelo workflow [`.github/workflows/build.yml`](.github/workflows/build.yml).

3. **Motor server-side preservado** (`server/`)
   - Toda a mecânica original do `Recipe.cpp` e `Rules.h` foi portada para Node.js (`server/src/` + `server/config/alchemy-defaults.json`):
     - Combinação de 2 ou 3 ingredientes e bloqueio cumulativo de efeitos por patente (`novice` → `apprentice` → `adept` → `specialist` → `master`);
     - Escala Skyrim + `Vokrii` + `Apothecary`;
     - Processos de **Estabilizar**, **Purificar** e **Concentrar**;
     - *Double Toil and Trouble* sem dobrar consumo de garrafas vazias;
     - Cálculo de tempo em lote, nomenclatura e `fingerprint` SHA-256 anti-dessincronização.
   - **Sem perks ocultos:** as patentes vêm exclusivamente do `profession-system`, e os perks normais do `Vokrii` são compostos em `server/src/perk-grants.cjs` para entrega pelo `PerkDelivery` (`Purity` bloqueado).

## Testes automatizados do módulo server-side

```powershell
node --test server/tests/alchemy.test.cjs
node --check Data/MeridianUI/aetheriusui/modules/professions/alchemy/alchemy-module.js
```

## Guias de integração e pendências externas

- [Integração com `AetheriusUI_Core`](integrations/aetherius-ui-core/README.md)
- [Integração com `AetheriusGameplayCore`](integrations/aetherius-gameplay-core/README.md)
- [Teste no kit privado (`AETHERIUS-TESTE-DANO`)](integrations/local-test-kit/README.md)
- [Proposta de ADR para perks do Vokrii](docs/ADR-PROPOSTA-ALQUIMIA-VOKRII.md)
- [Checklist de migração](AETHERIUS-MIGRATION-PLAN.md)

> **Atenção sobre `Data/GuildAlchemy.esp`:** o arquivo `records/housecarl-create.json` já foi atualizado removendo os 5 perks ocultos (`GuildAlchemy_Novice`..`GuildAlchemy_Master`), mantendo apenas o ativador `GuildAlchemy_Workbench`. O binário `Data/GuildAlchemy.esp` precisa ser regerado via Housecarl/xEdit antes da homologação final na load order.
