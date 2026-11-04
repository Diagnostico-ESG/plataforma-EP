# Próximo passo (2026-11-04)

**Situação:** `/planejar` de `enxugar-quadro-e-verso` (funcionalidade 21) concluído no modo completo. Sabatina feita (ADR 0042, `CONTEXT.md` sem Assumir e sem envio de .bpmn), spec em `.scratch/enxugar-quadro-e-verso/spec.md`, aviso no topo das specs de `processos-etapas`, `documentos-versoes` e `repositorio-de-processos`. Por decisão do usuário, **uma entrega só**: a spec é o único ticket, sem `to-tickets`. Marco: `marco/2026-11-04-inicio-enxugar-quadro-e-verso`.

**Próximo comando:** `/executar-complexo` com a spec de `enxugar-quadro-e-verso`, em Sonnet, numa sessão nova. A ordem importa: primeiro a prévia do Quadro com as faixas e do verso rearrumado (miniatura até o dobro, campo "Data da modelagem piloto"), aprovada pelo usuário antes de qualquer código (critério 18); depois as remoções com teste (Assumir, .bpmn, Enviar relatório, rótulos, Lista) e o visual.

**Depende do usuário:** aprovar a prévia; ver no app real, com o login, a rolagem da coluna grande e a linha de etapas só de ícones (pendências da sessão anterior).

**Pendências:** `processos-etapas` segue `Em revisão desde 2026-11-04` (ADR 0041) sem `/ship`; o `/ship` desta funcionalidade cobre as duas mudanças (backlog). Teste instável `App.relatorioDepois` barrou um commit e passou na segunda vez. Demais itens do `.scratch/backlog.md`.
