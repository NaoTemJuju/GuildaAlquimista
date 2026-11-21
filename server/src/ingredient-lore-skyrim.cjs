'use strict';

/**
 * Descricoes alquimicas coerentes (4 virtudes por ingrediente) — Skyrim.esm (94 itens).
 * Cada entrada corresponde exatamente aos 4 efeitos reais registrados em GuildAlchemy.esp.
 */
const SKYRIM_INGREDIENT_LORE = {
  // 85. Ramo de Cardo: 1:Fortalecer Vigor | 2:Resistência Venenosa | 3:Fortalecer Conjuração | 4:Danificar Saúde
  'Skyrim.esm|0134AA': [
    'Os talos tenros cozidos em caldo leve sustentam o ritmo muscular e ampliam o vigor máximo.',
    'As folhas espinhosas em infusão amarga protegem o fígado e aumentam a resistência a venenos.',
    'O miolo arroxeado da flor estabiliza vínculos etéreos e fortalece práticas de Conjuração.',
    'Os espinhos macerados sem filtragem liberam uma toxina áspera que agride os tecidos vitais.',
  ],

  // 86. Bagas de Neve: 1:Restaurar Mágicka | 2:Resistência Gélida | 3:Fortalecer Velocidade | 4:Fortalecer Arrombamento
  'Skyrim.esm|01B3BD': [
    'O sumo claro das bagas geladas refresca a mente cansada e recompõe rapidamente a Magicka.',
    'A película cerosa da casca retém equilíbrio térmico que protege o corpo contra o frio severo.',
    'A polpa fermentada levemente desperta os reflexos motores e acelera os passos.',
    'O óleo seco das sementes diminutas aguça a firmeza dos dedos ao manipular trancas complexas.',
  ],

  // 87. Raiz de Jarrin: 1:Paralisia | 2:Absorção de Feitiço | 3:Invisibilidade | 4:Danificar Saúde Prolongado
  'Skyrim.esm|01BCBC': [
    'A resina negra do centro da raiz trava os nervos em segundos e imobiliza o corpo por completo.',
    'As fibras densas e raras atraem cargas arcanas alheias, absorvendo feitiços hostis no impacto.',
    'O vapor frio destilado das radicelas dobra a luz ao redor da pele até apagar a silhueta.',
    'Uma fração mínima do extrato corrói lentamente os órgãos vitais, drenando a saúde sem cessar.',
  ],

  // 88. Ovo de Tordo: 1:Fortalecer Uma-Mão | 2:Regenerar Vigor | 3:Comando | 4:Ficar Etéreo
  'Skyrim.esm|023D6F': [
    'A gema alaranjada nutre os tendões do braço dominante e melhora golpes com armas de uma mão.',
    'A clara batida em solução suave devolve fôlego contínuo aos músculos durante o esforço.',
    'A membrana interna seca exala um aroma agudo que ajuda a subjugar bestas e animais menores.',
    'A casca azulada calcificada em fogo brando confere leveza passageira que atenua a solidez física.',
  ],

  // 89. Ovo de Galinha: 1:Fortalecer Uma-Mão | 2:Calmaria | 3:Armadura de Dano | 4:Fortalecer Ilusão
  'Skyrim.esm|023D77': [
    'A proteína densa da gema firma a pegada e fortalece a força de impacto em armas de uma mão.',
    'A emulsão morna da clara aplaca nervos agitados e induz serenidade em alvos irritados.',
    'A casca moída em vinagre forte libera sais corrosivos que enfraquecem a defesa de armaduras.',
    'A película fina sob a casca dispersa a luz sutilmente, reforçando encantamentos de Ilusão.',
  ],

  // 90. Beladona: 1:Danificar Saúde | 2:Fortalecer Defesa de Armadura | 3:Fortalecer Arrombamento | 4:Regenerar Mágicka
  'Skyrim.esm|02F44C': [
    'As folhas escuras e as bagas guardam alcaloides letais que agridem diretamente o coração.',
    'A seiva grossa do caule, quando aplicada em bálsamo externo, endurece e reforça a armadura.',
    'O óleo sutil das flores pendentes aguça o tato fino necessário para destravar fechaduras.',
    'Em microdose purificada, o extrato noturno acelera a recuperação contínua da Magicka.',
  ],

  // 91. Pó de Osso: 1:Fortalecer Capacidade de Carga | 2:Resistência Elétrica | 3:Fortalecer Bloqueio | 4:Fortalecer Arrombamento
  'Skyrim.esm|034CDD': [
    'Os sais calcários finos fortalecem ossos e lombar, ampliando a carga física suportada.',
    'A farinha seca atua como isolante mineral e reduz os danos causados por descargas elétricas.',
    'A mistura espessa enrijece os punhos e aumenta a firmeza ao aparar golpes com o escudo.',
    'Os grãos uniformes da moagem absorvem a umidade das mãos e melhoram o manejo de gazuas.',
  ],

  // 92. Porção de Sal: 1:Restaurar Vigor | 2:Curar Doenças | 3:Fortalecer Alteração | 4:Fortalecer Pontaria
  'Skyrim.esm|034CDF': [
    'Os cristais dissolvidos em água limpa repõem sais perdidos no suor e restauram o vigor.',
    'A salmoura concentrada limpa ferimentos e auxilia o corpo a expulsar enfermidades comuns.',
    'A pureza cristalina do mineral estabiliza transformações físicas em feitiços de Alteração.',
    'O sal fino reduz a fadiga ocular e mantém o pulso firme ao mirar com precisão.',
  ],

  // 93. Alho: 1:Restaurar Saúde | 2:Curar Doenças | 3:Fortalecer Rugidos | 4:Debilidade Ígnea
  'Skyrim.esm|034D22': [
    'O sumo claro extraído do bulbo recém-esmagado aquece a circulação e auxilia o fechamento de cortes superficiais.',
    'Os gomos fervidos sob película íntegra exalam vapores pungentes capazes de purgar miasmas e doenças comuns.',
    'Quando reduzida a óleo espesso, a casca seca dos dentes aquece a garganta e amplia a ressonância dos rugidos.',
    'O resíduo cáustico concentrado no coração do bulbo resseca a pele e a torna vulnerável às chamas.',
  ],

  // 94. Orelha de Elfo: 1:Restaurar Vigor | 2:Resistência Elétrica | 3:Fortalecer Alteração | 4:Fortalecer Desarmado
  'Skyrim.esm|034D31': [
    'As folhas alongadas e secas em chá leve devolvem rapidamente o fôlego após longas jornadas.',
    'A penugem fina da superfície dispersa eletricidade estática e protege contra raios.',
    'O talo endurecido fixa bem reagentes minerais, fortalecendo conjurações de Alteração.',
    'As nervuras firmes da folha nutrem os tendões das mãos para golpes desarmados mais potentes.',
  ],

  // 95. Mirriam do Gelo: 1:Restaurar Mágicka | 2:Resistência Gélida | 3:Comando | 4:Debilidade Venenosa
  'Skyrim.esm|034D32': [
    'Os ramos aromáticos resfriados liberam um vapor límpido que recompõe a Magicka gasta.',
    'Os óleos adaptados às nevascas aquecem as extremidades e protegem contra o frio intenso.',
    'O perfume penetrante das folhas secas impõe autoridade sobre criaturas vacilantes.',
    'A fração mais amarga do caule abre os poros e deixa o corpo vulnerável a venenos.',
  ],

  // 96. Ovos de Chaurus: 1:Danificar Saúde Prolongado | 2:Danificar Mágicka Prolongado | 3:Danificar Vigor Prolongado | 4:Invisibilidade
  'Skyrim.esm|03AD56': [
    'O líquido turvo da bolsa embrionária contém ácido lento que consome a saúde sem pausa.',
    'Os sais cavernosos do invólucro rompem o fluxo arcano e drenam a Magicka continuamente.',
    'A albumina densa asfixia as fibras musculares, esgotando o vigor ao longo de vários segundos.',
    'Filtrado em álcool puro sob escuridão, o fluido gelatinoso refrata a luz e oculta o corpo.',
  ],

  // 97. Coração de Daedra: 1:Fortalecer Persuasão | 2:Acender/Luz | 3:Fortalecer Rugidos | 4:Abafar
  'Skyrim.esm|03AD5B': [
    'O sangue flamejante de Oblivion infunde magnetismo imperioso à voz em qualquer negociação.',
    'As brasas ainda vivas nas câmaras cardíacas liberam claridade intensa ao redor do usuário.',
    'O pulso denso do músculo planar amplifica o fôlego e o alcance trovejante dos rugidos.',
    'As cinzas escuras da membrana externa absorvem vibrações e silenciam o som dos passos.',
  ],

  // 98. Orelha de Falmer: 1:Fortalecer Duas-mãos | 2:Fortalecer Pontaria | 3:Fortalecer Conjuração | 4:Fortalecer Defesa de Armadura
  'Skyrim.esm|03AD5D': [
    'A cartilagem rígida e fria concentra tensão nos ombros, fortalecendo armas de duas mãos.',
    'Os canais auditivos sensíveis aguçam o senso de distância e a precisão de disparos.',
    'Os ecos subterrâneos presos ao tecido reforçam vínculos sombrios de Conjuração.',
    'O couro espesso cozido em sebo endurece placas e melhora a proteção da armadura.',
  ],

  // 99. Sais de Fogo: 1:Calmaria | 2:Danificar Vigor Prolongado | 3:Fortalecer Arrombamento | 4:Fortalecer Furtividade
  'Skyrim.esm|03AD5E': [
    'Quando diluídos até restar apenas calor brando, os grãos relaxam os nervos e trazem calmaria.',
    'Em dose ofensiva, a brasa cristalina queima as reservas musculares e drena vigor sem cessar.',
    'O pó seco aquece as pontas dos dedos e melhora a destreza fina contra fechaduras.',
    'A fumaça tênue dos cristais temperados disfarça o contorno térmico em movimentos furtivos.',
  ],

  // 100. Sais de Gelo: 1:Fortalecer Alteração | 2:Fortalecer Conjuração | 3:Fortalecer Ataques de Poder | 4:Fortalecer Duas-mãos
  'Skyrim.esm|03AD5F': [
    'Os cristais gélidos congelam a forma da mistura e potencializam magias de Alteração.',
    'A frieza planar dos grãos estabiliza invocações ligadas aos reinos de Conjuração.',
    'A contração térmica nos músculos concentra força explosiva para ataques pesados de poder.',
    'Os sais dissolvidos enrijecem os braços para sustentar golpes amplos com armas de duas mãos.',
  ],

  // 101. Sais Nulos: 1:Paralisia | 2:Acender/Luz | 3:Resistência Mágica | 4:Silêncio
  'Skyrim.esm|03AD60': [
    'A poeira carregada do Vazio interrompe impulsos nervosos e paralisa a vítima no instante.',
    'Os grãos ionizados faíscam sob reação leve, irradiando luz clara na escuridão.',
    'A natureza absorvente dos sais neutraliza descargas mágicas hostis antes do impacto.',
    'O pó escuro fecha a ressonância vocal e silencia conjuradores atingidos.',
  ],

  // 102. Coração de Espinhos: 1:Fortalecer Persuasão | 2:Acender/Luz | 3:Frenesi | 4:Fortalecer Velocidade
  'Skyrim.esm|03AD61': [
    'A seiva selvagem do cerne desperta fervor contagiante que torna a palavra mais convincente.',
    'Os filamentos vivos presos aos espinhos emitem luminescência verde-pálida no escuro.',
    'O sangue ritualístico ainda pulsante inflama a raiva e lança alvos em fúria cega.',
    'O estímulo brutal da semente acelera o pulso e torna os movimentos muito mais velozes.',
  ],

  // 103. Ectoplasma: 1:Debilidade Ígnea | 2:Debilidade Elétrica | 3:Fortalecer Destruição | 4:Fortalecer Restauração
  'Skyrim.esm|03AD63': [
    'O resíduo espectral resseca o equilíbrio térmico e deixa a pele exposta a chamas.',
    'A névoa condensada conduz eletricidade com facilidade e agrava danos de choque.',
    'A energia residual desencarnada alimenta a violência de feitiços de Destruição.',
    'Quando purificada em luz branda, a essência espiritual fortalece bênçãos de Restauração.',
  ],

  // 104. Dedão de Gigante: 1:Medo | 2:Comando | 3:Fortalecer Pontaria | 4:Fortalecer Bloqueio
  'Skyrim.esm|03AD64': [
    'O odor denso de couro e terra desperta terror instintivo em oponentes impressionáveis.',
    'A força bruta impressa na falange projeta autoridade natural sobre criaturas menores.',
    'Os tendões grossos fervidos dão estabilidade firme aos braços ao mirar com precisão.',
    'A calosidade espessa e a unha dura fortalecem o apoio para aparar ataques com escudo.',
  ],

  // 105. Penas de Bruxa-harpia: 1:Danificar Mágicka | 2:Fortalecer Defesa de Armadura | 3:Fortalecer Velocidade | 4:Fortalecer Ilusão
  'Skyrim.esm|03AD66': [
    'As bárbulas negras carregam malícia ritual que desfaz o foco e drena a Magicka.',
    'Os cálamos rígidos cozidos em resina criam uma camada resistente sobre armaduras.',
    'A plumagem leve destilada em álcool acelera o ritmo dos passos em corrida.',
    'Os pigmentos sombrios das pontas distorcem a percepção e fortalecem feitiços de Ilusão.',
  ],

  // 106. Dentes de Espectro de Gelo: 1:Fortalecer Rugidos | 2:Danificar Saúde Prolongado | 3:Abafar | 4:Debilidade Venenosa
  'Skyrim.esm|03AD6A': [
    'As lascas translúcidas ressoam com o ar frio e amplificam a potência dos rugidos.',
    'O gelo cortante moído fere internamente aos poucos, reduzindo a saúde continuamente.',
    'A frieza silente da criatura amortece o som dos passos mesmo em piso duro.',
    'O esmalte gélido reduz as defesas do sangue e deixa o organismo vulnerável a venenos.',
  ],

  // 107. Cauda de Skeever: 1:Resistência Venenosa | 2:Silêncio | 3:Caminhar Sobre a Água | 4:Fortalecer Rugidos
  'Skyrim.esm|03AD6F': [
    'Os tecidos resistentes de esgoto criam tolerância orgânica contra diversas peçonhas.',
    'Os tendões secos fervidos em pasta espessa travam a garganta e emudecem magos.',
    'A pele oleosa e leve da cauda transfere repulsão à água para caminhar sobre lagos.',
    'A cartilagem rija aquecida com especiarias abre a voz e fortalece o alcance dos rugidos.',
  ],

  // 108. Escamas de Peixe-assassino: 1:Respiração Aquática | 2:Regenerar Vigor | 3:Fortalecer Restauração | 4:Medo
  'Skyrim.esm|03AD70': [
    'As placas escamosas de rio mantêm afinidade aquática capaz de sustentar o fôlego submerso.',
    'Os sais minerais raspados da borda devolvem vigor aos músculos de forma contínua.',
    'O pó limpo das escamas claras fortalece encantamentos curativos de Restauração.',
    'O odor metálico de sangue preso aos dentes das escamas provoca pânico em presas.',
  ],

  // 109. Raiz Nodosa: 1:Danificar Saúde | 2:Regenerar Vigor | 3:Fortalecer Furtividade | 4:Fortalecer Desarmado
  'Skyrim.esm|03AD71': [
    'A seiva bruta do nó central é cáustica e fere os órgãos internos se aplicada como veneno.',
    'Os nós fibrosos fervidos em caldo doce sustentam a recuperação contínua do vigor.',
    'A casca escura e fosca abranda o atrito dos movimentos e favorece a furtividade.',
    'A madeira densa e elástica fortalece os tendões dos punhos para combate desarmado.',
  ],

  // 110. Gordura de Troll: 1:Resistência Ígnea | 2:Regenerar Saúde | 3:Fortalecer Furto | 4:Fortalecer Ataques de Poder
  'Skyrim.esm|03AD72': [
    'Apesar da fraqueza da fera, a gordura purificada forma um isolante espesso contra o fogo.',
    'O sebo vital conserva a célebre regeneração do troll, fechando feridas continuamente.',
    'O óleo fino separado na decantação lubrifica os dedos para ações rápidas de furto.',
    'A energia bruta da camada adiposa dá peso explosivo a golpes carregados.',
  ],

  // 111. Pó Brilhante: 1:Ficar Etéreo | 2:Invisibilidade | 3:Regenerar Mágicka | 4:Refletir Danos
  'Skyrim.esm|03AD73': [
    'A poeira luminosa quase imaterial atenua a densidade corporal e torna o usuário etéreo.',
    'As partículas cintilantes refratam a luz ambiente até ocultar completamente o portador.',
    'O resíduo etéreo alimenta os canais arcanos e acelera a regeneração de Magicka.',
    'A aura tensionada ao redor da pele devolve parte dos golpes sofridos ao atacante.',
  ],

  // 112. Pó de Vampiro: 1:Fortalecer Destruição | 2:Armadura de Dano | 3:Regenerar Vigor | 4:Burden (Peso)
  'Skyrim.esm|03AD76': [
    'As cinzas antigas guardam vigor sombrio que intensifica feitiços ofensivos de Destruição.',
    'O resíduo cáustico dos restos mortais corrói a resistência das armaduras atingidas.',
    'A essência noturna preservada no pó sustenta a recuperação contínua do vigor físico.',
    'Quando umedecido em veneno pesado, o pó torna os membros do alvo duros como pedra.',
  ],

  // 113. Algodão da Tundra: 1:Fortalecer Vigor | 2:Fortalecer Barganha | 3:Resistência Mágica | 4:Ficar Etéreo
  'Skyrim.esm|03F7F8': [
    'As fibras macias fervidas com ervas secas aquecem os pulmões e ampliam o vigor.',
    'O aroma limpo dos capulhos acalma o trato social e favorece acordos de barganha.',
    'Os tufos brancos prensados filtram correntes arcanas e protegem contra magia hostil.',
    'A leveza aérea das plumas destiladas atenua o peso físico e torna o corpo etéreo.',
  ],

  // 114. Lavanda: 1:Restaurar Mágicka | 2:Fortalecer Mágicka | 3:Caminhar Sobre a Água | 4:Debilidade Gélida
  'Skyrim.esm|045C28': [
    'A essência floral serena a mente fatigada e recompõe rapidamente a Magicka gasta.',
    'Os óleos aromáticos das espigas expandem o reservatório arcano do conjurador.',
    'A película fina do extrato vegetal permite equilibrar os passos sobre a superfície da água.',
    'O frescor intenso da flor resfria as extremidades e aumenta a vulnerabilidade ao gelo.',
  ],

  // 115. Trigo: 1:Restaurar Vigor | 2:Fortalecer Capacidade de Carga | 3:Caminhar Sobre a Água | 4:Fortalecer Furto
  'Skyrim.esm|04B0BA': [
    'Os grãos dourados macerados em caldo nutritivo devolvem vigor imediato após o cansaço.',
    'A palha e o germe cozidos fortalecem a musculatura de suporte para carregar mais peso.',
    'O amido leve em emulsão aérea sustenta o passo firme mesmo sobre águas rasas ou fundas.',
    'O pó fino da casca seca mantém as mãos enxutas e rápidas para furtos discretos.',
  ],

  // 116. Amanita Voadora: 1:Danificar Mágicka | 2:Debilidade Venenosa | 3:Fortalecer Furto | 4:Fortalecer Pontaria
  'Skyrim.esm|04DA00': [
    'As pintas brancas do chapéu vermelho perturbam o foco arcano e drenam a Magicka.',
    'O suco cru das lamelas enfraquece as barreiras do organismo contra outros venenos.',
    'Os esporos secos estimulam reflexos rápidos nos dedos para manobras ágeis de furto.',
    'A pequena dose do fungo aguça a atenção visual e melhora a precisão na pontaria.',
  ],

  // 117. Coroa Sangrenta: 1:Danificar Mágicka | 2:Fortalecer Saúde | 3:Fortalecer Arrombamento | 4:Fortalecer Desarmado
  'Skyrim.esm|04DA20': [
    'A polpa escarlate suga a clareza mental do alvo e reduz sua reserva de Magicka.',
    'Cozida em fogo lento, a base carnuda fortalece o sangue e eleva a saúde máxima.',
    'O óleo fino da coroa dá sensibilidade precisa ao tato para abrir trancas difíceis.',
    'As fibras densas do talo dão firmeza adicional aos punhos no combate desarmado.',
  ],

  // 118. Chapéu Branco: 1:Resistência Venenosa | 2:Medo | 3:Fortalecer Ataques Furtivos | 4:Ficar Etéreo
  'Skyrim.esm|04DA22': [
    'A carne pálida neutraliza toxinas cavernosas e amplia a resistência contra venenos.',
    'Os esporos frios soltos no ar causam alucinações breves e despertam medo súbito.',
    'O extrato seco do chapéu aguça a precisão mortal de ataques desferidos ocultamente.',
    'A textura quase translúcida do topo desfaz a rigidez do corpo e o torna etéreo.',
  ],

  // 119. Fezes de Diabrete: 1:Danificar Saúde | 2:Fortalecer Saúde | 3:Fortalecer Arrombamento | 4:Fortalecer Ataques de Poder
  'Skyrim.esm|04DA23': [
    'As lamelas alaranjadas concentram toxina fúngica severa que fere gravemente a saúde.',
    'Quando fervido e decantado com cuidado, o núcleo claro fortalece a resistência vital.',
    'Os esporos finos do cogumelo aumentam a paciência e firmeza ao manipular gazuas.',
    'A massa compacta do talo libera vigor brusco que potencializa ataques de poder.',
  ],

  // 120. Podridão de Namira: 1:Danificar Saúde | 2:Debilidade Elétrica | 3:Fortalecer Pontaria | 4:Fortalecer Desarmado
  'Skyrim.esm|04DA24': [
    'O fungo pálido carrega miasma putrefato que agride rapidamente a saúde de quem o ingere.',
    'Os filamentos úmidos tornam a pele sensível a descargas estáticas e danos elétricos.',
    'O pó seco dos esporos limpa a visão turva e firma a mira em disparos à distância.',
    'As raízes fibrosas enrijecem os músculos dos braços para golpes desarmados pesados.',
  ],

  // 121. Botão-de-Ouro: 1:Danificar Vigor | 2:Arma de Dano | 3:Fortalecer Defesa de Armadura | 4:Regenerar Mágicka
  'Skyrim.esm|04DA25': [
    'As pétalas ácidas irritam a musculatura e drenam o vigor físico do adversário.',
    'A seiva amarga do talo enfraquece a firmeza dos braços e diminui o poder das armas.',
    'Quando reduzida a cera espessa, a flor endurece o revestimento e reforça a armadura.',
    'O néctar brilhante do centro mantém o fluxo arcano estável e regenera a Magicka.',
  ],

  // 122. Tórax de Vaga-lume: 1:Debilidade Ígnea | 2:Resistência Ígnea | 3:Fortalecer Bloqueio | 4:Fortalecer Furtividade
  'Skyrim.esm|04DA73': [
    'Os óleos fósforos da lanterna abdominal inflamam com calor externo e ampliam o dano de fogo.',
    'Separada da glândula reativa, a quitina fria do tórax isola a pele contra queimaduras.',
    'A estrutura firme da carapaça melhora a sustentação do braço ao bloquear com escudo.',
    'O pó escuro das junções amortece o som dos movimentos em incursões furtivas.',
  ],

  // 123. Bagas de Zimbro: 1:Restaurar Saúde | 2:Restaurar Vigor | 3:Fortalecer Alteração | 4:Debilidade Elétrica
  'Skyrim.esm|05076E': [
    'As bagas aromáticas maceradas em água morna fecham ferimentos leves e restauram a saúde.',
    'O sumo resinoso e picante revigora os músculos fatigados e repõe rapidamente o vigor.',
    'Os óleos essenciais das sementes fortalecem encantamentos de Alteração.',
    'A resina seca em excesso sensibiliza os nervos e agrava ferimentos por eletricidade.',
  ],

  // 124. Sino da Morte: 1:Danificar Mágicka | 2:Debilidade Elétrica | 3:Fortalecer Duas-mãos | 4:Regenerar Mágicka
  'Skyrim.esm|0516C8': [
    'O cálice violáceo dos pântanos envenena o foco mental e esgota a Magicka do alvo.',
    'A seiva fria da campânula conduz choques elétricos com facilidade, agravando o dano.',
    'Os caules rígidos cozidos em tônico firme sustentam golpes pesados com armas de duas mãos.',
    'Em dose mínima e altamente purificada, a flor estimula a regeneração contínua de Magicka.',
  ],

  // 125. Pele Chamuscada de Skeever: 1:Curar Doenças | 2:Restaurar Saúde | 3:Fortalecer Ataques Furtivos | 4:Danificar Mágicka Prolongado
  'Skyrim.esm|052695': [
    'O couro esterilizado pelo fogo absorve impurezas e ajuda a curar doenças comuns.',
    'O caldo grosso da pele tostada estanca sangramentos leves e recupera a saúde.',
    'As cinzas escuras do pelo afiam a precisão silenciosa em ataques furtivos.',
    'A fuligem ácida aderida à camada interna drena continuamente a Magicka do adversário.',
  ],

  // 126. Musgo Pendurado: 1:Debilidade Gélida | 2:Fortalecer Saúde | 3:Fortalecer Duas-mãos | 4:Fortalecer Furtividade
  'Skyrim.esm|057F91': [
    'Os fios secos absorvem o calor superficial do corpo e aumentam a sensibilidade ao frio.',
    'As fibras limpas em cozimento longo fortalecem o organismo e elevam a saúde máxima.',
    'Os feixes longos concentram tensão muscular firme para golpes com armas de duas mãos.',
    'Os tufos macios reduzem o ruído dos passos e favorecem deslocamentos furtivos.',
  ],

  // 127. Raiz de Nirn: 1:Danificar Saúde Prolongado | 2:Danificar Mágicka Prolongado | 3:Danificar Vigor Prolongado | 4:Invisibilidade
  'Skyrim.esm|059B86': [
    'A vibração tóxica da raiz ressoante corrói os tecidos vitais continuamente por vários instantes.',
    'O zumbido arcano concentrado no sumo turva a mente e consome a Magicka sem pausa.',
    'As fibras pesadas exaurem a respiração do alvo, drenando o vigor ao longo do tempo.',
    'Destilada em absoluto silêncio, a essência refrata toda luz e torna o usuário invisível.',
  ],

  // 128. Seiva de Spriggan: 1:Danificar Vigor | 2:Debilidade Gélida | 3:Comando | 4:Fortalecer Conjuração
  'Skyrim.esm|063B5F': [
    'A resina espessa enrijece os tendões da vítima e drena subitamente o vigor físico.',
    'A seiva viva congela com facilidade ao contato do vento, agravando danos de gelo.',
    'O perfume selvagem da floresta impõe domínio instintivo sobre animais e feras.',
    'A vitalidade antiga preservada no fluido fortalece vínculos e feitiços de Conjuração.',
  ],

  // 129. Raiz de Canis: 1:Danificar Vigor | 2:Debilidade Elétrica | 3:Fortalecer Duas-mãos | 4:Regenerar Saúde
  'Skyrim.esm|06ABCB': [
    'A casca áspera da raiz retira a flexibilidade dos músculos e consome o vigor do alvo.',
    'Os sais secos do córtex facilitam a passagem de raios e ampliam o dano elétrico.',
    'O cerne lenhoso sustenta a força bruta dos braços para armas de duas mãos.',
    'A infusão lenta da polpa interna ajuda os tecidos lesionados a se regenerarem aos poucos.',
  ],

  // 130. Uvas de Jazbay: 1:Fortalecer Mágicka | 2:Fortalecer Barganha | 3:Comando | 4:Fortalecer Restauração
  'Skyrim.esm|06AC4A': [
    'Os bagos quentes das fontes termais expandem temporariamente a capacidade de Magicka.',
    'O sumo adocicado e rico relaxa os sentidos e torna a fala mais hábil em negociações.',
    'As sementes fermentadas exalam presença firme capaz de domar bestas arredias.',
    'A polpa mineralizada fortalece encantamentos curativos e práticas de Restauração.',
  ],

  // 131. Garra de Bruxa-harpia: 1:Debilidade Gélida | 2:Arma de Dano | 3:Calmaria | 4:Silêncio
  'Skyrim.esm|06B689': [
    'A queratina escura drena o calor das articulações e deixa o alvo vulnerável ao gelo.',
    'O pó da garra triturada debilita a firmeza dos braços e enfraquece ataques armados.',
    'Quando fervida em água limpa com ervas, a ponta curva apazigua impulsos hostis.',
    'Os sulcos internos guardam cinza ritual que emudece a garganta e impede magias vocais.',
  ],

  // 132. Quitina de Caranguejo-lama: 1:Resistência Venenosa | 2:Regenerar Vigor | 3:Refletir Danos | 4:Frenesi
  'Skyrim.esm|06BC00': [
    'A carapaça calcária moída absorve substâncias nocivas e reforça a defesa contra venenos.',
    'O caldo mineral da casca devolve resistência contínua aos músculos durante combates.',
    'As placas rígidas formam uma película tensa que rebate parte do dano físico sofrido.',
    'O resíduo ácido preso às juntas irrita os nervos e lança o alvo em fúria violenta.',
  ],

  // 133. Garra de Urso: 1:Fortalecer Capacidade de Carga | 2:Fortalecer Uma-Mão | 3:Fortalecer Rugidos | 4:Fortalecer Velocidade
  'Skyrim.esm|06BC02': [
    'A queratina densa em decocção fortalece a estrutura lombar para sustentar cargas pesadas.',
    'Os tendões da base dão firmeza adicional ao pulso em golpes com armas de uma mão.',
    'O tutano áspero aquece o peito e amplia a força sonora dos rugidos.',
    'As fibras musculares aderidas à garra impulsionam arranques rápidos e aumentam a velocidade.',
  ],

  // 134. Presa de Tigre-sabre: 1:Resistência Gélida | 2:Fortalecer Uma-Mão | 3:Abafar | 4:Calmaria
  'Skyrim.esm|06BC04': [
    'O marfim das neves retém calor estável que protege o organismo contra o frio intenso.',
    'O pó da raiz dentária firma o braço dominante e melhora golpes com armas de uma mão.',
    'O óleo fino extraído da base suaviza o atrito dos passos em terreno pedregoso.',
    'Em dose fria e bem filtrada, a presa aquieta os batimentos e acalma feras agitadas.',
  ],

  // 135. Olho de Tigre-sabre: 1:Danificar Vigor | 2:Resistência Ígnea | 3:Fortalecer Pontaria | 4:Fortalecer Desarmado
  'Skyrim.esm|06BC07': [
    'Os fluidos densos do globo provocam tontura imediata e drenam o vigor do oponente.',
    'O humor vítreo espesso protege os tecidos superficiais contra queimaduras e fogo.',
    'A lente cristalina aguça o foco à distância e aumenta a precisão na pontaria.',
    'O extrato concentrado estimula reflexos rápidos para golpes corpo a corpo desarmados.',
  ],

  // 136. Galhada Grande: 1:Debilidade Elétrica | 2:Arma de Dano | 3:Fortalecer Furto | 4:Fortalecer Ataques de Poder
  'Skyrim.esm|06BC0A': [
    'O pó mineral da galhada altera a condutividade da pele e agrava danos por choque.',
    'As lascas densas fervidas em base amarga enfraquecem a força dos golpes armados.',
    'A camada macia próxima à base estabiliza as mãos para ações rápidas de furto.',
    'O núcleo ósseo calcificado transmite força sólida para ataques carregados de poder.',
  ],

  // 137. Galhada Pequena: 1:Resistência Gélida | 2:Fortalecer Capacidade de Carga | 3:Fortalecer Ataques Furtivos | 4:Resistência Mágica
  'Skyrim.esm|06BC0B': [
    'O veludo jovem da galhada conserva calor natural e protege contra ventos gélidos.',
    'Os sais ósseos fortificam ombros e costas, aumentando o peso transportável.',
    'O extrato leve firma o pulso na hora exata de desferir golpes furtivos.',
    'A estrutura porosa da ponta absorve parte dos feitiços hostis lançados contra o usuário.',
  ],

  // 138. Invólucro Fátuo: 1:Caminhar Sobre a Água | 2:Danificar Mágicka Prolongado | 3:Fortalecer Furto | 4:Fortalecer Ataques Furtivos
  'Skyrim.esm|06BC0E': [
    'Os véus translúcidos quase sem peso sustentam os passos sobre a superfície da água.',
    'A névoa fria retida no tecido suga continuamente a Magicka do adversário.',
    'As tiras sedosas refinam a destreza silenciosa das mãos em furtos delicados.',
    'O brilho frio quase invisível amplia a letalidade de golpes desferidos das sombras.',
  ],

  // 139. Pó de Presa de Mamute: 1:Danificar Saúde Prolongado | 2:Danificar Mágicka Prolongado | 3:Danificar Vigor Prolongado | 4:Invisibilidade
  'Skyrim.esm|06BC10': [
    'As lascas microscópicas de marfim antigo ferem lentamente os órgãos por vários segundos.',
    'A poeira pesada embota os canais arcanos e consome a Magicka de modo contínuo.',
    'O pó calcário asfixia a resistência física, drenando o vigor durante um longo intervalo.',
    'Calcinado até virar névoa branca pura, o pó dispersa a luz e oculta o usuário.',
  ],

  // 140. Pholiota Escamosa: 1:Curar Doenças | 2:Fortalecer Capacidade de Carga | 3:Fortalecer Destruição | 4:Danificar Vigor Prolongado
  'Skyrim.esm|06F950': [
    'As escamas do chapéu fervidas em água limpa purgam enfermidades leves do organismo.',
    'A polpa firme sustenta o esforço físico prolongado e amplia a capacidade de carga.',
    'O extrato ambarado das lamelas intensifica a força elemental de magias de Destruição.',
    'Os esporos escuros deixados sem filtragem drenam o vigor muscular por vários instantes.',
  ],

  // 141. Cinzas de Berit: 1:Paralisia | 2:Absorção de Feitiço | 3:Medo | 4:Frenesi
  'Skyrim.esm|0705B7': [
    'O pó fúnebre denso trava instantaneamente os nervos motores e paralisa o oponente.',
    'As cinzas antigas atraem e absorvem fluxos mágicos hostis antes que atinjam o corpo.',
    'O hálito frio desprendido dos restos mortais desperta terror profundo nos inimigos.',
    'Quando misturada sem purificação, a perturbação dos restos leva o alvo a um frenesi cego.',
  ],

  // 142. Asa de Borboleta Azul: 1:Restaurar Mágicka | 2:Fortalecer Barganha | 3:Fortalecer Restauração | 4:Resistência Ígnea
  'Skyrim.esm|0727DE': [
    'O pó azulado das asas dissolve-se em solução leve que restaura rapidamente a Magicka.',
    'O brilho sereno das escamas aclara a fala e ajuda em negociações e barganhas.',
    'As nervuras finas nutrem feitiços curativos e reforçam práticas de Restauração.',
    'A película fina das asas amortece o calor superficial e protege contra o fogo.',
  ],

  // 143. Asa de Mariposa Lunar: 1:Resistência Elétrica | 2:Fortalecer Mágicka | 3:Abafar | 4:Fortalecer Alteração
  'Skyrim.esm|0727DF': [
    'As escamas prateadas dissipam faíscas e protegem o corpo contra ataques elétricos.',
    'O pó noturno da asa expande temporariamente a reserva máxima de Magicka.',
    'O bater silencioso preservado nas fibras abafa o ruído das passadas na noite.',
    'A essência lunar reage bem com sais minerais e fortalece feitiços de Alteração.',
  ],

  // 144. Asa de Borboleta: 1:Fortalecer Vigor | 2:Fortalecer Capacidade de Carga | 3:Abafar | 4:Fortalecer Defesa de Armadura
  'Skyrim.esm|0727E0': [
    'O pó dourado das asas desperta disposição muscular imediata e amplia o vigor.',
    'As nervuras elásticas reduzem a sensação de fadiga e aumentam a capacidade de carga.',
    'A película macia absorve atritos leves, silenciando o som do deslocamento.',
    'A cera sutil das escamas enrijece o revestimento externo e melhora a defesa da armadura.',
  ],

  // 145. Porção de Sal (Black-Briar): 1:Paralisia | 2:Absorção de Feitiço | 3:Armadura de Dano | 4:Resistência Mágica
  'Skyrim.esm|074A19': [
    'Os cristais tratados em segredo travam os nervos motores e imobilizam a vítima na hora.',
    'A fórmula mineral refinada atrai e absorve descargas mágicas lançadas contra o usuário.',
    'Os sais cáusticos ocultos na mistura corroem a coesão física das armaduras atingidas.',
    'A matriz densa do preparado dissipa energia arcana e protege contra feitiços hostis.',
  ],

  // 146. Flor Azul da Montanha: 1:Restaurar Vigor | 2:Fortalecer Mágicka | 3:Fortalecer Velocidade | 4:Danificar Vigor
  'Skyrim.esm|077E1C': [
    'A maceração suave das pétalas azuladas libera uma essência fresca que alivia o cansaço e restaura o vigor.',
    'O cálice e os estames triturados em pó fino ampliam temporariamente a capacidade do corpo de reter Magicka.',
    'Destilando o caule tenro em vapor leve, o extrato acelera os reflexos e torna a passada mais ágil.',
    'A seiva amarga concentrada na base fibrosa do talo provoca contração súbita e drena o vigor físico.',
  ],

  // 147. Flor Vermelha da Montanha: 1:Fortalecer Vigor | 2:Medo | 3:Fortalecer Destruição | 4:Regenerar Saúde
  'Skyrim.esm|077E1D': [
    'As pétalas escarlates em infusão quente aquecem o sangue e ampliam o vigor disponível.',
    'O pólen intenso da corola provoca palpitação e sobressalto, despertando medo súbito.',
    'O pigmento rubro concentra ardor elemental que fortalece magias de Destruição.',
    'O miolo tenro do caule estimula a circulação contínua e acelera a regeneração da saúde.',
  ],

  // 148. Flor Púrpura da Montanha: 1:Restaurar Saúde | 2:Resistência Venenosa | 3:Fortalecer Ilusão | 4:Fortalecer Saúde
  'Skyrim.esm|077E1E': [
    'O néctar claro das pétalas roxas acalma ferimentos superficiais e restaura a saúde.',
    'As folhas da base bloqueiam toxinas leves e aumentam a resistência contra venenos.',
    'O tom violáceo dos estames aguça impressões sutis e favorece feitiços de Ilusão.',
    'A raiz firme fervida em caldo fortalece a constituição e eleva a saúde máxima.',
  ],

  // 149. Vagem de Cogumelo do Pântano: 1:Respiração Aquática | 2:Burden (Peso) | 3:Fortalecer Conjuração | 4:Invisibilidade
  'Skyrim.esm|07E8B7': [
    'As bolsas úmidas do fungo retêm ar filtrado que permite respirar sob a água.',
    'A lama densa aprisionada no interior pesa sobre os músculos e retarda os passos.',
    'Os esporos sombrios do pântano estabilizam invocações da escola de Conjuração.',
    'O vapor pálido extraído da vagem turva a vista alheia e oculta o usuário.',
  ],

  // 150. Líquen Gigante: 1:Resistência Elétrica | 2:Burden (Peso) | 3:Armadura de Dano | 4:Fortalecer Destruição
  'Skyrim.esm|07E8C1': [
    'A crosta esponjosa absorve descargas elétricas dispersas e protege o corpo contra choques.',
    'As fibras pesadas quando cozidas em pasta densa impõem fadiga e peso ao oponente.',
    'A fração ácida raspada da base enfraquece a solidez da armadura que protege o alvo.',
    'Os sais minerais presos ao talo dão potência extra a feitiços de Destruição.',
  ],

  // 151. Ovo de Peixe-assassino: 1:Respiração Aquática | 2:Fortalecer Vigor | 3:Armadura de Dano | 4:Fortalecer Duas-mãos
  'Skyrim.esm|07E8C5': [
    'A membrana translúcida da ova preserva afinidade aquática para sustentar a respiração submersa.',
    'O conteúdo nutritivo do ovo dá resistência extra aos músculos e amplia o vigor.',
    'A casca gelatinosa ácida corrói a firmeza do equipamento e reduz a defesa da armadura.',
    'A proteína densa fortalece os ombros para golpes potentes com armas de duas mãos.',
  ],

  // 152. Ovo de Pássaro Canoro Empedrado: 1:Fortalecer Barganha | 2:Restaurar Vigor | 3:Armadura de Dano | 4:Abafar
  'Skyrim.esm|07E8C8': [
    'A clara suave clarifica a garganta e deixa a voz agradável e persuasiva em trocas.',
    'A gema nutritiva devolve prontamente o vigor perdido após caminhadas exigentes.',
    'O pó da casca manchada em solução ácida enfraquece a proteção de armaduras atingidas.',
    'A película fina da membrana interna suaviza os movimentos e abafa o som dos passos.',
  ],

  // 153. Craca Nórdica: 1:Resistência Elétrica | 2:Fortalecer Mágicka | 3:Fortalecer Rugidos | 4:Silêncio
  'Skyrim.esm|07EDF5': [
    'As conchas calcárias moídas isolam a pele e reduzem ferimentos causados por choques.',
    'A polpa salina interna expande temporariamente a reserva máxima de Magicka.',
    'O caldo marinho concentrado abre as vias respiratórias e fortalece o alcance dos rugidos.',
    'O muco denso retirado da base trava a garganta e silencia encantamentos.',
  ],

  // 154. Cogumelo Brilhante: 1:Resistência Elétrica | 2:Burden (Peso) | 3:Fortalecer Destruição | 4:Regenerar Mágicka
  'Skyrim.esm|07EE01': [
    'A camada luminescente do chapéu desvia correntes elétricas e protege contra raios.',
    'Os tecidos mineralizados das cavernas pesam sobre os músculos e retardam o alvo.',
    'O brilho concentrado nas lamelas amplia a intensidade de feitiços de Destruição.',
    'O extrato claro do talo acelera continuamente a regeneração natural de Magicka.',
  ],

  // 155. Vagem de Grama: 1:Danificar Saúde | 2:Arma de Dano | 3:Fortalecer Defesa de Armadura | 4:Fortalecer Ataques de Poder
  'Skyrim.esm|083E64': [
    'Os espinhos secos da vagem liberam toxina áspera que fere os tecidos internos.',
    'A seiva amarga debilita a firmeza dos braços e reduz a eficácia das armas.',
    'As fibras rígidas em óleo espesso endurecem o revestimento da armadura.',
    'As sementes densas concentram vigor súbito que fortalece ataques pesados.',
  ],

  // 156. Pérola: 1:Debilidade Gélida | 2:Debilidade Venenosa | 3:Fortalecer Furto | 4:Fortalecer Furtividade
  'Skyrim.esm|0854FE': [
    'O pó mineral frio retira calor da superfície corporal e agrava o dano de gelo.',
    'O nácar dissolvido em ácido leve sensibiliza o sangue e amplia o efeito de venenos.',
    'A poeira finíssima deixa os dedos secos e precisos para furtos discretos.',
    'O brilho neutro e suave do pó atenua o ruído corporal em deslocamentos furtivos.',
  ],

  // 157. Pérola Pequena: 1:Danificar Vigor | 2:Arma de Dano | 3:Fortalecer Bloqueio | 4:Regenerar Saúde
  'Skyrim.esm|085500': [
    'Os grãos calcários mal diluídos pesam na respiração e drenam rapidamente o vigor.',
    'A suspensão ácida do nácar reduz a força dos braços e enfraquece golpes armados.',
    'O pó mineral firme fortalece a postura do antebraço ao aparar ataques com escudo.',
    'Em solução pura e morna, os sais marinhos estimulam a regeneração gradual da saúde.',
  ],

  // 158. Língua de Dragão: 1:Debilidade Ígnea | 2:Fortalecer Defesa de Armadura | 3:Fortalecer Bloqueio | 4:Regenerar Saúde
  'Skyrim.esm|0889A2': [
    'A película flamejante das pétalas sensibiliza a pele ao calor e agrava queimaduras.',
    'O extrato espesso do caule enrijece o revestimento externo e reforça a armadura.',
    'As folhas firmes fortalecem os tendões do braço para aparar impactos com escudo.',
    'A seiva quente do miolo acelera a circulação e regenera a saúde continuamente.',
  ],

  // 159. Ovo de Aranha: 1:Danificar Saúde Prolongado | 2:Danificar Mágicka Prolongado | 3:Danificar Vigor Prolongado | 4:Invisibilidade
  'Skyrim.esm|09151B': [
    'A bolsa viscosa guarda peçonha latente que corrói a saúde ao longo de vários segundos.',
    'Os fluidos escuros perturbam a concentração e drenam a Magicka continuamente.',
    'A seda pegajosa interna sufoca o fôlego muscular e esgota o vigor aos poucos.',
    'A película fina purificada em álcool dobra a luz e torna o corpo invisível.',
  ],

  // 160. Casca de Colméia: 1:Curar Doenças | 2:Fortalecer Uma-Mão | 3:Fortalecer Destruição | 4:Danificar Saúde Prolongado
  'Skyrim.esm|0A9191': [
    'A própolis ressecada nas frestas da casca purifica humores e cura doenças comuns.',
    'As fibras cerosas firmam o pulso e melhoram o domínio com armas de uma mão.',
    'A resina inflamável da parede interna intensifica o poder de feitiços de Destruição.',
    'Os esporos mofados ocultos nos alvéolos externos causam dano contínuo à saúde.',
  ],

  // 161. Abelha: 1:Restaurar Saúde | 2:Fortalecer Vigor | 3:Fortalecer Ilusão | 4:Danificar Mágicka
  'Skyrim.esm|0A9195': [
    'Quando prensado inteiro sem romper o favo interno, o néctar retido no abdômen preserva uma centelha vital que restaura a saúde.',
    'O pólen aderido às patas e a trituração seca do tórax liberam um tônico brando que fortalece o vigor físico.',
    'Separando as asas membranosas em destilação lenta, extrai-se um brilho sutil que amplia encantamentos de Ilusão.',
    'O ferrão e a bolsa ácida da extremidade guardam uma toxina ardida que perturba o fluxo arcano e drena a Magicka.',
  ],

  // 162. Favo de Mel: 1:Fortalecer Vigor | 2:Calmaria | 3:Fortalecer Alteração | 4:Regenerar Vigor
  'Skyrim.esm|0B08C5': [
    'O mel espesso dos alvéolos fornece energia imediata e expande o vigor físico.',
    'O aroma doce e morno da cera relaxa os ânimos e acalma criaturas agitadas.',
    'A estrutura hexagonal da cera estabiliza transformações em feitiços de Alteração.',
    'A absorção lenta dos açúcares naturais regenera o vigor de forma contínua.',
  ],

  // 163. Coração Humano: 1:Fortalecer Persuasão | 2:Acender/Luz | 3:Fortalecer Ataques Furtivos | 4:Absorção de Feitiço
  'Skyrim.esm|0B18CD': [
    'O vigor ritual extraído das câmaras cardíacas confere presença dominante à fala.',
    'Os sais fosforescentes do sangue concentrado irradiam claridade na escuridão.',
    'A pulsação fria preservada no músculo aguça a precisão mortal de ataques furtivos.',
    'O tecido sombrio atrai energia mágica hostil e a absorve antes do impacto.',
  ],

  // 164. Raiz Trepadeira: 1:Debilidade Ígnea | 2:Resistência Ígnea | 3:Fortalecer Furto | 4:Regenerar Saúde
  'Skyrim.esm|0B2183': [
    'Os óleos secos da casca externa inflamam com facilidade e ampliam danos de fogo.',
    'A polpa úmida isolada do núcleo resiste bem ao calor intenso das regiões vulcânicas.',
    'O pó fino das raízes reduz o suor das mãos e auxilia ações rápidas de furto.',
    'A seiva mineral rica das terras quentes acelera a regeneração contínua da saúde.',
  ],

  // 165. Raiz de Nirn Carmesim: 1:Paralisia | 2:Acender/Luz | 3:Fortalecer Alteração | 4:Danificar Mágicka Prolongado
  'Skyrim.esm|0B701A': [
    'A ressonância profunda das fibras rubras trava os nervos e paralisa o alvo na hora.',
    'O brilho carmesim intenso do caule ilumina cavernas inteiras sem precisar de tocha.',
    'A energia singular de Blackreach potencializa drasticamente feitiços de Alteração.',
    'Os ecos vibratórios persistentes rompem a mente e consomem Magicka sem trégua.',
  ],

  // 166. Libélula Laranja: 1:Restaurar Vigor | 2:Fortalecer Uma-Mão | 3:Abafar | 4:Fortalecer Bloqueio
  'Skyrim.esm|0BB956': [
    'O tórax leve moído em solução clara devolve fôlego rápido e restaura o vigor.',
    'As asas ágeis melhoram a coordenação do braço em golpes com armas de uma mão.',
    'O pó fino das membranas amortece o som dos passos e silencia o deslocamento.',
    'A quitina elástica firma o antebraço e melhora o equilíbrio ao bloquear com escudo.',
  ],

  // 167. Açúcar Lunar: 1:Paralisia | 2:Absorção de Feitiço | 3:Burden (Peso) | 4:Danificar Vigor Prolongado
  'Skyrim.esm|0D8E3F': [
    'Refinado até perder o brilho doce, o cristal fino trava a condução nervosa e deixa o corpo paralisado.',
    'Dissolvido em condensação pura sob temperatura branda, o pó forma um véu que absorve feitiços hostis.',
    'A crosta residual após decantação pesada deposita-se nos músculos como chumbo, impondo peso opressivo.',
    'O xarope escuro que resta ao fundo do frasco corrói a resistência física e drena vigor continuamente.',
  ],

  // 168. Libélula Azul: 1:Respiração Aquática | 2:Restaurar Mágicka | 3:Fortalecer Velocidade | 4:Ficar Etéreo
  'Skyrim.esm|0E4F0C': [
    'As brânquias vestigiais preservadas no abdômen sustentam a respiração debaixo d\'água.',
    'O pigmento azul-celeste recompõe rapidamente a reserva gasta de Magicka.',
    'Os músculos velozes do voo aceleram os reflexos e tornam a corrida mais ágil.',
    'As asas quase transparentes reduzem o peso corporal até deixar o usuário etéreo.',
  ],

  // 169. Bico de Falcão: 1:Debilidade Gélida | 2:Debilidade Venenosa | 3:Fortalecer Arrombamento | 4:Fortalecer Furtividade
  'Skyrim.esm|0E7EBC': [
    'A queratina fina resfria a circulação periférica e torna o alvo vulnerável ao gelo.',
    'Os resíduos ácidos da ponta abrem caminho para toxinas e reduzem a resistência a venenos.',
    'O pó duro do bico dá firmeza tátil às pontas dos dedos ao trabalhar com gazuas.',
    'A mistura seca reduz ruídos corporais e melhora a movimentação furtiva.',
  ],

  // 170. Penas de Falcão: 1:Resistência Gélida | 2:Fortalecer Barganha | 3:Fortalecer Ilusão | 4:Burden (Peso)
  'Skyrim.esm|0E7ED0': [
    'A plumagem adaptada às altitudes retém calor corporal e protege contra o frio.',
    'O óleo claro dos cálamos acalma o semblante e favorece diálogos de barganha.',
    'As penas rajadas dispersam a luz sutilmente, fortalecendo encantamentos de Ilusão.',
    'Quando fervidas em resina densa, as hastes pesam sobre as juntas do oponente.',
  ],

  // 171. Mora Tapinella: 1:Restaurar Saúde | 2:Silêncio | 3:Resistência Mágica | 4:Danificar Saúde
  'Skyrim.esm|0EC870': [
    'As lascas lenhosas em infusão limpa fecham ferimentos leves e restauram a saúde.',
    'Os esporos escuros da face inferior travam a fala e silenciam conjuradores.',
    'A crosta resistente do fungo de árvore amortece o impacto de magias hostis.',
    'A fração crua mais concentrada libera toxinas que ferem a vitalidade do alvo.',
  ],

  // 172. Óleo Enânico: 1:Debilidade Gélida | 2:Resistência Ígnea | 3:Fortalecer Pontaria | 4:Regenerar Mágicka
  'Skyrim.esm|0F11C0': [
    'O lubrificante antigo engrossa com o frio, deixando o alvo mais sensível a danos gélidos.',
    'A fórmula mineral suporta temperaturas extremas e protege a pele contra o fogo.',
    'A fluidez mecânica perfeita firma o pulso e melhora a precisão da pontaria.',
    'Os resíduos tonais em suspensão mantêm a Magicka regenerando de modo contínuo.',
  ],

  // 173. Carne Humana: 1:Fortalecer Persuasão | 2:Acender/Luz | 3:Fortalecer Ilusão | 4:Ficar Etéreo
  'Skyrim.esm|1016B3': [
    'A essência sombria extraída sob sigilo empresta força perturbadora e persuasiva à voz.',
    'Os sais fósforos liberados sob destilação severa emitem claridade pálida no escuro.',
    'Os humores densos alteram a percepção alheia e potencializam feitiços de Ilusão.',
    'Em preparação proibida e pura, atenua a solidez do corpo até torná-lo etéreo.',
  ],

  // 174. Carpa de Hist: 1:Resistência Venenosa | 2:Silêncio | 3:Caminhar Sobre a Água | 4:Debilidade Ígnea
  'Skyrim.esm|106E18': [
    'As escamas adaptadas a águas pantanosas neutralizam peçonhas e fortalecem contra venenos.',
    'A mucosa espessa das guelras emudece a garganta e impede a pronúncia de feitiços.',
    'O óleo leve das nadadeiras sustenta o equilíbrio do usuário sobre a superfície da água.',
    'A gordura úmida do ventre reage mal ao calor e amplia o dano recebido por fogo.',
  ],

  // 175. Cauda de Espada Cyrodílica: 1:Fortalecer Barganha | 2:Frenesi | 3:Fortalecer Conjuração | 4:Refletir Danos
  'Skyrim.esm|106E19': [
    'As escamas prateadas da cauda dão vivacidade à mente e facilitam negociações.',
    'O fluido irritante próximo à nadadeira anal agita os nervos até provocar frenesi.',
    'Os raios alongados da cauda estabilizam pactos arcanos da escola de Conjuração.',
    'As placas rígidas trituradas devolvem parte da força física contra quem golpeia.',
  ],

  // 176. Betty do Rio: 1:Resistência Gélida | 2:Frenesi | 3:Fortalecer Ilusão | 4:Caminhar Sobre a Água
  'Skyrim.esm|106E1A': [
    'A gordura das águas geladas protege o corpo e reduz ferimentos causados por frio.',
    'O veneno dorsal suave inflama os impulsos e faz o alvo atacar às cegas.',
    'Os reflexos coloridos da pele cintilante reforçam feitiços sutis de Ilusão.',
    'As nadadeiras leves em emulsão permitem caminhar sem afundar sobre a água.',
  ],

  // 177. Abeceano de Barbatana Longa: 1:Restaurar Magicka | 2:Respiração Aquática | 3:Burden (Peso) | 4:Arma de Dano
  'Skyrim.esm|106E1B': [
    'A infusão das barbatanas delgadas em água morna desprende uma seiva salina clara que recompõe o fluxo de Magicka.',
    'As guelras secas e filtradas em solvente brando mantêm a afinidade com águas profundas para respirar submerso.',
    'O óleo denso alojado sob a espinha dorsal enrijece os tendões após fervura prolongada, impondo peso aos passos.',
    'Raspando o muco seco das escamas laterais em base cáustica, obtém-se um resíduo corrosivo que embota golpes armados.',
  ],

  // 178. Perca Prateada: 1:Respiração Aquática | 2:Frenesi | 3:Fortalecer Rugidos | 4:Comando
  'Skyrim.esm|106E1C': [
    'As brânquias prateadas preservadas em salmoura mantêm a troca sutil de ar sob a água.',
    'A bílis escura do ventre desperta agressividade descontrolada em alvos atingidos.',
    'A bexiga natatória seca expande o fôlego e fortalece a potência dos rugidos.',
    'O extrato metálico das escamas impõe domínio firme sobre animais e criaturas.',
  ],
};

module.exports = { SKYRIM_INGREDIENT_LORE };
