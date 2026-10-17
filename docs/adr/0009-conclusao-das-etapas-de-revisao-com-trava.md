# As etapas de revisão e aprovação se concluem à mão, com trava no banco

Data: 2026-10-16.

Registrar uma revisão interna, uma rodada ou a aprovação não muda nenhuma etapa, como o envio de versão (ADR 0006). O "Concluir" continua sendo o único jeito de concluir uma etapa, mas o banco recusa concluir a revisão interna sem uma revisão da versão mais recente, a revisão pelo setor sem uma rodada respondida "aprovada" ou "ajustes solicitados" (e nenhuma aberta), e a aprovação pelo setor sem a aprovação com o número do E-protocolo.

Sem a trava, o painel contaria como aprovado um processo sem número de E-protocolo. Com a conclusão automática, haveria dois jeitos de concluir a mesma etapa, e o registro mudaria a etapa, ao contrário do ADR 0006. As três etapas ficam protegidas no catálogo (não se desativam nem se excluem), porque a trava depende delas.

A rodada com "ajustes solicitados" basta para concluir a revisão pelo setor: quando o ajuste é pequeno, o EP faz a versão nova e a leva direto ao E-protocolo, sem reenviar ao setor.

## Opções consideradas

- Registro conclui a etapa sozinho: menos cliques, mas dois caminhos de conclusão e o ADR 0006 contrariado.
- Registros sem ligação com a etapa: o mais simples, mas permite etapa de aprovação concluída sem E-protocolo.
