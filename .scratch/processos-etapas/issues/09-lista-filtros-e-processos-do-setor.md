# 09: Lista, filtros e processos do setor

**Como resolve a sua parte.** O Quadro mostra só o trabalho vivo; para achar um processo concluído, cancelado ou de um setor específico, a equipe precisa do arquivo completo. Este ticket entrega a Lista com todos os processos e os filtros (setor, macroprocesso, etapa, tipo, responsável e situação), que valem também para o Quadro e ficam no endereço da página. A tela do setor ganha a lista dos processos dele.

**What to build:** Lista em `#/processos/lista` com as colunas e a ordem da spec; filtros no Quadro (sem situação) e na Lista, no endereço; "Nenhum processo com estes filtros." com [Limpar filtros]; "Processos do setor" na tela do setor. Spec: `.scratch/processos-etapas/spec.md` (histórias 24 a 27, 88; seção "Interface").

**Blocked by:** 07 (Situação do processo) e 08 (Subprocessos e reclassificação).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Lista: nome (com "↳ pai" no subprocesso), tipo, setor, macroprocesso, etapa atual, responsável e situação em pílula; ordem pela sigla do setor e pelo nome; todas as situações; clicar na linha abre o painel com a lista esmaecida atrás.
- [ ] Filtros: setor, macroprocesso, etapa atual, tipo, responsável e, na Lista, situação; guardados no endereço e restaurados ao recarregar; os mesmos no Quadro, menos situação; [Limpar filtros].
- [ ] A alternância Quadro | Lista da barra superior e o item Lista da faixa lateral levam à Lista.
- [ ] Estados: "Carregando processos…" com linhas-fantasma; vazio; "Nenhum processo com estes filtros."; erro com [Tentar de novo].
- [ ] Tela do setor: "Processos do setor" com nome, tipo, etapa atual e situação; "Este setor ainda não tem processos."; "Carregando processos do setor…"; clicar abre o painel.
- [ ] Funções puras de leitura e escrita dos filtros no endereço com testes unitários.
- [ ] Testes de interface com o aplicativo inteiro: cada filtro, a combinação de filtros, recarregar com filtros no endereço, limpar filtros, a lista do setor e a Consulta.

Concluído em 2026-10-14 (commit b455a2e)
