import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// TSA participa de dois macroprocessos, TSB de um, TSC de nenhum e TSX (inativo) de um; M1 tem três setores, M2 um, M3 nenhum.
function cadastrosComVinculos() {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true },
    { id: 's2', sigla: 'TSB', nome: 'Setor Teste B', observacoes: null, ativo: true },
    { id: 's3', sigla: 'TSC', nome: 'Setor Teste C', observacoes: null, ativo: true },
    { id: 's4', sigla: 'TSX', nome: 'Setor Teste Extinto', observacoes: null, ativo: false },
  ]
  cadastros.macroprocessos = [
    { id: 'm1', codigo: 'MT01', nome: 'Macro Teste Um', descricao: null, categoria: null, ativo: true },
    { id: 'm2', codigo: 'MT02', nome: 'Macro Teste Dois', descricao: null, categoria: null, ativo: true },
    { id: 'm3', codigo: 'MT03', nome: 'Macro Teste Três', descricao: null, categoria: null, ativo: true },
  ]
  cadastros.vinculos = [
    { macroprocessoId: 'm1', setorId: 's1', observacao: null },
    { macroprocessoId: 'm1', setorId: 's2', observacao: null },
    { macroprocessoId: 'm1', setorId: 's4', observacao: null },
    { macroprocessoId: 'm2', setorId: 's1', observacao: null },
  ]
  return cadastros
}

function montar(perfil: Perfil = 'integrante_ep') {
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastrosComVinculos()} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} />)
}

function contagemDaLinha(nome: string): string {
  const linha = screen.getByRole('cell', { name: nome }).closest('tr') as HTMLElement
  return within(linha).getAllByRole('cell')[2].textContent ?? ''
}

function contagemDoMacroprocesso(nome: string): string {
  const linha = screen.getByRole('button', { name: nome }).closest('tr') as HTMLElement
  return within(linha).getAllByRole('cell')[3].textContent ?? ''
}

test('a lista de setores mostra em quantos macroprocessos cada setor participa, inclusive nenhum', async () => {
  montar()
  await screen.findByRole('button', { name: 'TSA' })
  expect(screen.getAllByRole('columnheader').map((coluna) => coluna.textContent))
    .toEqual(['Sigla', 'Nome', 'Macroprocessos', 'Situação'])
  expect(contagemDaLinha('Setor Teste A')).toBe('2')
  expect(contagemDaLinha('Setor Teste B')).toBe('1')
  expect(contagemDaLinha('Setor Teste C')).toBe('0')
})

test('desativar um setor não muda a contagem dele (os vínculos continuam)', async () => {
  montar()
  const caixa = await screen.findByRole('checkbox', { name: 'Mostrar inativos' })
  fireEvent.click(caixa)
  expect(await screen.findByRole('button', { name: 'TSX' })).toBeTruthy()
  expect(contagemDaLinha('Setor Teste Extinto')).toBe('1')
})

test('a lista de macroprocessos mostra quantos setores cada um tem, inclusive nenhum', async () => {
  window.location.hash = '#/setores/macroprocessos'
  montar()
  await screen.findByRole('button', { name: 'Macro Teste Um' })
  expect(screen.getAllByRole('columnheader').map((coluna) => coluna.textContent))
    .toEqual(['Código', 'Nome', 'Categoria', 'Setores', 'Situação'])
  expect(contagemDoMacroprocesso('Macro Teste Um')).toBe('3')
  expect(contagemDoMacroprocesso('Macro Teste Dois')).toBe('1')
  expect(contagemDoMacroprocesso('Macro Teste Três')).toBe('0')
})

test('a Consulta vê as mesmas contagens', async () => {
  montar('consulta')
  await screen.findByRole('button', { name: 'TSA' })
  expect(contagemDaLinha('Setor Teste A')).toBe('2')
})
