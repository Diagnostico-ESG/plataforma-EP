# Próximo passo (2026-10-31)

**Situação:** tickets 01 e 02 do `redesenho-do-quadro` concluídos na `main` (02 no commit 904449c): botão [Destacar os meus] (esmaece os cartões dos outros, `destacar=1` no endereço, ignorado para a Consulta) e controle Situação (Todos | Em andamento | Suspensos | Concluídos | Cancelados, `mostrar=` no endereço) na Lista e no Quadro por setor, no lugar de "Só os meus", "Todos | Concluídos" e "Mostrar cancelados (N)". Faltam os tickets 03, 04 e 05.

**Próximo comando:** sessão nova com Sonnet, `/situação`, depois `/executar-complexo` no ticket 03 (Linhas, ícone por etapa e "Você"). O 04 (verso enxuto) também é complexo e pode ir a qualquer momento; o 05 (miniatura do fluxograma) é simples e vem depois do 04. Depois do último, `/polir` e então `/ship`.

**Dica de ambiente:** se o pre-commit estourar o tempo (15 s por teste) com a máquina carregada, feche Docker/Zoom/Chrome ou rode o commit com `VITEST_MAX_WORKERS=2`.

**Depende do usuário:** ver o Destacar os meus e a Situação com o login real (o `[visual]` do 02 está presumido); ler as "Decisões a confirmar" da spec; publicar a função `arquivos-no-drive` no desenvolvimento (ticket 05); conferir o Catálogo de etapas; escolher o responsável inicial de cada etapa.
