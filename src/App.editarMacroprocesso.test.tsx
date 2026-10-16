import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import type { Macroprocesso } from './cadastros/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/setores/macroprocessos'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const MACROPROCESSOS: Macroprocesso[] = [
  { id: 'm1', codigo: 'MPT01', nome: 'Planejamento Inventado', descricao: 'Descrição inventada', categoria: 'apoio', ativo: true },
  { id: 'm2', codigo: null, nome: 'Gestão Fictícia', descricao: null, categoria: null, ativo: true },
]

function montar(perfil: Perfil = 'integrante_ep') {
  const cadastros = new CadastrosFalso()
  cadastros.macroprocessos = [...MACROPROCESSOS]
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  return cadastros
}

async function abrir(nome: string) {
  fireEvent.click(await screen.findByRole('cell', { name: nome }))
}

test('clicar na linha abre o macroprocesso com o formulário preenchido', async () => {
  montar()
  await abrir('Planejamento Inventado')
  expect(((await screen.findByLabelText('Código')) as HTMLInputElement).value).toBe('MPT01')
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Planejamento Inventado')
  expect((screen.getByLabelText('Descrição') as HTMLTextAreaElement).value).toBe('Descrição inventada')
  expect((screen.getByLabelText('Categoria') as HTMLSelectElement).value).toBe('apoio')
})

test('um macroprocesso sem código nem categoria abre com o código vazio e "Sem categoria"', async () => {
  montar()
  await abrir('Gestão Fictícia')
  expect(((await screen.findByLabelText('Código')) as HTMLInputElement).value).toBe('')
  expect((screen.getByLabelText('Categoria') as HTMLSelectElement).selectedOptions[0].textContent).toBe('Sem categoria')
})

test('editar qualquer campo, inclusive o nome, grava, volta à lista e mostra o novo valor', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: ' Planejamento Renomeado ' } })
  fireEvent.change(screen.getByLabelText('Código'), { target: { value: ' MPT09 ' } })
  fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'finalistico' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByRole('cell', { name: 'Planejamento Renomeado' })).toBeTruthy()
  expect(cadastros.macroprocessos[0]).toMatchObject(
    { id: 'm1', nome: 'Planejamento Renomeado', codigo: 'MPT09', categoria: 'finalistico' })
})

test('esvaziar o código e a categoria grava nulo', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.change(await screen.findByLabelText('Código'), { target: { value: '' } })
  fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await screen.findByRole('cell', { name: 'Planejamento Inventado' })
  expect(cadastros.macroprocessos[0]).toMatchObject({ codigo: null, categoria: null })
})

test('nome vazio não é enviado e o formulário continua aberto', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: '  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toBe('O nome do macroprocesso é obrigatório.')
  expect(cadastros.macroprocessos[0].nome).toBe('Planejamento Inventado')
})

test('falha ao salvar mostra o motivo em vermelho e mantém o que foi digitado', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Outro Nome Inventado' } })
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe(
    'A alteração não foi salva: erro inesperado do banco (falha simulada). Seus dados continuam no formulário.')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Outro Nome Inventado')
})

test.each([
  'Já existe um macroprocesso com o nome Gestão Fictícia.',
  'Já existe um macroprocesso com o código MPT01.',
])('a recusa do banco "%s" aparece como veio, com o formulário mantido', async (frase) => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  await screen.findByLabelText('Nome')
  cadastros.falhaDeGravacao = new TravaDoBanco(frase)
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toBe(frase)
  expect(screen.getByRole('form', { name: 'Macroprocesso Planejamento Inventado' })).toBeTruthy()
})

test('[Voltar à lista] volta sem gravar', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Não gravar' } })
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'Planejamento Inventado' })).toBeTruthy()
  expect(cadastros.macroprocessos[0].nome).toBe('Planejamento Inventado')
})

test('macroprocesso excluído por outra pessoa durante a edição: aviso e [Voltar à lista]', async () => {
  const cadastros = montar()
  await abrir('Planejamento Inventado')
  await screen.findByLabelText('Nome')
  cadastros.macroprocessos = cadastros.macroprocessos.filter((macroprocesso) => macroprocesso.id !== 'm1')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico.')
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'Gestão Fictícia' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'Planejamento Inventado' })).toBeNull()
})

test('abrir um macroprocesso que não existe mais (a leitura devolve nada) mostra o mesmo aviso', async () => {
  const cadastros = montar()
  const lerOriginal = cadastros.lerMacroprocesso.bind(cadastros)
  cadastros.lerMacroprocesso = async (id) => (id === 'm1' ? null : lerOriginal(id))
  await abrir('Planejamento Inventado')
  expect((await screen.findByRole('alert')).textContent).toContain('Este cadastro não existe mais.')
})

test('enquanto lê o macroprocesso, mostra "Carregando macroprocesso…"', async () => {
  const cadastros = montar()
  cadastros.lerMacroprocesso = () => new Promise<never>(() => {})
  await abrir('Planejamento Inventado')
  expect(await screen.findByText('Carregando macroprocesso…')).toBeTruthy()
})

test('erro ao ler o macroprocesso: mensagem e [Tentar de novo]', async () => {
  const cadastros = montar()
  let falhar = true
  const lerOriginal = cadastros.lerMacroprocesso.bind(cadastros)
  cadastros.lerMacroprocesso = async (id) => {
    if (falhar) throw new Error('falha simulada')
    return lerOriginal(id)
  }
  await abrir('Planejamento Inventado')
  expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível carregar o macroprocesso.')
  falhar = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByLabelText('Nome')).toBeTruthy()
})

test('a Consulta vê os dados sem campo editável e sem botões de alteração', async () => {
  montar('consulta')
  await abrir('Planejamento Inventado')
  expect(await screen.findByText('MPT01')).toBeTruthy()
  expect(screen.getByText('Descrição inventada')).toBeTruthy()
  expect(screen.getByText('Apoio')).toBeTruthy()
  expect(screen.queryByRole('textbox')).toBeNull()
  expect(screen.queryByRole('combobox')).toBeNull()
  for (const nome of ['Salvar', 'Desativar', 'Reativar', 'Excluir']) {
    expect(screen.queryByRole('button', { name: nome })).toBeNull()
  }
  expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeTruthy()
})
