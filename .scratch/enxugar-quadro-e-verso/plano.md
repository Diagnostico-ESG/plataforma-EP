# Quadro, verso e Lista mais enxutos — plano de execução

> Para quem executa: use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas. Isolamento já feito: branch `enxugar-quadro-e-verso`, pasta principal, sem worktree.

**Spec:** `.scratch/enxugar-quadro-e-verso/spec.md` (única, sem tickets). Decisões: ADR 0042. Este plano só diz ordem, arquivos e teste de cada tarefa; os requisitos ficam na spec (cite "critério N").
**Banco:** não muda (sem migração, sem teste de banco, sem `db:types`).
**Regras de código que valem em todas as tarefas** (`CLAUDE.md`): TDD (teste que falha primeiro; teste prova um comportamento), funções de 4–20 linhas, arquivos até 300 linhas, sem `any`, sem `--no-verify`, um commit por tarefa com `npm test` verde dos arquivos tocados.
**Testes de tela:** ficam em `src/App.*.test.tsx` com as implementações falsas dos módulos; CSS lido do arquivo em `Quadro.css.test.ts`. Medidas e cores não se testam no jsdom (critérios `[visual]`).

---

## Tarefa 0 — Prévia aprovada (critério 18) · PORTÃO: nenhuma tarefa abaixo começa sem o "aprovado" do usuário

**Arquivos:** criar `.scratch/enxugar-quadro-e-verso/previa-quadro.html` e `previa-verso.html` (HTML solto, dados inventados, fora do `src/`, sem dependência).

- [x] 0.1 Ler `src/components/processos/{Quadro,Painel,Etapas,Contexto}.css`, `src/components/versoes/Versoes.css`, `src/styles/tokens.css` e copiar as variáveis de cor reais para a prévia, para ela parecer o app.
- [x] 0.2 `previa-quadro.html`: as colunas com faixa neutra única (título dentro, alinhado à margem dos cartões) nos três quadros (etapa com ícone+nome+número cinza; setor com sigla em negrito + nome abaixo + número; responsável com avatar+nome+número), uma coluna vazia, cartão parado com borda comum e selo de dias, selo do setor menor (sem a letra mudar de 13px).
- [x] 0.3 `previa-verso.html`: o verso rearrumado em 1366×768 — trilha de ícones sem data, Agora (seletores sem rótulo visível, responsável sem [Assumir]), campo "Data da modelagem piloto", Documentos com a miniatura até o dobro, Anotações com metade da altura. Se houver mais de uma arrumação plausível, mostrar duas (A e B) na mesma página, com a recomendação.
- [ ] 0.4 Abrir as duas no navegador do app, conferir em 1366×768 e mostrar ao usuário (captura + caminho dos arquivos). Registrar a aprovação (ou o pedido de ajuste) em `.scratch/enxugar-quadro-e-verso/desvios.md` com a data. Comitar as prévias e o registro.

## Tarefa 1 — Selo do setor menor e cartão parado sem borda (critérios 11, 13, 15)

**Arquivos:** `src/components/SeloDoSetor.css`; `src/components/processos/Quadro.css` (regra `.cartao.cartao-parado`, ~linha 465); teste `src/components/processos/Quadro.css.test.ts`.

- [x] 1.1 Teste novo em `Quadro.css.test.ts`: o CSS não tem regra de borda para `.cartao-parado` (falha hoje).
- [x] 1.2 Remover a regra; conferir com grep se a classe `cartao-parado` é usada por outro estilo ou teste (`grep -rn cartao-parado src`), e deixar a classe só se algo depender dela. O selo de dias (`selosDoCartao`) não muda.
- [x] 1.3 `SeloDoSetor.css`: diminuir só o preenchimento (altura e largura), letra de 13px intacta. Sem teste (visual).
- [x] 1.4 `npm test -- Quadro.css cartaoDoQuadro SeloDoSetor` verde; commit.

## Tarefa 2 — Agora: sem rótulos "Etapa"/"Status" e sem [Assumir] (critérios 1, 2)

**Arquivos:** `src/components/processos/CorpoDoAgora.tsx` (`ListasDoAgora`, `ResponsavelDoAgora`); `src/processos/agoraDoProcesso.ts` (`podeAssumir`, `opcoesDeResponsavel`); `src/components/processos/Agora.css`; testes `src/App.agoraDoVerso.test.tsx`, `src/processos/agoraDoProcesso.test.ts`, `src/App.responsavelInicial.test.tsx` (e qualquer outro que o grep de "Assumir" achar).

- [x] 2.1 Rodar `grep -rn "Assumir" src` e listar todos os lugares (spec: "sai também dos lugares fora do Agora").
- [x] 2.2 Testes que falham: (a) nenhum botão "Assumir" no verso; (b) a seleção de responsável lista "Você" em primeiro lugar e escolhê-lo grava o usuário da tela; (c) escolher a si mesmo na Revisão interna sendo o autor da versão mostra o aviso do revisor sem impedir (critério 1); (d) os seletores respondem a `getByRole('combobox', { name: 'Etapa' })` e `'Status'` e não há texto visível "Etapa"/"Status" como rótulo (o `<label>` vira `aria-label`); (e) Consulta continua sem poder trocar o responsável.
- [x] 2.3 Implementar: trocar `<label>`/`<span className="agora-campo">` por `aria-label` nos dois seletores (em Concluídos, o Status fixo também sem rótulo visível, com nome acessível); apagar o botão e `podeAssumir` (e o teste unitário dele) se ninguém mais o usa; garantir "Você" no topo em `opcoesDeResponsavel`.
- [x] 2.4 Ajustar os testes antigos de Assumir para provar a ausência; `npm test -- agoraDoVerso agoraDoProcesso responsavelInicial` verde; commit.

## Tarefa 3 — Data da modelagem piloto em campo fixo; linha de etapas só visual (critérios 7, 8)

**Arquivos:** `src/components/processos/DataDaModelagemPiloto.tsx` (rótulo "Realizada em" → "Data da modelagem piloto", textos); `EtapasDoProcesso.tsx` (sai a data da linha); `CorpoDoAgora.tsx` (sai `DataDaModelagemNoAgora`); `VersoDoCartao.tsx` (`ColunasDoVerso`) ou o bloco que a prévia indicar; `src/processos/dataDaModelagemPiloto.ts` (regra "da Modelagem piloto em diante", reaproveitar a que a linha de etapas usa); testes `src/App.dataDaModelagemPiloto.test.tsx`, `src/App.etapasDoVerso.test.tsx`.

- [x] 3.1 Testes que falham: campo "Data da modelagem piloto" presente na Modelagem piloto e em etapa posterior, ausente em Não iniciados; registrar/alterar com as regras de hoje (futuro recusado, uma por processo, não move o processo); Consulta só lê (e só vê se existir); a linha de etapas não contém data nem "Realizada em".
- [x] 3.2 Extrair a regra de visibilidade para função nomeada em `dataDaModelagemPiloto.ts` (por posição no catálogo, `etapasDoVerso`), com teste unitário.
- [x] 3.3 Implementar o campo fixo no lugar definido pela prévia aprovada; remover do Agora e da linha. `npm test -- dataDaModelagemPiloto etapasDoVerso agoraDoVerso`; commit.

## Tarefa 4 — Sem envio de .bpmn (critérios 3, 4)

**Arquivos:** `src/versoes/rotulos.ts` (`papeisQueSePodeAcrescentar` → só `png`); `src/versoes/formularioDeVersao.ts` (campos e validação, inclusive a histórica passa a exigir `.bpm`); `src/components/versoes/{FormularioDeVersao,AcrescentarArquivo,ListaDeVersoes,VersaoEmDestaque}.tsx`; testes `src/versoes/rotulos.test.ts`, `src/versoes/formularioDeVersao.test.ts`, `src/App.enviarVersao.test.tsx`, `App.versaoPiloto`, `App.registrarVersaoHistorica`, `App.acrescentarArquivo`, `App.substituirArquivo`, `App.baixarArquivo`.

- [ ] 4.1 Testes que falham: `papeisQueSePodeAcrescentar` devolve só `['png']` (ou `[]` com .png presente); formulários Enviar versão (piloto e sequência) sem campo .bpmn; histórica recusa envio sem `.bpm` com mensagem que traz o valor recebido e o formato esperado (ver `recusasDeVersoes.ts`); um .bpmn já enviado continua com link para baixar e "Substituir".
- [ ] 4.2 Implementar na tela só (a função do Drive e o banco continuam aceitando .bpmn, ADR 0042). Atualizar os testes antigos que enviavam .bpmn.
- [ ] 4.3 `npm test -- versoes enviarVersao versaoPiloto registrarVersaoHistorica acrescentarArquivo substituirArquivo baixarArquivo`; commit.

## Tarefa 5 — Sem [Enviar relatório]; confirmação de arquivos leva a um caminho que existe (critérios 5, 6)

**Arquivos:** `src/components/versoes/SecaoDeVersoes.tsx` (`AcoesDaSecao`, `Aberto`, `FormularioAberto`); `src/versoes/rotulos.ts` (`podeEnviarRelatorioNaEtapa`, `ROTULO_DO_ENVIO`); `src/components/versoes/FormularioDeRelatorio.tsx` (mantém só se servir o "+ Acrescentar relatório"; senão apagar com o teste); `src/components/processos/JanelaDeEnvioDeArquivos.tsx` e `JanelaDaConfirmacaoDeArquivos.tsx` + `src/processos/frasesDaConfirmacaoDeArquivos.ts`; testes `App.relatorioDepois`, `App.enviarArquivosAgora`, `App.confirmacaoDeArquivos`, `App.versoesNoProcesso`, `src/versoes/rotulos.test.ts`.

- [ ] 5.1 Ler antes `JanelaDeEnvioDeArquivos.tsx` (hoje abre `FormularioDeRelatorio` quando falta só o relatório) e `useMovimentoDoProcesso` (de onde vem `pedido.faltas`).
- [ ] 5.2 Testes que falham: nas etapas Relatório e modelagem técnica e Revisão interna não há [Enviar relatório] e o botão diz "Enviar versão"; na Modelagem piloto diz "Enviar versão piloto"; "+ Acrescentar relatório" continua na versão mais recente; mover para a frente com relatório faltando e escolher [Enviar arquivos agora] abre o "+ Acrescentar relatório" (versão existente) ou o formulário Enviar versão (versão em sequência faltando) — nunca o formulário de relatório.
- [ ] 5.3 Implementar; apagar `podeEnviarRelatorioNaEtapa` e o formulário órfão, se ficarem sem uso. `npm test -- relatorioDepois enviarArquivosAgora confirmacaoDeArquivos versoesNoProcesso rotulos`; commit.

## Tarefa 6 — Lista agrupada (critérios 9, 10, 19 parcial)

**Arquivos:** `src/components/processos/{TabelaDeProcessos,LinhaDoProcesso,ArvoreDaLista,SeloDeParado,DiasNaEtapa}.tsx` + `Quadro.css`/`ArvoreDaLista.css` (`.lista-parado`); testes `src/App.lista.test.tsx`, `App.listaPorColuna`, `App.arvoreDaLista`, `App.arvoreDaListaPorSetor`.

- [ ] 6.1 Testes que falham: com "Agrupar por: Macroprocesso" e "Setor" não há colunas Macroprocesso e Setor; com "Nenhum" há; filtro e ordenação das colunas que ficam seguem iguais; processo parado: na célula da Etapa atual há relógio + número ("8"), com `aria-label` e `title` "8 dias nesta etapa", e o nome do processo não traz mais o selo.
- [ ] 6.2 Implementar (versão compacta do selo: relógio + número; reusar `diasDoProcessoParado`). `npm test -- lista arvoreDaLista listaPorColuna`; commit.

## Tarefa 7 — Quadro: faixas de fundo e títulos sem pílula (critérios 14, 12 do visual)

**Arquivos:** `src/components/processos/{ColunaDoQuadro,MatrizDoQuadro,LinhasDeGrupo,QuadroDeProcessos}.tsx`, `Quadro.css`, `Matriz.css`; token novo em `src/styles/tokens.css` (cor da faixa, claro e escuro); testes `App.quadro`, `App.linhasDoQuadro`, `App.corDoSetorNoQuadro`, `App.arrastarParaMover`, `Quadro.css.test.ts`, `Matriz.css.test.ts`.

- [ ] 7.1 Testes que falham: título do Quadro por setor sem a pílula (sigla em negrito, nome abaixo, quantidade como texto); por etapa com ícone, nome e quantidade; por responsável com avatar, nome e quantidade; coluna vazia continua com a faixa (estrutura presente); arrastar cartão entre colunas continua movendo; `Quadro.css.test.ts` confere que `position: relative` da correção de 2026-11-04 continua.
- [ ] 7.2 Implementar: fundo no contêiner da coluna (título e cartões dentro), mesmo recuo lateral nos dois, token novo; valer nas Linhas.
- [ ] 7.3 `npm test -- quadro linhasDoQuadro corDoSetorNoQuadro arrastarParaMover Quadro.css Matriz.css`; commit.

## Tarefa 8 — Verso rearrumado, Anotações e miniatura (critérios 16, 17)

**Arquivos:** `src/components/processos/{VersoDoCartao,BlocoDasAnotacoes,Verso.css? (achar com grep "verso-corpo")}`, `src/components/versoes/{VersaoEmDestaque,Versoes.css}`, CSS das Anotações (`grep -rn "anotacoes-campo\|min-height" src/components/processos/*.css`); testes `App.anotacoesDoProcesso`, `App.miniaturaDoFluxograma`, `App.versoEnxuto*`.

- [ ] 8.1 Anotações: altura mínima de 21 para 10,5 linhas; guardar sozinho intacto (testes existentes verdes; o campo continua rolando/crescendo).
- [ ] 8.2 Miniatura: tamanho em `VersaoEmDestaque` até o dobro; o fallback (ícone + aviso) continua (`App.miniaturaDoFluxograma`).
- [ ] 8.3 Disposição dos blocos exatamente como na prévia aprovada (Tarefa 0). Conferir no app (Vite) em 1366×768, sem rolagem a mais.
- [ ] 8.4 `npm test -- anotacoesDoProcesso miniaturaDoFluxograma versoEnxuto`; commit.

## Tarefa 9 — Registro, conferência final e fechamento

- [ ] 9.1 Acréscimo datado em `.scratch/identidade-visual.md` (selo menor, faixa das colunas, cartão parado sem borda, miniatura maior).
- [ ] 9.2 `npm test` completo, `npx tsc --noEmit` (ou o script de typecheck do `package.json`) e `npm run lint` verdes (critério 12 de pronto). Se o teste instável `App.relatorioDepois` falhar, rodar de novo e anotar no `desvios.md`.
- [ ] 9.3 Conferência visual no app real (Vite, 1366×768) dos critérios `[visual]` 13–19 que o login permitir; o que não for visto vai como "presumido" para o `/ship`. Registrar em `.scratch/enxugar-quadro-e-verso/desvios.md`.
- [ ] 9.4 Marcar todas as caixas; comitar. Depois, fora deste plano: merge na `main`, `git branch -d`, linha `Implementado em` no fim da spec, `proximo-passo.md`, envio da `main` ao GitHub.

---

## Autoverificação contra a spec
Solução 1→T1 · 2→T1 · 3→T7 · 4,5→T2 · 6→T4 · 7→T5 · 8,9→T3 · 10,11→T8 · 12→T6 · 13→T0. Critérios 1,2→T2 · 3,4→T4 · 5,6→T5 · 7,8→T3 · 9,10→T6 · 11→T1 · 12→T9 · 13–19→T1,T7,T8,T6,T0.
