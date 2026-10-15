# Um arquivo da versão se substitui sem guardar o anterior

Data: 2026-10-15.

A especificação (regra 2) e as regras de banco diziam que versões nunca se apagam e que substituir cria uma versão nova. Decisão do usuário: a **versão** continua existindo para sempre, com o seu número, mas um **arquivo** dela (o relatório ou um arquivo do fluxograma) pode ser substituído por outro do mesmo tipo. O arquivo anterior não fica guardado; o histórico do processo registra a troca: quem, quando, qual arquivo e o nome e o hash do que saiu.

Uma versão nova existe quando o conteúdo muda. Anexar o arquivo errado é um erro de envio, não uma alteração do fluxo ou do relatório; criar uma versão nova para corrigi-lo faria a numeração avançar sem mudança real.

Consequência: "o V7" pode ter tido conteúdos diferentes ao longo do tempo, e o que saiu não pode ser recuperado pela plataforma. O hash no histórico permite saber se o arquivo que o setor recebeu é o que está guardado agora.

## Opções consideradas

- Arquivo errado gera versão nova (a recomendação da sabatina): cada número é uma fotografia fixa, mas a numeração avança a cada engano.
- Substituir guardando o anterior como "substituído": preserva tudo, ao custo de uma lista de arquivos mais longa em cada versão.
