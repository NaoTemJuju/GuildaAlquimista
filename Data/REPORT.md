# Relatório técnico — Guild Alchemy MVP 0.1.4

## Correções e fluxo 0.1.4

`AddPoison` usa um smart pointer diferente de `AddPotion`. A validação antiga exigia simultaneamente o ponteiro retornado e o ponteiro de saída, embora o runtime possa preencher apenas uma dessas vias. A versão 0.1.4 aceita a forma válida fornecida pelo runtime, valida seu registro e transfere a referência persistente também para venenos. A transação continua adicionando e confirmando o produto antes de remover qualquer ingrediente, com rollback nas falhas posteriores.

A view agora recebe foco com `pauseGame=false`, possui captura JavaScript e nativa da tecla Escape, busca por nomes de efeitos conhecidos e uma produção visual cancelável. O tempo soma 10 segundos para a primeira operação, reduz 0,5 por unidade até o piso de 5, mais 8 segundos para Purificação e 12 para Concentração. O som vanilla `UIAlchemyCreatePotion` ou `UIAlchemyCreatePoison` toca somente depois do commit.

O teste provisório de patente limita Novato aos MGEFs `MAG_AlchRestoreHealth` e `MAG_AlchParalysis`; o C++ repete a validação da receita. Patentes superiores não recebem essa restrição.

## Correção 0.1.3 — escala do Apothecary

O teste ingame confirmou `player.hasperk 4F0CB06C = 1`, 30/s na bancada vanilla e 18/s na GuildAlchemy para Wheat + Blue Mountain Flower. O causador é o perk oculto `MAG_ControllerScalingPerk` (`0CB06C:Apothecary.esp`): Restore Health/Magicka/Stamina recebe `1 + Alchemy × 0.00667`, que em Alchemy 100 multiplica 18 por aproximadamente 1.667 e produz 30 após o arredondamento.

A versão 0.1.3 resolve esse perk e suas quatro regras diretamente do JSON. Cada regra só entra quando o jogador realmente possui o controlador e o MGEF carrega uma das keywords correspondentes. Isso cobre os grupos Fortify (`0.015 × Alchemy`), Restore (`0.00667 × Alchemy`), Illusion (`×0.8`) e Damage Health/Magicka/Stamina (`0.0052 × Alchemy`). O log debug registra regra, coeficiente, skill, fator e acumulado por efeito. Os multiplicadores Vokrii continuam separados e entram uma única vez.

## Correção 0.1.2

`GA::Craft()` agora trata a finalização como uma transação verificável. O `AlchemyItem` retornado por `AddPotion` ou `AddPoison` precisa ser não nulo, dinâmico, do tipo correto e estar registrado no mapa correspondente do `BGSCreatedObjectManager`. O log registra tipo, ponteiro, FormID, registro e referência do objeto criado.

O produto é nomeado, adicionado ao jogador e confirmado por diferença de `PlayerCharacter::GetItemCount()` antes de qualquer ingrediente ser removido. Cada remoção também é confirmada pela contagem. Falha de criação ou adição preserva todos os ingredientes; falha posterior de consumo restaura os ingredientes já removidos e retira o produto. Como `Craft()` lança nesses casos, a UI recebe `error` e nunca `crafted`.

## Correção de persistência após a adição

O teste de inventário logo após `AddObjectToContainer` confirmava o item, mas não cobria a liberação do `CreatedObjPtr` ao sair de `Craft()`. Em Skyrim, uma forma alquímica dinâmica também precisa manter uma referência no `BGSCreatedObjectManager`. A versão atual compara a contagem do manager antes e depois da adição: se o caminho direto não adquiriu a referência, transfere uma referência persistente ao item do inventário; se o jogo já a adquiriu, não duplica a contagem. O log passa a registrar `Referência persistente transferida ao inventário` ou `Inventário adquiriu referência do produto`.

## Mod de garrafas no perfil ativo

O perfil ativo contém `Alchemy Requires Bottles Redux.esp`, `Alchemy Requires Bottles - Empty Bottle Patch.esp`, `Craftable Empty Alchemy Bottles.esp`, `ARBR Empty Potion Limiter.esp` e `DEG_DontEatGlass.esp`. O `Activator` `GuildAlchemy_Workbench` não possui `WICraftingAlchemy`; portanto o caminho normal de `OnSit` do Redux não reconhece essa bancada. O script Redux remove apenas `_p7ARBR_EmptyBottle` quando o contador vanilla de poções/venenos aumenta; o limitador só trata garrafas vazias.

O script de vasos `Vessels_ConsumptionScript` tem um caminho separado que, no estado `Crafting`, remove o próprio item recebido quando `PotionVessel.HasForm(item)` é verdadeiro e não há garrafa (`Vessels_PotionFail`). Ele pode explicar o sintoma se a sessão tiver sido colocada nesse estado por uma mesa vanilla e o produto estiver na lista filtrada, mas não há evidência no log atual de que esse evento tenha ocorrido. A persistência do `CreatedObjPtr` era a falha nativa que o código ainda não verificava após a adição.

## Magnitude observada

O vencedor de Wheat e Blue Mountain Flower é `Apothecary.esp`; ambos têm Restore Health com magnitude de ingrediente `0.96`. O perk real do Vokrii (`0BE127:Skyrim.esm`) é uma entrada `ModAlchemyEffectiveness`, `MultiplyOnePlusAVMult`, com valor `0.01`, descrita como 1% por nível de Alchemy. A DLL reproduz essa entrada com o multiplicador de Alchemy Mastery. A diferença restante de 18 para 30 foi localizada no controlador oculto do Apothecary e corrigida na 0.1.3.

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

O pipeline não chama um probe genérico de `ModAlchemyEffectiveness`, pois entry points podem usar formatos que não se reduzem com segurança a um `float*`. Para o setup solicitado, a base usa GMSTs e ActorValues nativos; as integrações Vokrii e Apothecary reproduzem as entradas reais lidas pelo houseCARL e suas keywords.

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
