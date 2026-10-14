# Ticket 07 de processos-etapas (Situação do processo) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** a equipe suspende, cancela e retoma um processo, sempre com motivo; enquanto ele está parado, nenhuma etapa dele muda, o painel explica por quê e o Quadro mostra os suspensos e esconde os cancelados.

**Architecture:** uma migração acrescenta as funções `public.suspender_processo`, `cancelar_processo` e `retomar_processo(p_processo, p_motivo)` (sem `security definer`; a RLS decide), um gatilho que só deixa a situação mudar por elas e confere a transição, a conferência de "processo parado" no gatilho dos andamentos, e a ação e o motivo no evento do processo. O módulo de processos ganha `suspenderProcesso`, `cancelarProcesso` e `retomarProcesso` (real e falso). A tela ganha `AcoesDeSituacao` (botões e janela de motivo) e o aviso de processo parado no caminho de etapas.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 21, 22 (cancelados), 53 a 56, 59; "Interface", "Regras que o banco impõe", "Regras de estado") · **Ticket:** `.scratch/processos-etapas/issues/07-situacao-do-processo.md` (critérios citados como "critério N", na ordem do ticket).

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Teste antes da migração; migração, teste de banco e tipos no mesmo commit de integração. Regras de `.claude/regras/banco.md` lidas nesta sessão: RLS decide quem chama; função de conferência sem `security definer`, com `revoke ... from public, anon` e `grant execute ... to authenticated`; função só de gatilho, `revoke` de todos; alvo do banco conferido (vínculo atual = desenvolvimento, `yclkzyoebpsxmgpbcbus`).
- Banco só pelo GitHub Actions: teste no workflow "Testes de banco" e migração no "Migrar banco de desenvolvimento", ambos na branch `processos-etapas-07` (autorizado no CLAUDE.md, "Ajustes deste Projeto"). Produção fora deste ticket.
- Recusas do banco chegam como `P0001` com "motivo:valor" e viram `TravaDoBanco` com a frase pronta. Frases do ticket (critérios 3 e 4): "Este processo está {suspenso | cancelado}; retome-o para registrar o andamento." (recusa) e "Este processo está {suspenso | cancelado}: {motivo}. Retome-o para registrar o andamento." (aviso).
- Funções de 4 a 20 linhas, arquivos até 300, tipos explícitos, sem `any`.

## Decisões do plano

- Situação só muda pelas funções: `grant update (situacao, motivo_da_situacao)` e gatilho "antes" que recusa a mudança direta (`situacao_so_pela_funcao`); a função liga `ep.mudando_situacao` na transação (padrão de `ep.voltando`).
- Transições (spec, Regras de estado): em_andamento→suspenso|cancelado, suspenso→em_andamento|cancelado, cancelado→em_andamento. Outra recusa com `situacao_invalida:de:para`.
- Congelamento: `preparar_andamento` chama `private.conferir_processo_em_andamento(new.processo_id)` antes de qualquer outra conferência (inclusive antes do atalho de `voltando`); recusa `processo_parado:{situacao}`.
- Quadro: `colunasDoQuadro` já tira cancelado e concluído, e `CartaoDoProcesso` já traz a pílula "Suspenso"; este ticket só acrescenta o teste de tela que prova isso (critério 5).
- O teste 17 muda em dois pontos: a recusa de `set situacao = situacao` (agora há privilégio de coluna) vira a recusa do gatilho, e a suspensão direta do fim passa pela chave `ep.mudando_situacao`.

## Tarefas

### Tarefa 1 — Teste de banco 20 (falha primeiro)

**Arquivos:** criar `supabase/tests/20_situacao_do_processo.test.sql`; alterar `supabase/tests/17_processos.test.sql` (linhas ~87-89 e ~269).

- [x] Escrever o teste 20 (31 asserções, molde do 19): suspender com motivo, situação, `motivo_da_situacao`, evento `suspender` com motivo; suspender suspenso e sem motivo recusados; iniciar etapa, mudar responsável e voltar com o processo suspenso recusados (`processo_parado:suspenso`); retomar sem motivo recusado; retomar limpa o motivo e gera evento `retomar`; etapa volta a andar; cancelar (de em andamento e de suspenso), evento `cancelar`, cancelado→suspender recusado, etapa de cancelado recusada, retomar cancelado; mudança direta recusada; processo inexistente; funções sem `security definer`; Consulta recusada nas três (`42501`), inativo (`registro_inexistente`) e visitante (`42501`).
- [x] Ajustar o teste 17 como descrito em "Decisões".
- [x] Comitar, `git push` da branch, disparar "Testes de banco" e ler o resultado: o teste 20 deve falhar por função inexistente (e o 17 por já ter o privilégio velho).

### Tarefa 2 — Migração (banco)

**Arquivos:** criar com `npx supabase migration new situacao_do_processo`, só depois da rodada que provou a falha.

- [x] Escrever a migração: `grant update (situacao, motivo_da_situacao)`; `private.mudando_situacao()`; `private.conferir_transicao_da_situacao(de, para)`; gatilho `conferir_situacao_do_processo` (antes de alterar `processos`); `private.mudar_situacao(processo, nova, motivo)`; as três funções públicas; `private.conferir_processo_em_andamento(uuid)` e `preparar_andamento` com a chamada nova (resto igual ao do ticket 06); `private.acao_do_processo(operacao, antes, depois)` e `registrar_evento_do_processo` com ação e `motivo`; `revoke`/`grant`.
- [x] Comitar, `git push`, disparar "Migrar banco de desenvolvimento" na branch com o arquivo novo e depois "Testes de banco": os 21 arquivos verdes, o 20 com 31 de 31.
- [x] `npm run db:types` (vínculo conferido); conferir que `suspender_processo`, `cancelar_processo` e `retomar_processo` entraram em `Functions`.
- [x] Registrar a migração em `supabase/AMBIENTES.md`. Comitar migração, teste e tipos juntos.

### Tarefa 3 — Módulo de processos (real e falso)

**Arquivos:** `src/processos/tipos.ts`; criar `src/processos/situacaoSupabase.ts` (+ `situacaoSupabase.test.ts`); `src/processos/andamentosSupabase.ts` (frases `processo_parado`, `situacao_invalida`; exportar `falhaDoAndamento`); `src/processos/processosSupabase.ts`; criar `src/processos/situacaoFalso.ts` (+ teste); `src/processos/ProcessosFalso.ts`.

- [x] Testes primeiro: `situacaoSupabase.test.ts` (chama `rpc` com `p_processo` e `p_motivo`; `processo_parado:suspenso` vira a frase do critério 3; `motivo_obrigatorio`; `situacao_invalida`; `42501` vira "Seu perfil não permite alterar os processos."; `registro_inexistente` vira `CadastroInexistente`) e `situacaoFalso.test.ts` (transições, motivo obrigatório, retomar limpa o motivo, concluído conta como em andamento guardado, etapa de processo parado recusada).
- [x] Implementar: `ModuloDeProcessos` ganha `suspenderProcesso`, `cancelarProcesso`, `retomarProcesso(id, motivo): Promise<void>`; o real usa `cliente.rpc`; o falso aplica as transições e recusa `iniciar/concluir/dispensar/realizada/voltar/datas/responsavel` com o processo parado.
- [x] `npm test` verde para o módulo; comitar.

### Tarefa 4 — Tela: ações, aviso e histórico

**Arquivos:** criar `src/components/processos/AcoesDeSituacao.tsx`; alterar `AcoesDoProcesso.tsx`, `PainelDoProcesso.tsx`, `CaminhoDoProcesso.tsx`, `src/cadastros/historicoDosCadastros.ts` (+ teste); criar `src/App.situacaoDoProcesso.test.tsx`.

- [x] Teste de tela primeiro (aplicativo inteiro, `ProcessosFalso`, critério 7): [Suspender] e [Cancelar] no processo em andamento; [Retomar] e [Cancelar] no suspenso; [Retomar] no cancelado; Consulta sem os botões; janela de motivo (botão desabilitado vazia, Esc fecha sem gravar); cada ação com sucesso (situação e pílula mudam) e com falha (frase no `role="alert"`); processo parado sem os botões das etapas e com o aviso "Este processo está {suspenso | cancelado}: {motivo}. Retome-o para registrar o andamento."; Consulta também vê o aviso; cartão do suspenso com a pílula "Suspenso" e cancelado fora do Quadro; histórico com "Suspendeu", "Cancelou", "Retomou" e o motivo.
- [x] Implementar `AcoesDeSituacao` (botões por situação, `JanelaComCampo` com título "Suspender o processo {nome}?" etc., rótulo "Motivo", `useGravacaoComFalha`), o aviso no `CaminhoDoProcesso` (e `podeAlterar && !parado` para as etapas), a prop `aoMudar` até `AcoesDoProcesso`, e os textos do histórico (entidade `processo`: `suspender`, `cancelar`, `retomar`; motivo rotulado "Motivo").
- [x] Testes antigos que montam processo com situação diferente de em andamento conferidos; `npm test` e `npm run lint` e `npx tsc` verdes; comitar.

### Tarefa 5 — Fechamento

- [ ] `npm test` completo, `npm run lint`, checagem de tipos; registrar `desvios.md`, melhorias do protocolo e itens não testados (bloco do `/executar-complexo` em `.claude/regras/nao-testados.md`).
- [ ] Marcar o plano, integrar a branch (`git switch main`, merge, `git branch -d`), `git push` da `main`, ticket com `Concluído em`, comitar e conferir o "Testes de banco" da `main`.

## Autoavaliação

- Critério 1 → T1 e T2; 2 → T1 (asserção de `prosecdef` e perfis); 3 → T3; 4 → T4 (ações, aviso, pílulas); 5 → T4 (teste de tela do Quadro); 6 → T1 (evento) e T4 (rótulos); 7 → T4; 8 → T4.
