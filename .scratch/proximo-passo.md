# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-24 (sessão do /executar-complexo do ticket 06 de exportacao-e-manutencao, planilhas pela posição no catálogo)

- **Funcionalidade:** quadro-livre, parte 1 (Andamento livre). **Tickets 24 e 25 de processos-etapas e 06 de exportacao-e-manutencao concluídos** na branch de integração `quadro-livre-parte-1` (enviada ao GitHub; **não** foi juntada à `main`). As quatro migrações do andamento livre (três do ticket 24 e `20261024173606_pacote_pela_posicao_no_catalogo`) seguem **não aplicadas** no desenvolvimento.
- **Pendente do usuário (ou de quem tiver login no GitHub):** disparar o workflow "Testes de banco" na branch `quadro-livre-parte-1` (o navegador do app estava sem login no GitHub) e conferir que passa. No Docker local a bateria deu 1249 `ok` e 0 `not ok`.
- **Ordem dos tickets que faltam:**
  1. `.scratch/revisoes-aprovacao/issues/05-registrar-revisao-e-aprovacao-sem-trava.md` (depende do 25, feito);
  2. `.scratch/publicacao-e-arquivamento/issues/04-chegada-a-concluidos-publicacao-arquivamento-e-integracao.md` (termina a branch: aplica as migrações no desenvolvimento pelo workflow "Migrar banco de desenvolvimento" e regenera os tipos; depois, republicar `planilhas-dos-dashboards` é passo seu, pelo roteiro de `docs/planilhas-publicar-a-funcao.md`).
- **Próximo comando:** em sessão com o Sonnet, `/executar-complexo` no ticket 05 de revisoes-aprovacao. Depois do 04 de publicacao-e-arquivamento, `/polir` e `/ship`.
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das quatro specs; apagar ou refazer o handoff desatualizado `.scratch/handoff-2026-10-20.md`; refazer os dashboards no Data Studio (linha nova do backlog).
