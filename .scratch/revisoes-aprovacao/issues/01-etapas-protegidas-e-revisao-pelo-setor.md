# 01: Etapas protegidas e Revisão pelo setor com versão completa

**Como resolve a sua parte.** Hoje a Revisão pelo setor pode ser concluída com a versão sem relatório, e as três etapas de revisão podem sumir do catálogo, o que quebraria as travas dos tickets seguintes. Este ticket protege as três etapas no catálogo e faz a janela de concluir a Revisão pelo setor dizer o que falta na versão mais recente, sem deixar concluir. Ele também cria o gatilho de conclusão em `andamentos` que os tickets 02 e 03 vão estender.

**What to build:** gatilho em `etapas` que recusa desativar ou excluir `revisao_interna`, `revisao_setor` e `aprovacao_setor` (renomear e mover continuam); funções `private` de versão mais recente e de versão completa; gatilho antes de alterar o status de `andamentos` para `concluida` que, na `revisao_setor`, exige a versão mais recente completa (recusa com o que falta, ou sem versão); na `JanelaDeAvanco` aberta pelo [Concluir] e pelo arrastar, para a `revisao_setor`, a frase do que falta e o botão desabilitado; a falsa de processos consulta a falsa de versões para imitar a trava; frases das recusas, inclusive a do catálogo na Administração. Spec: histórias 11, 12 e 26; regras "Concluir a `revisao_setor`" e "Etapas … não se desativam nem se excluem".

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes antes da migração: desativar e excluir as três etapas recusados, renomear e mover aceitos; concluir a Revisão pelo setor sem versão, com versão sem relatório, sem .bpmn ou sem .png recusado com o que falta; com versão completa aceito; com versão nova completa enviada na própria etapa aceito; "realizada anteriormente" aceita sem versão. Os testes antigos que concluem a etapa 4 passam a montar uma versão completa antes.
- [x] A janela de concluir a Revisão pelo setor, pelo Agora e pelo arrastar no Quadro, mostra "A V8 está sem relatório." (ou o que faltar, ou que não há versão) e não deixa concluir; com versão completa, conclui como hoje.
- [x] A recusa do catálogo aparece como frase na administração do catálogo de etapas.
- [x] Testes de interface com as falsas cobrindo os itens acima, inclusive a recusa que vem do banco por outro caminho.
