# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-29 (/executar-complexo, ticket 05 de enxugar-cartao-e-cadastro concluído; era o último)

- **Estado:** tickets 01 a 05 concluídos (05 no commit 0839f97, já na `main`). A migração `origem_contexto_e_observacoes_saem` foi aplicada no remoto de desenvolvimento pelo workflow, e o "Testes de banco" ficou verde (59 de 59; o 72 com 20 ok). Ressalvas: pgTAP só no workflow (Docker não sobe, sem WSL); `[visual]` não visto (exige o login institucional).
- **Próximo:** `/polir` (a funcionalidade mexeu na interface): **Sonnet**. Depois, `/ship` da funcionalidade `enxugar-cartao-e-cadastro`.
- **Pendente do usuário (novo):** publicar de novo a `planilhas-dos-dashboards` no desenvolvimento (`npx supabase functions deploy planilhas-dos-dashboards --use-api`, no seu terminal, com o vínculo conferido): até lá a função antiga não conhece o pacote sem `observacoes`. Se o `CONTEXT.md` citar Origem, Contexto ou Observações, me peça a redação.
- **Backlog (segue):** renomear `claro` / `--cor-claro` para `tom` / `--cor-do-setor`; testes de "dias na etapa" que dependem do fuso; menores adiados do `/ship`; `arquivosDaVersaoMaisRecente` ainda devolve o `rotulo` curto sem uso. A branch remota `enxugar-cartao-e-cadastro` (e agora `enxugar-cartao-e-cadastro-05`) continua no GitHub (a trava bloqueia apagar branch remota; apague você, se quiser).
- **Pendente do usuário (segue valendo):** conferir com o login real o Quadro, a Lista, a árvore, a data na linha da Modelagem piloto e o campo Anotações do cadastro; decidir sobre os arquivos soltos em `.scratch/`; apagar `.scratch/handoff-2026-10-20.md`; conferir a conta de serviço nos Drives; provar anexos no Drive real; conferir o cadastro aberto desligado no Supabase de desenvolvimento; repor o e-mail do git; resolver a cobrança do GitHub.
