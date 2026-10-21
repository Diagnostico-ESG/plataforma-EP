# 04: Dashboards no Data Studio

**Como resolve a sua parte.** Com as planilhas preenchidas pela plataforma, os dashboards saem do Power BI (licença do Tecpar) para o Data Studio da conta do CED (ADR 0017), sem nenhum preenchimento à mão.

**What to build:** Claude monta no Data Studio, pelo navegador do app e com o login do usuário na conta do CED:

- o **dashboard interno** (fonte: planilha interna), com páginas parecidas com as três internas de hoje: visão geral (avanço I a VII e IV a VII, total, publicados, conclusão por fase, setor × fase e modelagens piloto por mês com a meta 12 fixa no relatório); por fase (concluídos, prontos para iniciar, aguardando e processos por setor); e a tabela processo × fase, com situação e observações;
- o **dashboard público** (fonte: planilha pública), parecido com a página pública de hoje: total de processos, setores, % das etapas concluídas e barras por fase I a VII.

A porcentagem é calculada no Data Studio a partir das contagens. Compartilhar o interno com as pessoas da equipe e deixar o público como "Não listado" são confirmados com o usuário no momento de cada um. As anotações para refazer cada página do zero vão para o ticket 05. Spec: histórias 44 a 47.

**Blocked by:** 03 (as planilhas preenchidas).

**Status:** ready-for-agent

## Critérios de aceite

- [x] O dashboard interno tem as três páginas, lendo a planilha interna, com a meta mensal de 12 modelagens no gráfico por mês.
- [x] O dashboard público lê só a planilha pública e mostra os números da página pública de hoje.
- [x] O interno está compartilhado só com as pessoas da equipe e o público está como "Não listado", ambos com a confirmação do usuário no momento.
- [x] As decisões de montagem (fontes, campos calculados, filtros e o que ficou diferente do Power BI por limite do Data Studio) estão anotadas em `.scratch/exportacao-e-manutencao/` para o ticket 05.
- [ ] [visual] Os dois dashboards ficam parecidos com as páginas de hoje do Power BI, revisados pelo usuário.
