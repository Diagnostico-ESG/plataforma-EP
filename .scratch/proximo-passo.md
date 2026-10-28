# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-28 (/executar-simples cor-solida-do-setor concluído)

- **Feito (/executar-simples):** commit `39cd830` na branch `cor-solida-do-setor`: cor do setor lisa no tom claro em selo, faixa, cabeçalho da coluna por setor, quadradinho das caixas e amostras da grade; tom escuro removido do módulo e dos testes. `npm test` (3109), typecheck e lint passam; `/code-review` sem violação (um teste redundante removido). Spec com `Implementado em`. Critérios `[visual]` 5 a 7 por conferir.
- **Feito (/planejar):** marco `marco/2026-10-28-inicio-cor-solida-do-setor`, branch `cor-solida-do-setor`, prévia aprovada `.scratch/cartoes-da-aplicacao-solidos.png`. Sabatina do `grill-with-docs` concluída: decisões em `.scratch/cor-solida-do-setor/sabatina.md` e no ADR 0033 (cor do setor lisa no tom claro em selo, faixa, cabeçalho da coluna, quadradinho das caixas e grade de amostras; tom escuro sai do código e dos testes; barra de etapas azul continua em degradê; fundo tingido da coluna fica como está). `CONTEXT.md` não muda.
- **Feito (to-spec):** spec própria `.scratch/cor-solida-do-setor/spec.md` (Status: ready-for-agent, único ticket); nota e `Em revisão desde 2026-10-28` nas specs de `processos-etapas` e `cadastros-basicos`; acréscimo datado em `.scratch/identidade-visual.md`.
- **Próximo:** `/polir cor-solida-do-setor` (Sonnet), porque a funcionalidade mexeu na interface; conferir ali os critérios `[visual]`. Depois `/ship` (Sonnet).
- **Arquivos soltos em `.scratch/`:** `cartoes-solidos.png/.ps1`, `cores-dos-cartoes.png/.ps1` e `preview-cartoes-solidos.html` seguem fora do git; o usuário decide se entram ou saem.
- **Pendente do usuário (segue valendo):** o de antes, listado na sessão do `/ship ajustes-quadro-lista` (publicar de novo `arquivos-no-drive` e `planilhas-dos-dashboards` no desenvolvimento; conferir a conta de serviço nos Drives; provar anexos no Drive real; conferir o cadastro aberto desligado no Supabase de desenvolvimento; apagar `.scratch/handoff-2026-10-20.md`; repor o e-mail do git).
