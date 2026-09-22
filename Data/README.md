# Guild Alchemy — MVP 0.1.2

Guild Alchemy adiciona uma bancada profissional separada das mesas vanilla. Nela, o jogador escolhe dois ou três ingredientes reais do inventário, prepara uma receita sem consumo, pode purificar ou concentrar o resultado conforme sua patente e só consome matéria ao finalizar.

## Requisitos verificados neste modlist

- Skyrim AE `1.6.1170`
- SKSE `2.2.6`
- Address Library for SKSE Plugins compatível com `1.6.1170`
- Prisma UI `1.4.1`
- Vokrii — `Vokrii - Minimalistic Perks of Skyrim.esp`
- Apothecary — `Apothecary.esp`

O plugin é um ESP marcado como light (ESPFE). Ele não altera `Vokrii` nem `Apothecary`.

## Instalação

1. Instale `GuildAlchemy-MVP-0.1.2.zip` como um mod no Mod Organizer 2.
2. Ative o mod e `GuildAlchemy.esp`.
3. Deixe `GuildAlchemy.esp` depois de `Shadows.esp`, porque ele preserva a versão vencedora da célula de Arcadia e acrescenta apenas a bancada.
4. Inicie o jogo pelo SKSE.

Uma cópia de desenvolvimento também foi instalada em `houseCARL - GuildAlchemy`. O houseCARL a reportou como **UNLISTED**; atualize a lista de mods do MO2 e ative-a antes de testar.

## Como abrir a bancada

Há uma Bancada de Alquimia da Guilda em **Arcadia's Cauldron**, ao lado do laboratório tradicional. A bancada vanilla continua normal.

Para colocar outra bancada via console:

```text
help "Bancada de Alquimia da Guilda" 4 ACTI
player.placeatme <FormID mostrado pelo help>
```

## Como testar as patentes

As patentes são perks ocultos, cumulativos e independentes do nível de Alchemy. Alchemy alta não concede patente automaticamente. Use `help` para obter o FormID de runtime do seu load order:

```text
help "Guilda dos Alquimistas - Novato" 4 PERK
help "Guilda dos Alquimistas - Aprendiz" 4 PERK
help "Guilda dos Alquimistas - Adepto" 4 PERK
help "Guilda dos Alquimistas - Especialista" 4 PERK
help "Guilda dos Alquimistas - Mestre" 4 PERK
player.addperk <FormID>
```

Depois, feche o console e ative a bancada. `SyncGuildAlchemyRank()` concede os ranks inferiores, nunca reduz Alchemy e sincroniza:

| Patente | Alchemy mínima | Vokrii |
|---|---:|---|
| Novato | 20 | Alchemy Mastery |
| Aprendiz | 40 | Physician |
| Adepto | 60 | Benefactor, Poisoner |
| Especialista | 80 | Experimenter, Green Thumb |
| Mestre | 100 | Double Toil and Trouble |

`Purity` (`0005821D`) nunca é concedido, removido ou alterado.

## Uso

1. Selecione dois ou três ingredientes.
2. Ajuste **Quantidade** entre 1 e o máximo calculado do inventário.
3. Clique **PREPARAR**. O C++ calcula o preview; nada é consumido.
4. A partir de Adepto, **PURIFICAR** remove uma virtude conhecida. As demais ficam em 90%, 95% ou 100%, conforme o rank.
5. A partir de Especialista, **CONCENTRAR** escolhe uma virtude conhecida e um ingrediente de suporte. Cada operação consome uma cópia extra desse ingrediente e aplica 110% ou 115% apenas ao eixo seguro de magnitude ou duração.
6. Clique **FINALIZAR**. O C++ recalcula a receita, confere sessão, token, patente, inventário e custos; só então cria o produto e consome os ingredientes.

Fechar a interface antes de finalizar não consome nada. Efeitos não descobertos aparecem como `???`.

## Lotes e Double Toil and Trouble

Quantidade significa número de operações. Dez operações consomem dez unidades de cada ingrediente base. Concentração consome também dez unidades extras do reagente escolhido.

Double Toil and Trouble é aplicado uma vez ao total produzido: 10 operações geram 20 produtos. XP e descoberta são calculados pelas 10 operações, sem duplicação pela unidade bônus.

## Cálculo e compatibilidade

- Ingredientes e efeitos vêm dos `TESObjectINGR` vencedores em runtime; não existe tabela vanilla paralela.
- Um efeito entra em ressonância quando aparece em pelo menos dois ingredientes distintos. Em receitas triplas, cada efeito compartilhado entra uma vez.
- A potência base usa `fAlchemyIngredientInitMult`, `fAlchemySkillFactor`, Alchemy atual e os ActorValues de Fortify Alchemy.
- As condições reais de Alchemy Mastery, Physician, Benefactor e Poisoner foram lidas do Vokrii instalado e aplicadas por keyword/contexto.
- O produto usa `BGSCreatedObjectManager::AddPotion/AddPoison`, o mecanismo nativo de formas alquímicas criadas pelo jogador. Um lote adiciona uma definição com `count N`.
- Concentração rejeita efeitos sem um único eixo inequívoco de escala. Isso evita alterar magnitude/duração de forma errada.

## Configuração e log

`SKSE/Plugins/GuildAlchemy.json` contém os FormIDs resolvidos, limites e multiplicadores. `maxOperations` aceita de 1 a 100. Concentração é validada com teto absoluto de 15%.

Defina `"debug": true` para logs de receita, efeitos, multiplicadores, consumo e fingerprint transacional, além do painel DEBUG da UI.

O log fica em:

```text
Documents/My Games/Skyrim Special Edition/SKSE/GuildAlchemy.log
```

## Limitações atuais

- O binário foi compilado e validado estaticamente, mas este ambiente não executou uma sessão completa dentro do Skyrim. A comparação visual e numérica com a mesa vanilla ainda precisa do roteiro em `VALIDATION.md`.
- A integração de potência cobre o setup solicitado: GMST/ActorValues do jogo e os perks Vokrii inspecionados. Entry points arbitrários acrescentados por outros perk overhauls não são interpretados genericamente.
- A posição da bancada em Arcadia precisa de inspeção visual ingame; o record e a referência são válidos, mas colisão/encaixe são espaciais e não podem ser provados por validação de records.
- Matriz é apenas um ponto de extensão de configuração. Fluxo, guild XP, professores, rede e economia multiplayer não fazem parte deste MVP.

## Roadmap

- Teste comparativo automatizado dentro do runtime contra `AlchemyMenu`.
- Cache estático invalidável para inventários muito grandes.
- Progressão real da Guilda, aulas e provas.
- Categorias de Matriz e integração multiplayer autoritativa.

## Código e build

Veja `BUILDING.md`. O núcleo está separado em lifecycle/config (`Plugin.cpp`, `Runtime.cpp`), cálculo e crafting (`Recipe.cpp`), regras puras (`Rules.h`) e Prisma/ativação/transações (`UI.cpp`).
