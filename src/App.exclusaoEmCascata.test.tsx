import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const FRASE_FINAL = 'O histórico guarda o que ele tinha, mas não é possível desfazer.'

// TSA participa de três macroprocessos, TSB de um e TSC de nenhum; M1 tem dois setores, M2 e M3 um, M4 nenhum.
function montar(hash: string) {
  window.location.hash = hash
  const cadastros = new CadastrosFalso()
  cadastros.setores = [
    { id: 's1', sigla: 'TSA', nome: 'Setor Teste A', observacoes: null, ativo: true },
    { id: 's2', sigla: 'TSB', nome: 'Setor Teste B', observacoes: null, ativo: true },
    { id: 's3', sigla: 'TSC', nome: 'Setor Teste C', observacoes: null, ativo: true },
  ]
  cadastros.macroprocessos = [
    { id: 'm1', codigo: 'MT01', nome: 'Macro Teste Um', descricao: null, categoria: null, ativo: true },
    { id: 'm2', codigo: 'MT02', nome: 'Macro Teste Dois', descricao: null, categoria: null, ativo: true },
    { id: 'm3', codigo: 'MT03', nome: 'Macro Teste Três', descricao: null, categoria: null, ativo: true },
    { id: 'm4', codigo: 'MT04', nome: 'Macro Teste Quatro', descricao: null, categoria: null, ativo: true },
  ]
  cadastros.vinculos = [
    { macroprocessoId: 'm1', setorId: 's1', observacao: null },
    { macroprocessoId: 'm2', setorId: 's1', observacao: null },
    { macroprocessoId: 'm3', setorId: 's1', observacao: null },
    { macroprocessoId: 'm1', setorId: 's2', observacao: null },
  ]
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} />)
  return cadastros
}

async function abrirEExcluir(nome: string) {
  fireEvent.click(await screen.findByRole('cell', { name: nome }))
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  return within(screen.getByRole('dialog'))
}

beforeEach(() => {
  window.location.hash = '#/setores'
})

test('a janela de exclusão do setor diz de quantos macroprocessos ele sai', async () => {
  montar('#/setores')
  const janela = await abrirEExcluir('Setor Teste A')
  expect(janela.getByText(`TSA sai de 3 macroprocessos. ${FRASE_FINAL}`)).toBeTruthy()
  expect(screen.getByRole('dialog', { name: 'Excluir o setor TSA?' })).toBeTruthy()
})

test('com um macroprocesso a janela do setor usa o singular', async () => {
  montar('#/setores')
  expect((await abrirEExcluir('Setor Teste B')).getByText(`TSB sai de 1 macroprocesso. ${FRASE_FINAL}`)).toBeTruthy()
})

test('setor sem vínculos: a janela começa pelo histórico', async () => {
  montar('#/setores')
  expect((await abrirEExcluir('Setor Teste C')).getByText(FRASE_FINAL)).toBeTruthy()
})

test('a janela de exclusão do macroprocesso diz quantos setores deixam de estar envolvidos', async () => {
  montar('#/setores/macroprocessos')
  const janela = await abrirEExcluir('Macro Teste Um')
  expect(janela.getByText(`2 setores deixam de estar envolvidos nele. ${FRASE_FINAL}`)).toBeTruthy()
  expect(screen.getByRole('dialog', { name: 'Excluir o macroprocesso Macro Teste Um?' })).toBeTruthy()
})

test('com um setor a janela do macroprocesso usa o singular', async () => {
  montar('#/setores/macroprocessos')
  const janela = await abrirEExcluir('Macro Teste Dois')
  expect(janela.getByText(`1 setor deixa de estar envolvido nele. ${FRASE_FINAL}`)).toBeTruthy()
})

test('macroprocesso sem setores: a janela começa pelo histórico', async () => {
  montar('#/setores/macroprocessos')
  expect((await abrirEExcluir('Macro Teste Quatro')).getByText(FRASE_FINAL)).toBeTruthy()
})

test('confirmar a exclusão do setor também o tira dos macroprocessos', async () => {
  const cadastros = montar('#/setores')
  const janela = await abrirEExcluir('Setor Teste A')
  fireEvent.click(janela.getByRole('button', { name: 'Excluir setor' }))
  expect(await screen.findByRole('cell', { name: 'Setor Teste B' })).toBeTruthy()
  expect(cadastros.vinculos.map((v) => v.setorId)).toEqual(['s2'])
  expect(screen.getByRole('cell', { name: 'Setor Teste B' }).closest('tr')?.textContent).toContain('1')
})

test('confirmar a exclusão do macroprocesso o tira de todos os setores', async () => {
  const cadastros = montar('#/setores/macroprocessos')
  const janela = await abrirEExcluir('Macro Teste Um')
  fireEvent.click(janela.getByRole('button', { name: 'Excluir macroprocesso' }))
  expect(await screen.findByRole('cell', { name: 'Macro Teste Dois' })).toBeTruthy()
  expect(cadastros.vinculos.map((v) => v.macroprocessoId)).toEqual(['m2', 'm3'])
})

test('Cancelar e Esc fecham a janela sem excluir nem tirar vínculo', async () => {
  const cadastros = montar('#/setores')
  const janela = await abrirEExcluir('Setor Teste A')
  fireEvent.click(janela.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(cadastros.setores).toHaveLength(3)
  expect(cadastros.vinculos).toHaveLength(4)
})
