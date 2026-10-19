# Processos e etapas

Status: ready-for-agent

**Como resolve o problema.** Hoje o andamento de cada processo fica espalhado entre planilhas e o Power BI, sem saber com certeza em que etapa cada um está, quem cuida dele nem o que mudou. Com esta funcionalidade, a equipe do EP cadastra na plataforma cada processo e subprocesso, ligado ao setor dono e a um macroprocesso, e registra o andamento etapa por etapa, da Modelagem piloto em diante, num caminho que o administrador configura no catálogo de etapas. A área Processos mostra o trabalho vivo num Quadro, com uma coluna por etapa, e o arquivo completo numa Lista com busca pelo nome e filtros; ao abrir um processo, o **verso do cartão**, uma janela central em duas colunas, mostra primeiro o que há para fazer agora (a etapa atual, quem cuida dela e um único botão principal), depois o caminho de etapas e os arquivos, e ao lado o contexto do processo; o que é raro (histórico, editar, reclassificar, suspender, cancelar, excluir) fica num menu. O banco impõe a sequência das etapas, a situação do processo, as regras de reclassificação e o registro de cada mudança no histórico. As funcionalidades seguintes (reuniões, documentos, revisões, prazos e painel) se apoiam nesse andamento.

Decisões de origem: `.scratch/processos-etapas/sabatina.md` (sabatina de 2026-10-13, três rodadas), `CONTEXT.md` (seções "Setores" e "Processos") e ADR 0004 (mudar o catálogo muda o caminho dos processos em andamento). Mudança de 2026-10-18 (parte 1 da iniciativa experiencia-do-quadro, `.scratch/experiencia-do-quadro/sabatina-parte-1.md`, ADR 0013): saem as etapas do setor, a coluna "Aguardando o setor", os responsáveis do setor e o nível do catálogo; a primeira etapa passa a se chamar Modelagem piloto; o processo ganha a data da reunião (spec de `reunioes`). Mudança de 2026-10-18 (parte 2, `.scratch/experiencia-do-quadro/sabatina-parte-2.md`, ADR 0014): resolver a etapa atual (concluir, dispensar ou registrar como realizada anteriormente) já **avança**, ou seja, inicia a próxima etapa pendente com o responsável escolhido na mesma janela; voltar também escolhe o responsável; [Assumir] em etapa sem responsável; quem enviou a versão mais recente não pode ser escolhido como responsável da Revisão interna. Mudança de 2026-10-19 (parte 3, "Verso do cartão", `.scratch/experiencia-do-quadro/sabatina-parte-3.md`, sem ADR nem mudança no banco): o painel lateral vira o verso do cartão, uma janela central em duas colunas com o cartão "Agora"; o Novo processo, o Editar e o Histórico abrem dentro dela; a Lista ganha busca pelo nome.

## Problema

O EP acompanha dezenas de processos de vários setores, cada um numa etapa diferente do mapeamento, mas não tem um lugar único que diga em que etapa cada processo está, quem é o responsável por ela, desde quando, e o que foi dispensado ou feito antes da plataforma existir. Processos viram subprocessos (e o contrário) no meio do caminho, e essa mudança não deixa rastro. Sem esse andamento registrado, não há como montar o painel nem os prazos, e não há como provar o que aconteceu com cada processo.

## Solução

- **Área Processos** (item "Quadro" e "Lista" da faixa lateral, alternância Quadro | Lista na barra superior):
  - o **Quadro** mostra os processos em andamento e os suspensos, cada um na coluna da etapa atual; o processo novo entra na coluna Modelagem piloto;
  - a **Lista** mostra todos os processos, de qualquer situação, numa tabela com busca pelo nome e filtros; é o lugar dos concluídos;
  - nos dois, [Cadastrar processo] para Administrador e Integrante, e clicar num cartão ou numa linha abre o **verso do cartão** (desde 2026-10-19).
- **Verso do cartão** (desde 2026-10-19, no lugar do painel lateral): janela central larga, com o Quadro ou a Lista escurecidos atrás. À esquerda, o trabalho: o cartão **Agora** (etapa atual, responsável ou [Assumir], dias na etapa e um único botão principal), as **Etapas** em linhas compactas (clicar abre o detalhe da etapa ali mesmo) e os **Arquivos** (a versão mais recente em destaque, com o que falta). À direita, o contexto: a data da **Reunião** de modelagem piloto (spec de `reunioes`), **Sobre** (setor, macroprocesso, tipo, origem, contexto, observações) e a **Estrutura** (subprocessos ou o processo pai). O menu "⋯" do cabeçalho traz Histórico, Editar, Reclassificar, Suspender ou Retomar, Cancelar e Excluir. Novo processo, Editar e Histórico abrem dentro da mesma janela.
- **Avanço das etapas (desde 2026-10-18):** concluir, dispensar ou registrar como realizada anteriormente a etapa atual abre uma janela que pergunta "Quem fica com a próxima etapa?" e, ao confirmar, a próxima etapa pendente já entra em andamento com essa pessoa (ou sem ninguém, à espera de alguém assumir). Na etapa sem responsável, [Assumir] põe a própria pessoa como responsável com um clique.
- **Tela do setor** (área Setores, que já existe): ganha a lista dos processos do setor; clicar num deles leva à Lista filtrada pelo setor, com o verso aberto.
- **Catálogo de etapas** (área Administração, só para o administrador): a lista ordenada das etapas, com obrigatória ou opcional, e ativa.

A Consulta vê tudo sem nenhum botão de alteração. O banco impõe as regras: quem não pode alterar é recusado mesmo que tente fora da tela, e toda mudança vira evento no histórico.

## Histórias de usuário

### Cadastro de processos

1. Como integrante do EP, quero cadastrar um processo com nome, setor, macroprocesso, tipo, origem, contexto e observações, para começar a acompanhar o seu mapeamento.
2. Como integrante do EP, quero que nome, setor e macroprocesso sejam obrigatórios, e contexto e observações opcionais.
3. Como integrante do EP, quero que o tipo venha marcado como "A classificar" e a origem como "Novo", para cadastrar rápido na identificação e decidir depois.
4. Como integrante do EP, quero escolher só setores e macroprocessos ativos ao cadastrar, para não ligar processo a cadastro extinto.
5. Como integrante do EP, quero que, se o setor escolhido ainda não for setor envolvido no macroprocesso, a tela me avise que ele será incluído e o banco o inclua ao salvar, com registro no histórico, para não precisar sair do cadastro do processo.
6. Como integrante do EP, quero que a plataforma recuse um nome de processo que já existe no mesmo setor, sem diferenciar maiúsculas e minúsculas, porque o nome entra no nome dos arquivos.
7. Como integrante do EP, quero poder usar o mesmo nome de processo em setores diferentes.
8. Como integrante do EP, quero cadastrar um subprocesso já indicando o processo pai, para registrar a estrutura de uma vez.
9. Como integrante do EP, quero que o subprocesso siga o macroprocesso do pai, sem poder escolher outro, para a estrutura ficar coerente.
10. Como integrante do EP, quero que o subprocesso possa ter um setor diferente do pai, e que esse setor seja incluído como setor envolvido no macroprocesso do pai se faltar.
11. Como integrante do EP, quero escolher como pai só processos do tipo "Processo", para não haver subprocesso de subprocesso nem pai "a classificar".
12. Como integrante do EP, quero editar nome, setor, macroprocesso, origem, contexto e observações de um processo a qualquer momento.
13. Como integrante do EP, quero mover um processo para outro macroprocesso na edição, com o setor incluído como envolvido no novo se faltar, e os subprocessos acompanhando o pai automaticamente.
14. Como integrante do EP, quero que o histórico guarde o "de → para" de cada campo editado, inclusive o macroprocesso.
15. Como integrante do EP, quero excluir um processo cadastrado por engano, depois de confirmar numa janela, e que o histórico guarde tudo o que ele tinha, inclusive as etapas.
16. Como integrante do EP, quero que o banco recuse excluir um processo que tem subprocessos e diga quantos são, para que nenhum subprocesso suma de carona.
17. Como integrante do EP, quero ver uma mensagem clara e os meus dados mantidos no formulário quando uma gravação falhar, para tentar de novo sem redigitar.

### Quadro e Lista

18. Como integrante do EP, quero ver no Quadro uma coluna por etapa, na ordem do catálogo, com os processos em andamento e suspensos na coluna da etapa atual, para enxergar o trabalho vivo.
19. Como integrante do EP, quero que o processo recém-cadastrado apareça direto na coluna Modelagem piloto, sem coluna de espera antes dela.
20. Como integrante do EP, quero que o cartão mostre o nome do processo, a sigla do setor, o macroprocesso, o tipo (quando for subprocesso ou "a classificar") e o responsável da etapa atual.
21. Como integrante do EP, quero ver os processos suspensos no Quadro com a pílula "Suspenso", para não esquecer o trabalho parado.
22. Como integrante do EP, quero que concluídos e cancelados saiam do Quadro e continuem na Lista.
23. Como integrante do EP, quero que o Quadro role para o lado quando houver mais colunas que a tela, com uma indicação de que há colunas fora da vista.
24. Como integrante do EP, quero ver na Lista todos os processos, com nome, tipo, setor, macroprocesso, etapa atual, responsável da etapa atual e situação.
25. Como integrante do EP, quero filtrar o Quadro e a Lista por setor, macroprocesso, etapa, tipo e responsável, e a Lista também por situação, para achar o que procuro.
26. Como integrante do EP, quero que os filtros fiquem no endereço da página, para recarregar ou compartilhar a mesma visão.
27. Como integrante do EP, quero ver na Lista, ao lado do subprocesso, o nome do processo pai.
28. Como integrante do EP, quero abrir o verso de um processo clicando no cartão ou na linha, com o quadro ou a lista escurecidos atrás (painel lateral até 2026-10-19).

### Andamento das etapas do processo

29. Como integrante do EP, quero ver no painel o caminho de etapas do processo, da Modelagem piloto em diante, cada uma com status, responsável, datas e nota.
30. Como integrante do EP, quero iniciar a etapa atual quando ela está pendente (a Modelagem piloto de um processo novo, ou depois de uma mudança no catálogo), com um clique e sem janela, para registrar que o trabalho nela começou. As demais etapas se iniciam sozinhas pelo avanço (histórias 89 em diante).
31. Como integrante do EP, quero que a plataforma recuse iniciar uma etapa enquanto a anterior não estiver resolvida (concluída, realizada anteriormente ou dispensada), explicando qual falta.
32. Como integrante do EP, quero iniciar a Modelagem piloto de um processo recém-cadastrado sem depender de nada do setor, porque identificação e sensibilização já foram feitas fora da plataforma.
33. Como integrante do EP, quero que cada processo tenha no máximo uma etapa em andamento.
34. Como integrante do EP, quero concluir a etapa em andamento e, na mesma janela, escolher quem fica com a próxima, que já se inicia (histórias 89 em diante).
35. Como integrante do EP, quero dispensar uma etapa opcional, com nota obrigatória, para registrar por que ela não será feita, e que a próxima já se inicie como no concluir.
36. Como integrante do EP, quero que a plataforma recuse dispensar uma etapa obrigatória.
37. Como integrante do EP, quero registrar qualquer etapa como "realizada anteriormente", com nota obrigatória, para os processos retomados que já fizeram parte do caminho fora da plataforma, e que a próxima já se inicie como no concluir.
38. Como integrante do EP, quero que a data de início e a de conclusão venham preenchidas com hoje e que eu possa corrigi-las na hora ou depois, para registrar quando o trabalho de fato aconteceu.
39. Como integrante do EP, quero que a plataforma recuse uma data no futuro e uma conclusão antes do início, mostrando a data recebida.
40. Como integrante do EP, quero voltar a uma etapa anterior, com motivo obrigatório: ela volta a "em andamento" e as seguintes já resolvidas voltam a "pendente", para refazer o trabalho quando algo mudou. Na mesma janela do motivo, quero escolher quem fica com a etapa reaberta, com o responsável atual dela já marcado.
41. Como integrante do EP, quero que o histórico guarde como cada etapa estava antes de voltar.
42. Como integrante do EP, quero escolher o responsável de qualquer etapa do processo entre os usuários ativos de perfil Administrador ou Integrante, e trocá-lo a qualquer momento.
43. Como integrante do EP, quero ver o responsável que foi desativado depois marcado como "Inativo" na etapa, sem poder escolhê-lo de novo.
44. Como integrante do EP, quero ver a etapa atual destacada no caminho, as resolvidas com ✓ e as futuras apagadas, como na identidade visual.

### Avanço e responsável (parte 2, 2026-10-18)

89. Como integrante do EP, quero que [Concluir] abra a janela "Quem fica com a próxima etapa?", com o título dizendo qual etapa se conclui e qual vem a seguir, para passar o trabalho adiante num gesto só.
90. Como integrante do EP, quero ver na janela os usuários ativos de perfil Administrador ou Integrante, cada um com o nome, e a opção "Ninguém por enquanto", para escolher quem segue ou deixar a etapa à espera.
91. Como integrante do EP, quero que a janela venha com o responsável que a próxima etapa já tem marcado e, se ela não tiver nenhum (ou ele não puder ser escolhido), comigo marcado, para confirmar com Enter no caso comum.
92. Como integrante do EP, quero que, ao confirmar, a etapa atual fique concluída e a próxima entre em andamento com a pessoa escolhida, com início hoje, tudo de uma vez, para o processo nunca ficar sem etapa em andamento por uma falha no meio.
93. Como integrante do EP, quero que, com "Ninguém por enquanto", a próxima etapa também entre em andamento, sem responsável, para alguém assumi-la depois.
94. Como integrante do EP, quero que "a próxima etapa" seja a primeira pendente depois da que resolvi, pulando as já resolvidas, para o avanço não reabrir o que já foi feito.
95. Como integrante do EP, quero que a próxima etapa opcional (Publicação) se inicie como qualquer outra, e que eu a dispense depois se ela não for feita.
96. Como integrante do EP, quero que, sem nenhuma etapa pendente depois da que resolvo, não haja janela de responsável, e que o processo fique concluído se todas as obrigatórias estiverem resolvidas.
97. Como integrante do EP, quero que as janelas de Dispensar e de Realizada anteriormente tragam, abaixo da nota, a mesma escolha de quem fica com a próxima etapa, para resolver e avançar num passo só.
98. Como integrante do EP, quero que Esc ou [Cancelar] feche a janela sem gravar nada: a etapa continua como estava.
99. Como integrante do EP, quero usar a janela só pelo teclado e com leitor de tela: o foco abre na opção marcada, as setas trocam de opção, Enter confirma e cada opção é lida com o nome da pessoa.
100. Como integrante do EP, quero ver no histórico dois registros do avanço, com o mesmo autor e a mesma hora: "Concluiu a etapa" (ou "Dispensou a etapa", ou "Registrou a etapa como realizada anteriormente") e "Iniciou a etapa", com o responsável, para saber quem passou o trabalho e para quem.
101. Como integrante do EP, quero [Assumir] numa etapa pendente ou em andamento que está sem responsável, para me pôr como responsável com um clique.
102. Como integrante do EP, quero continuar escolhendo e trocando o responsável de qualquer etapa pelo seletor, para qualquer integrante, como na história 42.
103. Como integrante do EP, quero que a plataforma não me deixe escolher como responsável da Revisão interna quem enviou a versão mais recente do processo (fora as versões históricas): a janela não mostra essa pessoa, o [Assumir] não aparece para ela, e o banco recusa a escolha pelo seletor ou fora da tela, porque ninguém revisa o próprio trabalho.
104. Como integrante do EP, quero que essa trava confira só o momento da escolha, para o revisor que corrige e envia uma versão nova continuar responsável pela Revisão interna.
105. Como integrante do EP, quero que, sem versão não histórica no processo, ninguém seja barrado da Revisão interna.
106. Como integrante do EP, quero que, quando quem conclui é o autor da versão mais recente e a próxima é a Revisão interna, a janela já venha com "Ninguém por enquanto" marcado (ou o responsável que a etapa já tem, se ele puder).
107. Como Consulta, quero ver quem é o responsável de cada etapa, sem [Assumir] nem a janela de avanço.

### Verso do cartão (parte 3, 2026-10-19)

108. Como integrante do EP, quero que o processo abra numa janela central larga, em duas colunas, para ver o processo inteiro de uma vez, sem rolar um painel estreito.
109. Como integrante do EP, quero que o endereço da página continue apontando para o processo aberto, para recarregar ou mandar o link a um colega e cair no mesmo processo.
110. Como integrante do EP, quero ver no cabeçalho a sigla do setor, o nome do processo, o macroprocesso (com o quadradinho da cor dele) e o tipo, para saber de relance de que processo se trata.
111. Como integrante do EP, quero que a situação apareça no cabeçalho só quando foge do normal (Suspenso, Cancelado, Concluído), para que a pílula chame a atenção quando importa.
112. Como integrante do EP, quero que o cartão "Agora", no alto da coluna esquerda, mostre a etapa atual, a posição dela no caminho ("etapa 2 de 6"), quem cuida dela e há quantos dias ela está em andamento, para saber o que há a fazer sem procurar.
113. Como integrante do EP, quero um único botão principal no Agora, com o nome da ação ([Iniciar Modelagem piloto], [Concluir Revisão interna]), para não ter dúvida sobre o próximo passo.
114. Como integrante do EP, quero Dispensar (só na etapa opcional) e Realizada anteriormente num "⋯" do Agora, para que as ações raras não disputem atenção com o botão principal.
115. Como integrante do EP, quero que o Concluir, o Dispensar e o Realizada anteriormente do Agora abram a mesma janela "Quem fica com a próxima etapa?" da parte 2.
116. Como integrante do EP, quero que, passados 15 dias na mesma etapa, o número de dias vire a pílula âmbar "{n} dias nesta etapa", com o mesmo texto do selo do cartão da parte 4, para notar o processo que está demorando.
117. Como integrante do EP, quero, na etapa atual sem responsável, o botão [Assumir] ao lado do principal, para me pôr como responsável com um clique.
118. Como integrante do EP, quero trocar o responsável da etapa atual pelo "Trocar" do Agora, numa lista suspensa em que eu apareço primeiro, com "(você)", e "Ninguém por enquanto" fica no fim, gravando ao escolher, sem confirmação.
119. Como integrante do EP, quero que o Agora de um processo suspenso ou cancelado mostre o motivo e [Retomar] como botão principal, para destravá-lo dali mesmo.
120. Como integrante do EP, quero que o Agora de um processo concluído diga "Concluído em {data}", para saber quando ele terminou.
121. Como integrante do EP, quero ver as etapas em linhas compactas, com um sinal para cada status (concluída, atual, pendente, opcional, dispensada, realizada anteriormente), a data e as iniciais de quem a resolveu, para ler o caminho de relance.
122. Como integrante do EP, quero clicar numa etapa e ver o detalhe dela abrir ali mesmo, embaixo da linha, com datas, nota, [Corrigir datas] e [Voltar a esta etapa], uma etapa aberta por vez, para não perder de vista em que ponto do caminho estou.
123. Como integrante do EP, quero ver a versão mais recente em destaque ("V2 · 02/10"), com os arquivos para baixar, e o que falta (a pílula "falta relatório" e o espaço tracejado [+ Acrescentar relatório] no lugar do relatório), para saber o que tapar e tapar no mesmo lugar.
124. Como integrante do EP, quero as versões anteriores recolhidas em "Versões anteriores (n)", [Enviar versão] visível e "Registrar versão histórica" num "⋯" da seção, para que o comum fique à mão e o raro não atrapalhe.
125. Como integrante do EP, quero ver e marcar a data da reunião de modelagem piloto na coluna direita, no próprio lugar, com "Alterar data" virando o campo de data.
126. Como integrante do EP, quero ver em "Sobre" o setor, o macroprocesso, o tipo, a origem, o contexto e as observações, com textos longos cortados em 4 linhas e "Ler mais", e sem os campos vazios.
127. Como integrante do EP, quero ver os subprocessos (com a etapa atual de cada um e a situação, quando não é em andamento) ou, num subprocesso, "Faz parte de" com o pai, e abrir qualquer um deles na mesma janela.
128. Como integrante do EP, quero o menu "⋯" do cabeçalho com Histórico, Editar e Reclassificar; Suspender (ou Retomar) e Cancelar; e Excluir em vermelho, separado no fim, para que o destrutivo fique longe do resto.
129. Como integrante do EP, quero que o Histórico abra dentro da janela, com "← Voltar ao processo", agrupado por dia ("Hoje", "Ontem", "12/10"), do mais novo para o mais antigo.
130. Como integrante do EP, quero que o Editar e o Novo processo abram dentro da mesma janela, numa coluna estreita, com os botões num rodapé fixo, e que Salvar ou Cancelar volte ao verso.
131. Como integrante do EP, quero que, depois de cadastrar um processo, a janela mostre o verso dele com o aviso "Processo cadastrado", porque o passo seguinte é quase sempre iniciar a Modelagem piloto ou marcar a reunião.
132. Como integrante do EP, quero que a janela abra já no tamanho final, com blocos cinza no formato das colunas enquanto carrega, para nada pular de lugar quando os dados chegam.
133. Como integrante do EP, quero ver, quando o processo não carrega, a mensagem de erro com [Tentar de novo], e, quando ele foi excluído, a mensagem que já existe com [Voltar].
134. Como integrante do EP, quero que, numa tela com menos de 900 px de largura, a janela ocupe a tela toda e vire uma coluna só, com o trabalho em cima e o contexto embaixo.
135. Como integrante do EP que usa o teclado, quero que o foco vá ao nome do processo ao abrir, que o Tab circule só dentro da janela, que Esc feche (no Histórico, o primeiro Esc volta ao processo) e que, ao fechar, o foco volte ao cartão ou à linha de onde vim.
136. Como integrante do EP que usa leitor de tela, quero que a janela seja anunciada como "Processo {nome}".
137. Como Consulta, quero ver o verso inteiro só para ler: o Agora sem botões e com a borda cinza ("Com Ana M. há 6 dias"), baixar arquivos, e no "⋯" só o Histórico.
138. Como integrante do EP, quero buscar na Lista pelo nome do processo, sem me preocupar com maiúsculas, acentos e espaços nas pontas, com o resultado filtrando enquanto digito, o trecho encontrado marcado no nome e um "×" para limpar.
139. Como integrante do EP, quero que a busca fique no endereço da página junto com os filtros, para recarregar ou compartilhar a mesma busca.
140. Como integrante do EP, quero que a busca sem resultado mostre "Nenhum processo com estes filtros." com [Limpar filtros], que limpa também a busca.

### Etapas do setor e responsáveis do setor (retirados em 2026-10-18)

45. Como integrante do EP, quero que a tela do setor e o painel do processo não mostrem mais etapas do setor nem responsáveis do setor, porque esse trabalho já foi feito para todos os setores, fora da plataforma (ADR 0013).
46. Como usuário, quero que os registros antigos de etapas do setor e de responsáveis do setor continuem no histórico, numa linha simples ("Registro de etapa do setor (recurso retirado da plataforma)", "Registro de responsável do setor (recurso retirado da plataforma)"), porque o histórico nunca se apaga.
47. Como usuário, quero que os filtros do Quadro e da Lista não ofereçam mais "Aguardando o setor".

### Situação do processo

53. Como integrante do EP, quero suspender um processo, com motivo obrigatório, para registrar que o trabalho parou.
54. Como integrante do EP, quero cancelar um processo, com motivo obrigatório, para registrar que ele não será mapeado.
55. Como integrante do EP, quero retomar um processo suspenso ou cancelado, com motivo obrigatório.
56. Como integrante do EP, quero que, com o processo suspenso ou cancelado, nenhuma etapa possa ser alterada, e que a tela explique por quê.
57. Como integrante do EP, quero que o processo apareça como "Concluído" sozinho quando todas as etapas obrigatórias estiverem resolvidas, sem ninguém precisar marcar.
58. Como integrante do EP, quero que voltar uma etapa de um processo concluído o tire de concluído.
59. Como integrante do EP, quero ver no painel o motivo da suspensão ou do cancelamento.

### Reclassificação

60. Como integrante do EP, quero transformar um processo em subprocesso, informando o pai e o motivo, para corrigir a estrutura sem perder nada.
61. Como integrante do EP, quero transformar um subprocesso em processo, com motivo.
62. Como integrante do EP, quero definir o tipo de um item "a classificar", com motivo.
63. Como integrante do EP, quero que o item reclassificado continue o mesmo, com as suas etapas e tudo o que já tem.
64. Como integrante do EP, quero que, ao virar subprocesso, o item passe para o macroprocesso do pai e que a tela me avise antes de confirmar quando o macroprocesso mudar.
65. Como integrante do EP, quero que, ao virar subprocesso, o setor do item seja incluído como setor envolvido no macroprocesso do pai se faltar.
66. Como integrante do EP, quero que a plataforma recuse transformar em subprocesso um processo que tem subprocessos, pedindo que eles sejam reclassificados antes.
67. Como integrante do EP, quero que o histórico registre cada reclassificação com quem, quando, de quê para quê e o motivo.

### Catálogo de etapas

68. Como administrador, quero ver o catálogo de etapas em ordem, com nome, obrigatória ou opcional, e situação, sem o campo "Nível".
69. Como administrador, quero que o catálogo tenha as 6 etapas do processo, numeradas de 1 a 6, com a primeira chamada Modelagem piloto, as 1 a 5 obrigatórias e a 6 (Publicação) opcional.
70. Como administrador, quero acrescentar uma etapa, escolhendo a posição, para mudar o caminho do trabalho sem mudar o código.
71. Como administrador, quero que uma etapa nova entre como "pendente" nos processos em andamento e suspensos, e não nos concluídos e cancelados (ADR 0004).
72. Como administrador, quero mudar o nome e a ordem de uma etapa, e marcá-la como obrigatória ou opcional.
73. (Retirada em 2026-10-18: não há mais etapas do setor para vir antes.)
74. Como administrador, quero desativar uma etapa: ela some de onde estava pendente e continua onde já foi usada; e reativá-la, voltando como pendente onde faltar.
75. Como administrador, quero excluir uma etapa que nunca foi usada, depois de confirmar, e que a plataforma recuse excluir uma etapa já usada, sugerindo desativá-la.
76. (Retirada em 2026-10-18: o catálogo não tem mais nível.)
77. Como integrante do EP ou Consulta, quero que o catálogo não apareça para mim na Administração.

### Histórico

78. Como integrante do EP, quero ver no Histórico do processo (aba do painel até 2026-10-19; desde então, pelo menu "⋯" do verso) todas as alterações do processo e das etapas dele, das mais recentes para as mais antigas, com data e hora, quem fez, o que fez, o antes e depois e o motivo quando houver.
79. (Retirada em 2026-10-18: os eventos antigos de etapas e responsáveis do setor aparecem na linha simples da história 46.)
80. Como integrante do EP, quero que um processo excluído continue aparecendo no histórico com o que tinha.
81. Como administrador, quero que as mudanças no catálogo de etapas fiquem no histórico.

### Perfis

82. Como administrador, quero ter as mesmas permissões do Integrante do EP em processos e etapas, e ser o único a mexer no catálogo.
83. Como usuário de perfil Consulta, quero ver o Quadro, a Lista, os painéis e o histórico, sem nenhum botão de alteração.
84. Como responsável pela plataforma, quero que o banco recuse qualquer alteração feita por um usuário de perfil Consulta, mesmo fora da tela.
85. Como responsável pela plataforma, quero que um visitante sem login e um usuário inativo não leiam nada de processos, etapas, catálogo e o histórico deles.

### Efeitos nos cadastros

86. Como integrante do EP, quero que o banco recuse excluir um setor ou macroprocesso com processo ligado e diga quantos processos são.
87. Como integrante do EP, quero que o banco recuse tirar de um macroprocesso um setor que tem processos nele e diga quantos são.
88. Como integrante do EP, quero ver na tela do setor a lista dos processos dele, e abrir o verso de cada um (na Lista filtrada pelo setor, desde 2026-10-19).

## Decisões de implementação

### Interface

- **Terceiro módulo injetado:** um módulo de processos, separado dos de acesso e de cadastros. Operações:
  - listar processos com etapa atual, responsável dela e situação calculada;
  - ler um processo com a data da reunião, o caminho de etapas, os subprocessos ou o pai, e o histórico;
  - criar, editar e excluir processo, e marcar a data da reunião (spec de `reunioes`);
  - iniciar uma etapa;
  - concluir, dispensar e registrar como realizada anteriormente a etapa atual, levando o responsável da próxima (ou nenhum), numa chamada só (desde 2026-10-18);
  - corrigir as datas de uma etapa, mudar o responsável de uma etapa ([Assumir] é mudar para si mesmo) e voltar a uma etapa, levando o responsável da etapa reaberta (desde 2026-10-18);
  - suspender, cancelar, retomar e reclassificar um processo;
  - ler os processos de um setor;
  - listar e manter o catálogo de etapas.

  Saem em 2026-10-18: ler e alterar as etapas do setor, e ler, criar, editar e excluir responsáveis do setor.

  O aplicativo recebe o módulo por injeção; nos testes, uma implementação falsa nomeada. A falha chega como erro cuja mensagem é o motivo em português, como nos outros módulos.
- **Navegação no endereço:**
  - `#/processos` para o Quadro e `#/processos/lista` para a Lista, com os filtros no endereço;
  - `#/processos/<id>` abre o verso do cartão por cima da visão de onde veio, e `#/processos/novo` o Novo processo na mesma janela (desde 2026-10-19; antes, o painel lateral);
  - a busca da Lista fica no endereço como os filtros (parâmetro `busca`, desde 2026-10-19);
  - Histórico e Editar são estados da janela aberta, sem endereço próprio: recarregar a página volta ao verso;
  - o catálogo fica numa aba da Administração.
- **Quadro:**
  - **Colunas:** uma por etapa ativa, na ordem do catálogo. A coluna de uma etapa desativada aparece enquanto houver processo nela. A coluna "Aguardando o setor" saiu em 2026-10-18.
  - **Cartões:** os processos de situação guardada "em andamento" ou "suspenso" que não estão concluídos. O cartão traz:
    - o quadradinho da sigla;
    - o nome;
    - o macroprocesso;
    - a pílula de tipo (só "Subprocesso" e "A classificar");
    - a pílula "Suspenso";
    - o avatar do responsável da etapa atual.
  - **Ordem na coluna:** pelo nome do processo.
  - **Largura** (decidido pelo usuário em 2026-10-14): o Quadro ocupa toda a largura à direita da faixa lateral, sem largura máxima (diferente dos 1280px de Cadastros e Administração); cada coluna tem largura fixa de 310px (token `--largura-coluna-quadro`, escala da interface de 2026-10-14; antes cerca de 272px), e o que não cabe na tela fica na rolagem lateral.
- **Lista:**
  - **Colunas:** nome (com "↳ pai" no subprocesso), tipo, setor, macroprocesso, etapa atual, responsável e situação em pílula.
  - **Ordem:** pela sigla do setor e pelo nome.
  - **Filtros:** setor, macroprocesso, etapa atual (só as etapas do catálogo, sem "Aguardando o setor"), tipo, responsável e situação (todas as situações). O Quadro usa os mesmos filtros, menos situação. Um endereço antigo com o filtro "Aguardando o setor" é tratado como sem filtro de etapa.
  - **Busca** (desde 2026-10-19, só na Lista; o Quadro fica sem busca):
    - campo no começo da barra, antes dos filtros, com lupa, o texto de exemplo "Buscar pelo nome" e um "×" para limpar;
    - procura só no nome do processo, como trecho, sem diferenciar maiúsculas, minúsculas e acentos;
    - filtra enquanto se digita e soma-se aos filtros;
    - o trecho encontrado aparece marcado em amarelo claro no nome;
    - sem resultado, vale o estado "Nenhum processo com estes filtros." com [Limpar filtros], que limpa também a busca.
- **Formulário do processo** (cadastrar e editar, dentro da janela do verso desde 2026-10-19; ver "Novo processo e Editar"):
  - **Campos:** nome, setor (ativos), macroprocesso (ativos), tipo (só no cadastro: Processo, Subprocesso ou A classificar), processo pai (só para Subprocesso, entre os processos do tipo Processo), origem (Novo ou Retomado), contexto e observações.
  - **Subprocesso:** o macroprocesso aparece fixo, o do pai.
  - **Setor fora do macroprocesso:** quando o setor não é envolvido no macroprocesso, o aviso amarelo "O setor {SIGLA} ainda não está no macroprocesso {nome}; ele será incluído ao salvar." aparece abaixo dos campos.
  - **Tipo na edição:** a edição não muda o tipo; a mudança de tipo é só por Reclassificar.
- **Verso do cartão** (desde 2026-10-19, no lugar do painel lateral de 520 px com as abas Detalhes e Histórico). Princípios de desenho: uma só coisa acesa (o Agora, com a linha azul de 2 px e o único botão principal da janela); o normal fica quieto, e só o que foge do normal ganha cor; trabalho à esquerda, contexto à direita.
  - **Janela:**
    - central, até cerca de 880 px de largura, com 60% para a coluna esquerda (fundo `folha`) e 40% para a direita (fundo levemente cinza, separada por uma linha fina);
    - até 90% da altura da tela; uma só rolagem, da janela inteira, com o cabeçalho fixo no topo;
    - o Quadro ou a Lista atrás ficam escurecidos e inertes;
    - entra com um aparecimento suave de cerca de 150 ms, desligado quando o computador pede menos movimento;
    - abaixo de 900 px de largura, ocupa a tela toda e vira uma coluna só (esquerda em cima, direita embaixo);
    - pai e subprocessos abrem na mesma janela, trocando o conteúdo e o endereço; Esc fecha tudo.
  - **Cabeçalho:** quadradinho da sigla (mono); o nome do processo (19 px, 700); embaixo, em texto secundário, o quadradinho da cor do macroprocesso, o nome dele e o tipo ("Processo", "Subprocesso" ou "A classificar"); a pílula de situação só para Suspenso (âmbar), Cancelado (cinza) e Concluído (verde), sem pílula em andamento; o botão "⋯" do processo e o botão fechar.
  - **Menu "⋯" do processo,** em três grupos separados por linha fina:
    - Histórico · Editar · Reclassificar;
    - Suspender (ou Retomar, no suspenso e no cancelado) · Cancelar;
    - Excluir, em vermelho.

    A Consulta vê só Histórico. As janelas de motivo, de reclassificação e a confirmação de excluir são as que já existem.
  - **Coluna esquerda — Agora** (cartão branco com a borda de 2 px em `azul`):
    - rótulo "Agora · etapa {n} de {total}", o nome da etapa atual e a linha do responsável: avatar e nome, "há {n} dias" (o início da etapa até hoje) e o link "Trocar";
    - **dias na etapa:** número em cinza até 15 dias; acima de 15, a pílula âmbar "{n} dias nesta etapa", o mesmo texto e o mesmo limite do selo do cartão da parte 4;
    - **botão principal**, com o nome da ação e da etapa: [Iniciar {etapa}] quando a etapa atual está pendente (um clique, sem janela); [Concluir {etapa}] quando em andamento (abre a janela de avanço; sem etapa pendente depois, conclui direto);
    - **"⋯" do Agora:** Dispensar (só na etapa opcional) e Realizada anteriormente, com as janelas da parte 2;
    - **sem responsável:** no lugar do avatar, "Sem responsável", e o botão secundário [Assumir] ao lado do principal (mesma regra da parte 2: não aparece na Revisão interna para quem enviou a versão mais recente não histórica);
    - **"Trocar":** lista suspensa no próprio Agora, com quem está na tela primeiro ("{nome} (você)"), os demais integrantes ativos e "Ninguém por enquanto" no fim; a mesma trava do autor; grava ao escolher, sem confirmação; a falha mostra a mensagem de erro de gravação e deixa o responsável como estava;
    - **suspenso:** fundo âmbar claro, "Suspenso: {motivo}" e [Retomar] como botão principal;
    - **cancelado:** fundo cinza claro, "Cancelado: {motivo}" e [Retomar];
    - **concluído:** fundo verde claro e "Concluído em {data}" (a data da última etapa obrigatória resolvida); a parte 5 acrescenta a versão aprovada e o E-protocolo;
    - **Consulta:** o mesmo cartão sem botões nem "Trocar", com a borda cinza em vez de azul e a frase "Com {nome} há {n} dias" (ou "Sem responsável").
  - **Coluna esquerda — Etapas** (lista só de leitura, uma linha compacta por etapa):
    - concluída: ✓ verde; atual: ponto azul, com a linha em `azul-claro` e o nome em 600; pendente: círculo cinza; opcional ainda pendente: círculo tracejado e o selo "opcional"; dispensada: traço cinza, nome riscado de leve e o selo "dispensada"; realizada anteriormente: ✓ cinza e o selo "anterior";
    - à direita da linha, a data (mono; na atual, "desde {data}") e as iniciais de quem resolveu (na atual, do responsável);
    - **detalhe da etapa:** clicar na linha abre uma gaveta logo abaixo dela, uma por vez, com datas de início e de conclusão, nota, responsável, [Corrigir datas] (formulário que já existe) e, nas resolvidas anteriores à atual, [Voltar a esta etapa] (janela da parte 2). Nas pendentes depois da atual, o responsável tem o mesmo "Trocar" do Agora e, sem ninguém, [Assumir], para manter as histórias 42, 101 e 102. A etapa atual, aberta, mostra só datas e nota: as ações e o responsável dela ficam no Agora;
    - processo suspenso ou cancelado: a gaveta mostra só a leitura, sem botões.
  - **Coluna esquerda — Arquivos:** a mesma seção da funcionalidade `documentos-versoes`, com outra apresentação:
    - **linha de destaque** da versão mais recente: número (mono, 600), data (mono) e, quando falta algo, a pílula âmbar "falta relatório";
    - embaixo, um botão para cada arquivo dela ("Fluxograma .bpmn", "Imagem .png", "Relatório .docx", com a barrinha de cor do tipo e o ícone de baixar);
    - o relatório que falta aparece como espaço tracejado [+ Acrescentar relatório] no lugar onde ele estaria (só para quem pode enviar);
    - [Enviar versão] no título da seção; "Registrar versão histórica" num "⋯" da seção; Substituir no "⋯" de cada arquivo, como já é;
    - as versões anteriores recolhidas em "Versões anteriores ({n})", que abre a lista que já existe;
    - os formulários de envio abrem no lugar da seção, como hoje.
  - **Coluna direita — Reunião:** rótulo "Reunião", a data (mono, com a barrinha amarela de reunião) e "· próxima" ou "· realizada"; sem data, "Ainda não marcada". Para quem pode alterar, "Marcar data" (ou "Alterar data") vira ali mesmo o campo de data com [Salvar], [Remover] e [Cancelar] (o comportamento da spec de `reunioes`).
  - **Coluna direita — Sobre:** setor, macroprocesso, tipo, origem, contexto e observações, cada um com o rótulo pequeno em cinza acima do valor; contexto e observações longos mostram até 4 linhas e "Ler mais" (que vira "Ler menos"); campo vazio não aparece.
  - **Coluna direita — Estrutura:** "Subprocessos ({n})", cada um com o nome em link e, embaixo em cinza, a etapa atual e a situação quando não é em andamento; no subprocesso, "Faz parte de" com o pai do mesmo jeito; sem subprocessos nem pai, a seção não aparece.
  - **Histórico** (pelo "⋯"): substitui o conteúdo da janela, que mantém a largura, com "← Voltar ao processo" e o título "Histórico" no topo; formato na seção "Histórico" abaixo. Esc volta ao verso; o segundo Esc fecha a janela. O Esc no Editar também volta ao verso, sem gravar (decisão de 2026-10-19: fechar a janela inteira perderia o que foi digitado).
  - **Novo processo e Editar:** o formulário do processo ocupa a janela, que encolhe para uma coluna de cerca de 560 px; cabeçalho "Novo processo" ou "Editar {nome}"; rodapé fixo com [Cadastrar] ou [Salvar] (principal) e [Cancelar]. Editar: Salvar ou Cancelar volta ao verso. Novo processo: Cancelar e Esc fecham a janela; ao cadastrar, a janela se alarga e mostra o verso do processo criado (o endereço passa a ser o dele), com o aviso "Processo cadastrado", e o Quadro ou a Lista atrás recarregam.
  - **Teclado e leitor de tela:** a janela é um diálogo anunciado como "Processo {nome}" (ou "Novo processo"); ao abrir, o foco vai ao nome do processo; o Tab circula só dentro da janela; Esc fecha (veja Histórico); ao fechar, o foco volta ao cartão (Quadro) ou à linha (Lista) de origem; menus e gavetas abrem e fecham pelo teclado, com o estado anunciado.
- **Janelas com campo obrigatório** (a mesma janela nativa do ADR 0003, com um campo de texto):
  - **Nota:** em Dispensar e Realizada anteriormente.
  - **Motivo:** em Suspender, Cancelar, Retomar, Voltar e Reclassificar.
  - **Botões:** o de confirmar tem o verbo da ação e fica desabilitado com o campo vazio; o foco abre no campo e Esc fecha sem gravar.
- **Janela de avanço** (desde 2026-10-18; a mesma janela nativa do ADR 0003):
  - **Quando abre:** em [Concluir], e dentro das janelas de Dispensar e Realizada anteriormente, abaixo da nota, sempre que há etapa pendente depois da que se resolve. Sem pendente depois, Concluir grava direto, e Dispensar e Realizada anteriormente mostram só a nota.
  - **Título:** "Concluir {etapa} e iniciar {próxima}" (com "Dispensar" ou "Registrar … como realizada anteriormente" nas outras ações).
  - **Pergunta e opções:** "Quem fica com a próxima etapa?", em botões de rádio: cada usuário ativo Administrador ou Integrante pelo nome, e "Ninguém por enquanto" por último. Quando a próxima é a Revisão interna, o autor da versão mais recente não histórica não aparece. Se a lista de usuários ainda não chegou (ou a leitura falhou), a janela oferece só "Ninguém por enquanto". Para a tela esconder esse autor, o processo lido traz a versão mais recente não histórica (número e autor); a proteção é a do banco, a tela só poupa a recusa.
  - **Marcado ao abrir:** o responsável que a próxima já tem, se ele pode ser escolhido; senão, quem está na tela, se pode; senão, "Ninguém por enquanto".
  - **Teclado e leitor de tela:** o grupo de rádios tem a pergunta como nome; o foco abre na opção marcada (na nota, quando há nota); as setas trocam de opção; Enter confirma; Esc e [Cancelar] fecham sem gravar.
  - **Botão de confirmar:** "Concluir e iniciar {próxima}" (ou "Dispensar e iniciar {próxima}", "Registrar e iniciar {próxima}"); com nota, desabilitado enquanto ela estiver vazia.
  - **Voltar:** a janela do motivo ganha "Quem fica com esta etapa?", com as mesmas opções e a mesma trava, e com o responsável atual da etapa reaberta marcado (se ele não pode, quem está na tela; senão, "Ninguém por enquanto").
  - **Reclassificar:** a janela traz o novo tipo e, para Subprocesso, o pai. Quando o macroprocesso muda, ela mostra o aviso "O item passa do macroprocesso {de} para {para}, o do processo pai."
- **Confirmação simples (ADR 0003)** em Excluir processo e Excluir etapa do catálogo:
  - "Excluir o processo {nome}? O histórico guarda o que ele tinha, inclusive as etapas, mas não é possível desfazer." [Excluir processo] [Cancelar];
  - "Excluir a etapa {nome} do catálogo?" [Excluir etapa] [Cancelar].
- **Tela do setor** ganha, abaixo do que já existe, "Processos do setor": lista com nome, tipo, etapa atual e situação, em que clicar leva à Lista filtrada pelo setor com o verso aberto; fechar deixa a pessoa nessa Lista. As seções "Responsáveis do setor" e "Etapas do setor" saíram em 2026-10-18.
- **Catálogo de etapas** (aba da Administração, só administrador):
  - **Lista:** em ordem, com nome, obrigatória ou opcional e pílula "Inativa".
  - **Ações:** [Nova etapa] (nome, código, obrigatória e posição), [Editar] (nome, obrigatória), [Subir], [Descer], [Desativar] ou [Reativar] e [Excluir]. O campo "Nível" saiu em 2026-10-18.
- **Mensagens de recusa, vindas do banco e traduzidas pela interface:**
  - "Já existe um processo com o nome {nome} no setor {SIGLA}."
  - "A etapa {anterior} ainda não foi resolvida."
  - "Já há uma etapa em andamento neste processo: {etapa}."
  - "A etapa {nome} é obrigatória e não pode ser dispensada."
  - "Este processo está {suspenso | cancelado}; retome-o para registrar o andamento."
  - "A data {valor} está no futuro." e "A conclusão ({valor}) não pode ser antes do início ({valor})."
  - "Este processo tem {n} subprocessos; reclassifique-os ou exclua-os antes." (exclusão e reclassificação em subprocesso)
  - "O processo pai precisa ser do tipo Processo."
  - "{Usuário} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP."
  - "{Usuário} enviou a versão V{n} e não pode ser responsável pela Revisão interna." (desde 2026-10-18)
  - "A nota é obrigatória." (dispensar e registrar como realizada anteriormente, pelo avanço; o motivo de suspender, cancelar, retomar e voltar tem a frase "O motivo é obrigatório."; desde 2026-10-18)
  - "Não é possível excluir: {setor | macroprocesso} tem {n} processos ligados."
  - "O setor {SIGLA} tem {n} processos neste macroprocesso; mova-os ou exclua-os antes."
  - "A etapa {nome} já foi usada; desative-a em vez de excluir."
  - "Seu perfil não permite alterar os processos." (quando o banco recusa por perfil)
- **Estados:**
  - **Carregando:**
    - Quadro: "Carregando processos…", com colunas-fantasma;
    - Lista: "Carregando processos…", com linhas-fantasma;
    - verso: a janela já no tamanho final, com blocos cinza no formato do cabeçalho e das duas colunas, e "Carregando processo…" para o leitor de tela (desde 2026-10-19; antes, só o texto);
    - "Carregando catálogo…" e "Carregando processos do setor…".
  - **Vazio:**
    - nenhum processo: o estado vazio que já existe ("Nenhum processo cadastrado ainda." com [Cadastrar processo] para quem pode);
    - filtros sem resultado: "Nenhum processo com estes filtros." com [Limpar filtros];
    - "Este setor ainda não tem processos." e "Nenhuma alteração registrada ainda." no histórico.
  - **Erro ao carregar, inclusive falha de conexão:** "Não foi possível carregar {os processos | o processo | o catálogo}. Verifique a conexão e tente de novo." com [Tentar de novo].
  - **Item que não existe mais:** "Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico." com [Voltar].
  - **Erro de gravação:** "A alteração não foi salva: {motivo}. Seus dados continuam no formulário."
- **Cores das mensagens (ADR 0003):** vermelho para "a ação não aconteceu" e amarelo para aviso.
- **Histórico:**
  - **Formato:** o mesmo da lista do Histórico dos cadastros, acrescido do motivo ou da nota. No verso (desde 2026-10-19), o histórico do processo é uma linha do tempo do mais novo para o mais antigo, agrupada por dia ("Hoje", "Ontem", "12/10"); cada evento traz a hora em mono, as iniciais de quem fez, a frase da ação com o antes e depois e, em cinza abaixo, o motivo ou a nota.
  - **Textos das ações:**
    - "Criou", "Editou", "Excluiu";
    - "Iniciou a etapa", "Concluiu a etapa", "Dispensou a etapa", "Registrou a etapa como realizada anteriormente", "Voltou à etapa", "Corrigiu as datas da etapa", "Mudou o responsável da etapa";
    - o avanço (desde 2026-10-18) aparece como dois desses registros, com o mesmo autor e a mesma hora: o da etapa resolvida e "Iniciou a etapa" da próxima, com o responsável dela no "depois". Sem texto novo;
    - "Suspendeu", "Cancelou", "Retomou", "Reclassificou";
    - "Acrescentou a etapa ao catálogo", "Mudou a ordem do catálogo", "Desativou a etapa", "Reativou a etapa".
  - **Registros de recursos retirados (2026-10-18):** eventos de responsável do setor, de andamento de etapa do setor (o andamento sem processo) e de reunião aparecem no histórico geral e no da área Setores numa linha simples, com data, autor e ação: "Registro de responsável do setor (recurso retirado da plataforma)", "Registro de etapa do setor (recurso retirado da plataforma)" e "Registro de reunião (recurso retirado da plataforma)". Os eventos antigos do catálogo com o campo "nível" mostram o campo como veio, sem tradução nova.

### Modelo de dados

A primeira migração (2026-10-13 e 2026-10-14) foi não destrutiva. A de 2026-10-18 (Simplificação, seção "Migração de 2026-10-18" abaixo) é **destrutiva**: apaga as etapas do setor, os responsáveis do setor e o nível do catálogo. As tabelas abaixo já descrevem o estado depois dela.

**Tipos:**
- `tipo_de_processo`: `processo`, `subprocesso`, `a_classificar`;
- `origem_do_processo`: `novo`, `retomado`;
- `situacao_guardada`: `em_andamento`, `suspenso`, `cancelado`;
- `status_da_etapa`: `pendente`, `em_andamento`, `concluida`, `realizada_anteriormente`, `dispensada`.

O tipo `nivel_da_etapa` (`setor`, `processo`) foi apagado em 2026-10-18.

**`etapas`** (o catálogo de etapas)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| codigo | texto, 2 a 40 caracteres, letras minúsculas sem acento, números e sublinhado, único, não muda depois de criado | sim |
| nome | texto, sem espaços nas pontas, 1 a 120 caracteres, único sem diferenciar maiúsculas | sim |
| ordem | inteiro positivo, único | sim |
| obrigatoria | booleano | sim |
| ativa | booleano, padrão verdadeiro | sim |
| criado_em | data e hora | sim |

O código é a identidade estável da etapa para as funcionalidades seguintes. Por exemplo, a funcionalidade de revisões vai concluir a etapa `revisao_interna` sozinha. Catálogo depois de 2026-10-18, na ordem:

| Ordem | Código | Nome | Obrigatória |
|---|---|---|---|
| 1 | `modelagem` | Modelagem piloto | sim |
| 2 | `relatorio_modelagem_tecnica` | Relatório e modelagem técnica | sim |
| 3 | `revisao_interna` | Revisão interna | sim |
| 4 | `revisao_setor` | Revisão pelo setor | sim |
| 5 | `aprovacao_setor` | Aprovação pelo setor | sim |
| 6 | `publicacao` | Publicação | não |

**`processos`**

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| setor_id | uuid, referência a `setores`, recusa apagar o setor | sim |
| macroprocesso_id | uuid, referência a `macroprocessos`, recusa apagar | sim |
| nome | texto, sem espaços nas pontas, 1 a 200 caracteres; único por setor sem diferenciar maiúsculas | sim |
| tipo | tipo_de_processo, padrão `a_classificar` | sim |
| processo_pai_id | uuid, referência a `processos`, recusa apagar o pai | só no subprocesso |
| origem | origem_do_processo, padrão `novo` | sim |
| situacao | situacao_guardada, padrão `em_andamento` | sim |
| motivo_da_situacao | texto, até 2000 caracteres | só quando suspenso ou cancelado |
| contexto | texto, até 4000 caracteres | não |
| observacoes | texto, até 2000 caracteres | não |
| data_da_reuniao | data (nova em 2026-10-18; regras na spec de `reunioes`) | não |
| criado_em | data e hora | sim |

O par (`macroprocesso_id`, `setor_id`) é uma referência a `setores_envolvidos` que recusa apagar. É ela que impede tirar de um macroprocesso um setor com processos ali, e garante que o setor do processo é sempre setor envolvido no macroprocesso dele.

**`andamentos`** (uma etapa do catálogo num processo)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| etapa_id | uuid, referência a `etapas`, recusa apagar | sim |
| processo_id | uuid, referência a `processos`, apaga junto | sim (antes de 2026-10-18 era vazio na etapa do setor) |
| status | status_da_etapa, padrão `pendente` | sim |
| nota | texto, até 2000 caracteres | só em `realizada_anteriormente` e `dispensada` |
| responsavel_id | uuid, referência a `usuarios` | não |
| iniciada_em | data | quando em andamento ou concluída |
| resolvida_em | data | quando resolvida |

O par (`etapa_id`, `processo_id`) é único. A coluna `setor_id` foi apagada em 2026-10-18.

**`processos_com_andamento`** (view, `security_invoker = true`) devolve, para cada processo:
- a **etapa atual**: a em andamento ou, sem ela, a primeira pendente na ordem do catálogo (a funcionalidade de documentos usa o id dela para gravar a etapa da versão, e isso continua igual);
- o **responsável** da etapa atual;
- a **situação calculada**: `concluido` quando a guardada é `em_andamento` e todas as etapas obrigatórias do processo estão resolvidas; senão, a guardada.

A indicação "aguardando o setor" saiu da view em 2026-10-18.

**Derivado, não guardado:** etapa atual, situação "concluído", quantidade de subprocessos e de processos por setor.

**`eventos`** (já existe): recebe as entidades `processo`, `andamento` e `etapa`. Os eventos antigos de `responsavel_do_setor` e os de `andamento` de etapa do setor continuam guardados e legíveis por todo perfil ativo.
- O `detalhes` traz antes e depois com campos legíveis: nome do processo, sigla do setor, nome do macroprocesso, nome e código da etapa, nome do responsável, e a data da reunião. Assim o histórico continua legível depois de uma exclusão.
- O motivo ou a nota vão em `detalhes.motivo`.
- A exclusão de um processo traz no "antes" todos os campos e a lista dos andamentos.
- O evento de andamento guarda também o id do processo, para os filtros do histórico.
- As ações de "voltar" geram um evento por andamento alterado.

**Dado pessoal e quem vê:**
- `andamentos.responsavel_id` aponta para usuários, cujo nome todos os perfis ativos já veem.
- Os eventos desta funcionalidade são lidos por todo perfil ativo. Os de usuários e autorizações seguem só do Administrador.
- Com os responsáveis do setor apagados, a plataforma não guarda mais nome, e-mail e cargo de pessoas dos setores. Os eventos antigos deles (só dados inventados do desenvolvimento) ficam no histórico.

**Privilégios padrão:** cada tabela nova nasce com `revoke all` de visitante e de logado e concede de volta só o necessário a logado, com a RLS decidindo o resto. A view nasce com `revoke all` de visitante. Assim o teste `10_privilegios_padrao` continua passando.

**Gravações com várias linhas** (voltar, reclassificar, suspender, cancelar e retomar com motivo, e mexer no catálogo, que acrescenta ou tira andamentos) passam por funções do banco chamadas pela interface, sem `security definer`, que rodam com a permissão de quem chama. A RLS decide o resto. Iniciar, corrigir datas e mudar responsável também podem ir por funções, se a execução preferir.

**Avanço (desde 2026-10-18, ADR 0014).** Concluir, dispensar e registrar como realizada anteriormente passam por uma função do banco, nas mesmas condições das outras (sem `security definer`, com a permissão de quem chama), que recebe o andamento, a ação, a nota (quando há) e o responsável da próxima (ou nenhum). Numa transação só, ela resolve a etapa e, se houver etapa pendente depois dela na ordem do catálogo, põe a primeira em andamento com início hoje e o responsável recebido. Qualquer recusa (sequência, nota, trava do autor, processo congelado) desfaz tudo. A função de voltar ganha o parâmetro do responsável da etapa reaberta (é apagada e recriada com a assinatura nova, com os mesmos privilégios). Nenhuma tabela ou coluna muda; a tabela "quem pode o quê" continua a mesma.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `etapas` ler | sim | sim | sim | não | não |
| `etapas` criar, alterar nome, ordem, obrigatória, ativa | sim | não | não | não | não |
| `etapas` alterar id, código, criado_em | não | não | não | não | não |
| `etapas` apagar (só nunca usada) | sim | não | não | não | não |
| `processos` ler | sim | sim | sim | não | não |
| `processos` criar, alterar (inclusive a data da reunião), apagar | sim | sim | não | não | não |
| `processos` alterar id, criado_em | não | não | não | não | não |
| `processos` alterar tipo e pai fora da reclassificação | não | não | não | não | não |
| `andamentos` ler | sim | sim | sim | não | não |
| `andamentos` alterar status, nota, responsável, datas | sim | sim | não | não | não |
| `andamentos` criar e apagar direto | não (só gatilhos e funções do catálogo e do cadastro) | não | não | não | não |
| `andamentos` alterar id, etapa_id, processo_id | não | não | não | não | não |
| `processos_com_andamento` ler | sim | sim | sim | não | não |
| `eventos` desta funcionalidade ler (inclusive os antigos de responsável e de etapa do setor) | sim | sim | sim | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos incluem) | não | não | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Nome do processo único por setor | índice único sobre (setor, nome normalizado) | "Emitir ofício " recusado quando "emitir ofício" existe no mesmo setor; aceito em outro setor |
| Setor do processo é setor envolvido no macroprocesso | referência composta a `setores_envolvidos` + gatilho antes de incluir e alterar que inclui o setor envolvido se faltar | cadastrar com setor fora do macroprocesso inclui o setor envolvido e gera o evento dele |
| Não tirar setor envolvido com processos | referência composta recusa apagar | tirar CEE do macroprocesso com 2 processos é recusado |
| Não excluir setor ou macroprocesso com processo | referência recusa apagar | excluir setor com processo é recusado |
| Subprocesso tem pai do tipo processo; processo e "a classificar" não têm pai | gatilho e restrição | subprocesso sem pai, pai subprocesso e pai "a classificar" recusados |
| Subprocesso segue o macroprocesso do pai; mudar o macroprocesso do pai muda o dos filhos | gatilho | mudar o macroprocesso do pai muda o do filho e inclui o setor do filho como envolvido |
| Tipo e pai só mudam pela reclassificação, com motivo | gatilho que recusa a mudança fora da função de reclassificar; a função exige motivo | alterar `tipo` direto recusado; reclassificar sem motivo recusado |
| Processo com subprocessos não vira subprocesso | função de reclassificar | recusado com a contagem |
| Não excluir processo com subprocessos | referência do pai recusa apagar | recusado com a contagem |
| Criar processo cria os andamentos das etapas ativas | gatilho depois de incluir | processo novo tem 6 andamentos pendentes |
| Criar setor não cria andamentos (desde 2026-10-18) | gatilho de criação de setor apagado | setor novo não tem andamento |
| Etapa só sai de pendente com a anterior resolvida; a primeira (Modelagem piloto) sai livre | gatilho antes de alterar | iniciar a 2 com a 1 pendente recusado; iniciar a 1 de processo novo aceito |
| No máximo uma etapa em andamento por processo | índice único parcial | segunda em andamento recusada |
| Dispensar só etapa opcional; nota obrigatória em dispensada e realizada anteriormente | gatilho e restrição | dispensar a 3 recusado; dispensar sem nota recusado |
| Transições permitidas | gatilho antes de alterar | concluir uma pendente recusado; sair de resolvida só pela função de voltar |
| Datas: nunca no futuro; resolvida não antes de iniciada | restrição | data de amanhã recusada; resolvida antes de iniciada recusada |
| Processo suspenso ou cancelado congela os andamentos | gatilho antes de alterar | iniciar etapa de processo suspenso recusado |
| Motivo obrigatório em suspender, cancelar e retomar | restrição sobre `motivo_da_situacao` + funções | suspender sem motivo recusado |
| Voltar: a etapa escolhida volta a em andamento e as seguintes resolvidas voltam a pendente | função de voltar | voltar à 1 com a 2 e a 3 concluídas deixa 1 em andamento e 2 e 3 pendentes, com os eventos |
| Responsável é usuário ativo Administrador ou Integrante | gatilho antes de incluir e alterar | escolher um usuário Consulta ou inativo recusado |
| Resolver a etapa atual avança: a primeira pendente depois dela entra em andamento, com início hoje e o responsável recebido (ou nenhum); tudo ou nada (desde 2026-10-18) | função de avanço | concluir a 2 com a 3 pendente deixa a 2 concluída e a 3 em andamento com o responsável; "nenhum" deixa a 3 em andamento sem responsável; com a 3 já resolvida, inicia a 4; concluir a última não inicia nada; dispensar e realizada anteriormente avançam igual; dispensar sem nota recusado sem mudar nenhuma etapa |
| Responsável da Revisão interna não é quem enviou a versão mais recente não histórica, conferido só quando o responsável muda para alguém (desde 2026-10-18) | gatilho antes de alterar o responsável do andamento de código `revisao_interna` | escolher o autor da V3 recusado pelo seletor, pelo avanço e pela função de voltar; autor de versão histórica aceito; processo sem versão aceito; o responsável que envia a V4 depois de escolhido continua responsável |
| Etapa nova entra como pendente nos processos em andamento e suspensos não concluídos (ADR 0004) | função do catálogo, sem parâmetro de nível | etapa nova não entra em processo concluído nem cancelado |
| Desativar etapa apaga os andamentos pendentes dela; reativar os recria onde faltam | função do catálogo | desativar mantém os resolvidos e apaga os pendentes |
| Etapa usada não se exclui; código não muda | referência de `andamentos` recusa apagar quando há andamento não pendente; gatilho | excluir etapa com andamento concluído recusado |
| Toda mudança vira evento, com autor, antes, depois e motivo | gatilhos depois de incluir, alterar e apagar | cada ação gera o evento esperado; exclusão do processo traz os andamentos no "antes" |
| Gravação sem mudança não vira evento | os gatilhos comparam antes e depois | salvar sem mudar nada não gera evento |

As regras "etapas do setor antes das do processo", "nível não muda", "a primeira do processo exige as do setor resolvidas" e as de `responsaveis_do_setor` (e-mail no formato e em minúsculas) saíram em 2026-10-18, com as estruturas que protegiam.

#### Regras de estado

**Etapa (andamento):**

```
pendente ──iniciar──▶ em_andamento ──concluir──▶ concluida
pendente | em_andamento ──dispensar (só opcional, nota)──▶ dispensada
pendente | em_andamento ──realizada anteriormente (nota)──▶ realizada_anteriormente
resolvida ──voltar (motivo)──▶ em_andamento   (as seguintes resolvidas ──▶ pendente)
```

Sair de pendente exige a anterior resolvida (a Modelagem piloto, primeira, não tem anterior). Concluída, dispensada e realizada anteriormente contam como resolvida.

**Avanço (desde 2026-10-18):** concluir, dispensar ou registrar como realizada anteriormente a etapa atual leva, na mesma transação, a primeira etapa pendente depois dela de `pendente` a `em_andamento` (com o responsável escolhido ou nenhum). Sem pendente depois, nada mais muda. Voltar põe a etapa escolhida em andamento com o responsável escolhido.

**Processo (situação guardada):**

```
em_andamento ──suspender (motivo)──▶ suspenso ──retomar (motivo)──▶ em_andamento
em_andamento | suspenso ──cancelar (motivo)──▶ cancelado ──retomar (motivo)──▶ em_andamento
```

"Concluído" é calculado: situação guardada `em_andamento` com todas as etapas obrigatórias do processo resolvidas. Voltar uma etapa desfaz o concluído sozinho. Suspenso e cancelado congelam os andamentos. Ao retomar, `motivo_da_situacao` volta a nulo, e o motivo fica no evento.

**Reclassificação:** a classificar → processo | subprocesso; processo ⇄ subprocesso. Sempre com motivo e pela função. Ao virar subprocesso: pai do tipo processo, sem filhos próprios, e o macroprocesso passa a ser o do pai. Ao virar processo, o pai é apagado e o macroprocesso fica o mesmo. A data da reunião fica como está.

#### Migração de 2026-10-18 (Simplificação)

Destrutiva. A produção não existe; só se perdem dados inventados do desenvolvimento (ADR 0013). Três migrações novas, uma por ticket, cada uma numa transação: `20261018123613_data_da_reuniao` (itens 1 e 6), `20261018132857_responsaveis_do_setor_saem` (item 2) e `20261018141346_sem_etapas_do_setor` (itens 3 a 5). O que cada uma faz:

1. **Reuniões:** tudo o que a spec de `reunioes` lista como apagado (tabelas, tipo, funções, gatilhos e travas).
2. **Responsáveis do setor:** apaga a tabela `responsaveis_do_setor`, os gatilhos e funções dela.
3. **Etapas do setor:** apaga os andamentos de etapa do setor, as três etapas de nível setor, o gatilho que criava andamentos ao criar setor, a parte do gatilho de sequência que exigia as etapas do setor resolvidas, a regra de ordem entre níveis, a coluna `andamentos.setor_id` com a sua restrição e índices, a coluna `etapas.nivel` e o tipo `nivel_da_etapa`. A função de acrescentar etapa perde o parâmetro de nível (é apagada e recriada com a assinatura nova, com os mesmos privilégios).
4. **Catálogo:** renumera as etapas restantes de 1 a 6, mantendo a ordem relativa, e renomeia `modelagem` para "Modelagem piloto".
5. **View:** recria `processos_com_andamento` sem a indicação "aguardando o setor", com `security_invoker = true` e o mesmo `revoke` de visitante.
6. **Processos:** acrescenta `data_da_reuniao`, concede a alteração dela a logado e inclui a data no estado guardado nos eventos do processo.

As exclusões e a renumeração da migração não geram eventos: é mudança de estrutura, registrada no ADR 0013, e não ação de alguém. A migração precisa desligar os gatilhos de evento enquanto apaga e renumera (`session_replication_role = replica`, desfeito no fim, como nos testes de 2026-10-16). Os eventos antigos ficam como estão.

#### Migração da parte 2 (Etapas mais rápidas)

Não destrutiva: nenhuma tabela ou coluna muda. Uma migração nova cria a função de avanço, o gatilho da trava do autor na Revisão interna e recria a função de voltar com o parâmetro do responsável. Os eventos saem dos gatilhos que já existem (um por andamento alterado). Vai pelo workflow "Migrar banco de desenvolvimento" e entra no registro de `supabase/AMBIENTES.md`.


#### Parte 3 (Verso do cartão, 2026-10-19)

Sem migração: nenhuma tabela, coluna, política, view ou função muda. O verso usa o que o processo lido já traz (etapas com datas, responsáveis e notas, versão mais recente, data da reunião, estrutura e situação com motivo); os dias na etapa e o "Concluído em" se calculam na tela a partir das datas das etapas, e a busca filtra a lista já carregada.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de processos, que guarda processos (com a data da reunião), catálogo, andamentos e histórico, aceita falhas programáveis e imita as recusas do banco. Ela fica ao lado das falsas do acesso e dos cadastros.
  - **O que cobre:**
    - Quadro e Lista para cada perfil (Consulta sem botões);
    - colunas por etapa, sem "Aguardando o setor" (processo novo direto na Modelagem piloto; endereço antigo com o filtro tratado como sem filtro);
    - cartões com pílulas;
    - filtros no endereço e "Limpar filtros";
    - cadastrar, editar e excluir processo, com sucesso e com falha;
    - o aviso de setor fora do macroprocesso;
    - subprocesso com macroprocesso fixo;
    - cada ação de etapa e cada janela de nota ou motivo (confirmar desabilitado com campo vazio, Esc sem gravar);
    - voltar;
    - datas;
    - responsável;
    - suspender, cancelar e retomar, com o congelamento;
    - concluído calculado;
    - reclassificar, com o aviso de macroprocesso;
    - tela do setor sem responsáveis nem etapas do setor, e painel sem as etapas do setor;
    - catálogo sem o campo "Nível" e com a Modelagem piloto em primeiro;
    - as linhas simples dos registros de recursos retirados no histórico;
    - catálogo só para o administrador;
    - cada mensagem de recusa;
    - estados de carregando, vazio e erro de cada tela;
    - item que não existe mais;
    - histórico do processo;
    - avanço (desde 2026-10-18): a janela de Concluir com o título, as opções e a opção marcada em cada caso (responsável que a próxima já tem, quem está na tela, "Ninguém por enquanto"); a próxima em andamento depois de confirmar, com e sem responsável; a primeira pendente pulando as resolvidas; a última etapa sem janela e o processo concluído; Dispensar e Realizada anteriormente com nota e escolha na mesma janela; Esc e [Cancelar] sem gravar; teclado (foco na opção marcada, setas, Enter) e nomes acessíveis; falha na gravação com a etapa como estava;
    - [Assumir] nas etapas pendentes e em andamento sem responsável, ausente nas resolvidas, para a Consulta e, na Revisão interna, para o autor da versão mais recente;
    - a trava do autor: ausente da janela de avanço e da de voltar, autor de versão histórica presente, e a recusa do banco pelo seletor com a mensagem;
    - voltar com a escolha do responsável da etapa reaberta;
    - os dois registros do avanço no histórico;
    - verso do cartão (desde 2026-10-19), pelo aplicativo inteiro, como a pessoa usa:
      - abrir pelo cartão, pela linha da Lista, pelo endereço e pela tela do setor; fechar pelo botão e por Esc, com o foco de volta ao cartão ou à linha; pai e subprocesso na mesma janela, com o endereço mudando;
      - a janela como diálogo com o nome acessível "Processo {nome}", o foco no nome ao abrir e o Tab preso dentro dela;
      - cabeçalho: tipo em texto, pílula de situação só em suspenso, cancelado e concluído;
      - Agora em cada caso: pendente com [Iniciar {etapa}]; em andamento com [Concluir {etapa}] abrindo a janela de avanço; "⋯" com Dispensar só na opcional e Realizada anteriormente; sem responsável com [Assumir]; "Trocar" com a pessoa da tela primeiro e "Ninguém por enquanto" no fim, gravando ao escolher, e a falha com a mensagem de erro; dias na etapa até 15 e a pílula "{n} dias nesta etapa" a partir de 16; suspenso e cancelado com motivo e [Retomar]; concluído com a data; Consulta sem botões;
      - etapas: o nome acessível de cada status; a gaveta abrindo uma por vez, com Corrigir datas e Voltar a esta etapa onde cabem, e o Trocar e o [Assumir] nas pendentes;
      - arquivos: destaque da versão mais recente, "falta relatório" com o espaço [+ Acrescentar relatório], versões anteriores recolhidas, "Registrar versão histórica" no "⋯" da seção, e a Consulta só baixando;
      - reunião marcada, alterada e removida no próprio lugar;
      - Sobre sem os campos vazios e com "Ler mais" no texto longo;
      - estrutura com a etapa atual de cada subprocesso, "Faz parte de" e a seção ausente sem estrutura;
      - menu "⋯" com os três grupos, e só Histórico para a Consulta;
      - Histórico dentro da janela, agrupado por dia, com "← Voltar ao processo" e o Esc que volta e depois fecha;
      - Editar na janela, voltando ao verso; Novo processo na janela, abrindo o verso do criado com "Processo cadastrado"; falhas de gravação com os dados no formulário;
      - estados do verso: carregando (com o texto para o leitor de tela), erro com [Tentar de novo] e processo excluído com [Voltar];
      - busca da Lista: por trecho do nome, sem diferenciar maiúsculas e acentos, somada aos filtros, no endereço, com o "×", com o trecho marcado e sem resultado com [Limpar filtros] limpando também a busca;
    - os testes de tela atuais que falam do painel (por exemplo `App.painelDoProcesso` e `App.andamentoDoProcesso`) são ajustados ao verso, mantendo os comportamentos que continuam valendo.
  - **Funções puras novas:** a busca sem acento e sem maiúsculas, a contagem de dias na etapa e o limite de 15 dias, o agrupamento do histórico por dia e a leitura e montagem do endereço com `busca` ganham testes unitários pequenos.
  - **Arte anterior:** os testes de tela de cadastros-basicos (`App.setores`, `App.macroprocessos`, `App.historicoDosCadastros`) e a janela de confirmação.
- **Tradução entre o banco e a tela.** Testes pequenos do módulo de processos real com o cliente Supabase simulado. Eles provam que os códigos de recusa do banco viram as mensagens acima e que as linhas do banco e da view viram os tipos da tela. Arte anterior: os testes de `cadastrosSupabase` e `macroprocessosSupabase`.
- **Funções puras** (filtros a partir do endereço, ordem das colunas, textos do histórico): testes unitários pequenos.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras. As transições de estado ganham um teste cada.
  - **Testes gerais:** `00_rls_ligada` e `10_privilegios_padrao` cobrem as tabelas novas sem mudança.
  - **Testes antigos:** conferir os que contam linhas de uma tabela inteira, porque o andamento nascia junto com cada setor (achado do `/ship` de cadastros-basicos).
  - **Simplificação (2026-10-18):** os testes `15_etapas_do_setor` e `16_responsaveis_do_setor` são apagados; `17`, `18`, `19`, `20`, `21` e `22` são ajustados ao catálogo de 6 etapas sem nível (posições mudam: a Revisão interna passa de 6 a 3); um teste novo prova a migração (tabelas e colunas apagadas, catálogo renumerado e renomeado, setor novo sem andamento, Modelagem piloto inicia sem depender do setor, eventos antigos legíveis). Os testes da funcionalidade de documentos (`26` a `31`) que criam processos ou citam etapas pela posição também são conferidos.
  - **Parte 2 (2026-10-18):** um teste por linha nova da tabela de regras (avanço e trava do autor), e os testes de "voltar" ajustados à assinatura nova. A função de avanço também ganha os casos de perfil (Consulta, inativo e visitante recusados) e de processo suspenso.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todos os processos, setores e usuários dos testes são inventados.

## Fora do escopo

- Reuniões: a data da reunião de modelagem piloto está na spec de `reunioes`; ela não muda nenhuma etapa.
- Etapas do setor e responsáveis do setor: retirados em 2026-10-18 (ADR 0013).
- Envio de fluxogramas e relatórios, versões e o nome dos arquivos: funcionalidade 5. A recusa de excluir processo com documento chega com ela.
- Registro da revisão interna, E-protocolo e a trava que exige o registro para concluir as etapas de revisão: `revisoes-aprovacao` (parte 5 da iniciativa). Vão junto a regra 14 (aviso "estrutura alterada após aprovação") e os campos vigência e próxima revisão. O [Assumir] (antes "capturar") e a trava do autor na escolha do responsável entraram aqui em 2026-10-18 (ADR 0014); a regra que impede o autor de *registrar* a revisão fica na parte 5 e fecha a brecha de quem assume a Revisão interna pendente e depois envia a versão.
- Conclusão automática de etapas por documento ou revisão. Resolver uma etapa continua manual; desde 2026-10-18, só o início da próxima é automático.
- Arrastar o cartão para concluir e "Só os meus": parte 4 da iniciativa (o arrastar abre a janela de avanço desta parte).
- Parte 3 (2026-10-19): o novo desenho do cartão do Quadro (barra de progresso e selos) é da parte 4; busca no Quadro; reunião com mais de uma data (continua uma por processo, ADR 0013); endereço próprio para o Histórico e para o Editar; abrir o verso por cima da tela do setor; qualquer mudança no banco.
- Prazo padrão das etapas, prazo do andamento e indicador de atraso: funcionalidade 8.
- Campo "fase" (AS-IS ou TO-BE) no catálogo: quando existir a fase 2.
- Mais de um nível de subprocesso.
- Importação de processos: funcionalidade 10.
- Edição simultânea do mesmo item por duas pessoas: vale a última gravação, e as regras de sequência continuam garantidas pelo banco.
- Registro de quem consultou (backlog).

## Observações

- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` O Quadro segue a identidade visual: fundo azul-acinzentado, cartões brancos, colunas por etapa, a linha azul "acesa" no cartão escolhido, e indicação de colunas fora da vista quando o quadro rola para o lado.
  - `[visual]` (Desde 2026-10-19, substitui o critério do painel lateral.) O verso abre como janela central de até cerca de 880 px, em duas colunas de 60% e 40%, a direita em fundo levemente cinza, com o Quadro ou a Lista escurecidos atrás; o cabeçalho fica fixo e a janela tem uma só rolagem; abaixo de 900 px de largura, ocupa a tela inteira em uma coluna.
  - `[visual]` O Agora é a única coisa acesa da janela: borda de 2 px em `azul` e o único botão principal; na Consulta, borda cinza e sem botões; suspenso em âmbar claro, cancelado em cinza claro e concluído em verde claro.
  - `[visual]` As etapas são linhas compactas e quietas: só o verde de concluída e o azul da atual têm cor; o resto é cinza, com selos neutros para opcional, dispensada e anterior; a gaveta do detalhe abre sem empurrar a janela para fora da tela.
  - `[visual]` Nos arquivos, a versão mais recente se lê numa linha ("V2 · 02/10 · falta relatório"), com os botões dos arquivos com a barrinha de cor do tipo e o espaço tracejado do arquivo que falta no lugar dele.
  - `[visual]` O cabeçalho do verso mostra pílula só em suspenso, cancelado e concluído; o menu "⋯" tem os três grupos com Excluir em vermelho no fim.
  - `[visual]` O Novo processo e o Editar encolhem a janela para uma coluna de cerca de 560 px, com os botões no rodapé fixo; o carregando mostra blocos cinza no formato final, sem a janela mudar de tamanho quando os dados chegam.
  - `[visual]` A busca da Lista fica antes dos filtros, com lupa e "×", e o trecho encontrado aparece marcado em amarelo claro no nome.
  - `[visual]` O caminho de etapas mostra as resolvidas com ✓, a atual em azul com o sublinhado aceso e as futuras apagadas; sem etapas do setor (desde 2026-10-18). Desde 2026-10-19, vale a lista compacta do verso, descrita acima.
  - `[visual]` As pílulas (Suspenso, Cancelado, Concluído, Subprocesso, A classificar, Inativo, Inativa) têm cor e texto, nunca só cor.
  - `[visual]` A Lista é uma tabela compacta, no padrão das listas de cadastros.
  - `[visual]` Para a Consulta, Quadro, Lista, painel, tela do setor e histórico não mostram campos editáveis nem botões de alteração.
  - `[visual]` As janelas de nota e de motivo seguem o padrão da janela de confirmação, com o campo de texto e o botão de confirmar desabilitado enquanto vazio.
  - `[visual]` Mensagens de falha e de recusa em vermelho; avisos (setor que será incluído, macroprocesso que muda) em amarelo.
  - `[visual]` A janela de avanço segue o padrão da janela de confirmação: título, pergunta, lista de nomes em rádios com "Ninguém por enquanto" por último, e a nota acima dela em Dispensar e Realizada anteriormente; o [Assumir] é um botão discreto na linha da etapa, no padrão dos botões secundários (desde 2026-10-18).
- **Divergências com `.scratch/especificacao.md`**, decididas na sabatina de 2026-10-13:
  - o responsável do setor virou cadastro próprio, com vários por setor (a especificação tinha um responsável no setor);
  - os campos "fase" e "prazo padrão" do catálogo, e vigência e próxima revisão do processo, foram adiados;
  - a regra 14 foi para a funcionalidade 6;
  - o catálogo fica numa aba da Administração, como a especificação prevê.
- **Divergências de 2026-10-18** (ADR 0013): etapas do setor, responsáveis do setor e reuniões saem da plataforma; a especificação previa os três.
- **Decisões tomadas ao escrever a spec, a confirmar na leitura:**
  - **Código fixo da etapa:** cada etapa do catálogo tem um código fixo, para as funcionalidades 5 e 6 reconhecerem as etapas que vão andar sozinhas.
  - **Voltar:** devolve a "pendente" todas as etapas seguintes resolvidas (concluídas, dispensadas ou realizadas anteriormente). A sabatina falou em "concluídas"; deixar uma dispensada para trás tornaria o caminho incoerente.
  - **Etapa nova no catálogo:** entra também nos processos suspensos (eles não estão concluídos nem cancelados) (o "em todos os setores" valia para as etapas do setor, retiradas em 2026-10-18).
  - **Desativar uma etapa em andamento:** o processo continua nela até concluí-la. A coluna da etapa desativada aparece no Quadro enquanto houver processo nela.
  - **Parte 2 (2026-10-18):** o início da próxima é a data de hoje (corrigível depois, como as outras datas); a janela de voltar segue a mesma regra de opção marcada da janela de avanço; a trava do autor é conferida sempre que o responsável da Revisão interna passa a ser alguém (não quando fica vazio nem quando não muda); a falha na gravação do avanço mostra a mensagem de erro de gravação e deixa as etapas como estavam.
  - **Parte 3 (2026-10-19):**
    - "Concluído em" é a data da última etapa obrigatória resolvida;
    - Histórico e Editar não têm endereço próprio (recarregar volta ao verso);
    - a etapa atual pendente (como a primeira de um processo novo) tem o botão principal [Iniciar {etapa}] no Agora;
    - nas etapas pendentes depois da atual, o "Trocar" e o [Assumir] ficam na gaveta, para não perder a escolha antecipada do responsável (histórias 42 e 102);
    - o aviso "Este processo está {suspenso | cancelado}: {motivo}. Retome-o para registrar o andamento." dá lugar ao Agora suspenso ou cancelado, com o motivo e [Retomar];
    - a apresentação das versões e da reunião no verso muda o desenho das seções de `documentos-versoes` e `reunioes`, sem mudar o que elas fazem; as specs delas recebem uma nota apontando para cá;
    - [Limpar filtros] limpa também a busca.
- **Tamanho:** a funcionalidade tem várias entregas. A sabatina permitiu deixar a Lista para um ticket posterior.
- **Rede do escritório:** a migração vai pelo workflow "Migrar banco de desenvolvimento" e precisa ser registrada em `supabase/AMBIENTES.md` para o `migration repair` antes da primeira publicação em produção.
- **Privilégios padrão:** toda tabela ou view nova em `public` reprova o teste `10_privilegios_padrao` até receber o seu `revoke`.

Entregue em 2026-10-14 (commit f1cc3cf), com ressalva: critérios [visual] presumidos (a tela não foi conferida)
Entregue em 2026-10-18 (commit e54f51b)
Entregue em 2026-10-19 (commit 8d01ca8)
Entregue em 2026-10-19 (commit 8ef4091)
