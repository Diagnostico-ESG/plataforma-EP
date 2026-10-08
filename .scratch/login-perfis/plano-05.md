# Ticket 05 (Foto acompanha a conta Google) — plano de execução

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque `- [x]` ao concluir cada passo.

**Objetivo:** a cada entrada pelo Google, o banco copia o link da foto da conta para `usuarios.foto_url`, sem mexer no nome e sem registrar evento.

**Arquitetura:** um gatilho depois de alterar `auth.users` (só quando `raw_user_meta_data` muda) chama uma função `security definer` em `private`, que atualiza `usuarios.foto_url` quando o link é outro. A interface já mostra as iniciais quando `foto_url` é nulo; nada muda em `src/`.

**Tecnologia:** Supabase (Postgres, pgTAP pelo SQL Editor).

**Requisitos:** `.scratch/login-perfis/issues/05-foto-acompanha-google.md` (critérios citados como "critério N", na ordem do ticket) e `.scratch/login-perfis/spec.md` (histórias 44 a 46; regra "A foto acompanha o Google a cada entrada"; linha de `foto_url` em "Quem pode o quê").

## Restrições globais

- Regras de `.claude/regras/banco.md` que valem aqui: teste antes da migração; regra de negócio no banco vira gatilho com TDD; função `security definer` só em schema não exposto (`private`), com `search_path` vazio e nomes qualificados, sem `execute` para `public`, `anon` e `authenticated`; migração já aplicada no dev não se edita; conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`) antes de qualquer comando no banco.
- Rede atual: só porta 443. Teste e migração vão pelo SQL Editor do projeto dev, **um arquivo por vez**, com o resultado esperado dito antes; `npm run db:types` funciona.
- Dados de teste inventados (`@ccivil.pr.gov.br` fictícios, links em `exemplo.invalido`). Nenhuma consulta de conferência com dado pessoal.

## Decisões de execução

- **Critério 1 (conferido em 2026-10-08, antes do plano):** no código do Supabase Auth (`internal/api/external.go`, caso "conta existe"), cada entrada por OAuth chama `user.UpdateUserMetaData(tx, identityData)`, que regrava `raw_user_meta_data` com os dados do Google. Vale seguir.
- **Ressalva da história 45 (achado, para o usuário decidir; vai para o `desvios.md`):** o `UpdateUserMetaData` *mescla*: chave ausente nos dados novos fica com o valor antigo; só chave com valor nulo é apagada. Além disso, o Google costuma mandar um link de imagem padrão (a letra colorida do Google) para quem não tem foto. Na prática, quem tira a foto do Google deve passar a ver a imagem padrão do Google, não as iniciais da plataforma. O gatilho trata o caso "sem foto" corretamente (fica nulo), mas esse caso dificilmente chega do Google. Opções a mostrar ao usuário no fim: (a) aceitar: a imagem padrão do Google cumpre o papel das iniciais (nada a fazer; recomendado); (b) reconhecer o link padrão do Google e tratar como sem foto (heurística frágil, o formato do link é do Google e pode mudar).
- **Mesma leitura do primeiro acesso:** `coalesce(avatar_url, picture)`, igual ao `private.registrar_primeiro_acesso()` do ticket 01.
- **Disparo:** `after update on auth.users ... when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)`; dentro, o `update` só acontece se o link for outro (`is distinct from`), para não gravar à toa. A função nunca lança erro: falha aqui faria a entrada falhar.
- **Sem evento:** `private.registrar_evento_do_usuario()` (ticket 03) só olha `nome`, `perfil` e `ativo`; a trava `private.conferir_alteracao_do_usuario()` roda no `update` e não barra (só age em perfil e situação). O teste confirma.
- **Critério 4:** já coberto pelo `05_gerir_usuarios.test.sql` ("update de `foto_url` recusado"); basta rodá-lo de novo.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/tests/07_foto_google.test.sql` (novo) | regra da foto, um caso por linha |
| `supabase/migrations/<data>_foto_acompanha_google.sql` (novo) | função e gatilho |
| `src/types/database.ts` (gerado) | sem mudança esperada |
| `supabase/AMBIENTES.md` (alterar) | migração aplicada à mão |

---

### Tarefa 1: Banco (critérios 1 a 5)

- [x] **1.1 Teste que falha.** Criar `supabase/tests/07_foto_google.test.sql`:

```sql
-- Foto acompanha a conta Google a cada entrada (login-perfis, ticket 05; ADR 0003).
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
insert into _tap (linha) select plan(6);

-- Usuários inventados: f1 ativo, com o nome corrigido pelo administrador; f2 inativo. Os dois entram com foto.
insert into public.autorizacoes (email, perfil) values
  ('foto.ativo.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('foto.inativo.teste@ccivil.pr.gov.br', 'consulta');
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'foto.ativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Foto Ativo", "picture": "https://exemplo.invalido/f1-antiga.png"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'foto.inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated',
   '{"full_name": "Foto Inativo", "picture": "https://exemplo.invalido/f2-antiga.png"}');
update public.usuarios set nome = 'Nome Corrigido' where id = '00000000-0000-0000-0000-0000000000f1';
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000f2';
create temp table _eventos_antes as select count(*) as total from public.eventos;

-- Cada entrada simula o Auth: regrava os dados do Google e a hora da entrada.
create function pg_temp.entrar(id_usuario uuid, dados jsonb) returns void
language sql as $$
  update auth.users set raw_user_meta_data = dados, last_sign_in_at = now() where id = id_usuario;
$$;
create function pg_temp.foto(id_usuario uuid) returns text
language sql as $$ select foto_url from public.usuarios where id = id_usuario $$;

select pg_temp.entrar('00000000-0000-0000-0000-0000000000f1',
  '{"full_name": "Nome do Google", "picture": "https://exemplo.invalido/f1-nova.png"}');
insert into _tap (linha) select is(pg_temp.foto('00000000-0000-0000-0000-0000000000f1'),
  'https://exemplo.invalido/f1-nova.png', 'link novo do Google atualiza a foto');
insert into _tap (linha) select is(
  (select nome from public.usuarios where id = '00000000-0000-0000-0000-0000000000f1'), 'Nome Corrigido',
  'a entrada não desfaz o nome corrigido pelo administrador');

select pg_temp.entrar('00000000-0000-0000-0000-0000000000f2',
  '{"full_name": "Foto Inativo", "picture": "https://exemplo.invalido/f2-nova.png"}');
insert into _tap (linha) select is(pg_temp.foto('00000000-0000-0000-0000-0000000000f2'),
  'https://exemplo.invalido/f2-nova.png', 'usuário inativo também tem a foto atualizada');

select pg_temp.entrar('00000000-0000-0000-0000-0000000000f2',
  '{"avatar_url": "https://exemplo.invalido/f2-avatar.png", "picture": "https://exemplo.invalido/f2-picture.png"}');
insert into _tap (linha) select is(pg_temp.foto('00000000-0000-0000-0000-0000000000f2'),
  'https://exemplo.invalido/f2-avatar.png', 'avatar_url vale antes de picture, como no primeiro acesso');

select pg_temp.entrar('00000000-0000-0000-0000-0000000000f1', '{"full_name": "Nome do Google"}');
insert into _tap (linha) select is(pg_temp.foto('00000000-0000-0000-0000-0000000000f1'), null::text,
  'dados do Google sem foto deixam a foto vazia (a tela mostra as iniciais)');

insert into _tap (linha) select is((select count(*) from public.eventos), (select total from _eventos_antes),
  'a troca de foto não registra evento');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

- [x] **1.2 Ver falhar.** Conferir o alvo. Pedir ao usuário que cole **só** o `07_foto_google.test.sql` no SQL Editor do projeto dev. Esperado: 4 de 6 `not ok` (foto nova, inativo, `avatar_url`, sem foto); "nome corrigido" e "não registra evento" já `ok`. Se vier tudo `ok`, parar: o teste não prova nada.
- [x] **1.3 Migração.** `npx supabase migration new foto_acompanha_google` e escrever:

```sql
-- Login e perfis, ticket 05 (ADR 0003): a foto acompanha a conta Google a cada entrada.
-- A cada entrada por OAuth, o Auth regrava raw_user_meta_data com os dados do Google (UpdateUserMetaData no
-- supabase/auth). Daqui só a foto vai para usuarios: o nome não acompanha, para não desfazer a correção do
-- administrador, e não há evento (registrar_evento_do_usuario só olha nome, perfil e ativo).
create function private.acompanhar_foto_do_google() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  foto_nova text := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
begin
  update public.usuarios set foto_url = foto_nova
    where id = new.id and foto_url is distinct from foto_nova;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

revoke execute on function private.acompanhar_foto_do_google() from public, anon, authenticated;

create trigger foto_acompanha_google after update on auth.users
  for each row when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function private.acompanhar_foto_do_google();
```

- [x] **1.4 Aplicar e ver passar.** Pedir ao usuário, um arquivo por vez: (a) a migração (esperado: "Success. No rows returned"); (b) `07_foto_google.test.sql` (esperado: 6 de 6 `ok`); (c) `05_gerir_usuarios.test.sql` (esperado: todos `ok`; ele cobre o critério 4 e simula uma entrada sem foto); (d) `02`, `03`, `04` e `06` (esperado: todos `ok`).
- [x] **1.5 Tipos e registro.** `npm run db:types` (esperado: nenhuma diferença em `src/types/database.ts`). Acrescentar em `supabase/AMBIENTES.md`: `- <data>_foto_acompanha_google (2026-10-08; testes 07, 05, 02, 03, 04 e 06 passaram pelo SQL Editor)`.
- [x] **1.6 Commit.** `git add supabase/tests/07_foto_google.test.sql supabase/migrations/*_foto_acompanha_google.sql supabase/AMBIENTES.md src/types/database.ts` e `git commit -m "Foto do usuário acompanha a conta Google a cada entrada"`.

### Tarefa 2: Conferência final

- [ ] **2.1 Testes da interface.** `npm test` (nada mudou em `src/`; esperado: todos passam).
- [ ] **2.2 Ponta a ponta** (critério 6; servidor na porta 5173, conferir antes quem ocupa a porta). Pedir ao usuário: (1) trocar a foto da conta Google; (2) na plataforma, Sair; (3) entrar de novo e ver a foto nova no avatar da barra superior. O Google pode levar alguns minutos para servir a foto nova. Nenhuma consulta SQL.
- [ ] **2.3 Registros.** Entrada datada no `.scratch/login-perfis/desvios.md` com a ressalva da história 45 e a escolha do usuário (ou a padrão, se ele não souber). Marcar os critérios do ticket 05.
- [ ] **2.4 Commit** dos registros.
