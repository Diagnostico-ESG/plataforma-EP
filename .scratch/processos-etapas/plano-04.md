# Ticket 04 de processos-etapas (Cadastro de processos e o Quadro) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a equipe cadastra, edita e exclui processos (tipo Processo ou "A classificar") ligados a um setor e a um macroprocesso, vê todos no Quadro (`#/processos`), abre o painel de cada um (`#/processos/<id>`) com dados, caminho de etapas só para leitura e Histórico, e os cadastros passam a recusar apagar o que um processo usa.

**Architecture:** uma migração cria os tipos, a tabela `processos`, a coluna `processo_id` em `andamentos`, a view `processos_com_andamento`, os gatilhos (preparar, andamentos do processo, eventos, recusas de exclusão) e a leitura dos eventos `processo`. O módulo de processos (real e falso) ganha listar, ler, criar, editar, excluir e ler o histórico do processo; o módulo de cadastros passa a traduzir as três recusas novas. A interface ganha a área Processos (Quadro + painel) no lugar do `QuadroVazio`.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 1 a 7, 12 a 15, 17 a 20, 23, 28, 29, 44, 47, 78, 80, 83 a 87; "Interface", "Modelo de dados", "Regras que o banco impõe") · **Ticket:** `.scratch/processos-etapas/issues/04-cadastro-de-processos-e-quadro.md` (critérios citados como "critério N", na ordem do ticket).

## Global Constraints

- Regras de `.claude/regras/banco.md` que valem: teste antes da migração; migração por `npx supabase migration new`; RLS ligada e políticas na mesma migração; função `security definer` só em `private`, `search_path` vazio, execução tirada de `public`, `anon` e `authenticated`; cada célula de "quem pode o quê" de `processos` e `processos_com_andamento` com teste (Administrador, Integrante, Consulta, inativo, visitante); `revoke all` de visitante e logado nas tabelas e na view nova (senão `10_privilegios_padrao` reprova); view com `security_invoker = true`; dado que se calcula é view (etapa atual, situação "concluído", "aguardando o setor"); interface só pela chave publicável (`src/lib/supabase.ts`); conferir o vínculo (`supabase/AMBIENTES.md`, dev `yclkzyoebpsxmgpbcbus`, e `supabase/.temp/project-ref`) antes de `db:types`.
- Rede do escritório: porta 5432 fechada. pgTAP e migração rodam **no GitHub Actions** ("Ajustes deste Projeto" do `CLAUDE.md`): `git push` da branch (sem `--force`), disparo de "Testes de banco" e de "Migrar banco de desenvolvimento" na branch e leitura do resultado dispensam autorização. Produção e `migration repair` só pelo `/ship`. A trava de git barra `sed`/`git` combinados em algumas formas: um comando por vez, leitura pela ferramenta Read.
- `npm test` nunca depende do banco: telas com `AcessoFalso`, `CadastrosFalso` e `ProcessosFalso`.
- ESLint no pre-commit: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; sem `any`; no máximo 2 níveis de indentação. `tsc -b` e `madge --circular` limpos.
- Mensagens da spec, literais (a pluralização de "processo(s)" no singular é decisão de execução, abaixo): "Já existe um processo com o nome {nome} no setor {SIGLA}.", "Não é possível excluir: {setor | macroprocesso} tem {n} processos ligados.", "O setor {SIGLA} tem {n} processos neste macroprocesso; mova-os ou exclua-os antes.", "Carregando processos…", "Carregando processo…", "Não foi possível carregar {os processos | o processo}. Verifique a conexão e tente de novo." + [Tentar de novo], "Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico." + [Voltar], "A alteração não foi salva: {motivo}. Seus dados continuam no formulário.", "O setor {SIGLA} ainda não está no macroprocesso {nome}; ele será incluído ao salvar.", "Excluir o processo {nome}? O histórico guarda o que ele tinha, inclusive as etapas, mas não é possível desfazer." [Excluir processo] [Cancelar], "Nenhum processo cadastrado ainda." + [Cadastrar processo], "Nenhuma alteração registrada ainda.", "Seu perfil não permite alterar os processos.", histórico "Criou", "Editou", "Excluiu".
- Dados de teste inventados. Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **Subprocesso, pai e reclassificação ficam para o ticket 08.** Neste ticket o tipo nasce `processo` ou `a_classificar` (o formulário só oferece esses). Mantêm a recusa: a restrição `processos_pai_coerente` (`tipo = 'subprocesso'` ⇔ há pai), `processo_pai_id` fora do privilégio de inclusão e `tipo`/`processo_pai_id` fora do de alteração (a mudança direta é recusada com 42501; o ticket 08 abre o caminho da função de reclassificar).
- **Andamentos do processo só se leem neste ticket.** A coluna `processo_id` entra em `andamentos`, mas a política de alteração passa a exigir `setor_id is not null`: ninguém muda andamento de processo até o ticket 05 (que reescreve `preparar_andamento` e `registrar_evento_do_andamento` para processo e relaxa a política). Sem isso, a sequência não seria imposta aos processos.
- **Situação e motivo** (`situacao`, `motivo_da_situacao`) existem na tabela, com a restrição de coerência, mas nenhum privilégio de escrita: suspender/cancelar/retomar são do ticket 07.
- **Recusas de exclusão com contagem** saem de gatilhos "antes de apagar" cujo nome vem antes de `registrar_exclusao_do_*` na ordem alfabética (`conferir_...` < `registrar_...`): `setor_com_processos:<n>`, `macroprocesso_com_processos:<n>` e `setor_com_processos_no_macroprocesso:<SIGLA>:<n>` (P0001). A referência composta com `on delete restrict` fica de reserva.
- **Eventos do processo:** `entidade = 'processo'`, `entidade_ref = '<processo_id>'`, `detalhes = {antes, depois}` com `nome`, `setor_id`, `setor_sigla`, `macroprocesso_id`, `macroprocesso_nome`, `tipo`, `origem`, `situacao`, `contexto`, `observacoes`; a exclusão traz também `andamentos` (etapa, status, nota, datas, ordem do catálogo). Gatilho de exclusão é "antes de apagar" (a referência dos andamentos apaga em cascata antes de qualquer gatilho "depois"). Leitura: nova política para todo perfil ativo. O Histórico da área Setores passa a incluir a entidade `processo` (história 80).
- **Frases com contagem 1:** "Não é possível excluir: setor tem 1 processo ligado." e "O setor TSA tem 1 processo neste macroprocesso; mova-o ou exclua-o antes." (a spec dá o plural; o singular é só concordância).
- **Textos novos da conferência na tela** (a spec só diz "obrigatório"): "O nome do processo é obrigatório.", "Escolha o setor do processo.", "Escolha o macroprocesso do processo."
- **Quadro:** a área interna continua `quadro`, mas o endereço passa a `#/processos` (e `#/processos/novo`, `#/processos/<id>`); `#/processos/lista` cai no Quadro até o ticket 09. As colunas saem de `colunasDoQuadro` (função pura); a indicação de colunas fora da vista é CSS puro (sombra de rolagem), sem JS. Cartões são `<a href="#/processos/<id>">` (focáveis, Enter abre).
- **Painel** sobrepõe o Quadro (que continua montado e esmaecido). Abas "Detalhes" e "Histórico". Esc fecha e devolve o foco ao cartão. `[Ver no setor]` leva a `#/setores/<id>`; `AreaDeSetores` passa a abrir o setor do endereço (e voltar à lista limpa o endereço).
- **Formulário:** setores e macroprocessos ativos; na edição, o valor atual aparece mesmo inativo. O aviso amarelo de setor fora do macroprocesso sai de `cadastros.lerMacroprocesso(...).setoresEnvolvidos`.
- **`ProcessosFalso`** imita a recusa de nome repetido por setor (como o banco) e guarda `siglasDosSetores` e `nomesDosMacroprocessos` (preenchidos pelos testes) para montar os cartões.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/17_processos.test.sql` (novo) | pgTAP: quem pode o quê, regras, view, eventos, recusas de exclusão |
| `supabase/migrations/<data>_processos.sql` (novo) | tipos, `processos`, `andamentos.processo_id`, view, gatilhos, políticas |
| `supabase/AMBIENTES.md` · `src/types/database.ts` | registro da migração · tipos gerados |
| `src/cadastros/cadastrosSupabase.ts` · `macroprocessosSupabase.ts` · `setoresEnvolvidosSupabase.ts` (+ testes) | três recusas novas traduzidas |
| `src/processos/tipos.ts` | tipos do processo e seis operações novas |
| `src/processos/listaDeProcessosSupabase.ts` · `lerProcessoSupabase.ts` · `gravarProcessoSupabase.ts` (+ testes) · `processosSupabase.ts` | acesso real |
| `src/processos/ProcessosFalso.ts` | processos em memória |
| `src/processos/colunasDoQuadro.ts` · `validacaoDoProcesso.ts` (+ testes) | funções puras |
| `src/hooks/useAreaAtual.ts` · `src/App.tsx` · `src/components/quadro/QuadroVazio.tsx` | endereço `#/processos`, área nova, estado vazio funcional |
| `src/components/processos/AreaDeProcessos.tsx` · `QuadroDeProcessos.tsx` · `ColunaDoQuadro.tsx` · `CartaoDoProcesso.tsx` · `Quadro.css` (novos) | Quadro |
| `src/components/processos/PainelDoProcesso.tsx` · `DadosDoProcesso.tsx` · `CaminhoDoProcesso.tsx` · `HistoricoDoProcesso.tsx` · `Painel.css` (novos) · `LinhaDaEtapa.tsx` | painel |
| `src/components/processos/FormularioDoProcesso.tsx` · `CamposDoProcesso.tsx` · `AvisoDeSetorIncluido.tsx` (novos) | cadastrar e editar |
| `src/cadastros/historicoDosCadastros.ts` · `historicoSupabase.ts` (+ testes) · `src/components/cadastros/AreaDeSetores.tsx` | histórico dos cadastros com `processo`; setor aberto pelo endereço |
| `src/App.quadro.test.tsx` · `src/App.painelDoProcesso.test.tsx` · `src/App.cadastrarProcesso.test.tsx` (novos) | testes de tela |

---

### Task 1: Banco: processos, andamentos do processo e view (critérios 1 a 3)

**Files:**
- Create: `supabase/tests/17_processos.test.sql`, `supabase/migrations/<data>_processos.sql`
- Modify: `supabase/AMBIENTES.md`, `src/types/database.ts` (gerado)

**Interfaces:**
- Produces: tabela `public.processos` (colunas da spec); `andamentos.processo_id`; view `public.processos_com_andamento` com as colunas `id, nome, tipo, processo_pai_id, origem, situacao_guardada, motivo_da_situacao, contexto, observacoes, criado_em, setor_id, setor_sigla, macroprocesso_id, macroprocesso_nome, situacao (texto: em_andamento | suspenso | cancelado | concluido), etapa_atual_id, etapa_atual_codigo, etapa_atual_nome, etapa_atual_ordem, aguardando_o_setor, responsavel_id, responsavel_nome, responsavel_foto_url`; recusas P0001 `setor_com_processos:<n>`, `macroprocesso_com_processos:<n>`, `setor_com_processos_no_macroprocesso:<SIGLA>:<n>`; constraint `processos_nome_unico` (23505); eventos `entidade = 'processo'`.

- [x] **Step 1: marco e branch.** `git switch -c processos-etapas` e a tag `marco/2026-10-14-inicio-ticket-04-processos-etapas` (já feitos antes de escrever o plano).

- [x] **Step 2: teste que falha.** Criar `supabase/tests/17_processos.test.sql` no molde de `16_responsaveis_do_setor.test.sql` (tabela `_tap`, `plan(N)` conferido ao fim, usuários inventados a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo; setores TPA a TPC para os perfis e TRS/TRX para as regras; macroprocessos `MA` e `MB`; vínculos MA com TPA, TPB e TPC por inclusão direta; um processo semente por setor de perfil, incluído pelo dono do banco). Casos (cada um um `is`/`ok`/`throws_ok`/`lives_ok`):
  1. **Por perfil** (função `pg_temp.conferir_processos(id_usuario, quem, sigla, altera, le)` chamada para Administrador, Integrante, Consulta e Inativo; 10 asserções cada): lê `processos`; lê `processos_com_andamento`; cria (42501 sem permissão); altera `contexto` (linhas afetadas); não troca `id`, `criado_em`, `tipo` nem `situacao` (42501); apaga (linhas afetadas).
  2. **Visitante** (5): `select` em `processos` e na view, `insert`, `update`, `delete` → 42501.
  3. **Regras, como Integrante:** nome com espaços guardado sem eles; `'emitir OFICIO'` recusado (23505, `processos_nome_unico`) quando `'Emitir Oficio'` existe no mesmo setor; o mesmo nome aceito em outro setor; nome em branco recusado (23514); `tipo = 'subprocesso'` recusado (23514, pai incoerente); `processo_pai_id` na inclusão recusado (42501).
  4. **Andamentos do processo:** o processo novo tem 6 andamentos `pendente` de etapas do nível processo; criar e apagar andamento direto recusados (42501 / 0 linhas); alterar `status` de andamento de processo afeta 0 linhas (política exige `setor_id`); andamento com setor e processo ao mesmo tempo recusado (23514, como dono); etapa repetida no mesmo processo recusada (23505, como dono).
  5. **Setor envolvido:** cadastrar com setor fora do macroprocesso inclui o vínculo e gera o evento `setor_envolvido`/`criar`; mover o processo para outro macroprocesso inclui o vínculo do setor no novo e o evento `processo`/`editar` traz `macroprocesso_nome` antes e depois; gravação sem mudança não gera evento.
  6. **Recusas de exclusão (como Integrante):** tirar o vínculo de setor com processos → P0001 `setor_com_processos_no_macroprocesso:TRS:1`; tirar vínculo sem processos funciona; excluir setor com processo → P0001 `setor_com_processos:1`; excluir macroprocesso com processo → P0001 `macroprocesso_com_processos:1`.
  7. **Eventos:** `criar` traz `detalhes` completo (nome, `setor_sigla`, `macroprocesso_nome`, `tipo`, `origem`, `situacao`); excluir o processo grava `excluir` com 6 `andamentos` no "antes" (primeiro: `modelagem`) e apaga os andamentos; Consulta lê os eventos `processo`, o inativo não.
  8. **View (como dono, para montar o estado):** etapa atual = `modelagem` com tudo pendente; `aguardando_o_setor` verdadeiro com as etapas do setor pendentes e falso depois de resolvê-las em ordem (`realizada_anteriormente` com nota); `responsavel_id` da etapa atual aparece quando o andamento tem responsável; `situacao` = `em_andamento` com obrigatórias pendentes e `concluido` com as obrigatórias resolvidas; `suspenso` quando a situação guardada é suspenso (com motivo, como dono).

  Contar as asserções e fixar o `plan(N)`.

- [x] **Step 3: ver falhar.** Commit "Ticket 04 de processos-etapas: teste de banco dos processos"; `git push -u origin processos-etapas`; disparar "Testes de banco" na branch. Esperado: `17_processos` falha (tabela inexistente); os outros 16 arquivos verdes.

- [x] **Step 4: migração.** `npx supabase migration new processos` e escrever, nesta ordem: (a) `create type` de `tipo_de_processo`, `origem_do_processo`, `situacao_guardada`; (b) `create table public.processos` — colunas e limites da spec, `setor_id` e `macroprocesso_id` com `on delete restrict`, `processo_pai_id` com `on delete restrict`, restrições `processos_nome_tamanho` (1 a 200, sem espaços nas pontas), `processos_pai_coerente`, `processos_motivo_da_situacao` (`(situacao = 'em_andamento') = (motivo_da_situacao is null)`), limites de `contexto` (4000), `observacoes` (2000) e motivo (2000), `processos_envolvido_fkey` (`(macroprocesso_id, setor_id)` → `setores_envolvidos`, `on delete restrict`); índices `unique (setor_id, lower(nome))` chamado `processos_nome_unico` e `processos_vinculo (macroprocesso_id, setor_id)`; (c) `enable row level security`, `revoke all ... from anon, authenticated`, `grant select, delete`, `grant insert (setor_id, macroprocesso_id, nome, tipo, origem, contexto, observacoes)`, `grant update (setor_id, macroprocesso_id, nome, origem, contexto, observacoes)`; políticas de leitura (`private.usuario_ativo()`) e de criar, alterar e apagar (`private.pode_alterar_cadastros()`); (d) `alter table public.andamentos`: `setor_id` aceita nulo, coluna `processo_id uuid references public.processos (id) on delete cascade`, restrição `andamentos_um_dono` (`(setor_id is null) <> (processo_id is null)`), `unique (etapa_id, processo_id)`, índice e índice único parcial de um `em_andamento` por processo; `drop policy` e `create policy` de alteração de `andamentos` acrescentando `and setor_id is not null` em `using` e `with check`; (e) `private.preparar_processo()` (antes de incluir e alterar, **sem** `security definer`: nome sem espaços, contexto e observações vazios viram nulos, e na inclusão ou na troca de setor/macroprocesso `insert into public.setores_envolvidos (macroprocesso_id, setor_id) values (...) on conflict do nothing`); (f) `private.criar_andamentos_do_processo()` (`security definer`, depois de incluir: um andamento por etapa ativa do nível `processo`); (g) `private.estado_do_processo(public.processos)` (`security definer`, devolve o `jsonb` legível) e `private.registrar_evento_do_processo()` (`security definer`, depois de incluir e alterar, mesmo molde de `registrar_evento_do_responsavel_do_setor`, ação por `private.acao_do_cadastro`) e `private.registrar_exclusao_do_processo()` (`security definer`, **antes** de apagar, com a lista `andamentos` ordenada pela `ordem` da etapa); (h) os três gatilhos de recusa `conferir_setor_sem_processos` (antes de apagar em `setores`), `conferir_macroprocesso_sem_processos` (em `macroprocessos`) e `conferir_vinculo_sem_processos` (em `setores_envolvidos`), sem `security definer`, contando em `public.processos` e levantando as mensagens da seção "Interface"; (i) a view `processos_com_andamento` (`with (security_invoker = true)`; `situacao` calculada por `case`; etapa atual por `left join lateral` — a `em_andamento` primeiro, senão a pendente de menor `ordem`; `aguardando_o_setor` por `exists` de andamento do setor ainda `pendente` ou `em_andamento`; responsável por `left join public.usuarios`) com `revoke all` de `anon` e `authenticated` e `grant select` a `authenticated`; (j) `revoke execute` de todas as funções novas de `public`, `anon` e `authenticated`; (k) a política `"eventos: perfil ativo lê os processos"` (`entidade = 'processo'`).

- [ ] **Step 5: aplicar e ver passar.** Commit "Ticket 04 de processos-etapas: migração dos processos"; `git push`; disparar "Migrar banco de desenvolvimento" com o nome do arquivo; depois "Testes de banco" na branch. Esperado: os 18 arquivos verdes. Falha: corrigir com **migração nova** (a aplicada não se edita) ou o teste, se o erro for dele. Se `gh` não existir e o navegador do app estiver sem login do GitHub, pedir ao usuário que dispare os workflows pelo celular ou pelo próprio navegador.

- [ ] **Step 6: registro e tipos.** Acrescentar em `supabase/AMBIENTES.md`, na lista das migrações aplicadas, a linha da nova migração (data, ticket 04, teste 17 falhou antes e passou depois, aplicada pelo workflow). Conferir o vínculo (`AMBIENTES.md` e `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`), `npm run db:types`, `npx tsc -b` limpo (`processos` e a view em `src/types/database.ts`). Commit "Ticket 04 de processos-etapas: tipos e registro da migração"; `git push`.

---

### Task 2: Cadastros traduzem as três recusas (critério 4, 3ª frase e 2ª frase)

**Files:**
- Modify: `src/cadastros/cadastrosSupabase.ts`, `src/cadastros/macroprocessosSupabase.ts`, `src/cadastros/setoresEnvolvidosSupabase.ts` e os `*.test.ts` de cada um.

**Interfaces:**
- Consumes: mensagens P0001 da Task 1.
- Produces: `excluirSetor` e `excluirMacroprocesso` rejeitam com `TravaDoBanco("Não é possível excluir: setor tem {n} processos ligados.")` (ou "macroprocesso"); `tirarSetorDoMacroprocesso` rejeita com `TravaDoBanco("O setor {SIGLA} tem {n} processos neste macroprocesso; mova-os ou exclua-os antes.")`; singular com n = 1.

- [ ] **Step 1: testes que falham.** Em cada `*.test.ts`, um teste por recusa com `ClienteSupabaseFalso` respondendo `error: { message: 'setor_com_processos:2', code: 'P0001' }` (e `macroprocesso_com_processos:1`, `setor_com_processos_no_macroprocesso:TSA:3`), esperando a frase e o singular quando n = 1. `npx vitest run src/cadastros` → FAIL.
- [ ] **Step 2: implementação.** Criar `src/cadastros/recusasDeProcessos.ts` (puro) com `frasesDeProcessos(erro: ErroDoBanco): Error | null` que reconhece os três padrões (`/\b(setor_com_processos_no_macroprocesso|setor_com_processos|macroprocesso_com_processos):(.*)$/m`) e devolve a `TravaDoBanco`; chamá-lo no começo de `falhaDoSetor` (só na exclusão), `falhaDoMacroprocesso` (exclusão) e no `tirar` de `setoresEnvolvidosSupabase` (hoje `recusaPorPerfil` direto). Testes do novo arquivo inclusos. `npx vitest run src/cadastros` → PASS.
- [ ] **Step 3: commit** "Ticket 04 de processos-etapas: recusas de exclusão por processo nos cadastros".

---

### Task 3: Módulo de processos: tipos e acesso real (critério 4)

**Files:**
- Modify: `src/processos/tipos.ts`, `src/processos/processosSupabase.ts`
- Create: `src/processos/listaDeProcessosSupabase.ts`, `lerProcessoSupabase.ts`, `gravarProcessoSupabase.ts` e um `*.test.ts` de cada.

**Interfaces:**
- Produces (em `tipos.ts`):
  - `TipoDeProcesso = 'processo' | 'subprocesso' | 'a_classificar'`; `OrigemDoProcesso = 'novo' | 'retomado'`; `SituacaoDoProcesso = 'em_andamento' | 'suspenso' | 'cancelado' | 'concluido'`.
  - `EtapaDoCatalogo = { id; codigo; nome; ordem; ativa: boolean }` (só nível processo).
  - `ProcessoDaLista = { id; nome; tipo; setorId; setorSigla; macroprocessoId; macroprocessoNome; situacao; etapaAtual: { codigo; nome; ordem } | null; aguardandoOSetor: boolean; responsavel: { id; nome; fotoUrl: string | null } | null }`.
  - `ListaDeProcessos = { etapas: EtapaDoCatalogo[]; processos: ProcessoDaLista[] }`.
  - `EtapaDoProcesso = EtapaDoSetor & { responsavelNome: string | null }`.
  - `ProcessoLido = ProcessoDaLista & { origem; contexto: string | null; observacoes: string | null; motivoDaSituacao: string | null; etapasDoSetor: EtapaDoSetor[]; etapasDoProcesso: EtapaDoProcesso[] }`.
  - `DadosDoProcesso = { nome; setorId; macroprocessoId; tipo: 'processo' | 'a_classificar'; origem; contexto: string | null; observacoes: string | null }`.
  - Em `ModuloDeProcessos`: `listarProcessos(): Promise<ListaDeProcessos>`, `lerProcesso(id: string): Promise<ProcessoLido | null>`, `criarProcesso(dados: DadosDoProcesso): Promise<void>`, `editarProcesso(id: string, dados: DadosDoProcesso): Promise<void>` (o tipo não muda na edição: o módulo ignora `dados.tipo`), `excluirProcesso(id: string): Promise<void>`, `lerHistoricoDoProcesso(id: string): Promise<EventoDoCadastro[]>`.

- [ ] **Step 1: contrato.** Acrescentar os tipos e as seis operações a `tipos.ts` (importando `EventoDoCadastro` de `../cadastros/tipos`; sem ciclo). Ajustar o comentário do tipo: "etapa, responsável ou processo que já não existe, como CadastroInexistente".
- [ ] **Step 2: testes que falham**, com `ClienteSupabaseFalso` (um arquivo por módulo novo):
  - `listaDeProcessosSupabase.test.ts`: lê `processos_com_andamento` ordenada por `nome` e `etapas` do nível processo ordenadas por `ordem`; mapeia colunas para os tipos da tela (inclusive `aguardando_o_setor`, `etapa_atual_*` nulos → `etapaAtual: null`, responsável sem id → `null`); falha de leitura vira `Error('Falha ao ler os processos: ...')`.
  - `lerProcessoSupabase.test.ts`: `lerProcesso` junta a linha da view, os andamentos do processo (com `etapas(...)` e `usuarios(nome)` embutidos, ordenados pela `ordem`) e as etapas do setor (reaproveita a leitura de `lerEtapasDoSetor`); id inexistente → `null`; `lerHistoricoDoProcesso` filtra `eventos` por `entidade = 'processo'` e `entidade_ref = id`, ordem do mais recente ao mais antigo, e mapeia como `historicoSupabase`.
  - `gravarProcessoSupabase.test.ts`: `criarProcesso` insere `{ setor_id, macroprocesso_id, nome, tipo, origem, contexto, observacoes }`; `editarProcesso` atualiza só `setor_id, macroprocesso_id, nome, origem, contexto, observacoes` com `.eq('id', id).select('id')`; `excluirProcesso` apaga e confirma; `23505` + `processos_nome_unico` vira `TravaDoBanco("Já existe um processo com o nome {nome} no setor {SIGLA}.")` (sigla lida de `setores`); `42501` vira "Seu perfil não permite alterar os processos."; nenhuma linha afetada: legível = perfil, ilegível = `CadastroInexistente`; `23503` do vínculo (setor ou macroprocesso sumiu) = `CadastroInexistente`.
  `npx vitest run src/processos` → FAIL.
- [ ] **Step 3: implementação** nos três arquivos (funções ≤ 20 linhas; leituras e gravações separadas, mapeamentos em funções nomeadas) e `processosSupabase.ts` espalhando os três módulos no objeto devolvido, como já faz com `criarResponsaveisSupabase`. `npx vitest run src/processos` → PASS; `npx tsc -b` limpo.
- [ ] **Step 4: commit** "Ticket 04 de processos-etapas: módulo de processos real".

---

### Task 4: Falso e funções puras (critérios 5 e 6, base dos testes de tela)

**Files:**
- Modify: `src/processos/ProcessosFalso.ts`
- Create: `src/processos/colunasDoQuadro.ts` (+ teste), `src/processos/validacaoDoProcesso.ts` (+ teste)

**Interfaces:**
- Produces: `colunasDoQuadro(lista: ListaDeProcessos): ColunaDoQuadro[]` com `ColunaDoQuadro = { chave: string; titulo: string; processos: ProcessoDaLista[] }`; `problemaNoProcesso(campos: CamposDoProcesso): string | null`; `dadosDoProcesso(campos: CamposDoProcesso): DadosDoProcesso`; `CamposDoProcesso = { nome; setorId; macroprocessoId; tipo; origem; contexto; observacoes }` (textos do formulário). `ProcessosFalso`: `processos: ProcessoLido[]`, `etapasDoCatalogo: EtapaDoCatalogo[]`, `historicoDosProcessos: Record<string, EventoDoCadastro[]>`, `siglasDosSetores`, `nomesDosMacroprocessos`.

- [ ] **Step 1: testes que falham.**
  - `colunasDoQuadro.test.ts`: primeira coluna "Aguardando o setor" com os que aguardam; uma coluna por etapa ativa na ordem do catálogo; processo na coluna da etapa atual; concluídos e cancelados fora; suspenso dentro (com a situação); ordem pelo nome (pt-BR, sem diferenciar maiúsculas); coluna de etapa inativa só aparece se houver processo nela; coluna vazia aparece.
  - `validacaoDoProcesso.test.ts`: nome em branco → "O nome do processo é obrigatório."; setor vazio → "Escolha o setor do processo."; macroprocesso vazio → "Escolha o macroprocesso do processo."; dados saem sem espaços nas pontas e com vazios como `null`.
  `npx vitest run src/processos` → FAIL.
- [ ] **Step 2: implementação** das duas funções puras e do falso. O falso: `listarProcessos`/`lerProcesso` respeitam `falharLeitura` e `segurarLeitura`; `criarProcesso` recusa nome repetido no setor (sem diferenciar maiúsculas, com a frase do banco e a sigla de `siglasDosSetores`) e inclui um `ProcessoLido` novo (`id` `p1`, `p2`…; seis etapas pendentes de `etapasDoCatalogo`); `editarProcesso` e `excluirProcesso` seguem `falhaDeGravacao`; excluir/editar id inexistente lança `CadastroInexistente`; `lerHistoricoDoProcesso` devolve `historicoDosProcessos[id] ?? []`. Reaproveitar `conferirGravacao` já existente.
- [ ] **Step 3:** `npx vitest run src/processos` → PASS; `npx tsc -b` limpo; commit "Ticket 04 de processos-etapas: falso do módulo, colunas do Quadro e validação do processo".

---

### Task 5: Área Processos e Quadro (critério 6)

**Files:**
- Modify: `src/hooks/useAreaAtual.ts`, `src/App.tsx`, `src/components/quadro/QuadroVazio.tsx`, `src/App.test.tsx` (se o estado vazio mudar de texto de apoio, não de comportamento)
- Create: `src/components/processos/AreaDeProcessos.tsx`, `QuadroDeProcessos.tsx`, `ColunaDoQuadro.tsx`, `CartaoDoProcesso.tsx`, `Quadro.css`, `src/App.quadro.test.tsx`

**Interfaces:**
- Consumes: `listarProcessos`, `colunasDoQuadro` (Tasks 3 e 4).
- Produces: `<AreaDeProcessos usuario processos cadastros />` (aqui só o Quadro e a abertura do painel por endereço; o painel chega na Task 6); `QuadroVazio({ podeCadastrar, aoCadastrar })`; endereço `#/processos` para a área `quadro`.

- [ ] **Step 1: testes que falham** em `src/App.quadro.test.tsx` (app inteiro com `ProcessosFalso`, endereço `#/processos`): 
  - "Carregando processos…" com colunas-fantasma enquanto a leitura não responde; erro com [Tentar de novo] que recarrega; estado vazio ("Nenhum processo cadastrado ainda.") com [Cadastrar processo] para Integrante e sem o botão para a Consulta;
  - colunas "Aguardando o setor" e uma por etapa ativa, na ordem do catálogo, com os cartões no lugar certo e em ordem de nome; cartão com sigla, nome, macroprocesso, pílula "A classificar" só no tipo `a_classificar` e responsável (Avatar com o nome); suspenso com pílula "Suspenso"; concluído e cancelado fora do Quadro;
  - clicar [Cadastrar processo] ou no cartão muda o endereço para `#/processos/novo` / `#/processos/<id>`; o item "Quadro" da faixa lateral leva a `#/processos`.
  Atualizar `App.test.tsx` onde o Quadro vazio era estático. `npx vitest run src/App.quadro.test.tsx` → FAIL.
- [ ] **Step 2: implementação.** `useAreaAtual`: o primeiro trecho `processos` (ou ausente) é a área `quadro`, e `irPara('quadro')` grava `#/processos`. `App.tsx` renderiza `<AreaDeProcessos ... />` no lugar do `QuadroVazio`. `AreaDeProcessos` carrega com `useCarregamento(listarProcessos)`, guarda `recarregar` e entrega `QuadroDeProcessos` (carregando com colunas-fantasma, erro com `ErroAoCarregar alvo="os processos"`, vazio com `QuadroVazio`, colunas com `ColunaDoQuadro` e `CartaoDoProcesso`). `Quadro.css`: ocupa toda a largura à direita da faixa lateral (sem `--largura-conteudo`), colunas de `var(--largura-coluna-quadro)`, rolagem lateral com sombra de rolagem em CSS puro, cartão branco com borda `--linha` que escurece ao passar o mouse e linha acesa (`--linha-acesa`) no cartão do endereço.
- [ ] **Step 3:** `npx vitest run` → PASS; `npx eslint src` e `npx tsc -b` limpos; commit "Ticket 04 de processos-etapas: área Processos e Quadro".

---

### Task 6: Painel do processo, só leitura (critério 7 e 9 parcial)

**Files:**
- Modify: `src/components/processos/AreaDeProcessos.tsx`, `src/components/processos/LinhaDaEtapa.tsx` (linha opcional do responsável), `src/components/cadastros/AreaDeSetores.tsx` (setor aberto pelo endereço), `src/components/cadastros/ItemInexistente.tsx` (texto opcional)
- Create: `PainelDoProcesso.tsx`, `DadosDoProcesso.tsx`, `CaminhoDoProcesso.tsx`, `HistoricoDoProcesso.tsx`, `Painel.css`, `src/App.painelDoProcesso.test.tsx`

**Interfaces:**
- Consumes: `lerProcesso`, `lerHistoricoDoProcesso` (Task 3).
- Produces: `<PainelDoProcesso processos cadastros id podeAlterar aoFechar aoMudar />` (a edição e a exclusão entram na Task 7).

- [ ] **Step 1: testes que falham** em `src/App.painelDoProcesso.test.tsx` (`#/processos/<id>` com o Quadro atrás):
  - "Carregando processo…"; erro com [Tentar de novo]; processo inexistente ("Este processo não existe mais. Ele pode ter sido excluído; veja o Histórico.") com [Voltar] que leva a `#/processos`;
  - cabeçalho (sigla, nome, macroprocesso, pílulas de tipo e de situação, botão fechar que volta a `#/processos`; Esc também fecha e devolve o foco ao cartão);
  - dados (setor, macroprocesso, tipo, origem, contexto, observações); caminho: etapas do setor primeiro, só leitura, com o link "Ver no setor" (`#/setores/<setorId>`), depois as do processo com status, responsável, datas e nota, a atual destacada (`aria-current="step"`), sem nenhum botão de ação;
  - aba Histórico: eventos do processo, mais recentes primeiro, com "Criou"/"Editou"/"Excluiu", autor, antes e depois; "Carregando histórico…", erro e "Nenhuma alteração registrada ainda.";
  - Consulta: nenhum botão de alteração (nem [Editar]/[Excluir], que entram na Task 7).
  - `#/setores/<id>` abre o setor direto (teste em `App.setores`/novo arquivo): voltar à lista limpa o endereço.
  `npx vitest run src/App.painelDoProcesso.test.tsx` → FAIL.
- [ ] **Step 2: implementação.** `AreaDeProcessos` lê o segundo trecho do endereço: `novo` (Task 7) ou um id → monta o painel por cima do Quadro (que continua montado, com `aria-hidden` e esmaecido por CSS). `PainelDoProcesso` carrega com `useCarregamento` e divide em `DadosDoProcesso`, `CaminhoDoProcesso` (reaproveita `LinhaDaEtapa` sem ações, com `responsavelNome`) e `HistoricoDoProcesso` (reaproveita `ListaDoHistorico`; vazio/erro/carregando próprios). `Painel.css`: painel à direita (~480px, abaixo de 900px a tela inteira), `--sombra-flutuante`, véu sobre o Quadro, ✓ nas resolvidas, atual em azul com sublinhado aceso e futuras apagadas. `AreaDeSetores` abre o setor do segundo trecho depois de `#/setores/` e, ao voltar, troca o endereço para `#/setores`.
- [ ] **Step 3:** `npx vitest run` → PASS; `npx eslint src` e `npx tsc -b` limpos; commit "Ticket 04 de processos-etapas: painel do processo".

---

### Task 7: Cadastrar, editar, mover de macroprocesso e excluir (critérios 5, 8 e 9)

**Files:**
- Modify: `PainelDoProcesso.tsx`, `DadosDoProcesso.tsx`, `AreaDeProcessos.tsx`, `Painel.css`
- Create: `FormularioDoProcesso.tsx`, `CamposDoProcesso.tsx`, `AvisoDeSetorIncluido.tsx`, `src/App.cadastrarProcesso.test.tsx`

**Interfaces:**
- Consumes: `criarProcesso`, `editarProcesso`, `excluirProcesso` (Task 3); `problemaNoProcesso`, `dadosDoProcesso` (Task 4); `cadastros.listarSetores`, `listarMacroprocessos`, `lerMacroprocesso`.
- Produces: `<FormularioDoProcesso processos cadastros inicial? aoSalvar aoCancelar />`.

- [ ] **Step 1: testes que falham** em `src/App.cadastrarProcesso.test.tsx`:
  - `#/processos/novo` abre o painel "Cadastrar processo" com nome, setor e macroprocesso (só ativos), tipo ("A classificar" marcado; opções Processo e A classificar), origem ("Novo" marcado; Novo e Retomado), contexto e observações; salvar cadastra, fecha o painel e o cartão aparece na coluna da etapa atual (ou em "Aguardando o setor");
  - conferência na tela com as três frases; nome repetido no setor mostra a recusa em vermelho e mantém os dados ("A alteração não foi salva…" para falha genérica, a frase pronta para `TravaDoBanco`);
  - aviso amarelo "O setor TSA ainda não está no macroprocesso …; ele será incluído ao salvar." quando o setor não é envolvido (e some quando é);
  - [Editar] no painel troca os dados pelo formulário (sem campo de tipo), salva com sucesso e com falha; mover de macroprocesso mostra o aviso e grava; processo que sumiu durante a edição mostra o aviso de inexistente;
  - [Excluir] abre "Excluir o processo {nome}?" com o texto e [Excluir processo] [Cancelar] (foco no Cancelar); confirmar exclui, fecha o painel e o cartão some; falha na exclusão aparece no painel; Consulta não vê [Cadastrar processo], [Editar] nem [Excluir];
  - cada recusa de exclusão dos cadastros aparece na tela de setor/macroprocesso (com `falhaDeGravacao = new TravaDoBanco(...)` no `CadastrosFalso`): as três frases do critério 4.
  `npx vitest run src/App.cadastrarProcesso.test.tsx` → FAIL.
- [ ] **Step 2: implementação.** `FormularioDoProcesso` segue `FormularioDeSetor` (`noValidate`, `textoDaFalhaNoFormulario`, botão desabilitado enquanto envia); `CamposDoProcesso` carrega as opções com `useCarregamento`; `AvisoDeSetorIncluido` usa `cadastros.lerMacroprocesso(macroprocessoId)` quando setor e macroprocesso estão escolhidos (classe de aviso amarelo, `--pendencia-fundo`). `DadosDoProcesso` ganha [Editar] e [Excluir] (só `podeAlterar`); a exclusão usa `JanelaDeConfirmacao` e `useGravacaoComFalha`; `CadastroInexistente` vira o aviso de inexistente. Salvar, excluir e cadastrar chamam `aoMudar` (recarrega o Quadro) e voltam a `#/processos`.
- [ ] **Step 3:** `npx vitest run` → PASS; `npx eslint src` e `npx tsc -b` limpos; commit "Ticket 04 de processos-etapas: cadastrar, editar e excluir processo".

---

### Task 8: Histórico dos cadastros entende o processo (critério 9, história 80)

**Files:**
- Modify: `src/cadastros/historicoDosCadastros.ts`, `src/cadastros/historicoSupabase.ts` e os `*.test.ts`; `src/App.historicoDosCadastros.test.tsx`

- [ ] **Step 1: testes que falham.** `historicoSupabase.test.ts`: `processo` entre as entidades lidas. `historicoDosCadastros.test.ts`: `nomeDoItem` de um evento `processo` é `SIGLA — nome` (sem cair no ramo do vínculo); campos legíveis (`Tipo`, `Origem`, `Situação`, `Contexto`, valores "Processo/Subprocesso/A classificar" e "Novo/Retomado"); a exclusão mostra a lista `Andamentos` com o nome da etapa e o status; o item entra no filtro por nome. `App.historicoDosCadastros.test.tsx`: processo excluído continua no Histórico da área Setores com o que tinha. FAIL.
- [ ] **Step 2: implementação** nas duas funções (ramo explícito em `nomeDoItem`, rótulos, `valorLegivel`, item de andamento em `itemDaLista`) e a entidade na lista de leitura. PASS.
- [ ] **Step 3: commit** "Ticket 04 de processos-etapas: histórico dos cadastros com processo".

---

### Task 9: Fechamento do ticket

- [ ] **Step 1: gates.** `npm test` (todos), `npx eslint .`, `npx tsc -b`, `npx madge --circular src`, `npm run build`. O pgTAP (18 arquivos) já passou na Task 1; reconferir com um novo "Testes de banco" depois do último push de `supabase/`.
- [ ] **Step 2: conferência na tela.** Subir o app (`preview_start`), entrar como usuário de teste do dev se existir, ou conferir só por testes de tela quando o login não permitir; registrar o resultado. Critérios `[visual]` da spec (Quadro, painel, pílulas, janela) ficam para o `/polir` e o `/ship`.
- [ ] **Step 3: registros.** Marcar as caixas do plano; anotar em `.scratch/processos-etapas/desvios.md` (criar se faltar) os desvios; em `.scratch/melhorias-protocolo.md` o que foi observado (itens não testados do `/executar-complexo`); em `.scratch/backlog.md` (uma linha) o que surgir fora do escopo. Commit.
- [ ] **Step 4: integração.** `git switch main`, merge da branch (opção de merge do `finishing-a-development-branch`), `git branch -d processos-etapas`, `git push` da `main`, conferir o "Testes de banco" disparado na `main`. Acrescentar ao fim do ticket 04 a linha `Concluído em AAAA-MM-DD (commit <hash>)`, comitar e pedir o `/cost`.
