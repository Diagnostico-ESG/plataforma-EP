# As duas planilhas atualizadas de ponta a ponta — plano de execução (ticket 03)

> **Para quem executa:** use `superpowers:executing-plans`. Marque as caixas (`- [x]`) ao terminar cada passo.

**Meta:** o botão (e o robô das 6h) passa a escrever de verdade a Planilha interna (abas Processos e Fases) e a Planilha pública (abas Resumo e Fases), sem nome de pessoa, pela Edge Function `planilhas-dos-dashboards`, que não lê o banco nem usa a chave secreta.

**Ticket:** `.scratch/exportacao-e-manutencao/issues/03-planilhas-atualizadas-de-ponta-a-ponta.md` (critérios citados como "critério N"). **Spec:** `.scratch/exportacao-e-manutencao/spec.md`, histórias 9 a 27, 30 e 34, "Edge Function `planilhas-dos-dashboards`" e "Decisões de teste". **ADRs:** 0017, 0018 (e 0008 para a conta de serviço).

**Branch:** `exportacao-e-manutencao-03` (branch comum, sem worktree). Marco: `marco/2026-10-20-inicio-exportacao-e-manutencao-03`.

## Regras de `.claude/regras/banco.md` que valem

- Teste de banco antes da migração; migração com `npx supabase migration new`; tipos conferidos no mesmo ciclo (`db:types` com o vínculo conferido: `supabase/AMBIENTES.md` = `yclkzyoebpsxmgpbcbus`, desenvolvimento).
- Função `security definer` só em `private`, `search_path` vazio, sem execução para `authenticated` quando a tela não deve alcançá-la (é o caso da montagem do pacote).
- Edge Function: decisão em arquivos puros testados no Vitest (inclui o chamador sem permissão: aqui, a senha errada); entrada é dado de fora e passa por validação; resposta e logs sem dado pessoal; publicar só pelo usuário (`functions deploy ... --use-api`, vínculo conferido), nunca em produção fora do `/ship`.
- Não ler `.env*` nem o cofre real; os testes gravam segredos inventados dentro da transação e desfazem. Segredos da função são do usuário (`secrets set`).
- A rede só abre a porta 443: o teste de banco roda no "Testes de banco" e a migração pelo "Migrar banco de desenvolvimento" (GitHub Actions, autorizados na branch no `CLAUDE.md`). Não há `gh`: disparar pelo navegador do app (skill `anthropic-skills:built-in-browser`), com alguns segundos entre os passos.
- Dados de teste só inventados.

## Decisões deste plano (do ticket e da spec, sem novidade; o que escolhi vai ao `desvios.md` na Tarefa 12)

- **Os identificadores das duas planilhas viajam no pacote.** A função não lê o banco nem o cofre, e precisa saber onde escrever; o cofre continua sendo o único ponto de configuração (a montagem do pacote lê os dois identificadores dele). Eles nunca entram em log nem em resposta.
- **O pacote** (JSON enviado pelo pg_net): `tentativa`, `ficha`, `gerado_em`, `planilhas {interna, publica}`, `etapas [{id, codigo, ordem, fase}]` (só as ativas), `processos [{id, nome, tipo, setor_sigla, macroprocesso_nome, situacao_guardada, concluido, observacoes, data_da_reuniao, ultima_versao}]` (todos, inclusive cancelados; `ultima_versao` é o número da última versão **não histórica**; `concluido` é a regra da view `processos_com_andamento`) e `andamentos [{processo_id, etapa_id, status, iniciada_em, resolvida_em}]`. Nenhum nome nem e-mail de usuário.
- **Resposta rápida e trabalho depois.** A função confere a senha e responde `202` na hora; a validação do pacote, a montagem, a escrita e o resultado ao banco rodam em `EdgeRuntime.waitUntil`, porque o pg_net só espera 5 s pela resposta. A decisão toda fica em `atenderPedido` (pura, com portas injetadas).
- **Segredos da função:** `EP_PLANILHAS_SENHA` (a mesma senha do cofre `planilhas_senha_interna`), `EP_CHAVE_PUBLICAVEL` (a chave publicável do projeto, a mesma do front-end) e os que já existem (`EP_DRIVE_CONTA_JSON_BASE64`). `SUPABASE_URL` é injetado pela plataforma. A chave secreta não é lida.
- **Códigos de motivo** (até 60 caracteres, a tela já os traduz em `src/planilhas/frasesDasPlanilhas.ts`): `planilha_interna_recusada`, `planilha_publica_recusada`, `google_indisponivel`, `pacote_invalido`, e `erro_interno` para o inesperado (a tela mostra "motivo não identificado").
- **Mensagens de validação:** campos de lista fechada (tipo, status, fase) citam o valor recebido; texto livre, identificador e senha citam só o tipo (regra de `decisao.ts`: nada pessoal ou secreto em mensagem).
- **Datas como texto `AAAA-MM-DD`** (data e hora da atualização como `AAAA-MM-DD HH:MM`, no fuso de Brasília), números como número. O Data Studio converte o texto em data na fonte (ticket 04).
- **Situação de cada fase IV a VII** (sabatina 5): sem etapa ativa na fase = "Sem etapa"; todas as etapas resolvidas = "Concluída"; alguma em andamento ou resolvida, sem todas = "Em andamento"; nenhuma começou e a fase anterior está "Concluída" = "Pronto para iniciar" (a fase IV tem a III, sempre concluída); o resto = "Aguardando etapa anterior". Etapa sem andamento no processo conta como pendente. Exceção: fase VII com todas as etapas dispensadas = "Dispensada" (não é concluída). Fases I a III: sempre "Concluída", sem data.
- **Rótulo do processo**, nesta ordem: situação guardada suspenso → "Suspenso · fase atual"; fase VII "Concluída" → "Publicado"; `concluido` → "Concluído"; fase atual "Em andamento" → "Em andamento · fase atual"; senão "Próxima · fase atual". Fase atual = a primeira de IV a VII que está "Em andamento", "Pronto para iniciar" ou "Aguardando etapa anterior"; sem fase atual, o rótulo vai sem a fase.
- **Datas:** modelagem piloto = `data_da_reuniao` ou, sem ela, o `resolvida_em` da etapa `modelagem` (status concluída ou realizada anteriormente); publicação = `resolvida_em` da etapa `publicacao` (mesmo critério); data de conclusão da fase = o maior `resolvida_em` entre as etapas da fase "Concluída". `resolvida_em` e `iniciada_em` seguem o dia UTC (fora do escopo, backlog).
- **Escrita no Sheets** (uma `spreadsheets.batchUpdate` por planilha, depois de uma leitura das abas existentes): para cada aba, cria se faltar (com identificador próprio, maior que os existentes), ajusta a grade ao tamanho dos dados (isso apaga as linhas que sobram), limpa o conteúdo e grava as linhas. O Google aplica o lote inteiro ou nada. A aba de fábrica ("Planilha1") fica como está.
- Layout das abas (cabeçalho na linha 1): **Processos** = Identificador, Área, Macroprocesso, Processo, Tipo, Situação, Data da modelagem piloto, Data da publicação, Última versão, Observações. **Fases** (interna) = Identificador, Área, Processo, Fase, Situação, Data de conclusão. **Resumo** (pública, uma linha) = Total de processos, Total de setores, Atualizado em. **Fases** (pública, 7 linhas) = Fase, Concluídos, Total.
- Arquivos puros de `supabase/functions/_shared/` com prefixo `planilhas`, até 300 linhas, funções de 4 a 20 linhas.

## Arquivos

- Banco: `supabase/tests/44_pacote_das_planilhas.test.sql` (novo); `supabase/migrations/<timestamp>_pacote_das_planilhas.sql` (novo).
- Puros (cada um com `.test.ts` ao lado): `_shared/tokenGoogle.ts`, `_shared/planilhasPacote.ts`, `_shared/planilhasFases.ts`, `_shared/planilhasProcesso.ts`, `_shared/planilhasInterna.ts`, `_shared/planilhasPublica.ts`, `_shared/planilhasMotivo.ts`, `_shared/planilhasLote.ts`, `_shared/planilhasPedido.ts`.
- Função: `supabase/functions/planilhas-dos-dashboards/{index,configuracao,google,sheets,banco}.ts`, `deno.json`; `supabase/config.toml` (entrada da função); `supabase/functions/arquivos-no-drive/google.ts` (passa a usar `tokenGoogle.ts`).
- Docs e registros: `docs/planilhas-cofre-do-banco.md` (seção final reescrita) e `docs/planilhas-publicar-a-funcao.md` (novo, o roteiro do critério 4); `supabase/AMBIENTES.md`; `.scratch/exportacao-e-manutencao/desvios.md`; o ticket.

## Tarefas

### Tarefa 1 — Teste de banco que falha (critério 1)

- [ ] Criar `supabase/tests/44_pacote_das_planilhas.test.sql` no formato do 43 (tabela `_tap`, usuários inventados a1 Administrador, a2 Integrante, a3 Consulta, e os processos montados como no 37). Provas:
  1. Nem `authenticated` nem `anon` executam `private.montar_pacote_das_planilhas()` (`has_function_privilege` falso) e chamá-la como `authenticated` é recusado.
  2. Como dono, com o cofre de teste configurado dentro da transação: o pacote traz `tentativa`/`ficha` quando vem do núcleo, `gerado_em`, e `planilhas.interna`/`publica` iguais aos segredos de teste.
  3. `etapas`: só as ativas (desativar uma no teste e conferir que some), cada uma com `id`, `codigo`, `ordem`, `fase`.
  4. `processos`: o cancelado **aparece** (a montagem é que o tira); campos `tipo`, `setor_sigla`, `macroprocesso_nome`, `situacao_guardada`, `observacoes`, `data_da_reuniao`; `concluido` verdadeiro só quando as etapas obrigatórias estão resolvidas; `ultima_versao` ignora a versão histórica (versões 1, 2 e uma histórica F: vale o 2) e é nulo sem versão.
  5. `andamentos`: um por processo e etapa, com `status`, `iniciada_em`, `resolvida_em`.
  6. O texto do pacote não contém nome nem e-mail dos usuários de teste (nem do responsável da etapa).
  7. O núcleo (`private.iniciar_atualizacao_das_planilhas`) segue registrando a tentativa e guardando só o hash da ficha (o 43 continua verde, sem mudança).
- [ ] `git push -u origin exportacao-e-manutencao-03` e disparar "Testes de banco" na branch. **Esperado:** o 44 falha (função inexistente) e os demais arquivos seguem verdes. Registrar o número da execução.

### Tarefa 2 — Migração do pacote (critério 1)

- [ ] `npx supabase migration new pacote_das_planilhas` (nome com o timestamp de hoje, depois de `20261020155223`). Conteúdo, não destrutivo:
  - `private.montar_pacote_das_planilhas() returns jsonb`, `security definer`, `search_path` vazio, nomes qualificados, lendo da view `public.processos_com_andamento` (setor, macroprocesso, `situacao = 'concluido'`, observações, data da reunião) e uma subconsulta em `public.versoes` com `not historica` para a última versão; `revoke execute ... from public, anon, authenticated`.
  - `create or replace function private.iniciar_atualizacao_das_planilhas(...)`: o corpo do `net.http_post` passa a ser `private.montar_pacote_das_planilhas() || jsonb_build_object('tentativa', tentativa, 'ficha', ficha)`. Mesma assinatura, então os `revoke` do ticket 02 valem; repetir o `revoke` na migração por segurança.
- [ ] Aplicar pelo workflow "Migrar banco de desenvolvimento" na branch; rodar "Testes de banco": todos os arquivos verdes, o 44 passando.
- [ ] `npm run db:types` (alvo conferido). Esperado: sem mudança (tudo em `private`). Se mudar, comitar junto.
- [ ] Commit: teste, migração e (se houver) tipos.

### Tarefa 3 — Token do Google compartilhado (primeira repetição real)

- [ ] Teste primeiro: `_shared/tokenGoogle.test.ts` (com `// @vitest-environment node`, que tem `crypto.subtle`): gera um par RSA na hora; `assinarJwt(email, chavePem, escopo, agora)` devolve três partes; o cabeçalho é RS256/JWT; as claims têm `iss`, `scope`, `aud` = endereço do token, `iat` e `exp = iat + 3600`; a assinatura confere com a chave pública; chave PEM inválida lança erro com o formato esperado. Ver o teste falhar.
- [ ] Criar `_shared/tokenGoogle.ts`: `base64Url`, `importarChave`, `assinarJwt` e `pedirTokenDoGoogle(email, chavePem, escopo, agora)` (troca o JWT por `{ token, venceEm }` e lança `ErroDoGoogle` sem ler corpo de erro quando a resposta não for ok). Mover o código hoje em `arquivos-no-drive/google.ts`; esse arquivo passa a chamar `pedirTokenDoGoogle` e mantém o cache e o `ErroDoDrive`. **Cuidado:** a função em uso não pode mudar de comportamento; se `deno` existir na máquina, rodar `deno check` nela, senão registrar no `desvios.md` que a conferência é no `deploy`.
- [ ] `npm test` verde; commit.

### Tarefa 4 — Validação do pacote (critério 2)

- [ ] Teste primeiro (`planilhasPacote.test.ts`, pacotes inventados): pacote válido passa; recusa com o campo e o esperado para: corpo que não é objeto, `tentativa` fora do formato uuid, `ficha` fora de 64 hexadecimais, `gerado_em` que não é data, identificador de planilha ausente ou fora de `[A-Za-z0-9_-]{10,200}`, `etapas` que não é lista, `fase` fora de IV a IX (cita o valor), `tipo`, `situacao_guardada` e `status` fora da lista (citam o valor), `concluido` que não é booleano, `ultima_versao` que não é inteiro positivo nem nulo, `data_da_reuniao` fora de `AAAA-MM-DD`, `nome` vazio. Nenhuma mensagem repete nome de processo, observação nem identificador.
- [ ] Criar `planilhasPacote.ts`: tipos `PacoteDasPlanilhas` (e os de linha) e `validarPacote(corpo): Validacao<PacoteDasPlanilhas>` usando `decisao.ts` (`falhar`, `tipoDe`, `eCorpo`). Uma função por bloco (`lerEtapas`, `lerProcessos`, `lerAndamentos`) para respeitar as 20 linhas.
- [ ] Commit.

### Tarefa 5 — Situação de cada fase (critério 2)

- [ ] Teste primeiro (`planilhasFases.test.ts`): uma tabela de casos por regra: tudo resolvido (concluída, realizada anteriormente e dispensada misturadas) = "Concluída"; uma em andamento = "Em andamento"; uma resolvida e outra pendente = "Em andamento"; nenhuma começou com a anterior concluída = "Pronto para iniciar"; a IV nunca começada = "Pronto para iniciar" (a III é concluída); nenhuma começou com a anterior não concluída = "Aguardando etapa anterior"; fase sem etapa ativa = "Sem etapa" e a seguinte fica "Aguardando etapa anterior"; etapa sem andamento = pendente; fase VII com todas dispensadas = "Dispensada" (e a VI dispensada **não** vira "Dispensada"); fases I a III "Concluída" sem data; data de conclusão = maior `resolvida_em` entre as etapas; andamentos de etapa inativa ignorados.
- [ ] Criar `planilhasFases.ts`: `FASES_DA_PLANILHA` (`I` a `VII`), `situacaoDasFases(etapas, andamentosDoProcesso): SituacaoDeFase[]` (fase, situação, `concluidaEm`).
- [ ] Commit.

### Tarefa 6 — Rótulo, datas, tipo e última versão do processo (critério 2)

- [ ] Teste primeiro (`planilhasProcesso.test.ts`): cada rótulo ("Publicado", "Concluído" por processo concluído com a VII dispensada ou sem etapa, "Em andamento · V", "Próxima · VI", "Suspenso · IV", e sem fase atual); suspenso antes de publicado; data da modelagem pela reunião, sem ela pela conclusão da etapa `modelagem`, vazia se nada; modelagem dispensada não dá data; data da publicação só da etapa `publicacao` resolvida (dispensada não dá data); `V7` para a última versão e vazio sem versão; os três tipos ("Processo", "Subprocesso", "A classificar").
- [ ] Criar `planilhasProcesso.ts`: `rotuloDoProcesso`, `dataDaModelagemPiloto`, `dataDaPublicacao`, `rotuloDoTipo`, `rotuloDaVersao`. Códigos `modelagem` e `publicacao` como constantes nomeadas no topo.
- [ ] Commit.

### Tarefa 7 — Linhas das duas planilhas (critério 2)

- [ ] Teste primeiro (`planilhasInterna.test.ts` e `planilhasPublica.test.ts`, com um pacote inventado de uns 6 processos: normal, subprocesso, a classificar, suspenso, cancelado, publicado, com Publicação dispensada): cancelados fora e suspensos dentro; os três tipos contam um cada; cabeçalhos e ordem de colunas do plano; o identificador do processo nas duas abas internas; a aba Fases tem 7 linhas por processo; "Sem etapa" quando o catálogo não tem etapa na fase; observações só na aba Processos da interna; **nenhuma célula** das duas planilhas contém nome ou e-mail de usuário (o pacote de teste leva um responsável inventado de propósito, fora do tipo do pacote, e o teste prova que ele não aparece); pública: total de processos, total de setores distintos entre os que entram, concluídos e total por fase I a VII (a VII dispensada não é concluída), "Atualizado em" no fuso de Brasília (`2026-10-20T12:00:00Z` vira `2026-10-20 09:00`); nenhuma linha pública traz nome de processo.
- [ ] Criar `planilhasInterna.ts` (`montarPlanilhaInterna(pacote): AbaDeValores[]`) e `planilhasPublica.ts` (`montarPlanilhaPublica(pacote): AbaDeValores[]`), com o tipo `AbaDeValores = { titulo: string; linhas: (string | number)[][] }` exportado de `planilhasPacote.ts`.
- [ ] Commit.

### Tarefa 8 — Motivo da falha e senha (critério 2)

- [ ] Teste primeiro (`planilhasMotivo.test.ts`): `ErroDoGoogle(onde, status)` com `onde` em `token | interna | publica`; 400, 401, 403 e 404 na interna = `planilha_interna_recusada`; idem na pública = `planilha_publica_recusada`; 429, 5xx, falha de rede (status nulo) e falha do token = `google_indisponivel`; pacote inválido = `pacote_invalido`; qualquer outro erro = `erro_interno`; nenhum código passa de 60 caracteres e nenhum leva corpo de resposta, nome ou identificador. `senhaConfere(recebida, esperada)`: certa, errada, ausente, vazia, de tamanho diferente.
- [ ] Criar `planilhasMotivo.ts` (a classe `ErroDoGoogle` e `motivoDaFalha`) e a comparação de senha em tempo constante (`senhaConfere`) no mesmo arquivo ou em `planilhasSenha.ts`, o que ficar menor. O `tokenGoogle.ts` da Tarefa 3 passa a usar essa classe (ajustar o import e o teste).
- [ ] Commit.

### Tarefa 9 — Lote do Sheets (critério 2)

- [ ] Teste primeiro (`planilhasLote.test.ts`): `montarLote(abas, existentes)` com `existentes = [{ sheetId, titulo }]`. Aba que falta: `addSheet` com identificador maior que todos os existentes; aba que existe: reaproveita o `sheetId`; para cada aba: `updateSheetProperties` com `rowCount = max(linhas, 1)` e `columnCount` igual à largura, `updateCells` limpando o conteúdo (`fields: userEnteredValue`, sem linhas) e `updateCells` gravando (texto como `stringValue`, número como `numberValue`); a ordem dos pedidos é a que o Google exige (criar, ajustar a grade, limpar, gravar); planilha com menos linhas que antes reduz a grade (apaga as que sobram); aba sem dados fica com uma linha de cabeçalho.
- [ ] Criar `planilhasLote.ts`: `montarLote` (puro) e `abasExistentes(respostaDoGoogle)` (lê `sheets.properties`, recusando formato inesperado).
- [ ] Commit.

### Tarefa 10 — O pedido: senha, ordem e resultado (critérios 2 e 3)

- [ ] Teste primeiro (`planilhasPedido.test.ts`, portas falsas nomeadas: `GoogleFalso`, `BancoFalso`): `atenderPedido({ senhaRecebida, corpo }, senhaEsperada, portas)` devolve `{ status, codigo, depois? }`. **Senha errada, ausente ou vazia: 401, sem `depois` e a porta do Google nunca chamada** (nem leitura de abas). Corpo que não é JSON/objeto: 400. Senha certa: 202 e `depois` pronto; só ao rodar `depois` o pacote é validado, as linhas montadas e a interna escrita **antes** da pública; as duas certas: `registrar(tentativa, ficha, true, null)` uma vez; pacote inválido: nada vai ao Google e o resultado é `false`/`pacote_invalido` (se `tentativa` e `ficha` forem legíveis; senão nada a registrar); falha na interna: a pública nem é tentada, motivo `planilha_interna_recusada`; interna certa e pública falha: resultado `false` com `planilha_publica_recusada` (a interna fica escrita, a porta registra as duas escritas); erro inesperado: `erro_interno`; falha ao registrar o resultado não derruba a função (só log com o tipo do erro). Os registros e a resposta não repetem nome de processo, observação nem identificador de planilha.
- [ ] Criar `planilhasPedido.ts` com `Portas` (`lerAbas(planilha)`, `aplicarLote(planilha, lote)`, `registrar(...)`), `atenderPedido` e `executarAtualizacao`.
- [ ] Commit.

### Tarefa 11 — A função `planilhas-dos-dashboards` (camada Deno, critério 3 depende dela)

- [ ] `npx supabase functions new planilhas-dos-dashboards` (ou criar a pasta no formato de `arquivos-no-drive`). Arquivos: `configuracao.ts` (único ponto que lê os segredos: conta de serviço, `EP_PLANILHAS_SENHA`, `EP_CHAVE_PUBLICAVEL`, `SUPABASE_URL`; mensagem de falta com o formato esperado, sem valores), `google.ts` (token com o escopo `https://www.googleapis.com/auth/spreadsheets` usando `tokenGoogle.ts`, cache em memória), `sheets.ts` (leitura das abas e `batchUpdate`, lançando `ErroDoGoogle(onde, status)` sem ler o corpo de erro), `banco.ts` (a chamada `rpc/registrar_resultado_das_planilhas` por `fetch` com a chave publicável, sem login), `index.ts` (`Deno.serve`: só `POST`; liga as portas reais e passa o `depois` ao `EdgeRuntime.waitUntil`; log só com o tipo do erro), `deno.json` (mesmo formato do de `arquivos-no-drive`, sem dependência nova de produção).
- [ ] `supabase/config.toml`: bloco `[functions.planilhas-dos-dashboards]` com `enabled = true`, `verify_jwt = false` (o pg_net não leva login; a senha interna é a trava, conferida pela própria função), `import_map` e `entrypoint`, com o comentário do porquê no padrão do bloco vizinho.
- [ ] Conferir no `npm test` que nada quebrou; se `deno` existir, `deno check` na função nova. A chamada de ponta a ponta é a Tarefa 13.
- [ ] Commit.

### Tarefa 12 — Roteiro do usuário e registros (critério 4)

- [ ] Reescrever o fim de `docs/planilhas-cofre-do-banco.md` (a seção "O que ainda não existe") e criar `docs/planilhas-publicar-a-funcao.md`: lista numerada, **um passo por linha**, com o caminho completo de cada arquivo ou pasta e o endereço direto de cada página, na ordem: (1) conferir que as duas planilhas estão no Drive compartilhado onde a conta de serviço é membro (`docs/drive-conta-de-servico.md`); (2) ligar a API Google Sheets no projeto do Google Cloud do Drive (endereço `https://console.cloud.google.com/apis/library/sheets.googleapis.com`, escolhendo o projeto da conta de serviço); (3) gravar o segredo `EP_PLANILHAS_SENHA` (a senha do passo 4 do roteiro do cofre) e `EP_CHAVE_PUBLICAVEL` com `npx supabase secrets set` no terminal dele, conferindo antes `supabase/.temp/project-ref`; (4) `npx supabase functions deploy planilhas-dos-dashboards --use-api --no-verify-jwt` (a senha do banco nunca vem para a conversa); (5) abrir Administração → Planilhas e apertar [Atualizar planilhas agora]; (6) como ver o motivo de uma falha e como provocar a falha de teste do critério 3 (tirar a conta de serviço da planilha pública e apertar de novo; depois devolver o acesso). Termos técnicos explicados em uma frase no começo.
- [ ] `supabase/AMBIENTES.md`: nova linha na lista de migrações (data, ticket, teste 44 falhou antes e passou depois, workflow e execuções, tipos sem mudança).
- [ ] `.scratch/exportacao-e-manutencao/desvios.md`: seção "ticket 03" com cada escolha da lista "Decisões deste plano" que a spec não trazia (identificadores no pacote, `waitUntil`, segredos da função, mensagens de validação só com o tipo nos campos livres, datas como texto, regra do rótulo, extração do token compartilhado) e o que ficou presumido.
- [ ] Marcar no ticket os critérios 1, 2 e 4 (o 3 só depois da Tarefa 13). Commit.

### Tarefa 13 — Conferência no desenvolvimento, com o usuário (critério 3)

- [ ] O usuário cumpre o roteiro da Tarefa 12 (deploy e segredos são dele). Se ele não puder agora, parar aqui, deixar o critério 3 aberto e perguntar se o ticket fecha com a ressalva "provas no desenvolvimento pendentes" ou espera.
- [ ] Com a função publicada: no app de desenvolvimento (o usuário entra com a conta dele no navegador do app), apertar [Atualizar planilhas agora] e conferir que a tentativa vira "Concluída" e que as abas Processos e Fases da interna e Resumo e Fases da pública estão preenchidas (conferir cabeçalhos, contagem de linhas e a ausência de nome de pessoa; sem repetir dado na conversa). Provocar a falha (conta de serviço sem acesso à planilha pública): "Falhou" com "O Google recusou a escrita na planilha pública.", a interna já nova e a pública como estava; devolver o acesso e apertar de novo: "Concluída".
- [ ] Anotar no `desvios.md` o que foi visto e o que ficou presumido; marcar o critério 3.

### Tarefa 14 — Fechamento

- [ ] `npm test` (e o pre-commit) verdes; "Testes de banco" verde na branch.
- [ ] Mesclar à `main` (`git switch main`, merge, `git push origin main`; marco enviado), apagar a branch com `git branch -d` (se recusar, parar e perguntar), acrescentar ao fim do ticket `Concluído em AAAA-MM-DD (commit <hash>)` e comitar.
- [ ] Ler o bloco "executar-complexo" e "Qualquer momento" de `.claude/regras/nao-testados.md` e registrar em `.scratch/melhorias-protocolo.md` os itens que aconteceram. Lembrar `/cost` e o próximo ticket (04: dashboards no Data Studio, Sonnet).
