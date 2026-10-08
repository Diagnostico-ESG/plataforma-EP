-- Foto acompanha a conta Google a cada entrada (login-perfis, ticket 05; ADR 0003).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
insert into _tap (linha) select plan(6);

-- Usuários inventados: f1 ativo, com o nome corrigido pelo administrador; f2 inativo. Os dois entram com foto.
insert into public.autorizacoes (email, perfil) values
  ('foto.ativo.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('foto.inativo.teste@ccivil.pr.gov.br', 'consulta');
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'foto.ativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Foto Ativo", "picture": "https://exemplo.invalido/f1-antiga.png"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'foto.inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Foto Inativo", "picture": "https://exemplo.invalido/f2-antiga.png"}');
update public.usuarios set nome = 'Nome Corrigido' where id = '00000000-0000-0000-0000-0000000000f1';
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000f2';
create temp table _eventos_antes as select count(*) as total from public.eventos;

-- Cada entrada simula o Auth: regrava os dados do Google e a hora da entrada.
create function pg_temp.entrar(id_usuario uuid, dados jsonb) returns void
language sql as $$
  update auth.users set raw_user_meta_data = dados, last_sign_in_at = now() where id = id_usuario;
$$;
create function pg_temp.foto(id_usuario uuid) returns text
language sql as $$ select foto_url from public.usuarios where id = id_usuario $$;

select pg_temp.entrar('00000000-0000-0000-0000-0000000000f1',
  '{"full_name": "Nome do Google", "picture": "https://exemplo.invalido/f1-nova.png"}');
insert into _tap (linha) select is(pg_temp.foto('00000000-0000-0000-0000-0000000000f1'),
  'https://exemplo.invalido/f1-nova.png', 'link novo do Google atualiza a foto');
insert into _tap (linha) select is(
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000f1'), 'Nome Corrigido',
  'a entrada não desfaz o nome corrigido pelo administrador');

select pg_temp.entrar('00000000-0000-0000-0000-0000000000f2',
  '{"full_name": "Foto Inativo", "picture": "https://exemplo.invalido/f2-nova.png"}');
insert into _tap (linha) select is(pg_temp.foto('00000000-0000-0000-0000-0000000000f2'),
  'https://exemplo.invalido/f2-nova.png', 'usuário inativo também tem a foto atualizada');

select pg_temp.entrar('00000000-0000-0000-0000-0000000000f2',
  '{"avatar_url": "https://exemplo.invalido/f2-avatar.png", "picture": "https://exemplo.invalido/f2-picture.png"}');
insert into _tap (linha) select is(pg_temp.foto('00000000-0000-0000-0000-0000000000f2'),
  'https://exemplo.invalido/f2-avatar.png', 'avatar_url vale antes de picture, como no primeiro acesso');

select pg_temp.entrar('00000000-0000-0000-0000-0000000000f1', '{"full_name": "Nome do Google"}');
insert into _tap (linha) select is(pg_temp.foto('00000000-0000-0000-0000-0000000000f1'), null::text,
  'dados do Google sem foto deixam a foto vazia (a tela mostra as iniciais)');

insert into _tap (linha) select is((select count(*) from public.eventos), (select total from _eventos_antes),
  'a troca de foto não registra evento');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
