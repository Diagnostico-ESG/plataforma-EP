# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-29 (/executar-complexo repositorio-de-processos, ticket 03 concluído com ressalva)

- **Estado:** tickets 01, 02 e 03 de `repositorio-de-processos` na `main`. O 03 foi verificado no Docker local (1671 `ok`, 0 `not ok`; tipos de `gen types --local` batem com os comitados nas duas funções novas) e fechado com ressalva.
- **Ressalva, pelo usuário:** a migração `supabase/migrations/20261029021159_tirar_e_voltar_ao_quadro.sql` NÃO está no banco remoto de desenvolvimento (GitHub Actions bloqueado por cobrança). Até aplicá-la (cole o arquivo no SQL Editor do Supabase de desenvolvimento e rode, ou resolva a cobrança e peça que eu dispare o workflow "Migrar banco de desenvolvimento"), o botão "Tirar do Quadro" falha no site de desenvolvimento. Depois disso, anotar a migração em `supabase/AMBIENTES.md`.
- **Próximo:** ticket 04 (lista com filtro e ordenação por coluna) com **Sonnet**, em sessão nova, começando pelo `/situação`; depois o 05. Ao fim dos tickets: `/polir` e `/ship`.
- **URGENTE, pelo usuário (segue):** publicar de novo `arquivos-no-drive` no desenvolvimento (lê `arquivado_em`, que não existe mais): `npx supabase functions deploy arquivos-no-drive --use-api`.
- **Backlog (segue):** renomear `claro` / `--cor-claro` para `tom` / `--cor-do-setor`; testes de "dias na etapa" que dependem do fuso.
- **Pendente do usuário (segue valendo):** conferir com o login real o Quadro (botão, aviso, pé, Lista, "Iniciado"); decidir sobre os arquivos soltos em `.scratch/`; apagar `.scratch/handoff-2026-10-20.md`; publicar de novo `planilhas-dos-dashboards`; conferir a conta de serviço nos Drives; provar anexos no Drive real; conferir o cadastro aberto desligado no Supabase de desenvolvimento; repor o e-mail do git; resolver a cobrança do GitHub.
