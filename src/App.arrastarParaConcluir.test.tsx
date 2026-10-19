import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import type { StatusDaEtapa } from './processos/tipos'
import { cartaoDe, ETAPAS, montar, processo } from './testes/quadroDeTeste'

beforeEach(() => {
  window.location.hash = '#/processos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

/** O que o navegador entrega nos eventos de arrastar; o jsdom não faz o gesto, mas aceita o objeto. */
const dataTransfer = { setData: () => undefined, effectAllowed: 'move', dropEffect: 'move' }

const coluna = (nome: string) => screen.getByRole('region', { name: nome })
const colunasAcesas = () => ETAPAS.filter((etapa) => coluna(etapa.nome).classList.contains('coluna-destino')).map((etapa) => etapa.nome)

function levantar(cartao: HTMLElement) {
  fireEvent.dragStart(cartao, { dataTransfer })
}

function soltarEm(nomeDaColuna: string) {
  fireEvent.dragOver(coluna(nomeDaColuna), { dataTransfer })
  fireEvent.drop(coluna(nomeDaColuna), { dataTransfer })
}

test('o cartão só se arrasta com a etapa em andamento, o processo em andamento e etapa pendente depois', async () => {
  montar([
    processo('Pode Arrastar'),
    processo('Suspenso', { processo: { situacao: 'suspenso' } }),
    processo('Etapa Pendente', { cartao: { etapaAtualStatus: 'pendente' } }),
    processo('Na Última', { posicao: 6 }),
  ])
  expect((await cartaoDe('Pode Arrastar')).getAttribute('draggable')).toBe('true')
  expect((await cartaoDe('Suspenso')).getAttribute('draggable')).toBe('false')
  expect((await cartaoDe('Etapa Pendente')).getAttribute('draggable')).toBe('false')
  expect((await cartaoDe('Na Última')).getAttribute('draggable')).toBe('false')
})

test('a Consulta não arrasta nenhum cartão', async () => {
  montar([processo('Para a Consulta')], 'consulta')
  expect((await cartaoDe('Para a Consulta')).getAttribute('draggable')).toBe('false')
})

test('durante o arrastar só a coluna de destino acende, e some ao baixar o cartão', async () => {
  montar([processo('Emitir Ofício')])
  const cartao = await cartaoDe('Emitir Ofício')
  expect(colunasAcesas()).toEqual([])
  levantar(cartao)
  expect(colunasAcesas()).toEqual(['Revisão do setor'])
  fireEvent.dragEnd(cartao)
  expect(colunasAcesas()).toEqual([])
})

test('com a etapa vizinha já resolvida, a coluna que acende é a da primeira pendente depois dela', async () => {
  const caminho = ETAPAS.map((etapa, indice) => ({
    codigo: etapa.codigo, status: (['concluida', 'concluida', 'em_andamento', 'dispensada'][indice] ?? 'pendente') as StatusDaEtapa,
  }))
  montar([processo('Vizinha Resolvida', { cartao: { caminho } })])
  levantar(await cartaoDe('Vizinha Resolvida'))
  expect(colunasAcesas()).toEqual(['Aprovação'])
})

test('soltar em outra coluna avisa onde soltar, não grava e não abre janela', async () => {
  const falso = montar([processo('Emitir Ofício')])
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Aprovação')
  expect(screen.getByRole('status').textContent).toBe('Solte o cartão na coluna Revisão do setor.')
  expect(falso.chamadas).toEqual([])
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(colunasAcesas()).toEqual([])
})
