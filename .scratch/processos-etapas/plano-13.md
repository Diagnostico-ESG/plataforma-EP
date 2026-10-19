# Ticket 13 de processos-etapas (Resolver a etapa já inicia a próxima) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** concluir, dispensar ou registrar como realizada anteriormente a etapa atual já põe em andamento a primeira etapa pendente depois dela, com o responsável escolhido na mesma janela ("Quem fica com a próxima etapa?"), tudo ou nada.

**Architecture:** uma migração nova cria `public.avancar_etapa(p_andamento, p_acao, p_nota, p_responsavel)` (sem `security definer`) e três funções auxiliares em `private`; ela atualiza a etapa resolvida e a próxima pelos gatilhos que já existem (transição, sequência, dispensa, responsável, processo parado, eventos), então nenhuma regra é repetida. Na tela, o módulo de processos troca as três operações por versões que levam o responsável da próxima, e uma janela nova (`JanelaDeAvanco`) pede a escolha, com a nota quando a ação a exige. A falsa do módulo imita o avanço.

**Tech Stack:** React + TypeScript, Vitest + Testing Library; pgTAP pelo GitHub Actions ("Testes de banco"); migração pelo workflow "Migrar banco de desenvolvimento".

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 30, 34, 35, 37, 89 a 100 e 107; "Interface", "Janela de avanço"; "Modelo de dados", "Avanço"; "Regras que o banco impõe", linha do avanço; "Regras de estado"; "Migração da parte 2") · **Ticket:** `.scratch/processos-etapas/issues/13-resolver-a-etapa-inicia-a-proxima.md`. Critérios citados como "critério N", na ordem do ticket: 1 migração, 2 pgTAP, 3 módulo, 4 janela do Concluir, 5 Dispensar e Realizada anteriormente, 6 sem pendente depois, 7 teclado e leitor de tela, 8 falha na gravação, 9 histórico, Iniciar e Consulta, 10 testes com o aplicativo inteiro, 11 `AMBIENTES.md`. Porquê: ADR 0014.

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui:
  - estrutura muda só por migração nova (`npx supabase migration new`); o teste vem antes;
  - **sem `security definer`**: a função roda com a permissão de quem chama e a RLS decide; funções auxiliares em `private`, `search_path = ''`, nomes qualificados, `revoke execute … from public, anon` e `grant … to authenticated` (como as migrações 05 e 06);
  - "não guarde o que se calcula": nenhuma coluna nova; etapa atual e "concluído" continuam na view;
  - a interface fala com o banco só por `src/processos/` e pelo cliente de `src/lib/supabase.ts`; o `npm test` nunca depende do banco.
- Alvo conferido: a linha "vínculo atual" de `supabase/AMBIENTES.md` e `supabase/.temp/project-ref` são os dois `yclkzyoebpsxmgpbcbus` (desenvolvimento). O banco só é tocado pelos dois workflows, na branch, e pelo `db:types` (leitura).
- Funções de lógica `.ts` com 4 a 20 linhas (hooks em `src/hooks/`: até 40; componentes `.tsx` ficam fora desse limite, mas divididos por responsabilidade), arquivos até 300 linhas, complexidade até 10. Tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação. Comentários explicam o porquê.
- Só dados inventados. O workflow "Migrar banco de desenvolvimento" recebe só o nome do arquivo, sem a pasta.
- O pre-commit roda `typecheck` e a bateria inteira (cerca de 1 minuto); cada commit compila sozinho.
- TDD: um teste que falha por erro de digitação não conta como o "vermelho".
- Comece cada chamada do Bash com `cd` para a raiz do projeto.

## Decisões do plano

- **Nome e forma da função:** `public.avancar_etapa(p_andamento uuid, p_acao text, p_nota text, p_responsavel uuid) returns void`. A ação é texto (`concluir`, `dispensar`, `realizada_anteriormente`): outro valor é recusado com `acao_invalida:<valor>` (um `status_da_etapa` como parâmetro deixaria passar `em_andamento` e transformaria o avanço num "iniciar" disfarçado).
- **As regras ficam nos gatilhos que já existem.** A função só faz: ação → status; nota obrigatória em dispensar e realizada anteriormente; `conferir_transicao` (recusa resolver de novo uma etapa já resolvida, que o gatilho deixaria passar por ter o mesmo status); atualizar a etapa; atualizar a primeira pendente depois dela. Obrigatória não se dispensa (`etapa_obrigatoria`), responsável inválido (`responsavel_invalido`), sequência (`anterior_nao_resolvida`) e processo parado (`processo_parado`) vêm dos gatilhos. Qualquer recusa desfaz tudo (a função é uma instrução só para o chamador).
- **Perfis:** igual à função de voltar. Quem não lê a etapa (inativo) recebe `registro_inexistente`; a Consulta lê, mas a atualização afeta zero linhas, e a função recusa com `42501`; o visitante não tem permissão de executar (`42501`).
- **Eventos:** saem dos gatilhos de andamento, um por etapa alterada: o da resolvida (`concluir`, `dispensar` ou `registrar_realizada`) e o `iniciar` da próxima, com o responsável no "depois". O mesmo autor (`auth.uid()`) e a mesma hora (`now()` da transação). Nenhum texto novo no histórico.
- **Nota no concluir:** a coluna só aceita nota em dispensada e realizada anteriormente, então a função grava `null` ao concluir (a tela nunca manda nota ali).
- **"Ninguém por enquanto" limpa o responsável** da próxima, mesmo que ela já tivesse um: a janela abre marcando o que ela tem, então escolher "ninguém" é decisão da pessoa.
- **Nota nova na tradução das recusas:** `nota_obrigatoria` → "A nota é obrigatória." (a de `motivo_obrigatorio` fala em motivo, e aqui é nota). As outras recusas do avanço já têm frase.
- **Módulo:** as três operações ganham o terceiro (ou segundo) parâmetro obrigatório `proximoResponsavelId: string | null`, para nenhum chamador esquecer a escolha; sem etapa pendente depois a tela passa `null` e a função ignora o valor. O envio de `null` como parâmetro usa o mesmo molde de `reclassificarProcesso` (`as string`, o supabase-js manda `null`).
- **"A próxima" na tela** é a primeira etapa de status `pendente` depois da resolvida na lista do caminho (já em ordem de catálogo): função pura `proximaPendente`, testada. O banco decide de novo.
- **Responsável marcado ao abrir:** função pura `responsavelMarcado(proxima, usuarioId, usuarios)`: o que a próxima já tem, se está na lista; senão quem está na tela, se está na lista; senão ninguém. A lista passada à janela é a de `listarResponsaveisPossiveis`; o ticket 14 filtrará o autor da versão ali, sem mexer na janela.
- **Janela nova montada sob demanda** (como a `JanelaDeReclassificacao`): abre ao montar com `showModal`, é desmontada ao fechar, e a escolha recomeça a cada vez. Dispensar e Realizada anteriormente **sem** etapa pendente depois continuam na `JanelaComCampo`, como hoje.
- **Enter confirma** por `onKeyDown` no grupo de rádios (o Enter num rádio não envia nada no jsdom e varia entre navegadores); setas, Esc e foco são do navegador (rádios nativos com o mesmo `name` e `<dialog>`), conferidos no navegador na Tarefa 6.
- **Lista de usuários ainda não lida:** ela é lida ao abrir o painel (`CaminhoDoProcesso`), antes de qualquer clique; se a leitura falhar, a janela mostra só "Ninguém por enquanto", como o seletor já se degrada. Não se trata mais do que isso.
- **Sem ensaio da migração em cópia de teste** (como no ticket 12): a migração só cria funções e roda numa transação; se falhar, nada é aplicado e o workflow avisa.
- **Tipos regenerados na Tarefa 3**, no commit seguinte ao da migração (a migração precisa estar no GitHub antes de o workflow aplicá-la). Mesmo desvio dos tickets 05, 11 e 12.
- **Testes de tela novos:** `src/App.avancoDaEtapa.test.tsx`; os casos antigos de Concluir, Dispensar e Realizada anteriormente em `App.andamentoDoProcesso`, `App.painelDoProcesso` e `App.situacaoDoProcesso` são ajustados ao novo comportamento.

## Estrutura de arquivos

**Criar:** `supabase/tests/35_avancar_etapa.test.sql`; `supabase/migrations/<timestamp>_avancar_etapa.sql`; `src/components/processos/JanelaDeAvanco.tsx`; `src/components/processos/EscolhaDoResponsavel.tsx`; `src/components/processos/gravarPedidos.ts`; `src/App.avancoDaEtapa.test.tsx`; `src/processos/ProcessosFalso.avanco.test.ts`.

**Modificar (banco):** `supabase/AMBIENTES.md`, `src/types/database.ts` (regenerado).

**Modificar (tela):** `src/processos/{tipos,andamentosSupabase,andamentoFalso,ProcessosFalso,caminhoDeEtapas}.ts` e os testes `andamentosSupabase.test.ts`, `processosSupabase.test.ts`, `andamentoFalso.test.ts`, `caminhoDeEtapas.test.ts`, `ProcessosFalso.situacao.test.ts` (o que o `tsc` apontar); `src/components/processos/{useAcoesDaEtapa.ts,CaminhoDeEtapas.tsx,CaminhoDoProcesso.tsx,PainelDoProcesso.tsx,AreaDeProcessos.tsx}`; `src/components/JanelaDeConfirmacao.css`; `src/App.{andamentoDoProcesso,painelDoProcesso,situacaoDoProcesso}.test.tsx`.

## Tarefas

### Tarefa 1 — Plano, marco e branch

- [x] Comitar este plano na `main` ("Plano do ticket 13 de processos-etapas").
- [x] Criar o marco `marco/2026-10-18-inicio-ticket-13-processos-etapas` (se o nome existir, `-2`) e enviá-lo ao GitHub com `git push origin "refs/tags/marco/*:refs/tags/marco/*"`.
- [x] `git switch -c processos-etapas-13` (branch comum, sem worktree).

### Tarefa 2 — Teste de banco que falha (critério 2)

**Files:** Create `supabase/tests/35_avancar_etapa.test.sql`.

- [x] Criar o teste. Preparação como a do `19_voltar_datas_responsavel.test.sql` (mesma moldura `_tap`, mesmos quatro usuários inventados a1 Administrador, a2 Integrante, a3 Consulta, a4 Administrador inativo, as funções `pg_temp.andamento`, `pg_temp.agir`, `pg_temp.status`), mais:

```sql
-- Avanço da etapa (processos-etapas, ticket 13, ADR 0014): resolver a etapa atual já inicia a próxima, com o
-- responsável escolhido, numa transação só. Quem pode o quê, as recusas e os eventos.
begin;
create extension if not exists pgtap with schema extensions;
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(46);

-- (autorizacoes e auth.users: os mesmos quatro do teste 19, e update usuarios set ativo = false no a4)

insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000013', 'T13', 'Setor Avanço');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000013', null, 'Macro Avanço');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000013', 'af000000-0000-0000-0000-000000000013', nome
from unnest(array['Processo Avanco', 'Processo Realizada', 'Processo Ultima', 'Processo Recusas',
  'Processo Congelado', 'Processo Pulo']) as nome;

-- (pg_temp.andamento, pg_temp.agir e pg_temp.status: iguais aos do teste 19)

create function pg_temp.avancar(nome_do_processo text, codigo_da_etapa text, acao text, nota text, responsavel uuid)
  returns void
language sql as $$
  select public.avancar_etapa(pg_temp.andamento(nome_do_processo, codigo_da_etapa), acao, nota, responsavel) $$;
grant execute on function pg_temp.avancar(text, text, text, text, uuid) to authenticated;

create function pg_temp.responsavel(nome_do_processo text, codigo_da_etapa text) returns uuid
language sql stable as $$
  select responsavel_id from public.andamentos where id = pg_temp.andamento(nome_do_processo, codigo_da_etapa) $$;
grant execute on function pg_temp.responsavel(text, text) to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
```

  Casos (46 asserções, cada uma com `insert into _tap (linha) select …`; os ids `…a1`/`…a2` são os dos usuários; `modelagem`=1, `relatorio_modelagem_tecnica`=2, `revisao_interna`=3, `revisao_setor`=4, `aprovacao_setor`=5, `publicacao`=6):
  1. **Processo Avanco** (a2): `agir` iniciar e concluir a 1, iniciar a 2. `avancar('Processo Avanco','relatorio_modelagem_tecnica','concluir',null,a1)`:
     - (1) `lives_ok`; (2) a 2 `concluida`; (3) a 3 `em_andamento`; (4) `iniciada_em = current_date` na 3; (5) responsável da 3 = a1;
     - (6) um evento `concluir` e (7) um evento `iniciar` com `entidade_ref like '%:' || <id da 2 / da 3>`;
     - (8) `is((select array_agg(distinct autor_id) from public.eventos where entidade = 'andamento' and ((acao = 'concluir' and entidade_ref like '%:' || <id da 2>::text) or (acao = 'iniciar' and entidade_ref like '%:' || <id da 3>::text))), array['…a2'::uuid], 'os dois eventos têm o mesmo autor')`;
     - (9) `detalhes -> 'depois' ->> 'responsavel_nome'` do evento `iniciar` da 3 = nome do a1.
     - "Ninguém": `avancar('Processo Avanco','revisao_interna','concluir',null,null)`: (10) `lives_ok`; (11) a 4 `em_andamento`; (12) responsável da 4 `is(…, null::uuid)`.
     - (13) `throws_ok` de `avancar('Processo Avanco','relatorio_modelagem_tecnica','concluir',null,null)` (já concluída): `'P0001', 'transicao_nao_permitida:concluida:concluida'`.
  2. **Processo Realizada** (a2): `agir` iniciar a 1; `avancar(…,'modelagem','realizada_anteriormente','Feita em 2025',a2)`: (14) `lives_ok`; (15) a 1 `realizada_anteriormente`; (16) nota da 1 = 'Feita em 2025'; (17) a 2 `em_andamento`; (18) responsável da 2 = a2; (19) um evento `registrar_realizada` na 1.
  3. **Processo Ultima** (a2): `agir` realizada anteriormente (nota "Feita antes") nas etapas 1 a 4 e iniciar a 5. `avancar(…,'aprovacao_setor','concluir',null,a1)`: (20) `lives_ok`; (21) a 6 (opcional) `em_andamento`; (22) responsável da 6 = a1. `avancar(…,'publicacao','concluir',null,null)`: (23) `lives_ok` (concluir a última não inicia nada); (24) `count` de andamentos `em_andamento` do processo = 0; (25) `situacao` na view `processos_com_andamento` = `'concluido'`.
  4. **Processo Recusas** (a2): `agir` iniciar a 1.
     - (26) `avancar(…,'modelagem','dispensar','Motivo',null)` → `'P0001', 'etapa_obrigatoria:Modelagem piloto'`;
     - (27) `avancar(…,'modelagem','realizada_anteriormente','   ',null)` → `'P0001', 'nota_obrigatoria'`;
     - (28) `avancar(…,'modelagem','concluir',null,a3)` → `'P0001', 'responsavel_invalido:' || <nome do a3>`; (29) o mesmo com a4 e o nome dele;
     - (30) `avancar(…,'modelagem','iniciar',null,null)` → `'P0001', 'acao_invalida:iniciar'`;
     - (31) `avancar(…,'relatorio_modelagem_tecnica','concluir',null,null)` (pendente) → `'P0001', 'transicao_nao_permitida:pendente:concluida'`;
     - (32) nenhuma etapa mudou: `count` de andamentos `pendente` do processo = 5; (33) a 1 continua `em_andamento`.
  5. **Processo Congelado** (a2): `agir` iniciar a 1; `select public.suspender_processo((select id from public.processos where nome = 'Processo Congelado'), 'Parado')`; (34) `avancar(…,'modelagem','concluir',null,null)` → `'P0001', 'processo_parado:suspenso'`; (35) a 1 continua `em_andamento`.
  6. **Processo Pulo** (a1, set_config do a1): `agir` realizada anteriormente nas etapas 1 a 3. Etapa opcional nova no meio, já com as três primeiras resolvidas: `select public.acrescentar_etapa('opcional_teste', 'Opcional de teste', false, (select id from public.etapas where codigo = 'revisao_interna'))` (a nova passa a ser a 3; `revisao_interna` vira a 4, já realizada). Voltar ao a2.
     - (36) `avancar('Processo Pulo','opcional_teste','dispensar',null,a2)` → `'P0001', 'nota_obrigatoria'`; (37) a opcional continua `pendente`;
     - (38) `avancar('Processo Pulo','opcional_teste','dispensar','Não se aplica',a2)` `lives_ok`; (39) a opcional `dispensada`; (40) `revisao_interna` continua `realizada_anteriormente` (a resolvida não é reaberta); (41) `revisao_setor` `em_andamento`; (42) responsável de `revisao_setor` = a2.
  7. **Perfis** (sobre "Processo Recusas", a 1 em andamento): a3 (Consulta): (43) `throws_ok` com `'42501', null` ao `avancar('Processo Recusas','modelagem','concluir',null,null)`. a4 (inativo): (44) `'P0001', 'registro_inexistente'`. `set local role anon`: (45) `select public.avancar_etapa('00000000-0000-0000-0000-000000000000', 'concluir', null, null)` → `'42501', null`.
  8. `reset role;` (46) `prosecdef` de `public.avancar_etapa` = `false`; `finish()` e o `do $$ … raise exception … $$` de relatório, como no fim do teste 19.
- [x] Comitar na branch ("Ticket 13 de processos-etapas: teste de banco do avanço"). O pre-commit só roda a bateria da tela.
- [x] `git push -u origin processos-etapas-13` (sem `--force`).
- [x] Disparar o workflow "Testes de banco" na branch `processos-etapas-13`, pelo navegador do app (`anthropic-skills:built-in-browser`; não há `gh`; o usuário já entrou no GitHub). Esperado: **só o teste 35 falha**, por `function public.avancar_etapa(uuid, text, text, uuid) does not exist`; os 34 arquivos anteriores passam. Se falhar por outro motivo (digitação, usuário, plano), corrigir e repetir.

### Tarefa 3 — Migração, aplicação e tipos (critérios 1 e 11)

**Files:** Create `supabase/migrations/<timestamp>_avancar_etapa.sql`; Modify `supabase/AMBIENTES.md`, `src/types/database.ts`.

- [x] `npx supabase migration new avancar_etapa` e preencher:

```sql
-- Avanço da etapa (processos-etapas, ticket 13, ADR 0014): resolver a etapa atual já inicia a próxima, com o
-- responsável escolhido, numa transação só. Não destrutiva. As recusas chegam à interface como "motivo:valor"
-- em P0001 (src/processos/andamentosSupabase.ts); as regras de sequência, dispensa, responsável, processo parado
-- e evento são as dos gatilhos de andamento, que esta função só aciona.

-- A ação do avanço vira o status que a etapa resolvida recebe; outra ação não tem status.
create function private.status_do_avanco(acao text) returns public.status_da_etapa
language sql immutable set search_path = ''
as $$ select case acao
  when 'concluir' then 'concluida'::public.status_da_etapa
  when 'dispensar' then 'dispensada'::public.status_da_etapa
  when 'realizada_anteriormente' then 'realizada_anteriormente'::public.status_da_etapa
end $$;

-- Dispensar e registrar como realizada anteriormente exigem nota (a restrição da tabela só a aceita nesses dois).
create function private.conferir_nota_do_avanco(novo public.status_da_etapa, p_nota text) returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if novo <> 'concluida' and nullif(btrim(p_nota), '') is null then
    raise exception 'nota_obrigatoria';
  end if;
end $$;

-- Resolve a etapa. O gatilho de andamento confere transição, sequência, dispensa, processo parado e data.
-- Zero linhas é a RLS recusando o perfil: 42501, como o resto da API.
create function private.resolver_etapa_do_avanco(escolhida public.andamentos, novo public.status_da_etapa, p_nota text)
  returns void
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_transicao(escolhida.status, novo);
  update public.andamentos set status = novo, nota = case when novo = 'concluida' then null else p_nota end
  where id = escolhida.id;
  if not found then
    raise exception 'sem permissão para resolver a etapa' using errcode = '42501';
  end if;
end $$;

-- A primeira pendente do mesmo processo depois da resolvida, na ordem do catálogo, entra em andamento com o
-- responsável escolhido (nenhum, se for null). Sem pendente depois, nada acontece.
create function private.iniciar_proxima_do_avanco(resolvida public.andamentos, p_responsavel uuid) returns void
language sql set search_path = ''
as $$
  update public.andamentos set status = 'em_andamento', responsavel_id = p_responsavel
  where id = (
    select a.id from public.andamentos a join public.etapas e on e.id = a.etapa_id
    where a.processo_id = resolvida.processo_id and a.status = 'pendente'
      and e.ordem > (select ordem from public.etapas where id = resolvida.etapa_id)
    order by e.ordem limit 1) $$;

-- Sem security definer: roda com a permissão de quem chama e a RLS decide.
create function public.avancar_etapa(p_andamento uuid, p_acao text, p_nota text, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  novo public.status_da_etapa := private.status_do_avanco(p_acao);
  escolhida public.andamentos;
begin
  if novo is null then
    raise exception 'acao_invalida:%', p_acao;
  end if;
  select * into escolhida from public.andamentos where id = p_andamento;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_nota_do_avanco(novo, p_nota);
  perform private.resolver_etapa_do_avanco(escolhida, novo, p_nota);
  perform private.iniciar_proxima_do_avanco(escolhida, p_responsavel);
end $$;

revoke execute on function private.status_do_avanco(text),
  private.conferir_nota_do_avanco(public.status_da_etapa, text),
  private.resolver_etapa_do_avanco(public.andamentos, public.status_da_etapa, text),
  private.iniciar_proxima_do_avanco(public.andamentos, uuid), public.avancar_etapa(uuid, text, text, uuid)
  from public, anon;
grant execute on function private.status_do_avanco(text),
  private.conferir_nota_do_avanco(public.status_da_etapa, text),
  private.resolver_etapa_do_avanco(public.andamentos, public.status_da_etapa, text),
  private.iniciar_proxima_do_avanco(public.andamentos, uuid), public.avancar_etapa(uuid, text, text, uuid)
  to authenticated;
```

  Os parâmetros das auxiliares levam o prefixo `p_` (`p_nota`, `p_responsavel`) para não colidir com as colunas `nota` e `responsavel_id` dentro do `update` (o plpgsql recusa nome ambíguo).
- [x] Comitar e enviar ("Ticket 13 de processos-etapas: migração do avanço"). Disparar o workflow "Migrar banco de desenvolvimento" na branch, com `migracao` = `<timestamp>_avancar_etapa.sql`. Esperado: aplicada, sem o aviso de já aplicada.
- [x] Disparar o "Testes de banco" na branch. Esperado: os 35 arquivos verdes, o 35 com 46 de 46. Se o 35 falhar, ler a linha `not ok`; se for erro da função, **nova migração** (a enviada não se edita); se for do teste, corrigir o teste. Na terceira falha sobre o mesmo ponto, parar (regra de parada do `CLAUDE.md`).
- [x] Conferir o alvo e rodar `npm run db:types`; no diff de `src/types/database.ts` deve entrar só `avancar_etapa` em `Functions` (`Args: { p_acao: string; p_andamento: string; p_nota: string; p_responsavel: string }`).
- [x] Registrar em `supabase/AMBIENTES.md` a linha da migração (data, ticket 13 de processos-etapas, não destrutiva, teste 35 falhou antes por função inexistente e passou depois com os 35 arquivos verdes, aplicada pelo workflow, tipos regenerados). Comitar e enviar ("Ticket 13 de processos-etapas: registro da migração e tipos").

### Tarefa 4 — Módulo de processos: levar o responsável da próxima (critério 3)

**Files:** Modify `src/processos/{tipos,andamentosSupabase,andamentoFalso,ProcessosFalso,caminhoDeEtapas}.ts` e os testes; Create `src/processos/ProcessosFalso.avanco.test.ts`.

- [x] **Testes primeiro (vermelhos):**
  - `andamentosSupabase.test.ts`: `concluirEtapa('a4', 'u1')` chama o `rpc` `avancar_etapa` com `{ p_andamento: 'a4', p_acao: 'concluir', p_nota: null, p_responsavel: 'u1' }`; `dispensarEtapa('a4', 'Sem publicação', null)` com `{ p_acao: 'dispensar', p_nota: 'Sem publicação', p_responsavel: null }`; `registrarRealizadaAnteriormente('a4', 'Feita em 2025', 'u2')` com `p_acao: 'realizada_anteriormente'`. Tradução das recusas do `rpc.avancar_etapa` (um `test.each`): `etapa_obrigatoria:Publicação` → "A etapa Publicação é obrigatória e não pode ser dispensada."; `responsavel_invalido:Maria Teste` → a frase do responsável; `anterior_nao_resolvida:Reunião de modelagem` → "A etapa Reunião de modelagem ainda não foi resolvida."; `processo_parado:suspenso` → "Este processo está suspenso; retome-o para registrar o andamento."; `nota_obrigatoria` → "A nota é obrigatória."; `42501` → "Seu perfil não permite alterar os processos."; `registro_inexistente` → `CadastroInexistente`.
  - `ProcessosFalso.avanco.test.ts` (processo de 3 etapas como em `ProcessosFalso.situacao.test.ts`, `usuariosPossiveis = [{ id: 'u1', nome: 'Ana Teste' }, { id: 'u2', nome: 'Bia Teste' }]`):
    - concluir a atual com a seguinte pendente → a atual `concluida` com `resolvidaEm` de hoje e a seguinte `em_andamento` com `iniciadaEm` de hoje, `responsavelId: 'u1'`, `responsavelNome: 'Ana Teste'`; `etapaAtual` e `responsavel` do processo passam à seguinte; a chamada gravada é `{ acao: 'concluir', id, usuarioId: 'u1' }`;
    - responsável `null` → a seguinte `em_andamento` sem responsável (e limpa o que tinha);
    - a seguinte já resolvida é pulada (inicia a primeira `pendente` depois);
    - sem pendente depois: nada é iniciado, e o processo fica `concluido` quando as obrigatórias estão resolvidas;
    - dispensar e realizada anteriormente guardam a nota e avançam igual;
    - recusas, sem mudar nenhuma etapa: dispensar obrigatória ("A etapa X é obrigatória e não pode ser dispensada."), nota vazia ("A nota é obrigatória."), responsável fora de `usuariosPossiveis` ("u9 não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP."), processo suspenso (a frase de `situacaoFalso`), `falhaDeGravacao`.
  - `andamentoFalso.test.ts`: `avancarEtapas` direto (pura): resolve a escolhida, inicia a primeira `pendente` com `ordem` maior, não mexe em outra.
  - `caminhoDeEtapas.test.ts`: `proximaPendente(etapas, indice)` (a seguinte pendente; pula a resolvida; `null` sem pendente depois); `responsavelMarcado(proxima, usuarioId, usuarios)` (o da próxima se está na lista; senão o usuário da tela se está na lista; senão `null`).
- [x] `npm test`: vermelho por falta das funções/assinaturas.
- [x] **Implementar:**
  - `tipos.ts` (`ModuloDeProcessos`): `concluirEtapa(andamentoId: string, proximoResponsavelId: string | null)`, `dispensarEtapa(andamentoId: string, nota: string, proximoResponsavelId: string | null)`, `registrarRealizadaAnteriormente(…mesmo…)`, com o comentário "Resolve a etapa atual e, se houver etapa pendente depois, a inicia com o responsável (null: nenhum), tudo ou nada; sem pendente depois o responsável é ignorado."
  - `andamentosSupabase.ts`: as três operações chamam `avancar(cliente, id, acao, nota, responsavelId, recusas)`:

```ts
// p_nota e p_responsavel vão como null quando não há (o supabase-js manda null; o tipo gerado não o admite).
async function avancar(
  cliente: ClienteSupabase, id: string, acao: 'concluir' | 'dispensar' | 'realizada_anteriormente',
  nota: string | null, responsavelId: string | null, recusas: RecusasDoModulo,
): Promise<void> {
  const { error } = await cliente.rpc('avancar_etapa', {
    p_andamento: id, p_acao: acao, p_nota: nota as string, p_responsavel: responsavelId as string,
  })
  if (error) throw falhaDoAndamento(error, recusas)
}
```

    `iniciarEtapa` continua pelo `mudar`. `nota_obrigatoria` entra no `PADRAO_DA_RECUSA` e em `FRASE_DA_RECUSA` (`() => 'A nota é obrigatória.'`); o tipo `OperacoesDoAndamento` não muda.
  - `andamentoFalso.ts`: `avancarEtapas<T extends EtapaDoProcesso>(etapas: T[], id: string, resolvida: Partial<T>, responsavel: UsuarioResponsavel | null, hoje: string): T[]` e `responsavelDaAtual(processo): ResponsavelDaEtapa | null` (o cartão mostra o responsável da etapa atual, como a view).
  - `ProcessosFalso.ts`: as três operações chamam `private avancar(chamada, mudancas, usuarioId)`: `conferirGravacao`, `conferirProcessoDaEtapa`, as recusas acima (extraídas para `conferirAvanco` em `andamentoFalso.ts` para não passar de 20 linhas), `chamadas.push`, `aplicar` com `avancarEtapas` e o `responsavel` do cartão. As chamadas gravadas: `{ acao: 'concluir', id, usuarioId }`, `{ acao: 'dispensar', id, nota, usuarioId }`, `{ acao: 'realizada', id, nota, usuarioId }`.
  - Chamadores atuais em `useAcoesDaEtapa.ts`: passam `null` como responsável por enquanto (a janela vem na Tarefa 5), para o commit compilar.
  - Ajustar os testes antigos que usam as assinaturas ou esperam `chamadas` sem `usuarioId`: `processosSupabase.test.ts`, `ProcessosFalso.situacao.test.ts`, `App.andamentoDoProcesso`, `App.painelDoProcesso`, `App.situacaoDoProcesso` (só o que o `npm test` apontar; o comportamento de tela fica para a Tarefa 5).
- [x] `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:circular`: verdes. Comitar ("Ticket 13 de processos-etapas: módulo e falsa levam o responsável da próxima").

### Tarefa 5 — Janela de avanço e as três ações (critérios 4 a 10)

**Files:** Create `src/components/processos/{JanelaDeAvanco,EscolhaDoResponsavel}.tsx`, `src/components/processos/gravarPedidos.ts`, `src/App.avancoDaEtapa.test.tsx`; Modify `src/components/processos/{useAcoesDaEtapa.ts,CaminhoDeEtapas.tsx,CaminhoDoProcesso.tsx,PainelDoProcesso.tsx,AreaDeProcessos.tsx}`, `src/components/JanelaDeConfirmacao.css`, `src/App.{andamentoDoProcesso,painelDoProcesso,situacaoDoProcesso}.test.tsx`.

- [ ] **Testes de tela primeiro** em `src/App.avancoDaEtapa.test.tsx` (mesma montagem de `App.andamentoDoProcesso.test.tsx`: `montar`, `etapa(nome)`, processo `#/processos/p1`; `falso.usuariosPossiveis = [{ id: 'usuario-de-teste', nome: <nome do USUARIO_DE_TESTE> }, { id: 'u2', nome: 'Bia Teste' }]`). Cada caso, com as asserções:
  1. **Concluir abre a janela** (critério 4): clicar [Concluir] na etapa em andamento abre o `dialog` "Concluir Reunião de modelagem e iniciar Relatório e modelagem técnica"; o grupo `radiogroup` de nome "Quem fica com a próxima etapa?" tem os rádios `[<usuário da tela>, 'Bia Teste', 'Ninguém por enquanto']` nessa ordem, com "Ninguém por enquanto" por último; o botão é "Concluir e iniciar Relatório e modelagem técnica". Nada foi gravado (`falso.chamadas` vazio).
  2. **Marcado ao abrir:** (a) a próxima sem responsável → marcado o usuário da tela; (b) a próxima com responsável `u2` → marcado "Bia Teste"; (c) a próxima com responsável que não está na lista (ex.: `u9`) e o usuário da tela fora da lista → marcado "Ninguém por enquanto".
  3. **Confirmar grava e avança:** escolher "Bia Teste" e confirmar → `falso.chamadas` = `[{ acao: 'concluir', id: 'a4', usuarioId: 'u2' }]`; a etapa 4 vira "Concluída", a 5 vira "Em andamento" com "Responsável: Bia Teste"; o cartão do Quadro (rota `#/processos`, se o teste usar o Quadro) mostra a nova coluna. Com "Ninguém por enquanto": `usuarioId: null`, a 5 "Em andamento" com "Responsável: —".
  4. **Dispensar com próxima** (critério 5): o processo com a opcional Publicação **no meio** (uma etapa depois dela pendente) → [Dispensar] abre a janela "Dispensar Publicação e iniciar <próxima>", com o campo "Nota" e a escolha; o botão "Dispensar e iniciar <próxima>" fica desabilitado com a nota vazia e habilita com texto; confirmar grava `{ acao: 'dispensar', id, nota, usuarioId }`.
  5. **Realizada anteriormente com próxima:** a janela traz o título "Registrar Reunião de modelagem como realizada anteriormente e iniciar Relatório e modelagem técnica", o botão "Registrar e iniciar Relatório e modelagem técnica" e grava `{ acao: 'realizada', id: 'a4', nota, usuarioId }`.
  6. **Sem etapa pendente depois** (critério 6): [Concluir] na última etapa grava na hora, sem `dialog` (`chamadas` = `[{ acao: 'concluir', id, usuarioId: null }]`); [Dispensar] na Publicação (última) abre a janela antiga "Dispensar a etapa Publicação?" **sem** `radiogroup` e grava com `usuarioId: null`; o processo aparece "Concluído" quando cabe.
  7. **Teclado e leitor de tela** (critério 7): ao abrir, `document.activeElement` é o rádio marcado; com nota (Dispensar), é o campo "Nota"; Enter (`fireEvent.keyDown(rádio, { key: 'Enter' })`) confirma e grava; Enter com a nota vazia **não** grava; [Cancelar] fecha sem gravar e a etapa continua "Em andamento" (`chamadas` vazio); reabrir a janela volta ao marcado inicial.
  8. **Falha** (critério 8): `falhaDeGravacao = 'Sem conexão'` → o alerta "Sem conexão" (formato de falha do painel) aparece, e as etapas ficam como estavam; `falhaDeGravacao = new TravaDoBanco('A etapa X é obrigatória e não pode ser dispensada.')` → o alerta traz a frase.
  9. **Histórico, Iniciar e Consulta** (critério 9): com `historicoDosProcessos['p1']` com dois eventos de andamento do mesmo autor e hora (`concluir` e `iniciar`, esta com o "depois" trazendo `responsavel_nome`), a aba Histórico mostra "Concluiu a etapa" e "Iniciou a etapa" e o responsável; [Iniciar] numa etapa pendente grava na hora, sem `dialog`; a Consulta não vê [Concluir], [Dispensar] nem [Realizada anteriormente] (já coberto em `App.andamentoDoProcesso`; aqui basta a asserção de que nenhum `dialog` abre).
- [ ] `npm test`: os casos novos falham pelo motivo certo (o [Concluir] ainda grava na hora).
- [ ] **Implementar:**
  - `gravarPedidos.ts` (funções puras, ≤ 20 linhas cada): `gravarTexto(processos, { acao, etapa }, texto)` (as janelas só com nota ou motivo: dispensar e realizada com `null` como responsável, voltar) e `gravarAvanco(processos, { acao, etapa }, nota, responsavelId)` (concluir, dispensar, realizada com o responsável). `gravarPedido` de `useAcoesDaEtapa.ts` sai para cá.
  - `useAcoesDaEtapa.ts`: dois pedidos — `pedido` (texto: dispensar/realizada sem próxima, e voltar) e `avanco` (`{ acao: 'concluir'|'dispensar'|'realizada'; etapa; proxima }`). `agir(acao, etapa, proxima)`: iniciar grava na hora; voltar abre a janela do motivo; concluir sem `proxima` grava na hora com `null`; dispensar e realizada sem `proxima` abrem a janela do texto; com `proxima`, abrem o avanço. Devolve também `gravarAvanco(nota, responsavelId)` e `fecharAvanco`. O hook segue ≤ 40 linhas (a escolha entre pedidos sai em funções pequenas).
  - `EscolhaDoResponsavel.tsx`: o grupo de rádios — `role="radiogroup"` com `aria-labelledby` na pergunta "Quem fica com a próxima etapa?", um `<label><input type="radio" name={…} value={id} checked onChange /> Nome</label>` por usuário e "Ninguém por enquanto" por último (valor `''`); `onKeyDown` do grupo: Enter chama `aoConfirmarComEnter`.
  - `JanelaDeAvanco.tsx`: `<dialog className="janela-confirmacao">` que abre no `useEffect(() => …showModal(), [])` e leva o foco ao campo da nota (com nota) ou ao rádio marcado; título em `<h3>`; com `comNota`, o `<label>`/`<textarea>` "Nota" (`maxLength` 2000, como a `JanelaComCampo`); `EscolhaDoResponsavel`; botões "{rotuloDaAcao}" (desabilitado com a nota vazia quando `comNota`) e "Cancelar"; `onClose` e Cancelar chamam `aoFechar`; confirmar chama `aoFechar()` e depois `aoConfirmar(nota.trim(), responsavel === '' ? null : responsavel)`. Props: `titulo`, `rotuloDaAcao`, `comNota`, `usuarios`, `marcadoAoAbrir`, `aoConfirmar`, `aoFechar`.
  - `caminhoDeEtapas.ts`: `proximaPendente` e `responsavelMarcado` (as da Tarefa 4).
  - `CaminhoDeEtapas.tsx`: recebe `usuarioId`; `aoAgir={(acao) => agir(acao, etapa, proximaPendente(etapas, indice))}`; renderiza `<JanelaDeAvanco key={avanco.etapa.id} … />` quando há `avanco`, com os textos de título e botão por ação:
    - `concluir`: "Concluir {etapa} e iniciar {próxima}" / "Concluir e iniciar {próxima}";
    - `dispensar`: "Dispensar {etapa} e iniciar {próxima}" / "Dispensar e iniciar {próxima}";
    - `realizada`: "Registrar {etapa} como realizada anteriormente e iniciar {próxima}" / "Registrar e iniciar {próxima}".

    Os textos ficam num mapa de constantes junto do `JANELA_DO_TEXTO` (arquivo ≤ 300 linhas; se passar, o mapa vira `textosDasJanelas.ts`).
  - `CaminhoDoProcesso.tsx`, `PainelDoProcesso.tsx` e `AreaDeProcessos.tsx`: passam `usuarioId={usuario.id}` até o `CaminhoDeEtapas`.
  - `JanelaDeConfirmacao.css`: estilo mínimo do grupo de rádios (coluna com espaço entre as opções) usando os tokens já existentes.
  - Ajustar os testes antigos de [Concluir], [Dispensar] e [Realizada anteriormente] que agora abrem a janela (confirmar com o botão novo, `chamadas` com `usuarioId`).
- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:circular`: verdes. Comitar ("Ticket 13 de processos-etapas: janela de avanço").

### Tarefa 6 — Conferência na tela e fecho

- [ ] Conferir no navegador do app a janela no Quadro, com a vitrine local (`vitrine.local/`, fora do git, servida pelo `npx vite`): foco no rádio marcado, setas trocando de opção, Enter confirmando, Esc e [Cancelar] fechando sem gravar, nota com a escolha em Dispensar. Registrar como verificado manualmente apenas o que foi visto; o resto, como presumido (a vitrine usa as falsas, não o banco).
- [ ] Gravar `.scratch/processos-etapas/desvios.md` (entrada datada): função com ação em texto; transição conferida na função para recusar resolver de novo; `nota_obrigatoria` nova; migração e tipos em commits seguintes ao da migração; o que mais surgir.
- [ ] Gravar `.scratch/melhorias-protocolo.md` com os itens não testados do `/executar-complexo` e do "Qualquer momento" (`.claude/regras/nao-testados.md`) que aconteceram.
- [ ] Marcar as caixas deste plano e comitar.
- [ ] `git switch main`, merge da branch (`finishing-a-development-branch`), `git branch -d processos-etapas-13`; enviar a `main` e conferir o "Testes de banco" na `main`.
- [ ] Na `main`: `Concluído em 2026-10-18 (commit <hash>)` no fim do ticket 13; comitar e enviar. Lembrar: peça o `/cost`; próximo, o ticket 14.
