# Ticket 02 (Autorizar e-mails) — plano de execução

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque `- [x]` ao concluir cada passo.

**Objetivo:** o administrador vê usuários e autorizações em Administração > Usuários, autoriza e-mails, muda o perfil e exclui autorizações ainda não usadas; os demais perfis não veem a área.

**Arquitetura:** o banco decide quem grava `autorizacoes` (RLS só para Administrador ativo), normaliza e recusa e-mails (gatilho antes de incluir, com recusa `motivo:email`) e registra cada mudança em `eventos` (gatilho depois de incluir, alterar e apagar). A interface ganha quatro funções no `ModuloDeAcesso` (real e falso) e a área de administração, alcançada pela faixa lateral ou pelo endereço `#/administracao`.

**Tecnologia:** Supabase (Postgres, pgTAP), React 19, Vitest + Testing Library.

**Requisitos:** `.scratch/login-perfis/issues/02-autorizar-emails.md` (critérios citados como "critério N", na ordem do ticket) e `.scratch/login-perfis/spec.md` (histórias 14 a 16, 19 a 25, 35 a 37; seções "Interface", "Quem pode o quê", "Regras que o banco impõe"; os textos exatos das mensagens estão lá).

## Restrições globais

- Regras de `.claude/regras/banco.md` que valem aqui: teste antes da migração; políticas na mesma migração; função `security definer` só em `private`, com `search_path = ''` e nomes qualificados; políticas com `(select auth.uid())` e as funções auxiliares `private.perfil_atual()` e `private.usuario_ativo()` do ticket 01; a segurança está na RLS (esconder o item da faixa não protege); interface só pela chave publicável, por `src/lib/supabase.ts`; conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`, projeto dev `yclkzyoebpsxmgpbcbus`) antes de qualquer comando no banco; a migração `20261007200505_login_perfis` já está no dev e não se edita.
- Rede atual: só porta 443. Teste e migração vão pelo SQL Editor do painel do projeto dev, com o usuário colando o arquivo e relatando o resultado; `npm run db:types` funciona.
- Limites do ESLint: função ≤ 20 linhas em `.ts` (hooks ≤ 40), arquivo ≤ 300, complexidade ≤ 10. Sem `any`.
- Dados de teste inventados, e-mails `@ccivil.pr.gov.br` fictícios. Nenhum e-mail real no código, nos testes ou na conversa.
- Fora deste ticket: alterar `usuarios` (perfil, ativo, nome) e as travas (ticket 03); ler `eventos` pela interface (ticket 04).

## Decisões de execução

- **Recusas do banco** no mesmo formato do ticket 01 (`motivo:email`, código `P0001`): `email_fora_do_dominio`, `email_ja_autorizado`, `email_ja_e_usuario`. A interface traduz em `src/acesso/falhasDeGravacao.ts`.
- **Gatilho de preparo como `security invoker`:** roda com os poderes de quem grava, então um não administrador não consegue descobrir, pela mensagem de recusa, se um e-mail já está autorizado (a RLS esconde as linhas dele).
- **Só o perfil da autorização se altera:** `update` concedido apenas na coluna `perfil`; trocar o e-mail é excluir e autorizar de novo. Visitante perde todos os privilégios na tabela.
- **Primeiro acesso não vira "excluir_autorizacao":** o gatilho de eventos ignora a exclusão quando já existe conta no Auth com aquele e-mail (é o primeiro acesso consumindo a autorização, que já registra o evento dele). Assim a função do ticket 01 fica intacta.
- **Alteração que a RLS filtra não dá erro:** mudar perfil e excluir pedem a linha de volta; zero linhas vira falha com motivo.
- **Navegação:** só Quadro e Administração têm tela; as outras áreas continuam sem ação, como hoje. A área atual fica no endereço (`#/administracao`), o que também é o caminho de um não administrador "chegar à área" (critério 5).
- **Lista:** autorizações aguardando primeiro acesso no topo (são as que pedem ação), depois os usuários por nome. Linha aguardando não tem avatar (ainda não há pessoa) e mostra "—" no nome.
- **Falha numa ação de linha** (mudar perfil, excluir): "A alteração não foi salva: {motivo}." acima da tabela. A frase "Seus dados continuam no formulário." fica só no formulário, onde é verdade.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/tests/04_autorizacoes.test.sql` (novo) | quem pode o quê em `autorizacoes`, regras do e-mail, eventos |
| `supabase/migrations/<data>_autorizar_emails.sql` (novo) | políticas, privilégios, gatilhos de preparo e de eventos |
| `src/types/database.ts` (gerado) | tipos do banco |
| `supabase/AMBIENTES.md` (alterar) | migração aplicada à mão |
| `src/acesso/emailInstitucional.ts` + teste | normalizar e validar o e-mail na interface |
| `src/acesso/falhasDeGravacao.ts` + teste | recusa do banco → motivo em português |
| `src/acesso/perfis.ts` + teste (alterar) | lista dos perfis, na ordem do seletor |
| `src/acesso/tipos.ts` (alterar) | `LinhaDeUsuario`, `SituacaoDoUsuario`, quatro funções novas no `ModuloDeAcesso` |
| `src/acesso/administracaoSupabase.ts` + teste (novos) | implementação real das quatro funções |
| `src/acesso/acessoSupabase.ts` (alterar) | junta as funções de administração |
| `src/acesso/AcessoFalso.ts` (alterar) | implementação falsa das quatro funções |
| `src/components/moldura/areas.ts` (novo) | áreas do sistema e quais têm tela |
| `src/hooks/useAreaAtual.ts` (novo) | área atual, ligada ao endereço |
| `src/components/moldura/FaixaLateral.tsx`, `Moldura.tsx`, `BarraSuperior.tsx`, `src/App.tsx` (alterar) | navegação por perfil |
| `src/hooks/useUsuarios.ts` (novo) | carregar a lista, tentar de novo, gravar e reler |
| `src/components/administracao/AreaDeAdministracao.tsx` (novo) | mensagem para quem não é administrador ou a área de usuários |
| `src/components/administracao/AreaDeUsuarios.tsx` (novo) | junta formulário, aviso de falha e lista |
| `src/components/administracao/ListaDeUsuarios.tsx` (novo) | estados da lista e tabela |
| `src/components/administracao/SeletorDePerfil.tsx` (novo) | `<select>` dos perfis |
| `src/components/administracao/FormularioDeAutorizacao.tsx` (novo) | formulário "Autorizar e-mail" |
| `src/components/administracao/Administracao.css` (novo) | tabela, linhas-fantasma, formulário |
| `src/App.test.tsx` (alterar), `src/App.administracao.test.tsx`, `src/App.autorizacoes.test.tsx` (novos) | tela inteira |

---

### Tarefa 1: Banco (critérios 1 a 3)

**Produz:** políticas de `public.autorizacoes`; funções `private.preparar_autorizacao()` e `private.registrar_evento_da_autorizacao()`; recusas `email_fora_do_dominio:<email>`, `email_ja_autorizado:<email>`, `email_ja_e_usuario:<email>` (código `P0001`); evento por ação com `acao` em `autorizar`, `mudar_perfil`, `excluir_autorizacao`, `entidade = 'autorizacao'`, `entidade_ref = email`, `detalhes = {"antes": …, "depois": …}` com `email` e `perfil`.

- [x] **1.1 Teste que falha.** Criar `supabase/tests/04_autorizacoes.test.sql`:

```sql
-- Autorizações: quem pode o quê, regras do e-mail e eventos (login-perfis, ticket 02).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(29);

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
insert into public.autorizacoes (email) values ('aguardando.teste@ccivil.pr.gov.br');

-- Quem não pode: integrante, consulta e inativo (as mesmas quatro conferências para cada um).
create function pg_temp.conferir_quem_nao_pode(id_usuario text, quem text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', id_usuario), true);
  set local role authenticated;
  insert into _tap (linha) select is(
    (select count(*)::int from public.autorizacoes), 0, quem || ' não lê autorizações');
  insert into _tap (linha) select throws_ok(
    $sql$insert into public.autorizacoes (email) values ('outra.pessoa@ccivil.pr.gov.br')$sql$,
    '42501', null, quem || ' não autoriza e-mail');
  with alteradas as (
    update public.autorizacoes set perfil = 'administrador'
    where email = 'aguardando.teste@ccivil.pr.gov.br' returning 1)
  insert into _tap (linha) select is((select count(*)::int from alteradas), 0, quem || ' não muda o perfil da autorização');
  with apagadas as (
    delete from public.autorizacoes where email = 'aguardando.teste@ccivil.pr.gov.br' returning 1)
  insert into _tap (linha) select is((select count(*)::int from apagadas), 0, quem || ' não exclui autorização');
  reset role;
end $$;
grant execute on function pg_temp.conferir_quem_nao_pode(text, text) to authenticated;

select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a2', 'Integrante');
select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a3', 'Consulta');
select pg_temp.conferir_quem_nao_pode('00000000-0000-0000-0000-0000000000a4', 'Inativo');

-- Visitante (sem login): nenhum privilégio na tabela.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok('select 1 from public.autorizacoes', '42501', null, 'Visitante não lê autorizações');
insert into _tap (linha) select throws_ok(
  $$insert into public.autorizacoes (email) values ('outra.pessoa@ccivil.pr.gov.br')$$, '42501', null, 'Visitante não autoriza');
insert into _tap (linha) select throws_ok(
  $$update public.autorizacoes set perfil = 'administrador'$$, '42501', null, 'Visitante não muda perfil');
insert into _tap (linha) select throws_ok('delete from public.autorizacoes', '42501', null, 'Visitante não exclui');
reset role;

-- Administrador
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
insert into _tap (linha) select is(
  (select count(*)::int from public.autorizacoes where email = 'aguardando.teste@ccivil.pr.gov.br'), 1,
  'Administrador lê autorizações');
insert into _tap (linha) select lives_ok(
  $$insert into public.autorizacoes (email, perfil) values (' Nova.Pessoa@CCivil.pr.gov.br ', 'integrante_ep')$$,
  'Administrador autoriza e-mail');
insert into _tap (linha) select is(
  (select count(*)::int from public.autorizacoes where email = 'nova.pessoa@ccivil.pr.gov.br'), 1,
  'e-mail guardado em minúsculas e sem espaços');
insert into _tap (linha) select throws_ok(
  $$insert into public.autorizacoes (email) values ('pessoa@gmail.com')$$,
  'P0001', 'email_fora_do_dominio:pessoa@gmail.com', 'e-mail fora do domínio é recusado com o motivo');
insert into _tap (linha) select throws_ok(
  $$insert into public.autorizacoes (email) values ('Aguardando.Teste@ccivil.pr.gov.br')$$,
  'P0001', 'email_ja_autorizado:aguardando.teste@ccivil.pr.gov.br', 'e-mail já autorizado é recusado com o motivo');
insert into _tap (linha) select throws_ok(
  $$insert into public.autorizacoes (email) values ('consulta.teste@ccivil.pr.gov.br')$$,
  'P0001', 'email_ja_e_usuario:consulta.teste@ccivil.pr.gov.br', 'e-mail de usuário existente é recusado com o motivo');
with alteradas as (
  update public.autorizacoes set perfil = 'integrante_ep'
  where email = 'aguardando.teste@ccivil.pr.gov.br' returning 1)
insert into _tap (linha) select is((select count(*)::int from alteradas), 1, 'Administrador muda o perfil da autorização');
insert into _tap (linha) select throws_ok(
  $$update public.autorizacoes set email = 'trocado.teste@ccivil.pr.gov.br' where email = 'nova.pessoa@ccivil.pr.gov.br'$$,
  '42501', null, 'o e-mail da autorização não se altera');
with apagadas as (
  delete from public.autorizacoes where email = 'aguardando.teste@ccivil.pr.gov.br' returning 1)
insert into _tap (linha) select is((select count(*)::int from apagadas), 1, 'Administrador exclui autorização');
reset role;

-- Eventos (lidos como dono do banco; a leitura pela interface é do ticket 04)
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos
    where acao = 'autorizar' and entidade = 'autorizacao' and entidade_ref = 'nova.pessoa@ccivil.pr.gov.br'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1',
    '{"antes": null, "depois": {"email": "nova.pessoa@ccivil.pr.gov.br", "perfil": "integrante_ep"}}'::jsonb)$$,
  'autorizar grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos
    where acao = 'mudar_perfil' and entidade = 'autorizacao' and entidade_ref = 'aguardando.teste@ccivil.pr.gov.br'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1', '{"antes": {"email": "aguardando.teste@ccivil.pr.gov.br",
    "perfil": "consulta"}, "depois": {"email": "aguardando.teste@ccivil.pr.gov.br", "perfil": "integrante_ep"}}'::jsonb)$$,
  'mudar perfil grava evento com autor, antes e depois');
insert into _tap (linha) select results_eq(
  $$select autor_id::text, detalhes from public.eventos
    where acao = 'excluir_autorizacao' and entidade_ref = 'aguardando.teste@ccivil.pr.gov.br'$$,
  $$values ('00000000-0000-0000-0000-0000000000a1',
    '{"antes": {"email": "aguardando.teste@ccivil.pr.gov.br", "perfil": "integrante_ep"}, "depois": null}'::jsonb)$$,
  'excluir grava evento com autor, antes e depois');
insert into _tap (linha) select is(
  (select count(*)::int from public.eventos where acao = 'excluir_autorizacao'
    and entidade_ref in ('admin.teste@ccivil.pr.gov.br', 'integrante.teste@ccivil.pr.gov.br',
      'consulta.teste@ccivil.pr.gov.br', 'inativo.teste@ccivil.pr.gov.br')), 0,
  'o primeiro acesso não registra exclusão de autorização');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

  Contagem do `plan(29)`: 3 × 4 (quem não pode) + 4 (visitante) + 9 (administrador) + 4 (eventos) = 29. Se `set local role` dentro da função temporária não funcionar no SQL Editor (erro ao trocar de papel dentro de função), desdobrar a função nos três blocos explícitos, no formato do `03_login_leitura.test.sql`, mantendo os mesmos textos.

- [x] **1.2 Ver falhar.** (pulado: migração colada antes; ver `desvios.md`) Conferir o alvo (linha "vínculo atual" de `supabase/AMBIENTES.md` e `supabase/.temp/project-ref` iguais a `yclkzyoebpsxmgpbcbus`). Pedir ao usuário que cole o arquivo no SQL Editor do projeto dev e relate o resultado. Esperado: relatório com falhas (Administrador recusado pela RLS, e-mail não normalizado, sem eventos, visitante lendo).

- [x] **1.3 Migração.** `npx supabase migration new autorizar_emails` e preencher:

```sql
-- Login e perfis, ticket 02: o administrador autoriza e-mails, muda o perfil da autorização e a exclui.
-- Recusas no formato "motivo:email", traduzidas pela interface (src/acesso/falhasDeGravacao.ts).

-- Privilégios: visitante nada; da autorização, só o perfil se altera (trocar o e-mail é excluir e autorizar de novo).
revoke all on public.autorizacoes from anon;
revoke update on public.autorizacoes from authenticated;
grant update (perfil) on public.autorizacoes to authenticated;

create policy "autorizacoes: administrador ativo lê" on public.autorizacoes
  for select to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "autorizacoes: administrador ativo autoriza" on public.autorizacoes
  for insert to authenticated
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "autorizacoes: administrador ativo muda o perfil" on public.autorizacoes
  for update to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador')
  with check ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

create policy "autorizacoes: administrador ativo exclui" on public.autorizacoes
  for delete to authenticated
  using ((select private.usuario_ativo()) and (select private.perfil_atual()) = 'administrador');

-- Preparo antes de incluir. Security invoker de propósito: quem não é administrador não vê as linhas
-- pela RLS, então a recusa não revela se um e-mail já está autorizado.
create function private.preparar_autorizacao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  if new.email !~ '^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$' then
    raise exception 'email_fora_do_dominio:%', new.email using errcode = 'P0001';
  end if;
  if exists (select 1 from public.autorizacoes a where a.email = new.email) then
    raise exception 'email_ja_autorizado:%', new.email using errcode = 'P0001';
  end if;
  if exists (select 1 from public.usuarios_emails u where u.email = new.email) then
    raise exception 'email_ja_e_usuario:%', new.email using errcode = 'P0001';
  end if;
  new.criada_em := now();
  new.criada_por := (select auth.uid());
  return new;
end $$;

create function private.registrar_evento_da_autorizacao() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  antes jsonb := case when tg_op <> 'INSERT' then jsonb_build_object('email', old.email, 'perfil', old.perfil) end;
  depois jsonb := case when tg_op <> 'DELETE' then jsonb_build_object('email', new.email, 'perfil', new.perfil) end;
begin
  -- O primeiro acesso consome a autorização e já registra o próprio evento (private.registrar_primeiro_acesso).
  if tg_op = 'DELETE' and exists (select 1 from auth.users u where lower(btrim(u.email)) = old.email) then
    return null;
  end if;
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()),
    case tg_op when 'INSERT' then 'autorizar' when 'UPDATE' then 'mudar_perfil' else 'excluir_autorizacao' end,
    'autorizacao', coalesce(depois, antes) ->> 'email', jsonb_build_object('antes', antes, 'depois', depois));
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.preparar_autorizacao(), private.registrar_evento_da_autorizacao()
  from public, anon, authenticated;

create trigger preparar_autorizacao before insert on public.autorizacoes
  for each row execute function private.preparar_autorizacao();

create trigger registrar_evento_da_autorizacao after insert or update or delete on public.autorizacoes
  for each row execute function private.registrar_evento_da_autorizacao();
```

- [x] **1.4 Aplicar e ver passar.** Pedir ao usuário que cole a migração no SQL Editor do dev; depois o `04_autorizacoes.test.sql` (esperado: `ok` 1 a 29) e de novo o `02_login_barreira.test.sql` e o `03_login_leitura.test.sql` (esperado: continuam passando; o primeiro acesso agora passa pelo gatilho de eventos). Se algo falhar, ajustar a migração **antes** de ela ser dada por aplicada (no dev, colar `drop trigger …; drop function …; drop policy …` e reaplicar; regra das 3 tentativas).
- [x] **1.5 Tipos e registro.** `npm run db:types` (vínculo conferido). Acrescentar a migração à lista de "Migrações aplicadas à mão" em `supabase/AMBIENTES.md`, com a data e os testes que passaram.
- [x] **1.6 Commit:** teste, migração, tipos e `AMBIENTES.md` juntos — `Autoriza e-mails no banco: políticas, recusas e eventos`.

---

### Tarefa 2: Regras puras da interface (critério 7, tradução das recusas)

**Produz:** `normalizarEmail(texto: string): string`, `problemaNoEmail(texto: string): string | null`, `motivoDaFalhaDeGravacao(erro: { message: string; code?: string }): string`, `PERFIS: readonly Perfil[]`.

- [x] **2.1 Testes que falham.** `src/acesso/emailInstitucional.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { normalizarEmail, problemaNoEmail } from './emailInstitucional'

describe('e-mail institucional', () => {
  test('normaliza para minúsculas e sem espaços nas pontas, como o banco', () => {
    expect(normalizarEmail(' Fulano.Teste@CCivil.pr.gov.br ')).toBe('fulano.teste@ccivil.pr.gov.br')
  })

  test('e-mail do domínio passa, com maiúsculas e espaços', () => {
    expect(problemaNoEmail(' Fulano.Teste@CCivil.pr.gov.br ')).toBeNull()
  })

  test('e-mail fora do domínio mostra o valor digitado e o formato esperado', () => {
    expect(problemaNoEmail('pessoa@gmail.com')).toBe(
      'O e-mail "pessoa@gmail.com" não está no formato esperado: nome@ccivil.pr.gov.br.')
  })

  test('campo vazio também é recusado', () => {
    expect(problemaNoEmail('  ')).toBe('O e-mail "" não está no formato esperado: nome@ccivil.pr.gov.br.')
  })
})
```

  `src/acesso/falhasDeGravacao.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { motivoDaFalhaDeGravacao } from './falhasDeGravacao'

describe('motivoDaFalhaDeGravacao', () => {
  test.each([
    ['email_fora_do_dominio:p@gmail.com', 'o e-mail p@gmail.com não é institucional (formato esperado: nome@ccivil.pr.gov.br)'],
    ['email_ja_autorizado:x.teste@ccivil.pr.gov.br', 'o e-mail x.teste@ccivil.pr.gov.br já está autorizado'],
    ['email_ja_e_usuario:x.teste@ccivil.pr.gov.br', 'o e-mail x.teste@ccivil.pr.gov.br já pertence a um usuário'],
  ])('traduz a recusa "%s"', (mensagem, motivo) => {
    expect(motivoDaFalhaDeGravacao({ message: mensagem, code: 'P0001' })).toBe(motivo)
  })

  test('recusa da RLS vira falta de permissão', () => {
    expect(motivoDaFalhaDeGravacao({ message: 'new row violates row-level security policy', code: '42501' }))
      .toBe('seu perfil não permite esta alteração')
  })

  test('erro desconhecido mostra o texto recebido', () => {
    expect(motivoDaFalhaDeGravacao({ message: 'Failed to fetch' })).toBe('erro inesperado do banco (Failed to fetch)')
  })
})
```

  Em `src/acesso/perfis.test.ts`, acrescentar:

```ts
test('os perfis vão do maior para o menor, na ordem do seletor', () => {
  expect(PERFIS).toEqual(['administrador', 'integrante_ep', 'consulta'])
})
```

- [x] **2.2 Ver falhar:** `npx vitest run src/acesso` → falha por módulos e export inexistentes.
- [x] **2.3 Implementar.** `src/acesso/emailInstitucional.ts`:

```ts
const FORMATO_INSTITUCIONAL = /^[a-z0-9._%+-]+@ccivil\.pr\.gov\.br$/
const FORMATO_ESPERADO = 'nome@ccivil.pr.gov.br'

// Mesma normalização do banco (private.preparar_autorizacao): minúsculas e sem espaços nas pontas.
export function normalizarEmail(texto: string): string {
  return texto.trim().toLowerCase()
}

export function problemaNoEmail(texto: string): string | null {
  if (FORMATO_INSTITUCIONAL.test(normalizarEmail(texto))) return null
  return `O e-mail "${texto.trim()}" não está no formato esperado: ${FORMATO_ESPERADO}.`
}
```

  `src/acesso/falhasDeGravacao.ts`:

```ts
type ErroDoBanco = { message: string; code?: string }
type RecusaDoEmail = 'email_fora_do_dominio' | 'email_ja_autorizado' | 'email_ja_e_usuario'

// O banco recusa com "motivo:email" (private.preparar_autorizacao); o PostgREST pode acrescentar texto em volta.
const PADRAO_DA_RECUSA = /\b(email_fora_do_dominio|email_ja_autorizado|email_ja_e_usuario):(\S*)/

const MOTIVO_DA_RECUSA: Record<RecusaDoEmail, (email: string) => string> = {
  email_fora_do_dominio: (email) => `o e-mail ${email} não é institucional (formato esperado: nome@ccivil.pr.gov.br)`,
  email_ja_autorizado: (email) => `o e-mail ${email} já está autorizado`,
  email_ja_e_usuario: (email) => `o e-mail ${email} já pertence a um usuário`,
}

export function motivoDaFalhaDeGravacao(erro: ErroDoBanco): string {
  const achado = erro.message.match(PADRAO_DA_RECUSA)
  if (achado) return MOTIVO_DA_RECUSA[achado[1] as RecusaDoEmail](achado[2])
  if (erro.code === '42501') return 'seu perfil não permite esta alteração'
  return `erro inesperado do banco (${erro.message})`
}
```

  Em `src/acesso/perfis.ts`, acrescentar:

```ts
export const PERFIS: readonly Perfil[] = ['administrador', 'integrante_ep', 'consulta']
```

- [x] **2.4 Ver passar:** `npx vitest run src/acesso`.
- [x] **2.5 Commit:** `Valida o e-mail institucional e traduz as recusas de gravação`.

---

### Tarefa 3: Módulo de acesso com administração (critério 4)

**Consome:** `motivoDaFalhaDeGravacao` (tarefa 2), tipos gerados (tarefa 1).
**Produz:** em `src/acesso/tipos.ts`:

```ts
export type SituacaoDoUsuario = 'ativo' | 'inativo' | 'aguardando'
/** Uma linha de Administração > Usuários: um usuário que já entrou ou uma autorização aguardando primeiro acesso. */
export type LinhaDeUsuario = {
  chave: string
  nome: string | null
  email: string
  fotoUrl: string | null
  perfil: Perfil
  situacao: SituacaoDoUsuario
}
```

e, no `ModuloDeAcesso`: `listarUsuarios(): Promise<LinhaDeUsuario[]>`, `autorizarEmail(email: string, perfil: Perfil): Promise<void>`, `mudarPerfilDaAutorizacao(email: string, perfil: Perfil): Promise<void>`, `excluirAutorizacao(email: string): Promise<void>`. Falha de gravação: `Error` cuja `message` é o motivo em português (sem o prefixo "A alteração não foi salva"). No `AcessoFalso`: `linhas: LinhaDeUsuario[]`, `falharLista`, `segurarLista`, `falhaDeGravacao: string | null`.

- [x] **3.1 Teste que falha.** `src/acesso/administracaoSupabase.test.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, test } from 'vitest'
import type { Database } from '../types/database'
import { criarAdministracaoSupabase } from './administracaoSupabase'

type RespostaDoBanco = { data: unknown; error: { message: string; code?: string } | null }
type Pedido = { tabela: string; operacao: string; valores?: unknown; filtro?: [string, string] }

/** Cliente Supabase falso: guarda cada pedido e responde por "tabela.operação". */
class ClienteDeAdministracaoFalso {
  respostas: Record<string, RespostaDoBanco> = {}
  pedidos: Pedido[] = []

  from(tabela: string) {
    const pedido: Pedido = { tabela, operacao: 'select' }
    this.pedidos.push(pedido)
    const resposta = () => this.respostas[`${tabela}.${pedido.operacao}`] ?? { data: [], error: null }
    const consulta = {
      select: () => consulta,
      order: () => consulta,
      insert: (valores: unknown) => Object.assign(pedido, { operacao: 'insert', valores }) && consulta,
      update: (valores: unknown) => Object.assign(pedido, { operacao: 'update', valores }) && consulta,
      delete: () => Object.assign(pedido, { operacao: 'delete' }) && consulta,
      eq: (coluna: string, valor: string) => Object.assign(pedido, { filtro: [coluna, valor] }) && consulta,
      then: (seCumprir: (r: RespostaDoBanco) => unknown, seFalhar?: (e: unknown) => unknown) =>
        Promise.resolve(resposta()).then(seCumprir, seFalhar),
    }
    return consulta
  }
}

function criar(cliente: ClienteDeAdministracaoFalso) {
  return criarAdministracaoSupabase(cliente as unknown as SupabaseClient<Database>)
}

describe('criarAdministracaoSupabase', () => {
  test('a lista traz as autorizações aguardando e depois os usuários, com e-mail e situação', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['autorizacoes.select'] = { data: [{ email: 'nova.teste@ccivil.pr.gov.br', perfil: 'consulta' }], error: null }
    cliente.respostas['usuarios.select'] = {
      data: [{ id: 'u1', nome: 'Ana Teste', foto_url: null, perfil: 'administrador', ativo: false,
        usuarios_emails: { email: 'ana.teste@ccivil.pr.gov.br' } }],
      error: null,
    }
    expect(await criar(cliente).listarUsuarios()).toEqual([
      { chave: 'nova.teste@ccivil.pr.gov.br', nome: null, email: 'nova.teste@ccivil.pr.gov.br', fotoUrl: null,
        perfil: 'consulta', situacao: 'aguardando' },
      { chave: 'u1', nome: 'Ana Teste', email: 'ana.teste@ccivil.pr.gov.br', fotoUrl: null,
        perfil: 'administrador', situacao: 'inativo' },
    ])
  })

  test('falha ao listar vira exceção com o texto do banco', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['usuarios.select'] = { data: null, error: { message: 'sem rede' } }
    await expect(criar(cliente).listarUsuarios()).rejects.toThrow(/usuários.*sem rede/)
  })

  test('autorizar inclui e-mail e perfil; a recusa do banco vira o motivo', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    await criar(cliente).autorizarEmail('nova.teste@ccivil.pr.gov.br', 'integrante_ep')
    expect(cliente.pedidos[0]).toMatchObject({ tabela: 'autorizacoes', operacao: 'insert',
      valores: { email: 'nova.teste@ccivil.pr.gov.br', perfil: 'integrante_ep' } })
    cliente.respostas['autorizacoes.insert'] = { data: null,
      error: { message: 'email_ja_autorizado:nova.teste@ccivil.pr.gov.br', code: 'P0001' } }
    await expect(criar(cliente).autorizarEmail('nova.teste@ccivil.pr.gov.br', 'consulta'))
      .rejects.toThrow('o e-mail nova.teste@ccivil.pr.gov.br já está autorizado')
  })

  test('mudar perfil filtra pelo e-mail e falha quando nenhuma linha muda', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['autorizacoes.update'] = { data: [{ email: 'x.teste@ccivil.pr.gov.br' }], error: null }
    await criar(cliente).mudarPerfilDaAutorizacao('x.teste@ccivil.pr.gov.br', 'administrador')
    expect(cliente.pedidos[0]).toMatchObject({ operacao: 'update', valores: { perfil: 'administrador' },
      filtro: ['email', 'x.teste@ccivil.pr.gov.br'] })
    cliente.respostas['autorizacoes.update'] = { data: [], error: null }
    await expect(criar(cliente).mudarPerfilDaAutorizacao('x.teste@ccivil.pr.gov.br', 'consulta'))
      .rejects.toThrow(/autorização de x\.teste@ccivil\.pr\.gov\.br não foi encontrada/)
  })

  test('excluir apaga a autorização do e-mail', async () => {
    const cliente = new ClienteDeAdministracaoFalso()
    cliente.respostas['autorizacoes.delete'] = { data: [{ email: 'x.teste@ccivil.pr.gov.br' }], error: null }
    await criar(cliente).excluirAutorizacao('x.teste@ccivil.pr.gov.br')
    expect(cliente.pedidos[0]).toMatchObject({ operacao: 'delete', filtro: ['email', 'x.teste@ccivil.pr.gov.br'] })
  })
})
```

- [x] **3.2 Ver falhar:** `npx vitest run src/acesso/administracaoSupabase.test.ts`.
- [x] **3.3 Implementar.** Tipos acima em `src/acesso/tipos.ts` (junto às quatro funções no `ModuloDeAcesso`). `src/acesso/administracaoSupabase.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { motivoDaFalhaDeGravacao } from './falhasDeGravacao'
import type { LinhaDeUsuario, ModuloDeAcesso, Perfil } from './tipos'

type ClienteSupabase = SupabaseClient<Database>
type FuncoesDeAdministracao = Pick<ModuloDeAcesso,
  'listarUsuarios' | 'autorizarEmail' | 'mudarPerfilDaAutorizacao' | 'excluirAutorizacao'>
type UsuarioDoBanco = {
  id: string; nome: string; foto_url: string | null; perfil: Perfil; ativo: boolean
  usuarios_emails: { email: string } | null
}
type RespostaDeAlteracao = { data: unknown[] | null; error: { message: string; code?: string } | null }

export function criarAdministracaoSupabase(cliente: ClienteSupabase): FuncoesDeAdministracao {
  return {
    listarUsuarios: () => listarUsuarios(cliente),
    autorizarEmail: (email, perfil) => autorizarEmail(cliente, email, perfil),
    mudarPerfilDaAutorizacao: async (email, perfil) =>
      conferirAlteracao(await cliente.from('autorizacoes').update({ perfil }).eq('email', email).select('email'), email),
    excluirAutorizacao: async (email) =>
      conferirAlteracao(await cliente.from('autorizacoes').delete().eq('email', email).select('email'), email),
  }
}

// Aguardando primeiro acesso vêm no topo: são as linhas que pedem ação do administrador.
async function listarUsuarios(cliente: ClienteSupabase): Promise<LinhaDeUsuario[]> {
  const [usuarios, autorizacoes] = await Promise.all([
    cliente.from('usuarios').select('id, nome, foto_url, perfil, ativo, usuarios_emails(email)').order('nome'),
    cliente.from('autorizacoes').select('email, perfil').order('email'),
  ])
  if (usuarios.error) throw new Error(`Falha ao listar os usuários: ${usuarios.error.message}`)
  if (autorizacoes.error) throw new Error(`Falha ao listar as autorizações: ${autorizacoes.error.message}`)
  const aguardando = autorizacoes.data.map(({ email, perfil }): LinhaDeUsuario =>
    ({ chave: email, nome: null, email, fotoUrl: null, perfil, situacao: 'aguardando' }))
  return [...aguardando, ...(usuarios.data as UsuarioDoBanco[]).map(linhaDoUsuario)]
}

function linhaDoUsuario(usuario: UsuarioDoBanco): LinhaDeUsuario {
  return {
    chave: usuario.id, nome: usuario.nome, email: usuario.usuarios_emails?.email ?? '',
    fotoUrl: usuario.foto_url, perfil: usuario.perfil, situacao: usuario.ativo ? 'ativo' : 'inativo',
  }
}

async function autorizarEmail(cliente: ClienteSupabase, email: string, perfil: Perfil): Promise<void> {
  const { error } = await cliente.from('autorizacoes').insert({ email, perfil })
  if (error) throw new Error(motivoDaFalhaDeGravacao(error))
}

// A RLS não acusa erro ao filtrar: nenhuma linha devolvida quer dizer que nada mudou.
function conferirAlteracao({ data, error }: RespostaDeAlteracao, email: string): void {
  if (error) throw new Error(motivoDaFalhaDeGravacao(error))
  if (!data?.length) {
    throw new Error(`a autorização de ${email} não foi encontrada (pode já ter sido usada no primeiro acesso)`)
  }
}
```

  Se o typecheck reclamar do formato de `usuarios_emails` (objeto × lista), conferir em `src/types/database.ts` se a relação está como `isOneToOne: true`; o cast para `UsuarioDoBanco` existe porque a inferência do supabase-js para relações embutidas varia entre versões.

  Em `src/acesso/acessoSupabase.ts`, no objeto devolvido por `criarAcessoSupabase`, acrescentar `...criarAdministracaoSupabase(cliente),`.

  Em `src/acesso/AcessoFalso.ts`, acrescentar à classe:

```ts
  linhas: LinhaDeUsuario[] = []
  falharLista = false
  segurarLista = false
  falhaDeGravacao: string | null = null

  async listarUsuarios(): Promise<LinhaDeUsuario[]> {
    if (this.segurarLista) return new Promise<never>(() => {})
    if (this.falharLista) throw new Error('falha de conexão simulada')
    return [...this.linhas]
  }

  async autorizarEmail(email: string, perfil: Perfil): Promise<void> {
    this.conferirGravacao()
    this.linhas = [{ chave: email, nome: null, email, fotoUrl: null, perfil, situacao: 'aguardando' }, ...this.linhas]
  }

  async mudarPerfilDaAutorizacao(email: string, perfil: Perfil): Promise<void> {
    this.conferirGravacao()
    this.linhas = this.linhas.map((linha) => (linha.email === email ? { ...linha, perfil } : linha))
  }

  async excluirAutorizacao(email: string): Promise<void> {
    this.conferirGravacao()
    this.linhas = this.linhas.filter((linha) => linha.email !== email)
  }

  // A falha simulada traz o motivo já em português, como o módulo real entrega.
  private conferirGravacao(): void {
    if (this.falhaDeGravacao) throw new Error(this.falhaDeGravacao)
  }
```

- [x] **3.4 Ver passar:** `npm test` e `npm run typecheck`.
- [x] **3.5 Commit:** `Leva a administração de autorizações ao módulo de acesso`.

---

### Tarefa 4: Navegação por perfil e lista de usuários (critérios 5, 6 e 8 na parte da lista)

**Consome:** `ModuloDeAcesso` e `AcessoFalso` (tarefa 3), `rotuloDoPerfil`, `Avatar`, `Pilula`.
**Produz:** `useAreaAtual(): [AreaComTela, (area: AreaComTela) => void]`; `useUsuarios(acesso)` → `{ lista, tentarDeNovo, gravar }`, com `lista: { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronta'; linhas: LinhaDeUsuario[] }` e `gravar(alteracao: () => Promise<void>): Promise<void>` (relê a lista no sucesso, repassa a falha); `ListaDeUsuarios` com props `{ lista, aoTentarDeNovo, aoMudarPerfil(email, perfil), aoExcluir(email) }` (os dois últimos usados na tarefa 5).

- [x] **4.1 Testes que falham.** Em `src/App.test.tsx`, trocar o teste "a navegação lateral tem as seis áreas" (o usuário de teste é Integrante) por:

```ts
test('para quem não é administrador, a navegação tem cinco áreas, sem Administração', async () => {
  await abrirLogado()
  const navegacao = screen.getByRole('navigation', { name: 'Áreas do sistema' })
  const rotulos = Array.from(navegacao.querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))
  expect(rotulos).toEqual(['Quadro', 'Lista', 'Setores', 'Reuniões', 'Painel'])
})
```

  Criar `src/App.administracao.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ADMINISTRADOR = { ...USUARIO_DE_TESTE, nome: 'Ana Administradora', perfil: 'administrador' as Perfil }
const LINHAS: LinhaDeUsuario[] = [
  { chave: 'nova.teste@ccivil.pr.gov.br', nome: null, email: 'nova.teste@ccivil.pr.gov.br', fotoUrl: null,
    perfil: 'consulta', situacao: 'aguardando' },
  { chave: 'u1', nome: 'Carla Teste', email: 'carla.teste@ccivil.pr.gov.br', fotoUrl: null,
    perfil: 'administrador', situacao: 'ativo' },
  { chave: 'u2', nome: 'Bruno Teste', email: 'bruno.teste@ccivil.pr.gov.br', fotoUrl: null,
    perfil: 'integrante_ep', situacao: 'inativo' },
]

function acessoDoAdministrador() {
  const acesso = AcessoFalso.logadoComo(ADMINISTRADOR)
  acesso.linhas = [...LINHAS]
  return acesso
}

async function irParaAdministracao(acesso: AcessoFalso) {
  render(<App acesso={acesso} />)
  const navegacao = await screen.findByRole('navigation', { name: 'Áreas do sistema' })
  fireEvent.click(within(navegacao).getByRole('button', { name: 'Administração' }))
}

test('o administrador vê Administração na navegação e chega à lista de usuários', async () => {
  await irParaAdministracao(acessoDoAdministrador())
  expect(await screen.findByRole('heading', { name: 'Usuários' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Administração' }).getAttribute('aria-current')).toBe('page')
})

test.each<[Perfil, string]>([['integrante_ep', 'Integrante do EP'], ['consulta', 'Consulta']])(
  'perfil %s que chega pelo endereço vê a mensagem, sem a lista', async (perfil, rotulo) => {
    window.location.hash = '#/administracao'
    render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} />)
    expect(await screen.findByText(
      `Seu perfil (${rotulo}) não permite administrar usuários. Peça a um administrador para mudar seu perfil.`)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

test('enquanto carrega, mostra "Carregando usuários…" com linhas-fantasma', async () => {
  const acesso = acessoDoAdministrador()
  acesso.segurarLista = true
  await irParaAdministracao(acesso)
  expect(await screen.findByText('Carregando usuários…')).toBeTruthy()
  expect(document.querySelectorAll('.linha-fantasma').length).toBeGreaterThan(0)
})

test('a tabela mostra nome, e-mail, perfil e situação em pílula com texto', async () => {
  await irParaAdministracao(acessoDoAdministrador())
  const tabela = await screen.findByRole('table')
  const linhas = within(tabela).getAllByRole('row').slice(1).map((linha) => linha.textContent)
  expect(linhas[0]).toContain('nova.teste@ccivil.pr.gov.br')
  expect(linhas[0]).toContain('Aguardando primeiro acesso')
  expect(linhas[1]).toContain('Carla Teste')
  expect(linhas[1]).toContain('Administrador')
  expect(linhas[1]).toContain('Ativo')
  expect(linhas[2]).toContain('Inativo')
  expect(within(tabela).getByRole('img', { name: 'Bruno Teste' }).textContent).toBe('BT')
})

test('se a lista falha, mostra o erro e recupera com Tentar de novo', async () => {
  const acesso = acessoDoAdministrador()
  acesso.falharLista = true
  await irParaAdministracao(acesso)
  expect(await screen.findByText('Não foi possível carregar os usuários. Verifique a conexão e tente de novo.')).toBeTruthy()
  acesso.falharLista = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('table')).toBeTruthy()
})
```

- [x] **4.2 Ver falhar:** `npx vitest run src/App`.
- [x] **4.3 Implementar a navegação.** `src/components/moldura/areas.ts`:

```ts
export type AreaDoSistema = 'quadro' | 'lista' | 'setores' | 'reunioes' | 'painel' | 'administracao'
// As demais áreas ganham tela na sua funcionalidade; até lá o botão delas não faz nada.
export type AreaComTela = Extract<AreaDoSistema, 'quadro' | 'administracao'>

export function temTela(area: AreaDoSistema): area is AreaComTela {
  return area === 'quadro' || area === 'administracao'
}
```

  `src/hooks/useAreaAtual.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import type { AreaComTela } from '../components/moldura/areas'

// A área fica no endereço (#/administracao) para sobreviver ao recarregar a página.
function areaDoEndereco(): AreaComTela {
  return window.location.hash === '#/administracao' ? 'administracao' : 'quadro'
}

export function useAreaAtual(): [AreaComTela, (area: AreaComTela) => void] {
  const [area, setArea] = useState(areaDoEndereco)

  useEffect(() => {
    const aoMudarEndereco = () => setArea(areaDoEndereco())
    window.addEventListener('hashchange', aoMudarEndereco)
    return () => window.removeEventListener('hashchange', aoMudarEndereco)
  }, [])

  const irPara = useCallback((nova: AreaComTela) => {
    setArea(nova)
    window.location.hash = `#/${nova}`
  }, [])

  return [area, irPara]
}
```

  `FaixaLateral.tsx` (o tipo `AreaDoSistema` sai daqui para `./areas`; `Moldura` passa a importá-lo de lá):

```tsx
import { Icone, type NomeIcone } from '../Icone'
import { temTela, type AreaComTela, type AreaDoSistema } from './areas'

type ItemDaFaixa = { area: AreaDoSistema; icone: NomeIcone; rotulo: string }

const ITENS: ItemDaFaixa[] = [ /* os seis itens de hoje, sem mudança */ ]

type FaixaLateralProps = {
  areaAtual: AreaDoSistema
  mostrarAdministracao: boolean
  aoIrPara: (area: AreaComTela) => void
}

// Só Quadro e Administração têm tela por enquanto; as outras áreas ganham tela na sua funcionalidade.
export function FaixaLateral({ areaAtual, mostrarAdministracao, aoIrPara }: FaixaLateralProps) {
  const itens = mostrarAdministracao ? ITENS : ITENS.filter((item) => item.area !== 'administracao')
  return (
    <nav className="faixa-lateral" aria-label="Áreas do sistema">
      {itens.map(({ area, icone, rotulo }) => (
        <button
          key={area}
          type="button"
          className="faixa-item"
          aria-label={rotulo}
          title={rotulo}
          aria-current={area === areaAtual ? 'page' : undefined}
          onClick={temTela(area) ? () => aoIrPara(area) : undefined}
        >
          <Icone nome={icone} />
        </button>
      ))}
    </nav>
  )
}
```

  (`/* os seis itens de hoje */` quer dizer: manter a constante `ITENS` exatamente como está no arquivo.)

  `Moldura`: nova prop `aoIrPara`; passa `mostrarAdministracao={usuario.perfil === 'administrador'}` à faixa e `mostrarAlternancia={areaAtual === 'quadro'}` à `BarraSuperior`, que só mostra o grupo Quadro/Lista quando `mostrarAlternancia` é verdadeiro.

  `App.tsx`:

```tsx
const TITULO_DA_AREA: Record<AreaComTela, string> = { quadro: 'Processos', administracao: 'Administração' }

function App({ acesso }: AppProps) {
  const { estado, entrar, sair, tentarDeNovo } = useEntrada(acesso)
  const [area, irPara] = useAreaAtual()
  if (estado.tipo !== 'dentro') {
    return <TelaDeEntrada estado={estado} aoEntrar={entrar} aoTentarDeNovo={tentarDeNovo} />
  }
  return (
    <Moldura areaAtual={area} aoIrPara={irPara} titulo={TITULO_DA_AREA[area]} usuario={estado.usuario} aoSair={sair}>
      {area === 'quadro' ? <QuadroVazio /> : <AreaDeAdministracao usuario={estado.usuario} acesso={acesso} />}
    </Moldura>
  )
}
```

- [x] **4.4 Implementar a lista.** `src/hooks/useUsuarios.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import type { LinhaDeUsuario, ModuloDeAcesso } from '../acesso/tipos'

export type EstadoDaLista = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronta'; linhas: LinhaDeUsuario[] }

export function useUsuarios(acesso: ModuloDeAcesso) {
  const [lista, setLista] = useState<EstadoDaLista>({ tipo: 'carregando' })

  // O estado só muda quando a lista responde (o inicial já é "carregando").
  const carregar = useCallback(() => {
    acesso.listarUsuarios().then((linhas) => setLista({ tipo: 'pronta', linhas }), () => setLista({ tipo: 'erro' }))
  }, [acesso])

  useEffect(carregar, [carregar])

  const tentarDeNovo = useCallback(() => {
    setLista({ tipo: 'carregando' })
    carregar()
  }, [carregar])

  // Depois de gravar, relê a lista: quem diz como ela ficou é o banco. A falha segue para quem chamou.
  const gravar = useCallback(async (alteracao: () => Promise<void>) => {
    await alteracao()
    carregar()
  }, [carregar])

  return { lista, tentarDeNovo, gravar }
}
```

  `src/components/administracao/AreaDeAdministracao.tsx`:

```tsx
import { rotuloDoPerfil } from '../../acesso/perfis'
import type { ModuloDeAcesso, UsuarioAtual } from '../../acesso/tipos'
import { AreaDeUsuarios } from './AreaDeUsuarios'
import './Administracao.css'

type AreaDeAdministracaoProps = { usuario: UsuarioAtual; acesso: ModuloDeAcesso }

// Esconder o item da faixa é conveniência; quem protege os dados é a RLS de autorizacoes.
export function AreaDeAdministracao({ usuario, acesso }: AreaDeAdministracaoProps) {
  if (usuario.perfil !== 'administrador') {
    return (
      <p className="administracao-sem-permissao">
        Seu perfil ({rotuloDoPerfil(usuario.perfil)}) não permite administrar usuários. Peça a um administrador para
        mudar seu perfil.
      </p>
    )
  }
  return <AreaDeUsuarios acesso={acesso} />
}
```

  `src/components/administracao/AreaDeUsuarios.tsx` (nesta tarefa, só título e lista; formulário e ações entram na tarefa 5):

```tsx
import type { ModuloDeAcesso } from '../../acesso/tipos'
import { useUsuarios } from '../../hooks/useUsuarios'
import { ListaDeUsuarios } from './ListaDeUsuarios'

type AreaDeUsuariosProps = { acesso: ModuloDeAcesso }

export function AreaDeUsuarios({ acesso }: AreaDeUsuariosProps) {
  const { lista, tentarDeNovo } = useUsuarios(acesso)
  return (
    <section className="administracao" aria-labelledby="titulo-usuarios">
      <h2 id="titulo-usuarios" className="administracao-titulo">Usuários</h2>
      <ListaDeUsuarios lista={lista} aoTentarDeNovo={tentarDeNovo} />
    </section>
  )
}
```

  `src/components/administracao/ListaDeUsuarios.tsx`:

```tsx
import { rotuloDoPerfil } from '../../acesso/perfis'
import type { LinhaDeUsuario, SituacaoDoUsuario } from '../../acesso/tipos'
import type { EstadoDaLista } from '../../hooks/useUsuarios'
import { Avatar } from '../Avatar'
import { Pilula, type SituacaoPilula } from '../Pilula'

const ROTULO_DA_SITUACAO: Record<SituacaoDoUsuario, string> = {
  ativo: 'Ativo', inativo: 'Inativo', aguardando: 'Aguardando primeiro acesso',
}
const PILULA_DA_SITUACAO: Record<SituacaoDoUsuario, SituacaoPilula> = {
  ativo: 'aprovado', inativo: 'neutra', aguardando: 'informativa',
}
const LINHAS_FANTASMA = 3

type ListaDeUsuariosProps = { lista: EstadoDaLista; aoTentarDeNovo: () => void }

export function ListaDeUsuarios({ lista, aoTentarDeNovo }: ListaDeUsuariosProps) {
  if (lista.tipo === 'erro') {
    return (
      <div className="administracao-erro" role="alert">
        <p>Não foi possível carregar os usuários. Verifique a conexão e tente de novo.</p>
        <button type="button" className="botao botao-secundario" onClick={aoTentarDeNovo}>Tentar de novo</button>
      </div>
    )
  }
  return (
    <table className="tabela-usuarios" aria-busy={lista.tipo === 'carregando'}>
      {lista.tipo === 'carregando' && <caption>Carregando usuários…</caption>}
      <thead>
        <tr>
          <th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th>
          <th scope="col">Situação</th><th scope="col"><span className="visualmente-oculto">Ações</span></th>
        </tr>
      </thead>
      <tbody>
        {lista.tipo === 'carregando'
          ? Array.from({ length: LINHAS_FANTASMA }, (_, i) => <LinhaFantasma key={i} />)
          : lista.linhas.map((linha) => <LinhaDaTabela key={linha.chave} linha={linha} />)}
      </tbody>
    </table>
  )
}

function LinhaFantasma() {
  return (
    <tr className="linha-fantasma" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => <td key={i}><span className="fantasma-barra" /></td>)}
    </tr>
  )
}

function LinhaDaTabela({ linha }: { linha: LinhaDeUsuario }) {
  return (
    <tr>
      <td>
        <span className="tabela-usuarios-nome">
          {linha.nome && <Avatar nome={linha.nome} fotoUrl={linha.fotoUrl ?? undefined} tamanho={24} />}
          {linha.nome ?? '—'}
        </span>
      </td>
      <td>{linha.email}</td>
      <td>{rotuloDoPerfil(linha.perfil)}</td>
      <td><Pilula situacao={PILULA_DA_SITUACAO[linha.situacao]}>{ROTULO_DA_SITUACAO[linha.situacao]}</Pilula></td>
      <td />
    </tr>
  )
}
```

  `src/components/administracao/Administracao.css` (tokens de `src/styles/tokens.css`):

```css
.administracao {
  display: grid;
  gap: var(--esp-4);
  padding: var(--esp-5);
  max-width: 1100px;
}

.administracao-titulo {
  font-size: var(--tam-pagina);
  margin: 0;
}

.administracao-sem-permissao,
.administracao-erro,
.administracao-falha {
  padding: var(--esp-3) var(--esp-4);
  border-radius: var(--canto);
  background: var(--pendencia-fundo);
  border: 1px solid var(--pendencia-borda);
  color: var(--texto);
}

.administracao-sem-permissao {
  margin: var(--esp-5);
  max-width: 60ch;
}

.tabela-usuarios {
  width: 100%;
  border-collapse: collapse;
  background: var(--folha);
  font-size: var(--tam-secundario);
}

.tabela-usuarios caption {
  text-align: left;
  padding-bottom: var(--esp-2);
  color: var(--texto-2);
}

.tabela-usuarios th {
  text-align: left;
  font-size: var(--tam-rotulo);
  color: var(--texto-2);
  font-weight: 600;
}

.tabela-usuarios th,
.tabela-usuarios td {
  padding: var(--esp-2) var(--esp-3);
  border-bottom: 1px solid var(--linha);
  vertical-align: middle;
}

.tabela-usuarios-nome {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2);
}

.fantasma-barra {
  display: block;
  height: 12px;
  border-radius: var(--canto);
  background: var(--linha);
}

.visualmente-oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

- [x] **4.5 Ver passar:** `npm test`, `npm run typecheck`, `npm run lint`.
- [x] **4.6 Commit:** `Mostra Administração > Usuários só ao administrador`.

---

### Tarefa 5: Autorizar, mudar perfil e excluir na tela (critérios 7, 8 e 9)

**Consome:** `useUsuarios().gravar`, `ListaDeUsuarios`, `problemaNoEmail`, `normalizarEmail`, `PERFIS` (tarefas 2 e 4).
**Produz:** `SeletorDePerfil` (`{ id?: string; rotulo?: string; valor: Perfil; aoMudar(perfil: Perfil): void }`) e `FormularioDeAutorizacao` (`{ aoAutorizar(email: string, perfil: Perfil): Promise<void> }`).

- [x] **5.1 Testes que falham.** Criar `src/App.autorizacoes.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const AGUARDANDO = 'nova.teste@ccivil.pr.gov.br'

async function abrirComo() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [{ chave: AGUARDANDO, nome: null, email: AGUARDANDO, fotoUrl: null, perfil: 'consulta', situacao: 'aguardando' }]
  render(<App acesso={acesso} />)
  await screen.findByRole('table')
  return acesso
}

function formulario() {
  return within(screen.getByRole('form', { name: 'Autorizar e-mail' }))
}

test('autorizar um e-mail o põe na lista como aguardando e limpa o formulário', async () => {
  const acesso = await abrirComo()
  expect((formulario().getByLabelText('Perfil') as HTMLSelectElement).value).toBe('consulta')
  fireEvent.change(formulario().getByLabelText('E-mail'), { target: { value: ' Pessoa.Teste@CCivil.pr.gov.br ' } })
  fireEvent.change(formulario().getByLabelText('Perfil'), { target: { value: 'integrante_ep' } })
  fireEvent.click(formulario().getByRole('button', { name: 'Autorizar' }))
  expect(await screen.findByText('pessoa.teste@ccivil.pr.gov.br')).toBeTruthy()
  expect(acesso.linhas[0]).toMatchObject({ email: 'pessoa.teste@ccivil.pr.gov.br', perfil: 'integrante_ep' })
  expect((formulario().getByLabelText('E-mail') as HTMLInputElement).value).toBe('')
})

test('e-mail fora do formato é recusado na tela, sem chamar o banco', async () => {
  const acesso = await abrirComo()
  fireEvent.change(formulario().getByLabelText('E-mail'), { target: { value: 'pessoa@gmail.com' } })
  fireEvent.click(formulario().getByRole('button', { name: 'Autorizar' }))
  expect(await formulario().findByText(
    'O e-mail "pessoa@gmail.com" não está no formato esperado: nome@ccivil.pr.gov.br.')).toBeTruthy()
  expect(acesso.linhas).toHaveLength(1)
})

test('falha ao autorizar mostra o motivo e mantém o que foi digitado', async () => {
  const acesso = await abrirComo()
  acesso.falhaDeGravacao = `o e-mail ${AGUARDANDO} já está autorizado`
  fireEvent.change(formulario().getByLabelText('E-mail'), { target: { value: AGUARDANDO } })
  fireEvent.change(formulario().getByLabelText('Perfil'), { target: { value: 'administrador' } })
  fireEvent.click(formulario().getByRole('button', { name: 'Autorizar' }))
  expect(await formulario().findByText(
    `A alteração não foi salva: o e-mail ${AGUARDANDO} já está autorizado. Seus dados continuam no formulário.`)).toBeTruthy()
  expect((formulario().getByLabelText('E-mail') as HTMLInputElement).value).toBe(AGUARDANDO)
  expect((formulario().getByLabelText('Perfil') as HTMLSelectElement).value).toBe('administrador')
})

test('muda o perfil de uma autorização aguardando', async () => {
  const acesso = await abrirComo()
  fireEvent.change(screen.getByLabelText(`Perfil de ${AGUARDANDO}`), { target: { value: 'integrante_ep' } })
  await screen.findByDisplayValue('Integrante do EP')
  expect(acesso.linhas[0].perfil).toBe('integrante_ep')
})

test('falha ao mudar o perfil mostra o motivo e mantém o perfil anterior', async () => {
  const acesso = await abrirComo()
  acesso.falhaDeGravacao = 'seu perfil não permite esta alteração'
  fireEvent.change(screen.getByLabelText(`Perfil de ${AGUARDANDO}`), { target: { value: 'administrador' } })
  expect(await screen.findByText('A alteração não foi salva: seu perfil não permite esta alteração.')).toBeTruthy()
  expect((screen.getByLabelText(`Perfil de ${AGUARDANDO}`) as HTMLSelectElement).value).toBe('consulta')
})

test('exclui uma autorização aguardando', async () => {
  const acesso = await abrirComo()
  fireEvent.click(screen.getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` }))
  await waitFor(() => expect(screen.queryByText(AGUARDANDO)).toBeNull())
  expect(acesso.linhas).toHaveLength(0)
})

test('falha ao excluir mostra o motivo e mantém a linha', async () => {
  const acesso = await abrirComo()
  acesso.falhaDeGravacao = `a autorização de ${AGUARDANDO} não foi encontrada (pode já ter sido usada no primeiro acesso)`
  fireEvent.click(screen.getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` }))
  expect(await screen.findByText(`A alteração não foi salva: ${acesso.falhaDeGravacao}.`)).toBeTruthy()
  expect(screen.getByText(AGUARDANDO)).toBeTruthy()
})

test('usuário que já entrou não tem seletor de perfil nem Excluir neste ticket', async () => {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [{ chave: 'u1', nome: 'Ana Teste', email: 'ana.teste@ccivil.pr.gov.br', fotoUrl: null,
    perfil: 'consulta', situacao: 'ativo' }]
  render(<App acesso={acesso} />)
  await screen.findByRole('table')
  expect(screen.queryByLabelText('Perfil de ana.teste@ccivil.pr.gov.br')).toBeNull()
  expect(screen.queryByRole('button', { name: /Excluir autorização/ })).toBeNull()
})
```

- [x] **5.2 Ver falhar:** `npx vitest run src/App.autorizacoes.test.tsx`.
- [x] **5.3 Implementar.** `src/components/administracao/SeletorDePerfil.tsx`:

```tsx
import { PERFIS, rotuloDoPerfil } from '../../acesso/perfis'
import type { Perfil } from '../../acesso/tipos'

type SeletorDePerfilProps = { id?: string; rotulo?: string; valor: Perfil; aoMudar: (perfil: Perfil) => void }

export function SeletorDePerfil({ id, rotulo, valor, aoMudar }: SeletorDePerfilProps) {
  return (
    <select id={id} aria-label={rotulo} className="seletor-perfil" value={valor}
      onChange={(evento) => aoMudar(evento.target.value as Perfil)}>
      {PERFIS.map((perfil) => <option key={perfil} value={perfil}>{rotuloDoPerfil(perfil)}</option>)}
    </select>
  )
}
```

  `src/components/administracao/FormularioDeAutorizacao.tsx`:

```tsx
import { type FormEvent, useId, useState } from 'react'
import { normalizarEmail, problemaNoEmail } from '../../acesso/emailInstitucional'
import type { Perfil } from '../../acesso/tipos'
import { SeletorDePerfil } from './SeletorDePerfil'

type FormularioDeAutorizacaoProps = { aoAutorizar: (email: string, perfil: Perfil) => Promise<void> }

// noValidate: a mensagem de formato é a nossa (com o valor digitado), não a do navegador.
export function FormularioDeAutorizacao({ aoAutorizar }: FormularioDeAutorizacaoProps) {
  const [email, setEmail] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('consulta')
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const idDoEmail = useId()
  const idDoPerfil = useId()

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const problema = problemaNoEmail(email)
    setAviso(problema)
    if (problema) return
    setEnviando(true)
    try {
      await aoAutorizar(normalizarEmail(email), perfil)
      setEmail('')
      setPerfil('consulta')
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro)
      setAviso(`A alteração não foi salva: ${motivo}. Seus dados continuam no formulário.`)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="form-autorizacao" aria-label="Autorizar e-mail" noValidate onSubmit={enviar}>
      <h3 className="form-autorizacao-titulo">Autorizar e-mail</h3>
      <label htmlFor={idDoEmail}>E-mail</label>
      <input id={idDoEmail} type="email" value={email} placeholder="nome@ccivil.pr.gov.br" autoComplete="off"
        aria-invalid={aviso !== null} onChange={(evento) => setEmail(evento.target.value)} />
      <label htmlFor={idDoPerfil}>Perfil</label>
      <SeletorDePerfil id={idDoPerfil} valor={perfil} aoMudar={setPerfil} />
      <button type="submit" className="botao botao-principal" disabled={enviando}>Autorizar</button>
      {aviso && <p className="administracao-falha" role="alert">{aviso}</p>}
    </form>
  )
}
```

  `AreaDeUsuarios.tsx` passa a ser:

```tsx
import { useState } from 'react'
import type { ModuloDeAcesso } from '../../acesso/tipos'
import { useUsuarios } from '../../hooks/useUsuarios'
import { FormularioDeAutorizacao } from './FormularioDeAutorizacao'
import { ListaDeUsuarios } from './ListaDeUsuarios'

type AreaDeUsuariosProps = { acesso: ModuloDeAcesso }

export function AreaDeUsuarios({ acesso }: AreaDeUsuariosProps) {
  const { lista, tentarDeNovo, gravar } = useUsuarios(acesso)
  const [falhaNaLinha, setFalhaNaLinha] = useState<string | null>(null)

  // Ações de linha não têm formulário: a falha aparece acima da tabela, e a linha continua como estava.
  const gravarNaLinha = (alteracao: () => Promise<void>) => {
    setFalhaNaLinha(null)
    gravar(alteracao).catch((erro: unknown) => setFalhaNaLinha(erro instanceof Error ? erro.message : String(erro)))
  }

  return (
    <section className="administracao" aria-labelledby="titulo-usuarios">
      <h2 id="titulo-usuarios" className="administracao-titulo">Usuários</h2>
      <FormularioDeAutorizacao aoAutorizar={(email, perfil) => gravar(() => acesso.autorizarEmail(email, perfil))} />
      {falhaNaLinha && <p className="administracao-falha" role="alert">A alteração não foi salva: {falhaNaLinha}.</p>}
      <ListaDeUsuarios lista={lista} aoTentarDeNovo={tentarDeNovo}
        aoMudarPerfil={(email, perfil) => gravarNaLinha(() => acesso.mudarPerfilDaAutorizacao(email, perfil))}
        aoExcluir={(email) => gravarNaLinha(() => acesso.excluirAutorizacao(email))} />
    </section>
  )
}
```

  `ListaDeUsuarios.tsx`: acrescentar às props `aoMudarPerfil: (email: string, perfil: Perfil) => void` e `aoExcluir: (email: string) => void`, repassá-las a `LinhaDaTabela`, e nas linhas `aguardando` trocar a célula de perfil e a de ações:

```tsx
      <td>
        {linha.situacao === 'aguardando'
          ? <SeletorDePerfil rotulo={`Perfil de ${linha.email}`} valor={linha.perfil}
              aoMudar={(perfil) => aoMudarPerfil(linha.email, perfil)} />
          : rotuloDoPerfil(linha.perfil)}
      </td>
      <td><Pilula situacao={PILULA_DA_SITUACAO[linha.situacao]}>{ROTULO_DA_SITUACAO[linha.situacao]}</Pilula></td>
      <td>
        {linha.situacao === 'aguardando' && (
          <button type="button" className="botao botao-secundario" aria-label={`Excluir autorização de ${linha.email}`}
            onClick={() => aoExcluir(linha.email)}>
            Excluir
          </button>
        )}
      </td>
```

  Em `Administracao.css`, acrescentar:

```css
.form-autorizacao {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-2) var(--esp-3);
  padding: var(--esp-4);
  background: var(--folha);
  border: 1px solid var(--linha);
  border-radius: var(--canto);
}

.form-autorizacao-titulo {
  flex-basis: 100%;
  margin: 0;
  font-size: var(--tam-base);
}

.form-autorizacao input {
  min-width: 28ch;
}

.form-autorizacao input,
.seletor-perfil {
  font: inherit;
  padding: var(--esp-1) var(--esp-2);
  border: 1px solid var(--linha);
  border-radius: var(--canto-botao);
  background: var(--folha);
  color: var(--texto);
}

.form-autorizacao .administracao-falha {
  flex-basis: 100%;
  margin: 0;
}
```

- [x] **5.4 Ver passar:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:circular`.
- [x] **5.5 Commit:** `Autoriza, muda o perfil e exclui autorizações pela tela`.

---

### Tarefa 6: Conferência final

- [x] **6.1** `npm run test:coverage` (≥ 70%), `npm run typecheck`, `npm run lint`, `npm run check:circular`, todos passando.
- [x] **6.2 Olhar a tela.** Subir `npm run dev` em segundo plano e abrir no navegador interno só a tela de entrada (entrar pelo Google é do usuário). Pedir ao usuário, logado como administrador no dev: abrir Administração; autorizar um e-mail inventado `@ccivil.pr.gov.br`; mudar o perfil dele; excluí-lo; tentar `pessoa@gmail.com` e um e-mail já autorizado; conferir as pílulas com texto e cor. Depois, no SQL Editor, `select acao, autor_id is not null as tem_autor, detalhes from public.eventos where entidade = 'autorizacao' order by id desc limit 5;` deve mostrar `excluir_autorizacao`, `mudar_perfil`, `autorizar` com autor.
- [x] **6.3** Marcar os critérios do ticket que passaram e anotar na spec, se algo mudou na execução (com a data).
- [x] **6.4 Commit** do plano e do ticket marcados.

## Retomada (2026-10-07)

Parado no passo 6.2, por decisão do usuário (opção A): o teste na tela espera o usuário estar no computador (a entrada pelo Google é dele; o navegador embutido não tinha sessão). Tarefas 1 a 5 e 6.1 concluídas e commitadas na branch `login-perfis` (não juntada à `main`): 390 testes de tela, cobertura 95%, testes de banco 04 (29/29), 02 (10/10) e 03 (12/12) passando no dev pelo SQL Editor.

Para continuar: `git switch login-perfis`, conferir que o servidor de desenvolvimento atende em `http://localhost:5173` (o retorno do Google está configurado para essa porta), pedir ao usuário os 6 passos do 6.2 e a consulta de eventos, depois 6.3, 6.4 e o passo 4 do `/executar-complexo` (juntar à `main`, `git branch -d`, linha `Concluído em` no ticket 02).

Pendência fora do projeto: um rascunho `tmp_perfis.txt` ficou na raiz do Git Bash; a trava não deixou apagar. Sem conteúdo sensível; o usuário apaga.

Retomado em 2026-10-08: 6.2 feito pelo usuário em `http://localhost:5173` (passos 1 a 6 passaram; pílulas de situação com cor e texto, perfil em texto simples, como na spec). Consulta de eventos mostrou `excluir_autorizacao`, `mudar_perfil` e `autorizar`, todos com autor e com antes/depois. `npm test` passou em quatro rodadas seguidas (390); a falha intermitente de "Excluir" não se repetiu. Spec sem mudança na execução.
