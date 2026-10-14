# Ticket 03 de processos-etapas (Responsáveis do setor) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cada setor ganha a sua lista de responsáveis (nome, e-mail e cargo), mantida na tela do setor por Administrador e Integrante, vista por todos os perfis ativos e registrada no Histórico da área Setores.

**Architecture:** uma migração cria `responsaveis_do_setor` com RLS, gatilho de preparo (espaços, minúsculas, e-mail), gatilho de eventos e a política de leitura dos eventos `responsavel_do_setor`, e regrava a exclusão do setor para guardar a lista dos responsáveis. O módulo de processos (real e falso) ganha ler, criar, editar e excluir responsável; a tela do setor ganha a seção "Responsáveis do setor" acima das etapas; o Histórico dos cadastros passa a ler a entidade nova.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 48 a 52, 79, 83 a 85; "Interface", "Modelo de dados", "Quem pode o quê", "Regras que o banco impõe") · **Ticket:** `.scratch/processos-etapas/issues/03-responsaveis-do-setor.md` (critérios citados como "critério N", na ordem do ticket).

## Global Constraints

- Regras de `.claude/regras/banco.md` que valem: teste antes da migração; migração por `npx supabase migration new`; RLS ligada e políticas na mesma migração; funções `security definer` só em `private`, `search_path` vazio, execução tirada de `public`, `anon` e `authenticated`; cada célula de "quem pode o quê" de `responsaveis_do_setor` com teste (Administrador, Integrante, Consulta, inativo, visitante); `revoke all` de visitante e logado na tabela nova (senão `10_privilegios_padrao` reprova); interface só pela chave publicável (`src/lib/supabase.ts`); conferir o vínculo (`supabase/AMBIENTES.md`, dev `yclkzyoebpsxmgpbcbus`, e `supabase/.temp/project-ref`) antes de `db:types`.
- Rede do escritório: porta 5432 fechada. pgTAP e migração rodam **no GitHub Actions** ("Ajustes deste Projeto" do `CLAUDE.md`): `git push` da branch (sem `--force`), disparo de "Testes de banco" e de "Migrar banco de desenvolvimento" na branch e leitura do resultado dispensam autorização. Sem `gh`: disparo pelo navegador do app. Produção e `migration repair` só pelo `/ship`.
- `npm test` nunca depende do banco: telas com `AcessoFalso`, `CadastrosFalso` e `ProcessosFalso`.
- ESLint no pre-commit: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; sem `any`; no máximo 2 níveis de indentação. `tsc -b` e `madge --circular` limpos.
- Mensagens da spec, literais: "O e-mail deve ter o formato nome@dominio. Recebido: "{valor}".", "Nenhum responsável cadastrado ainda.", "Carregando responsáveis…", "Não foi possível carregar os responsáveis. Verifique a conexão e tente de novo." + [Tentar de novo], "A alteração não foi salva: {motivo}. Seus dados continuam no formulário.", janela "Excluir o responsável {nome}?" [Excluir responsável] [Cancelar], botões [Novo responsável], [Editar], [Excluir]; histórico "Criou", "Editou", "Excluiu".
- Dados de teste inventados. Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **Formato do e-mail:** `algo@algo.algo`, sem espaços e sem segundo `@` (regex `^[^@\s]+@[^@\s]+\.[^@\s]+$`, igual no banco e na tela). Qualquer domínio (história 50).
- **Recusa do e-mail** em `P0001` com `email_mal_formado:<valor recebido, sem espaços nas pontas>`, no molde das recusas de etapas; a interface a traduz para a frase da spec. A restrição `responsaveis_do_setor_email_formato` fica de reserva ("gatilho e restrição" da spec).
- **Nome vazio:** a tela diz "O nome do responsável é obrigatório." (texto novo, no molde de "O nome do setor é obrigatório."; a spec só diz "nome obrigatório"). No banco, a restrição de tamanho recusa (23514).
- **Privilégios:** logado lê e apaga; inclui só `setor_id`, `nome`, `email`, `cargo`; altera só `nome`, `email`, `cargo` (id, setor e criado_em ninguém muda). Políticas de escrita reaproveitam `private.pode_alterar_cadastros()` (administrador e integrante ativos), como `andamentos`.
- **Eventos:** gatilho depois de incluir, alterar e apagar. `entidade = 'responsavel_do_setor'`, `entidade_ref = '<setor_id>:<responsavel_id>'` (molde do vínculo, para o filtro pelo setor), `acao` por `private.acao_do_cadastro` (criar, editar, excluir), `detalhes = {antes, depois}` com `setor_id`, `setor_sigla`, `nome`, `email`, `cargo`. Gravação sem mudança não vira evento.
- **Exclusão do setor:** `private.registrar_exclusao_do_setor` é regravada (`create or replace` numa migração nova; a antiga não se edita) para guardar `responsaveis` (nome, e-mail e cargo, em ordem de nome) no "antes" e apagar os responsáveis antes do setor sair, como já faz com os vínculos: cada um gera o seu evento "Excluiu", com a sigla legível. O `on delete cascade` fica de reserva.
- **Teste antigo afetado:** `13_setores_envolvidos` compara o "antes" inteiro da exclusão do setor; passa a esperar `'responsaveis', jsonb_build_array()`.
- **Responsável que sumiu** (excluído por outra pessoa): editar ou excluir sem linha afetada e sem a linha legível vira `CadastroInexistente`; a seção só recarrega a lista (não é o setor que sumiu). Recusa por perfil: "Seu perfil não permite alterar os processos." (`RECUSAS_DOS_PROCESSOS`).
- **Tela:** a seção "Responsáveis do setor" fica acima de "Etapas do setor" (ordem da spec), nos dois modos. Tabela Nome, E-mail, Cargo (vazio como "—") e, para quem pode, Ações com [Editar] e [Excluir]; o formulário ("Novo responsável" ou "Editar responsável") abre abaixo da tabela, no lugar do botão [Novo responsável]. A janela de exclusão é só o título da spec, sem texto de apoio: `JanelaDeConfirmacao` passa a aceitar `texto` opcional.
- **`ProcessosFalso`:** `falharLeitura` e `segurarLeitura` valem também para os responsáveis (os testes olham dentro da seção).

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/16_responsaveis_do_setor.test.sql` (novo) | pgTAP: quem pode o quê, e-mail, eventos, exclusão do setor |
| `supabase/tests/13_setores_envolvidos.test.sql` | "antes" da exclusão do setor com `responsaveis` |
| `supabase/migrations/<data>_responsaveis_do_setor.sql` (novo) | tabela, RLS, gatilhos, exclusão do setor, política de eventos |
| `supabase/AMBIENTES.md` · `src/types/database.ts` | registro da migração · tipos gerados |
| `src/processos/tipos.ts` | `ResponsavelDoSetor`, `DadosDoResponsavel`, quatro operações |
| `src/processos/validacaoDoResponsavel.ts` (+ teste) | conferência da tela e frase do e-mail |
| `src/processos/responsaveisSupabase.ts` (+ teste) | acesso real a `responsaveis_do_setor` e tradução das recusas |
| `src/processos/processosSupabase.ts` | inclui as operações dos responsáveis |
| `src/processos/ProcessosFalso.ts` | responsáveis em memória |
| `src/components/JanelaDeConfirmacao.tsx` | `texto` opcional |
| `src/components/processos/ResponsaveisDoSetor.tsx` (novo) | seção com carregando, erro e conteúdo |
| `src/components/processos/TabelaDeResponsaveis.tsx` (novo) | tabela ou vazio, com ações opcionais |
| `src/components/processos/ResponsaveisEditaveis.tsx` (novo) | Novo, Editar, Excluir e a janela |
| `src/components/processos/FormularioDeResponsavel.tsx` (novo) | formulário com validação |
| `src/components/processos/Etapas.css` | espaçamento da seção nova e das ações |
| `src/components/cadastros/SetorAberto.tsx` | monta a seção |
| `src/App.responsaveisDoSetor.test.tsx` (novo) | testes de tela |
| `src/cadastros/historicoSupabase.ts` (+ teste) · `src/cadastros/historicoDosCadastros.ts` (+ teste) · `src/App.historicoDosCadastros.test.tsx` | entidade nova no Histórico |

---

### Task 1: Banco: responsáveis do setor (critérios 1 a 3)

**Files:**
- Create: `supabase/tests/16_responsaveis_do_setor.test.sql`, `supabase/migrations/<data>_responsaveis_do_setor.sql`
- Modify: `supabase/tests/13_setores_envolvidos.test.sql:247-253`, `supabase/AMBIENTES.md`, `src/types/database.ts` (gerado)

**Interfaces:**
- Produces: tabela `public.responsaveis_do_setor (id, setor_id, nome, email, cargo, criado_em)`; recusa `email_mal_formado:<valor>` (P0001); eventos `entidade = 'responsavel_do_setor'`, ref `'<setor_id>:<id>'`; "antes" da exclusão do setor com `responsaveis: [{nome, email, cargo}]`.

- [x] **Step 1: branch.** `git switch -c processos-etapas` a partir da `main` (isolamento já feito: branch comum, sem worktree).

- [x] **Step 2: teste que falha.** Criar `supabase/tests/16_responsaveis_do_setor.test.sql`:

```sql
-- Responsáveis do setor: quem pode o quê, e-mail, eventos e exclusão junto com o setor (processos-etapas, ticket 03).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(49);

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

-- Setores inventados: TPA a TPC para os perfis, TRS para as regras.
insert into public.setores (id, sigla, nome) values
  ('5c000000-0000-0000-0000-000000000001', 'TPA', 'Setor Perfil A'),
  ('5c000000-0000-0000-0000-000000000002', 'TPB', 'Setor Perfil B'),
  ('5c000000-0000-0000-0000-000000000003', 'TPC', 'Setor Perfil C'),
  ('5c000000-0000-0000-0000-000000000004', 'TRS', 'Setor das Regras');

-- Um responsável inventado em cada setor de perfil, incluído pelo dono do banco.
insert into public.responsaveis_do_setor (setor_id, nome) values
  ('5c000000-0000-0000-0000-000000000001', 'Pessoa Semente TPA'),
  ('5c000000-0000-0000-0000-000000000002', 'Pessoa Semente TPB'),
  ('5c000000-0000-0000-0000-000000000003', 'Pessoa Semente TPC');

-- Administrador e Integrante criam, alteram e apagam; Consulta só lê; o inativo nada; id, setor e data ninguém muda.
create function pg_temp.conferir_responsaveis(id_usuario text, quem text, sigla_do_setor text, altera boolean, le int)
returns void language plpgsql as $$
declare
  id_do_setor uuid := (select id from public.setores where sigla = sigla_do_setor);
  inclusao text := format(
    $sql$insert into public.responsaveis_do_setor (setor_id, nome) values (%L, 'Pessoa Nova')$sql$, id_do_setor);
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.responsaveis_do_setor where setor_id = id_do_setor), le,
    quem || case when le > 0 then ' lê os responsáveis' else ' não lê os responsáveis' end);
  if altera then
    insert into _tap (linha) select lives_ok(inclusao, quem || ' cria responsável');
  else
    insert into _tap (linha) select throws_ok(inclusao, '42501', null, quem || ' não cria responsável');
  end if;
  with alteradas as (update public.responsaveis_do_setor set cargo = 'Cargo Novo'
    where nome = 'Pessoa Semente ' || sigla_do_setor returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), case when altera then 1 else 0 end,
    quem || case when altera then ' altera o responsável' else ' não altera o responsável' end);
  insert into _tap (linha) select throws_ok(
    $sql$update public.responsaveis_do_setor set setor_id = setor_id$sql$, '42501', null,
    quem || ' não troca o setor do responsável');
  insert into _tap (linha) select throws_ok(
    $sql$update public.responsaveis_do_setor set id = id$sql$, '42501', null, quem || ' não troca o id do responsável');
  insert into _tap (linha) select throws_ok(
    $sql$update public.responsaveis_do_setor set criado_em = criado_em$sql$, '42501', null,
    quem || ' não troca a data de criação do responsável');
  with apagadas as (delete from public.responsaveis_do_setor
    where nome = 'Pessoa Semente ' || sigla_do_setor returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), case when altera then 1 else 0 end,
    quem || case when altera then ' apaga o responsável' else ' não apaga o responsável' end);
  reset role;
end $$;
grant execute on function pg_temp.conferir_responsaveis(text, text, text, boolean, int) to authenticated;

select pg_temp.conferir_responsaveis('00000000-0000-0000-0000-0000000000a1', 'Administrador', 'TPA', true, 1);
select pg_temp.conferir_responsaveis('00000000-0000-0000-0000-0000000000a2', 'Integrante', 'TPB', true, 1);
select pg_temp.conferir_responsaveis('00000000-0000-0000-0000-0000000000a3', 'Consulta', 'TPC', false, 1);
select pg_temp.conferir_responsaveis('00000000-0000-0000-0000-0000000000a4', 'Inativo', 'TPC', false, 0);

-- Visitante: nem lê nem grava.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.responsaveis_do_setor', '42501', null,
  'Visitante não lê os responsáveis');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.responsaveis_do_setor (setor_id, nome)
    values ('5c000000-0000-0000-0000-000000000003', 'Pessoa Visitante')$sql$, '42501', null,
  'Visitante não cria responsável');
insert into _tap (linha) select throws_ok(
  $sql$update public.responsaveis_do_setor set cargo = 'Trocado'$sql$, '42501', null, 'Visitante não altera responsável');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.responsaveis_do_setor$sql$, '42501', null, 'Visitante não apaga responsável');
reset role;

-- Regras, como Integrante: espaços nas pontas, e-mail em minúsculas, vazio vira nulo, mal formado recusado.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into public.responsaveis_do_setor (setor_id, nome, email, cargo)
  values ('5c000000-0000-0000-0000-000000000004', '  Fulano Teste  ', '  Fulano.Teste@Exemplo.com ', 'Chefe de Teste');
insert into _tap (linha) select is(
  (select email from public.responsaveis_do_setor where nome = 'Fulano Teste'), 'fulano.teste@exemplo.com',
  'e-mail guardado em minúsculas e sem espaços nas pontas');
insert into _tap (linha) select is(
  (select count(*)::int from public.responsaveis_do_setor where nome = 'Fulano Teste'), 1,
  'nome guardado sem espaços nas pontas');
insert into public.responsaveis_do_setor (setor_id, nome, email, cargo)
  values ('5c000000-0000-0000-0000-000000000004', 'Beltrana Teste', '   ', '');
insert into _tap (linha) select ok(
  (select email is null and cargo is null from public.responsaveis_do_setor where nome = 'Beltrana Teste'),
  'e-mail e cargo vazios viram nulos');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.responsaveis_do_setor (setor_id, nome, email)
    values ('5c000000-0000-0000-0000-000000000004', 'Ciclano Teste', 'fulano@')$sql$,
  'P0001', 'email_mal_formado:fulano@', 'e-mail mal formado recusado com o valor recebido');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.responsaveis_do_setor (setor_id, nome, email)
    values ('5c000000-0000-0000-0000-000000000004', 'Ciclano Teste', ' Fulano@Exemplo ')$sql$,
  'P0001', 'email_mal_formado:Fulano@Exemplo', 'e-mail sem domínio completo recusado como foi digitado');
insert into _tap (linha) select throws_ok(
  $sql$update public.responsaveis_do_setor set email = 'sem-arroba' where nome = 'Fulano Teste'$sql$,
  'P0001', 'email_mal_formado:sem-arroba', 'e-mail mal formado recusado também ao editar');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.responsaveis_do_setor (setor_id, nome)
    values ('5c000000-0000-0000-0000-000000000004', '   ')$sql$, '23514', null, 'nome vazio recusado');

-- Eventos: criar, editar e excluir com o setor e o nome legíveis; gravação sem mudança não gera evento.
insert into _tap (linha) select is(
  (select detalhes from public.eventos where entidade = 'responsavel_do_setor' and acao = 'criar'
    and detalhes -> 'depois' ->> 'nome' = 'Fulano Teste'),
  jsonb_build_object('antes', null, 'depois', jsonb_build_object(
    'setor_id', '5c000000-0000-0000-0000-000000000004', 'setor_sigla', 'TRS', 'nome', 'Fulano Teste',
    'email', 'fulano.teste@exemplo.com', 'cargo', 'Chefe de Teste')),
  'criar gera o evento com o setor e o nome legíveis');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'responsavel_do_setor'
    and entidade_ref = '5c000000-0000-0000-0000-000000000004:'
      || (select id from public.responsaveis_do_setor where nome = 'Fulano Teste')),
  1, 'a referência do evento traz o setor e o responsável');
update public.responsaveis_do_setor set cargo = 'Chefe Novo' where nome = 'Fulano Teste';
insert into _tap (linha) select is(
  (select (detalhes -> 'antes' ->> 'cargo') || ' > ' || (detalhes -> 'depois' ->> 'cargo')
    from public.eventos where entidade = 'responsavel_do_setor' and acao = 'editar'),
  'Chefe de Teste > Chefe Novo', 'editar gera o evento com o antes e o depois');
update public.responsaveis_do_setor set cargo = cargo where nome = 'Fulano Teste';
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'responsavel_do_setor'
    and entidade_ref like '5c000000-0000-0000-0000-000000000004:%'),
  3, 'gravação sem mudança não gera evento');
delete from public.responsaveis_do_setor where nome = 'Beltrana Teste';
insert into _tap (linha) select is(
  (select detalhes -> 'antes' ->> 'nome' from public.eventos
    where entidade = 'responsavel_do_setor' and acao = 'excluir'),
  'Beltrana Teste', 'excluir gera o evento com o que o responsável tinha');
reset role;

-- Quem lê os eventos dos responsáveis: todo perfil ativo (o Integrante já leu acima).
create function pg_temp.eventos_dos_responsaveis(id_usuario text) returns int
language plpgsql as $$
declare
  total int;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  select count(*)::int into total from public.eventos
    where entidade = 'responsavel_do_setor' and entidade_ref like '5c000000-0000-0000-0000-000000000004:%';
  reset role;
  return total;
end $$;
grant execute on function pg_temp.eventos_dos_responsaveis(text) to authenticated;
insert into _tap (linha) select is(pg_temp.eventos_dos_responsaveis('00000000-0000-0000-0000-0000000000a3'), 4,
  'Consulta lê os eventos dos responsáveis');
insert into _tap (linha) select is(pg_temp.eventos_dos_responsaveis('00000000-0000-0000-0000-0000000000a4'), 0,
  'Inativo não lê os eventos dos responsáveis');

-- Excluir o setor, como Integrante: os responsáveis vão junto, com a lista no "antes" e um evento por responsável.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into public.responsaveis_do_setor (setor_id, nome) values ('5c000000-0000-0000-0000-000000000004', 'Ana Teste');
delete from public.setores where sigla = 'TRS';
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from public.responsaveis_do_setor where setor_id = '5c000000-0000-0000-0000-000000000004'), 0,
  'excluir o setor apaga os responsáveis dele');
insert into _tap (linha) select is(
  (select detalhes -> 'antes' -> 'responsaveis' from public.eventos
    where entidade = 'setor' and acao = 'excluir' and detalhes -> 'antes' ->> 'sigla' = 'TRS'),
  jsonb_build_array(
    jsonb_build_object('nome', 'Ana Teste', 'email', null, 'cargo', null),
    jsonb_build_object('nome', 'Fulano Teste', 'email', 'fulano.teste@exemplo.com', 'cargo', 'Chefe Novo')),
  'excluir o setor grava no antes a lista dos responsáveis');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where entidade = 'responsavel_do_setor' and acao = 'excluir'
    and detalhes -> 'antes' ->> 'setor_sigla' = 'TRS'),
  3, 'cada responsável do setor excluído tem o seu evento de exclusão, com a sigla');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

Contagem: 7 por perfil × 4 = 28; visitante 4; regras 7; eventos 5; leitura dos eventos 2; exclusão do setor 3 → 49.

Em `supabase/tests/13_setores_envolvidos.test.sql`, no "antes" esperado da exclusão de TSD (linhas 247-253), acrescentar a lista dos responsáveis depois de `macroprocessos`:

```sql
  jsonb_build_object('depois', null, 'antes', jsonb_build_object(
    'sigla', 'TSD', 'nome', 'Setor Teste D', 'observacoes', null, 'ativo', true,
    'macroprocessos', jsonb_build_array(
      jsonb_build_object('macroprocesso_id', 'aa000000-0000-0000-0000-000000000002', 'codigo', 'MT02',
        'nome', 'Macro de Teste Dois', 'observacao', null),
      jsonb_build_object('macroprocesso_id', 'aa000000-0000-0000-0000-000000000001', 'codigo', null,
        'nome', 'Macro de Teste Um', 'observacao', 'Nota um')),
    'responsaveis', jsonb_build_array())),
```

- [x] **Step 3: ver falhar.** Commit "Ticket 03 de processos-etapas: teste de banco dos responsáveis do setor"; `git push -u origin processos-etapas`; disparar "Testes de banco" na branch. Esperado: `16_responsaveis_do_setor` falha (tabela inexistente) e `13_setores_envolvidos` falha só no item "excluir o setor grava no antes a lista dos macroprocessos"; os outros 15 arquivos verdes.

- [x] **Step 4: migração.** `npx supabase migration new responsaveis_do_setor` e escrever no arquivo criado:

```sql
-- Processos e etapas, ticket 03: responsáveis do setor (nome, e-mail e cargo), lidos por todo perfil ativo e mantidos
-- por administrador e integrante, com eventos no histórico. A recusa do e-mail chega à interface como
-- "email_mal_formado:valor" em P0001 (src/processos/responsaveisSupabase.ts).

create table public.responsaveis_do_setor (
  id uuid primary key default gen_random_uuid(),
  setor_id uuid not null references public.setores (id) on delete cascade,
  nome text not null constraint responsaveis_do_setor_nome_tamanho
    check (char_length(nome) between 1 and 200 and nome = btrim(nome)),
  email text constraint responsaveis_do_setor_email_formato
    check (char_length(email) <= 254 and email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  cargo text constraint responsaveis_do_setor_cargo_tamanho check (char_length(cargo) <= 200),
  criado_em timestamptz not null default now()
);

create index responsaveis_do_setor_setor on public.responsaveis_do_setor (setor_id);

alter table public.responsaveis_do_setor enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui com o setor e altera só nome, e-mail e cargo.
revoke all on public.responsaveis_do_setor from anon, authenticated;
grant select, delete on public.responsaveis_do_setor to authenticated;
grant insert (setor_id, nome, email, cargo) on public.responsaveis_do_setor to authenticated;
grant update (nome, email, cargo) on public.responsaveis_do_setor to authenticated;

-- Todo perfil ativo vê com quem falar (decisão da sabatina de cadastros-basicos, 2026-10-10).
create policy "responsaveis_do_setor: ativo lê" on public.responsaveis_do_setor
  for select to authenticated using ((select private.usuario_ativo()));

create policy "responsaveis_do_setor: administrador e integrante ativos criam" on public.responsaveis_do_setor
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "responsaveis_do_setor: administrador e integrante ativos alteram" on public.responsaveis_do_setor
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create policy "responsaveis_do_setor: administrador e integrante ativos apagam" on public.responsaveis_do_setor
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de gravar: sem espaços nas pontas, e-mail em minúsculas, vazio vira nulo; e-mail mal formado é recusado
-- com o valor como foi digitado (a restrição acima fica de reserva).
create function private.preparar_responsavel_do_setor() returns trigger
language plpgsql set search_path = ''
as $$
declare
  recebido text := btrim(new.email);
begin
  new.nome := btrim(new.nome);
  new.cargo := nullif(btrim(new.cargo), '');
  new.email := nullif(lower(recebido), '');
  if new.email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'email_mal_formado:%', recebido;
  end if;
  return new;
end $$;

create trigger preparar_responsavel_do_setor before insert or update on public.responsaveis_do_setor
  for each row execute function private.preparar_responsavel_do_setor();

-- Evento com sigla e nome legíveis; a referência 'setor:responsável' deixa o histórico filtrar pelo setor.
-- Na exclusão do setor os responsáveis saem ANTES do setor (gatilho abaixo), quando a sigla ainda existe.
create function private.registrar_evento_do_responsavel_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  linha public.responsaveis_do_setor := case when tg_op = 'DELETE' then old else new end;
  base jsonb;
  antes jsonb;
  depois jsonb;
begin
  select jsonb_build_object('setor_id', s.id, 'setor_sigla', s.sigla) into base
  from public.setores s where s.id = linha.setor_id;
  base := coalesce(base, jsonb_build_object('setor_id', linha.setor_id));
  antes := case when tg_op <> 'INSERT' then base || jsonb_build_object('nome', old.nome, 'email', old.email, 'cargo', old.cargo) end;
  depois := case when tg_op <> 'DELETE' then base || jsonb_build_object('nome', new.nome, 'email', new.email, 'cargo', new.cargo) end;
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_cadastro(tg_op, antes, depois), 'responsavel_do_setor',
    linha.setor_id::text || ':' || linha.id::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_do_responsavel_do_setor after insert or update or delete on public.responsaveis_do_setor
  for each row execute function private.registrar_evento_do_responsavel_do_setor();

-- Excluir um setor: além dos macroprocessos, guarda a lista dos responsáveis e os apaga antes do setor sair
-- (cada um gera o seu evento). A versão anterior é da migração setores_envolvidos.
create or replace function private.registrar_exclusao_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  macroprocessos jsonb;
  responsaveis jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('macroprocesso_id', m.id, 'codigo', m.codigo, 'nome', m.nome,
    'observacao', v.observacao) order by m.codigo nulls last, m.nome), '[]'::jsonb) into macroprocessos
  from public.setores_envolvidos v join public.macroprocessos m on m.id = v.macroprocesso_id
  where v.setor_id = old.id;
  select coalesce(jsonb_agg(jsonb_build_object('nome', r.nome, 'email', r.email, 'cargo', r.cargo)
    order by r.nome), '[]'::jsonb) into responsaveis
  from public.responsaveis_do_setor r where r.setor_id = old.id;
  delete from public.setores_envolvidos where setor_id = old.id;
  delete from public.responsaveis_do_setor where setor_id = old.id;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'setor', old.id::text, jsonb_build_object(
    'antes', jsonb_build_object('sigla', old.sigla, 'nome', old.nome, 'observacoes', old.observacoes,
      'ativo', old.ativo, 'macroprocessos', macroprocessos, 'responsaveis', responsaveis),
    'depois', null));
  return old;
end $$;

revoke execute on function private.preparar_responsavel_do_setor(), private.registrar_evento_do_responsavel_do_setor(),
  private.registrar_exclusao_do_setor()
  from public, anon, authenticated;

-- Todo perfil ativo lê os eventos dos responsáveis (políticas de leitura somam; os de usuários seguem só do administrador).
create policy "eventos: perfil ativo lê os responsáveis do setor" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'responsavel_do_setor');
```

Atenção: `private.preparar_responsavel_do_setor` não é `security definer` e não chama outra função: a execução pode ficar tirada de `authenticated` (como `preparar_andamento`).

- [x] **Step 5: aplicar e ver passar.** Commit "Ticket 03 de processos-etapas: migração dos responsáveis do setor"; `git push`; disparar "Migrar banco de desenvolvimento" com o nome do arquivo criado no passo 4; depois "Testes de banco" na branch. Esperado: os 17 arquivos verdes, `16_responsaveis_do_setor` com 49 de 49. Se algum item falhar, corrigir com **migração nova** (a já aplicada não se edita) ou o teste, se o erro for dele.

- [x] **Step 6: registro e tipos.** Acrescentar em `supabase/AMBIENTES.md`, na lista das migrações aplicadas, a linha `- <arquivo sem .sql> (2026-10-13; processos-etapas, ticket 03; teste 16 falhou antes, tabela inexistente, e 13 falhou no "antes" da exclusão do setor; passaram depois, com os 17 arquivos verdes; aplicada pelo workflow "Migrar banco de desenvolvimento", e testada pelo "Testes de banco" na branch)`. Conferir o vínculo (`AMBIENTES.md` e `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`), `npm run db:types`, `npx tsc -b` limpo (`responsaveis_do_setor` aparece em `src/types/database.ts`). Commit "Ticket 03 de processos-etapas: tipos e registro da migração"; `git push`.

---

### Task 2: Conferência do responsável na tela (critério 4)

**Files:**
- Modify: `src/processos/tipos.ts`
- Create: `src/processos/validacaoDoResponsavel.ts`, `src/processos/validacaoDoResponsavel.test.ts`

**Interfaces:**
- Produces: `ResponsavelDoSetor = { id: string; nome: string; email: string | null; cargo: string | null }`; `DadosDoResponsavel = Omit<ResponsavelDoSetor, 'id'>`; `CamposDoResponsavel = { nome: string; email: string; cargo: string }`; `fraseDoEmailMalFormado(recebido: string): string`; `problemaNoResponsavel(campos: CamposDoResponsavel): string | null`; `dadosDoResponsavel(campos: CamposDoResponsavel): DadosDoResponsavel`.

- [x] **Step 1: tipos.** Em `src/processos/tipos.ts`, depois de `EtapaDoSetor`:

```ts
/** Pessoa do setor atendido que responde por ele junto ao EP. */
export type ResponsavelDoSetor = { id: string; nome: string; email: string | null; cargo: string | null }

export type DadosDoResponsavel = Omit<ResponsavelDoSetor, 'id'>
```

- [x] **Step 2: teste que falha.** `src/processos/validacaoDoResponsavel.test.ts`:

```ts
import { expect, test } from 'vitest'
import { dadosDoResponsavel, problemaNoResponsavel } from './validacaoDoResponsavel'

const CAMPOS = { nome: 'Ana Teste', email: '', cargo: '' }

test('nome em branco é recusado', () => {
  expect(problemaNoResponsavel({ ...CAMPOS, nome: '   ' })).toBe('O nome do responsável é obrigatório.')
})

test.each(['', 'ana.teste@exemplo.com', ' Ana.Teste@Sub.Exemplo.org '])('e-mail "%s" é aceito', (email) => {
  expect(problemaNoResponsavel({ ...CAMPOS, email })).toBeNull()
})

test.each([['ana@', 'ana@'], [' ana@exemplo ', 'ana@exemplo'], ['ana teste@exemplo.com', 'ana teste@exemplo.com'],
  ['a@b@exemplo.com', 'a@b@exemplo.com']])('e-mail "%s" é recusado com o valor recebido', (email, recebido) => {
  expect(problemaNoResponsavel({ ...CAMPOS, email }))
    .toBe(`O e-mail deve ter o formato nome@dominio. Recebido: "${recebido}".`)
})

test('dados saem sem espaços nas pontas, e-mail em minúsculas e vazios como nulos', () => {
  expect(dadosDoResponsavel({ nome: ' Ana Teste ', email: ' Ana.Teste@Exemplo.com ', cargo: ' ' }))
    .toEqual({ nome: 'Ana Teste', email: 'ana.teste@exemplo.com', cargo: null })
  expect(dadosDoResponsavel({ nome: 'Ana Teste', email: '', cargo: ' Chefe ' }))
    .toEqual({ nome: 'Ana Teste', email: null, cargo: 'Chefe' })
})
```

Run: `npx vitest run src/processos/validacaoDoResponsavel.test.ts` → FAIL (módulo inexistente).

- [x] **Step 3: implementação.** `src/processos/validacaoDoResponsavel.ts`:

```ts
import type { DadosDoResponsavel } from './tipos'

// O banco confere de novo (migração responsaveis_do_setor, mesmo formato); aqui a pessoa vê o problema antes de enviar.
const FORMATO_DO_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** O que a pessoa digitou no formulário, ainda sem normalizar. */
export type CamposDoResponsavel = { nome: string; email: string; cargo: string }

export function fraseDoEmailMalFormado(recebido: string): string {
  return `O e-mail deve ter o formato nome@dominio. Recebido: "${recebido}".`
}

export function problemaNoResponsavel({ nome, email }: CamposDoResponsavel): string | null {
  if (nome.trim() === '') return 'O nome do responsável é obrigatório.'
  const recebido = email.trim()
  if (recebido === '' || FORMATO_DO_EMAIL.test(recebido)) return null
  return fraseDoEmailMalFormado(recebido)
}

// Mesma normalização do banco (private.preparar_responsavel_do_setor).
export function dadosDoResponsavel({ nome, email, cargo }: CamposDoResponsavel): DadosDoResponsavel {
  return { nome: nome.trim(), email: email.trim().toLowerCase() || null, cargo: cargo.trim() || null }
}
```

Run: o mesmo comando → PASS.

- [x] **Step 4: commit** "Ticket 03 de processos-etapas: conferência do responsável na tela".

---

### Task 3: Módulo de processos: responsáveis, real e falso (critério 4)

**Files:**
- Modify: `src/processos/tipos.ts`, `src/processos/processosSupabase.ts`, `src/processos/ProcessosFalso.ts`
- Create: `src/processos/responsaveisSupabase.ts`, `src/processos/responsaveisSupabase.test.ts`

**Interfaces:**
- Consumes: `fraseDoEmailMalFormado` (Task 2); tabela e recusa da Task 1.
- Produces: em `ModuloDeProcessos`: `lerResponsaveisDoSetor(setorId: string): Promise<ResponsavelDoSetor[]>` (ordem de nome), `criarResponsavel(setorId: string, dados: DadosDoResponsavel): Promise<void>`, `editarResponsavel(id: string, dados: DadosDoResponsavel): Promise<void>`, `excluirResponsavel(id: string): Promise<void>`. `ProcessosFalso.responsaveisDoSetor: Record<string, ResponsavelDoSetor[]>`.

- [x] **Step 1: contrato.** Em `ModuloDeProcessos` (`src/processos/tipos.ts`), depois de `registrarRealizadaAnteriormente`:

```ts
  /** Em ordem alfabética de nome. */
  lerResponsaveisDoSetor(setorId: string): Promise<ResponsavelDoSetor[]>
  criarResponsavel(setorId: string, dados: DadosDoResponsavel): Promise<void>
  editarResponsavel(id: string, dados: DadosDoResponsavel): Promise<void>
  excluirResponsavel(id: string): Promise<void>
```

E no comentário do tipo, trocar "etapa de um setor que já não existe, como CadastroInexistente" por "etapa ou responsável que já não existe, como CadastroInexistente".

- [x] **Step 2: teste que falha.** `src/processos/responsaveisSupabase.test.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from 'vitest'
import { TravaDoBanco } from '../acesso/falhasDeGravacao'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { ClienteSupabaseFalso } from '../testes/ClienteSupabaseFalso'
import type { Database } from '../types/database'
import { criarProcessosSupabase } from './processosSupabase'

const ANA = { id: 'r1', nome: 'Ana Teste', email: 'ana.teste@exemplo.com', cargo: null }
const DADOS = { nome: 'Ana Teste', email: 'ana.teste@exemplo.com', cargo: 'Chefe' }

function criar(cliente: ClienteSupabaseFalso) {
  return criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)
}

test('lê os responsáveis do setor em ordem de nome', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.select'] = { data: [ANA], error: null }
  expect(await criar(cliente).lerResponsaveisDoSetor('s1')).toEqual([ANA])
  expect(cliente.pedidos[0]).toMatchObject({
    tabela: 'responsaveis_do_setor', colunas: 'id, nome, email, cargo', filtro: ['setor_id', 's1'], ordem: [['nome', true]],
  })
})

test('falha ao ler vira erro com o motivo do banco', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.select'] = { data: null, error: { message: 'sem conexão' } }
  await expect(criar(cliente).lerResponsaveisDoSetor('s1'))
    .rejects.toThrow('Falha ao ler os responsáveis do setor: sem conexão')
})

test('criar inclui no setor; editar e excluir mexem só no responsável escolhido', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.update'] = { data: [{ id: 'r1' }], error: null }
  cliente.respostas['responsaveis_do_setor.delete'] = { data: [{ id: 'r1' }], error: null }
  const modulo = criar(cliente)
  await modulo.criarResponsavel('s1', DADOS)
  await modulo.editarResponsavel('r1', DADOS)
  await modulo.excluirResponsavel('r1')
  expect(cliente.pedidos).toMatchObject([
    { operacao: 'insert', valores: { setor_id: 's1', ...DADOS } },
    { operacao: 'update', valores: DADOS, filtro: ['id', 'r1'] },
    { operacao: 'delete', filtro: ['id', 'r1'] },
  ])
})

test.each(['insert', 'update'])('a recusa do e-mail no %s vira a frase da spec com o valor recebido', async (operacao) => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas[`responsaveis_do_setor.${operacao}`] = {
    data: null, error: { message: 'email_mal_formado:Ana@Exemplo', code: 'P0001' },
  }
  const modulo = criar(cliente)
  const gravar = operacao === 'insert' ? modulo.criarResponsavel('s1', DADOS) : modulo.editarResponsavel('r1', DADOS)
  await expect(gravar).rejects.toEqual(
    new TravaDoBanco('O e-mail deve ter o formato nome@dominio. Recebido: "Ana@Exemplo".'))
})

test('recusa por perfil vira a frase dos processos', async () => {
  const cliente = new ClienteSupabaseFalso()
  cliente.respostas['responsaveis_do_setor.insert'] = { data: null, error: { message: 'violates row-level security', code: '42501' } }
  await expect(criar(cliente).criarResponsavel('s1', DADOS))
    .rejects.toEqual(new TravaDoBanco('Seu perfil não permite alterar os processos.'))
})

test('nada alterado: ainda legível é perfil; ilegível, o responsável sumiu', async () => {
  const comPerfil = new ClienteSupabaseFalso()
  comPerfil.respostas['responsaveis_do_setor.update'] = { data: [], error: null }
  comPerfil.respostas['responsaveis_do_setor.select'] = { data: [{ id: 'r1' }], error: null }
  await expect(criar(comPerfil).editarResponsavel('r1', DADOS))
    .rejects.toEqual(new TravaDoBanco('Seu perfil não permite alterar os processos.'))
  const sumiu = new ClienteSupabaseFalso()
  sumiu.respostas['responsaveis_do_setor.delete'] = { data: [], error: null }
  await expect(criar(sumiu).excluirResponsavel('r1')).rejects.toBeInstanceOf(CadastroInexistente)
})
```

Run: `npx vitest run src/processos/responsaveisSupabase.test.ts` → FAIL (funções inexistentes).

- [x] **Step 3: implementação real.** `src/processos/responsaveisSupabase.ts`:

```ts
import {
  type ErroDoBanco, type RecusasDoModulo, TravaDoBanco, porQueNadaMudou, recusaPorPerfil,
} from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import type { DadosDoResponsavel, ModuloDeProcessos, ResponsavelDoSetor } from './tipos'
import { fraseDoEmailMalFormado } from './validacaoDoResponsavel'

type OperacoesDosResponsaveis = 'lerResponsaveisDoSetor' | 'criarResponsavel' | 'editarResponsavel' | 'excluirResponsavel'
type RespostaDaGravacao = { data: { id: string }[] | null; error: ErroDoBanco | null }

// As recusas chegam de fora (as de processos) para este módulo não importar quem o monta.
export function criarResponsaveisSupabase(
  cliente: ClienteSupabase, recusas: RecusasDoModulo,
): Pick<ModuloDeProcessos, OperacoesDosResponsaveis> {
  const tabela = () => cliente.from('responsaveis_do_setor')
  const conferir = (id: string, resposta: RespostaDaGravacao) => conferirGravacao(cliente, id, recusas, resposta)
  return {
    lerResponsaveisDoSetor: (setorId) => lerResponsaveis(cliente, setorId),
    criarResponsavel: (setorId, dados) => criarResponsavel(cliente, setorId, dados, recusas),
    editarResponsavel: async (id, dados) => conferir(id, await tabela().update(dados).eq('id', id).select('id')),
    excluirResponsavel: async (id) => conferir(id, await tabela().delete().eq('id', id).select('id')),
  }
}

async function lerResponsaveis(cliente: ClienteSupabase, setorId: string): Promise<ResponsavelDoSetor[]> {
  const { data, error } = await cliente.from('responsaveis_do_setor').select('id, nome, email, cargo')
    .eq('setor_id', setorId).order('nome')
  if (error) throw new Error(`Falha ao ler os responsáveis do setor: ${error.message}`)
  return data
}

async function criarResponsavel(
  cliente: ClienteSupabase, setorId: string, dados: DadosDoResponsavel, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.from('responsaveis_do_setor').insert({ setor_id: setorId, ...dados })
  if (error) throw falhaDoResponsavel(error, recusas)
}

// A RLS não acusa erro ao filtrar: sem linha afetada, a leitura decide entre perfil e responsável que sumiu.
async function conferirGravacao(
  cliente: ClienteSupabase, id: string, recusas: RecusasDoModulo, { data, error }: RespostaDaGravacao,
): Promise<void> {
  if (error) throw falhaDoResponsavel(error, recusas)
  if (data?.length) return
  const { data: lidos } = await cliente.from('responsaveis_do_setor').select('id').eq('id', id)
  throw porQueNadaMudou(Boolean(lidos?.length), recusas)
}

// O banco recusa o e-mail com "email_mal_formado:valor" (migração responsaveis_do_setor); o valor vai até o fim.
const PADRAO_DO_EMAIL = /\bemail_mal_formado:(.*)$/m

function falhaDoResponsavel(erro: ErroDoBanco, recusas: RecusasDoModulo): Error {
  const recusa = erro.message.match(PADRAO_DO_EMAIL)
  if (recusa) return new TravaDoBanco(fraseDoEmailMalFormado(recusa[1].trim()))
  return recusaPorPerfil(erro, recusas.semPermissao)
}
```

Em `src/processos/processosSupabase.ts`: importar `criarResponsaveisSupabase` e incluir `...criarResponsaveisSupabase(cliente, RECUSAS_DOS_PROCESSOS),` no objeto devolvido por `criarProcessosSupabase`.

Se `tsc` reclamar do tipo de retorno de `update(...).select('id')` em `conferir`, tipar `RespostaDaGravacao.error` com o tipo do supabase-js (`PostgrestError` tem `message` e `code`, então é compatível com `ErroDoBanco`).

Run: o mesmo comando → PASS; `npx vitest run src/processos` → PASS.

- [x] **Step 4: falso.** Em `src/processos/ProcessosFalso.ts`: importar `DadosDoResponsavel` e `ResponsavelDoSetor`; acrescentar, depois de `chamadas`:

```ts
  /** Os responsáveis de cada setor (pelo id do setor). Leitura e gravação seguem as falhas acima. */
  responsaveisDoSetor: Record<string, ResponsavelDoSetor[]> = {}
  private proximoId = 1
```

E os métodos, com `conferirGravacao` extraído do começo de `mudar` (que passa a chamá-lo):

```ts
  async lerResponsaveisDoSetor(setorId: string): Promise<ResponsavelDoSetor[]> {
    if (this.segurarLeitura) return new Promise<never>(() => {})
    if (this.falharLeitura) throw new Error('falha de conexão simulada')
    return [...(this.responsaveisDoSetor[setorId] ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }

  async criarResponsavel(setorId: string, dados: DadosDoResponsavel): Promise<void> {
    this.conferirGravacao()
    const novo = { id: `r${this.proximoId++}`, ...dados }
    this.responsaveisDoSetor[setorId] = [...(this.responsaveisDoSetor[setorId] ?? []), novo]
  }

  async editarResponsavel(id: string, dados: DadosDoResponsavel): Promise<void> {
    this.conferirGravacao()
    this.mudarResponsaveis((lista) => lista.map((responsavel) => (responsavel.id === id ? { id, ...dados } : responsavel)))
  }

  async excluirResponsavel(id: string): Promise<void> {
    this.conferirGravacao()
    this.mudarResponsaveis((lista) => lista.filter((responsavel) => responsavel.id !== id))
  }

  private conferirGravacao(): void {
    if (this.falhaDeGravacao === null) return
    throw typeof this.falhaDeGravacao === 'string' ? new Error(this.falhaDeGravacao) : this.falhaDeGravacao
  }

  private mudarResponsaveis(mudar: (lista: ResponsavelDoSetor[]) => ResponsavelDoSetor[]): void {
    for (const [setorId, lista] of Object.entries(this.responsaveisDoSetor)) this.responsaveisDoSetor[setorId] = mudar(lista)
  }
```

Run: `npx tsc -b` limpo; `npm test` → PASS.

- [x] **Step 5: commit** "Ticket 03 de processos-etapas: módulo de processos com os responsáveis (real e falso)".

---

### Task 4: Seção "Responsáveis do setor" na tela do setor (critérios 4 a 6 e 8)

**Files:**
- Modify: `src/components/JanelaDeConfirmacao.tsx`, `src/components/cadastros/SetorAberto.tsx`, `src/components/processos/Etapas.css`
- Create: `src/components/processos/ResponsaveisDoSetor.tsx`, `TabelaDeResponsaveis.tsx`, `ResponsaveisEditaveis.tsx`, `FormularioDeResponsavel.tsx`, `src/App.responsaveisDoSetor.test.tsx`

**Interfaces:**
- Consumes: as quatro operações e `ProcessosFalso.responsaveisDoSetor` (Task 3); `problemaNoResponsavel`, `dadosDoResponsavel`, `CamposDoResponsavel` (Task 2).
- Produces: `<ResponsaveisDoSetor processos setorId podeAlterar />`.

- [x] **Step 1: testes que falham.** `src/App.responsaveisDoSetor.test.tsx`:

```tsx
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { ResponsavelDoSetor } from './processos/tipos'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const BRUNO: ResponsavelDoSetor = { id: 'r2', nome: 'Bruno Teste', email: 'bruno.teste@exemplo.com', cargo: 'Chefe de Teste' }
const ANA: ResponsavelDoSetor = { id: 'r1', nome: 'Ana Teste', email: null, cargo: null }

type Montagem = { perfil?: Perfil; responsaveis?: ResponsavelDoSetor[]; ajustar?: (processos: ProcessosFalso) => void }

function montar({ perfil = 'integrante_ep', responsaveis = [BRUNO, ANA], ajustar }: Montagem = {}) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [{ id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true }]
  const processos = new ProcessosFalso()
  processos.responsaveisDoSetor = { s1: responsaveis }
  ajustar?.(processos)
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={processos} />)
  return processos
}

// Abre o setor TSA e devolve a seção "Responsáveis do setor".
async function abrirResponsaveis() {
  fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
  return within(await screen.findByRole('region', { name: 'Responsáveis do setor' }))
}

async function linhasDa(secao: ReturnType<typeof within>): Promise<string[]> {
  const linhas = await secao.findAllByRole('row')
  return linhas.slice(1).map((linha) => linha.textContent ?? '')
}

function preencher(secao: ReturnType<typeof within>, campos: { nome?: string; email?: string; cargo?: string }) {
  for (const [rotulo, valor] of [['Nome', campos.nome], ['E-mail', campos.email], ['Cargo', campos.cargo]]) {
    if (valor !== undefined) fireEvent.change(secao.getByLabelText(rotulo as string), { target: { value: valor } })
  }
}

function janelaAberta() {
  return within(screen.getByRole('dialog'))
}

test('a lista mostra nome, e-mail e cargo em ordem de nome, com Editar e Excluir', async () => {
  montar()
  const secao = await abrirResponsaveis()
  expect(await linhasDa(secao)).toEqual([
    expect.stringMatching(/^Ana Teste——EditarExcluir$/),
    expect.stringMatching(/^Bruno Testebruno\.teste@exemplo\.comChefe de TesteEditarExcluir$/),
  ])
  expect(secao.getByRole('button', { name: 'Novo responsável' })).toBeTruthy()
})

test('setor sem responsáveis mostra o vazio da spec', async () => {
  montar({ responsaveis: [] })
  const secao = await abrirResponsaveis()
  expect(await secao.findByText('Nenhum responsável cadastrado ainda.')).toBeTruthy()
})

test('mostra "Carregando responsáveis…" enquanto lê', async () => {
  montar({ ajustar: (processos) => { processos.segurarLeitura = true } })
  const secao = await abrirResponsaveis()
  expect(secao.getByRole('status').textContent).toBe('Carregando responsáveis…')
})

test('erro ao carregar tem o texto da spec e Tentar de novo', async () => {
  const processos = montar({ ajustar: (falso) => { falso.falharLeitura = true } })
  const secao = await abrirResponsaveis()
  const alerta = await secao.findByRole('alert')
  expect(alerta.textContent).toContain('Não foi possível carregar os responsáveis. Verifique a conexão e tente de novo.')
  processos.falharLeitura = false
  fireEvent.click(within(alerta).getByRole('button', { name: 'Tentar de novo' }))
  expect(await linhasDa(secao)).toHaveLength(2)
})

test('Novo responsável grava sem espaços, com e-mail em minúsculas, e fecha o formulário', async () => {
  const processos = montar({ responsaveis: [] })
  const secao = await abrirResponsaveis()
  fireEvent.click(secao.getByRole('button', { name: 'Novo responsável' }))
  preencher(secao, { nome: '  Carla Teste ', email: ' Carla.Teste@Exemplo.com ', cargo: '' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect(await linhasDa(secao)).toEqual([expect.stringContaining('Carla Testecarla.teste@exemplo.com—')])
  expect(processos.responsaveisDoSetor.s1).toEqual([{ id: 'r1', nome: 'Carla Teste', email: 'carla.teste@exemplo.com', cargo: null }])
  expect(secao.queryByRole('form', { name: 'Novo responsável' })).toBeNull()
})

test('nome em branco e e-mail mal formado são recusados na tela, sem gravar', async () => {
  const processos = montar({ responsaveis: [] })
  const secao = await abrirResponsaveis()
  fireEvent.click(secao.getByRole('button', { name: 'Novo responsável' }))
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('O nome do responsável é obrigatório.')
  preencher(secao, { nome: 'Carla Teste', email: 'carla@' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toBe('O e-mail deve ter o formato nome@dominio. Recebido: "carla@".')
  expect(processos.responsaveisDoSetor.s1).toEqual([])
})

test.each([
  ['falha genérica', 'sem conexão', 'A alteração não foi salva: sem conexão. Seus dados continuam no formulário.'],
  ['recusa do banco', new TravaDoBanco('O e-mail deve ter o formato nome@dominio. Recebido: "x@y".'),
    'O e-mail deve ter o formato nome@dominio. Recebido: "x@y".'],
])('%s ao criar mantém o formulário com os dados', async (_caso, falha, texto) => {
  montar({ responsaveis: [], ajustar: (processos) => { processos.falhaDeGravacao = falha } })
  const secao = await abrirResponsaveis()
  fireEvent.click(secao.getByRole('button', { name: 'Novo responsável' }))
  preencher(secao, { nome: 'Carla Teste', email: 'carla.teste@exemplo.com' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toBe(texto)
  expect((secao.getByLabelText('Nome') as HTMLInputElement).value).toBe('Carla Teste')
})

test('Editar abre o formulário preenchido e grava a mudança', async () => {
  montar()
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Bruno Teste' }))
  const formulario = within(secao.getByRole('form', { name: 'Editar responsável' }))
  expect((formulario.getByLabelText('E-mail') as HTMLInputElement).value).toBe('bruno.teste@exemplo.com')
  preencher(secao, { cargo: 'Diretor de Teste' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await linhasDa(secao))[1]).toContain('Diretor de Teste')
})

test('falha ao editar mantém o formulário com os dados', async () => {
  montar({ ajustar: (processos) => { processos.falhaDeGravacao = 'sem conexão' } })
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Editar Bruno Teste' }))
  preencher(secao, { cargo: 'Diretor de Teste' })
  fireEvent.click(secao.getByRole('button', { name: 'Salvar' }))
  expect((await secao.findByRole('alert')).textContent).toContain('Seus dados continuam no formulário.')
  expect((secao.getByLabelText('Cargo') as HTMLInputElement).value).toBe('Diretor de Teste')
})

test('Excluir pede confirmação com o texto da spec e, confirmado, tira o responsável', async () => {
  const processos = montar()
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Bruno Teste' }))
  expect(janelaAberta().getByRole('heading').textContent).toBe('Excluir o responsável Bruno Teste?')
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir responsável' }))
  expect(await linhasDa(secao)).toHaveLength(1)
  expect(processos.responsaveisDoSetor.s1.map((responsavel) => responsavel.nome)).toEqual(['Ana Teste'])
})

test('Cancelar e Esc fecham a janela de Excluir sem gravar', async () => {
  const processos = montar()
  const secao = await abrirResponsaveis()
  const excluir = await secao.findByRole('button', { name: 'Excluir Bruno Teste' })
  fireEvent.click(excluir)
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(excluir)
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(processos.responsaveisDoSetor.s1).toHaveLength(2)
})

test('falha ao excluir mostra o motivo e mantém o responsável', async () => {
  montar({ ajustar: (processos) => { processos.falhaDeGravacao = 'sem conexão' } })
  const secao = await abrirResponsaveis()
  fireEvent.click(await secao.findByRole('button', { name: 'Excluir Bruno Teste' }))
  fireEvent.click(janelaAberta().getByRole('button', { name: 'Excluir responsável' }))
  expect((await secao.findByRole('alert')).textContent).toBe('A alteração não foi salva: sem conexão.')
  expect(await linhasDa(secao)).toHaveLength(2)
})

test('a Consulta vê nome, e-mail e cargo, sem botões', async () => {
  montar({ perfil: 'consulta' })
  const secao = await abrirResponsaveis()
  expect(await linhasDa(secao)).toEqual([
    'Ana Teste——', 'Bruno Testebruno.teste@exemplo.comChefe de Teste',
  ])
  expect(secao.queryAllByRole('button')).toHaveLength(0)
})
```

Run: `npx vitest run src/App.responsaveisDoSetor.test.tsx` → FAIL (região inexistente).

- [x] **Step 2: janela com texto opcional.** Em `src/components/JanelaDeConfirmacao.tsx`: `texto?: string` no tipo das props e `{texto && <p>{texto}</p>}` no lugar de `<p>{texto}</p>`.

- [x] **Step 3: formulário.** `src/components/processos/FormularioDeResponsavel.tsx`:

```tsx
import { type ChangeEvent, type FormEvent, useId, useState } from 'react'
import { textoDaFalhaNoFormulario } from '../../acesso/falhasDeGravacao'
import type { DadosDoResponsavel, ResponsavelDoSetor } from '../../processos/tipos'
import {
  type CamposDoResponsavel, dadosDoResponsavel, problemaNoResponsavel,
} from '../../processos/validacaoDoResponsavel'

type FormularioDeResponsavelProps = {
  titulo: string
  inicial?: ResponsavelDoSetor
  aoSalvar: (dados: DadosDoResponsavel) => Promise<void>
  aoCancelar: () => void
}

// noValidate: as mensagens são as nossas (com o valor digitado), não as do navegador.
export function FormularioDeResponsavel({ titulo, inicial, aoSalvar, aoCancelar }: FormularioDeResponsavelProps) {
  const [campos, setCampos] = useState<CamposDoResponsavel>({
    nome: inicial?.nome ?? '', email: inicial?.email ?? '', cargo: inicial?.cargo ?? '',
  })
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const id = useId()
  const mudar = (campo: keyof CamposDoResponsavel) => (evento: ChangeEvent<HTMLInputElement>) =>
    setCampos({ ...campos, [campo]: evento.target.value })

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoResponsavel(campos)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoSalvar(dadosDoResponsavel(campos))
    } catch (erro) {
      setAviso(textoDaFalhaNoFormulario(erro))
    }
    setEnviando(false)
  }

  return (
    <form className="form-setor" aria-label={titulo} noValidate onSubmit={enviar}>
      <h4 className="form-setor-titulo">{titulo}</h4>
      <label htmlFor={`${id}-nome`}>Nome</label>
      <input id={`${id}-nome`} value={campos.nome} maxLength={200} autoComplete="off" onChange={mudar('nome')} />
      <label htmlFor={`${id}-email`}>E-mail</label>
      <input id={`${id}-email`} type="email" value={campos.email} maxLength={254} autoComplete="off"
        aria-describedby={aviso ? `${id}-aviso` : undefined} onChange={mudar('email')} />
      <label htmlFor={`${id}-cargo`}>Cargo</label>
      <input id={`${id}-cargo`} value={campos.cargo} maxLength={200} autoComplete="off" onChange={mudar('cargo')} />
      <div className="form-setor-botoes">
        <button type="submit" className="botao botao-principal" disabled={enviando}>Salvar</button>
        <button type="button" className="botao botao-secundario" onClick={aoCancelar}>Cancelar</button>
      </div>
      {aviso && <p id={`${id}-aviso`} className="cadastros-falha" role="alert">{aviso}</p>}
    </form>
  )
}
```

- [x] **Step 4: tabela.** `src/components/processos/TabelaDeResponsaveis.tsx`:

```tsx
import type { ResponsavelDoSetor } from '../../processos/tipos'

export type AcoesDoResponsavel = {
  aoEditar: (responsavel: ResponsavelDoSetor) => void
  aoExcluir: (responsavel: ResponsavelDoSetor) => void
}

type TabelaDeResponsaveisProps = { responsaveis: ResponsavelDoSetor[]; acoes?: AcoesDoResponsavel }

/** Responsáveis do setor; sem `acoes` é só leitura (Consulta). */
export function TabelaDeResponsaveis({ responsaveis, acoes }: TabelaDeResponsaveisProps) {
  if (responsaveis.length === 0) return <p className="cadastros-vazio">Nenhum responsável cadastrado ainda.</p>
  return (
    <table className="tabela-cadastros">
      <thead>
        <tr>
          <th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Cargo</th>
          {acoes && <th scope="col">Ações</th>}
        </tr>
      </thead>
      <tbody>
        {responsaveis.map((responsavel) => (
          <tr key={responsavel.id}>
            <td>{responsavel.nome}</td><td>{responsavel.email ?? '—'}</td><td>{responsavel.cargo ?? '—'}</td>
            {acoes && <td><BotoesDoResponsavel responsavel={responsavel} acoes={acoes} /></td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BotoesDoResponsavel({ responsavel, acoes }: { responsavel: ResponsavelDoSetor; acoes: AcoesDoResponsavel }) {
  return (
    <div className="acoes-do-responsavel">
      <button type="button" className="botao botao-secundario" aria-label={`Editar ${responsavel.nome}`}
        onClick={() => acoes.aoEditar(responsavel)}>Editar</button>
      <button type="button" className="botao botao-secundario" aria-label={`Excluir ${responsavel.nome}`}
        onClick={() => acoes.aoExcluir(responsavel)}>Excluir</button>
    </div>
  )
}
```

- [x] **Step 5: edição.** `src/components/processos/ResponsaveisEditaveis.tsx`:

```tsx
import { useState } from 'react'
import { CadastroInexistente } from '../../cadastros/cadastroInexistente'
import { useGravacaoComFalha } from '../../hooks/useGravacaoComFalha'
import type { DadosDoResponsavel, ModuloDeProcessos, ResponsavelDoSetor } from '../../processos/tipos'
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'
import { FormularioDeResponsavel } from './FormularioDeResponsavel'
import { TabelaDeResponsaveis } from './TabelaDeResponsaveis'

type Formulario = { tipo: 'novo' } | { tipo: 'editar'; responsavel: ResponsavelDoSetor }

type ResponsaveisEditaveisProps = {
  processos: ModuloDeProcessos
  setorId: string
  responsaveis: ResponsavelDoSetor[]
  aoMudar: () => void
}

/** A lista com Novo, Editar e Excluir (Administrador e Integrante). */
export function ResponsaveisEditaveis({ processos, setorId, responsaveis, aoMudar }: ResponsaveisEditaveisProps) {
  const [formulario, setFormulario] = useState<Formulario | null>(null)
  const [excluindo, setExcluindo] = useState<ResponsavelDoSetor | null>(null)
  // Responsável que sumiu (excluído por outra pessoa) não é falha: a lista recarrega sem ele.
  const { falha, executar } = useGravacaoComFalha(aoMudar)

  // Outra falha volta ao formulário, que a mostra e guarda os dados.
  async function salvar(dados: DadosDoResponsavel) {
    const editando = formulario?.tipo === 'editar' ? formulario.responsavel : null
    try {
      await (editando ? processos.editarResponsavel(editando.id, dados) : processos.criarResponsavel(setorId, dados))
    } catch (erro) {
      if (!(erro instanceof CadastroInexistente)) throw erro
    }
    setFormulario(null)
    aoMudar()
  }

  // A janela fecha antes de confirmar; o responsável lido aqui é o desta renderização, ainda preenchido.
  function excluir() {
    if (excluindo) executar(() => processos.excluirResponsavel(excluindo.id), aoMudar)
  }

  const editando = formulario?.tipo === 'editar' ? formulario.responsavel : undefined
  return (
    <>
      <TabelaDeResponsaveis responsaveis={responsaveis}
        acoes={{ aoEditar: (responsavel) => setFormulario({ tipo: 'editar', responsavel }), aoExcluir: setExcluindo }} />
      {falha && <p className="cadastros-falha" role="alert">{falha}</p>}
      {formulario
        ? <FormularioDeResponsavel key={editando?.id ?? 'novo'} titulo={editando ? 'Editar responsável' : 'Novo responsável'}
            inicial={editando} aoSalvar={salvar} aoCancelar={() => setFormulario(null)} />
        : <button type="button" className="botao botao-principal cadastros-novo"
            onClick={() => setFormulario({ tipo: 'novo' })}>Novo responsável</button>}
      <JanelaDeConfirmacao aberta={excluindo !== null} titulo={`Excluir o responsável ${excluindo?.nome ?? ''}?`}
        rotuloDaAcao="Excluir responsável" aoConfirmar={excluir} aoFechar={() => setExcluindo(null)} />
    </>
  )
}
```

- [x] **Step 6: seção e montagem.** `src/components/processos/ResponsaveisDoSetor.tsx`:

```tsx
import { useCallback } from 'react'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { ModuloDeProcessos } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'
import { ResponsaveisEditaveis } from './ResponsaveisEditaveis'
import { TabelaDeResponsaveis } from './TabelaDeResponsaveis'
import './Etapas.css'

type ResponsaveisDoSetorProps = { processos: ModuloDeProcessos; setorId: string; podeAlterar: boolean }

/** Seção "Responsáveis do setor" da tela do setor. Esconder os botões da Consulta é conveniência: quem protege é a RLS. */
export function ResponsaveisDoSetor({ processos, setorId, podeAlterar }: ResponsaveisDoSetorProps) {
  const ler = useCallback(() => processos.lerResponsaveisDoSetor(setorId), [processos, setorId])
  const { estado, tentarDeNovo, recarregar } = useCarregamento(ler)
  return (
    <section className="responsaveis-do-setor" aria-label="Responsáveis do setor">
      <h3 className="form-setor-titulo">Responsáveis do setor</h3>
      {estado.tipo === 'carregando' && <p className="cadastros-vazio" role="status">Carregando responsáveis…</p>}
      {estado.tipo === 'erro' && <ErroAoCarregar alvo="os responsáveis" aoTentarDeNovo={tentarDeNovo} />}
      {estado.tipo === 'pronto' && (podeAlterar
        ? <ResponsaveisEditaveis processos={processos} setorId={setorId} responsaveis={estado.valor} aoMudar={recarregar} />
        : <TabelaDeResponsaveis responsaveis={estado.valor} />)}
    </section>
  )
}
```

Em `src/components/cadastros/SetorAberto.tsx`: importar `ResponsaveisDoSetor` e trocar a constante `etapas` por `secoes`, com os responsáveis acima das etapas (o comentário passa a dizer "Responsáveis e etapas do setor ficam abaixo do que o setor já mostrava, para os dois modos."):

```tsx
  const secoes = (
    <>
      <ResponsaveisDoSetor processos={processos} setorId={id} podeAlterar={podeAlterar} />
      <EtapasDoSetor processos={processos} setorId={id} podeAlterar={podeAlterar} aoSumir={() => setSumiu(true)} />
    </>
  )
```

e usar `{secoes}` nos dois retornos.

Em `src/components/processos/Etapas.css`, trocar o seletor `.etapas-do-setor {` por `.responsaveis-do-setor,\n.etapas-do-setor {` e acrescentar:

```css
.acoes-do-responsavel {
  display: flex;
  gap: var(--esp-2);
}
```

- [x] **Step 7: ver passar.** `npx vitest run src/App.responsaveisDoSetor.test.tsx` → PASS; `npm test`, `npx tsc -b`, `npx eslint .` e `npx madge --circular --extensions ts,tsx src` limpos. Se um teste de tela antigo passar a achar dois `alert`/`status` (as duas seções), restringi-lo à região dele com `within`.

- [x] **Step 8: commit** "Ticket 03 de processos-etapas: responsáveis do setor na tela do setor".

---

### Task 5: Eventos dos responsáveis no Histórico da área Setores (critério 7)

**Files:**
- Modify: `src/cadastros/historicoSupabase.ts`, `src/cadastros/historicoSupabase.test.ts:22`, `src/cadastros/historicoDosCadastros.ts`, `src/cadastros/historicoDosCadastros.test.ts`, `src/App.historicoDosCadastros.test.tsx`

**Interfaces:**
- Consumes: eventos `responsavel_do_setor` (Task 1).

- [x] **Step 1: testes que falham.** Em `src/cadastros/historicoDosCadastros.test.ts`, no fim:

```ts
describe('responsáveis do setor', () => {
  const RESPONSAVEL = { setor_id: 's1', setor_sigla: 'CEE', nome: 'Pessoa Fictícia', email: 'pessoa@exemplo.com', cargo: null }
  const criado = evento({ entidade: 'responsavel_do_setor', entidadeRef: 's1:r1', depois: RESPONSAVEL })

  test('o item é o nome com a sigla, e os campos aparecem legíveis', () => {
    expect(nomeDoItem(criado)).toBe('Pessoa Fictícia — CEE')
    expect(descreverEstadoDoCadastro(RESPONSAVEL)).toBe('Setor: CEE; Nome: Pessoa Fictícia; E-mail: pessoa@exemplo.com; Cargo: —')
    expect(textoDaAcaoDoCadastro('criar', 'responsavel_do_setor')).toBe('Criou')
  })

  test('o evento entra no filtro pelo setor', () => {
    expect(itensDoFiltro([criado])).toEqual([{ id: 's1', nome: 'CEE' }])
    expect(eventosDoItem([criado], 's1')).toEqual([criado])
  })

  test('a exclusão do setor lista os responsáveis pelo nome', () => {
    expect(descreverEstadoDoCadastro({ sigla: 'CEE', responsaveis: [RESPONSAVEL, { nome: 'Outra Fictícia' }] }))
      .toBe('Sigla: CEE; Responsáveis: Pessoa Fictícia, Outra Fictícia')
    expect(descreverEstadoDoCadastro({ sigla: 'CEE', responsaveis: [] })).toBe('Sigla: CEE; Responsáveis: nenhum')
  })
})
```

Em `src/cadastros/historicoSupabase.test.ts:22`, a lista esperada passa a `['setor', 'macroprocesso', 'setor_envolvido', 'andamento', 'responsavel_do_setor']`.

Em `src/App.historicoDosCadastros.test.tsx`, no fim:

```tsx
test('os responsáveis do setor aparecem no Histórico e entram no filtro pelo setor', async () => {
  const RESPONSAVEL = { setor_id: 's1', setor_sigla: 'TSA', nome: 'Ana Teste', email: null, cargo: 'Chefe de Teste' }
  montar('consulta', [
    evento(9, { acao: 'criar', entidade: 'responsavel_do_setor', entidadeRef: 's1:r1', depois: RESPONSAVEL }),
    ...EVENTOS,
  ])
  const itens = await itensDaLista()
  expect(itens[0].textContent).toContain('Criou Ana Teste — TSA')
  expect(itens[0].textContent).toContain('Cargo: Chefe de Teste')
  fireEvent.change(screen.getByRole('combobox', { name: 'Item' }), { target: { value: 's1' } })
  expect(screen.getAllByRole('listitem')[0].textContent).toContain('Criou Ana Teste')
})
```

Run: `npx vitest run src/cadastros src/App.historicoDosCadastros.test.tsx` → FAIL.

- [x] **Step 2: implementação.**
  - `src/cadastros/historicoSupabase.ts`: `ENTIDADES_DOS_CADASTROS` ganha `'responsavel_do_setor'`; o comentário cita também etapas e responsáveis do setor.
  - `src/cadastros/historicoDosCadastros.ts`:
    - `ENTIDADES_QUE_LIGAM = new Set(['setor_envolvido', 'andamento', 'responsavel_do_setor'])`, com o comentário "Vínculos, etapas e responsáveis do setor têm a referência 'idA:idB'…".
    - `ROTULO_DO_CAMPO` ganha `email: 'E-mail', cargo: 'Cargo', responsaveis: 'Responsáveis'`.
    - Em `nomeDoItem`, depois da linha do `andamento`:

```ts
  if (evento.entidade === 'responsavel_do_setor' && typeof estado.nome === 'string') {
    return `${estado.nome} — ${texto(estado.setor_sigla)}`
  }
```

Se `nomeDoItem` passar de 20 linhas ou 10 caminhos (ESLint), extrair as linhas de `andamento` e `responsavel_do_setor` para `nomeDoItemDoSetor(evento, estado): string | null`, chamada no começo.

Run: o mesmo comando → PASS; `npm test`, `npx tsc -b`, `npx eslint .` limpos.

- [x] **Step 3: commit** "Ticket 03 de processos-etapas: responsáveis do setor no Histórico".

---

### Task 6: Fechamento do ticket

- [x] **Step 1: conferência final.** `npm test` (todos verdes), `npx tsc -b`, `npx eslint .`, `npx madge --circular --extensions ts,tsx src` limpos; "Testes de banco" verde na branch depois do último `git push`.
- [ ] **Step 2: conferência visual (critério 5).** Subir `npm run dev` em segundo plano e abrir pelo navegador do app; com login, olhar a tela de um setor: seção acima das etapas, tabela, formulário aberto, janela de exclusão e erro do e-mail. Se não houver login no navegador da sessão, pedir ao usuário que confira (como no ticket 02).
- [ ] **Step 3: integrar.** `git switch main`; `git merge --no-ff processos-etapas -m "Integra o ticket 03 de processos-etapas"`; `npm test`; `git branch -d processos-etapas`; `git push`. Conferir o "Testes de banco" disparado na `main` (o envio mexe em `supabase/`).
- [ ] **Step 4: marcas.** Seguir o fim do `/executar-complexo`: linha `Concluído em` no ticket, commit, apontar o próximo ticket (04, Cadastro de processos e quadro), notas do protocolo, avisar o usuário dos textos novos fora da spec ("O nome do responsável é obrigatório." e a janela sem texto de apoio) e o `/cost`.
