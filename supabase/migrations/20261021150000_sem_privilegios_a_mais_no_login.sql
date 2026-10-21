-- Defesa em profundidade (backlog de 2026-10-09): usuarios e usuarios_emails guardavam privilégios que a
-- plataforma não usa (select do visitante; tudo do visitante e insert/update/delete do logado em usuarios_emails),
-- barrados só pela RLS. Passam a guardar exatamente o que se usa; o resto é recusado já no privilégio (42501).
-- Quem escreve em usuarios_emails é o gatilho do primeiro acesso (security definer), não a API.
-- autorizacoes já estava certa (migração de autorizar e-mails) e não muda.
revoke select on public.usuarios from anon;
revoke all on public.usuarios_emails from anon;
revoke insert, update, delete on public.usuarios_emails from authenticated;
