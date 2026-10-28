# A cor do setor passa do cartão para a coluna, e as etiquetas ficam fortes

Data: 2026-10-28.

Decisão do usuário (demanda de 2026-10-28, mudança em `processos-etapas` pela `visual-do-cartao`, escolhida em maquetes). Revê parte do ADR 0030.

No Quadro agrupado por setor, a cor do setor deixa o cartão e vai para a coluna. A coluna inteira, na altura toda do Quadro, ganha um fundo claro do tom do setor, e o cabeçalho vira uma faixa no degradê do setor, com a sigla centralizada. O cartão perde a faixa larga com o nome do processo e fica igual ao do Quadro por etapa. A coluna de setor inativo fica cinza. Nos Quadros por etapa e por responsável, o cartão mantém a faixa com a sigla, porque ali a coluna não diz o setor.

As etiquetas passam a ter fundo forte com letra branca: A fazer em magenta, Em andamento em índigo, e Concluído em verde-petróleo, renomeada para **Finalizado**. O valor guardado no banco não muda; só o rótulo exibido muda.

O motivo: com uma faixa colorida em cada cartão, a tela pesava, e o nome do processo, centralizado e em 16px, ficava mais difícil de ler que no Quadro por etapa. A cor rende mais no que identifica o setor, a coluna. As etiquetas vivas de 2026-10-27 tinham tons claros de laranja e verde, da mesma família da paleta dos setores, e sumiam na coluna tingida. As cores novas ficam fora da paleta dos setores e das pílulas de prazo (âmbar, vermelho, verde). O nome "Concluído" se confundia com a etapa Concluídos, que é o fim do processo; "Finalizado" diz que a parte de quem estava na etapa terminou.

## Opções consideradas

- **Só um fio fino da cor no topo do cartão, com o cabeçalho colorido** (o primeiro pedido, opção A da maquete): o usuário preferiu a coluna tingida, que se lê de relance mesmo rolando a tela.
- **Aba de pasta** e **placa do setor** (opções C e D): descartadas na maquete.
- **Cor só até o último cartão:** a tela fica mais calma, mas a área de cor varia de coluna para coluna; preferida a altura toda.
- **Setor inativo com a sua cor:** o cinza destaca o caso à parte (processos presos num setor desativado), escolhido pelo usuário.
- **Etiquetas:** semáforo forte (o laranja escuro lembra a pílula "vencendo"), grafite com bolinha (as três ficam parecidas) e degradê; escolhidas as "pedras preciosas", com o magenta em A fazer, por ser a que pede ação.
