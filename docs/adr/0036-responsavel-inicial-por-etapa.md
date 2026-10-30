# Responsável inicial por etapa, no lugar de "quem move vira o responsável"

Data: 2026-10-30.

Decisão do usuário (funcionalidade 17, `responsavel-inicial-por-etapa`, mudança em `processos-etapas`; pacote 4 da demanda de 2026-10-30). Substitui a parte do ADR 0022 em que quem move o processo passa a ser o responsável dele.

O Administrador define, no Catálogo de etapas, um responsável inicial opcional para cada etapa, menos Concluídos: um Administrador ou Integrante do EP ativo. O processo que chega a uma etapa fica com o responsável inicial dela, ou sem responsável se ela não tiver. "Chegar" é ser cadastrado (em Não iniciados), ser movido ou ser retomado depois de suspenso ou cancelado. Quem move fica só no histórico, como autor do evento. Assumir e a troca manual continuam como estão.

- Responsável inicial que deixou de estar ativo ou perdeu o perfil não impede o movimento: o processo fica sem responsável, e o Catálogo mostra o problema ao Administrador.
- Trocar o responsável inicial de uma etapa não mexe nos processos que já estão nela; vale para quem chegar depois.
- Os processos que já existem ficam com o responsável que têm; a migração só acrescenta a coluna.
- O aviso do revisor (ADR 0023) não muda: aparece sempre que, na Revisão interna, o responsável é o autor da versão mais recente, venha ele de onde vier.

O motivo: na prática quem move é quem terminou a etapa anterior, então o processo ficava com a pessoa errada (o relato "o responsável da etapa anterior continua"). Cada etapa costuma ter alguém da equipe que a pega, e o catálogo é o lugar onde isso já se organiza.

## Opções consideradas

- **Manter "quem move vira o responsável":** é a origem do relato.
- **Escolher o responsável a cada movimento:** acrescenta uma pergunta a cada arrastar, que o andamento livre (ADR 0022) tirou de propósito.
- **Recusar o movimento quando o responsável inicial é inválido:** trava o trabalho da equipe por uma configuração.
- **Apagar o responsável inicial ao desativar o usuário:** perde a escolha do Administrador em silêncio.
- **Passar os processos que já estão na etapa ao trocar o responsável inicial:** troca em lote, fora do que foi pedido.
