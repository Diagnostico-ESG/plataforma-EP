# Ticket 10 de processos-etapas (Catálogo de etapas na Administração) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o administrador mantém o catálogo de etapas numa aba da Administração (acrescentar, editar, subir, descer, desativar, reativar e excluir), e o banco aplica cada mudança aos andamentos conforme o ADR 0004.

**Architecture:** uma migração torna a unicidade de `etapas.ordem` verificável no fim do comando, cria `public.acrescentar_etapa` e `public.mover_etapa` (sem `security definer`) e gatilhos em `etapas`, também sem `security definer`: um inclui ou apaga os andamentos pendentes quando a etapa nasce, é desativada ou reativada; outro recusa excluir etapa usada e apaga os pendentes da nunca usada; um gatilho de comando recusa etapa do setor depois de uma do processo. Os andamentos ganham privilégio de incluir e apagar, mas a RLS só deixa passar o administrador ativo **e** com o ajuste `ep.sincronizando_catalogo` ligado, que só os gatilhos do catálogo ligam. O evento da etapa sai de um gatilho `security definer`, como todos os eventos do projeto. Na interface, `ModuloDeProcessos` ganha o grupo `catalogo` (real e falso), e a Administração ganha as abas "Usuários" e "Catálogo de etapas". O histórico dos cadastros passa a ler e descrever a entidade `etapa`.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 68, 70 a 77, 81 e 82; ADR 0004; "Interface", "Modelo de dados", "Quem pode o quê", "Regras que o banco impõe") · **Ticket:** `.scratch/processos-etapas/issues/10-catalogo-de-etapas-na-administracao.md` (critérios citados como "critério N", na ordem do ticket).

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Regras de `.claude/regras/banco.md` lidas nesta sessão e que valem aqui: teste antes da migração; estrutura só por migração; migração, teste e tipos no mesmo commit (a não ser o commit do teste que prova a falha, como no ticket 08); função pública sem `security definer`, com `revoke ... from public, anon` e `grant execute ... to authenticated`; função só de gatilho com `revoke` de todos; `search_path` vazio e nomes qualificados; alvo conferido antes de qualquer comando de banco (vínculo atual = `yclkzyoebpsxmgpbcbus`, igual a `supabase/.temp/project-ref`).
- Banco só pelo GitHub Actions, na branch `processos-etapas-10`: "Testes de banco" e "Migrar banco de desenvolvimento" (autorizados no CLAUDE.md, "Ajustes deste Projeto"). Produção fica fora deste ticket.
- Recusas do banco chegam como `P0001` "motivo:valor" e viram `TravaDoBanco` com a frase pronta (critério 3): "A etapa {nome} já foi usada; desative-a em vez de excluir." e "As etapas do setor precisam vir antes das etapas do processo.".
- Funções de 4 a 20 linhas, arquivos de até 300 linhas, complexidade de até 10 caminhos, tipos explícitos e nenhum `any`. `ProcessosFalso.ts` já tem 281 linhas: o catálogo falso vai num arquivo próprio.

## Decisões do plano

- **Ordem verificável no fim do comando:** `etapas_ordem_key` volta como `unique (ordem) deferrable initially immediate`. Assim, "abrir espaço" (`ordem + 1` de todas a partir da posição) e trocar duas etapas cabem num comando só cada.
- **Posição da etapa nova:** "Entrar antes de {etapa}" ou "No fim" (`p_antes_de` nulo). A ordem pode ter buracos depois de uma exclusão; subir e descer trocam com a vizinha mais próxima.
- **Quem recebe a etapa nova ou reativada:** todos os setores, inclusive os inativos, e os processos cuja situação **calculada** (`processos_com_andamento.situacao`) é `em_andamento` ou `suspenso`. Concluídos e cancelados ficam de fora. Na reativação vale o mesmo conjunto, só onde falta (ADR 0004, observação da spec).
- **Desativar:** apaga os pendentes da etapa em todo lugar (inclusive em processo cancelado ou concluído); a em andamento e as resolvidas ficam.
- **Andamentos criados e apagados só pelo catálogo:** `grant insert (etapa_id, setor_id, processo_id), delete` a logado, com políticas que exigem administrador ativo e `private.sincronizando_catalogo()`. A inclusão direta continua recusada com `42501`. A exclusão direta passa a apagar 0 linhas (a RLS filtra sem erro), por isso o teste 15 ("não apaga andamento direto", nos 4 perfis) e o teste 17 ("andamento de processo não se apaga direto") deixam de esperar `42501` e passam a conferir que nada foi apagado. A exclusão em cascata (processo ou setor excluído) não passa pela RLS e continua igual.
- **Etapa usada não se exclui:** o gatilho "antes de apagar" recusa com `etapa_usada:{nome}` antes da referência (`23503`). O teste 15 ("etapa usada em algum setor não se apaga") passa a esperar `P0001` com `etapa_usada:Identificação dos responsáveis`.
- **Evento da etapa:** entidade `etapa`, referência = id da etapa; o estado tem `codigo, nome, nivel, obrigatoria, ativa, ordem`. Ações: `acrescentar`, `editar`, `mudar_ordem`, `desativar`, `reativar`, `excluir`. A mudança só de ordem gera evento apenas para a etapa movida (o ajuste `ep.etapa_movida`): subir ou descer gera um evento (o da etapa escolhida, não o da vizinha), e o espaço aberto pela etapa nova não gera nenhum. Fora das funções (ajuste vazio), toda mudança de ordem gera evento.
- **Leitura dos eventos `etapa`:** todo perfil ativo (spec, "Dado pessoal e quem vê"). Eles aparecem no Histórico dos cadastros (área Setores), com os textos do critério 7, e o item do filtro vira "{código} — {nome}".
- **Interface do módulo:** `ModuloDeProcessos.catalogo: ModuloDoCatalogo`, um grupo, para o falso caber em `CatalogoFalso.ts`, que recebe o `ProcessosFalso` e atualiza as colunas do Quadro (`etapasDoCatalogo`), o caminho dos processos e as etapas dos setores.
- **Recusa por perfil e item que sumiu:** as mesmas de processos (`RECUSAS_DOS_PROCESSOS`): "Seu perfil não permite alterar os processos." e `CadastroInexistente` (a lista recarrega). Os não administradores nem veem a aba.
- **Frases que a spec não traz** (vão para `desvios.md`): "O nome da etapa é obrigatório."; "O código deve ter de 2 a 40 caracteres: letras minúsculas sem acento, números e sublinhado. Recebido: "{valor}"."; "Já existe uma etapa com o nome {nome}."; "Já existe uma etapa com o código {codigo}.".
- **Abas da Administração:** estado local (sem endereço), no padrão `role="tablist"` do painel do processo. "Usuários" vem aberta.

## Tarefas

### Tarefa 1 — Teste de banco 22 (falha primeiro)

**Arquivos:** criar `supabase/tests/22_catalogo_de_etapas.test.sql` (molde do 21: usuários a1 a a4, `_tap`, `plan(N)` com o N exato e a exceção do fim); alterar `supabase/tests/15_etapas_do_setor.test.sql` e `supabase/tests/17_processos.test.sql` como em "Decisões" (o número de asserções não muda).

- [ ] Branch: `git switch -c processos-etapas-10` (a partir da `main`) e o marco `marco/2026-10-14-inicio-ticket-10-processos-etapas`.
- [ ] Escrever o teste 22 (critérios 1 e 2). Preparação, como dono do banco: setores TC1 (ativo) e TC2 (inativo, `ativo = false`), macroprocesso "Macro Catálogo" com TC1 envolvido; etapas do setor de TC1 resolvidas como `realizada_anteriormente` com nota, na ordem; processos de TC1 "Andando" (em andamento), "Parado" (suspenso por `suspender_processo`, como integrante), "Cancelado" (por `cancelar_processo`) e "Pronto" (as 5 etapas obrigatórias do processo como `realizada_anteriormente`, na ordem: situação calculada `concluido`). Asserções, como administrador salvo indicação:
  1. `acrescentar_etapa('teste_nova', 'Etapa Nova', 'processo', true, null)` vive; a etapa fica no fim da ordem;
  2. um andamento pendente dela em "Andando" e em "Parado"; nenhum em "Pronto" e em "Cancelado";
  3. `acrescentar_etapa('teste_setor', 'Etapa Nova do Setor', 'setor', false, <id de modelagem>)`: a etapa nova fica com a ordem antiga de `modelagem`, e `modelagem` sobe 1; um pendente em TC1 e um em TC2 (inativo);
  4. `acrescentar_etapa('teste_setor_fim', ..., 'setor', ..., null)` → `P0001` `etapas_do_setor_primeiro`; `mover_etapa(<modelagem>, 'subir')` (a vizinha de cima é do setor) → o mesmo;
  5. `mover_etapa(<revisao_setor>, 'subir')`: troca de ordem com `revisao_interna`; `mover_etapa` na ponta (subir a primeira etapa) não muda nada; sentido inválido → `P0001` `sentido_invalido`;
  6. `update etapas set ativa = false` em `modelagem`: o pendente de "Andando" some; o resolvido de "Pronto" fica;
  7. `update ... ativa = true`: "Andando" volta a ter `modelagem` pendente; "Pronto" continua com 1 andamento dela (o resolvido); "Cancelado" continua sem;
  8. excluir `modelagem` (usada em "Pronto") → `P0001` `etapa_usada:Reunião de modelagem`; excluir `teste_setor` (nunca usada) apaga a etapa e os pendentes dela;
  9. inclusão direta de andamento pelo administrador → `42501`;
  10. eventos `etapa`: 1 `acrescentar` de `teste_nova` com `depois.nome`; exatamente 1 `mudar_ordem` no teste todo (o da `revisao_setor`, nenhum da vizinha nem do espaço aberto); 1 `desativar`, 1 `reativar`, 1 `excluir` com `antes.codigo = 'teste_setor'`; `update` de `nome` → 1 `editar`; `update` sem mudança → nenhum evento novo;
  11. Integrante e Consulta: `acrescentar_etapa` → `42501`; `mover_etapa` → `42501`; desativar e excluir apagam/alteram 0 linhas. Inativo: os mesmos. Visitante: `acrescentar_etapa` e `mover_etapa` → `42501`;
  12. Consulta lê os eventos `etapa` (contagem > 0); Inativo não lê (0);
  13. `prosecdef` falso em `acrescentar_etapa`, `mover_etapa`, `private.sincronizar_andamentos_da_etapa` e `private.conferir_etapa_nunca_usada` (critério 2).
- [ ] Ajustar os testes 15 e 17 como em "Decisões".
- [ ] Comitar ("Ticket 10 de processos-etapas: teste de banco do catálogo (falha antes da migração)"), `git push -u origin processos-etapas-10`, disparar "Testes de banco" na branch e ler o resultado: o 22 deve falhar por função inexistente, e o 15 e o 17 nos pontos ajustados.

### Tarefa 2 — Migração (banco)

**Arquivos:** criar com `npx supabase migration new catalogo_de_etapas`, só depois da rodada que provou a falha; `src/types/database.ts` (gerado); `supabase/AMBIENTES.md`.

- [ ] Conferir em `supabase/migrations/20261008143706_historico_usuarios.sql` (e seguintes) se `eventos.acao` ou `eventos.entidade` têm restrição de valores; se tiverem, incluir `etapa` e as ações novas na migração.
- [ ] Escrever a migração:

```sql
-- Catálogo de etapas (processos-etapas, ticket 10; ADR 0004). Recusas em P0001 "motivo:valor"
-- (src/processos/andamentosSupabase.ts).

-- Abrir espaço e trocar duas etapas mudam várias ordens num comando só: a unicidade é conferida no fim dele.
alter table public.etapas drop constraint etapas_ordem_key;
alter table public.etapas add constraint etapas_ordem_key unique (ordem) deferrable initially immediate;

-- Os gatilhos do catálogo ligam este ajuste (só na transação) para a RLS de andamentos deixar incluir e apagar.
-- Quem chama a API não consegue ajustá-lo: só funções do banco o ligam.
create function private.sincronizando_catalogo() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.sincronizando_catalogo', true), '') = 'on' $$;

grant insert (etapa_id, setor_id, processo_id), delete on public.andamentos to authenticated;

create policy "andamentos: o catálogo do administrador inclui" on public.andamentos
  for insert to authenticated
  with check ((select private.sincronizando_catalogo()) and (select private.usuario_ativo())
    and (select private.perfil_atual()) = 'administrador');

create policy "andamentos: o catálogo do administrador apaga" on public.andamentos
  for delete to authenticated
  using ((select private.sincronizando_catalogo()) and (select private.usuario_ativo())
    and (select private.perfil_atual()) = 'administrador');

-- A etapa entra pendente em todos os setores (inclusive inativos) e nos processos em andamento ou suspensos que não
-- estão concluídos; só onde falta (a reativação usa a mesma regra).
create function private.incluir_andamentos_pendentes(etapa public.etapas) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.sincronizando_catalogo', 'on', true);
  if etapa.nivel = 'setor' then
    insert into public.andamentos (etapa_id, setor_id)
    select etapa.id, s.id from public.setores s
    where not exists (select 1 from public.andamentos a where a.etapa_id = etapa.id and a.setor_id = s.id);
  else
    insert into public.andamentos (etapa_id, processo_id)
    select etapa.id, p.id from public.processos_com_andamento p
    where p.situacao in ('em_andamento', 'suspenso')
      and not exists (select 1 from public.andamentos a where a.etapa_id = etapa.id and a.processo_id = p.id);
  end if;
  perform set_config('ep.sincronizando_catalogo', 'off', true);
end $$;

create function private.apagar_andamentos_pendentes(etapa uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('ep.sincronizando_catalogo', 'on', true);
  delete from public.andamentos where etapa_id = etapa and status = 'pendente';
  perform set_config('ep.sincronizando_catalogo', 'off', true);
end $$;

-- Sem security definer: roda com a permissão de quem muda o catálogo (a RLS de etapas e de andamentos decide).
create function private.sincronizar_andamentos_da_etapa() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.ativa and (tg_op = 'INSERT' or not old.ativa) then
    perform private.incluir_andamentos_pendentes(new);
  elsif tg_op = 'UPDATE' and old.ativa and not new.ativa then
    perform private.apagar_andamentos_pendentes(new.id);
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger sincronizar_andamentos_da_etapa after insert or update of ativa on public.etapas
  for each row execute function private.sincronizar_andamentos_da_etapa();

-- Etapa usada (algum andamento fora de pendente) não se exclui; a nunca usada leva os pendentes junto.
create function private.conferir_etapa_nunca_usada() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.andamentos where etapa_id = old.id and status <> 'pendente') then
    raise exception 'etapa_usada:%', old.nome;
  end if;
  perform private.apagar_andamentos_pendentes(old.id);
  return old;
end $$;

create trigger conferir_etapa_nunca_usada before delete on public.etapas
  for each row execute function private.conferir_etapa_nunca_usada();

-- Conferido depois de cada comando (abrir espaço e trocar passam por estados intermediários válidos).
create function private.conferir_ordem_dos_niveis() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.etapas s join public.etapas p on p.nivel = 'processo'
    where s.nivel = 'setor' and s.ordem > p.ordem) then
    raise exception 'etapas_do_setor_primeiro';
  end if;
  return null;
end $$;

create trigger conferir_ordem_dos_niveis after insert or update of ordem on public.etapas
  for each statement execute function private.conferir_ordem_dos_niveis();

-- As funções abaixo ligam 'ep.etapa_movida' com o id da etapa cuja mudança de ordem vira evento; vazio, todas viram.
create function private.registra_mudanca_de_ordem(etapa uuid) returns boolean
language sql stable set search_path = ''
as $$ select coalesce(nullif(current_setting('ep.etapa_movida', true), ''), etapa::text) = etapa::text $$;

-- Etapa nova antes de outra (ou no fim, com p_antes_de nulo), abrindo espaço na ordem.
create function public.acrescentar_etapa(p_codigo text, p_nome text, p_nivel public.nivel_da_etapa,
  p_obrigatoria boolean, p_antes_de uuid) returns uuid
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
  perform set_config('ep.etapa_movida', 'nenhuma', true); -- o espaço aberto não vira evento
  update public.etapas set ordem = ordem + 1 where ordem >= posicao;
  insert into public.etapas (codigo, nome, ordem, nivel, obrigatoria)
  values (p_codigo, btrim(p_nome), posicao, p_nivel, p_obrigatoria) returning id into nova;
  perform set_config('ep.etapa_movida', '', true);
  return nova;
end $$;

-- Troca a etapa com a vizinha de cima ('subir') ou de baixo ('descer'); na ponta, nada muda.
create function public.mover_etapa(p_etapa uuid, p_sentido text) returns void
language plpgsql set search_path = ''
as $$
declare
  movida public.etapas;
  vizinha public.etapas;
  trocadas integer;
begin
  if p_sentido not in ('subir', 'descer') then
    raise exception 'sentido_invalido:%', p_sentido;
  end if;
  select * into movida from public.etapas where id = p_etapa;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  select * into vizinha from public.etapas
  where (p_sentido = 'subir' and ordem < movida.ordem) or (p_sentido = 'descer' and ordem > movida.ordem)
  order by case when p_sentido = 'subir' then -ordem else ordem end limit 1;
  if not found then
    return;
  end if;
  perform set_config('ep.etapa_movida', movida.id::text, true);
  update public.etapas set ordem = case when id = movida.id then vizinha.ordem else movida.ordem end
  where id in (movida.id, vizinha.id);
  get diagnostics trocadas = row_count;
  perform set_config('ep.etapa_movida', '', true);
  if trocadas = 0 then
    raise exception 'sem permissão para mudar o catálogo' using errcode = '42501';
  end if;
end $$;

-- Evento da etapa com os campos legíveis; a gravação sem mudança não vira evento.
create function private.estado_da_etapa(etapa public.etapas) returns jsonb
language sql immutable set search_path = ''
as $$ select jsonb_build_object('codigo', etapa.codigo, 'nome', etapa.nome, 'nivel', etapa.nivel,
  'obrigatoria', etapa.obrigatoria, 'ativa', etapa.ativa, 'ordem', etapa.ordem) $$;

create function private.acao_da_etapa(antes jsonb, depois jsonb) returns text
language sql immutable set search_path = ''
as $$ select case
  when antes is null then 'acrescentar'
  when depois is null then 'excluir'
  when antes -> 'ativa' <> depois -> 'ativa' then
    case when (depois ->> 'ativa')::boolean then 'reativar' else 'desativar' end
  when antes - 'ordem' = depois - 'ordem' then 'mudar_ordem'
  else 'editar' end $$;

create function private.registrar_evento_da_etapa() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op = 'INSERT' then null else private.estado_da_etapa(old) end;
  depois jsonb := case when tg_op = 'DELETE' then null else private.estado_da_etapa(new) end;
  acao text := private.acao_da_etapa(antes, depois);
begin
  if antes = depois or (acao = 'mudar_ordem' and not private.registra_mudanca_de_ordem(new.id)) then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), acao, 'etapa', coalesce(new.id, old.id)::text,
    jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

create trigger registrar_evento_da_etapa after insert or update or delete on public.etapas
  for each row execute function private.registrar_evento_da_etapa();

-- Todo perfil ativo lê os eventos do catálogo (os de usuários seguem só do administrador).
create policy "eventos: perfil ativo lê o catálogo" on public.eventos
  for select to authenticated
  using ((select private.usuario_ativo()) and entidade = 'etapa');

revoke execute on function private.sincronizando_catalogo(), private.incluir_andamentos_pendentes(public.etapas),
  private.apagar_andamentos_pendentes(uuid), private.registra_mudanca_de_ordem(uuid),
  public.acrescentar_etapa(text, text, public.nivel_da_etapa, boolean, uuid), public.mover_etapa(uuid, text)
  from public, anon;
grant execute on function private.sincronizando_catalogo(), private.incluir_andamentos_pendentes(public.etapas),
  private.apagar_andamentos_pendentes(uuid), private.registra_mudanca_de_ordem(uuid),
  public.acrescentar_etapa(text, text, public.nivel_da_etapa, boolean, uuid), public.mover_etapa(uuid, text)
  to authenticated;
revoke execute on function private.sincronizar_andamentos_da_etapa(), private.conferir_etapa_nunca_usada(),
  private.conferir_ordem_dos_niveis(), private.estado_da_etapa(public.etapas), private.acao_da_etapa(jsonb, jsonb),
  private.registrar_evento_da_etapa()
  from public, anon, authenticated;
```

  Se o `registrar_evento_da_etapa` precisar ler `new.id` num `DELETE` (onde `new` é nulo) e o Postgres recusar, separar a referência numa variável com `case tg_op`.
- [ ] Commitar a migração na branch, `git push`, disparar "Migrar banco de desenvolvimento" com `<versão>_catalogo_de_etapas.sql` (só o nome do arquivo, sem a pasta, lição do ticket 08) e ler o resultado.
- [ ] Disparar "Testes de banco" na branch: os 23 arquivos verdes. Se falhar, corrigir a causa (teste ou nova migração; a já aplicada não se edita) e repetir; três tentativas sem resolver, parar e perguntar.
- [ ] `npm run db:types` (vínculo conferido): entram `acrescentar_etapa` e `mover_etapa` em `Functions`.
- [ ] Registrar a migração em `supabase/AMBIENTES.md` (lista do `migration repair`), no formato das anteriores.
- [ ] Commitar os tipos e o AMBIENTES ("Ticket 10 de processos-etapas: migração do catálogo de etapas").

### Tarefa 3 — Tipos e catálogo falso

**Arquivos:** `src/processos/tipos.ts`; criar `src/processos/CatalogoFalso.ts` e `src/processos/CatalogoFalso.test.ts`; `src/processos/ProcessosFalso.ts` (uma linha de campo e o import).

- [ ] Tipos (critério 3):

```ts
export type NivelDaEtapa = 'setor' | 'processo'

/** Uma etapa do catálogo como a Administração a mostra: ativa ou não, em qualquer nível. */
export type EtapaNoCatalogo = EtapaDoCatalogo & { nivel: NivelDaEtapa; obrigatoria: boolean }

/** O que o formulário de etapa nova grava; `antesDe` null põe a etapa no fim. */
export type EtapaNova = { codigo: string; nome: string; nivel: NivelDaEtapa; obrigatoria: boolean; antesDe: string | null }

/** O que a edição muda: código e nível não mudam depois de criados. */
export type DadosDaEtapa = { nome: string; obrigatoria: boolean }

export type ModuloDoCatalogo = {
  /** Todas as etapas, ativas e inativas, na ordem. */
  listarCatalogo(): Promise<EtapaNoCatalogo[]>
  acrescentarEtapa(etapa: EtapaNova): Promise<void>
  editarEtapa(id: string, dados: DadosDaEtapa): Promise<void>
  moverEtapa(id: string, sentido: 'subir' | 'descer'): Promise<void>
  desativarEtapa(id: string): Promise<void>
  reativarEtapa(id: string): Promise<void>
  excluirEtapa(id: string): Promise<void>
}
```

  e `catalogo: ModuloDoCatalogo` em `ModuloDeProcessos`.
- [ ] Testes do falso (`CatalogoFalso.test.ts`), escritos antes, cada um um comportamento: acrescentar antes de uma etapa abre espaço na ordem; etapa nova de nível processo entra pendente no caminho de um processo em andamento e de um suspenso, e não no concluído nem no cancelado, e vira coluna (`etapasDoCatalogo`); etapa nova do setor entra nas etapas de todos os setores; etapa do setor depois de uma do processo → `TravaDoBanco` "As etapas do setor precisam vir antes das etapas do processo."; nome repetido (sem diferenciar maiúsculas) → "Já existe uma etapa com o nome {nome}."; subir e descer trocam com a vizinha; desativar tira os pendentes e mantém os resolvidos; reativar devolve os pendentes onde faltam; excluir etapa usada → "A etapa {nome} já foi usada; desative-a em vez de excluir."; excluir nunca usada some com os pendentes; `falharLeitura`, `segurarLeitura` e `falhaDeGravacao` como no `ProcessosFalso`.
- [ ] Implementar `CatalogoFalso` (classe `implements ModuloDoCatalogo`, construída com o `ProcessosFalso`, tipado por um `Pick` com `processos`, `etapasDoCatalogo` e `etapasDoSetor`), com `etapas: EtapaNoCatalogo[]` público para os testes de tela. Depois de cada gravação, `sincronizar()` refaz `dono.etapasDoCatalogo` (as de nível processo) e inclui ou tira os pendentes. Em `ProcessosFalso`: `catalogo = new CatalogoFalso(this)`.
- [ ] `npx vitest run src/processos/CatalogoFalso.test.ts` verde; `npx tsc --noEmit` acusa só o módulo real ainda sem `catalogo` (Tarefa 4).

### Tarefa 4 — Catálogo real

**Arquivos:** criar `src/processos/catalogoSupabase.ts` e `src/processos/catalogoSupabase.test.ts` (molde de `reclassificacaoSupabase.test.ts`, com `src/testes/ClienteSupabaseFalso.ts`); `src/processos/processosSupabase.ts`; `src/processos/andamentosSupabase.ts` (as duas recusas novas no padrão e nas frases).

- [ ] Testes (antes): `listarCatalogo` lê `etapas` com `id, codigo, nome, ordem, nivel, obrigatoria, ativa`, em ordem, e devolve os tipos da tela; falha de leitura vira `Error` com a mensagem do banco; `acrescentarEtapa` chama `acrescentar_etapa` com `p_antes_de` nulo para "No fim"; `moverEtapa` chama `mover_etapa`; `etapa_usada:Reunião de modelagem` e `etapas_do_setor_primeiro` viram as frases do critério 3; `23505` com `etapas_nome_unico` e com `etapas_codigo_key` viram as frases de nome e código repetidos; editar, desativar, reativar e excluir que não mudam nenhuma linha viram recusa por perfil (etapa ainda legível) ou `CadastroInexistente` (etapa sumiu), pelo `porQueNadaMudou`; `42501` vira "Seu perfil não permite alterar os processos.".
- [ ] Implementar `criarCatalogoSupabase(cliente, recusas): ModuloDoCatalogo`, com `catalogo: criarCatalogoSupabase(cliente, RECUSAS_DOS_PROCESSOS)` em `criarProcessosSupabase`. Acrescentar `etapa_usada` e `etapas_do_setor_primeiro` a `PADRAO_DA_RECUSA` e `FRASE_DA_RECUSA` de `andamentosSupabase.ts` (e o nome da migração no comentário de lá).
- [ ] `npx vitest run src/processos` e `npx tsc --noEmit` verdes; commitar as Tarefas 3 e 4 ("Ticket 10 de processos-etapas: catálogo no módulo de processos, real e falso").

### Tarefa 5 — Validação da etapa e textos do histórico

**Arquivos:** criar `src/processos/validacaoDaEtapa.ts` e o teste; `src/cadastros/historicoDosCadastros.ts` e o teste; `src/cadastros/historicoSupabase.ts` (`'etapa'` em `ENTIDADES_DOS_CADASTROS`) e o teste.

- [ ] Testes (antes) da validação (critério 4): nome vazio ou só espaços → "O nome da etapa é obrigatório."; código fora de `^[a-z0-9_]{2,40}$` ("Revisão", "a", 41 caracteres) → a frase do código com o valor recebido; código válido e nome com espaços nas pontas → dados limpos.
- [ ] Testes (antes) do histórico (critério 7): `textoDaAcaoDoCadastro` para `etapa` com `acrescentar`, `mudar_ordem`, `desativar`, `reativar`, `editar` e `excluir` → "Acrescentou a etapa ao catálogo", "Mudou a ordem do catálogo", "Desativou a etapa", "Reativou a etapa", "Editou", "Excluiu"; `nomeDoItem` de um evento `etapa` → "{código} — {nome}"; `descreverEstadoDoCadastro` mostra Nível ("Setor"/"Processo"), Obrigatória ("Sim"/"Não"), Situação ("Ativa"/"Inativa") e Posição; o módulo real pede a entidade `etapa`.
- [ ] Implementar: `TEXTO_DA_ACAO_DA_ETAPA` em `TEXTOS_DA_ENTIDADE`; `etapa` junto de `macroprocesso` no `codigoENome` de `nomeDoItem` (um conjunto `ENTIDADES_COM_CODIGO`, sem aumentar a complexidade); rótulos `nivel`, `obrigatoria`, `ativa` e `ordem` em `ROTULO_DO_CAMPO` e os valores no mapa de `valorDoProcesso` (que passa a se chamar `valorPorRotulo`, por servir também à etapa).
- [ ] `npx vitest run src/processos src/cadastros` verde; commitar ("Ticket 10 de processos-etapas: validação da etapa e textos do catálogo no histórico").

### Tarefa 6 — Aba "Catálogo de etapas" na Administração

**Arquivos:** `src/App.tsx` (passa `processos` à Administração); `src/components/administracao/AreaDeAdministracao.tsx` (abas); criar em `src/components/administracao/`: `CatalogoDeEtapas.tsx` (carregamento, erro e lista), `CatalogoEditavel.tsx` (formulário, exclusão e falhas, no molde de `ResponsaveisEditaveis`), `TabelaDoCatalogo.tsx` (linhas e botões, no molde de `TabelaDeResponsaveis`), `FormularioDaEtapa.tsx` (nova e editar, no molde de `FormularioDeResponsavel`); `Administracao.css` (só o que faltar); criar `src/App.catalogoDeEtapas.test.tsx` e `src/App.catalogoNosProcessos.test.tsx`.

- [ ] Testes de tela (antes), aplicativo inteiro com `AcessoFalso`, `CadastrosFalso` e `ProcessosFalso` (critérios 4, 5 e 8):
  - `App.catalogoDeEtapas.test.tsx`: o administrador vê as abas "Usuários" e "Catálogo de etapas"; a lista em ordem com nome, nível, "Obrigatória" ou "Opcional" e a pílula "Inativa"; Integrante e Consulta não veem a aba; "Carregando catálogo…"; erro com [Tentar de novo] que recarrega; [Nova etapa] com sucesso na posição escolhida ("Entrar antes de" e "No fim"); código inválido mostra a frase com o valor e não grava; nome vazio idem; falha de gravação mostra "A alteração não foi salva: {motivo}. Seus dados continuam no formulário."; recusa "As etapas do setor precisam vir antes das etapas do processo."; [Editar] (nome e obrigatória) com sucesso e com falha; [Subir] e [Descer] com sucesso, desabilitados nas pontas, e falha; [Desativar] e [Reativar] com sucesso e com falha; [Excluir] abre "Excluir a etapa {nome} do catálogo?" com [Excluir etapa] e [Cancelar]; excluir com sucesso; recusa "A etapa {nome} já foi usada; desative-a em vez de excluir."; Cancelar não grava.
  - `App.catalogoNosProcessos.test.tsx`: etapa nova de nível processo vira coluna no Quadro; aparece pendente no caminho do painel de um processo em andamento e não no de um concluído; desativar a etapa em que um processo está mantém a coluna enquanto ele estiver nela.
- [ ] Implementar as abas e os componentes. Nível na tela: "Setor" e "Processo"; obrigatória: caixa de marcar "Obrigatória". Posição: seletor "Posição" com "Antes de {nome}" para cada etapa e "No fim" (o padrão). Cada botão da linha com `aria-label` "{ação} {nome}". Depois de cada gravação, a lista recarrega.
- [ ] `npm test`, `npm run lint` e `npx tsc --noEmit` verdes; commitar ("Ticket 10 de processos-etapas: aba do catálogo de etapas na Administração").

### Tarefa 7 — Fechamento

- [ ] Rodar `npm test` inteiro duas vezes (os testes de foco já foram instáveis) e o lint.
- [ ] Acrescentar a `.scratch/processos-etapas/desvios.md` a entrada datada do ticket 10: as frases que a spec não trazia (ver "Decisões"); a exclusão direta de andamento que passou de `42501` a "nada apagado" nos testes 15 e 17; a recusa de etapa usada que passou de `23503` a `etapa_usada`; o evento de ordem só da etapa movida; os eventos do catálogo no Histórico dos cadastros; o evento da etapa por gatilho `security definer` (como todos os eventos do projeto); conferência visual não feita (critérios `[visual]` para o `/polir` e o `/ship`).
- [ ] Itens de `.claude/regras/nao-testados.md` (blocos `/executar-complexo` e "Qualquer momento") que aconteceram e ainda não estão em `.scratch/melhorias-protocolo.md`.
- [ ] Commitar, `git switch main`, `git merge processos-etapas-10`, `npm test` na `main`, `git branch -d processos-etapas-10`, linha `Concluído em` no ticket, commit e `git push` da `main` (autorizado); conferir o "Testes de banco" disparado pelo envio.
