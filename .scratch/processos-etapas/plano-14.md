# Ticket 14 de processos-etapas ([Assumir], trava do autor e voltar com responsável) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dar o [Assumir] de um clique nas etapas sem responsável, fazer o banco recusar o autor da versão mais recente (não histórica) como responsável da Revisão interna e levar a escolha de responsável à janela de voltar a uma etapa.

**Architecture:** uma migração nova cria um gatilho que confere o autor quando o responsável da Revisão interna passa a ser alguém, e apaga e recria `voltar_a_etapa` com o parâmetro do responsável da etapa reaberta. O processo lido ganha `ultimaVersao` (número e autor da versão mais recente não histórica), e a tela usa esse dado para esconder o autor nas janelas e o [Assumir] dele; o banco continua sendo quem protege. A janela de voltar passa a ser a `JanelaDeAvanco` (campo "Motivo" + escolha), e o [Assumir] reaproveita `mudarResponsavelDaEtapa`.

**Tech Stack:** React + TypeScript, Vitest + Testing Library; pgTAP pelo GitHub Actions ("Testes de banco"); migração pelo workflow "Migrar banco de desenvolvimento".

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 40, 101 a 106; "Interface", "[Assumir]" e "Janela de avanço", item Voltar; mensagem de recusa nova; "Regras que o banco impõe", linha da trava do autor; "Migração da parte 2") · **Ticket:** `.scratch/processos-etapas/issues/14-assumir-trava-do-autor-e-voltar-com-responsavel.md`. Critérios citados como "critério N", na ordem do ticket: 1 migração, 2 pgTAP, 3 módulo, 4 [Assumir], 5 janela de avanço, 6 seletor, 7 janela de voltar, 8 testes com o aplicativo inteiro, 9 `AMBIENTES.md`. Porquê: ADR 0014; `CONTEXT.md`, "Assumir" e "Revisor".

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui:
  - estrutura muda só por migração nova (`npx supabase migration new`); o teste vem antes; migração, teste de banco e tipos no mesmo ticket;
  - **sem `security definer`** nas funções públicas; auxiliares e a função do gatilho em `private`, `search_path = ''`, nomes qualificados, `revoke execute … from public, anon` e `grant … to authenticated` (como as migrações 05, 06 e 13);
  - "não guarde o que se calcula": nenhuma tabela ou coluna nova; o autor da versão mais recente é lido de `versoes`;
  - a segurança está no banco (botão escondido não protege): a tela só esconde o autor, e o seletor continua mostrando a recusa do banco;
  - a interface fala com o banco só por `src/processos/` e pelo cliente de `src/lib/supabase.ts`; o `npm test` nunca depende do banco.
- Alvo conferido: a linha "vínculo atual" de `supabase/AMBIENTES.md` e `supabase/.temp/project-ref` são os dois `yclkzyoebpsxmgpbcbus` (desenvolvimento). O banco só é tocado pelos dois workflows, na branch, e pelo `db:types` (leitura).
- Funções de lógica `.ts` com 4 a 20 linhas (hooks em `src/hooks/`: até 40; componentes `.tsx` ficam fora desse limite, mas divididos por responsabilidade), arquivos até 300 linhas, complexidade até 10. Tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação. Comentários explicam o porquê.
- Só dados inventados. O workflow "Migrar banco de desenvolvimento" recebe só o nome do arquivo, sem a pasta.
- O pre-commit roda `typecheck` e a bateria inteira (cerca de 1 minuto); cada commit compila sozinho.
- TDD: um teste que falha por erro de digitação não conta como o "vermelho".
- Comece cada chamada do Bash com `cd` para a raiz do projeto.

## Decisões do plano

- **Gatilho, não função de conferência chamada à mão:** `before update of responsavel_id on public.andamentos`, função `private.conferir_autor_da_revisao_interna()`. Vale para todo caminho que muda o responsável (seletor, [Assumir], avanço, voltar) sem repetir a regra. Só confere quando o responsável passa a ser alguém e muda (`new.responsavel_id is not null and is distinct from old`), então deixar vazio, não mudar e o revisor que continua depois de enviar uma versão nova passam.
- **Etapa e versão:** a etapa é a de código `revisao_interna`; "a versão mais recente não histórica" é a de maior `numero` do processo com `historica = false` (o número é único por processo). Sem versão não histórica, ninguém é barrado.
- **Recusa:** `raise exception 'autor_da_versao:%:%', numero, nome` (número primeiro, para o nome poder ter qualquer caractere). A tela traduz para "{Nome} enviou a versão V{n} e não pode ser responsável pela Revisão interna.".
- **Voltar com responsável:** `drop function public.voltar_a_etapa(uuid, text)` e nova `public.voltar_a_etapa(p_andamento uuid, p_motivo text, p_responsavel uuid)`; `private.reabrir_etapa` ganha o parâmetro e grava `responsavel_id = p_responsavel` (null limpa). O gatilho de andamento pula as conferências na volta (`private.voltando()`), então `reabrir_etapa` chama `private.conferir_responsavel(p_responsavel, escolhido.responsavel_id)` antes (ativo, Administrador ou Integrante); a trava do autor é o gatilho novo e vale na volta também. As etapas seguintes que voltam a pendente continuam como estão (não mudam de responsável).
- **Testes antigos de voltar** (19 e 20) passam `null` como terceiro argumento; as asserções que dependiam de o responsável ficar na etapa reaberta são ajustadas ao que o `null` faz.
- **Dado novo no processo lido:** `ProcessoLido.ultimaVersao: UltimaVersao | null` (`{ numero, autorId, autorNome }`), obrigatório (o `tsc` aponta os fixtures; os que montam o `ProcessoLido` por inteiro ganham `ultimaVersao: null`). Lido em `lerProcessoSupabase` junto das etapas e da estrutura.
- **Lista por etapa:** função pura `usuariosParaAEtapa(etapa, usuarios, ultimaVersao)` tira o autor da lista quando a etapa é a Revisão interna. As janelas de avanço (a próxima) e de voltar (a reaberta) recebem a lista já filtrada; `responsavelMarcado` não muda, e o "pulando quem a trava barra" sai de graça. O seletor **não** filtra: escolher o autor mostra a recusa do banco e mantém o responsável (o `<select>` é controlado e a tela não recarrega na falha).
- **[Assumir]:** botão na `EdicaoDaEtapa`, ao lado do seletor, para etapa do processo pendente ou em andamento sem responsável; função pura `podeAssumir(etapa, usuarioId, ultimaVersao)`. Um clique chama `mudarResponsavelDaEtapa(etapa.id, usuarioId)`, que já gera "Mudou o responsável da etapa" no histórico. Só aparece para quem altera (a Consulta não vê a edição da etapa).
- **Voltar na `JanelaDeAvanco`:** `PedidoDeAvanco.acao` ganha `'voltar'` (com `proxima` = a própria etapa reaberta, para o `responsavelMarcado` servir sem mudança); `PedidoDeTexto.acao` fica só com `dispensar` e `realizada`. A janela ganha as props `rotuloDoCampo` (padrão "Nota"; "Motivo" ao voltar) e `pergunta` (padrão "Quem fica com a próxima etapa?"; "Quem fica com esta etapa?" ao voltar); `EscolhaDoResponsavel` recebe a pergunta.
- **Recusa no módulo:** `autor_da_versao` entra no `PADRAO_DA_RECUSA` e no `FRASE_DA_RECUSA` de `andamentosSupabase.ts`; a frase mora em `frasesDeVersao.ts`.
- **Falsa:** `conferirAutorDaRevisao(processo, etapa, responsavelId)` em `andamentoFalso.ts` (mesma regra e mesma frase do banco) é chamada no avanço (para a próxima), em `mudarResponsavelDaEtapa` e em `voltarParaEtapa`; a validação do responsável escolhido (`conferirAvanco`) é extraída para `conferirResponsavelEscolhido` e reaproveitada pelo voltar.
- **Tipos regenerados na Tarefa 3**, no commit seguinte ao da migração (a migração precisa estar no GitHub antes de o workflow aplicá-la). Mesmo desvio dos tickets 05 e 11 a 13.
- **Sem ensaio da migração em cópia de teste** (como nos tickets 12 e 13): a migração é uma transação; se falhar, nada é aplicado.

## Estrutura de arquivos

**Criar:** `supabase/tests/36_trava_do_autor.test.sql`; `supabase/migrations/<timestamp>_trava_do_autor_e_voltar_com_responsavel.sql`; `src/App.assumirEAutor.test.tsx`.

**Modificar (banco):** `supabase/tests/19_voltar_datas_responsavel.test.sql`, `supabase/tests/20_situacao_do_processo.test.sql`, `supabase/AMBIENTES.md`, `src/types/database.ts` (regenerado).

**Modificar (módulo):** `src/processos/{tipos,andamentosSupabase,lerProcessoSupabase,andamentoFalso,ProcessosFalso,caminhoDeEtapas,gravarAcoes,frasesDeVersao}.ts` e os testes `andamentosSupabase.test.ts`, `lerProcessoSupabase.test.ts`, `andamentoFalso.test.ts`, `caminhoDeEtapas.test.ts`, `ProcessosFalso.voltar.test.ts`, `ProcessosFalso.avanco.test.ts`, `ProcessosFalso.situacao.test.ts` e os fixtures que o `tsc` apontar (`src/testes/processosNosCadastros.tsx`).

**Modificar (tela):** `src/hooks/useAcoesDaEtapa.ts`; `src/components/processos/{CaminhoDeEtapas,CaminhoDoProcesso,EdicaoDaEtapa,JanelaDeAvanco,EscolhaDoResponsavel}.tsx`; `src/App.{voltarDatasResponsavel,avancoDaEtapa}.test.tsx` e o que o `npm test` apontar.

## Tarefas

### Tarefa 1 — Plano, marco e branch

- [x] Comitar este plano na `main` ("Plano do ticket 14 de processos-etapas").
- [x] Criar o marco `marco/2026-10-18-inicio-ticket-14-processos-etapas` (se o nome existir, `-2`) e enviá-lo ao GitHub com `git push origin "refs/tags/marco/*:refs/tags/marco/*"`.
- [x] `git switch -c processos-etapas-14` (branch comum, sem worktree).

### Tarefa 2 — Teste de banco que falha (critério 2)

**Files:** Create `supabase/tests/36_trava_do_autor.test.sql`.

- [x] Criar o teste, com a moldura do `35_avancar_etapa.test.sql` (`_tap`, `plan(33)`, os mesmos quatro usuários inventados a1 Administrador, a2 Integrante, a3 Consulta, a4 Administrador inativo, as funções `pg_temp.andamento`, `pg_temp.agir`, `pg_temp.status`) e do `27_versoes.test.sql` (`pg_temp.arquivo`, `pg_temp.par`), mais:
  - `pg_temp.processo(nome text) returns uuid` (id do processo pelo nome); `pg_temp.nome(id uuid) returns text` (`select nome from public.usuarios`); `pg_temp.enviar(nome_do_processo text)` = `select public.registrar_versao(pg_temp.processo(nome_do_processo), 1, null, pg_temp.par())` (o número é ignorado; sai o maior + 1); `pg_temp.escolher(nome_do_processo text, codigo text, usuario uuid)` = `update public.andamentos set responsavel_id = usuario where id = pg_temp.andamento(nome_do_processo, codigo)`; `pg_temp.responsavel(nome_do_processo, codigo) returns uuid`; todas com `grant execute … to authenticated`.
  - Quem envia a versão é quem está no `request.jwt.claims` (o `enviada_por` vem de `auth.uid()`): trocar com `select set_config('request.jwt.claims', '{"sub":"…a1","role":"authenticated"}', true)` entre os envios, como o teste 35 faz.
  - Seis processos inventados no setor `TS14`: `Autor Seletor`, `Avanco Autor`, `Volta Autor`, `Volta Vazio`, `Historica`, `Sem Versao`. Etapas: `modelagem`=1, `relatorio_modelagem_tecnica`=2, `revisao_interna`=3, `revisao_setor`=4, `aprovacao_setor`=5, `publicacao`=6.
- [x] Casos (33 asserções, cada uma `insert into _tap (linha) select …`; `n(x)` = `pg_temp.nome(x)`):
  1. **Autor Seletor** (a2 envia V1 e V2; a1 envia V3). Como a2:
     - (1) `throws_ok` de `escolher('Autor Seletor','revisao_interna',a1)`: `'P0001', 'autor_da_versao:3:' || n(a1)`; (2) responsável continua `null`;
     - (3) `lives_ok` de `escolher(…,a2)` (a2 enviou a V1 e a V2, não a mais recente); (4) responsável = a2;
     - (5) `lives_ok` de `escolher('Autor Seletor','modelagem',a1)` (a trava é só da Revisão interna);
     - (6) a2 envia a V4 (`lives_ok` de `enviar`); (7) o responsável da Revisão interna continua a2 (a trava confere só o momento da escolha);
     - (8) `lives_ok` de `escolher(…,null)`; (9) responsável `null` (deixar vazio é aceito).
  2. **Avanco Autor** (a1 envia V1; `agir` a etapa 1 em realizada anteriormente e iniciar a 2). Como a2:
     - (10) `throws_ok` de `avancar_etapa(<id da 2>, 'concluir', null, a1)`: `'P0001', 'autor_da_versao:1:' || n(a1)`; (11) a 2 continua `em_andamento`; (12) a 3 continua `pendente`, sem responsável;
     - (13) `lives_ok` do mesmo avanço com a2; (14) a 3 `em_andamento` com responsável a2.
  3. **Volta Autor** (a1 envia V1; etapas 1 a 3 resolvidas e a 4 em andamento): como a2:
     - (15) `throws_ok` de `voltar_a_etapa(<id da 3>, 'Refazer', a1)`: `'P0001', 'autor_da_versao:1:' || n(a1)`; (16) a 3 continua resolvida; (17) a 4 continua `em_andamento` (nada mudou);
     - (18) `lives_ok` de `voltar_a_etapa(<id da 3>, 'Refazer', a2)`; (19) a 3 `em_andamento`; (20) responsável da 3 = a2; (21) a 4 voltou a `pendente`;
     - (22) o evento `voltar` mais recente da 3 traz `detalhes -> 'depois' ->> 'responsavel_nome'` = `n(a2)`.
  4. **Volta Vazio** (etapas 1 e 2 resolvidas; `escolher(…,'relatorio_modelagem_tecnica',a2)` antes de resolvê-la, para ela ter responsável):
     - (23) `throws_ok` de `voltar_a_etapa(<id da 2>, 'Motivo', a3)`: `'P0001', 'responsavel_invalido:' || n(a3)` (Consulta); (24) o mesmo com a4 (inativo) e `n(a4)`;
     - (25) `lives_ok` de `voltar_a_etapa(<id da 2>, 'Motivo', null)`; (26) responsável da 2 `is(…, null::uuid)` (o `null` limpa o que a etapa tinha).
  5. **Historica** (a1 envia a histórica `registrar_versao_historica(pg_temp.processo('Historica'), 1, null, jsonb_build_array(pg_temp.arquivo('bpm','bpm')))`; a2 envia a V2 não histórica):
     - (27) `lives_ok` de `escolher('Historica','revisao_interna',a1)` (autor de versão histórica aceito); (28) `throws_ok` de `escolher(…,a2)`: `'P0001', 'autor_da_versao:2:' || n(a2)`.
  6. **Sem Versao:** (29) `lives_ok` de `escolher('Sem Versao','revisao_interna',a1)`.
  7. **A função nova** (`reset role` antes): (30) `is((select count(*)::int from pg_proc where proname = 'voltar_a_etapa' and pronamespace = 'public'::regnamespace), 1, 'só existe a assinatura nova de voltar_a_etapa')`; (31) `has_function_privilege('anon', 'public.voltar_a_etapa(uuid, text, uuid)', 'execute')` = `false`; (32) o mesmo para `authenticated` = `true`; (33) `prosecdef` de `public.voltar_a_etapa` = `false`.
  - Terminar com `finish()` e o `do $$ … raise exception … $$` do relatório, como no teste 35.
- [x] Comitar na branch ("Ticket 14 de processos-etapas: teste de banco da trava do autor"). O pre-commit só roda a bateria da tela.
- [x] `git push -u origin processos-etapas-14` (sem `--force`).
- [x] Disparar o workflow "Testes de banco" na branch `processos-etapas-14`, pelo navegador do app (`anthropic-skills:built-in-browser`; não há `gh`; o usuário já entrou no GitHub; o formulário do botão é `/actions/manual`, com o campo `branch`, como no ticket 13). Esperado: **só o teste 36 falha**, pelas asserções que dependem da função e do gatilho novos (e as chamadas de `voltar_a_etapa` com 3 argumentos não acham a função); os 35 arquivos anteriores passam (os testes 19 e 20 ainda estão com 2 argumentos). Se o 36 falhar por outro motivo (digitação, usuário, plano), corrigir e repetir.

### Tarefa 3 — Migração, aplicação e tipos (critérios 1 e 9)

**Files:** Create `supabase/migrations/<timestamp>_trava_do_autor_e_voltar_com_responsavel.sql`; Modify `supabase/tests/{19_voltar_datas_responsavel,20_situacao_do_processo}.test.sql`, `supabase/AMBIENTES.md`, `src/types/database.ts`.

- [x] `npx supabase migration new trava_do_autor_e_voltar_com_responsavel` e preencher:

```sql
-- Trava do autor na Revisão interna e voltar com responsável (processos-etapas, ticket 14, ADR 0014). Não destrutiva:
-- nenhuma tabela ou coluna muda. As recusas chegam à interface como "motivo:valor" em P0001
-- (src/processos/andamentosSupabase.ts).

-- Ninguém revisa o próprio trabalho: quem enviou a versão mais recente não histórica não pode passar a ser o
-- responsável da Revisão interna. Só confere quando o responsável passa a ser alguém e muda, para o revisor que
-- continua e envia uma versão nova não perder a etapa e para deixar vazio ser sempre aceito.
create function private.conferir_autor_da_revisao_interna() returns trigger
language plpgsql set search_path = ''
as $$
declare
  ultima record;
begin
  if new.responsavel_id is null or new.responsavel_id is not distinct from old.responsavel_id then
    return new;
  end if;
  if (select codigo from public.etapas where id = new.etapa_id) <> 'revisao_interna' then
    return new;
  end if;
  select v.numero, v.enviada_por, u.nome into ultima
  from public.versoes v join public.usuarios u on u.id = v.enviada_por
  where v.processo_id = new.processo_id and not v.historica
  order by v.numero desc limit 1;
  if found and ultima.enviada_por = new.responsavel_id then
    raise exception 'autor_da_versao:%:%', ultima.numero, ultima.nome;
  end if;
  return new;
end $$;

create trigger conferir_autor_da_revisao_interna before update of responsavel_id on public.andamentos
  for each row execute function private.conferir_autor_da_revisao_interna();

-- Voltar leva o responsável da etapa reaberta (null: ninguém). O gatilho de andamento não confere o responsável na
-- volta (private.voltando()), então a conferência de ativo/perfil é feita aqui; a trava do autor é o gatilho acima.
drop function public.voltar_a_etapa(uuid, text);
drop function private.reabrir_etapa(public.andamentos);

create function private.reabrir_etapa(escolhido public.andamentos, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  perform private.conferir_responsavel(p_responsavel, escolhido.responsavel_id);
  update public.andamentos
  set status = 'em_andamento', nota = null, resolvida_em = null, iniciada_em = coalesce(iniciada_em, current_date),
    responsavel_id = p_responsavel
  where id = escolhido.id;
  if not found then
    raise exception 'sem permissão para voltar a etapa' using errcode = '42501';
  end if;
end $$;

create function public.voltar_a_etapa(p_andamento uuid, p_motivo text, p_responsavel uuid) returns void
language plpgsql set search_path = ''
as $$
declare
  motivo text := nullif(btrim(p_motivo), '');
  escolhido public.andamentos;
begin
  if motivo is null then
    raise exception 'motivo_obrigatorio';
  end if;
  select * into escolhido from public.andamentos where id = p_andamento;
  if not found then
    raise exception 'registro_inexistente';
  end if;
  perform private.conferir_etapa_resolvida(escolhido);
  perform set_config('ep.voltando', 'on', true), set_config('ep.motivo_da_volta', motivo, true);
  perform private.devolver_etapas_seguintes(escolhido);
  perform private.reabrir_etapa(escolhido, p_responsavel);
  perform set_config('ep.voltando', 'off', true), set_config('ep.motivo_da_volta', '', true);
end $$;

revoke execute on function private.conferir_autor_da_revisao_interna(), private.reabrir_etapa(public.andamentos, uuid),
  public.voltar_a_etapa(uuid, text, uuid) from public, anon;
grant execute on function private.conferir_autor_da_revisao_interna(), private.reabrir_etapa(public.andamentos, uuid),
  public.voltar_a_etapa(uuid, text, uuid) to authenticated;
```

- [x] Nos testes 19 e 20, acrescentar `, null` como terceiro argumento de cada `voltar_a_etapa(...)` (11 chamadas no 19, 1 no 20; a chamada com o id zerado também). Antes de comitar, ler as asserções do 19 sobre o responsável da etapa reaberta e conferir se ainda valem com `null`; as que não valem são ajustadas ao novo comportamento (anotar em `desvios.md` na Tarefa 6).
- [x] Comitar e enviar ("Ticket 14 de processos-etapas: migração da trava do autor e do voltar"). Disparar o workflow "Migrar banco de desenvolvimento" na branch, com `migracao` = `<timestamp>_trava_do_autor_e_voltar_com_responsavel.sql`. Esperado: aplicada, sem o aviso de já aplicada.
- [x] Disparar o "Testes de banco" na branch. Esperado: os 36 arquivos verdes, o 36 com 33 de 33. Se o 36 falhar, ler a linha `not ok`; se for erro da migração, **nova migração** (a enviada não se edita); se for do teste, corrigir o teste. Na terceira falha sobre o mesmo ponto, parar (regra de parada do `CLAUDE.md`).
- [x] Conferir o alvo e rodar `npm run db:types`; no diff de `src/types/database.ts` deve mudar só `voltar_a_etapa` (`Args: { p_andamento: string; p_motivo: string; p_responsavel: string }`).
- [x] Registrar em `supabase/AMBIENTES.md` a linha da migração (data, ticket 14 de processos-etapas, não destrutiva, teste 36 falhou antes e passou depois com os 36 arquivos verdes, testes 19 e 20 ajustados à assinatura nova, aplicada pelo workflow, tipos regenerados). Comitar e enviar ("Ticket 14 de processos-etapas: registro da migração e tipos"). Nesse commit o `npm run typecheck` acusa a chamada antiga de `voltar_a_etapa` em `andamentosSupabase.ts`: corrigi-la aqui (`p_responsavel: null as unknown as string`, provisório até a Tarefa 4) para o commit compilar.

### Tarefa 4 — Módulo de processos (critério 3)

**Files:** Modify `src/processos/{tipos,andamentosSupabase,lerProcessoSupabase,andamentoFalso,ProcessosFalso,caminhoDeEtapas,gravarAcoes,frasesDeVersao}.ts`, os testes listados em "Estrutura de arquivos" e os fixtures que o `tsc` apontar.

- [x] **Testes primeiro (vermelhos):**
  - `andamentosSupabase.test.ts`: `voltarParaEtapa('a4', 'Mudou o escopo', 'u1')` chama o `rpc` `voltar_a_etapa` com `{ p_andamento: 'a4', p_motivo: 'Mudou o escopo', p_responsavel: 'u1' }` (e `null` quando não há); a recusa `autor_da_versao:3:Ana Teste` (nas funções `rpc.avancar_etapa`, `rpc.voltar_a_etapa` e no `update` de `andamentos`) vira a `TravaDoBanco` "Ana Teste enviou a versão V3 e não pode ser responsável pela Revisão interna."; os testes existentes de voltar levam o terceiro argumento.
  - `lerProcessoSupabase.test.ts`: a leitura de `versoes` (`select numero, enviada_por, autor:usuarios(nome)`, `processo_id = id`, `historica = false`, `numero` decrescente, `limit 1`) vira `ultimaVersao: { numero: 3, autorId: 'u1', autorNome: 'Ana Teste' }`; sem linha, `null`; erro de leitura, `Falha ao ler a versão mais recente do processo: …`.
  - `caminhoDeEtapas.test.ts`: `usuariosParaAEtapa` tira o autor só na etapa de código `revisao_interna` (nas outras etapas e sem `ultimaVersao` devolve a lista inteira); `podeAssumir` é verdadeiro para etapa pendente ou em andamento sem responsável e falso para resolvida, para etapa com responsável, e, na Revisão interna, para o autor da `ultimaVersao`.
  - `andamentoFalso.test.ts`: `conferirAutorDaRevisao` recusa o autor na Revisão interna (mesma frase), aceita outro usuário, outra etapa, `null` e quem já era o responsável; `conferirResponsavelEscolhido` mantém a frase de `responsavel_invalido` do avanço.
  - `ProcessosFalso.avanco.test.ts`: concluir a etapa anterior à Revisão interna com o autor como próximo responsável é recusado (a frase da trava) sem mudar nenhuma etapa; com outro usuário passa.
  - `ProcessosFalso.voltar.test.ts`: `voltarParaEtapa(id, motivo, responsavelId)` põe a etapa em andamento com o responsável (ou nenhum, limpando o anterior) e grava `{ acao: 'voltar', id, nota: motivo, usuarioId }`; recusa o autor na Revisão interna e o responsável fora de `usuariosPossiveis`, sem mudar nada.
- [x] `npm test` e `npm run typecheck`: vermelhos pelo motivo certo (assinaturas e campo que faltam).
- [x] **Implementar:**
  - `tipos.ts`: `export type UltimaVersao = { numero: number; autorId: string; autorNome: string }`; em `ProcessoLido`, `/** A versão mais recente não histórica; null sem versão (a Revisão interna não barra ninguém). */ ultimaVersao: UltimaVersao | null`; `voltarParaEtapa(andamentoId: string, motivo: string, responsavelId: string | null)` com o comentário "A etapa reaberta recebe o responsável (null: ninguém)".
  - `lerProcessoSupabase.ts`: `lerUltimaVersao(cliente, id): Promise<UltimaVersao | null>` (≤ 20 linhas, early return) entra no `Promise.all` de `lerProcesso`.
  - `frasesDeVersao.ts`: `fraseDoAutorDaVersao(valor: string)` recebe `numero:nome`, separa no primeiro `:` e devolve a frase da spec.
  - `andamentosSupabase.ts`: `autor_da_versao` no `PADRAO_DA_RECUSA` e no `FRASE_DA_RECUSA`; `voltarParaEtapa(cliente, id, motivo, responsavelId, recusas)` manda `p_responsavel: responsavelId as string` (mesmo molde do `avancar`, com o comentário de que o supabase-js manda `null`); tira o provisório da Tarefa 3.
  - `andamentoFalso.ts`: `conferirAutorDaRevisao(ultimaVersao: UltimaVersao | null, etapa: EtapaDoCaminho, responsavelId: string | null)` e `conferirResponsavelEscolhido(responsavelId, possiveis)` (extraída de `conferirAvanco`).
  - `ProcessosFalso.ts`: o avanço confere a trava para a próxima etapa (`proximaPendente` do processo da etapa), `mudarResponsavelDaEtapa` para a própria etapa e `voltarParaEtapa` para a reaberta; `voltarParaEtapa` grava o responsável (`responsavelDoCartao` quando a reaberta vira a atual).
  - `gravarAcoes.ts`: `AcaoDeAvanco` ganha `'voltar'`, `AcaoDeTexto` fica `'dispensar' | 'realizada'`, `PedidoDeAvanco` fica como está (`proxima`); `gravarAvanco` chama `voltarParaEtapa(etapa.id, nota, responsavelId)` quando a ação é `'voltar'`; `gravarTexto` perde o ramo do voltar.
  - `caminhoDeEtapas.ts`: `usuariosParaAEtapa` e `podeAssumir`, como acima.
  - Fixtures: `ultimaVersao: null` onde o `tsc` apontar.
- [x] `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:circular`: verdes. Comitar ("Ticket 14 de processos-etapas: módulo e falsa com a trava do autor e o voltar com responsável"). Se os testes de tela do voltar quebrarem aqui por causa de `PedidoDeAvanco`, deixar para a Tarefa 5 só o que depende da janela (o commit precisa compilar e passar).

### Tarefa 5 — Tela: [Assumir], trava nas janelas e voltar com responsável (critérios 4 a 8)

**Files:** Create `src/App.assumirEAutor.test.tsx`; Modify `src/hooks/useAcoesDaEtapa.ts`, `src/components/processos/{CaminhoDeEtapas,CaminhoDoProcesso,EdicaoDaEtapa,JanelaDeAvanco,EscolhaDoResponsavel}.tsx`, `src/App.{voltarDatasResponsavel,avancoDaEtapa}.test.tsx`.

- [x] **Testes de tela primeiro** em `src/App.assumirEAutor.test.tsx` (mesma montagem de `App.avancoDaEtapa.test.tsx`: `montar`, processo `#/processos/p1`, `falso.usuariosPossiveis = [{ id: 'usuario-de-teste', nome: <o do USUARIO_DE_TESTE> }, { id: 'u2', nome: 'Bia Teste' }]`; a etapa `revisao_interna` presente no caminho; `ultimaVersao` posta no processo do `falso`). Casos:
  1. **[Assumir] aparece** (critério 4): em etapa pendente e em andamento sem responsável há o botão "Assumir" (com nome acessível "Assumir <etapa>"); não há em etapa resolvida, em etapa com responsável, nem para a Consulta (`perfil: 'consulta'`).
  2. **Um clique assume:** clicar [Assumir] na etapa em andamento grava `falso.chamadas` = `[{ acao: 'responsavel', id, usuarioId: 'usuario-de-teste' }]`; a linha passa a "Responsável: <nome>" e o botão some; na aba Histórico (com o evento `mudar_responsavel` no `historicoDosProcessos`) aparece "Mudou o responsável da etapa".
  3. **Autor na Revisão interna:** com `ultimaVersao = { numero: 3, autorId: 'usuario-de-teste', autorNome: <nome> }`, a Revisão interna **não** tem [Assumir] para o usuário da tela, mas as outras etapas têm; com o autor sendo `u2`, a Revisão interna tem [Assumir] para o usuário da tela.
  4. **Janela de avanço sem o autor** (critério 5): a próxima sendo a Revisão interna e o autor `u2`, o `radiogroup` "Quem fica com a próxima etapa?" tem `[<usuário da tela>, 'Ninguém por enquanto']` (sem "Bia Teste"); autor de versão histórica não conta (a `ultimaVersao` é a não histórica; com `ultimaVersao: null` todos aparecem).
  5. **Marcado quando o autor é quem conclui:** quem está na tela é o autor e a próxima é a Revisão interna sem responsável → marcado "Ninguém por enquanto"; com a próxima já tendo o responsável `u2` (que pode) → marcado "Bia Teste"; com a próxima tendo como responsável o próprio autor (escolhido antes da versão) → marcado "Ninguém por enquanto" (ele sai da lista).
  6. **Seletor recusa o autor** (critério 6): escolher o autor no seletor "Responsável de Revisão interna" mostra o alerta "<Nome> enviou a versão V3 e não pode ser responsável pela Revisão interna." (o `falso` imita o banco) e o seletor continua no responsável anterior; escolher outra pessoa grava.
  7. **Janela de voltar** (critério 7): [Voltar a esta etapa] abre o `dialog` "Voltar à etapa <etapa>?" com o campo "Motivo" e o `radiogroup` "Quem fica com esta etapa?"; o botão "Voltar" fica desabilitado com o motivo vazio e habilita com texto; marcado o responsável atual da etapa reaberta (se pode), senão quem está na tela, senão "Ninguém por enquanto"; na Revisão interna o autor da versão mais recente não está na lista; confirmar grava `falso.chamadas` = `[{ acao: 'voltar', id, nota: <motivo>, usuarioId: <escolhido ou null> }]` e a etapa volta a "Em andamento" com "Responsável: <escolhido>" (ou "—"); Esc e [Cancelar] fecham sem gravar.
  8. **Falha ao voltar:** `falhaDeGravacao = 'Sem conexão'` mostra o alerta e as etapas ficam como estavam; a recusa da trava do banco (`TravaDoBanco` com a frase do autor) aparece como alerta.
- [x] Ajustar `App.voltarDatasResponsavel.test.tsx` (o voltar agora abre a `JanelaDeAvanco`: confirmar com o botão "Voltar" depois de escolher o responsável, `chamadas` com `usuarioId`) e o que mais o `npm test` apontar.
- [x] `npm test`: os casos novos falham pelo motivo certo (sem [Assumir], sem filtro, voltar ainda pela janela antiga).
- [x] **Implementar:**
  - `EscolhaDoResponsavel.tsx`: prop `pergunta: string` no lugar da constante.
  - `JanelaDeAvanco.tsx`: props `rotuloDoCampo` (padrão "Nota") e `pergunta` (padrão "Quem fica com a próxima etapa?"); o `<label>` do campo usa `rotuloDoCampo`.
  - `useAcoesDaEtapa.ts`: `agir('voltar', etapa, …)` faz `setAvanco({ acao: 'voltar', etapa, proxima: etapa })`; o resto não muda (o hook segue ≤ 40 linhas).
  - `CaminhoDeEtapas.tsx`: prop `ultimaVersao: UltimaVersao | null`; `JANELA_DO_AVANCO` ganha `voltar` (título `Voltar à etapa ${nome}?`, botão "Voltar", campo "Motivo", pergunta "Quem fica com esta etapa?"; os textos de título/botão passam a ser funções que podem ignorar a próxima, o mapa pode virar `textosDasJanelas.ts` se o arquivo passar de 300 linhas); `JANELA_DO_TEXTO` perde `voltar`; a janela de avanço recebe `usuariosParaAEtapa(proxima, usuarios, ultimaVersao)`; o [Assumir] é passado à `EdicaoDaEtapa` quando `podeAssumir(etapa, usuarioId, ultimaVersao)`.
  - `EdicaoDaEtapa.tsx`: prop opcional `aoAssumir?: () => void` e o botão `<button type="button" className="botao botao-secundario" aria-label={`Assumir ${etapa.nome}`} onClick={aoAssumir}>Assumir</button>` ao lado do seletor.
  - `CaminhoDoProcesso.tsx`: passa `processo.ultimaVersao` ao `CaminhoDeEtapas`.
  - Ajustar `App.avancoDaEtapa.test.tsx` só no que o `npm test` apontar (a lista de usuários ganhou o filtro).
- [x] `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:circular`: verdes. Comitar ("Ticket 14 de processos-etapas: Assumir, trava do autor nas janelas e voltar com responsável").

### Tarefa 6 — Conferência na tela e fecho

- [x] Conferir no navegador do app, com a vitrine local (`vitrine.local/`, fora do git, servida pelo `npx vite`): [Assumir] na linha, janela de voltar com o campo "Motivo" e a escolha (foco, setas, Enter, Esc), o autor ausente da lista na Revisão interna. Registrar como verificado manualmente só o que foi visto; o resto, como presumido (a vitrine usa as falsas, não o banco).
- [x] Gravar `.scratch/processos-etapas/desvios.md` (entrada datada): gatilho único para todos os caminhos; `reabrir_etapa` confere o responsável porque o gatilho de andamento pula a conferência na volta; testes 19 e 20 ajustados (e o que mudou nas asserções); `ultimaVersao` no processo lido; migração e tipos em commits seguintes ao da migração; o que mais surgir.
- [x] Gravar `.scratch/melhorias-protocolo.md` com os itens não testados do `/executar-complexo` e do "Qualquer momento" (`.claude/regras/nao-testados.md`) que aconteceram.
- [x] Marcar as caixas deste plano e comitar.
- [x] `git switch main`, merge da branch (`finishing-a-development-branch`), `git branch -d processos-etapas-14`; enviar a `main` e conferir o "Testes de banco" na `main`.
- [x] Na `main`: `Concluído em 2026-10-18 (commit <hash>)` no fim do ticket 14; comitar e enviar. Lembrar: peça o `/cost`; este é o último ticket da parte 2, então o próximo passo é o `/polir` de processos-etapas (a tela mudou) e depois o `/ship`; a funcionalidade seguinte da lista é revisoes-aprovacao.
