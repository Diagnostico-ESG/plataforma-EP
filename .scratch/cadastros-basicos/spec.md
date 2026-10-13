# Cadastros básicos

Status: ready-for-agent

**Como resolve o problema.** Hoje os setores atendidos e os macroprocessos da Cadeia de Valor vivem em planilhas soltas, sem uma lista única nem o registro de quem mudou o quê. Com esta funcionalidade, a equipe do EP passa a ter, na área Setores da plataforma, um cadastro único de setores (com a sigla que vai para o nome dos arquivos), de macroprocessos e dos setores envolvidos em cada macroprocesso. Administrador e Integrante do EP mantêm os cadastros; a Consulta só vê. Toda alteração, inclusive uma exclusão, fica no histórico com o que o item tinha. As funcionalidades seguintes se apoiam nesses cadastros: o processo nasce ligado a um setor e a um macroprocesso, os arquivos recebem o nome pela sigla, e o painel monta a matriz macroprocesso × setor.

Decisões de origem: `.scratch/cadastros-basicos/sabatina.md` (sabatina de 2026-10-10) e `CONTEXT.md` (seção "Setores"). Sem ADR novo: nenhuma decisão é difícil de desfazer.

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
- **Lista de macroprocessos:** código, nome, categoria, quantidade de setores envolvidos e situação em pílula; "Mostrar inativos"; [Novo macroprocesso].
- **Macroprocesso aberto:** formulário com código, nome, descrição e categoria (seletor com "Sem categoria", Finalístico, Apoio, Gerencial). Abaixo, "Setores envolvidos": lista com sigla, nome, observação editável e [Tirar] em cada linha, e um seletor com os setores ativos ainda não envolvidos mais [Pôr setor]. Pôr, tirar e mudar observação gravam na hora, cada um com a sua mensagem de falha na linha.
- **Validação da sigla na tela, antes de enviar:** retira espaços das pontas, converte para maiúsculas e confere o formato. Mensagem: "A sigla deve ter de 2 a 15 caracteres, só letras sem acento, números ou hífen. Recebido: "{valor}"." O banco confere de novo.
- **Mensagens das recusas, vindas do banco e traduzidas pela interface:**
  - "Já existe um setor com a sigla {SIGLA}."
  - "Já existe um setor com o nome {nome}."
  - "Já existe um macroprocesso com o nome {nome}."
  - "Já existe um macroprocesso com o código {código}."
  - "O setor {SIGLA} já está neste macroprocesso."
  - "Não é possível excluir: {item} tem {n} processos ligados." (só a partir da funcionalidade 3)
  - "Seu perfil não permite alterar os cadastros." (quando o banco recusa por perfil, por exemplo um perfil mudado com a página aberta)
- **Estados de cada lista e de cada item aberto:**
  - carregando: "Carregando setores…", "Carregando macroprocessos…", "Carregando histórico…", com linhas-fantasma nas listas;
  - vazio: "Nenhum setor cadastrado ainda." e "Nenhum macroprocesso cadastrado ainda." (com o botão de criar para quem pode), "Nenhum setor ativo para mostrar." quando só há inativos e a caixa está desmarcada, "Nenhum setor envolvido ainda." no macroprocesso e "Este setor ainda não participa de nenhum macroprocesso." no setor;
  - erro ao carregar, inclusive falha de conexão: "Não foi possível carregar {os setores | os macroprocessos | o histórico}. Verifique a conexão e tente de novo." com [Tentar de novo];
  - item aberto que não existe mais (excluído por outra pessoa): "Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico." com [Voltar à lista];
  - erro de gravação: "A alteração não foi salva: {motivo}. Seus dados continuam no formulário."
- **Confirmação (padrão do ADR 0003, a mesma janela nativa da Administração):** só Excluir pede confirmação. Foco abre no [Cancelar], Esc fecha sem gravar, o botão de confirmar tem o verbo da ação.
  - Setor: título "Excluir o setor {SIGLA}?", texto "{SIGLA} sai de {n} macroprocessos. O histórico guarda o que ele tinha, mas não é possível desfazer.", botões [Excluir setor] [Cancelar]. Com zero macroprocessos, o texto começa por "O histórico guarda…".
  - Macroprocesso: título "Excluir o macroprocesso {nome}?", texto "{n} setores deixam de estar envolvidos nele. O histórico guarda o que ele tinha, mas não é possível desfazer.", botões [Excluir macroprocesso] [Cancelar].
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
