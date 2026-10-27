# Sabatina de visual-do-cartao (2026-10-27)

Decisões da sabatina (`/mattpocock-skills:grill-with-docs`), a partir de `.scratch/visual-do-cartao/demanda.md`. Fonte para a spec.

## Barra de etapas

- **Direção escolhida: D1, barra contínua lisa** (proposta na própria sabatina, depois de ver A, B e C em imagem). Uma faixa só, preenchida até a etapa atual, com degradê do azul claro ao azul escuro; a ponta mais escura marca onde o processo está. Sem divisões entre etapas; a posição exata segue no texto "{etapa} · n de N" acima da barra. Em Concluídos, cheia. Trilho vazio em cinza claro.
- Descartadas: A (segmentos com brilho), B (trilho com pontinhos: miúdos com 8+ etapas), C (passos conectados: o ✓ some no tamanho do cartão), D2 (com divisões finas).
- Imagens comparadas em `.scratch/visual-do-cartao/imagens/` (barras, cartoes, barra-d, q4, paleta, afazer, gradiente; siglas inventadas).
- **Onde aparece:** como hoje. No Quadro agrupado por etapa a barra continua escondida (Q2: não); nos agrupamentos por setor e por responsável e na Lista, a barra nova.

## Etiqueta

- **Cor viva só na Etiqueta** (A fazer, Em andamento, Concluído), mesmos tons de hoje (cinza, laranja, verde) mais saturados, texto escuro do mesmo tom, contraste AA. As pílulas de Situação (Suspenso, atraso, aprovado) ficam como estão.

## Cor do setor

- **Paleta fixa de 30 cores claras**, podendo ter vermelho, verde e âmbar em pastel; sigla sempre num texto escuro único. A paleta é mostrada em imagem ao usuário antes de gravar.
- **Pode repetir** por escolha de quem edita o setor; não há trava no banco. Setor novo recebe a primeira cor ainda livre; com as 30 em uso, a primeira da paleta. **Setor inativo continua ocupando a cor.**
- **Onde aparece (os sete):** faixa do cartão; título da coluna no agrupamento por setor; selo da sigla no verso; coluna Setor da Lista; lista e tela do setor nos cadastros; linhas de setor envolvido no macroprocesso; caixas de seleção de setor (quadradinho da cor, pelo `OpcaoDaCaixa`). Nomes de arquivo e textos corridos ficam só texto.
- **Troca:** grade com as 30 amostras no formulário do setor (controle nativo, cada amostra com nome acessível); as cores em uso por outro setor aparecem marcadas, sem impedir.
- **Migração:** os 22 setores existentes recebem cor pela ordem alfabética da sigla; cores consecutivas da paleta bem diferentes entre si.
- **Glossário:** "Cor do setor" incluída no `CONTEXT.md`.

## Frente do cartão no Quadro agrupado por setor (revê o ADR 0029)

- **S2: o nome do processo vai dentro da faixa colorida**, no lugar da sigla, em destaque (16px, negrito); a sigla fica no título da coluna (com a cor do setor). Escolhida entre S1 (fio de cor + nome grande) e S3 (sem faixa), vistas em imagem.
- **Só nesse agrupamento.** Nos agrupamentos por etapa e por responsável, a faixa leva a sigla maior e centralizada, e o nome segue no corpo do cartão como hoje.

## Quem troca a cor

- **Administrador e Integrante do EP**, como o resto do cadastro do setor (as políticas de `setores` já liberam os dois). A demanda dizia "administrador"; o usuário confirmou seguir o cadastro.

## Gravação da cor

- **O banco guarda o número da cor na paleta (1 a 30)**, não o código da cor. O tom de cada número fica num único ponto do código da tela; ajustar um tom não pede migração. O banco calcula a primeira cor livre ao criar o setor.
- **Paleta proposta (2026-10-27, mostrada em imagem):** 15 tons em duas intensidades ("claro" e "médio"), na ordem coral, água, rosa, menta, orquídea, verde, lilás, pistache, lavanda, limão, pervinca, areia, azul, pêssego, céu (claros, 1 a 15), depois os médios (16 a 30) começando em limão. Contraste da sigla entre 6,8 e 13,9. A etiqueta A fazer voltou para ajuste (precisa ser a de maior destaque).

## Etiqueta: correção da cor (2026-10-27)

- **A fazer em violeta cheio** (fundo #6A3FD9, texto e bolinha brancos, contraste 6,3): é a etiqueta de maior destaque, por ser a que pede ação. Violeta porque nenhuma outra pílula usa esse tom.
- **Em andamento e Concluído com cor viva** (opção 1 da imagem): Em andamento fundo #FFC27A, texto #5E2C00 (7,2); Concluído fundo #9EE0B4, texto #0D4A22 (6,8). Substitui a decisão anterior de "mesmos tons, mais saturados" para o A fazer.
- **Paleta dos setores:** a aprovação ficou em aberto; o usuário pediu para ver a faixa com degradê.
- **Faixa com degradê G1 (2026-10-27):** do tom da cor (esquerda) para um tom um pouco mais escuro da mesma cor (direita), calculado pela tela a partir do número da cor (nada novo no banco). Conversa com a barra de etapas (claro → escuro). Sigla com contraste AA nas duas pontas. **Vale em tudo:** faixa do cartão, título da coluna e também os selos pequenos (Lista, verso, cadastros, setor envolvido) e o quadradinho das caixas de seleção. Descartadas: G0 lisa, G2 para quase branco, G3 diagonal.
- **Paleta aprovada (2026-10-27).**

## Histórico

- **A troca de cor não entra no histórico do setor** (é aparência). O evento do setor continua listando só nome, sigla, observações e ativo; gravação que muda só a cor não vira evento, e o preenchimento dos 22 setores na migração também não.

## Fora do escopo (confirmado)

- Pílulas de Situação (Suspenso, atraso, aprovado, tipo) ficam como estão.
- Nomes de arquivo e textos corridos continuam só texto.
- Barra no Quadro agrupado por etapa: continua sem barra.
