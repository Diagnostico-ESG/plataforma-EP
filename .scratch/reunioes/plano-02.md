# Ticket 02 de reunioes (Editar, excluir e histórico da reunião) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a reunião registrada pode ser editada (todos os campos, inclusive tipo e setor), excluída com confirmação e ter o histórico visto na aba Histórico do painel e no histórico geral dos cadastros.

**Architecture:** o banco do ticket 01 já grava um evento por gravação (entidade `reuniao`, estado completo no antes e no depois), já tem a política de leitura dos eventos de reunião e já aceita editar e apagar; este ticket só acrescenta casos ao teste pgTAP 23 (sem migração nova). A interface ganha no `ModuloDeReunioes` `excluirReuniao` e `lerHistoricoDaReuniao`; o painel da reunião ganha as abas Detalhes e Histórico, [Editar] (o mesmo formulário, preenchido) e [Excluir] (a janela de confirmação que já existe); o histórico geral passa a listar a entidade `reuniao`, com textos próprios.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/reunioes/spec.md` (histórias 29 a 31, 37 a 39; "Interface", "Quem pode o quê", "Regras que o banco impõe") · **Ticket:** `.scratch/reunioes/issues/02-editar-excluir-e-historico.md` (critérios citados como "critério N", na ordem do ticket: 1 banco, 2 editar, 3 excluir, 4 falha e recusa, 5 aba Histórico e textos, 6 histórico geral, 7 reunião que sumiu, 8 Consulta, 9 testes de interface).

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Regras de `.claude/regras/banco.md` lidas nesta sessão. Este ticket **não cria migração**: o banco só ganha casos de teste. Alvo conferido antes de qualquer comando de banco (vínculo atual `yclkzyoebpsxmgpbcbus`, igual a `supabase/.temp/project-ref`). O banco só é tocado pelo GitHub Actions ("Testes de banco" na branch, autorizado no CLAUDE.md, "Ajustes deste Projeto"); produção fica fora.
- Funções de lógica 4 a 20 linhas (hooks até 40), arquivos até 300 linhas, complexidade até 10, tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação. Componentes divididos por responsabilidade.
- Mensagem de erro inclui o valor recebido e o formato esperado. Dados de teste só inventados. Nada de `dados-reais/` nem `.env`.
- Texto da tela em português com acentuação correta. Falha e recusa em vermelho (`cadastros-falha`, `role="alert"`).
- Teste vem antes do código (TDD); teste que falha por erro de digitação não conta como o "vermelho" esperado.

## Decisões do plano

- **Sem migração.** O teste 23 (ticket 01) já prova alterar e excluir por Administrador, Integrante e a exclusão com o estado completo no "antes". Faltam casos de Consulta, inativo e visitante editando e apagando, de editar reunião inexistente, de trocar só os processos e de editar por Administrador; entram no 23 e **passam de primeira** (o banco já faz isso). Isso vai para o `desvios.md`: o critério 1 é de conferência, não de código novo; o vermelho do ticket está nos testes de interface.
- **Outros participantes não se perdem na edição** (aviso do `desvios.md` do ticket 01): `Reuniao` e `DadosDaReuniao` ganham `outrosParticipantes: string[]`; a leitura traz `outros_participantes`, o formulário guarda o valor sem mostrar e a gravação o devolve. O ticket 03 só acrescenta a área de texto.
- **Eventos no falso.** `ReunioesFalso` imita o banco: cada `salvarReuniao` e `excluirReuniao` aceito acrescenta um evento (`criar`, `editar`, `excluir`) com o estado completo antes e depois; gravação sem mudança não acrescenta. Assim os testes de tela provam a aba Histórico de ponta a ponta.
- **"O que mudou".** Na alteração, o histórico mostra só os campos que diferem no Antes e no Depois (função pura `apenasOQueMudou`); criação e exclusão mostram o estado completo.
- **Exclusão aparece no histórico geral, não na aba da reunião**: a reunião excluída já não abre. A aba trata criação e alteração (o componente é o mesmo e trata exclusão se um dia ela aparecer).
- **Setor inativo na edição.** A escolha do setor mostra os ativos mais o setor da reunião, se estiver inativo, marcado "(inativo)", para o formulário abrir com o setor certo (história 27 e regra: reunião antiga em setor desativado continua válida).
- **Reunião excluída por outra pessoa.** Salvar ou excluir devolve `CadastroInexistente` (a gravação no real: zero linhas e a reunião não é mais legível; `registro_inexistente` da função de salvar); o painel troca o conteúdo pelo aviso "Esta reunião não existe mais…" e a lista de trás recarrega.
- **Esc no painel** continua fechando o painel inteiro, como no formulário de nova reunião e no de processo.
- **Frases novas** (vão para o `desvios.md`): título "Excluir a reunião de {tipo} de {data}?" e texto "O histórico guarda o que ela tinha, mas não é possível desfazer."; botão "Excluir reunião"; ações do histórico "Criou", "Editou", "Excluiu" (as mesmas das outras entidades).

## Estrutura de arquivos

Criar: `src/reunioes/textosDoHistorico.ts` (+ teste), `src/reunioes/estadoDoEvento.ts` (+ teste; estado do evento a partir de uma `Reuniao`, usado pelo falso), `src/reunioes/setoresDaEscolha.ts` (+ teste), `src/components/reunioes/AcoesDaReuniao.tsx`, `DetalhesDaReuniao.tsx`, `HistoricoDaReuniao.tsx`, `src/components/cadastros/EventosDoHistorico.tsx`, `src/App.editarReuniao.test.tsx`, `src/App.excluirReuniao.test.tsx`, `src/App.historicoDaReuniao.test.tsx`.

Modificar: `supabase/tests/23_reunioes.test.sql`, `src/reunioes/tipos.ts`, `reuniaoDaLinha.ts`, `reunioesSupabase.ts` (+ teste), `recusasDeReunioes.ts` (+ teste), `ReunioesFalso.ts`, `validacaoDaReuniao.ts` (+ teste), `src/testes/reunioesDeTeste.tsx`, `src/cadastros/historicoDosCadastros.ts` (+ teste), `historicoSupabase.ts` (+ teste), `src/components/reunioes/PainelDaReuniao.tsx`, `AreaDeReunioes.tsx`, `FormularioDaReuniao.tsx`, `CamposDaReuniao.tsx`, `src/components/cadastros/ListaDoHistorico.tsx`, `src/components/processos/HistoricoDoProcesso.tsx`, `src/App.registrarReuniao.test.tsx` e `App.painelDaReuniao.test.tsx` (ajustes dos dados de teste).

## Tarefas

### Tarefa 1 — Branch, marco e casos novos no teste de banco 23 (critério 1)

**Arquivos:** `supabase/tests/23_reunioes.test.sql`.

- [ ] `git switch -c reunioes-02` (já criada a partir da `main`); `git tag marco/2026-10-14-inicio-ticket-02-reunioes`. Conferir o alvo: `supabase/AMBIENTES.md` ("vínculo atual") e `supabase/.temp/project-ref`.
- [ ] No teste 23, trocar `plan(53)` por `plan(66)` e acrescentar **13 asserções** (conferir a contagem no fim: 53 + 13):
  - Função auxiliar `pg_temp.alterar_reunioes()` (como `apagar_reunioes`, com `update public.reunioes set local = 'x' returning id` e `grant execute ... to authenticated`).
  - Como integrante (a2), logo antes de `-- Quem pode o quê.`: (1) `salvar_reuniao` altera só a data da reunião `txt` e vive; (2) `pg_temp.eventos('txt', 'editar') = 1`; (3) cria `mod3` (modelagem no TR1 com "Proc A") e vive; (4) troca só os processos de `mod3` para "Proc D" e vive; (5) `pg_temp.eventos('mod3', 'editar') = 1`; (6) o evento traz `antes.processos[0].nome = 'Proc A'` e `depois.processos[0].nome = 'Proc D'`; (7) `salvar_reuniao` com id inexistente (`'ef000000-0000-0000-0000-0000000000ff'`) lança `P0001` `registro_inexistente`.
  - Como administrador (a1), depois do registro de `adm1` e antes da exclusão: (8) `salvar_reuniao` altera `adm1` e vive.
  - Como consulta (a3): (9) `salvar_reuniao` da reunião `txt` lança `42501`; (10) `pg_temp.alterar_reunioes() = 0`.
  - Como inativo (a4): (11) `salvar_reuniao` da `txt` lança `42501`; (12) `pg_temp.apagar_reunioes() = 0`.
  - Como visitante (`set local role anon`): (13) `delete from public.reunioes` lança `42501`.
- [ ] Comitar ("Ticket 02 de reunioes: casos de editar e excluir por perfil no teste de banco"), `git push -u origin reunioes-02`, disparar "Testes de banco" na branch e ler o resultado: o 23 deve passar com `66 de 66` e os demais verdes (não há vermelho esperado; se algo falhar, é erro do teste novo ou comportamento a investigar antes de seguir).

### Tarefa 2 — Textos do histórico e estado do evento: funções puras (critério 5)

**Arquivos:** criar `src/reunioes/textosDoHistorico.ts`, `src/reunioes/textosDoHistorico.test.ts`, `src/reunioes/estadoDoEvento.ts`, `src/reunioes/estadoDoEvento.test.ts`; modificar `src/cadastros/historicoDosCadastros.ts` e `historicoDosCadastros.test.ts`.

**Interfaces — Produz:** `nomeDaReuniaoNoHistorico(estado: Record<string, unknown>): string` (ex.: "Reunião de modelagem de 14/10/2026 — TSA"); `valorDoCampoDaReuniao(campo: string, valor: unknown): string | null` (`data` em DD/MM/AAAA, `outros_participantes` por vírgula ou "nenhum"; `null` para os campos que não são dela); `apenasOQueMudou(antes: EstadoDoCadastro, depois: EstadoDoCadastro): [EstadoDoCadastro, EstadoDoCadastro]` (só as chaves cujo valor difere, por comparação de JSON); `estadoDoEventoDaReuniao(reuniao: Reuniao): Record<string, unknown>` (`tipo`, `setor_id`, `setor_sigla`, `data`, `hora`, `local`, `anotacoes`, `outros_participantes`, `processos: [{id, nome}]` — as chaves do banco, ver `private.estado_da_reuniao`).

- [ ] Testes que falham: o nome da reunião no histórico; `data` formatada; `outros_participantes` vazio vira "nenhum" e com nomes vira "Ana, Bia"; `apenasOQueMudou` devolve só `local` quando só ele mudou, e `[{}, {}]` quando nada mudou; `estadoDoEventoDaReuniao` com as chaves do banco; em `historicoDosCadastros.test.ts`: `textoDaAcaoDoCadastro('editar', 'reuniao')` = "Editou"; `nomeDoItem` de evento de reunião; `descreverEstadoDoCadastro` de reunião mostra "Tipo: Modelagem; Setor: TSA; Data: 14/10/2026; Processos: Emitir Ofício, Arquivar Pasta" (o rótulo do tipo vem de `ROTULO_DO_TIPO_DE_REUNIAO`, juntado ao mapa `tipo` de `valorPorRotulo`) sem mostrar ids.
- [ ] Implementar o mínimo: em `historicoDosCadastros.ts` acrescentar rótulos de campo (`data: 'Data'`, `hora: 'Hora'`, `local: 'Local'`, `anotacoes: 'Anotações'`, `outros_participantes: 'Outros participantes'`, `processos: 'Processos'`), o ramo `reuniao` em `nomeDoItem`, a chamada de `valorDoCampoDaReuniao` em `valorLegivel` e o mapa do tipo juntando os dois rótulos (chaves não colidem). Manter `historicoDosCadastros.ts` ≤ 300 linhas e as funções ≤ 20 linhas.
- [ ] `npx vitest run src/reunioes src/cadastros` passa. Comitar.

### Tarefa 3 — Tipos e módulo de reuniões: leitura de outros participantes, excluir e histórico (critérios 3, 4, 5)

**Arquivos:** `src/reunioes/tipos.ts`, `reuniaoDaLinha.ts`, `reunioesSupabase.ts`, `recusasDeReunioes.ts`, e seus testes; `src/cadastros/historicoSupabase.ts` e teste.

**Interfaces — Produz:** `Reuniao.outrosParticipantes: string[]`; `DadosDaReuniao.outrosParticipantes: string[]`; `ModuloDeReunioes.excluirReuniao(id: string): Promise<void>` (reunião inexistente ou sem permissão: `CadastroInexistente` / `TravaDoBanco`); `ModuloDeReunioes.lerHistoricoDaReuniao(id: string): Promise<EventoDoCadastro[]>` (do mais recente para o mais antigo); `RECUSAS_DAS_REUNIOES: RecusasDoModulo` exportado de `recusasDeReunioes.ts`.

- [ ] Testes que falham em `reunioesSupabase.test.ts`: `listarReunioes` e `lerReuniao` trazem `outrosParticipantes` (coluna `outros_participantes` na leitura); `salvarReuniao` manda `p_outros` com `dados.outrosParticipantes`; `excluirReuniao` pede `delete` em `reunioes` com `eq('id', id)` e `select('id')`; sem linha afetada e reunião ainda legível → `TravaDoBanco` "Seu perfil não permite alterar as reuniões."; sem linha afetada e reunião ilegível → `CadastroInexistente`; erro `42501` → `TravaDoBanco`; `lerHistoricoDaReuniao` pede `eventos` com `entidade = 'reuniao'` e `entidade_ref = id`, ordem decrescente por `ocorrido_em` e `id`, e devolve `EventoDoCadastro` (via `eventoDoCadastro`). Em `historicoSupabase.test.ts`: o pedido do histórico dos cadastros inclui `'reuniao'` em `in('entidade', ...)`.
- [ ] Implementar: `COLUNAS_DA_REUNIAO` e `LinhaDaReuniao` com `outros_participantes: string[]`; `reuniaoDaLinha` o copia; `criarReunioesSupabase` ganha as duas operações (a de excluir no molde de `conferirGravacao` de `gravarProcessoSupabase.ts`); `ENTIDADES_DOS_CADASTROS` ganha `'reuniao'`.
- [ ] Ajustar os testes e dados que montam `Reuniao`/`DadosDaReuniao` à mão (`reunioesSupabase.test.ts`, `validacaoDaReuniao.test.ts`). `npx tsc -b` aponta os que faltam. Comitar quando a suíte de `src/reunioes` e `src/cadastros` passar.

### Tarefa 4 — Falso de reuniões com excluir, eventos e leitura do histórico (critérios 3, 5, 7)

**Arquivos:** `src/reunioes/ReunioesFalso.ts` (+ `ReunioesFalso.test.ts`, novo), `src/testes/reunioesDeTeste.tsx`.

- [ ] Testes que falham do falso: `excluirReuniao` tira a reunião da lista e acrescenta um evento `excluir` com o estado completo no `antes`; excluir id que não existe lança `CadastroInexistente`; `salvarReuniao` de reunião existente acrescenta um evento `editar` com antes e depois; salvar sem mudar nada não acrescenta evento; salvar com id que não existe lança `CadastroInexistente` (como o banco, `registro_inexistente`); criar acrescenta um `criar`; `lerHistoricoDaReuniao(id)` devolve os eventos daquela reunião do mais recente para o mais antigo; `falharHistoricoDaReuniao` e `segurarHistoricoDaReuniao` simulam erro e carregamento; `falhaDeGravacao` vale para excluir.
- [ ] Implementar no falso: campo `historico: EventoDoCadastro[]` (ordem de gravação; a leitura inverte), campos de teste `falharHistoricoDaReuniao`/`segurarHistoricoDaReuniao`, autor "Pessoa de Teste" (o nome do `USUARIO_DE_TESTE`), `ocorridoEm = new Date().toISOString()`, estado do evento por `estadoDoEventoDaReuniao`. `montar` guarda `outrosParticipantes`. Em `testes/reunioesDeTeste.tsx`, `reuniao()` ganha `outrosParticipantes: []`.
- [ ] `ReunioesFalso.ts` fica ≤ 300 linhas (se passar, extrair as recusas para um arquivo próprio). Comitar.

### Tarefa 5 — Formulário preenchido e escolha do setor (critério 2)

**Arquivos:** `src/reunioes/validacaoDaReuniao.ts` (+ teste), criar `src/reunioes/setoresDaEscolha.ts` (+ teste), `src/components/reunioes/FormularioDaReuniao.tsx`, `CamposDaReuniao.tsx`, `PainelDeNovaReuniao.tsx` (só se a assinatura mudar).

**Interfaces — Produz:** `camposDaReuniao(reuniao: Reuniao): CamposDaReuniao` (texto vazio no lugar de `null`; `processosIds` dos processos; `outrosParticipantes` copiado); `CamposDaReuniao.outrosParticipantes: string[]` (campo guardado, ainda sem tela); `dadosDaReuniao` passa a devolver `outrosParticipantes`; `setoresDaEscolha(ativos: SetorParaReuniao[], reuniao?: Reuniao): SetorParaReuniao[]` (os ativos mais o setor da reunião quando inativo, com `inativo: true`); `SetorParaReuniao.inativo?: boolean`; `FormularioDaReuniao` ganha a prop opcional `reuniao?: Reuniao` (formulário parte dos campos da reunião e a escolha de setor usa `setoresDaEscolha`).

- [ ] Testes que falham: `camposDaReuniao` (reunião com hora, local e anotações nulos; modelagem com dois processos); `dadosDaReuniao(camposDaReuniao(r))` devolve os mesmos dados da reunião (ida e volta); `setoresDaEscolha` acrescenta o setor inativo da reunião e não duplica o setor ativo; comportamento de `comMudanca` ao trocar setor ou tipo na edição continua desmarcando o que não cabe (caso novo no teste).
- [ ] Implementar. O `<option>` do setor inativo mostra "TSC (inativo)"; os ativos seguem "TSA — Setor A". Comitar.

### Tarefa 6 — Painel com abas, [Editar] e [Excluir] (critérios 2, 3, 4, 7, 8)

**Arquivos:** `src/components/reunioes/PainelDaReuniao.tsx`, criar `DetalhesDaReuniao.tsx`, `AcoesDaReuniao.tsx`, `HistoricoDaReuniao.tsx`; `AreaDeReunioes.tsx`; criar `src/components/cadastros/EventosDoHistorico.tsx`; `ListaDoHistorico.tsx`, `src/components/processos/HistoricoDoProcesso.tsx`; testes `src/App.editarReuniao.test.tsx`, `src/App.excluirReuniao.test.tsx`, `src/App.historicoDaReuniao.test.tsx`.

**Interfaces — Consome:** `useCarregamento` (`recarregar`), `useGravacaoComFalha(aoSumir)` (`{ falha, executar }`), `JanelaDeConfirmacao`, `ItemInexistente`, `BotaoFechar`, `CadastroInexistente`, `FormularioDaReuniao` com `reuniao`. **Produz:** `PainelDaReuniao` com as props `{ reunioes, id, podeAlterar, aoFechar, aoMudar }` (`aoMudar`: a lista de trás recarrega); `EventosDoHistorico({ estado, aoTentarDeNovo })` (carregando, erro com [Tentar de novo], vazio "Nenhuma alteração registrada ainda.", lista de `EventoDoHistorico`), usado por `HistoricoDoProcesso` e `HistoricoDaReuniao`.

- [ ] Testes de tela que falham (todos com o aplicativo inteiro e `ReunioesFalso`; arte anterior: `App.painelDoProcesso`, `App.excluirSetor`, `App.painelDaReuniao`):
  - **`App.editarReuniao.test.tsx`** (critérios 2, 4, 7, 8): [Editar] abre o formulário preenchido (tipo, setor, data, hora, local, anotações e processos marcados); trocar o setor desmarca os processos; passar para sensibilização desmarca os processos; salvar grava com o id, mostra os dados novos no painel e a lista de trás reflete (por exemplo, a data muda de lugar); Cancelar volta aos dados sem gravar; reunião em setor inativo abre com o setor "(inativo)" escolhido; falha genérica e recusa (processo de outro setor) em vermelho com o preenchido mantido; reunião excluída por outra pessoa durante a edição mostra o aviso "Esta reunião não existe mais…"; a Consulta não vê [Editar] nem [Excluir].
  - **`App.excluirReuniao.test.tsx`** (critérios 3, 4, 7): [Excluir] abre a janela com o título e o texto; Cancelar e Esc não apagam; confirmar tira a reunião da lista e fecha o painel (endereço volta a `#/reunioes`); falha ao excluir em vermelho ao lado dos botões, painel e lista mantidos; recusa de perfil ("Seu perfil não permite alterar as reuniões."); excluir reunião que já sumiu mostra o aviso e recarrega a lista.
  - **`App.historicoDaReuniao.test.tsx`** (critério 5): a aba Histórico lista, do mais recente ao mais antigo, a criação e a alteração com data, autor e o que mudou (só os campos alterados); salvar sem mudar nada não acrescenta linha; carregando, vazio e erro com [Tentar de novo]; a Consulta também vê a aba.
- [ ] Implementar na ordem: (a) extrair `EventosDoHistorico` e usá-lo em `HistoricoDoProcesso` (os testes de histórico do processo continuam passando); (b) `ListaDoHistorico`/`EventoDoHistorico` mostram só o que mudou nas alterações de reunião (`apenasOQueMudou`); (c) `HistoricoDaReuniao`; (d) `DetalhesDaReuniao` (dados ou formulário, mais `AcoesDaReuniao` para quem pode alterar, no molde de `AcoesDoProcesso`); (e) `PainelDaReuniao` com abas "Detalhes" e "Histórico" (molde de `PainelDoProcesso`), estado `sumiu` e `aoMudar`; (f) `AreaDeReunioes` passa `podeAlterar`, recarrega a lista no `aoMudar` e, depois de excluir, vai a `irParaLista({ aberto: null })` (a linha excluída não existe para devolver o foco).
- [ ] Ajustar `App.painelDaReuniao.test.tsx` à aba nova (o teste "Consulta sem botões" passa a esperar o botão Fechar e as abas). Comitar quando os três arquivos de teste novos e os antigos de reuniões passarem.

### Tarefa 7 — Histórico geral com eventos de reunião (critério 6)

**Arquivos:** `src/App.historicoDosCadastros.test.tsx` (ou um novo `App.historicoGeralComReunioes.test.tsx` se o primeiro passar de 300 linhas).

- [ ] Teste de tela que falha: com eventos de reunião no `CadastrosFalso.historico` (criar e editar) misturados aos de setor, a aba Histórico dos Setores lista os eventos de reunião no lugar certo, com texto "Criou/Editou Reunião de modelagem de 14/10/2026 — TSA" e o item aparece no filtro "Item".
- [ ] Deve passar com as mudanças da tarefa 2 e 3; se não passar, ajustar `itensDoFiltro`/`nomeDoItem`. Comitar.

### Tarefa 8 — Portões de qualidade, registros e fecho

- [ ] `npm test` (cobertura ≥ 70%), `npx tsc -b`, `npm run lint`, arquivos ≤ 300 linhas; conferir o "Testes de banco" na branch (já rodado na tarefa 1; rodar de novo só se `supabase/` mudou depois).
- [ ] Marcar as caixas deste plano; acrescentar a `.scratch/reunioes/desvios.md` as decisões e frases novas (seção "Ticket 02") e, em `.scratch/melhorias-protocolo.md`, os itens não testados do `/executar-complexo` (ticket sem migração, teste de banco que já passa de primeira, eventos imitados no falso).
- [ ] Merge na `main` (`git switch main`, `git merge reunioes-02`, `git branch -d reunioes-02`), `git push origin main` (autorizado, sem `--force`) e conferir o "Testes de banco" da `main` (o envio mexe em `supabase/tests`).
- [ ] Linha `Concluído em AAAA-MM-DD (commit <hash>)` no fim do ticket 02; comitar; apontar o próximo ticket (03) e pedir o `/cost`.
