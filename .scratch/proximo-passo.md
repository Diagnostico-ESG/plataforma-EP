# Próximo passo (2026-10-30)

**Comando:** `/executar-complexo` (Sonnet), de novo, com o mesmo argumento (`responsavel-inicial-por-etapa`). Ele é uma retomada: o plano `.scratch/processos-etapas/plano-responsavel-inicial.md` já existe e a branch `responsavel-inicial-por-etapa` já está criada; continua da primeira caixa aberta (a 0.2).

**O que falta antes:** abrir o Docker Desktop. O motor do Docker não respondia em 2026-10-30 ("failed to connect to the docker API"), e os testes de banco desta entrega rodam no banco local do Docker (ajuste do projeto de 2026-10-24). Sem ele a Tarefa 1 (banco) não começa.

**Já feito:** plano escrito e comitado na branch; suíte de testes da `main` conferida (252 arquivos, 3.223 testes, todos verdes) antes de mexer em qualquer código.

**Ordem do plano:** Tarefa 1 banco (pgTAP antes da migração), 2 tipos e catálogo, 3 mover/cadastrar/retomar nos falsos, 4 tela do Catálogo, 5 histórico, 6 fecho (push, workflows, merge, registros).
