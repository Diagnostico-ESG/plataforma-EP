# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-24 (sessão do /executar-complexo do ticket 04 de publicacao-e-arquivamento, depois da migração do desenvolvimento)

- **Funcionalidade:** quadro-livre, parte 1 (Andamento livre), branch de integração `quadro-livre-parte-1`, enviada ao GitHub; **ainda não** foi juntada à `main`.
- **Feito no ticket 04:** o código (migração `20261024193536_registrar_publicacao_e_arquivar_tudo`, testes `49` e `55`, módulo, janela da chegada, registrar e corrigir publicação, Agora, histórico); o "Testes de banco" #192 verde na branch (commit `3d8a280`); as **seis migrações do Andamento livre aplicadas no desenvolvimento** pelo workflow (execuções #43 a #48, todas com sucesso), registradas em `supabase/AMBIENTES.md`; tipos regenerados do remoto com `npm run db:types` (`npm test` 2405 verdes, tsc limpo). Plano em `.scratch/publicacao-e-arquivamento/plano-04.md`.
- **Falta do ticket 04 (o ticket ainda NÃO tem a linha `Concluído em`):**
  1. **Do usuário:** conferir na tela com o login real, no app apontado para o desenvolvimento: mover pela lista e arrastando, etiqueta, responsável, revisão, aprovação, chegada a Concluídos pelas duas opções, registrar e corrigir publicação, arquivar e desarquivar concluído, suspenso e cancelado; e os dois critérios `[visual]` (janela de chegada em 1366×768; "Arquivado" e a pílula juntos na Lista). Anotar no plano (seção "Conferência na tela") o que foi visto e o que foi presumido.
  2. **Do usuário:** republicar `planilhas-dos-dashboards` (roteiro `docs/planilhas-publicar-a-funcao.md`) e atualizar as planilhas pela aba Planilhas.
  3. Juntar à `main` sem `--force`, enviar, conferir o "Testes de banco" na `main` (a execução #190, de hoje, na `main` estava vermelha antes desta junção), criar e enviar o marco, apagar a branch com `git branch -d`, gravar `Concluído em` no ticket 04 e comitar.
- **Próximo comando:** retomar com `/executar-complexo` no ticket 04 (o plano tem caixas marcadas) em sessão com o Sonnet, depois da conferência na tela; depois, `/polir` e `/ship` (o `/ship` ainda tem as ressalvas `[visual]` das janelas de chegada, de registrar publicação e de registrar revisão e aprovação).
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das quatro specs; apagar ou refazer o handoff desatualizado `.scratch/handoff-2026-10-20.md`; refazer os dashboards no Data Studio (linha nova do backlog).
