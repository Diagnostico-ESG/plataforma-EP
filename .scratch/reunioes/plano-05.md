# Ticket 05 de reunioes (Data da reunião no processo, sem a área Reuniões) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o painel do processo ganha a linha "Reunião de modelagem piloto" (marcar, trocar e remover a data), e tudo o que era da área Reuniões sai, do banco à tela.

**Architecture:** coluna `processos.data_da_reuniao` (date, opcional), gravada por `update` direto (privilégio de coluna + RLS de `processos`), com a data no estado dos eventos do processo; a view `processos_com_andamento` ganha a coluna no fim (`create or replace`). A migração apaga as quatro tabelas, o tipo, `salvar_reuniao` e todas as funções e gatilhos de reunião, inclusive as travas em `setores`, `processos` e `responsaveis_do_setor`; a política de leitura dos eventos de `reuniao` fica. Na tela: módulo `ModuloDeProcessos.marcarReuniao`, função pura do texto, componente `ReuniaoDoProcesso`; o módulo de reuniões e as telas dele saem.

**Tech Stack:** React + TypeScript, Vitest + Testing Library; pgTAP pelo GitHub Actions ("Testes de banco"); migração pelo workflow "Migrar banco de desenvolvimento".

**Spec:** `.scratch/reunioes/spec.md` (versão de 2026-10-18) · **Ticket:** `.scratch/reunioes/issues/05-data-da-reuniao-no-processo.md`. Os critérios são citados como "critério N", na ordem do ticket: 1 migração, 2 pgTAP, 3 painel, 4 Consulta, 5 histórico, 6 o que sai, 7 excluir e trocar setor, 8 testes, 9 `AMBIENTES.md`. Porquê: ADR 0013.

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui:
  - estrutura muda só por migração nova, criada com `npx supabase migration new`;
  - o teste vem antes da migração;
  - a view mantém `security_invoker = true` e o `revoke` de visitante;
  - nenhum `security definer` novo fora de `private`, com `search_path` vazio;
  - a RLS decide quem grava (botão escondido não protege).
- Alvo conferido: a linha "vínculo atual" de `supabase/AMBIENTES.md` e o `supabase/.temp/project-ref` são os dois `yclkzyoebpsxmgpbcbus` (desenvolvimento). O banco só é tocado pelos dois workflows, na branch.
- Funções de lógica com 4 a 20 linhas (hooks até 40), arquivos até 300 linhas e complexidade até 10. Tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação.
- Falha e recusa em vermelho (`cadastros-falha`, `role="alert"`). Só dados inventados.
- TDD: um teste que falha por erro de digitação não conta como o "vermelho".
- O pre-commit roda `typecheck` e a bateria inteira (cerca de 1 minuto). Cada commit precisa compilar.

## Decisões do plano

- **Leitura pela view:** a coluna entra no fim de `processos_com_andamento`, pelo `create or replace view`. Assim `lerProcesso` não ganha consulta nova. O ticket 12 de processos-etapas recria a view de qualquer jeito.
- **Gravação:** `update processos set data_da_reuniao` pelo cliente, no molde de `editarProcesso`. Usa `conferirGravacao`, que transforma zero linhas em recusa de perfil ou em processo sumido. Não há função nova no banco. A situação do processo não trava a gravação: o gatilho `conferir_situacao_do_processo` só olha `situacao` e `motivo_da_situacao`.
- **Tipos regenerados junto com a retirada do código de reuniões (Tarefa 3), não no commit da migração.** O pre-commit roda `typecheck`, e com os tipos novos o `reunioesSupabase.ts` não compila. Isso vai para o `desvios.md`.
- **Histórico do processo:** num evento `editar` de processo, a lista passa a mostrar só os campos que mudaram (`apenasOQueMudou`, que hoje só vale para a reunião). Assim, trocar a data aparece como "Antes: Reunião de modelagem piloto: 14/10/2026 / Depois: Reunião de modelagem piloto: 20/10/2026". Isso também enxuga a edição comum do processo, e vai para o `desvios.md`.
- **Eventos antigos de reunião:**
  - aparecem com a ação ("Criou", "Editou", "Excluiu"), a data e o autor, e o item é "Registro de reunião (recurso retirado da plataforma)", sem as linhas de antes e depois;
  - saem do filtro de itens, porque todos teriam o mesmo nome. Isso vai para o `desvios.md`;
  - a entidade `reuniao` continua na leitura do histórico geral (`historicoSupabase.ts`).
- **`hojeLocal`** sai de `src/reunioes/quandoAcontece.ts` e vai para `src/processos/textoDaReuniao.ts`, junto com a função do texto.
- **Endereço antigo `#/reunioes…`:** `useAreaAtual` deixa de reconhecer a área, e o endereço cai em `lerEnderecoDosProcessos(...).visao`. Um teste confere que `#/reunioes` e `#/reunioes/x` abrem o Quadro sem erro.
- **Ensaio da migração** antes de aplicá-la, como nos tickets de documentos-versoes: uma cópia temporária do teste 32 com a migração dentro, desfeita no fim e apagada depois.

## Estrutura de arquivos

**Criar:**
- `supabase/tests/32_data_da_reuniao.test.sql`
- `supabase/migrations/<timestamp>_data_da_reuniao.sql`
- `src/processos/textoDaReuniao.ts` (+ teste)
- `src/components/processos/ReuniaoDoProcesso.tsx`
- `src/App.reuniaoDoProcesso.test.tsx`
- `src/App.reunioesRetiradas.test.tsx`
- `src/testes/processosNosCadastros.tsx` (renomeado de `reunioesNosCadastros.tsx`, sem o que é de reunião)

**Modificar:**
- `src/processos/tipos.ts`, `lerProcessoSupabase.ts`, `gravarProcessoSupabase.ts`, `ProcessosFalso.ts`, `andamentosSupabase.ts` e os testes deles
- os construtores de `ProcessoLido` nos testes (lista na Tarefa 5)
- `src/components/processos/PainelDoProcesso.tsx`, `HistoricoDoProcesso.tsx`, `AreaDeProcessos.tsx`
- `src/components/cadastros/AreaDeCadastros.tsx`, `AreaDeSetores.tsx`, `SetorAberto.tsx`, `ListaDoHistorico.tsx`
- `src/cadastros/historicoDosCadastros.ts`, `recusasDeProcessos.ts` (+ testes)
- `src/components/moldura/areas.ts`, `FaixaLateral.tsx`, `src/components/Icone.tsx`, `src/hooks/useAreaAtual.ts`
- `src/App.tsx`, `src/main.tsx`
- todos os `src/App.*.test.tsx` que passam `reunioes={...}`
- `src/types/database.ts`
- `supabase/AMBIENTES.md`

**Apagar:**
- `src/reunioes/` (inteira) e `src/components/reunioes/` (inteira, com o `Reunioes.css`)
- `src/processos/frasesDeReuniao.ts`, `src/testes/reunioesDeTeste.tsx`
- `src/cadastros/historicoDasReunioes.test.ts`, que vira o teste da linha simples
- os testes de tela só de reunião: `App.editarReuniao`, `App.excluirReuniao`, `App.historicoDaReuniao`, `App.historicoGeralComReunioes`, `App.painelDaReuniao`, `App.participantesNoFormulario`, `App.participantesNoPainel`, `App.recusaComReunioes`, `App.registrarReuniao`, `App.reunioes`, `App.reunioesNoProcesso`, `App.reunioesNoSetor`
- `supabase/tests/23_reunioes.test.sql`, `24_reunioes_participantes.test.sql`, `25_reunioes_nos_cadastros.test.sql`

## Tarefas

### Tarefa 1 — Branch, marco e teste de banco que falha (critério 2)

**Arquivos:** criar `supabase/tests/32_data_da_reuniao.test.sql`; apagar `supabase/tests/23_*`, `24_*` e `25_*`.

- [x] `git switch -c reunioes-05` a partir da `main` limpa, e `git tag marco/2026-10-18-inicio-ticket-05-reunioes`. Enviar o marco (`git push origin refs/tags/marco/2026-10-18-inicio-ticket-05-reunioes`). Conferir o alvo (os dois `yclkzyoebpsxmgpbcbus`).
- [x] Escrever o 32 no molde do 23: `begin`, `_tap`, `plan(N)`, usuários inventados a1 (administrador), a2 (integrante), a3 (consulta) e a4 (inativo), `finish()` e a exceção `RESULTADO DOS TESTES`. Preparação: setores TD1 e TD2, um macroprocesso e três processos ("Proc Data", "Proc Cancelado", "Proc Excluir"). O cancelado vai por `private.mudar_situacao`, como dono, ou com `set_config('ep.mudando_situacao','on',true)`; o executor confere no 20. Asserções, uma por linha das tabelas da spec e do critério 2:
  1. `has_column('public','processos','data_da_reuniao')`;
  2. administrador marca, integrante troca e integrante remove (volta a `null`), cada um com `lives_ok` e o valor conferido;
  3. a Consulta, o inativo e o visitante (`anon`) não mudam a coluna: 0 linhas afetadas, e o valor fica igual (a consulta e o inativo pela RLS, o visitante por `throws_ok` 42501);
  4. data futura (`2027-01-15`) no processo cancelado é aceita;
  5. trocar `2026-10-14` por `2026-10-20` gera exatamente um evento `processo`/`editar` novo, com `detalhes->'antes'->>'data_da_reuniao' = '2026-10-14'` e `'depois'` = `'2026-10-20'`;
  6. gravar a mesma data não gera evento;
  7. depois de marcar a data, a primeira etapa do processo continua `pendente`;
  8. o processo com data se exclui (`lives_ok` no `delete`) e troca de setor (`lives_ok` no `update setor_id`, com a data mantida);
  9. `hasnt_table` para `reunioes`, `reunioes_processos`, `reunioes_usuarios` e `reunioes_responsaveis`, e `hasnt_type('public','tipo_de_reuniao')`;
  10. um evento antigo de `reuniao`, inserido como dono, é lido por a1, a2 e a3 (1 linha cada), e por a4 e `anon` não (0 linhas ou recusa).
- [x] Apagar o 23, o 24 e o 25: o assunto deles sai da plataforma, e o 32 cobre o que fica (critério 2).
- [x] Comitar ("Ticket 05 de reunioes: plano de execução e teste de banco da data da reunião"), `git push -u origin reunioes-05`, disparar o "Testes de banco" na branch pelo navegador do app e ler o resultado. Esperado: o 32 vermelho (coluna inexistente) e todos os outros verdes. Anotar o número da execução.

### Tarefa 2 — Migração (critérios 1 e 9)

**Arquivos:** criar `supabase/migrations/<timestamp>_data_da_reuniao.sql` (com `npx supabase migration new data_da_reuniao`); modificar `supabase/AMBIENTES.md`.

- [x] Escrever a migração, nesta ordem, com comentários do porquê no estilo das anteriores:
  1. `alter table public.processos add column data_da_reuniao date;` e `grant update (data_da_reuniao) on public.processos to authenticated;`
  2. `create or replace function private.estado_do_processo(...)` igual à de `20261014204810_subprocessos_e_reclassificacao.sql`, com `'data_da_reuniao', processo.data_da_reuniao` no `jsonb_build_object`. Mantém o `security definer` e o `search_path = ''` da original.
  3. `create or replace view public.processos_com_andamento with (security_invoker = true) as` igual à de `20261014130147_processos.sql`, com `p.data_da_reuniao` acrescentada como **última** coluna. Repetir o `revoke all ... from anon, authenticated` e o `grant select ... to authenticated`.
  4. Os gatilhos fora das tabelas que vão sair:
     - `drop trigger conferir_setor_sem_reunioes on public.setores;`
     - `drop trigger conferir_processo_sem_reunioes on public.processos;`
     - `drop trigger conferir_processo_sem_reunioes_na_troca_de_setor on public.processos;`
     - `drop trigger manter_responsavel_nas_reunioes on public.responsaveis_do_setor;`
  5. `drop table public.reunioes_responsaveis, public.reunioes_usuarios, public.reunioes_processos, public.reunioes;` (sai junto o que está nelas: políticas, gatilhos, índices).
  6. `drop function` de:
     - `public.salvar_reuniao(uuid, public.tipo_de_reuniao, uuid, date, time, text, text, text[], uuid[], uuid[], uuid[])`;
     - `private.preparar_reuniao()`, `conferir_setor_da_reuniao()`, `conferir_processo_da_reuniao()`, `conferir_processos_ao_trocar_o_setor()`, `reuniao_da_linha(jsonb)`, `conferir_tipo_da_reuniao()`;
     - `conferir_setor_sem_reunioes()`, `conferir_processo_sem_reunioes()`, `estado_da_reuniao(uuid)`, `chave_da_reuniao(uuid)`, `guardar_estado_da_reuniao()`, `registrar_evento_da_reuniao()`;
     - `conferir_responsavel_da_reuniao()`, `conferir_responsaveis_ao_trocar_o_setor()`, `manter_responsavel_nas_reunioes()`, `conferir_processo_sem_reunioes_na_troca_de_setor()`.

     Depois, `drop type public.tipo_de_reuniao;`.
  7. Não tocar na política "eventos: perfil ativo lê as reuniões": os registros antigos continuam legíveis.
- [x] Ensaiar antes de aplicar:
  1. criar `supabase/tests/32b_ensaio_data_da_reuniao.test.sql`, uma cópia do 32 com o corpo da migração colado logo depois do `begin` e antes do `plan`;
  2. comitar, enviar e disparar o "Testes de banco". Esperado: o 32b verde e o 32 ainda vermelho;
  3. apagar o 32b e comitar a remoção.

  Se o ensaio falhar, corrigir a migração e repetir; na terceira falha, parar (regra de parada).
- [x] Comitar a migração (sem os tipos, ver as Decisões) e enviar. Disparar o "Migrar banco de desenvolvimento" na branch, com `migracao` igual ao nome do arquivo **sem a pasta**, e ler o resultado. Depois, o "Testes de banco" na branch. Esperado: todos verdes, o 32 com N de N.
- [x] Registrar em `supabase/AMBIENTES.md` a linha da migração, no formato das anteriores: data, ticket, o 32 vermelho antes e verde depois com os números das execuções, o ensaio e o workflow usado. Comitar.

### Tarefa 3 — Retirar o módulo e as telas de reunião, e regenerar os tipos (critério 6)

**Arquivos:** os de "Apagar", mais `App.tsx`, `main.tsx`, `areas.ts`, `FaixaLateral.tsx`, `Icone.tsx`, `useAreaAtual.ts`, `AreaDeCadastros.tsx`, `AreaDeSetores.tsx`, `SetorAberto.tsx`, `AreaDeProcessos.tsx`, `PainelDoProcesso.tsx`, `HistoricoDoProcesso.tsx`, `ListaDoHistorico.tsx`, `historicoDosCadastros.ts`, `recusasDeProcessos.ts`, `andamentosSupabase.ts` (+ testes), `src/testes/processosNosCadastros.tsx`, `src/types/database.ts`; criar `src/App.reunioesRetiradas.test.tsx`.

- [x] Testes que falham, em `App.reunioesRetiradas.test.tsx` (o aplicativo inteiro, com as falsas nomeadas):
  1. a faixa lateral mostra Quadro, Lista, Setores e Painel, sem "Reuniões". Ajustar a expectativa em `App.test.tsx`;
  2. `#/reunioes` e `#/reunioes/qualquer` abrem o Quadro;
  3. o setor aberto não tem a seção "Reuniões";
  4. o painel do processo não tem a seção "Reuniões";
  5. no histórico geral, um evento antigo de `reuniao` aparece como "Criou Registro de reunião (recurso retirado da plataforma)", com a data e o autor, sem "Antes:" e "Depois:", e fora da lista do filtro "Item".

  Em `historicoDosCadastros.test.ts`: `nomeDoItem` de um evento `reuniao` dá a linha simples, e `itensDoFiltro` não inclui reuniões. Em `recusasDeProcessos.test.ts` e `andamentosSupabase.test.ts`: tirar os casos de `setor_com_reunioes` e `processo_com_reunioes*`.
- [x] Rodar e ver falhar pelos motivos esperados.
- [x] Implementar:
  - apagar `src/reunioes/`, `src/components/reunioes/`, `frasesDeReuniao.ts`, `reunioesDeTeste.tsx` e os testes de tela da lista "Apagar";
  - renomear `reunioesNosCadastros.tsx` para `processosNosCadastros.tsx`, sem o falso de reuniões, e ajustar os imports dos testes de versões;
  - tirar a prop `reunioes` de `App`, `main.tsx`, `AreaDeProcessos`, `PainelDoProcesso` (sem a `ReunioesDoProcesso`), `HistoricoDoProcesso` (só `processos.lerHistoricoDoProcesso`), `AreaDeCadastros`, `AreaDeSetores` e `SetorAberto` (sem a `ReunioesDoSetor`);
  - nos `src/App.*.test.tsx`, tirar ` reunioes={new ReunioesFalso()}` e o import, de forma mecânica (`sed`), conferindo o `git diff`;
  - tirar `'reunioes'` de `areas.ts`, `useAreaAtual.ts`, `FaixaLateral.tsx` e do `Icone.tsx`;
  - `recusasDeProcessos.ts` sem `setor_com_reunioes`; `andamentosSupabase.ts` sem `processo_com_reunioes*` no padrão e no mapa (e o comentário sem "reunioes");
  - `historicoDosCadastros.ts`:
    - entidade `reuniao`: o nome vira a constante `TEXTO_DA_REUNIAO_RETIRADA = 'Registro de reunião (recurso retirado da plataforma)'`, e `itensDoFiltro` a pula;
    - saem `ROTULO_DO_TIPO_DE_REUNIAO`, `valorDoCampoDaReuniao` e os rótulos que só a reunião usava (`hora`, `local`, `anotacoes`, `outros_participantes`, `usuarios` e, se o `grep` mostrar que só a reunião usa, `data` e `processos`);
  - `apenasOQueMudou` vai para `src/cadastros/apenasOQueMudou.ts`, com o teste dele, se houver, movido junto;
  - `ListaDoHistorico.tsx`: entidade `reuniao` sem os spans de antes e depois, e `apenasOQueMudou` no `editar` de `processo`. Deixar no código o comentário do porquê;
  - `historicoSupabase.ts` mantém `'reuniao'` na lista de entidades, com o comentário atualizado: só registros antigos.
- [x] `npm run db:types` (o alvo já foi conferido) e conferir no `src/types/database.ts` que saíram as tabelas de reunião e `salvar_reuniao`, e que entrou `data_da_reuniao` em `processos` e na view.
- [x] `npx tsc -b`, `npx eslint .`, `npm run check:circular` e `npm test`, tudo verde. Um `grep -rni "reuni" src` só pode mostrar a linha simples, a data nova, a etapa "Reunião de modelagem" dos dados de teste e o histórico. Comitar ("Ticket 05 de reunioes: sai a área Reuniões; tipos regenerados").

### Tarefa 4 — Função pura do texto (critério 8, primeira parte)

**Arquivos:** criar `src/processos/textoDaReuniao.ts` e `src/processos/textoDaReuniao.test.ts`.

**Interfaces — produz:**
- `hojeLocal(agora?: Date): string`, no formato AAAA-MM-DD, como era em `quandoAcontece.ts`;
- `textoDaReuniao(data: string | null, hoje: string): string`, que devolve "não marcada", "marcada para DD/MM/AAAA" ou "realizada em DD/MM/AAAA" e usa o `formatarData` de `caminhoDeEtapas.ts`.

- [x] Testes que falham:
  - `null` dá "não marcada";
  - `2026-10-20` com hoje `2026-10-14` dá "marcada para 20/10/2026";
  - a data igual a hoje dá "marcada para";
  - `2026-10-13` dá "realizada em 13/10/2026";
  - `hojeLocal(new Date(2026, 0, 5, 23, 59))` dá `2026-01-05`.
- [x] Implementar o mínimo, rodar e comitar.

### Tarefa 5 — Módulo de processos: ler e marcar a data (critério 8, segunda parte)

**Arquivos:** `src/processos/tipos.ts`, `processoDaLinha.ts` ou `lerProcessoSupabase.ts`, `gravarProcessoSupabase.ts`, `ProcessosFalso.ts` e os testes deles; os construtores de `ProcessoLido` em `App.andamentoDoProcesso`, `App.cadastrarProcesso`, `App.catalogoNosProcessos`, `App.filtrosDosProcessos`, `App.lista`, `App.painelDoProcesso`, `App.processosDoSetor`, `App.quadro`, `App.reclassificar`, `App.situacaoDoProcesso`, `App.subprocessos` e `App.voltarDatasResponsavel`, e também em `andamentoFalso.test.ts`, `CatalogoFalso.test.ts`, `ProcessosFalso.*.test.ts` e `testes/processosNosCadastros.tsx`.

**Interfaces — produz:**
- `ProcessoLido.dataDaReuniao: string | null`, no formato AAAA-MM-DD;
- `ModuloDeProcessos.marcarReuniao(id: string, data: string | null): Promise<void>`, em que `null` remove a data. As recusas seguem as do módulo: perfil, com a frase de `RECUSAS_DOS_PROCESSOS`, e processo que sumiu, com `CadastroInexistente`;
- `ProcessosFalso.marcarReuniao`, que respeita `falhaDeGravacao` e acrescenta `{ acao: 'reuniao', id, nota: data ?? undefined }` às `chamadas`.

- [x] Testes que falham:
  - `lerProcessoSupabase.test.ts`: a linha da view com `data_da_reuniao: '2026-10-20'` vira `dataDaReuniao: '2026-10-20'`, e com `null` vira `null`;
  - o teste da gravação: `marcarReuniao('p1', '2026-10-20')` faz `update({ data_da_reuniao: '2026-10-20' }).eq('id','p1').select('id')`, e `null` grava `null`. Sem linha afetada, a leitura decide entre a recusa de perfil ("Seu perfil não permite alterar os processos.") e `CadastroInexistente`. Um erro do banco vira `Error` com o motivo;
  - `ProcessosFalso`: marca e remove; a leitura devolve a data; `falhaDeGravacao` lança; processo inexistente lança `CadastroInexistente`; o processo novo nasce com `null`.
- [x] Implementar e acrescentar `dataDaReuniao: null` em cada construtor da lista. `ProcessosFalso.ts` tem de continuar abaixo de 300 linhas; se passar, extrair a montagem do processo novo para `andamentoFalso.ts` ou um arquivo vizinho.
- [x] `npx tsc -b`, rodar os testes tocados e comitar.

### Tarefa 6 — Linha "Reunião de modelagem piloto" no painel (critérios 3, 4, 5, 7 e 8)

**Arquivos:** criar `src/components/processos/ReuniaoDoProcesso.tsx` e `src/App.reuniaoDoProcesso.test.tsx`; modificar `PainelDoProcesso.tsx` e, se preciso, `Painel.css`.

**Interfaces — consome:** `textoDaReuniao`, `hojeLocal`, `ModuloDeProcessos.marcarReuniao`, `useGravacaoComFalha` e `processo.dataDaReuniao`.

- [x] Testes de tela que falham (o aplicativo inteiro, o painel aberto por `#/processos/<id>` e o relógio fixado só no `Date`, como em `reunioesDeTeste.fixarOHoje`, que agora sai):
  1. os textos "marcada para 20/10/2026" (futura), "marcada para 14/10/2026" (hoje), "realizada em 10/10/2026" e "não marcada";
  2. marcar: o campo `date` com o rótulo "Data da reunião de modelagem piloto" mais [Salvar] gravam (`chamadas` do falso), e o texto atualiza;
  3. trocar a data;
  4. [Remover], que só aparece com data gravada, apaga sem pedir confirmação;
  5. [Salvar] desabilitado com o campo vazio e com a data igual à gravada;
  6. os dois botões desabilitados durante a gravação (gravação segurada);
  7. falha: "A data da reunião não foi salva: falha de conexão simulada." em vermelho, com o campo mantido. Recusa de perfil: "Seu perfil não permite alterar os processos.";
  8. marcar em processo suspenso, cancelado e concluído;
  9. Consulta: vê o texto, sem campo e sem botões;
  10. histórico do processo: um evento `editar` com `data_da_reuniao` de `2026-10-14` para `2026-10-20` mostra só "Reunião de modelagem piloto: 14/10/2026" no antes e "20/10/2026" no depois, com o autor;
  11. excluir e trocar o setor de um processo com data, sem recusa.
- [x] Implementar:
  - em `historicoDosCadastros.ts`, o rótulo `data_da_reuniao: 'Reunião de modelagem piloto'` e o valor em DD/MM/AAAA por `formatarData`;
  - `ReuniaoDoProcesso`: uma seção com rótulo, no estilo de `painel-dados`, com uma `dl` de uma linha (`dt` "Reunião de modelagem piloto", `dd` com o texto) e, para quem altera, o campo e os botões;
  - no `PainelDoProcesso`, a `ReuniaoDoProcesso` no lugar da antiga `ReunioesDoProcesso`, depois da `EstruturaDoProcesso` e antes da `SecaoDeVersoes`. Ao gravar, chama `aoAtualizar` e `aoMudar`, como as outras ações.
- [x] Rodar os testes tocados, `npx tsc -b` e `npx eslint`, e comitar.

### Tarefa 7 — Fecho

- [x] `npm test`, `npx tsc -b`, `npx eslint .` e `npm run check:circular`, tudo verde. Conferir os critérios do ticket um a um.
- [x] Gravar o `.scratch/reunioes/desvios.md`: tipos regenerados na Tarefa 3; "só o que mudou" vale agora para qualquer edição do processo; reuniões antigas fora do filtro do histórico; ensaio da migração; o que mais surgir. Gravar também o `.scratch/melhorias-protocolo.md` (os itens não testados do `/executar-complexo`). Marcar as caixas deste plano e comitar.
- [x] Juntar à `main`: `git switch main`, `git merge reunioes-05` e `git branch -d reunioes-05` (se o `-d` recusar, parar e perguntar). Gravar a linha `Concluído em AAAA-MM-DD (commit <hash>)` no ticket e comitar. `git push origin main`, e conferir o "Testes de banco" da `main`, porque o envio mexe em `supabase/`.
- [x] Apontar o próximo ticket, `processos-etapas/11`, e pedir o `/cost`.
