# Revisão interna e aprovação são registros na etapa, sem trava

Data: 2026-10-23.

Decisão do usuário (iniciativa quadro-livre, parte 1). Substitui os ADRs 0009 e 0015, que gravavam a revisão e a aprovação no "Concluir" da etapa e recusavam concluir sem elas. O ADR 0011 (versão aprovada sem arquivo substituído) continua.

Sem "Concluir" (ADR 0022), os dois registros deixam de estar presos ao movimento:

- **Revisão interna:** com o processo nessa etapa, [Registrar revisão] grava o resultado. "Sem alteração" vale para a versão mais recente; "corrigida" diz que a versão enviada nessa etapa é a correção da anterior, com o escopo (fluxograma, relatório ou ambos). Cada passagem pela etapa pode ter o seu registro; corrige-se editando, não excluindo. Quando o autor da versão revisada registra a revisão, ou fica responsável do processo nessa etapa, a plataforma avisa e grava.
- **Aprovação:** com o processo na Aprovação pelo setor, [Registrar aprovação] grava a versão mais recente e o número, o link e a data do E-protocolo, opcionais. Mover o processo para trás não desfaz a aprovação; uma aprovação registrada depois, da mesma versão (ajuste sem versão nova) ou de outra, toma o lugar da anterior, que fica no histórico.

Registrar não move o processo, e mover não exige registro.

## Opções consideradas

- Envio de versão na Revisão interna registrar a revisão "corrigida" sozinho: um clique a menos, mas dois caminhos para o mesmo registro; o usuário preferiu um botão só para os dois resultados.
- Desfazer a aprovação ao mover para trás (como no ADR 0015): num quadro em que se arrasta, um engano apagaria a aprovação.
- Recusar o registro do autor da versão: mantém a regra do revisor, mas volta a ser trava, contra a iniciativa.
