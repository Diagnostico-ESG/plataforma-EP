# 04: Lista com filtro e ordenação por coluna

**Como resolve a sua parte.** A Lista tem uma barra de filtros separada da tabela e não se ordena por coluna. Este ticket leva o filtro e a ordenação para o cabeçalho de cada coluna, como numa planilha, e guarda a visão no endereço.

**What to build:** spec, seção "Lista: cabeçalhos com filtro e ordenação" e "Endereço da página":

- A barra de filtros sai da Lista (continua no Quadro). Acima da tabela ficam a busca pelo nome, o par Todos | Concluídos (do ticket 02) e "Limpar filtros" quando há filtro. A coluna "Nome" passa a se chamar **Processo**.
- Cada cabeçalho é um botão que abre um menu pequeno com a ordenação (crescente, decrescente) e, menos em Processo, o filtro de um valor, com "Todos". O cabeçalho mostra quando a coluna está filtrada e o sentido da ordenação; o menu abre sem sair da tela em 1366×768 e funciona pelo teclado.
- Filtros por coluna: Tipo, Setor, Macroprocesso, Etapa atual, Responsável (mesmas opções de hoje) e Situação (Em andamento, Suspenso, Concluído; some com Concluídos).
- Ordenação: Processo, Tipo, Setor (sigla), Macroprocesso e Responsável (sem responsável por último) em ordem alfabética; Etapa atual pela ordem do catálogo; Situação em andamento, suspenso, concluído. Padrão: Processo, crescente. Subprocessos seguem o processo pai.
- Endereço: filtros, ordenação (coluna e sentido) e `mostrar` ficam no endereço; recarregar ou mandar o link mostra a mesma visão.
- Funções puras (ordenação, filtro por coluna, leitura e gravação do endereço) com teste sem tela; o resto pela tela inteira com os módulos falsos. Estados de carregando, vazio e erro como hoje, com o cabeçalho novo.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A barra de filtros não está mais na Lista; a busca, o Todos | Concluídos e "Limpar filtros" ficam acima da tabela
- [ ] A coluna se chama "Processo"
- [ ] Cada cabeçalho abre o menu com ordenação e (menos Processo) filtro; o cabeçalho mostra filtro aplicado e sentido da ordenação
- [ ] Etapa atual ordena pela ordem do catálogo; Situação em andamento, suspenso, concluído; Responsável sem responsável por último
- [ ] Subprocessos seguem o processo pai em qualquer ordenação
- [ ] O filtro da Situação some com Concluídos
- [ ] Filtros e ordenação ficam no endereço e recarregar mantém a visão
- [ ] O menu abre dentro da tela em 1366×768 e funciona pelo teclado
- [ ] Testes verdes; `npm test` verde
