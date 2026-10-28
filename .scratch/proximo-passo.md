# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-28 (/executar-simples ajustes-quadro-lista, concluído)

- **Feito:** a seção "Ajustes do Quadro e da Lista" de `.scratch/processos-etapas/spec.md` (commit 8d8cb7a, ADR 0032): títulos centralizados em todo agrupamento, etiqueta Em andamento em âmbar cheio, coluna por setor só até o último cartão (vazia: só o cabeçalho), colunas com processo antes das vazias, Lista sem a coluna Etiqueta e nomes à esquerda. Sem banco. 3109 testes passando.
- **Próximo:** `/polir` (Sonnet) para a interface, depois o `/ship` (Sonnet), que entrega junto esta mudança e a "Coluna tingida e etiquetas fortes" (spec segue "Em revisão desde 2026-10-28").
- **Atenção no `/polir` e no `/ship`:** a altura da coluna por setor usa `align-self: flex-start` com `max-height: 100%` (Quadro.css); não foi vista no navegador (exige login). Conferir que a coluna cheia ainda rola por dentro e que a vazia fica só com o cabeçalho. Critérios [visual] 4 a 7 presumidos.
- **Pendente do usuário (segue valendo):** publicar de novo `arquivos-no-drive` e `planilhas-dos-dashboards` no desenvolvimento; conferir o papel da conta de serviço nos Drives compartilhados; provar anexos no Drive real; conferir as telas com o login real (critérios `[visual]`); conferir no painel do Supabase de desenvolvimento que o cadastro aberto por e-mail segue desligado; apagar `.scratch/handoff-2026-10-20.md`; repor o e-mail do git (`git config --global user.email`). `src/types/database.ts` aparece modificado só por fim de linha.
