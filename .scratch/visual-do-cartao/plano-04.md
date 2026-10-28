# Cor do setor na área Processos — Plano de execução (ticket 04)

> **Para quem executa:** use `superpowers:executing-plans`. Os passos usam caixas (`- [ ]`); marque (`- [x]`) ao terminar cada um.

**Objetivo:** a cor do setor chega à área Processos: faixa no topo do cartão do Quadro, selo no título da coluna por setor, no cabeçalho do verso e na coluna Setor da Lista, e quadradinho nas caixas de seleção do filtro Setor e do campo Setor do formulário do processo.

**Arquitetura:** a view `processos_com_andamento` ganha `setor_cor` (coluna nova no fim, migração não destrutiva); `processoDaLinha` a traduz para `ProcessoDaLista.setorCor`; a leitura dos setores do Quadro traz `cor`. A tela reaproveita o que o ticket 02 deixou pronto: `SeloDoSetor` (sigla sobre o degradê) e `OpcaoDaCaixa` com `corDoSetor`. Nenhum tom novo no código: tudo sai de `src/cadastros/corDoSetor.ts`.

**Pilha:** Postgres/pgTAP (Supabase), React 19 + TypeScript, Vitest + Testing Library.

**Referências (não repetidas aqui):** ticket `.scratch/visual-do-cartao/issues/04-cor-do-setor-na-area-processos.md`; seção "Visual do cartão" de `.scratch/processos-etapas/spec.md` (histórias 1–24, "Decisões de implementação", "Decisões de teste"); ADR 0030; `.scratch/identidade-visual.md` (registro de 2026-10-27). Regras de banco: `.claude/regras/banco.md` (lido): teste antes da migração; view com `security_invoker = true`; estrutura só por migração; nada de `service_role`.

## Restrições globais

- Dados de teste só inventados. Nenhuma dependência nova. Arquivos ≤ 300 linhas, funções ≤ 20 linhas, sem `any`, props tipadas; `npm run lint` e `npm run typecheck` verdes antes de cada commit (o pre-commit barra o resto; nunca `--no-verify`).
- A cor é enfeite: nunca entra no nome acessível do cartão, da opção, do selo nem da coluna (histórias 13, 14, 22). A sigla (ou o título da coluna) está sempre escrita.
- Fora deste ticket: pílulas de Situação, histórico, opções "SIGLA — Nome" dos processos pai, seção "Sobre" do verso (o setor continua texto), Processos do setor, planilhas dos dashboards (as Edge Functions não leem esta view para o pacote; conferido).
- Sem a cor na leitura (dado antigo): vale a cor 1 (`corDoSetor` já cai na 1 para número inválido; `processoDaLinha` usa `?? 1`).

## Ambiente e alvo do banco

- Alvo conferido: `supabase/AMBIENTES.md` diz "vínculo atual: yclkzyoebpsxmgpbcbus" (desenvolvimento). Conferir também `supabase/.temp/project-ref` antes de qualquer comando contra o remoto.
- Docker: `docker version` mostra só o cliente; na Tarefa 1 rode `docker info`. Se o daemon não responder (já aconteceu no ticket 02), use o plano B autorizado em "Ajustes deste Projeto": empurrar a branch e rodar o workflow "Testes de banco"; a migração chega ao desenvolvimento só pelo workflow "Migrar banco de desenvolvimento".
- Saída de `supabase start` e `status` traz chaves: não repetir. O resultado "FAIL" do `supabase test db` é do formato (os testes devolvem o resultado como exceção): contar linhas `ok` e `not ok`.

## Estrutura de arquivos

| Arquivo | O que faz |
|---|---|
| `supabase/tests/67_cor_do_setor_na_view.test.sql` (novo) | pgTAP: `setor_cor` da view por perfil |
| `supabase/migrations/<ts>_cor_do_setor_na_view_dos_processos.sql` (novo) | recria a view com `setor_cor` no fim |
| `src/types/database.ts` | regenerado (`setor_cor` em `processos_com_andamento`) |
| `src/processos/tipos.ts`, `processoDaLinha.ts`, `listaDeProcessosSupabase.ts` (+ testes) | `setorCor` no processo, `cor` no setor do Quadro |
| `src/processos/ProcessosFalso.ts`, `src/testes/processoDaLista.ts`, `processosNosCadastros.tsx` | falsa com a cor (e ligada aos cadastros) |
| `src/processos/filtrosDosProcessos.ts` (+ teste) | opção do filtro Setor com `corDoSetor` |
| `src/components/processos/CamposDoProcesso.tsx` | campo Setor com `BotaoDaCaixa` e `OpcaoDaCaixa` |
| `src/processos/colunasDoQuadro.ts`, `ColunaDoQuadro.tsx` (+ teste) | coluna por setor com `cor`; título com selo |
| `src/components/processos/FaixaDoCartao.tsx` (novo), `CartaoDoProcesso.tsx`, `Quadro.css` | faixa no topo do cartão |
| `src/components/SeloDoSetor.tsx` | ganha `className` opcional |
| `CabecalhoDoVerso.tsx`, `TabelaDeProcessos.tsx`, `Verso.css` | selo no verso e na Lista |
| `src/App.corDoSetorNoQuadro.test.tsx` (novo) | testes de tela do ticket |

---

### Tarefa 0: Branch, marco e plano

- [x] `git status` limpo (conferido no início: limpo). `git switch -c visual-do-cartao-04` a partir da `main`.
- [x] Marco: `git tag marco/2026-10-27-inicio-cor-do-setor-na-area-processos` e `git push origin "refs/tags/marco/*:refs/tags/marco/*"` (autorizado).
- [x] Comitar este plano: `git add .scratch/visual-do-cartao/plano-04.md && git commit -m "visual-do-cartao 04: plano de execução"`.

### Tarefa 1: Banco — teste que falha, migração, tipos

**Arquivos:** criar `supabase/tests/67_cor_do_setor_na_view.test.sql` e a migração; regenerar `src/types/database.ts`.

- [x] **Passo 1: escrever o teste** (7 asserções; usa o formato de `63_*` e `66_*`):

```sql
-- Cor do setor na view dos processos (visual-do-cartao, ticket 04): setor_cor igual à cor do setor dono.
begin;
create extension if not exists pgtap with schema extensions;
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(7);

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

insert into public.setores (id, sigla, nome, cor) values ('5f000000-0000-0000-0000-0000000000f1', 'TV1', 'Setor da View Um', 17);
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-0000000000f1', null, 'Macro da View');

-- O processo nasce pelas mãos do administrador, como na tela.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
  values ('5f000000-0000-0000-0000-0000000000f1', 'af000000-0000-0000-0000-0000000000f1', 'Processo da View', 'processo');
reset role;

create function pg_temp.cor_do_processo() returns int
language sql stable as $$ select setor_cor from public.processos_com_andamento where nome = 'Processo da View' $$;
grant execute on function pg_temp.cor_do_processo() to anon, authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 17, 'administrador lê a cor do setor na view');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 17, 'integrante lê a cor do setor na view');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 17, 'consulta lê a cor do setor na view');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into _tap (linha) select is((select count(*)::int from public.processos_com_andamento), 0, 'usuário desativado não lê a view');
reset role;

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select setor_cor from public.processos_com_andamento', '42501', null, 'visitante não lê a view');
reset role;

-- A cor trocada no cadastro vale na próxima leitura; o setor desativado mantém a sua.
update public.setores set cor = 3 where sigla = 'TV1';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 3, 'a cor trocada no setor aparece na view');
reset role;
update public.setores set ativo = false where sigla = 'TV1';
set local role authenticated;
insert into _tap (linha) select is(pg_temp.cor_do_processo(), 3, 'o setor desativado mantém a cor na view');
reset role;

insert into _tap (linha) select * from finish();
-- Devolve o resultado como exceção (e desfaz tudo), como os demais testes.
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

- [x] **Passo 2: ver o teste falhar.** Docker ligado: `npx supabase start` (descarte a saída: traz chaves), depois `npx supabase test db`; esperado: `not ok` por `setor_cor` inexistente (código 42703). Sem Docker: seguir para o Passo 5 e ver a falha no "Testes de banco" da branch.
- [x] **Passo 3: criar a migração** com `npx supabase migration new cor_do_setor_na_view_dos_processos` e colar:

```sql
-- A view dos processos passa a entregar a cor do setor dono (visual-do-cartao, ticket 04). Não destrutiva: create or replace
-- com a coluna nova no fim, para as colunas existentes manterem posição e tipo. Mesma definição de 20261026164641.
create or replace view public.processos_com_andamento with (security_invoker = true) as
select p.id, p.nome, p.tipo, p.processo_pai_id, p.origem, p.situacao as situacao_guardada, p.motivo_da_situacao,
  p.contexto, p.observacoes, p.criado_em, p.setor_id, s.sigla as setor_sigla, p.macroprocesso_id,
  m.nome as macroprocesso_nome,
  case when p.situacao = 'em_andamento' and e.codigo = 'concluidos' then 'concluido' else p.situacao::text end as situacao,
  e.id as etapa_atual_id, e.codigo as etapa_atual_codigo, e.nome as etapa_atual_nome, e.ordem as etapa_atual_ordem,
  p.responsavel_id, u.nome as responsavel_nome, u.foto_url as responsavel_foto_url,
  p.data_da_modelagem_piloto, u.ativo as responsavel_ativo,
  ultima.numero as ultima_versao_numero, ultima.historica as ultima_versao_historica,
  ultima.tem_relatorio as ultima_versao_tem_relatorio,
  (select count(*)::int from public.processos f where f.processo_pai_id = p.id and f.situacao <> 'cancelado')
    as subprocessos_quantidade,
  p.publicado_em, p.arquivado_em,
  pa.etiqueta, pa.entrou_em as entrou_na_etapa_em,
  (select count(*)::int from public.etapas x where x.ativa and x.ordem <= e.ordem) as etapa_atual_posicao,
  p.link_da_publicacao,
  (e.codigo = 'concluidos' and p.publicado_em is null) as sem_publicacao,
  p.explicacao_sem_publicacao,
  exists (select 1 from public.versoes v where v.processo_id = p.id and v.piloto) as tem_versao_piloto,
  exists (select 1 from public.versoes v where v.processo_id = p.id and not v.historica and not v.piloto)
    as tem_versao_em_sequencia,
  exists (select 1 from public.arquivos_da_versao f join public.versoes v on v.id = f.versao_id
    where v.processo_id = p.id and f.papel = 'relatorio' and f.numero_do_relatorio is not null) as tem_relatorio_numerado,
  p.data_da_validacao,
  s.cor as setor_cor
from public.processos p
join public.setores s on s.id = p.setor_id
join public.macroprocessos m on m.id = p.macroprocesso_id
left join public.passagens pa on pa.processo_id = p.id and pa.saiu_em is null
left join public.etapas e on e.id = pa.etapa_id
left join public.usuarios u on u.id = p.responsavel_id
left join lateral (
  select v.numero, v.historica,
    exists (select 1 from public.arquivos_da_versao f where f.versao_id = v.id and f.papel = 'relatorio') as tem_relatorio
  from public.versoes v
  where v.processo_id = p.id
  order by v.numero desc
  limit 1
) ultima on true;

revoke all on public.processos_com_andamento from anon, authenticated;
grant select on public.processos_com_andamento to authenticated;
```

  Conferir antes de salvar: `diff` mental com as linhas 95–135 de `supabase/migrations/20261026164641_data_da_validacao_e_pdf_da_aprovacao.sql` (a única diferença é `, s.cor as setor_cor`). Se alguma migração **posterior** a essa recriou a view, copie dela.
- [x] **Passo 4 (com Docker): rodar tudo local.** `npm run db:reset` (local; confira que o alvo é o banco local), `npx supabase test db`. Esperado: o 67 com 7 `ok` e nenhum `not ok` em todos os arquivos (inclusive `00_rls_ligada`, `10_privilegios_padrao`, `46_funcoes_e_views_seguras`).
- [x] **Passo 5: empurrar a branch** (`git push -u origin visual-do-cartao-04`, autorizado) e rodar o workflow "Testes de banco" na branch; ler o resultado. Se o 67 ainda não tiver visto a falha (sem Docker), ele falha antes da migração só se a migração não tiver sido enviada: então faça o push do **teste sozinho primeiro** (commit 1), veja o vermelho, e só depois comite a migração (commit 2).
- [x] **Passo 6: aplicar no desenvolvimento** pelo workflow "Migrar banco de desenvolvimento" na branch (autorizado), informando a migração criada; ler o resultado. Depois "Testes de banco" de novo: tudo verde.
- [x] **Passo 7: tipos.** Conferir `supabase/.temp/project-ref` e a linha "vínculo atual"; `npm run db:types`. Esperado no diff de `src/types/database.ts`: só `setor_cor: number | null` em `Views.processos_com_andamento.Row` (ignore mudança de fim de linha). Registrar a migração em `supabase/AMBIENTES.md` (padrão das linhas anteriores: data, ticket, teste que falhou antes e passou depois, workflow usado).
- [x] **Passo 8: commit.** `git add supabase/tests/67_cor_do_setor_na_view.test.sql supabase/migrations/*cor_do_setor_na_view* src/types/database.ts supabase/AMBIENTES.md && git commit -m "visual-do-cartao 04: view dos processos entrega setor_cor (teste, migração e tipos)"`.

### Tarefa 2: A cor viaja do banco para o processo e para o setor do Quadro

**Arquivos:** `src/processos/tipos.ts`, `processoDaLinha.ts`, `listaDeProcessosSupabase.ts`, `ProcessosFalso.ts`, `src/testes/processoDaLista.ts` e os testes `processoDaLinha.test.ts`, `listaDeProcessosSupabase.test.ts`, `processosSupabase.test.ts`.

**Produz:** `ProcessoDaLista.setorCor?: number`; `SetorDoQuadro.cor: number`; `ProcessosFalso.coresDosSetores` e `ProcessosFalso.corDoSetor(setorId): number`; `umSetor(id, sigla, nome, ativo = true, cor = 1)`.

- [x] **Passo 1: testes que falham** em `src/processos/processoDaLinha.test.ts` (acrescentar `setor_cor: null` ao `VAZIA`):

```ts
test('traduz a cor do setor; sem ela vale a cor 1', () => {
  expect(processoDaLinha({ ...VAZIA, setor_cor: 17 }, 8)).toMatchObject({ setorCor: 17 })
  expect(processoDaLinha(VAZIA, 8)).toMatchObject({ setorCor: 1 })
})
```

  Em `listaDeProcessosSupabase.test.ts`: a resposta `setores.select` passa a trazer `cor` (ex.: `{ id: 's1', sigla: 'TSA', nome: 'Setor de Testes A', ativo: true, cor: 13 }`) e o teste confere que `setores` sai com `cor: 13` e que o `select` dos setores pediu `'id, sigla, nome, ativo, cor'` (use o registro de chamadas do `ClienteSupabaseFalso`, como os testes vizinhos fazem). Em `processosSupabase.test.ts`, a `LINHA` ganha `setor_cor: 13` e a expectativa do processo `setorCor: 13`.
- [x] **Passo 2: ver falhar** — `npx vitest run src/processos/processoDaLinha.test.ts src/processos/listaDeProcessosSupabase.test.ts src/processos/processosSupabase.test.ts`. Esperado: FAIL (propriedade `setorCor` ausente / erro de tipo).
- [x] **Passo 3: implementar.**
  - `tipos.ts`: em `ProcessoDaLista`, depois de `setorSigla`: `/** Número da cor do setor (1 a 30), vindo da view; opcional para quem monta o processo à mão: sem ele vale a cor 1. */ setorCor?: number`. `SetorDoQuadro` vira `{ id: string; sigla: string; nome: string; ativo: boolean; cor: number }`.
  - `processoDaLinha.ts`, em `identificacaoDaLinha`: `setorCor: linha.setor_cor ?? 1,` depois de `setorSigla`.
  - `listaDeProcessosSupabase.ts`: `.select('id, sigla, nome, ativo, cor')` em `lerSetores`.
  - `src/testes/processoDaLista.ts`: `umSetor(id, sigla, nome, ativo = true, cor = 1): SetorDoQuadro { return { id, sigla, nome, ativo, cor } }`.
  - `ProcessosFalso.ts`: junto de `siglasDosSetores`:

```ts
  /** A cor de cada setor (1 a 30), como a view a juntaria ao cartão; sem ela, a cor 1. Os testes com cadastros trocam `corDoSetor`. */
  coresDosSetores: Record<string, number> = {}
  corDoSetor = (setorId: string): number => this.coresDosSetores[setorId] ?? 1
```

    em `listarProcessos` (linha ~157): `processos: this.processos.map((processo) => ({ ...processo, setorCor: processo.setorCor ?? this.corDoSetor(processo.setorId) }))`; em `nomesDoCartao`: acrescentar `setorCor: this.corDoSetor(dados.setorId)`.
  - Corrigir os demais pontos que o `npm run typecheck` apontar por causa de `SetorDoQuadro.cor` obrigatório (literais `{ id, sigla, nome, ativo }` em testes): acrescentar `cor`.
- [x] **Passo 4: passar** — mesmos testes; depois `npm run typecheck` e `npm run lint`.
- [x] **Passo 5: commit** — `git add -A src && git commit -m "visual-do-cartao 04: a cor do setor chega ao processo e ao setor do Quadro"`.

### Tarefa 3: Quadradinho nas caixas de seleção de setor

**Arquivos:** `src/processos/filtrosDosProcessos.ts` (+ teste), `src/components/processos/CamposDoProcesso.tsx`, teste de tela novo `src/App.corDoSetorNoQuadro.test.tsx`.

**Consome:** `OpcaoDaCaixa({ valor, rotulo, corDoSetor })`, `BotaoDaCaixa`, `Setor.cor` (cadastros).

- [x] **Passo 1: testes que falham.**
  - `filtrosDosProcessos.test.ts`: `opcoesDosFiltros({ etapas, processos }).setores` traz `corDoSetor` (processo com `setorCor: 13` → `{ valor: 's1', rotulo: 'TSA', corDoSetor: 13 }`; processo sem `setorCor` → `corDoSetor: 1`).
  - `src/App.corDoSetorNoQuadro.test.tsx` (novo, cabeçalho no padrão de `App.agruparPorSetor.test.tsx`: `beforeEach` com `window.location.hash = '#/processos'`, `afterEach(cleanup)`), dois testes:

```ts
const corClaraDe = (opcao: Element | null) => (opcao?.querySelector('.opcao-cor-do-setor') as HTMLElement | null)?.style.getPropertyValue('--cor-claro')

test('o filtro Setor mostra o quadradinho da cor do setor, sem a cor no nome da opção', async () => {
  montar([processo('Emitir Ofício', { processo: { setorId: 's1', setorSigla: 'TSA', setorCor: 13 } })])
  const caixa = await screen.findByLabelText('Setor')
  const opcao = within(caixa).getByRole('option', { name: 'TSA' })
  expect(corClaraDe(opcao)).toBe('#C4D9F8') // cor 13 = azul claro
})
```

    e, usando `montarNosCadastros({ ajustarCadastros })` de `src/testes/processosNosCadastros.tsx` com `cadastros.setores` de cor 13 e 1 (ver `SETORES_DE_TESTE`; passe `cor`), o teste "o campo Setor do Novo processo e do Editar mostra o quadradinho": abra a janela de Novo processo como em `src/App.cadastrarProcesso.test.tsx` e confira `within(screen.getByLabelText('Setor')).getByRole('option', { name: 'TSA — Setor A' })` com `corClaraDe(...)` igual a `'#C4D9F8'`; repita no Editar do processo `p1` (abra como em `App.editarProcesso*` — procure com `grep -l "Editar" src/App.*rocesso*.test.tsx`).
- [x] **Passo 2: ver falhar** — `npx vitest run src/processos/filtrosDosProcessos.test.ts src/App.corDoSetorNoQuadro.test.tsx`. Esperado: FAIL (sem quadradinho).
- [x] **Passo 3: implementar.**
  - `filtrosDosProcessos.ts`: `OpcaoDoFiltro` ganha `corDoSetor?: number` (atualize o comentário: "`corDoSetor`, a do setor"); em `opcoesDosFiltros`: `setores: semRepetir(processos.map((p) => ({ valor: p.setorId, rotulo: p.setorSigla, corDoSetor: p.setorCor ?? 1 })))`. O `SeletorDoFiltro` já espalha a opção em `OpcaoDaCaixa`: nada a mudar em `FiltrosDosProcessos.tsx`.
  - `CamposDoProcesso.tsx`, campo Setor (import `{ BotaoDaCaixa, OpcaoDaCaixa }` já existe no arquivo para o macroprocesso):

```tsx
      <select id={`${id}-setor`} aria-required="true" value={campos.setorId} onChange={(evento) => aoMudar({ setorId: evento.target.value })}>
        <BotaoDaCaixa />
        <option value="">Escolha o setor</option>
        {opcoes.setores.filter((setor) => setor.ativo || setor.id === campos.setorId).map((setor) => (
          <OpcaoDaCaixa key={setor.id} valor={setor.id} rotulo={`${setor.sigla} — ${setor.nome}`} corDoSetor={setor.cor} />
        ))}
      </select>
```

  - **Reclassificar:** a spec (decisão 4) diz que a janela de Reclassificar usa o mesmo campo Setor, mas `JanelaDeReclassificacao.tsx` só troca o tipo e o processo pai (as opções de pai são "SIGLA — Nome", fora do escopo). Não há campo Setor para colorir ali; registre isso em `desvios.md` (Tarefa 8) como divergência spec × código, sem mexer na janela.
- [x] **Passo 4: passar** — mesmos testes, mais `npx vitest run src/App.cadastrarProcesso.test.tsx src/App.lista.test.tsx` (opções com o rótulo de sempre) e `npm run lint && npm run typecheck`.
- [x] **Passo 5: commit** — `git add -A src && git commit -m "visual-do-cartao 04: quadradinho da cor nas caixas de setor"`.

### Tarefa 4: Título da coluna por setor com o selo

**Arquivos:** `src/processos/colunasDoQuadro.ts` (+ `colunasDoQuadro.test.ts`), `src/components/processos/ColunaDoQuadro.tsx`, `src/App.corDoSetorNoQuadro.test.tsx`.

- [x] **Passo 1: testes que falham.** `colunasDoQuadro.test.ts`: `colunasPorSetor([umSetor('s1', 'TSA', 'Setor A', true, 13)], [], null)[0]` tem `cor: 13`; as colunas de etapa e de responsável não têm `cor`. Tela (`App.corDoSetorNoQuadro.test.tsx`):

```ts
test('no agrupamento por setor, a sigla do título leva o selo da cor, e a coluna inativa mantém a marca e a cor', async () => {
  const ativo = umSetor('s1', 'TSA', 'Setor de Testes A', true, 13)
  const inativo = umSetor('s3', 'MNO', 'Setor Antigo', false, 22)
  montar([processo('Processo Antigo', { processo: { setorId: 's3', setorSigla: 'MNO', setorCor: 22 } })], 'integrante_ep', [], new VersoesFalso(), [ativo, inativo])
  fireEvent.click(await screen.findByRole('button', { name: 'Setor' }))
  const coluna = await screen.findByRole('region', { name: 'MNO · Setor Antigo · inativo' })
  const selo = coluna.querySelector('.coluna-titulo .selo-do-setor') as HTMLElement
  expect(selo.textContent).toBe('MNO')
  expect(selo.style.getPropertyValue('--cor-claro')).toBe(corDoSetor(22).claro)
  expect(within(coluna).getByText('Inativo')).toBeTruthy()
  expect(within(coluna).getByText('Setor Antigo')).toBeTruthy()
})
```

  Importe `corDoSetor` de `./cadastros/corDoSetor` no arquivo de teste (também usado nas Tarefas 5 e 7), em vez de fixar hexadecimais.
- [x] **Passo 2: ver falhar** — `npx vitest run src/processos/colunasDoQuadro.test.ts src/App.corDoSetorNoQuadro.test.tsx`.
- [x] **Passo 3: implementar.**
  - `colunasDoQuadro.ts`: `ColunaDoQuadro` ganha `/** Só no Quadro por setor: o número da cor do setor, para o selo do título. */ cor?: number`; em `colunasPorSetor`, no objeto da coluna: `cor: setor.cor`.
  - `ColunaDoQuadro.tsx`: no título, trocar `{coluna.titulo}` por `{coluna.cor === undefined ? coluna.titulo : <SeloDoSetor sigla={coluna.titulo} cor={coluna.cor} />}` (import `{ SeloDoSetor } from '../SeloDoSetor'`). O `aria-label` da seção (`rotuloDaColuna`) não muda.
- [x] **Passo 4: passar** — mesmos testes mais `npx vitest run src/App.agruparPorSetor.test.tsx` (o teste dos títulos por `textContent` segue igual).
- [x] **Passo 5: commit** — `git add -A src && git commit -m "visual-do-cartao 04: selo da cor no título da coluna por setor"`.

### Tarefa 5: Faixa do setor no cartão do Quadro

**Arquivos:** criar `src/components/processos/FaixaDoCartao.tsx`; modificar `CartaoDoProcesso.tsx`, `SeloDoSetor.tsx`, `Quadro.css`; testes em `src/App.corDoSetorNoQuadro.test.tsx` e ajuste dos que olham `.cartao-sigla`.

**Produz:** `FaixaDoCartao({ processo, agrupar })`.

- [x] **Passo 1: testes que falham** (`App.corDoSetorNoQuadro.test.tsx`; história citada em cada nome):

```ts
test('por etapa, a faixa traz a sigla na cor do setor e o nome do processo segue no corpo (histórias 1, 2, 6, 7)', async () => {
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  const cartao = await cartaoDe('Emitir Ofício')
  const faixa = cartao.querySelector('.cartao-faixa') as HTMLElement
  expect(faixa.textContent).toBe('TSA')
  expect(faixa.style.getPropertyValue('--cor-claro')).toBe(corDoSetor(13).claro)
  expect(cartao.querySelector('.cartao-nome')?.textContent).toBe('Emitir Ofício')
})

test('por responsável a faixa também traz a sigla (história 3)', async () => {
  montar([processo('Emitir Ofício', { processo: { setorSigla: 'TSA', setorCor: 13 } })])
  fireEvent.click(await screen.findByRole('button', { name: 'Responsável' }))
  const cartao = await cartaoDe('Emitir Ofício')
  expect(cartao.querySelector('.cartao-faixa')?.textContent).toBe('TSA')
})

test('por setor a faixa traz o nome do processo e o corpo não o repete (histórias 4, 5)', async () => {
  montar([processo('Emitir Ofício', { processo: { setorId: 's1', setorSigla: 'TSA', setorCor: 13 } })], 'integrante_ep', [], new VersoesFalso(), [umSetor('s1', 'TSA', 'Setor A', true, 13)])
  fireEvent.click(await screen.findByRole('button', { name: 'Setor' }))
  const cartao = await screen.findByRole('link', { name: /Emitir Ofício/ })
  expect(cartao.querySelector('.cartao-faixa')?.textContent).toBe('Emitir Ofício')
  expect(cartao.querySelector('.cartao-nome')).toBeNull()
  expect(within(cartao).getAllByText('Emitir Ofício')).toHaveLength(1)
})

test('o processo de setor inativo mantém a cor na faixa, e o parado continua com a marca de parado (histórias 10, 11)', async () => {
  // Parado = dias demais na etapa; a montagem do cartão parado é a de App.cartaoDoQuadro.test.tsx (procure "parado").
  montar([processo('Processo Parado', { processo: { setorSigla: 'MNO', setorCor: 22, entrouNaEtapaEm: dia(-30) } })])
  const cartao = await cartaoDe('Processo Parado')
  expect((cartao.querySelector('.cartao-faixa') as HTMLElement).style.getPropertyValue('--cor-claro')).toBe(corDoSetor(22).claro)
  expect(cartao.classList.contains('cartao-parado')).toBe(true)
})
```

  Se `dia(-30)` não bastar para o parado (a regra de dias vem de `diasDoProcessoParado`), use os mesmos campos do teste de parado de `App.cartaoDoQuadro.test.tsx`. Nos testes antigos que leem `.cartao-sigla` (`grep -rn "cartao-sigla" src --include=*.test.tsx`), trocar o seletor por `.cartao-faixa` (cartão) ou `.verso-cabecalho .selo-do-setor` (verso, Tarefa 6).
- [x] **Passo 2: ver falhar** — `npx vitest run src/App.corDoSetorNoQuadro.test.tsx`.
- [x] **Passo 3: implementar.**
  - `SeloDoSetor.tsx`: prop opcional `className?: string`, concatenada: `` className={`selo-do-setor selo-do-setor-${variante}${className ? ` ${className}` : ''}`} ``.
  - `FaixaDoCartao.tsx`:

```tsx
import type { CSSProperties } from 'react'
import { estiloDaCor } from '../../cadastros/corDoSetor'
import type { AgruparQuadroPor } from '../../processos/enderecoDosProcessos'
import type { ProcessoDaLista } from '../../processos/tipos'
import { SeloDoSetor } from '../SeloDoSetor'

type FaixaDoCartaoProps = { processo: ProcessoDaLista; agrupar: AgruparQuadroPor }

/**
 * Faixa na cor do setor, de lado a lado no topo do cartão. Por etapa e por responsável leva a sigla; por setor, a sigla já
 * está no título da coluna, então leva o nome do processo (que sai do corpo do cartão). A cor é enfeite: o texto é o nome.
 */
export function FaixaDoCartao({ processo, agrupar }: FaixaDoCartaoProps) {
  const cor = processo.setorCor ?? 1
  if (agrupar !== 'setor') return <SeloDoSetor sigla={processo.setorSigla} cor={cor} variante="faixa" className="cartao-faixa" />
  return (
    <span className="selo-do-setor selo-do-setor-faixa cartao-faixa cartao-faixa-nome" style={estiloDaCor(cor) as CSSProperties}>
      {processo.nome}
    </span>
  )
}
```

  - `CartaoDoProcesso.tsx`: trocar o bloco `{agrupar !== 'setor' && (<span className="cartao-topo">…)}` por `<FaixaDoCartao processo={processo} agrupar={agrupar} />`; o nome do corpo vira `{agrupar !== 'setor' && <span className="cartao-nome">{nome}</span>}`; remover `setorSigla` da desestruturação e atualizar o comentário do prop `agrupar` ("por setor a faixa leva o nome do processo no lugar da sigla").
  - `Quadro.css`: remover `.cartao-topo` e `.cartao-sigla` (confira que nada mais os usa: o verso muda na Tarefa 6; **faça a Tarefa 6 antes de apagar `.cartao-sigla`**, ou apague só `.cartao-topo` agora) e acrescentar:

```css
/* Faixa do setor: de lado a lado no topo do cartão, por cima do padding. */
.cartao-faixa {
  margin: calc(-1 * var(--esp-3)) calc(-1 * var(--esp-3)) 0;
  border-radius: calc(var(--canto) - 1px) calc(var(--canto) - 1px) 0 0;
}

/* Por setor a faixa leva o nome do processo: 16px, negrito, quebrando linha dentro dela. */
.cartao-faixa-nome {
  font-size: 1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

/* A borda de 4px do parado tira 3px do padding: a faixa recua o mesmo, e a ponta esquerda fica reta junto da borda vermelha. */
.cartao-parado .cartao-faixa {
  margin-left: calc(-1 * (var(--esp-3) - 3px));
  border-top-left-radius: 0;
}
```

- [x] **Passo 4: passar** — `npx vitest run src/App.corDoSetorNoQuadro.test.tsx src/App.cartaoDoQuadro.test.tsx src/App.agruparPorSetor.test.tsx src/App.agruparPorResponsavel.test.tsx src/App.arrastarCartao*.test.tsx` (use o glob que existir) e `npm run lint && npm run typecheck`.
- [x] **Passo 5: commit** — `git add -A src && git commit -m "visual-do-cartao 04: faixa do setor no topo do cartão"`.

### Tarefa 6: Selo no cabeçalho do verso e na coluna Setor da Lista

**Arquivos:** `CabecalhoDoVerso.tsx`, `TabelaDeProcessos.tsx`, `Verso.css`, `Quadro.css` (remover `.cartao-sigla`), testes `App.versoDoCartao.test.tsx` / `App.lista.test.tsx` ajustados e novos casos em `App.corDoSetorNoQuadro.test.tsx`.

- [x] **Passo 1: testes que falham.** Verso: abrir o processo (como em `App.versoDoCartao.test.tsx`) e conferir `.verso-cabecalho .selo-do-setor` com texto `TSA` e `--cor-claro` igual a `corDoSetor(13).claro`; a seção "Sobre" continua com o dado "Setor" em texto simples (`TSA`), sem `.selo-do-setor` dentro dela. Lista (`#/processos/lista`, como em `App.lista.test.tsx`): na linha do processo, a célula Setor contém `.selo-do-setor` com `TSA` e a cor; o nome acessível da célula continua `TSA`.
- [x] **Passo 2: ver falhar** — `npx vitest run src/App.corDoSetorNoQuadro.test.tsx`.
- [x] **Passo 3: implementar.**
  - `CabecalhoDoVerso.tsx`: `<span className="cartao-sigla">{processo.setorSigla}</span>` → `<SeloDoSetor sigla={processo.setorSigla} cor={processo.setorCor ?? 1} className="verso-selo-do-setor" />` (import `{ SeloDoSetor } from '../SeloDoSetor'`).
  - `Verso.css`: `.verso-cabecalho .cartao-sigla { flex: none; margin-top: 2px; }` → `.verso-cabecalho .verso-selo-do-setor { flex: none; margin-top: 2px; }`.
  - `TabelaDeProcessos.tsx`: `<td>{linha.setorSigla}</td>` → `<td><SeloDoSetor sigla={linha.setorSigla} cor={linha.setorCor ?? 1} /></td>`.
  - `Quadro.css`: agora que nada usa `.cartao-sigla`, apagar a regra (`grep -rn "cartao-sigla" src` deve voltar vazio).
- [x] **Passo 4: passar** — `npx vitest run src/App.corDoSetorNoQuadro.test.tsx src/App.versoDoCartao.test.tsx src/App.lista.test.tsx` e, por segurança, a suíte de telas de processos: `npx vitest run src/App.*.test.tsx` (pode levar minutos); `npm run lint && npm run typecheck`.
- [x] **Passo 5: commit** — `git add -A src && git commit -m "visual-do-cartao 04: selo do setor no verso e na Lista"`.

### Tarefa 7: A cor trocada no cadastro aparece no Quadro depois de recarregar

**Arquivos:** `src/testes/processosNosCadastros.tsx`, `src/App.corDoSetorNoQuadro.test.tsx`.

- [x] **Passo 1: teste que falha** (história 23; depende da troca de cor do ticket 03, já na `main`):

```ts
test('trocar a cor do setor no cadastro muda a faixa do cartão na próxima vez que o Quadro carrega', async () => {
  window.location.hash = '#/setores'
  montarNosCadastros({ ajustarCadastros: (cadastros) => { cadastros.setores = cadastros.setores.map((s) => (s.id === 's1' ? { ...s, cor: 13 } : s)) } })
  // Os passos de troca são os de "trocar a cor e salvar grava a cor escolhida" em src/App.corDoSetor.test.tsx.
  fireEvent.click(await screen.findByRole('button', { name: 'TSA' }))
  const grade = within(await screen.findByRole('group', { name: 'Cor do setor' }))
  fireEvent.click(grade.getByRole('radio', { name: 'água claro' })) // cor 2
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByRole('button', { name: 'TSB' })
  window.location.hash = '#/processos'
  const nome = await screen.findByText('Emitir Ofício', { selector: '.cartao-nome' })
  const faixa = nome.closest('a')?.querySelector('.cartao-faixa') as HTMLElement
  expect(faixa.style.getPropertyValue('--cor-claro')).toBe(corDoSetor(2).claro)
})
```

  Se a amostra "água claro" vier com o sufixo "em uso por …" no nome, use a cor 2 pelo nome que `grade.getAllByRole('radio')[1]` tiver (a ordem das amostras é a da paleta). O processo "Emitir Ofício" é o `p1` de `PROCESSOS_DOS_CADASTROS`, do setor `s1` (TSA).
- [x] **Passo 2: ver falhar** — a faixa ainda sai com a cor 1 (a falsa de processos não conhece os cadastros).
- [x] **Passo 3: implementar.** Em `montarNosCadastros`, depois de criar `processos`: `processos.corDoSetor = (setorId) => cadastros.setores.find((setor) => setor.id === setorId)?.cor ?? 1`. Em `SETORES_DE_TESTE`/no `.map` que cria `cadastros.setores`, passar `cor` (as fixtures sem cor valem 1).
- [x] **Passo 4: passar** — o teste novo e `npx vitest run src/App.corDoSetor.test.tsx`.
- [x] **Passo 5: commit** — `git add -A src && git commit -m "visual-do-cartao 04: a falsa de processos lê a cor atual dos cadastros"`.

### Tarefa 8: Fechamento

- [x] **Passo 1: gates.** `npm run lint`, `npm run typecheck`, `npm test` (tudo verde, anotar o total de testes); cobertura não cai (o pre-commit e o `/ship` conferem).
- [x] **Passo 2: banco no GitHub.** Branch já enviada; rodar "Testes de banco" na branch pela última vez e ler o resultado (todos os arquivos verdes, o 67 com 7 de 7).
- [x] **Passo 3: `[visual]` (critérios 9 e 10 do ticket).** Se a vitrine local subir (veja o `.claude/launch.json`; usa módulos falsos), conferir em 1366×768: faixa de lado a lado nas 30 cores incluindo nome longo, faixa vermelha do parado visível, título/selo do verso/selo da Lista/quadradinho com a mesma cor, sem estourar a largura. Sem login real, o que não for visto fica **presumido** e anotado no `desvios.md` e no `proximo-passo.md`.
- [x] **Passo 4: registros.** Em `.scratch/visual-do-cartao/desvios.md` (só acrescentar, com data): a divergência do Reclassificar (sem campo Setor ali), qualquer ajuste que o código pediu, e o que ficou presumido. Marcar as caixas do ticket 04 que foram cumpridas.
- [ ] **Passo 5: juntar à principal** (`git switch main`, `git merge visual-do-cartao-04` por `finishing-a-development-branch`, `git branch -d visual-do-cartao-04`; se o `-d` recusar, pare e pergunte), enviar a `main` ao GitHub (autorizado) e conferir o "Testes de banco" na `main`.
- [ ] **Passo 6: linha de conclusão** no fim do ticket 04 (`Concluído em 2026-10-27 (commit <hash>)`), `.scratch/proximo-passo.md` atualizado (próximo: `/polir` e depois `/ship`, obrigatório pela migração; o `[visual]` da grade, do 01, 02 e 04 ainda a conferir com o login real), anotação em `.scratch/melhorias-protocolo.md` do que aconteceu dos itens não testados do `/executar-complexo`, e commit.
