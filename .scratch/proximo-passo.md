# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-24 (sessão do /executar-complexo do ticket 05 de revisoes-aprovacao, registrar revisão e aprovação sem trava)

- **Funcionalidade:** quadro-livre, parte 1 (Andamento livre). **Tickets 24 e 25 de processos-etapas, 06 de exportacao-e-manutencao e 05 de revisoes-aprovacao concluídos** na branch de integração `quadro-livre-parte-1` (enviada ao GitHub; **não** foi juntada à `main`). As cinco migrações do andamento livre (três do 24, `20261024173606_pacote_pela_posicao_no_catalogo` e `20261024182706_registrar_revisao_e_aprovacao`) seguem **não aplicadas** no desenvolvimento.
- **Pendente do usuário (ou de quem tiver login no GitHub):** disparar o workflow "Testes de banco" na branch `quadro-livre-parte-1` e conferir que passa. No Docker local a bateria deu 1266 `ok` e 0 `not ok`.
- **Falta um ticket:** `.scratch/publicacao-e-arquivamento/issues/04-chegada-a-concluidos-publicacao-arquivamento-e-integracao.md` (termina a branch: aplica as migrações no desenvolvimento pelo workflow "Migrar banco de desenvolvimento", regenera os tipos de verdade — `src/types/database.ts` foi editado à mão no ticket 05 — e junta à `main`; depois, republicar `planilhas-dos-dashboards` é passo do usuário, pelo roteiro de `docs/planilhas-publicar-a-funcao.md`).
- **Próximo comando:** em sessão com o Sonnet, `/executar-complexo` no ticket 04 de publicacao-e-arquivamento. Depois dele, `/polir` e `/ship` (o `/ship` ainda tem as ressalvas `[visual]` das janelas de registrar revisão e aprovação, presumidas por falta de vitrine local).
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das quatro specs; apagar ou refazer o handoff desatualizado `.scratch/handoff-2026-10-20.md`; refazer os dashboards no Data Studio (linha nova do backlog).
