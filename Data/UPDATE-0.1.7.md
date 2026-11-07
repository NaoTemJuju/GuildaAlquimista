# Guild Alchemy 0.1.7

A área Ressonância mostra o tipo e o nome previstos pela mesma função que nomeia o item final. Estabilizar, Purificar e Concentrar atualizam a prévia após o novo cálculo no C++. A lista de efeitos omite os removidos por Purificar e exibe magnitude e duração apenas quando o efeito é conhecido. Nenhum efeito é fabricado pela interface.

O inventário recebeu cartões de ingredientes com etiquetas de efeitos e ilustrações vetoriais para Blue Mountain Flower, Wheat, Canis Root, Bear Claws, Imp Stool e Nightshade. Os demais usam uma folha genérica. Essas ilustrações **não são imagens dos modelos 3D do Skyrim**: o jogo fornece modelos NIF, que o Prisma/CEF não renderiza diretamente como imagens HTML. A interface mostra o número de tipos de ingrediente presentes no inventário.

Quando `matchVanillaVisuals` é `true` no JSON, o produto dinâmico copia modelo, ícone e ícone de mensagem de um item base de `Skyrim.esm` com o mesmo efeito principal e tipo. A busca usa as formas vencedoras do load order, inclusive overrides do Apothecary. Se não houver exemplar, permanece o visual gerado pelo jogo. Defina `matchVanillaVisuals` como `false` para desativar a cópia visual.

Compilação Release x64, `node --check` e teste de regras CTest concluídos. A aparência dos modelos copiados, o inventário e a interface ainda precisam de teste dentro do Skyrim; este ambiente não executou o jogo.

Teste sugerido: compare no inventário uma criação da Guilda de Restore Health, Restore Stamina, Resist Fire e Paralisia com o equivalente vanilla; confira também o modelo ao largar no chão. Em Ressonância, selecione uma receita mista e confirme que a lista e o nome previsto mudam após Estabilizar, Purificar ou Concentrar. Se houver problema visual, mude `matchVanillaVisuals` para `false`, reinicie o jogo e repita a criação.
