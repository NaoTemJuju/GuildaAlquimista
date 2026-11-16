---
titulo: Alquimia como sistema externo de profissões e concessão de perks do Vokrii
tipo: decisao
status: rascunho
responsaveis: [NaoTemJuju]
atualizado: 2026-11-16
tags: [alquimia, profissoes, vokrii, perk-delivery, guildas]
relacionados: [../02-sistemas/guildas/README.md, ../02-sistemas/ui-core/README.md, ../02-sistemas/gameplay-core/README.md]
---

# ADR-NNNN: Alquimia como sistema externo de profissões e concessão de perks do Vokrii

> **Nota:** Rascunho preparado no repositório `GuildaAlquimista` para submissão via PR/commit no `AETHERIUS-ACERVO-DE-INFORMACOES` (numeração `ADR-NNNN` a definir na entrada no Acervo).

## Contexto

O mod **GuildAlchemy** implementava originalmente em um plugin SKSE standalone (`GuildAlchemy.dll` + `GuildAlchemy.esp`) toda a lógica da bancada da Guilda dos Alquimistas: cinco patentes ocultas (`000802..000806`), concessão local de perks do `Vokrii`, bloqueio cumulativo de efeitos por patente e criação/consumo local de poções.

Nos padrões do `AetheriusUI_Core` e do `AetheriusGameplayCore`:
1. O cliente não possui autoridade sobre inventário, receitas ou perks (`SECURITY.md`, `ARCHITECTURE.md`).
2. O `profession-system` governa carreira, rank (`novice` a `master`), XP e Vigor Profissional (`modules/profession-system/README.md`).
3. `EXTERNAL_SYSTEMS_AND_HOUSECARL.md` (§17) deixa a política de perks vanilla/Vokrii para **Alquimista** marcada como *"Em decisão"*.
4. No Acervo (`02-sistemas/guildas/README.md`), `SkyGuilds` (responsável: `Melekyy`) já cobre aspectos sociais/cargos da Guilda dos Alquimistas.

## Decisão proposta

1. **Separação de escopo com `SkyGuilds` (`REGRAS.md` §10.5.1):**
   - `SkyGuilds` mantém a governança social da guilda (membros, liderança, cargos).
   - O módulo `GuildaAlquimista` (`alchemy-system`) atua como **sistema externo da bancada de Alquimia**, consultando o `profession-system` para autorização de rank/XP/Vigor.
2. **Fim dos perks ocultos no ESP:**
   - Os 5 perks ocultos (`GuildAlchemy_Novice`..`GuildAlchemy_Master`) são removidos; o rank oficial passa a ser exclusivamente o do `profession-system`.
3. **Concessão dos perks normais do `Vokrii` por rank via `PerkDelivery`:**
   - Ao progredir na carreira de `alchemist`, o servidor projeta via `PerkDelivery` (`source: { kind: "PROFESSION", key: "alchemist" }`) apenas os perks normais correspondentes:
     - `novice`: `Alchemy Mastery` (`Skyrim.esm|0BE127`)
     - `apprentice`: `Physician` (`Skyrim.esm|058215`)
     - `adept`: `Benefactor` (`Skyrim.esm|058216`), `Poisoner` (`Skyrim.esm|058217`)
     - `specialist`: `Experimenter` (`Skyrim.esm|058218`), `Green Thumb` (`Skyrim.esm|105F2E`)
     - `master`: `Double Toil and Trouble` (`Vokrii - Minimalistic Perks of Skyrim.esp|27A1E1`)
   - `Purity` (`Skyrim.esm|05821D`) permanece explicitamente proibido.
4. **Bloqueio de poções por rank no servidor:**
   - O servidor mantém o filtro cumulativo de efeitos por rank (`rankEffectLimits`) e a liberação progressiva de Estabilizar (`apprentice+`), Purificar (`specialist+`) e Concentrar (`specialist+`).

## Consequências

- Elimina dependência de autoridade no cliente e remove perks ocultos do `GuildAlchemy.esp`.
- Destrava a implementação oficial de `alchemist` no `profession-system` e no `PerkDelivery`.
- Exige alinhamento prévio com `Melekyy` (`SkyGuilds`) e revisão dos responsáveis pelo `AetheriusGameplayCore`.
