# Ticket 09 de processos-etapas (Lista, filtros e processos do setor) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a Lista com todos os processos, os filtros do Quadro e da Lista guardados no endereço e a seção "Processos do setor" na tela do setor.

**Architecture:** só interface; nenhum banco. `listarProcessos()` já devolve todos os processos, de qualquer situação, com setor, macroprocesso, pai, etapa atual, responsável e situação (view `processos_com_andamento`), e os filtros e a ordem são funções puras sobre essa lista. O endereço dos processos (visão, item aberto e filtros) é lido e escrito por um módulo puro; a área de processos, as cartas do Quadro, as linhas da Lista e os links do painel montam os endereços por ele, para o painel abrir "por cima da visão de onde veio". A tela do setor usa a mesma `listarProcessos()` filtrada pelo setor.

**Tech Stack:** React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/processos-etapas/spec.md` (histórias 24 a 28 e 88; "Interface": navegação no endereço, Lista, Tela do setor, Estados) · **Ticket:** `.scratch/processos-etapas/issues/09-lista-filtros-e-processos-do-setor.md` (critérios citados como "critério N", na ordem do ticket).

## Global Constraints

- `npm` para tudo; nenhuma dependência nova.
- Sem banco: nenhuma migração, nenhum teste pgTAP, nenhum workflow neste ticket (`.claude/regras/banco.md` não se aplica: nada de tabela, política, função ou arquivo).
- Textos exatos (spec, "Estados" e "Tela do setor"): "Carregando processos…", "Nenhum processo com estes filtros.", [Limpar filtros], "Carregando processos do setor…", "Este setor ainda não tem processos.", "Processos do setor", "Não foi possível carregar os processos. Verifique a conexão e tente de novo." com [Tentar de novo] (o `ErroAoCarregar` já monta a frase com `alvo="os processos"`).
- Funções de 4 a 20 linhas, arquivos até 300, complexidade até 10, tipos explícitos, sem `any`; nomes do domínio.
- Testes de tela com o aplicativo inteiro e o `ProcessosFalso` (arte anterior: `App.quadro.test.tsx`, `App.responsaveisDoSetor.test.tsx`).

## Decisões do plano

- **Endereço** (spec, "Navegação no endereço"): Quadro `#/processos`, Lista `#/processos/lista`; o item aberto vem depois (`#/processos/lista/<id>`, `#/processos/novo`); os filtros vão no fim, como consulta: `?setor=<id>&macroprocesso=<id>&etapa=<codigo>&tipo=<tipo>&responsavel=<id>&situacao=<situacao>`, sempre nessa ordem e só os preenchidos. No Quadro, `situacao` é ignorada na leitura e omitida na escrita. Valor desconhecido de `tipo` ou `situacao` vira "sem filtro".
- **Etapa atual "Aguardando o setor"** é uma opção do filtro de etapa (valor `aguardando-o-setor`, a `CHAVE_AGUARDANDO_O_SETOR` que já existe); o filtro de uma etapa do catálogo não pega quem aguarda o setor. Na Lista, a coluna Etapa atual mostra "Aguardando o setor" nesse caso e "—" sem etapa atual (concluído).
- **Opções dos filtros** saem da própria lista carregada (setores, macroprocessos e responsáveis que aparecem nos processos; etapas do catálogo, mais "Aguardando o setor"); nada novo no módulo. Cada filtro é um `<select>` nativo com "Todos" (ou "Todas") vazio.
- **Onde ficam os filtros:** numa barra sempre visível acima do Quadro e da Lista, depois de carregar. O ícone "Filtrar" da barra superior continua sem ação (vai para o backlog, para o `/polir` decidir).
- **Alternância Quadro | Lista e faixa lateral** levam ao endereço sem filtros (critério 3); a alternância mostra `aria-pressed` conforme a visão.
- **"Processos do setor"** usa `listarProcessos()` filtrada pelo setor, por nome, e clicar abre o painel em `#/processos/lista/<id>?setor=<setorId>`: a Lista do setor fica esmaecida atrás, e fechar volta a ela. A spec cita "ler os processos de um setor" como operação do módulo; o filtro da lista inteira atende sem mudar o módulo nem o banco (registrar em `desvios.md`).
- **Pílula da situação** (já usada no cabeçalho do painel) vira o componente `PilulaDaSituacao`, reaproveitado na Lista e na tela do setor.
- **Painel por cima da visão de onde veio:** os links de pai e subprocessos (`EstruturaDoProcesso`) e o cartão passam a receber o endereço montado pela área, com a visão e os filtros atuais.
- **Cadastrar processo:** o botão sai do `QuadroDeProcessos` para a barra comum, e vale na Lista também.

## Mapa de arquivos

- Criar `src/processos/enderecoDosProcessos.ts` (+ `.test.ts`): ler e montar o endereço.
- Criar `src/processos/filtrosDosProcessos.ts` (+ `.test.ts`): filtrar, "tem filtro", opções.
- Criar `src/processos/linhasDaLista.ts` (+ `.test.ts`): ordem da Lista e nome do pai; texto da etapa atual.
- Criar `src/components/processos/PilulaDaSituacao.tsx`; alterar `CabecalhoDoPainel.tsx` para usá-la.
- Criar `src/components/processos/TabelaDeProcessos.tsx` (Lista), `VisaoDosProcessos.tsx` (estados comuns, barra, filtros), `FiltrosDosProcessos.tsx` (a barra de filtros e o "Nenhum processo com estes filtros.").
- Criar `src/components/processos/ProcessosDoSetor.tsx`; alterar `src/components/cadastros/SetorAberto.tsx`.
- Alterar `AreaDeProcessos.tsx`, `QuadroDeProcessos.tsx`, `ColunaDoQuadro.tsx`, `CartaoDoProcesso.tsx`, `EstruturaDoProcesso.tsx`, `PainelDoProcesso.tsx` (repassa o endereço), `src/components/moldura/{areas.ts,Moldura.tsx,BarraSuperior.tsx}`, `src/hooks/useAreaAtual.ts`, `src/App.tsx`, `Quadro.css`.
- Testes de tela: criar `src/App.lista.test.tsx`, `src/App.filtrosDosProcessos.test.tsx`, `src/App.processosDoSetor.test.tsx`.

## Tarefas

### Tarefa 1 — Endereço dos processos (função pura)

**Arquivos:** criar `src/processos/enderecoDosProcessos.ts` e `src/processos/enderecoDosProcessos.test.ts`.

**Produz:**

```ts
export type VisaoDosProcessos = 'quadro' | 'lista'
export type FiltrosDosProcessos = {
  setor: string | null; macroprocesso: string | null; etapa: string | null
  tipo: TipoDeProcesso | null; responsavel: string | null; situacao: SituacaoDoProcesso | null
}
/** aberto: o id do processo no painel, 'novo' no cadastro, null sem painel. */
export type EnderecoDosProcessos = { visao: VisaoDosProcessos; aberto: string | null; filtros: FiltrosDosProcessos }
export const SEM_FILTROS: FiltrosDosProcessos
export function lerEnderecoDosProcessos(endereco: string): EnderecoDosProcessos
export function montarEnderecoDosProcessos(endereco: EnderecoDosProcessos): string
```

- [x] Escrever os testes (critério 6) primeiro:
  - `#/processos` → quadro, sem aberto, `SEM_FILTROS`; `#/processos/lista` → lista; `#/processos/p1` → aberto `p1`; `#/processos/lista/p1` → lista com `p1`; `#/processos/novo` → aberto `novo`;
  - `#/processos/lista?setor=s1&tipo=subprocesso&situacao=cancelado` → os três filtros; o mesmo no Quadro (`#/processos?setor=s1&situacao=cancelado`) → `situacao` null;
  - `tipo=xyz` e `situacao=xyz` → null; parâmetro vazio (`setor=`) → null;
  - montar: `{ lista, null, SEM_FILTROS }` → `#/processos/lista`; com aberto `p1` e `setor: 's1', etapa: 'modelagem'` → `#/processos/lista/p1?setor=s1&etapa=modelagem`; quadro com `situacao: 'concluido'` → sem `situacao`;
  - ida e volta: `montar(ler(x)) === x` para `#/processos/lista/p1?setor=s1&macroprocesso=m1&etapa=aguardando-o-setor&tipo=processo&responsavel=u1&situacao=suspenso`.
- [x] Rodar `npx vitest run src/processos/enderecoDosProcessos.test.ts`: falha (módulo inexistente).
- [x] Implementar com `URLSearchParams` (trecho depois do `?`), separando o caminho por `/`:

```ts
const NOMES_DOS_FILTROS = ['setor', 'macroprocesso', 'etapa', 'tipo', 'responsavel', 'situacao'] as const
const TIPOS = new Set<string>(['processo', 'subprocesso', 'a_classificar'])
const SITUACOES = new Set<string>(['em_andamento', 'suspenso', 'cancelado', 'concluido'])

export function lerEnderecoDosProcessos(endereco: string): EnderecoDosProcessos {
  const [caminho, consulta = ''] = endereco.split('?')
  const trechos = caminho.split('/').slice(2) // depois de "#" e "processos"
  const visao: VisaoDosProcessos = trechos[0] === 'lista' ? 'lista' : 'quadro'
  const aberto = (visao === 'lista' ? trechos[1] : trechos[0]) || null
  return { visao, aberto, filtros: filtrosDaConsulta(new URLSearchParams(consulta), visao) }
}

function filtrosDaConsulta(consulta: URLSearchParams, visao: VisaoDosProcessos): FiltrosDosProcessos {
  const valor = (nome: string) => consulta.get(nome) || null
  const conhecido = <T extends string>(nome: string, validos: Set<string>) =>
    (validos.has(valor(nome) ?? '') ? valor(nome) as T : null)
  return {
    setor: valor('setor'), macroprocesso: valor('macroprocesso'), etapa: valor('etapa'),
    tipo: conhecido<TipoDeProcesso>('tipo', TIPOS), responsavel: valor('responsavel'),
    situacao: visao === 'lista' ? conhecido<SituacaoDoProcesso>('situacao', SITUACOES) : null,
  }
}

export function montarEnderecoDosProcessos({ visao, aberto, filtros }: EnderecoDosProcessos): string {
  const trechos = ['#/processos', visao === 'lista' ? 'lista' : null, aberto].filter(Boolean)
  const consulta = new URLSearchParams()
  for (const nome of NOMES_DOS_FILTROS) {
    const valor = nome === 'situacao' && visao === 'quadro' ? null : filtros[nome]
    if (valor) consulta.set(nome, valor)
  }
  const texto = consulta.toString()
  return trechos.join('/') + (texto ? `?${texto}` : '')
}
```

- [x] Rodar o teste: passa. `npm run lint` sem erro.
- [x] Comitar: `Ticket 09 de processos-etapas: endereço dos processos com a visão e os filtros`.

### Tarefa 2 — Filtros, opções e linhas da Lista (funções puras)

**Arquivos:** criar `src/processos/filtrosDosProcessos.ts`, `src/processos/linhasDaLista.ts` e os dois `.test.ts`.

**Consome:** `FiltrosDosProcessos`, `SEM_FILTROS` (tarefa 1); `CHAVE_AGUARDANDO_O_SETOR` de `colunasDoQuadro.ts`.

**Produz:**

```ts
// filtrosDosProcessos.ts
export function temFiltro(filtros: FiltrosDosProcessos): boolean
export function filtrarProcessos(processos: ProcessoDaLista[], filtros: FiltrosDosProcessos): ProcessoDaLista[]
export type OpcaoDoFiltro = { valor: string; rotulo: string }
export type OpcoesDosFiltros = {
  setores: OpcaoDoFiltro[]; macroprocessos: OpcaoDoFiltro[]; etapas: OpcaoDoFiltro[]
  tipos: OpcaoDoFiltro[]; responsaveis: OpcaoDoFiltro[]; situacoes: OpcaoDoFiltro[]
}
export function opcoesDosFiltros(lista: ListaDeProcessos): OpcoesDosFiltros

// linhasDaLista.ts
export type LinhaDaLista = ProcessoDaLista & { nomeDoPai: string | null }
export function linhasDaLista(processos: ProcessoDaLista[]): LinhaDaLista[]
export function textoDaEtapaAtual(processo: ProcessoDaLista): string
```

- [x] Testes de `filtrosDosProcessos` (critério 2), com processos inventados montados por uma função `processo(nome, mudancas)` no arquivo:
  - `temFiltro(SEM_FILTROS)` falso; com um campo preenchido, verdadeiro;
  - cada filtro sozinho: setor (`setorId`), macroprocesso (`macroprocessoId`), tipo, responsável (`responsavel?.id`), situação; etapa `modelagem` pega só quem tem `etapaAtual.codigo === 'modelagem'` e **não** aguarda o setor; etapa `aguardando-o-setor` pega só quem aguarda;
  - combinação (setor + tipo) é "e";
  - `opcoesDosFiltros`: setores sem repetição, em ordem de sigla, com `rotulo` = sigla; macroprocessos sem repetição por nome; etapas = "Aguardando o setor" primeiro e as do catálogo na ordem dele (só ativas ou com processo nelas, como no Quadro); responsáveis sem repetição por nome, sem os processos sem responsável; tipos e situações com os rótulos de `rotulos.ts`.
- [x] Testes de `linhasDaLista` (critério 1): ordem pela sigla do setor e depois pelo nome (`localeCompare` `pt-BR`, sem diferenciar maiúsculas); `nomeDoPai` preenchido no subprocesso cujo pai está na lista e null nos outros; `textoDaEtapaAtual`: "Aguardando o setor" quando aguarda, o nome da etapa quando há, "—" sem etapa.
- [x] Rodar os dois testes: falham.
- [x] Implementar. `filtrarProcessos` com uma função `passaNoFiltro(processo, filtros)` por campo (cada uma com early return), para caber no limite de complexidade; `opcoesDosFiltros` com uma função `semRepetir(pares, ordem)`. Reaproveitar `ROTULO_DO_TIPO` e `ROTULO_DA_SITUACAO`.
- [x] Rodar: passam. `npm run lint`.
- [x] Comitar: `Ticket 09 de processos-etapas: filtros, opções e linhas da Lista`.

### Tarefa 3 — A Lista, a navegação e o painel por cima da visão

**Arquivos:** criar `src/App.lista.test.tsx`, `src/components/processos/{TabelaDeProcessos,VisaoDosProcessos,PilulaDaSituacao}.tsx`; alterar `src/components/moldura/{areas.ts,Moldura.tsx,BarraSuperior.tsx}`, `src/hooks/useAreaAtual.ts`, `src/App.tsx`, `src/components/processos/{AreaDeProcessos,QuadroDeProcessos,ColunaDoQuadro,CartaoDoProcesso,EstruturaDoProcesso,PainelDoProcesso,CabecalhoDoPainel}.tsx`, `Quadro.css`.

**Consome:** tarefas 1 e 2.

- [x] Escrever `App.lista.test.tsx` (montagem como em `App.quadro.test.tsx`, hash inicial `#/processos/lista`; processos inventados em dois setores, TSB e TSA, com um subprocesso, um concluído, um cancelado e um aguardando o setor):
  1. cabeçalho com Nome, Tipo, Setor, Macroprocesso, Etapa atual, Responsável e Situação (critério 1);
  2. as linhas em ordem de sigla e nome, com os concluídos e cancelados (que não aparecem no Quadro);
  3. o subprocesso mostra "↳ <nome do pai>" na célula do nome;
  4. a situação em pílula com texto ("Concluído", "Cancelado", "Em andamento", "Suspenso"); a etapa "Aguardando o setor" na linha que aguarda;
  5. clicar na linha leva a `#/processos/lista/<id>`, abre o painel e deixa a lista com a classe `quadro-esmaecido` e `inert`; fechar volta a `#/processos/lista` e devolve o foco ao botão da linha;
  6. carregando: "Carregando processos…" com `role="status"` e linhas-fantasma (`.linha-fantasma`); erro: a frase de erro e [Tentar de novo], que carrega de novo; vazio: "Nenhum processo cadastrado ainda." (critério 4);
  7. alternância: em `#/processos`, o botão "Lista" da barra superior leva a `#/processos/lista` e fica com `aria-pressed="true"`; o botão "Quadro" volta a `#/processos` (critério 3);
  8. o item "Lista" da faixa lateral leva a `#/processos/lista` e fica com `aria-current="page"`;
  9. Consulta: a Lista sem [Cadastrar processo]; Integrante: com o botão, que leva a `#/processos/lista/novo`;
  10. painel aberto da Lista: o link de um subprocesso leva a `#/processos/lista/<id do subprocesso>`.
- [x] Rodar: falha.
- [x] Navegação: `areas.ts` (`AreaComTela` e `temTela` com `'lista'`), `useAreaAtual` (`lista` quando o endereço começa com `#/processos/lista`; `ENDERECO_DA_AREA.lista = '#/processos/lista'`), `App.tsx` (`TITULO_DA_AREA.lista = 'Processos'`; `AreaDeProcessos` quando a área é `quadro` ou `lista`, no mesmo ponto da árvore, para não recarregar ao alternar), `Moldura` (alternância em `quadro` e `lista`, passando `areaAtual` e `aoIrPara`), `BarraSuperior` (os dois botões chamam `aoIrPara('quadro' | 'lista')` e marcam `aria-pressed` pela área).
- [x] `PilulaDaSituacao` (`{ situacao: SituacaoDoProcesso }`), com o `PILULA_DA_SITUACAO` que sai de `CabecalhoDoPainel`, que passa a usá-la.
- [x] `TabelaDeProcessos` (`{ linhas: LinhaDaLista[]; idEscolhido: string | null; aoAbrir(id): void }`): `table.tabela-cadastros`, linha `linha-clicavel` com `aria-current` na escolhida; o nome é um `<button className="cadastros-abrir" id={`linha-${id}`}>` (teclado), seguido de `<span className="lista-pai">↳ {nomeDoPai}</span>` no subprocesso; tipo por `ROTULO_DO_TIPO`; setor pela sigla; etapa por `textoDaEtapaAtual`; responsável pelo nome (ou "—"); situação por `PilulaDaSituacao`. `TabelaCarregando`: a mesma tabela com `<caption role="status">Carregando processos…</caption>` e 3 `LinhaFantasma` de 7 colunas.
- [x] `VisaoDosProcessos` (`{ visao; estado; aoTentarDeNovo; podeAlterar; aoCadastrar; idEscolhido; enderecoDoProcesso(id): string; aoAbrir(id) }`): carregando (Quadro: o `QuadroCarregando` que sai de `QuadroDeProcessos`; Lista: `TabelaCarregando`), erro (`ErroAoCarregar alvo="os processos"`), vazio (`QuadroVazio`), senão a barra com [Cadastrar processo] (se pode) e o Quadro (`QuadroDeProcessos` só com as colunas) ou a Tabela (`linhasDaLista`). Nesta tarefa ainda sem filtros.
- [x] `QuadroDeProcessos` passa a receber `{ lista: ListaDeProcessos; idEscolhido; enderecoDoProcesso }` e só desenha as colunas; `ColunaDoQuadro` e `CartaoDoProcesso` recebem `enderecoDoProcesso` e o cartão usa `href={enderecoDoProcesso(id)}`.
- [x] `AreaDeProcessos`: lê o endereço com `lerEnderecoDosProcessos`; `irParaVisao(mudancas)` monta com `montarEnderecoDosProcessos({ ...atual, ...mudancas })`; `enderecoDoProcesso = (id) => montar({ ...atual, aberto: id })`; fechar volta a `aberto: null` e foca `cartao-<id>` ou `linha-<id>`; cadastrar vai a `aberto: 'novo'`; o `PainelDoProcesso` recebe `enderecoDoProcesso` e o repassa a `EstruturaDoProcesso`, que o usa nos links.
- [x] Estilo em `Quadro.css`: `.lista-pai` (cinza, tamanho do rótulo, à esquerda com `--esp-2`) e o respiro da tabela dentro de `.quadro` (padrão das listas de cadastros; spec "Observações", `[visual]` Lista compacta).
- [x] Rodar `App.lista.test.tsx` e todo o `npm test` (os testes de Quadro, painel, cadastro e subprocessos continuam passando sem mudança de endereço esperado). `npm run lint` e `npm run typecheck`.
- [x] Comitar: `Ticket 09 de processos-etapas: Lista de processos, alternância e painel por cima da visão`.

### Tarefa 4 — Filtros no Quadro e na Lista

**Arquivos:** criar `src/App.filtrosDosProcessos.test.tsx`, `src/components/processos/FiltrosDosProcessos.tsx`; alterar `VisaoDosProcessos.tsx`, `AreaDeProcessos.tsx`, `Quadro.css`.

**Consome:** `filtrarProcessos`, `temFiltro`, `opcoesDosFiltros` (tarefa 2); o endereço (tarefa 1).

- [x] Escrever `App.filtrosDosProcessos.test.tsx` (critérios 2, 4 e 7):
  1. Lista: cada filtro sozinho (setor, macroprocesso, etapa atual, tipo, responsável, situação) troca as linhas e grava o endereço (ex.: escolher o setor TSA leva a `#/processos/lista?setor=s1`);
  2. combinação: setor + tipo deixam só a linha que atende aos dois, e o endereço tem os dois;
  3. recarregar com filtros: montar com `#/processos/lista?setor=s1&situacao=concluido` mostra só a linha certa e os seletores com esses valores;
  4. Quadro: os filtros aparecem sem "Situação"; escolher o setor tira os cartões de outro setor e grava `#/processos?setor=s1`; abrir um cartão leva a `#/processos/<id>?setor=s1` e fechar volta a `#/processos?setor=s1`;
  5. sem resultado: "Nenhum processo com estes filtros." com [Limpar filtros], que volta ao endereço sem filtros e mostra tudo;
  6. [Limpar filtros] na barra aparece só com filtro ativo;
  7. Consulta: os filtros funcionam, sem [Cadastrar processo].
- [x] Rodar: falha.
- [x] `FiltrosDosProcessos` (`{ visao; opcoes: OpcoesDosFiltros; filtros; aoMudar(filtros): void }`): um `<label>` com `<select>` por filtro ("Setor", "Macroprocesso", "Etapa atual", "Tipo", "Responsável" e, na Lista, "Situação"), primeira opção vazia "Todos" (ou "Todas" em Etapa atual e Situação); [Limpar filtros] (`botao botao-secundario`) quando `temFiltro`. Exportar também `NenhumProcessoComFiltros({ aoLimpar })`: `<p className="cadastros-vazio">Nenhum processo com estes filtros.</p>` com o botão. Uma função `SeletorDoFiltro` para não repetir o `<label><select>` seis vezes.
- [x] `VisaoDosProcessos` recebe `filtros` e `aoMudarFiltros`; depois de carregar, mostra a barra (cadastrar + filtros), filtra (`filtrarProcessos`) e, se o resultado estiver vazio com filtro ativo, mostra `NenhumProcessoComFiltros`; senão o Quadro (com `{ etapas, processos: filtrados }`) ou a Tabela.
- [x] `AreaDeProcessos` passa `filtros` e `aoMudarFiltros = (filtros) => irParaVisao({ filtros, aberto: null })`.
- [x] Estilo em `Quadro.css`: `.filtros-dos-processos` (linha com `flex-wrap`, `gap: var(--esp-2)`, rótulo acima do seletor no tamanho de rótulo; seletor com a mesma altura e borda dos campos dos formulários; ocupa a largura da área, alinhado à esquerda; o botão Cadastrar continua à direita).
- [x] Rodar o teste novo, `npm test`, `npm run lint`, `npm run typecheck`.
- [x] Comitar: `Ticket 09 de processos-etapas: filtros no Quadro e na Lista, guardados no endereço`.

### Tarefa 5 — Processos do setor

**Arquivos:** criar `src/App.processosDoSetor.test.tsx`, `src/components/processos/ProcessosDoSetor.tsx`; alterar `src/components/cadastros/SetorAberto.tsx`.

**Consome:** `PilulaDaSituacao`, `textoDaEtapaAtual`, `montarEnderecoDosProcessos`, `SEM_FILTROS`.

- [ ] Escrever `App.processosDoSetor.test.tsx` (critério 5; montagem como em `App.responsaveisDoSetor.test.tsx`, abrindo o setor TSA pela célula da lista):
  1. a seção "Processos do setor" lista só os processos de `s1`, por nome, com nome, tipo, etapa atual e situação (inclusive concluído e cancelado);
  2. vazio: "Este setor ainda não tem processos.";
  3. carregando: "Carregando processos do setor…" (`segurarListaDeProcessos`);
  4. erro: a frase de erro com [Tentar de novo], que carrega de novo (`falharListaDeProcessos`);
  5. clicar num processo leva a `#/processos/lista/<id>?setor=s1` e abre o painel dele;
  6. Consulta: a seção aparece igual.
- [ ] Rodar: falha.
- [ ] `ProcessosDoSetor` (`{ processos: ModuloDeProcessos; setorId: string }`), no molde de `ResponsaveisDoSetor`: `useCarregamento(listarProcessos)`, filtra por `setorId` e ordena por nome; `<section aria-label="Processos do setor">` com `<h3 className="form-setor-titulo">`; a tabela `tabela-cadastros` com o nome em `<button className="cadastros-abrir">` e a linha `linha-clicavel`, que faz `window.location.hash = montarEnderecoDosProcessos({ visao: 'lista', aberto: id, filtros: { ...SEM_FILTROS, setor: setorId } })`.
- [ ] `SetorAberto`: acrescentar `<ProcessosDoSetor processos={processos} setorId={id} />` depois de `EtapasDoSetor`, nos dois modos.
- [ ] Rodar o teste novo, `npm test`, `npm run lint`, `npm run typecheck`.
- [ ] Comitar: `Ticket 09 de processos-etapas: processos do setor na tela do setor`.

### Tarefa 6 — Fechamento

- [ ] `npm test` inteiro, `npm run lint`, `npm run typecheck` e `npm run check:circular` verdes.
- [ ] Conferência na tela (opcional, se o app logado estiver disponível): Lista, filtros e a seção do setor; senão, fica para o `/polir`.
- [ ] `desvios.md` de processos-etapas: entrada datada com "processos do setor pela lista inteira filtrada, sem operação nova no módulo" e "ícone Filtrar sem ação; filtros em barra visível". `backlog.md`: o ícone "Filtrar" da barra superior sem ação (para o `/polir`).
- [ ] `melhorias-protocolo.md`: os itens de `.claude/regras/nao-testados.md` (blocos `/executar-complexo` e "Qualquer momento") que aconteceram nesta execução.
- [ ] Comitar os registros; integração (passo 4 do `/executar-complexo`): `git switch main`, merge, `git branch -d processos-etapas-09`, `git push` da `main` (nada em `supabase/`, então o "Testes de banco" não dispara); linha `Concluído em` no fim do ticket 09; comitar e enviar.
