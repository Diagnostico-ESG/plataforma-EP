# 05: Árvore por Macroprocesso, com os arquivos de cada processo

**Como resolve a sua parte.** Hoje não há como ver o portfólio organizado nem pegar o fluxo e o relatório de um processo sem abri-lo. Este ticket dá à Lista a opção "Agrupar por: Macroprocesso", que mostra a mesma tabela em árvore (macroprocesso → setor → processo), e faz cada processo abrir a linha com os arquivos da versão mais recente.

**What to build:** spec, seção "Lista: Agrupar por Macroprocesso" e os estados da tela:

- **Agrupar por: Nenhum | Macroprocesso** acima da tabela. Nenhum = a tabela de hoje. Macroprocesso = mesma tabela, colunas, cabeçalhos, filtros e ordenação do ticket 04, com linhas de grupo: macroprocesso (nome e quantidade, seta), setor (selo da sigla, nome e quantidade, seta) e processos (cada um com seta que abre a linha dos arquivos); subprocessos recuados sob o processo pai, mesmo os de outro setor (o selo mostra o setor). Subprocesso cujo pai não passa nos filtros aparece sob o seu próprio setor, no macroprocesso do pai, com a indicação "subprocesso de <pai>".
- Ordem: macroprocessos por nome, setores por sigla, processos pela ordenação escolhida (ordenar por Setor ou Macroprocesso não muda a árvore). Ramos sem processo, depois dos filtros, não aparecem. Macroprocessos e setores abertos, processos fechados; "Abrir todos / Fechar todos" abre e fecha todos os níveis, inclusive os arquivos de todos os processos. Clicar no nome do processo abre o verso. As linhas de macroprocesso e setor se distinguem das de processo e a linha dos arquivos se lê como parte do processo (critério [visual]).
- **Cancelados** na árvore: lista simples no fim, fora dos ramos, com o setor e o macroprocesso de cada um.
- **Linha dos arquivos:** a versão mais recente com o rótulo (V7, V6P, V5F) e o selo "Aprovada" quando for a aprovada; um link para cada arquivo dela (.bpm, .png, .bpmn se houver) e o relatório ligado a ela (Relatório V2 .docx, ou o .pdf antigo sem número); cada link abre o arquivo no Drive como no verso. Sem miniatura e sem anexos. Sem versão: "Sem versão ainda." Busca só ao abrir o processo (com "Abrir todos", busca de uma vez os de todos os visíveis), pelas tabelas que o verso já lê. "Carregando arquivos…" enquanto busca; erro: "Não foi possível carregar os arquivos." com "Tentar de novo", sem fechar a linha. Consulta vê e abre, sem editar.
- **Endereço:** `agrupar=macroprocesso` na Lista (continua valendo o `agrupar` do Quadro para responsável e setor); o que está aberto ou fechado não entra no endereço. A tabela e a árvore usam a mesma lista de linhas já filtrada e ordenada.
- Funções puras (montagem da árvore: grupos, ordem, subprocesso sob o pai ou sob o setor próprio, ramos vazios) com teste sem tela; o resto pela tela inteira com os módulos falsos.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] "Agrupar por: Macroprocesso" mostra macroprocesso → setor → processo com contagens e setas; Nenhum volta à tabela
- [ ] Um setor aparece sob cada macroprocesso de que participa com processos; ramos vazios não aparecem
- [ ] Subprocessos aparecem recuados sob o pai, mesmo de outro setor; o subprocesso cujo pai foi filtrado aparece com "subprocesso de <pai>"
- [ ] Filtros, busca, Todos | Concluídos e ordenação valem na árvore
- [ ] Abrir todos / Fechar todos abre e fecha todos os níveis e os arquivos
- [ ] A linha dos arquivos mostra o rótulo da versão mais recente, "Aprovada" quando for o caso, os arquivos e o relatório, cada um abrindo no Drive; "Sem versão ainda." quando não há
- [ ] "Carregando arquivos…" e o erro com "Tentar de novo" funcionam sem fechar a linha nem perder a árvore
- [ ] Os cancelados aparecem numa lista simples no fim, com setor e macroprocesso
- [ ] `agrupar=macroprocesso` fica no endereço
- [ ] Consulta vê a árvore e abre os arquivos sem editar nada
- [ ] Testes verdes; `npm test` verde
