# Em andamento em âmbar, cor da coluna até o último cartão e setores vazios no fim

Data: 2026-10-28.

Decisão do usuário (demanda de 2026-10-28, mudança em `processos-etapas`, planejada no `/planejar` modo curto). Revê dois pontos do ADR 0031.

A etiqueta **Em andamento** deixa o índigo e passa a âmbar cheio (`#F59E0B`), com texto e bolinha marrom-escuros (`#451A03`, 7,0:1). É a única das três etiquetas com letra escura, porque o branco não tem contraste AA sobre o âmbar. A fazer (magenta) e Finalizado (verde-petróleo) ficam como estão.

No Quadro por setor, o fundo tingido da coluna vai só até o último cartão, e não mais até a base do Quadro. A coluna vazia fica só com o cabeçalho colorido, e a frase de coluna vazia aparece abaixo, sobre o fundo da página. As colunas passam a vir com os setores que têm cartão na tela primeiro, depois os vazios, cada grupo em ordem de sigla.

O motivo: o índigo lia como mais um azul da interface, e o usuário quer uma cor próxima do amarelo/laranja para o que está em movimento. A cor na altura toda pintava grandes áreas vazias, e os setores sem processo misturados aos demais obrigavam a procurar onde há trabalho.

## Opções consideradas

- **Laranja queimado com letra branca** (`#C2410C`): mantinha a letra branca nas três etiquetas, mas lia mais como tijolo do que como amarelo.
- **Laranja vivo com letra escura** (`#FB923C`): meio-termo, preterido pelo âmbar, mais próximo do amarelo. O âmbar cheio fica perto da pílula "vencendo", mas ela é clara e a etiqueta é cheia.
- **Coluna vazia com um bloco tingido baixo, da altura da frase:** uma regra só para todas as colunas; o usuário preferiu a vazia só com o cabeçalho, mais discreta.
- **Ordem pelo total do setor, sem olhar os filtros:** a ordem ficaria fixa, mas com "Só os meus" apareceriam colunas vazias no meio das cheias. Escolhido contar o que está na tela, para os vazios ficarem sempre no fim.
