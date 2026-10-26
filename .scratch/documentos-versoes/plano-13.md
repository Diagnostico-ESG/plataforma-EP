# Retirar anexo (ticket 13) — plano de execução

> **Para quem executa:** use `superpowers:executing-plans` (a pedido do `/executar-complexo`). Marque as caixas (`- [x]`) à medida que cada passo termina.

**Objetivo:** a retirada do anexo de ponta a ponta: política e gatilhos no banco, a ação `retirar` na função `arquivos-no-drive` (arquivo vai para a lixeira do Drive, depois some a linha), o botão [Retirar] com confirmação na seção "Outros anexos" e o evento "Retirou o anexo" no histórico.

**Ticket:** `.scratch/documentos-versoes/issues/13-retirar-anexo.md`. **Spec:** `.scratch/documentos-versoes/spec.md`, seção "Outros anexos (mudança de 2026-10-26)" (histórias 125 a 129, 131, 132 e 134; decisões 1, 2 e 6). **ADRs:** 0027 (o anexo se retira e vai para a lixeira), 0008 (Drive por conta de serviço). **Plano do ticket anterior (o molde):** `plano-12.md`. **Branch:** `quadro-livre-parte-4` (recriada a partir da `main`; a anterior foi juntada e apagada). Marco: `marco/2026-10-26-inicio-ticket-13-documentos-versoes`.

**Regras do banco que valem aqui** (`.claude/regras/banco.md`, lido em 2026-10-26): teste de banco antes da migração; políticas na mesma migração, cada uma com teste; função de gatilho `security definer` só em `private`, com `search_path` vazio e `revoke` de `public`, `anon` e `authenticated`; migração já aplicada não se edita (a de anexos ficou como está: a retirada é migração nova); migração, teste de banco e tipos no mesmo commit; alvo conferido antes de comando de banco (vínculo atual = `yclkzyoebpsxmgpbcbus`, desenvolvimento, igual a `supabase/.temp/project-ref`); dados de teste inventados; a função confere quem chamou antes de usar a conta de serviço, e o `drive_id` guardado só é usado depois de conferido debaixo da raiz do ambiente; logs e erros sem o nome do anexo (só o identificador); a chave do Google fica só na função; publicar a função é passo do usuário.

## Fora deste ticket (não fazer)

- Desfazer a retirada pela tela (a volta da lixeira é no Drive, em até 30 dias); retirar versão, relatório ou .pdf da aprovação; retirar vários de uma vez; exigir motivo (ADR 0027).
- Publicar a função no desenvolvimento e provar a lixeira no Drive real (passo do usuário); `scripts/prova-do-drive.mjs` não muda.
- Aplicar o papel "Gerente de conteúdo" à conta de serviço: já consta de `docs/drive-conta-de-servico.md`; aqui só se conferem e reforçam o texto e o passo do usuário.

## Decisões de execução (as que o ticket deixa abertas)

1. **Evento por gatilho "antes de apagar".** O `estado_do_anexo(uuid)` lê a linha na tabela; depois do `delete` ela não existe mais. O gatilho `registrar_retirada_do_anexo` roda `before delete` (security definer), grava o evento `retirar`/`anexo` com `antes` = estado do anexo (nome, formato, etapa do envio, processo, setor) e `depois` = nulo, `entidade_ref` = id do processo, e devolve `old`. Como é antes, o nome fica guardado mesmo apagada a linha; se a RLS ou outro gatilho recusar, o comando todo desfaz, inclusive o evento. A política de leitura dos eventos `anexo` (migração 12) já cobre o novo evento.
2. **Gatilho de situação.** `conferir_anexo_de_processo_em_andamento` (`before delete` em `anexos`): processo arquivado → `processo_arquivado`; senão `private.conferir_processo_que_recebe_versao` (`processo_fora_de_andamento:{situação}`). O nome começa com `conferir_` para disparar antes de `registrar_retirada_do_anexo` (ordem alfabética dos gatilhos). Mesma ordem de recusa do envio (arquivado, depois situação).
3. **Privilégio e política.** `grant delete on public.anexos to authenticated`; política `anexos: administrador e integrante ativos apagam` com `private.pode_alterar_cadastros()`. Consulta, inativo e visitante: `42501`. O teste 61 tem uma asserção "o anexo não se apaga neste ticket" que passa a ser falsa: sai do 61 (`plan(44)` → `plan(43)`), e a regra nova é testada no 62. Ajuste mecânico, a registrar no `desvios.md`.
4. **A recusa de "anexo já retirado" não entra em `CodigoDeRecusa`.** `decisao.ts` está em 297 linhas (limite 300). A recusa vive em `_shared/anexo.ts` como `RECUSA_ANEXO_JA_RETIRADO: RecusaDoBanco = { codigo: 'anexo_ja_retirado', mensagem }`, devolvida com status 409 por `responderJson`, o mesmo formato das recusas do banco. Em `decisao.ts` entram só `'retirar'` em `Acao` e a linha de perfis (Administrador e Integrante), 298 linhas.
5. **Ordem da ação `retirar`** (conferida antes de tocar o Drive): login e perfil (`conferirChamador`) → entrada (`anexo_id` uuid) → ler o anexo pela RLS com o login de quem chamou (sem linha: `anexo_ja_retirado`) → processo em andamento (`recusaDoProcesso(processo, 'anexo')`) → ler o arquivo no Drive (`id, trashed, parents`) → se existe e **não** está debaixo da raiz: `sem_permissao`; se existe e não está na lixeira: mandar para a lixeira → apagar a linha com o login de quem chamou → sucesso `{ retirado: true }`. Arquivo que o Drive já não acha (apagado de vez ou lixeira esvaziada) **não bloqueia** a retirada: só apaga a linha (é para isso que a marca "não encontrado" serve na lista). Arquivo já na lixeira: não mexe, só apaga a linha.
6. **Falha do banco depois da lixeira:** se o `delete` volta com erro (`P0001`, `42501` ou outro), a função tira o arquivo da lixeira (`trashed: false`) e devolve a recusa do banco (`recusaDoBanco`) ou erro interno. Se o `delete` volta sem erro mas sem linha (outra aba retirou no meio), é `anexo_ja_retirado` **sem** tirar da lixeira, porque a outra retirada é a que valeu. `// ponytail:` nos dois casos: duas retiradas ao mesmo tempo mandam o mesmo arquivo à lixeira duas vezes (inofensivo).
7. **Frases próprias da retirada.** `src/anexos/recusasDeAnexos.ts` ganha o mapa da retirada (`falhaDaRetiradaDoAnexo`) separado do do envio, porque as frases do envio dizem "enviar". Sem nome do arquivo nas frases de recusa.
8. **A confirmação é uma só por seção** (uma `JanelaDeConfirmacao` na `AnexosProntos`, com o anexo escolhido no estado), não uma por linha: mesmo botão, uma janela, e o foco volta ao [Retirar] da linha de origem pelo `<dialog>`. Título "Retirar '{nome}'?", texto "O arquivo vai para a lixeira do Drive e some em 30 dias.", ação "Retirar". A falha fica em vermelho no topo da seção (não na linha), porque a linha pode sumir na recarga.
9. **Depois de falha, a lista é lida de novo.** O anexo que "já foi retirado" em outra aba some da lista e a frase continua visível; a falha comum deixa o anexo na lista. A mensagem fica no estado do hook e só some na próxima tentativa.
10. **Merge:** a parte 3 e o ticket 12 mantiveram a branch aberta até o `/ship`; no fim, **perguntar** ao usuário se junta à `main` agora (o comando manda juntar) ou deixa para o `/ship` da parte.

## Arquivos

- Banco: `supabase/tests/62_retirar_anexo.test.sql` (novo); `supabase/tests/61_anexos.test.sql` (tirar a asserção de apagar); `supabase/migrations/<AAAAMMDDHHMMSS>_retirar_anexo.sql` (nova, depois de `20261026205450`); tipos em `src/types/database.ts` (só se o gerador mudar algo); `supabase/AMBIENTES.md`; `docs/manutencao/04-modelo-de-dados.md`.
- Função (puros, com teste no Vitest): `supabase/functions/_shared/anexo.ts` (+ `anexo.test.ts`): `EntradaRetirarAnexo`, `validarRetirar`, `RECUSA_ANEXO_JA_RETIRADO`; `_shared/decisao.ts` (`Acao`, perfis). Camada Deno (sem teste automático, como as anteriores): novo `arquivos-no-drive/retirada.ts` (`retirarAnexo`), `google.ts` (mandar à lixeira e tirar dela), `index.ts` (a ação nova).
- Cliente: `src/anexos/tipos.ts`, `recusasDeAnexos.ts`, `anexosSupabase.ts`, `AnexosFalso.ts` (+ testes), `src/cadastros/historicoDosCadastros.ts` (+ `historicoDosAnexos.test.ts`), `src/hooks/useRetiradaDeAnexo.ts` (novo).
- Tela: `src/components/anexos/ListaDeAnexos.tsx`, `SecaoDeAnexos.tsx`, `Anexos.css`; testes `src/App.anexosRetirada.test.tsx` (novo, para respeitar o limite de 300 linhas) e `src/App.anexosPerfis.test.tsx` (acrescentar), `src/testes/anexosDeTeste.ts` se faltar ajudante.
- Documentação: `docs/drive-conta-de-servico.md` (reforço do papel e do passo do usuário), `docs/manutencao/04-modelo-de-dados.md`, o documento da função em `docs/manutencao/` onde o ticket 12 documentou o papel `anexo`.

---

## Tarefa 0: Marco, branch e ponto de partida

- [ ] Árvore limpa (`git status`). `git tag marco/2026-10-26-inicio-ticket-13-documentos-versoes`; `git switch -c quadro-livre-parte-4` (a partir da `main`).
- [ ] `git push origin "refs/tags/marco/*:refs/tags/marco/*"` e `git push -u origin quadro-livre-parte-4` (autorizados no `CLAUDE.md`, sem `--force`; a branch remota antiga é ancestral da `main`, então o envio avança sem conflito).
- [ ] Conferir se o Docker está de pé (`docker info`). Se estiver: `npx supabase start` (saída descartada, traz chaves), `npx supabase test db` contando `ok` e `not ok`. Senão: workflow "Testes de banco" na branch (2 a 3 minutos por ciclo).

## Tarefa 1: Testes de banco antes da migração (critério 1 do ticket)

- [ ] Ler `supabase/tests/61_anexos.test.sql` (molde: usuários a1 a4, processos `Andamento`, `Suspenso`, `Cancelado`, `Concluido`, `Arquivado`, `Solto`, `Livre`, `Vazio`, `pg_temp.anexo()`, `pg_temp.claims()`, `enviar_completa`, `concluir`, limpeza `session_replication_role` no começo e a exceção do fim). Tirar do 61 a asserção "o anexo não se apaga neste ticket" e ajustar `plan(44)` para `plan(43)`.
- [ ] `supabase/tests/62_retirar_anexo.test.sql` (novo, mesmo esqueleto, próprio setor `T62`). Uma asserção por regra:
  - **Apagar:** Administrador (a1) e Integrante (a2) apagam um anexo (`lives_ok` e a contagem cai); Consulta (a3), inativo (a4) e visitante sem login recusados (`42501`) e o anexo continua lá (contagem igual).
  - **Situação:** com o anexo enviado em andamento e depois o processo suspenso, cancelado, concluído e arquivado, o apagar é recusado (`processo_fora_de_andamento:suspenso`, `:cancelado`, `:concluido` e `processo_arquivado`); em andamento aceito em Não iniciados, na Modelagem piloto e na Validação com o setor (retirar não depende da etapa nem de ser a etapa do envio).
  - **Evento:** a retirada gera um evento `retirar`/`anexo` com `entidade_ref` = id do processo, `antes` com o nome, o formato e a etapa do envio, `depois` nulo e `autor_id` de quem retirou; o evento fica depois de apagada a linha; Consulta lê o evento e visitante não; a recusa (Consulta ou processo suspenso) **não** deixa evento.
  - **Reenvio e idempotência:** apagar um anexo já apagado afeta 0 linha, sem erro; dois anexos de mesmo nome: retirar um deixa o outro.
  - **Exclusão do processo:** com um anexo, exclusão recusada (`processo_com_anexos:1`); depois de retirar o último, a exclusão do processo é aceita.
  - **Outros anexos intactos:** a retirada de um anexo não mexe nos anexos de outro processo, nem em versões e arquivos da versão (contagem de `arquivos_da_versao` igual antes e depois).
- [ ] Rodar: **vermelho pelo motivo certo** (apagar recusado por falta de privilégio e evento ausente), o 61 e todos os outros verdes. Commit só dos testes.

## Tarefa 2: Migração (critério 1 do ticket)

- [ ] Conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`). `npx supabase migration new retirar_anexo`; horário depois de `20261026205450`.
- [ ] Na migração, nesta ordem: cabeçalho (retirada do anexo, ADR 0027; não destrutiva: só cria, sem tocar nos dados; a retirada é por apagar a linha); `grant delete on public.anexos to authenticated`; política `anexos: administrador e integrante ativos apagam`; função `private.conferir_anexo_de_processo_em_andamento()` (`before delete`, `search_path` vazio, sem `security definer`) e seu gatilho; função `private.registrar_retirada_do_anexo()` (`before delete`, `security definer`, `search_path` vazio, grava o evento com `private.estado_do_anexo(old.id)` e devolve `old`) e seu gatilho; `revoke execute` das duas funções de `public`, `anon` e `authenticated`.
- [ ] Rodar a bateria inteira: `62_retirar_anexo` e `61_anexos` verdes e todos os outros verdes, **inclusive `00_rls_ligada`, `10_privilegios_padrao` e `46_funcoes_e_views_seguras`**. Teste antigo que quebre por causa do `grant delete`: ajustar (mecânico) ou parar e perguntar se o motivo for outro.
- [ ] Tipos: `npx supabase gen types --local` (Docker) para `src/types/database.ts`, só se o arquivo mudar; se vier "modificado" só por fim de linha, não comitar a diferença. Commit da migração, dos testes e dos tipos juntos; `git push`.

## Tarefa 3: Aplicar no desenvolvimento

- [ ] Disparar o workflow "Migrar banco de desenvolvimento" na branch com o nome da migração e ler o resultado (se disser "já aplicada", parar e avisar). Depois o "Testes de banco" na branch: todos verdes (conta de `ok` e `not ok`).
- [ ] Linha nova em `supabase/AMBIENTES.md` (padrão das anteriores: ticket, vermelho antes, verde depois, execuções). Commit e `git push`.

## Tarefa 4: Função do servidor — as decisões puras (critério 3 do ticket)

Teste primeiro, visto falhar, em Vitest (`npx vitest run supabase/functions`).

- [ ] `decisao.ts`: `Acao` ganha `'retirar'`; `PERFIS_POR_ACAO.retirar = ['administrador', 'integrante_ep']`. Sem outra mudança (limite de 300 linhas, decisão 4).
- [ ] `_shared/anexo.ts` + `anexo.test.ts`: `EntradaRetirarAnexo = { anexoId: string }`; `validarRetirar(corpo)` (corpo que não é objeto, `anexo_id` ausente, fora do formato uuid e de outro tipo recusados com `entrada_invalida` sem repetir o valor recebido; campos a mais são ignorados); `RECUSA_ANEXO_JA_RETIRADO` (código `anexo_ja_retirado`). Casos de decisão, por perfil e situação: `conferirChamador` na ação `retirar` aceita Administrador e Integrante, recusa Consulta (`sem_permissao`), inativo (`usuario_inativo`) e sem login (`sem_login`); `lerAcao` reconhece `retirar`; `conferirProcessoEmAndamento` recusa suspenso, cancelado e concluído para o papel anexo.
- [ ] `npx vitest run supabase/functions` verde; `npm run lint` e `npm run typecheck`; commit.

## Tarefa 5: Função do servidor — a camada Deno (sem teste automático, como nos tickets 07 a 12)

- [ ] `google.ts`: `mudarLixeira(token, driveId, naLixeira: boolean)` (PATCH `trashed` em `files/{id}`; `chamarDrive` já põe `supportsAllDrives`); mensagens de erro só com o identificador.
- [ ] `retirada.ts`: `retirarAnexo(contexto, entrada)` na ordem da decisão 5 e com as falhas da decisão 6: ler o anexo pela RLS (`id, processo_id, drive_id`), o processo (`lerProcesso`, `recusaDoProcesso`), o arquivo (`lerNoDriveOuNulo` com `fields=id,trashed,parents`, `conferidorDaRaiz(contexto).paisSobARaiz`), a lixeira, o `delete().eq('id', …).select('id')` com o login de quem chamou, a volta da lixeira em erro do banco (`recusaDoBanco`, `statusDaRecusaDoBanco`; erro que não é recusa vira erro interno depois de tirar da lixeira). Sem nome do anexo em log nem em erro.
- [ ] `index.ts`: `executar` ganha o ramo `retirar` (`executarRetirar`: valida a entrada, só então pede o token do Google); a mensagem de ação desconhecida passa a citar `retirar`; o cabeçalho do arquivo cita o ticket 13.
- [ ] `npm run lint`, `npm run typecheck`, `npx vitest run supabase/functions` verdes. **Presumido e dito no fecho:** a camada Deno só se prova publicando a função (passo do usuário). Commit.

## Tarefa 6: O módulo de anexos no cliente (critério 3 do ticket)

Teste primeiro, visto falhar.

- [ ] `src/anexos/tipos.ts`: `ModuloDeAnexos.retirarAnexo(anexoId: string): Promise<void>`, com o comentário da recusa como `TravaDoBanco` (a falha comum, como `Error`).
- [ ] `src/anexos/recusasDeAnexos.ts` + teste: `falhaDaRetiradaDoAnexo(codigo)` com as frases da retirada (perfil, usuário inativo, sessão, processo fora de andamento, `processo_arquivado`, `anexo_ja_retirado` = "O anexo já foi retirado.", Drive indisponível, `entrada_invalida`), todas dizendo "retirar" e nunca "enviar" nem o nome do arquivo; código desconhecido vira erro genérico. `textoDaFalhaDaRetirada(erro)`: a frase da `TravaDoBanco`, ou "Não foi possível retirar o anexo: {motivo}.".
- [ ] `src/anexos/anexosSupabase.ts` + teste (cliente falso, como o resto): `retirarAnexo` chama a função com `{ acao: 'retirar', anexo_id }` e o tradutor da retirada; a recusa vira `TravaDoBanco` com a frase; a falha de conexão vira `Error` com o motivo; o nome do arquivo nunca vai no corpo.
- [ ] `src/anexos/AnexosFalso.ts` + teste: `retirarAnexo` registra em `retiradas`, respeita `falhaNaRetirada` (`string | Error`), e senão tira o anexo de `anexos[processoId]` e entrega ao histórico o evento `retirar`/`anexo` (`antes` com o nome, o formato e a etapa do envio, `depois` nulo) pela mesma ponte `aoRegistrar`; anexo que já não existe na falsa lança a `TravaDoBanco` "O anexo já foi retirado.". Se o `AnexosFalso.ts` passar de 300 linhas, o que for novo vai para arquivo à parte.
- [ ] `src/cadastros/historicoDosCadastros.ts` + `historicoDosAnexos.test.ts`: `TEXTO_DA_ACAO_DO_ANEXO` ganha `retirar: 'Retirou o anexo'`; `textoDoAnexo` para `retirar` devolve "Retirou o anexo '{nome}'" lendo o nome do `antes` (sem a etapa, como o ticket); `descreverEstadoDoCadastro` e o título do item servem com o `antes`, e o nome do item do filtro continua "Anexos — {processo}" (confirmar que `estadoLegivel` usa o `antes` quando o `depois` é nulo; se não usar, corrigir para o `retirar` apenas).
- [ ] `npx vitest run src/anexos src/versoes src/cadastros src/processos`, lint, typecheck e a checagem de circulares limpos; commit.

## Tarefa 7: A tela (critério 2 do ticket)

Teste de tela primeiro, com o aplicativo inteiro, visto falhar (botão inexistente).

- [ ] `src/hooks/useRetiradaDeAnexo.ts` (até 40 linhas): `useRetiradaDeAnexo(modulo, aoTerminar)` devolve `{ aConfirmar, pedir(anexo), cancelar, confirmar, falha }`: `confirmar` fecha a janela, limpa a falha, chama `modulo.retirarAnexo(aConfirmar.id)`, guarda `textoDaFalhaDaRetirada` em `falha` quando falha, e **sempre** chama `aoTerminar()` (recarrega a lista) ao fim (decisão 9). Teste do hook pelos testes de tela.
- [ ] `src/App.anexosRetirada.test.tsx` (novo) — casos do critério 2: [Retirar] em cada linha para Administrador e Integrante em andamento; a confirmação com o nome e a frase da lixeira ("Retirar 'resposta.eml'?" e "O arquivo vai para a lixeira do Drive e some em 30 dias."); retirar com a linha sumindo e `retiradas` registrada; cancelar não muda nada (nenhuma chamada); falha da retirada com o anexo na lista e a frase em vermelho (`role="alert"`); anexo já retirado (a falsa lança "O anexo já foi retirado."): a frase aparece e a linha some; o evento "Retirou o anexo '…'" no histórico do processo; dois anexos de mesmo nome: retira só o escolhido (pelo id); a lista de arquivos das versões, o relatório e o .pdf da aprovação **sem** [Retirar] (um processo com versão, relatório e .pdf em volta, só os anexos têm o botão).
- [ ] `src/App.anexosPerfis.test.tsx` — acrescentar: Consulta sem [Retirar], e processo suspenso, cancelado, concluído e arquivado sem [Retirar] (mantendo [Baixar]).
- [ ] `ListaDeAnexos.tsx`: props novas `podeRetirar: boolean` e `aoPedirRetirada: (anexo: Anexo) => void`; [Retirar] (botão secundário, nome acessível `Retirar {nome}`) depois do [Baixar], só com `podeRetirar`. `SecaoDeAnexos.tsx`: `podeRetirar` = `podeEnviar` (Administrador ou Integrante, processo em andamento e não arquivado); uma `JanelaDeConfirmacao` em `AnexosProntos` (decisão 8) e a falha em vermelho (`cadastros-falha`, `role="alert"`) no topo da seção; se `AnexosProntos` passar de ~40 linhas, extrair a janela com a falha para `RetiradaDeAnexo.tsx` ao lado. `Anexos.css`: `overflow-wrap: anywhere` no título da janela só se o nome longo estourar a janela (ver o `[visual]`).
- [ ] `npm test`, `npm run lint`, `npm run typecheck` e a checagem de circulares limpos; commit.

## Tarefa 8: Fechamento

- [ ] `[visual]` do critério 4: subir a vitrine local (`preview_start`, 1366×768) com módulos falsos e ver a confirmação com um nome de arquivo longo: título e a frase da lixeira inteiros, sem passar da altura do notebook, e o foco no [Cancelar]. Se a captura não funcionar, só medir e **dizer que ficou presumido** (a tela com o login real nunca foi vista).
- [ ] Documentação: `docs/manutencao/04-modelo-de-dados.md` (a política de apagar, os gatilhos, o evento `retirar`; tirar o "ninguém apaga"); o documento da função no `docs/manutencao/` (ação `retirar`, a ordem, a lixeira, o caso do arquivo que o Drive não acha, a volta da lixeira em falha do banco); `docs/drive-conta-de-servico.md`: reforço de que o **Gerente de conteúdo** é o papel que manda à lixeira (o Colaborador não), e o passo do usuário de conferir o papel nos Drives compartilhados. `CONTEXT.md` conferido (os termos **Anexo** e **Retirar anexo** já estão).
- [ ] `desvios.md` do documentos-versoes (entrada de 2026-10-26, ticket 13): números das execuções do "Testes de banco" e do "Migrar banco", decisões de execução 1 a 10 (a 1, a 3, a 4 e a 5 em especial), o ajuste do teste 61, o que ficou presumido (camada Deno, `[visual]`, função não publicada, papel da conta de serviço e lixeira no Drive real). `.scratch/melhorias-protocolo.md`: itens de `.claude/regras/nao-testados.md` que aconteceram. `.scratch/backlog.md`: o que surgir.
- [ ] Passo do usuário, no `.scratch/proximo-passo.md`: publicar a função `arquivos-no-drive` de novo no desenvolvimento (a ação `retirar` e o papel `anexo` só funcionam publicados), conferir o papel da conta de serviço e provar no Drive real: enviar, retirar (arquivo na lixeira do Drive, linha some, evento no histórico) e a volta da lixeira.
- [ ] Marcar as caixas deste plano, acrescentar `Concluído em AAAA-MM-DD (commit <hash>)` ao fim do ticket 13, sobrescrever `.scratch/proximo-passo.md` (o ticket 13 fecha a parte 4: próximo, `/polir` e depois `/ship`, em Sonnet), commit e `git push` da branch. Decisão 10: perguntar sobre a junção à `main`.
