# Mudar o catálogo de etapas muda o caminho dos processos em andamento

Data: 2026-10-13.

Quando o administrador acrescenta uma etapa ao catálogo, ela entra como "pendente" em todos os processos em andamento; processos concluídos e cancelados não recebem. As etapas seguintes que já começaram continuam como estão, e a etapa nova fica como pendência para o integrante dispensar ou registrar. Desativar uma etapa faz o inverso: ela some de onde ainda estava pendente e continua onde já foi usada.

O catálogo configurável existe para que o caminho do trabalho mude sem mudar o código (por exemplo, as etapas da fase 2). Se a etapa nova valesse só para os processos cadastrados depois, processos do mesmo período seguiriam caminhos diferentes sem que ninguém percebesse, e o painel compararia tempos de caminhos diferentes. Por isso, uma etapa pode aparecer num processo antigo sem que ninguém tenha mexido nele: o histórico registra quando e por quê.

## Opções consideradas

- Etapa nova só nos processos cadastrados depois: mais simples, mas divide os processos em caminhos diferentes, sem aviso.
- Etapa nova em todos os processos, inclusive concluídos: reabriria processos já encerrados.
