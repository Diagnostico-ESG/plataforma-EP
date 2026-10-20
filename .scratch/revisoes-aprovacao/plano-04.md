# Ticket 04 de revisoes-aprovacao (Editar revisões e aprovação) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o Administrador e o Integrante corrigem, na gaveta da etapa, o comentário e o escopo de uma revisão interna e o número, o link e a data de uma aprovação (inclusive acrescentando o número que chegou depois da conclusão); o banco confere tudo de novo na edição e grava o antes e o depois no histórico do processo.

**Architecture:** uma migração não destrutiva dá `update` por coluna e uma política de alterar às duas tabelas, gatilhos de preparar a edição (perfil, processo em andamento, escopo, link, data) e de evento "editar" com antes e depois. O módulo de revisões ganha `editarRevisao` e `editarAprovacao` (real e falso). A gaveta ganha o [Editar] em cada registro e uma janela de edição no padrão da `JanelaComCampo`, com os campos que já existem na janela de concluir extraídos para serem compartilhados.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/revisoes-aprovacao/spec.md` (histórias 21 a 23, 29 a 31; "Modelo de dados › Privilégios padrão", "Quem pode o quê", "Regras que o banco impõe") · **Ticket:** `.scratch/revisoes-aprovacao/issues/04-editar-os-registros.md` (critérios citados como "critério N", na ordem do ticket) · ADR 0015 · `plano-02.md`, `plano-03.md` e `desvios.md` (os tickets 02 e 03 deixaram a edição para este).

## Global Constraints

- `CLAUDE.md`: funções de lógica de 4 a 20 linhas, arquivos até 300, complexidade até 10, sem `any`, comentários explicam o porquê, lógica repetida em 2 lugares vira compartilhada, mensagem de erro com o valor e o formato. **Nunca `--no-verify`.** Dados de teste só inventados.
- `.claude/regras/banco.md` (lido): teste de banco antes da migração; migração por `npx supabase migration new`; função sem `security definer`, exceto as que gravam o evento (`security definer`, `search_path` vazio, `revoke` de todos); privilégio por coluna; a RLS decide, botão escondido não protege.
- Rede do escritório: porta 5432 fechada. pgTAP e migração rodam **no GitHub Actions** (seção "Ajustes deste Projeto" do `CLAUDE.md`): `git push` da branch (sem `--force`), disparar "Testes de banco" e "Migrar banco de desenvolvimento" na branch e ler o resultado dispensam autorização. Não há `gh`: os workflows se disparam pelo navegador do app (`mcp__Claude_Browser__*`), onde o usuário já entrou no GitHub; o nome da migração vai sem a pasta.
- Vínculo atual `yclkzyoebpsxmgpbcbus` (desenvolvimento): conferir `supabase/.temp/project-ref` antes de qualquer comando de banco. Produção nunca.
- Cada commit leva cerca de 1 minuto (o pré-commit roda a bateria). Começar cada chamada do Bash com `cd` para a raiz e preferir caminhos absolutos (o `cd` persiste). Heredoc longo falha aqui e não há `python`: escrever arquivos com a ferramenta Write.
- Textos da tela em português, as frases já existentes não mudam (`frasesDeRevisao.ts`, `frasesDeAprovacao.ts`).

## Decisões de execução (tomadas aqui, sem mudar a spec; registrar no `desvios.md`)

- **"Concluído" não congela a edição.** O critério 2 do ticket e a história 25 listam "concluído" entre os estados sem botão, mas o critério 3 pede acrescentar o número a uma aprovação **concluída**, e a Aprovação é a última etapa obrigatória (a Publicação é v1.5): concluir a Aprovação é o que torna o processo "concluído" (derivado, nunca guardado). O banco só conhece a situação guardada (`em_andamento`, `suspenso`, `cancelado`; `private.conferir_processo_em_andamento`), então "concluído" nunca é recusado nele. A tela segue o `podeEditar` que a gaveta já tem (Administrador ou Integrante, processo que não está suspenso nem cancelado, comentário de `DadosDasEtapas`): [Editar] aparece com o processo em andamento ou concluído e some com a Consulta, com o processo suspenso e com o cancelado. Divergência da letra do critério 2, a relatar no fecho.
- **As células "alterar" da tabela de perfis** (adiadas no ticket 03): `revisoes_internas` e `aprovacoes` ganham `update` só nas colunas editáveis (revisão: `escopo`, `comentario`; aprovação: `numero_eprotocolo`, `link`, `aprovada_em`). Mudar versão, resultado, revisor, datas preenchidas ou quem registrou é recusado por falta de privilégio (42501). Os dois testes antigos que provavam "alterar é recusado" (39, linha 277, e 40, linha 303) saem e o `plan(...)` de cada um diminui em 1; a cobertura passa para o teste 41.
- **Recusas já mapeadas, nenhuma nova:** `escopo_obrigatorio`, `escopo_so_na_corrigida`, `link_invalido`, `data_no_futuro:<data>`, `aprovacao_antes_da_revisao:<data>:<data>`, `processo_parado:<situação>` e o 42501 já viram frase em `andamentosSupabase.ts`. Sem mudança em `PADRAO_DA_RECUSA`.
- **Eventos de edição:** ação `editar`, entidades `revisao_interna` e `aprovacao`, referência = id do processo. O `depois` é o estado atual (`private.estado_da_revisao` / `estado_da_aprovacao`) e o `antes` é o mesmo estado com os campos editáveis trocados pelos valores de `old` (só eles mudam). O gatilho tem `when (old… is distinct from new…)`: salvar sem mudar nada não gera evento.
- **Sem `db:types`:** nenhuma tabela, coluna ou função nova (só privilégio, política e gatilhos), então `src/types/database.ts` não muda.
- **Registro que sumiu** (a aprovação desfeita por uma volta de outra pessoa, por exemplo): 0 linhas e o registro já não é legível → `CadastroInexistente`. Na gaveta isso **não** é "o processo sumiu" (o `aoSumir` do verso esconderia o processo inteiro): a janela de edição mostra `FRASE_DO_REGISTRO_QUE_SUMIU` em vermelho, sem perder o preenchido.
- **Campos compartilhados (segunda repetição real):** o escopo e o comentário do `BlocoDaRevisao` viram `CamposDaRevisao.tsx` (`CampoDoEscopo`, `CampoDoComentario`), e o número, o link e a data do `BlocoDaAprovacao` viram `CamposDoEProtocolo.tsx`; a janela de concluir e a de editar usam os mesmos, para os rótulos e limites não divergirem. A casca da janela de edição (`dialog`, título, falha, Salvar/Cancelar) é uma só, `JanelaDeEdicao.tsx`.
- **Validação do link e das datas na falsa:** o trecho de `conferirAprovacao` que confere link e data sai para `conferirLinkEData` (exportado), usado pela conclusão e pela edição.
- **Pré-visual:** sem `.claude/launch.json` não há vitrine local (a pasta `.claude/` não se edita); os critérios `[visual]` da spec seguem presumidos, como nos tickets anteriores, e entram na ressalva do `/ship`.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/41_editar_registros.test.sql` (novo) · `39_…` e `40_…` (tirar 1 asserção cada) | pgTAP: perfis, regras e eventos da edição |
| `supabase/migrations/<data>_editar_registros.sql` (novo) · `supabase/AMBIENTES.md` | privilégios, políticas, gatilhos e eventos · registro |
| `src/revisoes/tipos.ts` · `frasesDeRevisao.ts` | `DadosDaEdicaoDaRevisao`, `editarRevisao`, `editarAprovacao`; `FRASE_DO_REGISTRO_QUE_SUMIU` |
| `src/revisoes/revisoesSupabase.ts` (+ teste) | edições no módulo real |
| `src/revisoes/RevisoesFalso.ts` (+ teste) · `eventoDaRevisao.ts` (novo) · `eventoDaAprovacao.ts` · `conferirAprovacao.ts` | edições na falsa, com eventos |
| `src/processos/gravarAcoes.ts` | `gravarEdicaoDaRevisao`, `gravarEdicaoDaAprovacao` |
| `src/components/processos/CamposDaRevisao.tsx` · `CamposDoEProtocolo.tsx` (novos) · `BlocoDaRevisao.tsx` · `BlocoDaAprovacao.tsx` | campos compartilhados |
| `src/components/processos/JanelaDeEdicao.tsx` · `JanelaDaRevisao.tsx` · `JanelaDaAprovacao.tsx` (novos) | janelas de edição |
| `src/components/processos/RevisoesDaEtapa.tsx` · `AprovacaoDaEtapa.tsx` · `DetalheDaEtapa.tsx` · `CaminhoDoProcesso.tsx` · `Etapas.css` | [Editar] na gaveta |
| `src/cadastros/historicoDosCadastros.ts` | textos "Editou a revisão interna" e "Editou a aprovação" |
| `src/App.editarRegistros.test.tsx` (novo) · `App.revisaoInterna.test.tsx` · `App.aprovacaoNaGaveta.test.tsx` | tela inteira; testes antigos da gaveta que leem o texto do registro |

---

### Task 0: Branch e marco

- [x] **Step 1:** `git status --short` limpo (feito no início). `git switch -c revisoes-aprovacao-04` a partir da `main`.
- [x] **Step 2:** `git tag marco/2026-10-19-inicio-ticket-04-revisoes-aprovacao` e `git push origin "refs/tags/marco/*:refs/tags/marco/*"`.

---

### Task 1: Banco: editar revisões e aprovação (critério 1)

**Files:**
- Create: `supabase/tests/41_editar_registros.test.sql`, `supabase/migrations/<data>_editar_registros.sql`
- Modify: `supabase/tests/39_revisao_interna.test.sql`, `supabase/tests/40_aprovacao.test.sql`, `supabase/AMBIENTES.md`

**Interfaces:**
- Produces (SQL): `grant update (escopo, comentario)` em `revisoes_internas` e `update (numero_eprotocolo, link, aprovada_em)` em `aprovacoes`; políticas de `update`; gatilhos `preparar_edicao_da_revisao`, `registrar_evento_da_revisao_editada`, `preparar_edicao_da_aprovacao`, `registrar_evento_da_aprovacao_editada`; eventos `editar` com `detalhes.antes` e `detalhes.depois`.

- [ ] **Step 1: Teste que falha** (`41_editar_registros.test.sql`, mesmo cabeçalho e auxiliares do `40_aprovacao.test.sql`: usuários a1 administrador, a2 integrante, a3 consulta, a4 inativo; `_tap`; `pg_temp.claims`, `enviar`, `enviar_completa`, `ate_a_aprovacao_revisando`, `aprovar`; `plan(N)` com N = número de asserções abaixo). Setor e macroprocesso próprios (`T41`). Processos inventados: `Corrigida` (V1 enviada por a1; a2 envia a V2 completa, conclui a Revisão interna como `corrigida` com escopo `fluxograma` e comentário `Ajustei o fluxo`, conclui a Revisão pelo setor e aprova com número `PROT-1`, link `https://eprotocolo.example/a`, data de hoje), `Sem Alteracao` (V1 de a1 completa, a2 conclui "sem alteração" e segue até a Aprovação sem aprovar), `Sem Numero` (aprovado sem número, link nem data), `Parado` (como `Corrigida`, depois `suspender_processo`), `Cancelado` (idem, `cancelar_processo`). Casos (cada um uma asserção em `_tap`):
  - **Revisão, aceitos (a2):** editar comentário e escopo da `Corrigida` (valores novos conferidos); comentário com espaços nas pontas é aparado e vazio vira nulo; administrador (a1) também edita; a edição vale com a Revisão interna já concluída.
  - **Revisão, recusados:** escopo nulo na "corrigida" (`escopo_obrigatorio`); escopo na "sem alteração" (`escopo_so_na_corrigida`); alterar `resultado`, `versao_revisada_id`, `revisor_id`, `revisada_em` (42501 em cada uma); processo suspenso (`processo_parado:suspenso`) e cancelado (`processo_parado:cancelado`).
  - **Aprovação, aceitos (a2):** editar número, link e data (valores aparados conferidos); acrescentar o número à `Sem Numero`; limpar o link e a data (voltam a nulo); administrador também edita.
  - **Aprovação, recusados:** link `ftp://x.example/a` e `x.example/a` (`link_invalido`); data de amanhã (`data_no_futuro:<data>`); data de ontem, antes da revisão de hoje (`aprovacao_antes_da_revisao:<ontem>:<hoje>`); alterar `versao_id`, `processo_id`, `registrada_por` (42501 em cada uma); processo suspenso e cancelado.
  - **Perfis (ambas as tabelas):** consulta (a3) e inativo (a4) não alteram nenhuma linha (`with u as (update … returning 1) select count(*)::int from u` = 0, porque a RLS filtra antes do gatilho); visitante (`set local role anon`) recebe 42501.
  - **Eventos:** a edição da revisão gera um evento `editar` ligado ao processo, com `antes.escopo = 'fluxograma'`, `depois.escopo = 'relatorio'` e o comentário antes e depois; o mesmo para a aprovação (número antes nulo, depois `PROT-9`); salvar sem mudar nada não gera evento (contagem igual); a consulta (a3) lê os eventos `editar`; inativo e visitante não.
  - **Estrutura (como `reset role` no fim do 40):** os quatro gatilhos novos existem; as duas funções de evento são `security definer` e as de preparar não.
  Rodar o teste não é possível aqui (rede): ele falha no GitHub no Step 4.
- [ ] **Step 2: Tirar a asserção antiga** de `39_revisao_interna.test.sql` (a de `update public.revisoes_internas set comentario = 'x'`, "integrante não altera revisão (a edição é do ticket 04)") e de `40_aprovacao.test.sql` (a de `update public.aprovacoes set link = …`, "…a edição é do ticket 04"); `plan(56)` do 39 vira `plan(55)` e o do 40, `plan(67)`. Atualizar também o cabeçalho do 40 (a frase "A edição da aprovação é do ticket 04").
- [ ] **Step 3: Migração.** `npx supabase migration new editar_registros` e escrever (cada função ≤ 20 linhas; comentários dizem o porquê):

```sql
-- Revisões: só o escopo e o comentário se alteram; o resto continua sem privilégio (42501).
grant update (escopo, comentario) on public.revisoes_internas to authenticated;
create policy "revisoes_internas: administrador e integrante ativos alteram" on public.revisoes_internas
  for update to authenticated
  using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));

-- Antes de alterar: perfil, processo em andamento, comentário aparado (vazio vira nulo) e escopo coerente com o resultado.
create function private.preparar_edicao_da_revisao() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not private.pode_alterar_cadastros() then
    raise exception 'sem permissão para editar a revisão' using errcode = '42501';
  end if;
  perform private.conferir_processo_em_andamento(new.processo_id);
  new.comentario := nullif(btrim(new.comentario), '');
  if new.resultado = 'corrigida' and new.escopo is null then
    raise exception 'escopo_obrigatorio';
  end if;
  if new.resultado = 'sem_alteracao' and new.escopo is not null then
    raise exception 'escopo_so_na_corrigida';
  end if;
  return new;
end $$;
create trigger preparar_edicao_da_revisao before update on public.revisoes_internas
  for each row execute function private.preparar_edicao_da_revisao();

-- O evento guarda o estado de agora (depois) e o mesmo estado com os campos editáveis de antes: só eles mudam.
create function private.registrar_evento_da_revisao_editada() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.eventos (autor_id, acao, entidade, entidade_ref, detalhes)
  values ((select auth.uid()), 'editar', 'revisao_interna', new.processo_id::text, jsonb_build_object(
    'antes', private.estado_da_revisao(new.id) || jsonb_build_object('escopo', old.escopo, 'comentario', old.comentario),
    'depois', private.estado_da_revisao(new.id)));
  return null;
end $$;
-- "when": salvar sem mudar nada não vira evento.
create trigger registrar_evento_da_revisao_editada after update on public.revisoes_internas
  for each row when (old.escopo is distinct from new.escopo or old.comentario is distinct from new.comentario)
  execute function private.registrar_evento_da_revisao_editada();
```

  e o par da aprovação: `grant update (numero_eprotocolo, link, aprovada_em)`; política `aprovacoes: administrador e integrante ativos alteram`; `private.preparar_edicao_da_aprovacao()` (perfil, `conferir_processo_em_andamento(new.processo_id)`, número e link aparados com `nullif(btrim(…), '')`, `conferir_link_da_aprovacao(new.link)`, `conferir_data_da_aprovacao(new.processo_id, new.aprovada_em)`; a data é conferida sempre, não só quando muda); `private.registrar_evento_da_aprovacao_editada()` com `antes = estado_da_aprovacao(new.id) || jsonb_build_object('numero_eprotocolo', old.numero_eprotocolo, 'link', old.link, 'aprovada_em', old.aprovada_em)`; gatilho `after update … when (old.numero_eprotocolo is distinct from new.numero_eprotocolo or old.link is distinct from new.link or old.aprovada_em is distinct from new.aprovada_em)`. Fechar com `revoke execute … from public, anon; grant execute … to authenticated` nas duas funções de preparar e `revoke … from public, anon, authenticated` nas duas de evento, como nas migrações dos tickets 02 e 03. Cabeçalho do arquivo: ticket, ADR 0015, "não destrutiva".
- [ ] **Step 4: Aplicar e testar.** Comitar "Ticket 04 de revisoes-aprovacao: plano e teste de banco da edição" (teste 41 e os dois ajustes) e "…: migração da edição"; `git push -u origin revisoes-aprovacao-04`. Disparar "Testes de banco" **antes** da migração (esperado: o 41 falha; os outros passam) e depois "Migrar banco de desenvolvimento" com o nome do arquivo (sem a pasta) e "Testes de banco" de novo (esperado: tudo verde, incluindo `00_rls_ligada`, `01_buckets_privados`, `10_privilegios_padrao`). Conferir a linha do arquivo 41 no passo `npm run test:db` (log recolhido: expandir pelo navegador).
- [ ] **Step 5: Registro.** Linha da migração em `supabase/AMBIENTES.md` (ticket 04; não destrutiva: dá `update` por coluna e política de alterar às revisões e à aprovação, com gatilhos de preparar a edição e de evento; teste 41 falhou antes, migração aplicada pelo workflow, testes verdes pelo "Testes de banco" na branch). Comitar "Ticket 04 de revisoes-aprovacao: registro da migração".

---

### Task 2: Módulo de revisões: editar, real e falso (critérios 3, 4 e 6, parte)

**Files:**
- Modify: `src/revisoes/tipos.ts`, `src/revisoes/frasesDeRevisao.ts`, `src/revisoes/revisoesSupabase.ts` (+ `revisoesSupabase.test.ts`), `src/revisoes/RevisoesFalso.ts` (+ `RevisoesFalso.test.ts` e `RevisoesFalso.aprovacao.test.ts`), `src/revisoes/conferirAprovacao.ts`, `src/revisoes/eventoDaAprovacao.ts`
- Create: `src/revisoes/eventoDaRevisao.ts`

**Interfaces:**
- Produces (`tipos.ts`): `DadosDaEdicaoDaRevisao = { escopo: EscopoDaCorrecao | null; comentario: string | null }`; `ModuloDeRevisoes.editarRevisao(revisaoId: string, dados: DadosDaEdicaoDaRevisao): Promise<void>` e `ModuloDeRevisoes.editarAprovacao(aprovacaoId: string, dados: DadosDaAprovacao): Promise<void>`.
- Produces (`frasesDeRevisao.ts`): `FRASE_DO_REGISTRO_QUE_SUMIU = 'Este registro não existe mais. Feche a janela e confira a gaveta da etapa.'`.
- Produces (`conferirAprovacao.ts`): `conferirLinkEData(dados: DadosDaAprovacao, ultimaRevisao: string | null, hoje: string): void` (as duas recusas que `conferirAprovacao` já tem para link e data; `conferirAprovacao` passa a chamá-la).
- Produces (`eventoDaAprovacao.ts`): `eventoDaAprovacao(processo, acao: 'registrar' | 'desfazer' | 'editar', aprovacao, anterior?: Aprovacao)`; em `editar`, `antes` é o estado de `anterior` e `depois` o de `aprovacao`. Produces (`eventoDaRevisao.ts`): `eventoDaRevisaoEditada(processo, antes: RevisaoInterna, depois: RevisaoInterna): EventoDoCadastro` (entidade `revisao_interna`, ação `editar`, estado com `versao_revisada`, `versao_corrigida`, `resultado`, `escopo`, `comentario`, `revisor_nome`, `revisada_em`, `processo_nome`, `setor_sigla`, no mesmo formato do banco).

- [ ] **Step 1: Testes que falham** em `revisoesSupabase.test.ts`: `editarRevisao('r1', { escopo: 'relatorio', comentario: null })` faz `update` em `revisoes_internas` com `{ escopo: 'relatorio', comentario: null }`, filtro `id = r1`, `select('id')`; `editarAprovacao('ap1', { numeroEprotocolo: 'PROT-9', link: null, aprovadaEm: '2026-10-13' })` faz `update` em `aprovacoes` com `{ numero_eprotocolo, link, aprovada_em }`; cada recusa do banco (`escopo_obrigatorio`, `link_invalido`, `aprovacao_antes_da_revisao:2026-10-12:2026-10-13`, `processo_parado:suspenso`, 42501) vira `TravaDoBanco` com a frase; zero linhas e o registro ainda legível (`respostas['aprovacoes.select']` com a linha) vira `TravaDoBanco` "Seu perfil não permite alterar os processos."; zero linhas e registro ilegível vira `CadastroInexistente`. Em `RevisoesFalso.test.ts` e `RevisoesFalso.aprovacao.test.ts`: editar atualiza o registro na lista (`listarRevisoes`, `lerAprovacao`); recusa escopo nulo na "corrigida", escopo na "sem alteração", link `ftp://`, data futura (acima de `HOJE`) e data antes da última revisão, com as mesmas frases do banco; registro inexistente lança `CadastroInexistente`; `falhaNaGravacao` e `segurarGravacao` valem para a edição; cada edição que muda algo põe o evento "editar" no histórico do processo (antes e depois) e a que não muda nada, não; processo suspenso ou cancelado recusa com `fraseDoProcessoParado`. `npx vitest run src/revisoes` → FALHA.
- [ ] **Step 2: Implementar o módulo real.** `editarRevisao` e `editarAprovacao` no padrão de `mudarAndamento`: `update(...).eq('id', id).select('id')`; `error` → `throw falhaDoAndamento(error, recusas)`; `!data.length` → `throw porQueNadaMudou(<leitura do id na mesma tabela>, recusas)` (uma pequena função de existência por tabela; se o tipo do `from()` reclamar da união de tabelas, duas funções). Cada função de 4 a 20 linhas, e o arquivo segue abaixo de 300.
- [ ] **Step 3: Implementar a falsa.** Extrair `conferirLinkEData` em `conferirAprovacao.ts`; `editarRevisao` e `editarAprovacao` na `RevisoesFalso` repetem as checagens do banco na ordem dele (falha programada e espera como em `concluirRevisaoInterna`, registro achado em `revisoes` / `aprovacoes` ou `CadastroInexistente`, processo parado, escopo, link e data), substituem o registro (inclusive `aprovacoes` no `VersoesFalso`? não: a marca de aprovada depende só da versão, que não muda) e registram o evento pelos módulos `eventoDaRevisao.ts` e `eventoDaAprovacao.ts`. Manter `RevisoesFalso.ts` abaixo de 300 linhas (mover para um arquivo irmão se passar).
- [ ] **Step 4: Rodar.** `npx vitest run src/revisoes` → PASSA; `npm run typecheck` e `npm run lint`.
- [ ] **Step 5: Comitar** "Ticket 04 de revisoes-aprovacao: módulo de edição das revisões e da aprovação (real e falso); testes e tipos".

---

### Task 3: Campos compartilhados e janelas de edição (critérios 4 e 6, parte)

**Files:**
- Create: `src/components/processos/CamposDaRevisao.tsx`, `CamposDoEProtocolo.tsx`, `JanelaDeEdicao.tsx`, `JanelaDaRevisao.tsx`, `JanelaDaAprovacao.tsx`
- Modify: `src/components/processos/BlocoDaRevisao.tsx`, `BlocoDaAprovacao.tsx`, `src/processos/gravarAcoes.ts`

**Interfaces:**
- Produces (`gravarAcoes.ts`): `gravarEdicaoDaRevisao(revisoes: ModuloDeRevisoes, id: string, dados: DadosDaEdicaoDaRevisao): Promise<string | null>` e `gravarEdicaoDaAprovacao(revisoes, id: string, dados: DadosDaAprovacao): Promise<string | null>`: devolvem a frase da falha ou `null` quando gravou; `CadastroInexistente` vira `FRASE_DO_REGISTRO_QUE_SUMIU` (não chama `aoSumir`).
- Produces (`CamposDaRevisao.tsx`): `CampoDoEscopo({ valor: EscopoDaCorrecao | null, aoMudar })` (os três botões de escolha de hoje, com o mesmo grupo `Escopo da correção`) e `CampoDoComentario({ valor: string, aoMudar })` (rótulo `Comentário (opcional)`, 2.000 caracteres e a frase "Não anote dado pessoal de pessoas do setor."). Produces (`CamposDoEProtocolo.tsx`): `CamposDoEProtocolo({ valor: RascunhoDaAprovacao, aoMudar })` (Número do E-protocolo, Link, Data da aprovação, todos "(opcional)", com os mesmos limites e `max` da data de hoje).
- Produces (`JanelaDeEdicao.tsx`): `JanelaDeEdicao({ titulo, salvando, falha, aoSalvar, aoFechar, children })`: `dialog` nativo aberto ao montar, foco no primeiro campo, `Esc` fecha, botões "Salvar" (vira "Salvando…" e fica desabilitado enquanto grava) e "Cancelar", falha em `p.cadastros-falha role="alert"`. Produces: `JanelaDaRevisao({ revisao: RevisaoInterna, revisoes, aoGravar, aoFechar })` com título `Editar a revisão da V<n>` e `JanelaDaAprovacao({ aprovacao: Aprovacao, revisoes, aoGravar, aoFechar })` com título `Editar a aprovação da V<n>`; `aoGravar` é chamado quando gravou, antes de fechar.

- [ ] **Step 1: Testes que falham** (unitários de tela, no estilo de `JanelaComCampo.test.tsx`): a janela de edição da revisão abre com escopo e comentário preenchidos (sem escopo quando é "sem alteração"), grava só o que mudou do rascunho aparado pelo `editarRevisao` do módulo falso e fecha; a da aprovação abre com os três campos preenchidos, grava e fecha; uma recusa (`falhaNaGravacao = new TravaDoBanco('…')`) aparece em vermelho e mantém o preenchido e a janela aberta; "Salvando…" com a gravação segurada; `Esc` e Cancelar fecham sem gravar; registro que sumiu mostra `FRASE_DO_REGISTRO_QUE_SUMIU`. Comportamento da janela de concluir não muda: os testes de `BlocoDaRevisao`/`BlocoDaAprovacao` e as suítes `App.revisaoInterna`, `App.aprovacao` continuam passando sem alteração (prova da extração). `npx vitest run src/components/processos` → FALHA.
- [ ] **Step 2: Extrair** o escopo e o comentário do `BlocoDaRevisao` para `CamposDaRevisao.tsx`, e o número, o link e a data do `BlocoDaAprovacao` para `CamposDoEProtocolo.tsx`, e usá-los nos dois blocos (sem mudar rótulos, ids nem a ordem). `npx vitest run src/App.revisaoInterna.test.tsx src/App.aprovacao.test.tsx` → PASSA (extração sem efeito).
- [ ] **Step 3: Implementar** `gravarEdicaoDaRevisao`/`gravarEdicaoDaAprovacao` em `gravarAcoes.ts`, `JanelaDeEdicao.tsx` (usa `useGravacaoNaJanela` para `salvando` e `falha`; o `dialog` segue `JanelaComCampo`: `showModal` no efeito, `onClose` fecha, e a quem monta cabe desmontá-la ao fechar), `JanelaDaRevisao.tsx` e `JanelaDaAprovacao.tsx` (rascunho local inicial vindo do registro: `escopo`, `comentario ?? ''` / `numeroEprotocolo ?? ''`, `link ?? ''`, `aprovadaEm ?? ''`; ao salvar, `dadosDaAprovacao(rascunho)` já existente, e o novo equivalente para a revisão: escopo só na "corrigida", comentário aparado e vazio vira `null`, em `src/revisoes/rascunhoDaRevisao.ts` com teste).
- [ ] **Step 4: Rodar.** `npx vitest run src/components/processos src/revisoes src/processos` → PASSA; `npm run typecheck`, `npm run lint`.
- [ ] **Step 5: Comitar** "Ticket 04 de revisoes-aprovacao: campos compartilhados e janelas de edição".

---

### Task 4: [Editar] na gaveta e histórico (critérios 2, 3, 4 e 5)

**Files:**
- Modify: `src/components/processos/RevisoesDaEtapa.tsx`, `AprovacaoDaEtapa.tsx`, `DetalheDaEtapa.tsx`, `CaminhoDoProcesso.tsx`, `Etapas.css`, `src/cadastros/historicoDosCadastros.ts`, `src/App.revisaoInterna.test.tsx`, `src/App.aprovacaoNaGaveta.test.tsx`
- Create: `src/App.editarRegistros.test.tsx`

**Interfaces:**
- Consumes: `JanelaDaRevisao`, `JanelaDaAprovacao` (Task 3), `ModuloDeRevisoes.editarRevisao/editarAprovacao` (Task 2).
- Produces: `RevisoesDaEtapa({ revisoes, processoId, podeEditar })` e `AprovacaoDaEtapa({ estado, aoTentarDeNovo, revisoes, podeEditar, aoAtualizar })`; em cada registro, abaixo do texto, o botão `Editar a revisão da V<n>` / `Editar a aprovação da V<n>` (texto visível "Editar", `botao botao-secundario`); `DadosDasEtapas` ganha `aoAtualizarAAprovacao: () => void` (o `recarregar` do `useCarregamento` da aprovação em `CaminhoDoProcesso`). `podeEditar` é o que `DetalheDaEtapa` já recebe.

- [ ] **Step 1: Testes que falham** (`App.editarRegistros.test.tsx`, tela inteira com o `montar` e as fixtures de `src/testes/aprovacaoNoVerso.tsx`; a revisão semeada em `revisoes.revisoes.p1` e a aprovação em `revisoes.aprovacoes.p1`; ≤ 300 linhas, senão dividir em dois arquivos):
  - **Revisão:** [Editar] na gaveta da Revisão interna abre a janela com escopo e comentário; trocar o escopo e o comentário e Salvar atualiza o registro na gaveta (e fecha); numa revisão "sem alteração" não há escopo; Cancelar e `Esc` não gravam; recusa e falha ao gravar aparecem em vermelho sem perder o preenchido (`falhaNaGravacao`); "Salvando…" com a gravação segurada.
  - **Aprovação:** [Editar] na gaveta da Aprovação; acrescentar o número a uma aprovação "Sem número do E-protocolo" mostra o número na gaveta (critério 3); editar o link vira o endereço novo do número (aba nova); recusas de link e de data aparecem em vermelho com a frase certa e o preenchido fica.
  - **Quem vê o botão:** Administrador e Integrante com o processo em andamento e concluído; sem o botão para a Consulta, para o processo suspenso e para o cancelado (e sem aprovação, não há botão).
  - **Histórico:** depois de editar, o Histórico do processo mostra "Editou a revisão interna" / "Editou a aprovação" com o antes e o depois dos campos que mudaram.
  - **Registro que sumiu** (aprovação desfeita pela falsa antes de salvar): a janela diz `FRASE_DO_REGISTRO_QUE_SUMIU` e o verso do processo continua aberto.
  `npx vitest run src/App.editarRegistros.test.tsx` → FALHA. Ajustar, no mesmo passo, as expectativas dos testes antigos da gaveta que leem o texto inteiro do registro (`textContent` do item da lista em `App.revisaoInterna.test.tsx`, que passa a trazer "Editar" para quem pode editar).
- [ ] **Step 2: Implementar.** `RevisoesDaEtapa` guarda `editando: string | null` (id da revisão) e, ao gravar, chama o `recarregar` do próprio `useCarregamento`; `AprovacaoDaEtapa` guarda `editando: boolean` e chama `aoAtualizar` (o `recarregar` do `CaminhoDoProcesso`, que não pisca em "Carregando…"); os dois só mostram o botão com `podeEditar`. `DetalheDaEtapa` passa `podeEditar`, `revisoes` e `aoAtualizarAAprovacao`; `CaminhoDoProcesso` passa o `recarregar`. CSS mínimo em `Etapas.css` (o botão alinhado à esquerda, abaixo do registro, no tom do restante da gaveta). `historicoDosCadastros.ts`: `TEXTO_DA_ACAO_DA_REVISAO` ganha `editar: 'Editou a revisão interna'` e `TEXTO_DA_ACAO_DA_APROVACAO`, `editar: 'Editou a aprovação'`; conferir que o diff antes/depois dos campos já mostra os rótulos novos (`ROTULO_DO_CAMPO` já tem todos).
- [ ] **Step 3: Rodar.** `npx vitest run src/App.editarRegistros.test.tsx src/App.revisaoInterna.test.tsx src/App.aprovacaoNaGaveta.test.tsx src/App.aprovacao.test.tsx src/App.historico.test.tsx` → PASSA; depois `npm test` inteiro, `npm run typecheck`, `npm run lint`, `npm run check:circular`.
- [ ] **Step 4: Comitar** "Ticket 04 de revisoes-aprovacao: [Editar] na gaveta, edição no histórico e testes da tela inteira".

---

### Task 5: Fecho do ticket

- [ ] **Step 1: Cobertura** (`npm run test:coverage` ≥ 70%) e `npm test` verde; "Testes de banco" verde na branch (já no Task 1).
- [ ] **Step 2: `desvios.md`** (entrada datada, sem editar as antigas): (1) o "concluído" do critério 2 lido como "suspenso ou cancelado" (motivo: critério 3; o banco só conhece a situação guardada); (2) os dois testes antigos (39 e 40) cujas asserções de "alterar recusado" saíram; (3) o registro que sumiu não esconde o processo; (4) sem `db:types`; (5) pré-visual presumido (sem vitrine local), com os critérios `[visual]` da spec.
- [ ] **Step 3: Critérios.** Marcar as caixas de `issues/04-editar-os-registros.md` que ficaram provadas; o que for só presumido (visual) fica explicado na linha. Marcar as caixas deste plano.
- [ ] **Step 4: Melhorias do protocolo e itens não testados.** Ler `.claude/regras/nao-testados.md` (blocos do `/executar-complexo` e "Qualquer momento") e acrescentar a `.scratch/melhorias-protocolo.md` uma seção "2026-10-19 — /executar-complexo (revisoes-aprovacao, ticket 04)" com os itens que aconteceram e as ocorrências (sem concluir se funcionou).
- [ ] **Step 5: Comitar** "Ticket 04 de revisoes-aprovacao: desvios, critérios, plano e melhorias do protocolo". Em seguida, o passo 4 do comando: `git switch main`, merge da branch (`finishing-a-development-branch`, opção de merge local), `git branch -d revisoes-aprovacao-04`, a linha `Concluído em AAAA-MM-DD (commit <hash>)` no fim do ticket, commit, `git push origin main` (autorizado) e conferência do "Testes de banco" na `main`.

---

## Auto-revisão

- **Cobertura da spec/ticket:** critério 1 (banco: aceitos e recusados das duas tabelas, link e data na edição, processo parado, consulta/inativo/visitante, evento com antes e depois) → Task 1; critério 2 ([Editar] para Administrador e Integrante, sumindo com Consulta, suspenso e cancelado; "concluído" lido como em Decisões) → Task 4; critério 3 (acrescentar o número) → Tasks 1, 2 e 4; critério 4 (recusas e falhas em vermelho sem perder o preenchido) → Tasks 3 e 4; critério 5 (histórico com antes e depois) → Tasks 1 e 4; critério 6 (módulo real e tela inteira com a falsa) → Tasks 2 e 4. Histórias 21, 22, 23, 29 (eventos de edição), 31 → idem.
- **Tipos e nomes:** `DadosDaEdicaoDaRevisao`, `editarRevisao`, `editarAprovacao`, `FRASE_DO_REGISTRO_QUE_SUMIU`, `conferirLinkEData`, `eventoDaRevisaoEditada`, `CamposDaRevisao` (`CampoDoEscopo`, `CampoDoComentario`), `CamposDoEProtocolo`, `JanelaDeEdicao`, `JanelaDaRevisao`, `JanelaDaAprovacao`, `gravarEdicaoDaRevisao`, `gravarEdicaoDaAprovacao`, `aoAtualizarAAprovacao`, `preparar_edicao_da_revisao`, `preparar_edicao_da_aprovacao`, `registrar_evento_da_revisao_editada`, `registrar_evento_da_aprovacao_editada` — mesmos nomes em todas as tarefas.
- **Lacunas aceitas:** salvar sem mudar nada grava sem evento e sem aviso (o banco não registra); a tela não desabilita o Salvar quando nada mudou; a edição não olha se a etapa da revisão/aprovação está em andamento (só o processo), porque a razão de existir é corrigir depois da conclusão; conferir a tela de verdade (critérios `[visual]`) depende de uma vitrine local que este projeto não tem.
