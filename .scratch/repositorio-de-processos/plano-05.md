# Ticket 05 (Árvore por Macroprocesso com os arquivos): plano de execução

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa. Marque `- [x]` ao fim de cada passo.

**Objetivo:** dar à Lista a opção "Agrupar por: Macroprocesso" (árvore macroprocesso → setor → processo) com a linha dos arquivos da versão mais recente em cada processo.

**Arquitetura:** a montagem da árvore é uma função pura (`arvoreDaLista.ts`) que recebe as linhas já filtradas e ordenadas (as mesmas da tabela) e só as agrupa. O estado de aberto/fechado e a busca dos arquivos ficam em dois hooks pequenos; a tela da árvore é a mesma `<table>` com linhas de grupo e linhas de arquivos. Os arquivos vêm de `ModuloDeVersoes.listarVersoes` (o que o verso já lê) e abrem pelo `LinkDoArquivo` do verso.

**Tecnologia:** React + TypeScript, Vitest + Testing Library. Nenhuma dependência nova. Sem banco.

**Spec:** `.scratch/repositorio-de-processos/spec.md`, seções "Lista: Agrupar por Macroprocesso", "Endereço da página (S20)", "Estados da tela". Ticket: `issues/05-arvore-por-macroprocesso-com-arquivos.md`.

## Restrições gerais

- Sem mudança no banco nem nas Edge Functions; nenhuma regra de `banco.md` se aplica (só leitura, pelo módulo que já existe).
- Limites do ESLint (função até 20 linhas, arquivo até 300, complexidade até 10).
- Sem miniatura do .png, sem anexos; a Consulta usa a mesma tela (nada edita).

## Decisões de execução (a spec não fixa)

- **Endereço:** campo novo `agruparLista: 'nenhum' | 'macroprocesso'` em `EnderecoDosProcessos`, só na Lista; o `agrupar` do Quadro não muda. Omitido ao montar, vale `nenhum`. O padrão não vai ao endereço.
- **Cancelados na árvore:** o mesmo bloco "Mostrar cancelados (N)" da tabela, no fim, fora dos ramos; as colunas Setor e Macroprocesso já mostram o setor e o macroprocesso de cada um.
- **Macroprocesso do subprocesso:** o do pai, lido de `todos`; se o pai não existir em `todos`, o do próprio subprocesso.
- **Contagem:** a do macroprocesso e a do setor contam os processos e subprocessos que estão sob ele.
- **Abrir todos / Fechar todos:** um botão só, que vale "Abrir todos" enquanto algo está fechado e "Fechar todos" quando tudo está aberto. Fechar todos fecha também os macroprocessos e setores.
- **Arquivos:** a busca refaz-se a cada vez que o processo abre (assim não fica velha depois de enviar uma versão no verso); enquanto refaz, mostra o que já tinha.

## Foco da revisão

1. Subprocesso de outro setor sob o pai (selo do setor dele) e subprocesso com o pai filtrado ("subprocesso de <pai>", sob o setor dele, no macroprocesso do pai).
2. Filtro, busca, Concluídos e ordenação valendo na árvore; ramo sem processo some.
3. Erro na busca dos arquivos de um processo não derruba os outros nem fecha a linha.
4. Recarregar com `agrupar=macroprocesso` mostra a árvore; voltar para Nenhum tira o parâmetro.

---

### Tarefa 1: montagem pura da árvore

**Arquivos:** criar `src/processos/arvoreDaLista.ts` e `arvoreDaLista.test.ts`.

**Interfaces:**
- Consome: `LinhaDaLista` (`linhasDaLista.ts`), `ProcessoDaLista`, `SetorDoQuadro` (`tipos.ts`).
- Produz:
  `type ItemDaArvore = { linha: LinhaDaLista; nivel: number; subprocessoDe: string | null }` (`nivel` 0 = processo, 1 = subprocesso recuado; `subprocessoDe` = nome do pai só quando o pai não está nas linhas);
  `type SetorDaArvore = { id: string; sigla: string; nome: string; cor: number; itens: ItemDaArvore[] }`;
  `type MacroDaArvore = { id: string; nome: string; total: number; setores: SetorDaArvore[] }`;
  `montarArvore(linhas: LinhaDaLista[], todos: ProcessoDaLista[], setores: SetorDoQuadro[]): MacroDaArvore[]`.

- [x] **Passo 1: testes que falham** em `arvoreDaLista.test.ts`:
  - dois macroprocessos saem por nome; setores de um macro saem por sigla; um setor aparece sob cada macro de que tem processo;
  - os processos de um setor mantêm a ordem das linhas recebidas (ordenar por Setor ou Macroprocesso não muda a árvore);
  - subprocesso de outro setor fica no grupo do pai, logo depois dele, com `nivel` 1 e a sua `linha.setorSigla`;
  - subprocesso cujo pai não está nas linhas fica no grupo do próprio setor, dentro do macro do pai (lido de `todos`), com `subprocessoDe` igual ao nome do pai e `nivel` 0;
  - `total` do macro e `itens.length` do setor contam processos e subprocessos; macro/setor sem linha não aparecem;
  - `nome` e `cor` do setor vêm de `setores` (sem o setor na lista: sigla como nome e cor 1).
- [x] **Passo 2:** `npx vitest run src/processos/arvoreDaLista.test.ts`; esperado: FAIL (módulo inexistente).
- [x] **Passo 3:** implementar `montarArvore`. Filhos por `processoPaiId` só quando o pai está nas linhas; raízes na ordem recebida; cada raiz entra no macro (o do pai se for subprocesso sem pai nas linhas) e no setor próprio; depois do pai vêm os filhos, em ordem. Ordenar macros por nome e setores por sigla com `localeCompare('pt-BR', { sensitivity: 'base' })`.
- [x] **Passo 4:** rodar o arquivo; verde. Commit `repositorio-de-processos 05: montagem da árvore`.

### Tarefa 2: `agrupar=macroprocesso` no endereço

**Arquivos:** modificar `src/processos/enderecoDosProcessos.ts` e `.test.ts`; `AreaDeProcessos.tsx` passa o campo (a tela vem na tarefa 5).

**Interfaces:**
- Produz: `type AgruparListaPor = 'nenhum' | 'macroprocesso'`; `EnderecoDosProcessos.agruparLista: AgruparListaPor`; em `EnderecoParaMontar`, `agruparLista?` opcional (vale `nenhum`).

- [x] **Passo 1: testes que falham:** ler `#/processos/lista?agrupar=macroprocesso` dá `agruparLista: 'macroprocesso'`; `agrupar=outro` dá `nenhum`; no Quadro (`#/processos?agrupar=macroprocesso`) dá `nenhum` e `agrupar` continua `etapa`; montar com `macroprocesso` escreve `agrupar=macroprocesso` só na Lista; montar com `nenhum` não escreve; ida e volta preserva; `agrupar=setor` no Quadro continua igual.
- [x] **Passo 2:** rodar o arquivo; FAIL.
- [x] **Passo 3:** implementar a leitura em `lerEnderecoDosProcessos` e a escrita em `consultaDoEndereco` (a Lista usa a chave `agrupar`; o Quadro, a dele).
- [x] **Passo 4:** `npx vitest run src/processos/enderecoDosProcessos.test.ts` e `npm run typecheck`; verde. Commit `repositorio-de-processos 05: agrupar da Lista no endereço`.

### Tarefa 3: arquivos da versão mais recente (puro) e busca por processo (hook)

**Arquivos:** criar `src/versoes/arquivosDaArvore.ts` + `.test.ts` e `src/hooks/useArquivosDosProcessos.ts` + `.test.tsx`.

**Interfaces:**
- Produz:
  `type ArquivosDaArvore = { rotulo: string; aprovada: boolean; arquivos: { arquivo: ArquivoDaVersao; rotulo: string }[] }`;
  `arquivosDaVersaoMaisRecente(versoes: Versao[]): ArquivosDaArvore | null` (`null` = "Sem versão ainda."): usa `ordenarVersoes(versoes)[0]`, `rotuloDaVersao`, os arquivos `bpm`/`png`/`bpmn` em `emOrdemDeExibicao` com `rotuloCurtoDoArquivo`, e os relatórios de `relatoriosDaVersao` com `textoDoRelatorio`, na ordem .png, .bpm, relatório, .bpmn, como no destaque do verso;
  `type EstadoDosArquivos = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronto'; versoes: Versao[] }`;
  `useArquivosDosProcessos(modulo: ModuloDeVersoes): { estados: Record<string, EstadoDosArquivos>; buscar(ids: string[]): void }`.

- [x] **Passo 1: testes que falham:** puro: lista vazia dá `null`; V7 com .png, .bpm e relatório numerado 2 dá rótulo `V7` e a ordem `Imagem .png`, `Fluxograma .bpm`, `Relatório V2`; aprovada marcada; versão piloto `V6P`; histórica `V5F` sem relatório de outra versão; relatório da versão anterior sai como `Relatório V2 (da V7)`; o `.pdf` antigo sem número sai como `Relatório .pdf`. Hook (`renderHook`): `buscar(['p1'])` passa por `carregando` e chega a `pronto` com as versões do falso; falha de leitura vira `erro` só naquele id; `buscar` de novo no id com `erro` volta a `carregando`; `buscar` de id já `pronto` mantém o `pronto` enquanto refaz.
- [x] **Passo 2:** rodar os dois arquivos; FAIL.
- [x] **Passo 3:** implementar. O hook guarda `Record` em `useState`; `buscar` marca `carregando` só para quem ainda não tem estado `pronto`, chama `modulo.listarVersoes` e grava `pronto` ou `erro`.
- [x] **Passo 4:** rodar os dois arquivos; verde. Commit `repositorio-de-processos 05: arquivos da versão mais recente`.

### Tarefa 4: peças da árvore (estado aberto/fechado e linhas)

**Arquivos:** criar `src/hooks/useAbertosDaArvore.ts` + `.test.ts`, `src/components/processos/LinhaDoProcesso.tsx` (sai de `TabelaDeProcessos.tsx`), `LinhasDeGrupo.tsx`, `LinhaDosArquivos.tsx`, `ArvoreDaLista.css`; modificar `TabelaDeProcessos.tsx`.

**Interfaces:**
- Consome: tarefas 1 e 3; `LinkDoArquivo`, `SeloDoSetor`, `Pilula`, `ErroAoCarregar`.
- Produz:
  `useAbertosDaArvore(arvore: MacroDaArvore[])`: `{ grupoAberto(chave): boolean; processoAberto(id): boolean; alternarGrupo(chave); alternarProcesso(id): boolean /* devolve se ficou aberto */; tudoAberto: boolean; abrirTudo(): string[] /* ids dos processos */; fecharTudo() }`; chaves: `m:<macroId>` e `s:<macroId>:<setorId>`. Macros e setores abrem por padrão; processos, fechados.
  `LinhaDoProcesso` (exportada, props como hoje + `arvore?: { nivel: number; aberto: boolean; subprocessoDe: string | null; aoAlternar(): void }`): com `arvore`, mostra antes do nome a seta (`<button aria-expanded>` "Abrir/Fechar arquivos de <nome>", que não abre o verso), recua pelo `nivel` e troca o "↳ pai" por "subprocesso de <pai>" quando `subprocessoDe`.
  `LinhaDoMacro`, `LinhaDoSetor` (`<tr class="linha-de-macro|linha-de-setor">` com `<th scope="rowgroup" colSpan>` e botão `aria-expanded` de nome acessível "<nome>, N processos"; o do setor leva o `SeloDoSetor` e o nome).
  `LinhaDosArquivos({ estado, modulo, aoTentarDeNovo })`: `<tr class="linha-dos-arquivos"><td colSpan>`: carregando → `<p role="status">Carregando arquivos…</p>`; erro → `ErroAoCarregar alvo="os arquivos"` (a frase do padrão do projeto, com "Tentar de novo"); sem versão → "Sem versão ainda."; pronto → rótulo da versão, `Pilula` "Aprovada" quando for o caso e um `LinkDoArquivo` por arquivo (`rotulo` curto).

- [x] **Passo 1: testes que falham:** hook: abre com macros e setores abertos e processos fechados; `alternarProcesso` devolve `true` ao abrir; `tudoAberto` só quando tudo está aberto; `abrirTudo` devolve os ids de todos os processos da árvore; `fecharTudo` fecha macros, setores e processos. Componentes (`LinhasDeGrupo.test.tsx`, `LinhaDosArquivos.test.tsx`): o botão do macro tem o nome "Macro Um, 2 processos" e `aria-expanded`; "1 processo" no singular; a linha dos arquivos mostra cada um dos quatro estados; clicar no link do arquivo chama `baixarArquivo` do falso.
- [x] **Passo 2:** rodar os arquivos novos; FAIL.
- [x] **Passo 3:** implementar; mover `LinhaDoProcesso` para o arquivo próprio (a tabela comum a importa, sem mudar o que faz hoje); CSS: macro e setor com fundo próprio e peso de título, subprocesso com recuo, linha dos arquivos com o fundo do processo e recuo, sem borda entre o processo e ela (critério 6 `[visual]`).
- [x] **Passo 4:** `npx vitest run src/components src/hooks`; verde (a Lista atual não pode mudar). Commit `repositorio-de-processos 05: linhas da árvore`.

### Tarefa 5: a árvore na Lista

**Arquivos:** criar `src/components/processos/ArvoreDaLista.tsx`, `src/App.arvoreDaLista.test.tsx`; modificar `ControlesDoQuadro.tsx` (`AgruparListaPor`), `VisaoDosProcessos.tsx`, `AreaDeProcessos.tsx`, `TabelaDeProcessos.tsx` (o bloco dos cancelados passa a ser reaproveitável pela árvore).

**Interfaces:**
- Consome: tarefas 1 a 4; `VisaoDosProcessosProps` ganha `agruparLista` e `aoMudarAgruparLista`.
- `ArvoreDaLista({ cabecalho, linhas, todos, setores, cancelados, idEscolhido, aoAbrir, busca, modulo })`: monta a árvore, tem o botão "Abrir todos" / "Fechar todos" acima da tabela e liga o estado aberto/fechado à busca dos arquivos (abrir um processo ou "Abrir todos" chama `buscar`).

- [ ] **Passo 1: testes de tela que falham** em `App.arvoreDaLista.test.tsx` (mesma montagem de `App.listaPorColuna.test.tsx`, com `VersoesFalso` preenchido):
  - "Agrupar por" na Lista tem `Nenhum` e `Macroprocesso`; escolher `Macroprocesso` mostra o macro (nome e quantidade) e abaixo o setor, e o endereço fica `?agrupar=macroprocesso`; `Nenhum` volta à tabela e tira o parâmetro (critérios 1 e 9);
  - o mesmo setor aparece sob dois macroprocessos quando tem processo nos dois; macro sem processo depois do filtro não aparece (critério 2);
  - subprocesso recuado sob o pai de outro setor, com o selo do setor dele; com o pai filtrado, aparece sob o próprio setor com "subprocesso de <pai>" (critério 3);
  - filtro por coluna, busca, Concluídos e ordenação valem (a ordem dos processos no setor muda; a dos macros e setores não) (critério 4);
  - clicar na seta de um processo mostra "Carregando arquivos…" e depois V7, "Aprovada", os links e o relatório; clicar no link baixa pelo falso; processo sem versão mostra "Sem versão ainda."; só os abertos foram lidos (critérios 6 e 7);
  - falha de leitura mostra "Não foi possível carregar os arquivos." com "Tentar de novo", a árvore e a linha continuam, e tentar de novo carrega (critério 7);
  - "Abrir todos" abre tudo e lê os arquivos de todos os processos visíveis; "Fechar todos" fecha todos os níveis; o rótulo do botão alterna;
  - cancelados: "Mostrar cancelados (N)" no fim, fora dos ramos, mostra o bloco com setor e macroprocesso de cada um (critério 8);
  - Consulta vê a árvore e abre os arquivos; nenhum botão de edição (critério 10);
  - clicar no nome do processo abre o verso; recarregar com `?agrupar=macroprocesso` já mostra a árvore.
- [ ] **Passo 2:** rodar o arquivo; FAIL.
- [ ] **Passo 3:** implementar a ligação (`ListaDosProcessos` escolhe entre `TabelaDeProcessos` e `ArvoreDaLista`; `AgruparListaPor` reaproveita `ControleDeOpcoes`; `AreaDeProcessos` liga `aoMudarAgruparLista` a `irParaVisao({ agruparLista, aberto: null })`).
- [ ] **Passo 4:** rodar o arquivo, depois `npm test`, `npm run lint` e `npm run typecheck`; verde. Commit `repositorio-de-processos 05: árvore por macroprocesso na Lista`.

### Tarefa 6: tela real e registros

- [ ] **Passo 1:** ver a árvore numa vitrine provisória com os módulos falsos no navegador (macro, setor, subprocesso recuado, linha dos arquivos aberta, 1366×768) e conferir o critério 6 `[visual]`; remover a vitrine. Se não for possível, registrar em `desvios.md`.
- [ ] **Passo 2:** acrescentar a `desvios.md` a entrada datada do ticket 05 (decisões de execução acima, o que ficou de fora, a ressalva visual); marcar as caixas deste plano.
- [ ] **Passo 3:** commit `repositorio-de-processos 05: plano marcado e desvios`.
