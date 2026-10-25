# 27: Cara do cartão: barra em blocos, etiquetas coloridas, processo parado e Anotações

**Como resolve a sua parte.** Depois do Andamento livre, a barra repete no Quadro por etapa o que a coluna já diz e falta onde a etapa não está dita; a etiqueta é uma pílula cinza igual às outras; e o processo parado tem um âmbar que se confundiria com a etiqueta Em andamento. Este ticket dá ao cartão e às listas a leitura de relance que o Planner tem: a barra em blocos com o nome e a posição da etapa onde a coluna não diz a etapa, as etiquetas em cor suave, um aviso vermelho para o processo parado e mais espaço para escrever as Anotações. Só tela; nada muda no banco.

**What to build:** spec de processos-etapas, seção "Cartão e verso (mudança de 2026-10-25)", partes "Barra da etapa", "Etiquetas", "Processo parado" e "Anotações":

- **Barra:** um bloco por etapa ativa (de Não iniciados a Concluídos); anteriores cinza cheio, a atual meio cheia, seguintes vazias com borda; em Concluídos, todas cheias; "Nome da etapa · {n} de {N}" acima; só cinza, sem azul; nome acessível "Etapa {n} de {N}: {nome}". Um componente só, usado no cartão do Quadro agrupado por responsável (no lugar do nome da etapa no rodapé), na coluna "Etapa atual" da Lista e na de Processos do setor. Sai do cartão do Quadro agrupado por etapa. Suspenso e cancelado mostram a barra da etapa onde pararam.
- **Etiquetas:** pílula com bolinha e texto, A fazer cinza, Em andamento laranja suave, Concluído verde suave (tokens novos de fundo e texto, tirados do esboço `.scratch/quadro-livre/esboco-cartao.html`, com contraste de texto de pelo menos 4,5:1), no cartão e na coluna Etiqueta da Lista. No Agora, continua a lista de escolha.
- **Processo parado:** o selo "{n} dias nesta etapa" passa ao vermelho suave (tokens de atraso já existentes) e o cartão ganha uma faixa vermelha na borda esquerda; o mesmo selo ao lado do nome na Lista e no Agora. A regra de quando vale não muda (uma função só decide).
- **Anotações:** o campo começa com cerca de 7 linhas; o máximo continua em cerca de 12, e depois rola por dentro.

**Blocked by:** None (can start immediately). Rodar depois do 26, que também mexe no cartão (selo da modelagem), para os dois não se sobreporem.

**Status:** ready-for-agent

- [ ] O cartão do Quadro agrupado por etapa não tem barra; o do Quadro agrupado por responsável tem a barra com "Nome · n de N" no lugar do nome da etapa no rodapé.
- [ ] A Lista e Processos do setor mostram a barra na coluna "Etapa atual", com o nome acessível "Etapa n de N: nome".
- [ ] A função da barra devolve os blocos e o texto: Não iniciados com o primeiro bloco atual e o resto vazio; Concluídos com todos cheios; etapa desativada fora da contagem.
- [ ] As etiquetas aparecem com o texto e a cor de cada valor no cartão e na Lista; o Agora mantém a lista de escolha.
- [ ] O processo com 8 dias na etapa tem selo vermelho e faixa no cartão, e selo na Lista e no Agora; com 7 dias, nada; em Não iniciados, Concluídos, suspenso e cancelado, nada.
- [ ] Os testes de tela e de função que procuravam a barra no Quadro por etapa, a pílula neutra da etiqueta e o selo âmbar passam ao desenho novo.
- [ ] `[visual]` A barra segue o esboço A, sem azul e sem estourar a largura da coluna, no cartão por responsável, na Lista e em Processos do setor.
- [ ] `[visual]` As etiquetas aparecem como pílula com bolinha, legíveis e sem azul.
- [ ] `[visual]` O processo parado salta aos olhos no Quadro, sem confundir com o laranja de Em andamento.
- [ ] `[visual]` O campo das Anotações abre com cerca de 7 linhas e rola por dentro depois de cerca de 12, sem empurrar a janela do verso.
