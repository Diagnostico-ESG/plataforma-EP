# A revisão pelo setor é só uma etapa, sem rodadas

Data: 2026-10-17.

Substitui, no ADR 0009, a trava da etapa de revisão pelo setor, e deixa sem objeto o ADR 0010 (que tratava dos e-mails das rodadas; a plataforma continua sem guardar e-mails).

Decisão do usuário: a plataforma não registra rodadas com o setor. O ciclo "vai ao setor, volta, revisa, vai de novo" já fica no histórico das etapas: a etapa de revisão pelo setor em andamento quer dizer que o processo está com o setor; se o setor pede ajustes, o EP volta à revisão interna (`voltar_a_etapa`), e cada início, conclusão e volta vira um evento com autor e data. Quantas vezes o processo foi ao setor e quanto tempo ficou lá saem desses eventos.

O "Concluir" da revisão pelo setor exige que a versão mais recente esteja completa (.bpmn, .png e relatório). A aprovação continua registrando a versão aprovada e o número do E-protocolo, e as travas da revisão interna e da aprovação do ADR 0009 continuam.

Consequência: a plataforma não diz qual versão foi a cada ida ao setor nem o que o setor respondeu; isso fica nos e-mails da equipe e no E-protocolo. Somem a situação "pronto para envio / com o setor" e as travas de datas entre envio e resposta.

## Opções consideradas

- Rodadas numeradas, com envio, resposta e situação calculada (spec de 2026-10-16): guarda cada ida ao setor, mas é uma tabela, telas e travas sem uso na v1. Se o Dashboard (v1.5) precisar, a tabela se acrescenta sem mexer no que existe.
