# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-24 (sessão do /executar-complexo do ticket 24 de processos-etapas, banco das passagens)

- **Funcionalidade:** quadro-livre, parte 1 (Andamento livre). **Ticket 24 concluído** na branch de integração `quadro-livre-parte-1` (commit `77c1026`; a branch segue aberta e **não** foi juntada à `main`). As três migrações estão criadas e **não aplicadas** no desenvolvimento; "Testes de banco" verde (44 de 44) pelo ensaio automático. A tela não funciona contra o banco migrado até o ticket 25 (remendos só para o `tsc`).
- **Ordem dos tickets que faltam:**
  1. `.scratch/processos-etapas/issues/25-tela-do-andamento-livre.md` (depende do 24, feito);
  2. `.scratch/revisoes-aprovacao/issues/05-registrar-revisao-e-aprovacao-sem-trava.md` (depende do 25);
  3. `.scratch/exportacao-e-manutencao/issues/06-planilhas-pela-posicao-no-catalogo.md` (depende do 24, pode ir antes do 25);
  4. `.scratch/publicacao-e-arquivamento/issues/04-chegada-a-concluidos-publicacao-arquivamento-e-integracao.md` (termina a branch: aplica as três migrações no desenvolvimento pelo workflow "Migrar banco de desenvolvimento", regenera os tipos e apaga `src/processos/clienteSemTipos.ts`).
- **Próximo comando:** em sessão nova com o Sonnet, `/executar-complexo` no ticket 25 de processos-etapas (mexe na interface; depois dos tickets, `/polir` e `/ship`).
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das quatro specs; apagar ou refazer o handoff desatualizado `.scratch/handoff-2026-10-20.md`. Ao subir a branch, lembrar que o navegador do app precisa estar logado no GitHub para disparar o "Testes de banco".
