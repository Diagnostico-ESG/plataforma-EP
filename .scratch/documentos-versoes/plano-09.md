# Versões por etapa (ticket 09) — plano de execução

> **Para quem executa:** use `superpowers:executing-plans` (a pedido do `/executar-complexo`). Marque as caixas (`- [x]`) à medida que cada passo termina.

**Objetivo:** cada etapa mostra só o seu envio de versão (histórica, piloto, em sequência), toda versão que não é histórica exige só o .bpm, e o .png e o .bpmn entram depois.

**Ticket:** `.scratch/documentos-versoes/issues/09-versoes-por-etapa.md`. **Spec:** `.scratch/documentos-versoes/spec.md`, seção "Arquivos por etapa (mudança de 2026-10-26)" (histórias 63 a 83, 93, 94, 107 a 110). **ADRs:** 0025 (vale) e 0011 (versão aprovada sem troca). **Branch:** `quadro-livre-parte-3` (já criada; marco `marco/2026-10-26-inicio-ticket-09-documentos-versoes`).

**Regras do banco que valem aqui** (`.claude/regras/banco.md`, lido em 2026-10-26): teste de banco antes da migração; função em `private` com `search_path` vazio e `revoke`/`grant` só a `authenticated`; view recriada com `security_invoker = true`; migração, teste de banco e tipos no mesmo commit (ver Tarefa 3); migração já aplicada não se edita; alvo conferido antes de qualquer comando de banco (vínculo atual de `supabase/AMBIENTES.md` = `yclkzyoebpsxmgpbcbus`, desenvolvimento); a Edge Function confere o chamador por conta própria e a decisão fica em arquivo puro testado no Vitest; os testes de banco rodam no GitHub Actions (autorizado no CLAUDE.md), nunca na máquina.

## Fora deste ticket (não fazer; ficam para os tickets 10 e 11)

- Relatório numerado, `numero_do_relatorio`, só .docx, "relatório que vale", saída de "relatório pendente", [Acrescentar relatório], [Sem alteração de conteúdo], `copiado_de` e a ação `sem_alteracao`: **continuam como estão** ("o envio do relatório junto da versão continua como está", ticket). Os testes `29` e `App.relatorioDepois` só mudam no que a assinatura nova de `registrar_versao` exige.
- Trava de arquivos em `mover_processo`, a view com `tem_versao_piloto`, `tem_versao_em_sequencia` e `tem_relatorio_numerado` e as janelas da trava (ticket 11).
- Data da validação e .pdf da aprovação (ticket 06 de revisoes-aprovacao).

## Decisões de execução (as que o ticket deixa abertas)

1. **Assinaturas novas**, sem `p_observacao`: `public.registrar_versao(p_processo uuid, p_numero integer, p_arquivos jsonb, p_piloto boolean default false)` e `public.registrar_versao_historica(p_processo uuid, p_numero integer, p_arquivos jsonb)`. As antigas saem com `drop function`; as novas levam `revoke ... from public, anon` e `grant ... to authenticated`.
2. **Acrescentar arquivo:** função nova `public.acrescentar_arquivo(p_versao uuid, p_arquivo jsonb)`, só para `png` e `bpmn`.
3. **Eventos novos:** ação `enviar_piloto` (entidade `versao`, estado com o rótulo `V6P`) e ação `acrescentar_arquivo` (estado com o `papel` e o rótulo da versão). O gatilho `registrar_evento_do_relatorio` passa a olhar o papel: só `relatorio` gera `acrescentar_relatorio`/`sem_alteracao`; `png` e `bpmn` inseridos depois geram `acrescentar_arquivo` (hoje ele não olha o papel; está anotado nos desvios de 2026-10-16).
4. **Onde cabe** (pela `etapas.ordem` e pelo `codigo` do catálogo): histórica só com o processo em `nao_iniciados`; piloto até a ordem de `modelagem`; em sequência até a ordem de `revisao_interna`. Etapa nova do catálogo depois da Revisão interna não aceita envio.
5. **Testes de banco que montam versão com o processo já adiante** (40, 49, 55, 37, 44 e outros) podem bater na regra "onde cabe": nesses casos a versão é registrada antes de mover o processo. Se algum teste só funciona com a versão depois do movimento, parar e me perguntar.
6. **`papeis_que_faltam`** fica na migração sem uso novo (o ticket diz "fica sem uso"); `conferir_versao_completa` e `id_da_versao_mais_recente` não são tocadas. Antes de remover qualquer coisa, conferir quem ainda a chama (`grep`).
7. O botão [Enviar relatório]/[Acrescentar relatório] do menu `⋯` fica como está (ticket 10).

## Arquivos

- Banco: `supabase/migrations/<AAAAMMDDHHMMSS>_versoes_por_etapa.sql` (nova; horário depois de `20261025194034`), `supabase/tests/27`, `28`, `29` (só a assinatura), `30`, `37`, `39`, `40`, `41`, `44`, `49`, `50`, `55` (assinatura de `registrar_versao`), `supabase/tests/56_versao_piloto.test.sql` e `57_acrescentar_arquivo.test.sql` (novos).
- Tipos: `src/types/database.ts` (gerado por `npm run db:types`).
- Função do servidor: `supabase/functions/_shared/decisao.ts`, `registro.ts`, `nomePadrao.ts`, `substituicao.ts` (+ testes), `supabase/functions/arquivos-no-drive/acoes.ts`, `registrar.ts`, `index.ts`.
- Módulo: `src/versoes/tipos.ts`, `rotulos.ts`, `formularioDeVersao.ts`, `recusasDeVersoes.ts`, `versaoDaLinha.ts`, `versoesSupabase.ts`, `VersoesFalso.ts` (+ testes), `src/processos/codigosDasEtapas.ts` (código da técnica).
- Telas: `src/components/versoes/SecaoDeVersoes.tsx`, `FormularioDeVersao.tsx`, `VersaoEmDestaque.tsx`, `ListaDeVersoes.tsx`, `CampoDoNumeroHistorico.tsx` (reaproveitar), CSS ao lado.
- Histórico: `src/cadastros/historicoDosCadastros.ts`.
- Testes de tela: `src/App.enviarVersao`, `App.versoesNoProcesso`, `App.arquivosDoVerso`, `App.versoesNoHistorico`, `App.substituirArquivo`, `App.registrarVersaoHistorica`, `App.agoraDoVerso`, `App.relatorioDepois` (ajuste mínimo) e dois novos (`App.versaoPiloto`, `App.acrescentarArquivo`), `src/testes/versoesDeTeste.ts`.
- Outros: `scripts/prova-do-drive.mjs`, `docs/` (roteiro de publicar a função, se já houver um para `arquivos-no-drive`).

---

## Tarefa 1: Testes de banco antes da migração (critério 1 do ticket)

Referência: spec, tabela "Regras que o banco impõe" (linhas das versões; sem as linhas de relatório numerado e da trava).

- [x] Ler `supabase/tests/27`, `28`, `29`, `30` e um dos que só montam versão (`39`) para copiar o padrão (`plan(N)`, `_tap`, usuários fictícios).
- [x] `27_versoes`: trocar `registrar_versao(..., null, arr)` pela assinatura nova; tirar as provas de `observacao` (linhas ~90 e ~154) e passar a exigir só o `.bpm` (o que antes dava `versao_sem_bpm_e_png` agora: só `.bpm` aceito, sem `.bpm` recusado com `versao_sem_bpm`); ajustar o `plan`.
- [x] `28_versoes_historicas`: assinatura nova; tirar `observacao` (linha ~87); acrescentar prova de histórica **recusada fora de Não iniciados** (código `historica_fora_de_nao_iniciados`).
- [x] `29_relatorio_depois`: só a assinatura de `registrar_versao` e o `.bpm` apenas onde antes havia `.bpm`+`.png`; nada do relatório muda.
- [x] `30_substituir_arquivo`, `37`, `39`, `40`, `41`, `44`, `49`, `50`, `55`: trocar a chamada de `registrar_versao`/`registrar_versao_historica` pela assinatura nova (mecânico). Rodar `grep -rn "registrar_versao" supabase/tests` antes e depois para não esquecer nenhum.
- [x] `56_versao_piloto` (novo), com casos: piloto V6P depois da V5F aceita; piloto com número menor ou igual ao maior recusada (`numero_da_piloto_nao_maior:N`); piloto sem versão nenhuma começando em V3P aceita; duas pilotos (V6P, V7P) aceitas; em sequência depois da piloto = maior + 1 (V6P → V7); em sequência sem versão = V1; piloto depois da em sequência recusada; histórica depois da piloto recusada; piloto e em sequência só com `.bpm` aceitas; sem `.bpm` recusada; piloto com `.png` e `.bpmn` juntos aceita; `piloto` e `historica` ao mesmo tempo recusado; piloto na Modelagem piloto aceita, na técnica recusada (`piloto_fora_da_etapa`); em sequência na Revisão interna aceita, na Validação com o setor e em etapa nova depois da Revisão interna recusada; evento `enviar_piloto` gerado (1 por envio) com o rótulo `V6P` no estado; Consulta e visitante recusados.
- [x] `57_acrescentar_arquivo` (novo), com casos: `.png` aceito numa versão em sequência que não o tem; `.bpmn` idem; repetido recusado (`arquivo_ja_existe`); versão histórica recusada; versão aprovada recusada (`versao_aprovada:N`); papel `bpm` ou `relatorio` recusado nesta função; processo suspenso/cancelado/concluído recusado; evento `acrescentar_arquivo` com o papel; Consulta recusada; vale em qualquer etapa com o processo em andamento.
- [x] Commit só dos testes (`git add supabase/tests`), `git push` da branch e disparar o workflow "Testes de banco" na branch. **Esperado: vermelho** pelo motivo certo (assinatura/coluna `piloto` inexistente). Colar o número da execução em `desvios.md`.

## Tarefa 2: Migração (critério 1 do ticket)

- [x] `npx supabase migration new versoes_por_etapa` e conferir que o horário gerado é posterior ao da última migração (`20261025194034`); se não for, escolher à mão (como em 2026-10-20).
- [x] Ler as migrações citadas no mapa antes de cada `create or replace`/`drop`: `20261016012547` (`preparar_versao`, `conferir_versao_historica`, `registrar_versao`, `registrar_evento_da_versao`), `20261020150000` (gatilho adiado e `papeis_que_faltam`), `20261016020123` (`registrar_evento_do_relatorio`), `20261019224928` (`bloquear_troca_em_versao_aprovada`), `20261015224928` (`estado_da_versao`, `preparar_arquivo_da_versao`).
- [x] Escrever: coluna `versoes.piloto boolean not null default false` com `check (not (piloto and historica))`; `grant insert (piloto)`; `alter table versoes drop column observacao` (e o `grant insert` dela some junto); `private.preparar_versao` com a numeração (histórica e piloto digitadas; piloto > todas e só antes da primeira em sequência; em sequência = maior + 1); `private.conferir_onde_cabe_a_versao` (decisão 4); `private.conferir_arquivos_da_versao` recriado (histórica como antes; piloto/em sequência só `.bpm`; sai `versao_sem_bpm_e_png`); `registrar_versao` e `registrar_versao_historica` pelas assinaturas da decisão 1; `private.estado_da_versao` sem `observacao`; `private.registrar_evento_da_versao` com `enviar_piloto`; `registrar_evento_do_relatorio` olhando o papel; `public.acrescentar_arquivo` (decisão 2) com seu gatilho de conferência (png/bpmn, só piloto ou em sequência, não aprovada, não repetido); `revoke`/`grant` de cada função nova.
- [x] A migração é **destrutiva só em dados inventados** (coluna `observacao`); registrar no `desvios.md`.
- [x] `git push` e "Testes de banco" na branch: **todos os arquivos verdes**, inclusive `00_rls_ligada`, `10_privilegios_padrao` e `46_funcoes_e_views_seguras` (o ensaio automático das migrações pendentes roda antes). Se algum teste de outro ticket quebrar pela regra "onde cabe", seguir a decisão 5.

## Tarefa 3: Aplicar no desenvolvimento e regenerar os tipos

- [x] Conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`: desenvolvimento). Disparar o workflow "Migrar banco de desenvolvimento" na branch com o nome da migração (autorizado no CLAUDE.md) e ler o resultado.
- [x] `npm run db:types`. Se o arquivo vier "modificado" só por quebra de linha, `git add` (como nas execuções anteriores).
- [x] `npm run typecheck`: deve acusar `observacao`, `registrar_versao` e demais uso antigo no front; esse é o roteiro das Tarefas 4 a 7 (não remendar aqui).
- [x] Commit: migração + testes ajustados (Tarefa 1) + tipos, conforme a regra do mesmo commit. Atualizar a lista de migrações em `supabase/AMBIENTES.md`.

## Tarefa 4: Função do servidor (critério 3 do ticket)

Teste primeiro, visto falhar, em `supabase/functions/_shared/*.test.ts` (Vitest).

- [x] `nomePadrao.test.ts` + `nomePadrao.ts`: parâmetro `tipo: 'historica' | 'piloto' | 'sequencia'` no lugar de `historica`; `nomePadrao({sigla:'CEE', numero:6, tipo:'piloto', nomeDoProcesso:'Nome do processo', papel:'bpm', extensao:'bpm'})` devolve `CEE_V6P_Nome do processo.bpm`. Atualizar os chamadores (`src/versoes/formularioDeVersao.ts`, `VersoesFalso.ts`) na Tarefa 5/6.
- [x] `decisao.test.ts` + `decisao.ts`: `EntradaIniciarEnvio` ganha `piloto`; `lerCamposDoEnvio` valida (piloto e histórica juntas = recusa `entrada_invalida`); `PERFIS_POR_ACAO` ganha `acrescentar_arquivo` (Administrador e Integrante; Consulta, inativo e sem login recusados, com as mesmas provas por perfil de hoje).
- [x] `registro.test.ts` + `registro.ts`: tira `observacao` de `EntradaRegistrar`, `lerObservacao` e `parametrosDoBanco` (testes das linhas ~22 a 232 passam ao modelo novo); `funcaoDoBancoPara` devolve também `'acrescentar_arquivo'`; `parametrosDoBanco` monta `p_arquivos`/`p_piloto` pelas assinaturas novas; `recusaDoBanco` e `statusDaRecusaDoBanco` cobrem os códigos novos do banco (`numero_da_piloto_nao_maior`, `piloto_fora_da_etapa`, `historica_fora_de_nao_iniciados`, `arquivo_ja_existe`, `versao_sem_bpm`, `versao_aprovada`).
- [x] `substituicao.test.ts` + `substituicao.ts`: `conferirAlvoDoEnvio`/`conferirAlvoDoRegistro` recusam acrescentar na versão aprovada ou histórica (mesmo caminho do ADR 0011).
- [x] `arquivos-no-drive/acoes.ts`, `registrar.ts`, `index.ts`: operação de acrescentar arquivo (lê a versão, repete a conferência, cria o arquivo no Drive com `nomePadrao` e chama `acrescentar_arquivo`); `rotuloEsperado` devolve `V{n}P` para a piloto; some `observacao`. A ação `sem_alteracao` **fica** (ticket 10).
- [x] `npx vitest run supabase/functions` verde; commit.

## Tarefa 5: Funções puras do front (critério 4 do ticket)

Teste primeiro, visto falhar.

- [x] `rotulos.test.ts` + `rotulos.ts`: `Versao` e `rotuloDaVersao({numero, historica, piloto})` → `V6P`; `numeroMinimoDaPiloto(versoes)` (maior + 1; sem versões, 1); `botoesDeEnvio(etapaCodigo, versoes)` devolve `'historica' | 'piloto' | 'sequencia' | null` pela decisão 4 e pelos códigos de `codigosDasEtapas.ts` (acrescentar ali o código da etapa técnica, `relatorio_modelagem_tecnica`, conferindo o valor no catálogo); `podeAcrescentarArquivo(versao, papel)` (piloto ou em sequência, sem o papel, não aprovada).
- [x] `formularioDeVersao.test.ts` + `formularioDeVersao.ts`: `ModoDoFormulario` = `{tipo:'historica'} | {tipo:'piloto', numero} | {tipo:'sequencia', numero}`; `PAPEIS_OBRIGATORIOS` por modo (piloto e sequência: só `bpm`; histórica como hoje); `podeEnviar` desabilitado só enquanto falta o `.bpm` (ou o número da piloto); `arquivosDoPedido` e `nomeNaPrevia` com o tipo; some o campo de observação.
- [x] `recusasDeVersoes.test.ts` + `recusasDeVersoes.ts`: frases novas da spec: "O número da versão piloto precisa ser maior que {n}.", "A versão precisa do .bpm.", piloto/histórica depois da versão em sequência, acrescentar arquivo repetido, acrescentar/substituir na aprovada, envio fora da etapa. Saem `versao_sem_bpm_e_png`; **ficam** as de relatório (ticket 10).
- [x] `historicoDosCadastros.ts` (+ `historicoDasVersoes.test.ts`): `enviar_piloto: 'Enviou a versão piloto'` (com o rótulo `V6P`) e `acrescentar_arquivo: 'Acrescentou o {papel} à versão'` ("Acrescentou o .png à V7"); os textos antigos não mudam; some `observacao` do estado das versões.
- [x] `npx vitest run src/versoes src/cadastros` verde; commit.

## Tarefa 6: Módulo real e falso (critério 3 do ticket)

- [x] `tipos.ts`: `Versao` ganha `piloto`, perde `observacao`; `PedidoDeVersao` perde `observacao` e ganha `tipo: 'piloto' | 'sequencia'`; `ModuloDeVersoes` ganha `acrescentarArquivo(pedido: {processoId, versaoId, papel: 'png' | 'bpmn', arquivo}, aoProgredir)`; `registrarVersaoHistorica` perde a observação.
- [x] `versaoDaLinha.ts`: `COLUNAS_DA_VERSAO` sem `observacao`, com `piloto`.
- [x] `versoesSupabase.test.ts` + `versoesSupabase.ts`: (cliente e `fetch` simulados) `enviarVersao` com tipo piloto manda `piloto: true` e o número; `acrescentarArquivo` chama `iniciar_envio` + `registrar` com a operação nova; as frases das recusas novas chegam traduzidas.
- [x] `VersoesFalso.test.ts` + `VersoesFalso.ts`: imita as recusas do banco (piloto menor, piloto depois da em sequência, sem `.bpm`, acrescentar repetido/aprovada/histórica, onde cabe pela etapa do `processos`), gera os eventos novos e perde `observacao`.
- [x] `src/testes/versoesDeTeste.ts` (`versaoDeTeste` sem `observacao`, com `piloto: false`); `npx vitest run src/versoes` verde; commit.

## Tarefa 7: Telas (critérios 2, 5 e 6 do ticket)

Os testes de tela da Tarefa 8 vêm antes de cada alteração desta tarefa; escrever o teste, ver falhar, depois o componente.

- [x] `SecaoDeVersoes.tsx`: botão único da etapa atual (`botoesDeEnvio(processo.etapaAtual, versoes)`): [Registrar versão histórica], [Enviar versão piloto] ou [Enviar versão]; nada em Validação, Aprovação, Publicação, Concluídos e etapas novas; sem botão para Consulta, processo suspenso/cancelado/concluído (`podeAlterar`). A lista de versões aparece em todas as etapas, sem espaço vazio. O botão abre e fecha o formulário e, ao abrir, rola até ele aparecer inteiro (`scrollIntoView({block:'nearest'})` num `useEffect`).
- [x] `FormularioDeVersao.tsx`: três modos; piloto com o número preenchido com o menor aceito (editável, rótulo "Número" reaproveitando `CampoDoNumeroHistorico`) e a prévia `V6P` com o nome de cada arquivo; `.bpm` obrigatório, `.png` e `.bpmn` opcionais; some o campo "Observação (opcional)" e `LIMITE_DA_OBSERVACAO`; em sequência: só `.bpm` obrigatório. O envio falho deixa o preenchido e mostra a frase em vermelho (como hoje).
- [x] `VersaoEmDestaque.tsx` e `ListaDeVersoes.tsx`: rótulo `V6P`; some o texto da observação; no espaço tracejado `.arquivo-que-falta`, [+ Acrescentar .png] e [+ Acrescentar .bpmn] (piloto ou em sequência que não os tem, fora da aprovada e da histórica; valem em qualquer etapa com o processo em andamento); cada um abre um seletor de arquivo nativo com `accept` e chama `acrescentarArquivo`. A pílula "falta relatório" e [+ Acrescentar relatório] **ficam** (ticket 10).
- [x] CSS ao lado (`Versoes.css`, `VersaoEmDestaque.css`) só com tokens do projeto.
- [x] `npm run lint` e `npm run typecheck` verdes; commit.

## Tarefa 8: Testes de tela com o aplicativo inteiro (critério 2 do ticket)

Em `src/`, renderizando o App com as falsas nomeadas. Os que existem passam ao modelo novo (`.bpm` basta; sem observação; sem o botão fixo em qualquer etapa):

- [x] `App.enviarVersao`, `App.versoesNoProcesso`, `App.arquivosDoVerso`, `App.versoesNoHistorico`, `App.substituirArquivo`, `App.registrarVersaoHistorica`, `App.agoraDoVerso`: ajustar sem apagar a prova de comportamento; `App.relatorioDepois` e `App.baixarArquivo`/`App.conferenciaNoDrive`: só o que a assinatura e o `.bpm`-só exigirem.
- [x] `App.versaoPiloto` (novo): botões em cada etapa (Não iniciados, Modelagem piloto, técnica, Revisão interna, Validação, Concluídos, etapa nova); piloto com o número preenchido, trocado por um maior, recusado quando baixo (com a frase), V3P sem histórica, duas pilotos, botão some depois da primeira em sequência; em sequência só com `.bpm` e a numeração depois da P; botão desabilitado só enquanto falta o `.bpm`; formulário abre, fecha pelo mesmo botão e rola; Consulta e processo suspenso sem botões; eventos "Enviou a versão piloto V6P" e os antigos no histórico.
- [x] `App.acrescentarArquivo` (novo): [+ Acrescentar .png] e [+ Acrescentar .bpmn] aceitos; somem quando a versão já tem o arquivo, na aprovada e na histórica; recusa fora da tela mostra a frase; evento "Acrescentou o .png à V7".
- [x] `npm test` verde; commit.

## Tarefa 9: Fechamento

- [x] `scripts/prova-do-drive.mjs`: tirar `observacao` (linhas ~91 e ~134); `sem_alteracao` e `copiado_de` ficam (ticket 10).
- [x] `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:circular` verdes; "Testes de banco" verde na branch depois do último push (conferir o número da execução).
- [x] `desvios.md` (entrada datada): execuções vermelha e verde, o que foi decidido (decisões de execução acima), o que ficou presumido (os dois critérios `[visual]`: a tela só se vê no app real com a função publicada), código de recusa novos.
- [x] Roteiro para o usuário (no fim do relatório e em `.scratch/proximo-passo.md`): publicar a função `arquivos-no-drive` no desenvolvimento (`npx supabase functions deploy arquivos-no-drive --use-api --project-ref yclkzyoebpsxmgpbcbus`, modelo em `docs/drive-conta-de-servico.md` seção 4) e conferir na tela os critérios `[visual]` do ticket.
- [x] Conferir os critérios do ticket um a um; marcar as caixas do ticket.

## Cobertura dos critérios do ticket

| Critério | Tarefa |
|---|---|
| 1 pgTAP antes da migração | 1 e 2 |
| 2 testes de interface | 8 |
| 3 arquivo puro da função, nome padrão, módulo real | 4 e 6 |
| 4 funções puras | 5 |
| 5 e 6 `[visual]` | 7 (presumidos até o usuário ver na tela) |
