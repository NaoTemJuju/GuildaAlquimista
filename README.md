# Guild Alchemy — Módulo Aetherius (Alquimia, Pesquisa e Toxicidade)

> Documentação oficial de referência no Acervo Aetherius:
> - [Acervo Aetherius](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES)
> - [Sistema de Guildas (`02-sistemas/guildas/README.md`)](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES/blob/main/02-sistemas/guildas/README.md)
> - [Profissões (`02-sistemas/profissoes/README.md`)](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES/blob/main/02-sistemas/profissoes/README.md)
> - [UI Core (`02-sistemas/ui-core/README.md`)](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES/blob/main/02-sistemas/ui-core/README.md)
> - [Gameplay Core (`02-sistemas/gameplay-core/README.md`)](https://github.com/pablo-rodrigues1/AETHERIUS-ACERVO-DE-INFORMACOES/blob/main/02-sistemas/gameplay-core/README.md)

Este repositório reúne a implementação do sistema de **Alquimia da Guilda dos Alquimistas** integrado ao servidor **Aetherius (SkyMP)** e ao shell **`AetheriusUI_Core`**.

---

## O que está implementado atualmente

1. **Frontend integrado ao `AetheriusUI_Core`** (`Data/MeridianUI/aetheriusui/modules/professions/alchemy/`)
   - Módulo registrável no shell `mod://aetheriusui/` (`mount`/`unmount` com `AbortSignal`) e abas de **Bancada de Alquimia** e **Pesquisa Alquímica**.
   - Comunicação autenticada via **Protocolo Aetherius UI v1 (`UiEnvelope`)** (`alchemy.snapshot`, `alchemy.prepare`, `alchemy.craft`, `alchemy.craftAuxiliary`, `alchemy.research*`, `alchemy.cancel`), com paginação de ingredientes/efeitos dentro do limite de `16 KiB`.
   - Em modo standby (quando o servidor não habilita o módulo), a interface exibe o aviso sem simular receitas nem alterar o inventário.

2. **Plugin SKSE no cliente** (`src/`)
   - Intercepta ativação de bancadas de alquimia e itens específicos do mod (`Kit Alquímico Portátil`, etc.), emitindo eventos via `ModCallbackEvent` para o client adapter do SkyMP sem autoridade local sobre inventário, receitas ou perks.
   - Workflow de build em [`.github/workflows/build.yml`](.github/workflows/build.yml).

3. **Motor Server-Side (`server/src/` + `server/config/alchemy-defaults.json`)**
   - **Preparo e Produção (`recipe-engine.cjs`, `rules.cjs`):** combinação de 2 ou 3 ingredientes, bloqueio progressivo de efeitos por patente (`novice` → `apprentice` → `adept` → `specialist` → `master`), escala Skyrim + `Vokrii` + `Apothecary`, processos **Estabilizar**, **Purificar** e **Concentrar**, suporte a *Double Toil and Trouble* sem dobrar consumo de garrafas e geração de `fingerprint` SHA-256 anti-dessincronização.
   - **Pesquisa Alquímica (`research-engine.cjs`):** bancada/sessão de pesquisa cronometrada com `Solvente Básico` (`0x0807`) e `Solvente Avançado` (`0x0808`), descoberta de efeitos e geração de manuscritos/compêndios.
   - **Borra Alquímica e Reciclagem:** falhas e receitas incompatíveis geram `Borra Alquímica` (`0x080D`), reciclável na aba **Ofício Auxiliar** (ex.: limpar garrafas com sal).
   - **Frasco Cristalizado (`0x080E`):** frasco opcional que aumenta a duração das poções em `+20%`.
   - **Kit Alquímico Portátil (`0x080F`):** permite alquimia fora da bancada com `-20%` de potência, `+50%` de tempo, limite de `2` operações por lote e sem refinos ou frasco cristalizado.
   - **Assinatura de Poções:** alquimistas `Especialista` e `Mestre` podem assinar poções com o nome do autor.
   - **Perks do Vokrii:** composição de perks normais em `server/src/perk-grants.cjs` (`Purity` bloqueado).

4. **Sistema de Toxicidade e Mel Branco (`GuildAlchemy.esp` + servidor)**
   - **Escala 0–100 em 5 estágios** por tier da poção consumida (`T1:+10`, `T2:+20`, `T3:+25`, `T4:+32`, `T5:+50`) e decaimento natural de `1` ponto a cada `15s`:
     - **Estágio 1 (0–20):** sem penalidades.
     - **Estágio 2 (21–40):** `-10%` regeneração de Vigor e Magia (`GA_Tox_Stage2` / `0x0818`).
     - **Estágio 3 (41–65):** `-25%` regeneração de Vida, Vigor e Magia (`GA_Tox_Stage3` / `0x0819`) e poções de cura com `0.75x`.
     - **Estágio 4 (66–89):** `-35%` regeneração de atributos, `-40` Vida Máxima (`GA_Tox_Stage4` / `0x081A`) e poções de cura com `0.50x`.
     - **Estágio 5 (90–100):** bloqueia novas poções (exceto Mel Branco), `-50%` regeneração, `-50` Vida Máxima, `-20%` dano físico e poder mágico (`GA_Tox_Stage5` / `0x081B`) e dreno de `1.5 HP/s` (piso `5 HP`).
   - Todos os `MGEF`s (`0x0812`–`0x0817` e `0x0810`) possuem `FULL` e `DNAM` para exibição em **Efeitos Ativos**.
   - **Mel Branco (`GuildAlchemy.esp|000811`):** consumível a qualquer momento (inclusive Estágio 5), zera toxicidade e dissipa efeitos de poções/venenos (`GA_MelBranco_Dispel` + `AlchCurePoison`).
   - *Observação:* o medidor visual (HUD) de toxicidade não faz parte desta entrega e será implementado separadamente.

---

## Pontos que devem ser mudados até o final da versão

Resumo das pendências obrigatórias antes da versão final (detalhes completos em [`PONTOS_PENDENTES_VERSAO_FINAL.md`](PONTOS_PENDENTES_VERSAO_FINAL.md)):

1. Trocar chave de persistência de `world-alchemy-specs.json` e `world-alchemy-manuscripts.json` de `baseId` numérico (Runtime FormID) para `StableFormKey` (`plugin|hex`).
2. Ligar `authorizeActivity()` e `settleActivity()` ao `ProfessionGovernorPort` / PostgreSQL (`gc_profession_*`) com consumo real de Vigor Profissional e XP.
3. Expor porta de leitura somente-leitura das poções para o `DamageSystem`.
4. Migrar `Solvente Básico` e `Solvente Avançado` da panela (`CraftingCookpot`) para `Ofício Auxiliar` da bancada de Alquimia.
5. Definir a receita definitiva de criação do `Mel Branco` (`0x0811`).
6. Implementar/integrar o medidor visual (HUD) de toxicidade (ficou a cargo do dev de UI/HUD).
7. Alinhar as variáveis de cor de `.ga-old-shell` em `alchemy-module.css` aos tokens globais do `AetheriusUI_Core`.
8. Enviar a documentação consolidada de `Alquimista` para o `AETHERIUS-ACERVO-DE-INFORMACOES`.

---

## Testes automatizados

```powershell
node --test server/tests/alchemy.test.cjs
node --check Data/MeridianUI/aetheriusui/modules/professions/alchemy/alchemy-module.js
```

## Guias adicionais
- [Pontos pendentes até o final da versão](PONTOS_PENDENTES_VERSAO_FINAL.md)
- [Integração com `AetheriusUI_Core`](integrations/aetherius-ui-core/README.md)
- [Integração com `AetheriusGameplayCore`](integrations/aetherius-gameplay-core/README.md)
- [Teste no kit privado (`AETHERIUS-TESTE-DANO`)](integrations/local-test-kit/README.md)
- [Proposta de ADR para perks do Vokrii](docs/ADR-PROPOSTA-ALQUIMIA-VOKRII.md)
