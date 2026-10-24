# Plano do ticket 25: tela do andamento livre

> Executar com `superpowers:executing-plans`. Marcar `- [x]` ao fim de cada tarefa.

**Ticket:** `.scratch/processos-etapas/issues/25-tela-do-andamento-livre.md` (requisitos e critérios estão lá e na spec; aqui só a execução).
**Spec:** `.scratch/processos-etapas/spec.md`, seção "Andamento livre" (histórias 200 a 254, Interface, Decisões de teste).
**Branch:** `quadro-livre-parte-1` (de integração; **não** se junta à `main` neste ticket, ver o ticket 24 e o ticket 04 de publicacao-e-arquivamento). Sem worktree.
**Banco:** este ticket não mexe no banco nem aplica nada no desenvolvimento; só a tela e os módulos. Regras de `.claude/regras/banco.md` que valem: a interface só fala com o banco por `src/lib/supabase.ts` e pelo módulo de processos; a recusa do banco chega como `motivo:valor` e vira `TravaDoBanco` com a frase pronta; o `npm test` nunca depende do banco ligado.

## Decisões de execução

1. **Troca de modelo de uma vez.** O pre-commit roda `tsc` e `npm test` na árvore inteira, então a troca dos tipos (`etapasDoProcesso`/`status` por `etapaAtual`/`etiqueta`/`etapasDoVerso`) só fecha verde no fim. Trabalho sem commitar no meio e, no fim, commits por assunto (a árvore é a mesma, o hook passa em cada um).
2. **Tipos novos** (`src/processos/tipos.ts`): `EtiquetaDaEtapa`; `EtapaAtual` = id, código, nome, ordem, posição e total entre as etapas ativas; `ProcessoDaLista` ganha `etiqueta` e `entrouNaEtapaEm` (AAAA-MM-DD, dia de Brasília) e perde `vaiParaPublicacao`; `ProcessoLido` troca `etapasDoProcesso` por `etapasDoVerso` (as ativas, cada uma com suas passagens da mais recente para a mais antiga). `DadosDoCartao` perde o status, a data de início e o caminho. Saem `StatusDaEtapa`, `EtapaDoCaminho`, `EtapaDoProcesso`, `DatasDaEtapa`, `PedacoDoCaminho`.
3. **Módulo de processos:** saem iniciar/concluir/dispensar/realizada/voltar/corrigir datas/responsável da etapa, `naoVaiMaisParaPublicacao` e `registrarPublicacao` (a função do banco foi apagada no ticket 24; volta no ticket 04). Entram `moverProcesso(id, etapaId, chegada?)`, `mudarEtiqueta(id, etiqueta)` e `mudarResponsavel(id, usuarioId | null)`. `arquivar`/`desarquivar` ficam.
4. **Chegada a Concluídos:** a janela é do ticket 04. Aqui, mover para Concluídos sem a data da publicação registrada **não chama o banco**: a tela mostra a frase "A chegada a Concluídos pede a data da publicação ou a explicação de concluir sem publicação; essa janela ainda não está disponível." e o cartão fica onde estava. Com a data registrada, move direto. O módulo já aceita os dados da chegada (o ticket 04 só abre a janela) e a falsa recusa como o banco.
5. **Revisão e aprovação:** `concluirRevisaoInterna` e `concluirAprovacao` saem do `ModuloDeRevisoes` e da tela (o banco já não as tem); os registros voltam no ticket 05 de revisoes-aprovacao. A gaveta da etapa continua listando e editando os registros existentes.
6. **Frase do processo parado** passa a "Este processo está {suspenso | cancelado}; retome-o para mudar a etapa, a etiqueta ou o responsável." (spec). As frases de recusa do catálogo e da chegada ganham as formas novas.
7. **Testes de tela do modelo anterior:** cada arquivo é reescrito para o modelo novo ou apagado quando o comportamento saiu; a lista final está na seção "O que saiu dos testes", no fim.

## Tarefas

### Tarefa 1: tipos e funções puras (testes primeiro)

**Arquivos:** `src/processos/tipos.ts`, `diasNaEtapa.ts`, `selosDoCartao.ts`, `barraDoCartao.ts`, `colunasDoQuadro.ts`, `destinoDoArrastar.ts`, `caminhoDeEtapas.ts` (reduzido às peças de responsável e data), `rotulos.ts` (etiquetas), `publicacao.ts`, e os testes de cada um.

- [ ] Testes novos que falham: limite de 7 dias (7 sem selo, 8 com), sem selo em Não iniciados, Concluídos e suspenso; selos "Sem publicação" e "Relatório pendente" pela posição no catálogo; barra com um pedaço por etapa ativa e o nome "Etapa {n} de {total}: {etapa}"; colunas de Não iniciados a Concluídos com cartões de em andamento, suspenso e concluído não arquivado; por responsável incluindo as fixas; destino do arrastar (qualquer coluna, nada para Consulta/suspenso/arquivado/próprio lugar).
- [ ] Implementar. `npm test -- <arquivos>` verde.

### Tarefa 2: módulo falso de processos

**Arquivos:** `ProcessosFalso.ts`, `arquivamentoFalso.ts`, `situacaoFalso.ts`, `CatalogoFalso.ts`, `reclassificacaoFalso.ts` (ajustes), removidos `andamentoFalso.ts`, `publicacaoFalso.ts`; testes `ProcessosFalso.mover.test.ts` e ajustes.

- [ ] Testes que falham: cadastro em Não iniciados/A fazer/sem responsável; mover (qualquer etapa, etiqueta volta a A fazer, quem move vira responsável, própria etapa não grava, etapa inativa, suspenso/cancelado/arquivado recusados, passagens fechadas e abertas, Concluídos sem a data recusado e com a data aceito, sair de Concluídos limpa a explicação); etiqueta (fixa em Concluídos, congelada no suspenso); responsável (só ativo Administrador/Integrante, congelado); catálogo com as fixas e as recusas novas.
- [ ] Implementar; verde.

### Tarefa 3: módulo real

**Arquivos:** `processoDaLinha.ts`, `listaDeProcessosSupabase.ts`, `lerProcessoSupabase.ts`, `andamentosSupabase.ts` (vira `movimentoSupabase.ts` + `frasesDaRecusa`), `publicacaoSupabase.ts`, `catalogoSupabase.ts`, `gravarProcessoSupabase.ts`, `reclassificacaoSupabase.ts`, `situacaoSupabase.ts`, `anotacoesSupabase.ts`, `revisoesSupabase.ts`, `clienteSemTipos.ts` (apagado quando nenhum módulo o usar), testes do cliente simulado.

- [ ] Testes que falham: `mover_processo` com e sem dados da chegada, etiqueta (update da passagem aberta), responsável (update do processo), linha da view com os campos novos, passagens da leitura, cada recusa nova virando a frase.
- [ ] Implementar; verde.

### Tarefa 4: histórico

**Arquivos:** `src/cadastros/historicoDosCadastros.ts`, `lerProcessoSupabase.ts` (entidade `passagem`), testes.

- [ ] Teste que falha: "Moveu de … para …", "Mudou a etiqueta", "Mudou o responsável"; sem os textos de andamento.
- [ ] Implementar; verde.

### Tarefa 5: verso (Agora, Etapas, janelas)

**Arquivos:** `AgoraDoProcesso.tsx`, `EtapaDoAgora.tsx` (reescrito), `AgoraDoConcluido.tsx`, `EtapasDoProcesso.tsx`, `DetalheDaEtapa.tsx`, `CaminhoDoProcesso.tsx`, `TrocaDoResponsavel.tsx`, `hooks/useAcoesDoProcesso.ts` (no lugar de `useAcoesDaEtapa`), `DiasNaEtapa.tsx`; apagados `JanelaDeAvanco`, `JanelasDaEtapa`, `FormularioDeDatas`, `PerguntaDaPublicacao`, `JanelaDaPublicacao`, `useEscolhaDaPublicacao`, `gravarAcoes.ts` (a parte do avanço).

- [ ] Testes de tela que falham (reescrevem `App.agoraDoVerso`, `App.etapasDoVerso`, `App.assumirEAutor`, `App.versoDoCartao` e afins).
- [ ] Implementar; verde.

### Tarefa 6: Quadro

**Arquivos:** `QuadroDeProcessos.tsx`, `ColunaDoQuadro.tsx`, `CartaoDoProcesso.tsx`, `BarraDeProgresso.tsx`, `SelosDoCartao.tsx`, `useArrastoDoQuadro.ts`, `useMoverPeloQuadro.ts` (no lugar de `useConclusaoPeloQuadro`), `Quadro.css`.

- [ ] Testes que falham (`App.quadro`, `App.cartaoDoQuadro`, `App.arrastarParaMover`, `App.agruparPorResponsavel`, `App.soOsMeus`).
- [ ] Implementar; verde.

### Tarefa 7: Lista e filtro

**Arquivos:** `TabelaDeProcessos.tsx`, `FiltrosDosProcessos.tsx`, `filtrosDosProcessos.ts`, `linhasDaLista.ts`, `ProcessosDoSetor.tsx`.

- [ ] Testes que falham (`App.lista`, `App.filtrosDosProcessos`, `App.processosDoSetor`); implementar; verde.

### Tarefa 8: catálogo na Administração

**Arquivos:** `TabelaDoCatalogo.tsx`, `FormularioDaEtapa.tsx`, `CatalogoEditavel.tsx`, `CamposDaEtapaNova.tsx`, `frasesDoCatalogo.ts`, `testes/catalogoDeTeste.tsx`.

- [ ] Testes que falham (`App.catalogoDeEtapas`, `App.catalogoAcoes`, `App.catalogoNosProcessos`); implementar; verde.

### Tarefa 9: fecho

- [ ] `tsc`, ESLint, `npm test`, `npm run check:circular`, cobertura (≥ 70%).
- [ ] Vitrine local (navegador do app, módulos falsos) para os critérios `[visual]`; anotar o que foi visto e o que foi presumido.
- [ ] `desvios.md`, linha `Concluído em` no ticket, `proximo-passo.md`, `nao-testados`/melhorias, commits por assunto, push da branch (sem `--force`).

## O que saiu dos testes

(preenchido ao fim da Tarefa 10)
