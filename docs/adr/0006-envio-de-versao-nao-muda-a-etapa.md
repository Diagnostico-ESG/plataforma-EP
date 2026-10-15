# Enviar uma versão não muda a etapa do processo

Data: 2026-10-15.

A especificação (seção 3, "Detalhe das etapas 4 a 7") previa que enviar o piloto atribuísse a etapa 5 e que enviar fluxo e relatório concluísse a etapa 5. Na v1, o envio só registra a versão, com a etapa atual do processo naquele momento; quem trabalha move as etapas pelo andamento, como já faz, igual às reuniões.

O catálogo de etapas é configurável (ADR 0004), então "a etapa 5" não é um lugar fixo, e o andamento já tem responsável e conclusão próprios. Duas formas de mexer na mesma etapa acabariam se contradizendo, por exemplo ao voltar a uma etapa depois de um envio.

## Opções consideradas

- Envio que move a etapa: menos cliques, mas amarrado a posições do catálogo que podem mudar. Pode voltar por `/demanda` se fizer falta.
