# O processo se move livremente entre as etapas, com etiqueta e um responsável do processo

Data: 2026-10-23.

Decisão do usuário (iniciativa quadro-livre, parte 1). Substitui o ADR 0004 (etapa nova como pendente nos processos), a trava de concluir a Validação com o setor do ADR 0012 (o resto dele continua: a plataforma não registra cada envio ao setor) e o ADR 0014 (resolver a etapa já inicia a próxima; trava do autor na escolha do responsável).

A plataforma deixa de impor a sequência das etapas. O processo está sempre em uma etapa do catálogo e vai para qualquer outra, para a frente ou para trás, pela lista de etapas ou arrastando o cartão, sem motivo. A dinâmica fica com a combinação da equipe, como no Planner: quem termina marca a etiqueta Concluído, o próximo vê e leva o processo para a etapa dele.

- O catálogo começa em **Não iniciados** (onde entra todo processo cadastrado) e termina em **Concluídos**, as duas fixas no lugar e no nome. Saem obrigatória/opcional, iniciar, concluir, dispensar, "realizada anteriormente" e "voltar com motivo".
- A etapa atual tem a **etiqueta** A fazer, Em andamento ou Concluído, que volta a A fazer a cada mudança de etapa.
- O processo tem **um responsável**, não um por etapa. Quem move o processo, para qualquer etapa, passa a ser o responsável; depois, qualquer integrante o troca. O autor da versão mais recente na Revisão interna recebe um aviso, sem impedimento (ADR 0023).
- Etapa nova no catálogo só acrescenta uma coluna. Etapa com processo dentro não se desativa nem se exclui; as seis etapas com campos próprios não se desativam nem se excluem.
- Processo parado: mais de 7 dias na mesma etapa (antes, 15 dias desde o início da etapa).
- Cada mudança de etapa, etiqueta e responsável vira evento. Os eventos do modelo anterior (andamento de etapa e escolha de publicação) são apagados na migração, como exceção única à regra de que o histórico não se apaga: só existem dados inventados no desenvolvimento, e a produção ainda não foi criada.

Consequência: a plataforma não garante mais que um processo passou por todas as etapas. O histórico mostra o caminho real, e as fases do Regimento contam pela posição do processo no catálogo.

## Opções consideradas

- Manter a sequência com menos cliques (o que a experiencia-do-quadro fez): o catálogo editável continuaria sem sentido, porque cada etapa nova vira trava para todos.
- Responsável por etapa: guarda mais, mas exige escolher a cada passagem; o histórico já diz quem esteve em cada etapa.
- Responsável vazio ao mover: mostraria que ninguém pegou, mas quem move é quase sempre quem vai trabalhar, e teria de assumir logo depois.
- Mostrar os eventos antigos numa linha simples ("modelo anterior"): preservaria dados inventados à custa de manter o código de leitura de um modelo que saiu.
