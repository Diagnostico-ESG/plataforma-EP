# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-26 (fim do `/executar-complexo` do ticket 09 de documentos-versoes, Versões por etapa)

- **Feito:** o ticket 09, na branch de integração `quadro-livre-parte-3` (enviada ao GitHub; **ainda não** juntada à `main`, que fica para o último ticket da parte): banco (migração `20261026103000_versoes_por_etapa`, aplicada no desenvolvimento; testes 56 e 57 novos e 27, 28 e 40 ajustados, "Testes de banco" #40331999009 verde), função do servidor (piloto, acrescentar .png e .bpmn), módulo, verso (botão da etapa, formulário da piloto, tracejado de acrescentar) e testes de tela. `npm test` 2510 verdes, lint, typecheck e circulares limpos. O ticket tem a linha `Concluído em`; os dois critérios `[visual]` seguem presumidos.
- **Próximo comando:** `/executar-complexo` no ticket 10 de documentos-versoes (Relatório com numeração própria; Sonnet), numa sessão nova começando pelo `/situação`. Depois o 11 (Trava de arquivos) e o 06 de revisoes-aprovacao, um de cada vez (os quatro mexem na mesma função do servidor). O ticket 10 troca "relatório pendente", [Sem alteração de conteúdo] e `copiado_de`, que o 09 deixou como estavam.
- **Pendente do usuário:**
  - publicar a função `arquivos-no-drive` no desenvolvimento (`npx supabase functions deploy arquivos-no-drive --use-api --project-ref yclkzyoebpsxmgpbcbus`, no seu terminal; modelo em `docs/drive-conta-de-servico.md`, seção 4), senão o envio de versão na tela não funciona;
  - conferir na tela, com o login real e a função publicada: o botão da etapa (Não iniciados, Modelagem piloto, técnica, Revisão interna; nenhum depois), o formulário da piloto (número preenchido, V6P), o formulário que rola e fecha pelo mesmo botão, [+ Acrescentar .png] e [+ Acrescentar .bpmn] no tracejado;
  - ler as "Decisões tomadas ao escrever esta seção, a confirmar na leitura" das duas seções novas (documentos-versoes e revisoes-aprovacao) e as decisões de execução do `desvios.md` de 2026-10-26;
  - republicar a função `planilhas-dos-dashboards` no desenvolvimento; apagar ou refazer o handoff antigo `.scratch/handoff-2026-10-20.md`.
- **Ressalvas:** a versão piloto ainda mostra "falta relatório" e o cartão do quadro mostra "V6" para uma V6P (tickets 10 e 11; no backlog); `scripts/prova-do-drive.mjs` foi ajustado e não foi rodado.
