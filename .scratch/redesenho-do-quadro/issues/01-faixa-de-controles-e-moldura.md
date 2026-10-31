# 01: Faixa de controles, "Quadro ▾", Filtros e moldura nova

**Como resolve a sua parte:** hoje o Quadro pula de lugar quando um filtro liga, os cinco filtros ficam soltos num bloco e o Quadro | Lista aparece em dois lugares. Este ticket põe os controles numa faixa de altura fixa, com uma escolha só de forma de ver ("Quadro ▾") e os filtros atrás de um botão com contador, e troca a barra de cima e a faixa lateral pelas da proposta 6.

**What to build:** na área de processos (os três quadros e a Lista), a faixa de controles de 56px com [Cadastrar processo], "Quadro ▾" (Quadro por etapa, Quadro por responsável, Quadro por setor, Lista), separador, [Filtros n] e, na ponta direita, a legenda das etiquetas. "Só os meus" fica onde está até o ticket 02. A barra de cima fica com título, busca, sino e avatar (busca e sino com o aviso "Em breve"); a faixa lateral com Processos, Setores, Painel, Administração e Ajuda, com Painel e Ajuda abrindo uma tela "Em breve". Spec: seção "Redesenho do Quadro" de `.scratch/processos-etapas/spec.md`, histórias 1 a 11, 27 a 33 e 53 a 58.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] A faixa tem altura fixa e os controles na ordem da proposta 6; ligar e desligar filtros não muda a posição de nenhum controle nem a altura da faixa; [Cadastrar processo] é o único azul cheio.
- [x] "Quadro ▾" mostra a forma escolhida, abre o menu pelo mouse e pelo teclado (Enter, setas, Esc, foco volta ao botão) e troca a forma de ver no endereço; não há mais "Agrupar por" no Quadro.
- [x] Endereços antigos (com o agrupamento de hoje) abrem a mesma forma de ver.
- [x] A Lista também mostra a faixa, com "Quadro ▾" em "Lista" e os controles dela.
- [x] [Filtros] abre o painel com os cinco filtros e "Limpar filtros", aplica ao escolher, mostra o contador dos ligados (sem contador sem filtro, azul-claro com filtro), fecha com Esc, clique fora ou o botão, devolve o foco e mantém os filtros no endereço; o vazio "Nenhum processo com estes filtros." continua.
- [x] Em tela estreita a faixa fica numa linha, e a legenda sai antes dos controles.
- [x] Os controles da faixa aparecem desde o carregamento, desabilitados até os dados chegarem.
- [x] A barra de cima não tem mais Quadro | Lista; busca e sino mostram "Em breve".
- [x] A faixa lateral tem Processos (abre a última forma de ver da sessão, ou o Quadro por etapa), Setores, Painel, Administração (só para Administrador) e Ajuda no pé, com o nome ao passar o mouse e para o leitor de tela e o item atual marcado; Painel e Ajuda abrem a tela "Em breve".
- [x] Consulta vê a faixa sem [Cadastrar processo].
- [x] Testes de tela para cada item acima; os testes atuais de "Agrupar por" e do Quadro | Lista passam para os controles novos.
- [ ] `[visual]` Faixa, barra branca e faixa lateral grafite seguem a proposta 6 e `.scratch/identidade-visual.md` em 1366×768 e 1440×900; o painel dos Filtros não cobre a faixa. (Visto em 2026-10-31 só na vitrine local com módulos falsos, em 1366×768, 1440×900 e 375: faixa de 56px colada na barra, uma linha, painel abaixo da faixa; falta ver com o login real.)

Concluído em 2026-10-31 (commit b6558d7)
