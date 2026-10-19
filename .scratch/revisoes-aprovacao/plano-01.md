# Ticket 01 de revisoes-aprovacao (Etapas protegidas e Revisão pelo setor com versão completa) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o catálogo recusa desativar/excluir a Revisão interna, a Revisão pelo setor e a Aprovação pelo setor; concluir a Revisão pelo setor exige a versão mais recente completa (.bpmn, .png e relatório), com a janela dizendo o que falta e o banco recusando por qualquer outro caminho; nasce o gatilho de conclusão em `andamentos` que os tickets 02 e 03 estendem.

**Architecture:** uma migração não destrutiva cria o gatilho de etapa protegida, duas funções `private` (versão mais recente e o que falta nela) e o gatilho `conferir_conclusao_da_etapa` em `andamentos`. A interface ganha `papeis` em `UltimaVersao` (lido junto com a versão mais recente), um módulo de frases, o bloqueio na `JanelaDeAvanco` e a mesma trava nas falsas (`ProcessosFalso`, `CatalogoFalso`).

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/revisoes-aprovacao/spec.md` (histórias 11, 12 e 26; regras "Concluir a `revisao_setor` exige a versão mais recente completa" e "Etapas … não se desativam nem se excluem"; "Decisões de implementação › Interface › Janela de concluir") · **Ticket:** `.scratch/revisoes-aprovacao/issues/01-etapas-protegidas-e-revisao-pelo-setor.md` (critérios citados como "critério N", na ordem do ticket) · ADRs 0009, 0012, 0014 e 0015.

## Global Constraints

- Regras de `.claude/regras/banco.md` que valem: teste antes da migração; migração por `npx supabase migration new`; função sem `security definer` (a RLS de quem chama decide: todo perfil ativo lê `versoes` e `arquivos_da_versao`), `search_path` vazio, execução tirada de `public` e `anon` e dada a `authenticated`; nada calculado é guardado (versão mais recente e "completa" são funções); migração não destrutiva; `10_privilegios_padrao`, `00_rls_ligada` e `01_buckets_privados` continuam passando (este ticket não cria tabela). Conferir o vínculo (`supabase/AMBIENTES.md`, dev `yclkzyoebpsxmgpbcbus`, e `supabase/.temp/project-ref`) antes do `db:types`.
- Rede do escritório: porta 5432 fechada. pgTAP e migração rodam **no GitHub Actions** ("Ajustes deste Projeto" do `CLAUDE.md`): `git push` da branch (sem `--force`), disparo de "Testes de banco" e de "Migrar banco de desenvolvimento" na branch e leitura do resultado dispensam autorização. Não há `gh`: os workflows se disparam pelo navegador do app (skill `anthropic-skills:built-in-browser`). Produção e `migration repair` só pelo `/ship`. A trava de git barra algumas formas combinadas: um comando por vez.
- `npm test` nunca depende do banco: telas com `AcessoFalso`, `CadastrosFalso`, `ProcessosFalso`, `CatalogoFalso`, `VersoesFalso`.
- ESLint no pre-commit: arquivo ≤ 300 linhas (`ProcessosFalso.ts` tem 288: a trava nova vai em `andamentoFalso.ts`, que tem 127); função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; sem `any`; no máximo 2 níveis de indentação. `tsc -b` e `madge --circular` limpos.
- Dados de teste inventados. Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado (cada commit leva cerca de 1 minuto).
- Frases literais da spec: "A V8 está sem relatório." (o que faltar) e a de processo sem versão (decisão abaixo).

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **"Versão mais recente" = a de maior número entre as não históricas**, a mesma que a trava do autor (ADR 0014) e `UltimaVersao` já usam. A spec diz "maior número do processo"; a histórica (V6F) só nasce antes da primeira versão nova, então a diferença só aparece num processo com só histórica, que nesta regra fica "sem versão" (a histórica pode ter só .bpm). Registrar no `desvios.md`.
- **Códigos das recusas (P0001):** `sem_versao` (sem valor), `versao_incompleta:<número>:<faltas>` (faltas em vírgulas, na ordem `bpmn,png,relatorio`) e `etapa_protegida:<nome>`.
- **Frases:** `A V8 está sem relatório.` · `A V8 está sem .png e relatório.` · `A V8 está sem .bpmn, .png e relatório.` · `O processo ainda não tem versão enviada.` · `A etapa Revisão interna é obrigatória no fluxo: não pode ser desativada nem excluída.`
- **Gatilho de conclusão genérico:** `private.conferir_conclusao_da_etapa()` (antes de alterar `status` em `andamentos`) age só quando o status passa a `concluida`; despacha pelo `codigo` da etapa. Neste ticket só a `revisao_setor` tem conferência (`private.conferir_versao_completa`); os tickets 02 e 03 acrescentam as outras. "Realizada anteriormente" e dispensar não passam por ele (status diferente de `concluida`).
- **O nome do gatilho de etapa protegida** é `bloquear_etapa_protegida`: vem antes de `conferir_etapa_nunca_usada` na ordem alfabética, então a recusa de uma etapa protegida já usada é a de protegida, não a de "usada".
- **A janela só bloqueia o Concluir** da `revisao_setor` (Dispensar e "Realizada anteriormente" seguem como hoje). Sem etapa pendente depois, o Concluir grava direto sem janela: a recusa vem do banco, como frase em vermelho (critério 4, "recusa que vem do banco por outro caminho").
- **A falsa de processos imita a trava com `ultimaVersao.papeis`**, que o teste de tela preenche. O spec fala em a falsa de processos consultar a falsa de versões; aqui a consulta é o dado que a leitura do processo já traz (`ultimaVersao`), igual ao que o módulo real lê. Registrar no `desvios.md`.
- **Fixtures de teste que concluem a Revisão pelo setor** pela tela ou pela falsa passam a montar `ultimaVersao` completa (`papeis: ['bpmn', 'png', 'relatorio']`); o `npm test` indica quais.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/38_etapas_protegidas_e_revisao_do_setor.test.sql` (novo) | pgTAP: etapas protegidas e conclusão da Revisão pelo setor |
| `supabase/migrations/<data>_etapas_protegidas_e_revisao_do_setor.sql` (novo) | gatilhos e funções |
| `supabase/AMBIENTES.md` · `src/types/database.ts` | registro da migração · tipos gerados |
| `src/processos/frasesDaVersaoCompleta.ts` (+ teste, novo) | faltas da versão e frases |
| `src/processos/frasesDoCatalogo.ts` | frase da etapa protegida |
| `src/processos/tipos.ts` | `UltimaVersao.papeis` |
| `src/processos/lerProcessoSupabase.ts` (+ teste) | lê os papéis dos arquivos da versão mais recente |
| `src/processos/andamentosSupabase.ts` (+ teste) | três códigos novos |
| `src/processos/andamentoFalso.ts` · `ProcessosFalso.ts` (+ testes) | trava na conclusão |
| `src/processos/CatalogoFalso.ts` (+ teste) | trava de desativar e excluir |
| `src/components/processos/JanelaDeAvanco.tsx` · `JanelasDaEtapa.tsx` | bloqueio com a frase |
| `src/App.revisaoDoSetor.test.tsx` (novo) · `src/App.catalogoDeEtapas.test.tsx` | testes de tela |

---

### Task 1: Banco: etapas protegidas e conclusão da Revisão pelo setor (critério 1)

**Files:**
- Create: `supabase/tests/38_etapas_protegidas_e_revisao_do_setor.test.sql`, `supabase/migrations/<data>_etapas_protegidas_e_revisao_do_setor.sql`
- Modify: `supabase/AMBIENTES.md`, `src/types/database.ts` (regenerado)

**Interfaces:**
- Produces: `private.id_da_versao_mais_recente(p_processo uuid) returns uuid`; `private.papeis_que_faltam(p_versao uuid) returns text[]`; `private.conferir_versao_completa(p_processo uuid) returns void`; gatilhos `bloquear_etapa_protegida` (em `etapas`) e `conferir_conclusao_da_etapa` (em `andamentos`). Recusas `etapa_protegida:<nome>`, `sem_versao`, `versao_incompleta:<n>:<faltas>`.

- [ ] **Step 0: Conferir o alvo e ler `.claude/regras/banco.md`** (já lido nesta sessão). `supabase/AMBIENTES.md` "vínculo atual" = `yclkzyoebpsxmgpbcbus` (dev). Árvore sem mudança real (o `database.ts` só difere por fim de linha).

- [ ] **Step 1: Criar a branch e o marco.** `git switch -c revisoes-aprovacao-01`; marco `marco/2026-10-19-inicio-ticket-01-revisoes-aprovacao` (`git tag`), e `git push origin "refs/tags/marco/*:refs/tags/marco/*"` depois.

- [ ] **Step 2: Escrever o teste que falha** em `supabase/tests/38_etapas_protegidas_e_revisao_do_setor.test.sql`. Cabeçalho, usuários, setor, macroprocesso e os auxiliares `andamento`, `agir`, `status`, `processo`, `arquivo`, `par`, `enviar` são os de `36_trava_do_autor.test.sql` (linhas 1 a 83), com estas mudanças: `plan(30)`; sufixos `T38`/`...38` no lugar de `T14`/`...14` (setor `5f000000-0000-0000-0000-000000000038`, macro `af000000-...-000000000038`); processos `array['Sem Versao', 'Sem Relatorio', 'Sem Png', 'Completa', 'Nova Na Etapa', 'Realizada']`. Depois do cabeçalho, acrescentar o auxiliar que leva o processo até a Revisão pelo setor em andamento e o corpo do teste:

```sql
-- Leva o processo até a Revisão pelo setor em andamento (as etapas 1 a 3 resolvidas, como a2).
create function pg_temp.ate_a_revisao_do_setor(nome_do_processo text) returns void
language plpgsql as $$
declare
  codigo text;
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_setor', 'em_andamento');
end $$;
grant execute on function pg_temp.ate_a_revisao_do_setor(text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

-- ===== Etapas protegidas (administrador a1; integrante a2 não mexe no catálogo) =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'revisao_interna'$sql$,
  'P0001', 'etapa_protegida:Revisão interna', 'desativar a Revisão interna é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'revisao_setor'$sql$,
  'P0001', 'etapa_protegida:Revisão pelo setor', 'desativar a Revisão pelo setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$update public.etapas set ativa = false where codigo = 'aprovacao_setor'$sql$,
  'P0001', 'etapa_protegida:Aprovação pelo setor', 'desativar a Aprovação pelo setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'revisao_interna'$sql$,
  'P0001', 'etapa_protegida:Revisão interna', 'excluir a Revisão interna é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'revisao_setor'$sql$,
  'P0001', 'etapa_protegida:Revisão pelo setor', 'excluir a Revisão pelo setor é recusado');
insert into _tap (linha) select throws_ok(
  $sql$delete from public.etapas where codigo = 'aprovacao_setor'$sql$,
  'P0001', 'etapa_protegida:Aprovação pelo setor', 'excluir a Aprovação pelo setor é recusado');
insert into _tap (linha) select lives_ok(
  $sql$update public.etapas set nome = 'Revisão interna (EP)' where codigo = 'revisao_interna'$sql$,
  'renomear a Revisão interna continua aceito');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_etapa((select id from public.etapas where codigo = 'revisao_setor'), 'subir')$sql$,
  'mover a Revisão pelo setor continua aceito');
insert into _tap (linha) select lives_ok(
  $sql$select public.mover_etapa((select id from public.etapas where codigo = 'revisao_setor'), 'descer')$sql$,
  'mover de volta');
insert into _tap (linha) select is(
  (select count(*)::int from public.etapas where codigo in ('revisao_interna', 'revisao_setor', 'aprovacao_setor') and ativa), 3,
  'as três etapas continuam ativas');
insert into _tap (linha) select lives_ok(
  $sql$update public.etapas set nome = 'Revisão interna' where codigo = 'revisao_interna'$sql$, 'devolve o nome');

-- ===== Concluir a Revisão pelo setor (integrante a2) =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);

-- Sem Versao: nenhuma versão.
select pg_temp.ate_a_revisao_do_setor('Sem Versao');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Sem Versao', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'sem_versao', 'concluir a Revisão pelo setor sem versão é recusado');
insert into _tap (linha) select is(pg_temp.status('Sem Versao', 'revisao_setor'), 'em_andamento'::public.status_da_etapa,
  'a recusa deixa a etapa em andamento');

-- Sem Relatorio: a V1 tem .bpmn e .png, sem relatório.
select pg_temp.enviar('Sem Relatorio');
select pg_temp.ate_a_revisao_do_setor('Sem Relatorio');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Sem Relatorio', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'versao_incompleta:1:relatorio', 'concluir com a versão sem relatório é recusado, com o que falta');
insert into _tap (linha) select throws_ok(
  $sql$select public.avancar_etapa(pg_temp.andamento('Sem Relatorio', 'revisao_setor'), 'concluir', null, null)$sql$,
  'P0001', 'versao_incompleta:1:relatorio', 'o avanço direto também é recusado');

-- Sem Png: a V1 perde o .png (apagado pelo dono do banco; a função de envio não deixa criar versão sem ele).
select pg_temp.enviar('Sem Png');
select pg_temp.ate_a_revisao_do_setor('Sem Png');
reset role;
delete from public.arquivos_da_versao
where papel = 'png' and versao_id = (select id from public.versoes where processo_id = pg_temp.processo('Sem Png'));
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Sem Png', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'versao_incompleta:1:png,relatorio', 'concluir com a versão sem .png e sem relatório é recusado, com os dois');

-- Completa: a V1 recebe o relatório.
select pg_temp.enviar('Completa');
select public.acrescentar_relatorio(
  (select id from public.versoes where processo_id = pg_temp.processo('Completa')), 1, pg_temp.arquivo('relatorio', 'docx'));
select pg_temp.ate_a_revisao_do_setor('Completa');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('Completa', 'revisao_setor', 'concluida')$sql$, 'concluir com a versão completa é aceito');
insert into _tap (linha) select is(pg_temp.status('Completa', 'revisao_setor'), 'concluida'::public.status_da_etapa,
  'a Revisão pelo setor fica concluída');

-- Nova Na Etapa: a V1 completa, a V2 (enviada na própria etapa) sem relatório, depois com relatório.
select pg_temp.enviar('Nova Na Etapa');
select public.acrescentar_relatorio(
  (select id from public.versoes where processo_id = pg_temp.processo('Nova Na Etapa') and numero = 1), 1,
  pg_temp.arquivo('relatorio', 'docx'));
select pg_temp.ate_a_revisao_do_setor('Nova Na Etapa');
select pg_temp.enviar('Nova Na Etapa');
insert into _tap (linha) select throws_ok(
  $sql$select pg_temp.agir('Nova Na Etapa', 'revisao_setor', 'concluida')$sql$,
  'P0001', 'versao_incompleta:2:relatorio', 'a V2 sem relatório barra, mesmo com a V1 completa');
select public.acrescentar_relatorio(
  (select id from public.versoes where processo_id = pg_temp.processo('Nova Na Etapa') and numero = 2), 2,
  pg_temp.arquivo('relatorio', 'docx'));
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('Nova Na Etapa', 'revisao_setor', 'concluida')$sql$,
  'com a V2 completa, enviada na própria etapa, concluir é aceito');

-- Realizada: "realizada anteriormente" e dispensar não dependem de versão (a etapa é obrigatória: só dispensar é recusado).
select pg_temp.ate_a_revisao_do_setor('Realizada');
insert into _tap (linha) select lives_ok(
  $sql$select pg_temp.agir('Realizada', 'revisao_setor', 'realizada_anteriormente', 'Feita antes')$sql$,
  'registrar como realizada anteriormente é aceito sem versão');
insert into _tap (linha) select is(pg_temp.status('Realizada', 'revisao_setor'), 'realizada_anteriormente'::public.status_da_etapa,
  'a etapa fica realizada anteriormente');

-- Visitante e consulta não concluem nada (já cobertos pelos testes 18 e 35); aqui só as funções e o gatilho.
reset role;
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'conferir_conclusao_da_etapa' and tgrelid = 'public.andamentos'::regclass), 1,
  'existe o gatilho de conclusão em andamentos');
insert into _tap (linha) select is(
  (select count(*)::int from pg_trigger where tgname = 'bloquear_etapa_protegida' and tgrelid = 'public.etapas'::regclass), 1,
  'existe o gatilho de etapa protegida em etapas');
insert into _tap (linha) select is(
  (select prosecdef from pg_proc where proname = 'conferir_conclusao_da_etapa' and pronamespace = 'private'::regnamespace), false,
  'o gatilho de conclusão não é security definer');
insert into _tap (linha) select is(
  has_function_privilege('anon', 'private.papeis_que_faltam(uuid)', 'execute'), false,
  'o visitante não executa a função de papéis que faltam');
insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

Contar as asserções e ajustar o `plan(N)` ao número real (o `finish()` acusa a diferença). Se o `reset role` seguido de `set local role authenticated` perder o `request.jwt.claims`, o teste já o redefine logo depois (como acima).

- [ ] **Step 3: Rodar para ver falhar.** `git add supabase/tests/38_*.sql`, commit "Ticket 01 de revisoes-aprovacao: teste de banco das etapas protegidas e da Revisão pelo setor", `git push -u origin revisoes-aprovacao-01`, disparar "Testes de banco" na branch (navegador do app) e ler o resultado. Esperado: o 38 falha (gatilhos inexistentes: as recusas não vêm e `concluir` passa); os outros arquivos ficam verdes. Se algum teste antigo já concluía a Revisão pelo setor (`concluida`) e vai falhar depois da migração, anotar para o Step 5.

- [ ] **Step 4: Escrever a migração.** `npx supabase migration new etapas_protegidas_e_revisao_do_setor`, com:

```sql
-- Etapas protegidas e Revisão pelo setor com versão completa (revisoes-aprovacao, ticket 01; ADR 0015). Não destrutiva:
-- gatilhos e funções novos. As recusas chegam à interface como "motivo:valor" em P0001
-- (src/processos/andamentosSupabase.ts). Sem security definer: a RLS de quem chama decide (todo perfil ativo lê versões).

-- A versão mais recente é a não histórica de maior número (a mesma da trava do autor, ADR 0014); null sem versão.
create function private.id_da_versao_mais_recente(p_processo uuid) returns uuid
language sql stable set search_path = ''
as $$
  select id from public.versoes where processo_id = p_processo and not historica order by numero desc limit 1 $$;

-- Os papéis que a versão completa exige e ela ainda não tem, na ordem em que a frase os lista.
create function private.papeis_que_faltam(p_versao uuid) returns text[]
language sql stable set search_path = ''
as $$
  select coalesce(array_agg(exigido.papel order by exigido.ordem), '{}')
  from (values ('bpmn', 1), ('png', 2), ('relatorio', 3)) as exigido (papel, ordem)
  where not exists (
    select 1 from public.arquivos_da_versao a where a.versao_id = p_versao and a.papel::text = exigido.papel) $$;

-- Recusa a conclusão sem versão ou com a versão mais recente incompleta, com o número e o que falta.
create function private.conferir_versao_completa(p_processo uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  versao uuid := private.id_da_versao_mais_recente(p_processo);
  faltas text[];
begin
  if versao is null then
    raise exception 'sem_versao';
  end if;
  faltas := private.papeis_que_faltam(versao);
  if cardinality(faltas) > 0 then
    raise exception 'versao_incompleta:%:%', (select numero from public.versoes where id = versao), array_to_string(faltas, ',');
  end if;
end $$;

-- A conclusão de uma etapa (só quando o status passa a concluída). Aqui só a Revisão pelo setor tem conferência; os
-- tickets 02 e 03 acrescentam a Revisão interna e a Aprovação pelo setor.
create function private.conferir_conclusao_da_etapa() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.status <> 'concluida' or old.status = 'concluida' then
    return new;
  end if;
  if (select codigo from public.etapas where id = new.etapa_id) = 'revisao_setor' then
    perform private.conferir_versao_completa(new.processo_id);
  end if;
  return new;
end $$;

create trigger conferir_conclusao_da_etapa before update of status on public.andamentos
  for each row execute function private.conferir_conclusao_da_etapa();

-- As três etapas de revisão e aprovação não saem do catálogo (renomear e mover continuam). O nome do gatilho vem antes
-- de conferir_etapa_nunca_usada na ordem alfabética, para a recusa ser a de etapa protegida mesmo com a etapa em uso.
create function private.bloquear_etapa_protegida() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if old.codigo not in ('revisao_interna', 'revisao_setor', 'aprovacao_setor') then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' or (old.ativa and not new.ativa) then
    raise exception 'etapa_protegida:%', old.nome;
  end if;
  return new;
end $$;

create trigger bloquear_etapa_protegida before delete or update of ativa on public.etapas
  for each row execute function private.bloquear_etapa_protegida();

revoke execute on function private.id_da_versao_mais_recente(uuid), private.papeis_que_faltam(uuid),
  private.conferir_versao_completa(uuid), private.conferir_conclusao_da_etapa(), private.bloquear_etapa_protegida()
  from public, anon;
grant execute on function private.id_da_versao_mais_recente(uuid), private.papeis_que_faltam(uuid),
  private.conferir_versao_completa(uuid), private.conferir_conclusao_da_etapa(), private.bloquear_etapa_protegida()
  to authenticated;
```

- [ ] **Step 5: Aplicar e testar.** Commit da migração; `git push`; disparar "Migrar banco de desenvolvimento" na branch (informar a migração; o vínculo é o dev) e depois "Testes de banco". Esperado: os 38 arquivos verdes. Se um teste antigo (17 a 37) concluir a Revisão pelo setor por `concluida`/`avancar_etapa` e falhar com `sem_versao`, ajustá-lo para montar uma versão completa antes (`registrar_versao` + `acrescentar_relatorio`, como o 38) e repetir. Se o 38 falhar por montagem do próprio teste, corrigir o teste.

- [ ] **Step 6: Tipos e registro.** `npm run db:types` (vínculo conferido; porta 443), confirmar que só mudou o fim de linha (nenhuma função pública nova: o `Functions` não muda); se o `database.ts` ficar modificado só por CRLF, `git restore` fica bloqueado — guardar cópia antes e restaurar a cópia. Acrescentar o registro em `supabase/AMBIENTES.md` (migração, teste 38 falhou antes e passou depois, números dos workflows) e comitar: "Ticket 01 de revisoes-aprovacao: migração das etapas protegidas e da Revisão pelo setor".

---

### Task 2: Frases e leitura dos arquivos da versão mais recente (critérios 2 e 4)

**Files:**
- Create: `src/processos/frasesDaVersaoCompleta.ts`, `src/processos/frasesDaVersaoCompleta.test.ts`
- Modify: `src/processos/tipos.ts` (`UltimaVersao`), `src/processos/lerProcessoSupabase.ts`, `src/processos/lerProcessoSupabase.test.ts`, `src/processos/andamentosSupabase.ts`, `src/processos/andamentosSupabase.test.ts`, `src/processos/frasesDoCatalogo.ts`, fixtures que montam `UltimaVersao` (`App.agoraDoVerso.test.tsx`, `App.arrastarParaConcluir.test.tsx`, `App.assumirEAutor.test.tsx`, `processos/andamentoFalso.test.ts`, `processos/caminhoDeEtapas.test.ts`, `processos/ProcessosFalso.avanco.test.ts`, `processos/ProcessosFalso.voltar.test.ts`)

**Interfaces:**
- Produces: `PapelDoArquivo` (de `../versoes/tipos`); `UltimaVersao = { numero: number; autorId: string; autorNome: string; papeis: PapelDoArquivo[] }`; `faltasDaVersao(papeis: PapelDoArquivo[]): PapelDoArquivo[]`; `fraseDaVersaoIncompleta(numero: number | string, faltas: string[]): string`; `FRASE_SEM_VERSAO: string`; `fraseDoBloqueioDaConclusao(ultima: UltimaVersao | null): string | null`; `fraseDaEtapaProtegida(nome: string): string` (em `frasesDoCatalogo.ts`).

- [ ] **Step 1: Teste que falha** `src/processos/frasesDaVersaoCompleta.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { FRASE_SEM_VERSAO, faltasDaVersao, fraseDaVersaoIncompleta, fraseDoBloqueioDaConclusao } from './frasesDaVersaoCompleta'

describe('frasesDaVersaoCompleta', () => {
  it('lista o que falta na ordem .bpmn, .png e relatório', () => {
    expect(faltasDaVersao(['relatorio', 'bpm'])).toEqual(['bpmn', 'png'])
    expect(faltasDaVersao(['bpmn', 'png', 'relatorio'])).toEqual([])
  })

  it('escreve a frase com um, dois ou três itens', () => {
    expect(fraseDaVersaoIncompleta(8, ['relatorio'])).toBe('A V8 está sem relatório.')
    expect(fraseDaVersaoIncompleta('8', ['png', 'relatorio'])).toBe('A V8 está sem .png e relatório.')
    expect(fraseDaVersaoIncompleta(8, ['bpmn', 'png', 'relatorio'])).toBe('A V8 está sem .bpmn, .png e relatório.')
  })

  it('sem versão, a frase manda enviar uma; com versão completa, não há bloqueio', () => {
    expect(fraseDoBloqueioDaConclusao(null)).toBe(FRASE_SEM_VERSAO)
    expect(fraseDoBloqueioDaConclusao({ numero: 3, autorId: 'u', autorNome: 'Ana', papeis: ['bpmn', 'png', 'relatorio'] })).toBeNull()
    expect(fraseDoBloqueioDaConclusao({ numero: 3, autorId: 'u', autorNome: 'Ana', papeis: ['bpmn', 'png'] })).toBe('A V3 está sem relatório.')
  })
})
```

Rodar `npx vitest run src/processos/frasesDaVersaoCompleta.test.ts` → FALHA (módulo inexistente).

- [ ] **Step 2: Implementar** `src/processos/frasesDaVersaoCompleta.ts`:

```ts
import type { PapelDoArquivo } from '../versoes/tipos'
import type { UltimaVersao } from './tipos'

/** Os papéis que a versão completa exige, na ordem em que a frase os lista (a mesma do banco). */
const EXIGIDOS = ['bpmn', 'png', 'relatorio'] as const
const ROTULO: Record<string, string> = { bpmn: '.bpmn', png: '.png', relatorio: 'relatório' }

export const FRASE_SEM_VERSAO = 'O processo ainda não tem versão enviada.'

export function faltasDaVersao(papeis: PapelDoArquivo[]): PapelDoArquivo[] {
  return EXIGIDOS.filter((papel) => !papeis.includes(papel))
}

/** "A V8 está sem relatório.": o número e os papéis que faltam, como o banco os manda (nomes de papel). */
export function fraseDaVersaoIncompleta(numero: number | string, faltas: string[]): string {
  const rotulos = faltas.map((papel) => ROTULO[papel] ?? papel)
  const lista = rotulos.length > 1 ? `${rotulos.slice(0, -1).join(', ')} e ${rotulos[rotulos.length - 1]}` : rotulos[0]
  return `A V${numero} está sem ${lista}.`
}

/** O que a janela de concluir a Revisão pelo setor mostra no lugar do botão; null quando a versão está completa. */
export function fraseDoBloqueioDaConclusao(ultima: UltimaVersao | null): string | null {
  if (ultima === null) return FRASE_SEM_VERSAO
  const faltas = faltasDaVersao(ultima.papeis)
  return faltas.length === 0 ? null : fraseDaVersaoIncompleta(ultima.numero, faltas)
}
```

- [ ] **Step 3: `UltimaVersao.papeis`.** Em `src/processos/tipos.ts` trocar a linha 114 por `export type UltimaVersao = { numero: number; autorId: string; autorNome: string; papeis: PapelDoArquivo[] }` e importar `PapelDoArquivo` de `../versoes/tipos`; atualizar o comentário ("e os papéis dos arquivos dela"). Nas fixtures listadas acrescentar `papeis: ['bpmn', 'png']` (o `tsc -b` aponta cada uma). Rodar `npx tsc -b` até limpar.

- [ ] **Step 4: Frase do catálogo.** Em `frasesDoCatalogo.ts` acrescentar:

```ts
export function fraseDaEtapaProtegida(nome: string): string {
  return `A etapa ${nome} é obrigatória no fluxo: não pode ser desativada nem excluída.`
}
```

- [ ] **Step 5: Leitura real.** Teste primeiro em `lerProcessoSupabase.test.ts` (seguir o cliente simulado que o arquivo já usa para `versoes`): a linha da versão passa a trazer `arquivos: [{ papel: 'bpmn' }, { papel: 'png' }]` e o esperado é `ultimaVersao.papeis` igual a `['bpmn', 'png']`; um caso sem arquivos dá `[]`. Rodar → FALHA. Implementar em `lerUltimaVersao`: `select('numero, enviada_por, autor:usuarios(nome), arquivos:arquivos_da_versao(papel)')`, tipo da linha com `arquivos: { papel: PapelDoArquivo }[]` e retorno `{ ..., papeis: ultima.arquivos.map((arquivo) => arquivo.papel) }`. Rodar → PASSA.

- [ ] **Step 6: Códigos de recusa.** Teste primeiro em `andamentosSupabase.test.ts` (seguir os casos de `autor_da_versao`): `concluirEtapa` com erro P0001 `versao_incompleta:8:relatorio` rejeita com `TravaDoBanco` "A V8 está sem relatório."; `sem_versao` → `FRASE_SEM_VERSAO`; `etapa_protegida:Revisão interna` (via `catalogoSupabase.test.ts`, `desativarEtapa`) → `fraseDaEtapaProtegida('Revisão interna')`. Rodar → FALHA. Implementar em `andamentosSupabase.ts`: incluir `sem_versao|versao_incompleta|etapa_protegida` no `PADRAO_DA_RECUSA` e no `FRASE_DA_RECUSA`:

```ts
  sem_versao: () => FRASE_SEM_VERSAO,
  versao_incompleta: (valor) => {
    const [numero, faltas] = valor.split(':')
    return fraseDaVersaoIncompleta(numero, faltas.split(','))
  },
  etapa_protegida: fraseDaEtapaProtegida,
```

(importar de `./frasesDaVersaoCompleta` e `./frasesDoCatalogo`). Se a função ficar com complexidade acima do limite, o objeto não conta; a regex é uma constante. Rodar → PASSA.

- [ ] **Step 7: Rodar `npm test` (os novos e as fixtures) e comitar:** "Ticket 01 de revisoes-aprovacao: frases e leitura dos arquivos da versão mais recente".

---

### Task 3: As falsas imitam a trava (critério 4)

**Files:**
- Modify: `src/processos/andamentoFalso.ts`, `src/processos/ProcessosFalso.ts`, `src/processos/CatalogoFalso.ts`, `src/processos/ProcessosFalso.avanco.test.ts`, `src/processos/CatalogoFalso.test.ts`

**Interfaces:**
- Consumes: `fraseDoBloqueioDaConclusao`, `fraseDaEtapaProtegida`, `UltimaVersao.papeis`.
- Produces: `conferirVersaoDaRevisaoDoSetor(etapa: EtapaDoCaminho, ultimaVersao: UltimaVersao | null): void` em `andamentoFalso.ts` (lança `TravaDoBanco` com a frase quando a etapa é a `revisao_setor` e a versão está incompleta ou ausente); `CatalogoFalso` recusa `desativarEtapa` e `excluirEtapa` das três etapas protegidas (códigos `revisao_interna`, `revisao_setor`, `aprovacao_setor`).

- [ ] **Step 1: Testes que falham.** Em `ProcessosFalso.avanco.test.ts` (seguir o `describe` existente, com um processo cuja Revisão pelo setor está em andamento e a seguinte pendente): (a) `concluirEtapa` com `ultimaVersao: null` rejeita com `TravaDoBanco` de mensagem `FRASE_SEM_VERSAO`; (b) com `papeis: ['bpmn', 'png']` rejeita "A V3 está sem relatório." e a etapa continua em andamento; (c) com `papeis: ['bpmn', 'png', 'relatorio']` conclui e inicia a próxima; (d) `registrarRealizadaAnteriormente` passa sem versão. Em `CatalogoFalso.test.ts`: `desativarEtapa` e `excluirEtapa` de cada uma das três etapas rejeitam com a frase de `fraseDaEtapaProtegida` e a lista não muda; renomear e mover seguem. Rodar → FALHAM.

- [ ] **Step 2: Implementar.** `andamentoFalso.ts`:

```ts
const CODIGO_DA_REVISAO_DO_SETOR = 'revisao_setor'

/** Como o gatilho do banco: concluir a Revisão pelo setor exige a versão mais recente completa. */
export function conferirVersaoDaRevisaoDoSetor(etapa: EtapaDoCaminho, ultimaVersao: UltimaVersao | null): void {
  if (etapa.codigo !== CODIGO_DA_REVISAO_DO_SETOR) return
  const frase = fraseDoBloqueioDaConclusao(ultimaVersao)
  if (frase !== null) throw new TravaDoBanco(frase)
}
```

(importar `fraseDoBloqueioDaConclusao`). Em `ProcessosFalso.avancar` chamar, depois de `conferirAvanco(...)` e antes de `conferirAutorDaProxima`: `if (chamada.acao === 'concluir') conferirVersaoDaRevisaoDoSetor(etapa, this.processoDaEtapa(chamada.id).ultimaVersao)`. Manter `ProcessosFalso.ts` ≤ 300 linhas (hoje 288). `CatalogoFalso`: uma constante `PROTEGIDAS = ['revisao_interna', 'revisao_setor', 'aprovacao_setor']` e um método privado `conferirNaoProtegida(etapa)` chamado no começo de `desativarEtapa` e `excluirEtapa` (antes da recusa de "usada"), lançando `new TravaDoBanco(fraseDaEtapaProtegida(etapa.nome))`. Rodar os testes → PASSAM.

- [ ] **Step 3: `npm test` completo.** Quem concluir a Revisão pelo setor pela falsa sem `papeis` completos agora falha: ajustar essas fixtures (o `npm test` mostra quais; só concluem a etapa `revisao_setor` por `concluida`) com `ultimaVersao: { ..., papeis: ['bpmn', 'png', 'relatorio'] }`. Comitar: "Ticket 01 de revisoes-aprovacao: as falsas imitam a trava".

---

### Task 4: A janela de concluir diz o que falta (critérios 2 a 4)

**Files:**
- Modify: `src/components/processos/JanelaDeAvanco.tsx`, `src/components/processos/JanelasDaEtapa.tsx`
- Create: `src/App.revisaoDoSetor.test.tsx`
- Modify: `src/App.catalogoDeEtapas.test.tsx`

**Interfaces:**
- Consumes: `fraseDoBloqueioDaConclusao`.
- Produces: `JanelaDeAvanco` ganha a prop opcional `bloqueio?: string | null` (a frase; com ela o botão principal fica desabilitado e a frase aparece em `role="alert"` acima das opções).

- [ ] **Step 1: Ler os testes de tela vizinhos** (`App.avancoDaEtapa.test.tsx`, `App.arrastarParaConcluir.test.tsx`, `App.assumirEAutor.test.tsx`) e copiar o `renderizar`/montagem do aplicativo inteiro com `AcessoFalso`, `CadastrosFalso`, `ProcessosFalso` e `VersoesFalso`. Escrever `src/App.revisaoDoSetor.test.tsx` com um processo cuja Revisão pelo setor (etapa 4) está em andamento e a Aprovação pelo setor (5) pendente, e os casos:
  1. Pelo [Concluir] do Agora, com `ultimaVersao` V8 com `papeis: ['bpmn', 'png']`: a janela mostra "A V8 está sem relatório." e o botão "Concluir e iniciar Aprovação pelo setor" está desabilitado; clicar não grava (`processos.chamadas` vazio).
  2. Pelo arrastar do cartão no Quadro para a coluna seguinte (seguir `App.arrastarParaConcluir`): a mesma janela, a mesma frase, botão desabilitado.
  3. `ultimaVersao: null`: "O processo ainda não tem versão enviada."
  4. V8 só com `['bpmn']`: "A V8 está sem .png e relatório."
  5. Versão completa (`['bpmn','png','relatorio']`): sem frase, botão habilitado; confirmar conclui e a Aprovação pelo setor entra em andamento (como hoje).
  6. Recusa que vem do banco por outro caminho: Revisão pelo setor com a janela aberta com versão completa, e `processos.falhaDeGravacao = new TravaDoBanco('A V8 está sem relatório.')`; ao confirmar, a frase aparece em vermelho (`role="alert"`, como as outras falhas de gravação) e a etapa continua em andamento.
  7. Dispensar/"Realizada anteriormente" na Revisão pelo setor com versão incompleta não é bloqueado (a janela da nota abre e grava).
  8. Concluir a Revisão interna com versão sem relatório continua como hoje (o bloqueio é só da `revisao_setor`).
  Rodar `npx vitest run src/App.revisaoDoSetor.test.tsx` → os casos 1 a 4 FALHAM (sem bloqueio na janela).

- [ ] **Step 2: Implementar a janela.** `JanelaDeAvanco.tsx`: prop `bloqueio?: string | null`; `const pronta = !comNota || nota.trim() !== ''` vira `const pronta = (!comNota || nota.trim() !== '') && !bloqueio`; acima do `EscolhaDoResponsavel`, `{bloqueio && <p role="alert" className="janela-aviso-vermelho">{bloqueio}</p>}` — usar a classe de aviso que `JanelaComCampo`/`JanelaDeReclassificacao` já usam para a falha em vermelho (conferir o nome em `JanelaDeConfirmacao.css`; se não houver, reaproveitar a classe de erro das janelas). O `confirmar()` já ignora quando `!pronta`. `JanelasDaEtapa.tsx`, em `JanelaDoAvancoDaEtapa`:

```tsx
  const bloqueio = acao === 'concluir' && etapa.codigo === 'revisao_setor' ? fraseDoBloqueioDaConclusao(ultimaVersao) : null
  ...
  <JanelaDeAvanco ... bloqueio={bloqueio} />
```

(importar de `../../processos/frasesDaVersaoCompleta`). Rodar o arquivo → PASSA. O arrastar usa `useConclusaoPeloQuadro`, que já lê `lerProcesso(...).ultimaVersao`: nada a mudar lá (confirmar pelo caso 2).

- [ ] **Step 3: Catálogo na Administração.** Em `App.catalogoDeEtapas.test.tsx` (seguir os casos de "Desativar"/"Excluir" já existentes): com o catálogo da falsa tendo a Revisão interna, ao desativar e ao excluir ela, a frase "A etapa Revisão interna é obrigatória no fluxo: não pode ser desativada nem excluída." aparece em vermelho na administração, e a etapa continua na lista; renomear segue aceito. Se a tela já mostra a `TravaDoBanco` da falsa (como mostra a de "etapa usada"), o teste passa só com o Task 3; senão, ajustar o componente da administração para exibir a mensagem (ver `src/components/` do catálogo; o caminho do erro de "etapa usada" é o modelo).

- [ ] **Step 4: `npm test` completo, `npx tsc -b`, `npx madge --circular src`, `npx eslint src`.** Comitar: "Ticket 01 de revisoes-aprovacao: a janela de concluir diz o que falta na versão".

---

### Task 5: Fecho do ticket

**Files:**
- Modify: `.scratch/revisoes-aprovacao/desvios.md` (novo), `.scratch/revisoes-aprovacao/spec.md` (só se algo divergir), `.scratch/revisoes-aprovacao/issues/01-*.md` (marcas `[x]`), `CONTEXT.md` (só se houver termo novo), `.scratch/melhorias-protocolo.md`

- [ ] **Step 1: Conferência na tela** (critérios [visual] são dos tickets 02/03; aqui só o texto): subir o Vite (`.claude/launch.json` já tem a configuração) e, na vitrine local, abrir a janela de concluir a Revisão pelo setor com versão incompleta; registrar se a conferência foi feita ou presumida.
- [ ] **Step 2: `desvios.md`** (entrada datada): (1) "versão mais recente" = não histórica de maior número; (2) a falsa de processos usa `ultimaVersao.papeis` em vez de consultar a falsa de versões; (3) gatilho de conclusão genérico `conferir_conclusao_da_etapa`; (4) nome `bloquear_etapa_protegida` pela ordem alfabética dos gatilhos.
- [ ] **Step 3: Marcar os critérios do ticket (`- [x]`) e as caixas deste plano; `.scratch/melhorias-protocolo.md`** com os itens não testados deste comando (conforme `.claude/regras/nao-testados.md`, bloco do `/executar-complexo`).
- [ ] **Step 4: Comitar** "Ticket 01 de revisoes-aprovacao: desvios, critérios e melhorias do protocolo".

(O merge na `main`, a linha `Concluído em` e o envio ficam por conta do passo 4 do `/executar-complexo`.)

---

## Autoverificação

- **Cobertura:** história 11 e regra da `revisao_setor` → Tasks 1, 3, 4; história 12 (ajuste pequeno: enviar versão nova e concluir sem nova ida ao setor) → teste "Nova Na Etapa" (Task 1) e o caso 5 da Task 4; história 26 e regra das etapas protegidas → Tasks 1, 3 e 4 (passo 3); gatilho de conclusão para os tickets 02 e 03 → Task 1; falsa de processos e frases → Tasks 2 e 3; "Realizada anteriormente" sem versão → Task 1 e caso 7.
- **Tipos:** `UltimaVersao.papeis`, `fraseDoBloqueioDaConclusao`, `faltasDaVersao`, `fraseDaVersaoIncompleta`, `FRASE_SEM_VERSAO`, `fraseDaEtapaProtegida`, `conferirVersaoDaRevisaoDoSetor`, `bloqueio` — mesmos nomes em todas as tarefas.
- **Lacuna aceita:** o ticket cita "sem .bpmn": a função de envio nunca cria versão sem .bpmn e .png; o teste apaga o .png como dono do banco para provar a recusa.
