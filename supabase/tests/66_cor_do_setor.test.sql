-- Cor do setor: quem pode o quê e regras do banco (visual-do-cartao, ticket 02).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(28);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';

insert into public.setores (nome, sigla, cor) values ('Setor Fixo de Teste', 'SFT', 5);

-- Uma pessoa (ou o visitante) tenta ler, criar com cor e alterar a cor; id_usuario nulo é o visitante.
create function pg_temp.cor_como(papel text, id_usuario text, quem text, sigla_nova text,
  pode_ler boolean, pode_gravar boolean) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    case when id_usuario is null then '{"role":"anon"}'
      else format('{"sub":"%s","role":"authenticated"}', id_usuario) end, true);
  execute format('set local role %s', papel);
  if pode_ler then
    insert into _tap (linha) select is((select cor from public.setores where sigla = 'SFT'), 5, quem || ' lê a cor');
  elsif papel = 'anon' then
    insert into _tap (linha) select throws_ok('select cor from public.setores', '42501', null, quem || ' não lê a cor');
  else
    insert into _tap (linha) select is((select count(*)::int from public.setores), 0, quem || ' não lê a cor');
  end if;
  if pode_gravar then
    insert into _tap (linha) select lives_ok(
      format('insert into public.setores (nome, sigla, cor) values (%L, %L, 7)', 'Setor de ' || quem, sigla_nova),
      quem || ' informa a cor ao criar');
    with alteradas as (update public.setores set cor = 9 where sigla = 'SFT' returning cor)
    insert into _tap (linha) select is((select cor from alteradas), 9, quem || ' altera a cor');
  else
    insert into _tap (linha) select throws_ok(
      format('insert into public.setores (nome, sigla, cor) values (%L, %L, 7)', 'Setor de ' || quem, sigla_nova),
      '42501', null, quem || ' não informa a cor ao criar');
    if papel = 'anon' then
      insert into _tap (linha) select throws_ok($sql$update public.setores set cor = 9 where sigla = 'SFT'$sql$,
        '42501', null, quem || ' não altera a cor');
    else
      with alteradas as (update public.setores set cor = 9 where sigla = 'SFT' returning 1)
      insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não altera a cor');
    end if;
  end if;
  reset role;
  update public.setores set cor = 5 where sigla = 'SFT';
end $$;
grant execute on function pg_temp.cor_como(text, text, text, text, boolean, boolean) to anon, authenticated;

select pg_temp.cor_como('authenticated', '00000000-0000-0000-0000-0000000000a1', 'Administrador', 'CADM', true, true);
select pg_temp.cor_como('authenticated', '00000000-0000-0000-0000-0000000000a2', 'Integrante', 'CINT', true, true);
select pg_temp.cor_como('authenticated', '00000000-0000-0000-0000-0000000000a3', 'Consulta', 'CCON', true, false);
select pg_temp.cor_como('authenticated', '00000000-0000-0000-0000-0000000000a4', 'Inativo', 'CINA', false, false);
select pg_temp.cor_como('anon', null, 'Visitante', 'CVIS', false, false);

-- Restrição de 1 a 30.
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla, cor) values ('Cor Zero', 'CZ0', 0)$sql$, '23514', null, 'cor 0 é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla, cor) values ('Cor Trinta e Um', 'C31', 31)$sql$, '23514', null,
  'cor 31 é recusada');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.setores (nome, sigla, cor) values ('Cor Um', 'C01', 1), ('Cor Trinta', 'C30', 30)$sql$,
  'cores 1 e 30 são aceitas');

-- Primeira cor livre. Cada bloco começa liberando as cores 1 a 29 (todos os setores existentes ficam na 30).
update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor) values ('Livre A1', 'LA1', 1), ('Livre A2', 'LA2', 2);
insert into public.setores (nome, sigla) values ('Livre A3', 'LA3');
insert into _tap (linha) select is((select cor from public.setores where sigla = 'LA3'), 3,
  'com as cores 1 e 2 em uso, o setor novo recebe a 3');

update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor) values ('Livre B1', 'LB1', 1), ('Livre B3', 'LB3', 3);
insert into public.setores (nome, sigla) values ('Livre B2', 'LB2');
insert into _tap (linha) select is((select cor from public.setores where sigla = 'LB2'), 2,
  'com as cores 1 e 3 em uso, o setor novo recebe a 2');

update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor, ativo) values ('Inativo Cor 1', 'IC1', 1, false);
insert into public.setores (nome, sigla) values ('Depois do Inativo', 'DPI');
insert into _tap (linha) select is((select cor from public.setores where sigla = 'DPI'), 2,
  'o setor inativo continua ocupando a cor 1');

update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor)
  select 'Cobertura ' || n, 'COB' || n, n from generate_series(1, 29) as n;
insert into public.setores (nome, sigla) values ('Trinta e Um', 'T31');
insert into _tap (linha) select is((select cor from public.setores where sigla = 'T31'), 1,
  'com as 30 cores em uso, o setor novo recebe a 1');

update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor) values ('Repetida 1', 'RP1', 5), ('Repetida 2', 'RP2', 5);
insert into _tap (linha) select is((select count(*)::int from public.setores where sigla in ('RP1', 'RP2') and cor = 5), 2,
  'a cor informada é respeitada mesmo repetida');

-- Eventos: trocar só a cor não cria evento; cor e nome juntos criam um evento sem `cor`.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into public.setores (nome, sigla, cor) values ('Setor do Evento', 'EVT', 4);
update public.setores set cor = 6 where sigla = 'EVT';
reset role;
insert into _tap (linha) select is((select count(*)::int from public.eventos e
  join public.setores s on e.entidade_ref = s.id::text where e.entidade = 'setor' and s.sigla = 'EVT'), 1,
  'trocar só a cor não cria evento (fica só o de criar)');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
update public.setores set cor = 7, nome = 'Setor do Evento Novo' where sigla = 'EVT';
reset role;
insert into _tap (linha) select is((select count(*)::int from public.eventos e
  join public.setores s on e.entidade_ref = s.id::text where e.entidade = 'setor' and s.sigla = 'EVT'), 2,
  'cor e nome juntos criam um evento');
insert into _tap (linha) select ok(not jsonb_exists((select e.detalhes -> 'antes' from public.eventos e
  join public.setores s on e.entidade_ref = s.id::text where e.entidade = 'setor' and s.sigla = 'EVT'
  order by e.id desc limit 1), 'cor'), 'o "antes" do evento não traz a cor');
insert into _tap (linha) select ok(not jsonb_exists((select e.detalhes -> 'depois' from public.eventos e
  join public.setores s on e.entidade_ref = s.id::text where e.entidade = 'setor' and s.sigla = 'EVT'
  order by e.id desc limit 1), 'cor'), 'o "depois" do evento não traz a cor');

-- Preenchimento da migração: mesmo comando, siglas que ordenam primeiro ('000...' antes das letras).
insert into public.setores (nome, sigla, cor) values ('Mig A', '000A', 30), ('Mig B', '000B', 30), ('Mig C', '000C', 30);
update public.setores s set cor = ((o.posicao - 1) % 30) + 1
  from (select id, row_number() over (order by sigla) as posicao from public.setores) o where o.id = s.id;
insert into _tap (linha) select is((select array_agg(cor order by sigla) from public.setores where sigla like '000%'),
  array[1, 2, 3], 'o preenchimento dá 1, 2, 3 pela ordem da sigla');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
