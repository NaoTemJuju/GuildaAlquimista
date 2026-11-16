# Guia de Teste no Kit Privado (`AETHERIUS-TESTE-DANO`)

Este guia descreve como testar o módulo no servidor privado isolado sem alterar os arquivos oficiais deste repositório.

## 1. Cliente (MO2 com Meridian já ativo)
1. Copie a pasta `Data/MeridianUI/aetheriusui/modules/professions/alchemy/` para dentro da pasta `MeridianUI/aetheriusui/modules/professions/alchemy/` do mod de UI ativo no perfil de teste do MO2.
2. Atualize `modules-config.js` do perfil de teste conforme `integrations/aetherius-ui-core/modules-config.snippet.json` (ou adicione ao `professions-module.js` se ele já estiver ativo no perfil).
3. Se quiser usar a bancada física no mundo:
   - Compile a nova `GuildAlchemy.dll` pelo workflow do GitHub Actions (`.github/workflows/build.yml`) e ative `GuildAlchemy.esp` + `Data/SKSE/Plugins/GuildAlchemy.dll` + `GuildAlchemy.json` no MO2 de teste.
   - Copie o mesmo `GuildAlchemy.esp` para `servidor/data/` e adicione na load order de teste do kit (cliente e servidor devem ter exatamente a mesma lista de plugins).

## 2. Teste do estado "em espera" (sem servidor conectado)
1. Inicie o kit com `INICIAR.bat` + `JOGAR.bat` **sem** registrar o handler `alchemy` no servidor.
2. Abra a aba **PROFISSÕES** (slot 7) ou a rota `/professions/alchemist-workshop`.
3. Resultado esperado: o módulo abre dentro do shell `AetheriusUI_Core` exibindo **"Conexão em espera com o servidor"** (`ACTION_UNAVAILABLE`), sem simular receitas e sem consumir ingredientes.

## 3. Teste com servidor autoritativo ligado (kit privado)
1. No servidor local do kit (`servidor/gamemode`), monte uma ponte temporária instanciando `createAlchemyService` (`server/src/index.cjs`) com adaptadores locais para `globalThis.aetheriusProfessionsBridge` e `inventory-service.js`, mantendo `standby: false`.
2. Teste os testes automatizados da lógica pura antes de subir o jogo:
   ```powershell
   & "C:\Users\Administrator\Downloads\AETHERIUS - KIT TESTE DANO 13-11 (v17)\AETHERIUS-TESTE-DANO\ferramentas\node\node.exe" --test server\tests\alchemy.test.cjs
   ```
