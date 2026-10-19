# A revisão interna e a aprovação se gravam no próprio Concluir; o E-protocolo é opcional

Data: 2026-10-19.

Decisão do usuário (iniciativa experiencia-do-quadro, parte 5, no `/planejar` de revisoes-aprovacao). Substitui, no ADR 0009, o registro separado da conclusão e o motivo "impedir aprovação sem número de E-protocolo". A trava da revisão pelo setor (ADR 0012) e a versão aprovada sem arquivo substituído (ADR 0011) continuam.

- **Revisão interna:** a janela de concluir a etapa pede o resultado ("sem alteração" ou "corrigida", com o escopo) e um comentário opcional, junto com o responsável da próxima etapa. A revisão e a conclusão se gravam numa função só do banco: ou as duas acontecem, ou nada muda (como o avanço do ADR 0014). Quem conclui é o revisor, e a data da revisão é a do dia. O banco continua recusando concluir a etapa sem uma revisão que cubra a versão mais recente, para que nenhum outro caminho escape da regra.
- **Aprovação:** a janela de concluir a etapa mostra a versão aprovada (a mais recente, que precisa estar completa) e pede o número, o link e a data do E-protocolo, os três **opcionais**. O número costuma chegar depois; entra pelo [Editar]. A aprovação guarda, antes de tudo, qual versão foi aprovada.
- **Voltar** para a etapa de aprovação ou para antes dela desfaz a aprovação: a janela de voltar avisa, e o histórico guarda o que ela era. Concluir a aprovação de novo registra outra.
- **Corrigir:** só se edita (comentário e escopo da revisão; número, link e data da aprovação). Não se exclui revisão: um resultado errado se resolve voltando à etapa e concluindo de novo, e vale a revisão da versão mais recente.
- Os registros aparecem na gaveta da etapa, no verso do cartão, e a versão aprovada ganha o selo "Aprovada" em Arquivos. Não há seção própria.

## Opções consideradas

- [Registrar] separado e [Concluir] com trava (ADR 0009, spec de 2026-10-17): dois passos para a equipe, mais tela e mais recusas a explicar.
- Número do E-protocolo obrigatório: o EP não conseguiria concluir a aprovação enquanto o número não chega, e o processo ficaria parado na etapa sem motivo real.
- Recusar a volta até a aprovação ser excluída à mão: exigiria um botão Excluir e dois passos para algo que o histórico já preserva.
