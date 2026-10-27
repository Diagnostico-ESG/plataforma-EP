# Cor do setor nos cadastros — Plano de execução (ticket 02)

> **Para quem executa:** use `superpowers:executing-plans`. Os passos usam caixas (`- [ ]`); marque (`- [x]`) ao terminar cada um.

**Objetivo:** cada setor ganha `cor` (1 a 30), gravada no banco e mostrada como selo nos cadastros e como quadradinho no [Pôr setor].

**Arquitetura:** coluna `setores.cor` com restrição, gatilho da "primeira livre" e privilégios por coluna (migração não destrutiva). O tom de cada número vive num único módulo puro (`src/cadastros/corDoSetor.ts`); o selo e o quadradinho recebem o número e pintam por duas variáveis CSS (`--cor-claro`, `--cor-escuro`), o que também funciona no jsdom.

**Pilha:** Postgres/pgTAP (Supabase), React 19 + TypeScript, Vitest.

**Referências (não repetidas aqui):** ticket `.scratch/visual-do-cartao/issues/02-cor-do-setor-nos-cadastros.md`; seção "Cor do setor" de `.scratch/cadastros-basicos/spec.md` (histórias 1–4, 12–17, 19–25; tabelas "Quem pode o quê" e "Regras que o banco impõe"); ADR 0030; tons em `.scratch/identidade-visual.md` (registro de 2026-10-27). Regras de banco: `.claude/regras/banco.md` (lido): teste antes da migração; estrutura só por migração; privilégios por coluna; nada de `service_role`.

## Restrições globais

- Dados de teste só inventados. Nenhuma dependência nova.
- Arquivos ≤ 300 linhas, funções ≤ 20 linhas, sem `any`, props tipadas; `npm run lint` e `npm run typecheck` verdes antes de cada commit (o pre-commit barra o resto; nunca `--no-verify`).
- A cor não entra no histórico: nenhuma tela mostra "Cor" no histórico.
- Fora deste ticket: trocar a cor (ticket 03), grade de amostras, cor na área Processos (ticket 04), editar setor enviando `cor`.

## Ambiente e alvo do banco

- **Docker precisa estar ligado** (nesta sessão o daemon estava desligado: `docker version` falhou). Se continuar desligado ao chegar na Tarefa 1, pare e peça ao usuário que abra o Docker Desktop. Plano B: empurrar a branch e rodar o workflow "Testes de banco" (autorizado em "Ajustes deste Projeto").
- Alvo conferido: `supabase/AMBIENTES.md` diz "vínculo atual: yclkzyoebpsxmgpbcbus" (desenvolvimento). Comandos locais (`supabase start`, `test db`, `gen types --local`) não tocam o remoto. A migração chega ao remoto de desenvolvimento só pelo workflow "Migrar banco de desenvolvimento" (Tarefa 8).
- Saída de `supabase start`/`status` traz chaves: não repetir. O resultado "FAIL" do `supabase test db` é do formato (os testes devolvem o resultado como exceção): contar linhas `ok` e `not ok`.

## Estrutura de arquivos

| Arquivo | O que faz |
|---|---|
| `supabase/tests/66_cor_do_setor.test.sql` (novo) | pgTAP: células de "quem pode o quê" e regras do banco |
| `supabase/migrations/<ts>_cor_do_setor.sql` (novo) | coluna, preenchimento, restrição, gatilho, privilégios |
| `src/types/database.ts` | regenerado |
| `src/cadastros/corDoSetor.ts` + `.test.ts` (novos) | paleta de 30 cores, tom escuro por regra fixa |
| `src/components/SeloDoSetor.tsx` + `.css` + `.test.tsx` (novos) | selo da sigla sobre a cor |
| `src/components/OpcaoDaCaixa.tsx`, `src/styles/caixas.css` | quadradinho `corDoSetor` |
| `src/cadastros/tipos.ts`, `cadastrosSupabase.ts`, `macroprocessosSupabase.ts`, `CadastrosFalso.ts` (+ testes) | `cor` lida; falsa imita a primeira livre |
| `ListaDeSetores`, `SetorSomenteLeitura`, `SetorEditavel`, `LinhaDeSetorEnvolvido`, `SetoresEnvolvidos`, `PorSetor` | selos e quadradinho |
| `src/App.corDoSetor.test.tsx` (novo) | testes de tela do ticket |

---

### Tarefa 0: Branch e marco

- [ ] `git status` limpo (conferido: limpo). `git switch -c visual-do-cartao-02` a partir da `main` (convenção do projeto: `<funcionalidade>-NN`).
- [ ] Marco: `git tag marco/2026-10-27-inicio-cor-do-setor-nos-cadastros` e `git push origin "refs/tags/marco/*:refs/tags/marco/*"` (autorizado).
- [ ] Comitar este plano: `git add .scratch/visual-do-cartao/plano-02.md && git commit -m "visual-do-cartao 02: plano de execução"`.

### Tarefa 1: Teste de banco que falha (e só depois a migração)

**Arquivos:** criar `supabase/tests/66_cor_do_setor.test.sql`.

- [ ] **Passo 1: escrever o teste** (29 asserções). Cobre: as 15 células (5 perfis × ler, criar com cor, alterar), restrição 0/31/1/30, primeira livre (1,2→3; 1,3→2), inativo ocupa, 30 em uso→1, cor informada repetida respeitada, trocar só a cor sem evento, cor+nome com evento sem `cor`, preenchimento pela ordem da sigla.

```sql
-- Cor do setor: quem pode o quê e regras do banco (visual-do-cartao, ticket 02).
begin;
create extension if not exists pgtap with schema extensions;
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(29);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
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

insert into public.setores (nome, sigla, cor) values ('Setor Fixo de Teste', 'SFT', 5);

-- Uma pessoa (ou o visitante) tenta ler, criar com cor e alterar a cor; id_usuario nulo é o visitante.
create function pg_temp.cor_como(papel text, id_usuario text, quem text, sigla_nova text,
  pode_ler boolean, pode_gravar boolean) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    coalesce(format('{"sub":"%s","role":"authenticated"}', id_usuario), '{"role":"anon"}'), true);
  execute format('set local role %s', papel);
  if pode_ler then
    insert into _tap (linha) select is((select cor from public.setores where sigla = 'SFT'), 5, quem || ' lê a cor');
  elsif papel = 'anon' then
    insert into _tap (linha) select throws_ok('select cor from public.setores', '42501', null, quem || ' não lê a cor');
  else
    insert into _tap (linha) select is((select count(*)::int from public.setores), 0, quem || ' não lê a cor');
  end if;
  if pode_gravar then
    insert into _tap (linha) select lives_ok(
      format('insert into public.setores (nome, sigla, cor) values (%L, %L, 7)', 'Setor de ' || quem, sigla_nova),
      quem || ' informa a cor ao criar');
    with alteradas as (update public.setores set cor = 9 where sigla = 'SFT' returning cor)
    insert into _tap (linha) select is((select cor from alteradas), 9, quem || ' altera a cor');
  else
    insert into _tap (linha) select throws_ok(
      format('insert into public.setores (nome, sigla, cor) values (%L, %L, 7)', 'Setor de ' || quem, sigla_nova),
      '42501', null, quem || ' não informa a cor ao criar');
    if papel = 'anon' then
      insert into _tap (linha) select throws_ok($sql$update public.setores set cor = 9 where sigla = 'SFT'$sql$,
        '42501', null, quem || ' não altera a cor');
    else
      with alteradas as (update public.setores set cor = 9 where sigla = 'SFT' returning 1)
      insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não altera a cor');
    end if;
  end if;
  reset role;
  update public.setores set cor = 5 where sigla = 'SFT';
end $$;
grant execute on function pg_temp.cor_como(text, text, text, text, boolean, boolean) to anon, authenticated;

select pg_temp.cor_como('authenticated', '00000000-0000-0000-0000-0000000000a1', 'Administrador', 'CADM', true, true);
select pg_temp.cor_como('authenticated', '00000000-0000-0000-0000-0000000000a2', 'Integrante', 'CINT', true, true);
select pg_temp.cor_como('authenticated', '00000000-0000-0000-0000-0000000000a3', 'Consulta', 'CCON', true, false);
select pg_temp.cor_como('authenticated', '00000000-0000-0000-0000-0000000000a4', 'Inativo', 'CINA', false, false);
select pg_temp.cor_como('anon', null, 'Visitante', 'CVIS', false, false);

-- Restrição de 1 a 30.
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla, cor) values ('Cor Zero', 'CZ0', 0)$sql$, '23514', null, 'cor 0 é recusada');
insert into _tap (linha) select throws_ok(
  $sql$insert into public.setores (nome, sigla, cor) values ('Cor Trinta e Um', 'C31', 31)$sql$, '23514', null,
  'cor 31 é recusada');
insert into _tap (linha) select lives_ok(
  $sql$insert into public.setores (nome, sigla, cor) values ('Cor Um', 'C01', 1), ('Cor Trinta', 'C30', 30)$sql$,
  'cores 1 e 30 são aceitas');

-- Primeira cor livre. Cada bloco começa liberando as cores 1 a 29 (todos os setores existentes ficam na 30).
update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor) values ('Livre A1', 'LA1', 1), ('Livre A2', 'LA2', 2);
insert into public.setores (nome, sigla) values ('Livre A3', 'LA3');
insert into _tap (linha) select is((select cor from public.setores where sigla = 'LA3'), 3,
  'com as cores 1 e 2 em uso, o setor novo recebe a 3');

update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor) values ('Livre B1', 'LB1', 1), ('Livre B3', 'LB3', 3);
insert into public.setores (nome, sigla) values ('Livre B2', 'LB2');
insert into _tap (linha) select is((select cor from public.setores where sigla = 'LB2'), 2,
  'com as cores 1 e 3 em uso, o setor novo recebe a 2');

update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor, ativo) values ('Inativo Cor 1', 'IC1', 1, false);
insert into public.setores (nome, sigla) values ('Depois do Inativo', 'DPI');
insert into _tap (linha) select is((select cor from public.setores where sigla = 'DPI'), 2,
  'o setor inativo continua ocupando a cor 1');

update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor)
  select 'Cobertura ' || n, 'COB' || n, n from generate_series(1, 29) as n;
insert into public.setores (nome, sigla) values ('Trinta e Um', 'T31');
insert into _tap (linha) select is((select cor from public.setores where sigla = 'T31'), 1,
  'com as 30 cores em uso, o setor novo recebe a 1');

update public.setores set cor = 30;
insert into public.setores (nome, sigla, cor) values ('Repetida 1', 'RP1', 5), ('Repetida 2', 'RP2', 5);
insert into _tap (linha) select is((select count(*)::int from public.setores where sigla in ('RP1', 'RP2') and cor = 5), 2,
  'a cor informada é respeitada mesmo repetida');

-- Eventos: trocar só a cor não cria evento; cor e nome juntos criam um evento sem `cor`.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into public.setores (nome, sigla, cor) values ('Setor do Evento', 'EVT', 4);
update public.setores set cor = 6 where sigla = 'EVT';
reset role;
insert into _tap (linha) select is((select count(*)::int from public.eventos e
  join public.setores s on e.entidade_ref = s.id::text where e.entidade = 'setor' and s.sigla = 'EVT'), 1,
  'trocar só a cor não cria evento (fica só o de criar)');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
update public.setores set cor = 7, nome = 'Setor do Evento Novo' where sigla = 'EVT';
reset role;
insert into _tap (linha) select is((select count(*)::int from public.eventos e
  join public.setores s on e.entidade_ref = s.id::text where e.entidade = 'setor' and s.sigla = 'EVT'), 2,
  'cor e nome juntos criam um evento');
insert into _tap (linha) select ok(not jsonb_exists((select e.detalhes -> 'antes' from public.eventos e
  join public.setores s on e.entidade_ref = s.id::text where e.entidade = 'setor' and s.sigla = 'EVT'
  order by e.id desc limit 1), 'cor'), 'o "antes" do evento não traz a cor');
insert into _tap (linha) select ok(not jsonb_exists((select e.detalhes -> 'depois' from public.eventos e
  join public.setores s on e.entidade_ref = s.id::text where e.entidade = 'setor' and s.sigla = 'EVT'
  order by e.id desc limit 1), 'cor'), 'o "depois" do evento não traz a cor');

-- Preenchimento da migração: mesmo comando, siglas que ordenam primeiro ('000...' antes das letras).
insert into public.setores (nome, sigla, cor) values ('Mig A', '000A', 30), ('Mig B', '000B', 30), ('Mig C', '000C', 30);
update public.setores s set cor = ((o.posicao - 1) % 30) + 1
  from (select id, row_number() over (order by sigla) as posicao from public.setores) o where o.id = s.id;
insert into _tap (linha) select is((select array_agg(cor order by sigla) from public.setores where sigla like '000%'),
  array[1, 2, 3], 'o preenchimento dá 1, 2, 3 pela ordem da sigla');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

- [ ] **Passo 2: rodar e ver falhar.** `npx supabase start` (descarte a saída), depois `npx supabase test db`. Esperado: o 66 falha porque a coluna `cor` não existe (erro `column "cor" ... does not exist`); os demais (`11_setores`, `00`, `10`) seguem passando.
- [ ] **Passo 3: comitar** o teste (o pre-commit roda lint/testes de unidade; o teste de banco falho é esperado antes da migração): `git add supabase/tests/66_cor_do_setor.test.sql && git commit -m "visual-do-cartao 02: teste de banco da cor do setor (falha antes da migração)"`.

### Tarefa 2: Migração

**Arquivos:** criar `supabase/migrations/<ts>_cor_do_setor.sql` com `npx supabase migration new cor_do_setor`.

- [ ] **Passo 1: escrever a migração.** Os gatilhos de evento de `setores` já montam o antes/depois com campos nomeados (`sigla`, `nome`, `observacoes`, `ativo`), então a `cor` já fica fora do histórico e a gravação só de cor (antes = depois) já não vira evento; não é preciso reescrever esses gatilhos (o teste prova).

```sql
-- Cor do setor (visual-do-cartao, ticket 02, ADR 0030): número da cor numa paleta fixa de 30 cores.
-- Os tons ficam na tela (src/cadastros/corDoSetor.ts); o banco só conhece o número.

alter table public.setores add column cor integer;

-- Setores existentes: pela ordem alfabética da sigla (1, 2, 3...; acima de 30 recomeça em 1).
-- A cor não faz parte do antes/depois dos eventos de setor, então o preenchimento não gera eventos.
update public.setores s set cor = ((o.posicao - 1) % 30) + 1
  from (select id, row_number() over (order by sigla) as posicao from public.setores) o where o.id = s.id;

alter table public.setores alter column cor set not null;
alter table public.setores add constraint setores_cor_faixa check (cor between 1 and 30);

-- Setor novo sem cor recebe a primeira que nenhum setor (ativo ou inativo) usa; com as 30 em uso, a 1.
-- Duas criações simultâneas podem receber a mesma cor: aceito, a repetição é permitida.
create function private.atribuir_cor_do_setor() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.cor is null then
    new.cor := coalesce((select n from generate_series(1, 30) as n
      where not exists (select 1 from public.setores s where s.cor = n) order by n limit 1), 1);
  end if;
  return new;
end $$;

revoke execute on function private.atribuir_cor_do_setor() from public, anon, authenticated;

create trigger atribuir_cor_do_setor before insert on public.setores
  for each row execute function private.atribuir_cor_do_setor();

-- Quem já informa os outros campos informa e altera a cor (a RLS decide quem).
grant insert (cor) on public.setores to authenticated;
grant update (cor) on public.setores to authenticated;
```

- [ ] **Passo 2: rodar.** `npm run db:reset` e `npx supabase test db`. Esperado: 66 com 29 de 29 `ok`; `11_setores`, `00_rls_ligada`, `10_privilegios_padrao` e os demais arquivos sem `not ok`. Se `RLS` impedir o gatilho de ver os setores de outros (não deve: o ativo lê todos), investigar antes de mexer.
- [ ] **Passo 3: tipos.** `npx supabase gen types typescript --local > src/types/database.ts` (usar o mesmo recurso de `scripts/gerar-tipos.mjs`, trocando o alvo por `--local`; confira que o arquivo começa com `export type` e que `setores.Row` ganhou `cor: number`, `Insert` com `cor?: number`, `Update` com `cor?: number`). Atenção: `src/types/database.ts` aparece modificado só por fim de linha (anotação antiga); mantenha o fim de linha que o arquivo já tem.
- [ ] **Passo 4: comitar** migração, teste e tipos juntos (regra: mesmo commit). `git add supabase/migrations supabase/tests src/types/database.ts && git commit -m "visual-do-cartao 02: coluna cor do setor, primeira cor livre e privilégios"`.

### Tarefa 3: Módulo puro da paleta

**Arquivos:** criar `src/cadastros/corDoSetor.ts` e `src/cadastros/corDoSetor.test.ts`.

- [ ] **Passo 1: teste que falha** (`corDoSetor.test.ts`):

```ts
import { describe, expect, test } from 'vitest'
import { TODAS_AS_CORES, corDoSetor, estiloDaCor } from './corDoSetor'

const TEXTO = '#1E2433'

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (maior + 0.05) / (menor + 0.05)
}

describe('corDoSetor', () => {
  test('a paleta tem 30 cores distintas, numeradas de 1 a 30', () => {
    expect(TODAS_AS_CORES.map((cor) => cor.numero)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
    expect(new Set(TODAS_AS_CORES.map((cor) => cor.claro)).size).toBe(30)
    expect(new Set(TODAS_AS_CORES.map((cor) => cor.nome)).size).toBe(30)
  })

  test.each([0, 31, -1, 1.5, Number.NaN])('o número %s cai na cor 1', (numero) => {
    expect(corDoSetor(numero).numero).toBe(1)
  })

  test('o tom escuro é cada canal do claro vezes 0,88, arredondado', () => {
    expect(corDoSetor(1)).toMatchObject({ nome: 'coral claro', claro: '#F8C4C4', escuro: '#DAACAC' })
  })

  test.each(TODAS_AS_CORES.map((cor) => [cor.numero, cor.nome, cor.claro, cor.escuro]))(
    'cor %i (%s): o texto escuro passa de 4,5:1 nas duas pontas', (_numero, _nome, claro, escuro) => {
      expect(contraste(TEXTO, claro as string)).toBeGreaterThanOrEqual(4.5)
      expect(contraste(TEXTO, escuro as string)).toBeGreaterThanOrEqual(4.5)
    })

  test('o estilo leva os dois tons em variáveis CSS', () => {
    expect(estiloDaCor(13)).toEqual({ '--cor-claro': '#C4D9F8', '--cor-escuro': corDoSetor(13).escuro })
  })
})
```

- [ ] **Passo 2:** `npx vitest run src/cadastros/corDoSetor.test.ts` → falha (módulo inexistente).
- [ ] **Passo 3: implementar** `corDoSetor.ts` (tons de `.scratch/identidade-visual.md`, ordem de distribuição):

```ts
export const TOTAL_DE_CORES = 30
const FATOR_DO_TOM_ESCURO = 0.88

export type CorDoSetor = { numero: number; nome: string; claro: string; escuro: string }

// A ordem é a de distribuição da identidade visual (vizinhas bem diferentes); o banco guarda só o número.
const TONS: readonly (readonly [string, string])[] = [
  ['coral claro', '#F8C4C4'], ['água claro', '#C4F8ED'], ['rosa claro', '#F8C4D9'], ['menta claro', '#C4F8D9'],
  ['orquídea claro', '#F8C4ED'], ['verde claro', '#C4F8C4'], ['lilás claro', '#EDC4F8'], ['pistache claro', '#D9F8C4'],
  ['lavanda claro', '#D9C4F8'], ['limão claro', '#EDF8C4'], ['pervinca claro', '#C4C4F8'], ['areia claro', '#F8EDC4'],
  ['azul claro', '#C4D9F8'], ['pêssego claro', '#F8D9C4'], ['céu claro', '#C4EDF8'], ['limão médio', '#DAE7A6'],
  ['pervinca médio', '#A6A6E7'], ['areia médio', '#E7DAA6'], ['azul médio', '#A6C0E7'], ['pêssego médio', '#E7C0A6'],
  ['céu médio', '#A6DAE7'], ['coral médio', '#E7A6A6'], ['água médio', '#A6E7DA'], ['rosa médio', '#E7A6C0'],
  ['menta médio', '#A6E7C0'], ['orquídea médio', '#E7A6DA'], ['verde médio', '#A6E7A6'], ['lilás médio', '#DAA6E7'],
  ['pistache médio', '#C0E7A6'], ['lavanda médio', '#C0A6E7'],
]

// Regra fixa do tom escuro: cada canal vezes 0,88. Se um contraste cair abaixo de 4,5:1, o teste acusa e o fator sobe.
function escurecer(hex: string): string {
  const canais = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * FATOR_DO_TOM_ESCURO))
  return `#${canais.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

export const TODAS_AS_CORES: readonly CorDoSetor[] = TONS.map(([nome, claro], i) => ({
  numero: i + 1, nome, claro, escuro: escurecer(claro),
}))

/** Número fora de 1 a 30 (ou não inteiro) cai na cor 1, para a tela nunca ficar sem tom. */
export function corDoSetor(numero: number): CorDoSetor {
  return TODAS_AS_CORES[Number.isInteger(numero) && numero >= 1 && numero <= TOTAL_DE_CORES ? numero - 1 : 0]
}

/** Variáveis CSS que o selo e o quadradinho usam para o degradê do tom claro ao escuro. */
export function estiloDaCor(numero: number): Record<'--cor-claro' | '--cor-escuro', string> {
  const { claro, escuro } = corDoSetor(numero)
  return { '--cor-claro': claro, '--cor-escuro': escuro }
}
```

- [ ] **Passo 4:** `npx vitest run src/cadastros/corDoSetor.test.ts` → passa (30 + demais). Se algum contraste falhar, reduza o escurecimento (fator 0,92) e ajuste o valor esperado do teste do tom escuro.
- [ ] **Passo 5: comitar** (`git add src/cadastros/corDoSetor*`; mensagem "visual-do-cartao 02: paleta de 30 cores do setor").

### Tarefa 4: Selo do setor e quadradinho da opção

**Arquivos:** criar `src/components/SeloDoSetor.tsx`, `SeloDoSetor.css`, `SeloDoSetor.test.tsx`; modificar `src/components/OpcaoDaCaixa.tsx` (+ `OpcaoDaCaixa.test.tsx`) e `src/styles/caixas.css`.

- [ ] **Passo 1: testes que falham.** `SeloDoSetor.test.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { SeloDoSetor } from './SeloDoSetor'

afterEach(cleanup)

test('o selo mostra a sigla e carrega os dois tons da cor, sem acrescentar nome acessível', () => {
  render(<SeloDoSetor sigla="TSA" cor={13} />)
  const selo = screen.getByText('TSA')
  expect(selo.getAttribute('aria-label')).toBeNull()
  expect(selo.textContent).toBe('TSA')
  expect(selo.style.getPropertyValue('--cor-claro')).toBe('#C4D9F8')
  expect(selo.style.getPropertyValue('--cor-escuro')).not.toBe('')
})

test('a variante faixa troca só a classe', () => {
  render(<SeloDoSetor sigla="TSA" cor={1} variante="faixa" />)
  expect(screen.getByText('TSA').className).toContain('selo-do-setor-faixa')
})
```

Em `OpcaoDaCaixa.test.tsx`, acrescente (siga o estilo do arquivo; a opção vai dentro de um `<select>`):

```tsx
test('corDoSetor põe o quadradinho em degradê e não entra no nome da opção', () => {
  render(<select><OpcaoDaCaixa valor="s1" rotulo="TSA — Setor Teste A" corDoSetor={13} /></select>)
  const opcao = screen.getByRole('option', { name: 'TSA — Setor Teste A' })
  const marca = opcao.querySelector('.opcao-cor') as HTMLElement
  expect(marca.getAttribute('aria-hidden')).toBe('true')
  expect(marca.style.getPropertyValue('--cor-claro')).toBe('#C4D9F8')
})
```
(importe `render`, `screen` etc. como o arquivo já faz.)

- [ ] **Passo 2:** `npx vitest run src/components/SeloDoSetor.test.tsx src/components/OpcaoDaCaixa.test.tsx` → falha.
- [ ] **Passo 3: implementar.** `SeloDoSetor.tsx`:

```tsx
import type { CSSProperties } from 'react'
import { estiloDaCor } from '../cadastros/corDoSetor'
import './SeloDoSetor.css'

type SeloDoSetorProps = {
  sigla: string
  /** Número da cor do setor (1 a 30). */
  cor: number
  variante?: 'pequeno' | 'faixa'
}

/** A sigla em texto escuro sobre a cor do setor, em degradê. A sigla é o único texto: o selo não acrescenta nome acessível. */
export function SeloDoSetor({ sigla, cor, variante = 'pequeno' }: SeloDoSetorProps) {
  return <span className={`selo-do-setor selo-do-setor-${variante}`} style={estiloDaCor(cor) as CSSProperties}>{sigla}</span>
}
```

`SeloDoSetor.css`:

```css
.selo-do-setor {
  background: linear-gradient(90deg, var(--cor-claro), var(--cor-escuro));
  color: var(--texto);
  font-weight: 600;
  /* Sem isto, o modo de contraste forçado apaga a cor da identidade do setor. */
  forced-color-adjust: none;
}

.selo-do-setor-pequeno {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--canto);
}

.selo-do-setor-faixa {
  display: block;
  padding: 6px 12px;
  text-align: center;
  font-size: 1.125rem;
}
```

`OpcaoDaCaixa.tsx`: importe `type CSSProperties`, `estiloDaCor`; acrescente à prop type `/** Número da cor do setor: quadradinho em degradê, o mesmo do selo. */ corDoSetor?: number`, desestruture, e depois da linha do `cor`:

```tsx
{corDoSetor !== undefined && (
  <span className="opcao-marca opcao-cor opcao-cor-do-setor" aria-hidden="true"
    style={estiloDaCor(corDoSetor) as CSSProperties} />
)}
```
Em `caixas.css`, depois de `.opcao-cor { ... }`:

```css
.opcao-cor-do-setor {
  background: linear-gradient(90deg, var(--cor-claro), var(--cor-escuro));
}
```
(Desvio do ticket, a registrar no `desvios.md`: o ticket diz "`OpcaoDaCaixa` com `cor`"; usamos a prop nova `corDoSetor` com o número porque o degradê em `background` inline pode ser descartado pelo jsdom e as variáveis CSS não.)

- [ ] **Passo 4:** os dois testes passam. `npm run lint`.
- [ ] **Passo 5: comitar** ("visual-do-cartao 02: selo do setor e quadradinho da opção").

### Tarefa 5: Módulo de cadastros lê a cor; a falsa imita a primeira livre

**Arquivos:** `src/cadastros/tipos.ts`, `cadastrosSupabase.ts`, `macroprocessosSupabase.ts`, `CadastrosFalso.ts` e os testes `cadastrosSupabase.test.ts`, `macroprocessosSupabase.test.ts`; fixtures tipadas `Setor[]` em `App.editarSetor.test.tsx`, `App.excluirSetor.test.tsx`, `App.setores.test.tsx`, `App.setoresInativos.test.tsx`.

- [ ] **Passo 1: testes que falham.**
  - `cadastrosSupabase.test.ts`: no teste "lista os setores…" acrescente `cor: 3` em `linha`/`outra` e troque a string esperada para `'id, sigla, nome, observacoes, ativo, cor, setores_envolvidos(count)'`; nos testes de `lerSetor` acrescente `cor` na linha devolvida e na esperada, e a coluna na string de colunas esperada (`'id, sigla, nome, observacoes, ativo, cor, setores_envolvidos(observacao, macroprocessos(id, codigo, nome))'`). No teste "criar envia…" acrescente `expect((cliente.pedidos[0].valores as object)).not.toHaveProperty('cor')`.
  - `macroprocessosSupabase.test.ts`: os vínculos embutidos passam a trazer `cor` em `setores(...)`; o esperado de `setoresEnvolvidos` traz `cor`; coluna `setores(id, sigla, nome, ativo, cor)`.
  - Novo teste em `CadastrosFalso` (acrescente em `src/cadastros/CadastrosFalso.test.ts` se existir; senão crie): criar setor com as cores 1 e 2 em uso grava 3; com 1 e 3, grava 2; com as 30 em uso, 1; setor sem `cor` na fixture aparece lido com a cor 1.
- [ ] **Passo 2:** `npx vitest run src/cadastros` → falha.
- [ ] **Passo 3: implementar.**
  - `tipos.ts`: `Setor` ganha `cor: number` (comentário: "posição na paleta de 30 cores, de 1 a 30"); `SetorEnvolvido` ganha `cor: number`. `DadosDoSetor` não muda.
  - `cadastrosSupabase.ts`: acrescentar `cor` às duas strings de `select` (`listarSetores` e `lerSetor`), depois de `ativo`. Rode `grep -rn "from('setores')" src --include=*.ts` e confira que nenhum outro leitor monta um `Setor`.
  - `macroprocessosSupabase.ts`: tipo `VinculoLido` (`setores: { id; sigla; nome; ativo; cor: number } | null`), a string `setores(id, sigla, nome, ativo, cor)` e o mapeamento `cor: setores.cor`.
  - `CadastrosFalso.ts`: exportar `export type SetorDoTeste = Omit<Setor, 'cor'> & { cor?: number }`; `setores: SetorDoTeste[] = []`; método `private comCor(setor: SetorDoTeste): Setor { return { ...setor, cor: setor.cor ?? 1 } }` aplicado em `listarSetores`, `lerSetor` e no mapeamento de `lerMacroprocesso` (`cor: this.comCor(setor).cor`); `criarSetor` passa a gravar `cor: this.primeiraCorLivre()`:

```ts
  /** Imita o gatilho do banco: a menor cor de 1 a 30 que nenhum setor tem (ativo ou inativo); com as 30 em uso, a 1. */
  private primeiraCorLivre(): number {
    const emUso = new Set(this.setores.map((setor) => setor.cor ?? 1))
    return Array.from({ length: 30 }, (_, i) => i + 1).find((cor) => !emUso.has(cor)) ?? 1
  }
```
  `acharSetor` e `trocarSetor` passam a usar `SetorDoTeste`.
  - Nas 4 fixtures `const SETORES: Setor[]`: trocar a anotação por `SetorDoTeste[]` (import de `./cadastros/CadastrosFalso`; remova o import de `Setor` que ficar sem uso).
- [ ] **Passo 4:** `npx vitest run src/cadastros`, depois `npm run typecheck` (aponta qualquer outro lugar que construa `Setor`/`SetorEnvolvido`; ajuste só o tipo, sem lógica) e `npm test`. Esperado: tudo verde.
- [ ] **Passo 5: comitar** ("visual-do-cartao 02: cadastros leem a cor do setor").

### Tarefa 6: Telas com o selo e o quadradinho

**Arquivos:** modificar `ListaDeSetores.tsx`, `SetorSomenteLeitura.tsx`, `SetorEditavel.tsx`, `LinhaDeSetorEnvolvido.tsx`, `SetoresEnvolvidos.tsx`, `PorSetor.tsx`; criar `src/App.corDoSetor.test.tsx`.

- [ ] **Passo 1: escrever os testes de tela** (`App.corDoSetor.test.tsx`), com as montagens iguais às de `App.setoresEnvolvidos.test.tsx` (mesmos imports de `App`, fakes e `AcessoFalso`, `beforeEach` com hash e `afterEach` com `cleanup`). Casos:

```tsx
// Setores TSA (cor 13), TSB (cor 1), TSX (inativo, cor 22); macro m1 com TSA e TSX.
function corClaraDe(elemento: HTMLElement) {
  return elemento.style.getPropertyValue('--cor-claro')
}

test('a lista de setores mostra a sigla num selo com a cor de cada setor', async () => {
  window.location.hash = '#/setores'
  montar()
  const botao = await screen.findByRole('button', { name: 'TSA' })
  expect(corClaraDe(within(botao).getByText('TSA'))).toBe('#C4D9F8')
})

test('o setor novo recebe a primeira cor livre e aparece com ela na lista', async () => {
  window.location.hash = '#/setores'
  const cadastros = montar() // TSA=13, TSB=1, TSX=22 em uso
  fireEvent.click(await screen.findByRole('button', { name: 'Novo setor' }))
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Núcleo Fictício' } })
  fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'NFT' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  const botao = await screen.findByRole('button', { name: 'NFT' })
  expect(cadastros.setores.at(-1)?.cor).toBe(2)
  expect(corClaraDe(within(botao).getByText('NFT'))).toBe('#C4F8ED')
})

test.each<Perfil>(['integrante_ep', 'consulta'])('o setor aberto mostra o selo da sigla para %s', async (perfil) => {
  window.location.hash = '#/setores'
  montar(perfil)
  fireEvent.click(await screen.findByRole('button', { name: 'TSA' }))
  const selos = (await screen.findAllByText('TSA')).filter((el) => el.classList.contains('selo-do-setor'))
  expect(selos.length).toBeGreaterThan(0)
  expect(corClaraDe(selos[0])).toBe('#C4D9F8')
})

test('os setores envolvidos mostram o selo, inclusive o do inativo, e o nome da célula segue sendo a sigla', async () => {
  const secao = await abrirSecao() // helper do arquivo, como em App.setoresEnvolvidos
  expect(corClaraDe(within(secao.getByRole('cell', { name: 'TSA' })).getByText('TSA'))).toBe('#C4D9F8')
  const inativo = linhaDe(secao, 'TSX')
  expect(corClaraDe(inativo.getByText('TSX'))).toBe('#E7A6A6')
  expect(inativo.getByText('Inativo')).toBeTruthy()
})

test('o [Pôr setor] mostra o quadradinho da cor sem pôr a cor no nome da opção', async () => {
  const secao = await abrirSecao()
  const opcao = within(secao.getByRole('combobox', { name: 'Setor a pôr' })).getByRole('option', { name: 'TSB — Setor Teste B' })
  expect(corClaraDe(opcao.querySelector('.opcao-cor-do-setor') as HTMLElement)).toBe('#F8C4C4')
})

test('o histórico dos cadastros não mostra a cor', async () => {
  window.location.hash = '#/setores/historico'
  const cadastros = montar()
  cadastros.historico = [{ id: 1, ocorridoEm: '2026-10-27T15:00:00Z', autor: 'Pessoa Fictícia', acao: 'editar',
    entidade: 'setor', entidadeRef: 's1',
    antes: { sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true },
    depois: { sigla: 'TSA', nome: 'Setor Teste Novo', observacoes: null, ativo: true } }]
  await screen.findByRole('combobox', { name: 'Item' })
  expect(screen.getAllByRole('listitem')[0].textContent).not.toMatch(/cor/i)
})
```
  (Se `montar` do novo arquivo precisar receber o `CadastrosFalso` já preparado, crie `cadastrosComSetores()` com os três setores `{ id, sigla, nome, observacoes: null, ativo, cor }`, macros e vínculos como no arquivo de setores envolvidos.)

- [ ] **Passo 2:** `npx vitest run src/App.corDoSetor.test.tsx` → falha (nenhum selo ainda).
- [ ] **Passo 3: implementar.**
  - `ListaDeSetores.tsx`: em `LinhaDeSetor`, o botão passa a `<button type="button" className="cadastros-abrir"><SeloDoSetor sigla={setor.sigla} cor={setor.cor} /></button>` (nome acessível continua a sigla).
  - `SetorSomenteLeitura.tsx`: `<dt>Sigla</dt><dd><SeloDoSetor sigla={setor.sigla} cor={setor.cor} /></dd>`.
  - `SetorEditavel.tsx`: acima do formulário, dentro de `cadastros-secao`, `<SeloDoSetor sigla={setor.sigla} cor={setor.cor} />`.
  - `LinhaDeSetorEnvolvido.tsx` e `LinhaEmLeitura` (em `SetoresEnvolvidos.tsx`): `<td><SeloDoSetor sigla={setor.sigla} cor={setor.cor} /></td>`.
  - `PorSetor.tsx`: importar `OpcaoDaCaixa` e `BotaoDaCaixa`; no `<select>`, primeiro filho `<BotaoDaCaixa />`; a opção "Escolha um setor" fica como está; cada setor vira `<OpcaoDaCaixa key={setor.id} valor={setor.id} rotulo={`${setor.sigla} — ${setor.nome}`} corDoSetor={setor.cor} />`.
  - Importes do `SeloDoSetor` em cada arquivo (`../SeloDoSetor`).
- [ ] **Passo 4:** `npx vitest run src/App.corDoSetor.test.tsx` → passa; depois `npm test` completo. Testes antigos que usavam `getByText('TSA')` e agora acham dois elementos (selo + título) devem ser ajustados trocando para uma consulta que identifique o elemento certo (`getByRole`, ou `getAllByText(...)[0]`), sem enfraquecer a asserção.
- [ ] **Passo 5:** `npm run lint`, `npm run typecheck`, `npm run test:coverage` (≥ 70%). Comitar ("visual-do-cartao 02: selo do setor nos cadastros e quadradinho no Pôr setor").

### Tarefa 7: Conferência visual `[visual]`

- [ ] Subir a vitrine/dev server com `preview_start` (dev server do `.claude/launch.json`) e olhar, em 1366×768: lista de setores, setor aberto, setores envolvidos (com inativo), caixa [Pôr setor] aberta (Chrome/Edge). Critério do ticket: o selo da sigla legível nas 30 cores e o quadradinho do [Pôr setor] igual ao do macroprocesso. O login real não está disponível: se a tela depender dele, registrar "presumido, conferir com o login real" em `.scratch/visual-do-cartao/desvios.md` e no relatório (honestidade: não afirmar que foi visto).
- [ ] Ajustes só de CSS ficam em `SeloDoSetor.css`/`caixas.css`; comitar se houver.

### Tarefa 8: Banco remoto de desenvolvimento e conferência final

- [ ] `git push -u origin visual-do-cartao-02` (autorizado). Disparar "Testes de banco" na branch e ler o resultado: 66 com 29 de 29, `11`, `00`, `10` verdes e todos os arquivos sem `not ok`. Esperado antes da migração no remoto: o 66 só passa depois dela; por isso:
- [ ] Disparar o workflow "Migrar banco de desenvolvimento" na branch, com a migração `<ts>_cor_do_setor` (autorizado; ele recusa outro projeto e avisa se já foi aplicada). Depois, "Testes de banco" de novo. Conferir antes: `supabase/AMBIENTES.md` (vínculo atual = desenvolvimento).
- [ ] `npm run db:types` contra o remoto (alvo conferido) e verificar que `src/types/database.ts` não muda além de fim de linha; se mudar, comitar.
- [ ] Acrescentar a migração à lista de `supabase/AMBIENTES.md` (formato das linhas anteriores) e registrar o desvio de `OpcaoDaCaixa` (`corDoSetor`) em `.scratch/visual-do-cartao/desvios.md` (entrada nova, datada).

### Tarefa 9: Fechamento (comando `/executar-complexo`, passo 4 em diante)

- [ ] Marcar as caixas do ticket 02 que foram atendidas (as `[visual]` só se foram vistas).
- [ ] Juntar à `main` (`git switch main`, merge pela opção do `finishing-a-development-branch`), `git branch -d visual-do-cartao-02`, `git push origin main`; conferir o "Testes de banco" na `main`.
- [ ] Acrescentar ao fim do ticket 02 a linha `Concluído em 2026-10-27 (commit <hash do último commit do ticket>)`; atualizar `.scratch/proximo-passo.md` (próximo: ticket 03 pelo `/executar-simples` e 04 pelo `/executar-complexo`; depois `/polir` e `/ship`, obrigatório pela migração); comitar e enviar.
- [ ] Ler o bloco de `/executar-complexo` em `.claude/regras/nao-testados.md` e anotar em `.scratch/melhorias-protocolo.md` os itens que aconteceram (sem concluir se funcionaram).

## Auto-revisão contra o ticket

| Item do ticket | Tarefa |
|---|---|
| Teste pgTAP antes da migração (células + regras; `11`, `00`, `10` seguem verdes) | 1, 2 |
| Migração não destrutiva, Docker local, workflow de desenvolvimento, tipos | 2, 8 |
| Módulo puro da paleta + testes (30 distintas, fora da faixa → 1, contraste 4,5:1) | 3 |
| Selo compartilhado (pequeno e faixa), sem nada no nome acessível | 4 |
| Módulo de cadastros lê `cor`, falsa imita a primeira livre, testes de `cadastrosSupabase`/`macroprocessosSupabase` | 5 |
| Selos (lista, setor aberto, envolvidos inclusive inativos), quadradinho do [Pôr setor], histórico sem `cor` | 6 |
| `npm test` verde; testes de banco no Docker e no "Testes de banco" | 5, 6, 8 |
| `[visual]` selo legível nas 30 cores e quadradinho igual ao do macroprocesso | 7 |

Decisões a confirmar com o usuário (padrão conservador já aplicado): (1) a prop `corDoSetor` em `OpcaoDaCaixa` no lugar de `cor`; (2) o selo no setor aberto editável fica acima do formulário.
