# Ticket 01 (faixa de controles, "Quadro ▾", Filtros e moldura): plano de implementação

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. Marque as caixas (`- [x]`) ao terminar cada passo.

**Objetivo:** trocar a barra do Quadro pela faixa de controles de altura fixa, com "Quadro ▾" e [Filtros n], e trocar a barra de cima e a faixa lateral pelas da proposta 6.

**Arquitetura:** o formato do endereço não muda (`visao` no caminho, `agrupar` na consulta); "Quadro ▾" é só uma forma nova de escrever esses dois valores, por isso os endereços antigos continuam valendo. A faixa é um componente da área de processos, desenhado pela `VisaoDosProcessos` em todos os estados menos o vazio total. A moldura troca as áreas `quadro` e `lista` por uma área só, `processos`.

**Tecnologia:** React + TypeScript, Vitest + Testing Library (testes de tela da aplicação com os módulos falsos), CSS com os tokens de `src/styles/tokens.css`.

**Requisitos:** ticket `.scratch/redesenho-do-quadro/issues/01-faixa-de-controles-e-moldura.md` e a seção "Redesenho do Quadro" de `.scratch/processos-etapas/spec.md`, histórias 1 a 11, 27 a 33 e 53 a 58. Referência visual: `.scratch/proposta-visual/proposta-6.html` (barra, `.btn`, `.sep`, `.legenda`, `.lateral`, `.topo`) e `.scratch/identidade-visual.md`.

## Restrições globais

- Sem banco, sem dependência nova, sem `any`; funções de até 20 linhas, arquivos de até 300, complexidade até 10 (ESLint no pre-commit).
- Textos fixos: "Cadastrar processo", "Quadro por etapa", "Quadro por responsável", "Quadro por setor", "Lista", "Filtros", "Limpar filtros", "Nenhum processo com estes filtros.", "Em breve".
- "Só os meus" fica como está (filtro Responsável com o próprio id) até o ticket 02: entra na faixa no lugar onde depois vai o [Destacar os meus], logo após [Filtros].
- Situação e Linhas não são deste ticket: na Lista e no Quadro por setor continua o "Mostrar: Todos | Concluídos" de hoje, agora dentro da faixa.
- [Cadastrar processo] é o único `botao-principal` (azul cheio) da faixa; ligado ou escolhido = azul-claro com texto azul (`--azul-claro` / `--azul-escuro`).

## Pontos de atenção na revisão

1. **Endereço com processo aberto + troca de forma de ver:** escolher outra forma de ver no menu fecha o verso (`aberto: null`) e mantém os filtros. Teste na Tarefa 3.
2. **Filtros abertos e o verso:** abrir um cartão com o painel dos Filtros aberto não pode deixar o painel por cima da janela. O painel fecha no clique fora (pointerdown), o que já cobre esse caso. Teste na Tarefa 4.
3. **Esc no painel dos Filtros dentro de um `<select>` aberto:** o Esc do seletor nativo fecha só a lista dele. O teste cobre o Esc no painel, com o foco num seletor.
4. **Sessão sem armazenamento:** com o `sessionStorage` lançando erro (janela anônima com bloqueio), Processos abre `#/processos`. O acesso fica em try/catch. Teste na Tarefa 2.
5. **Consulta:** a faixa aparece sem [Cadastrar processo] e sem "Só os meus", e "Quadro ▾" e [Filtros] continuam. Teste na Tarefa 5.

---

### Tarefa 1: forma de ver e contagem de filtros (funções puras)

**Arquivos:**
- Alterar: `src/processos/enderecoDosProcessos.ts`, `src/processos/filtrosDosProcessos.ts`
- Teste: `src/processos/enderecoDosProcessos.test.ts`, `src/processos/filtrosDosProcessos.test.ts`

**Interfaces produzidas:**
- `export type FormaDeVer = 'etapa' | 'responsavel' | 'setor' | 'lista'`
- `export function formaDeVer(endereco: EnderecoDosProcessos): FormaDeVer` (lista → `'lista'`; quadro → `agrupar`)
- `export function comFormaDeVer(endereco: EnderecoDosProcessos, forma: FormaDeVer): EnderecoDosProcessos` (troca `visao` e `agrupar`, `aberto: null`, mantém os filtros; ao ir para o Quadro, `filtros.situacao: null`, como o Quadro já faz)
- `export const ROTULO_DA_FORMA_DE_VER: Record<FormaDeVer, string>` com os quatro textos fixos
- `export function quantosFiltros(filtros: FiltrosDosProcessos): number` (conta os não nulos; `temFiltro` passa a ser `quantosFiltros(f) > 0`)

- [x] Passo 1: testes que falham:
  - `formaDeVer(lerEnderecoDosProcessos('#/processos?agrupar=setor'))` é `'setor'`; `'#/processos/lista?agrupar=setor'` é `'lista'`; `'#/processos'` é `'etapa'`.
  - `montarEnderecoDosProcessos(comFormaDeVer(lerEnderecoDosProcessos('#/processos/p1?setor=s1'), 'responsavel'))` é `'#/processos?setor=s1&agrupar=responsavel'`.
  - `comFormaDeVer(..., 'lista')` a partir de `'#/processos?agrupar=setor&tipo=processo'` monta `'#/processos/lista?tipo=processo'`.
  - `quantosFiltros(SEM_FILTROS)` é 0; com setor e tipo, 2.
- [x] Passo 2: `npx vitest run src/processos/enderecoDosProcessos.test.ts src/processos/filtrosDosProcessos.test.ts`. Esperado: FAIL (funções não existem).
- [x] Passo 3: implementar as quatro exportações.
- [x] Passo 4: rodar de novo. Esperado: PASS.
- [x] Passo 5: commit `faixa: forma de ver e contagem de filtros no endereco`.

### Tarefa 2: moldura (área Processos, faixa lateral, barra de cima, telas "Em breve")

Critérios 8 e 9 do ticket; histórias 53 a 58.

**Arquivos:**
- Alterar: `src/components/moldura/areas.ts`, `FaixaLateral.tsx`, `BarraSuperior.tsx`, `Moldura.tsx`, `Moldura.css`; `src/hooks/useAreaAtual.ts`; `src/App.tsx`; `src/components/Icone.tsx` (desenhos `sino`, `ajuda`, `filtro` e `seta` copiados dos `<symbol>` da proposta 6, no traço dos outros)
- Criar: `src/components/moldura/TelaEmBreve.tsx`, `src/components/moldura/BotaoEmBreve.tsx`, `src/hooks/useUltimaFormaDeVer.ts`
- Teste: criar `src/App.moldura.test.tsx`; ajustar `src/App.test.tsx`, `App.lista.test.tsx`, `App.administracao.test.tsx`, `App.recursosRetirados.test.tsx` (os que pedem os itens Quadro e Lista da faixa ou a alternância da barra)

**Interfaces:**
- `AreaDoSistema = 'processos' | 'setores' | 'painel' | 'administracao' | 'ajuda'`. Todas têm tela, então somem `AreaComTela`, `temTela` e `ehAreaDeProcessos`. Endereços: `#/processos…`, `#/setores`, `#/painel`, `#/administracao`, `#/ajuda`. Qualquer outro endereço cai em `processos`, como hoje.
- `ICONE_DA_AREA: Record<AreaDoSistema, NomeIcone>` (processos → `quadro`, ajuda → `ajuda`; as outras usam o ícone de mesmo nome). A barra e a faixa usam este mapa.
- `useUltimaFormaDeVer(): { lembrar(endereco: string): void; ultima(): string }`: guarda no `sessionStorage` (chave `ep:ultima-forma-de-ver`) o endereço de processos sem `aberto`, montado por `montarEnderecoDosProcessos({ ...atual, aberto: null })`, e devolve `'#/processos'` se não houver nada ou se o armazenamento falhar. A `AreaDeProcessos` chama `lembrar` num efeito quando `visao`, `agrupar` ou os filtros mudam. O item Processos da faixa navega para `ultima()`.
- `BotaoEmBreve({ rotulo: string; icone: NomeIcone })`: botão de ícone com `aria-label` e `title` iguais ao rótulo. Ao clicar, mostra ao lado `<span role="status">Em breve</span>`, que some depois de 3 s (`setTimeout` limpo ao desmontar).
- `TelaEmBreve({ titulo: string; texto: string })`: `<h2>` com o título e um parágrafo. Painel: título "Painel", texto "Em breve: o Painel com os números do EP chega na v1.5.". Ajuda: título "Ajuda", texto "Em breve: a Ajuda da plataforma.".

- [x] Passo 1: testes que falham em `src/App.moldura.test.tsx`:
  - A faixa (`navigation` "Áreas do sistema") tem os botões, em ordem: `['Processos', 'Setores', 'Painel', 'Administração', 'Ajuda']` para o Administrador e sem "Administração" para Integrante e Consulta; em `#/processos/lista`, Processos tem `aria-current="page"`.
  - Em `#/processos?agrupar=setor`, ir a Setores e voltar por Processos leva a `#/processos?agrupar=setor`. Sem nada guardado, leva a `#/processos`. Com o `sessionStorage.getItem` lançando erro (`vi.spyOn`), também leva a `#/processos`.
  - Painel abre a tela com "Em breve: o Painel com os números do EP chega na v1.5." e marca Painel como atual; Ajuda abre a tela da Ajuda.
  - A barra de cima não tem o grupo "Forma de ver os processos"; clicar em "Buscar" e em "Notificações" mostra um `status` "Em breve".
- [x] Passo 2: `npx vitest run src/App.moldura.test.tsx`. Esperado: FAIL.
- [x] Passo 3: implementar as interfaces acima. A barra fica com ícone e título à esquerda e, à direita (`.barra-acoes`), [Buscar] ([lupa]), [Notificações] ([sino]) e o `MenuDaConta`. A Ajuda fica no pé da faixa (`margin-top: auto`, como a `.lateral .fim` da proposta). A `.alternancia` sai do CSS.
- [x] Passo 4: rodar o arquivo novo e os quatro ajustados (`npx vitest run src/App.moldura.test.tsx src/App.test.tsx src/App.lista.test.tsx src/App.administracao.test.tsx src/App.recursosRetirados.test.tsx`). Nos ajustados, o item "Quadro"/"Lista" da faixa vira "Processos", e a troca Quadro ↔ Lista pela barra vira o menu "Quadro ▾", que só existe depois da Tarefa 3. Até lá, nesses testes, a troca vai pelo endereço (`window.location.hash`), e a Tarefa 3 os passa para o menu. Esperado: PASS.
- [x] Passo 5: commit `moldura: Processos na faixa lateral, busca e sino Em breve, telas do Painel e da Ajuda`.

### Tarefa 3: faixa de controles com "Quadro ▾" (Quadro e Lista)

Critérios 1 (ordem e azul único), 2, 3 e 4 do ticket; histórias 1, 2, 4, 6 a 11.

**Arquivos:**
- Criar: `src/components/processos/FaixaDeControles.tsx`, `src/components/processos/MenuDaFormaDeVer.tsx`, `src/components/processos/FaixaDeControles.css`
- Alterar: `src/components/processos/VisaoDosProcessos.tsx` (`BarraDaVisao` e `ControlesDoQuadroNaBarra` saem), `src/components/processos/ControlesDoQuadro.tsx` (sai `AgruparPor`), `src/components/processos/AreaDeProcessos.tsx` (`aoMudarAgrupar` vira `aoMudarFormaDeVer`, que chama `irPara(montarEnderecoDosProcessos(comFormaDeVer(atual, forma)))`), `src/components/processos/Quadro.css` (saem `.quadro-barra` e `.quadro-barra-da-lista`)
- Teste: criar `src/App.formaDeVer.test.tsx`; ajustar `App.agruparPorResponsavel.test.tsx`, `App.agruparPorSetor.test.tsx`, `App.lista.test.tsx`, `App.concluidos.test.tsx`, `App.corDoSetorNoQuadro.test.tsx`, `App.responsavelInicial.test.tsx`, `App.cartaoDoQuadro.test.tsx`, `App.quadro.test.tsx` e os outros que o `npm test` apontar pedindo o grupo "Agrupar por" no Quadro

**Interfaces:**
- `MenuDaFormaDeVer({ forma: FormaDeVer; aoEscolher(forma: FormaDeVer): void; desabilitado: boolean })`: reaproveita o `MenuDeAcoes` com `rotulo="Forma de ver"`, um grupo com as quatro opções (`marcado` na atual), `paraDireita` e `conteudoDoBotao` = ícone `quadro` (ou `lista` na Lista), `ROTULO_DA_FORMA_DE_VER[forma]` e ícone `seta`. O nome acessível do botão é o texto da forma escolhida. Para desabilitar, o `MenuDeAcoes` ganha a prop opcional `desabilitado?: boolean`, repassada ao `<button>`.
- `FaixaDeControles(props)`: `<div className="faixa-de-controles" role="toolbar" aria-label="Controles dos processos">`, nesta ordem: [Cadastrar processo] (só com `podeAlterar`), `MenuDaFormaDeVer`, `<span className="faixa-separador" aria-hidden="true" />`, e então, no Quadro, [Filtros] (Tarefa 4), "Só os meus" e, no Quadro por setor, "Mostrar"; na Lista, "Agrupar por" da Lista, "Mostrar" e [Limpar filtros] quando há filtro. A legenda das etiquetas (`LegendaDasEtiquetas`) fica na ponta direita, só nos três quadros. Recebe `desabilitada: boolean` e repassa `disabled` a todos os controles.

- [x] Passo 1: testes que falham em `src/App.formaDeVer.test.tsx`:
  - No Quadro, o botão "Quadro por etapa" tem `aria-haspopup="menu"`; ao clicar, abre o menu "Forma de ver" com os `menuitemradio` `['Quadro por etapa', 'Quadro por responsável', 'Quadro por setor', 'Lista']`, o primeiro com `aria-checked="true"`.
  - Escolher "Quadro por setor" leva o endereço a `#/processos?agrupar=setor` e o botão passa a se chamar "Quadro por setor"; escolher "Lista" leva a `#/processos/lista`.
  - Pelo teclado: Enter no botão abre o menu com o foco no primeiro item, ArrowDown passa ao segundo, Esc fecha e o foco volta ao botão.
  - O endereço antigo `#/processos?agrupar=responsavel` abre com o botão "Quadro por responsável" e as colunas por pessoa; `#/processos/lista?agrupar=macroprocesso` abre a Lista com a árvore.
  - Com um processo aberto (`#/processos/p1?setor=s1`), escolher "Lista" leva a `#/processos/lista?setor=s1`.
  - Não existe grupo "Agrupar por" no Quadro; na Lista ele existe.
  - Na faixa (`toolbar` "Controles dos processos"), o único botão com a classe `botao-principal` é "Cadastrar processo", e ele vem antes do "Quadro por etapa".
- [x] Passo 2: `npx vitest run src/App.formaDeVer.test.tsx`. Esperado: FAIL.
- [x] Passo 3: implementar. CSS da faixa: `height: 56px; flex-wrap: nowrap; gap: 10px; padding: 0 24px; background: var(--folha); border-bottom: 1px solid var(--linha)`. Os botões seguem a `.btn` da proposta (34px de altura, borda `--linha`); o separador tem 1 × 22px. A faixa fica fora do recuo do `.quadro`, colada na barra de cima.
- [x] Passo 4: rodar o arquivo novo e passar os testes ajustados do "Agrupar por" do Quadro e da Tarefa 2 para o menu (abrir "Quadro por etapa" e escolher a opção). Esperado: PASS.
- [x] Passo 5: commit `faixa: controles do Quadro e da Lista numa faixa, com Quadro ▾ no lugar do Agrupar por`.

### Tarefa 4: [Filtros n] com painel

Critério 5 do ticket; histórias 27 a 33.

**Arquivos:**
- Criar: `src/components/processos/BotaoDosFiltros.tsx`
- Alterar: `src/components/processos/FiltrosDosProcessos.tsx` (o grupo dos cinco seletores passa a ir dentro do painel; `role="group"` e `aria-label` ficam), `FaixaDeControles.tsx`, `FaixaDeControles.css`
- Teste: ajustar `src/App.filtrosDosProcessos.test.tsx` (e os que o `npm test` apontar escolhendo filtro no Quadro): antes de escolher, abrir [Filtros]

**Interfaces:**
- `BotaoDosFiltros({ opcoes: OpcoesDosFiltros; filtros: FiltrosDosProcessos; aoMudar(filtros): void; desabilitado: boolean })`. Botão com ícone `filtro`, texto "Filtros" e, com `quantosFiltros(filtros) > 0`, o contador `<span className="faixa-contador">{n}</span>`; nome acessível "Filtros" sem filtro e "Filtros, {n} ligados" com filtro (`aria-label`); `aria-expanded`; classe `botao-ligado` com filtro. O painel (`role="dialog"`, `aria-label="Filtros"`, sem modal) fica preso embaixo do botão (`position: absolute; top: calc(100% + 4px)`) e abre por cima do quadro, nunca da faixa. Fecha com o botão, com Esc (no `keydown` do painel, com `stopPropagation`) e no clique fora (`useFecharAoClicarFora`). Ao fechar por Esc ou pelo botão, o foco volta ao botão.

- [x] Passo 1: testes que falham:
  - Sem filtro, o botão se chama "Filtros", sem contador e sem `botao-ligado`; não há grupo "Filtros dos processos" na tela.
  - Clicar abre o painel com os seletores Setor, Macroprocesso, Etapa atual, Tipo e Responsável; escolher o setor s1 aplica na hora (endereço `?setor=s1`, quadro filtrado) e o botão passa a se chamar "Filtros, 1 ligados", com `botao-ligado`.
  - Esc com o foco num seletor fecha o painel e devolve o foco ao botão; `pointerdown` no quadro fecha o painel; um segundo clique no botão fecha.
  - "Limpar filtros" no painel zera os filtros; sem resultado, aparece "Nenhum processo com estes filtros." com [Limpar filtros].
  - Os filtros valem do mesmo jeito em "Quadro por responsável" e "Quadro por setor" (mesmo endereço, mesmo contador).
- [x] Passo 2: `npx vitest run src/App.filtrosDosProcessos.test.tsx`. Esperado: FAIL.
- [x] Passo 3: implementar.
- [x] Passo 4: rodar de novo e os que usavam os seletores soltos. Esperado: PASS.
- [x] Passo 5: commit `faixa: Filtros num painel preso ao botao, com contador`.

### Tarefa 5: faixa estável (carregando, filtros ligados, Consulta)

Critérios 1 (posição fixa), 7 e 10 do ticket; histórias 3 e 81 (parte da faixa).

**Arquivos:**
- Alterar: `src/components/processos/VisaoDosProcessos.tsx` (a faixa desenha em `carregando` e `erro` com `desabilitada`, e no estado pronto; o vazio total, sem nenhum processo, continua só com o `QuadroVazio`), `src/components/processos/QuadroDeProcessos.tsx` (o `QuadroCarregando` deixa de ter `.quadro` próprio, se a faixa já o envolve)
- Teste: acrescentar em `src/App.formaDeVer.test.tsx`

- [x] Passo 1: testes que falham:
  - Com o `listarProcessos` falso pendente, a faixa já existe e "Quadro por etapa" e "Filtros" estão `disabled`; resolvida a promessa, ficam habilitados.
  - Os nomes dos controles da faixa, em ordem (`within(faixa).getAllByRole('button').map(nome)`), são os mesmos antes e depois de escolher um filtro, tirando o texto do contador ("Filtros" → "Filtros, 1 ligados").
  - Consulta: a faixa tem "Quadro por etapa" e "Filtros", sem "Cadastrar processo" e sem "Só os meus".
- [x] Passo 2: rodar. Esperado: FAIL nos dois primeiros.
- [x] Passo 3: implementar.
- [x] Passo 4: rodar. Esperado: PASS.
- [x] Passo 5: commit `faixa: aparece desde o carregamento e nao muda com os filtros`.

### Tarefa 6: acabamento visual e tela estreita

Critérios 6 e `[visual]` do ticket.

**Arquivos:** `FaixaDeControles.css`, `Moldura.css`, `LegendaDasEtiquetas.css`

- [x] Passo 1: a legenda encolhe primeiro (`flex: 0 1 auto; min-width: 0; overflow: hidden`), e os controles ficam `flex: none`. A faixa nunca quebra (`flex-wrap: nowrap`); abaixo de 900px, a legenda some (`display: none`).
- [x] Passo 2: conferir na pré-visualização (`dev`, vitrine local com os módulos falsos, como nas entregas anteriores) em 1366×768 e 1440×900: faixa de 56px colada na barra, ordem da proposta 6, só [Cadastrar processo] em azul cheio, painel dos Filtros abaixo da faixa sem cobri-la, barra branca com busca, sino e avatar, faixa lateral grafite com Ajuda no pé. Em 375px, faixa numa linha sem a legenda. Tirar captura.
- [x] Passo 3: commit `faixa: acabamento da proposta 6 e tela estreita`.

### Tarefa 7: conferência final

- [x] Passo 1: `npm test` (suíte inteira) verde; ajustar os testes antigos que ainda pedirem a barra antiga, sem apagar o comportamento que eles provam.
- [x] Passo 2: `npm run lint` e `npm run typecheck` sem erro.
- [x] Passo 3: marcar os critérios do ticket que foram provados e registrar o `[visual]` como visto na vitrine (sem login real).
