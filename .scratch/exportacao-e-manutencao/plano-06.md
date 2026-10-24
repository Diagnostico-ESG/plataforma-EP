# Plano do ticket 06: planilhas pela posição no catálogo

> Executar com `superpowers:executing-plans`. Marcar `- [x]` ao fim de cada tarefa.

**Ticket:** `.scratch/exportacao-e-manutencao/issues/06-planilhas-pela-posicao-no-catalogo.md` (requisitos e critérios estão lá e na spec; aqui só a execução).
**Spec:** `.scratch/exportacao-e-manutencao/spec.md`, seção "Andamento livre (mudança de 2026-10-23)" (histórias 56 a 63, Solução, Decisões de implementação e de teste).
**Branch:** `quadro-livre-parte-1` (de integração; **não** se junta à `main` neste ticket, como nos tickets 24 e 25). Sem worktree.
**Banco:** regras de `.claude/regras/banco.md` que valem: estrutura só por migração nova (a `20261024040942` já está na branch mas fora do desenvolvimento; ainda assim a mudança vai em arquivo novo, para não reescrever o que o ticket 24 testou); teste antes da migração; função `security definer` em `private`, `search_path` vazio, sem execução para `anon`/`authenticated`; o pacote não leva nome nem e-mail de pessoa. Esta sessão **não aplica nada no banco remoto**: testa no Docker local (`npx supabase start`, `npx supabase test db`; vale contar `ok` e `not ok`) e o "Testes de banco" do GitHub confere no fim. A migração só chega ao desenvolvimento no ticket 04 de publicacao-e-arquivamento, e republicar `planilhas-dos-dashboards` é passo do usuário.

## Estado de partida (já lido)

- `private.montar_pacote_das_planilhas` (migração `20261024040942`, trecho "Pacote das planilhas: o mínimo") já traz `passagens` (sem `movido_por`), `etapa_atual_id`, `etiqueta` e `publicado_em`, mas ainda traz `concluido`, deixa entrar suspensos e cancelados e o teste 44 diz isso. As funções puras e seus testes ainda leem `andamentos`, `vai_para_publicacao` e as situações antigas.
- Datas de passagem chegam como `timestamptz` (ISO); as planilhas mostram dia de Brasília (`America/Sao_Paulo`).

## Decisões de execução

1. **Regra da posição** (por fase `F` de IV a VII, no catálogo ativo do pacote): `ultima(F)` = etapa de maior `ordem` com fase `F`. A fase é:
   - **Sem etapa**: não há etapa em `F`;
   - **Concluída**: `ordem` da etapa atual > `ordem` de `ultima(F)`, ou a etapa atual é `ultima(F)` com etiqueta `concluido`. Em `VII` só vale com `publicado_em`; sem ele é **Sem publicação**;
   - **Em andamento**: a etapa atual tem fase `F` e a fase não está concluída;
   - **Não iniciada**: o resto. Fases I a III: sempre Concluída, sem data.
   Etapa atual fora do catálogo do pacote (não deve ocorrer): todas Não iniciada e rótulo "Em andamento"; o código não quebra.
2. **Data de conclusão** (IV a VI), só se a fase está Concluída agora: percorrer as passagens do processo por `entrou_em`; cada uma "conta desde" `entrou_em` (etapa depois da última da fase) ou `concluido_em` (está na última da fase e tem `concluido_em`), ou não conta; a data é o início da **sequência final** de passagens que contam, em dia de Brasília. Assim o processo que concluiu, seguiu adiante e voltou-e-concluiu de novo vale a data mais recente, e o que concluiu e seguiu em frente sem voltar mantém a data da conclusão. Em VII, a data é `publicado_em`.
3. **Rótulo:** etapa atual `concluidos`: "Publicado" com `publicado_em`, senão "Concluído"; `nao_iniciados`: "Não iniciado"; outra: "Em andamento · {fase da etapa atual}".
4. **Quem entra:** só `situacao_guardada = 'em_andamento'`, no banco **e** de novo na função pura (defesa em profundidade, e é o que o teste "suspensos e cancelados fora" prova). O arquivado já chega como concluído.
5. **Troca de modelo de uma vez nos arquivos puros.** O pre-commit roda `tsc` e `npm test` na árvore inteira; trabalhar sem commitar no meio das tarefas 2 a 5 e commitar por assunto no fim (banco; funções puras; documentação).
6. **Fora do ticket (vai para `.scratch/backlog.md`):** `docs/manutencao/07-dashboards-no-data-studio.md` ainda descreve os cartões "Prontos para iniciar" e "Aguardando"; refazer os dashboards no Data Studio é passo do usuário depois da republicação.

## Review Focus (entradas que a spec não nomeia; cada uma tem teste na tarefa dona)

1. Etapa atual fora do catálogo do pacote → não quebra (tarefa 3 e 4).
2. Processo em Concluídos sem `publicado_em` → fase VII "Sem publicação", rótulo "Concluído", fases IV a VI concluídas (tarefa 3).
3. Passagem aberta com `concluido_em` nulo na última etapa da fase com etiqueta `concluido` (dado incoerente) → data vazia, sem erro (tarefa 3).
4. Pacote com dois processos, um sem passagem aberta → a recusa cita a posição do processo e nunca o nome (tarefa 2).
5. Fixa com fase preenchida ou etapa de trabalho sem fase → recusa citando campo, valor recebido e esperado (tarefa 2).

## Tarefas

### Tarefa 1: banco (teste antes, depois a migração)

**Arquivos:** `supabase/tests/44_pacote_das_planilhas.test.sql`, nova `supabase/migrations/<timestamp>_pacote_pela_posicao_no_catalogo.sql` (criada com `npx supabase migration new pacote_pela_posicao_no_catalogo`).

- [x] Reescrever o teste 44 (ajustar o `plan(n)`): trocar "o cancelado entra" por **cancelado e suspenso fora** (acrescentar o processo `T44 Suspenso` com `public.suspender_processo(..., 'Motivo inventado')`; ambos ausentes de `processos` e de `passagens` não importa); tirar `concluido` da lista de campos (lista final: `data_da_reuniao, etapa_atual_id, etiqueta, id, macroprocesso_nome, nome, observacoes, publicado_em, setor_sigla, situacao_guardada, tipo, ultima_versao`); o concluído e o arquivado provados por `etapa_atual_id` = id de `concluidos` (o arquivado continua no pacote); as duas fixas no pacote com `fase` nula (`jsonb_typeof(e -> 'fase') = 'null'`) e as de trabalho com fase; manter passagens sem `movido_por`, sem nome de responsável, sem e-mail e o pedido do núcleo.
- [x] Rodar no Docker local e ver falhar pelos motivos certos (suspenso/cancelado presentes, `concluido` presente): `npx supabase start`, depois `npx supabase test db` (descartar a saída do `start`); contar `not ok`.
- [x] Migração: `create or replace function private.montar_pacote_das_planilhas()` igual à do trecho "o mínimo", com `where p.situacao_guardada = 'em_andamento'` na lista de processos e sem a chave `concluido`; repetir o `revoke execute ... from public, anon, authenticated`. Comentário de cabeçalho no padrão das migrações vizinhas (ticket, ADR 0022/0024, o que muda).
- [x] `npx supabase db reset` local, `npx supabase test db` completo: todos os arquivos `ok` (os testes 43, 46 e 47 não podem regredir). Registrar a contagem. Commit: teste 44 + migração juntos.

### Tarefa 2: tipos do pacote e validação (`planilhasPacote.ts`, `planilhasExemplos.ts`)

**Interfaces produzidas** (as tarefas 3 a 5 dependem destes nomes):
- `EtapaDoPacote.fase: FaseDoRegimento | null`; `ProcessoDoPacote` perde `concluido` e `vai_para_publicacao` e ganha `etapa_atual_id: string`, `etiqueta: EtiquetaDaEtapa`, `publicado_em: string | null`; `EtiquetaDaEtapa = 'a_fazer' | 'em_andamento' | 'concluido'` com `ETIQUETAS_DA_ETAPA`; `PassagemDoPacote { processo_id; etapa_id; entrou_em: string; saiu_em: string | null; etiqueta: EtiquetaDaEtapa; concluido_em: string | null }`; `PacoteDasPlanilhas.passagens` no lugar de `andamentos`. Saem `StatusDaEtapa`, `STATUS_DA_ETAPA`, `AndamentoDoPacote`. `CODIGOS_DAS_FIXAS = ['nao_iniciados', 'concluidos']`.
- Exemplos: `etapasDoCatalogo()` devolve as 8 etapas (`nao_iniciados` ordem 1 sem fase; as seis atuais; `concluidos` ordem 8 sem fase); `processoNaTrilha(n, passos: PassoDaTrilha[], campos?)` devolve `{ processo, passagens }`, em que `PassoDaTrilha = { etapa: string (código); entrou: string (ISO); etiqueta?: EtiquetaDaEtapa; concluidoEm?: string }`, cada passagem fecha (`saiu_em`) na entrada da seguinte, a última fica aberta, e o processo ganha `etapa_atual_id`/`etiqueta` da última; `pacoteDe(lista de { processo, passagens }, etapas?)` e `pacoteMinimo()` ajustados.

- [x] Testes novos em `planilhasPacote.test.ts`, vistos falhar: aceita fixa com fase nula; recusa fixa com fase "IV" (frase com campo `etapas[i].fase`, valor recebido `"IV"`, esperado vazio); recusa etapa de trabalho com fase nula; recusa processo sem passagem aberta e processo com duas abertas (frase com `processos[i]`, sem o nome); recusa `publicado_em` mal formado; aceita `entrou_em` com fuso (`2026-10-24T12:00:00.123456+00:00`); os testes antigos de `andamentos` e de `vai_para_publicacao` viram `passagens`/`publicado_em`.
- [x] Implementar: regras novas na validação (fase nula aceita em `REGRAS_DA_ETAPA` + conferência cruzada com o código da etapa; `conferirPassagensAbertas(processos, passagens)` depois de `conferirLista` das passagens), reaproveitando `conferirObjeto`/`conferirLista`/`daLista`. Ajustar `planilhasExemplos.ts`.

### Tarefa 3: situação e data das fases (`planilhasFases.ts`, mais `planilhasFuso.ts`)

**Interfaces produzidas:** `planilhasFuso.ts` com `dataEHoraDeBrasilia(instanteIso)` (movida de `planilhasPublica.ts`, que a reexporta para os testes dela não mudarem) e `diaDeBrasilia(instanteIso): string` (AAAA-MM-DD); `SituacaoDaFase = 'Concluída' | 'Em andamento' | 'Não iniciada' | 'Sem publicação' | 'Sem etapa'`; `FaseDoProcesso { fase; situacao; concluidaEm: string | null }` (igual); `situacaoDasFases(etapas: EtapaDoPacote[], processo: ProcessoDoPacote, passagens: PassagemDoPacote[]): FaseDoProcesso[]`, em que `passagens` são só as do processo; sempre 7 itens, I a VII.

- [x] Reescrever `planilhasFases.test.ts` com pacotes inventados (`processoNaTrilha`), vistos falhar. Casos, cada um com a fase e o dia esperados: depois da fase (processo em Revisão do setor: IV e V concluídas, VI em andamento, VII não iniciada); na última etapa da fase com Concluído (VI concluída) e com A fazer (VI em andamento); em Não iniciados (IV a VII não iniciadas); em Concluídos com publicação (todas concluídas, VII com a data da publicação); em Concluídos sem publicação (IV a VI concluídas, VII "Sem publicação" sem data); VII em andamento na Publicação sem data; fase sem etapa ("Sem etapa", e a seguinte segue a regra); I a III sempre concluídas sem data; **data**: concluiu e seguiu em frente mantém a data da conclusão; foi além, voltou e concluiu de novo vale a mais recente; foi além, voltou e não concluiu (fase em andamento, data nula); data de Brasília (`2026-05-02T01:30:00Z` → `2026-05-01`); `concluido_em` nulo com etiqueta `concluido` → data vazia sem erro; etapa atual fora do catálogo → tudo "Não iniciada".
- [x] Implementar `situacaoDasFases` pela decisão 1 e pela decisão 2, em funções pequenas (uma para a situação, uma para o início da sequência final), dentro do limite de linhas e de complexidade do ESLint.

### Tarefa 4: rótulo, datas e quem entra (`planilhasProcesso.ts`)

**Interfaces produzidas:** `rotuloDoProcesso(processo: ProcessoDoPacote, etapas: EtapaDoPacote[]): string`; `dataDaModelagemPiloto(processo: ProcessoDoPacote, fases: FaseDoProcesso[]): string`; `dataDaPublicacao(processo: ProcessoDoPacote): string`; `ProcessoAnalisado { processo; fases }`; `analisarProcessos(pacote): ProcessoAnalisado[]`. Saem `CODIGO_DA_MODELAGEM_PILOTO`, `CODIGO_DA_PUBLICACAO`, a lista de andamentos em `ProcessoAnalisado` e `faseAtual`. `rotuloDoTipo` e `rotuloDaVersao` não mudam.

- [x] Reescrever `planilhasProcesso.test.ts`, visto falhar: cada rótulo ("Publicado", "Concluído", "Não iniciado", "Em andamento · IV", "Em andamento · VII", etapa fora do catálogo → "Em andamento"); data da modelagem piloto = data da reunião, e sem ela = conclusão da fase IV, e vazia se nenhuma; data da publicação = `publicado_em` ou vazia; `analisarProcessos` deixa de fora suspensos e cancelados (arquivados ou não: o arquivado chega como concluído e entra), preserva a ordem do pacote.
- [x] Implementar.

### Tarefa 5: as duas planilhas e o cenário (`planilhasInterna.ts`, `planilhasPublica.ts`, `planilhasCenario.ts`, testes)

- [x] Ajustar `planilhasCenario.ts` ao modelo novo: processos inventados em Não iniciados, em cada fase, publicado, concluído sem publicação, arquivado (concluído com publicação), um suspenso e um cancelado (fora das planilhas); o campo de pessoa (`responsavel`) fica no processo e nas passagens para o teste provar que nenhum nome chega às linhas.
- [x] Ajustar `planilhasInterna.ts` (colunas e cabeçalhos iguais; a linha usa as assinaturas novas) e `planilhasPublica.ts` (contagem de "Concluída" e total sem os suspensos; usa `planilhasFuso.ts`). Testes de `planilhasInterna.test.ts`, `planilhasPublica.test.ts`, `planilhasPedido.test.ts` e `planilhasLote.test.ts` ajustados: linhas esperadas por situação nova, suspenso e cancelado ausentes, nenhum nome de pessoa nas duas planilhas, contagens públicas.
- [x] `npm test` verde, `npx tsc --noEmit` limpo, `npm run lint` limpo. Registrar a contagem de testes. Commit: funções puras e testes.

### Tarefa 6: documentação e fechamento

- [ ] `docs/manutencao/06-planilhas-e-dashboards.md`, linhas de "Situação de cada fase" e "Rótulo do processo": reescrever pela posição no catálogo (decisões 1 e 3); acrescentar a linha de backlog da decisão 6.
- [ ] Rodar o workflow "Testes de banco" na branch (push da branch e disparo, autorizados na seção "Testes de banco no GitHub Actions" do `CLAUDE.md`) e ler o resultado; se falhar por causa do ticket, corrigir; se for a regressão conhecida das migrações do ticket 24 não aplicadas no remoto, registrar em `desvios.md`.
- [ ] `desvios.md` da funcionalidade (entradas novas, datadas), `plano-06.md` com as caixas marcadas, linha `Concluído em` no ticket, `.scratch/proximo-passo.md`, `.scratch/melhorias-protocolo.md` (itens não testados do `/executar-complexo` que aconteceram). Commit e `git push origin quadro-livre-parte-1`.
- [ ] **Não** juntar à `main` nem apagar a branch (passo 4 do comando não se aplica a ticket de branch de integração; ver ticket 24).
