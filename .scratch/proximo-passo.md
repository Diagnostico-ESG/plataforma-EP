# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-24 (sessão do `to-tickets` do quadro-livre parte 1, Andamento livre)

- **Funcionalidade:** quadro-livre, parte 1 (Andamento livre). O planejamento terminou: specs atualizadas e 5 tickets, todos `ready-for-agent`, feitos na branch de integração `quadro-livre-parte-1` (criada no primeiro ticket). As migrações vão ao banco de desenvolvimento só no último ticket.
- **Ordem dos tickets:**
  1. `.scratch/processos-etapas/issues/24-banco-das-passagens.md` (não depende de nenhum);
  2. `.scratch/processos-etapas/issues/25-tela-do-andamento-livre.md` (depende do 24);
  3. `.scratch/revisoes-aprovacao/issues/05-registrar-revisao-e-aprovacao-sem-trava.md` (depende do 25);
  4. `.scratch/exportacao-e-manutencao/issues/06-planilhas-pela-posicao-no-catalogo.md` (depende do 24, pode ser feito antes do 25);
  5. `.scratch/publicacao-e-arquivamento/issues/04-chegada-a-concluidos-publicacao-arquivamento-e-integracao.md` (depende do 25, do 05 e do 06; termina a branch).
- **Próximo comando:** em sessão nova com o Sonnet, `/executar-complexo` no ticket 24 de processos-etapas. Todos os tickets são complexos: têm várias partes interligadas (banco, módulo, tela) em que a ordem importa.
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das quatro specs antes do ticket 24; apagar ou refazer o handoff desatualizado `.scratch/handoff-2026-10-20.md`.
