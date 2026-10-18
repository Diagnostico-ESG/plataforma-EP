# Ticket 11 de processos-etapas (Responsáveis do setor saem) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** os responsáveis do setor saem da tela do setor, do módulo de processos e do banco; os eventos antigos deles ficam no histórico numa linha simples.

**Architecture:** uma migração nova apaga `responsaveis_do_setor` (a tabela leva junto políticas, índice e gatilhos), as duas funções dos gatilhos, e recria `private.registrar_exclusao_do_setor` sem a lista de responsáveis. A política "eventos: perfil ativo lê os responsáveis do setor" fica, para os eventos antigos continuarem legíveis. Na tela, o texto dos recursos retirados vira um mapa por entidade (`reuniao` e `responsavel_do_setor`; o ticket 12 acrescenta a etapa do setor), e as quatro telas, o acesso Supabase e a validação dos responsáveis são apagados.

**Tech Stack:** React + TypeScript, Vitest + Testing Library; pgTAP pelo GitHub Actions ("Testes de banco"); migração pelo workflow "Migrar banco de desenvolvimento".

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 45 e 46; "Interface", "Histórico", registros de recursos retirados; "Migração de 2026-10-18", passo 2; "Decisões de teste", Simplificação) · **Ticket:** `.scratch/processos-etapas/issues/11-responsaveis-do-setor-saem.md`. Os critérios são citados como "critério N", na ordem do ticket: 1 migração, 2 pgTAP, 3 tela do setor, 4 histórico, 5 módulo, 6 testes de tela, 7 `AMBIENTES.md`. Porquê: ADR 0013.

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui:
  - estrutura muda só por migração nova, criada com `npx supabase migration new`; a migração `20261013211710_responsaveis_do_setor` fica como está;
  - o teste vem antes da migração;
  - nenhum `security definer` novo fora de `private`; a função recriada mantém `search_path = ''`, nomes qualificados e o `revoke execute` de `public, anon, authenticated`;
  - a RLS dos eventos decide quem lê (a política de leitura dos eventos de responsável fica).
- Alvo conferido: a linha "vínculo atual" de `supabase/AMBIENTES.md` e o `supabase/.temp/project-ref` são os dois `yclkzyoebpsxmgpbcbus` (desenvolvimento). O banco só é tocado pelos dois workflows, na branch, e pelo `db:types` (leitura).
- Funções de lógica com 4 a 20 linhas, arquivos até 300 linhas e complexidade até 10. Tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação.
- Só dados inventados.
- TDD: um teste que falha por erro de digitação não conta como o "vermelho".
- O pre-commit roda `typecheck` e a bateria inteira (cerca de 1 minuto). Cada commit precisa compilar sozinho (a pasta de trabalho inteira precisa estar coerente com o que vai no commit).

## Decisões do plano

- **A tabela sai com `drop table`**, que não dispara os gatilhos de linha: nenhum evento novo nasce, e não é preciso desligar os gatilhos (`session_replication_role`).
- **Exclusão do setor:** o evento deixa de levar a chave `responsaveis`. Os eventos antigos que a têm continuam mostrando "Responsáveis: …" (o rótulo e a lista em `historicoDosCadastros.ts` ficam para eles). Os testes 11 e 13 perdem a chave na expectativa; com isso eles também ficam vermelhos antes da migração.
- **Eventos antigos de responsável no histórico, no molde dos de reunião (ticket 05 de reunioes):** linha simples "Registro de responsável do setor (recurso retirado da plataforma)", com ação, data e autor, sem "Antes:" e "Depois:" (o detalhe trazia nome, e-mail e cargo de pessoas, que a plataforma deixa de mostrar), e fora da lista do filtro "Item". Escolhido um setor no filtro, o evento continua aparecendo, porque a referência `setorId:responsavelId` o cita. Vai para o `desvios.md`.
- **Mapa de recursos retirados:** `TEXTO_DA_REUNIAO_RETIRADA` vira `TEXTO_DO_RECURSO_RETIRADO` (por entidade) e a função `ehRecursoRetirado(entidade)`, usada no nome do item, no filtro e na `ListaDoHistorico`. É a segunda repetição; o ticket 12 só acrescenta uma linha ao mapa.
- **Testes de tela:** `App.reunioesRetiradas.test.tsx` passa a `App.recursosRetirados.test.tsx` (`git mv`) e ganha os casos dos responsáveis; o ticket 12 acrescenta os da etapa do setor no mesmo arquivo.
- **Tipos regenerados na Tarefa 4, junto com a retirada do código**, não no commit da migração: com os tipos novos, `responsaveisSupabase.ts` não compila e o pre-commit barraria. Mesmo desvio do ticket 05 de reunioes.
- **Ensaio da migração** antes de aplicá-la: cópia temporária do teste 33 com a migração dentro, apagada depois.

## Estrutura de arquivos

**Criar:**
- `supabase/tests/33_responsaveis_do_setor_saem.test.sql`
- `supabase/migrations/<timestamp>_responsaveis_do_setor_saem.sql`

**Modificar:**
- `supabase/tests/11_setores.test.sql` (linha 167), `supabase/tests/13_setores_envolvidos.test.sql` (linha 254)
- `src/cadastros/historicoDosCadastros.ts` (+ teste), `src/components/cadastros/ListaDoHistorico.tsx`
- `src/App.historicoDosCadastros.test.tsx` (o caso dos responsáveis sai, linhas 181-193)
- `src/App.reunioesRetiradas.test.tsx` → `src/App.recursosRetirados.test.tsx`
- `src/components/cadastros/SetorAberto.tsx`, `src/processos/tipos.ts`, `src/processos/ProcessosFalso.ts`, `src/processos/processosSupabase.ts`, `src/components/processos/Etapas.css`
- `src/types/database.ts` (regenerado), `supabase/AMBIENTES.md`

**Apagar:**
- `supabase/tests/16_responsaveis_do_setor.test.sql`
- `src/App.responsaveisDoSetor.test.tsx`
- `src/components/processos/ResponsaveisDoSetor.tsx`, `ResponsaveisEditaveis.tsx`, `FormularioDeResponsavel.tsx`, `TabelaDeResponsaveis.tsx`
- `src/processos/responsaveisSupabase.ts` (+ teste), `src/processos/validacaoDoResponsavel.ts` (+ teste)

## Tarefas

### Tarefa 1 — Branch, marco e testes de banco que falham (critério 2)

**Arquivos:** criar `supabase/tests/33_responsaveis_do_setor_saem.test.sql`; modificar 11 e 13; apagar 16.

- [ ] `git switch -c processos-etapas-11` a partir da `main` limpa; `git tag marco/2026-10-18-inicio-ticket-11-processos-etapas` e enviar o marco (`git push origin refs/tags/marco/2026-10-18-inicio-ticket-11-processos-etapas`). Conferir o alvo (os dois `yclkzyoebpsxmgpbcbus`).
- [ ] Escrever o 33 no molde do 32 (mesmo cabeçalho, `_tap`, usuários a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo, `finish()` e a exceção `RESULTADO DOS TESTES`). Preparação como dono do banco:

```sql
insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes) values
  (null, 'criar', 'responsavel_do_setor', 'setor-antigo-r1:responsavel-antigo-r1',
   '{"antes": null, "depois": {"setor_sigla": "TRA", "nome": "Pessoa Fictícia"}}');

create function pg_temp.eventos_antigos() returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade_ref = 'setor-antigo-r1:responsavel-antigo-r1'
$$;
grant execute on function pg_temp.eventos_antigos() to authenticated;
```

  Asserções (`plan(8)`):
  1. `hasnt_table('public', 'responsaveis_do_setor', ...)`;
  2. `hasnt_function('private', 'preparar_responsavel_do_setor', ...)`;
  3. `hasnt_function('private', 'registrar_evento_do_responsavel_do_setor', ...)`;
  4. a 6. administrador, integrante e Consulta leem o evento antigo (`is(pg_temp.eventos_antigos(), 1::bigint, ...)`), cada um com `set_config('request.jwt.claims', '{"sub":"…a1","role":"authenticated"}', true)` e `set local role authenticated`, como no 32;
  7. o inativo não lê (`0::bigint`);
  8. o visitante (`set local role anon`): `throws_ok($sql$select 1 from public.eventos where entidade = 'responsavel_do_setor'$sql$, '42501', null, ...)`.
- [ ] No 11 (linha 167) e no 13 (linha 254): tirar `"responsaveis": []` e `'responsaveis', jsonb_build_array()` da expectativa do evento de exclusão do setor (no 13, tirar também a vírgula que fica sobrando).
- [ ] `git rm supabase/tests/16_responsaveis_do_setor.test.sql`.
- [ ] Comitar ("Ticket 11 de processos-etapas: testes de banco da saída dos responsáveis do setor"), enviar a branch e disparar o "Testes de banco" na branch. Esperado: vermelho no 33 (a tabela e as funções existem, nas asserções 1 a 3), no 11 e no 13 (a chave `responsaveis` ainda é gravada); os demais verdes. Anotar o número da execução.

### Tarefa 2 — Migração, ensaio e aplicação (critérios 1 e 7)

**Arquivos:** criar `supabase/migrations/<timestamp>_responsaveis_do_setor_saem.sql`; modificar `supabase/AMBIENTES.md`.

- [ ] `npx supabase migration new responsaveis_do_setor_saem` e escrever:

```sql
-- Processos e etapas, ticket 11 (Simplificação, ADR 0013): os responsáveis do setor saem da plataforma.
-- A tabela leva junto as políticas, o índice e os gatilhos; drop table não dispara os gatilhos de linha, então nenhum
-- evento nasce. A política "eventos: perfil ativo lê os responsáveis do setor" fica: os eventos antigos continuam
-- legíveis por todo perfil ativo.

-- Excluir um setor deixa de listar os responsáveis (versão anterior: 20261013211710_responsaveis_do_setor).
create or replace function private.registrar_exclusao_do_setor() returns trigger
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

revoke execute on function private.registrar_exclusao_do_setor() from public, anon, authenticated;

drop table public.responsaveis_do_setor;
drop function private.preparar_responsavel_do_setor(), private.registrar_evento_do_responsavel_do_setor();
```

  Antes de colar, conferir em `20261013150735_setores_envolvidos.sql` se a versão anterior tinha mais alguma coisa (o corpo acima é o da migração dos responsáveis, sem as duas linhas deles).
- [ ] Ensaiar: criar `supabase/tests/33b_ensaio_responsaveis.test.sql`, cópia do 33 com o corpo da migração logo depois do `begin` e antes do `plan`; comitar, enviar e disparar o "Testes de banco". Esperado: 33b verde, 33, 11 e 13 ainda vermelhos. Apagar o 33b e comitar a remoção. Se o ensaio falhar, corrigir e repetir; na terceira falha, parar (regra de parada).
- [ ] Comitar a migração (sem os tipos) e enviar. Disparar o "Migrar banco de desenvolvimento" na branch, com `migracao` igual ao nome do arquivo **sem a pasta**, e ler o resultado. Depois, o "Testes de banco" na branch. Esperado: todos verdes, o 33 com 8 de 8.
- [ ] Registrar em `supabase/AMBIENTES.md` a linha da migração, no formato das anteriores (data, ticket, testes vermelhos antes e verdes depois com os números das execuções, o ensaio e o workflow). Comitar.

### Tarefa 3 — Linha simples dos responsáveis no histórico (critério 4)

**Arquivos:** `src/cadastros/historicoDosCadastros.ts` (+ teste), `src/components/cadastros/ListaDoHistorico.tsx`, `src/App.historicoDosCadastros.test.tsx`, `src/App.reunioesRetiradas.test.tsx` → `src/App.recursosRetirados.test.tsx`.

**Interfaces:**
- Produz: `export function ehRecursoRetirado(entidade: string): boolean` em `historicoDosCadastros.ts` (o ticket 12 acrescenta `andamento` sem processo de outro jeito, mas usa o mesmo mapa).

- [ ] `git mv src/App.reunioesRetiradas.test.tsx src/App.recursosRetirados.test.tsx`; trocar o comentário do topo por "Recursos que saíram da plataforma (ADR 0013): a área Reuniões (reunioes, ticket 05) e os responsáveis do setor (processos-etapas, ticket 11)."
- [ ] Testes que falham:
  - em `App.recursosRetirados.test.tsx`, um caso no molde do da reunião:

```tsx
const RESPONSAVEL_ANTIGO: EventoDoCadastro = {
  id: 10, ocorridoEm: '2026-10-13T16:00:00Z', autor: 'Pessoa Fictícia', acao: 'criar', entidade: 'responsavel_do_setor',
  entidadeRef: 's1:r1', antes: null, depois: { setor_id: 's1', setor_sigla: 'TSA', nome: 'Ana Teste', email: null, cargo: 'Chefe' },
}

test('no histórico geral, o registro antigo de responsável do setor aparece numa linha simples, fora do filtro', async () => {
  window.location.hash = '#/setores/historico'
  montarNosCadastros({ ajustarCadastros: (cadastros) => { cadastros.historico = [RESPONSAVEL_ANTIGO] } })
  const filtro = await screen.findByRole('combobox', { name: 'Item' })
  const [item] = screen.getAllByRole('listitem')
  expect(item.textContent).toContain('Criou Registro de responsável do setor (recurso retirado da plataforma)')
  expect(within(item).getByText('Pessoa Fictícia')).toBeTruthy()
  expect(item.textContent).toMatch(/13\/10\/2026/)
  expect(item.textContent).not.toContain('Ana Teste')
  expect(item.textContent).not.toContain('Antes:')
  expect(within(filtro).getAllByRole('option').map((opcao) => opcao.textContent)).toEqual(['Todos os itens'])
})
```

  - em `historicoDosCadastros.test.ts`, trocar o `describe('responsáveis do setor', …)` (linhas 228-240) por:

```ts
describe('registros antigos de responsável do setor (recurso retirado da plataforma)', () => {
  const RESPONSAVEL = { setor_id: 's1', setor_sigla: 'CEE', nome: 'Pessoa Fictícia', email: 'pessoa@exemplo.com', cargo: null }
  const criado = evento({ entidade: 'responsavel_do_setor', entidadeRef: 's1:r1', depois: RESPONSAVEL })

  test('o item é a linha simples, e a ação usa o texto comum', () => {
    expect(nomeDoItem(criado)).toBe('Registro de responsável do setor (recurso retirado da plataforma)')
    expect(textoDaAcaoDoCadastro('criar', 'responsavel_do_setor')).toBe('Criou')
    expect(ehRecursoRetirado('responsavel_do_setor')).toBe(true)
    expect(ehRecursoRetirado('setor')).toBe(false)
  })

  test('fica fora da lista do filtro, mas aparece quando o setor é escolhido', () => {
    expect(itensDoFiltro([criado])).toEqual([])
    expect(eventosDoItem([criado], 's1')).toEqual([criado])
  })
})
```

  Manter o caso da linha 244 (evento antigo de exclusão de setor com a lista `responsaveis`).
  - em `App.historicoDosCadastros.test.tsx`, apagar o caso "os responsáveis do setor aparecem no Histórico e entram no filtro pelo setor" (linhas 181-193): o novo caso o substitui.
- [ ] Rodar `npx vitest run src/App.recursosRetirados.test.tsx src/cadastros/historicoDosCadastros.test.ts` e ver falhar (texto antigo "Criou Ana Teste — TSA"; `ehRecursoRetirado` não existe).
- [ ] Implementar em `historicoDosCadastros.ts`:

```ts
/** Recursos que saíram da plataforma (ADR 0013): os eventos ficam no histórico, numa linha sem o detalhe. */
const TEXTO_DO_RECURSO_RETIRADO: Record<string, string> = {
  reuniao: 'Registro de reunião (recurso retirado da plataforma)',
  responsavel_do_setor: 'Registro de responsável do setor (recurso retirado da plataforma)',
}

export function ehRecursoRetirado(entidade: string): boolean {
  return entidade in TEXTO_DO_RECURSO_RETIRADO
}
```

  - em `nomeDoItemComDono`: primeira linha `if (ehRecursoRetirado(entidade)) return TEXTO_DO_RECURSO_RETIRADO[entidade]`; o mapa `nomes` fica só com `andamento`; atualizar o comentário ("a etapa pertence a um setor ou a um processo…; os recursos retirados são a linha simples");
  - `ENTIDADES_QUE_LIGAM` fica `['setor_envolvido', 'andamento']` (comentário sem "responsáveis do setor");
  - `temItemProprio`: `!ENTIDADES_QUE_LIGAM.has(evento.entidade) && !ehRecursoRetirado(evento.entidade)`, comentário "recursos retirados ficam fora, porque todos teriam o mesmo nome no filtro";
  - apagar a constante exportada `TEXTO_DA_REUNIAO_RETIRADA` (conferir com grep que nada mais a usa);
  - em `ListaDoHistorico.tsx` (linha 41): `{!ehRecursoRetirado(evento.entidade) && <MudancaDoEvento evento={evento} />}`.
- [ ] Rodar os dois arquivos e a bateria (`npm test`): verde. Comitar ("Ticket 11 de processos-etapas: registros antigos de responsável do setor na linha simples do histórico").

### Tarefa 4 — Tela do setor e módulo sem responsáveis; tipos regenerados (critérios 3, 5 e 6)

**Arquivos:** os de "Apagar" (menos o 16), `SetorAberto.tsx`, `tipos.ts`, `ProcessosFalso.ts`, `processosSupabase.ts`, `Etapas.css`, `App.recursosRetirados.test.tsx`, `src/types/database.ts`.

- [ ] Teste que falha, em `App.recursosRetirados.test.tsx`:

```tsx
test('o setor aberto não tem a seção de responsáveis do setor, para quem altera e para a Consulta', async () => {
  for (const perfil of ['integrante_ep', 'consulta'] as const) {
    window.location.hash = '#/setores'
    montarNosCadastros({ perfil })
    fireEvent.click(await screen.findByRole('cell', { name: 'TSA' }))
    await screen.findByRole('region', { name: 'Processos do setor' })
    expect(screen.queryByText('Responsáveis do setor')).toBeNull()
    expect(screen.queryByText('Carregando responsáveis…')).toBeNull()
    expect(screen.queryByRole('button', { name: /responsável/i })).toBeNull()
    cleanup()
  }
})
```

  Antes, conferir em `src/testes/processosNosCadastros.tsx` como o perfil é passado (`perfil` ou outro nome) e ajustar a chamada.
- [ ] Rodar e ver falhar (a seção ainda aparece).
- [ ] Implementar:
  - `SetorAberto.tsx`: tirar o import e a linha `<ResponsaveisDoSetor …/>`; comentário "Etapas e processos do setor ficam abaixo…";
  - apagar `ResponsaveisDoSetor.tsx`, `ResponsaveisEditaveis.tsx`, `FormularioDeResponsavel.tsx`, `TabelaDeResponsaveis.tsx`, `responsaveisSupabase.ts` (+ teste), `validacaoDoResponsavel.ts` (+ teste) e `App.responsaveisDoSetor.test.tsx`;
  - `tipos.ts`: tirar `ResponsavelDoSetor`, `DadosDoResponsavel` e, de `ModuloDeProcessos`, `lerResponsaveisDoSetor`, `criarResponsavel`, `editarResponsavel`, `excluirResponsavel`;
  - `ProcessosFalso.ts`: tirar o campo `responsaveisDoSetor`, os quatro métodos, `mudarResponsaveis` e os imports que sobrarem;
  - `processosSupabase.ts`: tirar o import e o `...criarResponsaveisSupabase(...)`;
  - `Etapas.css`: o seletor `.responsaveis-do-setor,` sai (fica só `.etapas-do-setor`) e a regra `.acoes-do-responsavel` sai;
  - conferir o alvo e rodar `npm run db:types`; conferir no diff de `src/types/database.ts` que só `responsaveis_do_setor` saiu;
  - grep final: `grep -rniE "responsaveis_?do_?setor|ResponsavelDoSetor|DadosDoResponsavel|criarResponsavel|excluirResponsavel|editarResponsavel|validacaoDoResponsavel|acoes-do-responsavel" src` deve achar só `historicoDosCadastros.ts` (o mapa e o rótulo `responsaveis` dos eventos antigos), `historicoSupabase.ts` (a entidade na leitura) e testes do histórico.
- [ ] `npm test`, `npm run typecheck` e `npm run lint`: verdes. Comitar ("Ticket 11 de processos-etapas: tela do setor e módulo sem responsáveis; tipos regenerados").

### Tarefa 5 — Fecho

- [ ] Gravar `.scratch/processos-etapas/desvios.md` (entrada datada): tipos regenerados na Tarefa 4; eventos de responsável na linha simples e fora do filtro; evento de exclusão de setor sem a chave `responsaveis`; ensaio da migração; o que mais surgir.
- [ ] Gravar `.scratch/melhorias-protocolo.md` com os itens não testados do `/executar-complexo` e do "Qualquer momento" (`.claude/regras/nao-testados.md`) que aconteceram, mais a sessão no Opus.
- [ ] Marcar as caixas deste plano e comitar.
- [ ] `git switch main`, merge da branch, `git branch -d processos-etapas-11`; enviar a `main` e conferir o "Testes de banco" na `main`.
- [ ] Na `main`: `Concluído em 2026-10-18 (commit <hash>)` no fim do ticket 11; comitar e enviar.
