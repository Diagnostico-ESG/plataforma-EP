import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from './App'
import { AcessoFalso, USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import { TravaDoBanco } from './acesso/falhasDeGravacao'
import type { LinhaDeUsuario, Perfil } from './acesso/tipos'

beforeEach(() => {
  window.location.hash = '#/administracao'
})
afterEach(() => {
  cleanup()
  window.location.hash = ''
})

const ANA = 'ana.teste@ccivil.pr.gov.br'
const BETO = 'beto.teste@ccivil.pr.gov.br'
const AGUARDANDO = 'nova.teste@ccivil.pr.gov.br'
const LINHAS: LinhaDeUsuario[] = [
  { chave: AGUARDANDO, nome: null, email: AGUARDANDO, fotoUrl: null, perfil: 'consulta', situacao: 'aguardando' },
  { chave: 'u-ana', nome: 'Ana Teste', email: ANA, fotoUrl: null, perfil: 'consulta', situacao: 'ativo' },
  { chave: 'u-beto', nome: 'Beto Teste', email: BETO, fotoUrl: null, perfil: 'integrante_ep', situacao: 'inativo' },
]

async function abrirComoAdministrador() {
  const acesso = AcessoFalso.logadoComo({ ...USUARIO_DE_TESTE, perfil: 'administrador' as Perfil })
  acesso.linhas = [...LINHAS]
  render(<App acesso={acesso} />)
  await screen.findByRole('table', { busy: false })
  return acesso
}

function linhaDe(email: string) {
  return within(screen.getByText(email).closest('tr') as HTMLElement)
}

function perfilNaTela(email: string) {
  return (screen.getByLabelText(`Perfil de ${email}`) as HTMLSelectElement).value
}

test('cada linha mostra as ações da sua situação; quem já entrou não tem Excluir', async () => {
  await abrirComoAdministrador()
  expect(linhaDe(ANA).getByRole('button', { name: `Desativar ${ANA}` })).toBeTruthy()
  expect(linhaDe(ANA).getByRole('button', { name: `Corrigir nome de ${ANA}` })).toBeTruthy()
  expect(linhaDe(ANA).queryByRole('button', { name: /Reativar|Excluir/ })).toBeNull()
  expect(linhaDe(BETO).getByRole('button', { name: `Reativar ${BETO}` })).toBeTruthy()
  expect(linhaDe(BETO).queryByRole('button', { name: /Desativar|Excluir/ })).toBeNull()
  expect(linhaDe(AGUARDANDO).getByRole('button', { name: `Excluir autorização de ${AGUARDANDO}` })).toBeTruthy()
  expect(linhaDe(AGUARDANDO).queryByRole('button', { name: /Desativar|Reativar|Corrigir/ })).toBeNull()
})

test('muda o perfil de um usuário', async () => {
  const acesso = await abrirComoAdministrador()
  fireEvent.change(screen.getByLabelText(`Perfil de ${ANA}`), { target: { value: 'integrante_ep' } })
  await waitFor(() => expect(acesso.linhas.find((linha) => linha.email === ANA)?.perfil).toBe('integrante_ep'))
  await waitFor(() => expect(perfilNaTela(ANA)).toBe('integrante_ep'))
})

test('trava: mudar o próprio perfil mostra a regra e mantém o perfil', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = new TravaDoBanco('Você não pode mudar o seu próprio perfil.')
  fireEvent.change(screen.getByLabelText(`Perfil de ${ANA}`), { target: { value: 'administrador' } })
  expect(await screen.findByText('Você não pode mudar o seu próprio perfil.')).toBeTruthy()
  expect(perfilNaTela(ANA)).toBe('consulta')
})

test('desativa um usuário ativo', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  expect(await screen.findByRole('button', { name: `Reativar ${ANA}` })).toBeTruthy()
  expect(linhaDe(ANA).getByText('Inativo')).toBeTruthy()
})

test('trava: desativar a si mesmo mostra a regra e mantém a linha', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = new TravaDoBanco('Você não pode desativar a si mesmo.')
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  expect(await screen.findByText('Você não pode desativar a si mesmo.')).toBeTruthy()
  expect(screen.getByRole('button', { name: `Desativar ${ANA}` })).toBeTruthy()
})

test('trava: último administrador ativo mostra a regra com o nome', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = new TravaDoBanco('Não é possível: Ana Teste é o último administrador ativo.')
  fireEvent.click(screen.getByRole('button', { name: `Desativar ${ANA}` }))
  expect(await screen.findByText('Não é possível: Ana Teste é o último administrador ativo.')).toBeTruthy()
})

test('reativa um usuário inativo', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  expect(await screen.findByRole('button', { name: `Desativar ${BETO}` })).toBeTruthy()
  expect(linhaDe(BETO).getByText('Ativo')).toBeTruthy()
})

test('falha ao reativar mostra o motivo e mantém a linha', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'seu perfil não permite esta alteração'
  fireEvent.click(screen.getByRole('button', { name: `Reativar ${BETO}` }))
  expect(await screen.findByText('A alteração não foi salva: seu perfil não permite esta alteração.')).toBeTruthy()
  expect(screen.getByRole('button', { name: `Reativar ${BETO}` })).toBeTruthy()
})

test('corrige o nome de um usuário', async () => {
  const acesso = await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  const campo = screen.getByLabelText(`Nome de ${ANA}`) as HTMLInputElement
  expect(campo.value).toBe('Ana Teste')
  fireEvent.change(campo, { target: { value: '  Ana Corrigida ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('Ana Corrigida')).toBeTruthy()
  expect(screen.queryByLabelText(`Nome de ${ANA}`)).toBeNull()
  expect(acesso.linhas.find((linha) => linha.email === ANA)?.nome).toBe('Ana Corrigida')
})

test('falha ao corrigir o nome mostra o motivo e mantém o que foi digitado', async () => {
  const acesso = await abrirComoAdministrador()
  acesso.falhaDeGravacao = 'erro inesperado do banco (Failed to fetch)'
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  fireEvent.change(screen.getByLabelText(`Nome de ${ANA}`), { target: { value: 'Ana Corrigida' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('A alteração não foi salva: erro inesperado do banco (Failed to fetch). '
    + 'Seus dados continuam no formulário.')).toBeTruthy()
  expect((screen.getByLabelText(`Nome de ${ANA}`) as HTMLInputElement).value).toBe('Ana Corrigida')
})

test('cancelar a correção volta ao nome sem gravar', async () => {
  const acesso = await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  fireEvent.change(screen.getByLabelText(`Nome de ${ANA}`), { target: { value: 'Outro Nome' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(screen.getByText('Ana Teste')).toBeTruthy()
  expect(acesso.linhas.find((linha) => linha.email === ANA)?.nome).toBe('Ana Teste')
})

test('Salvar fica desligado com o nome vazio', async () => {
  await abrirComoAdministrador()
  fireEvent.click(screen.getByRole('button', { name: `Corrigir nome de ${ANA}` }))
  fireEvent.change(screen.getByLabelText(`Nome de ${ANA}`), { target: { value: '   ' } })
  expect((screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(true)
})
