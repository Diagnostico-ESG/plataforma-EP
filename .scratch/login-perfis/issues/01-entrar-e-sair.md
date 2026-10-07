# 01: Entrar e sair com a conta institucional

**Como resolve a sua parte.** É o primeiro caminho completo da funcionalidade: a pessoa abre a plataforma, entra com a conta Google `@ccivil.pr.gov.br` e cai no Quadro de processos com o próprio avatar na barra superior. Quem não deve entrar (conta de fora do domínio, sem autorização ou inativa) é recusado pelo banco e vê a mensagem que diz o que fazer. Este ticket cria a base que os outros usam: as tabelas de usuários, e-mails, autorizações e eventos, as funções auxiliares de perfil e o módulo de acesso por onde a interface fala com o Auth e com o banco.

**What to build:** entrada pelo Google, primeiro acesso que cria o usuário com o perfil autorizado, recusa com mensagem própria para cada motivo, avatar com menu (nome, perfil, Sair) e bloqueio do usuário inativo. Spec: `.scratch/login-perfis/spec.md` (histórias 1 a 13, 17, 18, 42 e 43; seções "Entrada", "Interface", "Modelo de dados" e "Configuração").

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Migração não destrutiva cria o tipo `perfil` e as tabelas `usuarios`, `usuarios_emails`, `autorizacoes` e `eventos`, todas com RLS ligada, e as funções auxiliares (perfil do usuário atual e se está ativo) em schema não exposto com `search_path` vazio.
- [ ] Barreira antes da criação da conta: e-mail fora de `@ccivil.pr.gov.br` é recusado; e-mail do domínio sem autorização é recusado; cada recusa devolve um código de motivo. Gancho "antes de criar usuário" do Supabase Auth, ou gatilho na tabela de usuários do Auth se o gancho não estiver disponível (conferir na documentação atual e registrar a escolha).
- [ ] Primeiro acesso: cria a linha em `usuarios` com o perfil da autorização, nome e foto do Google, cria a linha em `usuarios_emails`, remove a autorização e grava o evento `primeiro_acesso` com a própria pessoa que entrou como autor (não nulo: autor nulo fica reservado ao que é feito direto no banco).
- [ ] Políticas de leitura de `usuarios` e `usuarios_emails` conforme a tabela "quem pode o quê" da spec (inativo vê só a própria linha; e-mail só o próprio e o Administrador; visitante nada), cada célula com teste pgTAP; testes da barreira e do primeiro acesso.
- [ ] Comando SQL do primeiro administrador com o marcador `<meu-email>`, documentado para rodar no SQL Editor de cada ambiente.
- [ ] Módulo de acesso injetado no aplicativo (sessão atual, entrar com o Google, sair, ler o próprio usuário), com implementação real pela chave publicável e implementação falsa nomeada para os testes.
- [ ] Tela de entrada com a identidade visual, o botão "Entrar com a conta institucional" e os estados: "Verificando seu acesso…", conta fora do domínio, sem autorização, inativo e falha de conexão com [Tentar de novo] (textos exatos na spec).
- [ ] Usuário inativo que entra tem a sessão encerrada e vê "Seu acesso está inativo. Fale com um administrador."
- [ ] Barra superior: avatar (foto ou iniciais, tamanho 32) no lugar do ícone de conta, abrindo menu com nome, perfil e Sair; Sair volta à tela de entrada.
- [ ] Tradução de código de motivo em mensagem com teste unitário.
- [ ] Testes de interface renderizando o aplicativo inteiro com o módulo falso, cobrindo cada estado da tela de entrada, o avatar, o menu e o Sair.
- [ ] Passo do usuário, guiado em linguagem simples: criar o cliente OAuth no Google Cloud (público "Interno", se disponível), colar identificador e segredo no painel do Supabase, cadastrar os endereços de retorno e rodar o SQL do primeiro administrador.
- [ ] Ponta a ponta manual com a conta do próprio usuário: primeiro acesso, avatar, Sair e recusa de uma conta não autorizada.
