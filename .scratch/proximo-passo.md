# Próximo passo (2026-11-04)

**Situação:** `enxugar-quadro-e-verso` (funcionalidade 21) implementada e integrada na `main` (commit f13e03b; branch apagada). Feito: selo do setor menor, cartão parado sem borda, faixas nas colunas do Quadro, Agora sem rótulos e sem Assumir ("Você" primeiro), Data da modelagem piloto em campo fixo, sem envio de .bpmn (histórica exige o .bpm), Lista agrupada sem Setor/Macroprocesso e com o atraso junto da Etapa atual, verso em duas colunas (Anotações à direita). **Não feito:** item 7 (sem [Enviar relatório]), mantido por decisão do usuário; ver `.scratch/enxugar-quadro-e-verso/desvios.md` e o backlog.

**Próximo comando:** `/ship`, em Sonnet (o `/polir` já rodou em 2026-11-04: achados em `desvios.md`; o `/ship` cobre também as revisões pendentes de `processos-etapas`, `documentos-versoes` e `repositorio-de-processos`, marca `Em revisão desde 2026-11-04`). Nenhum ticket pendente.

**Depende do usuário:** ver no app real, com o login, o verso em duas colunas, as faixas do Quadro (incluindo Linhas e por setor/responsável), a Lista agrupada e a miniatura com .png de verdade; decidir se quer o "+ Acrescentar relatório" para poder tirar o [Enviar relatório].

**Pendências:** testes instáveis já no backlog (um de "processo suspenso não mostra [Enviar relatório]" falhou uma vez no pre-commit); filtro por Setor/Macroprocesso sem menu na Lista agrupada (vale pelo endereço).
