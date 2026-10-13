import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { Macroprocesso } from './cadastros/tipos'

beforeEach(() => {
  window.location.hash = '#/setores/macroprocessos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MACROPROCESSOS: Macroprocesso[] = [
  { id: 'm1', codigo: 'MPT01', nome: 'Planejamento Inventado', descricao: null, categoria: 'apoio', ativo: true },
  { id: 'm2', codigo: 'MPT02', nome: 'Gestão Fictícia', descricao: null, categoria: null, ativo: true },
  { id: 'm3', codigo: 'MPT03', nome: 'Macroprocesso Extinto', descricao: null, categoria: null, ativo: false },
]

function montar() {
  const cadastros = new CadastrosFalso()
  cadastros.macroprocessos = [...MACROPROCESSOS]
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} />)
  return cadastros
}

async function abrir(nome: string) {
  fireEvent.click(await screen.findByRole('cell', { name: nome }))
}

test('Desativar grava na hora, sem confirmação, e o botão passa a ser Reativar', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
  expect(await screen.findByRole('button', { name: 'Reativar' })).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(cadastros.macroprocessos[0].ativo).toBe(false)
})

test('Reativar grava na hora e o botão volta a ser Desativar', async () => {
  const cadastros = montar()
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Mostrar inativos' }))
  await abrir('Macroprocesso Extinto')
  fireEvent.click(await screen.findByRole('button', { name: 'Reativar' }))
  expect(await screen.findByRole('button', { name: 'Desativar' })).toBeTruthy()
  expect(cadastros.macroprocessos[2].ativo).toBe(true)
})

test('depois de desativar e voltar à lista, o macroprocesso some da lista dos ativos', async () => {
  montar()
  await abrir('Planejamento Inventado')
  fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
  await screen.findByRole('button', { name: 'Reativar' })
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'Gestão Fictícia' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'Planejamento Inventado' })).toBeNull()
})

test('falha ao desativar mostra o motivo em vermelho e o macroprocesso continua ativo', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  await screen.findByRole('button', { name: 'Desativar' })
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe('A alteração não foi salva: erro inesperado do banco (falha simulada).')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect(screen.getByRole('button', { name: 'Desativar' })).toBeTruthy()
  expect(cadastros.macroprocessos[0].ativo).toBe(true)
})

test('Excluir abre a janela com o texto da spec e o foco no Cancelar', async () => {
  montar()
  await abrir('Planejamento Inventado')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  const janela = within(screen.getByRole('dialog', { name: 'Excluir o macroprocesso Planejamento Inventado?' }))
  expect(janela.getByText('O histórico guarda o que ele tinha, mas não é possível desfazer.')).toBeTruthy()
  expect(janela.getByRole('button', { name: 'Excluir macroprocesso' })).toBeTruthy()
  expect(document.activeElement).toBe(janela.getByRole('button', { name: 'Cancelar' }))
})

test('Cancelar e Esc fecham a janela sem excluir', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(cadastros.macroprocessos).toHaveLength(3)
})

test('confirmar a exclusão apaga o macroprocesso e volta à lista sem ele', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  fireEvent.click(screen.getByRole('button', { name: 'Excluir macroprocesso' }))
  expect(await screen.findByRole('cell', { name: 'Gestão Fictícia' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'Planejamento Inventado' })).toBeNull()
  expect(cadastros.macroprocessos.map((macroprocesso) => macroprocesso.id)).toEqual(['m2', 'm3'])
})

test('falha ao excluir mostra o motivo em vermelho e o macroprocesso continua', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  cadastros.falhaDeGravacao = new TravaDoBanco('Não é possível excluir: MPT01 tem 2 processos ligados.')
  fireEvent.click(screen.getByRole('button', { name: 'Excluir macroprocesso' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Não é possível excluir: MPT01 tem 2 processos ligados.')
  expect(screen.getByRole('form', { name: 'Macroprocesso Planejamento Inventado' })).toBeTruthy()
  expect(cadastros.macroprocessos).toHaveLength(3)
})

test('desativar um macroprocesso que já foi excluído por outra pessoa mostra o aviso próprio', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  await screen.findByRole('button', { name: 'Desativar' })
  cadastros.macroprocessos = cadastros.macroprocessos.filter((macroprocesso) => macroprocesso.id !== 'm1')
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Este cadastro não existe mais.')
  expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeTruthy()
})

test('excluir um macroprocesso que já foi excluído por outra pessoa mostra o aviso próprio', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  cadastros.macroprocessos = cadastros.macroprocessos.filter((macroprocesso) => macroprocesso.id !== 'm1')
  fireEvent.click(screen.getByRole('button', { name: 'Excluir macroprocesso' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Este cadastro não existe mais.')
})
