# Plano do ticket 07 — Duas revisões

> **Para quem executa:** skill `superpowers:executing-plans`, tarefa por tarefa; as caixas (`- [ ]`) são o registro da execução e se marcam com a ferramenta de edição, no commit da tarefa.

**Objetivo:** a Revisão interna vira Revisão do fluxograma, e entra a Revisão do relatório logo depois dela, cada uma com seu [Registrar revisão] e seu [Enviar versão].

**Como:** duas migrações (etapa e limite de envio; registro da revisão), cada uma com teste pgTAP que falha antes, aplicada no banco local do Docker, e os tipos gerados dele; depois a interface, de dentro para fora: funções puras, módulos de acesso (real e falso), componentes.

**Requisitos:** `.scratch/revisoes-aprovacao/spec.md`, seção "Duas revisões" (critérios 1 a 20, "Decisões de implementação", "Quem pode o quê", "Regras que o banco impõe", "Testes de banco antigos que podem quebrar" e "Decisões novas"). ADR 0046. O plano só cita.

## Restrições que valem em todas as tarefas

- Regras de banco que valem (`.claude/regras/banco.md`): a estrutura muda só por migração nova, criada com `npx supabase migration new` e sempre por último na pasta (depois de `20261110000447_importar_versao`); função `security definer` só em `private`, com `search_path = ''`; coluna nova de junção ganha índice na mesma migração; cada célula de "Quem pode o quê" tem teste com administrador, integrante, consulta, inativo e visitante; nenhum `select *` novo nas funções de acesso; migração não destrutiva (sem `drop table`, `drop column`, `rename` de coluna ou de tabela).
- Ciclo do banco (ajuste de 2026-10-24): Docker local. `npx supabase start > /dev/null 2>&1` (a saída traz chaves), `npx supabase db reset > /dev/null`, `npx supabase test db` (conte as linhas `ok` e `not ok`; o "FAIL" é do formato), `npx supabase gen types --local --lang typescript > src/types/database.ts`. O workflow "Testes de banco" roda na branch no fim (Tarefa 9).
- O código interno `revisao_interna` e a tabela `revisoes_internas` ficam (fora do escopo).
- Nenhuma tela diz mais "Revisão interna" (critério 1). A frase da importação (`COLUNAS.revisaoInterna = 'Revisão Interna'`) é o cabeçalho da planilha e fica.
- Convenções: funções de 4 a 20 linhas, arquivos de até 300 linhas, sem `any`; lint antes de cada commit (`npx eslint src supabase/functions`); commits por caminho (`git add <arquivos>`).
- O jsdom não tem `HTMLDialogElement.showModal` completo: as janelas do verso já usam o `JanelaDeEdicao` testado; nenhum componente nativo novo entra.

## Arquivos

- Banco: `supabase/migrations/<hora>_duas_revisoes_etapas.sql`, `supabase/migrations/<hora>_duas_revisoes_registro.sql`, `supabase/tests/76_duas_revisoes_etapas.test.sql`, `supabase/tests/77_duas_revisoes_registro.test.sql`; ajustes nos testes antigos da lista da spec; `src/types/database.ts`.
- Códigos e nomes: `src/processos/codigosDasEtapas.ts`, `src/processos/iconeDaEtapa.ts`, `src/components/Icone.tsx` (ícone novo), `src/processos/CatalogoFalso.ts`, `src/importacao/colunasDaPlanilha.ts`, `src/versoes/recusasDeVersoes.ts`, `src/versoes/regrasDoFalso.ts`, `src/revisoes/frasesDeRevisao.ts`.
- Envios: `src/versoes/rotulos.ts`, `src/versoes/formularioDeVersao.ts`, `src/components/versoes/FormularioDeVersao.tsx`, `src/components/versoes/SecaoDeVersoes.tsx`, a confirmação do Substituir (`src/components/versoes/FormularioDeSubstituicao.tsx` ou `AcaoSubstituir.tsx`).
- Leitura do processo: `src/processos/tipos.ts` (`UltimoRelatorio`), `src/processos/lerProcessoSupabase.ts`, o falso de processos.
- Registro: `src/revisoes/tipos.ts`, `versoesDaRevisao.ts`, `opcoesDaRevisao.ts`, `rascunhoDaRevisao.ts`, `revisoesSupabase.ts`, `RevisoesFalso.ts`, `eventoDaRevisao.ts`; `src/processos/acaoPrincipalDaEtapa.ts`, `agoraDoProcesso.ts`; `src/cadastros/historicoDosCadastros.ts`; componentes `JanelaDeRegistroDaRevisao.tsx`, `JanelaDaRevisao.tsx`, `CamposDaRevisao.tsx`, `RegistrosDoAgora.tsx`, `RevisoesDaEtapa.tsx`, `DetalheDaEtapa.tsx`, `AcaoPrincipalDoVerso.tsx`, `CorpoDoAgora.tsx`.

---

### Tarefa 1: Banco — a etapa nova e o limite de envio

Critérios 1 e 2 (banco), 8; "Modelo de dados", itens `etapas` e "Até onde se envia"; linhas "Versão em sequência e relatório até a Revisão do relatório" e "Revisão do relatório não se desativa nem se exclui" das regras; células de `etapas` em "Quem pode o quê".

- [ ] Ligar o Docker local (`npx supabase start`, saída descartada) e conferir que `supabase/.temp/project-ref`, se existir, é o de desenvolvimento.
- [ ] Escrever `supabase/tests/76_duas_revisoes_etapas.test.sql`, no formato do 39 (`_tap`, `plan(n)`, usuários a1 a a4 inventados), com: o nome "Revisão do fluxograma" no código `revisao_interna`; `revisao_relatorio` existe, ativa, fase VI, sem responsável inicial, com ordem = a de `revisao_interna` + 1 e menor que a de `revisao_setor`; administrador renomeia e reordena; integrante e consulta não; ninguém desativa nem exclui (`etapa_protegida`); versão em sequência e relatório aceitos com o processo na Revisão do relatório e recusados na Validação com o setor (`versao_fora_da_etapa`, `relatorio_fora_da_etapa`).
- [ ] Rodar `npx supabase test db` e ver o 76 falhar (etapa inexistente).
- [ ] `npx supabase migration new duas_revisoes_etapas`; na migração: o `update` do nome; o deslocamento das ordens maiores que a de `revisao_interna`, em ordem decrescente (o `unique (ordem)`), e o `insert` da etapa nova; `create or replace` de `private.bloquear_etapa_protegida` com `revisao_relatorio` na lista; `create or replace` de `private.conferir_onde_cabe_a_versao` igual à da `importar_versao`, trocando o limite para a ordem de `revisao_relatorio`. Comentário de topo: o que faz, ADR 0046, não destrutiva.
- [ ] `npx supabase db reset > /dev/null` e `npx supabase test db`: o 76 passa. Corrigir os antigos que quebrarem pela etapa nova (lista da spec: 22, 54, 42, 74, 75; conferir também 20, 29, 38, 52, 53, 56, 59, 60, 73), sem mudar o que cada teste prova.
- [ ] Bateria inteira sem `not ok`.
- [ ] Gerar os tipos do banco local; `npm run typecheck`.
- [ ] Commit: migração, teste 76, testes ajustados, `src/types/database.ts`, esta caixa.

### Tarefa 2: Banco — o registro da revisão nas duas etapas

Critérios 9, 10, 11 (o banco aceita o autor), 13 (as antigas contam como do fluxograma), 16 (o evento leva a etapa), 17 (suspenso e cancelado); "Modelo de dados", itens `revisoes_internas` e "O que o gatilho preenche"; as demais linhas das regras; células de `revisoes_internas`; "Decisões novas" 2, 3 e 4.

- [ ] Escrever `supabase/tests/77_duas_revisoes_registro.test.sql`: ler as duas revisões (administrador, integrante, consulta sim; inativo e visitante não); registrar na Revisão do relatório (administrador e integrante sim; consulta, inativo e visitante não); incluir ou alterar com `escopo` recusado por privilégio (42501); Validação com o setor recusada (`revisao_fora_da_etapa`); "sem alteração" na Revisão do relatório liga o relatório de maior número e a versão dele, e sem relatório numerado é recusada (`sem_relatorio`); "corrigida" com só relatório enviado na passagem → `relatorio`, com relatório e `.bpm` → `ambos`, só versão (na do fluxograma) → `fluxograma`, só relatório na do fluxograma → `relatorio`, nada → recusada (`corrigida_sem_envio_na_passagem`); segunda revisão na mesma passagem da Revisão do relatório recusada (`revisao_ja_registrada`); trocar o resultado pela edição recalcula escopo, versões e relatórios; o evento "registrar" e o "editar" levam `etapa` (`revisao_relatorio` ou `revisao_interna`) e os relatórios como "Relatório V2"; processo suspenso e cancelado recusados.
- [ ] Rodar e ver o 77 falhar.
- [ ] `npx supabase migration new duas_revisoes_registro`; na migração: colunas `relatorio_revisado_id` e `relatorio_corrigido_id` (referência a `arquivos_da_versao`, opcionais) com índice; `revoke insert, update` da tabela e `grant insert (processo_id, resultado, comentario)` e `grant update (resultado, comentario)`; a restrição `revisoes_corrigida_completa` trocada por uma que aceite a "corrigida" com versão corrigida ou relatório corrigido (a antiga sai com `drop constraint`, que não apaga dado); `private.conferir_revisao_interna_em_andamento` aceitando as duas etapas (o nome fica, com comentário); a etapa da passagem (`passagem_id` → `passagens.etapa_id`) decide as regras em `private.preparar_versoes_da_revisao`, dividida em funções pequenas (sem alteração no fluxograma, sem alteração no relatório, corrigida), que também preenchem o escopo; `private.preparar_revisao_interna` e `private.preparar_edicao_da_revisao` sem as recusas de escopo; `private.estado_da_revisao` com `etapa`, `relatorio_revisado` e `relatorio_corrigido`; o evento da edição com os relatórios de antes; o gatilho de edição disparando também quando o escopo muda pelo recálculo.
- [ ] O relatório "enviado nesta passagem" é o numerado com `enviado_em` desde `entrou_em` (spec). O Substituir regrava `enviado_em`: o caso fica como a spec diz e entra em `desvios.md` como achado (relatório substituído na passagem conta como enviado), sem regra nova.
- [ ] Reset, bateria: o 77 passa; ajustar o 39 e o 41 (escopo deduzido em vez de gravado; frases de recusa novas), sem mudar o que provam.
- [ ] Bateria inteira sem `not ok`; tipos; `npm run typecheck` (o `revisoesSupabase.ts` ainda manda `escopo`: o tipo de inclusão sai na Tarefa 6; se o typecheck barrar, a Tarefa 6 começa antes do commit, no mesmo commit só o necessário para compilar).
- [ ] Commit: migração, teste 77, 39 e 41 ajustados, tipos, esta caixa.

### Tarefa 3: Nomes, catálogo, ícone e importação

Critérios 1, 2 (vitrine), 15, 18 (o ícone existe; o desenho se confere no `/polir`); frases das recusas de envio (critério 8, na tela).

- [ ] Testes que falham: `iconeDaEtapa.test.ts` (o código `revisao_relatorio` tem ícone próprio, diferente do genérico e do da Revisão do fluxograma); `CatalogoFalso.test.ts` (a etapa nova no lugar certo, protegida, e o nome "Revisão do fluxograma"); `lerPlanilha.test.ts` ou o teste de `colunasDaPlanilha` (a última coluna "Revisão Interna" leva a `revisao_relatorio`, com o nome "Revisão do relatório"); `recusasDeVersoes.test.ts` (as frases dizem "até a Revisão do relatório").
- [ ] Implementar: `CODIGO_DA_REVISAO_DO_RELATORIO = 'revisao_relatorio'` em `codigosDasEtapas.ts`; o ícone `etapaRevisaoRelatorio` em `Icone.tsx`, no traço dos outros; o mapa de `iconeDaEtapa.ts`; `CatalogoFalso.ts` (etapa e `PROTEGIDAS`); `colunasDaPlanilha.ts` (`SEQUENCIA_DE_ETAPAS` e `NOME_DA_ETAPA`); `recusasDeVersoes.ts`; `regrasDoFalso.ts` (o limite do envio no falso); os falsos de processos e o cenário da vitrine onde a etapa nova precisar entrar; `planilhasExemplos.ts` só se o `planilhasFases.test.ts` mostrar que a fase VI muda a contagem.
- [ ] `grep -rn "Revisão interna\|revisão interna" src --include=*.ts --include=*.tsx` sem ocorrência fora de comentário e de teste; as frases que restarem (revisão) são da Tarefa 6.
- [ ] Testes do arquivo, `npx vitest run src/processos src/importacao src/versoes`, typecheck, lint; commit.

### Tarefa 4: Envios por etapa e formulário da Revisão do relatório

Critérios 3, 4, 5, 6, 7 e 20 (o texto do formulário; a altura se confere na Tarefa 9).

- [ ] Testes que falham: `rotulos.test.ts` (`envioDaEtapa('revisao_relatorio', …)` é `'sequencia'`; `podeEnviarRelatorioNaEtapa('revisao_relatorio', …)` é falso; técnica e fluxograma como hoje); `formularioDeVersao.test.ts` (no modo da Revisão do relatório, sem relatório não submete, só com relatório submete, `.png` sem `.bpm` não conta); `App.enviarVersao.test.tsx` (na Revisão do relatório: só o relatório chama `enviarRelatorio` com o próximo número e não `enviarVersao`; relatório com `.bpm` chama `enviarVersao` com o relatório junto; o campo `.png` fica desligado sem `.bpm`, com a frase do que falta; não há [Enviar relatório]; na Revisão do fluxograma o formulário é o de hoje).
- [ ] Implementar: o modo `{ tipo: 'sequencia', …, revisaoDoRelatorio: true }` (ou campo equivalente no `ModoDoFormulario`) criado por `modoParaEnviar` quando a etapa é a Revisão do relatório; `podeSubmeter` com a regra do modo; o `FormularioDeVersao` com a dica ("O relatório é obrigatório; o .bpm e o .png são opcionais. O .png só vai junto com o .bpm."), o `.bpm` sem obrigatório e o `.png` desligado sem `.bpm`, e, ao enviar sem `.bpm`, o `enviarRelatorio` do módulo (nenhum caminho novo até o Drive); a prévia do número diz o relatório quando não há `.bpm`. `SecaoDeVersoes` passa a etapa para `modoParaEnviar`.
- [ ] Testes, typecheck, lint; commit.

### Tarefa 5: A leitura do processo traz o relatório mais recente

Base dos critérios 9 a 12 (o que a tela precisa saber antes de registrar).

- [ ] Testes que falham em `lerProcessoSupabase.test.ts`: `ultimoRelatorio` com número, autor, número do anterior e `enviadoNestaPassagem` (enviado desde a entrada na passagem aberta); `enviadaNestaPassagem` da versão vale quando a etapa da versão é a da passagem aberta (nas duas revisões), não só na Revisão interna; sem relatório numerado, `ultimoRelatorio` é null.
- [ ] Implementar: o tipo `UltimoRelatorio = { numero; autorId; autorNome; anterior?: number; enviadoNestaPassagem: boolean }` e `ultimoRelatorio: UltimoRelatorio | null` em `ProcessoLido`; a leitura (uma consulta a `arquivos_da_versao` com `numero_do_relatorio` não nulo, pelas versões do processo, as duas de maior número, colunas nomeadas); a passagem aberta lida uma vez e usada pelas duas; o falso de processos e os montadores de processo dos testes (`src/testes/`) com `ultimoRelatorio: null` por padrão.
- [ ] Testes, typecheck (a propriedade nova é obrigatória: filtrar também `*.test.tsx` e `src/testes/`), lint; commit.

### Tarefa 6: As regras da revisão nas funções e nos módulos

Critérios 9, 10, 11, 12, 13, 16 (funções puras e módulos de acesso).

- [ ] Testes que falham: `opcoesDaRevisao.test.ts` (no fluxograma, "Sem alteração: vale para a V7"; na do relatório, "Sem alteração: vale para o Relatório V1"; "Corrigida: a V8 corrige a V7", "Corrigida: o Relatório V2 corrige o Relatório V1" e as duas frases juntas; desabilitada com "Nada foi enviado desde que o processo entrou nesta etapa."; o aviso do autor na janela compara com o autor do relatório na do relatório); `agoraDoProcesso.test.ts` (o aviso amarelo "Ana M. enviou o Relatório V1; a revisão do relatório deveria ser de outra pessoa." e o do fluxograma com o nome novo); `acaoPrincipalDaEtapa.test.ts` (`registrar_revisao` nas duas etapas; nenhuma sem o que revisar); uma função `semOQueRevisar(processo)` que devolve "Sem versão para revisar." / "Sem relatório para revisar." / null; `rascunhoDaRevisao.test.ts` (sem escopo); `revisoesSupabase.test.ts` (não envia `escopo`; lê os relatórios e a etapa da passagem; a revisão antiga sem passagem é do fluxograma); `RevisoesFalso.test.ts` e `.registrar.test.ts` (as duas etapas, escopo deduzido); `historicoDasRevisoes.test.ts` ("Registrou a revisão do relatório", "Editou a revisão do fluxograma"; o evento antigo sem `etapa` fica "Registrou a revisão"); `frasesDeRevisao.test.ts` (frases sem "Revisão interna").
- [ ] Implementar: `RevisaoInterna` ganha `etapa: 'revisao_interna' | 'revisao_relatorio'`, `relatorioRevisado` e `relatorioCorrigido` (números ou null); `DadosDaRevisao` sem escopo; `versoesDaRevisao` vira o cálculo do que a revisão liga pela etapa (versão e relatório); `opcoesDoResultado`, `avisoDoAutorDaRevisao`, `resumoDaRevisao`, `rotuloDoResultado` com as frases novas; `acaoPrincipalDaEtapa` reconhece as duas etapas e recebe o "sem o que revisar"; `avisoDoRevisor` com o relatório; `revisoesSupabase` (colunas nomeadas com a etapa da passagem e os relatórios); `RevisoesFalso`; `eventoDaRevisao` com `etapa` e relatórios; `historicoDosCadastros` escolhe o texto pela `etapa` do estado.
- [ ] Testes, typecheck, lint; commit.

### Tarefa 7: As telas das duas revisões

Critérios 9 a 13, 16, 17 e 19 (a ordem do Agora).

- [ ] Testes que falham, pela interface: `App.registrarRevisao.test.tsx` (o [Registrar revisão] na Revisão do relatório, sem campo de escopo, com as frases de relatório; "Corrigida" desabilitada com o motivo; o aviso do autor do relatório na janela, que não impede), `App.agoraDoVerso.test.tsx` ("Sem relatório para revisar." e "Sem versão para revisar." no lugar do botão, com o [Enviar versão] disponível; o aviso amarelo no Agora), `App.editarRegistros.test.tsx` (editar a revisão sem escopo; o resumo nas duas etapas), `App.etapasDoVerso.test.tsx` (a gaveta de cada revisão só com as dela; a antiga na do fluxograma), `App.versoesNoHistorico.test.tsx` ou o teste do histórico do verso (o nome da revisão no evento), Consulta sem botões e suspenso ou cancelado sem registrar (no teste do Agora ou do verso).
- [ ] Implementar: `CampoDoEscopo` sai de `CamposDaRevisao.tsx`; `JanelaDeRegistroDaRevisao` e `JanelaDaRevisao` recebem a etapa, a última versão e o último relatório; `AcaoPrincipalDoVerso` e `CorpoDoAgora` (a frase do "sem o que revisar" e o aviso); `RegistrosDoAgora` e `DetalheDaEtapa` reconhecem as duas etapas; `RevisoesDaEtapa` filtra pela etapa e mostra o relatório quando for o caso.
- [ ] Testes do verso (`npx vitest run src/App.*`), typecheck, lint; commit.

### Tarefa 8: A confirmação do Substituir

Critério 14.

- [ ] Teste que falha (o teste que já abre o Substituir, por exemplo `App.versoesNoProcesso.test.tsx` ou o do `FormularioDeSubstituicao`): a confirmação diz "Use para corrigir um arquivo enviado por engano. Para alterar o conteúdo, envie uma versão ou um relatório novo: o anterior fica guardado."
- [ ] Trocar o texto; teste, lint; commit.

### Tarefa 9: Conferência final

Critérios 18, 19 e 20 (`[visual]`) e a bateria.

- [ ] Vitrine (`preview_start` com `vitrine`): verso de um processo na Revisão do relatório e outro na do fluxograma, a 1366×768 e na largura de celular; Quadro com a coluna nova e o ícone; formulário de versão da Revisão do relatório sem passar da altura. Encerrar o servidor e fechar a pré-visualização.
- [ ] `npm test` inteiro, `npm run typecheck`, `npx eslint .`, `npx madge --circular` se o projeto o usa no pre-commit.
- [ ] `git push -u origin revisoes-aprovacao-07` e o workflow "Testes de banco" na branch (`gh workflow run "Testes de banco" --ref revisoes-aprovacao-07`, `gh run watch`); ler os "N ok" de 76 e 77.
- [ ] Registros: `desvios.md` (o achado do Substituir da Tarefa 2 e o que mais divergir da spec), o ticket com as caixas marcadas.
