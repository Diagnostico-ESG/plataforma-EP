# Ticket 01 (Setores: ver e cadastrar): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** área Setores (`#/setores`) com três abas, lista dos setores ativos e cadastro de setor, sobre a tabela `setores` com RLS por perfil e gatilhos de evento.

**Architecture:** o banco impõe tudo (formato e unicidade da sigla, nome único, perfil, eventos) por restrições, gatilhos e RLS numa migração. A interface fala com o banco por um módulo de cadastros novo (`src/cadastros/`), injetado no `App` ao lado do módulo de acesso, com implementação real (cliente Supabase com a chave publicável) e falsa nomeada (`CadastrosFalso`). A área e a aba ficam no endereço (`#/setores`, `#/setores/macroprocessos`, `#/setores/historico`).

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/cadastros-basicos/spec.md` · **Ticket:** `.scratch/cadastros-basicos/issues/01-setores-ver-e-cadastrar.md` (critérios citados como "critério N", na ordem do ticket).

## Restrições globais

- Regras de `.claude/regras/banco.md` que valem aqui: teste antes da migração; migração criada com `npx supabase migration new`; RLS ligada e políticas na mesma migração; função `security definer` só em `private`, com `search_path` vazio; políticas com `(select auth.uid())` pelas funções de `private`; cada célula de "quem pode o quê" com teste (Administrador, Integrante, Consulta, inativo, visitante); interface só pela chave publicável, via `src/lib/supabase.ts`; conferir o vínculo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`) antes de `test:db` e `db:types`.
- Rede do escritório: a porta 5432 está bloqueada. A migração é aplicada **pelo usuário** no SQL Editor do projeto de desenvolvimento, e a bateria pgTAP roda no GitHub Actions ("Testes de banco", botão "Run workflow" escolhendo a branch `cadastros-basicos`). Enviar a branch ao GitHub pede autorização do usuário na hora.
- Migração, teste de banco e tipos (`src/types/database.ts`) no mesmo commit.
- `npm test` nunca depende do banco: telas testadas com `CadastrosFalso` e `AcessoFalso`.
- Limites do ESLint: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10. Nada de `any`.
- Dados de teste inventados (siglas e nomes fictícios; os casos "CEE" e "Assessoria Jurídica" vêm da spec).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **Recusas com frase pronta:** as três recusas do critério 17 chegam como `TravaDoBanco` (classe que já existe em `src/acesso/falhasDeGravacao.ts`) e aparecem sozinhas, como as travas da Administração. Só as falhas genéricas usam "A alteração não foi salva: {motivo}. Seus dados continuam no formulário." (critério 21). Nos dois casos o formulário fica preenchido.
- **Tradução das recusas pelo código do Postgres e pelo nome da restrição** (`23505` + `setores_sigla_key` ou `setores_nome_unico`, `42501`), com a frase montada a partir do que a tela enviou. Não há exceção personalizada no gatilho.
- **Nome vazio na tela:** "O nome do setor é obrigatório." (a spec não tem texto para esse caso).
- **Abas Macroprocessos e Histórico** mostram "Esta seção chega numa próxima entrega." até os tickets 03 e 05.
- **Abas como links** (`<a href="#/setores/...">`): a navegação por âncora já põe a aba no endereço, sem código de clique.
- **Ordem:** o módulo real pede `order('sigla')` ao banco. A tela mostra na ordem recebida e filtra os ativos.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/11_setores.test.sql` (novo) | pgTAP: quem pode o quê, sigla e nome, eventos |
| `supabase/migrations/<data>_setores.sql` (novo) | tabela, restrições, gatilhos, RLS, privilégios |
| `supabase/AMBIENTES.md` | registro da migração aplicada à mão |
| `src/types/database.ts` | tipos gerados por `npm run db:types` |
| `src/testes/ClienteSupabaseFalso.ts` (novo, extraído) | cliente Supabase falso, compartilhado pelos testes de módulo |
| `src/acesso/administracaoSupabase.test.ts` | passa a importar o cliente falso extraído |
| `src/cadastros/tipos.ts` (novo) | `Setor`, `DadosDoSetor`, `ModuloDeCadastros` |
| `src/cadastros/cadastrosSupabase.ts` (+ `.test.ts`) (novo) | módulo real e tradução das recusas |
| `src/cadastros/CadastrosFalso.ts` (novo) | módulo falso nomeado para os testes de tela |
| `src/cadastros/validacaoDoSetor.ts` (+ `.test.ts`) (novo) | normalizar e validar a sigla e o nome |
| `src/hooks/useEndereco.ts` (novo) | endereço atual (hash) com atualização em `hashchange` |
| `src/hooks/useAreaAtual.ts` | passa a usar `useEndereco`; reconhece `setores` |
| `src/components/moldura/areas.ts` | `setores` ganha tela |
| `src/components/cadastros/AreaDeCadastros.tsx` (novo) | abas e seção atual |
| `src/components/cadastros/AreaDeSetores.tsx` (novo) | carrega, [Novo setor], formulário e lista |
| `src/components/cadastros/ListaDeSetores.tsx` (novo) | tabela e estados |
| `src/components/cadastros/FormularioDeSetor.tsx` (novo) | nome, sigla, observações |
| `src/components/cadastros/Cadastros.css` (novo) | abas, tabela compacta, mensagens |
| `src/App.tsx`, `src/main.tsx` | injeção do módulo de cadastros e área Setores |
| `src/App*.test.tsx` (existentes) | passam `cadastros={new CadastrosFalso()}` |
| `src/App.setores.test.tsx`, `src/App.novoSetor.test.tsx` (novos) | testes de tela |

---

### Tarefa 1: Banco: tabela `setores`, RLS, regras e eventos (critérios 1, 2 e 3)

**Files:**
- Create: `supabase/tests/11_setores.test.sql`
- Create: `supabase/migrations/<data>_setores.sql` (por `npx supabase migration new setores`)
- Modify: `supabase/AMBIENTES.md`, `src/types/database.ts` (gerado)

**Interfaces:**
- Produz: tabela `public.setores (id uuid, nome text, sigla text, observacoes text, ativo boolean, criado_em timestamptz)`; restrições `setores_sigla_key`, `setores_nome_unico`, `setores_sigla_formato`; funções `private.pode_alterar_cadastros()` e `private.acao_do_cadastro(text, jsonb, jsonb)`, reaproveitadas pelos tickets 03 e 04; eventos `entidade = 'setor'`, `entidade_ref = id`, `detalhes = {antes, depois}` com `sigla, nome, observacoes, ativo`.

- [x] **Passo 1: criar a branch.** `git switch -c cadastros-basicos`.
- [x] **Passo 2: escrever o teste pgTAP** em `supabase/tests/11_setores.test.sql`:

```sql
-- Setores: quem pode o quê, regras da sigla e do nome, e eventos (cadastros-basicos, ticket 01).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(47);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
-- O inativo é administrador de propósito: a recusa dele só pode vir de estar inativo.
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

-- Setor inventado que todos tentam ler, alterar e apagar.
insert into public.setores (nome, sigla) values ('Setor Fixo de Teste', 'SFT');

-- Administrador e integrante: leem, criam, alteram os campos editáveis e apagam; id e criado_em, ninguém.
create function pg_temp.conferir_quem_altera(id_usuario text, quem text, sigla_nova text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is((select count(*)::int from public.setores where sigla = 'SFT'), 1,
    quem || ' lê os setores');
  insert into _tap (linha) select lives_ok(
    format('insert into public.setores (nome, sigla) values (%L, %L)', 'Setor de ' || quem, sigla_nova),
    quem || ' cria setor');
  with alteradas as (
    update public.setores set nome = 'Setor alterado por ' || quem, sigla = sigla_nova || 'X',
      observacoes = 'Observação inventada', ativo = false
    where sigla = sigla_nova returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 1,
    quem || ' altera nome, sigla, observações e ativo');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores set id = gen_random_uuid() where sigla = 'SFT'$sql$, '42501', null,
    quem || ' não altera o id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores set criado_em = now() - interval '1 day' where sigla = 'SFT'$sql$, '42501', null,
    quem || ' não altera criado_em');
  with apagadas as (delete from public.setores where sigla = sigla_nova || 'X' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 1, quem || ' apaga setor');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_altera(text, text, text) to authenticated;

-- Consulta e inativo: não criam, não alteram, não apagam; o inativo também não lê.
create function pg_temp.conferir_quem_nao_altera(id_usuario text, quem text, setores_visiveis int) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is((select count(*)::int from public.setores where sigla = 'SFT'),
    setores_visiveis, quem || case when setores_visiveis = 1 then ' lê os setores' else ' não lê os setores' end);
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.setores (nome, sigla) values ('Setor Proibido', 'PROIB')$sql$, '42501', null,
    quem || ' não cria setor');
  with alteradas as (update public.setores set nome = 'Trocado' where sigla = 'SFT' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não altera setor');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores set id = gen_random_uuid() where sigla = 'SFT'$sql$, '42501', null,
    quem || ' não altera o id');
  insert into _tap (linha) select throws_ok(
    $sql$update public.setores set criado_em = now() - interval '1 day' where sigla = 'SFT'$sql$, '42501', null,
    quem || ' não altera criado_em');
  with apagadas as (delete from public.setores where sigla = 'SFT' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 0, quem || ' não apaga setor');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_nao_altera(text, text, int) to authenticated;

select pg_temp.conferir_quem_altera('00000000-0000-0000-0000-0000000000a1', 'Administrador', 'ADM');
select pg_temp.conferir_quem_altera('00000000-0000-0000-0000-0000000000a2', 'Integrante', 'INT');
select pg_temp.conferir_quem_nao_altera('00000000-0000-0000-0000-0000000000a3', 'Consulta', 1);
select pg_temp.conferir_quem_nao_altera('00000000-0000-0000-0000-0000000000a4', 'Inativo', 0);

-- Visitante: nem lê nem grava.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.setores', '42501', null, 'Visitante não lê os setores');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Proibido', 'PROIB')$sql$, '42501', null,
  'Visitante não cria setor');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores set nome = 'Trocado' where sigla = 'SFT'$sql$, '42501', null, 'Visitante não altera setor');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores set id = gen_random_uuid() where sigla = 'SFT'$sql$, '42501', null,
  'Visitante não altera o id');
insert into _tap (linha) select throws_ok(
  $sql$update public.setores set criado_em = now() where sigla = 'SFT'$sql$, '42501', null,
  'Visitante não altera criado_em');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.setores where sigla = 'SFT'$sql$, '42501', null, 'Visitante não apaga setor');
reset role;

-- Regras da sigla e do nome (valem para qualquer um, inclusive o dono do banco).
insert into public.setores (nome, sigla) values ('Coordenação Inventada', ' cee ');
insert into _tap (linha) select is((select sigla from public.setores where nome = 'Coordenação Inventada'), 'CEE',
  'sigla " cee " é guardada como "CEE"');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Um', 'C E')$sql$, '23514', null,
  'sigla com espaço é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Dois', 'CEE_PR')$sql$, '23514', null,
  'sigla com sublinhado é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Três', 'CÊE')$sql$, '23514', null,
  'sigla com acento é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Quatro', 'C')$sql$, '23514', null,
  'sigla de 1 caractere é recusada');
insert into _tap (linha) select throws_ok(
  format('insert into public.setores (nome, sigla) values (%L, %L)', 'Setor Cinco', repeat('A', 16)), '23514', null,
  'sigla de 16 caracteres é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Setor Seis', 'cee')$sql$, '23505', null,
  'sigla repetida, mesmo em minúsculas, é recusada');
insert into public.setores (nome, sigla) values ('Assessoria Jurídica', 'AJ');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('Assessoria jurídica ', 'AJ2')$sql$, '23505', null,
  'nome repetido, com outras maiúsculas e espaço na ponta, é recusado');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla) values ('   ', 'VAZ')$sql$, '23514', null, 'nome vazio é recusado');
insert into _tap (linha) select throws_ok(
  format('insert into public.setores (nome, sigla, observacoes) values (%L, %L, %L)',
    'Setor Sete', 'SETE', repeat('a', 2001)), '23514', null, 'observações acima de 2000 caracteres são recusadas');

-- Eventos: o administrador cria, edita, desativa, reativa e exclui um setor; uma gravação sem mudança não conta.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into public.setores (nome, sigla, observacoes) values ('Setor do Histórico', 'HIST', 'Nota inventada');
update public.setores set nome = 'Setor do Histórico Renomeado' where sigla = 'HIST';
update public.setores set ativo = false where sigla = 'HIST';
update public.setores set ativo = true where sigla = 'HIST';
delete from public.setores where sigla = 'HIST';
update public.setores set nome = nome where sigla = 'SFT';
reset role;

create function pg_temp.evento_do_hist(acao_procurada text) returns public.eventos
language sql as $$
  select * from public.eventos where entidade = 'setor' and acao = acao_procurada
    and coalesce(detalhes -> 'depois' ->> 'sigla', detalhes -> 'antes' ->> 'sigla') = 'HIST'
$$;

insert into _tap (linha) select is((pg_temp.evento_do_hist('criar')).detalhes,
  '{"antes": null, "depois": {"sigla": "HIST", "nome": "Setor do Histórico", "observacoes": "Nota inventada", "ativo": true}}'::jsonb,
  'criar grava o depois com os campos legíveis');
insert into _tap (linha) select is((pg_temp.evento_do_hist('criar')).autor_id,
  '00000000-0000-0000-0000-0000000000a1'::uuid, 'o evento grava quem fez');
insert into _tap (linha) select is(
  (pg_temp.evento_do_hist('editar')).detalhes -> 'antes' ->> 'nome', 'Setor do Histórico',
  'editar grava o antes');
insert into _tap (linha) select is((pg_temp.evento_do_hist('desativar')).detalhes -> 'depois' ->> 'ativo', 'false',
  'desativar vira ação própria');
insert into _tap (linha) select is((pg_temp.evento_do_hist('reativar')).detalhes -> 'depois' ->> 'ativo', 'true',
  'reativar vira ação própria');
insert into _tap (linha) select is((pg_temp.evento_do_hist('excluir')).detalhes,
  '{"antes": {"sigla": "HIST", "nome": "Setor do Histórico Renomeado", "observacoes": "Nota inventada", "ativo": true}, "depois": null}'::jsonb,
  'excluir grava no antes todos os campos');
insert into _tap (linha) select is((select count(*)::int from public.eventos e join public.setores s
    on e.entidade_ref = s.id::text where s.sigla = 'SFT' and e.acao = 'editar'), 0,
  'gravação sem mudança não gera evento');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

Conta: 6 × 2 (quem altera) + 6 × 2 (quem não altera) + 6 (visitante) + 10 (regras) + 7 (eventos) = 47.

- [x] **Passo 3: ver o teste falhar.** Comitar só o teste (`git add supabase/tests/11_setores.test.sql`; mensagem "Teste de banco de setores (vermelho)"), pedir autorização para `git push -u origin cadastros-basicos` e pedir ao usuário que rode "Testes de banco" com "Run workflow" na branch `cadastros-basicos`. Esperado: `FALHOU supabase/tests/11_setores.test.sql` com erro de SQL (`relation "public.setores" does not exist`) e os outros arquivos passando.
- [x] **Passo 4: criar a migração** com `npx supabase migration new setores` e preencher:

```sql
-- Cadastros básicos, ticket 01: setores, com sigla conferida, RLS por perfil e eventos no histórico.
-- Recusas chegam à interface pelo código do Postgres e pelo nome da restrição (src/cadastros/cadastrosSupabase.ts).

create table public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null constraint setores_nome_tamanho check (char_length(nome) between 1 and 200),
  sigla text not null constraint setores_sigla_formato check (sigla ~ '^[A-Z0-9-]{2,15}$'),
  observacoes text constraint setores_observacoes_tamanho check (char_length(observacoes) <= 2000),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint setores_sigla_key unique (sigla)
);

-- O nome chega aqui já sem espaços nas pontas (gatilho abaixo); lower() torna a unicidade indiferente a maiúsculas.
create unique index setores_nome_unico on public.setores (lower(nome));

alter table public.setores enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui e altera só os campos editáveis (id e criado_em ficam).
revoke all on public.setores from anon, authenticated;
grant select, delete on public.setores to authenticated;
grant insert (nome, sigla, observacoes) on public.setores to authenticated;
grant update (nome, sigla, observacoes, ativo) on public.setores to authenticated;

-- Quem mantém os cadastros: administrador e integrante ativos (reaproveitada por macroprocessos e setores envolvidos).
create function private.pode_alterar_cadastros() returns boolean
language sql stable set search_path = ''
as $$ select private.usuario_ativo() and coalesce(private.perfil_atual() in ('administrador', 'integrante_ep'), false) $$;

revoke execute on function private.pode_alterar_cadastros() from public, anon;
grant execute on function private.pode_alterar_cadastros() to authenticated;

create policy "setores: ativo lê" on public.setores
  for select to authenticated using ((select private.usuario_ativo()));

create policy "setores: administrador e integrante ativos criam" on public.setores
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "setores: administrador e integrante ativos alteram" on public.setores
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create policy "setores: administrador e integrante ativos apagam" on public.setores
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de gravar: nome sem espaços nas pontas e sigla em maiúsculas; o formato é conferido pela restrição.
create function private.preparar_setor() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.nome := btrim(new.nome);
  new.sigla := upper(btrim(new.sigla));
  return new;
end $$;

-- Ação do evento de um cadastro: mudança só em "ativo" é desativar ou reativar; o resto é editar.
create function private.acao_do_cadastro(operacao text, antes jsonb, depois jsonb) returns text
language sql immutable set search_path = ''
as $$ select case
  when operacao = 'INSERT' then 'criar'
  when operacao = 'DELETE' then 'excluir'
  when antes - 'ativo' = depois - 'ativo' then case when (depois ->> 'ativo')::boolean then 'reativar' else 'desativar' end
  else 'editar' end $$;

-- Antes e depois com os campos legíveis, para o histórico continuar legível depois de uma exclusão.
create function private.registrar_evento_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op <> 'INSERT' then jsonb_build_object(
    'sigla', old.sigla, 'nome', old.nome, 'observacoes', old.observacoes, 'ativo', old.ativo) end;
  depois jsonb := case when tg_op <> 'DELETE' then jsonb_build_object(
    'sigla', new.sigla, 'nome', new.nome, 'observacoes', new.observacoes, 'ativo', new.ativo) end;
begin
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_cadastro(tg_op, antes, depois), 'setor',
    coalesce(new.id, old.id)::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.preparar_setor(), private.acao_do_cadastro(text, jsonb, jsonb),
  private.registrar_evento_do_setor() from public, anon, authenticated;

create trigger preparar_setor before insert or update on public.setores
  for each row execute function private.preparar_setor();

create trigger registrar_evento_do_setor after insert or update or delete on public.setores
  for each row execute function private.registrar_evento_do_setor();
```

- [x] **Passo 5: aplicar no desenvolvimento.** Conferir o vínculo (`supabase/AMBIENTES.md`: `yclkzyoebpsxmgpbcbus`; `supabase/.temp/project-ref`, se existir, com o mesmo ref). Pedir ao usuário que cole a migração no SQL Editor do projeto **plataforma-ep-dev** e a rode. Registrar em `supabase/AMBIENTES.md`, na lista de migrações aplicadas à mão, a linha `- <versão>_setores (<data>; testes 11, 00 e 10 passaram pelo GitHub Actions)`.
- [x] **Passo 6: ver o teste passar.** Comitar a migração, o `AMBIENTES.md` e, depois do passo 7, os tipos (um commit só: "Migração de setores: tabela, RLS, regras e eventos"), enviar a branch e pedir ao usuário que rode "Testes de banco" na branch. Esperado: todos os arquivos passando, inclusive `00_rls_ligada`, `10_privilegios_padrao` e `11_setores` (47 ok).
- [x] **Passo 7: gerar os tipos.** `npm run db:types` (vínculo conferido no passo 5). Esperado: `src/types/database.ts` com `setores` em `Tables`. `npm run typecheck` passando.

---

### Tarefa 2: Módulo de cadastros: tipos, real e falso (critérios 4 e 5)

**Files:**
- Create: `src/testes/ClienteSupabaseFalso.ts` (extraído de `src/acesso/administracaoSupabase.test.ts`)
- Modify: `src/acesso/administracaoSupabase.test.ts` (importa a classe extraída)
- Create: `src/cadastros/tipos.ts`, `src/cadastros/cadastrosSupabase.ts`, `src/cadastros/cadastrosSupabase.test.ts`, `src/cadastros/CadastrosFalso.ts`

**Interfaces:**
- Consome: `TravaDoBanco` de `src/acesso/falhasDeGravacao.ts`; tipos de `setores` de `src/types/database.ts`.
- Produz:
  - `type Setor = { id: string; sigla: string; nome: string; observacoes: string | null; ativo: boolean }`
  - `type DadosDoSetor = { nome: string; sigla: string; observacoes: string | null }`
  - `type ModuloDeCadastros = { listarSetores(): Promise<Setor[]>; criarSetor(dados: DadosDoSetor): Promise<void> }`
  - `criarCadastrosSupabase(cliente: SupabaseClient<Database>): ModuloDeCadastros`
  - `class CadastrosFalso implements ModuloDeCadastros` com `setores: Setor[]`, `falharLista`, `segurarLista`, `falhaDeGravacao: string | Error | null`
  - `class ClienteSupabaseFalso` com `respostas: Record<string, RespostaDoBanco>`, `pedidos: Pedido[]` (agora com `colunas?: string`)

- [x] **Passo 1: extrair o cliente falso.** Mover a classe `ClienteDeAdministracaoFalso` e os tipos `RespostaDoBanco` e `Pedido` de `src/acesso/administracaoSupabase.test.ts` para `src/testes/ClienteSupabaseFalso.ts`, exportada como `ClienteSupabaseFalso`, com o `select` passando a guardar as colunas do primeiro `select`:

```ts
export type RespostaDoBanco = { data: unknown; error: { message: string; code?: string } | null }
export type Pedido = {
  tabela: string; operacao: string; colunas?: string; valores?: unknown; filtro?: [string, string]
  ordem?: [string, boolean][]
}

/** Cliente Supabase falso para os testes de módulo: guarda cada pedido e responde por "tabela.operação". */
export class ClienteSupabaseFalso {
  respostas: Record<string, RespostaDoBanco> = {}
  pedidos: Pedido[] = []

  from(tabela: string) {
    const pedido: Pedido = { tabela, operacao: 'select' }
    this.pedidos.push(pedido)
    const resposta = () => this.respostas[`${tabela}.${pedido.operacao}`] ?? { data: [], error: null }
    const consulta = {
      select: (colunas?: string) => {
        pedido.colunas ??= colunas
        return consulta
      },
      order: (coluna: string, opcoes?: { ascending?: boolean }) =>
        (pedido.ordem ??= []).push([coluna, opcoes?.ascending ?? true]) && consulta,
      insert: (valores: unknown) => Object.assign(pedido, { operacao: 'insert', valores }) && consulta,
      update: (valores: unknown) => Object.assign(pedido, { operacao: 'update', valores }) && consulta,
      delete: () => Object.assign(pedido, { operacao: 'delete' }) && consulta,
      eq: (coluna: string, valor: string) => Object.assign(pedido, { filtro: [coluna, valor] }) && consulta,
      then: (seCumprir: (r: RespostaDoBanco) => unknown, seFalhar?: (e: unknown) => unknown) =>
        Promise.resolve(resposta()).then(seCumprir, seFalhar),
    }
    return consulta
  }
}
```

No teste da administração, trocar `ClienteDeAdministracaoFalso` por `ClienteSupabaseFalso` (import de `../testes/ClienteSupabaseFalso`). Rodar `npx vitest run src/acesso/administracaoSupabase.test.ts`: tudo passa sem mudar asserções.

- [x] **Passo 2: escrever o teste do módulo real** em `src/cadastros/cadastrosSupabase.test.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarCadastrosSupabase } from './cadastrosSupabase'

const NOVO = { nome: 'Núcleo Fictício de Teste', sigla: 'NFT', observacoes: null }

function criar(cliente: ClienteSupabaseFalso) {
  return criarCadastrosSupabase(cliente as unknown as SupabaseClient<Database>)
}

describe('criarCadastrosSupabase', () => {
  test('lista os setores pedindo ao banco a ordem pela sigla', async () => {
    const cliente = new ClienteSupabaseFalso()
    const linha = { id: 's1', sigla: 'NFT', nome: NOVO.nome, observacoes: null, ativo: true }
    cliente.respostas['setores.select'] = { data: [linha], error: null }
    expect(await criar(cliente).listarSetores()).toEqual([linha])
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', colunas: 'id, sigla, nome, observacoes, ativo',
      ordem: [['sigla', true]] })
  })

  test('falha ao listar vira erro com o motivo do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.select'] = { data: null, error: { message: 'sem conexão' } }
    await expect(criar(cliente).listarSetores()).rejects.toThrow('Falha ao listar os setores: sem conexão')
  })

  test('criar envia nome, sigla e observações à tabela setores', async () => {
    const cliente = new ClienteSupabaseFalso()
    await criar(cliente).criarSetor(NOVO)
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'setores', operacao: 'insert', valores: NOVO })
  })

  test.each([
    ['23505', 'duplicate key value violates unique constraint "setores_sigla_key"', 'Já existe um setor com a sigla NFT.'],
    ['23505', 'duplicate key value violates unique constraint "setores_nome_unico"',
      'Já existe um setor com o nome Núcleo Fictício de Teste.'],
    ['42501', 'new row violates row-level security policy for table "setores"', 'Seu perfil não permite alterar os cadastros.'],
  ])('a recusa %s (%s) vira a frase pronta da tela', async (code, message, frase) => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.insert'] = { data: null, error: { code, message } }
    const falha = await criar(cliente).criarSetor(NOVO).catch((erro: unknown) => erro)
    expect(falha).toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe(frase)
  })

  test('outra falha de gravação vira motivo genérico com a mensagem do banco', async () => {
    const cliente = new ClienteSupabaseFalso()
    cliente.respostas['setores.insert'] = { data: null, error: { code: '08006', message: 'conexão perdida' } }
    const falha = await criar(cliente).criarSetor(NOVO).catch((erro: unknown) => erro)
    expect(falha).not.toBeInstanceOf(TravaDoBanco)
    expect((falha as Error).message).toBe('erro inesperado do banco (conexão perdida)')
  })
})
```

- [x] **Passo 3: ver falhar.** `npx vitest run src/cadastros/cadastrosSupabase.test.ts`. Esperado: FAIL, módulo `./cadastrosSupabase` inexistente.
- [x] **Passo 4: implementar** `src/cadastros/tipos.ts`:

```ts
export type Setor = { id: string; sigla: string; nome: string; observacoes: string | null; ativo: boolean }
export type DadosDoSetor = { nome: string; sigla: string; observacoes: string | null }

/**
 * Único ponto por onde a interface fala com o banco nos cadastros (setores; macroprocessos, setores envolvidos e
 * histórico chegam nos tickets seguintes). Recusa do banco chega como TravaDoBanco, com a frase pronta;
 * outra falha de gravação, como Error cuja mensagem é o motivo em português.
 */
export type ModuloDeCadastros = {
  listarSetores(): Promise<Setor[]>
  criarSetor(dados: DadosDoSetor): Promise<void>
}
```

e `src/cadastros/cadastrosSupabase.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import type { Database } from '../types/database'
import type { DadosDoSetor, ModuloDeCadastros, Setor } from './tipos'

type ClienteSupabase = SupabaseClient<Database>
type ErroDoBanco = { message: string; code?: string }

export function criarCadastrosSupabase(cliente: ClienteSupabase): ModuloDeCadastros {
  return {
    listarSetores: () => listarSetores(cliente),
    criarSetor: (dados) => criarSetor(cliente, dados),
  }
}

async function listarSetores(cliente: ClienteSupabase): Promise<Setor[]> {
  const { data, error } = await cliente.from('setores').select('id, sigla, nome, observacoes, ativo').order('sigla')
  if (error) throw new Error(`Falha ao listar os setores: ${error.message}`)
  return data
}

async function criarSetor(cliente: ClienteSupabase, dados: DadosDoSetor): Promise<void> {
  const { error } = await cliente.from('setores').insert(dados)
  if (error) throw falhaDoSetor(error, dados)
}

// O banco recusa pelo código do Postgres e pelo nome da restrição (migração de setores); a frase usa o que foi enviado.
function falhaDoSetor(erro: ErroDoBanco, dados: DadosDoSetor): Error {
  const repetido = erro.code === '23505'
  if (repetido && erro.message.includes('setores_sigla_key')) {
    return new TravaDoBanco(`Já existe um setor com a sigla ${dados.sigla}.`)
  }
  if (repetido && erro.message.includes('setores_nome_unico')) {
    return new TravaDoBanco(`Já existe um setor com o nome ${dados.nome}.`)
  }
  if (erro.code === '42501') return new TravaDoBanco('Seu perfil não permite alterar os cadastros.')
  return new Error(`erro inesperado do banco (${erro.message})`)
}
```

- [x] **Passo 5: ver passar.** `npx vitest run src/cadastros/cadastrosSupabase.test.ts src/acesso/administracaoSupabase.test.ts`: PASS.
- [x] **Passo 6: implementar o falso** `src/cadastros/CadastrosFalso.ts` (sem teste próprio: é exercitado pelos testes de tela):

```ts
import type { DadosDoSetor, ModuloDeCadastros, Setor } from './tipos'

/** Implementação falsa dos cadastros para os testes de tela: sem rede, com falhas e esperas simuladas. */
export class CadastrosFalso implements ModuloDeCadastros {
  setores: Setor[] = []
  falharLista = false
  segurarLista = false
  /** Texto: motivo em português (falha genérica). Error: a recusa pronta (TravaDoBanco), como o módulo real. */
  falhaDeGravacao: string | Error | null = null

  async listarSetores(): Promise<Setor[]> {
    if (this.segurarLista) return new Promise<never>(() => {})
    if (this.falharLista) throw new Error('falha de conexão simulada')
    return [...this.setores]
  }

  async criarSetor(dados: DadosDoSetor): Promise<void> {
    if (this.falhaDeGravacao !== null) {
      throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
    }
    this.setores = [...this.setores, { id: `setor-${this.setores.length + 1}`, ativo: true, ...dados }]
  }
}
```

- [ ] **Passo 7: comitar.** `npm run typecheck && npm test`, depois commit "Módulo de cadastros: listar e criar setor, real e falso".

---

### Tarefa 3: Validação da sigla e do nome na tela (critério 6)

**Files:**
- Create: `src/cadastros/validacaoDoSetor.ts`, `src/cadastros/validacaoDoSetor.test.ts`

**Interfaces:**
- Produz: `normalizarSigla(valor: string): string`; `problemaNoSetor(nome: string, sigla: string): string | null`.

- [x] **Passo 1: escrever o teste:**

```ts
import { describe, expect, test } from 'vitest'
import { normalizarSigla, problemaNoSetor } from './validacaoDoSetor'

describe('validação do setor na tela', () => {
  test('a sigla perde os espaços das pontas e vai para maiúsculas', () => {
    expect(normalizarSigla(' cee ')).toBe('CEE')
  })

  test.each(['CEE', ' cee ', 'C-1', 'AB', 'A'.repeat(15)])('aceita a sigla "%s"', (sigla) => {
    expect(problemaNoSetor('Setor Fictício', sigla)).toBeNull()
  })

  test.each(['C E', 'CEE_PR', 'CÊE', 'C', 'A'.repeat(16), ''])('recusa a sigla "%s" mostrando o valor recebido', (sigla) => {
    expect(problemaNoSetor('Setor Fictício', sigla)).toBe(
      `A sigla deve ter de 2 a 15 caracteres, só letras sem acento, números ou hífen. Recebido: "${sigla}".`)
  })

  test('recusa o nome vazio ou só com espaços', () => {
    expect(problemaNoSetor('   ', 'CEE')).toBe('O nome do setor é obrigatório.')
  })
})
```

- [x] **Passo 2: ver falhar.** `npx vitest run src/cadastros/validacaoDoSetor.test.ts`: FAIL (módulo inexistente).
- [x] **Passo 3: implementar:**

```ts
// O banco confere de novo (restrição setores_sigla_formato); aqui a pessoa vê o problema antes de enviar.
const FORMATO_DA_SIGLA = /^[A-Z0-9-]{2,15}$/

export function normalizarSigla(valor: string): string {
  return valor.trim().toUpperCase()
}

export function problemaNoSetor(nome: string, sigla: string): string | null {
  if (nome.trim() === '') return 'O nome do setor é obrigatório.'
  if (FORMATO_DA_SIGLA.test(normalizarSigla(sigla))) return null
  return `A sigla deve ter de 2 a 15 caracteres, só letras sem acento, números ou hífen. Recebido: "${sigla}".`
}
```

- [x] **Passo 4: ver passar** e comitar: "Validação da sigla e do nome do setor na tela".

---

### Tarefa 4: Área Setores no endereço, com as três abas (critério 7)

**Files:**
- Create: `src/hooks/useEndereco.ts`, `src/components/cadastros/AreaDeCadastros.tsx`, `src/components/cadastros/Cadastros.css`, `src/App.setores.test.tsx`
- Modify: `src/hooks/useAreaAtual.ts`, `src/components/moldura/areas.ts`, `src/App.tsx`, `src/main.tsx`, todos os `src/App*.test.tsx` existentes

**Interfaces:**
- Consome: `ModuloDeCadastros`, `CadastrosFalso` (tarefa 2).
- Produz: `useEndereco(): [string, (novo: string) => void]`; `App` com props `{ acesso: ModuloDeAcesso; cadastros: ModuloDeCadastros }`; `AreaDeCadastros({ usuario, cadastros })`; `AreaComTela` inclui `'setores'`.

- [x] **Passo 1: injetar o módulo nos testes existentes.** Em cada `src/App*.test.tsx`, trocar `<App acesso={X} />` por `<App acesso={X} cadastros={new CadastrosFalso()} />` e acrescentar `import { CadastrosFalso } from './cadastros/CadastrosFalso'` logo depois de `import App from './App'`. Comando: `perl -0pi -e "s/<App acesso=\{(.*?)\} \/>/<App acesso={\$1} cadastros={new CadastrosFalso()} \/>/g; s/(import App from '.\/App'\n)/\$1import { CadastrosFalso } from '.\/cadastros\/CadastrosFalso'\n/" src/App*.test.tsx`. Conferir com `git diff --stat` (11 arquivos) e `grep -c "cadastros={" src/App*.test.tsx`.
- [x] **Passo 2: escrever o teste de navegação** em `src/App.setores.test.tsx` (as listas entram na tarefa 5):

```tsx
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { Setor } from './cadastros/tipos'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const SETORES: Setor[] = [
  { id: 's1', sigla: 'AFT', nome: 'Assessoria Fictícia de Teste', observacoes: null, ativo: true },
  { id: 's2', sigla: 'CIT', nome: 'Coordenação Inventada de Teste', observacoes: 'Nota inventada', ativo: true },
  { id: 's3', sigla: 'EXT', nome: 'Setor Extinto de Teste', observacoes: null, ativo: false },
]

function cadastrosComSetores() {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [...SETORES]
  return cadastros
}

function montar(perfil: Perfil = 'integrante_ep', cadastros = cadastrosComSetores()) {
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} />)
  return cadastros
}

function abas() {
  return within(screen.getByRole('navigation', { name: 'Seções de Setores' }))
}

test.each<Perfil>(['administrador', 'integrante_ep', 'consulta'])('o item Setores da faixa abre a área para %s', async (perfil) => {
  window.location.hash = ''
  montar(perfil)
  fireEvent.click(await screen.findByRole('button', { name: 'Setores' }))
  expect(await screen.findByRole('navigation', { name: 'Seções de Setores' })).toBeTruthy()
  expect(window.location.hash).toBe('#/setores')
})

test('o endereço #/setores abre a área direto, com a aba Setores destacada', async () => {
  montar()
  await screen.findByRole('navigation', { name: 'Seções de Setores' })
  expect(abas().getAllByRole('link').map((aba) => aba.textContent)).toEqual(['Setores', 'Macroprocessos', 'Histórico'])
  expect(abas().getByRole('link', { name: 'Setores' }).getAttribute('aria-current')).toBe('page')
})

test('trocar de aba põe a aba no endereço e a destaca', async () => {
  montar()
  fireEvent.click(await screen.findByRole('link', { name: 'Macroprocessos' }))
  await waitFor(() => expect(abas().getByRole('link', { name: 'Macroprocessos' }).getAttribute('aria-current')).toBe('page'))
  expect(window.location.hash).toBe('#/setores/macroprocessos')
  expect(screen.getByText('Esta seção chega numa próxima entrega.')).toBeTruthy()
})

test('o endereço da aba Histórico sobrevive ao recarregar', async () => {
  window.location.hash = '#/setores/historico'
  montar()
  await screen.findByRole('navigation', { name: 'Seções de Setores' })
  expect(abas().getByRole('link', { name: 'Histórico' }).getAttribute('aria-current')).toBe('page')
})
```

- [x] **Passo 3: ver falhar.** `npx vitest run src/App.setores.test.tsx`: FAIL (prop `cadastros` e área inexistentes).
- [x] **Passo 4: implementar.** `src/hooks/useEndereco.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'

// O endereço (#/area/aba) guarda onde a pessoa está, para sobreviver ao recarregar a página.
export function useEndereco(): [string, (novo: string) => void] {
  const [endereco, setEndereco] = useState(() => window.location.hash)

  useEffect(() => {
    const aoMudarEndereco = () => setEndereco(window.location.hash)
    window.addEventListener('hashchange', aoMudarEndereco)
    return () => window.removeEventListener('hashchange', aoMudarEndereco)
  }, [])

  const irPara = useCallback((novo: string) => {
    setEndereco(novo)
    window.location.hash = novo
  }, [])

  return [endereco, irPara]
}
```

`src/hooks/useAreaAtual.ts`:

```ts
import { useCallback } from 'react'
import type { AreaComTela } from '../components/moldura/areas'
import { useEndereco } from './useEndereco'

// A área é o primeiro trecho do endereço (#/setores/macroprocessos → setores).
function areaDoEndereco(endereco: string): AreaComTela {
  const area = endereco.split('/')[1]
  return area === 'administracao' || area === 'setores' ? area : 'quadro'
}

export function useAreaAtual(): [AreaComTela, (area: AreaComTela) => void] {
  const [endereco, irParaEndereco] = useEndereco()
  const irPara = useCallback((nova: AreaComTela) => irParaEndereco(`#/${nova}`), [irParaEndereco])
  return [areaDoEndereco(endereco), irPara]
}
```

`src/components/moldura/areas.ts`: `AreaComTela = Extract<AreaDoSistema, 'quadro' | 'setores' | 'administracao'>` e `temTela` devolvendo verdadeiro também para `'setores'` (atualizar o comentário: "Quadro, Setores e Administração têm tela"; o mesmo em `FaixaLateral.tsx`).

`src/components/cadastros/AreaDeCadastros.tsx`:

```tsx
import type { UsuarioAtual } from '../../acesso/tipos'
import type { ModuloDeCadastros } from '../../cadastros/tipos'
import { useEndereco } from '../../hooks/useEndereco'
import { AreaDeSetores } from './AreaDeSetores'
import './Cadastros.css'

type AbaDosCadastros = 'setores' | 'macroprocessos' | 'historico'
type AreaDeCadastrosProps = { usuario: UsuarioAtual; cadastros: ModuloDeCadastros }

const ABAS: { aba: AbaDosCadastros; rotulo: string; endereco: string }[] = [
  { aba: 'setores', rotulo: 'Setores', endereco: '#/setores' },
  { aba: 'macroprocessos', rotulo: 'Macroprocessos', endereco: '#/setores/macroprocessos' },
  { aba: 'historico', rotulo: 'Histórico', endereco: '#/setores/historico' },
]

// A aba é o segundo trecho do endereço; sem ele, Setores.
function abaDoEndereco(endereco: string): AbaDosCadastros {
  const aba = endereco.split('/')[2]
  return aba === 'macroprocessos' || aba === 'historico' ? aba : 'setores'
}

// Esconder botões da Consulta é conveniência; quem protege os dados é a RLS de setores.
export function AreaDeCadastros({ usuario, cadastros }: AreaDeCadastrosProps) {
  const [endereco] = useEndereco()
  const abaAtual = abaDoEndereco(endereco)
  return (
    <section className="cadastros" aria-label="Setores">
      <nav className="cadastros-abas" aria-label="Seções de Setores">
        {ABAS.map(({ aba, rotulo, endereco: destino }) => (
          <a key={aba} href={destino} className="cadastros-aba" aria-current={aba === abaAtual ? 'page' : undefined}>
            {rotulo}
          </a>
        ))}
      </nav>
      {abaAtual === 'setores'
        ? <AreaDeSetores cadastros={cadastros} podeAlterar={usuario.perfil !== 'consulta'} />
        : <p className="cadastros-em-breve">Esta seção chega numa próxima entrega.</p>}
    </section>
  )
}
```

`AreaDeSetores` provisório, só para esta tarefa compilar (substituído na tarefa 5): `export function AreaDeSetores(props: { cadastros: ModuloDeCadastros; podeAlterar: boolean }) { void props; return null }`.

`src/App.tsx`: prop `cadastros: ModuloDeCadastros`; `TITULO_DA_AREA` com `setores: 'Setores'`; conteúdo por função:

```tsx
type AppProps = { acesso: ModuloDeAcesso; cadastros: ModuloDeCadastros }

const TITULO_DA_AREA: Record<AreaComTela, string> = {
  quadro: 'Processos', setores: 'Setores', administracao: 'Administração',
}

function App({ acesso, cadastros }: AppProps) {
  const { estado, entrar, sair, tentarDeNovo } = useEntrada(acesso)
  const [area, irPara] = useAreaAtual()
  if (estado.tipo !== 'dentro') {
    return <TelaDeEntrada estado={estado} aoEntrar={entrar} aoTentarDeNovo={tentarDeNovo} />
  }
  return (
    <Moldura areaAtual={area} aoIrPara={irPara} titulo={TITULO_DA_AREA[area]} usuario={estado.usuario} aoSair={sair}>
      {area === 'quadro' && <QuadroVazio />}
      {area === 'setores' && <AreaDeCadastros usuario={estado.usuario} cadastros={cadastros} />}
      {area === 'administracao' && <AreaDeAdministracao usuario={estado.usuario} acesso={acesso} />}
    </Moldura>
  )
}
```

`src/main.tsx`: `const cadastros = criarCadastrosSupabase(supabase)` e `<App acesso={acesso} cadastros={cadastros} />`.

`src/components/cadastros/Cadastros.css` (abas; o resto entra na tarefa 5):

```css
.cadastros {
  display: grid;
  gap: var(--esp-4);
  padding: var(--esp-5);
  max-width: 1100px;
}

.cadastros-abas {
  display: flex;
  gap: var(--esp-2);
  border-bottom: 1px solid var(--borda);
}

.cadastros-aba {
  padding: var(--esp-2) var(--esp-3);
  color: var(--texto-secundario);
  text-decoration: none;
  border-bottom: 2px solid transparent;
}

.cadastros-aba[aria-current='page'] {
  color: var(--texto);
  font-weight: 600;
  border-bottom-color: var(--acento);
}
```

Antes de gravar o CSS, conferir os nomes dos tokens em `src/styles/tokens.css` (`--borda`, `--texto-secundario`, `--acento`, `--esp-*`) e trocar por equivalentes existentes, se algum não existir.

- [x] **Passo 5: ver passar.** `npx vitest run src/App.setores.test.tsx`; depois `npm run typecheck && npm test` (os testes antigos seguem passando). Se o jsdom não navegar pelo link de âncora no teste "trocar de aba", trocar os links por botões que chamam `irPara(destino)` de `useEndereco` (mesmo texto e `aria-current`), e o teste passa a buscar `button` em vez de `link`.
- [x] **Passo 6: comitar.** "Área Setores no endereço, com as três abas".

---

### Tarefa 5: Lista de setores e [Novo setor] (critérios 8, 9 e 10)

**Files:**
- Create: `src/components/cadastros/AreaDeSetores.tsx` (substitui o provisório), `src/components/cadastros/ListaDeSetores.tsx`, `src/components/cadastros/FormularioDeSetor.tsx`, `src/App.novoSetor.test.tsx`
- Modify: `src/App.setores.test.tsx`, `src/components/cadastros/Cadastros.css`

**Interfaces:**
- Consome: `useCarregamento` e `EstadoDoCarregamento<T>` de `src/hooks/useCarregamento.ts`; `textoDaFalhaNoFormulario` de `src/acesso/falhasDeGravacao.ts`; `normalizarSigla`, `problemaNoSetor` (tarefa 3).
- Produz: `AreaDeSetores({ cadastros, podeAlterar })`; `ListaDeSetores({ estado, aoTentarDeNovo })`; `FormularioDeSetor({ aoSalvar, aoCancelar })`.

- [x] **Passo 1: testes da lista e dos estados**, acrescentados a `src/App.setores.test.tsx`:

```tsx
function linhasDaTabela() {
  return screen.getAllByRole('row').slice(1).map((linha) => linha.textContent)
}

test('a lista mostra sigla e nome dos setores ativos, na ordem recebida', async () => {
  montar()
  await screen.findByText('AFT')
  expect(linhasDaTabela()).toEqual(['AFTAssessoria Fictícia de Teste', 'CITCoordenação Inventada de Teste'])
})

test('enquanto carrega, mostra "Carregando setores…"', async () => {
  const cadastros = cadastrosComSetores()
  cadastros.segurarLista = true
  montar('integrante_ep', cadastros)
  expect(await screen.findByText('Carregando setores…')).toBeTruthy()
})

test('sem setores, mostra "Nenhum setor cadastrado ainda."', async () => {
  montar('integrante_ep', new CadastrosFalso())
  expect(await screen.findByText('Nenhum setor cadastrado ainda.')).toBeTruthy()
})

test('se a lista falha, mostra o erro em vermelho e recupera com Tentar de novo', async () => {
  const cadastros = cadastrosComSetores()
  cadastros.falharLista = true
  montar('integrante_ep', cadastros)
  const erro = await screen.findByText('Não foi possível carregar os setores. Verifique a conexão e tente de novo.')
  expect(erro.closest('.cadastros-erro')).not.toBeNull()
  cadastros.falharLista = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('AFT')).toBeTruthy()
})

test('a Consulta vê a lista sem [Novo setor]', async () => {
  montar('consulta')
  await screen.findByText('AFT')
  expect(screen.queryByRole('button', { name: 'Novo setor' })).toBeNull()
})

test.each<Perfil>(['administrador', 'integrante_ep'])('%s vê [Novo setor]', async (perfil) => {
  montar(perfil)
  expect(await screen.findByRole('button', { name: 'Novo setor' })).toBeTruthy()
})
```

- [x] **Passo 2: testes do cadastro** em `src/App.novoSetor.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import css from './components/cadastros/Cadastros.css?raw'
import { regrasDaClasse } from './testes/regrasDaClasse'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function abrirFormulario(cadastros = new CadastrosFalso()) {
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Novo setor' }))
  return cadastros
}

function preencher(nome: string, sigla: string, observacoes = '') {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: nome } })
  fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: sigla } })
  fireEvent.change(screen.getByLabelText('Observações'), { target: { value: observacoes } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

test('cadastra o setor com nome sem espaços nas pontas e sigla em maiúsculas, e ele entra na lista', async () => {
  const cadastros = await abrirFormulario()
  preencher(' Núcleo Fictício de Teste ', ' nft ', 'Nota inventada')
  expect(await screen.findByRole('cell', { name: 'NFT' })).toBeTruthy()
  expect(cadastros.setores).toMatchObject([{ nome: 'Núcleo Fictício de Teste', sigla: 'NFT', observacoes: 'Nota inventada' }])
  expect(screen.queryByRole('form', { name: 'Novo setor' })).toBeNull()
})

test('observações em branco são gravadas como vazias', async () => {
  const cadastros = await abrirFormulario()
  preencher('Núcleo Fictício de Teste', 'NFT')
  await screen.findByRole('cell', { name: 'NFT' })
  expect(cadastros.setores[0].observacoes).toBeNull()
})

test('sigla fora do formato não é enviada e a mensagem mostra o valor recebido', async () => {
  const cadastros = await abrirFormulario()
  preencher('Núcleo Fictício de Teste', 'C E')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A sigla deve ter de 2 a 15 caracteres, só letras sem acento, números ou hífen. Recebido: "C E".')
  expect(cadastros.setores).toEqual([])
})

test('nome vazio não é enviado', async () => {
  const cadastros = await abrirFormulario()
  preencher('  ', 'NFT')
  expect((await screen.findByRole('alert')).textContent).toBe('O nome do setor é obrigatório.')
  expect(cadastros.setores).toEqual([])
})

test('falha de gravação mostra o motivo em vermelho e mantém os dados no formulário', async () => {
  const cadastros = new CadastrosFalso()
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  await abrirFormulario(cadastros)
  preencher('Núcleo Fictício de Teste', 'NFT', 'Nota inventada')
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe(
    'A alteração não foi salva: erro inesperado do banco (falha simulada). Seus dados continuam no formulário.')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Núcleo Fictício de Teste')
  expect((screen.getByLabelText('Sigla') as HTMLInputElement).value).toBe('NFT')
  expect((screen.getByLabelText('Observações') as HTMLTextAreaElement).value).toBe('Nota inventada')
})

test.each([
  'Já existe um setor com a sigla NFT.',
  'Já existe um setor com o nome Núcleo Fictício de Teste.',
  'Seu perfil não permite alterar os cadastros.',
])('a recusa do banco "%s" aparece como veio, com o formulário mantido', async (frase) => {
  const cadastros = new CadastrosFalso()
  cadastros.falhaDeGravacao = new TravaDoBanco(frase)
  await abrirFormulario(cadastros)
  preencher('Núcleo Fictício de Teste', 'NFT')
  expect((await screen.findByRole('alert')).textContent).toBe(frase)
  expect((screen.getByLabelText('Sigla') as HTMLInputElement).value).toBe('NFT')
})

test('Cancelar fecha o formulário sem gravar', async () => {
  const cadastros = await abrirFormulario()
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Núcleo Fictício de Teste' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('form', { name: 'Novo setor' })).toBeNull()
  expect(cadastros.setores).toEqual([])
})

test('as mensagens de falha e de erro de carregamento são vermelhas no CSS', () => {
  expect(regrasDaClasse(css, '.cadastros-falha')).toContain('var(--atraso-fundo)')
  expect(regrasDaClasse(css, '.cadastros-erro')).toContain('var(--atraso-fundo)')
})
```

- [x] **Passo 3: ver falhar.** `npx vitest run src/App.setores.test.tsx src/App.novoSetor.test.tsx`: FAIL (lista e formulário inexistentes).
- [x] **Passo 4: implementar.** `src/components/cadastros/AreaDeSetores.tsx`:

```tsx
import { useCallback, useState } from 'react'
import type { DadosDoSetor, ModuloDeCadastros } from '../../cadastros/tipos'
import { useCarregamento } from '../../hooks/useCarregamento'
import { FormularioDeSetor } from './FormularioDeSetor'
import { ListaDeSetores } from './ListaDeSetores'

type AreaDeSetoresProps = { cadastros: ModuloDeCadastros; podeAlterar: boolean }

export function AreaDeSetores({ cadastros, podeAlterar }: AreaDeSetoresProps) {
  const listar = useCallback(() => cadastros.listarSetores(), [cadastros])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(listar)
  const [criando, setCriando] = useState(false)

  // A falha segue para o formulário, que a mostra e mantém os dados.
  async function criar(dados: DadosDoSetor) {
    await cadastros.criarSetor(dados)
    setCriando(false)
    recarregar()
  }

  return (
    <div className="cadastros-secao">
      {podeAlterar && !criando && (
        <button type="button" className="botao botao-principal cadastros-novo" onClick={() => setCriando(true)}>
          Novo setor
        </button>
      )}
      {criando && <FormularioDeSetor aoSalvar={criar} aoCancelar={() => setCriando(false)} />}
      <ListaDeSetores estado={estado} aoTentarDeNovo={tentarDeNovo} />
    </div>
  )
}
```

`src/components/cadastros/ListaDeSetores.tsx`:

```tsx
import type { Setor } from '../../cadastros/tipos'
import type { EstadoDoCarregamento } from '../../hooks/useCarregamento'

const LINHAS_FANTASMA = 3

type ListaDeSetoresProps = { estado: EstadoDoCarregamento<Setor[]>; aoTentarDeNovo: () => void }

// Neste ticket a lista mostra só os ativos; "Mostrar inativos" chega no ticket 02.
export function ListaDeSetores({ estado, aoTentarDeNovo }: ListaDeSetoresProps) {
  if (estado.tipo === 'erro') {
    return (
      <div className="cadastros-erro" role="alert">
        <p>Não foi possível carregar os setores. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    )
  }
  const ativos = estado.tipo === 'pronto' ? estado.valor.filter((setor) => setor.ativo) : []
  if (estado.tipo === 'pronto' && ativos.length === 0) {
    return <p className="cadastros-vazio">Nenhum setor cadastrado ainda.</p>
  }
  return (
    <table className="tabela-cadastros" aria-busy={estado.tipo === 'carregando'}>
      {estado.tipo === 'carregando' && <caption>Carregando setores…</caption>}
      <thead>
        <tr><th scope="col">Sigla</th><th scope="col">Nome</th></tr>
      </thead>
      <tbody>
        {estado.tipo === 'carregando'
          ? Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} />)
          : ativos.map((setor) => <tr key={setor.id}><td>{setor.sigla}</td><td>{setor.nome}</td></tr>)}
      </tbody>
    </table>
  )
}

function LinhaFantasma() {
  return (
    <tr className="linha-fantasma" aria-hidden="true">
      <td><span className="fantasma-barra" /></td><td><span className="fantasma-barra" /></td>
    </tr>
  )
}
```

`src/components/cadastros/FormularioDeSetor.tsx`:

```tsx
import { type FormEvent, useId, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { DadosDoSetor } from '../../cadastros/tipos'
import { normalizarSigla, problemaNoSetor } from '../../cadastros/validacaoDoSetor'

type FormularioDeSetorProps = { aoSalvar: (dados: DadosDoSetor) => Promise<void>; aoCancelar: () => void }

// noValidate: as mensagens são as nossas (com o valor digitado), não as do navegador.
export function FormularioDeSetor({ aoSalvar, aoCancelar }: FormularioDeSetorProps) {
  const [nome, setNome] = useState('')
  const [sigla, setSigla] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const id = useId()

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoSetor(nome, sigla)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoSalvar({ nome: nome.trim(), sigla: normalizarSigla(sigla), observacoes: observacoes.trim() || null })
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
      setEnviando(false)
    }
  }

  return (
    <form className="form-setor" aria-label="Novo setor" noValidate onSubmit={enviar}>
      <h3 className="form-setor-titulo">Novo setor</h3>
      <label htmlFor={`${id}-nome`}>Nome</label>
      <input id={`${id}-nome`} value={nome} maxLength={200} autoComplete="off"
        onChange={(evento) => setNome(evento.target.value)} />
      <label htmlFor={`${id}-sigla`}>Sigla</label>
      <input id={`${id}-sigla`} value={sigla} autoComplete="off"
        aria-describedby={aviso ? `${id}-aviso` : undefined} onChange={(evento) => setSigla(evento.target.value)} />
      <label htmlFor={`${id}-observacoes`}>Observações</label>
      <textarea id={`${id}-observacoes`} value={observacoes} maxLength={2000} rows={3}
        onChange={(evento) => setObservacoes(evento.target.value)} />
      <div className="form-setor-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p id={`${id}-aviso`} className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
```

Acrescentar a `src/components/cadastros/Cadastros.css` (conferindo os tokens em `src/styles/tokens.css`):

```css
/* Lista compacta, no padrão da lista de usuários. */
.tabela-cadastros {
  width: 100%;
  border-collapse: collapse;
  background: var(--folha);
  font-size: var(--tam-secundario);
}

.tabela-cadastros caption {
  text-align: left;
  padding: var(--esp-2) 0;
}

.tabela-cadastros th,
.tabela-cadastros td {
  padding: var(--esp-2) var(--esp-3);
  text-align: left;
  border-bottom: 1px solid var(--borda);
}

.form-setor {
  display: grid;
  gap: var(--esp-2);
  max-width: 480px;
}

.form-setor-titulo {
  margin: 0;
}

.form-setor-botoes {
  display: flex;
  gap: var(--esp-2);
}

.cadastros-novo {
  justify-self: start;
}

.cadastros-secao {
  display: grid;
  gap: var(--esp-4);
}

/* "A ação não aconteceu" (vermelho), como na Administração (ADR 0003). */
.cadastros-erro,
.cadastros-falha {
  padding: var(--esp-3) var(--esp-4);
  border-radius: var(--canto);
  background: var(--atraso-fundo);
  color: var(--atraso-texto);
}
```

As linhas-fantasma usam as classes `.linha-fantasma` e `.fantasma-barra`, que já existem em `Administracao.css` (carregado pelo `App`).

- [x] **Passo 5: ver passar.** `npx vitest run src/App.setores.test.tsx src/App.novoSetor.test.tsx`: PASS; depois `npm run lint && npm run typecheck && npm test && npm run check:circular`.
- [x] **Passo 6: comitar.** "Lista de setores e cadastro de setor na área Setores".

Nota da execução (2026-10-13): o teste de cor lia o CSS vazio, porque o `vite.config.ts` só entrega aos testes o conteúdo de `Administracao.css` e `Moldura.css`. `Cadastros.css` entrou nessa lista (`test.css.include`).

---

### Tarefa 6: Fechamento

- [ ] **Passo 1:** marcar no ticket os critérios atendidos (`- [x]`), conferindo cada um contra os testes acima.
- [ ] **Passo 2:** `npm run test:coverage`, para ver a cobertura (o mínimo de 70% é conferido no `/ship`).
- [ ] **Passo 3:** juntar a branch à `main` (`git switch main`, `git merge cadastros-basicos`), apagar a branch com `git branch -d cadastros-basicos`, acrescentar ao fim do ticket `Concluído em AAAA-MM-DD (commit <hash>)` e comitar.
