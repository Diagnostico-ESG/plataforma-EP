import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { Perfil } from './acesso/tipos'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import { ReunioesFalso } from './reunioes/ReunioesFalso'
import type { Setor } from './cadastros/tipos'
import { VersoesFalso } from './versoes/VersoesFalso'

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
]

function montar(perfil: Perfil = 'integrante_ep') {
  const cadastros = new CadastrosFalso()
  cadastros.setores = [...SETORES]
  render(<App acesso={AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil })} cadastros={cadastros} processos={new ProcessosFalso()} reunioes={new ReunioesFalso()} versoes={new VersoesFalso()} />)
  return cadastros
}

async function abrir(sigla: string) {
  fireEvent.click(await screen.findByRole('cell', { name: sigla }))
}

test('clicar na linha abre o setor com o formulário preenchido', async () => {
  montar()
  await abrir('CIT')
  expect(((await screen.findByLabelText('Nome')) as HTMLInputElement).value).toBe('Coordenação Inventada de Teste')
  expect((screen.getByLabelText('Sigla') as HTMLInputElement).value).toBe('CIT')
  expect((screen.getByLabelText('Observações') as HTMLTextAreaElement).value).toBe('Nota inventada')
})

test('editar grava nome, sigla em maiúsculas e observações, volta à lista e mostra o novo valor', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: ' Assessoria Renomeada de Teste ' } })
  fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: ' art ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByRole('cell', { name: 'ART' })).toBeTruthy()
  expect(cadastros.setores[0]).toMatchObject({ id: 's1', nome: 'Assessoria Renomeada de Teste', sigla: 'ART' })
})

test('sigla fora do formato não é enviada e o formulário continua aberto', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.change(await screen.findByLabelText('Sigla'), { target: { value: 'A_T' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Recebido: "A_T".')
  expect(cadastros.setores[0].sigla).toBe('AFT')
})

test('falha ao salvar mostra o motivo em vermelho e mantém o que foi digitado', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Outro Nome de Teste' } })
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe(
    'A alteração não foi salva: erro inesperado do banco (falha simulada). Seus dados continuam no formulário.')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Outro Nome de Teste')
})

test('recusa do banco aparece como veio, com o formulário mantido', async () => {
  const cadastros = montar()
  await abrir('AFT')
  await screen.findByLabelText('Nome')
  cadastros.falhaDeGravacao = new TravaDoBanco('Já existe um setor com a sigla CIT.')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Já existe um setor com a sigla CIT.')
  expect(screen.getByRole('form', { name: 'Setor AFT' })).toBeTruthy()
})

test('[Voltar à lista] volta sem gravar', async () => {
  const cadastros = montar()
  await abrir('AFT')
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Não gravar' } })
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'AFT' })).toBeTruthy()
  expect(cadastros.setores[0].nome).toBe('Assessoria Fictícia de Teste')
})

test('setor aberto que já foi excluído por outra pessoa: aviso e [Voltar à lista]', async () => {
  const cadastros = montar()
  await abrir('AFT')
  await screen.findByLabelText('Nome')
  cadastros.setores = cadastros.setores.filter((setor) => setor.id !== 's1')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico.')
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à lista' }))
  expect(await screen.findByRole('cell', { name: 'CIT' })).toBeTruthy()
  expect(screen.queryByRole('cell', { name: 'AFT' })).toBeNull()
})

test('abrir um setor que não existe mais (a leitura devolve nada) mostra o mesmo aviso', async () => {
  const cadastros = montar()
  const lerOriginal = cadastros.lerSetor.bind(cadastros)
  cadastros.lerSetor = async (id) => (id === 's1' ? null : lerOriginal(id))
  await abrir('AFT')
  expect((await screen.findByRole('alert')).textContent).toContain('Este cadastro não existe mais.')
})

test('erro ao ler o setor: mensagem e [Tentar de novo]', async () => {
  const cadastros = montar()
  let falhar = true
  const lerOriginal = cadastros.lerSetor.bind(cadastros)
  cadastros.lerSetor = async (id) => {
    if (falhar) throw new Error('falha simulada')
    return lerOriginal(id)
  }
  await abrir('AFT')
  expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível carregar o setor.')
  falhar = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByLabelText('Nome')).toBeTruthy()
})

test('a Consulta vê os dados sem campo editável e sem botões de alteração', async () => {
  montar('consulta')
  await abrir('CIT')
  expect(await screen.findByText('Coordenação Inventada de Teste')).toBeTruthy()
  expect(screen.getByText('Nota inventada')).toBeTruthy()
  expect(screen.queryByRole('textbox')).toBeNull()
  for (const nome of ['Salvar', 'Desativar', 'Reativar', 'Excluir']) {
    expect(screen.queryByRole('button', { name: nome })).toBeNull()
  }
  expect(screen.getByRole('button', { name: 'Voltar à lista' })).toBeTruthy()
})
