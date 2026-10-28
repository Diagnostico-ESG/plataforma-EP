# A cor do setor fica lisa, no tom claro da paleta

Data: 2026-10-28.

Decisão do usuário (funcionalidade 13, `cor-solida-do-setor`, mudança em `processos-etapas` e `cadastros-basicos`, escolhida na prévia `.scratch/cartoes-da-aplicacao-solidos.png`). Revê o degradê da cor do setor dos ADRs 0030 e 0031.

A cor do setor deixa o degradê e passa a ser lisa, no tom da paleta (o tom claro), em todo lugar onde aparece: selo da sigla, faixa do cartão, cabeçalho da coluna por setor, quadradinho das caixas de seleção de setor e grade de amostras do setor aberto. Assim a cor é a mesma em todas as telas, e a amostra mostra a cor como ela vai aparecer. O tom mais escuro calculado deixa de existir; o contraste AA da sigla escura passa a ser conferido só sobre o tom claro.

Não mudam: a paleta de 30 cores e o número gravado no banco; o fundo tingido da coluna por setor (já feito do tom claro, até o último cartão, pelo ADR 0032); a barra de etapas, que continua em degradê do azul claro ao azul escuro, porque não é cor de setor: a ponta escura marca a etapa atual.

O motivo: o usuário preferiu a prévia com a cor lisa. O porquê da preferência não foi detalhado na sabatina.

## Opções consideradas

- **Liso só no cartão e na coluna, degradê nas caixas e amostras:** a mesma cor apareceria de dois jeitos, e o tom escuro teria de continuar existindo só para isso.
- **Manter o tom escuro no código sem uso:** código morto que confunde quem lê depois.
- **Barra de etapas também lisa:** a barra perderia a ponta escura que marca a etapa atual, e a prévia aprovada a mostra em degradê.
