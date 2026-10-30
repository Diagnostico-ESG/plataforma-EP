# Lista sem busca e agrupada por Setor

Status: ready-for-agent

Pacote 3 da demanda de 2026-10-30; funcionalidade `lista-por-setor`, mudança em `repositorio-de-processos` e `processos-etapas` (as duas já entregues). Onde as duas specs divergirem desta, vale esta. Decisões da conversa curta do `/planejar` (2026-10-30): árvore por Setor com três níveis; subprocesso sob o pai; a Busca sai sem substituta.

**Como resolve o problema.** A Lista tem hoje um campo "Buscar pelo nome" solto acima da tabela, que repete o que os filtros e a ordenação por coluna já fazem e ocupa a barra, e só sabe agrupar por Macroprocesso, o que não responde "o que o meu setor já mapeou". Esta mudança tira a Busca (com o destaque do trecho no nome e o parâmetro `busca` do endereço) e acrescenta a opção **Setor** ao "Agrupar por" da Lista: a árvore passa a ser setor → macroprocesso → processo, com a mesma linha de arquivos, os mesmos filtros e a mesma ordenação da árvore por Macroprocesso.

## Problema

- A Busca pelo nome divide a barra com os filtros por coluna, e a equipe não a quer mais.
- Para ver o portfólio de um setor, é preciso agrupar por Macroprocesso e procurar o setor dentro de cada macroprocesso.

## Solução

### Sai a Busca

- Saem o campo "Buscar pelo nome" da Lista, o destaque do trecho encontrado no nome (na tabela e na árvore) e o parâmetro `busca` do endereço. Endereço antigo com `busca=` é ignorado (a Lista abre sem busca, sem erro).
- A coluna Processo continua só com ordenação. Para achar um nome ficam a ordem alfabética, os filtros das outras colunas e o Ctrl+F do navegador.
- "Limpar filtros" passa a limpar só os filtros das colunas; aparece quando há filtro de coluna.
- O Quadro não muda (nunca teve a Busca).

### Agrupar por: Nenhum | Macroprocesso | Setor

- O controle da Lista passa a ter três opções. **Setor** monta a árvore setor → macroprocesso → processo:
  - linha do **setor** (selo da sigla, nome e quantidade de processos), com seta;
  - abaixo, a linha do **macroprocesso** (nome e quantidade), com seta;
  - abaixo, os **processos** daquele setor naquele macroprocesso, cada um com a seta que abre a linha dos arquivos, igual à árvore por Macroprocesso.
- Os **subprocessos** ficam recuados sob o processo pai, mesmo os de outro setor (o selo mostra o setor dele), como na árvore por Macroprocesso. O subprocesso cujo pai foi tirado pelos filtros aparece sozinho no ramo do próprio setor, no macroprocesso do pai, com a indicação "subprocesso de <pai>".
- Setores em ordem de sigla; macroprocessos em ordem de nome; processos pela ordenação escolhida no cabeçalho (ordenar por Setor ou Macroprocesso não muda a árvore). Ramos sem processo, depois dos filtros, não aparecem.
- Setores e macroprocessos vêm abertos; processos, fechados. O botão **Abrir todos / Fechar todos** abre e fecha todos os níveis, inclusive os arquivos.
- Os cancelados seguem o bloco "Cancelados" no fim, fora dos ramos, como na árvore por Macroprocesso. Todos | Concluídos, filtros por coluna e a linha dos arquivos valem como hoje.
- **Endereço:** `agrupar=setor` (só na Lista), ao lado de `agrupar=macroprocesso`. No Quadro, `agrupar=setor` continua sendo a visualização por setor, sem mudança.

### Estados da tela

Sem mudança: carregando (tabela fantasma), sem processo, "Nenhum processo com estes filtros.", erro ao carregar com "Tentar de novo", e a linha dos arquivos com "Carregando arquivos…" e erro. Nenhuma tela nova busca dados.

## Modelo de dados

Nenhum: não há tabela, coluna, política nem migração. A mudança é só de interface e de endereço; a árvore usa a mesma lista de processos, o mesmo cadastro de setores e a mesma leitura de arquivos de hoje. Sem dado pessoal novo.

## Decisões de implementação

- `AgruparListaPor` passa a `'nenhum' | 'macroprocesso' | 'setor'`; o endereço lê e grava os três.
- `montarArvore` ganha a ordem setor → macroprocesso, reaproveitando a regra do subprocesso e a contagem; o que hoje se chama macro/setor da árvore é generalizado só no que for repetido de verdade (nada de abstração a mais).
- Remover `BuscaDaLista`, `NomeComTrecho`, `buscaNaLista` (e testes), o campo `busca` de `FiltrosDosProcessos`, de `SEM_FILTROS`, do endereço e de `temFiltro`, e o destaque em `LinhaDoProcesso`, `TabelaDeProcessos` e `ArvoreDaLista`.
- Construído além do previsto (ver `desvios.md`): o parâmetro `substituir` de `useEndereco` e o CSS da busca (`--busca-marca`, `.busca-*`) saíram junto, por só existirem para a Busca; as linhas de grupo da árvore ganharam as classes `grupo-raiz` (primeiro nível: macroprocesso numa árvore, setor na outra) e `grupo-filho` (nível recuado), no lugar de estilo preso a "macroprocesso" e "setor"; a árvore por Macroprocesso ficou com a mesma aparência. Os cancelados e o recuo dos processos seguem iguais.

## Decisões de teste

- Ponto de teste: a tela inteira, pelo aplicativo montado com os módulos falsos de hoje.
- Funções puras: a montagem da árvore por Setor (ordem, subprocesso sob o pai, pai filtrado, ramos vazios) e o endereço (`agrupar=setor`; `busca=` ignorado).
- Saem os testes da Busca (`App.buscaNaLista.test.tsx`, `buscaNaLista.test.ts`); os demais ajustam o que citava `busca`.

## Fora do escopo

- Qualquer outra forma de buscar por nome (filtro de texto no cabeçalho Processo).
- Mudar a árvore por Macroprocesso, o Quadro ou a visualização por setor do Quadro.
- Agrupar a Lista por Responsável ou Etapa.

## Critérios de aceite

1. A Lista não mostra o campo "Buscar pelo nome"; um endereço com `busca=` abre a Lista sem erro e sem busca.
2. O nome do processo não ganha trecho marcado em lugar nenhum.
3. "Limpar filtros" só aparece com filtro de coluna e os limpa.
4. "Agrupar por" da Lista oferece Nenhum, Macroprocesso e Setor; escolher Setor mostra setor → macroprocesso → processo e grava `agrupar=setor` no endereço; recarregar mostra a mesma visão.
5. Cada ramo traz o nome e a quantidade; setores por sigla, macroprocessos por nome, processos pela ordenação escolhida; ramos vazios não aparecem.
6. O subprocesso aparece sob o pai, mesmo de outro setor; sem o pai nas linhas, aparece sozinho no próprio setor com "subprocesso de <pai>".
7. Setores e macroprocessos vêm abertos, processos fechados; Abrir todos / Fechar todos abre e fecha tudo, inclusive os arquivos.
8. A linha dos arquivos, os filtros por coluna, Todos | Concluídos e o bloco de cancelados funcionam na árvore por Setor como na por Macroprocesso.
9. O Quadro (por etapa, responsável e setor) segue igual.
10. [visual] A barra da Lista fica sem a Busca e com os três botões do "Agrupar por" legíveis; na árvore por Setor, as linhas de setor, macroprocesso e processo se distinguem e os subprocessos aparecem recuados.

Implementado em 2026-10-30 (commit dcbb176)
Entregue em 2026-10-30 (commit 2b785d5), com ressalva: critério [visual] 10 de lista-por-setor visto só em página local com módulos falsos (nada visto com o login real); revisão de segurança dispensada (a mudança só lê o parâmetro agrupar do endereço, sem login, dado pessoal, banco ou arquivos), com revisão de reserva por leitura; as ressalvas das entregas anteriores seguem valendo
