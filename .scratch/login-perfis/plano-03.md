# Ticket 03 (Gerir usuários que já entraram) — plano de execução

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque `- [x]` ao concluir cada passo.

**Objetivo:** em Administração > Usuários, o administrador muda o perfil, desativa, reativa e corrige o nome de quem já entrou; o banco impõe as travas e a tela mostra qual regra impediu.

**Arquitetura:** o banco decide quem altera `usuarios` (RLS só para Administrador ativo, privilégio só nas colunas nome, perfil e ativo), impõe as travas (gatilho antes de alterar, recusa `motivo:valor`) e registra cada mudança em `eventos` (gatilho depois de alterar). A interface ganha quatro funções no `ModuloDeAcesso` (real e falso), uma classe de erro para as travas e as ações de cada linha da tabela.

**Tecnologia:** Supabase (Postgres, pgTAP), React 19, Vitest + Testing Library.

**Requisitos:** `.scratch/login-perfis/issues/03-gerir-usuarios.md` (critérios citados como "critério N", na ordem do ticket) e `.scratch/login-perfis/spec.md` (histórias 26 a 34 e 37; seções "Interface", "Quem pode o quê", "Regras que o banco impõe"; os textos exatos das mensagens estão lá).

## Restrições globais

- Regras de `.claude/regras/banco.md` que valem aqui: teste antes da migração; políticas na mesma migração; função `security definer` só em `private`, com `search_path = ''` e nomes qualificados; políticas com `(select auth.uid())` e as funções auxiliares `private.perfil_atual()` e `private.usuario_ativo()` do ticket 01; a segurança está na RLS (esconder botão não protege); interface só pela chave publicável, por `src/lib/supabase.ts`; conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`, projeto dev `yclkzyoebpsxmgpbcbus`) antes de qualquer comando no banco; as migrações `20261007200505_login_perfis` e `20261007214206_autorizar_emails` já estão no dev e não se editam.
- Rede atual: só porta 443. Teste e migração vão pelo SQL Editor do painel do projeto dev, com o usuário colando o arquivo e relatando o resultado; `npm run db:types` funciona.
- Limites do ESLint: função ≤ 20 linhas em `.ts` (hooks ≤ 40), arquivo ≤ 300, complexidade ≤ 10. Sem `any`.
- Dados de teste inventados, e-mails `@ccivil.pr.gov.br` fictícios. Nenhum e-mail real no código, nos testes ou na conversa.
- Fora deste ticket: ler o histórico (`eventos`) pela interface (ticket 04).

## Decisões de execução

- **Recusas das travas** no formato dos tickets anteriores (`motivo:valor`, código `P0001`): `nao_desativa_a_si_mesmo:<id>`, `nao_muda_o_proprio_perfil:<id>`, `ultimo_administrador:<nome>`. O nome pode ter espaços, então a interface lê o valor até o fim da mensagem.
- **Travas aparecem como frase própria**, sem o prefixo "A alteração não foi salva:" (os textos da spec já são frases completas). O módulo de acesso entrega a trava como `TravaDoBanco` (subclasse de `Error`); as demais falhas continuam `Error` com o motivo, e a tela põe o prefixo.
- **Privilégios:** ninguém inclui nem apaga `usuarios` pela API (a linha nasce no gatilho do primeiro acesso; ADR 0002); `update` concedido só em nome, perfil e ativo. Assim id, foto e data do primeiro acesso dão erro de permissão ao tentar alterar.
- **Gatilho das travas como `security invoker`:** só chega a ele quem a RLS deixou alterar (administrador ativo, que lê todos os usuários) ou o dono do banco no painel. No painel, `auth.uid()` é nulo, então só a trava do último administrador vale ali.
- **Trava do último administrador pela tela é quase inalcançável:** com dois administradores, A desativa B; depois só A poderia mexer em A, e a trava "a si mesmo" vem antes. O teste dela roda como painel (sem login), que é o caminho real de acontecer. A ordem das conferências no gatilho garante a mensagem mais específica.
- **Nome que fica:** o nome só é escrito no gatilho de inclusão em `auth.users` (ticket 01); um acesso seguinte só altera `auth.users`. O teste 05 prova isso com um `update` em `auth.users` como o Auth faz.
- **Evento por campo alterado:** `corrigir_nome`, `mudar_perfil`, `desativar` ou `reativar`, `entidade = 'usuario'`, `entidade_ref = id`, `detalhes = {"antes": {campo: valor}, "depois": {campo: valor}}`. A tela altera um campo por vez.
- **Ações por situação:** aguardando → seletor de perfil e Excluir (como no ticket 02); ativo → seletor de perfil, Corrigir nome e Desativar; inativo → seletor de perfil, Corrigir nome e Reativar. A própria linha do administrador também tem as ações: quem impede é o banco, e a tela mostra a trava (critério 7).
- **Corrigir nome** abre um formulário curto na célula do nome (campo, Salvar, Cancelar). Falha: "A alteração não foi salva: {motivo}. Seus dados continuam no formulário." e o campo mantém o texto (critério 8). Salvar fica desligado com o nome vazio.
- **AcessoFalso continua burro:** não simula as travas; os testes de tela põem a falha (`TravaDoBanco` ou texto) em `falhaDeGravacao`. As regras reais estão nos testes pgTAP e a tradução nos testes unitários.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/tests/05_gerir_usuarios.test.sql` (novo) | quem pode alterar `usuarios`, travas, nome que fica, eventos |
| `supabase/migrations/<data>_gerir_usuarios.sql` (novo) | privilégios, política de alteração, gatilho das travas, gatilho de eventos |
| `src/types/database.ts` (gerado) | tipos do banco |
| `supabase/AMBIENTES.md` (alterar) | migração aplicada à mão |
| `src/acesso/falhasDeGravacao.ts` + teste (alterar) | `TravaDoBanco`, `falhaDeGravacao`, `textoDaFalha`, `textoDaFalhaNoFormulario` |
| `src/acesso/tipos.ts` (alterar) | quatro funções novas no `ModuloDeAcesso` |
| `src/acesso/administracaoSupabase.ts` + teste (alterar) | implementação real das quatro funções |
| `src/acesso/AcessoFalso.ts` (alterar) | implementação falsa; `falhaDeGravacao` aceita `Error` |
| `src/components/administracao/LinhaDaTabelaDeUsuarios.tsx` (novo) | uma linha da tabela e as ações conforme a situação |
| `src/components/administracao/CorrecaoDeNome.tsx` (novo) | formulário de correção do nome |
| `src/components/administracao/ListaDeUsuarios.tsx` (alterar) | passa a usar a linha nova |
| `src/components/administracao/AreaDeUsuarios.tsx` (alterar) | liga as ações ao módulo de acesso |
| `src/components/administracao/FormularioDeAutorizacao.tsx` (alterar) | usa `textoDaFalhaNoFormulario` |
| `src/components/administracao/Administracao.css` (alterar) | botões da linha, formulário do nome |
| `src/App.gestaoDeUsuarios.test.tsx` (novo), `src/App.autorizacoes.test.tsx` (alterar) | tela inteira |

---

### Tarefa 1: Banco (critérios 1 a 4)

**Produz:** política `"usuarios: administrador ativo altera"`; funções `private.conferir_alteracao_do_usuario()` e `private.registrar_evento_do_usuario()`; recusas `nao_desativa_a_si_mesmo:<id>`, `nao_muda_o_proprio_perfil:<id>`, `ultimo_administrador:<nome>` (código `P0001`); eventos `corrigir_nome`, `mudar_perfil`, `desativar`, `reativar` com `entidade = 'usuario'`.

- [ ] **1.1 Teste que falha.** Criar `supabase/tests/05_gerir_usuarios.test.sql`:

```sql
-- Gerir usuários: quem altera, travas, nome que fica e eventos (login-perfis, ticket 03).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(40);

-- Usuários inventados: a1 e a5 administradores, a2 integrante, a3 consulta, a4 administrador inativo.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador'),
  ('admin2.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Admin Teste"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Integrante Teste"}'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Consulta Teste"}'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Inativo Teste"}'),
  ('00000000-0000-0000-0000-0000000000a5', 'admin2.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Admin Dois Teste"}');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';
-- O banco dev tem a conta real do usuário: dentro deste teste (desfeito no fim) ela fica inativa,
-- para a1 e a5 serem os únicos administradores ativos.
update public.usuarios set ativo = false where id not in (
  '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2',
  '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a4',
  '00000000-0000-0000-0000-0000000000a5');

-- Quem não pode: integrante, consulta e inativo (as mesmas cinco conferências, sempre sobre a3).
create function pg_temp.conferir_quem_nao_pode(id_usuario text, quem text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  with alteradas as (
    update public.usuarios set nome = 'Trocado' where id = '00000000-0000-0000-0000-0000000000a3' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não corrige nome');
  with alteradas as (
    update public.usuarios set perfil = 'administrador' where id = '00000000-0000-0000-0000-0000000000a3' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não muda perfil');
  with alteradas as (
    update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a3' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não desativa');
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.usuarios (id, nome, perfil) values (gen_random_uuid(), 'Novo', 'consulta')$sql$,
    '42501', null, quem || ' não cria usuário');
  insert into _tap (linha) select throws_ok(
    $sql$delete from public.usuarios where id = '00000000-0000-0000-0000-0000000000a3'$sql$,
    '42501', null, quem || ' não apaga usuário');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_nao_pode(text, text) to authenticated;

select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a4', 'Inativo');

-- Visitante (sem login): nenhum privilégio de escrita.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set nome = 'Trocado'$$, '42501', null, 'Visitante não altera usuário');
insert into _tap (linha) select throws_ok(
  $$insert into public.usuarios (id, nome, perfil) values (gen_random_uuid(), 'Novo', 'consulta')$$,
  '42501', null, 'Visitante não cria usuário');
insert into _tap (linha) select throws_ok('delete from public.usuarios', '42501', null, 'Visitante não apaga usuário');
reset role;

-- Administrador ativo, sobre a2
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
with alteradas as (
  update public.usuarios set nome = '  Integrante Corrigido ' where id = '00000000-0000-0000-0000-0000000000a2' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador corrige nome');
insert into _tap (linha) select is(
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a2'), 'Integrante Corrigido',
  'nome guardado sem espaços nas pontas');
with alteradas as (
  update public.usuarios set perfil = 'consulta' where id = '00000000-0000-0000-0000-0000000000a2' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador muda perfil');
with alteradas as (
  update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a2' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador desativa');
with alteradas as (
  update public.usuarios set ativo = true where id = '00000000-0000-0000-0000-0000000000a2' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador reativa');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set foto_url = 'https://exemplo.invalido/f.png' where id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'a foto não se altera');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set id = gen_random_uuid() where id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'o id não se altera');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set primeiro_acesso_em = now() where id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'a data do primeiro acesso não se altera');
insert into _tap (linha) select throws_ok(
  $$insert into public.usuarios (id, nome, perfil) values (gen_random_uuid(), 'Novo', 'consulta')$$,
  '42501', null, 'Administrador não cria usuário');
insert into _tap (linha) select throws_ok(
  $$delete from public.usuarios where id = '00000000-0000-0000-0000-0000000000a2'$$,
  '42501', null, 'Administrador não apaga usuário');

-- Travas: a si mesmo
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'nao_desativa_a_si_mesmo:00000000-0000-0000-0000-0000000000a1', 'ninguém desativa a si mesmo');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set perfil = 'consulta' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'nao_muda_o_proprio_perfil:00000000-0000-0000-0000-0000000000a1', 'ninguém muda o próprio perfil');

-- Travas: com dois administradores ativos (a1 e a5), rebaixar ou desativar um passa
with alteradas as (
  update public.usuarios set perfil = 'integrante_ep' where id = '00000000-0000-0000-0000-0000000000a5' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'com dois administradores, rebaixar um passa');
with alteradas as (
  update public.usuarios set perfil = 'administrador' where id = '00000000-0000-0000-0000-0000000000a5' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador promove a administrador');
with alteradas as (
  update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a5' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'com dois administradores, desativar um passa');
reset role;

-- Travas: agora a1 é o último administrador ativo; pelo painel (sem login) também não se tira.
select set_config('request.jwt.claims', '', true);
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'ultimo_administrador:Admin Teste', 'desativar o último administrador ativo é recusado');
insert into _tap (linha) select throws_ok(
  $$update public.usuarios set perfil = 'consulta' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  'P0001', 'ultimo_administrador:Admin Teste', 'rebaixar o último administrador ativo é recusado');

-- Nome corrigido não é desfeito no acesso seguinte (o Auth só atualiza auth.users).
update auth.users set raw_user_meta_data = '{"full_name": "Nome do Google"}', last_sign_in_at = now()
  where id = '00000000-0000-0000-0000-0000000000a2';
insert into _tap (linha) select is(
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000a2'), 'Integrante Corrigido',
  'o acesso seguinte não desfaz o nome corrigido');

-- Eventos das alterações em a2 (lidos como dono do banco; a leitura pela interface é do ticket 04)
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos where entidade = 'usuario' and acao = 'corrigir_nome'
    and entidade_ref = '00000000-0000-0000-0000-0000000000a2'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1',
    '{"antes": {"nome": "Integrante Teste"}, "depois": {"nome": "Integrante Corrigido"}}'::jsonb)$$,
  'corrigir nome grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos where entidade = 'usuario' and acao = 'mudar_perfil'
    and entidade_ref = '00000000-0000-0000-0000-0000000000a2'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1',
    '{"antes": {"perfil": "integrante_ep"}, "depois": {"perfil": "consulta"}}'::jsonb)$$,
  'mudar perfil grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos where entidade = 'usuario' and acao = 'desativar'
    and entidade_ref = '00000000-0000-0000-0000-0000000000a2'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1', '{"antes": {"ativo": true}, "depois": {"ativo": false}}'::jsonb)$$,
  'desativar grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos where entidade = 'usuario' and acao = 'reativar'
    and entidade_ref = '00000000-0000-0000-0000-0000000000a2'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1', '{"antes": {"ativo": false}, "depois": {"ativo": true}}'::jsonb)$$,
  'reativar grava evento com autor, antes e depois');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

- [ ] **1.2 Ver falhar.** Conferir o alvo (`AMBIENTES.md` e `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`). Pedir ao usuário que cole o arquivo no SQL Editor do dev e traga o resultado. Esperado: `not ok` nas linhas de criar e apagar (ainda com privilégio), nas alterações do administrador (sem política: 0 linhas), nas travas e nos eventos; `ok` nas de "quem não pode" que dependem só da RLS.

- [ ] **1.3 Migração.** `npx supabase migration new gerir_usuarios` e preencher:

```sql
-- Login e perfis, ticket 03: o administrador muda perfil, desativa, reativa e corrige o nome de quem já entrou.
-- Travas no formato "motivo:valor", traduzidas pela interface (src/acesso/falhasDeGravacao.ts).

-- Privilégios: ninguém cria nem apaga usuário pela API (a linha nasce no primeiro acesso; ADR 0002);
-- de quem já entrou, só nome, perfil e ativo se alteram.
revoke insert, update, delete on public.usuarios from anon, authenticated;
grant update (nome, perfil, ativo) on public.usuarios to authenticated;

create policy "usuarios: administrador ativo altera" on public.usuarios
  for update to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador')
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

-- Travas antes de alterar. Security invoker de propósito: só chega aqui quem a RLS deixou alterar (administrador
-- ativo, que lê todos os usuários) ou o dono do banco no painel, onde auth.uid() é nulo e só a última trava vale.
create function private.conferir_alteracao_do_usuario() returns trigger
language plpgsql set search_path = ''
as $$
declare
  quem uuid := (select auth.uid());
begin
  new.nome := btrim(new.nome);
  if old.id = quem and old.ativo and not new.ativo then
    raise exception 'nao_desativa_a_si_mesmo:%', old.id using errcode = 'P0001';
  end if;
  if old.id = quem and new.perfil <> old.perfil then
    raise exception 'nao_muda_o_proprio_perfil:%', old.id using errcode = 'P0001';
  end if;
  -- ponytail: dois administradores rebaixando um ao outro no mesmo instante passariam os dois; com até 10 usuários,
  -- aceito. Se pesar, travar as linhas de administradores (select … for update) antes de contar.
  if old.perfil = 'administrador' and old.ativo and (new.perfil <> 'administrador' or not new.ativo)
    and not exists (select 1 from public.usuarios u where u.perfil = 'administrador' and u.ativo and u.id <> old.id) then
    raise exception 'ultimo_administrador:%', old.nome using errcode = 'P0001';
  end if;
  return new;
end $$;

-- Um evento por campo alterado; a tela altera um campo por vez.
create function private.registrar_evento_do_usuario() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := to_jsonb(old);
  depois jsonb := to_jsonb(new);
  campo text;
begin
  foreach campo in array array['nome', 'perfil', 'ativo'] loop
    continue when antes -> campo = depois -> campo;
    insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
    values ((select auth.uid()),
      case campo when 'nome' then 'corrigir_nome' when 'perfil' then 'mudar_perfil'
        else case when new.ativo then 'reativar' else 'desativar' end end,
      'usuario', new.id::text,
      jsonb_build_object('antes', jsonb_build_object(campo, antes -> campo),
        'depois', jsonb_build_object(campo, depois -> campo)));
  end loop;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.conferir_alteracao_do_usuario(), private.registrar_evento_do_usuario()
  from public, anon, authenticated;

create trigger conferir_alteracao_do_usuario before update on public.usuarios
  for each row execute function private.conferir_alteracao_do_usuario();

create trigger registrar_evento_do_usuario after update on public.usuarios
  for each row execute function private.registrar_evento_do_usuario();
```

- [ ] **1.4 Aplicar e ver passar.** Pedir ao usuário que cole a migração no SQL Editor do dev; depois o `05_gerir_usuarios.test.sql` (esperado: `ok` 1 a 40) e de novo `02_login_barreira`, `03_login_leitura` e `04_autorizacoes` (esperado: continuam passando; o `update … ativo = false` da preparação deles agora passa pelas travas e grava evento). Se algo falhar, ajustar a migração **antes** de dá-la por aplicada (no dev, colar `drop trigger …; drop function …; drop policy …;` e os `grant` de volta, e reaplicar; regra das 3 tentativas).
- [ ] **1.5 Tipos e registro.** `npm run db:types` (vínculo conferido). Acrescentar a migração à lista de "Migrações aplicadas à mão" em `supabase/AMBIENTES.md`, com a data e os testes que passaram.
- [ ] **1.6 Commit:** teste, migração, tipos e `AMBIENTES.md` juntos — `Gere usuários no banco: alteração pelo administrador, travas e eventos`.

---

### Tarefa 2: Tradução das travas (critério 7)

**Produz:** em `src/acesso/falhasDeGravacao.ts`: `class TravaDoBanco extends Error`; `falhaDeGravacao(erro: ErroDoBanco): Error`; `textoDaFalha(erro: unknown): string`; `textoDaFalhaNoFormulario(erro: unknown): string`. `motivoDaFalhaDeGravacao` continua exportada.

- [ ] **2.1 Teste que falha.** Acrescentar a `src/acesso/falhasDeGravacao.test.ts` (e importar os nomes novos):

```ts
describe('falhaDeGravacao', () => {
  test.each([
    ['nao_desativa_a_si_mesmo:u1', 'Você não pode desativar a si mesmo.'],
    ['nao_muda_o_proprio_perfil:u1', 'Você não pode mudar o seu próprio perfil.'],
    ['ultimo_administrador:Ana Maria Teste', 'Não é possível: Ana Maria Teste é o último administrador ativo.'],
  ])('a trava "%s" vira TravaDoBanco com a frase da tela', (mensagem, frase) => {
    const falha = falhaDeGravacao({ message: mensagem, code: 'P0001' })
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe(frase)
  })

  test('outras recusas viram Error comum com o motivo', () => {
    const falha = falhaDeGravacao({ message: 'email_ja_autorizado:x.teste@ccivil.pr.gov.br', code: 'P0001' })
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect(falha.message).toBe('o e-mail x.teste@ccivil.pr.gov.br já está autorizado')
  })
})

describe('texto da falha na tela', () => {
  test('a trava aparece como frase própria, na linha e no formulário', () => {
    const trava = new TravaDoBanco('Você não pode desativar a si mesmo.')
    expect(textoDaFalha(trava)).toBe('Você não pode desativar a si mesmo.')
    expect(textoDaFalhaNoFormulario(trava)).toBe('Você não pode desativar a si mesmo.')
  })

  test('a falha comum ganha o prefixo; no formulário, também o aviso de que os dados ficaram', () => {
    const falha = new Error('seu perfil não permite esta alteração')
    expect(textoDaFalha(falha)).toBe('A alteração não foi salva: seu perfil não permite esta alteração.')
    expect(textoDaFalhaNoFormulario(falha))
      .toBe('A alteração não foi salva: seu perfil não permite esta alteração. Seus dados continuam no formulário.')
  })
})
```

- [ ] **2.2 Ver falhar:** `npx vitest run src/acesso/falhasDeGravacao.test.ts` — falha por nomes inexistentes.
- [ ] **2.3 Implementar.** Acrescentar a `src/acesso/falhasDeGravacao.ts`:

```ts
type RecusaPorTrava = 'nao_desativa_a_si_mesmo' | 'nao_muda_o_proprio_perfil' | 'ultimo_administrador'

// Travas de private.conferir_alteracao_do_usuario. O nome do último administrador pode ter espaços:
// o valor vai até o fim da mensagem.
const PADRAO_DA_TRAVA = /\b(nao_desativa_a_si_mesmo|nao_muda_o_proprio_perfil|ultimo_administrador):(.*)$/m

const FRASE_DA_TRAVA: Record<RecusaPorTrava, (valor: string) => string> = {
  nao_desativa_a_si_mesmo: () => 'Você não pode desativar a si mesmo.',
  nao_muda_o_proprio_perfil: () => 'Você não pode mudar o seu próprio perfil.',
  ultimo_administrador: (nome) => `Não é possível: ${nome} é o último administrador ativo.`,
}

/** Recusa por uma trava de usuários: a mensagem já é a frase completa da tela. */
export class TravaDoBanco extends Error {
  name = 'TravaDoBanco'
}

export function falhaDeGravacao(erro: ErroDoBanco): Error {
  const trava = erro.message.match(PADRAO_DA_TRAVA)
  if (trava) return new TravaDoBanco(FRASE_DA_TRAVA[trava[1] as RecusaPorTrava](trava[2].trim()))
  return new Error(motivoDaFalhaDeGravacao(erro))
}

export function textoDaFalha(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A alteração não foi salva: ${mensagemDoErro(erro)}.`
}

export function textoDaFalhaNoFormulario(erro: unknown): string {
  if (erro instanceof TravaDoBanco) return erro.message
  return `A alteração não foi salva: ${mensagemDoErro(erro)}. Seus dados continuam no formulário.`
}

function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}
```

- [ ] **2.4 Ver passar:** o mesmo comando, verde.
- [ ] **2.5 Commit:** `Traduz as travas de usuários em frases da tela`.

---

### Tarefa 3: Módulo de acesso (critério 5)

**Consome:** `falhaDeGravacao`, `TravaDoBanco` (tarefa 2).
**Produz:** no `ModuloDeAcesso`: `mudarPerfilDoUsuario(id: string, perfil: Perfil): Promise<void>`, `desativarUsuario(id: string): Promise<void>`, `reativarUsuario(id: string): Promise<void>`, `corrigirNome(id: string, nome: string): Promise<void>`. No `AcessoFalso`: as quatro, e `falhaDeGravacao: string | Error | null`.

- [ ] **3.1 Teste que falha.** Acrescentar ao `describe` de `src/acesso/administracaoSupabase.test.ts` (importar `TravaDoBanco` de `./falhasDeGravacao`):

```ts
  test('mudar perfil, desativar, reativar e corrigir nome alteram só a coluna, filtrando pelo id', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['usuarios.update'] = { data: [{ id: 'u1' }], error: null }
    const administracao = criar(cliente)
    await administracao.mudarPerfilDoUsuario('u1', 'consulta')
    await administracao.desativarUsuario('u1')
    await administracao.reativarUsuario('u1')
    await administracao.corrigirNome('u1', 'Ana Corrigida')
    expect(cliente.pedidos.map(({ tabela, operacao, valores, filtro }) => ({ tabela, operacao, valores, filtro })))
      .toEqual([
        { tabela: 'usuarios', operacao: 'update', valores: { perfil: 'consulta' }, filtro: ['id', 'u1'] },
        { tabela: 'usuarios', operacao: 'update', valores: { ativo: false }, filtro: ['id', 'u1'] },
        { tabela: 'usuarios', operacao: 'update', valores: { ativo: true }, filtro: ['id', 'u1'] },
        { tabela: 'usuarios', operacao: 'update', valores: { nome: 'Ana Corrigida' }, filtro: ['id', 'u1'] },
      ])
  })

  test('alteração de usuário que não muda nenhuma linha vira falha com o id', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['usuarios.update'] = { data: [], error: null }
    await expect(criar(cliente).desativarUsuario('u1')).rejects.toThrow(/usuário u1 não foi encontrado/)
  })

  test('a trava do banco chega como TravaDoBanco com a frase da tela', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['usuarios.update'] = { data: null,
      error: { message: 'ultimo_administrador:Ana Teste', code: 'P0001' } }
    const falha = await criar(cliente).desativarUsuario('u1').catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('Não é possível: Ana Teste é o último administrador ativo.')
  })
```

- [ ] **3.2 Ver falhar:** `npx vitest run src/acesso/administracaoSupabase.test.ts`.
- [ ] **3.3 Implementar.**
  - `src/acesso/tipos.ts`: acrescentar ao `ModuloDeAcesso`:

    ```ts
      mudarPerfilDoUsuario(id: string, perfil: Perfil): Promise<void>
      desativarUsuario(id: string): Promise<void>
      reativarUsuario(id: string): Promise<void>
      corrigirNome(id: string, nome: string): Promise<void>
    ```

  - `src/acesso/administracaoSupabase.ts`: incluir os quatro nomes no `Pick` de `FuncoesDeAdministracao`; trocar `motivoDaFalhaDeGravacao` por `falhaDeGravacao` (o `throw new Error(motivo…)` vira `throw falhaDeGravacao(error)`); generalizar `conferirAlteracao(resposta, naoEncontrado: string)` (as chamadas de autorização passam `` `a autorização de ${email} não foi encontrada (pode já ter sido usada no primeiro acesso)` ``); e acrescentar:

    ```ts
    type AlteracaoDoUsuario = Pick<Database['public']['Tables']['usuarios']['Update'], 'nome' | 'perfil' | 'ativo'>

    // no objeto de criarAdministracaoSupabase:
        mudarPerfilDoUsuario: (id, perfil) => alterarUsuario(cliente, id, { perfil }),
        desativarUsuario: (id) => alterarUsuario(cliente, id, { ativo: false }),
        reativarUsuario: (id) => alterarUsuario(cliente, id, { ativo: true }),
        corrigirNome: (id, nome) => alterarUsuario(cliente, id, { nome }),

    // A RLS filtra sem erro: zero linhas quer dizer que o usuário não existe ou que o perfil não permite.
    async function alterarUsuario(cliente: ClienteSupabase, id: string, alteracao: AlteracaoDoUsuario): Promise<void> {
      const resposta = await cliente.from('usuarios').update(alteracao).eq('id', id).select('id')
      conferirAlteracao(resposta, `o usuário ${id} não foi encontrado ou seu perfil não permite alterá-lo`)
    }
    ```

  - `src/acesso/AcessoFalso.ts`: `falhaDeGravacao: string | Error | null = null`; `conferirGravacao` lança `new Error(texto)` para texto e o próprio `Error` para erro; acrescentar:

    ```ts
      async mudarPerfilDoUsuario(id: string, perfil: Perfil): Promise<void> {
        this.alterarLinha(id, { perfil })
      }

      async desativarUsuario(id: string): Promise<void> {
        this.alterarLinha(id, { situacao: 'inativo' })
      }

      async reativarUsuario(id: string): Promise<void> {
        this.alterarLinha(id, { situacao: 'ativo' })
      }

      async corrigirNome(id: string, nome: string): Promise<void> {
        this.alterarLinha(id, { nome })
      }

      private alterarLinha(chave: string, mudanca: Partial<LinhaDeUsuario>): void {
        this.conferirGravacao()
        this.linhas = this.linhas.map((linha) => (linha.chave === chave ? { ...linha, ...mudanca } : linha))
      }
    ```

- [ ] **3.4 Ver passar:** `npm test` e `npm run typecheck`, verdes.
- [ ] **3.5 Commit:** `Acrescenta ao módulo de acesso as alterações de usuário`.

---

### Tarefa 4: Ações na tela (critérios 6, 7, 8 e 9)

**Consome:** tarefas 2 e 3.

- [ ] **4.1 Teste que falha.** Criar `src/App.gestaoDeUsuarios.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ANA = 'ana.teste@ccivil.pr.gov.br'
const BETO = 'beto.teste@ccivil.pr.gov.br'
const AGUARDANDO = 'nova.teste@ccivil.pr.gov.br'
const LINHAS: LinhaDeUsuario[] = [
  { chave: AGUARDANDO, nome: null, email: AGUARDANDO, fotoUrl: null, perfil: 'consulta', situacao: 'aguardando' },
  { chave: 'u-ana', nome: 'Ana Teste', email: ANA, fotoUrl: null, perfil: 'consulta', situacao: 'ativo' },
  { chave: 'u-beto', nome: 'Beto Teste', email: BETO, fotoUrl: null, perfil: 'integrante_ep', situacao: 'inativo' },
]

async function abrirComoAdministrador() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [...LINHAS]
  render(<App acesso={acesso} />)
  await screen.findByRole('table')
  return acesso
}

function linhaDe(email: string) {
  return within(screen.getByText(email).closest('tr') as HTMLElement)
}

function perfilNaTela(email: string) {
  return (screen.getByLabelText(`Perfil de ${email}`) as HTMLSelectElement).value
}

test('cada linha mostra as ações da sua situação; quem já entrou não tem Excluir', async () => {
  await abrirComoAdministrador()
  expect(linhaDe(ANA).getByRole('button', { name: `Desativar ${ANA}` })).toBeTruthy()
  expect(linhaDe(ANA).getByRole('button', { name: `Corrigir nome de ${ANA}` })).toBeTruthy()
  expect(linhaDe(ANA).queryByRole('button', { name: /Reativar|Excluir/ })).toBeNull()
  expect(linhaDe(BETO).getByRole('button', { name: `Reativar ${BETO}` })).toBeTruthy()
  expect(linhaDe(BETO).queryByRole('button', { name: /Desativar|Excluir/ })).toBeNull()
  expect(linhaDe(AGUARDANDO).getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` })).toBeTruthy()
  expect(linhaDe(AGUARDANDO).queryByRole('button', { name: /Desativar|Reativar|Corrigir/ })).toBeNull()
})

test('muda o perfil de um usuário', async () => {
  const acesso = await abrirComoAdministrador()
  fireEvent.change(screen.getByLabelText(`Perfil de ${ANA}`), { target: { value: 'integrante_ep' } })
  await waitFor(() => expect(acesso.linhas.find((linha) => linha.email === ANA)?.perfil).toBe('integrante_ep'))
  await waitFor(() => expect(perfilNaTela(ANA)).toBe('integrante_ep'))
})

test('trava: mudar o próprio perfil mostra a regra e mantém o perfil', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = new TravaDoBanco('Você não pode mudar o seu próprio perfil.')
  fireEvent.change(screen.getByLabelText(`Perfil de ${ANA}`), { target: { value: 'administrador' } })
  expect(await screen.findByText('Você não pode mudar o seu próprio perfil.')).toBeTruthy()
  expect(perfilNaTela(ANA)).toBe('consulta')
})

test('desativa um usuário ativo', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  expect(await screen.findByRole('button', { name: `Reativar ${ANA}` })).toBeTruthy()
  expect(linhaDe(ANA).getByText('Inativo')).toBeTruthy()
})

test('trava: desativar a si mesmo mostra a regra e mantém a linha', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = new TravaDoBanco('Você não pode desativar a si mesmo.')
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  expect(await screen.findByText('Você não pode desativar a si mesmo.')).toBeTruthy()
  expect(screen.getByRole('button', { name: `Desativar ${ANA}` })).toBeTruthy()
})

test('trava: último administrador ativo mostra a regra com o nome', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = new TravaDoBanco('Não é possível: Ana Teste é o último administrador ativo.')
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  expect(await screen.findByText('Não é possível: Ana Teste é o último administrador ativo.')).toBeTruthy()
})

test('reativa um usuário inativo', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  expect(await screen.findByRole('button', { name: `Desativar ${BETO}` })).toBeTruthy()
  expect(linhaDe(BETO).getByText('Ativo')).toBeTruthy()
})

test('falha ao reativar mostra o motivo e mantém a linha', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'seu perfil não permite esta alteração'
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  expect(await screen.findByText('A alteração não foi salva: seu perfil não permite esta alteração.')).toBeTruthy()
  expect(screen.getByRole('button', { name: `Reativar ${BETO}` })).toBeTruthy()
})

test('corrige o nome de um usuário', async () => {
  const acesso = await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  const campo = screen.getByLabelText(`Nome de ${ANA}`) as HTMLInputElement
  expect(campo.value).toBe('Ana Teste')
  fireEvent.change(campo, { target: { value: '  Ana Corrigida ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('Ana Corrigida')).toBeTruthy()
  expect(screen.queryByLabelText(`Nome de ${ANA}`)).toBeNull()
  expect(acesso.linhas.find((linha) => linha.email === ANA)?.nome).toBe('Ana Corrigida')
})

test('falha ao corrigir o nome mostra o motivo e mantém o que foi digitado', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'erro inesperado do banco (Failed to fetch)'
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  fireEvent.change(screen.getByLabelText(`Nome de ${ANA}`), { target: { value: 'Ana Corrigida' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('A alteração não foi salva: erro inesperado do banco (Failed to fetch). '
    + 'Seus dados continuam no formulário.')).toBeTruthy()
  expect((screen.getByLabelText(`Nome de ${ANA}`) as HTMLInputElement).value).toBe('Ana Corrigida')
})

test('cancelar a correção volta ao nome sem gravar', async () => {
  const acesso = await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  fireEvent.change(screen.getByLabelText(`Nome de ${ANA}`), { target: { value: 'Outro Nome' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.getByText('Ana Teste')).toBeTruthy()
  expect(acesso.linhas.find((linha) => linha.email === ANA)?.nome).toBe('Ana Teste')
})

test('Salvar fica desligado com o nome vazio', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  fireEvent.change(screen.getByLabelText(`Nome de ${ANA}`), { target: { value: '   ' } })
  expect((screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(true)
})
```

  Em `src/App.autorizacoes.test.tsx`, apagar o último teste ("usuário que já entrou não tem seletor de perfil nem Excluir neste ticket"): o primeiro teste do arquivo novo o substitui.

- [ ] **4.2 Ver falhar:** `npx vitest run src/App.gestaoDeUsuarios.test.tsx` — falha por não achar os botões.
- [ ] **4.3 Implementar.**
  - Criar `src/components/administracao/CorrecaoDeNome.tsx`:

    ```tsx
    import { type FormEvent, useState } from 'react'
    import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'

    type CorrecaoDeNomeProps = {
      email: string
      nomeAtual: string
      aoSalvar: (nome: string) => Promise<void>
      aoCancelar: () => void
    }

    export function CorrecaoDeNome({ email, nomeAtual, aoSalvar, aoCancelar }: CorrecaoDeNomeProps) {
      const [nome, setNome] = useState(nomeAtual)
      const [aviso, setAviso] = useState<string | null>(null)
      const [enviando, setEnviando] = useState(false)

      async function enviar(evento: FormEvent) {
        evento.preventDefault()
        setAviso(null)
        setEnviando(true)
        try {
          await aoSalvar(nome.trim())
        } catch (erro) {
          setAviso(textoDaFalhaNoFormulario(erro))
        } finally {
          setEnviando(false)
        }
      }

      // autoFocus: o botão "Corrigir nome" some ao abrir o formulário; o foco vai para o campo.
      return (
        <form className="correcao-de-nome" aria-label={`Corrigir nome de ${email}`} onSubmit={enviar}>
          <input aria-label={`Nome de ${email}`} value={nome} autoFocus onChange={(evento) => setNome(evento.target.value)} />
          <button type="submit" className="botao botao-principal" disabled={enviando || !nome.trim()}>Salvar</button>
          <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
          {aviso && <p className="administracao-falha" role="alert">{aviso}</p>}
        </form>
      )
    }
    ```

  - Criar `src/components/administracao/LinhaDaTabelaDeUsuarios.tsx`, movendo para ele `ROTULO_DA_SITUACAO`, `PILULA_DA_SITUACAO` e a linha que hoje está em `ListaDeUsuarios.tsx`:

    ```tsx
    import { useState } from 'react'
    import type { LinhaDeUsuario, Perfil, SituacaoDoUsuario } from '../../acesso/tipos'
    import { Avatar } from '../Avatar'
    import { Pilula, type SituacaoPilula } from '../Pilula'
    import { CorrecaoDeNome } from './CorrecaoDeNome'
    import { SeletorDePerfil } from './SeletorDePerfil'

    const ROTULO_DA_SITUACAO: Record<SituacaoDoUsuario, string> = {
      ativo: 'Ativo', inativo: 'Inativo', aguardando: 'Aguardando primeiro acesso',
    }
    const PILULA_DA_SITUACAO: Record<SituacaoDoUsuario, SituacaoPilula> = {
      ativo: 'aprovado', inativo: 'neutra', aguardando: 'informativa',
    }

    export type AcoesDaLinha = {
      aoMudarPerfil: (linha: LinhaDeUsuario, perfil: Perfil) => void
      aoExcluir: (email: string) => void
      aoDesativar: (id: string) => void
      aoReativar: (id: string) => void
      aoCorrigirNome: (id: string, nome: string) => Promise<void>
    }
    type LinhaDaTabelaDeUsuariosProps = AcoesDaLinha & { linha: LinhaDeUsuario }

    export function LinhaDaTabelaDeUsuarios({ linha, ...acoes }: LinhaDaTabelaDeUsuariosProps) {
      const [corrigindo, setCorrigindo] = useState(false)
      const salvarNome = async (nome: string) => {
        await acoes.aoCorrigirNome(linha.chave, nome)
        setCorrigindo(false)
      }
      return (
        <tr>
          <td>
            {corrigindo
              ? <CorrecaoDeNome email={linha.email} nomeAtual={linha.nome ?? ''} aoSalvar={salvarNome}
                  aoCancelar={() => setCorrigindo(false)} />
              : <NomeDaLinha linha={linha} />}
          </td>
          <td>{linha.email}</td>
          <td>
            <SeletorDePerfil rotulo={`Perfil de ${linha.email}`} valor={linha.perfil}
              aoMudar={(perfil) => acoes.aoMudarPerfil(linha, perfil)} />
          </td>
          <td><Pilula situacao={PILULA_DA_SITUACAO[linha.situacao]}>{ROTULO_DA_SITUACAO[linha.situacao]}</Pilula></td>
          <td><BotoesDaLinha linha={linha} acoes={acoes} aoCorrigirNome={() => setCorrigindo(true)} /></td>
        </tr>
      )
    }

    function NomeDaLinha({ linha }: { linha: LinhaDeUsuario }) {
      return (
        <span className="tabela-usuarios-nome">
          {linha.nome && <Avatar nome={linha.nome} fotoUrl={linha.fotoUrl ?? undefined} tamanho={24} />}
          {linha.nome ?? '—'}
        </span>
      )
    }

    type BotoesDaLinhaProps = { linha: LinhaDeUsuario; acoes: AcoesDaLinha; aoCorrigirNome: () => void }

    // Quem já entrou não se exclui, só se desativa (ADR 0002).
    function BotoesDaLinha({ linha, acoes, aoCorrigirNome }: BotoesDaLinhaProps) {
      if (linha.situacao === 'aguardando') {
        return (
          <button type="button" className="botao botao-secundario" aria-label={`Excluir autorização de ${linha.email}`}
            onClick={() => acoes.aoExcluir(linha.email)}>
            Excluir
          </button>
        )
      }
      const ativo = linha.situacao === 'ativo'
      const acao = ativo ? 'Desativar' : 'Reativar'
      return (
        <span className="tabela-usuarios-acoes">
          <button type="button" className="botao botao-secundario" aria-label={`Corrigir nome de ${linha.email}`}
            onClick={aoCorrigirNome}>
            Corrigir nome
          </button>
          <button type="button" className="botao botao-secundario" aria-label={`${acao} ${linha.email}`}
            onClick={() => (ativo ? acoes.aoDesativar(linha.chave) : acoes.aoReativar(linha.chave))}>
            {acao}
          </button>
        </span>
      )
    }
    ```

  - `ListaDeUsuarios.tsx`: tirar `LinhaDaTabela`, os dois mapas, `AcoesDaLinha` e os imports que sobrarem; importar `LinhaDaTabelaDeUsuarios` e `type AcoesDaLinha` do arquivo novo; no `map`, `<LinhaDaTabelaDeUsuarios key={linha.chave} linha={linha} {...acoes} />`.
  - `AreaDeUsuarios.tsx`: `gravarNaLinha` passa a fazer `setFalhaNaLinha(textoDaFalha(erro))`, e o aviso mostra `{falhaNaLinha}` sem prefixo; as ações:

    ```tsx
      <ListaDeUsuarios lista={lista} aoTentarDeNovo={tentarDeNovo}
        aoMudarPerfil={(linha, perfil) => gravarNaLinha(() => (linha.situacao === 'aguardando'
          ? acesso.mudarPerfilDaAutorizacao(linha.email, perfil)
          : acesso.mudarPerfilDoUsuario(linha.chave, perfil)))}
        aoExcluir={(email) => gravarNaLinha(() => acesso.excluirAutorizacao(email))}
        aoDesativar={(id) => gravarNaLinha(() => acesso.desativarUsuario(id))}
        aoReativar={(id) => gravarNaLinha(() => acesso.reativarUsuario(id))}
        aoCorrigirNome={(id, nome) => gravar(() => acesso.corrigirNome(id, nome))} />
    ```

  - `FormularioDeAutorizacao.tsx`: no `catch`, `setAviso(textoDaFalhaNoFormulario(erro))` (mesmo texto de antes, agora num lugar só).
  - `Administracao.css`: acrescentar

    ```css
    .tabela-usuarios-acoes,
    .correcao-de-nome {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--esp-2);
    }

    .correcao-de-nome input {
      padding: var(--esp-1) var(--esp-2);
      border: 1px solid var(--linha);
      border-radius: var(--canto-botao);
      background: var(--folha);
      color: var(--texto);
    }

    .correcao-de-nome .administracao-falha {
      flex-basis: 100%;
      margin: 0;
    }
    ```

  Se o ESLint recusar o `autoFocus` (regra de acessibilidade), trocar por `useRef` + `useEffect` que dá foco ao campo ao montar.

- [ ] **4.4 Ver passar:** `npm test`, `npm run typecheck`, `npm run lint`, todos verdes.
- [ ] **4.5 Commit:** `Muda perfil, desativa, reativa e corrige nome na tela de usuários`.

---

### Tarefa 5: Conferência final

- [ ] **5.1** `npm run test:coverage` (≥ 70%), `npm run typecheck`, `npm run lint`, `npm run check:circular`, todos passando. Ler as linhas sem cobertura dos arquivos tocados e classificar (comportamento real sem teste → teste ou backlog; ligação com serviço real → teste manual; reserva → fica), informando o percentual e os achados ao usuário.
- [ ] **5.2 Olhar a tela.** Conferir quem ocupa as portas 5173 a 5176 antes de subir o servidor; subir `npm run dev` em segundo plano na 5173 (o retorno do Google só funciona nela). Pedir ao usuário, logado como administrador no dev (ele é o único usuário real): (1) corrigir o próprio nome e ver a lista; (2) sair, entrar de novo e conferir que o nome corrigido ficou; (3) tentar desativar a si mesmo e ver "Você não pode desativar a si mesmo."; (4) tentar mudar o próprio perfil e ver "Você não pode mudar o seu próprio perfil." com o perfil de volta; (5) devolver o nome original; (6) conferir botões e pílulas de cada linha. Depois, no SQL Editor: `select acao, autor_id is not null as tem_autor, detalhes from public.eventos where entidade = 'usuario' and acao <> 'primeiro_acesso' order by id desc limit 5;` deve mostrar os dois `corrigir_nome` com autor. Desativar e reativar outra pessoa ficam provados pelos testes de banco e de tela (não há segunda conta real no dev; ADR 0001).
- [ ] **5.3** Marcar os critérios do ticket que passaram e anotar na spec, se algo mudou na execução (com a data).
- [ ] **5.4 Commit** do plano e do ticket marcados.
