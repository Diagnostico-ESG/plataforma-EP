# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-29 (/executar-complexo repositorio-de-processos, ticket 03 PARADO antes do remoto)

- **Estado:** ticket 03 (Tirar do Quadro) feito e comitado na branch `repositorio-de-processos` (commit f671d1f, enviada ao GitHub). Banco local: 1671 `ok`, 0 `not ok`. `npm test`: 3131 verdes. Falta a Tarefa 7 do `plano-03.md` (remoto de desenvolvimento) e a 8 (juntar à `main`, `Concluído em`).
- **BLOQUEIO, pelo usuário:** o GitHub Actions não inicia jobs ("recent account payments have failed or your spending limit needs to be increased", em Settings → Billing & plans). Enquanto isso, o "Testes de banco" e o "Migrar banco de desenvolvimento" não rodam. Saídas: (a) resolver a cobrança e pedir que eu dispare os dois workflows na branch; ou (b) aplicar você mesmo a migração `supabase/migrations/20261029021159_tirar_e_voltar_ao_quadro.sql` no SQL Editor do Supabase de desenvolvimento (cole o arquivo e rode) e me avisar; eu então confiro, regenero os tipos e junto à `main`.
- **Depois:** juntar à `main`, `Concluído em` no ticket 03 e seguir para o ticket 04 (cabeçalhos com filtro e ordenação) com **Sonnet**, em sessão nova.
- **URGENTE, pelo usuário (segue):** publicar de novo `arquivos-no-drive` no desenvolvimento (lê `arquivado_em`, que não existe mais): `npx supabase functions deploy arquivos-no-drive --use-api`.
- **Backlog (segue):** renomear `claro` / `--cor-claro` para `tom` / `--cor-do-setor`; testes de "dias na etapa" que dependem do fuso.
- **Pendente do usuário (segue valendo):** conferir com o login real o Quadro (botão, aviso, pé, Lista, "Iniciado"); decidir sobre os arquivos soltos em `.scratch/`; apagar `.scratch/handoff-2026-10-20.md`; publicar de novo `planilhas-dos-dashboards`; conferir a conta de serviço nos Drives; provar anexos no Drive real; conferir o cadastro aberto desligado no Supabase de desenvolvimento; repor o e-mail do git.
