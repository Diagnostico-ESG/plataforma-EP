import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import type { ProcessoLido } from './processos/tipos'
import { montar, processo } from './testes/quadroDeTeste'

// O arquivado na Lista: o selo "Arquivado" e o filtro "Arquivados: Mostrar | Esconder", no endereço (publicacao-e-
// arquivamento, ticket 02, histórias 24, 29 e 41).

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const CONCLUIDO: Partial<ProcessoLido> = { situacao: 'concluido', etiqueta: 'concluido', responsavel: null, publicadoEm: '2026-10-05' }
const PROCESSOS = [
  processo('Em Curso'),
  processo('Guardado', { etapa: 'concluidos', processo: { ...CONCLUIDO, arquivadoEm: '2026-10-12T12:00:00Z' } }),
  processo('Pronto', { etapa: 'concluidos', processo: CONCLUIDO }),
]

async function nomesNaLista(): Promise<string[]> {
  await screen.findAllByRole('cell')
  return within(screen.getByRole('table')).getAllByRole('button').map((botao) => botao.textContent ?? '')
}

const linhaDe = (nome: string) => within(screen.getByRole('button', { name: nome }).closest('tr') as HTMLElement)
const arquivados = () => screen.getByLabelText('Arquivados') as HTMLSelectElement

test('o arquivado aparece na Lista com o selo "Arquivado"; os outros, sem ele', async () => {
  window.location.hash = '#/processos/lista'
  montar(PROCESSOS)
  expect(await nomesNaLista()).toEqual(['Em Curso', 'Guardado', 'Pronto'])
  expect(linhaDe('Guardado').getByText('Arquivado')).toBeTruthy()
  expect(linhaDe('Pronto').queryByText('Arquivado')).toBeNull()
})

test('"Esconder" tira o arquivado e vai para o endereço; [Limpar filtros] volta a "Mostrar"', async () => {
  window.location.hash = '#/processos/lista'
  montar(PROCESSOS)
  await nomesNaLista()
  expect(arquivados().value).toBe('')
  fireEvent.change(arquivados(), { target: { value: 'esconder' } })
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista?arquivados=esconder'))
  expect(await nomesNaLista()).toEqual(['Em Curso', 'Pronto'])
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/lista'))
  expect(arquivados().value).toBe('')
  expect(await nomesNaLista()).toEqual(['Em Curso', 'Guardado', 'Pronto'])
})

test('o endereço com o filtro abre a Lista já filtrada', async () => {
  window.location.hash = '#/processos/lista?arquivados=esconder'
  montar(PROCESSOS)
  expect(await nomesNaLista()).toEqual(['Em Curso', 'Pronto'])
  expect(arquivados().value).toBe('esconder')
})

test('o Quadro não tem o filtro Arquivados', async () => {
  window.location.hash = '#/processos'
  montar(PROCESSOS)
  await screen.findByRole('region', { name: 'Concluídos' })
  expect(screen.queryByLabelText('Arquivados')).toBeNull()
})

test('a Consulta vê o selo e o filtro', async () => {
  window.location.hash = '#/processos/lista'
  montar(PROCESSOS, 'consulta')
  await nomesNaLista()
  expect(linhaDe('Guardado').getByText('Arquivado')).toBeTruthy()
  expect(arquivados()).toBeTruthy()
})

test('o suspenso e o cancelado arquivados mostram a pílula da situação e o selo "Arquivado" juntos, na mesma célula', async () => {
  window.location.hash = '#/processos/lista'
  const arquivadoEm = '2026-10-12T12:00:00Z'
  montar([
    processo('Parado', { processo: { situacao: 'suspenso', arquivadoEm } }),
    processo('Desistido', { processo: { situacao: 'cancelado', arquivadoEm } }),
  ])
  await nomesNaLista()
  for (const [nome, situacao] of [['Parado', 'Suspenso'], ['Desistido', 'Cancelado']]) {
    const celula = linhaDe(nome).getByText('Arquivado').closest('.lista-situacao') as HTMLElement
    expect(within(celula).getByText(situacao)).toBeTruthy()
  }
})
