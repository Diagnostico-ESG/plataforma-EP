# Ticket 08 de processos-etapas (Subprocessos e reclassificação) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cadastrar subprocesso ligado a um pai do tipo Processo (seguindo o macroprocesso dele) e reclassificar qualquer item com motivo, mantendo o mesmo item; o banco impõe um nível só, pai do tipo Processo, macroprocesso do pai e nenhum subprocesso perdido numa exclusão.

**Architecture:** uma migração dá ao logado o privilégio de incluir o pai e de alterar tipo e pai, mas um gatilho recusa a mudança de tipo e pai fora de `public.reclassificar_processo` (sem `security definer`; a RLS decide). Outro gatilho, "antes", confere o pai e faz o subprocesso adotar o macroprocesso dele; um gatilho "depois" leva a mudança de macroprocesso do pai aos filhos (o `preparar_processo` já inclui o setor envolvido). Uma recusa "antes de apagar" dá a contagem de subprocessos. O módulo de processos ganha o pai no cadastro, a estrutura (pai e subprocessos) na leitura e `reclassificarProcesso` (real e falso). A tela ganha o seletor de pai no formulário, a seção da estrutura no painel e a janela de reclassificar.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 8 a 11, 13, 16, 60 a 67; "Interface", "Modelo de dados", "Regras que o banco impõe", "Regras de estado") · **Ticket:** `.scratch/processos-etapas/issues/08-subprocessos-e-reclassificacao.md` (critérios citados como "critério N", na ordem do ticket).

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Regras de `.claude/regras/banco.md` lidas nesta sessão: teste antes da migração; migração, teste e tipos no mesmo commit; função pública sem `security definer`, com `revoke ... from public, anon` e `grant execute ... to authenticated`; função só de gatilho com `revoke` de todos; `search_path` vazio e nomes qualificados; alvo do banco conferido (vínculo atual = desenvolvimento, `yclkzyoebpsxmgpbcbus`).
- Banco só pelo GitHub Actions, na branch `processos-etapas-08`: "Testes de banco" e "Migrar banco de desenvolvimento" (autorizados no CLAUDE.md, "Ajustes deste Projeto"). Produção fora deste ticket.
- Recusas do banco chegam como `P0001` "motivo:valor" e viram `TravaDoBanco` com a frase pronta. Frases do ticket (critério 3): "Este processo tem {n} subprocessos; reclassifique-os ou exclua-os antes." e "O processo pai precisa ser do tipo Processo.". Aviso (critério 5): "O item passa do macroprocesso {de} para {para}, o do processo pai.".
- Funções de 4 a 20 linhas, arquivos até 300, complexidade até 10, tipos explícitos, sem `any`.

## Decisões do plano

- **Transições de tipo** (spec, "Reclassificação"): `a_classificar>processo`, `a_classificar>subprocesso`, `processo>subprocesso`, `subprocesso>processo`. As demais são recusadas com `tipo_invalido:de:para` (a tela não as oferece).
- **Pai nulo:** o gatilho só confere o pai quando ele vem preenchido; subprocesso sem pai continua recusado pela restrição `processos_pai_coerente` (23514, como o teste 17 já prova), e a função de reclassificar recusa `pai_nao_e_processo` antes de gravar. Processo ou "a classificar" com pai: a mesma restrição (23514).
- **O pai não pode ser o próprio item:** recusado como `pai_nao_e_processo` (a tela não o oferece).
- **Ordem dos gatilhos "antes" de `processos`** (o Postgres os dispara em ordem alfabética): `adotar_macroprocesso_do_pai` roda antes de `preparar_processo`, que inclui o setor envolvido no macroprocesso já adotado. `conferir_processo_sem_subprocessos` roda antes de `registrar_exclusao_do_processo`.
- **Evento:** `estado_do_processo` acrescenta `processo_pai_nome` só quando há pai (o teste 17 compara o estado de um processo sem pai e não muda). A ação é `reclassificar` quando o tipo muda; o motivo vem do ajuste `ep.motivo_da_reclassificacao`.
- **Estrutura no painel:** lida de `processos` (pai pelo id, subprocessos por `processo_pai_id`, por nome), sem mudar a view. `ProcessoDaLista` ganha `processoPaiId` (a view já devolve `processo_pai_id`; a Lista do ticket 09 vai usá-lo).
- **Pais possíveis** (formulário e janela): `listarProcessos()` filtrado por `tipo === 'processo'` (sem o próprio item); nada novo no módulo.
- O teste 17 muda em dois pontos: "não troca o tipo / o pai direto" passa a ser a recusa do gatilho (`tipo_so_pela_funcao`) para quem altera, no molde do bloco da situação; e a inclusão com pai deixa de ser 42501 e passa a ser 23514 ("a classificar com pai").

## Tarefas

### Tarefa 1 — Teste de banco 21 (falha primeiro)

**Arquivos:** criar `supabase/tests/21_subprocessos_e_reclassificacao.test.sql` (molde do 20: usuários a1 a a4, `_tap`, `plan(N)` com o N exato); alterar `supabase/tests/17_processos.test.sql` (linhas ~83-87 e ~154-158).

- [x] Escrever o teste 21 (critérios 1 e 2). Preparação como integrante: setores TS8 e TS9, macroprocessos "Macro Um" e "Macro Dois", TS8 envolvido nos dois, TS9 em nenhum; etapas do setor resolvidas; processos "Pai" (tipo processo, Macro Um), "Outro Pai" (processo, Macro Dois), "Solto" (a_classificar, Macro Dois), "Avulso" (processo, Macro Dois). Asserções:
  1. subprocesso com pai subprocesso → `P0001` `pai_nao_e_processo`; com pai "a classificar" → o mesmo;
  2. processo com pai e "a classificar" com pai → `23514`;
  3. subprocesso "Filho" (setor TS9, macroprocesso informado Macro Dois, pai "Pai") → aceito; macroprocesso do Filho = Macro Um; TS9 passa a envolvido em Macro Um; o evento `criar` do Filho tem `processo_pai_nome` = 'Pai';
  4. editar o macroprocesso do Filho direto para Macro Dois → continua Macro Um;
  5. mudar o macroprocesso do Pai para Macro Dois → o Filho vai para Macro Dois e TS9 passa a envolvido em Macro Dois;
  6. excluir o Pai → `P0001` `processo_com_subprocessos:1`;
  7. `reclassificar_processo` sem motivo (só espaços) → `motivo_obrigatorio`; Pai para subprocesso de "Outro Pai" → `processo_com_subprocessos:1`; "Avulso" para subprocesso sem pai → `pai_nao_e_processo`; "Avulso" para subprocesso de "Solto" → `pai_nao_e_processo`; "Avulso" para subprocesso de si mesmo → `pai_nao_e_processo`; "Avulso" para `a_classificar` → `tipo_invalido:processo:a_classificar`;
  8. Filho para processo → tipo processo, pai nulo, macroprocesso mantido; evento `reclassificar` com `antes.tipo` subprocesso, `depois.tipo` processo e `motivo`;
  9. "Solto" (com uma etapa concluída antes) para subprocesso de "Pai" → tipo subprocesso, macroprocesso do Pai; o mesmo id, os 6 andamentos e a etapa concluída mantidos; evento com `antes.tipo` a_classificar, `depois.processo_pai_nome` 'Pai' e `motivo`;
  10. `update` direto de `tipo` e de `processo_pai_id` → `tipo_so_pela_funcao`;
  11. processo inexistente → `registro_inexistente`; `reclassificar_processo` sem `security definer` (`prosecdef` falso);
  12. Consulta → `42501`; inativo → `registro_inexistente`; visitante → `42501`.
- [x] Ajustar o teste 17 como descrito em "Decisões" (mesmo número de asserções: o `plan(79)` não muda).
- [x] Comitar, `git push -u origin processos-etapas-08`, disparar "Testes de banco" e ler o resultado: o 21 deve falhar por função inexistente e o 17 nos dois pontos ajustados.

### Tarefa 2 — Migração (banco)

**Arquivos:** criar com `npx supabase migration new subprocessos_e_reclassificacao`, só depois da rodada que provou a falha; `src/types/database.ts` (gerado); `supabase/AMBIENTES.md`.

- [x] Escrever a migração:

```sql
-- Subprocessos e reclassificação (processos-etapas, ticket 08). Recusas em P0001 "motivo:valor"
-- (src/processos/andamentosSupabase.ts).

-- O pai entra no cadastro; tipo e pai têm privilégio de coluna, mas só mudam pela função de reclassificar.
grant insert (processo_pai_id) on public.processos to authenticated;
grant update (tipo, processo_pai_id) on public.processos to authenticated;

create function private.reclassificando() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.reclassificando', true), '') = 'on' $$;

create function private.conferir_tipo_do_processo() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.reclassificando() and (new.tipo, new.processo_pai_id) is distinct from (old.tipo, old.processo_pai_id) then
    raise exception 'tipo_so_pela_funcao';
  end if;
  return new;
end $$;
create trigger conferir_tipo_do_processo before update on public.processos
  for each row execute function private.conferir_tipo_do_processo();

-- O pai é sempre um Processo (nunca o próprio item); o subprocesso adota o macroprocesso dele. Roda antes de
-- preparar_processo (ordem alfabética), que inclui o setor envolvido no macroprocesso adotado.
create function private.adotar_macroprocesso_do_pai() returns trigger
language plpgsql set search_path = ''
as $$
declare
  pai public.processos;
begin
  if new.processo_pai_id is null or new.tipo <> 'subprocesso' then
    return new; -- pai nulo ou tipo sem pai: a restrição processos_pai_coerente decide
  end if;
  select * into pai from public.processos where id = new.processo_pai_id;
  if pai.tipo is distinct from 'processo' or pai.id = new.id then
    raise exception 'pai_nao_e_processo';
  end if;
  new.macroprocesso_id := pai.macroprocesso_id;
  return new;
end $$;
create trigger adotar_macroprocesso_do_pai before insert or update on public.processos
  for each row execute function private.adotar_macroprocesso_do_pai();

-- Mudar o macroprocesso do pai leva os filhos junto (o gatilho de cada filho adota e inclui o setor envolvido).
create function private.levar_macroprocesso_aos_subprocessos() returns trigger
language plpgsql set search_path = ''
as $$
begin
  update public.processos set macroprocesso_id = new.macroprocesso_id where processo_pai_id = new.id;
  return null;
end $$;
create trigger levar_macroprocesso_aos_subprocessos after update of macroprocesso_id on public.processos
  for each row when (old.macroprocesso_id is distinct from new.macroprocesso_id)
  execute function private.levar_macroprocesso_aos_subprocessos();

create function private.conferir_processo_sem_subprocessos() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.processos where processo_pai_id = old.id);
begin
  if total > 0 then
    raise exception 'processo_com_subprocessos:%', total;
  end if;
  return old;
end $$;
create trigger conferir_processo_sem_subprocessos before delete on public.processos
  for each row execute function private.conferir_processo_sem_subprocessos();

create function private.conferir_reclassificacao(processo uuid, de public.tipo_de_processo,
  para public.tipo_de_processo, pai uuid) returns void
language plpgsql stable set search_path = ''
as $$
declare
  filhos integer := (select count(*) from public.processos where processo_pai_id = processo);
begin
  if de::text || '>' || para::text not in ('a_classificar>processo', 'a_classificar>subprocesso',
    'processo>subprocesso', 'subprocesso>processo') then
    raise exception 'tipo_invalido:%:%', de, para;
  end if;
  if para = 'subprocesso' and filhos > 0 then
    raise exception 'processo_com_subprocessos:%', filhos;
  end if;
  if para = 'subprocesso' and pai is null then
    raise exception 'pai_nao_e_processo';
  end if;
end $$;

-- Sem security definer: roda com a permissão de quem chama e a RLS decide (Consulta: nenhuma linha, 42501).
create function public.reclassificar_processo(p_processo uuid, p_tipo public.tipo_de_processo, p_pai uuid,
  p_motivo text) returns void
language plpgsql set search_path = ''
as $$
declare
  motivo text := nullif(btrim(p_motivo), '');
  atual public.tipo_de_processo := (select tipo from public.processos where id = p_processo);
  linhas integer;
begin
  if motivo is null then raise exception 'motivo_obrigatorio'; end if;
  if atual is null then raise exception 'registro_inexistente'; end if;
  perform private.conferir_reclassificacao(p_processo, atual, p_tipo, p_pai);
  perform set_config('ep.reclassificando', 'on', true), set_config('ep.motivo_da_reclassificacao', motivo, true);
  update public.processos set tipo = p_tipo, processo_pai_id = case when p_tipo = 'subprocesso' then p_pai end
  where id = p_processo;
  get diagnostics linhas = row_count;
  perform set_config('ep.reclassificando', 'off', true), set_config('ep.motivo_da_reclassificacao', '', true);
  if linhas = 0 then
    raise exception 'sem permissão para reclassificar o processo' using errcode = '42501';
  end if;
end $$;
```

  Depois, no mesmo arquivo: `create or replace` de `private.estado_do_processo` (igual ao do ticket 04, mais `|| case when processo.processo_pai_id is not null then jsonb_build_object('processo_pai_nome', (select nome from public.processos where id = processo.processo_pai_id)) else '{}'::jsonb end`); de `private.acao_do_processo` (primeiro caso novo: `antes ->> 'tipo' is distinct from depois ->> 'tipo'` → `'reclassificar'`, depois o do ticket 07); e de `private.registrar_evento_do_processo` (igual ao do ticket 07, com `motivo := coalesce(<o da situação>, case when private.reclassificando() then nullif(current_setting('ep.motivo_da_reclassificacao', true), '') end)`). Fecho: `revoke execute` de `public, anon, authenticated` nas funções só de gatilho (`conferir_tipo_do_processo`, `adotar_macroprocesso_do_pai`, `levar_macroprocesso_aos_subprocessos`, `conferir_processo_sem_subprocessos`); `revoke ... from public, anon` e `grant execute ... to authenticated` em `private.reclassificando()`, `private.conferir_reclassificacao(...)` e `public.reclassificar_processo(...)`.
- [x] Comitar, `git push`, disparar "Migrar banco de desenvolvimento" na branch com o arquivo novo e depois "Testes de banco": os 22 arquivos verdes. Falha do próprio teste se corrige no teste; falha da migração já aplicada se corrige com migração nova.
- [x] `npm run db:types` (vínculo conferido); conferir que `reclassificar_processo` entrou em `Functions`.
- [x] Registrar a migração em `supabase/AMBIENTES.md`. Comitar migração, teste e tipos juntos.

### Tarefa 3 — Módulo de processos (real e falso)

**Arquivos:** `src/processos/tipos.ts`; `processoDaLinha.ts`; `lerProcessoSupabase.ts` (+ teste); `gravarProcessoSupabase.ts` (+ teste); `andamentosSupabase.ts` (padrão e frases); criar `frasesDeReclassificacao.ts`; criar `reclassificacaoSupabase.ts` (+ teste); `processosSupabase.ts`; criar `reclassificacaoFalso.ts` (+ teste); `ProcessosFalso.ts`; fixtures de `ProcessoLido`/`ProcessoDaLista` nos testes que as montam à mão (`App.andamentoDoProcesso`, `App.cadastrarProcesso`, `App.painelDoProcesso`, `App.quadro`, `App.situacaoDoProcesso`, `App.voltarDatasResponsavel`, `andamentoFalso.test`, `lerProcessoSupabase.test`, `ProcessosFalso.situacao.test`, `ProcessosFalso.voltar.test`).

**Interfaces (produz):**
- `type ItemDaEstrutura = { id: string; nome: string }`
- `ProcessoDaLista.processoPaiId: string | null`; `ProcessoLido.processoPai: ItemDaEstrutura | null` e `ProcessoLido.subprocessos: ItemDaEstrutura[]` (por nome)
- `DadosDoProcesso.tipo: TipoDeProcesso` e `DadosDoProcesso.processoPaiId: string | null` (a edição ignora os dois)
- `type Reclassificacao = { tipo: 'processo' | 'subprocesso'; processoPaiId: string | null }`
- `ModuloDeProcessos.reclassificarProcesso(id: string, reclassificacao: Reclassificacao, motivo: string): Promise<void>`
- `frasesDeReclassificacao.ts`: `fraseDosSubprocessos(total: string)`, `FRASE_DO_PAI` e `fraseDeTipoInvalido(de: string, para: string)` ("Um item {rótulo de} não pode passar a {rótulo para}.", com `ROTULO_DO_TIPO` em minúsculas)

- [x] Testes primeiro: `reclassificacaoSupabase.test.ts` (chama `rpc('reclassificar_processo', { p_processo, p_tipo, p_pai, p_motivo })`; `processo_com_subprocessos:2`, `pai_nao_e_processo`, `tipo_invalido:processo:a_classificar` e `motivo_obrigatorio` viram as frases; `42501` vira "Seu perfil não permite alterar os processos."; `registro_inexistente` vira `CadastroInexistente`); em `gravarProcessoSupabase.test.ts`, o cadastro envia `processo_pai_id` e a exclusão recusada com `processo_com_subprocessos:3` vira a frase do critério 3; em `lerProcessoSupabase.test.ts`, o lido traz `processoPai` e `subprocessos`; `reclassificacaoFalso.test.ts` (as transições, a recusa com a contagem, o pai que não é Processo, a adoção do macroprocesso e o nome dele no cartão, virar processo apaga o pai e mantém o macroprocesso, mesmo id e etapas; a estrutura lida; a exclusão recusada; o macroprocesso do pai levado aos filhos).
- [x] Implementar: tipos e fixtures (`processoPaiId: null`, `processoPai: null`, `subprocessos: []`); `processoDaLinha` lê `processo_pai_id`; `lerProcesso` lê pai e subprocessos em paralelo com as etapas (`cliente.from('processos').select('id, nome')`); `valoresDoCadastro` com `processo_pai_id`; `falhaDoProcesso` termina em `falhaDoAndamento(erro, recusas)` em vez de `recusaPorPerfil`; `PADRAO_DA_RECUSA` e `FRASE_DA_RECUSA` com `processo_com_subprocessos`, `pai_nao_e_processo` e `tipo_invalido`; `reclassificacaoSupabase.ts` no molde de `situacaoSupabase.ts`; `ProcessosFalso` chama as funções puras de `reclassificacaoFalso.ts` em `criarProcesso` (pai), `editarProcesso` (filhos acompanham), `excluirProcesso` (recusa), `lerProcesso` (estrutura calculada) e `reclassificarProcesso`. Se o `ProcessosFalso` passar de 300 linhas, extrair o que for de reclassificação para `reclassificacaoFalso.ts`.
- [x] `npm test`, `npx tsc --noEmit` e `npm run lint` verdes; comitar.

### Tarefa 4 — Formulário: subprocesso no cadastro

**Arquivos:** `src/processos/validacaoDoProcesso.ts` (+ teste); `src/components/processos/CamposDoProcesso.tsx`; `FormularioDoProcesso.tsx`; `FormularioPronto.tsx`; `PainelDeNovoProcesso.tsx`; `PainelDoProcesso.tsx` (passa `processos` ao formulário); criar `src/App.subprocessos.test.tsx`.

- [x] Teste de tela primeiro (aplicativo inteiro, `ProcessosFalso` e `CadastrosFalso`; critérios 4 e 8): o tipo oferece Processo, Subprocesso e A classificar; Subprocesso mostra o seletor "Processo pai" só com os processos do tipo Processo; escolher o pai fixa o macroprocesso no dele (campo desabilitado); salvar sem pai mostra "Escolha o processo pai."; cadastrar o subprocesso grava `tipo: 'subprocesso'` e o pai, e o cartão aparece com a pílula "Subprocesso"; falha de gravação mostra a frase e mantém os dados; a edição não mostra tipo nem pai.
- [x] Implementar: `CamposDoProcesso` ganha `processoPaiId`; `problemaNoProcesso` recusa subprocesso sem pai com "Escolha o processo pai."; `dadosDoProcesso` manda o pai só no subprocesso; `OpcoesDoProcesso.pais: ProcessoDaLista[]`; `FormularioDoProcesso` recebe `processos` e, só no cadastro, carrega os pais (`listarProcessos`, filtro `tipo === 'processo'`); `FormularioPronto` copia o macroprocesso do pai ao escolhê-lo; `CampoDoPai` no `CamposDoProcesso`.
- [x] `npm test`, `npx tsc --noEmit` e `npm run lint` verdes; comitar.

### Tarefa 5 — Painel: estrutura, Reclassificar e histórico

**Arquivos:** criar `src/components/processos/EstruturaDoProcesso.tsx`, `AcoesDeReclassificacao.tsx` e `JanelaDeReclassificacao.tsx`; alterar `AcoesDoProcesso.tsx`, `PainelDoProcesso.tsx`; `src/cadastros/historicoDosCadastros.ts` (+ teste); criar `src/App.reclassificar.test.tsx` (e completar `App.subprocessos.test.tsx` com a navegação e a exclusão).

- [x] Testes de tela primeiro (critérios 5 a 8): o painel do pai mostra "Subprocessos" (cada um é um link que abre o painel dele) e o do subprocesso mostra "Processo pai" (link de volta); excluir o pai mostra "Este processo tem 1 subprocessos; reclassifique-os ou exclua-os antes."; [Reclassificar] abre a janela "Reclassificar o processo {nome}?" com "Novo tipo" (só os destinos permitidos), "Processo pai" (só no Subprocesso, sem o próprio item) e "Motivo"; o botão "Reclassificar" fica desabilitado sem motivo (ou sem pai no Subprocesso) e Esc fecha sem gravar; o aviso "O item passa do macroprocesso {de} para {para}, o do processo pai." aparece só quando o macroprocesso muda; reclassificar nos três sentidos (a classificar → processo, processo → subprocesso, subprocesso → processo) com sucesso (tipo e pílula mudam) e com falha (frase no `role="alert"`, inclusive as duas recusas do critério 3); a Consulta não vê [Reclassificar], mas vê a estrutura; o histórico mostra "Reclassificou" com o tipo de e para, o processo pai e "Motivo".
- [x] Implementar: `EstruturaDoProcesso` (seção "Processo pai" ou "Subprocessos", links `#/processos/<id>`) no `DetalhesDoProcesso`, para todos os perfis; `JanelaDeReclassificacao` (a mesma `<dialog>` com a classe `janela-confirmacao` da `JanelaComCampo`, foco no primeiro campo, carrega os pais com `listarProcessos` ao abrir); `AcoesDeReclassificacao` (botão e `useGravacaoComFalha`) dentro de `AcoesDoProcesso`; no histórico, `reclassificar: 'Reclassificou'` nas ações do processo, `reclassificar` nas ações com motivo e o rótulo `processo_pai_nome: 'Processo pai'`.
- [x] Conferir os testes antigos de painel e histórico; `npm test`, `npx tsc --noEmit` e `npm run lint` verdes; comitar.

### Tarefa 6 — Fechamento

- [ ] `npm test` completo, `npm run lint` e checagem de tipos; registrar `desvios.md`, melhorias do protocolo e itens não testados (blocos do `/executar-complexo` e "Qualquer momento" em `.claude/regras/nao-testados.md`).
- [ ] Marcar o plano, integrar a branch (`git switch main`, merge, `git branch -d`), `git push` da `main`, ticket com `Concluído em`, comitar e conferir o "Testes de banco" da `main`.

## Autoavaliação

- Critério 1 → T1 e T2; 2 → T1 (`prosecdef`, `tipo_so_pela_funcao`) e T2; 3 → T3; 4 → T4; 5 → T5 (estrutura, janela, aviso; pílula já existe no cartão e ganha teste na T4); 6 → T2 (evento) e T5 (rótulos); 7 → T5; 8 → T4 e T5.
- Histórias 9 e 13 (filhos acompanham o pai) → T2 (gatilhos) e T3 (falso); 16 → T2 e T5; 63 → T1 item 9.
