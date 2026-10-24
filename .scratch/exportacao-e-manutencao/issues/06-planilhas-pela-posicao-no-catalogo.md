# 06: Planilhas pela posição no catálogo

**Como resolve a sua parte.** Sem o status por etapa, as planilhas dos dashboards não têm mais de onde tirar a situação de cada fase. Este ticket faz as fases contarem pela posição do processo no catálogo:

- **concluída:** o processo está depois da fase, na última etapa dela com Concluído, ou em Concluídos;
- **em andamento:** o processo está numa etapa da fase;
- **não iniciada:** no resto;
- **fase VII:** só conclui com a data da publicação; sem ela, fica "Sem publicação".

Os suspensos saem das planilhas, como os cancelados.

**What to build:** as planilhas no modelo novo, de ponta a ponta (pacote do banco, funções puras da Edge Function e testes).

- **Pacote** (`private.montar_pacote_das_planilhas`):
  - etapas com a fase vazia nas duas fixas;
  - processos com `etapa_atual_id`, `etiqueta` e `publicado_em`, no lugar de `concluido` e `vai_para_publicacao`;
  - só os processos de situação guardada em andamento;
  - passagens no lugar dos andamentos, sem `movido_por` e sem nenhum nome de pessoa.
- **Validação do pacote:** aceita a fase vazia só em `nao_iniciados` e `concluidos` e exige uma passagem aberta por processo.
- **Situação das fases:** "Concluída", "Em andamento", "Não iniciada", "Sem publicação" e "Sem etapa". Saem "Pronto para iniciar", "Aguardando etapa anterior" e "Não publicado".
- **Data de conclusão de cada fase:** a mais recente em que ela passou a contar como concluída, calculada das passagens. Na fase VII, é a data da publicação.
- **Rótulos:** "Publicado", "Concluído", "Não iniciado" e "Em andamento · {fase}".
- **Datas:** a data da modelagem piloto é a data da reunião ou, sem ela, a conclusão da fase IV; a data da publicação é a do processo.
- **Contagens públicas:** iguais às de hoje, sem os suspensos.

Spec: `.scratch/exportacao-e-manutencao/spec.md`, seção "Andamento livre (mudança de 2026-10-23)" (histórias 56 a 63).

**Branch:** `quadro-livre-parte-1`. A migração vai ao banco de desenvolvimento no ticket 04 de publicacao-e-arquivamento. Depois disso, republicar a função `planilhas-dos-dashboards` no desenvolvimento é um passo do usuário, com o roteiro de hoje.

**Blocked by:** processos-etapas 24 (Banco das passagens).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Funções puras testadas no Vitest antes, com pacotes inventados:
  - cada situação da fase: depois da fase, última etapa com Concluído e com A fazer, Concluídos, a VII com e sem data, Não iniciados e uma fase sem etapa;
  - a data de conclusão, inclusive o processo que volta e conclui de novo;
  - cada rótulo;
  - os suspensos e os cancelados fora;
  - a validação da fase vazia e da passagem aberta;
  - nenhum nome de pessoa nas linhas.
- [ ] O cenário de exemplo e os testes antigos das planilhas estão ajustados.
- [ ] O teste `44_pacote_das_planilhas` foi reescrito antes da migração e visto falhar (passagens, suspensos fora, sem nome de pessoa), e o workflow "Testes de banco" passa na branch.
