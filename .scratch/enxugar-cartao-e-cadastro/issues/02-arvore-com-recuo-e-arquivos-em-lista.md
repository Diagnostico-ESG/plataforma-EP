# 02: Árvore da Lista com recuo e arquivos em lista

**What to build:** na Lista agrupada por macroprocesso, cada nível da árvore fica recuado em relação ao de cima, num passo fixo: macroprocesso, setor, processo e subprocesso, e a linha dos arquivos um passo à frente do processo a que pertence. Os arquivos da versão mais recente passam a aparecer um abaixo do outro. Cada item mostra o ícone do tipo e o nome completo do arquivo, como foi enviado (o nome original gravado), e baixa ao clicar, com a falha abaixo do nome como hoje. Os tipos .docx (relatório), .bpmn, .bpm e .png têm ícone próprio, e qualquer outro formato usa um ícone genérico de arquivo. Os ícones entram no conjunto de ícones já desenhado no projeto, sem biblioteca nova. A seleção de arquivos (fluxo e relatório que vale, sem anexos nem o .pdf da aprovação), a ordem, o rótulo da versão e o selo "Aprovada" não mudam. Também não mudam os estados "Carregando arquivos…", o erro com "Tentar de novo" e "Sem versão ainda.". Não há mudança no banco. Regras completas na spec: seção "Árvore da Lista" (histórias 42 a 46) e decisão "Árvore da Lista".

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Os arquivos de um processo aberto aparecem como lista vertical, cada um com o nome completo gravado e o ícone do tipo (.docx, .bpmn, .bpm, .png, e o genérico para os demais).
- [ ] Clicar no nome baixa o arquivo, e a falha aparece abaixo do nome, como hoje.
- [ ] A versão mais recente e o selo "Aprovada" continuam acima dos arquivos, e anexos e o .pdf da aprovação continuam fora.
- [ ] "Carregando arquivos…", o erro com "Tentar de novo" e "Sem versão ainda." continuam funcionando.
- [ ] O teste da árvore está atualizado para o comportamento novo. `npm test` verde.
- [ ] `[visual]` Cada nível está recuado em relação ao de cima, e a linha dos arquivos se lê como parte do processo acima.
