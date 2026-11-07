# Guild Alchemy — MVP 0.1.7 Meridian

Guild Alchemy adiciona uma bancada profissional separada das mesas vanilla. Nela, o jogador escolhe dois ou três ingredientes reais do inventário, prepara uma receita sem consumo, pode purificar ou concentrar o resultado conforme sua patente e só consome matéria ao finalizar.

## Requisitos herdados da versão anterior

- Skyrim AE `1.6.1170`
- SKSE `2.2.6`
- Address Library for SKSE Plugins compatível com `1.6.1170`
- MeridianUI com API 1.0 compatível (SDK utilizado: 1.5.0)
- Vokrii — `Vokrii - Minimalistic Perks of Skyrim.esp`
- Apothecary — `Apothecary.esp`
- Alchemy Requires Bottles Redux — `Alchemy Requires Bottles Redux.esp`

O plugin é um ESP marcado como light (ESPFE). Ele não altera `Vokrii` nem `Apothecary`.

Esta edição requer MeridianUI. Consulte `MERIDIAN-MIGRATION.md` para instalação, mudanças e limitações. A execução dentro do Skyrim ainda precisa ser validada.

## Instalação

1. Instale `GuildAlchemy-MVP-0.1.7-meridian.zip` como um mod no Mod Organizer 2.
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
4. A partir de Aprendiz, **ESTABILIZAR** reduz uma virtude indesejada conhecida sem eliminá-la. Aprendiz retém 65% do efeito desejado e 50% do indesejado; Adepto 80%/40%; Especialista 85%/30%; Mestre 100%/20%.
5. A partir de Especialista, **PURIFICAR** remove a virtude indesejada conhecida quando há exatamente uma desejada e uma indesejada. O efeito desejado retém 90% no Especialista e 100% no Mestre. Estabilizar e Purificar são alternativas.
6. A partir de Especialista, **CONCENTRAR** escolhe uma virtude conhecida e um ingrediente de suporte. Cada operação consome uma cópia extra desse ingrediente e aplica 110% ou 115% apenas ao eixo seguro de magnitude ou duração.
7. Clique **FINALIZAR**. A barra mostra as etapas escolhidas. Cancelar ou fechar não consome ingredientes. Ao terminar, o C++ recalcula a receita, cria o produto, confirma o inventário e só então consome os ingredientes e uma garrafa vazia por operação.

Fechar a interface antes de finalizar não consome nada. Efeitos não descobertos aparecem como `???`. A busca aceita o nome do ingrediente e os nomes dos efeitos já descobertos.

Os efeitos permitidos por patente estão em `SKSE/Plugins/GuildAlchemy.json`, em `forms.rankEffectLimits`. A lista é cumulativa: Aprendiz mantém os efeitos de Novato, Adepto mantém os anteriores, e assim por diante; Mestre permite todos. O C++ resolve e aplica essa lista, inclusive às virtudes secundárias compartilhadas.

## Lotes e Double Toil and Trouble

Quantidade significa número de operações. Dez operações consomem dez unidades de cada ingrediente base e dez garrafas vazias. Concentração consome também dez unidades extras do reagente escolhido. Double Toil não duplica o custo de garrafas.

O tempo por operação começa em 10 segundos e cai por unidade adicional conforme a patente: Novato −0,25 s até 8 s; Aprendiz −0,35 s até 7,5 s; Adepto −0,5 s até 7 s; Especialista −0,85 s até 5 s; Mestre −1 s até 3 s. Estabilizar acrescenta 6 s, Purificar 8 s e Concentrar 12 s.

Double Toil and Trouble é aplicado uma vez ao total produzido: 10 operações geram 20 produtos. XP e descoberta são calculados pelas 10 operações, sem duplicação pela unidade bônus.

## Cálculo e compatibilidade

- Ingredientes e efeitos vêm dos `TESObjectINGR` vencedores em runtime; não existe tabela vanilla paralela.
- Um efeito entra em ressonância quando aparece em pelo menos dois ingredientes distintos. Em receitas triplas, cada efeito compartilhado entra uma vez.
- A potência base usa `fAlchemyIngredientInitMult`, `fAlchemySkillFactor`, Alchemy atual e os ActorValues de Fortify Alchemy.
- As condições reais de Alchemy Mastery, Physician, Benefactor e Poisoner foram lidas do Vokrii instalado e aplicadas por keyword/contexto.
- O perk oculto `Apothecary Scaling Controller` é resolvido do `Apothecary.esp`; suas quatro regras de escala são aplicadas por keyword, incluindo o multiplicador de Restore Health/Magicka/Stamina que leva 18 para 30 em Alchemy 100.
- O produto usa `BGSCreatedObjectManager::AddPotion/AddPoison`, o mecanismo nativo de formas alquímicas criadas pelo jogador. Um lote adiciona uma definição com `count N`.
- Concentração rejeita efeitos sem um único eixo inequívoco de escala. Isso evita alterar magnitude/duração de forma errada.

## Configuração e log

`SKSE/Plugins/GuildAlchemy.json` contém os FormIDs resolvidos, limites, tempos e multiplicadores. `maxOperations` aceita de 1 a 100. Concentração é validada com teto absoluto de 15%.

Defina `"debug": true` para logs de receita, efeitos, multiplicadores, consumo e fingerprint transacional, além do painel DEBUG da UI.

O log fica em:

```text
Documents/My Games/Skyrim Special Edition/SKSE/GuildAlchemy.log
```

## Limitações atuais

- O binário foi compilado e validado estaticamente, mas este ambiente não executou uma sessão completa dentro do Skyrim. A comparação visual e numérica com a mesa vanilla ainda precisa do roteiro em `VALIDATION.md`.
- A integração de potência cobre o setup solicitado: GMST/ActorValues, os perks Vokrii inspecionados e as quatro regras do controlador do Apothecary 1.3.9. Entry points arbitrários acrescentados por outros overhauls não são interpretados genericamente.
- A posição da bancada em Arcadia precisa de inspeção visual ingame; o record e a referência são válidos, mas colisão/encaixe são espaciais e não podem ser provados por validação de records.
- Matriz é apenas um ponto de extensão de configuração. Fluxo, guild XP e professores não fazem parte deste MVP.

## Roadmap

- Teste comparativo automatizado dentro do runtime contra `AlchemyMenu`.
- Cache estático invalidável para inventários muito grandes.
- Progressão real da Guilda, aulas e provas.
- Categorias de Matriz.

## Código e build

Veja `BUILDING.md`. O núcleo está separado em lifecycle/config (`Plugin.cpp`, `Runtime.cpp`), cálculo e crafting (`Recipe.cpp`), regras puras (`Rules.h`) e Meridian/ativação/transações (`UI.cpp`).

