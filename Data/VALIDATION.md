# Roteiro de validação ingame

Use um save descartável e ative logging debug somente durante o teste.

## Regressão da finalização corrigida em 0.1.2

1. Confirme no log do SKSE que `GuildAlchemy` informa versão `0.1.2`.
2. Prepare e finalize uma poção; confirme o aumento exato no inventário e o consumo exato dos ingredientes.
3. Repita com um veneno e com lote maior que um.
4. Confira em `GuildAlchemy.log` as linhas `Produto criado`, `Adicionando produto`, `Resultado da adição` e `Consumo`.
5. A UI só pode mostrar produção concluída quando `adicionado` for igual à quantidade solicitada.

## Regressão do crash corrigido em 0.1.1

1. Confirme que a correção 0.1.1 continua válida na versão `0.1.2`.
2. Entre na Arcadia's Cauldron e ative a Bancada de Alquimia da Guilda.
3. Confirme que a interface abre e exibe o valor atual de Alchemy sem gerar crash log.
4. Feche e reabra a bancada duas vezes para validar o ciclo de foco do Prisma UI.

## Inicialização

- Confirme `GuildAlchemy.dll` no log do SKSE e `Prisma UI pronta` em `GuildAlchemy.log`.
- Entre em Arcadia's Cauldron e confirme que a bancada nova aparece sem substituir a mesa vanilla.
- Sem patente, a UI pode abrir para explicar o requisito, mas `PREPARAR` permanece bloqueado.

## Patentes

Para cada rank, adicione o perk pelo console, ative a bancada e confira Alchemy mínima e perks Vokrii. No Mestre, confirme Double Toil and Trouble e confirme que Purity continua ausente.

## Comparação base

1. Anote Alchemy, equipamentos e perks.
2. Na mesa vanilla, crie uma poção com dois ingredientes e registre efeitos, magnitude, duração e valor.
3. Recarregue o save, use os mesmos ingredientes na Bancada da Guilda sem processos especiais e compare.
4. Repita com três ingredientes, um veneno e um efeito baseado em duração.

Qualquer diferença deve ser registrada com os FormIDs dos ingredientes, MGEFs e trecho de `GuildAlchemy.log`.

## Purificação

- Adepto: remova uma virtude de uma receita multiefeito e confirme restantes ×0,90.
- Especialista: repita e confirme ×0,95.
- Mestre: repita e confirme ×1,00.
- Feche a UI depois de `PREPARAR`; confirme que o inventário não mudou.

## Concentração

- Especialista: confirme alvo ×1,10, demais inalterados e uma cópia extra do reagente consumida por operação.
- Mestre: confirme ×1,15.
- Tente efeito ambíguo/sem eixo de potência; a operação deve ser recusada sem consumo.

## Lotes, transação e persistência

- Teste quantidade 1 e 10.
- Entre o preview e Finalizar, remova um ingrediente pelo console; a finalização deve falhar sem consumo parcial.
- Com Mestre, 10 operações devem produzir 20 itens, sem segundo dobramento.
- Salve, saia, carregue e confirme que a poção continua no inventário, pode ser consumida, vendida, armazenada e transferida.
- Compare o ganho de XP para 1 e 10 operações; o bônus de Double Toil não deve dobrar XP outra vez.
