# Demanda: repositório de processos

Recebida em 2026-10-28 pelo `/demanda`. Classificada como **mudança em funcionalidade existente** (`publicacao-e-arquivamento` e `processos-etapas`), confirmada pelo usuário. Próximo passo: `/planejar` no modo completo, com Opus.

## O que o usuário quer

Ter, pela plataforma, um **repositório de processos**: ver de forma hierarquizada, como uma árvore, os macroprocessos, os setores e os processos, e, no processo, os arquivos do Drive (fluxograma .bpm, .png, relatório e .bpmn, se houver). Sem encher a plataforma de telas redundantes.

## O que já foi decidido na conversa

1. **Onde a árvore entra: na Lista, como agrupamento** (opção 3 de três). A Lista ganha um seletor "Agrupar por: Nenhum | Macroprocesso". Nenhum é a tabela de hoje; Macroprocesso mostra a árvore macroprocesso → setor → processo, com os arquivos no nível do processo. É o mesmo padrão do "Agrupar por" do Quadro, e a busca e os filtros da Lista valem nos dois modos.
   - Descartadas: uma área nova "Repositório" na faixa lateral (repetiria a Lista, com busca e filtros próprios) e trocar a tabela pela árvore (perderia a visão rápida de etapa, responsável e situação de todos).
2. **Filtro e ordenação em cada coluna da Lista**, por um botão no cabeçalho de cada coluna.
3. **Sai o filtro "Arquivados: Mostrar | Esconder"**: não deve haver opção para esconder os arquivados. Com o filtro por coluna, "Arquivado" pode virar um valor filtrável na coluna Situação (a confirmar depois de repensar o conceito, item abaixo).
4. **O conceito de Arquivado está errado**, nas palavras do usuário, e precisa ser repensado do zero na sabatina.

## O que é o Arquivado hoje (para a sabatina)

Termo no `CONTEXT.md` e regras na spec de `publicacao-e-arquivamento`:

- Marca de um processo concluído, suspenso ou cancelado, posta por um Administrador ou Integrante do EP.
- O processo sai do Quadro e fica só na Lista, com o selo ao lado da situação ("Arquivado · Concluído", "Arquivado · Suspenso", "Arquivado · Cancelado").
- Fica travado: não se move, não muda etiqueta nem responsável, Anotações só para leitura. Aceita só registrar a publicação (sem data ainda) e desarquivar, que o devolve como estava.
- No banco: coluna `arquivado_em` e a trava nos gatilhos de hoje, em `passagens` e em `responsavel_id`.

Atrito notado: os arquivados são justamente os processos concluídos, com fluxo e relatório finais, o centro de um repositório. Hoje aparecem como algo "guardado na gaveta", com selo e filtro à parte.

## Em aberto para o `/planejar`

- **Por que o conceito de Arquivado está errado** e o que ele deve passar a ser (ou se deve deixar de existir). O usuário ainda não detalhou.
- **Quais arquivos aparecem no processo, na árvore:**
  - A. Só a versão mais recente, com o relatório dela e um selo "aprovada" quando for o caso (usa conceitos que já existem; sugerida na conversa).
  - B. A versão aprovada como "a oficial", com as outras recolhidas abaixo (cria a regra do que é oficial e do que mostrar sem aprovada).
- Subprocessos: entram sob o processo pai ou sob o setor deles (o subprocesso pode ter setor diferente do pai)?
- Um setor aparece sob cada macroprocesso de que participa; setor e macroprocesso sem processo aparecem?
- Não iniciados e cancelados aparecem na árvore?
- Anexos aparecem junto com os arquivos da versão?
- O .png abre uma miniatura ou só o link para o Drive?
- O que o perfil Consulta vê.
- Quais colunas ganham filtro e ordenação, e como o filtro por coluna convive com os filtros de hoje (Setor, Macroprocesso, Situação, busca pelo nome).
