# Ticket 03 de revisoes-aprovacao (Aprovação na janela de concluir) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a janela de concluir a Aprovação pelo setor mostra a versão aprovada, aceita o número, o link e a data do E-protocolo (opcionais), grava a aprovação e a conclusão juntas, e a aprovação aparece na gaveta, no selo "Aprovada" em Arquivos e no histórico; a versão aprovada não tem arquivo substituído; voltar para a Aprovação ou antes dela desfaz a aprovação, com aviso.

**Architecture:** uma migração não destrutiva cria a tabela `aprovacoes` (RLS, privilégios de coluna, gatilhos, eventos), a função `concluir_aprovacao`, estende o gatilho de conclusão do ticket 02, `voltar_a_etapa` e `arquivos_da_versao`. A interface estende o módulo `src/revisoes/` (ler e concluir a aprovação), generaliza o bloco da janela de concluir para a Aprovação e acrescenta a gaveta da Aprovação, o selo e o aviso de voltar. A função `arquivos-no-drive` passa a recusar a substituição de arquivo de versão aprovada **antes** de os bytes subirem ao Drive.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), Edge Function (Deno, decisão pura testada no Vitest), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/revisoes-aprovacao/spec.md` (histórias 13 a 20, 24, 25, 27 a 31; "Modelo de dados › aprovacoes", "Quem pode o quê", "Regras que o banco impõe") · **Ticket:** `.scratch/revisoes-aprovacao/issues/03-aprovacao-no-concluir.md` (critérios citados como "critério N", na ordem do ticket) · ADRs 0011, 0014 e 0015 · `plano-02.md` e `desvios.md` (o ticket 02 deixou o bloco da janela por prop, para este ticket generalizar).

## Global Constraints

- Regras de `.claude/regras/banco.md` que valem: teste antes da migração; migração por `npx supabase migration new`; tabela nasce com RLS e políticas na mesma migração, com um teste por célula de "quem pode o quê"; função sem `security definer` (a RLS de quem chama decide), exceto as que gravam o evento (`security definer` em `private`, `search_path` vazio); execução tirada de `public` e `anon` e dada a `authenticated`; `10_privilegios_padrao`, `00_rls_ligada` e `01_buckets_privados` continuam passando; nenhum Storage. Conferir o vínculo (`supabase/AMBIENTES.md`, dev `yclkzyoebpsxmgpbcbus`, e `supabase/.temp/project-ref`) antes do `db:types`.
- Rede do escritório: porta 5432 fechada. pgTAP e migração rodam **no GitHub Actions** ("Ajustes deste Projeto" do `CLAUDE.md`): `git push` da branch (sem `--force`), disparo de "Testes de banco" e de "Migrar banco de desenvolvimento" na branch e leitura do resultado dispensam autorização. Não há `gh`: os workflows se disparam pelo navegador do app (skill `anthropic-skills:built-in-browser`; no ticket 02 o clique falhou com o painel lento e foi feito pelo DOM com `javascript_tool`). Produção, `migration repair` e `functions deploy` só com a aprovação do usuário. A trava de git barra algumas formas combinadas: um comando por vez, e `cd` não persiste de forma segura (use caminhos absolutos).
- `npm test` nunca depende do banco: telas com `AcessoFalso`, `CadastrosFalso`, `ProcessosFalso`, `CatalogoFalso`, `VersoesFalso` e `RevisoesFalso`.
- ESLint no pre-commit: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; sem `any`; no máximo 2 níveis de indentação. `tsc -b` e `madge --circular` limpos. Dados de teste inventados (números de E-protocolo também). O `lint-staged` do pre-commit falha com mais de uns 50 arquivos em stage no Windows: comitar em lotes. Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.
- Frases literais da spec e do ticket: "Versão aprovada: V8", "V8 aprovada", "Sem número do E-protocolo", "Sem aprovação registrada.", "A aprovação da V8 será desfeita.", "A versão V8 foi aprovada e seus arquivos não podem ser substituídos.", "A V8 está sem relatório.", "Carregando…". Erro de leitura: "Não foi possível carregar a aprovação. Verifique a conexão e tente de novo." com [Tentar de novo] (`ErroAoCarregar alvo="a aprovação"`).

## Decisões de execução (tomadas aqui, sem mudar a spec; registrar no `desvios.md`)

- **A edição da aprovação fica toda no ticket 04.** `aprovacoes` nasce só com `select`, `insert` (colunas `processo_id`, `numero_eprotocolo`, `link`, `aprovada_em`) e `delete` (que o gatilho limita à volta de etapa). Alterar é recusado por falta de privilégio (42501); o teste prova a recusa. As células "alterar sim" da tabela de perfis da spec são do ticket 04.
- **A trava na `arquivos-no-drive` é acréscimo ao que a spec diz** ("nenhuma mudança na função"): sem ela, a substituição de arquivo de versão aprovada, tentada fora da tela, **sobrescreve o arquivo no Drive** (a sessão de envio atualiza o mesmo arquivo) e só depois o banco recusa o registro. A função passa a ler se a versão do arquivo tem aprovação e recusa antes de abrir a sessão. Depois de comitada, a função precisa ser **publicada pelo usuário** (`npx supabase functions deploy arquivos-no-drive --project-ref yclkzyoebpsxmgpbcbus --use-api`): registrar como pendente do usuário no backlog.
- **`substituir_arquivo` não ganha conferência própria:** o gatilho `bloquear_troca_em_versao_aprovada` (antes de alterar `arquivos_da_versao`) dispara dentro dela e dá a mesma recusa. O teste prova pelos dois caminhos (update direto e função).
- **"Versão mais recente" e "completa"** são as do ticket 01 (`private.id_da_versao_mais_recente`, `private.conferir_versao_completa`). A trava de conclusão exige aprovação **da versão mais recente** (`sem_aprovacao:<n>`), como a da revisão.
- **Data da aprovação:** "última revisão interna" é a maior `revisada_em` de `revisoes_internas` do processo; sem revisão (etapa "realizada anteriormente"), sem limite inferior.
- **Códigos das recusas (P0001):** `aprovacao_fora_da_etapa`, `processo_ja_aprovado`, `link_invalido`, `aprovacao_antes_da_revisao:<data>:<data da revisão>`, `sem_aprovacao:<n>`, `aprovacao_so_se_desfaz_na_volta`, `versao_aprovada:<n>`, `processo_com_aprovacao`; já existem `sem_versao`, `versao_incompleta:<n>:<papéis>`, `data_no_futuro:<data>`, `processo_parado:<situação>`.
- **Frases** (módulo `src/revisoes/frasesDeAprovacao.ts`, para `frasesDeRevisao.ts` não passar de 300 linhas): `A aprovação só pode ser registrada com a Aprovação pelo setor em andamento.` · `Este processo já tem aprovação registrada.` · `O link do E-protocolo precisa começar com http:// ou https://.` · `A data da aprovação (12/10/2026) não pode ser antes da última revisão interna (13/10/2026).` · `A V8 ainda não tem aprovação registrada. Conclua a Aprovação pelo setor pela janela de concluir.` · `A aprovação só é desfeita ao voltar para a Aprovação pelo setor ou para antes dela.` · `A versão V8 foi aprovada e seus arquivos não podem ser substituídos.` · `Não é possível excluir: processo tem aprovação registrada. Cancele o processo em vez de excluí-lo.` Data no futuro usa a frase que já existe ("A data 20/10/2026 está no futuro.").
- **Eventos:** entidade `aprovacao`, ações `registrar` (antes nulo, depois = estado) e `desfazer` (antes = estado, depois nulo), referência = id do processo. Estado: `processo_nome`, `setor_sigla`, `versao` ("V8"), `numero_eprotocolo`, `link`, `aprovada_em`, `registrada_por_nome`.
- **O bloco de campos da janela se generaliza agora** (segunda repetição real): o que é comum à revisão e à aprovação (`salvando`, `falha`, `frase` de bloqueio, `liberada`, `gravar`) sai para `useGravacaoNaJanela`; cada etapa tem o seu rascunho e o seu bloco (`BlocoDaRevisao`, `BlocoDaAprovacao`).
- **Sem etapa pendente depois da Aprovação** (a Publicação pode estar desativada ou dispensada): `PedidoDeAvanco.proxima` passa a aceitar `null`; a janela omite a pergunta do responsável; o título é "Concluir Aprovação pelo setor" e o botão "Concluir". O arrastar no Quadro só existe quando há pendente depois (`colunaDeDestino`), então o "mesmo pelo arrastar" vale nesse caso.
- **A aprovação do processo é lida uma vez pelo `CaminhoDoProcesso`** (`useCarregamento` de `revisoes.lerAprovacao(processo.id)`, relido quando a assinatura das etapas muda) e entregue à gaveta da Aprovação (com os estados carregando, vazio e erro) e à janela de voltar (o aviso só aparece com a leitura pronta e a aprovação existente; falha na leitura não impede voltar: o banco desfaz de qualquer modo).
- **`Versao.aprovada: boolean`** (lida junto com a versão por `aprovacao:aprovacoes(id)`) alimenta o selo e o sumiço do [Substituir]; a `VersoesFalso` ganha `aprovadas: Record<processoId, número>` e a `RevisoesFalso` a atualiza ao concluir e ao ser desfeita pela volta.
- **A volta na falsa:** `ProcessosFalso` ganha o gancho `aoVoltar: ((processoId: string, etapaCodigo: string) => void) | null` (mesmo padrão do `aoRegistrar` da `VersoesFalso`); a `RevisoesFalso` o ocupa no construtor e, se a etapa for a `aprovacao_setor` ou anterior, apaga a aprovação, tira a marca da versão e entrega o evento "desfeita" ao histórico.
- **Testes de banco antigos** que concluem a Aprovação por `concluida` (17, 18, 19, 27 a 30, 34, 35 e os que o CI apontar) passam a usar "realizada anteriormente" ou a função nova; sem tocar na regra.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/40_aprovacao.test.sql` (novo) | pgTAP: perfis, regras, conclusão, volta, troca de arquivo, exclusão, eventos |
| `supabase/migrations/<data>_aprovacao.sql` (novo) | tabela, gatilhos, função, eventos, conclusão, volta, troca |
| `supabase/tests/17,18,19,27..30,34,35_*` (os que o CI apontar) | concluir a etapa 5 passa a montar a aprovação ou a usar "realizada anteriormente" |
| `supabase/AMBIENTES.md` · `src/types/database.ts` | registro da migração · tipos gerados |
| `supabase/functions/_shared/substituicao.ts` (+ `.test.ts`), `decisao.ts`, `arquivos-no-drive/acoes.ts` | recusa antes do Drive |
| `src/revisoes/tipos.ts` · `frasesDeAprovacao.ts` (+ teste) · `rascunhoDaAprovacao.ts` (+ teste) | tipos, frases, rascunho e dados da aprovação |
| `src/revisoes/revisoesSupabase.ts` · `RevisoesFalso.ts` (+ testes) | `lerAprovacao`, `concluirAprovacao` |
| `src/versoes/tipos.ts` · `versaoDaLinha.ts` · `recusasDeVersoes.ts` · `VersoesFalso.ts` (+ testes) | `Versao.aprovada`, frase da recusa |
| `src/processos/andamentosSupabase.ts` · `ProcessosFalso.ts` · `lerProcessoSupabase.ts` | códigos de recusa, gancho `aoVoltar`, evento no histórico |
| `src/hooks/useGravacaoNaJanela.ts` (novo) · `useRevisaoDaJanela.ts` · `useAprovacaoDaJanela.ts` (novo) | gravação da janela |
| `src/components/processos/BlocoDaAprovacao.tsx` (novo) · `JanelaDeAvanco.tsx` · `JanelasDaEtapa.tsx` | a janela da Aprovação e o aviso de voltar |
| `src/processos/gravarAcoes.ts` · `src/hooks/useAcoesDaEtapa.ts` | `proxima` nulo; `gravarAprovacao` |
| `src/components/processos/AprovacaoDaEtapa.tsx` (novo) · `DetalheDaEtapa.tsx` · `EtapasDoProcesso.tsx` · `CaminhoDoProcesso.tsx` | a gaveta da Aprovação |
| `src/components/versoes/VersaoEmDestaque.tsx` · `ListaDeVersoes.tsx` | selo e [Substituir] |
| `src/cadastros/historicoDosCadastros.ts` | textos da aprovação |
| `src/App.aprovacao.test.tsx` (novo) | tela inteira |

---

### Task 1: Banco: aprovações (critério 1)

**Files:**
- Create: `supabase/tests/40_aprovacao.test.sql`, `supabase/migrations/<data>_aprovacao.sql`
- Modify: testes antigos que concluem a Aprovação por `concluida` (17, 18, 19, 27 a 30, 34, 35 e os que o CI apontar), `supabase/AMBIENTES.md`, `src/types/database.ts` (regenerado)

**Interfaces:**
- Consumes (tickets 01 e 02): `private.id_da_versao_mais_recente(uuid)`, `private.conferir_versao_completa(uuid)`, `private.conferir_conclusao_da_etapa()`, `private.pode_alterar_cadastros()`, `private.usuario_ativo()`, `private.conferir_processo_em_andamento(uuid)`, `private.voltando()`, `public.avancar_etapa(uuid, text, text, uuid)`, `public.voltar_a_etapa(uuid, text, uuid)`, `public.substituir_arquivo(uuid, jsonb)`.
- Produces: tabela `public.aprovacoes`; `public.concluir_aprovacao(p_andamento uuid, p_numero text, p_link text, p_data date, p_responsavel uuid) returns void`; `private.desfazer_aprovacao_da_volta(public.andamentos) returns void`; recusas listadas nas decisões.

- [ ] **Step 0: Conferir o alvo e criar a branch e o marco.** `supabase/AMBIENTES.md` "vínculo atual" = `yclkzyoebpsxmgpbcbus` (dev) e `supabase/.temp/project-ref` igual. Árvore limpa. `git switch -c revisoes-aprovacao-03`; `git tag marco/2026-10-19-inicio-ticket-03-revisoes-aprovacao`; `git push origin "refs/tags/marco/*:refs/tags/marco/*"`. Reler `.claude/regras/banco.md` (lido nesta sessão).

- [ ] **Step 1: Escrever o teste que falha** `supabase/tests/40_aprovacao.test.sql`. Cabeçalho, usuários (a1 administrador, a2 integrante, a3 consulta, a4 inativo), setor/macro `...0040` e auxiliares copiados de `39_revisao_interna.test.sql` (`andamento`, `agir`, `status`, `processo`, `arquivo`, `par`, `enviar`, `claims`, `revisar`, sufixo `T40`), mais:

```sql
-- Um arquivo de relatório inventado e a versão completa (.bpmn, .png e relatório) de um processo.
create function pg_temp.completa() returns jsonb language sql immutable as $$
  select pg_temp.par() || jsonb_build_array(pg_temp.arquivo('relatorio', 'docx')) $$;
create function pg_temp.enviar_completa(nome_do_processo text) returns uuid language sql as $$
  select public.registrar_versao(pg_temp.processo(nome_do_processo),
    (select coalesce(max(numero), 0) + 1 from public.versoes where processo_id = pg_temp.processo(nome_do_processo)),
    null, pg_temp.completa()) $$;
grant execute on function pg_temp.enviar_completa(text) to authenticated;

-- Leva o processo até a Aprovação em andamento: as etapas 1 a 4 "realizadas anteriormente" (sem registro nem trava).
create function pg_temp.ate_a_aprovacao(nome_do_processo text) returns void language plpgsql as $$
begin
  perform pg_temp.agir(nome_do_processo, 'modelagem', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'relatorio_modelagem_tecnica', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_interna', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'revisao_setor', 'realizada_anteriormente', 'Feita antes');
  perform pg_temp.agir(nome_do_processo, 'aprovacao_setor', 'em_andamento');
end $$;
grant execute on function pg_temp.ate_a_aprovacao(text) to authenticated;

-- A chamada da tela: a aprovação e a conclusão numa função só.
create function pg_temp.aprovar(nome_do_processo text, numero text default null, link text default null,
  data date default null, responsavel uuid default null) returns void language sql as $$
  select public.concluir_aprovacao(pg_temp.andamento(nome_do_processo, 'aprovacao_setor'), numero, link, data, responsavel) $$;
grant execute on function pg_temp.aprovar(text, text, text, date, uuid) to authenticated;
create function pg_temp.aprovacoes(nome_do_processo text) returns bigint language sql stable as $$
  select count(*) from public.aprovacoes where processo_id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.aprovacoes(text) to authenticated;
```

Processos: `array['Aprovada','Etapa Errada','Parado','Sem Versao','Incompleta','Segunda','Link','Datas','Direta','Volta Setor','Volta Propria','Volta Publicacao','Troca','Perfis','Excluir','Pai','Filho']` (o `Filho` à parte, subprocesso do `Pai`, como no 39). Corpo (cada bloco com `pg_temp.claims('a2')` e `set local role authenticated`; `plan(N)` ao número real, o `finish()` acusa a diferença; `throws_ok` usa `'P0001'` e a mensagem exata):

  1. **Aprovada (sem número, link e data):** a1 `enviar_completa`; a2 `ate_a_aprovacao`; `lives_ok` `aprovar('Aprovada')`. Provar: uma aprovação com `versao_id` = a V1, `numero_eprotocolo`, `link` e `aprovada_em` nulos, `registrada_por` = a2; a etapa 5 `concluida`; a Publicação `em_andamento`; um evento (`entidade='aprovacao'`, `acao='registrar'`, `entidade_ref = processo::text`, `detalhes->'depois'->>'versao' = 'V1'`, `detalhes->'antes'` nulo).
  2. **Com número, link e data (Datas):** a1 `enviar_completa`; a2 `revisar('Datas','sem_alteracao')` (ticket 02, dá `revisada_em = current_date`) e `avancar_etapa(revisao_setor,'concluir')` até a Aprovação em andamento (o auxiliar `ate_a_aprovacao_revisando` faz as etapas 1 e 2 "realizada anteriormente", `revisao_interna` em andamento, e as conclusões por função); data de hoje aceita (`current_date`) com número `'  PROT-2026-0001  '` (aparado) e link `'https://eprotocolo.example/abc'`. Provar `numero_eprotocolo = 'PROT-2026-0001'`. Outro processo com revisão: data `current_date - 1` → `aprovacao_antes_da_revisao:<ontem>:<hoje>`; data `current_date + 1` → `data_no_futuro:<amanhã>` (formato ISO, como o 18).
  3. **Link (Link):** `ftp://x.example/a` → `link_invalido`; `https://x.example/a` e `http://x.example/a` aceitos (um em cada processo ou antes/depois da conclusão: usar `insert into public.aprovacoes` direto para o primeiro e a função para o segundo não é necessário; basta `aprovar` com `http://` aceito e, em `Datas`, o `https://`); link só com espaços vira nulo.
  4. **Etapa errada / parado / sem versão / incompleta:** `Etapa Errada` (Revisão pelo setor em andamento, V1 completa): `insert into public.aprovacoes (processo_id) values (...)` → `aprovacao_fora_da_etapa`. `Parado`: aprovação em andamento e processo suspenso (`suspender_processo`) → `aprovar` → `processo_parado:suspenso`. `Sem Versao` → `aprovar` → `sem_versao`. `Incompleta` (`enviar`, sem relatório) → `aprovar` → `versao_incompleta:1:relatorio`; nada gravado (contagem 0; a etapa segue em andamento).
  5. **Segunda aprovação (Segunda):** V1 completa; `insert into public.aprovacoes (processo_id)` direto aceito (a etapa em andamento); o segundo `insert` → `processo_ja_aprovado`.
  6. **Direta (Direta):** V1 completa, `ate_a_aprovacao`; `avancar_etapa(..., 'concluir', null, null)` → `sem_aprovacao:1`; `agir(..., 'concluida')` → `sem_aprovacao:1`; `aprovar` aceito e a etapa `concluida`; "realizada anteriormente" na Aprovação de outro processo continua aceita (`ate_a_aprovacao` do `Perfis`... usar um processo próprio `Realizada`: acrescentar ao array).
  7. **Voltar desfaz a aprovação:** `Volta Setor`: V1 completa, `ate_a_aprovacao`, `aprovar`; `voltar_a_etapa(andamento da revisao_setor, 'Ajustar', null)` → aprovações = 0; um evento `acao='desfazer'` com `antes->>'versao' = 'V1'` e `depois` nulo; `Volta Propria`: aprovada, depois `voltar_a_etapa(andamento da aprovacao_setor, 'Rever', null)` → aprovações = 0; `Volta Publicacao`: aprovada, a Publicação concluída (`agir(..., 'publicacao', 'concluida')`), depois `voltar_a_etapa(andamento da publicacao, 'Rever', null)` → aprovações continuam 1 (volta para depois da Aprovação não desfaz). `delete from public.aprovacoes` direto (a2) → `aprovacao_so_se_desfaz_na_volta`.
  8. **Nada se altera:** `update public.aprovacoes set link = 'https://x.example'` → `42501` (sem privilégio); a inclusão direta de `versao_id` ou `registrada_por` → `42501` (coluna sem privilégio).
  9. **Versão aprovada não tem arquivo substituído (Troca):** a1 `enviar_completa` (V1), `ate_a_aprovacao`, `aprovar`; a2 `substituir_arquivo((select id from arquivos_da_versao where versao_id = V1 and papel = 'relatorio'), '{"formato":"docx","tamanho":200,"hash_md5":"..."}')` → `versao_aprovada:1`; `update public.arquivos_da_versao set tamanho = 5 where ...` direto → `versao_aprovada:1`; depois de `voltar_a_etapa` à Revisão pelo setor, a mesma substituição é aceita; em outro processo sem aprovação (use `Segunda` antes do insert, ou um `Livre` com V1 completa) a substituição é aceita.
  10. **Excluir processo com aprovação (Excluir):** aprovado; `delete from public.processos where nome = 'Excluir'` → `processo_com_aprovacao` (vem antes das recusas de revisões e de versões).
  11. **Perfis (Perfis):** como **a3 (consulta)**: `aprovar` → `42501`; ler `aprovacoes` e os eventos `aprovacao` (já gravados): `count > 0`; `delete from public.aprovacoes` não apaga nada (contagem igual). Como **a4 (inativo)**: `aprovar` → `registro_inexistente`; contagem de `aprovacoes` e dos eventos = 0; `insert` direto → `42501`. Como **a1 (administrador)**: `aprovar('Perfis')` aceito. **Visitante** (`set local role anon`, claims vazias): `select count(*) from public.aprovacoes` → `42501`; `select public.concluir_aprovacao(...)` → `42501`. Como a2: `insert into public.eventos (acao, entidade, entidade_ref) values ('registrar','aprovacao','x')` → `42501`.
  12. **Subprocesso e reclassificação:** `Pai` e `Filho` como no 39; `Filho` com V1 completa, `ate_a_aprovacao('Filho')`, `aprovar('Filho')` aceito; `reclassificar_processo(Filho, 'processo', null, 'Virou processo')` e a aprovação continua com o mesmo `processo_id`.
  13. **Estrutura:** `reset role`; `conferir_conclusao_da_etapa` ainda em `andamentos` (1); `preparar_aprovacao` e `bloquear_apagar_aprovacao` em `aprovacoes` (1 cada); `bloquear_troca_em_versao_aprovada` em `arquivos_da_versao` (1); `conferir_processo_sem_aprovacao` em `processos` (1); `concluir_aprovacao` não é `security definer`; a conclusão da Revisão interna e da Revisão pelo setor continuam recusando (reaproveita `Incompleta`: Revisão pelo setor concluída sem relatório → `versao_incompleta:1:relatorio`).

  Fechar com `select * from finish();` e o `do $$ raise exception ... $$` do relatório, como o 39.

- [ ] **Step 2: Rodar para ver falhar.** `git add supabase/tests/40_aprovacao.test.sql`; commit "Ticket 03 de revisoes-aprovacao: teste de banco da Aprovação"; `git push -u origin revisoes-aprovacao-03`; disparar "Testes de banco" na branch e ler o resultado. Esperado: o 40 falha (tabela e função inexistentes); os outros 35 arquivos verdes (conferir a contagem pelo log do passo `npm run test:db`, recolhido: expandi-lo).

- [ ] **Step 3: Escrever a migração.** `npx supabase migration new aprovacao`, com (comentário de cabeçalho no estilo da `revisao_interna`, citando ADRs 0011 e 0015 e que a edição é do ticket 04):

```sql
create table public.aprovacoes (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null unique references public.processos (id) on delete restrict,
  versao_id uuid not null references public.versoes (id) on delete restrict,
  numero_eprotocolo text constraint aprovacoes_numero_tamanho check (char_length(numero_eprotocolo) between 1 and 60),
  link text constraint aprovacoes_link_formato check (char_length(link) <= 500 and link ~* '^https?://.+'),
  aprovada_em date,
  registrada_por uuid not null references public.usuarios (id) on delete restrict,
  registrada_em timestamptz not null default now()
);

alter table public.aprovacoes enable row level security;
revoke all on public.aprovacoes from anon, authenticated;
grant select, delete on public.aprovacoes to authenticated;
grant insert (processo_id, numero_eprotocolo, link, aprovada_em) on public.aprovacoes to authenticated;

create policy "aprovacoes: ativo lê" on public.aprovacoes
  for select to authenticated using ((select private.usuario_ativo()));
create policy "aprovacoes: administrador e integrante ativos criam" on public.aprovacoes
  for insert to authenticated with check ((select private.pode_alterar_cadastros()));
create policy "aprovacoes: administrador e integrante ativos apagam" on public.aprovacoes
  for delete to authenticated using ((select private.pode_alterar_cadastros()));
```

  Funções e gatilhos (cada uma ≤ 20 linhas, no estilo da `revisao_interna`):
  - `private.conferir_aprovacao_em_andamento(p_processo uuid)`: a etapa `aprovacao_setor` do processo precisa estar `em_andamento`, senão `raise exception 'aprovacao_fora_da_etapa'`.
  - `private.conferir_link_da_aprovacao(p_link text)`: `null` passa; senão `p_link ~* '^https?://.+'` e `char_length <= 500`, senão `link_invalido`.
  - `private.conferir_data_da_aprovacao(p_processo uuid, p_data date)`: `null` passa; `p_data > current_date` → `data_no_futuro:%`; com revisão, `p_data < (select max(revisada_em) ...)` → `aprovacao_antes_da_revisao:%:%` (as duas datas em ISO).
  - `private.preparar_aprovacao()` (`before insert`): perfil (`private.pode_alterar_cadastros()`, senão 42501), `conferir_processo_em_andamento`, `conferir_aprovacao_em_andamento`, `processo_ja_aprovado` se já existe, `conferir_versao_completa` (dá `sem_versao` e `versao_incompleta`), `new.versao_id := id_da_versao_mais_recente`, `new.registrada_por := auth.uid()`, número e link aparados (vazio vira nulo), `conferir_link_da_aprovacao`, `conferir_data_da_aprovacao`.
  - `private.bloquear_apagar_aprovacao()` (`before delete`): `if not private.voltando() then raise exception 'aprovacao_so_se_desfaz_na_volta'`. Nome vem antes do gatilho de evento (ordem alfabética).
  - `private.estado_da_aprovacao(p_aprovacao uuid) returns jsonb` (`security definer`): processo, setor, `'V' || numero`, número, link, `aprovada_em`, nome de quem registrou.
  - `private.registrar_evento_da_aprovacao()` (`after insert`, `security definer`): `acao 'registrar'`, antes nulo. `private.registrar_evento_da_aprovacao_desfeita()` (`before delete`, nome `registrar_evento_da_aprovacao_desfeita`, depois de `bloquear_apagar_aprovacao`): `acao 'desfazer'`, antes = `estado_da_aprovacao(old.id)`, depois nulo; devolve `old`.
  - Política `eventos: perfil ativo lê as aprovações` (`entidade = 'aprovacao'`).
  - `private.conferir_processo_sem_aprovacao()` (`before delete on processos`, nome antes de `conferir_processo_sem_revisoes`): `processo_com_aprovacao` se existe aprovação.
  - `private.bloquear_troca_em_versao_aprovada()` (`before update on arquivos_da_versao`, nome antes de `preparar_arquivo_da_versao`): se `exists (select 1 from aprovacoes where versao_id = old.versao_id)` → `versao_aprovada:<numero da versão>`.
  - `create or replace function private.conferir_conclusao_da_etapa()` com o ramo `elsif codigo_da_etapa = 'aprovacao_setor' then perform private.conferir_aprovacao_da_versao(new.processo_id)`; `private.conferir_aprovacao_da_versao(p_processo uuid)`: `sem_versao` sem versão; sem aprovação da versão mais recente, `sem_aprovacao:<n>`.
  - `private.desfazer_aprovacao_da_volta(escolhido public.andamentos)` e `create or replace function public.voltar_a_etapa(uuid, text, uuid)` (corpo do ticket 14 de processos-etapas, com `perform private.desfazer_aprovacao_da_volta(escolhido);` depois de `reabrir_etapa` e antes do `set_config('ep.voltando', 'off', ...)`). A função apaga a aprovação do processo quando a ordem da etapa escolhida é `<=` a da `aprovacao_setor`.
  - `public.concluir_aprovacao(...)` como `concluir_revisao_interna`: o andamento precisa ser o da `aprovacao_setor` (senão `registro_inexistente`); `insert into public.aprovacoes (processo_id, numero_eprotocolo, link, aprovada_em)`; `perform public.avancar_etapa(p_andamento, 'concluir', null, p_responsavel)`.
  - `revoke execute ... from public, anon; grant execute ... to authenticated` para as funções de gatilho e as públicas, e `revoke ... from public, anon, authenticated` para as de evento (`estado_da_aprovacao`, os dois `registrar_evento_*`), como na `revisao_interna`.

- [ ] **Step 4: Aplicar e testar.** Commit "Ticket 03 de revisoes-aprovacao: migração da Aprovação" (a migração) e `git push`; disparar "Migrar banco de desenvolvimento" na branch com o nome do arquivo (sem a pasta) e ler o resultado (primeira falha possível: o nome com a pasta); disparar "Testes de banco" e ler. Esperado: o 40 passa; podem falhar testes antigos que concluem a etapa 5 por `concluida`.

- [ ] **Step 5: Ajustar os testes antigos que o CI apontar** (17, 18, 19, 27 a 30, 34, 35...): onde concluem a `aprovacao_setor` por `concluida`, trocar por "realizada anteriormente" com nota (quando o teste não trata da conclusão) ou por `concluir_aprovacao` com a V1 completa (quando trata). Um ciclo de push e "Testes de banco" por lote. Registrar no `desvios.md` quais foram.

- [ ] **Step 6: Tipos e registro.** Com o vínculo conferido, `npm run db:types` (a tabela e `concluir_aprovacao` entram; o `database.ts` volta modificado só por fim de linha em outros trechos, como antes: conferir `git diff --ignore-cr-at-eol`). Acrescentar a linha da migração em `supabase/AMBIENTES.md` (teste 40 falhou antes, tabela e função inexistentes; migração aplicada pelo workflow; os arquivos verdes pelo "Testes de banco" na branch). Comitar "Ticket 03 de revisoes-aprovacao: testes antigos, tipos e registro da migração".

---

### Task 2: A função `arquivos-no-drive` recusa versão aprovada (critério 4)

**Files:**
- Modify: `supabase/functions/_shared/substituicao.ts`, `supabase/functions/_shared/substituicao.test.ts`, `supabase/functions/_shared/decisao.ts`, `supabase/functions/arquivos-no-drive/acoes.ts`

**Interfaces:**
- Produces: `AlvoDaSubstituicao.aprovada: boolean`; `CodigoDeRecusa` ganha `'versao_aprovada'` (mensagem "A versão está aprovada: seus arquivos não podem ser substituídos.", status 409); `lerAlvoDaSubstituicao` lê `versoes(processo_id, historica, aprovacoes(id))`.

- [ ] **Step 1: Teste que falha** em `substituicao.test.ts`: `conferirAlvoDoEnvio({ ...alvo, aprovada: true }, pedidoDeEnvio)` e `conferirAlvoDoRegistro({ ...alvo, aprovada: true }, pedidoDeRegistro)` recusam com `versao_aprovada` (o alvo base ganha `aprovada: false`; os casos antigos seguem). `npx vitest run supabase/functions/_shared/substituicao.test.ts` → FALHA.
- [ ] **Step 2: Implementar.** Em `substituicao.ts`, `conferirAlvo`: depois da histórica, `if (alvo.aprovada) return falhar('versao_aprovada', String(...))` (o detalhe é o número da versão, que a tela usa; incluir `numero: number` no alvo, lido com a versão). Em `decisao.ts`: o código, a mensagem e o status 409. Em `acoes.ts`: `LinhaDoAlvo.versoes` ganha `numero` e `aprovacoes: { id: string }[]`; o select vira `'papel, formato, nome, drive_id, versoes(processo_id, historica, numero, aprovacoes(id))'`; `aprovada: versoes.aprovacoes.length > 0`. Rodar → PASSA; `npx tsc -b`; testes da função (`npx vitest run supabase/functions`).
- [ ] **Step 3: Comitar** "Ticket 03 de revisoes-aprovacao: a função recusa trocar arquivo de versão aprovada". **Pendente do usuário** (não rodo): publicar a função no desenvolvimento; entra no backlog no fecho.

---

### Task 3: Tipos, frases e módulo de aprovação, real e falso (critérios 6 e 4, parte)

**Files:**
- Create: `src/revisoes/frasesDeAprovacao.ts`, `src/revisoes/frasesDeAprovacao.test.ts`, `src/revisoes/rascunhoDaAprovacao.ts`, `src/revisoes/rascunhoDaAprovacao.test.ts`
- Modify: `src/revisoes/tipos.ts`, `src/revisoes/revisoesSupabase.ts` (+ teste), `src/revisoes/RevisoesFalso.ts` (+ teste), `src/versoes/tipos.ts`, `src/versoes/versaoDaLinha.ts`, `src/versoes/recusasDeVersoes.ts`, `src/versoes/VersoesFalso.ts` (+ testes), `src/processos/andamentosSupabase.ts` (+ teste), `src/processos/ProcessosFalso.ts` (+ teste)

**Interfaces:**
- Produces (`tipos.ts`): `DadosDaAprovacao = { numeroEprotocolo: string | null; link: string | null; aprovadaEm: string | null }` (data AAAA-MM-DD); `Aprovacao = { id: string; versao: number; numeroEprotocolo: string | null; link: string | null; aprovadaEm: string | null; registradaPor: string | null; registradaEm: string }`; `ModuloDeRevisoes` ganha `lerAprovacao(processoId: string): Promise<Aprovacao | null>` e `concluirAprovacao(andamentoId: string, dados: DadosDaAprovacao, proximoResponsavelId: string | null): Promise<void>`.
- Produces (`rascunhoDaAprovacao.ts`): `RascunhoDaAprovacao = { numero: string; link: string; data: string }`, `RASCUNHO_DA_APROVACAO_VAZIO`, `dadosDaAprovacao(rascunho): DadosDaAprovacao` (aparados, vazio vira `null`).
- Produces (`Versao`): `aprovada: boolean`. Produces (`VersoesFalso`): `aprovadas: Record<string, number>` (processo → número da versão aprovada); `listarVersoes` marca `aprovada` nas versões cujo número é o aprovado do processo. A falsa de substituição recusa com `falhaDaFuncao('versao_aprovada', String(numero))`.
- Produces (`ProcessosFalso`): `aoVoltar: ((processoId: string, etapaCodigo: string) => void) | null`, chamado no fim de `voltarParaEtapa`.
- Produces (`RevisoesFalso`): `aprovacoes: Record<string, Aprovacao>` (por processo); construtor `(processos?, usuario?, versoes?: VersoesFalso)`; ocupa `processos.aoVoltar`; `concluirAprovacao` imita as recusas do banco.

- [ ] **Step 1: Testes que falham** (cada um com o arquivo de teste ao lado, no estilo dos do ticket 02):
  1. `frasesDeAprovacao.test.ts`: cada frase com o valor recebido (datas via `formatarData`; versão com "V8").
  2. `rascunhoDaAprovacao.test.ts`: `dadosDaAprovacao` apara e devolve `null` para vazio.
  3. `revisoesSupabase.test.ts`: `lerAprovacao('p1')` consulta `aprovacoes` com `processo_id = p1`, `maybeSingle`, juntando `versao:versoes(numero)` e `registrador:usuarios!registrada_por(nome)`, e traduz em `Aprovacao`; sem linha → `null`; erro → `Error` "Falha ao ler a aprovação do processo p1: …". `concluirAprovacao('a5', { numeroEprotocolo: 'PROT-1', link: null, aprovadaEm: '2026-10-13' }, 'u2')` chama `rpc('concluir_aprovacao', { p_andamento: 'a5', p_numero: 'PROT-1', p_link: null as string, p_data: '2026-10-13', p_responsavel: 'u2' })`; recusas: `versao_incompleta:8:relatorio` → "A V8 está sem relatório."; `link_invalido`, `aprovacao_antes_da_revisao`, `sem_aprovacao`, `42501`, `registro_inexistente` com as frases.
  4. `andamentosSupabase.test.ts`: `concluirEtapa` e `excluir` com cada código novo rejeitam com `TravaDoBanco` da frase.
  5. `RevisoesFalso.test.ts` (acrescentar): `concluirAprovacao` com a falsa de processos (Aprovação `a5` em andamento, `ultimaVersao` V8 completa): aceito grava `aprovacoes['p1']` (`versao` 8, `registradaPor` = nome do usuário, data fixa `2026-10-13` em `registradaEm`), conclui a etapa na falsa de processos (a próxima em andamento), marca `versoes.aprovadas['p1'] = 8` e registra em `conclusoes`; versão incompleta recusa com `fraseDoBloqueioDaConclusao`; link `ftp://` recusa; data futura (`> 2026-10-13`) recusa; data antes da última revisão da falsa recusa; aprovação já existente recusa; `falhaNaGravacao` lança antes de tudo; o gancho: `processos.voltarParaEtapa` de `revisao_setor` apaga `aprovacoes['p1']`, tira `versoes.aprovadas['p1']` e entrega um evento `desfazer` (via `aoRegistrarEvento` opcional da falsa de processos para o histórico); voltar para a Publicação não apaga.
  6. `VersoesFalso.test.ts`: `aprovadas` marca `aprovada`; `substituirArquivo` em versão aprovada rejeita com "A versão V8 foi aprovada e seus arquivos não podem ser substituídos."; `recusasDeVersoes.test.ts`: `falhaDaFuncao('versao_aprovada', '8')` e com a mensagem inteira da função ("A versão está aprovada: … (8)") dão a mesma frase (o número é o primeiro grupo de dígitos).
  Rodar tudo → FALHA.
- [ ] **Step 2: Implementar** `tipos.ts`, `frasesDeAprovacao.ts` (as frases das decisões; uma função `fraseDaVersaoAprovada(valor: string)` que extrai o número), `rascunhoDaAprovacao.ts`; em `andamentosSupabase.ts`, os códigos no `PADRAO_DA_RECUSA` e uma entrada em `FRASE_DA_RECUSA` por código (`data_no_futuro` já existe); `recusasDeVersoes.ts` (`versao_aprovada`); `versaoDaLinha.ts` (`COLUNAS_DA_VERSAO` + `aprovacao:aprovacoes(id)`, `LinhaDaVersao.aprovacao: { id: string }[]`, `aprovada: linha.aprovacao.length > 0`); `versoesSupabase.ts` não muda; `revisoesSupabase.ts` (`lerAprovacao`, `concluirAprovacao`, funções ≤ 20 linhas); `RevisoesFalso.ts` (quebrar em `AprovacoesFalso`-auxiliar puro `conferirAprovacao(...)` no arquivo `src/revisoes/conferirAprovacao.ts` para o arquivo passar de 300 linhas); `VersoesFalso.ts` (`aprovadas`, marcar na leitura, recusa na substituição, `aprovada` nas versões novas = falso); `ProcessosFalso.ts` (`aoVoltar`). Corrigir as fixtures de versões que ganham `aprovada: false` (script ou à mão; `tsc -b` aponta).
- [ ] **Step 3: `npx tsc -b`, testes dos arquivos acima → PASSAM; `npx madge --circular src`; `npx eslint src`.** Comitar "Ticket 03 de revisoes-aprovacao: módulo de aprovação (real e falso), frases e a marca na versão".

---

### Task 4: A janela de concluir a Aprovação (critério 2)

**Files:**
- Create: `src/hooks/useGravacaoNaJanela.ts`, `src/hooks/useAprovacaoDaJanela.ts`, `src/components/processos/BlocoDaAprovacao.tsx`, `src/App.aprovacao.test.tsx`
- Modify: `src/hooks/useRevisaoDaJanela.ts`, `src/components/processos/JanelaDeAvanco.tsx`, `src/components/processos/JanelasDaEtapa.tsx`, `src/processos/gravarAcoes.ts`, `src/hooks/useAcoesDaEtapa.ts`, `src/hooks/useConclusaoPeloQuadro.ts`, `src/processos/caminhoDeEtapas.ts` (se a pergunta do responsável depender de `proxima`), testes de tela que concluem a Aprovação (`App.revisaoDoSetor.test.tsx` e os que o `npm test` apontar)

**Interfaces:**
- Consumes: `fraseDoBloqueioDaConclusao`, `ModuloDeRevisoes.concluirAprovacao`, `dadosDaAprovacao`, `RascunhoDaAprovacao`.
- Produces: `useGravacaoNaJanela(aoFechar): { salvando; falha; gravar(fn: () => Promise<string | null>): Promise<void> }` (o que `useRevisaoDaJanela` repetia); `useAprovacaoDaJanela(aprovacao: AprovacaoDaJanela | undefined, bloqueio, aoFechar)` com `AprovacaoDaJanela = { versao: number; aoConfirmar: (dados: DadosDaAprovacao, responsavelId: string | null) => Promise<string | null> }`; `BlocoDaAprovacao({ versao, valor, aoMudar })`; `PedidoDeAvanco.proxima: EtapaDoCaminho | null`; `gravarAprovacao(revisoes, etapa, dados, responsavelId, aoSumir): Promise<string | null>` em `gravarAcoes.ts`; `useAcoesDaEtapa(...).gravarAprovacaoDaEtapa(dados, responsavelId)`; `JanelaDeAvanco` com `pergunta: string | null` (nulo: sem a escolha do responsável) e a prop `aprovacao?: AprovacaoDaJanela` ao lado de `revisao?`.

- [ ] **Step 1: Testes de tela que falham** `src/App.aprovacao.test.tsx` (montar como `App.revisaoInterna.test.tsx`: `montarVerso`, a Aprovação `a5` em andamento sob `EU`, a Publicação `a6` pendente depois; `new RevisoesFalso(falso, EU, versoesFalso)`). Casos, cada um pelo [Concluir] do Agora e, onde indicado, pelo arrastar do cartão no Quadro:
  1. `ultimaVersao` V8 completa: a janela "Concluir Aprovação pelo setor e iniciar Publicação" mostra "Versão aprovada: V8" e os campos "Número do E-protocolo", "Link" e "Data da aprovação"; o botão está habilitado sem preencher nada; confirmar grava `{ numeroEprotocolo: null, link: null, aprovadaEm: null }` e a Publicação entra em andamento; **o mesmo pelo arrastar**.
  2. Preenchendo número `PROT-2026-0001`, link `https://eprotocolo.example/a` e data: grava os três (aparados); o campo da data tem `max` = hoje; `maxLength` 60 e 500 nos outros dois.
  3. `ultimaVersao` V8 sem relatório: a frase "A V8 está sem relatório." em `role="alert"` e o botão principal desabilitado; sem versão: "O processo ainda não tem versão enviada." e o botão desabilitado; clicar não grava (`revisoes.conclusoes` vazio).
  4. Sem etapa pendente depois (Publicação já resolvida): a janela aparece com o título "Concluir Aprovação pelo setor", **sem** a pergunta "Quem fica com a próxima etapa?", o botão "Concluir" e os três campos; confirmar conclui a Aprovação.
  5. Recusa do banco (`falhaNaGravacao = new TravaDoBanco('O link do E-protocolo precisa começar com http:// ou https://.')`): a janela fica **aberta**, com o número, o link, a data e a escolha do responsável como estavam, e a frase em vermelho (`role="alert"` dentro do `dialog`); sem a falha, confirmar de novo grava e fecha. Falha genérica: a frase de `textoDaFalha`. Durante a gravação (`segurarGravacao`): botão desabilitado com "Salvando…".
  6. Dispensar e "Realizada anteriormente" na Aprovação não mostram os campos (a janela da nota abre como hoje); a janela de concluir a Revisão pelo setor e a de voltar não mostram a "Versão aprovada"; a janela da Revisão interna continua igual (regressão do ticket 02).
  7. [visual] não coberto por teste: registrar para o `/polir` (critério 8).
  Rodar `npx vitest run src/App.aprovacao.test.tsx` → FALHA.
- [ ] **Step 2: Generalizar a gravação da janela.** Extrair `useGravacaoNaJanela` de `useRevisaoDaJanela` (estado `salvando` e `falha`, `gravar` que chama a função recebida, fecha com `null`, mostra a falha com texto), `useRevisaoDaJanela` passa a usá-lo (os testes do ticket 02 seguem verdes), e `useAprovacaoDaJanela` o usa com o rascunho `RascunhoDaAprovacao`; `liberada` = sem frase de bloqueio, sem gravar e (aprovação) sempre pronta (os campos são opcionais).
- [ ] **Step 3: `BlocoDaAprovacao.tsx`** (≤ 80 linhas): "Versão aprovada: V8" em destaque (`<p className="janela-aprovada">`), os três campos (`input type="text" maxLength={60}`, `input type="url" maxLength={500}`, `input type="date"` com `max` = hoje em AAAA-MM-DD), cada um com rótulo e a dica "Opcional" no rótulo; reaproveitar as classes de formulário da janela (`janela-campo`, `janela-escolha-pergunta`, `janela-ajuda`); acrescentar no máximo uma regra de CSS (`janela-aprovada`) em `JanelaDeConfirmacao.css`; manter a janela dentro de 1366×768 (critério 8).
- [ ] **Step 4: `JanelaDeAvanco`.** Prop `aprovacao?: AprovacaoDaJanela`; `pergunta: string | null` (nulo omite o `EscolhaDoResponsavel` e o responsável vai `null`); o bloco da aprovação entra no lugar do da revisão; `confirmar` com `revisao` ou `aprovacao` espera a gravação (a falha aparece na janela). Se o componente passar de 300 linhas ou a função de 40, extrair o corpo para um subcomponente. `JanelasDaEtapa`: `JANELA_DO_AVANCO.concluir` ganha, para `proxima === null`, título `Concluir ${nome}`, botão `Concluir` e `pergunta: null`; `JanelaDoAvancoDaEtapa` monta `aprovacao = acao === 'concluir' && etapa.codigo === 'aprovacao_setor' ? { versao: ultimaVersao?.numero ?? 0, aoConfirmar: aoConfirmarAprovacao } : undefined` e `bloqueio = fraseDoBloqueioDaConclusao(ultimaVersao)` também para `aprovacao_setor`.
- [ ] **Step 5: Ligar à etapa.** `gravarAcoes.ts`: `PedidoDeAvanco.proxima: EtapaDoCaminho | null`; `gravarAprovacao` como `gravarRevisao`. `useAcoesDaEtapa.agir`: `if (acao === 'concluir' && etapa.codigo === 'aprovacao_setor') return setAvanco({ acao, etapa, proxima })` antes do ramo "sem pendente depois → concluir direto"; `gravarAprovacaoDaEtapa` como `gravarRevisaoDaEtapa` (manter o hook ≤ 40 linhas: se estourar, mover os dois ramos de "gravação que espera" para uma função em `gravarAcoes.ts`). Corrigir os usos de `avanco.proxima` que presumiam não nulo (`tsc -b` aponta). Rodar o arquivo de teste → PASSA.
- [ ] **Step 6: Ajustar os testes de tela existentes** que concluem a Aprovação e agora veem os campos (o `npm test` indica quais: provavelmente `App.revisaoDoSetor`, `App.agoraDoVerso`, `App.arrastarParaConcluir`): fixture com `ultimaVersao` completa e a conclusão agora em `revisoes.conclusoes`. `npm test` completo, `npx tsc -b`, `npx madge --circular src`, `npx eslint src`.
- [ ] **Step 7: Comitar** "Ticket 03 de revisoes-aprovacao: a janela de concluir pede a aprovação".

---

### Task 5: Gaveta, selo, aviso de voltar e histórico (critérios 3, 4, 5 e 6)

**Files:**
- Create: `src/components/processos/AprovacaoDaEtapa.tsx`
- Modify: `src/components/processos/DetalheDaEtapa.tsx`, `EtapasDoProcesso.tsx`, `CaminhoDoProcesso.tsx`, `JanelasDaEtapa.tsx`, `src/components/versoes/VersaoEmDestaque.tsx`, `ListaDeVersoes.tsx`, `src/cadastros/historicoDosCadastros.ts` (+ `historicoDasAprovacoes.test.ts` em `src/cadastros/`), `src/processos/lerProcessoSupabase.ts` (+ teste), `src/App.aprovacao.test.tsx`

**Interfaces:**
- Consumes: `ModuloDeRevisoes.lerAprovacao`, `useCarregamento`, `EstadoDoCarregamento`, `ErroAoCarregar`, `Pilula`, `Versao.aprovada`.
- Produces: `AprovacaoDaEtapa({ estado, aoTentarDeNovo })`; `DadosDasEtapas.aprovacao: EstadoDoCarregamento<Aprovacao | null>` e `aoTentarDeNovoAAprovacao: () => void`; `JanelasDaEtapa` ganha `aprovacao: Aprovacao | null`.

- [ ] **Step 1: Testes de tela que falham** (acrescentar ao `App.aprovacao.test.tsx`; abrir a gaveta da Aprovação clicando na linha "Aprovação pelo setor: …"):
  1. com `revisoes.aprovacoes['p1']` (V8, número `PROT-2026-0001`, link `https://eprotocolo.example/a`, data, "Bia Teste"): "V8 aprovada", o número como link com `target="_blank"` e `rel="noopener noreferrer"`, a data (`formatarData`) e "Registrada por Bia Teste"; sem link, o número é texto; sem número e sem link: "Sem número do E-protocolo"; link que não começa com `http` não vira link (defesa da tela, o banco já garante);
  2. sem aprovação: "Sem aprovação registrada."; enquanto a leitura não responde (`segurarLeitura`): "Carregando…"; leitura que falha (`falharLeitura`): o alerta "Não foi possível carregar a aprovação. Verifique a conexão e tente de novo." com [Tentar de novo]; clicar volta a "Carregando…" e, com a falha desligada, mostra a aprovação;
  3. a aprovação aparece só na gaveta da Aprovação; Consulta vê o registro sem botões; processo suspenso e cancelado também; um subprocesso mostra a própria aprovação;
  4. **depois de concluir pela janela**, a gaveta da Aprovação mostra "V8 aprovada" (a leitura é refeita quando o processo recarrega);
  5. Arquivos: a versão aprovada mostra o selo "Aprovada" (uma `Pilula` `aprovado`) e **não** mostra o [Substituir] em nenhum arquivo, nem na mais recente nem nas anteriores; a versão não aprovada mostra [Substituir]; Consulta e processo parado não mostram [Substituir] como hoje; depois de **voltar** (para a Revisão pelo setor) o selo some e o [Substituir] volta;
  6. a recusa da substituição por fora da tela aparece como "A versão V8 foi aprovada e seus arquivos não podem ser substituídos." (`VersoesFalso` em versão aprovada, forçando o `substituirArquivo`);
  7. voltar: a janela de voltar para a Revisão interna, a Revisão pelo setor e a própria Aprovação, com a aprovação existente, mostra "A aprovação da V8 será desfeita." acima do motivo; voltar para a Publicação ou para uma etapa depois dela não mostra o aviso; sem aprovação, nenhuma janela mostra; com a leitura da aprovação falhando, a janela de voltar abre sem o aviso e sem erro; confirmar a volta desfaz (a gaveta passa a "Sem aprovação registrada." e o selo some);
  8. o histórico do processo mostra "Registrou a aprovação" e "Desfez a aprovação" com o resumo.
  Rodar → FALHA.
- [ ] **Step 2: `AprovacaoDaEtapa.tsx`** (≤ 70 linhas): recebe o `EstadoDoCarregamento<Aprovacao | null>`; carregando → `<p className="etapa-registros-aviso" role="status">Carregando…</p>`; erro → `<ErroAoCarregar alvo="a aprovação" aoTentarDeNovo />`; vazio → "Sem aprovação registrada."; senão um `<li className="etapa-registro">` no estilo de `RevisoesDaEtapa` (cabeça "V8 aprovada · 13/10/2026 · Bia Teste", linha do número/link/"Sem número do E-protocolo"). A função `linkSeguro(link: string | null): string | null` (começa com `http://` ou `https://`) fica no arquivo, testada pela tela.
- [ ] **Step 3: Ligar.** `CaminhoDoProcesso`: `const lerAprovacao = useCallback(() => revisoes.lerAprovacao(processo.id), [revisoes, processo.id, assinatura])` com `assinatura = processo.etapasDoProcesso.map((etapa) => etapa.status).join()` (a leitura refaz quando a conclusão ou a volta mudam as etapas) e `useCarregamento`; `estado`, `tentarDeNovo` descem por `EtapasDoProcesso`/`DetalheDaEtapa` (`DadosDasEtapas`) e `aprovacao = estado.tipo === 'pronto' ? estado.valor : null` vai a `JanelasDaEtapa`. `DetalheDaEtapa`: `{etapa.codigo === 'aprovacao_setor' && <AprovacaoDaEtapa .../>}` depois da nota. `JanelaDoAvancoDaEtapa`: para `acao === 'voltar'` e a etapa escolhida com `ordem` até a da `aprovacao_setor` (pelo código: as etapas do caminho anteriores à Aprovação e ela mesma; calcular com a posição no `etapas` do processo, dado que o caminho está em ordem), `aviso = aprovacao ? 'A aprovação da V${aprovacao.versao} será desfeita.' : null`; `JanelaDeAvanco` ganha `aviso?: string | null` (um `<p className="janela-ajuda" role="note">` acima do motivo).
- [ ] **Step 4: Selo e [Substituir].** `VersaoEmDestaque.LinhaDoDestaque` e o cabeçalho de `BlocoDaVersao` mostram `{versao.aprovada && <Pilula situacao="aprovado">Aprovada</Pilula>}`; `ArquivosDoDestaque` e `BlocoDaVersao` usam `podeAlterar && !versao.historica && !versao.aprovada` para o `AcaoSubstituir`. (Acrescentar relatório e "sem alteração de conteúdo" não mudam: a aprovada já tem relatório.)
- [ ] **Step 5: Histórico.** Teste primeiro em `src/cadastros/historicoDasAprovacoes.test.ts` (seguir `historicoDasRevisoes.test.ts`): `{ acao: 'registrar', entidade: 'aprovacao', antes: null, depois: { processo_nome: 'Emitir Ofício', setor_sigla: 'TSA', versao: 'V8', numero_eprotocolo: 'PROT-2026-0001', link: 'https://eprotocolo.example/a', aprovada_em: '2026-10-13', registrada_por_nome: 'Bia Teste' } }` vira `textoDaAcaoDoCadastro` = "Registrou a aprovação", `nomeDoItem` = "V8 — Emitir Ofício" e `descreverEstadoDoCadastro(depois)` = "Versão aprovada: V8; Número do E-protocolo: PROT-2026-0001; Link: …; Data da aprovação: 13/10/2026; Registrada por: Bia Teste"; `desfazer` = "Desfez a aprovação" (o estado vem do `antes`). Implementar em `historicoDosCadastros.ts`: `TEXTO_DA_ACAO_DA_APROVACAO = { registrar: 'Registrou a aprovação', desfazer: 'Desfez a aprovação' }` em `TEXTOS_DA_ENTIDADE`, `aprovacao` em `nomeDoItemComDono` (`"${versao} — ${processo_nome}"`), os rótulos (`versao: 'Versão aprovada'`, `numero_eprotocolo`, `link: 'Link'`, `aprovada_em: 'Data da aprovação'`, `registrada_por_nome: 'Registrada por'`) e `aprovada_em` em `CAMPOS_DE_DATA`. Se o arquivo passar de 300 linhas, mover os textos das revisões e das aprovações para `historicoDasRevisoes.ts`. Em `lerProcessoSupabase.ts`: `.in('entidade', ['processo', 'andamento', 'versao', 'revisao_interna', 'aprovacao'])` (teste da consulta).
- [ ] **Step 6: `npm test` completo, `npx tsc -b`, `npx madge --circular src`, `npx eslint src`.** Comitar "Ticket 03 de revisoes-aprovacao: a aprovação na gaveta, o selo, o aviso de voltar e o histórico".

---

### Task 6: Fecho do ticket

**Files:**
- Modify: `.scratch/revisoes-aprovacao/desvios.md`, `.scratch/revisoes-aprovacao/spec.md` (só se algo divergir), `.scratch/revisoes-aprovacao/issues/03-*.md` (marcas `[x]`), `CONTEXT.md` (só se houver termo novo), `.scratch/melhorias-protocolo.md`, `.scratch/backlog.md`

- [ ] **Step 1: Conferência na tela (critério 8, [visual]).** Não há `.claude/launch.json` para subir a vitrine local e a pasta `.claude/` não se edita neste projeto: registrar nos desvios que a conferência **não foi feita** e fica para o `/polir` (a janela da Aprovação a 1366×768, o selo ao lado das pílulas, os registros da gaveta).
- [ ] **Step 2: `desvios.md`** (entrada datada): (1) a edição da aprovação fica no ticket 04; aqui `select`, `insert` e `delete`; (2) a trava na `arquivos-no-drive` é acréscimo ao que a spec dizia, com o motivo (sobrescrita do Drive antes da recusa do banco) e a **publicação pendente do usuário**; (3) `substituir_arquivo` sem conferência própria (o gatilho cobre); (4) a conclusão exige aprovação da versão mais recente (`sem_aprovacao:<n>`); (5) "última revisão interna" = maior `revisada_em`; (6) códigos e frases das recusas; (7) o bloco da janela generalizado (`useGravacaoNaJanela`), `proxima` nulo e a janela sem a pergunta; (8) a aprovação é lida uma vez pelo `CaminhoDoProcesso` e alimenta gaveta e aviso; (9) `Versao.aprovada` e o gancho `aoVoltar` nas falsas; (10) testes antigos de banco ajustados (quais); (11) workflows usados (números).
- [ ] **Step 3: Marcar os critérios do ticket (`- [x]`) e as caixas deste plano; `.scratch/melhorias-protocolo.md`** com os itens não testados deste comando (bloco do `/executar-complexo` em `.claude/regras/nao-testados.md`) e as ocorrências desta execução; `.scratch/backlog.md`: a publicação da função `arquivos-no-drive` (pendente do usuário).
- [ ] **Step 4: Comitar** "Ticket 03 de revisoes-aprovacao: desvios, critérios, plano e melhorias do protocolo".

(O merge na `main`, a linha `Concluído em` e o envio ficam por conta do passo 4 do `/executar-complexo`.)

---

## Autoverificação

- **Cobertura da spec/ticket:** critério 1 (banco: células de perfil, uma regra por caso, atomicidade, volta que desfaz com o antes, troca de arquivo, exclusão, subprocesso e reclassificação, testes antigos) → Task 1; critério 2 (janela da Aprovação, campos opcionais, incompleta, sem pendente depois, arrastar) → Task 4; critério 3 (gaveta com o registro, "Sem número", vazio, carregando, erro) → Task 5; critério 4 (selo, [Substituir] sumindo, frase da recusa) → Tasks 2, 3 e 5; critério 5 (aviso de voltar, selo some depois) → Task 5; critério 6 (eventos no histórico) → Tasks 1 (evento) e 5 (texto); critério 7 (testes do módulo real, das puras e da tela, inclusive falhas) → Tasks 3, 4 e 5; critério 8 [visual] → Task 6, passo 1.
- **Tipos e nomes:** `DadosDaAprovacao`, `Aprovacao`, `RascunhoDaAprovacao`, `AprovacaoDaJanela`, `useGravacaoNaJanela`, `useAprovacaoDaJanela`, `BlocoDaAprovacao`, `AprovacaoDaEtapa`, `concluirAprovacao`, `lerAprovacao`, `gravarAprovacao`, `gravarAprovacaoDaEtapa`, `Versao.aprovada`, `VersoesFalso.aprovadas`, `ProcessosFalso.aoVoltar`, `public.concluir_aprovacao`, `public.aprovacoes`, `private.desfazer_aprovacao_da_volta` — mesmos nomes em todas as tarefas.
- **Lacunas aceitas:** as outras ações da etapa continuam fechando a janela antes de gravar (só Revisão interna e Aprovação esperam); a data da aprovação usa `current_date` do banco (UTC), como o resto do banco; acrescentar arquivo a versão aprovada (um `.bpm`) não é recusado, só a substituição (spec); `functions deploy` é do usuário.
