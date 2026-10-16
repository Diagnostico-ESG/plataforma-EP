import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/setores/macroprocessos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

type Campos = { codigo?: string; nome: string; descricao?: string; categoria?: string }

async function abrirFormulario(cadastros = new CadastrosFalso()) {
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Novo macroprocesso' }))
  return cadastros
}

function preencher({ codigo = '', nome, descricao = '', categoria = '' }: Campos) {
  fireEvent.change(screen.getByLabelText('Código'), { target: { value: codigo } })
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: nome } })
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: descricao } })
  fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: categoria } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

test('o formulário tem código, nome, descrição e categoria, que começa em "Sem categoria"', async () => {
  await abrirFormulario()
  const formulario = within(screen.getByRole('form', { name: 'Novo macroprocesso' }))
  expect(['Código', 'Nome', 'Descrição', 'Categoria'].every((rotulo) => formulario.getByLabelText(rotulo))).toBe(true)
  const categoria = screen.getByLabelText('Categoria') as HTMLSelectElement
  expect([...categoria.options].map((opcao) => opcao.textContent))
    .toEqual(['Sem categoria', 'Finalístico', 'Apoio', 'Gerencial'])
  expect(categoria.selectedOptions[0].textContent).toBe('Sem categoria')
})

test('só o nome é obrigatório: grava os outros campos como vazios e o item entra na lista', async () => {
  const cadastros = await abrirFormulario()
  preencher({ nome: ' Planejamento Inventado ' })
  expect(await screen.findByRole('cell', { name: 'Planejamento Inventado' })).toBeTruthy()
  expect(cadastros.macroprocessos).toMatchObject([
    { codigo: null, nome: 'Planejamento Inventado', descricao: null, categoria: null },
  ])
  expect(screen.queryByRole('form', { name: 'Novo macroprocesso' })).toBeNull()
})

test('grava código, descrição e categoria quando preenchidos', async () => {
  const cadastros = await abrirFormulario()
  preencher({ codigo: ' MPT05 ', nome: 'Gestão Inventada', descricao: 'Descrição inventada', categoria: 'gerencial' })
  expect(await screen.findByRole('cell', { name: 'Gestão Inventada' })).toBeTruthy()
  expect(cadastros.macroprocessos).toMatchObject([
    { codigo: 'MPT05', nome: 'Gestão Inventada', descricao: 'Descrição inventada', categoria: 'gerencial' },
  ])
})

test('nome vazio não é enviado', async () => {
  const cadastros = await abrirFormulario()
  preencher({ nome: '  ', codigo: 'MPT05' })
  expect((await screen.findByRole('alert')).textContent).toBe('O nome do macroprocesso é obrigatório.')
  expect(cadastros.macroprocessos).toEqual([])
})

test('falha de gravação mostra o motivo em vermelho e mantém os dados no formulário', async () => {
  const cadastros = new CadastrosFalso()
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  await abrirFormulario(cadastros)
  preencher({ codigo: 'MPT05', nome: 'Gestão Inventada', descricao: 'Descrição inventada', categoria: 'apoio' })
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe(
    'A alteração não foi salva: erro inesperado do banco (falha simulada). Seus dados continuam no formulário.')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect((screen.getByLabelText('Código') as HTMLInputElement).value).toBe('MPT05')
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Gestão Inventada')
  expect((screen.getByLabelText('Descrição') as HTMLTextAreaElement).value).toBe('Descrição inventada')
  expect((screen.getByLabelText('Categoria') as HTMLSelectElement).value).toBe('apoio')
})

test.each([
  'Já existe um macroprocesso com o nome Gestão Inventada.',
  'Já existe um macroprocesso com o código MPT05.',
  'Seu perfil não permite alterar os cadastros.',
])('a recusa do banco "%s" aparece como veio, com o formulário mantido', async (frase) => {
  const cadastros = new CadastrosFalso()
  cadastros.falhaDeGravacao = new TravaDoBanco(frase)
  await abrirFormulario(cadastros)
  preencher({ codigo: 'MPT05', nome: 'Gestão Inventada' })
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe(frase)
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect((screen.getByLabelText('Código') as HTMLInputElement).value).toBe('MPT05')
})

test('Cancelar fecha o formulário sem gravar', async () => {
  const cadastros = await abrirFormulario()
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Gestão Inventada' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('form', { name: 'Novo macroprocesso' })).toBeNull()
  expect(cadastros.macroprocessos).toEqual([])
})
