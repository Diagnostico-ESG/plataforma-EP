# Sabatina — parte 2 (Cartão e verso), 2026-10-25

Muda `processos-etapas` (e, pela coluna renomeada, o pacote das planilhas de `exportacao-e-manutencao`). Parte das decisões do mapa (`.scratch/quadro-livre/mapa.md`) e da parte 1 (`sabatina-parte-1.md`), que não foram reabertas. Todas as recomendações foram aceitas pelo usuário. Termo no `CONTEXT.md`: **Data da modelagem piloto** (substitui **Reunião**). Sem ADR novo: nenhuma decisão é difícil de desfazer.

## Data da modelagem piloto

1. **Troca total de nome, mesmo sentido:** o dia em que o EP se reúne com o setor para a Modelagem piloto; pode ser futura. Muda o título da seção no verso ("Reunião" → "Data da modelagem piloto"), o selo do cartão e o texto do histórico, inclusive dos eventos antigos.
2. **Cadastro:** o formulário de Novo processo abre com a data de hoje preenchida; a pessoa altera ou apaga. Continua opcional.
3. **Antes e depois de passar:** no verso, "12/11/2026 · próxima" ou "· realizada", como hoje. No cartão, o selo "Modelagem 12/11" ou "Modelagem hoje" só enquanto a data é hoje ou futura **e** o processo está em Não iniciados ou na Modelagem piloto; fora disso, some.
4. **Dados do desenvolvimento:** processos sem data continuam sem data; nada é preenchido.
5. **Coluna renomeada:** `processos.data_da_reuniao` → `processos.data_da_modelagem_piloto`, por migração nova (com views e pacote das planilhas ajustados); a função `planilhas-dos-dashboards` precisa ser publicada de novo (passo do usuário, já pendente). Desfazer: migração com o nome antigo.

## Barra da etapa

6. **Onde aparece:** sai do Quadro por etapa (a coluna já diz a etapa). Entra no Quadro agrupado por responsável, com "Nome da etapa · 2 de 8" acima dela, no lugar do nome da etapa no rodapé. Na Lista, a coluna "Etapa atual" vira a barra com nome e posição. Processos do setor seguem a Lista. A parte 5 reaproveita a mesma barra.
7. **Desenho (esboço A):** um bloco por etapa ativa do catálogo, contando Não iniciados e Concluídos; anteriores em cinza cheio, a atual meio cheia, as seguintes vazias; em Concluídos, todas cheias. Só cinza neutro, sem azul. Suspenso e cancelado mostram a mesma barra; a pílula de situação diz o resto. Os blocos cheios querem dizer "etapas antes desta", não "feitas".

## Etiquetas

8. **Cores (esboço):** A fazer cinza, Em andamento laranja suave, Concluído verde suave, numa pílula com bolinha da cor antes do texto, no cartão e na coluna Etiqueta da Lista. No Agora, continua a lista de escolha.

## Processo parado

9. **Aviso destacado:** selo vermelho suave "12 dias nesta etapa" (sai o âmbar, para não confundir com o laranja de Em andamento) e faixa colorida na borda esquerda do cartão. O mesmo selo ao lado do nome na Lista e no Agora. Sem filtro "Só os parados" por ora.

## Anotações

10. **Altura:** o campo começa com cerca de 7 linhas (o triplo das 2 de hoje); o máximo continua em cerca de 12 linhas, e depois rola por dentro.
