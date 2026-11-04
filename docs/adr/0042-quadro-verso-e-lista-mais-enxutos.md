# Quadro, verso e Lista mais enxutos

Data: 2026-11-04.

Decisão do usuário (demanda no `/demanda`, sabatina do `/planejar` de `enxugar-quadro-e-verso`). O motivo comum: as telas mostravam a mesma informação em mais de um lugar e controles com função repetida; o usuário quer cada dado e cada ação uma vez só.

## O que muda

- **Assumir sai.** O botão duplicava a seleção de responsável; pôr-se como responsável passa a ser escolher a si mesmo, que aparece primeiro na seleção, como "Você". O termo sai do `CONTEXT.md`.
- **O .bpmn deixa de ser enviado** em todos os caminhos (formulário da versão, "+ Acrescentar .bpmn" e versão histórica). A versão histórica passa a exigir o .bpm. Os .bpmn já enviados continuam na versão, para baixar. A regra fica só na tela: o banco continua aceitando .bpmn, porque o usuário pode precisar dele de volta.
- **[Enviar relatório] sai** das etapas Relatório e modelagem técnica e Revisão interna: o relatório vai no formulário da versão ou pelo "+ Acrescentar relatório" da versão. O botão continua "Enviar versão" nessas etapas, porque ali a versão é em sequência; "Enviar versão piloto" segue só na Modelagem piloto.
- **A linha de etapas do verso fica só visual** (os ícones do ADR 0041): sai também o "Realizada em" da Modelagem piloto. A Data da modelagem piloto ganha um campo fixo no verso, da Modelagem piloto em diante, com o nome do glossário.
- **Rótulos Etapa e Status saem** da tela (o leitor de tela segue com os nomes).
- **O atraso no cartão** fica como está, mas o cartão perde a borda vermelha.
- **Colunas do Quadro** ganham uma faixa de tom neutro em toda a altura, com o título dentro e sem tags, o que alinha título e cartões.
- **A Lista agrupada** perde as colunas Macroprocesso e Setor, que a árvore já mostra.

## Opções consideradas

- **Manter Assumir como termo, só sem botão:** o termo ficaria sem nada na tela que o represente.
- **Tirar o .bpmn só do envio normal, mantendo na versão histórica:** preservaria trabalho antigo que só exista em .bpmn; o usuário preferiu uma regra só, com o .bpm exigido.
- **Impor no banco a recusa do .bpmn e o .bpm na histórica:** exigiria migração e dificultaria a volta do .bpmn.
- **Trocar para "Enviar versão piloto" também nas etapas da versão em sequência:** daria a entender que ali se envia uma versão piloto.
- **Tirar a Data da modelagem piloto ou trocá-la pela data de envio da versão piloto:** são datas diferentes (a do encontro e a do arquivo), e a primeira vai às planilhas dos dashboards.
