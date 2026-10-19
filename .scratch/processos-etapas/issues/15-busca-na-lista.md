# 15: Busca na Lista

**Como resolve a sua parte.** Os processos concluídos ficam na Lista, que vira o arquivo de tudo. Com dezenas de processos, achar um deles só pelos filtros é lento. Este ticket põe na Lista uma busca pelo nome que filtra enquanto se digita e fica no endereço da página, para recarregar ou mandar o link sem perder a busca.

**What to build:** campo de busca no começo da barra da Lista, antes dos filtros, com lupa, o texto de exemplo "Buscar pelo nome" e um "×" para limpar. Procura só no nome do processo, como trecho, sem diferenciar maiúsculas, minúsculas e acentos; filtra a lista já carregada enquanto se digita e soma-se aos filtros. O trecho encontrado aparece marcado em amarelo claro no nome. A busca fica no endereço (parâmetro `busca`), junto com os filtros. Sem resultado, vale o estado "Nenhum processo com estes filtros." com [Limpar filtros], que limpa também a busca. O Quadro fica sem busca. Spec: `.scratch/processos-etapas/spec.md` (histórias 138 a 140; "Interface", "Lista", item Busca, e "Navegação no endereço"; "Decisões de teste", busca da Lista e funções puras novas).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Função pura da busca (trecho, sem maiúsculas e sem acentos) com testes unitários.
- [ ] Leitura e montagem do endereço com `busca`, junto com os filtros, com testes unitários; endereço sem `busca` continua valendo.
- [ ] Busca por trecho do nome, sem diferenciar maiúsculas e acentos, somada aos filtros, filtrando enquanto se digita.
- [ ] O "×" limpa a busca; [Limpar filtros] limpa filtros e busca.
- [ ] Sem resultado: "Nenhum processo com estes filtros." com [Limpar filtros].
- [ ] O trecho encontrado aparece marcado no nome, com o nome lido inteiro pelo leitor de tela.
- [ ] O Quadro não mostra o campo de busca.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `[visual]` A busca fica antes dos filtros, com lupa e "×", e o trecho encontrado aparece marcado em amarelo claro no nome.
