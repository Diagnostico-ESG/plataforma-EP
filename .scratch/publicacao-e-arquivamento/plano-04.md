# Plano do ticket 04 — Chegada a Concluídos, publicação, arquivamento e integração

> Execução com `superpowers:executing-plans`, na branch `quadro-livre-parte-1` (a de integração, que este ticket termina; o isolamento já está feito, sem worktree). Marque `- [x]` ao fim de cada passo.

**Ticket:** `.scratch/publicacao-e-arquivamento/issues/04-chegada-a-concluidos-publicacao-arquivamento-e-integracao.md` (o que construir e os critérios estão lá). **Spec:** `.scratch/publicacao-e-arquivamento/spec.md`, seção "Andamento livre" (histórias 46 a 63). ADR 0024.

## O que o ticket 24 e o 25 já deixaram (não refazer)

- Banco: `mover_processo(p_processo, p_etapa, p_data_da_publicacao, p_link_da_publicacao, p_explicacao_sem_publicacao)` com a chegada, a saída que apaga a explicação, as colunas `publicado_em`, `link_da_publicacao`, `explicacao_sem_publicacao` (só pelas funções, gatilho `publicacao_so_pela_funcao`), a trava do arquivado em mover, etiqueta e responsável, a conversão dos dados. Testes `49` e `52` já provam isso.
- Tela: `DadosDaChegada`, `moverProcesso(id, etapaId, chegada?)` (módulo real e falso), `chegadaPedeJanela`, selo "Sem publicação", `AcoesDoConcluido` com [Arquivar], `AgoraDoArquivado`. `useMovimentoDoProcesso` hoje mostra `FRASE_DA_CHEGADA_PENDENTE` no lugar da janela: é isso que este ticket troca.
- Falta: `registrar_publicacao` nova, arquivar suspenso e cancelado, a janela da chegada, o registrar e corrigir publicação, o Agora de Concluídos e do arquivado, o histórico, as frases novas e a integração.

## Regras de `.claude/regras/banco.md` que valem aqui

- Teste de banco antes da migração; migração criada por `npx supabase migration new`; migração, teste e tipos no mesmo commit.
- Funções novas sem `security definer` (rodam com a permissão de quem chama; a RLS decide), `search_path` vazio, execução só para `authenticated`. A view continua `security_invoker = true`.
- Alvo conferido antes de qualquer comando no banco: o Docker local nos testes (`vínculo atual` de `supabase/AMBIENTES.md` e `supabase/.temp/project-ref`); o remoto só pelo workflow "Migrar banco de desenvolvimento", e a produção não entra.
- Saída de `supabase start` e `status` traz chaves: não repetir.

## Decisões deste plano (vão para `desvios.md` se mudarem)

- A recusa de arquivar o que está em andamento fora de Concluídos mantém o motivo `arquivar_so_concluido:<situação>`; só a frase muda para "Só se arquiva processo concluído, suspenso ou cancelado.".
- A view ganha `explicacao_sem_publicacao` no fim (o verso a mostra; a coluna já é legível por todo perfil ativo pela política de `processos`, então nada novo se expõe). O pacote das planilhas não a traz.
- "Arquivado · {situação}" na Lista é a pílula da situação e o selo "Arquivado" lado a lado, como já estão (spec, "Interface", e o critério `[visual]`). O ticket 04 só ganha o teste do suspenso e do cancelado arquivados.
- O registrar publicação grava com a marca `ep.movendo_processo = 'publicar'` (nova): libera as colunas da publicação sem abrir as passagens do movimento.

## Review Focus (entradas que a spec não nomeia e que mais mordem)

1. Registrar publicação no suspenso ou cancelado não arquivado: recusa `processo_parado`, como o resto.
2. Link só com espaços vira nulo (não é recusado); link com 501 caracteres é recusado.
3. Corrigir a publicação para uma data antes de `aprovada_em`: recusado como o registrar.
4. Levar a Concluídos duas vezes seguidas pelo clique duplo do botão: a segunda chamada é a "mesma etapa" e não grava.
5. A janela da chegada reaberta depois de cancelada volta sem opção marcada e sem o texto digitado antes.

## Tarefas

### Tarefa 1 — Banco: registrar_publicacao, arquivar suspenso e cancelado, evento da publicação

**Arquivos:** criar `supabase/tests/55_registrar_publicacao.test.sql` e a migração (nome gerado por `npx supabase migration new registrar_publicacao_e_arquivar_tudo`); alterar `supabase/tests/49_arquivar_e_registrar_publicacao.test.sql`.

**Interfaces — produz:** `public.registrar_publicacao(p_processo uuid, p_data date, p_link text default null) returns void`; recusas `publicacao_fora_da_etapa`, `arquivado_ja_publicado` (e as que já existem: `registro_inexistente`, `processo_parado:<situação>`, `data_da_publicacao_obrigatoria`, `data_no_futuro:<data>`, `publicacao_antes_da_aprovacao:<data>:<aprovada>`, `link_invalido`, 42501); eventos `registrar_publicacao` e `corrigir_publicacao` (entidade `processo`, `antes` e `depois` com `publicado_em` e `link_da_publicacao`); `arquivar_processo` aceitando suspenso e cancelado; coluna `explicacao_sem_publicacao` na view.

- [x] **Passo 1: teste 49 ajustado.** Os dois casos "arquivar suspenso/cancelado é recusado" viram `lives_ok`; acrescente: suspenso arquivado aparece com `situacao = 'suspenso'`, mesma `etapa_atual_codigo` e `arquivado_em` preenchido; mover o suspenso arquivado é recusado com `processo_arquivado`; `desarquivar_processo` do suspenso devolve `situacao = 'suspenso'`, a mesma etapa e `arquivado_em` nulo; o cancelado idem com `cancelado`. Troque o último `hasnt_function('registrar_publicacao')` por `has_function('public', 'registrar_publicacao', array['uuid','date','text'])`. Ajuste `plan(n)`.
- [x] **Passo 2: teste 55 (novo, no molde do 49: `_tap`, usuários a1 a4, `pg_temp.claims`).** Processos com a versão completa e a aprovação (`pg_temp.concluir` do 49). Casos, cada um uma asserção com a frase do nome:
  - integrante registra na Publicação: `publicado_em`, `link_da_publicacao` gravados; etapa continua `publicacao`; evento `registrar_publicacao` com o autor e `depois.publicado_em`;
  - em Concluídos sem data: registra; `sem_publicacao` da view vira falso; continua em Concluídos;
  - corrigir (já com data): troca data e link; evento `corrigir_publicacao` com o `antes` da data anterior;
  - em Não iniciados: `throws_ok … 'P0001', 'publicacao_fora_da_etapa'`;
  - data de amanhã: `data_no_futuro:`…; data antes de `aprovada_em`: `publicacao_antes_da_aprovacao:`…; data nula: `data_da_publicacao_obrigatoria`; link `ftp://x`: `link_invalido`; link de 501 caracteres: `link_invalido`; link só com espaços: aceito e gravado nulo;
  - suspenso não arquivado: `processo_parado:suspenso`;
  - arquivado com data: `arquivado_ja_publicado`; arquivado sem data: aceito e `arquivado_em` continua preenchido; evento `registrar_publicacao` gerado;
  - Consulta: `42501`; inativo: `registro_inexistente`; visitante (`anon`): `42501`;
  - mover para Concluídos com a explicação não gera `registrar_publicacao` (o evento é o do movimento);
  - estrutura: `registrar_publicacao` sem `security definer`.
- [x] **Passo 3: ver os dois testes falharem.** Docker local: `npx supabase start` (descartar a saída), depois `npx supabase test db`; conte as linhas `not ok` (o "FAIL" do comando é do formato dos testes). Esperado: 49 e 55 reprovados por função inexistente e pela recusa antiga.
- [x] **Passo 4: migração.** Em `private`, a marca nova `publicar`: `conferir_colunas_da_publicacao` (recriada) deixa passar quando `private.movendo_processo()` ou `private.marca_do_movimento() = 'publicar'`. Recriar `public.arquivar_processo` aceitando `concluido`, `suspenso` e `cancelado` (recusa `arquivar_so_concluido:<situação>` só para o que sobra, `ja_arquivado` antes dela, como hoje). Criar `public.registrar_publicacao` na ordem: processo existe (`registro_inexistente`), `private.pode_alterar_cadastros()` (42501), arquivado sem data libera e arquivado com data recusa `arquivado_ja_publicado`, não arquivado passa por `private.conferir_processo_em_andamento`, etapa atual em `publicacao` ou `concluidos` (`publicacao_fora_da_etapa`), `private.conferir_data_da_publicacao` e `private.conferir_link_da_aprovacao(nullif(btrim(p_link), ''))`, `update` com a marca `publicar` e `ep.liberando_arquivado = 'on'` desligados no fim (zero linhas = RLS = 42501). Gatilho `registrar_evento_da_publicacao` (`after update of publicado_em, link_da_publicacao`, `security definer`, só com a marca `publicar`): ação `registrar_publicacao` se `old.publicado_em` era nulo, senão `corrigir_publicacao`; base `nome` e `setor_sigla` como o do arquivamento. A view recriada com `create or replace`, copiando a definição da migração `20261024040942_andamento_livre_sai_o_modelo_anterior.sql` (conferir se alguma migração posterior a mudou: `grep -l "view public.processos_com_andamento" supabase/migrations/*`) e `p.explicacao_sem_publicacao` como última coluna. Grants: `revoke … from public, anon` e `grant … to authenticated` nas funções novas; a do gatilho só chamada por ele.
- [x] **Passo 5: ver tudo verde.** `npx supabase test db`: 0 `not ok` em todos os arquivos (hoje 1266 `ok`).
- [x] **Passo 6: tipos e commit.** `npx supabase gen types --local` para `src/types/database.ts` (entram `registrar_publicacao` em `Functions` e `explicacao_sem_publicacao` na view; conferir que o resto não mudou além do que o ticket 05 escreveu à mão). Commit: `publicacao-e-arquivamento 04: registrar publicação e arquivar suspenso e cancelado (migração, testes 49 e 55, tipos)`.

### Tarefa 2 — Módulo: link, explicação, registrar publicação e as frases

**Arquivos:** alterar `src/processos/tipos.ts`, `processoDaLinha.ts` (+ teste), `frasesDePublicacao.ts`, `frasesDoMovimento.ts`, `recusasDoBanco.ts` (+ teste), `arquivamentoFalso.ts`, `movimentoFalso.ts`, `ProcessosFalso.ts`, `processosSupabase.ts`; criar `publicacaoSupabase.ts`, `publicacaoFalso.ts` e `publicacaoSupabase.test.ts`; alterar `ProcessosFalso.arquivamento.test.ts` e `ProcessosFalso.mover.test.ts`; criar `ProcessosFalso.publicacao.test.ts`.

**Interfaces — produz:** `ProcessoDaLista.linkDaPublicacao?: string | null` e `explicacaoSemPublicacao?: string | null`; `ModuloDeProcessos.registrarPublicacao(id: string, data: string, link: string | null): Promise<void>` (também corrige); `criarPublicacaoSupabase(cliente, recusas): Pick<ModuloDeProcessos, 'registrarPublicacao'>`; frases novas (exatas): `FRASE_DA_PUBLICACAO_FORA_DA_ETAPA = 'Registre a publicação com o processo na Publicação ou em Concluídos.'`, `FRASE_DO_ARQUIVADO_JA_PUBLICADO = 'O processo arquivado já tem a publicação registrada.'`, `fraseDoArquivarSoConcluido` → `'Só se arquiva processo concluído, suspenso ou cancelado.'`, `FRASE_DA_CHEGADA_OBRIGATORIA = 'Para ir a Concluídos, informe a data da publicação ou conclua sem publicação.'`, `FRASE_DA_EXPLICACAO_OBRIGATORIA = 'A explicação é obrigatória para concluir sem publicação.'`.

- [ ] **Passo 1: testes que falham.**
  - `processoDaLinha.test.ts`: `link_da_publicacao` e `explicacao_sem_publicacao` da linha chegam como `linkDaPublicacao` e `explicacaoSemPublicacao`.
  - `publicacaoSupabase.test.ts` (cliente simulado, no molde de `situacaoSupabase.test.ts`): `registrarPublicacao('p1', '2026-10-20', 'https://x.gov.br')` chama `rpc('registrar_publicacao', { p_processo, p_data, p_link })`; com `link` null o `p_link` não vai; recusa `publicacao_fora_da_etapa` e `arquivado_ja_publicado` chegam como `TravaDoBanco` com as frases acima; `data_no_futuro` e `publicacao_antes_da_aprovacao` e `link_invalido` já mapeadas continuam.
  - `ProcessosFalso.arquivamento.test.ts`: arquivar suspenso e cancelado aceito; em andamento fora de Concluídos recusado com a frase nova; o arquivado suspenso não move; desarquivar devolve situação e etapa.
  - `ProcessosFalso.mover.test.ts`: mover para Concluídos com a explicação guarda `explicacaoSemPublicacao`; com data e link guarda `publicadoEm` e `linkDaPublicacao`; sair de Concluídos apaga a explicação e mantém a data.
  - `ProcessosFalso.publicacao.test.ts`: `registrarPublicacao` na Publicação e em Concluídos grava e não move; corrige quando já há data; em outra etapa recusa com a frase da etapa; arquivado com data recusa; arquivado sem data aceita; suspenso recusa como parado; data futura, link fora de `http(s)` e data antes da aprovação recusados com as frases do banco.
- [ ] **Passo 2: rodar `npx vitest run src/processos` e ver falhar.**
- [ ] **Passo 3: implementar.** Os tipos e a leitura (opcionais no `ProcessoDaLista`, como `publicadoEm`); `publicacaoSupabase.ts` como `arquivamentoSupabase.ts` (a `rpc` e `falhaDoBanco`); `recusasDoBanco.ts` ganha `publicacao_fora_da_etapa` e `arquivado_ja_publicado` na lista de motivos e no mapa; `publicacaoFalso.ts` com `registrarPublicacao(processo, data, link, hoje)` que aplica as regras do banco (reaproveite `publicacaoPelaData` de `movimentoFalso.ts`, exportando-a, em vez de repeti-la); `movimentoFalso.publicacaoDaChegada` passa a devolver também `linkDaPublicacao` e `explicacaoSemPublicacao`, e `ProcessosFalso.movido` os grava e apaga a explicação ao sair; `arquivamentoFalso.arquivar` aceita as três situações. Troque o texto das frases citadas acima e acerte os testes antigos que as citavam (`grep -rn "Para concluir, informe\|A explicação é obrigatória\.\|Só um processo concluído" src`).
- [ ] **Passo 4: `npx vitest run src/processos`, `npx tsc --noEmit` e `npx eslint src/processos` verdes. Commit.**

### Tarefa 3 — Janela de chegada a Concluídos

**Arquivos:** criar `src/processos/rascunhoDaChegada.ts` (+ teste), `src/components/processos/JanelaDaChegada.tsx`, `src/App.chegadaAConcluidos.test.tsx`; alterar `src/processos/publicacao.ts` (+ teste), `src/hooks/useMovimentoDoProcesso.ts`, `QuadroDeProcessos.tsx`, `CaminhoDoProcesso.tsx`, `CorpoDoAgora.tsx`, `AgoraDoProcesso.tsx` (só as passagens do hook), `src/processos/ProcessosFalso.mover.test.ts` se citar o aviso.

**Interfaces — produz:**
- `RascunhoDaChegada = { opcao: 'publicado' | 'sem_publicacao' | null; data: string; link: string; explicacao: string }`, `RASCUNHO_DA_CHEGADA_VAZIO` (opção nula, `data` = hoje, o resto vazio), `chegadaCompleta(r: RascunhoDaChegada): boolean` (publicado: data preenchida; sem publicação: explicação com texto depois de aparada), `dadosDaChegada(r): DadosDaChegada` (publicado: data e link, o link vazio vira null, explicação null; sem publicação: só a explicação aparada).
- `useMovimentoDoProcesso` devolve `chegada: { processo: ProcessoDaLista; etapa: DestinoDoMovimento } | null` e `fecharChegada(): void`; `mover` abre a chegada (não grava) quando `chegadaPedeJanela`; sai o `aviso` e `FRASE_DA_CHEGADA_PENDENTE`.
- `<JanelaDaChegada chegada processos aoGravar aoFechar />` (usa `JanelaDeEdicao` e `useGravacaoNaJanela`): título `Levar {nome} a Concluídos`, botão "Levar a Concluídos", duas escolhas (radio) "Publicado" e "Concluir sem publicação", nenhuma marcada ao abrir; só os campos da escolhida (Data `type="date"` com `max` de hoje e hoje por padrão, Link `type="url"` até 500; Explicação em área de texto até 2.000 com a dica "Por que este processo não será publicado?" e a orientação de não anotar dado pessoal de pessoas do setor); botão desabilitado até `chegadaCompleta`; grava por `processos.moverProcesso(id, etapa.id, dadosDaChegada(r))`, a recusa ou falha em vermelho sem perder o preenchido; Esc e [Cancelar] não gravam.

- [ ] **Passo 1: testes que falham.** `rascunhoDaChegada.test.ts` (as quatro regras acima, inclusive explicação só com espaços, link vazio virando null). `App.chegadaAConcluidos.test.tsx` com o aplicativo inteiro e `ProcessosFalso`: (a) escolher Concluídos na lista Etapa do Agora abre a janela com o título e sem opção marcada, e o botão desabilitado; (b) "Publicado" mostra Data e Link e habilita o botão, grava pela data e o processo vai a Concluídos com "Publicado em dd/mm/aaaa"; (c) "Concluir sem publicação" mostra a Explicação e só habilita com texto; grava e o cartão tem o selo "Sem publicação"; (d) arrastar o cartão para Concluídos abre a mesma janela, e Esc deixa o cartão onde estava e nada grava; (e) com a data já registrada o processo vai direto, sem janela; (f) recusa do falso (data no futuro) aparece em vermelho e o preenchido fica; (g) reabrir depois de cancelar volta limpa; (h) Consulta não tem a lista nem o arrasto (nada abre).
- [ ] **Passo 2: rodar os dois arquivos e ver falhar.**
- [ ] **Passo 3: implementar** na ordem: `rascunhoDaChegada.ts`; o hook; a janela; montar `<JanelaDaChegada>` no `QuadroDeProcessos` e no `CaminhoDoProcesso` (uma linha cada, só quando `movimento.chegada`), com `aoGravar` chamando o `aoMudar` que já existe e `aoFechar` = `fecharChegada`. Apague `FRASE_DA_CHEGADA_PENDENTE` e os `movimento.aviso` que sobrarem sem uso (`QuadroDeProcessos`, `CorpoDoAgora`), junto com seus testes e estilos órfãos (`.quadro-aviso` só se nada mais o usar).
- [ ] **Passo 4: `npx vitest run`, `npx tsc --noEmit` e `npx eslint src` verdes. Commit.**

### Tarefa 4 — Registrar e corrigir publicação; Agora de Concluídos, do suspenso, do cancelado e do arquivado

**Arquivos:** criar `src/components/processos/JanelaDaPublicacao.tsx`, `src/processos/rascunhoDaPublicacao.ts` (+ teste), `src/App.registrarPublicacao.test.tsx`; alterar `src/processos/publicacao.ts` (+ teste), `AgoraDoConcluido.tsx`, `CorpoDoAgora.tsx`, `AgoraDoProcesso.tsx`, `src/App.arquivamento.test.tsx`, `src/App.listaDosArquivados.test.tsx`, `src/App.concluidos.test.tsx`.

**Interfaces — produz:**
- `linhaDoConcluido(p: Pick<ProcessoDaLista, 'publicadoEm' | 'explicacaoSemPublicacao'>): string` → `Concluído · Publicado em dd/mm/aaaa` ou `Concluído sem publicação: {explicação}`; `linhaDaPublicacao` continua para o arquivado.
- `RascunhoDaPublicacao = { data: string; link: string }`, `rascunhoDaPublicacao(p)` (preenchido com a data e o link do processo, ou hoje e vazio), `dadosDaPublicacao(r)` (link vazio vira null).
- `<JanelaDaPublicacao processo processos aoGravar aoFechar />`: título `Registrar publicação` ou, com data já registrada, `Corrigir publicação` (janela preenchida); campos Data e Link; salva por `processos.registrarPublicacao(processo.id, data, link)`.
- O Agora: na etapa Publicação, [Registrar publicação] ou [Corrigir publicação]; em Concluídos, a linha acima (link numa aba nova quando há), [Registrar publicação] ou [Corrigir publicação] e [Arquivar] como botão principal; suspenso e cancelado com [Arquivar] ao lado de [Retomar]; arquivado com `Arquivado · {situação}: {motivo}` (suspenso e cancelado; concluído continua `Arquivado`), [Registrar publicação] só sem data e em Publicação ou Concluídos, e [Desarquivar]; sem [Corrigir] no arquivado. A Consulta lê a linha de Concluídos e os selos, sem botão.

- [ ] **Passo 1: testes que falham.** Funções puras (`linhaDoConcluido` com data, com data e sem explicação, sem data; `rascunhoDaPublicacao` nos dois modos). `App.registrarPublicacao.test.tsx`: Registrar na etapa Publicação (a data de hoje vem sugerida; processo não sai da etapa); em Concluídos sem publicação o botão grava e o selo "Sem publicação" some; com data o botão é [Corrigir publicação] e a janela vem preenchida; no arquivado sem data há [Registrar publicação] e com data não há botão de corrigir; recusa em vermelho sem perder o preenchido (data futura; link fora de `http(s)`); Consulta sem botões. `App.arquivamento.test.tsx`: suspenso e cancelado têm [Arquivar] (ao lado de [Retomar] no suspenso), arquivam e somem do Quadro mantendo o texto `Arquivado · Suspenso: {motivo}` com [Desarquivar], que devolve a situação e a etapa. `App.listaDosArquivados.test.tsx`: a Lista mostra a pílula da situação e o selo "Arquivado" lado a lado para o suspenso e o cancelado arquivados. `App.concluidos.test.tsx`: o Agora de Concluídos traz `Concluído · Publicado em …` com o link numa aba nova (`target="_blank"` com `rel="noopener noreferrer"`) ou `Concluído sem publicação: …`, e [Arquivar] é o botão principal.
- [ ] **Passo 2: rodar e ver falhar.**
- [ ] **Passo 3: implementar** `publicacao.ts`, `rascunhoDaPublicacao.ts`, a janela (no molde de `JanelaDeRegistroDaAprovacao`, com `useGravacaoNaJanela`), e os botões em `AgoraDoConcluido.tsx` (separe `AcoesDaPublicacao` dos outros componentes para o arquivo ficar abaixo de 300 linhas e as funções abaixo de 20), `CorpoDoAgora.tsx` (o botão na etapa Publicação) e `AgoraDoProcesso.tsx` (`SituacaoParada` ganha [Arquivar]; a Consulta, a linha). O link da publicação é de fora: só `http(s)` vira `<a>`, o banco já garante.
- [ ] **Passo 4: `npx vitest run`, `npx tsc --noEmit` e `npx eslint src` verdes. Commit.**

### Tarefa 5 — Histórico

**Arquivos:** alterar `src/cadastros/historicoDosCadastros.ts` (+ `historicoDosCadastros.test.ts`) e, se o texto vier de outro módulo, `src/processos/agrupamentoDoHistorico.ts`.

- [ ] **Passo 1: teste que falha.** Evento `registrar_publicacao` do processo mostra "Registrou a publicação" com a data (dd/mm/aaaa) e o link; `corrigir_publicacao` mostra "Corrigiu a publicação" com antes e depois; evento `mover` cujo `depois` traz `explicacao_sem_publicacao` mostra "Concluiu sem publicação" com a explicação como motivo; evento `mover` que sai de Concluídos com a explicação no `antes` continua "Moveu o processo" e mostra a explicação apagada; `arquivar` e `desarquivar` seguem como estão.
- [ ] **Passo 2: ver falhar, implementar** (as chaves `publicado_em`, `link_da_publicacao` e `explicacao_sem_publicacao` já têm rótulo; falta o verbo das duas ações novas e a troca do verbo do movimento), **ver passar, commit.**

### Tarefa 6 — Verificação do conjunto

- [ ] **Passo 1:** `npm test` (todos verdes, cobertura mínima de 70% mantida), `npx tsc --noEmit`, `npm run lint` e `npm run build`, tudo sem erro.
- [ ] **Passo 2:** bateria de banco no Docker local: `npx supabase db reset` e `npx supabase test db`; conte `ok` e `not ok` (esperado 0 `not ok`; anote o total de `ok`).
- [ ] **Passo 3: `git status` limpo; marque as caixas dos critérios que já valem no ticket. Commit do plano.**

### Tarefa 7 — Integração (aplicar no desenvolvimento, conferir, juntar à `main`)

Depende do usuário em dois pontos (disparar workflows exige o login do GitHub no navegador do app, já que não há `gh`; a conferência com login real é dele). Sem esses dois, pare e entregue o que falta como comando pronto.

- [ ] **Passo 1: envio.** `git push origin quadro-livre-parte-1` (sem `--force`). Dispare "Testes de banco" na branch e leia o resultado (esperado: todos os arquivos verdes, o 49 e o 55 incluídos). Falhou: corrija pela causa e repita; três tentativas sem resolver, pare (regra de parada).
- [ ] **Passo 2: alvo.** Confira `supabase/AMBIENTES.md` (vínculo `yclkzyoebpsxmgpbcbus`, desenvolvimento) e `supabase/.temp/project-ref` antes de qualquer passo no remoto. Produção não entra.
- [ ] **Passo 3: aplicar as migrações, em ordem, pelo workflow "Migrar banco de desenvolvimento"** (uma por disparo; o workflow para com aviso se alguma já estiver aplicada): `20261024040938_andamento_livre_passagens.sql`, `20261024040942_andamento_livre_sai_o_modelo_anterior.sql`, `20261024040945_andamento_livre_mover.sql`, `20261024173606_pacote_pela_posicao_no_catalogo.sql`, `20261024182706_registrar_revisao_e_aprovacao.sql` e a desta tarefa. Duas delas são destrutivas no desenvolvimento por decisão do ADR 0022 (apagam eventos e tabelas do modelo anterior); só dados de teste. Registre cada uma em `supabase/AMBIENTES.md` no formato das linhas existentes (data, ticket, testes, workflow).
- [ ] **Passo 4: tipos do remoto.** Confira o alvo e rode `npm run db:types`; compare com `src/types/database.ts` (o ticket 05 o editou à mão): o que divergir, o gerado vale. `npm test` e `npx tsc --noEmit` de novo; commit.
- [ ] **Passo 5: conferência na tela com o login real** (do usuário, no app apontado para o desenvolvimento): mover pela lista e arrastando, etiqueta, responsável, registrar revisão e aprovação, chegada a Concluídos pelas duas opções, registrar e corrigir publicação, arquivar e desarquivar o concluído, o suspenso e o cancelado; mais os dois critérios `[visual]` da spec (janela de chegada em 1366×768; "Arquivado" e a pílula juntos na Lista). Anote aqui, abaixo, o que foi visto e o que foi presumido.
- [ ] **Passo 6: republicar a função das planilhas** é passo do usuário (roteiro `docs/planilhas-publicar-a-funcao.md`), depois atualizar as planilhas pela aba Planilhas. Registre que foi pedido.
- [ ] **Passo 7: juntar à `main`.** `git switch main`, `git merge --no-ff quadro-livre-parte-1` (sem `--force`), `git push origin main`; "Testes de banco" na `main` conferido. Marco `marco/2026-10-24-andamento-livre-parte-1` (se o nome existir, acrescente `-2`), enviado com `git push origin "refs/tags/marco/*:refs/tags/marco/*"`. Apague a branch já integrada com `git branch -d quadro-livre-parte-1` (se recusar, pare e pergunte).

## Conferência na tela (preencher no passo 5 da tarefa 7)

- Visto: _(pendente)_
- Presumido: _(pendente)_
