import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

// TSA participa de três macroprocessos (um sem código, um inativo); TSB, de nenhum.
function montar(perfil: Perfil = 'integrante_ep') {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true },
    { id: 's2', sigla: 'TSB', nome: 'Setor Teste B', observacoes: null, ativo: true },
  ]
  cadastros.macroprocessos = [
    { id: 'm1', codigo: 'MT01', nome: 'Macro Teste Um', descricao: null, categoria: null, ativo: true },
    { id: 'm2', codigo: null, nome: 'Macro Sem Código', descricao: null, categoria: null, ativo: true },
    { id: 'm3', codigo: 'MT03', nome: 'Macro Teste Extinto', descricao: null, categoria: null, ativo: false },
  ]
  cadastros.vinculos = [
    { macroprocessoId: 'm2', setorId: 's1', observacao: null },
    { macroprocessoId: 'm3', setorId: 's1', observacao: 'Papel no extinto' },
    { macroprocessoId: 'm1', setorId: 's1', observacao: 'Papel no um' },
  ]
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  return cadastros
}

async function abrirSecao(nome: string) {
  fireEvent.click(await screen.findByRole('cell', { name: nome }))
  return within(await screen.findByRole('region', { name: 'Macroprocessos em que participa' }))
}

test('lista código, nome e observação dos macroprocessos do setor, na ordem da lista de macroprocessos', async () => {
  montar()
  const secao = await abrirSecao('Setor Teste A')
  expect(secao.getAllByRole('columnheader').map((coluna) => coluna.textContent))
    .toEqual(['Código', 'Nome', 'Observação'])
  expect(secao.getAllByRole('row').slice(1).map((linha) => linha.textContent)).toEqual([
    'MT01Macro Teste UmPapel no um',
    'MT03Macro Teste ExtintoPapel no extinto',
    '—Macro Sem Código—',
  ])
})

test('a seção é só leitura: sem botão nem campo editável', async () => {
  montar()
  const secao = await abrirSecao('Setor Teste A')
  expect(secao.queryByRole('button')).toBeNull()
  expect(secao.queryByRole('textbox')).toBeNull()
  expect(secao.queryByRole('combobox')).toBeNull()
})

test('setor sem vínculos mostra "Este setor ainda não participa de nenhum macroprocesso."', async () => {
  montar()
  const secao = await abrirSecao('Setor Teste B')
  expect(secao.getByText('Este setor ainda não participa de nenhum macroprocesso.')).toBeTruthy()
})

test('a Consulta vê a mesma seção, também sem vínculos', async () => {
  montar('consulta')
  const secao = await abrirSecao('Setor Teste A')
  expect(secao.getByText('Macro Teste Um')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect((await abrirSecao('Setor Teste B')).getByText('Este setor ainda não participa de nenhum macroprocesso.')).toBeTruthy()
})
