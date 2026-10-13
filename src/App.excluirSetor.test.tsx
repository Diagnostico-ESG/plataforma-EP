import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import type { Setor } from './cadastros/tipos'

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

function montar() {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [...SETORES]
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} />)
  return cadastros
}

async function abrir(sigla: string) {
  fireEvent.click(await screen.findByRole('cell', { name: sigla }))
}

test('Desativar grava na hora, sem confirmação, e o botão passa a ser Reativar', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
  expect(await screen.findByRole('button', { name: 'Reativar' })).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(cadastros.setores[0].ativo).toBe(false)
})

test('Reativar grava na hora e o botão volta a ser Desativar', async () => {
  const cadastros = montar()
  fireEvent.click(await screen.findByRole('checkbox', { name: 'Mostrar inativos' }))
  await abrir('EXT')
  fireEvent.click(await screen.findByRole('button', { name: 'Reativar' }))
  expect(await screen.findByRole('button', { name: 'Desativar' })).toBeTruthy()
  expect(cadastros.setores[2].ativo).toBe(true)
})

test('depois de desativar e voltar à lista, o setor some da lista dos ativos', async () => {
  montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Desativar' }))
  await screen.findByRole('button', { name: 'Reativar' })
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'CIT' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'AFT' })).toBeNull()
})

test('falha ao desativar mostra o motivo em vermelho e o setor continua ativo', async () => {
  const cadastros = montar()
  await abrir('AFT')
  await screen.findByRole('button', { name: 'Desativar' })
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe('A alteração não foi salva: erro inesperado do banco (falha simulada).')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect(screen.getByRole('button', { name: 'Desativar' })).toBeTruthy()
  expect(cadastros.setores[0].ativo).toBe(true)
})

test('Excluir abre a janela com o texto da spec e o foco no Cancelar', async () => {
  montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  const janela = within(screen.getByRole('dialog', { name: 'Excluir o setor AFT?' }))
  expect(janela.getByText('O histórico guarda o que ele tinha, mas não é possível desfazer.')).toBeTruthy()
  expect(janela.getByRole('button', { name: 'Excluir setor' })).toBeTruthy()
  expect(document.activeElement).toBe(janela.getByRole('button', { name: 'Cancelar' }))
})

test('Cancelar e Esc fecham a janela sem excluir', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
  act(() => (screen.getByRole('dialog') as HTMLDialogElement).close())
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(cadastros.setores).toHaveLength(3)
})

test('confirmar a exclusão apaga o setor e volta à lista sem ele', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  fireEvent.click(screen.getByRole('button', { name: 'Excluir setor' }))
  expect(await screen.findByRole('cell', { name: 'CIT' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'AFT' })).toBeNull()
  expect(cadastros.setores.map((setor) => setor.id)).toEqual(['s2', 's3'])
})

test('falha ao excluir mostra o motivo em vermelho e o setor continua', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  cadastros.falhaDeGravacao = new TravaDoBanco('Não é possível excluir: AFT tem 2 processos ligados.')
  fireEvent.click(screen.getByRole('button', { name: 'Excluir setor' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Não é possível excluir: AFT tem 2 processos ligados.')
  expect(screen.getByRole('form', { name: 'Setor AFT' })).toBeTruthy()
  expect(cadastros.setores).toHaveLength(3)
})

test('desativar um setor que já foi excluído por outra pessoa mostra o aviso próprio', async () => {
  const cadastros = montar()
  await abrir('AFT')
  await screen.findByRole('button', { name: 'Desativar' })
  cadastros.setores = cadastros.setores.filter((setor) => setor.id !== 's1')
  fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Este cadastro não existe mais.')
  expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeTruthy()
})

test('excluir um setor que já foi excluído por outra pessoa mostra o aviso próprio', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }))
  cadastros.setores = cadastros.setores.filter((setor) => setor.id !== 's1')
  fireEvent.click(screen.getByRole('button', { name: 'Excluir setor' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Este cadastro não existe mais.')
})
