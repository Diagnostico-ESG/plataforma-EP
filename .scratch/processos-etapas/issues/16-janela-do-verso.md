# 16: A janela do verso do cartão

**Como resolve a sua parte.** Hoje o processo abre num painel lateral estreito, em que tudo fica empilhado e é preciso rolar para achar o que interessa. Este ticket troca o painel pela janela central larga, em duas colunas (trabalho à esquerda, contexto à direita), com o cabeçalho novo e as ações raras reunidas no menu "⋯". É a base dos tickets 17 a 19: as seções atuais só mudam de lugar aqui, e o desenho novo de cada uma vem neles.

**What to build:** o verso do cartão no lugar do painel lateral, aberto por cima do Quadro ou da Lista (escurecidos e inertes), pelo cartão, pela linha da Lista, pelo endereço `#/processos/<id>` e pela tela do setor. Janela central de até cerca de 880 px, colunas de 60% e 40% (a direita em fundo levemente cinza), até 90% da altura, uma só rolagem com o cabeçalho fixo, aparecimento suave de cerca de 150 ms (desligado quando o computador pede menos movimento); abaixo de 900 px, tela toda e uma coluna. Cabeçalho com o quadradinho da sigla, o nome, o macroprocesso com o quadradinho da cor e o tipo em texto, a pílula de situação só em Suspenso, Cancelado e Concluído, o "⋯" do processo e o fechar. Menu "⋯" em três grupos (Histórico · Editar · Reclassificar; Suspender ou Retomar · Cancelar; Excluir em vermelho), com as janelas que já existem; a Consulta vê só Histórico. Até os tickets 17 a 19, as seções atuais (caminho de etapas, versões, reunião, dados, estrutura) entram nas colunas como estão, e o Histórico, o Editar e o Novo processo continuam funcionando como hoje dentro da janela. Pai e subprocesso abrem na mesma janela, trocando o conteúdo e o endereço. Estados: carregando com blocos cinza no formato final e "Carregando processo…" para o leitor de tela; erro com [Tentar de novo]; processo excluído com [Voltar]. Teclado e leitor de tela: diálogo anunciado como "Processo {nome}", foco no nome ao abrir, Tab preso dentro da janela, Esc fecha, foco de volta ao cartão ou à linha de origem. Spec: `.scratch/processos-etapas/spec.md` (histórias 28, 108 a 111, 128, 132 a 136; "Interface", "Verso do cartão", itens Janela, Cabeçalho, Menu "⋯" e Teclado; "Estados"; "Decisões de teste", verso do cartão).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] O verso abre pelo cartão, pela linha da Lista, pelo endereço e pela tela do setor; fecha pelo botão e por Esc, com o foco de volta ao cartão ou à linha.
- [ ] Pai e subprocesso abrem na mesma janela, com o endereço mudando.
- [ ] A janela é um diálogo com o nome acessível "Processo {nome}", o foco vai ao nome ao abrir e o Tab fica preso dentro dela.
- [ ] Cabeçalho com o tipo em texto e a pílula de situação só em suspenso, cancelado e concluído.
- [ ] Menu "⋯" com os três grupos e as ações funcionando pelas janelas atuais; só Histórico para a Consulta.
- [ ] Estados: carregando (blocos e o texto para o leitor de tela), erro com [Tentar de novo] e processo excluído com [Voltar].
- [ ] O aparecimento suave fica desligado quando o computador pede menos movimento.
- [ ] Os testes de tela atuais que falam do painel (`App.painelDoProcesso`, `App.andamentoDoProcesso` e os outros que o abrem) passam ajustados ao verso, mantendo os comportamentos que continuam valendo.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `[visual]` O verso abre como janela central de até cerca de 880 px, em duas colunas de 60% e 40%, a direita em fundo levemente cinza, com o Quadro ou a Lista escurecidos atrás; o cabeçalho fica fixo e a janela tem uma só rolagem; abaixo de 900 px de largura, ocupa a tela inteira em uma coluna.
- [ ] `[visual]` O cabeçalho do verso mostra pílula só em suspenso, cancelado e concluído; o menu "⋯" tem os três grupos com Excluir em vermelho no fim.
- [ ] `[visual]` O carregando mostra blocos cinza no formato final, sem a janela mudar de tamanho quando os dados chegam.

Concluído em 2026-10-19 (commit 9abb033)
