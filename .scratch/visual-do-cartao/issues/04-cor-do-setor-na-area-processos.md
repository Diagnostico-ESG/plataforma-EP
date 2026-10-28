# 04: Cor do setor na área Processos

**What to build:** a cor do setor acompanha a sigla na área Processos, para reconhecer o setor de relance. Cada cartão do Quadro ganha no topo uma faixa na cor do setor em degradê, de lado a lado: com a sigla maior e centralizada nos agrupamentos por etapa e por responsável, e com o nome do processo em destaque (16px, negrito, fora do corpo do cartão) no agrupamento por setor. O título da coluna por setor mostra a sigla sobre a cor (o nome e a marca "inativo" ficam). O cabeçalho do verso e a coluna Setor da Lista mostram o selo do setor. O filtro Setor e o campo Setor do processo (Novo processo, Editar, Reclassificar) mostram o quadradinho da cor. A faixa vermelha do processo parado continua. A cor chega pela view `processos_com_andamento`, que ganha `setor_cor`, e pela leitura dos setores da Lista de processos. Regras completas na seção "Visual do cartão" da spec de `processos-etapas` (histórias 1 a 24) e no ADR 0030 (revê o ADR 0029).

**Blocked by:** 02 (Cor do setor gravada e mostrada nos cadastros)

**Status:** ready-for-agent

- [x] Teste pgTAP antes da migração: a view entrega `setor_cor` igual à cor do setor dono para Administrador, Integrante e Consulta, e nada para inativo e visitante; `46_funcoes_e_views_seguras`, `00_rls_ligada` e `10_privilegios_padrao` continuam passando.
- [x] Migração não destrutiva que recria a view com `security_invoker = true` e `setor_cor`, rodada no Docker local e aplicada no desenvolvimento pelo workflow "Migrar banco de desenvolvimento"; tipos atualizados. (Docker local desligado: rodada só pelos workflows)
- [x] A leitura da linha do processo e a da Lista de processos trazem `setor_cor` e a `cor` dos setores; `ProcessosFalso` com a cor; testes de tradução com o cliente simulado.
- [x] Faixa no cartão (sigla por etapa e por responsável; nome por setor, sem repetir no corpo), sem a cor no nome acessível; título da coluna por setor com o selo; testes de tela (arte anterior: `App.cartaoDoQuadro`, `App.agruparPorSetor`).
- [x] Selo no cabeçalho do verso e na coluna Setor da Lista; a seção "Sobre" continua em texto; testes de tela (`App.versoDoCartao`, `App.lista`).
- [x] Quadradinho nas opções do filtro Setor e do campo Setor (Novo processo, Editar, Reclassificar), por `OpcaoDaCaixa` com `cor` e `BotaoDaCaixa`, sem cor no nome da opção; teste de tela. (Reclassificar não tem campo Setor: ver desvios.md)
- [x] Cor trocada no cadastro aparece no Quadro depois de recarregar (teste com as falsas).
- [x] `npm test` verde; testes de banco verdes no Docker local e no "Testes de banco". (Docker local desligado: só no "Testes de banco")
- [ ] `[visual]` A faixa ocupa o topo do cartão de lado a lado, legível nas 30 cores, inclusive com nome longo, e a faixa vermelha do parado continua visível.
- [ ] `[visual]` Título da coluna, selo do verso e da Lista e quadradinho mostram a mesma cor do cartão, sem estourar a largura.
