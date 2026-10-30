# Próximo passo (2026-10-30)

**Comando:** `/executar-complexo` (Sonnet) com a seção "Responsável inicial por etapa (mudança de 2026-10-30)" de `.scratch/processos-etapas/spec.md` como único ticket (`responsavel-inicial-por-etapa`; o usuário escolheu uma entrega só, sem `to-tickets`).

**O que já está em arquivo:** marco `marco/2026-10-30-inicio-responsavel-inicial-por-etapa`; item 17 em `.scratch/projeto.md`; ADR 0036; `CONTEXT.md` (Responsável do processo, Responsável inicial, Mover, Situação do processo); a spec, marcada `Em revisão desde 2026-10-30`.

**Por que complexo:** banco (coluna, trava das fixas liberando a coluna, função do responsável inicial válido em mover, cadastro e retomar, evento da etapa), implementações falsas e tela do Catálogo se conectam, e a ordem importa (pgTAP antes da migração). Testes de banco pelo Docker local (Ajustes do projeto); migração do remoto de desenvolvimento pelo workflow.

**Conferência feita antes de planejar:** "o responsável da etapa anterior continua" não era bug: `mover_processo` grava quem move, que costuma ser o próprio responsável.

**Redesenho visual em discussão:** análises em `.scratch/analise-de-design-*.md`; propostas em `.scratch/proposta-visual/` (a 6 é a direção atual). Caminho quando o usuário decidir: `/demanda` (Opus).
