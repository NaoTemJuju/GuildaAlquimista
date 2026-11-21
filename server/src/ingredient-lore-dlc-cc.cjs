'use strict';

/**
 * Descricoes alquimicas coerentes (4 virtudes por ingrediente) — DLCs, Creation Club e mods.
 * Chaves correspondem exatamente aos 87 registros de _ResourcePack, Fish, AdvDSGS, Curios,
 * Dawnguard, Dragonborn, HearthFires, Predator Vision e Update em GuildAlchemy.esp.
 */
const DLC_CC_INGREDIENT_LORE = {
  // 1. Folhas de Babosa: 1:Restaurar Saúde | 2:Curar Doenças | 3:Comando | 4:Fortalecer Ataques de Poder
  '_ResourcePack.esl|0000D0': [
    'O gel translúcido extraído do interior da folha suculenta acalma queimaduras e acelera a cicatrização de cortes frescos.',
    'A polpa amarga logo abaixo da casca verde purifica humores contaminados e ajuda o corpo a debelar febres comuns.',
    'A seiva concentrada das nervuras centrais, quando reduzida em vapor, aguça a firmeza do olhar e impõe autoridade sobre criaturas.',
    'As fibras secas da borda espinhosa guardam um estímulo denso que potencializa golpes carregados com todo o peso do corpo.',
  ],

  // 2. Peixe-anjo: 1:Respiração Aquática | 2:Calmaria | 3:Fortalecer Ataques Furtivos | 4:Ficar Etéreo
  'ccBGSSSE001-Fish.esm|0008EB': [
    'As brânquias finas preservadas em salmoura branda mantêm a troca sutil de ar sob a água sem pesar no peito.',
    'O óleo claro das nadadeiras peitorais serena os batimentos e abranda impulsos hostis quando infundido em água morna.',
    'A película nacarada retirada do flanco delgado aguça a precisão silenciosa em investidas desferidas das sombras.',
    'As escamas quase diáfanas, destiladas em fogo brando, conferem leveza fantasmagórica que atenua o impacto físico do mundo.',
  ],

  // 3. Peixe-pérola: 1:Fortalecer Barganha | 2:Regenerar Vigor | 3:Refletir Danos | 4:Fortalecer Saúde
  'ccBGSSSE001-Fish.esm|0008EC': [
    'O pó furta-cor raspado das escamas lustrosas deixa o timbre mais persuasivo e o trato social mais astuto em negociações.',
    'A carne firme próxima à cauda sustenta o fôlego contínuo, devolvendo vigor gradualmente após esforços repetidos.',
    'As placas rígidas do dorso, trituradas em solução mineral, devolvem parte da força cinética contra quem desfere o golpe.',
    'O caldo espesso da cabeça e das espinhas fortalece a constituição física, aumentando a resistência vital do organismo.',
  ],

  // 4. Peixe-sol Pigmeu: 1:Restaurar Vigor | 2:Respiração Aquática | 3:Resistência Mágica | 4:Fortalecer Furtividade
  'ccBGSSSE001-Fish.esm|0008ED': [
    'A carne miúda secada ao sol libera um extrato leve que restaura prontamente a disposição muscular após caminhadas longas.',
    'As guelras diminutas ainda retêm afinidade com correntes rasas, permitindo respirar sob a superfície por breve período.',
    'As escamas douradas do ventre formam uma película refratária que dissipa descargas arcanas antes que penetrem a pele.',
    'A mucosa fosca da nadadeira dorsal reduz o ruído corporal e ajuda a esconder a silhueta em ambientes sombreados.',
  ],

  // 5. Peixe-vidro: 1:Fortalecer Mágicka | 2:Medo | 3:Fortalecer Restauração | 4:Arma de Dano
  'ccBGSSSE001-Fish.esm|0008EE': [
    'Os tecidos translúcidos do corpo retêm luminosidade arcana, expandindo temporariamente a reserva de Magicka do alquimista.',
    'Os olhos vítreos macerados no escuro desprendem um vapor inquietante que desperta pavor súbito em mentes desprevenidas.',
    'A medula cristalina da coluna dorsal favorece feitiços curativos, tornando bênçãos de Restauração mais vigorosas.',
    'Os espinhos finos e rígidos, dissolvidos em base ácida, corroem o equilíbrio de quem os ingere e enfraquecem golpes armados.',
  ],

  // 6. Peixinho Dourado: 1:Restaurar Mágicka | 2:Fortalecer Barganha | 3:Fortalecer Conjuração | 4:Danificar Vigor
  'ccBGSSSE001-Fish.esm|0008EF': [
    'As escamas alaranjadas maceradas em água pura soltam uma tintura suave que recompõe rapidamente a Magicka gasta.',
    'O reflexo metálico das nadadeiras, reduzido a elixir límpido, confere brilho sereno à fala durante trocas e acordos.',
    'A vesícula minúscula e límpida estabiliza vínculos extraplanares, facilitando invocações e práticas de Conjuração.',
    'As vísceras amargas do abdômen provocam náusea seca quando concentradas, drenando de imediato o fôlego do alvo.',
  ],

  // 7. Larva de Pescador: 1:Resistência Elétrica | 2:Medo | 3:Refletir Danos | 4:Debilidade Elétrica
  'ccBGSSSE001-Fish.esm|0008F0': [
    'O bulbo bioluminescente da extremidade frontal isola correntes estáticas e protege o corpo contra descargas de choque.',
    'A secreção viscosa da cabeça tem odor abissal que provoca repulsa instintiva e leva presas à fuga desesperada.',
    'A carapaça elástica do corpo larval absorve choques e ricocheteia parte da agressão de volta ao atacante.',
    'O fluido escuro das glândulas inferiores torna a pele condutora se fervido em excesso, agravando ferimentos por raio.',
  ],

  // 8. Antia Cauda-de-Lira: 1:Resistência Gélida | 2:Silêncio | 3:Fortalecer Velocidade | 4:Danificar Mágicka
  'ccBGSSSE001-Fish.esm|0008F1': [
    'O óleo denso das águas frias acumulado sob a pele forma uma camada térmica que amortece o rigor do gelo.',
    'Os filamentos longos da cauda, macerados em silêncio, embotam a voz e impedem a pronúncia clara de encantamentos.',
    'As nadadeiras alongadas destiladas em álcool leve aceleram os reflexos e tornam a corrida notavelmente mais rápida.',
    'A bílis azulada próxima às guelras corta a fluidez arcana e esgota a Magicka de conjuradores atingidos.',
  ],

  // 9. Caranguejo-lama Jovem: 1:Resistência Venenosa | 2:Calmaria | 3:Fortalecer Restauração | 4:Armadura de Dano
  'ccBGSSSE001-Fish.esm|0008F2': [
    'A carne tenra filtrada com limo de rio neutraliza peçonhas comuns antes que alcancem a corrente sanguínea.',
    'O caldo suave das patas ainda macias acalma o temperamento agitado e aplaca impulsos de agressividade.',
    'A carapaça jovem, rica em sais calcários, fortalece encantamentos de cura e sustenta práticas de Restauração.',
    'O resíduo ácido das pinças internas enfraquece a solidez da proteção física, reduzindo a eficácia de armaduras.',
  ],

  // 10. Peixe-enxada: 1:Fortalecer Capacidade de Carga | 2:Frenesi | 3:Refletir Danos | 4:Debilidade Venenosa
  'ccBGSSSE001-Fish.esm|0008F3': [
    'A musculatura achatada e densa, cozida em redução lenta, sustenta as costas e amplia o peso que o corpo suporta.',
    'O sangue escuro junto à espinha dorsal incendeia o temperamento, lançando o afetado em fúria cega contra todos ao redor.',
    'As placas ósseas do crânio pulverizadas devolvem parte dos golpes sofridos como um rebote áspero contra o agressor.',
    'O muco das nadadeiras dorsais abre os poros e deixa o organismo desprotegido diante de venenos e peçonhas.',
  ],

  // 11. Asa de Borboleta Verde: 1:Fortalecer Uma-Mão | 2:Fortalecer Capacidade de Carga | 3:Fortalecer Ilusão | 4:Danificar Mágicka Prolongado
  'ccBGSSSE025-AdvDSGS.esm|059151': [
    'O pó esverdeado das escamas alares melhora a firmeza do pulso e dá precisão adicional a golpes com armas de uma mão.',
    'As nervuras fibrosas da asa, quando trituradas em bálsamo, aliviam a fadiga nos ombros e aumentam a carga suportada.',
    'O reflexo iridescente da membrana refrata a percepção sensorial, fortalecendo feitiços sutis da escola de Ilusão.',
    'O resíduo amargo das bordas escurece a mente aos poucos, drenando continuamente a Magicka durante vários instantes.',
  ],

  // 12. Asa de Borboleta Roxa: 1:Respiração Aquática | 2:Fortalecer Mágicka | 3:Caminhar Sobre a Água | 4:Refletir Danos
  'ccBGSSSE025-AdvDSGS.esm|059153': [
    'A película impermeável da asa roxa permite extrair oxigênio sutil mesmo quando o corpo permanece submerso.',
    'O pigmento violáceo macerado em álcool puro expande temporariamente o reservatório arcano do conjurador.',
    'A leveza extrema das nervuras transfere tensão superficial às solas dos pés, permitindo caminhar sobre a água.',
    'O pó cristalino desprendido sob calor cria uma película tensa que rebate parte do dano sofrido ao atacante.',
  ],

  // 13. Tórax de Inseto Alegre: 1:Danificar Mágicka | 2:Danificar Saúde | 3:Fortalecer Velocidade | 4:Resistência Elétrica
  'ccBGSSSE025-AdvDSGS.esm|059155': [
    'A glândula interna do tórax produz um fluido efervescente que rompe a concentração e consome a Magicka do alvo.',
    'O conteúdo visceral escuro é cáustico em dose concentrada, abrindo lesões internas e reduzindo rapidamente a saúde.',
    'Os músculos vibrantes das patas, quando destilados, aceleram os movimentos e tornam os passos surpreendentemente ágeis.',
    'A quitina isolante que reveste o exoesqueleto dispersa cargas elétricas e protege contra ataques de choque.',
  ],

  // 14. Caule de Chamas: 1:Danificar Mágicka Prolongado | 2:Danificar Vigor Prolongado | 3:Paralisia | 4:Comando
  'ccBGSSSE025-AdvDSGS.esm|095E23': [
    'A seiva ígnea do caule continua ardendo nos canais sutis após o contato, drenando a Magicka de modo contínuo.',
    'As cinzas ácidas do miolo exaurem os músculos pouco a pouco, consumindo o vigor ao longo de vários segundos.',
    'Quando reduzida a resina espessa, a ponta carbonizada trava os nervos motores e imobiliza completamente a vítima.',
    'O aroma resinoso desprendido sob destilação firme subjuga vontades vacilantes e facilita o domínio sobre criaturas.',
  ],

  // 15. Orelha de Pau: 1:Danificar Saúde | 2:Danificar Vigor | 3:Fortalecer Restauração | 4:Fortalecer Ilusão
  'ccBGSSSE037-Curios.esl|000802': [
    'As lamelas lenhosas do fungo guardam esporos tóxicos que ferem o organismo quando extraídos sem purificação.',
    'A polpa seca e travosa retém taninos pesados que endurecem a respiração e drenam o vigor físico.',
    'Depois de fervida em duas águas, a camada interna nutre feitiços curativos e amplia práticas de Restauração.',
    'O pó fino da borda clara altera sutilmente a percepção das formas, favorecendo conjurações da escola de Ilusão.',
  ],

  // 16. Erva Daninha Sufocante: 1:Debilidade Gélida | 2:Arma de Dano | 3:Resistência Mágica | 4:Abafar
  'ccBGSSSE037-Curios.esl|000804': [
    'Os talos fibrosos retiram calor das extremidades quando macerados, tornando o corpo sensível ao frio intenso.',
    'A seiva áspera das gavinhas enfraquece a firmeza dos braços e reduz o impacto de armas empunhadas.',
    'Os nós endurecidos do caule formam uma barreira densa que amortece feitiços hostis lançados contra o portador.',
    'As folhas aveludadas, reduzidas a óleo espesso, abafam o atrito dos passos e tornam o deslocamento silencioso.',
  ],

  // 17. Flor Coda: 1:Fortalecer Mágicka | 2:Resistência Elétrica | 3:Regenerar Saúde | 4:Abafar
  'ccBGSSSE037-Curios.esl|000805': [
    'O pólen azulado das anteras dissolve-se em néctar límpido que amplia a capacidade máxima de Magicka.',
    'As pétalas cerosas dos brejos absorvem descargas elétricas dispersas, protegendo o corpo contra danos de choque.',
    'A base úmida do cálice estimula a recuperação contínua dos tecidos, regenerando a saúde de forma gradual.',
    'O óleo macio do caule aquático suaviza cada movimento, abafando o som das passadas mesmo em terreno duro.',
  ],

  // 18. Airela: 1:Restaurar Vigor | 2:Fortalecer Vigor | 3:Debilidade Elétrica | 4:Resistência Ígnea
  'ccBGSSSE037-Curios.esl|000806': [
    'Os frutos ácidos esmagados devolvem rapidamente o fôlego perdido e aliviam a fadiga muscular.',
    'A casca avermelhada em infusão quente expande a resistência física, elevando o limite máximo de vigor.',
    'O suco concentrado conduz faíscas com facilidade, deixando o usuário mais vulnerável a descargas elétricas.',
    'As sementes ricas em cera vegetal criam uma película refrescante que resiste bem ao calor das chamas.',
  ],

  // 19. Putrescência Congelada: 1:Fortalecer Conjuração | 2:Fortalecer Destruição | 3:Acender/Luz | 4:Visão Noturna
  'ccBGSSSE037-Curios.esl|000807': [
    'A massa escura e gelada preserva ecos necromânticos que fortalecem invocações e pactos de Conjuração.',
    'Os cristais salinos presos no núcleo ampliam a violência elemental de feitiços de Destruição.',
    'A decomposição fosforescente da crosta emite claridade pálida capaz de iluminar ambientes inteiros.',
    'Os vapores frios aplicados com cautela dilatam a pupila e permitem enxergar detalhes na escuridão profunda.',
  ],

  // 20. Raiz de Bulbo de Cortiça: 1:Fortalecer Uma-Mão | 2:Resistência Venenosa | 3:Fortalecer Duas-mãos | 4:Regenerar Vigor
  'ccBGSSSE037-Curios.esl|000809': [
    'A casca esponjosa macerada firma a pegada do punho e aprimora a destreza com armas de uma mão.',
    'Os nódulos secos da raiz absorvem toxinas orgânicas, elevando a defesa natural contra venenos.',
    'O miolo denso e fibroso sustenta golpes amplos e pesados, fortalecendo o manejo de armas de duas mãos.',
    'O caldo terroso da porção inferior recompõe o fôlego de forma contínua durante combates prolongados.',
  ],

  // 21. Seda Daedra: 1:Fortalecer Persuasão | 2:Paralisia | 3:Absorção de Feitiço | 4:Danificar Saúde Prolongado
  'ccBGSSSE037-Curios.esl|00080A': [
    'Os fios sedosos destilados em essência rara dão magnetismo à voz e tornam o discurso quase irresistível.',
    'Quando condensada em veneno espesso, a fibra daedra trava os músculos e imobiliza o alvo por completo.',
    'A trama etérea dos filamentos suga energia mágica hostil, convertendo feitiços recebidos em reserva própria.',
    'Os resíduos cáusticos presos ao tear corrompem a carne lentamente, causando dano prolongado à saúde.',
  ],

  // 22. Veneno Daedra: 1:Visão Noturna | 2:Absorção de Feitiço | 3:Refletir Danos | 4:Danificar Vigor Prolongado
  'ccBGSSSE037-Curios.esl|00080B': [
    'Uma gota altamente diluída aguça a visão no breu total, revelando contornos onde não há luz.',
    'A matriz planar do líquido atrai cargas arcanas inimigas e as absorve antes de ferir o usuário.',
    'O vapor cristalizado na superfície devolve parte da força dos impactos físicos contra o agressor.',
    'Em dose ofensiva, a peçonha daedra sufoca a musculatura e drena continuamente o vigor por longos segundos.',
  ],

  // 23. Língua de Fome: 1:Visão Noturna | 2:Absorção de Feitiço | 3:Silêncio | 4:Calmaria
  'ccBGSSSE037-Curios.esl|00080C': [
    'O tecido áspero e escuro libera um óleo que adapta rapidamente os olhos à penumbra das cavernas.',
    'As papilas secas retêm vácuo arcano capaz de engolir feitiços lançados contra quem bebe o preparado.',
    'A saliva ressecada da ponta cala a garganta do alvo e bloqueia a articulação de magias.',
    'A base muscular cozida em infusão morna entorpece a ira e induz apatia calma em criaturas hostis.',
  ],

  // 24. Esporo Gigante de Azura Hydnum: 1:Fortalecer Ilusão | 2:Abafar | 3:Paralisia | 4:Refletir Danos
  'ccBGSSSE037-Curios.esl|00080D': [
    'A poeira azul-celeste dos esporos distorce sentidos e potencializa drasticamente feitiços de Ilusão.',
    'O feltro macio do chapéu fúngico absorve vibrações e silencia passos mesmo sobre pedra fria.',
    'Os esporos mais densos entorpecem os nervos motores em segundos, deixando o oponente paralisado.',
    'A crosta esponjosa mineralizada rebate parte do impacto físico recebido contra o próprio atacante.',
  ],

  // 25. Hypha Facia: 1:Fortalecer Capacidade de Carga | 2:Fortalecer Barganha | 3:Invisibilidade | 4:Danificar Saúde Prolongado
  'ccBGSSSE037-Curios.esl|00080E': [
    'Os cordões miceliais secos fortalecem tendões e costas, permitindo carregar cargas mais pesadas.',
    'O extrato ambarado clareia a mente e dá desenvoltura incomum para negociar preços e acordos.',
    'A película fina que recobre o fungo refrata a luz ambiente, ocultando o corpo da vista alheia.',
    'As placas internas contêm micotoxina lenta que corrói a vitalidade de forma contínua após a ingestão.',
  ],

  // 26. Bílis de Imp: 1:Caminhar Sobre a Água | 2:Danificar Mágicka Prolongado | 3:Fortalecer Persuasão | 4:Paralisia
  'ccBGSSSE037-Curios.esl|00080F': [
    'O fluido esverdeado e leve repele a umidade da pele, permitindo pisar sobre a superfície da água sem afundar.',
    'A acidez persistente da vesícula perturba os canais arcanos e consome a Magicka continuamente.',
    'Destilada com precisão extrema, a essência solta a língua e torna a argumentação mais convincente.',
    'Em concentração plena, a bílis enrijece as articulações e paralisa o alvo por completo.',
  ],

  // 27. Pele de Kagouti: 1:Regenerar Saúde | 2:Arma de Dano | 3:Comando | 4:Burden (Peso)
  'ccBGSSSE037-Curios.esl|000810': [
    'A gordura espessa aderida ao couro nutre a cicatrização contínua e regenera a saúde aos poucos.',
    'As cerdas rígidas fervidas em álcali deixam os membros pesados e reduzem o poder dos golpes armados.',
    'O almíscar forte da pele desperta instinto de submissão em bestas e criaturas de menor porte.',
    'O colágeno denso do couro mal purificado enrijece as pernas, impondo peso exaustivo ao alvo.',
  ],

  // 28. Fibra de Kresh: 1:Restaurar Mágicka | 2:Restaurar Saúde | 3:Fortalecer Saúde | 4:Fortalecer Arrombamento
  'ccBGSSSE037-Curios.esl|000811': [
    'Os filamentos claros fervidos em água pura produzem uma infusão leve que recompõe rapidamente a Magicka.',
    'A polpa macia do caule alivia feridas recentes e devolve o vigor vital ao corpo fatigado.',
    'Trançadas em decocção firme, as fibras fortalecem os tecidos e ampliam a resistência máxima à dor.',
    'O óleo fino extraído da casca aguça a sensibilidade tátil dos dedos ao manipular trancas delicadas.',
  ],

  // 29. Russula Luminosa: 1:Respiração Aquática | 2:Fortalecer Mágicka | 3:Calmaria | 4:Silêncio
  'ccBGSSSE037-Curios.esl|000813': [
    'As lamelas úmidas do cogumelo preservam bolhas sutis que sustentam a respiração sob a água.',
    'O brilho azulado do chapéu concentra éter suficiente para expandir a reserva máxima de Magicka.',
    'O aroma frio e suave dos esporos acalma mentes exaltadas e apazigua intenções hostis.',
    'A mucilagem densa do talo emudece as cordas vocais e impede a conjuração verbal de magias.',
  ],

  // 30. Broto do Pântano: 1:Fortalecer Vigor | 2:Restaurar Saúde | 3:Arma de Dano | 4:Fortalecer Furto
  'ccBGSSSE037-Curios.esl|000814': [
    'O miolo tenro do broto fornece energia rápida aos músculos, ampliando o vigor disponível.',
    'A seiva aquosa extraída sem fervura ajuda a estancar ferimentos leves e recuperar a saúde.',
    'A casca externa escura libera um ácido terroso que enfraquece a força dos ataques armados.',
    'As raízes finas deixam os dedos ágeis e leves, favorecendo manobras discretas de furto.',
  ],

  // 31. Chifre de Minotauro: 1:Calmaria | 2:Frenesi | 3:Visão Noturna | 4:Fortalecer Arrombamento
  'ccBGSSSE037-Curios.esl|000815': [
    'A raspagem fina da camada externa, em infusão fria, aquieta o pulso e acalma ânimos furiosos.',
    'A medula quente do núcleo carrega fúria bestial que faz a vítima atacar qualquer ser próximo.',
    'O pó da ponta polida aguça a percepção visual em ambientes escuros e cavernas.',
    'A queratina densa fortifica os tendões da mão e dá precisão firme contra fechaduras resistentes.',
  ],

  // 32. Dentes de Ogro: 1:Medo | 2:Invisibilidade | 3:Ficar Etéreo | 4:Fortalecer Duas-mãos
  'ccBGSSSE037-Curios.esl|000816': [
    'O resíduo de tártaro e marfim exala terror primitivo que faz inimigos recuarem em pânico.',
    'Calcificado em fogo alto até virar pó translúcido, o esmalte dobra a luz ao redor do corpo.',
    'A raiz oca moída com precisão desfaz a densidade corporal e torna o usuário brevemente etéreo.',
    'A dentina pesada transmite força bruta aos braços, ampliando o impacto com armas de duas mãos.',
  ],

  // 33. Bexiga de Gás de Algas Vermelhas: 1:Debilidade Elétrica | 2:Fortalecer Defesa de Armadura | 3:Silêncio | 4:Fortalecer Alteração
  'ccBGSSSE037-Curios.esl|000817': [
    'O gás salino retido na bolsa ioniza a pele e amplia o dano recebido por descargas elétricas.',
    'A membrana elástica cozida em óleo endurece como couro curado, reforçando a proteção da armadura.',
    'Os vapores sulfurosos pesados bloqueiam a voz e silenciam conjurações por vários instantes.',
    'Os sais marinhos da parede interna estabilizam mudanças físicas e fortalecem feitiços de Alteração.',
  ],

  // 34. Flor de Vermosto: 1:Curar Doenças | 2:Fortalecer Mágicka | 3:Regenerar Mágicka | 4:Frenesi
  'ccBGSSSE037-Curios.esl|000818': [
    'As pétalas carmesins em decocção limpa expulsam febres e enfermidades comuns do sangue.',
    'Os estames dourados elevam a capacidade do corpo de sustentar maior volume de Magicka.',
    'O néctar concentrado na base da flor acelera continuamente o retorno da energia arcana.',
    'O pólen picante das pontas inflama os nervos e desperta fúria descontrolada em quem o inala.',
  ],

  // 35. Restolho: 1:Resistência Elétrica | 2:Fortalecer Capacidade de Carga | 3:Fortalecer Furtividade | 4:Medo
  'ccBGSSSE037-Curios.esl|000819': [
    'As folhas ásperas e secas dissipam cargas estáticas, protegendo o usuário contra choques elétricos.',
    'As fibras resistentes do caule fortalecem a musculatura dorsal para sustentar peso extra.',
    'A resina opaca das raízes ajuda a manter postura baixa e silenciosa em aproximações furtivas.',
    'A fumaça amarga da casca tostada provoca sobressaltos e medo intenso em alvos atingidos.',
  ],

  // 36. Arroz de Sal: 1:Restaurar Vigor | 2:Fortalecer Vigor | 3:Debilidade Gélida | 4:Fortalecer Barganha
  'ccBGSSSE037-Curios.esl|00081A': [
    'Os grãos cozidos liberam amido salino de rápida absorção que recupera o vigor em instantes.',
    'A casca integral macerada prolonga a resistência física e amplia o fôlego disponível.',
    'Os cristais salinos em excesso resfriam a circulação superficial, aumentando a vulnerabilidade ao gelo.',
    'A aguardente límpida destilada do grão solta o trato social e melhora a habilidade de barganha.',
  ],

  // 37. Barbatana de Scalon: 1:Fortalecer Pontaria | 2:Fortalecer Desarmado | 3:Armadura de Dano | 4:Resistência Mágica
  'ccBGSSSE037-Curios.esl|00081B': [
    'Os raios rígidos da barbatana estabilizam a respiração e o braço ao mirar arcos e bestas.',
    'O colágeno espesso da base enrijece os nós dos dedos, dando mais impacto a golpes desarmados.',
    'O muco salino corroído em álcool enfraquece a solidez da armadura que protege o adversário.',
    'As escamas ásperas da borda desviam correntes mágicas e reduzem o efeito de feitiços hostis.',
  ],

  // 38. Geléia de Scrib: 1:Fortalecer Uma-Mão | 2:Resistência Venenosa | 3:Burden (Peso) | 4:Armadura de Dano
  'ccBGSSSE037-Curios.esl|00081C': [
    'A pasta clara lubrifica tendões do antebraço, tornando golpes com armas de uma mão mais rápidos e firmes.',
    'A mucilagem neutra envolve toxinas no estômago e reforça a imunidade contra venenos.',
    'Quando aquecida até engrossar, a massa torna-se pesada nos membros e reduz a mobilidade do alvo.',
    'A fração ácida que se separa no fundo amolece placas e enfraquece a defesa da armadura.',
  ],

  // 39. Scrib Fatiado: 1:Resistência Elétrica | 2:Resistência Gélida | 3:Fortalecer Destruição | 4:Comando
  'ccBGSSSE037-Curios.esl|00081D': [
    'A carne curada ao sal retém quitina seca que isola o corpo contra descargas elétricas.',
    'A gordura compacta das tiras defumadas conserva calor interno e atenua o dano de gelo.',
    'Os sais minerais da cura intensa dão vigor extra a feitiços ofensivos de Destruição.',
    'O extrato concentrado da carne salgada projeta firmeza instintiva sobre bestas próximas.',
  ],

  // 40. Sabão de Lesma: 1:Debilidade Elétrica | 2:Fortalecer Arrombamento | 3:Fortalecer Conjuração | 4:Ficar Etéreo
  'ccBGSSSE037-Curios.esl|00081E': [
    'A pasta alcalina deixa a superfície do corpo altamente condutora, agravando danos elétricos.',
    'A espuma fina reduz o atrito nas pontas dos dedos e melhora a precisão ao forçar fechaduras.',
    'Os resíduos de corais e gorduras marinhas ampliam o alcance de invocações e Conjuração.',
    'Em emulsão muito diluída, o composto dissolve a rigidez física e torna o usuário etéreo.',
  ],

  // 41. Pétalas de Amargor Verde: 1:Resistência Ígnea | 2:Fortalecer Saúde | 3:Refletir Danos | 4:Fortalecer Velocidade
  'ccBGSSSE037-Curios.esl|00081F': [
    'A cera espessa das pétalas resiste à chama direta e protege o corpo contra queimaduras.',
    'O amargor tônico da base fortalece o sangue e eleva temporariamente a saúde máxima.',
    'Os cristais minerais ocultos na folha formam uma crosta que rebate parte do dano sofrido.',
    'Os óleos voláteis destilados em baixa chama agilizam os passos e aumentam a velocidade.',
  ],

  // 42. Essência do Vazio: 1:Visão Noturna | 2:Fortalecer Persuasão | 3:Resistência Mágica | 4:Armadura de Dano
  'ccBGSSSE037-Curios.esl|000820': [
    'O vapor escuro abre a percepção para contrastes mínimos, permitindo enxergar na escuridão.',
    'A ressonância profunda do frasco empresta gravidade hipnótica à voz em qualquer diálogo.',
    'A natureza nula do composto absorve e neutraliza parte dos feitiços hostis lançados contra o corpo.',
    'Em contato ofensivo, o vazio corrói a coesão do metal e do couro, reduzindo a defesa da armadura.',
  ],

  // 43. Olho do Observador: 1:Absorção de Feitiço | 2:Paralisia | 3:Fortalecer Alteração | 4:Burden (Peso)
  'ccBGSSSE037-Curios.esl|000821': [
    'O humor vítreo daedra suga fluxos mágicos externos e os converte em energia para o usuário.',
    'A íris cristalizada paralisa o sistema nervoso de quem entra em contato com seu extrato concentrado.',
    'As membranas oculares preservadas em álcool potencializam feitiços complexos de Alteração.',
    'O núcleo denso da córnea impõe peso asfixiante aos músculos e retarda cada movimento.',
  ],

  // 44. Olho do Vigilante Cego: 1:Absorção de Feitiço | 2:Acender/Luz | 3:Comando | 4:Fortalecer Destruição
  'ccBGSSSE037-Curios.esl|000822': [
    'Mesmo opaca, a lente externa atrai descargas arcanas alheias e as absorve com eficiência.',
    'O nervo óptico macerado desprende uma claridade intensa que ilumina passagens inteiras.',
    'O extrato escuro do globo impõe presença severa capaz de dobrar criaturas à obediência.',
    'Os fluidos residuais do fundo ocular amplificam a força destrutiva de magias elementais.',
  ],

  // 45. Cabeça de Talo Frágil: 1:Fortalecer Bloqueio | 2:Resistência Ígnea | 3:Calmaria | 4:Invisibilidade
  'ccBGSSSE037-Curios.esl|000823': [
    'O chapéu elástico do fungo absorve impactos secos e melhora a firmeza ao aparar com escudo.',
    'A umidade fria presa às lamelas cria um escudo térmico eficiente contra ataques de fogo.',
    'O pó branco desprendido do topo acalma a respiração e aplaca hostilidade imediata.',
    'Em tintura pura, o extrato pálido apaga os contornos do usuário sob a luz ambiente.',
  ],

  // 46. Lua Minguante: 1:Burden (Peso) | 2:Resistência Mágica | 3:Fortalecer Persuasão | 4:Fortalecer Ataques de Poder
  'ccBGSSSE037-Curios.esl|000824': [
    'As pétalas murchas retêm umidade densa que torna os passos pesados e lentos no alvo.',
    'O cálice prateado reflete parcialmente fluxos arcanos, reduzindo o dano de magias hostis.',
    'O perfume noturno suave abranda desconfianças e torna as palavras mais persuasivas.',
    'A raiz contraída concentra tensão muscular que fortalece golpes pesados de combate.',
  ],

  // 47. Cabeça de Minhoca: 1:Fortalecer Alteração | 2:Silêncio | 3:Fortalecer Furto | 4:Fortalecer Furtividade
  'ccBGSSSE037-Curios.esl|000825': [
    'Os anéis segmentados do chapéu reagem com facilidade a reagentes minerais, fortalecendo Alteração.',
    'A pasta viscosa do interior trava a fala de conjuradores e interrompe magias vocais.',
    'O óleo fino da superfície deixa os dedos rápidos e precisos para subtrair objetos sem alerta.',
    'O pigmento terroso do talo reduz o ruído corporal e facilita aproximações furtivas.',
  ],

  // 48. Dentes de Daedroth: 1:Visão Noturna | 2:Fortalecer Persuasão | 3:Danificar Mágicka Prolongado | 4:Invisibilidade
  'ccBGSSSE037-Curios.esl|000826': [
    'O esmalte fosco moído com óleo libera brilho sutil que aguça a visão na escuridão completa.',
    'A imponência planar presente na raiz do dente confere firmeza e autoridade ao discurso.',
    'A dentina aquecida solta resíduo cáustico que consome continuamente a Magicka do inimigo.',
    'Reduzido a pó finíssimo e filtrado, o marfim daedra oculta o corpo da percepção visual.',
  ],

  // 49. Cera de Dreugh: 1:Danificar Saúde | 2:Fortalecer Duas-mãos | 3:Fortalecer Defesa de Armadura | 4:Danificar Mágicka
  'ccBGSSSE037-Curios.esl|000827': [
    'A cera bruta contém secreção marinha tóxica que agride os órgãos internos quando ingerida.',
    'A resina densa aquece e firma os músculos do tronco para golpes pesados com armas de duas mãos.',
    'Quando cristalizada em bálsamo, enrijece a pele e eleva a proteção física da armadura.',
    'A fração salina que escorre da prensagem dissipa a concentração e drena a Magicka do alvo.',
  ],

  // 50. Icor de Élitro: 1:Fortalecer Ataques Furtivos | 2:Fortalecer Velocidade | 3:Paralisia | 4:Acender/Luz
  'ccBGSSSE037-Curios.esl|000828': [
    'O fluido cristalino afia o foco do atacante, ampliando o dano em golpes furtivos precisos.',
    'As gotas luminosas aceleram o ritmo nervoso e impulsionam a velocidade dos deslocamentos.',
    'Quando engrossado ao ar, o icor endurece sobre as juntas e paralisa completamente a vítima.',
    'Mesmo em pequena quantidade, o líquido irradia luz viva capaz de clarear túneis escuros.',
  ],

  // 51. Pétala de Fogo: 1:Danificar Vigor | 2:Debilidade Gélida | 3:Regenerar Vigor | 4:Danificar Mágicka Prolongado
  'ccBGSSSE037-Curios.esl|000829': [
    'O calor seco das pétalas desidrata rapidamente as fibras musculares, drenando o vigor do alvo.',
    'A tensão térmica da flor desestabiliza a proteção corporal contra ataques de gelo intenso.',
    'Em microdose temperada com água fria, o óleo aquecido estimula a recuperação contínua do fôlego.',
    'A cinza vermelha da base consome lentamente as reservas de Magicka ao longo do tempo.',
  ],

  // 52. Caule de Chama: 1:Debilidade Venenosa | 2:Debilidade Ígnea | 3:Danificar Saúde Prolongado | 4:Fortalecer Rugidos
  'ccBGSSSE037-Curios.esl|00082A': [
    'A seiva irritante fragiliza as mucosas e deixa o organismo mais sensível a qualquer veneno.',
    'O talo ressecado sensibiliza a pele ao calor, ampliando o dano sofrido por chamas.',
    'As brasas internas do núcleo provocam queimação lenta que consome a saúde por vários segundos.',
    'O vapor quente inalado em fração mínima aquece o diafragma e fortalece o poder dos rugidos.',
  ],

  // 53. Caule de Fungo: 1:Debilidade Ígnea | 2:Debilidade Venenosa | 3:Fortalecer Ataques Furtivos | 4:Fortalecer Alteração
  'ccBGSSSE037-Curios.esl|00082B': [
    'A fibra úmida e inflamável do caule torna o alvo mais vulnerável a ataques de fogo.',
    'Os poros abertos da polpa facilitam a entrada de toxinas e reduzem a resistência a venenos.',
    'O extrato escuro do talo aumenta a precisão letal de golpes desferidos pelas sombras.',
    'A estrutura esponjosa fixa bem reagentes minerais, fortalecendo encantamentos de Alteração.',
  ],

  // 54. Casca de Gnarl: 1:Danificar Mágicka | 2:Fortalecer Saúde | 3:Frenesi | 4:Danificar Vigor Prolongado
  'ccBGSSSE037-Curios.esl|00082C': [
    'A madeira retorcida suga vibrações arcanas próximas e reduz bruscamente a Magicka do alvo.',
    'A seiva resinosa sob o córtex fortalece a vitalidade e aumenta a resistência física a ferimentos.',
    'Os fungos presos às fendas da casca agitam os nervos e levam criaturas a atacar sem distinção.',
    'As farpas ácidas maceradas esgotam gradualmente a resistência muscular do adversário.',
  ],

  // 55. Canete Dourado: 1:Resistência Venenosa | 2:Fortalecer Uma-Mão | 3:Fortalecer Ataques de Poder | 4:Fortalecer Desarmado
  'ccBGSSSE037-Curios.esl|00082D': [
    'As pétalas douradas bloqueiam a absorção de toxinas e elevam a resistência contra venenos.',
    'O pólen firme do centro dá vigor adicional ao braço dominante em golpes de uma mão.',
    'A raiz densa libera energia explosiva que potencializa ataques pesados carregados.',
    'Os estames macerados fortalecem os tendões dos punhos para o combate corpo a corpo desarmado.',
  ],

  // 56. Folha de Hackle-Lo: 1:Restaurar Saúde | 2:Restaurar Vigor | 3:Debilidade Venenosa | 4:Fortalecer Bloqueio
  'ccBGSSSE037-Curios.esl|00082E': [
    'Mastigada ou reduzida em chá claro, a folha macia fecha escoriações e restaura a saúde.',
    'O sumo fresco das nervuras revitaliza o corpo rapidamente e devolve o vigor perdido.',
    'O resíduo escuro deixado após fervura longa deixa o sangue mais suscetível a venenos.',
    'As folhas maduras enrijecem o antebraço, melhorando a estabilidade ao bloquear golpes com escudo.',
  ],

  // 57. Ambrosia: 1:Fortalecer Persuasão | 2:Acender/Luz | 3:Caminhar Sobre a Água | 4:Abafar
  'ccBGSSSE037-Curios.esl|000836': [
    'O néctar aromático suaviza a voz e confere presença encantadora em qualquer negociação.',
    'A polpa dourada guarda luminescência serena capaz de iluminar salas e corredores escuros.',
    'A leveza aérea da essência permite sustentar os passos sobre a superfície líquida da água.',
    'O óleo macio silencia o roçar das roupas e das botas, abafando o som do caminhar.',
  ],

  // 58. Licor: 1:Visão Noturna | 2:Absorção de Feitiço | 3:Fortalecer Conjuração | 4:Medo
  'ccBGSSSE037-Curios.esl|000837': [
    'O extrato negro dos tecidos sombrios aguça a visão noturna mesmo sob escuridão espessa.',
    'A substância densa suga feitiços adversários no contato, absorvendo parte da energia arcana.',
    'Os vestígios necróticos ampliam a firmeza dos vínculos invocados pela escola de Conjuração.',
    'O odor fúnebre que sobe da mistura instila pavor súbito em quem é atingido por ela.',
  ],

  // 59. Arônia: 1:Fortalecer Rugidos | 2:Fortalecer Restauração | 3:Visão Noturna | 4:Medo
  'ccBGSSSE037-Curios.esl|000838': [
    'Os frutos adstringentes limpam e aquecem a garganta, fortalecendo a projeção dos rugidos.',
    'A polpa escura rica em taninos sustenta feitiços curativos e amplia a Restauração.',
    'O pigmento arroxeado da casca melhora a acuidade visual em ambientes de pouca luz.',
    'O sumo cru extremamente amargo provoca aperto no peito e desencadeia medo na vítima.',
  ],

  // 60. Coração da Ordem: 1:Visão Noturna | 2:Absorção de Feitiço | 3:Fortalecer Persuasão | 4:Frenesi
  'ccBGSSSE037-Curios.esl|000851': [
    'Os cristais simétricos do núcleo ampliam a clareza do olhar até na mais completa escuridão.',
    'A estrutura cristalina atrai e absorve energia mágica hostil antes que atinja o portador.',
    'A harmonia fria do composto empresta firmeza lógica e poder persuasivo às palavras.',
    'Quando fragmentado de modo impuro, o choque de ordem rígida leva o alvo a um frenesi violento.',
  ],

  // 61. Fruta Alocasia: 1:Restaurar Mágicka | 2:Restaurar Saúde | 3:Resistência Venenosa | 4:Danificar Vigor
  'ccBGSSSE037-Curios.esl|000D62': [
    'A polpa suculenta refresca a mente exausta e recompõe rapidamente a reserva de Magicka.',
    'O sumo doce do fruto nutre o sangue enfraquecido e auxilia a recuperação da saúde.',
    'A casca fibrosa em infusão neutraliza toxinas leves e aumenta a resistência a venenos.',
    'As sementes cruas mal trituradas causam cólicas súbitas que drenam o vigor físico.',
  ],

  // 62. Miolo de Flora Áster: 1:Fortalecer Furto | 2:Fortalecer Pontaria | 3:Caminhar Sobre a Água | 4:Fortalecer Bloqueio
  'ccBGSSSE037-Curios.esl|000D66': [
    'O óleo seco do miolo aumenta a agilidade fina dos dedos em movimentos discretos de furto.',
    'O pó dourado central estabiliza a vista e melhora a precisão de disparos à distância.',
    'A estrutura leve e aerada sustenta o equilíbrio corporal sobre a superfície da água.',
    'As fibras centrais endurecem o punho, permitindo aparar impactos fortes com maior firmeza.',
  ],

  // 63. Pétalas de Verde Amargo: 1:Curar Doenças | 2:Fortalecer Capacidade de Carga | 3:Fortalecer Defesa de Armadura | 4:Ficar Etéreo
  'ccBGSSSE037-Curios.esl|000D68': [
    'O amargor intenso das pétalas limpa o organismo de contágios e cura doenças comuns.',
    'O extrato verde reforça a resistência lombar e amplia a capacidade de carga do portador.',
    'A resina firme da base cria um revestimento denso que aumenta a proteção da armadura.',
    'Em destilação pura e fria, o vapor da folha atenua a solidez física e torna o corpo etéreo.',
  ],

  // 64. Cabeça de Morchella: 1:Fortalecer Desarmado | 2:Fortalecer Ataques de Poder | 3:Fortalecer Furtividade | 4:Regenerar Mágicka
  'ccBGSSSE037-Curios.esl|000D6A': [
    'Os alvéolos esponjosos do chapéu estimulam os tendões das mãos para golpes desarmados mais duros.',
    'A carne firme do fungo concentra energia muscular que fortalece ataques pesados de poder.',
    'Os esporos escuros e secos abafam o rastro corporal, favorecendo a movimentação furtiva.',
    'O caldo claro da base do talo acelera continuamente a regeneração natural de Magicka.',
  ],

  // 65. Farol do Pântano: 1:Fortalecer Barganha | 2:Resistência Elétrica | 3:Fortalecer Alteração | 4:Fortalecer Pontaria
  'ccBGSSSE037-Curios.esl|000D6C': [
    'O brilho quente do fungo aclara o raciocínio e facilita acordos vantajosos na barganha.',
    'A membrana úmida do chapéu desvia faíscas e reduz o dano causado por ataques elétricos.',
    'Os sais acumulados na haste reforçam a estabilidade de feitiços da escola de Alteração.',
    'O extrato luminescente aguça o foco visual, auxiliando a pontaria com arcos e bestas.',
  ],

  // 66. Flor Amarela da Montanha: 1:Fortalecer Vigor | 2:Restaurar Saúde | 3:Regenerar Saúde | 4:Regenerar Mágicka
  'Dawnguard.esm|002A78': [
    'As pétalas solares fortalecem o fôlego e ampliam o vigor físico durante longas travessias.',
    'O pólen dourado macerado em água limpa fecha ferimentos leves e restaura a saúde.',
    'A seiva do caule estimula a cicatrização contínua dos tecidos por um período prolongado.',
    'O néctar aquecido com cuidado nutre os canais arcanos e acelera a regeneração de Magicka.',
  ],

  // 67. Asa de Mariposa Ancestral: 1:Fortalecer Mágicka | 2:Curar Doenças | 3:Resistência Ígnea | 4:Fortalecer Saúde
  'Dawnguard.esm|0059BA': [
    'A poeira luminosa das asas antigas expande a capacidade do corpo de armazenar Magicka.',
    'Os filamentos macios fervidos em infusão pura limpam enfermidades persistentes do sangue.',
    'As escamas douradas isolam a pele do calor extremo, aumentando a resistência contra o fogo.',
    'A essência sutil preservada nas nervuras fortalece o organismo e eleva a saúde máxima.',
  ],

  // 68. Flor Brilhante: 1:Debilidade Ígnea | 2:Danificar Saúde | 3:Fortalecer Desarmado | 4:Refletir Danos
  'Dawnguard.esm|00B097': [
    'Os óleos voláteis da corola reagem ao calor e deixam o alvo vulnerável a chamas.',
    'A seiva fosforescente das raízes subterrâneas agride os tecidos internos e causa dano à saúde.',
    'Os bulbos rígidos fortalecem a musculatura dos braços para combates sem armas.',
    'A película mineral das pétalas devolve parte da força dos impactos contra quem ataca.',
  ],

  // 69. Antena de Chaurus Caçador: 1:Danificar Saúde Prolongado | 2:Calmaria | 3:Fortalecer Restauração | 4:Danificar Mágicka
  'Dawnguard.esm|0183B7': [
    'Os pelos sensoriais da antena contêm veneno lento que corrói a saúde ao longo do tempo.',
    'Em extração fria, o fluido neural aquieta os sentidos e induz calmaria forçada.',
    'A quitina interna das articulações potencializa práticas curativas de Restauração.',
    'O líquido da base rompe o foco mental e reduz subitamente a Magicka disponível.',
  ],

  // 70. Flor Venenosa: 1:Caminhar Sobre a Água | 2:Danificar Vigor Prolongado | 3:Fortalecer Persuasão | 4:Visão Noturna
  'Dawnguard.esm|0185FB': [
    'A cera hidrófoba das folhas impede o corpo de afundar e permite caminhar sobre a água.',
    'Os espinhos do cálice liberam toxina persistente que consome o vigor sem trégua.',
    'O aroma doce e enganoso da flor suaviza a fala e reforça o poder de persuasão.',
    'As gotículas escuras do miolo adaptam a vista para enxergar com nitidez na penumbra.',
  ],

  // 71. Vagem de Grama de Cinzas: 1:Restaurar Mágicka | 2:Fortalecer Vigor | 3:Fortalecer Mágicka | 4:Resistência Elétrica
  'Dragonborn.esm|016E26': [
    'As sementes tostadas naturalmente nas cinzas liberam um extrato que restaura a Magicka.',
    'A vagem fibrosa nutre os músculos secos e eleva o vigor máximo durante esforços físicos.',
    'Os grãos escuros moídos ampliam temporariamente o limite de Magicka do conjurador.',
    'A película de cinza vulcânica aderida à casca isola o corpo contra descargas elétricas.',
  ],

  // 72. Raiz de Trama: 1:Fortalecer Uma-Mão | 2:Fortalecer Capacidade de Carga | 3:Debilidade Elétrica | 4:Resistência Ígnea
  'Dragonborn.esm|017008': [
    'As fibras retorcidas enrijecem o punho e melhoram o controle em golpes com armas de uma mão.',
    'A polpa seca da raiz sustenta a coluna e amplia o peso que o viajante consegue carregar.',
    'Os sais vulcânicos acumulados na casca atraem correntes elétricas e agravam choques.',
    'A seiva grossa adaptada aos campos de cinza protege a pele contra queimaduras e fogo.',
  ],

  // 73. Arranha-papo: 1:Respiração Aquática | 2:Resistência Venenosa | 3:Debilidade Gélida | 4:Curar Doenças
  'Dragonborn.esm|017E97': [
    'As folhas esponjosas armazenam ar suficiente para sustentar a respiração debaixo d\'água.',
    'O sumo acre da planta neutraliza toxinas circulantes e reforça a resistência a venenos.',
    'A seiva árida reduz a retenção de calor na pele, aumentando a sensibilidade ao frio.',
    'Os brotos fervidos em água limpa purificam o organismo e curam doenças adquiridas.',
  ],

  // 74. Cinzas Vivas: 1:Silêncio | 2:Fortalecer Conjuração | 3:Resistência Mágica | 4:Burden (Peso)
  'Dragonborn.esm|01CD6D': [
    'O pó vulcânico ainda animado seca a garganta do alvo e silencia qualquer encantamento.',
    'A brasa fria presa às partículas reforça pactos necromânticos e feitiços de Conjuração.',
    'A barreira mineral das cinzas amortece descargas mágicas hostis antes do impacto.',
    'Quando condensada em pasta pesada, a cinza sobrecarrega os passos como chumbo.',
  ],

  // 75. Madeira de Spriggan Queimada: 1:Armadura de Dano | 2:Invisibilidade | 3:Regenerar Mágicka | 4:Acender/Luz
  'Dragonborn.esm|01CD6E': [
    'O alcatrão ácido liberado da madeira carbonizada corrói a solidez das armaduras atingidas.',
    'A fumaça fina destilada do cerne envolve o corpo e o oculta da visão alheia.',
    'A seiva ainda viva sob a casca queimada acelera continuamente a regeneração de Magicka.',
    'As lascas resinosas mantêm uma luminescência branda capaz de clarear ambientes escuros.',
  ],

  // 76. Presa de Javali: 1:Fortalecer Pontaria | 2:Debilidade Ígnea | 3:Debilidade Venenosa | 4:Frenesi
  'Dragonborn.esm|01CD6F': [
    'O pó da presa estabiliza o tônus muscular dos braços, dando precisão extra à pontaria.',
    'A medula seca da raiz dentária resseca os tecidos e torna o alvo vulnerável ao fogo.',
    'Os sais cáusticos da base abrem caminho para toxinas e reduzem a resistência a venenos.',
    'O extrato bruto do marfim animal desperta agressividade cega que ataca tudo ao redor.',
  ],

  // 77. Geleia de Saltador das Cinzas: 1:Fortalecer Furtividade | 2:Fortalecer Desarmado | 3:Regenerar Saúde | 4:Fortalecer Bloqueio
  'Dragonborn.esm|01CD71': [
    'A geleia elástica amortece o peso das passadas e facilita aproximações silenciosas.',
    'Quando endurecida sobre a pele, fortalece os músculos das mãos para combates desarmados.',
    'O muco rico em nutrientes sela microlesões e acelera a regeneração contínua da saúde.',
    'A fração mais densa estabiliza o braço e melhora a firmeza ao bloquear com escudo.',
  ],

  // 78. Geleia de Netch: 1:Fortalecer Destruição | 2:Fortalecer Rugidos | 3:Fortalecer Restauração | 4:Fortalecer Ataques Furtivos
  'Dragonborn.esm|01CD72': [
    'Os filamentos carregados da geleia amplificam o poder bruto de feitiços de Destruição.',
    'O vapor leve da membrana expande o fôlego e fortalece o alcance vocal dos rugidos.',
    'A matriz gelatinosa pura favorece bênçãos curativas e práticas de Restauração.',
    'O óleo quase sem atrito aguça a precisão letal em golpes desferidos pelas sombras.',
  ],

  // 79. Raiz de Trepadeira Cinerária: 1:Fortalecer Arrombamento | 2:Fortalecer Defesa de Armadura | 3:Fortalecer Duas-mãos | 4:Fortalecer Furto
  'Dragonborn.esm|01CD74': [
    'Os filamentos finos da raiz aguçam a sensibilidade tátil ao lidar com gazuas e trancas.',
    'A casca enrijecida pelo solo de cinzas reforça a resistência física de armaduras.',
    'O tronco denso da trepadeira sustenta o esforço amplo necessário às armas de duas mãos.',
    'O pó seco e fino impede o suor nas mãos, auxiliando manobras discretas de furto.',
  ],

  // 80. Musgo Parasol Imperador: 1:Curar Doenças | 2:Resistência Gélida | 3:Danificar Vigor | 4:Arma de Dano
  'Dragonborn.esm|01FF75': [
    'As fibras claras cozidas em infusão limpa combatem febres e curam doenças adquiridas.',
    'Os tufos densos conservam calor residual e protegem o corpo contra ventos gélidos.',
    'Os esporos amargos da parte inferior cansam a respiração e drenam o vigor do alvo.',
    'O extrato concentrado da base corrói o vigor dos braços e reduz o dano das armas.',
  ],

  // 81. Penas de Felsaad Tern: 1:Fortalecer Saúde | 2:Regenerar Vigor | 3:Fortalecer Ataques de Poder | 4:Medo
  'Dragonborn.esm|03CD8E': [
    'Os cálamos macerados em caldo quente fortalecem o organismo e elevam a saúde máxima.',
    'A plumagem leve em infusão estimula o ritmo respiratório e regenera o vigor continuamente.',
    'A haste firme das penas maiores concentra energia para ataques carregados mais potentes.',
    'O pó fino das bárbulas queimadas provoca calafrios súbitos e pânico em alvos próximos.',
  ],

  // 82. Ovas de Salmão: 1:Danificar Mágicka | 2:Debilidade Venenosa | 3:Fortalecer Bloqueio | 4:Fortalecer Ataques de Poder
  'HearthFires.esm|003545': [
    'Os óleos salgados das ovas rompem o fluxo mental e drenam a Magicka do adversário.',
    'A película gelatinosa facilita a absorção de toxinas e deixa o alvo sensível a venenos.',
    'O caldo nutritivo fortalece os antebraços e melhora a estabilidade no bloqueio de golpes.',
    'As proteínas concentradas dão impulso explosivo a ataques pesados de combate.',
  ],

  // 83. Ovo de Falcão: 1:Debilidade Ígnea | 2:Fortalecer Saúde | 3:Fortalecer Duas-mãos | 4:Fortalecer Desarmado
  'HearthFires.esm|00F1CC': [
    'A clara aerada reage com calor intenso e torna a pele mais vulnerável a queimaduras.',
    'A gema densa fortalece o corpo rapidamente e eleva o limite máximo de saúde.',
    'Os sais minerais da casca moída dão vigor aos ombros para manejar armas de duas mãos.',
    'A membrana interna elástica enrijece os tendões dos punhos para golpes desarmados.',
  ],

  // 84. Olho de Lobo: 1:Resistência Gélida | 2:Fortalecer Uma-Mão | 3:Resistência Mágica | 4:Fortalecer Ataques Furtivos
  'Predator Vision.esp|02458A': [
    'O humor aquoso adaptado às nevascas protege a circulação contra o frio rigoroso.',
    'O extrato vítreo aguça os reflexos imediatos e melhora a destreza com armas de uma mão.',
    'A retina escura filtra perturbações arcanas e reduz o impacto de magias hostis.',
    'O foco predatório concentrado no globo eleva a letalidade de golpes furtivos.',
  ],

  // 179. Casca Podre: 1:Danificar Vigor Prolongado | 2:Fortalecer Destruição | 3:Danificar Saúde Prolongado | 4:Absorção de Feitiço
  'Update.esm|00306D': [
    'Os fungos incrustados na madeira em decomposição consomem a resistência física sem trégua.',
    'A putrefação resinosa libera ácidos que amplificam a força de feitiços de Destruição.',
    'O caldo escuro da camada interna continua corroendo os tecidos e drenando saúde lentamente.',
    'A estrutura esponjosa e porosa absorve descargas mágicas alheias antes que firam o corpo.',
  ],

  // 180. Fauce Gritador: 1:Fortalecer Ilusão | 2:Fortalecer Ataques Furtivos | 3:Acender/Luz | 4:Comando
  'Update.esm|00306E': [
    'As pétalas carnudas reverberam estímulos sensoriais que potencializam magias de Ilusão.',
    'O látex escuro do talo aguça a precisão mortal de investidas desferidas sem ser visto.',
    'O interior úmido da boca vegetal emite brilho pálido capaz de iluminar ao redor.',
    'O pólen ressonante da garganta da flor dobra vontades frágeis ao comando do alquimista.',
  ],

  // 181. Gancho Espinhoso: 1:Fortalecer Restauração | 2:Fortalecer Velocidade | 3:Regenerar Mágicka | 4:Fortalecer Rugidos
  'Update.esm|00306F': [
    'A seiva clara sob os espinhos limpa e nutre feitiços voltados à Restauração.',
    'As fibras elásticas do gancho aceleram os reflexos motores e aumentam a velocidade.',
    'O núcleo úmido mantém o fluxo arcano ativo, acelerando a regeneração de Magicka.',
    'Os cristais picantes da ponta aquecem as vias vocais e reforçam a potência dos rugidos.',
  ],
};

module.exports = { DLC_CC_INGREDIENT_LORE };
