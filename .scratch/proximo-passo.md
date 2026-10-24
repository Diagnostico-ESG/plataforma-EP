# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-24 (sessão do /executar-complexo do ticket 25 de processos-etapas, tela do andamento livre)

- **Funcionalidade:** quadro-livre, parte 1 (Andamento livre). **Tickets 24 e 25 de processos-etapas concluídos** na branch de integração `quadro-livre-parte-1` (a branch segue aberta e **não** foi juntada à `main`). As três migrações do ticket 24 seguem **não aplicadas** no desenvolvimento; a tela só funciona contra o banco migrado depois do ticket 04 de publicacao-e-arquivamento.
- **Ordem dos tickets que faltam:**
  1. `.scratch/revisoes-aprovacao/issues/05-registrar-revisao-e-aprovacao-sem-trava.md` (depende do 25, feito);
  2. `.scratch/exportacao-e-manutencao/issues/06-planilhas-pela-posicao-no-catalogo.md` (depende do 24, feito; pode ir antes do 05);
  3. `.scratch/publicacao-e-arquivamento/issues/04-chegada-a-concluidos-publicacao-arquivamento-e-integracao.md` (termina a branch: aplica as três migrações no desenvolvimento pelo workflow "Migrar banco de desenvolvimento" e regenera os tipos; o `clienteSemTipos.ts` já foi apagado).
- **Próximo comando:** em sessão com o Sonnet, `/executar-complexo` no ticket 06 de exportacao-e-manutencao (ou no 05 de revisoes-aprovacao). Depois dos tickets, `/polir` e `/ship`.
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das quatro specs; apagar ou refazer o handoff desatualizado `.scratch/handoff-2026-10-20.md`.
