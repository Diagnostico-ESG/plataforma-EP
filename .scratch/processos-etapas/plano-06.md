# Ticket 06 de processos-etapas (Voltar, datas e responsável da etapa) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** a equipe volta a uma etapa anterior com motivo (no processo e no setor), corrige as datas de início e conclusão e escolhe o responsável de cada etapa do processo, com o histórico guardando como estava antes.

**Architecture:** uma migração acrescenta a função `public.voltar_a_etapa(andamento, motivo)` (sem `security definer`, a RLS decide), os gatilhos de datas e de responsável em `andamentos`, privilégios de `update` nas colunas novas e os textos novos de evento. O módulo de processos ganha `voltarParaEtapa`, `corrigirDatasDaEtapa`, `mudarResponsavelDaEtapa` e `listarResponsaveisPossiveis` (real e falso). A tela reaproveita `CaminhoDeEtapas` (processo e setor): botão [Voltar a esta etapa] com `JanelaComCampo`, formulário de datas e seletor de responsável.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 20 (responsável), 38 a 43, 46, 58; "Interface", "Regras que o banco impõe", "Regras de estado") · **Ticket:** `.scratch/processos-etapas/issues/06-voltar-datas-e-responsavel-da-etapa.md` (critérios citados como "critério N", na ordem do ticket).

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Teste antes da migração; migração, teste de banco e tipos no mesmo commit. Regras de `.claude/regras/banco.md` lidas nesta sessão: RLS decide quem chama; função de conferência sem `security definer`, com `revoke ... from public, anon` e `grant execute ... to authenticated`; função só de gatilho, `revoke` de todos; `view` não muda.
- Dados de teste inventados. TypeScript sem `any`; função de lógica 4–20 linhas; arquivo até 300 linhas; complexidade ≤ 10; early return.
- Recusas (critério 3), texto exato: "A data {valor} está no futuro.", "A conclusão ({valor}) não pode ser antes do início ({valor}).", "{Usuário} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP." Mais "Seu perfil não permite alterar os processos." quando o banco recusa por perfil.
- Histórico (critério 6): "Voltou à etapa", "Corrigiu as datas da etapa", "Mudou o responsável da etapa", com o motivo.
- Alvo do banco: **desenvolvimento** (`yclkzyoebpsxmgpbcbus`, "vínculo atual" de `supabase/AMBIENTES.md`). Testes de banco: workflow "Testes de banco" (push da branch + Run workflow). Migração: workflow "Migrar banco de desenvolvimento". Ambos autorizados no `CLAUDE.md`. Produção: nada.
- Branch `processos-etapas-06`, marco `marco/2026-10-14-inicio-ticket-06-processos-etapas` (já criados).
- Fora do escopo: suspender/cancelar/retomar e o congelamento dos andamentos (07); reclassificar (08); responsável das etapas do **setor** (a spec pede o seletor "em cada etapa do processo"; o banco já aceita nas duas).

## Decisões de projeto deste plano (vão para o `desvios.md`)

- **Como a função "voltar" passa pelas travas:** ela grava `set_config('ep.voltando', 'on', true)` e `set_config('ep.motivo_da_volta', <motivo>, true)` (valem só na transação). O gatilho `preparar_andamento` só aceita sair de resolvida quando `ep.voltando = 'on'` e, nesse caso, não mexe em status nem datas (a função decide). O gatilho de evento lê o motivo do mesmo ajuste.
- **Voltar devolve a pendente todas as etapas seguintes que não estão pendentes** (resolvidas **e a em andamento**), porque a atual em andamento e a escolhida em andamento ao mesmo tempo violam "no máximo uma em andamento". A spec fala só das resolvidas.
- **Datas ao voltar:** a escolhida fica em andamento, mantém o `iniciada_em` (ou recebe hoje se não tinha) e perde o `resolvida_em`; as seguintes ficam com as duas datas nulas e a nota nula. O estado anterior fica no evento.
- **Datas recusadas mostram o valor em DD/MM/AAAA** (o banco manda AAAA-MM-DD; o módulo real traduz e o falso imita).
- **Ordem em `eventos.acao`:** `voltar`, `corrigir_datas`, `mudar_responsavel` (texto na tela pelo mapa do histórico).

## Mapa de arquivos

| Arquivo | Mudança |
|---|---|
| `supabase/tests/19_voltar_datas_responsavel.test.sql` | novo (Task 1) |
| `supabase/migrations/<data>_voltar_datas_responsavel.sql` | novo, criado só depois da rodada que prova a falha |
| `supabase/AMBIENTES.md` | linha da migração |
| `src/types/database.ts` | `npm run db:types` (a função nova entra em `Functions`) |
| `src/testes/ClienteSupabaseFalso.ts` | `rpc(nome, args)` |
| `src/processos/tipos.ts` | `EtapaDoProcesso` ganha `responsavelId`, `responsavelInativo`; `ModuloDeProcessos` ganha 4 operações; tipo `DatasDaEtapa`, `UsuarioResponsavel` |
| `src/processos/andamentosSupabase.ts` (+ teste) | novo: mudar andamento, voltar, datas, responsável, traduções (sai de `processosSupabase.ts`, que passa dos 60 linhas) |
| `src/processos/processosSupabase.ts`, `lerProcessoSupabase.ts` (+ testes) | usam o módulo novo; leitura traz id e `ativo` do responsável |
| `src/processos/andamentoFalso.ts`, `ProcessosFalso.ts` (+ testes) | falso imita voltar, datas, responsável |
| `src/processos/caminhoDeEtapas.ts` (+ teste) | ação `voltar` |
| `src/components/processos/*` | `LinhaDaEtapa`, `CaminhoDeEtapas`, novos `FormularioDeDatas`, `SeletorDeResponsavel` |
| `src/cadastros/historicoDosCadastros.ts` (+ teste) | textos das 3 ações novas e rótulo do responsável |
| `src/App.voltarDatasResponsavel.test.tsx` | novo: testes de tela do aplicativo inteiro |
| `.scratch/processos-etapas/desvios.md` | entrada do ticket 06 |

---

### Task 1: Teste de banco que falha (critério 1 e 2)

**Files:** Create `supabase/tests/19_voltar_datas_responsavel.test.sql` (mesmo molde do `18_`: usuários a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo; setor `TS6`, macroprocesso, processo "Processo Volta" e "Processo Datas"; funções `pg_temp.andamento(...)`).

Casos (cada um uma linha do plano pgTAP):
1. Com as 3 etapas do setor resolvidas e as etapas 4, 5, 6 do processo concluídas (uma por comando), `select public.voltar_a_etapa(<andamento da 4>, 'Mudou o escopo')` deixa a 4 `em_andamento` e a 5 e a 6 `pendente`.
2. A 4 mantém `iniciada_em`, `resolvida_em` nulo; a 5 e a 6 com datas nulas.
3. Um evento `voltar` por andamento alterado (3 eventos) e `detalhes.motivo = 'Mudou o escopo'`.
4. Voltar com a atual em andamento: com a 5 em andamento e a 4 concluída, voltar à 4 deixa a 5 pendente (uma só em andamento).
5. Voltar sem motivo (`''` e nulo) recusado: `P0001`, `motivo_obrigatorio`.
6. Voltar a uma etapa que não está resolvida recusado: `P0001`, `etapa_nao_resolvida:<nome>`.
7. Voltar no setor (andamento do setor) não muda nenhum andamento dos processos do setor.
8. Processo concluído deixa de ser concluído ao voltar (view `situacao` volta a `em_andamento`).
9. Consulta e inativo chamando `voltar_a_etapa`: recusado (`42501`); visitante: `42501`.
10. Data no futuro (`current_date + 1`) em `iniciada_em`: `P0001`, `data_no_futuro:<AAAA-MM-DD>`; idem em `resolvida_em`.
11. `resolvida_em` antes de `iniciada_em`: `P0001`, `resolvida_antes_do_inicio:<resolvida>:<inicio>`.
12. Corrigir as datas de uma etapa concluída (`iniciada_em` e `resolvida_em` de ontem) funciona e gera 1 evento `corrigir_datas` com antes e depois.
13. Responsável de perfil Consulta recusado: `P0001`, `responsavel_invalido:<nome do usuário>`; inativo, o mesmo; Integrante e Administrador aceitos; gera evento `mudar_responsavel` com o nome do responsável em `depois`.
14. Gravação sem mudança (mesmas datas) não gera evento.
15. Consulta não altera data nem responsável (nenhuma linha muda).
16. A função `voltar_a_etapa` não é `security definer` (`prosecdef` falso em `pg_proc`) — critério 2.

- [x] **Step 1:** escrever o arquivo (com `plan(<n>)` igual ao número de linhas) e comitar só ele na branch.
- [x] **Step 2:** `git push -u origin processos-etapas-06`, disparar o workflow "Testes de banco" na branch (Run workflow, pelo navegador do app) e ler o resultado. Esperado: o teste 19 falha (função inexistente / privilégio negado); os demais seguem verdes.

### Task 2: Migração (critérios 1 e 2) e tipos

**Files:** Create `supabase/migrations/<data>_voltar_datas_responsavel.sql` (criada com `npx supabase migration new voltar_datas_responsavel`, **depois** da rodada da Task 1); Modify `supabase/AMBIENTES.md`, `src/types/database.ts`.

Conteúdo da migração (uma responsabilidade por função; comentário do porquê em cada uma):
- `grant update (responsavel_id, iniciada_em, resolvida_em) on public.andamentos to authenticated;` e `alter table public.andamentos add constraint andamentos_resolvida_depois_do_inicio check (resolvida_em is null or iniciada_em is null or resolvida_em >= iniciada_em);`
- `private.conferir_datas(andamento public.andamentos)`: `data_no_futuro:<data>` (início, depois conclusão) e `resolvida_antes_do_inicio:<resolvida>:<inicio>`; chamada pelo `preparar_andamento` em toda alteração, antes do `if new.status = old.status`.
- `private.conferir_responsavel(andamento public.andamentos)`: quando `responsavel_id` não nulo e mudou, lê `public.usuarios`; fora de `ativo` + perfil `administrador`/`integrante_ep` → `responsavel_invalido:<nome>`.
- `private.voltando()` (`select coalesce(current_setting('ep.voltando', true), '') = 'on'`) e uso em `preparar_andamento`: com `voltando()` retorna `new` sem conferir transição, sequência, dispensa nem sobrescrever datas.
- `private.acao_do_andamento(antes public.andamentos, depois public.andamentos, voltando boolean)` (substitui a de dois status, que é apagada): `voltar` se `voltando`; senão a escolha atual por status; sem mudança de status, `corrigir_datas` se as datas mudaram, `mudar_responsavel` se o responsável mudou, senão `editar`.
- `private.registrar_evento_do_andamento()` reescrita: `base` ganha `responsavel_nome` (via `usuarios`) em antes e depois; motivo = `nullif(current_setting('ep.motivo_da_volta', true), '')` quando voltando, senão `new.nota`; `antes = depois` e nota igual continua sem evento.
- `public.voltar_a_etapa(p_andamento uuid, p_motivo text) returns void` (`language plpgsql`, sem `security definer`, `set search_path = ''`): exige motivo (`motivo_obrigatorio`), lê o andamento (inexistente → `registro_inexistente`), exige status resolvido (`etapa_nao_resolvida:<nome>`), liga `ep.voltando` e `ep.motivo_da_volta`, volta primeiro as seguintes não pendentes do mesmo dono (`processo_id`/`setor_id` com `is not distinct from`, ordem maior) a pendente com datas e nota nulas, depois a escolhida a `em_andamento` com `resolvida_em = null`, `nota = null`, `iniciada_em = coalesce(iniciada_em, current_date)`; se a atualização da escolhida não alterar linha (RLS), `raise exception using errcode = '42501'`. `revoke execute ... from public, anon; grant execute ... to authenticated`.
- `revoke execute` das funções novas de `private` como nas migrações anteriores.

- [x] **Step 1:** criar a migração e escrever o conteúdo acima.
- [x] **Step 2:** comitar, `git push`, disparar o workflow "Migrar banco de desenvolvimento" na branch com o arquivo novo; ler o resultado (se acusar "já aplicada", seguir).
- [x] **Step 3:** disparar "Testes de banco" na branch. Esperado: os 19 arquivos verdes. Se o 19 falhar por erro do próprio teste, corrigir o teste e rodar de novo; se a migração precisar mudar, **migração nova** (a antiga já foi aplicada).
- [x] **Step 4:** `npm run db:types`; conferir o alvo antes (linha "vínculo atual" e `supabase/.temp/project-ref`); a função `voltar_a_etapa` entra em `Functions` de `src/types/database.ts`. Registrar a migração em `supabase/AMBIENTES.md`. Comitar tudo (migração, teste, tipos) no mesmo commit.

### Task 3: Módulo — tipos, cliente falso, real e traduções (critério 3)

**Files:** Modify `src/processos/tipos.ts`, `src/testes/ClienteSupabaseFalso.ts`, `src/processos/processosSupabase.ts`, `src/processos/lerProcessoSupabase.ts`; Create `src/processos/andamentosSupabase.ts`; Tests: `src/processos/andamentosSupabase.test.ts`, `src/processos/lerProcessoSupabase.test.ts`.

**Interfaces (produzidas):**
```ts
export type DatasDaEtapa = { iniciadaEm: string | null; resolvidaEm: string | null } // AAAA-MM-DD
export type UsuarioResponsavel = { id: string; nome: string }
// EtapaDoProcesso ganha: responsavelId: string | null; responsavelInativo: boolean
// ModuloDeProcessos ganha:
voltarParaEtapa(andamentoId: string, motivo: string): Promise<void>
corrigirDatasDaEtapa(andamentoId: string, datas: DatasDaEtapa): Promise<void>
mudarResponsavelDaEtapa(andamentoId: string, usuarioId: string | null): Promise<void>
/** Usuários ativos de perfil Administrador ou Integrante, por nome. */
listarResponsaveisPossiveis(): Promise<UsuarioResponsavel[]>
```

- [x] **Step 1 (teste primeiro, vê falhar):** em `andamentosSupabase.test.ts`, com o `ClienteSupabaseFalso` (que ganha `rpc`): (a) `voltarParaEtapa` chama `rpc('voltar_a_etapa', { p_andamento, p_motivo })`; (b) `corrigirDatasDaEtapa` faz `update` em `andamentos` com `{ iniciada_em, resolvida_em }` filtrado por id; (c) `mudarResponsavelDaEtapa` faz `update { responsavel_id }`; (d) traduções: `data_no_futuro:2026-10-20` → "A data 20/10/2026 está no futuro."; `resolvida_antes_do_inicio:2026-10-01:2026-10-05` → "A conclusão (01/10/2026) não pode ser antes do início (05/10/2026)."; `responsavel_invalido:Maria Teste` → "Maria Teste não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP."; `motivo_obrigatorio` → "O motivo é obrigatório."; `etapa_nao_resolvida:<n>` → "A etapa <n> ainda não foi resolvida."; erro `42501` → "Seu perfil não permite alterar os processos."; zero linhas com o andamento legível → perfil; ilegível → `CadastroInexistente`; (e) `listarResponsaveisPossiveis` pede `usuarios` com `ativo = true` e perfil em `administrador`, `integrante_ep`, e devolve por nome. Em `lerProcessoSupabase.test.ts`: o responsável da etapa traz `responsavelId` e `responsavelInativo` (do `ativo` de `usuarios`).
- [x] **Step 2:** rodar `npx vitest run src/processos`; esperado: falha.
- [x] **Step 3:** implementar. `ClienteSupabaseFalso.rpc(nome, args)` guarda `{ tabela: 'rpc', operacao: nome, valores: args }` e responde por `rpc.<nome>`. Mover `mudarAndamento`, `andamentoExiste` e as traduções de `processosSupabase.ts` para `andamentosSupabase.ts`, acrescentar as operações novas e as frases; `processosSupabase.ts` só monta o módulo. `lerAndamentosDoProcesso` seleciona `responsavel:usuarios(id, nome, ativo)`.
- [x] **Step 4:** `npx vitest run src/processos` verde; `npm run typecheck`; `npm run lint`. Comitar.

### Task 4: Falso e regras puras (critérios 3 e 4)

**Files:** Modify `src/processos/andamentoFalso.ts`, `ProcessosFalso.ts`, `caminhoDeEtapas.ts`; Tests `andamentoFalso.test.ts`, `caminhoDeEtapas.test.ts`, novo `ProcessosFalso.voltar.test.ts`.

- [x] **Step 1 (teste primeiro):** `acoesDaEtapa`: etapa resolvida anterior à atual → `['voltar']`; com todas resolvidas (índice atual −1) toda resolvida → `['voltar']`; a pendente futura → `[]`; a atual continua com as ações de hoje. `ProcessosFalso`: `voltarParaEtapa` põe a escolhida em andamento e as seguintes não pendentes em pendente, recalcula etapa atual e situação (concluído deixa de ser), nota vazia recusada com `TravaDoBanco('O motivo é obrigatório.')`, sem mexer nos processos quando a etapa é do setor; `corrigirDatasDaEtapa` recusa futuro (hoje do falso é `2026-10-13`) e conclusão antes do início com as frases do critério 3; `mudarResponsavelDaEtapa` recusa quem não está em `usuariosPossiveis` com a frase do critério 3 e atualiza o `responsavelNome`, `responsavelId` e o `responsavel` do cartão quando é a etapa atual; `listarResponsaveisPossiveis` devolve `usuariosPossiveis`. As chamadas entram em `chamadas` (`{ acao: 'voltar', id, nota: motivo }`, `{ acao: 'datas', id, ... }`, `{ acao: 'responsavel', id, usuarioId }`).
- [x] **Step 2:** rodar; esperado falha. **Step 3:** implementar (`andamentoFalso.ts` com funções puras `voltarEtapas(etapas, id)` e `conferirDatas(datas)`; o falso aplica em etapas do processo e do setor). **Step 4:** verde, typecheck, lint; comitar.

### Task 5: Tela — voltar, datas e responsável (critérios 4, 5 e 7)

**Files:** Modify `LinhaDaEtapa.tsx`, `CaminhoDeEtapas.tsx`, `CaminhoDoProcesso.tsx`, `EtapasDoSetor.tsx`, `Etapas.css`; Create `FormularioDeDatas.tsx`, `SeletorDeResponsavel.tsx`; Test `src/App.voltarDatasResponsavel.test.tsx` (aplicativo inteiro, molde de `App.andamentoDoProcesso.test.tsx`).

Comportamento:
- `AcaoDaEtapa` ganha `'voltar'` ("Voltar a esta etapa"): abre `JanelaComCampo` ("Voltar à etapa {nome}?", campo "Motivo", ação "Voltar"); confirmar grava `voltarParaEtapa`.
- Botão [Corrigir datas] em cada etapa que já tem alguma data (para quem pode alterar) abre `FormularioDeDatas` (`<input type="date">` "Início" quando tem início e "Conclusão" quando está resolvida, `max` = hoje do relógio; [Salvar] e [Cancelar]); gravar chama `corrigirDatasDaEtapa`; recusa aparece em vermelho (`role="alert"`) com o valor, e o formulário fica aberto.
- Só nas etapas do processo e para quem pode alterar: `SeletorDeResponsavel` (`<select>` rotulado "Responsável de {etapa}", opção "Sem responsável" e os `listarResponsaveisPossiveis`; responsável inativo aparece como opção desabilitada "{nome} (Inativo)", selecionada); trocar grava na hora. Consulta vê só o texto "Responsável: {nome}" (e "(Inativo)" quando for o caso) e nenhum botão ou campo.
- O cartão do Quadro já mostra o avatar do responsável da etapa atual (`CartaoDoProcesso`); fica só o teste.

- [x] **Step 1 (teste de tela primeiro, vê falhar):** (1) painel: etapas 4 e 5 concluídas e a 6 atual → [Voltar a esta etapa] na 4 e na 5, nenhuma na 6 nem nas futuras; voltar à 4 com motivo grava, a 5 volta a pendente e a 4 a "Em andamento"; confirmar desabilitado com motivo vazio, Esc não grava; falha de gravação (texto e `TravaDoBanco`) aparece em vermelho; (2) processo concluído: voltar tira a pílula "Concluído"; (3) tela do setor: [Voltar a esta etapa] nas etapas do setor resolvidas e a lista de processos do setor não muda; (4) datas: corrigir início e conclusão grava e mostra DD/MM/AAAA; data no futuro e conclusão antes do início mostram a frase com o valor recebido e o formulário continua preenchido; Cancelar não grava; (5) responsável: o seletor lista só os usuários possíveis, escolher grava; inativo aparece "(Inativo)" e não é opção a escolher; recusa do falso aparece em vermelho; (6) Consulta não vê [Voltar], [Corrigir datas] nem seletor; (7) cartão do Quadro mostra o avatar do responsável da etapa atual depois de trocar o responsável; (8) históricos: textos "Voltou à etapa", "Corrigiu as datas da etapa", "Mudou o responsável da etapa" com o motivo (esse na Task 6).
- [x] **Step 2:** `npx vitest run src/App.voltarDatasResponsavel.test.tsx`; esperado falha.
- [x] **Step 3:** implementar os componentes; manter `CaminhoDeEtapas` pequeno extraindo um hook `useAcoesDaEtapa` se passar de 20 linhas por função.
- [x] **Step 4:** teste novo verde; conferir os testes antigos que contam botões (`App.andamentoDoProcesso`, `App.etapasDoSetor`) e ajustá-los só onde o botão novo for esperado; `npm test`, typecheck, lint. Comitar.

### Task 6: Histórico (critério 6)

**Files:** Modify `src/cadastros/historicoDosCadastros.ts`; Test `src/cadastros/historicoDosCadastros.test.ts`.

- [x] **Step 1 (teste primeiro):** `textoDaAcaoDoCadastro('voltar', 'andamento')` → "Voltou à etapa"; `'corrigir_datas'` → "Corrigiu as datas da etapa"; `'mudar_responsavel'` → "Mudou o responsável da etapa"; `descreverEstadoDoCadastro` mostra "Responsável: {nome}" (rótulo `responsavel_nome`) e o motivo continua mostrado pelo formato que a lista já usa.
- [x] **Step 2:** falha; **Step 3:** acrescentar as três ações em `TEXTO_DA_ACAO_DO_ANDAMENTO` e `responsavel_nome: 'Responsável'` em `ROTULO_DO_CAMPO`; **Step 4:** verde; comitar.

### Task 7: Fechamento do ticket

- [x] **Step 1:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:circular`, tudo verde.
- [x] **Step 2:** escrever a entrada do ticket 06 em `.scratch/processos-etapas/desvios.md` (as decisões de projeto acima, o que ficou de fora, a conferência visual não feita) e as notas do protocolo em `.scratch/melhorias-protocolo.md` (o CLAUDE.md manda ler `.claude/regras/nao-testados.md` ao fim do comando).
- [x] **Step 3:** comitar; seguir o passo 4 do `/executar-complexo` (merge na `main`, `git branch -d`, linha `Concluído em` no ticket 06).

## Auto-revisão (spec × plano)

- Critério 1 → Task 1 (casos 1 a 15) e Task 2. Critério 2 → caso 16 e a função sem `security definer`. Critério 3 → Tasks 3 e 4. Critério 4 → Task 5. Critério 5 → Task 5 (caso 7). Critério 6 → Tasks 2 (evento) e 6 (texto). Critério 7 → Task 5 (caso 6). Critério 8 → Task 5 (casos 1 a 7).
- Nomes consistentes: `voltarParaEtapa`, `corrigirDatasDaEtapa`, `mudarResponsavelDaEtapa`, `listarResponsaveisPossiveis`, `DatasDaEtapa`, `UsuarioResponsavel`, `public.voltar_a_etapa(p_andamento, p_motivo)`, ações de evento `voltar`, `corrigir_datas`, `mudar_responsavel`.
