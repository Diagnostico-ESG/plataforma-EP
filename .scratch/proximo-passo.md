# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-26 (fim do `/planejar` da parte 3 do quadro-livre, Arquivos por etapa)

- **Feito:** sabatina, spec (seções novas em `documentos-versoes` e `revisoes-aprovacao`, ambas com `Em revisão desde 2026-10-26`) e 4 tickets, a pedido do usuário (de 7 propostos):
  - documentos-versoes 09 Versões por etapa (sem bloqueio);
  - documentos-versoes 10 Relatório com numeração própria (depois do 09);
  - documentos-versoes 11 Trava de arquivos (depois do 09 e do 10);
  - revisoes-aprovacao 06 Data da validação e .pdf da aprovação (sem bloqueio).
- **Próximo comando:** `/executar-complexo` no ticket 09 de documentos-versoes (Sonnet), numa sessão nova começando pelo `/situação`. Depois o 10, o 11 e o 06 de revisoes-aprovacao, um de cada vez, porque os quatro mexem na mesma função do servidor. Todos em `/executar-complexo`: cada um junta migração com teste antes, função do servidor e tela, numa ordem que importa.
- **Pendente do usuário:** ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das duas seções novas; publicar a função `arquivos-no-drive` no desenvolvimento ao fim de cada ticket; conferir na tela os critérios `[visual]` do ticket 27 de processos-etapas; republicar a função `planilhas-dos-dashboards` no desenvolvimento; apagar ou refazer o handoff antigo `.scratch/handoff-2026-10-20.md`.
- **Ressalvas:** `src/types/database.ts` tem uma alteração não comitada que já existia antes desta sessão.
