# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-29 (/executar-complexo, ticket 04 de enxugar-cartao-e-cadastro concluído)

- **Estado:** tickets 01 a 04 concluídos (04 no commit e958e0c, já na `main`). A migração `anotacoes_no_cadastro` foi aplicada no remoto de desenvolvimento pelo workflow, e o "Testes de banco" ficou verde (50: 57 ok; 71: 17 ok). Falta o 05 em `.scratch/enxugar-cartao-e-cadastro/issues/`. Ressalvas do 04: pgTAP só no workflow (o Docker não sobe, sem WSL), a falha prévia dos testes de banco não foi vista, `[visual]` não visto (exige o login institucional), como nos tickets 01 a 03.
- **Próximo:** ticket 05 (origem, contexto e observações saem), que tem migração: **Sonnet**, `/executar-complexo` com `.scratch/enxugar-cartao-e-cadastro/issues/05-origem-contexto-e-observacoes-saem.md`. Depois do último, `/polir`.
- **Backlog (segue):** renomear `claro` / `--cor-claro` para `tom` / `--cor-do-setor`; testes de "dias na etapa" que dependem do fuso; menores adiados do `/ship`; `arquivosDaVersaoMaisRecente` ainda devolve o `rotulo` curto sem uso. A branch remota `enxugar-cartao-e-cadastro` continua no GitHub (a trava bloqueia apagar branch remota; apague você, se quiser).
- **Pendente do usuário (segue valendo):** conferir com o login real o Quadro, a Lista, a árvore, a data na linha da Modelagem piloto e o campo Anotações do cadastro; decidir sobre os arquivos soltos em `.scratch/`; apagar `.scratch/handoff-2026-10-20.md`; publicar de novo `planilhas-dos-dashboards`; conferir a conta de serviço nos Drives; provar anexos no Drive real; conferir o cadastro aberto desligado no Supabase de desenvolvimento; repor o e-mail do git; resolver a cobrança do GitHub.
