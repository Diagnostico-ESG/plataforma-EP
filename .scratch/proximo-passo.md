# Próximo passo (2026-10-30)

**Em andamento:** `/planejar` de `responsavel-inicial-por-etapa` (pacote 4 da demanda de 2026-10-30), modo completo, Opus. Marco `marco/2026-10-30-inicio-responsavel-inicial-por-etapa` criado; brainstorming pulado (solução definida pelo usuário). Sabatina concluída: decisões no ADR 0036 e no `CONTEXT.md` (Responsável do processo, Responsável inicial, Mover, Situação do processo).

Spec escrita: seção "Responsável inicial por etapa (mudança de 2026-10-30)" em `.scratch/processos-etapas/spec.md`, marcada `Em revisão desde 2026-10-30`.

**Próximo:** o usuário decide o passo 5 do `/planejar` (recomendado: uma entrega só, sem `to-tickets`, porque a regra no banco sem a tela do Catálogo deixaria todo processo movido sem responsável); depois `/executar-complexo` (Sonnet) com a seção da spec como único ticket.

**Conferência pedida antes de planejar (feita em 2026-10-30):** o banco tem uma regra só para o responsável ao mover: `mover_processo` (migração `20261027120000_confirmacao_de_arquivos.sql`) grava como responsável quem move, sempre. O relato "o responsável da etapa anterior continua" acontece quando quem move já era o responsável, o caso comum (a pessoa termina a etapa e ela mesma move). Não é bug: é a regra atual, que esta funcionalidade substitui. A tela (`src/processos/movimentoSupabase.ts`) só chama `mover_processo`; a implementação falsa (`ProcessosFalso.ts`, `movimentoFalso.ts`) copia a mesma regra e precisa mudar junto.

**Redesenho visual em discussão:** análises em `.scratch/analise-de-design-2026-10-30.md` e `.scratch/analise-de-design-lista-e-cadastros-2026-10-30.md`; propostas em `.scratch/proposta-visual/` (a 6 é a direção atual). Caminho quando o usuário decidir: `/demanda` (Opus).
