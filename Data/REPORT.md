# Relatório técnico — Guild Alchemy MVP 0.1.2

## Correção 0.1.2

`GA::Craft()` agora trata a finalização como uma transação verificável. O `AlchemyItem` retornado por `AddPotion` ou `AddPoison` precisa ser não nulo, dinâmico, do tipo correto e estar registrado no mapa correspondente do `BGSCreatedObjectManager`. O log registra tipo, ponteiro, FormID, registro e referência do objeto criado.

O produto é nomeado, adicionado ao jogador e confirmado por diferença de `PlayerCharacter::GetItemCount()` antes de qualquer ingrediente ser removido. Cada remoção também é confirmada pela contagem. Falha de criação ou adição preserva todos os ingredientes; falha posterior de consumo restaura os ingredientes já removidos e retira o produto. Como `Craft()` lança nesses casos, a UI recebe `error` e nunca `crafted`.

## Correção 0.1.1

O crash de 22/09/2026 ao abrir a bancada foi localizado em `State()`, durante a leitura de Alchemy. O binário 0.1.0 fazia uma chamada virtual herdada diretamente em `PlayerCharacter`; isso fixou em compilação um deslocamento de `ActorValueOwner` incompatível com Skyrim 1.6.1170. A versão 0.1.1 centraliza todas as leituras e escritas de ActorValues em `Actor::AsActorValueOwner()`, o acessor versionado do CommonLibSSE-NG.

O crash log confirma `GuildAlchemy.dll+0045997`, instrução `call [rax+0x08]`, no caminho `OpenWorkbench -> State`, com a tentativa de acessar o subobjeto no deslocamento incorreto. Animated Interactions aparece abaixo na cadeia de entrada, mas não originou a exceção.

## Ambiente e houseCARL

O perfil ativo inspecionado foi `AETHERIUS - GRAFICO - QUALIDADE`, com Skyrim `1.6.1170`, SKSE `2.2.6`, Prisma UI `1.4.1`, Address Library para `1.6.1170`, Vokrii e Apothecary ativos. O houseCARL foi usado para ler vencedores, scripts/BSA, GMSTs, MGEFs, keywords e perk entries, criar os records, colocar a bancada, preservar o vencedor de `Shadows.esp`, compactar o plugin e validar referências.

Perks Vokrii resolvidos: Alchemy Mastery `0BE127`, Physician `058215`, Benefactor `058216`, Poisoner `058217`, Experimenter `058218`, Green Thumb `105F2E` e Double Toil and Trouble `27A1E1:Vokrii`. Purity `05821D` possui guarda explícita e nunca é concedido.

## Arquitetura implementada

- DLL CommonLibSSE-NG sem hooks: mensagens SKSE, activation sink e task queue.
- Prisma UI como apresentação não autoritativa; todos os pedidos voltam ao C++.
- Sessão, revisão monotônica, token descartável e fingerprint de receita impedem replay e alteração entre preview/finalização.
- Ingredientes e MGEFs são lidos das formas vencedoras em runtime.
- Produto dinâmico é criado pelo `BGSCreatedObjectManager` e adicionado em lote.
- ESPFE com cinco perks ocultos, um activator e uma referência colocada em Arcadia's Cauldron.

## Decisões conservadoras

O pipeline não chama um probe genérico de `ModAlchemyEffectiveness`, pois entry points podem usar formatos que não se reduzem com segurança a um `float*`. Para o setup solicitado, a base usa GMSTs e ActorValues nativos; a integração Vokrii reproduz as entradas reais lidas pelo houseCARL e suas keywords.

Concentração só é permitida quando o MGEF declara exatamente um eixo de potência utilizável. Casos ambíguos falham sem consumo. Preparação é memória de sessão e não cria itens intermediários.

## Validação executada

- Compilação Release x64 concluída com o trio de exports SKSE.
- Dependências PE auditadas; DLL de 64 bits.
- Testes determinísticos de custos, máximo de lote, duplicatas, limites e escala: `1/1` aprovado.
- `node --check` aprovado para `app.js`.
- ESPFE: 7 records novos e 1 override; houseCARL encontrou 0 referências pendentes, 0 masters ausentes e 0 records ilegíveis.
- Prisma API e exemplo oficial local foram usados como contrato.

O smoke test visual headless não executou porque o runtime Playwright disponível não trazia um navegador Chromium instalado. Nenhum download adicional foi feito apenas para esse teste. A UI ainda requer verificação dentro do Prisma/CEF do jogo, onde seu comportamento final realmente importa.

## Limite de evidência

O executável não foi iniciado nesta sessão. Carregamento real da DLL, foco Prisma, equivalência numérica com a mesa vanilla, encaixe espacial da bancada e persistência save/load permanecem no roteiro `VALIDATION.md`. O pacote é um MVP compilado e validado estaticamente; esses itens não são declarados como testados ingame.
