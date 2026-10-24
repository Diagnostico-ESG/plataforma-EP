# Plano do ticket 05 de revisoes-aprovacao: registrar revisão e aprovação sem trava

> Executar com `superpowers:executing-plans`. Marcar `- [x]` ao fim de cada tarefa.

**Ticket:** `.scratch/revisoes-aprovacao/issues/05-registrar-revisao-e-aprovacao-sem-trava.md` (requisitos e critérios estão lá; aqui só a execução).
**Spec:** `.scratch/revisoes-aprovacao/spec.md`, seção "Andamento livre" (histórias 32 a 48, "Modelo de dados", "Quem pode o quê", "Regras que o banco impõe", "Decisões de teste").
**Branch:** `quadro-livre-parte-1` (de integração, já em uso; **não** se junta à `main` neste ticket). Sem worktree.
**Regras de `.claude/regras/banco.md` que valem:** teste de banco antes da migração; migração por `npx supabase migration new`; função sem `security definer`, exceto as que gravam evento (`security definer`, `search_path` vazio, execução revogada de todos); privilégio por coluna; a RLS decide; a interface só fala com o banco por `src/lib/supabase.ts` e pelos módulos; o `npm test` nunca depende do banco ligado.
**Banco de teste:** Docker local (`npx supabase start`, `npx supabase test db`; vale contar `ok` e `not ok`). A migração **não** vai ao desenvolvimento remoto neste ticket (é o ticket 04 de publicacao-e-arquivamento). Os tipos saem de `npx supabase gen types --local`.

## Decisões de execução

1. **"Corrigida" pela hora, nos testes pela mão.** A regra da spec (versão enviada pela Revisão interna desde a entrada da passagem) compara `versoes.enviada_em` (`now()`, o início da transação) com `passagens.entrou_em` (`clock_timestamp()`). Numa transação só, como no pgTAP, uma versão enviada depois do movimento aparece como anterior à entrada. Em produção cada pedido é uma transação e a regra vale. Nos testes, um auxiliar `security definer` do `pg_temp` carimba `enviada_em = clock_timestamp()` na versão enviada na passagem. Sem coluna nova em `versoes`.
2. **Aprovação nova pelo UPDATE, com marca.** `registrar_aprovacao` é função sem `security definer`: precisa de `update` nas colunas `versao_id`, `registrada_por` e `registrada_em`. A marca `ep.registrando_aprovacao`, ligada só dentro da função (padrão de `ep.movendo_processo`), é o que libera a troca dessas três colunas; fora dela o gatilho recusa com `aprovacao_so_pela_funcao`. O evento da troca é `substituir`; a edição fora da função continua `editar`.
3. **`passagem_id` na revisão** preenchida pelo gatilho (a coluna fica fora do privilégio de inclusão), única quando preenchida. Revisão antiga fica com `passagem_id` vazio; o "resultado" dela só muda para "sem alteração" (para "corrigida" falta a passagem: recusa `corrigida_sem_versao_na_passagem`).
4. **Recusas novas** (códigos do banco → frases da spec): `revisao_ja_registrada`, `corrigida_sem_versao_na_passagem`, `aprovacao_so_pela_funcao` (frase técnica). Mudam de frase: `revisao_fora_da_etapa` ("Registre a revisão com o processo na Revisão interna."), `aprovacao_fora_da_etapa` ("Registre a aprovação com o processo na Aprovação pelo setor."), `sem_versao` ("O processo ainda não tem versão."). Saem as frases e os códigos das travas que acabaram (`revisor_e_autor`, `corrigida_sem_versao_do_revisor`, `corrigida_sem_versao_anterior`, `sem_revisao_da_versao`, `sem_aprovacao`, `aprovacao_antes_da_revisao`, `versao_incompleta` na aprovação). `aprovacao_nao_se_apaga` sai com o gatilho.
5. **O Agora lê os registros** pelo módulo de revisões (como a gaveta já faz com a aprovação), num `useCarregamento` no `CaminhoDoProcesso`; depois de gravar, recarrega. `RevisaoInterna` ganha `daPassagemAberta`; a falsa calcula pela contagem das passagens da etapa no processo falso (sem ids novos).
6. **Versão da passagem na leitura do processo:** `UltimaVersao` ganha `enviadaNestaPassagem` (o módulo real compara `enviada_em` e a etapa da versão com a entrada da passagem aberta). A janela monta as opções por função pura. `SecaoDeVersoes` avisa o verso quando as versões mudam (`aoAlterarVersoes`), para o processo ser relido e "Corrigida" ficar disponível sem fechar a janela.
7. **Editar a revisão leva o resultado.** Na janela de edição o resultado é um par de opções (as mesmas da janela de registrar, com "Corrigida" desabilitada sem versão da passagem); o escopo só aparece em "Corrigida".
8. **Frases do aviso** (spec): autor "Você enviou a V{n}. A revisão interna deveria ser de outra pessoa." (amarelo, `role="status"`); aprovação "Esta aprovação toma o lugar da aprovação da V{n}, registrada em {dd/mm/aaaa}."; "Corrigida" desabilitada "Nenhuma versão foi enviada desde que o processo entrou na Revisão interna.".

## Tarefas

### Tarefa 0: marco

- [x] `git tag marco/2026-10-24-inicio-ticket-05-revisoes-aprovacao` e `git push origin "refs/tags/marco/*:refs/tags/marco/*"`.

### Tarefa 1: testes de banco (falham primeiro)

**Arquivos:** `supabase/tests/39_revisao_interna.test.sql`, `40_aprovacao.test.sql`, `41_editar_registros.test.sql` (reescritos; o 38 já está certo).

- [ ] 39: revisão pelo gatilho com `passagem_id`; segunda na mesma passagem recusada e nova depois de sair e voltar aceita; "corrigida" sem versão na passagem recusada e com ela aceita (versões certas); processo sem versão, fora da etapa, suspenso, cancelado, concluído e arquivado recusados; o autor aceito (revisando a própria versão); nada se apaga; perfis (administrador, integrante, consulta, inativo, visitante); mover não mexe na revisão.
- [ ] 40: `registrar_aprovacao` na Aprovação pelo setor; sem versão e fora da etapa recusados; segunda chamada troca a versão e os campos e gera o evento `substituir` com o antes; versão incompleta aceita; data de ontem antes da revisão aceita, amanhã e `ftp://` recusados; mover da Aprovação à Revisão interna mantém a aprovação; apagar recusado a todos; versão aprovada sem arquivo substituído; perfis; estrutura.
- [ ] 41: edição da revisão (comentário, escopo, resultado com versões recalculadas) em andamento e concluído aceita, em suspenso, cancelado e arquivado recusada; edição da aprovação idem; as colunas fixas (revisor, data, versão revisada, passagem) sem privilégio; as três colunas da função recusadas fora dela; eventos de edição.
- [ ] Rodar no Docker local: os três falham (a migração não existe).

### Tarefa 2: migração

**Arquivo:** `supabase/migrations/<data>_registrar_revisao_e_aprovacao.sql` (+ `supabase/AMBIENTES.md`).

- [ ] Revisão: `passagem_id`, índice único, privilégio de `update (resultado, escopo, comentario)`, gatilhos de inclusão e de edição novos, funções que saem (`preparar_sem_alteracao`, `preparar_corrigida`, `autor_da_versao`, `id_da_versao_anterior` se nada mais as usar), evento da edição com o resultado e as versões de antes.
- [ ] Aprovação: sem apagar (privilégio, política, gatilhos e função do evento "desfazer"), `update` das colunas da função, marca, gatilhos de inclusão e de edição novos, `conferir_data_da_aprovacao(date)`, `registrar_aprovacao`, evento `substituir`.
- [ ] Rodar o Docker local até 0 `not ok` (as 54 baterias): `db reset` só se preciso; conferir os testes 44, 46 e 51 a 54 ao fim.

### Tarefa 3: tipos do banco

- [ ] `npx supabase gen types --local` para `src/types/database.ts` (via `scripts/gerar-tipos.mjs`, se aceitar `--local`; senão o comando direto). Conferir o diff: só `passagem_id` e `registrar_aprovacao`.

### Tarefa 4: módulo de revisões, frases e recusas (testes primeiro)

**Arquivos:** `src/revisoes/tipos.ts`, `frasesDeRevisao.ts`, `frasesDeAprovacao.ts`, `revisoesSupabase.ts`, `RevisoesFalso.ts`, `conferirAprovacao.ts`, `eventoDaRevisao.ts`, `eventoDaAprovacao.ts`, `src/processos/recusasDoBanco.ts`, `gravarAcoes.ts` e os testes (`revisoesSupabase.test.ts`, `RevisoesFalso*.test.ts`, `frasesDe*.test.ts`).

- [ ] Testes que falham: `registrarRevisao` (insert em `revisoes_internas`) e `registrarAprovacao` (rpc `registrar_aprovacao`) no módulo real com o cliente simulado; `editarRevisao` levando o resultado; a leitura com `daPassagemAberta`; cada frase nova; a falsa recusando como o banco (fora da etapa, sem versão, segunda na passagem, "corrigida" sem versão da passagem, aprovação substituindo com o evento).
- [ ] Implementar; `npm test -- src/revisoes src/processos/recusasDoBanco` verde.

### Tarefa 5: funções puras e leitura do processo (testes primeiro)

**Arquivos:** `src/revisoes/opcoesDaRevisao.ts` (novo), `rascunhoDaRevisao.ts`, `src/processos/tipos.ts`, `lerProcessoSupabase.ts`, `agoraDoProcesso.ts` e os testes.

- [ ] Testes que falham: opções de resultado com a versão da passagem (V7 "sem alteração"; V8 corrige V7; desabilitada com o motivo), aviso do autor por opção, aviso da aprovação que toma o lugar da anterior, resumo do registro da passagem; `lerUltimaVersao` com `enviadaNestaPassagem`.
- [ ] Implementar; verde.

### Tarefa 6: tela

**Arquivos:** `AgoraDoProcesso.tsx`/`CorpoDoAgora.tsx` (+ `RegistrosDoAgora.tsx` novo), `JanelaDeRegistroDaRevisao.tsx` e `JanelaDeRegistroDaAprovacao.tsx` (novos), `JanelaDaRevisao.tsx` (edição com resultado), `RevisoesDaEtapa.tsx`, `AprovacaoDaEtapa.tsx`, `CamposDaRevisao.tsx`, `CaminhoDoProcesso.tsx`, `SecaoDeVersoes.tsx`, `VersoDoCartao.tsx`, `historicoDosCadastros.ts`, `Agora.css`, e os testes de tela.

- [ ] Testes de tela que falham (aplicativo inteiro): `src/App.registrarRevisao.test.tsx`, `src/App.registrarAprovacao.test.tsx`; ajustes em `App.editarRegistros.test.tsx`, `App.aprovacaoNaGaveta.test.tsx`, `JanelasDeEdicao.test.tsx`, `historicoDasRevisoes.test.ts`.
- [ ] Implementar; `npm test` inteiro, `npm run typecheck`, `npm run lint` e `npm run check:circular` verdes.

### Tarefa 7: fecho

- [ ] Docs: `desvios.md` (decisões 1 a 3), spec (decisões a confirmar), ticket (`Concluído em`), `.scratch/proximo-passo.md`, `.claude/regras/nao-testados.md` → `.scratch/melhorias-protocolo.md`.
- [ ] Commits por assunto (o pre-commit roda a bateria), `git push origin quadro-livre-parte-1`.
- [ ] Juntar à `main`? **Não**: a branch de integração segue aberta (ticket 04 de publicacao-e-arquivamento). O passo 4 do comando fica registrado como não aplicável.
