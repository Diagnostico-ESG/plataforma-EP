# 22: Agrupar por responsável e "Só os meus"

**Como resolve a sua parte.** Hoje o Quadro só se organiza por etapa, e para ver o que está com cada pessoa é preciso escolher o nome no filtro. Este ticket acrescenta à barra do Quadro o "Agrupar por: Etapa | Responsável", que põe uma coluna por pessoa, e o botão "Só os meus", que mostra com um clique só os processos em que a própria pessoa cuida da etapa atual.

**What to build:** controle "Agrupar por: Etapa | Responsável" na barra do Quadro, para todos os perfis, guardado no endereço (`agrupar=responsavel`; sem ele, por etapa). Agrupado por responsável: uma coluna por pessoa que é responsável da etapa atual de algum cartão visível (depois dos filtros), em ordem alfabética, com a pílula "Inativo" quando a pessoa foi desativada, e "Sem responsável" no fim (só com cartão); contagem no título; o cartão mostra o nome da etapa atual no lugar do avatar; o selo "Sem responsável" some; sem arrastar; o filtro de etapa continua valendo. Botão "Só os meus" (aria-pressed), só para Administrador e Integrante: ligado, põe o filtro Responsável em quem está na tela; desligado, limpa esse filtro; escolher a si mesmo no filtro liga o botão e escolher outra pessoa o desliga. Sem resultado e sem outros filtros: "Nenhum processo com você agora." com [Ver todos], que desliga o botão; com outros filtros, vale a mensagem dos filtros. [Limpar filtros] desliga o "Só os meus" e mantém o agrupamento. Spec: `.scratch/processos-etapas/spec.md` (histórias 164 a 172; "Interface", "Navegação no endereço" e Quadro, itens Agrupar por e Só os meus; "Estados", vazio do "Só os meus"; "Decisões de teste", Agrupar por Responsável e Só os meus; "Observações", parte 4).

**Blocked by:** 20 (A barra de progresso e os selos do cartão do Quadro), 21 (Arrastar o cartão para concluir a etapa).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Funções puras com testes unitários: as colunas agrupadas por responsável e a leitura e montagem do endereço com `agrupar`.
- [ ] Agrupado por responsável: colunas em ordem alfabética, "Sem responsável" no fim, pílula "Inativo", nome da etapa no cartão, sem o selo "Sem responsável", sem arrastar, e os filtros valendo.
- [ ] O agrupamento fica no endereço: recarregar e voltar mantêm.
- [ ] "Só os meus" liga e desliga, equivale ao filtro Responsável nos dois sentidos e não aparece para a Consulta.
- [ ] O vazio "Nenhum processo com você agora." com [Ver todos]; com outros filtros, a mensagem dos filtros.
- [ ] [Limpar filtros] desliga o "Só os meus" e mantém o agrupamento.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `[visual]` Agrupado por responsável, as colunas têm o nome da pessoa (com "Inativo" quando cabe) e os cartões mostram o nome da etapa no lugar da foto; "Agrupar por" e "Só os meus" ficam na barra do Quadro, junto dos filtros.

Concluído em 2026-10-19 (commit dd95614)
