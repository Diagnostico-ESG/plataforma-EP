import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { cartaoDe, dia, ETAPAS, montar, processo } from './testes/quadroDeTeste'

// Arrastar o cartão para qualquer coluna move o processo (ticket 25 de processos-etapas, Andamento livre).

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
const cartoesDa = (nome: string) => within(coluna(nome)).queryAllByRole('link').map((cartao) => cartao.textContent ?? '')
const idDaEtapa = (codigo: string) => ETAPAS.find((etapa) => etapa.codigo === codigo)?.id as string
const levantar = (cartao: HTMLElement) => fireEvent.dragStart(cartao, { dataTransfer })
const passarPor = (nomeDaColuna: string) => fireEvent.dragOver(coluna(nomeDaColuna), { dataTransfer })

function soltarEm(nomeDaColuna: string) {
  passarPor(nomeDaColuna)
  fireEvent.drop(coluna(nomeDaColuna), { dataTransfer })
}

// ---- Quem arrasta

test('o cartão em andamento arrasta em qualquer etapa, inclusive Não iniciados; o concluído também', async () => {
  montar([
    processo('Em Curso'), processo('Não Iniciado', { etapa: 'nao_iniciados' }),
    processo('Pronto', { etapa: 'concluidos', processo: { situacao: 'concluido', etiqueta: 'concluido' } }),
  ])
  for (const nome of ['Em Curso', 'Não Iniciado', 'Pronto']) expect((await cartaoDe(nome)).getAttribute('draggable')).toBe('true')
})

test('o suspenso não se arrasta, e o concluído fora do Quadro nem aparece nele', async () => {
  montar([
    processo('Suspenso', { processo: { situacao: 'suspenso' } }),
    processo('Fora do Quadro', {
      etapa: 'concluidos', processo: { situacao: 'concluido', noQuadro: false, etiqueta: 'concluido' },
    }),
  ])
  expect((await cartaoDe('Suspenso')).getAttribute('draggable')).toBe('false')
  expect(screen.queryByRole('link', { name: /Fora do Quadro/ })).toBeNull()
})

test('a Consulta não arrasta nenhum cartão', async () => {
  montar([processo('Para a Consulta')], 'consulta')
  expect((await cartaoDe('Para a Consulta')).getAttribute('draggable')).toBe('false')
})

test('agrupado por responsável nada se arrasta', async () => {
  window.location.hash = '#/processos?agrupar=responsavel'
  montar([processo('Emitir Ofício')])
  expect((await cartaoDe('Emitir Ofício')).getAttribute('draggable')).toBe('false')
})

// ---- O realce da coluna sob o cartão

test('enquanto arrasta, a coluna sob o cartão ganha o realce, e some ao soltar ou ao baixar o cartão', async () => {
  montar([processo('Emitir Ofício')])
  const cartao = await cartaoDe('Emitir Ofício')
  expect(colunasAcesas()).toEqual([])
  levantar(cartao)
  passarPor('Publicação')
  expect(colunasAcesas()).toEqual(['Publicação'])
  passarPor('Modelagem piloto')
  expect(colunasAcesas()).toEqual(['Modelagem piloto'])
  fireEvent.dragEnd(cartao)
  expect(colunasAcesas()).toEqual([])
})

// ---- Soltar

test('soltar em outra coluna move o processo na hora, sem janela: ele vai para a coluna nova com A fazer e quem moveu como responsável', async () => {
  const falso = montar([processo('Emitir Ofício', { processo: { etiqueta: 'concluido' } })])
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Publicação')
  await waitFor(() => expect(cartoesDa('Publicação')).toHaveLength(1))
  expect(cartoesDa('Revisão interna')).toEqual([])
  expect(falso.chamadas).toEqual([{ acao: 'mover', id: falso.processos[0].id, etapaId: idDaEtapa('publicacao') }])
  expect(screen.queryByRole('dialog')).toBeNull()
  const cartao = await cartaoDe('Emitir Ofício')
  expect(cartao.textContent).toContain('A fazer')
  expect(within(cartao).getByRole('img', { name: USUARIO_DE_TESTE.nome })).toBeTruthy()
})

test('para trás também vale, inclusive para Não iniciados', async () => {
  montar([processo('Emitir Ofício')])
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Não iniciados')
  await waitFor(() => expect(cartoesDa('Não iniciados')).toHaveLength(1))
})

test('soltar na própria coluna não grava nada', async () => {
  const falso = montar([processo('Emitir Ofício')])
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Revisão interna')
  await Promise.resolve()
  expect(falso.chamadas).toEqual([])
  expect(colunasAcesas()).toEqual([])
  expect(cartoesDa('Revisão interna')).toHaveLength(1)
})

test('soltar fora de qualquer coluna não grava nada', async () => {
  const falso = montar([processo('Emitir Ofício')])
  const cartao = await cartaoDe('Emitir Ofício')
  levantar(cartao)
  fireEvent.dragEnd(cartao)
  expect(falso.chamadas).toEqual([])
})

test('a falha ao mover mostra a mensagem de erro de gravação e o cartão fica na coluna de origem', async () => {
  const falso = montar([processo('Emitir Ofício')])
  falso.falhaDeGravacao = 'falha de conexão simulada'
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Publicação')
  expect((await screen.findByRole('alert')).textContent).toBe('A alteração não foi salva: falha de conexão simulada.')
  expect(cartoesDa('Revisão interna')).toHaveLength(1)
  expect(cartoesDa('Publicação')).toEqual([])
})

test('a recusa do banco aparece com a frase pronta e o cartão não sai do lugar', async () => {
  const falso = montar([processo('Emitir Ofício')])
  falso.falhaDeGravacao = new TravaDoBanco('A etapa Publicação está inativa.')
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Publicação')
  expect((await screen.findByRole('alert')).textContent).toBe('A etapa Publicação está inativa.')
  expect(cartoesDa('Revisão interna')).toHaveLength(1)
})

// ---- Chegada a Concluídos (a janela está em App.chegadaAConcluidos.test.tsx)

test('soltar em Concluídos com a data da publicação já registrada vai direto', async () => {
  const falso = montar([processo('Emitir Ofício', { etapa: 'publicacao', processo: { publicadoEm: dia(-2) } })])
  levantar(await cartaoDe('Emitir Ofício'))
  soltarEm('Concluídos')
  await waitFor(() => expect(cartoesDa('Concluídos')).toHaveLength(1))
  expect(falso.chamadas).toEqual([{ acao: 'mover', id: falso.processos[0].id, etapaId: idDaEtapa('concluidos') }])
})

test('o cartão concluído se arrasta para fora de Concluídos e volta a em andamento', async () => {
  montar([processo('Pronto', { etapa: 'concluidos', processo: { situacao: 'concluido', etiqueta: 'concluido', publicadoEm: dia(-2) } })])
  levantar(await cartaoDe('Pronto'))
  soltarEm('Publicação')
  await waitFor(() => expect(cartoesDa('Publicação')).toHaveLength(1))
  expect(cartoesDa('Concluídos')).toEqual([])
})
