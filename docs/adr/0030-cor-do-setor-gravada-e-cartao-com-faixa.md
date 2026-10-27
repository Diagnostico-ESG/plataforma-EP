# Cor do setor gravada no cadastro, e o cartão ganha faixa colorida, barra em degradê e etiquetas vivas

Data: 2026-10-27.

Decisão do usuário (demanda visual-do-cartao, mudança em `processos-etapas` e `cadastros-basicos`). Revê a frente do cartão do ADR 0029 e duas regras da identidade visual: "barra só cinza" e "cor só onde há informação".

Cada setor passa a ter uma **cor do setor**, escolhida numa paleta fixa de 30 cores claras. O banco guarda só o número da cor (1 a 30); o tom de cada número fica num único ponto do código da tela. O setor novo recebe a primeira cor ainda livre (com as 30 em uso, a primeira da paleta); quem edita o setor (Administrador e Integrante do EP) pode trocá-la, inclusive por uma já usada. O setor inativo continua com a sua. A troca não entra no histórico. Os setores existentes recebem cor na migração, pela ordem alfabética da sigla.

A cor acompanha a sigla em toda a plataforma, sempre em degradê do tom da cor para um tom um pouco mais escuro dela, com a sigla em texto escuro. O cartão do Quadro ganha no topo uma faixa na cor do setor, de lado a lado: com a sigla maior e centralizada nos agrupamentos por etapa e por responsável, e com o nome do processo em destaque no agrupamento por setor (a sigla já está no título da coluna, também colorido). Isso desfaz a parte do ADR 0029 que tirava a linha do topo no agrupamento por setor.

A barra de etapas deixa de ser cinza: vira uma faixa contínua lisa, preenchida até a etapa atual em degradê do azul claro ao azul escuro. Continua sem aparecer no Quadro agrupado por etapa. A etiqueta ganha cor viva: A fazer em violeta cheio com texto branco, por ser a que pede ação; Em andamento e Concluído em laranja e verde mais fortes. As pílulas de Situação não mudam.

O motivo: o usuário quer reconhecer o setor de relance, e o cartão cinza "parecia sem vida". A cor do setor é identidade, não alerta, por isso fica numa posição própria (o topo) e pode usar tons pastel de vermelho, verde e âmbar sem se confundir com as pílulas.

## Opções consideradas

- Cor calculada a partir da sigla, sem gravar nada: recusada pelo usuário, porque repete cores entre setores (como acontece com as cores dos macroprocessos).
- Gravar o código da cor em vez do número: ajustar um tom pediria migração, e a paleta teria de existir igual no banco e na tela.
- Proibir dois setores com a mesma cor: o 31º setor ficaria impossível sem ampliar a paleta.
- Barra em segmentos com brilho, trilho com pontinhos, passos conectados ou contínua com divisões: vistas em imagem; o usuário preferiu a contínua lisa.
- No agrupamento por setor, um fio de cor fino com o nome grande, ou cartão sem faixa: vistos em imagem; o usuário preferiu o nome dentro da faixa.
- Cor viva também na Situação: tudo colorido tira o destaque dos alertas.
