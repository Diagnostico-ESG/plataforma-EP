# Login e perfis

Status: ready-for-agent

**Como resolve o problema.** Hoje qualquer pessoa com o endereço da plataforma veria tudo, e não há como saber quem fez o quê. Com esta funcionalidade, só entra quem tem conta institucional `@ccivil.pr.gov.br` **e** foi autorizado por um administrador. Cada usuário tem um perfil (Administrador, Integrante do EP ou Consulta) que o banco impõe em cada leitura e gravação. O administrador gere tudo pela própria plataforma (autorizar, mudar perfil, desativar, reativar, corrigir nome), e cada uma dessas mudanças fica no histórico. As funcionalidades seguintes se apoiam nisso para saber quem pode editar processos, quem enviou cada versão e quem revisou.

Decisões de origem: `CONTEXT.md` (seção "Acesso"), `docs/adr/0001-login-google-institucional-com-autorizacao.md`, `docs/adr/0002-usuario-que-ja-entrou-nao-se-exclui.md` e `docs/adr/0003-foto-acompanha-google-e-confirmacao-na-administracao.md` (mudanças de 2026-10-08: foto que acompanha o Google, Salvar/Cancelar no perfil, confirmação de Excluir e Desativar, cores das mensagens).

## Problema

A equipe do EP (6 pessoas hoje, até 10) precisa de uma plataforma de trabalho com dados pessoais (nomes e e-mails de servidores) e com responsabilidades distintas: alguns administram, a maioria trabalha nos processos, e alguns só consultam. Sem login, não há como restringir o acesso, aplicar a LGPD (mínimo necessário) nem registrar quem fez cada alteração. Senhas próprias trariam o custo de recuperação de senha por e-mail, que depende de um servidor de e-mail que o CED não tem configurado.

## Solução

A pessoa abre a plataforma e vê uma tela de entrada com um único botão, "Entrar com a conta institucional". Ela escolhe a conta Google `@ccivil.pr.gov.br` e volta para a plataforma já dentro, no Quadro de processos, com o próprio avatar (foto do Google ou iniciais) na barra superior. Se a conta não for institucional, não tiver sido autorizada ou estiver inativa, a entrada é recusada com uma mensagem clara do que fazer.

O administrador tem a área Administração > Usuários, onde vê todos os usuários e as autorizações aguardando primeiro acesso, autoriza novos e-mails com o perfil de cada um, muda perfis, desativa e reativa usuários, corrige nomes, exclui autorizações que ainda não foram usadas e consulta o histórico dessas mudanças. O banco impede que o sistema fique sem administrador ativo.

## Histórias de usuário

### Entrada e saída

1. Como integrante da equipe, quero entrar com a minha conta Google institucional, para não ter mais uma senha para lembrar.
2. Como integrante da equipe, quero que a plataforma lembre a minha sessão enquanto ela for válida, para não ter de entrar a cada vez que abro a página.
3. Como pessoa sem autorização, quero ver uma mensagem dizendo que a minha conta ainda não foi autorizada e que devo pedir a um administrador, para saber o que fazer.
4. Como pessoa que escolheu por engano uma conta pessoal (por exemplo, `@gmail.com`), quero ver uma mensagem dizendo que só a conta `@ccivil.pr.gov.br` é aceita, para tentar de novo com a conta certa.
5. Como usuário inativo, quero ver "Seu acesso está inativo. Fale com um administrador.", para entender por que não entro.
6. Como usuário, quero ver enquanto a plataforma confere o meu acesso uma indicação de que está verificando, para não achar que travou.
7. Como usuário, quero ver uma mensagem de falha de conexão com a opção de tentar de novo quando o banco não responde, para não confundir falha de rede com falta de acesso.
8. Como usuário, quero ver o meu avatar (foto da conta Google ou, se não houver, as minhas iniciais) na barra superior, para confirmar com que conta estou.
9. Como usuário, quero abrir um menu pelo avatar com o meu nome, o meu perfil e o botão Sair, para saber com que permissões estou e encerrar a sessão.
10. Como usuário, quero sair da plataforma e voltar à tela de entrada, para encerrar o uso num computador compartilhado.
55. Como usuário, quero que, se o Sair falhar (por exemplo, sem conexão), a plataforma confira se o navegador ainda guarda o meu login: se não guarda, eu volto à tela de entrada como num Sair normal; se ainda guarda, eu continuo dentro com a mensagem "Não foi possível sair. Verifique a conexão e tente de novo." em vermelho no menu da conta. Assim a tela nunca diz que saí sem ter saído, nem o contrário. (correção de bug, 2026-10-08)
11. Como pessoa que entra pela primeira vez, quero que o meu nome e a minha foto venham da conta Google, para não precisar preencher cadastro.
12. Como usuário que é desativado enquanto está com a sessão aberta, quero deixar de ver dados assim que a plataforma voltar a consultar o banco (o banco não entrega nada a usuário inativo), e ver a mensagem de acesso inativo na próxima vez que abrir ou recarregar a página. (Ajustada no `/ship` de 2026-10-08: a tela não reconfere o acesso com a página aberta; levar à mensagem sem recarregar está no backlog.)
44. Como usuário que troca a foto da conta Google, quero ver a foto nova na plataforma a partir da minha próxima entrada, para não ficar com uma foto antiga. (ADR 0003)
45. Como usuário que tira a foto da conta Google, quero que a plataforma passe a mostrar as minhas iniciais, para que ela não guarde uma foto que eu apaguei. (ADR 0003)
46. Como usuário cujo nome foi corrigido pelo administrador, quero que a minha próxima entrada não traga de volta o nome do Google, mesmo que a foto seja atualizada. (ADR 0003)

### Perfis

13. Como usuário do perfil Consulta, quero ver processos, documentos e o painel sem poder editar, para acompanhar o trabalho sem risco de alterar algo.
14. Como Integrante do EP, quero ter as permissões de trabalho nos processos (definidas nas funcionalidades seguintes), sem acesso à administração de usuários.
15. Como usuário que não é administrador, não quero ver a área Administração na navegação, porque não a uso.
16. Como usuário que não é administrador e chega à área Administração mesmo assim, quero ver uma mensagem dizendo que o meu perfil não permite administrar usuários, em vez de uma tela quebrada.
17. Como qualquer usuário ativo, quero ver o nome (e a foto) dos outros usuários onde eles aparecem, para saber quem é responsável, quem enviou e quem revisou.
18. Como usuário, quero que o meu e-mail só seja visto por mim e pelos administradores, para que o dado pessoal fique restrito ao necessário.

### Administração de usuários

19. Como administrador, quero ver a lista de usuários com nome, e-mail, perfil e situação (Ativo, Inativo ou Aguardando primeiro acesso), para saber quem tem acesso.
20. Como administrador, quero autorizar um e-mail institucional com um perfil, para que a pessoa consiga entrar na primeira vez.
21. Como administrador, quero que a plataforma recuse autorizar um e-mail fora de `@ccivil.pr.gov.br`, mostrando o e-mail digitado e o formato esperado.
22. Como administrador, quero que a plataforma recuse autorizar um e-mail que já está autorizado ou já pertence a um usuário, dizendo isso.
23. Como administrador, quero que o e-mail seja guardado em minúsculas e sem espaços, para que "Fulano@CCivil.pr.gov.br " e "fulano@ccivil.pr.gov.br" sejam o mesmo.
24. Como administrador, quero mudar o perfil de uma autorização ainda não usada, para corrigir um engano antes do primeiro acesso.
25. Como administrador, quero excluir uma autorização ainda não usada, para desfazer um e-mail digitado errado.
26. Como administrador, quero que não exista a opção de excluir quem já entrou, só a de desativar, para que o histórico não perca autores.
27. Como administrador, quero mudar o perfil de um usuário, para refletir a função dele na equipe.
28. Como administrador, quero desativar um usuário que saiu da equipe, para que ele não entre mais, sem perder o nome dele no histórico.
29. Como administrador, quero reativar um usuário inativo, para devolver o acesso a quem voltou.
30. Como administrador, quero corrigir o nome de um usuário, para quando o nome da conta Google estiver incompleto ou diferente do nome usado no trabalho; a correção não é desfeita no próximo acesso dele.
31. Como administrador, quero ser impedido de desativar a mim mesmo, para não me trancar fora.
32. Como administrador, quero ser impedido de rebaixar o meu próprio perfil, para não perder a administração por engano.
33. Como administrador, quero que o sistema recuse desativar ou rebaixar o último administrador ativo, para que a plataforma nunca fique sem quem a administre.
34. Como administrador, quero ver, ao ser impedido por uma dessas travas, uma mensagem que explique qual regra impediu, para entender sem ajuda.
35. Como administrador, quero ver "Carregando usuários…" com linhas-fantasma enquanto a lista carrega, para saber o que está vindo.
36. Como administrador, quero ver uma mensagem de erro com "Tentar de novo" se a lista não carregar, para recuperar sem recarregar a página.
37. Como administrador, quero que uma alteração que falhou mostre o motivo e mantenha o que eu digitei no formulário, para não redigitar.
47. Como administrador, quero que escolher outro perfil no seletor de uma linha não grave nada sozinho e mostre os botões Salvar e Cancelar ao lado, para que percorrer as opções com as setas do teclado não troque o perfil nem encha o histórico. (ADR 0003)
48. Como administrador, quero gravar o perfil escolhido com Salvar e voltar ao perfil gravado com Cancelar, para decidir antes de mudar o acesso de alguém. (ADR 0003)
49. Como administrador, quero que, se o Salvar do perfil falhar, o seletor continue com a opção que escolhi e a mensagem apareça na linha, com Salvar e Cancelar ainda disponíveis, para tentar de novo sem refazer a escolha. (ADR 0003)
50. Como administrador, quero confirmar numa janela antes de excluir uma autorização ("Excluir a autorização de {e-mail}?"), para não excluir por um clique acidental. (ADR 0003)
51. Como administrador, quero confirmar numa janela antes de desativar um usuário ("Desativar {nome}?"), para não tirar o acesso de alguém por um clique acidental. (ADR 0003)
52. Como administrador, quero que a janela de confirmação abra com o Cancelar selecionado e feche com Esc sem fazer nada, para que um Enter ou Esc por reflexo não grave nada. (ADR 0003)
53. Como administrador, quero reativar um usuário com um clique, sem confirmação, porque reativar é o desfazer do desativar. (ADR 0003)
54. Como usuário, quero ver em vermelho as mensagens de "a ação não aconteceu" (falha ao carregar, falha ao salvar, recusa de uma trava) e em amarelo os avisos (perfil sem permissão), para saber na hora se algo deu errado ou se é só uma orientação. (ADR 0003)

### Histórico

38. Como administrador, quero ver o histórico das mudanças de usuários (autorizar, excluir autorização, primeiro acesso, mudar perfil, desativar, reativar, corrigir nome), com data e hora, quem fez e o antes e depois, para responder a uma auditoria.
39. Como administrador, quero ver "Nenhuma alteração registrada ainda." quando o histórico estiver vazio.
40. Como administrador, quero que nenhum registro do histórico possa ser alterado ou apagado por ninguém pela plataforma, para que ele sirva de prova.
41. Como usuário que não é administrador, não quero ter acesso ao histórico de usuários, porque ele traz e-mails.

### Implantação

42. Como responsável pela plataforma, quero promover o primeiro administrador de cada ambiente com um comando SQL em que eu mesmo preencho o meu e-mail, para que ele não fique no código nem na conversa.
43. Como responsável pela plataforma, quero que o banco recuse a criação de qualquer conta fora do domínio institucional ou sem autorização, mesmo que a configuração do Google permita, para não depender de uma única barreira.

## Decisões de implementação

### Entrada

- Supabase Auth com o provedor Google como único meio de entrar. O cadastro aberto geral fica **ligado** (sem ele o primeiro acesso pelo Google não cria a conta) e o cadastro por e-mail fica **desligado**. Desvio do protocolo autorizado pelo usuário e registrado no ADR 0001.
- **Barreira no banco antes da criação da conta:** uma verificação que roda antes de o Supabase criar o usuário confere que o e-mail termina em `@ccivil.pr.gov.br` e que há uma autorização para ele (ou que ele já é usuário). Se faltar algo, a criação é recusada com um código de motivo que a interface traduz na mensagem certa. Preferência pelo gancho "antes de criar usuário" do Supabase Auth, que devolve mensagem própria; se ele não estiver disponível no plano, um gatilho na tabela de usuários do Auth faz a mesma verificação. Conferir na documentação atual na execução.
- **Primeiro acesso:** um gatilho cria a linha do usuário com o perfil da autorização, o nome e o link da foto vindos do Google, registra o evento "primeiro acesso" e remove a autorização (que deixa de estar aguardando). O e-mail do usuário vem da conta Google. Isso substitui a regra "nasce com o menor perfil": sem autorização não nasce linha nenhuma.
- **Inativo:** depois de entrar, a interface lê a linha do próprio usuário. Se ele está inativo, encerra a sessão e mostra a mensagem. A proteção real é a RLS: nenhum dado é entregue a usuário inativo. A conferência roda ao abrir a página e no "Tentar de novo"; quem é desativado com a página aberta só vê a mensagem ao recarregar (até lá, as listas chegam vazias).
- O pedido de entrada ao Google indica o domínio institucional, para que a tela de escolha de conta sugira a conta certa. Isso é conveniência; a segurança é a barreira no banco.
- O nome vem do Google só no primeiro acesso; depois, só o administrador o altera.
- **Foto que acompanha o Google (ADR 0003):** um gatilho depois de incluir ou alterar a identidade Google no Auth (`auth.identities`) copia o link da foto dos dados do Google para `usuarios.foto_url` quando ele muda, a cada entrada, também para o usuário inativo. A foto não vem dos dados da conta (`raw_user_meta_data`), porque esses a própria pessoa altera pela API; a identidade só o Auth grava (mudança de 2026-10-08, revisão de segurança do `/ship`). Se o Google deixa de mandar foto, `foto_url` fica nulo e a interface mostra as iniciais. Na prática, o Google manda uma imagem padrão (letra no círculo colorido) para quem não tem foto, e é ela que aparece no lugar das iniciais; aceito pelo usuário em 2026-10-08 (ver `desvios.md`). O gatilho não toca no nome e não registra evento (o gatilho de eventos de `usuarios` só olha nome, perfil e situação). Conferido em 2026-10-08 no código do Supabase Auth (`internal/api/external.go`): a cada entrada, os dados do Google substituem os da identidade (`identity_data`) e depois são mesclados aos da conta. O gatilho roda a cada inclusão ou alteração da identidade Google, não só quando os dados mudam, para corrigir também quem já tinha dados novos de antes do gatilho.

### Interface

- **Ponto de injeção único:** a interface fala com o Auth e com o banco por um módulo de acesso (sessão atual, entrar com o Google, sair, ler o próprio usuário, listar usuários e autorizações, autorizar, mudar perfil, desativar, reativar, corrigir nome, excluir autorização, listar histórico). O aplicativo recebe esse módulo por injeção; em produção ele usa o cliente Supabase com a chave publicável, e nos testes uma implementação falsa nomeada. É a única costura nova.
- **Tela de entrada** com a identidade visual já implementada: marca EP, o botão "Entrar com a conta institucional" e a área de mensagem. Estados:
  - carregando: "Verificando seu acesso…";
  - conta fora do domínio: "Use sua conta @ccivil.pr.gov.br. A conta {e-mail} não é institucional.";
  - sem autorização: "A conta {e-mail} ainda não foi autorizada. Peça a um administrador.";
  - inativo: "Seu acesso está inativo. Fale com um administrador.";
  - falha de conexão: "Não foi possível conectar. Verifique a conexão e tente de novo." com [Tentar de novo];
  - erro do Auth sem motivo conhecido (ex.: cadastro desligado no painel): "Não foi possível entrar com essa conta. Tente de novo ou fale com um administrador." (incluído em 2026-10-07, na execução do ticket 01, por decisão do usuário: o retorno silencioso à tela de entrada confundia).
- **Barra superior:** o ícone "Sua conta" dá lugar ao avatar do usuário logado (componente Avatar já existente, tamanho 32), que abre um menu com nome, perfil e Sair. O botão Sair fica desativado enquanto a saída está em andamento. Se o Sair falhar, a plataforma confere se o navegador ainda guarda o login (sem rede, a biblioteca do Supabase apaga o login do navegador e só depois avisa a falha): se não guarda, vai para a tela de entrada; se guarda, ou se nem a conferência responde, a pessoa continua dentro e o menu mostra, abaixo do botão, "Não foi possível sair. Verifique a conexão e tente de novo." em vermelho. Um novo clique em Sair tira a mensagem e tenta de novo (correção de bug, 2026-10-08).
- **Navegação:** o item Administração da faixa lateral só aparece para o Administrador e leva a Administração > Usuários. Para outro perfil que chegue lá, a área mostra "Seu perfil ({perfil}) não permite administrar usuários. Peça a um administrador para mudar seu perfil."
- **Administração > Usuários:** tabela compacta (sem cartões) com avatar, nome, e-mail, perfil e situação em pílula (Ativo, Inativo, Aguardando primeiro acesso), e as ações de cada linha conforme a situação. Formulário "Autorizar e-mail" (e-mail + perfil, perfil padrão Consulta). Estados:
  - carregando: "Carregando usuários…" com linhas-fantasma;
  - erro: "Não foi possível carregar os usuários. Verifique a conexão e tente de novo." com [Tentar de novo];
  - erro de gravação: "A alteração não foi salva: {motivo}. Seus dados continuam no formulário.";
  - vazio não ocorre (há sempre ao menos o próprio administrador).
- **Histórico de usuários**, na mesma área, do mais recente para o mais antigo. Estados: "Carregando histórico…", "Nenhuma alteração registrada ainda." e o mesmo padrão de erro com [Tentar de novo].
- **Mudar perfil numa linha (ADR 0003):** o seletor guarda a escolha só na tela. Quando ela difere do perfil gravado, aparecem ao lado [Salvar] e [Cancelar], no padrão do "Corrigir nome". Salvar grava; Cancelar volta ao perfil gravado. Se Salvar falhar, a escolha fica no seletor, a mensagem aparece na linha e os dois botões continuam. Vale para linhas de usuário e de autorização aguardando; o seletor do formulário "Autorizar e-mail" não muda (já grava pelo botão Autorizar).
- **Confirmação (ADR 0003):** só Excluir autorização e Desativar pedem confirmação, numa janela nativa do navegador (modal), sem dependência nova. O foco abre no [Cancelar], Esc fecha sem gravar, e o botão de confirmar é o principal (azul) com o verbo da ação. Textos:
  - Excluir: título "Excluir a autorização de {e-mail}?", texto "A pessoa não conseguirá entrar. Para permitir de novo, autorize o e-mail outra vez.", botões [Excluir autorização] [Cancelar];
  - Desativar: título "Desativar {nome}?", texto "{nome} perde o acesso à plataforma. O nome e o histórico continuam registrados, e você pode reativar depois.", botões [Desativar] [Cancelar].
  Reativar e Corrigir nome não pedem confirmação. Se a gravação confirmada falhar, a mensagem aparece na linha, como nas demais ações.
- **Cores das mensagens (ADR 0003):** vermelho (as cores de "atraso" da identidade, as mesmas da tela de entrada) para tudo que diz "a ação não aconteceu": erro ao carregar a lista ou o histórico, erro de gravação e as recusas das travas. Amarelo (caixa de pendência) só para aviso, como a mensagem de perfil sem permissão.
- Mensagens das travas, vindas do banco e traduzidas pela interface: "Você não pode desativar a si mesmo.", "Você não pode mudar o seu próprio perfil.", "Não é possível: {nome} é o último administrador ativo.".

### Modelo de dados

Migração não destrutiva: só cria tabelas, tipos e funções.

Mudança de 2026-10-08 (ADR 0003): migração nova, não destrutiva, que só cria a função e o gatilho da foto; nenhuma tabela ou coluna muda, e a coluna `foto_url` continua fechada para alteração pela API. Correção do mesmo dia (revisão de segurança do `/ship`): migração nova que troca esse gatilho e essa função por outros, em `auth.identities`; nenhuma tabela ou coluna muda.

**Tipo `perfil`**: `administrador`, `integrante_ep`, `consulta`.

**`usuarios`** (um por conta que já entrou; mesmo id da conta no Auth)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | uuid, igual ao id da conta no Auth | sim |
| nome | texto | sim |
| foto_url | texto (link da foto do Google) | não |
| perfil | perfil | sim |
| ativo | booleano, padrão verdadeiro | sim |
| primeiro_acesso_em | data e hora | sim |

**`usuarios_emails`** (o e-mail separado dos dados que todos veem)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| usuario_id | uuid, referência a `usuarios` | sim (chave) |
| email | texto, minúsculo, único, termina em `@ccivil.pr.gov.br` | sim |

**`autorizacoes`** (só as que aguardam primeiro acesso; a linha sai no primeiro acesso)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| email | texto, minúsculo, sem espaços, único, termina em `@ccivil.pr.gov.br` | sim (chave) |
| perfil | perfil, padrão Consulta | sim |
| criada_em | data e hora | sim |
| criada_por | uuid, referência a `usuarios` | não (nulo no primeiro administrador) |

**`eventos`** (histórico; só inclui; formato da especificação, seção 4)

| Coluna | Tipo | Obrigatória |
|---|---|---|
| id | identificador | sim |
| ocorrido_em | data e hora | sim |
| autor_id | uuid, referência a `usuarios` | não (nulo quando feito por SQL no painel) |
| acao | texto (autorizar, excluir_autorizacao, primeiro_acesso, mudar_perfil, desativar, reativar, corrigir_nome) | sim |
| entidade | texto (`usuario` ou `autorizacao` nesta funcionalidade) | sim |
| entidade_ref | texto (id do usuário ou e-mail da autorização) | sim |
| detalhes | json com antes e depois | sim |

**Derivado, não guardado:** a situação "Aguardando primeiro acesso" é existir linha em `autorizacoes`; Ativo e Inativo vêm de `usuarios.ativo`.

**Dado pessoal e quem vê:** nome e foto (todos os usuários ativos); e-mail em `usuarios_emails` (só Administrador e o próprio usuário); e-mail em `autorizacoes` e em `eventos` (só Administrador).

**Funções auxiliares** no schema não exposto, com `search_path` vazio: perfil do usuário atual e se ele está ativo (lidas pelas políticas sem recursão), mais as funções dos gatilhos.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `usuarios` ler | todos | todos | todos | só a própria linha | não |
| `usuarios` criar | não (só o gatilho do primeiro acesso) | não | não | não | não |
| `usuarios` alterar nome, perfil, ativo | sim, com as travas | não | não | não | não |
| `usuarios` alterar id, foto_url, primeiro_acesso_em | não | não | não | não | não |
| `usuarios` apagar | não | não | não | não | não |
| `usuarios_emails` ler | todos | só o próprio | só o próprio | não | não |
| `usuarios_emails` criar, alterar, apagar | não (só o gatilho) | não | não | não | não |
| `autorizacoes` ler | sim | não | não | não | não |
| `autorizacoes` criar | sim | não | não | não | não |
| `autorizacoes` alterar perfil | sim | não | não | não | não |
| `autorizacoes` apagar | sim | não | não | não | não |
| `eventos` ler | sim | não | não | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos incluem) | não | não | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Só conta do domínio e autorizada é criada | verificação antes de criar o usuário | conta `@gmail.com` recusada; conta do domínio sem autorização recusada; conta autorizada aceita |
| Primeiro acesso cria o usuário com o perfil autorizado e remove a autorização | gatilho na criação da conta | autorização Integrante → usuário Integrante, autorização some, evento "primeiro_acesso" |
| Ninguém desativa a si mesmo | gatilho antes de alterar `usuarios` | administrador tentando `ativo = falso` em si mesmo é recusado |
| Ninguém muda o próprio perfil | idem | administrador tentando virar Consulta é recusado |
| Sempre um administrador ativo | idem | com dois administradores, desativar um passa e o segundo é recusado |
| Toda mudança de nome, perfil ou situação em `usuarios`, e toda mudança em `autorizacoes`, vira evento | gatilhos depois de incluir, alterar e apagar | cada ação gera um evento com autor, antes e depois |
| A foto acompanha o Google a cada entrada (ADR 0003) | gatilho depois de incluir ou alterar a identidade Google no Auth | link novo nos dados do Google → `foto_url` atualizado; dados sem foto → `foto_url` nulo; usuário inativo também atualizado; nome corrigido pelo administrador não muda; nenhum evento novo; a pessoa alterar os dados da própria conta pela API não muda a foto |
| Evento não se altera nem se apaga | sem política de alteração e de exclusão, para qualquer perfil | tentativa de alterar e de apagar recusada |
| E-mail sempre minúsculo e sem espaços | gatilho ou restrição na inclusão | " Fulano@CCivil.pr.gov.br " é guardado como "fulano@ccivil.pr.gov.br" |
| E-mail único entre autorizações e usuários | verificação na inclusão da autorização | autorizar o e-mail de um usuário existente é recusado |

#### Regras de estado do usuário

Aguardando primeiro acesso → (primeiro acesso) → Ativo ⇄ (desativar / reativar) → Inativo. Aguardando pode ser excluída; Ativo e Inativo não se excluem (ADR 0002). Desativar não mexe em nada do que o usuário fez.

### Configuração

- O cliente OAuth do Google é criado pelo usuário no Google Cloud, de preferência com público "Interno" (a verificar na execução). O identificador e o segredo vão para o painel do Supabase e, no arquivo de configuração local, por variável de ambiente; nunca para o git nem para a conversa.
- Endereços de retorno autorizados: o do servidor de desenvolvimento e, depois, o de produção.
- Primeiro administrador: um comando SQL com o marcador `<meu-email>`, que inclui a autorização com perfil Administrador, rodado pelo usuário no SQL Editor de cada ambiente.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer (texto, botões, mensagens) ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste: a tela inteira).** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de acesso, que simula sessão, usuários, autorizações, histórico e falhas. Cobre: cada estado da tela de entrada; avatar e menu com Sair, inclusive o Sair com falha; Administração visível só ao Administrador e a mensagem para os demais perfis; cada ação da administração com sucesso e com falha (incluindo as mensagens das travas e o formulário mantido); estados de carregando, vazio e erro da lista e do histórico. Arte anterior: os testes do aplicativo e dos componentes Avatar e Pílula.
- **Mudanças do ADR 0003, pela tela inteira:** trocar o perfil no seletor não chama a gravação; Salvar grava e esconde os botões; Cancelar volta ao perfil gravado; Salvar com falha mantém a escolha e mostra a mensagem; Excluir e Desativar abrem a janela com os textos acima, Cancelar e Esc não gravam e o botão da ação grava; Reativar grava sem janela; as mensagens de falha e de aviso aparecem cada uma no seu tipo. Arte anterior: os testes de Administração dos tickets 02 e 03.
- **Tradução de motivos de recusa** (código do banco → mensagem) e **validação do e-mail** na interface: testes unitários pequenos.
- **Banco.** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras. Arte anterior: os testes de RLS ligada e de buckets privados. Nesta rede, rodados pelo SQL Editor; a bateria completa (`npm run test:db`) roda na rede liberada antes do `/ship`.
- **Ponta a ponta manual.** Entrar com o Google no ambiente de desenvolvimento só com a conta do próprio usuário (ADR 0001): primeiro acesso, avatar, sair, e a recusa de uma conta não autorizada.
- Todos os usuários dos testes são inventados, com e-mails `@ccivil.pr.gov.br` fictícios.

## Fora do escopo

- Senha própria, recuperação e troca de senha, servidor de e-mail (SMTP) e convite por e-mail.
- Chave secreta e Edge Function.
- Envio de foto própria (backlog; a v1 usa a foto do Google).
- O nome acompanhar o Google depois do primeiro acesso, e guardar fotos antigas (ADR 0003).
- Excluir usuário que já entrou e o tratamento de pedido de eliminação pela LGPD (backlog, ADR 0002).
- Registro de quem consultou cada dado (backlog).
- Integração com login do governo (backlog).
- Acesso dos responsáveis dos setores.
- O que cada perfil pode fazer em processos, documentos e demais áreas: cada funcionalidade seguinte define as políticas dela usando as funções auxiliares criadas aqui.
- A leitura de eventos de outras entidades, que a funcionalidade 3 (Processos e etapas) define.

## Observações

- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` A tela de entrada segue a identidade visual (marca, cores, fontes) e a mensagem de recusa fica visível junto ao botão.
  - `[visual]` O avatar na barra superior aparece com a foto ou as iniciais, no lugar do ícone de conta, e o menu abre ancorado nele.
  - `[visual]` Na lista de usuários, a situação aparece em pílula com cor e texto (nunca só cor).
  - `[visual]` A área Administração não aparece na faixa lateral para Integrante do EP e Consulta.
  - `[visual]` Os botões Salvar e Cancelar aparecem ao lado do seletor de perfil sem desalinhar a linha da tabela.
  - `[visual]` A janela de confirmação segue a identidade visual (fundo esmaecido atrás, texto legível, botão principal azul e Cancelar com foco visível).
  - `[visual]` Mensagens de falha em vermelho e o aviso de perfil sem permissão em amarelo, na Administração e na entrada.
- Testes de banco nesta rede vão à mão pelo SQL Editor, e as migrações aplicadas assim precisam ser registradas no histórico da CLI antes da primeira publicação em produção (ver `.scratch/inicio-projeto.md`).
- A especificação geral (`.scratch/especificacao.md`) dizia "o administrador convida os usuários"; a decisão 11.3 foi resolvida e a forma passou a ser a autorização com login Google (ADR 0001).

Entregue em 2026-10-09 (commit 2180971)
