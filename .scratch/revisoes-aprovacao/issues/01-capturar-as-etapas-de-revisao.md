# 01: Capturar as etapas de revisão

**Como resolve a sua parte.** Hoje só o seletor de responsável põe alguém numa etapa. Este ticket deixa o Integrante assumir com um clique as etapas de revisão interna, revisão pelo setor e aprovação, impede que o autor da versão mais recente seja o responsável da revisão interna dela, e protege essas três etapas no catálogo, porque as travas dos tickets seguintes dependem delas.

**What to build:** [Capturar] na linha das etapas `revisao_interna`, `revisao_setor` e `aprovacao_setor` sem responsável (pendente ou em andamento), para Administrador e Integrante, com o processo em andamento, gravando o próprio usuário pela mesma alteração do seletor; gatilho em `andamentos` que recusa como responsável da `revisao_interna` o autor da versão mais recente (vale para o [Capturar] e para o seletor); gatilho em `etapas` que recusa desativar ou excluir as três etapas (renomear e mover continuam); frases das recusas. Spec: histórias 1 a 7 e 34.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração: integrante e administrador capturam; consulta, inativo e visitante recusados; autor da versão mais recente recusado como responsável da revisão interna (pelo capturar e pelo seletor), outro integrante aceito; processo sem versão aceita qualquer responsável; desativar e excluir as três etapas recusados, renomear e mover aceitos; a captura gera o evento de responsável que já existe.
- [ ] [Capturar] aparece só nas três etapas, sem responsável, para Administrador e Integrante, com o processo em andamento; some com responsável, com a Consulta e com o processo suspenso, cancelado ou concluído; vale igual num subprocesso.
- [ ] A recusa do autor aparece como "Quem enviou a versão V7 não pode revisá-la."; a recusa do catálogo aparece na administração do catálogo.
- [ ] Testes de interface com as falsas cobrindo os itens acima, inclusive falha ao gravar.
- [ ] [visual] [Capturar] cabe na linha da etapa sem quebrar o alinhamento das outras ações.
