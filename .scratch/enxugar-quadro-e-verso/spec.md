# Quadro, verso e Lista mais enxutos

Status: ready-for-agent

Funcionalidade 21 do `.scratch/projeto.md`, no modo completo do `/planejar` (2026-11-04). Demanda classificada no `/demanda` como mudança em funcionalidade existente: muda `processos-etapas` (Quadro, cartão, verso), `documentos-versoes` (envio de .bpmn e de relatório) e `repositorio-de-processos` (Lista agrupada). Decisões no ADR 0042; `CONTEXT.md` atualizado na sabatina (sai Assumir; o .bpmn não se envia mais; a versão histórica exige o .bpm). Onde as specs dessas três funcionalidades divergirem do que está aqui, vale esta. Não muda o banco.

**Como resolve.** O usuário vê a mesma informação em vários lugares e controles com função repetida, e isso pesa no uso diário. Esta mudança tira o que se repete e deixa cada dado e cada ação num lugar só: sai o [Assumir], porque a seleção de responsável faz o mesmo; sai o [Enviar relatório], porque o relatório já entra pelo formulário da versão e pelo "+ Acrescentar relatório"; saem o envio de .bpmn, os rótulos "Etapa" e "Status" e as colunas da Lista que a árvore já mostra. O espaço que sobra no verso vai para a miniatura do fluxograma, e as colunas do Quadro ganham uma faixa de fundo que alinha título e cartões.

## Problema

- Os selos de setor são pílulas grandes para o texto que levam.
- O cartão do processo parado tem borda vermelha, além do selo de dias, que já diz o mesmo.
- No Quadro, o título de cada coluna fica fora do alinhamento dos cartões, o que se nota mais no Quadro por setor, onde o título é uma pílula.
- No verso, os rótulos "Etapa" e "Status" repetem o que os campos já dizem; há dois botões para pôr alguém como responsável ([Assumir] e a seleção) e dois caminhos para o relatório ([Enviar relatório] e o formulário da versão); o envio de .bpmn não é mais usado; o "Realizada em" aparece na linha de etapas, que deveria ser só visual; as Anotações ocupam muito espaço e a miniatura é pequena.
- Na Lista agrupada, as colunas Macroprocesso e Setor repetem a árvore, e o "x dias nesta etapa" fica junto do nome do processo, longe da Etapa atual a que se refere.

## Solução

1. **Selo do setor menor.** A pílula da sigla perde altura e largura de preenchimento, com o mesmo tamanho de letra (13px), em todas as telas que a usam (cartão, Lista, verso, cadastros, cabeçalhos).
2. **Cartão parado sem borda vermelha.** O cartão do processo parado passa a ter a borda comum. O selo "x dias nesta etapa" continua como hoje.
3. **Colunas do Quadro com faixa de fundo.** Cada coluna vira uma faixa de tom neutro único (um pouco mais escuro que o fundo da página), da altura do título até o fim da área dos cartões, com o título dentro dela e alinhado à mesma margem dos cartões. Vale nos três quadros (por etapa, por responsável, por setor) e nas Linhas. O título fica sem tags: no Quadro por etapa, o ícone da etapa, o nome e a quantidade em número cinza; no Quadro por setor, a sigla em negrito com o nome do setor abaixo e a quantidade; no Quadro por responsável, o avatar e o nome continuam, com a quantidade. O cartão do Quadro por setor continua com o selo do setor.
4. **Verso sem rótulos Etapa e Status.** O seletor de etapa e o de Status ficam sem o rótulo visível; o nome continua no rótulo de acessibilidade.
5. **Sem [Assumir].** Pôr-se como responsável é escolher a si mesmo na seleção, em que quem está na tela aparece em primeiro lugar, como "Você". Sai também dos lugares em que o [Assumir] aparecia fora do Agora.
6. **Sem envio de .bpmn.** Sai o campo do formulário Enviar versão (piloto e em sequência), o "+ Acrescentar .bpmn" da versão e o campo da versão histórica. A versão histórica passa a exigir o .bpm (o .png e o relatório seguem opcionais). Os .bpmn já enviados continuam na versão, para baixar e substituir.
7. **(NÃO FEITO, ADR 0043: o [Enviar relatório] fica por ora; o "+ Acrescentar relatório" que este item supõe não existe mais.)** ~~Sem [Enviar relatório].~~ Sai o botão das etapas Relatório e modelagem técnica e Revisão interna. O relatório entra pelo campo do formulário Enviar versão ou pelo "+ Acrescentar relatório" da versão mais recente. O botão continua "Enviar versão" nessas etapas e "Enviar versão piloto" na Modelagem piloto. A confirmação de arquivos que oferece enviar o relatório agora passa a abrir o formulário da versão (ou o "+ Acrescentar relatório", quando a versão já existe), no lugar do formulário de relatório.
8. **Linha de etapas só visual.** A linha continua com os ícones (ADR 0041) e perde o "Realizada em" da Modelagem piloto.
9. **Campo da Data da modelagem piloto.** A data ganha um campo fixo no verso, com o rótulo "Data da modelagem piloto", do processo na Modelagem piloto em diante (fora de Não iniciados); mostra a data ou "Registrar data", e quem pode alterar o processo registra ou altera ali. Sai do Agora. As regras da data não mudam (nunca no futuro, uma por processo, não move o processo).
10. **Anotações menores.** A altura mínima do campo cai de 21 para 14 linhas (a spec previa 10,5; mudado a pedido do usuário), com a borda na cor `--linha`.
11. **Miniatura maior e verso em duas colunas.** A miniatura do fluxograma cresce ao dobro (22rem × 16rem). O verso passa a ter duas colunas na janela de 1000 px: à esquerda trilha, Agora, Data da modelagem piloto e versões; à direita, em fundo mais escuro (`--fundo-faixa`), as Anotações. Abaixo de 900 px as colunas empilham. A arrumação foi proposta pelo usuário e aprovada vendo o app real (critério 18).
12. **Lista agrupada.** Com "Agrupar por: Macroprocesso" ou "Setor", saem as colunas Macroprocesso e Setor. Em todos os agrupamentos, o atraso sai do lado do nome do processo e vai para junto da Etapa atual, como relógio e número ("🕓 8"), com o texto completo ("8 dias nesta etapa") no rótulo de acessibilidade e como dica. Em "Agrupar por: Nenhum", as colunas Macroprocesso e Setor ficam.
13. **Prévia antes do código.** O Quadro com as faixas e o verso rearrumado são mostrados ao usuário numa prévia, que ele aprova antes de a execução mexer nas telas.

## Histórias de usuário

### Quadro e cartão

1. Como Integrante do EP, quero o selo do setor mais compacto, com a sigla do mesmo tamanho, para que ele não pese mais que o nome do processo.
2. Como Integrante do EP, quero o mesmo selo compacto no cartão, na Lista, no verso e nos cadastros, para ver o setor sempre do mesmo jeito.
3. Como Integrante do EP, quero que o cartão do processo parado não tenha borda vermelha, porque o selo de dias já diz que ele está parado.
4. Como Integrante do EP, quero continuar vendo o selo "x dias nesta etapa" no cartão parado, para achar de relance o que está parado.
5. Como Integrante do EP, quero cada coluna do Quadro numa faixa de fundo própria, de cima a baixo, para ver onde a coluna começa e termina.
6. Como Integrante do EP, quero o título da coluna dentro da faixa e alinhado aos cartões, para que título e cartões pareçam uma coisa só.
7. Como Integrante do EP, quero no Quadro por etapa o ícone da etapa, o nome e a quantidade, sem pílula, para ler o título sem enfeite.
8. Como Integrante do EP, quero no Quadro por setor a sigla em negrito com o nome do setor abaixo, sem pílula, para que o título fique alinhado aos cartões.
9. Como Integrante do EP, quero que o cartão do Quadro por setor continue com o selo do setor, para que o cartão seja igual nos três quadros.
10. Como Integrante do EP, quero a quantidade de processos da coluna como um número discreto, para saber o tamanho da coluna sem que ele chame atenção.
11. Como Integrante do EP, quero as faixas também nas Linhas, para que o Quadro com linhas tenha o mesmo desenho.
12. Como Integrante do EP, quero que a coluna vazia continue com a sua faixa inteira, para que o Quadro não fique com buracos.
13. Como Integrante do EP, quero continuar arrastando cartões entre as faixas, para mover o processo como antes.

### Verso: Agora e responsável

14. Como Integrante do EP, quero o seletor de etapa sem o rótulo "Etapa", porque o próprio seletor mostra o nome da etapa.
15. Como Integrante do EP, quero o seletor de Status sem o rótulo "Status", porque os valores (A fazer, Iniciado, Finalizado) já dizem o que é.
16. Como pessoa que usa leitor de tela, quero que os dois seletores continuem anunciados como "Etapa" e "Status", para saber o que estou mudando.
17. Como Integrante do EP, quero um único jeito de pôr alguém como responsável, a seleção, para não ter que escolher entre dois botões que fazem o mesmo.
18. Como Integrante do EP, quero me ver em primeiro lugar na seleção de responsável, como "Você", para me pôr como responsável em um clique.
19. Como Integrante do EP, quero que não haja [Assumir] em nenhum lugar do verso, para que a tela não tenha dois caminhos para a mesma coisa.
20. Como Consulta, quero continuar vendo o responsável sem poder trocá-lo.
21. Como Integrante do EP, quero que pôr a mim mesmo como responsável continue avisando, sem impedir, quando sou o autor da versão na Revisão interna.

### Verso: linha de etapas e Data da modelagem piloto

22. Como Integrante do EP, quero a linha de etapas só com os ícones, sem nenhuma data, para que ela seja um desenho do andamento e nada mais.
23. Como Integrante do EP, quero registrar a Data da modelagem piloto num campo fixo do verso, com esse nome, para saber sempre onde ela fica.
24. Como Integrante do EP, quero ver esse campo da Modelagem piloto em diante, em qualquer etapa depois dela, para corrigir a data mesmo depois de o processo andar.
25. Como Integrante do EP, quero que o campo não apareça em Não iniciados, porque a data só se registra depois de a modelagem piloto acontecer.
26. Como Integrante do EP, quero que o campo continue recusando data no futuro, para que a data diga o que aconteceu.
27. Como Consulta, quero ver a Data da modelagem piloto sem poder alterá-la.

### Verso: versões e relatório

28. Como Integrante do EP, quero o formulário Enviar versão sem o campo .bpmn, porque não usamos mais esse arquivo.
29. Como Integrante do EP, quero que a versão não ofereça mais "+ Acrescentar .bpmn", pelo mesmo motivo.
30. Como Integrante do EP, quero registrar a versão histórica com o .bpm, sem a alternativa do .bpmn com o .png, para que a regra seja uma só.
31. Como Integrante do EP, quero continuar baixando os .bpmn que já foram enviados, porque a versão nunca se apaga.
32. Como Integrante do EP, quero continuar substituindo um .bpmn já enviado, se ele estiver errado.
33. Como Integrante do EP, quero um só caminho para enviar a versão com o relatório nas etapas Relatório e modelagem técnica e Revisão interna, para não ter [Enviar versão] e [Enviar relatório] lado a lado.
34. Como Integrante do EP, quero acrescentar o relatório à versão mais recente pelo "+ Acrescentar relatório", quando a versão foi enviada sem ele.
35. Como Integrante do EP, quero que o botão continue "Enviar versão" nas etapas da versão em sequência, porque ali não se envia versão piloto.
36. Como Integrante do EP, quero que, ao mover o processo para a frente com o relatório faltando, a pergunta me leve a um caminho que existe na tela (o formulário da versão ou o "+ Acrescentar relatório").

### Verso: Anotações e miniatura

37. Como Integrante do EP, quero as Anotações com metade da altura de hoje, para que elas não empurrem o resto do verso para baixo.
38. Como Integrante do EP, quero continuar escrevendo textos longos nas Anotações, com o campo rolando ou crescendo, para não perder espaço de escrita.
39. Como Integrante do EP, quero a miniatura do fluxograma bem maior, até o dobro, para reconhecer o desenho sem abrir o arquivo.
40. Como Integrante do EP, quero que o verso se reorganize em volta da miniatura maior, sem rolagem a mais em 1366×768, para ver o essencial de uma vez.
41. Como Integrante do EP, quero ver a prévia da nova arrumação antes de ela ir para o app, para aprovar ou corrigir o desenho.

### Lista

42. Como Integrante do EP, quero que a Lista agrupada por Macroprocesso não tenha as colunas Macroprocesso e Setor, porque a árvore já mostra os dois.
43. Como Integrante do EP, quero o mesmo na Lista agrupada por Setor.
44. Como Integrante do EP, quero que a Lista sem agrupamento continue com as colunas Macroprocesso e Setor, porque ali não há árvore.
45. Como Integrante do EP, quero o atraso junto da Etapa atual, só com o relógio e o número, para ler de relance há quanto tempo o processo está na etapa.
46. Como Integrante do EP, quero o nome do processo sem o selo de dias ao lado, para ler o nome limpo.
47. Como pessoa que usa leitor de tela, quero que o relógio com o número seja anunciado como "8 dias nesta etapa".
48. Como Integrante do EP, quero ver o texto completo como dica ao passar o mouse sobre o relógio.
49. Como Integrante do EP, quero que filtro e ordenação das colunas que ficam continuem funcionando como antes.

## Decisões de implementação

- **Selo do setor:** só o preenchimento de `SeloDoSetor` diminui; o tamanho da letra fica. Nenhum componente novo.
- **Cartão parado:** sai a regra de estilo da borda do cartão parado; a classe pode ficar, se outro estilo depender dela, ou sair, se não houver. O selo de dias do cartão (`selosDoCartao`) não muda.
- **Colunas:** a faixa é o fundo do contêiner da coluna (título e área dos cartões dentro), com um token novo de cor de faixa na identidade, e o título usa o mesmo recuo lateral dos cartões. A pílula da sigla no título do Quadro por setor sai; a quantidade vira texto. A correção da rolagem de 2026-11-04 (`position: relative` na coluna e no quadro) fica.
- **Agora:** os rótulos "Etapa" e "Status" saem da tela e passam para `aria-label` dos seletores. Sai o [Assumir] do `CorpoDoAgora` e dos outros lugares que o mostram; a seleção de responsável põe quem está na tela no topo, como "Você". O aviso do revisor (Revisão interna) continua valendo quando a pessoa escolhe a si mesma.
- **Data da modelagem piloto:** o componente atual (`DataDaModelagemPiloto`) é reaproveitado num lugar fixo do verso, com o rótulo "Data da modelagem piloto" no lugar de "Realizada em", e sai da linha de etapas e do Agora. Aparece quando a etapa atual é a Modelagem piloto ou uma etapa depois dela no catálogo; a regra de quando aparecer já existe para a linha de etapas e é reaproveitada.
- **.bpmn:** sai dos papéis que se pode acrescentar (`papeisQueSePodeAcrescentar` passa a devolver só o .png), do formulário Enviar versão e do formulário da versão histórica, cuja validação passa a exigir o .bpm. A exibição e o download do .bpmn já enviado, e o "Substituir" dele, ficam. A função do Drive e o banco continuam aceitando .bpmn (ADR 0042): a regra fica só na tela.
- **Relatório:** sai o [Enviar relatório] da `SecaoDeVersoes`; o `FormularioDeRelatorio` continua só se for ele que serve o "+ Acrescentar relatório" (senão sai). A confirmação de arquivos que hoje abre o formulário de relatório passa a abrir o "+ Acrescentar relatório" da versão mais recente quando ela existe, e o formulário Enviar versão quando falta a versão em sequência.
- **Anotações:** a altura mínima do campo cai à metade (de 21 para 10,5 linhas); o comportamento de guardar sozinho não muda.
- **Miniatura e verso:** o tamanho da miniatura em `VersaoEmDestaque` sobe até o dobro; a nova disposição dos blocos do verso sai da prévia aprovada (`.scratch/enxugar-quadro-e-verso/previa-*.html`), que vira a referência visual da execução.
- **Lista:** as colunas Macroprocesso e Setor saem quando o agrupamento é Macroprocesso ou Setor. O selo de parado (`SeloDeParado`) sai do lado do nome e entra na célula da Etapa atual em forma compacta: ícone de relógio e número, com o texto completo em `aria-label` e `title`. O filtro e a ordenação das colunas que ficam não mudam.
- **Registros de apoio:** acréscimo datado em `.scratch/identidade-visual.md` (selo menor, faixa das colunas, cartão parado sem borda, miniatura maior).

## Modelo de dados

Não muda. Nenhuma tabela, coluna, política, função ou gatilho é criado ou alterado. O banco e a função `arquivos-no-drive` continuam aceitando .bpmn e versão histórica sem .bpm; a tela deixa de oferecer o primeiro e passa a exigir o .bpm na segunda (ADR 0042). Os .bpmn já gravados ficam como estão.

## Estados de tela

Nenhuma tela passa a buscar dado novo. O que já existe continua: carregando, vazio e erro do Quadro, do verso e da Lista seguem como estão, incluindo a falha de conexão. O campo da Data da modelagem piloto mostra o erro de gravação como hoje (com o valor recebido e o formato esperado). A miniatura que não carrega continua caindo no ícone do fluxograma com o aviso.

## Decisões de teste

- Ponto de teste: a tela inteira, nos testes de tela do `App` com as implementações falsas dos módulos, como a pessoa usa; um comportamento por teste.
- Prior art: `App.agoraDoVerso.test.tsx` (rótulos, Assumir, dias), `App.etapasDoVerso.test.tsx` (linha de etapas), `App.enviarVersao.test.tsx` e `App.registrarVersaoHistorica.test.tsx` (campos e validação), `App.acrescentarArquivo.test.tsx` (acrescentar .png/.bpmn), `App.relatorioDepois.test.tsx` e `App.enviarArquivosAgora.test.tsx` (relatório e confirmação de arquivos), `App.cartaoDoQuadro.test.tsx` (selos do cartão), `App.lista.test.tsx` (selo de parado e colunas), `Quadro.css.test.ts` (regras de CSS lidas do arquivo).
- Testes que mudam: os de [Assumir] passam a provar que ele não existe e que "Você" vem primeiro na seleção; os de [Enviar relatório] passam a provar que ele não existe nas duas etapas; os do .bpmn passam a provar que não há campo nem "Acrescentar .bpmn", e que o .bpmn já enviado continua com link e "Substituir"; a versão histórica passa a recusar o envio sem .bpm; a Data da modelagem piloto passa a ser procurada no campo fixo, e a linha de etapas a não ter nenhuma data; a confirmação de arquivos passa a abrir o caminho do relatório que existe.
- Testes novos: a Lista agrupada sem as colunas Macroprocesso e Setor, e a sem agrupamento com elas; o relógio com o número junto da Etapa atual, com o texto completo acessível; os seletores do Agora com nome acessível "Etapa" e "Status" e sem rótulo visível; o cartão parado sem a regra da borda vermelha (lida do CSS, como em `Quadro.css.test.ts`).
- Medidas e cores (tamanho do selo, faixa, miniatura, altura das Anotações) não se medem no jsdom e ficam nos critérios `[visual]`.
- Os testes de banco não mudam (nenhuma migração).

## Critérios de pronto

1. Nenhum [Assumir] no verso; a seleção de responsável mostra "Você" em primeiro lugar e, escolhido, põe quem está na tela como responsável, com o aviso do revisor na Revisão interna quando cabe.
2. Os seletores de etapa e de Status do Agora não têm rótulo visível e são anunciados como "Etapa" e "Status".
3. Nenhum campo ou botão de envio de .bpmn (Enviar versão, Enviar versão piloto, "+ Acrescentar" e versão histórica); o .bpmn já enviado aparece com link para baixar e "Substituir".
4. A versão histórica não se registra sem o .bpm.
5. (Não aplicável, ADR 0043.) Nenhum [Enviar relatório] nas etapas Relatório e modelagem técnica e Revisão interna; o botão diz "Enviar versão" nelas e "Enviar versão piloto" na Modelagem piloto; o "+ Acrescentar relatório" continua.
6. (Não aplicável, ADR 0043: a confirmação continua abrindo o formulário de relatório, que existe.) A confirmação de arquivos com relatório faltando leva a um caminho de envio que existe na tela.
7. A linha de etapas não mostra nenhuma data, nem "Realizada em".
8. O campo "Data da modelagem piloto" aparece da Modelagem piloto em diante, não aparece em Não iniciados, registra e altera a data com as regras de hoje e é só leitura para a Consulta.
9. A Lista agrupada por Macroprocesso ou por Setor não tem as colunas Macroprocesso e Setor; a Lista sem agrupamento tem.
10. Na Lista, o atraso aparece na célula da Etapa atual como relógio e número, anunciado e com dica "x dias nesta etapa", e não aparece mais junto do nome.
11. O cartão parado não tem a borda vermelha; o selo "x dias nesta etapa" continua.
12. `npm test`, typecheck e lint passam.
13. `[visual]` Selo do setor menor, com a letra do mesmo tamanho, no cartão, na Lista, no verso, nos cadastros e nos cabeçalhos.
14. `[visual]` Cada coluna do Quadro (por etapa, por responsável, por setor e nas Linhas) numa faixa de tom neutro do título ao fim, com o título dentro e alinhado à margem dos cartões; títulos sem pílula, com a quantidade em número discreto; o ícone da etapa continua no Quadro por etapa.
15. `[visual]` Cartão parado com a borda comum.
16. `[visual]` Anotações com 14 linhas de altura mínima (antes 21), na coluna da direita.
17. `[visual]` Miniatura do fluxograma no dobro e verso em duas colunas como aprovado, com as Anotações sempre à vista em 1366×768.
18. `[visual]` A prévia do Quadro com faixas e do verso rearrumado foi aprovada pelo usuário antes do código.
19. `[visual]` Na Lista, o relógio com o número fica junto da Etapa atual e o nome do processo fica limpo.

## Fora do escopo

- Qualquer migração: recusar .bpmn ou exigir .bpm na versão histórica no banco ou na função do Drive (ADR 0042).
- Apagar os .bpmn já enviados.
- Mudar o selo "x dias nesta etapa" do cartão ou do Agora (o usuário desistiu da tag vermelha).
- Tirar o selo do setor do cartão no Quadro por setor (decidido manter).
- Tirar os ícones da linha de etapas (ADR 0041 fica).
- Renomear a Data da modelagem piloto ("Data da reunião de modelagem" foi recusado na sabatina: o glossário evita "reunião").
- O vazamento de `.visualmente-oculto` em outras áreas que rolam e os testes instáveis já registrados no backlog.

Implementado em 2026-11-04 (commit f13e03b), exceto o item 7 (sem [Enviar relatório]), mantido por decisão do usuário (ver `desvios.md`: o "+ Acrescentar relatório" que a spec supõe não existe mais). Mudanças em relação ao texto acima, a pedido do usuário: o verso ficou em duas colunas (Anotações numa coluna à direita em fundo mais escuro; janela de 1000 px; campo de 14 linhas) no lugar das arrumações A/B do item 11.
Entregue em 2026-11-04 (commit 373c07e), com ressalva: critérios [visual] presumidos no app real (vistos só numa vitrine local com módulos falsos e dados inventados, sem o login real: selo menor, faixas nas Linhas e nos quadros por setor e por responsável, cartão parado sem borda, miniatura com .png de verdade, verso em duas colunas, atraso na Lista); item 7 da enxugar-quadro-e-verso não feito por decisão do usuário (ADR 0043); revisão de segurança dispensada (só telas e estilos, sem login, dado de fora ou banco)
