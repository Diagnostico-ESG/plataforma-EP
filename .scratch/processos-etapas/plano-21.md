# Plano do ticket 21: Arrastar o cartão para concluir a etapa

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas (`- [x]`). Branch comum `processos-etapas-21`, sem worktree (o isolamento já está feito).

**Objetivo:** quem é Administrador ou Integrante arrasta o cartão (etapa atual em andamento, processo em andamento, com etapa pendente depois) até a coluna da próxima etapa e solta; abre a janela "Quem fica com a próxima etapa?" do verso, e confirmar conclui e avança pela função que já existe.

**Arquitetura:** só interface, sem banco, sem migração, sem dependência (arrastar nativo do navegador). Uma função pura decide a coluna de destino a partir do `cartao.caminho` (ticket 20). Como o cartão não traz os ids dos andamentos, ao soltar a tela lê o processo (`lerProcesso`) e entrega etapa e próxima ao `useAcoesDaEtapa` e à `JanelasDaEtapa`, as mesmas peças do [Concluir] do verso. Um hook guarda o estado do arrastar (cartão levantado, aviso); `QuadroDeProcessos` liga tudo.

**Requisitos:** `.scratch/processos-etapas/issues/21-arrastar-para-concluir.md` (critérios citados como "critério N do ticket 21", de cima para baixo, 1 a 10) e a spec (histórias 155 a 163; "Interface", Quadro, item Arrastar para concluir; "Decisões de teste", arrastar e "Arrastar nos testes"; "Observações", parte 4).

## Restrições gerais

- Sem dependência nova, sem migração, sem mexer no banco (por isso não vale a leitura do `banco.md`). Limites do ESLint: função até 20 linhas (hook até 40), arquivo até 300, complexidade até 10.
- Toda tarefa de código termina com `npm test`, `npm run lint` e `npm run typecheck` verdes. Testes de tela instáveis sob carga (backlog): repita o arquivo isolado antes de concluir que falhou de verdade.
- Textos da tela exatamente como na spec, com acentos. Dados de teste inventados.
- Arquivos com CRLF: trocas pela ferramenta de edição. Arquivos novos pela ferramenta de arquivo, nunca por heredoc.
- Cada commit leva cerca de 1 minuto (o pré-commit roda a bateria inteira). Comece cada chamada do Bash com `cd` para a raiz do projeto.

## Decisões deste plano (vão para o `desvios.md` na Tarefa 4)

1. **A janela abre depois de ler o processo** (`lerProcesso`), porque o cartão não traz o id do andamento que a função de avanço recebe. Se a leitura mostrar que a etapa atual já não está em andamento ou que já não há pendente depois (Quadro desatualizado), nada abre: o Quadro só recarrega.
2. **Toda coluna aceita o soltar** (`preventDefault` no `dragover`), para o aviso "Solte o cartão na coluna {etapa}." aparecer ao soltar fora do destino; o realce continua só no destino. O cursor, por isso, não mostra "proibido" nas outras colunas.
3. **O cartão não arrastável leva `draggable="false"`**: o `<a>` é arrastável por padrão (arrasta o endereço), e a spec diz que o cartão "não é arrastável" nesses casos.
4. **Falha ao ler o processo ao soltar** mostra "Não foi possível abrir a conclusão: {motivo}." (a frase de gravação diria "não foi salva", o que seria falso numa leitura). Falha ao gravar usa a frase de sempre (`textoDaFalha`, pelo `useAcoesDaEtapa`).
5. **Ajuda de teste compartilhada:** o `App.cartaoDoQuadro.test.tsx` já monta um Quadro com `ETAPAS`, `processo()` e `montar()`; o teste novo seria a segunda repetição, então as peças sobem para `src/testes/quadroDeTeste.ts` e os dois arquivos as usam. O `processo()` passa a preencher `etapasDoProcesso` coerente com o caminho (antes `[]`).

## Mapa de arquivos

| Arquivo | O que faz |
|-|-|
| `src/processos/destinoDoArrastar.ts` + `.test.ts` (criar) | `colunaDeDestino(processo)` e `avancoDoCartao(etapas)` |
| `src/hooks/useConclusaoPeloQuadro.ts` (criar) | lê o processo ao soltar e abre a janela de avanço; guarda usuários, última versão e falha de leitura |
| `src/hooks/useArrastoDoQuadro.ts` (criar) | estado do arrastar (cartão levantado, aviso) e o que fazer ao soltar |
| `src/components/processos/CartaoDoProcesso.tsx`, `ColunaDoQuadro.tsx`, `QuadroDeProcessos.tsx` | eventos de arrastar, realce, aviso, janelas |
| `src/components/processos/VisaoDosProcessos.tsx`, `AreaDeProcessos.tsx` | passam `processos`, `usuarioId` e `aoMudar` ao Quadro |
| `src/components/processos/Quadro.css` | realce tracejado azul, cartão apagado, aviso |
| `src/testes/quadroDeTeste.ts` (criar) | `ETAPAS`, `processo()`, `montar()`, `cartaoDe()` compartilhados |
| `src/App.cartaoDoQuadro.test.tsx` | passa a usar a ajuda compartilhada |
| `src/App.arrastarParaConcluir.test.tsx` (criar) | critérios 2 a 9 pelo aplicativo inteiro, com os eventos nativos |

---

### Tarefa 1: A função pura da coluna de destino (critério 1)

**Arquivos:** `src/processos/destinoDoArrastar.ts`, `src/processos/destinoDoArrastar.test.ts`.

**Produz:** `colunaDeDestino(processo: ProcessoDaLista): string | null` (o código da coluna de destino, ou `null` quando o cartão não é arrastável por conta do processo) e `avancoDoCartao(etapas: EtapaDoCaminho[]): { etapa: EtapaDoCaminho; proxima: EtapaDoCaminho } | null` (a etapa atual em andamento e a próxima pendente, de um processo lido).

- [x] **Passo 1: o teste que falha.** `destinoDoArrastar.test.ts`, com processos montados à mão (uma função `com(posicao, mudancas)` local, caminho de 6 etapas `modelagem`, `relatorio`, `revisao_interna`, `revisao_do_setor`, `aprovacao`, `eprotocolo`). Casos de `colunaDeDestino`:
  - etapa atual em andamento com a vizinha pendente → código da vizinha;
  - vizinha já resolvida (`dispensada` ou `realizada_anteriormente`) → o código da primeira `pendente` depois dela;
  - etapa atual pendente (`etapaAtualStatus: 'pendente'`) → `null`;
  - última etapa → `null`;
  - processo suspenso → `null`;
  - sem `cartao` → `null`;
  - `etapaAtual` fora do caminho → `null`.
  Casos de `avancoDoCartao` (etapas montadas como `EtapaDoCaminho` com `id`): atual `em_andamento` e próxima `pendente` → o par certo; atual `pendente` → `null`; sem pendente depois → `null`; todas resolvidas → `null`.
- [x] **Passo 2:** `npx vitest run src/processos/destinoDoArrastar.test.ts` — esperado: falha (módulo inexistente).
- [x] **Passo 3: implementar.**

```ts
import { indiceDaEtapaAtual, proximaPendente } from './caminhoDeEtapas'
import type { EtapaDoCaminho, ProcessoDaLista } from './tipos'

/**
 * O código da coluna onde soltar o cartão para concluir a etapa atual: a da primeira etapa pendente depois dela
 * (a vizinha pode já estar resolvida). null quando o cartão não se arrasta: processo parado, etapa atual ainda
 * pendente (ela se inicia pelo verso, para não perder a data de início) ou sem pendente depois.
 */
export function colunaDeDestino(processo: ProcessoDaLista): string | null {
  const { cartao, etapaAtual, situacao } = processo
  if (!cartao || !etapaAtual || situacao !== 'em_andamento' || cartao.etapaAtualStatus !== 'em_andamento') return null
  const posicao = cartao.caminho.findIndex((pedaco) => pedaco.codigo === etapaAtual.codigo)
  if (posicao < 0) return null
  return cartao.caminho.slice(posicao + 1).find((pedaco) => pedaco.status === 'pendente')?.codigo ?? null
}

/** A etapa a concluir e a que o avanço inicia, num processo lido; null se o Quadro estava desatualizado. */
export function avancoDoCartao(etapas: EtapaDoCaminho[]): { etapa: EtapaDoCaminho; proxima: EtapaDoCaminho } | null {
  const indice = indiceDaEtapaAtual(etapas)
  if (indice < 0 || etapas[indice].status !== 'em_andamento') return null
  const proxima = proximaPendente(etapas, indice)
  return proxima ? { etapa: etapas[indice], proxima } : null
}
```

- [x] **Passo 4:** o teste do passo 1 passa; `npm run lint` e `npm run typecheck` verdes.
- [x] **Passo 5: commit** `Ticket 21 de processos-etapas: funções da coluna de destino do arrastar`.

### Tarefa 2: Arrastar, realce e aviso no Quadro (critérios 2, 3 e 6)

**Arquivos:** `src/testes/quadroDeTeste.ts` (criar), `src/App.cartaoDoQuadro.test.tsx` (usar a ajuda), `src/App.arrastarParaConcluir.test.tsx` (criar), `src/hooks/useArrastoDoQuadro.ts` (criar), `CartaoDoProcesso.tsx`, `ColunaDoQuadro.tsx`, `QuadroDeProcessos.tsx`, `VisaoDosProcessos.tsx`, `AreaDeProcessos.tsx`, `Quadro.css`.

**Interfaces:**
- `ArrastoDoQuadro = { levantado: ProcessoDaLista | null; aviso: string | null; levantar(processo: ProcessoDaLista): void; baixar(): void; soltarEm(codigoDaColuna: string): void }`
- `useArrastoDoQuadro(colunas: ColunaDoQuadro[], aoSoltarNoDestino: (id: string) => void): ArrastoDoQuadro`
- `QuadroDeProcessos` ganha as props `processos: ModuloDeProcessos`, `podeAlterar: boolean`, `usuarioId: string`, `aoMudar: () => void`; `VisaoDosProcessos` as repassa (`processos`, `usuarioId`, `aoMudar`; `podeAlterar` ele já tem).

- [x] **Passo 1: subir a ajuda de teste.** Mover de `App.cartaoDoQuadro.test.tsx` para `src/testes/quadroDeTeste.ts` (exportando) `ETAPAS`, `dia`, `processo()`, `montar()` e `cartaoDe()`. O `processo()` passa a preencher `etapasDoProcesso` com uma `EtapaDoProcesso` por etapa do catálogo (`id: 'a<ordem>'`, `status` igual ao do `caminho`, `iniciadaEm` só na atual, `responsavelId` e `responsavelNome` da etapa atual iguais aos do `responsavel` do processo, `obrigatoria: true`). `montar()` ganha o segundo argumento `{ perfil, usuarios }` (`falso.usuariosPossiveis = usuarios`) e devolve o `ProcessosFalso`. Ajustar o `App.cartaoDoQuadro.test.tsx` para importar; `npx vitest run src/App.cartaoDoQuadro.test.tsx` continua verde.
- [x] **Passo 2: os testes que falham.** `App.arrastarParaConcluir.test.tsx`, com um `dataTransfer` falso (`{ setData() {}, effectAllowed: 'move', dropEffect: 'move' }`) passado em cada `fireEvent.dragStart/dragOver/drop`, e a coluna por `screen.getByRole('region', { name })`. Testes (Integrante, salvo onde dito):
  1. **Arrastável só nos casos permitidos** (critério 2): cartão em andamento com pendente depois tem `draggable="true"`; o suspenso, o da etapa atual pendente, o da última etapa e (como `consulta`) qualquer cartão têm `draggable="false"`.
  2. **Só a coluna de destino acende** (critério 3): `dragStart` no cartão da Revisão interna → só a coluna "Revisão do setor" ganha a classe `coluna-destino` (e a das outras, não); com a vizinha dispensada, a que acende é a da pendente depois dela; `dragEnd` apaga o realce.
  3. **Soltar em outra coluna** (critério 6): `dragStart`, `drop` na coluna "Aprovação" → aparece `Solte o cartão na coluna Revisão do setor.` (`role="status"`), nada foi gravado (`falso.chamadas` vazio) e nenhuma janela abre.
- [x] **Passo 3:** `npx vitest run src/App.arrastarParaConcluir.test.tsx` — esperado: falha (cartão sem `draggable`, sem realce, sem aviso).
- [x] **Passo 4: o hook do estado do arrastar.**

```ts
import { useState } from 'react'
import { colunaDeDestino } from '../processos/destinoDoArrastar'
import type { ColunaDoQuadro } from '../processos/colunasDoQuadro'
import type { ProcessoDaLista } from '../processos/tipos'

export type ArrastoDoQuadro = {
  /** O cartão que está sendo arrastado; null fora do arrastar. */
  levantado: ProcessoDaLista | null
  aviso: string | null
  levantar: (processo: ProcessoDaLista) => void
  baixar: () => void
  soltarEm: (codigoDaColuna: string) => void
}

/** O estado do arrastar para concluir: quem foi levantado, o aviso de soltura errada e o que fazer ao soltar. */
export function useArrastoDoQuadro(colunas: ColunaDoQuadro[], aoSoltarNoDestino: (id: string) => void): ArrastoDoQuadro {
  const [levantado, setLevantado] = useState<ProcessoDaLista | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  function soltarEm(codigoDaColuna: string) {
    const destino = levantado ? colunaDeDestino(levantado) : null
    const sobrando = levantado
    setLevantado(null)
    if (!sobrando || destino === null) return
    if (codigoDaColuna === destino) return aoSoltarNoDestino(sobrando.id)
    const titulo = colunas.find((coluna) => coluna.chave === destino)?.titulo ?? ''
    setAviso(`Solte o cartão na coluna ${titulo}.`)
  }

  return {
    levantado, aviso, soltarEm,
    levantar: (processo) => { setAviso(null); setLevantado(processo) },
    baixar: () => setLevantado(null),
  }
}
```

- [x] **Passo 5: os componentes.**
  - `CartaoDoProcesso` ganha `arrastavel: boolean`, `apagado: boolean`, `aoLevantar: () => void`, `aoBaixar: () => void`; o `<a>` recebe `draggable={arrastavel}`, `onDragStart` (`evento.dataTransfer.setData('text/plain', id)`, `evento.dataTransfer.effectAllowed = 'move'`, depois `aoLevantar()`), `onDragEnd={aoBaixar}` e a classe `cartao-apagado` quando `apagado`. Sem `arrastavel`, os eventos não fazem nada.
  - `ColunaDoQuadro` ganha `arrasto: ArrastoDoQuadro` e `podeAlterar: boolean`; a `<section>` leva a classe `coluna-destino` quando `arrasto.levantado` existe e `colunaDeDestino(arrasto.levantado) === coluna.chave`; `onDragOver` chama `preventDefault()` só com cartão levantado; `onDrop` chama `preventDefault()` e `arrasto.soltarEm(coluna.chave)`. Cada cartão: `arrastavel={podeAlterar && colunaDeDestino(processo) !== null}`, `apagado={arrasto.levantado?.id === processo.id}`, `aoLevantar={() => arrasto.levantar(processo)}`, `aoBaixar={arrasto.baixar}`.
  - `QuadroDeProcessos`: monta `const colunas = colunasDoQuadro(lista)`, `const arrasto = useArrastoDoQuadro(colunas, concluirDoCartao)`; neste passo `concluirDoCartao` é `() => {}` (a Tarefa 3 o liga); mostra `{arrasto.aviso && <p className="quadro-aviso" role="status">{arrasto.aviso}</p>}` antes das colunas.
  - `VisaoDosProcessos` e `AreaDeProcessos` passam `processos`, `usuarioId={usuario.id}` e `aoMudar={recarregar}` até o Quadro.
  - `Quadro.css`: `.coluna-destino { outline: 2px dashed var(--azul); outline-offset: -2px; border-radius: var(--raio-2); }` (use o token de raio que o arquivo já usa na `.coluna`), `.cartao-apagado { opacity: 0.5; }`, `.quadro-aviso` com a cor e o espaçamento dos avisos vizinhos (copie de `.quadro-carregando`).
- [x] **Passo 6:** `npx vitest run src/App.arrastarParaConcluir.test.tsx src/App.cartaoDoQuadro.test.tsx src/App.quadro.test.tsx` verdes; depois `npm test`, `npm run lint`, `npm run typecheck`.
- [x] **Passo 7: commit** `Ticket 21 de processos-etapas: arrastar, realce e aviso no Quadro`.

### Tarefa 3: Soltar no destino abre a janela e conclui (critérios 4, 5, 7, 8 e 9)

**Arquivos:** `src/hooks/useConclusaoPeloQuadro.ts` (criar), `QuadroDeProcessos.tsx`, `src/App.arrastarParaConcluir.test.tsx`.

**Interfaces:**
- Consome: `avancoDoCartao` (Tarefa 1), `useAcoesDaEtapa(processos, aoMudar, aoSumir)` e `JanelasDaEtapa` (já existem), `listarResponsaveisPossiveis` e `lerProcesso`.
- Produz: `useConclusaoPeloQuadro(processos, podeAlterar, aoMudar) → { acoes: AcoesDaEtapaEmUso; usuarios: UsuarioResponsavel[]; ultimaVersao: UltimaVersao | null; falhaDaLeitura: string | null; concluirDoCartao: (id: string) => Promise<void> }`.

- [x] **Passo 1: os testes que falham** (no mesmo arquivo de teste; o `montar()` leva `usuarios: [EU, BIA]`):
  1. **Soltar no destino abre a janela** (critério 4): `dragStart`, `dragOver`, `drop` na coluna "Revisão do setor" → `dialog` com o título `Concluir Revisão interna e iniciar Revisão do setor`, a pergunta "Quem fica com a próxima etapa?" e quem está na tela marcado; confirmar chama `concluirEtapa` com o id do andamento (`falso.chamadas`: `{ acao: 'concluir', id: 'a3', usuarioId }`) e o cartão passa para a coluna "Revisão do setor" (o `ProcessosFalso` recalcula `etapaAtual`).
  2. **Esc e [Cancelar]** (critério 5): abrir a janela, `Esc` (evento `cancel`/`close` do `dialog`, como no `App.avancoDaEtapa.test.tsx`) e depois [Cancelar] → `falso.chamadas` vazio e o cartão na coluna de origem.
  3. **Falha de gravação** (critério 7): `falso.falhaDeGravacao = 'sem conexão'` → ao confirmar, aparece o `role="alert"` com `A alteração não foi salva: sem conexão.` e o cartão continua na coluna de origem.
  4. **Clique e Enter** (critério 8): clicar no cartão (ou `userEvent.keyboard('{Enter}')` com o foco nele) abre o verso (`dialog` `Processo ...`), como antes; um `dragEnd` sem soltar não abre nada.
  5. **Trava do autor** (critério 4, "a mesma trava"): processo cuja `ultimaVersao.autorId` é o usuário da tela e cuja próxima etapa é a Revisão interna → a janela não oferece esse usuário (reaproveita `usuariosParaAEtapa`; um expect basta).
  6. **Quadro desatualizado:** o `lerProcesso` devolve a etapa atual já concluída (ajustar `falso.processos` entre o `listar` e o soltar) → nenhuma janela abre e o Quadro recarrega.
- [x] **Passo 2:** `npx vitest run src/App.arrastarParaConcluir.test.tsx` — esperado: os seis falham (a janela não abre).
- [x] **Passo 3: o hook.**

```ts
import { useCallback, useState } from 'react'
import { useAcoesDaEtapa } from './useAcoesDaEtapa'
import { useCarregamento } from './useCarregamento'
import { avancoDoCartao } from '../processos/destinoDoArrastar'
import type { ModuloDeProcessos, UltimaVersao } from '../processos/tipos'

/**
 * Soltar o cartão no destino faz o mesmo que [Concluir] no verso: lê o processo (o cartão não traz o id do andamento),
 * acha a etapa atual e a próxima e abre a janela de avanço. Quadro desatualizado (a etapa já não está em andamento ou
 * não há pendente depois): nada abre, o Quadro só recarrega.
 */
export function useConclusaoPeloQuadro(processos: ModuloDeProcessos, podeAlterar: boolean, aoMudar: () => void) {
  const ler = useCallback(
    () => (podeAlterar ? processos.listarResponsaveisPossiveis() : Promise.resolve([])), [processos, podeAlterar])
  const { estado } = useCarregamento(ler)
  const acoes = useAcoesDaEtapa(processos, aoMudar, aoMudar)
  const [ultimaVersao, setUltimaVersao] = useState<UltimaVersao | null>(null)
  const [falhaDaLeitura, setFalhaDaLeitura] = useState<string | null>(null)

  async function concluirDoCartao(id: string) {
    setFalhaDaLeitura(null)
    try {
      const lido = await processos.lerProcesso(id)
      const avanco = lido ? avancoDoCartao(lido.etapasDoProcesso) : null
      if (!lido || !avanco) return aoMudar()
      setUltimaVersao(lido.ultimaVersao)
      acoes.agir('concluir', avanco.etapa, avanco.proxima)
    } catch (erro) {
      setFalhaDaLeitura(`Não foi possível abrir a conclusão: ${erro instanceof Error ? erro.message : String(erro)}.`)
    }
  }

  return { acoes, usuarios: estado.tipo === 'pronto' ? estado.valor : [], ultimaVersao, falhaDaLeitura, concluirDoCartao }
}
```

- [x] **Passo 4: ligar no Quadro.** `QuadroDeProcessos` chama `useConclusaoPeloQuadro(processos, podeAlterar, aoMudar)`, passa `concluirDoCartao` ao `useArrastoDoQuadro`, e renderiza, depois das colunas, `{(falhaDaLeitura ?? acoes.falha) && <p className="cadastros-falha" role="alert">...</p>}` e `<JanelasDaEtapa acoes={acoes} usuarios={usuarios} usuarioId={usuarioId} ultimaVersao={ultimaVersao} />`. Se o arquivo passar de 20 linhas na função, extrair um componente `JanelasDoQuadro` no mesmo arquivo.
- [x] **Passo 5:** os testes da Tarefa 3 e os da Tarefa 2 passam; `npm test`, `npm run lint`, `npm run typecheck` verdes (repita o arquivo isolado se um teste de tela instável falhar sob carga).
- [x] **Passo 6: commit** `Ticket 21 de processos-etapas: soltar no destino abre a janela de avanço e conclui`.

### Tarefa 4: Fechamento

**Arquivos:** `.scratch/processos-etapas/desvios.md`, `.scratch/processos-etapas/spec.md` (só se algo divergir), `.scratch/backlog.md`, `.scratch/melhorias-protocolo.md`, `.scratch/custos.md` (o `/cost` é do usuário).

- [x] **Passo 1: revisão da branch** contra a spec e os critérios (ordem: critérios 1 a 10 do ticket, histórias 155 a 163): conferir que cada critério tem teste; o critério 10 `[visual]` fica **presumido** (a tela não foi conferida; o usuário confere o realce e o cartão apagado na vitrine ou no app).
- [x] **Passo 2:** `desvios.md` com as cinco decisões do plano (entrada nova, datada, ao fim) e, se a revisão achar divergência da spec, o achado (sem corrigir a spec).
- [x] **Passo 3:** `npm test`, `npm run lint`, `npm run typecheck`, cobertura conferida no `/ship` (não aqui). Commit `Ticket 21 de processos-etapas: desvios`.
- [ ] **Passo 4:** (fora do plano de código, na branch principal, depois do merge, como manda o `/executar-complexo`) linha `Concluído em` no ticket 21, marca das melhorias do protocolo (`nao-testados.md`) e commit.
