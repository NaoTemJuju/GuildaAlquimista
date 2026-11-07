# GuildAlchemy 0.1.7 — edição Meridian

Esta edição substitui totalmente a integração PrismaUI pelo MeridianUI. Instale o pacote completo desta edição em substituição ao pacote anterior da GuildAlchemy. Não instale os dois ao mesmo tempo.

## Instalação

1. Instale MeridianUI e suas dependências, seguindo a página oficial: https://www.nexusmods.com/skyrimspecialedition/mods/190723
2. Desative a versão anterior da GuildAlchemy e instale `GuildAlchemy-MVP-0.1.7-meridian.zip`.
3. Ative `GuildAlchemy.esp` na mesma posição da versão anterior. Os requisitos Vokrii, Apothecary e Alchemy Requires Bottles Redux continuam os mesmos.
4. Inicie pelo SKSE. A edição Meridian não precisa de PrismaUI; outros mods podem continuar precisando dele.

A DLL está em `SKSE/Plugins/GuildAlchemy.dll`. A interface está em `MeridianUI/GuildAlchemy/` e é carregada como `mod://GuildAlchemy/index.html`.

## O que foi adaptado

- Aquisição da API Meridian pelo handshake de versão oficial do SKSELoader.
- Uma única instância de navegador `GuildAlchemy.Main`, com foco e visibilidade controlados pela bancada.
- Mensagens JS → C++ por `GuildAlchemyUI.request`, com argumento objeto JSON e execução na thread do jogo.
- Mensagens C++ → JS por evento `guildalchemy:state`.
- Confirmação explícita de prontidão da página após registrar o listener. A página pode carregar em segundo plano sem bloquear o jogo.
- Fechamento, Escape, invalidação de sessão e parada da barra de produção ao fechar.
- Proteção contra uso do navegador após encerramento do Meridian.

Mantidos: layout, CSS, imagens e ícones aprovados; camada preta uniforme de 50%; cenário do jogo ao vivo; Preparar inicialmente desmarcado; receitas, nomes, patentes, custos, frascos, tempo e regras de produção existentes.

A migração troca a apresentação e o transporte. O cálculo e a produção existentes continuam no plugin nativo SKSE. Ela não transfere essas mecânicas para um backend do servidor nem muda a política de compatibilidade multiplayer.

## SDK

Headers oficiais vendorizados de https://github.com/heathbrownkeyworks/MeridianUI, commit `5707877322c85a1bd1c2e3309487f266d0647ca9`, API 1.0, versão de biblioteca declarada 1.5.0. A aquisição exige API de mesmo major e minor compatível. O SDK tem licença MIT preservada em `third_party/MeridianUIAPI/LICENSE-MIT`.

O MeridianUI em si não é redistribuído neste pacote. Instale-o como dependência separada.

## Validação no jogo ainda necessária

Compilação não comprova carregamento, foco, desempenho ou sincronização no servidor. Confira no `GuildAlchemy.log` as mensagens `MeridianUI loader: API version is ok`, `Interface GuildAlchemy criada no MeridianUI` e `Meridian UI pronta`.

Verifique abrir/fechar/reabrir, Escape durante produção, os quatro ofícios, produção em lote, falta de frascos, save/load e o cenário visível atrás da interface. Não há ganho de FPS garantido pela troca de framework.

Os relatórios de versões anteriores incluídos no código-fonte são históricos. Para esta edição, use este documento como referência de instalação e migração.

## Verificações desta entrega

- Configuração CMake e compilação Release do alvo GuildAlchemy concluídas sem erros.
- Sintaxe de app.js verificada com `node --check`.
- Recipe.cpp, Rules.h, Runtime.cpp e GuildAlchemy.esp preservam as regras da versão anterior. UI.cpp recebeu a ocultação temporária do HUD.
- Integração nativa e JavaScript sem referências ao PrismaUI.
- Skyrim não foi iniciado; FPS, carregamento real, input/foco e servidor multiplayer permanecem sem validação em jogo.

## Atualização visual e HUD

A edição atual centraliza a janela na viewport e mantém a superfície preta a 75%. O `debug` vem desativado em `GuildAlchemy.json`. Enquanto a bancada Meridian está aberta, `UI.cpp` oculta o nome de ativação no `HUD Menu`. Se o HUD personalizado não expuser esse campo, oculta o filme Scaleform inteiro. A visibilidade anterior é restaurada ao encerrar a sessão. O comando `tm` não é executado. A DLL compilou para SE+AE; a ocultação do aviso precisa de confirmação dentro do jogo.

