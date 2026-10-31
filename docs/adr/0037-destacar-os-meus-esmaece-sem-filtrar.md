# "Destacar os meus" esmaece os cartões dos outros, sem filtrar

Data: 2026-10-31.

Decisão do usuário (funcionalidade 18, `redesenho-do-quadro`, mudança em `processos-etapas`). Revê as histórias 169 a 171 da spec de processos-etapas, em que "Só os meus" era o mesmo que escolher a si mesmo no filtro Responsável e escondia os outros cartões.

"Só os meus" passa a ser **Destacar os meus**: um botão separado dos Filtros que esmaece os cartões em que a pessoa não é o responsável do processo, sem tirá-los da tela. Esconder os outros tirava a noção do quadro inteiro, que é para que serve o Quadro; quem quer só os seus continua podendo escolher a si mesmo no filtro Responsável. Os dois deixam de ser a mesma coisa. Sem nenhum processo da pessoa, todos os cartões ficam esmaecidos e aparece o aviso "Nenhum processo com você agora.". O botão fica no endereço da página e não aparece para o perfil Consulta.

## Opções consideradas

- **Manter "Só os meus" filtrando:** perde a vista do quadro inteiro, que a proposta 6 quer manter.
- **Esmaecer sem aviso quando não há processo da pessoa:** a tela inteira cinza parece defeito.
