# O Arquivado deixa de existir; o concluído sai só do Quadro, por "Tirar do Quadro" ou após 30 dias

Data: 2026-10-28.

Decisão do usuário (funcionalidade 14, `repositorio-de-processos`, mudança em `publicacao-e-arquivamento` e `processos-etapas`). Revê a decisão 5 a 8 da sabatina de `publicacao-e-arquivamento` (2026-10-22), que criou o Arquivado.

O Arquivado (marca com trava, selo "Arquivado", filtro "Arquivados", Arquivar e Desarquivar) deixa de existir. Ele misturava duas coisas: tirar o concluído da vista do trabalho em curso e guardá-lo à parte. Os concluídos, com fluxo e relatório finais, são o centro do portfólio de processos, e o selo e o filtro os tratavam como algo guardado na gaveta. A trava não protegia nada que a versão aprovada já não proteja.

Fica a separação por visualização: o Quadro por etapa e o Quadro por responsável mostram o trabalho em curso; a visualização por setor e a Lista mostram o portfólio, com os concluídos sempre presentes e a escolha "Todos | Concluídos" à vista. No Quadro por responsável, o concluído não aparece. No Quadro por etapa, a coluna Concluídos continua sempre, e o cartão sai dela por **Tirar do Quadro** (Administrador ou Integrante do EP, para toda a equipe, sem histórico, desfazível só no aviso logo depois) ou sozinho, 30 dias depois de entrar em Concluídos. Se o processo sair de Concluídos e voltar, o cartão volta e os 30 dias recomeçam.

O banco perde `arquivado_em` e as travas ligadas a ele; os processos arquivados no desenvolvimento voltam a ser concluídos, suspensos ou cancelados comuns. As entradas antigas de arquivar e desarquivar continuam no histórico, que não se reescreve.

## Opções consideradas

- **Só a regra dos 30 dias, sem ação humana:** o usuário quer poder tirar o cartão antes.
- **Coluna Concluídos com todos os concluídos, sem saída:** a coluna cresce sem fim.
- **Remover a coluna Concluídos do Quadro:** perderia o arrastar para concluir.
- **Manter o Arquivado sem trava, com outro nome:** a marca continuaria separando os concluídos na Lista, que é justamente o que se quer evitar.
