-- Tira o truncate de visitante e logado nas tabelas de login-perfis (bug do backlog, 2026-10-08).
-- O Supabase concede tudo nas tabelas novas de public; as migrações anteriores tiraram
-- insert, update e delete, mas o truncate ficou. A RLS não vale para ele, só o privilégio o barra.
-- Em eventos ele já saiu (20261008143706_historico_usuarios.sql).
revoke truncate on public.usuarios, public.usuarios_emails, public.autorizacoes from anon, authenticated;
