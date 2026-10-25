# Plano do ticket 26: Data da modelagem piloto

> Execução só. Requisitos: `.scratch/processos-etapas/issues/26-data-da-modelagem-piloto.md` e spec de processos-etapas, seção "Cartão e verso (mudança de 2026-10-25)". Branch `processos-etapas` (marco `marco/2026-10-25-inicio-ticket-26-data-da-modelagem-piloto`).

**Regras de banco que valem (`.claude/regras/banco.md`):** estrutura só por migração nova (as antigas não se editam); view com `security_invoker = true`; função `security definer` em `private`, `search_path` vazio; teste vem antes da migração; migração, teste e tipos no mesmo commit; alvo conferido antes de qualquer comando no remoto; teste de banco local pelo Docker (CLAUDE.md, "Testes de banco e tipos pelo Docker"); migração no remoto só pelo workflow "Migrar banco de desenvolvimento".

**Nomes novos (usados em todas as tarefas):** coluna `data_da_modelagem_piloto`; campo TS `dataDaModelagemPiloto`; operação do módulo `marcarDataDaModelagemPiloto(id, data)`; componente `DataDaModelagemPiloto` (arquivo `DataDaModelagemPiloto.tsx`); arquivo `src/processos/textoDaModelagemPiloto.ts` (hoje `textoDaReuniao.ts`; funções `hojeLocal`, `textoDaModelagemPiloto`, `momentoDaModelagemPiloto`); selo `tipo: 'modelagem'`.

## Tarefa 1: Banco (teste primeiro)

- [x] 1.1 `git mv supabase/tests/32_data_da_reuniao.test.sql supabase/tests/32_data_da_modelagem_piloto.test.sql`; trocar `data_da_reuniao` por `data_da_modelagem_piloto` nele e em `17_processos.test.sql` (estado do evento) e `44_pacote_das_planilhas.test.sql` (chave do pacote, lista de chaves ordenada). Rodar: falham (coluna não existe).
- [x] 1.2 Migração `npx supabase migration new data_da_modelagem_piloto`: `alter table public.processos rename column ...` (o privilégio de coluna acompanha); `create or replace function private.estado_do_processo` com a chave nova (corpo da migração `20261018123613`); `drop view` + `create view public.processos_com_andamento with (security_invoker = true)` (corpo da `20261024193536`, coluna nova) + `revoke all ... from anon, authenticated` + `grant select ... to authenticated`; `create or replace function private.montar_pacote_das_planilhas` (corpo da `20261024173606`, chave nova) + revoke de execução. Eventos antigos não são reescritos.
- [x] 1.3 Teste novo no 32: evento antigo (`data_da_reuniao` no `detalhes`) segue legível; nulos continuam nulos.
- [x] 1.4 Docker local: `npx supabase start` (descartar a saída), `npx supabase db reset`, `npx supabase test db`; contar `ok`/`not ok` (0 `not ok`), incluindo `00_rls_ligada`, `10_privilegios_padrao`, `46_funcoes_e_views_seguras`.
- [x] 1.5 `npx supabase gen types typescript --local` para `src/types/database.ts` (conferir o diff: só a coluna e a view).
- [x] 1.6 Commit (migração + testes + tipos).

## Tarefa 2: Edge Function `planilhas-dos-dashboards`

- [x] 2.1 Em `supabase/functions/_shared/` (`planilhasPacote.ts`, `planilhasProcesso.ts`, `planilhasCenario.ts`, `planilhasExemplos.ts` e os `.test.ts`): trocar a chave para `data_da_modelagem_piloto`; o teste de recusa de data fora de AAAA-MM-DD usa a chave nova. `npx vitest run supabase/functions`.
- [x] 2.2 Commit. (Republicar a função é passo do usuário: `docs/planilhas-publicar-a-funcao.md`.)

## Tarefa 3: Módulo de processos (real e falso) e tipos

- [x] 3.1 Testes primeiro (ajustar os existentes): `lerProcessoSupabase.test`, `processoDaLinha.test`, `listaDeProcessosSupabase.test`, `gravarProcessoSupabase.test` (criar grava `data_da_modelagem_piloto` com a data e com `null`; `marcarDataDaModelagemPiloto` faz update na coluna nova), `ProcessosFalso.situacao.test`, `agoraDoProcesso.test`, `src/testes/processoDaLista.ts`.
- [x] 3.2 `git mv src/processos/textoDaReuniao.ts textoDaModelagemPiloto.ts` (e o `.test` se houver) e trocar os imports; renomear funções e tipo (`MomentoDaModelagemPiloto`); `tipos.ts`: `dataDaModelagemPiloto` em `ProcessoDaLista` e `ProcessoLido`, `marcarDataDaModelagemPiloto` no módulo, `DadosDoProcesso.dataDaModelagemPiloto?: string | null`; `lerProcessoSupabase.ts`, `processoDaLinha.ts`, `gravarProcessoSupabase.ts` (`valoresDoCadastro` leva `data_da_modelagem_piloto: dados.dataDaModelagemPiloto ?? null`; `valoresDaEdicao` não), `ProcessosFalso.ts` (cadastro aceita a data; a chamada registrada passa de `'reuniao'` a `'data_da_modelagem_piloto'`).
- [x] 3.3 `npx vitest run src/processos` verde. Commit.

## Tarefa 4: Verso, Novo processo, cartão e histórico

- [x] 4.1 Testes primeiro: `App.reuniaoDoProcesso.test.tsx` → `App.dataDaModelagemPiloto.test.tsx` (seção "Data da modelagem piloto", "· próxima"/"· realizada", marcar, alterar, apagar, falha "A Data da modelagem piloto não foi salva: {motivo}.", Consulta só lê); `App.cadastrarProcesso.test.tsx` (o campo abre com `hojeEmBrasilia`; salvar com ela, com outra data e vazio grava o que está no campo; o Editar não tem o campo); `selosDoCartao.test.ts` ("Modelagem {DD/MM}", "Modelagem hoje", só em Não iniciados ou Modelagem piloto pelos códigos de `codigosDasEtapas`, não com data passada nem em outra etapa); `historicoDosCadastros.test.ts` (rótulo "Data da modelagem piloto" para as duas chaves); `App.*` que citam "Reunião".
- [x] 4.2 `git mv ReuniaoDoProcesso.tsx DataDaModelagemPiloto.tsx` e ajustar textos/classes (`modelagem-*`, e o CSS em `Contexto.css`), `VersoDoCartao.tsx`.
- [x] 4.3 Campo "Data da modelagem piloto" (`type="date"`) em `FormularioDoProcesso` só no cadastro (inicial `hojeEmBrasilia()`, apagável); a janela do Novo processo repassa a data em `DadosDoProcesso`.
- [x] 4.4 `selosDoCartao.ts`: `seloDeModelagem`; `SelosDoCartao.tsx` e CSS `selo-modelagem`.
- [x] 4.5 `historicoDosCadastros.ts`: rótulo e `CAMPOS_DE_DATA` com as duas chaves.
- [x] 4.6 Conferir que nenhum texto "Reunião" de tela sobra (`grep -rni "reuni" src`; exceções: rótulo do recurso retirado no histórico e a etapa de teste "Reunião de modelagem").

## Tarefa 5: Documentos, verificação e fechamento

- [x] 5.1 `docs/manutencao/04-modelo-de-dados.md` e `supabase/AMBIENTES.md` (migração nova aplicada à mão/workflow, a registrar) com o nome novo.
- [x] 5.2 `npm test` e `npm run lint` (e `npx tsc --noEmit`) verdes.
- [x] 5.3 Push da branch e disparo do "Testes de banco" (autorizado); depois, o workflow "Migrar banco de desenvolvimento" na branch com a migração; ler os resultados.
- [ ] 5.4 Merge na `main` (`git switch main`, `git merge`), `git branch -d`, linha `Concluído em` no ticket, `proximo-passo.md`, push da `main`.
