# O gancho de entrada do login exige conceder o schema `private` também a `supabase_auth_admin`

Data: 2026-10-21. Registra uma exceção feita na migração `20261007200505_login_perfis` (ADR 0001), sem ADR até hoje.

A regra de `.claude/regras/banco.md` diz que o uso do schema `private` e a execução das funções dele são concedidos só a `authenticated`. O login pelo Google (ADR 0001) tem uma barreira no primeiro acesso: o gancho "antes de criar usuário" do Supabase Auth chama `private.antes_de_criar_usuario`, que recusa e-mail fora de `@ccivil.pr.gov.br` ou sem autorização. Quem executa esse gancho é o papel `supabase_auth_admin`, não `authenticated`; sem o acesso, a função nem é encontrada e o primeiro acesso falha para todos.

A migração concede, então, a esse papel exatamente duas coisas: `usage` no schema `private` e `execute` em `private.antes_de_criar_usuario(jsonb)`. As outras funções de `private` seguem sem `execute` para ele (o `revoke` da migração tira de `public`, `anon` e `authenticated`), e a função do gancho continua `security definer` com `search_path` vazio. `supabase_auth_admin` é um papel interno do Supabase, que a API pública não usa.

## Opções consideradas

- Pôr a função do gancho em `public`: o `usage` do schema `public` já existe, mas a função ficaria exposta na API (RPC) para qualquer logado, o que a regra existe para evitar.
- Um schema separado só para o gancho: isola melhor, mas é um schema a mais para uma função só; a concessão pontual em `private` tem o mesmo efeito.
- Concessão pontual em `private` (escolhida): a exceção fica restrita a um papel interno e a uma função.

## Consequências

- A regra do `banco.md` ganha esta exceção: ao mexer no gancho, conferir que só `antes_de_criar_usuario` tem `execute` para `supabase_auth_admin`.
- Qualquer função nova de `private` que o Supabase Auth precise chamar (outro gancho) pede uma concessão própria e uma nota aqui.
- O teste de privilégios (`10_privilegios_padrao.test.sql`) não cobre `supabase_auth_admin`; a conferência é manual até haver um teste geral de funções (item aberto no backlog).
