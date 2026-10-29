# Demanda: enxugar o cartão e o cadastro

Recebida em 2026-10-29 pelo `/demanda`. Classificada como **mudança em funcionalidade existente** (`processos-etapas` e `repositorio-de-processos`), confirmada pelo usuário. O bug do setor entra como ticket desta mesma mudança (opção A, escolha do usuário). Próximo passo: `/planejar` no modo completo, com Opus.

## O que o usuário quer

### Árvore (Lista agrupada por macroprocesso)
- Níveis recuados ao abrir a árvore.
- Arquivos um abaixo do outro, com o nome completo e o ícone do tipo original (docx, bpmn, png).

### Verso do cartão
- Responsável: só a foto (ou a bolinha com a letra) e o nome. Sai o tempo ("há 1 dia") e o "Trocar"; clicar no nome abre a escolha do responsável.
- Sem responsável: não aparece ninguém, nem na frente nem no verso.
- Data da modelagem piloto: sai do lado direito do verso. Fica só um campo para registrar a data de realização, na etapa Modelagem Piloto, que pode ficar na linha das Etapas.
- Topo do verso: sai o nome do macroprocesso seguido do tipo (processo, macroprocesso), que confunde e já aparece no lado direito.
- "Arquivos" passa a se chamar "Documentos do Mapeamento".

### Frente e verso
- Foto do responsável (ou bolinha com letra) um pouco maior.

### Cartão em Não iniciados
- Sai a etiqueta "Modelagem hoje" e a data agendada da modelagem piloto. Só existe a data de realização, e não nesta etapa.

### Cadastro de Novo processo
- Sai a Origem (novo ou retomado).
- Sai a data da modelagem piloto.
- Contexto e Observações viram um só campo de texto livre.

### Bug
- A mensagem "Escolha o setor do processo." não some depois que o setor é escolhido (`src/components/processos/CamposDoProcesso.tsx`).

## O que mexe no banco (visto na classificação)

Colunas em `processos`: `origem` (`public.origem_do_processo`), `contexto`, `observacoes` e a data agendada da modelagem piloto. Apagá-las pede migração; não há produção, só dados inventados no desenvolvimento.

## Em aberto para o `/planejar`

- Qual campo fica, Contexto ou Observações, com que nome, e o que fazer com o texto já gravado no outro.
- Onde exatamente a data de realização da modelagem piloto é registrada (linha das Etapas, na etapa Modelagem Piloto) e se ela continua aparecendo em algum lugar além do verso (Lista, painéis, planilhas).
- O que acontece com a Origem e a data agendada em telas e exportações que as usam hoje (Lista, filtros, planilhas dos dashboards).
- Quais termos do `CONTEXT.md` e quais ADRs são substituídos.
