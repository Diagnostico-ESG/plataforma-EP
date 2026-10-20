import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import type { Setor } from './cadastros/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'
import { RevisoesFalso } from './revisoes/RevisoesFalso'
import { PlanilhasFalso } from './planilhas/PlanilhasFalso'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const SETORES: Setor[] = [
  { id: 's1', sigla: 'AFT', nome: 'Assessoria Fictícia de Teste', observacoes: null, ativo: true },
  { id: 's2', sigla: 'CIT', nome: 'Coordenação Inventada de Teste', observacoes: 'Nota inventada', ativo: true },
  { id: 's3', sigla: 'EXT', nome: 'Setor Extinto de Teste', observacoes: null, ativo: false },
]

function montar(setores = SETORES) {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [...setores]
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} processos={new ProcessosFalso()} versoes={new VersoesFalso()} revisoes={new RevisoesFalso()} planilhas={new PlanilhasFalso()} />)
  return cadastros
}

test('ao abrir, os inativos ficam escondidos e a caixa "Mostrar inativos" vem desmarcada', async () => {
  montar()
  expect(await screen.findByRole('cell', { name: 'AFT' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'EXT' })).toBeNull()
  expect((screen.getByRole('checkbox', { name: 'Mostrar inativos' }) as HTMLInputElement).checked).toBe(false)
})

test('marcar a caixa mostra o inativo com a pílula "Inativo", e os ativos ficam sem pílula', async () => {
  montar()
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Mostrar inativos' }))
  const linha = (await screen.findByRole('cell', { name: 'EXT' })).closest('tr') as HTMLElement
  expect(within(linha).getByText('Inativo').className).toContain('pilula')
  const ativa = screen.getByRole('cell', { name: 'AFT' }).closest('tr') as HTMLElement
  expect(within(ativa).queryByText('Inativo')).toBeNull()
})

test('desmarcar a caixa esconde os inativos de novo', async () => {
  montar()
  const caixa = await screen.findByRole('checkbox', { name: 'Mostrar inativos' })
  fireEvent.click(caixa)
  await screen.findByRole('cell', { name: 'EXT' })
  fireEvent.click(caixa)
  expect(screen.queryByRole('cell', { name: 'EXT' })).toBeNull()
})

test('só inativos e caixa desmarcada: "Nenhum setor ativo para mostrar."', async () => {
  montar([SETORES[2]])
  expect(await screen.findByText('Nenhum setor ativo para mostrar.')).toBeTruthy()
  expect(screen.queryByText('Nenhum setor cadastrado ainda.')).toBeNull()
})
