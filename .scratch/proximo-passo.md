# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-28 (/executar-complexo repositorio-de-processos, ticket 02 concluído)

- **Feito:** ticket 02 (Todos | Concluídos, cancelados e etiqueta Iniciado) concluído no commit 4d8eac6 e unido à `main`. Só interface: o par "Mostrar" na Lista e no Quadro por setor (`mostrar=concluidos` no endereço), concluídos sempre no portfólio, cancelados atrás de "Mostrar cancelados (N)", filtro Situação sem "Cancelado" e sem aparecer em Concluídos, etiqueta "Iniciado". `npm test` 3099 verdes; visual conferido na vitrine local.
- **Próximo:** `/executar-complexo` no ticket 03 (Tirar do Quadro: migração, funções e botão) com **Sonnet**, em sessão nova. Depois, o 04 (cabeçalhos com filtro e ordenação) e o 05 (árvore por macroprocesso). O 03 mexe no banco: lerá `.claude/regras/banco.md`, usará o Docker local e o workflow de migração.
- **URGENTE, pelo usuário (segue):** publicar de novo a Edge Function `arquivos-no-drive` no desenvolvimento: a versão no ar lê `arquivado_em`, que não existe mais, e enviar, retirar e renumerar arquivos falha. No seu terminal, com o vínculo conferido: `npx supabase functions deploy arquivos-no-drive --use-api`.
- **Backlog (segue):** renomear `claro` / `--cor-claro` para `tom` / `--cor-do-setor`; testes de "dias na etapa" que dependem do fuso (a "Verificação" da `main` fica vermelha entre 21h e 24h de Brasília).
- **Pendente do usuário (segue valendo):** conferir com o login real a Lista (par "Mostrar", cancelados, etiqueta "Iniciado") e o Quadro por setor; decidir sobre os arquivos soltos em `.scratch/`; apagar `.scratch/handoff-2026-10-20.md`; publicar de novo `planilhas-dos-dashboards`; conferir a conta de serviço nos Drives; provar anexos no Drive real; conferir o cadastro aberto desligado no Supabase de desenvolvimento; repor o e-mail do git.
