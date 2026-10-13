# Ticket 04 (Setores envolvidos): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ligar setores e macroprocessos (tabela `setores_envolvidos`): pôr, tirar e anotar o papel de cada setor no macroprocesso aberto; ver os macroprocessos no setor aberto; contagens nas duas listas; exclusão em cascata com eventos e janelas com a quantidade.

**Architecture:** o banco impõe tudo (chave composta, cascata, eventos) numa migração nova, no desenho de `20261013123327_setores.sql` e `20261013133248_macroprocessos.sql`. Como a cascata do Postgres apaga os vínculos *depois* do pai, e aí a sigla e o nome já não são legíveis, a exclusão de setor e de macroprocesso passa a ser um gatilho `BEFORE DELETE` que tira os vínculos (gerando os eventos "tirar") e grava o evento de exclusão com a lista no "antes". A interface ganha as operações no módulo de cadastros (real e falso) e componentes novos em `src/components/cadastros/`. Esta é a primeira migração aplicada pelo workflow manual do GitHub Actions (decisão de 2026-10-13 em "Ajustes deste Projeto").

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/cadastros-basicos/spec.md` (histórias 1, 12, 14, 16, 17, 20, 26 a 31, 33, 37 e 38; seções "Interface", "Modelo de dados" e "Regras que o banco impõe") · **Ticket:** `.scratch/cadastros-basicos/issues/04-setores-envolvidos.md` (critérios citados como "critério N", na ordem do ticket) · **Planos de referência:** `plano-01.md` a `plano-03.md`.

## Restrições globais

- Regras de `.claude/regras/banco.md` que valem: teste antes da migração; migração criada com `npx supabase migration new`; RLS ligada e políticas na mesma migração; funções de gatilho `security definer` só em `private`, com `search_path` vazio, execução tirada de `public`, `anon` e `authenticated`; cada célula de "quem pode o quê" de `setores_envolvidos` com teste (Administrador, Integrante, Consulta, inativo, visitante); interface só pela chave publicável (`src/lib/supabase.ts`); conferir o vínculo (`supabase/AMBIENTES.md`: dev `yclkzyoebpsxmgpbcbus`; `supabase/.temp/project-ref`) antes de `db:types`.
- Rede do escritório: porta 5432 fechada. Testes pgTAP e migração rodam **no GitHub Actions** (`CLAUDE.md`, "Ajustes deste Projeto"): push da branch, disparo de "Testes de banco" e do novo "Migrar banco de desenvolvimento" na branch de trabalho e leitura do resultado dispensam autorização. Sem `gh`: o disparo é pelo navegador (painel do app). Produção e `migration repair` continuam só pelo `/ship`.
- Migração, teste de banco e tipos (`src/types/database.ts`) no mesmo commit.
- `npm test` nunca depende do banco: telas com `CadastrosFalso` e `AcessoFalso`.
- Limites do ESLint: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; nada de `any`; no máximo 2 níveis de indentação.
- Dados de teste inventados (siglas e nomes fictícios).
- Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.
- Mensagens de falha e recusa em vermelho (`cadastros-falha`, ADR 0003).

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **Nomes no evento de vínculo (`entidade = 'setor_envolvido'`):** `entidade_ref = '<macroprocesso_id>:<setor_id>'` (os dois ids, como a spec manda); `antes` e `depois` trazem `setor_id`, `setor_sigla`, `macroprocesso_id`, `macroprocesso_nome` e `observacao`. Assim o histórico (ticket 05) filtra por qualquer um dos dois ids em `detalhes` e continua legível depois de uma exclusão.
- **Lista no "antes" da exclusão:** a exclusão de setor traz `"macroprocessos": [{macroprocesso_id, codigo, nome, observacao}]`; a de macroprocesso traz `"setores": [{setor_id, sigla, nome, observacao}]`. A chave existe sempre, vazia (`[]`) quando não havia vínculo. Por isso os testes `11_setores` e `12_macroprocessos` mudam o jsonb esperado do evento `excluir`.
- **Observação vazia vira nula** (gatilho `BEFORE`), como o código do macroprocesso.
- **Plural da janela de exclusão:** "{SIGLA} sai de 1 macroprocesso." e "1 setor deixa de estar envolvido nele." no singular; "sai de {n} macroprocessos." e "{n} setores deixam de estar envolvidos nele." no plural; com zero, o texto começa por "O histórico guarda…" (já é assim hoje).
- **Recusa de duplicidade:** `23505` + `setores_envolvidos_pkey` → "O setor {SIGLA} já está neste macroprocesso." (o módulo real busca a sigla do setor). `23503` (setor ou macroprocesso sumiu) → `CadastroInexistente`. `42501` → "Seu perfil não permite alterar os cadastros.".
- **Tirar ou anotar vínculo que já não existe** (outra pessoa tirou antes): não é erro; a tela recarrega e a linha some. Se o vínculo ainda é visível mas nada mudou, é perfil (`TravaDoBanco`), como no restante do módulo.
- **Observação grava ao sair do campo** (`onBlur`), só se o texto mudou; vazio grava nulo. O campo tem `maxLength` 500 (o banco confere de novo).
- **Seletor "Pôr setor":** só setores ativos que ainda não estão no macroprocesso; começa em "Escolha um setor" e o botão [Pôr setor] fica desabilitado enquanto nada é escolhido.
- **Ordem dos macroprocessos de um setor aberto:** a mesma da lista (código, sem código depois, nome); a regra vira função compartilhada (segunda repetição real).
- **Workflow de migração:** `workflow_dispatch` com o nome do arquivo; o script `scripts/aplicar-migracao.mjs` só aceita nome no formato `AAAAMMDDHHMMSS_nome.sql` dentro de `supabase/migrations/`, recusa banco que não cite o ref do dev, aplica tudo numa transação e registra a versão em `supabase_migrations.schema_migrations`; se a versão já está lá, para com aviso (`::warning::`) sem erro. Premissa a conferir na primeira execução: a tabela da CLI tem as colunas `version`, `statements`, `name`; se a inserção falhar, a transação desfaz tudo e o motivo aparece no log.
- **O workflow precisa estar na `main` antes de poder ser disparado** (o GitHub só lista no "Run workflow" os fluxos manuais que existem na branch padrão). Por isso a Tarefa 1 leva o workflow e o script à `main` (fast-forward + push, autorizado) antes de começar o banco.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `.github/workflows/migrar-dev.yml` (novo) | workflow manual que aplica uma migração no banco de desenvolvimento |
| `scripts/aplicar-migracao.mjs`, `scripts/caminhoDaMigracao.mjs` (+ `.test.mjs`) (novos) | aplicação com trava e validação do nome |
| `supabase/tests/13_setores_envolvidos.test.sql` (novo) | pgTAP: quem pode o quê, chave, cascata, eventos |
| `supabase/tests/11_setores.test.sql`, `12_macroprocessos.test.sql` | jsonb esperado do evento `excluir` ganha a lista |
| `supabase/migrations/<data>_setores_envolvidos.sql` (novo) | tabela, RLS, gatilhos, exclusão com eventos |
| `supabase/AMBIENTES.md` | registro da migração |
| `src/types/database.ts` | tipos gerados |
| `src/cadastros/tipos.ts` | tipos novos e 3 operações novas; leituras ganham vínculos e contagens |
| `src/cadastros/ordemDosMacroprocessos.ts` (novo) | `compararMacroprocessos` compartilhado pelo real e pelo falso |
| `src/cadastros/textosDeExclusao.ts` (+ `.test.ts`) (novo) | frases das janelas de exclusão com n |
| `src/cadastros/setoresEnvolvidosSupabase.ts` (+ `.test.ts`) (novo) | pôr, tirar, anotar e tradução das recusas |
| `src/cadastros/cadastrosSupabase.ts`, `macroprocessosSupabase.ts` (+ testes) | leituras com contagem e vínculos |
| `src/cadastros/CadastrosFalso.ts` | vínculos falsos, contagens e cascata |
| `src/testes/ClienteSupabaseFalso.ts` | guarda todos os filtros `eq`, não só o último |
| `src/hooks/useGravacaoComFalha.ts` (+ teste via telas) (novo) | `executar` + mensagem de falha, compartilhado |
| `src/components/cadastros/AcoesDoCadastro.tsx` | passa a usar o hook |
| `src/components/cadastros/SetoresEnvolvidos.tsx`, `LinhaDeSetorEnvolvido.tsx`, `PorSetor.tsx` (novos) | seção do macroprocesso aberto |
| `src/components/cadastros/MacroprocessosDoSetor.tsx` (novo) | seção do setor aberto |
| `ListaDeSetores.tsx`, `ListaDeMacroprocessos.tsx`, `SetorEditavel.tsx`, `SetorSomenteLeitura.tsx`, `MacroprocessoEditavel.tsx`, `MacroprocessoSomenteLeitura.tsx` | colunas de quantidade, seções novas, textos das janelas |
| `src/components/cadastros/Cadastros.css` | pequenos ajustes (observação na linha) |
| `src/App.setoresEnvolvidos.test.tsx`, `src/App.macroprocessosDoSetor.test.tsx`, `src/App.contagens.test.tsx`, `src/App.exclusaoEmCascata.test.tsx` (novos) | testes de tela |

---

### Tarefa 1: Workflow de migração e banco: tabela `setores_envolvidos`, RLS, regras e eventos (critérios 1 a 4)

**Files:** criar `.github/workflows/migrar-dev.yml`, `scripts/aplicar-migracao.mjs`, `scripts/caminhoDaMigracao.mjs`, `scripts/caminhoDaMigracao.test.mjs`, `supabase/tests/13_setores_envolvidos.test.sql` e a migração (`npx supabase migration new setores_envolvidos`); modificar `11_setores.test.sql`, `12_macroprocessos.test.sql`, `supabase/AMBIENTES.md` e `src/types/database.ts` (gerado).

**Interfaces:** Produz `public.setores_envolvidos (macroprocesso_id, setor_id, observacao, criado_em)` com `setores_envolvidos_pkey (macroprocesso_id, setor_id)`; eventos `entidade = 'setor_envolvido'` (`criar`/`editar`/`excluir`); `antes` do `excluir` de setor com `macroprocessos` e de macroprocesso com `setores`. Consome `private.pode_alterar_cadastros()`, `private.usuario_ativo()` e `private.acao_do_cadastro(text, jsonb, jsonb)`.

- [x] **Passo 1: conferir a pasta limpa** (`git status` sem mudanças) e criar a branch `git switch -c cadastros-basicos` e o marco `git tag marco/2026-10-13-inicio-ticket-04-setores-envolvidos`.
- [x] **Passo 2: teste do nome da migração (vermelho).** `scripts/caminhoDaMigracao.test.mjs`, no molde de `scripts/relatorio-tap.test.mjs` (Vitest já pega `*.test.mjs`):

```js
import { expect, test } from 'vitest'
import { caminhoDaMigracao } from './caminhoDaMigracao.mjs'

test('aceita o formato AAAAMMDDHHMMSS_nome.sql e devolve o caminho dentro de supabase/migrations', () => {
  expect(caminhoDaMigracao('20261013140000_setores_envolvidos.sql'))
    .toBe('supabase/migrations/20261013140000_setores_envolvidos.sql')
})

test.each(['../.env', 'supabase/migrations/20261013140000_a.sql', '20261013140000_A b.sql', 'qualquer.sql', ''])(
  'recusa "%s" dizendo o valor recebido e o formato esperado', (nome) => {
    expect(() => caminhoDaMigracao(nome)).toThrow(`Recebido: "${nome}"`)
    expect(() => caminhoDaMigracao(nome)).toThrow('AAAAMMDDHHMMSS_nome.sql')
  })
```

  Rodar `npx vitest run scripts/caminhoDaMigracao.test.mjs`; esperado: falha (módulo não existe).
- [x] **Passo 3: implementar o nome e o script.**

`scripts/caminhoDaMigracao.mjs`:

```js
const FORMATO = /^\d{14}_[a-z0-9_]+\.sql$/

/** Só nomes simples de arquivo: o valor vem de um campo de texto do GitHub e vira caminho de leitura. */
export function caminhoDaMigracao(nome) {
  if (!FORMATO.test(nome)) {
    throw new Error(`Nome de migração inválido. Formato esperado: AAAAMMDDHHMMSS_nome.sql. Recebido: "${nome}".`)
  }
  return `supabase/migrations/${nome}`
}
```

`scripts/aplicar-migracao.mjs` (mesma trava e conexão de `testar-banco.mjs`; nunca mostra a cadeia):

```js
// Aplica UMA migração no banco de DESENVOLVIMENTO, numa transação, e registra a versão.
// Uso: node scripts/aplicar-migracao.mjs <ref-dev> <AAAAMMDDHHMMSS_nome.sql>   (cadeia em SUPABASE_DB_URL)
import { existsSync, readFileSync } from 'node:fs'
import pg from 'pg'
import { caminhoDaMigracao } from './caminhoDaMigracao.mjs'

const ARQUIVO_ENV = '.env.banco.local'

function lerConfiguracao() {
  const [ref, nome] = process.argv.slice(2)
  if (!ref || !nome) throw new Error('Uso: node scripts/aplicar-migracao.mjs <ref-dev> <arquivo.sql>')
  if (existsSync(ARQUIVO_ENV)) process.loadEnvFile(ARQUIVO_ENV)
  const url = process.env.SUPABASE_DB_URL
  if (!url) throw new Error('Faltou a variável SUPABASE_DB_URL.')
  // Trava contra o banco errado: a cadeia precisa citar o ref do projeto de desenvolvimento.
  if (!url.includes(ref)) throw new Error(`A cadeia de conexão não é do projeto de desenvolvimento (${ref}). Nada foi executado.`)
  return { url, nome, caminho: caminhoDaMigracao(nome) }
}

const GARANTIR_REGISTRO = `create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key, statements text[], name text)`

async function aplicar({ url, nome, caminho }) {
  const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await cliente.connect()
  const [versao, ...resto] = nome.replace(/\.sql$/, '').split('_')
  try {
    await cliente.query('begin')
    await cliente.query(GARANTIR_REGISTRO)
    const ja = await cliente.query('select 1 from supabase_migrations.schema_migrations where version = $1', [versao])
    if (ja.rowCount) {
      console.log(`::warning::A migração ${nome} já foi aplicada. Nada foi feito.`)
      return await cliente.query('rollback')
    }
    await cliente.query(readFileSync(caminho, 'utf8'))
    await cliente.query('insert into supabase_migrations.schema_migrations (version, name) values ($1, $2)', [versao, resto.join('_')])
    await cliente.query('commit')
    console.log(`Migração ${nome} aplicada.`)
  } catch (erro) {
    await cliente.query('rollback')
    throw erro
  } finally {
    await cliente.end()
  }
}

aplicar(lerConfiguracao()).catch((erro) => {
  console.error(erro.message)
  process.exit(1)
})
```

  Rodar de novo `npx vitest run scripts/caminhoDaMigracao.test.mjs` (verde).
- [x] **Passo 4: workflow.** `.github/workflows/migrar-dev.yml`:

```yaml
# Aplica no banco de DESENVOLVIMENTO a migração indicada. Só roda por "Run workflow" (nunca em push).
# Produção não passa por aqui: só pelos roteiros do /ship.
name: Migrar banco de desenvolvimento

on:
  workflow_dispatch:
    inputs:
      migracao:
        description: 'Arquivo em supabase/migrations (ex.: 20261013140000_setores_envolvidos.sql)'
        required: true

permissions:
  contents: read

# Mesmo grupo dos testes de banco: nunca dois ao mesmo tempo no mesmo banco.
concurrency:
  group: testes-banco
  cancel-in-progress: false

jobs:
  migrar:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: node scripts/aplicar-migracao.mjs yclkzyoebpsxmgpbcbus "$MIGRACAO"
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
          MIGRACAO: ${{ inputs.migracao }}
```

- [x] **Passo 5: levar workflow e script à `main`.** `npm test`, `npx tsc -b` e `npm run lint` verdes; commit "Workflow para migrar o banco de desenvolvimento"; `git switch main`, `git merge --ff-only cadastros-basicos`, `git push origin main` (autorizado), `git switch cadastros-basicos`. Conferir no navegador (painel do app) que "Migrar banco de desenvolvimento" aparece em Actions. O push não toca `supabase/`, então não dispara "Testes de banco"; conferir só que "Verificação" fica verde.
- [x] **Passo 6: escrever o teste pgTAP `13_setores_envolvidos.test.sql`**, copiando a estrutura de `12_macroprocessos.test.sql` (mesmos quatro usuários `a1` a `a4`, `_tap`, funções `pg_temp.conferir_quem_altera` e `conferir_quem_nao_altera`, visitante, `plan(N)` com N contado, saída `RESULTADO DOS TESTES`). Fixtures inventadas: setores `TSA`/`TSB`/`TSC` e macroprocessos `Macro de Teste Um`/`Dois`, mais um vínculo fixo (`TSA` em `Macro de Teste Um`, observação "Papel fictício"). Casos, um por célula da tabela "quem pode o quê":
  - Administrador e Integrante: leem; criam (`TSB` no macro Um); alteram a `observacao` (1 linha); recusam alterar `macroprocesso_id`, `setor_id` e `criado_em` (`42501`); apagam.
  - Consulta e Inativo (administrador desativado): Consulta lê, Inativo não; nenhum cria (`42501`), altera a observação (0 linhas), altera as colunas fixas (`42501`) ou apaga (0 linhas).
  - Visitante: `42501` em ler, criar, alterar a observação, alterar as colunas fixas e apagar.
  - Regras (como dono do banco): o mesmo setor duas vezes no mesmo macroprocesso → `23505`, constraint `setores_envolvidos_pkey` (`throws_ok(..., '23505', null, ...)`); o mesmo setor em dois macroprocessos aceito; macroprocesso sem nenhum setor existe sem problema; observação de 501 caracteres → `23514`; observação "" guardada como nulo; observação " texto " guardada sem espaços nas pontas.
  - Cascata: `delete from setores` do setor `TSC` (com dois vínculos) apaga as linhas dele em `setores_envolvidos` e deixa os macroprocessos; `delete from macroprocessos` apaga as linhas dele e deixa os setores.
  - Eventos (o administrador `a1` age como `authenticated`): pôr gera `criar` com `entidade = 'setor_envolvido'`, `entidade_ref = '<macro_id>:<setor_id>'`, autor `a1` e `depois = {setor_id, setor_sigla, macroprocesso_id, macroprocesso_nome, observacao}` com `antes` nulo; mudar a observação gera `editar` com `antes` e `depois`; gravar a mesma observação não gera evento; tirar gera `excluir` com o `antes` legível.
  - Exclusão de setor com dois vínculos (`TSC`): gera dois eventos `excluir` de `setor_envolvido` com a sigla `TSC` e o nome do macroprocesso legíveis, e o evento `excluir` do setor com `antes = {sigla, nome, observacoes, ativo, macroprocessos: [{macroprocesso_id, codigo, nome, observacao}, …]}` (lista na ordem código, sem código depois, nome).
  - Exclusão de macroprocesso com dois vínculos: o mesmo, com a chave `setores: [{setor_id, sigla, nome, observacao}, …]` (ordem da sigla) e dois eventos de tirar com a sigla e o nome legíveis.
  - Exclusão de setor sem vínculo: `antes.macroprocessos = []`; de macroprocesso sem vínculo: `antes.setores = []`.
- [x] **Passo 7: atualizar os testes 11 e 12.** Em `11_setores.test.sql`, o jsonb esperado do `excluir` ganha `"macroprocessos": []` dentro de `antes`; em `12_macroprocessos.test.sql`, ganha `"setores": []`. Os `plan(N)` não mudam.
- [x] **Passo 8: ver os testes falharem.** `git push -u origin cadastros-basicos`; disparar "Testes de banco" na branch, pelo navegador. Esperado: `13` vermelho (tabela não existe) e `11` e `12` vermelhos (jsonb sem a lista); os demais verdes. Registrar o resultado.
- [x] **Passo 9: escrever a migração.** `npx supabase migration new setores_envolvidos` e preencher com:

```sql
-- Cadastros básicos, ticket 04: setores envolvidos em cada macroprocesso, com RLS por perfil e eventos no histórico.
-- Recusas chegam à interface pelo código do Postgres e pelo nome da restrição (src/cadastros/setoresEnvolvidosSupabase.ts).
-- Reaproveita private.pode_alterar_cadastros() e private.acao_do_cadastro() da migração de setores.

create table public.setores_envolvidos (
  macroprocesso_id uuid not null references public.macroprocessos (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  observacao text constraint setores_envolvidos_observacao_tamanho check (char_length(observacao) <= 500),
  criado_em timestamptz not null default now(),
  constraint setores_envolvidos_pkey primary key (macroprocesso_id, setor_id)
);

-- A chave composta serve para buscar por macroprocesso; falta o caminho inverso (macroprocessos de um setor).
create index setores_envolvidos_setor on public.setores_envolvidos (setor_id);

alter table public.setores_envolvidos enable row level security;

-- Privilégios: visitante nada; logado lê e apaga, inclui os dois ids e a observação e altera só a observação.
revoke all on public.setores_envolvidos from anon, authenticated;
grant select, delete on public.setores_envolvidos to authenticated;
grant insert (macroprocesso_id, setor_id, observacao) on public.setores_envolvidos to authenticated;
grant update (observacao) on public.setores_envolvidos to authenticated;

create policy "setores_envolvidos: ativo lê" on public.setores_envolvidos
  for select to authenticated using ((select private.usuario_ativo()));

create policy "setores_envolvidos: administrador e integrante ativos criam" on public.setores_envolvidos
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));

create policy "setores_envolvidos: administrador e integrante ativos alteram" on public.setores_envolvidos
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

create policy "setores_envolvidos: administrador e integrante ativos apagam" on public.setores_envolvidos
  for delete to authenticated using ((select private.pode_alterar_cadastros()));

-- Antes de gravar: observação sem espaços nas pontas e vazia guardada como nula; o limite é da restrição.
create function private.preparar_setor_envolvido() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.observacao := nullif(btrim(new.observacao), '');
  return new;
end $$;

-- Evento de pôr (criar), mudar a observação (editar) e tirar (excluir) com sigla e nome legíveis.
-- Na exclusão de setor ou macroprocesso os vínculos são tirados ANTES do pai sair (gatilhos abaixo), quando os dois ainda existem.
create function private.registrar_evento_do_setor_envolvido() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  linha public.setores_envolvidos := case when tg_op = 'DELETE' then old else new end;
  base jsonb;
  antes jsonb;
  depois jsonb;
begin
  select jsonb_build_object('setor_id', s.id, 'setor_sigla', s.sigla,
    'macroprocesso_id', m.id, 'macroprocesso_nome', m.nome) into base
  from public.setores s, public.macroprocessos m
  where s.id = linha.setor_id and m.id = linha.macroprocesso_id;
  base := coalesce(base, jsonb_build_object('setor_id', linha.setor_id, 'macroprocesso_id', linha.macroprocesso_id));
  antes := case when tg_op <> 'INSERT' then base || jsonb_build_object('observacao', old.observacao) end;
  depois := case when tg_op <> 'DELETE' then base || jsonb_build_object('observacao', new.observacao) end;
  if antes = depois then
    return null; -- gravação sem mudança não vira evento
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), private.acao_do_cadastro(tg_op, antes, depois), 'setor_envolvido',
    linha.macroprocesso_id::text || ':' || linha.setor_id::text, jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Excluir um setor: guarda a lista de macroprocessos dele, tira os vínculos (cada um gera o seu evento) e registra a exclusão.
create function private.registrar_exclusao_do_setor() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  macroprocessos jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('macroprocesso_id', m.id, 'codigo', m.codigo, 'nome', m.nome,
    'observacao', v.observacao) order by m.codigo nulls last, m.nome), '[]'::jsonb) into macroprocessos
  from public.setores_envolvidos v join public.macroprocessos m on m.id = v.macroprocesso_id
  where v.setor_id = old.id;
  delete from public.setores_envolvidos where setor_id = old.id;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'setor', old.id::text, jsonb_build_object(
    'antes', jsonb_build_object('sigla', old.sigla, 'nome', old.nome, 'observacoes', old.observacoes,
      'ativo', old.ativo, 'macroprocessos', macroprocessos),
    'depois', null));
  return old;
end $$;

-- Excluir um macroprocesso: o mesmo, com a lista de setores.
create function private.registrar_exclusao_do_macroprocesso() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  setores jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('setor_id', s.id, 'sigla', s.sigla, 'nome', s.nome,
    'observacao', v.observacao) order by s.sigla), '[]'::jsonb) into setores
  from public.setores_envolvidos v join public.setores s on s.id = v.setor_id
  where v.macroprocesso_id = old.id;
  delete from public.setores_envolvidos where macroprocesso_id = old.id;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'excluir', 'macroprocesso', old.id::text, jsonb_build_object(
    'antes', jsonb_build_object('codigo', old.codigo, 'nome', old.nome, 'descricao', old.descricao,
      'categoria', old.categoria, 'ativo', old.ativo, 'setores', setores),
    'depois', null));
  return old;
end $$;

revoke execute on function private.preparar_setor_envolvido(), private.registrar_evento_do_setor_envolvido(),
  private.registrar_exclusao_do_setor(), private.registrar_exclusao_do_macroprocesso()
  from public, anon, authenticated;

create trigger preparar_setor_envolvido before insert or update on public.setores_envolvidos
  for each row execute function private.preparar_setor_envolvido();

create trigger registrar_evento_do_setor_envolvido after insert or update or delete on public.setores_envolvidos
  for each row execute function private.registrar_evento_do_setor_envolvido();

-- O evento de exclusão de setor e de macroprocesso sai dos gatilhos "antes de apagar" acima; os de
-- inclusão e alteração ficam como estavam (a ramificação de exclusão das funções antigas deixa de ser usada).
drop trigger registrar_evento_do_setor on public.setores;
create trigger registrar_evento_do_setor after insert or update on public.setores
  for each row execute function private.registrar_evento_do_setor();
drop trigger registrar_evento_do_macroprocesso on public.macroprocessos;
create trigger registrar_evento_do_macroprocesso after insert or update on public.macroprocessos
  for each row execute function private.registrar_evento_do_macroprocesso();

create trigger registrar_exclusao_do_setor before delete on public.setores
  for each row execute function private.registrar_exclusao_do_setor();
create trigger registrar_exclusao_do_macroprocesso before delete on public.macroprocessos
  for each row execute function private.registrar_exclusao_do_macroprocesso();
```

  Conferir contra o teste: se o teste 13 achar um detalhe diferente (ex.: ordem do jsonb), ajustar a **migração** ou o **teste**, nunca os dois ao mesmo tempo sem entender a causa.
- [x] **Passo 10: aplicar pelo workflow.** `git push`; disparar "Migrar banco de desenvolvimento" na branch com `migracao` = nome do arquivo criado no passo 9 (autorizado); ler o log (esperado: "Migração … aplicada."; se aparecer o aviso de já aplicada, ou se a inserção na tabela de registro falhar, anotar em `.scratch/melhorias-protocolo.md` e seguir pelo SQL Editor, pedindo ao usuário que cole o arquivo).
- [x] **Passo 11: ver os testes passarem.** Disparar "Testes de banco" na branch. Esperado: verde nos 14 arquivos (`00` e `10` cobrem a tabela nova sem mudança; `11` e `12` com a lista nova).
- [x] **Passo 12: tipos.** Conferir o vínculo (`AMBIENTES.md` e `supabase/.temp/project-ref`), `npm run db:types`, `npx tsc -b` limpo (a tabela e as relações para `setores_envolvidos(...)` aparecem em `src/types/database.ts`).
- [x] **Passo 13: registro e commit.** Acrescentar a `supabase/AMBIENTES.md`, na lista de migrações do dev, a linha `<versão>_setores_envolvidos (2026-10-13; cadastros-basicos, ticket 04; aplicada pelo workflow "Migrar banco de desenvolvimento"; teste 13 falhou antes, tabela inexistente, e passou depois, com os 14 arquivos verdes, pelo GitHub Actions)`. Commit de migração, testes 11/12/13, tipos e `AMBIENTES.md`.

---

### Tarefa 2: Módulo de cadastros: vínculos e contagens, real e falso (critério 5)

**Files:** `src/cadastros/tipos.ts`, `ordemDosMacroprocessos.ts` (novo), `textosDeExclusao.ts` (+ teste, novos), `setoresEnvolvidosSupabase.ts` (+ teste, novos), `cadastrosSupabase.ts` e `macroprocessosSupabase.ts` (+ testes existentes), `CadastrosFalso.ts`, `src/testes/ClienteSupabaseFalso.ts`.

**Interfaces:** Produz, em `tipos.ts`:

```ts
export type MacroprocessoDoSetor = { id: string; codigo: string | null; nome: string; observacao: string | null }
export type SetorDaLista = Setor & { quantidadeDeMacroprocessos: number }
export type SetorComMacroprocessos = Setor & { macroprocessos: MacroprocessoDoSetor[] }
export type SetorEnvolvido = { setorId: string; sigla: string; nome: string; ativo: boolean; observacao: string | null }
export type MacroprocessoDaLista = Macroprocesso & { quantidadeDeSetores: number }
export type MacroprocessoComSetores = Macroprocesso & { setoresEnvolvidos: SetorEnvolvido[] }
```

e em `ModuloDeCadastros`: `listarSetores(): Promise<SetorDaLista[]>`, `lerSetor(id): Promise<SetorComMacroprocessos | null>`, `listarMacroprocessos(): Promise<MacroprocessoDaLista[]>`, `lerMacroprocesso(id): Promise<MacroprocessoComSetores | null>`, `porSetorNoMacroprocesso(macroprocessoId: string, setorId: string): Promise<void>`, `tirarSetorDoMacroprocesso(macroprocessoId: string, setorId: string): Promise<void>`, `mudarObservacaoDoSetorEnvolvido(macroprocessoId: string, setorId: string, observacao: string | null): Promise<void>`. `ordemDosMacroprocessos.ts` produz `compararMacroprocessos(a: { codigo: string | null; nome: string }, b: { codigo: string | null; nome: string }): number` (código, sem código depois, nome em `pt-BR`; é a `naOrdemDoBanco` que hoje vive em `CadastrosFalso.ts`). `textosDeExclusao.ts` produz `textoDaExclusaoDoSetor(sigla: string, macroprocessos: number): string` e `textoDaExclusaoDoMacroprocesso(setores: number): string`.

- [x] **Passo 1: testes que falham.**
  - `textosDeExclusao.test.ts`: setor com 3 → "CEE sai de 3 macroprocessos. O histórico guarda o que ele tinha, mas não é possível desfazer."; com 1 → "…sai de 1 macroprocesso. …"; com 0 → "O histórico guarda o que ele tinha, mas não é possível desfazer."; macroprocesso com 2 → "2 setores deixam de estar envolvidos nele. O histórico guarda…"; com 1 → "1 setor deixa de estar envolvido nele. …"; com 0 → só "O histórico guarda…".
  - `cadastrosSupabase.test.ts` (ajustar os existentes): `listarSetores` pede `'id, sigla, nome, observacoes, ativo, setores_envolvidos(count)'` e devolve cada setor com `quantidadeDeMacroprocessos` (resposta `setores_envolvidos: [{ count: 2 }]`; lista vazia vira 0); `lerSetor` pede `'id, sigla, nome, observacoes, ativo, setores_envolvidos(observacao, macroprocessos(id, codigo, nome))'` e devolve `macroprocessos` achatados e ordenados por `compararMacroprocessos`.
  - `macroprocessosSupabase.test.ts` (ajustar): `listarMacroprocessos` pede `'id, codigo, nome, descricao, categoria, ativo, setores_envolvidos(count)'` com a mesma ordem de antes e devolve `quantidadeDeSetores`; `lerMacroprocesso` pede `'id, codigo, nome, descricao, categoria, ativo, setores_envolvidos(observacao, setores(id, sigla, nome, ativo))'` e devolve `setoresEnvolvidos` ordenados por sigla.
  - `setoresEnvolvidosSupabase.test.ts` (novo, molde de `macroprocessosSupabase.test.ts`): pôr faz `insert` em `setores_envolvidos` com `{ macroprocesso_id, setor_id }`; `23505` com `setores_envolvidos_pkey` busca a sigla em `setores` (`eq id`) e vira `TravaDoBanco("O setor SIGLA já está neste macroprocesso.")`; `23503` vira `CadastroInexistente`; `42501` vira `TravaDoBanco("Seu perfil não permite alterar os cadastros.")`; outro erro vira `Error("erro inesperado do banco (…)")`; tirar faz `delete` com dois filtros (`macroprocesso_id` e `setor_id`); tirar com zero linhas e vínculo sem leitura resolve em silêncio; tirar com zero linhas e vínculo ainda legível vira `TravaDoBanco` de perfil; anotar faz `update` de `{ observacao }` com os dois filtros e segue as mesmas regras de zero linhas.
  - `ClienteSupabaseFalso`: guardar todos os filtros `eq` em `filtros: [string, string][]` (mantendo `filtro` como o último, para os testes atuais).
- [x] **Passo 2: ver falharem.** `npx vitest run src/cadastros`.
- [x] **Passo 3: implementar.**
  - `tipos.ts` com os tipos e as 7 assinaturas acima (atualizar o comentário do módulo: setores envolvidos já chegam; só o histórico falta).
  - `ordemDosMacroprocessos.ts` (mover a regra, sem mudar comportamento) e `CadastrosFalso` passa a importá-la.
  - `textosDeExclusao.ts`: duas funções curtas com `const FRASE_FINAL = 'O histórico guarda o que ele tinha, mas não é possível desfazer.'`.
  - `cadastrosSupabase.ts`/`macroprocessosSupabase.ts`: novas colunas e funções de tradução (`comContagem`, `achatarMacroprocessos`, `achatarSetores`) de até 20 linhas cada; o `count` embutido chega como `[{ count: n }]` (ausente = 0).
  - `setoresEnvolvidosSupabase.ts` com `criarSetoresEnvolvidosSupabase(cliente)` devolvendo `porSetorNoMacroprocesso`, `tirarSetorDoMacroprocesso` e `mudarObservacaoDoSetorEnvolvido`, no molde das outras (`inserir`, `apagar`, `anotar`, `falhaDoVinculo(erro, cliente)`, `porQueNadaMudouNoVinculo`); `criarCadastrosSupabase` junta os três grupos.
  - `CadastrosFalso`: campo `vinculos: { macroprocessoId: string; setorId: string; observacao: string | null }[] = []`; `listarSetores`/`listarMacroprocessos` contam a partir dele; `lerSetor`/`lerMacroprocesso` montam as listas (ordem do banco); `porSetorNoMacroprocesso` recusa o repetido com `TravaDoBanco("O setor {SIGLA} já está neste macroprocesso.")` e, se o setor ou o macroprocesso não existe, lança `CadastroInexistente`; `tirar…` e `mudarObservacao…` ignoram vínculo inexistente; `excluirSetor` e `excluirMacroprocesso` removem os vínculos do item; todas as gravações passam por `falharSeConfigurado()`.
- [x] **Passo 4: verificar.** `npx vitest run src/cadastros` verde; `npm test` (as telas atuais podem falhar só nos cabeçalhos e nos textos que a Tarefa 3 muda — qualquer outra falha é regressão: corrigir agora), `npx tsc -b`, `npm run lint`. Commit.

---

### Tarefa 3: Listas com contagem (critério 8)

**Files:** `ListaDeSetores.tsx`, `ListaDeMacroprocessos.tsx`, `AreaDeSetores.tsx`, `AreaDeMacroprocessos.tsx`, `src/App.setores.test.tsx`, `src/App.macroprocessos.test.tsx` (ajustar), `src/App.contagens.test.tsx` (novo).

**Interfaces:** Consome `SetorDaLista`, `MacroprocessoDaLista`, `CadastrosFalso.vinculos`. As props `estado` das duas listas passam a `EstadoDoCarregamento<SetorDaLista[]>` e `EstadoDoCarregamento<MacroprocessoDaLista[]>`.

- [x] **Passo 1: testes que falham.**
  - Ajustar os testes de cabeçalho: `['Sigla', 'Nome', 'Macroprocessos', 'Situação']` e `['Código', 'Nome', 'Categoria', 'Setores', 'Situação']`.
  - `App.contagens.test.tsx` (aplicativo inteiro, `CadastrosFalso` com setores, macroprocessos e `vinculos` inventados, hash `#/setores` e `#/setores/macroprocessos`): a coluna mostra a quantidade certa por linha (inclusive 0); desativar um setor não muda a contagem dele; a Consulta vê as mesmas contagens.
- [x] **Passo 2: ver falharem.** `npx vitest run src/App.contagens.test.tsx src/App.setores.test.tsx src/App.macroprocessos.test.tsx`.
- [x] **Passo 3: implementar** a coluna nas duas tabelas (`LinhaFantasma` com 4 e 5 colunas) mostrando o número puro.
- [x] **Passo 4: verificar** (`npm test`, `npx tsc -b`, `npm run lint`). Commit.

---

### Tarefa 4: Macroprocesso aberto: setores envolvidos (critérios 6 e 10, parte do macroprocesso)

**Files:** `src/hooks/useGravacaoComFalha.ts` (novo), `AcoesDoCadastro.tsx`, `SetoresEnvolvidos.tsx`, `LinhaDeSetorEnvolvido.tsx`, `PorSetor.tsx` (novos), `MacroprocessoEditavel.tsx`, `MacroprocessoSomenteLeitura.tsx`, `Cadastros.css`, `src/App.setoresEnvolvidos.test.tsx` (novo).

**Interfaces:** Consome `MacroprocessoComSetores`, `SetorDaLista`, `ModuloDeCadastros.{listarSetores, porSetorNoMacroprocesso, tirarSetorDoMacroprocesso, mudarObservacaoDoSetorEnvolvido}`, `useCarregamento`, `textoDaFalha` (`src/acesso/falhasDeGravacao`), `Pilula`, `ErroAoCarregar`. Produz:

```ts
// src/hooks/useGravacaoComFalha.ts
export function useGravacaoComFalha(aoSumir: () => void): {
  falha: string | null
  executar: (gravar: () => Promise<void>, depois: () => void) => Promise<void>
}
// SetoresEnvolvidos.tsx
export function SetoresEnvolvidos(props: {
  cadastros: ModuloDeCadastros; macroprocessoId: string; envolvidos: SetorEnvolvido[]
  aoMudar: () => void; aoSumir: () => void
}): JSX.Element
// PorSetor.tsx (seletor + [Pôr setor])
export function PorSetor(props: { cadastros: ModuloDeCadastros; macroprocessoId: string; envolvidos: SetorEnvolvido[]; aoMudar: () => void; aoSumir: () => void }): JSX.Element
// LinhaDeSetorEnvolvido.tsx
export function LinhaDeSetorEnvolvido(props: { cadastros: ModuloDeCadastros; macroprocessoId: string; setor: SetorEnvolvido; aoMudar: () => void; aoSumir: () => void }): JSX.Element
```

- [x] **Passo 1: prefactor (sem mudar comportamento).** Extrair de `AcoesDoCadastro` o estado `falha` e a função `executar` (zera a falha; `CadastroInexistente` → `aoSumir()`; outra falha → `setFalha(textoDaFalha(erro))`; sucesso → `depois()`) para `useGravacaoComFalha`; `AcoesDoCadastro` passa a usá-lo. `npm test` com a mesma contagem de testes passando, `npx tsc -b`, `npm run lint`.
- [x] **Passo 2: testes de tela que falham** (`App.setoresEnvolvidos.test.tsx`, aplicativo inteiro, hash `#/setores/macroprocessos`, abrir o macroprocesso clicando na linha; setores `TSA`, `TSB`, `TSC` ativos e `TSX` inativo, inventados):
  - com vínculos: a seção "Setores envolvidos" lista sigla, nome, observação editável e [Tirar] por linha, ordenados por sigla; sem vínculos: "Nenhum setor envolvido ainda."
  - setor inativo envolvido aparece com a pílula "Inativo" (e continua com [Tirar]).
  - seletor "Setor a pôr": só tem "Escolha um setor" e os setores **ativos ainda não envolvidos** (sem `TSX`, sem os já envolvidos); [Pôr setor] desabilitado até escolher.
  - pôr: escolher `TSB` e clicar [Pôr setor] grava, o setor aparece na lista e some do seletor; sem janela de confirmação.
  - tirar: [Tirar] grava na hora, sem janela, a linha some e o setor volta ao seletor.
  - observação: digitar e sair do campo (`blur`) grava o texto; sair sem mudar não chama o módulo; apagar tudo grava nulo.
  - falha ao pôr (módulo falha com `TravaDoBanco("O setor TSB já está neste macroprocesso.")`): a frase aparece em vermelho (`cadastros-falha`, `role="alert"`) ao lado do seletor, e a lista não muda.
  - falha ao tirar e ao gravar a observação: a mensagem aparece **na linha** (`A alteração não foi salva: …`), em vermelho, e a linha continua; a observação digitada continua no campo.
  - macroprocesso excluído por outra pessoa durante a operação (`CadastroInexistente`): vira o aviso "Este cadastro não existe mais…" com [Voltar à lista].
  - falha ao carregar os setores do seletor (`falharLista`): "Não foi possível carregar os setores. Verifique a conexão e tente de novo." com [Tentar de novo], sem esconder a lista de envolvidos.
  - Consulta: vê a lista com sigla, nome, observação em texto e a pílula "Inativo", **sem** [Tirar], **sem** seletor, **sem** campo editável; "Nenhum setor envolvido ainda." também aparece para ela.
- [x] **Passo 3: ver falharem.** `npx vitest run src/App.setoresEnvolvidos.test.tsx`.
- [x] **Passo 4: implementar.**
  - `SetoresEnvolvidos`: `<section aria-label="Setores envolvidos">` com `<h3>`, tabela (`tabela-cadastros`) de `LinhaDeSetorEnvolvido` ou o texto vazio, e `PorSetor` abaixo.
  - `LinhaDeSetorEnvolvido`: sigla, nome, pílula neutra "Inativo" se `!ativo`, `<input aria-label="Observação de {SIGLA}" maxLength={500}>` com estado local e `onBlur` que só grava se mudou (`texto.trim() || null`), botão [Tirar] (`aria-label="Tirar {SIGLA}"`), e abaixo a falha da linha (`role="alert"`, classe `cadastros-falha`), tudo via `useGravacaoComFalha(aoSumir)`; `depois` = `aoMudar`.
  - `PorSetor`: `useCarregamento(() => cadastros.listarSetores())`; opções = ativos que não estão em `envolvidos`; erro → `ErroAoCarregar alvo="os setores"`; botão desabilitado sem escolha; ao pôr, limpa a escolha e chama `aoMudar`.
  - `MacroprocessoEditavel` recebe `MacroprocessoComSetores`, renderiza `SetoresEnvolvidos` entre o formulário e as ações; `MacroprocessoSomenteLeitura` mostra a mesma lista em leitura (sem [Tirar], seletor ou campo: observação em texto, "—" se vazia).
  - CSS: o campo de observação ocupa a largura disponível da célula, sem quebrar a linha (`[visual]` da spec).
- [x] **Passo 5: verificar** (`npm test`, `npx tsc -b`, `npm run lint`). Commit.

---

### Tarefa 5: Setor aberto: macroprocessos em que participa (critérios 7 e 10, parte do setor)

**Files:** `MacroprocessosDoSetor.tsx` (novo), `SetorEditavel.tsx`, `SetorSomenteLeitura.tsx`, `src/App.macroprocessosDoSetor.test.tsx` (novo).

**Interfaces:** Consome `SetorComMacroprocessos` (já devolvido por `lerSetor`). Produz `MacroprocessosDoSetor({ macroprocessos }: { macroprocessos: MacroprocessoDoSetor[] })`.

- [x] **Passo 1: testes de tela que falham** (hash `#/setores`, abrir o setor): "Macroprocessos em que participa" lista código ("—" se não tem), nome e observação, na ordem código/sem código/nome, só leitura (sem botão nem campo editável dentro da seção); sem vínculos: "Este setor ainda não participa de nenhum macroprocesso."; a Consulta vê a mesma seção; um macroprocesso inativo em que o setor participa continua listado.
- [x] **Passo 2: ver falharem.** `npx vitest run src/App.macroprocessosDoSetor.test.tsx`.
- [x] **Passo 3: implementar** `MacroprocessosDoSetor` (`<section aria-label="Macroprocessos em que participa">` com `<h3>` e tabela, ou o texto vazio) e usá-lo em `SetorEditavel` (abaixo do formulário e acima das ações) e em `SetorSomenteLeitura`.
- [x] **Passo 4: verificar** (`npm test`, `npx tsc -b`, `npm run lint`). Commit.

---

### Tarefa 6: Janelas de exclusão com a quantidade (critério 9)

**Files:** `SetorEditavel.tsx`, `MacroprocessoEditavel.tsx`, `src/App.exclusaoEmCascata.test.tsx` (novo), ajuste dos textos em `App.excluirSetor.test.tsx` e `App.excluirMacroprocesso.test.tsx` só se algum depender do texto antigo com vínculos.

**Interfaces:** Consome `textoDaExclusaoDoSetor(sigla, n)` e `textoDaExclusaoDoMacroprocesso(n)` (Tarefa 2), `macroprocessos.length` do setor aberto e `setoresEnvolvidos.length` do macroprocesso aberto. Remove as constantes `TEXTO_DA_EXCLUSAO` provisórias dos dois componentes.

- [x] **Passo 1: testes que falham** (`App.exclusaoEmCascata.test.tsx`): Excluir setor com 3 macroprocessos abre a janela "Excluir o setor TSA?" com "TSA sai de 3 macroprocessos. O histórico guarda o que ele tinha, mas não é possível desfazer."; com 1 usa o singular; sem vínculos o texto começa por "O histórico guarda…"; Excluir macroprocesso com 2 setores diz "2 setores deixam de estar envolvidos nele. …", com 1 o singular, com 0 só "O histórico guarda…"; confirmar exclui e o falso remove também os vínculos (o setor excluído some do macroprocesso aberto em seguida: reabrir o macroprocesso não o lista); Cancelar e Esc não gravam.
- [x] **Passo 2: ver falharem.** `npx vitest run src/App.exclusaoEmCascata.test.tsx`.
- [x] **Passo 3: implementar** trocando as constantes pelo texto calculado.
- [x] **Passo 4: verificar** (`npm test`, `npx tsc -b`, `npm run lint`). Commit.

---

### Tarefa 7: Fechamento (critérios 1 a 10 conferidos)

- [x] **Passo 1: gate completo.** `npm test` (todos passando), `npx tsc -b`, `npm run lint`, `npm run check:circular`, `npm run test:coverage` com cobertura ≥ 70%.
- [x] **Passo 2: conferir os 11 critérios do ticket** um a um, anotando a evidência (teste ou arquivo) de cada.
  - 1 (pgTAP antes da migração): `13_setores_envolvidos.test.sql`, vermelho no run #17 e verde no #18 (56 de 56).
  - 2 (migração, RLS, privilégios): `20261013150735_setores_envolvidos.sql`; `00_rls_ligada` e `10_privilegios_padrao` verdes nos 14 arquivos.
  - 3 (eventos pôr, tirar e anotar, com sigla e nome; cascata gera os de tirar): testes 13 (seis eventos do vínculo e os da exclusão).
  - 4 (`antes` da exclusão com a lista): testes 13, mais `11` e `12` atualizados.
  - 5 (módulo real e falso, frase da recusa, contagem derivada na leitura): `setoresEnvolvidosSupabase.test.ts`, `cadastrosSupabase.test.ts`, `macroprocessosSupabase.test.ts`; contagem por `setores_envolvidos(count)`, sem view nova.
  - 6 (macroprocesso aberto): `App.setoresEnvolvidos.test.tsx` (15 testes).
  - 7 (setor aberto): `App.macroprocessosDoSetor.test.tsx`.
  - 8 (colunas de quantidade): `App.contagens.test.tsx`, `App.macroprocessos.test.tsx`, `App.setores.test.tsx`.
  - 9 (janelas com n): `App.exclusaoEmCascata.test.tsx`, `textosDeExclusao.test.ts`.
  - 10 (Consulta): `App.setoresEnvolvidos.test.tsx` e `App.macroprocessosDoSetor.test.tsx`.
  - 11 (testes com o aplicativo inteiro): os mesmos arquivos de tela, cobrindo sucesso e falha, seletor, contagens, janelas e Consulta.
- [x] **Passo 3: revisão visual.** Não feita pelo assistente: o login institucional do Google barra a sessão no navegador do app; a conferência visual ficou com o usuário, como nos tickets 02 e 03. Subir o Vite (`preview_start`) e conferir o macroprocesso aberto (lista, observação, seletor alinhados) e o setor aberto; se o login institucional do Google barrar a sessão, registrar que a conferência visual ficou com o usuário, como nos tickets anteriores.
- [x] **Passo 4: spec e registros.** Acrescentar à spec (`Modelo de dados`, abaixo da tabela de `eventos`) a nota dos nomes do evento de vínculo e das chaves `macroprocessos`/`setores` no "antes" da exclusão (decisão de execução acima), para o ticket 05 ler. Atualizar `.scratch/melhorias-protocolo.md` com os itens de `.claude/regras/nao-testados.md` que aconteceram nesta execução e com o resultado do workflow de migração (primeira execução real).
- [ ] **Passo 5: encerrar.** Juntar a branch à `main` (`git switch main`, merge, `git branch -d cadastros-basicos`), linha `Concluído em` no ticket, commit, `git push` da `main` (autorizado) e conferência do "Testes de banco" e da "Verificação" na `main` (o push mexe em `supabase/`).
