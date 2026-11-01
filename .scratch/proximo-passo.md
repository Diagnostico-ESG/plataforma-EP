# Próximo passo (2026-10-31)

**Situação:** tickets 01, 02 e 03 do `redesenho-do-quadro` concluídos na `main`. O 03 trouxe as Linhas (Nenhuma | Setor | Responsável) no Quadro por etapa, o ícone de cada etapa (coluna, Linhas e etapas do verso) e "Você" no cartão. Faltam os tickets 04 (verso enxuto) e 05 (miniatura do fluxograma).

**Próximo comando:** sessão nova com Sonnet, `/situação`, depois `/executar-complexo` no ticket 04 (verso enxuto); o 05 é simples e vem depois dele. Depois do último, `/polir` e então `/ship`.

**Dica de ambiente:** com Docker, Zoom e Chrome abertos o pre-commit estoura os 15 s por teste e a suíte leva ~40 min. Feche esses programas antes de comitar, ou rode o commit com `VITEST_MAX_WORKERS=2`.

**Depende do usuário:** ver as Linhas e os ícones com o login real (o `[visual]` do 03 está presumido, não conferi no navegador); ler as "Decisões a confirmar" da spec; publicar a função `arquivos-no-drive` no desenvolvimento (ticket 05); conferir o Catálogo de etapas; escolher o responsável inicial de cada etapa.
