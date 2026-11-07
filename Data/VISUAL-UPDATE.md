# Interface aprovada — edição Meridian

A interface usa GuildAlchemyUI.request e o evento guildalchemy:state do Meridian. O cenário do jogo aparece atrás da camada preta uniforme a 75%. Preparar inicia sem seleção.

A edição compacta centraliza a janela vertical e horizontalmente na viewport, aproxima as linhas de efeito e remove o selo redundante “BANCADA DA GUILDA”. A configuração `Data/SKSE/Plugins/GuildAlchemy.json` inicia com `debug: false`. O painel de resultado recebe fundo preto quase opaco para cobrir o texto de ativação da bancada quando o jogo o desenha por trás da UI; a composição final precisa ser verificada no Skyrim.
A correção nativa complementar oculta o nome de ativação durante a interação, com fallback para o HUD Menu completo, e restaura sua visibilidade ao fechar a bancada. Veja HUD-FIX.md.

