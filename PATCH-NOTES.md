# Notas do patch aplicado neste pacote

## 1. Criação de poção — referência persistente (src/Recipe.cpp)

`CommitProduct()` já confirmava que o produto tinha sido registrado pelo
`BGSCreatedObjectManager` e que a contagem no inventário do jogador batia,
mas nunca cuidava de quem, depois disso, continuava segurando uma
referência ao formulário dinâmico. O ponteiro inteligente `created`
(`RE::BSTSmartPointer<RE::AlchemyItem>` para veneno, `RE::CreatedObjPtr<RE::AlchemyItem>`
para poção) é a referência inicial do próprio manager; ele é destruído ao
sair do escopo de `Craft()`. Se nada mais tivesse adquirido uma referência
própria até ali, essa destruição podia derrubar a última referência que o
manager conhecia — mesmo com o item já contado no inventário do jogador
por FormID.

Adicionei `PersistProductReference()` (template, uma lista estática por
tipo de ponteiro) que, logo depois de `CommitProduct()` ter sucesso mas
ainda dentro do escopo de `created`:

1. Relê o `refCount` do produto no registro do manager (`IsRegisteredProduct`,
   já existente).
2. Se `refCount <= 1` (só a referência inicial), guarda uma cópia de
   `created` numa lista estática que vive pelo tempo de sessão do plugin —
   isso incrementa a contagem de referência do próprio ponteiro
   inteligente e garante que ela nunca cai a zero.
3. Caso o jogo já tenha adquirido sua própria referência (`refCount > 1`),
   não duplica nada, só registra no log.

Isso usa somente operações que já compilavam neste código (cópia dos
mesmos tipos de ponteiro já retornados por `AddPotion`/`AddPoison`), sem
depender de nenhuma API do `BGSCreatedObjectManager` que eu não tivesse
como verificar aqui.

**Limitação honesta:** não tenho como compilar nem rodar isso dentro do
Skyrim neste ambiente (sem toolchain MSVC, sem CommonLibSSE-NG, sem rede).
A lógica é sólida e usa apenas o que já funcionava no seu build anterior,
mas peço que rode o roteiro de regressão do `VALIDATION.md` (criar,
salvar, sair, carregar, vender) depois de recompilar.

## 2. Magnitude / perks — não encontrei bug

Refiz as contas do `Recipe.cpp` (linhas ~224-280) à mão com a fórmula
oficial verificada do Skyrim (UESP): 

```
Resultado = fAlchemyIngredientInitMult × BaseMag × SkillMult
          × Alchemist[1.0–2.0] × Benefactor[1.25] × Physician[1.25] × Poisoner[1.25]
```

Com `fAlchemyIngredientInitMult=4`, `fAlchemySkillFactor=1.5`, Alchemy 100,
BaseMag=0.96 (o valor real do Apothecary para Restore Health, citado no
próprio REPORT.md) e as três perks Vokrii ativas (Alchemy Mastery = 1%
por nível = 2.0× em 100; Benefactor e Physician = 25% cada, porque Restore
Health é ao mesmo tempo "restore" e "beneficial"):

```
4 × 0.96 × 1.5 × 2.0 × 1.25 × 1.25 = 18.0
```

Esse é exatamente o `mag=18` do seu log. O código em `src/Recipe.cpp` já
implementa essa fórmula corretamente, e os textos reais das perks do
Vokrii (`docs/evidence/vokrii-verified.txt`) confirmam os mesmos números
("1% per level of Alchemy", "25% stronger"). Não mudei nada nessa parte.

O "esperado 30" citado no REPORT.md antigo não tem, pelo que vi, nenhuma
verificação por trás — o próprio REPORT.md admite que o binário nunca
tinha sido executado dentro do jogo antes daquela sessão. Antes de
assumir que ainda há bug de magnitude, vale rodar a comparação real do
`VALIDATION.md` (mesmos ingredientes, mesmo personagem, na mesa vanilla)
e ver se ela também dá 18 — se der, o "problema" era só a expectativa
errada do relatório anterior, não o código.

Um ponto que não toquei por não ter como verificar aqui: a linha usa
`RE::ActorValue::kAlchemyPowerModifier` somado a `kAlchemyModifier` para
o bônus de Fortify Alchemy do equipamento. Não tenho os headers do
CommonLibSSE-NG neste ambiente para confirmar se essa AV existe e faz o
que o nome sugere. Se quiser, teste equipando/removendo um item de
Fortify Alchemy e comparando o log — se o número mudar de forma
consistente com a % do item, está correto.
