# Usuário que já entrou não se exclui, só se desativa

Data: 2026-10-07.

Depois do primeiro acesso, o usuário fica ligado ao histórico e, nas funcionalidades seguintes, a versões, revisões e etapas. Excluí-lo deixaria esses registros sem autor ou obrigaria a apagá-los. Por isso, quem já entrou só pode ser desativado: perde o acesso, deixa de aparecer para escolha e continua com o nome no histórico (regra 9 da especificação). Só a autorização "Aguardando primeiro acesso" pode ser excluída.

## Opções consideradas

- Excluir quando não houver nada ligado: possível depois, sem chave secreta, se o caso "autorizado por engano que chegou a entrar" aparecer.
- Excluir sempre, trocando nome e e-mail por "Usuário removido": é o caminho de um pedido de eliminação pela LGPD, mas em órgão público o registro de quem fez o quê costuma ser obrigação legal. Fica no backlog até o jurídico se manifestar.
