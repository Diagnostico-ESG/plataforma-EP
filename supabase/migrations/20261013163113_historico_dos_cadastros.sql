-- Cadastros básicos, ticket 05: todo perfil ativo lê os eventos dos cadastros (setores, macroprocessos e setores envolvidos).
-- Os eventos de usuários e autorizações trazem e-mails e continuam só com o administrador (política do ticket 04 de login-perfis).
-- Políticas de leitura somam (OU); ninguém grava em eventos pela API, e os privilégios de tabela não mudam.

create policy "eventos: perfil ativo lê os cadastros" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade in ('setor', 'macroprocesso', 'setor_envolvido'));
