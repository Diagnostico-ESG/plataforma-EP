# Ticket 12 de processos-etapas (Sem etapas do setor; Modelagem piloto) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** as etapas do setor, a coluna "Aguardando o setor" e o nível do catálogo saem do banco e da tela; todo processo começa na Modelagem piloto; os eventos antigos de etapa do setor ficam no histórico numa linha simples.

**Architecture:** uma migração nova apaga a view, os andamentos de setor, as três etapas de nível setor (com os gatilhos desligados por `session_replication_role`), renumera o catálogo de 1 a 6, renomeia `modelagem`, apaga `andamentos.setor_id`, `etapas.nivel`, o tipo, o gatilho de setor novo e a ordem entre níveis, recria as funções que liam o setor ou o nível e recria a view sem `aguardando_o_setor`. Na tela, o campo `aguardandoOSetor`, a coluna e a opção do filtro saem; `etapasDoSetor` e `lerEtapasDoSetor` saem do módulo; o tipo `EtapaDoSetor` vira `EtapaDoCaminho` (é a base de `EtapaDoProcesso`); o catálogo perde o nível. O histórico ganha o andamento sem processo no mapa dos recursos retirados.

**Tech Stack:** React + TypeScript, Vitest + Testing Library; pgTAP pelo GitHub Actions ("Testes de banco"); migração pelo workflow "Migrar banco de desenvolvimento".

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 18, 19, 29, 32, 45 a 47, 68 a 77; "Interface"; "Modelo de dados"; "Migração de 2026-10-18", passos 3 a 5; "Decisões de teste", Simplificação) · **Ticket:** `.scratch/processos-etapas/issues/12-sem-etapas-do-setor-modelagem-piloto.md`. Critérios citados como "critério N", na ordem do ticket: 1 migração, 2 pgTAP, 3 Quadro, 4 Lista e filtros, 5 painel e tela do setor, 6 Administração, 7 histórico, 8 módulo, 9 testes de tela, 10 `AMBIENTES.md`. Porquê: ADR 0013.

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui:
  - estrutura muda só por migração nova (`npx supabase migration new`); as migrações antigas ficam como estão;
  - o teste vem antes da migração;
  - nenhum `security definer` novo; as funções recriadas mantêm `search_path = ''`, nomes qualificados e os privilégios (`create or replace` os conserva; a `acrescentar_etapa` nova recebe `revoke` de `public, anon` e `grant` a `authenticated`, como a antiga);
  - a view nasce com `security_invoker = true`, `revoke all` de `anon, authenticated` e `grant select` a `authenticated` (o `10_privilegios_padrao` confere);
  - "não guarde o que se calcula": a etapa atual e o concluído continuam na view.
- Alvo conferido: a linha "vínculo atual" de `supabase/AMBIENTES.md` e `supabase/.temp/project-ref` são os dois `yclkzyoebpsxmgpbcbus` (desenvolvimento). O banco só é tocado pelos dois workflows, na branch, e pelo `db:types` (leitura).
- Funções de lógica com 4 a 20 linhas, arquivos até 300 linhas, complexidade até 10. Tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação.
- Só dados inventados.
- TDD: um teste que falha por erro de digitação não conta como o "vermelho".
- O pre-commit roda `typecheck` e a bateria inteira (cerca de 1 minuto). Cada commit precisa compilar sozinho.
- No workflow "Migrar banco de desenvolvimento", o campo `migracao` recebe só o nome do arquivo, sem a pasta.

## Decisões do plano

- **Gatilhos desligados por `set local session_replication_role = replica`** só no trecho que apaga, renumera e renomeia (o script aplica a migração numa transação, então o `set local` vale; os testes 26 a 30 já usam o mesmo ajuste com a mesma conexão). Desligado, nenhum evento de catálogo nasce, e a trava `conferir_etapa_nunca_usada` não roda (os andamentos dessas etapas já foram apagados antes).
- **Renumeração por `row_number()`** na ordem atual, e não por "ordem − 3": funciona mesmo que o catálogo do desenvolvimento tenha sido mexido pela tela.
- **A view sai primeiro (`drop view`) e volta no fim (`create view`)**: `create or replace view` não tira coluna. Nenhum objeto depende dela no catálogo do Postgres (as funções plpgsql que a leem não registram dependência).
- **`andamentos.processo_id` passa a `not null`**, e a restrição `andamentos_um_dono` sai antes; apagar `setor_id` leva junto a referência, a chave única (etapa, setor) e os índices `andamentos_setor` e `andamentos_um_em_andamento_por_setor`, e o privilégio de coluna.
- **`conferir_processo_em_andamento`** mantém o `if processo is null then return` (inofensivo; mexer nela é ruído).
- **Eventos antigos de andamento de setor no histórico:** o evento é reconhecido por não ter `processo_id` no estado; aparece como "Registro de etapa do setor (recurso retirado da plataforma)", sem "Antes:"/"Depois:"; a referência `setorId:andamentoId` continua levando-o ao filtro do setor (como os de responsável). `ehRecursoRetirado(entidade)` vira `ehRegistroRetirado(evento)`.
- **Eventos antigos do catálogo com "nível":** o rótulo "Nível" e os valores "Setor"/"Processo" ficam em `historicoDosCadastros.ts` só para eles ("como veio", spec); um teste de função prova que continuam legíveis.
- **Endereço antigo `etapa=aguardando-o-setor`:** `filtrosDaConsulta` o lê como sem filtro de etapa.
- **`EtapaDoSetor` vira `EtapaDoCaminho`** (troca mecânica com `sed`, a base de `EtapaDoProcesso`); `etapasDoSetorSupabase.ts` vira `andamentoDoBanco.ts` (`git mv`), sem `lerEtapasDoSetor`.
- **Tipos regenerados na Tarefa 6**, junto com a retirada do nível na tela: com os tipos novos, `catalogoSupabase.ts` (o `p_nivel`) não compila antes. Mesmo desvio dos tickets 05 e 11.
- **Ensaio da migração** em cópias temporárias dos testes 34, 19 e 22 (que exercitam a migração, a volta e o catálogo), apagadas depois.
- **Testes de tela:** os casos novos dos recursos retirados (painel, tela do setor, histórico) vão para `src/App.recursosRetirados.test.tsx`; os do Quadro, da Lista e dos filtros, para os arquivos deles; o do catálogo, para `App.catalogoDeEtapas.test.tsx`. `App.etapasDoSetor.test.tsx` é apagado.

## Estrutura de arquivos

**Criar:** `supabase/tests/34_sem_etapas_do_setor.test.sql`; `supabase/migrations/<timestamp>_sem_etapas_do_setor.sql`.

**Modificar (banco):** testes `17`, `18`, `19`, `20`, `21`, `22`, `27`, `28`, `29`, `30`; `supabase/AMBIENTES.md`.

**Apagar (banco):** `supabase/tests/15_etapas_do_setor.test.sql`.

**Modificar (tela):** `src/cadastros/historicoDosCadastros.ts` (+ teste), `src/components/cadastros/ListaDoHistorico.tsx`, `src/processos/{tipos,colunasDoQuadro,filtrosDosProcessos,enderecoDosProcessos,linhasDaLista,processoDaLinha,listaDeProcessosSupabase,lerProcessoSupabase,processosSupabase,andamentoFalso,ProcessosFalso,CatalogoFalso,catalogoSupabase,andamentosSupabase,frasesDoCatalogo,caminhoDeEtapas}.ts`, `src/components/processos/{CaminhoDoProcesso,CaminhoDeEtapas,EdicaoDaEtapa,FormularioDeDatas,LinhaDaEtapa}.tsx`, `src/components/processos/useAcoesDaEtapa.ts`, `src/components/processos/Etapas.css`, `src/components/cadastros/{SetorAberto,AreaDeSetores}.tsx`, `src/components/administracao/{CamposDaEtapaNova,FormularioDaEtapa,CatalogoEditavel,TabelaDoCatalogo}.tsx`, `src/testes/{catalogoDeTeste,processosNosCadastros}.tsx`, `src/types/database.ts` (regenerado) e os testes que o `tsc` apontar.

**Renomear:** `src/processos/etapasDoSetorSupabase.ts` → `src/processos/andamentoDoBanco.ts`.

**Apagar (tela):** `src/components/processos/EtapasDoSetor.tsx`, `src/App.etapasDoSetor.test.tsx`.

## Tarefas

### Tarefa 1 — Branch, marco e testes de banco que falham (critério 2)

**Arquivos:** criar `supabase/tests/34_sem_etapas_do_setor.test.sql`; modificar 17 a 22 e 27 a 30; apagar 15.

- [ ] `git switch -c processos-etapas-12` a partir da `main` limpa; `git tag marco/2026-10-18-inicio-ticket-12-processos-etapas` e `git push origin refs/tags/marco/2026-10-18-inicio-ticket-12-processos-etapas`. Conferir o alvo (os dois `yclkzyoebpsxmgpbcbus`).
- [ ] Escrever o 34 com o cabeçalho, os usuários a1 a a4, o `finish()` e a exceção `RESULTADO DOS TESTES` do 33. `plan(18)`. Corpo:

```sql
-- Preparação como dono do banco: um setor e um processo novos, e um evento antigo de andamento de setor.
create temp table _antes as select count(*) as andamentos from public.andamentos;
insert into public.setores (id, sigla, nome) values ('5d000000-0000-0000-0000-000000000001', 'TSP', 'Setor Piloto');
insert into public.macroprocessos (id, codigo, nome) values ('ad000000-0000-0000-0000-000000000001', null, 'Macro Piloto');
insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes) values
  (null, 'iniciar', 'andamento', 'setor-antigo-e1:andamento-antigo-e1',
   '{"antes": {"setor_id": "setor-antigo-e1", "setor_sigla": "TRA", "etapa_nome": "Reunião de sensibilização",
     "status": "pendente"}, "depois": {"setor_id": "setor-antigo-e1", "setor_sigla": "TRA",
     "etapa_nome": "Reunião de sensibilização", "status": "em_andamento"}}');

create function pg_temp.eventos_antigos() returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade_ref = 'setor-antigo-e1:andamento-antigo-e1'
$$;
grant execute on function pg_temp.eventos_antigos() to authenticated;

create function pg_temp.andamento(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select a.id from public.andamentos a join public.processos p on p.id = a.processo_id
  join public.etapas e on e.id = a.etapa_id where p.nome = nome_do_processo and e.codigo = codigo_da_etapa $$;
grant execute on function pg_temp.andamento(text, text) to authenticated;

-- 1 a 7: o que saiu do banco.
insert into _tap (linha) select hasnt_column('public', 'andamentos', 'setor_id', 'andamentos não tem setor_id');
insert into _tap (linha) select col_not_null('public', 'andamentos', 'processo_id', 'todo andamento é de um processo');
insert into _tap (linha) select hasnt_column('public', 'etapas', 'nivel', 'etapas não tem nivel');
insert into _tap (linha) select hasnt_type('public', 'nivel_da_etapa', 'o tipo nivel_da_etapa não existe');
insert into _tap (linha) select hasnt_column('public', 'processos_com_andamento', 'aguardando_o_setor',
  'a view não tem aguardando_o_setor');
insert into _tap (linha) select hasnt_trigger('public', 'setores', 'criar_andamentos_do_setor',
  'setor novo não tem gatilho de andamentos');
insert into _tap (linha) select has_function('public', 'acrescentar_etapa', array['text', 'text', 'boolean', 'uuid'],
  'acrescentar_etapa sem o nível');

-- 8: o catálogo renumerado e renomeado.
insert into _tap (linha) select results_eq(
  $sql$select ordem, codigo, nome, obrigatoria from public.etapas order by ordem$sql$,
  $sql$values (1, 'modelagem', 'Modelagem piloto', true), (2, 'relatorio_modelagem_tecnica', 'Relatório e modelagem técnica', true),
    (3, 'revisao_interna', 'Revisão interna', true), (4, 'revisao_setor', 'Revisão pelo setor', true),
    (5, 'aprovacao_setor', 'Aprovação pelo setor', true), (6, 'publicacao', 'Publicação', false)$sql$,
  'o catálogo tem as 6 etapas, de 1 a 6, com a Modelagem piloto em primeiro');

-- 9 e 10: setor novo sem andamento; processo novo com 6 pendentes.
insert into _tap (linha) select is((select count(*) from public.andamentos), (select andamentos from _antes),
  'setor novo não ganha andamentos');
insert into public.processos (setor_id, macroprocesso_id, nome) values
  ('5d000000-0000-0000-0000-000000000001', 'ad000000-0000-0000-0000-000000000001', 'Piloto Um'),
  ('5d000000-0000-0000-0000-000000000001', 'ad000000-0000-0000-0000-000000000001', 'Piloto Dois');
insert into _tap (linha) select is(
  (select count(*)::int from public.andamentos a join public.processos p on p.id = a.processo_id
    where p.nome = 'Piloto Um' and a.status = 'pendente'),
  6, 'processo novo nasce com 6 andamentos pendentes');

-- 11 e 12: a Modelagem piloto começa sem o setor; a 2 com a 1 pendente é recusada.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$update public.andamentos set status = 'em_andamento' where id = pg_temp.andamento('Piloto Um', 'modelagem')$sql$,
  'a Modelagem piloto de um processo novo inicia sem depender do setor');
insert into _tap (linha) select throws_ok(
  $sql$update public.andamentos set status = 'em_andamento'
    where id = pg_temp.andamento('Piloto Dois', 'relatorio_modelagem_tecnica')$sql$,
  'P0001', 'anterior_nao_resolvida:Modelagem piloto', 'iniciar a 2 com a 1 pendente é recusado');
reset role;

-- 13 a 18: o evento antigo de andamento de setor, por perfil.
-- (blocos de a1, a2 e a3 com is(pg_temp.eventos_antigos(), 1::bigint, '<perfil> lê o evento antigo de etapa do setor'),
--  a4 com 0::bigint, e o visitante com throws_ok($sql$select 1 from public.eventos where entidade = 'andamento'$sql$,
--  '42501', null, 'visitante não lê os eventos de etapa'), no mesmo formato do 33: set_config + set local role + reset role.)
```

  Junto com os itens 1 a 7 entra também `hasnt_function('private', 'criar_andamentos_do_setor', 'a função criar_andamentos_do_setor não existe')`. Conta: 8 do que saiu + catálogo + setor novo + processo novo + iniciar + recusa + 3 perfis ativos + inativo + visitante = 18.
- [ ] Ajustar os testes antigos (todos ficam vermelhos antes da migração, por falta de `setor_nao_resolveu` resolvido ou por esperarem o estado novo):
  - **17:** linha 175, tirar `and e.nivel = 'processo'`; apagar as duas asserções de `aguardando_o_setor` (linhas 243-245 e 255-258) e as três `update ... where setor_id = ...` entre elas (246-254); trocar a asserção "andamento de setor e de processo ao mesmo tempo" (342-348) por `throws_ok($sql$update public.andamentos set processo_id = null where processo_id = (select id from public.processos where setor_id = '5e000000-0000-0000-0000-000000000004') and etapa_id = (select id from public.etapas where codigo = 'modelagem')$sql$, '23502', null, 'andamento sem processo é recusado')`, e o comentário acima vira "Restrições do dono: todo andamento é de um processo, e a etapa não se repete no processo."; `plan(79)` → `plan(77)`.
  - **18:** cabeçalho sem "setor resolvido antes da primeira etapa"; comentário do setor sem "(o gatilho dá a ele as 3 etapas do setor, pendentes)"; apagar o `throws_ok` de `setor_nao_resolveu`, as três `update ... setor_id` e o `ok(not aguardando_o_setor ...)` (linhas 49-65); o `lives_ok` seguinte passa a "iniciar a Modelagem piloto sem depender do setor"; `'ja_ha_etapa_em_andamento:Reunião de modelagem'` → `'ja_ha_etapa_em_andamento:Modelagem piloto'`; `plan(25)` → `plan(23)`.
  - **19:** apagar `pg_temp.andamento_do_setor` (40-44), as três `update` da preparação (61-66, comentário vira "Preparação: \"Processo Volta\" com a 1 e a 2 concluídas.") e o bloco "Voltar no setor" (219-230: 3 asserções); `plan(38)` → `plan(35)`.
  - **20, 21, 27, 28, 29, 30:** apagar a `update public.andamentos ... where setor_id = '…' and status = 'pendente';` da preparação (20:59-60, 21:73-74, 27:71-72, 28:71-72, 29:191-192, 30:103-104) e tirar "as etapas do setor resolvidas" do comentário acima; no 20, o comentário da linha 24 sem "(o gatilho dá a ele as 3 etapas do setor)".
  - **22:** apagar `pg_temp.no_setor`; no `do $$` da preparação, apagar o laço do setor e tirar `nivel = 'processo' and` do outro; as chamadas `acrescentar_etapa(…, 'processo', …)` perdem o `'processo'` (linhas 113 e a de `conferir_perfil`); trocar o bloco "Etapa do setor antes da modelagem" + "Etapas do setor sempre antes das do processo" (126-145, 7 asserções) por:

```sql
-- Etapa nova antes da Modelagem piloto: abre espaço na ordem e entra pendente nos processos.
insert into _tap (linha) select lives_ok(
  $sql$select public.acrescentar_etapa('teste_antes', 'Etapa Nova Antes', false, pg_temp.etapa('modelagem'))$sql$,
  'o administrador acrescenta uma etapa antes da Modelagem piloto');
insert into _tap (linha) select is(pg_temp.ordem('teste_antes'), pg_temp.ordem_antes('modelagem'),
  'a etapa nova fica na posição da Modelagem piloto');
insert into _tap (linha) select is(pg_temp.ordem('modelagem'), pg_temp.ordem_antes('modelagem') + 1,
  'a Modelagem piloto desce uma posição');
insert into _tap (linha) select is(pg_temp.no_processo('Andando', 'teste_antes', true), 1,
  'a etapa nova entra pendente no processo em andamento');
```

    e no resto `teste_setor` → `teste_antes` (`_teste_setor` → `_teste_antes`) e `'etapa_usada:Reunião de modelagem'` → `'etapa_usada:Modelagem piloto'`; `plan(49)` → `plan(46)`. Comentário do setor TC2 sem "(inativo: recebe as etapas do setor mesmo assim)" (o TC2 fica, sem uso, ou sai com a linha dele — sai).
- [ ] `git rm supabase/tests/15_etapas_do_setor.test.sql`.
- [ ] Comitar ("Ticket 12 de processos-etapas: testes de banco sem as etapas do setor"), enviar a branch e disparar o "Testes de banco" na branch. Esperado: vermelhos o 34 e os ajustados (17 a 22, 27 a 30); os demais verdes. Anotar a execução.

### Tarefa 2 — Migração, ensaio e aplicação (critérios 1 e 10)

**Arquivos:** criar `supabase/migrations/<timestamp>_sem_etapas_do_setor.sql`; modificar `supabase/AMBIENTES.md`.

- [ ] `npx supabase migration new sem_etapas_do_setor` e escrever:

```sql
-- Processos e etapas, ticket 12 (Simplificação, ADR 0013): saem as etapas do setor, a coluna "aguardando o setor" e o
-- nível do catálogo; a primeira etapa vira Modelagem piloto. Destrutiva: apaga os andamentos de setor e as três etapas
-- de nível setor (só dados inventados do desenvolvimento). Os eventos antigos de andamento de setor ficam, legíveis
-- pela política "eventos: perfil ativo lê as etapas", que esta migração não toca.

-- A view lê o que sai; ela volta no fim, sem "aguardando o setor" (create or replace view não tira coluna).
drop view public.processos_com_andamento;

-- Apagar, renumerar e renomear é mudança de estrutura, não ação de alguém: com os gatilhos desligados só neste trecho,
-- nenhum evento de catálogo nasce (os andamentos das etapas apagadas saem antes, então a trava de etapa usada não falta).
set local session_replication_role = replica;
delete from public.andamentos where processo_id is null;
delete from public.etapas where nivel = 'setor';
update public.etapas e set ordem = n.nova
from (select id, row_number() over (order by ordem)::int as nova from public.etapas) n
where n.id = e.id and e.ordem <> n.nova;
update public.etapas set nome = 'Modelagem piloto' where codigo = 'modelagem';
set local session_replication_role = origin;

-- Setor novo não ganha mais andamentos.
drop trigger criar_andamentos_do_setor on public.setores;
drop function private.criar_andamentos_do_setor();

-- Todo andamento é de um processo. Apagar setor_id leva a referência, a chave (etapa, setor), os dois índices do setor
-- e o privilégio de coluna.
alter table public.andamentos drop constraint andamentos_um_dono;
alter table public.andamentos alter column processo_id set not null;
alter table public.andamentos drop column setor_id;

-- Sem nível, a ordem entre níveis não existe mais.
drop trigger conferir_ordem_dos_niveis on public.etapas;
drop function private.conferir_ordem_dos_niveis();

-- Processo novo nasce com todas as etapas ativas (versão anterior: 20261014130147_processos).
create or replace function private.criar_andamentos_do_processo() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.andamentos (etapa_id, processo_id)
  select id, new.id from public.etapas where ativa;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- A primeira etapa (Modelagem piloto) sai de pendente sem conferir nada; as outras pedem a anterior resolvida
-- (versões anteriores: 20261014135657_andamento_do_processo).
create or replace function private.conferir_sequencia_do_processo(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
declare
  anterior record;
begin
  select e.nome, a.status into anterior
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = andamento.processo_id
    and e.ordem < (select ordem from public.etapas where id = andamento.etapa_id)
  order by e.ordem desc limit 1;
  if found and anterior.status in ('pendente', 'em_andamento') then
    raise exception 'anterior_nao_resolvida:%', anterior.nome;
  end if;
end $$;

create or replace function private.conferir_sequencia(andamento public.andamentos) returns void
language plpgsql stable set search_path = ''
as $$
begin
  if andamento.status = 'em_andamento' then
    perform private.conferir_uma_em_andamento(andamento);
  end if;
  perform private.conferir_sequencia_do_processo(andamento);
end $$;

drop function private.conferir_setor_resolvido(uuid), private.conferir_anterior_resolvida(public.andamentos);

-- O evento do andamento é sempre do processo (versões anteriores: andamento_do_processo e voltar_datas_responsavel).
create or replace function private.base_do_evento_do_andamento(andamento public.andamentos) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('processo_id', p.id, 'processo_nome', p.nome, 'setor_sigla', s.sigla,
    'etapa_codigo', e.codigo, 'etapa_nome', e.nome)
  from public.processos p join public.setores s on s.id = p.setor_id, public.etapas e
  where p.id = andamento.processo_id and e.id = andamento.etapa_id $$;

create or replace function private.registrar_evento_do_andamento() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  base jsonb := private.base_do_evento_do_andamento(new);
  com_responsavel boolean := old.responsavel_id is not null or new.responsavel_id is not null;
  antes jsonb := base || private.estado_do_andamento(old, com_responsavel);
  depois jsonb := base || private.estado_do_andamento(new, com_responsavel);
  motivo text := case when private.voltando() then nullif(current_setting('ep.motivo_da_volta', true), '') else new.nota end;
begin
  if antes = depois and old.nota is not distinct from new.nota then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_andamento(old, new), 'andamento',
    new.processo_id::text || ':' || new.id::text,
    jsonb_build_object('antes', antes, 'depois', depois, 'motivo', motivo));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Voltar: as seguintes do mesmo processo (versão anterior: voltar_datas_responsavel).
create or replace function private.devolver_etapas_seguintes(escolhido public.andamentos) returns void
language sql set search_path = ''
as $$
  update public.andamentos a set status = 'pendente', nota = null, iniciada_em = null, resolvida_em = null
  from public.etapas e, public.etapas da_escolhida
  where e.id = a.etapa_id and da_escolhida.id = escolhido.etapa_id
    and a.processo_id = escolhido.processo_id
    and e.ordem > da_escolhida.ordem and a.status <> 'pendente' $$;

-- A etapa nova (ou reativada) entra só nos processos em andamento e suspensos não concluídos (versão anterior:
-- catalogo_de_etapas).
create or replace function private.incluir_andamentos_pendentes(etapa public.etapas) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.sincronizando_catalogo', 'on', true);
  insert into public.andamentos (etapa_id, processo_id)
  select etapa.id, p.id from public.processos_com_andamento p
  where p.situacao in ('em_andamento', 'suspenso')
    and not exists (select 1 from public.andamentos a where a.etapa_id = etapa.id and a.processo_id = p.id);
  perform set_config('ep.sincronizando_catalogo', 'off', true);
end $$;

-- O evento da etapa sem o nível; os eventos antigos ficam com ele.
create or replace function private.estado_da_etapa(etapa public.etapas) returns jsonb
language sql immutable set search_path = ''
as $$ select jsonb_build_object('codigo', etapa.codigo, 'nome', etapa.nome,
  'obrigatoria', etapa.obrigatoria, 'ativa', etapa.ativa, 'ordem', etapa.ordem) $$;

-- Acrescentar etapa sem o nível: apagada e recriada com a assinatura nova e os mesmos privilégios.
drop function public.acrescentar_etapa(text, text, public.nivel_da_etapa, boolean, uuid);
create function public.acrescentar_etapa(p_codigo text, p_nome text, p_obrigatoria boolean, p_antes_de uuid)
  returns uuid
language plpgsql set search_path = ''
as $$
declare
  posicao integer := (select ordem from public.etapas where id = p_antes_de);
  nova uuid;
begin
  if p_antes_de is not null and posicao is null then
    raise exception 'registro_inexistente';
  end if;
  posicao := coalesce(posicao, (select coalesce(max(ordem), 0) + 1 from public.etapas));
  perform set_config('ep.etapa_movida', 'nenhuma', true);
  update public.etapas set ordem = ordem + 1 where ordem >= posicao;
  insert into public.etapas (codigo, nome, ordem, obrigatoria)
  values (p_codigo, btrim(p_nome), posicao, p_obrigatoria) returning id into nova;
  perform set_config('ep.etapa_movida', '', true);
  return nova;
end $$;

revoke execute on function public.acrescentar_etapa(text, text, boolean, uuid) from public, anon;
grant execute on function public.acrescentar_etapa(text, text, boolean, uuid) to authenticated;

alter table public.etapas drop column nivel;
drop type public.nivel_da_etapa;

-- A view do Quadro e do painel, sem "aguardando o setor". Fora isso, igual à da migração data_da_reuniao.
create view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and not exists (
    select 1 from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = p.id and e.obrigatoria and a.status in ('pendente', 'em_andamento')
  ) then 'concluido' else p.situacao::text end as situacao,
  atual.etapa_id as etapa_atual_id, atual.codigo as etapa_atual_codigo, atual.nome as etapa_atual_nome,
  atual.ordem as etapa_atual_ordem,
  atual.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_reuniao
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join lateral (
  select e.id as etapa_id, e.codigo, e.nome, e.ordem, a.responsavel_id
  from public.andamentos a join public.etapas e on e.id = a.etapa_id
  where a.processo_id = p.id and a.status in ('pendente', 'em_andamento')
  order by (a.status = 'em_andamento') desc, e.ordem
  limit 1
) atual on true
left join public.usuarios u on u.id = atual.responsavel_id;

revoke all on public.processos_com_andamento from anon, authenticated;
grant select on public.processos_com_andamento to authenticated;
```

  Antes de colar, conferir em `20261014143045_voltar_datas_responsavel.sql` e `20261018123613_data_da_reuniao.sql` que os corpos copiados são as versões mais novas (o de `registrar_evento_do_andamento` só troca a referência).
- [ ] Ensaiar: criar `supabase/tests/34b_ensaio_sem_etapas.test.sql`, `19b_ensaio_voltar.test.sql` e `22b_ensaio_catalogo.test.sql`, cópias dos testes da Tarefa 1 com o corpo da migração logo depois do `begin` (por script Node, para não errar a cópia); comitar, enviar e disparar o "Testes de banco". Esperado: 34b, 19b e 22b verdes; os originais ainda vermelhos. Apagar as três cópias e comitar. Se o ensaio falhar, corrigir a migração e repetir; na terceira falha, parar (regra de parada).
- [ ] Comitar a migração (sem os tipos) e enviar. Disparar o "Migrar banco de desenvolvimento" na branch com o nome do arquivo e ler o resultado. Depois, o "Testes de banco" na branch. Esperado: todos verdes, o 34 com 18 de 18.
- [ ] Registrar em `supabase/AMBIENTES.md` a linha da migração, no formato das anteriores (data, ticket, destrutiva e o que apaga, testes vermelhos antes e verdes depois com as execuções, o ensaio, o workflow; os tipos ficam para a Tarefa 6). Comitar.

### Tarefa 3 — Eventos antigos de etapa do setor na linha simples (critério 7)

**Arquivos:** `src/cadastros/historicoDosCadastros.ts` (+ teste), `src/components/cadastros/ListaDoHistorico.tsx`, `src/App.recursosRetirados.test.tsx`, e os casos antigos de andamento de setor em `src/App.historicoDosCadastros.test.tsx` (se houver).

**Interfaces:**
- Produz: `export function ehRegistroRetirado(evento: EventoDoCadastro): boolean` (substitui `ehRecursoRetirado`).

- [ ] Testes que falham:
  - em `App.recursosRetirados.test.tsx`, no molde do caso do responsável:

```tsx
const ETAPA_DO_SETOR_ANTIGA: EventoDoCadastro = {
  id: 11, ocorridoEm: '2026-10-13T17:00:00Z', autor: 'Pessoa Fictícia', acao: 'iniciar', entidade: 'andamento',
  entidadeRef: 's1:a1', antes: { setor_id: 's1', setor_sigla: 'TSA', etapa_nome: 'Reunião de sensibilização', status: 'pendente' },
  depois: { setor_id: 's1', setor_sigla: 'TSA', etapa_nome: 'Reunião de sensibilização', status: 'em_andamento' },
}

test('no histórico geral, o registro antigo de etapa do setor aparece numa linha simples', async () => {
  window.location.hash = '#/setores/historico'
  montarNosCadastros({ ajustarCadastros: (cadastros) => { cadastros.historico = [ETAPA_DO_SETOR_ANTIGA] } })
  await screen.findByRole('combobox', { name: 'Item' })
  const [item] = screen.getAllByRole('listitem')
  expect(item.textContent).toContain('Iniciou a etapa Registro de etapa do setor (recurso retirado da plataforma)')
  expect(item.textContent).toMatch(/13\/10\/2026/)
  expect(item.textContent).not.toContain('Reunião de sensibilização')
  expect(item.textContent).not.toContain('Antes:')
})
```

  - em `historicoDosCadastros.test.ts`, um `describe('registros antigos de etapa do setor (recurso retirado da plataforma)')` com: `nomeDoItem` do evento de andamento sem `processo_id` = a linha simples; `ehRegistroRetirado` verdadeiro para ele, para `reuniao` e `responsavel_do_setor`, e falso para um andamento com `processo_id`; `eventosDoItem([evento], 's1')` o devolve. E um caso "evento antigo do catálogo com nível": `descreverEstadoDoCadastro({ codigo: 'sensibilizacao', nome: 'Reunião de sensibilização', nivel: 'setor', obrigatoria: false, ativa: true, ordem: 2 })` contém `Nível: Setor`.
  - trocar nos testes existentes os usos de `ehRecursoRetirado('x')` por `ehRegistroRetirado(evento({ entidade: 'x' }))`, e apagar (ou converter para a linha simples) os casos que esperam "Etapa — SIGLA" num andamento de setor (`grep -n "setor_sigla" src/cadastros/historicoDosCadastros.test.ts src/App.historicoDosCadastros.test.tsx`).
- [ ] Rodar `npx vitest run src/App.recursosRetirados.test.tsx src/cadastros/historicoDosCadastros.test.ts`: falha (texto "Reunião de sensibilização — TSA"; `ehRegistroRetirado` não existe).
- [ ] Implementar em `historicoDosCadastros.ts`:

```ts
/** Recursos que saíram da plataforma (ADR 0013): os eventos ficam no histórico, numa linha sem o detalhe. */
const TEXTO_DO_RECURSO_RETIRADO: Record<string, string> = {
  reuniao: 'Registro de reunião (recurso retirado da plataforma)',
  responsavel_do_setor: 'Registro de responsável do setor (recurso retirado da plataforma)',
  andamento: 'Registro de etapa do setor (recurso retirado da plataforma)',
}

// O andamento só é recurso retirado quando era do setor: o do processo traz o processo_id no estado.
export function ehRegistroRetirado(evento: EventoDoCadastro): boolean {
  if (evento.entidade === 'andamento') return !('processo_id' in estadoLegivel(evento))
  return evento.entidade in TEXTO_DO_RECURSO_RETIRADO
}
```

  - `nomeDoItem`: primeira linha `if (ehRegistroRetirado(evento)) return TEXTO_DO_RECURSO_RETIRADO[evento.entidade]`;
  - `nomeDoItemComDono`: sai a linha dos retirados; o nome do andamento passa a `${nome} — ${texto(estado.processo_nome)}`; comentário "A etapa pertence a um processo: o nome vem com ele; a versão vem com o processo dela; null se o item não for de nenhum deles.";
  - `temItemProprio`: `!ENTIDADES_QUE_LIGAM.has(evento.entidade) && !ehRegistroRetirado(evento)`;
  - `ListaDoHistorico.tsx` (linha 41): `{!ehRegistroRetirado(evento) && <MudancaDoEvento evento={evento} />}`;
  - comentário de `valorPorRotulo`: "…e da etapa do catálogo (obrigatória, ativa; nível só nos eventos antigos)…".
- [ ] Rodar os dois arquivos e `npm test`: verde. Comitar ("Ticket 12 de processos-etapas: registros antigos de etapa do setor na linha simples do histórico").

### Tarefa 4 — Quadro, Lista e filtros sem "Aguardando o setor" (critérios 3 e 4)

**Arquivos:** `src/processos/{tipos,colunasDoQuadro,filtrosDosProcessos,enderecoDosProcessos,linhasDaLista,processoDaLinha,ProcessosFalso,andamentoFalso}.ts` (+ testes unitários), `src/App.{quadro,filtrosDosProcessos,lista}.test.tsx`, e os testes e fixtures que o `tsc` apontar ao tirar `aguardandoOSetor`.

- [ ] Testes que falham:
  - `App.quadro.test.tsx`: o caso "as colunas…" passa a "as colunas: uma por etapa ativa, na ordem do catálogo, sem 'Aguardando o setor'" (espera `[MODELAGEM.nome, RELATORIO.nome]` e `screen.queryByRole('region', { name: 'Aguardando o setor' })` nulo); o caso "cada processo fica na coluna…" perde o `aguardandoOSetor: true`; os `findByRole('region', { name: 'Aguardando o setor' })` usados como espera viram `findByRole('region', { name: MODELAGEM.nome })`. Caso novo:

```tsx
test('o processo cadastrado aparece direto na coluna da primeira etapa', async () => {
  const falso = montar()
  await screen.findByRole('region', { name: MODELAGEM.nome })
  await falso.criarProcesso({ nome: 'Novo Piloto', setorId: 's1', macroprocessoId: 'm1', tipo: 'processo', processoPaiId: null,
    origem: 'novo', contexto: null, observacoes: null })
  window.location.hash = '#/processos/lista'
  window.location.hash = '#/processos'
  await waitFor(() => expect(cartoesDa(MODELAGEM.nome).join()).toContain('Novo Piloto'))
})
```

  (Antes, conferir como os outros testes forçam o Quadro a recarregar e usar o mesmo jeito; `etapasDoCatalogo` do teste está em `[RELATORIO, MODELAGEM]`, e o falso usa a de menor ordem como etapa atual — conferir em `processoNovo`.)
  - `App.filtrosDosProcessos.test.tsx`: tirar a linha `['Etapa atual', 'Aguardando o setor', ['Cadastrar Bem']]` da tabela e o `aguardandoOSetor` do `Cadastrar Bem`; caso novo:

```tsx
test('as opções de etapa não têm "Aguardando o setor", e o endereço antigo com ele mostra tudo', async () => {
  window.location.hash = '#/processos/lista?etapa=aguardando-o-setor'
  montar()
  const etapa = await screen.findByRole('combobox', { name: 'Etapa atual' })
  expect(within(etapa).queryByRole('option', { name: 'Aguardando o setor' })).toBeNull()
  expect(await screen.findByRole('row', { name: /Cadastrar Bem/ })).toBeTruthy()
  expect(screen.queryByText('Nenhum processo com estes filtros.')).toBeNull()
})
```

  (Conferir o nome da função de montagem e do seletor no arquivo.)
  - `App.lista.test.tsx`: o `Cadastrar Bem` perde o `aguardandoOSetor` e ganha `etapaAtual` da Modelagem; a linha esperada mostra o nome da etapa.
  - unitários: `colunasDoQuadro.test.ts`, `filtrosDosProcessos.test.ts`, `linhasDaLista.test.ts`, `enderecoDosProcessos.test.ts` (novo caso: `lerEnderecoDosProcessos('#/processos/lista?etapa=aguardando-o-setor').filtros.etapa` é `null`; conferir o nome da função exportada).
- [ ] Rodar esses arquivos: falham.
- [ ] Implementar:
  - `tipos.ts`: tirar `aguardandoOSetor` (e o comentário) de `ProcessoDaLista`; comentário de `listarProcessos`: "Todos os processos por nome, mais as etapas do catálogo, na ordem dele.";
  - `colunasDoQuadro.ts`: tirar `CHAVE_AGUARDANDO_O_SETOR`; `colunasDoQuadro` filtra `noQuadro` direto pela etapa e devolve só `colunasDeEtapa`; comentário "Uma coluna por etapa ativa, na ordem do catálogo…";
  - `filtrosDosProcessos.ts`: `etapa: (processo, valor) => processo.etapaAtual?.codigo === valor`; apagar `estaNaEtapa` e o import; `opcoesDeEtapa` devolve `doCatalogo`;
  - `enderecoDosProcessos.ts`: comentário de `etapa` "O código da etapa atual."; em `filtrosDaConsulta`, `etapa: etapaDaConsulta(valor('etapa'))` com

```ts
// "aguardando-o-setor" saiu com as etapas do setor (ADR 0013): o endereço antigo vale como sem filtro de etapa.
function etapaDaConsulta(lida: string | null): string | null {
  return lida === 'aguardando-o-setor' ? null : lida
}
```

  - `linhasDaLista.ts`: `textoDaEtapaAtual` devolve `processo.etapaAtual?.nome ?? '—'`;
  - `processoDaLinha.ts`: tirar `aguardandoOSetor`;
  - `ProcessosFalso.ts` (`processoNovo`) e `andamentoFalso.ts` (`atualizarSetorDoProcesso` deixa de calcular `aguardandoOSetor`; ela sai de vez na Tarefa 5): tirar o campo;
  - fixtures e testes que o `npm run typecheck` apontar: tirar `aguardandoOSetor: false`.
- [ ] `npm run typecheck`, `npm test`, `npm run lint`: verdes. Comitar ("Ticket 12 de processos-etapas: Quadro, Lista e filtros sem Aguardando o setor").

### Tarefa 5 — Painel, tela do setor e módulo sem etapas do setor (critérios 5 e 8)

**Arquivos:** `src/processos/{tipos,ProcessosFalso,CatalogoFalso,andamentoFalso,lerProcessoSupabase,processosSupabase,caminhoDeEtapas}.ts`, `etapasDoSetorSupabase.ts` → `andamentoDoBanco.ts`, `src/components/processos/{CaminhoDoProcesso,CaminhoDeEtapas,EdicaoDaEtapa,FormularioDeDatas,LinhaDaEtapa}.tsx`, `useAcoesDaEtapa.ts`, `Etapas.css`, `src/components/cadastros/{SetorAberto,AreaDeSetores}.tsx`, apagar `EtapasDoSetor.tsx` e `App.etapasDoSetor.test.tsx`, `src/App.recursosRetirados.test.tsx`, `src/App.painelDoProcesso.test.tsx`, os testes que o `tsc` apontar.

- [ ] Testes que falham, em `App.recursosRetirados.test.tsx`:

```tsx
test('o setor aberto não tem a seção de etapas do setor, para quem altera e para a Consulta', async () => {
  for (const perfil of ['integrante_ep', 'consulta'] as const) {
    window.location.hash = '#/setores'
    montarNosCadastros({ perfil })
    fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
    await screen.findByRole('region', { name: 'Processos do setor' })
    expect(screen.queryByRole('region', { name: 'Etapas do setor' })).toBeNull()
    expect(screen.queryByText('Carregando etapas do setor…')).toBeNull()
    cleanup()
  }
})
```

  e, em `App.painelDoProcesso.test.tsx`, um caso "o caminho do painel começa na primeira etapa do processo, sem etapas do setor nem 'Ver no setor'" (abre um processo com `etapasDoProcesso` da Modelagem piloto e confere `queryByText('Etapas do setor')` e `queryByRole('link', { name: 'Ver no setor' })` nulos e o primeiro item do caminho com "Modelagem piloto"), usando a montagem do próprio arquivo; os casos antigos que montam `etapasDoSetor` no painel saem.
- [ ] Rodar e ver falhar (a seção e o link ainda aparecem).
- [ ] Implementar:
  - troca mecânica do tipo: `grep -rl "EtapaDoSetor\b" src | xargs sed -i 's/\bEtapaDoSetor\b/EtapaDoCaminho/g'`; em `tipos.ts`, o comentário do tipo vira "Uma etapa do catálogo num processo (o andamento): o id é o do andamento, que as ações recebem."; o de `EtapaDoProcesso`, "A etapa do caminho com o nome de quem responde por ela.";
  - `tipos.ts`: tirar `etapasDoSetor` de `ProcessoLido` e `lerEtapasDoSetor` de `ModuloDeProcessos`; `EtapaDoCatalogo` com o comentário "Uma etapa do catálogo, como as colunas do Quadro a usam.";
  - `git mv src/processos/etapasDoSetorSupabase.ts src/processos/andamentoDoBanco.ts`; nele, apagar `lerEtapasDoSetor`; comentário de `AndamentoLido`: "Um andamento com a etapa do catálogo embutida, como o banco devolve."; atualizar os imports (`lerProcessoSupabase.ts`, testes);
  - `lerProcessoSupabase.ts`: `Promise.all` sem `lerEtapasDoSetor`, e o retorno sem `etapasDoSetor`;
  - `processosSupabase.ts`: tirar o import e `lerEtapasDoSetor`;
  - `CaminhoDoProcesso.tsx`: apagar o bloco "Etapas do setor"/"Ver no setor" e a lista dele, `SEM_ACOES`, `NADA_A_FAZER` e o import de `LinhaDaEtapa` se sobrar; o comentário vira "O caminho do processo no painel, com as ações na etapa atual para quem pode alterar (a RLS é quem protege)."; o subtítulo "Etapas do processo" fica;
  - `caminhoDeEtapas.ts`: o comentário de `ehEtapaDoProcesso` vira "A etapa do processo traz o responsável; a do caminho genérico não." (conferir com grep se a função ainda tem uso; sem uso, apagar);
  - apagar `src/components/processos/EtapasDoSetor.tsx` e `src/App.etapasDoSetor.test.tsx`;
  - `SetorAberto.tsx`: tirar o import e a linha `<EtapasDoSetor …/>`, e o `setSumiu` só se ficar sem uso (o `SetorEditavel` usa); comentário "Os processos do setor ficam abaixo do que o setor já mostrava, para os dois modos.";
  - `AreaDeSetores.tsx`: comentário "Um terceiro trecho que não é aba (#/setores/<id>) abre o setor direto." (conferir com grep se algum outro lugar monta esse endereço; se não, manter a rota mesmo assim: ela é barata e serve a link compartilhado);
  - `Etapas.css`: apagar a regra `.etapas-do-setor`;
  - `ProcessosFalso.ts`: apagar o campo `etapasDoSetor`, `lerEtapasDoSetor`, a parte dos setores em `acharEtapa` e em `aplicar` (fica `this.processos = this.processos.map((processo) => trocarEtapaDoProcesso(processo, id, trocar))`), `etapasDoSetor` em `processoNovo`, e o comentário "aguarda o setor…"; comentário de `conferirProcessoDaEtapa` sem "(as do setor não têm)";
  - `andamentoFalso.ts`: apagar `atualizarSetorDoProcesso`;
  - `CatalogoFalso.ts`: `DonoDoCatalogo` sem `etapasDoSetor`; apagar `trocarEtapasDoSetor`, o ramo do setor em `incluirPendentes`, o laço do setor em `tirarPendentes` e a parte do setor em `andamentosDe`;
  - testes e fixtures que o `tsc` apontar: tirar `etapasDoSetor: []` e os casos que só existiam para as etapas do setor (`andamentoFalso.test.ts`, `ProcessosFalso.voltar.test.ts`, `CatalogoFalso.test.ts`, `App.andamentoDoProcesso.test.tsx`, `App.voltarDatasResponsavel.test.tsx`, `lerProcessoSupabase.test.ts`, `processosSupabase.test.ts`).
  - grep final: `grep -rniE "etapasDoSetor|EtapasDoSetor|lerEtapasDoSetor|Etapas do setor|Ver no setor|etapas-do-setor|atualizarSetorDoProcesso" src` acha só testes que provam a ausência.
- [ ] `npm run typecheck`, `npm test`, `npm run lint`: verdes. Comitar ("Ticket 12 de processos-etapas: painel, tela do setor e módulo sem etapas do setor").

### Tarefa 6 — Catálogo sem nível; recusas antigas fora; tipos regenerados (critérios 6 e 8)

**Arquivos:** `src/processos/{tipos,catalogoSupabase,CatalogoFalso,listaDeProcessosSupabase,andamentosSupabase,frasesDoCatalogo}.ts`, `src/components/administracao/{CamposDaEtapaNova,FormularioDaEtapa,CatalogoEditavel,TabelaDoCatalogo}.tsx`, `src/testes/catalogoDeTeste.tsx`, `src/App.catalogoDeEtapas.test.tsx`, `src/App.catalogoAcoes.test.tsx`, os testes unitários do catálogo e das recusas, `src/types/database.ts`.

- [ ] Testes que falham, em `App.catalogoDeEtapas.test.tsx`:

```tsx
test('o catálogo não tem a coluna nem o campo "Nível"', async () => {
  montarComCatalogo()
  const secao = await abrirCatalogo()
  expect(secao.queryByRole('columnheader', { name: 'Nível' })).toBeNull()
  fireEvent.click(secao.getByRole('button', { name: 'Nova etapa' }))
  expect(secao.queryByLabelText('Nível')).toBeNull()
})
```

  e ajustar os casos existentes: `ETAPAS_DE_TESTE` sem a etapa do setor e sem `nivel`, com a Modelagem piloto em primeiro (`{ id: 'e1', codigo: 'modelagem', nome: 'Modelagem piloto', ordem: 1, … }`, `publicacao` ordem 6, `arquivamento` ordem 7); as linhas esperadas sem "Setor"/"Processo"; o caso da recusa "As etapas do setor precisam vir antes…" sai (`grep -rn "precisam vir antes\|etapas_do_setor_primeiro\|setor_nao_resolveu\|ainda não resolveu" src`); `catalogoSupabase.test.ts` espera o `rpc` sem `p_nivel` e o `select` sem `nivel`; `listaDeProcessosSupabase.test.ts` sem o `.eq('nivel', …)`.
- [ ] Rodar e ver falhar.
- [ ] Implementar:
  - `tipos.ts`: apagar `NivelDaEtapa`; `EtapaNoCatalogo = EtapaDoCatalogo & { obrigatoria: boolean }` (comentário "…ativa ou não."); `EtapaNova` sem `nivel`; comentário de `DadosDaEtapa` "o código não muda depois de criado";
  - `CamposDaEtapaNova.tsx`: sem as props e o campo de nível; comentário "Código e posição: só se escolhem ao criar; depois de criada a etapa mantém o código.";
  - `FormularioDaEtapa.tsx`: sem o estado `nivel` e o `nivel` em `DadosDoFormularioDaEtapa` e no `aoSalvar`;
  - `CatalogoEditavel.tsx`: `etapaNova` sem `nivel`;
  - `TabelaDoCatalogo.tsx`: sem `ROTULO_DO_NIVEL`, o `<th>` e o `<td>` do nível;
  - `CatalogoFalso.ts`: apagar `conferirOrdemDosNiveis` e a chamada; `gravar` copia todas as etapas para `etapasDoCatalogo`; `incluirPendentes` só com o ramo do processo; `nivel` fora da etapa nova;
  - `frasesDoCatalogo.ts`: apagar `FRASE_DA_ORDEM_DOS_NIVEIS`;
  - `andamentosSupabase.ts`: tirar `setor_nao_resolveu` e `etapas_do_setor_primeiro` do padrão e das frases, e o import da frase; o comentário das migrações fica;
  - `catalogoSupabase.ts`: `select('id, codigo, nome, ordem, obrigatoria, ativa')` e `rpc` sem `p_nivel`;
  - `listaDeProcessosSupabase.ts`: sem `.eq('nivel', 'processo')`;
  - conferir o alvo e rodar `npm run db:types`; conferir no diff de `src/types/database.ts` que saíram só `andamentos.setor_id`, `etapas.nivel`, `nivel_da_etapa`, `aguardando_o_setor`, o `p_nivel` de `acrescentar_etapa`, e que `processo_id` de `andamentos` passou a obrigatório;
  - grep final: `grep -rniE "nivel|NivelDaEtapa|aguardando_o_setor|aguardandoOSetor|setor_nao_resolveu|etapas_do_setor_primeiro" src --include=*.ts --include=*.tsx | grep -v "src/types/database.ts"` acha só `historicoDosCadastros.ts` (o rótulo dos eventos antigos) e testes que provam a ausência.
- [ ] `npm test`, `npm run typecheck`, `npm run lint`: verdes. Comitar ("Ticket 12 de processos-etapas: catálogo sem nível; tipos regenerados").

### Tarefa 7 — Fecho

- [ ] Gravar `.scratch/processos-etapas/desvios.md` (entrada datada): gatilhos desligados com `session_replication_role`; renumeração por `row_number()`; `processo_id` obrigatório; tipo `EtapaDoSetor` renomeado; eventos antigos de etapa do setor na linha simples; rótulo "Nível" mantido para eventos antigos; tipos regenerados na Tarefa 6; ensaios; o que mais surgir.
- [ ] Gravar `.scratch/melhorias-protocolo.md` com os itens não testados do `/executar-complexo` e do "Qualquer momento" (`.claude/regras/nao-testados.md`) que aconteceram, mais a sessão no Opus.
- [ ] Marcar as caixas deste plano e comitar.
- [ ] `git switch main`, merge da branch, `git branch -d processos-etapas-12`; enviar a `main` e conferir o "Testes de banco" na `main`.
- [ ] Na `main`: `Concluído em 2026-10-18 (commit <hash>)` no fim do ticket 12; comitar e enviar.
