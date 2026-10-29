# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-28 (/executar-complexo repositorio-de-processos, ticket 01 concluído)

- **Feito:** ticket 01 (Fim do Arquivado) concluído no commit 6333ef3 e unido à `main`: migração `20261029001211_fim_do_arquivado` aplicada no desenvolvimento (workflow, execução 40795921880), "Testes de banco" 55 de 55 (execução 40795693843), `db:types` do remoto idêntico ao comitado, `npm test` 3077 verdes. O concluído que estava arquivado é um concluído comum e segue fora do Quadro (`tirado_do_quadro_em`, `no_quadro`).
- **Próximo:** `/executar-complexo` no ticket 02 (Todos | Concluídos, cancelados e etiqueta Iniciado), com **Sonnet**, em sessão nova. Ordem que falta: 02 → 03 e 04 → 05.
- **URGENTE, pelo usuário:** publicar de novo a Edge Function `arquivos-no-drive` no desenvolvimento. A versão no ar ainda lê `arquivado_em` da view, que não existe mais: enquanto isso, enviar, retirar e renumerar arquivos pela plataforma de desenvolvimento falha. Comando no seu terminal, com o vínculo conferido: `npx supabase functions deploy arquivos-no-drive --use-api`.
- **Backlog (segue):** avaliar renomear `claro` / `--cor-claro` para `tom` / `--cor-do-setor`.
- **Pendente do usuário (segue valendo):** conferir com o login real a cor lisa do setor e a tela sem Arquivar/Desarquivar (verso do concluído, Lista sem o filtro "Arquivados"); decidir sobre os arquivos soltos em `.scratch/` (`cartoes-solidos.png/.ps1`, `cores-dos-cartoes.png/.ps1`, `preview-cartoes-solidos.html`); apagar `.scratch/handoff-2026-10-20.md`; publicar de novo `planilhas-dos-dashboards` no desenvolvimento; conferir a conta de serviço nos Drives; provar anexos no Drive real; conferir o cadastro aberto desligado no Supabase de desenvolvimento; repor o e-mail do git.
