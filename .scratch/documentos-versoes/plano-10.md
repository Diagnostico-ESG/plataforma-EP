# Relatório com numeração própria (ticket 10) — plano de execução

> **Para quem executa:** use `superpowers:executing-plans` (a pedido do `/executar-complexo`). Marque as caixas (`- [x]`) à medida que cada passo termina.

**Objetivo:** o relatório ganha a numeração própria do processo (Relatório V1, V2…), se envia sozinho ou junto com a versão em sequência, vale para as versões seguintes ("Relatório V2 (da V7)"), e somem "relatório pendente", [Acrescentar relatório], [Sem alteração de conteúdo] e a cópia (`copiado_de`).

**Ticket:** `.scratch/documentos-versoes/issues/10-relatorio-com-numeracao-propria.md`. **Spec:** `.scratch/documentos-versoes/spec.md`, seção "Arquivos por etapa (mudança de 2026-10-26)" (histórias 84 a 92, 95, 96, 109 e 111; decisões 5 a 7; linhas "Relatório numerado", "Versão aprovada…" e "Toda mudança vira evento" da tabela "Regras que o banco impõe"). **ADRs:** 0026 (vale) e 0011 (versão aprovada sem troca). **Branch:** `quadro-livre-parte-3` (já criada; marco `marco/2026-10-26-inicio-ticket-10-documentos-versoes`).

**Regras do banco que valem aqui** (`.claude/regras/banco.md`, lido em 2026-10-26): teste de banco antes da migração; função em `private` com `search_path` vazio e `revoke`/`grant` só a `authenticated`; view/função recriada com as mesmas proteções; migração, teste de banco e tipos no mesmo commit; migração já aplicada não se edita; alvo conferido antes de qualquer comando de banco (vínculo atual de `supabase/AMBIENTES.md` = `yclkzyoebpsxmgpbcbus`, desenvolvimento); a Edge Function confere o chamador por conta própria e a decisão fica em arquivo puro testado no Vitest; os testes de banco rodam no GitHub Actions ("Testes de banco") ou no Docker local (CLAUDE.md, "Testes de banco e tipos pelo Docker"); dados de teste inventados.

## Fora deste ticket (não fazer)

- Trava de arquivos em `mover_processo`, a view com `tem_versao_piloto`/`tem_versao_em_sequencia`/`tem_relatorio_numerado` e as janelas da trava (ticket 11).
- Data da validação e .pdf da aprovação (ticket 06 de revisoes-aprovacao).
- O selo "Relatório pendente" do cartão do quadro e a coluna `ultima_versao_tem_relatorio` da view (`processos_com_andamento`): não estão na lista do ticket; seguem como estão e vão para o backlog (ver Tarefa 9).
- Limpar no Drive as cópias dos "sem alteração" apagadas do banco (spec, "Fora do escopo").

## Decisões de execução (as que o ticket deixa abertas)

1. **Função do banco do relatório sozinho:** `public.enviar_relatorio(p_processo uuid, p_numero_da_versao integer, p_numero_do_relatorio integer, p_arquivo jsonb) returns uuid`. Liga o relatório à versão mais recente que não é histórica; recusa `numero_da_versao_mudou:N` e `numero_do_relatorio_mudou:N` se a prévia não vale mais, `relatorio_sem_versao` se não há versão piloto nem em sequência, `relatorio_fora_da_etapa` depois da Revisão interna. Substitui `acrescentar_relatorio`, `registrar_sem_alteracao` e `origem_do_relatorio` (as três saem com `drop function`).
2. **Relatório junto com a versão:** `registrar_versao` ganha o 5º parâmetro `p_numero_do_relatorio integer default null`; se `p_arquivos` traz um relatório e o número dado pelo banco é outro, `numero_do_relatorio_mudou:N`. A assinatura antiga (4 parâmetros) sai e a nova entra, como no ticket 09.
3. **Quem dá o número:** o gatilho `private.preparar_arquivo_da_versao` (inclusão), no relatório de versão que não é histórica: exige `docx` (`relatorio_so_docx`), exige que a versão seja a mais recente que não é histórica (`relatorio_fora_da_versao_mais_recente`), confere onde cabe (`relatorio_fora_da_etapa`) e grava `numero_do_relatorio = maior do processo + 1`, sob `pg_advisory_xact_lock` do processo (dois envios ao mesmo tempo não repetem o número). O número não tem privilégio de inclusão nem de alteração: só o banco o preenche. A unicidade por processo é desse gatilho (a tabela não guarda o processo); registrar o motivo em comentário.
4. **Unicidade (versão, papel):** a restrição `arquivos_um_por_papel` vira índice único parcial `where numero_do_relatorio is null`: continua valendo para todo papel, menos o relatório numerado. O relatório da histórica e os .pdf antigos ficam sem número e continuam com um por versão.
5. **Evento:** ação nova `enviar_relatorio` (entidade `versao`), gerada pelo gatilho `registrar_evento_do_relatorio` quando o relatório numerado entra depois da versão; `depois` leva o estado da versão (`rotulo` = a versão que ele acompanha) e `numero_do_relatorio`. O relatório que entra junto com a versão não gera evento próprio (já está nos arquivos do evento de envio). Textos: `enviar_relatorio` → "Enviou o Relatório V3 (acompanha a V8)", montado em `textoDoEvento`; `acrescentar_relatorio` e `sem_alteracao` mantêm o texto dos eventos antigos.
6. **Migração de dados** (com `set local session_replication_role = replica`, como em `20261024040938_*`, para os gatilhos não trocarem autor e data): apaga as linhas com `copiado_de` e depois a coluna; numera os `.docx` das versões que não são históricas na ordem do envio (`enviado_em`, depois `id`), por processo; deixa sem número os .pdf e o relatório da histórica; recria as funções e gatilhos que citam `copiado_de`. O trecho que numera é uma função só, testada com dados montados no teste (ver Tarefa 1).
7. **Histórica:** o relatório da histórica segue aceitando `.docx` e `.pdf`, sem número ("Relatório da V5F"). Só o envio novo de versão que não é histórica passa a exigir `.docx`. Substituir um relatório antigo em .pdf continua pedindo .pdf (mesmo tipo do que sai).
8. **Relatório na piloto:** o formulário da versão piloto **não** tem campo de relatório (o relatório se envia sozinho, por [Enviar relatório]); só a versão em sequência o tem junto. O banco aceita o relatório ligado à piloto (decisão 7 da spec), mas só pelo envio sozinho.
9. **Nome do relatório numerado:** `{SIGLA}_V{n}[P]_{Nome do processo}_Relatório V{r}.docx`; o relatório da histórica e os antigos mantêm `_Relatório` sem número. A função do servidor confere que o nome do Drive traz o `Relatório V{r}` do pedido.
10. **"Relatório que vale"** (função pura em `src/versoes/relatorioQueVale.ts`): para cada versão, os relatórios numerados ligados a ela; se não tem nenhum, o numerado de maior número entre os ligados às versões de número menor ("Relatório V2 (da V7)"); a histórica mostra o próprio ("Relatório da V5F"); o .pdf antigo sem número aparece como está ("Relatório .pdf") na versão a que pertence e **não** vale para as seguintes. Antes do primeiro numerado, nada.

## Arquivos

- Banco: `supabase/migrations/<AAAAMMDDHHMMSS>_relatorio_numerado.sql` (nova; depois de `20261026103000`), testes `supabase/tests/29_relatorio_depois.test.sql` (reescrito para o relatório numerado), `30_substituir_arquivo.test.sql` (ajustado), `37`, `40`, `41`, `49`, `50`, `55`, `57` (trocam `acrescentar_relatorio` por `enviar_relatorio` e `pdf` por `docx` onde o relatório entra pela função nova), `27` e `28` se a conferência de `relatorio`/`pdf` mudar; novo `58_relatorio_numerado_migracao.test.sql` (a numeração dos dados antigos).
- Tipos: `src/types/database.ts` (`npm run db:types`).
- Função do servidor: `supabase/functions/_shared/decisao.ts`, `registro.ts`, `nomePadrao.ts`, `substituicao.ts` (+ testes), apagar `_shared/semAlteracao.ts` e `.test.ts` e `arquivos-no-drive/semAlteracao.ts`; `arquivos-no-drive/acoes.ts`, `registrar.ts`, `index.ts`.
- Módulo: `src/versoes/tipos.ts`, `rotulos.ts`, `relatorioQueVale.ts` (novo), `formularioDeVersao.ts`, `recusasDeVersoes.ts`, `versaoDaLinha.ts`, `versoesSupabase.ts`, `VersoesFalso.ts`, `conferenciaDosArquivos.ts` (+ testes), `src/testes/versoesDeTeste.ts`.
- Telas: `src/components/versoes/SecaoDeVersoes.tsx`, `FormularioDeVersao.tsx`, `FormularioDeRelatorio.tsx`, `VersaoEmDestaque.tsx`, `ListaDeVersoes.tsx`, `CampoDeArquivo.tsx`, apagar `AcaoSemAlteracao.tsx`, CSS ao lado.
- Histórico: `src/cadastros/historicoDosCadastros.ts` (+ `historicoDasVersoes.test.ts`).
- Testes de tela: `src/App.relatorioDepois.test.tsx` (vira o do relatório numerado: o nome fica `App.relatorioDepois` porque o ticket o cita), `App.arquivosDoVerso`, `App.versoesNoProcesso`, `App.enviarVersao`, `App.substituirArquivo`, `App.versoesNoHistorico`, `App.agoraDoVerso`, `App.versaoPiloto`, `App.acrescentarArquivo`, `App.editarRegistros`, `App.registrarRevisao` e `JanelasDeEdicao.test` (só onde citam relatório pendente/sem alteração/`copiado_de`).
- Outros: `scripts/prova-do-drive.mjs`, `docs/manutencao/04-modelo-de-dados.md`, `docs/` (roteiro de publicar a função, que já existe para `arquivos-no-drive`).

---

## Tarefa 1: Testes de banco antes da migração (critério 1 do ticket)

Referência: spec, tabela "Regras que o banco impõe" (linhas do relatório numerado, da versão aprovada e do evento).

- [ ] Ler `supabase/tests/29`, `30` e `57` para copiar o padrão (`plan(N)`, `_tap`, usuários fictícios, `pg_temp.arquivo`).
- [ ] `29_relatorio_depois` reescrito para `29_relatorio_numerado` (mantém o número do arquivo): relatório sozinho com a V8 mais recente fica ligado à V8 e recebe o Relatório V1; o seguinte, V2; segundo relatório na mesma versão aceito; relatório junto com a versão em sequência recebe o próximo número; o primeiro relatório do processo é V1 mesmo que a histórica tenha relatório; `.pdf` recusado (`relatorio_so_docx`); relatório sem versão piloto nem em sequência recusado (`relatorio_sem_versao`), só com a histórica também; relatório ligado à piloto aceito; relatório depois da Revisão interna recusado (`relatorio_fora_da_etapa`) e na técnica e na Revisão interna aceito; número da prévia errado recusado (`numero_do_relatorio_mudou:N`) e versão da prévia errada (`numero_da_versao_mudou:N`); `numero_do_relatorio` não alterável (insert e update direto com a coluna recusados, `42501`); outra versão não recebe relatório pelo insert direto (`relatorio_fora_da_versao_mais_recente`); dois processos têm numerações independentes (subprocesso sem herdar do pai); Consulta e visitante recusados; processo suspenso/cancelado/concluído recusado; evento `enviar_relatorio` com o rótulo da versão e o número (1 por envio sozinho, nenhum para o junto); `acrescentar_relatorio`, `registrar_sem_alteracao` e `origem_do_relatorio` não existem mais; coluna `copiado_de` não existe mais.
- [ ] `30_substituir_arquivo`: o relatório numerado se substitui (mesmo `.docx`), o ligado à versão aprovada não (`versao_aprovada:N`), o relatório antigo em `.pdf` se substitui por `.pdf` e não por `.docx`; trocar `acrescentar_relatorio`/`pdf` pelas chamadas novas.
- [ ] `37`, `40`, `41`, `49`, `50`, `55`, `57`: trocar `acrescentar_relatorio(versao, numero, arquivo)` por `enviar_relatorio(processo, numero_da_versao, numero_do_relatorio, arquivo)` com `docx`; no `57`, o caso do relatório vira prova de que `acrescentar_arquivo` recusa o relatório (`papel_nao_acrescentavel`, já existe) e o caso do evento `acrescentar_relatorio` sai. Rodar `grep -rn "acrescentar_relatorio\|registrar_sem_alteracao\|origem_do_relatorio\|copiado_de" supabase/tests` antes e depois.
- [ ] `58_relatorio_numerado_migracao`: monta, **antes** do trecho de numeração, versões e relatórios antigos (docx em versões não históricas, o `.pdf`, o relatório da histórica, uma cópia `copiado_de`) e confere o que a migração faz. Como o pgTAP roda depois da migração, o teste chama a função `private.numerar_relatorios_antigos()` (a que a migração usa; idempotente) sobre linhas inseridas com `session_replication_role = replica`: números na ordem do envio por processo, `.pdf` e histórica sem número, processos independentes. A prova de que as cópias saem e a coluna some é do teste `29`.
- [ ] Commit só dos testes (`git add supabase/tests`), `git push` da branch e disparar o workflow "Testes de banco" na branch. **Esperado: vermelho** pelo motivo certo (função/coluna inexistente). Registrar o número da execução em `desvios.md`.

## Tarefa 2: Migração (critério 1 do ticket)

- [ ] `npx supabase migration new relatorio_numerado`; conferir que o horário é posterior a `20261026103000` (senão escolher à mão).
- [ ] Ler antes de cada `create or replace`/`drop`: `20261016020123` (`versao_anterior`, `conferir_copia_do_relatorio`, `conferir_arquivo_novo`, `preparar_arquivo_da_versao`, `registrar_evento_do_relatorio`, `origem_do_relatorio`, `acrescentar_relatorio`, `registrar_sem_alteracao`), `20261026103000` (versão atual de `preparar_arquivo_da_versao`, `registrar_evento_do_relatorio`, `registrar_versao`), `20261019224928` (`bloquear_troca_em_versao_aprovada`), `20261015224928` (RLS e `grant` de `arquivos_da_versao`).
- [ ] Escrever, nesta ordem: coluna `arquivos_da_versao.numero_do_relatorio integer` (sem `grant` de inclusão nem alteração); `private.numerar_relatorios_antigos()` e a chamada dela; `set local session_replication_role = replica` em volta do apaga-cópias e da numeração; `delete` das linhas com `copiado_de`; `alter table drop column copiado_de`; `alter table drop constraint arquivos_um_por_papel` + `create unique index arquivos_um_por_papel ... where numero_do_relatorio is null`; `drop function` de `acrescentar_relatorio`, `registrar_sem_alteracao`, `origem_do_relatorio`, `private.versao_anterior`, `private.conferir_copia_do_relatorio`, `private.conferir_arquivo_novo` (e recriar a que ainda se usa, sem cópia); `private.conferir_onde_cabe_a_versao` ganha o tipo `relatorio` (`relatorio_fora_da_etapa`); `private.preparar_arquivo_da_versao` (decisão 3); `private.registrar_evento_do_relatorio` (decisão 5; sai o ramo `sem_alteracao`); `public.enviar_relatorio` (decisão 1); `public.registrar_versao` com `p_numero_do_relatorio` (decisão 2, `drop` da assinatura de 4 parâmetros); `revoke`/`grant` de cada função nova.
- [ ] A migração é **destrutiva só em dados inventados** (linhas de "sem alteração" e a coluna `copiado_de`); registrar no `desvios.md`.
- [ ] `git push` e "Testes de banco" na branch: **todos os arquivos verdes**, inclusive `00_rls_ligada`, `10_privilegios_padrao` e `46_funcoes_e_views_seguras`. Se algum teste de outro ticket quebrar pelo `.docx`/numeração, ajustar o teste (mecânico) ou parar e perguntar se o motivo não for esse.

## Tarefa 3: Aplicar no desenvolvimento e regenerar os tipos

- [ ] Conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`: desenvolvimento). Disparar o workflow "Migrar banco de desenvolvimento" na branch com o nome da migração (autorizado no CLAUDE.md) e ler o resultado.
- [ ] `npm run db:types` (contra o remoto, que agora tem a migração). Se o arquivo vier "modificado" só por quebra de linha, `git add`.
- [ ] `npm run typecheck`: acusa `copiado_de`, `acrescentar_relatorio`, `registrar_sem_alteracao` e demais uso antigo no front; esse é o roteiro das Tarefas 4 a 7 (não remendar aqui).
- [ ] Commit: migração + testes ajustados + tipos (regra do mesmo commit). Atualizar a lista de migrações em `supabase/AMBIENTES.md`.

## Tarefa 4: Função do servidor (critério 3 do ticket)

Teste primeiro, visto falhar, em `supabase/functions/_shared/*.test.ts` (Vitest).

- [ ] `nomePadrao.test.ts` + `nomePadrao.ts`: `DadosDoNome` ganha `numeroDoRelatorio?: number`; `nomePadrao({sigla:'CEE', numero:8, tipo… papel:'relatorio', numeroDoRelatorio:3, extensao:'docx'})` devolve `CEE_V8_Nome do processo_Relatório V3.docx`; com piloto, `CEE_V6P_…_Relatório V1.docx`; sem número (histórica), `_Relatório` como hoje; número do relatório inválido (0, fração) lança erro com o valor e o formato esperado.
- [ ] `decisao.test.ts` + `decisao.ts`: sai `sem_alteracao` de `Acao` e de `PERFIS_POR_ACAO` (a ação `sem_alteracao` passa a ser `entrada_invalida`); `EntradaIniciarEnvio` ganha `numeroDoRelatorio: number | null`; `validarIniciarEnvio` lê `numero_do_relatorio` (inteiro positivo, opcional) e exige: presente no relatório de versão que não é histórica e sem `arquivo_id`; ausente em qualquer outro papel e na histórica; relatório novo só `.docx` (`extensao_nao_aceita` com "recebido .pdf; esperado .docx"); relatório da histórica e substituição aceitam `.docx` e `.pdf`; provas por perfil mantidas.
- [ ] `registro.test.ts` + `registro.ts`: `EntradaRegistrar` ganha `numeroDoRelatorio`; modo "relatório sozinho" (sem `versao_id` nem `arquivo_id`, sem histórica, um arquivo só, papel relatório, com `numero_do_relatorio`); relatório junto com a versão (`arquivos` com o relatório e `numero_do_relatorio`); `versao_id` agora aceita só `png`/`bpmn`; `funcaoDoBancoPara` devolve `'enviar_relatorio'` (some `'acrescentar_relatorio'`); `parametrosDoBanco` monta `p_processo/p_numero_da_versao/p_numero_do_relatorio/p_arquivo` e o `p_numero_do_relatorio` do `registrar_versao`; `conferirArquivosNoDrive` confere que o nome traz `Relatório V{r}` e só `.docx` no relatório numerado; `recusaDoBanco`/`statusDaRecusaDoBanco` cobrem `numero_do_relatorio_mudou`, `relatorio_so_docx`, `relatorio_sem_versao`, `relatorio_fora_da_etapa`, `relatorio_fora_da_versao_mais_recente`.
- [ ] `substituicao.test.ts`: provas do relatório numerado (substituir aceito; ligado à versão aprovada recusado pelo mesmo caminho do ADR 0011).
- [ ] Apagar `_shared/semAlteracao.ts`, `semAlteracao.test.ts` e `arquivos-no-drive/semAlteracao.ts`; `index.ts` perde o ramo e a mensagem da ação desconhecida diz "iniciar_envio, baixar, registrar ou conferir".
- [ ] `arquivos-no-drive/acoes.ts` (`nomeDoArquivo` leva `numeroDoRelatorio`) e `registrar.ts` (o relatório sozinho não tem alvo: passa pela conferência do rótulo da versão da prévia e do número do relatório; `gravar` chama `enviar_relatorio`).
- [ ] `npx vitest run supabase/functions` verde; commit.

## Tarefa 5: Funções puras do front (critério 4 do ticket)

Teste primeiro, visto falhar.

- [ ] `tipos.ts`: `ArquivoDaVersao` troca `copiadoDe` por `numeroDoRelatorio?: number`.
- [ ] `relatorioQueVale.test.ts` + `relatorioQueVale.ts` (decisão 10): `relatoriosDaVersao(versao, todas)` devolve `{ arquivo, rotulo, daVersao: string | null }[]`. Casos: versão com o próprio ("Relatório V2", `daVersao` nulo); duas na mesma versão ("Relatório V2", "Relatório V3"); sem o próprio, o último das anteriores ("Relatório V2", `daVersao: 'V7'`); antes do primeiro, vazio; histórica com relatório ("Relatório da V5F"); histórica não vale para a seguinte; .pdf antigo ("Relatório .pdf") na versão a que pertence e não vale adiante; relatório ligado à piloto vale para a em sequência seguinte ("Relatório V1 (da V6P)"); `proximoNumeroDoRelatorio(versoes)` = maior número + 1 (sem nenhum, 1).
- [ ] `rotulos.test.ts` + `rotulos.ts`: saem `relatorioPendente`, `versoesComRelatorioPendente`, `podeCopiarRelatorio`, `origemDoRelatorio`, `rotuloDaAnterior`; `rotuloCurtoDoArquivo` do relatório numerado devolve "Relatório V2"; `ROTULO_DO_PAPEL.relatorio` e `ACCEPT_DO_PAPEL.relatorio` passam a "Relatório (.docx)" / ".docx" no relatório novo, mantendo `.docx,.pdf` para o da histórica (função `acceptDoRelatorio(historica)`); `emOrdemDeExibicao` mantém png, bpm, relatório, bpmn.
- [ ] `formularioDeVersao.test.ts` + `formularioDeVersao.ts`: papéis do formulário por modo (piloto: `bpm`, `png`, `bpmn`; em sequência: mais o relatório; histórica: todos); `nomeNaPrevia` aceita `numeroDoRelatorio`; `previaDoRelatorio(versaoMaisRecente, numeroDoRelatorio)` devolve "Relatório V3, acompanha a V8"; `podeAcrescentarRelatorio` fica `podeEnviarRelatorio` (só o arquivo escolhido e nenhuma recusa); `textoDaFalhaDoRelatorio` mantém.
- [ ] `conferenciaDosArquivos.test.ts` + `.ts`: `conferirArquivo(papel, arquivo, { relatorioSoDocx })`: `.pdf` no relatório novo recusado com "Escolha um arquivo .docx. Recebido: .pdf."; na histórica, `.docx` ou `.pdf`; ajustar `useArquivosDaVersao` para receber a opção.
- [ ] `recusasDeVersoes.test.ts` + `recusasDeVersoes.ts`: frases novas ("Escolha um arquivo .docx…" quando o banco recusa, "Outra pessoa enviou um relatório enquanto você enviava; este seria o Relatório V{n}. Envie de novo.", "Não há versão para receber o relatório: envie a versão piloto ou uma versão primeiro.", "O relatório só pode ser enviado até a Revisão interna.", "O relatório precisa acompanhar a versão mais recente."); saem `relatorio_ja_existe`, `versao_anterior_sem_relatorio`, `copia_*` e `FALHA_DA_COPIA`.
- [ ] `historicoDosCadastros.ts` + `historicoDasVersoes.test.ts`: `enviar_relatorio: 'Enviou o Relatório'` e `textoDoEvento` devolve "Enviou o Relatório V3 (acompanha a V8)" (de `depois.numero_do_relatorio` e `depois.rotulo`); `acrescentar_relatorio`/`sem_alteracao` mantêm o texto; `relatorio_de` fica no mapa de rótulos (eventos antigos); `numero_do_relatorio: 'Número do relatório'`.
- [ ] `npx vitest run src/versoes src/cadastros` verde; commit.

## Tarefa 6: Módulo real e falso (critério 3 do ticket)

- [ ] `tipos.ts`: `PedidoDeVersao` ganha `numeroDoRelatorio?: number` (relatório junto); `acrescentarRelatorio` vira `enviarRelatorio(pedido: { processoId, numeroDaVersao, piloto, numeroDoRelatorio, arquivo }, aoProgredir)` (`PedidoDeRelatorio` muda); some `semAlteracaoDeConteudo` e `PedidoDeRelatorio.versaoId`.
- [ ] `versaoDaLinha.ts`: `COLUNAS_DA_VERSAO` troca `copiado_de` por `numero_do_relatorio`.
- [ ] `versoesSupabase.test.ts` + `versoesSupabase.ts` (cliente e `fetch` simulados): `enviarRelatorio` pede a sessão com `numero_do_relatorio` e registra sem `versao_id`; `enviarVersao` com relatório junto manda o `numero_do_relatorio`; saem o teste e a função do `sem_alteracao`; as frases das recusas novas chegam traduzidas.
- [ ] `VersoesFalso.test.ts` + `VersoesFalso.ts`: `enviarRelatorio` imita o banco (liga à mais recente que não é histórica, numera por processo, recusa `.pdf`, sem versão, etapa depois da Revisão interna, prévia mudada), gera o evento `enviar_relatorio`; o relatório junto numera; saem `acrescentarRelatorio`, `semAlteracaoDeConteudo`, `conferirRelatorioNovo`, `relatorioDaAnterior`; recusa o envio do `.pdf` na versão que não é histórica.
- [ ] `src/testes/versoesDeTeste.ts` (arquivo de teste com `numeroDoRelatorio` quando for o caso); `npx vitest run src/versoes` verde; commit.

## Tarefa 7: Telas (critérios 2 e 5 do ticket)

Os testes de tela da Tarefa 8 vêm antes de cada alteração desta tarefa; escrever o teste, ver falhar, depois o componente.

- [ ] `SecaoDeVersoes.tsx`: [Enviar relatório] ao lado de [Enviar versão] na técnica e na Revisão interna (e só quando há versão piloto ou em sequência; sem versão, o botão fica de fora); abre e fecha pelo mesmo botão e rola (como o do envio); some `itensRaros`/o menu "Mais ações dos arquivos" de relatório e o `Aberto` `{tipo:'relatorio'}` passa a abrir o `FormularioDeRelatorio` novo.
- [ ] `FormularioDeRelatorio.tsx`: sem a escolha da versão; só o campo do `.docx`; prévia "Relatório V3, acompanha a V8" e o nome `CEE_V8_Nome do processo_Relatório V3.docx`; botão [Enviar] desabilitado enquanto falta o `.docx`; falha em vermelho sem perder o arquivo (como hoje).
- [ ] `FormularioDeVersao.tsx`: campo do relatório (`.docx`) só no modo em sequência, com a prévia do nome e o número que vai receber; o pedido leva `numeroDoRelatorio`; some o relatório do modo piloto; a histórica mantém o campo (`.docx`/`.pdf`, sem número).
- [ ] `VersaoEmDestaque.tsx` e `ListaDeVersoes.tsx`: a linha dos arquivos usa `relatoriosDaVersao` ("Relatório V2", "Relatório V2 (da V7)", "Relatório da V5F"); saem a pílula "falta relatório", "Relatório pendente", o espaço tracejado [+ Acrescentar relatório], `AcaoSemAlteracao`, `origem` e a classe `arquivo-origem`; [Substituir] nos relatórios numerados da própria versão (não nos "da V7" nem na histórica nem na versão aprovada); apagar `AcaoSemAlteracao.tsx`.
- [ ] CSS ao lado (`VersaoEmDestaque.css`, `Versoes.css`): a linha do relatório "Relatório V2 (da V7)" sem quebrar a linha dos arquivos; só tokens do projeto; some o CSS das classes removidas.
- [ ] `npm run lint` e `npm run typecheck` verdes; commit.

## Tarefa 8: Testes de tela com o aplicativo inteiro (critério 2 do ticket)

Em `src/`, renderizando o App com as falsas nomeadas.

- [ ] `App.relatorioDepois.test.tsx` reescrito: relatório sozinho com a prévia "Relatório V3, acompanha a V8" e o nome; `.pdf` recusado com a frase; dois relatórios na mesma versão ("Relatório V2", "Relatório V3" na V8); relatório junto com a versão em sequência (e recebe o próximo número); o relatório que vale com "(da V7)"; nenhuma marca de pendência nem [Sem alteração de conteúdo]; "Relatório da V5F" na histórica; o `.pdf` antigo como está; [Substituir] no relatório numerado e nenhum no ligado à versão aprovada; Consulta sem [Enviar relatório] nem [Substituir]; processo suspenso sem envio; formulário abre/fecha pelo mesmo botão; eventos "Enviou o Relatório V3 (acompanha a V8)" e os antigos ("Acrescentou o relatório à versão", "Marcou sem alteração de conteúdo na versão") no histórico.
- [ ] Ajustar sem apagar a prova de comportamento: `App.arquivosDoVerso`, `App.versoesNoProcesso`, `App.enviarVersao`, `App.substituirArquivo`, `App.versoesNoHistorico`, `App.agoraDoVerso`, `App.versaoPiloto`, `App.acrescentarArquivo`, `App.editarRegistros`, `App.registrarRevisao`, `JanelasDeEdicao.test` e os que usam "sem alteração", "relatório pendente" ou `acrescentarRelatorio`/`semAlteracaoDeConteudo` (`grep -rln` antes e depois).
- [ ] `npm test` verde; commit.

## Tarefa 9: Fechamento

- [ ] `scripts/prova-do-drive.mjs`: tirar `sem_alteracao` e `copiado_de`, usar o relatório numerado (não rodar contra o Drive; registrar que não foi rodado). `docs/manutencao/04-modelo-de-dados.md`: `numero_do_relatorio`, a unicidade parcial e a saída de `copiado_de`.
- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:circular` verdes; "Testes de banco" verde na branch depois do último push (conferir o número da execução).
- [ ] `desvios.md` (entrada datada): execuções vermelha e verde, decisões de execução acima, o que ficou presumido (o critério `[visual]`: a tela só se vê no app real com a função publicada), códigos de recusa novos, a migração destrutiva, o selo "Relatório pendente" do cartão e a coluna `ultima_versao_tem_relatorio` que seguem como estão (e a linha correspondente em `.scratch/backlog.md`).
- [ ] Roteiro para o usuário (no fim do relatório e em `.scratch/proximo-passo.md`): publicar a função `arquivos-no-drive` no desenvolvimento (`npx supabase functions deploy arquivos-no-drive --use-api --project-ref yclkzyoebpsxmgpbcbus`, modelo em `docs/drive-conta-de-servico.md` seção 4) e conferir na tela o critério `[visual]` do ticket.
- [ ] Conferir os critérios do ticket um a um; marcar as caixas do ticket.

## Cobertura dos critérios do ticket

| Critério | Tarefa |
|---|---|
| 1 pgTAP antes da migração (e o `29` reescrito, o `30` ajustado) | 1 e 2 |
| 2 testes de interface com o aplicativo inteiro | 8 |
| 3 arquivo puro da função, nome padrão, módulo real | 4 e 6 |
| 4 função pura do relatório que vale | 5 |
| 5 `[visual]` | 7 (presumido até o usuário ver na tela) |
