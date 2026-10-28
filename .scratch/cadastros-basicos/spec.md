# Cadastros básicos

Status: ready-for-agent

**Como resolve o problema.** Hoje os setores atendidos e os macroprocessos da Cadeia de Valor vivem em planilhas soltas, sem uma lista única nem o registro de quem mudou o quê. Com esta funcionalidade, a equipe do EP passa a ter, na área Setores da plataforma, um cadastro único de setores (com a sigla que vai para o nome dos arquivos), de macroprocessos e dos setores envolvidos em cada macroprocesso. Administrador e Integrante do EP mantêm os cadastros; a Consulta só vê. Toda alteração, inclusive uma exclusão, fica no histórico com o que o item tinha. As funcionalidades seguintes se apoiam nesses cadastros: o processo nasce ligado a um setor e a um macroprocesso, os arquivos recebem o nome pela sigla, e o painel monta a matriz macroprocesso × setor.

**Cor sólida do setor (mudança de 2026-10-28, spec própria).** A funcionalidade 13, `.scratch/cor-solida-do-setor/spec.md` (ADR 0033), troca o degradê da cor do setor pela cor lisa no tom claro, inclusive no selo dos cadastros, no quadradinho do [Pôr setor] e nas amostras da grade do setor aberto. Onde a seção "Cor do setor" fala em degradê ou nas "duas pontas do degradê", vale aquela.

Decisões de origem: `.scratch/cadastros-basicos/sabatina.md` (sabatina de 2026-10-10) e `CONTEXT.md` (seção "Setores"). Sem ADR novo: nenhuma decisão é difícil de desfazer. Mudança de 2026-10-27 (seção "Cor do setor", logo abaixo, ADR 0030): o setor ganha uma cor; ela vale sobre o resto desta spec no que divergir.

## Cor do setor (mudança de 2026-10-27)

Demanda visual-do-cartao (`.scratch/visual-do-cartao/demanda.md`), decidida na sabatina `.scratch/visual-do-cartao/sabatina.md` e no ADR 0030; tons da paleta no acréscimo de 2026-10-27 em `.scratch/identidade-visual.md`. Termo no `CONTEXT.md`: **Cor do setor**. O uso da cor na área Processos (faixa do cartão, barra, etiquetas, Lista, verso) está na seção "Visual do cartão" da spec de `processos-etapas`.

**Como resolve o problema.** A sigla é o que identifica o setor em toda a plataforma, mas, sendo só texto, a equipe precisa ler cada sigla para reconhecer o setor. Com a **cor do setor**, cada setor ganha uma cor clara própria, guardada no cadastro, que acompanha a sigla em todo lugar. O setor novo já nasce com uma cor ainda livre, e quem cuida dos cadastros pode trocá-la no formulário do setor.

### Solução

- **Paleta fixa de 30 cores claras**, na ordem de distribuição registrada na identidade visual (15 tons em duas intensidades, cores vizinhas bem diferentes entre si). Pode haver vermelho, verde e âmbar em pastel: a cor do setor é identidade, não alerta.
- **Setor novo:** recebe a primeira cor da paleta que nenhum setor usa (ativo ou inativo); com as 30 em uso, a cor 1. A pessoa não escolhe ao criar; vê a cor ao abrir o setor salvo e pode trocá-la ali.
- **Troca:** no setor aberto, Administrador e Integrante do EP veem uma grade com as 30 amostras e escolhem uma; as que outro setor já usa aparecem marcadas ("em uso por {SIGLA}"), sem impedir a escolha. Dois setores podem ficar com a mesma cor. A troca grava junto com o [Salvar] do formulário.
- **Setor inativo** continua com a sua cor, e ela continua contando como "em uso" para o setor novo.
- **Onde aparece nos cadastros:** a sigla na lista de setores, no setor aberto e nas linhas de setor envolvido do macroprocesso vira um selo com a sigla em texto escuro sobre a cor do setor, em degradê (do tom da cor para um tom um pouco mais escuro dela); o seletor [Pôr setor] mostra o quadradinho da cor antes de cada setor. O histórico e os textos das janelas continuam só texto.
- **Histórico:** a cor é aparência e não entra no histórico. Gravar só a cor não cria evento, e os eventos do setor continuam listando nome, sigla, observações e ativo.
- **Setores existentes:** recebem cor na migração, pela ordem alfabética da sigla (o primeiro fica com a cor 1, o segundo com a 2, e assim por diante), sem gerar eventos.

### Histórias de usuário

1. Como Integrante do EP, quero que cada setor tenha uma cor própria, guardada no cadastro, para reconhecer o setor de relance em toda a plataforma.
2. Como Integrante do EP, quero que o setor novo já nasça com uma cor que nenhum outro setor usa, para não ter de escolher nada ao criar e as cores não se repetirem sem querer.
3. Como Integrante do EP, quero que, com as 30 cores em uso, o setor novo receba a primeira da paleta, para o cadastro nunca ser recusado por falta de cor.
4. Como Integrante do EP, quero que a cor de um setor inativo continue reservada para ele, para que, se ele voltar, não divida a cor com um setor criado nesse meio-tempo.
5. Como Integrante do EP, quero ver no setor aberto as 30 amostras da paleta, com a cor atual marcada, para trocar a cor do setor.
6. Como Integrante do EP, quero ver quais amostras já estão em uso por outro setor, e por qual, para evitar repetir sem querer.
7. Como Integrante do EP, quero poder escolher uma cor já usada por outro setor, para decidir eu mesmo quando a repetição não atrapalha.
8. Como Integrante do EP, quero que a troca da cor grave com o [Salvar] do formulário, junto com o resto do setor, para não haver um botão a mais.
9. Como Integrante do EP, quero que, se a gravação falhar, a cor escolhida continue marcada no formulário com a mensagem de falha de hoje, para tentar de novo sem escolher de novo.
10. Como Administrador, quero trocar a cor do setor com as mesmas permissões do Integrante do EP, como o resto do cadastro.
11. Como Consulta, quero ver a cor do setor nas listas e no setor aberto, sem a grade de escolha, para acompanhar sem alterar.
12. Como responsável pela plataforma, quero que o banco recuse a troca de cor feita pela Consulta, por usuário desativado ou por visitante, mesmo fora da tela.
13. Como responsável pela plataforma, quero que o banco recuse uma cor fora de 1 a 30, para nenhum setor ficar sem tom na tela.
14. Como Integrante do EP, quero ver a sigla sobre a cor do setor na lista de setores, para varrer a lista pela cor.
15. Como Integrante do EP, quero ver a sigla sobre a cor do setor no setor aberto, para conferir a cor que ele tem.
16. Como Integrante do EP, quero ver a sigla sobre a cor de cada setor envolvido no macroprocesso aberto, inclusive dos inativos (com a pílula "Inativo"), para reconhecer os setores do mapeamento.
17. Como Integrante do EP, quero ver o quadradinho da cor antes de cada setor no seletor [Pôr setor], para achar o setor pela cor.
18. Como pessoa que usa leitor de tela, quero que cada amostra da grade tenha um nome acessível (o nome da cor e, se for o caso, "em uso por {SIGLA}"), para escolher a cor sem vê-la.
19. Como pessoa que usa leitor de tela, quero que o selo e o quadradinho não acrescentem nada ao nome do setor, para a leitura continuar só pela sigla e pelo nome.
20. Como pessoa que não distingue cores, quero que a sigla esteja sempre escrita sobre a cor, para nunca depender dela.
21. Como Integrante do EP, quero que a sigla em texto escuro tenha contraste AA nas duas pontas do degradê, em qualquer das 30 cores.
22. Como Integrante do EP, quero que trocar só a cor não apareça no histórico, para o histórico continuar falando do que importa no cadastro.
23. Como Integrante do EP, quero que salvar o setor mudando a cor e o nome registre no histórico só a mudança do nome, para o evento não trazer a cor.
24. Como Integrante do EP, quero que os 22 setores já cadastrados recebam cor na ordem alfabética da sigla, sem eventos no histórico, para a plataforma já começar colorida.
25. Como Integrante do EP, quero que a cor de um setor excluído fique livre para o próximo setor novo.

### Decisões de implementação

#### Interface

- **Grade de amostras:** no setor aberto (não no Novo setor), um grupo de 30 botões de rádio nativos com legenda "Cor do setor", cada um desenhado como a amostra em degradê, com nome acessível "{nome da cor}" ou "{nome da cor}, em uso por {SIGLA}" (a primeira sigla, em ordem, quando mais de um setor usa). A amostra escolhida tem a linha acesa. Para a Consulta, a grade não aparece; o selo mostra a cor.
- **Paleta num único ponto:** os nomes e os tons das 30 cores ficam no mesmo módulo puro da cor do setor que a área Processos usa (spec de `processos-etapas`, "Visual do cartão"). O banco só conhece o número.
- **Módulo de cadastros:** `Setor` e os setores envolvidos ganham `cor` (número); listar setores, ler um setor e ler um macroprocesso com os setores envolvidos passam a trazê-la; editar setor passa a enviá-la. Criar setor não envia cor (o banco escolhe). A falsa `CadastrosFalso` imita a regra da primeira cor livre.
- **Selo e quadradinho:** o selo do setor e `OpcaoDaCaixa` com `cor`, os mesmos da área Processos.
- **Mensagens:** nenhuma nova. A falha ao salvar é a de hoje ("A alteração não foi salva: {motivo}. Seus dados continuam no formulário."); a recusa por perfil é a de hoje. Uma cor fora da faixa só chega fora da tela; a recusa do banco aparece como erro de gravação.
- **Estados de carregamento, vazio e erro:** os de hoje, sem tela nova.

#### Modelo de dados

**`setores`** ganha:

| Coluna | Tipo | Obrigatória |
|---|---|---|
| cor | número inteiro de 1 a 30 (posição na paleta) | sim; quando não vem na criação, o banco escolhe |

- **Primeira cor livre:** gatilho antes de incluir. Se a cor não veio, grava o menor número de 1 a 30 que nenhum setor tem (ativo ou inativo); se todos estão em uso, 1. Duas criações ao mesmo tempo podem receber a mesma cor: aceito, porque a repetição é permitida.
- **Histórico:** os gatilhos de evento de `setores` deixam de fora a coluna `cor`, tanto na comparação (gravar só a cor não cria evento) como no antes e depois guardados (inclusive no "antes" da exclusão).
- **Migração (não destrutiva):** acrescenta a coluna, preenche os setores existentes pela ordem alfabética da sigla (posição 1, 2, 3…; acima de 30 recomeça em 1), depois a torna obrigatória com a restrição de 1 a 30, cria o gatilho e concede `cor` nos privilégios por coluna de criar e alterar a quem já tem os outros. O preenchimento não gera eventos, pela regra acima. A view `processos_com_andamento` ganha `setor_cor` na mesma leva (spec de `processos-etapas`).
- **Dado pessoal:** nenhum.

#### Quem pode o quê (cada célula vira um teste pgTAP)

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `setores.cor` ler | sim | sim | sim | não | não |
| `setores.cor` informar na criação | sim | sim | não | não | não |
| `setores.cor` alterar | sim | sim | não | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Cor de 1 a 30 | restrição na coluna | 0 e 31 recusados; 1 e 30 aceitos |
| Setor novo sem cor recebe a primeira livre | gatilho antes de incluir | com as cores 1 e 2 em uso, o novo recebe 3; com 1 e 3, recebe 2 |
| Setor inativo continua ocupando a cor | o gatilho conta todos os setores | com a cor 1 num setor inativo, o novo recebe 2 |
| Com as 30 em uso, a cor 1 | gatilho | com 30 setores cobrindo 1 a 30, o 31º recebe 1 |
| Cor informada na criação é respeitada, mesmo repetida | o gatilho só age quando a cor não veio | criar com a cor 5 já em uso grava 5 |
| Trocar só a cor não vira evento | gatilho de evento sem a coluna `cor` | alterar só a cor não cria evento; alterar cor e nome cria um evento sem `cor` no antes e depois |
| Setores existentes coloridos pela ordem da sigla | migração | depois da migração, nenhum setor sem cor; os setores do teste, em ordem de sigla, têm 1, 2, 3… |

### Decisões de teste

- **Interface (a tela inteira):** com a `CadastrosFalso`: o setor novo aparece com a primeira cor livre; a grade no setor aberto com a cor atual marcada e as em uso com o nome acessível "em uso por {SIGLA}"; trocar e salvar, inclusive por uma cor em uso; falha ao salvar mantendo a escolha; a Consulta sem grade; o selo na lista, no setor aberto e nos setores envolvidos; o quadradinho no seletor [Pôr setor]; o histórico sem evento ao trocar só a cor. Arte anterior: `App.editarSetor`, `App.novoSetor`, `App.setoresEnvolvidos`, `App.historicoDosCadastros`.
- **Tradução entre o banco e a tela:** os testes de `cadastrosSupabase` e `macroprocessosSupabase` com o cliente simulado passam a ler e enviar `cor`.
- **Funções puras:** a paleta (spec de `processos-etapas`) e, se existir, a que monta o nome acessível da amostra com as siglas em uso.
- **Banco:** pgTAP, um teste por célula e por regra das tabelas acima, mais os de `11_setores` que olham os eventos do setor (sem `cor`). Os testes vêm antes da migração e falham sem ela. Rodam no Docker local durante o desenvolvimento e pelo GitHub Actions ("Testes de banco") na conferência final.
- Todos os setores dos testes são inventados.

### Fora do escopo desta parte

- Escolher a cor no Novo setor (ela é escolhida pelo banco e trocada depois).
- Proibir cores repetidas, ou ampliar a paleta além de 30.
- Cor do macroprocesso: continua calculada como hoje (`corDoMacroprocesso`).
- Cor no histórico, nos textos das janelas e nos nomes de arquivo.
- Ajustar os tons da paleta: muda só o módulo da tela, sem migração, quando for preciso.

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. A grade só aparece no setor aberto; no Novo setor, o banco escolhe e a pessoa troca depois, se quiser. Assim a regra da primeira cor livre mora só no banco.
2. A grade é feita de botões de rádio nativos (um grupo com legenda), cada um com nome acessível.
3. Com mais de 30 setores na migração, a cor recomeça em 1 (hoje são 22).
4. A amostra em uso por mais de um setor diz só a primeira sigla, em ordem.

### Divergência com `.scratch/especificacao.md`

Nenhuma: a especificação não trata de cores do setor.

### Critérios conferidos olhando a tela

- `[visual]` A grade das 30 amostras cabe no formulário do setor sem rolar para os lados, com a escolhida em linha acesa e as em uso marcadas de forma discreta, inclusive em 1366×768.
- `[visual]` O selo da sigla na lista de setores, no setor aberto e nos setores envolvidos tem o mesmo tamanho e a mesma cor do selo da Lista de processos, legível nas 30 cores.
- `[visual]` O quadradinho do seletor [Pôr setor] segue o do macroprocesso nas caixas de seleção.

### Critérios de pronto

- Setor novo com a primeira cor livre, troca pela grade, cor fora do histórico e os 22 setores coloridos pela migração, como descrito.
- `npm test` verde; testes de banco verdes no Docker local e no "Testes de banco".

## Problema

O EP trabalha por setor e por macroprocesso, mas não tem um lugar único onde esses cadastros estejam corretos. A sigla do setor entra no nome de cada arquivo (`SIGLA_V6_Nome do processo`), então duas siglas iguais ou uma sigla com acento quebram o padrão. Saber quais setores participam de cada macroprocesso é a base para ver o que falta mapear, e hoje essa informação não tem registro nem histórico. Sem esses cadastros, as funcionalidades de processos, documentos e painel não têm onde se apoiar.

## Solução

Na faixa lateral, o item Setores (que já existe) passa a abrir a área Setores, com três seções: **Setores**, **Macroprocessos** e **Histórico**.

- Em **Setores**, a pessoa vê a lista dos setores ativos (sigla, nome e quantos macroprocessos), pode mostrar também os inativos, e Administrador ou Integrante criam, editam, desativam, reativam e excluem setores. Ao abrir um setor, aparecem os macroprocessos de que ele participa, só para leitura.
- Em **Macroprocessos**, a mesma coisa para os macroprocessos (código, nome, categoria e quantos setores), e no formulário do macroprocesso se escolhem os setores envolvidos, cada um com uma observação opcional sobre o seu papel.
- Em **Histórico**, todas as alterações dos cadastros, das mais recentes para as mais antigas, com filtro por item. Os itens excluídos aparecem ali com o que tinham.

A Consulta vê as três seções sem nenhum botão de alteração. O banco impõe tudo isso: quem não pode alterar é recusado mesmo que tente fora da tela.

## Histórias de usuário

### Setores

1. Como integrante do EP, quero ver a lista de setores com sigla, nome e quantidade de macroprocessos, ordenada pela sigla, para achar um setor rapidamente.
2. Como integrante do EP, quero que a lista mostre só os setores ativos, com a opção "Mostrar inativos", para que setores extintos não atrapalhem o dia a dia.
3. Como integrante do EP, quero ver os setores inativos marcados com a pílula "Inativo" quando escolho mostrá-los, para não confundi-los com os ativos.
4. Como integrante do EP, quero cadastrar um setor com nome, sigla e observações, para que ele possa receber processos.
5. Como integrante do EP, quero que a sigla seja gravada em maiúsculas mesmo que eu digite em minúsculas, para que o nome dos arquivos siga um padrão só.
6. Como integrante do EP, quero que a plataforma recuse uma sigla com espaço, sublinhado, acento ou símbolo, ou com menos de 2 ou mais de 15 caracteres, mostrando o que eu digitei e o formato aceito, para corrigir na hora.
7. Como integrante do EP, quero que a plataforma recuse uma sigla que já existe, mesmo escrita com outras maiúsculas e minúsculas, para que dois setores nunca gerem arquivos com o mesmo nome.
8. Como integrante do EP, quero que a plataforma recuse um nome de setor que já existe, para não haver dois cadastros do mesmo setor.
9. Como integrante do EP, quero que o nome e a sigla sejam obrigatórios, e as observações opcionais.
10. Como integrante do EP, quero editar o nome, a sigla e as observações de um setor, para acompanhar reestruturações.
11. Como integrante do EP, quero que, ao mudar a sigla, os arquivos já enviados mantenham o nome antigo, para não perder a referência ao que foi enviado (regra 18 da especificação; os arquivos chegam na funcionalidade 5).
12. Como integrante do EP, quero abrir um setor e ver os macroprocessos de que ele participa, só para leitura, para entender onde ele atua.
13. Como integrante do EP, quero desativar um setor que deixou de existir, para que ele saia das listas de escolha sem apagar o que já foi registrado.
14. Como integrante do EP, quero que um setor desativado continue como setor envolvido nos macroprocessos em que estava, marcado "Inativo", para não perder a história do mapeamento.
15. Como integrante do EP, quero reativar um setor desativado.
16. Como integrante do EP, quero excluir um setor cadastrado por engano, depois de confirmar numa janela que diz de quantos macroprocessos ele vai sair, para corrigir o cadastro sem deixar lixo.
17. Como integrante do EP, quero que excluir um setor o tire de todos os macroprocessos de uma vez.
18. Como integrante do EP, quero que, quando houver processos (funcionalidade 3), o banco recuse excluir um setor que tenha processo ligado e explique o motivo, para não apagar trabalho por engano.
19. Como integrante do EP, quero ver uma mensagem clara e os meus dados mantidos no formulário quando uma gravação falhar, para tentar de novo sem redigitar.

### Macroprocessos

20. Como integrante do EP, quero ver a lista de macroprocessos com código, nome, categoria e quantidade de setores envolvidos, ordenada pelo código, com os sem código depois, em ordem alfabética.
21. Como integrante do EP, quero que a lista mostre só os ativos, com a opção "Mostrar inativos", e os inativos marcados com a pílula "Inativo".
22. Como integrante do EP, quero cadastrar um macroprocesso com nome, código, descrição e categoria (finalístico, apoio ou gerencial), em que só o nome é obrigatório.
23. Como integrante do EP, quero que a plataforma recuse um nome de macroprocesso que já existe.
24. Como integrante do EP, quero que a plataforma recuse um código que já exista em outro macroprocesso, e aceite vários macroprocessos sem código.
25. Como integrante do EP, quero editar qualquer campo de um macroprocesso, inclusive o nome, a qualquer momento.
26. Como integrante do EP, quero escolher no formulário do macroprocesso os setores envolvidos, entre os setores ativos, para registrar quem participa dele.
27. Como integrante do EP, quero escrever, para cada setor envolvido, uma observação opcional sobre o papel dele no macroprocesso.
28. Como integrante do EP, quero tirar um setor de um macroprocesso e pô-lo em outro, para corrigir o mapeamento.
29. Como integrante do EP, quero que a plataforma não deixe o mesmo setor entrar duas vezes no mesmo macroprocesso.
30. Como integrante do EP, quero que um macroprocesso possa ficar sem nenhum setor enquanto o planejamento não termina.
31. Como integrante do EP, quero ver, entre os setores envolvidos, os que estão inativos marcados como "Inativo", e não ver setores inativos na lista de setores que posso acrescentar.
32. Como integrante do EP, quero desativar e reativar um macroprocesso.
33. Como integrante do EP, quero excluir um macroprocesso, depois de confirmar numa janela que diz quantos setores deixam de estar envolvidos nele.
34. Como integrante do EP, quero que, quando houver processos, o banco recuse excluir um macroprocesso com processo ligado e explique o motivo.

### Histórico

35. Como integrante do EP, quero ver o histórico de todas as alterações de setores, macroprocessos e setores envolvidos, das mais recentes para as mais antigas, com data e hora, quem fez, o que fez e o antes e depois.
36. Como integrante do EP, quero filtrar o histórico por um setor ou macroprocesso, inclusive um que já foi excluído, para responder "o que aconteceu com este item?".
37. Como integrante do EP, quero que o histórico de uma exclusão traga todos os campos que o item tinha, inclusive os setores envolvidos, para saber o que existia depois que ele sumiu.
38. Como integrante do EP, quero que pôr ou tirar um setor de um macroprocesso, e mudar a observação dele ali, apareçam no histórico com a sigla do setor e o nome do macroprocesso.
39. Como integrante do EP, quero ver "Nenhuma alteração registrada ainda." quando o histórico estiver vazio.
40. Como qualquer usuário, quero que nenhum registro do histórico possa ser alterado ou apagado pela plataforma, para que ele sirva de prova.

### Perfis

41. Como administrador, quero ter as mesmas permissões do Integrante do EP nos cadastros.
42. Como usuário de perfil Consulta, quero ver setores, macroprocessos, setores envolvidos e o histórico dos cadastros, sem nenhum botão de alteração.
43. Como responsável pela plataforma, quero que o banco recuse qualquer criação, alteração ou exclusão feita por um usuário de perfil Consulta, mesmo fora da tela.
44. Como responsável pela plataforma, quero que um visitante sem login e um usuário inativo não leiam nada dos cadastros nem do histórico deles.
45. Como responsável pela plataforma, quero que o histórico dos cadastros seja lido por todos os perfis ativos sem abrir o histórico de usuários, que continua só do Administrador (traz e-mails).

## Decisões de implementação

### Interface

- **Segundo módulo injetado:** a interface fala com o banco nos cadastros por um módulo de cadastros novo e separado do módulo de acesso, que continua cuidando só do login e da administração de usuários. Operações: listar setores (com a quantidade de macroprocessos), ler um setor com os macroprocessos dele, criar, editar, desativar, reativar e excluir setor; listar macroprocessos (com a quantidade de setores), ler um macroprocesso com os setores envolvidos, criar, editar, desativar, reativar e excluir macroprocesso; pôr e tirar setor de um macroprocesso e mudar a observação; listar o histórico dos cadastros. O aplicativo recebe os dois módulos por injeção. Em produção, o módulo usa o cliente Supabase com a chave publicável; nos testes, uma implementação falsa nomeada, separada da falsa do acesso. Falha de gravação chega como erro cuja mensagem é o motivo em português, como no módulo de acesso.
- **Navegação:** a área Setores ganha tela e fica no endereço (`#/setores`), como a Administração, para sobreviver ao recarregar a página. O item da faixa lateral aparece para os três perfis.
- **Três seções na área Setores:** Setores, Macroprocessos e Histórico, escolhidas por abas no topo da área. A seção atual também fica no endereço.
- **Lista de setores:** tabela compacta, no padrão da lista de usuários, com sigla, nome, quantidade de macroprocessos e situação em pílula (só para inativos). Caixa "Mostrar inativos", desmarcada ao abrir. Botão [Novo setor] para Administrador e Integrante. Clicar numa linha abre o setor.
- **Setor aberto:** formulário com nome, sigla e observações, e abaixo a lista "Macroprocessos em que participa" (código e nome, só leitura, com a observação do papel). Para Administrador e Integrante: [Salvar], [Desativar] ou [Reativar] e [Excluir]. Para a Consulta, os mesmos dados sem campos editáveis e sem botões.
- **Lista de macroprocessos:** código, nome, categoria, quantidade de setores envolvidos e situação em pílula; "Mostrar inativos"; [Novo macroprocesso]. A ordem pelo código é a alfabética do texto ("MP10" vem antes de "MP2"); revisar quando o formato dos códigos da Cadeia de Valor for conhecido (backlog, item 11.7).
- **Macroprocesso aberto:** formulário com código, nome, descrição e categoria (seletor com "Sem categoria", Finalístico, Apoio, Gerencial). Abaixo, "Setores envolvidos": lista com sigla, nome, observação editável e [Tirar] em cada linha, e um seletor com os setores ativos ainda não envolvidos mais [Pôr setor]. Pôr, tirar e mudar observação gravam na hora, cada um com a sua mensagem de falha na linha.
- **Validação da sigla na tela, antes de enviar:** retira espaços das pontas, converte para maiúsculas e confere o formato. Mensagem: "A sigla deve ter de 2 a 15 caracteres, só letras sem acento, números ou hífen. Recebido: "{valor}"." O banco confere de novo.
- **Nome obrigatório, conferido na tela:** "O nome do setor é obrigatório." e "O nome do macroprocesso é obrigatório."
- **Mensagens das recusas, vindas do banco e traduzidas pela interface:**
  - "Já existe um setor com a sigla {SIGLA}."
  - "Já existe um setor com o nome {nome}."
  - "Já existe um macroprocesso com o nome {nome}."
  - "Já existe um macroprocesso com o código {código}."
  - "O setor {SIGLA} já está neste macroprocesso."
  - "Não é possível excluir: {item} tem {n} processos ligados." (só a partir da funcionalidade 3)
  - "Seu perfil não permite alterar os cadastros." (quando o banco recusa por perfil, por exemplo um perfil mudado com a página aberta)
- **Estados de cada lista e de cada item aberto:**
  - carregando: "Carregando setores…", "Carregando macroprocessos…", "Carregando histórico…", com linhas-fantasma nas listas; no item aberto, "Carregando setor…" e "Carregando macroprocesso…";
  - vazio: "Nenhum setor cadastrado ainda." e "Nenhum macroprocesso cadastrado ainda." (com o botão de criar para quem pode), "Nenhum setor ativo para mostrar." e "Nenhum macroprocesso ativo para mostrar." quando só há inativos e a caixa está desmarcada, "Nenhum setor envolvido ainda." no macroprocesso e "Este setor ainda não participa de nenhum macroprocesso." no setor;
  - erro ao carregar, inclusive falha de conexão: "Não foi possível carregar {os setores | os macroprocessos | o histórico}. Verifique a conexão e tente de novo." com [Tentar de novo];
  - item aberto que não existe mais (excluído por outra pessoa): "Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico." com [Voltar à lista];
  - erro de gravação: "A alteração não foi salva: {motivo}. Seus dados continuam no formulário."
- **Confirmação (padrão do ADR 0003, a mesma janela nativa da Administração):** só Excluir pede confirmação. Foco abre no [Cancelar], Esc fecha sem gravar, o botão de confirmar tem o verbo da ação.
  - Setor: título "Excluir o setor {SIGLA}?", texto "{SIGLA} sai de {n} macroprocessos. O histórico guarda o que ele tinha, mas não é possível desfazer.", botões [Excluir setor] [Cancelar]. Com um macroprocesso, "{SIGLA} sai de 1 macroprocesso."; com zero, o texto começa por "O histórico guarda…".
  - Macroprocesso: título "Excluir o macroprocesso {nome}?", texto "{n} setores deixam de estar envolvidos nele. O histórico guarda o que ele tinha, mas não é possível desfazer.", botões [Excluir macroprocesso] [Cancelar]. Com um setor, "1 setor deixa de estar envolvido nele."; com zero, o texto começa por "O histórico guarda…".
  - Desativar, Reativar e Tirar setor não pedem confirmação: todos se desfazem com um clique.
- **Cores das mensagens (ADR 0003):** vermelho para tudo que diz "a ação não aconteceu" (erro ao carregar, erro de gravação, recusas); amarelo só para aviso.
- **Histórico dos cadastros:** lista no padrão do Histórico de usuários (data e hora, autor, ação, item, antes e depois). Filtro "Item" com todos os setores e macroprocessos que aparecem no histórico, inclusive os excluídos, identificados pelo nome guardado no evento mais recente. Textos das ações: "Criou", "Editou", "Desativou", "Reativou", "Excluiu", "Pôs o setor no macroprocesso", "Tirou o setor do macroprocesso", "Mudou a observação do setor no macroprocesso". Um evento de setor envolvido entra no filtro dos dois itens (setor e macroprocesso), pelos dois ids da referência; um setor ou macroprocesso que só aparece em eventos de vínculo entra no filtro pela sigla ou pelo nome do evento. Leitura: a política "eventos: perfil ativo lê os cadastros" libera só as entidades `setor`, `macroprocesso` e `setor_envolvido` a todo perfil ativo; os eventos de usuários e autorizações seguem só com o Administrador.

### Modelo de dados

Migração não destrutiva: cria um tipo, três tabelas, funções de gatilho e uma política nova de leitura em `eventos`. Nenhuma tabela existente muda de estrutura.

**Tipo `categoria_macroprocesso`**: `finalistico`, `apoio`, `gerencial`.

**`setores`**

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| nome | texto, sem espaços nas pontas, 1 a 200 caracteres, único sem diferenciar maiúsculas | sim |
| sigla | texto, 2 a 15 caracteres, só `A-Z`, `0-9` e hífen, gravado em maiúsculas, único | sim |
| observacoes | texto, até 2000 caracteres | não |
| ativo | booleano, padrão verdadeiro | sim |
| criado_em | data e hora | sim |

**`macroprocessos`**

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid gerado | sim |
| codigo | texto, sem espaços nas pontas, até 20 caracteres, único quando preenchido (vazio vira nulo) | não |
| nome | texto, sem espaços nas pontas, 1 a 200 caracteres, único sem diferenciar maiúsculas | sim |
| descricao | texto, até 2000 caracteres | não |
| categoria | categoria_macroprocesso | não |
| ativo | booleano, padrão verdadeiro | sim |
| criado_em | data e hora | sim |

**`setores_envolvidos`** (o setor envolvido num macroprocesso)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| macroprocesso_id | uuid, referência a `macroprocessos`, apaga junto | sim (chave, com setor_id) |
| setor_id | uuid, referência a `setores`, apaga junto | sim (chave, com macroprocesso_id) |
| observacao | texto, até 500 caracteres | não |
| criado_em | data e hora | sim |

**`eventos`** (já existe): passa a receber as entidades `setor`, `macroprocesso` e `setor_envolvido`, com as ações `criar`, `editar`, `desativar`, `reativar` e `excluir`. Para `setor_envolvido`, `criar` é pôr o setor, `excluir` é tirá-lo e `editar` é mudar a observação. `entidade_ref` é o id do setor ou do macroprocesso; no setor envolvido, os dois ids. `detalhes` guarda antes e depois com os campos legíveis (sigla e nome do setor, código e nome do macroprocesso), para que o histórico continue legível depois de uma exclusão. Na exclusão de um setor ou macroprocesso, o "antes" traz todos os campos e a lista dos setores envolvidos.

**Forma dos eventos de setor envolvido e da exclusão (definida na execução do ticket 04, para o histórico ler):** o evento de `setor_envolvido` tem `entidade_ref = "<macroprocesso_id>:<setor_id>"` e, em `antes` e `depois`, as chaves `setor_id`, `setor_sigla`, `macroprocesso_id`, `macroprocesso_nome` e `observacao`. O `antes` do evento `excluir` de um setor traz, além dos campos dele, `macroprocessos: [{macroprocesso_id, codigo, nome, observacao}]`; o de um macroprocesso traz `setores: [{setor_id, sigla, nome, observacao}]`; a chave existe sempre, vazia quando não havia vínculo. Para os eventos de "tirar" da exclusão em cascata terem sigla e nome legíveis, a exclusão de setor e de macroprocesso passa por um gatilho antes de apagar, que tira os vínculos (cada um gera o seu evento) e só então grava a exclusão; a referência que apaga junto fica como rede de segurança.

**Derivado, não guardado:** a quantidade de macroprocessos de um setor e a de setores de um macroprocesso são contadas na leitura. Se virar view, nasce com `security_invoker = true`.

**Dado pessoal e quem vê:** nenhuma das três tabelas novas guarda dado pessoal (o responsável do setor foi para a funcionalidade 3). Em `eventos`, os eventos dos cadastros trazem só o autor, cujo nome todos os usuários ativos já veem em `usuarios`. Os eventos de usuários e autorizações continuam só do Administrador, porque trazem e-mails.

**Privilégios padrão:** cada tabela nova nasce com `revoke all` de visitante e de logado e concede de volta só ler, incluir, alterar e apagar a logado, com a RLS decidindo o resto. Assim o teste geral de privilégios padrão (`10_privilegios_padrao`) continua passando.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `setores` ler | sim | sim | sim | não | não |
| `setores` criar | sim | sim | não | não | não |
| `setores` alterar nome, sigla, observações, ativo | sim | sim | não | não | não |
| `setores` alterar id, criado_em | não | não | não | não | não |
| `setores` apagar | sim | sim | não | não | não |
| `macroprocessos` ler | sim | sim | sim | não | não |
| `macroprocessos` criar | sim | sim | não | não | não |
| `macroprocessos` alterar código, nome, descrição, categoria, ativo | sim | sim | não | não | não |
| `macroprocessos` alterar id, criado_em | não | não | não | não | não |
| `macroprocessos` apagar | sim | sim | não | não | não |
| `setores_envolvidos` ler | sim | sim | sim | não | não |
| `setores_envolvidos` criar | sim | sim | não | não | não |
| `setores_envolvidos` alterar observação | sim | sim | não | não | não |
| `setores_envolvidos` alterar macroprocesso_id, setor_id, criado_em | não | não | não | não | não |
| `setores_envolvidos` apagar | sim | sim | não | não | não |
| `eventos` dos cadastros ler | sim | sim | sim | não | não |
| `eventos` de usuários e autorizações ler | sim (já existe) | não | não | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos incluem) | não | não | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Sigla no formato e em maiúsculas | gatilho antes de incluir e alterar, mais restrição de formato | " cee " é guardada como "CEE"; "C E", "CEE_PR", "CÊE", "C" e uma de 16 caracteres são recusadas |
| Sigla única | restrição de unicidade sobre o valor já em maiúsculas | "cee" recusada quando "CEE" existe |
| Nome do setor único, sem diferenciar maiúsculas e espaços nas pontas | índice único sobre o nome normalizado | "Assessoria jurídica " recusado quando "Assessoria Jurídica" existe |
| Nome do macroprocesso único, idem | idem | idem |
| Código do macroprocesso único quando preenchido; vazio vira nulo | gatilho que troca vazio por nulo e índice único | dois macroprocessos sem código aceitos; dois com "MP01" recusados; "" guardado como nulo |
| Mesmo setor uma vez só por macroprocesso | chave composta | pôr CEE duas vezes no mesmo macroprocesso é recusado |
| Excluir setor ou macroprocesso tira os setores envolvidos | referência que apaga junto | excluir o setor apaga as linhas dele em `setores_envolvidos` |
| Toda mudança vira evento, com autor, antes e depois | gatilhos depois de incluir, alterar e apagar nas três tabelas | cada ação gera o evento esperado; a exclusão traz no "antes" todos os campos e os setores envolvidos; a exclusão em cascata também gera os eventos de "tirar setor" |
| Observação do setor envolvido sem espaços nas pontas; vazia vira nulo | gatilho antes de incluir e alterar | coberto pelos testes de `13_setores_envolvidos` |
| Gravação que não muda nenhum campo não vira evento | os gatilhos de evento comparam antes e depois | "gravação sem mudança não gera evento" em `11` e `12`; em `setores_envolvidos` a mesma regra existe, sem teste próprio |
| Desativar e reativar viram ação própria no histórico | o gatilho de alteração registra `desativar` ou `reativar` quando só `ativo` muda | `ativo` de verdadeiro para falso gera `desativar` |
| Evento não se altera nem se apaga | sem política de alteração e de exclusão (já existe) | tentativa de alterar e de apagar recusada |
| Excluir setor ou macroprocesso com processo ligado é recusado | na funcionalidade 3: a referência do processo ao setor e ao macroprocesso recusa a exclusão | fica para os testes da funcionalidade 3; aqui só se registra a exigência |

#### Regras de estado

Setor e macroprocesso: Ativo ⇄ (desativar / reativar) ⇄ Inativo; nos dois estados, Excluir apaga de vez (enquanto nenhum processo depende dele). Desativar não mexe nos setores envolvidos. Nenhum campo é derivado da situação.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer (textos, botões, mensagens) ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de cadastros (setores, macroprocessos, setores envolvidos, histórico e falhas programáveis) ao lado da falsa do acesso. Cobre: as três seções para cada perfil (Consulta sem botões); criar, editar, desativar, reativar e excluir setor e macroprocesso, com sucesso e com falha (formulário mantido e mensagem); a validação da sigla na tela com o valor recebido; cada mensagem de recusa do banco; pôr, tirar e mudar a observação de setor envolvido; o seletor sem setores inativos e sem os já envolvidos; "Mostrar inativos"; a ordem das listas; a janela de exclusão com os textos acima, Cancelar e Esc sem gravar; o item que não existe mais; os estados de carregando, vazio e erro de cada lista e do histórico; o filtro do histórico, inclusive por item excluído. Arte anterior: os testes de Administração e de Histórico do login-perfis.
- **Tradução entre o banco e a tela.** Testes pequenos do módulo de cadastros real com o cliente Supabase simulado: códigos de recusa do banco viram as mensagens acima, e as linhas do banco viram os tipos da tela. Arte anterior: o teste do módulo de administração de usuários.
- **Validação da sigla e textos do histórico:** testes unitários pequenos das funções puras.
- **Banco.** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras. Os testes gerais existentes (`00_rls_ligada` e `10_privilegios_padrao`) passam a cobrir as tabelas novas sem mudança. Os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco").
- Todos os setores e macroprocessos dos testes são inventados (siglas e nomes fictícios).

## Fora do escopo

- Responsáveis do setor (nome, e-mail, cargo): vão para a funcionalidade 3, junto com a etapa 1 (backlog).
- Processos, e por isso a recusa de exclusão com processo ligado e a regra "o setor do processo precisa ser setor envolvido no macroprocesso dele": funcionalidade 3. Mover processo entre macroprocessos e o que acontece ao tirar de um macroprocesso um setor com processos nele: sabatina da funcionalidade 3 (backlog).
- Editar os setores envolvidos pelo lado do setor (a tela do setor só mostra).
- Restaurar um item excluído por botão: o histórico mostra o que havia; recriar é manual.
- Importação de setores e macroprocessos de planilha: funcionalidade 10.
- Edição simultânea do mesmo item por duas pessoas: vale a última gravação.
- Registro de quem consultou os cadastros (backlog).

## Observações

- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` A área Setores segue a identidade visual, com as três abas no topo e a aba atual destacada.
  - `[visual]` As listas são tabelas compactas, no padrão da lista de usuários, e a pílula "Inativo" tem cor e texto (nunca só cor).
  - `[visual]` Para a Consulta, setor e macroprocesso abertos não mostram campos editáveis nem botões de alteração.
  - `[visual]` No macroprocesso aberto, a lista de setores envolvidos, as observações editáveis e o seletor [Pôr setor] ficam alinhados, sem quebrar a linha.
  - `[visual]` A janela de exclusão segue o padrão da Administração (fundo esmaecido, botão principal azul, Cancelar com foco visível).
  - `[visual]` Mensagens de falha e de recusa em vermelho; avisos em amarelo.
- **Divergências com `.scratch/especificacao.md`**, decididas na sabatina de 2026-10-10:
  - o setor não tem responsável (nome, e-mail, cargo): ele vai para a funcionalidade 3, com a etapa 1;
  - o código do macroprocesso é opcional (a especificação não dizia);
  - macroprocessos e os setores de cada um ficam na área Setores, e não na Administração (tela 7);
  - a especificação previa "ativo" só no macroprocesso; o setor também ganhou, e os dois podem ser excluídos.
- Na rede do escritório, a migração vai à mão pelo SQL Editor e precisa ser registrada em `supabase/AMBIENTES.md` para o `migration repair` antes da primeira publicação em produção.

Entregue em 2026-10-13 (commit 3a552d3)

Entregue em 2026-10-27 (commit 764e74d), com ressalva: critérios [visual] da mudança visual-do-cartao presumidos (a tela nunca foi vista com o login real; vista só a faixa por etapa na cor 1, na vitrine local com módulos falsos: faltam o nome na faixa por setor, a faixa do parado, as 30 cores e nome longo, os selos do verso, da Lista e do título da coluna, o quadradinho das caixas, a grade de cores, a barra lisa e as etiquetas vivas); revisão de segurança foi a de reserva (menos completa: o /security-review só viu documentação); painel do Supabase de desenvolvimento não reconferido; função arquivos-no-drive ainda sem nova publicação no desenvolvimento; as ressalvas das entregas anteriores seguem valendo

Entregue em 2026-10-28 (commit 31544ac), com ressalva: critérios [visual] 5 a 7 de cor-solida-do-setor presumidos no app real (vistos só numa página de teste com as folhas de estilo reais e marcação montada à mão; a tela com o login real não foi vista); revisão de segurança dispensada (só CSS e um módulo puro de cor, sem login, dado de fora ou banco)
