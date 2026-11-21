# Pontos que devem ser mudados até o final da versão

Documento vivo atualizado a cada envio para o Git (`https://github.com/NaoTemJuju/GuildaAlquimista`). Lista todas as pendências técnicas, ajustes de regras dos Cores (`AetheriusGameplayCore`, `AetheriusUI_Core`, `AETHERIUS-ACERVO-DE-INFORMACOES`) e itens de gameplay necessários antes da entrega da versão final.

## 1. Conformidade com `AetheriusGameplayCore`
1. **Substituir Runtime FormID (`baseId`) por `StableFormKey` na persistência de poções e manuscritos**
   - *Onde está:* `world-alchemy-specs.json` (`saveCraftedSpec` / `aetheriusGetCraftedAlchemySpec`) e `world-alchemy-manuscripts.json` em `aetheriusAlchemyUi.ts`.
   - *Pendência:* hoje a chave persistida usa `${baseId}:${name}` (`baseId` numérico). Pela regra `ARCHITECTURE.md` §3.5 (`StableFormKey`), deve migrar para `${stableFormKey}:${name}` para sobreviver a mudanças de load order entre builds.
2. **Integrar `ProfessionGovernorPort` real (Vigor Profissional, XP e PostgreSQL `gc_profession_*`)**
   - *Onde está:* `professionPort` (`authorizeActivity` / `settleActivity`) em `aetheriusAlchemyUi.ts`.
   - *Pendência:* sair do fallback em memória de teste para validar/consumir **Vigor Profissional** (com multiplicador `1.00x–4.00x` para receitas abaixo do rank), gravar XP real e registrar auditoria idempotente nas tabelas `0013_gc_professions_uuid_v2.sql` / `0014_gc_profession_world.sql`.
3. **Expor porta de leitura para o `DamageSystem` (`REQUISITO_ENCANTAMENTOS_E_POCOES.md`)**
   - *Pendência:* expor leitura somente-leitura por instância/efeitos (`effectKey`, `magnitude`, `duration`, `area`) e sinalizar entrada/saída de efeitos no consumo e fim de duração para integração com combate físico.

## 2. Gameplay e Receitas (`GuildAlchemy.esp` + Servidor)
4. **Migrar `Solvente Básico` (`0x0807`) e `Solvente Avançado` (`0x0808`) para a bancada de Alquimia**
   - *Motivo:* os `COBJ` atuais no `GuildAlchemy.esp` usam `CraftingCookpot` (panela), que no servidor oficial é bloqueada para não-cozinheiros (`cook`). Mover a produção de solventes para a seção **Ofício Auxiliar** da bancada de Alquimia.
5. **Definir receita final de criação do `Mel Branco` (`GuildAlchemy.esp|000811`)**
   - *Situação atual:* o item `GA_MelBranco` existe no ESP (dissipa efeitos de poções e zera toxicidade a qualquer momento) e é entregue no kit de teste local, mas ainda não possui receita final de combinação de ingredientes.
6. **Balanceamento final de economia e remoção dos atalhos de teste local**
   - Desativar `ALCHEMY_LOCAL_TEST_RANK`, `ALCHEMY_LOCAL_TEST_QASMOKE` e entrega automática do kit de teste em produção (`iniciar_local.bat` / `.env` de produção).

## 3. UI e HUD (`AetheriusUI_Core`)
7. **Medidor visual (HUD) de Toxicidade**
   - *Situação atual:* o código de HUD no navegador foi removido propositalmente desta versão para evitar conflitos e ficar sob responsabilidade do dev encarregado da HUD. O servidor continua calculando toxicidade (`0–100`, 5 estágios, decaimento `1 pt / 15s`), aplicando os debuffs (`GA_Tox_Stage2..5`) e bloqueio/dreno no Estágio 5.
8. **Alinhar tokens CSS de `alchemy-module.css` ao `AetheriusUI_Core`**
   - *Onde está:* `Data/MeridianUI/aetheriusui/modules/professions/alchemy/alchemy-module.css` (`.ga-old-shell`).
   - *Pendência:* substituir tokens próprios (`--ink`, `--emerald`, `--gold`, `--line`) diretamente pelos tokens oficiais do `AetheriusUI_Core` (`--accent`, `--text`, `--muted`, `--line` definidos em `styles.css`).

## 4. Documentação e Acervo (`AETHERIUS-ACERVO-DE-INFORMACOES`)
9. **Atualizar documentação oficial de `Alquimista` no Acervo**
   - Atualizar `02-sistemas/profissoes/README.md` e `catalogo-e-progressao.md` (onde `Alquimista` ainda consta como pendente), criar o documento/diário de Alquimia e registrar ADRs finais (concentração, borra, pesquisa, kit portátil, frasco cristalizado, assinatura e toxicidade).
