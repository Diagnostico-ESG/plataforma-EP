# A versão exige o .bpm e o .png; o .bpmn fica opcional e o visualizador de .bpmn sai da v1

Data: 2026-10-20.

Muda a regra 3 da especificação (seção 5) e o glossário de Versão: a versão nova (não histórica) passa a exigir o .bpm, arquivo-fonte do Bizagi, e o .png; o .bpmn passa a opcional. A versão completa exigida pela trava das revisões (ADR 0009) para concluir a Revisão pelo setor e a Aprovação passa a ser .bpm, .png e relatório. A versão histórica continua podendo ter só o .bpm.

O trabalho do EP acontece no Bizagi: o .bpm é o que permite continuar o fluxo a partir de uma versão, e o .png é o que se lê. O .bpmn só serviria ao visualizador no navegador, que saiu da v1 por decisão do usuário. O fluxo se vê pelo .png, que já abre em aba nova do navegador. O visualizador de .bpmn e a geração do .png a partir dele ficam no backlog.

## Opções consideradas

- Manter .bpmn e .png obrigatórios e construir o visualizador (bpmn-js): mais uma biblioteca no navegador, com risco de o .bpmn exportado pelo Bizagi não ser desenhado como no Bizagi, para um uso que o .png já atende.
- Tirar o .bpmn de vez: as versões que já o têm perderiam o sentido do arquivo, e o visualizador futuro não teria o que abrir.
- Exigir .bpm, .bpmn e .png: três envios em toda versão, sem uso para o .bpmn na v1.
