# Cada etapa tem os seus arquivos, só o .bpm é exigido, e a trava fica na Modelagem piloto e na técnica

Data: 2026-10-25.

Decisão do usuário (iniciativa quadro-livre, parte 3). Substitui o ADR 0016 (versão exige .bpm e .png). Completa o ADR 0022 (andamento livre) e o 0024 (trava de Concluídos), que deixam de ser a única trava ao mover.

Cada tipo de versão se envia na sua etapa e aparece em todas: a versão histórica (F) em Não iniciados; a versão piloto (P), com o número digitado e maior que o de todas as anteriores, na Modelagem piloto; a versão em sequência (sem letra, número dado pela plataforma a partir do maior que já existe, de qualquer tipo) na Relatório e modelagem técnica e na Revisão interna. Depois da primeira versão em sequência, não entram mais F nem P. Toda versão que não é F exige só o .bpm; o .png e o .bpmn são opcionais e podem ser acrescentados depois. A ideia de "versão completa" sai.

A **trava de arquivos** recusa mover o processo para a frente de uma etapa (vindo dela ou de antes, indo para depois dela, pela lista ou arrastando) enquanto faltam os arquivos dela: na Modelagem piloto, uma versão P; na técnica, uma versão em sequência e um relatório, sem importar a ligação entre os dois. A janela diz o que falta e oferece o envio ali mesmo. Voltar, mudar a etiqueta e processo que já estava depois da etapa não travam: os processos do desenvolvimento que passaram da Modelagem piloto sem P ficam sem ela, sem aviso.

O motivo: a dinâmica entre etapas é da equipe (ADR 0022), mas o .bpm do piloto e o par .bpm e relatório da técnica são o que o EP entrega em cada uma; sem eles, o processo seguiria adiante sem o produto da etapa. O .png deixa de ser exigido porque o pedido foi "o envio dos arquivos não deve ser obrigatório" e o trabalho continua a partir do .bpm.

## Opções consideradas

- Mostrar no verso os campos de todas as etapas, preenchíveis a qualquer momento: não exige mover, mas carrega a tela e solta o arquivo da etapa; voltar já é só arrastar.
- Travar também a etiqueta Concluído: dois pontos de trava para a mesma regra.
- Travar todo movimento para depois da etapa, inclusive de quem já estava adiante: prenderia os processos que passaram da Modelagem piloto antes da versão P existir.
- Manter o .png obrigatório: é o arquivo que se lê sem o Bizagi, mas contraria o pedido de envio não obrigatório.
- Recomeçar a sequência em V1 depois da P: V1 apareceria depois de V6P.
