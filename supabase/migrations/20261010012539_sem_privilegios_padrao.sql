-- Tira de visitante e logado os privilégios padrão que sobraram nas tabelas de login-perfis
-- (bug do backlog de 2026-10-08, achado no code-review do bug do truncate).
-- O Supabase concede tudo nas tabelas novas de public; a RLS não vale para references, trigger
-- e maintain, só o privilégio os barra. O truncate já saiu (20261008193100_sem_truncate.sql)
-- e em eventos saiu tudo (20261008143706_historico_usuarios.sql).
-- maintain existe a partir do Postgres 17, a versão dos projetos do Supabase.
-- O teste 10_privilegios_padrao.test.sql confere isto em toda tabela de public.
revoke references, trigger, maintain
  on public.usuarios, public.usuarios_emails, public.autorizacoes
  from anon, authenticated;
