# Responsável inicial por etapa: plano de execução

> **Para quem executa:** use `/superpowers:executing-plans`. Os passos usam caixas (`- [ ]`); marque `- [x]` ao terminar cada um.

**Meta:** o Administrador define, no Catálogo de etapas, o responsável inicial de cada etapa; mover, cadastrar e retomar passam a pôr esse responsável (ou ninguém), no lugar de "quem move vira o responsável".

**Spec (única, vale como ticket):** seção "Responsável inicial por etapa (mudança de 2026-10-30)" de `.scratch/processos-etapas/spec.md`. Decisão: `docs/adr/0036-responsavel-inicial-por-etapa.md`. Domínio: `CONTEXT.md` (Responsável do processo, Responsável inicial, Mover). Abaixo, "critério N" = critério de pronto N da seção, "história N" = história de usuário N.

**Branch:** `responsavel-inicial-por-etapa`, comum, sem worktree. Marco já existente: `marco/2026-10-30-inicio-responsavel-inicial-por-etapa`.

**Regras de banco que valem aqui** (`.claude/regras/banco.md`, lido): estrutura só por migração criada com `npx supabase migration new`; teste pgTAP antes da migração; função nova sem `security definer` (roda com a permissão de quem chama; a RLS decide), `search_path` vazio, nomes qualificados, execução só para `authenticated`; dado calculado não se guarda (o "inválido" do responsável inicial é calculado na leitura); migração, teste de banco e tipos no mesmo commit; confira o alvo antes de qualquer comando que mexa no banco (aqui, só o Docker local; o vínculo remoto fica como está).

**Como se testa o banco nesta máquina** (ajuste do projeto, 2026-10-24): pelo Docker local. `npx supabase start > /dev/null 2>&1` (a saída traz chaves: descartada), `npx supabase db reset`, `npx supabase test db`. O "FAIL" final é do formato dos testes (devolvem o resultado como exceção): vale contar as linhas `ok` e `not ok`. O `npm run test:db` e o `db:types` apontam para o remoto e **não** entram aqui; os tipos saem do banco local (`npx supabase gen types typescript --local`).

## Arquivos

| Arquivo | O que muda |
|-|-|
| `supabase/tests/73_responsavel_inicial.test.sql` (novo) | teste pgTAP da regra inteira |
| `supabase/tests/52_mover_processo.test.sql`, `53_etiqueta_e_responsavel.test.sql` | duas ou três expectativas de "quem move/retomar vira responsável" passam à regra nova |
| `supabase/migrations/<timestamp>_responsavel_inicial_por_etapa.sql` (novo) | coluna, conferência, função do responsável válido, mover, cadastro, retomar, evento da etapa |
| `src/types/database.ts` | tipos gerados do banco local |
| `src/processos/tipos.ts` | `ResponsavelInicialDaEtapa`; `EtapaNoCatalogo.responsavelInicial`; `ModuloDoCatalogo.definirResponsavelInicial` |
| `src/processos/responsavelInicial.ts` (novo) + teste | regra pura: situação (válido, inativo, sem permissão) e responsável válido da etapa |
| `src/processos/catalogoSupabase.ts` + teste | lê o responsável inicial junto da etapa; grava a escolha |
| `src/processos/CatalogoFalso.ts` + teste | guarda e confere a escolha como o banco |
| `src/processos/frasesDoCatalogo.ts`, `recusasDoBanco.ts` | frase do Concluídos |
| `src/processos/ProcessosFalso.ts` + `ProcessosFalso.mover.test.ts` (+ `.situacao.test.ts`) | mover, cadastrar e retomar seguem a regra nova; sai `quemChama` |
| `src/testes/responsavelInicialDeTeste.ts` (novo) | atalho de teste para dar responsável inicial a uma etapa |
| `src/testes/aprovacaoNoVerso.tsx`, `processoNoVerso.tsx`, `quadroDeTeste.tsx` | saem as linhas `falso.quemChama = …` |
| `src/components/administracao/CampoDoResponsavelInicial.tsx` (novo) | a caixa de seleção de cada linha + aviso de inválido |
| `src/components/administracao/TabelaDoCatalogo.tsx`, `CatalogoEditavel.tsx`, `CatalogoDeEtapas.tsx`, `AreaDeAdministracao.tsx` | a coluna e a leitura dos usuários |
| `src/testes/catalogoDeTeste.tsx` | `linhasDoCatalogo` ignora a coluna nova |
| `src/App.responsavelInicial.test.tsx` (novo), `src/App.arrastarParaMover.test.tsx` e os testes de tela que esperavam "quem move vira o responsável" | testes de tela |
| `src/cadastros/historicoDosCadastros.ts` + `historicoDoCatalogo.test.ts` | "Responsável inicial" no histórico do catálogo |
| `.scratch/processos-etapas/spec.md`, `desvios.md`, `.scratch/proximo-passo.md`, `.scratch/melhorias-protocolo.md` | fecho |

---

## Tarefa 0: Preparo

- [ ] **0.1** Confira `git status` limpo (só o arquivo deste plano pode estar solto) e crie a branch: `git switch -c responsavel-inicial-por-etapa`. Comite este plano: `git add .scratch/processos-etapas/plano-responsavel-inicial.md && git commit -m "executar: plano de responsavel-inicial-por-etapa"`.
- [x] **0.2** Confira que o Docker responde: `docker info`. **Se o motor não responder** (aconteceu ao planejar: "failed to connect to the docker API"), **pare e peça ao usuário** que abra o Docker Desktop; sem ele não há teste de banco local, e o teste de banco não se pula. Com o Docker no ar: `npx supabase start > /dev/null 2>&1`.
- [x] **0.3** Base de comparação: `npx supabase db reset` e `npx supabase test db 2>&1 | grep -cE "^(ok|not ok)"` registrado de cabeça (quantas linhas `ok`, quantas `not ok` antes de mexer). Se já houver `not ok`, anote quais e não as confunda com as desta tarefa.

## Tarefa 1: Banco

**Consome:** `private.conferir_responsavel(novo uuid, antigo uuid)` (migração `20261014143045`), `private.mudar_situacao`, `private.evento_do_movimento`, `private.trocar_passagem`, `private.gravar_processo_movido`, `private.estado_da_etapa`. **Produz:** coluna `etapas.responsavel_inicial_id`; `private.responsavel_inicial_valido(uuid) returns uuid`; recusas `responsavel_invalido:<nome>` e `responsavel_inicial_em_concluidos`; evento da etapa com `responsavel_inicial_id` e `responsavel_inicial_nome` no antes e no depois.

- [x] **1.1 Escreva o teste que falha.** Crie `supabase/tests/73_responsavel_inicial.test.sql` com o conteúdo abaixo (34 asserções, histórias 1 a 17 e 22; critérios 2 a 9). Cada célula da tabela "quem pode o quê" da spec é um teste: Administrador (1, 2), Integrante (3), Consulta (4), inativo (5) e visitante sem login (6).

```sql
-- Responsável inicial por etapa (funcionalidade 17 de processos-etapas; ADR 0036): só o Administrador ativo define o
-- responsável inicial de cada etapa (recusa Consulta, inativo, inexistente e qualquer valor em Concluídos; aceita em Não
-- iniciados); mover, cadastrar e retomar põem o responsável inicial válido da etapa, ou ninguém; quem move não vira
-- responsável; mover para a própria etapa não muda nada; trocar o responsável inicial não mexe nos processos; a troca
-- entra no histórico da etapa com os nomes.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(34);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo, a5 segundo administrador
-- (desativado no meio do teste), a6 integrante (passa a Consulta no meio do teste).
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador'),
  ('admin2.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante2.teste@ccivil.pr.gov.br', 'integrante_ep');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a5', 'admin2.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a6', 'integrante2.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000073', 'T73', 'Setor Responsável Inicial');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000073', null, 'Macro Responsável Inicial');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000073', 'af000000-0000-0000-0000-000000000073', nome
from unnest(array['Anda', 'Sem', 'Inativo', 'Perfil', 'Conc', 'Mesma', 'RetS', 'RetC', 'RetSem', 'RetIgual']) as nome;

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000073' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.etapa(codigo_da_etapa text) returns uuid
language sql stable as $$ select id from public.etapas where codigo = codigo_da_etapa $$;
grant execute on function pg_temp.etapa(text) to authenticated;

create function pg_temp.nome(usuario text) returns text
language sql stable as $$ select nome from public.usuarios where id = ('00000000-0000-0000-0000-0000000000' || usuario)::uuid $$;
grant execute on function pg_temp.nome(text) to authenticated;

create function pg_temp.mover(nome_do_processo text, codigo_da_etapa text) returns void
language sql as $$ select public.mover_processo(pg_temp.processo(nome_do_processo), pg_temp.etapa(codigo_da_etapa)) $$;
grant execute on function pg_temp.mover(text, text) to authenticated;

create function pg_temp.responsavel(nome_do_processo text) returns text
language sql stable as $$ select responsavel_id::text from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.responsavel(text) to authenticated;

create function pg_temp.assumir(nome_do_processo text, usuario text) returns void
language sql as $$
  update public.processos set responsavel_id = ('00000000-0000-0000-0000-0000000000' || usuario)::uuid
  where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.assumir(text, text) to authenticated;

-- Grava o responsável inicial; devolve quantas linhas a RLS deixou mudar.
create function pg_temp.inicial(codigo_da_etapa text, usuario uuid) returns integer
language plpgsql as $$
declare
  linhas integer;
begin
  update public.etapas set responsavel_inicial_id = usuario where codigo = codigo_da_etapa;
  get diagnostics linhas = row_count;
  return linhas;
end $$;
grant execute on function pg_temp.inicial(text, uuid) to authenticated;

create function pg_temp.eventos_de_responsavel(nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade = 'processo' and acao = 'mudar_responsavel'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.eventos_de_responsavel(text) to authenticated;

-- ===== Quem altera =====
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select is(pg_temp.inicial('modelagem', '00000000-0000-0000-0000-0000000000a2'), 1,
  'o administrador ativo define o responsável inicial de uma etapa');
insert into _tap (linha) select is((select responsavel_inicial_id::text from public.etapas where codigo = 'modelagem'),
  '00000000-0000-0000-0000-0000000000a2', 'e a escolha fica gravada');
select pg_temp.claims('a2');
insert into _tap (linha) select is(pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a1'), 0,
  'o integrante do EP não altera o responsável inicial');
select pg_temp.claims('a3');
insert into _tap (linha) select is(pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a1'), 0,
  'a Consulta não altera o responsável inicial');
select pg_temp.claims('a4');
insert into _tap (linha) select is(pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a1'), 0,
  'o administrador inativo não altera o responsável inicial');
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set responsavel_inicial_id = '00000000-0000-0000-0000-0000000000a1' where codigo = 'publicacao'$sql$,
  '42501', null, 'o visitante sem login não altera o responsável inicial');
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select is((select responsavel_inicial_id from public.etapas where codigo = 'publicacao'), null::uuid,
  'nenhuma dessas tentativas gravou');

-- ===== O que o banco recusa e aceita =====
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a3')$sql$,
  'P0001', 'responsavel_invalido:' || pg_temp.nome('a3'), 'usuário Consulta como responsável inicial é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000a4')$sql$,
  'P0001', 'responsavel_invalido:' || pg_temp.nome('a4'), 'usuário inativo como responsável inicial é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.inicial('publicacao', '00000000-0000-0000-0000-0000000000ff')$sql$,
  'P0001', 'responsavel_invalido:00000000-0000-0000-0000-0000000000ff', 'usuário inexistente como responsável inicial é recusado');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.inicial('concluidos', '00000000-0000-0000-0000-0000000000a2')$sql$,
  'P0001', 'responsavel_inicial_em_concluidos', 'qualquer valor em Concluídos é recusado');
insert into _tap (linha) select lives_ok($sql$select pg_temp.inicial('concluidos', null)$sql$, 'Concluídos aceita ficar sem ninguém');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.inicial('nao_iniciados', '00000000-0000-0000-0000-0000000000a2')$sql$, 'Não iniciados aceita o responsável inicial');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.inicial('modelagem', '00000000-0000-0000-0000-0000000000a2')$sql$, 'gravar o mesmo valor é aceito');
-- As etapas do restante do teste: Revisão interna com a5 e Revisão do setor com a6 (válidos agora; deixam de ser adiante).
select pg_temp.inicial('revisao_interna', '00000000-0000-0000-0000-0000000000a5');
select pg_temp.inicial('revisao_setor', '00000000-0000-0000-0000-0000000000a6');
select pg_temp.inicial('nao_iniciados', null);

-- ===== Mover =====
select pg_temp.mover('Anda', 'modelagem');
insert into _tap (linha) select is(pg_temp.responsavel('Anda'), '00000000-0000-0000-0000-0000000000a2',
  'mover põe o responsável inicial da etapa de destino, e quem moveu (a1) não vira responsável');
insert into _tap (linha) select results_eq(
  $sql$select detalhes->'antes'->>'responsavel_id', detalhes->'depois'->>'responsavel_id', autor_id::text from public.eventos
    where entidade = 'passagem' and acao = 'mover' and entidade_ref = pg_temp.processo('Anda')::text$sql$,
  $sql$values (null::text, '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a1')$sql$,
  'o evento do movimento guarda o responsável de antes e o de depois, e quem moveu como autor');
select pg_temp.mover('Anda', 'publicacao');
insert into _tap (linha) select is(pg_temp.responsavel('Anda'), null,
  'mover para etapa sem responsável inicial deixa o processo sem responsável');

reset role;
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a5';
update public.usuarios set perfil = 'consulta' where id = '00000000-0000-0000-0000-0000000000a6';
set local role authenticated;
select pg_temp.claims('a1');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Inativo', 'revisao_interna')$sql$,
  'mover nunca falha porque o responsável inicial ficou inativo');
insert into _tap (linha) select is(pg_temp.responsavel('Inativo'), null, 'e o processo fica sem responsável');
insert into _tap (linha) select lives_ok($sql$select pg_temp.mover('Perfil', 'revisao_setor')$sql$,
  'mover nunca falha porque o responsável inicial passou a Consulta');
insert into _tap (linha) select is(pg_temp.responsavel('Perfil'), null, 'e o processo fica sem responsável');

select pg_temp.mover('Conc', 'modelagem');
select public.mover_processo(pg_temp.processo('Conc'), pg_temp.etapa('concluidos'), null, null, 'Sem publicação');
insert into _tap (linha) select is(pg_temp.responsavel('Conc'), null, 'mover para Concluídos deixa o processo sem responsável');

select pg_temp.mover('Mesma', 'modelagem');
select pg_temp.assumir('Mesma', 'a1');
select pg_temp.mover('Mesma', 'modelagem');
insert into _tap (linha) select is(pg_temp.responsavel('Mesma'), '00000000-0000-0000-0000-0000000000a1',
  'mover para a própria etapa não muda o responsável');
insert into _tap (linha) select is((select count(*) from public.passagens where processo_id = pg_temp.processo('Mesma')), 2::bigint,
  'nem abre passagem');
insert into _tap (linha) select lives_ok($sql$select pg_temp.assumir('Mesma', 'a2')$sql$, 'assumir e a troca manual continuam aceitos');

-- ===== Cadastrar =====
select pg_temp.inicial('nao_iniciados', '00000000-0000-0000-0000-0000000000a2');
insert into public.processos (setor_id, macroprocesso_id, nome)
values ('5f000000-0000-0000-0000-000000000073', 'af000000-0000-0000-0000-000000000073', 'Novo');
insert into _tap (linha) select is(pg_temp.responsavel('Novo'), '00000000-0000-0000-0000-0000000000a2',
  'o processo cadastrado entra com o responsável inicial de Não iniciados');
select pg_temp.inicial('nao_iniciados', null);
insert into public.processos (setor_id, macroprocesso_id, nome)
values ('5f000000-0000-0000-0000-000000000073', 'af000000-0000-0000-0000-000000000073', 'Novo sem');
insert into _tap (linha) select is(pg_temp.responsavel('Novo sem'), null, 'sem responsável inicial em Não iniciados, o cadastrado fica sem');

-- ===== Retomar =====
select pg_temp.mover(nome, 'modelagem') from unnest(array['RetS', 'RetC', 'RetIgual']) as nome;
select pg_temp.mover('RetSem', 'publicacao');
select pg_temp.assumir(nome, 'a1') from unnest(array['RetS', 'RetC', 'RetSem']) as nome;
select public.suspender_processo(pg_temp.processo(nome), 'Aguardando') from unnest(array['RetS', 'RetSem', 'RetIgual']) as nome;
select public.cancelar_processo(pg_temp.processo('RetC'), 'Desistiu');
create temp table _antes as select pg_temp.eventos_de_responsavel('RetIgual') as eventos;
select public.retomar_processo(pg_temp.processo(nome), 'Voltou') from unnest(array['RetS', 'RetC', 'RetSem', 'RetIgual']) as nome;
insert into _tap (linha) select is(pg_temp.responsavel('RetS'), '00000000-0000-0000-0000-0000000000a2',
  'retomar o suspenso põe o responsável inicial da etapa atual');
insert into _tap (linha) select is(pg_temp.responsavel('RetC'), '00000000-0000-0000-0000-0000000000a2',
  'retomar o cancelado também');
insert into _tap (linha) select is(pg_temp.responsavel('RetSem'), null, 'retomar em etapa sem responsável inicial deixa o processo sem responsável');
insert into _tap (linha) select results_eq(
  $sql$select pg_temp.responsavel('RetIgual'), pg_temp.eventos_de_responsavel('RetIgual')$sql$,
  $sql$select '00000000-0000-0000-0000-0000000000a2', (select eventos from _antes)$sql$,
  'retomar sem mudança de responsável não registra nada a mais');
insert into _tap (linha) select results_eq(
  $sql$select autor_id::text, detalhes->'antes'->>'responsavel_nome', detalhes->'depois'->>'responsavel_nome' from public.eventos
    where entidade = 'processo' and acao = 'mudar_responsavel' and entidade_ref = pg_temp.processo('RetS')::text
    order by id desc limit 1$sql$,
  $sql$values ('00000000-0000-0000-0000-0000000000a1', pg_temp.nome('a1'), pg_temp.nome('a2'))$sql$,
  'a troca do retomar entra no histórico do processo, com quem retomou como autor');

-- ===== Trocar o responsável inicial não mexe nos processos, e o histórico da etapa guarda os nomes =====
select pg_temp.inicial('modelagem', '00000000-0000-0000-0000-0000000000a1');
insert into _tap (linha) select is(pg_temp.responsavel('RetS'), '00000000-0000-0000-0000-0000000000a2',
  'trocar o responsável inicial não muda os processos que já estão na etapa');
insert into _tap (linha) select results_eq(
  $sql$select acao, detalhes->'antes'->>'responsavel_inicial_nome', detalhes->'depois'->>'responsavel_inicial_nome'
    from public.eventos where entidade = 'etapa' and entidade_ref = pg_temp.etapa('modelagem')::text order by id desc limit 1$sql$,
  $sql$values ('editar', pg_temp.nome('a2'), pg_temp.nome('a1'))$sql$,
  'a troca entra no histórico da etapa como edição, com o nome de antes e o de depois');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

- [x] **1.2 Ajuste os testes antigos que esperam a regra velha** (critério 4: "quem move não vira responsável"; história 14):
  - `52_mover_processo.test.sql`, asserção "a passagem nova começa em A fazer, e quem moveu vira o responsável": o esperado `'00000000-0000-0000-0000-0000000000a1'` passa a `null::text`; renomeie para "…e quem moveu não vira o responsável (sem responsável inicial, fica sem)".
  - `52_mover_processo.test.sql`, asserção "o evento do movimento leva a etapa e o responsável de antes e de depois": `antes.responsavel_id` era `a2` (quem moveu antes) e `depois.responsavel_id` era `a1`; ambos viram `null::text`.
  - `53_etiqueta_e_responsavel.test.sql`, "o processo retomado continua com a etapa, a etiqueta e o responsável de antes": o responsável esperado passa de `a2` para `null::text` (a Modelagem piloto não tem responsável inicial nesse teste); renomeie para "…e fica sem responsável (a etapa não tem responsável inicial)".
  - Sem a migração ainda, essas asserções continuam como estavam (verdes na regra velha); elas só ficam vermelhas e certas na 1.4. **Não** mude outras asserções à toa: depois da migração, rode a bateria inteira e mude só as que falharem *por esta regra* (as outras falhas são problema novo: pare e investigue).

- [x] **1.3 Veja o teste novo falhar.** `npx supabase test db 2>&1 | grep -E "^(ok|not ok)|responsavel_inicial"`. Esperado: o `73_` aborta logo no primeiro uso da coluna `responsavel_inicial_id` ("column … does not exist"). Esse é o motivo certo.

- [x] **1.4 Crie a migração.** `npx supabase migration new responsavel_inicial_por_etapa`; cole o conteúdo abaixo no arquivo gerado. O corpo de `mover_processo` é o da migração `20261027120000_confirmacao_de_arquivos` com uma linha trocada (a do responsável); confira que o resto está idêntico.

```sql
-- Responsável inicial por etapa (funcionalidade 17 de processos-etapas; ADR 0036, que substitui a parte do ADR 0022 em
-- que quem move vira o responsável). Não destrutiva: só acrescenta a coluna (nula em todas as etapas) e muda quem fica
-- responsável ao mover, cadastrar e retomar. Nenhum processo que já existe muda.

alter table public.etapas add column responsavel_inicial_id uuid references public.usuarios (id);
-- A política "etapas: administrador ativo altera" já vale para a coluna nova; o privilégio de coluna é o que faltava.
-- As etapas fixas já deixam mudar esta coluna: a trava delas (bloquear_etapa_protegida) só olha nome, fase e ativa.
grant update (responsavel_inicial_id) on public.etapas to authenticated;

-- Só Administrador ou Integrante do EP ativo (a mesma conferência do responsável do processo, reaproveitada), e nunca
-- em Concluídos. Gravar nulo ou o mesmo valor passa sempre: o gatilho só confere o que muda.
create function private.conferir_responsavel_inicial() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.responsavel_inicial_id is null or new.responsavel_inicial_id is not distinct from old.responsavel_inicial_id then
    return new;
  end if;
  if new.codigo = 'concluidos' then
    raise exception 'responsavel_inicial_em_concluidos';
  end if;
  perform private.conferir_responsavel(new.responsavel_inicial_id, null);
  return new;
end $$;

create trigger conferir_responsavel_inicial before update of responsavel_inicial_id on public.etapas
  for each row execute function private.conferir_responsavel_inicial();

-- O responsável inicial válido da etapa: o id dele se é Administrador ou Integrante do EP ativo agora; senão nulo
-- (inclusive em Concluídos). Não se guarda a validade: ela se calcula a cada chegada.
create function private.responsavel_inicial_valido(p_etapa uuid) returns uuid
language sql stable set search_path = ''
as $$
  select u.id
  from public.etapas e join public.usuarios u on u.id = e.responsavel_inicial_id
  where e.id = p_etapa and e.codigo <> 'concluidos' and u.ativo and u.perfil in ('administrador', 'integrante_ep') $$;

-- Cadastro (inclusive subprocesso e "a classificar"): o processo entra em Não iniciados com o responsável inicial dela. O
-- que a tela mandar no campo é ignorado.
create function private.dar_responsavel_inicial_ao_cadastrar() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.responsavel_id := private.responsavel_inicial_valido((select id from public.etapas where codigo = 'nao_iniciados'));
  return new;
end $$;

create trigger dar_responsavel_inicial_ao_cadastrar before insert on public.processos
  for each row execute function private.dar_responsavel_inicial_ao_cadastrar();

-- Retomar: como se o processo chegasse de novo à etapa em que está. A troca, se houver, é o evento de mudança de
-- responsável que já existe (autor: quem retomou); sem troca, nada a mais é registrado.
create function private.dar_responsavel_inicial_ao_retomar(p_processo uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  inicial uuid := private.responsavel_inicial_valido(
    (select etapa_id from public.passagens where processo_id = p_processo and saiu_em is null));
begin
  update public.processos set responsavel_id = inicial where id = p_processo and responsavel_id is distinct from inicial;
end $$;

create or replace function public.retomar_processo(p_processo uuid, p_motivo text) returns void
language plpgsql set search_path = ''
as $$
begin
  perform private.mudar_situacao(p_processo, 'em_andamento', p_motivo);
  perform private.dar_responsavel_inicial_ao_retomar(p_processo);
end $$;

-- Igual à da migração 20261027120000_confirmacao_de_arquivos, com uma troca: o responsável depois do movimento é o
-- responsável inicial válido da etapa de destino (ou ninguém), no lugar de quem chama. Quem move fica só no histórico,
-- como autor do evento.
create or replace function public.mover_processo(p_processo uuid, p_etapa uuid, p_data_da_publicacao date default null,
  p_link_da_publicacao text default null, p_explicacao_sem_publicacao text default null) returns void
language plpgsql set search_path = ''
as $$
declare
  antes public.processos;
  depois public.processos;
  de public.etapas;
  para public.etapas;
  evento jsonb;
  faltas jsonb;
begin
  select * into antes from public.processos where id = p_processo;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  if not (select private.pode_alterar_cadastros()) then
    raise exception 'sem permissão para mover o processo' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(p_processo);
  para := private.etapa_de_destino(p_etapa);
  select e.* into de from public.passagens pa join public.etapas e on e.id = pa.etapa_id
  where pa.processo_id = p_processo and pa.saiu_em is null;
  if de.id = para.id then
    return;
  end if;
  faltas := private.arquivos_que_faltam_na_ida(p_processo, de, para);
  depois := antes;
  depois.responsavel_id := private.responsavel_inicial_valido(para.id);
  if para.codigo = 'concluidos' then
    depois := private.publicacao_da_chegada(depois, p_data_da_publicacao, p_link_da_publicacao, p_explicacao_sem_publicacao);
  elsif de.codigo = 'concluidos' then
    depois.explicacao_sem_publicacao := null;
  end if;
  evento := private.evento_do_movimento(antes, depois, de, para);
  if faltas is not null then
    evento := jsonb_set(evento, '{depois,sem_arquivos}', faltas);
  end if;
  perform set_config('ep.movendo_processo', 'mover', true);
  perform private.trocar_passagem(p_processo, para, evento);
  perform private.gravar_processo_movido(depois);
  perform set_config('ep.movendo_processo', '', true);
end $$;

-- O evento da etapa passa a levar o responsável inicial (id e nome); a troca dele é uma edição da etapa. Lê o nome em
-- usuarios, por isso deixa de ser "immutable".
create or replace function private.estado_da_etapa(etapa public.etapas) returns jsonb
language sql stable set search_path = ''
as $$ select jsonb_build_object('codigo', etapa.codigo, 'nome', etapa.nome, 'ativa', etapa.ativa, 'ordem', etapa.ordem,
  'fase', etapa.fase, 'responsavel_inicial_id', etapa.responsavel_inicial_id,
  'responsavel_inicial_nome', (select nome from public.usuarios where id = etapa.responsavel_inicial_id)) $$;

revoke execute on function private.responsavel_inicial_valido(uuid), private.dar_responsavel_inicial_ao_retomar(uuid)
  from public, anon;
grant execute on function private.responsavel_inicial_valido(uuid), private.dar_responsavel_inicial_ao_retomar(uuid)
  to authenticated;
revoke execute on function private.conferir_responsavel_inicial(), private.dar_responsavel_inicial_ao_cadastrar()
  from public, anon, authenticated;
```

- [x] **1.5 Aplique no banco local e rode a bateria.** `npx supabase db reset`, depois `npx supabase test db 2>&1 | grep -E "^(ok|not ok)|RESULTADO"`. Esperado: as 34 do `73_` com `ok`; nenhum `not ok` novo. Para cada `not ok` fora do `73_`: leia a asserção; se ela espera "quem move/retomar vira ou mantém o responsável", ajuste à regra nova como na 1.2 (nada além disso). Se o `73_` falhar na mudança direta de perfil do usuário `a6` (o banco pode recusar `update public.usuarios set perfil`), troque essa linha pela função de perfil que o `05_gerir_usuarios.test.sql` usa, sem mudar o que o teste prova.
- [x] **1.6 Confira os testes que olham funções e permissões** (`00_rls_ligada`, `10_privilegios_padrao`, `46_funcoes_e_views_seguras`, `47_login_so_com_o_necessario`): precisam estar verdes com as funções novas (sem `security definer`, `search_path` vazio, sem execução para `anon`).
- [x] **1.7 Gere os tipos do banco local:** `node scripts/gerar-tipos.mjs --local` (grava `src/types/database.ts`). Confira com `git diff --stat src/types/database.ts` que só entrou `responsavel_inicial_id` em `etapas` (as três formas: Row, Insert, Update) e a relação; qualquer outra mudança grande é sinal de banco local fora de dia: pare.
- [x] **1.8 Se a trava das fixas já deixava a coluna passar** (era o que se esperava ao ler o gatilho, ao contrário do que a spec supunha), acrescente a entrada datada em `.scratch/processos-etapas/desvios.md`: "2026-10-30: a spec dizia que a trava das etapas fixas passaria a liberar a coluna; a trava só olha nome, fase e ativa, então a coluna nova já passava e o único ajuste foi o privilégio de coluna." Só se for o caso.
- [x] **1.9 Commit:** `git add supabase src/types/database.ts && git commit -m "banco: responsável inicial por etapa (coluna, regra no mover, cadastro e retomar, evento da etapa)"`. Rodar o pre-commit; se bloquear, corrija a causa.

## Tarefa 2: Tipos, regra pura, catálogo real e falso

**Produz:** em `src/processos/tipos.ts`:

```ts
/** O responsável inicial como a lista do catálogo o traz: o usuário e o que decide se ainda vale. */
export type ResponsavelInicialDaEtapa = { id: string; nome: string; fotoUrl: string | null; ativo: boolean; perfil: Perfil }
// EtapaNoCatalogo = EtapaDoCatalogo & { fase: FaseDoRegimento | null; responsavelInicial?: ResponsavelInicialDaEtapa | null }
// (ausente ou null = ninguém; opcional para não mexer em cada fixture de teste)
// ModuloDoCatalogo: definirResponsavelInicial(id: string, usuarioId: string | null): Promise<void>
```

e em `src/processos/responsavelInicial.ts`:

```ts
export type SituacaoDoResponsavelInicial = 'valido' | 'inativo' | 'sem_permissao'
export function situacaoDoResponsavelInicial(responsavel: ResponsavelInicialDaEtapa): SituacaoDoResponsavelInicial
export function responsavelInicialValido(etapa: Pick<EtapaNoCatalogo, 'codigo' | 'responsavelInicial'>): ResponsavelInicialDaEtapa | null
```

- [x] **2.1 Teste da regra pura** (`src/processos/responsavelInicial.test.ts`, escreva antes, veja falhar por módulo inexistente):

```ts
import { describe, expect, test } from 'vitest'
import { responsavelInicialValido, situacaoDoResponsavelInicial } from './responsavelInicial'
import type { ResponsavelInicialDaEtapa } from './tipos'

const ANA: ResponsavelInicialDaEtapa = { id: 'u1', nome: 'Ana Teste', fotoUrl: null, ativo: true, perfil: 'integrante_ep' }

describe('situação do responsável inicial', () => {
  test('Administrador ou Integrante ativo vale', () => {
    expect(situacaoDoResponsavelInicial(ANA)).toBe('valido')
    expect(situacaoDoResponsavelInicial({ ...ANA, perfil: 'administrador' })).toBe('valido')
  })
  test('inativo vale como inativo, mesmo que o perfil também tenha mudado', () => {
    expect(situacaoDoResponsavelInicial({ ...ANA, ativo: false })).toBe('inativo')
    expect(situacaoDoResponsavelInicial({ ...ANA, ativo: false, perfil: 'consulta' })).toBe('inativo')
  })
  test('ativo mas Consulta é "sem permissão"', () => {
    expect(situacaoDoResponsavelInicial({ ...ANA, perfil: 'consulta' })).toBe('sem_permissao')
  })
})

describe('responsável inicial válido da etapa', () => {
  test('devolve o responsável quando ele vale', () => {
    expect(responsavelInicialValido({ codigo: 'modelagem', responsavelInicial: ANA })).toBe(ANA)
  })
  test('ninguém quando não há, quando é inválido e sempre em Concluídos', () => {
    expect(responsavelInicialValido({ codigo: 'modelagem' })).toBeNull()
    expect(responsavelInicialValido({ codigo: 'modelagem', responsavelInicial: null })).toBeNull()
    expect(responsavelInicialValido({ codigo: 'modelagem', responsavelInicial: { ...ANA, ativo: false } })).toBeNull()
    expect(responsavelInicialValido({ codigo: 'modelagem', responsavelInicial: { ...ANA, perfil: 'consulta' } })).toBeNull()
    expect(responsavelInicialValido({ codigo: 'concluidos', responsavelInicial: ANA })).toBeNull()
  })
})
```

- [x] **2.2 Implemente** `src/processos/responsavelInicial.ts` (importe `CODIGO_CONCLUIDOS` de `./codigosDasEtapas`) e os tipos acima em `tipos.ts` (importe `Perfil` de `'../acesso/tipos'`):

```ts
import { CODIGO_CONCLUIDOS } from './codigosDasEtapas'
import type { EtapaNoCatalogo, ResponsavelInicialDaEtapa } from './tipos'

export type SituacaoDoResponsavelInicial = 'valido' | 'inativo' | 'sem_permissao'

/** Como o banco decide: ativo e Administrador ou Integrante do EP. Inativo vem primeiro, para a marca dizer o motivo mais forte. */
export function situacaoDoResponsavelInicial({ ativo, perfil }: ResponsavelInicialDaEtapa): SituacaoDoResponsavelInicial {
  if (!ativo) return 'inativo'
  return perfil === 'administrador' || perfil === 'integrante_ep' ? 'valido' : 'sem_permissao'
}

/** Como responsavel_inicial_valido do banco: quem chega à etapa fica com ele se ainda vale; Concluídos nunca tem. */
export function responsavelInicialValido({ codigo, responsavelInicial }: Pick<EtapaNoCatalogo, 'codigo' | 'responsavelInicial'>): ResponsavelInicialDaEtapa | null {
  if (codigo === CODIGO_CONCLUIDOS || !responsavelInicial) return null
  return situacaoDoResponsavelInicial(responsavelInicial) === 'valido' ? responsavelInicial : null
}
```

  Rode `npx vitest run src/processos/responsavelInicial.test.ts`: verde.

- [x] **2.3 Teste do catálogo real (falha primeiro).** Em `src/processos/catalogoSupabase.test.ts`: (a) mude o esperado de `listarCatalogo` para a coluna nova e a forma convertida (o falso devolve `responsavel_inicial` como objeto ou `null`):

```ts
const MODELAGEM = { id: 'e4', codigo: 'modelagem', nome: 'Reunião de modelagem', ordem: 4, fase: 'IV' as const, ativa: true }
const COM_RESPONSAVEL = { ...MODELAGEM, responsavel_inicial: { id: 'u1', nome: 'Ana Teste', foto_url: null, ativo: true, perfil: 'integrante_ep' as const } }

test('lista o catálogo inteiro em ordem, com o responsável inicial de cada etapa', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.select'] = { data: [{ ...MODELAGEM, responsavel_inicial: null }, COM_RESPONSAVEL], error: null }
  expect(await criar(cliente).listarCatalogo()).toEqual([
    { ...MODELAGEM, responsavelInicial: null },
    { ...MODELAGEM, responsavelInicial: { id: 'u1', nome: 'Ana Teste', fotoUrl: null, ativo: true, perfil: 'integrante_ep' } },
  ])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'etapas', ordem: [['ordem', true]],
    colunas: 'id, codigo, nome, ordem, fase, ativa, responsavel_inicial:usuarios!responsavel_inicial_id(id, nome, foto_url, ativo, perfil)',
  })
})

test('definir o responsável inicial grava só essa coluna, e Ninguém grava nulo', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.update'] = { data: [{ id: 'e4' }], error: null }
  await criar(cliente).definirResponsavelInicial('e4', 'u1')
  await criar(cliente).definirResponsavelInicial('e4', null)
  expect(cliente.pedidos).toMatchObject([
    { operacao: 'update', valores: { responsavel_inicial_id: 'u1' }, filtro: ['id', 'e4'] },
    { operacao: 'update', valores: { responsavel_inicial_id: null }, filtro: ['id', 'e4'] },
  ])
})

test('a recusa do banco chega com o nome recusado, e a de Concluídos com a frase própria', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['etapas.update'] = { data: null, error: { code: 'P0001', message: 'responsavel_invalido:Bia Teste' } }
  await expect(criar(cliente).definirResponsavelInicial('e4', 'u9')).rejects.toEqual(
    new TravaDoBanco('Bia Teste não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.'))
  cliente.respostas['etapas.update'] = { data: null, error: { code: 'P0001', message: 'responsavel_inicial_em_concluidos' } }
  await expect(criar(cliente).definirResponsavelInicial('e9', 'u1')).rejects.toEqual(new TravaDoBanco(FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS))
})
```

  (importe `FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS` de `./frasesDoCatalogo`; o teste existente "editar, desativar…" que usa `MODELAGEM` e o `colunas` antigo não muda além do que está acima). Rode: falha por `definirResponsavelInicial` inexistente e pelo `colunas`.

- [x] **2.4 Implemente o catálogo real.** Em `frasesDoCatalogo.ts` acrescente `export const FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS = 'Concluídos não tem responsável inicial: o processo concluído não tem mais quem cuide dele.'`. Em `recusasDoBanco.ts` acrescente `responsavel_inicial_em_concluidos` ao padrão (junto de `responsavel_invalido`, **antes** dele na lista para a alternância não casar o prefixo errado: o `\b…(?::(.*))?$` já exige o fim, então a ordem só importa por clareza) e `responsavel_inicial_em_concluidos: () => FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS` em `FRASE_DA_RECUSA` (importe a constante). Em `catalogoSupabase.ts`:

```ts
const COLUNAS_DA_ETAPA = 'id, codigo, nome, ordem, fase, ativa, responsavel_inicial:usuarios!responsavel_inicial_id(id, nome, foto_url, ativo, perfil)'
// ...
    definirResponsavelInicial: (id, usuarioId) => mudar(id, { responsavel_inicial_id: usuarioId }),
// ...
async function listarCatalogo(cliente: ClienteSupabase): Promise<EtapaNoCatalogo[]> {
  const { data, error } = await cliente.from('etapas').select(COLUNAS_DA_ETAPA).order('ordem')
  if (error) throw new Error(`Falha ao ler o catálogo de etapas: ${error.message}`)
  return data.map(({ responsavel_inicial: inicial, ...etapa }) => ({
    ...etapa,
    responsavelInicial: inicial && { id: inicial.id, nome: inicial.nome, fotoUrl: inicial.foto_url, ativo: inicial.ativo, perfil: inicial.perfil },
  }))
}
```

  Acrescente `definirResponsavelInicial` ao tipo `ModuloDoCatalogo` (com a doc: "Só o Administrador (a RLS decide); o banco recusa usuário que não seja Administrador ou Integrante ativo e qualquer valor em Concluídos"). Rode `npx vitest run src/processos/catalogoSupabase.test.ts` (verde) e `npm run typecheck` (se o supabase-js não tipar o `usuarios!responsavel_inicial_id`, troque a dica pelo nome da chave estrangeira que aparece em `src/types/database.ts`, por exemplo `usuarios!etapas_responsavel_inicial_id_fkey`, e ajuste a constante e o teste).

- [x] **2.5 Teste do catálogo falso (falha primeiro).** Em `src/processos/CatalogoFalso.test.ts` acrescente (usando `montar()` e as etapas já definidas; `falso.usuariosPossiveis` é a lista dos que podem ser responsáveis):

```ts
describe('responsável inicial', () => {
  const ANA = { id: 'u1', nome: 'Ana Teste', fotoUrl: null }

  test('grava a escolha na etapa, inclusive em Não iniciados, e Ninguém a limpa', async () => {
    const falso = montar()
    falso.usuariosPossiveis = [ANA]
    await falso.catalogo.definirResponsavelInicial('e1', 'u1')
    await falso.catalogo.definirResponsavelInicial('e2', 'u1')
    const lida = await falso.catalogo.listarCatalogo()
    expect(lida.find((etapa) => etapa.id === 'e1')?.responsavelInicial).toEqual({ id: 'u1', nome: 'Ana Teste', fotoUrl: null, ativo: true, perfil: 'integrante_ep' })
    await falso.catalogo.definirResponsavelInicial('e2', null)
    expect((await falso.catalogo.listarCatalogo()).find((etapa) => etapa.id === 'e2')?.responsavelInicial).toBeNull()
  })

  test('recusa quem não pode ser responsável, com o nome recebido, e qualquer valor em Concluídos', async () => {
    const falso = montar()
    falso.usuariosPossiveis = [ANA]
    expect(await falhaDe(falso.catalogo.definirResponsavelInicial('e2', 'u9'))).toEqual(
      new TravaDoBanco('u9 não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.'))
    expect(await falhaDe(falso.catalogo.definirResponsavelInicial('e5', 'u1'))).toEqual(new TravaDoBanco(FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS))
  })

  test('trocar o responsável inicial não muda os processos que já estão na etapa', async () => {
    const falso = montar()
    falso.usuariosPossiveis = [ANA]
    const antes = falso.processos.map((processo) => processo.responsavel)
    await falso.catalogo.definirResponsavelInicial('e2', 'u1')
    expect(falso.processos.map((processo) => processo.responsavel)).toEqual(antes)
  })
})
```

  (importe `FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS`). Rode: falha por método inexistente.

- [x] **2.6 Implemente no `CatalogoFalso`.** O falso não conhece o perfil de quem está em `usuariosPossiveis` (todos são Administrador ou Integrante ativos por definição), então guarda `perfil: 'integrante_ep'`:

```ts
  async definirResponsavelInicial(id: string, usuarioId: string | null): Promise<void> {
    this.conferirGravacao()
    const etapa = this.acharEtapa(id)
    const usuario = this.dono.usuariosPossiveis.find((possivel) => possivel.id === usuarioId)
    if (usuarioId !== null && etapa.codigo === CODIGO_CONCLUIDOS) throw new TravaDoBanco(FRASE_DO_RESPONSAVEL_EM_CONCLUIDOS)
    if (usuarioId !== null && !usuario) {
      throw new TravaDoBanco(`${usuarioId} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.`)
    }
    const responsavelInicial = usuario ? { id: usuario.id, nome: usuario.nome, fotoUrl: usuario.fotoUrl ?? null, ativo: true, perfil: 'integrante_ep' as const } : null
    this.etapas = this.etapas.map((outra) => (outra.id === id ? { ...outra, responsavelInicial } : outra))
  }
```

  e o `DonoDoCatalogo` ganha `usuariosPossiveis: UsuarioResponsavel[]` (o `ProcessosFalso` já o tem). Atenção: `gravar()` do falso refaz `etapasDoCatalogo` só com `{id, codigo, nome, ordem, ativa}`; `etapas` guarda o responsável, e `editarEtapa` já espalha `...outra`, então o responsável sobrevive às outras gravações. Rode `npx vitest run src/processos`: verde.

- [x] **2.7** `npm run typecheck` e `npm run lint`: limpos. Commit: `git add src && git commit -m "catálogo: leitura e gravação do responsável inicial, regra pura e falso"`.

## Tarefa 3: Mover, cadastrar e retomar nos falsos

**Consome:** `responsavelInicialValido` (tarefa 2) e `CatalogoFalso.etapas`. **Produz:** `ProcessosFalso` que segue a regra do banco; `src/testes/responsavelInicialDeTeste.ts` com `comResponsavelInicial(falso, codigo, responsavel)`.

- [x] **3.1 Atalho de teste** `src/testes/responsavelInicialDeTeste.ts`:

```ts
import type { ProcessosFalso } from '../processos/ProcessosFalso'
import type { ResponsavelInicialDaEtapa } from '../processos/tipos'

/** Dá a uma etapa o responsável inicial, como o Administrador faria no Catálogo; parte das etapas do Quadro quando o catálogo do falso ainda está vazio. */
export function comResponsavelInicial(falso: ProcessosFalso, codigo: string, responsavel: ResponsavelInicialDaEtapa | null): void {
  const base = falso.catalogo.etapas.length > 0 ? falso.catalogo.etapas : falso.etapasDoCatalogo.map((etapa) => ({ ...etapa, fase: null }))
  falso.catalogo.etapas = base.map((etapa) => (etapa.codigo === codigo ? { ...etapa, responsavelInicial: responsavel } : etapa))
}
```

- [x] **3.2 Reescreva os testes do falso (falham primeiro).** Em `src/processos/ProcessosFalso.mover.test.ts`: tire `modulo.quemChama = BIA` de `falso()`; use `comResponsavelInicial(modulo, 'aprovacao_setor', { ...BIA, fotoUrl: null, ativo: true, perfil: 'integrante_ep' })` onde o teste precisa de responsável inicial. Troque/acrescente (histórias 9 a 14, 16; critérios 4, 5, 6, 7):

```ts
const INICIAL_BIA = { id: 'u2', nome: 'Bia Teste', fotoUrl: null, ativo: true, perfil: 'integrante_ep' as const }

describe('cadastro', () => {
  test('entra em Não iniciados com o responsável inicial dela, ou sem responsável', async () => {
    const modulo = falso()
    expect((await lido(modulo, await modulo.criarProcesso(DADOS))).responsavel).toBeNull()
    comResponsavelInicial(modulo, 'nao_iniciados', INICIAL_BIA)
    expect((await lido(modulo, await modulo.criarProcesso({ ...DADOS, nome: 'Outro' }))).responsavel).toMatchObject({ id: 'u2', nome: 'Bia Teste' })
  })
})

describe('mover e o responsável inicial', () => {
  test('o processo chega com o responsável inicial do destino, não com quem moveu', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', etiqueta: 'concluido', responsavel: { ...ANA, fotoUrl: null } }))
    comResponsavelInicial(modulo, 'aprovacao_setor', INICIAL_BIA)
    await modulo.moverProcesso('p1', idDa('aprovacao_setor'))
    expect(await lido(modulo)).toMatchObject({ etapaAtual: { codigo: 'aprovacao_setor' }, etiqueta: 'a_fazer', responsavel: { id: 'u2' } })
  })

  test('etapa sem responsável inicial deixa o processo sem responsável', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', responsavel: { ...ANA, fotoUrl: null } }))
    await modulo.moverProcesso('p1', idDa('aprovacao_setor'))
    expect((await lido(modulo)).responsavel).toBeNull()
  })

  test('responsável inicial inativo ou em Consulta não impede o movimento: o processo fica sem responsável', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', responsavel: { ...ANA, fotoUrl: null } }))
    comResponsavelInicial(modulo, 'aprovacao_setor', { ...INICIAL_BIA, ativo: false })
    await modulo.moverProcesso('p1', idDa('aprovacao_setor'))
    expect((await lido(modulo)).responsavel).toBeNull()
    comResponsavelInicial(modulo, 'publicacao', { ...INICIAL_BIA, perfil: 'consulta' })
    await modulo.moverProcesso('p1', idDa('publicacao'))
    expect((await lido(modulo)).responsavel).toBeNull()
  })

  test('Concluídos deixa sem responsável', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', responsavel: { ...ANA, fotoUrl: null } }))
    await modulo.moverProcesso('p1', idDa('concluidos'), { dataDaPublicacao: null, linkDaPublicacao: null, explicacao: 'Sem publicação' })
    expect((await lido(modulo)).responsavel).toBeNull()
  })

  test('mover para a própria etapa não muda nada, nem o responsável', async () => {
    const modulo = falso(umProcessoLido('Emitir Ofício', { id: 'p1', responsavel: { ...ANA, fotoUrl: null } }))
    comResponsavelInicial(modulo, 'revisao_interna', INICIAL_BIA)
    await modulo.moverProcesso('p1', idDa('revisao_interna'))
    expect((await lido(modulo)).responsavel).toMatchObject({ id: 'u1' })
  })
})
```

  (importe `comResponsavelInicial`; ajuste os testes existentes que esperavam `{ id: 'u2', nome: 'Bia Teste' }` por "quem moveu": o primeiro de `describe('mover')` vira o primeiro caso acima.) Em `ProcessosFalso.situacao.test.ts`, acrescente: retomar suspenso e cancelado põe o responsável inicial da etapa atual (ou ninguém), e retomar quando o responsável já é o inicial não muda nada. Rode `npx vitest run src/processos`: falha (o falso ainda usa `quemChama`).

- [x] **3.3 Implemente em `ProcessosFalso.ts`:** apague o campo `quemChama` e sua doc; em `movido(...)` troque `this.comResponsavel(processo, this.quemChama)` por `this.comResponsavel(processo, this.responsavelInicialDe(destino))`; em `processoNovo` calcule `const inicial = entrada ? this.responsavelInicialDe(entrada) : null` e troque `responsavel: null` por `responsavel: inicial && { id: inicial.id, nome: inicial.nome, fotoUrl: inicial.fotoUrl }`; em `mudarSituacaoDoProcesso`, quando `nova === 'em_andamento'`, aplique depois do `mudarSituacao` o responsável inicial da etapa atual. Acrescente:

```ts
  // Como responsavel_inicial_valido: o responsável inicial da etapa, se ainda vale; ninguém em Concluídos. A etapa vem do catálogo do falso, e sem ela ninguém.
  private responsavelInicialDe(etapa: EtapaDoCatalogo): UsuarioResponsavel | null {
    const inicial = responsavelInicialValido({ codigo: etapa.codigo, responsavelInicial: this.catalogo.etapas.find((outra) => outra.id === etapa.id)?.responsavelInicial })
    return inicial && { id: inicial.id, nome: inicial.nome, fotoUrl: inicial.fotoUrl }
  }
```

  e, em `mudarSituacaoDoProcesso`, depois de `mudarSituacao(...)`: `const retomado = nova === 'em_andamento' ? this.comResponsavelNaChegada(mudado) : mudado`, onde `comResponsavelNaChegada` acha a etapa atual do processo em `etapasDoCatalogo` por `codigo` e devolve `{ ...processo, ...this.comResponsavel(processo, this.responsavelInicialDe(etapa)) }` (processo sem etapa atual: devolve como está). Tire `quemChama` também de `src/testes/aprovacaoNoVerso.tsx`, `processoNoVerso.tsx` e `quadroDeTeste.tsx` (a linha `falso.quemChama = …`; remova o import de `USUARIO_DE_TESTE` só se ficar sem uso). Rode `npx vitest run src/processos`: verde.

- [x] **3.4 Rode a suíte inteira** (`npm test`) e conserte, **uma falha por vez**, os testes de tela que esperavam "quem move vira o responsável" (os arquivos que usam `moverProcesso`, `Só os meus` e `Agrupar por`: `App.agruparPorResponsavel`, `App.soOsMeus`, `App.arrastarParaMover` e vizinhos). Regra: onde o teste dependia de quem moveu virar responsável, dê o responsável inicial à etapa de destino com `comResponsavelInicial` (importe de `./testes/responsavelInicialDeTeste`) e deixe a expectativa como estava; onde dependia de o cartão sair da coluna "meus", a expectativa muda para a do responsável inicial ou "Sem responsável". Não enfraqueça nenhuma expectativa para passar (nenhum `toBeTruthy` no lugar de valor). Acrescente em `App.arrastarParaMover.test.tsx` dois testes (histórias 18 e 19; critério 4):
  1. "arrastar o cartão para a coluna de destino o deixa com o responsável inicial dela": `comResponsavelInicial(falso, 'publicacao', { id: 'u2', nome: 'Bia Teste', fotoUrl: null, ativo: true, perfil: 'integrante_ep' })`, solta em Publicação, e o cartão passa a mostrar o responsável Bia (use o mesmo seletor que os testes vizinhos usam para o responsável do cartão; se a coluna de destino não tem etapa com responsável, o cartão fica sem).
  2. "agrupado por responsável, o processo movido sai da coluna de quem o tinha e vai para a do responsável inicial (ou para Sem responsável)": com `#/processos?agrupar=responsavel`, copie o teste vizinho que prova o agrupamento depois de um movimento. Como "agrupado por responsável nada se arrasta" (teste existente acima), o movimento nesse caso vem do verso (lista de etapas do Agora): siga o teste de `App.agruparPorResponsavel.test.tsx` que já move pelo verso, se existir, e confira a coluna depois de fechar o verso.

- [x] **3.5** `npm run typecheck`, `npm run lint`, `npm test` verdes. Commit: `git add src && git commit -m "processos falso: mover, cadastrar e retomar seguem o responsável inicial; sai quemChama"`.

## Tarefa 4: Tela do Catálogo

**Consome:** `ModuloDoCatalogo.definirResponsavelInicial`, `situacaoDoResponsavelInicial`, `listarResponsaveisPossiveis()` de `ModuloDeProcessos`. **Produz:** coluna **Responsável inicial** entre Fase e Situação (histórias 1 a 6, 21; critérios 1, 3, 5, 11).

- [x] **4.1 Helper de teste (aplique junto do 4.4).** Em `src/testes/catalogoDeTeste.tsx`, `linhasDoCatalogo` passa a juntar o texto das células **menos a terceira** (a do responsável inicial: o texto das opções do `<select>` entraria no `textContent` e quebraria os testes de ordem): `linhas.slice(1).map((linha) => [...linha.querySelectorAll('td')].filter((_, posicao) => posicao !== 2).map((celula) => celula.textContent ?? '').join(''))`. Antes de a coluna existir (4.4), a terceira célula seria a Situação, por isso a troca só entra com a coluna. Ao fim do 4.4 os testes existentes de `App.catalogo*` precisam voltar a passar.

- [x] **4.2 Escreva `src/App.responsavelInicial.test.tsx` (falha primeiro):** monte com `montarComCatalogo({ ajustar })` (arquivo `src/testes/catalogoDeTeste.tsx`); dentro de `ajustar`, `processos.usuariosPossiveis = [ANA, BIA]` e, quando preciso, `processos.catalogo.etapas = ETAPAS_DE_TESTE.map(...)` com `responsavelInicial`. Casos (cada um prova um comportamento visível; nomes das caixas: `Responsável inicial de <nome da etapa>`):
  1. a coluna "Responsável inicial" existe; toda etapa menos Concluídos tem a caixa (inclusive Não iniciados e a desativada); Concluídos mostra "—" e nenhuma caixa; as opções são "Ninguém", Ana e Bia, em ordem de nome (história 1, 2, 4, 5).
  2. escolher Ana em Modelagem piloto grava e, relida a lista, a caixa mostra Ana (critério 1); escolher "Ninguém" limpa (história 3).
  3. responsável inativo: a caixa mostra "Fulano Teste (inativo)" e há o aviso "Responsável inicial inativo: escolha outro ou Ninguém."; para o de perfil Consulta, "Fulano Teste (sem permissão)" e "Responsável inicial sem permissão: escolha outro ou Ninguém."; o nome inválido não é opção selecionável nova (a opção dele está desabilitada) (história 6; critério 5, e o aviso tem texto, não só cor).
  4. a gravação recusada mostra o motivo em alerta e a caixa volta ao valor anterior (`processos.catalogo.falhaDeGravacao = new TravaDoBanco('Bia Teste não pode ser responsável: …')`) (critério 3).
  5. falha ao ler os usuários (`processos.listarResponsaveisPossiveis = async () => { throw new Error('x') }`): aparece "Não foi possível carregar os usuários." com **Tentar de novo**, e a caixa de cada etapa mostra só o valor atual e "Ninguém"; Tentar de novo recarrega as opções.
  6. o Integrante e a Consulta não veem a Administração (reaproveite o padrão dos testes vizinhos de `App.catalogoDeEtapas.test.tsx`; história 21).

- [x] **4.3 O componente da caixa** `src/components/administracao/CampoDoResponsavelInicial.tsx`:

```tsx
import { BotaoDaCaixa, OpcaoDaCaixa } from '../OpcaoDaCaixa'
import { CODIGO_CONCLUIDOS } from '../../processos/codigosDasEtapas'
import { pessoaDaOpcao } from '../../processos/pessoaDaOpcao'
import { situacaoDoResponsavelInicial } from '../../processos/responsavelInicial'
import type { EtapaNoCatalogo, ResponsavelInicialDaEtapa, UsuarioResponsavel } from '../../processos/tipos'

type CampoDoResponsavelInicialProps = {
  etapa: EtapaNoCatalogo
  /** Quem pode ser escolhido agora (ativos, Administrador ou Integrante), em ordem de nome. */
  usuarios: UsuarioResponsavel[]
  aoEscolher: (etapa: EtapaNoCatalogo, usuarioId: string | null) => void
}

const MARCA: Record<'inativo' | 'sem_permissao', string> = { inativo: '(inativo)', sem_permissao: '(sem permissão)' }
const AVISO: Record<'inativo' | 'sem_permissao', string> = {
  inativo: 'Responsável inicial inativo: escolha outro ou Ninguém.',
  sem_permissao: 'Responsável inicial sem permissão: escolha outro ou Ninguém.',
}

// O valor vem sempre da etapa lida: a gravação que falha deixa a caixa como estava. O nome inválido continua visível,
// marcado e desabilitado, e não aparece entre as opções novas.
export function CampoDoResponsavelInicial({ etapa, usuarios, aoEscolher }: CampoDoResponsavelInicialProps) {
  if (etapa.codigo === CODIGO_CONCLUIDOS) return <>—</>
  const atual = etapa.responsavelInicial ?? null
  const situacao = atual ? situacaoDoResponsavelInicial(atual) : 'valido'
  return (
    <>
      <select className="seletor-perfil" aria-label={`Responsável inicial de ${etapa.nome}`} value={atual?.id ?? ''}
        onChange={(mudanca) => aoEscolher(etapa, mudanca.target.value === '' ? null : mudanca.target.value)}>
        <BotaoDaCaixa />
        <OpcaoDaCaixa valor="" rotulo="Ninguém" />
        {atual && !usuarios.some((usuario) => usuario.id === atual.id) && <OpcaoDoAtual atual={atual} situacao={situacao} />}
        {usuarios.map((usuario) => <OpcaoDaCaixa key={usuario.id} valor={usuario.id} rotulo={usuario.nome} pessoa={pessoaDaOpcao(usuario)} />)}
      </select>
      {situacao !== 'valido' && <p className="administracao-aviso">{AVISO[situacao]}</p>}
    </>
  )
}

function OpcaoDoAtual({ atual, situacao }: { atual: ResponsavelInicialDaEtapa; situacao: ReturnType<typeof situacaoDoResponsavelInicial> }) {
  const marcado = situacao !== 'valido'
  return <OpcaoDaCaixa valor={atual.id} rotulo={marcado ? `${atual.nome} ${MARCA[situacao]}` : atual.nome} pessoa={pessoaDaOpcao(atual)} desabilitada={marcado} />
}
```

  Se o `administracao-aviso` não existir em `Administracao.css`, acrescente a regra (texto menor, cor de aviso discreto do tema já usado nas outras mensagens da Administração; **nunca só cor**: o texto já diz o problema) em vez de inventar uma classe de outro arquivo; confira o nome da cor no arquivo.

- [x] **4.4 Ligue a coluna.** `TabelaDoCatalogo.tsx`: `AcoesDoCatalogo` ganha `aoEscolherResponsavel: (etapa: EtapaNoCatalogo, usuarioId: string | null) => void`; a tabela recebe `usuarios: UsuarioResponsavel[]`; cabeçalho `<th scope="col">Responsável inicial</th>` entre Fase e Situação; célula `<td><CampoDoResponsavelInicial etapa={etapa} usuarios={usuarios} aoEscolher={acoes.aoEscolherResponsavel} /></td>`. `CatalogoEditavel.tsx`: recebe `usuarios` e passa `aoEscolherResponsavel: (etapa, usuarioId) => executar(() => catalogo.definirResponsavelInicial(etapa.id, usuarioId), aoMudar)` (a falha aparece no parágrafo `cadastros-falha` que o componente já tem, no padrão das recusas do catálogo). `CatalogoDeEtapas.tsx`: nova prop `responsaveis: Pick<ModuloDeProcessos, 'listarResponsaveisPossiveis'>` (o módulo inteiro de processos, de identidade estável); lê com `useCarregamento(useCallback(() => responsaveis.listarResponsaveisPossiveis(), [responsaveis]))`; com erro, mostra acima da tabela `<p className="cadastros-falha" role="alert">Não foi possível carregar os usuários. <button type="button" className="botao botao-secundario" onClick={tentarDeNovo}>Tentar de novo</button></p>` e passa `usuarios=[]`; senão passa a lista. `AreaDeAdministracao.tsx` linha 45: `<CatalogoDeEtapas catalogo={processos.catalogo} responsaveis={processos} />`. Ajuste `linhasDoCatalogo` (4.1) junto. Rode `npx vitest run src/App.catalogo src/App.responsavelInicial`: verde. Corrija os testes de `App.catalogo*` que esperavam o cabeçalho antigo (lista de colunas) para incluir "Responsável inicial".

- [x] **4.5 Conferência visual (critério 11).** Suba o app pelo `preview_start` (veja `.claude/launch.json`; não use Bash para o servidor), entre como Administrador na vitrine local, abra Administração > Catálogo de etapas em 1366×768 (`resize_window` 1366×768): a coluna cabe sem rolagem lateral, a foto e o nome na caixa se alinham como na escolha de responsável do verso, o aviso de inválido (monte um caso com o falso da vitrine, se houver; senão, só confira a caixa) tem texto legível. `read_console_messages` sem erros. Registre o que viu em uma linha no commit.

- [x] **4.6** `npm run typecheck`, `npm run lint`, `npm test`, `npm run check:circular` verdes. Commit: `git add src && git commit -m "catálogo de etapas: coluna do responsável inicial"`.

## Tarefa 5: Histórico do catálogo

**Produz:** o histórico mostra "Responsável inicial: {antes} → {depois}", com "Ninguém" para o vazio (história 7; critério 9).

- [x] **5.1 Teste (falha primeiro).** Em `src/cadastros/historicoDoCatalogo.test.ts` acrescente:

```ts
test('o responsável inicial aparece pelo nome, "Ninguém" para o vazio, e o id fica escondido', () => {
  const antes = { ...ETAPA, responsavel_inicial_id: null, responsavel_inicial_nome: null }
  const depois = { ...ETAPA, responsavel_inicial_id: 'u1', responsavel_inicial_nome: 'Ana Teste' }
  expect(descreverEstadoDoCadastro(antes)).toContain('Responsável inicial: Ninguém')
  expect(descreverEstadoDoCadastro(depois)).toContain('Responsável inicial: Ana Teste')
  expect(descreverEstadoDoCadastro(depois)).not.toContain('u1')
})
```

- [x] **5.2 Implemente** em `src/cadastros/historicoDosCadastros.ts`: `responsavel_inicial_nome: 'Responsável inicial'` em `ROTULO_DO_CAMPO`; `'responsavel_inicial_id'` em `CAMPOS_ESCONDIDOS`; em `valorLegivel`, antes de `valorPorRotulo`: `if (campo === 'responsavel_inicial_nome') return valor === null ? 'Ninguém' : texto(valor)`. Rode o teste: verde. Confira (já coberto pelo pgTAP) que a ação da troca é `editar`, cujo texto no histórico já existe.
- [x] **5.3** Verdes: `npm run typecheck`, `npm run lint`, `npm test`. Commit: `git add src && git commit -m "histórico do catálogo: responsável inicial"`.

## Tarefa 6: Fecho

- [ ] **6.1 Bateria completa:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:coverage` (cobertura ≥ 70%), `npm run check:circular`, e `npx supabase test db` local (todas as linhas `ok`).
- [ ] **6.2 Verifique os critérios de pronto 1 a 11** da seção da spec, um por um, apontando o teste que o prova (banco: `73_`; tela: `App.responsavelInicial`, `App.arrastarParaMover`, `ProcessosFalso.*`). O critério 8, segunda metade ("os processos que já existiam mantêm o responsável depois da migração"), é garantido porque a migração só acrescenta a coluna nula e nenhum `update` em `processos`: confirme relendo a migração. Critério 10 (assumir e troca manual como antes): `pg_temp.assumir` no `73_` e os testes existentes do verso. Critério 11: passo 4.5.
- [ ] **6.3 Push e conferência de banco no GitHub** (autorizado pelo projeto): `git push -u origin responsavel-inicial-por-etapa` (sem `--force`); dispare o workflow "Testes de banco" na branch (`gh workflow run "Testes de banco" --ref responsavel-inicial-por-etapa`) e leia o resultado. **Atenção:** ele roda contra o banco remoto de desenvolvimento, que ainda não tem esta migração, então o `73_` falha lá até o workflow "Migrar banco de desenvolvimento" aplicar a migração. Esse workflow também está autorizado na branch de trabalho (Ajustes do projeto: "Migração do desenvolvimento pelo GitHub Actions"): dispare-o com a migração desta branch, leia o resultado, depois rode "Testes de banco" de novo. Produção e `migration repair` não entram. Se o workflow de migração recusar ou falhar, pare e me mostre a saída; não tente outro caminho.
- [ ] **6.4 Junte à principal:** `git switch main`; `git merge --no-ff responsavel-inicial-por-etapa` (mensagem "executar: responsavel-inicial-por-etapa"); `git branch -d responsavel-inicial-por-etapa` (d minúsculo; se recusar, pare e me pergunte). `git push origin main` (autorizado, sem `--force`; ele mexe em `supabase/`, então dispara "Testes de banco" na `main`: confira o resultado).
- [ ] **6.5 Registros** (na `main`): ao fim da seção "Responsável inicial por etapa" de `.scratch/processos-etapas/spec.md`, depois do critério 11 e antes da seção seguinte, a linha `Implementado em 2026-10-30 (commit <hash do último commit do ticket, o da tarefa 5>)`. `docs/adr/0036-…`: não editar. Se algo divergiu da spec ou do ADR (por exemplo, a trava das fixas), o `desvios.md` já recebeu a entrada (1.8). `.scratch/proximo-passo.md` (sobrescreva): `/polir` (Sonnet) se o Catálogo for tela nova para polir, ou `/ship` (Sonnet; Opus na revisão de segurança) se não; mais o que falta (conferência visual do usuário, nada mais). Item de `.claude/regras/nao-testados.md`: leia o bloco de `/executar-complexo` e o de "Qualquer momento" e acrescente em `.scratch/melhorias-protocolo.md` os itens que aconteceram. Comite: `git add .scratch && git commit -m "executar: registros de responsavel-inicial-por-etapa"` e `git push origin main`.
- [ ] **6.6 Aviso final ao usuário** (sem pedir `/cost`: o projeto não registra custo): o que foi feito, o que depende dele (conferir o Catálogo na tela; os processos já existentes ficam como estão; o responsável inicial de cada etapa começa vazio, então hoje mover deixa o processo **sem responsável** até ele escolher os responsáveis no Catálogo), próximo comando e modelo, e o fecho de duas ou três linhas por ser relatório extenso.
