# Processos e etapas

Status: ready-for-agent

**Como resolve o problema.** Hoje o andamento de cada processo fica espalhado entre planilhas e o Power BI, sem saber com certeza em que etapa cada um está, quem cuida dele nem o que mudou. Com esta funcionalidade, a equipe do EP cadastra na plataforma cada processo e subprocesso, ligado ao setor dono e a um macroprocesso, e registra o andamento etapa por etapa, da Modelagem piloto em diante, num caminho que o administrador configura no catálogo de etapas. A área Processos mostra o trabalho vivo num Quadro, com uma coluna por etapa, e o arquivo completo numa Lista com filtros; ao abrir um processo, o painel mostra o caminho de etapas, as ações possíveis e o histórico. O banco impõe a sequência das etapas, a situação do processo, as regras de reclassificação e o registro de cada mudança no histórico. As funcionalidades seguintes (reuniões, documentos, revisões, prazos e painel) se apoiam nesse andamento.

Decisões de origem: `.scratch/processos-etapas/sabatina.md` (sabatina de 2026-10-13, três rodadas), `CONTEXT.md` (seções "Setores" e "Processos") e ADR 0004 (mudar o catálogo muda o caminho dos processos em andamento). Mudança de 2026-10-18 (parte 1 da iniciativa experiencia-do-quadro, `.scratch/experiencia-do-quadro/sabatina-parte-1.md`, ADR 0013): saem as etapas do setor, a coluna "Aguardando o setor", os responsáveis do setor e o nível do catálogo; a primeira etapa passa a se chamar Modelagem piloto; o processo ganha a data da reunião (spec de `reunioes`).

## Problema

O EP acompanha dezenas de processos de vários setores, cada um numa etapa diferente do mapeamento, mas não tem um lugar único que diga em que etapa cada processo está, quem é o responsável por ela, desde quando, e o que foi dispensado ou feito antes da plataforma existir. Processos viram subprocessos (e o contrário) no meio do caminho, e essa mudança não deixa rastro. Sem esse andamento registrado, não há como montar o painel nem os prazos, e não há como provar o que aconteceu com cada processo.

## Solução

- **Área Processos** (item "Quadro" e "Lista" da faixa lateral, alternância Quadro | Lista na barra superior):
  - o **Quadro** mostra os processos em andamento e os suspensos, cada um na coluna da etapa atual; o processo novo entra na coluna Modelagem piloto;
  - a **Lista** mostra todos os processos, de qualquer situação, numa tabela com filtros;
  - nos dois, [Cadastrar processo] para Administrador e Integrante, e clicar num cartão ou numa linha abre o **painel do processo** à direita.
- **Painel do processo:** dados do processo, a data da reunião de modelagem piloto (spec de `reunioes`), o caminho de etapas com as ações, os subprocessos (ou o processo pai), as ações de situação (suspender, cancelar, retomar), reclassificar, editar, excluir e a aba Histórico.
- **Tela do setor** (área Setores, que já existe): ganha a lista dos processos do setor.
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
28. Como integrante do EP, quero abrir o painel de um processo clicando no cartão ou na linha, com o quadro ou a lista esmaecidos atrás.

### Andamento das etapas do processo

29. Como integrante do EP, quero ver no painel o caminho de etapas do processo, da Modelagem piloto em diante, cada uma com status, responsável, datas e nota.
30. Como integrante do EP, quero iniciar a etapa atual, para registrar que o trabalho nela começou.
31. Como integrante do EP, quero que a plataforma recuse iniciar uma etapa enquanto a anterior não estiver resolvida (concluída, realizada anteriormente ou dispensada), explicando qual falta.
32. Como integrante do EP, quero iniciar a Modelagem piloto de um processo recém-cadastrado sem depender de nada do setor, porque identificação e sensibilização já foram feitas fora da plataforma.
33. Como integrante do EP, quero que cada processo tenha no máximo uma etapa em andamento.
34. Como integrante do EP, quero concluir a etapa em andamento.
35. Como integrante do EP, quero dispensar uma etapa opcional, com nota obrigatória, para registrar por que ela não será feita.
36. Como integrante do EP, quero que a plataforma recuse dispensar uma etapa obrigatória.
37. Como integrante do EP, quero registrar qualquer etapa como "realizada anteriormente", com nota obrigatória, para os processos retomados que já fizeram parte do caminho fora da plataforma.
38. Como integrante do EP, quero que a data de início e a de conclusão venham preenchidas com hoje e que eu possa corrigi-las na hora ou depois, para registrar quando o trabalho de fato aconteceu.
39. Como integrante do EP, quero que a plataforma recuse uma data no futuro e uma conclusão antes do início, mostrando a data recebida.
40. Como integrante do EP, quero voltar a uma etapa anterior, com motivo obrigatório: ela volta a "em andamento" e as seguintes já resolvidas voltam a "pendente", para refazer o trabalho quando algo mudou.
41. Como integrante do EP, quero que o histórico guarde como cada etapa estava antes de voltar.
42. Como integrante do EP, quero escolher o responsável de qualquer etapa do processo entre os usuários ativos de perfil Administrador ou Integrante, e trocá-lo a qualquer momento.
43. Como integrante do EP, quero ver o responsável que foi desativado depois marcado como "Inativo" na etapa, sem poder escolhê-lo de novo.
44. Como integrante do EP, quero ver a etapa atual destacada no caminho, as resolvidas com ✓ e as futuras apagadas, como na identidade visual.

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

78. Como integrante do EP, quero ver na aba Histórico do painel todas as alterações do processo e das etapas dele, das mais recentes para as mais antigas, com data e hora, quem fez, o que fez, o antes e depois e o motivo quando houver.
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
88. Como integrante do EP, quero ver na tela do setor a lista dos processos dele, e abrir o painel de cada um.

## Decisões de implementação

### Interface

- **Terceiro módulo injetado:** um módulo de processos, separado dos de acesso e de cadastros. Operações:
  - listar processos com etapa atual, responsável dela e situação calculada;
  - ler um processo com a data da reunião, o caminho de etapas, os subprocessos ou o pai, e o histórico;
  - criar, editar e excluir processo, e marcar a data da reunião (spec de `reunioes`);
  - iniciar, concluir, dispensar e registrar como realizada anteriormente uma etapa;
  - corrigir as datas de uma etapa, mudar o responsável de uma etapa e voltar a uma etapa;
  - suspender, cancelar, retomar e reclassificar um processo;
  - ler os processos de um setor;
  - listar e manter o catálogo de etapas.

  Saem em 2026-10-18: ler e alterar as etapas do setor, e ler, criar, editar e excluir responsáveis do setor.

  O aplicativo recebe o módulo por injeção; nos testes, uma implementação falsa nomeada. A falha chega como erro cuja mensagem é o motivo em português, como nos outros módulos.
- **Navegação no endereço:**
  - `#/processos` para o Quadro e `#/processos/lista` para a Lista, com os filtros no endereço;
  - `#/processos/<id>` abre o painel por cima da visão de onde veio;
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
- **Formulário do processo** (cadastrar e editar, no painel):
  - **Campos:** nome, setor (ativos), macroprocesso (ativos), tipo (só no cadastro: Processo, Subprocesso ou A classificar), processo pai (só para Subprocesso, entre os processos do tipo Processo), origem (Novo ou Retomado), contexto e observações.
  - **Subprocesso:** o macroprocesso aparece fixo, o do pai.
  - **Setor fora do macroprocesso:** quando o setor não é envolvido no macroprocesso, o aviso amarelo "O setor {SIGLA} ainda não está no macroprocesso {nome}; ele será incluído ao salvar." aparece abaixo dos campos.
  - **Tipo na edição:** a edição não muda o tipo; a mudança de tipo é só por Reclassificar.
- **Painel do processo:**
  - **Cabeçalho:** quadradinho da sigla, nome, macroprocesso, pílulas de tipo e de situação, e botão fechar.
  - **Reunião de modelagem piloto:** a linha da data, no lugar da antiga seção Reuniões, depois dos dados e da estrutura e antes das Versões (spec de `reunioes`).
  - **Caminho de etapas:** em cada etapa: status, responsável (seletor para quem pode), datas de início e de conclusão (editáveis para quem pode) e nota. As etapas do setor e o link "Ver no setor" saíram em 2026-10-18.
  - **Ações na etapa atual:**
    - [Iniciar] quando pendente;
    - [Concluir] quando em andamento;
    - [Dispensar] só se opcional;
    - [Realizada anteriormente].
  - **Ações nas etapas resolvidas anteriores à atual:** [Voltar a esta etapa].
  - **Abaixo do caminho:**
    - dados do processo com [Editar];
    - "Subprocessos" (lista, cada um abre o seu painel) ou "Processo pai";
    - ações [Suspender], [Cancelar] ou [Retomar], [Reclassificar] e [Excluir];
    - a aba Histórico.
  - **Processo suspenso ou cancelado:** as ações das etapas somem, e o aviso "Este processo está {suspenso | cancelado}: {motivo}. Retome-o para registrar o andamento." aparece.
- **Janelas com campo obrigatório** (a mesma janela nativa do ADR 0003, com um campo de texto):
  - **Nota:** em Dispensar e Realizada anteriormente.
  - **Motivo:** em Suspender, Cancelar, Retomar, Voltar e Reclassificar.
  - **Botões:** o de confirmar tem o verbo da ação e fica desabilitado com o campo vazio; o foco abre no campo e Esc fecha sem gravar.
  - **Reclassificar:** a janela traz o novo tipo e, para Subprocesso, o pai. Quando o macroprocesso muda, ela mostra o aviso "O item passa do macroprocesso {de} para {para}, o do processo pai."
- **Confirmação simples (ADR 0003)** em Excluir processo e Excluir etapa do catálogo:
  - "Excluir o processo {nome}? O histórico guarda o que ele tinha, inclusive as etapas, mas não é possível desfazer." [Excluir processo] [Cancelar];
  - "Excluir a etapa {nome} do catálogo?" [Excluir etapa] [Cancelar].
- **Tela do setor** ganha, abaixo do que já existe, "Processos do setor": lista com nome, tipo, etapa atual e situação, em que clicar abre o painel. As seções "Responsáveis do setor" e "Etapas do setor" saíram em 2026-10-18.
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
  - "Não é possível excluir: {setor | macroprocesso} tem {n} processos ligados."
  - "O setor {SIGLA} tem {n} processos neste macroprocesso; mova-os ou exclua-os antes."
  - "A etapa {nome} já foi usada; desative-a em vez de excluir."
  - "Seu perfil não permite alterar os processos." (quando o banco recusa por perfil)
- **Estados:**
  - **Carregando:**
    - Quadro: "Carregando processos…", com colunas-fantasma;
    - Lista: "Carregando processos…", com linhas-fantasma;
    - painel: "Carregando processo…";
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
  - **Formato:** o mesmo da lista do Histórico dos cadastros, acrescido do motivo ou da nota.
  - **Textos das ações:**
    - "Criou", "Editou", "Excluiu";
    - "Iniciou a etapa", "Concluiu a etapa", "Dispensou a etapa", "Registrou a etapa como realizada anteriormente", "Voltou à etapa", "Corrigiu as datas da etapa", "Mudou o responsável da etapa";
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

**Gravações com várias linhas** (voltar, reclassificar, suspender, cancelar e retomar com motivo, e mexer no catálogo, que acrescenta ou tira andamentos) passam por funções do banco chamadas pela interface, sem `security definer`, que rodam com a permissão de quem chama. A RLS decide o resto. Iniciar, concluir, dispensar, realizada anteriormente, corrigir datas e mudar responsável também podem ir por funções, se a execução preferir.

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
    - histórico do processo.
  - **Arte anterior:** os testes de tela de cadastros-basicos (`App.setores`, `App.macroprocessos`, `App.historicoDosCadastros`) e a janela de confirmação.
- **Tradução entre o banco e a tela.** Testes pequenos do módulo de processos real com o cliente Supabase simulado. Eles provam que os códigos de recusa do banco viram as mensagens acima e que as linhas do banco e da view viram os tipos da tela. Arte anterior: os testes de `cadastrosSupabase` e `macroprocessosSupabase`.
- **Funções puras** (filtros a partir do endereço, ordem das colunas, textos do histórico): testes unitários pequenos.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras. As transições de estado ganham um teste cada.
  - **Testes gerais:** `00_rls_ligada` e `10_privilegios_padrao` cobrem as tabelas novas sem mudança.
  - **Testes antigos:** conferir os que contam linhas de uma tabela inteira, porque o andamento nascia junto com cada setor (achado do `/ship` de cadastros-basicos).
  - **Simplificação (2026-10-18):** os testes `15_etapas_do_setor` e `16_responsaveis_do_setor` são apagados; `17`, `18`, `19`, `20`, `21` e `22` são ajustados ao catálogo de 6 etapas sem nível (posições mudam: a Revisão interna passa de 6 a 3); um teste novo prova a migração (tabelas e colunas apagadas, catálogo renumerado e renomeado, setor novo sem andamento, Modelagem piloto inicia sem depender do setor, eventos antigos legíveis). Os testes da funcionalidade de documentos (`26` a `31`) que criam processos ou citam etapas pela posição também são conferidos.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todos os processos, setores e usuários dos testes são inventados.

## Fora do escopo

- Reuniões: a data da reunião de modelagem piloto está na spec de `reunioes`; ela não muda nenhuma etapa.
- Etapas do setor e responsáveis do setor: retirados em 2026-10-18 (ADR 0013).
- Envio de fluxogramas e relatórios, versões e o nome dos arquivos: funcionalidade 5. A recusa de excluir processo com documento chega com ela.
- Revisão interna, rodadas com o setor, E-protocolo e a captura de etapa: funcionalidade 6. Vão junto a configuração "etapa capturada ou atribuída a um usuário fixo", a regra 14 (aviso "estrutura alterada após aprovação") e os campos vigência e próxima revisão.
- Conclusão automática de etapas por documento ou revisão: funcionalidades 5 e 6. Hoje todo andamento é manual.
- Prazo padrão das etapas, prazo do andamento e indicador de atraso: funcionalidade 8.
- Campo "fase" (AS-IS ou TO-BE) no catálogo: quando existir a fase 2.
- Mais de um nível de subprocesso.
- Importação de processos: funcionalidade 10.
- Edição simultânea do mesmo item por duas pessoas: vale a última gravação, e as regras de sequência continuam garantidas pelo banco.
- Registro de quem consultou (backlog).

## Observações

- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` O Quadro segue a identidade visual: fundo azul-acinzentado, cartões brancos, colunas por etapa, a linha azul "acesa" no cartão escolhido, e indicação de colunas fora da vista quando o quadro rola para o lado.
  - `[visual]` O painel do processo abre à direita com o quadro esmaecido atrás e o cartão aceso; abaixo de 900px de largura, ocupa a tela inteira.
  - `[visual]` O caminho de etapas mostra as resolvidas com ✓, a atual em azul com o sublinhado aceso e as futuras apagadas; sem etapas do setor (desde 2026-10-18).
  - `[visual]` As pílulas (Suspenso, Cancelado, Concluído, Subprocesso, A classificar, Inativo, Inativa) têm cor e texto, nunca só cor.
  - `[visual]` A Lista é uma tabela compacta, no padrão das listas de cadastros.
  - `[visual]` Para a Consulta, Quadro, Lista, painel, tela do setor e histórico não mostram campos editáveis nem botões de alteração.
  - `[visual]` As janelas de nota e de motivo seguem o padrão da janela de confirmação, com o campo de texto e o botão de confirmar desabilitado enquanto vazio.
  - `[visual]` Mensagens de falha e de recusa em vermelho; avisos (setor que será incluído, macroprocesso que muda) em amarelo.
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
- **Tamanho:** a funcionalidade tem várias entregas. A sabatina permitiu deixar a Lista para um ticket posterior.
- **Rede do escritório:** a migração vai pelo workflow "Migrar banco de desenvolvimento" e precisa ser registrada em `supabase/AMBIENTES.md` para o `migration repair` antes da primeira publicação em produção.
- **Privilégios padrão:** toda tabela ou view nova em `public` reprova o teste `10_privilegios_padrao` até receber o seu `revoke`.

Entregue em 2026-10-14 (commit f1cc3cf), com ressalva: critérios [visual] presumidos (a tela não foi conferida)
Em revisão desde 2026-10-18
