import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import { CadastrosFalso } from './cadastros/CadastrosFalso'
import { ProcessosFalso } from './processos/ProcessosFalso'
import css from './components/cadastros/Cadastros.css?raw'
import { regrasDaClasse } from './testes/regrasDaClasse'
import { VersoesFalso } from './versoes/VersoesFalso'

beforeEach(() => {
  window.location.hash = '#/setores'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

async function abrirFormulario(cadastros = new CadastrosFalso()) {
  render(<App acesso={AcessoFalso.logadoComo()} cadastros={cadastros} processos={new ProcessosFalso()} versoes={new VersoesFalso()} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Novo setor' }))
  return cadastros
}

function preencher(nome: string, sigla: string, observacoes = '') {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: nome } })
  fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: sigla } })
  fireEvent.change(screen.getByLabelText('Observações'), { target: { value: observacoes } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

test('cadastra o setor com nome sem espaços nas pontas e sigla em maiúsculas, e ele entra na lista', async () => {
  const cadastros = await abrirFormulario()
  preencher(' Núcleo Fictício de Teste ', ' nft ', 'Nota inventada')
  expect(await screen.findByRole('cell', { name: 'NFT' })).toBeTruthy()
  expect(cadastros.setores).toMatchObject([{ nome: 'Núcleo Fictício de Teste', sigla: 'NFT', observacoes: 'Nota inventada' }])
  expect(screen.queryByRole('form', { name: 'Novo setor' })).toBeNull()
})

test('observações em branco são gravadas como vazias', async () => {
  const cadastros = await abrirFormulario()
  preencher('Núcleo Fictício de Teste', 'NFT')
  await screen.findByRole('cell', { name: 'NFT' })
  expect(cadastros.setores[0].observacoes).toBeNull()
})

test('sigla fora do formato não é enviada e a mensagem mostra o valor recebido', async () => {
  const cadastros = await abrirFormulario()
  preencher('Núcleo Fictício de Teste', 'C E')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A sigla deve ter de 2 a 15 caracteres, só letras sem acento, números ou hífen. Recebido: "C E".')
  expect(cadastros.setores).toEqual([])
})

test('nome vazio não é enviado', async () => {
  const cadastros = await abrirFormulario()
  preencher('  ', 'NFT')
  expect((await screen.findByRole('alert')).textContent).toBe('O nome do setor é obrigatório.')
  expect(cadastros.setores).toEqual([])
})

test('falha de gravação mostra o motivo em vermelho e mantém os dados no formulário', async () => {
  const cadastros = new CadastrosFalso()
  cadastros.falhaDeGravacao = 'erro inesperado do banco (falha simulada)'
  await abrirFormulario(cadastros)
  preencher('Núcleo Fictício de Teste', 'NFT', 'Nota inventada')
  const aviso = await screen.findByRole('alert')
  expect(aviso.textContent).toBe(
    'A alteração não foi salva: erro inesperado do banco (falha simulada). Seus dados continuam no formulário.')
  expect(aviso.classList.contains('cadastros-falha')).toBe(true)
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Núcleo Fictício de Teste')
  expect((screen.getByLabelText('Sigla') as HTMLInputElement).value).toBe('NFT')
  expect((screen.getByLabelText('Observações') as HTMLTextAreaElement).value).toBe('Nota inventada')
})

test.each([
  'Já existe um setor com a sigla NFT.',
  'Já existe um setor com o nome Núcleo Fictício de Teste.',
  'Seu perfil não permite alterar os cadastros.',
])('a recusa do banco "%s" aparece como veio, com o formulário mantido', async (frase) => {
  const cadastros = new CadastrosFalso()
  cadastros.falhaDeGravacao = new TravaDoBanco(frase)
  await abrirFormulario(cadastros)
  preencher('Núcleo Fictício de Teste', 'NFT')
  expect((await screen.findByRole('alert')).textContent).toBe(frase)
  expect((screen.getByLabelText('Sigla') as HTMLInputElement).value).toBe('NFT')
})

test('Cancelar fecha o formulário sem gravar', async () => {
  const cadastros = await abrirFormulario()
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Núcleo Fictício de Teste' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.queryByRole('form', { name: 'Novo setor' })).toBeNull()
  expect(cadastros.setores).toEqual([])
})

test('as mensagens de falha e de erro de carregamento são vermelhas no CSS', () => {
  expect(regrasDaClasse(css, '.cadastros-falha')).toContain('var(--atraso-fundo)')
  expect(regrasDaClasse(css, '.cadastros-erro')).toContain('var(--atraso-fundo)')
})
