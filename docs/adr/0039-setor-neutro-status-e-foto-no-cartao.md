# Setor sem cor própria, Status colorido e foto do responsável no cartão

Data: 2026-11-03.

Decisão do usuário (funcionalidade 20, `setor-neutro-e-fotos`, mudança em `cadastros-basicos` e `processos-etapas`, planejada no `/planejar` modo curto). Revê os ADRs 0030, 0031 e 0033 (cor própria do setor) e a regra "cartão por etapa sem avatar" da proposta 6.

O setor deixa de ter cor própria: o selo da sigla usa uma cor única, cinza-azulado neutro. A cor deixa de ser lida, mostrada ou gravada pela tela; a coluna `cor` de `setores` continua no banco, sem uso e sem migração (o gatilho do banco segue dando valor a setor novo). O selo cresce; o cartão do Quadro por setor volta a mostrá-lo. "Etiqueta" passa a se chamar **Status** na tela (o valor guardado e os nomes de código não mudam), com ícones maiores e **A fazer em laranja**. A Situação do processo ganha pílulas de cor onde já era pílula. O cartão do Quadro e a Lista mostram o avatar do responsável (foto do Google ou iniciais), mantendo "Você".

O motivo: a cor do setor repetia entre setores e enfeitava sem informar, enquanto o que se lê de relance (sigla, Status, Situação, responsável) estava pequeno ou apagado. A foto no cartão já era a história 231 da spec de `processos-etapas`.

## Opções consideradas

- **A fazer em azul:** pedido inicial, mas o Em andamento já é azul no código (a nota que dizia âmbar vinha do ADR 0032, superado pela identidade de 2026-10-30); o usuário escolheu o laranja.
- **Situação também em pílula em todo cartão:** o cartão já tem selo, Status, foto e prazos, e quase todos diriam "Em andamento"; o cartão fica só com "Suspenso".
- **Renomear "Situação":** evitaria a semelhança com "Status", mas mexe em filtros e textos além do pedido; mantidos os dois nomes, com a legenda explicando.
- **Remover a coluna `cor` por migração:** desnecessário e arriscado; a coluna fica sem uso.
