# Todos | Concluídos, cancelados e etiqueta Iniciado — Plano do ticket 02

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`); marque `- [x]` ao concluir cada um.

**Goal:** A Lista e a visualização por setor passam a ser o portfólio (par Todos | Concluídos, concluídos sempre presentes, cancelados escondidos até pedir), e a etiqueta `em_andamento` passa a se chamar "Iniciado".

**Architecture:** Só interface; nenhum banco, nenhuma migração, nenhuma Edge Function. `mostrar` ('todos' | 'concluidos') entra em `EnderecoDosProcessos` ao lado de `agrupar` (fora dos filtros, para o "Limpar filtros" não o desligar). Um módulo puro novo, `portfolio.ts`, decide o que a Lista e o Quadro por setor mostram (sem cancelados; "Concluídos" só concluídos) e é usado pelas duas visões. O bloco de cancelados é estado local da tabela, fora do endereço.

**Tech Stack:** React + Vite + TypeScript, Vitest (módulos falsos; nada toca o banco).

**Spec:** `.scratch/repositorio-de-processos/spec.md` (seções "Escolha Todos | Concluídos", "Cancelados", "Etiqueta Iniciado", "Endereço da página", "Estados da tela"). **Ticket:** `issues/02-todos-concluidos-cancelados-e-iniciado.md`. ADR 0034.

## Global Constraints

- Sem banco: `.claude/regras/banco.md` não se aplica (sem migração, política, view, função, bucket ou envio de arquivos). `supabase/` não muda.
- Código: funções de lógica de 4 a 20 linhas, arquivos até 300 linhas, sem `any`, mensagens de erro com valor e formato esperado, early return, no máximo 2 níveis de indentação. Dados de teste só inventados. Sem dependência nova.
- Teste primeiro (TDD): cada tarefa escreve o teste, vê falhar, implementa, vê passar.
- Os testes de data usam `dia()` de `src/testes/quadroDeTeste.tsx`; rode com `TZ=America/Sao_Paulo` ou no relógio local de Brasília (a fragilidade de fuso está no backlog, não é deste ticket).
- Rótulos e frases em português. O valor `em_andamento` da etiqueta e a cor âmbar não mudam.
- Marca "Concluído em" e commit ficam para o fim (passo do `/executar-complexo`).

## Decisões deste plano (rulings)

- **Onde mora `mostrar`:** campo próprio de `EnderecoDosProcessos` (não é filtro). Só vale na Lista e no Quadro por setor; nas outras visões é ignorado e não vai para o endereço. Com `mostrar=concluidos` o filtro `situacao` é ignorado na leitura e não é escrito.
- **"Limpar filtros" no estado vazio** também volta `mostrar` para Todos (senão "Concluídos" sem concluído não tem saída).
- **Linha "Mostrar cancelados (N)" com N = 0** não aparece (não há o que mostrar).
- **Filtro Situação** deixa de oferecer "Cancelado"; `situacao=cancelado` num endereço antigo é ignorado.
- **Quadro por etapa e por responsável** não mudam neste ticket (a regra do concluído no Quadro por responsável é do ticket 03).

## Mapa de arquivos

- Criar: `src/processos/portfolio.ts` (+ `portfolio.test.ts`); `src/App.todosConcluidos.test.tsx`.
- Alterar: `src/processos/rotulos.ts`, `frasesDoMovimento.ts`, `enderecoDosProcessos.ts`, `filtrosDosProcessos.ts`, `colunasDoQuadro.ts` (+ testes); `src/components/processos/{ControlesDoQuadro,FiltrosDosProcessos,VisaoDosProcessos,QuadroDeProcessos,TabelaDeProcessos,AreaDeProcessos}.tsx`, `Quadro.css`; testes de tela que citam a etiqueta "Em andamento".

---

### Tarefa 1: Etiqueta "Iniciado"

**Files:** `src/processos/rotulos.ts`, `src/processos/frasesDoMovimento.ts`; testes que citam a etiqueta.

- [x] **1.1** (teste primeiro) Em `src/processos/rotulos.test.ts` (criar se não existir): `ROTULO_DA_ETIQUETA` = `{ a_fazer: 'A fazer', em_andamento: 'Iniciado', concluido: 'Finalizado' }` e `ROTULO_DA_SITUACAO.em_andamento` continua 'Em andamento'. Em `frasesDoMovimento.test.ts` (ou onde a frase é testada): a mensagem da etiqueta inválida diz "A fazer, Iniciado ou Finalizado". Rodar: falha.
- [x] **1.2** `rotulos.ts`: `em_andamento: 'Iniciado'` na etiqueta (comentário: só o rótulo muda; o valor guardado e a cor âmbar ficam, ADR 0034). `frasesDoMovimento.ts` linha da etiqueta inválida: "use A fazer, Iniciado ou Finalizado." Rodar: passa.
- [x] **1.3** `npx vitest run` e corrigir os testes que esperavam a etiqueta "Em andamento" (cartão, verso, lista de escolha, histórico, `agoraDoProcesso.test.ts`, `historicoDosCadastros.test.ts`, `App.agoraDoVerso`, `App.cartaoDoQuadro`, `App.versoDoCartao`, `App.historicoNaJanela` etc.): só onde o texto é o da **etiqueta**, nunca o da **situação** ("Em andamento" na pílula da Lista continua). Acrescentar em `historicoDosCadastros.test.ts` um caso: evento antigo com etiqueta `em_andamento` mostra "Iniciado".
- [x] **1.4** `npx vitest run src/processos src/cadastros src/App.agoraDoVerso.test.tsx src/App.cartaoDoQuadro.test.tsx src/App.versoDoCartao.test.tsx src/App.historicoNaJanela.test.tsx` — verde.

### Tarefa 2: Endereço com `mostrar`

**Files:** `src/processos/enderecoDosProcessos.ts`, `enderecoDosProcessos.test.ts`; `src/components/processos/ProcessosDoSetor.tsx` (se o tipo exigir).

**Interfaces:** Produces — `type MostrarNoPortfolio = 'todos' | 'concluidos'`; `EnderecoDosProcessos.mostrar: MostrarNoPortfolio`; `lerEnderecoDosProcessos` e `montarEnderecoDosProcessos` o tratam; `SITUACOES` sem 'cancelado'.

- [x] **2.1** (teste primeiro) Em `enderecoDosProcessos.test.ts`:
  - `#/processos/lista?mostrar=concluidos` → `mostrar: 'concluidos'`; sem o parâmetro ou valor desconhecido → 'todos';
  - `#/processos?agrupar=setor&mostrar=concluidos` → 'concluidos'; `#/processos?mostrar=concluidos` (por etapa) e `#/processos?agrupar=responsavel&mostrar=concluidos` → 'todos';
  - montar: Lista com 'concluidos' → `#/processos/lista?mostrar=concluidos` (depois dos filtros, na ordem fixa: `...&mostrar=concluidos`); por setor idem; por etapa não escreve; 'todos' nunca escreve;
  - com `mostrar=concluidos` o `situacao` é ignorado na leitura e não é escrito; `situacao=cancelado` é ignorado;
  - ida e volta: `montar(ler(x)) === x` para `#/processos/lista?setor=s1&mostrar=concluidos` e `#/processos?agrupar=setor&mostrar=concluidos`.
  Rodar: falha.
- [x] **2.2** Implementar: tipo `MostrarNoPortfolio`, campo `mostrar` em `EnderecoDosProcessos`, constante `vale_mostrar(visao, agrupar)` (função `mostrarSeVale`) que devolve o valor só na Lista ou no Quadro por setor; `SITUACOES` sem 'cancelado'; `situacao` nula quando `mostrar === 'concluidos'`. Ajustar `ProcessosDoSetor.tsx` e qualquer outro que monte `EnderecoDosProcessos` completo (tsc aponta). Rodar: passa.

### Tarefa 3: Regra do portfólio (módulo puro)

**Files:** criar `src/processos/portfolio.ts` e `portfolio.test.ts`.

**Interfaces:** Produces — `visiveisNoPortfolio(processos, mostrar): ProcessoDaLista[]` (sem cancelados; 'concluidos' só `situacao === 'concluido'`); `canceladosDe(processos): ProcessoDaLista[]`.

- [x] **3.1** (teste primeiro) `portfolio.test.ts`: em 'todos' saem em andamento, suspenso e concluído (inclusive `noQuadro: false`), o cancelado fica de fora; em 'concluidos' só o concluído; `canceladosDe` devolve só os cancelados; lista vazia → vazia. Rodar: falha.
- [x] **3.2** Implementar as duas funções (4 a 6 linhas cada). Rodar: passa.

### Tarefa 4: Quadro por setor mostra o portfólio

**Files:** `src/processos/colunasDoQuadro.ts`, `colunasDoQuadro.test.ts`.

- [x] **4.1** (teste primeiro) `colunasPorSetor(setores, processos, setorFiltrado, mostrar = 'todos')`: concluído com `noQuadro: false` **aparece** em 'todos'; em 'concluidos' só os concluídos (as colunas dos setores seguem aparecendo, as vazias por último); cancelado nunca; o teste atual "o concluído fora do Quadro e o cancelado ficam de fora…" vira "o cancelado fica de fora, e o concluído fora do Quadro aparece". `colunasDoQuadro` e `colunasPorResponsavel` não mudam (testes atuais seguem verdes). Rodar: falha.
- [x] **4.2** `colunasPorSetor` usa `visiveisNoPortfolio` (e `porNome`) no lugar de `processosDoQuadro`; comentário: o portfólio mostra os concluídos sempre. Rodar `npx vitest run src/processos/colunasDoQuadro.test.ts`: passa.

### Tarefa 5: Filtro Situação sem "Cancelado"

**Files:** `src/processos/filtrosDosProcessos.ts`, `filtrosDosProcessos.test.ts`.

- [x] **5.1** (teste primeiro) `opcoesDosFiltros(...).situacoes` = Em andamento, Suspenso, Concluído (sem Cancelado). Rodar: falha.
- [x] **5.2** `situacoes`: `Object.entries(ROTULO_DA_SITUACAO).filter(([valor]) => valor !== 'cancelado')`. Rodar: passa.

### Tarefa 6: Tela — par Todos | Concluídos, Lista e Quadro por setor

**Files:** `ControlesDoQuadro.tsx`, `FiltrosDosProcessos.tsx`, `VisaoDosProcessos.tsx`, `QuadroDeProcessos.tsx`, `TabelaDeProcessos.tsx`, `AreaDeProcessos.tsx`, `Quadro.css`; criar `src/App.todosConcluidos.test.tsx` (troca o `App.listaDosArquivados.test.tsx`, já apagado no ticket 01).

- [x] **6.1** (teste primeiro, pela tela inteira, módulos falsos de `quadroDeTeste`) `App.todosConcluidos.test.tsx`:
  1. Lista: o par "Todos | Concluídos" aparece, abre em Todos (`aria-pressed`), mostra em andamento, suspenso e concluído (inclusive `noQuadro: false`) e **não** o cancelado;
  2. clicar "Concluídos" mostra só os concluídos, o hash ganha `mostrar=concluidos`, o seletor Situação some; voltar a "Todos" tira o parâmetro e o seletor volta;
  3. recarregar com `#/processos/lista?mostrar=concluidos` abre em Concluídos;
  4. Quadro por setor (`#/processos?agrupar=setor`): o par aparece, concluído fora do Quadro aparece em Todos; em Concluídos só os concluídos; nos agrupamentos por etapa e por responsável o par **não** aparece;
  5. cancelados: "Mostrar cancelados (N)" no fim da Lista com N depois dos filtros (filtro de setor muda N); clicar mostra o bloco "Cancelados" com as mesmas colunas e a linha vira "Esconder cancelados"; clicar esconde; o hash não muda; com Concluídos a linha some; sem cancelados a linha não existe;
  6. Concluídos sem nenhum concluído: "Nenhum processo com estes filtros." e "Limpar filtros", que volta a Todos;
  7. Consulta vê tudo isso (par, bloco) sem botões de alteração;
  8. o filtro Situação não oferece "Cancelado".
  Rodar: falha.
- [x] **6.2** `ControlesDoQuadro.tsx`: componente `TodosOuConcluidos({ mostrar, aoMudar })` no padrão de `AgruparPor` (grupo "Mostrar", dois botões, `aria-pressed`). `FiltrosDosProcessos.tsx`: prop `mostrar`; na Lista o seletor Situação só com `mostrar === 'todos'`.
- [x] **6.3** `AreaDeProcessos.tsx`: passa `mostrar={atual.mostrar}` e `aoMudarMostrar` (`irParaVisao({ mostrar, aberto: null })`; ao escolher Concluídos, `filtros.situacao` vira null). `VisaoDosProcessos.tsx`: calcula `filtrados`, `portfolio = visao === 'lista' || agrupar === 'setor'`, `visiveis`; mostra o par na barra quando `portfolio`; o estado "Nenhum processo com estes filtros." vale quando `visiveis` vazia e (há filtro ou `mostrar === 'concluidos'`), e o "Limpar filtros" desse estado também volta `mostrar` para 'todos'; na Lista passa `linhas` e `cancelados` (vazio com Concluídos) à tabela; passa `mostrar` ao `QuadroDeProcessos` (→ `colunasPorSetor`).
- [x] **6.4** `TabelaDeProcessos.tsx`: prop `cancelados: LinhaDaLista[]`; estado local `verCancelados`; no fim, linha com botão "Mostrar cancelados (N)" / "Esconder cancelados" (só com N > 0); com o bloco aberto, um `<tbody className="bloco-de-cancelados">` com a linha de título "Cancelados" e as mesmas linhas (`LinhaDoProcesso`). `Quadro.css`: `.bloco-de-cancelados` com fundo e texto mais suaves (tokens `--fundo-contexto`, `--texto-2`) para se distinguir (critério [visual]).
- [x] **6.5** Rodar `npx vitest run src/App.todosConcluidos.test.tsx` e `npx vitest run src/App.lista.test.tsx src/App.filtrosDosProcessos.test.tsx src/App.processosDoSetor.test.tsx src/App.concluidos.test.tsx`; ajustar os testes antigos que contavam cancelados na Lista (ex.: `App.lista.test.tsx` tem "Arquivar Pasta" cancelado na tabela: passa a ficar fora até pedir) e o `App.filtrosDosProcessos.test.tsx` se citar a opção Cancelado. Passa.

### Tarefa 7: Conferência final e entrega do ticket

- [x] **7.1** `npx tsc -b`, `npx eslint .`, `npm test` completo — tudo verde (relógio local de Brasília).
- [x] **7.2** Ver no navegador (preview): `launch.json` do projeto, Lista e Quadro por setor com a vitrine local de módulos falsos, se existir; senão registrar que os critérios [visual] (bloco de cancelados distinto; "Iniciado" cabe no cartão) ficaram presumidos.
- [x] **7.3** Um commit `repositorio-de-processos 02: Todos | Concluídos, cancelados e etiqueta Iniciado` (sem `--no-verify`), `git push -u origin repositorio-de-processos`.
- [x] **7.4** Seguir o `/executar-complexo`: juntar à `main`, `git branch -d`, `Concluído em AAAA-MM-DD (commit <hash>)` no ticket 02 (critérios marcados), `.scratch/proximo-passo.md` (próximo: ticket 03 e 04, Sonnet), `.scratch/melhorias-protocolo.md` se algo novo, comitar e enviar a `main`.

## Auto-revisão contra o ticket

- Par e abertura em Todos (critério 1) → T6.1 (1, 4); concluídos sempre na visão por setor (2) → T4, T6.1 (4); Lista Concluídos sem Situação (3) → T6.1 (2); cancelados e bloco (4) → T3, T6.1 (5); endereço (5) → T2, T6.1 (3); etiqueta (6) → T1; Consulta (7) → T6.1 (7); testes e suíte (8) → T7.1.
- Fora do ticket: Tirar do Quadro e Quadro por responsável sem concluídos (ticket 03); cabeçalhos com filtro e ordenação, "Processo" no lugar de "Nome" e a barra de filtros fora da Lista (ticket 04); árvore (ticket 05).

## Registro da execução (2026-10-28)

- **Visual conferido** na vitrine local (módulos falsos, fora do git) em 1366×768: o par "Mostrar" (Todos | Concluídos) acima da Lista, a linha "Mostrar cancelados (1)" e o bloco "Cancelados" (título e fundo mais apagado), o Quadro por setor com o concluído antigo, e a etiqueta "Iniciado" no cartão. O que segue sem ser visto com o login real: tudo isso com dados de verdade e a Consulta. A vitrine recebeu itens temporários para a conferência e voltou ao que era.
- **Rótulo do par:** o controle se chama "Mostrar" (grupo acessível "Mostrar"), no padrão do "Agrupar por"; os dois passaram a usar um componente só (`ControleDeOpcoes`).
- **Teste antigo ajustado:** em `App.lista.test.tsx` o processo "Arquivar Pasta" era cancelado e saía da tabela; passou a suspenso para continuar provando a pílula de situação (o cancelado agora é provado em `App.todosConcluidos.test.tsx`).
- **Complexidade (ESLint):** duas funções passaram de 10 caminhos e foram divididas (`valorDoFiltroNoEndereco`, `oQueAVisaoMostra`).
- **Sem banco:** nenhuma migração, nenhum workflow de banco e nenhuma Edge Function; a pendência de publicar `arquivos-no-drive` continua do ticket 01.
