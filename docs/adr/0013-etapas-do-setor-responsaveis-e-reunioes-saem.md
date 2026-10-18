# Etapas do setor, responsáveis do setor e a área de Reuniões saem da plataforma

Data: 2026-10-18.

Decisão do usuário (iniciativa experiencia-do-quadro, parte 1): identificação dos responsáveis, sensibilização e identificação dos processos já foram feitas para todos os setores, e a equipe do EP é avessa a burocracia. A plataforma deixa de registrá-las, deixa de guardar os responsáveis dos setores e perde a área de Reuniões. Diverge de `.scratch/especificacao.md`, que previa os três.

O que fica da reunião é só a data da modelagem piloto, num campo do próprio item (processo, subprocesso ou a classificar), que pode ficar vazio. Uma reunião que trata vários processos é marcada em cada um. A data não muda nenhuma etapa. A primeira etapa do catálogo passa a se chamar Modelagem piloto, e o catálogo perde o nível "setor".

Consequência: tabelas, funções e telas de reuniões, participantes, responsáveis do setor e etapas do setor são apagadas por migração nova (criadas entre 2026-10-13 e 2026-10-15, com a produção ainda inexistente; só se perdem dados inventados do desenvolvimento). Saem com elas as travas que impediam excluir ou trocar o setor de um processo tratado numa reunião. Os eventos antigos dessas entidades ficam no histórico, que nunca se apaga, e a tela os mostra numa linha genérica.

## Opções consideradas

- Manter a reunião como registro próprio, só com a data e os processos: guarda "uma reunião, vários processos", mas mantém as travas e as telas que a iniciativa quer tirar.
- Manter as tabelas sem uso: sobra estrutura que precisa continuar segura e testada sem servir a ninguém. Se voltar a fazer falta, o código está no histórico do git.
