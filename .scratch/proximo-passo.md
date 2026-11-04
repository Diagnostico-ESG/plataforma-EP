# Próximo passo (2026-11-04)

**Situação:** `enxugar-quadro-e-verso` (funcionalidade 21) entregue e integrada na `main`, com marca `Entregue em 2026-11-04 (commit 373c07e)` e marco `marco/2026-11-04-entrega-enxugar-quadro-e-verso`; o mesmo `/ship` entregou `processos-etapas`, `documentos-versoes` e `repositorio-de-processos` (marcos próprios). Ressalvas: critérios `[visual]` presumidos no app real; item 7 (sem [Enviar relatório]) não feito por decisão do usuário (ADR 0043).

**Depende do usuário:** ver no app real, com o login, o verso em duas colunas, as faixas do Quadro (inclusive Linhas, por setor e por responsável), a Lista agrupada e a miniatura com .png de verdade; decidir se quer o "+ Acrescentar relatório" para tirar o [Enviar relatório] (backlog).

**Próximo comando:** `/planejar` para a próxima funcionalidade (modelo da tabela do Funil: Opus no modo completo, Sonnet no curto); demandas fora do plano entram pelo `/demanda`. Não há mais funcionalidade do resumo do projeto sem spec além do que o backlog lista.

**Pendências:** itens do `.scratch/backlog.md`, incluindo os da revisão de código deste `/ship` (default de cor do setor espalhado, `ProcessosFalso.ts` com 319 linhas, etc.); testes instáveis já registrados.

## Atualização (2026-11-04, /situação)

**Prova no Drive real pendente:** o roteiro está em `.scratch/documentos-versoes/roteiro-prova-final.md` (publicar a função a partir da `main`, rodar `scripts/prova-do-drive.mjs`, conferências à mão de sigla, mudança de setor, retirada de anexo e acrescentar arquivo, e a arrumação). É passo do usuário, no terminal dele; depois ele cola a saída e uma sessão em Sonnet confere contra os tickets e grava em `prova-do-drive.md` e `desvios.md`. Não bloqueia o `/planejar` da próxima funcionalidade; precisa estar feita antes do primeiro `/ship` para produção.
