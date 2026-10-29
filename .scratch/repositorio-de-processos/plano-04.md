# Ticket 04 (Lista com filtro e ordenação por coluna): plano de execução

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa. Marque `- [x]` ao fim de cada passo.

**Objetivo:** levar o filtro e a ordenação da Lista para o cabeçalho de cada coluna, com a visão guardada no endereço.

**Arquitetura:** a ordenação é uma função pura nova (`ordenacaoDaLista.ts`), aplicada por `linhasDaLista`. O endereço ganha `ordenacao` (fora dos filtros, para o "Limpar filtros" não a desligar). O menu do cabeçalho reaproveita o `MenuDeAcoes` (teclado, Esc, clique fora já prontos), que ganha botão próprio e itens marcáveis. A barra de filtros (`FiltrosDosProcessos`) fica só no Quadro.

**Tecnologia:** React + TypeScript, Vitest + Testing Library. Nenhuma dependência nova. Sem banco.

**Spec:** `.scratch/repositorio-de-processos/spec.md`, seções "Lista: cabeçalhos com filtro e ordenação (S18, S19)", "Endereço da página (S20)", "Estados da tela" e "Decisões de teste". Ticket: `issues/04-lista-filtro-e-ordenacao-por-coluna.md`.

## Restrições gerais

- Sem mudança no banco nem nas Edge Functions.
- "Agrupar por: Nenhum | Macroprocesso" e a árvore são do ticket 05: fora daqui.
- Filtro de um valor só por coluna (fora do escopo: vários valores).
- Limites do ESLint (função até 20 linhas, arquivo até 300, complexidade até 10).

## Decisões de execução (a spec não fixa)

- **Endereço:** `ordenar=<coluna>` e `sentido=decrescente`. O padrão (Processo, crescente) não vai ao endereço. Colunas: `processo | tipo | setor | macroprocesso | etapa | responsavel | situacao`. Valor desconhecido = padrão. Só na Lista.
- **Vazios no fim nos dois sentidos:** sem responsável e sem etapa atual ficam por último, crescente ou decrescente, como numa planilha.
- **Desempate:** pelo nome do processo, crescente.
- **Subprocesso segue o pai:** os processos cujo pai não está nas linhas visíveis são raízes, ordenadas pela coluna escolhida; logo depois de cada raiz, os seus subprocessos, ordenados pela mesma regra. Subprocesso com o pai filtrado fora vira raiz e mantém o "↳ pai".
- **Divergência a registrar:** a spec diz que os subprocessos seguem o pai "como hoje", mas hoje a Lista ordena só por setor e nome (o subprocesso não fica junto do pai). Vale o critério 5 do ticket.

## Foco da revisão

1. Endereço antigo com `situacao=` e `mostrar=concluidos`: a Situação continua ignorada (já é assim; não quebrar).
2. Menu de Responsável com muitas pessoas: a lista rola por dentro (`max-height`) e não sai da tela em 1366×768.
3. Menu da última coluna (Situação) abre para a esquerda; o das primeiras, para a direita.
4. Recarregar com `ordenar=etapa&sentido=decrescente` mostra a mesma ordem.
5. Cancelados (bloco do fim) seguem a mesma ordenação.

---

### Tarefa 1: ordenação pura das linhas

**Arquivos:**
- Criar: `src/processos/ordenacaoDaLista.ts`, `src/processos/ordenacaoDaLista.test.ts`
- Modificar: `src/processos/linhasDaLista.ts`, `src/processos/linhasDaLista.test.ts`

**Interfaces:**
- Produz: `type ColunaDaLista = 'processo' | 'tipo' | 'setor' | 'macroprocesso' | 'etapa' | 'responsavel' | 'situacao'`; `type SentidoDaOrdem = 'crescente' | 'decrescente'`; `type OrdenacaoDaLista = { coluna: ColunaDaLista; sentido: SentidoDaOrdem }`; `const ORDENACAO_PADRAO: OrdenacaoDaLista` (`processo`, `crescente`); `ordenarLinhas(linhas: LinhaDaLista[], ordenacao: OrdenacaoDaLista): LinhaDaLista[]`.
- `linhasDaLista(processos, todos = processos, ordenacao = ORDENACAO_PADRAO)` passa a ordenar por `ordenarLinhas`.

- [ ] **Passo 1: testes que falham** em `ordenacaoDaLista.test.ts`:
  - `processo` crescente e decrescente, sem diferenciar maiúsculas e acentos (`Ômega` junto de `omega`);
  - `tipo` pelo rótulo (A classificar, Processo, Subprocesso);
  - `setor` pela sigla; `macroprocesso` pelo nome;
  - `etapa` pela `ordem` do catálogo (ordem 2 antes de ordem 5, mesmo que o nome venha antes no alfabeto); sem etapa por último, também em decrescente;
  - `responsavel` pelo nome; sem responsável por último, também em decrescente;
  - `situacao`: em andamento, suspenso, concluído (decrescente inverte);
  - empate desempata pelo nome crescente;
  - subprocesso logo depois do pai em qualquer ordenação: com `Alfa` filho de `Zeta` e `Beta` solto, `processo` crescente dá `[Beta, Zeta, Alfa]`;
  - subprocesso cujo pai não está nas linhas é raiz e entra na ordem normal.
- [ ] **Passo 2:** `npx vitest run src/processos/ordenacaoDaLista.test.ts`; esperado: FAIL (módulo inexistente).
- [ ] **Passo 3:** implementar `ordenarLinhas`. Uma tabela `Record<ColunaDaLista, (linha) => string | number | null>` com a chave de cada coluna; `null` vai ao fim antes de aplicar o sentido; comparar texto com `localeCompare('pt-BR', { sensitivity: 'base' })`. Agrupar filhos por `processoPaiId` só quando o pai está nas linhas.
- [ ] **Passo 4:** ajustar `linhasDaLista.test.ts`: o primeiro teste passa a esperar a ordem pelo nome (padrão novo); o segundo espera `Pai`, `Filho` (filho depois do pai) e `Órfão` na ordem do nome. Rodar `npx vitest run src/processos/` e ver verde, inclusive os testes de `ProcessosDoSetor`.
- [ ] **Passo 5:** commit `repositorio-de-processos 04: ordenação das linhas da Lista`.

### Tarefa 2: ordenação no endereço

**Arquivos:** modificar `src/processos/enderecoDosProcessos.ts` e `.test.ts`.

**Interfaces:**
- Consome: `OrdenacaoDaLista`, `ORDENACAO_PADRAO` (tarefa 1).
- Produz: `EnderecoDosProcessos.ordenacao: OrdenacaoDaLista`; em `EnderecoParaMontar`, `ordenacao?` opcional (vale o padrão).

- [ ] **Passo 1: testes que falham:** ler `#/processos/lista?ordenar=etapa&sentido=decrescente` dá `{ coluna: 'etapa', sentido: 'decrescente' }`; `ordenar=xyz` ou `sentido=xyz` dá o padrão para a parte inválida; no Quadro, `ordenar` é ignorado; montar com o padrão não escreve `ordenar` nem `sentido`; montar com `responsavel` crescente escreve só `ordenar=responsavel`; ida e volta (montar → ler) preserva a ordenação.
- [ ] **Passo 2:** rodar o arquivo; esperado: FAIL.
- [ ] **Passo 3:** implementar `ordenacaoDaConsulta(consulta, visao)` e a escrita em `montarEnderecoDosProcessos`, depois dos filtros e de `mostrar`.
- [ ] **Passo 4:** rodar `npx vitest run src/processos/enderecoDosProcessos.test.ts` e `npx tsc -b --noEmit` (ou `npm run typecheck`); verde.
- [ ] **Passo 5:** commit `repositorio-de-processos 04: ordenação no endereço`.

### Tarefa 3: MenuDeAcoes com botão próprio e itens marcáveis

**Arquivos:** modificar `src/components/MenuDeAcoes.tsx`, `MenuDeAcoes.test.tsx` e `MenuDeAcoes.css`.

**Interfaces:**
- Produz: `ItemDoMenu.marcado?: boolean` (com valor, o item é `role="menuitemradio"` com `aria-checked`; sem valor, segue `menuitem`); props novas `conteudoDoBotao?: ReactNode` (no lugar do "⋯"; com ele, o botão mostra o conteúdo e não usa `title`) e `classeDoBotao?: string`.

- [ ] **Passo 1: testes que falham:** item com `marcado: true` tem `role="menuitemradio"` e `aria-checked="true"`, e `marcado: false` tem `aria-checked="false"`; as setas também passam pelos `menuitemradio`; com `conteudoDoBotao="Setor"`, o botão mostra "Setor" e mantém o `aria-label`.
- [ ] **Passo 2:** rodar `npx vitest run src/components/MenuDeAcoes.test.tsx`; esperado: FAIL.
- [ ] **Passo 3:** implementar. `itensDoMenu` passa a buscar `[role^="menuitem"]`. A lista ganha `max-height: min(60vh, 360px); overflow-y: auto` para o menu de Responsável caber em 1366×768. O item marcado mostra um "✓" antes do texto (marca visual além do `aria-checked`).
- [ ] **Passo 4:** rodar o arquivo e os testes que usam `MenuDeAcoes` (`npx vitest run src/components`); verde.
- [ ] **Passo 5:** commit `repositorio-de-processos 04: menu com itens marcáveis`.

### Tarefa 4: cabeçalho da Lista com menu e a área de cima da tabela

**Arquivos:**
- Criar: `src/components/processos/CabecalhoDaLista.tsx` (o `<thead>` com um `MenuDeAcoes` por coluna), `src/App.listaPorColuna.test.tsx`
- Modificar: `TabelaDeProcessos.tsx`, `VisaoDosProcessos.tsx`, `FiltrosDosProcessos.tsx`, `AreaDeProcessos.tsx`, `Quadro.css`
- Ajustar testes antigos da Lista que usam a barra de filtros: `App.filtrosDosProcessos.test.tsx`, `App.buscaNaLista.test.tsx`, `App.todosConcluidos.test.tsx`, `App.lista.test.tsx` (ordem padrão e nome "Processo") e os demais que quebrarem.

**Interfaces:**
- Consome: `OrdenacaoDaLista` (tarefa 1), `atual.ordenacao` (tarefa 2), `MenuDeAcoes` com `marcado` e `conteudoDoBotao` (tarefa 3), `opcoesDosFiltros` (já existe).
- `CabecalhoDaLista` props: `{ opcoes: OpcoesDosFiltros | null; filtros: Filtros; mostrar: MostrarNoPortfolio; ordenacao: OrdenacaoDaLista; aoMudarFiltros(filtros); aoOrdenar(ordenacao) }`. Com `opcoes` nulo (tabela carregando), mostra só os nomes, sem botão.
- `VisaoDosProcessos` ganha `ordenacao` e `aoOrdenar`. `AreaDeProcessos` liga `aoOrdenar={(ordenacao) => irParaVisao({ ordenacao, aberto: null })}`.

- [ ] **Passo 1: testes de tela que falham** em `App.listaPorColuna.test.tsx` (mesma montagem de `App.lista.test.tsx`):
  - a Lista não tem o grupo "Filtros dos processos"; tem "Buscar pelo nome", "Todos | Concluídos" e, com filtro, "Limpar filtros" acima da tabela (critério 1);
  - o primeiro cabeçalho se chama "Processo" (critério 2);
  - clicar no cabeçalho "Setor" abre o menu com "Crescente", "Decrescente", "Todos" e as siglas; escolher `TSB` deixa só os processos de TSB, o endereço fica `?setor=s2` e o cabeçalho anuncia o filtro (texto oculto "filtrado"); o menu de "Processo" não tem filtro (critério 3);
  - "Decrescente" em "Etapa atual" ordena pela ordem do catálogo ao contrário e o `<th>` tem `aria-sort="descending"`; o endereço fica `?ordenar=etapa&sentido=decrescente` (critérios 3, 4 e 7);
  - "Crescente" em "Responsável": quem não tem responsável fica por último (critério 4);
  - subprocesso logo depois do pai com a ordenação por Setor (critério 5);
  - com "Concluídos", o menu da Situação não tem filtro (critério 6);
  - abrir `#/processos/lista?ordenar=responsavel&sentido=decrescente&tipo=processo` já mostra a visão (critério 7);
  - pelo teclado: foco no botão do cabeçalho, seta para baixo abre, Esc fecha e devolve o foco (critério 8);
  - carregando: a tabela fantasma tem o cabeçalho "Processo".
- [ ] **Passo 2:** rodar `npx vitest run src/App.listaPorColuna.test.tsx`; esperado: FAIL.
- [ ] **Passo 3:** implementar:
  - `CabecalhoDaLista`: uma entrada por coluna (`chave`, `rotulo`, `filtro: keyof Filtros | null`, `opcoes`, `paraDireita` nas quatro primeiras). Grupos do menu: `[Crescente, Decrescente]` com `marcado` na ordenação atual; e, quando há filtro, `[Todos, ...opções]` com `marcado` no valor atual. O botão mostra o rótulo, "▲" ou "▼" na coluna ordenada e um ponto na filtrada, com texto oculto ("ordenado em ordem crescente", "filtrado: TSB"). `aria-sort` no `<th>` da coluna ordenada.
  - `TabelaDeProcessos` recebe o cabeçalho pronto (`cabecalho: ReactNode`) em vez de montar `CabecalhoDaTabela`; `TabelaCarregando` usa `CabecalhoDaLista` sem opções. `COLUNAS` passa a começar por "Processo".
  - `VisaoDosProcessos`: na Lista, a barra de cima mostra `BuscaDaLista`, `TodosOuConcluidos`, "Limpar filtros" (com filtro) e "Cadastrar processo"; `linhasDaLista(..., ordenacao)` nas linhas e nos cancelados. No Quadro, a barra segue como hoje.
  - `FiltrosDosProcessos` vira só do Quadro: saem a busca, a Situação e a prop `visao`. `BotaoLimparFiltros` passa a ser exportado.
  - CSS em `Quadro.css`: botão do cabeçalho com a mesma fonte do `<th>`, sem borda, foco visível; indicador discreto em `--texto-2`.
- [ ] **Passo 4:** rodar `npx vitest run src/App.listaPorColuna.test.tsx`; verde. Depois rodar `npm test` e ajustar os testes antigos que liam a barra de filtros da Lista para usar o menu do cabeçalho (sem tirar o que eles provam). Verde.
- [ ] **Passo 5:** `npm run lint` e o typecheck verdes; commit `repositorio-de-processos 04: filtro e ordenação no cabeçalho da Lista`.

### Tarefa 5: conferência final

- [ ] **Passo 1:** `npm test`, `npm run lint` e o typecheck; tudo verde.
- [ ] **Passo 2:** ver a tela em 1366×768 pela pré-visualização, se houver jeito sem login (vitrine local); senão, o critério 8 visual fica presumido e anotado na linha `Concluído em`.
- [ ] **Passo 3:** registrar a divergência "subprocessos seguem o pai como hoje" em `.scratch/repositorio-de-processos/desvios.md` (entrada nova, datada).
