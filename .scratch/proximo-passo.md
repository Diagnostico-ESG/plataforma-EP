# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-24 (sessão do /executar-complexo do ticket 04 de publicacao-e-arquivamento, parte do código)

- **Funcionalidade:** quadro-livre, parte 1 (Andamento livre), branch de integração `quadro-livre-parte-1`, enviada ao GitHub (último commit `c291cb6`); **não** foi juntada à `main`.
- **Feito no ticket 04 (código):** migração `20261024193536_registrar_publicacao_e_arquivar_tudo` (`registrar_publicacao`, arquivar suspenso e cancelado, evento da publicação, explicação na view), testes `49` e `55`, módulo e falso, janela da chegada a Concluídos, registrar e corrigir publicação, Agora de Concluídos, do suspenso, do cancelado e do arquivado, histórico. Docker local: 1299 `ok`, 0 `not ok`; `npm test` 2405 verdes; lint, tsc, build e circular limpos. Plano em `.scratch/publicacao-e-arquivamento/plano-04.md`.
- **Falta do ticket 04 (tarefa 7 do plano), e o ticket ainda NÃO tem a linha `Concluído em`:**
  1. **Do usuário (login do GitHub):** disparar o workflow "Testes de banco" na branch `quadro-livre-parte-1` e conferir que passa (o navegador do app não está logado no GitHub; a página do workflow dá 404).
  2. Aplicar no desenvolvimento, em ordem, pelo workflow "Migrar banco de desenvolvimento" (um disparo por arquivo, com o alvo conferido): `20261024040938_andamento_livre_passagens.sql`, `20261024040942_andamento_livre_sai_o_modelo_anterior.sql`, `20261024040945_andamento_livre_mover.sql`, `20261024173606_pacote_pela_posicao_no_catalogo.sql`, `20261024182706_registrar_revisao_e_aprovacao.sql`, `20261024193536_registrar_publicacao_e_arquivar_tudo.sql`. As duas primeiras são destrutivas no desenvolvimento (ADR 0022). Registrar cada uma em `supabase/AMBIENTES.md`.
  3. Regenerar os tipos do remoto (`npm run db:types`, alvo conferido); o gerado vale sobre o escrito à mão.
  4. **Do usuário:** conferir na tela com o login real (mover pela lista e arrastando, etiqueta, responsável, revisão, aprovação, chegada a Concluídos pelas duas opções, registrar e corrigir publicação, arquivar e desarquivar concluído, suspenso e cancelado; os dois critérios `[visual]`) e anotar no plano o que foi visto e o que foi presumido.
  5. **Do usuário:** republicar `planilhas-dos-dashboards` (roteiro `docs/planilhas-publicar-a-funcao.md`) e atualizar as planilhas pela aba Planilhas.
  6. Juntar à `main` sem `--force`, enviar, conferir o "Testes de banco" na `main`, criar e enviar o marco, apagar a branch com `git branch -d`, gravar `Concluído em` no ticket 04 e comitar.
- **Próximo comando:** retomar com `/executar-complexo` no ticket 04 (o plano tem caixas marcadas) em sessão com o Sonnet, quando o workflow estiver disponível; depois, `/polir` e `/ship` (o `/ship` ainda tem as ressalvas `[visual]` das janelas de chegada, de registrar publicação e de registrar revisão e aprovação, presumidas por falta de vitrine local).
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das quatro specs; apagar ou refazer o handoff desatualizado `.scratch/handoff-2026-10-20.md`; refazer os dashboards no Data Studio (linha nova do backlog).
