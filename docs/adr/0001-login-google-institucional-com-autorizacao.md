# Login pela conta Google institucional, liberado por autorização

Data: 2026-10-07. Decide a questão aberta 11.3 da especificação.

A plataforma usa o Supabase Auth com o Google como único meio de entrar, e só aceita contas `@ccivil.pr.gov.br`. Quem pode entrar é decidido por uma lista de autorizações (e-mail e perfil) que o administrador mantém na própria plataforma. No primeiro acesso, o banco confere o domínio e a autorização e recusa a entrada se uma das duas faltar. Assim não há senha própria, recuperação de senha, servidor de e-mail (SMTP) nem chave secreta: a gestão de usuários acontece toda por RLS, sem Edge Function. O usuário inativo é barrado pela RLS, e a interface encerra a sessão com uma mensagem.

## Desvios do protocolo, por instrução do usuário (2026-10-07)

- **Cadastro aberto ligado no Supabase.** O protocolo pede o cadastro aberto desligado, mas com o Google ele precisa ficar ligado, ou o primeiro acesso não cria a conta. Quem fecha a porta passa a ser o banco (domínio + autorização), com teste.
- **Sem telas de recuperação e troca de senha.** A senha é a da conta Google, gerida pela instituição.
- **Uma conta real no desenvolvimento.** Para testar o login pelo Google, só a conta institucional do próprio usuário entra no projeto de desenvolvimento. As contas dos colegas só entram em produção. Os testes automáticos usam apenas usuários inventados.

## Opções consideradas

- Pré-criar as contas por uma Edge Function com a chave secreta: faz o mesmo que a lista de autorizações, mas traz a chave secreta de volta.
- Aceitar qualquer conta do domínio com o perfil Consulta: exporia processos e nomes a toda a Casa Civil, contra o mínimo necessário da LGPD.
- E-mail e senha no Supabase: exigiria SMTP próprio para convite e recuperação de senha.

## Consequências

- O projeto depende de um cliente OAuth no Google Cloud, de preferência com o público "Interno" da organização. O identificador e o segredo vão para o painel do Supabase, nunca para o git.
- A integração com outro login do governo, se um dia existir, se acrescenta como mais um provedor, sem trocar os usuários.
